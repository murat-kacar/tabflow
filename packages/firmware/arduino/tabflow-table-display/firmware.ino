/*
 * TabFlow ESP32 table display firmware.
 *
 * - Connects to the tenant API over WSS.
 * - Authenticates with the table device key.
 * - Draws backend-provided qr_side + qr_bits_hex directly.
 * - Does not generate QR codes on-device.
 *
 * Required Arduino libraries:
 * - Adafruit GFX Library
 * - Adafruit ST7735 and ST7789 Library
 * - WebSockets by Markus Sattler
 * - ArduinoJson
 */

#include <WiFi.h>
#include <SPI.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <time.h>
#include "config.h"

static const uint16_t SCREEN_W = 128;
static const uint16_t SCREEN_H = 160;
static const uint16_t HEADER_H = 20;
static const uint16_t FOOTER_H = 18;
static const uint16_t FOOTER_Y = SCREEN_H - FOOTER_H;
static const uint16_t QR_BOX = 116;
static const uint16_t QR_X = (SCREEN_W - QR_BOX) / 2;
static const uint16_t QR_Y = HEADER_H + 3;

static const uint16_t COLOR_BG = ST77XX_BLACK;
static const uint16_t COLOR_HEADER = 0x1082;
static const uint16_t COLOR_TEXT = ST77XX_WHITE;
static const uint16_t COLOR_SOFT = 0xBDF7;
static const uint16_t COLOR_BAR_EMPTY = 0x2104;
static const uint16_t COLOR_OK = 0x07E0;

Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS_PIN, TFT_DC_PIN, TFT_RST_PIN);
WebSocketsClient ws;

String active_url = "";
bool wifi_connected = false;
bool ws_connected = false;
bool ws_auth_ok = false;
bool token_ready = false;
bool redraw_requested = false;
bool token_received_once = false;
bool ntp_ready = false;

uint32_t token_received_ms = 0;
uint32_t token_duration_ms = TOKEN_DURATION_MS;
uint32_t last_ws_attempt_ms = 0;
uint32_t last_ping_ms = 0;
uint32_t last_bar_ms = 0;
uint32_t last_heartbeat_ms = 0;
uint32_t last_auth_attempt_ms = 0;
uint32_t last_network_diagnostic_ms = 0;

static const size_t QR_BITS_MAX_BYTES = 4096;
uint8_t qr_bits[QR_BITS_MAX_BYTES];
size_t qr_bits_len = 0;
uint16_t qr_side = 0;
bool qr_valid = false;

void logLine(const String& text) {
  Serial.println(text);
}

const char* wsEventName(WStype_t type) {
  switch (type) {
    case WStype_DISCONNECTED:
      return "DISCONNECTED";
    case WStype_CONNECTED:
      return "CONNECTED";
    case WStype_TEXT:
      return "TEXT";
    case WStype_BIN:
      return "BIN";
    case WStype_ERROR:
      return "ERROR";
    case WStype_FRAGMENT_TEXT_START:
      return "FRAGMENT_TEXT_START";
    case WStype_FRAGMENT_BIN_START:
      return "FRAGMENT_BIN_START";
    case WStype_FRAGMENT:
      return "FRAGMENT";
    case WStype_FRAGMENT_FIN:
      return "FRAGMENT_FIN";
    case WStype_PING:
      return "PING";
    case WStype_PONG:
      return "PONG";
    default:
      return "UNKNOWN";
  }
}

void resetWsState() {
  ws_connected = false;
  ws_auth_ok = false;
  if (!token_received_once) {
    token_ready = false;
    qr_valid = false;
    active_url = "";
    redraw_requested = true;
  }
}

void drawCenteredText(
  const String& text,
  int16_t cx,
  int16_t cy,
  uint16_t fg,
  uint16_t bg,
  uint8_t size = 1
) {
  int16_t x1 = 0;
  int16_t y1 = 0;
  uint16_t w = 0;
  uint16_t h = 0;
  tft.setTextWrap(false);
  tft.setTextSize(size);
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  tft.setCursor(cx - static_cast<int16_t>(w / 2), cy - static_cast<int16_t>(h / 2));
  tft.setTextColor(fg, bg);
  tft.print(text);
}

void drawTopCenteredText(
  const String& text,
  int16_t cx,
  int16_t top_y,
  uint16_t fg,
  uint16_t bg,
  uint8_t size = 1
) {
  int16_t x1 = 0;
  int16_t y1 = 0;
  uint16_t w = 0;
  uint16_t h = 0;
  tft.setTextWrap(false);
  tft.setTextSize(size);
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  tft.setCursor(cx - static_cast<int16_t>(w / 2), top_y);
  tft.setTextColor(fg, bg);
  tft.print(text);
}

int hexNibble(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
  if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
  return -1;
}

bool decodeHexToBytes(const String& hex, uint8_t* out, size_t out_max, size_t& out_len) {
  const size_t n = hex.length();
  if (n == 0 || (n % 2) != 0) return false;
  const size_t byte_count = n / 2;
  if (byte_count == 0 || byte_count > out_max) return false;

  for (size_t i = 0; i < byte_count; i++) {
    const int hi = hexNibble(hex[i * 2]);
    const int lo = hexNibble(hex[i * 2 + 1]);
    if (hi < 0 || lo < 0) return false;
    out[i] = static_cast<uint8_t>((hi << 4) | lo);
  }

  out_len = byte_count;
  return true;
}

bool loadQrPayload(uint16_t side, const String& bits_hex) {
  if (side == 0 || side > QR_BOX) return false;

  const uint32_t total_bits = static_cast<uint32_t>(side) * static_cast<uint32_t>(side);
  const size_t expected_len = (total_bits + 7U) / 8U;
  if (expected_len == 0 || expected_len > QR_BITS_MAX_BYTES) return false;

  size_t decoded_len = 0;
  if (!decodeHexToBytes(bits_hex, qr_bits, QR_BITS_MAX_BYTES, decoded_len)) return false;
  if (decoded_len != expected_len) return false;

  qr_side = side;
  qr_bits_len = decoded_len;
  return true;
}

inline bool qrBitGet(uint32_t bit_index) {
  const uint32_t byte_index = bit_index >> 3;
  if (byte_index >= qr_bits_len) return false;
  const uint8_t mask = static_cast<uint8_t>(0x80 >> (bit_index & 7));
  return (qr_bits[byte_index] & mask) != 0;
}

void drawHeader() {
  tft.fillRect(0, 0, SCREEN_W, HEADER_H, COLOR_HEADER);
  drawCenteredText("MASA " + String(MASA_ID), SCREEN_W / 2, HEADER_H / 2, COLOR_TEXT, COLOR_HEADER);
}

void drawMessage(const String& message, uint16_t color) {
  tft.fillScreen(COLOR_BG);
  drawHeader();
  drawCenteredText(message, SCREEN_W / 2, SCREEN_H / 2, color, COLOR_BG);
}

void drawQr() {
  if (!qr_valid || qr_side == 0) {
    tft.fillRect(QR_X, QR_Y, QR_BOX, QR_BOX, COLOR_BG);
    drawCenteredText("QR bekleniyor...", SCREEN_W / 2, QR_Y + (QR_BOX / 2), ST77XX_YELLOW, COLOR_BG);
    return;
  }

  uint16_t module_px = QR_BOX / qr_side;
  if (module_px < 1) module_px = 1;

  const uint16_t real_size = module_px * qr_side;
  const uint16_t ox = QR_X + (QR_BOX - real_size) / 2;
  const uint16_t oy = QR_Y + (QR_BOX - real_size) / 2;

  tft.fillRect(QR_X - 1, QR_Y - 1, QR_BOX + 2, QR_BOX + 2, ST77XX_WHITE);

  for (uint16_t y = 0; y < qr_side; y++) {
    for (uint16_t x = 0; x < qr_side; x++) {
      const uint32_t idx = static_cast<uint32_t>(y) * static_cast<uint32_t>(qr_side) + x;
      if (!qrBitGet(idx)) continue;
      tft.fillRect(ox + (x * module_px), oy + (y * module_px), module_px, module_px, ST77XX_BLACK);
    }
  }
}

void drawCountdown() {
  uint32_t remaining_ms = 0;
  if (token_ready) {
    const uint32_t elapsed = millis() - token_received_ms;
    remaining_ms = elapsed < token_duration_ms ? token_duration_ms - elapsed : 0;
  }

  const float ratio = token_ready && token_duration_ms > 0
    ? static_cast<float>(remaining_ms) / static_cast<float>(token_duration_ms)
    : 0.0f;
  const uint16_t bar_x = 4;
  const uint16_t bar_w = SCREEN_W - 8;
  const uint16_t bar_h = 8;
  const uint16_t bar_y = FOOTER_Y + 7;
  const uint16_t filled = static_cast<uint16_t>(bar_w * ratio);

  uint16_t color = COLOR_OK;
  if (ratio <= 0.50f) color = ST77XX_YELLOW;
  if (ratio <= 0.20f) color = ST77XX_RED;

  tft.fillRect(0, FOOTER_Y, SCREEN_W, FOOTER_H, COLOR_BG);
  tft.fillRect(bar_x, bar_y, bar_w, bar_h, COLOR_BAR_EMPTY);
  if (filled > 0) tft.fillRect(bar_x, bar_y, filled, bar_h, color);

  drawTopCenteredText(String(remaining_ms / 1000UL) + " sn", SCREEN_W / 2, FOOTER_Y + 1, COLOR_SOFT, COLOR_BG);
}

void redrawScreen() {
  tft.fillScreen(COLOR_BG);
  drawHeader();
  drawQr();
  drawCountdown();
}

void sendWsAuth() {
  if (String(WS_DEVICE_KEY).length() == 0) {
    logLine("[WS] Warning: WS_DEVICE_KEY is empty.");
    return;
  }

  StaticJsonDocument<160> doc;
  doc["type"] = "auth";
  doc["deviceKey"] = WS_DEVICE_KEY;
  String auth_payload;
  serializeJson(doc, auth_payload);
  logLine("[WS] Auth payload: " + auth_payload);
  ws.sendTXT(auth_payload);
  logLine("[WS] Auth message sent.");
}

void handleWsMessage(const String& data) {
  StaticJsonDocument<1024> doc;
  if (deserializeJson(doc, data)) {
    logLine("[WS] JSON parse error.");
    return;
  }

  const String type = String(doc["type"] | "");
  if (type.length() > 0) {
    logLine("[WS] Message type: " + type);
  }

  if (type == "auth_ok") {
    ws_auth_ok = true;
    logLine("[WS] Auth OK.");
    return;
  }

  if (type == "new_token") {
    active_url = String(doc["url"] | "");

    uint32_t ttl_sec = static_cast<uint32_t>(doc["ttl_seconds"] | 0);
    if (ttl_sec == 0) ttl_sec = TOKEN_DURATION_MS / 1000UL;

    token_duration_ms = ttl_sec * 1000UL;
    token_received_ms = millis();
    token_ready = true;
    token_received_once = true;

    const uint16_t side = static_cast<uint16_t>(doc["qr_side"] | 0);
    const String bits = String(doc["qr_bits_hex"] | "");
    qr_valid = loadQrPayload(side, bits);

    logLine("[QR] url_len=" + String(active_url.length()));
    if (qr_valid) {
      logLine("[QR] side=" + String(qr_side) + " bytes=" + String(qr_bits_len));
    } else {
      logLine("[QR] qr_bits_hex invalid or missing.");
    }

    redraw_requested = true;
    return;
  }
}

void handleWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  logLine(
    String("[WS] Event: ") + wsEventName(type) +
    " (" + String(static_cast<int>(type)) + ")" +
    " len=" + String(length)
  );

  if (type == WStype_CONNECTED) {
    ws_connected = true;
    ws_auth_ok = false;
    logLine("[WS] Connected.");
    last_auth_attempt_ms = millis();
    sendWsAuth();
    return;
  }

  if (type == WStype_DISCONNECTED) {
    resetWsState();
    logLine("[WS] Disconnected.");
    return;
  }

  if (type == WStype_TEXT) {
    String data;
    data.reserve(length);
    for (size_t i = 0; i < length; i++) {
      data += static_cast<char>(payload[i]);
    }
    if (data == "pong") {
      logLine("[WS] pong");
      return;
    }
    handleWsMessage(data);
    return;
  }

  if (type == WStype_ERROR) {
    String error_text;
    error_text.reserve(length);
    for (size_t i = 0; i < length; i++) {
      error_text += static_cast<char>(payload[i]);
    }
    if (error_text.length() > 0) {
      logLine("[WS] Error payload: " + error_text);
    }
    return;
  }

  if (type == WStype_PONG) {
    logLine("[WS] pong");
    return;
  }
}

void connectWifi() {
  logLine("[WIFI] Connecting.");
  WiFi.disconnect(true, true);
  WiFi.softAPdisconnect(true);
  delay(750);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  drawMessage("WiFi baglaniyor...", ST77XX_YELLOW);

  const uint32_t start_ms = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start_ms > WIFI_TIMEOUT_MS) {
      logLine("[WIFI] Timeout.");
      drawMessage("WiFi timeout. Reset...", ST77XX_RED);
      delay(1000);
      ESP.restart();
    }
    delay(250);
  }

  wifi_connected = true;
  logLine("[WIFI] Connected.");
  logLine("[WIFI] IP: " + WiFi.localIP().toString());
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  const uint32_t ntp_start_ms = millis();
  time_t now = time(nullptr);
  while (now < 1700000000 && millis() - ntp_start_ms < 5000UL) {
    delay(200);
    now = time(nullptr);
  }

  ntp_ready = now >= 1700000000;
  logLine(String("[NTP] status=") + (ntp_ready ? "ok" : "skip"));
}

String fetchFirstHttpLine(const String& host, uint16_t port, bool tls) {
  const String req =
    "GET /health HTTP/1.1\r\n"
    "Host: " + host + "\r\n"
    "User-Agent: tabflow-esp32-diagnostic\r\n"
    "Connection: close\r\n\r\n";

  if (tls) {
    WiFiClientSecure c;
    c.setInsecure();
    c.setTimeout(2500);
    if (!c.connect(host.c_str(), port)) return "connect_fail";
    c.print(req);
    String line = c.readStringUntil('\n');
    line.trim();
    c.stop();
    return line.length() ? line : "no_response";
  }

  WiFiClient c;
  c.setTimeout(2500);
  if (!c.connect(host.c_str(), port)) return "connect_fail";
  c.print(req);
  String line = c.readStringUntil('\n');
  line.trim();
  c.stop();
  return line.length() ? line : "no_response";
}

void networkDiagnostic(const IPAddress& ip) {
  const String host = String(BACKEND_HOST);
  const String ip_s = ip.toString();
  logLine("[NET] diagnostic started.");
  logLine("[NET] host80  : " + fetchFirstHttpLine(host, 80, false));
  logLine("[NET] host443 : " + fetchFirstHttpLine(host, BACKEND_PORT, true));
  logLine("[NET] ip80    : " + fetchFirstHttpLine(ip_s, 80, false));
  logLine("[NET] ip443   : " + fetchFirstHttpLine(ip_s, BACKEND_PORT, true));
}

bool isValidIp(const IPAddress& ip) {
  return !(ip[0] == 0 && ip[1] == 0 && ip[2] == 0 && ip[3] == 0);
}

void resetWsClient() {
  ws.disconnect();
  ws = WebSocketsClient();
  ws.setReconnectInterval(0);
  ws.enableHeartbeat(15000, 3000, 2);
  ws.onEvent(handleWsEvent);
}

bool tryWs(
  const String& log_url,
  const String& host,
  uint16_t port,
  const String& path_and_query,
  bool secure
) {
  resetWsClient();
  logLine(
    String("[WS] Opening ") + (secure ? "WSS" : "WS") +
    " host=" + host +
    " port=" + String(port) +
    " path=" + path_and_query
  );

  const uint32_t t0 = millis();
  if (secure) {
    ws.beginSSL(host.c_str(), static_cast<uint16_t>(port), path_and_query.c_str());
  } else {
    ws.begin(host.c_str(), static_cast<uint16_t>(port), path_and_query.c_str());
  }
  ws.setExtraHeaders("User-Agent: tabflow-esp32-c3-qr\r\n");

  bool ok = false;
  const uint32_t timeout_ms = 4000UL;
  while (millis() - t0 < timeout_ms) {
    ws.loop();
    if (ws_connected) {
      ok = true;
      break;
    }
    delay(10);
  }

  logLine(
    String("[WS] Try: ") + log_url +
    " -> " + (ok ? "ok" : "fail") +
    " (" + String(millis() - t0) + " ms)"
  );
  return ok;
}

void connectWs() {
  ws_connected = false;
  ws_auth_ok = false;
  token_received_once = false;

  IPAddress backend_ip;
  const bool dns_ok = WiFi.hostByName(BACKEND_HOST, backend_ip);
  if (dns_ok) {
    logLine("[DNS] " + String(BACKEND_HOST) + " -> " + backend_ip.toString());
  } else {
    logLine("[DNS] Could not resolve: " + String(BACKEND_HOST));
  }

  const String ws_path = "/ws/masa/" + String(MASA_ID);
  const String ws_query = String("?anahtar=") + String(WS_DEVICE_KEY);
  const String host = String(BACKEND_HOST);
  const String ip_str = backend_ip.toString();

  logLine("[WS] Connecting.");
  logLine("[MEM] free=" + String(ESP.getFreeHeap()) + " min=" + String(ESP.getMinFreeHeap()));

  bool ok = tryWs("wss://" + host + ws_path + ws_query, host, BACKEND_PORT, ws_path + ws_query, true);

  if (!ok) {
    ok = tryWs("wss://" + host + ws_path, host, BACKEND_PORT, ws_path, true);
  }

  if (!ok && dns_ok && isValidIp(backend_ip)) {
    ok = tryWs("wss://" + ip_str + ws_path + ws_query, ip_str, BACKEND_PORT, ws_path + ws_query, true);
  }

  if (!ok && dns_ok && isValidIp(backend_ip)) {
    ok = tryWs("wss://" + ip_str + ws_path, ip_str, BACKEND_PORT, ws_path, true);
  }

  if (!ok && (last_network_diagnostic_ms == 0 || millis() - last_network_diagnostic_ms > 10000UL)) {
    last_network_diagnostic_ms = millis();
    networkDiagnostic(backend_ip);
  }

  ws_connected = ok;
  logLine(String("[WS] connect result: ") + (ws_connected ? "ok" : "fail"));
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(150);
  Serial.setDebugOutput(false);
  logLine("");
  logLine("[BOOT] TabFlow ESP32 table display.");
  logLine("[BOOT] Table ID: " + String(MASA_ID));
  logLine("[BOOT] Backend: " + String(BACKEND_HOST) + ":" + String(BACKEND_PORT));

  SPI.begin(TFT_SCLK_PIN, TFT_MISO_PIN, TFT_MOSI_PIN, TFT_CS_PIN);
  tft.initR(TFT_INITR_OPTION);
  tft.setRotation(TFT_ROTATION);
  tft.setTextWrap(false);
  tft.fillScreen(COLOR_BG);

  if (TFT_BL_PIN >= 0) {
    pinMode(TFT_BL_PIN, OUTPUT);
    digitalWrite(TFT_BL_PIN, TFT_BL_ON);
  }

  drawMessage("Baslatiliyor...", ST77XX_WHITE);

  connectWifi();
  connectWs();
  redraw_requested = true;
}

void loop() {
  wifi_connected = WiFi.status() == WL_CONNECTED;

  if (!wifi_connected) {
    resetWsState();
    drawMessage("WiFi koptu. Yeniden...", ST77XX_RED);
    connectWifi();
    connectWs();
  }

  if (ws_connected) {
    ws.loop();

    if (!ws_auth_ok && millis() - last_auth_attempt_ms >= 2000) {
      last_auth_attempt_ms = millis();
      sendWsAuth();
    }
  } else {
    const bool token_expired = token_ready && millis() - token_received_ms >= token_duration_ms;

    if (!token_ready || token_expired) {
      if (token_expired) {
        token_ready = false;
        qr_valid = false;
        active_url = "";
        redraw_requested = true;
      }
      if (millis() - last_ws_attempt_ms >= WS_RECONNECT_MS) {
        last_ws_attempt_ms = millis();
        connectWs();
      }
    }
  }

  if (redraw_requested) {
    redraw_requested = false;
    redrawScreen();
  }

  if (millis() - last_bar_ms >= 250) {
    last_bar_ms = millis();
    drawCountdown();
  }

  if (ws_connected && millis() - last_ping_ms >= WS_PING_MS) {
    last_ping_ms = millis();
    ws.sendTXT("ping");
  }

  if (millis() - last_heartbeat_ms >= HEARTBEAT_MS) {
    last_heartbeat_ms = millis();
    logLine(
      String("[HB] wifi=") + (wifi_connected ? "up" : "down") +
      " ws=" + (ws_connected ? "up" : "down") +
      " authed=" + (ws_auth_ok ? "yes" : "no") +
      " token=" + (token_ready ? "yes" : "no") +
      " ntp=" + (ntp_ready ? "yes" : "no")
    );
  }
}

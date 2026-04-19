#pragma once

// Copy this file to config.h before flashing a physical device.
// config.h is intentionally ignored because it contains Wi-Fi and device secrets.

// Wi-Fi
#define WIFI_SSID "CHANGE_ME"
#define WIFI_PASSWORD "CHANGE_ME"

// Tenant API
#define BACKEND_HOST "demo.tabflow.uk"
#define BACKEND_PORT 443

// Each physical table display must have its own table id and device key.
#define MASA_ID 1
#define WS_DEVICE_KEY "CHANGE_ME-masa001"

// ESP32-C3 Super Mini -> 1.8 inch ST7735 SPI TFT
#define TFT_SCLK_PIN 10
#define TFT_MOSI_PIN 7
#define TFT_MISO_PIN -1
#define TFT_CS_PIN 5
#define TFT_DC_PIN 4
#define TFT_RST_PIN 3
#define TFT_BL_PIN -1
#define TFT_BL_ON HIGH
#define TFT_INITR_OPTION INITR_BLACKTAB
#define TFT_ROTATION 0

// Timing
#define TOKEN_DURATION_MS 60000UL
#define WIFI_TIMEOUT_MS 20000UL
#define WS_RECONNECT_MS 3000UL
#define WS_PING_MS 30000UL
#define HEARTBEAT_MS 5000UL

// Serial debug
#define SERIAL_BAUD 115200

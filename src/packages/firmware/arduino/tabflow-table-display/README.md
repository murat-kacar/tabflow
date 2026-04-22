# ESP32 Table Display Firmware

This Arduino sketch powers the TabFlow table QR display device.

It targets:

- ESP32-C3 Super Mini V1.6.0.1
- 1.8 inch ST7735 SPI TFT, 128x160 portrait
- Adafruit GFX Library
- Adafruit ST7735 and ST7789 Library
- WebSockets by Markus Sattler
- ArduinoJson

## Files

- `firmware.ino`: device application source.
- `config.example.h`: safe template committed to git.
- `config.h`: local or generated device config, intentionally ignored by git.

## Hardware Profile

Default pin map:

```text
TFT SCK/SCLK -> GPIO0
TFT SDA/MOSI -> GPIO1
TFT A0/DC    -> GPIO2
TFT RESET    -> GPIO3
TFT CS       -> GPIO4
TFT LED/BL   -> 3V3 or optional configured backlight pin
TFT GND      -> GND
TFT VCC      -> 3V3
```

Pins intentionally avoided:

- `GPIO8` and `GPIO9` because they are boot/strapping sensitive.
- `GPIO20` and `GPIO21` to avoid USB/serial interference.

Pin risk note:

- `GPIO2` is also boot/strapping-sensitive, but the current physical wiring uses
  it for `A0/DC`. If boot instability appears in field tests, move `A0/DC` to a
  safer free GPIO and update this hardware profile everywhere.

## Runtime Contract

The device connects to the tenant API over:

```text
wss://<BACKEND_HOST>/ws/masa/<MASA_ID>
```

It authenticates with `WS_DEVICE_KEY` and accepts backend-owned QR payloads:

- `type: "auth_ok"`
- `type: "new_token"`
- `url`
- `ttl_seconds`
- `qr_side`
- `qr_bits_hex`

The firmware draws `qr_side` + `qr_bits_hex` directly. It does not generate QR
codes on-device.

## Flashing

1. Copy `config.example.h` to `config.h`.
2. Fill `WIFI_SSID`, `WIFI_PASSWORD`, `BACKEND_HOST`, `MASA_ID`, and `WS_DEVICE_KEY`.
3. Flash `firmware.ino` with the Arduino IDE or compatible ESP32 toolchain.

For production provisioning, prefer the generated per-table `config.h` artifact
from tenant device key rotation or tenant provisioning, then set the physical
site Wi-Fi values before flashing.

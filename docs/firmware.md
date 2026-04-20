# Firmware

Scope: Source Baseline

Status Snapshot: 2026-04-17

Firmware is part of the tenant lifecycle, but devices are tenant runtime clients.
They must not know platform internals.

Source location:

```text
packages/firmware/arduino/tabflow-table-display/
  firmware.ino
  config.example.h
```

`config.example.h` is the committed safe template. A real `config.h` contains
Wi-Fi credentials and a device key, so it is ignored by git.

Locked hardware profile:

- ESP32-C3 Super Mini V1.6.0.1
- 1.8 inch TFT SPI 128x160 V1.1
- Adafruit GFX
- Adafruit ST7735/ST7789

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

- GPIO8, GPIO9 because of boot/strapping risk.
- GPIO20, GPIO21 to avoid USB/serial interference.

GPIO2 risk note:

- GPIO2 is also boot/strapping-sensitive, but the current physical wiring uses
  it for TFT A0/DC. This is accepted for the current prototype profile. If boot
  instability appears, move A0/DC to a safer free GPIO and update generated
  firmware config output at the same time.

The firmware does not generate QR codes. The tenant API owns token generation and
WebSocket delivery.

Generated tenant artifacts:

```text
runtime/generated/tenants/<tenant-code>/firmware/
  masa-001.ino
  masa-002.ino
```

Generated `.ino` files contain device secrets and must not be committed.

## Runtime Contract

Device config contains:

- `MASA_ID`
- backend host
- backend port
- device key
- Wi-Fi SSID/password for the physical environment
- display pin constants
- firmware timing constants

Device behavior:

- connects to Wi-Fi with sleep disabled
- syncs time for TLS
- connects to tenant API WebSocket at `wss://<BACKEND_HOST>/ws/masa/<MASA_ID>`
- authenticates with table id and device key
- receives `new_token`
- receives URL + expiry plus backend-rendered QR matrix fields
- keeps the last valid QR until backend sends a replacement or expiry state

Current wire payload baseline:

- `type: "auth_ok"`
- `type: "new_token"`
- `url`
- `ttl_seconds`
- `expires_at`
- `qr_side`
- `qr_bits_hex`

`qr_side` / `qr_bits_hex` are now produced by tenant API using a fixed
version-4 / ECC-L runtime encoder. Firmware should remain backend-driven and
must not grow its own QR generation logic.

## Artifact Ownership

Tenant creation should generate table-level `.ino` artifacts under the
tenant firmware directory.

Example:

```text
runtime/generated/tenants/<tenant-code>/firmware/masa-001.ino
runtime/generated/tenants/<tenant-code>/firmware/masa-002.ino
```

Generated artifacts include operational secrets. They are runtime outputs, not
source files. The default local output root is ignored by git; production
deployments should point `Provisioning:OutputRoot` at an external runtime
location with restricted filesystem permissions. If `Provisioning:OutputRoot`
is overridden, the same `tenants/<tenant-code>/firmware/...` layout still
applies under that root.

Table creation returns the only ready-to-flash single-file Arduino sketch for
that table lifecycle, named from the current table label, for example:

```text
masa-balkon-003.ino
2-kat-bahce-banko-002.ino
```

The generated sketch contains the shared firmware source plus device-specific
defines for tenant domain, Wi-Fi defaults, table id, device key, pin map, and
timing constants.

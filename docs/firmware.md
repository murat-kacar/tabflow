# Firmware

Firmware is part of the tenant lifecycle, but devices are tenant runtime clients.
They must not know platform internals.

Locked hardware profile:

- ESP32-C3 Super Mini V1.6.0.1
- 1.8 inch TFT SPI 128x160 V1.1
- Adafruit GFX
- Adafruit ST7735/ST7789

Default pin map:

```text
TFT SCK/SCLK -> GPIO10
TFT SDA/MOSI -> GPIO7
TFT A0/DC    -> GPIO4
TFT RESET    -> GPIO3
TFT CS       -> GPIO5
TFT LED/BL   -> 3V3 or optional configured backlight pin
TFT GND      -> GND
TFT VCC      -> 3V3
```

Pins intentionally avoided:

- GPIO2, GPIO8, GPIO9 because of boot/strapping risk.
- GPIO20, GPIO21 to avoid USB/serial interference.

The firmware does not generate QR codes. The tenant API owns token generation and
WebSocket delivery.

Generated tenant artifacts:

```text
firmware/
  firmware.ino
  masa001/config.h
  masa002/config.h
```

`config.h` contains device secrets and must not be committed.

## Runtime Contract

Device config contains:

- `MASA_ID`
- backend host
- backend port
- device key
- Wi-Fi SSID/password for the physical environment
- display pin constants

Device behavior:

- connects to Wi-Fi with sleep disabled
- syncs time for TLS
- connects to tenant API WebSocket
- authenticates with table id and device key
- receives `new_token`
- today receives URL + expiry plus reserved QR matrix fields
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

Tenant creation should generate the tenant-level `firmware.ino` artifact. Table
creation should generate table-level config artifacts.

Example:

```text
generated/firmware/<tenant-code>/firmware.ino
generated/firmware/<tenant-code>/masa001/config.h
generated/firmware/<tenant-code>/masa002/config.h
```

Generated artifacts include operational secrets. They are runtime outputs, not
source files. The default local output root is ignored by git; production
deployments should point `Provisioning:OutputRoot` at an external runtime
location with restricted filesystem permissions.

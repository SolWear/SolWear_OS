# Hardware

The v0.1 software contract targets Raspberry Pi 4 or 5 development boards,
arm64, with adaptive screens from 240x240 to 800x480. See architecture sections
1, 4.1, 9, and 11. [SOLWEAR_MAP.md](../SOLWEAR_MAP.md) records the actual live
Pi and older hardware repositories; those older materials are references, not
automatic authority for this Linux platform.

## Current hardware boundary

`PiHal` reads battery data from `/sys/class/power_supply`, brightness from
`/sys/class/backlight`, sensor inputs from Linux IIO/thermal interfaces, and
network state through `nmcli`. The panel is configured with
`SOLWEAR_SCREEN=WIDTHxHEIGHT:shape` because the daemon cannot reliably infer
it. NFC diagnostics expect I2C at `/dev/i2c-1`, address `0x24`, and a separate
PN532 Type 4 userspace worker.

The checked-in image path starts from Raspberry Pi OS Lite arm64, installs the
daemon, shell, apps, system user, systemd units, cage, and Chromium. The live
Pi described by the map is a Raspberry Pi 4B running Raspberry Pi OS Desktop,
Xorg, and a user Chromium kiosk after a partial installer path. It validates
software on a real board but is not the complete target image.

QEMU cannot validate Pi firmware, device tree, GPIO/I2C wiring, a physical
display, power gauge, buttons, backlight, sensors, or PN532. Those require a
physical-hardware checklist.

## UNKNOWN / NEEDS DECISION

- Production board/SKU, SoC, secure element, and Ed25519 key architecture.
- Display technology, exact dimensions/shape, touch/controller, buttons,
  haptics, battery/cell/charging design, sensors, NFC part and antenna, BLE and
  Wi-Fi modules, enclosure, strap, thermal and water-resistance targets.
- Battery-life target, BOM/cost, suppliers, manufacturability, repairability,
  regulatory approvals, and hardware test fixtures.

Do not infer any of these from historical ESP32 concepts or placeholder names.

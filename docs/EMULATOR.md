# Emulator

SolWear has two required emulator levels under architecture section 9. Neither
replaces physical hardware validation. Repository and live-device context is in
[SOLWEAR_MAP.md](../SOLWEAR_MAP.md).

## Host emulator

`emulator/host` is the fast development path. It serves the real built shell
and app assets, provides a protocol-compatible JavaScript mock daemon/HAL, and
opens a local Chromium/Chrome-style window when available. It supports live
profile switching, HAL controls, RPC diagnostics, app capability enforcement,
and an ephemeral Ed25519 wallet with a confirmation prompt. Its simplified
passphrase model is test behavior, not the production Rust keystore.

Checked-in profiles are `pi-round-240`, `pi-round-480`, `pi-square-320`, and
`pi-wide-800x480`; the latter three are the architecture's ship-blocking layout
profiles. Start it with:

```bash
./scripts/dev.sh emulator --profile pi-round-480
npm --prefix emulator/host test
```

## QEMU

`emulator/qemu` boots an official Debian Bookworm ARM64 cloud image via UEFI and
virtio, installs the aarch64 production daemon under systemd, and forwards the
HTTP/RPC ports. Its disk is deliberately separate from the Raspberry Pi image.

```bash
./emulator/qemu/build-image.sh
./emulator/qemu/run.sh
node emulator/qemu/smoke.mjs 8731 8730
```

QEMU is optional for normal Node/Rust checks and must print install guidance
when unavailable. It proves ARM64 Linux userspace and systemd behavior, but not
Pi firmware, device-tree, display, battery, I2C, GPIO, sensors, or PN532.

## End to end

`tests/e2e/run.sh` uses the production Rust daemon with MockHal on ephemeral
ports and drives real CLI packaging/signing/install plus refusal paths. It
requires Node 22+ and Rust, but no QEMU or hardware.

**UNKNOWN / NEEDS DECISION:** supported host browser matrix, automated visual
regression thresholds, and ownership of physical-device parity sign-off.

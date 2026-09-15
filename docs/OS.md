# Operating system

The binding design is [ARCHITECTURE.md](ARCHITECTURE.md); current repository and
deployment locations are indexed by [SOLWEAR_MAP.md](../SOLWEAR_MAP.md).

SolWear OS v0.1 is an operating environment on ordinary Linux. Raspberry Pi OS
Lite arm64 provides the base; cage and Chromium provide the kiosk display; one
Rust daemon, `solweard`, provides the system API and static content. Shell and
apps are web content, so the UI remains identical when MockHal replaces PiHal.

## Daemon and shell

`os/solweard` binds JSON-RPC WebSocket to `127.0.0.1:8730` and HTTP assets to
`127.0.0.1:8731` by default. It owns HAL selection, notifications, installed
apps, archive verification, the wallet, and confirmation coordination. Runtime
addresses and paths can be overridden for tests through `SOLWEAR_*` variables.

`os/shell` is a TypeScript SPA providing the watchface host, launcher,
notifications, settings, and wallet confirmation. Apps run in sandboxed
opaque-origin iframes and communicate only through the shell bridge. Layout is
derived from the reported screen and must be checked on the shipped profiles.

## Image and live state

`image/build-image.sh` constructs the contract image; `build-on-pi.sh` wraps the
toolchain/build/download flow; `install-on-pi.sh` provisions an existing Pi.
The live Pi is a partial Desktop/Xorg deployment and only installs the daemon
system service, with the kiosk as a user service. Keep this operational fact
separate from the Lite/cage target.

## Known contract reconciliation

Current `main` has API extensions (`system.network`,
`display.getBrightness`, and `nfc.*`) outside architecture section 4.2.
**UNKNOWN / NEEDS DECISION:** amend the binding contract in a separate
spec-first review or align implementation back to it. The map's
`wallet.generate` change is on another branch and is not present on `main`.

Physical PN532 operation and remaining sensor/backlight drivers are not yet
validated. A custom kernel/compositor, Yocto, real BLE pairing, and mainnet
transactions remain explicit v0.1 non-goals.

# AI repository audit

Audited 2026-09-15 on branch `main` at `52d6e79`. Start with the
[master map](../SOLWEAR_MAP.md); [ARCHITECTURE.md](ARCHITECTURE.md) remains the
binding contract, and repository contents are the evidence for implemented
behavior.

## Structure and dependency order

The repository matches the contract's major surfaces: Rust daemon in
`os/solweard`; TypeScript shell in `os/shell`; runtime, CLI, and VS Code tooling
under `sdk`; host and QEMU emulators; five first-party app packages; signed
registry; image tooling; documentation; and a hardware-free e2e harness.

Node packages are independent rather than a root workspace. CI discovers their
`package.json` files, forces `sdk/runtime` first and `sdk/cli` second, then walks
the rest lexically. This ordering matters because apps call the built CLI and
the CLI resolves the built local runtime. Rust, registry, docs, Node, e2e, and
repository hygiene run as separate CI jobs. `scripts/dev.sh` provides a single
local entry point while retaining those real package scripts.

## What is implemented

- `solweard` serves loopback WebSocket JSON-RPC and HTTP assets, selects PiHal
  or MockHal, manages apps, verifies `.swa` packages, and owns an Ed25519 wallet.
- The shell uses an opaque-origin `sandbox="allow-scripts"` iframe and brokers
  capability-checked postMessage calls; the daemon checks capabilities again.
- The runtime exposes typed system, power, display, sensors, notifications,
  apps, wallet, NFC, event, and adaptive-layout APIs.
- The CLI supports scaffold, build, run, package, key generation, sign, verify,
  install, publish, and doctor flows.
- Host tests exercise all four checked-in profiles; QEMU boots Debian ARM64;
  the e2e harness exercises the production daemon with MockHal.

## Gaps and reconciliation work

- **UNKNOWN / NEEDS DECISION — contract drift:** `main` implements
  `system.network`, `display.getBrightness`, and four `nfc.*` methods not listed
  in architecture section 4.2. The contract says its API is exact and must be
  amended before additions. Decide whether to amend the spec in a separate
  review or remove/hold the extensions.
- **UNKNOWN / NEEDS DECISION — branch integration:** the master map records
  `wallet.generate` on `deviverr/pi-ethernet-connect-run`; it is absent from the
  current `main` code and binding API. Integration requires a spec-first
  decision and the security gate.
- The target image is Raspberry Pi OS Lite + cage/Wayland, while the live Pi in
  the map is a partial `install-on-pi.sh` deployment on Desktop/Xorg with a user
  Chromium kiosk. That is known deployment variance, not a new architecture.
- The PN532 Type 4 worker is not implemented or physically validated. Battery,
  sensors, backlight, display, and reboot behavior retain physical-hardware
  validation gates documented in `LEGACY_MIGRATION.md`.
- The current live Pi wallet is recorded as unprotected. Setting its passphrase
  is a human operational follow-up, not an automated repository task.
- Release workflow image probing refers to `image/build.sh`, while the real
  image builder is `image/build-image.sh`. Reconcile this before relying on CI
  image artifacts.

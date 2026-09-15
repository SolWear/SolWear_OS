# Product

[SOLWEAR_MAP.md](../SOLWEAR_MAP.md) locates the active repositories and live
system. [ARCHITECTURE.md](ARCHITECTURE.md) is the binding v0.1 technical
contract; the [strategy](../SolWear_Story_and_Ecosystem_Strategy.md) supplies
product direction without overriding that contract.

SolWear is a Solana-native wearable platform: hardware, an operating
environment, an SDK, apps, and a developer ecosystem. Secure signing is a core
platform capability and first-party app, not the whole product. The product
thesis is that an always-worn, physically present device can make payments,
identity, approvals, notifications, sensors, games, and future integrations
feel more direct than a phone-only experience.

## v0.1 product boundary

The current repository targets Raspberry Pi 4/5 arm64 and adaptive web UI on
240x240 through 800x480 round, square, and rectangular screens. It provides a
system shell, daemon, typed app API, developer CLI, host/QEMU emulators, signed
app distribution, image tooling, and first-party watchface, signer, store,
stats, and games packages.

Architecture section 1 explicitly excludes a custom compositor/kernel, Yocto,
a real Bluetooth pairing stack, and on-chain mainnet transactions from v0.1.
The host emulator and SDK are product surfaces in their own right because they
let developers build before they can obtain hardware.

## Product principles

- Ask why a feature is better on the wrist and why Solana is material to it.
- Validate repeated utility and developer usability before expensive hardware
  scale.
- Treat physical confirmation, capability consent, device identity, and secure
  signing as platform primitives.
- Say “phone-optional” only as a direction; do not claim phone-free flows until
  their connectivity and broadcast path are implemented and tested.
- Do not promise generic EMV/card-network payments or a token economy.

## UNKNOWN / NEEDS DECISION

- Production enclosure, bill of materials, panel, battery, sensors, buttons,
  touch input, secure element, and manufacturing/certification plan.
- The first four ecosystem proof apps, partner pilots, pricing, monetization,
  developer economics, and final positioning/tagline.
- Production transaction verification, recovery, update, account, privacy, and
  device lifecycle policies.
- Whether and when any on-chain mainnet behavior leaves the v0.1 non-goal list.

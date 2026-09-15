# Ecosystem

The [strategy](../SolWear_Story_and_Ecosystem_Strategy.md) frames SolWear as a
wearable platform whose defensibility comes from hardware + OS + SDK + apps +
developers. [SOLWEAR_MAP.md](../SOLWEAR_MAP.md) identifies which repositories
and live services currently implement pieces of that system. The binding
technical limits remain [ARCHITECTURE.md](ARCHITECTURE.md).

## Present foundation

Five first-party packages demonstrate distinct surfaces: watchfaces, secure
signing/activity, app discovery/install, health/Linux statistics, and games.
The SDK and emulator lower the hardware barrier. The registry is a reviewed
JSON index with immutable package hashes and publisher-key continuity; store
installs verify both archive and embedded signature.

Publishing is currently a pull request, not an open upload service. First-party
packages can be verified offline. The registry README records that package
URLs name a future host and are not currently hosted at
`packages.solwear.tech`; documentation must not imply otherwise.

## Ecosystem principles

- Prove the four-app test: money, everyday value, why Solana matters, and why a
  normal smartwatch is insufficient.
- Recruit a few strong partner pilots before optimizing for catalogue size.
- Keep capability requests minimal and review publisher identity/key continuity.
- Prefer useful applications and recurring interactions over speculative
  incentives. No token is required for SolWear to function.
- Treat NFC as Solana-native physical interaction; do not imply generic bank
  card/EMV support.

## UNKNOWN / NEEDS DECISION

The initial partner set, third-party submission policy, moderation and malware
response, paid-app/payment terms, developer revenue share, package hosting,
analytics/privacy model, discovery/ranking, compatibility support window,
publisher key recovery, app revocation, and any future token role are unset.

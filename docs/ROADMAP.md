# Roadmap

This roadmap orders evidence, not dates or promises. The product direction
comes from the [strategy](../SolWear_Story_and_Ecosystem_Strategy.md); the v0.1
technical boundary is [ARCHITECTURE.md](ARCHITECTURE.md); current branches,
deployments, and human follow-ups are in [SOLWEAR_MAP.md](../SOLWEAR_MAP.md).

## Now: reconcile and harden platform core

- Decide the spec-first disposition of main's extra system/display/NFC RPCs and
  the branch-only `wallet.generate` API.
- Keep runtime, CLI, daemon, shell, emulator, docs, and registry contracts in
  lockstep; preserve runtime/CLI-first build order.
- Complete security review of signing, confirmation, capability, sandbox, and
  package trust paths; add rejection tests for every fix.
- Protect the live Pi wallet with a human-entered passphrase.
- Implement and physically validate the PN532 Type 4 worker; finish physical
  battery, sensors, backlight, display, and reboot checks.
- Fix the release image probe mismatch (`image/build.sh` versus the existing
  `image/build-image.sh`) in a separately scoped task.

## Next: developer preview evidence

- Prove scaffold → build → sign → verify → run → device install from a clean
  environment and document compatibility/version policy.
- Add automated adaptive-layout evidence for the three ship-blocking profiles.
- Establish third-party publisher onboarding, capability review, package
  hosting, update/revocation, and incident-handling rules.
- Recruit 3–5 focused partners spanning payment, identity/NFC, DePIN or another
  Solana primitive, and a non-financial everyday/fun use case.

## Later: consumer and ecosystem validation

- Validate repeated usage, setup friction, signing comprehension, and partner
  apps with real users before hardware scale.
- Choose and validate production security hardware, industrial design,
  battery, connectivity, manufacturing, certifications, recovery, and updates.
- Evaluate sustainable hardware/software/platform revenue only after utility is
  demonstrated.

## UNKNOWN / NEEDS DECISION

Owners, dates, launch criteria, budget, production SKU/BOM, mainnet milestone,
commercial model, token policy, certified security target, and definition of a
consumer-ready release remain Human Product Owner decisions.

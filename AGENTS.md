# SolWear agent engineering rules

Start with [SOLWEAR_MAP.md](SOLWEAR_MAP.md). It is the index for repositories,
live infrastructure, deployed state, and current branches. Then read
[SolWear_Story_and_Ecosystem_Strategy.md](SolWear_Story_and_Ecosystem_Strategy.md)
for product direction and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the
binding technical contract. The contract wins over plans, prose, and code. Do
not edit it as part of an implementation task; propose a separate spec-first
change when the contract must move.

## Core rules

- SolWear is a Solana-native wearable platform, not only a hardware wallet.
- Do not make product decisions silently. Write **UNKNOWN / NEEDS DECISION** in
  tasks and docs, state the alternatives, and ask the Human Product Owner.
- Do not invent hardware, security guarantees, tokenomics, payment-network
  support, production readiness, or deployed state.
- Keep keys, seeds, passphrases, credentials, personal data, and production
  configuration out of source, fixtures, logs, screenshots, and prompts.
- Preserve the v0.1 choices: Linux on Raspberry Pi 4/5 arm64, one Rust daemon,
  web-content apps, sandboxed iframes, capability-gated JSON-RPC, and MockHal
  parity. Do not add contract methods or fields without a spec-first decision.
- Every UI must adapt to round and rectangular/square profiles from 240x240 to
  800x480. Derive layout from `system.screen`; never assume one panel size.
- No build or ordinary test may require physical hardware. Every HAL operation
  must have deterministic MockHal behavior.
- Changes to keystore/signing, capability enforcement, sandboxing, or package
  verification require a security review and a second human reviewer.
- Never perform a live deploy, publish a package, rotate a key, change registry
  trust data, or operate the Pi/server unless the task explicitly authorizes it.
- Keep the live-state/target-state distinction from `SOLWEAR_MAP.md`: the
  provisioned Pi is not proof that the complete image contract is installed.

## Repository conventions

- Node 22+ and stable Rust are the supported development toolchains.
- Components are independent npm packages. Build `sdk/runtime`, then `sdk/cli`,
  then the remaining Node components; apps use both outputs.
- TypeScript is strict, ESM is used, and generated output belongs in `dist/`.
- Rust must pass `rustfmt`, Clippy with warnings denied, locked build, and tests.
- App ids are immutable reverse-DNS names. `.swa` and registry behavior must
  remain byte-compatible with architecture sections 5 and 10.
- Use Conventional Commits and component scopes from CONTRIBUTING.md, but do
  not commit unless the Human Product Owner explicitly asks.
- Keep changes task-scoped. Do not reformat, move, delete, or “clean up” files
  unrelated to the task.

## Canonical local commands

Prefer the repository runner:

```bash
./scripts/dev.sh doctor
./scripts/dev.sh setup
./scripts/dev.sh build
./scripts/dev.sh test
./scripts/dev.sh lint
./scripts/dev.sh emulator --profile pi-round-480
./scripts/dev.sh e2e
```

The exact CI-equivalent primitives are:

```bash
npm --prefix sdk/runtime ci && npm --prefix sdk/runtime run build
npm --prefix sdk/cli ci && npm --prefix sdk/cli run build
cargo fmt --manifest-path os/solweard/Cargo.toml --all -- --check
cargo clippy --manifest-path os/solweard/Cargo.toml --all-targets --all-features -- -D warnings
cargo build --manifest-path os/solweard/Cargo.toml --locked --all-features
SOLWEAR_HAL=mock cargo test --manifest-path os/solweard/Cargo.toml --all-features
node store/registry/validate.mjs
node store/registry/test.mjs
node store/registry/verify-packages.mjs --offline
node docs/build.mjs
tests/e2e/run.sh
```

For every Node component touched, run its declared scripts only:
`npm run lint --if-present`, `npm run typecheck --if-present`,
`npm run build --if-present`, and `npm test --if-present`.

## Definition of done

The implementation matches `docs/ARCHITECTURE.md`; relevant tests pass; new
behavior has tests; docs and task status are current; UI work is checked on
`pi-round-480`, `pi-square-320`, and `pi-wide-800x480`; security-gated work has
both required reviews; remaining uncertainty is written as **UNKNOWN / NEEDS
DECISION** rather than being converted into an assumption.

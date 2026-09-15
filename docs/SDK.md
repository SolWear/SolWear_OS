# SDK and developer tooling

Architecture sections 5, 6, and 8 define the contract. Consult
[SOLWEAR_MAP.md](../SOLWEAR_MAP.md) for branch/live context and the existing
developer pages under `docs/pages/` for detailed usage.

## Runtime

`sdk/runtime` builds `@solwear/sdk` as ESM, declarations, browser bundle, and
global bundle. `solwear.ready()` receives app identity, granted capabilities,
screen metrics, and visibility from the shell. Typed clients cover system,
power, display, sensors, notifications, apps, wallet, and NFC; events are
`tick`, `visibility`, `button`, and `gesture`. The runtime never opens the
daemon socket: it calls the shell through the `solwear.bridge/1` postMessage
protocol and fails clearly when detached.

`layout()` publishes adaptive CSS variables and shape metadata. Apps must use
those values rather than a fixed panel size.

## CLI and extension

`sdk/cli` implements `new`, `build`, `run`, `package`, `keygen`, `sign`,
`verify`, `install`, `publish`, and `doctor`. It bundles apps with esbuild,
creates deterministic `.swa` ZIPs, and shares canonical signature behavior
with the daemon and registry validator. Private publisher keys belong outside
the repository.

`sdk/vscode` wraps the CLI's create/build/run/package/doctor flow and provides
a SolWear task type. It does not replace the CLI contract.

## Build order and checks

Build `sdk/runtime`, then `sdk/cli`, then apps and other Node components. Use:

```bash
./scripts/dev.sh setup
./scripts/dev.sh build
./scripts/dev.sh test
./scripts/dev.sh lint
```

Current package tests cover runtime bridge/layout behavior and CLI argument,
manifest, deterministic ZIP, signing rejection, and end-to-end developer-loop
behavior. **UNKNOWN / NEEDS DECISION:** version compatibility/deprecation
policy, public npm release ownership, third-party developer identity/onboarding,
and whether the extra main-branch RPC namespaces become binding v0.1 API.

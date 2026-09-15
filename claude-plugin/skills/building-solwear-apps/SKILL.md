---
name: building-solwear-apps
description: Build or modify SolWear OS apps and watchfaces using the real @solwear/sdk runtime, capability manifest, emulator, .swa packaging, Ed25519 signing, and registry publishing workflow. Use for any SolWear app, watchface, SDK, manifest, emulator, wallet, signing, or publishing task.
---

# Building SolWear apps

Use this guide as the self-contained SolWear v0.1 SDK reference. Prefer the typed `@solwear/sdk` client and the `solwear` CLI exactly as shown. Do not invent commands, flags, capabilities, RPC methods, or SDK signatures.

## Mental model

A SolWear app is ordinary TypeScript, HTML, and CSS bundled as browser content. The shell loads it into a sandboxed iframe. The app cannot access the shell DOM, other apps, their files, or the daemon's WebSocket. It communicates through `@solwear/sdk`, which uses `postMessage` to a shell bridge. The bridge and `solweard` both enforce the installed manifest's capability list.

Never open `ws://127.0.0.1:8730` from app code and never hand-write bridge messages. Use `@solwear/sdk`. Direct JSON-RPC is for platform components, not sandboxed apps.

The supported app types are:

- `app`: a full-screen launcher application.
- `watchface`: hosted in the watchface slot and expected to minimize continuous work.

Displays range from 240x240 through 800x480 and may be round, square, or rectangular. Always await the shell handshake, derive layout from `solwear.system.screen`, and use `layout()` to publish adaptive CSS variables.

## Start a project

The CLI requires Node.js 22 or newer. Install the public packages with:

```bash
npm install --global @solwear/cli
npm install @solwear/sdk
solwear doctor
```

`solwear new` already declares `@solwear/sdk`. Inside the SolWear monorepo, the CLI can resolve a built `sdk/runtime/dist` without installing the dependency in the generated app. Outside the monorepo, run `npm install` in the generated project.

Scaffold with one of the three real templates:

```bash
solwear new pulse-face --template watchface --id com.example.pulse-face --author "Example Team" --description "An adaptive heart-rate watchface."
cd pulse-face
```

Templates are exactly `app`, `watchface`, and `signer`; `app` is the default. Other supported `new` options are `--dir <path>`. The generated source entry is normally `src/main.ts`; the build produces `dist/app.js` and stages `index.html`, `manifest.json`, root `styles.css` or `app.css`, and `assets/`.

## Manifest contract

Keep `manifest.json` at the app root:

```json
{
  "id": "com.example.pulse-face",
  "name": "Pulse Face",
  "version": "1.0.0",
  "sdk": "0.1",
  "type": "watchface",
  "entry": "index.html",
  "icon": "assets/icon.png",
  "capabilities": ["system", "power", "sensors"],
  "author": "Example Team",
  "description": "An adaptive heart-rate watchface."
}
```

Rules enforced by the current CLI:

- `id` is required and must match `^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*)+$`: lowercase reverse-DNS with at least two segments, with the first segment beginning with a letter. Treat a published ID as immutable.
- `name`, `version`, `sdk`, `type`, and `capabilities` are required. Use semantic versions such as `1.0.0`; the implementation also accepts a semver prerelease or build suffix.
- `sdk` is `"0.1"` for this SDK line.
- `type` is only `"app"` or `"watchface"`.
- `entry` defaults to `index.html` in CLI validation, must remain inside the package, and must exist when packaging.
- `icon` is optional to the CLI, must remain inside the package, and must exist when declared. Use a square PNG of at least 192x192 for store-quality apps.
- `author` and `description` are accepted by the CLI and expected for store listings.
- `capabilities` is required even when empty. Duplicates and unknown names are rejected.

The only valid capabilities are:

| Capability | Typed SDK surface | Security impact |
| --- | --- | --- |
| `system` | `system.info()`, `time()`, `stats()`, `screen` | Device, time, screen, and runtime information |
| `power` | `power.status()` | Battery and charging information |
| `display` | `display.setBrightness(percent)` | Backlight control |
| `sensors` | `sensors.read(sensor)` | Health and device sensor readings |
| `notifications` | `notifications.list()`, `post(input)` | Reads the entire tray and can post |
| `apps` | `apps.list()`, `install()`, `uninstall()`, `launch()` | Can enumerate and change installed software |
| `wallet` | wallet lifecycle, activity, and signing methods | Public identity and protected signing flow |
| `nfc` | `nfc.status()`, `setEnabled()`, `walletRecord()`, `diagnostics()` | NFC state and wallet-sharing record |

Ask for the smallest set used by the code. A missing capability fails at runtime with JSON-RPC error `-32001`. Capabilities are fixed for an installed version; changing them requires rebuilding and reinstalling a new version.

## Typed runtime API

Initialize before reading the synchronous screen property:

```ts
import { layout, solwear } from "@solwear/sdk";

async function main(): Promise<void> {
  await solwear.ready();
  const metrics = layout(solwear.system.screen);
  console.log(solwear.appId, solwear.capabilities, solwear.visible, metrics.safeInset);
}

void main().catch(console.error);
```

`layout(screen, root?)` returns `{ width, height, shape, base, safeInset, rootFontSize, u }`. It sets `--sw-w`, `--sw-h`, `--sw-base`, and `--sw-safe`, sets the root font size, and adds `data-shape` to the root element. Size UI from these values, not fixed screen dimensions.

The exact client surface is:

```ts
await solwear.ready();

await solwear.system.info();
await solwear.system.time();
await solwear.system.stats();
solwear.system.screen; // synchronous only after ready()

await solwear.power.status();
await solwear.display.setBrightness(60); // number, clamped and rounded to 0..100
await solwear.sensors.read("heartRate");

await solwear.notifications.list();
await solwear.notifications.post({ title: "Done", body: "Sync finished" });

await solwear.apps.list();
await solwear.apps.install(source, { expectedSha256, expectedPublisherKey });
await solwear.apps.uninstall(appId);
await solwear.apps.launch(appId);

await solwear.wallet.publicKey();
await solwear.wallet.status();
await solwear.wallet.setPassphrase(passphrase, name);
await solwear.wallet.lock();
await solwear.wallet.unlock(passphrase);
await solwear.wallet.activity();
await solwear.wallet.signTransaction(message, { encoding: "base64", label: "Transfer" });

await solwear.nfc.status();
await solwear.nfc.setEnabled(true);
await solwear.nfc.walletRecord();
await solwear.nfc.diagnostics();
```

Important return shapes:

- `system.info()` -> `{ version, device, screen }`; `system.time()` -> `{ epochMs, timezone }`.
- `power.status()` -> `{ percent, charging, estimateMinutes }`.
- `sensors.read()` -> `{ sensor, value, unit, timestampMs }`. Known sensor names are `heartRate`, `steps`, `accelerometer`, `temperature`, and `ambientLight`; the client also permits future string names.
- `notifications.list()` returns `Notification[]`; `notifications.post()` returns the created ID string.
- `apps.list()` returns `AppRecord[]`; `apps.install()` returns `{ appId, version }`.
- `wallet.publicKey()` returns a base58 string; `wallet.activity()` returns `WalletActivity[]`; `wallet.signTransaction()` returns the signature string.
- `nfc.walletRecord()` returns `{ externalType: "solwear:wallet", payload: { version: 1, pubkey, network } }`.

Use `solwear.call<T>(method, params)` only as a forward-compatibility escape hatch for a daemon method added after the SDK release. Capability enforcement still applies. Do not use it in place of an available typed method.

## Events and efficient rendering

Subscribe with `on`, `once`, and `off`; `on` and `once` return unsubscribe functions.

```ts
const stopTick = solwear.on("tick", ({ epochMs, hours, minutes, seconds }) => {
  clock.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

solwear.on("visibility", ({ visible }) => {
  if (!visible) stopAnimations();
});

solwear.on("button", ({ button, action }) => {
  if (button === "side" && action === "press") openMenu();
});

solwear.on("gesture", ({ gesture, x, y }) => {
  if (gesture === "swipe-left") showNextPage();
});
```

`tick` is emitted once per second while visible and is the clock source. Do not drive a watchface clock with `setInterval(Date.now)`. Stop animations and slow polling when a `visibility` event says the app is hidden. Avoid layout thrash and heavy shadows; target 60 fps on a Pi 4.

Event values are:

- `button`: `back`, `select`, `side`, `up`, or `down`; action: `down`, `up`, `press`, or `longpress`.
- `gesture`: `swipe-left`, `swipe-right`, `swipe-up`, `swipe-down`, `tap`, `doubletap`, or `longpress`, plus normalized `x` and `y`.

## Complete adaptive example

`index.html` loads the staged build outputs, not TypeScript directly:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="stylesheet" href="styles.css" />
    <title>Pulse Face</title>
  </head>
  <body>
    <main class="screen"><div class="safe"><strong id="time">--:--</strong><span id="battery">--%</span></div></main>
    <script type="module" src="app.js"></script>
  </body>
</html>
```

`src/main.ts`:

```ts
import { layout, solwear } from "@solwear/sdk";

const time = document.querySelector<HTMLElement>("#time")!;
const battery = document.querySelector<HTMLElement>("#battery")!;
const pad = (n: number) => String(n).padStart(2, "0");

async function refreshBattery(): Promise<void> {
  const state = await solwear.power.status();
  battery.textContent = `${state.percent}%${state.charging ? " +" : ""}`;
}

async function main(): Promise<void> {
  await solwear.ready();
  layout(solwear.system.screen);
  window.addEventListener("resize", () => layout(solwear.system.screen));

  let ticks = 0;
  solwear.on("tick", ({ hours, minutes }) => {
    time.textContent = `${pad(hours)}:${pad(minutes)}`;
    if (ticks++ % 30 === 0) void refreshBattery();
  });
  await refreshBattery();
}

void main().catch((error: unknown) => {
  document.body.textContent = error instanceof Error ? error.message : String(error);
});
```

`styles.css`:

```css
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #050608; color: white; }
.screen { width: 100%; height: 100%; display: grid; place-items: center; padding: var(--sw-safe); }
.safe { display: flex; flex-direction: column; align-items: center; gap: calc(var(--sw-base) * 0.03); }
#time { font: 300 calc(var(--sw-base) * 0.22)/1 system-ui; font-variant-numeric: tabular-nums; }
#battery { font: 500 calc(var(--sw-base) * 0.05)/1 system-ui; }
:root[data-shape="rect"] .safe { flex-direction: row; }
```

## Wallet safety

The device wallet private key stays inside `solweard`; no SDK call returns it. `wallet.signTransaction()` takes a serialized transaction message string. The default encoding is base64; supported explicit encodings are `base64`, `base58`, and `hex`. The SDK supplies the current app ID.

Every signing request must show a shell-owned confirmation prompt and requires affirmative on-device action. Apps cannot style, cover, pre-answer, or bypass it. A decline returns `SolwearRpcError` code `ERR_USER_REJECTED` (`-32002`) and is a normal outcome:

```ts
import { ERR_USER_REJECTED, SolwearRpcError, solwear } from "@solwear/sdk";

try {
  const signature = await solwear.wallet.signTransaction(serializedMessage, {
    encoding: "base64",
    label: "Approve transfer",
  });
  showSignature(signature);
} catch (error) {
  if (error instanceof SolwearRpcError && error.code === ERR_USER_REJECTED) {
    showStatus("Declined on the watch");
  } else {
    throw error;
  }
}
```

Do not confuse the device's Solana wallet with the publisher key used to sign `.swa` packages. They are separate security domains.

## Build and emulate

From the app directory:

```bash
solwear build
solwear run --profile pi-round-480
solwear run --profile pi-square-320
solwear run --profile pi-wide-800x480
```

`build` accepts `--watch`, `--minify`, `--sourcemap`, and an optional project-directory positional. Source maps are on by default; although the implementation reads `--no-sourcemap`, its unknown-flag guard currently rejects that flag, so do not use it. `run` builds unless `--no-build` is set. Its implemented flags are `--profile`, `--list-profiles`, `--qemu`, `--port`, `--rpc-port`, `--no-window`, `--shell`, `--no-build`, and `--image` (QEMU). The host and QEMU emulators are part of the SolWear monorepo, not the published CLI package. The current implementation locates them only by walking a checkout; despite its error hint, it does not read `SOLWEAR_HOME`.

Use the fast host emulator for app work. Use `solwear run --qemu` for the real ARM64 image and production daemon. Test adaptive UI on every shipped profile. Use `solwear run --list-profiles` to read the current checkout rather than assuming a custom profile is supported.

The current CLI does **not** implement `--hal-script`, despite a stale example in `docs/pages/using-the-emulator.md`. Do not pass that flag. There is also no CLI command that captures screenshots, clicks the emulator, or performs automated visual assertions; use available environment/UI tools separately when needed.

## Package, sign, verify, publish

The complete release loop is:

```bash
solwear build --minify
solwear package --no-build
solwear keygen --out ~/.solwear/publisher.key.json
solwear sign --key ~/.solwear/publisher.key.json --package dist/com.example.pulse-face-1.0.0.swa
solwear verify dist/com.example.pulse-face-1.0.0.swa
solwear publish --package dist/com.example.pulse-face-1.0.0.swa
```

Run `keygen` once per publisher, not once per release. Its default output is `~/.solwear/publisher.key.json`, mode 0600. Never commit it and back it up. Do not use `--force` unless the user explicitly intends to replace a publisher identity. `sign` also accepts PEM PKCS#8 Ed25519 keys and Solana CLI JSON keypairs.

`solwear package` creates a deterministic ZIP named `dist/<id>-<version>.swa` by default. It excludes existing `.swa`, source maps, and `.DS_Store`. Store distribution requires `signature.json`; an unsigned developer sideload requires the explicit `solwear install --device <host> --package <file.swa> --allow-unsigned` path and a device in developer mode.

Signing hashes every archive file except `signature.json` with SHA-256, sorts paths, prefixes `SolWear .swa signature v1\n`, and Ed25519-signs the canonical digest listing. `signature.json` holds the raw 32-byte public key and raw 64-byte signature as base64. `solwear verify <file.swa>` checks the manifest, exact file set, hashes, and signature. It accepts `--key <base64-public-key>` to pin the expected publisher key; this is a public-key value, not a key-file path.

Always give `publish` the already signed artifact with `--package`. Without it, the implementation may call `package` again and replace the expected file with an unsigned archive before verifying it. Other publish flags are `--url`, `--registry`, `--publisher`, `--no-build`, and `--dry-run`.

`publish` does not upload the `.swa`, commit changes, push a branch, or open a pull request. It writes `dist/registry-entry.json`; when it can locate the monorepo registry and is not in `--dry-run`, it appends the entry to `store/registry/index.json`. Otherwise it prints the entry for manual insertion. Upload the signed package to its registry URL and submit the registry change separately. Published ID/version pairs are immutable, so bump `manifest.json` before another release.

There is no combined release command. There is no CLI command to upload the package or create the pull request. Do not claim `publish` completes those actions.

## CLI truth table

These are all implemented commands:

| Command | Purpose |
| --- | --- |
| `solwear new` | Scaffold `app`, `watchface`, or `signer` |
| `solwear build` | Bundle TypeScript and stage `dist/` |
| `solwear run` | Build and launch host emulator, or QEMU with `--qemu` |
| `solwear package` | Create the deterministic `.swa` |
| `solwear keygen` | Generate an Ed25519 publisher key |
| `solwear sign` | Add or replace `signature.json` |
| `solwear verify` | Inspect and cryptographically verify a `.swa` |
| `solwear install` | Package and push to a watch over SSH |
| `solwear publish` | Prepare or merge a registry entry |
| `solwear doctor` | Check required and optional tooling |

Use `solwear <command> --help` before applying unusual options. If a desired operation is absent from this table or the command's help, explain the gap instead of fabricating a command.

# SolWear host emulator

The host emulator runs the real SolWear shell and app bundles against a
protocol-compatible mock daemon. It needs Node.js 22 or newer; it does not need
Rust, QEMU, Electron, or wearable hardware.

## Start in one command

From a fresh clone, run:

```sh
npm --prefix emulator/host start
```

On the first run this installs the SDK/CLI build dependencies and builds the
bundled watchface automatically. Later starts reuse those outputs. The emulator
opens an app-mode Chrome, Chromium, Edge, Brave, or Arc window when one is
available and otherwise opens the system browser. Set `SOLWEAR_BROWSER` to a
browser executable or command if auto-detection misses yours.

The servers bind only to `127.0.0.1`. The defaults deliberately match a real
watch: HTTP on 8731 and JSON-RPC WebSocket on 8730. Press Ctrl+C in the starting
terminal to stop both listeners.

## Run your own app

The normal developer loop is `solwear new`, then `solwear run`. Inside this
monorepo, an existing first-party app can be launched directly:

```sh
npm --prefix sdk/runtime install
npm --prefix sdk/runtime run build
npm --prefix sdk/cli install
npm --prefix sdk/cli run build
npm --prefix apps/signer run build
npm --prefix emulator/host start -- --app ../../apps/signer/dist
```

Useful options:

```text
--profile pi-round-480   choose a device profile
--list-profiles         list all bundled profiles
--no-window             print the URL without opening a browser
--port 0 --rpc-port 0   choose collision-free ephemeral ports
--shell <directory>     use a particular built shell
--mock <file.json>      override deterministic mock-HAL values
--no-build              fail instead of preparing a missing default demo
```

Run `npm --prefix emulator/host start -- --help` for the complete list.

## Developer cockpit

The right-hand panel can change battery state, charging, NFC, brightness,
steps, heart rate, temperature, and ambient light while the app is running. It
can inject a notification, reset the HAL to its profile defaults, and display
recent RPC calls and errors. Switching the device profile reloads the shell at
the new geometry without restarting the emulator.

Mock sensor drift is deterministic. The wallet is throwaway and regenerated on
every start; never send funds to its address. Signing still requires an
affirmative confirmation through the shell, matching the real daemon.

The host mock intentionally does not unpack/install `.swa` files. Use
`solwear run` for the package's project, QEMU for a full Linux install path, or
`solwear install --device` for hardware. All other implemented RPC methods,
validation rules, error codes, and event routing are kept compatible with
`solweard`.

## Tests

Build the artifacts used by the startup tests, then run the suite:

```sh
npm --prefix sdk/runtime install && npm --prefix sdk/runtime test
npm --prefix sdk/cli install && npm --prefix sdk/cli test
npm --prefix apps/watchface install && npm --prefix apps/watchface run build
npm --prefix os/shell install && npm --prefix os/shell run build
(cd emulator/host && node --test test/*.test.mjs)
```

The host package itself has no runtime dependencies. If a port is busy, stop
the other emulator/daemon or pass both `--port` and `--rpc-port`. If no browser
opens, copy the printed HTTP URL into any current browser.

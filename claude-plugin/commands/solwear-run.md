---
description: Build and run the current SolWear app in the host emulator or QEMU
argument-hint: [--profile name] [--list-profiles] [--no-build] [--no-window] [--port n] [--rpc-port n] [--qemu] [--image path]
allowed-tools: Bash
---

# Run a SolWear app

Run the actual emulator command:

```bash
solwear run $ARGUMENTS
```

With no flags this builds and opens the fast host emulator using `pi-round-480`. For adaptive UI checks, run separate sessions with `--profile pi-round-480`, `--profile pi-square-320`, and `--profile pi-wide-800x480`. Use `--list-profiles` for the checkout's complete list and `--qemu` only for full ARM64-image validation. `--no-build` reuses `dist/`; `--no-window` serves and prints the host-emulator URL.

The emulator is not shipped in the public CLI package: it requires a SolWear monorepo checkout. The CLI has no `--hal-script` flag, screenshot command, or automated visual-assertion command. Do not invent one.

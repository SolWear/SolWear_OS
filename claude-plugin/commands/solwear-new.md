---
description: Scaffold a SolWear app, watchface, or signer from the real CLI template
argument-hint: <name> [--template app|watchface|signer] [--id reverse.dns] [--author name] [--description text] [--dir path]
allowed-tools: Bash
---

# Create a SolWear project

Run the real scaffold command with the user's arguments:

```bash
solwear new $ARGUMENTS
```

Before running, require a project name and confirm that `--template`, when present, is exactly `app`, `watchface`, or `signer`. Do not overwrite a non-empty target. After creation, report the generated directory and remind the user to work from it. If the app is outside the SolWear monorepo, run `npm install` there before building; inside a built monorepo checkout the CLI resolves `sdk/runtime/dist` directly.

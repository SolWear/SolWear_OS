---
description: Verify a signed SolWear package and prepare its store registry entry
argument-hint: --package file.swa [--url href] [--registry path] [--publisher name] [--dry-run]
allowed-tools: Bash
---

# Prepare a SolWear publication

Require the exact signed `.swa` path and verify it first:

```bash
solwear verify <signed-file.swa>
```

Then run the user's arguments, which must contain exactly one `--package <signed-file.swa>` selecting that same artifact:

```bash
solwear publish $ARGUMENTS
```

Passing `--package` matters because an implicit publish can rebuild the normal package path, removing its signature before verification.

Report exactly what occurred. `publish` writes `dist/registry-entry.json`. In a monorepo with a discoverable registry, it can append to `store/registry/index.json`; with `--dry-run` or no local registry it prints manual instructions. It does not upload the `.swa`, make a git commit, push, or open a pull request. Those steps remain manual and must not be claimed as complete.

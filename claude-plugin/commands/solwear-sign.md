---
description: Package, Ed25519-sign, and verify a SolWear .swa artifact
argument-hint: [--key path] [--package file.swa] [--out file.swa]
allowed-tools: Bash
---

# Sign a SolWear package

Find the package path from `manifest.json` as `dist/<id>-<version>.swa`. If it does not exist, run:

```bash
solwear package
```

If the selected key does not exist, explain that a publisher key can be created once with:

```bash
solwear keygen --out ~/.solwear/publisher.key.json
```

Never add `--force` unless the user explicitly wants to replace an existing publisher key. Then sign using the user's arguments, defaulting to the standard key and current project's package when omitted:

```bash
solwear sign $ARGUMENTS
```

Finally verify the exact signed output:

```bash
solwear verify <signed-file.swa>
```

`--key` on `sign` is a private-key file path. By contrast, `--key` on `verify` is an optional Base64 public-key value, not a file path. Never commit or print the private key file's contents.

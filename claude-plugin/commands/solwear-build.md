---
description: Bundle a SolWear project's TypeScript and stage its package contents in dist
argument-hint: [project-directory] [--watch] [--minify] [--sourcemap]
allowed-tools: Bash
---

# Build a SolWear project

From the app directory, or with an optional project-directory positional, run:

```bash
solwear build $ARGUMENTS
```

The command finds `manifest.json`, bundles the first supported source entry into `dist/app.js`, and stages the manifest, HTML entry, root stylesheet, and assets. Use `--watch` only when the user wants a long-running rebuild process. Source maps are enabled by default. Do not pass `--no-sourcemap`: the current command rejects it as unknown. Report build errors without masking them; manifest capability or entry errors must be corrected at their source.

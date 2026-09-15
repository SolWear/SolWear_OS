# SolWear plugin for Claude Code

This plugin gives Claude the SolWear v0.1 app model and SDK inline: TypeScript/HTML/CSS apps in a capability-gated iframe, the exact `@solwear/sdk` client, adaptive layout rules, the real `solwear` CLI, deterministic `.swa` packaging, Ed25519 publisher signing, and the registry publication boundary.

It has no MCP server and does not contact a service of its own. It teaches Claude to operate the CLI already installed on your machine.

## Install and try locally

From the SolWear OS repository root, install/build the SDK toolchain if needed:

```bash
for p in sdk/runtime sdk/cli; do npm --prefix "$p" install && npm --prefix "$p" run build; done
npm link ./sdk/cli
solwear doctor
```

Load this plugin directly for a Claude Code session:

```bash
claude --plugin-dir ./claude-plugin
```

During plugin development, run `/reload-plugins` after edits. Validate it with:

```bash
claude plugin validate ./claude-plugin --strict
```

A durable `/plugin install` requires placing this directory in a Claude Code plugin marketplace. This repository intentionally ships the standalone plugin directory, not a marketplace catalog; `--plugin-dir` is the supported local installation path.

## What it adds

- [`building-solwear-apps`](skills/building-solwear-apps/SKILL.md): the complete app, manifest, runtime API, events, security, emulator, packaging, signing, verification, and publishing reference.
- [`solwear-new`](commands/solwear-new.md): scaffold an `app`, `watchface`, or `signer`.
- [`solwear-build`](commands/solwear-build.md): bundle and stage `dist/`.
- [`solwear-run`](commands/solwear-run.md): start the host emulator or QEMU using implemented flags.
- [`solwear-sign`](commands/solwear-sign.md): package if needed, sign with an Ed25519 publisher key, and verify.
- [`solwear-publish`](commands/solwear-publish.md): prepare a registry entry from an explicitly selected signed artifact.
- [`solwear-app-builder`](agents/solwear-app-builder.md): a focused subagent that turns a one-line idea into a scaffolded, adaptive, built, emulator-smoked, packaged, signed, and verified app.

Plugin commands and skills are namespaced by the manifest name. In Claude Code, invoke commands such as:

```text
/solwear:solwear-new pulse-face --template watchface
/solwear:solwear-build --minify
/solwear:solwear-run --profile pi-round-480
/solwear:solwear-sign --key ~/.solwear/publisher.key.json
/solwear:solwear-publish --package dist/com.example.pulse-face-1.0.0.swa --dry-run
```

Claude can also select the `solwear-app-builder` agent automatically or through the agents interface.

## Accuracy boundaries

The plugin follows `sdk/cli/src` and `sdk/runtime/src` in this checkout where prose documentation differs. In particular, the current CLI has no `--hal-script` option, and `solwear publish` does not upload a package or create a pull request. The requested documentation path `docs/pages/working-with-the-wallet.md` is absent in this checkout; wallet guidance is grounded in the runtime client/types, the architecture specification, and the capabilities/security documentation instead.

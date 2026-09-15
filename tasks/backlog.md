# Backlog

Items here need architecture/product decisions before assignment.

## SOLWEAR-001 — Reconcile implemented RPC extensions with the v0.1 contract

**Outcome:** every public RPC implemented on `main` is either defined in the
binding architecture or removed/held behind an explicitly approved boundary.

**Evidence:** `os/solweard/src/rpc.rs` implements `system.network`,
`display.getBrightness`, and `nfc.status`, `nfc.setEnabled`,
`nfc.walletRecord`, and `nfc.diagnostics`, none of which appear in architecture
section 4.2. `SOLWEAR_MAP.md` also records `wallet.generate` on
`deviverr/pi-ethernet-connect-run`; it is absent from current `main`.

**Proposed surfaces:** architecture/spec task first; then daemon, SDK, shell,
emulator, docs/tests in separate Orca worktrees with an explicit integration
order. Signing/identity additions are security-gated.

**Acceptance:** one Human-approved method list; matching daemon/runtime/mock
implementations; capability and contract tests; e2e evidence; API docs updated;
security review plus second human review for wallet/signing scope.

**UNKNOWN / NEEDS DECISION:** retain and specify the existing extensions,
remove them from v0.1, or stage them for a later API version. Decide separately
whether `wallet.generate` belongs in v0.1 and define its lifecycle/recovery UX.

## Unscoped candidates

- Fix the release workflow's image builder path probe.
- Implement and physically validate the PN532 Type 4 worker.
- Define production hardware and secure Ed25519 architecture.
- Define registry hosting, revocation, and publisher recovery.
- Add adaptive-layout visual regression evidence.

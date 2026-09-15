# Security

This is an implementation guide, not a security certification or claim of
production readiness. The binding requirements are in architecture sections
4, 5, 6, 10, and 12. Current locations and operational warnings are in
[SOLWEAR_MAP.md](../SOLWEAR_MAP.md).

## Trust boundaries in current code

- `solweard` owns the device wallet and app lifecycle. The default state path
  is `/var/lib/solwear`; the wallet file is owner-only (`0600` on Unix).
- An initial raw 32-byte development seed can be upgraded with
  `wallet.setPassphrase` to an Argon2id-derived, ChaCha20-Poly1305 authenticated
  encrypted document. Locking removes the signing key from active state.
- Every `wallet.signTransaction` call is expected to reach the shell's on-screen
  confirmation path. Rejection or timeout must not sign.
- App iframes use `sandbox="allow-scripts"` without same-origin access. The
  shell identifies the source frame, stamps the app id, checks the namespace
  capability, and brokers JSON-RPC; the daemon independently enforces it and
  uses `-32001` for denial.
- Store installs pin the whole-archive SHA-256 and publisher key, validate the
  manifest and portable paths, require a complete per-file hash set, and verify
  the v1 Ed25519 signature. Unsigned local sideload behavior is distinct from
  trusted remote/store installation.
- RPC and static services bind to loopback by default. App and shell documents
  receive separate CSP handling in `os/solweard/src/server.rs`.

## Mandatory review gate

Any change to keystore material, signing or confirmation, package signatures,
registry trust pins, capability enforcement, app identity, iframe sandboxing,
CSP, or postMessage brokerage requires both a security review and a second
human reviewer. Run the relevant unit, rejection-path, registry, and e2e tests.
Never put real signing keys or live credentials in the repository or output.

## Known limitations

- The Raspberry Pi is a development target, not certified secure hardware.
- The master map records the live Pi wallet as currently unprotected. A human
  must set a passphrase before production-like use.
- The emulator wallet is intentionally ephemeral and its simplified password
  behavior is not evidence of device keystore strength.
- Blind-signing risk remains: key isolation alone does not prove the user saw a
  complete and accurate transaction interpretation.
- PN532 Type 4 exchange is not implemented/validated on physical hardware.

## UNKNOWN / NEEDS DECISION

Production secure-element/Ed25519 architecture, verified/secure boot chain,
disk/flash encryption, transaction clear-signing and simulation UX, recovery
and backup, update signing/rollback, key rotation/revocation, vulnerability
response ownership, privacy/data retention, threat model, penetration testing,
and certification are not settled. In particular, do not claim ATECC608A
natively performs Solana Ed25519 signing.

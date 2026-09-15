# SolWear Security and Information Audit

Audit date: 2026-09-15  
Audited worktree: `/Users/dev/orca/workspaces/SolWear/wt-audit` (`codex/audit-clean`, commit `52d6e79`)  
Read-only comparison locations:

- `/Users/dev/orca/workspaces/SolWear/solwear-mono` (`main`, commit `65e8b93`)
- `/Users/dev/Projects/SolWear` (`main`, commit `18c28b3`)

`/Users/dev/Projects/SolWear/SolWear_OLD` was excluded as requested. Findings are
based on tracked files, tracked history, targeted credential patterns, obvious
security-sensitive code/configuration, documentation, marketing copy, local-link
validation, selected live-link checks, and npm's advisory database. No live
systems were changed.

## Executive summary

| Severity | Count |
| --- | ---: |
| Confirmed credential/key leaks | 0 |
| Critical | 1 |
| High | 4 |
| Medium | 7 |
| Low | 10 |

The most urgent fixes are to update the website's vulnerable Next.js dependency,
authenticate the privileged `solweard` shell channel, require an unlocked device
and explicit user approval for the Android HCE signing path, and remove security
claims that promise transaction details the current confirmation UI does not show.

## Credential and key leak scan

### No confirmed committed secrets

**Locations:** all three scoped repositories and their reachable Git history.

No private-key headers, AWS access-key identifiers, Google API keys, Stripe live
keys, GitHub tokens, Slack tokens, OpenAI-style keys, JWTs, password assignments,
or key-shaped credential files were found in tracked content/history by the
targeted patterns. No real `.env` file is tracked in the audited checkouts.

The Ed25519 values in `store/registry/index.json:13,25,37,49` are publisher
**public** keys, and the Turnstile value described in `SOLWEAR_MAP.md:57` is a
public site key; neither is a secret. No secret value is reproduced in this
report.

## Critical

### C-1 — Website production dependency has known critical vulnerabilities

**Location:** `solwear-mono`  
**Evidence:** `website/package-lock.json:1560-1561` locks Next.js `15.5.15`.
`npm audit --omit=dev` reported 1 critical and 3 high production findings: the
direct Next.js dependency is critical, with transitive high findings in `nanoid`
(`website/package-lock.json:1537-1538`), `postcss`
(`website/package-lock.json:1742-1743`), and `sharp`
(`website/package-lock.json:2126-2127`).

**Impact:** The advisory set includes denial of service, cache poisoning,
middleware/proxy bypass, XSS, SSRF, endpoint disclosure, and platform-dependent
RCE conditions. Exact exploitability depends on the deployment configuration,
but a public Next.js site should not remain on an affected release.

**Recommended action:** Upgrade Next.js and the lockfile to currently patched
versions, rerun `npm audit --omit=dev`, build the production image, and regression
test middleware, redirects, Server Components, image handling, and all API routes.

## High

### H-1 — Unauthenticated WebSocket callers become the privileged shell and can approve signing prompts

**Location:** this repository  
**Evidence:** `os/solweard/src/server.rs:45-61` treats a connection with no
`appId` as privileged; there is no credential or `Origin` check.
`os/solweard/src/state.rs:198-215` broadcasts shell events to every such client,
and `os/solweard/src/rpc.rs:289-296` accepts `shell.confirmResponse` from that
channel. The limitation is disclosed only as a generic loopback trust assumption
in `docs/pages/capabilities-and-security.md:169-173`.

**Impact:** Any process that can reach the loopback socket can obtain shell
privilege, observe pending confirmation identifiers, call lifecycle/keystore
methods, and submit an affirmative confirmation without the physical UI. Lack of
WebSocket origin validation also unnecessarily exposes the boundary to browser
origin/DNS-rebinding classes of attack where platform controls permit loopback
access.

**Recommended action:** Authenticate a single shell session with a short-lived,
owner-only token or Unix-domain socket; reject unapproved WebSocket origins; do
not infer privilege from an omitted query parameter; bind confirmations to the
authenticated shell instance. This touches signing/capability enforcement and
requires the mandated security review and second human reviewer.

### H-2 — Android HCE signs while the phone is locked and without explicit approval

**Location:** `solwear-mono`  
**Evidence:** `mobile/app/src/main/res/xml/apdu_service.xml:2-4` sets
`android:requireDeviceUnlock="false"`. Incoming NFC data reaches
`tryProcessSignRequest` at
`mobile/app/src/main/java/com/example/solvare/terminal/nfc/SolvareHostApduService.kt:138-176`,
which signs immediately at line 173 without a user-authentication or confirmation
gate.

**Impact:** A nearby NFC reader can request signatures from the HCE-held key while
the phone is locked. If this key is treated as a wallet/device identity, physical
proximity is enough to authorize arbitrary payloads.

**Recommended action:** Set `requireDeviceUnlock` to true, require an explicit
foreground confirmation showing decoded transaction details, apply biometric or
device-credential authentication where appropriate, expire challenges, and bind
each approval to the exact bytes and peer/session.

### H-3 — The wearer is asked to approve an opaque digest, contrary to the security documentation

**Location:** this repository  
**Evidence:** the daemon builds only an app id, byte count, encoding, digest,
public key, and caller-supplied label in `os/solweard/src/rpc.rs:395-409`; the UI
shows only account, payload length, and digest in `os/shell/src/shell.ts:603-623`.
This contradicts the claim that the prompt shows “what the decoded transaction
does” in `docs/pages/capabilities-and-security.md:118-121` and the trust claim in
`README.md:5-6`.

**Impact:** This is blind signing. A user cannot verify recipient, amount,
program, network, or instruction intent before approving. The documentation may
cause users and reviewers to rely on a protection that is not implemented.

**Recommended action:** Until a strict Solana transaction decoder and clear-sign
UI exist, state plainly that v0.1 approves opaque payloads/digests and is not a
hardware-wallet security boundary. Implement parsing with fail-closed handling
for unknown instructions before restoring the stronger claim.

### H-4 — Public product copy overstates the prototype's security and confirmation behavior

**Location:** `solwear-mono`  
**Evidence:** `website/src/lib/siteContent.ts:94-107` and
`website/src/app/product/page.tsx:68-73` claim “hardware-wallet security” and
wrist approval. `README.md:9,19,25-28,48` repeats secure-hardware-wallet and
user-confirmation claims. These are inconsistent with H-2 and with the current
OS's opaque confirmation described in H-3. The live site also claimed, when
checked on 2026-09-15, that amount, recipient, and action are shown before
signing.

**Impact:** Users may entrust funds to a development prototype under materially
stronger assurances than the implementation supports. This is a safety,
reputational, and potentially regulatory risk.

**Recommended action:** Replace categorical claims with prototype-qualified
language and enumerate the current limits: no certified secure element, no
clear-sign transaction decoder, development-grade storage, and incomplete NFC
confirmation. Restore stronger copy only after independently verified controls
ship.

## Medium

### M-1 — New OS wallets begin as unencrypted raw seeds

**Location:** this repository  
**Evidence:** `os/solweard/src/wallet.rs:54-76,100-108` loads or creates a raw
32-byte seed and starts unlocked/unprotected. The file is correctly restricted to
mode `0600` at `os/solweard/src/wallet.rs:264-294`, but encryption occurs only
after `wallet.setPassphrase`.

**Impact:** Filesystem/root access, removable-media access, or an image backup
made before passphrase setup exposes the signing seed. This is materially weaker
than typical “hardware-wallet security” expectations.

**Recommended action:** Make protected onboarding mandatory before wallet use, or
clearly mark the generated identity as development-only and unable to hold funds.
Do not rotate the existing live key as part of a code change; the owner must
protect or replace it intentionally.

### M-2 — App installation accepts weakly bound sources and arbitrary signer identities

**Location:** this repository  
**Evidence:** `os/solweard/src/apps.rs:295-342` accepts local paths, `file://`,
plain HTTP, HTTPS, and redirects. `os/solweard/src/rpc.rs:197-220` makes the hash
and expected publisher optional, while `apps/store/src/main.ts:6` exposes all
three as user-entered fields.

**Impact:** A package can be cryptographically self-consistent yet signed by an
untrusted key. Plain HTTP/redirects add downgrade and server-side request risks;
local paths expand the daemon's file-reading attack surface. A caller with the
broad `apps` capability can install such code outside the registry trust chain.

**Recommended action:** Split trusted store installation from developer
sideloading. Require HTTPS, an expected hash, and an expected publisher for the
store path; restrict redirects and private/loopback destinations; gate local and
unsigned sources behind an explicit local developer mode unavailable to apps.

### M-3 — Android logs transaction payloads, APDUs, and signature material

**Location:** `solwear-mono`  
**Evidence:**
`mobile/app/src/main/java/com/example/solvare/terminal/nfc/SolvareHostApduService.kt:46-53`
logs the full incoming APDU, line 163 logs the full signing-request JSON, and
line 176 logs the first 20 Base64 signature characters.

**Impact:** ADB/logcat collection, diagnostics, or another privileged app can
capture transaction contents and reusable signatures. The logging persists even
though the latest commit is described as a logging-leak fix.

**Recommended action:** Remove payload/signature/APDU-body logging entirely;
retain only event type, bounded sizes, and non-sensitive correlation ids behind
a debug-only guard.

### M-4 — Android wallet material is eligible for backup/transfer

**Location:** `solwear-mono`  
**Evidence:** `mobile/app/src/main/AndroidManifest.xml:15-18` enables backup.
`mobile/app/src/main/res/xml/backup_rules.xml:8-12` and
`mobile/app/src/main/res/xml/data_extraction_rules.xml:6-17` are uncustomized
templates and do not exclude the encrypted preference/keyset used by
`TerminalKeyManager.kt:16-26,55-67`.

**Impact:** Ciphertext/key metadata may enter cloud backup or device-transfer
flows, causing unnecessary exposure and unreliable restoration when the Android
Keystore key is unavailable.

**Recommended action:** Explicitly exclude wallet preferences and AndroidX
Security keyset files from cloud backup and device transfer; test backup/restore
behavior. Consider a current Keystore-backed design because the used AndroidX
encrypted-preferences API is deprecated.

### M-5 — The checked-out website cannot represent its documented server deployment

**Location:** `solwear-mono`  
**Evidence:** `website/src/app/api/notify/route.ts:4` imports a missing
`@/lib/server/db`; `website/src/app/api/pinboard/route.ts:2-4` imports missing
`db`, `rateLimit`, and `session` modules. Only `turnstile.ts` is tracked under
`website/src/lib/server`. In addition, `website/next.config.mjs:2-5` selects a
static export and `/solwear` base path while `website/Dockerfile:20-27` expects a
`.next` server and the source contains Node API routes.

**Impact:** A clean build is expected to fail or produce a deployment unlike the
documented VPS-backed application. Security fixes may exist only in an untracked
or different checkout, leaving `main` unreproducible and unauditable.

**Recommended action:** Reconcile and commit the intended server modules,
middleware, and deployment configuration on the canonical branch; remove static
export settings for the server build; make CI build the exact Docker target.

### M-6 — Waitlist endpoint has abuse and privacy weaknesses

**Location:** `solwear-mono`  
**Evidence:** `website/src/app/api/notify/route.ts:9-19` parses an unbounded JSON
body, performs only `includes("@")` validation, and trusts client-visible
`x-forwarded-for`; unlike the pinboard, it has no rate limit. Lines 31-35 create a
second plaintext email ledger in `db/emails.txt` without a retention policy.

**Impact:** Request/body abuse can consume resources; spoofed proxy headers
weaken IP controls and Turnstile telemetry; duplicate plaintext PII increases
breach and retention scope.

**Recommended action:** Enforce request-size limits and robust email length/
syntax constraints, rate-limit at the trusted edge and application layer, accept
forwarding headers only from the known proxy, and keep one access-controlled
database with a documented deletion/retention policy.

### M-7 — Tracked hub map exposes unnecessary live-infrastructure reconnaissance data

**Location:** hub materials  
**Evidence:** `SOLWEAR_MAP.md:34-59` records the live host address, usernames,
privilege notes, exact service/storage paths, container/proxy topology, internal
device address, key filenames, security state, and Turnstile configuration.
`SOLWEAR_MAP.md:47` and `docs/SECURITY.md:38-40` state that the live Pi wallet is
unprotected.

**Impact:** No credential value is disclosed, but a public repository gives an
attacker a detailed target map and confirms a high-value wallet is unprotected
at rest.

**Recommended action:** Move operational inventory to an access-controlled runbook;
keep only non-sensitive architecture in the public tree. A human should set the
live wallet passphrase or intentionally replace the development wallet, then
update the status without publishing access details.

## Low

### L-1 — Three clone links use a 404 repository slug

**Location:** this repository  
**Evidence:** `README.md:98`, `docs/pages/getting-started.md:30-31`, and
`docs/pages/installing-the-sdk.md:147-148` use
`https://github.com/SolWear/solwear-os`. It returned HTTP 404 on 2026-09-15;
the configured repository URL is `https://github.com/SolWear/solwear_os`, which
returned HTTP 200.

**Recommended action:** Replace the hyphenated slug with `solwear_os` and keep the
checkout directory name consistent.

### L-2 — Published registry URLs point at an unavailable package host

**Location:** this repository  
**Evidence:** `store/registry/index.json:10,22,34,46` uses
`packages.solwear.tech`; `store/registry/README.md:30-36` admits nothing is hosted
there. The host did not resolve during the 2026-09-15 check.

**Impact:** Online installation and `verify-packages.mjs --no-packages-dir` fail
despite the entries looking published.

**Recommended action:** Host the immutable files before presenting the entries as
published, or mark the registry explicitly development/offline-only.

### L-3 — First-party app counts disagree

**Location:** this repository  
**Evidence:** `README.md:13` says five first-party apps;
`docs/pages/index.md:8-12` says three; `store/registry/README.md:30-31` says three;
`store/registry/index.json:3-51` has four version entries for three unique app ids,
while `apps/` contains five products.

**Recommended action:** Distinguish “source apps,” “published app identities,” and
“registry versions,” then use the correct count consistently.

### L-4 — Contributor prerequisites contradict repository policy and layout

**Location:** this repository  
**Evidence:** `CONTRIBUTING.md:30-32` says Node 20+ and npm workspaces, while the
governing hub rules require Node 22+ and `CONTRIBUTING.md:44-47` itself says the
packages are independent.

**Recommended action:** State Node 22+ and remove the workspace claim.

### L-5 — Clean CI skips one emulator integration test due to component order

**Location:** this repository  
**Evidence:** `.github/workflows/ci.yml:147-160` prioritizes only SDK runtime/CLI;
the remaining lexical order runs `emulator/host` before `os/shell`. The test run
in this audit skipped “emulator prefers the shell the OS team builds” until the
shell was built; rerunning afterward passed 10/10.

**Recommended action:** Build `os/shell` before `emulator/host`, or make the test
prepare its required shell artifact.

### L-6 — The requested website environment example is absent and examples are ignored

**Location:** `solwear-mono`  
**Evidence:** no tracked `website/.env.local.example` exists in current history.
`website/.gitignore:26-28` ignores `.env*.local` with no exception. Required
variables appear only implicitly in `website/src/lib/server/turnstile.ts:1-4`
and public components.

**Recommended action:** Add a tracked, placeholder-only `.env.example` (or add a
specific negation rule), documenting required/optional variables and safe local
defaults. Never add real values.

### L-7 — Legacy profile copy contradicts both the monorepo and binding architecture

**Location:** `solwear-mono`  
**Evidence:** `profile/README.md:18-42` describes an RP2040/PlatformIO product;
lines 80-91 say real signing is not implemented; line 116 says every project is
private. The monorepo root `README.md:34-48` describes an ESP32-S3 signing
prototype, the repository is public, and the binding OS architecture targets
Raspberry Pi 4/5 Linux.

**Recommended action:** Label this file as archived historical copy or replace it
with current ecosystem-level positioning and explicit prototype variants.

### L-8 — Social identity URLs are inconsistent

**Location:** `solwear-mono`  
**Evidence:** `README.md:15,132-135` uses `solwear.watch`/`@solwear`, while
`website/src/app/layout.tsx:110-115` uses `so1wear` and a differently cased GitHub
organization URL.

**Recommended action:** Verify the owned canonical accounts and define them once
in shared site metadata.

### L-9 — Placeholder admin copy is present in default site content

**Location:** `solwear-mono`  
**Evidence:** `website/src/lib/siteContent.ts:109-117` ships empty video URLs with
“Add a YouTube ... from the admin panel” text.

**Impact:** If dynamic content is missing or reset, internal setup instructions
can appear as product copy.

**Recommended action:** Hide empty video sections or use intentional public
“demo coming soon” wording.

### L-10 — Hub map contains a stale tracked/untracked statement

**Location:** hub materials  
**Evidence:** `SOLWEAR_MAP.md:80-82` says the producer files were never committed
and are being regenerated, but `AGENTS.md`, `CLAUDE.md`, `.codex/`, task files,
scripts, and the referenced docs are now tracked on hub `main`.

**Recommended action:** Update the map to describe the actual tracked state and
date/branch of the last verification.

## Positive controls observed

- Package archives reject traversal, duplicate entries, expansion beyond 64 MiB,
  incomplete signature coverage, digest changes, and publisher-key mismatches
  (`os/solweard/src/package.rs:76-223`).
- Wallet files use owner-only permissions, Argon2id, ChaCha20-Poly1305, random
  salt/nonces, and key-buffer zeroization once passphrase protection is enabled
  (`os/solweard/src/wallet.rs:129-229,264-294`).
- Sandboxed apps omit `allow-same-origin`, match messages to the active frame,
  and are subject to both bridge and daemon capability checks
  (`os/shell/src/bridge.ts:49-159`).
- The site Turnstile verifier now fails closed if its secret is missing
  (`website/src/lib/server/turnstile.ts:1-17`).
- The current repository's production Node dependency audits reported zero known
  vulnerabilities on 2026-09-15.

## Cleanup performed

The pre-clean scan found no stray logs, `.DS_Store`, editor swap/backup files,
temporary files, unexpected archives, checked-in generic build output, or
unreferenced files that met the deletion rules. Therefore **no pre-existing repo
file was removed**.

After verification, the following ignored directories created by the audit were
moved to the system Trash so the worktree was returned to its pre-verification
state. They contained only freshly installed dependencies or generated build
output and are recoverable from Trash:

- `apps/{games,signer,stats,store,watchface}/{node_modules,dist}`
- `os/shell/{node_modules,dist}`
- `sdk/runtime/{node_modules,dist}`
- `sdk/cli/{node_modules,dist}`
- `sdk/vscode/{node_modules,dist}`
- `docs/dist`

## Verification

Run against Node `v26.0.0` / npm `11.12.1` after the cleanup decision and before
removing the audit-created ignored artifacts:

- All 12 discovered Node components completed their declared lint (where
  present), typecheck (where present), build (where present), and test scripts.
- SDK runtime: 7/7 tests passed.
- SDK CLI: 17/17 tests passed.
- Emulator: 10/10 tests passed after the shell build.
- Registry: 21/21 validator cases and 5/5 cryptographic package cases passed;
  all four checked-in packages verified offline.
- Documentation: 13 pages built; internal-link validation passed.
- All five first-party app sources typechecked and built.
- `cargo` is absent on this machine. Rust formatting, Clippy, build, Rust tests,
  and the Rust-dependent end-to-end suite were not run.
- The read-only `solwear-mono` checkout was not installed/built because its
  dependencies were absent and doing so would mutate that location. Its lockfile
  was audited read-only; the missing imports/static-export conflict were verified
  from tracked files.

The only tracked change made by this audit is this report. No commit was created.

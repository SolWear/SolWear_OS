# SolWear — Master Map (single source of truth for agents)

> **What this is:** the index of *everything* SolWear — every repo, where it lives (local, server, GitHub, external drive), the live infrastructure, and the current state. Any agent or human starting on SolWear should read this first, then the [story](SolWear_Story_and_Ecosystem_Strategy.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
>
> Seeded 2026-09-15 from the working session that shipped this week's changes. Treat repo *contents* as the source of truth over this map where they disagree; treat this map as the source of truth for *where things are* and *how the live system is wired*.

---

## 1. What SolWear is (one paragraph)

A **Solana-native wearable platform** — hardware + OS + SDK + app ecosystem. It began as a wearable Solana hardware wallet (secure on-device signing, keys never leave the device) and became a platform where the signer is just one of several first-party apps. Full strategy in **[SolWear_Story_and_Ecosystem_Strategy.md](SolWear_Story_and_Ecosystem_Strategy.md)**. Binding technical contract: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## 2. Repositories (the map)

| Repo | GitHub | This machine | Purpose |
|---|---|---|---|
| **SolWear_OS** | `SolWear/SolWear_OS` | **hub:** `/Users/dev/Projects/SolWear` · **worktree:** `/Users/dev/orca/workspaces/SolWear/cory` | The Linux wearable platform: `solweard` daemon (Rust), shell (TS), SDK, emulator, store. This folder is the hub. |
| **solwear** (monorepo) | `SolWear/solwear` | `/Users/dev/orca/workspaces/SolWear/solwear-mono` · **live copy:** `/Users/dev/orca/workspaces/SolWear/neku-site` | `website/` (solwear.tech, Next.js) + `firmware/` + `mobile/` + `service-tool/`. **Deployed branch: `preview-redesign`.** |
| **SolWear_Site** | `SolWear/SolWear_Site` | `/Users/dev/orca/workspaces/SolWear/site` | Older website repo (superseded by `solwear` monorepo's `website/`). |
| **SolWear** (ESP32) | `SolWear/SolWear` | Kingston `solwear_os` / `SolWearOS`; `SolWear_OLD/solwear_os` | The original ESP32 hardware-wallet firmware (Rust/ESP-IDF). Design/motif reference for the OS shell. |
| **solwear_mobile** | `SolWear/solwear_mobile` (private) | Kingston `solwear_mobile`; `SolWear_OLD/solwear_mobile` | Android NFC companion (pairing, signing, Solana relay). |
| **SolWear_SDK** (service tool) | `SolWear/SolWear_SDK` | Kingston `SolWear_ServiceTool`; `SolWear_OLD/SolWear_ServiceTool` | Desktop Tauri service tool (serial inspection, flashing, settings). |

**Kingston drive** (`/Volumes/KINGSTON/SOLWEAR/`): working copies — `SolWearOS`, `solwear_os` (ESP32), `solwear_sdk`, `solwear_mobile`, `solwear_site(old)`, `solwear_site_v4` (empty), `SolWear_ServiceTool`.

**Hub branches** (`/Users/dev/Projects/SolWear`): `main`; `deviverr/pi-ethernet-connect-run` (wallet.generate + shell redesign); `codex/sdk-tools`; `codex/shell-polish`; `deviverr/ai-dev-environment-setup` (empty vs main — the AI producer files were never committed; regenerated per §5).

---

## 3. Live infrastructure

### neku server — hosts solwear.tech
- **Host:** `169.58.10.252`, user **`nekudev`** (SSH key `~/.ssh/id_ed25519`; in `docker` + `sudo` groups; sudo is password-gated — human runs sudo). `root` SSH is closed.
- **Site source (writable):** `/root/solwear_site` — git checkout of `SolWear/solwear`, branch `preview-redesign`. `website/` is the Next.js app.
- **Container:** `website-solwear-site-1` (image `website-solwear-site`), `127.0.0.1:3002→3000`. Build: `cd /root/solwear_site/website && docker compose up -d --build` (Dockerfile pins Node 20; `env_file: .env`).
- **DB:** SQLite `/data/solwear.db` in volume `emails_data` (tables incl. `notify_emails` = waitlist). SOLWEAR_DATA_DIR=/data.
- **Front proxy:** system **nginx** on 80/443 (needs root to edit; configs in `/etc/nginx/sites-available/`). Cloudflare-proxied; real-IP restoration from CF ranges.
  - `solwear.tech` / `www` → container. CSP now allows `https://challenges.cloudflare.com` (script-src + frame-src) — required for Turnstile.
  - `docs.solwear.tech` → proxy-only; the Next.js **middleware** serves docs at the clean root and 301s `solwear.tech/docs/*` to the subdomain.
  - Apply helper staged at `/home/nekudev/apply-nginx.sh` (installs docs config + patches CSP); human runs `sudo bash /home/nekudev/apply-nginx.sh`.
- **Deploy flow:** edit a local copy → `rsync` (no `--delete`, exclude node_modules/.next/.git) to `/root/solwear_site/website/` → rebuild container → verify.
- **Env set on container:** X_API_KEY/SECRET, X_CLIENT_ID/SECRET (unused — X login is OAuth 1.0a), X_CALLBACK_URL, SESSION_SECRET, SOLWEAR_X_USER_ID, TURNSTILE_SITE/SECRET, PINBOARD_ADMIN_TOKEN. Outbound mailer is inert until `WAITLIST_EMAIL_ENABLED=1` + provider keys.

### Raspberry Pi — runs SolWear OS
- **Reach:** Tailscale node `solwear` = `100.111.72.39` (also LAN `solwear.local`). SSH user `solwear`, key `~/.ssh/solwear_raspberry_ed25519` (passphrase-protected).
- **Board:** Raspberry Pi 4B, Raspberry Pi OS **Desktop** (lightdm autologin, Xorg :0). Provisioned via the dev `install-on-pi.sh` path — only `solweard.service` is installed (no full kiosk image).
- **Daemon:** `solweard` (`/usr/bin/solweard`), RPC WebSocket `127.0.0.1:8730/rpc`, static shell `127.0.0.1:8731`. Shell served from directory **`/usr/share/solwear/shell/`** (writable by `solwear` — deploy new shell by scp'ing `os/shell/dist/{index.html,shell.css,shell.js}` there).
- **Kiosk:** Chromium kiosk → `:8731`, as systemd **user** unit `solwear-kiosk.service` (+ `~/.config/autostart/solwear-kiosk.desktop`). Start needs `XDG_RUNTIME_DIR=/run/user/1000` + `DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus`.
- **VNC:** `x11vnc` on `:5900` (password `/etc/x11vnc.pass`; credential stored in the user's Royal TSX). Wallet: `wallet.status` unlocked/unprotected — set a passphrase before production.

### Domains / Cloudflare
- `solwear.tech` (A → 169.58.10.252, proxied), `www` + `docs` (CNAME → solwear.tech, proxied). TLS via Let's Encrypt `solwear.tech` cert (reused for docs under CF Full mode).
- **Turnstile** widget `solwear` (site key `0x4AAAAAADTVk28Jjk6DLUC5`); hostnames `solwear.tech`, `www.solwear.tech`; Managed mode. Working (analytics show solved challenges).

### Access identities
- GitHub CLI `gh`: account **`deviverr`** (email `deviverwork@gmail.com`; commit author `67826510+deviverr@users.noreply.github.com` to keep email private).

---

## 4. State after this week's build (Hackathon #2)

Branch `deviverr/pi-ethernet-connect-run` (SolWear_OS) + `preview-redesign` (solwear site), all pushed:

- **`wallet.generate`** RPC — mint a fresh device identity (daemon + emulator mock + SDK + tests); docs updated.
- **Shell** — double-tap-to-open launcher; brand retheme; deeper "engineered" redesign (mono technical type, `#050505`, red = "live"). **Deployed live to the Pi.** All 11 emulator tests pass.
- **Docs** — full docs section built into the site; **live at `solwear.tech/docs/` and `docs.solwear.tech`** (clean root; main `/docs/*` 301s to subdomain).
- **SDK page** — game-engine-style landing at `solwear.tech/sdk`.
- **SDK tools** — proven end-to-end (CLI scaffold→build→sign→verify→run; runtime 7/7, CLI 17/17).
- **Site** — loading screen (typewriter + halftone melt), frosted-glass docs panel, minimalism pass, link audit, site-wide accents.
- **Backend** — admin panel hardened (session recheck, CSRF+same-origin, throttling); X (OAuth 1.0a) login verified/hardened; outbound mailer added (inert until env). **Wishlist fixed** — Turnstile CSP + single-use-token bug; `notify_emails` now saving.
- Full security-hardening report: `neku-site/website/reports/backend-auth-email-admin-hardening.md`.

**Human follow-ups still open:** enable X OAuth 1.0a (3-legged) in the X portal; verify a Resend domain + set `WAITLIST_EMAIL_ENABLED=1` for outbound email; set a wallet passphrase on the Pi; decide git strategy for the `preview-redesign` history.

---

## 5. AI producer / build-system (regenerated — see §"Producer" files)

The agent workflow files (AGENTS.md, CLAUDE.md, `.codex/`, `.claude/settings.json` + `commands/task.md`, `scripts/dev.sh`, `tasks/`, and `docs/{PRODUCT,SECURITY,HARDWARE,OS,SDK,EMULATOR,ECOSYSTEM,ROADMAP,AI_WORKFLOW,AI_REPOSITORY_AUDIT}.md`) define roles (Claude = Architect+Reviewer, Codex = Implementer, Human = Product Owner) and the repo runner. These were designed previously but never committed; they are being regenerated in this pass. `docs/ARCHITECTURE.md` is the binding contract and is never rewritten by agents.

---

## 6. Loose materials in the hub (index — not moved)

- `SolWear_Story_and_Ecosystem_Strategy.md` — strategic source of truth (untracked).
- `SolWear_OLD/` — old working copies + logs + a prior `claude-session.jsonl` (untracked). Real old content lives here.
- `SolWear_Business_Plan_Package.zip` — business plan.
- Empty placeholder dirs at hub root (`Materials/`, `grant-application/`, `3dprint/`, `old_and_zips/`, `solwear_mobile/`, `scripts/`, `_publish_*`) — currently empty; populate or remove intentionally (not touched in this pass).

#!/usr/bin/env bash

set -eu
set -o pipefail

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DAEMON_MANIFEST="$ROOT/os/solweard/Cargo.toml"

# This is CI's ordering: the runtime and CLI are build-time prerequisites for
# apps; all remaining independent packages then follow in lexical order.
NODE_COMPONENTS="
sdk/runtime
sdk/cli
apps/games
apps/signer
apps/stats
apps/store
apps/watchface
docs
emulator/host
os/shell
sdk/vscode
store/registry
"

say() { printf '%s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }

usage() {
  cat <<'EOF'
Usage: scripts/dev.sh <command> [options]

Commands:
  doctor    Report required and optional toolchains; never installs anything
  setup     Install Node dependencies and fetch Rust dependencies when available
  build     Build sdk/runtime, sdk/cli, then the remaining components and daemon
  test      Run Node, registry, documentation, and Rust tests
  lint      Run Node type/lint scripts, JSON checks, rustfmt, and Clippy
  emulator  Build UI prerequisites and start the host emulator (passes options)
  e2e       Run tests/e2e/run.sh (requires Node 22+ and Rust)
  clean     Run declared package clean scripts and cargo clean when available
  help      Show this help

Examples:
  scripts/dev.sh setup
  scripts/dev.sh emulator --profile pi-round-480
  scripts/dev.sh e2e --no-build
EOF
}

require_node() {
  has node || die "Node.js is required (version 22 or newer)."
  has npm || die "npm is required."
}

node_major() {
  node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || printf '0\n'
}

package_has_script() {
  component=$1
  script=$2
  node -e "const p=require(process.argv[1]); process.exit(p.scripts && p.scripts[process.argv[2]] ? 0 : 1)" \
    "$ROOT/$component/package.json" "$script"
}

each_component() {
  action=$1
  for component in $NODE_COMPONENTS; do
    [ -f "$ROOT/$component/package.json" ] || continue
    "$action" "$component"
  done
}

install_component() {
  component=$1
  say "==> setup $component"
  if [ -f "$ROOT/$component/package-lock.json" ]; then
    npm --prefix "$ROOT/$component" ci
  else
    warn "$component has no package-lock.json; using npm install"
    npm --prefix "$ROOT/$component" install
  fi
}

build_component() {
  component=$1
  if package_has_script "$component" build; then
    say "==> build $component"
    npm --prefix "$ROOT/$component" run build
  fi
}

test_component() {
  component=$1
  if package_has_script "$component" test; then
    say "==> test $component"
    npm --prefix "$ROOT/$component" test
  fi
}

lint_component() {
  component=$1
  if package_has_script "$component" lint; then
    say "==> lint $component"
    npm --prefix "$ROOT/$component" run lint
  fi
  if package_has_script "$component" typecheck; then
    say "==> typecheck $component"
    npm --prefix "$ROOT/$component" run typecheck
  fi
}

clean_component() {
  component=$1
  if package_has_script "$component" clean; then
    say "==> clean $component"
    npm --prefix "$ROOT/$component" run clean
  fi
}

doctor() {
  say "SolWear repository doctor"
  say "root: $ROOT"
  if has node; then
    major=$(node_major)
    if [ "$major" -ge 22 ]; then
      say "OK: node $(node --version) (required: >=22)"
    else
      warn "node $(node --version) is too old; version 22 or newer is required"
    fi
  else
    warn "Node.js is missing; install Node 22 or newer"
  fi
  if has npm; then say "OK: npm $(npm --version)"; else warn "npm is missing"; fi
  if has cargo; then
    say "OK: $(cargo --version)"
    if has rustfmt; then say "OK: $(rustfmt --version)"; else warn "rustfmt is missing; run: rustup component add rustfmt"; fi
    if has cargo-clippy; then say "OK: $(cargo clippy --version)"; else warn "Clippy is missing; run: rustup component add clippy"; fi
  else
    warn "Rust/cargo is missing; Node-only setup, build, test, and lint can still run"
  fi
  if has git; then say "OK: $(git --version)"; else warn "git is missing"; fi
  if has qemu-system-aarch64; then
    say "OK: qemu-system-aarch64 is available"
  else
    warn "qemu-system-aarch64 is missing (optional; required only for full-system emulation)"
  fi
  say "Doctor completed; warnings identify unavailable or optional tools."
}

setup() {
  require_node
  each_component install_component
  if has cargo; then
    say "==> fetch Rust dependencies"
    cargo fetch --manifest-path "$DAEMON_MANIFEST" --locked
  else
    warn "Rust/cargo missing; skipped daemon dependency fetch"
  fi
}

build() {
  require_node
  each_component build_component
  if has cargo; then
    say "==> build os/solweard"
    cargo build --manifest-path "$DAEMON_MANIFEST" --locked --all-features
  else
    warn "Rust/cargo missing; Node components built, daemon skipped"
  fi
}

test_all() {
  require_node
  each_component test_component
  say "==> validate registry"
  node "$ROOT/store/registry/validate.mjs"
  say "==> verify registry packages offline"
  node "$ROOT/store/registry/verify-packages.mjs" --offline
  say "==> build documentation"
  node "$ROOT/docs/build.mjs"
  if has cargo; then
    say "==> test os/solweard with MockHal"
    SOLWEAR_HAL=mock cargo test --manifest-path "$DAEMON_MANIFEST" --all-features
  else
    warn "Rust/cargo missing; Node tests passed, daemon tests skipped"
  fi
}

lint_all() {
  require_node
  each_component lint_component
  say "==> parse tracked JSON"
  (cd "$ROOT" && git ls-files '*.json') | while IFS= read -r file; do
    [ -n "$file" ] || continue
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$ROOT/$file"
  done
  if has cargo; then
    say "==> rustfmt"
    cargo fmt --manifest-path "$DAEMON_MANIFEST" --all -- --check
    say "==> Clippy"
    cargo clippy --manifest-path "$DAEMON_MANIFEST" --all-targets --all-features -- -D warnings
  else
    warn "Rust/cargo missing; Node lint/type checks passed, rustfmt and Clippy skipped"
  fi
}

emulator() {
  require_node
  build_component sdk/runtime
  build_component sdk/cli
  build_component os/shell
  say "==> start host emulator"
  npm --prefix "$ROOT/emulator/host" start -- "$@"
}

e2e() {
  require_node
  [ "$(node_major)" -ge 22 ] || die "e2e requires Node 22 or newer."
  has cargo || die "e2e requires Rust/cargo; Node-only checks remain available via test and lint."
  "$ROOT/tests/e2e/run.sh" "$@"
}

clean_all() {
  require_node
  each_component clean_component
  if has cargo; then
    say "==> cargo clean os/solweard"
    cargo clean --manifest-path "$DAEMON_MANIFEST"
  else
    warn "Rust/cargo missing; Node clean scripts ran, daemon target was left alone"
  fi
}

command=${1:-help}
[ "$#" -eq 0 ] || shift
case "$command" in
  doctor) doctor "$@" ;;
  setup) setup "$@" ;;
  build) build "$@" ;;
  test) test_all "$@" ;;
  lint) lint_all "$@" ;;
  emulator) emulator "$@" ;;
  e2e) e2e "$@" ;;
  clean) clean_all "$@" ;;
  help|-h|--help) usage ;;
  *) usage >&2; die "unknown command: $command" ;;
esac

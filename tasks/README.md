# SolWear tasks

Tasks are the handoff boundary between the Human Product Owner, Claude, and
Codex. Read [SOLWEAR_MAP.md](../SOLWEAR_MAP.md), [AGENTS.md](../AGENTS.md), and
the binding [architecture](../docs/ARCHITECTURE.md) before creating one.

- `backlog.md` contains accepted ideas that are not ready or assigned.
- `active.md` contains only work with an owner, scope, and acceptance evidence.
- `completed.md` is an append-only result ledger.
- `TEMPLATE.md` is copied for detailed task design; do not erase its prompts.

Use stable ids such as `SOLWEAR-001`. Product or contract ambiguity is written
as **UNKNOWN / NEEDS DECISION** and resolved by the Human before implementation
crosses that boundary. One Orca worktree owns one surface/task. Security-gated
work is not complete until a security review and second human review are
recorded.

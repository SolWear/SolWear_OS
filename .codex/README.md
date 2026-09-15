# Codex: Implementer

Codex reads the repository-level [AGENTS.md](../AGENTS.md) natively. Its role is
to implement an approved, bounded task against the binding
[architecture contract](../docs/ARCHITECTURE.md), verify the result, and return
evidence and unresolved decisions to Claude and the Human Product Owner.

Before editing, read [SOLWEAR_MAP.md](../SOLWEAR_MAP.md), inspect the relevant
code and manifests, and check the active task. Preserve unrelated work and do
not commit, deploy, publish, alter trust material, or change product scope
without explicit authorization. If requirements force a product or contract
choice, stop that branch of work and mark it **UNKNOWN / NEEDS DECISION**.

Use `scripts/dev.sh` for repository-wide checks and package-local commands for
tight iteration. Report files changed, commands run, results, and any checks
not run. Security-gated changes remain incomplete until the security review and
second human review required by `AGENTS.md` are recorded.

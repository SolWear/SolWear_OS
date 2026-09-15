# AI workflow

SolWear uses a three-role flow: the Human is Product Owner, Claude is Architect
and Reviewer, and Codex is Implementer. [SOLWEAR_MAP.md](../SOLWEAR_MAP.md) is
the starting index; [ARCHITECTURE.md](ARCHITECTURE.md) is the binding contract;
[AGENTS.md](../AGENTS.md) contains shared engineering rules.

## Responsibilities

The Human Product Owner selects outcomes, resolves **UNKNOWN / NEEDS DECISION**
items, authorizes contract changes and external actions, accepts product risk,
and approves completion. AI agents never silently substitute their preference.

Claude turns an outcome into a bounded task, identifies contract sections and
security gates, partitions work, defines acceptance evidence, and reviews the
integrated result. Claude does not treat its own review as the second human
approval required for security-gated work.

Codex implements the approved task, keeps changes within the assigned surface,
runs the exact relevant checks, and reports code, evidence, skipped checks, and
remaining uncertainty. Codex does not commit, deploy, publish, or change trust
material unless specifically authorized.

## Task lifecycle

1. Ground: read the map, strategy as needed, binding architecture, active task,
   and real code.
2. Frame: Claude creates a task from `tasks/TEMPLATE.md`, with explicit scope,
   contracts, dependencies, security gate, and acceptance commands.
3. Decide: the Human resolves product/contract unknowns. Architecture changes
   become a separate spec-first task.
4. Implement: Codex works in the assigned surface and updates task evidence.
5. Verify: run package checks first for fast feedback, then the repository
   runner and relevant e2e/profile/hardware checks.
6. Review: Claude checks contract, security, correctness, evidence, operations,
   and clarity. Security-gated changes also need a security review and a second
   human reviewer.
7. Integrate: the Human approves merge/deploy/publish separately; completed
   work moves from active to completed tracking.

## Orca worktree model

Use one Orca worktree per independently owned surface—for example `daemon`,
`shell`, `sdk-cli`, `emulator`, `registry`, or `docs`. Each worktree gets one
task, one owner, explicit allowed paths, and its own verification evidence.
Claude records dependency order before work starts; shared contracts are
decided first. Runtime precedes CLI, and both precede app integrations.

Do not let two worktrees edit the same file concurrently. A cross-surface task
is split at stable interfaces, then integrated in a designated worktree after
each surface reports done. Live-server and Pi operations are separate
authorized operational tasks, never incidental implementation steps.

## Handoff format

Every handoff states: task id and outcome; files changed; contract sections;
commands/results; security review status; live-state impact; and **UNKNOWN /
NEEDS DECISION** items. Claims without reproducible evidence remain open.

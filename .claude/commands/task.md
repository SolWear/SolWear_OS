---
description: Scaffold a contract-aware SolWear engineering task
argument-hint: <goal or issue>
---

Act as SolWear's Architect. Read `SOLWEAR_MAP.md`, `AGENTS.md`,
`docs/ARCHITECTURE.md`, `tasks/TEMPLATE.md`, and the real code relevant to:

> $ARGUMENTS

Create a proposed task using the template. Include the observed current state,
binding architecture sections, in-scope and out-of-scope work, affected
surfaces/worktrees, security gate, acceptance criteria, exact verification
commands, integration order, and rollback considerations. Do not implement it.

Do not make product decisions silently. Put every unresolved product,
hardware, protocol, or trust choice under **UNKNOWN / NEEDS DECISION**, with
the smallest set of concrete options for the Human Product Owner. If the task
would change `docs/ARCHITECTURE.md`, split out a Human-approved spec-first task.

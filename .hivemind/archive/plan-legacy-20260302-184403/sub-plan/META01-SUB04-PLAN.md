---
id: META01-SUB04
type: sub
scope: meta
title: "Orchestrator Orphan Investigation + Cleanup"
status: open
parent: META01
children: []
dependencies: []
tags: [hivefiver-orchestrator, orphan, investigation, cleanup]
created: 2026-03-03
last_updated: 2026-03-03
owner: hivefiver
session_ref: null
completion_pct: 0
---

# Orchestrator Orphan Investigation + Cleanup

> **Plan ID**: `META01-SUB04` | **Status**: `open` | **Parent**: [`META01-PLAN.md`](../META01-PLAN.md)
> **Independent** — can run in parallel with SUB01

<context>
The `hivefiver-orchestrator` skill has only 1 file (SKILL.md, 1258 bytes) and an empty
references/ directory. This is suspiciously minimal compared to the other 4 hivefiver skills.
It may be an orphan from an earlier iteration, or it may overlap with hivefiver-mode's
routing functionality. Investigation needed before deciding: keep, merge, or remove.
</context>

---

## Goal

Determine whether `hivefiver-orchestrator` is an orphan, overlaps with existing skills, or
serves a unique purpose. Then act: keep (if unique), merge (if overlapping), or remove (if orphan).

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| `.opencode/skills/hivefiver-orchestrator/` | Other hivefiver skills (content, not comparison) |
| Cross-reference check: what loads/references this skill? | Commands/workflows (only checked for references) |
| Comparison with hivefiver-mode functionality | Product code |

---

## Atomic Tasks

| ID | Task | Status | Dep | Est | Method |
|----|------|--------|-----|-----|--------|
| A01 | Read hivefiver-orchestrator SKILL.md — understand its stated purpose | `open` | — | S | Investigation (inline) |
| A02 | Grep codebase for "hivefiver-orchestrator" — find all references | `open` | — | S | Investigation (inline) |
| A03 | Compare with hivefiver-mode SKILL.md — identify overlap | `open` | A01 | S | Investigation (inline) |
| A04 | Decision: keep / merge / remove | `open` | A01-A03 | S | Coordinator decision |
| A05 | Execute decision | `open` | A04 | S | Executor |

---

<decisions>

| # | Decision | Rationale | Date | Reversible? |
|---|----------|-----------|------|-------------|

</decisions>

---

<findings>
<!-- Populated during investigation -->

- [2026-03-03] [INVENTORY] Only 1258 bytes. Empty references/. Smallest hivefiver skill by far.

</findings>

---

<action_items>

- [ ] `OPEN` — Begin A01+A02 immediately (read-only, no dependency)
- [ ] `OPEN` — A03 after A01 complete
- [ ] `OPEN` — A04 decision → present to human for confirmation

</action_items>

---

## Completion Criteria

- [ ] Orchestrator's purpose documented (or confirmed as orphan)
- [ ] All codebase references identified
- [ ] Decision made and executed (keep/merge/remove)
- [ ] No broken references remaining in codebase
- [ ] If removed: verify no test regressions

---

<symlinks>

- Parent: [`META01-PLAN.md`](../META01-PLAN.md)
- Target: `.opencode/skills/hivefiver-orchestrator/SKILL.md`
- Comparison: `.opencode/skills/hivefiver-mode/SKILL.md`

</symlinks>

---

<footer>

## Session Notes

- [2026-03-03] [MAIN] Sub-plan created. Can start immediately (no dependencies).

## Next Actions

1. Read orchestrator SKILL.md
2. Grep for all references
3. Compare with mode
4. Present decision

## Context for Continuation

SUB04 is at `open`. Independent — can run in parallel with SUB01. Investigation is lightweight (3 read-only tasks). Decision requires human confirmation.

</footer>

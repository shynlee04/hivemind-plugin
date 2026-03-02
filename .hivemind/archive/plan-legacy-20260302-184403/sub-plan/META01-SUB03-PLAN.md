---
id: META01-SUB03
type: sub
scope: meta
title: "Agent Body Slimming + Skill Stack Deduplication"
status: open
parent: META01
children: []
dependencies: [META01-SUB02]
tags: [agent-body, deduplication, runtime-enforcement, mode, coordination]
created: 2026-03-03
last_updated: 2026-03-03
owner: hivefiver
session_ref: null
completion_pct: 0
---

# Agent Body Slimming + Skill Stack Deduplication

> **Plan ID**: `META01-SUB03` | **Status**: `open` | **Parent**: [`META01-PLAN.md`](../META01-PLAN.md)
> **Depends on**: `META01-SUB02` (prime skill must be designed first — body refers to it)

<context>
The hivefiver agent body (.opencode/agents/hivefiver.md) is 520 lines. It inlines behavioral
contracts, quality gates, delegation topology, and execution flows that should live in skills.
This creates duplication — the same concepts appear in the agent body AND in hivefiver-mode /
hivefiver-coordination skills. Additionally, the runtime enforcement protocol (runtime-gate.sh)
is DUPLICATED between mode and coordination skills.

After SUB02 (prime skill redesign), the agent body should be slimmed to:
- Frontmatter (machine-parsed fields only)
- Essential role declaration (~20L)
- "FIRST ACTION: load hivefiver-prime" instruction (~5L)
- Scope boundaries (~15L)
- Total target: ~150-200L (from current 520L)

The skill stack deduplication resolves runtime-enforcement ownership between mode and
coordination, and removes any orphan or overlapping content.
</context>

---

## Goal

Reduce agent body from 520L to ~150-200L by extracting inline knowledge into the prime skill,
and resolve all duplication between hivefiver-mode and hivefiver-coordination.

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| `.opencode/agents/hivefiver.md` body content | Frontmatter machine-parsed fields (keep as-is) |
| hivefiver-mode SKILL.md runtime enforcement section | Other agents' profiles |
| hivefiver-coordination SKILL.md runtime enforcement section | Commands, workflows, templates (downstream) |
| Overlap between mode refs and coordination refs | hiveminder domain |

---

## Atomic Tasks

| ID | Task | Status | Dep | Est | Method |
|----|------|--------|-----|-----|--------|
| A01 | Map every section of agent body → target location (prime/mode/coord/remove) | `open` | — | M | Investigation sub-session |
| A02 | Identify runtime-enforcement duplication (mode vs coord) → assign ownership | `open` | — | S | Investigation sub-session |
| A03 | Identify reference overlap between mode refs and coordination refs | `open` | — | S | Investigation sub-session |
| A04 | Design slimmed agent body outline (~150-200L) | `open` | A01 | M | Coordinator main session |
| A05 | Execute agent body slimming | `open` | A04+SUB02 | M | Executor session |
| A06 | Execute mode/coordination deduplication | `open` | A02+A03 | M | Executor session |
| A07 | Verify no test regressions after changes | `open` | A05+A06 | S | Verification |
| A08 | Sync parity: root ← .opencode (LAST action) | `open` | A07 | S | Executor |

---

<decisions>

| # | Decision | Rationale | Date | Reversible? |
|---|----------|-----------|------|-------------|

</decisions>

---

<findings>

- [2026-03-03] [INVENTORY] Agent body 520L. Frontmatter ~55L. Body ~465L of inline knowledge.
- [2026-03-03] [OVERLAP] Both hivefiver-mode and hivefiver-coordination contain runtime-gate.sh invocation protocol (~30L each).
- [2026-03-03] [OVERLAP] hivefiver-mode references contain OpenCode platform knowledge. Prime references contain similar (drafted) content.

</findings>

---

<action_items>

- [ ] `BLOCKED` — Awaiting SUB02 completion (prime skill design determines what moves where)
- [ ] `OPEN` — A01-A03 can start after SUB02 design outline is confirmed (not after full execution)

</action_items>

---

## Completion Criteria

- [ ] Agent body ≤ 200 lines
- [ ] Agent body contains "load hivefiver-prime first" instruction
- [ ] Zero duplication between mode and coordination runtime enforcement
- [ ] Zero duplication between agent body and skill content
- [ ] All test suites pass (agent-boundary-policy, sync-assets, hivefiver-integration)
- [ ] Root mirror synced from .opencode/ (preserving user overrides)

---

<symlinks>

- Parent: [`META01-PLAN.md`](../META01-PLAN.md)
- Depends on: [`META01-SUB02-PLAN.md`](META01-SUB02-PLAN.md)
- Agent body: `.opencode/agents/hivefiver.md` (520L)
- Mode skill: `.opencode/skills/hivefiver-mode/SKILL.md`
- Coordination skill: `.opencode/skills/hivefiver-coordination/SKILL.md`

</symlinks>

---

<footer>

## Session Notes

- [2026-03-03] [MAIN] Sub-plan created. Blocked on SUB02. Investigation tasks (A01-A03) can start once SUB02 design outline is confirmed.

## Next Actions

1. Wait for SUB02 design outline confirmation
2. Then spawn A01-A03 investigations in parallel

## Context for Continuation

SUB03 is at `open`, blocked on SUB02. The deduplication targets are identified (runtime enforcement, reference overlap). The slimming target is ~150-200L from current 520L.

</footer>

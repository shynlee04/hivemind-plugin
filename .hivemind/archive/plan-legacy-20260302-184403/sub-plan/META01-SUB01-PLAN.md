---
id: META01-SUB01
type: sub
scope: meta
title: "Parity Drift Isolation + False Alarm Decouple"
status: open
parent: META01
children: []
dependencies: []
tags: [parity, sync, permissions, isolation, false-alarm]
created: 2026-03-03
last_updated: 2026-03-03
owner: hivefiver
session_ref: null
completion_pct: 0
---

# Parity Drift Isolation + False Alarm Decouple

> **Plan ID**: `META01-SUB01` | **Status**: `open` | **Parent**: [`META01-PLAN.md`](../META01-PLAN.md)
> **Atomics**: See `atomic-plan/META01-SUB01-A*-PLAN.md`

<context>
The .opencode/agents/hivefiver.md (520L) and agents/hivefiver.md (443L) have a 98-line
parity drift. This is INTENTIONAL — user explicitly relaxed permissions (`*: allow`), added
delegation targets (hivemaker, hiverd, hiveq), and appended a GX governance section (+75L).
The test suites (agent-boundary-policy, sync-assets) may emit false alarms on this intentional
drift. This sub-plan isolates the drift, documents it as accepted state, and decouples false
alarm tests so they don't block downstream work. The distortion pattern may also exist at
global OpenCode level (not just project agents).
</context>

---

## Goal

Establish that the hivefiver parity drift is **accepted state** (not a bug), decouple any
test assertions that flag it as failure, and document the isolation boundary so downstream
work is never blocked by sync-check false alarms.

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| `.opencode/agents/hivefiver.md` vs `agents/hivefiver.md` diff | Any other agent profiles |
| Test suites that check agent parity (sync-assets, agent-boundary-policy) | Product test suites (src/tests/) |
| Global OpenCode level sync distortion patterns | SDK/server API access |
| Permission configuration isolation | Changing the actual permissions (user's runtime overrides stay) |

---

## Atomic Tasks

| ID | Task | Status | Dep | Est | Method |
|----|------|--------|-----|-----|--------|
| A01 | Document exact diff (98 lines) with annotations per change | `open` | — | S | Investigation sub-session |
| A02 | Identify which test suites assert parity on hivefiver | `open` | — | S | Investigation sub-session |
| A03 | Classify each test assertion: real check vs false alarm | `open` | A02 | M | Investigation sub-session |
| A04 | Decouple false alarm assertions (skip/allowlist, not delete) | `open` | A03 | S | Executor (inline) |
| A05 | Check global OpenCode level for similar sync distortion patterns | `open` | — | M | Investigation sub-session |

### Inline Atomics

**A01**: Run `diff agents/hivefiver.md .opencode/agents/hivefiver.md` → annotate each hunk:
- User permission override (intentional)
- GX governance block (additive, intentional)
- Added delegation targets (intentional)
- Evidence: annotated diff output

**A04**: For each false alarm, add an allowlist entry or skip marker — NOT delete the test.
The test should still work for other agents. Only hivefiver gets the exception.

---

<decisions>

| # | Decision | Rationale | Date | Reversible? |
|---|----------|-----------|------|-------------|
| 1 | Drift is INTENTIONAL, not drift-to-fix | User explicitly said "I allow all permission and load you as such" | 2026-03-03 | YES — can re-sync after redesign |

</decisions>

---

<findings>
<!-- Populated during investigation -->

- [2026-03-03] [INVENTORY] Diff is 98 lines. Three categories: permission relaxation, delegation expansion, GX governance appendage.
- [2026-03-03] [INVENTORY] Previous session verified: `agent-boundary-policy` 2/2 pass, `sync-assets` 44/44 pass, `hivefiver-integration` 18/18 pass. No current false alarms active — but they COULD emerge after changes.

</findings>

---

<action_items>

- [ ] `OPEN` — Spawn investigation sub-session for A01+A02+A05 (parallel, all read-only)
- [ ] `OPEN` — After investigation: classify A03, then execute A04

</action_items>

---

## Completion Criteria

- [ ] Every line of the 98-line diff annotated with: intentional / needs-fix / investigate
- [ ] All test suites that check hivefiver parity identified
- [ ] False alarm assertions decoupled (allowlisted, not deleted)
- [ ] Tests still pass for all OTHER agents (no regression)
- [ ] Global distortion patterns documented (if found)
- [ ] Validation artifact: `VALIDATION-META01-SUB01-PLAN.md` exists with evidence

---

<symlinks>

- Parent: [`META01-PLAN.md`](../META01-PLAN.md)
- Siblings: [`META01-SUB02-PLAN.md`](META01-SUB02-PLAN.md), [`META01-SUB03-PLAN.md`](META01-SUB03-PLAN.md), [`META01-SUB04-PLAN.md`](META01-SUB04-PLAN.md)
- Agent profile (canonical): `.opencode/agents/hivefiver.md`
- Agent profile (root mirror): `agents/hivefiver.md`
- Test suites: `tests/` (read-only inspection)

</symlinks>

---

<footer>

## Session Notes

- [2026-03-03] [MAIN] Sub-plan created. No investigation started yet.

## Next Actions

1. Spawn investigation sub-session: read the 98-line diff, identify test suites, check global patterns
2. Classify findings → execute decoupling

## Context for Continuation

SUB01 is at `open`. No atomics started. The diff is known (98 lines, 3 categories) but not annotated line-by-line. Test suites currently pass but may false-alarm after other changes.

</footer>

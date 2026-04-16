# Phase 14: delegate-task truth-reset — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash
**Areas discussed:** Trash Removal, delegate-task Tool Fate, Regression Code Triage, Test Suite Reset

---

## Trash Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Nuke all trash | Delete every diagnostic report, debug artifact, and session dump file | ✓ |
| Archive to .archive/ | Move everything to .archive/ for historical reference | |
| Keep Phase 12 reconciliation only | Delete everything EXCEPT the Phase 12 reconciliation note | |

**User's choice:** Nuke all trash
**Notes:** User was explicit — the diagnostic report is "the reason why everything failed" and poisoned agent context. All forensic value is now captured in STATE.md.

---

## delegate-task Tool Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Stub/redirect | Replace with redirect to OpenCode task tool | |
| Delete completely | Remove from src/tools/ and plugin.ts | |
| Keep but disable async | Runtime policy guard, sync only | |

**User's choice:** NONE of the above — "it must work"
**Notes:** User was emphatic: delegate-task must actually function. The AGENTS.md ban line exists BECAUSE it's broken, not because it should be deleted. Target: full sync dispatch with result return AND async durability. Async architecture to be researched during planning.

---

## Regression Code Triage

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all 09-13 code | Start from Phase 02 verified baseline | ✓ |
| Selective keep + delete | Keep functional modules, delete broken ones | |
| Module-by-module audit | Individual evaluation of each module | |

**User's choice:** Delete all 09-13 code
**Notes:** Nuclear option. Phase 02 baseline (18/18 verified) is the trusted foundation. Everything from 09-13 gets removed and rebuilt from scratch.

---

## Test Suite Reset

| Option | Description | Selected |
|--------|-------------|----------|
| Delete and rewrite | Fresh tests aligned with real runtime behavior | ✓ |
| Keep Phase 02 tests only | Minimal disruption, remove broken tests | |
| Fix incrementally | Adjust existing tests to match new reality | |

**User's choice:** Delete and rewrite
**Notes:** The 668-test suite is mock-heavy and tests phantom behavior. Fresh tests must be runtime-truthful.

---

## agent's Discretion

- Async durability implementation approach (researcher decides)
- Test file organization and naming conventions
- Whether to keep `src/lib/tasking/` directory structure
- How to handle `runtime-policy.ts` and recent adapter work files

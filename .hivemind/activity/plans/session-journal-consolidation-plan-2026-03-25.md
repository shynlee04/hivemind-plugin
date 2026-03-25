# Phase Plan: Session Journal Consolidation

**ID:** PLAN-2026-03-25-001
**Spec:** SPEC-2026-03-25-001
**Created:** 2026-03-25
**Status:** Active

---

## Phase Overview

| Phase | ID | Scope | Agent | TDD Gate | Status |
|-------|-----|-------|-------|----------|--------|
| P0 | Plan Creation | Create spec + plan | hiveminder | N/A | ✅ Complete |
| P1 | Context Assessment | Assess event-tracker state | hivexplorer | N/A | ✅ Complete |
| P2 | Writer Design | Design consolidated format | hivexplorer | N/A | ✅ Complete |
| P3-A | TDD: Consolidated Writer Tests | RED: Write failing tests | hitea | RED | Pending |
| P3-B | TDD: Consolidated Writer Implementation | GREEN: Make tests pass | hivemaker | GREEN | Pending |
| P3-C | TDD: Consolidated Writer Refactor | REFACTOR: Clean code | hivemaker | REFACTOR | Pending |
| P4-A | TDD: Hook Migration Tests | RED: Write failing tests | hitea | RED | Pending |
| P4-B | TDD: Hook Migration Implementation | GREEN: Make tests pass | hivemaker | GREEN | Pending |
| P4-C | TDD: Hook Migration Refactor | REFACTOR: Clean code | hivemaker | REFACTOR | Pending |
| P5-A | TDD: User Message Capture Tests | RED: Write failing tests | hitea | RED | Pending |
| P5-B | TDD: User Message Capture Implementation | GREEN: Make tests pass | hivemaker | GREEN | Pending |
| P5-C | TDD: User Message Capture Refactor | REFACTOR: Clean code | hivemaker | REFACTOR | Pending |
| P6-A | TDD: Tool Invocation Tests | RED: Write failing tests | hitea | RED | Pending |
| P6-B | TDD: Tool Invocation Implementation | GREEN: Make tests pass | hivemaker | GREEN | Pending |
| P6-C | TDD: Tool Invocation Refactor | REFACTOR: Clean code | hivemaker | REFACTOR | Pending |
| P7-A | TDD: Sub-Session Linking Tests | RED: Write failing tests | hitea | RED | Pending |
| P7-B | TDD: Sub-Session Linking Implementation | GREEN: Make tests pass | hivemaker | GREEN | Pending |
| P7-C | TDD: Sub-Session Linking Refactor | REFACTOR: Clean code | hivemaker | REFACTOR | Pending |
| P8 | Legacy Cleanup | Clear old directories | hivemaker | Tests pass | Pending |
| P9 | Final Verification | Verify all gates | hiveq | All gates | Pending |

---

## Phase Dependencies

```
P0 (Plan) ──► P1 (Assessment) ──► P2 (Design)
                                    │
                                    ▼
                     P3 (Writer) ──► P4 (Hook Migration)
                          │                │
                          ▼                ▼
                     P5 (User Msg) ──► P6 (Tool Invoc)
                          │                │
                          ▼                ▼
                     P7 (Sub-Session) ──► P8 (Legacy)
                                    │
                                    ▼
                                    P9 (Final Verify)
```

---

## TDD Gate Definition

Each implementation phase (P3-P7) follows RED-GREEN-REFACTOR:

### RED Phase (A subphases)
- [ ] Write failing tests FIRST
- [ ] Tests must fail for the right reason (not compilation errors)
- [ ] Test output shows expected vs actual
- [ ] No implementation code written yet

### GREEN Phase (B subphases)
- [ ] Write MINIMAL implementation to make tests pass
- [ ] All tests pass
- [ ] No extra features added
- [ ] TypeScript compiles

### REFACTOR Phase (C subphases)
- [ ] Clean up implementation
- [ ] Extract common logic
- [ ] Improve naming
- [ ] Add documentation
- [ ] All tests still pass
- [ ] TypeScript compiles

---

## Gate Checks (Between Phases)

### Gate G3: Writer Complete
- [ ] P3-A: RED tests exist and fail
- [ ] P3-B: GREEN tests pass
- [ ] P3-C: REFACTOR clean
- [ ] File: `src/features/event-tracker/consolidated-writer.ts` exists
- [ ] Tests: `consolidated-writer.test.ts` pass
- [ ] Build: `npx tsc --noEmit` succeeds

### Gate G4: Hook Migration Complete
- [ ] P4-A: RED tests exist and fail
- [ ] P4-B: GREEN tests pass
- [ ] P4-C: REFACTOR clean
- [ ] Hooks use consolidated writer
- [ ] Integration tests pass

### Gate G5: User Messages Complete
- [ ] P5-A: RED tests exist and fail
- [ ] P5-B: GREEN tests pass
- [ ] P5-C: REFACTOR clean
- [ ] `chat.message` hook captures user messages
- [ ] `userMessageCount > 0` in tests

### Gate G6: Tool Invocations Complete
- [ ] P6-A: RED tests exist and fail
- [ ] P6-B: GREEN tests pass
- [ ] P6-C: REFACTOR clean
- [ ] `tool.execute.after` hook captures tool calls
- [ ] `toolCallCount > 0` in tests

### Gate G7: Sub-Session Linking Complete
- [ ] P7-A: RED tests exist and fail
- [ ] P7-B: GREEN tests pass
- [ ] P7-C: REFACTOR clean
- [ ] Delegation tracking works
- [ ] `parentSessionId` populated

### Gate G8: Legacy Cleanup Complete
- [ ] P8: Old directories cleared
- [ ] No orphaned files
- [ ] Tests pass

### Gate G9: Final Verification
- [ ] All acceptance criteria from SPEC met
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Registry complete

---

## Rollback Steps

### If P3 fails:
1. Delete `src/features/event-tracker/consolidated-writer.ts`
2. Delete `src/features/event-tracker/consolidated-writer.test.ts`
3. Return to P2 for redesign

### If P4 fails:
1. Revert hook changes
2. Return to P3 for writer fix

### If P5 fails:
1. Revert `chat.message` hook
2. Return to P4 for hook fix

### If P6 fails:
1. Revert `tool.execute` hook
2. Return to P5 for user message fix

### If P7 fails:
1. Revert delegation tracking
2. Return to P6 for tool invocation fix

### If P8 fails:
1. Restore old directories from backup
2. Return to P7 for linking fix

---

## Registry Path

All delegation packets and returns will be tracked in:
- `.hivemind/activity/delegation/registry.json`
- `.hivemind/activity/delegation/{packet_id}-return.json`

Each phase will have:
- Delegation packet with scope, constraints, return contract
- Return with status, evidence, blocked routes
- Gate check result

---

## Current State

**Completed:**
- P0: Spec document created
- P0: Phase plan created
- P1: Context assessment complete
- P2: Writer design complete
- P1-A: Internal writer facade created (from earlier work)

**In Progress:**
- P3-A: TDD RED phase for consolidated writer

**Blocked:**
- None

**Next Action:**
- Execute P3-A: Write failing tests for consolidated writer (hitea agent)
[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
You are gsd-planner. Create a 7th PLAN file (58-PLAN-07) to fix the 5 gaps discovered during execution of PLAN-01..06.

# Context: 5 Gaps Discovered During Phase 58 Execution

Wave 1-4 implementation completed (11 atomic commits on `feature/harness-implementation` branch). Wave 5 regression run found 5 blockers:

## Gap 1: BATS slot 61 (G1 grep-guard) — file MISSING
- 58-PLAN-05:118 documents slot 61 collision with P56 (P56 owns `tests/scripts/tmux/61-stress-test-real-world-workflow.bats`)
- Resolution per CONTEXT.md:252: rename P58 G1 scenario to slot 67 if collision reported
- **Fix needed**: Create `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats`

## Gap 2: BATS slot 62 (G2) — FAIL
- Error: `[Harness] DelegationManager requires a client when v2 modules are not injected`
- Source: `src/coordination/delegation/manager.ts:78-89` — constructor throws if no `client` arg AND no `options.coordinator && options.???` injected
- Test: `tests/scripts/tmux/62-pool-status-api.bats:30` — `const instance = new Manager();`
- **Fix needed**: Add BATS-friendly no-arg construction path. Options:
  - (A) Add `__getDelegationsForTesting` static factory that returns a Manager with no client (in-memory only) — already proposed in CONTEXT.md:69
  - (B) Modify constructor to accept `client: undefined` and use null-object pattern
  - (C) Add a test seam method like `createManagerForTest()` that constructs a no-op manager
- **Recommended**: (A) — `static createForTest()` factory method on `DelegationManager`

## Gap 3: BATS slot 64+65 (G4+G5) — FAIL
- Error: `tmux-copilot` returns `{available:false, reason:"tmux-not-wired"}`
- Source: `src/tools/tmux-copilot.ts` — tool instantiated in BATS test without `TmuxMultiplexer` injection
- Tests: `tests/scripts/tmux/64-forward-prompt.bats:42-46` and `65-takeover-release.bats:64-67`
- **Fix needed**: Add test-wiring path so BATS can construct `tmuxCopilotTool` with a mock or test TmuxMultiplexer
- **Recommended**: Add `__setTmuxMultiplexerForTesting(mux: any)` test seam on the tool factory, similar to `__getDelegationsForTesting` pattern

## Gap 4: BATS slot 66 (G6) — FAIL
- Error: `TypeError: recordDelegationTerminal is not a function`
- Source: `src/features/session-tracker/tool-delegation.ts:432-447` — `recordDelegationTerminal` is a method on `ToolDelegation` class, not a module-level export
- Test: `tests/scripts/tmux/66-session-tracker-delegation-events.bats:36-37` — imports it as module-level function
- **Fix needed**: Either (A) re-export `recordDelegationTerminal` at module level OR (B) rewrite test to use class instance
- **Recommended**: (A) — add module-level `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` wrapper that delegates to a shared module-level event log (the `__testEventLog` from P25.1)

## Gap 5: BATS slot 66 file is staged but not committed
- File `tests/scripts/tmux/66-session-tracker-delegation-events.bats` (67 LOC) was checked out from remote `4c1089ae` and is in the index but uncommitted
- **Fix needed**: Commit it as part of PLAN-07

# Deliverables

Write 1 file: /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-07.md

PLAN-07 should contain 4 plans within (or 1 plan with 5 tasks, executor's call):

## Sub-Plan 07-1: Fix DelegationManager no-arg construction (Gap 2)
- Add `static createForTest(): DelegationManager` static factory on DelegationManager class
- Returns a manager with in-memory `delegations` Map, no client, no coordinator
- `getPoolSnapshot()` works on this instance
- Update BATS slot 62 test to use `DelegationManager.createForTest()` instead of `new Manager()`
- Acceptance: `bats tests/scripts/tmux/62-pool-status-api.bats` exits 0

## Sub-Plan 07-2: Add tmux-copilot test-wiring seam (Gap 3)
- Add `__setTmuxMultiplexerForTesting(mux: any)` test seam to `tmuxCopilotTool` factory
- Allow BATS to inject a mock multiplexer that captures `sendKeys` calls
- Update BATS slots 64+65 tests to call `__setTmuxMultiplexerForTesting` before invoking tool
- Acceptance: `bats tests/scripts/tmux/64-forward-prompt.bats` and `65-takeover-release.bats` both exit 0

## Sub-Plan 07-3: Re-export recordDelegationTerminal at module level (Gap 4)
- Add module-level `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` export in `src/features/session-tracker/tool-delegation.ts`
- Module-level wrapper appends to shared `__testEventLog` (already exists at P25.1)
- Update BATS slot 66 test (already on disk, just imports the new export)
- Acceptance: `bats tests/scripts/tmux/66-session-tracker-delegation-events.bats` exits 0

## Sub-Plan 07-4: Create BATS slot 67 (Gap 1) + commit slot 66 (Gap 5)
- Create `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats` with the 3 grep assertions from PLAN-05
- Commit the existing `tests/scripts/tmux/66-session-tracker-delegation-events.bats` (currently staged in index)
- Acceptance: `bats tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats` exits 0
- Slot 66 file is committed

# Required Reading

1. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-02.md (G2 context)
2. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-03.md (G4+G5 context)
3. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-04.md (G6 context)
4. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-05.md (regression context, slot 67 rename instruction)
5. /Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-REPORT.md (full verifier verdict)

# Plan Frontmatter Format

```yaml
---
phase: 58-tmux-orchestration-programmatic-pool
plan: 07
type: execute
wave: 7
depends_on: [01, 02, 03, 04, 05, 06]
files_modified: [src/coordination/delegation/manager.ts, src/tools/tmux-copilot.ts, src/features/session-tracker/tool-delegation.ts, tests/scripts/tmux/66-session-tracker-delegation-events.bats, tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats]
autonomous: true
requirements: [REQ-58-01, REQ-58-02, REQ-58-04, REQ-58-05, REQ-58-06]
user_setup: []

must_haves:
  truths:
    - "DelegationManager.createForTest() returns a no-arg manager that supports getPoolSnapshot()"
    - "tmuxCopilotTool.__setTmuxMultiplexerForTesting() accepts a mock mux for BATS"
    - "recordDelegationTerminal is exported at module level in tool-delegation.ts"
    - "BATS slot 67 (G1 grep-guard) exists and passes"
    - "BATS slots 62, 64, 65, 66 all exit 0"
    - "BATS slots 57-60 P55 regression all exit 0"
  artifacts:
    - "src/coordination/delegation/manager.ts has createForTest static method"
    - "src/tools/tmux-copilot.ts has __setTmuxMultiplexerForTesting seam"
    - "src/features/session-tracker/tool-delegation.ts exports recordDelegationTerminal at module level"
    - "tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats exists"
  key_links:
    - "PLAN-07 fixes the 5 blockers found during PLAN-01..06 execution"
    - "createForTest() uses __getDelegationsForTesting seam already added in PLAN-02"
    - "recordDelegationTerminal wraps the existing __testEventLog from P25.1"
---
```

# Task XML Format

Each task: read_first + concrete action + acceptance_criteria + automated verify

# Atomic Commit Per File

- phase-58: PLAN-07 — 58-PLAN-07.md (planning artifact)

After executor runs the plan, executor will commit per-task code changes.

# Boundary Rules

- READ-ONLY on src/ (for reading context)
- WRITE-ONLY to 58-PLAN-07.md
- 50,000 chars max
- Cite file:line for all references
- Honor 3 research drifts (Q1-Q3) — these are implementation fixes, no spec changes

# Return Format

After completion, return:
- File path of 58-PLAN-07.md
- LOC
- Atomic commit SHA
- Sub-plan count (4) and task count
- Gate triad verdict for the plan artifact

Execute end-to-end. Write PLAN-07 directly.
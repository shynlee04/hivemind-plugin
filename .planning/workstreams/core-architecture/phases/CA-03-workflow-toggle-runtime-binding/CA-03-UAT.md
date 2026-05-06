---
status: active
phase: CA-03-workflow-toggle-runtime-binding
source:
  - CA-03-01-SUMMARY.md
  - CA-03-02-SUMMARY.md
  - CA-03-03-SUMMARY.md
started: 2026-05-06T15:30:00Z
updated: 2026-05-06T15:30:00Z
---

## Current Test

[e2e runtime validation — requires live OpenCode session with configs.json present]

## CA-03 Own UATs (New — This Phase's Deliverables)

### 1. Governance Block Injection in Live System Prompt
expected: |
  In a live OpenCode session with configs.json containing mode=expert-advisor, user_expert_level=intermediate-high-level,
  conversation_language=en, documents_and_artifacts_language=en — the system prompt MUST contain the governance block
  at the beginning of the system context:
  ```
  --- Governance ---
  You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and documents.
  communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high
  ```
  This must be observable in any session where the plugin is loaded.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: 8/8 governance-block tests pass (npx vitest run tests/hooks/governance-block.test.ts)

### 2. Governance Block Position — Before Intake and Behavioral Blocks
expected: |
  The governance block must appear BEFORE the "Session intake context:" and "Behavioral profile context:" blocks
  in the system prompt. This ensures governance framing is applied before any other context.
  Verification: inspect system prompt in a session with intake data and configs.json present.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: 32/32 core-hooks tests pass (npx vitest run tests/hooks/create-core-hooks.test.ts)

### 3. Governance Block — All Mode Variations
expected: |
  With configs.json mode changed to each of: "expert-advisor", "hivemind-powered", "free-style":
  - expert-advisor → "You are operating in expert-advisor mode."
  - hivemind-powered → "You are operating in hivemind-powered mode with strict guardrails."
  - free-style → "You are operating in free-style mode."
  Verification: restart plugin after each config change and observe system prompt.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: mode mapping tests pass

### 4. Toggle Gate — research Toggle Gates Research-Phase Hooks
expected: |
  With workflow.research=false in configs.json, research-related hooks (research_before_questions gating)
  do NOT activate during a session. With workflow.research=true, they do.
  Verification: run a session, observe whether research-phase hooks fire when research toggle is off vs on.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: isToggleEnabled works correctly for all 6 toggles

### 5. Toggle Gate — use_worktrees Toggle Controls Worktree Isolation
expected: |
  With workflow.use_worktrees=false, parallel tasks should NOT create git worktrees. They run sequentially on the main tree.
  With workflow.use_worktrees=true, worktree isolation is used.
  Verification: observe git worktree list during a parallel task execution with toggle off vs on.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: toggle-gates.test.ts passes

### 6. Execution Field — parallelization Controls DelegationManager Dispatch
expected: |
  With parallelization=false in configs.json, DelegationManager.dispatch() uses concurrency limit=1 (sequential) instead
  of the default concurrent dispatch. Multiple delegated tasks run one-at-a-time.
  Verification: dispatch 3 tasks with parallelization=false, observe sequential execution in session logs.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: 4/4 parallelization toggle tests pass (npx vitest run tests/lib/delegation-manager.test.ts -t "parallelization")

### 7. Execution Field — atomic_commit Controls Continuity Persistence
expected: |
  With atomic_commit=false, persistStore() updates in-memory state (store.updatedAt) but does NOT write to disk.
  With atomic_commit=true, atomic write with temp file + rename occurs.
  Verification: check .hivemind/state/continuity.json timestamp updates with toggle on vs off.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: 3/3 atomic_commit tests pass (npx vitest run tests/lib/continuity.test.ts)

### 8. Execution Field — commit_docs Controls Delegation Persistence
expected: |
  With commit_docs=false, persistDelegations() returns early without writing delegations.json to disk.
  With commit_docs=true, delegations.json is written on each persistence call.
  Verification: check .hivemind/state/delegations.json presence with toggle on vs off.
result: pending
blocked_by: needs-live-opencode-session
unit_test_status: 3/3 commit_docs tests pass (npx vitest run tests/lib/delegation-persistence.test.ts)

## CA-01 Inherited UATs (Runtime-Dependent)

### CA-01-UAT-6: Missing Config Fallback
expected: Plugin loads without configs.json, uses defaults, does not crash
result: blocked (→ e2e)
unit_test: 8/8 passes
validated_by: CA-03 (unit test layer)

### CA-01-UAT-7: Config Cache Hit
expected: Cache survives multiple hook invocations in live session
result: blocked (→ e2e)
unit_test: 8/8 passes
validated_by: CA-03 (unit test layer)

### CA-01-UAT-8: Cache Invalidation
expected: Invalidation triggers actual disk re-read in running plugin
result: blocked (→ e2e)
unit_test: 8/8 passes
validated_by: CA-03 (unit test layer)

### CA-01-UAT-9: Hook Binding — hivemindConfig on deps
expected: Governance block appears in system prompt during live session
result: blocked (→ e2e)
unit_test: 32/32 passes
validated_by: CA-03 (unit test layer)

## CA-02 Inherited UATs (Runtime-Dependent)

All 7 CA-02 UATs test runtime-observable behaviors (profile resolution, hook injection, delegation guardrails, skill filtering, plugin wiring). They remain blocked pending e2e OpenCode runtime verification. See CA-02-UAT.md for per-test details.

## Summary

total: 19
passed: 0
blocked: 19
pending: 0
issues: 0
skipped: 0

### By layer

| Layer | Count | Status |
|-------|-------|--------|
| CA-03 own UATs | 8 | All blocked — need live OpenCode session |
| CA-01 inherited (runtime) | 4 | Blocked — unit tests pass, e2e pending |
| CA-02 inherited (runtime) | 7 | Blocked — unit tests pass, e2e pending |

### Unit Test Gate (All Pass)

| Test Suite | Tests | Status |
|-----------|-------|--------|
| governance-block.test.ts | 8 | ✅ |
| toggle-gates.test.ts | 10 | ✅ |
| create-core-hooks.test.ts | 32 | ✅ |
| delegation-manager.test.ts | 121 | ✅ |
| continuity.test.ts | 41 | ✅ |
| delegation-persistence.test.ts | 17 | ✅ |
| hivemind-configs.schema.test.ts | 44 | ✅ |
| Full suite (npm test) | 1765/1767 | ✅ (2 pre-existing failures) |

## Gaps

**E2e runtime validation strategy:**

To validate the 19 blocked UATs, an OpenCode session must be launched with the harness plugin loaded and configs.json present. The following verification sequence must be performed:

1. **Launch OpenCode** with configs.json containing `{ mode: "expert-advisor", ... }` and all workflow toggles = true
2. **Inspect system prompt** — verify governance block at position 0 with correct format
3. **Change mode** to "hivemind-powered" → restart → verify governance block updates
4. **Set workflow.research=false** → verify research hooks do not activate
5. **Set parallelization=false** → dispatch multiple tasks → verify sequential execution
6. **Set atomic_commit=false** → verify .hivemind/state/continuity.json not written
7. **Remove configs.json** → verify plugin loads with defaults, no crash
8. **Check cache** → verify getCachedConfig() survives multiple hook invocations

Each step produces a pass/fail result with evidence (system prompt capture, log output, file timestamps).

**Unit test layer: COMPLETE** — all 1765 tests pass, zero regressions from CA-03 wiring.
**E2e runtime layer: PENDING** — requires live OpenCode session (blocked by test environment availability).

## Verified At Build Time

All unit tests, typecheck, and build pass:
- `npm run typecheck` → 0 errors
- `npm run build` → success
- `npm test` → 1765/1767 pass (2 pre-existing failures)
- All @future-consumer JSDoc annotations present on 7 unwired toggles

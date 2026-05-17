---
phase: CP-DT-01
plan: 05
type: execute
wave: 5
depends_on:
  - CP-DT-01-04
files_modified:
  - tests/integration/delegation-v2-integration.test.ts
  - tests/lib/coordination/delegation/full-pipeline.test.ts
  - tests/tools/delegation/delegate-task-e2e.test.ts
  - src/coordination/delegation/manager.ts
  - src/plugin.ts
autonomous: false
requirements:
  - REQ-DT-01
  - REQ-DT-02
  - REQ-DT-03
  - REQ-DT-04
  - REQ-DT-05
  - REQ-DT-06
  - REQ-DT-07
  - REQ-DT-08
  - REQ-DT-09
  - REQ-DT-10
  - REQ-DT-11
  - REQ-CD-01
  - REQ-CD-02
  - REQ-CD-03
  - REQ-NT-01
  - REQ-NT-02
  - REQ-NT-03
  - REQ-MT-01
  - REQ-MT-02
  - REQ-MT-03
  - REQ-MT-04
  - REQ-AL-01
  - REQ-AL-02
  - REQ-RC-01
  - REQ-RC-02
  - REQ-RC-03
  - REQ-DC-01
  - REQ-DC-02
  - REQ-DC-03
  - REQ-DC-04
  - NFR-01
  - NFR-02
  - NFR-03
  - NFR-04
  - NFR-05
  - NFR-06

must_haves:
  truths:
    - "Full pipeline: preflight → dispatch → monitor → completion → notification works end-to-end"
    - "3 sequential delegations complete với correct notifications to each parent"
    - "4 control actions (abort/cancel/restart/redirect) work on active delegations"
    - "Auto-loop completes 3 iterations với context chaining"
    - "Ralph-loop rotates through 2 agents for 2 cycles"
    - "5 pre-existing test failures in unrelated modules unchanged"
    - "418 session-tracker tests still pass"
    - "Plugin wires new modules correctly"
  artifacts:
    - path: "tests/integration/delegation-v2-integration.test.ts"
      provides: "End-to-end integration tests covering full delegation lifecycle"
    - path: "src/plugin.ts"
      provides: "Updated plugin wiring for v2 delegation modules"
      contains: "DelegationCoordinator"
  key_links:
    - from: "src/plugin.ts"
      to: "src/coordination/delegation/coordinator.ts"
      via: "Module instantiation và injection"
      pattern: "new DelegationCoordinator"
    - from: "tests/integration/delegation-v2-integration.test.ts"
      to: "src/tools/delegation/delegate-task.ts"
      via: "Full pipeline test"
      pattern: "delegateTaskTool"
---

<objective>
Integration tests, plugin wiring, và final validation. Wire new modules vào plugin.ts. Run full test suite. Verify no regressions. JSDoc audit.

Purpose: Đảm bảo toàn bộ ecosystem hoạt động end-to-end. Plugin wiring kết nối tất cả modules. Test suite xanh.
Output: Integration tests + wired plugin + clean test run.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
@src/plugin.ts
@src/coordination/delegation/manager.ts
@src/coordination/delegation/coordinator.ts
@src/coordination/delegation/dispatcher.ts
@src/coordination/delegation/slot-manager.ts
@src/coordination/delegation/agent-resolver.ts
@src/coordination/delegation/monitor.ts
@src/coordination/delegation/escalation-timer.ts
@src/coordination/delegation/notification-router.ts
@src/coordination/delegation/lifecycle.ts
@src/coordination/delegation/retry-handler.ts
@src/coordination/completion/detector.ts
@src/tools/delegation/delegate-task.ts
@src/tools/delegation/delegation-status.ts
@src/features/auto-loop/index.ts
@src/features/ralph-loop/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Plugin wiring + integration tests + regression check + JSDoc audit</name>
  <files>
    src/plugin.ts,
    tests/integration/delegation-v2-integration.test.ts,
    tests/lib/coordination/delegation/full-pipeline.test.ts,
    tests/tools/delegation/delegate-task-e2e.test.ts
  </files>
  <action>
    **Step 1 — Wire plugin.ts** (~30 LOC changes):
    - Update `setupDelegationModules()` (or equivalent init function):
      1. Instantiate `SlotManager`
      2. Instantiate `AgentResolver`
      3. Instantiate `DelegationDispatcher({ categoryGates, slotManager, agentResolver })`
      4. Instantiate `EscalationTimer` (per-delegation, created by monitor)
      5. Instantiate `NotificationRouter`
      6. Instantiate `DelegationLifecycle`
      7. Instantiate `DelegationRetryHandler`
      8. Instantiate `CompletionDetector` (existing, enhanced)
      9. Instantiate `DelegationCoordinator({ dispatcher, monitor, notificationRouter, lifecycle, detector, retryHandler })`
      10. Pass coordinator to `DelegationManager` constructor
    - Verify: `npm run typecheck` passes after wiring
    - Pattern: dependency injection via constructor, NOT singleton globals

    **Step 2 — Create integration tests** (`tests/integration/delegation-v2-integration.test.ts`):
    - Test 1: Full pipeline — preflight passes → dispatch → monitoring starts → completion signal → notification routed → slot released
    - Test 2: 3 concurrent delegations → each completes independently → correct notifications to each parent
    - Test 3: Category gate deny → audit logged → error response → no delegation created
    - Test 4: Depth limit exceeded → error response → no delegation created
    - Test 5: Timeout flow — delegation exceeds safety ceiling → escalation fires TERMINATE → lifecycle marks timeout
    - Test 6: Control action abort — active delegation aborted → child terminated → notification routed
    - Test 7: Control action redirect — active delegation redirected to new agent → new delegation created
    - Test 8: Auto-loop 3 iterations — sequential completion → context chaining → final result
    - Test 9: Ralph-loop 2 agents 2 cycles — rotation correct → context chaining
    - These tests use mock SDK — verify wiring, NOT actual OpenCode runtime

    **Step 3 — Create full-pipeline test** (`tests/lib/coordination/delegation/full-pipeline.test.ts`):
    - Tests the coordinator → dispatcher → monitor → detector → notification flow
    - Verifies module composition works correctly
    - 5 tests covering: happy path, preflight fail, timeout, abort, concurrent

    **Step 4 — Create e2e tool test** (`tests/tools/delegation/delegate-task-e2e.test.ts`):
    - Tests tool handler end-to-end with mocked SDK
    - 4 tests: valid dispatch, invalid input, control actions, backward compat

    **Step 5 — Regression check**:
    ```bash
    # Full test suite
    npm test 2>&1 | tail -20
    # Session-tracker tests
    npx vitest run tests/lib/features/session-tracker/ --reporter=verbose 2>&1 | tail -5
    # Typecheck
    npm run typecheck
    ```
    - Expected: 5 pre-existing failures unchanged (known baseline from STATE.md)
    - Expected: 418 session-tracker tests pass
    - Expected: All new delegation tests pass

    **Step 6 — JSDoc audit**:
    - Verify all new public functions have JSDoc with `@param`, `@returns`, `@throws` tags
    - Check files: dispatcher.ts, slot-manager.ts, agent-resolver.ts, monitor.ts, escalation-timer.ts, notification-router.ts, lifecycle.ts, retry-handler.ts, coordinator.ts
    - Pattern: `/** Brief description.\n *\n * @param x - Description\n * @returns Description\n * @throws {Error} When...\n */`

    Commit message: `feat(CP-DT-01): wire plugin, add integration tests, verify no regressions`
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -30</automated>
  </verify>
  <done>
    - Plugin.ts wires all new modules via DI
    - 18 integration/pipeline/e2e tests pass
    - 418 session-tracker tests pass (no regression)
    - All delegation tests pass (no regression)
    - 5 pre-existing failures unchanged (known baseline)
    - `npm run typecheck` clean
    - JSDoc on all public functions in new modules
    - Total new code: ~1,600 LOC across ~12 modules (NFR-06 target met)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plugin init → All modules | DI wiring boundary — single composition root |
| Integration tests → Mock SDK | Tests verify wiring, NOT runtime — mock boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-DT-05-01 | T (Tampering) | plugin.ts | mitigate | DI wiring centralized in one function — easy to audit |
| T-CP-DT-05-02 | I (Info disclosure) | integration tests | accept | Test fixtures contain no secrets — low value |
</threat_model>

<verification>
```bash
# Full suite
npm test 2>&1 | tail -30
# Typecheck
npm run typecheck
# Module LOC audit
wc -l src/coordination/delegation/dispatcher.ts src/coordination/delegation/slot-manager.ts src/coordination/delegation/agent-resolver.ts src/coordination/delegation/monitor.ts src/coordination/delegation/escalation-timer.ts src/coordination/delegation/notification-router.ts src/coordination/delegation/lifecycle.ts src/coordination/delegation/retry-handler.ts src/coordination/delegation/coordinator.ts src/features/auto-loop/index.ts src/features/ralph-loop/index.ts src/tools/delegation/delegate-task.ts src/tools/delegation/delegation-status.ts
```
</verification>

<success_criteria>
- 18+ integration/pipeline/e2e tests pass
- 418 session-tracker tests pass (no regression)
- All delegation module tests pass
- 5 pre-existing failures unchanged
- `npm run typecheck` clean
- Plugin.ts wires all modules correctly
- JSDoc on all public functions
- Total delegation module LOC ≤ 1,600 (NFR-06)
- No module exceeds 500 LOC (DC-01)
- manager.ts ≤ 200 LOC
</success_criteria>

<output>
After completion, create `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md`
</output>

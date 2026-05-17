---
phase: CP-DT-01
plan: 04
type: execute
wave: 4
depends_on:
  - CP-DT-01-03
files_modified:
  - src/coordination/delegation/manager.ts
  - src/features/auto-loop/index.ts
  - src/features/auto-loop/types.ts
  - src/features/ralph-loop/index.ts
  - src/features/ralph-loop/types.ts
  - tests/lib/coordination/delegation/manager-decomposition.test.ts
  - tests/lib/features/auto-loop.test.ts
  - tests/lib/features/ralph-loop.test.ts
autonomous: true
requirements:
  - REQ-AL-01
  - REQ-AL-02
  - REQ-RC-01
  - REQ-RC-02
  - REQ-RC-03
  - NFR-05
  - NFR-06

must_haves:
  truths:
    - "manager.ts decomposed from 504 LOC god-object → thin facade < 200 LOC delegating to new modules"
    - "Auto-loop creates sequential delegations cho same agent với configurable max iterations"
    - "Ralph-loop creates cycling delegations rotating through agent list"
    - "Chaining: delegation A completion → auto-trigger delegation B with A's result as context"
    - "418 session-tracker tests still pass unchanged"
    - "All existing delegation tests still pass (backward compat)"
    - "manager.ts public API unchanged — internal decomposition transparent"
  artifacts:
    - path: "src/coordination/delegation/manager.ts"
      provides: "Thin facade over decomposed modules — public API preserved"
      max_lines: 200
    - path: "src/features/auto-loop/index.ts"
      provides: "Auto-loop sequential delegation engine"
      exports: ["AutoLoopEngine"]
    - path: "src/features/ralph-loop/index.ts"
      provides: "Ralph-loop cycling delegation engine"
      exports: ["RalphLoopEngine"]
  key_links:
    - from: "src/coordination/delegation/manager.ts"
      to: "src/coordination/delegation/coordinator.ts"
      via: "delegated method calls"
      pattern: "this\\.coordinator\\."
    - from: "src/features/auto-loop/index.ts"
      to: "src/coordination/delegation/coordinator.ts"
      via: "coordinator.dispatch() for each iteration"
      pattern: "coordinator\\.dispatch"
    - from: "src/features/ralph-loop/index.ts"
      to: "src/coordination/delegation/coordinator.ts"
      via: "coordinator.dispatch() for each agent rotation"
      pattern: "coordinator\\.dispatch"
---

<objective>
Decompose manager.ts god-object thành thin facade. Create auto-loop và ralph-loop engines. Implement chaining. Surgical refactoring — public API preserved, internal delegation to new modules.

Purpose: Kết thúc god-object pattern. manager.ts trở thành thin router. Auto/ralph loops enable sequential/cycling delegation patterns.
Output: Decomposed manager + auto-loop + ralph-loop + chaining + tests.
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
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
@src/coordination/delegation/manager.ts
@src/coordination/delegation/coordinator.ts
@src/coordination/delegation/dispatcher.ts
@src/coordination/delegation/slot-manager.ts
@src/coordination/delegation/monitor.ts
@src/coordination/delegation/notification-router.ts
@src/coordination/delegation/lifecycle.ts
@src/coordination/delegation/state-machine.ts
@src/coordination/completion/detector.ts
</context>

<interfaces>
<!-- Current manager.ts public API — MUST be preserved -->

From src/coordination/delegation/manager.ts (EXISTING — to be decomposed):
```typescript
export class DelegationManager {
  // Public API — preserved during decomposition
  dispatchDelegation(client: OpenCodeClient, params: DispatchParams): Promise<DelegationResult>;
  getStatus(delegationId: string): DelegationResult | undefined;
  listDelegations(sessionId?: string): DelegationResult[];
  abortDelegation(delegationId: string): DelegationResult;
  cancelDelegation(delegationId: string): DelegationResult;
  getChildSessionId(delegationId: string): string | undefined;
  // Internal state
  private delegations: Map<string, Delegation>;
  private activeMonitors: Map<string, DelegationMonitor>;
}
```

From src/coordination/delegation/coordinator.ts (Plan 02):
```typescript
export class DelegationCoordinator {
  dispatch(params: DispatchParams): Promise<DelegationResult>;
  handleCompletion(delegationId: string, result: DelegationResult): void;
  handleTimeout(delegationId: string): void;
}
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Decompose manager.ts → thin facade + auto-loop + ralph-loop</name>
  <files>
    src/coordination/delegation/manager.ts,
    src/features/auto-loop/index.ts,
    src/features/auto-loop/types.ts,
    src/features/ralph-loop/index.ts,
    src/features/ralph-loop/types.ts,
    tests/lib/coordination/delegation/manager-decomposition.test.ts,
    tests/lib/features/auto-loop.test.ts,
    tests/lib/features/ralph-loop.test.ts
  </files>
  <behavior>
    - Test 1: manager.dispatchDelegation() delegates to coordinator.dispatch() — same public API
    - Test 2: manager.getStatus() reads from lifecycle module — same return type
    - Test 3: manager.listDelegations() returns filtered list — same behavior
    - Test 4: manager.abortDelegation() delegates to lifecycle.markAborted() — same side effects
    - Test 5: Auto-loop: 3 iterations with same agent → 3 sequential coordinator.dispatch() calls
    - Test 6: Auto-loop: maxIterations=0 → rejects with error
    - Test 7: Auto-loop: iteration N uses result from N-1 as context
    - Test 8: Auto-loop: early termination when result status is terminal failure
    - Test 9: Ralph-loop: 2 agents → alternates A, B, A, B for 4 iterations
    - Test 10: Ralph-loop: empty agent list → rejects with error
    - Test 11: Ralph-loop: each iteration result feeds into next prompt
    - Test 12: Chaining: delegation A completes → auto-trigger delegation B with A's result
    - Test 13: Chaining: chain stops when delegation fails
  </behavior>
  <action>
    **TDD RED phase first — write all 13 failing tests BEFORE implementation.**

    **Surgical refactoring (P-10 pattern):** Decompose manager.ts IN PLACE. Public API signature unchanged. Internal implementation delegates to new modules.

    Step 1 — Decompose `manager.ts` (target: < 200 LOC):
    - Keep class signature and all public methods
    - Replace internal logic with delegation:
      - `dispatchDelegation()` → `this.coordinator.dispatch()` + native Task
      - `getStatus()` → `this.lifecycle.getStatus()`
      - `listDelegations()` → `this.lifecycle.list()`
      - `abortDelegation()` → `this.lifecycle.markAborted()`
      - `cancelDelegation()` → `this.lifecycle.markCancelled()`
      - `getChildSessionId()` → `this.lifecycle.getChildSessionId()`
    - Constructor injects all sub-modules
    - Remove 30+ cross-cutting imports → replaced with coordinator, lifecycle, monitor
    - Keep delegation store (`Map<string, Delegation>`) in lifecycle module, not manager

    Step 2 — Create `src/features/auto-loop/` (~100 LOC):
    - `AutoLoopEngine` class
    - `run(opts: AutoLoopOpts): Promise<AutoLoopResult>`
    - `AutoLoopOpts`: `{ agent, initialPrompt, maxIterations, stopCondition?, contextBuilder? }`
    - Sequential execution: iteration N waits for N-1 completion
    - Context injection: previous result summary appended to next prompt
    - Early termination: if `stopCondition(result)` returns true, stop
    - Default stop: terminal failure status

    Step 3 — Create `src/features/ralph-loop/` (~100 LOC):
    - `RalphLoopEngine` class
    - `run(opts: RalphLoopOpts): Promise<RalphLoopResult>`
    - `RalphLoopOpts`: `{ agents: string[], initialPrompt, maxCycles, contextBuilder? }`
    - Rotates through agent list: agents[0], agents[1], ..., agents[N], agents[0], ...
    - Same context injection as auto-loop
    - Tracks per-agent results in `RalphLoopResult.agentResults`

    Step 4 — Chaining (in coordinator):
    - `chain(delegations: ChainStep[]): Promise<DelegationResult[]>`
    - `ChainStep`: `{ agent, prompt, usePreviousResult?: boolean }`
    - Sequential: step N waits for step N-1
    - If any step fails → chain stops, returns partial results
    - Previous result injection: appends `\n\nPrevious result: {summary}` to prompt

    Step 5 — Register `.gitkeep` files:
    - `src/features/auto-loop/.gitkeep`
    - `src/features/ralph-loop/.gitkeep`

    Commit message: `feat(CP-DT-01): decompose manager.ts + add auto-loop, ralph-loop, chaining`
  </action>
  <verify>
    <automated>npx vitest run tests/lib/coordination/delegation/manager-decomposition.test.ts tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 13 tests pass
    - manager.ts < 200 LOC (down from 504)
    - Public API unchanged — all existing callers work
    - Auto-loop sequential iterations với context injection
    - Ralph-loop agent rotation cycling
    - Chaining with early termination on failure
    - All files < 150 LOC each
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Manager facade → Sub-modules | Internal decomposition boundary — public API unchanged |
| Auto-loop/Ralph-loop → Coordinator | Loop engines dispatch via coordinator — same trust boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-DT-04-01 | D (Denial of service) | auto-loop.ts | mitigate | maxIterations configurable + enforced, prevents infinite loops |
| T-CP-DT-04-02 | D (Denial of service) | ralph-loop.ts | mitigate | maxCycles configurable + enforced |
| T-CP-DT-04-03 | R (Repudiation) | manager.ts | mitigate | Decomposition preserves audit trail — all transitions still logged via lifecycle |
</threat_model>

<verification>
```bash
# New tests pass
npx vitest run tests/lib/coordination/delegation/manager-decomposition.test.ts tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose
# Existing delegation tests still pass (backward compat)
npx vitest run tests/lib/coordination/delegation/ --reporter=verbose
# Session-tracker tests unaffected
npx vitest run tests/lib/features/session-tracker/ --reporter=verbose
# Typecheck
npm run typecheck
```
</verification>

<success_criteria>
- 13 new tests pass
- manager.ts < 200 LOC (down from 504)
- Public API preserved (NFR-05 backward compat)
- Auto-loop: configurable iterations, context injection, early termination
- Ralph-loop: agent rotation, context injection
- Chaining: sequential with failure stop
- All existing tests still pass (418 session-tracker + delegation tests)
- `npm run typecheck` clean
</success_criteria>

<output>
After completion, create `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md`
</output>

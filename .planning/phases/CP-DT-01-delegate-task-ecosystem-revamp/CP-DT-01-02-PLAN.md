---
phase: CP-DT-01
plan: 02
type: execute
wave: 2
depends_on:
  - CP-DT-01-01
files_modified:
  - src/coordination/delegation/coordinator.ts
  - src/coordination/completion/detector.ts
  - tests/lib/coordination/delegation/coordinator.test.ts
  - tests/lib/coordination/completion/detector-v2.test.ts
autonomous: true
requirements:
  - REQ-CD-01
  - REQ-CD-02
  - REQ-CD-03
  - REQ-MT-03
  - REQ-MT-04
  - NFR-01
  - NFR-02

must_haves:
  truths:
    - "Coordinator wires dispatcher → native Task → monitor → completion trong đúng sequence"
    - "Coordinator dispatches 3 delegations sequentially, mỗi completion signal đúng"
    - "CompletionDetector v2 nhận WaiterModel dual-signal: completion_event + terminal status"
    - "CompletionDetector v2 fires callback đúng 1 lần cho mỗi delegation"
    - "Status polling latency < 2s per NFR-01"
    - "Monitor hot-path overhead < 5ms per NFR-02"
  artifacts:
    - path: "src/coordination/delegation/coordinator.ts"
      provides: "Thin wire coordinator — orchestrates dispatch → dispatch → monitor → completion"
      exports: ["DelegationCoordinator"]
      min_lines: 40
    - path: "src/coordination/completion/detector.ts"
      provides: "CompletionDetector v2 — dual-signal WaiterModel completion"
      exports: ["CompletionDetector"]
      contains: "dualSignal"
  key_links:
    - from: "src/coordination/delegation/coordinator.ts"
      to: "src/coordination/delegation/dispatcher.ts"
      via: "dispatcher.preflightCheck()"
      pattern: "preflightCheck"
    - from: "src/coordination/delegation/coordinator.ts"
      to: "src/coordination/delegation/monitor.ts"
      via: "monitor.start()"
      pattern: "monitor\\.start"
    - from: "src/coordination/delegation/coordinator.ts"
      to: "src/coordination/completion/detector.ts"
      via: "detector.watch()"
      pattern: "detector\\.watch"
    - from: "src/coordination/completion/detector.ts"
      to: "src/coordination/delegation/lifecycle.ts"
      via: "lifecycle.isTerminal()"
      pattern: "isTerminal"
---

<objective>
Wire coordinator that orchestrates dispatch→Task→monitor→completion. Extend CompletionDetector với WaiterModel dual-signal. Coordinator là thin wiring layer — NO business logic.

Purpose: Biến individual modules từ Plan 01 thành một connected pipeline. Coordinator = 50-80 LOC thin wire.
Output: Working coordinator + enhanced completion detector + tests.
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
@src/coordination/delegation/dispatcher.ts
@src/coordination/delegation/slot-manager.ts
@src/coordination/delegation/agent-resolver.ts
@src/coordination/delegation/monitor.ts
@src/coordination/delegation/escalation-timer.ts
@src/coordination/delegation/notification-router.ts
@src/coordination/delegation/lifecycle.ts
@src/coordination/delegation/retry-handler.ts
@src/coordination/completion/detector.ts
@src/shared/session-api.ts
@src/shared/types.ts
</context>

<interfaces>
<!-- From Plan 01 outputs — executor MUST read these files first -->

From src/coordination/delegation/dispatcher.ts (Plan 01):
```typescript
export class DelegationDispatcher {
  preflightCheck(params: PreflightParams): PreflightResult;
}
export interface PreflightParams { agent: string; category?: string; currentDepth: number; sessionId: string; queueKey: string; }
export interface PreflightResult { slotHandle: SlotHandle; validatedAgent: ResolvedAgent; queueKey: string; }
```

From src/coordination/delegation/monitor.ts (Plan 01):
```typescript
export class DelegationMonitor {
  start(delegationId: string, parentSessionId: string, opts?: MonitorOpts): void;
  stop(): void;
  onCompletion(): void;
}
```

From src/coordination/delegation/notification-router.ts (Plan 01):
```typescript
export class NotificationRouter {
  register(delegationId: string, parentSessionId: string): void;
  route(notification: DelegationNotification): RouteResult;
  deregister(delegationId: string): void;
}
```

From src/coordination/delegation/lifecycle.ts (Plan 01):
```typescript
export class DelegationLifecycle {
  transition(delegationId: string, toStatus: DelegationStatus): DelegationResult;
  isTerminal(status: DelegationStatus): boolean;
  markTimeout(delegationId: string): DelegationResult;
}
```

From src/coordination/completion/detector.ts (EXISTING):
```typescript
export class CompletionDetector {
  watch(delegationId: string, childSessionId: string, callback: CompletionCallback): void;
  unwatch(delegationId: string): void;
}
export type CompletionCallback = (result: DelegationResult) => void;
```

From src/shared/session-api.ts:
```typescript
export function createSession(client: OpenCodeClient, opts: SessionCreateOpts): Promise<SessionHandle>;
export function sendPrompt(client: OpenCodeClient, sessionId: string, prompt: string): Promise<void>;
export function getSessionMessages(client: OpenCodeClient, sessionId: string): Promise<Message[]>;
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement DelegationCoordinator thin wire</name>
  <files>
    src/coordination/delegation/coordinator.ts,
    tests/lib/coordination/delegation/coordinator.test.ts
  </files>
  <behavior>
    - Test 1: Coordinator executes preflight → creates delegation record → starts monitor → returns delegation ID
    - Test 2: Preflight failure (category deny) → no delegation record created, monitor NOT started
    - Test 3: 3 sequential delegations → mỗi receives đúng completion callback
    - Test 4: Completion signal → monitor.onCompletion() called, notification routed, slot released
    - Test 5: Timeout from escalation → lifecycle.markTimeout(), notification routed, slot released
    - Test 6: Coordinator handles concurrent delegations independently (no cross-talk)
  </behavior>
  <action>
    **TDD RED phase first — write all 6 failing tests BEFORE implementation.**

    Create `coordinator.ts` (~80 LOC):
    - `DelegationCoordinator` class — thin wire, injected dependencies via constructor:
      ```typescript
      constructor(deps: {
        dispatcher: DelegationDispatcher;
        monitor: DelegationMonitor;
        notificationRouter: NotificationRouter;
        lifecycle: DelegationLifecycle;
        detector: CompletionDetector;
        retryHandler: DelegationRetryHandler;
      })
      ```
    - `dispatch(params: DispatchParams): Promise<DelegationResult>` — main flow:
      1. `dispatcher.preflightCheck()` — validates everything (throws on failure)
      2. Generate delegation ID: `dt-{timestamp}-{random}`
      3. `lifecycle.transition(id, 'DISPATCHED')`
      4. `notificationRouter.register(id, params.parentSessionId)`
      5. `monitor.start(id, params.parentSessionId)`
      6. Return `{ delegationId: id, status: 'DISPATCHED', ... }` — caller handles actual Task dispatch
    - `handleCompletion(delegationId: string, result: DelegationResult): void`:
      1. `monitor.onCompletion()`
      2. `lifecycle.transition(delegationId, result.status)`
      3. `notificationRouter.route({ type: 'success'|'failure', delegationId, ... })`
      4. `notificationRouter.deregister(delegationId)`
      5. `retryHandler.persist()` — persist updated delegation record
    - `handleTimeout(delegationId: string): void`:
      1. `lifecycle.markTimeout(delegationId)`
      2. `notificationRouter.route({ type: 'timeout', delegationId, ... })`
      3. Same cleanup as completion

    **Key pattern (P-01 from PATTERN.md):** Coordinator wraps native Task tool. It does NOT call `promptAsync` or `createSession` directly. The actual Task dispatch happens in the tool layer (Plan 03). Coordinator only manages pre/post orchestration.

    Tests use mock dependencies — verify call sequences, NOT implementation details.

    Commit message: `feat(CP-DT-01): add DelegationCoordinator thin wire layer`
  </action>
  <verify>
    <automated>npx vitest run tests/lib/coordination/delegation/coordinator.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 6 tests pass
    - Coordinator wires preflight → monitor → notification → lifecycle in đúng sequence
    - Preflight failure → no side effects
    - Completion/timeout → full cleanup (monitor stop, notification route, slot release)
    - Coordinator < 100 LOC
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend CompletionDetector with WaiterModel dual-signal</name>
  <files>
    src/coordination/completion/detector.ts,
    tests/lib/coordination/completion/detector-v2.test.ts
  </files>
  <behavior>
    - Test 1: Dual-signal — both completion_event AND terminal status → callback fires exactly once
    - Test 2: Only completion_event (no terminal status yet) → callback NOT fired, still waiting
    - Test 3: Only terminal status (no completion_event) → callback NOT fired, still waiting
    - Test 4: Second signal arrives → callback fires (order doesn't matter)
    - Test 5: 10 concurrent delegations → mỗi fires callback exactly once when both signals arrive
    - Test 6: Unwatch clears pending dual-signal state for that delegation
    - Test 7: Terminal status transitions: DISPATCHED→RUNNING→COMPLETED detected correctly
  </behavior>
  <action>
    **TDD RED phase first — write all 7 failing tests BEFORE implementation.**

    Extend existing `detector.ts` (currently ~157 LOC, well-structured):
    - Add `watchDualSignal(delegationId: string, childSessionId: string, callback: CompletionCallback): void`
    - Internal tracking: `Map<delegationId, { gotCompletionEvent: boolean; gotTerminalStatus: boolean; callback; childSessionId }>`
    - `signalCompletionEvent(delegationId: string): void` — marks first signal, fires callback if both received
    - `signalTerminalStatus(delegationId: string, status: DelegationStatus): void` — marks second signal, fires if both received
    - Both signals fire callback exactly once — uses `fired: boolean` guard
    - Existing `watch()` method unchanged — backward compatible
    - `unwatch()` also clears dual-signal state

    **Pattern (P-03 from PATTERN.md):** Event-driven WaiterModel — poll for status, event for immediate. Dual-signal ensures no premature completion claims.

    **Surgical refactoring (P-10):** Add new method + internal map. Do NOT rewrite existing `watch()`. Existing behavior preserved.

    Commit message: `feat(CP-DT-01): extend CompletionDetector with WaiterModel dual-signal`
  </action>
  <verify>
    <automated>npx vitest run tests/lib/coordination/completion/detector-v2.test.ts tests/lib/coordination/completion/ --reporter=verbose</automated>
  </verify>
  <done>
    - 7 new tests pass
    - Existing detector tests still pass (backward compat)
    - Dual-signal requires BOTH completion_event + terminal status
    - Callback fires exactly once per delegation
    - 10 concurrent delegations handled independently
    - detector.ts < 220 LOC total (existing 157 + ~60 new)
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Coordinator → Task dispatch | Coordinator delegates actual execution to tool layer — boundary is the delegation ID |
| CompletionDetector → Status source | Status polling reads external session state — latency boundary per NFR-01 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-DT-02-01 | R (Repudiation) | coordinator.ts | mitigate | Lifecycle transitions logged via audit trail in state machine |
| T-CP-DT-02-02 | D (Denial of service) | detector.ts | accept | Dual-signal prevents premature completion — legitimate latency cost |
| T-CP-DT-02-03 | T (Tampering) | detector.ts | mitigate | `fired: boolean` guard prevents duplicate callback invocations |
</threat_model>

<verification>
```bash
# New tests pass
npx vitest run tests/lib/coordination/delegation/coordinator.test.ts tests/lib/coordination/completion/detector-v2.test.ts --reporter=verbose
# Existing detector tests still pass
npx vitest run tests/lib/coordination/completion/ --reporter=verbose
# Typecheck
npm run typecheck
```
</verification>

<success_criteria>
- 13 new tests pass (6 coordinator + 7 detector-v2)
- Existing detector tests still pass (backward compat per NFR-05)
- Coordinator < 100 LOC, detector < 220 LOC
- Dual-signal completion requires both signals
- Coordinator wires dispatch→monitor→notification→lifecycle
- `npm run typecheck` clean
</success_criteria>

<output>
After completion, create `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md`
</output>

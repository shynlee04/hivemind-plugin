---
phase: CP-DT-01
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/coordination/delegation/types.ts
  - src/coordination/delegation/dispatcher.ts
  - src/coordination/delegation/coordinator.ts
  - src/coordination/delegation/slot-manager.ts
  - src/coordination/delegation/agent-resolver.ts
  - src/coordination/delegation/monitor.ts
  - src/coordination/delegation/escalation-timer.ts
  - src/coordination/delegation/notification-router.ts
  - src/coordination/delegation/lifecycle.ts
  - src/coordination/delegation/retry-handler.ts
  - tests/lib/coordination/delegation/dispatcher.test.ts
  - tests/lib/coordination/delegation/slot-manager.test.ts
  - tests/lib/coordination/delegation/agent-resolver.test.ts
  - tests/lib/coordination/delegation/notification-router.test.ts
  - tests/lib/coordination/delegation/escalation-timer.test.ts
autonomous: true
requirements:
  - REQ-DT-02
  - REQ-DT-03
  - REQ-DT-05
  - REQ-NT-01
  - REQ-NT-02
  - REQ-NT-03
  - REQ-MT-01
  - REQ-MT-02

must_haves:
  truths:
    - "Category gate deny blocks dispatch và audit record persisted"
    - "11th concurrent delegation bị reject per-session, per-key limit = 2"
    - "Depth >= 3 bị reject với error message"
    - "Notification format chuẩn 4 types với đúng icon"
    - "10 concurrent delegations → mỗi notification đến đúng parent"
    - "6 progressive polling injections đúng cadence 30→45→60→90→120→180s"
    - "4 escalation levels fire đúng thresholds 60→120→180→300s"
  artifacts:
    - path: "src/coordination/delegation/dispatcher.ts"
      provides: "Pre-flight checks — category gate, concurrency acquire, depth limit"
      exports: ["DelegationDispatcher"]
    - path: "src/coordination/delegation/coordinator.ts"
      provides: "Thin wire coordinator — dispatches dispatcher, wires completion, notification"
      exports: ["DelegationCoordinator"]
    - path: "src/coordination/delegation/slot-manager.ts"
      provides: "Concurrency slot management — acquire/release/tracking per session"
      exports: ["SlotManager"]
    - path: "src/coordination/delegation/agent-resolver.ts"
      provides: "Agent validation và permission profile resolution"
      exports: ["AgentResolver"]
    - path: "src/coordination/delegation/monitor.ts"
      provides: "Delegation lifecycle monitor — progressive polling + escalation"
      exports: ["DelegationMonitor"]
    - path: "src/coordination/delegation/escalation-timer.ts"
      provides: "Multi-level escalation timer — 4 levels với configurable thresholds"
      exports: ["EscalationTimer"]
    - path: "src/coordination/delegation/notification-router.ts"
      provides: "Notification routing — target session mapping + pending replay"
      exports: ["NotificationRouter"]
    - path: "src/coordination/delegation/types.ts"
      provides: "Enhanced delegation types — v2 status, notification, escalation types"
      contains: "DelegationStatusV2"
    - path: "src/coordination/delegation/lifecycle.ts"
      provides: "Delegation lifecycle state machine adapter"
      exports: ["DelegationLifecycle"]
    - path: "src/coordination/delegation/retry-handler.ts"
      provides: "Retry queue integration for delegation persistence"
      exports: ["DelegationRetryHandler"]
  key_links:
    - from: "src/coordination/delegation/dispatcher.ts"
      to: "src/coordination/delegation/category-gates.ts"
      via: "resolveCategoryGateDecision()"
      pattern: "resolveCategoryGateDecision"
    - from: "src/coordination/delegation/dispatcher.ts"
      to: "src/coordination/delegation/slot-manager.ts"
      via: "slotManager.acquire()"
      pattern: "slotManager\\.acquire"
    - from: "src/coordination/delegation/monitor.ts"
      to: "src/coordination/delegation/escalation-timer.ts"
      via: "escalationTimer.start()"
      pattern: "escalationTimer"
    - from: "src/coordination/delegation/coordinator.ts"
      to: "src/coordination/delegation/notification-router.ts"
      via: "notificationRouter.route()"
      pattern: "notificationRouter\\.route"
---

<objective>
Foundation layer cho delegate-task v2 ecosystem. Tạo module skeletons với types, pre-flight dispatcher, concurrency slot manager, agent resolver, progressive polling monitor, escalation timer, và notification router. TẤT CẢ modules pure logic — NO OpenCode SDK calls trong phase này.

Purpose: Thiết lập kiến trúc module decomposition thay thế god-object manager.ts (504 LOC). Mỗi module < 150 LOC, single responsibility.
Output: 10 new/modified source files + 5 test files, tất cả passing.
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
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/STRUCTURE.md
@src/coordination/delegation/types.ts
@src/coordination/delegation/category-gates.ts
@src/coordination/delegation/category-gate-audit.ts
@src/coordination/delegation/state-machine.ts
@src/coordination/delegation/manager.ts
@src/coordination/completion/detector.ts
@src/coordination/completion/notification-handler.ts
@src/coordination/concurrency/queue.ts
@src/shared/types.ts
@src/shared/session-api.ts
@src/shared/runtime-policy.ts
</context>

<interfaces>
<!-- Key types executor needs from existing codebase -->

From src/shared/types.ts:
```typescript
export const DelegationStatus = { ... } as const;
export type DelegationStatus = (typeof DelegationStatus)[keyof typeof DelegationStatus];
export interface Delegation { id: string; status: DelegationStatus; parentSessionId: string; childSessionId?: string; agent: string; prompt: string; ... }
export interface DelegationResult { delegationId: string; status: DelegationStatus; ... }
export const DEFAULT_SAFETY_CEILING_MS = 300_000;
export const MAX_DELEGATION_DEPTH = 3;
```

From src/coordination/delegation/category-gates.ts:
```typescript
export function resolveCategoryGateDecision(agent: string, category: string | undefined, policy?: CategoryGatePolicy): { allowed: boolean; reason?: string };
```

From src/coordination/delegation/category-gate-audit.ts:
```typescript
export function recordCategoryGateask(agent: string, category: string, reason: string): void;
```

From src/coordination/concurrency/queue.ts:
```typescript
export class DelegationConcurrencyQueue { acquire(queueKey: string, opts?: { limit?: number; acquireTimeoutMs?: number }): Promise<{ release: () => void }>; }
export function buildDelegationQueueKey(context: QueueContext): string;
```

From src/coordination/delegation/state-machine.ts:
```typescript
export class DelegationStateMachine { ... }
export function canTransitionDelegationStatus(from: DelegationStatus, to: DelegationStatus): boolean;
export function buildDelegationResult(delegation: Delegation): DelegationResult;
```

From src/coordination/completion/notification-handler.ts:
```typescript
export function buildNotificationMessage(type: string, delegationId: string, summary: string): string;
export function notifyDelegationTerminal(client: OpenCodeClient, parentSessionId: string, message: string): Promise<void>;
export function replayPendingNotifications(client: OpenCodeClient): Promise<void>;
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend types + Create dispatcher, slot-manager, agent-resolver</name>
  <files>
    src/coordination/delegation/types.ts,
    src/coordination/delegation/dispatcher.ts,
    src/coordination/delegation/slot-manager.ts,
    src/coordination/delegation/agent-resolver.ts,
    tests/lib/coordination/delegation/dispatcher.test.ts,
    tests/lib/coordination/delegation/slot-manager.test.ts,
    tests/lib/coordination/delegation/agent-resolver.test.ts
  </files>
  <behavior>
    - Test 1: Category gate deny → dispatcher throws `[Harness]` error with agent + category, `recordCategoryGateask()` called
    - Test 2: Category gate allow → dispatcher proceeds to concurrency check
    - Test 3: 11th concurrent delegation → SlotManager throws `[Harness]` error with queue info
    - Test 4: Per-key limit = 2 → 3rd acquire on same key throws
    - Test 5: Acquire timeout → SlotManager throws after configurable timeout
    - Test 6: Depth >= 3 → dispatcher throws `[Harness] Max delegation depth (3) reached`
    - Test 7: AgentResolver validates agent exists in getAppAgents() result
    - Test 8: AgentResolver resolves permission profile từ agent primitives
  </behavior>
  <action>
    **TDD RED phase first — write all 8 failing tests BEFORE implementation.**

    Step 1 — Extend `types.ts`: Add v2 types needed by new modules:
    - `DelegationNotificationType` = "success" | "failure" | "progress" | "timeout"
    - `EscalationLevel` = "WARN" | "NUDGE" | "ALERT" | "TERMINATE"
    - `PollingCadence` = readonly [30, 45, 60, 90, 120, 180] (seconds)
    - `EscalationThresholds` = readonly [60, 120, 180, 300] (seconds)
    - `DelegationNotification` interface: `{ type, delegationId, message, timestamp }`
    - `SlotInfo` interface: `{ acquired: number; maxSlots: number; perKeyUsage: Map<string, number> }`
    Do NOT modify existing types — only add new ones. Existing `Delegation`, `DelegationStatus`, etc stay untouched.

    Step 2 — Create `dispatcher.ts` (~120 LOC):
    - `DelegationDispatcher` class với injected dependencies: `categoryGates`, `slotManager`, `agentResolver`
    - `preflightCheck(params: PreflightParams): PreflightResult | never` — runs 3 checks sequentially:
      1. `checkCategoryGate(agent, category)` — calls `resolveCategoryGateDecision()`, on deny calls `recordCategoryGateask()` then throws
      2. `checkConcurrency(queueKey)` — calls `slotManager.acquire()`, on fail throws
      3. `checkDepth(currentDepth)` — throws if `currentDepth >= MAX_DELEGATION_DEPTH`
    - Returns `{ slotHandle, validatedAgent, queueKey }` on success
    - NO SDK calls — pure validation logic

    Step 3 — Create `slot-manager.ts` (~100 LOC):
    - `SlotManager` class wrapping `DelegationConcurrencyQueue`
    - Tracks active slots per main session ID
    - `acquire(sessionId: string, queueKey: string, opts?: AcquireOpts): Promise<SlotHandle>`
    - `release(handle: SlotHandle): void` — releases slot + cleans tracking
    - `getSlotInfo(sessionId: string): SlotInfo` — returns current state
    - Max slots per session = 10 (configurable), per-key = 2
    - Enforces: if session has 10 active, reject even if queue allows

    Step 4 — Create `agent-resolver.ts` (~80 LOC):
    - `AgentResolver` class
    - `resolve(agentName: string): Promise<ResolvedAgent>` — validates agent exists
    - `buildPermissionProfile(agent: ResolvedAgent): PermissionProfile` — wraps existing `resolveDelegationPermissionProfile()`
    - `buildDisabledTools(): Record<string, boolean>` — returns `{ "delegate-task": false, "task": false }` for recursive delegation prevention
    - Uses `getAppAgents()` from `app-api.ts` + `enrichAgentFromPrimitives()` from `agent-primitive-policy.ts`

    Step 5 — Run tests, ensure RED → implement → GREEN → commit.

    Commit message: `feat(CP-DT-01): add dispatcher, slot-manager, agent-resolver foundation modules`
  </action>
  <verify>
    <automated>npx vitest run tests/lib/coordination/delegation/dispatcher.test.ts tests/lib/coordination/delegation/slot-manager.test.ts tests/lib/coordination/delegation/agent-resolver.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 8 tests pass (RED→GREEN)
    - `dispatcher.ts` validates category gate, concurrency, depth — throws `[Harness]` errors on failure
    - `slot-manager.ts` enforces max 10 per session, 2 per queueKey
    - `agent-resolver.ts` resolves agent + builds permission profile
    - All files < 150 LOC
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create escalation-timer, monitor, notification-router, lifecycle, retry-handler</name>
  <files>
    src/coordination/delegation/escalation-timer.ts,
    src/coordination/delegation/monitor.ts,
    src/coordination/delegation/notification-router.ts,
    src/coordination/delegation/lifecycle.ts,
    src/coordination/delegation/retry-handler.ts,
    tests/lib/coordination/delegation/escalation-timer.test.ts,
    tests/lib/coordination/delegation/notification-router.test.ts
  </files>
  <behavior>
    - Test 1: EscalationTimer fires WARN at 60s, NUDGE at 120s, ALERT at 180s, TERMINATE at 300s
    - Test 2: EscalationTimer stop() clears all pending timers
    - Test 3: Monitor creates 6 polling injections đúng cadence [30,45,60,90,120,180]s
    - Test 4: Monitor stops injections after completion signal
    - Test 5: NotificationRouter routes notification đến đúng parent session
    - Test 6: 10 concurrent delegations → mỗi notification đến đúng parent (no broadcast)
    - Test 7: Pending notifications replayed FIFO khi parent becomes available
    - Test 8: Pending queue bounded at 50 notifications
    - Test 9: DelegationLifecycle wraps state-machine transitions correctly
    - Test 10: RetryHandler wraps persistence write với exponential backoff
  </behavior>
  <action>
    **TDD RED phase first — write all 10 failing tests BEFORE implementation.**

    Step 1 — Create `escalation-timer.ts` (~80 LOC):
    - `EscalationTimer` class
    - `start(delegationId: string, thresholds: readonly number[], onLevel: (level, elapsed) => void): void`
    - `stop(): void` — clears all pending Node.js timers
    - Uses `setTimeout` for each threshold level
    - Default thresholds from SPEC: `[60, 120, 180, 300]` seconds
    - Level mapping: index 0=WARN(⚠), 1=NUDGE(⚠), 2=ALERT(🔴), 3=TERMINATE(⛔)
    - Icon constants: `ESCALATION_ICONS = ['⚠', '⚠', '🔴', '⛔'] as const`

    Step 2 — Create `monitor.ts` (~120 LOC):
    - `DelegationMonitor` class — owns progressive polling + escalation for one delegation
    - `start(delegationId: string, parentSessionId: string, opts?: MonitorOpts): void` — starts both polling cadence + escalation timers
    - `stop(): void` — stops all timers
    - `onCompletion(): void` — stops monitoring, marks completed
    - Polling cadence: `[30, 45, 60, 90, 120, 180]` seconds
    - Each injection format: `[DT:{id}] status={status} elapsed={X}s` (≤ 80 chars per NFR-01)
    - Injection callback injected (no SDK dependency)
    - Delegates escalation to `EscalationTimer`

    Step 3 — Create `notification-router.ts` (~100 LOC):
    - `NotificationRouter` class
    - Internal map: `delegationId → { parentSessionId, notifications: DelegationNotification[] }`
    - `register(delegationId: string, parentSessionId: string): void`
    - `route(notification: DelegationNotification): RouteResult` — finds parent, returns `{ parentSessionId, notification }`
    - `deregister(delegationId: string): void` — cleanup after completion/timeout
    - `queuePending(delegationId: string, notification: DelegationNotification): void` — queue for offline parent
    - `replayPending(parentSessionId: string): DelegationNotification[]` — FIFO replay
    - Format: 4 types with icons per REQ-NT-01: success=✅, failure=❌, progress=🔄, timeout=⏰
    - Pending queue bounded at 50 (REQ-NT-03)
    - `formatNotification(type, delegationId, message): string` — standard format

    Step 4 — Create `lifecycle.ts` (~100 LOC):
    - `DelegationLifecycle` class — thin wrapper over existing `DelegationStateMachine`
    - `transition(delegationId: string, toStatus: DelegationStatus): DelegationResult`
    - `isTerminal(status: DelegationStatus): boolean`
    - `markTimeout(delegationId: string): DelegationResult`
    - `markAborted(delegationId: string): DelegationResult`
    - `markCancelled(delegationId: string): DelegationResult`
    - Delegates to `canTransitionDelegationStatus()` + `buildDelegationResult()`

    Step 5 — Create `retry-handler.ts` (~80 LOC):
    - `DelegationRetryHandler` class
    - Wraps `persistDelegations()` call with retry logic
    - Exponential backoff: 1s → 2s → 4s → 8s → 16s (max 5 retries)
    - Degraded fallback: write to `retry-degraded.json`
    - Adapted from session-tracker retry queue pattern (CONTEXT.md Section 3)

    Step 6 — Run tests, ensure RED → implement → GREEN → commit.

    Commit message: `feat(CP-DT-01): add escalation-timer, monitor, notification-router, lifecycle, retry-handler`
  </action>
  <verify>
    <automated>npx vitest run tests/lib/coordination/delegation/escalation-timer.test.ts tests/lib/coordination/delegation/notification-router.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 10 tests pass (RED→GREEN)
    - EscalationTimer fires 4 levels đúng thresholds, stop() clears timers
    - Monitor creates 6 polling injections đúng cadence, stops after completion
    - NotificationRouter routes to correct parent even with 10 concurrent
    - Pending notifications replayed FIFO, bounded at 50
    - DelegationLifecycle wraps state-machine transitions
    - RetryHandler implements exponential backoff with degraded fallback
    - All files < 150 LOC
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Tool input → Dispatcher | Unvalidated agent names and category strings từ tool caller |
| Dispatcher → Concurrency | Queue key manipulation could bypass limits |
| Notification → Parent session | Messages route to wrong session if delegationId mapping corrupted |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-DT-01-01 | S (Spoofing) | agent-resolver.ts | mitigate | Validate agent name against `getAppAgents()` list — reject unknown agents |
| T-CP-DT-01-02 | T (Tampering) | slot-manager.ts | mitigate | Slot tracking uses Map với session-scoped keys — cannot manipulate across sessions |
| T-CP-DT-01-03 | I (Info disclosure) | notification-router.ts | accept | Notifications contain delegation IDs and status — no secrets, low-value target |
| T-CP-DT-01-04 | D (Denial of service) | slot-manager.ts | mitigate | Max 10 slots per session prevents delegation flood |
| T-CP-DT-01-05 | E (Elevation) | dispatcher.ts | mitigate | Depth limit prevents recursive delegation chains |
</threat_model>

<verification>
```bash
# All new tests pass
npx vitest run tests/lib/coordination/delegation/ --reporter=verbose
# Typecheck clean
npm run typecheck
# Existing tests not broken
npx vitest run tests/lib/coordination/ --reporter=verbose
```
</verification>

<success_criteria>
- 18 new tests pass across 5 test files
- 10 new source files created, each < 150 LOC
- `npm run typecheck` clean
- Existing coordination tests still pass
- Category gate deny → audit record + error (REQ-DT-02)
- 11th delegation rejected (REQ-DT-03)
- Depth >= 3 rejected (REQ-DT-05)
- Notification format chuẩn 4 types (REQ-NT-01)
- Routing correct with 10 concurrent (REQ-NT-02)
- Pending replay FIFO bounded at 50 (REQ-NT-03)
- Polling cadence đúng 6 intervals (REQ-MT-01)
- Escalation đúng 4 levels (REQ-MT-02)
</success_criteria>

<output>
After completion, create `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md`
</output>

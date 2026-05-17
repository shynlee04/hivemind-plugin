---
phase: CP-DT-01
plan: 03
type: execute
wave: 3
depends_on:
  - CP-DT-01-02
files_modified:
  - src/tools/delegation/delegate-task.ts
  - src/tools/delegation/delegation-status.ts
  - src/tools/delegation/types.ts
  - tests/tools/delegation/delegate-task-v2.test.ts
  - tests/tools/delegation/delegation-status-v2.test.ts
autonomous: true
requirements:
  - REQ-DT-01
  - REQ-DT-04
  - REQ-DT-06
  - REQ-DT-07
  - REQ-DT-08
  - REQ-DT-09
  - REQ-DT-10
  - REQ-DT-11
  - REQ-DC-01
  - REQ-DC-02
  - REQ-DC-03
  - REQ-DC-04
  - NFR-03
  - NFR-04
  - NFR-05

must_haves:
  truths:
    - "delegate-task v2 gọi coordinator.dispatch() rồi native Task tool, trả về delegation ID ngay lập tức"
    - "Zod schema validates tool input — agent required, prompt required, safetyCeilingMs defaults 300000"
    - "Backward compat: v1 delegation records still readable by status tool"
    - "delegation-status v2 trả về full status với progress %, elapsed time, child messages"
    - "abort action terminates child session via lifecycle.markAborted()"
    - "cancel action soft-cancels via lifecycle.markCancelled()"
    - "restart action re-dispatches với same params"
    - "redirect action re-dispatches với different agent"
    - "DelegationControlSchema validates 4 action types với specific required fields"
  artifacts:
    - path: "src/tools/delegation/delegate-task.ts"
      provides: "delegate-task v2 tool — Zod validated, wraps coordinator + native Task"
      exports: ["delegateTaskTool"]
      contains: "DelegateTaskV2Schema"
    - path: "src/tools/delegation/delegation-status.ts"
      provides: "delegation-status v2 — enhanced queries + control actions"
      exports: ["delegationStatusTool"]
      contains: "DelegationControlSchema"
    - path: "src/tools/delegation/types.ts"
      provides: "Tool-specific types for delegation tools"
      exports: ["DelegateTaskV2Input", "DelegationStatusV2Output"]
  key_links:
    - from: "src/tools/delegation/delegate-task.ts"
      to: "src/coordination/delegation/coordinator.ts"
      via: "coordinator.dispatch()"
      pattern: "coordinator\\.dispatch"
    - from: "src/tools/delegation/delegate-task.ts"
      to: "src/shared/session-api.ts"
      via: "native Task tool dispatch"
      pattern: "sdk\\.task\\(|task\\("
    - from: "src/tools/delegation/delegation-status.ts"
      to: "src/coordination/delegation/lifecycle.ts"
      via: "lifecycle.transition() for control actions"
      pattern: "lifecycle\\.(markAborted|markCancelled|transition)"
---

<objective>
Rewrite delegate-task.ts và enhance delegation-status.ts cho v2 ecosystem. Tool layer = Zod validation + coordinator wiring + native Task dispatch. NO business logic trong tool files.

Purpose: Tool layer là interface boundary giữa OpenCode runtime và delegation modules. Zod schemas enforce input validation. Native Task tool = actual execution.
Output: 2 rewritten tool files + types + tests.
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
@src/coordination/delegation/coordinator.ts
@src/coordination/delegation/dispatcher.ts
@src/coordination/delegation/slot-manager.ts
@src/coordination/delegation/agent-resolver.ts
@src/coordination/delegation/monitor.ts
@src/coordination/delegation/notification-router.ts
@src/coordination/delegation/lifecycle.ts
@src/coordination/delegation/retry-handler.ts
@src/coordination/completion/detector.ts
@src/tools/delegation/delegate-task.ts
@src/tools/delegation/delegation-status.ts
@src/shared/session-api.ts
@src/shared/types.ts
@src/shared/tool-response.ts
@src/schema-kernel/prompt-enhance.schema.ts
</context>

<interfaces>
<!-- From existing tool layer — patterns to follow -->

From src/shared/tool-response.ts:
```typescript
export function createToolResponse(text: string, metadata?: Record<string, unknown>): ToolResponse;
export function createErrorResponse(error: string, code?: string): ToolResponse;
```

From src/tools/delegation/delegate-task.ts (EXISTING v1 — to be rewritten):
```typescript
// Current v1 pattern — delegate-task wraps promptAsync dispatch
// v2 will wrap native Task tool instead (P-01 pattern)
```

From src/coordination/delegation/coordinator.ts (Plan 02):
```typescript
export class DelegationCoordinator {
  dispatch(params: DispatchParams): Promise<DelegationResult>;
  handleCompletion(delegationId: string, result: DelegationResult): void;
  handleTimeout(delegationId: string): void;
}
export interface DispatchParams {
  agent: string; prompt: string; parentSessionId: string;
  category?: string; currentDepth: number; queueKey: string;
  safetyCeilingMs?: number;
}
```

From SPEC Section 5 — Zod Schemas:
```typescript
const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1),
  prompt: z.string().min(1),
  safetyCeilingMs: z.number().int().positive().default(300_000),
  category: z.string().optional(),
  context: z.string().optional(),
});

const DelegationStatusQuerySchema = z.object({
  delegationId: z.string().optional(),
  action: z.enum(["status", "list", "control"]).default("status"),
  // control fields
  control: z.object({
    action: z.enum(["abort", "cancel", "restart", "redirect"]),
    redirectAgent: z.string().optional(),
    restartPrompt: z.string().optional(),
  }).optional(),
});
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewrite delegate-task.ts with Zod + coordinator + native Task</name>
  <files>
    src/tools/delegation/delegate-task.ts,
    src/tools/delegation/types.ts,
    tests/tools/delegation/delegate-task-v2.test.ts
  </files>
  <behavior>
    - Test 1: Valid input (agent + prompt) → Zod validates → coordinator.dispatch() called → delegation ID returned
    - Test 2: Missing agent → Zod rejects before coordinator called
    - Test 3: Missing prompt → Zod rejects before coordinator called
    - Test 4: safetyCeilingMs defaults to 300000 when not provided
    - Test 5: category optional → dispatch works without category
    - Test 6: Coordinator preflight failure → tool returns error response (not thrown)
    - Test 7: Native Task tool dispatch → correct agent, prompt, disabled tools passed
    - Test 8: Backward compat — v1 delegation records still parseable
    - Test 9: Response format includes delegationId, status, agent, safetyCeilingMs
  </behavior>
  <action>
    **TDD RED phase first — write all 9 failing tests BEFORE implementation.**

    Step 1 — Create `types.ts` (~40 LOC):
    - `DelegateTaskV2Input` type (inferred from Zod schema)
    - `DelegationStatusV2Output` interface
    - `DelegationControlAction` type
    - Import and re-export from coordinator types as needed

    Step 2 — Rewrite `delegate-task.ts` (~120 LOC):
    - Define `DelegateTaskV2Schema` per SPEC Section 5
    - Tool handler:
      1. Parse input with `DelegateTaskV2Schema.safeParse(input)`
      2. On parse error → return `createErrorResponse()` with validation details
      3. Extract `parentSessionId` from session context
      4. Calculate `currentDepth` from delegation records
      5. Build `DispatchParams` from validated input
      6. Call `coordinator.dispatch(params)` — gets delegation result
      7. Dispatch native Task tool via OpenCode SDK: `sdk.task({ agent, prompt, disabledTools })`
      8. Return `createToolResponse()` with delegationId, status, agent, safetyCeilingMs

    **Key pattern (P-01):** Tool wraps native Task. The tool file does NOT contain dispatch logic — it validates input, calls coordinator for pre/post, and delegates execution to `sdk.task()`.

    **Key pattern (P-08):** Error boundary — coordinator failures caught and returned as error responses, not thrown. Tool layer = defense perimeter.

    Step 3 — Backward compatibility:
    - Read existing delegation records from continuity store
    - v1 records (no `v2` field) treated as legacy — status tool handles both
    - New v2 records include `v2: true` marker field

    Commit message: `feat(CP-DT-01): rewrite delegate-task v2 with Zod + coordinator + native Task`
  </action>
  <verify>
    <automated>npx vitest run tests/tools/delegation/delegate-task-v2.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 9 tests pass
    - Zod schema validates all inputs per SPEC Section 5
    - coordinator.dispatch() called with correct params
    - Native Task tool dispatch pattern correct
    - Backward compat: v1 records parseable
    - Error responses on validation/preflight failure
    - delegate-task.ts < 150 LOC
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Enhance delegation-status.ts with v2 queries + control actions</name>
  <files>
    src/tools/delegation/delegation-status.ts,
    tests/tools/delegation/delegation-status-v2.test.ts
  </files>
  <behavior>
    - Test 1: Status query with delegationId → returns full status with progress %, elapsed time
    - Test 2: List action → returns all delegations for current session
    - Test 3: Abort action → lifecycle.markAborted() called, child session terminated
    - Test 4: Cancel action → lifecycle.markCancelled() called
    - Test 5: Restart action → re-dispatch with same agent + prompt
    - Test 6: Redirect action → re-dispatch with redirectAgent, same prompt
    - Test 7: Redirect without redirectAgent → Zod validation error
    - Test 8: Control on completed delegation → error "cannot control terminal delegation"
    - Test 9: DelegationControlSchema validates 4 action types correctly
    - Test 10: Progress calculation: elapsed/ceiling * 100, capped at 99%
    - Test 11: Elapsed time formatted as human-readable "2m 30s"
  </behavior>
  <action>
    **TDD RED phase first — write all 11 failing tests BEFORE implementation.**

    Enhance `delegation-status.ts` (~150 LOC):
    - Define `DelegationStatusQuerySchema` và `DelegationControlSchema` per SPEC Section 5
    - Three query modes:
      1. `status` — single delegation status with enriched output:
         - `status`, `agent`, `elapsedMs`, `elapsedHuman`, `progressPct`
         - `childMessageCount` from session messages
         - `escalationLevel` from monitor state
      2. `list` — all delegations for session, summarized
      3. `control` — action dispatch:
         - `abort` → `lifecycle.markAborted()` + terminate child
         - `cancel` → `lifecycle.markCancelled()` + soft cancel
         - `restart` → `coordinator.dispatch()` with original params
         - `redirect` → `coordinator.dispatch()` with new agent
    - Validation:
      - `redirect` requires `redirectAgent` field
      - `restart` with `restartPrompt` overrides original
      - Terminal delegations cannot be controlled
    - Progress calculation: `Math.min(99, Math.floor(elapsedMs / safetyCeilingMs * 100))`
    - Elapsed formatting: `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`

    **Backward compat (NFR-05):** v1 records without `v2` marker → status still returns basic info (id, status, agent, prompt). v2 fields (`progressPct`, `elapsedHuman`) return null for v1 records.

    Commit message: `feat(CP-DT-01): enhance delegation-status with v2 queries + control actions`
  </action>
  <verify>
    <automated>npx vitest run tests/tools/delegation/delegation-status-v2.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 11 tests pass
    - 3 query modes work: status, list, control
    - 4 control actions validated: abort, cancel, restart, redirect
    - Progress calculation capped at 99%
    - Backward compat with v1 records
    - Zod schemas enforce input validation
    - delegation-status.ts < 170 LOC
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User input → Zod schema | Unvalidated strings từ tool caller — first defense line |
| Tool layer → Coordinator | Validated params cross here — trust boundary |
| Control actions → Child session | Abort/terminate crosses process boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-DT-03-01 | S (Spoofing) | delegate-task.ts | mitigate | Zod schema validates agent name is non-empty string |
| T-CP-DT-03-02 | T (Tampering) | delegation-status.ts | mitigate | Control actions validated against delegation state — terminal delegations locked |
| T-CP-DT-03-03 | E (Elevation) | delegate-task.ts | mitigate | disabledTools includes delegate-task + task — prevents recursive delegation |
| T-CP-DT-03-04 | D (Denial of service) | delegate-task.ts | mitigate | safetyCeilingMs default 300s + max 300s per NFR-04 |
</threat_model>

<verification>
```bash
# All tool tests pass
npx vitest run tests/tools/delegation/ --reporter=verbose
# Typecheck
npm run typecheck
# Existing tests not broken
npx vitest run tests/tools/ --reporter=verbose
```
</verification>

<success_criteria>
- 20 new tests pass (9 delegate-task + 11 delegation-status)
- Zod schemas validate per SPEC Section 5
- delegate-task v2 wraps coordinator + native Task (P-01)
- 4 control actions: abort, cancel, restart, redirect
- Backward compat with v1 records (NFR-05)
- safetyCeilingMs default 300s, max 300s (NFR-04)
- Both tool files < 170 LOC
- `npm run typecheck` clean
</success_criteria>

<output>
After completion, create `.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md`
</output>

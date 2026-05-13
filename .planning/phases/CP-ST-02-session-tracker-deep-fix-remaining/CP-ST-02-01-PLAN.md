---
phase: CP-ST-02-session-tracker-deep-fix-remaining
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/tool-capture.ts
  - src/plugin.ts
  - tests/features/session-tracker/session-tracker.test.ts
  - tests/features/session-tracker/integration/hook-wiring.test.ts
autonomous: true
requirements:
  - AC-11
  - D-01
  - D-03
  - D-05

must_haves:
  truths:
    - "`tool.execute.before` hook fires in plugin.ts and routes task tool events to SessionTracker"
    - "Child sessions are registered in HierarchyIndex at `session.created` time (before PostToolUse fires)"
    - "Delegator agentName reads from `subagent_type` arg instead of hardcoded 'unknown'"
    - "Aborted task tool sessions are still registered in HierarchyIndex (no orphan directories)"
    - "Existing 256+ tests continue to pass"
  artifacts:
    - path: "src/features/session-tracker/index.ts"
      provides: "SessionTracker.handleToolExecuteBefore() public method"
      contains: "handleToolExecuteBefore"
    - path: "src/plugin.ts"
      provides: "tool.execute.before hook wiring"
      contains: "tool.execute.before"
      exports: ["tool.execute.before"]
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "HierarchyIndex registration for child sessions at session.created time"
      contains: "registerChild"
    - path: "src/features/session-tracker/capture/tool-capture.ts"
      provides: "Delegator attribution from subagent_type arg"
      contains: 'agentName: subagentType || "unknown"'
    - path: "tests/features/session-tracker/session-tracker.test.ts"
      provides: "Unit tests for handleToolExecuteBefore"
      contains: "handleToolExecuteBefore"
    - path: "tests/features/session-tracker/integration/hook-wiring.test.ts"
      provides: "Integration tests for PreToolUse hook wiring"
      contains: "tool.execute.before"
  key_links:
    - from: "src/plugin.ts (tool.execute.before hook)"
      to: "src/features/session-tracker/index.ts (SessionTracker.handleToolExecuteBefore)"
      via: "sessionTracker.handleToolExecuteBefore() call"
      pattern: "sessionTracker\.handleToolExecuteBefore"
    - from: "src/features/session-tracker/capture/event-capture.ts (handleSessionCreated)"
      to: "src/features/session-tracker/persistence/hierarchy-index.ts (HierarchyIndex)"
      via: "registerChild() call when parentID detected"
      pattern: "hierarchyIndex\?\.registerChild"
    - from: "src/features/session-tracker/capture/tool-capture.ts (handleTask)"
      to: "subagent_type arg"
      via: "subagentType variable for delegatedBy.agentName"
      pattern: 'agentName: subagentType \|\| "unknown"'
---

<objective>
Wire `tool.execute.before` hook in `src/plugin.ts` to detect task tool dispatch at PreToolUse time. Route through new `SessionTracker.handleToolExecuteBefore()` method. Ensure child sessions are registered in the HierarchyIndex before PostToolUse fires, preventing orphan directories when task tools are aborted. Fix D-03 delegator attribution.

Purpose: Eliminate the remaining orphan-session gap — aborted task tools that never reach PostToolUse still produce child sessions that must be tracked.
Output: Working PreToolUse hook wiring, HierarchyIndex-populated-at-session.created, correct delegator agent names.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-CONTEXT.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-SPEC.md (§1-3, AC-11)
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-RESEARCH.md (§2 Plugin Hook Signatures, §3 Complete Event Flow, §4.6 GAP #6)

<interfaces>
<!-- Key types and contracts the executor needs. -->

From src/shared/session-api.ts:
```typescript
export async function getSession(client: OpenCodeClient, sessionID: string): Promise<SessionRecord>;
export function getEventSessionID(event: unknown): string | undefined;
export function getParentID(session: unknown): string | undefined;
```

From src/features/session-tracker/persistence/hierarchy-index.ts:
```typescript
export class HierarchyIndex {
  registerChild(parentID: string, childID: string): void;
  isChild(sessionID: string): boolean;
  getParent(childID: string): string | null;
  getDepth(sessionID: string): number;
}
```

From src/plugin.ts (existing tool.execute.after hook shape):
```typescript
"tool.execute.after": async (
  input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> },
  _output?: { metadata?: unknown; [key: string]: unknown } | string,
): Promise<void>
```

SDK tool.execute.before hook signature (from RESEARCH.md §2.1):
```typescript
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any },
) => Promise<void>
```

From tool-capture.ts — where delegatedBy.agentName is hardcoded (line 256):
```typescript
delegatedBy: {
  agentName: "unknown", // ← MUST become subagentType || "unknown" per D-03
}
```

From event-capture.ts — handleSessionCreated detects child via SDK parentID but does NOT register in HierarchyIndex (line 193-195):
```typescript
if (parentID) {
  // Child session — skip directory creation (handled by tool-capture)
  return  // ← MISSING: hierarchyIndex?.registerChild(parentID, sessionID)
}
```
</interfaces>
</context>

<tasks>

<!-- ────────────────────────────────────────────────────────────────────── -->
<!-- TASK 1: Core implementation — SessionTracker method + event-capture    -->
<!-- ────────────────────────────────────────────────────────────────────── -->
<task type="auto" tdd="true">
  <name>Task 1: Add handleToolExecuteBefore to SessionTracker + register child at session.created</name>
  <files>
    src/features/session-tracker/index.ts
    src/features/session-tracker/capture/event-capture.ts
  </files>

  <read_first>
    src/features/session-tracker/index.ts (lines 73-180, 435-505, 516-607)
    src/features/session-tracker/capture/event-capture.ts (lines 164-236)
    src/features/session-tracker/persistence/hierarchy-index.ts (lines 114-174)
    src/shared/session-api.ts (lines 54-57)
  </read_first>

  <behavior>
    - Test 1: handleToolExecuteBefore detects task tool dispatch, stores pending delegation info
    - Test 2: handleToolExecuteBefore skips non-task tools silently (no-op)
    - Test 3: handleToolExecuteBefore handles resume scenario (task_id in args) — no crash
    - Test 4: event-capture.handleSessionCreated registers child in HierarchyIndex when SDK returns parentID
  </behavior>

  <action>
**Part A: Add `handleToolExecuteBefore()` to SessionTracker class (src/features/session-tracker/index.ts)**

Add a new public method AFTER `handleToolExecuteAfter()` (after line 505) and BEFORE `initialize()` (before line 516):

```typescript
/**
 * Handles tool execution PRE-dispatch events from the OpenCode `tool.execute.before` hook.
 *
 * Purpose: detect task tool dispatch at PreToolUse time, before OpenCode creates
 * the child session. This provides the earliest possible hook point for:
 * 1. Capturing delegator agent name from `subagent_type` arg (D-03 fix)
 * 2. Detecting resume vs. new dispatch (task_id present → resume)
 *
 * The actual HierarchyIndex registration happens in two paths:
 * - Path A (happy): PostToolUse fires → handleTask() calls registerChild() (existing)
 * - Path B (abort-safe): session.created fires → handleSessionCreated() calls registerChild()
 *   when SDK parentID is found (NEW — added in Part B below)
 *
 * Best-effort: never throws to the OpenCode runtime.
 *
 * @param input - Hook input: { tool, sessionID, callID, args? }
 * @param output - Hook output: { args }
 */
async handleToolExecuteBefore(
  input: { tool: string; sessionID: string; callID: string; args?: Record<string, unknown> },
  output: { args: unknown },
): Promise<void> {
  try {
    if (!input?.sessionID || !isValidSessionID(input.sessionID)) return
    if (input.tool !== "task") return

    const args = (input.args ?? {}) as Record<string, unknown>
    const taskId = args.task_id as string | undefined
    const subagentType = args.subagent_type as string | undefined

    // Resume scenario (task_id provided): ensure child session is registered
    // in the hierarchy so ensureSessionReady skips directory creation.
    if (taskId && isValidSessionID(taskId)) {
      if (!this.hierarchyIndex?.isChild(taskId)) {
        // Query SDK to verify the session exists and resolve parent
        const session = await this.getSessionSafely(taskId)
        if (session) {
          const parentID = (session as { parentID?: string }).parentID
          if (parentID && this.hierarchyIndex) {
            this.hierarchyIndex.registerChild(parentID, taskId)
          }
        }
      }
      this.bootstrappedSessions.add(taskId)
      return
    }

    // New dispatch (no task_id): OpenCode will create child session internally.
    // The child session ID is NOT available at PreToolUse time.
    // We rely on:
    //   - session.created event → handleSessionCreated registers in HierarchyIndex (Part B)
    //   - tool.execute.after → handleTask() already registers in HierarchyIndex (existing)
    // Subagent type is available here; PostToolUse's handleTask() will read it
    // directly from args (D-03 fix in Task 2).
    //
    // No HierarchyIndex mutation here — hook boundary rule (CQRS).
  } catch (err) {
    // Best-effort: log and continue. Never block tool execution.
    void this.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Harness] Session tracker: tool.execute.before handler failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}
```

**Part B: Register child in HierarchyIndex at session.created time (src/features/session-tracker/capture/event-capture.ts)**

In `handleSessionCreated()`, after the SDK parentID check confirms this is a child session (line 193-195), add HierarchyIndex registration BEFORE returning:

Location: `src/features/session-tracker/capture/event-capture.ts`, line 193-195.

**FROM:**
```typescript
      if (parentID) {
        // Child session — skip directory creation (handled by tool-capture)
        return
      }
```

**TO:**
```typescript
      if (parentID) {
        // Child session — skip directory creation (handled by tool-capture).
        // REGISTER in HierarchyIndex so the dual-gate (ensureSessionReady,
        // handleChatMessage, handleToolExecuteAfter) correctly classifies
        // this child — even if PostToolUse never fires (abort-safe per AC-11).
        // registerChild is idempotent (Map.set) — safe to call even if
        // handleTask() later calls it again.
        this.hierarchyIndex?.registerChild(parentID, sessionID)
        return
      }
```

This is the critical orphan-prevention fix: the HierarchyIndex now gets populated at `session.created` time (which fires during task dispatch), not just at PostToolUse time (which may never fire if aborted).
  </action>

  <verify>
    <automated>npx vitest run tests/features/session-tracker/session-tracker.test.ts</automated>
  </verify>

  <done>
    - `SessionTracker.handleToolExecuteBefore()` method exists and compiles
    - `event-capture.ts` registers child sessions in HierarchyIndex when SDK parentID is found
    - Event-capture test `tests/features/session-tracker/capture/event-capture.test.ts` passes (verify HierarchyIndex registration)
  </done>
</task>

<!-- ────────────────────────────────────────────────────────────────────── -->
<!-- TASK 2: Plugin.ts wire-up + D-03 attribution fix in tool-capture      -->
<!-- ────────────────────────────────────────────────────────────────────── -->
<task type="auto" tdd="true">
  <name>Task 2: Wire tool.execute.before in plugin.ts + fix D-03 delegator attribution</name>
  <files>
    src/plugin.ts
    src/features/session-tracker/capture/tool-capture.ts
  </files>

  <read_first>
    src/plugin.ts (lines 184-260)
    src/features/session-tracker/capture/tool-capture.ts (lines 223-330)
    src/hooks/guards/tool-guard-hooks.ts (lines 68-110) — existing tool.execute.before pattern
  </read_first>

  <behavior>
    - Test 1: plugin.ts tool.execute.before hook fires and routes task tools to SessionTracker
    - Test 2: plugin.ts tool.execute.before hook is best-effort (session-tracker failure does not block tool)
    - Test 3: handleTask delegatedBy.agentName uses subagent_type arg value instead of "unknown"
  </behavior>

  <action>
**Part A: Add `tool.execute.before` hook in plugin.ts**

Location: `src/plugin.ts`, add a new hook entry in the return object. Place it BEFORE the existing `"tool.execute.after"` hook (before line 236). The hook fires in this order: `tool.execute.before` → OpenCode dispatches → `tool.execute.after`.

Add this entry to the return object spread (after `...toolGuardHooks,` on line 190, or as a standalone key alongside the existing hooks):

```typescript
// PreToolUse: detect task tool dispatch for session-tracker child registration.
// Fires BEFORE OpenCode dispatches the task tool. At this point, the child
// session ID does NOT exist yet, but we can capture delegator attribution
// data and detect resume vs. new dispatch (task_id presence in args).
//
// Best-effort — never blocks tool execution (D-01).
"tool.execute.before": async (
  input: { tool: string; sessionID: string; callID: string; args?: Record<string, unknown> },
  output: { args: unknown },
): Promise<void> => {
  try {
    await sessionTracker.handleToolExecuteBefore(
      input as Parameters<typeof sessionTracker.handleToolExecuteBefore>[0],
      output as Parameters<typeof sessionTracker.handleToolExecuteBefore>[1],
    )
  } catch {
    // Best-effort: session tracker failures must never block tool dispatch.
  }
},
```

Insert this immediately before the existing `"tool.execute.after"` entry (which is at line 236).

**Part B: Fix D-03 — Delegator attribution in handleTask (tool-capture.ts)**

Location: `src/features/session-tracker/capture/tool-capture.ts`, line 256.

The `subagentType` variable is already extracted from args at line 229:
```typescript
const subagentType = (args.subagent_type as string) || ""
```

But it is NOT used for `delegatedBy.agentName` at line 256. **FROM:**
```typescript
delegatedBy: {
  agentName: "unknown", // Parent-agent name not available in tool.execute.after hook
```

**TO:**
```typescript
delegatedBy: {
  agentName: subagentType || "unknown", // per D-03: captured from task tool subagent_type arg
```

This is the D-03 fix: `delegatedBy.agentName` now reflects the actual `subagent_type` parameter from the task tool invocation (e.g., `"hm-l1-coordinator"`, `"gsd-executor"`). Falls back to `"unknown"` only when `subagent_type` is not provided.
  </action>

  <verify>
    <automated>npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts</automated>
  </verify>

  <done>
    - `tool.execute.before` key exists in plugin.ts return object
    - Hook routes to `sessionTracker.handleToolExecuteBefore()` 
    - `delegatedBy.agentName` reads from `subagentType` instead of hardcoded "unknown"
    - All existing tool-capture tests pass
  </done>
</task>

<!-- ────────────────────────────────────────────────────────────────────── -->
<!-- TASK 3: Tests — PreToolUse handler, HierarchyIndex registration,      -->
<!--          D-03 attribution, hook wiring integration                    -->
<!-- ────────────────────────────────────────────────────────────────────── -->
<task type="auto" tdd="true">
  <name>Task 3: Add tests for PreToolUse handler, HierarchyIndex registration, and D-03 attribution</name>
  <files>
    tests/features/session-tracker/session-tracker.test.ts
    tests/features/session-tracker/capture/tool-capture.test.ts
    tests/features/session-tracker/integration/hook-wiring.test.ts
  </files>

  <read_first>
    tests/features/session-tracker/session-tracker.test.ts (lines 1-80 — mock setup pattern)
    tests/features/session-tracker/capture/tool-capture.test.ts (lines 1-50 — mock setup pattern)
    tests/features/session-tracker/integration/hook-wiring.test.ts (lines 1-100 — hook wiring test patterns)
  </read_first>

  <behavior>
    - Test 1: handleToolExecuteBefore detects task tool, calls through without error
    - Test 2: handleToolExecuteBefore skips non-task tools (skill, read, etc.) — no-op
    - Test 3: handleToolExecuteBefore handles resume (task_id in args) — registers in hierarchy
    - Test 4: handleToolExecuteBefore handles new dispatch (no task_id) — no crash, best-effort
    - Test 5: handleTask delegatedBy.agentName reads from subagent_type arg
    - Test 6: event-capture registers child in HierarchyIndex when SDK returns parentID
    - Test 7: Integration: tool.execute.before → session.created → HierarchyIndex populated
    - Test 8: All 256+ existing tests still pass (full suite regression)
  </behavior>

  <action>
**Part A: Add tests to session-tracker.test.ts**

Append a new `describe` block before the file's end. Follow the existing mock pattern (vi.mock for getSession, mock client).

```typescript
describe("SessionTracker — handleToolExecuteBefore (PreToolUse)", () => {
  it("detects task tool dispatch without throwing", async () => {
    // SETUP: tracker with initialized mocks, hierarchyIndex present
    const tracker = new SessionTracker({ client: mockClient as never, projectRoot: "/fake/project" })
    ;(tracker as any).hierarchyIndex = { registerChild: vi.fn(), isChild: vi.fn().mockReturnValue(false) }
    
    await expect(
      tracker.handleToolExecuteBefore(
        { tool: "task", sessionID: "ses_parent1234567890a", callID: "call_1", args: { subagent_type: "hm-l1-coordinator", description: "Test task" } },
        { args: { subagent_type: "hm-l1-coordinator", description: "Test task" } }
      )
    ).resolves.toBeUndefined()
  })

  it("skips non-task tools silently", async () => {
    const tracker = new SessionTracker({ client: mockClient as never, projectRoot: "/fake/project" })
    ;(tracker as any).hierarchyIndex = { registerChild: vi.fn(), isChild: vi.fn() }
    
    await expect(
      tracker.handleToolExecuteBefore(
        { tool: "skill", sessionID: "ses_test1234567890a", callID: "call_2", args: { name: "test-skill" } },
        { args: { name: "test-skill" } }
      )
    ).resolves.toBeUndefined()
    // verify hierarchyIndex was never touched for non-task tools
    expect((tracker as any).hierarchyIndex.registerChild).not.toHaveBeenCalled()
  })

  it("handles resume scenario (task_id in args)", async () => {
    const mockRegisterChild = vi.fn()
    const mockIsChild = vi.fn().mockReturnValue(false)
    mockGetSession.mockResolvedValue({ id: "ses_child9876543210b", parentID: "ses_parent1234567890a" })
    
    const tracker = new SessionTracker({ client: mockClient as never, projectRoot: "/fake/project" })
    ;(tracker as any).hierarchyIndex = { registerChild: mockRegisterChild, isChild: mockIsChild }
    ;(tracker as any).getSessionSafely = tracker["getSessionSafely"]
    
    await tracker.handleToolExecuteBefore(
      { tool: "task", sessionID: "ses_parent1234567890a", callID: "call_3", args: { task_id: "ses_child9876543210b", subagent_type: "gsd-executor" } },
      { args: { task_id: "ses_child9876543210b", subagent_type: "gsd-executor" } }
    )
    
    expect(mockRegisterChild).toHaveBeenCalledWith("ses_parent1234567890a", "ses_child9876543210b")
  })

  it("gracefully handles errors (best-effort)", async () => {
    const tracker = new SessionTracker({ client: mockClient as never, projectRoot: "/fake/project" })
    ;(tracker as any).hierarchyIndex = { 
      isChild: vi.fn().mockImplementation(() => { throw new Error("Boom") }) 
    }
    
    // Must NOT throw — best-effort
    await expect(
      tracker.handleToolExecuteBefore(
        { tool: "task", sessionID: "ses_test1234567890a", callID: "call_4", args: { task_id: "ses_child9876543210b" } },
        { args: { task_id: "ses_child9876543210b" } }
      )
    ).resolves.toBeUndefined()
  })
})
```

**Part B: Add/update tests in tool-capture.test.ts**

Add a test for D-03 delegator attribution:

```typescript
it("uses subagent_type from args for delegatedBy.agentName (D-03)", async () => {
  // Verify that handleTask sets delegatedBy.agentName to the actual subagent_type value
  // rather than hardcoded "unknown"
  const marshal = await createToolCaptureMarshal({ projectRoot: testRoot })
  const input = {
    tool: "task",
    sessionID: "ses_parent1234567890a",
    callID: "call_d03",
    args: { subagent_type: "hm-l1-coordinator", description: "Coordinating work" },
  }
  const output = { output: "task_id: ses_child1234567890b" }

  await marshal.capture.handleToolExecuteAfter(input, output)

  // Verify the child JSON was written with correct agentName
  const childPath = resolve(marshal.root, "ses_parent1234567890a", "ses_child1234567890b.json")
  const childRaw = await readFile(childPath, "utf-8")
  const child = JSON.parse(childRaw)
  expect(child.delegatedBy.agentName).toBe("hm-l1-coordinator")
})
```

**Part C: Add integration test to hook-wiring.test.ts**

Add a test for the PreToolUse → session.created → HierarchyIndex flow:

```typescript
describe("tool.execute.before → HierarchyIndex registration (AC-11)", () => {
  it("registers child in HierarchyIndex at session.created time", async () => {
    const mockGetSession = vi.mocked(getSession)
    mockGetSession.mockResolvedValue({
      id: "ses_child1234567890c",
      parentID: "ses_parent1234567890a",  // ← SDK reports parentID
      title: "Child",
      time: { created: Date.now(), updated: Date.now() },
    })

    tracker = new SessionTracker({ client: mockClient as never, projectRoot: testRoot })
    await tracker.initialize()

    // Simulate session.created for a child session
    await tracker.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child1234567890c",
      event: {},
    })

    // Verify HierarchyIndex now knows this child
    const hierarchyIndex = (tracker as any).hierarchyIndex
    expect(hierarchyIndex.isChild("ses_child1234567890c")).toBe(true)
    expect(hierarchyIndex.getParent("ses_child1234567890c")).toBe("ses_parent1234567890a")
  })
})
```

**Part D: Full test suite regression run**

After all changes, run the full test suite to verify no regressions:
  </action>

  <verify>
    <automated>npm test 2>&1 | tail -20</automated>
  </verify>

  <done>
    - All new tests pass: handleToolExecuteBefore detection, skip, resume, error handling
    - tool-capture test verifies D-03: delegatedBy.agentName uses subagent_type value
    - Integration test verifies HierarchyIndex populated at session.created time
    - Full test suite: 256+ tests pass (no regressions)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| OpenCode runtime → `tool.execute.before` hook | Untrusted input: `args.subagent_type`, `args.task_id`, `args.description` from task tool parameters |
| Hook handler → HierachyIndex | In-memory state mutation from hook observations (read-side) |
| `session.created` event → HierarchyIndex | SDK-reported parentID edges registered in hierarchy |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | `handleToolExecuteBefore` args extraction | mitigate | Validate `isValidSessionID(task_id)` before registering; use safe property access on args |
| T-02-02 | Denial of Service | `handleToolExecuteBefore` blocking tool execution | mitigate | Best-effort try/catch — never throw to runtime; failures silently logged |
| T-02-03 | Information Disclosure | `subagent_type` stored in `delegatedBy.agentName` | accept | Agent name is metadata, not PII; stored in `.hivemind/session-tracker/` which is gitignored |
| T-02-04 | Elevation of Privilege | Hook CQRS boundary — hooks must not perform durable writes | mitigate | `handleToolExecuteBefore` only mutates in-memory `HierarchyIndex` (Map.set) and `bootstrappedSessions` (Set); no file I/O |
</threat_model>

<verification>
## Full Regression
```bash
npm test
```
Expected: all 256+ tests pass. No regressions from existing session-tracker tests.

## Targeted Tests
```bash
npx vitest run tests/features/session-tracker/session-tracker.test.ts
npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts
npx vitest run tests/features/session-tracker/integration/hook-wiring.test.ts
```
Expected: new PreToolUse and D-03 tests pass, existing tests unchanged.

## Type Safety
```bash
npm run typecheck
```
Expected: zero type errors.
</verification>

<success_criteria>
1. `tool.execute.before` hook exists in `src/plugin.ts` return object and compiles
2. `SessionTracker.handleToolExecuteBefore()` method exists, handles task tool detection
3. `event-capture.ts` registers child sessions in `HierarchyIndex` when SDK parentID is found (orphan prevention)
4. `tool-capture.ts` `handleTask()` uses `subagentType || "unknown"` for `delegatedBy.agentName` (D-03)
5. All new tests pass (handleToolExecuteBefore, hierarchy registration, D-03 attribution)
6. Full test suite passes with zero regressions (256+ tests)
7. Typecheck passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-01-SUMMARY.md`
</output>

---
phase: CP-ST-02-session-tracker-deep-fix-remaining
plan: 02
type: execute
wave: 2
depends_on:
  - CP-ST-02-01
files_modified:
  - src/plugin.ts
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/persistence/pending-dispatch-registry.ts
autonomous: true
requirements:
  - AC-10
must_haves:
  truths:
    - "tool.execute.before hook fires for task tool dispatch and registers pending entry"
    - "handleToolExecuteBefore skips registration when task_id is present (resume detection)"
    - "Fire-and-forget polling discovers child sessions within 1s (5×200ms retries)"
    - "On child discovery, HierarchyIndex is populated before session.created fires"
    - "PostToolUse metadata.sessionId flow updates the pending registry entry with child ID"
  artifacts:
    - path: "src/plugin.ts"
      provides: "tool.execute.before hook wiring for session-tracker"
      contains: "tool.execute.before"
      contains: "handleToolExecuteBefore"
    - path: "src/features/session-tracker/index.ts"
      provides: "handleToolExecuteBefore public method"
      exports: ["handleToolExecuteBefore"]
    - path: "src/features/session-tracker/persistence/pending-dispatch-registry.ts"
      provides: "parentCandidateIDs() method for fuzzy matching during race window"
      exports: ["parentCandidateIDs"]
  key_links:
    - from: "src/plugin.ts tool.execute.before"
      to: "sessionTracker.handleToolExecuteBefore()"
      via: "input.tool === 'task'"
      pattern: "handleToolExecuteBefore"
    - from: "handleToolExecuteBefore"
      to: "pendingRegistry.add()"
      via: "entry dispatch"
      pattern: "pendingRegistry\\.add"
    - from: "handleToolExecuteBefore"
      to: "client.session.children()"
      via: "fire-and-forget poll"
      pattern: "session\\.children"
</must_haves>
---

<objective>
Wire the `tool.execute.before` hook in `src/plugin.ts` to detect task tool dispatch, register a pending entry in PendingDispatchRegistry, fire-and-forget poll Server API for child discovery, and handle resume detection (skip registration when `task_id` is present).

Purpose: Proactively discover child session IDs before `session.created` fires, populating HierarchyIndex and removing pending registry entries to prevent the race condition that causes orphan directories.

Output:
- Modified: `src/plugin.ts` — new `"tool.execute.before"` hook entry
- Modified: `src/features/session-tracker/index.ts` — new `handleToolExecuteBefore()` method
- Modified: `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — new `parentCandidateIDs()` method
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-SPEC.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-RESEARCH.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-CONTEXT.md
@.planning/codebase/ARCHITECTURE.md

<interfaces>
<!-- Key types and patterns the executor needs -->

From src/plugin.ts (existing hook pattern — tool.execute.after at lines 236-253):
```typescript
// Pattern to follow: best-effort try/catch, never throw to runtime
"tool.execute.after": async (
  input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> },
  _output?: { metadata?: unknown; [key: string]: unknown } | string,
): Promise<void> => {
  // ...tool guard logic...
  try {
    await sessionTracker.handleToolExecuteAfter(...)
  } catch {
    // Best-effort: never fail the tool call.
  }
}
```

From src/hooks/guards/tool-guard-hooks.ts (existing tool.execute.before pattern at lines 68-76):
```typescript
"tool.execute.before": async (input: BeforeInput, output: BeforeOutput): Promise<void> => {
  classifyHookEffect("tool.execute.before")
  const sessionID = asString(getNestedValue(input, ["sessionID"]))
  const toolName = asString(getNestedValue(input, ["tool"]))
  const rawArgs = getNestedValue(output, ["args"])
  if (!sessionID || !toolName) return
  // ...circuit breaker logic...
}
```

From src/shared/session-api.ts (SDK client type):
```typescript
export type OpenCodeClient = ReturnType<typeof createOpencodeClient>
// client.session.children({ path: { id: parentID } }) returns { data: Session[] }
// Session shape: { id: string, parentID?: string, title?: string, status?: string, ... }
```

From src/features/session-tracker/persistence/pending-dispatch-registry.ts (created in Plan 01):
```typescript
export class PendingDispatchRegistry {
  add(entry: PendingDispatchEntry): void
  updateWithChildID(callID: string, childSessionID: string): void
  has(sessionID: string): boolean
  get(sessionID: string): PendingDispatchEntry | undefined
  removeByCallID(callID: string): void
  cleanupStale(): void
}
```

From src/features/session-tracker/persistence/hierarchy-index.ts:
```typescript
export class HierarchyIndex {
  registerChild(parentID: string, childID: string): void
}
```

From SPEC §3 (PreToolUse hook integration — handleToolExecuteBefore behavior specification):
```typescript
// SPEC §3.2: handleToolExecuteBefore Behavior
// WHEN task_id is present (resume) → skip registration
// WHEN task_id is absent (new dispatch) → register in PendingDispatchRegistry
// AND fire-and-forget poll client.session.children(parentID)
```

From SPEC §3.3 (polling strategy):
```
pollForChildren(parentID, maxAttempts = 5, interval = 200):
  for attempt in 1..maxAttempts:
    children = await client.session.children({ path: { id: parentID } })
    newChildren = children.filter(c => c.id not in knownChildren)
    for child in newChildren:
      hierarchyIndex.registerChild(parentID, child.id)
      pendingRegistry.removeByParentAndRecent(parentID)
    if newChildren.length > 0: break
    await sleep(interval)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add handleToolExecuteBefore method to SessionTracker</name>
  <files>src/features/session-tracker/index.ts</files>

  <read_first>
Read before implementing:
- `src/features/session-tracker/index.ts` (full file — note private fields, constructor pattern, public method patterns)
- SPEC §3.2 (handleToolExecuteBefore behavior: resume skip vs new dispatch registration)
- SPEC §3.3 (polling strategy)
- CONTEXT §D-02 (PreToolUse hook → PendingDispatchRegistry flow)
- RESEARCH §2.2 (open question: fire-and-forget to not block tool execution)
  </read_first>

  <behavior>
  - Test 1: handleToolExecuteBefore detects task tool dispatch (input.tool === "task") and registers pending entry
  - Test 2: handleToolExecuteBefore skips registration when task_id is present in args (resume detection per AC-10)
  - Test 3: handleToolExecuteBefore skips registration when tool is not "task"
  - Test 4: handleToolExecuteBefore catches errors and logs warning (best-effort, never throws)
  - Test 5: handleToolExecuteBefore starts fire-and-forget polling loop (non-blocking promise)
  - Test 6: Polling loop discovers child via client.session.children() and registers in HierarchyIndex
  - Test 7: Polling loop calls pendingRegistry.updateWithChildID() on discovery
  - Test 8: Polling loop stops after max 5 attempts with 200ms interval
  - Test 9: SDK client session.children() failures are caught silently (best-effort)
  </behavior>

  <action>

Add a new public method `handleToolExecuteBefore()` to the `SessionTracker` class in `src/features/session-tracker/index.ts`.

**Placement:** After the existing `handleToolExecuteAfter()` method (after line 505, before `initialize()`), add:

```typescript
  /**
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Called synchronously from the plugin.ts tool.execute.before hook.
   * Must NOT block tool execution — fire-and-forget polling only.
   *
   * Per D-02 (CONTEXT.md):
   * - Detects task tool dispatch (tool === "task")
   * - Stores pending entry in PendingDispatchRegistry
   * - Fire-and-forget polls client.session.children() for new child sessions
   * - On child discovery: registers in HierarchyIndex, removes from pending registry
   * - Resume detection: if task_id is present, skip registration (AC-10)
   *
   * @param params - Hook input parameters.
   * @param params.sessionID - The parent session ID (tool executor's session).
   * @param params.callID - The tool call identifier.
   * @param params.subagentType - The subagent_type from task tool args (e.g., "hm-l2-researcher").
   * @param params.description - The task description.
   * @param params.taskId - If present, this is a resume (existing session) — skip registration.
   */
  async handleToolExecuteBefore(params: {
    sessionID: string
    callID: string
    subagentType: string
    description: string
    taskId?: string
  }): Promise<void> {
    try {
      if (!isValidSessionID(params.sessionID)) return

      // Resume detection (AC-10): if task_id is present, this is a resume dispatch.
      // The child session already exists — no need to register a pending entry.
      if (params.taskId) {
        return
      }

      // Ensure pendingRegistry is initialized (may not be during plugin startup race)
      if (!this.pendingRegistry) return

      // Register pending dispatch entry for Gate 3 classification
      this.pendingRegistry.add({
        parentSessionID: params.sessionID,
        callID: params.callID,
        subagentType: params.subagentType || "unknown",
        timestamp: Date.now(),
      })

      // Fire-and-forget polling: discover child session via Server API.
      // The task tool creates the child during execution — poll to catch it
      // before session.created fires.
      // IMPORTANT: do NOT await here — would block tool execution.
      void this.pollForChildSessions(params.sessionID, params.callID)
    } catch (err) {
      // Best-effort: never throw to the OpenCode runtime
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: handleToolExecuteBefore failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Fire-and-forget polling loop to discover child sessions after task dispatch.
   *
   * Per SPEC §3.3: polls client.session.children() every 200ms for up to 5 attempts.
   * On discovery: registers child in HierarchyIndex and updates pending registry.
   * Never throws — all errors caught silently (best-effort).
   *
   * @param parentID - The parent session ID to check children for.
   * @param callID - The tool call ID for pending registry cleanup.
   */
  private async pollForChildSessions(
    parentID: string,
    callID: string,
  ): Promise<void> {
    const MAX_ATTEMPTS = 5
    const POLL_INTERVAL_MS = 200

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        // Use type assertion to access session.children() which exists on
        // the OpenCode client but may not be in our strict type definition.
        const client = this.client as OpenCodeClient & {
          session: {
            children(params: { path: { id: string } }): Promise<{
              data?: Array<{ id: string; parentID?: string }>
            }>
          }
        }
        const result = await client.session.children({ path: { id: parentID } })
        const children = result.data ?? []

        // Filter for children: (a) not already in hierarchy index, (b) valid session IDs
        const newChildren = children.filter(
          (c) => c.id && isValidSessionID(c.id) && !this.hierarchyIndex?.isChild(c.id),
        )

        if (newChildren.length > 0) {
          for (const child of newChildren) {
            // Register in hierarchy index (Gate 2 cache)
            if (child.id) {
              this.hierarchyIndex?.registerChild(parentID, child.id)
            }
            // Update pending registry with real child ID (Gate 3 cache)
            if (child.id) {
              this.pendingRegistry?.updateWithChildID(callID, child.id)
            }
          }
          // Success: children discovered, exit polling loop
          return
        }
      } catch {
        // Server API may not be ready — retry after interval
      }

      // Wait before next attempt (don't sleep on final attempt)
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    }

    // Max attempts exhausted without discovery — child may appear later via
    // tool.execute.after handleTask(). Pending registry entry serves as
    // Gate 3 fallback for up to 30s (STALE_THRESHOLD_MS).
    void this.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Harness] Session tracker: polling exhausted for parent "${parentID}" — relying on PostToolUse registration`,
      },
    })
  }
```

**Also update the `tool.execute.after` handler** in `handleToolExecuteAfter()` to clean up pending registry entries. After the `case "task"` is handled inside `ToolCapture.handleToolExecuteAfter`, the pending dispatch should be removed. Add this logic to the PostToolUse path in `handleToolExecuteAfter()` — before line 473's `if (parentID)` check, add:

```typescript
      // Clean up pending dispatch registry when PostToolUse fires.
      // If handleTask registered the child in HierarchyIndex, remove the pending entry.
      if (this.pendingRegistry && input.callID) {
        this.pendingRegistry.removeByCallID(input.callID)
      }
```

Place this right after line 452 (`): Promise<void> {`) and before line 455 (`try {`), inside the try block:

Actually, the better placement is inside the `try` block of `handleToolExecuteAfter`, right after the Gate 1/Gate 2 checks, but before the `if (parentID)` branch. Since tool-capture.handleTask() runs later in the flow, the cleanup should happen AFTER toolCapture handles the task. So place it AFTER `await this.toolCapture.handleToolExecuteAfter(...)` at both lines 479 and 490.

Look for the two call sites of `this.toolCapture.handleToolExecuteAfter(...)` — after each, add:

```typescript
        // Clean up pending dispatch registry (AC-05: entry removed at PostToolUse)
        if (this.pendingRegistry && input.callID) {
          this.pendingRegistry.removeByCallID(input.callID)
        }
```

  </action>

  <verify>
    <automated>npx vitest run tests/features/session-tracker/index.test.ts -t "handleToolExecuteBefore" --reporter=verbose</automated>
  </verify>

  <acceptance_criteria>
- [ ] `SessionTracker.handleToolExecuteBefore()` method exists as public method
- [ ] Detects task tool dispatch: checks `tool === "task"` (implemented in plugin.ts hook)
- [ ] Adds pending entry: `this.pendingRegistry.add({ parentSessionID, callID, subagentType, timestamp })`
- [ ] Resume detection: skips registration when `params.taskId` is truthy (AC-10)
- [ ] Fire-and-forget polling: `void this.pollForChildSessions(parentID, callID)` — not awaited
- [ ] `pollForChildSessions` is a private method with MAX_ATTEMPTS=5, POLL_INTERVAL_MS=200
- [ ] On child discovery: `hierarchyIndex.registerChild()` + `pendingRegistry.updateWithChildID()` called
- [ ] PostToolUse cleanup: `handleToolExecuteAfter` removes pending registry entry via `removeByCallID()`
- [ ] Best-effort: all errors caught, logged as warn, never thrown
- [ ] grep: `grep -n "handleToolExecuteBefore" src/features/session-tracker/index.ts` shows implementation
- [ ] grep: `grep -n "pollForChildSessions" src/features/session-tracker/index.ts` shows private method
  </acceptance_criteria>

  <done>SessionTracker.handleToolExecuteBefore() method created with pending registration, fire-and-forget Server API polling, resume detection, and PostToolUse cleanup.</done>
</task>

<task type="auto">
  <name>Task 2: Wire tool.execute.before hook in plugin.ts for session-tracker</name>
  <files>src/plugin.ts</files>

  <read_first>
Read before implementing:
- `src/plugin.ts` (full file — especially lines 182-183 toolGuardHooks spread, lines 234-273 tool.execute.after pattern)
- `src/hooks/guards/tool-guard-hooks.ts` (lines 68-76: existing tool.execute.before pattern to follow)
- SPEC §3.1 (hook wiring code: tool === "task" check, args extraction)
- CONTEXT §D-02 (PreToolUse hook → PendingDispatchRegistry flow)
- RESEARCH §3.3 (hook signature: `tool.execute.before` input/output shapes)
- RESEARCH §3.6 (Common Pitfall 1: child not yet created at PreToolUse time)
  </read_first>

  <action>

Wire the `"tool.execute.before"` hook in `src/plugin.ts` to detect task tool dispatch and route to session-tracker.

**Step 1: Add the hook in the return object**

In the return object of `HarnessControlPlane` (after the `"chat.message"` hook at line 209, before the `tool:` block at line 210), add:

```typescript
    // tool.execute.before: proactive child session discovery for session-tracker.
    // When a task tool dispatch is detected, register a pending entry and start
    // fire-and-forget polling to discover the child session before session.created
    // fires, preventing orphan directories (CP-ST-02, D-02).
    // Best-effort: never blocks tool execution, never throws to runtime.
    "tool.execute.before": async (input, output) => {
      // Run existing tool guard logic first (circuit breaker, budget checks)
      await toolGuardHooks["tool.execute.before"](input, output)

      // Session tracker: detect task tool dispatch for proactive child discovery
      try {
        const toolName = (input as Record<string, unknown>)?.tool
        if (toolName === "task") {
          const inputRecord = input as Record<string, unknown>
          const sessionID = (inputRecord.sessionID as string) || ""
          const callID = (inputRecord.callID as string) || ""

          // Extract args from output (PreToolUse output contains the tool's arguments)
          const outputRecord = output as Record<string, unknown> | undefined
          const args = (outputRecord?.args ?? {}) as Record<string, unknown>

          const subagentType = (args.subagent_type as string) || ""
          const description = (args.description as string) || ""
          const taskId = (args.task_id as string) || undefined

          if (sessionID && callID) {
            await sessionTracker.handleToolExecuteBefore({
              sessionID,
              callID,
              subagentType,
              description,
              taskId,
            })
          }
        }
      } catch (err) {
        // Best-effort: never block tool execution or throw to runtime
        void client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: "[Harness] Session tracker: tool.execute.before hook failed",
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      }
    },
```

**Step 2: Position in the object spread order**

The `tool.execute.before` hook goes as a top-level key in the returned plugin object. The existing `tool.execute.before` from `toolGuardHooks` is spread-merged into the returned object via:
```typescript
    ...toolGuardHooks,
```
at line 190. To preserve the guard behavior AND add session-tracker logic, the `"tool.execute.before"` key in the return object (before the spread) will be used by the plugin system. However, since OpenCode plugin hooks merge on a per-key basis, we need to ensure BOTH hooks run.

The correct approach is to NOT spread `...toolGuardHooks` at the top-level return object, but instead to call `toolGuardHooks["tool.execute.before"]` explicitly within our new hook. This is already done in the code above (`await toolGuardHooks["tool.execute.before"](input, output)`).

Remove the `...toolGuardHooks,` spread from the return object (line 190) and instead explicitly register `"tool.execute.before"` and `"tool.execute.after"` as separate keys:

Current return object structure:
```typescript
    ...createCoreHooks({...}),
    ...sessionReadHooks,
    ...toolGuardHooks,
    "chat.message": async (input, output) => { ... },
    tool: { ... },
    "tool.execute.after": async (input, _output) => { ... },
```

Change to:
```typescript
    ...createCoreHooks({...}),
    ...sessionReadHooks,
    // tool.execute.before: combined guard + session-tracker detection
    "tool.execute.before": async (input, output) => {
      // Run existing tool guard logic (circuit breaker, budget, governance)
      await toolGuardHooks["tool.execute.before"](input, output)

      // Session tracker: detect task dispatch for proactive child discovery
      try {
        const toolName = (input as Record<string, unknown>)?.tool
        if (toolName === "task") {
          const inputRecord = input as Record<string, unknown>
          const sessionID = (inputRecord.sessionID as string) || ""
          const callID = (inputRecord.callID as string) || ""
          const outputRecord = output as Record<string, unknown> | undefined
          const args = (outputRecord?.args ?? {}) as Record<string, unknown>
          const subagentType = (args.subagent_type as string) || ""
          const description = (args.description as string) || ""
          const taskId = (args.task_id as string) || undefined

          if (sessionID && callID) {
            await sessionTracker.handleToolExecuteBefore({
              sessionID, callID, subagentType, description, taskId,
            })
          }
        }
      } catch (err) {
        void client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: "[Harness] Session tracker: tool.execute.before hook failed",
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      }
    },
    "chat.message": async (input, output) => { ... },
    tool: { ... },
    "tool.execute.after": async (input, _output) => {
      // Run existing tool guard logic first
      const fact = await createToolExecuteAfterHook({
        toolGuardAfterHook: toolGuardHooks["tool.execute.after"],
        summarizeOutput: summarizePluginToolOutput,
      })(input, _output)
      void fact
      // ... existing session-tracker and workflow logic ...
    },
```

Note: The `...toolGuardHooks,` spread (line 190) is REMOVED. The `"tool.execute.before"` key above replaces it, and the `"tool.execute.after"` key already correctly calls `toolGuardHooks["tool.execute.after"]` inside its body.

  </action>

  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/ --reporter=verbose 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
- [ ] `"tool.execute.before"` hook present in returned plugin object in `src/plugin.ts`
- [ ] Hook calls `toolGuardHooks["tool.execute.before"](input, output)` first (preserves circuit breaker)
- [ ] Hook detects `toolName === "task"` before session-tracker logic
- [ ] Hook extracts `subagent_type`, `description`, `task_id` from `output.args`
- [ ] Hook calls `sessionTracker.handleToolExecuteBefore({ sessionID, callID, subagentType, description, taskId })`
- [ ] Hook is wrapped in try/catch — logs warning, never throws
- [ ] `...toolGuardHooks,` spread is removed from return object (replaced by explicit `"tool.execute.before"` key)
- [ ] `"tool.execute.after"` still calls `toolGuardHooks["tool.execute.after"]` inside its body (unchanged pattern)
- [ ] grep: `grep -n "tool.execute.before" src/plugin.ts` shows the new hook
- [ ] grep: `grep -n "handleToolExecuteBefore" src/plugin.ts` shows the call
- [ ] `npm run typecheck` passes with no new errors
- [ ] All existing tests pass: `npx vitest run tests/features/session-tracker/` (≥256)
  </acceptance_criteria>

  <done>plugin.ts now has a tool.execute.before hook that detects task dispatch, registers pending entries, and starts fire-and-forget polling — all without blocking tool execution.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| OpenCode runtime → Plugin hooks | Untrusted hook input/output shapes cross this boundary |
| Plugin hook → SDK Server API | Session children queries cross network boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-05 | Spoofing | Hook input args | mitigate | Validate tool === "task" before processing; validate sessionID with isValidSessionID(); use `args?.subagent_type ?? ""` default |
| T-02-06 | Denial of Service | Polling loop | mitigate | Capped at 5 attempts × 200ms = max 1s total polling time; fire-and-forget pattern never blocks tool execution |
| T-02-07 | Elevation of Privilege | SDK children query | accept | `client.session.children()` returns only sessions owned by the same project context; SDK handles auth internally |
| T-02-08 | Information Disclosure | subagentType in hook | accept | subagentType is agent name from task tool args — not sensitive data; stored in-memory only |
</threat_model>

<verification>
```bash
# Type check
npm run typecheck

# Scoped tests for session-tracker
npx vitest run tests/features/session-tracker/

# Verify hook wiring presence
grep -n "tool.execute.before" src/plugin.ts
grep -n "handleToolExecuteBefore" src/plugin.ts

# Verify handler method presence
grep -n "handleToolExecuteBefore" src/features/session-tracker/index.ts
grep -n "pollForChildSessions" src/features/session-tracker/index.ts
```
</verification>

<success_criteria>
1. `src/plugin.ts` has `"tool.execute.before"` hook that routes to `sessionTracker.handleToolExecuteBefore()`
2. `SessionTracker.handleToolExecuteBefore()` registers pending entry and starts fire-and-forget polling
3. Polling discovers child via `client.session.children()` within 5×200ms attempts
4. Resume detection (task_id present) skips registration (AC-10)
5. PostToolUse cleans up pending registry entry
6. Best-effort: all errors caught, never block tool execution
7. All 256+ existing tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-02-SUMMARY.md`
</output>

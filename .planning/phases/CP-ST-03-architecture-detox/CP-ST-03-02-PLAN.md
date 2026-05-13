---
phase: CP-ST-03-architecture-detox
plan: 02
type: execute
wave: 2
depends_on:
  - CP-ST-03-01
files_modified:
  # NEW hook modules (7 files):
  - src/hooks/observers/session-entry-consumer.ts
  - src/hooks/observers/session-main-consumer.ts
  - src/hooks/observers/delegation-consumer.ts
  - src/hooks/observers/session-tracker-consumer.ts
  - src/hooks/transforms/tool-before-guard.ts
  - src/hooks/transforms/chat-message-capture.ts
  - src/hooks/transforms/tool-after-workflow.ts
  # NEW test files (7 files):
  - tests/hooks/observers/session-entry-consumer.test.ts
  - tests/hooks/observers/session-main-consumer.test.ts
  - tests/hooks/observers/delegation-consumer.test.ts
  - tests/hooks/observers/session-tracker-consumer.test.ts
  - tests/hooks/transforms/tool-before-guard.test.ts
  - tests/hooks/transforms/chat-message-capture.test.ts
  - tests/hooks/transforms/tool-after-workflow.test.ts
  # EDITED (1 file):
  - src/plugin.ts
autonomous: true
requirements:
  - AC-14
  - AC-15
  - AC-16
  - AC-17
  - AC-18
  - AC-19
  - AC-20
  - AC-21
  - AC-22
  - AC-23
  - AC-24
  - AC-25
  - AC-26
  - AC-27
  - AC-28
  - AC-29
must_haves:
  truths:
    - "7 new hook module files exist under src/hooks/observers/ and src/hooks/transforms/"
    - "Each hook module exports exactly one factory function"
    - "src/plugin.ts has zero inline callback closures — all use factory imports"
    - "src/plugin.ts tool registration map is preserved — 27 tool entries intact"
    - "src/plugin.ts LOC is ≤ 250 (D-01 flexible target; structural clarity first)"
    - "npm run typecheck passes with zero errors"
    - "npm test passes — all remaining tests green"
    - "All 276 session-tracker tests pass (AC-26)"
    - "src/plugin/ directory does NOT exist (AP-02)"
    - "Zero new dependencies added (AC-27)"
  artifacts:
    - path: "src/hooks/observers/session-entry-consumer.ts"
      provides: "Extracts consumeSessionEntryFact from plugin.ts inline closure"
      exports: ["createSessionEntryConsumer"]
      min_lines: 15
    - path: "src/hooks/observers/session-main-consumer.ts"
      provides: "Extracts consumeIsMainSessionFact from plugin.ts inline closure"
      exports: ["createSessionMainConsumer"]
      min_lines: 15
    - path: "src/hooks/observers/delegation-consumer.ts"
      provides: "Extracts consumeDelegationFact from plugin.ts inline closure"
      exports: ["createDelegationConsumer"]
      min_lines: 25
    - path: "src/hooks/observers/session-tracker-consumer.ts"
      provides: "Extracts consumeSessionTrackerFact from plugin.ts inline closure"
      exports: ["createSessionTrackerConsumer"]
      min_lines: 30
    - path: "src/hooks/transforms/tool-before-guard.ts"
      provides: "Extracts tool.execute.before handler from plugin.ts"
      exports: ["createToolBeforeGuard"]
      min_lines: 50
    - path: "src/hooks/transforms/chat-message-capture.ts"
      provides: "Extracts chat.message handler from plugin.ts"
      exports: ["createChatMessageCapture"]
      min_lines: 25
    - path: "src/hooks/transforms/tool-after-workflow.ts"
      provides: "Extracts tool.execute.after workflow-config persistence from plugin.ts"
      exports: ["createToolAfterWorkflow"]
      min_lines: 35
    - path: "src/plugin.ts"
      provides: "Thin composition assembly point"
      contains: "tool: {"
      max_lines: 250
  key_links:
    - from: "src/plugin.ts"
      to: "src/hooks/observers/session-tracker-consumer.ts"
      via: "import { createSessionTrackerConsumer } from"
      pattern: "import.*createSessionTrackerConsumer"
    - from: "src/plugin.ts"
      to: "src/hooks/transforms/tool-before-guard.ts"
      via: "import { createToolBeforeGuard } from"
      pattern: "import.*createToolBeforeGuard"
    - from: "src/hooks/observers/session-tracker-consumer.ts"
      to: "src/features/session-tracker/index.js"
      via: "import type { SessionTracker } from"
      pattern: "import.*SessionTracker.*from.*session-tracker"
---

<objective>
Extract 7 inline callback closures from `src/plugin.ts` into dedicated hook modules under `src/hooks/observers/` (4 modules) and `src/hooks/transforms/` (3 modules). Refactor `plugin.ts` to import factory functions and call them with injected dependencies. Create unit tests for each extracted module. The result: `plugin.ts` becomes a pure composition assembly point — imports, dependency instantiation, tool registration map, and hook wiring.

Purpose: Per CONTEXT.md D-01 and ARCHITECTURE.md rule "plugin.ts is a thin composition root," all inline business logic must live in dedicated hook modules. This improves testability (each module can be unit-tested in isolation) and readability (plugin.ts shows architecture, not implementation).

Output: 7 new hook modules with unit tests. `plugin.ts` reduced to ≤ 250 LOC of pure composition. Zero runtime behavior changes.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-CONTEXT.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-SPEC.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-RESEARCH.md

<interfaces>
<!-- Key imports and types the executor needs from codebase. -->

From src/plugin.ts — the 7 inline closures being extracted (current line ranges):

1. consumeSessionEntryFact (lines 125-131):
```typescript
const consumeSessionEntryFact = async ({ event }: { event?: unknown }) => {
  try {
    await sessionEntryObserverFactory.observer({ event })
  } catch {
    // Best-effort intake classification: never block canonical event handling.
  }
}
```

2. consumeIsMainSessionFact (lines 132-138):
```typescript
const consumeIsMainSessionFact = async ({ event }: { event?: unknown }) => {
  try {
    await sessionIsMainObserverFactory.observer({ event })
  } catch {
    // Best-effort isMainSession caching: never block canonical event handling.
  }
}
```

3. consumeDelegationFact (lines 139-147):
```typescript
const consumeDelegationFact = async ({ event }: { event?: unknown }) => {
  const fact = await delegationEventObserver({ event })
  if (fact.kind === "delegation-session-idle") {
    delegationManager.handleSessionIdle(fact.sessionId)
  }
  if (fact.kind === "delegation-session-deleted") {
    delegationManager.handleSessionDeleted(fact.sessionId)
  }
}
```

4. consumeSessionTrackerFact (lines 162-180):
```typescript
const consumeSessionTrackerFact = async ({ event }: { event?: unknown }) => {
  try {
    const ev = event as Record<string, unknown> | undefined
    const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
    const sessionID = getEventSessionID(ev) || ""
    if (sessionID) {
      await sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
    }
  } catch (err) {
    void client.app?.log?.({ body: { service: "session-tracker", level: "warn",
      message: "[Harness] Session tracker event observer failed",
      extra: { error: err instanceof Error ? err.message : String(err) } } })
  }
}
```

5. tool.execute.before handler (lines 194-235):
```typescript
"tool.execute.before": async (input, output) => {
  await toolGuardHooks["tool.execute.before"](input, output)
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
        await sessionTracker.handleToolExecuteBefore({ sessionID, callID, subagentType, description, taskId })
      }
    }
  } catch (err) { /* log warn */ }
}
```

6. chat.message handler (lines 238-254):
```typescript
"chat.message": async (input, output) => {
  try {
    await sessionTracker.handleChatMessage(
      input as Parameters<typeof sessionTracker.handleChatMessage>[0],
      output as Parameters<typeof sessionTracker.handleChatMessage>[1],
    )
  } catch (err) { /* log warn */ }
}
```

7. tool.execute.after workflow persistence (lines 301-317 inside the larger 281-318 handler):
```typescript
// Inside tool.execute.after (lines 301-317):
if (input.tool !== "configure-primitive") return
const args = input.args
if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return
try {
  const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
    await import("./config/workflow/index.js")
  const workflow = readWorkflow(args.workflowId)
  if (!workflow) return
  const advanced = advanceTurn(workflow, args.workflowTurn as number)
  const output = typeof _output === "string" ? _output.substring(0, 500) : "completed"
  const completed = completeCurrentTurn(advanced, { toolOutput: output })
  persistWorkflow(completed)
} catch { /* best-effort */ }
```

Dependencies available in plugin.ts scope (inject as params):
- `sessionEntryObserverFactory` (from `createSessionEntryEventObserver()`)
- `sessionIsMainObserverFactory` (from `createSessionIsMainObserver()`)
- `delegationEventObserver` (from `createDelegationEventObserver()`)
- `delegationManager` (instance of `DelegationManager`)
- `sessionTracker` (instance of `SessionTracker`)
- `client` (OpenCode plugin client — has `app?.log?.()`)
- `toolGuardHooks` (from `createToolGuardHooks()`)
- `getEventSessionID` (from `src/shared/session-api.js`)

Existing import style (TypeScript strict ESM with `.js` extensions):
```typescript
import type { SessionTracker } from "../../features/session-tracker/index.js"
import { getEventSessionID } from "../../shared/session-api.js"
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extract 4 observer consumer modules + create unit tests</name>
  <files>
    src/hooks/observers/session-entry-consumer.ts (NEW)
    src/hooks/observers/session-main-consumer.ts (NEW)
    src/hooks/observers/delegation-consumer.ts (NEW)
    src/hooks/observers/session-tracker-consumer.ts (NEW)
    tests/hooks/observers/session-entry-consumer.test.ts (NEW)
    tests/hooks/observers/session-main-consumer.test.ts (NEW)
    tests/hooks/observers/delegation-consumer.test.ts (NEW)
    tests/hooks/observers/session-tracker-consumer.test.ts (NEW)
  </files>
  <behavior>
    - Test 1: `src/hooks/observers/session-entry-consumer.ts` exists, exports `createSessionEntryConsumer`, and wraps `sessionEntryObserverFactory.observer({ event })` correctly (AC-14)
    - Test 2: `src/hooks/observers/session-main-consumer.ts` exists, exports `createSessionMainConsumer`, and wraps `sessionIsMainObserverFactory.observer({ event })` correctly (AC-15)
    - Test 3: `src/hooks/observers/delegation-consumer.ts` exists, exports `createDelegationConsumer`, and routes delegation facts via `delegationManager.handleSessionIdle/Deleted()` correctly (AC-16)
    - Test 4: `src/hooks/observers/session-tracker-consumer.ts` exists, exports `createSessionTrackerConsumer`, and routes events via `sessionTracker.handleSessionEvent()` correctly (AC-17)
    - Test 5: Each module's unit test passes: verifies factory returns a function, that function calls the correct dependency, error handling doesn't throw
    - Test 6: `src/plugin/` directory does NOT exist (AC-29 — checked at plan end)
  </behavior>
  <action>
**STEP 1 — Create `src/hooks/observers/session-entry-consumer.ts` (AC-14):**

Extract the `consumeSessionEntryFact` inline closure (plugin.ts lines 125-131) into a dedicated factory module.

```typescript
// src/hooks/observers/session-entry-consumer.ts
import type { SessionEntryEventFact } from "./event-observers.js"

export function createSessionEntryConsumer(
  observer: (input: { event?: unknown }) => Promise<SessionEntryEventFact>,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      await observer({ event })
    } catch {
      // Best-effort intake classification: never block canonical event handling.
    }
  }
}
```

The factory accepts the observer as a parameter (dependency injection). The `observer` is `sessionEntryObserverFactory.observer` from plugin.ts.

**STEP 2 — Create `src/hooks/observers/session-main-consumer.ts` (AC-15):**

Extract the `consumeIsMainSessionFact` inline closure (plugin.ts lines 132-138).

```typescript
// src/hooks/observers/session-main-consumer.ts
export function createSessionMainConsumer(
  observer: (input: { event?: unknown }) => Promise<void>,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      await observer({ event })
    } catch {
      // Best-effort isMainSession caching: never block canonical event handling.
    }
  }
}
```

**STEP 3 — Create `src/hooks/observers/delegation-consumer.ts` (AC-16):**

Extract the `consumeDelegationFact` inline closure (plugin.ts lines 139-147).

```typescript
// src/hooks/observers/delegation-consumer.ts
import type { DelegationEventFact } from "./event-observers.js"

export interface DelegationConsumerDeps {
  observer: (input: { event?: unknown }) => Promise<DelegationEventFact>
  handleSessionIdle: (sessionId: string) => void
  handleSessionDeleted: (sessionId: string) => void
}

export function createDelegationConsumer(
  deps: DelegationConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    const fact = await deps.observer({ event })
    if (fact.kind === "delegation-session-idle") {
      deps.handleSessionIdle(fact.sessionId)
    }
    if (fact.kind === "delegation-session-deleted") {
      deps.handleSessionDeleted(fact.sessionId)
    }
  }
}
```

**STEP 4 — Create `src/hooks/observers/session-tracker-consumer.ts` (AC-17):**

Extract the `consumeSessionTrackerFact` inline closure (plugin.ts lines 162-180).

```typescript
// src/hooks/observers/session-tracker-consumer.ts
import { getEventSessionID } from "../../shared/session-api.js"
import type { SessionTracker } from "../../features/session-tracker/index.js"

export interface SessionTrackerConsumerDeps {
  sessionTracker: SessionTracker
  logWarn?: (message: string, error: unknown) => void
}

export function createSessionTrackerConsumer(
  deps: SessionTrackerConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      const ev = event as Record<string, unknown> | undefined
      const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
      const sessionID = getEventSessionID(ev) || ""
      if (sessionID) {
        await deps.sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
      }
    } catch (err) {
      deps.logWarn?.("[Harness] Session tracker event observer failed", err)
    }
  }
}
```

**STEP 5 — Create unit tests for all 4 modules:**

Each test file should:
  - Import the factory function and mock its dependencies using `vi.fn()`
  - Test: factory returns a function (not undefined, not null)
  - Test: returned function calls the injected observer/dependency with event
  - Test: error in observer does NOT throw — caught by try/catch
  - Test: edge case — null/undefined event doesn't crash

Test file pattern:
```typescript
// tests/hooks/observers/session-tracker-consumer.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSessionTrackerConsumer } from "../../../src/hooks/observers/session-tracker-consumer.js"

describe("createSessionTrackerConsumer", () => {
  const mockSessionTracker = { handleSessionEvent: vi.fn().mockResolvedValue(undefined) }
  const mockLogWarn = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it("returns a function", () => {
    const consumer = createSessionTrackerConsumer({ sessionTracker: mockSessionTracker, logWarn: mockLogWarn })
    expect(typeof consumer).toBe("function")
  })

  it("calls sessionTracker.handleSessionEvent for valid events", async () => {
    const consumer = createSessionTrackerConsumer({ sessionTracker: mockSessionTracker, logWarn: mockLogWarn })
    await consumer({ event: { type: "session.created", sessionID: "ses_abc" } })
    expect(mockSessionTracker.handleSessionEvent).toHaveBeenCalled()
  })

  it("does not throw when sessionTracker fails", async () => {
    mockSessionTracker.handleSessionEvent.mockRejectedValue(new Error("boom"))
    const consumer = createSessionTrackerConsumer({ sessionTracker: mockSessionTracker, logWarn: mockLogWarn })
    await expect(consumer({ event: { type: "x" } })).resolves.toBeUndefined()
    expect(mockLogWarn).toHaveBeenCalled()
  })
})
```

**CRITICAL CONSTRAINTS:**
  - Do NOT add new dependencies (AC-27 — `npm run typecheck` verifies)
  - Each module exports exactly ONE factory function (SR-03)
  - Factory functions accept typed dependencies as parameters, NOT global imports (SR-04)
  - Extracted modules are pass-through wrappers — zero new business logic (SR-01, AP-03)
  - Use `.js` import extensions (project standard: `verbatimModuleSyntax: true`)
  - Do NOT create `src/plugin/` directory (AP-02)
  </action>
  <verify>
    <automated>ls src/hooks/observers/session-entry-consumer.ts src/hooks/observers/session-main-consumer.ts src/hooks/observers/delegation-consumer.ts src/hooks/observers/session-tracker-consumer.ts && echo "AC-14/15/16/17 FILES EXIST" && npx vitest run tests/hooks/observers/session-entry-consumer.test.ts tests/hooks/observers/session-main-consumer.test.ts tests/hooks/observers/delegation-consumer.test.ts tests/hooks/observers/session-tracker-consumer.test.ts --reporter=verbose && test -d src/plugin && echo "AC-29 FAIL: src/plugin/ exists" || echo "AC-29 PASS: no src/plugin/ dir"</automated>
  </verify>
  <done>
    - 4 new observer consumer modules exist under src/hooks/observers/ (AC-14, AC-15, AC-16, AC-17)
    - Each exports exactly one factory function (SR-03)
    - 4 unit test files exist with passing tests
    - Zero new dependencies (AC-27 verified at plan end)
    - src/plugin/ does NOT exist (AC-29)
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extract 3 transform modules + create unit tests</name>
  <files>
    src/hooks/transforms/tool-before-guard.ts (NEW)
    src/hooks/transforms/chat-message-capture.ts (NEW)
    src/hooks/transforms/tool-after-workflow.ts (NEW)
    tests/hooks/transforms/tool-before-guard.test.ts (NEW)
    tests/hooks/transforms/chat-message-capture.test.ts (NEW)
    tests/hooks/transforms/tool-after-workflow.test.ts (NEW)
  </files>
  <behavior>
    - Test 1: `src/hooks/transforms/tool-before-guard.ts` exists, exports `createToolBeforeGuard`, combines tool guard + session-tracker detection (AC-18)
    - Test 2: `src/hooks/transforms/chat-message-capture.ts` exists, exports `createChatMessageCapture`, wraps `sessionTracker.handleChatMessage` (AC-19)
    - Test 3: `src/hooks/transforms/tool-after-workflow.ts` exists, exports `createToolAfterWorkflow`, contains workflow config persistence logic (AC-20)
    - Test 4: Each module's unit test passes: verifies factory behavior, error handling, guard-first execution order (tool-before-guard)
  </behavior>
  <action>
**STEP 1 — Create `src/hooks/transforms/tool-before-guard.ts` (AC-18):**

Extract the `tool.execute.before` handler (plugin.ts lines 194-235). This is the most complex extraction — it runs the tool guard FIRST, then does session-tracker detection.

```typescript
// src/hooks/transforms/tool-before-guard.ts
import type { SessionTracker } from "../../features/session-tracker/index.js"

export interface ToolBeforeGuardDeps {
  toolGuardHook: (input: unknown, output: unknown) => Promise<void>
  sessionTracker: SessionTracker
  logWarn?: (message: string, error: unknown) => void
}

export function createToolBeforeGuard(
  deps: ToolBeforeGuardDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input, output) => {
    // Run existing tool guard logic first (circuit breaker, budget, governance)
    await deps.toolGuardHook(input, output)

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
          await deps.sessionTracker.handleToolExecuteBefore({
            sessionID, callID, subagentType, description, taskId,
          })
        }
      }
    } catch (err) {
      deps.logWarn?.("[Harness] Session tracker: tool.execute.before hook failed", err)
    }
  }
}
```

**IMPORTANT:** The tool guard MUST run before session-tracker detection (preserve execution order from the original inline handler). Even if the guard throws, the catch block for session-tracker detection is separate — mirror the original structure exactly.

**STEP 2 — Create `src/hooks/transforms/chat-message-capture.ts` (AC-19):**

Extract the `chat.message` handler (plugin.ts lines 238-254). This is thin — it delegates everything to sessionTracker.

```typescript
// src/hooks/transforms/chat-message-capture.ts
import type { SessionTracker } from "../../features/session-tracker/index.js"

export interface ChatMessageCaptureDeps {
  sessionTracker: SessionTracker
  logWarn?: (message: string, error: unknown) => void
}

export function createChatMessageCapture(
  deps: ChatMessageCaptureDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input, output) => {
    try {
      await deps.sessionTracker.handleChatMessage(
        input as Parameters<typeof deps.sessionTracker.handleChatMessage>[0],
        output as Parameters<typeof deps.sessionTracker.handleChatMessage>[1],
      )
    } catch (err) {
      deps.logWarn?.("[Harness] Session tracker chat.message failed", err)
    }
  }
}
```

**STEP 3 — Create `src/hooks/transforms/tool-after-workflow.ts` (AC-20):**

Extract the workflow-config persistence logic from the `tool.execute.after` handler (plugin.ts lines 301-317). Note: the session-tracker capture part (lines 290-299) stays in the inline `tool.execute.after` handler — only the workflow persistence is extracted per D-01 extraction map.

```typescript
// src/hooks/transforms/tool-after-workflow.ts

export interface ToolAfterWorkflowDeps {
  logWarn?: (message: string, error: unknown) => void
}

export function createToolAfterWorkflow(
  deps: ToolAfterWorkflowDeps,
): (input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> }, _output?: unknown) => Promise<void> {
  return async (input, _output) => {
    if (input.tool !== "configure-primitive") return
    const args = input.args
    if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return

    try {
      const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
        await import("../../config/workflow/index.js")
      const workflow = readWorkflow(args.workflowId)
      if (!workflow) return

      const advanced = advanceTurn(workflow, args.workflowTurn as number)
      const output = typeof _output === "string" ? _output.substring(0, 500) : "completed"
      const completed = completeCurrentTurn(advanced, { toolOutput: output })
      persistWorkflow(completed)
    } catch {
      // Best-effort persistence — never fail the tool call
    }
  }
}
```

**STEP 4 — Create unit tests for all 3 modules:**

For **tool-before-guard.test.ts:**
- Test: factory returns a function
- Test: calls toolGuardHook FIRST, then sessionTracker
- Test: when toolName is NOT "task", skips session-tracker detection
- Test: session-tracker error doesn't throw (wraps in try/catch, calls logWarn)

For **chat-message-capture.test.ts:**
- Test: factory returns a function
- Test: delegates to sessionTracker.handleChatMessage with correct args
- Test: sessionTracker error calls logWarn, doesn't throw

For **tool-after-workflow.test.ts:**
- Test: factory returns a function
- Test: skips non-configure-primitive tools (returns early)
- Test: skips when workflowId/workflowTurn missing
- Test: calls readWorkflow/persistWorkflow for configure-primitive
- Test: error in workflow ops is caught, doesn't throw

**CRITICAL CONSTRAINTS:**
  - Do NOT introduce business logic — these are pass-through wrappers (SR-01, AP-03)
  - Do NOT change execution order — tool guard runs first in tool-before-guard (mirror original)
  - Do NOT add new dependencies (AC-27)
  - Preserve all existing try/catch and error logging patterns exactly
  - Use `.js` import extensions
  </action>
  <verify>
    <automated>ls src/hooks/transforms/tool-before-guard.ts src/hooks/transforms/chat-message-capture.ts src/hooks/transforms/tool-after-workflow.ts && echo "AC-18/19/20 FILES EXIST" && npx vitest run tests/hooks/transforms/tool-before-guard.test.ts tests/hooks/transforms/chat-message-capture.test.ts tests/hooks/transforms/tool-after-workflow.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - 3 new transform modules exist under src/hooks/transforms/ (AC-18, AC-19, AC-20)
    - Each exports exactly one factory function (SR-03)
    - 3 unit test files exist with passing tests
    - Zero business logic introduced in extracted modules (SR-01)
  </done>
</task>

<task type="auto">
  <name>Task 3: Refactor plugin.ts to use factory imports + full verification</name>
  <files>
    src/plugin.ts (EDIT — replace inline closures with factory imports)
  </files>
  <action>
**STEP 1 — Add imports for the 7 new factory modules:**

At the top of `src/plugin.ts`, add these import lines (after the existing hook imports, around line 16-18):

```typescript
import { createSessionEntryConsumer } from "./hooks/observers/session-entry-consumer.js"
import { createSessionMainConsumer } from "./hooks/observers/session-main-consumer.js"
import { createDelegationConsumer } from "./hooks/observers/delegation-consumer.js"
import { createSessionTrackerConsumer } from "./hooks/observers/session-tracker-consumer.js"
import { createToolBeforeGuard } from "./hooks/transforms/tool-before-guard.js"
import { createChatMessageCapture } from "./hooks/transforms/chat-message-capture.js"
import { createToolAfterWorkflow } from "./hooks/transforms/tool-after-workflow.js"
```

**STEP 2 — Replace inline closures with factory calls:**

After the dependency initialization blocks (after line 117: `const sessionIsMainObserverFactory = createSessionIsMainObserver()`), replace the 4 observer inline closures (lines 125-180) with factory calls:

```typescript
  const consumeSessionEntryFact = createSessionEntryConsumer(sessionEntryObserverFactory.observer)
  const consumeIsMainSessionFact = createSessionMainConsumer(sessionIsMainObserverFactory.observer)
  const consumeDelegationFact = createDelegationConsumer({
    observer: delegationEventObserver,
    handleSessionIdle: delegationManager.handleSessionIdle.bind(delegationManager),
    handleSessionDeleted: delegationManager.handleSessionDeleted.bind(delegationManager),
  })
  const consumeSessionTrackerFact = createSessionTrackerConsumer({
    sessionTracker,
    logWarn: (msg, err) => {
      void client.app?.log?.({
        body: { service: "session-tracker", level: "warn",
          message: msg,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    },
  })
```

**STEP 3 — Replace transform handlers:**

In the return block, replace the `tool.execute.before` inline handler with:

```typescript
    "tool.execute.before": createToolBeforeGuard({
      toolGuardHook: toolGuardHooks["tool.execute.before"].bind(toolGuardHooks),
      sessionTracker,
      logWarn: (msg, err) => {
        void client.app?.log?.({
          body: { service: "session-tracker", level: "warn",
            message: msg,
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      },
    }),
```

Replace `chat.message` with:

```typescript
    "chat.message": createChatMessageCapture({
      sessionTracker,
      logWarn: (msg, err) => {
        void client.app?.log?.({
          body: { service: "session-tracker", level: "warn",
            message: msg,
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      },
    }),
```

**STEP 4 — Refactor tool.execute.after handler:**

The `tool.execute.after` handler (lines 281-318) has two parts:
  a) Session-tracker capture (lines 290-299) — keep inline (it's thin and uses raw hook input/output)
  b) Workflow-config persistence (lines 301-317) — replace with factory call

Replace lines 301-317 with:

```typescript
      await createToolAfterWorkflow({})(input, _output)
```

The new `tool.execute.after` handler becomes:

```typescript
    "tool.execute.after": async (
      input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> },
      _output?: { metadata?: unknown; [key: string]: unknown } | string,
    ): Promise<void> => {
      const fact = await createToolExecuteAfterHook({
        toolGuardAfterHook: toolGuardHooks["tool.execute.after"],
        summarizeOutput: summarizePluginToolOutput,
      })(input, _output)
      void fact
      try {
        await sessionTracker.handleToolExecuteAfter(
          input as Parameters<typeof sessionTracker.handleToolExecuteAfter>[0],
          (_output ?? {}) as Parameters<typeof sessionTracker.handleToolExecuteAfter>[1],
        )
      } catch { /* best-effort */ }

      await createToolAfterWorkflow({})(input, _output)
    },
```

**STEP 5 — Verify the tool registration map is preserved (AC-22):**

The `tool: { ... }` block (lines 255-278) with 27 entries MUST remain unchanged. Do NOT move, rename, or restructure any tool registration. Verify with grep: `grep "createDelegateTaskTool\|createDelegationStatusTool\|createRunBackgroundCommandTool" src/plugin.ts` returns matches.

**STEP 6 — Verify zero inline closures remain (AC-21):**

After refactoring, the only closures in plugin.ts should be:
  - The HarnessControlPlane outer function (required by Plugin type)
  - The `tool.execute.after` handler (keeps session-tracker capture inline per D-01)
  - Void `.then()/.catch()` callbacks for fire-and-forget init (lines 103-114)

No `async ({ event })`, `async (input, output)` closures defining business logic should remain. The tool.execute.after closure is acceptable as it orchestrates multiple factory calls inline.

**STEP 7 — Run full verification suite:**

```bash
npm run typecheck       # AC-24
npm test                # AC-25
npx vitest run tests/features/session-tracker/  # AC-26
wc -l src/plugin.ts     # AC-23 (target ≤ 250)
test -d src/plugin      # AC-29 (must NOT exist)
```

**CRITICAL CONSTRAINTS:**
  - Do NOT extract the tool registration map — it IS composition (AP-01, AC-22)
  - Do NOT create `src/plugin/` directory (AP-02, AC-29)
  - Do NOT change runtime behavior — only move code between files (AP-03)
  - Do NOT rename or restructure existing modules (AP-04)
  - Do NOT reorder the eventObservers array — preserve: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact]
  - Preserve `.bind(delegationManager)` on delegation callbacks (they reference `this`)
  </action>
  <verify>
    <automated>npm run typecheck && echo "AC-24 PASS" && npx vitest run tests/features/session-tracker/ --reporter=verbose 2>&1 | tail -5 && echo "AC-26 CHECK" && wc -l src/plugin.ts && echo "AC-23 CHECK (target ≤ 250)" && grep "event-tracker\|EventTracker" src/plugin.ts && echo "RESIDUAL EVENT-TRACKER FOUND!" || echo "EVENT-TRACKER CLEAN" && grep -c "createDelegateTaskTool\|createDelegationStatusTool\|createRunBackgroundCommandTool" src/plugin.ts && echo "AC-22 TOOL COUNT CHECK (expect 27 tool entries)"</automated>
  </verify>
  <done>
    - src/plugin.ts — all 7 inline closures replaced by factory imports (AC-21)
    - src/plugin.ts — tool registration map preserved with 27 entries (AC-22)
    - src/plugin.ts — LOC ≤ 250 (AC-23, D-01 flexible target)
    - npm run typecheck passes (AC-24, AC-28 — no circular imports)
    - npm test passes — all remaining tests green (AC-25)
    - All 276 session-tracker tests pass (AC-26)
    - Zero new dependencies (AC-27)
    - src/plugin/ directory does NOT exist (AC-29)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

This phase is purely extractive refactoring. No new attack surfaces. Existing plugin.ts boundaries are preserved: factory injection pattern, try/catch error isolation, best-effort fire-and-forget semantics.

| Boundary | Description |
|----------|-------------|
| plugin.ts → hook modules | Factory functions receive typed dependencies (D-I). No untrusted input crosses this boundary. |
| hook modules → session-tracker | Existing session-tracker APIs — unchanged behavior. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-03-04 | Denial of Service | Extracted hook modules | mitigate | All extracted callbacks preserve existing try/catch patterns. No extracted module can throw to plugin.ts — all errors are caught and logged. |
| T-CP-ST-03-05 | Tampering | Dependency injection in factories | mitigate | TypeScript strict mode enforces type safety on factory parameters. `import type` for type-only imports prevents runtime overhead. Circular imports detected by `npm run typecheck` (AC-28). |
| T-CP-ST-03-06 | Elevation of Privilege | tool-before-guard.ts | mitigate | Tool guard runs FIRST (preserves execution order). Session-tracker detection cannot bypass the guard. Guard errors propagate to runtime (same behavior as original inline code). |
| T-CP-ST-03-07 | Information Disclosure | chat-message-capture.ts | accept | No PII handling changes. The module delegates to sessionTracker.handleChatMessage which has existing security controls. Extraction does not change data flow. |
</threat_model>

<verification>
**Pre-execute gate:** Plan 01 must be COMPLETE (event-tracker fully excised). All 7 extraction targets mapped to current plugin.ts line ranges.

**Post-execute verification sequence:**
```bash
# 1. TypeScript compilation
npm run typecheck

# 2. Structural checks
ls src/hooks/observers/session-entry-consumer.ts \
   src/hooks/observers/session-main-consumer.ts \
   src/hooks/observers/delegation-consumer.ts \
   src/hooks/observers/session-tracker-consumer.ts \
   src/hooks/transforms/tool-before-guard.ts \
   src/hooks/transforms/chat-message-capture.ts \
   src/hooks/transforms/tool-after-workflow.ts

# 3. New unit tests
npx vitest run tests/hooks/observers/ tests/hooks/transforms/

# 4. plugin.ts integrity
wc -l src/plugin.ts                    # ≤ 250 (AC-23)
grep "tool:" src/plugin.ts | head -1   # Tool map preserved (AC-22)
test -d src/plugin && echo "FAIL" || echo "PASS"  # AC-29

# 5. Full suite
npm test                               # AC-25
npx vitest run tests/features/session-tracker/  # AC-26 (276 tests)
```

**Known pre-existing failures (not CP-ST-03 regressions):**
- 2 README heading assertion tests (pre-existing, documented in ROADMAP.md)
- Any failures in `tests/plugins/plugin-lifecycle.test.ts` after event-tracker test deletion in Plan 01 should be resolved in Plan 01
</verification>

<success_criteria>
- [ ] 7 new hook module files exist (AC-14 through AC-20)
- [ ] 7 unit test files exist with all tests passing
- [ ] src/plugin.ts has zero inline callback closures (AC-21)
- [ ] src/plugin.ts tool registration map preserved — 27 entries (AC-22)
- [ ] src/plugin.ts LOC ≤ 250 (AC-23, D-01 flexible target)
- [ ] npm run typecheck passes (AC-24, AC-28)
- [ ] npm test passes — all remaining tests green (AC-25)
- [ ] All 276 session-tracker tests pass (AC-26)
- [ ] Zero new dependencies added (AC-27)
- [ ] No circular imports (AC-28)
- [ ] src/plugin/ directory does NOT exist (AC-29)
- [ ] All 8 structural rules enforced (SR-01 through SR-08)
- [ ] Zero anti-pattern violations (AP-01 through AP-06)
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-02-SUMMARY.md`
</output>

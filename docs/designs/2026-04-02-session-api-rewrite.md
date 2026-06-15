# Session API Module Rewrite — Design & Requirements Correction

**Date:** 2026-04-02
**Module:** `src/lib/session-api.ts`
**Scope:** Rewrite SDK adapter layer + fix invalid architecture facts in requirements doc

---

## Part 1: Validated Platform Facts

All facts below verified against actual source code in `node_modules/@opencode-ai/sdk/` and `node_modules/@opencode-ai/plugin/`.

### 1.1 Plugin Context (verified from `@opencode-ai/plugin` type declarations)

```typescript
// node_modules/@opencode-ai/plugin/dist/index.d.ts
type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>  // typed SDK client
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>
```

**What's real:** The `client` IS the typed `ReturnType<typeof createOpencodeClient>` — not `any`. The SDK exports real types: `Session`, `Message`, `Part`, `Event`.

**What our code gets wrong:** We declare `client: any` everywhere. We could import `import type { Session, Message, Part, Event } from "@opencode-ai/sdk"`.

### 1.2 SDK Session API (verified from `@opencode-ai/sdk/dist/gen/types.gen.d.ts`)

**Session.create**
```typescript
// POST /session
client.session.create({
  body?: { parentID?: string; title?: string }
  query?: { directory?: string }
})
// Response: { 200: Session }
```

**Session.abort**
```typescript
// POST /session/{id}/abort
client.session.abort({
  path: { id: string }  // path.id, NOT body
  query?: { directory?: string }
})
// Response: { 200: boolean }
```

**Session.messages**
```typescript
// GET /session/{id}/message
client.session.messages({
  path: { id: string }
  query?: { directory?: string; limit?: number }
})
// Response: { 200: Array<{ info: Message, parts: Array<Part> }> }
```

**Session.prompt (sync)**
```typescript
// POST /session/{id}/message
client.session.prompt({
  path: { id: string }
  body: {
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
    agent?: string
    model?: { providerID: string; modelID: string }
    system?: string
    tools?: { [key: string]: boolean }
    messageID?: string
    noReply?: boolean
  }
  query?: { directory?: string }
})
// Response: { 200: { info: AssistantMessage, parts: Array<Part> } }
```

**Session.promptAsync (fire-and-forget)**
```typescript
// POST /session/{id}/prompt_async
client.session.promptAsync({
  path: { id: string }
  body: { /* same as prompt */ }
  query?: { directory?: string }
})
// Response: { 204: void }  — HTTP 204, no body
```

**Session.children**
```typescript
// GET /session/{id}/children
client.session.children({
  path: { id: string }
  query?: { directory?: string }
})
// Response: { 200: Array<Session> }
```

**Session.get**
```typescript
// GET /session/{id}
client.session.get({
  path: { id: string }
  query?: { directory?: string }
})
// Response: { 200: Session }
```

### 1.3 Session Object (verified from `@opencode-ai/sdk/dist/gen/types.gen.d.ts`)

```typescript
type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
  share?: { url: string }
  revert?: { messageID: string; partID?: string; snapshot?: string; diff?: string }
  summary?: { additions: number; deletions: number; files: number; diffs?: FileDiff[] }
}
```

**What's real:** `Session` has NO `status` field. Session status is a separate API (`/session/status`).

**What our code gets wrong:** Our code looks for `session.status`, `session.info.status`, `session.state`, `session.info.state` — none of these exist on the `Session` type. Status comes from a separate `session.status()` API or from SSE events.

### 1.4 Event System (verified from SDK source + e2e tests)

**Real API:**
```typescript
// Method 1: SDK async iterable (preferred)
const events = await client.global.event({ signal: abortSignal })
for await (const event of events.stream) {
  // event is the Event union type
}
```

**Real SSE result type:**
```typescript
type ServerSentEventsResult<TData> = {
  stream: AsyncGenerator<TData, void, unknown>
}
```

**What our code gets wrong:**
- We use `client.event.subscribe(handler)` — this API doesn't exist
- We use a callback pattern — the real SDK returns an async iterable
- We check `event.properties.sessionID` for session events — but `session.created`, `session.updated`, `session.deleted` use `event.properties.info` (the Session object), NOT `sessionID`
- Only `session.status`, `session.idle`, `session.error`, `session.compacted` use `event.properties.sessionID`

### 1.5 Session Events (verified from type definitions)

| Event Type | Properties Shape |
|------------|-----------------|
| `session.created` | `{ info: Session }` |
| `session.updated` | `{ info: Session }` |
| `session.deleted` | `{ info: Session }` |
| `session.idle` | `{ sessionID: string }` — **this is the completion signal** |
| `session.status` | `{ sessionID: string; status: SessionStatus }` |
| `session.error` | `{ sessionID: string; error: string }` |
| `session.compacted` | `{ sessionID: string }` |
| `session.diff` | `{ sessionID: string; diff: FileDiff[] }` |
| `message.part.updated` | `{ part: Part; delta?: string }` |
| `permission.asked` | `{ id: string; sessionID: string; tool: string; ... }` |

### 1.6 Plugin Hooks (verified from `@opencode-ai/plugin/dist/index.d.ts`)

**tool.execute.before**
```typescript
"tool.execute.before"?: (input: {
  tool: string
  sessionID: string
  callID: string
}, output: {
  args: any
}) => Promise<void>
```

**NOT** `(input, output)` where `input` has `args` — the `args` are on `output`, not `input`.

**What our code gets wrong:** In `plugin.ts`, we access `getNestedValue(output, ["args"])` to get args — that's correct. But we also access `asString(getNestedValue(input, ["tool"]))` and `asString(getNestedValue(input, ["sessionID"]))` — that's also correct. But the hook signature in our comments and the way we handle it is fragile.

**event hook**
```typescript
"event"?: (input: { event: Event }) => Promise<void>
```

The event object is the full typed union — `Event` from `@opencode-ai/sdk`.

**chat.params**
```typescript
"chat.params"?: (input: {
  sessionID: string
  agent: string
  model: Model
  provider: ProviderContext
  message: UserMessage
}, output: {
  temperature: number
  topP: number
  topK: number
  options: Record<string, any>
}) => Promise<void>
```

**What our code gets wrong:** We only handle `temperature` and `model` from the output. We ignore `topP`, `topK`, `options`.

**experimental.session.compacting**
```typescript
"experimental.session.compacting"?: (input: {
  sessionID: string
}, output: {
  context: string[]
  prompt?: string
}) => Promise<void>
```

**What our code gets wrong:** Our 112-line compaction handler builds context correctly, but doesn't leverage `output.prompt` for more structured output.

### 1.7 Client vs Server Architecture

1. `createOpencode()` starts `opencode serve` as a subprocess on `localhost:4096`, then creates `createOpencodeClient({ baseUrl: "http://127.0.0.1:4096" })`
2. The client is an HTTP REST client — all methods make HTTP calls to the server
3. Events are Server-Sent Events (SSE) via `GET /event` endpoint
4. The plugin runs inside the OpenCode server process — the `client` passed to the plugin is a server-internal reference, NOT an HTTP client to itself
5. `client.global.event()` opens an SSE connection to the `/event` endpoint — this is for remote consumers (CLI, TUI), not for plugins running inside the server

**Critical insight for plugins:** When a plugin receives events via the `event` hook, it's being called by the server directly — it doesn't need to subscribe to SSE. The plugin hook IS the event handler.

**This means:** For plugin-internal event handling (tracking child session lifecycle), we should rely on the `event` hook, NOT on `client.global.event()`. SSE subscription is for external consumers like the CLI `opencode run --session <id>` mode.

---

## Part 2: What's Wrong With Current session-api.ts

### 2.1 Multi-Path Fallback (100% fabricated)

Every function tries 4-5 different call signatures:

```typescript
export async function getSessionByAnyPath(client: any, sessionID: string): Promise<any> {
  const attempts = [
    () => client.session.get({ path: { sessionID } }),     // WRONG: should be { id }
    () => client.session.get({ path: { id: sessionID } }),  // correct
    () => client.session.get({ sessionID }),                // wrong: no such API
    () => client.session.get({ id: sessionID }),            // wrong: no such API
  ]
  // ...
}
```

Only 1 of 4 paths is correct. The other 3 are dead code. The correct path is `{ path: { id: sessionID } }`.

### 2.2 SSE Implementation (wrong API entirely)

```typescript
// Current code — WRONG
export async function waitForSessionCompletionViaSSE(client: any, sessionID: string, timeoutMs: number) {
  return new Promise((resolve, reject) => {
    const subscription = client?.event?.subscribe?.((event: any) => {
      // callback pattern — WRONG
    })
  })
}
```

**Problems:**
1. `client.event.subscribe` doesn't exist — it's `client.global.event()`
2. The real API returns `{ stream: AsyncGenerator }`, not a callback subscription
3. For plugins, we should use the `event` hook, not SSE

### 2.3 Session Status Detection (looking for fields that don't exist)

```typescript
// Current code — WRONG
function normalizeSessionStatus(entry: unknown): SessionStatus | undefined {
  const type =
    asString(getNestedValue(entry, ["type"])) ??
    asString(getNestedValue(entry, ["status"])) ??
    asString(getNestedValue(entry, ["state"]))
  // ...
}
```

The `Session` type has NO `status`, `state`, or `type` field. Session status comes from:
1. The `session.status` API: `client.session.status()` → `{ [sessionID]: SessionStatus }`
2. The `session.idle` event (terminal state)
3. The `session.error` event (error state)

### 2.4 Status Polling (wrong API pattern)

```typescript
// Current code — calls getStatusMap which calls client.session.status()
// This is partially correct but uses wrong function signature
```

### 2.5 Type Safety (all `any`)

Every function takes `client: any` and returns `any`. The real SDK exports `Session`, `Message`, `Part`, `Event` types.

---

## Part 3: Design — Superior session-api.ts Rewrite

### Design Principles

1. **Single canonical call shape per SDK method** — no fallback paths
2. **Typed with real SDK types** — `Session`, `Message`, `Part`, `Event`
3. **Event-driven completion via plugin hooks** — not SSE subscription (plugins don't need it)
4. **Two-mode delegation** — sync (prompt) and async (promptAsync + event tracking)
5. **Testable with dependency injection** — not module singletons

### 3.1 API Design

```typescript
// === TYPES ===
import type {
  Session,
  Message,
  Part,
  Event,
  EventSessionIdle,
  EventSessionError,
  EventSessionStatus,
} from "@opencode-ai/sdk"
import type { createOpencodeClient } from "@opencode-ai/sdk"

type OpenCodeClient = ReturnType<typeof createOpencodeClient>

// === SESSION OPERATIONS (typed, single canonical shape) ===

function createSession(
  client: OpenCodeClient,
  opts: { parentID?: string; title?: string; directory?: string }
): Promise<Session>

function getSession(
  client: OpenCodeClient,
  sessionID: string
): Promise<Session>

function abortSession(
  client: OpenCodeClient,
  sessionID: string
): Promise<boolean>

function getSessionMessages(
  client: OpenCodeClient,
  sessionID: string,
  opts?: { limit?: number }
): Promise<Array<{ info: Message; parts: Part[] }>>

function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: {
    parts: Array<...>
    agent?: string
    model?: { providerID: string; modelID: string }
    system?: string
    tools?: { [key: string]: boolean }
  }
): Promise<{ info: AssistantMessage; parts: Part[] }>

function sendPromptAsync(
  client: OpenCodeClient,
  sessionID: string,
  body: { /* same as sendPrompt */ }
): Promise<void>  // returns void — 204 No Content

// === COMPLETION DETECTION (event-driven, not polling) ===

type CompletionResult = {
  signal: "idle" | "error" | "deleted" | "timeout"
  sessionID: string
  error?: string
}

function waitForSessionCompletion(
  sessionID: string,
  timeoutMs: number
): CompletionResult

// This is a STATE MACHINE that gets fed events from the plugin's event hook.
// It does NOT call the SDK directly. The plugin routes events to it.

// === PARENT CHAIN (real API) ===

function walkParentChain(
  client: OpenCodeClient,
  sessionID: string
): Promise<Session[]>
```

### 3.2 Completion Detection — The Key Difference

**Current approach (broken):** Poll the SDK in a while loop, calling `session.messages()` and `session.status()` repeatedly.

**Superior approach:** The harness plugin's `event` hook already receives ALL session events. Create a lightweight session tracker that:
1. Gets fed events from the `event` hook
2. Tracks completion state per session ID
3. Resolves promises when `session.idle` or `session.error` fires

```typescript
// session-completion-tracker.ts
class SessionCompletionTracker {
  private watchers = new Map<string, {
    resolve: (result: CompletionResult) => void
    timeoutId: ReturnType<typeof setTimeout>
  }>()

  feed(event: Event): void {
    if (event.type === "session.idle") {
      const sessionID = event.properties.sessionID
      const watcher = this.watchers.get(sessionID)
      if (watcher) {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "idle", sessionID })
        this.watchers.delete(sessionID)
      }
    }

    if (event.type === "session.error") {
      const sessionID = event.properties.sessionID
      const watcher = this.watchers.get(sessionID)
      if (watcher) {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({
          signal: "error",
          sessionID,
          error: event.properties.error
        })
        this.watchers.delete(sessionID)
      }
    }

    if (event.type === "session.deleted") {
      const sessionID = event.properties.info.id
      const watcher = this.watchers.get(sessionID)
      if (watcher) {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "deleted", sessionID })
        this.watchers.delete(sessionID)
      }
    }
  }

  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ signal: "timeout", sessionID })
        this.watchers.delete(sessionID)
      }, timeoutMs)

      this.watchers.set(sessionID, { resolve, timeoutId })
    })
  }

  cancel(sessionID: string): void {
    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      this.watchers.delete(sessionID)
    }
  }
}
```

**Why this is superior:**
- Zero polling — events arrive at plugin hooks in real-time
- No SDK calls during wait — just event routing
- Timeout handling built in
- Cancellation support
- Testable: just call `tracker.feed(event)` with mock events

### 3.3 Integration With Plugin

The plugin wires the tracker to the event hook:

```typescript
const completionTracker = new SessionCompletionTracker()

export const HarnessControlPlane: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      completionTracker.feed(event)
      // ... existing event handling
    },

    tool: {
      "delegate-task": tool({
        // ...
        async execute(args, context) {
          // Create child session
          const child = await createSession(client, {
            parentID: context.sessionID,
            title: `${args.agent}: ${args.description}`,
          })

          // Send prompt
          await sendPromptAsync(client, child.id, {
            parts: [{ type: "text", text: promptText }],
            agent: route.effectiveAgent,
            tools: toolCompatibility,
          })

          if (runInBackground) {
            return JSON.stringify({ session_id: child.id, mode: "async" })
          }

          // Sync: wait for completion via event tracker
          const result = await completionTracker.watch(child.id, timeoutMs)

          if (result.signal === "idle") {
            const messages = await getSessionMessages(client, child.id, { limit: 1 })
            return extractAssistantText(messages)
          }

          throw new Error(`Session ${child.id} completed with ${result.signal}: ${result.error ?? "unknown"}`)
        },
      }),
    },
  }
}
```

### 3.4 Why This Is Superior

| Aspect | Current Code | New Design |
|--------|-------------|-----------|
| SDK calls | 4-5 paths per function, 3 are wrong | 1 canonical path per function, verified against types |
| Type safety | `client: any`, returns `any` | `OpenCodeClient`, typed returns |
| Completion detection | Polling in while loop, calls SDK repeatedly | Event-driven, zero polling, routes through plugin hook |
| SSE handling | Wrong API (`client.event.subscribe`) | Not needed for plugins — uses plugin `event` hook instead |
| Testability | Module-level singletons | `SessionCompletionTracker` is a class, injectable |
| Error handling | `undefined` returns on catch | Typed `CompletionResult` with discriminated union |
| Lines of code | 473 LOC of fabricated complexity | ~200 LOC of real SDK integration |

### 3.5 Migration Plan

1. **Delete** multi-path fallback functions (`getSessionByAnyPath`, `createSessionByAnyPath`, etc.)
2. **Delete** SSE functions (`waitForSessionCompletionViaSSE`, `waitForSessionCompletionWithFallback`)
3. **Delete** status polling functions (`getStatusMap`, `getDirectSessionStatus`, `normalizeSessionStatus`)
4. **Delete** all `any`-typed wrappers
5. **Create** typed functions using real SDK shapes
6. **Create** `SessionCompletionTracker` for event-driven completion
7. **Update** `plugin.ts` to wire tracker to `event` hook
8. **Update** `lifecycle-manager.ts` to use typed functions
9. **Write** real tests that verify SDK call shapes against typed contracts

---

## Part 4: Requirements Doc Corrections

The following requirements contain invalid architecture facts that must be corrected:

| ID | Current Text | Problem | Correction |
|----|-------------|---------|-----------|
| MOD-007 | "client.event.subscribe()" | SDK API is `client.global.event()`, not `client.event.subscribe()` | Change to "OpenCode SDK client with typed Session, Message, Part, Event types from @opencode-ai/sdk" |
| LIF-006 | "SSE events from client.event.subscribe()" | For plugins, use `event` hook, not SSE subscription | Change to "The system SHALL detect async session completion via the plugin's `event` hook routing `session.idle` and `session.error` events to a completion tracker. Polling via session status API SHALL be used as degraded-mode fallback only" |
| EVT-001 | "client.event.subscribe() which returns an SSE stream" | Plugins receive events via hook, not SSE | Change to "The system SHALL process platform session events via the plugin's `event` hook. The hook receives typed `Event` objects directly from the server runtime" |
| EVT-004 | "hydrate delegation state and infer continuity status" | Missing: events carry `event.properties.info` for session events, not just `event.type` | Add: "Session lifecycle events (`session.created`, `session.updated`, `session.deleted`) carry `event.properties.info: Session`. Status events (`session.idle`, `session.error`, `session.status`) carry `event.properties.sessionID`" |
| BGT-003 | "client.event.subscribe()" | Same as LIF-006 | Change to "The background task manager SHALL receive session events via the plugin's `event` hook and route `session.idle`/`session.error` events to the appropriate completion watchers" |
| PERM-008 | "tool context receives `{ agent, sessionID, messageID, directory, worktree }`" | Missing `abort: AbortSignal`, `metadata()`, `ask()` | Add: "Tool context also receives `abort: AbortSignal` for cancellation, `metadata()` for tool title/metadata injection, and `ask()` for permission escalation" |
| ARCH-002 | "receiving `{ project, directory, worktree, client, $ }`" | Missing `serverUrl: URL` | Add `serverUrl: URL` to the plugin input shape |

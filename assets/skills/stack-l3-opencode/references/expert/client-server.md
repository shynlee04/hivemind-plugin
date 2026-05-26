# Expert: Client-Server Protocol Internals

> OpenCode SDK v1.14.44 | Source: `packages/sdk/js/src/`
> Classification: BEYOND-DOCS — not in official documentation

## Mental Model: Architecture

```
┌─────────────┐     HTTP/SSE      ┌──────────────┐
│  SDK Client  │ ←──────────────→ │  Go Server    │
│  (TypeScript)│                   │  (port 4096)  │
└─────────────┘                   └──────┬───────┘
       ↑                                  ↑
       │                                  │
  Plugin receives                      Go runtime
  hooks + tools                        handles:
                                       - LLM API calls
                                       - Tool schema → JSON Schema
                                       - Session state machine
                                       - Permission resolution
                                       - Event dispatch
```

---

## CP-1: Two Client Types — Different Initialization

### `createOpencode()` — Full Stack (Server + Client)

Starts a Go server process AND connects a TypeScript client. Used by the TUI. The server listens on port 4096 (configurable).

### `createOpencodeClient()` — Client Only

Connects to an already-running server. Used by plugins, tests, and external tools.

```typescript
// Full stack (starts server)
const opencode = await createOpencode({ cwd: "/project" })

// Client only (connects to running server)
const client = createOpencodeClient({ serverUrl: "http://localhost:4096" })
```

**Key difference:** `createOpencode()` manages the server lifecycle. `createOpencodeClient()` just makes HTTP calls.

---

## CP-2: SSE is the Primary Event Bus

The server dispatches events via Server-Sent Events at `/event` (per-session) or `/global/event` (cross-session):

```
GET /event?sessionID=abc123
→ SSE stream:
  data: {"type":"message.updated","properties":{...}}
  data: {"type":"tool.state","properties":{...}}
  data: {"type":"session.idle","properties":{...}}
```

**Connection management:** The SDK auto-reconnects on connection drop. Events queued during disconnection may be lost (SSE is not guaranteed-delivery).

**For harness integration:** Subscribe to `/event` with sessionID for delegation tracking. Use `/global/event` for cross-session monitoring.

---

## CP-3: Session Status — 3 States, No Terminal "Completed"

```typescript
type SessionStatus = "idle" | "busy" | "retry"
```

**There is no "completed" state.** Sessions are long-lived containers. They persist until explicitly deleted.

| State | Meaning | What you can do |
|-------|---------|-----------------|
| `idle` | LLM is waiting for input | Send messages, read state |
| `busy` | LLM is generating response | Wait, abort, or read partial output |
| `retry` | LLM response failed, retrying | Wait for retry to succeed or fail |

**Implication for delegation:** A "completed" delegation is not a session state — it's a tool result. Track delegation completion via tool output and event hooks, not session status.

---

## CP-4: prompt_async — Fire-and-Forget Message Injection

```
POST /session/{id}/prompt_async
Body: { parts: Part[] }
```

Sends a user message without waiting for the LLM response. Returns immediately with `messageID`. Use this for programmatic message injection (e.g., delegation dispatch).

**vs. `prompt` endpoint:** The synchronous `prompt` waits for full LLM response. Use `prompt_async` when you don't need to block.

---

## CP-5: Part-Level Mutations for Live Streaming

```
PATCH /session/{id}/message/{messageID}/part/{partID}
Body: { text?: string, metadata?: {...} }
```

Enables live updates to tool output during execution. This is how the TUI shows real-time streaming tool results.

**For long-running tools:** Call part mutations to show progress without completing the tool:

```typescript
async execute(args, context) {
  // Update part mid-execution to show progress
  context.metadata({ title: `Processing ${args.items.length} items...` })

  for (let i = 0; i < args.items.length; i++) {
    await process(args.items[i])
    context.metadata({ title: `Processed ${i+1}/${args.items.length}` })
  }

  return "All items processed"
}
```

---

## CP-6: x-opencode-directory Header — Multi-Project Routing

All SDK requests include the `x-opencode-directory` header, which the request interceptor converts to query parameters:

```typescript
// Request interceptor adds this to every call
headers: { "x-opencode-directory": "/path/to/project" }
```

**Implication:** When writing plugin code that makes API calls, ensure you pass the correct `directory` from `PluginInput.directory`. The SDK client handles this automatically for most operations, but direct HTTP calls need the header.

---

## CP-7: Structured Output — No SDK-Side Validation

When the LLM returns structured output (JSON), the **Go server** handles parsing and validation — not the SDK client. The SDK just receives the parsed result.

**Error path:** If LLM output doesn't match the expected schema, the Go server retries (up to configured retry count). If all retries fail, the tool call returns a `ToolStateError`.

**Implication:** You can't add custom structured output validation at the SDK layer. Validate inside `execute()` if you need additional checks.

---

## CP-8: v2 SDK Adds Workspace Isolation + Session Restore

The v2 SDK (`packages/sdk/js/src/v2/`) adds endpoints not in v1:

| Feature | v1 | v2 |
|---------|----|----|
| Session CRUD | ✅ | ✅ |
| Message parts | ✅ | ✅ |
| SSE events | ✅ | ✅ (plus SyncEvent*) |
| Workspace isolation | ❌ | ✅ |
| Session restore | ❌ | ✅ |
| Sync endpoints | ❌ | ✅ |
| Worktree management | ❌ | ✅ |
| Question ask/reply | ❌ | ✅ |

**For harness features:** Use v2 client (`createOpencodeClient` with v2 types) for delegation, workspace isolation, and session recovery.

---

## CP-9: Key HTTP Endpoints (Unofficial)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/session` | POST | Create session |
| `/session/{id}` | GET | Get session with messages |
| `/session/{id}` | DELETE | Delete session |
| `/session/{id}/abort` | POST | Abort in-progress generation |
| `/session/{id}/prompt` | POST | Send message (sync) |
| `/session/{id}/prompt_async` | POST | Send message (fire-and-forget) |
| `/session/{id}/share` | POST | Generate share link |
| `/session/{id}/event` | GET (SSE) | Event stream |
| `/session/{id}/message/{mid}/part/{pid}` | PATCH | Update part |
| `/event` | GET (SSE) | Global event stream |
| `/global/event` | GET (SSE) | Cross-session events |

**Note:** These endpoints are from the SDK source. They may change between versions. Always use SDK methods rather than direct HTTP calls when possible.

---

## Cross-Stack References

- **For hook composition:** → `references/expert/hook-composition.md`
- **For tool internals:** → `references/expert/tool-internals.md`
- **For testing with SDK client mocks:** → `../../stack-vitest/` (SDK mocking patterns)
- **For Next.js sidecar integration:** → `../../stack-nextjs/` (sidecar reads .hivemind/ state)
- **For gate-evidence validation:** → `../../gate-evidence-truth/` (L1 runtime evidence from SSE)

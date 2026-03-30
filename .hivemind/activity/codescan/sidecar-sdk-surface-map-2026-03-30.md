# OpenCode SDK Surface Analysis: Side-Car UI Harness Feasibility

**Investigation Date:** 2026-03-30  
**Scope:** All SDK surfaces relevant to building an external Next.js UI harness  
**Source:** `.sdk-lib/opencode/*.md` + `repomix-opencode.xml`  

---

## Executive Summary

The OpenCode SDK exposes **two distinct runtime contexts** that must not be conflated:

| Context | How You Connect | What You Get |
|---------|-----------------|-------------|
| **External Client** | `createOpencodeClient({ baseUrl })` → HTTP/REST | Session management, file ops, TUI control, SSE events |
| **In-Process Plugin** | `.opencode/plugins/*.ts` loaded by OpenCode | Hook interception, custom tools, system prompt injection |

A **side-car UI harness** (external Next.js app) operates exclusively in the **External Client** context. It **cannot** use plugin hooks because those only fire inside OpenCode's process. This is the central architectural constraint.

---

## Part I: SDK Surfaces the Side-Car CAN Use

### 1. HTTP/REST API (`opencode-server.md` lines 1–162)

OpenCode runs an HTTP server (default `127.0.0.1:4096`) with an OpenAPI 3.1 spec at `http://<host>:<port>/doc`.

#### Connection

```typescript
// Side-car imports the SDK client
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",  // Connect to running OpenCode instance
})
```

**Evidence:** `opencode-sdk.md` lines 48–62, `opencode-server.md` lines 52–159

#### Session Management

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| `client.session.list()` | `GET /session` | List all sessions |
| `client.session.get({ path: { id } })` | `GET /session/:id` | Get session details |
| `client.session.create({ body })` | `POST /session` | Create new session |
| `client.session.delete({ path: { id } })` | `DELETE /session/:id` | Delete session |
| `client.session.update({ path, body })` | `PATCH /session/:id` | Update session title |
| `client.session.prompt({ path, body })` | `POST /session/:id/message` | Send prompt, get AI response |
| `client.session.messages({ path })` | `GET /session/:id/message` | List messages in session |
| `client.session.command({ path, body })` | `POST /session/:id/command` | Execute slash command |
| `client.session.shell({ path, body })` | `POST /session/:id/shell` | Run shell command |
| `client.session.abort({ path })` | `POST /session/:id/abort` | Abort running session |
| `client.session.share({ path })` | `POST /session/:id/share` | Share session |
| `client.session.summarize({ path, body })` | `POST /session/:id/summarize` | Summarize session |

**Evidence:** `opencode-sdk.md` lines 188–233, `opencode-server.md` lines 79–107

#### Real-Time Events via SSE

```typescript
// Subscribe to real-time events
const events = await client.event.subscribe()
for await (const event of events.stream) {
  console.log("Event:", event.type, event.properties)
}
```

**Endpoint:** `GET /event` — Server-Sent Events stream. First event is `server.connected`, then bus events.

**Evidence:** `opencode-sdk.md` lines 295–303, `opencode-server.md` line 159

Available event types (from plugin hooks but observable via SSE if broadcast):
- `session.created`, `session.updated`, `session.deleted`, `session.error`, `session.idle`, `session.status`
- `message.updated`, `message.part.updated`
- `tool.execute.after`, `tool.execute.before`
- `permission.asked`, `permission.replied`
- `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`

**Note:** Not all event types are guaranteed to be broadcast to external SSE subscribers — this depends on whether OpenCode's internal event bus forwards them externally.

#### TUI Control (Limited)

| Method | What It Does |
|--------|--------------|
| `client.tui.appendPrompt({ body: { text } })` | Append text to the prompt |
| `client.tui.showToast({ body: { message, variant } })` | Show toast notification |
| `client.tui.submitPrompt()` | Submit current prompt |
| `client.tui.clearPrompt()` | Clear the prompt |
| `client.tui.openHelp()` | Open help dialog |
| `client.tui.openSessions()` | Open session selector |
| `client.tui.openThemes()` | Open theme selector |
| `client.tui.openModels()` | Open model selector |
| `client.tui.executeCommand({ body: { command } })` | Execute a command |

**Evidence:** `opencode-sdk.md` lines 265–285, `opencode-server.md` lines 141–153

#### File Operations

| Method | What It Does |
|--------|--------------|
| `client.file.read({ query: { path } })` | Read a file |
| `client.find.text({ query: { pattern } })` | Search text in files |
| `client.find.files({ query: { query, type } })` | Find files by name |
| `client.file.status()` | Get status for tracked files |

**Evidence:** `opencode-sdk.md` lines 235–263

#### Project & Config

| Method | What It Does |
|--------|--------------|
| `client.project.list()` | List all projects |
| `client.project.current()` | Get current project |
| `client.config.get()` | Get config info |
| `client.config.providers()` | List providers and default models |

**Evidence:** `opencode-sdk.md` lines 161–186

#### App Logging

```typescript
client.app.log({
  body: {
    service: "my-app",
    level: "info",
    message: "Operation completed",
  },
})
```

**Evidence:** `opencode-sdk.md` lines 146–156

#### Structured Output

```typescript
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "Research Anthropic" }],
    format: {
      type: "json_schema",
      schema: { type: "object", properties: { company: { type: "string" } }, required: ["company"] },
    },
  },
})
```

**Evidence:** `opencode-sdk.md` lines 79–134

---

## Part II: SDK Surfaces the Side-Car CANNOT Use

### 1. Plugin Hooks — NOT Accessible

Plugin hooks only fire inside OpenCode's process when loaded as `.opencode/plugins/*.ts`. An external side-car **cannot** register plugin hooks because:

1. The plugin file must be loaded by OpenCode at startup
2. The hook functions execute synchronously inside OpenCode's event loop
3. There is no external bridge to receive hook invocations

**Evidence:** `opencode-plugins.md` lines 46–100

#### Hooks That Are Plugin-Only (NOT accessible to side-car):

| Hook | Purpose | Why Inaccessible |
|------|---------|------------------|
| `tool.execute.before` | Intercept/modify tool args before execution | Fires inside OpenCode process |
| `tool.execute.after` | Observe tool results | Fires inside OpenCode process |
| `chat.message` | Intercept message sending | Fires inside OpenCode process |
| `experimental.chat.system.transform` | Inject/modify system prompt | Plugin-only hook at `opencode-plugins.md` line 247–293 |
| `experimental.chat.messages.transform` | Transform message history | Plugin-only hook at `opencode-plugins.md` lines 248–265 |
| `session.compacted` | Customize context compaction | Plugin-only hook |
| `session.diff` | Observe file changes | Fires inside OpenCode process |
| `permission.asked`, `permission.replied` | Observe permission requests | Fires inside OpenCode process |
| `shell.env` | Inject environment variables | Fires inside OpenCode process |
| `event` (wildcard) | Catch all events | Plugin-only event bus |

**Evidence:** `opencode-plugins.md` lines 102–145, `opencode-sdk.md` lines 295–303

### 2. `system.transform` Hook — NOT Accessible

The `experimental.chat.system.transform` hook allows plugins to modify the system prompt before it's sent to the LLM. This is **entirely internal** to OpenCode's plugin system.

**What it does:**
```typescript
// In a plugin (NOT accessible externally)
"experimental.chat.system.transform": async (input, output) => {
  output.system.push("## Custom context from side-car")
}
```

**Why inaccessible:** The hook's `output.system` is an in-memory array inside OpenCode's process. There is no API endpoint to inject system prompt modifications from an external client.

**Evidence:** `opencode-plugins.md` lines 247–293

### 3. `messages.transform` Hook — NOT Accessible

The `experimental.chat.messages.transform` hook allows plugins to modify message history before compaction. This is **plugin-only**.

**Evidence:** `opencode-plugins.md` lines 248–265, `repomix-opencode.xml` line 306627

### 4. PTY/Terminal Control — NOT for UI Rendering

The SDK exposes `client.pty.*` for PTY management (create, connect, list, remove). This is for **terminal emulation**, not UI rendering.

**Evidence:** `opencode-sdk.md` lines 163–176

### 5. MCP (Model Context Protocol) — Tool Integration Only

MCP in OpenCode is for **adding tools via MCP servers**, not for external UI communication. OpenCode acts as an MCP client to external MCP servers.

**Evidence:** `opencode-built-in-tools.md` lines 260–263

---

## Part III: Architecture Gaps for Side-Car UI Harness

### Gap 1: No UI Render Injection

**Problem:** OpenCode has no mechanism for an external client to inject UI components or override the TUI rendering.

**What exists:** `client.tui.*` only manipulates prompt text, toasts, and dialogs — it doesn't give the side-car any ability to render custom content inside OpenCode's TUI.

**What doesn't exist:** No `client.ui.render()` or equivalent. The TUI is rendered by OpenCode itself, not by external clients.

### Gap 2: No Bidirectional Real-Time Communication

**Problem:** Only SSE (unidirectional server-to-client). No WebSocket or bidirectional channel.

**Available:** `GET /event` (SSE stream) — OpenCode pushes events to the side-car.

**Missing:** The side-car cannot push events to OpenCode in real-time (only via `session.prompt` for chat messages, which has LLM overhead).

**Evidence:** `opencode-server.md` line 159, `opencode-sdk.md` lines 295–303

### Gap 3: No Message Stream Access Without LLM Call

**Problem:** To receive messages from a session, the only SDK method is `session.prompt()`, which sends the text to the LLM and returns a response. There is no **subscribe to session message stream** that gives you raw message events without invoking the LLM.

**What exists:** `session.messages()` returns a batch of past messages.

**What's missing:** A `session.messageStream()` or `client.event.subscribe({ sessionId })` that gives you real-time message events as they occur.

### Gap 4: No Control Over TUI Rendering from Outside

**Problem:** `client.tui.*` methods don't control TUI rendering — they trigger TUI *features* (append to prompt, show toast), but the TUI itself is rendered by OpenCode.

**Evidence:** `opencode-sdk.md` lines 265–285

### Gap 5: No Hook Bridge for External Plugins

**Problem:** The `Plugin` system is entirely in-process. There is no mechanism like:
- External plugin loader
- Webhook registration for hook events
- IPC bridge for plugin hooks to notify external clients

**What exists:** SSE event stream at `GET /event` — but it may not carry all internal hook events.

**Evidence:** `opencode-plugins.md` lines 102–145

### Gap 6: No Native UI Customization API

**Problem:** Agents have a `color` option for UI appearance, but this only sets a hex color for the agent's visual indicator — it does not allow custom UI components.

**Evidence:** `opencode-agents.md` lines 492–507

---

## Part IV: Server Configuration for External Access

### CORS Configuration

```bash
opencode serve --cors http://localhost:5173 --cors https://app.example.com
```

OpenCode's HTTP server can be configured to allow browser-based clients (like a Next.js side-car) via CORS headers.

**Evidence:** `opencode-server.md` lines 8–20

### Authentication

```bash
OPENCODE_SERVER_PASSWORD=your-password opencode serve
```

HTTP Basic Auth protects the server. The side-car must send credentials.

**Evidence:** `opencode-server.md` lines 22–27

### Port/Hostname

```bash
opencode serve --port 4096 --hostname 0.0.0.0  # Listen on all interfaces
```

**Evidence:** `opencode-server.md` lines 8–16

---

## Part V: Comparison — SDK Client vs Plugin Context

| Capability | External Client (`createOpencodeClient`) | Plugin Context (`.opencode/plugins/`) |
|------------|------------------------------------------|--------------------------------------|
| Session CRUD | ✅ Yes | ✅ Yes |
| Send prompts | ✅ Yes | ✅ Yes |
| File operations | ✅ Yes | ✅ Yes |
| Real-time events (SSE) | ✅ Yes | ✅ Yes (internal event bus) |
| TUI control | ✅ Limited (append, toast, dialogs) | ✅ Same |
| `tool.execute.before/after` | ❌ No | ✅ Yes |
| `chat.message` hook | ❌ No | ✅ Yes |
| `system.transform` hook | ❌ No | ✅ Yes |
| `messages.transform` hook | ❌ No | ✅ Yes |
| Custom tools registration | ❌ No | ✅ Yes |
| Context injection via hooks | ❌ No | ✅ Yes |
| Logging | ✅ `client.app.log()` | ✅ `client.app.log()` |

---

## Part VI: SDK Entry Points Summary

### For Side-Car (External Client)

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

// Connect to running OpenCode instance
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
})

// Real-time event subscription
const events = await client.event.subscribe()

// Session management
const session = await client.session.create({ body: { title: "Side-car session" } })
const response = await client.session.prompt({
  path: { id: session.id },
  body: { parts: [{ type: "text", text: "Hello" }] },
})

// TUI control
await client.tui.appendPrompt({ body: { text: "prefilled" } })
await client.tui.showToast({ body: { message: "Done!", variant: "success" } })
```

### For In-Process Plugin (Inside OpenCode)

```typescript
// .opencode/plugins/my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ client }) => {
  return {
    "tool.execute.after": async (input, output) => {
      // Intercept tool results
    },
    "experimental.chat.system.transform": async (input, output) => {
      // Inject system prompt
      output.system.push("## Extra context")
    },
  }
}
```

---

## Verdict

A side-car UI harness can:

1. ✅ **Connect** to OpenCode via `createOpencodeClient()` over HTTP
2. ✅ **Manage sessions** (create, list, delete, prompt, abort)
3. ✅ **Receive real-time events** via SSE at `GET /event`
4. ✅ **Control TUI** to some degree (append prompt, show toasts, open dialogs)
5. ✅ **Perform file operations** and search
6. ✅ **Log** to OpenCode's logging system

A side-car harness **cannot**:

1. ❌ **Inject into OpenCode's rendering** — no UI component injection API
2. ❌ **Intercept tool calls** — `tool.execute.before/after` are plugin-only
3. ❌ **Transform system prompts** — `system.transform` is plugin-only
4. ❌ **Transform message history** — `messages.transform` is plugin-only
5. ❌ **Receive all internal events** — SSE may not carry every hook event
6. ❌ **Use bidirectional real-time** — only SSE (server→client), no WebSocket

### The Fundamental Limitation

The OpenCode plugin system is **in-process**. Plugin hooks fire synchronously inside OpenCode's runtime. The external SDK client communicates via ** stateless HTTP requests + SSE event stream**. There is no **plugin hook bridge** that would allow an external process to intercept or participate in OpenCode's internal hook system.

This means a side-car UI harness is limited to being a **read observer + TUI controller** — it can watch what's happening and manipulate the prompt/toast layer, but it cannot meaningfully alter OpenCode's behavior through hooks because those hooks are inaccessible from outside OpenCode's process.

# API: SDK (`@opencode-ai/sdk`) — Client/Server Internals

> Version 1.14.44 | Source: `packages/sdk/js/src/`

## Client Factories

### V1 Client (`packages/sdk/js/src/client.ts`)

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk/client"

function createOpencodeClient(config?: Config & { directory?: string }): OpencodeClient
```

**Request pipeline:**
1. Creates `OpencodeClient({ client })` with fetch wrapper
2. Disables fetch timeout: `req.timeout = false` on every request
3. Sets `x-opencode-directory` header (URL-encoded) from `config.directory`
4. Request interceptor rewrites GET/HEAD: moves `x-opencode-directory` header → `directory` query param
5. Response interceptor checks for `text/html` content-type → throws if detected (version mismatch)

### V2 Client (`packages/sdk/js/src/v2/client.ts`)

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"

function createOpencodeClient(config?: Config & { directory?: string; experimental_workspaceID?: string }): OpencodeClient
```

**Differences from V1:**
- Sets BOTH `x-opencode-directory` AND `x-opencode-workspace` headers
- Rewrites BOTH headers to query params for GET/HEAD requests
- `pick()` function handles URL-encoding comparison for directory
- `experimental_workspaceID` enables workspace isolation (NEW in v2)
- Same timeout disable and text/html guard

### Under the Hood: Header rewrite for GET/HEAD

```
POST /session → headers: { x-opencode-directory: "/path" }
GET  /session → query: ?directory=%2Fpath  (header removed)
```

GET/HEAD bodies are unreliable, so directory moves to query param. POST/PUT/DELETE keep it in headers.

### Under the Hood: text/html response guard

If a response has `content-type: text/html`, the client throws. This detects when the OpenCode server version doesn't match the SDK and returns an HTML error page instead of JSON.

## Server Spawners

### V1 Server (`packages/sdk/js/src/server.ts`)

```typescript
import { createOpencodeServer } from "@opencode-ai/sdk/server"

type ServerOptions = {
  hostname?: string     // Default: "127.0.0.1"
  port?: number         // Default: 4096
  signal?: AbortSignal
  timeout?: number      // Default: 5000ms
  config?: Config
}

async function createOpencodeServer(options?: ServerOptions): Promise<{
  url: string
  close(): void
}>
```

**Spawn protocol:**
1. Spawns `opencode serve --hostname=<host> --port=<port>`
2. Config passed via `OPENCODE_CONFIG_CONTENT` env var (JSON.stringify)
3. Uses `cross-spawn` for cross-platform process launching
4. Watches stdout for `"opencode server listening on <url>"` regex
5. Resolves with `{ url, close }` once URL detected
6. Timeout rejects if server doesn't emit URL within `timeout` ms

### Under the Hood: Config injection

```typescript
const env = { ...process.env }
if (options.config) {
  env.OPENCODE_CONFIG_CONTENT = JSON.stringify(options.config)
}
```

Config is NOT passed as CLI args. It's serialized to JSON and injected as an environment variable.

### Under the Hood: URL detection

```typescript
proc.stdout.on("data", (data) => {
  const match = data.toString().match(/opencode server listening on (.+)/)
  if (match) resolve(match[1])
})
```

The server URL is parsed from stdout. The SDK does NOT construct the URL from hostname:port.

### V2 Server (`packages/sdk/js/src/v2/server.ts`)

Identical pattern to V1. Same spawn args, same URL detection, same error handling.

### TUI Spawner

```typescript
import { createOpencodeTui } from "@opencode-ai/sdk/server"

type TuiOptions = {
  project?: string
  model?: string
  session?: string
  agent?: string
  signal?: AbortSignal
  config?: Config
}

function createOpencodeTui(options?: TuiOptions): { close(): void }
```

- Spawns `opencode` with `--project`, `--model`, `--session`, `--agent` flags
- Config injected same way as server: `OPENCODE_CONFIG_CONTENT` env var
- Returns immediately (no URL to wait for)

## Process Management (`packages/sdk/js/src/process.ts`)

### `stop(proc)`

```typescript
function stop(proc: ChildProcess): void
```

- **Windows:** `taskkill /pid <pid> /T /F` (force kill process tree)
- **Unix/macOS:** `proc.kill()` (SIGTERM)

### `bindAbort(proc, signal?, onAbort?)`

```typescript
function bindAbort(proc: ChildProcess, signal?: AbortSignal, onAbort?: () => void): void
```

- Connects AbortSignal to process kill
- When signal fires, calls `stop(proc)` then `onAbort?.()`
- Auto-cleanup on process `exit` and `error` events (removes signal listener)
- Returns nothing — side-effect only

## Combined Factory

```typescript
import { createOpencode } from "@opencode-ai/sdk"

async function createOpencode(options?: ServerOptions): Promise<{
  client: OpencodeClient
  server: { url: string; close(): void }
}>
```

Spawns server then creates client connected to it. Convenience wrapper.

## V2 Data Helper (`packages/sdk/js/src/v2/data.ts`)

```typescript
import { data } from "@opencode-ai/sdk/v2/data"

const userMsg = data.message.user({
  parts: [{ type: "text", text: "Hello" }],
  sessionID: "optional-session-id",
})
```

- Creates synthetic `UserMessage` + `Parts` with stub IDs (`"asdasd"`)
- Useful for constructing test messages without a running server

## OpencodeClient API Surface

```typescript
class OpencodeClient {
  session: {
    list(params?: { directory?, workspace?, roots?, start?, search?, limit? }): Promise<SessionListResponses>
    create(params?: { directory?, workspace?, parentID?, title?, permission?, workspaceID? }): Promise<SessionCreateResponses>
    get(params: { sessionID, directory?, workspace? }): Promise<SessionGetResponses>
    update(params: { sessionID, directory?, workspace? }, body?: { title? }): Promise<SessionUpdateResponses>
    delete(params: { sessionID, directory?, workspace? }): Promise<SessionDeleteResponses>
    prompt(params: { sessionID }, body: { model?, parts, noReply?, outputFormat? }): Promise<PromptResponse>
    messages(params: { sessionID }): Promise<Array<MessageWithParts>>
    abort(params: { sessionID }): Promise<void>
    share(params: { sessionID }): Promise<Session>
    unshare(params: { sessionID }): Promise<Session>
    summarize(params: { sessionID }): Promise<Session>
    revert(params: { sessionID }, body: { messageID, partID? }): Promise<Session>
    unrevert(params: { sessionID }): Promise<Session>
    children(params: { sessionID }): Promise<Session[]>
    init(params: { directory? }): Promise<void>
    status(): Promise<Record<string, SessionStatus>>
  }
}
```

### Gotcha: ThrowOnError generic

```typescript
const result = await client.session.create()
// result could be success OR error response

const session = await client.session.create(undefined, { throwOnError: true })
// throws on non-2xx
```

All methods accept `options?: { throwOnError: boolean }` as last parameter.

### Gotcha: V1 vs V2 URL patterns

- V1: `GET /session?directory=/path`
- V2: `GET /session?directory=/path&workspace=ws-id`

V2 adds workspace scoping to every request.

## gen/ Directory — Auto-Generated SDK Surface

### V1 gen/ (`packages/sdk/js/src/gen/`)

| File | Size (approx) | Purpose |
|------|---------------|---------|
| `types.gen.ts` | ~68KB | All generated types from OpenAPI spec (sessions, messages, parts, config, events) |
| `sdk.gen.ts` | ~35KB | `OpencodeClient` class with all session CRUD, prompt, abort, share methods |
| `client.gen.ts` | ~2KB | `createClient()` HTTP factory |
| `client/client.gen.ts` | ~5KB | Base HTTP client (request builder, interceptors) |
| `client/types.gen.ts` | ~3KB | Client-specific types (request options, error shapes) |
| `client/utils.gen.ts` | ~2KB | URL construction utilities |
| `core/auth.gen.ts` | ~3KB | Authentication types |
| `core/bodySerializer.gen.ts` | ~2KB | Body serialization (Date→ISO, bigint→string, Uint8Array→base64) |
| `core/params.gen.ts` | ~2KB | Parameter handling ($body_, $headers_, $path_, $query_ prefixed) |
| `core/pathSerializer.gen.ts` | ~2KB | URL path serialization |
| `core/queryKeySerializer.gen.ts` | ~1KB | Query string construction |
| `core/serverSentEvents.gen.ts` | ~2KB | SSE event parsing and stream handling |
| `core/types.gen.ts` | ~2KB | Core HTTP types |
| `core/utils.gen.ts` | ~1KB | Utility functions |

### V2 gen/ (`packages/sdk/js/src/v2/gen/`)

Mirrors V1 structure with *additional* types and endpoints:
- `types.gen.ts` — larger than V1; includes workspace, sync, question, MCP types
- `sdk.gen.ts` — includes `session.restore()`, `sync.*`, `workspace.*` methods
- `workspaceID` parameter on session methods (V2-only)
- Sync event types (`SyncEvent*` variants for workspace, MCP, worktree)

### Gotcha: Never Edit gen/ Files

All files under `gen/` are auto-generated by `@hey-api/openapi-ts` from `openapi.json`. Any manual edits will be overwritten on regeneration.

### V1 vs V2 gen/ Growth

| Metric | V1 gen/ | V2 gen/ |
|--------|---------|---------|
| `types.gen.ts` | ~68KB | ~85KB+ (includes workspace, sync, question, MCP types) |
| Session methods | 8 (CRUD + prompt + messages + abort) | 12+ (adds restore, sync, workspace queries) |
| Key new types | — | `SyncEvent*`, `Question`, `McpServer`, `Workspace` |

## Error Response Shapes

SDK errors come from the auto-generated client:

```typescript
type ApiError = {
  status: number
  statusText: string
  body: unknown
}
```

When `throwOnError: false` (default), error responses are returned as discriminated unions on the response type.

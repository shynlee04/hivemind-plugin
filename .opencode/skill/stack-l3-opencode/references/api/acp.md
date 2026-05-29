# API: Agent Client Protocol (ACP)

> Version 1.14.44 | Source: `packages/opencode/src/acp/`

## Overview

The **Agent Client Protocol (ACP)** enables IDE integration by providing a JSON-RPC-over-stdio interface between OpenCode and external agent clients (Zed, VS Code extensions, terminal emulators). It is NOT a REST API — it uses bidirectional JSON-RPC messages over the standard input/output streams of a child process.

```
┌─────────────────┐     JSON-RPC (stdio)    ┌──────────────────┐
│  IDE / Editor   │ ←─────────────────────→ │  OpenCode Agent   │
│  (ACP Client)   │   {method, params, id}  │  (ACP Server)     │
└─────────────────┘                         └──────────────────┘
```

## Protocol Architecture

### Transport: JSON-RPC 2.0 over stdio

```
Client Process ← stdin/stdout → OpenCode Process
                                  ↓
                          ACPAgent (implements ACP methods)
                                  ↓
                          OpencodeClient (V2 SDK)
                                  ↓
                          OpenCode Go Server
```

Messages follow the JSON-RPC 2.0 specification:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "session/new",
  "params": { "cwd": "/path/to/project" }
}
```

### Core Types

```typescript
// From @agentclientprotocol/sdk (external npm package)
type ACPAgent = {
  // Handles incoming JSON-RPC requests
}

type AgentSideConnection = {
  sessionUpdate(update: SessionUpdate): Promise<void>
  // ... additional connection methods
}

type McpServer = {
  // MCP server configuration for ACP sessions
}
```

## ACP Implementation Files

### `packages/opencode/src/acp/agent.ts`

The `Agent` class implements the `ACPAgent` interface:

```typescript
export class Agent implements ACPAgent {
  private connection: AgentSideConnection
  private config: ACPConfig
  private sdk: OpencodeClient
  private sessionManager: ACPSessionManager

  constructor(connection: AgentSideConnection, config: ACPConfig) { /* ... */ }

  // Handles these JSON-RPC methods:
  // - initialize       → InitializeRequest/Response
  // - session/new      → NewSessionRequest
  // - session/load     → LoadSessionRequest
  // - session/resume   → ResumeSessionRequest/Response
  // - session/list     → ListSessionsRequest/Response
  // - session/close    → CloseSessionRequest/Response
  // - session/fork     → ForkSessionRequest/Response
  // - session/prompt   → PromptRequest (with parts)
  // - session/setModel → SetSessionModelRequest
  // - session/setMode  → SetSessionModeRequest
  // - session/setConfigOption → SetSessionConfigOptionRequest
  // - authenticate     → AuthenticateRequest
  // - cancel           → CancelNotification
}
```

Key behaviors:
- **Event subscription**: Uses `sdk.global.event()` SSE stream to relay OpenCode events to the ACP client as JSON-RPC notifications
- **Permission handling**: Translates OpenCode permission requests into `requestPermission` ACP calls with options (allow once, always allow, reject)
- **Tool execution**: Receives tool calls from the LLM, sends `tool/in_progress` notifications, and relays completed/error results
- **Session state**: Maintains internal session map in `ACPSessionManager`

### `packages/opencode/src/acp/session.ts`

```typescript
export class ACPSessionManager {
  private sessions = new Map<string, ACPSessionState>()
  private sdk: OpencodeClient

  constructor(sdk: OpencodeClient) { /* ... */ }

  tryGet(sessionId: string): ACPSessionState | undefined       // Lookup existing session
  async create(cwd: string, mcpServers: McpServer[], model?): Promise<ACPSessionState>  // Create via SDK
  async load(sessionId, cwd, mcpServers, model?): Promise<ACPSessionState>              // Load existing
  async fork(sessionId, cwd): Promise<ACPSessionState>                                   // Fork session
  close(sessionId): void                                           // Remove from internal map
}
```

### `packages/opencode/src/acp/types.ts`

```typescript
export interface ACPSessionState {
  id: string
  cwd: string
  mcpServers: McpServer[]
  createdAt: Date
  model?: { providerID: ProviderID; modelID: ModelID }
  variant?: string
  modeId?: string
}

export interface ACPConfig {
  sdk: OpencodeClient
  defaultModel?: { providerID: ProviderID; modelID: ModelID }
}
```

## JSON-RPC Methods Reference

### Session Management

| Method | Direction | Purpose |
|--------|-----------|---------|
| `session/new` | Client → Server | Create a new session with cwd and MCP servers |
| `session/load` | Client → Server | Load an existing session by ID |
| `session/resume` | Client → Server | Resume a session (returns full state) |
| `session/list` | Client → Server | List all active sessions |
| `session/close` | Client → Server | Close a session |
| `session/fork` | Client → Server | Fork a session (inherit context) |
| `session/prompt` | Client → Server | Send a user prompt to a session |
| `session/setModel` | Client → Server | Change the model for a session |
| `session/setMode` | Client → Server | Change the mode (e.g., "explore") |
| `session/setConfigOption` | Client → Server | Update session configuration |

### Authentication

| Method | Direction | Purpose |
|--------|-----------|---------|
| `authenticate` | Client → Server | Authenticate with a provider |

### Notifications (Server → Client)

| Notification | Direction | Purpose |
|-------------|-----------|---------|
| `session/update` | Server → Client | Usage updates (tokens, cost) |
| `tool/in_progress` | Server → Client | Tool execution started |
| `tool/completed` | Server → Client | Tool execution finished |
| `tool/error` | Server → Client | Tool execution failed |
| `text/delta` | Server → Client | Streaming text from LLM |
| `reasoning/delta` | Server → Client | Streaming reasoning from LLM |

## External Dependency

ACP uses the `@agentclientprotocol/sdk` npm package for the core type definitions (`ACPAgent`, `AgentSideConnection`, `RequestError`, etc.). This is an external protocol specification, not part of the OpenCode monorepo.

## Key Differences from REST API

| Aspect | REST API (port 4096) | ACP (stdio) |
|--------|---------------------|-------------|
| Transport | HTTP/SSE | JSON-RPC over stdin/stdout |
| Addressing | `localhost:4096` | Child process pipes |
| Session model | Client-managed | Server-managed (via SDK) |
| Event delivery | SSE streams | JSON-RPC notifications |
| Authentication | Config-based | `authenticate` RPC method |
| Use case | Web/TUI clients | IDE plugins, editor extensions |

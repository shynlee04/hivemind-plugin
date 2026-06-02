# INTEGRATIONS — External Integrations, API Surfaces & Plugin Interfaces

**Generated:** 2026-06-02
**Sources:** src/plugin.ts, .opencode/plugins/, mcp.json, opencode.json, .github/workflows/

---

## 1. Primary Integration: OpenCode Plugin SDK

### SDK Identity
| Field | Value |
|-------|-------|
| Package | `@opencode-ai/plugin` ^1.15.10 |
| Active source | [anomalyco/opencode](https://github.com/anomalyco/opencode) |
| SDK companion | `@opencode-ai/sdk` ^1.15.10 |
| Plugin entry | `.opencode/plugins/harness-control-plane.ts` |
| Compiled entry | `./dist/plugin.js` |

### Plugin Registration
```typescript
// In opencode.json (project root)
{
  "plugin": ["./dist/plugin.js"]
}
```

```typescript
// Plugin wrapper at .opencode/plugins/harness-control-plane.ts
export { HarnessControlPlane as default, HarnessControlPlane } from "../../dist/plugin.js"
```

### Plugin Interface
The `HarnessControlPlane` is a function conforming to the OpenCode `Plugin` type:
```typescript
type Plugin = (context: { client: OpenCodeClient; directory: string }) => PluginReturn
```

### Plugin Return Shape
```typescript
{
  config: () => Promise<void>,
  "hook.name.before"?: (input, output) => Promise<void>,
  "hook.name.after"?: (input, output) => Promise<void>,
  tool: { [toolName: string]: ToolDefinition }
}
```

---

## 2. Registered Tools (26 Custom Tools)

Tools are registered via 4 domain-specific registration functions in `src/plugin.ts`, plus 2 stand-alone tools.

### 2.1 Delegation Domain Tools (3 tools)
— `registerDelegationTools()` in `src/plugin.ts`

| Tool Name | Factory | File | Purpose |
|-----------|---------|------|---------|
| `delegate-task` | `createDelegateTaskTool` | `src/tools/delegation/delegate-task.ts` | Delegates work to a specialist agent via SDK child-session dispatch (WaiterModel) |
| `delegation-status` | `createDelegationStatusTool` | `src/tools/delegation/delegation-status.ts` | Checks delegation status, discovers stackable sessions, retrieves results |
| `run-background-command` | `createRunBackgroundCommandTool` | `src/tools/hivemind/run-background-command.js` | Runs CLI commands in shared background PTY sessions |

### 2.2 Session Domain Tools (7 tools)
— `registerSessionTools()` in `src/plugin.ts`

| Tool Name | Factory | File | Purpose |
|-----------|---------|------|---------|
| `execute-slash-command` | `createExecuteSlashCommandTool` | `src/tools/session/execute-slash-command.ts` | Executes OpenCode slash commands |
| `session-patch` | `createSessionPatchTool` | `src/tools/session/session-patch/` | Patches session context files |
| `session-journal-export` | `createSessionJournalExportTool` | `src/tools/session/session-journal-export.ts` | Exports session journal and execution lineage |
| `session-tracker` | `createSessionTrackerTool` | `src/tools/session/session-tracker.ts` | Queries and exports session tracker data |
| `session-hierarchy` | `createSessionHierarchyTool` | `src/tools/session/session-hierarchy.ts` | Navigates session delegation hierarchy |
| `session-context` | `createSessionContextTool` | `src/tools/session/session-context.ts` | Cross-session synthesis and discovery |
| `create-governance-session` | `createGovernanceSessionTool` | `src/features/governance-engine/` | Creates governance child sessions |

### 2.3 Hivemind Domain Tools (9 tools)
— `registerHivemindTools()` in `src/plugin.ts`

| Tool Name | Factory | File | Purpose |
|-----------|---------|------|---------|
| `hivemind-doc` | `createHivemindDocTool` | `src/tools/hivemind/hivemind-doc.js` | Read-only document intelligence |
| `hivemind-trajectory` | `createHivemindTrajectoryTool` | `src/tools/hivemind/hivemind-trajectory.js` | Trajectory ledger inspection and updates |
| `hivemind-pressure` | `createHivemindPressureTool` | `src/tools/hivemind/hivemind-pressure.js` | Runtime pressure classification |
| `hivemind-sdk-supervisor` | `createHivemindSdkSupervisorTool` | `src/tools/hivemind/hivemind-sdk-supervisor.js` | SDK wrapper health, diagnostics |
| `hivemind-command-engine` | `createHivemindCommandEngineTool` | `src/tools/hivemind/hivemind-command-engine.js` | Command discovery, contract analysis, route preview |
| `hivemind-session-view` | `createHivemindSessionViewTool` | `src/tools/hivemind/hivemind-session-view.js` | Unified session view across 3 data roots |
| `hivemind-agent-work-create` | `createHivemindAgentWorkCreateTool` | `src/tools/hivemind/hivemind-agent-work.js` | Create agent work contracts |
| `hivemind-agent-work-export` | `createHivemindAgentWorkExportTool` | `src/tools/hivemind/hivemind-agent-work.js` | Export agent work contracts |
| `session-delegation-query` | `createSessionDelegationQueryTool` | `src/tools/session/session-delegation-query.ts` | Query delegation history |

### 2.4 Config Domain Tools (6 tools)
— `registerConfigTools()` in `src/plugin.ts`

| Tool Name | Factory | File | Purpose |
|-----------|---------|------|---------|
| `configure-primitive` | `createConfigurePrimitiveTool` | `src/tools/config/configure-primitive.js` | Configure OpenCode primitives (agents, commands, skills) |
| `validate-restart` | `createValidateRestartTool` | `src/tools/config/validate-restart.js` | Validate compiled primitives after restart |
| `bootstrap-init` | `createBootstrapInitTool` | `src/tools/config/bootstrap-init.js` | Bootstrap OpenCode primitives |
| `bootstrap-recover` | `createBootstrapRecoverTool` | `src/tools/config/bootstrap-recover.js` | Repair broken primitive symlinks |
| `prompt-skim` | `createPromptSkimTool` | `src/tools/prompt/prompt-skim/` | Fast prompt scanning |
| `prompt-analyze` | `createPromptAnalyzeTool` | `src/tools/prompt/prompt-analyze/` | Deep prompt analysis |

### 2.5 Stand-alone Tools (2 tools)

| Tool Name | Creation | File | Purpose |
|-----------|----------|------|---------|
| `tmux-copilot` | Pre-constructed `tool()` instance | `src/tools/tmux-copilot.ts` | Tmux visual orchestration co-pilot |
| `tmux-state-query` | Pre-constructed `tool()` instance | `src/tools/tmux-state-query.ts` | Read-only tmux session metadata |

---

## 3. Hook Registration Surface (OpenCode Hooks)

### 3.1 Hook Types

| Hook Point | Handler | Purpose |
|------------|---------|---------|
| `config` | `async () => {}` | Plugin configuration (no-op currently) |
| `session.created` | `createCoreHooks()` → event observers | Session lifecycle events |
| `session.updated` | `createCoreHooks()` → event observers | Session state change events |
| `session.before` | `createSessionHooks()` → session entry | Pre-session guards and routing |
| `session.entry` | `createSessionHooks()` | Session entry point handling |
| `session.is_main` | `createSessionHooks()` | Main session detection |
| `tool.execute.before` | `createToolBeforeGuard()` | Circuit breaker, budget guard, contract enforcement, session tracking |
| `tool.execute.after` | `createToolExecuteAfterHook()` | Tool output summary, session tracker metadata capture, workflow auto-persist |
| `chat.message` | `createChatMessageCapture()` | Session message capture, delegation child output observation |
| `session.idle` | Via lifecycle manager | Delegation completion detection |
| `session.error` | Via lifecycle manager | Delegation error handling |
| `session.deleted` | Via lifecycle manager | Delegation cleanup |

### 3.2 Hook Module Architecture

```
src/hooks/
├── composition/          # Composite hook factories
├── guards/               # Pre-execution guard hooks
│   └── tool-guard-hooks.ts  # Circuit breaker + budget guard
├── lifecycle/            # Core lifecycle hooks
│   └── core-hooks.ts        # Session event observers
│   └── session-hooks.ts     # Session entry/is_main hooks
├── observers/            # Event observer modules
│   ├── event-observers.ts           # Delegation, session-entry, session-is-main observers
│   ├── session-entry-consumer.ts    # Session entry passthrough
│   ├── session-main-consumer.ts     # Main session passthrough
│   ├── delegation-consumer.ts       # Delegation event passthrough
│   └── session-tracker-consumer.ts  # Session tracker event wiring
├── transforms/           # Pre/post-execution transforms
│   ├── tool-before-guard.ts         # Unified tool.before guard chain
│   ├── tool-after-composer.ts       # Tool output composer
│   ├── tool-after-workflow.ts       # Config workflow auto-persist
│   └── chat-message-capture.ts      # Message capture
└── types.ts              # Hook type definitions
```

---

## 4. MCP Server Integrations (19 Servers)

Configured in `mcp.json` at project root.

### 4.1 HTTP-based MCP Servers

| Server | URL | Auth | Timeout | Purpose |
|--------|-----|------|---------|---------|
| **notion** | `https://mcp.notion.com/mcp` | Bearer token (`$NOTION_API_TOKEN`) | 15s | Notion API integration |
| **stitch** | `https://stitch.googleapis.com/mcp` | None | default | Google Stitch UI design tool |
| **gitmcp** | `https://gitmcp.io` | None | 35s | GitHub code search and documentation |
| **context7** | `https://mcp.context7.com/mcp` | None | default | Library documentation querying |
| **deepwiki** | `https://mcp.deepwiki.com/mcp` | None | 15s | GitHub repo documentation/wiki |
| **web-search-prime** | `https://api.z.ai/api/mcp/web_search_prime/mcp` | `$ZAI_API_KEY` | default | Web search |
| **web-reader** | `https://api.z.ai/api/mcp/web_reader/mcp` | `$ZAI_API_KEY` | default | URL content reading |
| **zread** | `https://api.z.ai/api/mcp/zread/mcp` | `$ZAI_API_KEY` | default | GitHub repo reading |
| **tavily** | `https://mcp.tavily.com/mcp/?tavilyApiKey=$TAVILY_API_KEY` | Query param key | 35s | Web search, crawl, extract, research |

### 4.2 Command-based MCP Servers

| Server | Command | Args | Env | Purpose |
|--------|---------|------|-----|---------|
| **fetcher** | `npx -y fetcher-mcp` | — | — | Web page content fetching |
| **desktop-commander** | `npx -y @smithery/cli@latest run @wonderwhy-er/desktop-commander --key $SMITHERY_CLI_KEY` | — | — | Desktop system commands |
| **exa** | `npx -y mcp-remote https://mcp.exa.ai/mcp` | — | `$EXA_API_KEY` | Web search with Exa |
| **fetch** | `uvx mcp-server-fetch` | — | — | URL fetching |
| **github** | `npx -y @modelcontextprotocol/server-github` | — | `$GITHUB_PAT` | GitHub API access |
| **mcp-playwright** | `npx -y @playwright/mcp@latest` | — | — | Browser automation |
| **memory** | `npx -y @modelcontextprotocol/server-memory` | — | — | Knowledge graph memory |
| **netlify** | `npx -y @netlify/mcp` | — | `$NETLIFY_PAT` | Netlify deployment |
| **repomix** | `npx -y repomix --mcp` | — | — | Codebase packing and analysis |
| **sequential-thinking** | `npx -y @modelcontextprotocol/server-sequential-thinking` | — | — | Structured reasoning |
| **brave-search** | `npx -y @brave/brave-search-mcp-server` | — | `$BRAVE_API_KEY` | Brave search API |

---

## 5. Integration Points with OpenCode SDK

### 5.1 SDK Session API (`src/shared/session-api.ts`)

The core SDK interaction layer providing:

| Function | OpenCode SDK Method | Purpose |
|----------|-------------------|---------|
| `appendTuiPrompt` | `client.session.prompt()` | Append text to TUI |
| `sendPromptAsync` | `client.session.prompt()` | Send async prompt to child session |
| `getSessionMessageCount` | `client.session.messageCount()` | Count messages in a session |
| `abortSession` | `client.session.abort()` | Terminate a session |
| `getSessionCreatedAt` | Client metadata | Get session creation timestamp |
| `getAvailableModels` | Client model listing | Discover available models |

### 5.2 SDK Delegation Integration

The delegation system (`src/coordination/delegation/`) integrates via:

| Component | SDK Surface | Purpose |
|-----------|-------------|---------|
| `DelegationDispatcher` | `client.session.prompt()` | Create child sessions for delegation |
| `DelegationMonitor` | `client.session.messageCount()` | Poll child sessions for completion |
| `AgentResolver` | Agent directory discovery | Resolve agent names to valid targets |
| `DelegationStateMachine` | SDK session states | Track delegation lifecycle |
| `sdkChildSessionStarter` | `client.session.prompt()` | Start SDK-dispatched child sessions |

### 5.3 SDK Plugin Logging

```typescript
client.app.log({ body: { service, level, message, extra } })
```

Used throughout plugin for startup diagnostics, migration logging, and error reporting.

---

## 6. OpenCode Configuration Integration

### 6.1 Project Root `opencode.json`

| Section | Content | Purpose |
|---------|---------|---------|
| `$schema` | `https://opencode.ai/config.json` | Schema reference |
| `instructions` | `[".opencode/rules/universal-rules.md"]` | Agent instructions path |
| `plugin` | `["./dist/plugin.js"]` | Plugin registration |
| `compaction` | `{ auto: true, prune: false, reserved: 5000 }` | Context compaction |
| `provider` | CrofAI configuration | AI model provider with 18 models |

### 6.2 AI Provider Integration (CrofAI)

| Detail | Value |
|--------|-------|
| Provider npm | `@ai-sdk/openai-compatible` |
| Base URL | `https://crof.ai/v1` |
| Provider name | CrofAI |
| Model count | 18 models across 6 families |

**Model Families:**
- **DeepSeek**: deepseek-v4-pro, deepseek-v4-pro-precision, deepseek-v4-pro-lightning, deepseek-v4-flash, deepseek-v3.2
- **Kimi**: kimi-k2.6, kimi-k2.6-precision, kimi-k2.5, kimi-k2.5-lightning
- **GLM**: glm-5.1, glm-5.1-precision, glm-5, glm-4.7, glm-4.7-flash
- **Gemma**: gemma-4-31b-it
- **MiniMax**: minimax-m2.5
- **Mimo**: mimo-v2.5-pro, mimo-v2.5-pro-precision
- **Qwen**: qwen3.6-27b, qwen3.5-397b-a17b, qwen3.5-9b
- **Other**: greg, temptest

### 6.3 Client `.opencode/opencode.json`

| Setting | Value |
|---------|-------|
| Read permission | `.opencode/get-shit-done/*` — allow |
| External directory | `.opencode/get-shit-done/*` — allow |

### 6.4 Universal Rules

`.opencode/rules/universal-rules.md` — injected as instructions into all agent sessions via `opencode.json`.

---

## 7. Sidecar Integration (Phase 42+)

### 7.1 Sidecar Architecture

```
sidecar/
├── package.json       # Next.js 15 app
├── tsconfig.json      # Bundler resolution, JSX preserve, Next.js plugin
└── src/
    ├── app/
    │   ├── page.tsx   # Main dashboard page
    │   └── layout.tsx # Root layout
    └── lib/
        └── .gitkeep
```

### 7.2 Read-Only State Contract (`src/sidecar/readonly-state.ts`)

The sidecar accesses harness state through guarded read-only helpers:
- `refuseCanonicalWrite()` — intercepts any accidental write attempt with `[Harness]` error
- Path containment — rejects `..` escapes and symlink attacks
- Reads from `.hivemind/state/` and `.planning/` directories

### 7.3 Dependencies

| Package | Purpose |
|---------|---------|
| Next.js 15 | App Router web framework |
| React 19 | UI library |
| @json-render/react | Generative UI rendering |

---

## 8. Schema Kernel (Zod Schemas)

21 schema modules in `src/schema-kernel/` providing runtime validation:

| Schema File | Validates |
|-------------|-----------|
| `agent-frontmatter.schema.ts` | Agent YAML frontmatter |
| `agent-work-contract.schema.ts` | Agent work contract structure |
| `bootstrap.schema.ts` | Bootstrap configuration |
| `command-engine.schema.ts` | Command engine routing |
| `command-frontmatter.schema.ts` | Command YAML frontmatter |
| `commands.schema.ts` | Command definitions |
| `config-precedence.schema.ts` | Config precedence rules |
| `doc-intelligence.schema.ts` | Document intelligence queries |
| `hivemind-configs.schema.ts` | Full Hivemind config (with JSON Schema generation) |
| `mcp-server.schema.ts` | MCP server definitions |
| `prompt-enhance.schema.ts` | Prompt enhancement (skim/analyze/patch) |
| `runtime-pressure.schema.ts` | Pressure score/tier validation |
| `sdk-supervisor.schema.ts` | SDK supervisor diagnostics |
| `session-delegation-query.schema.ts` | Delegation query parameters |
| `session-tracker.schema.ts` | Session tracker data |
| `session-view.schema.ts` | Session view aggregation |
| `skill-metadata.schema.ts` | Skill metadata |
| `tool.schema.ts` | Tool definitions |
| `trajectory.schema.ts` | Trajectory entries |
| `generate-config-json-schema.ts` | JSON Schema generation from Zod |

---

## 9. Tmux Integration (Phase 42+)

| Component | File | Purpose |
|-----------|------|---------|
| `createTmuxIntegrationIfSupported` | `src/features/tmux/integration.ts` | Factory — returns null if tmux unavailable |
| `createTmuxEventObserver` | `src/features/tmux/observers.ts` | Wires `session.created` → tmux pane creation |
| `tmuxCopilotTool` | `src/tools/tmux-copilot.ts` | Pre-constructed tool: send keys, list panes, grid, respawn |
| `tmuxStateQueryTool` | `src/tools/tmux-state-query.ts` | Read-only session metadata query for tmux |
| `ForkSessionManager` | Observer types in `src/features/tmux/observers.ts` | Pane management adapter |

**Runtime requirement:** OpenCode server mode (`"server": { "port": <port> }` in opencode.json) for attach URLs.

---

## 10. Background Command / PTY Integration

| Component | File | Purpose |
|-----------|------|---------|
| `createPtyManagerIfSupported` | `src/features/background-command/pty/pty-runtime.ts` | PTY manager factory |
| `run-background-command` tool | `src/tools/hivemind/run-background-command.js` | CLI dispatch |
| `bun-pty` (optional) | ^0.4.8 | PTY support on Bun |
| Fallback | `node:child_process` | Headless fallback on Node.js |

**Behavior:** PTY sessions cannot survive harness restart (`terminalKind: "non-resumable-after-restart"`).

---

## 11. Lifecycle Manager Integration

| Feature | Integration Point |
|---------|------------------|
| Completion detection | `CompletionDetector` + SDK polling + dual-signal (doer + verifier) |
| Session timeout | `WATCH_TIMEOUT_MS` = 30 minutes |
| Continuity hydration | `hydrateFromContinuity()` — restores delegation state at plugin init |
| Pending notification drain | `replayPendingDelegationNotifications()` — replays queued notifications |
| Migration one-shots | Legacy `.hivemind/event-tracker/` and `.hivemind/state/delegations.json` removal |

---

## 12. Asset Sync Integration (`scripts/sync-assets.js`)

| Detail | Value |
|--------|-------|
| Script | `node scripts/sync-assets.js` |
| Mode | `build` (default) or `install` |
| Source | `assets/` directory (agents, commands, skills, etc.) |
| Target | `.opencode/` directory |
| Backup | User-modified `.opencode/` files saved with `.backup` suffix |
| Trigger | `npm run build` and `npm run postinstall` |

**Synced asset categories:**
- `assets/agents/` → `.opencode/agents/`
- `assets/commands/` → `.opencode/commands/`
- `assets/skills/` → `.opencode/skills/`
- `assets/workflows/` → `.opencode/workflows/`
- `assets/references/` → `.opencode/references/`
- `assets/rules/` → `.opencode/rules/`
- `assets/templates/` → `.opencode/templates/`
- `assets/agent-instructions/` → `.opencode/agent-instructions/`

---

## 13. Config / Schema File Integration

| File | Format | Purpose |
|------|--------|---------|
| `.opencode/configs.schema.json` | JSON Schema | Generated from Zod — validates Hivemind config |
| `mcp.json` | JSON | 19 MCP server definitions |
| `opencode.json` | JSON | Project-level OpenCode config (plugin, provider, instructions) |
| `.opencode/opencode.json` | JSON | Client-level OpenCode config (permissions) |

---

## 14. External API Integrations

| Service | Protocol | Authentication | Used By |
|---------|----------|---------------|---------|
| CrofAI API | HTTPS/OpenAI-compatible | API key (`nahcrof_...`) | AI model provider |
| Notion API | MCP/HTTP | Bearer token (`$NOTION_API_TOKEN`) | Notion tools |
| ZAI API | MCP/HTTP | Bearer token (`$ZAI_API_KEY`) | Web search, reader, GitHub read |
| Exa API | MCP/HTTP | API key (`$EXA_API_KEY`) | Web search |
| Tavily API | MCP/HTTP | API key (`$TAVILY_API_KEY`) | Web search, crawl, research |
| GitHub API | MCP/HTTP | PAT (`$GITHUB_PAT`) | Code search, issues, PRs |
| Brave Search | MCP/HTTP | API key (`$BRAVE_API_KEY`) | Web search |
| GitMCP | MCP/HTTP | None | GitHub code/doc search |
| Context7 | MCP/HTTP | None | Library documentation |
| DeepWiki | MCP/HTTP | None | Repository documentation |
| Netlify API | MCP/HTTP | PAT (`$NETLIFY_PAT`) | Deployment |
| npm registry | HTTPS | NPM_TOKEN | Publishing |
| Google Stitch | MCP/HTTP | None | UI design |
| Google Playwright | MCP/binary | None | Browser automation |
| smithery/cli | Binary | `$SMITHERY_CLI_KEY` | Desktop commander |

---

## 15. GitHub Actions / CI Integration

| Workflow | External Integrations |
|----------|----------------------|
| **CI** | GitHub Actions (checkout@v4, setup-node@v4), npm registry |
| **Publish** | GitHub Actions, npm registry (`NPM_TOKEN` secret) |
| **OpenCode CI** | anomalyco/opencode/github@latest action, ZAI API (`ZAI_API_KEY`) |
| **Qwen workflows** | AI model invocation for triage/dispatch |

**CI Environment Variables (secrets):**
- `NPM_TOKEN` — npm publish authentication
- `ZAI_API_KEY` — OpenCode CI model access

---

## 16. Delegation Integration Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DelegationCoordinator               │
├─────────────────────────────────────────────────────┤
│  Dispatcher → AgentResolver → slotManager           │
│  Monitor → CompletionDetector → polling loop        │
│  Lifecycle → StateMachine → SDK session management  │
│  Notifier → PeriodicNotifier → TUI notifications    │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              SDK Child Session Starter               │
│         (client.session.prompt() — WaiterModel)      │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│            Hook Observers consume SDK events          │
│  session.created/updated/idle/error/deleted          │
│  → DelegationConsumer, SessionTrackerConsumer        │
└─────────────────────────────────────────────────────┘
```

---

## 17. Feature Module Integrations (15 Features)

| Feature | File | Integration Points |
|---------|------|-------------------|
| Agent work contracts | `src/features/agent-work-contracts/` | Tools, tool.before guard (contract enforcement) |
| Auto-loop | `src/features/auto-loop/` | Lifecycle manager |
| Background command | `src/features/background-command/` | PTY runtime, `run-background-command` tool |
| Bootstrap | `src/features/bootstrap/` | `bootstrap-init`, `bootstrap-recover` tools, primitive registry, control-plane |
| Capability gate | `src/features/capability-gate/` | Tool authorization |
| Doc intelligence | `src/features/doc-intelligence/` | `hivemind-doc` tool |
| Governance engine | `src/features/governance-engine/` | `create-governance-session` tool |
| Governance (legacy) | `src/features/governance/` | Legacy governance |
| Prompt packet | `src/features/prompt-packet/` | Prompt enrichment |
| Ralph loop | `src/features/ralph-loop/` | Escalation loop |
| Runtime pressure | `src/features/runtime-pressure/` | `hivemind-pressure` tool |
| SDK supervisor | `src/features/sdk-supervisor/` | `hivemind-sdk-supervisor` tool |
| Session tracker | `src/features/session-tracker/` | `session-tracker` tool, hooks, session created/updated events |
| Tmux | `src/features/tmux/` | `tmux-copilot`, `tmux-state-query` tools, event observers, integration factory |
| Tool intelligence | `src/features/tool-intelligence/` | Tool analytics |

---

## 18. Dependency Graph (Integration Relationships)

```
OpenCode Host
  ├── opencode.json (config)
  ├── .opencode/plugins/harness-control-plane.ts
  │     └── dist/plugin.js (HarnessControlPlane)
  │           ├── @opencode-ai/plugin (tool(), hooks)
  │           ├── @opencode-ai/sdk (session API)
  │           └── @ai-sdk/openai-compatible (model routing)
  ├── mcp.json (19 MCP servers)
  │     ├── HTTP: notion, stitch, gitmcp, context7, deepwiki, tavily
  │     ├── HTTP+key: web-search-prime, web-reader, zread
  │     └── Binary: fetcher, github, playwright, memory, netlify, repomix, brave-search
  └── .github/workflows/
        ├── ci.yml (Node 20/22)
        ├── publish.yml (npm registry)
        └── opencode.yml (anomalyco/opencode action)
```

---

**End of INTEGRATIONS.md** — 313 lines

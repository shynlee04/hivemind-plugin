# External Integrations

**Analysis Date:** 2026-05-07

## APIs & External Services

### OpenCode Platform Integration

**Plugin SDK:**
- Package: `@opencode-ai/plugin` ^1.14.28 (peer + dev dependency)
- Entry: `src/plugin.ts` — `HarnessControlPlane: Plugin` async factory
- Registration: `opencode.json` → `plugin: [..., "./dist/plugin.js"]`
- The plugin factory receives `{ client, directory }` from OpenCode at startup

**OpenCode SDK:**
- Package: `@opencode-ai/sdk` ^1.14.28
- Client type: `OpenCodeClient = ReturnType<typeof createOpencodeClient>`
- Wrapper: `src/lib/session-api.ts` (~285 LOC) — typed wrappers for:
  - `client.session.create()` — Create child sessions
  - `client.session.prompt()` — Send prompts (sync + async fallback)
  - `client.session.messages()` — Retrieve messages
  - `client.session.abort()` — Abort sessions
  - Session ID validation (must start with `ses`)

**Plugin Hook Surfaces (registered in `src/plugin.ts`):**

| Hook | Source Factory | Purpose |
|------|---------------|---------|
| `event` | `createCoreHooks()` | Routes all SDK events to `lifecycleManager.handleEvent()` + observers |
| `system.transform` | `createCoreHooks()` | Injects governance block, intake context, behavioral profile |
| `messages.transform` | `createCoreHooks()` | Classifies hook effect (CQRS boundary check) |
| `shell.env` | `createCoreHooks()` | Injects `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1` |
| `tool.execute.after` | Inline in `plugin.ts` | Workflow state persistence, event tracker artifacts |

**Plugin Tools (15 registered):**

| Tool Name | Source | Purpose |
|-----------|--------|---------|
| `delegate-task` | `src/tools/delegate-task.ts` | Dispatch work to specialist agents (WaiterModel) |
| `delegation-status` | `src/tools/delegation-status.ts` | Poll delegation state and retrieve results |
| `run-background-command` | `src/tools/run-background-command.ts` | Background PTY command execution |
| `prompt-skim` | `src/tools/prompt-skim/index.ts` | Fast scan of prompt content |
| `prompt-analyze` | `src/tools/prompt-analyze/index.ts` | Analyze prompt for contradictions, vagueness |
| `session-patch` | `src/tools/session-patch/index.ts` | Patch session files with backup |
| `session-journal-export` | `src/tools/session-journal-export.ts` | Export session journal/lineage as JSON or Markdown |
| `hivemind-doc` | `src/tools/hivemind-doc.ts` | Read-only document intelligence (skim, read, chunk, search) |
| `hivemind-trajectory` | `src/tools/hivemind-trajectory.ts` | Inspect/update trajectory ledger |
| `hivemind-pressure` | `src/tools/hivemind-pressure.ts` | Classify runtime pressure, inspect tool authority |
| `hivemind-sdk-supervisor` | `src/tools/hivemind-sdk-supervisor.ts` | Inspect SDK wrapper health and readiness |
| `hivemind-command-engine` | `src/tools/hivemind-command-engine.ts` | Discover command bundles, analyze contracts |
| `hivemind-agent-work-create` | `src/tools/hivemind-agent-work.ts` | Create durable agent work contracts |
| `hivemind-agent-work-export` | `src/tools/hivemind-agent-work.ts` | Export work contracts as JSON/Markdown payloads |
| `configure-primitive` | `src/tools/configure-primitive.ts` | Configure OpenCode primitives (agents, commands, skills) |
| `validate-restart` | `src/tools/validate-restart.ts` | Validate primitives are discoverable after restart |

### MCP Server Integrations

**Location:** `mcp.json` — 20 MCP servers configured

**HTTP-based MCP Servers:**
| Server | URL | Auth | Timeout |
|--------|-----|------|---------|
| `notion` | `https://mcp.notion.com/mcp` | Bearer `$NOTION_API_TOKEN` | 15s |
| `stitch` | `https://stitch.googleapis.com/mcp` | None | Default |
| `gitmcp` | `https://gitmcp.io` | None | 35s |
| `web-search-prime` | `https://api.z.ai/api/mcp/web_search_prime/mcp` | Bearer `$ZAI_API_KEY` | Default |
| `web-reader` | `https://api.z.ai/api/mcp/web_reader/mcp` | Bearer `$ZAI_API_KEY` | Default |
| `zread` | `https://api.z.ai/api/mcp/zread/mcp` | Bearer `$ZAI_API_KEY` | Default |
| `context7` | `https://mcp.context7.com/mcp` | None | Default |
| `deepwiki` | `https://mcp.deepwiki.com/mcp` | None | 15s |
| `tavily` | `https://mcp.tavily.com/mcp/?tavilyApiKey=$TAVILY_API_KEY` | Query param | 35s |

**NPX-based MCP Servers:**
| Server | Command | Auth |
|--------|---------|------|
| `fetcher` | `npx -y fetcher-mcp` | None |
| `desktop-commander` | `npx -y @smithery/cli@latest` | `$SMITHERY_CLI_KEY` |
| `exa` | `npx -y mcp-remote https://mcp.exa.ai/mcp` | Env: `$EXA_API_KEY` |
| `github` | `npx -y @modelcontextprotocol/server-github` | Env: `$GITHUB_PAT` |
| `mcp-playwright` | `npx -y @playwright/mcp@latest` | None |
| `memory` | `npx -y @modelcontextprotocol/server-memory` | None |
| `netlify` | `npx -y @netlify/mcp` | Env: `$NETLIFY_PAT` |
| `repomix` | `npx -y repomix --mcp` | None |
| `sequential-thinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` | None |
| `brave-search` | `npx -y @brave/brave-search-mcp-server` | Env: `$BRAVE_API_KEY` |

**UVX-based:**
| Server | Command | Auth |
|--------|---------|------|
| `fetch` | `uvx mcp-server-fetch` | None |

### AI Provider

**Provider:** Osiris (`@ai-sdk/openai-compatible`)
- Base URL: `https://ai.osiris-code.com/v1`
- Available models: Claude Opus 4.6, Claude Sonnet 4.5, GPT-5.4, GPT-5.5, DeepSeek V4 Pro, Gemini 3.1 Pro, GLM 5.1, GLM 5V Turbo, Kimi K2.6
- Default model: `osiris/claude-opus-4-6` (1M context)
- Config: `opencode.json` provider section

## Data Storage

**Databases:**
- No traditional database. All persistence is file-based JSON.

**File-Based State Store:**
- `.hivemind/state/` — Canonical state root (per Q6 architectural decision)
  - `delegations.json` — Delegation records
  - `config-workflows.json` — Config workflow state
  - Continuity store (session persistence) via `src/lib/continuity.ts`
  - Delegation persistence via `src/lib/delegation-persistence.ts`
- Legacy path: `.opencode/state/opencode-harness/` (supported via compatibility bridge, one-way migration)
- Format: Deep-clone-on-read JSON, module-level singleton cache in `continuity.ts`

**File Storage:**
- `.hivemind/event-tracker/` — Session event tracker artifacts (JSON + Markdown)
- `.hivemind/poor-prompts/` — Project issues/captures
- Local filesystem only — no cloud storage integration

**Caching:**
- In-memory Maps in `src/lib/state.ts`: `sessionStats`, `rootBudgets`, `sessionToRoot`, `sessionDelegationMeta`
- Config subscriber lazy-cache (`src/lib/config-subscriber.ts`)
- No distributed cache

## Authentication & Identity

**Auth Provider:**
- Not applicable — harness is an OpenCode plugin, delegates auth to the host platform
- Session IDs validated by prefix check (must start with `ses`)
- MCP server auth via environment variables and API keys (Bearer tokens)

**Permission Model:**
- OpenCode permission config in `opencode.json`: `read: allow`, `edit: allow`, `bash: allow` (with restricted git patterns), `task: allow`, `skill: allow`
- Category gate policies for delegation: `src/lib/category-gates.ts`, `src/lib/category-gate-audit.ts`
- Runtime policy overrides per session/delegation in `src/lib/runtime-policy.ts`

## Monitoring & Observability

**Error Tracking:**
- `[Harness]` prefix on all thrown errors
- Session journal (append-only event timeline, Q3 architectural decision) — `src/lib/session-journal.ts`
- Execution lineage tracking — `src/lib/execution-lineage.ts`
- Trajectory ledger — `src/lib/trajectory/index.ts`
- Event tracker — `src/lib/event-tracker/index.ts`

**Logs:**
- Best-effort audit projection (failures silently ignored, never block canonical event handling)
- Warning cap at 25 per session (`src/lib/state.ts`)
- Runtime pressure classification — `src/lib/runtime-pressure/index.ts`
- SDK supervisor health diagnostics — `src/lib/sdk-supervisor/index.ts`

**Compaction:**
- OpenCode auto-compaction enabled (`compaction.auto: true`, `compaction.prune: true`)
- Reserved context: 10,000 tokens

## CI/CD & Deployment

**Hosting:**
- npm package: `hivemind` v0.1.0
- Local plugin loaded from `./dist/plugin.js`
- No CI/CD pipeline detected in current workspace

**CI Pipeline:**
- Not configured in this repository (no GitHub Actions workflows detected)

## Environment Configuration

**Required env vars (for MCP server operation):**
- `NOTION_API_TOKEN` — Notion integration
- `ZAI_API_KEY` — Web search, web reader, zread
- `TAVILY_API_KEY` — Tavily search/research/extract
- `BRAVE_API_KEY` — Brave search
- `GITHUB_PAT` — GitHub API
- `EXA_API_KEY` — Exa web search
- `NETLIFY_PAT` — Netlify deployment
- `SMITHERY_CLI_KEY` — Desktop commander

**Secrets location:**
- `.env` file present at project root — contains environment configuration
- `mcp.json` references env vars using `$VAR` syntax

**Runtime overrides (optional):**
- `OPENCODE_HARNESS_STATE_DIR` — Override state directory path
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file path
- `NODE_ENV` — When set to `test`, session ID validation relaxed (accepts `child-*`/`parent-*` prefixes)

## Webhooks & Callbacks

**Incoming:**
- None — harness is a plugin, not a server

**Outgoing:**
- MCP server calls via configured servers
- OpenCode SDK session operations (create, prompt, messages, abort)
- File system writes to `.hivemind/` state directory

## Cross-Module Dependency Patterns

**Core Dependency Graph (critical paths):**
```
types.ts (leaf, 415 LOC)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts (self-contained, ~98 LOC)
├── continuity.ts → types.ts (~401 LOC, state persistence)
├── delegation-persistence.ts → types.ts, continuity.ts (~78 LOC)
├── session-api.ts → helpers.ts (~285 LOC, SDK wrappers)
├── runtime.ts → helpers.ts + types.ts (~43 LOC)
├── completion-detector.ts (self-contained, ~120 LOC)
├── notification-handler.ts → helpers.ts
└── lifecycle-manager.ts → concurrency + continuity + helpers + session-api + state + types (~152 LOC)

delegation-manager.ts → concurrency + continuity + delegation-persistence + helpers + types + @opencode-ai/sdk (~500 LOC)
```

**Max chain depth:** 2 levels. `types.ts` changes ripple to most modules.

**Non-negotiable constraints:**
- No circular dependencies
- Max module size: 500 LOC
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Deep-clone-on-read in continuity store
- `types.ts` is leaf — depends on nothing

**Integration surface layers:**
1. **Plugin composition root** (`src/plugin.ts`, 183 LOC) — Wires all factories, tools, hooks
2. **Hook factories** (`src/hooks/`, 10 files) — Event observers, CQRS boundary checks, governance injection
3. **Tool implementations** (`src/tools/`, 13 top-level + 3 subdirectories) — 16 registered tools
4. **Core lib** (`src/lib/`, 25+ modules) — State, concurrency, delegation, lifecycle, continuity
5. **Schema kernel** (`src/schema-kernel/`, 16 files) — Zod schemas for tool I/O and config validation
6. **Shared utilities** (`src/shared/`, 2 files) — Tool response envelope, tool helpers

**File system boundaries:**
| Path | Classification | Role |
|------|---------------|------|
| `src/` | Hard harness (npm package) | TypeScript source — tools, hooks, plugin, lib |
| `.opencode/` | Soft meta-concepts | Agents, skills, commands, rules, permissions — NO state |
| `.hivemind/` | Internal state | Session journals, lineage, runtime state, events — canonical per Q6 |
| `.planning/` | Planning artifacts | Codebase maps, phase plans, specs — project governance |
| `dist/` | Build output | Compiled JS + declarations + sourcemaps (gitignored) |
| `tests/` | Test suite | Vitest unit tests mirroring `src/` structure |

---

*Integration audit: 2026-05-07*

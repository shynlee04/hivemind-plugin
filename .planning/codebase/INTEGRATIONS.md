# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**OpenCode Platform:**
- OpenCode SDK (`@opencode-ai/sdk`) — Core session orchestration API
  - Session CRUD: `client.session.create()`, `client.session.get()`, `client.session.abort()`
  - Messaging: `client.session.messages()`, `client.session.prompt()`, `client.session.promptAsync()`
  - Status polling: `client.session.status()`
  - Auth: Built into SDK client instance passed to plugin
- OpenCode SDK Server API (Q2) — REST API at `http://localhost:PORT` for sidecar communication
  - Config, settings, sessions accessible via HTTP endpoints
  - Sidecar uses this API for live session and configuration interaction

**Sidecar Architecture (Q2):**
- Next.js 15 + React 19 dashboard application
- `@json-render/react` — Dynamic UI generation from JSON specs without code changes
- Reads artifacts from `.hivemind/` and `.planning/` directories
- Renders dashboard tabs based on artifact JSON schemas
- READ-ONLY constraint — sidecar CANNOT write to canonical state (enforcement test required)
- Architecture: OpenCode Local HTTP Server ↔ Sidecar (Next.js) via REST

```
OpenCode Local HTTP Server (https://opencode.ai/docs/server)
       ↕ REST API
Sidecar (Next.js 15 + @json-render/react)
  ├── Reads: artifacts from .hivemind/ and .planning/
  ├── Renders: JSON-spec-driven dashboard tabs
  ├── Interacts: OpenCode SDK API for config, settings, sessions
  └── Constraint: READ-ONLY for canonical state
```

**Search & Web Services (via MCP):**
- Tavily — Web search and content extraction
  - Config: `mcp.json` → `tavily` (HTTP MCP server)
  - Auth: API key embedded in MCP URL
- Brave Search — Web and local search
  - Config: `mcp.json` → `brave-search` (npx command)
  - Auth: `BRAVE_API_KEY` env var
- Exa — Semantic web search
  - Config: `mcp.json` → `exa` (npx mcp-remote)
  - Auth: `EXA_API_KEY` env var
- Z.AI (web-search-prime, web-reader, zread) — Chinese AI platform web services
  - Config: `mcp.json` → `web-search-prime`, `web-reader`, `zread` (HTTP MCP servers)
  - Auth: `ZAI_API_KEY` env var

**Code & Repository Services:**
- GitHub — Repository management, PRs, issues
  - Config: `mcp.json` → `github` (npx command)
  - Auth: `GITHUB_PAT` env var
- Repomix — Codebase packaging for AI analysis
  - Config: `mcp.json` → `repomix` (npx command)
- DeepWiki — GitHub repository documentation
  - Config: `mcp.json` → `deepwiki` (HTTP MCP server)
- Context7 — Library documentation lookup
  - Config: `mcp.json` → `context7` (HTTP MCP server)
- GitMCP — GitHub documentation and code search
  - Config: `mcp.json` → `gitmcp` (HTTP MCP server)

**Productivity:**
- Notion — Workspace and document management
  - Config: `mcp.json` → `notion` (HTTP MCP server)
  - Auth: `NOTION_API_TOKEN` env var
- Stitch — Google UI design generation
  - Config: `mcp.json` → `stitch` (HTTP MCP server)
  - Auth: Built into Google MCP endpoint

**Deployment:**
- Netlify — Hosting and deployment
  - Config: `mcp.json` → `netlify` (npx command)
  - Auth: `NETLIFY_PAT` env var

**Development Tools:**
- Playwright — Browser automation and E2E testing
  - Config: `mcp.json` → `mcp-playwright` (npx command)
- Fetcher — Web page fetching
  - Config: `mcp.json` → `fetcher` (npx command)
- Fetch — Python MCP fetch server
  - Config: `mcp.json` → `fetch` (uvx command)
- Desktop Commander — Desktop automation via Smithery
  - Config: `mcp.json` → `desktop-commander` (npx @smithery/cli)
  - Auth: `SMITHERY_CLI_KEY` env var
- Sequential Thinking — Structured reasoning tool
  - Config: `mcp.json` → `sequential-thinking` (npx command)
- Memory — MCP memory server for persistent context
  - Config: `mcp.json` → `memory` (npx command)

## Data Storage

**Databases:**
- None — No external database connections

**File Storage:**
- Local filesystem — Canonical state at `.hivemind/state/session-continuity.json` (Q6 migration)
  - Format: JSON file with versioned schema (`CONTINUITY_VERSION = 1`)
  - Deep-clone-on-read to prevent mutation aliasing
  - Module-level `storeCache` singleton for in-memory caching
  - Legacy path (transition): `.opencode/state/opencode-harness/session-continuity.json`
- Session Journal (future) — Append-only event timeline at `.hivemind/journal/`
- Delegation records — `.hivemind/state/delegations.json`

**Caching:**
- In-memory Maps (`src/lib/state.ts`) — `sessionStats`, `rootBudgets`, `sessionToRoot`, `sessionDelegationMeta`
- Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`), hydrated on startup

## Authentication & Identity

**Auth Provider:**
- None built into harness — authentication delegated to OpenCode platform
- MCP servers handle their own auth via env vars and HTTP headers

## Monitoring & Observability

**Error Tracking:**
- None — Errors thrown with `[Harness]` prefix for identification

**Logs:**
- Console output via OpenCode session messaging
- Session continuity metadata tracks: status, description, delegation info, pending notifications, result capture, compaction checkpoints

## CI/CD & Deployment

**Hosting:**
- npm registry — Package published as `opencode-harness`
- Entrypoints: `opencode-harness` (library), `opencode-harness/plugin` (plugin)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/opencode.yml`
- Triggers: issue_comment, pull_request_review_comment containing `/oc` or `/opencode`
- Model: `zai-coding-plan/glm-5.1`
- Additional workflows: Qwen triage, invoke, scheduled triage, review, dispatch

## Environment Configuration

**Required env vars (for MCP servers, not harness itself):**
- `TAVILY_API_KEY` — Tavily web search
- `ZAI_API_KEY` — Z.AI web services
- `BRAVE_API_KEY` — Brave search
- `GITHUB_PAT` — GitHub API access
- `EXA_API_KEY` — Exa semantic search
- `NOTION_API_TOKEN` — Notion API
- `SMITHERY_CLI_KEY` — Smithery CLI tools
- `NETLIFY_PAT` — Netlify deployment

**Harness runtime env vars:**
- `OPENCODE_HARNESS_STATE_DIR` — Override state directory path
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file path

**Secrets location:**
- `.env` file (local development, gitignored)
- GitHub Secrets (CI/CD pipelines)

## Webhooks & Callbacks

**Incoming:**
- OpenCode session events: `session.idle`, `session.deleted`, `session.error`
  - Handled by `DelegationManager.handleSessionIdle()` and `handleSessionDeleted()`
  - Event observers registered in `plugin.ts` via `createCoreHooks()`

**Outgoing:**
- None — Harness operates within OpenCode session lifecycle, no external webhook dispatch

## MCP Server Architecture

**Connection Types:**
- HTTP MCP servers (remote): Notion, Stitch, GitMCP, Context7, DeepWiki, Tavily, Z.AI services
- npx MCP servers (local): GitHub, Exa, Fetcher, Playwright, Memory, Netlify, Brave Search, Repomix, Sequential Thinking, Desktop Commander
- uvx MCP servers: Fetch (Python-based)

**Timeout Configuration:**
- Notion: 15s
- GitMCP: 35s
- Fetcher: 30s
- Tavily: 35s
- DeepWiki: 15s
- Z.AI services: default (no explicit timeout)

---

*Integration audit: 2026-04-25*

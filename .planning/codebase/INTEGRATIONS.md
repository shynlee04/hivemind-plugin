# External Integrations

**Analysis Date:** 2026-04-28

## APIs & External Services

**Runtime Platform:**
- OpenCode Runtime — Core platform the harness plugs into
  - SDK/Client: `@opencode-ai/sdk` ^1.14.28 (type-only), `@opencode-ai/plugin` ^1.14.28
  - Integration: `src/plugin.ts` — Composition root registering 9 tools and multiple hooks via the plugin API
  - Session API: `src/lib/session-api.ts` — Typed wrappers for session.create, session.prompt, session.promptAsync, session.abort, session.messages, session.status
  - Auth: Session IDs (format: `ses_*`) injected by platform; no custom auth

**MCP Servers (configured in `mcp.json`):**

*Web Search & Reading:*
- Tavily — LLM-optimized web search
  - Config: `mcp.json` → `tavily` (HTTP URL with API key)
  - Auth: `TAVILY_API_KEY` env var
- Z.AI Web Search — Web search via Z.AI API
  - Config: `mcp.json` → `web-search-prime` (HTTP URL with API key)
  - Auth: `ZAI_API_KEY` env var
- Z.AI Web Reader — Web page content extraction
  - Config: `mcp.json` → `web-reader` (HTTP URL with API key)
  - Auth: `ZAI_API_KEY` env var
- Z.AI zread — Additional web reading
  - Config: `mcp.json` → `zread` (HTTP URL with API key)
  - Auth: `ZAI_API_KEY` env var
- Brave Search — Privacy-focused web search
  - Config: `mcp.json` → `brave-search` (npx CLI with API key)
  - Auth: `BRAVE_API_KEY` env var
- Exa — Web search and content extraction
  - Config: `mcp.json` → `exa` (npx mcp-remote proxy)
  - Auth: `EXA_API_KEY` env var

*Documentation & Research:*
- Context7 — Up-to-date library documentation search
  - Config: `mcp.json` → `context7` (HTTP URL, no auth)
- DeepWiki — GitHub repository documentation
  - Config: `mcp.json` → `deepwiki` (HTTP URL, no auth)
- GitMCP — GitHub documentation fetching
  - Config: `mcp.json` → `gitmcp` (HTTP URL, no auth)

*Development Tools:*
- GitHub MCP — Repository operations (issues, PRs, code search)
  - Config: `mcp.json` → `github` (npx CLI)
  - Auth: `GITHUB_PERSONAL_ACCESS_TOKEN` → `$GITHUB_PAT`
- Netlify MCP — Deployment operations
  - Config: `mcp.json` → `netlify` (npx CLI)
  - Auth: `NETLIFY_PERSONAL_ACCESS_TOKEN` → `$NETLIFY_PAT`
- Repomix — Codebase packing/analysis
  - Config: `mcp.json` → `repomix` (npx CLI, no auth)
- Playwright — Browser automation
  - Config: `mcp.json` → `mcp-playwright` (npx CLI, no auth)

*Productivity:*
- Notion — Documentation and knowledge management
  - Config: `mcp.json` → `notion` (HTTP URL with API key)
  - Auth: `NOTION_API_TOKEN` env var
- Stitch (Google) — UI design generation
  - Config: `mcp.json` → `stitch` (HTTP URL, no auth)
- Desktop Commander — Desktop automation via Smithery
  - Config: `mcp.json` → `desktop-commander` (npx CLI)
  - Auth: `SMITHERY_CLI_KEY` env var

*AI/Reasoning:*
- Sequential Thinking — Structured problem-solving
  - Config: `mcp.json` → `sequential-thinking` (npx CLI, no auth)
- Memory — Knowledge graph memory persistence
  - Config: `mcp.json` → `memory` (npx CLI, no auth)

*General:*
- Fetcher — Generic URL fetching
  - Config: `mcp.json` → `fetcher` (npx CLI, no auth)
- Fetch — URL content extraction (uvx-based)
  - Config: `mcp.json` → `fetch` (uvx CLI, no auth)

## Data Storage

**Databases:**
- No external database — all persistence is file-based JSON
  - Continuity store: `.hivemind/state/session-continuity.json` (managed by `src/lib/continuity.ts`)
  - Delegation records: `.hivemind/state/delegations.json` (managed by `src/lib/delegation-persistence.ts`)
  - Config workflows: `.hivemind/state/config-workflows.json`
  - Session journal: `.hivemind/journal/*.jsonl` (append-only event timeline)
  - Execution lineage: `.hivemind/lineage/`
  - Event tracker: `.hivemind/event-tracker/*.json`, `.hivemind/event-tracker/*.md`

**File Storage:**
- Local filesystem only — State directory at `.hivemind/state/` (canonical per Q6 architectural decision)
- Legacy path: `.opencode/state/opencode-harness/` (compatibility bridge during migration)

**Caching:**
- None external — In-memory Maps used for runtime caching:
  - `sessionStats`, `rootBudgets`, `sessionToRoot`, `sessionDelegationMeta` in `src/lib/state.ts`
  - `storeCache` singleton in `src/lib/continuity.ts` (single module-level cache of continuity store)

## Authentication & Identity

**Auth Provider:**
- OpenCode platform handles all authentication — harness receives session context (sessionID) injected by the framework
- No custom auth layer — identity is tracked via OpenCode session IDs (`ses_*` prefix)
- Parent-child session hierarchy managed via `parentID` field in session records

**Implementation:**
- `src/lib/session-api.ts` — `assertValidSessionID()` validates session ID format
- `src/tools/delegate-task.ts` — Detects OpenCode runtime availability via `context.sessionID` and `process.env.OPENCODE_SESSION_ID`
- `src/lib/types.ts` — `TaskStatus` state machine (pending → queued → running → completed/failed/cancelled/error/interrupt)

## Monitoring & Observability

**Error Tracking:**
- No external service — all error information logged to local files
- Event tracker at `src/lib/event-tracker/` writes events to .hivemind/event-tracker/*.json and *.md
- Session journal at `src/lib/session-journal.ts` writes append-only JSONL
- Execution lineage at `src/lib/execution-lineage.ts` tracks parent-child session chains
- `[Harness]` prefix on all thrown errors for grep-ability

**Logs:**
- Console-based — harness uses structured error messages with `[Harness]` prefix
- Best-effort audit projection: event tracker writes never block canonical OpenCode event handling
- `.hivemind/state/progress.md` and `.hivemind/state/task_plan.md` for session-level planning persistence

## CI/CD & Deployment

**Hosting:**
- npm package (`opencode-harness@0.1.0`) — publishable via `npm publish`
- Loaded by OpenCode projects as a plugin via `opencode.json` → `"./dist/plugin.js"`
- Also loadable via `@opencode-ai/plugin` peer dependency resolution

**CI Pipeline:**
- GitHub Actions — `.github/workflows/opencode.yml`:
  - Triggers on issue/PR comments containing `/oc` or `/opencode`
  - Runs OpenCode via `anomalyco/opencode/github@latest` action on `ubuntu-latest`
  - Uses `zai-coding-plan/glm-5.1` model
  - Authenticated via `ZAI_API_KEY` secret
- Additional Qwen workflows in `.github/workflows/qwen-*.yml` for triage, review, invocation, dispatch, and scheduled triage

**Build Pipeline:**
- `npm run clean` — Removes `dist/` directory
- `npm run build` — Clean + `tsc` compile (`src/` → `dist/`)
- `npm run typecheck` — `tsc --noEmit` validation
- `npm run test` — Vitest run (all test suites)
- `npm run test:coverage` — Vitest with v8 coverage report
- `npm run prepack` — Auto-runs build before `npm pack`/`npm publish`

## Environment Configuration

**Required env vars (for MCP server operation):**
- `TAVILY_API_KEY` — Tavily web search
- `ZAI_API_KEY` — Z.AI web search/reader services
- `BRAVE_API_KEY` — Brave Search
- `GITHUB_PAT` — GitHub API operations
- `EXA_API_KEY` — Exa web search
- `NOTION_API_TOKEN` — Notion API access
- `SMITHERY_CLI_KEY` — Desktop Commander
- `NETLIFY_PAT` — Netlify deployment

**Optional env vars (harness runtime):**
- `OPENCODE_HARNESS_STATE_DIR` — Override state directory
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file
- `OPENCODE_SESSION_ID` — Injected by OpenCode platform (not user-set)

**Secrets location:**
- `.env` file at project root (gitignored)
- `.env.example` serves as template with placeholder values
- GitHub Actions secrets: `ZAI_API_KEY` (used by OpenCode workflow)

## Webhooks & Callbacks

**Incoming:**
- No incoming webhooks — harness uses polling-based completion detection (WaiterModel)
- `src/lib/completion-detector.ts` — Two-signal completion: session.idle + stability timer
- `src/lib/sdk-delegation.ts` — `SdkDelegationHandler` class with stability polling

**Outgoing:**
- No outgoing webhooks — all inter-session communication via OpenCode SDK API calls
- `src/lib/session-api.ts` — `sendPrompt()` and `sendPromptAsync()` for parent-child session communication
- `src/lib/delegation-manager.ts` — `DelegationManager` orchestrates dispatches and monitors completions via SDK polling

---

*Integration audit: 2026-04-28*

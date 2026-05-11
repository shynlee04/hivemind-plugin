# External Integrations

**Analysis Date:** 2026-05-12

## APIs & External Services

**OpenCode Plugin SDK (peer dependency):**
- `@opencode-ai/plugin` ^1.14.48 — Core plugin integration framework. Provides the `Plugin` type, `tool()` function, hook factories (`hooks.onCreateSession`, `hooks.preToolUse`, `hooks.postToolUse`, `hooks.onEvent`, etc.).
- Integration point: `src/plugin.ts` (composition root, 242 LOC) wires all tools and hooks.
- Integration point: `src/index.ts` (public API re-exports).

**OpenCode SDK (runtime dependency):**
- `@opencode-ai/sdk` ^1.14.48 — SDK client for OpenCode session management. Provides `client.session.create()`, `.get()`, `.prompt()`, `.promptAsync()`, `.abort()`, `.messages()`, `.status()`.
- Wrapper: `src/shared/session-api.ts` — typed wrappers around SDK client methods.
- Supervisor: `src/features/sdk-supervisor/index.ts` — health/diagnostic inspection of SDK wrapper seams.

**MCP Servers (development tooling — not shipped in package):**
18 MCP servers configured in `mcp.json` for development use:
- `notion` — Remote MCP over HTTPS (`https://mcp.notion.com/mcp`), Bearer token auth via `$NOTION_API_TOKEN`
- `stitch` — Remote MCP over HTTPS (`https://stitch.googleapis.com/mcp`)
- `gitmcp` — Remote MCP over HTTPS (`https://gitmcp.io`), 35s timeout
- `fetcher` — Local MCP via `npx -y fetcher-mcp`, 30s timeout
- `web-search-prime` — Remote MCP (`https://api.z.ai/api/mcp/web_search_prime/mcp`), Bearer auth via `$ZAI_API_KEY`
- `web-reader` — Remote MCP (`https://api.z.ai/api/mcp/web_reader/mcp`), Bearer auth via `$ZAI_API_KEY`
- `zread` — Remote MCP (`https://api.z.ai/api/mcp/zread/mcp`), Bearer auth via `$ZAI_API_KEY`
- `context7` — Remote MCP (`https://mcp.context7.com/mcp`)
- `deepwiki` — Remote MCP (`https://mcp.deepwiki.com/mcp`), 15s timeout
- `desktop-commander` — Local MCP via `npx -y @smithery/cli@latest run @wonderwhy-er/desktop-commander --key $SMITHERY_CLI_KEY`
- `exa` — Local MCP via `npx -y mcp-remote https://mcp.exa.ai/mcp`, env `EXA_API_KEY`
- `fetch` — Local MCP via `uvx mcp-server-fetch`
- `github` — Local MCP via `npx -y @modelcontextprotocol/server-github`, env `GITHUB_PERSONAL_ACCESS_TOKEN`
- `mcp-playwright` — Local MCP via `npx -y @playwright/mcp@latest`
- `memory` — Local MCP via `npx -y @modelcontextprotocol/server-memory`
- `netlify` — Local MCP via `npx -y @netlify/mcp`, env `NETLIFY_PERSONAL_ACCESS_TOKEN`
- `repomix` — Local MCP via `npx -y repomix --mcp`
- `sequential-thinking` — Local MCP via `npx -y @modelcontextprotocol/server-sequential-thinking`
- `tavily` — Remote MCP (`https://mcp.tavily.com/mcp/?tavilyApiKey=$TAVILY_API_KEY`), 35s timeout
- `brave-search` — Local MCP via `npx -y @brave/brave-search-mcp-server`, env `BRAVE_API_KEY`

MCP server schema definitions: `src/schema-kernel/mcp-server.schema.ts` — Zod schemas for local (`command + args`) and remote (`url + headers`) MCP server configurations, including optional OAuth fields.

**Sidecar Dashboard (separate package):**
- `sidecar/package.json` — Next.js 15 app (`@opencode-harness/sidecar@0.0.1`, private) for read-only dashboard.
- Uses `@json-render/react` for structured content rendering.
- Entrypoints: `sidecar/src/app/layout.tsx`, `sidecar/src/app/page.tsx`.

## Data Storage

**State Persistence:**
- Filesystem-based JSON state in `.hivemind/` directory — canonical state root.
- No external database, no cloud storage, no caching service.
- State directories:
  - `.hivemind/state/` — Session continuity, delegation records, workflow config.
  - `.hivemind/session-tracker/` — Session journals (per-session JSON files + session-continuity.json).
  - `.hivemind/delegation/` — Delegation records.
  - `.hivemind/event-tracker/` — Event tracker artifacts.
  - `.hivemind/configs.json` — Runtime configuration.

**File Storage:**
- Local filesystem only. No object storage, no CDN.

**Caching:**
- In-memory only — Config subscriber (`src/config/subscriber.ts`) caches parsed config in a module-level variable.

## Authentication & Identity

**Auth Provider:**
- Built-in OpenCode session identity — Plugin hooks receive `sessionID` from OpenCode runtime context.
- Delegation auth — `DelegationManager` in `src/coordination/delegation/manager.ts` handles session parent chain traversal and access control.
- No external OAuth/OIDC provider integrated into the harness package itself (MCP servers handle their own auth externally).

**Implementation:**
- Session identity extracted from OpenCode event metadata via `getEventSessionID()` in `src/shared/session-api.ts`.
- Behavioral profile resolution in `src/routing/behavioral-profile/` adapts session behavior based on profile.
- Runtime policy (`src/shared/runtime-policy.ts`) provides concurrency/budget/category-gate enforcement.

## Monitoring & Observability

**Error Tracking:**
- None integrated. Errors use `[Harness]` prefix convention on thrown errors and tool response error envelopes.
- All errors in hooks handled with best-effort try/catch (never block OpenCode runtime).

**Logs:**
- Console-based — `console.warn()` for non-blocking error reporting from hooks and background operations.
- No structured logging library, no log aggregation, no metrics collection.
- Session journals written to `.hivemind/session-tracker/` provide audit trail.

## CI/CD & Deployment

**Hosting:**
- npm registry — Package published as `hivemind`.
- Private package during development (distributed via npm registry).

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`:
  - Matrix: Node.js 20 and 22 on ubuntu-latest.
  - Steps: Checkout → Setup Node → `npm ci` → Type check → Build → Test.
  - Coverage report on Node 22 only.
  - Separate lint job: type-check only (run on Node 22).
- Branch triggers: `oss-dev` and `main` branches on push and pull_request.

**Other Workflows:**
- `.github/workflows/opencode.yml` — OpenCode-specific workflow.
- `.github/workflows/sync-oss.yml` — OSS sync workflow.
- `.github/workflows/qwen-*.yml` — 3 Qwen AI triage/dispatch workflows (qwen-triage, qwen-scheduled-triage, qwen-invoke, qwen-dispatch).

**Prepack:**
- `prepack` script runs `npm run build` automatically before `npm pack` / `npm publish`.

## Environment Configuration

**Required env vars (runtime package):**
- None required for build or test.

**Required env vars (MCP server configs in development):**
- `$NOTION_API_TOKEN` — Notion MCP auth
- `$ZAI_API_KEY` — z.ai MCP services (web-search-prime, web-reader, zread)
- `$SMITHERY_CLI_KEY` — Smithery CLI for desktop-commander MCP
- `$EXA_API_KEY` — Exa search MCP
- `$GITHUB_PAT` — GitHub MCP server
- `$NETLIFY_PAT` — Netlify MCP server
- `$TAVILY_API_KEY` — Tavily search MCP
- `$BRAVE_API_KEY` — Brave Search MCP

**Secrets location:**
- `.env` file present at project root (contains environment variable definitions — contents not inspected).
- MCP server configs in `mcp.json` reference env vars via `$VAR_NAME` syntax.

## Webhooks & Callbacks

**Incoming:**
- None. The harness is a plugin loaded into OpenCode, not a server. No HTTP endpoints.

**Outgoing:**
- OpenCode SDK callbacks through plugin hooks (event-driven). No external webhook delivery.

## Configuration File Integrations

**opencode.json:**
- Provider: `opencode-go` with reasoning model `deepseek-v4-pro` and small model `deepseek-v4-flash`.
- Secondary provider: `zai-codng-plan` with `glm-5.1` large model.
- Plugin: `superpowers@git+https://github.com/obra/superpowers.git` (development plugin) + `./dist/plugin.js` (built harness).
- Permissions: All major tool categories set to `allow`.

**.hivemind/configs.json:**
- Runtime configuration loaded at startup by `src/config/subscriber.ts`.
- Schema: `src/schema-kernel/hivemind-configs.schema.ts` (v2.0.0).
- Fields: Language, mode (expert-advisor/hivemind-powered/free-style), user level, delegation systems, workflow toggles.

---

*Integration audit: 2026-05-12*

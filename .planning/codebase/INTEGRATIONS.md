# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**AI Model Provider:**
- Osiris AI — LLM inference provider
  - SDK/Client: `@ai-sdk/openai-compatible` (referenced in `opencode.json`)
  - Auth: API key configured in `opencode.json` provider options
  - Endpoint: `https://ai.osiris-code.com/v1`
  - Models: Claude Opus 4.6, Claude Sonnet 4.5, GPT-5.4, GPT-5.5, DeepSeek V4 Pro, Gemini 3.1 Pro, GLM 5.1, GLM 5V Turbo, Kimi K2.6

**OpenCode Platform:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.28) — Plugin lifecycle hooks, tool registration, session events
  - Composition root: `src/plugin.ts` → `HarnessControlPlane` async factory
  - Hooks registered: `session.idle`, `session.error`, `session.deleted`, `tool.execute.before`, `tool.execute.after`
  - 18 custom tools registered via the `tool` namespace
  - Loaded via `opencode.json` → `./dist/plugin.js`

- OpenCode Client SDK (`@opencode-ai/sdk` ^1.14.28) — Programmatic session/agent operations
  - Wrapped in `src/shared/session-api.ts` (session CRUD, prompt, messages)
  - Wrapped in `src/shared/app-api.ts` (agent registry query)
  - Used by `src/coordination/delegation/manager.ts` for child session dispatch
  - Used by `src/task-management/lifecycle/index.ts` for session polling

- OpenCode GitHub Action — CI integration for issue/PR comments
  - Config: `.github/workflows/opencode.yml`
  - Trigger: `/oc` or `/opencode` in issue/PR comments
  - Model: `zai-coding-plan/glm-5.1`
  - Auth: `ZAI_API_KEY` GitHub secret

**Code Analysis:**
- ast-grep (^0.42.1) — Structural pattern-based code search
  - SDK: `@ast-grep/cli`, `@ast-grep/napi`
  - Used for codebase analysis and pattern matching
- Tree-sitter — Syntax-aware parsing
  - `tree-sitter-javascript` ^0.25.0, `web-tree-sitter` ^0.26.8
  - Used for code structure analysis

**MCP Protocol:**
- `@modelcontextprotocol/sdk` ^1.29.0 — Model Context Protocol library
  - Present in `package.json` dependencies
  - Not directly imported in `src/` source code (available for future MCP server implementation)
  - JSON-RPC foundation via `vscode-jsonrpc` ^8.2.1

## Data Storage

**Databases:**
- None — No SQL or NoSQL database dependencies. The harness is file-based.

**File Storage:**
- Local filesystem only — State persisted to `.hivemind/` directory at project root
  - Session continuity: `src/task-management/continuity/index.ts` → `.hivemind/state/`
  - Delegation records: `src/task-management/continuity/delegation-persistence.ts`
  - Event journals: `src/task-management/journal/` → `.hivemind/journal/`
  - Event tracker: `src/task-management/journal/event-tracker/`
  - Execution lineage: `src/task-management/journal/execution-lineage.ts`
  - Workflow config: `src/config/workflow/`

**Caching:**
- In-memory Maps only — `src/shared/state.ts` for task state
- No Redis, Memcached, or external cache dependencies

## Authentication & Identity

**Auth Provider:**
- Not applicable — The harness is a plugin loaded by OpenCode, not a standalone service. Authentication is delegated to the host OpenCode platform.

## Monitoring & Observability

**Error Tracking:**
- None — No external error tracking service (Sentry, Datadog, etc.)

**Logs:**
- Best-effort structured logging via event tracking (`src/task-management/journal/event-tracker/`)
- Session journal export tool (`src/tools/session/session-journal-export.js`)
- SDK supervisor health diagnostics (`src/tools/hivemind/hivemind-sdk-supervisor.js`)
- Console output only — no external log aggregation

## CI/CD & Deployment

**Hosting:**
- npm package — Published via `npm publish` / `npm pack`, entrypoints at `./dist/`
- GitHub repository: `https://github.com/shynlee04/hivemind-plugin.git`

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`
  - Runs on: push/PR to `oss-dev`, `main`
  - Matrix: Node.js 20, 22 on ubuntu-latest
  - Steps: `npm ci`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:coverage` (Node 22 only)
- Branch sync: `.github/workflows/sync-oss.yml`
  - Manual trigger (`workflow_dispatch`) to sync source changes from feature branch to `oss-dev`
  - Build verification before push
  - Auth: `PUBLIC_REPO_PAT` GitHub secret
- OpenCode CI: `.github/workflows/opencode.yml`
  - Triggered by issue/PR comments containing `/oc` or `/opencode`
  - Uses `anomalyco/opencode/github@latest` action

## Environment Configuration

**Required env vars (runtime):**
- None strictly required — defaults for all config paths

**Optional env vars:**
- `OPENCODE_SESSION_ID` — Current session ID (injected by OpenCode runtime)
- `OPENCODE_CONFIG_DIR` — Override OpenCode config directory (default: `~/.config/opencode`)
- `OPENCODE_HARNESS_STATE_DIR` — Override harness state directory
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — Max concurrent delegations (default: 3)
- `CI` — Forces non-interactive mode in CLI

**Secrets location:**
- GitHub Actions secrets for CI: `ZAI_API_KEY`, `PUBLIC_REPO_PAT`
- AI provider API key: configured in `opencode.json` (provider options)
- No `.env` file detected in repository

## Webhooks & Callbacks

**Incoming:**
- None — The harness has no HTTP server, no webhook endpoints

**Outgoing:**
- None — No outbound webhook calls to external services

## External Libraries (Summary)

| Library | Version | Category | Used In |
|---------|---------|----------|---------|
| @opencode-ai/sdk | ^1.14.28 | Platform SDK | `src/shared/session-api.ts` |
| @opencode-ai/plugin | ^1.14.28 | Platform Plugin | `src/plugin.ts` |
| @modelcontextprotocol/sdk | ^1.29.0 | Protocol | Available, not yet used |
| @ast-grep/napi | ^0.42.1 | Code Analysis | AST-based search |
| tree-sitter-javascript | ^0.25.0 | Code Analysis | Syntax parsing |
| bun-pty | ^0.4.8 | PTY | Background commands (optional) |
| node-pty | ^1.1.0 | PTY | Background commands (fallback) |
| @json-render/* | ^0.18.0 | UI | Sidecar dashboard |

---

*Integration audit: 2026-05-08*

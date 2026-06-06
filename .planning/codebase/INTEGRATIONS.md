# External Integrations

**Analysis Date:** 2026-06-06

Hivemind is a **plugin for OpenCode**. The plugin itself does not call any third-party API directly; it sits **on top of** the OpenCode platform SDK and orchestrates sessions, hooks, tools, and a local sidecar. All "external" dependencies below are either (a) the OpenCode platform peer contract, (b) the optional MCP server roster, or (c) the sidecar's local-only HTTP/WS loopback channels. The only third-party outbound transport in the runtime package is the OpenCode client SDK.

> **Secret handling note.** This document lists **where** secrets live and **which environment variable names** are read. It never quotes secret values. Actual keys live in `.env` (gitignored) and in CI repo secrets.

## APIs & External Services

**OpenCode Platform (the host runtime — peer dep):**
- `@opencode-ai/plugin` `^1.16.2` and `@opencode-ai/sdk` `^1.16.2` — Hivemind's only runtime contract. The platform exposes:
  - A `Plugin` registration shape (`src/plugin.ts` line 8: `import type { Plugin } from "@opencode-ai/plugin"`)
  - A `tool()` factory (`@opencode-ai/plugin/tool`) used by every tool in `src/tools/`
  - A typed client (`createOpencodeClient` from `@opencode-ai/sdk`) used in `src/shared/session-api.ts` and `src/coordination/sdk-delegation/handler.ts` for session creation, prompt dispatch, message reads, abort, TUI append, and child-session handling.
  - Auth: keys live in `.env` (e.g. `OPENCODE_API_KEY`) and are wired into `opencode.json#provider.options.apiKey` via `{env:OPENCODE_API_KEY}`.
  - Endpoints used: `session.create`, `session.get`, `session.prompt`, `session.messages`, `session.abort`, `tui.appendPrompt`, `tui.showToast`, `event.subscribe` (through hooks), and the hook surface (`PreToolUse`, `PostToolUse`, `session_start`, `session_end`, `session.idle` etc.).

**OpenCode AI Providers (declared in `opencode.json`):**
- `opencode` (OpenCode Zen) — `baseURL: https://opencode.ai/zen/v1`, `apiKey: {env:OPENCODE_API_KEY}`, model `big-pickle` (free).
- `CrofAI` — `baseURL: https://crof.ai/v1`, `apiKey: {env:CROFAI_API_KEY}`, 20 models including `deepseek-v4-pro`, `kimi-k2.6`, `glm-5.1`, `qwen3.5-397b-a17b`, etc. All under `@ai-sdk/openai-compatible` provider (`opencode.json` line 19).
- Auth: keys via env-var interpolation; no outbound call is made by Hivemind — these are OpenCode provider configs.

**CLI Prompts (third-party UI lib):**
- `@clack/prompts` `^1.4.0` — Local interactive prompts used by `src/cli/ui/prompts.ts` (`src/cli/commands/init.ts`, `doctor.ts`, etc.). Pure local UI; no network.

**MCP Servers (`.mcp.json` / `mcp.json` — workspace config for the OpenCode host):**
The plugin does not invoke MCP servers itself; it registers tools that the host can route through MCP. The following servers are wired in workspace config for the host OpenCode runtime:

- HTTP-transport MCP servers (all in `.mcp.json`):
  - `notion` — `https://mcp.notion.com/mcp`, auth `Bearer $NOTION_API_TOKEN`, timeout 15s.
  - `stitch` — `https://stitch.googleapis.com/mcp` (Google Stitch).
  - `gitmcp` — `https://gitmcp.io`, timeout 35s.
  - `web-search-prime` — `https://api.z.ai/api/mcp/web_search_prime/mcp`, auth `Bearer $ZAI_API_KEY`.
  - `web-reader` — `https://api.z.ai/api/mcp/web_reader/mcp`, auth `Bearer $ZAI_API_KEY`.
  - `zread` — `https://api.z.ai/api/mcp/zread/mcp`, auth `Bearer $ZAI_API_KEY`.
  - `context7` — `https://mcp.context7.com/mcp` (no auth header — public).
  - `deepwiki` — `https://mcp.deepwiki.com/mcp`, timeout 15s.
  - `tavily` — `https://mcp.tavily.com/mcp/?tavilyApiKey=$TAVILY_API_KEY`, timeout 35s.
- stdio-transport MCP servers (spawned via `npx` or `uvx`):
  - `fetcher` — `npx -y fetcher-mcp`, timeout 30s.
  - `desktop-commander` — `npx -y @smithery/cli@latest run @wonderwhy-er/desktop-commander --key $SMITHERY_CLI_KEY`.
  - `exa` — `npx -y mcp-remote https://mcp.exa.ai/mcp`, env `EXA_API_KEY`.
  - `fetch` — `uvx mcp-server-fetch`.
  - `github` — `npx -y @modelcontextprotocol/server-github`, env `GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PAT`.
  - `mcp-playwright` — `npx -y @playwright/mcp@latest`.
  - `memory` — `npx -y @modelcontextprotocol/server-memory` (in-process knowledge graph, no remote).
  - `netlify` — `npx -y @netlify/mcp`, env `NETLIFY_PERSONAL_ACCESS_TOKEN=$NETLIFY_PAT`.
  - `repomix` — `npx -y repomix --mcp`.
  - `sequential-thinking` — `npx -y @modelcontextprotocol/server-sequential-thinking`.
  - `brave-search` — `npx -y @brave/brave-search-mcp-server`, env `BRAVE_API_KEY`.

**Optional PTY backends (system binaries, not network services):**
- `bun-pty` `^0.4.8` — Lazy-loaded via `await import("./pty-manager.js")` inside `createPtyManagerIfSupported()` (`src/features/background-command/pty/pty-runtime.ts`). Calls `spawn` from `bun-pty`. Runtime requires Bun host; otherwise feature degrades to headless `node:child_process` (see `src/features/background-command/`).
- `tmux` (system binary) — Resolved via `resolveBinary()` in `src/features/tmux/integration.ts` using `which` (POSIX) or `where` (win32). Communicates with a tmux server over its local control socket; no network.

**Generative UI (sidecar only):**
- `@json-render/core` `^0.19.0` and `@json-render/react` `^0.19.0` (Vercel Labs) — Local-render framework in the sidecar workspace. No network; the catalog (`src/sidecar/catalog/json-render-catalog.json`) is loaded via Node's JSON import attributes and is local.
- `@json-render/shadcn` `^0.19.0` — Component definitions; static imports, no network.
- `@json-render/directives` `^0.19.0` — Static import; no network.
- `@json-render/ink` `^0.19.0`, `@json-render/next` `^0.19.0`, `@json-render/react-pdf` `^0.19.0` — Declared in `optionalDependencies` for future TUI / Next.js / PDF panels; not yet wired in `src/`.

## Data Storage

**Databases:**
- None. Hivemind ships no database. All persistent state is JSON files in `.hivemind/` (see below). The codebase has no Prisma, no Drizzle, no SQL, no Mongo, no Redis client.

**File Storage:**
- Local filesystem only. Persistent runtime state is written under `.hivemind/` at the project root (canonical per Q6). Subtrees in use:
  - `.hivemind/state/` — continuity JSON, lifecycle snapshots, sidecar port file (`sidecar-port.json`), tmux port file (`tmux-port.json`). See `src/task-management/continuity/index.ts`, `src/sidecar/server/factory.ts` (port file write), `src/features/tmux/integration.ts` (port file path constant).
  - `.hivemind/session-tracker/` — Active session ledger.
  - `.hivemind/journal/`, `.hivemind/lineage/`, `.hivemind/registries/`, `.hivemind/manifests/`, `.hivemind/hf-brain/`, `.hivemind/daily-notes/`, `.hivemind/onboarding/`, `.hivemind/research/`, `.hivemind/audit/`, `.hivemind/audits/`, `.hivemind/artifacts/`, `.hivemind/logs/`, `.hivemind/uat/` — directories declared in `.gitignore` for runtime-only data.
  - `.hivemind/configs.json` and `.hivemind/configs.schema.json` — Committed project configs; schema is generated by `dist/schema-kernel/generate-config-json-schema.js` at build time.
  - `.hivemind/STACKS-REFERENCES.md` — Committed reference of package versions + GitHub repo URLs.
- Legacy compatibility: `.opencode/state/opencode-harness/` is still read through a compatibility bridge (per Q6 migration notes in `AGENTS.md`).
- No S3, no GCS, no Azure Blob, no Supabase Storage client.

**Caching:**
- None. There is no Redis or in-process LRU. The continuity store is the closest thing to a cache: a dual-layer state store (`src/task-management/continuity/`) that holds both a durable JSON file and an in-memory `Map`. There is no eviction policy beyond app restart.

## Authentication & Identity

**Auth Provider:**
- None for Hivemind itself. The plugin does not authenticate end users.
- Authentication for outbound model calls is handled by the OpenCode host runtime through its provider config (`opencode.json` lines 17-201), not by Hivemind.

**OAuth Integrations:**
- None. The plugin does not perform OAuth flows. The MCP server roster in `.mcp.json` brings OAuth-style access (e.g. GitHub, Netlify) but only via the `GITHUB_PAT` / `NETLIFY_PAT` personal access tokens (PATs), not OAuth 2.0 grants.

**Session Auth (OpenCode):**
- The OpenCode platform handles its own session identity. Hivemind sessions are scoped to OpenCode's `sessionID` format (validated in `src/shared/session-api.ts:36-42` — must start with `ses`).
- When `NODE_ENV === "test"`, validation is relaxed to allow `child-*` / `parent-*` test session IDs (line 33).

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry SDK, no Rollbar, no Bugsnag, no OpenTelemetry exporter in `src/`. Errors are surfaced through the standard OpenCode tool envelope (`src/shared/tool-response.ts`) and through the hook observer chain (`src/hooks/observers/`).

**Analytics:**
- None. No product analytics SDK is declared in `package.json` dependencies or devDependencies.

**Logs:**
- Console only. There is no centralized log sink. Log lines flow through `console` / `process.stderr`; TUI-visible status lines are emitted by `src/plugin.ts` lines 334-353 through a `Logger` adapter.
- A dedicated `tmux-integration` log channel exists in `src/plugin.ts` lines 326-353 (`debug` / `info` / `warn` / `error` levels), but it writes to the OpenCode TUI log surface, not an external sink.

**SDK Supervisor (in-process):**
- `src/features/sdk-supervisor/index.ts` (`SdkSupervisor` class) provides in-process health, heartbeat, diagnostics, and readiness for the SDK wrappers. It is **not** a remote monitoring tool — it is a self-diagnostic surface exposed via the `hivemind-sdk-supervisor` tool.

## CI/CD & Deployment

**Hosting:**
- npm registry — `publishConfig.registry: https://registry.npmjs.org/`. Package name: `hivemind-3.0`. Released via `.github/workflows/publish.yml` (tag-pushed `v*` or `workflow_dispatch` with a `dry_run` flag).
- Sidecar (`@opencode-harness/sidecar`) is private and **not** published. It is a developer-local dashboard reachable at `http://127.0.0.1:3099` by default (overridable via `PORT`).
- No Vercel, no AWS, no GCP, no Docker image. The harness is a Node.js npm package consumed by the OpenCode runtime.

**CI Pipeline (`.github/workflows/`):**
- `ci.yml` — Matrix build on `ubuntu-latest` for Node 20 and Node 22: install (`npm ci`), typecheck (`npm run typecheck`), build (`npm run build`), test (`npm test`), coverage (`npm run test:coverage`, only on Node 22). Triggers on push / PR to `oss-dev` and `main`. Separate `lint-check` job runs `tsc --noEmit`.
- `publish.yml` — On tag `v*` or `workflow_dispatch`: `npm ci` → `typecheck` → `test` → `build` → `npm pack --dry-run` content checks (no `assets/.hivemind/` package contents, no source maps) → `npm publish` (or `--dry-run`).
- `opencode.yml` — Comment-triggered `/oc` or `/opencode` invocations; runs `anomalyco/opencode/github@latest` against PR comments using `ZAI_API_KEY` and model `zai-coding-plan/glm-5.1`.
- `sync-oss.yml` — OSS sync from internal → public branch (see `docs/draft/architecture-proposal-hivemind-v3.md`).
- `qwen-*.yml` — Qwen dispatch / invoke / triage / scheduled-triage workflows for repo automation.
- Required secrets in CI: `NPM_TOKEN` (publish), `ZAI_API_KEY` (opencode job).

**MCP Server Auth Tokens (developer-local):**
- `NOTION_API_TOKEN`, `EXA_API_KEY`, `ZAI_API_KEY`, `NETLIFY_PAT`, `SMITHERY_CLI_KEY`, `BRAVE_API_KEY`, `GITHUB_PAT`, `TAVILY_API_KEY`, `OPENCODE_API_KEY`, `CROFAI_API_KEY`, `OPENCODE_GO_API_KEY` — all read from `.env` at runtime. None are embedded in the shipped package.

## Environment Configuration

**Runtime environment variables read by the plugin** (search-confirmed in `src/`):
- `OPENCODE_HARNESS_STATE_DIR` — Override default state directory. Default: `<projectRoot>/.hivemind/state/`.
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file path. Default: `<stateDir>/session-continuity.json`.
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — Integer, default `3` (`src/task-management/lifecycle/index.ts:80`).
- `OPENCODE_CONFIG_DIR` — Override `.opencode/` config directory. Default: `~/.config/opencode/` (or `XDG_CONFIG_HOME`).
- `OPENCODE_GLOBAL_CONFIG_DIR` — Same as above, alternative name.
- `TMUX` — When set, indicates the host is running inside a tmux session and enables tmux integration. If unset, `createTmuxIntegrationIfSupported` skips the integration silently (`src/features/tmux/integration.ts:460-461`).
- `PATH`, `HOME`, `TERM`, `LANG`, `PWD` — Read by `createGovernanceSession` (`src/features/governance-engine/create-governance-session.ts:177-181`) and propagated to the child process environment.
- `CI` — Set in CI environments; consumed by `src/cli/commands/init.ts:58,94` to disable interactive prompts and force `--yes`.
- `NODE_ENV` — Standard; test runs read `NODE_ENV === "test"` in `src/shared/session-api.ts:33` and `src/tools/session/execute-slash-command.ts:446` to relax ID validation and test-blocking behavior.
- `PORT` — Sidecar HTTP port; default `3099` (`sidecar/next.config.ts:21`).

**Development:**
- Required env vars: none for the package itself. `.env` is optional — the plugin will start and most tools will work without it, but MCP-backed tools will be unavailable.
- Secrets location: `.env` at repo root (gitignored). The full list of recognized keys is documented in `.env` comments (lines 1-22).
- Mock/stub services: `vitest.setup.ts` (lines 1-6) creates a fresh temp state dir and sets `OPENCODE_HARNESS_STATE_DIR` per test process, isolating tests from any real state.

**Production:**
- Secrets management: `.env` at the consumer's project root. No remote secret store.
- Failover / redundancy: none. The plugin runs in-process inside the OpenCode host; there is no separate deployment.

## Webhooks & Callbacks

**Incoming:**
- None. The plugin does not expose any inbound HTTP/WS endpoint. The sidecar **does** expose a localhost HTTP server (random port bound to `127.0.0.1:0` in `src/sidecar/server/factory.ts`) and a WebSocket pool (`src/sidecar/server/ws/pool.ts`), but these are **loopback-only** (not internet-facing) and are used by the Next.js dashboard, not by external services.
- The sidecar `/health` endpoint returns `{ status: "ok", uptime: <ms> }` (`src/sidecar/server/factory.ts:60-63`).

**Outgoing:**
- OpenCode session prompts — `client.session.prompt` is the closest analogue to an outgoing webhook: the plugin sends prompts to the OpenCode host, which forwards to the configured LLM provider. This is bidirectional OpenCode protocol, not a generic webhook.
- Sidecar port-file write — `src/sidecar/server/factory.ts:88-97` writes `.hivemind/state/sidecar-port.json` to let the Next.js dashboard discover the loopback port. File-system "callback", not HTTP.
- Tmux port file — `src/features/tmux/integration.ts:37` (`PORT_FILE = ".hivemind/state/tmux-port.json"`) — same pattern, file-system discovery.

---

*Integration audit: 2026-06-06*
*Update when adding/removing external services*

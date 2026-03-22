# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**AI runtime / agent host:**
- OpenCode runtime - core execution host for both control-plane and plugin-plane behavior
  - SDK/Client: `@opencode-ai/sdk` in `src/control-plane/sdk-runtime.ts`, `src/tui/sse.ts`, and `tests/runtime-authority-live-sanity.test.ts`
  - Auth: not hard-coded in repo source; server attachment uses `OPENCODE_SERVER_URL` in `src/features/runtime-entry/harness.ts`

**Plugin host integration:**
- OpenCode plugin surface - shipped plugin export consumed from `hivemind-context-governance/plugin`
  - SDK/Client: `@opencode-ai/plugin` in `src/plugin/opencode-plugin.ts` and `src/tools/runtime/tools.ts`
  - Auth: delegated to the host OpenCode runtime; no repo-owned token exchange detected in `src/plugin/opencode-plugin.ts`

**Model/provider configuration:**
- Minimax provider - configured as the active provider in `opencode.json`
  - SDK/Client: OpenCode provider config in `opencode.json`
  - Auth: `MINIMAX_API_KEY`
- OpenAI model limits - repo-level OpenCode model config for `gpt-5.4` in `opencode.json`
  - SDK/Client: OpenCode provider config in `opencode.json`
  - Auth: not specified in repo-level `opencode.json`; resolved by the user's OpenCode provider setup

**Workspace MCP services (local dev config):**
- DeepWiki MCP - enabled remote MCP endpoint in `.opencode/opencode.json`
  - SDK/Client: remote MCP config in `.opencode/opencode.json`
  - Auth: not specified in the file
- Context7 MCP - configured but disabled in `.opencode/opencode.json`
  - SDK/Client: remote MCP config in `.opencode/opencode.json`
  - Auth: not specified in the file
- Tavily MCP - configured but disabled in `.opencode/opencode.json`
  - SDK/Client: remote MCP config in `.opencode/opencode.json`
  - Auth: not specified in the file
- Exa MCP - placeholder endpoint configured but disabled in `.opencode/opencode.json`
  - SDK/Client: remote MCP config in `.opencode/opencode.json`
  - Auth: endpoint not finalized in the file
- Repomix MCP - local `npx repomix --mcp` integration configured but disabled in `.opencode/opencode.json`
  - SDK/Client: local command config in `.opencode/opencode.json`
  - Auth: not applicable

**Ancillary search tooling:**
- Brave Search API - optional web search for bundled GSD helper scripts in `get-shit-done/bin/lib/commands.cjs`
  - SDK/Client: direct `fetch()` call to `https://api.search.brave.com/res/v1/web/search` in `get-shit-done/bin/lib/commands.cjs`
  - Auth: `BRAVE_API_KEY`

**Package and source hosting:**
- GitHub repository - canonical source host in `package.json`, with CI and releases in `.github/workflows/*.yml`
  - SDK/Client: git remote metadata in `package.json`; GitHub Actions in `.github/workflows/ci.yml` and `.github/workflows/publish.yml`
  - Auth: GitHub-hosted workflow token `GITHUB_TOKEN` in `.github/workflows/publish.yml`
- npm registry - package publish target in `.github/workflows/publish.yml`
  - SDK/Client: `npm publish` in `.github/workflows/publish.yml`
  - Auth: `NPM_TOKEN`

## Data Storage

**Databases:**
- Not detected
  - Connection: Not applicable
  - Client: Not applicable

**File Storage:**
- Local filesystem only
  - Runtime state persists under `.hivemind/**` via path authority in `src/shared/paths.ts`
  - Runtime attachment settings persist as JSON in `src/features/runtime-entry/attachment.persistence.ts`
  - Command/agent/skill mirrors are written into `.opencode/**` by `src/features/runtime-observability/sync.ts`

**Caching:**
- None detected as a dedicated external cache service

## Authentication & Identity

**Auth Provider:**
- OpenCode host-managed auth/config - the repo relies on OpenCode runtime/provider configuration rather than a custom auth service
  - Implementation: provider and plugin configuration in `opencode.json`; permission mediation through the `permission.ask` hook in `src/plugin/opencode-plugin.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected for external SaaS error tracking

**Logs:**
- Console logging plus OpenCode app log forwarding in `src/shared/logging.ts`
- Runtime health probing against `/global/health` in `src/features/runtime-entry/harness.ts`

## CI/CD & Deployment

**Hosting:**
- npm package distribution for `hivemind-context-governance` from `package.json`
- Runtime deployment target is an OpenCode-managed or attached server lifecycle in `src/control-plane/sdk-runtime.ts`

**CI Pipeline:**
- GitHub Actions CI on `master` in `.github/workflows/ci.yml`
- GitHub Actions preview CI on `dev-v3` in `.github/workflows/dev-v3.yml`
- GitHub Actions release + npm publish in `.github/workflows/publish.yml`

## Environment Configuration

**Required env vars:**
- `MINIMAX_API_KEY` - provider key in `opencode.json`
- `OPENCODE_SERVER_URL` - optional runtime server override in `src/features/runtime-entry/harness.ts`
- `HIVEMIND_DEBUG` - enables debug logs in `src/shared/logging.ts`
- `BRAVE_API_KEY` - optional only for ancillary `get-shit-done` web search in `get-shit-done/bin/lib/commands.cjs`
- `NPM_TOKEN` - npm publish workflow secret in `.github/workflows/publish.yml`
- `GITHUB_TOKEN` - GitHub release workflow secret in `.github/workflows/publish.yml`

**Secrets location:**
- Repo-level provider config references env interpolation in `opencode.json`
- CI secrets are sourced from GitHub Actions secrets in `.github/workflows/publish.yml`
- A root `.env` file exists at `.env`; contents were not read

## Webhooks & Callbacks

**Incoming:**
- OpenCode health endpoint probe at `/global/health` in `src/features/runtime-entry/harness.ts`
- OpenCode event subscription stream through `client.event.subscribe()` in `src/tui/sse.ts`

**Outgoing:**
- Brave Search HTTPS request from `get-shit-done/bin/lib/commands.cjs`
- npm publish and npm version lookup in `.github/workflows/publish.yml`
- GitHub release creation in `.github/workflows/publish.yml`

---

*Integration audit: 2026-03-21*

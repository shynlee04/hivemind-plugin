# External Integrations

**Analysis Date:** 2026-05-15

## APIs & External Services

**OpenCode Platform:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.41) — plugin lifecycle, tool/hook registration, session surfaces
- OpenCode Client SDK (`@opencode-ai/sdk` ^1.14.41) — session API wrapper, SDK delegation, app logging
  - Auth: inherited from OpenCode runtime (no separate auth layer in Hivemind)
  - Client type: `OpencodeClient` (imported via `@opencode-ai/sdk`)

**Model Context Protocol:**
- MCP SDK (`@modelcontextprotocol/sdk` ^1.29.0) — MCP server/client protocol support
  - Schema: `src/schema-kernel/mcp-server.schema.ts` — MCP server configuration validation

**AST Analysis Services:**
- AST-grep (`@ast-grep/napi` ^0.42.1, `@ast-grep/cli` ^0.42.1) — structural code search and analysis
- Tree-sitter (`web-tree-sitter` ^0.26.8, `tree-sitter-javascript` ^0.25.0) — incremental parsing for doc intelligence

## Data Storage

**Databases:**
- None — Hivemind is a stateless runtime plugin with no database dependencies

**File Storage (Local Persistence):**
- `.hivemind/state/` — canonical runtime state root (session continuity, delegation records, journals, trajectory, execution lineage)
- `.hivemind/journal/` — append-only session journal (event timeline, independent of continuity)
- `.hivemind/configs/` — workspace-level Hivemind configuration
- `.hivemind/configs.schema.json` — shipped JSON Schema for config validation
- `.hivemind/event-tracker/` — legacy directory (migrated to `.hivemind/state/` via one-shot migration in `src/plugin.ts`)

**File Storage (Soft Meta-Concepts):**
- `.opencode/` — OpenCode primitives (agents, commands, skills, rules, permissions) — runtime configuration only, NO state storage
- `.hivefiver-meta-builder/` — canonical source-of-truth for authored primitives (skills-lab, agents-lab, commands-lab)

**Caching:**
- None — no external caching service; in-memory Maps used for session state (`src/shared/state.ts`)

## Authentication & Identity

**Auth Provider:**
- None — Hivemind inherits authentication from the OpenCode host runtime
- No standalone auth layer, no API keys, no OAuth flows within the plugin

**Secret Handling:**
- `src/shared/security/redaction.ts` — credential redaction for persistence/output boundaries
  - Patterns: API keys, tokens, passwords, secrets, authorization headers
  - Placeholders: `[REDACTED:API_KEY]`, `[REDACTED:TOKEN]`, `[REDACTED:PASSWORD]`, `[REDACTED:SECRET]`
  - Preserve fields: id, sessionId, delegationId, queueKey, ptySessionId, status, timestamp, etc.

## Monitoring & Observability

**Error Tracking:**
- None — no external error tracking service (Sentry, Datadog, etc.)

**Logs:**
- OpenCode app logging via `client.app?.log?.()` — structured JSON logging with service/level/message/extra fields
- Services identified in logs: `session-tracker`, `migration`, `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`
- All log messages prefixed with `[Harness]` for identification

**Runtime Pressure:**
- `src/features/runtime-pressure/` — internal pressure scoring and control-plane decisions
- Authority matrix for tool mutation classification
- Control-plane integration for session lifecycle decisions

## CI/CD & Deployment

**Hosting:**
- npm registry — published as `hivemind` package
- GitHub repository: `github.com/shynlee04/hivemind-plugin`

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`
  - Triggers: push/PR to `oss-dev` and `main`
  - Jobs: build-and-test (Node 20, 22), lint-check (Node 22)
  - Steps: checkout → setup-node → npm ci → typecheck → build → test → coverage (Node 22 only)

**Additional Workflows:**
- `.github/workflows/opencode.yml` — OpenCode-specific workflow
- `.github/workflows/qwen-dispatch.yml`, `qwen-invoke.yml`, `qwen-triage.yml`, `qwen-scheduled-triage.yml` — Qwen model integration workflows
- `.github/workflows/sync-oss.yml` — OSS sync workflow

## Environment Configuration

**Required env vars:**
- None required for build/test
- `OPENCODE_HARNESS_STATE_DIR` — optional: override `.hivemind/state/` location
- `OPENCODE_HARNESS_CONTINUITY_FILE` — optional: override continuity file location
- `OPENCODE_SESSION_ID` — optional: fallback session identification

**Secrets location:**
- `.env` file present at project root (existence noted, contents never read)
- Host project's `.opencode/` configuration manages runtime secrets
- Hivemind performs credential redaction at persistence boundaries (`src/shared/security/redaction.ts`)

## Webhooks & Callbacks

**Incoming:**
- None — Hivemind does not expose HTTP endpoints or webhook receivers
- Plugin lifecycle managed entirely through OpenCode hook surfaces

**Outgoing:**
- None — no outbound webhook callbacks from the plugin

## PTY / Process Management

**PTY Backend:**
- `bun-pty` ^0.4.8 — primary PTY backend (optional dependency)
- `node-pty` ^1.1.0 — native PTY fallback
- Graceful fallback: when `bun-pty` is absent or fails to load, falls back to headless `node:child_process`
- PTY sessions are non-resumable after harness restart (OS PTY processes do not survive parent restart)

**Process Lifecycle:**
- `src/features/background-command/pty/` — PTY manager, runtime, buffer
- `src/tools/hivemind/run-background-command.ts` — tool entrypoint for background command execution

## Sidecar Dashboard

**Next.js Sidecar:**
- `sidecar/` — read-only dashboard application (Phase 42 foundation)
- Next.js ^15.0.0, React ^19.0.0, `@json-render/react` ^0.1.0
- Configuration: `sidecar/next.config.ts` (reactStrictMode, read-only enforcement)
- Status: UI deferred to SIDECAR-01/02 follow-up phases
- Constraint: sidecar must NEVER bundle harness write paths

---

*Integration audit: 2026-05-15*

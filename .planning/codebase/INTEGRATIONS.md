---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
---

# External Integrations

**Analysis Date:** 2026-05-20

## APIs & External Services

**OpenCode Runtime:**
- OpenCode Plugin SDK — `@opencode-ai/plugin` `^1.15.5` is the host integration for `src/plugin.ts` and tool factories in `src/tools/**`.
  - SDK/client package: `@opencode-ai/plugin`.
  - Auth: inherited from the OpenCode host runtime; Hivemind does not implement a separate login or token flow.
- OpenCode Client SDK — `@opencode-ai/sdk` `^1.15.5` is wrapped in `src/shared/session-api.ts` and `src/shared/app-api.ts`.
  - Used for session create/get/messages/prompt/promptAsync/abort/status, TUI append/toast, and app agent registry reads.
  - Provider/model inheritance is handled in delegation coordination code under `src/coordination/delegation/`.

**OpenAI-Compatible Provider Configuration:**
- `opencode.json` defines a CrofAI provider using npm package `@ai-sdk/openai-compatible`.
  - Base URL: configured in `opencode.json` as a provider option.
  - Auth: environment variable reference `CROFAI_API_KEY` in `opencode.json`; only the env var name is documented here, not any secret value.
  - Models: CrofAI model IDs are configured in `opencode.json` for OpenCode runtime use.

**Model Context Protocol:**
- MCP configuration schema is implemented in `src/schema-kernel/mcp-server.schema.ts`.
  - Local servers: `{ type: "local", command, environment?, enabled?, timeout? }`.
  - Remote servers: `{ type: "remote", url, headers?, oauth?, enabled?, timeout? }`.
  - Registry shape: `opencode.json` `mcp` object, loaded by `src/features/bootstrap/primitive-loader.ts`.
- Dependency: `@modelcontextprotocol/sdk` `^1.29.0` in `package.json`.

**OpenCode Primitive Loading:**
- Project primitive surface: `.opencode/` for agents, commands, skills, rules, permissions, and plugin loader configuration.
- Bootstrap loader: `src/features/bootstrap/primitive-loader.ts` scans `.opencode/` and reads `opencode.json`.
- Global OpenCode config target: `OPENCODE_CONFIG_DIR` or `~/.config/opencode` through `src/tools/config/configure-primitive-paths.ts`, `src/tools/config/bootstrap-init.ts`, `src/tools/config/bootstrap-recover.ts`, and `src/config/compiler.ts`.

## Data Storage

**Databases:**
- Not detected. There is no SQL/NoSQL database dependency in `package.json`.

**Durable Local State:**
- `.hivemind/state/` — canonical internal runtime state root used by session/delegation/trajectory/policy surfaces.
- `.hivemind/configs.json` — runtime configuration file read by `src/schema-kernel/hivemind-configs.schema.ts` and cached by `src/config/subscriber.ts`.
- `.hivemind/state/hivemind.runtime-policy.json` — optional runtime policy read by `src/shared/workspace-runtime-policy.ts`.
- `.hivemind/configs.schema.json` — generated schema shipped by package files and produced during `npm run build`.
- `.hivemind/session-tracker/` — session tracker persistence root referenced by `src/features/session-tracker/persistence/atomic-write.ts`.

**Soft Meta-Concept Storage:**
- `.opencode/` — OpenCode configurable primitives only; not an internal runtime state store.
- `.hivefiver-meta-builder/` — source-of-truth authoring area for generated/reflected primitives according to project guidance.

**Caching:**
- No external cache service detected.
- Runtime uses in-memory Maps and module-level caches, including `src/config/subscriber.ts` for config caching and `src/shared/state.ts` for task/session state.

## Authentication & Identity

**Auth Provider:**
- No standalone auth provider detected.
- OpenCode host runtime owns authentication/identity for SDK/plugin execution.
- Provider secrets are passed through OpenCode config environment references such as `CROFAI_API_KEY` in `opencode.json`.

**Secret Handling:**
- `.env` exists at repository root; contents were not read or copied.
- Redaction utilities live in `src/shared/security/redaction.ts`.
- Redaction detects field names matching API keys, tokens, passwords, secrets, authorization, and credentials.
- Safe placeholders include `[REDACTED:API_KEY]`, `[REDACTED:TOKEN]`, `[REDACTED:PASSWORD]`, and `[REDACTED:SECRET]`.

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service detected in `package.json`.

**Logs:**
- OpenCode app logging is used through `client.app?.log?.()` in `src/plugin.ts` and SDK wrappers.
- Startup diagnostic logs from `src/plugin.ts` identify service `hivemind` and use `[Harness]` messages.
- Tool/runtime services such as session tracker, migration, trajectory, pressure, SDK supervisor, and command engine log through OpenCode app surfaces.

**Runtime Diagnostics:**
- SDK supervisor tool: `src/tools/hivemind/hivemind-sdk-supervisor.ts`.
- Pressure tool/model: `src/tools/hivemind/hivemind-pressure.ts` and `src/features/runtime-pressure/`.
- Session and lineage exports: `src/tools/hivemind/session-tracker.ts`, `src/tools/hivemind/session-hierarchy.ts`, `src/tools/hivemind/session-context.ts`, and `src/tools/session/session-journal-export.ts`.

## CI/CD & Deployment

**Hosting / Distribution:**
- npm package name: `hivemind` in `package.json`.
- Repository metadata: GitHub repository URL in `package.json` points to `shynlee04/hivemind-plugin`.

**CI Pipeline:**
- `.github/workflows/ci.yml` runs install, typecheck, build, tests, and coverage.
- Node matrix: 20 and 22.
- Branches: `oss-dev` and `main` for push and pull request triggers.

**Additional GitHub Workflows:**
- `.github/workflows/opencode.yml` — OpenCode workflow integration.
- `.github/workflows/qwen-dispatch.yml`, `.github/workflows/qwen-invoke.yml`, `.github/workflows/qwen-triage.yml`, `.github/workflows/qwen-scheduled-triage.yml` — Qwen-related automation.
- `.github/workflows/sync-oss.yml` — OSS sync automation.

## Environment Configuration

**Required env vars:**
- None required for local build/test according to `package.json` scripts.

**Runtime/env vars used by code or config:**
- `CROFAI_API_KEY` — referenced by `opencode.json` provider config for CrofAI.
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — optional lifecycle concurrency override in `src/task-management/lifecycle/index.ts`.
- `OPENCODE_CONFIG_DIR` — optional global OpenCode config root used by config/bootstrap/compiler modules.
- `HOME` — fallback base for `~/.config/opencode` resolution in config/bootstrap modules.
- `CI` — non-interactive CLI mode detection in `src/cli/commands/init.ts`.
- `NODE_ENV` — test-only session ID allowance in `src/shared/session-api.ts`.

**Secrets location:**
- `.env` file present; existence only noted.
- OpenCode provider config uses environment variable interpolation rather than checked-in secret values.
- Do not copy values from `.env`, `.opencode/state/`, or any credential-bearing files into planning docs.

## Webhooks & Callbacks

**Incoming:**
- No HTTP webhook receiver detected.
- Runtime entry is OpenCode plugin/hook/tool lifecycle through `src/plugin.ts`.

**Outgoing:**
- No outbound webhook callback system detected.
- Outbound calls are OpenCode SDK calls through `src/shared/session-api.ts` and OpenCode app/TUI calls through SDK client surfaces.

## PTY / Process Management Integrations

**Bun PTY:**
- `src/features/background-command/pty/pty-manager.ts` imports `bun-pty` and checks `globalThis.Bun` in `isSupported()`.
- `src/features/background-command/pty/pty-runtime.ts` safely returns `null` if PTY support cannot be loaded.

**Headless Process Fallback:**
- `src/coordination/command-delegation/handler.ts` imports `node:child_process` and dispatches headless commands when PTY is unavailable or fails.
- Headless output is bounded by `MAX_HEADLESS_OUTPUT_CHARS` in `src/coordination/command-delegation/handler.ts`.

**Background Command Tool:**
- Tool entrypoint: `src/tools/hivemind/run-background-command.ts`.
- Feature storage is in memory for active processes; terminal delegation records are persisted through delegation/continuity callbacks, not directly by command delegation.

## Sidecar Dashboard Integration

**Read-Only Dashboard:**
- Sidecar app path: `sidecar/`.
- Next.js config: `sidecar/next.config.ts` with `reactStrictMode: true`.
- Read-only enforcement surface: `src/sidecar/readonly-state.ts`.
- Constraint: sidecar must not bundle harness write paths.

## Configuration Contracts

**Hivemind Config:**
- Schema version: `HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"` in `src/schema-kernel/hivemind-configs.schema.ts`.
- Default mode: `expert-advisor`.
- Delegation toggles: `native_task`, `delegate_task`, and `background_delegation` in `src/schema-kernel/hivemind-configs.schema.ts`.
- Config reader is lenient: missing or invalid `.hivemind/configs.json` falls back to defaults in `readConfigs()`.

**OpenCode Config:**
- Root config file: `opencode.json`.
- Plugin path: `./dist/plugin.js`.
- Instructions path: `.opencode/rules/universal-rules.md`.
- Compaction settings are declared in `opencode.json`.

---

*Integration audit: 2026-05-20*

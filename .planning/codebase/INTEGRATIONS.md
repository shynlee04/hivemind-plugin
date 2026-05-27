# External Integrations

**Analysis Date:** 2026-05-28

## OpenCode SDK Integration

**Plugin Interface:**
- `@opencode-ai/plugin` >= 1.15.10 — Peer dependency providing `Plugin` type
- Plugin exported as `HarnessControlPlane` from `src/plugin.ts`
- Plugin receives `{ client, directory }` from OpenCode runtime

**SDK Client (`@opencode-ai/sdk` ^1.15.10):**
- `src/shared/session-api.ts` — Thin wrapper around SDK session operations
- Operations: `createSession`, `getSession`, `sendPrompt`, `sendPromptAsync`, `abortSession`, `getSessionMessages`, `walkParentChain`
- TUI integration: `appendTuiPrompt`, `showTuiToast` for user notifications
- Type: `OpenCodeClient = ReturnType<typeof createOpencodeClient>`

**Plugin Registration:**
- Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
- Registers 23+ custom tools and lifecycle hooks
- Entry: `src/plugin.ts` → `HarnessControlPlane` function

## Hook System

**Lifecycle Hooks (from `src/hooks/`):**
- `src/hooks/lifecycle/core-hooks.ts` — Core plugin lifecycle (session.created, session.updated, session.deleted, session.idle, session.error)
- `src/hooks/lifecycle/session-hooks.ts` — Session-specific read hooks
- `src/hooks/guards/tool-guard-hooks.ts` — Circuit breaker + budget guard before tool execution
- `src/hooks/observers/event-observers.ts` — Delegation events, session entry, session-is-main observers
- `src/hooks/transforms/tool-after-composer.ts` — Post-tool output composition
- `src/hooks/transforms/tool-before-guard.ts` — Pre-tool guard + session tracker detection
- `src/hooks/transforms/chat-message-capture.ts` — Message capture for session tracking
- `src/hooks/transforms/tool-after-workflow.ts` — Post-tool workflow state persistence

**Hook Surfaces Used:**
- `tool.execute.before` — Guard + session tracker detection
- `tool.execute.after` — Workflow state persistence + session tracking
- `chat.message` — Message capture + delegation signal recording
- Event observers for session lifecycle events

## Tool Registration

**Registered Tools (from `src/plugin.ts`):**
- `delegate-task` — Subagent delegation with WaiterModel dispatch
- `delegation-status` — Delegation polling and status checking
- `run-background-command` — Background PTY/non-PTY command execution
- `prompt-skim` — Prompt content scanning
- `prompt-analyze` — Prompt contradiction/vagueness analysis
- `session-patch` — Session file section patching
- `execute-slash-command` — OpenCode slash command dispatch
- `session-journal-export` — Session journal export
- `hivemind-doc` — Document intelligence (skim, read, chunk, search)
- `hivemind-trajectory` — Trajectory ledger inspection
- `hivemind-pressure` — Runtime pressure classification
- `hivemind-sdk-supervisor` — SDK wrapper health checks
- `hivemind-command-engine` — Command bundle discovery and routing
- `session-tracker` — Session knowledge capture and query
- `session-hierarchy` — Session parent/child chain navigation
- `session-context` — Cross-session context synthesis
- `hivemind-session-view` — Unified session view across data roots
- `hivemind-agent-work-create` — Agent work contract creation
- `hivemind-agent-work-export` — Work contract export
- `configure-primitive` — OpenCode primitive (agent/command/skill) configuration
- `validate-restart` — Post-compile validation
- `bootstrap-init` — Project initialization
- `bootstrap-recover` — Symlink repair
- `create-governance-session` — Governance session creation

## MCP Server Support

**Schema Definition:**
- `src/schema-kernel/mcp-server.schema.ts` — Zod schemas for MCP server config
- Supports two transport types: `local` (child process) and `remote` (HTTP/HTTPS)
- Registry type: `MCPServerRegistry = Record<string, MCPServerConfig>`

**Local MCP Servers:**
- Spawned as child processes via `command` array (e.g., `["npx", "-y", "pkg"]`)
- Optional `environment` variables, `enabled` toggle, `timeout` setting

**Remote MCP Servers:**
- HTTP/HTTPS endpoint with optional `headers` and `oauth` credentials
- OAuth support: `clientId` + optional `scope`
- Lenient schema variants strip unknown fields for forward compatibility

## Config System

**Hivemind Configs:**
- Source: `src/schema-kernel/hivemind-configs.schema.ts`
- Location: `.hivemind/configs.json` (project root)
- Schema version: 2.0.0
- Loaded via `src/config/subscriber.ts` — lazy-cache with invalidation

**Config Sections:**
- `conversation_language` / `documents_and_artifacts_language` — Language codes
- `mode` — Guardrail intensity: expert-advisor / hivemind-powered / free-style
- `user_expert_level` — Output style adaptation
- `workflow` — Feature toggles (research, plan_check, verifier, etc.)
- `delegation_systems` — Enabled delegation modes
- `parallelization` / `atomic_commit` / `commit_docs` — Workflow policies

**OpenCode Config:**
- `opencode.json` at project root — References `AGENTS.md` as instructions
- `.opencode/plugins/harness-control-plane.ts` — Plugin loader wrapper
- `.opencode/agents/` — Agent definitions (75 agents)
- `.opencode/skills/` — Skill packages (34 non-GSD skills)
- `.opencode/commands/` — Command definitions (19 commands)

## CLI Integration

**CLI Substrate:**
- `src/cli/index.ts` — Entry point via `bin/hivemind.cjs`
- `src/cli/router.ts` — Command router with exit code handling
- `src/cli/discovery.ts` — Dynamic command discovery
- `src/cli/renderer.ts` — Output rendering (JSON, table, help, error)

**Built-in Commands:**
- `help` — Show available commands
- `init` — Project initialization
- `doctor` — Health diagnostics
- `recover` — Symlink repair
- `version` — Version display

**Package Binary:**
- `hivemind` → `./bin/hivemind.cjs` (CommonJS wrapper)
- CLI accessible via `npx hivemind` or global install

## File System Integration

**State Persistence:**
- `src/task-management/continuity/` — Session continuity JSON files
- `src/task-management/journal/` — Session journal (append-only event timeline)
- `src/task-management/trajectory/` — Execution lineage ledger
- `.hivemind/state/` — Canonical internal state root (per Q6 decision)
- `.hivemind/session-tracker/` — Session tracker data

**Asset Management:**
- `scripts/sync-assets.js` — Syncs primitives from `.hivefiver-meta-builder/` to `.opencode/`
- User-modified files backed up with `.backup` suffix before overwrite

## Environment Variables

**Required:**
- None for build/test

**Runtime Overrides:**
- `OPENCODE_HARNESS_STATE_DIR` — Custom state directory path
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Custom continuity file path
- `OPENCODE_CONFIG_DIR` — Global config directory (CLI scope resolution)
- `NODE_ENV` — Affects session ID validation behavior in tests

## Runtime Policy

**Configuration:**
- `src/shared/runtime-policy.ts` — Workspace-level runtime policy
- `src/shared/workspace-runtime-policy.ts` — Workspace policy resolution

**Default Policy:**
- Concurrency: `globalLimit: 3`
- Budget: `maxToolCallsPerSession: 400`, `repeatedSignatureThreshold: 16`, `warningCap: 25`
- Trusted Runtime: `builtinAsyncBackgroundChildSessions: false`

**Per-Session Overrides:**
- Session overrides merge with workspace defaults
- Overrides come from trusted continuity/delegation metadata only (security: prevents silent limit escalation)

## PTY Integration

**Runtime:**
- `src/features/background-command/pty/pty-runtime.ts` — PTY manager factory
- `bun-pty` ^0.4.8 — Optional dependency for Bun runtime
- Graceful fallback: headless `node:child_process` when PTY unavailable
- Cross-platform: Bun-only PTY, Node fallback

---

*Integration audit: 2026-05-28*

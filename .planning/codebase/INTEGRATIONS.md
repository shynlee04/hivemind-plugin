# External Integrations

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (tech-focus)

## OpenCode Plugin SDK Integration

**Primary Integration:**
- `@opencode-ai/plugin` `>=1.1.0` (peer dependency)
  - Plugin type: `Plugin` — used in `src/plugin.ts` to define `HarnessControlPlane`
  - Tool factory: `tool()` from `@opencode-ai/plugin/tool` — used in `src/tools/delegate-task.ts`, `src/tools/delegation-status.ts`, and prompt tools
  - Schema builder: `tool.schema` — used for defining tool argument schemas inline

**SDK Client (`@opencode-ai/sdk` `^1.4.2`):**
- Client type: `OpenCodeClient = ReturnType<typeof createOpencodeClient>` — defined in `src/lib/session-api.ts`
- Used throughout: `src/plugin.ts`, `src/lib/delegation-manager.ts`, `src/lib/lifecycle-manager.ts`, `src/hooks/create-session-hooks.ts`

**SDK Surface Used:**

| SDK Method | Location | Purpose |
|------------|----------|---------|
| `client.session.create()` | `src/lib/session-api.ts`, `src/lib/delegation-manager.ts` | Create child sessions for delegation |
| `client.session.get()` | `src/lib/session-api.ts` | Retrieve session details |
| `client.session.status()` | `src/lib/session-api.ts`, `src/lib/delegation-manager.ts` | Get status map for all sessions |
| `client.session.abort()` | `src/lib/session-api.ts`, `src/lib/delegation-manager.ts` | Abort running sessions |
| `client.session.messages()` | `src/lib/session-api.ts`, `src/lib/delegation-manager.ts` | Retrieve message history |
| `client.session.prompt()` | `src/lib/session-api.ts`, `src/lib/delegation-manager.ts` | Send prompt to session (sync) |
| `client.session.promptAsync()` | `src/lib/session-api.ts` | Send prompt to session (async, 204) |
| `client.session.delete()` | Referenced in event handling | Session cleanup |
| `client.app.agents()` | `src/lib/delegation-manager.ts` | Validate agent names at dispatch time |
| `client.session.sendMessage()` | Referenced in lifecycle manager | Send messages to sessions |

## Plugin Registration Points

**Composition Root:** `src/plugin.ts` — `HarnessControlPlane`

**Registered Tools (5):**

| Tool Name | Factory | Purpose |
|-----------|---------|---------|
| `delegate-task` | `createDelegateTaskTool()` in `src/tools/delegate-task.ts` | Dispatch work to specialist agents (WaiterModel) |
| `delegation-status` | `createDelegationStatusTool()` in `src/tools/delegation-status.ts` | Poll delegation status, list/filter delegations |
| `prompt-skim` | `createPromptSkimTool()` in `src/tools/prompt-skim/index.ts` | Quantitative prompt triage (word count, complexity score) |
| `prompt-analyze` | `createPromptAnalyzeTool()` in `src/tools/prompt-analyze/index.ts` | Deep prompt analysis (contradictions, vagueness, scope gaps) |
| `session-patch` | `createSessionPatchTool()` in `src/tools/session-patch/index.ts` | Patch session state file sections with backup |

**Registered Hooks (8):**

| Hook Name | Factory | Purpose |
|-----------|---------|---------|
| `event` | `createCoreHooks()` in `src/hooks/create-core-hooks.ts` | Route SDK events to lifecycle manager + observers |
| `system.transform` | `createCoreHooks()` | System prompt injection (currently no-op stub) |
| `experimental.chat.system.transform` | `createCoreHooks()` | Chat system prompt injection (currently no-op stub) |
| `messages.transform` | `createCoreHooks()` | Inject context packets for prompt-enhance sessions |
| `shell.env` | `createCoreHooks()` | Force non-interactive shell env (CI=true, TERM=dumb) |
| `event` (session) | `createSessionHooks()` in `src/hooks/create-session-hooks.ts` | Auto-loop retry on `session.idle` for delegation packets |
| `experimental.session.compacting` | `createSessionHooks()` | Inject harness context into compaction payload |
| `tool.execute.before` | `createToolGuardHooks()` in `src/hooks/create-tool-guard-hooks.ts` | Circuit breaker, tool budget enforcement |
| `tool.execute.after` | `createToolGuardHooks()` | Inject `_harness` metadata into tool outputs |

## Data Storage

**Durable Persistence:**
- Continuity Store: JSON file on disk
  - Location: `.opencode/state/opencode-harness/continuity.json` (default)
  - Override: `OPENCODE_HARNESS_STATE_DIR` env var changes base directory
  - Override: `OPENCODE_HARNESS_CONTINUITY_FILE` env var changes file path
  - Implementation: `src/lib/continuity.ts` — `loadStoreFromDisk()`, `persistStore()`
  - Pattern: Deep-clone-on-read (prevents mutation aliasing)
  - Schema: `ContinuityStoreFile` type in `src/lib/types.ts`

- Delegation Store: JSON file on disk
  - Location: `.opencode/state/opencode-harness/delegations.json`
  - Implementation: `src/lib/delegation-manager.ts` — `persistAllDelegations()`, `readPersistedDelegations()`
  - Schema: Array of `Delegation` objects

**In-Memory State:**
- `src/lib/state.ts` — Maps for `sessionStats`, `rootBudgets`, `sessionToRoot`, `sessionDelegationMeta`
- Warning cap: 25 per session
- Hydrated from continuity store on plugin startup

**File Storage:**
- Local filesystem only (via `node:fs`)
- No cloud/object storage integration

**Caching:**
- Module-level `storeCache` singleton in `src/lib/continuity.ts`
- No external caching service

## Authentication & Identity

**Auth Provider:**
- None — the harness delegates auth to the OpenCode runtime
- SDK client receives authentication context from the plugin host
- No custom auth tokens or API keys stored by the harness

## Internal Module Graph

**Dependency Tree (max depth: 2):**

```
src/lib/types.ts (leaf — no imports)
├── src/lib/task-status.ts → types.ts
├── src/lib/state.ts → types.ts
├── src/lib/helpers.ts → types.ts
├── src/lib/continuity.ts → types.ts
├── src/lib/runtime-policy.ts → types.ts
├── src/lib/session-api.ts → helpers.ts
├── src/lib/runtime.ts → helpers.ts, types.ts
├── src/lib/notification-handler.ts → helpers.ts
├── src/lib/completion-detector.ts (self-contained — no imports)
├── src/lib/concurrency.ts (self-contained — no imports)
├── src/lib/delegation-manager.ts → concurrency.ts, continuity.ts, helpers.ts, types.ts
└── src/lib/lifecycle-manager.ts → concurrency.ts, continuity.ts, helpers.ts, session-api.ts, state.ts, types.ts
```

**Shared Utilities:**
- `src/shared/tool-helpers.ts` — `renderToolResult()` JSON serializer
- `src/shared/tool-response.ts` — `ToolResponse<T>` envelope type with `success()`, `error()`, `pending()` constructors

**Schema Kernel:**
- `src/schema-kernel/prompt-enhance.schema.ts` — Zod schemas for pipeline contracts (PromptSkimResult, PromptAnalysisResult, etc.)
- `src/schema-kernel/index.ts` — Barrel re-exports

**Hooks Layer:**
- `src/hooks/types.ts` — `HookDependencies` interface (lifecycle manager, client, state manager)
- `src/hooks/create-core-hooks.ts` → helpers.ts, continuity.ts, session-api.ts, messages-transform.ts, types.ts
- `src/hooks/create-session-hooks.ts` → continuity.ts, helpers.ts, session-api.ts, types.ts
- `src/hooks/create-tool-guard-hooks.ts` → continuity.ts, helpers.ts, runtime-policy.ts, types.ts, state.ts
- `src/hooks/messages-transform.ts` → continuity.ts

**Placeholder Directories (`.gitkeep` only):**
- `src/kernel/` — Reserved for future kernel module
- `src/cli/` — Reserved for future CLI substrate
- `src/harness/` — Reserved for future harness orchestration
- `src/plugins/` — Empty, no content

## Environment Configuration

**Required env vars:**
- None for build/test

**Runtime env vars:**
- `OPENCODE_SESSION_ID` — Fallback parent session ID in `src/tools/delegate-task.ts` when context doesn't provide one
- `OPENCODE_HARNESS_STATE_DIR` — Override base directory for state storage
- `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file path

**Injected env vars (via `shell.env` hook):**
- `CI=true` — Forces non-interactive mode
- `GIT_TERMINMAL_PROMPT=0` — Disables git prompts
- `NO_COLOR=1` — Disables color output
- `TERM=dumb` — Minimal terminal capability

**Secrets location:**
- None — the harness stores no secrets

## Runtime Policy Configuration

**Default Policy (`src/lib/runtime-policy.ts`):**
- Concurrency: `globalLimit: 3`
- Budget: `maxToolCallsPerSession: 400`, `repeatedSignatureThreshold: 16`, `warningCap: 25`
- Trusted Runtime: `builtinAsyncBackgroundChildSessions: false`

**Policy Override Chain:**
1. Hardcoded defaults → `DEFAULT_RUNTIME_POLICY`
2. Workspace-level policy (optional, passed to `loadRuntimePolicy()`)
3. Per-session overrides from trusted delegation metadata (`SessionPolicyOverride`)

**Resolution:** `getRuntimePolicyForSession()` in `src/lib/runtime-policy.ts`

## Webhooks & Callbacks

**Incoming:**
- None — the harness reacts to OpenCode SDK events, not HTTP webhooks

**Outgoing:**
- None — no external HTTP calls beyond the OpenCode SDK client

## Monitoring & Observability

**Error Tracking:**
- None — errors are `[Harness]`-prefixed and thrown/caught locally
- Warnings stored per-session in memory (`state.ts`) with 25 cap

**Logs:**
- No structured logging framework
- Error messages use `[Harness]` prefix convention
- No log aggregation or shipping

---

*Integration audit: 2026-04-21*

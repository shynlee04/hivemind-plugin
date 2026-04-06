# External Integrations

**Analysis Date:** 2026-04-06

## OpenCode Plugin Hooks

This package integrates with OpenCode via its plugin system. All hooks are registered in `src/plugin.ts` (the `HarnessControlPlane` plugin).

### Lifecycle Hooks

| Hook | File | Purpose |
|------|------|---------|
| `event` | `src/plugin.ts` (line ~147) | Receives all OpenCode lifecycle events. Extracts `event.type` and `sessionID`, then delegates to `lifecycleManager.handleEvent()` for session state transitions. |
| `tool.execute.before` | `src/plugin.ts` (line ~103) | Pre-tool execution guard. Tracks tool call counts per session, enforces `MAX_TOOL_CALLS_PER_SESSION` (400), detects repeated call loops, and trips circuit breaker at `CIRCUIT_BREAKER_THRESHOLD` (16 repeated identical calls). |
| `tool.execute.after` | `src/plugin.ts` (line ~134) | Post-tool execution observer. Attaches `_harness` metadata to tool output containing session stats, delegation metadata, continuity status, lifecycle snapshot, and routing info. |
| `shell.env` | `src/plugin.ts` (line ~213) | Injects deterministic shell environment variables: `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb`. Ensures non-interactive, non-TTY behavior for all subprocesses. |

### Transform Hooks

| Hook | File | Purpose |
|------|------|---------|
| `system.transform` | `src/plugin.ts` (line ~222) → `src/hooks/system-transform.ts` | Injects the "Prompt-Enhance Output Contract" (YAML frontmatter + XML body validation rules) into the system prompt for sessions with delegation metadata. Normal sessions pass through unchanged. |
| `messages.transform` | `src/plugin.ts` (line ~230) → `src/hooks/messages-transform.ts` | Scans message history for prompt-enhance triggers (`"enhance this prompt"`, `"audit this prompt"`, `"repack this prompt"`, `"prompt-enhance"`, `"/hf-prompt-enhance"`). When detected, injects a context packet (session ID, continuity status, agent, category) before the first user message. |
| `experimental.session.compacting` | `src/plugin.ts` (line ~164) | Injects a harness state snapshot into the compaction context. Includes tool call counts, delegation metadata (root session, depth, budget, agent, category, model, concurrency key), lifecycle phase/run mode/queue status, observation signals, cleanup reasons, and warnings. Also pushes a full continuity JSON snapshot. |

## OpenCode Plugin Tools

All tools are registered under the `tool` namespace in `src/plugin.ts`.

### `delegate-task`

- **Definition:** Inline in `src/plugin.ts` (line ~243)
- **Description:** Creates a restricted child session for researcher, builder, or critic work. Optionally runs asynchronously.
- **Args:**
  - `description` (string, required) — Short task description
  - `prompt` (string, required) — Full task prompt for the delegated agent
  - `agent` (string, optional) — Explicit specialist agent (`researcher`, `builder`, `critic`); overrides category default
  - `category` (string, optional) — Routing category for agent/model/temperature resolution
  - `run_in_background` (boolean, required) — Run asynchronously and return task metadata immediately
  - `session_id` (string, optional) — Override parent session
  - `scope` (string, optional) — Explicit task scope
  - `constraints` (string[], optional) — Constraint list passed into child prompt
  - `model` (string, optional) — Explicit model to request and use as concurrency key
- **Validation:**
  - Agent must be one of `researcher`, `builder`, `critic`
  - Category must be a valid `DelegationCategory`
  - Delegation depth capped at `MAX_DEPTH` (3)
  - Descendant count limited by `MAX_DESCENDANTS_PER_ROOT`
- **Permission rules per agent:**
  - `researcher`: read-only (deny edit/write/bash/task/delegate-task)
  - `builder`: full file access (deny task/delegate-task)
  - `critic`: read + grep + glob + bash allowed (deny edit/write/task/delegate-task)

### `prompt-skim`

- **Definition:** `src/tools/prompt-skim/index.ts` → `src/tools/prompt-skim/tools.ts`
- **Description:** Rapid prompt quality assessment. Scans a prompt for clarity, completeness, and actionability.
- **Types exported:** `PromptSkimAction`, `PromptSkimArgs`, `PromptSkimResult` (from `src/tools/prompt-skim/types.ts`)

### `prompt-analyze`

- **Definition:** `src/tools/prompt-analyze/index.ts` → `src/tools/prompt-analyze/tools.ts`
- **Description:** Deep prompt analysis with structured findings. Evaluates prompt structure, intent clarity, and potential ambiguities.
- **Types exported:** `PromptAnalyzeAction`, `PromptAnalyzeArgs`, `PromptAnalysisFinding`, `PromptAnalysisResult` (from `src/tools/prompt-analyze/types.ts`)

### `context-budget`

- **Definition:** `src/tools/context-budget/index.ts` → `src/tools/context-budget/tools.ts`
- **Description:** Manages context window budgeting. Tracks and reports context usage per session.
- **Types exported:** `ContextBudgetAction`, `ContextBudgetArgs`, `ContextBudgetRecord` (from `src/tools/context-budget/types.ts`)

### `session-patch`

- **Definition:** `src/tools/session-patch/index.ts` → `src/tools/session-patch/tools.ts`
- **Description:** Applies patches to session state. Enables targeted updates to session continuity records.
- **Types exported:** `SessionPatchAction`, `SessionPatchArgs`, `SessionPatchRecord` (from `src/tools/session-patch/types.ts`)

## APIs & External Services

**OpenCode SDK:**
- SDK: `@opencode-ai/plugin` (peer dependency `>=1.1.0`)
- Auth: Handled by OpenCode runtime — no separate credentials needed
- Used for: `tool` definitions, plugin hooks (`event`, `tool.execute.before/after`, `shell.env`, `system.transform`, `messages.transform`, `experimental.session.compacting`)

**OpenCode Client API:**
- `client` object injected into plugin factory
- Used for: `walkParentChain()` to resolve delegation ancestry in `src/lib/session-api.ts`

## Data Storage

**Continuity Store:**
- Location: Configurable via `OPENCODE_HARNESS_STATE_DIR` or default `.opencode/state/opencode-harness/`
- Client: `src/lib/continuity.ts` — durable JSON file persistence
- Format: JSON files per session with deep-clone-on-read semantics
- Metadata includes: `status`, `route`, `delegation` (agent, category, model), `promptParams`, `toolProfile`

**In-Memory State:**
- Location: `src/lib/state.ts`
- Structures: `Map<string, SessionStats>` for tool call tracking, `Map<string, DelegationMeta>` for delegation metadata
- Ephemeral — reconstructed from continuity store on hydrate

**File Storage:**
- Local filesystem only — no cloud storage integration

**Caching:**
- None. All state is either in-memory Maps or durable JSON continuity files.

## Authentication & Identity

**Auth Provider:**
- Delegated to OpenCode runtime
- No independent auth flows

**Permission Model:**
- Agent-scoped permission rules defined in `src/plugin.ts` (`getPermissionRulesForAgent()`)
- Rules follow `{ permission, pattern, action }` structure
- Applied per specialist agent (researcher/builder/critic)

## Monitoring & Observability

**Error Tracking:**
- No external error tracking
- Errors thrown with `[Harness]` prefix for identification

**Logs:**
- In-band via `_harness` metadata attached to tool output in `tool.execute.after`
- Warnings accumulated per session in `SessionStats.warnings`
- Circuit breaker trips logged as warnings and thrown errors

**Observability surface:**
- `_harness` metadata on every tool response includes: `totalToolCalls`, `recentWarnings`, `repeatedSignatureCount`, `rootSessionID`, `delegationDepth`, `rootBudgetUsed`, `specialistAgent`, `specialistCategory`, `specialistModel`, `concurrencyKey`, `continuityStatus`, `lifecycle`, `routing`, `continuityStorage`, `continuity`

## CI/CD & Deployment

**Hosting:**
- npm package: `opencode-harness`

**CI Pipeline:**
- None detected in repository

**Build Pipeline:**
- `npm run build` → `tsc` compile to `dist/`
- `npm run typecheck` → `tsc --noEmit` gate
- `npm test` → `vitest run`
- `prepack` script auto-runs build before publish

## Environment Configuration

**Required env vars:**
- None required for build/test
- `OPENCODE_HARNESS_STATE_DIR` (optional) — override continuity storage directory
- `OPENCODE_HARNESS_CONTINUITY_FILE` (optional) — override continuity file path

**Secrets location:**
- No secrets managed by this package
- Auth delegated to OpenCode runtime

## Webhooks & Callbacks

**Incoming:**
- `event` hook — receives all OpenCode lifecycle events

**Outgoing:**
- None

## Package Exports

From `package.json`:

| Export Path | Resolves To | Types |
|-------------|-------------|-------|
| `opencode-harness` (main) | `./dist/index.js` | `./dist/index.d.ts` |
| `opencode-harness/plugin` | `./dist/plugin.js` | `./dist/plugin.d.ts` |
| `opencode-harness/package.json` | `./package.json` | — |

**Published files:** `dist/`, `.opencode/`, `opencode.json`, `README.md`, `LICENSE`

**Runtime requirements:**
- Node.js `>=20.0.0`
- Peer: `@opencode-ai/plugin >=1.1.0`

## Specialist Agent Configuration

**Agent tool profiles** (defined in `src/plugin.ts`):

| Agent | Temperature | Required Tools | Denied Tools |
|-------|-------------|----------------|--------------|
| `researcher` | 0.1 | `read`, `glob`, `grep`, `webfetch` | `edit`, `write`, `bash`, `task` |
| `builder` | 0.15 | `read`, `glob`, `grep`, `edit`, `write`, `bash` | `task` |
| `critic` | 0.05 | `read`, `glob`, `grep`, `bash` | `edit`, `write`, `task` |

## Guardrail Constants

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| `MAX_DEPTH` | 3 | `src/plugin.ts` | Maximum delegation nesting depth |
| `WATCH_TIMEOUT_MS` | 180000 | `src/plugin.ts` | Lifecycle watch timeout (3 min) |
| `CIRCUIT_BREAKER_THRESHOLD` | 16 | `src/plugin.ts` | Repeated identical tool call limit before trip |
| `MAX_TOOL_CALLS_PER_SESSION` | 400 | `src/plugin.ts` | Total tool call budget per session |

---

*Integration audit: 2026-04-06*

# OpenCode Harness — System Requirements

**Document:** requirements-2026-04-02.md  
**Version:** 3.0  
**Date:** 2026-04-02  
**Status:** Platform-Grounded Specification  

---

## 1. Product Overview

OpenCode Harness is a standalone control-plane package for OpenCode AI coding assistant. It provides delegated session orchestration, continuity persistence, multi-agent routing, and runtime guardrails. The harness transforms a single AI agent into a coordinated multi-agent system with specialist roles, permission isolation, concurrency control, and durable state across session boundaries.

**Implementation model:** The harness is an OpenCode plugin (`@opencode-ai/plugin >= 1.1.0`) that registers custom tools, hooks into platform lifecycle events, and manages its own state layer. Everything the harness provides beyond the OpenCode platform API is **harness-internal** — explicitly marked throughout this document.

---

## 2. System Architecture Requirements

### 2.1 Core Architecture

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ARCH-001 | The system SHALL operate as a standalone npm package publishable independently | P0 | Not Started |
| ARCH-002 | The system SHALL integrate with OpenCode through a plugin API (`@opencode-ai/plugin >= 1.1.0`). The plugin entry point SHALL export an async function receiving `{ project, directory, worktree, client, $ }` and return `{ hooks, tools }` | P0 | Not Started |
| ARCH-003 | The system SHALL produce distributable artifacts under `dist/` via TypeScript compilation | P0 | Not Started |
| ARCH-004 | The system SHALL expose two entry points: main (`.`) and plugin (`./plugin`) | P0 | Not Started |
| ARCH-005 | The system SHALL require Node.js >= 20.0.0 | P0 | Not Started |
| ARCH-006 | The system SHALL store runtime state outside of package source tree (default: `.opencode/state/opencode-harness/`) | P0 | Not Started |
| ARCH-007 | The system SHALL support harness-specific environment variable overrides for state paths (`OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`). These are harness-internal configuration variables, NOT platform-native environment variables | P1 | Not Started |

### 2.2 Module Architecture

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| MOD-001 | The system SHALL provide a types module (`types.ts`) as a single source of truth for all type definitions | P0 | Not Started |
| MOD-002 | The system SHALL provide a helpers module (`helpers.ts`) with pure utility functions (no side effects) | P0 | Not Started |
| MOD-003 | The system SHALL provide a state module (`state.ts`) for harness-internal in-memory session state management using Map-based storage | P0 | Not Started |
| MOD-004 | The system SHALL provide a continuity module (`continuity.ts`) for harness-internal disk-persisted session continuity records | P0 | Not Started |
| MOD-005 | The system SHALL provide a routing module (`routing.ts`) for delegation route resolution | P0 | Not Started |
| MOD-006 | The system SHALL provide a concurrency module (`concurrency.ts`) for harness-internal lane-based async concurrency control. Functions like `acquire()`, `release()`, and queue management are harness-owned abstractions, NOT platform-provided APIs | P0 | Not Started |
| MOD-007 | The system SHALL provide a session-api module (`session-api.ts`) as a thin wrapper over the OpenCode SDK (`client.session.create()`, `client.session.prompt()`, `client.session.abort()`, `client.event.subscribe()`) | P0 | Not Started |
| MOD-008 | The system SHALL provide a runtime module (`runtime.ts`) for effective prompt state inference and event-to-status mapping | P0 | Not Started |
| MOD-009 | The system SHALL provide a lifecycle-manager module (`lifecycle-manager.ts`) as a central delegation orchestrator | P0 | Not Started |
| MOD-010 | The system SHALL provide a plugin module (`plugin.ts`) as the OpenCode plugin entry point registering all hooks and custom tools | P0 | Not Started |

---

## 3. Multi-Agent System Requirements

### 3.1 Agent Definitions

Agents are defined via markdown files in `.opencode/agents/` or JSON in `opencode.json`, using platform-native agent configuration fields: `description`, `mode`, `model`, `prompt`, `temperature`, `steps`, `hidden`, `permission`, `tools`, `reasoningEffort`.

**MVP Role Mapping:** The harness's `conductor` agent combines the orchestration roles of OMO's Prometheus (intent classification + routing) and Atlas (session lifecycle management) into a single primary agent for MVP simplicity. Future iterations may split these into separate agents.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AGT-001 | The system SHALL define a minimum of three specialist subagents: `researcher`, `builder`, `critic` | P0 | Not Started |
| AGT-002 | The system SHALL define a `conductor` agent as a `primary`-mode agent (Tab-cycle accessible) that serves as the top-level orchestrator. The conductor combines OMO's Prometheus (intent classification) and Atlas (session lifecycle) roles for MVP | P0 | Not Started |
| AGT-003 | The conductor agent SHALL classify user intent into: research, implement, review, plan, hybrid | P0 | Not Started |
| AGT-004 | The conductor agent SHALL NEVER implement code directly — all execution SHALL be delegated via the harness `delegate-task` custom tool | P0 | Not Started |
| AGT-005 | The researcher agent SHALL operate in read-only mode: denied `edit`, `write`, `bash` permissions. Allowed tools: `read`, `glob`, `grep`, `list`, `webfetch`, `websearch`, `codesearch`. Denied task spawning via `task: { "*": "deny" }` | P0 | Not Started |
| AGT-006 | The builder agent SHALL have full file modification and shell access. Denied task spawning via `task: { "*": "deny" }` so all delegation routes through the conductor | P0 | Not Started |
| AGT-007 | The critic agent SHALL have read-only file access plus `bash` permission restricted to test execution. Denied `edit`, `write`. Denied task spawning via `task: { "*": "deny" }` | P0 | Not Started |
| AGT-008 | The system SHALL configure default temperatures per agent: researcher=0.1, builder=0.15, critic=0.05, conductor=0.3 | P0 | Not Started |
| AGT-009 | Each agent SHALL have a configured max steps limit: researcher=60, builder=80, critic=40, conductor=80 | P1 | Not Started |

### 3.2 Delegation Categories

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CAT-001 | The system SHALL define four delegation categories: `research`, `implementation`, `review`, `visual-engineering` | P0 | Not Started |
| CAT-002 | Each category SHALL map to a default agent, model, temperature, and guidance text | P0 | Not Started |
| CAT-003 | The `research` category SHALL default to researcher agent with temperature 0.1 | P0 | Not Started |
| CAT-004 | The `implementation` category SHALL default to builder agent with temperature 0.15 | P0 | Not Started |
| CAT-005 | The `review` category SHALL default to critic agent with temperature 0.05 | P0 | Not Started |
| CAT-006 | The `visual-engineering` category SHALL default to builder agent with temperature 0.25 | P1 | Not Started |
| CAT-007 | An explicit agent parameter SHALL override a category's default agent | P0 | Not Started |
| CAT-008 | Conflicting agent + category combinations SHALL generate a warning but use the explicit agent | P1 | Not Started |
| CAT-009 | Each delegation prompt SHALL include structured sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT | P0 | Not Started |

---

## 4. Permission and Security Requirements

### 4.1 Platform Permission Model

The OpenCode platform provides a permission system where each tool can be set to `allow`, `ask`, or `deny`. The `permission.task` field accepts glob patterns to control which subagent types an agent can spawn. For example: `"task": { "*": "deny", "explore": "allow" }` means the agent can only spawn `explore` subagents.

The platform's `doom_loop` permission is an ACTION (allow/ask/deny), not a configurable threshold. The platform always triggers doom_loop detection at 3 consecutive identical tool calls (same tool name + same serialized arguments). Setting `"doom_loop": "allow"` means the platform will NOT prompt the user when this condition is detected — it silently permits the repetition.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PERM-001 | The system SHALL implement a three-tier permission configuration: root (default), per-agent, per-delegation (enforced via hooks) | P0 | Not Started |
| PERM-002 | The root permission model SHALL set `doom_loop` to `"allow"` to prevent the platform from blocking/prompting on repeated identical tool calls. This is necessary because the harness implements its own independent loop detection at a higher semantic level (see GRD-004). These two mechanisms serve different purposes: platform doom_loop catches exact duplicates at threshold 3; harness circuit breaker catches semantically similar patterns at threshold 16 | P0 | Not Started |
| PERM-003 | The root permission model SHALL set the platform `task` tool to `"ask"` so the user is prompted before any subagent spawn that bypasses the harness | P0 | Not Started |
| PERM-004 | The researcher agent SHALL be denied: `edit`, `write`, `bash` permissions and all task spawning via `"task": { "*": "deny" }` | P0 | Not Started |
| PERM-005 | The builder agent SHALL be denied task spawning via `"task": { "*": "deny" }` — all delegation routes through the conductor's `delegate-task` custom tool | P0 | Not Started |
| PERM-006 | The critic agent SHALL be denied: `edit`, `write` permissions and all task spawning via `"task": { "*": "deny" }` | P0 | Not Started |
| PERM-007 | The system SHALL enforce per-delegation tool restrictions via the plugin's `tool.execute.before` hook. This hook inspects the current session's delegation metadata and rejects tool calls that fall outside the delegated agent's permitted tool set | P0 | Not Started |
| PERM-008 | The system SHALL register `delegate-task` as a custom tool via the plugin `tool()` factory from `@opencode-ai/plugin`. This is a harness-owned tool, NOT a platform primitive. Its tool context receives `{ agent, sessionID, messageID, directory, worktree }` | P0 | Not Started |

### 4.2 Runtime Guardrails

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| GRD-001 | The system SHALL enforce a maximum delegation depth of 3 levels | P0 | Not Started |
| GRD-002 | The system SHALL enforce a maximum of 10 descendant sessions per root session. The limit is configurable via the harness-internal `MAX_DESCENDANTS` constant (NOT a platform-provided setting) | P0 | Not Started |
| GRD-003 | The system SHALL enforce a maximum of 400 tool calls per session | P0 | Not Started |
| GRD-004 | The system SHALL implement a harness-internal circuit breaker in the plugin's `tool.execute.before` hook that trips after 16 consecutive semantically similar tool calls (configurable threshold). This is SEPARATE from the platform's `doom_loop` permission: the platform catches 3 identical calls; the harness catches 16 similar calls using stable signature hashing (tool name + serialized args). Setting `doom_loop: "allow"` in root permissions prevents platform-level blocking so the harness can apply its own richer detection | P0 | Not Started |
| GRD-005 | The system SHALL detect tool call loops via stable signature hashing (tool name + serialized args) | P0 | Not Started |
| GRD-006 | The system SHALL set shell environment variables via the platform's `shell.env` plugin hook: `output.env.CI = true`, `output.env.GIT_TERMINAL_PROMPT = 0`, `output.env.NO_COLOR = 1`, `output.env.TERM = dumb` | P0 | Not Started |
| GRD-007 | The system SHALL reject delegation requests exceeding the depth limit with an error | P0 | Not Started |
| GRD-008 | The system SHALL reject delegation requests exceeding the descendant budget with an error | P0 | Not Started |

---

## 5. Session Lifecycle Requirements

### 5.1 Lifecycle Phases

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LIF-001 | The system SHALL track session lifecycle through phases: created, queued, dispatching, running, completed, failed | P0 | Not Started |
| LIF-002 | The system SHALL map continuity status signals to lifecycle phases | P0 | Not Started |
| LIF-003 | The `failed` status SHALL be sticky — once failed, idle/completed signals SHALL NOT override | P0 | Not Started |
| LIF-004 | The `created` status SHALL transition to `running` on receiving an `idle` signal | P1 | Not Started |
| LIF-005 | The system SHALL support both synchronous and asynchronous session execution modes | P0 | Not Started |
| LIF-006 | The system SHALL detect async session completion via SSE events from `client.event.subscribe()` (listening for session status changes). Polling SHALL be used as degraded-mode fallback only if SSE connection fails | P0 | Not Started |

### 5.2 Event Processing

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| EVT-001 | The system SHALL process platform session events via `client.event.subscribe()` which returns an SSE stream | P0 | Not Started |
| EVT-002 | On session creation events, the system SHALL inherit the root session ID from the parent chain | P0 | Not Started |
| EVT-003 | On session deletion events, the system SHALL clean up all in-memory state and disk records for the session | P0 | Not Started |
| EVT-004 | On session update events, the system SHALL hydrate delegation state and infer continuity status | P0 | Not Started |
| EVT-005 | The system SHALL detect cycles in parent chain traversal and prevent infinite loops | P0 | Not Started |
| EVT-006 | The system SHALL extract status signals from event payload paths | P0 | Not Started |

### 5.3 Budget Management

Budget allocation is a **harness-internal** abstraction. The OpenCode platform does not provide descendant budget APIs. The harness manages its own accounting of how many child sessions each root session has spawned.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| BUD-001 | The system SHALL implement harness-internal descendant budget tracking with reserve → commit/rollback semantics. Budget slots are tracked in harness memory (`state.ts`), NOT via platform APIs | P0 | Not Started |
| BUD-002 | The system SHALL automatically clean up root budget entries when all descendants are removed | P0 | Not Started |
| BUD-003 | The system SHALL silently handle rollback requests for non-existent roots | P1 | Not Started |
| BUD-004 | The system SHALL cap per-session warnings at 25 to prevent unbounded memory growth | P0 | Not Started |

### 5.4 Background Task Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| BGT-001 | The system SHALL provide a harness-internal background task manager API: spawn, track, cancel, query status | P0 | Not Started |
| BGT-002 | The system SHALL support task cancellation via the platform's `client.session.abort()` method | P0 | Not Started |
| BGT-003 | The system SHALL track async task completion via SSE events from `client.event.subscribe()` | P0 | Not Started |
| BGT-004 | The background task manager SHALL handle concurrent session monitoring without blocking the event loop | P0 | Not Started |

---

## 6. Persistence Requirements

### 6.1 Continuity Store

The continuity store is a **harness-internal** persistence mechanism. The OpenCode platform does not provide cross-session continuity storage. The harness manages its own JSON file on disk.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PER-001 | The system SHALL persist session continuity records to a harness-managed JSON file on disk (path configurable via `OPENCODE_HARNESS_STATE_DIR`) | P0 | Not Started |
| PER-002 | The system SHALL load the continuity store from disk on plugin initialization | P0 | Not Started |
| PER-003 | The system SHALL persist state changes to disk with debouncing (default 100ms batch window), flushing synchronously on critical state changes (session completion, error states) | P0 | Not Started |
| PER-004 | The system SHALL return deep clones on all continuity reads to prevent mutation leaks | P0 | Not Started |
| PER-005 | The system SHALL normalize all fields on load, silently dropping invalid records | P0 | Not Started |
| PER-006 | The system SHALL handle corrupt JSON files by returning an empty store (no crash) | P0 | Not Started |
| PER-007 | The system SHALL handle missing or empty continuity files by returning an empty store | P0 | Not Started |
| PER-008 | The system SHALL support partial updates (patch) to continuity records | P0 | Not Started |
| PER-009 | The system SHALL silently handle patch/delete operations on non-existent records | P1 | Not Started |

### 6.2 Context Checkpoints

Context checkpoints are **harness-internal** tools registered via the plugin `tool()` factory. They are NOT platform primitives.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CHK-001 | The system SHALL register `context-checkpoint_save` and `context-checkpoint_restore` as custom tools via the plugin `tool()` factory. These are harness-owned tools, NOT platform primitives | P0 | Not Started |
| CHK-002 | Checkpoints SHALL include: summary, active files, pending tasks, decisions, errors | P0 | Not Started |
| CHK-003 | Checkpoints SHALL be stored in a separate JSON file from the continuity store | P0 | Not Started |
| CHK-004 | Each session SHALL have exactly one checkpoint (new saves overwrite previous) | P0 | Not Started |
| CHK-005 | Checkpoint storage path SHALL be configurable via the harness-specific `OPENCODE_HARNESS_STATE_DIR` environment variable | P1 | Not Started |

---

## 7. Concurrency Requirements

Concurrency control is a **harness-internal** abstraction. The OpenCode platform does not provide concurrency slot APIs. The harness manages its own async queue system.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CON-001 | The system SHALL implement harness-internal lane-based async concurrency queues with per-key limits. Functions like `acquire()`, `release()`, and queue management in `src/lib/concurrency.ts` are harness-owned, NOT platform-provided | P0 | Not Started |
| CON-002 | Queue keys SHALL be built deterministically from model/agent/category with priority: model > agent+category > agent > category > default | P0 | Not Started |
| CON-003 | The default concurrency limit per lane SHALL be 3-5, configurable per lane key pattern | P0 | Not Started |
| CON-004 | The system SHALL protect against double-release with an idempotent release mechanism | P0 | Not Started |
| CON-005 | The system SHALL auto-delete lanes when active=0 and pending=0 | P0 | Not Started |
| CON-006 | The system SHALL queue pending acquisitions when a lane is at capacity | P0 | Not Started |

---

## 8. Context Management Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CTX-001 | The system SHALL inject a structured harness state snapshot into the compaction context before context window pruning via the platform's `experimental.session.compacting` plugin hook | P0 | Not Started |
| CTX-002 | The compaction snapshot SHALL include: delegation metadata, lifecycle state, queue status, warnings, continuity data | P0 | Not Started |
| CTX-003 | The system SHALL override chat parameters (model, temperature) via the platform's `chat.params` plugin hook based on effective prompt state | P0 | Not Started |
| CTX-004 | The system SHALL inject `_harness` metadata into the compaction context via the `experimental.session.compacting` hook's `output.context.push()` method | P0 | Not Started |

---

## 9. SDK Compatibility Requirements

The harness uses the `@opencode-ai/sdk` client passed to the plugin via the `client` parameter. The following are actual platform SDK methods:

- **Session CRUD:** `client.session.create()`, `client.session.get()`, `client.session.list()`, `client.session.delete()`, `client.session.update()`, `client.session.prompt()`, `client.session.abort()`, `client.session.share()`, `client.session.children()`, `client.session.messages()`
- **Events:** `client.event.subscribe()` — returns SSE stream
- **TUI:** `client.tui.appendPrompt()`, `client.tui.showToast()`, `client.tui.executeCommand()`
- **App:** `client.app.log()`, `client.app.agents()`

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SDK-001 | The system SHALL create delegated sessions using `client.session.create({ title })` and send prompts using `client.session.prompt({ body: { model, parts } })` for model/temperature override | P0 | Not Started |
| SDK-002 | For synchronous delegation, the system SHALL use `client.session.prompt()` and await the result. For asynchronous delegation, the system SHALL use `client.session.prompt()` combined with `client.event.subscribe()` listening for session completion events | P0 | Not Started |
| SDK-003 | The system SHALL extract session IDs and parent IDs from event payload paths | P0 | Not Started |
| SDK-004 | The system SHALL handle the typed session response format from the SDK | P0 | Not Started |
| SDK-005 | The system SHALL throw the last error with context when SDK operations fail | P0 | Not Started |
| SDK-006 | The system SHALL use `client.session.abort()` for session cancellation | P0 | Not Started |
| SDK-007 | The system SHALL use `client.session.children()` to enumerate child sessions for budget tracking | P1 | Not Started |

---

## 10. Routing Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| RTE-001 | The system SHALL resolve delegation routes with source tracking for agent, model, and temperature | P0 | Not Started |
| RTE-002 | Temperature values SHALL be clamped to the range [0, 1] | P0 | Not Started |
| RTE-003 | The system SHALL throw if neither an agent nor a valid category is provided | P0 | Not Started |
| RTE-004 | The system SHALL track the source of each resolved value: explicit, category, continuity, delegation, agent-default | P0 | Not Started |

---

## 11. Command Requirements

Commands are markdown files in `.opencode/commands/` with optional fields: `template`, `description`, `agent`, `model`, `subtask`. They support placeholders: `$ARGUMENTS`, `$1`-`$9`, `!command`, `@filename`.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CMD-001 | The system SHALL provide a `/plan` command for strategic planning mode (conductor agent, non-subtask) | P0 | Not Started |
| CMD-002 | The system SHALL provide a `/start-work` command for plan execution via the platform `task` tool | P0 | Not Started |
| CMD-003 | The system SHALL provide a `/ultrawork` command for fully autonomous orchestration | P0 | Not Started |
| CMD-004 | The system SHALL provide a `/harness-doctor` command that performs a grounded health check verifying: (1) harness plugin is loaded, (2) continuity store file exists and is valid JSON, (3) agent definition files exist for conductor/researcher/builder/critic, (4) command files exist for /plan, /start-work, /ultrawork, (5) skill files exist for required skills | P0 | Not Started |
| CMD-005 | The `/plan` command SHALL create `task_plan.md` with numbered phases and acceptance criteria | P0 | Not Started |
| CMD-006 | The `/start-work` command SHALL support resumption via `progress.md` | P0 | Not Started |
| CMD-007 | The `/ultrawork` command SHALL NOT ask for clarification — it makes reasonable assumptions and proceeds autonomously | P0 | Not Started |

---

## 12. Skill Requirements

Skills are `SKILL.md` files in `.opencode/skills/` with YAML frontmatter fields: `name`, `description`, `license`, `compatibility`, `metadata`.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SKL-001 | The system SHALL provide a `harness-overview` skill as a quick reference for the harness architecture | P0 | Not Started |
| SKL-002 | The system SHALL provide a `planning-with-files` skill for persistent file-based planning | P0 | Not Started |
| SKL-003 | The system SHALL provide a `wisdom-accumulation` skill for cross-task learning via `.harness/wisdom/` | P0 | Not Started |
| SKL-004 | The system SHALL provide a `shell-safety` skill for non-interactive command enforcement | P0 | Not Started |
| SKL-005 | The `planning-with-files` skill SHALL enforce the 2-Action Rule (save findings after every 2 search/read operations) | P0 | Not Started |
| SKL-006 | The `planning-with-files` skill SHALL enforce the 3-Strike Error Protocol | P0 | Not Started |
| SKL-007 | The `wisdom-accumulation` skill SHALL enforce cleanup rules: remove entries older than 7 days, merge duplicates, keep files under 100 lines | P1 | Not Started |

---

## 13. Planning and Review Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PLN-001 | The conductor agent SHALL perform planning as a formal phase before delegation | P0 | Not Started |
| PLN-002 | The system SHALL require plan review as a phase between planning and implementation | P0 | Not Started |
| PLN-003 | The conductor SHALL have plans reviewed by the critic agent before delegating implementation | P0 | Not Started |
| PLN-004 | Plans SHALL be reviewed for gap analysis, scope alignment, and feasibility before execution | P0 | Not Started |

---

## 14. Harness-Internal vs Platform-Provided Boundary

This section explicitly catalogues what is harness-internal versus what the OpenCode platform provides, to prevent future conflation.

### Platform-Provided (used by the harness)

| Capability | Platform API | Harness Usage |
|------------|-------------|---------------|
| Plugin registration | `@opencode-ai/plugin` export function | Entry point receiving `{ project, directory, worktree, client, $ }` |
| Custom tool registration | `tool()` factory | Registers `delegate-task`, `context-checkpoint_save`, `context-checkpoint_restore` |
| Hook: before tool execution | `tool.execute.before` | Circuit breaker, per-delegation restriction enforcement |
| Hook: after tool execution | `tool.execute.after` | Tool call tracking, statistics |
| Hook: session compacting | `experimental.session.compacting` | Inject harness state before context pruning |
| Hook: chat parameters | `chat.params` | Override model/temperature per delegation |
| Hook: shell environment | `shell.env` | Set CI=true, GIT_TERMINAL_PROMPT=0, etc. |
| Hook: events | `event` | Session lifecycle tracking |
| Permission: doom_loop | `"doom_loop": "allow"/"ask"/"deny"` | Set to `allow` to let harness manage its own loop detection |
| Permission: task glob patterns | `"task": { "*": "deny", "explore": "allow" }` | Control which subagent types each agent can spawn |
| Session CRUD | `client.session.create/get/list/delete/update/prompt/abort/share/children/messages` | Core delegation lifecycle |
| Event streaming | `client.event.subscribe()` | SSE stream for async session monitoring |
| TUI interaction | `client.tui.appendPrompt/showToast/executeCommand` | User feedback |
| Agent configuration | `.opencode/agents/` markdown or JSON | Define conductor, researcher, builder, critic |
| Command configuration | `.opencode/commands/` markdown | Define /plan, /start-work, /ultrawork, /harness-doctor |
| Skill configuration | `.opencode/skills/SKILL.md` with YAML frontmatter | Define harness-overview, planning-with-files, etc. |

### Harness-Internal (NOT platform-provided)

| Abstraction | Module | Purpose |
|------------|--------|---------|
| Lane-based concurrency queues | `concurrency.ts` | Per-model/agent async rate limiting with acquire/release |
| Descendant budget tracking | `state.ts` | Reserve/commit/rollback for max descendants per root session |
| Continuity store | `continuity.ts` | JSON file persistence for cross-session state |
| Context checkpoints | Custom tools via `tool()` | Save/restore session context — registered BY the harness |
| Circuit breaker | `tool.execute.before` hook | Detects 16 similar calls (not platform's doom_loop at 3 identical) |
| Delegation routing | `routing.ts` | Agent/model/temperature resolution with source tracking |
| Background task manager | `lifecycle-manager.ts` | Spawn/track/cancel async delegation sessions |
| Environment variables | N/A | `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`, `MAX_DESCENDANTS` — all harness-specific |

---

## 15. Custom Tool Definitions

These tools are registered by the harness plugin via the `tool()` factory from `@opencode-ai/plugin`. They receive tool context `{ agent, sessionID, messageID, directory, worktree }`.

### 15.1 delegate-task

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| TOOL-001 | The `delegate-task` tool SHALL accept parameters: `category` (required), `task` (required), `agent` (optional override), `model` (optional override), `temperature` (optional override), `context` (optional additional context) | P0 | Not Started |
| TOOL-002 | The `delegate-task` tool SHALL resolve routing via the routing module to determine agent, model, and temperature | P0 | Not Started |
| TOOL-003 | The `delegate-task` tool SHALL enforce guardrails: depth limit, descendant budget, circuit breaker state | P0 | Not Started |
| TOOL-004 | The `delegate-task` tool SHALL create a child session via `client.session.create({ title })` and prompt it via `client.session.prompt({ body: { model, parts } })` | P0 | Not Started |
| TOOL-005 | The `delegate-task` tool SHALL format the delegation prompt using the 6-section template (TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT) | P0 | Not Started |

### 15.2 context-checkpoint_save

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| TOOL-006 | The `context-checkpoint_save` tool SHALL accept parameters: `summary` (required), `activeFiles` (optional), `pendingTasks` (optional), `decisions` (optional), `errors` (optional) | P0 | Not Started |
| TOOL-007 | The `context-checkpoint_save` tool SHALL persist the checkpoint to a harness-managed JSON file keyed by session ID | P0 | Not Started |
| TOOL-008 | New saves SHALL overwrite previous checkpoints for the same session | P0 | Not Started |

### 15.3 context-checkpoint_restore

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| TOOL-009 | The `context-checkpoint_restore` tool SHALL accept parameter: `sessionID` (required) | P0 | Not Started |
| TOOL-010 | The `context-checkpoint_restore` tool SHALL return the stored checkpoint data for injection into the current session context | P0 | Not Started |
| TOOL-011 | If no checkpoint exists for the given session, the tool SHALL return a clear "no checkpoint found" message | P0 | Not Started |

---

## 16. Non-Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-001 | The system SHALL be buildable with `npm run build` emitting to `dist/` | P0 | Not Started |
| NFR-002 | The system SHALL pass type checking with `npm run typecheck` | P0 | Not Started |
| NFR-003 | The system SHALL be packable with `npm pack` using a hardened publish surface | P0 | Not Started |
| NFR-004 | The system SHALL automatically exclude sensitive files from packaging (security check) | P0 | Not Started |
| NFR-005 | The system SHALL support auto-compaction with 15,000 token reservation | P0 | Not Started |
| NFR-006 | All continuity reads SHALL be O(1) via in-memory cache with lazy disk loading | P1 | Not Started |
| NFR-007 | The system SHALL not have any external runtime dependencies beyond `@opencode-ai/plugin` and `@opencode-ai/sdk` | P0 | Not Started |

---

## 17. Known Limitations and Future Work

| ID | Limitation | Impact | Priority |
|----|------------|--------|----------|
| LIM-001 | No test suite (unit, integration, or E2E) | High — no automated quality gates | P0 |
| LIM-002 | All category configs use hardcoded `openai/gpt-5.4` model | Medium — no model fallback or configuration | P1 |
| LIM-003 | No rate limiting beyond concurrency queue (no calls-per-time-window) | Medium — potential API rate limit violations | P1 |
| LIM-004 | Single checkpoint per session (no checkpoint history) | Low — cannot recover to earlier checkpoint | P2 |
| LIM-005 | No graceful shutdown for background observers | Medium — fire-and-forget with no cancellation | P1 |
| LIM-006 | No error recovery for disk corruption beyond empty store | Medium — silent state loss on corruption | P1 |
| LIM-007 | SDK client typed as `any` throughout | Medium — fragile any-path pattern necessary | P1 |
| LIM-008 | SSE reconnection logic not defined | Low — SSE failures degrade to polling | P2 |
| LIM-009 | Agent prompts lack model-specific variants | Low — assumes single model behavior | P2 |
| LIM-010 | Conductor combines Prometheus + Atlas roles for MVP; no separate session-lifecycle agent | Low — single agent handles both routing and lifecycle | P2 |

---

## Validation History

### Version 3.0 Corrections (2026-04-02)

This version corrects all contradictions identified between the specification and the actual OpenCode platform capabilities.

| ID | Issue | Resolution |
|----|--------|------------|
| V3-1 | `doom_loop` described as a configurable threshold | **Fixed:** doom_loop is a permission action (allow/ask/deny), not a threshold. Platform always detects at 3 identical calls. Harness circuit breaker (threshold 16) is a separate mechanism in `tool.execute.before` hook. PERM-002 and GRD-004 now clearly distinguish these. |
| V3-2 | Custom tools (`delegate-task`, `context-checkpoint_*`) treated as platform primitives | **Fixed:** Added Section 15 with explicit custom tool definitions. All three tools are documented as harness-registered via `tool()` factory. CHK-001 and PERM-008 now state "NOT a platform primitive." |
| V3-3 | Implicit references to `reserveConcurrencySlot()` and `getAvailableSpawnCapacity()` as platform APIs | **Fixed:** CON-001 and BUD-001 explicitly mark concurrency and budget as harness-internal abstractions. Added Section 14 boundary table. |
| V3-4 | Environment variables presented as platform-native | **Fixed:** ARCH-007, PER-001, CHK-005, and GRD-002 now mark `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`, and `MAX_DESCENDANTS` as harness-specific. |
| V3-5 | `permission.task` glob pattern semantics undocumented | **Fixed:** Added explanation in Section 4.1 header with example: `"task": { "*": "deny", "explore": "allow" }`. PERM-004/005/006 use this pattern explicitly. |
| V3-6 | `/harness-doctor` described as aspirational "8-point health diagnostics" | **Fixed:** CMD-004 now specifies 5 concrete, testable checks: plugin loaded, continuity file valid, agent files exist, command files exist, skill files exist. |
| V3-7 | OMO role mapping unclear for MVP | **Fixed:** AGT-002 now states conductor combines Prometheus + Atlas roles for MVP. Added LIM-010 as known limitation. |
| V3-8 | SDK references used invented method names | **Fixed:** Section 9 now lists actual SDK methods with their correct signatures. SDK-001 through SDK-007 reference real methods only. |

### Previous Validation (Version 2.0)

**Auditor:** Architecture Validator  
**Date:** 2026-04-02  
**Method:** Requirement-by-requirement validation against OpenCode platform capabilities and OMO proven patterns.  

### CRITICAL: Resolved (v2.0)

| ID | Issue | Resolution |
|----|--------|------------|
| C-1 | `delegate-task` is not a native OpenCode permission | Resolved: PERM-008 requires harness to register `delegate-task` as a custom tool via plugin `tool()` API. PERM-004, PERM-005, PERM-006 refactored to use native `task` permission with glob patterns (`task: { "*": "deny" }`). |
| C-2 | Dynamic permissions cannot be passed to session creation | Resolved: PERM-007 refactored to use plugin `tool.execute.before` hooks for enforcement. Static agent permissions provide base layer; plugin hooks add per-delegation restrictions. |
| C-3 | SDK-002 references non-existent `promptAsync` method | Resolved: SDK-002 rewritten to use `client.session.prompt()` for synchronous delegation and `client.session.prompt()` + `client.event.subscribe()` for asynchronous delegation. |
| C-4 | `session.create()` does not accept tool restrictions | Resolved: Architecture refactored to rely on agent-level static permissions + plugin-hook-enforced restrictions. Delegation uses `client.session.create({ title })` + `client.session.prompt({ body: { model, parts } })`. |

### HIGH: Resolved (v2.0)

| ID | Issue | Resolution |
|----|--------|------------|
| H-1 | maxDescendants=50 is 5x OMO's proven limit | Resolved: GRD-002 changed to default 10, made configurable. |
| H-2 | Concurrency=1 is overly conservative | Resolved: CON-003 changed to default 3-5 per lane, configurable per lane key pattern. |
| H-3 | Missing OMO's 6-section delegation prompt format | Resolved: Added CAT-009 requiring structured sections. |
| H-4 | Missing background task manager pattern | Resolved: Added Section 5.4 with BGT-001 through BGT-004. |
| H-5 | Missing OMO's planning triad pattern | Resolved: Added Section 13 with PLN-001 through PLN-004. |
| H-6 | Missing model-specific prompt variants | Resolved: LIM-009 added as known limitation. |
| H-7 | Polling when SSE events are available | Resolved: LIF-006 refactored to use SSE as primary, polling as degraded fallback. |

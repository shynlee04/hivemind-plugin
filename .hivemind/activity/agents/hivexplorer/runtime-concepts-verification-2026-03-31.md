---
title: "Runtime Concepts Verification"
date: 2026-03-31
agent: hivexplorer
scope: session-lifecycle, context-pruning, runtime-injection, main-vs-subagent
git_commit: HEAD
---

# Runtime Concepts Verification — 2026-03-31

**Scope:** Verification of user's architectural assumptions about "runtime" concepts against actual codebase and OpenCode SDK
**Question:** Do the four assumed "runtime events" (session lifecycle, context pruning, runtime injection, main vs subagent sessions) exist as coded?
**Git commit at investigation:** See `git status` — worktree on `product-detox` branch with many modified/deleted files
**Investigation date:** 2026-03-31

---

## 1. Session Lifecycle

### What Exists (verified from code)

**OpenCode SDK provides these session lifecycle APIs** (`.sdk-lib/opencode/opencode-server.md`, lines 80-98):
- `POST /session` — Create a new session (body: `{ parentID?, title? }`)
- `POST /session/:id/fork` — Fork an existing session at a message (body: `{ messageID? }`)
- `POST /session/:id/revert` — Revert a message (body: `{ messageID, partID? }`)
- `POST /session/:id/unrevert` — Restore all reverted messages
- `POST /session/:id/abort` — Abort a running session
- `DELETE /session/:id` — Delete a session
- `GET /session/:id/children` — Get a session's child sessions
- `PATCH /session/:id` — Update session properties

**HiveMind tracks these session events** (`src/hooks/event-handler.ts`, lines 104-121):
- `session.created` — Creates consolidated session file, links parent/child
- `session.updated` — Records update event
- `session.error` — Records error + diagnostic
- `session.deleted` — Records deletion, marks status as 'abandoned'
- `session.diff` — Records file diff
- `session.idle` — Records idle event
- `session.compacted` — Creates recovery checkpoint
- `agent.created` — Records in parent session (not child file)

**Session state detection** (`src/features/session-entry/session-state.ts`, lines 3-17):
- Detects 4 states: `'fresh'`, `'ongoing'`, `'continuation'`, `'sub-session'`
- Based on `sessionScope`, `hasHandoff`, `hasWorkflow` flags

**Session journal hierarchy** (`src/features/session-journal/hierarchy-writer.ts`, lines 5-79):
- Maintains `HierarchyNode` with `sessionId`, `parentSessionId`, `childSessionIds`
- `appendHierarchyLink()` writes parent→child relationships to disk

**Event tracker types** (`src/features/event-tracker/types.ts`, lines 15-26):
- Event types: `user_message`, `assistant_output`, `tool_invocations`, `delegation_created`, `delegation_returned`, `compaction`, `session_start`, `session_end`, `injection`, `error`

**Trajectory system** (`src/core/trajectory/trajectory-types.ts`, lines 5-155):
- Supports: `active`/`closed` status, `attach-active`, `resume-closed`, `create-new`, `defer-pending`, `refuse-conflict` actions
- Events: `summary`, `handoff`, `evidence`, `transition`, `note`
- Checkpoints with `resumeTarget` for recovery

### What's Missing / Assumed

| User Assumption | Actual Code Reality |
|---|---|
| "redo/undo turns" | **NOT in HiveMind code.** OpenCode SDK has `revert`/`unrevert` at the *message* level (server.md lines 97-98), but HiveMind has zero references to `fork`, `redo`, or `undo` in any `.ts` file. Grep returned 0 matches for `fork|redo|undo` in `src/`. |
| "resume sessions" | **Partially exists.** Trajectory has `resume-closed` action and `resumeTarget` field, but no explicit "resume session" API is wired in HiveMind. The SDK has no explicit "resume" endpoint — only `fork` and `revert`. |
| "session lifecycle events affect harness" | **Confirmed.** `event-handler.ts` line 449: `session.compacted` triggers `createRecoveryCheckpoint()`. The harness (`harness.ts` lines 234-299) reads trajectory ledger and assesses recovery state. |

### Evidence (file paths + line refs)

| Finding | File | Line(s) |
|---|---|---|
| SDK session APIs (create, fork, revert, unrevert, abort, delete, children) | `.sdk-lib/opencode/opencode-server.md` | 80-98 |
| SDK session methods (list, get, create, delete, update, fork, abort, revert, unrevert) | `.sdk-lib/opencode/opencode-sdk.md` | 188-208 |
| Session event handler (created, updated, error, deleted, diff, idle, compacted) | `src/hooks/event-handler.ts` | 172-459 |
| Session state detection (fresh, ongoing, continuation, sub-session) | `src/features/session-entry/session-state.ts` | 3-17 |
| Hierarchy writer (parent/child session links) | `src/features/session-journal/hierarchy-writer.ts` | 5-79 |
| Event types enum | `src/features/event-tracker/types.ts` | 15-26 |
| Trajectory types (status, actions, events, checkpoints) | `src/core/trajectory/trajectory-types.ts` | 5-155 |
| Zero matches for fork/redo/undo in src/ | grep result | N/A |
| Recovery checkpoint on session.compacted | `src/hooks/event-handler.ts` | 449-458 |

---

## 2. Context Pruning

### What Exists

**OpenCode SDK compaction config** (`.sdk-lib/opencode/opencode-configs.md`, lines 398-414):
```json
{
  "compaction": {
    "auto": true,       // Automatically compact when context is full
    "prune": true,      // Remove old tool outputs to save tokens
    "reserved": 10000   // Token buffer for compaction
  }
}
```
This is **SDK-level configuration**, not HiveMind code. OpenCode handles compaction internally.

**HiveMind compaction handler** (`src/hooks/compaction-handler.ts`, lines 1-159):
- Hooks into `session.compacting` event
- Records compaction event to consolidated session JSON
- Increments `compactionCount` counter
- Appends to markdown journal
- Does NOT control what gets pruned — only *records* that compaction happened
- Importance determined by context length: >30 = high, >10 = medium, ≤10 = low (line 51)

**Compaction adapter in plugin** (`src/plugin/opencode-plugin.ts`, lines 246-249):
- Wires both `compactionHandler` (from `compaction-adapter.ts`) and `compactionJournalHandler`
- Both run on `experimental.session.compacting` hook

**Prompt packet compiler** (`src/context/prompt-packet/prompt-compiler.ts`, lines 1-37):
- Compiles different packets for `main` vs `sub-session` scope
- Uses `renderMainSystemPacket` / `renderSubsessionSystemPacket`
- Does NOT implement pruning — only packet assembly

**Dynamic context pruning reference** (`.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml`):
- This is a **Repomix-packed external project** (10,073 lines), NOT integrated into HiveMind
- Contains `lib/commands/`, `lib/compress/`, `lib/context/` — appears to be a separate tool
- **Zero imports or references** to this directory exist in `src/`

**Event tracker compaction recording** (`src/features/event-tracker/consolidated-writer.ts`):
- `compactionCount` is a tracked counter in `SessionV3Counters` (types.ts line 347)
- Compaction events stored as `type: 'compaction'` in session JSON

### What's Missing

| User Assumption | Actual Code Reality |
|---|---|
| "profile body gets pruned over many turns" | **NOT in HiveMind code.** HiveMind only *records* compaction events. The actual pruning is done by OpenCode's internal compaction system (SDK-level). HiveMind has no control over what gets pruned. |
| "dynamic context pruning is integrated" | **FALSE.** The `.sdk-lib/dynamic-context-prunning/` directory is a Repomix-packed external project. No TypeScript file in `src/` imports from it. It is reference material only. |
| "HiveMind controls context pruning" | **FALSE.** HiveMind's compaction handler is purely observational — it logs compaction events but does not influence the compaction prompt or pruning strategy. |

### Evidence (file paths + line refs)

| Finding | File | Line(s) |
|---|---|---|
| SDK compaction config (auto, prune, reserved) | `.sdk-lib/opencode/opencode-configs.md` | 398-414 |
| Compaction handler (records events, doesn't control pruning) | `src/hooks/compaction-handler.ts` | 34-98, 109-159 |
| Compaction wired in plugin | `src/plugin/opencode-plugin.ts` | 246-249 |
| Prompt packet compiler (main vs sub-session, no pruning) | `src/context/prompt-packet/prompt-compiler.ts` | 1-37 |
| Dynamic context pruning is external/unreferenced | `.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml` | 1-50 |
| compactionCount in SessionV3Counters | `src/features/event-tracker/types.ts` | 347 |
| Compaction importance by context length | `src/hooks/compaction-handler.ts` | 50-51 |

---

## 3. Runtime Injection — Commands, Prompts, Rules, Permissions

### What Exists

**Slash command bundles** (`src/commands/slash-command/command-bundles.ts`, lines 4-179):
- 10 registered bundles: `hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`, `hm-research`, `hm-plan`, `hm-implement`, `hm-verify`, `hm-tdd`, `hm-course-correct`
- Each bundle has: `workflowChain`, `toolGrantIds`, `pressureContract`, `continuationMode`, `stateAuthority`
- Only these `hm-*` commands are registered — NOT the 33 noise commands mentioned in AGENTS.md

**Control plane registry** (`src/control-plane/control-plane-registry.ts`, lines 1-268):
- 4 primitives: `hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`
- Gate detection: auto-routes to init/doctor/harness/settings based on `StartWorkInput` state
- `resolveControlPlaneGate()` evaluates all primitives sequentially

**System transform handler** (`src/hooks/transform-handler.ts`, lines 1-46):
- Hooks into `system.transform` (experimental)
- Captures injection payload (agent, purposeClass, contextBlock) into `injection-store`
- Does NOT modify the system prompt — only *captures* what OpenCode produces

**Plugin hook wiring** (`src/plugin/opencode-plugin.ts`, lines 90-251):
- **Wired hooks:** `event`, `experimental.chat.system.transform`, `chat.message`, `permission.ask`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `command.execute.before`, `experimental.text.complete`, `experimental.chat.messages.transform`, `experimental.session.compacting`
- **NOT wired:** `chat.params`, `chat.headers`, `tool.definition`, `config`, `auth` (these are "Available" per AGENTS.md but not used)
- 13 tools registered (lines 122-135)

**Runtime entry / init** (`src/features/runtime-entry/`, 25 files):
- `init.ts` — Bootstrap control plane
- `doctor.ts` — Repair control plane
- `harness.ts` — Validate workflow readiness
- `attachment.ts` — Runtime attachment state
- `nl-first-dispatch.ts` — Natural language command dispatch
- `workflow-continuity.ts` — Workflow delegation continuity
- `snapshot-loader.ts` — Turn snapshot loading
- `instruction-loader.ts` — Command asset loading

**Command injection on execution** (`src/plugin/opencode-plugin.ts`, lines 185-225):
- `command.execute.before` hook injects `<hivemind-command-context>` synthetic part
- Includes: command ID, trajectory, workflow, task IDs, tool precedence chain, mutation rule

**Skill injection** (`src/shared/tiered-injection.ts`, lines 1-230+):
- Tiered skill resolution: shared → tier1 → agent → tier2 → purpose → subsession_additions
- `subsession_additions` for sub-session scope
- Agent-specific skill bundles

**Permission handling** (`src/plugin/opencode-plugin.ts`, lines 154-171):
- `permission.ask` hook auto-allows HiveMind managed tools
- Shows governance toast for write mutations

### What's Missing / Dead Code

| User Assumption | Actual Code Reality |
|---|---|
| "commands can refresh agent behavior" | **Partially true.** Commands inject context via `command.execute.before` hook (plugin.ts lines 185-225), but this is per-command-execution, not a persistent "refresh." |
| "prompts (workflows) can refresh agent behavior" | **True via skill injection.** `tiered-injection.ts` resolves skills per session scope, agent, purpose class. Sub-sessions get different skill sets. |
| "rules can refresh agent behavior" | **NOT directly.** Rules are OpenCode-level (instructions config). HiveMind doesn't manage rules dynamically. |
| "permissions can refresh agent behavior" | **Partially.** `permission.ask` auto-allows HiveMind tools but doesn't dynamically change agent permissions mid-session. |
| "agents can refresh agent behavior" | **True via agent switching.** OpenCode SDK supports agent switching (Tab key, @mention). HiveMind tracks agent in session state. |
| "skills can refresh agent behavior" | **True via tiered injection.** Skills are resolved per-turn based on agent, purpose, scope. |

### Evidence (file paths + line refs)

| Finding | File | Line(s) |
|---|---|---|
| 10 slash command bundles registered | `src/commands/slash-command/command-bundles.ts` | 4-179 |
| 4 control plane primitives with gate detection | `src/control-plane/control-plane-registry.ts` | 132-264 |
| System transform handler (captures, doesn't modify) | `src/hooks/transform-handler.ts` | 23-45 |
| Plugin hooks wired (11 of 17 available) | `src/plugin/opencode-plugin.ts` | 115-250 |
| Command context injection on execute | `src/plugin/opencode-plugin.ts` | 185-225 |
| Tiered skill injection (6 tiers) | `src/shared/tiered-injection.ts` | 1-230+ |
| Permission auto-allow for HiveMind tools | `src/plugin/opencode-plugin.ts` | 154-171 |
| Runtime entry module (25 files) | `src/features/runtime-entry/` | directory listing |
| SDK compaction config | `.sdk-lib/opencode/opencode-configs.md` | 398-414 |

---

## 4. Main vs Subagent Sessions

### What Exists

**OpenCode SDK distinguishes agent modes** (`.sdk-lib/opencode/opencode-agents.md`, lines 13-89):
- **Primary agents:** Main assistants user interacts with directly (Build, Plan)
- **Subagents:** Specialized assistants invoked by primary agents or via @mention (General, Explore)
- Hidden system agents: compaction, title, summary
- Navigation: `session_child_first`, `session_child_cycle`, `session_parent` keybinds
- Subagents create **child sessions** via the SDK

**HiveMind explicitly distinguishes session types** (`src/hooks/event-handler.ts`, lines 187-206):
```typescript
// Check if this is a subagent session — skip file creation
const isSubagent = readStringProperty(
  sessionProperties,
  'parentSessionId',
  'parentSessionID',
  'parent_session_id'
)

if (isSubagent) {
  // Subagent sessions don't get their own files.
  // Still try to link parent/child if parent was already tracked.
  ...
  return
}
```

**Session scope types** (`src/context/prompt-packet/prompt-packet-types.ts`, line 1):
```typescript
export type SessionScope = 'main' | 'sub-session'
```

**Session state detection** (`src/features/session-entry/session-state.ts`, lines 3-6):
```typescript
if (input.sessionScope === 'sub-session') {
  return 'sub-session'
}
```

**Prompt packet compilation differs by scope** (`src/context/prompt-packet/prompt-compiler.ts`, lines 19-36):
- `main` scope → `renderMainSystemPacket` + `renderMainMessagePacket`
- `sub-session` scope → `renderSubsessionSystemPacket` + `renderSubsessionMessagePacket`

**Delegation packet** (`src/delegation/delegation-packet.ts`, lines 9-29):
- Explicitly tracks `sourceSessionId`, `targetSessionId`, `sourceAgent`, `targetAgent`
- Links to `trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`

**Subsession skill additions** (`src/shared/tiered-injection.ts`, lines 229-230):
```typescript
if (sessionState === 'sub-session') {
  for (const skill of config.subsession_additions) { ... }
}
```

**Session V3 schema** (`src/features/event-tracker/types.ts`, lines 362-379):
- `parentSessionId: string | null`
- `subsessionIds: string[]`
- `resumable: boolean`

**Hierarchy tracking** (`src/features/session-journal/hierarchy-writer.ts`, lines 5-79):
- `HierarchyNode` with `parentSessionId` and `childSessionIds`
- `appendHierarchyLink()` maintains bidirectional parent-child links

**Event handler skips subagent file creation** (`src/hooks/event-handler.ts`, lines 190-206, 240-268):
- `session.created` with `parentSessionId` → skips file creation, only links
- `agent.created` with `parentSessionId` → records event in parent session, no child file

### What's Missing

| User Assumption | Actual Code Reality |
|---|---|
| "Two session types: main-facing users vs delegated subagents" | **CONFIRMED.** Code-level distinction exists via `SessionScope = 'main' | 'sub-session'`, different prompt rendering, different skill injection, different file creation behavior. |
| "Subagent sessions are fully tracked" | **PARTIALLY.** Subagent sessions do NOT get their own consolidated session files (event-handler.ts line 198: `return`). They are only linked in the parent's `subsessionIds` array and hierarchy JSON. |
| "Subagent sessions can resume independently" | **NOT supported.** Since subagent sessions don't get their own files, they cannot be independently resumed. Only the parent session is tracked. |

### Evidence (file paths + line refs)

| Finding | File | Line(s) |
|---|---|---|
| SDK agent modes (primary vs subagent) | `.sdk-lib/opencode/opencode-agents.md` | 13-89 |
| Subagent session detection + skip file creation | `src/hooks/event-handler.ts` | 190-206 |
| SessionScope type ('main' \| 'sub-session') | `src/context/prompt-packet/prompt-packet-types.ts` | 1 |
| Session state detection for sub-session | `src/features/session-entry/session-state.ts` | 3-6 |
| Different prompt rendering by scope | `src/context/prompt-packet/papt-compiler.ts` | 19-36 |
| Delegation packet with source/target sessions | `src/delegation/delegation-packet.ts` | 9-29 |
| Subsession skill additions | `src/shared/tiered-injection.ts` | 229-230 |
| Session V3 with parentSessionId + subsessionIds | `src/features/event-tracker/types.ts` | 362-379 |
| Hierarchy writer for parent-child links | `src/features/session-journal/hierarchy-writer.ts` | 5-79 |
| agent.created records in parent, not child | `src/hooks/event-handler.ts` | 240-268 |

---

## Verdict Table

| # | User Assumption | Verified? | Evidence | Severity if Wrong |
|---|---|---|---|---|
| 1a | Session create/resume exists | **PARTIAL** | SDK has create/fork/revert. HiveMind tracks created/updated/deleted/compacted. No explicit "resume" API in HiveMind. | MEDIUM — resume is via trajectory checkpoints, not session-level |
| 1b | Session fork exists | **YES (SDK only)** | SDK: `POST /session/:id/fork` (server.md line 91). HiveMind: zero references to fork in src/. | LOW — SDK provides it, HiveMind doesn't wrap it |
| 1c | Session redo/undo exists | **NO** | Zero matches for `fork\|redo\|undo` in any `.ts` file under `src/`. SDK has `revert`/`unrevert` at message level only. | **HIGH** — user assumes turn-level undo that doesn't exist |
| 2a | Profile body gets pruned over turns | **PARTIAL** | OpenCode SDK handles compaction internally (configs.md lines 398-414). HiveMind only *records* compaction events, doesn't control pruning. | **HIGH** — user overestimates HiveMind's control over context |
| 2b | Dynamic context pruning is integrated | **NO** | `.sdk-lib/dynamic-context-prunning/` is an external Repomix pack. Zero imports from it in `src/`. | **HIGH** — assumed integration doesn't exist |
| 3a | Commands can refresh agent behavior | **PARTIAL** | Commands inject context via `command.execute.before` hook (plugin.ts lines 185-225). Per-execution, not persistent refresh. | LOW — works but not as a "refresh" mechanism |
| 3b | Prompts/workflows can refresh agent behavior | **YES** | Tiered skill injection resolves skills per session scope, agent, purpose class (tiered-injection.ts). | LOW — confirmed |
| 3c | Rules can refresh agent behavior | **NO** | Rules are OpenCode-level (instructions config). HiveMind doesn't manage rules dynamically. | MEDIUM — rules are static config, not runtime-injectable |
| 3d | Permissions can refresh agent behavior | **PARTIAL** | `permission.ask` auto-allows HiveMind tools but doesn't dynamically change agent permissions mid-session. | LOW — works as designed |
| 3e | Agents can refresh agent behavior | **YES** | OpenCode SDK supports agent switching. HiveMind tracks agent in session state. | LOW — confirmed |
| 3f | Skills can refresh agent behavior | **YES** | Tiered injection resolves skills per-turn based on agent, purpose, scope. | LOW — confirmed |
| 4a | Two session types: main vs subagent | **YES** | `SessionScope = 'main' \| 'sub-session'`. Different prompt rendering, skill injection, file creation. | LOW — confirmed |
| 4b | Subagent sessions are fully tracked | **NO** | Subagent sessions do NOT get their own consolidated files (event-handler.ts line 198). Only linked in parent's `subsessionIds`. | **HIGH** — user assumes independent tracking that doesn't exist |
| 4c | Subagent sessions can resume independently | **NO** | No independent file = no independent resume. Only parent session is tracked. | **HIGH** — assumed capability doesn't exist |

---

## Summary of Critical Gaps

1. **Turn-level undo/redo does not exist.** The SDK has message-level `revert`/`unrevert`, but HiveMind has zero code for fork/redo/undo. The user's assumption about "redo/undo turns" is unfounded.

2. **HiveMind does NOT control context pruning.** Compaction is handled entirely by OpenCode SDK. HiveMind's compaction handler is purely observational — it logs events but doesn't influence what gets pruned or how.

3. **Dynamic context pruning is NOT integrated.** The `.sdk-lib/dynamic-context-prunning/` directory is reference material (a Repomix-packed external project), not part of the codebase.

4. **Subagent sessions are NOT independently tracked.** They don't get their own session files. Only the parent session tracks them via `subsessionIds` array. This means subagent work cannot be independently resumed, audited, or recovered.

5. **Rules are not runtime-injectable.** Rules come from OpenCode's `instructions` config (static file paths/globs). HiveMind doesn't have a mechanism to dynamically inject or swap rules during a session.

---

## Investigation Metadata

- **Investigator:** hivexplorer (Terminal Repository Investigator)
- **Date:** 2026-03-31
- **Files examined:** 40+ TypeScript files across src/, .sdk-lib/opencode/
- **Grep commands executed:** 6 (fork/redo/undo, revert, subagent/sub-session, parentSession/childSession)
- **Confidence:** HIGH — all claims backed by exact file:line references
- **Output path:** `.hivemind/activity/agents/hivexplorer/runtime-concepts-verification-2026-03-31.md`

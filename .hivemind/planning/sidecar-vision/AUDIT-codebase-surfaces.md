[LANGUAGE: Write this file in en per Language Governance.]
# Codebase Surfaces Audit — Bidirectional Sidecar GUI

**Audit Date:** 2026-06-02
**Focus:** All Hivemind plugin surfaces needed by a Next.js 16 + @json-render/react sidecar control panel
**Method:** Source-code inspection of `src/plugin.ts`, `src/index.ts`, `src/sidecar/readonly-state.ts`, `src/hooks/`, `src/tools/`, `src/coordination/delegation/`, `src/task-management/`, `src/features/`, plus runtime state directories under `.hivemind/`

---

## Summary

| Category | Surface Count | Read Surfaces | Write Surfaces |
|----------|--------------|---------------|----------------|
| State files (disk) | 5 | 5 | 0 (sidecar read-only per SIDECAR-03) |
| Registered tools | 27 | 15 | 12 |
| Plugin hooks | 5 | n/a (observers) | 3 (guards/transforms) |
| Delegation modules | 21 | 12 | 9 |
| Tmux integration | 7 | 2 | 4 |
| Session-tracker files | 4 types | 4 | 0 |
| Trajectory | 5 | 3 | 2 |
| Pressure | 6 | 3 | 1 |
| Config | 8 | 4 | 2 |
| Public API exports | 30 modules | 30 | n/a |
| **Total unique surfaces** | **~85** | **~60** | **~25** |

---

## 1. State Files on Disk (`.hivemind/`)

Read-only access via `src/sidecar/readonly-state.ts` (SIDECAR-03). Path containment: only `.hivemind/state/` and `.planning/` prefixes.

| Surface | Location | Type | Sidecar Use | R/O or R/W |
|---------|----------|------|-------------|------------|
| Project continuity index | `.hivemind/session-tracker/project-continuity.json` | JSON (v2.0 schema) | Display all tracked sessions, status, child counts, delegation depth | Read |
| Session continuity index | `.hivemind/session-tracker/{sessionID}/session-continuity.json` | JSON | Display per-session hierarchy tree, tool summary, turn count | Read |
| Hierarchy manifest | `.hivemind/session-tracker/{sessionID}/hierarchy-manifest.json` | JSON | Display flattened delegation tree, child status, subagent types | Read |
| Main session knowledge file | `.hivemind/session-tracker/{sessionID}/{sessionID}.md` | Markdown with YAML frontmatter | Display session metadata, title, children, parent | Read |
| Child session journal files | `.hivemind/session-tracker/{sessionID}/{childID}.json` | JSON (`ChildSessionRecord`) | Display delegation turns, tool calls, journey entries | Read |
| Quarantined orphan dirs | `.hivemind/session-tracker/quarantine/` | Directory | Display quarantined sessions for admin | Read |
| Hivemind config | `.hivemind/configs.json` | JSON | Display runtime config, mode, delegation systems | Read |
| Hivemind config schema | `.hivemind/configs.schema.json` | JSON Schema | Validate config changes | Read |
| Planning documents | `.hivemind/planning/` | Dir | Display planning artifacts, UAT, research | Read |

**Note:** Legacy `.hivemind/state/delegations.json` and `session-continuity.json` were removed by P41-D migration. All state now lives under `.hivemind/session-tracker/`.

---

## 2. Registered Plugin Tools (27 total)

All registered in `src/plugin.ts` lines 657-684. Each tool has a Zod schema in its implementation file.

### 2A. Delegation Tools (3)

| Tool | Location | Input Schema | Sidecar Use | R/O or R/W |
|------|----------|-------------|-------------|------------|
| `delegate-task` | `src/tools/delegation/delegate-task.ts` | Agent, prompt, context, stackOnSessionId, parentSessionId | Browser → trigger delegation | Write (via SDK) |
| `delegation-status` | `src/tools/delegation/delegation-status.ts` | DelegationId, status, action, control, agentFilter | Display delegation tree, check status | Read |
| `run-background-command` | `src/tools/hivemind/run-background-command.ts` | Action, command, args, cwd, env, sessionId, offset, input | Trigger CLI commands from sidecar | Write |

### 2B. Session Tools (7)

| Tool | Location | Input Schema | Sidecar Use | R/O or R/W |
|------|----------|-------------|-------------|------------|
| `execute-slash-command` | `src/tools/session/execute-slash-command.ts` | Command, arguments, agent, model, subtask, stackOnSessionId | Execute OpenCode commands from sidecar | Write |
| `session-patch` | `src/tools/session/session-patch/index.ts` | SessionFilePath, section, newContent | Patch session context from UI | Write |
| `session-journal-export` | `src/tools/session/session-journal-export.ts` | Format, sessionId, pipelineKey | Export session journal for display | Read |
| `session-tracker` | `src/tools/session/session-tracker.ts` | Action, sessionId, query, limit, format, status, agentType, timeRange | Query session tracker data for display | Read |
| `session-hierarchy` | `src/tools/session/session-hierarchy.ts` | Action, sessionId, includeStatus | Navigate delegation hierarchy | Read |
| `session-context` | `src/tools/session/session-context.ts` | Action, sessionId, query, maxRelated, groupBy | Cross-session synthesis and discovery | Read |
| `session-delegation-query` | `src/tools/session/session-delegation-query.ts` | Action, rootSessionId, status, agentType, offset, limit | Query delegation history | Read |

### 2C. Hivemind Tools (9)

| Tool | Location | Input Schema | Sidecar Use | R/O or R/W |
|------|----------|-------------|-------------|------------|
| `hivemind-doc` | `src/tools/hivemind/hivemind-doc.ts` | Action, path, query, maxCharacters, maxResults | Read/skim/search docs from sidecar | Read |
| `hivemind-trajectory` | `src/tools/hivemind/hivemind-trajectory.ts` | Action, trajectoryId, rootSessionId, sessionId, depth | Display + modify trajectory ledger | Write |
| `hivemind-pressure` | `src/tools/hivemind/hivemind-pressure.ts` | Action, score, tier, toolName, trajectoryId | Classify/detect pressure, attach to trajectory | Write |
| `hivemind-sdk-supervisor` | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | Action, sessionId, maxDiagnostics | Monitor SDK wrapper health | Read |
| `hivemind-command-engine` | `src/tools/hivemind/hivemind-command-engine.ts` | Action, commandName, arguments, context, messages | Discover commands, analyze contracts, preview routes | Read |
| `hivemind-session-view` | `src/tools/hivemind/hivemind-session-view.ts` | Action, sessionId | Unified session view across 3 data roots | Read |
| `hivemind-agent-work-create` | `src/tools/hivemind/hivemind-agent-work.ts` | ownerAgent, taskBoundary, allowedSurfaces, etc. | Create work contracts from sidecar | Write |
| `hivemind-agent-work-export` | `src/tools/hivemind/hivemind-agent-work.ts` | contractId, format | Export work contracts for display | Read |
| `create-governance-session` | `src/features/governance-engine/index.ts` | Agent, brief, title | Create governance sessions from UI | Write |

### 2D. Config Tools (6)

| Tool | Location | Input Schema | Sidecar Use | R/O or R/W |
|------|----------|-------------|-------------|------------|
| `configure-primitive` | `src/tools/config/configure-primitive.ts` | Action, primitive, spec, name, scope, dryRun, compile config | Configure agents/commands/skills from UI | Write |
| `validate-restart` | `src/tools/config/validate-restart.ts` | projectRoot, verbose | Validate primitives after changes | Read |
| `bootstrap-init` | `src/tools/config/bootstrap-init.ts` | projectRoot, scope, nonInteractive, globalConfigDir, config | Bootstrap OpenCode primitives | Write |
| `bootstrap-recover` | `src/tools/config/bootstrap-recover.ts` | projectRoot, scope, globalConfigDir | Repair broken primitives | Write |
| `prompt-skim` | `src/tools/prompt/prompt-skim/index.ts` | Content, workspaceRoot | Analyze prompt length, extract URLs, verify paths | Read |
| `prompt-analyze` | `src/tools/prompt/prompt-analyze/index.ts` | Content | Analyze prompt for contradictions, vagueness | Read |

### 2E. Tmux Tools (2)

| Tool | Location | Input Schema | Sidecar Use | R/O or R/W |
|------|----------|-------------|-------------|------------|
| `tmux-copilot` | `src/tools/tmux-copilot.ts` | Action (send-keys/list-panes/compute-grid/respawn) + params | Visual tmux pane management | Write |
| `tmux-state-query` | `src/tools/tmux-state-query.ts` | Action (list-sessions/get-session/get-summary) + sessionId | Display tmux session/ pane state | Read |

---

## 3. Plugin Hooks (5 types)

Registered in `src/plugin.ts` return block (lines 597-713).

| Hook | Factory | Location | Sidecar Use | Direction |
|------|---------|----------|-------------|-----------|
| `event` | `createCoreHooks` + observers | `src/hooks/lifecycle/core-hooks.ts` | SSE push stream for session changes, delegation events, tmux events | Push (SDK → sidecar) via observer pipeline |
| `tool.execute.before` | `createToolBeforeGuard` | `src/hooks/transforms/tool-before-guard.ts` | Monitor tool dispatch, detect child session creation | Intercept (read-only) |
| `tool.execute.after` | `createToolExecuteAfterHook` + `summarizePluginToolOutput` | `src/hooks/transforms/tool-after-composer.ts` | Capture tool result metadata for session-tracker | Intercept (read + write to tracker) |
| `chat.message` | `createChatMessageCapture` | `src/hooks/transforms/chat-message-capture.ts` | Capture chat messages for session knowledge | Intercept (read + write to tracker) |
| `system.transform` | (from session hooks) | `src/hooks/lifecycle/session-hooks.ts` | System prompt transformation, config injection | Transform (write to prompt) |

**Observer pipeline** (line 601-608): 7 observers chained in order:
1. Delegation consumer (`consumeDelegationFact`)
2. Session event observer (`sessionEventObserver`)
3. Session tracker consumer (`consumeSessionTrackerFact`)
4. Session entry consumer (`consumeSessionEntryFact`)
5. Is-main-session consumer (`consumeIsMainSessionFact`)
6. Last-message-capture handler (inline lambda)
7. Tmux event observer (`createTmuxEventObserver`)

**For SSE/WebSocket push from sidecar:** The `event` hook observer pipeline is the ideal injection point. The sidecar would register an additional observer that pushes events via SSE.

---

## 4. Delegation Module Files (21 files)

| File | Class/Type | Sidecar Use | R/O or R/W |
|------|-----------|-------------|------------|
| `src/coordination/delegation/manager.ts` | `DelegationManager` | Read delegation state, trigger dispatch | Write |
| `src/coordination/delegation/coordinator.ts` | `DelegationCoordinator` | Read delegation coordination state | Read |
| `src/coordination/delegation/lifecycle.ts` | `DelegationLifecycle` | Read delegation lifecycle status | Read |
| `src/coordination/delegation/dispatcher.ts` | `DelegationDispatcher` | Monitor dispatch decisions | Read |
| `src/coordination/delegation/monitor.ts` | `DelegationMonitor` | Read failure checkpoints, escalation levels | Read |
| `src/coordination/delegation/notification-router.ts` | `NotificationRouter` | Route notifications to TUI/continuity | Write |
| `src/coordination/delegation/notification-formatter.ts` | Formatting | Format delegation notifications for display | Read |
| `src/coordination/delegation/retry-handler.ts` | RetryHandler | Retry failed delegations | Write |
| `src/coordination/delegation/slot-manager.ts` | `SlotManager` | Read slot usage per queue key | Read |
| `src/coordination/delegation/state-machine.ts` | `DelegationStateMachine` | Read delegation state transitions | Read |
| `src/coordination/delegation/agent-resolver.ts` | `AgentResolver` | Read available agents for delegation | Read |
| `src/coordination/delegation/sdk-child-session-starter.ts` | Starter | Start child sessions via SDK | Write |
| `src/coordination/delegation/session-intelligence.ts` | Intelligence | Stacking recommendations | Read |
| `src/coordination/delegation/resume-resolver.ts` | Resolver | Resolve sessions for resumption | Read |
| `src/coordination/delegation/survival-kit.ts` | Config | Delegation survival kit configuration | Read |
| `src/coordination/delegation/periodic-notifier.ts` | `PeriodicNotifier` | Periodic progress notifications | Write |
| `src/coordination/delegation/escalation-timer.ts` | Timer | Escalation timer management | Read |
| `src/coordination/delegation/completion-detector.ts` | Detector (re-export) | Dual-signal completion detection | Read |
| `src/coordination/delegation/manager-runtime.ts` | RuntimeManager | Runtime adapter for v2 delegation | Write |
| `src/coordination/delegation/types.ts` | Types | All delegation types, error codes, constants | Read (import) |
| `src/coordination/delegation/delegation-persistence.ts` | (in continuity) | Delegation record I/O (preserved at continuity path) | Read |

---

## 5. Tmux Integration (7 files)

| File | Purpose | Sidecar Use | R/O or R/W |
|------|---------|-------------|------------|
| `src/features/tmux/integration.ts` | Factory: creates integration if supported | Wire tmux for visual orchestration | Write (init) |
| `src/features/tmux/types.ts` | `SessionManagerAdapter`, `PaneState`, `PaneTreeNode` | Import types for tmux UI | Read |
| `src/features/tmux/session-manager.ts` | `SessionManager` — tracks sessions → panes | Display session-pane mapping | Read |
| `src/features/tmux/tmux-multiplexer.ts` | `TmuxMultiplexer` — raw tmux commands | Execute tmux commands from UI | Write |
| `src/features/tmux/grid-planner.ts` | `PaneGridPlanner` — computes split sequences | Compute pane layouts | Read |
| `src/features/tmux/observers.ts` | Event observer, `EnrichedSessionEvent` type | Receive session events to update tmux | Write (observes) |
| `src/tools/tmux-copilot.ts` | Tool: send-keys, list-panes, compute-grid, respawn | UI-driven tmux control | Write |
| `src/tools/tmux-state-query.ts` | Tool: list-sessions, get-session, get-summary | Display tmux session metadata | Read |

**Adapter bridge:** `setSessionManagerAdapter()` / `getSessionManagerAdapter()` module-level pattern at `src/features/tmux/types.ts:182-202`. Sidecar could consume the adapter directly for real-time tmux state.

---

## 6. Session Tracker (source — 25+ files)

| Area | Key Files | Sidecar Use |
|------|-----------|-------------|
| Main class | `src/features/session-tracker/index.ts` | Primary API for session knowledge |
| Types | `src/features/session-tracker/types.ts` | All session record, hierarchy, continuity types |
| Event capture | `src/features/session-tracker/capture/event-capture.ts` | Session lifecycle events |
| Message capture | `src/features/session-tracker/capture/message-capture.ts`, `last-message-capture.ts` | Chat message content |
| Tool capture | `src/features/session-tracker/capture/tool-capture.ts` | Tool invocation metadata |
| Persistence | `src/features/session-tracker/persistence/` (11 files) | Atomic writes, hierarchy, indices, retry queue |
| Recovery | `src/features/session-tracker/recovery/session-recovery.ts` | Session recovery workflows |
| Routing | `src/features/session-tracker/session-router.ts` | Session classification routing |
| Classification | `src/features/session-tracker/classification.ts` | Session kind classification |
| Bootstrap | `src/features/session-tracker/bootstrap.ts` | Lazy session bootstrap |
| Orphan cleanup | `src/features/session-tracker/orphan-cleanup.ts` | Quarantine protocol |
| Transform | `src/features/session-tracker/transform/agent-transform.ts` | Agent name transformation |
| Project continuity | `src/features/session-tracker/project-continuity.ts` | Project-index completeness checker |
| Tool delegation | `src/features/session-tracker/tool-delegation.ts` | Child task delegation handler |
| Child recorder | `src/features/session-tracker/child-recorder.ts` | Child session message recording |
| Event handlers | `src/features/session-tracker/capture/handlers/` (8 files) | Per-event-type handlers |

**Session-tracker directory structure on disk:**
```
.hivemind/session-tracker/
├── project-continuity.json        # Index of all sessions
├── ses_{id}/
│   ├── ses_{id}.md                # Main session knowledge file
│   ├── session-continuity.json    # Hierarchy + tool summary
│   ├── hierarchy-manifest.json    # Flattened tree of children
│   └── ses_{childId}.json         # Individual child session records
└── quarantine/                    # Orphaned session directories
```

---

## 7. Trajectory Module (5 files)

| File | Purpose | Sidecar Use | R/O or R/W |
|------|---------|-------------|------------|
| `src/task-management/trajectory/types.ts` | All trajectory types, status enum, state machine | Import types for trajectory UI | Read |
| `src/task-management/trajectory/index.ts` | Barrel re-exports | Public API | Read |
| `src/task-management/trajectory/ledger.ts` | Trajectory ledger I/O | Read/write trajectory records | Write |
| `src/task-management/trajectory/store-operations.ts` | Mutation operations | Create/update/close trajectories | Write |

**State machine:** `planning → executing → verifying → completed → closed`

**Auto-transitions:**
- `delegation:started` → executing
- `execution:complete` → verifying
- `verification:pass` → completed

**Persistence location:** `.hivemind/state/trajectory-ledger.json`

---

## 8. Runtime Pressure Module (6 files)

| File | Purpose | Sidecar Use | R/O or R/W |
|------|---------|-------------|------------|
| `src/features/runtime-pressure/types.ts` | All pressure types, tool authority matrix, decision contract | Import types for pressure UI | Read |
| `src/features/runtime-pressure/index.ts` | Barrel re-exports | Public API | Read |
| `src/features/runtime-pressure/model.ts` | Pressure model logic | Classify pressure scores | Read |
| `src/features/runtime-pressure/authority-matrix.ts` | Tool authority registry | Display tool authority matrix | Read |
| `src/features/runtime-pressure/control-plane.ts` | Control-plane decisions | Display pressure decisions | Read |

**Pressure bands:** steady (0-3) → advisory (4-5) → gated (6-7) → blocking (8-9)

**Tool authority levels:** read, write, execute, state

**Tool state surfaces:** hivemind-state, opencode-primitive, read-only, external-command

---

## 9. Config Module (8 files)

| File | Purpose | Sidecar Use | R/O or R/W |
|------|---------|-------------|------------|
| `src/config/subscriber.ts` | Lazy config cache with fallback | Read active config from cache | Read |
| `src/config/compiler.ts` | Config compilation | Compile config changes | Write |
| `src/config/workflow/index.ts` | Workflow barrel | Workflow state operations | Write |
| `src/config/workflow/workflow-state.ts` | Workflow state management | Mutate workflow state | Write |
| `src/config/workflow/workflow-types.ts` | Workflow type definitions | Import types | Read |
| `src/config/workflow/workflow-persistence.ts` | Workflow persistence I/O | Persist workflow state | Write |
| `src/config/workflow/workflow-guards.ts` | Workflow turn-order guards | Validate workflow transitions | Read |

**Config schema:** `src/schema-kernel/hivemind-configs.schema.ts` — defines `HivemindConfigs` type with `conversation_language`, `mode`, `delegation_systems`, `workflow` flags, etc.

**Persistence:** `.hivemind/configs.json` + `configs.schema.json`

---

## 10. Public API Exports (`src/index.ts`)

30 modules exported for external consumers:

| Export | Source | Sidecar Use |
|--------|--------|-------------|
| `HarnessControlPlane` (default + named) | `src/plugin.ts` | Plugin entry point |
| Queue module | `src/coordination/concurrency/queue.js` | Concurrency operations |
| Continuity module | `src/task-management/continuity/index.js` | Session continuity R/W |
| Helpers | `src/shared/helpers.js` | Utility functions |
| Lifecycle manager | `src/task-management/lifecycle/index.js` | Harness lifecycle |
| Runtime | `src/shared/runtime.js` | Runtime utilities |
| Session API | `src/shared/session-api.js` | SDK session operations |
| State | `src/shared/state.js` | Task state manager |
| Types | `src/shared/types.js` | Shared type definitions |
| Task status | `src/shared/task-status.js` | Task status transitions |
| Completion detector | `src/coordination/completion/detector.js` | Completion detection |
| Runtime policy | `src/shared/runtime-policy.js` | Runtime policy |
| Journal | `src/task-management/journal/index.js` | Session journal operations |
| Journal query | `src/task-management/journal/query.js` | Journal querying |
| Journal replay | `src/task-management/journal/replay.js` | Journal replay |
| Execution lineage | `src/task-management/journal/execution-lineage.js` | Lineage tracking |
| Doc intelligence | `src/features/doc-intelligence/index.js` | Document processing |
| Trajectory | `src/task-management/trajectory/index.js` | Trajectory ledger |
| Runtime pressure | `src/features/runtime-pressure/index.js` | Pressure model |
| Agent work contracts | `src/features/agent-work-contracts/index.js` | Work contract operations |
| SDK supervisor | `src/features/sdk-supervisor/index.js` | SDK health monitoring |
| Command engine | `src/routing/command-engine/index.js` | Command discovery/execution |
| Bootstrap primitives | `src/features/bootstrap/primitive-registry.js` | Primitive registry |
| Bootstrap control plane | `src/features/bootstrap/control-plane/index.js` | Bootstrap gatekeeper |

**Missing exports needed by sidecar:** Session-tracker types (`src/features/session-tracker/types.ts`), delegation types (`src/coordination/delegation/types.ts`), tmux types (`src/features/tmux/types.ts`), pressure types (`src/features/runtime-pressure/types.ts`), hook dependencies type, sidecar read-only state helpers. These are currently internal modules not re-exported.

---

## 11. Sidecar Skeleton (current state)

`src/sidecar/readonly-state.ts` (139 LOC) contains:

- `ReadOnlyStateOptions` — project root config
- `CANONICAL_PREFIXES` — `[".hivemind/state", ".planning"]`
- `isCanonicalStatePath()` — path containment check
- `readCanonicalState()` — sync read with guard
- `readCanonicalStateAsync()` — async read with guard
- `refuseCanonicalWrite()` — write guard (always throws)

**Gaps:**
- Only one file exists in `src/sidecar/` — no HTTP routes, no SSE handler, no JSON API
- No Next.js app directory, page components, or API routes
- No `@json-render/react` component definitions
- No WebSocket/SSE server for real-time push from hooks
- The SIDECAR-03 path containment only covers `.hivemind/state/` — session-tracker lives at `.hivemind/session-tracker/`, which is NOT in the canonical prefixes. **This must be updated** for the sidecar to read session-tracker files.

---

## 12. Sidecar Integration Architecture

### 12A. Read Path (REST API)

```
Sidecar UI → Next.js Route Handler → readCanonicalStateAsync() → .hivemind/session-tracker/{path}
```

For paths NOT under state surface (e.g., `.hivemind/session-tracker/`), implement a separate `readSessionTrackerFile()` guard in `readonly-state.ts`.

### 12B. Write Path (via Plugin Tools)

```
Sidecar UI → Next.js Route Handler → fetch(http://localhost:{port}/api/tools)
  → Plugin server endpoint → execute-tool(name, args)
  → Delegation/Session/Tmux/Config tool → side effect
```

All 27 tools must be callable from the sidecar. This requires either:
1. **Direct SDK client** in the sidecar process (if co-located with plugin)
2. **HTTP proxy** that wraps tool calls (if sidecar is separate Next.js app)
3. **OpenCode server mode** API via `server.port` config

### 12C. SSE Push Path (Real-time)

```
Plugin hook observer pipeline
  → SSE event serializer
  → HTTP response stream
  → Sidecar EventSource client
  → @json-render/react component re-render
```

The `event` hook observer pipeline in `plugin.ts:601-608` is the ideal injection point. Register a new observer that serializes events to an SSE stream.

### 12D. Event Types for SSE

Events the sidecar should receive:

| Event | Trigger | Data | Sidecar Action |
|-------|---------|------|----------------|
| `session.created` | SDK event | sessionID, parentID | Add session to tree view |
| `session.idle` | SDK event | sessionID | Update session status |
| `session.deleted` | SDK event | sessionID | Remove session from tree |
| `session.error` | SDK event | sessionID, error | Show error indicator |
| `delegation:started` | Hook observer | delegationId, agent, parent | Add delegation node |
| `delegation:completed` | Hook observer | delegationId, status, result | Update delegation status |
| `delegation:progress` | NotificationRouter | delegationId, message | Update progress |
| `tool.execute.before` | Guard hook | tool, sessionID, args | Show tool dispatch |
| `tool.execute.after` | Guard hook | tool, sessionID, output | Show tool result |
| `chat.message` | Transform hook | sessionID, role, content | Update chat log |
| `tmux.session.created` | Tmux observer | sessionId, paneId | Update tmux pane view |
| `tmux.pane.closed` | Tmux observer | paneId | Update tmux state |
| `trajectory:updated` | Trajectory store | trajectoryId, status | Update trajectory view |
| `pressure:classified` | Pressure model | score, tier, band | Update pressure gauge |

---

## 13. Identified Gaps & Action Items

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| 1 | `src/sidecar/readonly-state.ts` CANONICAL_PREFIXES does not include `.hivemind/session-tracker/` | Sidecar can't read session-tracker files via read guards | Add `.hivemind/session-tracker` to CANONICAL_PREFIXES |
| 2 | No HTTP/SSE server in sidecar | No way for browser UI to connect | Implement Next.js API routes + SSE endpoint |
| 3 | Session-tracker types not exported from `src/index.ts` | Sidecar can't import `SessionRecord`, `ChildSessionRecord` etc. | Add exports for session-tracker types |
| 4 | Delegation types not exported | Sidecar can't import `Delegation`, `DelegationStatus` etc. | Add exports for delegation types |
| 5 | Runtime-pressure types not exported | Sidecar can't import `PressureTier`, `PressureDecision` | Add exports for pressure types |
| 6 | Tmux types not exported | Sidecar can't import `SessionManagerAdapter`, `PaneState` | Add exports for tmux types |
| 7 | Tmux-state-query returns placeholder data (always empty) | Sidecar can't display real tmux state | Extend `SessionManagerAdapter` with `getSessions()`, update query tool |
| 8 | No sidecar tab components | No UI exists yet for session tree, delegation tree, tmux panes, trajectory, pressure | Implement @json-render/react components in src/sidecar/ |
| 9 | No sidecar-to-plugin auth | Unauthenticated tool access from browser | Implement session token verification between sidecar and plugin |
| 10 | Tool permission gates not sidecar-aware | `tmux-copilot` and `tmux-state-query` gate on orchestrator agent names; sidecar is not an agent | Add `sidecar` (or similar) to orchestrator agent permission list, or implement sidecar-specific gate |

---

## 14. Surface Count Summary

| Source | Count |
|--------|-------|
| State file types on disk | 5 |
| Registered plugin tools | 27 |
| Plugin hook registration points | 5 |
| Hook observer pipeline entries | 7 |
| Delegation module files | 21 |
| Tmux integration files | 7 |
| Session-tracker source files | 25+ |
| Trajectory source files | 5 |
| Pressure source files | 6 |
| Config source files | 8 |
| Public API exports | 30 |
| **Total identified surfaces** | **~85+** |

---

*Audit conducted: 2026-06-02 — Source: direct filesystem and code inspection.*

# Session Inspection Export

- ses_id: `ses_2e56f426dffehPBHp9fw6j56Bf`
- prepared_at: `2026-03-23T12:04:11.629Z`

## Assistant Output

---

# Investigation Report: Time-Machine / Event-Watch Auto-Export System

## Executive Summary

The HiveMind plugin implements a multi-layered event interception and session intelligence export system. The architecture follows a **CQRS pattern** where hooks are read-side observers and tools own write-side mutations. The system captures events at multiple lifecycle points and exports session data through two primary channels: **session-inspection exports** and **diagnostic logs**.

---

## 1. Relevant Files and Their Roles

### Event Interception Layer (`src/hooks/`)

| File | Role |
|------|------|
| `event-handler.ts` | **Root event hook** - Bridges all OpenCode lifecycle events into trajectory ledger. Handles `session.started`, `session.ended`, `session.compacted`, `message.added`, `message.updated`, `tool.executed`, `command.executed`, `agent.created`, `trajectory.started`, `trajectory.ended`. |
| `runtime-loader/tool-governance.ts` | **Tool execution tracking** - Records tool events to trajectory ledger via `recordToolEvent()`. Tracks managed tools like `hivemind_doc`, `hivemind_runtime_status`, etc. |
| `runtime-loader/runtime-stage.ts` | Runtime stage management |
| `workflow-integration/workflow-continuity.ts` | Workflow continuity state building for compaction context |
| `start-work/start-work-router.ts` | Session entry orchestrator - classifies purpose, resolves lineage, assesses trajectory, determines readiness gates |
| `auto-slash-command/` | Auto-command detection and routing |

### Plugin Hook Assembly (`src/plugin/`)

| File | Role |
|------|------|
| `opencode-plugin.ts` | **Plugin entry point** - Registers all hooks with OpenCode SDK. Central wiring for `experimental.text.complete`, `experimental.chat.messages.transform`, `experimental.session.compacting`, `event`, `permission.ask`, `tool.execute.before/after`, etc. |
| `messages-transform-adapter.ts` | **Message transformation** - Injects HiveMind context (turn hierarchy, skill focus, context block) into user messages before LLM processing |
| `compaction-adapter.ts` | **Compaction handler** - Injects HiveMind context during session compaction to preserve essential state |
| `injection-store.ts` | **In-memory injection cache** - Stores injection payloads during messages.transform for retrieval by text.complete hook |
| `runtime-snapshot.ts` | **Per-turn snapshot caching** - Lazy-loads and caches runtime bindings per turn |

### Session Export (`src/sdk-supervisor/`)

| File | Role |
|------|------|
| `session-inspection.ts` | **Session inspection export** - Writes `assistant-output.md` and `purification-command.json` to `.hivemind/session-inspection/<session-id>/` |
| `diagnostic-log.ts` | **Diagnostic log writer** - Writes diagnostic summaries to `.hivemind/error-log/` after each assistant message completion |
| `health.ts` | Supervisor health summaries |
| `runtime-status.ts` | Runtime status snapshots |
| `instance-registry.ts` | Supervisor instance registry |

### Schema/Contracts (`src/shared/contracts/`, `src/core/trajectory/`)

| File | Role |
|------|------|
| `runtime-events.ts` | Zod schema for `RuntimeRecentEvent` |
| `trajectory-store.operations.ts` | Trajectory event recording - `recordTrajectoryEvent()`, `createTrajectoryCheckpoint()` |
| `trajectory-types.ts` | Type definitions for trajectory records |

### Agent Work Contract(`src/features/agent-work-contract/hooks/`)

| File | Role |
|------|------|
| `agent-work-event-handler.ts` | **Event packet extractor** - Extracts validated event packets for `session.compacted` and `command.executed` events |
| `compaction-preservation.ts` | **Compaction context builder** - Creates preservation packets from agent-work contracts to survive compaction |

### Recovery (`src/recovery/`)

| File | Role |
|------|------|
| `recovery-engine.ts` | State assessment, checkpoint creation, and repair operations |

---

## 2. Current Event/Interception Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OpenCode SDK Hook Surface                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  event ─────────────────────────────────────────────────────► event-handler │
│    │                                           │                            │
│    ├── session.started ────────────────────► recordTrajectoryEvent()        │
│    ├── session.ended ──────────────────────► recordTrajectoryEvent()        │
│    ├── session.compacted ──────────────────► recordTrajectoryEvent()        │
│    │                            │               + createRecoveryCheckpoint() │
│    ├── message.added ──────────────────────► recordTrajectoryEvent()│
│    ├── message.updated ────────────────────► recordTrajectoryEvent()        │
│    ├── tool.executed ─────────────────────► recordTrajectoryEvent()        │
│    ├── command.executed ──────────────────► recordTrajectoryEvent()│
│    ├── agent.created ──────────────────────► recordTrajectoryEvent()│
│    ├── trajectory.started ────────────────► recordTrajectoryEvent()│
│    └── trajectory.ended ─────────────────► recordTrajectoryEvent()        │
│                                                                             │
│  experimental.text.complete ───────────────────────────────────────────────►│
│    │    │                                                                   │
│    │    ├── upsertSessionInspectionExport() ──► .hivemind/session-inspection/│
│    │    │                                                                    │
│    │    └── writeDiagnosticLog() ────────────► .hivemind/error-log/         │
│    │                                                                         │
│  experimental.chat.messages.transform ───────────────────────────────────► │
│    │    │                                                                   │
│    │    ├── Inject turn hierarchy context                                   │
│    │    ├── Inject HiveMind context packet                                  │
│    │    ├── Inject skill focus block                                        │
│    │    ├── Store injection payload in injection-store                      │
│    │    └── Inject route hint (if applicable)                               │
│                                                                             │
│  experimental.session.compacting ─────────────────────────────────────────► │
│    │    │                                                                   │
│    │    ├── Load runtime snapshot                                           │
│    │    ├── Resolve agent-work packet (if exists)                           │
│    │    ├── Create HiveMind context packet                                  │
│    │    └── Inject context into compaction prompt──►                        │
│                                                                             │
│  tool.execute.before ─────────────────────────────────────────────────────► │
│    │    │                                                                   │
│    │    └── recordToolEvent(sessionID, tool:pre) for managed tools          │
│                                                                             │
│  tool.execute.after ──────────────────────────────────────────────────────►│
│         │                                                                   │
│         └── recordToolEvent(sessionID, tool) for managed tools              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow: Event Capture to File Output

### Flow A: Session Inspection Export (`experimental.text.complete`)

```
text.complete hook fires
│
├── Input: sessionID, output.text (assistant response)
│
├── upsertSessionInspectionExport(projectRoot, { sessionId, assistantText })
│    │
│    ├── .hivemind/session-inspection/<sessionId>/assistant-output.md
│    │    ├── Session header with ses_id and timestamp
│    │    └── Assistant text content (truncated in tests)
│    │
│    └── .hivemind/session-inspection/<sessionId>/purification-command.json
│         ├── version: 'v1'
│         ├── kind: 'session-inspection-purification'
│         ├── ses_id
│         ├── markdown_path
│         ├── tool_hints: ['grep', 'read']
│         └── instruction
│
└── writeDiagnosticLog(projectRoot, diagnosticEntry)
     │
     └── .hivemind/error-log/<sessionId>-<timestamp>.md
          ├── session metadata (purpose, state, trajectory, workflow, agent)
          ├── injection payload (from injection-store)
          └── assistant output (first 5000 chars)
```

### Flow B: Trajectory Event Recording (`event` hook)

```
event hook fires
│
├── normalizeEventSummary(event)
│    └── Maps event.type to 'event:<type>' string
│
├── loadRuntimeBindingsSnapshot(directory)
│    └── Loads .hivemind/config/runtime-attachment.json
│
├── extractAgentWorkEventPacket(input) [for session.compacted / command.executed]
│    └── Extracts sessionId, summary, trigger
│
├── resolveAgentWorkEvidence(directory, eventPacket)
│    └── Looks up latest contract for evidence refs
│
├── recordTrajectoryEvent(projectRoot, trajectoryId, event)
│    │
│    └── Updates .hivemind/state/trajectory-ledger.json
│         ├── Appends to trajectory.events[]
│         ├── Updates eventSummaries[]
│         └── Updates evidenceRefs[]
│
└── [if session.compacted && workflowId]
     └── createRecoveryCheckpoint(projectRoot, {...})
          └── Appends checkpoint to trajectory-ledger.checkpoints[]
```

### Flow C: Message Transformation (`experimental.chat.messages.transform`)

```
messages.transform hook fires
│
├── findLastUserMessage(messages)
│    └── Filters for variant='new' or 'continue'
│
├── resolveStartWork(createStartWorkInput(...))
│    └── Classifies purpose, detects session state, resolves readiness gates
│
├── maybeExecuteNlFirstRuntimeDispatch(...) [conditional]
│    └── Natural language first dispatch for auto-routing
│
├── Build injection parts:
│    ├── turn-hierarchy block
│    ├── context block
│    └── skill-focus block
│
├── setInjectionPayload({ sessionId, timestamp, agent, ... })
│    └── Stores in memory for text.complete to read
│
└── lastUserMessage.parts = [...injectedParts, ...originalParts, routeHint?]
```

---

## 4. Identified Gaps and Working Features

### Working Features

| Feature | Status | Location |
|---------|--------|----------|
| Event interception for all lifecycle events | Working | `hooks/event-handler.ts` |
| Trajectory event recording | Working | `core/trajectory/trajectory-store.operations.ts` |
| Session inspection export | Working | `sdk-supervisor/session-inspection.ts` |
| Diagnosticlog writing | Working | `sdk-supervisor/diagnostic-log.ts` |
| Message transformation context injection | Working | `plugin/messages-transform-adapter.ts` |
| Compaction context preservation | Working | `plugin/compaction-adapter.ts`, `agent-work-contract/hooks/compaction-preservation.ts` |
| Tool execution tracking | Working | `hooks/runtime-loader/tool-governance.ts` |
| Session state detection | Working | `features/session-entry/session-state.ts` |
| Recovery checkpoint creation | Working | `recovery/recovery-engine.ts` |

### Identified Gaps / Areas for Improvement

| Gap | Description | Priority |
|-----|-------------|----------|
| **No error-log reading interface** | `writeDiagnosticLog` writes but there's no tool to read/query diagnostic logs | Medium |
| **Session-inspection purification not automated** | `purification-command.json` is written but no async processor consumes it | Low |
| **Event packet extraction is limited** | Only `session.compacted` and `command.executed` are deeply processed; other events get normalized summaries | Low |
| **No streaming/cumulative export** | Each text.complete overwrites session-inspection; no historical accumulation | Low |
| **Injection-store is in-memory only** | Lost across restarts; no persistence | Low (intentional) |

---

## 5. Dead Code Locations

| Location | Status | Notes |
|----------|--------|-------|
| `core/session/` | **REMOVED** | Per AGENTS.md, this was removed inL1 cutover (2026-03-15) |
| `shared/event-bus.ts` | **REMOVED** | Replaced by SDK `event` hook |
| `plugin/synthetic-parts.ts` | Working | Helper for creating message parts |
| `plugin/context-renderer.ts` | Working | Canonical context packet rendering |

---

## 6. Architecture Observations

### CQRS Compliance
- **Hooks are read-side**: They observe and inject context but never own durable writes
- **Tools own write-side**: Managed tools like `hivemind_trajectory` handle mutations
- Exception: `text.complete` hook triggers writes to session-inspection and diagnostic-log (allowed per AGENTS.md as "automatic session-inspection exports")

### Key Design Patterns
1. **Snapshot caching**: `TurnSnapshotLoader` caches runtime bindings per turn to avoid repeated file reads
2. **Injection store**: In-memory Map for passing injection payload between `messages.transform` and `text.complete`
3. **Event packet extraction**: Schema-validated extraction for selective deep processing
4. **Compaction preservation**: Agent-work contracts survive compaction with reducedbut essential fields

### Hook Adoption Status
From `src/plugin/AGENTS.md`:
- **Adopted**: `event`, `command.execute.before`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `messages.transform`, `session.compacting`, `chat.message`, `permission.ask`
- **Planned**: `tool.definition`, `config`, `chat.params`
- **Rejected**: `chat.headers`, `auth`, `text.complete` (but `experimental.text.complete` isused for session export)

---

## 7. Recommendations for Time-Machine Enhancement

1. **Extend event packet extraction** to support more event types with structured payloads
2. **Add cumulative session export** that appends rather than overwrites
3. **Create async purification processor** to consume `purification-command.json` files
4. **Consider trajectory replay** using checkpoint data for true "time-machine" rollback
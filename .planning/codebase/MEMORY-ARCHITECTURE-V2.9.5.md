# Memory Architecture & Task Management — v2.9.5-detox-dev

**Analysis Date:** 2026-04-25
**Source Worktree:** `/Users/apple/hivemind-plugin/.worktrees/product-detox` (branch `v2.9.5-detox-dev`, commit `f04403c0`)

---

## 1. `.hivemind/` Directory Structure

### Top-Level Layout

```
.hivemind/
├── config/                          # Runtime configuration
│   ├── entry-kernel-state.json      # Lifecycle state machine (ready/passed/released)
│   └── runtime-attachment.json      # SDK attachment config, user prefs, guardrails, MCP readiness
├── context-check.json               # Context rot assessment (score, issues, path validation)
├── graph/
│   └── tasks.json                   # Task graph (versioned, currently empty)
├── pathing/
│   └── active-paths.json            # Canonical directory registry for activity folders
├── state/
│   ├── tasks.json                   # Workflow task state (versioned)
│   └── trajectory-ledger.json       # Trajectory tracking (active trajectory, checkpoints, recovery log)
├── project/
│   ├── PROJECT-CURRENT-STATES-*.md  # Large project state document (38KB)
│   ├── planning/
│   │   ├── index.json               # Planning index
│   │   ├── project-state.json       # Full project metadata (lineage, scope, references, ADRs, success criteria)
│   │   ├── phases/
│   │   │   └── 00-control-plane/    # Phase-specific plans
│   │   ├── runtime-entry/           # Diagnosis tracking, health status, meta-state (date-stamped)
│   │   └── trajectory-projections/  # Per-session trajectory snapshots (trj_*.json)
│   └── runtime-turns/               # Per-session turn logs (dual .md + .yaml per turn)
│       └── ses_{id}/
│           ├── turn_{ses_id}_{timestamp}.md    # Human-readable turn output
│           └── turn_{ses_id}_{timestamp}.yaml   # Structured turn metadata (lifecycle, effects, refs)
├── sessions/
│   ├── journey-events/              # Per-session journey records (ses_{id}.json + ses_{id}.md)
│   └── error-logs/                  # Session error logs (ses_{id}.log)
├── activity/                        # Workflow execution artifacts
│   ├── PROTOCOL.md                  # Canonical naming/attribution protocol
│   ├── status.json                  # Workflow status (phases, completed plans, artifact refs)
│   ├── plans/                       # Architectural plans and proposals (date-stamped)
│   ├── planning/                    # Per-plan execution plans
│   ├── research/                    # Research batches (batch-1a, batch-1b, batch-1c)
│   ├── review/                      # Code-skeptic review outputs (plan-N-code-skeptic.md)
│   ├── sessions/
│   │   └── continuity.json          # Cross-session continuity state (phases, findings, blocked routes)
│   ├── specs/                       # Specifications
│   ├── synthesis/                   # Synthesis outputs
│   ├── tdd/                         # TDD evidence organized by phase
│   │   ├── red/                     # Red evidence (failing test evidence)
│   │   ├── green/                   # Green evidence (passing test evidence)
│   │   └── refactor/               # Refactor evidence
│   ├── verification/                # HiveQ verification reports
│   └── state/
│       └── dashboard-spec.json      # JSON-render spec for dashboard UI
├── agent-work-contract/             # AWC contract files
│   └── awc-{ses_id}-{timestamp}-{uuid}.json   # Individual work contracts
└── plans/                           # (root level, older) architecture plans
```

---

## 2. Memory Classification System

### 2.1 Configuration Memory (`config/`)

**Purpose:** Runtime attachment and lifecycle state.

**Files:**
- `config/entry-kernel-state.json` — Lifecycle phase tracking with QA/release states
- `config/runtime-attachment.json` — SDK attachment mode, user preferences, guardrails, MCP readiness

**Key fields in `runtime-attachment.json`:**
```json
{
  "attachmentMode": "local-worktree",
  "defaultLineage": "hivefiver",
  "defaultPurposeClass": "planning",
  "runtimeAuthority": "managed-sdk",
  "guardrails": ["workflow-first", "trajectory-aware", "bounded-delegation"],
  "facilitators": ["hm-init", "hm-doctor", "hm-harness"],
  "mcpReadiness": ["context7", "deepwiki", "tavily", "repomix"]
}
```

### 2.2 State Memory (`state/`)

**Purpose:** Runtime state and trajectory tracking.

| File | Purpose | Schema |
|------|---------|--------|
| `state/tasks.json` | Task graph state | `{version, tasks[]}` |
| `state/trajectory-ledger.json` | Trajectory orchestration | See §3 below |

### 2.3 Graph Memory (`graph/`)

**Purpose:** Task relationship graph.

- `graph/tasks.json` — Currently empty (`{version: "1.0.0", tasks: []}`), designed for task dependency graph

### 2.4 Session Memory (`sessions/`)

**Purpose:** Per-session event tracking and error capture.

| Subdirectory | Purpose | Format |
|--------------|---------|--------|
| `sessions/journey-events/` | Session lifecycle events | Dual: `ses_{id}.json` (structured) + `ses_{id}.md` (human) |
| `sessions/error-logs/` | Session error capture | `ses_{id}.log` |

**Journey Event Schema** (`ses_{id}.json`):
```json
{
  "_schema": "session/v3",
  "sessionId": "ses_2b7a",
  "lineage": "hivefiver",
  "purposeClass": "implementation",
  "agent": "unknown",
  "startedAt": "ISO8601",
  "endedAt": null,
  "turnCount": 16,
  "status": "active",
  "counters": { "userMessageCount", "assistantOutputCount", "toolCallCount", "delegationCount", "compactionCount" },
  "toc": []
}
```

### 2.5 Activity Memory (`activity/`)

**Purpose:** Workflow execution artifacts with full provenance.

**Canonical Protocol** (from `activity/PROTOCOL.md`):
- **Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
- **Required `_meta` on all JSON:** `created_at`, `updated_at`, `producer`
- **Categories:** plan, delegation, handoff, verification, review, research, spec, synthesis, audit, tdd, session, codescan
- **Hierarchy:** Agents → planning → research → review → TDD(red/green/refactor) → verification

**Activity Status** (`activity/status.json`):
- Tracks workflow phases, completed plans, artifact references
- Contains full TDD evidence chain (red → green → refactor per plan)
- Review, verification, and synthesis artifacts all tracked

**Continuity** (`activity/sessions/continuity.json`):
- Cross-session state with severity matrix
- Verified top findings with evidence
- Active orchestration tracking with gate enforcement
- Blocked routes and recommended next actions

### 2.6 Project Memory (`project/`)

**Purpose:** Project-level planning and trajectory projections.

| Subdirectory | Purpose | Key files |
|--------------|---------|-----------|
| `project/planning/` | Project state & phases | `project-state.json`, `phases/*/PLAN.md` |
| `project/runtime-entry/` | Runtime diagnostics | `diagnosis-tracking-*.md`, `health-status-*.md`, `meta-state-*.md` |
| `project/runtime-turns/` | Turn-level execution logs | Dual `turn_{id}.md` + `turn_{id}.yaml` |
| `project/planning/trajectory-projections/` | Trajectory snapshots | `trj_{ses_id}.json` |

---

## 3. Trajectory System

### 3.1 Trajectory Ledger (`state/trajectory-ledger.json`)

**Schema:**
```typescript
interface TrajectoryLedger {
  version: string
  activeTrajectoryId: string
  lastClosedTrajectoryId: string | null
  trajectories: Trajectory[]
  checkpoints: Checkpoint[]
  recoveryLog: RecoveryEntry[]
}

interface Trajectory {
  id: string                          // trj_{hash} or trj_{ses_id}
  lineage: string                     // "hivefiver"
  purposeClass: string                // "planning"
  workflowIds: string[]
  sessionIds: string[]
  taskIds: string[]
  subtaskIds: string[]
  delegationIds: string[]
  eventSummaries: string[]            // ["command:hm-init:handler", ...]
  evidenceRefs: string[]
  planningRefs: string[]
  graphNodeBindings: string[]
  checkpointIds: string[]
  nextAllowedTransitions: string[]    // ["command:hm-harness", "command:hm-plan"]
  events: TrajectoryEvent[]
  status: "active" | "closed"
  createdAt: string
  updatedAt: string
}

interface Checkpoint {
  id: string                          // chk_{trj_id}_{sequence}
  trajectoryId: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  source: string                      // "command:hm-init" | "command:hm-harness"
  resumeTarget: string                // "command:hm-plan" | "command:hm-doctor"
  createdAt: string
}
```

### 3.2 Runtime Turns (Dual Format)

Each turn produces two files:

**YAML** — structured metadata:
```yaml
version: v1
turnId: turn_{ses_id}_{timestamp}
invocationId: inv_{ses_id}_{timestamp}
lifecycle: { layer, phase, entryState, qaState, releaseState }
sessionId: ses_{id}
lineage: hivefiver
status: ready
rationale: [command:hm-harness, execution:handler]
workflowEffects: [recovery-spine-ready, planning-projection-created]
toolEvidence: [readiness-gate, checkpoint]
resumeHints: [workflow:ses_{id}]
```

**Markdown** — human-readable output of the turn

### 3.3 Trajectory Projections

Per-session lightweight JSON files stored in `project/planning/trajectory-projections/`:
```json
{
  "trajectoryId": "trj_{ses_id}",
  "workflowId": "ses_{id}",
  "taskIds": [],
  "checkpointIds": [],
  "recoveryOutcomes": [],
  "projectedAt": "ISO8601"
}
```

---

## 4. Agent-Work-Contract System

### 4.1 Contract Schema

**Location on disk:** `.hivemind/agent-work-contract/awc-{ses_id}-{timestamp}-{uuid}.json`

**Schema structure:**
```typescript
interface AgentWorkContract {
  contractId: string                  // awc-{ses_id}-{timestamp}-{uuid}
  sessionId: string
  createdAt: string
  updatedAt: string
  userIntent: {
    raw: string                       // User's raw input
    confidence: number                // 0-1
    purposeClass: string              // "project-driven"
    requiresPlan: boolean
    requiresGovernance: boolean
  }
  responseMode: string                // "broad-search-execute"
  workflow: {
    phase: string                     // "phase-2-tui-gui"
    outlineRef: string                // Reference to manifesto
    tasks: Task[]                     // Ordered task list with dependencies
  }
  chainActions: {
    onTaskComplete: string            // "next-task"
    onWorkflowEnd: string             // "export-contract"
    onDelegation: string              // "export-messages"
    onCompaction80: string            // "launch-context-agent"
  }
  briefing: {
    summary: string
    workflowState: string
    followUp: string[]
  }
}

interface Task {
  id: string                          // "T2-001"
  title: string
  status: "pending" | "active" | "complete" | "completed" | "failed"
  dependencyIds: string[]
  delegationMode?: "parallel" | "sequential"
}
```

### 4.2 Source Implementation

**Location:** `src/features/agent-work-contract/`

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces (ContractStoreOperations, IntentClassifierResult, ChainActionEvent, etc.) |
| `schema/index.ts` | Zod schema-derived types (AgentWorkContract, PurposeClass, ResponseMode, etc.) |
| `tools/create-contract-tool.ts` | Tool for creating new contracts |
| `tools/export-contract-tool.ts` | Tool for exporting contracts |
| `tools/classify-intent-tool.ts` | Tool for intent classification |
| `engine/contract-store.archive.ts` | Contract archiving logic |

**ContractStoreOperations interface:**
- `create(contract)` → Write new contract
- `get(contractId)` → Read contract
- `update(contractId, updates)` → Partial update
- `delete(contractId)` → Remove contract
- `list(sessionId)` → List session's contracts
- `archive(contractId)` → Soft delete with retention

---

## 5. Side-Car Application (`apps/side-car/`)

### 5.1 Overview

A **Next.js 15** application (React 19) providing a browser-based monitoring dashboard for the HiveMind runtime. Uses `@json-render/react` for data-driven UI rendering.

**Key technology:**
- Next.js 15.3, React 19, TypeScript 5.7
- `@json-render/core` + `@json-render/react` + `@json-render/shadcn` — Data-driven UI from JSON specs
- `@opencode-ai/sdk` 1.3.6 — OpenCode SDK integration
- Tailwind CSS 4, Zod 4.3
- 36 shadcn components registered in catalog

### 5.2 Architecture

```
apps/side-car/
├── app/
│   ├── page.tsx                 # Main SPA — 7 tabs, SSE events, polling
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Tailwind
│   └── api/
│       ├── config/route.ts      # Configuration endpoint
│       ├── contracts/route.ts   # Contract listing/detail (reads .hivemind/agent-work-contract/)
│       ├── dashboard/route.ts   # Dashboard spec (reads .hivemind/activity/state/dashboard-spec.json)
│       ├── events/route.ts      # SSE event stream
│       ├── sessions/route.ts    # Session listing
│       └── settings/route.ts    # Settings CRUD
├── components/
│   ├── shell.tsx                # Tab navigation layout
│   └── tab-panel.tsx            # Tab content container
└── lib/
    └── registry.tsx             # Full @json-render catalog (36 components + 3 actions)
```

### 5.3 Side-Car Tabs

| Tab | Purpose | Data Source | Refresh |
|-----|---------|-------------|---------|
| Dashboard | Runtime dashboard | `.hivemind/activity/state/dashboard-spec.json` | 5s polling + SSE |
| Settings | Config editor | `/api/settings` (runtime-attachment) | On load |
| Contracts | AWC listing | `.hivemind/agent-work-contract/*.json` | 3s polling |
| Sessions | Session list | `/api/sessions` | 10s polling |
| Live Events | Real-time event stream | SSE `/api/events` | Real-time |
| Planner | (Phase 4 placeholder) | — | — |
| Builder | (Phase 5 placeholder) | — | — |

### 5.4 Data Flow

**Dashboard:** API route reads `.hivemind/activity/state/dashboard-spec.json` → JSON-render spec → `<Renderer>` renders UI from spec

**Contracts:** API route reads `.hivemind/agent-work-contract/*.json` → Builds summary with task tally → Renders as cards with status badges

**Events:** Server-Sent Events (EventSource) pushing real-time `session.created`, `tool.executed`, `task.started`, `contract.created` events

### 5.5 Known Issues (from continuity.json)

| ID | Severity | Issue |
|----|----------|-------|
| F-01 | DISASTROUS | Side-car pipeline broken — spec never written to disk |
| F-02 | CRITICAL | All interactive UI non-functional — `actions:{}` empty |
| F-03 | CRITICAL | Untyped props — `Record<string,unknown>` throughout |

---

## 6. Path Authority System

### 6.1 Centralized Path Module (`src/shared/paths.ts`)

```typescript
function getEffectivePaths(projectRoot: string) {
  return {
    root,                                    // .hivemind/
    stateDir,                                // .hivemind/state/
    configDir,                               // .hivemind/config/
    graphDir,                                // .hivemind/graph/
    sessionsDir,                             // .hivemind/sessions/
    journeyEventsDir,                        // .hivemind/sessions/journey-events/
    errorLogsDir,                            // .hivemind/sessions/error-logs/
    projectPlanningDir,                      // .hivemind/project/planning/
    runtimeAttachmentSettings,               // .hivemind/config/runtime-attachment.json
    workflowTasksState,                      // .hivemind/state/tasks.json
    workflowTasksGraph,                      // .hivemind/graph/tasks.json
    trajectoryLedger,                        // .hivemind/state/trajectory-ledger.json
  }
}
```

### 6.2 Active Paths Registry (`pathing/active-paths.json`)

Maps activity categories to their directories. Referenced by the Protocol as the source of truth for where artifacts belong.

---

## 7. Source Files Referencing `.hivemind/`

Key source files that read/write the `.hivemind/` directory:

| File | Purpose |
|------|---------|
| `src/shared/paths.ts` | Path constants and builders |
| `src/control-plane/control-plane-registry.ts` | Control plane registration |
| `src/hooks/chat-message-handler.ts` | Chat event handling |
| `src/hooks/event-handler.ts` | Event dispatch → `.hivemind/` |
| `src/hooks/tool-execution-handler.ts` | Tool execution hooks |
| `src/hooks/compaction-handler.ts` | Context compaction |
| `src/hooks/text-complete-handler.ts` | Text completion hooks |
| `src/hooks/start-work/start-work-router.ts` | Work routing |
| `src/plugin/context-renderer*.ts` | Context rendering (builder, renderers, compaction) |
| `src/plugin/opencode-plugin.ts` | Main plugin assembly |
| `src/plugin/input-helpers.ts` | Input processing |
| `src/tools/hivefiver-setting/dashboard.ts` | Dashboard tool |
| `src/tools/hivefiver-init/tools.ts` | Init tool |
| `src/tools/hivefiver-doctor/tools.ts` | Doctor tool |
| `src/tools/runtime/tools.ts` | Runtime tools |
| `src/governance/planning-projection.ts` | Trajectory projection |
| `src/recovery/recovery-engine.ts` | Recovery with trajectory awareness |
| `src/sdk-supervisor/session-inspection.ts` | Session inspection |
| `src/sdk-supervisor/diagnostic-log.ts` | Diagnostic logging |
| `src/shared/pressure-contract.ts` | Pressure-based contract management |
| `src/features/runtime-entry/workflow-continuity.ts` | Workflow continuity |
| `src/features/runtime-entry/command.ts` | Runtime entry commands |
| `src/features/runtime-observability/status.ts` | Status observability |
| `src/features/handoff/handoff.ts` | Handoff between sessions |
| `src/features/agent-work-contract/**` | Full AWC feature module |

---

## 8. Vector Memory / Graph Query

**Status:** Not implemented in v2.9.5-detox-dev.

**Evidence:**
- `src/features/event-tracker/parser/turn-parser.test.ts` — only file referencing "vector" or "embedding" (in test context)
- `graph/tasks.json` exists but is always empty (`{version: "1.0.0", tasks: []}`)
- No `vectorStore`, `embedding`, `similarity`, or `memory.search` patterns found in `src/`
- The `graph/` directory is scaffolded but never populated

**Implication:** Graph-based task relationships and vector search capabilities were planned (directory structure exists) but not implemented. The trajectory ledger provides linear session tracking without graph query.

---

## 9. Gaps and Unresolved Questions

### Architecture Gaps

1. **No Vector/Graph Implementation** — `graph/tasks.json` always empty, no embedding/similarity search code
2. **Side-Car Pipeline Broken** — F-01 (DISASTROUS): spec never written to disk, dashboard reads from non-existent file
3. **Empty Actions in Registry** — F-02 (CRITICAL): interactive UI non-functional
4. **353 Uncommitted Files** — Large batch of work without atomic decomposition
5. **Planner/Builder Tabs** — Side-car Phase 4/5 placeholders not implemented

### Trajectory System Gaps

1. **Tasks Always Empty** — `state/tasks.json` and `graph/tasks.json` both have `tasks: []`
2. **Trajectory Has No Task Bindings** — All `taskIds` and `subtaskIds` arrays are empty in trajectories
3. **No Cross-Trajectory Linking** — Trajectories are isolated per session, no graph edges between them
4. **Recovery Log Minimal** — Only one recovery entry with outcome "none"

### Memory Classification Gaps

1. **No Memory Hierarchy** — Flat JSON files, no indexed or queryable structure
2. **No Metadata Index** — Journey events lack searchable metadata beyond session ID
3. **No Retention Policy** — Error logs accumulate without cleanup
4. **No Versioned Schemas** — Journey events use `_schema: "session/v3"` but no schema registry

### Transferability Questions

1. **How does the harness-experiment worktree adopt these patterns?** — The current harness uses `.planning/` (GSD format), not `.hivemind/`
2. **What is the bridge between `.hivemind/` and `.planning/`?** — No mapping document found
3. **Is `getEffectivePaths()` portable?** — The path module is hard-coded to `.hivemind/` layout

---

*Memory architecture analysis: 2026-04-25 | Source: product-detox worktree (v2.9.5-detox-dev)*

# Session Inspection Export

- ses_id: `ses_2cc9eaf2fffeB5CCLtzfg0L7Pv`
- prepared_at: `2026-03-28T07:43:57.649Z`

## Assistant Output

Now I have a comprehensive understanding. Let me compile the final investigation report.

---

## Codebase Investigation Report: `.hivemind` Runtime Artifacts

**Scope:** Complete mapping of `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind`
**Investigation Date:** 2026-03-28
**Method:** Read-only directory analysis + source code tracing

---

### Complete Directory Tree with Artifact Classifications

```
.hivemind/                          [ROOT - Runtime State Directory]
│
├── error-log/                      [175M, 2543 files] ⚠️ LARGEST
│   └── ses_{sessionId}-{timestamp}.md
│       TYPE: Markdown (diagnostic logs)
│       PURPOSE: Per-turn diagnostic capture from text.complete hook
│       CREATED BY: 
│         - src/sdk-supervisor/diagnostic-log.ts:95 `writeDiagnosticLog()`
│         - src/hooks/text-complete-handler.ts (via deprecated diagnostic-log)
│       SAMPLE: ses_2cc9e3bcffepmj4XcS5s6HfRJ-1774683546298.md
│       PATTERN: `{sessionId}-{epoch_ms}.md`
│
├── session-inspection/             [3.8M, 400 folders]
│   └── ses_{id}/
│       ├── assistant-output.md     TYPE: Markdown
│       │   PURPOSE: Persisted session output for later purification
│       │   CREATED BY: src/sdk-supervisor/session-inspection.ts:89 `upsertSessionInspectionExport()`
│       │
│       └── purification-command.json  TYPE: JSON
│           PURPOSE: Async purification command artifact (v1 schema)
│           CREATED BY: src/sdk-supervisor/session-inspection.ts:94 `createPreparedPurificationCommand()`
│           PATTERN: Contains `kind: "session-inspection-purification"`, `tool_hints: ["grep", "read"]`
│
├── sessions/                      [7.2M, 1486 files]
│   └── ses_{semanticId|yyyy-mm-ddTHHMMSS}_{purposeClass}_{agent}.json
│       TYPE: JSON (SessionV2 schema)
│       PURPOSE: Consolidated session journal - all turns, events, diagnostics
│       CREATED BY:
│         - src/features/event-tracker/consolidated-writer.ts:156 `initSession()`
│         - src/hooks/chat-message-handler.ts:26 (user messages)
│         - src/hooks/text-complete-handler.ts (assistant output)
│         - src/hooks/event-handler.ts (events)
│         - src/hooks/compaction-handler.ts (compaction)
│       SCHEMA: `_schema: "session/v2"`, lineage, purposeClass, counters, turns[], events[], diagnostics[]
│       NOTE: Deprecated `diagnostic-log.ts` writes to error-log/, not here
│
├── activity/                       [1.5M]
│   ├── status.json                TYPE: JSON
│   │   PURPOSE: Workflow phase tracking, lists all plan/verification/tdd/review artifacts
│   │   CREATED BY: Skills/tools writing activity outputs (NOT TypeScript src)
│   │   ⚠️  No direct TypeScript source writer found
│   │
│   ├── sessions/
│   │   └── continuity.json        TYPE: JSON
│   │       PURPOSE: Orchestration session continuity state
│   │       SCHEMA: session_type, branch, last_commit, current_phase, orchestration_plan, skills_root
│   │       CREATED BY: Skills/tools (use-hivemind-git-memory pattern)
│   │
│   ├── delegation/                [43 subfolders]
│   │   ├── batch-{id}/
│   │   │   └── result.json        TYPE: JSON
│   │   │       PURPOSE: Delegation batch results (target_agent, findings, modifications, validation)
│   │   │       CREATED BY: Delegating agents via hivemind_handoff tool
│   │   │
│   │   └── phase-*.json           TYPE: JSON
│   │       PURPOSE: Phase-gated delegation checkpoints
│   │       CREATED BY: Orchestrator/hivefiver workflow agents
│   │
│   ├── plans/
│   │   └── *-master-plan-*.md    TYPE: Markdown
│   │       PURPOSE: Orchestration master plans
│   │       CREATED BY: Orchestrator (hiveminder) skills
│   │
│   ├── agents/{agent}/            [7 subdirs: architect, code-skeptic, hitea, hivehealer, hiveq, hiverd, hivexplorer]
│   │   └── {task-id}/
│   │       ├── report.md          TYPE: Markdown
│   │       └── return-contract.json TYPE: JSON
│   │       PURPOSE: Agent investigation reports and return contracts
│   │       CREATED BY: Subagents via hivemind_handoff tool
│   │
│   ├── handoff/                   [15 files]
│   │   └── {timestamp}-*-handoff.json TYPE: JSON
│   │       PURPOSE: Phase handoff artifacts between agent sessions
│   │       CREATED BY: hivemind_handoff tool
│   │
│   ├── codescan/                  [8 subfolders]
│   │   └── {pass_id}/
│   │       ├── plan.json          TYPE: JSON (batch plan)
│   │       └── *.json             TYPE: JSON (batch results)
│   │       PURPOSE: Codemap scan outputs (hivemind-codemap skill)
│   │       CREATED BY: hivemind-codemap skill via codescan delegation
│   │
│   ├── planning/                  [23 files]
│   │   └── plan-*.md              TYPE: Markdown
│   │       PURPOSE: Planning phase artifacts
│   │
│   ├── review/                    [9 files]
│   │   └── review reports         TYPE: Markdown
│   │
│   ├── verification/              [24 files]
│   │   └── verification reports   TYPE: Markdown
│   │
│   ├── tdd/                       [3 subdirs: red, green, refactor]
│   │   └── plan-*-*.md            TYPE: Markdown
│   │
│   └── synthesis/                 [5 files]
│       └── synthesis reports       TYPE: Markdown
│
├── project/                       [184K]
│   ├── planning/
│   │   ├── project-state.json     TYPE: JSON
│   │   │   PURPOSE: Project metadata, profile, vision, scope, architecture decisions
│   │   │   CREATED BY: Project initialization (hm-init command)
│   │   │
│   │   └── phases/                TYPE: Directory
│   │
│   └── runtime-turns/             [11 subfolders]
│       └── ses_{sessionId}/
│           ├── turn_{id}.md       TYPE: Markdown
│           │   PURPOSE: Turn output summary
│           │
│           └── turn_{id}.yaml      TYPE: YAML
│               PURPOSE: Turn lifecycle metadata (version, turnId, invocationId, lifecycle, status, rationale)
│               CREATED BY: Turn handlers after command execution
│
├── config/                        [8K]
│   ├── entry-kernel-state.json    TYPE: JSON
│   │   PURPOSE: Entry kernel lifecycle state (ready/qaState/releaseState)
│   │   CREATED BY: hm-init command handler
│   │
│   └── runtime-attachment.json    TYPE: JSON
│       PURPOSE: Runtime attachment configuration (lineage, purposeClass, authority, guardrails, facilitators, MCP readiness)
│       CREATED BY: hm-init command handler
│
├── state/                         [12K]
│   ├── tasks.json                 TYPE: JSON (empty: `{"tasks": []}`)
│   │
│   └── trajectory-ledger.json     TYPE: JSON
│       PURPOSE: Trajectory state machine (activeTrajectoryId, trajectories[], events[])
│       CREATED BY: src/core/trajectory/trajectory-store.ledger.ts
│       REFERENCED IN: src/sdk-supervisor/runtime-status.ts:149
│
├── graph/                         [4K]
│   └── tasks.json                 TYPE: JSON (empty: `{"tasks": []}`)
│       PURPOSE: Workflow task graph (currently unused/empty)
│
├── agent-work-contract/           [0 bytes - EMPTY]
│   ⚠️  Directory exists but is empty (no .json files)
│   EXPECTED: ContractStore persists to this directory per src/features/agent-work-contract/engine/contract-store.base.ts:84
│   ACTUAL: No files present despite references in source
│
├── plans/                         [12K]
│   └── 2026-03-26-session-hierarchy-restructure.md
│       PURPOSE: Architecture Decision Record (ADR-017) for session hierarchy restructuring
│       CREATED BY: Planning phase (ADR author)
│
└── context-check.json             [4K]
    PURPOSE: Context health check snapshot (rot_level, path_validation)
    CREATED BY: Context verification tools/skills
```

---

### Session Inspection Analysis (400 folders)

| Pattern | Evidence |
|---------|----------|
| **Naming** | `ses_{base62Id}` (22 char session prefix) |
| **Files per folder** | Exactly 2: `assistant-output.md` + `purification-command.json` |
| **Lifecycle** | Created on session completion, persists for later purification |
| **Purpose** | Enables offline "purification" of session artifacts via `hivemind_handoff` tool |
| **SDK Reference** | `src/sdk-supervisor/session-inspection.ts` exports `upsertSessionInspectionExport()` |
| **Schema** | `kind: "session-inspection-purification"`, version: "v1" |

**Sample 5 sessions examined:**
- `ses_2de3f312cffeiBnksSXFVLQeQQ` - Skills verification report (93 lines)
- `ses_2cc9eaf2fffeB5CCLtzfg0L7Pv` - Multiple error log entries, likely retry/loop scenario
- `ses_2cf4e8831ffeqjeUXbQI7PQHoz` - Session with diagnostic content
- `ses_2d600a75dffeaMNYA5lqmUa0O0` - Planning-related session
- `ses_2da76a55affeym3nEBGLfc27e7` - Another verification run

---

### Runtime Artifact Classification by Creator

| Creator Type | Artifacts | Location |
|--------------|-----------|----------|
| **CLI (hm-init)** | `config/*.json`, `project/planning/project-state.json` | `src/tools/hivefiver-init/tools.ts` |
| **Hooks (text-complete)** | `sessions/*.json`, `error-log/*.md` | `src/hooks/text-complete-handler.ts` |
| **Hooks (chat-message)** | `sessions/*.json` (user turns) | `src/hooks/chat-message-handler.ts` |
| **Hooks (event)** | `sessions/*.json` (events) | `src/hooks/event-handler.ts` |
| **Hooks (compaction)** | `sessions/*.json` (compaction) | `src/hooks/compaction-handler.ts` |
| **SDK Supervisor** | `session-inspection/*/` | `src/sdk-supervisor/session-inspection.ts` |
| **Diagnostic (deprecated)** | `error-log/*.md` | `src/sdk-supervisor/diagnostic-log.ts` |
| **Contract Store** | `agent-work-contract/*.json` (EMPTY!) | `src/features/agent-work-contract/engine/` |
| **Trajectory Store** | `state/trajectory-ledger.json` | `src/core/trajectory/trajectory-store.ledger.ts` |
| **Skills (md artifacts)** | `activity/*/*.md`, `activity/agents/*/` | Written by agent skills, not TypeScript |
| **hivemind_handoff tool** | `activity/handoff/*.json`, `activity/delegation/*/result.json` | Custom tool |

---

### Source Code Trace Summary

| Source File | Writes To | Key Function |
|-------------|-----------|--------------|
| `src/shared/paths.ts` | ALL .hivemind paths | `getHivemindPath()`, `getSessionPath()`, `getSessionInspectionPath()`, `getErrorLogPath()`, `getConfigPath()`, `getEffectivePaths()` |
| `src/sdk-supervisor/session-inspection.ts` | `session-inspection/*/` | `upsertSessionInspectionExport()` |
| `src/sdk-supervisor/diagnostic-log.ts` | `error-log/` | `writeDiagnosticLog()` (deprecated) |
| `src/features/event-tracker/consolidated-writer.ts` | `sessions/*.json` | `initSession()`, `addTurn()`, `addEvent()`, `addDiagnostic()`, `updateStatus()` |
| `src/hooks/text-complete-handler.ts` | `sessions/` | `createTextCompleteHandler()` |
| `src/hooks/chat-message-handler.ts` | `sessions/` | `handleChatMessage()` |
| `src/hooks/event-handler.ts` | `sessions/` | Session event capture |
| `src/hooks/compaction-handler.ts` | `sessions/` | Compaction session updates |
| `src/features/agent-work-contract/engine/contract-store.base.ts` | `agent-work-contract/` | `CONTRACT_DIR = 'agent-work-contract'` (path construction at line 84) |
| `src/core/trajectory/trajectory-store.ledger.ts` | `state/trajectory-ledger.json` | Trajectory state management |
| `src/tools/hivefiver-init/tools.ts` | `.hivemind/` (bootstrap) | `hm-init` command |

---

### Anomalies and Unexpected Patterns

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1 | **`agent-work-contract/` is EMPTY** | ⚠️ HIGH | Directory exists but no .json files despite `contract-store.base.ts:84` constructing paths there. Either contracts are never created, or they're stored elsewhere. |
| 2 | **Two `tasks.json` locations** | ℹ️  LOW | Both `state/tasks.json` and `graph/tasks.json` exist but are both empty arrays |
| 3 | **`error-log/` is 175MB (LARGEST)** | ⚠️  WARNING | 2543 markdown files - likely accumulating since project start. Deprecated diagnostic-log still writing here. |
| 4 | **`continuity.json` manually created** | ℹ️  NOTE | `activity/sessions/continuity.json` appears to be manually curated JSON, not generated by detected TypeScript source |
| 5 | **Activity folder mostly MD files** | ℹ️  NOTE | 3128 markdown files vs 1933 JSON files. Activity artifacts are primarily human-readable reports from skills, not machine-generated JSON |
| 6 | **session-inspection vs sessions** | ℹ️  DESIGN | `session-inspection/` stores markdown exports for purification, while `sessions/` stores raw JSON journals. Dual storage may cause sync issues |

---

### Lifecycle Triggers for Major Artifact Types

| Artifact Type | Trigger | Hook/Command/Tool |
|--------------|---------|-------------------|
| `sessions/*.json` | `chat.message` hook | `handleChatMessage()` |
| `sessions/*.json` | `text.complete` hook | `createTextCompleteHandler()` |
| `sessions/*.json` | `event` hook | Session event capture |
| `sessions/*.json` | `session.compacting` hook | Compaction handler |
| `session-inspection/*/` | After `text.complete` with significant output | `upsertSessionInspectionExport()` |
| `error-log/*.md` | After each `text.complete` (deprecated path) | `writeDiagnosticLog()` |
| `config/*.json` | `hm-init` CLI command | `createHivefiverInitTool()` |
| `project/planning/*` | `hm-init` + `hm-doctor` commands | Bootstrap tools |
| `state/trajectory-ledger.json` | Trajectory state changes | `trajectory-store.ledger.ts` |
| `activity/agents/*/` | Subagent completion | `hivemind_handoff` tool |
| `activity/delegation/*/` | Batch/phase completion | Delegation workflow |
| `activity/plans/*` | Orchestrator planning | Orchestrator skills |

---

### File Count Summary

| Directory | Files | Type | Total Size |
|-----------|-------|------|------------|
| error-log | 2543 | .md | 175M |
| sessions | 1486 | .json | 7.2M |
| session-inspection | 800 | .md + .json | 3.8M |
| activity | ~3128 + ~1933 | .md + .json | 1.5M |
| project | ~50 | mixed | 184K |
| config | 2 | .json | 8K |
| state | 2 | .json | 12K |
| graph | 1 | .json | 4K |
| agent-work-contract | 0 | (empty) | 0 |
| plans | 1 | .md | 12K |

**Total: ~6000+ files, ~188MB**

---

### Git Context

```
HEAD: v2.9.5-detox-dev worktree
Working directory: .worktrees/product-detox
```
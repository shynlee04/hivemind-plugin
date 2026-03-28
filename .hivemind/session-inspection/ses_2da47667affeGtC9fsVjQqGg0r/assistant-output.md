# Session Inspection Export

- ses_id: `ses_2da47667affeGtC9fsVjQqGg0r`
- prepared_at: `2026-03-25T16:01:17.841Z`

## Assistant Output

Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** `.hivemind/` directory structure, core state files, path resolution, and documentation artifacts  
**Question:** What exists in `.hivemind/`, what core documents are present, how paths are resolved, and what's missing vs. spec requirements

---

### 1. Complete `.hivemind/` Directory Listing

```
.hivemind/
├── context-check.json                    # Context rot assessment (2026-03-19, CLEAN)
├── config/
│   ├── entry-kernel-state.json           # Kernel readiness: "ready", qa: "passed"
│   └── runtime-attachment.json           # Worktree attachment config, lineage=hivefiver
├── state/
│   ├── tasks.json                        # Empty task list (v1.0.0)
│   └── trajectory-ledger.json            # 8 checkpoints, 0 active trajectories
├── graph/
│   └── tasks.json                        # Empty task list (v1.0.0)
├── agent-work-contract/
│   └── (empty)
├── project/
│   ├── planning/
│   │   ├── index.json
│   │   ├── project-state.json
│   │   ├── phases/00-control-plane/00-01-PLAN.md
│   │   ├── runtime-entry/
│   │   │   ├── diagnosis-tracking-2026-03-20.md
│   │   │   ├── health-status-2026-03-20.md
│   │   │   └── meta-state-2026-03-20.md
│   │   └── trajectory-projections/
│   │       ├── trj_ses_2f86eff84ffecj34JHANsBS8nH.json
│   │       ├── trj_ses_2ff4137d7ffeYCfVl5WU2Wb9Au.json
│   │       ├── trj_ses_2ff723f3affeYecs1HDNptxEm5.json
│   │       ├── trj_ses_30165cac3ffeGqldBqjEqeUTs0.json
│   │       └── trj_ses_harness_1774039169268.json
│   └── runtime-turns/
│       ├── ses_2f86eff84ffecj34JHANsBS8nH/ (4 turns: .md + .yaml each)
│       ├── ses_2ff4137d7ffeYCfVl5WU2Wb9Au/ (1 turn)
│       ├── ses_2ff723f3affeYecs1HDNptxEm5/ (1 turn)
│       ├── ses_2ffb44dceffe7GU6umIc1Tx1E4/ (2 turns)
│       ├── ses_30165cac3ffeGqldBqjEqeUTs0/ (3 turns)
│       └── ses_harness_1774039169268/ (1 turn)
├── activity/
│   ├── status.json                       # Workflow state: session-journal-implementation, complete
│   ├── agents/
│   │   ├── hitea/p4b/
│   │   ├── hiveq/{2026-03-25,20260324}/
│   │   └── hiverd/20260324201948-superpowers-research/
│   ├── audit/
│   │   └── audit-src-2026-03-25.md
│   ├── codescan/
│   │   └── pass_1774372436/
│   ├── delegation/                       # 20 JSON files (phase delegation records)
│   ├── planning/                         # 16 plan files (plan-4 through plan-11 + revisions)
│   ├── plans/
│   │   └── session-journal-consolidation-plan-2026-03-25.md
│   ├── review/                           # 7 code-skeptic review files
│   ├── specs/
│   │   └── session-journal-consolidation-spec-2026-03-25.md
│   ├── synthesis/
│   │   ├── plan-5-cycle-summary-2026-03-24.md
│   │   └── final-integration-summary-2026-03-24.md
│   ├── tdd/
│   │   ├── red/ (7 evidence files)
│   │   ├── green/ (7 evidence files)
│   │   └── refactor/ (7 evidence files)
│   └── verification/                     # 20 verification files
├── sessions/                             # 228 files
│   ├── ses_2026-03-25T*_implementation_unknown.json  (120+ session v2 JSON files)
│   └── ses_*/                            # ~110 session subdirectories (older format)
├── session-inspection/                   # 220 entries
│   └── ses_*/
│       ├── assistant-output.md
│       └── purification-command.json
└── error-log/                            # 1,290 .md error-log files
```

---

### 2. Core Documents — Existence Map

| Document | Location | Exists? | Notes |
|----------|----------|---------|-------|
| `PRD.md` | `.hivemind/` or root | **NO** | Not found anywhere |
| `PROJECT.md` | `.planning/PROJECT.md` | YES | Also `.planning/PROJECT-2026-03-20.md` |
| `STATE.md` | `.planning/STATE.md` | YES | Also `.planning/STATE-2026-03-20.md` |
| `ARCHITECTURE.md` | `.planning/codebase/` | YES | Also `.planning/research/` |
| `CONCERNS.md` | `.planning/codebase/CONCERNS.md` | YES | |
| `CONSTITUTION.md` | — | **NO** | Not found |
| `STACK.md` | `.planning/codebase/` | YES | Also `.planning/research/` |
| `SPECIFICATION.md` | — | **NO** | Not found (`.hivemind/activity/specs/` has a dated spec instead) |
| `PITFALLS.md` | `docs/PITFALLS.md` | YES | Also `.planning/research/` |
| `continuity.json` | `.hivemind/activity/sessions/` | **NO** | Spec requires this at `.hivemind/activity/sessions/continuity.json` — dir doesn't exist |
| `active-paths.json` | `.hivemind/pathing/` | **NO** | Spec requires `.hivemind/pathing/active-paths.json` — dir doesn't exist |
| `AGENTS.md` | Root | YES | Primary governance file |
| `CONCERNSV1.md` | Root | YES | Referenced in AGENTS.md for type monolith audit |
| `ROADMAP.md` | `.planning/ROADMAP.md` | YES | |
| `REQUIREMENTS.md` | `.planning/REQUIREMENTS.md` | YES | |

---

### 3. Path Resolution (`src/shared/paths.ts`)

File: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts` (89 lines)

**Constants defined (lines 9-15):**
- `HIVEMIND_DIR = '.hivemind'`
- `STATE_DIR = 'state'`
- `SESSIONS_DIR = 'sessions'`
- `GRAPH_DIR = 'graph'`
- `CONFIG_DIR = 'config'`
- `ARTIFACTS_DIR = 'artifacts'` — **declared but unused** in `getEffectivePaths()`
- `CHECKPOINTS_DIR = 'checkpoints'` — **declared but unused** in `getEffectivePaths()`

**State file references (lines 18-23):**
- `hiveneuron.json`, `hivebrain.md`, `brain.json`, `anchors.json` — **none of these exist** on disk in `.hivemind/state/`

**`getEffectivePaths()` (lines 63-88) — the canonical path authority:**
```
root                    → .hivemind/
stateDir                → .hivemind/state/
configDir               → .hivemind/config/
graphDir                → .hivemind/graph/
sessionsDir             → .hivemind/sessions/
sessionInspectionDir    → .hivemind/session-inspection/
projectPlanningDir      → .hivemind/project/planning/
handoffsDir             → .hivemind/handoffs/        ← DIR DOES NOT EXIST on disk
errorLogDir             → .hivemind/error-log/
```

**Paths NOT in `getEffectivePaths()` but present on disk:**
- `.hivemind/activity/` — the entire activity tree is missing from path resolution
- `.hivemind/agent-work-contract/` — exists on disk, not in path resolver
- `.hivemind/session-inspection/` — individual session getter exists (`getSessionInspectionPath`) but no general inspection dir in return object

**Paths in `getEffectivePaths()` but missing on disk:**
- `.hivemind/handoffs/` — referenced as `handoffsDir` but directory doesn't exist

---

### 4. What's Missing vs. What the Spec Requires

The AGENTS.md Activity Folder spec requires this structure:

```
.hivemind/activity/
├── handoff/          ← MISSING (no handoff/ dir inside activity/)
├── delegation/       ✓ EXISTS (20 files)
├── hierarchy/        ← MISSING
├── sessions/         ← MISSING (continuity.json expected here)
├── codescan/         ✓ EXISTS (1 batch)
├── agents/           ✓ EXISTS (hitea, hiveq, hiverd)
├── longhaul/         ← MISSING
├── pathing/          ← MISSING (active-paths.json expected here)
└── state/            ← MISSING (no state/ dir inside activity/)
```

**Specific gaps:**

| Spec Requirement | Status | Evidence |
|------------------|--------|----------|
| `.hivemind/activity/handoff/` | **MISSING** | No such directory |
| `.hivemind/activity/hierarchy/` | **MISSING** | No such directory |
| `.hivemind/activity/sessions/continuity.json` | **MISSING** | Directory doesn't exist |
| `.hivemind/activity/longhaul/task-state.json` | **MISSING** | Directory doesn't exist |
| `.hivemind/activity/pathing/active-paths.json` | **MISSING** | Directory doesn't exist |
| `.hivemind/activity/state/` | **MISSING** | No such subdirectory |
| `.hivemind/handoffs/` (from paths.ts) | **MISSING** | Referenced in code, absent on disk |
| `ARTIFACTS_DIR` usage | **DEAD CODE** | Constant declared, never used |
| `CHECKPOINTS_DIR` usage | **DEAD CODE** | Constant declared, never used |
| `STATE_FILES.hiveneuron` etc. | **DEAD CODE** | Referenced files don't exist |

**Additional observations:**
- `context-check.json` is stale (dated 2026-03-19, 6 days old)
- 1,290 error-log entries and 228 session files suggest heavy session activity — likely bloat from rapid session creation
- The `activity/status.json` workflow is marked "complete" for `session-journal-implementation` (all 10 plans done)
- Git HEAD is at `7183335` — "Generated numerous Hivemind session artifacts, error logs, and inspection reports"
- No `pathing/active-paths.json` means agents have no deterministic path registry to resolve output locations, contradicting the spec's Deterministic Pathing rule

---

### 5. Structure Map Summary

The `.hivemind/` directory has **organic growth** from session activity (228 sessions, 1,290 error logs) but is **missing the structural scaffolding** the spec mandates. The `activity/` subdirectory has good coverage of planning/verification/tdd/delegation workflows but lacks the operational directories (handoff, hierarchy, longhaul, pathing, sessions/continuity). Path resolution in `paths.ts` has dead constants and a missing `handoffs/` directory, while the entire `activity/` tree is absent from the path resolver.
# GSD Framework — Deep Reconnaissance Report

> **Date:** 2026-04-08  
> **Version:** 1.34.2  
> **Scope:** Full framework architecture, state management, phase progression, gate mechanisms, and workflow coherence

---

## Executive Summary

The GSD (Get Sh*t Done) framework is a **state-driven, phase-gated workflow engine** for AI-assisted software development. It coordinates multiple specialized agents through a disciplined pipeline of research → planning → execution → verification, with STATE.md as the single source of truth for project progression.

**Key insight:** The framework is NOT a task runner. It is a **state machine with guardrails** — every workflow reads state, validates preconditions, performs bounded work, writes state, and checkpoints before proceeding.

---

## 1. Architecture Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        GSD FRAMEWORK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    STATE LAYER                            │ │
│  │  STATE.md (living memory)  │  config.json (preferences)   │ │
│  │  ROADMAP.md (phase plan)   │  PROJECT.md (core value)     │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │ reads/writes                      │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                   TOOL LAYER (CLI)                         │ │
│  │  gsd-tools.cjs — 30+ operations across:                   │ │
│  │  • state.cjs    — STATE.md CRUD + progression engine      │ │
│  │  • phase.cjs    — phase add/remove/complete/list          │ │
│  │  • core.cjs     — config, paths, git, markdown utils      │ │
│  │  • roadmap.cjs  — roadmap CRUD, plan tracking             │ │
│  │  • milestone.cjs — milestone lifecycle                    │ │
│  │  • workstream.cjs — multi-project isolation               │ │
│  │  • verify.cjs   — pre-flight validation                   │ │
│  │  • security.cjs  — path traversal, field name validation  │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │ invokes                           │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                  WORKFLOW LAYER (.md)                      │ │
│  │  60+ workflow files — executable prompt templates:        │ │
│  │  • plan-phase.md    • execute-phase.md                    │ │
│  │  • discuss-phase.md • research-phase.md                   │ │
│  │  • verify-phase.md  • validate-phase.md                   │ │
│  │  • review.md        • ship.md                             │ │
│  │  • + 50 more specialized workflows                        │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │ spawns                            │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                   AGENT LAYER                              │ │
│  │  25+ specialized agents with completion markers:           │ │
│  │  • gsd-planner       • gsd-executor                       │ │
│  │  • gsd-phase-researcher  • gsd-verifier                   │ │
│  │  • gsd-plan-checker    • gsd-debugger                     │ │
│  │  • gsd-roadmapper      • gsd-integration-checker          │ │
│  │  • + 15 more                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  REFERENCE LAYER                           │ │
│  │  Gates │ Checkpoints │ Agent Contracts │ Verification     │ │
│  │  Thinking Models │ TDD │ Context Budget │ Continuation    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. State Manager — The Beating Heart

### 2.1 State Architecture (as requested)

```
┌─────────────────────────────────────────────────────────┐
│                    STATE MANAGER                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│  │   SESSION │  │  PROJECT  │  │   PHASE   │         │
│  │   STATE   │  │   STATE   │  │   STATE   │         │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘         │
│        └──────────────┼──────────────┘                │
│                       ▼                                 │
│              ┌─────────────────┐                       │
│              │   STATE.md      │                       │
│              │  (JSON/FILE)    │                       │
│              └─────────────────┘                       │
│                       │                                 │
│        ┌──────────────┼──────────────┐                 │
│        ▼              ▼              ▼                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐            │
│   │ CHECK-  │   │ RESTORE │   │  SYNC   │            │
│   │ POINT   │   │         │   │         │            │
│   └─────────┘   └─────────┘   └─────────┘            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 State Operations (from `state.cjs`)

| Operation | Function | What It Does |
|-----------|----------|-------------|
| **Load** | `cmdStateLoad()` | Reads STATE.md + config.json + roadmap existence |
| **Get** | `cmdStateGet()` | Extract specific field or section |
| **Patch** | `cmdStatePatch()` | Atomic multi-field update with read-modify-write |
| **Update** | `cmdStateUpdate()` | Single field update with validation |
| **Advance** | `cmdStateAdvancePlan()` | Increments plan counter, updates status |
| **Progress** | `cmdStateUpdateProgress()` | Calculates % bar from completed/total plans |
| **Metrics** | `cmdStateRecordMetric()` | Logs phase/plan duration to performance table |
| **Decisions** | `cmdStateAddDecision()` | Appends decision to accumulated context |
| **Blockers** | `cmdStateAddBlocker()` / `cmdStateResolveBlocker()` | Manages blocker list |
| **Session** | `cmdStateRecordSession()` | Records last session, stopped-at, resume file |
| **Snapshot** | `cmdStateSnapshot()` | Full state extraction as structured JSON |
| **Begin Phase** | `cmdStateBeginPhase()` | Sets status, current focus, plan counts |

### 2.3 State Progression Engine

The state machine flows through these phases:

```
Ready to Plan → Planning → Ready to Execute → In Progress → Phase Complete
       ▲                                                                    │
       └────────────────────────────────────────────────────────────────────┘
                              (next phase)
```

**Key mechanism:** `cmdStateAdvancePlan()` is the progression trigger. It:
1. Reads `Current Plan` and `Total Plans in Phase`
2. Increments plan counter
3. Sets status to `Ready to execute`
4. Updates `Last Activity` with today's date
5. When last plan reached → sets status to `Phase complete — ready for verification`

### 2.4 Concurrency Safety

**File-based locking** (`withPlanningLock()` in `core.cjs`):
- Atomic lock file creation (`.planning/.lock`) with `wx` flag
- 10-second timeout with 100ms retry
- Stale lock detection (>30s old → force cleanup)
- Prevents concurrent worktrees from corrupting shared planning files

**Atomic read-modify-write** pattern in `state.cjs`:
```javascript
readModifyWriteStateMd(statePath, (content) => {
  // transform content
  return content;
}, cwd);
```
This prevents lost updates when multiple agents patch STATE.md concurrently.

---

## 3. Phase Lifecycle — How Phases Work

### 3.1 Phase CRUD (from `phase.cjs`)

| Operation | Command | Behavior |
|-----------|---------|----------|
| **Add** | `cmdPhaseAdd()` | Creates phase dir + ROADMAP.md entry, auto-numbers |
| **Insert** | `cmdPhaseInsert()` | Inserts decimal phase (e.g., 2.1) after existing phase |
| **Remove** | `cmdPhaseRemove()` | Deletes phase dir, renumbers siblings, updates ROADMAP.md + STATE.md |
| **Complete** | `cmdPhaseComplete()` | Verifies all plans done, updates ROADMAP.md progress table |
| **List** | `cmdPhasesList()` | Lists phase dirs, sorted numerically |
| **Find** | `cmdFindPhase()` | Locates phase by number/name, returns plans + summaries |
| **Plan Index** | `cmdPhasePlanIndex()` | Full inventory: waves, autonomous flags, task counts |

### 3.2 Phase Naming Convention

**Sequential mode (default):**
```
01-foundation/
02-authentication/
03-core-features/
```

**With project code prefix:**
```
CK-01-foundation/
CK-02-authentication/
```

**Decimal (inserted phases):**
```
02.1-hotfix/
02.2-urgent-patch/
```

**Custom mode:**
```
SPRINT-A/
SPRINT-B/
```

### 3.3 Phase Directory Structure

```
.planning/phases/02-authentication/
├── 02-01-JWT-Setup-PLAN.md          # Plan file
├── 02-01-JWT-Setup-SUMMARY.md       # Execution summary
├── 02-02-Refresh-Tokens-PLAN.md
├── 02-02-Refresh-Tokens-SUMMARY.md
├── 02-CONTEXT.md                    # User decisions (from discuss-phase)
├── 02-RESEARCH.md                   # Technical research
├── 02-VALIDATION.md                 # Nyquist validation strategy
└── 02-UI-SPEC.md                    # UI design contract (if frontend)
```

---

## 4. Gate Mechanism — How Quality is Enforced

### 4.1 Gate Taxonomy (from `references/gates.md`)

| Gate Type | When | Behavior | Recovery |
|-----------|------|----------|----------|
| **Pre-flight** | Workflow entry | Blocks if preconditions unmet | Fix precondition, retry |
| **Revision** | After output | Loops back with feedback (max 3 iterations) | Producer addresses feedback |
| **Escalation** | Unresolvable | Pauses, presents options to human | Human chooses path |
| **Abort** | Dangerous to continue | Stops immediately, preserves state | Fix root cause, restart |

### 4.2 Gate Application in Workflows

```
plan-phase.md:
  Entry     → Pre-flight (REQUIREMENTS.md exists?)
  Post-plan → Revision (plan-checker reviews, max 3 loops)
  Post-loop → Escalation (unresolved issues → human decision)

execute-phase.md:
  Entry     → Pre-flight (PLAN.md exists?)
  Post-wave → Revision (SUMMARY.md complete?)
  Post-exec → Escalation (failed criteria → human)

next.md:
  Entry     → Abort (error state, broken checkpoints)
```

### 4.3 Checkpoint Types (from `references/checkpoints.md`)

| Type | Frequency | Purpose | Human Action |
|------|-----------|---------|-------------|
| **human-verify** (90%) | Most common | Confirm automated work works | Visual inspection, click-through |
| **decision** (9%) | Architecture choices | Select between options | Choose option A/B/C |
| **human-action** (1%) | Auth gates only | Unblock automation | Provide credentials, click email links |

**Critical rule:** The framework automates everything with CLI/API. Checkpoints are ONLY for human judgment — never for running commands the agent could execute.

---

## 5. Workflow Pipeline — The Execution Flow

### 5.1 Primary Pipeline (plan → execute → verify)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FULL PIPELINE FLOW                               │
│                                                                     │
│  /gsd-plan-phase N                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Initialize — load config, models, paths                   │  │
│  │ 2. Parse args — phase number, flags (--research, --gaps)     │  │
│  │ 3. Validate — phase exists in ROADMAP.md                     │  │
│  │ 4. Load CONTEXT.md — user decisions (or prompt to create)    │  │
│  │ 5. Research — spawn gsd-phase-researcher (if needed)         │  │
│  │    ↓ ## RESEARCH COMPLETE → RESEARCH.md                       │  │
│  │ 5.5 Validation — create VALIDATION.md (Nyquist)              │  │
│  │ 5.55 Security — threat model gate (ASVS)                     │  │
│  │ 5.6 UI Contract — UI-SPEC.md gate (if frontend)              │  │
│  │ 5.7 Schema Push — detect ORM files, inject blocking task     │  │
│  │ 6. Check existing plans — offer add/review/replan            │  │
│  │ 7. Spawn gsd-planner — create PLAN.md                        │  │
│  │    ↓ ## PLANNING COMPLETE → PLAN.md                           │  │
│  │ 8. Spawn gsd-plan-checker — quality gate (max 3 iterations)  │  │
│  │    ↓ ## VERIFICATION PASSED or ## ISSUES FOUND                │  │
│  │ 9. On failure → escalation to human                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │                                        │
│                            ▼                                        │
│  /gsd-execute-phase N                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Initialize — load phase, plans, config                    │  │
│  │ 2. Check anti-patterns — .continue-here.md blocking rows     │  │
│  │ 3. Branching — create feature branch if configured           │  │
│  │ 4. Validate — phase dir exists, plans exist                  │  │
│  │ 5. Discover — build plan index, group by waves               │  │
│  │ 6. Execute waves:                                            │  │
│  │    a. files_modified overlap check (intra-wave safety)       │  │
│  │    b. Spawn gsd-executor per plan (parallel or sequential)   │  │
│  │       ↓ worktree isolation + --no-verify for parallel        │  │
│  │    c. Wait for completion (spot-check fallback)              │  │
│  │    d. Post-wave hook validation (pre-commit hooks)           │  │
│  │    e. Merge worktrees, clean up, restore orchestrator files  │  │
│  │    f. Handle failures → retry or escalate                    │  │
│  │ 7. Update STATE.md — phase complete                          │  │
│  │ 8. Update ROADMAP.md — mark phase done                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │                                        │
│                            ▼                                        │
│  /gsd-verify-phase N                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Pre-flight — SUMMARY.md exists for all plans              │  │
│  │ 2. Check success criteria (from ROADMAP.md)                  │  │
│  │ 3. Run verification tests                                    │  │
│  │ 4. Spawn gsd-verifier (or gsd-integration-checker)           │  │
│  │    ↓ ## Verification Complete                                 │  │
│  │ 5. Create VERIFICATION.md                                    │  │
│  │ 6. On failure → route to /gsd-debug or /gsd-review           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Wave-Based Parallel Execution

**Wave concept:** Plans within a phase are grouped into waves (integers in frontmatter). Waves execute sequentially; plans within a wave execute in parallel (when `parallelization: true`).

```
Phase 2: Authentication
├── Wave 1: 02-01-JWT-Setup, 02-02-Refresh-Tokens  (parallel)
├── Wave 2: 02-03-OAuth-Integration                 (sequential after Wave 1)
└── Wave 3: 02-04-Session-Management                (sequential after Wave 2)
```

**Intra-wave safety:** Before spawning, the orchestrator checks `files_modified` overlap. If two plans in the same wave touch the same file → force sequential execution for that wave only.

### 5.3 Worktree Isolation

When `workflow.use_worktrees: true`:
1. Each parallel plan gets its own git worktree
2. Worktrees created sequentially (to avoid `.git/config.lock` contention)
3. Agents execute in parallel with `--no-verify` commits
4. After wave completes: merge all worktrees back, restore orchestrator files (STATE.md, ROADMAP.md always win from main)
5. Clean up worktrees

---

## 6. Agent Contracts — How Agents Communicate

### 6.1 Completion Markers (from `references/agent-contracts.md`)

| Agent | Completion Marker | Meaning |
|-------|------------------|---------|
| gsd-planner | `## PLANNING COMPLETE` | Plan is ready |
| gsd-executor | `## PLAN COMPLETE` | Execution done, SUMMARY.md created |
| gsd-phase-researcher | `## RESEARCH COMPLETE` / `## RESEARCH BLOCKED` | Research done or stuck |
| gsd-plan-checker | `## VERIFICATION PASSED` / `## ISSUES FOUND` | Plan quality gate |
| gsd-verifier | `## Verification Complete` | Post-execution verification |
| gsd-roadmapper | `## ROADMAP CREATED` / `## ROADMAP REVISED` | Roadmap updated |
| gsd-integration-checker | `## Integration Check Complete` | Cross-phase check passed |

### 6.2 Handoff Contracts

**Planner → Executor (via PLAN.md):**
- Frontmatter: `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`
- `<objective>` — what the plan achieves
- `<tasks>` — ordered XML task list with `type`, `files`, `action`, `verify`, `acceptance_criteria`
- `<verification>` — overall verification steps
- `<success_criteria>` — measurable completion criteria

**Executor → Verifier (via SUMMARY.md):**
- Frontmatter: `phase`, `plan`, `subsystem`, `tags`, `key-files`, `metrics`
- Commits table with per-task hashes
- Deviations section
- Self-Check: PASSED or FAILED

---

## 7. What Prevents Regression

### 7.1 Multi-Layer Defense

| Layer | Mechanism | What It Catches |
|-------|-----------|----------------|
| **Pre-flight Gates** | File existence, config validation | Missing prerequisites |
| **Revision Loops** | Plan checker with max 3 iterations | Poor quality plans |
| **files_modified Overlap** | Intra-wave file conflict detection | Parallel write conflicts |
| **Worktree Isolation** | Separate working trees per agent | Cross-agent interference |
| **Orchestrator File Protection** | STATE.md/ROADMAP.md restored from main after merge | Stale state overwrites |
| **Post-wave Hook Validation** | Pre-commit hooks run after merge | Code quality violations |
| **Spot-check Fallback** | SUMMARY.md + git log verification | Silent agent failures |
| **Nyquist Validation** | Dimension 8 coverage audit | Missing verification requirements |
| **Continuation Format** | `.continue-here.md` with anti-patterns | Repeated mistakes across sessions |

### 7.2 State Consistency Guarantees

1. **Single writer per concern:** Only execute-phase writes STATE.md phase position. Only plan-phase writes PLAN.md. Only gsd-executor writes SUMMARY.md.
2. **Atomic updates:** All state mutations use read-modify-write with file locking.
3. **Fallback field names:** `stateReplaceFieldWithFallback()` handles renamed/missing fields gracefully.
4. **Dual-layer state:** In-memory Maps + durable JSON file (continuity.ts pattern from harness project).
5. **Phase renumbering:** When a phase is removed, all subsequent phases are automatically renumbered (both integer and decimal phases).

### 7.3 Context Budget Management

The framework is designed to prevent context overflow:
- **Path-only passing:** Orchestrator passes file paths, not contents, to subagents
- **Context window adaptation:** For 200k models, lean prompts; for 1M+ models, richer context
- **Reap stale temp files:** Auto-cleanup of `gsd-*.json` temp files older than 5 minutes
- **STATE.md size constraint:** Under 100 lines — digest, not archive

---

## 8. Configuration — The Control Plane

### 8.1 `.planning/config.json`

```json
{
  "model_profile": "balanced",
  "commit_docs": true,
  "branching_strategy": "none",
  "phase_branch_template": "gsd/phase-{phase}-{slug}",
  "research": true,
  "plan_checker": true,
  "verifier": true,
  "nyquist_validation": true,
  "parallelization": true,
  "context_window": 200000,
  "phase_naming": "sequential",
  "project_code": null,
  "subagent_timeout": 300000,
  "workflow": {
    "research": true,
    "plan_check": true,
    "text_mode": false,
    "_auto_chain_active": false,
    "auto_advance": false,
    "use_worktrees": true,
    "security_enforcement": true,
    "ui_phase": true,
    "ui_safety_gate": true
  }
}
```

### 8.2 Model Profiles (from `model-profiles.cjs`)

| Profile | Use Case | Characteristics |
|---------|----------|----------------|
| `fast` | Quick fixes, simple tasks | Low cost, high speed |
| `balanced` | Default for most work | Good quality/speed ratio |
| `power` | Complex planning, architecture | Higher quality, slower |

---

## 9. Anti-Patterns the Framework Prevents

| Anti-Pattern | Prevention Mechanism |
|-------------|---------------------|
| **Agents overwriting each other's work** | files_modified overlap detection + worktree isolation |
| **Infinite revision loops** | Max 3 iterations → escalation gate |
| **Stale state after merge** | Orchestrator file protection (STATE.md/ROADMAP.md always restored from main) |
| **Context overflow during execution** | Path-only passing, context window adaptation |
| **Phantom plan execution** | Spot-check: SUMMARY.md existence + git commit verification |
| **Silent failures** | Two-signal completion detection (marker + filesystem) |
| **Repeated mistakes across sessions** | `.continue-here.md` anti-pattern tracking with blocking severity |
| **Missing verification** | Nyquist validation dimension audit |
| **Schema drift** | Schema push detection gate — injects blocking task |
| **UI without design contract** | UI-SPEC.md gate for frontend phases |
| **Security without threat model** | ASVS-level threat model requirement |

---

## 10. Summary: What Makes GSD Coherent

The GSD framework achieves coherence through **disciplined state machine design**:

1. **STATE.md is the single source of truth** — every workflow reads it first, updates it after every action
2. **Gates are the only flow control** — no workflow proceeds without its preconditions validated
3. **Agents are interchangeable** — completion markers make any agent's output consumable by any workflow
4. **Waves serialize dependencies** — parallel execution is safe because waves enforce ordering
5. **Worktrees isolate blast radius** — parallel agents can't corrupt each other's work
6. **Escalation is the safety valve** — when automation can't resolve, humans decide

**It's not magic — it's discipline.** The framework enforces discipline at every layer: state, gates, agents, and workflows. The result is a system that can handle complex multi-agent development without regression.

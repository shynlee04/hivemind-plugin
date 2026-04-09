# GSD Framework — Iterative Synthesis Knowledge

> **Date:** 2026-04-08  
> **Framework Version:** 1.34.2  
> **Purpose:** How GSD components work together iteratively across phases, stages, workflows — with mechanisms for coherent progression and regression prevention

---

## Part 1: The Iterative Cycle — How GSD Loops, Not Just Flows

GSD is not a linear pipeline. It is a **set of nested iterative loops**, each with its own entry/exit conditions, revision caps, and escalation paths.

### The 3 Nested Loops

```
┌────────────────────────────────────────────────────────────────────┐
│                    OUTER LOOP: MILESTONE                           │
│  new-milestone → roadmap → execute all phases → ship → milestone   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              MID LOOP: PHASE                                  │ │
│  │  discuss → research → plan → [revise ×3] → execute → verify  │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │         INNER LOOP: PLAN (WAVE)                        │  │ │
│  │  │  execute tasks → commit each → SUMMARY.md → verify     │  │ │
│  │  │                                                          │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │ │
│  │  │  │   MICRO LOOP: TASK (TDD)                         │  │  │ │
│  │  │  │  write test → implement → verify → commit        │  │  │ │
│  │  │  └──────────────────────────────────────────────────┘  │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

**Each loop has:**
- **Entry gate** — preconditions that must be met
- **Revision cap** — max iterations before escalation (typically 3)
- **Completion marker** — standardized `## MARKER` that callers regex-match
- **Exit action** — state write (STATE.md), artifact creation, checkpoint

---

## Part 2: Phase-to-Phase Iteration — The Progression Engine

### How State Drives Phase Iteration

STATE.md is the **iterative memory** that connects phases. Each phase reads state, modifies state, and the next phase inherits the accumulated context.

```
Phase 1 Complete
    ↓
STATE.md updates:
  - Current Position → "Phase 1 of 6 → Phase 2 of 6"
  - Plan → "1 of 1"
  - Status → "Ready to plan"
  - Last Activity → "2026-04-08 — Phase 1 shipped"
  - Progress → [██░░░░░░░░] 17%
  - Decisions → appended: "[Phase 1]: Chose SQLite for local storage"
  - Metrics → appended: "Phase 1 P01 | 12 min | 3 tasks | 8 files"
    ↓
/gsd-next detects: "Phase 2 ready to plan"
    ↓
User runs: /gsd-plan-phase 2
    ↓
Cycle repeats
```

### State Accumulation Pattern

```
Session 1:                    Session 2:                    Session 3:
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ STATE.md         │          │ STATE.md         │          │ STATE.md         │
│ Phase: 1 of 4    │  ──────→ │ Phase: 2 of 4    │  ──────→ │ Phase: 3 of 4    │
│ Plan: 0 of 2     │          │ Plan: 0 of 3     │          │ Plan: 2 of 3     │
│ Progress: 0%     │          │ Progress: 25%    │          │ Progress: 63%    │
│                  │          │                  │          │                  │
│ Decisions:       │          │ Decisions:       │          │ Decisions:       │
│ (empty)          │          │ - [Phase 1]: X   │          │ - [Phase 1]: X   │
│                  │          │                  │          │ - [Phase 2]: Y   │
│ Blockers:        │          │ Blockers:        │          │ Blockers:        │
│ (empty)          │          │ (none)           │          │ - Phase 2 API    │
│                  │          │                  │          │   key pending    │
│ Last session:    │          │ Last session:    │          │ Last session:    │
│ 2026-04-08 09:00 │          │ 2026-04-08 14:30 │          │ 2026-04-09 10:15 │
│ Stopped at:      │          │ Stopped at:      │          │ Stopped at:      │
│ Plan 01-02 done  │          │ Phase 2 wave 1   │          │ Phase 3 plan 2   │
│ Resume: None     │          │ Resume: None     │          │ Resume: .cont... │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

**Key iterative property:** STATE.md grows incrementally but is size-capped at ~100 lines. When it approaches the cap, old decisions are trimmed (full log stays in PROJECT.md). This keeps the iterative memory **fresh but bounded**.

---

## Part 3: The Revision Loop — How Quality Improves Iteratively

### Plan Checker Revision Loop (plan-phase.md)

```
gsd-planner creates PLAN.md
    ↓
gsd-plan-checker reviews
    ↓
    ├── ## VERIFICATION PASSED → proceed to execute
    │
    └── ## ISSUES FOUND → feedback to planner
            ↓
        gsd-planner revises (iteration 2)
            ↓
            ├── ## VERIFICATION PASSED → proceed
            │
            └── ## ISSUES FOUND → feedback with specific gaps
                    ↓
                gsd-planner revises (iteration 3 — FINAL)
                    ↓
                    ├── ## VERIFICATION PASSED → proceed
                    │
                    └── ## ISSUES FOUND → ESCALATION GATE
                            ↓
                        Display to user:
                        "Plan failed review after 3 iterations.
                         Unresolved: [specific issues]
                         
                         Options:
                         1. Accept plan anyway (acknowledge risks)
                         2. Provide manual guidance and retry
                         3. Abort this phase"
```

**Why 3 iterations?** 
- Iteration 1: Catch obvious gaps (missing tasks, wrong scope)
- Iteration 2: Address structural issues (wrong wave grouping, missing dependencies)
- Iteration 3: Refine details (task granularity, verification criteria)
- Beyond 3: Diminishing returns → escalate to human

### Stall Detection

The revision loop tracks whether issue count **decreases** between iterations. If iteration 3 has the same or more issues than iteration 2 → **stall detected** → escalate immediately, don't waste a 4th iteration.

---

## Part 4: Wave-Based Execution — The Parallel Iteration

### How Waves Iterate Sequentially

```
Phase 2: Authentication (4 plans, 3 waves)

Wave 1 (plans 02-01, 02-02) — parallel
  ├── Spawn executor for 02-01-JWT-Setup
  ├── Spawn executor for 02-02-Refresh-Tokens
  ├── Wait for both to complete
  ├── Post-wave: merge worktrees, run hooks
  ├── Spot-check: SUMMARY.md + git log
  └── Wave 1 COMPLETE
        ↓
Wave 2 (plan 02-03) — sequential (depends on Wave 1)
  ├── 02-03-OAuth-Integration reads Wave 1 summaries
  ├── Execute with knowledge of what Wave 1 built
  └── Wave 2 COMPLETE
        ↓
Wave 3 (plan 02-04) — sequential (depends on Wave 2)
  ├── 02-04-Session-Management reads Wave 1 + Wave 2 summaries
  └── Wave 3 COMPLETE
        ↓
Phase 2 COMPLETE → verify-phase
```

### Intra-Wave Safety Iteration

```
Before spawning Wave 2:
  ↓
Check files_modified overlap:
  ├── Plan A modifies: auth.ts, jwt.ts, middleware.ts
  ├── Plan B modifies: oauth.ts, providers.ts, auth.ts  ← OVERLAP on auth.ts
  └── Safety action:
        ↓
      Force sequential execution for this wave
      Log warning: "Planning defect: Plans A and B share auth.ts"
      Run A first, then B
```

---

## Part 5: Checkpoint Iteration — Human-in-the-Loop Feedback

### The Checkpoint Loop

```
Plan tasks execute (automated)
    ↓
Agent reaches <task type="checkpoint:human-verify">
    ↓
Agent STOPS. Displays:
┌─────────────────────────────────────────────┐
│ CHECKPOINT: Verification Required           │
│ Progress: 5/8 tasks complete                 │
│                                             │
│ Built: Login page with JWT auth             │
│ Verify:                                     │
│   1. Visit http://localhost:3000/login      │
│   2. Enter test credentials                 │
│   3. Should redirect to /dashboard          │
│   4. Session cookie present                 │
│                                             │
│ → YOUR ACTION: Type "approved" or describe  │
│                issues                       │
└─────────────────────────────────────────────┘
    ↓
User tests and responds:
  ├── "approved" → agent continues to task 6
  ├── "redirect goes to /home, not /dashboard" → agent fixes, re-presents checkpoint
  └── "login works but no session cookie" → agent debugs, retries
```

**Iterative property:** Each checkpoint response can trigger a **micro-revision loop**:
1. User reports issue
2. Agent fixes
3. Agent re-presents same checkpoint (or new one if fix changed scope)
4. Loop until user approves or aborts

---

## Part 6: The Continuation Format — Cross-Session Iteration

When a session ends mid-phase, `.continue-here.md` captures the exact state for resumption:

```markdown
# Continue Here — Phase 2, Plan 02-03

## Where We Left Off
- Completed: Tasks 1-4 of 7
- Next task: "Add refresh token rotation endpoint"
- Known issue: auth.ts migration pending

## Critical Anti-Patterns (DO NOT REPEAT)
| Severity | Anti-Pattern | How It Manifested | Prevention |
|----------|-------------|-------------------|------------|
| blocking | Inline tool defs | Plan checker rejected plan — tools defined in plugin.ts instead of src/tools/ | Verify src/tools/ has separate files before execution |
| warning | No test files | Tasks completed but no .test.ts files created | Every task with `verify` must include test creation |

## Resume Protocol
1. Read this file completely
2. Answer all blocking anti-pattern questions
3. Continue from Task 5
```

### Cross-Session Iteration Flow

```
Session 1 (09:00 - 12:00):
  └── Phase 2, Plan 02-03: Tasks 1-4 done
  └── Context window reaching limit
  └── Write .continue-here.md with anti-patterns
  └── Update STATE.md: "Stopped at: Task 4 of 7"
  └── End session

Session 2 (next day):
  └── Read STATE.md → "Phase 2, Plan 02-03, Task 4 of 7"
  └── Find .continue-here.md
  └── Read anti-patterns, answer questions
  └── Continue from Task 5
  └── Complete plan, create SUMMARY.md
  └── Delete .continue-here.md (no longer needed)
```

**Iterative property:** Anti-patterns learned in Session 1 become **blocking questions** in Session 2. The agent must demonstrate understanding (not just acknowledgment) before proceeding. This ensures iterative learning, not just state restoration.

---

## Part 7: Model Profile Iteration — Adaptive Intelligence

### How Model Profiles Shift Across Phases

```
.planning/config.json:
  "model_profile": "balanced"  ← default

Phase Type      → Model Profile   → Why
─────────────────────────────────────────────────────────
Research        → power           ↑ Needs deep reasoning, web search synthesis
Planning        → power           ↑ Needs architectural thinking, decomposition
Execution       → balanced        → Straightforward implementation
Verification    → balanced        → Systematic checking
Debug           → power           ↑ Needs hypothesis testing, root cause analysis
Quick fixes     → fast            ↓ Low complexity, high speed OK
```

### Context Window Adaptation

```
200k model (Sonnet 4):          1M model (Opus 4.6):
┌────────────────────────┐      ┌────────────────────────┐
│ Orchestrator prompt:   │      │ Orchestrator prompt:   │
│ - File paths only      │      │ - File paths +         │
│ - Subagent prompts:    │      │   prior phase CONTEXT  │
│   - Phase context      │      │ - Subagent prompts:    │
│   - Current files      │      │   - Phase context      │
│                        │      │   - Current files      │
│                        │      │   - Prior wave summaries│
│                        │      │   - Cross-phase context│
│ Context budget: ~15%   │      │ Context budget: ~35%   │
└────────────────────────┘      └────────────────────────┘
```

**Iterative property:** As the project progresses and more phases complete, the accumulated context (prior SUMMARY.md files, CONTEXT.md files) grows. The framework adapts by:
- Using 200k models: Only pass paths, agents read files themselves (fresh context window)
- Using 1M models: Pass richer context directly for cross-phase awareness

---

## Part 8: The Decision Accumulation Loop

### How Decisions Flow Through Phases

```
Phase 1: Foundation
  └── discuss-phase → CONTEXT.md created with decisions:
        - SQLite for local storage
        - No ORM, raw SQL
        - Single-user mode only
  ↓
Phase 2: Features
  └── planner reads Phase 1 CONTEXT.md
  └── Must honor: "No ORM" → can't use Prisma/Drizzle
  └── New decisions in Phase 2 CONTEXT.md:
        - File-based migrations in /migrations/
        - Schema version in metadata table
  ↓
Phase 3: Multi-User
  └── planner reads Phase 1 + Phase 2 CONTEXT.md (if 1M model)
  └── Must honor:
        - SQLite → needs WAL mode for concurrent reads
        - Raw SQL → migrations still manual
        - Single-user → now adding auth, but keep SQLite
  └── New decisions in Phase 3 CONTEXT.md:
        - JWT for auth tokens
        - Password hashing with argon2
```

**Iterative property:** Each phase's decisions become **locked constraints** for subsequent phases. The planner cannot violate prior decisions without explicitly noting the deviation and creating a new decision entry.

---

## Part 9: Verification Iteration — The Nyquist Loop

### Dimension-Based Verification (Nyquist Validation)

Nyquist defines 8 verification dimensions. After execution, the framework audits each:

| Dimension | What It Checks | Iterative Property |
|-----------|---------------|-------------------|
| 1. Requirements | All REQ-IDs addressed? | Missing REQs → route back to planner |
| 2. Architecture | Matches CONTEXT.md decisions? | Violations → fix or create new decision |
| 3. Implementation | Code exists, not stubs? | Stubs → route to executor for completion |
| 4. Testing | Tests written, passing? | Missing tests → route back with test gap report |
| 5. Integration | Cross-phase flows work? | Broken integrations → spawn integration-checker |
| 6. Security | Threat model addressed? | Unmitigated threats → spawn security-auditor |
| 7. UI | Matches UI-SPEC.md? | Deviations → spawn ui-auditor |
| 8. Validation | VALIDATION.md coverage? | Gaps → create supplement or accept risk |

### The Verification Loop

```
execute-phase completes
    ↓
verify-phase reads ROADMAP.md success criteria
    ↓
verify-phase reads all SUMMARY.md files
    ↓
Check each dimension (1-8):
  ├── All PASS → VERIFICATION.md created, phase marked complete
  └── Any FAIL → create gap report
        ↓
        Options:
        1. Auto-fix (missing tests → generate test stubs)
        2. Route to gsd-debug (complex failures)
        3. Route to gsd-review (quality issues)
        4. Accept gap (document risk, continue)
        ↓
        Fix → re-verify → loop until all dimensions pass or escalated
```

---

## Part 10: The Complete Iterative Flow — End to End

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ITERATIVE FLOW                          │
│                                                                     │
│  PROJECT INIT                                                       │
│  ├── /gsd-new-project → PROJECT.md, config.json, ROADMAP.md         │
│  └── STATE.md initialized: "Phase 1 ready to plan"                 │
│                                                                     │
│  ┌─ PHASE ITERATION (repeat per phase) ──────────────────────────┐ │
│  │                                                                │ │
│  │  DISCUSS (optional)                                           │ │
│  │  ├── Analyze codebase assumptions                              │ │
│  │  ├── Capture design decisions                                  │ │
│  │  └── Write CONTEXT.md → feeds planning                         │ │
│  │                                                                │ │
│  │  RESEARCH (optional)                                          │ │
│  │  ├── Spawn gsd-phase-researcher                                │ │
│  │  ├── Investigate patterns, pitfalls, dependencies              │ │
│  │  └── Write RESEARCH.md → feeds planning                        │ │
│  │                                                                │ │
│  │  PLAN                                                         │ │
│  │  ├── Spawn gsd-planner (reads CONTEXT + RESEARCH + REQs)      │ │
│  │  ├── Create PLAN.md with waves, tasks, checkpoints            │ │
│  │  ├── ┌─ REVISION LOOP (max 3) ─────────────┐                 │ │
│  │  │   ├── gsd-plan-checker reviews           │                 │ │
│  │  │   ├── ISSUES FOUND → feedback to planner │                 │ │
│  │  │   ├── Planner revises                    │                 │ │
│  │  │   └── Stall detection → escalate if no improvement         │ │
│  │  │   └──────────────────────────────────────┘                 │ │
│  │  └── VERIFICATION PASSED → ready for execution                │ │
│  │                                                                │ │
│  │  EXECUTE                                                      │ │
│  │  ├── Discover plans, group by waves                           │ │
│  │  ├── ┌─ WAVE ITERATION (sequential) ────────┐                │ │
│  │  │   ├── Check files_modified overlap         │                │ │
│  │  │   ├── Spawn executors (parallel or seq)    │                │ │
│  │  │   │   ├── Worktree isolation (if parallel)  │               │ │
│  │  │   │   ├── Execute tasks, commit each        │               │ │
│  │  │   │   ├── Handle checkpoints                │               │ │
│  │  │   │   └── Create SUMMARY.md                 │               │ │
│  │  │   ├── Wait for completion (spot-check)     │                │ │
│  │  │   ├── Post-wave hook validation            │                │ │
│  │  │   ├── Merge worktrees, cleanup             │                │ │
│  │  │   └── Handle failures → retry/escalate     │                │ │
│  │  │   └────────────────────────────────────────┘                │ │
│  │  └── All waves complete → phase done                           │ │
│  │                                                                │ │
│  │  VERIFY                                                       │ │
│  │  ├── Check success criteria (ROADMAP.md)                      │ │
│  │  ├── Audit 8 Nyquist dimensions                               │ │
│  │  ├── ┌─ FIX LOOP ──────────────────────────┐                 │ │
│  │  │   ├── Gaps found → route to fix          │                 │ │
│  │  │   ├── Fix applied → re-verify            │                 │ │
│  │  │   └── Loop until pass or escalate        │                 │ │
│  │  │   └──────────────────────────────────────┘                 │ │
│  │  └── All dimensions pass → VERIFICATION.md                    │ │
│  │                                                                │ │
│  │  STATE UPDATE                                                 │ │
│  │  ├── STATE.md: advance to next phase                          │ │
│  │  ├── ROADMAP.md: mark phase complete                          │ │
│  │  └── Progress bar updated                                     │ │
│  │                                                                │ │
│  └─ END PHASE ITERATION ─────────────────────────────────────────┘ │
│                                                                     │
│  MILESTONE COMPLETE                                                 │
│  ├── All phases executed and verified                               │
│  ├── /gsd-ship → retrospective, summary                             │
│  ├── Archive completed phases                                       │
│  └── /gsd-new-milestone → start next milestone                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 11: What Ensures Coherence — The Binding Mechanisms

### 1. State Consistency

**Mechanism:** Every workflow reads STATE.md first. Every workflow writes STATE.md after actions. File locking prevents concurrent corruption.

**Coherence property:** No workflow ever operates on stale state. If STATE.md says "Phase 2, Plan 3 of 5, In Progress", every agent sees exactly that.

### 2. Decision Lineage

**Mechanism:** CONTEXT.md decisions are versioned per phase. Planners read prior phase CONTEXT.md files. Deviations from prior decisions create new decision entries with rationale.

**Coherence property:** Decisions accumulate, never disappear. A decision made in Phase 1 is still visible to the Phase 5 planner (with 1M models) or at least recorded in PROJECT.md Key Decisions table.

### 3. Artifact Dependencies

```
REQUIREMENTS.md ──→ CONTEXT.md ──→ RESEARCH.md ──→ PLAN.md ──→ EXECUTE
      ↓                   ↓              ↓             ↓
      └───────────────────┴──────────────┴─────────────┘
                                              ↓
                                      SUMMARY.md ──→ VERIFY
                                              ↓
                                      VERIFICATION.md
```

Each artifact has explicit inputs and outputs. The framework validates these exist before proceeding.

### 4. Completion Marker Protocol

Every agent outputs a standardized completion marker. Workflows regex-match these markers to detect completion. This makes agents **interchangeable** — any workflow can consume any agent's output.

### 5. Gate-Driven Flow Control

No workflow hardcodes "if success then X, else Y". Instead:
- Pre-flight gate → blocks entry
- Revision gate → loops back to producer
- Escalation gate → pauses for human
- Abort gate → terminates safely

This makes the framework **extensible** — new workflows can use the same gate taxonomy.

---

## Part 12: Regression Prevention — The Multi-Layer Defense

### Layer 1: Pre-Flight (Before Work Starts)

| Check | What It Catches |
|-------|----------------|
| STATE.md exists and valid | Corrupted or missing state |
| ROADMAP.md has phase defined | Attempting unplanned work |
| PLAN.md exists (for execute) | No plan to follow |
| CONTEXT.md decisions loaded | Ignoring prior decisions |

### Layer 2: Intra-Execution (During Work)

| Check | What It Catches |
|-------|----------------|
| files_modified overlap | Parallel write conflicts |
| Checkpoint verification | Incorrect implementations |
| TDD cycle (test → implement → verify) | Untested code |
| Worktree isolation | Cross-agent interference |

### Layer 3: Post-Execution (After Work)

| Check | What It Catches |
|-------|----------------|
| SUMMARY.md completeness | Incomplete execution |
| Nyquist dimension audit | Missing verification dimensions |
| Pre-commit hooks | Code quality violations |
| Integration checker | Cross-phase flow breaks |

### Layer 4: Cross-Session (After Resume)

| Check | What It Catches |
|-------|----------------|
| .continue-here.md anti-patterns | Repeated mistakes |
| Blocking question answers | Mindless resumption without understanding |
| STATE.md session continuity | Lost work between sessions |
| git log vs. SUMMARY.md alignment | Summary claims don't match commits |

---

## Part 13: Practical Iteration Examples

### Example 1: Plan Fails Review 3 Times

```
Iteration 1: Plan checker finds 5 issues
  → Missing wave groupings, no checkpoint definitions
  → Feedback: "Add wave groupings, define checkpoints"
  → Planner revises

Iteration 2: Plan checker finds 3 issues (improvement: 5→3)
  → Still missing verification criteria for tasks 3-5
  → Feedback: "Add verification for tasks 3, 4, 5"
  → Planner revises

Iteration 3: Plan checker finds 3 issues (stall: 3→3)
  → STALL DETECTED — issue count didn't decrease
  → Escalation gate fires
  → Display to user: "Plan failed 3 reviews, no improvement detected.
       Remaining: verification criteria missing for tasks 3-5"
  → User provides manual guidance: "Tasks 3-5 are database migrations, 
     verification = 'migration runs without data loss'"
  → Planner revises with guidance → PASSES
```

### Example 2: Agent Crashes Mid-Wave

```
Wave 2 spawning:
  ├── Plan 02-03 executor spawned (worktree A)
  ├── Plan 02-04 executor spawned (worktree B)
  ├── Plan 02-03 completes → SUMMARY.md created, commits visible ✓
  ├── Plan 02-04 → NO completion signal received
  │
  └── Spot-check fallback activates:
        ├── Check: test -f "02-04-SUMMARY.md" → TRUE ✓
        ├── Check: git log --grep="02-04" → commits found ✓
        └── Conclusion: Agent completed but signal lost
            → Log: "✓ 02-04 completed (spot-check verified)"
            → Continue to Wave 3 (no blocking)
```

### Example 3: Cross-Session Resume with Anti-Pattern

```
Session 1 (Monday):
  ├── Phase 3, Plan 03-02: Tasks 1-3 done
  ├── Agent keeps inlining tool definitions in plugin.ts
  ├── Session ends (context limit)
  └── .continue-here.md written:
        "BLOCKING: Agent inlined tools in plugin.ts — violates CQRS"

Session 2 (Tuesday):
  ├── Read .continue-here.md
  ├── Blocking anti-pattern detected
  ├── Agent must answer:
        1. What is this anti-pattern? 
           → "Tools defined inline in plugin.ts instead of separate files"
        2. How did it manifest?
           → "Previous agent added tool logic directly in plugin.ts"
        3. What prevents recurrence?
           → "Extract to src/tools/*.ts, plugin.ts only wires hooks+tools"
  ├── Agent answers all 3 → proceed from Task 4
  └── Task 4 creates new tool in src/tools/ correctly ✓
```

---

## Part 14: Configuration That Controls Iteration

### `.planning/config.json` — The Iteration Knobs

```json
{
  "parallelization": true,        // Wave 1+ run in parallel worktrees
  "research": true,               // Research before planning
  "plan_checker": true,           // Revision loop enabled
  "verifier": true,               // Post-execution verification
  "nyquist_validation": true,     // 8-dimension audit
  "workflow": {
    "use_worktrees": true,        // Isolate parallel agents
    "_auto_chain_active": false,  // Auto-advance between phases
    "auto_advance": false,        // Skip human checkpoints
    "security_enforcement": true, // Threat model gate
    "ui_phase": true,             // UI-SPEC.md gate
    "discuss_mode": "assumptions" // or "discuss"
  }
}
```

**Toggle these to control iteration intensity:**

| Setting | Low Iteration | High Iteration |
|---------|--------------|----------------|
| `plan_checker` | `false` — planner output accepted as-is | `true` — 3-review revision loop |
| `research` | `false` — plan from requirements only | `true` — research → plan → revise |
| `nyquist_validation` | `false` — basic verification only | `true` — 8-dimension audit |
| `parallelization` | `false` — sequential execution | `true` — parallel waves with worktrees |
| `auto_advance` | `false` — human approves each checkpoint | `true` — skip human verification |

---

## Part 15: Summary — The Iterative Knowledge

**GSD is iterative at every level:**

1. **Micro iteration:** TDD cycle within each task (test → implement → verify → commit)
2. **Task iteration:** Plans execute tasks sequentially, checkpointing as needed
3. **Wave iteration:** Groups of plans execute in parallel waves, sequentially between waves
4. **Phase iteration:** Phases execute in order, each building on prior phase decisions
5. **Milestone iteration:** Milestones group phases, each milestone ships before the next begins
6. **Project iteration:** Projects span milestones, each milestone building on prior work

**What makes it coherent:**
- STATE.md is the iterative memory (bounded, fresh, consistent)
- Gates are the flow control (pre-flight → revision → escalation → abort)
- Completion markers are the agent protocol (standardized, regex-matchable)
- Decision lineage is the constraint chain (prior decisions → locked → deviations logged)
- Nyquist dimensions are the quality net (8 dimensions, all must pass)

**What prevents regression:**
- 4-layer defense: pre-flight, intra-execution, post-execution, cross-session
- Spot-check fallback for silent agent failures
- Anti-pattern tracking across sessions (blocking questions)
- files_modified overlap detection for parallel safety
- Worktree isolation for parallel execution
- Orchestrator file protection (STATE.md/ROADMAP.md always restored from main)

**The framework is not magic — it's disciplined iteration.** Every loop has bounds, every gate has a purpose, every artifact has explicit inputs and outputs. The result is a system that can handle complex multi-agent development across multiple sessions without losing context or regressing on quality.

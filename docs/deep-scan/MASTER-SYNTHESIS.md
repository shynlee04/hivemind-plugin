# MASTER SYNTHESIS: HiveMind Context Governance

**Synthesis Date:** 2025-01-24
**Total Sectors Analyzed:** 10
**Total Files Scanned:** 200+ files
**Total LOC Analyzed:** ~25,000+ lines

---

## 1. EXECUTIVE SUMMARY

### Total Files Scanned by Sector

| Sector | Files | LOC | Primary Domain |
|--------|-------|-----|----------------|
| A: Core Session | 25 | ~6,800 | Session lifecycle, governance, compaction |
| B: Planning & Hierarchy | 13 | ~4,727 | Hierarchy tree, plan materialization |
| C: Code Intelligence | 18 | ~3,799 | AST, signatures, token budgeting |
| D: Graph & Filesystem | 15 | ~2,600 | FK validation, persistence, locking |
| E: Hooks & CLI | 12 | ~4,600 | Event handling, prompt injection, init |
| F: Agents & Tools | 9 agents + 4 tools | ~600 docs | Delegation, permissions, state machines |
| G: Commands | 30+ | ~430 docs | Slash command routing, pipelines |
| H: Skills | 12 skills (51 files) | ~1,200 | Entry resolution, verification protocols |
| I: Workflows & Templates | 46 | ~400 docs | Stage pipelines, output contracts |
| J: Scripts & Misc | 9 scripts + 19 lib | ~2,000 | Validation, recovery, bridges |

### Key Architectural Patterns Discovered

1. **CQRS Pattern** — `state-mutation-queue.ts` separates read (hooks) from write (tools)
2. **Actor Model** — `session-swarm.ts` for background research tasks
3. **Foreign Key System** — Graph nodes use relational FK validation with orphan quarantine
4. **Dual Hierarchy** — Session hierarchy (trajectory→tactic→action) vs Plan hierarchy (root→sub→atomic)
5. **Progressive Disclosure** — Skills load references conditionally based on triggers
6. **Budget Management** — Injection orchestrator manages per-turn token allocation
7. **Gate Enforcement** — Quality gates G0-G4 with evidence-required pass/fail
8. **Diamond Role Separation** — Orchestrator → Executor → Verifier → Researcher boundaries

---

## 2. RUNTIME FLOW MAPS

### 2.1 Entry Flow: How a Session Starts

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SESSION ENTRY FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  USER INPUT                                                                      │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    OPENCODE RUNTIME                                       │   │
│  │  session.created event ──► event-handler.ts                               │   │
│  │      │                                                                    │   │
│  │      ▼                                                                    │   │
│  │  ensureSessionCreatedBootstrap()                                          │   │
│  │      ├── brain.json created if missing                                    │   │
│  │      ├── hierarchy.json created if missing                                │   │
│  │      └── session profile created                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │              ENTRY-RESOLUTION SKILL (6-Step Protocol)                     │   │
│  │                                                                           │   │
│  │  STEP 1: Detect Session State                                             │   │
│  │      ├── Fresh ──► Full protocol from Step 2                              │   │
│  │      ├── Ongoing ──► Skip to Step 3                                       │   │
│  │      ├── Recovery ──► Re-anchor, then Step 2                              │   │
│  │      └── Continuation ──► Load handoff, Step 3                            │   │
│  │                                                                           │   │
│  │  STEP 2: Resolve Lineage                                                   │   │
│  │      ├── Framework signals ──► hivefiver                                  │   │
│  │      ├── Product signals ──► hiveminder                                   │   │
│  │      └── Unclear ──► Ask ONE question                                     │   │
│  │                                                                           │   │
│  │  STEP 3: Classify Intent                                                   │   │
│  │      ├── framework-meta ──► hivefiver confirmed                          │   │
│  │      ├── product-impl ──► hiveminder confirmed                            │   │
│  │      ├── research ──► Current + research skills                           │   │
│  │      └── ambiguous ──► Clarify BEFORE routing                             │   │
│  │                                                                           │   │
│  │  STEP 4: Assess Clarity                                                   │   │
│  │      ├── Clear ──► Step 5                                                 │   │
│  │      ├── Mostly clear ──► Proceed, document assumptions                   │   │
│  │      ├── Unclear ──► Ask ONE question                                     │   │
│  │      └── Contradictory ──► Present to user                                │   │
│  │                                                                           │   │
│  │  STEP 5: Route to Orchestrator                                            │   │
│  │      ├── Lineage matches ──► Proceed                                      │   │
│  │      └── Mismatch ──► wrong-start-resolver                                │   │
│  │                                                                           │   │
│  │  STEP 6: Gate Delegation Readiness                                        │   │
│  │      [ ] Intent classified                                                │   │
│  │      [ ] Lineage confirmed                                                │   │
│  │      [ ] Complexity assessed                                               │   │
│  │      [ ] Session continuity checked                                       │   │
│  │      [ ] Delegation packet ready                                          │   │
│  │      [ ] Intelligence export planned                                       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    SESSION-LIFECYCLE HOOK                                 │   │
│  │  (experimental.chat.system.transform)                                     │   │
│  │                                                                           │   │
│  │  buildGovernanceSignals()                                                 │   │
│  │      ├── detectFrameworkContext()                                         │   │
│  │      ├── collectProjectSnapshot()                                         │   │
│  │      ├── loadTreeMetrics()                                                │   │
│  │      ├── compileDetectionSignals()                                        │   │
│  │      └── generateEscalationBlock()                                        │   │
│  │                                                                           │   │
│  │  Inject into system prompt:                                               │   │
│  │      ├── HIVE-MASTER governance block                                     │   │
│  │      ├── Status blocks (drift, hierarchy, etc.)                           │   │
│  │      └── First-turn onboarding if turn_count === 0                        │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mid-Session Flow: Context During Execution

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MID-SESSION EXECUTION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  EVERY TOOL CALL                                                                 │
│      │                                                                           │
│      ├─────────────────────────────────────────────────────────────────────┐   │
│      │                                                                     │   │
│      ▼                                                                     │   │
│  ┌────────────────┐     ┌─────────────────────────────────────────────┐    │   │
│  │ tool.execute.  │     │ soft-governance.ts (tool.execute.after)      │    │   │
│  │ before         │     │                                              │    │   │
│  │ (tool-gate.ts) │     │  classifyTool() → "read"|"write"|"query"   │    │   │
│  │                │     │  trackToolResult() → update counters         │    │   │
│  │ Advisory check │     │  scanForKeywords() → stuck signals          │    │   │
│  │ (never blocks) │     │  queueStateMutation() → CQRS queue           │    │   │
│  └────────────────┘     └─────────────────────────────────────────────┘    │   │
│      │                                                                     │   │
│      ▼                                                                     │   │
│  ┌────────────────────────────────────────────────────────────────────┐    │   │
│  │                    DETECTION ENGINE (detection.ts)                  │    │   │
│  │                                                                     │    │   │
│  │  Signal Types:                                                      │    │   │
│  │  ├── turn_count >= 5 ──► INFO → WARN → CRITICAL → DEGRADED        │    │   │
│  │  ├── consecutive_failures >= 3 ──► INFO                            │    │   │
│  │  ├── section_repetition >= 4 ──► WARN                              │    │   │
│  │  ├── read_write_imbalance >= 8 reads, 0 writes ──► INFO           │    │   │
│  │  ├── timestamp_gap >= 2 hours ──► WARN                              │    │   │
│  │  ├── missing_tree ──► CRITICAL                                      │    │   │
│  │  └── write_without_read ──► WARN                                    │    │   │
│  └────────────────────────────────────────────────────────────────────┘    │   │
│      │                                                                     │   │
│      ▼                                                                     │   │
│  ┌────────────────────────────────────────────────────────────────────┐    │   │
│  │              INJECTION ORCHESTRATOR (per-turn budget)               │    │   │
│  │                                                                     │    │   │
│  │  Channels (priority order):                                         │    │   │
│  │  1. core-system (60% bootstrap, 50% after)                         │    │   │
│  │  2. core-message (40% bootstrap, 50% after)                         │    │   │
│  │                                                                     │    │   │
│  │  Markers Detected:                                                  │    │   │
│  │  ├── <hivemind>, HIVE-MASTER governance active                     │    │   │
│  │  ├── <hivemind_state, [SYSTEM ANCHOR:                               │    │   │
│  │  └── <system-reminder>, <hivemind-clarify>                          │    │   │
│  └────────────────────────────────────────────────────────────────────┘    │   │
│      │                                                                     │   │
│      ▼                                                                     │   │
│  ┌────────────────────────────────────────────────────────────────────┐    │   │
│  │                    .hivemind STATE UPDATES                          │    │   │
│  │                                                                     │    │   │
│  │  brain.json:                                                        │    │   │
│  │  ├── turn_count++                                                   │    │   │
│  │  ├── last_activity_ts = now                                        │    │   │
│  │  ├── drift_score (computed)                                         │    │   │
│  │  └── governance counters                                            │    │   │
│  │                                                                     │    │   │
│  │  hierarchy.json:                                                    │    │   │
│  │  ├── cursor updates (via map_context)                               │    │   │
│  │  └── node status transitions                                        │    │   │
│  │                                                                     │    │   │
│  │  graph/tasks.json:                                                  │    │   │
│  │  └── Task status updates via hiveops_todo                           │    │   │
│  └────────────────────────────────────────────────────────────────────┘    │   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Compaction Flow: Session Archival

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPACTION FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TRIGGER CONDITIONS:                                                             │
│  ├── compaction_count >= 3 (exhausted)                                          │
│  ├── compaction_count >= 2 AND hierarchy_complete                               │
│  └── hierarchy_complete AND user_turn_count >= 30                               │
│                                                                                  │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │              COMPACTING HOOK (experimental.session.compacting)            │   │
│  │                                                                           │   │
│  │  Preserve across compaction:                                              │   │
│  │  ├── Hierarchy tree (hierarchy.json)                                     │   │
│  │  ├── Anchors (anchors.json) — immutable facts                            │   │
│  │  ├── Active trajectory context                                           │   │
│  │  └── Pending mutations queue                                             │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                 COMPACTION ENGINE (compaction-engine.ts)                 │   │
│  │                                                                           │   │
│  │  executeCompaction():                                                     │   │
│  │  1. readActiveMd() → current session content                             │   │
│  │  2. loadTree() → hierarchy for preservation                              │   │
│  │  3. archiveSession() → move to sessions/archive/                         │   │
│  │  4. addGraphMem() → lifecycle trace to graph/mems.json                   │   │
│  │  5. identifyTurningPoints() → key decisions extracted                    │   │
│  │  6. generateNextCompactionReport() → for continuity                      │   │
│  │  7. pruneCompleted() → clean hierarchy tree                              │   │
│  │  8. resetActiveMd() → fresh session file                                 │   │
│  │  9. createBrainState() → new session with carried compaction_count       │   │
│  │  10. client.session.create() → SDK session (if available)                │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                     POST-COMPACTION STATE                                 │   │
│  │                                                                           │   │
│  │  .hivemind/sessions/archive/{session-id}.md                              │   │
│  │  ├── Full session content                                                │   │
│  │  ├── YAML frontmatter with metadata                                      │   │
│  │  └── Turning points summary                                              │   │
│  │                                                                           │   │
│  │  .hivemind/state/brain.json                                              │   │
│  │  ├── New session_id                                                      │   │
│  │  ├── compaction_count++ (carried forward, max 3)                         │   │
│  │  └── turn_count = 0 (reset)                                              │   │
│  │                                                                           │   │
│  │  next_compaction_report                                                   │   │
│  │  ├── Previous trajectory context                                         │   │
│  │  ├── Key decisions preserved                                             │   │
│  │  └── Recommended next actions                                            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Sub-Session Flow: Child Session Spawning

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SUB-SESSION SPAWN FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DELEGATION TRIGGER (hiveminder or hivefiver)                                   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │              DELEGATION-FRAMEWORK SKILL                                    │   │
│  │                                                                           │   │
│  │  Pre-Delegation Readiness Guard:                                          │   │
│  │  [ ] Intent classified (not assumed)                                      │   │
│  │  [ ] Lineage confirmed (not defaulted)                                    │   │
│  │  [ ] Complexity assessed (independent? dependent? unknown?)              │   │
│  │  [ ] Session continuity checked                                           │   │
│  │  [ ] Packet complete                                                      │   │
│  │  [ ] Intelligence export planned                                          │   │
│  │                                                                           │   │
│  │  Parallel vs Sequential Decision:                                         │   │
│  │  Default: SEQUENTIAL                                                       │   │
│  │  Parallel ONLY if:                                                        │   │
│  │  ├── Zero file overlap                                                    │   │
│  │  ├── Zero state dependency                                                │   │
│  │  ├── Zero output dependency                                               │   │
│  │  └── Failure isolation                                                    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    DELEGATION PACKET                                      │   │
│  │                                                                           │   │
│  │  {                                                                        │   │
│  │    delegation_source: "agent",                                            │   │
│  │    parent_context: {                                                      │   │
│  │      trajectory_id,                                                        │   │
│  │      context_summary,                                                     │   │
│  │      active_assumptions                                                   │   │
│  │    },                                                                     │   │
│  │    task: {                                                                │   │
│  │      objective,                                                            │   │
│  │      type,                                                                │   │
│  │      complexity,                                                          │   │
│  │      scope_paths,                                                         │   │
│  │      constraints,                                                         │   │
│  │      success_criteria                                                     │   │
│  │    },                                                                     │   │
│  │    return_schema: {                                                       │   │
│  │      status, files_modified, evidence, issues                             │   │
│  │    }                                                                      │   │
│  │  }                                                                        │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    SUBAGENT EXECUTION                                     │   │
│  │                                                                           │   │
│  │  Terminal Agents (cannot delegate further):                               │   │
│  │  ├── hivemaker ──► Execution (src/, tests/, docs/)                        │   │
│  │  ├── hivehealer ──► Remediation (src/, tests/, docs/)                    │   │
│  │  ├── hiveq ──► Verification (PASS/FAIL arbiter)                          │   │
│  │  ├── hiveplanner ──► Planning (docs/, .hivemind/)                        │   │
│  │  ├── hiverd ──► Research (external only)                                  │   │
│  │  ├── hivexplorer ──► Investigation (read-only)                           │   │
│  │  └── hitea ──► Testing Infrastructure                                     │   │
│  │                                                                           │   │
│  │  Session Role Detection:                                                   │   │
│  │  isMainSession() = false ──► Relaxed governance                          │   │
│  │  shouldSuppressHumanFacingGovernance() = true                             │   │
│  │  context-escalation Level 3 does NOT halt for SUB agents                 │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    POST-RETURN VALIDATION                                  │   │
│  │                                                                           │   │
│  │  Subagent returns                                                         │   │
│  │  ├── Contains failure signals? ──► Record FAILURE                        │   │
│  │  ├── Result is vague? ──► Request specifics                              │   │
│  │  └── Can verify? ──► Run verification ──► Record outcome                 │   │
│  │                                                                           │   │
│  │  Evidence Required:                                                       │   │
│  │  ├── Command outputs                                                      │   │
│  │  ├── File paths modified                                                  │   │
│  │  └── Test results                                                         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. LINEAGE COMPARISON MATRIX

| Aspect | Plan-Driven Lineage | Quick-Fix Lineage | Exploration Lineage |
|--------|---------------------|-------------------|---------------------|
| **Entry** | Full 6-step protocol, hierarchy required | Abbreviated protocol, hierarchy optional | Discovery-focused protocol |
| **Planning** | Grand → Phase → Sub → Atomic plans | Single atomic plan or none | Research plan only |
| **Hierarchy** | Full tree enforcement (trajectory→tactic→action) | Relaxed checks, flat allowed | Minimal hierarchy |
| **Governance** | Strict drift warnings, Level 3-4 halts for MAIN | Advisory warnings only | Discovery encouragement |
| **Delegation** | Full packet required, sequential default | Simplified packet, parallel allowed | Research delegation only |
| **Verification** | Gate enforcement G0-G4, evidence required | Basic verification | Research validation |
| **Compaction** | Preserves full hierarchy tree | Archives + resets | Preserves research artifacts |
| **Session Split** | Creates continuation session | No auto-split | No auto-split |
| **Tools** | All tools available | Subset (no hierarchy ops) | Research tools prioritized |
| **Skills** | Full skill ladder | Essential skills only | Research methodology |

### Lineage Scope Differences

| Scope | Trigger Agents | Governance Level |
|-------|----------------|------------------|
| `meta-framework` | hivefiver, hivehealer, hitea | Framework parity rules |
| `project` | hiveminder, hivemaker, hiveplanner | Project-specific governance |
| `unknown` | Unresolved agents | Default to strict |

---

## 4. HIERARCHY DECISION TREE

### 4.1 Plan Hierarchy (root → sub → atomic)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PLAN HIERARCHY DECISION TREE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GRAND PLAN (type: root)                                                        │
│  ├── id: "META01-PLAN" or "PROJ01-PLAN"                                        │
│  ├── parent: null                                                               │
│  ├── status: pending → active → complete                                        │
│  │                    └──► blocked (if dependency issue)                        │
│  └── created when:                                                              │
│      ├── New feature request with clear scope                                   │
│      ├── Multi-phase work identified                                            │
│      └── User declares major objective                                          │
│                                                                                  │
│      │                                                                           │
│      ▼                                                                           │
│  PHASE PLAN (type: sub)                                                         │
│  ├── id: "META01-SUB01-PLAN"                                                    │
│  ├── parent: "META01-PLAN"                                                      │
│  ├── status: pending → active → complete                                        │
│  └── created when:                                                              │
│      ├── Grand plan approved                                                    │
│      ├── Natural phase boundary identified                                      │
│      └── Independent work stream within grand plan                              │
│                                                                                  │
│      │                                                                           │
│      ▼                                                                           │
│  ATOMIC PLAN (type: atomic)                                                     │
│  ├── id: "META01-SUB01-ATOMIC01-PLAN"                                           │
│  ├── parent: "META01-SUB01-PLAN"                                                │
│  ├── status: pending → active → complete                                        │
│  └── created when:                                                              │
│      ├── Phase plan active                                                      │
│      ├── Deterministic execution block identified                               │
│      └── Single agent can complete in one session                               │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  STATUS TRANSITIONS                                                              │
│                                                                                  │
│  pending ──────► active ──────► complete                                        │
│      │              │                                                            │
│      │              ▼                                                            │
│      └────────► blocked ──► active (unblocked)                                   │
│                                                                                  │
│  Triggers:                                                                       │
│  ├── pending → active: Work started on plan                                     │
│  ├── active → complete: All acceptance criteria met                             │
│  ├── active → blocked: Dependency blocked or external issue                     │
│  └── blocked → active: Blocker resolved                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Session Hierarchy (trajectory → tactic → action)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       SESSION HIERARCHY (hierarchy.json)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TRAJECTORY (root level)                                                        │
│  ├── id: "trajectory_{MiMiHrHrDDMMYYYY}[-n]"                                    │
│  ├── level: "trajectory"                                                        │
│  ├── content: "User-declared focus area"                                        │
│  ├── status: active | pending | complete | blocked                             │
│  ├── stamp: "MiMiHrHrDDMMYYYY" (grep-traceable)                                 │
│  └── created by: declare_intent tool                                            │
│                                                                                  │
│      │                                                                           │
│      ▼                                                                           │
│  TACTIC (phase level)                                                            │
│  ├── id: "tactic_{MiMiHrHrDDMMYYYY}[-n]"                                        │
│  ├── level: "tactic"                                                            │
│  ├── parent: trajectory_id                                                       │
│  ├── content: "Phase/sub-level focus"                                           │
│  └── created by: map_context tool (level: tactic)                                │
│                                                                                  │
│      │                                                                           │
│      ▼                                                                           │
│  ACTION (atomic level)                                                           │
│  ├── id: "action_{MiMiHrHrDDMMYYYY}[-n]"                                        │
│  ├── level: "action"                                                            │
│  ├── parent: tactic_id                                                          │
│  ├── content: "Atomic-level focus"                                              │
│  └── created by: map_context tool (level: action)                               │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LEVEL TRANSITION RULES                                                          │
│                                                                                  │
│  isValidLevelTransition(parentLevel, childLevel):                                │
│      trajectory → tactic: VALID                                                 │
│      tactic → action: VALID                                                     │
│      action → *: INVALID (leaf nodes cannot have children)                      │
│                                                                                  │
│  Multi-Branch Support (v2):                                                      │
│  ├── Branches allow parallel workstreams                                        │
│  ├── primary_branch: "main" (default)                                           │
│  └── Operations: createBranch, switchBranch, pauseBranch, completeBranch        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. .HIVEMIND INTERACTION MAP

### What Gets READ vs WRITTEN

| File | READ BY | WRITTEN BY | Purpose |
|------|---------|------------|---------|
| **state/brain.json** | session-engine, session-governance, inspect-engine, hooks/* | session-engine, compaction-engine | Runtime state + governance counters |
| **state/hierarchy.json** | session-engine, session-governance, inspect-engine, cognitive-packer | session-engine, hivemind_hierarchy tool | Tree structure + cursor |
| **state/anchors.json** | inspect-engine, session_coherence, cognitive-packer | hivemind_anchor tool | Immutable cross-session anchors |
| **state/tasks.json** | hiveops_todo, task-authority, ralph-bridge | hiveops_todo, hiveops_export | Canonical task authority |
| **state/gates.json** | hiveops_gate, hiveops_export | hiveops_gate | Quality gate records |
| **state/sot-index.json** | hiveops_sot | hiveops_sot | Artifact registry |
| **graph/trajectory.json** | cognitive-packer, graph/reader | graph/writer, compaction-engine | Trajectory node |
| **graph/plans.json** | cognitive-packer, graph/reader, fk-validator | graph/writer, plan-fs | Plan nodes |
| **graph/tasks.json** | graph/reader, task-authority, ralph-bridge | graph/writer | Task nodes with FK |
| **graph/mems.json** | cognitive-packer, inspect-engine, graph/reader | graph/writer, compaction-engine | Memory nodes |
| **graph/orphans.json** | graph/reader, doctor-recovery | graph/writer, orphan-quarantine | Quarantined FK violations |
| **sessions/active/*.md** | session-io, session_coherence | session-engine, session-io | Active session files |
| **sessions/archive/*.md** | session_coherence, compaction-engine | compaction-engine, session-io | Archived sessions |
| **sessions/manifest.json** | session-io, planning-ops | session-io, session-engine | Session registry |
| **plans/manifest.json** | plan-fs, plan-validation | plan-fs | Plan registry with FK |
| **plans/{PREFIX}/*.md** | plan-fs, plan-validation | plan-fs | Plan files |
| **config.json** | All hooks, session-engine | CLI init | Governance settings |
| **project/planning/STATE.md** | hivefiver commands, workflows | planning-materializer | Readable state |
| **project/planning/PROJECT.md** | hivefiver commands | planning-materializer | Project overview |
| **project/planning/ROADMAP.md** | hivefiver commands | planning-materializer | Phase roadmap |

### File Temperature (Update Frequency)

| Temperature | Files | Update Pattern |
|-------------|-------|----------------|
| **HOT** (every turn) | brain.json, hierarchy.json, active.md | Real-time updates |
| **WARM** (cross-session) | mems.json, tasks.json, anchors.json | Session-scoped |
| **COOL** (phase-scoped) | plans.json, trajectory.json | Phase transitions |
| **COLD** (rarely) | config.json, manifest.json | Init/config changes |

---

## 6. AUTO-MECHANISM CATALOG

### 6.1 Hooks and Triggers

| Hook | Trigger | Auto-Actions |
|------|---------|--------------|
| `event` | session.created | Bootstrap brain.json, hierarchy.json, session profile |
| `event` | session.idle | Increment user_turn_count, staleness check, queue mutation |
| `event` | session.compacted | Register compaction signal, queue mutation |
| `event` | todo.updated | Parse todos, detect auto-realignment, queue task mutation |
| `tool.execute.before` | Every tool call | Advisory governance check (never blocks) |
| `tool.execute.after` | Every tool call | Counter update, detection signals, CQRS queue |
| `experimental.chat.system.transform` | Every LLM turn | Governance injection, status blocks, onboarding |
| `experimental.chat.messages.transform` | Every LLM turn | Cognitive context, first-turn coherence, checklist |
| `experimental.session.compacting` | Context compaction | Preserve hierarchy, anchors, trajectory context |

### 6.2 Context Injection Rules

| Injection Type | Condition | Content |
|----------------|-----------|---------|
| First-turn onboarding | turn_count === 0 | Project snapshot, framework context, onboarding backbone |
| Governance block | Every turn | HIVE-MASTER governance, drift warnings, hierarchy status |
| Status blocks | Active issues | Drift, stuck, hierarchy gaps, pending failures |
| Cognitive context | Every turn | Packed state from cognitive-packer |
| Pre-stop checklist | Before session end | Context integrity validation |
| Compaction continuity | Post-compaction | Previous trajectory, turning points, next actions |

### 6.3 Tool Activation Decisions

| Condition | Suggested Tool | Priority |
|-----------|----------------|----------|
| LOCKED session | hivemind_session (start) | 1 |
| High drift (score < 50, turns >= 5) | hivemind_session (update) | 2 |
| Long session (turns >= 15) | hivemind_cycle (export) | 3 |
| No hierarchy | hivemind_session (define trajectory) | 4 |
| 5+ completed branches | hivemind_hierarchy (prune) | 5 |
| Missing tree + flat hierarchy | hivemind_hierarchy (migrate) | 6 |
| Post-compaction | hivemind_inspect (drift check) | 7 |

### 6.4 Session Spawn Conditions

| Condition | Action |
|-----------|--------|
| automation_level === "full" AND trigger tool fired | Auto-split session |
| compaction_count >= 3 | Emergency escalation, recommend new session |
| hierarchy_complete AND user_turn_count >= 30 | Session split recommended |
| Child delegation | Create sub-session with relaxed governance |

### 6.5 Compaction Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| compaction_count | >= 3 | Exhausted, emergency escalation |
| compaction_count + hierarchy_complete | >= 2 AND true | Auto-split allowed |
| user_turn_count + hierarchy_complete | >= 30 AND true | Session boundary reached |

### 6.6 Detection Signal Triggers

| Signal Type | Threshold | Escalation |
|-------------|-----------|------------|
| turn_count | >= 5 | INFO → WARN → CRITICAL → DEGRADED |
| consecutive_failures | >= 3 | INFO |
| section_repetition | >= 4 | WARN |
| read_write_imbalance | >= 8 reads, 0 writes | INFO |
| timestamp_gap | >= 2 hours | WARN |
| missing_tree | hierarchy.json absent | CRITICAL |
| write_without_read | > 0 blind writes | WARN |

---

## 7. EDGE CASE MATRIX

| Edge Case | Handling | Sector | Key Files |
|-----------|----------|--------|-----------|
| **Fresh install (no .hivemind)** | Bootstrap gate triggers, auto-init command suggested, STATE_BOOTSTRAP_STOP_DIRECTIVE injected | E, J | init.ts, auto-init.sh, session-lifecycle.ts |
| **Continuity session (after compaction)** | Load compaction report, restore trajectory context, carry compaction_count forward | A | compaction-engine.ts, session_coherence.ts |
| **Brownfield project** | Framework conflict detection (GSD vs spec-kit), project snapshot collection, selection menu | A, E | framework-context.ts, session-governance.ts |
| **Greenfield project** | Onboarding backbone injection, auto-init required, no warnings (no state) | A, E | governance-instruction.ts, onboarding.ts |
| **Complex project** | Full 6-step entry protocol, planning protocol activation, skill ladder loading | H | entry-resolution SKILL.md |
| **Wrong agent spawn** | wrong-start-resolver skill, non-destructive restart message, lineage mismatch detection | H | wrong-start-resolver SKILL.md |
| **Session split** | Non-disruptive split at natural boundaries, hierarchy preservation, continuation session | A | session-split.ts |
| **Context loss** | context-integrity skill, repair checklist, anchor restoration | H | context-integrity SKILL.md |
| **Orphan nodes (FK violations)** | Quarantine to graph/orphans.json, graceful degradation, no silent data loss | D | orphan-quarantine.ts, fk-validator.ts |
| **Compaction exhausted** | Emergency escalation, recommend new session, context degradation warning | A | session-boundary.ts, compaction-engine.ts |
| **Child session** | Relaxed governance, suppressed human-facing warnings, Level 3 no halt | A | session-role.ts, context-escalation.ts |
| **Missing plan file** | Validation fails, yaml_headers_valid: false, syncPlanValidationState returns silently | B | plan-validation.ts, plan-fs.ts |
| **Corrupted hierarchy** | JSON parse error → createTree() (empty), normalizeDuplicateNodeIds(), migrateFromFlat() | B | hierarchy-tree.ts |
| **Stale session** | TTS filter, auto-archive if idle > config.stale_session_days | A, B | staleness.ts, onboarding.ts |
| **Concurrent writes** | File locking with retries, exponential backoff, stale lock removal | D | file-lock.ts, persistence.ts |

---

## 8. OPENCODE FEATURE INTERACTIONS

### 8.1 Fork Command

| Aspect | HiveMind Handling |
|--------|-------------------|
| **Session isolation** | Fork creates independent session with own brain.json |
| **Hierarchy inheritance** | Child session inherits hierarchy tree snapshot |
| **State divergence** | Each fork maintains independent state after split |
| **Re-merge** | No automatic merge; manual reconciliation via export/import |

### 8.2 Undo/Redo Commands

| Aspect | HiveMind Handling |
|--------|-------------------|
| **State rollback** | HiveMind state NOT automatically rolled back |
| **Brain backup** | persistence.ts maintains .bak files (last 3) |
| **Recovery** | doctor-recovery.ts can restore from backups |
| **Recommendation** | Use hivemind_cycle export before risky operations |

### 8.3 Git Diff Control

| Aspect | HiveMind Handling |
|--------|-------------------|
| **Auto-commit** | auto-commit.ts triggers after tool execution |
| **Commit advisor** | commit-advisor.ts suggests commit points |
| **Pre-stop validation** | hivemind-pre-stop includes git status check |
| **Branch awareness** | guard-public-branch.sh blocks sensitive merges |

### 8.4 Repeated Task Prevention

| Mechanism | Implementation |
|-----------|----------------|
| **Task deduplication** | hiveops_todo checks for existing content matches |
| **Completion tracking** | Tasks marked complete cannot be re-activated |
| **Dependency validation** | hiveops_todo deps action shows blocking relationships |
| **Evidence linking** | Tasks require evidence for completion claims |

---

## 9. CONCEPT CHAINING MAP

### How Concepts Chain Together

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONCEPT CHAINING MAP                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COMMANDS ──invoke──► AGENTS ──load──► SKILLS ──use──► TOOLS                   │
│      │                   │                │                │                     │
│      │                   │                │                │                     │
│      ▼                   ▼                ▼                ▼                     │
│  ┌────────┐         ┌────────┐       ┌────────┐       ┌────────┐               │
│  │/hive-  │         │hive-   │       │entry-  │       │hive-   │               │
│  │fiver   │────────►│fiver   │──────►│resolut │──────►│mind_   │               │
│  │        │         │.md     │       │ion     │       │session │               │
│  └────────┘         └────────┘       └────────┘       └────────┘               │
│      │                   │                │                │                     │
│      │                   │                │                │                     │
│      ▼                   ▼                ▼                ▼                     │
│  WORKFLOWS           PERMISSIONS      PROTOCOLS        STATE FILES              │
│      │                   │                │                │                     │
│      │                   │                │                │                     │
│      ▼                   ▼                ▼                ▼                     │
│  ┌────────┐         ┌────────┐       ┌────────┐       ┌────────┐               │
│  │hivefiver│        │edit:   │       │6-step  │       │brain.  │               │
│  │-enter- │        │allow   │       │entry   │       │json    │               │
│  │prise.  │        │bash: * │       │protocol│       │        │               │
│  │yaml    │        │        │       │        │       │        │               │
│  └────────┘         └────────┘       └────────┘       └────────┘               │
│      │                   │                │                │                     │
│      └───────────────────┴────────────────┴────────────────┘                     │
│                                      │                                           │
│                                      ▼                                           │
│                                  HOOKS                                           │
│                                      │                                           │
│                                      ▼                                           │
│                              ┌──────────────┐                                   │
│                              │ session-     │                                   │
│                              │ lifecycle.ts │                                   │
│                              │ (injection)  │                                   │
│                              └──────────────┘                                   │
│                                      │                                           │
│                                      ▼                                           │
│                              CONTEXT INJECTION                                   │
│                                      │                                           │
│                                      ▼                                           │
│                              ┌──────────────┐                                   │
│                              │ .hivemind/   │                                   │
│                              │ state/       │                                   │
│                              │ graph/       │                                   │
│                              │ sessions/    │                                   │
│                              └──────────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Actual Chains That Exist

| Chain | Trigger | Flow |
|-------|---------|------|
| **HiveFiver Build** | /hivefiver | command → hivefiver agent → entry-resolution skill → hivefiver-* commands → workflows → tools → .hivemind |
| **HiveMaker Execute** | Delegation packet | hiveminder → delegation-framework skill → hivemaker agent → execution → evidence → verification |
| **HiveQ Verify** | /hiveq-verify | command → hiveq agent → verification-methodology skill → hiveops_gate tool → gates.json |
| **HiveRd Research** | /hiverd-research | command → hiverd agent → research-methodology skill → MCP tools → docs/research/ |
| **Session Start** | session.created | event → event-handler → session-lifecycle hook → governance injection → brain.json |
| **Pre-Stop** | /hivemind-pre-stop | command → hiveminder agent → verification → export_cycle → compaction |

---

## 10. KNOWLEDGE GAPS SUMMARY

### Priority 1: Critical Gaps (Block Understanding)

| Gap | Sector | Impact | Recommended Action |
|-----|--------|--------|-------------------|
| **Skill loading mechanism** | H | Cannot understand how skills are resolved at runtime | Trace `skill("name")` implementation in SDK |
| **Graph sync implementation** | D, F | Unclear how graph/tasks.json syncs with state/tasks.json | Analyze `queueTaskManifestMutation()` flow |
| **Model selection for agents** | F | All agents show `model: default` — actual model unknown | Check opencode.json for global default |
| **HITEA isolation** | F | Not in delegation matrix, role unclear | Review hitea.md agent definition |

### Priority 2: Important Gaps (Affect Operations)

| Gap | Sector | Impact | Recommended Action |
|-----|--------|--------|-------------------|
| **Conditional reference loading** | H | How are references loaded "conditionally"? | Trace skill-loader.ts implementation |
| **LSP client interface** | C | `LSPBridge` accepts `unknown` as lspClient | Document concrete LSP implementations |
| **Tree-sitter error recovery** | C | Missing error handling for malformed AST | Add retry logic documentation |
| **Orphan recovery mechanism** | D | Quarantined nodes have no recovery path | Design and implement recovery tool |
| **Session ID resolution** | F | `context.sessionID` source unclear | Trace SDK context initialization |

### Priority 3: Enhancement Gaps (Nice to Have)

| Gap | Sector | Impact | Recommended Action |
|-----|--------|--------|-------------------|
| **Detection threshold tuning** | A | Hardcoded thresholds, no learning | Add config override documentation |
| **Compression ratio prediction** | C | Post-hoc calculation only | Add pre-compression estimation |
| **Secret detection context** | C | No severity escalation by file path | Integrate .secretsignore patterns |
| **Incremental update race conditions** | C | No mutex on processQueue | Add transaction boundaries |
| **Migration idempotency** | D | Partial migration handling unclear | Document rollback strategy |

### Priority 4: Documentation Gaps

| Gap | Sector | Recommended Action |
|-----|--------|-------------------|
| **G-01 through G-10 anti-patterns** | G, I | Create canonical anti-pattern catalog |
| **STATE.md schema** | I | Document pipeline state file structure |
| **Template references** | G | Verify existence of referenced templates |
| **Dead references** | G | Clean up references to deleted assets |
| **Registry.yaml location** | H | Find and document skill discovery mechanism |

---

## 11. CROSS-SECTOR DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-SECTOR DEPENDENCY GRAPH                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌─────────────┐                                    │
│                              │  SECTOR A   │                                    │
│                              │ Core Session│                                    │
│                              └──────┬──────┘                                    │
│                                     │                                            │
│           ┌─────────────────────────┼─────────────────────────┐                 │
│           │                         │                         │                 │
│           ▼                         ▼                         ▼                 │
│    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│    │  SECTOR B   │          │  SECTOR D   │          │  SECTOR E   │          │
│    │  Planning   │          │  Graph/FS   │          │   Hooks     │          │
│    └──────┬──────┘          └──────┬──────┘          └──────┬──────┘          │
│           │                         │                         │                 │
│           │                         │                         │                 │
│           ▼                         ▼                         ▼                 │
│    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│    │  SECTOR C   │          │  SECTOR J   │          │  SECTOR H   │          │
│    │ Code Intel  │          │   Scripts   │          │   Skills    │          │
│    └──────┬──────┘          └──────┬──────┘          └──────┬──────┘          │
│           │                         │                         │                 │
│           └─────────────────────────┼─────────────────────────┘                 │
│                                     │                                            │
│                                     ▼                                            │
│                         ┌─────────────────────┐                                 │
│                         │     SECTOR F        │                                 │
│                         │  Agents & Tools     │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                             │
│                    ┌───────────────┼───────────────┐                            │
│                    │               │               │                            │
│                    ▼               ▼               ▼                            │
│             ┌───────────┐   ┌───────────┐   ┌───────────┐                      │
│             │ SECTOR G  │   │ SECTOR I  │   │ SECTOR H  │                      │
│             │ Commands  │   │ Workflows │   │  Skills   │                      │
│             └───────────┘   └───────────┘   └───────────┘                      │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                         DEPENDENCY DIRECTION KEY                                 │
│                                                                                  │
│  A → B: Session engine uses hierarchy tree                                       │
│  A → D: Session engine uses persistence layer                                    │
│  A → E: Session governance injects via hooks                                     │
│  B → D: Planning uses graph/FS for storage                                       │
│  B → J: Planning uses scripts for validation                                     │
│  C → A: Code intel provides context for cognitive-packer                         │
│  D → J: Graph uses scripts for recovery                                          │
│  E → A: Hooks read brain.json, queue mutations                                   │
│  E → H: Hooks load skills for protocols                                          │
│  F → H: Agents depend on skills for behavior                                      │
│  G → F: Commands invoke agents                                                    │
│  G → H: Commands load skills                                                      │
│  I → H: Workflows require skills                                                  │
│  I → G: Workflows invoke commands                                                 │
│  J → D: Scripts validate graph state                                              │
│  H → F: Skills define agent behavior                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Summary Table

| Sector | Depends On | Dependents |
|--------|------------|------------|
| **A: Core Session** | D (persistence), B (hierarchy) | E (hooks), F (tools) |
| **B: Planning** | D (graph/FS), J (scripts) | A (session), F (tasks) |
| **C: Code Intel** | None (standalone) | A (cognitive-packer) |
| **D: Graph/FS** | Schemas | A, B, E, F, J |
| **E: Hooks** | A (session), H (skills), D (state) | None (runtime layer) |
| **F: Agents & Tools** | H (skills), D (state) | G (commands), I (workflows) |
| **G: Commands** | F (agents), H (skills) | I (workflows) |
| **H: Skills** | None (protocol definitions) | E, F, G, I |
| **I: Workflows** | G (commands), H (skills), F (agents) | None (user-facing) |
| **J: Scripts & Misc** | D (graph), B (planning) | All (validation) |

---

## APPENDIX: Key Insights Summary

### Architectural Strengths

1. **Clear Separation of Concerns** — Each sector has well-defined responsibilities
2. **CQRS Pattern** — Hooks read, tools write, no race conditions
3. **Graceful Degradation** — Orphan quarantine, staleness detection, doctor recovery
4. **Evidence-Based Verification** — No evidence = no pass, gates G0-G4
5. **Progressive Disclosure** — Skills load references conditionally, budget management
6. **Dual Hierarchy** — Session vs Plan hierarchies serve different purposes
7. **Platform Portability** — SDK boundary enforced, src/lib/ is platform-agnostic

### Architectural Concerns

1. **Knowledge Gaps** — Several critical mechanisms not fully documented
2. **Orphan Recovery** — No path back from quarantine
3. **Graph Sync** — Unclear synchronization between state/ and graph/
4. **Skill Loading** — Runtime resolution mechanism unclear
5. **Model Selection** — Agent model defaults not documented

### Recommended Next Steps

1. **Document skill loading mechanism** — How `skill("name")` resolves
2. **Create orphan recovery tool** — Path from quarantine back to valid state
3. **Clarify graph sync** — Document state/tasks.json ↔ graph/tasks.json flow
4. **Document model selection** — Global default and per-agent overrides
5. **Create anti-pattern catalog** — G-01 through G-10 definitions
6. **Add STATE.md schema** — Document pipeline state file structure

---

*MASTER SYNTHESIS COMPLETE*
*Generated: 2025-01-24*
*Sectors Analyzed: 10*
*Total Files: 200+*
*Total LOC: ~25,000+*

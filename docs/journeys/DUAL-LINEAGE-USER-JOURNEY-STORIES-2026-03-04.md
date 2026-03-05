# Dual-Lineage User Journey: Separate Spaces, Shared Entry Sequence

This document defines the **entry journey** that precedes lineage routing, and clarifies the **two totally separate spaces** that must never be conflated.

---

## The Core Architecture: Two Separate Spaces

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL ENTRY SEQUENCE (Shared)                        │
│  State Detection → Context Coherence → Auto-Init → Declare Intent          │
│       ↓                                                                       │
│  Progressive Research-Synthesis Loop (QA → Investigate → QA → Surface)       │
│       ↓                                                                       │
│  Minimal Context Gathering (glob/search/grep - just enough, no flooding)     │
│       ↓                                                                       │
│                         LINEAGE ROUTER                                      │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────────────┐    ┌──────────────────────────────┐
│   HIVE-FIVER SPACE          │    │   HIVEMINDER SPACE           │
│   (Framework/Tooling)       │    │   (Project Implementation)   │
├─────────────────────────────┤    ├──────────────────────────────┤
│ • Skills/commands/workflows │    │ • External SDKs/libraries    │
│ • Agent shaping             │    │ • src/ code implementation   │
│ • Governance hardening      │    │ • Feature delivery           │
│ • OpenCode primitives       │    │ • Project-level planning     │
│ • Custom tool healers       │    │ • Product milestones         │
└─────────────────────────────┘    └──────────────────────────────┘
```

**Critical Principle**: These are not two branches of the same planning stream. They are **two totally separate spaces** with different artifacts, different planning logic, and different execution patterns.

---

## 1. Universal Entry Sequence (Pre-Routing)

Any entry condition must be handled by this sequence before lineage routing occurs:

### Entry Conditions (All Must Be Handled)
- Mid-workflow return (unfinished business)
- Brand new user (no state)
- Absurd/chaotic prompt
- Wall-of-text dump
- Testing project while framework still incomplete
- No state register exists (auto-init required)

### Entry Sequence Steps

1. **State Detection** (bash check)
   - Check for existing session state
   - Detect prior lineage if available
   - Assess coherence level

2. **Context Coherence Check**
   - Verify if context is recoverable
   - Check for contradictions or drift
   - Validate session continuity

3. **Auto-Init (if no state)**
   - Create profile.json
   - Establish baseline state
   - Set agent: "unresolved" until declare_intent fires

4. **Declare Intent**
   - Lock in mode (plan_driven / quick_fix / exploration)
   - Establish trajectory anchor
   - Begin drift tracking

5. **Progressive Research-Synthesis Loop** (Iterative until clear)
   ```
   QA → Delegate Investigate/Research → QA again → Surface Requirements
   ```
   - First QA: Frame ambiguity, identify gaps
   - Investigation: hiverd research, hivexplorer codebase analysis
   - Second QA: Test assumptions, validate findings
   - Surface: Produce requirements bundle
   - Loop continues until requirements are explicit enough for reliable delegation

6. **Minimal Context Gathering**
   - Targeted glob/search/grep (just enough, no flooding)
   - Context collectors prevent hallucination and workflow entry failure
   - Critical: Without proper delegation to explorers/collectors, context floods like this message

7. **Route to Lineage**
   - Decision point: Hive-Fiver or Hiveminder
   - No shared planning artifacts after this point

---

## 2. Hive-Fiver Space (Framework Lineage)

**Role**: Meta-builder, framework doctor, quality gatekeeper
**Scope**: Tools, skills, commands, workflows, agents, OpenCode primitives
**Does NOT**: Direct project feature implementation (that's Hiveminder)

### Hive-Fiver GSD Workflow Pattern

```
/gsd:new-project
    │
    ├── Questions → Research → Requirements → Roadmap
    │
    └── FOR EACH PHASE:
            │
            ├─ /gsd:discuss-phase (Lock in preferences)
            │
            ├─ /gsd:plan-phase (Research + Plan + Verify)
            │   ├── Phase Researcher (x4 parallel)
            │   │   ├── Stack researcher
            │   │   ├── Features researcher  
            │   │   ├── Architecture researcher
            │   │   └── Pitfalls researcher
            │   │
            │   ├── Planner (reads PROJECT.md, REQUIREMENTS.md, CONTEXT.md, RESEARCH.md)
            │   │
            │   ├── Plan Checker ──> PASS? ──> PLAN files
            │   │                     No (loop up to 3x)
            │   │
            │   └── Nyquist Validation (test coverage mapping before code)
            │
            ├─ /gsd:execute-phase (Parallel execution by wave)
            │   ├── Wave 1: Independent plans (fresh 200K context per executor)
            │   ├── Wave 2: Depends on Wave 1
            │   └── Verifier checks against phase goals
            │
            └─ /gsd:verify-work (Manual UAT)
                    │
                    ├── PASS ──> VERIFICATION.md
                    └── FAIL ──> Issues logged
```

### Hive-Fiver Can "Doctor" Hiveminder
- Improve OpenCode innate primitives
- Set up healers (custom tools only - no more)
- Provide framework-level guardrails
- BUT: Cannot directly implement features in src/

---

## 3. Hiveminder Space (Project Lineage)

**Role**: Project implementation, feature delivery
**Scope**: src/ codebase, external SDKs, libraries, product milestones
**Does NOT**: Framework tooling (that's Hive-Fiver)

### Hiveminder GSD Workflow Pattern

Same pattern as Hive-Fiver but applied to project implementation:
- Project-level planning (not framework planning)
- External SDK integration
- Feature implementation in src/
- Product milestone delivery

### Critical Difference
While the workflow pattern is similar, the **artifact space is completely separate**:
- Hive-Fiver: `skills/`, `commands/`, `workflows/`, `.opencode/`
- Hiveminder: `src/`, external dependencies, product code

---

## 4. Planning Artifacts: Same Pattern, Different Universes

The planning artifact structure looks similar but exists in **two parallel universes**:

### Artifact Pattern (Applied separately to each lineage)
```
.planning/
  PROJECT.md              # Vision and context (always lineage-specific)
  REQUIREMENTS.md         # Scoped v1/v2 requirements with IDs
  ROADMAP.md              # Phase breakdown with status tracking
  STATE.md                # Decisions, blockers, session memory
  config.json             # Workflow configuration
  MILESTONES.md           # Completed milestone archive
  research/               # Domain research
  todos/
    pending/              # Captured ideas awaiting work
    done/                 # Completed todos
  debug/                  # Active debug sessions
    resolved/             # Archived debug sessions
  phases/
    XX-phase-name/
      XX-YY-PLAN.md       # Atomic execution plans
      XX-YY-SUMMARY.md    # Execution outcomes and decisions
      CONTEXT.md          # Implementation preferences
      RESEARCH.md         # Ecosystem research findings
      VERIFICATION.md     # Post-execution verification results
```

### Key Insight
- Same artifact **pattern** is reused (GSD methodology)
- Same **granular control** with conditional parallelism
- BUT: **Different files, different locations, different ownership**
- Never assume one lineage's `PROJECT.md` relates to the other's

---

## 5. Delegation Levels and Tool Integration

### Two-Level Delegation System

**Level 1: Task Delegation** (coordinator to agents)
- Hiveminder or Hive-Fiver routes to subagents
- Clear handoff documents with constraints
- State validation before context transfer

**Level 2: Todo/Task Tool Schematic** (within agent execution)
- Tasks and todo tasks tool must work together schematically
- Task coordination across sub-tasks
- Dynamic todo list expansion as work progresses

### Entry-to-Delegation Chain

```
User Entry (any condition)
    ↓
State Detection → Context Coherence → Auto-Init → Declare Intent
    ↓
Progressive Research-Synthesis (QA cycles until requirements surface)
    ↓
Minimal Context Gathering (targeted, non-flooding)
    ↓
Lineage Router
    ↓
    ├─→ Hive-Fiver → Framework asset planning/execution
    │
    └─→ Hiveminder → Project implementation planning/execution
```

---

## 6. Edge Cases and Anti-Patterns

### E1: Context Flooding by Over-Collection
**Problem**: Without proper delegation to context collectors/explorers, every turn injects massive context.
**Solution**: Strict demand-driven collection; QA → Investigate → QA pattern; minimal targeted glob/search.

### E2: False Same-Stream Hallucination
**Problem**: AI assumes both lineages share the same planning artifacts.
**Reality**: Two totally separate spaces. Similar workflow patterns, completely separate files.

### E3: Mid-Workflow Dual Opening
**Problem**: User testing project while framework still incomplete; two lineages need simultaneous attention.
**Solution**: Clear session isolation per lineage; explicit routing decisions; no cross-contamination.

### E4: Task/Todo Tool Breakage
**Problem**: Tasks and todo tasks tool not working together schematically.
**Solution**: Coordinator maintains master task list; sub-tasks delegated with clear constraints; dynamic expansion tracked.

### E5: Workflow Entry Failure
**Problem**: Without context collectors/research delegation, system hallucinates and fails to enter proper workflow.
**Solution**: Progressive research-synthesis loop mandatory before any planning/execution.

---

## 7. Journey Contract

### Pre-Routing (Shared Sequence)
- [ ] State detection via bash check
- [ ] Context coherence validation
- [ ] Auto-init if state missing
- [ ] Intent declaration
- [ ] Progressive research-synthesis (iterative QA cycles)
- [ ] Minimal context gathering (non-flooding)
- [ ] Explicit lineage routing

### Post-Routing (Separate Spaces)
- [ ] No shared planning artifacts
- [ ] No shared knowledge synthesis artifacts after routing
- [ ] GSD workflow pattern applied independently per lineage
- [ ] Granular phase control with conditional parallelism
- [ ] Two-level delegation (tasks + todo tools)
- [ ] Clear handoff documents with constraints

### Cross-Lineage Interaction
- [ ] Hive-Fiver can doctor Hiveminder (primitives, healers)
- [ ] Hiveminder focuses on src/ implementation
- [ ] No framework asset creation in Hiveminder
- [ ] No direct feature work in Hive-Fiver

---

## 8. Acceptance Criteria

This journey spec is correct when:

1. **Entry sequence handles all conditions**: mid-workflow, new user, absurd prompts, wall-of-text, missing state
2. **Progressive research-synthesis is mandatory**: QA → Investigate → QA loop until requirements surface
3. **Context flooding is prevented**: minimal targeted collection, demand-driven
4. **Lineage spaces are totally separate**: no shared planning or synthesis artifacts after routing
5. **GSD workflow pattern is applied**: granular phases with conditional parallelism per lineage
6. **Two-level delegation works**: coordinator tasks + agent todo tools integrated schematically
7. **Hive-Fiver doctors Hiveminder**: framework improvements flow to project lineage, but boundaries remain clear

---

**Result**: Correct understanding of two separate spaces with shared entry sequence, proper GSD workflow patterns, and contamination-free lineage separation.

# HiveMind Skills Hierarchy Network Map

**Created**: 2026-03-20
**Lineage**: hivefiver (meta-builder)
**Purpose**: Thin hierarchy presentation showing skills, hierarchy control, domain contribution, runtime, agent types, agent sets, workflow depth, conversation mode, and degrees of freedom

---

## 1. Skill Hierarchy Tree

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HIVEMIND SKILL HIERARCHY                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   P1 ENTRY/ROUTER SKILLS (Degrees of Freedom: High ─────────────────────────►──┐ │
│   ═════════════════════════════════════════════════════════════════════════ │   │
│                                                                                 │   │
│   use-hivemind-skill-writer ───────────────────────────────────────────────┐ │   │
│   ├── Entry router for skill design                                         │ │   │
│   ├── Routes to: hivemind-skill-write (create)                              │ │   │
│   │                  hivemind-skill-doctor (audit/repair)                    │ │   │
│   └── Platform knowledge: OpenCode, Claude Code, Cursor, Codex, Gemini      │ │   │
│                                                                                 │   │
│   hivemind-skill-writer ──────────────────────────────────────────────────┐ │   │
│   ├── Meta-builder entry for HiveMind skill authoring                      │ │   │
│   ├── Routes to: references/01-skill-anatomy.md (create)                    │ │   │
│   │                  references/03-three-patterns.md (refactor)              │ │   │
│   │                  references/05-skill-quality-matrix.md (audit)           │ │   │
│   └── TDD workflow references                                                │ │   │
│                                                                                 │   │
│   context-intelligence-entry ────────────────────────────────────────────┐ │   │
│   ├── Session start rot detection                                           │ │   │
│   ├── MUST LOAD at session start, after compaction, when drift detected     │ │   │
│   ├── Three modes: Quick State Read, Rot Check, Full Analysis               │ │   │
│   └── Outputs: session_type, rot_level, trust.score, action_gate            │ │   │
│                                                                                 │   │
└───────────────────────────────────────────────────────────────────────────────┘
│
│   P2 IMPLEMENTATION SKILLS (Degrees of Freedom: Medium ─────────────────────► │
│   ═════════════════════════════════════════════════════════════════════════════ │
│                                                                                 │
│   hivemind-skill-write ──────────────────────────────────────────────────────► │
│   ├── Authoring/building layer for HiveMind skills                           │
│   ├── Pattern levels: A (Simple), B (Moderate), C (Complex), D (Very Complex)│
│   └── TDD workflow: Identify failure modes → Design → Implement → Validate   │
│                                                                                 │
│   hivemind-skill-doctor ─────────────────────────────────────────────────────► │
│   ├── Audit/repair/hardening layer for skill quality                        │
│   ├── Quality dimensions: Trigger Accuracy, Action Coherence,                │
│   │                      Reference Integrity, Non-Redundancy, Edge Case      │
│   └── Overall threshold: ≥3.5 required for release                          │
│                                                                                 │
│   context-entry-verify ─────────────────────────────────────────────────────► │
│   ├── Deterministic project reality verification                            │
│   ├── Gate layers: Project Reality → Planning Integrity → Git Evidence      │
│   └── Commands: gate-chain, landscape, project build/tests, git branch-state│
│                                                                                 │
│   harness-architecture ──────────────────────────────────────────────────────► │
│   ├── OpenCode SDK Harness Architecture enforcement                         │
│   ├── Dual-plane: Control Plane (@opencode-ai/sdk) vs Execution Plane       │
│   │              (@opencode-ai/plugin)                                       │
│   └── Anti-patterns: Zero-trust delegation, Context window management        │
│                                                                                 │
│   git-atomic-memory ─────────────────────────────────────────────────────────► │
│   ├── Commit-to-session linking (semantic memory anchors)                    │
│   ├── Knowledge network: Commit → Session → Decision → Pattern            │
│   └── Enables: session-memory-resume (P2), delegation-handoff (P1)            │
│                                                                                 │
│   spec-distillation ────────────────────────────────────────────────────────► │
│   ├── Requirements → structured specs                                        │
│   ├── Buckets: Functional, Non-functional, Integration, Risk, Operations     │
│   └── Clarification: MCQ-first, one-at-a-time, block on high-impact          │
│                                                                                 │
│   research-methodology ─────────────────────────────────────────────────────► │
│   ├── Structured multi-source investigation                                   │
│   ├── Confidence scoring: High, Partial, Low                                 │
│   └── Evidence grading: Source reliability, Recency, Corroboration           │
│                                                                                 │
│   ralph-tasking ────────────────────────────────────────────────────────────► │
│   ├── Specs → Ralph PRD JSON + Beads dependency graphs                      │
│   ├── Validation: root name + userStories, deterministic IDs                 │
│   └── Anti-patterns: wrapper roots, non-deterministic IDs, circular deps   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Contribution Matrix

| Skill | Framework Governance | Context Management | Delegation Network | Memory Persistence | Verification Quality | Research Discovery | Planning Architecture | Implementation Execution |
|---------------------|:------------------:|:------------------:|:------------------:|:----------------:|:-------------------:|:-----------------:|:--------------------:|:---------------------:|
| **P1 Entry/Router** | | | | | | | | |
| use-hivemind-skill-writer | ● | ○ | ● | ○ | ● | ○ | ● | ○ |
| hivemind-skill-writer | ● | ○ | ○ | ○ | ● | ○ | ● | ○ |
| context-intelligence-entry | ○ | ● | ○ | ● | ● | ○ | ○ | ○ |
| **P2 Implementation** | | | | | | | | |
| hivemind-skill-write | ● | ○ | ○ | ○ | ● | ○ | ● | ● |
| hivemind-skill-doctor | ● | ○ | ○ | ○ | ● | ○ | ● | ○ |
| context-entry-verify | ○ | ● | ○ | ○ | ● | ○ | ○ | ○ |
| harness-architecture | ● | ○ | ○ | ○ | ● | ○ | ● | ○ |
| git-atomic-memory | ○ | ○ | ● | ● | ● | ○ | ○ | ○ |
| spec-distillation | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| research-methodology | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| ralph-tasking | ○ | ○ | ○ | ○ | ● | ○ | ● | ○ |

**Legend:**
- ● Primary domain contribution
- ○ Secondary/indirect contribution
- ☆ No contribution

**Domain Definitions:**
| Domain | Description |
|--------|-------------|
| **Framework Governance** | Skill design, agent orchestration, framework structure |
| **Context Management** | Session state, rot detection, entry validation |
| **Delegation Network** | Agent handoffs, bounded packets, task routing |
| **Memory Persistence** | Git-linking, semantic anchors, session continuity |
| **Verification Quality** | Quality scoring, gate enforcement, audit patterns |
| **Research Discovery** | Multi-source investigation, evidence grading |
| **Planning Architecture** | Spec distillation, PRD generation, dependency mapping |
| **Implementation Execution** | Direct file operations, code implementation |

---

## 3. Runtime Activation Table

| Skill | Session Start | Conversation Turn | Workflow Phase | Checkpoint | Completion |
|---------------------|:--------------:|:-----------------:|:--------------:|:----------:|:----------:|
| **P1 Entry/Router** | | | | | |
| use-hivemind-skill-writer | ▶ | ▶ | ▶ | ▶ | ○ |
| hivemind-skill-writer | ▶ | ▶ | ▶ | ▶ | ○ |
| context-intelligence-entry | ★ | ▶ | ○ | ★ | ● |
| **P2 Implementation** | | | | | |
| hivemind-skill-write | ○ | ▶ | ★ | ▶ | ○ |
| hivemind-skill-doctor | ○ | ▶ | ▶ | ★ | ● |
| context-entry-verify | ▶ | ▶ | ▶ | ★ | ● |
| harness-architecture | ○ | ▶ | ★ | ▶ | ○ |
| git-atomic-memory | ○ | ▶ | ★ | ○ | ● |
| spec-distillation | ○ | ▶ | ★ | ○ | ○ |
| research-methodology | ○ | ▶ | ★ | ○ | ○ |
| ralph-tasking | ○ | ▶ | ★ | ○ | ● |

**Legend:**
- ★ Mandatory/MUST activate
- ▶ Conditional activation (triggered by intent)
- ● Common activation point
- ○ Rarely activates at this runtime

**Runtime Definitions:**
| Runtime | Definition |
|---------|------------|
| **Session Start** | First turn, after /clear, after context compaction |
| **Conversation Turn** | Each user-agent exchange |
| **Workflow Phase** | During multi-step workflows (intake→classify→route→verify→return) |
| **Checkpoint** | Completion claims, gate verification, trust checks |
| **Completion** | End of task, before returning to orchestrator/user |

---

## 4. Agent Type Assignment

### HiveMind Agent Types

| Agent Type | Role | Uses These Skills | Delegates To |
|------------|------|-------------------|---------------|
| **hiveminder** | Primary Orchestrator | context-intelligence-entry, harness-architecture | hivefiver, hivexplorer, hiverd, hiveq, hiveplanner, hivemaker, hivehealer, hitea |
| **hivefiver** | Framework Orchestrator | context-intelligence-entry, hivemind-skill-writer, use-hivemind-skill-writer | hivexplorer, hiveplanner, hiverd, hiveq |
| **hivexplorer** | Researcher (subagent) | research-methodology | — |
| **hiverd** | External Research (subagent) | research-methodology | — |
| **hiveq** | Verifier (subagent) | context-entry-verify, hivemind-skill-doctor | — |
| **hiveplanner** | Planner (subagent) | spec-distillation, ralph-tasking | — |
| **hivemaker** | Implementation (subagent) | harness-architecture, git-atomic-memory | — |
| **hivehealer** | Remediation (subagent) | git-atomic-memory, hivemind-skill-doctor | — |
| **hitea** | Test Harness (subagent) | context-entry-verify | — |

### GSD Agent Types (24 Agents)

| GSD Agent Type | Role | Focus Domain |
|----------------|------|--------------|
| gsd-executor | Execution | Implementation |
| gsd-debugger | Debugging | Issue diagnosis |
| gsd-verifier | Verification | Quality gates |
| gsd-researcher | Research | Investigation |
| gsd-planner | Planning | Task decomposition |
| gsd-roadmapper | Roadmapping | Strategic planning |
| gsd-ui-researcher | UI Research | User interface patterns |
| gsd-ui-auditor | UI Audit | Interface quality |
| gsd-ui-checker | UI Check | Component validation |
| gsd-project-researcher | Project Research | Project context |
| gsd-phase-researcher | Phase Research | Stage investigation |
| gsd-research-synthesizer | Research Synthesis | Information consolidation |
| gsd-plan-checker | Plan Checking | Plan validation |
| gsd-nyquist-auditor | Nyquist Audit | Systematic review |
| gsd-integration-checker | Integration Check | Component integration |
| gsd-codebase-mapper | Codebase Mapping | Architecture documentation |

---

## 5. Agent Set Presentation

### By Lineage

| Lineage | Agent Set | Primary Agent | Subagents | Skills Set |
|---------|-----------|---------------|-----------|------------|
| **hiveminder** | Project Work | hiveminder | hivexplorer, hiverd, hiveplanner, hivemaker, hivehealer, hiveq, hitea | context-intelligence-entry, harness-architecture, git-atomic-memory |
| **hivefiver** | Framework Work | hivefiver | hivexplorer, hiverd, hiveplanner, hiveq | context-intelligence-entry, hivemind-skill-writer, use-hivemind-skill-writer, spec-distillation, ralph-tasking |
| **gsd** | Get Sh*t Done | gsd-executor | gsd-debugger, gsd-verifier, gsd-researcher, gsd-planner, gsd-roadmapper, gsd-ui-* | Standard OpenCode skills |

### Agent Set Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                         AGENT SET HIERARCHY                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   PROJECT LINEAGE (hiveminder)                                        │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ hiveminder (Primary Orchestrator)                                 │ │
│   │ ├── Research: hivexplorer, hiverd                                 │ │
│   │ ├── Planning: hiveplanner                                         │ │
│   │ ├── Implementation: hivemaker                                     │ │
│   │ ├── Remediation: hivehealer                                       │ │
│   │ ├── Verification: hiveq                                           │ │
│   │ └── Testing: hitea                                               │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│   FRAMEWORK LINEAGE (hivefiver)                                        │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ hivefiver (Framework Orchestrator)                                │ │
│   │ ├── Research: hivexplorer, hiverd                                 │ │
│   │ ├── Planning: hiveplanner                                         │ │
│   │ └── Verification: hiveq                                           │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│   GSD LINEAGE (24 agents)                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ Execution: gsd-executor, gsd-debugger                             │ │
│   │ Verification: gsd-verifier, gsd-plan-checker                       │ │
│   │ Research: gsd-researcher, gsd-project-researcher,                  │ │
│   │          gsd-phase-researcher, gsd-research-synthesizer           │ │
│   │ Planning: gsd-planner, gsd-roadmapper                             │ │
│   │ UI: gsd-ui-researcher, gsd-ui-auditor, gsd-ui-checker              │ │
│   │ Audit: gsd-nyquist-auditor, gsd-integration-checker               │ │
│   │ Mapping: gsd-codebase-mapper                                      │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Workflow Depth Map

| Skill | Turn-Level | Workflow-Level | Session-Level |
|---------------------|:-----------:|:---------------:|:-------------:|
| **P1 Entry/Router** | | | |
| use-hivemind-skill-writer | ● | ● | ○ |
| hivemind-skill-writer | ● | ● | ○ |
| context-intelligence-entry | ● | ● | ★ |
| **P2 Implementation** | | | |
| hivemind-skill-write | ○ | ● | ○ |
| hivemind-skill-doctor | ○ | ● | ○ |
| context-entry-verify | ● | ● | ● |
| harness-architecture | ○ | ● | ○ |
| git-atomic-memory | ○ | ● | ★ |
| spec-distillation | ○ | ● | ○ |
| research-methodology | ○ | ● | ○ |
| ralph-tasking | ○ | ● | ○ |

**Legend:**
- ★ Primary depth (maximum impact)
- ● Secondary depth (supports workflow)
- ○ Tertiary depth (utility role)

**Depth Definitions:**

| Level | Definition | Example |
|-------|------------|---------|
| **Turn-Level** | Operates within single conversation exchange | Clarifying questions, immediate routing |
| **Workflow-Level** | Operates across multi-step workflows | TDD cycles, audit processes, delegation chains |
| **Session-Level** | Persists across entire session or compensates | Session state management, memory anchors, rot recovery |

---

## 7. Conversation Mode Matrix

| Skill | Main Session | Subagent Session | User Interaction |
|---------------------|:------------:|:----------------:|:----------------:|
| **P1 Entry/Router** | | | |
| use-hivemind-skill-writer | ● | ○ | ★ |
| hivemind-skill-writer | ● | ○ | ★ |
| context-intelligence-entry | ★ | ● | ○ |
| **P2 Implementation** | | | |
| hivemind-skill-write | ● | ○ | ○ |
| hivemind-skill-doctor | ● | ○ | ○ |
| context-entry-verify | ● | ★ | ○ |
| harness-architecture | ● | ○ | ○ |
| git-atomic-memory | ★ | ★ | ○ |
| spec-distillation | ● | ○ | ★ |
| research-methodology | ● | ● | ○ |
| ralph-tasking | ● | ○ | ○ |

**Legend:**
- ★ Primary mode (primary interface)
- ● Secondary mode (active but delegated)
- ○ Tertiary mode (rarely active)

**Mode Definitions:**

| Mode | Definition | Characteristics |
|------|------------|-----------------|
| **Main Session** | Primary orchestrator/main agent conversation | Full context, tool access, routing authority |
| **Subagent Session** | Delegated specialist session | Filtered context, bounded scope, task-focused |
| **User Interaction** | Direct user engagement | Clarification questions, user approval gates, evidence reports |

---

## 8. Degrees of Freedom Table

| Skill | Degree | Freedom Level | Behavioral Characteristics |
|---------------------|:------:|:--------------:|---------------------------|
| **P1 Entry/Router** | | | |
| use-hivemind-skill-writer | 1 | HIGH | Adaptive routing, asks clarifying questions, presents alternatives, "best when/better when" distinctions |
| hivemind-skill-writer | 1 | HIGH | Adaptive routing, platform knowledge, lane-switch guidance, explicit routing when task clear |
| context-intelligence-entry | 2 | MEDIUM | Deterministic checks, structured JSON output, action gates enforcement |
| **P2 Implementation** | | | |
| hivemind-skill-write | 2 | MEDIUM | Pattern-guided, complexity gating (A/B/C/D levels), TDD workflow, deterministic validation |
| hivemind-skill-doctor | 2 | MEDIUM | Deterministic scoring (Skill-Judge metrics), structured audit process, PASS/FAIL gates |
| context-entry-verify | 3 | LOW | Fully deterministic, gate-chain execution, JSON output, no judgment calls |
| harness-architecture | 2 | MEDIUM | Pattern-guided, dual-plane enforcement, anti-pattern detection |
| git-atomic-memory | 2 | MEDIUM | Pattern-guided, knowledge network formation, reference loading by granularity |
| spec-distillation | 2 | MEDIUM | MCQ-first clarification, structured buckets, 2-3 candidates with tradeoffs |
| research-methodology | 2 | MEDIUM | Evidence grading standards, confidence scoring, contradiction handling |
| ralph-tasking | 3 | LOW | Deterministic schema validation, anti-pattern checks, JSON export |

### Degree Definitions

| Degree | Level | Description | Behavior |
|--------|-------|-------------|----------|
| **Degree 1** | HIGH | Router/Facilitator | Can ask clarifying questions, present alternatives, exercise judgment in routing |
| **Degree 2** | MEDIUM | Pattern-Guided | Follows structured patterns, some judgment within guardrails, TDD workflows |
| **Degree 3** | LOW | Deterministic | Strict rules, no deviation, PASS/FAIL gates, structured output only |

### NO-LOAD Rules (Stack Discipline)

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer or skip activation |
| Session state is degraded | `degraded`/`interrupted` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Wait for slot |
| Authority unclear | Conflicting SOT | Escalate first |

---

## 9. Hierarchical Skill Dependency Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SKILL DEPENDENCY CHAIN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SESSION INITIALIZATION (MUST RUN FIRST)                                  │
│   ═══════════════════════════════════════                                    │
│                                                                             │
│   context-intelligence-entry ───────────────────────────────────────────► │
│   │                                                                         │
│   ├── Validates session state                                               │
│   ├── Checks rot_level (CLEAN/SUSPECT/DEGRADED/POLLUTED/POISONED)          │
│   ├── Sets action_gate permissions                                          │
│   ├── Outputs: session_type, trust.score, recommendations                   │
│   │                                                                         │
│   └── IF rot_level >= DEGRADED ───► STOP, require recovery                │
│       IF trust.score < 0.6 ─────────► Elevated risk, require confirmation   │
│       IF session_type == NEW ─────────► Prepare fresh session               │
│       IF session_type == RESUMED ──► Retrieve existing anchors               │
│                                                                             │
│   SKILL LOADING ORDER (Stack Max: 3)                                        │
│   ═════════════════════════════════                                          │
│                                                                             │
│   P1 Router (stack count: 0) ─────────────────────────────────────────────► │
│   │   use-hivemind-skill-writer                                             │
│   │   hivemind-skill-writer                                                 │
│   │   context-intelligence-entry                                            │
│   │                                                                         │
│   └── Routes to appropriate P2 skill                                        │
│                                                                             │
│   P2 Implementation (stack count: ≤3) ────────────────────────────────────► │
│   │   hivemind-skill-write                                                  │
│   │   hivemind-skill-doctor                                                 │
│   │   context-entry-verify                                                  │
│   │   harness-architecture                                                  │
│   │   git-atomic-memory                                                     │
│   │   spec-distillation                                                     │
│   │   research-methodology                                                  │
│   │   ralph-tasking                                                         │
│   │                                                                         │
│   └── Executed by P1 router or agent                                        │
│                                                                             │
│   ENABLING RELATIONSHIPS                                                    │
│   ═════════════════════                                                     │
│                                                                             │
│   context-intelligence-entry ──ENABLES──► All other skills                  │
│   git-atomic-memory ──ENABLES──► session-memory-resume                      │
│   spec-distillation ──ENABLES──► ralph-tasking                              │
│   harness-architecture ──ENABLES──► tool development                        │
│                                                                             │
│   COMPLEMENTARY RELATIONSHIPS                                               │
│   ══════════════════════════                                                │
│                                                                             │
│   use-hivemind-skill-writer ──COMPLEMENTS──► hivemind-skill-writer          │
│   hivemind-skill-write ──COMPLEMENTS──► hivemind-skill-doctor               │
│   git-atomic-memory ──COMPLEMENTS──► delegation-handoff                     │
│   git-atomic-memory ──COMPLEMENTS──► git-advanced-workflows                   │
│   git-atomic-memory ──COMPLEMENTS──► conventional-commit                     │
│                                                                             │
│   CROSS-SKILL CHAINING                                                      │
│   ═════════════════════                                                      │
│                                                                             │
│   "resume session" ────────────────────────────────────────────────────────►│
│   context-intelligence-entry + git-atomic-memory + session-memory-resume    │
│                                                                             │
│   "audit skill" ──────────────────────────────────────────────────────────►│
│   use-hivemind-skill-writer + hivemind-skill-doctor                          │
│                                                                             │
│   "create skill" ────────────────────────────────────────────────────────►│
│   use-hivemind-skill-writer + hivemind-skill-write                          │
│                                                                             │
│   "context lost" ─────────────────────────────────────────────────────────►│
│   context-intelligence-entry + git-atomic-memory (recovery mode)            │
│                                                                             │
│   "requirements to specs" ────────────────────────────────────────────────►│
│   spec-distillation + ralph-tasking                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Summary: Dimension Cross-Reference

### Skills by Primary Function

| Primary Function | Skills |
|------------------|--------|
| **Entry/Router** | use-hivemind-skill-writer, hivemind-skill-writer, context-intelligence-entry |
| **Quality/Audit** | hivemind-skill-doctor, context-entry-verify |
| **Implementation** | hivemind-skill-write, harness-architecture |
| **Memory/Persistence** | git-atomic-memory |
| **Planning** | spec-distillation, ralph-tasking |
| **Research** | research-methodology |

### Skills by Stack Position

| Stack Position | Skills | Behavior |
|----------------|--------|----------|
| **P1 Router (count: 0)** | use-hivemind-skill-writer, hivemind-skill-writer, context-intelligence-entry | Does not count against stack budget |
| **P2 Implementation (count: ≤3)** | All others | Counts against stack budget, may require unloading |

### Skills by Freedom Degree

| Degree | Skills | Count |
|--------|--------|-------|
| **Degree 1 (High)** | use-hivemind-skill-writer, hivemind-skill-writer | 2 |
| **Degree 2 (Medium)** | context-intelligence-entry, hivemind-skill-write, hivemind-skill-doctor, harness-architecture, git-atomic-memory, spec-distillation, research-methodology | 7 |
| **Degree 3 (Low)** | context-entry-verify, ralph-tasking | 2 |

### Skills by Runtime Phase Priority

| Runtime Phase | Primary Skills |
|---------------|----------------|
| **Session Start** | context-intelligence-entry (MANDATORY) |
| **Conversation Turn** | All P1/P2 (CONDITIONAL) |
| **Workflow Phase** | harness-architecture, git-atomic-memory, spec-distillation, research-methodology, ralph-tasking |
| **Checkpoint** | context-intelligence-entry (MANDATORY), context-entry-verify, hivemind-skill-doctor |
| **Completion** | context-entry-verify, hivemind-skill-doctor, git-atomic-memory, ralph-tasking |

---

## Appendix A: Agent-to-Skill Activation Matrix

| Agent | Entry Skills (Auto-load) | Workflow Skills (Conditional) | Verification Skills (Checkpoint) |
|-------|--------------------------|------------------------------|----------------------------------|
| hiveminder | context-intelligence-entry | harness-architecture | context-entry-verify |
| hivefiver | context-intelligence-entry | hivemind-skill-writer, use-hivemind-skill-writer | hivemind-skill-doctor |
| hivexplorer | — | research-methodology | — |
| hiverd | — | research-methodology | — |
| hiveq | — | — | context-entry-verify, hivemind-skill-doctor |
| hiveplanner | — | spec-distillation, ralph-tasking | — |
| hivemaker | — | harness-architecture, git-atomic-memory | context-entry-verify |
| hivehealer | — | git-atomic-memory, hivemind-skill-doctor | context-entry-verify |
| hitea | context-entry-verify | — | — |

---

## Appendix B: Planned Skills (Not Yet Implemented)

| Skill | Purpose | Priority | Dependencies |
|-------|---------|----------|---------------|
| use-hivemind | MASTER entry router for all HiveMind operations | P0 | context-intelligence-entry |
| use-hivemind-context-integrity | Context rot recovery and repair | P1 | context-intelligence-entry |
| use-hivemind-context-verify | Project truth verification gates | P1 | context-entry-verify |
| use-hivemind-git-memory | Git-based semantic memory operations | P1 | git-atomic-memory |
| use-hivemind-delegation | Delegation packet routing and evidence | P1 | harness-architecture |
| use-hivemind-hierarchy | Skill hierarchy management | P2 | use-hivemind-skill-writer |
| use-hivemind-session-resume | Session continuity from anchors | P2 | git-atomic-memory |

---

## Appendix C: Reference Index

| Reference | Skill | Purpose |
|-----------|-------|---------|
| 01-skill-anatomy.md | hivemind-skill-write | Full anatomy template |
| 02-frontmatter-standard.md | hivemind-skill-write | YAML schema |
| 03-three-patterns.md | hivemind-skill-write | Pattern system (P1/P2/P3) |
| 04-tdd-workflow.md | hivemind-skill-write | TDD methodology |
| 05-skill-quality-matrix.md | hivemind-skill-doctor | Skill-Judge metrics |
| 06-agent-activation.md | hivemind-skill-writer | Agent activation patterns |
| 07-iterative-refinement.md | hivemind-skill-doctor | Self-improvement loops |
| 08-conflict-detection.md | hivemind-skill-doctor | Overlap detection |
| context-rot-taxonomy.md | context-intelligence-entry | Severity model |
| entry-state-matrix.md | context-intelligence-entry | State definitions |
| delegation-scope.md | context-intelligence-entry | Scope inheritance |
| trust-matrix.md | context-intelligence-entry | Scoring methodology |
| platform-surface.md | context-intelligence-entry | Directory mappings |
| gate-definitions.md | context-entry-verify | Gate check definitions |
| sdk-surface.md | harness-architecture | SDK code examples |
| ambiguity-taxonomy.md | spec-distillation | Ambiguity classification |
| prd-json-rules.md | ralph-tasking | Schema validation rules |
| intent-encoding.md | git-atomic-memory | Commit intent methods |
| session-linking.md | git-atomic-memory | Session-commit mapping |
| network-formation.md | git-atomic-memory | Knowledge graph building |
| hierarchy-levels.md | git-atomic-memory | Knowledge hierarchy |

---

**Document End**

*Generated: 2026-03-20*
*Lineage: hivefiver (meta-builder)*
*Return Path: docs/architecture/hivemind-skills-hierarchy-network-2026-03-20.md*
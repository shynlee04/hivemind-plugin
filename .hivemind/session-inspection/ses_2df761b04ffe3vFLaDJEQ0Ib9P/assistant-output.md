# Session Inspection Export

- ses_id: `ses_2df761b04ffe3vFLaDJEQ0Ib9P`
- prepared_at: `2026-03-24T15:58:06.295Z`

## Assistant Output

I now have all the context needed. Let me produce the complete batch-3 restructure plan.

---

# Batch-3 Skill Ecosystem Restructure Plan

**Goal:** Consolidate 32 HiveMind skills into exactly 15, rewriting every remaining skill.

**Date:** 2026-03-24

**Scope:** `.opencode/skills/` and `.developing-skills/refactored-skills/`

---

## Part 1: Complete Skill Table (15 Skills)

### Slot 1 — Entry Gate (1 skill)

| # | Skill | Slot | Consolidates | Must Contain | Writing Style | Handoff Pattern | Planning Support |
|---|-------|------|-------------|-------------|--------------|-----------------|-----------------|
| 1 | `use-hivemind` | Entry (1) | Current `use-hivemind` (full rewrite) | Agent role checklists (13 agents from `.opencode/agents/`), context health check protocol, Load-3 enforcement with templates, anti-pattern awareness (adversarial directives, human-like writing prohibitions), planning hierarchy entry point (SOT → phase → atomic), handoff templates showing disk-stored paths, scripts/helpers for runtime operations, lineage detection, platform detection, routing decision tree | Authoritative HOW-TO-PROCESS tone. Imperative verbs. No routing-table passivity — this is the gate that tells every agent HOW to work. 500+ lines minimum. | Terminal gate — all handoffs originate here. Templates reference `.hivemind/activity/` paths explicitly. Every handoff emits a JSON checkpoint. | Defines the phase numbering scheme (2-digit). Maps every planning skill to its slot. Entry point for plan creation flow: intake → spec → plan → delegate → verify. |

### Slot 2 — Domain Routers (6 skills)

| # | Skill | Slot | Consolidates | Must Contain | Writing Style | Handoff Pattern | Planning Support |
|---|-------|------|-------------|-------------|--------------|-----------------|-----------------|
| 2 | `use-hivemind-delegation` | Domain (2) | `use-hivemind-delegation` + `hivemind-gatekeeping-delegation` + `course-correction-delegation` + `research-delegation` + `agent-role-boundary` | Delegation packet templates (standard + TDD + debug + refactor + audit + research), return contracts with shared schema, role checklists (6 Diamond roles), failure recovery (cascading, multi-iteration, re-plan vs re-delegate), loop control (max_iterations, stop_conditions, carry-forward compression), synthesis gates, integration verification, cross-domain transitions (debug→refactor, audit→refactor), source validation/grading, evidence contracts | Encyclopedic reference tone. HARD-GATE blocks. Excuse→Reality tables. Every section has anti-patterns. Structured JSON schemas inline. | Master delegation dispatcher. All 5 delegation modes (sequential, parallel, dependent, independent, interdependent). Packet emission → agent dispatch → return → synthesis → gate. Loop checkpoints at `.hivemind/activity/delegation/`. | Supports plan execution dispatch. Each plan phase emits delegation packets through this skill. Phase transition gates reference this skill's synthesis gate protocol. |
| 3 | `use-hivemind-planning` | Domain (2) | `plan-engineering` + `plan-breakdown` + `spec-distillation` + `hivemind-codemap` (feasibility section) | Plan lifecycle (5 phases: validation → decomposition → dependency mapping → execution tracking → retraceability), plan record schema, decomposition methodology (6 steps), spec distillation (5-bucket classification, MCQ clarification, ambiguity map), phase numbering (2-digit), feasibility checking (delegate to hivexplorer), dependency graph (DAG, critical path, parallel candidates), slice template JSON, re-decomposition protocol | Planning-specialist tone. Step-by-step numbered protocols. Gate tables with pass conditions. JSON schemas for every record type. | Plan records at `.hivemind/activity/planning/`. Each phase emits delegation packets. Phase DAG tracks dependencies. Carry-forward between phases (≤5 key findings). | **IS** the planning skill. Owns plan creation from spec candidates. Feeds delegation packets to `use-hivemind-delegation`. Retraceability chain: Plan → Phase → Slice → Packet → Commit. |
| 4 | `use-hivemind-tdd` | Domain (2) | `tdd-delegation` + `tdd-phase-execution` + `test-gatekeeping-flow` | Red-green-refactor templates, gate commands (tsc, npm test, npm run build), test strategies per phase type, phase TDD lifecycle (per-phase R-G-R cycles), phase transition gates, multi-phase TDD state tracking (checkpoint schema), test gate protocol (5 gates: pre-implementation, post-implementation, post-refactor, phase transition, completion), test writing order (unit→integration→E2E), build-verify cycles, incremental test suite building, regression prevention | Enforcing tone. HARD-GATE blocks between R/G/R phases. "NO implementation without failing tests first." Command-expected-output pattern tables. | TDD checkpoints at `.hivemind/activity/delegation/`. Each R/G/R phase is a separate delegation packet. Phase transition gates require test evidence. Multi-phase checkpoint schema tracks test state across phases. | Supports plan phases that require TDD. Each plan phase can declare TDD lifecycle. Phase transition gates integrate TDD verification. |
| 5 | `use-hivemind-git-memory` | Domain (2) | `use-hivemind-git-memory` + `git-continuity-memory` + `git-memory-enforce` + `hierarchy-retrace` | Commit templates (conventional format + activity metadata), memory enforcement protocol (5-step: context capture, packet linkage, memory-first message format, index registration, retrieval methodology), hierarchy indexing (Epic→Phase→Slice→Packet→Return→Commit→Gate-Result), session recovery (resume/trace/retrieve/anchor), decision tree traversal (forward/backward/audit query), commit memory schema, knowledge network graph | Memory-keeper tone. "Every commit MUST carry decision context." Enforcement gates block commits without memory fields. Traversal operation tables. | Memory artifacts at `.hivemind/activity/commits/`. Hierarchy index at `.hivemind/activity/hierarchy/`. Session continuity at `.hivemind/activity/sessions/continuity.json`. Cross-session retrieval via hierarchy queries. | Supports plan retraceability. Every plan phase links to commit SHAs. Decision chain: Plan → Phase → Slice → Packet → Return → Commit. Hierarchy queries enable plan-to-commit traceability. |
| 6 | `use-hivemind-context` | Domain (2) | `context-entry-verify` + `context-intelligence-entry` + `use-hivemind-context-integrity` | Context health checks (quick/rot/full analysis modes), platform detection (OpenCode/Claude Code/Cursor), verification gates (4 layers: project reality, planning integrity, git evidence, architecture), freshness probes, state verification, context distrust protocol (trust-nothing mode, false signal awareness), carry-forward compression for context state, verification script (`scripts/hm-verify.cjs`) | Diagnostic tone. "Documents are advisory, code is truth." Gate tables with pass conditions. Distrust levels: CLEAN / SUSPECT / DEGRADED / POLLUTED / POISONED. | Verification output at `.hivemind/activity/codescan/`. Gate results as JSON. Integration with `use-hivemind` entry gate — context health check is the first gate every agent passes. | Supports plan validation phase. Feasibility checking delegates context verification. Plan cannot proceed past validation gate without context health proof. |
| 7 | `use-hivemind-skill-authoring` | Domain (2) | `use-hivemind-skill-writer` + `hivemind-skill-doctor` + `hivemind-skill-write` + `skill-universal-design` + `skill-conflict-detect` | Skill creation templates (SKILL.md frontmatter, LOAD-POSITION, bundled resources), review checklists (quality matrix, 9-phase audit), universal design validation (5 principles, 20-point checklist), conflict detection (5-type taxonomy: scope overlap, contradictory instructions, shared state, boundary violation, dependency cycle), platform abstraction matrix, skill anatomy reference, frontmatter standards, three-patterns reference, iterative refinement protocol | Authoritative "how to build skills" tone. Step-by-step creation workflow. Review gate tables. Conflict resolution strategies (16 strategies, 5 priority levels). | Skill artifacts in `.developing-skills/`. External routing to `skill-creator` and `skill-review` for non-HiveMind skills. HiveMind-specific conventions override external defaults. Conflict reports at `.hivemind/activity/skill-audit/`. | Supports meta-planning (planning about skills). When the plan involves creating or modifying skills, this skill provides the templates and validation gates. |

### Slot 3 — Specialist Depth (8 skills)

| # | Skill | Slot | Consolidates | Must Contain | Writing Style | Handoff Pattern | Planning Support |
|---|-------|------|-------------|-------------|--------------|-----------------|-----------------|
| 8 | `hivemind-atomic-commit` | Depth (3) | `hivemind-atomic-commit` (REWRITE — preserve all content, add integration with consolidated delegation) | Activity classification (5 classes), dependency mapping (5 types), 6-gate pre-commit protocol, rollback plans (5 methods), commit message format, surface ownership (12 classes), scripts (3 shell scripts), templates (4 JSON templates) | Disciplined, gate-heavy. "No commit without classification. No commit without rollback plan." Preserves existing structure. | Commits at `.hivemind/activity/commits/`. Activity records link to delegation packets and plan phases. Rollback plans stored alongside commit records. | Supports plan execution — each plan phase's commits are tracked. Retraceability: plan phase → commit SHA → activity class → rollback method. |
| 9 | `hivemind-system-debug` | Depth (3) | `hivemind-system-debug` (REWRITE — expand from 88 lines, embed debug loop methodology) | Debug methodology (reproduce→narrow→contain→evidence), context distrust in debugging, debug-to-refactor transition rules, containment/rollback definition, evidence collection format, debug output storage pattern | Debug-specialist tone. "Reproduce before you fix. Evidence before assertion." Hypothesis ranking tables. | Debug artifacts at `.hivemind/activity/agents/hivehealer/`. Debug delegation packets reference this skill's phase breakdown. Integration with `use-hivemind-detox-refactor` stage workflow. | Supports plan phases that involve debugging. Plan can declare debug lifecycle phases. Debug findings feed back into plan re-decomposition. |
| 10 | `use-hivemind-detox-refactor` | Depth (3) | `use-hivemind-detox-refactor` (REWRITE — preserve all content, integrate with consolidated skills) | 11-stage workflow (triage→verification→stabilization), branch families (5), stage contracts, restoration gate, capability bundles, knowledge synthesis, migration actions, report templates (10), governance recovery | Multi-stage orchestrator tone. "Pollution posture: this workspace is POLLUTED until proven otherwise." Stage contract tables with exit criteria. | Stage outputs at `.hivemind/activity/longhaul/`. Each stage is a delegation wave. Stage transitions require gate passage. Continuity manifest for cross-turn resume. | Supports large refactoring plans. Plan phases map to detox stages. Stage contracts define plan phase boundaries. |
| 11 | `hivemind-gatekeeping` | Depth (3) | `hivemind-gatekeeping-delegation` (RENAME + REWRITE) | Iterative loop control (max_iterations, stop_conditions), bead tracking, carry-forward compression, synthesis gates (4 checks), integration verification (5 steps), cascading failure recovery, re-plan vs re-delegate decision matrix | Gatekeeper tone. "No iteration without checkpoint. No gate without evidence." Loop checkpoint schemas. | Loop checkpoints at `.hivemind/activity/delegation/{loop_id}-checkpoint.json`. Gate results at `{loop_id}-gate-{iteration}.json`. | Supports plan phases with iterative loops. Plan can declare iterative sub-phases that gate through this skill. |
| 12 | `hivemind-codemap` | Depth (3) | `hivemind-codemap` (REWRITE — preserve all content, expand seam discovery) | Scan levels (quick/deep/exhaustive), tool modes (native/repomix/hybrid), 5-phase scan ladder, seam discovery, batch processing, delegation loop, scripts (`hm-codescan.sh`) | Scanner tone. "Map before you touch. Scan before you plan." Scan plan templates with scope boundaries. | Scan outputs at `.hivemind/activity/codescan/`. Scan passes chain: high-level-map → pipeline-map → journey-map → low-level-proof → cross-pass-synthesis. | Supports plan feasibility checking. Plan validation delegates codemap scan. Seam inventory informs plan decomposition boundaries. |
| 13 | `spec-driven-engineering` | Depth (3) | `spec-distillation` (REWRITE — expand to full SDE methodology) | Requirements distillation (5-bucket classification, MCQ clarification), ambiguity taxonomy, spec candidate generation, acceptance criteria template, user story format, traceability matrix (requirement → test → implementation) | Specification tone. "Every requirement must be testable. Every test must trace to a requirement." Ambiguity resolution protocol. | Spec candidates at `.hivemind/activity/planning/`. Distillation feeds directly into `use-hivemind-planning`. Ambiguity map as JSON artifact. | IS the spec input for planning. Upstream of `use-hivemind-planning`. Spec candidates are plan validation input. |
| 14 | `hivemind-refactor` | Depth (3) | `course-correction-delegation` (refactor section) + refactor patterns from `use-hivemind-detox-refactor` | Refactor methodology (assess→plan→execute→verify), seam inventory, risk assessment, refactor techniques (extract, inline, move, rename, collapse), code smell taxonomy, rollback protocol for refactors, refactoring delegation packets | Refactoring-specialist tone. "Smallest safe change. Behavior preservation is non-negotiable." Before/after comparison patterns. | Refactor artifacts at `.hivemind/activity/delegation/`. Refactor delegation packets include seam_inventory and risk_assessment fields. Refactor phase transitions gate through `hivemind-gatekeeping`. | Supports plan phases involving refactoring. Plan can declare refactor lifecycle phases. Refactor findings may trigger plan re-decomposition. |
| 15 | `hivemind-patterns` | Depth (3) | NEW (extract architecture patterns from `agent-role-boundary`, `skill-universal-design`, and project conventions) | Architecture patterns (Clean Architecture, CQRS, Interface Decomposition), clean code principles, design patterns (Strategy, Observer, Factory, Decorator), anti-pattern catalog (from AGENTS.md), code quality standards (LOC limits, JSDoc, modular development), pattern selection decision tree | Reference tone. "Architecture decisions must be documented. Patterns must be justified." Pattern tables with when-to-use conditions. | Patterns reference in plan architecture decisions. ADR format for pattern selection. Pattern violations detected during code review phases. | Supports plan architecture decisions. Plan phases can reference pattern requirements. Architect agent uses this skill for pattern selection. |

---

## Part 2: `use-hivemind` Content Outline (500+ lines)

```
# use-hivemind — HOW-TO-PROCESS Gate

<!-- SKILL-META
version: 3.0.0
last-updated: 2026-03-24
author: hivemind-team
load-position: slot-1
max-stack: 3
-->

## §0. LOAD-POSITION & STACK ENFORCEMENT (30 lines)
- Slot 1: Always loads first
- Stack budget: max 3 active skills
- Check-stack protocol: if ≥3 → DEFER with message
- No-load conditions (5): context depth >70%, degraded state, stack exhausted, conflicting SOT, another meta-skill active

## §1. AGENT ROLE CHECKLISTS (120 lines)
### 1.1 Orchestration Agents
  - hiveminder: primary orchestrator. NEVER reads code. NEVER implements. Routes only.
  - handoff: complex 3+ phase workflows. Gatekeeper validation mandatory.
### 1.2 Design Agents
  - architect: system design authority. ADRs required. Trade-off analysis mandatory.
  - hiveplanner: planning specialist. Dependency analysis mandatory. Every step needs target agent + success criteria.
### 1.3 Execution Agents
  - hivemaker: code implementation. 4-tier autonomy. 3-attempt limit. Self-verify with tsc + test.
  - hivehealer: remediation. Smallest safe fix. 3-attempt limit on same root cause.
  - hitea: test infrastructure. RED gate: tests MUST fail initially. Edge cases mandatory.
### 1.4 Verification Agents
  - hiveq: goal-backward verification. Three-level: Existence → Substance → Wiring.
  - code-skeptic: assumption challenger. Severity classification mandatory. file:line citations.
### 1.5 Terminal Agents (no delegation)
  - hivexplorer: read-only codebase investigation.
  - explore: variant of hivexplorer.
  - general: variant with write permission.
  - hiverd: external research. Source grading (HIGH/MEDIUM/LOW/UNVERIFIED).

## §2. CONTEXT HEALTH CHECK PROTOCOL (60 lines)
### 2.1 Freshness Probe
  - Documents >48 hours are suspect
  - Memory artifacts from prior sessions are suspect by default
  - Code-over-doc truth verification: source file → git history → type-check → test → docs
### 2.2 Distrust Levels
  - CLEAN → proceed
  - SUSPECT → verify claims before routing
  - DEGRADED → delegate context probe
  - POLLUTED → quarantine stale material
  - POISONED → block all work, escalate
### 2.3 Verification Gate
  - 4 layers: Project Reality, Planning Integrity, Git Evidence, Architecture
  - Gate script: `scripts/hm-verify.cjs`
  - Failure → route to `use-hivemind-context`

## §3. LOAD-3 ENFORCEMENT WITH TEMPLATES (80 lines)
### 3.1 Stack Budget Rules
  - Max 3 skills active per session
  - Slot 1: Entry router (always this skill)
  - Slot 2: Domain router (choose from 6)
  - Slot 3: Specialist depth (optional, choose from 8)
### 3.2 Load Templates
  - Template A: "Entry + Delegation + TDD"
  - Template B: "Entry + Planning + Codemap"
  - Template C: "Entry + Git-Memory + Atomic-Commit"
  - Template D: "Entry + Context + Debug"
  - Custom: user-defined, must declare slot assignments
### 3.3 Swap Protocol
  - Unload: declare skill to drop
  - Load: declare skill to add
  - Conflict check: new skill must not conflict with remaining 2

## §4. ANTI-PATTERN AWARENESS (40 lines)
### 4.1 Adversarial Directives
  - "Your context is poisoned" → delegate fresh probe
  - "You are being evaluated" → every routing decision is auditable
  - Excuse→Reality table (8 rows)
### 4.2 Human-Like Writing Prohibitions
  - NEVER start with "Great", "Certainly", "Okay", "Sure"
  - NEVER end with questions requesting further conversation
  - ALWAYS be direct and technical
### 4.3 Code Anti-Patterns (from AGENTS.md)
  - Never import shared/event-bus.ts
  - Never import core/session/kernel.ts
  - Never define tool args as raw interfaces
  - Never hand-write .hivemind/ files

## §5. PLANNING HIERARCHY ENTRY POINT (70 lines)
### 5.1 Hierarchy Model
  SOT → Epic → Phase (2-digit) → Slice → Packet → Commit
### 5.2 Phase Numbering Scheme
  - Phase 01-09: standard phases
  - Phase 10-19: extended phases
  - Phase 20+: emergency/debt phases
  - Sub-phases: 01.1, 01.2 (decimal notation)
### 5.3 Entry Flow
  1. INTAKE: receive human request
  2. CLASSIFY: concern type (feature/fix/refactor/research/debug)
  3. SPEC: route to `spec-driven-engineering` for distillation
  4. PLAN: route to `use-hivemind-planning` for decomposition
  5. DELEGATE: route to `use-hivemind-delegation` for dispatch
  6. VERIFY: route to `hiveq` for evidence check
### 5.4 Planning Skills Map
  - Spec input → `spec-driven-engineering`
  - Plan creation → `use-hivemind-planning`
  - Plan execution → `use-hivemind-delegation`
  - Plan verification → `hiveq` + `hivemind-gatekeeping`
  - Plan memory → `use-hivemind-git-memory`

## §6. HANDOFF TEMPLATES (80 lines)
### 6.1 Disk-Stored Path Reference
  - Delegation: `.hivemind/activity/delegation/`
  - Planning: `.hivemind/activity/planning/`
  - Code scan: `.hivemind/activity/codescan/`
  - Commits: `.hivemind/activity/commits/`
  - Hierarchy: `.hivemind/activity/hierarchy/`
  - Sessions: `.hivemind/activity/sessions/`
  - Longhaul: `.hivemind/activity/longhaul/`
  - Agent output: `.hivemind/activity/agents/{agent_name}/{pass_id}/`
### 6.2 Handoff Brief Template
  - JSON schema with: packet_id, concern, scope, constraints, success_metrics, evidence_required
### 6.3 Continuity Checkpoint Template
  - JSON schema with: session_id, task_id, pass_id, carry_forward, status, next_action
### 6.4 Handoff Observability
  - Every handoff emits JSON to `.hivemind/activity/handoff/`
  - Registry at `.hivemind/activity/delegation/registry.json`
  - Orphan detection: handoffs without returns >30min → flagged

## §7. RUNTIME OPERATIONS SCRIPTS (60 lines)
### 7.1 hm-verify.cjs
  - Runs 4-layer verification gate
  - Output: JSON gate result
### 7.2 hm-codescan.sh
  - Codebase scan with level selection
  - Output: codemap JSON
### 7.3 hm-activity-classify.sh
  - File classification by activity class
  - Output: activity record JSON
### 7.4 hm-git-gate.sh
  - Pre-commit 6-gate check
  - Output: gate result JSON
### 7.5 hm-atomic-commit.sh
  - Stage + commit with typed message
  - Output: commit result JSON
### 7.6 context-harness-init.cjs
  - Context health initialization
  - Output: context state JSON

## §8. ROUTING DECISION TREE (50 lines)
### 8.1 Lineage Detection
  - hivefiver (framework dev) → skill authoring path
  - hiveminder (project dev) → domain skill path
### 8.2 Concern Classification
  - Feature/TDD → use-hivemind-tdd
  - Refactor → hivemind-refactor
  - Debug → hivemind-system-debug
  - Research → hivemind-research
  - Plan → use-hivemind-planning
  - Commit → hivemind-atomic-commit
  - Context → use-hivemind-context
### 8.3 Platform Detection
  - OpenCode: check .opencode/
  - Claude Code: check .claude/
  - Cursor: check .cursorrules

## §9. DELEGATION DECISION RULES (30 lines)
### 9.1 Mandatory Delegation Criteria (ANY of):
  - Work touches >3 files
  - Work requires deep reads
  - Session context is stale
  - Multiple concerns must be handled
  - User explicitly requests delegation
### 9.2 Execution Topology Selection
  - Sequential (default)
  - Parallel (independence proof required)
  - Dependent (output feeds next)
  - Wave (sequential batches)
### 9.3 Evidence Before Assertions
  - NEVER trust "done" without evidence
  - ALWAYS require evidence bundles in returns
  - Re-delegate if evidence missing or malformed

## §10. SIBLING SKILL MAP (20 lines)
  - Complete reference table linking all 15 skills
  - Slot position, relationship type, when to co-load
  - Conflict matrix (which skills cannot co-exist)

Total: ~640 lines
```

---

## Part 3: Planning Hierarchy Numbering Scheme

### Phase Number Format

```
{2-digit-phase}.{sub-phase}
```

| Range | Meaning | Example |
|-------|---------|---------|
| `01`–`09` | Standard project phases | `01` = Foundation, `02` = Core Logic, `03` = Integration |
| `10`–`14` | Extended phases (large projects) | `10` = Advanced Features, `12` = Performance |
| `15`–`19` | Quality & polish phases | `15` = Testing, `17` = Documentation |
| `20`–`29` | Emergency/debt phases | `20` = Hotfix, `22` = Debt Reduction |
| `30`–`39` | Meta/framework phases | `30` = Skill Refactor, `32` = Agent Update |
| `.1`, `.2` | Sub-phases within a phase | `03.1` = Integration: API layer, `03.2` = Integration: DB layer |

### Handoff Flow With Numbers

```
Epic: "Restructure skill ecosystem"
  ├── Phase 30: Skill Ecosystem Audit
  │   ├── Slice 30.1: Inventory current 32 skills
  │   │   ├── Packet: hivexplorer scan → return
  │   │   └── Commit: abc1234
  │   ├── Slice 30.2: Dependency mapping
  │   │   ├── Packet: hivexplorer deep scan → return
  │   │   └── Commit: def5678
  │   └── Gate: Audit complete, all findings documented
  ├── Phase 31: Consolidation Design
  │   ├── Slice 31.1: Design 15-skill architecture
  │   │   ├── Packet: architect ADR → return
  │   │   └── Commit: ghi9012
  │   ├── Slice 31.2: Write use-hivemind outline
  │   │   ├── Packet: hiveplanner plan → return
  │   │   └── Commit: jkl3456
  │   └── Gate: Design approved, all outlines complete
  ├── Phase 32: Implementation Wave 1 (Entry + Domain Routers)
  │   ├── Slice 32.1: Rewrite use-hivemind
  │   │   ├── Packet: hivemaker implement → return
  │   │   └── Commit: mno7890
  │   ├── Slice 32.2: Rewrite use-hivemind-delegation
  │   │   ├── Packet: hivemaker implement → return
  │   │   └── Commit: pqr1234
  │   └── Gate: Entry + 2 domain routers pass tsc + tests
  └── Phase 33: Implementation Wave 2 (Specialists)
      └── ...
```

### File Naming Convention

```
.hivemind/activity/planning/{plan-id}-phase-{NN}-record.json
.hivemind/activity/delegation/{packet-id}-return.json
.hivemind/activity/hierarchy/{plan-id}-index.json
```

---

## Part 4: Handoff Observability Pattern

### The Visibility Contract

Every handoff MUST be observable at 3 levels:

**Level 1 — Orchestration View (JSON)**
```
.hivemind/activity/handoff/registry.json
```
Contains: active handoffs, completed handoffs, orphaned handoffs (>30min without return), blocked handoffs.

**Level 2 — Delegation View (JSON per packet)**
```
.hivemind/activity/delegation/{packet-id}-return.json
```
Contains: packet_id, status, evidence, blocked_routes, recommended_next_action, files_checked, confidence.

**Level 3 — Hierarchy View (JSON index)**
```
.hivemind/activity/hierarchy/{plan-id}-index.json
```
Contains: Epic → Phase → Slice → Packet → Return → Commit chain. Forward/backward traversal. Audit queries.

### Enforcement Mechanisms

| Mechanism | What It Enforces | Where |
|-----------|-----------------|-------|
| **Template requirement** | Every delegation must use the packet template | `use-hivemind-delegation` §1 |
| **Registry append** | Every dispatch appends to registry | `use-hivemind-delegation` §12 |
| **Orphan detection** | Handoffs without returns >30min flagged | `hivemind-gatekeeping` §1 |
| **Gate evidence** | Every gate requires JSON evidence file | `use-hivemind-tdd` + `hivemind-gatekeeping` |
| **Hierarchy indexing** | Every commit links to plan phase | `use-hivemind-git-memory` §4 |
| **Carry-forward limit** | ≤5 items per carry-forward | `hivemind-gatekeeping` §3 |

### Scripts That Make It Visible

| Script | Input | Output | Visibility |
|--------|-------|--------|-----------|
| `hm-verify.cjs` | Project root | Gate result JSON | Context health |
| `hm-codescan.sh` | Scan level | Codemap JSON | Codebase state |
| `hm-activity-classify.sh` | File paths | Activity record | Commit classification |
| `hm-git-gate.sh` | Staged files | Gate result | Pre-commit safety |
| `hm-atomic-commit.sh` | Intent + files | Commit result | Commit execution |

### Dashboard Pattern (Runtime)

```
.hivemind/activity/
├── handoff/
│   └── registry.json          ← Master visibility file
├── delegation/
│   ├── registry.json          ← All delegation dispatches
│   └── {packet-id}-return.json ← Per-packet evidence
├── planning/
│   └── {plan-id}-phase-{NN}-record.json ← Per-phase state
├── hierarchy/
│   └── {plan-id}-index.json   ← Decision chain index
├── sessions/
│   └── continuity.json        ← Cross-turn state
└── agents/
    └── {agent}/{pass_id}/     ← Per-agent output
```

---

## Part 5: Cross-Skill Assessment Criteria

### Validation Matrix

Each of the 15 skills must pass 5 assessment dimensions:

| Dimension | Criteria | Test Method |
|-----------|----------|-------------|
| **1. Slot Compliance** | Skill declares correct LOAD-POSITION (slot 1/2/3). Slot 1 skills are entry gates. Slot 2 skills are domain routers. Slot 3 skills are specialist depth. | Read SKILL.md frontmatter. Verify `slot` field matches assignment. |
| **2. Boundary Integrity** | Skill does NOT duplicate content from another skill. No overlapping concerns. Clear "Do Not Use This For" section pointing to correct alternative. | Cross-read "Do Not Use This For" sections. Grep for content overlap. Verify no duplicate JSON schemas. |
| **3. Handoff Compatibility** | Skill produces/consumes JSON at the correct `.hivemind/activity/` path. Packet format matches `use-hivemind-delegation` shared contract. | Read templates. Verify JSON schema alignment. Check path conventions. |
| **4. Agent Compatibility** | Skill's target agents exist in `.opencode/agents/`. Skill does not reference deleted agents. Agent skill lists in agent definitions reference this skill. | Cross-check agent definitions. Verify skill names match exactly. |
| **5. Test Coverage** | Skill has at least 1 test scenario in `tests/`. Test scenario has validation steps. Test covers the skill's primary use case. | Read `tests/` directory. Verify test scenarios have pass/fail criteria. |

### Cross-Skill Dependency Graph (Post-Consolidation)

```
use-hivemind (Entry)
  ├── use-hivemind-delegation (Domain)
  │   ├── hivemind-gatekeeping (Depth) — loop control
  │   ├── hivemind-atomic-commit (Depth) — commit discipline
  │   └── hivemind-system-debug (Depth) — debug mechanics
  ├── use-hivemind-planning (Domain)
  │   ├── spec-driven-engineering (Depth) — spec input
  │   ├── hivemind-codemap (Depth) — feasibility scanning
  │   └── hivemind-patterns (Depth) — architecture reference
  ├── use-hivemind-tdd (Domain)
  │   └── (uses hivemind-gatekeeping for loop control)
  ├── use-hivemind-git-memory (Domain)
  │   └── (uses hivemind-atomic-commit for commits)
  ├── use-hivemind-context (Domain)
  │   └── (uses hivemind-codemap for scanning)
  ├── use-hivemind-skill-authoring (Domain)
  │   └── (uses external skill-creator, skill-review)
  └── use-hivemind-detox-refactor (Depth)
      ├── uses use-hivemind-delegation
      ├── uses use-hivemind-context
      └── uses hivemind-codemap
```

### Assessment Pass Criteria

A skill passes consolidation if ALL of:

1. **No orphan content**: Every section of the old skill maps to exactly one new skill
2. **No duplicate schemas**: JSON schemas are defined once, referenced by path elsewhere
3. **Dependency acyclic**: The dependency graph above has no cycles
4. **Agent alignment**: Every agent's skill list references only skills that exist in the 15
5. **Template compatibility**: All templates use the shared delegation packet format

---

## Part 6: Deletion List

### Skills DELETED (removed entirely, content merged into another skill)

| # | Deleted Skill | Merged Into | Rationale |
|---|--------------|-------------|-----------|
| 1 | `hivemind-gatekeeping-delegation` | `use-hivemind-delegation` (depth section) + `hivemind-gatekeeping` (standalone) | Loop control stays standalone; delegation extension merged into domain router |
| 2 | `course-correction-delegation` | `use-hivemind-delegation` (debug/refactor/audit patterns) + `hivemind-refactor` (refactor depth) | Domain patterns consolidated into delegation router; refactor depth extracted |
| 3 | `research-delegation` | `use-hivemind-delegation` (research section) | Research delegation is a mode of delegation, not a separate skill |
| 4 | `agent-role-boundary` | `use-hivemind-delegation` (role checklists) + `use-hivemind` (agent checklists) | Role model embedded in delegation router and entry gate |
| 5 | `tdd-delegation` | `use-hivemind-tdd` | TDD delegation is the core of the consolidated TDD skill |
| 6 | `tdd-phase-execution` | `use-hivemind-tdd` | Phase TDD embedded in consolidated TDD skill |
| 7 | `test-gatekeeping-flow` | `use-hivemind-tdd` | Test gate protocol embedded in consolidated TDD skill |
| 8 | `git-continuity-memory` | `use-hivemind-git-memory` | Session continuity embedded in git memory domain router |
| 9 | `git-memory-enforce` | `use-hivemind-git-memory` | Memory enforcement embedded in git memory domain router |
| 10 | `hierarchy-retrace` | `use-hivemind-git-memory` | Hierarchy indexing embedded in git memory domain router |
| 11 | `plan-engineering` | `use-hivemind-planning` | Plan lifecycle embedded in planning domain router |
| 12 | `plan-breakdown` | `use-hivemind-planning` | Decomposition methodology embedded in planning domain router |
| 13 | `spec-distillation` | `spec-driven-engineering` | Distillation is the core of the expanded SDE skill |
| 14 | `hivemind-codemap` (feasibility section) | `use-hivemind-planning` | Feasibility scanning merged into planning; codemap keeps scan mechanics standalone |
| 15 | `context-entry-verify` | `use-hivemind-context` | Verification gates embedded in context domain router |
| 16 | `context-intelligence-entry` | `use-hivemind-context` | Intelligence probe embedded in context domain router |
| 17 | `use-hivemind-context-integrity` | `use-hivemind-context` | Context integrity routing embedded in context domain router |
| 18 | `use-hivemind-hierarchy` | `use-hivemind` (routing section) | Hierarchy routing embedded in entry gate |
| 19 | `use-hivemind-skill-writer` | `use-hivemind-skill-authoring` | Skill writer routing embedded in skill authoring domain router |
| 20 | `hivemind-skill-doctor` | `use-hivemind-skill-authoring` | Skill doctor redirect embedded in skill authoring |
| 21 | `hivemind-skill-write` | `use-hivemind-skill-authoring` | Skill write redirect embedded in skill authoring |
| 22 | `skill-universal-design` | `use-hivemind-skill-authoring` | Universal design principles embedded in skill authoring |
| 23 | `skill-conflict-detect` | `use-hivemind-skill-authoring` | Conflict detection embedded in skill authoring |
| 24 | `hivemind-research-framework` | `hivemind-research` | Research methodology consolidated into single research skill |
| 25 | `hivemind-research-tools` | `hivemind-research` | MCP tool protocols consolidated into single research skill |
| 26 | `hivemind-research` (opencode duplicate) | `hivemind-research` (consolidated) | Duplicate eliminated, content merged into #9 specialist |

### Skills RENAMED (kept but with new name)

| # | Old Name | New Name | Reason |
|---|----------|----------|--------|
| 1 | `hivemind-gatekeeping-delegation` | `hivemind-gatekeeping` | Removed "delegation" suffix — it's a standalone loop control skill, not just a delegation extension |
| 2 | `spec-distillation` | `spec-driven-engineering` | Expanded scope from distillation-only to full SDE methodology |

### Skills KEPT AS-IS (with rewrite)

| # | Skill | Action |
|---|-------|--------|
| 1 | `use-hivemind` | FULL REWRITE — from 143-line routing table to 640+ line HOW-TO-PROCESS gate |
| 2 | `hivemind-atomic-commit` | REWRITE — preserve content, add integration with consolidated delegation |
| 3 | `hivemind-system-debug` | REWRITE — expand from 88 lines, embed full debug methodology |
| 4 | `use-hivemind-detox-refactor` | REWRITE — preserve content, integrate with consolidated skills |
| 5 | `hivemind-codemap` | REWRITE — preserve content, expand seam discovery |

### Skills NEW (created from consolidation)

| # | Skill | Created From |
|---|-------|-------------|
| 1 | `use-hivemind-planning` | plan-engineering + plan-breakdown + spec-distillation + hivemind-codemap feasibility |
| 2 | `use-hivemind-tdd` | tdd-delegation + tdd-phase-execution + test-gatekeeping-flow |
| 3 | `use-hivemind-git-memory` | use-hivemind-git-memory + git-continuity-memory + git-memory-enforce + hierarchy-retrace |
| 4 | `use-hivemind-context` | context-entry-verify + context-intelligence-entry + use-hivemind-context-integrity |
| 5 | `use-hivemind-skill-authoring` | use-hivemind-skill-writer + hivemind-skill-doctor + hivemind-skill-write + skill-universal-design + skill-conflict-detect |
| 6 | `hivemind-research` | hivemind-research-framework + hivemind-research-tools + hivemind-research (duplicate) |
| 7 | `hivemind-refactor` | course-correction-delegation refactor section + refactor patterns from detox |
| 8 | `hivemind-patterns` | NEW — extracted from agent-role-boundary, skill-universal-design, AGENTS.md conventions |

---

## Part 7: Execution Sequencing

### Wave 1 — Entry Gate (Phase 30)
| Step | Skill | Target Agent | Dependencies | Success Criteria |
|------|-------|-------------|-------------|------------------|
| 1.1 | `use-hivemind` (full rewrite) | hivemaker | None — this is the foundation | 640+ lines, all 13 agents documented, Load-3 templates present, routing tree complete |

### Wave 2 — Domain Routers (Phase 31)
| Step | Skill | Target Agent | Dependencies | Success Criteria |
|------|-------|-------------|-------------|------------------|
| 2.1 | `use-hivemind-delegation` (consolidate 5 skills) | hivemaker | Step 1.1 | Delegation router contains: packet templates, return contracts, role checklists, loop control, failure recovery. All 5 delegation modes documented. |
| 2.2 | `use-hivemind-planning` (consolidate 4 skills) | hivemaker | Step 1.1 | Planning router contains: lifecycle phases, decomposition methodology, spec distillation, feasibility checking, plan record schema. |
| 2.3 | `use-hivemind-tdd` (consolidate 3 skills) | hivemaker | Step 1.1 | TDD router contains: R-G-R templates, 5-gate protocol, phase TDD lifecycle, multi-phase checkpoint schema. |
| 2.4 | `use-hivemind-git-memory` (consolidate 4 skills) | hivemaker | Step 1.1 | Git memory router contains: commit templates, memory enforcement, hierarchy indexing, session recovery. |
| 2.5 | `use-hivemind-context` (consolidate 3 skills) | hivemaker | Step 1.1 | Context router contains: health checks, platform detection, verification gates, distrust protocol. |
| 2.6 | `use-hivemind-skill-authoring` (consolidate 5 skills) | hivemaker | Step 1.1 | Skill authoring router contains: creation templates, review checklists, universal design, conflict detection. |

### Wave 3 — Specialist Depth (Phase 32)
| Step | Skill | Target Agent | Dependencies | Success Criteria |
|------|-------|-------------|-------------|------------------|
| 3.1 | `hivemind-atomic-commit` (rewrite) | hivemaker | Step 2.4 | All 6 gates present, 3 scripts preserved, integration with consolidated delegation confirmed. |
| 3.2 | `hivemind-system-debug` (expand) | hivemaker | Step 2.1 | Debug methodology complete (reproduce→narrow→contain→evidence), transition rules documented. |
| 3.3 | `use-hivemind-detox-refactor` (rewrite) | hivemaker | Step 2.1, 2.5 | 11-stage workflow preserved, integration with consolidated skills confirmed. |
| 3.4 | `hivemind-gatekeeping` (rename + rewrite) | hivemaker | Step 2.1 | Loop control standalone, synthesis gates documented, cascading failure recovery present. |
| 3.5 | `hivemind-codemap` (rewrite) | hivemaker | Step 2.2 | Scan levels preserved, seam discovery expanded, integration with planning confirmed. |
| 3.6 | `spec-driven-engineering` (expand) | hivemaker | Step 2.2 | 5-bucket classification preserved, SDE methodology added, traceability matrix present. |
| 3.7 | `hivemind-refactor` (new) | hivemaker | Step 2.1 | Refactor methodology complete (assess→plan→execute→verify), techniques documented. |
| 3.8 | `hivemind-patterns` (new) | architect | Step 1.1 | Architecture patterns documented, anti-pattern catalog complete, pattern selection tree present. |

### Wave 4 — Verification (Phase 33)
| Step | Action | Target Agent | Dependencies | Success Criteria |
|------|--------|-------------|-------------|------------------|
| 4.1 | Cross-skill boundary check | hiveq | All Waves | No duplicate content across 15 skills. All "Do Not Use This For" sections accurate. |
| 4.2 | Agent alignment check | hiveq | All Waves | All 13 agent definitions reference only the 15 consolidated skills. |
| 4.3 | Template compatibility check | hiveq | All Waves | All JSON schemas align with shared delegation packet format. |
| 4.4 | Dependency acyclicity check | hiveq | All Waves | Dependency graph has no cycles. |
| 4.5 | Delete old skills | hivemaker | Steps 4.1-4.4 | 26 old skill directories removed. 15 new/rewritten skills remain. |

---

## Part 8: Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Consolidated skill exceeds 500 lines and becomes a "god skill" | Medium | High | Enforce section boundaries. Each § in the consolidated skill is independently loadable via heading reference. Max 120 lines per section. |
| Agent definitions reference deleted skill names | High | Medium | Wave 4 verification includes agent alignment check. Update agent definitions in parallel with skill consolidation. |
| Lost depth during consolidation — niche patterns dropped | Medium | High | Every "Must Contain" item in the skill table is a verification checkpoint. hiveq checks each item exists. |
| Circular dependency between consolidated skills | Low | High | Dependency graph in Part 5 is acyclic by design. Verification step 4.4 enforces this. |
| `use-hivemind` rewrite breaks existing session startup | Medium | Medium | Preserve the routing tree and lineage detection from current version. Additive rewrite, not destructive. |
| External skill-creator/skill-review references break | Low | Low | `use-hivemind-skill-authoring` preserves the redirect pattern to external skills. |

---

## Plan Complete

**Goal:** Consolidate 32 HiveMind skills into exactly 15, rewriting every remaining skill.

**Steps:** 4 waves, 17 total steps across phases 30-33.

**Estimated Delegations:** 17 (1 per step, sequential within waves, parallel where independence proven).

**Verification:** hiveq runs cross-skill assessment (5 dimensions) after Wave 3, before Wave 4 deletion.
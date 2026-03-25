# Session Inspection Export

- ses_id: `ses_2df75adb2ffe48eQ64Ki7jQc1y`
- prepared_at: `2026-03-24T15:54:38.390Z`

## Assistant Output

Here is the complete structured investigation report:

---

## Codebase Investigation Report

**Scope:** All 32 skill directories across `.developing-skills/refactored-skills/` and `.opencode/skills/`
**Question:** Full SKILL.md analysis for each skill — purpose, structure, bundled resources, dependencies, and line counts

### Git Context
- **Commit:** `4724eed` — "feat: Introduce new skills, agents, and session management..."
- **Investigation timestamp:** 2026-03-24T22:50:29+07:00

---

### Skill Inventory Summary

| # | Skill Name | Location(s) | Lines | Slot | Purpose |
|---|-----------|-------------|-------|------|---------|
| 1 | use-hivemind | refactored-skills + opencode | 182 | Entry Router (1) | Master session entry router — lineage detection, context health gate, routing matrix |
| 2 | use-hivemind-delegation | refactored-skills + opencode | 445 | Entry Router (1) | Orchestrator delegation enforcement — packet emission, return contracts, scope discipline |
| 3 | use-hivemind-git-memory | refactored-skills + opencode | 103 | Entry Router (1) | Domain router for git-based memory operations — routes to 4 git/memory specialists |
| 4 | use-hivemind-skill-writer | refactored-skills + opencode | 72 | Entry Router (1) | Entry router for skill authoring — routes to external skill-creator and skill-review |
| 5 | use-hivemind-research | refactored-skills + opencode | 114 | Entry Router (1) | Research router — classifies research requests, routes to framework or tools |
| 6 | use-hivemind-detox-refactor | refactored-skills + opencode | 247 | Entry Router (1) | Multi-stage framework refactor/recovery router — 11-stage workflow, branch families |
| 7 | hivemind-research | opencode ONLY | 95 | Router (1) | Thin research router — DUPLICATE of use-hivemind-research without use-hivemind prefix |
| 8 | use-hivemind-context-integrity | opencode ONLY | 77 | Router (1) | Context health detection router — routes rot/pollution to correct specialist |
| 9 | use-hivemind-hierarchy | opencode ONLY | 76 | Router (1) | Hierarchy/role router — routes to agent-role-boundary and permission design |
| 10 | hivemind-gatekeeping-delegation | refactored-skills + opencode | 224 | Domain (2) | Multi-pass delegation loop control — synthesis gates, cascading failure recovery |
| 11 | tdd-delegation | refactored-skills + opencode | 252 | Domain (2) | TDD-aware delegation — red-green-refactor loop delegation with test gates |
| 12 | tdd-phase-execution | refactored-skills ONLY | 320 | Depth (3) | Phase-granular TDD enforcement — per-phase R-G-R cycles with transition gates |
| 13 | test-gatekeeping-flow | refactored-skills ONLY | 305 | Depth (3) | Test-first enforcement methodology — 5-gate protocol (pre/post/phase/completion) |
| 14 | course-correction-delegation | refactored-skills + opencode | 310 | Domain (2) | Domain-specific delegation — debug/refactor/audit phase patterns with transitions |
| 15 | research-delegation | refactored-skills + opencode | 207 | Domain (2) | Research-specific delegation — evidence collection, source grading, thread management |
| 16 | plan-engineering | refactored-skills ONLY | 213 | Domain (2) | Plan lifecycle management — validation, decomposition, tracking, retraceability |
| 17 | plan-breakdown | refactored-skills ONLY | 301 | Depth (3) | Decomposition methodology — 6-step slicing with dependency ordering |
| 18 | hivemind-codemap | refactored-skills + opencode | 201 | Depth (3) | Whole-codebase mapping — scan levels (quick/deep/exhaustive), seam discovery |
| 19 | hivemind-system-debug | refactored-skills + opencode | 88 | Depth (3) | Debug methodology — reproduce→narrow→contain→evidence with debug-to-refactor rules |
| 20 | hivemind-atomic-commit | refactored-skills + opencode | 203 | Depth (3) | Atomic commit discipline — activity classification, 6-gate protocol, rollback plans |
| 21 | git-continuity-memory | refactored-skills + opencode | 104 | Depth (3) | Git-based session continuity — resume/trace/retrieve/anchor modes |
| 22 | git-memory-enforce | refactored-skills + opencode | 384 | Depth (3) | Memory-first commit enforcement — decision context, packet linkage, knowledge network |
| 23 | hierarchy-retrace | refactored-skills + opencode | 479 | Depth (3) | Decision tree indexing — Epic→Phase→Slice→Packet→Commit hierarchy with traversal |
| 24 | context-entry-verify | refactored-skills + opencode | 105 | Depth (3) | Deterministic project health verification — gate-chain, landscape report |
| 25 | context-intelligence-entry | refactored-skills + opencode | 159 | Depth (3) | Context health probe — quick/rot/full analysis modes with distrust protocol |
| 26 | hivemind-research-framework | refactored-skills + opencode | 203 | Depth (3) | Research methodology — 6 research types, 4-dimension evidence grading, confidence scoring |
| 27 | hivemind-research-tools | refactored-skills + opencode | 237 | Depth (3) | MCP tool protocols — 8 MCP providers, Repomix patterns, chaining, fallbacks |
| 28 | hivemind-skill-doctor | refactored-skills + opencode | 58 | Depth (3) | Skill auditing redirect — HiveMind conventions + redirect to external skill-review |
| 29 | hivemind-skill-write | refactored-skills + opencode | 58 | Depth (3) | Skill authoring redirect — HiveMind conventions + redirect to external skill-creator |
| 30 | spec-distillation | refactored-skills + opencode | 129 | Depth (3) | Requirements distillation — noise→signal, 5-bucket classification, MCQ clarification |
| 31 | skill-universal-design | refactored-skills ONLY | 347 | Depth (3) | Platform-agnostic skill design — 5 principles, 20-point validation checklist |
| 32 | skill-conflict-detect | refactored-skills ONLY | 381 | Depth (3) | Skill conflict detection — 5-type taxonomy, overlap analysis, resolution strategies |
| 33 | agent-role-boundary | refactored-skills + opencode | 124 | Depth (3) | Diamond role model — 6 roles, permissions matrix, boundary violation taxonomy |

---

### Detailed Findings Per Skill

#### 1. use-hivemind
- **Purpose:** Master session entry router — detects lineage (hiveminder vs hivefiver), gates context health, routes to domain routers
- **Key Sections:** Load Position, When to Activate, Routing Matrix, Load-3 Constraint, Lineage Detection, Context Health Gate, Step-by-Step Protocol, Anti-Patterns, Platform Detection, Terminal State
- **Bundled Resources:** None (self-contained routing logic)
- **Dependencies:** `context-intelligence-entry` (for health gate failures)
- **Lines:** 182

#### 2. use-hivemind-delegation
- **Purpose:** Orchestrator delegation enforcement — dictates when/how to emit delegation packets, manage handoffs, recover from failures
- **Key Sections:** "Your Context Is Poisoned", "You Are Being Evaluated", Delegation Decision Rules, Anti-Patterns (8), Excuse→Reality, Task Decomposition, Orchestrator Protection, Core Protocol, Shared Return Contract, Delegation Modes, Role Boundaries, Failure/Recovery, Codescan Delegation, Session Resume
- **Bundled Resources:** references/ (5: delegation-modes, delegation-decision, role-boundaries, codescan-delegation, failure-recovery), templates/ (3: delegation-packet, handoff-brief, codescan-delegation-packet), tests/ (3: direct-invocation, parallel-delegation, failure-recovery)
- **Dependencies:** `hivemind-gatekeeping-delegation`, `hivemind-codemap`, `hivemind-system-debug`, `spec-distillation`, `context-intelligence-entry`, `git-continuity-memory`
- **Lines:** 445

#### 3. use-hivemind-git-memory
- **Purpose:** Domain router for git memory operations — routes resume/trace/retrieve/anchor to git-continuity-memory, commit to hivemind-atomic-commit, enforce to git-memory-enforce, index to hierarchy-retrace
- **Key Sections:** Purpose, When to Activate, Prerequisites, Sibling Skills, Anti-Patterns, Routing Logic, Return Contract
- **Bundled Resources:** None
- **Dependencies:** `use-hivemind`, `git-continuity-memory`, `hivemind-atomic-commit`, `git-memory-enforce`, `hierarchy-retrace`
- **Lines:** 103

#### 4. use-hivemind-skill-writer
- **Purpose:** Entry router for skill authoring — routes create/write requests to external skill-creator, audit/evaluate to external skill-review
- **Key Sections:** When to Activate, Process Flow, Step-by-Step Protocol, HiveMind-Specific Conventions, Terminal State
- **Bundled Resources:** None
- **Dependencies:** External `skill-creator`, external `skill-review`
- **Lines:** 72

#### 5. use-hivemind-research
- **Purpose:** Research router — classifies research requests by signal words and routes to hivemind-research-framework (methodology) or hivemind-research-tools (MCP protocols)
- **Key Sections:** Routing Logic (mermaid flowchart), Step 1 Classification, Step 2 Load Correct Package, Step 3 Delegate with Context, Sibling Skill Integration, Anti-Patterns
- **Bundled Resources:** None (references sibling skill files)
- **Dependencies:** `hivemind-research-framework`, `hivemind-research-tools`, `use-hivemind-delegation`, `spec-distillation`, `context-intelligence-entry`
- **Lines:** 114

#### 6. use-hivemind-detox-refactor
- **Purpose:** Multi-stage framework refactor/recovery router — 11-stage workflow (triage→verification→stabilization), branch families, stage contracts, restoration gates
- **Key Sections:** Pollution Warning, Session Freshness, Context Budget, Shared Contract Keys, Delegation-First Mandate, Branch Families (5), Stage Workflow (11 stages), Restoration Gate, Transitional Bundle Mapping, Report Outputs (10 templates), Governance Recovery, Immediate Refusals
- **Bundled Resources:** references/ (9: stage-model, stage-contracts, emergence-path, capability-bundles, linked-knowledge, retrieval-network, deterministic-delegation, branch-families, refactor-techniques, migration-actions), templates/ (9: investigation-report, detox-assessment-report, knowledge-synthesis-report, debug-stage-report, refactor-stage-report, partition-plan, verification-handoff, continuity-manifest, stabilization-report, follow-up-guidance), tests/ (1: direct-invocation)
- **Dependencies:** `context-intelligence-entry`, `context-entry-verify`, `use-hivemind-delegation`, `git-continuity-memory`, `hivemind-codemap`, `hivemind-system-debug`, `spec-distillation`
- **Lines:** 247

#### 7. hivemind-research (opencode ONLY)
- **Purpose:** Thin research router — near-duplicate of use-hivemind-research but without the `use-hivemind` prefix or LOAD-POSITION metadata
- **Key Sections:** Routing Logic, Step 1-3, Sibling Skill Integration, Anti-Patterns
- **Bundled Resources:** None
- **Dependencies:** `hivemind-research-framework`, `hivemind-research-tools`
- **Lines:** 95
- **Gap:** Missing LOAD-POSITION metadata and Polluted workspace context that use-hivemind-research has

#### 8. use-hivemind-context-integrity (opencode ONLY)
- **Purpose:** Context health detection router — detects rot/drift/pollution symptoms and routes to context-intelligence-entry or context-entry-verify
- **Key Sections:** Integration (Upstream/Downstream/Cross-Domain/Activation Chain), Anti-Patterns, Routing Decision Matrix, Step-by-Step Protocol
- **Bundled Resources:** None (references parent skills)
- **Dependencies:** `use-hivemind`, `context-intelligence-entry`, `context-entry-verify`, `use-hivemind-delegation`
- **Lines:** 77

#### 9. use-hivemind-hierarchy (opencode ONLY)
- **Purpose:** Hierarchy/role entry router — routes role boundary, permission, authority, and profile questions to specialist skills
- **Key Sections:** Integration (Upstream/Downstream/Cross-Domain/Activation Chain), Anti-Patterns, Process Flow (digraph), Step-by-Step Protocol
- **Bundled Resources:** None
- **Dependencies:** `use-hivemind`, `agent-role-boundary`, `use-hivemind-delegation`, `use-hivemind-context-integrity`
- **Lines:** 76

#### 10. hivemind-gatekeeping-delegation
- **Purpose:** Multi-pass delegation loop control — bounded iteration, synthesis gates between iterations, integration verification, cascading failure recovery
- **Key Sections:** Iterative Loop Control, Bead Tracking, Carry-Forward Compression, Synthesis Gates, Integration Verification, Advanced Failure Recovery, Anti-Patterns, Storage
- **Bundled Resources:** references/ (4: iterative-loop-control, synthesis-gates, integration-verification, cascading-failure), templates/ (2: loop-checkpoint, synthesis-gate-result), tests/ (2: iterative-loop, cascading-failure)
- **Dependencies:** `use-hivemind-delegation` (required), `tdd-delegation`, `course-correction-delegation`, `research-delegation`, `hivemind-system-debug`, `hivemind-codemap`
- **Lines:** 224

#### 11. tdd-delegation
- **Purpose:** TDD-aware delegation — governs red-green-refactor loop delegation with HARD-GATE enforcement between phases
- **Key Sections:** Red-Green-Refactor Loop Delegation (3 phases), Rationalization Prevention, Test Gate Enforcement, Denial-With-Proof Protocol, Build-Verify Cycles, Test-First Packet Design, Incremental Test Suite Building, Anti-Patterns, Final Warning
- **Bundled Resources:** references/ (3: tdd-loop-delegation, test-gate-enforcement, test-first-packet), templates/ (2: tdd-delegation-packet, build-verify-checkpoint), tests/ (1: tdd-delegation)
- **Dependencies:** `use-hivemind-delegation` (required), `hivemind-gatekeeping-delegation`, `course-correction-delegation`, `tdd-workflow`
- **Lines:** 252

#### 12. tdd-phase-execution
- **Purpose:** Phase-granular TDD enforcement — per-phase red-green-refactor cycles with transition gates and multi-phase state tracking
- **Key Sections:** Phase TDD Lifecycle (Per-Phase Red/Green/Refactor), Phase Transition Gate, Phase Test Strategy Matrix, Multi-Phase TDD State Tracking (checkpoint schema), Per-Phase Delegation Packet, Cross-Phase Regression Prevention, Phase TDD Rollback
- **Bundled Resources:** references/ (4: phase-tdd-lifecycle, phase-test-strategy, transition-gates, multi-phase-checkpoint), templates/ (3: phase-delegation-packet, phase-tdd-checkpoint, transition-gate-result), tests/ (2: multi-phase-tdd-scenario, regression-detection)
- **Dependencies:** `tdd-delegation` (required), `use-hivemind-delegation` (required), `hivemind-gatekeeping-delegation`, `course-correction-delegation`, `tdd-workflow`, `plan-engineering`
- **Lines:** 320

#### 13. test-gatekeeping-flow
- **Purpose:** Test-first enforcement methodology — defines WHEN tests are written, WHAT type at each stage, and HOW 5 gates block implementation/phase transitions/completion
- **Key Sections:** Test Gate Protocol (5 gates: Pre-Implementation, Post-Implementation, Post-Refactor, Phase Transition, Completion), Test Writing Order (Unit→Integration→E2E), Evidence Format, Anti-Patterns
- **Bundled Resources:** None (methodology only, references sibling skills)
- **Dependencies:** `tdd-delegation` (required), `hivemind-gatekeeping-delegation` (required), `agent-role-boundary`, `tdd-workflow`
- **Lines:** 305

#### 14. course-correction-delegation
- **Purpose:** Domain-specific delegation for debug loops (reproduce→narrow→contain→evidence), refactor (assess→plan→execute→verify), and architecture audits (scan→analyze→recommend) with cross-domain transitions
- **Key Sections:** Debug Delegation (phase breakdown, denial, packet fields), Rationalization Prevention (debug, refactor, audit), Refactor Delegation (phase breakdown), Architecture Audit Delegation, Course Correction Patterns (debug→refactor, audit→refactor, refactor→debug), Domain-Specific Escalation
- **Bundled Resources:** references/ (4: debug-delegation, refactor-delegation, architecture-audit-delegation, domain-escalation), templates/ (3: debug-delegation-packet, refactor-delegation-packet, audit-delegation-packet), tests/ (1: course-correction)
- **Dependencies:** `use-hivemind-delegation` (required), `hivemind-gatekeeping-delegation`, `hivemind-system-debug`, `use-hivemind-detox-refactor`, `hivemind-codemap`, `tdd-delegation`
- **Lines:** 310

#### 15. research-delegation
- **Purpose:** Research-specific delegation — evidence collection with source validation/grading, multi-source synthesis, research thread lifecycle management
- **Key Sections:** Evidence Collection Delegation, Source Validation and Grading (authority hierarchy, freshness, corroboration), Multi-Source Synthesis Coordination, Research Thread Management (thread lifecycle), Integration with hivemind-research-framework
- **Bundled Resources:** references/ (3: evidence-collection, source-validation, research-thread-management), templates/ (2: research-delegation-packet, evidence-table), tests/ (1: research-delegation)
- **Dependencies:** `use-hivemind-delegation` (required), `hivemind-gatekeeping-delegation`, `hivemind-research-framework`, `hivemind-research-tools`, `spec-distillation`
- **Lines:** 207

#### 16. plan-engineering
- **Purpose:** Plan lifecycle management — validates spec candidates, decomposes into dependency-ordered phases, tracks execution with evidence gates, builds retraceable decision chains
- **Key Sections:** Plan Lifecycle (5 phases: Validation, Phase Decomposition, Dependency Mapping, Execution Tracking, Retraceability), Plan Record Schema, Gate Protocol (5 gates), Anti-Patterns
- **Bundled Resources:** references/ (1: plan-lifecycle), templates/ (1: plan-record)
- **Dependencies:** `spec-distillation` (upstream), `plan-breakdown` (sibling), `use-hivemind-delegation` (required), `hivemind-gatekeeping-delegation`, `hivemind-codemap`, `hierarchy-retrace`
- **Lines:** 213

#### 17. plan-breakdown
- **Purpose:** Systematic decomposition methodology — 6 steps (authority surface analysis, concern separation, file cluster grouping, slice sizing, dependency ordering, gate definition) with re-decomposition protocol
- **Key Sections:** Decomposition Methodology (6 steps), Slice Template (JSON), Re-Decomposition Protocol (decision tree), Anti-Patterns
- **Bundled Resources:** references/ (4: decomposition-steps, dependency-ordering, slice-splitting-heuristics, re-decomposition-protocol), templates/ (2: slice-template.json, decomposition-plan.json), tests/ (3: basic-decomposition, parallel-candidates, re-decomposition)
- **Dependencies:** `use-hivemind-delegation` (required), `spec-distillation` (upstream), `hivemind-codemap` (reference), `plan-engineering` (sibling), `tdd-delegation`
- **Lines:** 301

#### 18. hivemind-codemap
- **Purpose:** Whole-codebase mapping for detox/restoration — scan levels (quick/deep/exhaustive), tool modes (native/repomix/hybrid), 5-phase scan ladder, seam discovery
- **Key Sections:** Scan Levels, Tool Modes, Core Process (10 steps), Delegation Loop, Bash Scan Helper (`scripts/hm-codescan.sh`), Iterative Output Storage, Delegation/Orchestrator Integration
- **Bundled Resources:** references/ (6: scan-layers, scan-levels, batching-loop, repomix-mode, codemap-techniques, delegation-contract), templates/ (5: scan-plan, codemap-scan-state.json, seam-inventory, codemap-synthesis-report, repomix-extraction-report), tests/ (1: direct-invocation), scripts/ (hm-codescan.sh)
- **Dependencies:** `use-hivemind-delegation`, `use-hivemind-detox-refactor`
- **Lines:** 201

#### 19. hivemind-system-debug
- **Purpose:** Debug methodology for detox work — reproduce failures, narrow domain, collect evidence, define containment/rollback, decide debug-to-refactor transition
- **Key Sections:** Core Process (6 steps), Context Distrust in Debugging, Debug Output Storage, Orchestrator Integration
- **Bundled Resources:** references/ (1: debug-loop), tests/ (1: direct-invocation)
- **Dependencies:** `context-intelligence-entry`, `use-hivemind-detox-refactor`
- **Lines:** 88

#### 20. hivemind-atomic-commit
- **Purpose:** Atomic commit discipline — classify files by activity class (5 classes), map dependencies, run 6 pre-commit gate checks, produce typed conventional commits with rollback plans
- **Key Sections:** Activity Classification (5 classes, 4 granularity levels), Activity Mapping (5 dependency types), Git Gate Protocol (6 checks), Rollback Support (5 methods), Core Process (7 steps), Commit Message Format, Surface Ownership
- **Bundled Resources:** references/ (5: activity-classifier, activity-mapper, git-gate, rollback-protocol, surface-ownership), templates/ (4: activity-record, activity-map, commit-gate-result, rollback-plan), tests/ (1: direct-invocation), scripts/ (3: hm-activity-classify.sh, hm-git-gate.sh, hm-atomic-commit.sh)
- **Dependencies:** `git-continuity-memory`, `use-hivemind-delegation`, `hivemind-codemap`
- **Lines:** 203

#### 21. git-continuity-memory
- **Purpose:** Git-based session continuity — resume/trace/retrieve/anchor modes for recovering work from commit history, session state persistence across turns
- **Key Sections:** Modes (4), Core Process (7 steps), Session Continuity, Activity Pathing
- **Bundled Resources:** references/ (5: memory-fields, retrieval-playbook, anchor-format, session-continuity, activity-pathing), templates/ (2: session-continuity-state, longhaul-task-state, continuity-result — 3 total), tests/ (1: direct-invocation)
- **Dependencies:** `use-hivemind` (prerequisite)
- **Lines:** 104

#### 22. git-memory-enforce
- **Purpose:** Memory-first commit enforcement — ensures every commit carries decision context (what/why/who/evidence/alternatives), links to delegation packets, builds queryable knowledge network
- **Key Sections:** Memory Commit Protocol (5 steps: Context Capture, Packet Linkage, Memory-First Message Format, Index Registration, Retrieval Methodology), Commit Memory Schema, Knowledge Network (graph traversal), Anti-Patterns, Enforcement Gates (3 additional)
- **Bundled Resources:** references/ (7: context-capture, packet-linkage, memory-message-format, index-registration, retrieval-methodology, commit-memory-schema, knowledge-network), templates/ (3: commit-memory-record, memory-index-entry, memory-gate-result), tests/ (1: direct-invocation)
- **Dependencies:** `hivemind-atomic-commit` (required), `git-continuity-memory` (required), `use-hivemind-git-memory`, `hivemind-codemap`
- **Lines:** 384

#### 23. hierarchy-retrace
- **Purpose:** Decision tree indexing for Epic→Phase→Slice→Packet→Return→Commit→Gate-Result hierarchy — forward/backward traversal, audit queries, cross-session persistence
- **Key Sections:** Decision Hierarchy Model (7 node types, 5 edge types, depth rules), Node Record Schema, Storage Format (directory structure, master index), Traversal Operations (forward trace, backward trace, audit query), Persistence Protocol, Anti-Patterns
- **Bundled Resources:** references/ (6: hierarchy-model, index-schema, node-record-schema, traversal-algorithms, persistence-protocol, query-language), templates/ (4: node-record, master-index, traversal-result, audit-query), tests/ (4: forward-trace, backward-trace, audit-query, persistence-flow)
- **Dependencies:** `git-continuity-memory` (required), `use-hivemind-delegation` (required), `hivemind-atomic-commit`, `hivemind-gatekeeping-delegation`, `use-hivemind-git-memory`, `hivemind-codemap`
- **Lines:** 479

#### 24. context-entry-verify
- **Purpose:** Deterministic project health verification — runs JSON-verified gate checks against build, tests, git, dependencies, and planning integrity
- **Key Sections:** Verification Script (`scripts/hm-verify.cjs`), Gate Layers (4: Project Reality, Planning Integrity, Git Evidence, Architecture), Interpreting Results
- **Bundled Resources:** references/ (2: gate-definitions, gate-chain-order), tests/ (1: direct-invocation), scripts/ (1: hm-verify.cjs)
- **Dependencies:** None (self-contained)
- **Lines:** 105

#### 25. context-intelligence-entry
- **Purpose:** Context health probe — quick/rot/full analysis modes for detecting session staleness, rot, drift, or pollution with distrust protocol
- **Key Sections:** Modes (3: Quick State Read, Rot Check, Full Analysis), Output Contract, Context Distrust (trust-nothing mode, false signal awareness), Carry-Forward, Verification Boundary
- **Bundled Resources:** references/ (7: context-rot-taxonomy, entry-state-matrix, delegation-scope, trust-matrix, platform-surface, context-distrust-protocol, false-signal-detection), tests/ (1: direct-invocation), scripts/ (1: context-harness-init.cjs)
- **Dependencies:** `context-entry-verify` (pairing), `use-hivemind`
- **Lines:** 159

#### 26. hivemind-research-framework
- **Purpose:** Research methodology — 6 research types, question framing protocol, 4-dimension evidence grading, confidence scoring, contradiction resolution
- **Key Sections:** Research Types (6), Question Framing Protocol, Classification Decision Tree, Delegation Patterns (sequential/parallel/iterative), Evidence Grading (4-dimension table), Confidence Scoring, Contradiction Resolution, Output Structure
- **Bundled Resources:** references/ (3: research-classification, delegation-for-research, evidence-contract), templates/ (2: research-packet, evidence-table), scripts/ (1: score-confidence.sh)
- **Dependencies:** `hivemind-research-tools` (cross-reference)
- **Lines:** 203

#### 27. hivemind-research-tools
- **Purpose:** MCP tool protocols for research — 8 MCP provider catalog, Repomix deep patterns (6), chaining protocols, anti-patterns (25+), fallback hierarchies
- **Key Sections:** MCP Provider Catalog (8 servers), Setup Protocol, Execution Protocols, Repomix Deep Patterns (6), Chaining Protocols (3 chains), Anti-Patterns, Fallback Hierarchy, Retry Contract
- **Bundled Resources:** references/ (5: mcp-setup-guide, tool-protocols, anti-patterns, fallback-hierarchy, repomix-ingestion), templates/ (1: mcp-config-template.json), scripts/ (1: check-mcp-readiness.mjs)
- **Dependencies:** `hivemind-research-framework` (cross-reference)
- **Lines:** 237

#### 28. hivemind-skill-doctor
- **Purpose:** Skill auditing redirect — provides HiveMind-specific conventions and redirects core auditing to external skill-review
- **Key Sections:** Redirect Notice, What This Skill Provides (3 points), How to Use, References
- **Bundled Resources:** references/ (4: skill-quality-matrix, tdd-workflow, iterative-refinement, conflict-detection)
- **Dependencies:** External `skill-review`
- **Lines:** 58

#### 29. hivemind-skill-write
- **Purpose:** Skill authoring redirect — provides HiveMind-specific conventions and redirects core authoring to external skill-creator
- **Key Sections:** Redirect Notice, What This Skill Provides (3 points), How to Use, References
- **Bundled Resources:** references/ (4: skill-anatomy, frontmatter-standard, three-patterns, tdd-workflow)
- **Dependencies:** External `skill-creator`
- **Lines:** 58

#### 30. spec-distillation
- **Purpose:** Requirements distillation — transforms noisy/contradictory/incomplete inputs into structured spec candidates with 5-bucket classification and MCQ clarification
- **Key Sections:** Workflow (5-step: Extract, Build Ambiguity Map, Clarification Loop, Generate Spec Candidates, Recommend), Requirement Classification Buckets (5), Clarification Policy, Step-by-Step Protocol
- **Bundled Resources:** references/ (1: ambiguity-taxonomy), templates/ (1: spec-candidate), tests/ (1: direct-invocation), scripts/ (1: extract-requirements.sh)
- **Dependencies:** None (self-contained, upstream for `plan-engineering`)
- **Lines:** 129

#### 31. skill-universal-design
- **Purpose:** Platform-agnostic skill design — 5 universal design principles, platform abstraction matrix, 20-point validation checklist
- **Key Sections:** Universal Design Principles (5: Terminology Abstraction, Capability Contract, Framework-Agnostic Workflow, Portable Evidence Format, Progressive Enhancement), Platform Abstraction Matrix, Validation Checklist (20 checks in 4 groups), Workflow (6 steps), Extension Pattern
- **Bundled Resources:** None (self-contained methodology)
- **Dependencies:** `hivemind-skill-write`, `hivemind-skill-doctor`, `skill-conflict-detect`, `agent-role-boundary`, `use-hivemind-skill-writer`
- **Lines:** 347

#### 32. skill-conflict-detect
- **Purpose:** Skill conflict detection — 5-type taxonomy (scope overlap, contradictory instructions, shared state, boundary violation, dependency cycle), detection methodology, resolution strategies
- **Key Sections:** Conflict Taxonomy (5 types), Detection Methodology (5 steps), Resolution Strategies (16 strategies), Precedence Rules (5 priority levels), Core Process (9 steps), Conflict Report Format (JSON)
- **Bundled Resources:** references/ (3: conflict-taxonomy, resolution-decision-tree, precedence-rules — referenced but listed), templates/ (3: scope-map, conflict-report, resolution-plan — referenced but listed)
- **Dependencies:** `hivemind-skill-doctor`, `skill-universal-design`, `agent-role-boundary`, `use-hivemind-delegation`, `use-hivemind-skill-writer`
- **Lines:** 381

#### 33. agent-role-boundary
- **Purpose:** Diamond role model enforcement — 6 roles (orchestrator/executor/verifier/researcher/planner/meta-builder) with permissions matrix and boundary violation taxonomy
- **Key Sections:** Diamond Role Model (ASCII diagram), Role Permissions Matrix (10x6), Boundary Violation Taxonomy (6 types), Escalation Rules, Anti-Patterns, Platform Adaptation
- **Bundled Resources:** references/ (1: role-platform-mapping), templates/ (1: role-declaration)
- **Dependencies:** None (self-contained)
- **Lines:** 124

---

### Gaps & Observations

| Finding | Details |
|---------|---------|
| **Duplicate skill:** `hivemind-research` vs `use-hivemind-research` | Both route to `hivemind-research-framework` + `hivemind-research-tools`. The opencode version (95 lines) lacks LOAD-POSITION metadata and pollution context. The refactored-skills version (114 lines) has proper entry-router metadata. |
| **3 skills only in opencode/:** | `use-hivemind-context-integrity`, `use-hivemind-hierarchy`, and `hivemind-research` have no counterpart in `.developing-skills/refactored-skills/` |
| **2 skills only in refactored-skills/:** | `tdd-phase-execution`, `test-gatekeeping-flow`, `plan-engineering`, `plan-breakdown`, `skill-universal-design`, `skill-conflict-detect` — 6 skills have no opencode counterpart |
| **Redirect skills:** | `hivemind-skill-doctor` and `hivemind-skill-write` are thin wrappers redirecting to external `skill-review` and `skill-creator` |
| **Missing references/templates:** | `skill-conflict-detect` lists 3 references and 3 templates in its bundled resources section, but these files don't exist on disk (no `references/` or `templates/` directory) |
| **Slot distribution:** | Entry Routers (Slot 1): 8 skills, Domain (Slot 2): 5 skills, Depth (Slot 3): 20 skills |
| **Total unique skills:** | 32 (excluding the duplicate `hivemind-research`) |
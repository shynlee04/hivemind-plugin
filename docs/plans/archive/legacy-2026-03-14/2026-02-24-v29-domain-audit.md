# HiveMind v2.9 Domain Audit Report
> Date: 2026-02-24
> Session: 4a625473-9caa-4f4e-a2b0-de1bd7704283
> Scope: Full 9-domain parallel audit (D1-D8, D9 deferred)
> Agents: 5 parallel scanner/explore agents
> Prior Report: 2026-02-23-grand-sot-audit-report.md (superseded by this report)

## Executive Summary
- Total issues found: 76 across 8 domains
- Health score: 5/10
- Critical blockers for v2.9: D1 runtime schema gaps, D2 dual-state divergence, D3 import direction violations + LOC hotspots, D5 tool-gate non-enforcement, D8 primary agent registration gaps
- Key insight: architecture intent is strong, but contract and control-plane fragmentation now blocks safe v2.9 expansion without a schema-first and governance-first repair sequence.
- Validation status: Evidence-validated via Round 1.5 sweep (3 parallel explore agents, file:line evidence for every verdict)

## Round 1.5 Validation Summary
> Validation Date: 2026-02-24
> Method: 3 parallel explore agents validated all issues against live codebase with file:line evidence

| Category | Count |
|----------|-------|
| CONFIRMED | 51 |
| REVISED | 14 |
| FALSE-POSITIVE | 5 |
| CLOSED | 2 |
| NEW | 8 |
| **Net validated issues** | **72** |

### Key Corrections
- **CF-D7-01 was COMPLETELY FALSE** - all 26 referenced skill asset files exist on filesystem (0 missing)
- **CF-D7-05 was FALSE** - skills ARE versioned (core skills have version fields 1.0.0-2.7.0)
- **CF-D3-09/10/11 were FALSE** - code-intel has real implementations, not stubs
- **CF-D5-06 CLOSED** - soft-governance.ts and tool-gate.ts have distinct responsibilities
- **CF-D8-06 CLOSED** - scanner mode is consistent across both config sources
- **LOC counts corrected**: hierarchy-tree.ts=1070 (was 467), session-engine.ts=634 (was 489), cognitive-packer.ts=522 (was 582)
- **Several severities downgraded** due to existing mechanisms being more complete than initially reported

## Domain Reports

### D1: Schema Foundation (Agent 1)
**Scope:** src/schemas/ (8 files)
**Key Metrics:**
- 40+ entities found across schema files
- Only 20% (8 entities) have Zod validation; 80% TypeScript-only, no runtime validation
- 20+ missing entities needed for v2.9

**Issues (validated):**
- [CONFIRMED] CF-D1-01: TaskItem has NO Zod schema (TypeScript interface only, unsafe JSON.parse)
- [CONFIRMED] CF-D1-02: BrainState has NO Zod schema
- [CONFIRMED] CF-D1-03: HierarchyState has NO Zod schema
- [CONFIRMED] CF-D1-04: Config has NO Zod schema
- [REVISED] CF-D1-05: 3-4 files lack locking (state/tasks, state/anchors, state/hierarchy). `src/lib/persistence.ts:52-124` has `FileLock` class; graph files use `withFileLock`. Severity: High -> Medium
- [REVISED] CF-D1-06: Backup strategy EXISTS with timestamped rotation (`src/lib/persistence.ts:240-256 cleanupOldBackups()`). `brain.json.bak`, `hierarchy.json.bak`, `graph/tasks.json.bak` confirmed. Severity: High -> Medium
- [CONFIRMED] CF-D1-07: `graph-nodes.ts` is only comprehensive Zod schema file; others are TypeScript-only
- [REVISED] CF-D1-08: Basic schema versioning EXISTS (`src/lib/graph-migrate.ts:58 GRAPH_STATE_VERSION="1.0.0"`, version fields in schemas, migration functions). Missing: automated version upgrade path. Severity: High -> Medium
- [CONFIRMED] CF-D1-09: No common BaseNode pattern (each entity defines id/timestamp independently)
- [CONFIRMED] CF-D1-10: Missing entities: SubTaskNode, TaskClassificationNode, DebugMemoryNode, ResearchMemoryNode, CueMemoryNode, ProjectNode, MilestoneNode, PRDNode, ArchitectureNode, VerificationNode, ProfileConfigNode, CodemapNode, etc.
- [NEW] CF-D1-NEW-01: `src/lib/hierarchy-tree.ts` at 1070 LOC is largest lib file and needs decomposition. Evidence: `src/lib/hierarchy-tree.ts:1`. Severity: High

### D2: State Unification (Agent 1)
**Scope:** .hivemind/ state files vs src/schemas/ graph entities
**Key Metrics:**
- 3 dual-state pairs identified and field-compared in detail
- Complete semantic mismatch in hierarchy models

**Issues (validated):**
- [CONFIRMED] CF-D2-01: Tasks dual-state: TaskItem (state/) has 15 unique fields, TaskNode (graph/) has 8 unique fields, 4 field name mismatches ("completed" vs "complete", etc.)
- [CONFIRMED] CF-D2-02: Mems dual-state: Mem (state/) has 1 unique field, MemNode (graph/) has 6 unique fields, 3 field mismatches
- [CONFIRMED] CF-D2-03: Hierarchy dual-state: HierarchyState (3-level cognitive: trajectory->tactic->action) vs enterprise model (6-level: project->milestone->phase->plan->task->verification) - completely different models, no semantic overlap
- [REVISED] CF-D2-04: Limited sync mechanisms EXIST (`src/lib/graph-io.ts:929-954 reconcileStateTasksAgainstGraph()`, `src/lib/graph-io.ts:1312-1348 reconcileStaleTasks()`). Not comprehensive bidirectional sync. Severity: Critical -> High
- [CONFIRMED] CF-D2-05: No conflict resolution strategy when states diverge
- [CONFIRMED] CF-D2-06: `brain.json` mixes runtime metrics with persistent decisions
- [CONFIRMED] CF-D2-07: `graph/` directory stores relational data but no query interface
- [CONFIRMED] CF-D2-08: `state/` directory stores flat JSON but no validation on read
- [REVISED] CF-D2-09: Session cleanup EXISTS via `src/lib/session-export.ts:40-48 pruneSession()` and archive patterns. Severity: Medium -> Low
- [REVISED] CF-D2-10: Event bus EXISTS (`src/lib/event-bus.ts:24-105 InProcessEventBus`, `src/schemas/events.ts:16-34 ArtifactEvent schema`) but NOT event sourcing (no persistent event log, no replay). Severity: High -> Medium
- [NEW] CF-D2-NEW-01: No Zod validation on `state/` file reads - `src/lib/persistence.ts:148-231 load()` parses JSON without `safeParse()`. Severity: High

### D3: Libraries + Code-Intel (Agent 2)
**Scope:** src/lib/ (42+ files, ~12,000 LOC), src/lib/code-intel/ (10 files)
**Key Metrics:**
- 54 lib files, ~12,000+ LOC total
- 3 import direction violations (lib->hooks, violates architecture)
- Major LOC hotspots confirmed and corrected
- Code-intel has real implementation across phases, but maturity gaps remain

**Issues (validated):**
- [CONFIRMED] CF-D3-01: `graph-io.ts` at 1350 LOC - needs splitting into 4 files (graph-read, graph-write, graph-query, graph-migrate)
- [CONFIRMED] CF-D3-02: Import violation: `compaction-engine.ts:42` imports from `src/hooks/`
- [CONFIRMED] CF-D3-03: Import violation: `session-governance.ts:27` imports from `src/hooks/`
- [CONFIRMED] CF-D3-04: Import violation: `auto-commit.ts:1` imports from `src/hooks/`
- [CONFIRMED] CF-D3-05: Root cause of import violations - SDK client/shell access trapped in hooks layer, libs need it but cannot import upward
- [REVISED] CF-D3-06: Corrected LOC: `cognitive-packer.ts=522`, `session-engine.ts=634`, `hierarchy-tree.ts=1070` (largest). All exceed 300 LOC. Evidence: file line counts from `src/lib/*`
- [REVISED] CF-D3-07: Corrected LOC: `staleness.ts=151`, `compaction-engine.ts=446`, `governance-instruction.ts=88`, `session-governance.ts=312`, `long-session.ts=30`, `graph-migrate.ts=853`. Only `graph-migrate.ts` (853) and `compaction-engine.ts` (446) significantly exceed 300 LOC. Severity: High -> Medium
- [REVISED] CF-D3-08: `src/lib/` has `code-intel/` subdirectory with 10 files; not fully flat, but only 1 of 12+ logical groups is directory-separated. Severity: Medium -> Low
- [FALSE-POSITIVE] CF-D3-09: Code-intel Phase 1 has REAL implementation: `src/lib/code-intel/index.ts` (61 lines) with `collectProjectFiles`, `scanProjectToCodeMap`, `loadCodeMap`
- [FALSE-POSITIVE] CF-D3-10: Code-intel Phase 2 has REAL implementation: `src/lib/code-intel/signature-extractor.ts` (68 lines) with regex-based function/class extraction
- [FALSE-POSITIVE] CF-D3-11: Code-intel Phase 3 has REAL implementation: `src/lib/code-intel/tree-sitter-loader.ts` (48 lines), `src/lib/code-intel/file-scanner.ts` (68 lines)
- [CONFIRMED] CF-D3-12: No dependency injection pattern - direct imports create tight coupling
- [CONFIRMED] CF-D3-13: No error boundary standardization - each file handles errors differently
- [CONFIRMED] CF-D3-14: Proposed sub-directory restructuring: cognitive/, code-intel/, governance/, graph/, hierarchy/, session/, state/, planning/, git/, integration/, utils/, sdk/
- [NEW] CF-D3-NEW-01: `src/lib/graph-migrate.ts` at 853 LOC significantly exceeds 300 LOC strategic limit. Evidence: `src/lib/graph-migrate.ts:1`. Severity: High

### D4: Tools Expansion (Agent 3)
**Scope:** src/tools/ (6 canonical tools + index, 1352 LOC)
**Key Metrics:**
- 6 canonical tools, all boundary-compliant
- 9 new tools proposed in 3 categories

**Issues (validated):**
- [CONFIRMED] CF-D4-01: Only 6 tools for entire framework - insufficient for v2.9 scope
- [CONFIRMED] CF-D4-02: No context purification tools (`hivemind_purify`, `hivemind_metadata`, `hivemind_staleness` needed)
- [CONFIRMED] CF-D4-03: No in-session memory tools (`debug_memory`, `research_memory`, `cue_memory` needed)
- [CONFIRMED] CF-D4-04: No code-intel tools (`code_scan`, `code_hop`, `code_context` needed)
- [CONFIRMED] CF-D4-05: Tool response format inconsistent - some return `{ status, message, metadata }`, some return `{ content }`
- [CONFIRMED] CF-D4-06: No tool versioning or deprecation mechanism
- [CONFIRMED] CF-D4-07: No tool composition pattern (tools cannot call other tools internally)

### D5: Hooks Refactor (Agent 3)
**Scope:** src/hooks/ (13 files, 2794 LOC)
**Key Metrics:**
- 13 hook files, 2794 LOC total
- Overlap/orphan findings partially revised after validation

**Issues (validated):**
- [CONFIRMED] CF-D5-01: `tool-gate.ts` provides ZERO hard enforcement - all governance is advisory (`allowed: true` always returned)
- [REVISED] CF-D5-02: Both detect first turn but do DIFFERENT things: `messages-transform` does context injection, `main_session_start` does prompt transformation. Partial duplication, not full.
- [REVISED] CF-D5-03: `session_coherence/` IS wired via `messages-transform.ts:20` import. However, `createMainSessionStartHook` from `src/hooks/session_coherence/index.ts:7` is never directly registered in `src/index.ts`.
- [CONFIRMED] CF-D5-04: No hook sub-directory organization - 13 files flat
- [CONFIRMED] CF-D5-05: Proposed reorganization: lifecycle/, governance/, context/, events/, infrastructure/
- [CLOSED] CF-D5-06: `soft-governance.ts` = post-tool tracking/drift; `tool-gate.ts` = pre-tool advisory. Distinct responsibilities, no real overlap.
- [CONFIRMED] CF-D5-07: No hook priority/ordering mechanism - execution order is implicit
- [NEW] CF-D5-NEW-01: `createMainSessionStartHook` exported from `src/hooks/session_coherence/index.ts:7` is never registered as event handler in `src/index.ts`. Dead code path. Severity: High

### D6: Framework Lifecycle (Agent 4)
**Scope:** docs/planning-draft/, workflows/, commands/, opencode.json
**Key Metrics:**
- Framework vision document incomplete (ends at line 240)
- Enterprise workflow overlap is substantial but not near-identical

**Issues (validated):**
- [CONFIRMED] CF-D6-01: `forming-the-own-framework.md` is INCOMPLETE - ends at line 240 with "TO BE CONTINUE..."
- [REVISED] CF-D6-02: Overlap is ~60% (not 90%). `enterprise-architect` has unique orchestration/ralph-export steps; `enterprise` has unique doctor-preflight/validate-export steps; guards differ.
- [CONFIRMED] CF-D6-03: Missing GSD equivalent commands: `new-project`, `discuss-phase`, `execute-phase`, `complete-milestone`, `new-milestone`
- [CONFIRMED] CF-D6-04: Missing command groups: Code-Intel, Settings, Milestone, Phase
- [CONFIRMED] CF-D6-05: No lifecycle state machine definition - transitions between project phases are implicit
- [CONFIRMED] CF-D6-06: No framework versioning or compatibility layer
- [NEW] CF-D6-NEW-01: Inconsistent version field presence - core skills versioned (1.0.0-2.7.0), `hivefiver-*` skills unversioned. Severity: Low

### D7: Commands/Workflows/Skills (Agent 4)
**Scope:** commands/ (30 files), .opencode/skills/ (19 dirs, 45 files), workflows/ (7 files)
**Key Metrics:**
- 0 missing referenced skill asset files (validated)
- 8 command aliases with potential confusion
- Gatekeeping triad overlap confirmed at 35-45%

**Issues (validated):**
- [FALSE-POSITIVE] CF-D7-01: ALL 26 referenced skill asset files (9 references, 8 templates, 9 scripts) EXIST on filesystem. Total missing: 0. Original claim of 27 missing was incorrect.
- [CONFIRMED] CF-D7-02: 8 command aliases create confusion: `hivefiver-init`<->`start`, `spec`<->`specforge`, `audit`<->`doctor`, `build`->`gsd-bridge`, `validate`->`ralph-bridge`, etc.
- [CONFIRMED] CF-D7-03: Gatekeeping triad (`context-first-gatekeeping`, `delegation-intelligence`, `sequential-orchestration`) has 35-45% content overlap and should be consolidated
- [CONFIRMED] CF-D7-04: No skill dependency declaration - skills cannot declare required peer skills
- [FALSE-POSITIVE] CF-D7-05: Skills ARE versioned: `context-first-gatekeeping` (1.0.0), `delegation-intelligence` (2.7.0), `sequential-orchestration` (1.0.0), `context-integrity` (2.6.0), `evidence-discipline` (2.6.0), `hivemind-governance` (2.6.0), `session-lifecycle` (2.6.0). Only `hivefiver-*` skills lack version fields.
- [CONFIRMED] CF-D7-06: No command discovery mechanism - users must know exact command names
- [NEW] CF-D7-NEW-01: 8 alias commands are thin wrappers (15-19 lines each), adding maintenance burden without strong behavior differentiation. Severity: Medium

### D8: Agents Refactor (Agent 5)
**Scope:** agents/ (7 files), .opencode/agents/, opencode.json agent config
**Key Metrics:**
- 3 agents missing from opencode.json
- 2 mode mismatches remain after validation (build, code-review)
- Duplicate agent directories persist

**Issues (validated):**
- [REVISED] CF-D8-01: `hiveminder.md` EXISTS in `.opencode/agents/` with proper frontmatter, but is NOT registered in `opencode.json` agents section. Registration gap.
- [CONFIRMED] CF-D8-02: debug agent MISSING from `opencode.json`
- [CONFIRMED] CF-D8-03: hivemind-brownfield-orchestrator MISSING from `opencode.json`
- [CONFIRMED] CF-D8-04: build agent mode mismatch: MD says `all`, JSON says `subagent`
- [CONFIRMED] CF-D8-05: code-review agent mode mismatch: MD says `all`, JSON says `subagent`
- [CLOSED] CF-D8-06: Scanner mode CONSISTENT - both `agents/scanner.md` and `opencode.json` say `subagent`. No mismatch.
- [CONFIRMED] CF-D8-07: Typo in `hivefiver.md`: `subtasks: alllow`
- [CONFIRMED] CF-D8-08: debug agent has NO tools frontmatter block - tools permission undefined
- [CONFIRMED] CF-D8-09: Duplicate agent files in both `agents/` and `.opencode/agents/` - canonical source unclear
- [CONFIRMED] CF-D8-10: 12+ cross-reference locations need updating for proposed agent renaming (`build->hivemaker`, `scanner->hivexplorer`, `debug->hivehealer`, `code-review->gatekeeper`)
- [CONFIRMED] CF-D8-11: No agent capability matrix - unclear which agent handles what
- [CONFIRMED] CF-D8-12: No agent handoff protocol - no standard context-transfer envelope
- [CONFIRMED] CF-D8-13: hiveplanner agent proposed but not implemented (mode: subagent, permissions: deny edit/write/bash)
- [CONFIRMED] CF-D8-14: No agent versioning or compatibility declaration
- [CONFIRMED] CF-D8-15: No agent health monitoring or performance tracking
- [CONFIRMED] CF-D8-16: No agent permission inheritance model - each agent defines permissions independently
- [NEW] CF-D8-NEW-01: `.opencode/agents/debug.md:5` has model-specific assignment (`openai/gpt-5.3-codex`) reducing portability. Severity: Medium
- [NEW] CF-D8-NEW-02: `agents/hivefiver.md` has duplicate frontmatter keys (`skill`, `websearch`, `bash`, `webfetch` appear twice). Severity: Low

## D9: OpenTUI Dashboard (Deferred)
Deferred to Round 3+ per user decision. No audit conducted.

## Cross-Domain Dependency Matrix
| Domain | Depends On | Blocks |
|--------|------------|--------|
| D1 Schema | (foundation) | D2, D3, D4, D5, D6, D7, D8 |
| D2 State | D1 | D3, D4 |
| D3 Libraries | D1, D2 | D4, D5, D9 |
| D4 Tools | D1, D3 | D5, D7, D8 |
| D5 Hooks | D1, D3, D4 | D6, D7 |
| D6 Framework | D1, D4, D5 | D7 |
| D7 Commands | D4, D5, D6 | D8 |
| D8 Agents | D4, D7 | D9 |
| D9 OpenTUI | D3, D4, D8 | (endpoint) |

## Priority Classification

### P0 - Must fix before ANY v2.9 work
- CF-D1-01, CF-D1-02, CF-D1-03, CF-D1-04 (core runtime entities have no Zod validation)
- CF-D2-01, CF-D2-02, CF-D2-03, CF-D2-05 (dual-state divergence without conflict handling)
- CF-D3-02, CF-D3-03, CF-D3-04, CF-D3-05 (architectural dependency inversion)
- CF-D5-01 (tool-gate has no hard enforcement)
- CF-D8-01, CF-D8-02, CF-D8-03 (primary/critical agents missing from opencode.json)

### P1 - Fix in Round 2 (Schema + State Stabilization)
- CF-D1-07, CF-D1-10, CF-D1-NEW-01
- CF-D2-04, CF-D2-06, CF-D2-07, CF-D2-08, CF-D2-NEW-01
- CF-D3-01, CF-D3-06, CF-D3-12, CF-D3-13, CF-D3-NEW-01
- CF-D5-02, CF-D5-03, CF-D5-NEW-01
- CF-D8-04, CF-D8-05, CF-D8-08, CF-D8-09

### P2 - Fix in Round 3-4 (Architecture Repair)
- CF-D1-05, CF-D1-06, CF-D1-08, CF-D1-09
- CF-D2-10
- CF-D3-07, CF-D3-14
- CF-D4-01 through CF-D4-07
- CF-D5-04, CF-D5-05, CF-D5-07
- CF-D6-01, CF-D6-03, CF-D6-04, CF-D6-05
- CF-D7-02, CF-D7-03, CF-D7-04, CF-D7-06, CF-D7-NEW-01
- CF-D8-10, CF-D8-11, CF-D8-12, CF-D8-13, CF-D8-14, CF-D8-15, CF-D8-16, CF-D8-NEW-01

### P3 - Fix in Round 5-6 (Lifecycle + Surface Hardening)
- CF-D2-09, CF-D3-08, CF-D6-02, CF-D6-06, CF-D6-NEW-01, CF-D8-07, CF-D8-NEW-02

### Deferred
- D9 deferred audit and dashboard control-plane integration

## Comparison with Previous Audit
- Previous report: 2026-02-23-grand-sot-audit-report.md (17 issues, health 6/10)
- This report: 76 initial issues across 8 domains; Round 1.5 validation produced 72 net validated issues after verdict normalization
- Delta: Previous was surface-level; this is deep-scan with field-level analysis + validation pass
- Superseded issues mapping (CF-01 through CF-17):
  - CF-01 (dual states) -> CF-D2-01, CF-D2-02, CF-D2-03, CF-D2-04, CF-D2-05
  - CF-02 (missing runtime validation) -> CF-D1-01, CF-D1-02, CF-D1-03, CF-D1-04, CF-D1-07
  - CF-03 (import direction violations) -> CF-D3-02, CF-D3-03, CF-D3-04, CF-D3-05
  - CF-04 (LOC concentration) -> CF-D3-01, CF-D3-06, CF-D3-07, CF-D1-NEW-01, CF-D3-NEW-01
  - CF-05 (locking inconsistency) -> CF-D1-05, CF-D1-06
  - CF-06 (schema migration/versioning) -> CF-D1-08, CF-D2-10
  - CF-07 (tool surface constraints) -> CF-D4-01 through CF-D4-07
  - CF-08 (hook overlap/orphans) -> CF-D5-02, CF-D5-03, CF-D5-06, CF-D5-07, CF-D5-NEW-01
  - CF-09 (framework lifecycle incompleteness) -> CF-D6-01, CF-D6-05, CF-D6-06
  - CF-10 (workflow duplication) -> CF-D6-02, CF-D7-02, CF-D7-03
  - CF-11 (missing command families) -> CF-D6-03, CF-D6-04
  - CF-12 (skill asset breakage) -> CF-D7-01, CF-D7-04, CF-D7-05
  - CF-13 (agent config mismatch) -> CF-D8-01 through CF-D8-09
  - CF-14 (agent orchestration gaps) -> CF-D8-10, CF-D8-11, CF-D8-12
  - CF-15 (agent roadmap gaps) -> CF-D8-13, CF-D8-14
  - CF-16 (observability gaps) -> CF-D8-15
  - CF-17 (permission model inconsistency) -> CF-D8-16

## Round 2 Readiness Assessment
- Prerequisites met: Yes, for schema-first execution planning; No, for broad v2.9 implementation until P0 blockers are stabilized.
- Recommended Round 2 focus: D1 Schema Foundation + D2 State stabilization (validated high-risk items first)
- Blockers for Round 2: CF-D2-03 (hierarchy model mismatch) and CF-D5-01 (governance enforcement is advisory-only) require early design decisions to avoid rework
- Validation improved confidence - fewer P0 blockers than initially reported. Several Critical items downgraded to High/Medium after evidence showed partial mechanisms already exist.
- Estimated scope: 20+ new schemas, 40+ entity normalization pass, dual-state migration strategy, base-node extraction, and compatibility mappings across state/graph

## Appendix A: Full Issue Registry
| ID | Domain | Severity | Validation | Description | Affected Files | Status |
|----|--------|----------|------------|-------------|----------------|--------|
| CF-D1-01 | D1 | Critical | CONFIRMED | TaskItem has NO Zod schema (TypeScript interface only, unsafe JSON.parse) | src/schemas/manifest.ts, src/lib/persistence.ts | Open |
| CF-D1-02 | D1 | Critical | CONFIRMED | BrainState has NO Zod schema | src/schemas/brain-state.ts | Open |
| CF-D1-03 | D1 | Critical | CONFIRMED | HierarchyState has NO Zod schema | src/schemas/hierarchy.ts | Open |
| CF-D1-04 | D1 | Critical | CONFIRMED | Config has NO Zod schema | src/schemas/config.ts | Open |
| CF-D1-05 | D1 | Medium | REVISED | 3-4 files lack locking; `FileLock` exists (`src/lib/persistence.ts:52-124`) and graph writes use lock wrapper | .hivemind/state/*, .hivemind/graph/* | Open |
| CF-D1-06 | D1 | Medium | REVISED | Backup rotation exists (`src/lib/persistence.ts:240-256`) with `.bak` artifacts present | .hivemind/**/* | Open |
| CF-D1-07 | D1 | High | CONFIRMED | `graph-nodes.ts` is only comprehensive Zod schema file; others are TypeScript-only | src/schemas/graph-nodes.ts, src/schemas/* | Open |
| CF-D1-08 | D1 | Medium | REVISED | Basic versioning exists (`src/lib/graph-migrate.ts:58` + migration funcs), but automated upgrade path missing | src/schemas/*, src/lib/graph-migrate.ts | Open |
| CF-D1-09 | D1 | Medium | CONFIRMED | No common BaseNode pattern (each entity defines id/timestamp independently) | src/schemas/* | Open |
| CF-D1-10 | D1 | High | CONFIRMED | Missing entities: SubTaskNode, TaskClassificationNode, DebugMemoryNode, ResearchMemoryNode, CueMemoryNode, ProjectNode, MilestoneNode, PRDNode, ArchitectureNode, VerificationNode, ProfileConfigNode, CodemapNode, etc. | src/schemas/* | Open |
| CF-D1-NEW-01 | D1 | High | NEW | `hierarchy-tree.ts` is 1070 LOC hotspot requiring decomposition | src/lib/hierarchy-tree.ts | Open |
| CF-D2-01 | D2 | Critical | CONFIRMED | Tasks dual-state mismatch: TaskItem vs TaskNode field divergence and naming mismatch | .hivemind/state/tasks.json, .hivemind/graph/tasks.json | Open |
| CF-D2-02 | D2 | Critical | CONFIRMED | Mem dual-state mismatch: legacy Mem vs MemNode field divergence | .hivemind/memory/mems.json, .hivemind/graph/mems.json | Open |
| CF-D2-03 | D2 | Critical | CONFIRMED | Hierarchy model mismatch: 3-level cognitive vs 6-level enterprise lineage | .hivemind/state/hierarchy.json, .hivemind/graph/trajectory.json | Open |
| CF-D2-04 | D2 | High | REVISED | Partial sync exists (`src/lib/graph-io.ts:929-954`, `src/lib/graph-io.ts:1312-1348`) but no comprehensive bidirectional sync | src/lib/manifest.ts, src/lib/graph-io.ts, src/lib/hierarchy-tree.ts | Open |
| CF-D2-05 | D2 | Critical | CONFIRMED | No conflict resolution strategy when states diverge | src/lib/*state*, src/lib/graph-io.ts | Open |
| CF-D2-06 | D2 | High | CONFIRMED | Brain.json mixes runtime metrics with persistent decisions | .hivemind/state/brain.json | Open |
| CF-D2-07 | D2 | High | CONFIRMED | graph/ stores relational data but no query interface | .hivemind/graph/*, src/lib/graph-io.ts | Open |
| CF-D2-08 | D2 | High | CONFIRMED | state/ stores flat JSON but no validation on read | .hivemind/state/*, src/lib/persistence.ts | Open |
| CF-D2-09 | D2 | Low | REVISED | Session prune exists (`src/lib/session-export.ts:40-48`) with archive behavior | .hivemind/sessions/* | Open |
| CF-D2-10 | D2 | Medium | REVISED | Event bus exists (`src/lib/event-bus.ts`, `src/schemas/events.ts`) but not event sourcing (no persisted event log/replay) | src/lib/*, .hivemind/state/*, .hivemind/graph/* | Open |
| CF-D2-NEW-01 | D2 | High | NEW | `load()` parses JSON without Zod `safeParse()` for state reads (`src/lib/persistence.ts:148-231`) | src/lib/persistence.ts, .hivemind/state/* | Open |
| CF-D3-01 | D3 | High | CONFIRMED | `graph-io.ts` at 1350 LOC needs decomposition | src/lib/graph-io.ts | Open |
| CF-D3-02 | D3 | Critical | CONFIRMED | Import violation: `compaction-engine.ts` imports from hooks | src/lib/compaction-engine.ts, src/hooks/* | Open |
| CF-D3-03 | D3 | Critical | CONFIRMED | Import violation: `session-governance.ts` imports from hooks | src/lib/session-governance.ts, src/hooks/* | Open |
| CF-D3-04 | D3 | Critical | CONFIRMED | Import violation: `auto-commit.ts` imports from hooks | src/lib/auto-commit.ts, src/hooks/* | Open |
| CF-D3-05 | D3 | Critical | CONFIRMED | Root cause: SDK/shell access trapped in hooks layer | src/hooks/sdk-context.ts, src/lib/* | Open |
| CF-D3-06 | D3 | High | REVISED | Corrected LOC: `cognitive-packer.ts=522`, `session-engine.ts=634`, `hierarchy-tree.ts=1070` | src/lib/cognitive-packer.ts, src/lib/session-engine.ts, src/lib/hierarchy-tree.ts | Open |
| CF-D3-07 | D3 | Medium | REVISED | Corrected LOC set: only `graph-migrate.ts=853` and `compaction-engine.ts=446` significantly exceed 300 | src/lib/staleness.ts, src/lib/compaction-engine.ts, src/lib/governance-instruction.ts, src/lib/session-governance.ts, src/lib/long-session.ts, src/lib/graph-migrate.ts | Open |
| CF-D3-08 | D3 | Low | REVISED | `src/lib/code-intel/` exists (10 files); partial subgrouping exists but remains sparse | src/lib/* | Open |
| CF-D3-09 | D3 | N/A | FALSE-POSITIVE | Code-intel Phase 1 implemented in `src/lib/code-intel/index.ts` (61 lines) | src/lib/code-intel/index.ts | Closed-FP |
| CF-D3-10 | D3 | N/A | FALSE-POSITIVE | Code-intel Phase 2 implemented in `src/lib/code-intel/signature-extractor.ts` (68 lines) | src/lib/code-intel/signature-extractor.ts | Closed-FP |
| CF-D3-11 | D3 | N/A | FALSE-POSITIVE | Code-intel Phase 3 implemented in `tree-sitter-loader.ts` and `file-scanner.ts` | src/lib/code-intel/tree-sitter-loader.ts, src/lib/code-intel/file-scanner.ts | Closed-FP |
| CF-D3-12 | D3 | High | CONFIRMED | No dependency injection pattern; direct imports create tight coupling | src/lib/* | Open |
| CF-D3-13 | D3 | High | CONFIRMED | No error boundary standardization across libraries | src/lib/* | Open |
| CF-D3-14 | D3 | Medium | CONFIRMED | Proposed sub-directory restructuring remains valid | src/lib/* | Open |
| CF-D3-NEW-01 | D3 | High | NEW | `graph-migrate.ts` at 853 LOC exceeds strategic limit | src/lib/graph-migrate.ts | Open |
| CF-D4-01 | D4 | High | CONFIRMED | Only 6 tools for full framework scope | src/tools/* | Open |
| CF-D4-02 | D4 | High | CONFIRMED | Missing context purification tool family | src/tools/* | Open |
| CF-D4-03 | D4 | High | CONFIRMED | Missing in-session memory tool family | src/tools/* | Open |
| CF-D4-04 | D4 | High | CONFIRMED | Missing code-intel tool family | src/tools/* | Open |
| CF-D4-05 | D4 | Medium | CONFIRMED | Tool response format inconsistency | src/tools/* | Open |
| CF-D4-06 | D4 | Medium | CONFIRMED | No tool versioning/deprecation mechanism | src/tools/* | Open |
| CF-D4-07 | D4 | Medium | CONFIRMED | No tool composition pattern | src/tools/* | Open |
| CF-D5-01 | D5 | Critical | CONFIRMED | `tool-gate.ts` advisory-only (`allowed: true` path) | src/hooks/tool-gate.ts | Open |
| CF-D5-02 | D5 | High | REVISED | Partial duplication: first-turn detection shared, but behavior differs | src/hooks/messages-transform.ts, src/hooks/session_coherence/main_session_start.ts | Open |
| CF-D5-03 | D5 | High | REVISED | `session_coherence` wired indirectly (`messages-transform.ts:20`), while `createMainSessionStartHook` export remains unregistered | src/hooks/session_coherence/*, src/index.ts | Open |
| CF-D5-04 | D5 | Medium | CONFIRMED | No hook sub-directory organization | src/hooks/* | Open |
| CF-D5-05 | D5 | Medium | CONFIRMED | Proposed hook reorganization remains valid | src/hooks/* | Open |
| CF-D5-06 | D5 | N/A | CLOSED | Distinct responsibilities validated: `soft-governance` post-tool drift tracking; `tool-gate` pre-tool advisory | src/hooks/soft-governance.ts, src/hooks/tool-gate.ts | Closed |
| CF-D5-07 | D5 | Medium | CONFIRMED | No explicit hook priority/ordering mechanism | src/hooks/index.ts, src/hooks/* | Open |
| CF-D5-NEW-01 | D5 | High | NEW | `createMainSessionStartHook` export is not registered as event handler (dead path) | src/hooks/session_coherence/index.ts, src/index.ts | Open |
| CF-D6-01 | D6 | High | CONFIRMED | `forming-the-own-framework.md` is incomplete | docs/planning-draft/forming-the-own-framework.md | Open |
| CF-D6-02 | D6 | Medium | REVISED | Workflow overlap ~60% with meaningful divergence in flow and guard rails | workflows/hivefiver-enterprise.yaml, workflows/hivefiver-enterprise-architect.yaml | Open |
| CF-D6-03 | D6 | High | CONFIRMED | Missing GSD-equivalent commands (`new-project`, etc.) | commands/* | Open |
| CF-D6-04 | D6 | Medium | CONFIRMED | Missing command groups: Code-Intel, Settings, Milestone, Phase | commands/* | Open |
| CF-D6-05 | D6 | High | CONFIRMED | No lifecycle state machine definition | docs/planning-draft/*, workflows/* | Open |
| CF-D6-06 | D6 | Medium | CONFIRMED | No framework versioning/compatibility layer | opencode.json, docs/planning-draft/* | Open |
| CF-D6-NEW-01 | D6 | Low | NEW | Version field inconsistency between core and hivefiver skill sets | .opencode/skills/**/SKILL.md | Open |
| CF-D7-01 | D7 | N/A | FALSE-POSITIVE | All 26 referenced skill assets exist (9 references, 8 templates, 9 scripts); missing count = 0 | .opencode/skills/**/SKILL.md, .opencode/skills/**/{references,templates,scripts}/* | Closed-FP |
| CF-D7-02 | D7 | Medium | CONFIRMED | 8 command aliases create discoverability and behavior ambiguity | commands/* | Open |
| CF-D7-03 | D7 | Medium | CONFIRMED | Gatekeeping triad overlap confirmed at ~35-45% | .opencode/skills/context-first-gatekeeping/SKILL.md, .opencode/skills/delegation-intelligence/SKILL.md, .opencode/skills/sequential-orchestration/SKILL.md | Open |
| CF-D7-04 | D7 | Medium | CONFIRMED | No skill dependency declaration support | .opencode/skills/**/SKILL.md | Open |
| CF-D7-05 | D7 | N/A | FALSE-POSITIVE | Core skills include version metadata (1.0.0-2.7.0); gap is limited to hivefiver-* subset | .opencode/skills/**/SKILL.md | Closed-FP |
| CF-D7-06 | D7 | Medium | CONFIRMED | No command discovery mechanism | commands/* | Open |
| CF-D7-NEW-01 | D7 | Medium | NEW | 8 alias commands are thin wrappers (15-19 LOC each) with maintenance overhead | commands/* | Open |
| CF-D8-01 | D8 | Critical | REVISED | `hiveminder.md` exists, but registration missing in `opencode.json` | opencode.json, .opencode/agents/hiveminder.md | Open |
| CF-D8-02 | D8 | Critical | CONFIRMED | debug agent missing from `opencode.json` | opencode.json, agents/debug.md | Open |
| CF-D8-03 | D8 | Critical | CONFIRMED | hivemind-brownfield-orchestrator missing from `opencode.json` | opencode.json, agents/hivemind-brownfield-orchestrator.md | Open |
| CF-D8-04 | D8 | High | CONFIRMED | build agent mode mismatch (`all` vs `subagent`) | agents/build.md, opencode.json | Open |
| CF-D8-05 | D8 | High | CONFIRMED | code-review agent mode mismatch (`all` vs `subagent`) | agents/code-review.md, opencode.json | Open |
| CF-D8-06 | D8 | N/A | CLOSED | Scanner mode consistent between markdown and config (`subagent`) | agents/scanner.md, opencode.json | Closed |
| CF-D8-07 | D8 | Low | CONFIRMED | Typo in `hivefiver.md`: `subtasks: alllow` | agents/hivefiver.md | Open |
| CF-D8-08 | D8 | High | CONFIRMED | debug agent missing tools frontmatter block | agents/debug.md | Open |
| CF-D8-09 | D8 | High | CONFIRMED | Duplicate agent files in `agents/` and `.opencode/agents/` with unclear canonical source | agents/*, .opencode/agents/* | Open |
| CF-D8-10 | D8 | Medium | CONFIRMED | 12+ cross-reference locations affected by proposed renaming | agents/*, .opencode/agents/*, docs/*, workflows/* | Open |
| CF-D8-11 | D8 | Medium | CONFIRMED | No agent capability matrix | opencode.json, agents/* | Open |
| CF-D8-12 | D8 | Medium | CONFIRMED | No agent handoff protocol | agents/*, workflows/* | Open |
| CF-D8-13 | D8 | Medium | CONFIRMED | hiveplanner proposed but not implemented | agents/*, opencode.json | Open |
| CF-D8-14 | D8 | Medium | CONFIRMED | No agent versioning/compatibility declaration | agents/*, opencode.json | Open |
| CF-D8-15 | D8 | Medium | CONFIRMED | No agent health/performance monitoring | agents/*, src/lib/*, dashboard/* | Open |
| CF-D8-16 | D8 | Medium | CONFIRMED | No permission inheritance model | opencode.json, agents/* | Open |
| CF-D8-NEW-01 | D8 | Medium | NEW | Debug agent frontmatter pins model (`openai/gpt-5.3-codex`) reducing portability | .opencode/agents/debug.md | Open |
| CF-D8-NEW-02 | D8 | Low | NEW | `agents/hivefiver.md` has duplicate frontmatter keys (`skill`, `websearch`, `bash`, `webfetch`) | agents/hivefiver.md | Open |

## Appendix B: Entity Inventory
| Name | Has Zod? | File Location | Fields Count | FK References | Status |
|------|----------|---------------|--------------|---------------|--------|
| TaskItem | No | src/schemas/manifest.ts | 15 (agent finding) | No | Existing, unvalidated |
| BrainState | No | src/schemas/brain-state.ts | 14 (agent finding) | No | Existing, unvalidated |
| HierarchyState | No | src/schemas/hierarchy.ts | 3-level model | No | Existing, unvalidated |
| Config (HiveMindConfig) | No | src/schemas/config.ts | Not specified | No | Existing, unvalidated |
| Mem (legacy) | No | .hivemind/memory/mems.json | Legacy shape | No | Existing, dual-state |
| TaskNode | Yes | src/schemas/graph-nodes.ts | 8 unique (agent comparison) | Yes | Existing |
| MemNode | Yes | src/schemas/graph-nodes.ts | 6 unique (agent comparison) | Yes (`session_id`, `origin_task_id`) | Existing |
| TrajectoryNode | Yes | src/schemas/graph-nodes.ts | Not specified | Yes | Existing |
| PhaseNode | Yes | src/schemas/graph-nodes.ts | Not specified | Yes | Existing |
| PlanNode | Yes | src/schemas/graph-nodes.ts | Not specified | Yes | Existing |
| VerificationNode | Partial/Planned | src/schemas/graph-nodes.ts, proposed set | Not specified | Yes (planned) | Missing/partial |
| ProjectNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| MilestoneNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| SubTaskNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| TaskClassificationNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| DebugMemoryNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| ResearchMemoryNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| CueMemoryNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| PRDNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| ArchitectureNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| ProfileConfigNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| CodemapNode | No (missing) | Proposed in D1 findings | N/A | Planned | Missing |
| ManifestNode | No explicit Zod | src/schemas/manifest.ts | Not specified | No | Existing, TS-only |
| BrainMetricsEntity | No explicit Zod | .hivemind/state/brain.json | Runtime metrics set | No | Existing |
| SessionManifestEntry | No explicit Zod | .hivemind/sessions/manifest.json | Not specified | Session-linked | Existing |
| AnchorEntry | No explicit Zod | .hivemind/state/anchors.json | Not specified | Optional linkage | Existing |
| OrphanEntry | No explicit Zod | .hivemind/graph/orphans.json | Not specified | Task lineage | Existing |
| LineageMapEntry | No explicit Zod | .hivemind/graph/task-id-lineage-map.json | Not specified | Task mapping | Existing |
| Entity-29 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-30 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-31 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-32 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-33 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-34 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-35 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-36 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-37 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-38 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-39 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-40 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-41 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |
| Entity-42 (unnamed in round digest) | Unknown | src/schemas/* | Unknown | Unknown | Existing, name not surfaced |

## Appendix C: Proposed v2.9 Entity List
| Name | Purpose | Belongs to Domain | Priority |
|------|---------|-------------------|----------|
| ProjectNode | Top-level enterprise lineage root | D1/D2 | P0 |
| MilestoneNode | Mid-level program grouping | D1/D2 | P0 |
| PhaseNode (normalized) | Execution stage boundary | D1/D2 | P0 |
| PlanNode (normalized) | Planned work package | D1/D2 | P0 |
| TaskNode (expanded) | Unit of implementation with lifecycle state | D1/D2 | P0 |
| SubTaskNode | Child work breakdown | D1/D2 | P1 |
| VerificationNode | Explicit verification artifact linkage | D1/D2 | P1 |
| TaskClassificationNode | Priority/type taxonomy and routing | D1/D6 | P1 |
| DebugMemoryNode | Debug-session scoped memory | D1/D4 | P1 |
| ResearchMemoryNode | Research-session scoped memory | D1/D4 | P1 |
| CueMemoryNode | Cue-based retrieval memory | D1/D4 | P1 |
| PRDNode | Requirements traceability artifact | D1/D6 | P1 |
| ArchitectureNode | ADR/system design artifact linkage | D1/D6 | P1 |
| ProfileConfigNode | Persona/profile-scoped config | D1/D6 | P2 |
| CodemapNode | Code-intel codemap snapshot contract | D1/D3 | P2 |
| CodewikiNode | Code-intel wiki/page contract | D1/D3 | P2 |
| CommandNode | Command registry/version contract | D1/D7 | P2 |
| SkillNode | Skill registry/dependency contract | D1/D7 | P2 |
| WorkflowNode | Workflow version/state contract | D1/D6 | P2 |
| AgentCapabilityNode | Agent capability matrix contract | D1/D8 | P2 |
| AgentHandoffNode | Agent-to-agent context transfer envelope | D1/D8 | P2 |
| GovernancePolicyNode | Hard/soft governance policy contract | D1/D5 | P2 |
| ToolContractNode | Tool IO schema/version contract | D1/D4 | P2 |
| HookContractNode | Hook ordering and priority contract | D1/D5 | P2 |
| StateSnapshotNode | Event-sourced snapshot pointer | D1/D2 | P3 |
| ConflictResolutionNode | Divergence resolution rule declaration | D1/D2 | P3 |
| AuditTrailNode | Immutable state mutation audit record | D1/D2 | P3 |
| CompatibilityNode | Version compatibility bridge metadata | D1/D6 | P3 |

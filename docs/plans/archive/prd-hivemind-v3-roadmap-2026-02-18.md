# PRD: HiveMind v3.0 — Relational Cognitive Engine

## Overview

Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, the Actor Model, and a strict architectural taxonomy.

**Problem:** Current architecture has:
- 2,169 lines of dead code (6 unwired hivemind-*.ts tools)
- Flat-file storage with no relational structure (no FKs, no graph traversal)
- Monolithic brain.json blob (85 lines) instead of slim trajectory
- Missing cognitive-packer (no Time Machine, no TTS filtering)
- Business logic in tools (violates "Dumb Tool" rule)

**Solution:** Implement the 6-phase overhaul defined in refactored-plan.md:
1. Graph Schemas & Dumb Tool Diet
2. Cognitive Packer (Repomix-for-State)
3. SDK Hook Injection & Pre-Stop Gate
4. .hivemind Graph Migration & Session Swarms
5. Tool Consolidation & Cleanup
6. Testing & Verification

## Goals

- **G1:** Eliminate 2,169 lines of dead code by wiring or deleting hivemind-*.ts tools
- **G2:** Implement relational graph structure with UUID FKs (plan→phase→task→mem)
- **G3:** Build cognitive-packer for deterministic XML context compilation
- **G4:** Enforce CQRS: Tools = Write-Only, Hooks = Read-Auto
- **G5:** Enable session swarms via Actor Model (80% splitter, headless researchers)
- **G6:** All 84+ tests pass, no regressions

## Quality Gates

These commands must pass for every user story:
- npm test - All tests pass (84+)
- npx tsc --noEmit - Type-check passes

For migration stories, also verify:
- node bin/hivemind-tools.cjs source-audit - No dead tool warnings

## User Stories

### Phase 1: Graph Schemas & Dumb Tool Diet

---

### US-001: Create graph node Zod schemas
**Description:** As a developer, I want strict Zod schemas for all graph nodes with UUID FKs so that orphaned data is rejected at validation time.

**Acceptance Criteria:**
- [ ] Create src/schemas/graph-nodes.ts with: TrajectoryNode, PlanNode, PhaseNode, TaskNode, MemNode
- [ ] All IDs are UUIDs (validate with z.string().uuid())
- [ ] TaskNode has parent_phase_id FK (required)
- [ ] MemNode has origin_task_id FK (nullable), type: "insight"|"false_path", staleness_stamp 
- [ ] Add validateParentExists() and validateOrphanFree() helpers

---

### US-002: Create graph state aggregates
**Description:** As a developer, I want aggregate types for each graph/*.json file so that I/O operations have type safety.

**Acceptance Criteria:**
- [ ] Create src/schemas/graph-state.ts 
- [ ] Define: TrajectoryState, PlansState, GraphTasksState, GraphMemsState
- [ ] All state types include version field for migration

---

### US-003: Update paths.ts for graph directory
**Description:** As a developer, I want path helpers for the new graph/ directory structure.

**Acceptance Criteria:**
- [ ] Add to HivemindPaths: graphDir, graphTrajectory, graphPlans, graphTasks, graphMems 
- [ ] Update getEffectivePaths() to return new paths

---

### US-004: Extract compaction engine to lib
**Description:** As a developer, I want compaction business logic extracted from compact-session.ts so the tool becomes a dumb wrapper.

**Acceptance Criteria:**
- [ ] Create src/lib/compaction-engine.ts 
- [ ] Extract: identifyTurningPoints(), generateNextCompactionReport(), executeCompaction() 
- [ ] compact-session.ts reduced to ≤100 lines
- [ ] Tool only: define Zod schema → call lib → return string

---

### US-005: Extract session engine to lib
**Description:** As a developer, I want session management logic extracted from hivemind-session.ts so it's reusable by hooks.

**Acceptance Criteria:**
- [ ] Create src/lib/session-engine.ts 
- [ ] Extract: startSession(), updateSession(), closeSession(), getSessionStatus(), resumeSession() 
- [ ] Functions return JSON/boolean, never conversational text

---

### US-006: Extract inspect engine to lib
**Description:** As a developer, I want state inspection logic extracted from hivemind-inspect.ts so it's callable by hooks.

**Acceptance Criteria:**
- [ ] Create src/lib/inspect-engine.ts 
- [ ] Extract: scanState(), deepInspect(), driftReport() 
- [ ] Functions return structured JSON

---

### US-007: Extract brownfield scan to lib
**Description:** As a developer, I want brownfield orchestration extracted from scan-hierarchy.ts so anchors/mems are saved consistently.

**Acceptance Criteria:**
- [ ] Create src/lib/brownfield-scan.ts 
- [ ] Extract: executeOrchestration() (anchor upserts + mem saving)
- [ ] scan-hierarchy.ts reduced to ≤100 lines

---

### US-008: Extract session split to lib
**Description:** As a developer, I want session split logic extracted from soft-governance.ts so it's testable in isolation.

**Acceptance Criteria:**
- [ ] Create src/lib/session-split.ts 
- [ ] Extract: maybeCreateNonDisruptiveSessionSplit() 
- [ ] Function handles SDK session creation + export generation

---

### US-009: Create shared tool response helper
**Description:** As a developer, I want a shared JSON output helper so all tools have consistent formatting.

**Acceptance Criteria:**
- [ ] Create src/lib/tool-response.ts 
- [ ] Export: toJsonOutput(), toSuccessOutput(), toErrorOutput() 
- [ ] All refactored tools use these helpers

---

### Phase 2: Cognitive Packer (Repomix-for-State)

---

### US-010: Build cognitive packer core
**Description:** As the system, I want a deterministic context compiler that traverses the graph and produces dense XML.

**Acceptance Criteria:**
- [ ] Create src/lib/cognitive-packer.ts 
- [ ] packCognitiveState(directory, sessionId) returns XML string
- [ ] NO LLM prompts, NO tool definitions in this file
- [ ] Reads trajectory.json → resolves Read-Head
- [ ] Traverses graph via FK resolution (plans → tasks → mems)

---

### US-011: Implement Time Machine filter
**Description:** As the system, I want to drop false_path and invalidated nodes from compiled context so the agent doesn't see contaminated data.

**Acceptance Criteria:**
- [ ] In cognitive-packer.ts, implement pruneContaminated(nodes) 
- [ ] Drops MemNode with type: "false_path" 
- [ ] Drops TaskNode with status: "invalidated" 
- [ ] Logs count of pruned nodes for debugging

---

### US-012: Implement TTS (Time-To-Stale) filter
**Description:** As the system, I want to filter stale mems unless they're linked to active tasks.

**Acceptance Criteria:**
- [ ] Enhance src/lib/staleness.ts 
- [ ] isMemStale(mem, activeTasks, config) returns boolean
- [ ] calculateRelevanceScore(mem, trajectory) returns number
- [ ] In packer: drops mems past staleness_stamp UNLESS linked to active task

---

### US-013: Implement XML compression with budget
**Description:** As the system, I want compressed XML output capped at configurable character budget.

**Acceptance Criteria:**
- [ ] XML format matches spec: <hivemind_state>...</hivemind_state> 
- [ ] Budget default: 2000 chars (configurable in config.json)
- [ ] Lowest-relevance mems dropped first when over budget
- [ ] Include metadata: timestamp, session, compaction count, stale_dropped, false_path_pruned

---

### US-014: Build graph I/O layer
**Description:** As a developer, I want atomic CRUD operations for graph/*.json files with Zod validation.

**Acceptance Criteria:**
- [ ] Create src/lib/graph-io.ts 
- [ ] Implement: loadTrajectory()/saveTrajectory() 
- [ ] Implement: loadPlans()/savePlans() 
- [ ] Implement: loadGraphTasks()/saveGraphTasks()/addGraphTask()/invalidateTask() 
- [ ] Implement: loadGraphMems()/saveGraphMems()/addGraphMem()/flagFalsePath() 
- [ ] All operations validate via Zod on read AND write

---

### Phase 3: SDK Hook Injection & Pre-Stop Gate

---

### US-015: Wire packer to messages-transform
**Description:** As the system, I want packed XML injected into every user message so the agent has pristine context.

**Acceptance Criteria:**
- [ ] In messages-transform.ts, call packCognitiveState() 
- [ ] Inject as synthetic: true part at START (prepend)
- [ ] Keep existing checklist as second synthetic part (append)

---

### US-016: Implement Pre-Stop Gate checklist
**Description:** As the system, I want to force the agent to verify state before stopping.

**Acceptance Criteria:**
- [ ] Checklist items derived from trajectory.json active tasks
- [ ] Items: hierarchy updated, artifacts saved, commit threshold met
- [ ] Checklist injected as synthetic: true part at END
- [ ] Format: <system-reminder>BEFORE completing your turn...</system-reminder> 

---

### US-017: Refactor session-lifecycle to use packer
**Description:** As a developer, I want session-lifecycle.ts reduced from 586 lines to ≤200 by using the packer.

**Acceptance Criteria:**
- [ ] Replace ad-hoc section assembly with packCognitiveState() call
- [ ] Keep: bootstrap block (first 2 turns), setup guidance, governance signals
- [ ] Move: brownfield detection, framework conflict routing → src/lib/onboarding.ts 
- [ ] File reduced to ≤200 lines

---

### Phase 4: .hivemind Graph Migration & Session Swarms

---

### US-018: Build graph migration script
**Description:** As the system, I want one-time auto-migration from flat files to graph structure.

**Acceptance Criteria:**
- [ ] Create src/lib/graph-migrate.ts 
- [ ] migrateToGraph(directory) triggers on first hook if graph/ missing
- [ ] Migrate: brain.json hierarchy → trajectory.json 
- [ ] Migrate: tasks.json flat → graph/tasks.json with parent_phase_id FK
- [ ] Migrate: mems.json flat → graph/mems.json with staleness_stamp, type: "insight", origin_task_id: null 
- [ ] Create empty graph/plans.json 
- [ ] Preserve old files as .bak backups

---

### US-019: Implement dual-read backward compat
**Description:** As the system, I want graph-aware functions to fall back to legacy paths during migration.

**Acceptance Criteria:**
- [ ] All graph-aware functions check graph/ first
- [ ] Fall back to state/ and memory/ if graph missing
- [ ] Log migration status on each fallback

---

### US-020: Implement 80% session splitter
**Description:** As the system, I want to split sessions at 80% context capacity with pristine handoff.

**Acceptance Criteria:**
- [ ] Create src/lib/session-swarm.ts 
- [ ] Monitor session token pressure via SDK
- [ ] At 80%: call packCognitiveState() for export
- [ ] Call client.session.create() with packed XML as Turn 0
- [ ] Save export to sessions/archive/splits/ 

---

### US-021: Implement headless researcher swarms
**Description:** As the system, I want to spawn background sub-sessions for research tasks.

**Acceptance Criteria:**
- [ ] spawnHeadlessResearcher(client, parentId, prompt) function
- [ ] Uses noReply: true to force background execution
- [ ] Commands sub-agent to save findings to graph/mems.json with origin_task_id 
- [ ] Metadata tracked in sessions/active/swarms/ 

---

### US-022: Wire trajectory write-through in tools
**Description:** As the system, I want tools to update trajectory.json on hierarchy changes.

**Acceptance Criteria:**
- [ ] declare_intent → sets trajectory.active_plan_id, clears phase/task
- [ ] map_context(trajectory) → updates intent shift stamp
- [ ] map_context(tactic/action) → updates active_phase_id / active_task_ids 

---

### Phase 5: Tool Consolidation & Cleanup

---

### US-023: Wire 6 canonical hivemind tools
**Description:** As a developer, I want the 6 unified hivemind-*.ts tools wired into index.ts.

**Acceptance Criteria:**
- [ ] src/index.ts registers 6 tools (was 10)
- [ ] Tools: hivemind_session, hivemind_inspect, hivemind_memory, hivemind_anchor, hivemind_hierarchy, hivemind_cycle
- [ ] All 6 tools slimmed to ≤100 lines (business logic in libs)

---

### US-024: Delete 13 old tool files
**Description:** As a developer, I want dead tool files removed to eliminate confusion.

**Acceptance Criteria:**
- [ ] Delete: declare-intent.ts, map-context.ts, compact-session.ts, scan-hierarchy.ts, save-anchor.ts, think-back.ts, save-mem.ts, recall-mems.ts, hierarchy.ts, export-cycle.ts, check-drift.ts, list-shelves.ts, self-rate.ts
- [ ] Update src/tools/index.ts to export only 6 canonical tools
- [ ] Update classifyTool() in detection.ts to recognize new names

---

### US-025: Update documentation
**Description:** As a user, I want documentation to reflect the new tool structure.

**Acceptance Criteria:**
- [ ] Update AGENTS.md with new tool names
- [ ] Update README.md with new tool list
- [ ] Update CLI help text

---

### Phase 6: Testing & Verification

---

### US-026: Create graph schema tests
**Description:** As a developer, I want unit tests for Zod schema validation.

**Acceptance Criteria:**
- [ ] Create tests/graph-nodes.test.ts 
- [ ] Test: valid/invalid nodes
- [ ] Test: FK constraints (orphan rejection)

---

### US-027: Create cognitive packer tests
**Description:** As a developer, I want unit tests for the packer's core functions.

**Acceptance Criteria:**
- [ ] Create tests/cognitive-packer.test.ts 
- [ ] Test: XML output format
- [ ] Test: TTS filtering
- [ ] Test: Time Machine (false_path pruning)
- [ ] Test: FK resolution

---

### US-028: Create graph I/O tests
**Description:** As a developer, I want unit tests for atomic writes and validation.

**Acceptance Criteria:**
- [ ] Create tests/graph-io.test.ts 
- [ ] Test: CRUD operations
- [ ] Test: atomic writes
- [ ] Test: Zod validation on I/O

---

### US-029: Create migration tests
**Description:** As a developer, I want unit tests for the graph migration.

**Acceptance Criteria:**
- [ ] Create tests/graph-migrate.test.ts 
- [ ] Test: old→new format conversion
- [ ] Test: backup creation
- [ ] Test: dual-read fallback

---

### US-030: Create session swarm tests
**Description:** As a developer, I want unit tests for swarm spawning and 80% splitting.

**Acceptance Criteria:**
- [ ] Create tests/session-swarm.test.ts 
- [ ] Test: 80% split trigger
- [ ] Test: headless spawn with noReply
- [ ] Test: context injection (mock SDK client)

---

### US-031: Full regression test
**Description:** As a developer, I want to verify no regressions after the overhaul.

**Acceptance Criteria:**
- [ ] All 84+ tests pass
- [ ] npx tsc --noEmit passes
- [ ] node bin/hivemind-tools.cjs source-audit shows no dead tools
- [ ] Manual test: start session → update hierarchy → save mem → inspect → compact → verify graph state

---

## Functional Requirements

- **FR-1:** All graph nodes MUST have UUID id field
- **FR-2:** TaskNode MUST have parent_phase_id FK (non-nullable)
- **FR-3:** MemNode MUST have origin_task_id FK (nullable), type, staleness_stamp 
- **FR-4:** Tools MUST be ≤100 lines with no business logic (only Zod + lib call)
- **FR-5:** Hooks MUST call Libraries for state compilation (no inline business logic)
- **FR-6:** Cognitive Packer MUST output dense XML with budget cap
- **FR-7:** Migration MUST be non-destructive (preserve .bak backups)
- **FR-8:** Session split MUST use parentID for SDK linkage
- **FR-9:** All 6 canonical tools MUST be wired in index.ts
- **FR-10:** 13 old tool files MUST be deleted

## Non-Goals

- **NG-1:** No AI-assisted semantic analysis (pure deterministic logic)
- **NG-2:** No distributed session state (single-process Actor Model)
- **NG-3:** No automatic plan detection from docs (user links manually)
- **NG-4:** No backward compatibility for external consumers (semver v3.0.0 breaking)
- **NG-5:** No distributed session state (single-process Actor Model)

## Technical Considerations

- **Performance:** Cognitive packer should complete in <10ms for typical session state
- **Memory:** Graph files should stay under 1MB each (enforce via budget)
- **SDK Version:** Requires OpenCode SDK v2026.x for noReply support
- **OpenTUI:** Dashboard uses @opentui/react v0.1.x (https://opentui.com, anomalyco/opentui). **Requires Bun runtime** (not Node.js). Requires Zig for native builds.
- **Migration:** One-time auto-trigger on first hook invocation
- **Testing:** Use mock SDK client for swarm/spawn tests. Dashboard tests via @opentui/react/test-utils 

## Success Metrics

| Metric | Target |
|--------|--------|
| Dead code lines removed | ≥2,000 |
| Tool files (after cleanup) | 6 |
| Hook files (after refactor) | Same count, reduced lines |
| Test coverage | ≥90% on new files |
| Cognitive packer runtime | <10ms |
| All tests passing | 100% |

## Dependencies

- Phase 1 → Phase 2 (schemas required for packer)
- Phase 2 → Phase 3 (packer required for hooks)
- Phase 1+2 → Phase 4 (schemas + graph-io required for migration)
- Phase 1+3 → Phase 5 (slim tools + updated hooks)
- All phases → Phase 6 (final verification)
- Phase 2+3 → Phase 7 (packer + hooks required for dashboard)

---

## Open Questions

1. Should we keep check-drift.ts functionality merged into hivemind-inspect?
2. What's the migration path for users with custom tool extensions?
3. Should staleness_stamp be absolute timestamp or relative TTL?

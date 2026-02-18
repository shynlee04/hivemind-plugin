# PRD: HiveMind v3.0 — Relational Cognitive Engine (Consolidated)

## Consolidation Summary

**Date:** 2026-02-18
**Source Documents:**
- `prd-hivemind-v3-relational-engine-2026-02-16.md` (822 lines, 50 US)
- `prd-hivemind-v3-roadmap-2026-02-18.md` (457 lines, 31 US)
- `file-level-execution-blueprint-2026-02-16.md` (323 lines)

**Conflicts Resolved:**
- Duplicate user stories removed (US-001 through US-031 identical across docs)
- US-032/US-033 task description conflict: Added NEW US-051/US-052 for Auto-Context State and Linter Agent
- Phase 7 (US-032 through US-050) from main PRD retained (OpenTUI Dashboard)
- Execution blueprint details integrated into Appendix

**New User Stories Added (from Gemini Autonomous Findings):**
- **US-051:** Auto-Context State (system tracks focus, auto-wires FK)
- **US-052:** Linter Agent (scheduled graph integrity checks)
- **US-016 REVAMPED:** Hard Gatekeeper Tool (replaces text checklist)

**Gemini Findings Status:**
| # | Finding | Status |
|---|---------|--------|
| 1 | Runtime Schism (Node vs Bun) | DEFERRED - OpenTUI optional (US-032) |
| 2 | Context Starvation (2000 chars) | ✅ FIXED - Dynamic 15,360 chars (US-013) |
| 3 | Manual Relevance Trap | DEFERRED - Semantic search future work |
| 4 | Implicit Migration Roulette | ✅ FIXED - Explicit `migrate` command |
| 5 | Single-Process Bottleneck | DEFERRED - Worker threads future work |
| 6 | Dead code elimination | ✅ VERIFIED - US-023/US-024 complete |

---

## Overview

Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, the Actor Model, and a strict architectural taxonomy.

**Problem:** Current architecture has:
- 2,169 lines of dead code (6 unwired hivemind-*.ts tools)
- Flat-file storage with no relational structure (no FKs, no graph traversal)
- Monolithic brain.json blob (85 lines) instead of slim trajectory
- Missing cognitive-packer (no Time Machine, no TTS filtering)
- Business logic in tools (violates "Dumb Tool" rule)

**Solution:** Implement the 7-phase overhaul defined in refactored-plan.md:
1. Graph Schemas & Dumb Tool Diet
2. Cognitive Packer (Repomix-for-State)
3. SDK Hook Injection & Pre-Stop Gate
4. .hivemind Graph Migration & Session Swarms
5. Tool Consolidation & Cleanup
6. Testing & Verification
7. OpenTUI Cognitive Dashboard

## Goals

- **G1:** Eliminate 2,169 lines of dead code by wiring or deleting hivemind-*.ts tools
- **G2:** Implement relational graph structure with UUID FKs (plan→phase→task→mem)
- **G3:** Build cognitive-packer for deterministic XML context compilation
- **G4:** Enforce CQRS: Tools = Write-Only, Hooks = Read-Auto
- **G5:** Enable session swarms via Actor Model (80% splitter, headless researchers)
- **G6:** All 126 tests pass, no regressions

## Quality Gates

These commands must pass for every user story:
- `npm test` - All tests pass (126/126)
- `npx tsc --noEmit` - Type-check passes

For migration stories, also verify:
- `node bin/hivemind-tools.cjs source-audit` - No dead tool warnings

## User Stories

### Phase 1: Graph Schemas & Dumb Tool Diet

---

### US-001: Create graph node Zod schemas
**Description:** As a developer, I want strict Zod schemas for all graph nodes with UUID FKs so that orphaned data is rejected at validation time.

**Acceptance Criteria:**
- [ ] Create `src/schemas/graph-nodes.ts` with: TrajectoryNode, PlanNode, PhaseNode, TaskNode, MemNode
- [ ] All IDs are UUIDs (validate with z.string().uuid())
- [ ] TaskNode has `parent_phase_id` FK (required)
- [ ] MemNode has `origin_task_id` FK (nullable), `type: "insight"|"false_path"`, `staleness_stamp`
- [ ] Add `validateParentExists()` and `validateOrphanFree()` helpers

---

### US-002: Create graph state aggregates
**Description:** As a developer, I want aggregate types for each graph/*.json file so that I/O operations have type safety.

**Acceptance Criteria:**
- [ ] Create `src/schemas/graph-state.ts`
- [ ] Define: TrajectoryState, PlansState, GraphTasksState, GraphMemsState
- [ ] All state types include version field for migration

---

### US-003: Update paths.ts for graph directory
**Description:** As a developer, I want path helpers for the new graph/ directory structure.

**Acceptance Criteria:**
- [ ] Add to `HivemindPaths`: `graphDir`, `graphTrajectory`, `graphPlans`, `graphTasks`, `graphMems`
- [ ] Update `getEffectivePaths()` to return new paths

---

### US-004: Extract compaction engine to lib
**Description:** As a developer, I want compaction business logic extracted from `compact-session.ts` so the tool becomes a dumb wrapper.

**Acceptance Criteria:**
- [ ] Create `src/lib/compaction-engine.ts`
- [ ] Extract: `identifyTurningPoints()`, `generateNextCompactionReport()`, `executeCompaction()`
- [ ] `compact-session.ts` reduced to ≤100 lines
- [ ] Tool only: define Zod schema → call lib → return string

---

### US-005: Extract session engine to lib
**Description:** As a developer, I want session management logic extracted from `hivemind-session.ts` so it's reusable by hooks.

**Acceptance Criteria:**
- [ ] Create `src/lib/session-engine.ts`
- [ ] Extract: `startSession()`, `updateSession()`, `closeSession()`, `getSessionStatus()`, `resumeSession()`
- [ ] Functions return JSON/boolean, never conversational text

---

### US-006: Extract inspect engine to lib
**Description:** As a developer, I want state inspection logic extracted from `hivemind-inspect.ts` so it's callable by hooks.

**Acceptance Criteria:**
- [ ] Create `src/lib/inspect-engine.ts`
- [ ] Extract: `scanState()`, `deepInspect()`, `driftReport()`
- [ ] Functions return structured JSON

---

### US-007: Extract brownfield scan to lib
**Description:** As a developer, I want brownfield orchestration extracted from `scan-hierarchy.ts` so anchors/mems are saved consistently.

**Acceptance Criteria:**
- [ ] Create `src/lib/brownfield-scan.ts`
- [ ] Extract: `executeOrchestration()` (anchor upserts + mem saving)
- [ ] `scan-hierarchy.ts` reduced to ≤100 lines

---

### US-008: Extract session split to lib
**Description:** As a developer, I want session split logic extracted from `soft-governance.ts` so it's testable in isolation.

**Acceptance Criteria:**
- [ ] Create `src/lib/session-split.ts`
- [ ] Extract: `maybeCreateNonDisruptiveSessionSplit()`
- [ ] Function handles SDK session creation + export generation

---

### US-009: Create shared tool response helper
**Description:** As a developer, I want a shared JSON output helper so all tools have consistent formatting.

**Acceptance Criteria:**
- [ ] Create `src/lib/tool-response.ts`
- [ ] Export: `toJsonOutput()`, `toSuccessOutput()`, `toErrorOutput()`
- [ ] All refactored tools use these helpers

---

### Phase 2: Cognitive Packer (Repomix-for-State)

---

### US-010: Build cognitive packer core
**Description:** As the system, I want a deterministic context compiler that traverses the graph and produces dense XML.

**Acceptance Criteria:**
- [ ] Create `src/lib/cognitive-packer.ts`
- [ ] `packCognitiveState(directory, sessionId)` returns XML string
- [ ] NO LLM prompts, NO tool definitions in this file
- [ ] Reads trajectory.json → resolves Read-Head
- [ ] Traverses graph via FK resolution (plans → tasks → mems)

---

### US-011: Implement Time Machine filter
**Description:** As the system, I want to drop `false_path` and `invalidated` nodes from compiled context so the agent doesn't see contaminated data.

**Acceptance Criteria:**
- [ ] In cognitive-packer.ts, implement `pruneContaminated(nodes)`
- [ ] Drops MemNode with `type: "false_path"`
- [ ] Drops TaskNode with `status: "invalidated"`
- [ ] Logs count of pruned nodes for debugging

---

### US-012: Implement TTS (Time-To-Stale) filter
**Description:** As the system, I want to filter stale mems unless they're linked to active tasks.

**Acceptance Criteria:**
- [ ] Enhance `src/lib/staleness.ts`
- [ ] `isMemStale(mem, activeTasks, config)` returns boolean
- [ ] `calculateRelevanceScore(mem, trajectory)` returns number
- [ ] In packer: drops mems past `staleness_stamp` UNLESS linked to active task

---

### US-013: Implement XML compression with budget
**Description:** As the system, I want compressed XML output capped at configurable character budget.

**Acceptance Criteria:**
- [ ] XML format matches spec: `<hivemind_state>...</hivemind_state>`
- [ ] Budget default: 12% of context window (~15,360 chars for 128k model), configurable in config.json
- [ ] Lowest-relevance mems dropped first when over budget
- [ ] Include metadata: timestamp, session, compaction count, stale_dropped, false_path_pruned

---

### US-014: Build graph I/O layer
**Description:** As a developer, I want atomic CRUD operations for graph/*.json files with Zod validation.

**Acceptance Criteria:**
- [ ] Create `src/lib/graph-io.ts`
- [ ] Implement: `loadTrajectory()`/`saveTrajectory()`
- [ ] Implement: `loadPlans()`/`savePlans()`
- [ ] Implement: `loadGraphTasks()`/`saveGraphTasks()`/`addGraphTask()`/`invalidateTask()`
- [ ] Implement: `loadGraphMems()`/`saveGraphMems()`/`addGraphMem()`/`flagFalsePath()`
- [ ] All operations validate via Zod on read AND write

---

### Phase 3: SDK Hook Injection & Pre-Stop Gate

---

### US-015: Wire packer to messages-transform
**Description:** As the system, I want packed XML injected into every user message so the agent has pristine context.

**Acceptance Criteria:**
- [ ] In `messages-transform.ts`, call `packCognitiveState()`
- [ ] Inject as `synthetic: true` part at START (prepend)
- [ ] Keep existing checklist as second synthetic part (append)

---

### US-016: Implement Hard Gatekeeper Tool [REVAMPED]
**Description:** As the system, I want a Hard Gatekeeper Tool (not just text checklist) to enforce mandatory checkpoints before session termination.

**Acceptance Criteria:**
- [ ] Create `src/lib/gatekeeper.ts` with `verifyCheckpoints(trajectory)` function
- [ ] Checkpoints derived from `trajectory.json` active tasks
- [ ] Mandatory gates: hierarchy updated, artifacts saved, commit threshold met
- [ ] Returns structured JSON: `{ passed: boolean, failures: string[], warnings: string[] }`
- [ ] Injected as `synthetic: true` part at END with format: `<system-reminder>BEFORE completing your turn...</system-reminder>`
- [ ] Gatekeeper can block session end if critical gates not met

---

### US-017: Refactor session-lifecycle to use packer
**Description:** As a developer, I want session-lifecycle.ts reduced from 586 lines to ≤200 by using the packer.

**Acceptance Criteria:**
- [ ] Replace ad-hoc section assembly with `packCognitiveState()` call
- [ ] Keep: bootstrap block (first 2 turns), setup guidance, governance signals
- [ ] Move: brownfield detection, framework conflict routing → `src/lib/onboarding.ts`
- [ ] File reduced to ≤200 lines

---

### Phase 4: .hivemind Graph Migration & Session Swarms

---

### US-018: Build graph migration script
**Description:** As the system, I want one-time auto-migration from flat files to graph structure.

**Acceptance Criteria:**
- [ ] Create `src/lib/graph-migrate.ts`
- [ ] `migrateToGraph(directory)` triggers on first hook if `graph/` missing OR via explicit CLI command
- [ ] Migrate: `brain.json` hierarchy → `trajectory.json`
- [ ] Migrate: `tasks.json` flat → `graph/tasks.json` with `parent_phase_id` FK
- [ ] Migrate: `mems.json` flat → `graph/mems.json` with `staleness_stamp`, `type: "insight"`, `origin_task_id: null`
- [ ] Create empty `graph/plans.json`
- [ ] Preserve old files as `.bak` backups

---

### US-019: Implement dual-read backward compat
**Description:** As the system, I want graph-aware functions to fall back to legacy paths during migration.

**Acceptance Criteria:**
- [ ] All graph-aware functions check `graph/` first
- [ ] Fall back to `state/` and `memory/` if graph missing
- [ ] Log migration status on each fallback

---

### US-020: Implement 80% session splitter
**Description:** As the system, I want to split sessions at 80% context capacity with pristine handoff.

**Acceptance Criteria:**
- [ ] Create `src/lib/session-swarm.ts`
- [ ] Monitor session token pressure via SDK
- [ ] At 80%: call `packCognitiveState()` for export
- [ ] Call `client.session.create()` with packed XML as Turn 0
- [ ] Save export to `sessions/archive/splits/`

---

### US-021: Implement headless researcher swarms
**Description:** As the system, I want to spawn background sub-sessions for research tasks.

**Acceptance Criteria:**
- [ ] `spawnHeadlessResearcher(client, parentId, prompt)` function
- [ ] Uses `noReply: true` to force background execution
- [ ] Commands sub-agent to save findings to `graph/mems.json` with `origin_task_id`
- [ ] Metadata tracked in `sessions/active/swarms/`
- [ ] File locking/mutex for concurrent swarm writes (address Gemini concurrency finding)

---

### US-022: Wire trajectory write-through in tools
**Description:** As the system, I want tools to update trajectory.json on hierarchy changes.

**Acceptance Criteria:**
- [ ] `declare_intent` → sets `trajectory.active_plan_id`, clears phase/task
- [ ] `map_context(trajectory)` → updates intent shift stamp
- [ ] `map_context(tactic/action)` → updates `active_phase_id` / `active_task_ids`

---

### Phase 5: Tool Consolidation & Cleanup

---

### US-023: Wire 6 canonical hivemind tools
**Description:** As a developer, I want the 6 unified hivemind-*.ts tools wired into index.ts.

**Acceptance Criteria:**
- [ ] `src/index.ts` registers 6 tools (was 10)
- [ ] Tools: hivemind_session, hivemind_inspect, hivemind_memory, hivemind_anchor, hivemind_hierarchy, hivemind_cycle
- [ ] All 6 tools slimmed to ≤100 lines (business logic in libs)

---

### US-024: Delete 13 old tool files
**Description:** As a developer, I want dead tool files removed to eliminate confusion.

**Acceptance Criteria:**
- [ ] Delete: declare-intent.ts, map-context.ts, compact-session.ts, scan-hierarchy.ts, save-anchor.ts, think-back.ts, save-mem.ts, recall-mems.ts, hierarchy.ts, export-cycle.ts, check-drift.ts, list-shelves.ts, self-rate.ts
- [ ] Update `src/tools/index.ts` to export only 6 canonical tools
- [ ] Update `classifyTool()` in detection.ts to recognize new names

---

### US-025: Update documentation
**Description:** As a user, I want documentation to reflect the new tool structure.

**Acceptance Criteria:**
- [ ] Update `AGENTS.md` with new tool names
- [ ] Update `README.md` with new tool list
- [ ] Update CLI help text

---

### Phase 6: Testing & Verification

---

### US-026: Create graph schema tests
**Description:** As a developer, I want unit tests for Zod schema validation.

**Acceptance Criteria:**
- [ ] Create `tests/graph-nodes.test.ts`
- [ ] Test: valid/invalid nodes
- [ ] Test: FK constraints (orphan rejection)

---

### US-027: Create cognitive packer tests
**Description:** As a developer, I want unit tests for the packer's core functions.

**Acceptance Criteria:**
- [ ] Create `tests/cognitive-packer.test.ts`
- [ ] Test: XML output format
- [ ] Test: TTS filtering
- [ ] Test: Time Machine (false_path pruning)
- [ ] Test: FK resolution

---

### US-028: Create graph I/O tests
**Description:** As a developer, I want unit tests for atomic writes and validation.

**Acceptance Criteria:**
- [ ] Create `tests/graph-io.test.ts`
- [ ] Test: CRUD operations
- [ ] Test: atomic writes
- [ ] Test: Zod validation on I/O

---

### US-029: Create migration tests
**Description:** As a developer, I want unit tests for the graph migration.

**Acceptance Criteria:**
- [ ] Create `tests/graph-migrate.test.ts`
- [ ] Test: old→new format conversion
- [ ] Test: backup creation
- [ ] Test: dual-read fallback

---

### US-030: Create session swarm tests
**Description:** As a developer, I want unit tests for swarm spawning and 80% splitting.

**Acceptance Criteria:**
- [ ] Create `tests/session-swarm.test.ts`
- [ ] Test: 80% split trigger
- [ ] Test: headless spawn with noReply
- [ ] Test: context injection (mock SDK client)

---

### US-031: Full regression test
**Description:** As a developer, I want to verify no regressions after the overhaul.

**Acceptance Criteria:**
- [ ] All 126 tests pass
- [ ] `npx tsc --noEmit` passes
- [ ] `node bin/hivemind-tools.cjs source-audit` shows no dead tools
- [ ] Manual test: start session → update hierarchy → save mem → inspect → compact → verify graph state

---

### Phase 7: OpenTUI Cognitive Dashboard

*Transform the terminal from "scrolling logs of conversational garbage" into a static, reactive, highly structured HUD that proves governance is working.*

---

### US-032: Migrate from Ink to OpenTUI
**Description:** As a developer, I want to migrate the dashboard from Ink to OpenTUI (https://opentui.com — `anomalyco/opentui`) for first-class integration with the OpenCode ecosystem.

**Acceptance Criteria:**
- [ ] Add dependencies: `@opentui/react`, `@opentui/core`, `react` (>=19.0.0)
- [ ] Remove Ink dependencies from package.json
- [ ] **Bun runtime required** — OpenTUI requires Bun. Add `"engines": { "bun": ">=1.0.0" }`
- [ ] Update TypeScript config with `"jsxImportSource": "@opentui/react"`
- [ ] Create `src/dashboard/opentui/Dashboard.tsx` using OpenTUI React JSX intrinsics: `<text>`, `<box>`, `<scrollbox>`, `<input>`, `<select>`, `<tab-select>`, `<diff>`, `<code>`
- [ ] Entry point: `createCliRenderer()` from `@opentui/core`, `createRoot(renderer)` from `@opentui/react`
- [ ] **CRITICAL**: Use `renderer.destroy()` to exit — NEVER `process.exit()`
- [ ] Text styling via nested modifier tags (`<strong>`, `<em>`, `<u>`, `<span fg="...">`) — NOT props on `<text>`

---

### US-033: Build TelemetryHeader component
**Description:** As a user, I want to see token pressure and session health at a glance with visual gauges.

**Acceptance Criteria:**
- [ ] `<TelemetryHeader>` uses `<box>` with `borderStyle="rounded"`
- [ ] Token pressure gauge: ASCII progress bar with 45deg striped fill `[████████░░] 80%` (Stitch pattern)
- [ ] Color coding: neon-green < 50%, neon-amber 50-75%, neon-red > 75%, critical > 80% (blink animation)
- [ ] Display: mode, governance status, automation level, active view indicator
- [ ] Show active swarm count with `.status-dot` spinner (cyan glow)
- [ ] Bilingual: all labels via `useI18n()` — EN: "Token Pressure", VI: "Áp Lực Token"

---

### US-034: Build TrajectoryPane component
**Description:** As a user, I want to see the Read-Head (active plan/phase/task) as an interactive tree.

**Acceptance Criteria:**
- [ ] `<TrajectoryPane>` renders tree via `graph/trajectory.json`
- [ ] Show: EPIC → PHASE → TASK hierarchy with `.tree-line` dashed indentation (Stitch pattern)
- [ ] Status indicators: neon-green dot = Active, neon-amber dot = Pending, checkmark = Complete
- [ ] File locks displayed as `Lock: src/schema.ts`
- [ ] Width: 3 cols in 12-col grid layout (left sidebar)
- [ ] Expand/collapse with ▼/▶ arrows per Stitch screens 02/07
- [ ] Bilingual: panel title via `useI18n()` — EN: "Cognitive Graph", VI: "Đồ Thị Nhận Thức"

---

### US-035: Build MemoryPane component
**Description:** As a user, I want to see active memories grouped by shelf with staleness indicators.

**Acceptance Criteria:**
- [ ] `<MemoryPane>` renders mems from `graph/mems.json`
- [ ] Group by shelf: Architecture Decisions, Synthesized Knowledge, False Paths
- [ ] Apply `<span fg="#666666">` (dimmed) + "✗ " prefix to `type: "false_path"` memories (OpenTUI has no strikethrough)
- [ ] Show TTS indicator: `Expires in 72h unless linked`
- [ ] Show origin: `Origin: Headless Swarm #A4` (linked via `origin_task_id` FK)
- [ ] Width: part of center 6-col section in main dashboard (Stitch layout)
- [ ] Bilingual: panel title via `useI18n()` — EN: "Active Context", VI: "Ngữ Cảnh Hiện Tại"; shelf names translated

---

### US-036: Build AutonomicLog component
**Description:** As a user, I want to see live hook/tool events in a scrolling log.

**Acceptance Criteria:**
- [ ] `<AutonomicLog>` uses `<scrollbox>` for last 50 events
- [ ] Timestamp + event type + message format
- [ ] Color coding: HOOK (cyan), GATE (yellow), TOOL (magenta)
- [ ] Events: `messages.transform` injection, Pre-Stop Gate, tool executions
- [ ] Height: 5-8 lines

---

### US-037: Build InteractiveFooter component
**Description:** As a user, I want keyboard shortcuts to control HiveMind from the dashboard.

**Acceptance Criteria:**
- [ ] Use `useKeyboard` hook from `@opentui/react`
- [ ] `[R]` - Force re-pack of cognitive state
- [ ] `[S]` - Manual 80% session split trigger
- [ ] `[P]` - Prune stale/false_path mems
- [ ] `[L]` - Toggle language (EN/VI)
- [ ] `[ESC]` / `[Q]` - Unmount dashboard
- [ ] Display shortcuts as footer: `[R] Refresh | [S] Split | [P] Prune | [ESC] Quit`

---

### US-038: Wire dashboard to cognitive packer
**Description:** As the system, I want the dashboard to consume the cognitive packer output for real-time state.

**Acceptance Criteria:**
- [ ] Create `useHivemindState()` hook
- [ ] Subscribe to file changes via `fs.watch` on `graph/*.json`
- [ ] Call `packCognitiveState()` on state change
- [ ] Parse XML into dashboard model
- [ ] React state updates trigger re-render

---

### US-039: Implement token pressure from SDK
**Description:** As the system, I want accurate token usage from the OpenCode SDK.

**Acceptance Criteria:**
- [ ] Use `client.session.get()` to fetch session details
- [ ] Extract token counts from session response
- [ ] Calculate percentage against 128k context window
- [ ] Update gauge in real-time

---

### US-040: Build SwarmMonitor component
**Description:** As a user, I want to see active headless swarms with their status.

**Acceptance Criteria:**
- [ ] `<SwarmMonitor>` displays swarms from `sessions/active/swarms/`
- [ ] Show: swarm type, parent session, prompt excerpt, status spinner
- [ ] Count indicator: `Active Swarms: 1`
- [ ] Link to parent task via `origin_task_id`

---

### US-041: Create slash command entry point
**Description:** As a user, I want to launch the dashboard via `/hivemind-dashboard` slash command.

**Acceptance Criteria:**
- [ ] Add `hivemind-dashboard` slash command in plugin
- [ ] Command launches OpenTUI dashboard in fullscreen
- [ ] On exit, returns to normal CLI flow
- [ ] Handle missing dependencies gracefully

---

### US-042: Dashboard accessibility and responsiveness
**Description:** As a user, I want the dashboard to adapt to terminal size changes.

**Acceptance Criteria:**
- [ ] Use `useTerminalDimensions()` and `useOnResize()` hooks
- [ ] Minimum supported: 80x24 terminal
- [ ] Truncate content gracefully on small terminals
- [ ] Expand panels on larger terminals

---

### US-043: Dashboard tests
**Description:** As a developer, I want comprehensive tests for the dashboard components.

**Acceptance Criteria:**
- [ ] Create `tests/dashboard-opentui.test.ts`
- [ ] Test: component rendering with mock state
- [ ] Test: keyboard input handling
- [ ] Test: token gauge calculations
- [ ] Test: hierarchy tree rendering

---

### US-044: Build i18n/bilingual infrastructure
**Description:** As a user, I want to toggle between English and Vietnamese in all dashboard components.

**Acceptance Criteria:**
- [ ] Create `src/dashboard/i18n/translations.ts` with EN and VI dictionaries
- [ ] All panel titles, labels, footer shortcuts, status text have translation keys
- [ ] Technical terms preserved in English: UUID, XML, JSON, READ_HEAD, ACTIVE, DONE
- [ ] `[L]` keyboard shortcut toggles language; persisted in `.hivemind/system/config.json`
- [ ] Vietnamese translations match Stitch screens 07-11 exactly (e.g., "Đồ Thị Nhận Thức", "Chỉ Số Hệ Thống", "Nhật Ký Công Cụ")
- [ ] `useI18n()` hook returns `t(key)` function + current locale

---

### US-045: Build SwarmOrchestratorView component
**Description:** As a user, I want to see active agent swarms as an ASCII topology with real-time communication monitoring.

**Acceptance Criteria:**
- [ ] `<SwarmOrchestratorView>` renders ASCII tree of agent hierarchy (Stitch screens 04/09)
- [ ] Agent status dots: `.status-thinking` (purple pulse), `.status-idle` (gray), `.status-api` (cyan glow), `.status-crit` (pink blink-fast)
- [ ] Agent state cards in right sidebar (3 cols) with name, status, API call count, last action
- [ ] CommunicationBus panel: scrolling JSON message stream with color-coded types (PUB=cyan, ACK=green, ERR=red, HBT=gray)
- [ ] Filter tabs: `[ALL]`, `[ERRORS]`, `[HANDSHAKES]` (Vietnamese: `[TẤT CẢ]`, `[LỖI]`, `[BẮT TAY]`)
- [ ] Data source: `sessions/active/swarms/` directory
- [ ] Bilingual: all labels via `useI18n()` (see US-044)

---

### US-046: Build TimeTravelDebuggerView component
**Description:** As a user, I want to replay state history with diff visualization and playback controls.

**Acceptance Criteria:**
- [ ] `<TimeTravelDebuggerView>` renders state chronicle timeline + diff viewer (Stitch screens 05/10)
- [ ] StateChronicle sidebar (3 cols): chronological events with green/red/blue badges, clickable to select
- [ ] DiffViewer (9 cols): uses OpenTUI native `<diff>` component with `oldCode`/`newCode` props, `mode="split"`, `showLineNumbers`, `language="xml"` for syntax highlighting
- [ ] DiffViewer theme: `addedBg` (neon-green), `removedBg` (neon-red) per Stitch design
- [ ] PlaybackControls: `[H]` Rewind, `[SPACE]` Pause/Play, `[L]` Forward, timeline scrubber with position markers
- [ ] Speed control: 1x/2x/4x toggle
- [ ] Data source: `sessions/archive/compacted/` for historical states
- [ ] REPLAY mode indicator in header
- [ ] Bilingual: all labels via `useI18n()` (see US-044)

---

### US-047: Build ToolRegistryView component
**Description:** As a user, I want to browse, inspect, and configure registered tools from the dashboard.

**Acceptance Criteria:**
- [ ] `<ToolRegistryView>` renders catalog table + schema preview + config (Stitch screens 06/11)
- [ ] CatalogTable (8 cols): sortable columns (ID, type, status, avg runtime, call count), status badges (ENABLED=green, WARN=amber, DISABLED=red, LOCKED=red)
- [ ] SchemaPreview (4 cols top): uses OpenTUI native `<code>` component with `language="json"`, `showLineNumbers` for Zod schema viewing
- [ ] ConfigOverrides (4 cols bottom): per-tool toggle (enable/disable), timeout input, retry policy select
- [ ] CommandInput: terminal-style command buffer with blinking cursor for direct tool invocation
- [ ] Row selection with `.selected-row` highlight and green left border
- [ ] Data source: tool registry from `src/index.ts` canonical tools
- [ ] Bilingual: all labels via `useI18n()` (see US-044)

---

### US-048: Build MemCreationModal component
**Description:** As a user, I want a modal dialog to create new cognitive anchors/mems with graph linking.

**Acceptance Criteria:**
- [ ] `<MemCreationModal>` renders as overlay with backdrop blur (Stitch screens 03/08)
- [ ] Decorative double border (╔╗╚╝) with neon green accent
- [ ] Form fields: RelevanceScore (0.0-1.0), MemType (INSIGHT|CORRECTION|HEURISTIC|CONSTRAINT), Content (textarea, 512 char limit with counter), NodeLinker (checkboxes for active tasks/phases/mems)
- [ ] Keyboard shortcuts: `[ESC]` Cancel, `[CTRL+S]` Save
- [ ] On save: calls `addGraphMem()` from `src/lib/graph-io.ts` with proper FKs
- [ ] Validates via Zod MemNode schema before saving
- [ ] Bilingual: all labels via `useI18n()` (see US-044)

---

### US-049: Implement dashboard view navigation
**Description:** As a user, I want to switch between the 5 dashboard views using keyboard shortcuts.

**Acceptance Criteria:**
- [ ] Use OpenTUI `<tab-select>` component for view tabs in header, or `[1-5]` keyboard shortcuts
- [ ] `[TAB]` cycles forward through views, `[SHIFT+TAB]` cycles backward
- [ ] `[M]` opens Mem Creation Modal from any view
- [ ] Active view indicator in header/footer
- [ ] State preserved when switching views (scroll position, selections)
- [ ] Default view on launch: Main Dashboard

---

### US-050: Dashboard design system (TUI tokens)
**Description:** As a developer, I want a shared design system matching the Stitch mockups for consistent OpenTUI rendering.

**Acceptance Criteria:**
- [ ] Create `src/dashboard/theme.ts` with color tokens: neon-green (#00ff41), neon-amber (#ffb000), neon-blue (#00f0ff), neon-purple (#bd00ff), neon-pink (#ff0055), neon-red (#ff3333)
- [ ] Background tokens: bg-main (#0d0d0d), bg-panel (#111111), bg-swarm (#13131a), border (#333333)
- [ ] Reusable components: `<TuiPanel>` (border + floating title), `<StatusDot>` (4 variants), `<ProgressGauge>` (striped fill), `<SyntaxBlock>` (XML/JSON highlighting)
- [ ] Animation helpers via `useTimeline()` from `@opentui/react`: scanline sweep, blink pulse, status-dot variants, progress bar fill
- [ ] All tokens consumed by Views US-033 through US-049
- [ ] Reference: OpenTUI skill at `.opencode/skills/opentui/` and https://opentui.com

---

### Phase 8: Advanced Automation (NEW from Gemini Autonomous Findings)

---

### US-051: Auto-Context State
**Description:** As the system, I want to automatically track session focus and auto-wire foreign keys to reduce manual cognitive load.

**Acceptance Criteria:**
- [ ] Create `src/lib/auto-context.ts` with `trackFocusState(sessionId, action)` function
- [ ] System tracks: last modified file, active task, recent commands, focus drift
- [ ] Auto-wire: when creating mems, automatically infer `origin_task_id` from active focus
- [ ] Auto-wire: when creating tasks, automatically set `parent_phase_id` from active phase
- [ ] Focus drift detection: if file changes unrelated to active task, suggest context switch
- [ ] Integrate with `map_context` tool to auto-populate FK suggestions
- [ ] Configurable: enable/disable via config.json `autoContext.enabled`

---

### US-052: Linter Agent (Janitor)
**Description:** As the system, I want a scheduled background agent to continuously validate graph integrity and fix common issues.

**Acceptance Criteria:**
- [ ] Create `src/lib/linter-agent.ts` with `runLinterCheck(directory)` function
- [ ] Scheduled execution: runs every 10 minutes (configurable via config.json `linter.interval`)
- [ ] Validation checks:
  - Orphan detection: nodes with invalid FK references
  - Staleness violations: mems past `staleness_stamp` not linked to active tasks
  - Duplicates: multiple mems with same content hash
  - Schema violations: nodes not matching Zod schemas
- [ ] Auto-fix capabilities:
  - Mark invalid FKs as "orphaned" status
  - Archive stale mems to `sessions/archive/stale/`
  - Merge duplicate mems, preserve newer timestamp
- [ ] Reporting: save lint results to `sessions/lint-YYYY-MM-DD-HHMMSS.json`
- [ ] Integration with dashboard: show lint health status in TelemetryHeader
- [ ] Non-blocking: runs in background via cron-like scheduler, never blocks user operations

---

## Functional Requirements

- **FR-1:** All graph nodes MUST have UUID `id` field
- **FR-2:** TaskNode MUST have `parent_phase_id` FK (non-nullable)
- **FR-3:** MemNode MUST have `origin_task_id` FK (nullable), `type`, `staleness_stamp`
- **FR-4:** Tools MUST be ≤100 lines with no business logic (only Zod + lib call)
- **FR-5:** Hooks MUST call Libraries for state compilation (no inline business logic)
- **FR-6:** Cognitive Packer MUST output dense XML with budget cap (12% of context window)
- **FR-7:** Migration MUST be non-destructive (preserve .bak backups)
- **FR-8:** Session split MUST use `parentID` for SDK linkage
- **FR-9:** All 6 canonical tools MUST be wired in index.ts
- **FR-10:** 13 old tool files MUST be deleted
- **FR-11:** Swarm writes MUST use file locking/mutex for concurrency safety
- **FR-12:** Auto-Context State MUST be opt-in via config.json
- **FR-13:** Linter Agent MUST be non-blocking and configurable

## Non-Goals

- **NG-1:** No AI-assisted semantic analysis (pure deterministic logic)
- **NG-2:** No distributed session state (single-process Actor Model)
- **NG-3:** No automatic plan detection from docs (user links manually)
- **NG-4:** No backward compatibility for external consumers (semver v3.0.0 breaking)
- **NG-5:** No distributed session state (single-process Actor Model)
- **NG-6:** No automatic context forcing without user consent (auto-context is suggestion only)
- **NG-7:** No invasive auto-fixes without user approval (linter reports only, manual confirmation required)

## Technical Considerations

- **Performance:** Cognitive packer should complete in <10ms for typical session state
- **Memory:** Graph files should stay under 1MB each (enforce via budget)
- **SDK Version:** Requires OpenCode SDK v2026.x for `noReply` support
- **OpenTUI:** Dashboard uses `@opentui/react` v0.1.x (https://opentui.com, `anomalyco/opentui`). **Requires Bun runtime** (not Node.js). Requires Zig for native builds.
- **Migration:** One-time auto-trigger on first hook invocation OR explicit `hivemind migrate` command
- **Testing:** Use mock SDK client for swarm/spawn tests. Dashboard tests via `@opentui/react/test-utils`
- **Concurrency:** File locking via `src/lib/file-lock.ts` for swarm writes
- **Auto-Context:** Focus tracking via session lifecycle hooks, inference heuristics for FK suggestions
- **Linter Agent:** Background scheduler using `setInterval` or node-cron, configurable interval

## Success Metrics

| Metric | Target |
|--------|--------|
| Dead code lines removed | ≥2,000 |
| Tool files (after cleanup) | 6 |
| Hook files (after refactor) | Same count, reduced lines |
| Test coverage | ≥90% on new files |
| Cognitive packer runtime | <10ms |
| All tests passing | 100% |
| Linter agent false positives | <5% |
| Auto-context accuracy | >80% |

## Dependencies

- Phase 1 → Phase 2 (schemas required for packer)
- Phase 2 → Phase 3 (packer required for hooks)
- Phase 1+2 → Phase 4 (schemas + graph-io required for migration)
- Phase 1+3 → Phase 5 (slim tools + updated hooks)
- All phases → Phase 6 (final verification)
- Phase 2+3 → Phase 7 (packer + hooks required for dashboard)
- Phase 1+2+3 → Phase 8 (schemas + packer + hooks required for auto-context + linter)

---

## Open Questions

1. Should we keep `check-drift.ts` functionality merged into `hivemind-inspect`? (DEFERRED to Phase 8 - Linter Agent may cover this)
2. What's the migration path for users with custom tool extensions?
3. Should `staleness_stamp` be absolute timestamp or relative TTL?
4. Should auto-context be enabled by default or opt-in? (RECOMMENDATION: opt-in)
5. Should linter agent auto-fix or only report? (RECOMMENDATION: report only, user confirmation required)

---

## Appendix A: Execution Blueprint (from file-level-execution-blueprint)

### A.1 Codebase Audit Results

**Tools Layer (21 files, 14,958 total lines):**
| File | Lines | Category | Action |
|------|-------|----------|--------|
| `src/tools/compact-session.ts` | 441 | Business Logic | Extract `compaction-engine.ts` |
| `src/tools/hivemind-session.ts` | 670 | Business Logic | Extract `session-engine.ts` |
| `src/tools/hivemind-inspect.ts` | 434 | Business Logic | Extract `inspect-engine.ts` |
| `src/tools/scan-hierarchy.ts` | 425 | Business Logic | Extract `brownfield-scan.ts` |
| `src/tools/hivemind-memory.ts` | 284 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-hierarchy.ts` | 282 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-cycle.ts` | 277 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-anchor.ts` | 228 | Dumb Wrapper | Consolidate |
| `src/tools/map-context.ts` | 227 | Business Logic | Keep, simplify |
| `src/tools/declare-intent.ts` | 134 | Business Logic | Keep, simplify |
| `src/tools/export-cycle.ts` | 141 | Business Logic | Keep |
| `src/tools/think-back.ts` | 166 | Business Logic | Extract to lib |
| `src/tools/save-mem.ts` | 63 | Dumb Wrapper | Delete (absorb) |
| `src/tools/recall-mems.ts` | 135 | Dumb Wrapper | Delete (absorb) |
| `src/tools/list-shelves.ts` | 69 | Dumb Wrapper | Delete (absorb) |
| `src/tools/save-anchor.ts` | 105 | Dumb Wrapper | Delete (absorb) |
| `src/tools/self-rate.ts` | 87 | Dumb Wrapper | Keep |
| `src/tools/check-drift.ts` | 83 | Dumb Wrapper | Keep |

**Consolidation Target:** 13 old tool files → 6 canonical tools

**Lib Layer (24 files):**
| File | Lines | Purity | Notes |
|------|-------|--------|-------|
| `src/lib/planning-fs.ts` | 1027 | Impure | Split into 3 modules |
| `src/lib/detection.ts` | 882 | 90% Pure | Signal compilation |
| `src/lib/hierarchy-tree.ts` | 874 | 90% Pure | Tree operations |
| `src/lib/manifest.ts` | 479 | Impure | File I/O |
| `src/lib/paths.ts` | 438 | Pure | Single source of truth |
| `src/lib/persistence.ts` | 374 | Impure | Core I/O |
| `src/lib/migrate.ts` | 333 | Pure | Migration logic |
| `src/lib/mems.ts` | 115 | Pure | State transformations |
| `src/lib/anchors.ts` | 66 | Pure | State transformations |

### A.2 Team Assignment

| Team | Stories | Stitch Project | GitHub Issue |
|------|---------|----------------|--------------|
| LOCAL | 33 | `projects/9051349330813916457` | https://github.com/shynlee04/hivemind-plugin/issues/55 |
| JULES | 17 | `projects/18146358756909814967` | https://github.com/shynlee04/hivemind-plugin/issues/56 |

### A.3 Verification Commands

```bash
# Fast gate
npx tsc --noEmit

# Functional gate
npm test

# Public branch policy gate (pre-master only)
npm run guard:public

# Full verification
npm run typecheck && npm test && npm run guard:public
```

### A.4 Naming Conventions

**Branch Naming:**
- LOCAL: `local/us-<id>-<slug>` (e.g., `local/us-001-graph-node-schemas`)
- JULES: `jules/us-<id>-<slug>` (e.g., `jules/us-032-opentui-migration`)

**Commit Messages:**
- Format: `<type>(<scope>): <description> (#issue)`
- Examples:
  - `feat(schemas): add graph node Zod schemas (#55)`
  - `refactor(dashboard): migrate from Ink to OpenTUI (#56)`

**File Naming:**
- Components: PascalCase (e.g., `TelemetryHeader.tsx`)
- Libraries: kebab-case (e.g., `compaction-engine.ts`)
- Tests: match source file (e.g., `graph-nodes.test.ts`)

---

## Appendix B: Stitch Design Reference

All 11 Stitch MCP design screens have been analyzed. Screens 2-6 are English, screens 7-11 are their Vietnamese equivalents. Screen 1 is the PRD document itself.

| Screen | View | Language | File |
|--------|------|----------|------|
| 01 | PRD document (not UI) | EN | `docs/stitch-screens/screen-01.html` |
| 02 | Main Dashboard (Graph + Context + Packer + Vitals) | EN | `docs/stitch-screens/screen-02.html` |
| 03 | Modal Dialog (Create New Mem / Cognitive Anchor) | EN | `docs/stitch-screens/screen-03.html` |
| 04 | Swarm Orchestrator (ASCII Topology + Agent States + Comms Bus) | EN | `docs/stitch-screens/screen-04.html` |
| 05 | Time Travel Debugger (State Chronicle + Diff Viewer + Playback) | EN | `docs/stitch-screens/screen-05.html` |
| 06 | Tool Registry (Catalog Table + Schema Preview + Config) | EN | `docs/stitch-screens/screen-06.html` |
| 07 | Main Dashboard (Vietnamese) | VI | `docs/stitch-screens/screen-07.html` |
| 08 | Modal Dialog (Vietnamese) | VI | `docs/stitch-screens/screen-08.html` |
| 09 | Swarm Orchestrator (Vietnamese) | VI | `docs/stitch-screens/screen-09.html` |
| 10 | Time Travel Debugger (Vietnamese) | VI | `docs/stitch-screens/screen-10.html` |
| 11 | Tool Registry (Vietnamese) | VI | `docs/stitch-screens/screen-11.html` |

**Design System (Extracted from Stitch Screens):**

**Layout:** 12-column CSS Grid (`grid-cols-12`). Panels use `.tui-border` with `.tui-title` floating headers.

**Color Tokens (CSS Variables):**
- `--neon-green: #00ff41` — Active, success, primary accent
- `--neon-amber: #ffb000` — Warning, pending, active phase
- `--neon-blue: #00f0ff` — Info, cyan accents, API status
- `--neon-purple: #bd00ff` — Busy/thinking nodes (swarm view)
- `--neon-pink: #ff0055` — Critical, flagged errors
- `--neon-red: #ff3333` — Errors, removed diff lines
- Background: `#0d0d0d` (dark), `#111111` (panel), `#13131a` (swarm purple-tinted)
- Border: `#333333`

**Typography:** JetBrains Mono monospace throughout. Uppercase + letter-spacing for panel titles.

**Animations:** `.scanline` (green gradient sweep), `.blink` (opacity pulse), `.status-dot` variants (pulse/glow/blink-fast), progress bars with 45deg striped gradient.

**Bilingual Pattern:** Vietnamese labels (e.g., "Đồ Thị Nhận Thức", "Chỉ Số Hệ Thống") with English technical terms preserved (UUID, XML, JSON, READ_HEAD, ACTIVE, DONE). Toggle via `[L]` keyboard shortcut.

**5 Distinct Views:** Main Dashboard, Modal (Mem Creation), Swarm Orchestrator, Time Travel Debugger, Tool Registry.

---

## Appendix C: Dashboard Architecture Overview

```
DashboardApp (OpenTUI React — @opentui/react + @opentui/core, Bun runtime) — 5 Views (Stitch-validated)
│
├─ [VIEW 1] Main Dashboard (Stitch Screens 02/07)
│  ├── TelemetryHeader (Token gauge, Mode, Swarms)
│  ├── MainContent (12-col Grid: 3|6|3)
│  │   ├── CognitiveGraphPane (Left 3 cols) — trajectory→plan→phase→task tree
│  │   ├── ContextPane (Center 6 cols)
│  │   │   ├── ActiveContext (current focus, file locks)
│  │   │   └── PackerPreview (live XML preview, syntax highlighted)
│  │   └── VitalsPane (Right 3 cols)
│  │       ├── SystemVitals (token pressure bar, drift score, governance health)
│  │       └── ToolLog (last 10 tool executions)
│  └── InteractiveFooter ([R] Refresh [S] Split [P] Prune [L] Language [ESC] Quit)
│
├─ [VIEW 2] Modal: Create Mem / Cognitive Anchor (Stitch Screens 03/08)
│  ├── ModalOverlay (backdrop blur)
│  └── ModalBox (double border ╔╗╚╝)
│      ├── RelevanceScore (0.0-1.0 number input)
│      ├── MemType (INSIGHT | CORRECTION | HEURISTIC | CONSTRAINT)
│      ├── ContentInput (textarea, 512 char limit)
│      ├── NodeLinker (checkbox list — link to tasks/phases/mems)
│      └── Shortcuts: [ESC] Cancel, [CTRL+S] Save
│
├─ [VIEW 3] Swarm Orchestrator (Stitch Screens 04/09)
│  ├── Header (orchestration ID, swarm status, latency)
│  ├── ASCIITopology (9 cols) — agent hierarchy tree with status nodes
│  ├── AgentStates (3 cols) — status cards per agent
│  └── CommunicationBus — JSON message stream (PUB/ACK/ERR/HBT)
│
├─ [VIEW 4] Time Travel Debugger (Stitch Screens 05/10)
│  ├── StateChronicle (3 cols) — timeline sidebar with event badges
│  ├── DiffViewer (9 cols) — side-by-side before/after XML state
│  └── PlaybackControls — [H] Rewind, [SPACE] Pause, [L] Forward, timeline scrubber
│
└─ [VIEW 5] Tool Registry (Stitch Screens 06/11)
   ├── CatalogTable (8 cols) — sortable/filterable tool list with status badges
   ├── SchemaPreview (4 cols top) — JSON Zod schema viewer
   ├── ConfigOverrides (4 cols bottom) — toggle/input per-tool settings
   └── CommandInput — terminal-style command buffer
```

**Data Flow:**
```
graph/*.json ─fs.watch─→ useHivemindState() ─React state─→ Dashboard re-render
```

**Integration with Cognitive Packer:**
```
packCognitiveState() ─XML─→ Dashboard parses ─Model─→ Panels render
```

**View Navigation:**
```
[TAB] or [1-5] keys cycle between views
Main Dashboard is default view on launch
```

---

## Appendix D: Parallel Execution Waves (from file-level-execution-blueprint)

### D.1 LOCAL Waves

```
WAVE L0 (Sequential):
  US-001 → US-002 → US-003

WAVE L-A (Parallel after US-003):
  US-004, US-005, US-006, US-007, US-008

WAVE L-B (Parallel schema/I-O):
  US-014, US-018, US-026, US-028

WAVE L-C (Parallel after US-010):
  US-011, US-012, US-038

WAVE L-D (Parallel post-splitter):
  US-021, US-039

WAVE L-E (Sequential):
  US-009 → US-013 → US-015 → US-016 → US-017
  US-019 → US-020 → US-022 → US-023 → US-024 → US-025
  US-027 → US-029 → US-030 → US-031
```

### D.2 JULES Waves

```
WAVE J0 (Sequential):
  US-032 (Ink → OpenTUI migration)

WAVE J-A (Parallel after US-032):
  US-033, US-034, US-035, US-036, US-037, US-040, US-041, US-044, US-050

WAVE J-B (Parallel):
  US-042, US-043, US-045, US-046, US-047, US-048

WAVE J-C (Sequential):
  US-049 (view navigation)
```

### D.3 Integration Gates

**Gate G0 - Setup and Carding**
- Stitch project boards created
- All story cards created with dependency links

**Gate G1 - Foundations Complete**
- LOCAL: US-003 done, L-A started
- JULES: US-032 done, J-A started
- Evidence: `npm test`, `npx tsc --noEmit` pass

**Gate G2 - Contract Freeze**
- LOCAL: US-010, US-011, US-012, US-013, US-015 done
- JULES: US-033, US-035, US-040, US-044 done
- Evidence: Contract doc attached (packer payload keys, token pressure)

**Gate G3 - Integration Stabilization**
- LOCAL: US-020, US-021, US-023, US-038, US-039 done
- JULES: US-041, US-045, US-046, US-047, US-048, US-049 done
- Evidence: Dashboard renders with packer data, token pressure visible

**Gate G4 - Release Candidate**
- LOCAL: US-031 done (full regression)
- JULES: US-042, US-043, US-050 done
- Evidence: All tests green, guard passes

[/PRD]

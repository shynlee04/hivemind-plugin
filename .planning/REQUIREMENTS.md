# Requirements: Harness Cleanup + V3 Runtime

**Defined:** 2026-04-06
**Last Updated:** 2026-04-06 — V3 runtime features added as Phase 2+
**Core Value:** Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references. V3 extends the harness into a runtime composition engine with background agents, delegation chains, concurrency control, and schema-driven injection.

---

## v1 Requirements: Harness Cleanup

### Dead Code Removal

- [ ] **DEAD-01**: Delete `.opencode/tools/` directory (all 5 files: prompt-skim, prompt-analyze, context-budget, session-patch, safe-tool)
- [ ] **DEAD-02**: Delete duplicate test files (`tests/tools/prompt-skim.test.ts`, `prompt-analyze.test.ts`, `context-budget.test.ts`, `session-patch.test.ts`, `safe-tool.test.ts`)
- [ ] **DEAD-03**: Delete `tests/plugins/prompt-enhance.test.ts` (masks double-count bug)

### Test Consolidation

- [ ] **TEST-01**: Rename `tests/tools/*-tool.test.ts` files to `tests/tools/*.test.ts`

### HIGH: Critical Bugs

- [ ] **HIGH-01**: Fix double-compaction counting — remove event hook's `session.compacted` handling, keep only `experimental.session.compacting`
- [ ] **HIGH-02**: Fix session-patch heading corruption — anchor regex to line start: `(?:^|\n)(${escapedSection})[\s\S]*?(?=\n## |$)`
- [ ] **HIGH-03**: Fix orchestrator references to 5 non-existent agents — either define missing agents or route to existing researcher/builder/critic

### MEDIUM: Functional Bugs

- [ ] **MED-01**: Gate system-transform by delegation metadata — prevent 804-char injection into non-prompt-enhance sessions
- [ ] **MED-02**: Fix prompt-analyze to detect cross-line contradictions — compare all line pairs, not just within single lines

### LOW: Model & Quality

- [ ] **LOW-01**: Rebuild context-budget with real OpenCode compaction data — replace fake 15% linear model
- [ ] **LOW-02**: Remove `prompt-skim` recommended_lanes (phantom agent references)
- [ ] **LOW-03**: Remove system-transform hook wiring from plugin.ts
- [ ] **LOW-04**: Remove PromptEnhancePlugin event forwarding for compaction from plugin.ts

### Quality Gates

- [ ] **QUAL-01**: Zero dead text injected into non-prompt-enhance sessions
- [ ] **QUAL-02**: Double-count scenario explicitly tested as NOT happening
- [ ] **QUAL-03**: `npm run typecheck` passes
- [ ] **QUAL-04**: `npm test` passes (all tests, no false positives)
- [ ] **QUAL-05**: `npm run build` passes

---

## v2 Requirements: Deferred

Deferred to future release. Tracked but not in current roadmap.

### Schema Consumers

- **SCHEMA-01**: Build consumer for PipelineStateSchema (schema exists but no consumer yet)
- **SCHEMA-02**: Wire EnhancedPromptOutputSchema as target contract for pipeline output

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Remove any src/tools/ components | All kept and fixed — all contribute to AI agent workflows |
| Remove EnhancedPromptOutputSchema | Defines pipeline's final deliverable — target contract |
| Remove PipelineStateSchema | Core orchestration concept — build consumer, don't kill contract |
| Remove tool-helpers.ts | 5 LOC convention anchor — scattering format across tools is worse |
| Touch .hivemind/ runtime state files | Runtime output, not source code — wrong category for cleanup |
| Add new features | This is cleanup only — no feature additions |
| Restructure plugin.ts beyond bug fixes | Minimal changes to fix confirmed bugs only |

---

## v1 Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 | Phase 1 | Pending |
| DEAD-02 | Phase 1 | Pending |
| DEAD-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| HIGH-01 | Phase 2 | Pending |
| HIGH-02 | Phase 2 | Pending |
| HIGH-03 | Phase 2 | Pending |
| MED-01 | Phase 3 | Pending |
| MED-02 | Phase 3 | Pending |
| LOW-01 | Phase 4 | Pending |
| LOW-02 | Phase 4 | Pending |
| LOW-03 | Phase 4 | Pending |
| LOW-04 | Phase 4 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| QUAL-04 | Phase 5 | Pending |
| QUAL-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---

## Phase 2: Runtime Architecture

Priority-ordered sub-phases building the V3 runtime composition engine.

### RUN-3a: Background Agents

| Field | Value |
|-------|-------|
| **ID** | RUN-3a |
| **Category** | Runtime Architecture |
| **Priority** | P0 — Foundation for all subsequent runtime features |
| **Status** | Complete |
| **Dependencies** | None (Phase 2 kickoff) |
| **Description** | Agents run in background processes, spawn in new terminal panes, and auto-cleanup on completion. Background agents enable parallel work streams without blocking the primary session. |
| **Acceptance Criteria** | 1. Background agent spawns in a new pane (tmux or equivalent) without blocking the calling session.<br>2. Agent completes its task and exits cleanly with status code and result captured.<br>3. Auto-cup removes temporary agent state files on completion (success or failure).<br>4. Failed agents write error context to `.hivemind/delegation/` before cleanup.<br>5. Parent session can query background agent status at any time.<br>6. Test: `npm test` includes at least one background agent spawn/complete/cleanup test. |

### RUN-3b: Delegation Chain

| Field | Value |
|-------|-------|
| **ID** | RUN-3b |
| **Category** | Runtime Architecture |
| **Priority** | P0 — Required for cross-session task continuity |
| **Status** | Complete |
| **Dependencies** | RUN-3a (background agents) |
| **Description** | Task persistence across sessions with parent-child session tracking. Delegation packets carry task objective, scope boundaries, known facts, excluded assumptions, evidence gathered, required deliverable shape, validation rules, and stopping conditions. |
| **Acceptance Criteria** | 1. Delegation packet written to `.hivemind/delegation/` as JSON with all 8 required fields.<br>2. Parent-child session linkage tracked via `ses_id` and `subses_id` in `.hivemind/hierarchy/`.<br>3. Child session resumes delegation context from JSON on start.<br>4. Completed delegation marked with result and timestamp.<br>5. Test: delegation packet round-trips through parent→child→completion with all fields intact. |

### RUN-3c: Concurrency Control

| Field | Value |
|-------|-------|
| **ID** | RUN-3c |
| **Category** | Runtime Architecture |
| **Priority** | P0 — Required before multi-agent parallelism |
| **Status** | Partially complete — `src/lib/concurrency.ts` exists with keyed semaphore |
| **Dependencies** | None (existing code, needs integration) |
| **Description** | Keyed semaphore with FIFO queue for resource-constrained operations. Prevents resource exhaustion when multiple agents compete for the same tool, file, or API. |
| **Acceptance Criteria** | 1. `concurrency.ts` keyed semaphore supports named keys (e.g., file path, tool name).<br>2. FIFO ordering guaranteed per key — first requester gets access first.<br>3. Configurable max concurrency per key (default: 1 for exclusive, N for pooled).<br>4. Timeout on acquire with rejection and error message.<br>5. Test: concurrent acquire on same key serializes correctly; different keys run in parallel. |

### RUN-3d: Session Recovery

| Field | Value |
|-------|-------|
| **ID** | RUN-3d |
| **Category** | Runtime Architecture |
| **Priority** | P1 — Required for long-haul reliability |
| **Status** | Complete |
| **Dependencies** | RUN-3b (delegation chain), RUN-3c (concurrency) |
| **Description** | Context integrity and governance persist across session boundaries. When a session crashes or disconnects, recovery restores trajectory state, active delegations, pending tasks, and governance rules. |
| **Acceptance Criteria** | 1. Session state checkpointed to `.hivemind/state/brain.json` at configurable intervals.<br>2. On restart, last checkpoint loaded and active tasks resumed from last known state.<br>3. Governance rules (from RUN-3e) re-applied on recovery.<br>4. Recovery log written to `.hivemind/sessions/` with timestamp and restored state summary.<br>5. Test: simulate crash mid-task, restart, verify task resumes from checkpoint. |

### RUN-3e: Context Governance

| Field | Value |
|-------|-------|
| **ID** | RUN-3e |
| **Category** | Runtime Architecture |
| **Priority** | P1 — Required for long-haul sessions |
| **Status** | Pending |
| **Dependencies** | RUN-3d (session recovery) |
| **Description** | Rules that persist and enforce across long-haul sessions. Governance rules define what agents can/cannot do, budget limits, escalation paths, and violation handling. |
| **Acceptance Criteria** | 1. Governance rules defined as JSON in `.hivemind/state/` with rule ID, condition, action, and scope.<br>2. Rules evaluated before each tool execution via hook.<br>3. Violation logged and reported to parent session if delegated.<br>4. Rules can be added, removed, or modified at runtime without restart.<br>5. Test: rule violation triggers expected action (block, warn, escalate). |

### RUN-3f: Injection Engine

| Field | Value |
|-------|-------|
| **ID** | RUN-3f |
| **Category** | Runtime Architecture |
| **Priority** | P1 — Enables dynamic runtime behavior |
| **Status** | Pending |
| **Dependencies** | RUN-3e (context governance) |
| **Description** | Runtime conditional injection of rules, commands, skills, and tools based on session context, agent role, task type, and governance state. Replaces static `.md` file agent definitions with dynamic evaluation. |
| **Acceptance Criteria** | 1. Injection rules evaluated per-session with access to current context (agent, task type, trajectory, delegation state).<br>2. Rules inject rules, commands, skills, or tools conditionally — no static file dependency.<br>3. Injection respects governance rules (RUN-3e) — blocked rules never inject.<br>4. Injection log written per session for audit trail.<br>5. Test: session with matching conditions receives injection; session without matching conditions does not. |

### RUN-3g: Specialist Classification

| Field | Value |
|-------|-------|
| **ID** | RUN-3g |
| **Category** | Runtime Architecture |
| **Priority** | P2 — Improves agent routing quality |
| **Status** | Pending |
| **Dependencies** | RUN-3a (background agents), RUN-3b (delegation lineage/export context) |
| **Description** | Configurable agent presets for domains with category-based routing. Agents classified by specialty (researcher, builder, critic, conductor, coordinator, etc.) and dispatched based on task category. |
| **Acceptance Criteria** | 1. Agent presets defined with domain, triggers, tools, temperature, and max tool calls.<br>2. Task classification routes to best-matching specialist based on task description and category.<br>3. Fallback to generalist agent if no specialist matches.<br>4. Specialist assignment recorded in delegation packet (RUN-3b).<br>5. Test: task routed to correct specialist; mismatched task falls back to generalist. |

### RUN-3h: Tool Budget / Circuit Breaker

| Field | Value |
|-------|-------|
| **ID** | RUN-3h |
| **Category** | Runtime Architecture |
| **Priority** | P1 — Prevents resource exhaustion |
| **Status** | Partially complete — `CIRCUIT_BREAKER_THRESHOLD=16` and `MAX_TOOL_CALLS_PER_SESSION=400` exist in `src/plugin.ts` |
| **Dependencies** | RUN-3c (concurrency control) |
| **Description** | Per-session tool call limits with threshold-based shutdown. Circuit breaker triggers at configurable threshold; hard limit shuts down tool access entirely. Prevents runaway sessions from consuming unlimited resources. |
| **Acceptance Criteria** | 1. `CIRCUIT_BREAKER_THRESHOLD` configurable per session (default: 16).<br>2. `MAX_TOOL_CALLS_PER_SESSION` configurable per session (default: 400).<br>3. Threshold breach triggers warning to parent session with call count and remaining budget.<br>4. Hard limit breach blocks all further tool calls with error message.<br>5. Budget resets on session compact/restart.<br>6. Test: session exceeds threshold → warning emitted; session exceeds max → tool calls blocked. |

---

## Phase 3: Schema Definition

Frontmatter schemas for agents, commands, and skills with TypeScript type generation and runtime evaluation.

### SCH-5a: Agent Schema

| Field | Value |
|-------|-------|
| **ID** | SCH-5a |
| **Category** | Schema Definition |
| **Priority** | P1 — Required for specialist classification (RUN-3g) |
| **Status** | Pending |
| **Dependencies** | RUN-3g (specialist classification) |
| **Description** | YAML schema for Agent frontmatter defining triggers, conditions, tools, temperature, and domain classification. |
| **Acceptance Criteria** | 1. Schema validates: name, domain, triggers (string[]), conditions (key-value), tools (string[]), temperature (0-2), max_tool_calls (number).<br>2. Invalid agent YAML rejected with specific field error messages.<br>3. Schema supports optional `parent` field for agent inheritance.<br>4. Test: valid agent YAML passes validation; missing required fields rejected. |

### SCH-5b: Command Schema

| Field | Value |
|-------|-------|
| **ID** | SCH-5b |
| **Category** | Schema Definition |
| **Priority** | P1 — Required for command injection (RUN-3f) |
| **Status** | Pending |
| **Dependencies** | SCH-5a (agent schema) |
| **Description** | YAML schema for Command frontmatter defining arguments, bash injection, agent binding, and execution conditions. |
| **Acceptance Criteria** | 1. Schema validates: name, description, args (object with type/description/default), bash (string), agent (string, optional), conditions (object, optional).<br>2. Bash injection supports variable substitution from args.<br>3. Agent binding links command to specialist (SCH-5a).<br>4. Test: valid command YAML passes; invalid bash syntax rejected. |

### SCH-5c: Skill Schema

| Field | Value |
|-------|-------|
| **ID** | SCH-5c |
| **Category** | Schema Definition |
| **Priority** | P1 — Required for skill injection (RUN-3f) |
| **Status** | Pending |
| **Dependencies** | SCH-5a (agent schema) |
| **Description** | YAML schema for Skill frontmatter defining trigger patterns, prerequisites, layers, and activation conditions. |
| **Acceptance Criteria** | 1. Schema validates: name, trigger_patterns (regex[]), prerequisites (string[]), layers (string[]), activation (object with conditions).<br>2. Trigger patterns compile as valid regex.<br>3. Prerequisites reference existing skills or agents.<br>4. Test: valid skill YAML passes; invalid regex rejected. |

### SCH-5d: TypeScript Type Generation

| Field | Value |
|-------|-------|
| **ID** | SCH-5d |
| **Category** | Schema Definition |
| **Priority** | P1 — Required for type-safe schema consumption |
| **Status** | Pending |
| **Dependencies** | SCH-5a, SCH-5b, SCH-5c (all schemas) |
| **Description** | TypeScript types generated from YAML schemas for compile-time validation and IDE autocomplete. |
| **Acceptance Criteria** | 1. `src/schema-kernel/` contains generated types: `AgentDef`, `CommandDef`, `SkillDef`.<br>2. Types are strict — no `any` or optional fields that should be required.<br>3. Generated types include Zod validators for runtime validation.<br>4. `npm run typecheck` passes with generated types imported.<br>5. Test: schema-generated Zod validator rejects invalid data at runtime. |

### SCH-5e: Event Emitters and Trigger Evaluators

| Field | Value |
|-------|-------|
| **ID** | SCH-5e |
| **Category** | Schema Definition |
| **Priority** | P2 — Enables schema-driven runtime behavior |
| **Status** | Pending |
| **Dependencies** | SCH-5d (type generation), RUN-3f (injection engine) |
| **Description** | Event emitters and trigger evaluators that fire based on schema-defined conditions. Connects schema definitions to runtime behavior. |
| **Acceptance Criteria** | 1. Trigger evaluators match session context against schema-defined trigger patterns.<br>2. Event emitters dispatch to registered handlers when triggers match.<br>3. Handlers receive typed payload (from SCH-5d generated types).<br>4. Evaluation is performant — <10ms per trigger check.<br>5. Test: matching trigger fires handler; non-matching does not. |

---

## Phase 4: Migration Gate

Systematic migration of proven capabilities from `product-detox` into `harness-experiment` with validation.

### MIG-6a: Product-Detox Inventory

| Field | Value |
|-------|-------|
| **ID** | MIG-6a |
| **Category** | Migration |
| **Priority** | P2 — Prerequisite for all migration work |
| **Status** | Pending |
| **Dependencies** | None |
| **Description** | Full inventory of `product-detox` content excluding `.env`, tool config directories, and `node_modules`. Catalog tools, hooks, agents, commands, skills, schemas, and tests. |
| **Acceptance Criteria** | 1. Inventory written as JSON or markdown with: path, type (tool/hook/agent/command/skill/schema/test), LOC, dependencies, and last-modified date.<br>2. Exclusions applied: `.env*`, `node_modules/`, tool config directories.<br>3. Inventory covers all `src/`, `tests/`, `.opencode/`, and root governance files.<br>4. Test: inventory count matches `find` output for same exclusion rules. |

### MIG-6b: Capability Match

| Field | Value |
|-------|-------|
| **ID** | MIG-6b |
| **Category** | Migration |
| **Priority** | P2 — Informs migration decisions |
| **Status** | Pending |
| **Dependencies** | MIG-6a (inventory) |
| **Description** | Match `product-detox` capabilities against proven `harness-experiment` baseline. Identify gaps, overlaps, and unique capabilities in each codebase. |
| **Acceptance Criteria** | 1. Comparison matrix: each `product-detox` item mapped to equivalent, gap, or unique.<br>2. Overlaps documented with quality comparison (which is better maintained).<br>3. Unique capabilities flagged for migration consideration.<br>4. Test: matrix reviewed and approved by project maintainer. |

### MIG-6c: Selective Migration List

| Field | Value |
|-------|-------|
| **ID** | MIG-6c |
| **Category** | Migration |
| **Priority** | P2 — Gates migration execution |
| **Status** | Pending |
| **Dependencies** | MIG-6b (capability match) |
| **Description** | Prioritized migration list with user approval. Each item includes source path, target path, migration risk (low/medium/high), and validation steps. |
| **Acceptance Criteria** | 1. Migration list ordered by priority (P0 → P2).<br>2. Each item has: source, target, risk level, validation steps, and rollback plan.<br>3. User approval recorded before migration begins.<br>4. Test: migration list covers all approved items and no unapproved items. |

### MIG-6d: Item-by-Item Migration

| Field | Value |
|-------|-------|
| **ID** | MIG-6d |
| **Category** | Migration |
| **Priority** | P2 — Execution phase |
| **Status** | Pending |
| **Dependencies** | MIG-6c (selective migration list) |
| **Description** | Migrate items one at a time with validation after each. No bulk migrations — each item validated independently before proceeding to the next. |
| **Acceptance Criteria** | 1. Each item migrated, built, type-checked, and tested before next item.<br>2. Validation: `npm run typecheck` and `npm test` pass after each migration.<br>3. Rollback plan executable if validation fails.<br>4. Migration log records: item, timestamp, validation result, and any issues.<br>5. Test: all migrated items pass full test suite with no regressions. |

---

## Phase 5: Integration Verification

End-to-end verification that all V3 runtime features work together correctly.

### INT-7a: Full Test Suite

| Field | Value |
|-------|-------|
| **ID** | INT-7a |
| **Category** | Integration Verification |
| **Priority** | P0 — Gate for all releases |
| **Status** | Pending |
| **Dependencies** | All prior phases complete |
| **Description** | Full test suite passes with `npm test` exit code 0. No skipped tests, no false positives, no environment-dependent failures. |
| **Acceptance Criteria** | 1. `npm test` exits 0 with all tests passing.<br>2. Zero skipped or todo tests.<br>3. Test coverage meets or exceeds current baseline.<br>4. No flaky tests — 3 consecutive runs all pass. |

### INT-7b: Plugin Load and Wire

| Field | Value |
|-------|-------|
| **ID** | INT-7b |
| **Category** | Integration Verification |
| **Priority** | P0 — First integration check |
| **Status** | Pending |
| **Dependencies** | All Phase 2-3 requirements complete |
| **Description** | Plugin loads successfully and wires all tools + hooks without errors. No missing dependencies, no circular imports, no runtime errors on startup. |
| **Acceptance Criteria** | 1. Plugin loads in OpenCode without errors in startup log.<br>2. All tools registered and callable.<br>3. All hooks wired and firing on expected events.<br>4. No console warnings about missing modules or deprecated APIs.<br>5. Test: plugin load test verifies all tools and hooks registered. |

### INT-7c: Background Agents E2E

| Field | Value |
|-------|-------|
| **ID** | INT-7c |
| **Category** | Integration Verification |
| **Priority** | P1 — Runtime feature verification |
| **Status** | Pending |
| **Dependencies** | RUN-3a (background agents), INT-7b (plugin load) |
| **Description** | Background agents spawn, execute tasks, report results, and clean up resources. End-to-end test of the full background agent lifecycle. |
| **Acceptance Criteria** | 1. Agent spawns in new pane and begins execution.<br>2. Agent reports progress to parent session at configurable intervals.<br>3. Agent completes with result or error captured.<br>4. Temporary files cleaned up on completion.<br>5. Test: end-to-end spawn→execute→report→cleanup passes. |

### INT-7d: Delegation Chain Persistence

| Field | Value |
|-------|-------|
| **ID** | INT-7d |
| **Category** | Integration Verification |
| **Priority** | P1 — Cross-session verification |
| **Status** | Pending |
| **Dependencies** | RUN-3b (delegation chain), INT-7b (plugin load) |
| **Description** | Delegation chains persist across session boundaries. Child session inherits delegation context, completes task, and reports back to parent. |
| **Acceptance Criteria** | 1. Delegation packet written before child session starts.<br>2. Child session reads delegation context on start.<br>3. Child session completes task and writes result to delegation packet.<br>4. Parent session reads completed delegation with result.<br>5. Test: parent→delegate→complete round-trip with all 8 delegation fields intact. |

### INT-7e: Injection Engine Conditional Application

| Field | Value |
|-------|-------|
| **ID** | INT-7e |
| **Category** | Integration Verification |
| **Priority** | P1 — Runtime feature verification |
| **Status** | Pending |
| **Dependencies** | RUN-3f (injection engine), SCH-5e (trigger evaluators), INT-7b (plugin load) |
| **Description** | Injection engine applies rules conditionally based on session context. Matching sessions receive injections; non-matching sessions do not. |
| **Acceptance Criteria** | 1. Session with matching context receives all applicable injections.<br>2. Session without matching context receives zero injections.<br>3. Governance-blocked rules never inject regardless of context match.<br>4. Injection log records all apply/skip decisions.<br>5. Test: two sessions (one matching, one not) verified for correct injection behavior. |

### INT-7f: Specialist Routing

| Field | Value |
|-------|-------|
| **ID** | INT-7f |
| **Category** | Integration Verification |
| **Priority** | P2 — Quality verification |
| **Status** | Pending |
| **Dependencies** | RUN-3g (specialist classification), SCH-5a (agent schema), INT-7b (plugin load) |
| **Description** | Specialist routing dispatches tasks to the correct agent based on domain, triggers, and task category. Fallback to generalist if no specialist matches. |
| **Acceptance Criteria** | 1. Research task dispatched to researcher specialist.<br>2. Build task dispatched to builder specialist.<br>3. Review task dispatched to critic specialist.<br>4. Unclassified task dispatched to generalist.<br>5. Test: 4 task types routed to correct specialists with 100% accuracy. |

### INT-7g: Schema Validation

| Field | Value |
|-------|-------|
| **ID** | INT-7g |
| **Category** | Integration Verification |
| **Priority** | P1 — Contract verification |
| **Status** | Pending |
| **Dependencies** | SCH-5d (type generation), INT-7b (plugin load) |
| **Description** | Schema validation catches malformed agent, command, and skill definitions at load time. Invalid definitions rejected with actionable error messages. |
| **Acceptance Criteria** | 1. Malformed agent YAML rejected with field-level error messages.<br>2. Malformed command YAML rejected with field-level error messages.<br>3. Malformed skill YAML rejected with field-level error messages.<br>4. Valid definitions pass without warnings.<br>5. Test: 3 malformed definitions rejected, 3 valid definitions accepted. |

---

## Master Traceability

Complete mapping of all requirements to phases.

### v1 Harness Cleanup

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 | Phase 1 | Pending |
| DEAD-02 | Phase 1 | Pending |
| DEAD-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| HIGH-01 | Phase 1 | Pending |
| HIGH-02 | Phase 1 | Pending |
| HIGH-03 | Phase 1 | Pending |
| MED-01 | Phase 1 | Pending |
| MED-02 | Phase 1 | Pending |
| LOW-01 | Phase 1 | Pending |
| LOW-02 | Phase 1 | Pending |
| LOW-03 | Phase 1 | Pending |
| LOW-04 | Phase 1 | Pending |
| QUAL-01 | Phase 1 | Pending |
| QUAL-02 | Phase 1 | Pending |
| QUAL-03 | Phase 1 | Pending |
| QUAL-04 | Phase 1 | Pending |
| QUAL-05 | Phase 1 | Pending |

### Phase 2: Runtime Architecture

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| RUN-3a: Background agents | P0 | Pending | None |
| RUN-3b: Delegation chain | P0 | Complete | RUN-3a |
| RUN-3c: Concurrency control | P0 | Partial | None |
| RUN-3d: Session recovery | P1 | Pending | RUN-3b, RUN-3c |
| RUN-3e: Context governance | P1 | Pending | RUN-3d |
| RUN-3f: Injection engine | P1 | Pending | RUN-3e |
| RUN-3g: Specialist classification | P2 | Complete | RUN-3a, RUN-3f |
| RUN-3h: Tool budget/circuit breaker | P1 | Partial | RUN-3c |

### Phase 3: Schema Definition

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| SCH-5a: Agent schema | P1 | Pending | RUN-3g |
| SCH-5b: Command schema | P1 | Pending | SCH-5a |
| SCH-5c: Skill schema | P1 | Pending | SCH-5a |
| SCH-5d: TypeScript types | P1 | Pending | SCH-5a, SCH-5b, SCH-5c |
| SCH-5e: Event emitters/triggers | P2 | Pending | SCH-5d, RUN-3f |

### Phase 4: Migration Gate

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| MIG-6a: Product-detox inventory | P2 | Pending | None |
| MIG-6b: Capability match | P2 | Pending | MIG-6a |
| MIG-6c: Selective migration list | P2 | Pending | MIG-6b |
| MIG-6d: Item-by-item migration | P2 | Pending | MIG-6c |

### Phase 5: Integration Verification

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| INT-7a: Full test suite | P0 | Pending | All prior phases |
| INT-7b: Plugin load and wire | P0 | Pending | Phase 2-3 complete |
| INT-7c: Background agents E2E | P1 | Pending | RUN-3a, INT-7b |
| INT-7d: Delegation chain persistence | P1 | Pending | RUN-3b, INT-7b |
| INT-7e: Injection engine conditional | P1 | Pending | RUN-3f, SCH-5e, INT-7b |
| INT-7f: Specialist routing | P2 | Pending | RUN-3g, SCH-5a, INT-7b |
| INT-7g: Schema validation | P1 | Pending | SCH-5d, INT-7b |

---

**Coverage Summary:**
- v1 requirements: 18 total — 18 mapped ✓
- Phase 2 (Runtime): 8 requirements — 8 mapped ✓
- Phase 3 (Schema): 5 requirements — 5 mapped ✓
- Phase 4 (Migration): 4 requirements — 4 mapped ✓
- Phase 5 (Integration): 7 requirements — 7 mapped ✓
- **Grand total: 42 requirements — 42 mapped ✓**

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 — V3 runtime features added as Phase 2+*

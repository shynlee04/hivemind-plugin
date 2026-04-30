# Requirements: Harness V3 Runtime Composition Engine

**Defined:** 2026-04-06
**Last Updated:** 2026-04-30 — Phase 59 SDK supervisor and command engine implementation evidence added
**Core Value:** Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references. V3 extends the harness into a runtime composition engine with background agents, delegation chains, concurrency control, and schema-driven injection.

---

## v1 Requirements: Harness Cleanup

### Dead Code Removal

- [x] **DEAD-01**: Delete `.opencode/tools/` directory (all 5 files: prompt-skim, prompt-analyze, context-budget, session-patch, safe-tool)
- [ ] **DEAD-02**: Delete duplicate test files (`tests/tools/prompt-skim.test.ts`, `prompt-analyze.test.ts`, `context-budget.test.ts`, `session-patch.test.ts`, `safe-tool.test.ts`)
- [ ] **DEAD-03**: Delete `tests/plugins/prompt-enhance.test.ts` (masks double-count bug)

### Test Consolidation

- [ ] **TEST-01**: Rename `tests/tools/*-tool.test.ts` files to `tests/tools/*.test.ts`

### HIGH: Critical Bugs

- [x] **HIGH-01**: Fix double-compaction counting — remove event hook's `session.compacted` handling, keep only `experimental.session.compacting`
- [x] **HIGH-02**: Fix session-patch heading corruption — anchor regex to line start: `(?:^|\n)(${escapedSection})[\s\S]*?(?=\n## |$)`
- [x] **HIGH-03**: Fix orchestrator references to 5 non-existent agents — either define missing agents or route to existing researcher/builder/critic

### MEDIUM: Functional Bugs

- [x] **MED-01**: Gate system-transform by delegation metadata — prevent 804-char injection into non-prompt-enhance sessions
- [x] **MED-02**: Fix prompt-analyze to detect cross-line contradictions — compare all line pairs, not just within single lines

### LOW: Model & Quality

- [ ] **LOW-01**: Rebuild context-budget with real OpenCode compaction data — replace fake 15% linear model
- [x] **LOW-02**: Remove `prompt-skim` recommended_lanes (phantom agent references)
- [ ] **LOW-03**: Remove system-transform hook wiring from plugin.ts
- [ ] **LOW-04**: Remove PromptEnhancePlugin event forwarding for compaction from plugin.ts

### Quality Gates

- [ ] **QUAL-01**: Zero dead text injected into non-prompt-enhance sessions
- [ ] **QUAL-02**: Double-count scenario explicitly tested as NOT happening
- [ ] **QUAL-03**: `npm run typecheck` passes
- [ ] **QUAL-04**: `npm test` passes (all tests, no false positives)
- [ ] **QUAL-05**: `npm run build` passes

---

## v2 Requirements: Runtime Architecture (Phase 2)

Priority-ordered sub-phases building the V3 runtime composition engine.

**Verification:** `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — 18/18 verified.

### RUN-3a through RUN-3h

| Requirement | Priority | Status | Phase |
|-------------|----------|--------|-------|
| RUN-3a: Background agents | P0 | Complete | Phase 2 |
| RUN-3b: Delegation chain | P0 | Complete | Phase 2 |
| RUN-3c: Concurrency control | P0 | Complete | Phase 2 |
| RUN-3d: Session recovery | P1 | Complete | Phase 2 |
| RUN-3e: Context governance | P1 | Complete | Phase 2 |
| RUN-3f: Injection engine | P1 | Complete | Phase 2 |
| RUN-3g: Specialist classification | P2 | Complete | Phase 2 |
| RUN-3h: Tool budget/circuit breaker | P1 | Complete | Phase 2 |

---

## v2 Requirements: Validation Decisions (Q1-Q6)

Derived from `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — locked 2026-04-25.

### Q1: Runtime Detection (Layer 2 Taxonomy)

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| RUNTIME-DET-01 | P1 | Pending | Deep codemap/codescan detects project type, language, framework, complexity at runtime |
| RUNTIME-DET-02 | P1 | Pending | File watcher triggers dependency graph update on package.json changes |
| RUNTIME-DET-03 | P1 | Pending | MCP tools + stack skills synthesize tech stack at runtime |

### Q2: Artifact-Focused Sidecar

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| SIDECAR-01 | P1 | Pending | Sidecar reads artifact JSON from .hivemind/ and .planning/, renders dashboard tabs |
| SIDECAR-02 | P1 | Pending | Sidecar calls OpenCode SDK server API for config, settings, sessions |
| SIDECAR-03 | P0 | Pending | Sidecar CANNOT write to canonical state — enforcement test required |

### Q3: Session Journal (Complement + Time-Machine)

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| JOURNAL-01 | P0 | Complete | Session Journal is append-only event timeline, independent of continuity.ts (`src/lib/session-journal.ts`) |
| JOURNAL-02 | P1 | Complete (Phase 25 scope) | Journal/export surface supports session filtering and lineage quick-read output; by-event-type/by-time-range remain future query extensions |
| JOURNAL-03 | P2 | Seeded | Phase 25 records are replay/export friendly and lineage is rebuildable; full time-machine replay engine remains future work |

### Q4: Memory Categories (MVP vs Post-MVP)

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| MEMORY-01 | P0 | Pending | MVP memory categories: episodic/session, workflow, delegation evidence, human-readable journal, architecture decisions |
| MEMORY-02 | P2 | Deferred | Post-MVP memory categories (long-term concept, graph-query, vector memory) deferred with explicit gates |

### Q5: RICH Quality Gate

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| RICH-01 | P0 | Complete for Phases 27-30 | Every hm-* skill in the Phase 27-30 closure scope has RICH Pattern 1/2/3 third-party synthesis or an explicit source-rationale scorecard |
| RICH-02 | P0 | Active | RICH gate remains a quality process, not a threshold to lower; Phase 27-30 PASS is based on documented scorecards and validators, not relaxed criteria |

### Q6: `.hivemind/` State Root

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| HIVEMIND-ROOT-01 | P0 | Pending | All Hivemind internal deep modules write to `.hivemind/` at project root |
| HIVEMIND-ROOT-02 | P1 | Pending | Compatibility bridge reads existing `.opencode/state/opencode-harness/` during transition |
| HIVEMIND-ROOT-03 | P1 | Pending | One-way migration `.opencode/state/` → `.hivemind/`, no dual-write |

---

## Documentation Refresh Requirements (Phase 31)

| Requirement | Status | Description |
|-------------|--------|-------------|
| DOC-REFRESH-01 | Complete | PROJECT.md rewritten to reflect V3 composition engine + Q1-Q6 decisions + .hivemind/ migration |
| DOC-REFRESH-02 | Complete | REQUIREMENTS.md updated with Q1-Q6 derived requirements, DOC-REFRESH, HMQUAL sections |
| DOC-REFRESH-03 | Complete | ROADMAP.md phase statuses corrected, Phase 27-30 entries added, progress table accurate |
| DOC-REFRESH-04 | Complete | STATE.md frontmatter, current position, phase completion details all accurate |
| DOC-REFRESH-05 | Complete | codebase/ARCHITECTURE.md updated for 9-surface mutation authority, .hivemind/ state root, Q6 migration |
| DOC-REFRESH-06 | Complete | codebase/STRUCTURE.md updated for current directory structure after phases 17-26 |
| DOC-REFRESH-07 | Complete | codebase/STACK.md updated for Q1 Layer 2 runtime taxonomy, MCP tools, dependency graph |
| DOC-REFRESH-08 | Complete | codebase/CONCERNS.md updated for C1-C7 all resolved/partially-resolved status |
| DOC-REFRESH-09 | Complete | codebase/INTEGRATIONS.md updated for Q2 sidecar architecture, OpenCode SDK server API |
| DOC-REFRESH-10 | Complete | codebase/TESTING.md updated for Q5 RICH gate requirements, full RICH no-compromise |

---

## HMQUAL Requirements: hm-* Skill Quality Contract (Phase 26)

Quality contract derived from Phase 26 `26-PLAYBOOK.md` D1-D8 dimensions. All `hm-*` and `hivefiver-*` skills must meet these requirements before claiming quality completion.

### HMQUAL-01: Trigger Accuracy

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-01 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every `hm-*` and `hivefiver-*` skill must activate for precise, bounded user intents and avoid false positives against neighboring skills. Maps to PLAYBOOK D1 Trigger Accuracy. |
| **Acceptance Criteria** | 1. Positive trigger cases exist.<br>2. Negative/exclusion cases exist.<br>3. Nearby skill boundaries are documented.<br>4. Trigger evidence is captured in an eval or scoring record. |

### HMQUAL-02: Body Depth

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-02 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill body must provide executable operational guidance, not concept-only prose. Maps to PLAYBOOK D2 Body Depth. |
| **Acceptance Criteria** | 1. Entry conditions are defined.<br>2. Workflow steps and decision gates are defined.<br>3. Exit criteria and blocked-state handoff are defined.<br>4. Anti-patterns or failure modes are documented. |

### HMQUAL-03: 6-NON Defence

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-03 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill must defend against NON-1 through NON-6: non-audit, non-contextual, non-cycles, non-hierarchy, non-ecosystem-eval, and non-systematic-pattern failures. Maps to PLAYBOOK D3 6-NON Defence. |
| **Acceptance Criteria** | 1. Audit trail evidence exists.<br>2. Stack/clash context is documented.<br>3. Entry, exit, and loop-back behavior is defined.<br>4. Hierarchy/role boundaries are explicit.<br>5. Ecosystem or stacked eval evidence exists.<br>6. Pattern rationale and deterministic helper behavior are documented where applicable. |

### HMQUAL-04: Eval Coverage

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-04 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill must prove behavior with realistic eval coverage rather than file-existence claims. Maps to PLAYBOOK D4 Eval Coverage. |
| **Acceptance Criteria** | 1. Eval bundle or equivalent scoring artifact exists.<br>2. Positive and negative trigger cases are covered.<br>3. Assertions are concrete and gradeable.<br>4. Target-tier skills include stacked multi-skill scenarios where relevant. |

### HMQUAL-05: Reference Completeness

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-05 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skill references must support progressive disclosure without replacing the primary workflow. Maps to PLAYBOOK D5 Reference Completeness. |
| **Acceptance Criteria** | 1. Reference map lists each reference and purpose.<br>2. References resolve and stay one level deep unless justified.<br>3. Skill body remains minimally executable without reading every reference.<br>4. Stale, empty, or circular references are absent or documented as blockers. |

### HMQUAL-06: Integration Wiring

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-06 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skills must state how they interact with agents, commands, tools, plugin hooks, and runtime state routers. Maps to PLAYBOOK D6 Integration Wiring. |
| **Acceptance Criteria** | 1. Agent role and permission implications are stated.<br>2. Command argument and shell constraints are stated where relevant.<br>3. Tool contracts or tool absence fallbacks are documented.<br>4. Plugin hook behavior is classified as fact-reporting, advisory, or policy-enforcing.<br>5. Runtime state persistence and resumability expectations are documented. |

### HMQUAL-07: Cross-Platform Compatibility

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-07 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skills must work across OpenCode-native use, Hivemind harness use, and arbitrary user projects without hardcoded local assumptions. Maps to PLAYBOOK D7 Cross-Platform Compatibility. |
| **Acceptance Criteria** | 1. OpenCode-native behavior is documented.<br>2. Hivemind harness behavior is documented.<br>3. Generic fallback behavior exists when GSD, harness tools, or project-specific state are unavailable.<br>4. Commands and paths avoid non-portable assumptions or document adapters. |

### HMQUAL-08: Self-Correction

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-08 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Complete |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skills must detect failure, loop back safely, escalate honestly, and avoid false completion claims. Maps to PLAYBOOK D8 Self-Correction. |
| **Acceptance Criteria** | 1. Retry, rollback, blocked, and escalation states are defined.<br>2. Fresh verification evidence is required before completion claims.<br>3. Repeated failures have stop rules.<br>4. Handoff reports include current state, blocker, evidence gathered, and next verification step. |

### HMQUAL Traceability

| Requirement | PLAYBOOK Dimension | Owning Phase(s) |
|-------------|--------------------|-----------------|
| HMQUAL-01 | D1 Trigger Accuracy | Phase 27 |
| HMQUAL-02 | D2 Body Depth | Phase 27 |
| HMQUAL-03 | D3 6-NON Defence | Phase 27-30 |
| HMQUAL-04 | D4 Eval Coverage | Phase 27-30 |
| HMQUAL-05 | D5 Reference Completeness | Phase 27-30 |
| HMQUAL-06 | D6 Integration Wiring | Phase 27-30 |
| HMQUAL-07 | D7 Cross-Platform Compatibility | Phase 27-30 |
| HMQUAL-08 | D8 Self-Correction | Phase 27-30 |

---

## Validated Requirements

Requirements validated by completed phases. Kept for traceability.

### Phase 14: delegate-task truth-reset — WaiterModel + Dual-Signal + Hybrid Persistence

| Requirement | Priority | Status | Phase |
|-------------|----------|--------|-------|
| REQ-14-01: WaiterModel dispatch | P0 | Complete | Phase 14 |
| REQ-14-02: Dual-signal completion | P0 | Complete | Phase 14 |
| REQ-14-03: Archive stale artifacts | P0 | Complete | Phase 14 |
| REQ-14-04: Event routing for lifecycle | P0 | Complete | Phase 14 |
| REQ-14-05: DelegationManager core | P0 | Complete | Phase 14 |
| REQ-14-06: Hybrid persistence + recovery | P0 | Complete | Phase 14 |
| REQ-14-07: Runtime-truthful tests | P1 | Complete | Phase 14 |
| REQ-14-08: Tool surface + plugin wiring | P0 | Complete | Phase 14 |

---

## Deferred Requirements

### Phase 3: Schema Definition

<!-- SUPERSEDED: satisfied by Phase 2 (runtime composition engine delivered schema types inline) and Phase 26 (HMQUAL quality contract) -->

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| SCH-5a: Agent schema | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | RUN-3g |
| SCH-5b: Command schema | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | SCH-5a |
| SCH-5c: Skill schema | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | SCH-5a |
| SCH-5d: TypeScript types | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | SCH-5a, SCH-5b, SCH-5c |
| SCH-5e: Event emitters/triggers | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | SCH-5d, RUN-3f |

### Phase 4: Migration Gate

<!-- SUPERSEDED: satisfied by Phase 16.4 (harness architecture baseline + migration control plane) -->

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| MIG-6a: Product-detox inventory | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 16.4 --> | None |
| MIG-6b: Capability match | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 16.4 --> | MIG-6a |
| MIG-6c: Selective migration list | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 16.4 --> | MIG-6b |
| MIG-6d: Item-by-Item migration | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 16.4 --> | MIG-6c |

### Phase 5: Integration Verification

<!-- SUPERSEDED: satisfied by Phase 14 (delegate-task truth-reset + WaiterModel + dual-signal), Phase 16 (background delegation revamp + PTY integration), Phase 25 (session journal + execution lineage bridge), Phase 34 (dual-mode execution wiring closure) -->

| Requirement | Priority | Status | Dependencies |
|-------------|----------|--------|--------------|
| INT-7a: Full test suite | P0 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 14 --> | All prior phases |
| INT-7b: Plugin load and wire | P0 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | Phase 2-3 complete |
| INT-7c: Background agents E2E | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 16 --> | RUN-3a, INT-7b |
| INT-7d: Delegation chain persistence | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 14 --> | RUN-3b, INT-7b |
| INT-7e: Injection engine conditional | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | RUN-3f, SCH-5e, INT-7b |
| INT-7f: Specialist routing | P2 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | RUN-3g, SCH-5a, INT-7b |
| INT-7g: Schema validation | P1 | ~~Pending~~ Complete <!-- SUPERSEDED: satisfied by Phase 2 --> | SCH-5d, INT-7b |

---

## Master Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 through DEAD-03 | Phase 1 | DEAD-01 Complete; DEAD-02/03 Pending |
| TEST-01 | Phase 1 | Pending |
| HIGH-01 through HIGH-03 | Phase 1-2 | Complete |
| MED-01 through MED-02 | Phase 1 | Complete |
| LOW-01 through LOW-04 | Phase 1 | LOW-02 Complete; LOW-01/03/04 Pending |
| QUAL-01 through QUAL-05 | Phase 5 | QUAL-03/04/05 superseded by Phase 35; QUAL-01/02 Pending |
| RUN-3a through RUN-3h | Phase 2 | Complete |
| PH09-03 | Phase 9 | Complete |
| SCH-5a through SCH-5e | Phase 3 | ~~Pending~~ Complete (SUPERSEDED by Phase 2) |
| MIG-6a through MIG-6d | Phase 4 | ~~Pending~~ Complete (SUPERSEDED by Phase 16.4) |
| INT-7a through INT-7g | Phase 5 | ~~Pending~~ Complete (SUPERSEDED by Phases 14/16/25/34) |
| REQ-14-01 through REQ-14-08 | Phase 14 | Complete |
| RUNTIME-DET-01 through RUNTIME-DET-03 | Phase 27-30 | Pending |
| SIDECAR-01 through SIDECAR-03 | Phase 27-30 | Pending |
| JOURNAL-01 through JOURNAL-03 | Phase 25 | JOURNAL-01 Complete; JOURNAL-02 Complete for Phase 25 scope; JOURNAL-03 Seeded |
| MEMORY-01, MEMORY-02 | Phase 25-30 | Pending |
| RICH-01, RICH-02 | Phase 27-30 | Active |
| HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03 | Phase 25+ | Pending |
| HMQUAL-01 through HMQUAL-08 | Phase 27-30 | Complete |
| DOC-REFRESH-01 through DOC-REFRESH-10 | Phase 31 | Complete |
| PH49-01 through PH49-03 | Phase 49 | Complete with partial runtime evidence |
| PH50-01 through PH50-03 | Phase 50 | Complete |
| PH51-01 through PH51-03 | Phase 51 | Complete |
| PH52-01 through PH52-03 | Phase 52 | Pending |
| PH53-01 through PH53-03 | Phase 53 | Pending |
| PH54-01 through PH54-03 | Phase 54 | Complete for non-release runway |
| DOC-INTEL-01 through DOC-INTEL-05 | Phase 55 | Implementation complete |
| TRAJECTORY-01 through TRAJECTORY-06 | Phase 56 | Implementation complete |
| PRESSURE-01 through PRESSURE-05 | Phase 57 | Implementation complete |
| WORK-CONTRACT-01 through WORK-CONTRACT-04 | Phase 58 | Implementation complete |
| SUPERVISOR-01 through SUPERVISOR-05 | Phase 59 | Complete for planning |

---

## Phase 35: Event-Tracker Fix + Dead Code Cleanup

- [x] **QUAL-03-FIX**: `npm run typecheck` passes (0 errors in event-tracker/writer.ts)
- [x] **QUAL-04-FIX**: `npm test` passes (0 failures in session-journey-events.test.ts)
- [x] **QUAL-05-FIX**: `npm run build` passes
- [x] **DEAD-03**: Delete `tests/plugins/prompt-enhance-compaction.test.ts` (skipped test masking double-count bug)
- [ ] **DEAD-NH**: Delete `src/lib/notification-handler.ts` (298 LOC DEPRECATED dead code)
- [x] **DEAD-MT**: Delete `src/hooks/messages-transform.ts` (92 LOC dead code, not wired)
- [ ] **TD-11-FINAL**: Resolve remaining 2 `as any` casts in runtime-validator.ts and configure-primitive.ts

---

## Phase 36: Lifecycle State Machine Enforcement

- [ ] **LIFECYCLE-01**: `isValidTransition()` enforces SessionLifecyclePhase transition guards (no longer always-true)
- [ ] **LIFECYCLE-02**: `noteObservedActivity()` implements activity tracking for idle detection
- [ ] **LOC-01**: `delegation-manager.ts` reduced under 500 LOC (extract PTY-specific logic)
- [ ] **TD-07**: delegation-manager.ts LOC compliance verified
- [ ] **TD-09**: delegation-persistence.ts:89 adds status union validation

---

## Phase 37: Async Result Harvesting

- [ ] **RESULT-01**: sdk-delegation.ts harvests child session's last assistant message on completion
- [ ] **RESULT-02**: delegation.result field populated with harvested content (no longer always undefined)
- [ ] **RESULT-03**: delegation-status tool returns harvested results
- [ ] **RESULT-04**: tests/lib/delegation-persistence.test.ts created with direct unit tests

---

## Phase 38: Q6 State Root Migration

- [ ] **HIVEMIND-ROOT-01**: All state writers target .hivemind/ exclusively (continuity.ts, delegation-persistence.ts verified)
- [ ] **HIVEMIND-ROOT-02**: No .opencode/state/ references remain in src/
- [ ] **HIVEMIND-ROOT-03**: .hivemind/ gitignore rules added for runtime state
- [ ] **HIVEMIND-ROOT-TEST**: Migration verification tests pass

---

## Phase 39: Auto-Loop / Ralph-Loop Engine

- [ ] **AUTOLOOP-01**: Self-referential dev loop dispatches → validates → retries with context
- [ ] **AUTOLOOP-02**: DONE promise signal detection
- [ ] **AUTOLOOP-03**: Max iterations enforcement with graceful degradation
- [ ] **AUTOLOOP-04**: Context preservation across loop iterations

---

## Phase 40: CLI Substrate Foundation

- [ ] **CLI-01**: bin/hivemind-tools.cjs entry point functional
- [ ] **CLI-02**: eval, scaffold, skill, state commands implemented
- [ ] **CLI-03**: Scattered bash scripts replaced with unified CLI
- [ ] **CLI-04**: Total CLI substrate under 500 LOC

---

## Phase 41: Session Journal Time-Machine

- [ ] **JOURNAL-TIME-01**: Query API by session, event type, time range
- [ ] **JOURNAL-TIME-02**: Event replay for past-state reconstruction
- [ ] **JOURNAL-TIME-03**: Investigation agent support

---

## Phase 42: Sidecar Foundation

- [ ] **SIDECAR-01**: Next.js 15 dashboard reads .hivemind/ and .planning/ artifacts
- [ ] **SIDECAR-02**: Dashboard tabs for delegations, journals, memory, planning
- [ ] **SIDECAR-03**: READ-ONLY enforcement test passes (sidecar cannot write to canonical state)

---

## Phase 43: Hook Composition Observability Integrity

- [x] **REM-CR-01**: Plugin `tool.execute.after` composition preserves both tool-guard metadata/activity behavior and plugin-level event-tracker/configure-primitive persistence behavior.

---

## Phase 44: Tool Write-Surface & Secret Hardening

- [x] **REM-CR-03**: `session-patch` rejects arbitrary absolute paths and only writes approved project/worktree session artifacts.
- [x] **REM-HIGH-05**: `configure-primitive` awaits filesystem writes and reports write failures instead of premature success.
- [x] **REM-MED-01**: Primitive read/inspect paths reject traversal, absolute paths, path separators, and non-slug names.
- [x] **REM-SEC-01**: MCP descriptors use environment placeholders for secrets and include guard evidence against literal secret values.

---

## Phase 45: OpenCode SDK Permission Boundary

- [x] **REM-CR-02**: Child session creation uses only OpenCode SDK-supported `session.create` fields and enforces tool restrictions through supported surfaces.
- [x] **REM-HIGH-01**: Delegation resolves selected-agent primitive policy and applies only harness-level denial overlays for recursion/capability gates.

---

## Phase 46: Delegation Dispatch, Completion & Recovery Truth

- [x] **REM-HIGH-02**: Delegation status distinguishes created/not-yet-prompted from prompt-accepted dispatched state.
- [x] **REM-HIGH-03**: Completion requires explicit terminal evidence or truthfully reports unknown/stalled/needs-review instead of stability-only success.
- [x] **REM-HIGH-04**: Recovery persists unverified-after-restart and retries before treating missing status as terminal error.

---

## Phase 47: Runtime Policy & Command Buffer Hardening

- [x] **REM-MED-02**: Runtime policy accepts validated workspace/plugin configuration rather than only in-memory defaults.
- [x] **REM-MED-03**: Headless command output buffering is capped with truncation metadata.

---

## Phase 48: Real OpenCode Runtime Integration Verification

- [x] **REM-RUNTIME-01**: Package/static checks prove current SDK/plugin versions, typecheck, tests, and build.
- [x] **REM-RUNTIME-02**: Disposable `opencode serve` fixture proves health, OpenAPI, and session status surfaces.
- [x] **REM-RUNTIME-03**: Compiled harness plugin loads and registered tool IDs are visible through OpenCode SDK/server.
- [ ] **REM-RUNTIME-04**: Runtime hook payload probe confirms expected hook keys and payload shapes or documents required adapters. **DEGRADED:** plugin tests cover hook shape; live `/doc` does not expose hook payload surfaces.
- [ ] **REM-RUNTIME-05**: Real parent/child delegation flow creates, prompts, observes, and polls a child session without false lifecycle states. **DEGRADED:** live prompt accepted but fixture assistant returned empty parts.

---

## Phase 49: UAT Tool Contract & PTY Command Reliability

Truthful status: **Complete with partial runtime evidence** — focused tests and build gates passed, but the verification artifact explicitly defers live external OpenCode/provider proof to downstream acceptance work.

- [x] **PH49-01**: `run-background-command` contract uses documented `run` / `output` / `input` / `list` / `terminate` semantics and preserves first-output visibility in focused verification.
- [x] **PH49-02**: `prompt-skim` and `prompt-analyze` fixtures were recalibrated against the vague/bloated/contradictory prompt cases surfaced by `session-ses_22ee.md`.
- [x] **PH49-03**: `session-journal-export` filter behavior was separated from lineage relabeling so journal export semantics match user expectations.

---

## Phase 50: OpenCode Primitive Restart Readiness

Truthful status: **Complete** — restart validation passed for project-local primitives; advisory warnings remain non-blocking.

- [x] **PH50-01**: `validate-restart` passes against the active project-local OpenCode primitives.
- [x] **PH50-02**: Active agent/command/skill references and frontmatter issues no longer block restart readiness for the project-local primitive set.
- [x] **PH50-03**: Restart-readiness diagnostics for permission inheritance and primitive discovery are readable enough to support follow-up fixes instead of opaque blocker output.

---

## Phase 51: Stack Research & Synthesis Skill Runtime Grounding

Truthful status: **Complete** — loader/discovery and workflow grounding are mapped, but this phase does not claim live end-user acceptance.

- [x] **PH51-01**: Required stack skills load through the project primitive loader for the current harness runtime.
- [x] **PH51-02**: `hm-deep-research`, `hm-research-chain`, and `hm-synthesis` are grounded to harness workflow and evidence handoff paths.
- [x] **PH51-03**: Grounding artifacts truthfully distinguish project-compatible guidance readiness from live provider-backed acceptance proof.

---

## Phase 52: End-User Harness Workflow Acceptance

Truthful status: **Pending** — Phase 52 is intentionally narrow and should prove end-user E2E acceptance only.

- [ ] **PH52-01**: Capture a real parent-led end-user workflow through the production harness surface that reaches delegation, status polling, and journal/lineage evidence as one composed lifecycle.
- [ ] **PH52-02**: Capture interruption and recovery from persisted `.hivemind/` state without false completion or lost task state.
- [ ] **PH52-03**: Produce an acceptance transcript that distinguishes pass, partial, failed, and externally blocked outcomes for the end-user E2E scenarios.

---

## Phase 53: Release Readiness & Lifecycle Gate Closure

Truthful status: **Pending** — added as a follow-up so release gating does not get conflated with Phase 52 user acceptance.

- [ ] **PH53-01**: Close or truthfully reclassify the remaining release-blocking runtime/lifecycle evidence gaps carried forward from Phase 48 degradation and the Phase 52 handoff.
- [ ] **PH53-02**: Run release-readiness gate coverage across the composed harness surfaces (`delegate-task`, `delegation-status`, `run-background-command`, `session-journal-export`, `configure-primitive`, `validate-restart`) with live evidence rather than inherited summaries.
- [ ] **PH53-03**: Resolve, downgrade, or explicitly defer blocker-level lifecycle/release concerns in a way that is auditable for future release decisions.

---

## Phase 54: Sidecar & Product-Detox Integration Runway

Truthful status: **Complete for non-release runway** — Phase 54 created the sidecar/product-detox runway without changing Phase 52/53 release blockers.

- [x] **PH54-01**: Define the sidecar integration runway against the locked Q2/Q6 boundaries: read-only sidecar behavior, `.hivemind/` runtime state ownership, and `.opencode/` primitives-only separation.
- [x] **PH54-02**: Convert the current maintainability/product-detox concerns most likely to burden sidecar or product expansion into explicit follow-up requirements instead of implicit debt.
- [x] **PH54-03**: Produce an ordered runway for sidecar/product integration work so future planning can proceed without reopening Phase 52 or Phase 53 scope.

---

## Phase 55: Doc Intelligence Engine

Truthful status: **Implementation complete** — bounded read-only doc intelligence is implemented and verified; persistent indexes, richer AST traversal, and future product integrations remain separate future work.

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| DOC-INTEL-01 | P1 | Implementation complete | Implement Markdown parsing for frontmatter, outline, and heading hierarchy extraction using existing `gray-matter` plus a minimal heading parser. |
| DOC-INTEL-02 | P1 | Implementation complete | Implement heading-aware chunking for large documents with bounded chunk metadata, stable ordering, and estimated token counts. |
| DOC-INTEL-03 | P1 | Implementation complete | Implement doc surface router behavior for file, directory, read, chunk, and search operations with project-root path scoping. |
| DOC-INTEL-04 | P1 | Implementation complete | Implement `hivemind-doc` tool contract with `skim`, `skim_directory`, `read`, `chunk`, and `search` actions. |
| DOC-INTEL-05 | P1 | Implementation complete | Verify dependency posture: no new dependencies added; existing `gray-matter` used, dependency churn avoided. |

---

## Phase 56: Trajectory & Session v3

Truthful status: **Implementation complete** — trajectory/session v3 implementation verified; Phase 52 runtime closure remains future work.

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| TRAJECTORY-01 | P1 | Implementation complete | Implement trajectory ledger model for truth-anchored events, checkpoints, and recovery logs. |
| TRAJECTORY-02 | P1 | Implementation complete | Implement session v3 schema with semantic IDs, lineage, purpose class, generated TOC, key findings, and resumable flags. |
| TRAJECTORY-03 | P1 | Implementation complete | Implement trajectory store operations for creating, traversing, attaching, checkpointing, eventing, and closing records. |
| TRAJECTORY-04 | P1 | Implementation complete | Implement parent-child trajectory traversal without replacing existing journal or continuity layers. |
| TRAJECTORY-05 | P1 | Implementation complete | Implement `hivemind-trajectory` tool contract with `inspect`, `traverse`, `attach`, `checkpoint`, `event`, and `close` actions. |
| TRAJECTORY-06 | P1 | Implementation complete | Preserve Phase 52 gap boundary: trajectory references can support future evidence without claiming closure. |

---

## Phase 57: Runtime Pressure & Control Plane

Truthful status: **Implementation complete** — durable store, schemas, create/export tools, pressure gating, and automated evidence exist; this is not a release claim.

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| PRESSURE-01 | P1 | Implementation complete | Implement 10-tier runtime pressure model grouped from steady through advisory and gated to blocking. |
| PRESSURE-02 | P1 | Implementation complete | Implement control-plane `detect()` gate decision contract for allow, advise, require approval, defer, or block outcomes. |
| PRESSURE-03 | P1 | Implementation complete | Implement tool catalog authority matrix mapping tools to read/write/state/execute authority and pressure behavior. |
| PRESSURE-04 | P1 | Implementation complete | Implement pressure tool schema and trajectory-only pressure event attachment behavior. |
| PRESSURE-05 | P1 | Implementation complete | Preserve Phase 57 as prerequisite substrate for Phase 39 auto-loop pressure gates and Phase 58 work contract gating. |

---

## Phase 58: Agent Work Contracts

Truthful status: **Complete for planning contract** — implementation and runtime evidence remain future work.

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| WORK-CONTRACT-01 | P1 | Implementation complete | Implement agent work scope contract with task boundary, allowed surfaces, dependencies, and non-goals. |
| WORK-CONTRACT-02 | P1 | Implementation complete | Implement evidence contract with required proof, acceptable evidence levels, verification commands, and blocked-state reporting. |
| WORK-CONTRACT-03 | P1 | Implementation complete | Implement bounded compaction preservation for briefing, summary, anchor extraction, source references, and reinjection. |
| WORK-CONTRACT-04 | P1 | Implementation complete | Implement `hivemind-agent-work-create` and `hivemind-agent-work-export` tools with pressure gating and read-only export behavior. |

---

## Phase 59: SDK Supervisor & Command Engine

Truthful status: **Complete for planning contract** — implementation and runtime evidence remain future work.

| Requirement | Priority | Status | Description |
|-------------|----------|--------|-------------|
| SUPERVISOR-01 | P1 | Implementation complete | Implement SDK supervisor health, heartbeat, bounded diagnostics, and pressure-aware readiness around OpenCode SDK wrapper seams. |
| SUPERVISOR-02 | P1 | Implementation complete | Implement command bundle discovery and preview-only slash-command routing behavior. |
| SUPERVISOR-03 | P1 | Implementation complete | Implement command contract analysis for metadata, arguments, expected context, output shape, and failure states. |
| SUPERVISOR-04 | P1 | Implementation complete | Implement bounded context renderer for command route previews. |
| SUPERVISOR-05 | P1 | Implementation complete | Implement narrow command message transform boundaries without broad system-transform behavior. |

---

## Master Traceability (Phases 35-59)

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-03-FIX, QUAL-04-FIX, QUAL-05-FIX | Phase 35 | Pending |
| DEAD-03, DEAD-NH, DEAD-MT, TD-11-FINAL | Phase 35 | Pending |
| LIFECYCLE-01, LIFECYCLE-02, LOC-01 | Phase 36 | Pending |
| TD-07, TD-09 | Phase 36 | Pending |
| RESULT-01 through RESULT-04 | Phase 37 | Pending |
| HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03, HIVEMIND-ROOT-TEST | Phase 38 | Pending |
| AUTOLOOP-01 through AUTOLOOP-04 | Phase 39 | Pending |
| CLI-01 through CLI-04 | Phase 40 | Pending |
| JOURNAL-TIME-01 through JOURNAL-TIME-03 | Phase 41 | Pending |
| SIDECAR-01 through SIDECAR-03 | Phase 42 | Pending |
| REM-CR-01 | Phase 43 | Complete |
| REM-CR-03, REM-HIGH-05, REM-MED-01, REM-SEC-01 | Phase 44 | Complete |
| REM-CR-02, REM-HIGH-01 | Phase 45 | Complete |
| REM-HIGH-02, REM-HIGH-03, REM-HIGH-04 | Phase 46 | Complete |
| REM-MED-02, REM-MED-03 | Phase 47 | Complete |
| REM-RUNTIME-01 through REM-RUNTIME-03 | Phase 48 | Complete |
| REM-RUNTIME-04 through REM-RUNTIME-05 | Phase 48 | Degraded |
| PH49-01 through PH49-03 | Phase 49 | Complete with partial runtime evidence |
| PH50-01 through PH50-03 | Phase 50 | Complete |
| PH51-01 through PH51-03 | Phase 51 | Complete |
| PH52-01 through PH52-03 | Phase 52 | Pending |
| PH53-01 through PH53-03 | Phase 53 | Pending |
| PH54-01 through PH54-03 | Phase 54 | Complete for non-release runway |
| DOC-INTEL-01 through DOC-INTEL-05 | Phase 55 | Implementation complete |
| TRAJECTORY-01 through TRAJECTORY-06 | Phase 56 | Implementation complete |
| PRESSURE-01 through PRESSURE-05 | Phase 57 | Implementation complete |
| WORK-CONTRACT-01 through WORK-CONTRACT-04 | Phase 58 | Implementation complete |
| SUPERVISOR-01 through SUPERVISOR-05 | Phase 59 | Implementation complete |

---

**Coverage Summary:**
- v1 requirements: 18 total — 7 complete (HIGH-01/02/03, MED-01/02, LOW-02, DEAD-01), 11 pending
- Phase 2 (Runtime): 8 requirements — 8 mapped, all complete
- Phase 3 (Schema): 5 requirements — 5 SUPERSEDED by Phase 2
- Phase 4 (Migration): 4 requirements — 4 SUPERSEDED by Phase 16.4
- Phase 5 (Integration): 7 requirements — 7 SUPERSEDED by Phases 14/16/25/34
- Phase 14 (delegate-task truth-reset): 8 requirements — 8 mapped, all complete
- Q1-Q6 derived: 16 requirements (RUNTIME-DET×3, SIDECAR×3, JOURNAL×3, MEMORY×2, RICH×2, HIVEMIND-ROOT×3)
- HMQUAL: 8 requirements — 8 complete (Phases 27-30 RICH closure PASS)
- DOC-REFRESH: 10 requirements — 10 complete
- Phase 35-42: 36 new requirements — 5 complete, 31 pending/deferred
- Phase 43-48 lifecycle remediation: 17 new requirements — 15 complete, 2 degraded
- Phase 49-54 milestone routing: 18 new requirements — 12 complete (Phases 49-51 and Phase 54 runway), 6 pending/partial (Phases 52-53 release blockers)
- Phase 55-59 product-detox migration runway: 25 new requirements — 25 implementation complete for Phases 55-59 substrate scope
- **Grand total: 172 requirements — 100 complete, 16 superseded, 56 pending/deferred/degraded/research-locked**

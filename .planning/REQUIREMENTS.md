# Requirements: Harness V3 Runtime Composition Engine

**Defined:** 2026-04-06
**Last Updated:** 2026-04-26 — Phases 3/4/5 superseded, Phases 35-42 added, master traceability updated
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
| JOURNAL-01 through JOURNAL-03 | Phase 25 | Pending |
| MEMORY-01, MEMORY-02 | Phase 25-30 | Pending |
| RICH-01, RICH-02 | Phase 27-30 | Active |
| HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03 | Phase 25+ | Pending |
| HMQUAL-01 through HMQUAL-08 | Phase 27-30 | Complete |
| DOC-REFRESH-01 through DOC-REFRESH-10 | Phase 31 | Complete |

---

## Phase 35: Event-Tracker Fix + Dead Code Cleanup

- [ ] **QUAL-03-FIX**: `npm run typecheck` passes (0 errors in event-tracker/writer.ts)
- [ ] **QUAL-04-FIX**: `npm test` passes (0 failures in session-journey-events.test.ts)
- [ ] **QUAL-05-FIX**: `npm run build` passes
- [ ] **DEAD-03**: Delete `tests/plugins/prompt-enhance-compaction.test.ts` (skipped test masking double-count bug)
- [ ] **DEAD-NH**: Delete `src/lib/notification-handler.ts` (298 LOC DEPRECATED dead code)
- [ ] **DEAD-MT**: Delete `src/hooks/messages-transform.ts` (92 LOC dead code, not wired)
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

## Master Traceability (Phases 35-42)

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
- Phase 35-42: 36 new requirements — 36 pending
- **Grand total: 112 requirements — 43 complete, 16 superseded, 53 pending/deferred**

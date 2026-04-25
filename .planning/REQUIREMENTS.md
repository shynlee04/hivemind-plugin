# Requirements: Harness V3 Runtime Composition Engine

**Defined:** 2026-04-06
**Last Updated:** 2026-04-25 — refreshed with Q1-Q6 validation decision requirements, DOC-REFRESH, HMQUAL
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
| DOC-REFRESH-05 | Pending | codebase/ARCHITECTURE.md updated for 9-surface mutation authority, .hivemind/ state root, Q6 migration |
| DOC-REFRESH-06 | Pending | codebase/STRUCTURE.md updated for current directory structure after phases 17-26 |
| DOC-REFRESH-07 | Pending | codebase/STACK.md updated for Q1 Layer 2 runtime taxonomy, MCP tools, dependency graph |
| DOC-REFRESH-08 | Pending | codebase/CONCERNS.md updated for C1-C7 all resolved/partially-resolved status |
| DOC-REFRESH-09 | Pending | codebase/INTEGRATIONS.md updated for Q2 sidecar architecture, OpenCode SDK server API |
| DOC-REFRESH-10 | Pending | codebase/TESTING.md updated for Q5 RICH gate requirements, full RICH no-compromise |

---

## HMQUAL Requirements: hm-* Skill Quality Contract (Phase 26)

Quality contract derived from Phase 26 `26-PLAYBOOK.md` D1-D8 dimensions. All `hm-*` and `hivefiver-*` skills must meet these requirements before claiming quality completion.

### HMQUAL-01: Trigger Accuracy

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-01 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every `hm-*` and `hivefiver-*` skill must activate for precise, bounded user intents and avoid false positives against neighboring skills. Maps to PLAYBOOK D1 Trigger Accuracy. |
| **Acceptance Criteria** | 1. Positive trigger cases exist.<br>2. Negative/exclusion cases exist.<br>3. Nearby skill boundaries are documented.<br>4. Trigger evidence is captured in an eval or scoring record. |

### HMQUAL-02: Body Depth

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-02 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill body must provide executable operational guidance, not concept-only prose. Maps to PLAYBOOK D2 Body Depth. |
| **Acceptance Criteria** | 1. Entry conditions are defined.<br>2. Workflow steps and decision gates are defined.<br>3. Exit criteria and blocked-state handoff are defined.<br>4. Anti-patterns or failure modes are documented. |

### HMQUAL-03: 6-NON Defence

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-03 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill must defend against NON-1 through NON-6: non-audit, non-contextual, non-cycles, non-hierarchy, non-ecosystem-eval, and non-systematic-pattern failures. Maps to PLAYBOOK D3 6-NON Defence. |
| **Acceptance Criteria** | 1. Audit trail evidence exists.<br>2. Stack/clash context is documented.<br>3. Entry, exit, and loop-back behavior is defined.<br>4. Hierarchy/role boundaries are explicit.<br>5. Ecosystem or stacked eval evidence exists.<br>6. Pattern rationale and deterministic helper behavior are documented where applicable. |

### HMQUAL-04: Eval Coverage

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-04 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Every skill must prove behavior with realistic eval coverage rather than file-existence claims. Maps to PLAYBOOK D4 Eval Coverage. |
| **Acceptance Criteria** | 1. Eval bundle or equivalent scoring artifact exists.<br>2. Positive and negative trigger cases are covered.<br>3. Assertions are concrete and gradeable.<br>4. Target-tier skills include stacked multi-skill scenarios where relevant. |

### HMQUAL-05: Reference Completeness

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-05 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skill references must support progressive disclosure without replacing the primary workflow. Maps to PLAYBOOK D5 Reference Completeness. |
| **Acceptance Criteria** | 1. Reference map lists each reference and purpose.<br>2. References resolve and stay one level deep unless justified.<br>3. Skill body remains minimally executable without reading every reference.<br>4. Stale, empty, or circular references are absent or documented as blockers. |

### HMQUAL-06: Integration Wiring

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-06 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skills must state how they interact with agents, commands, tools, plugin hooks, and runtime state routers. Maps to PLAYBOOK D6 Integration Wiring. |
| **Acceptance Criteria** | 1. Agent role and permission implications are stated.<br>2. Command argument and shell constraints are stated where relevant.<br>3. Tool contracts or tool absence fallbacks are documented.<br>4. Plugin hook behavior is classified as fact-reporting, advisory, or policy-enforcing.<br>5. Runtime state persistence and resumability expectations are documented. |

### HMQUAL-07: Cross-Platform Compatibility

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-07 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
| **Dependencies** | Phase 26 26-PLAYBOOK.md |
| **Description** | Skills must work across OpenCode-native use, Hivemind harness use, and arbitrary user projects without hardcoded local assumptions. Maps to PLAYBOOK D7 Cross-Platform Compatibility. |
| **Acceptance Criteria** | 1. OpenCode-native behavior is documented.<br>2. Hivemind harness behavior is documented.<br>3. Generic fallback behavior exists when GSD, harness tools, or project-specific state are unavailable.<br>4. Commands and paths avoid non-portable assumptions or document adapters. |

### HMQUAL-08: Self-Correction

| Field | Value |
|-------|-------|
| **ID** | HMQUAL-08 |
| **Category** | Soft Meta-Concept Quality |
| **Priority** | P1 |
| **Status** | Defined |
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
| MIG-6d: Item-by-Item migration | P2 | Pending | MIG-6c |

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

## Master Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 through DEAD-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| HIGH-01 through HIGH-03 | Phase 2 | Pending |
| MED-01 through MED-02 | Phase 3 | Pending |
| LOW-01 through LOW-04 | Phase 4 | Pending |
| QUAL-01 through QUAL-05 | Phase 5 | Pending |
| RUN-3a through RUN-3h | Phase 2 | Complete |
| PH09-03 | Phase 9 | Complete |
| SCH-5a through SCH-5e | Phase 3 | Pending |
| MIG-6a through MIG-6d | Phase 4 | Pending |
| INT-7a through INT-7g | Phase 5 | Pending |
| REQ-14-01 through REQ-14-08 | Phase 14 | Complete |
| RUNTIME-DET-01 through RUNTIME-DET-03 | Phase 27-30 | Pending |
| SIDECAR-01 through SIDECAR-03 | Phase 27-30 | Pending |
| JOURNAL-01 through JOURNAL-03 | Phase 25 | Pending |
| MEMORY-01, MEMORY-02 | Phase 25-30 | Pending |
| RICH-01, RICH-02 | Phase 27-30 | Active |
| HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03 | Phase 25+ | Pending |
| HMQUAL-01 through HMQUAL-08 | Phase 27-30 | Defined |
| DOC-REFRESH-01 through DOC-REFRESH-10 | Phase 31 | In Progress |

---

**Coverage Summary:**
- v1 requirements: 18 total — 18 mapped
- Phase 2 (Runtime): 8 requirements — 8 mapped, all complete
- Phase 14 (delegate-task truth-reset): 8 requirements — 8 mapped, all complete
- Q1-Q6 derived: 16 requirements (RUNTIME-DET×3, SIDECAR×3, JOURNAL×3, MEMORY×2, RICH×2, HIVEMIND-ROOT×3)
- HMQUAL: 8 requirements — 8 defined
- DOC-REFRESH: 10 requirements — 4 complete, 6 pending
- **Grand total: 68 requirements**

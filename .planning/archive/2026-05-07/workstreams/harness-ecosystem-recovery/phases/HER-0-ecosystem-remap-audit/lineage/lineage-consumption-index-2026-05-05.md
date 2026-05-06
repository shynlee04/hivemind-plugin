# Lineage Consumption Index — Pattern × Path × Lineage Navigation

**Date:** 2026-05-05  
**Companion to:** `map/lane-e-legacy-pattern-lineage-2026-05-05.md`  
**Purpose:** Navigation index mapping legacy concepts to lineages (hm/hf/hm+hf) and paths (1-4) for HER-0 remap-audit consumption.

---

## Index by Lineage

### hm-* Lineage (Product Development) — 69 concepts

Thirty hm-* skills and 30+ hm-* agents consume these patterns. This is the PRIMARY lineage for the harness.

#### Path 1: Agent-Callable Tools (hm — 15 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| I1 AST Surgeon | NOT_FOUND | — | hm research/implement agents (code patching) |
| I2 Compressed Codemap | EVOLVED | `runtime-detection/codemap.ts` | hm researcher/scout agents (code intelligence) |
| I4 Doc Weaver | NOT_FOUND | — | hm researcher agents (document manipulation) |
| I6 Pattern Search | NOT_FOUND | — | hm investigator agents (code search) |
| I8 Signature Extractor | NOT_FOUND | — | hm researcher agents (type analysis) |
| D6 Read Ops | ACTIVE | `doc-intelligence/router.ts` | (see hf-* below — primarily hf) |
| T1 hivemind-session | EVOLVED | `delegate-task.ts`, `delegation-status.ts`, `session-journal-export.ts` | hm executor agents (session lifecycle) |
| T2 hivemind-inspect | EVOLVED | `hivemind-doc.ts`, `runtime-detection/codemap.ts` | hm researcher agents (codebase inspection) |
| T3 hivemind-memory | NOT_FOUND | — | hm executor agents (knowledge management) |
| T4 hivemind-anchor | NOT_FOUND | — | hm executor agents (context anchoring) |
| T5 hivemind-hierarchy | NOT_FOUND | — | hm planner agents (hierarchy tracking) |
| T6 hivemind-cycle | EVOLVED | `session-journal-export.ts` | hm finisher agents (session export) |
| T7 hivemind-context | NOT_FOUND | — | hm executor agents (context state) |
| T8 hivemind-codemap | EVOLVED | `runtime-detection/codemap.ts` | hm scout agents (codebase mapping) |
| T9 hivemind-ideate | NOT_FOUND | — | hm brainstormer agents (ideation) |
| T10 hivemind-read-skeleton | NOT_FOUND | — | hm researcher agents (skeleton reading) |
| T11 hivemind-precision-patch | NOT_FOUND | — | hm executor agents (code patching) |
| T12 hivemind-declare | NOT_FOUND | — | hm executor agents (self-awareness) |
| T13 hivemind-plan | NOT_FOUND | — | hm planner agents (planning state) |
| T16 hiveops-todo | NOT_FOUND | — | hm executor agents (task management) |

#### Path 2: Runtime Programmatic (hm — 44 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| H1 Session Lifecycle Hook | EVOLVED | `create-session-hooks.ts` | hm coordinator agents (session setup) |
| H2 Soft Governance Hook | EVOLVED | `create-tool-guard-hooks.ts` | hm guardian agents (governance) |
| H4 Compaction Hook | EVOLVED | `create-core-hooks.ts` | hm finisher agents (context survival) |
| H5 Event Handler Hook | EVOLVED | `create-core-hooks.ts`, `plugin-event-observers.ts` | hm coordinator agents (event routing) |
| H6 Messages Transform Hook | ACTIVE | `messages-transform.ts` | hm coordinator agents (message shaping) |
| H7 SDK Context Hook | EVOLVED | `session-api.ts` | hm executor agents (SDK access) |
| H8 Session Coherence Hook | NOT_FOUND | — | hm coordinator agents (coherence validation) |
| H9 Session Lifecycle Helpers | EVOLVED | `create-session-hooks.ts` | hm coordinator agents (metadata injection) |
| H10 Config Hot-Reload | EVOLVED | `runtime-policy.ts` | hm executor agents (config management) |
| H11 Hook CQRS Boundary | ACTIVE | `hook-cqrs-boundary.ts` | hm auditor agents (CQRS compliance) |
| H12 Try/Catch Never-Break | EVOLVED | `create-tool-guard-hooks.ts` | hm guardian agents (reliability) |
| S1 Session Kernel | EVOLVED | `lifecycle-manager.ts` | hm operator agents (session health) |
| S2 Session Runtime | EVOLVED | `session-api.ts`, `types.ts` | hm executor agents (session setup) |
| S3 Session Engine | NOT_FOUND | — | hm operator agents (session orchestration) |
| S4 Session Intent Classifier | ACTIVE | `session-entry/purpose-classifier.ts` (DEAD) | hm router agents (intent routing) |
| S5 Session Export | ACTIVE | `session-journal-export.ts` | hm persistor agents (state export) |
| S6 Session Split | NOT_FOUND | — | hm finisher agents (session management) |
| S10 Runtime Session Lineage | ACTIVE | `execution-lineage.ts` | hm coordinator agents (lineage tracking) |
| C1 Cognitive Packer | NOT_FOUND | — | hm operator agents (context compilation) |
| C2 Context Purifier | DEPRECATED | `prompt-skim/`, `prompt-analyze/` | hm operator agents (context hygiene) |
| C3 Injection Orchestrator | NOT_FOUND | — | hm operator agents (injection management) |
| C4 Budget Manager | NOT_FOUND | — | hm operator agents (context budget) |
| C5 Staleness Detection | NOT_FOUND | — | hm operator agents (relevance scoring) |
| C6 Long Session Detection | NOT_FOUND | — | hm guardian agents (session monitoring) |
| I3 Codemap I/O | NOT_FOUND | — | hm scout agents (codemap persistence) |
| I5 File Scanner | EVOLVED | `runtime-detection/codescan.ts` (DEAD) | hm scout agents (file discovery) |
| I7 Selective Injector | NOT_FOUND | — | hm operator agents (context injection) |
| I9 Token Counter | NOT_FOUND | — | hm operator agents (token estimation) |
| I10 Tree-Sitter Loader | NOT_FOUND | — | hm researcher agents (code parsing) |
| I11 Incremental Updater | EVOLVED | `runtime-detection/file-watcher.ts` (DEAD) | hm scout agents (codemap updates) |
| I12 Watch Integration | EVOLVED | `runtime-detection/file-watcher.ts` (DEAD) | hm scout agents (file watching) |
| I13 Binary Detector | NOT_FOUND | — | hm scout agents (binary detection) |
| I15 Gitignore Filter | NOT_FOUND | — | hm scout agents (scan filtering) |
| I16 Knowledge Commits | SKIP | `auto-loop.ts`/`ralph-loop.ts` (DEAD) | hm executor agents (auto-commit) |
| D1 Format Weaver Interface | EVOLVED | `doc-intelligence/types.ts` | hm researcher agents (document ops) |
| D2 Markdown Weaver | EVOLVED | `doc-intelligence/parser.ts` | hm researcher agents (markdown ops) |
| D3 JSON Weaver | NOT_FOUND | — | hm researcher agents (JSON ops) |
| D4 XML Weaver | NOT_FOUND | — | hm researcher agents (XML ops) |
| D5 YAML Weaver | NOT_FOUND | — | hm researcher agents (YAML ops) |
| D7 Write Ops | EVOLVED | `session-patch/tools.ts` | hm executor agents (document writing) |
| Z1 Brain State Schema | EVOLVED | `types.ts`, `schema-kernel/` | hm persistor agents (state schema) |
| Z8 Session Profile Schema | EVOLVED | `types.ts`, `session-entry/` (DEAD) | hm coordinator agents (profile schema) |
| Z12 Delegation Packet Schema | ACTIVE | `schema-kernel/agent-work-contract.schema.ts` | hm coordinator agents (delegation schema) |

#### Path 3: Governance (hm — 16 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| S7 Session Governance | EVOLVED | `runtime-pressure/`, `category-gates.ts` | hm guardian agents (governance) |
| S8 Session Boundary | EVOLVED | `types.ts`, `runtime.ts` | hm coordinator agents (boundary enforcement) |
| S9 Session Role | EVOLVED | `types.ts`, `runtime.ts` | hm coordinator agents (role resolution) |
| I14 Secret Detector | NOT_FOUND | — | hm auditor agents (secret scanning) |
| D8 Safety Layer | NOT_FOUND | — | hm auditor agents (safety enforcement) |
| G1 FK Validator | NOT_FOUND | — | hm auditor agents (graph integrity) |
| G6 Orphan Quarantine | NOT_FOUND | — | hm auditor agents (orphan management) |
| P1 Gatekeeper | ACTIVE | `control-plane/gatekeeper.ts` | hm guardian agents (gate enforcement) |
| P4 Ideation Engine (Q.U.A.N.T.) | NOT_FOUND | — | hm brainstormer agents (spec quality) |
| P7 Planning Authority | NOT_FOUND | — | hm planner agents (planning state) |
| P9 Hierarchy Tree | NOT_FOUND | — | hm planner agents (hierarchy tracking) |
| P10 Chain Analysis | NOT_FOUND | — | hm auditor agents (chain integrity) |
| P11 SOT Governance | NOT_FOUND | — | hm auditor agents (source-of-truth) |
| P13 Entity Checklist | NOT_FOUND | — | hm auditor agents (compliance checklists) |
| T14 hiveops-gate | EVOLVED | `control-plane/gatekeeper.ts` | hm guardian agents (quality gates) |
| T15 hiveops-sot | NOT_FOUND | — | hm auditor agents (artifact registry) |

#### Path 4: Side-Car (hm — 1 concept)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| Z2 Config Schema | EVOLVED | `runtime-policy.ts`, `config-precedence.schema.ts` | (see hf-* below — primarily hf) |

---

### hf-* Lineage (Meta-Builder) — 13 concepts

Eleven hf-* skills and 7 hf-* agents consume these patterns.

#### Path 1: Agent-Callable Tools (hf — 2 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| D6 Read Ops | ACTIVE | `hivemind-doc.ts`, `doc-intelligence/router.ts` | hf auditor agents (skill/agent validation) |
| T9 hivemind-ideate | NOT_FOUND | — | hf skill-builder agents (skill ideation) |

#### Path 2: Runtime Programmatic (hf — 7 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| D1 Format Weaver Interface | EVOLVED | `doc-intelligence/types.ts` | hf skill-builder agents (skill doc parsing) |
| D2 Markdown Weaver | EVOLVED | `doc-intelligence/parser.ts` | hf command-builder agents (command doc parsing) |
| D5 YAML Weaver | NOT_FOUND | — | hf agent-builder agents (YAML frontmatter) |
| D7 Write Ops | EVOLVED | `session-patch/tools.ts`, `configure-primitive.ts` | hf meta-builder agents (primitive compilation) |
| Z1 Brain State Schema | EVOLVED | `schema-kernel/` | hf meta-builder agents (state schema) |
| Z3 Event Schema | EVOLVED | `delegation-types.ts`, `trajectory.schema.ts` | hf tool-builder agents (event schemas) |
| Z12 Delegation Packet Schema | ACTIVE | `agent-work-contract.schema.ts` | hf meta-builder agents (contract schema) |

#### Path 3: Governance (hf — 1 concept)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| Z9 Skill Registry Schema | EVOLVED | `schema-kernel/skill-metadata.schema.ts` | hf skill-builder agents (skill metadata) |

#### Path 4: Side-Car (hf — 3 concepts)

| Concept | Status | Current Mapping | Consumption |
|---------|--------|-----------------|-------------|
| P6 Framework Context | EVOLVED | `framework-detector.ts` | hf coordinator agents (framework detection) |
| Z2 Config Schema | EVOLVED | `runtime-policy.ts`, `config-precedence.schema.ts` | hf coordinator agents (config management) |

---

### hm+hf Lineage (Shared Infrastructure) — 2 concepts

Both lineages consume these patterns. Implementation differences are permissions-driven.

| Concept | Status | Path | Current Mapping | hm-* Consumption | hf-* Consumption |
|---------|--------|------|-----------------|-----------------|-----------------|
| H3 Tool Gate Hook | EVOLVED | 3 | `hook-cqrs-boundary.ts`, `authority-matrix.ts` | STRICT tool permissions | FLEXIBLE tool permissions |
| P12 Tool Response Envelope | ACTIVE | 1 | `shared/tool-response.ts` | ALL 17 agent tools | ALL tool builders |

---

## Index by Path

### Path 1: Agent-Callable Tools & Skills

**Total concepts:** 24 (from legacy catalog path mapping)

| Status | Concepts | Key Finding |
|--------|----------|-------------|
| ACTIVE | 0 | No legacy tool concepts map directly to current tools |
| EVOLVED | 3 | I2 (codemap), T1 (session), T2 (inspect) — decomposed into multiple tools |
| DEPRECATED | 0 | — |
| SKIP | 6 | I16, etc. — deliberate omissions from current tool set |
| NOT_FOUND | 15 | I1, I4, I6, I8, T3-T5, T7-T13, T16 — AST ops, memory, hierarchy, ideation, planning tools not ported |

### Path 2: Runtime Programmatic

**Total concepts:** 36 (from legacy catalog path mapping)

| Status | Concepts | Key Finding |
|--------|----------|-------------|
| ACTIVE | 4 | H6, H11, S4, S5, S10 — all have direct equivalents |
| EVOLVED | 14 | H1, H2, H4, H5, H7, H9, H10, H12, S1, S2, I5, D1, D2, D7 — exist with significant changes |
| DEPRECATED | 1 | C2 — replaced by prompt-enhance pipeline |
| SKIP | 0 | — |
| NOT_FOUND | 17 | H8, S3, S6, C1, C3-C6, I3, I7, I9, I10, I13, I15, D3-D5, I11-I12 (DEAD) |

### Path 3: Governance, Permissions, Registry

**Total concepts:** 18 (from legacy catalog path mapping)

| Status | Concepts | Key Finding |
|--------|----------|-------------|
| ACTIVE | 2 | P1, P12 — gatekeeper and tool response both active |
| EVOLVED | 3 | S7, S8, S9 — governance shifted to pressure-based model |
| DEPRECATED | 0 | — |
| SKIP | 0 | — |
| NOT_FOUND | 13 | I14, D8, G1, G6, P4, P7, P9-P11, P13, T14 (partial), T15, Z9 (partial) |

### Path 4: Side-Car & Onboarding

**Total concepts:** 3 (from legacy catalog path mapping)

| Status | Concepts | Key Finding |
|--------|----------|-------------|
| ACTIVE | 0 | — |
| EVOLVED | 0 | — |
| DEPRECATED | 1 | Z2 (V29 compat) — removed in clean redesign |
| SKIP | 2 | Toast throttle, config hot-reload (replaced) |
| NOT_FOUND | 0 | — |

---

## Cross-Path Dependency Index

For each path, lists concepts that depend on concepts in other paths:

| Path | Depends On Path | Dependency Type | Example |
|------|----------------|-----------------|---------|
| Path 1 (Tools) | Path 2 (Runtime) | I | Tools call `delegation-manager.ts`, `session-api.ts` |
| Path 1 (Tools) | Path 3 (Governance) | I | Tools consume `tool-response.ts` envelope (P12) |
| Path 2 (Runtime) | Path 1 (Tools) | D | Runtime reads agent/skill metadata for routing |
| Path 3 (Governance) | Path 1 (Tools) | I | Permission model reads tool registry for enforcement |
| Path 3 (Governance) | Path 2 (Runtime) | D | Gatekeeper reads session state for gate decisions |
| Path 4 (Side-Car) | Path 1 (Tools) | T | Dashboard tools registered in tool map before callable |

---

## Gate-Ready Patterns

Concepts that, if re-implemented, would directly enable feature gaps identified in the GAP-MATRIX:

| Concept | Enables | Priority | Dependencies |
|---------|---------|----------|-------------|
| P2 State Mutation Queue | F-09b Hook write-safety | HIGH | H11 CQRS Boundary (ACTIVE) |
| C1 Cognitive Packer | F-08a Context compilation | HIGH | H1 Session Lifecycle (EVOLVED) |
| C3 Injection Orchestrator | F-08a Context injection | HIGH | C1 Cognitive Packer (NOT_FOUND) |
| S4 Intent Classifier | F-04c Workflow router | HIGH | Already implemented, needs wiring |
| H3 Tool Tier Classification | F-08b Permission model | HIGH | P1 Gatekeeper (ACTIVE) |
| I2 Compressed Codemap | F-08a Code intelligence | MED | I5 File Scanner (EVOLVED, DEAD) |
| P4 Q.U.A.N.T. Clarity | F-08d Quality gates | MED | None — pure function |
| C5 Staleness Detection | F-08a State management | MED | S5 Session Export (ACTIVE) |
| T12 Agent Declaration | F-03a Agents registry | MED | Z12 Delegation Packet (ACTIVE) |
| S1 Kernel Health Grading | F-08a Diagnostics | MED | S10 Runtime Lineage (ACTIVE) |

---

## DEAD Code Warning Index

Concepts classified as EVOLVED because code exists but is unwired. Consumers should verify before depending on these:

| Concept | Dead Code File | LOC | Wire Target |
|---------|---------------|-----|-------------|
| S4 Intent Classifier | `session-entry/purpose-classifier.ts` | 195 | `plugin.ts` |
| S4 Intake Gate | `session-entry/intake-gate.ts` | 148 | `plugin.ts` |
| S2 Profile Resolver | `session-entry/profile-resolver.ts` | 148 | `plugin.ts` |
| C1 (partial) Kernel Packet | `prompt-packet/kernel-packet.ts` | 149 | `create-session-hooks.ts` |
| C3 (partial) Delegation Packet | `prompt-packet/delegation-packet.ts` | 73 | `delegation-manager.ts` |
| H4 Compaction Preservation | `prompt-packet/compaction-preservation.ts` | 108 | `create-core-hooks.ts` |
| I5 File Scanner | `runtime-detection/codescan.ts` | 176 | `runtime-detection/stack-synthesizer.ts` |
| I11 File Watcher | `runtime-detection/file-watcher.ts` | 122 | `runtime-detection/codemap.ts` |
| I2 Codemap Builder | `runtime-detection/codemap.ts` | 109 | `runtime-detection/stack-synthesizer.ts` |
| P14 Auto-Loop | `auto-loop.ts` | 146 | `create-session-hooks.ts` |
| P14 Ralph-Loop | `ralph-loop.ts` | 182 | `create-session-hooks.ts` |
| S3 Recovery Engine | `recovery-engine.ts` | 72 | `delegation-manager.ts` |

**Total dead code affecting EVOLVED classifications:** ~1,628 LOC across 12 files.

---

## Quick Navigation

| Looking for... | Go to... |
|----------------|----------|
| Full concept details | `map/lane-e-legacy-pattern-lineage-2026-05-05.md` |
| Feature gaps | `.planning/research/GAP-MATRIX-2026-05-05.md` |
| Dependency relationships | `.planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md` |
| Implementation inventory | `.planning/research/IMPLEMENTATION-INVENTORY-2026-05-05.md` |
| Legacy concept catalog | `.planning/research/legacy-concept-catalog-2026-05-05.md` |

---

*Lineage Consumption Index: 2026-05-05 by HER-0 Lane E Legacy Pattern Mapper. Companion to lane-e-legacy-pattern-lineage. 84 concepts indexed by lineage, path, status, and consumption.*

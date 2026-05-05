# Hivemind Harness Ecosystem Map
**Date:** 2026-05-05
**Phase:** HER-0 Ecosystem Re-map & Reality Audit — Terminal Artifact
**Reconciler:** HER-0 Cycle 6 Reconciler
**Sources:** 5 audit lanes (A-E) + ROADMAP.md
**Confidence:** HIGH — evidence-backed with 107+ DIRECT citations

---

## Ecosystem Overview

The Hivemind Harness (`opencode-harness`) is a runtime composition engine for OpenCode — a TypeScript plugin that wires 16 tools, 11 hooks, and a delegation pipeline into the OpenCode agent platform. As of 2026-05-05, the ecosystem spans **116 source modules** (~17,800 LOC in `src/lib/`) across **8 responsibility categories**, with an additional **~2,959 LOC of orphan/dead code** (13.7% of `src/lib/`) from 28 modules that are fully implemented but have zero runtime consumers.

The ecosystem operates as **two halves**: the **Hard Harness** (`src/` — the npm package: plugin.ts composition root, 16 tools, 11 hooks, delegation pipeline, persistence modules) and the **Soft Meta-Concepts** (`.opencode/` — 89 agents, 58 skills, 18 commands, all user-configurable). A third dimension, **Internal State** (`.hivemind/`), persists session journals, execution lineage, and runtime state as canonical per the Q6 architectural decision (2026-04-25). The ecosystem was audited from 5 independent perspectives — UAT findings, governance documentation, module ownership, SDK integration, and legacy pattern lineage — revealing a system that is structurally sound at the core (32/34 SDK API surfaces verified, zero runtime drift, 86% shared hm+hf infrastructure) but carrying significant documentation debt (4 of 7 governance claims drifted, 78% of commands reference non-existent agents, 3 different agent counts across 3 documents) and dead code accumulation that requires surgical removal in downstream phases.

The critical finding is that **the runtime itself is healthy** — all 16 tools are registered, delegation pipeline is verified (Phase 2 evidence), SDK integration is drift-free — but the **documentation and configuration layer is significantly stale**, creating a dangerous gap between what the harness *is* and what the documentation *says it is*. This gap directly causes real operational problems: the hm-l1-coordinator cannot dispatch because AGENTS.md claims a tool it doesn't have, validate-restart reports 78% of commands as broken, and 4 different documents disagree on fundamental counts (tools: 9 vs 16, agents: 57 vs 97 vs 89 vs 90, skills: 50 vs 51 vs 58). The ecosystem is operational but undocumented — the primary recovery task is bringing documentation into alignment with runtime reality.

---

## Path Structure

The harness is organized into **4 development paths** representing different consumer surfaces:

### Path 1: Agent-Callable Tools & Skills (Foundation)
**Consumer:** End-user agents (hm-* product-dev, hf-* meta-builders)
**Modules:** 16 tools + 7 shared files + tool-callable primitives (~2,500 LOC)
**Status:** Operational with known limitations

| Aspect | Reality |
|--------|---------|
| Tools registered | **16** (delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-agent-work-create, hivemind-agent-work-export, configure-primitive, validate-restart) |
| Tools operational | 15/16 (session-patch has section mismatch edge case) |
| Skills on disk | **58** (AGENTS.md claims 51 — DRIFT) |
| Agents on disk | **89** (AGENTS.md claims 97, ARCHITECTURE.md claims 57 — DRIFT) |
| Commands | **18** (78% reference non-existent agents — UAT-F-02) |
| Key finding | hm-l1-coordinator lacks `delegate-task` permission (UAT-F-01) — hm-only, blocks Path 1 delegation chain |

### Path 2: Runtime Programmatic (Runtime Infrastructure)
**Consumer:** Tools, hooks, SDK clients (programmatic API)
**Modules:** ~58 (delegation, persistence, lifecycle, notification, API) — ~8,500 LOC
**Status:** Healthy, verified, minor tracking gaps

| Aspect | Reality |
|--------|---------|
| Delegation pipeline | ✅ VERIFIED — Phase 2 integration tests pass (L1→L2 chain confirmed) |
| Delegation persistence | ✅ VERIFIED — journal confirmed tracking 3 delegation types |
| Agent work contracts | ✅ VERIFIED — create + export + pressure integration |
| Trajectory ledger | ⚠️ PARTIAL — writes on CLOSED trajectories not blocked (UAT-F-11), may be by-design |
| Journal tracking | ⚠️ GAP — session-journal-export reports 0 delegations after SDK delegation (UAT-F-07) |
| Completion detection | Operational (dual-signal WaiterModel) |
| Concurrency | Operational (keyed semaphore, FIFO queue) |
| SDK session API | 7/7 methods VERIFIED (create, get, status, abort, prompt, promptAsync, messages) |

### Path 3: Governance, Permissions & Registry (Control Layer)
**Consumer:** All modules (cross-cutting enforcement)
**Modules:** ~20 (policy, control-plane, runtime-pressure, category-gates, config-workflow) — ~2,800 LOC
**Status:** Architecture solid, configuration gaps exist

| Aspect | Reality |
|--------|---------|
| CQRS boundary | ✅ ACTIVE — hooks read-only, tools write-side (Lane E: H11 ACTIVE) |
| Gatekeeper | ✅ ACTIVE — BLOCKING and NON_BLOCKING gates enforced |
| Pressure system | ✅ ACTIVE — runtime pressure classification with authority matrix |
| Permission model | ⚠️ GAP — hm-l1-coordinator blocked (F-08b), lacks tool tier taxonomy (Lane E: H3) |
| Config compilation | Works but 78% of commands have agent reference drift |
| State root separation (Q6) | ✅ CONFIRMED — all .planning/ artifacts reference .hivemind/ correctly |

### Path 4: Side-car & User Onboarding (Ecosystem Surface)
**Consumer:** Dashboard GUI, documentation, changelog, onboarding
**Modules:** ~7 (doc-intelligence, framework-detector, runtime-validator) — ~1,000 LOC
**Status:** Under-built; primarily gaps

| Aspect | Reality |
|--------|---------|
| CHANGELOG.md | **MISSING** (UAT-F-04) — no changelog for npm package |
| .hivemind/ READMEs | **MISSING** — journal/README.md and lineage/README.md (UAT-F-05) |
| Doc intelligence | Operational but search returns 0 for .md files in commands/skills (UAT-F-08) |
| YAML parsing | Crashes on multiline keys in STATE.md (UAT-B-03) |
| Framework detection | Operational (gsd/spec-kit/both/none) |
| Long-haul compaction | DEAD — prompt-packet/compaction-preservation.ts (330 LOC, unwired) |

---

## Lineage Map

The ecosystem serves **two agent lineages** that share infrastructure but differ in consumption:

### hm-* (Product Development Lineage)
- **Purpose:** End-user product development (spec authoring, TDD, debugging, research)
- **Agent count:** ~72 (L0 orchestrator + L1 coordinators + L2 specialists)
- **Skills:** 30 hm-* skills (brainstorm, spec-driven-authoring, test-driven-execution, debug, refactor, etc.)
- **Consumption:** Uses ALL tools, ALL Path 2 runtime, ALL Path 3 governance
- **Distinct problems:** L1→L2 chain blocked (UAT-F-01), hm skill frontmatter invalid (UAT-F-06), L2→L3 delegation depth untested (UAT-G-01), prompt-analyze false negative affects product-dev delegation safety

### hf-* / hivefiver-* (Meta-Builder Lineage)
- **Purpose:** Agent/skill/command/tool authoring (meta-builders who build the harness ecosystem)
- **Agent count:** ~17 (hf-* builders + hivefiver-* orchestrators)
- **Skills:** 11 hf-* skills + 6 stack-* references
- **Consumption:** Uses hivemind-* tools, configure-primitive, validate-restart, hf-* commands
- **Distinct problems:** hf-l0-orchestrator not tested with delegate-task, 7 hf-* commands reference non-existent hivefiver-orchestrator agent (UAT-F-02)

### hm+hf (Shared Infrastructure)
- **86% of findings are shared** — both lineages consume the same harness runtime
- **Shared tools:** All 16 tools (both lineages use them through different permission profiles)
- **Shared runtime:** Delegation pipeline, session lifecycle, persistence, CQRS boundary
- **Shared state:** `.hivemind/` journal, trajectory, continuity (Q6 enforcement)
- **Shared problems:** Command drift (UAT-F-02), agent overlap (UAT-F-03), journal gap (UAT-F-07), documentation staleness, dead code

> **Critical insight from Lane A:** "Both lineages consume the same harness runtime. No features are lineage-specific in implementation — only in permission profiles and routing rules." This means documentation fixes benefit both lineages equally, and code changes to shared infrastructure must consider both lineages' consumption patterns.

---

## Critical Findings — Top 5

### 🔴 F1: Documentation Deception — What the Docs Say vs. Reality
**Severity:** HIGH | **Lanes:** A (F-02, F-03), B (C-1 through C-4), C (BV-01), D (tool count confirmation)

Four different documents disagree on fundamental ecosystem counts:
| Count | AGENTS.md | ARCHITECTURE.md | GAP-MATRIX | **Reality** |
|-------|-----------|-----------------|------------|-------------|
| Tools | (not stated) | 9 | 23 files | **16 registered** |
| Agents | 97 | 57 | 90 | **89** |
| Skills | 51 | 50 | 58 | **58** |

**Impact:** Downstream phases (HER-0-C ownership matrix, HER-0-E legacy patterns) rely on accurate enumerations. Any agent-based analysis that trusts AGENTS.md or ARCHITECTURE.md will be incorrect. **This causes real operational failure:** validate-restart reports 14/18 commands broken because command files reference agent names that don't exist — the commands still point to names from a state that was documented but never the reality.

### 🔴 F2: Dead Code Epidemic — 2,959 LOC Orphaned
**Severity:** HIGH | **Lanes:** C (28 orphans, 2,447 LOC + partial), E (7 subsystems, ~2,596 LOC), A (confirming unwired session-entry)

28 modules totaling 13.7% of `src/lib/` have zero runtime consumers:
- **auto-loop.ts** (146 LOC) — loop infrastructure with no wiring
- **ralph-loop.ts** (182 LOC) — companion loop with no wiring
- **session-entry/** (667 LOC, 5 files) — entire intake pipeline: purpose classifier, language resolver, profile resolver, intake gate — ALL DEAD
- **prompt-packet/** (348 LOC, 4 files) — kernel packet building, compaction preservation — CRITICAL for F-09a
- **supervisor/** (419 LOC, 5 files) — health checks, context rendering
- **work-contract/** (613 LOC, 5 files) — SUPERSEDED by agent-work-contracts/ but not removed
- **runtime-detection/** (407 LOC dead out of 501) — codemap, codescan, file-watcher all unwired

**Impact:** These modules represent partially-implemented features that were started but never wired. They confuse codebase understanding, bloat the module count, and mislead anyone reading the code. Lane E's `session-entry/purpose-classifier.ts` is rated as a HIGH re-implementation priority for F-04c — the code EXISTS but is unwired.

### 🔴 F3: L1 Coordinator Permanently Blocked from Delegation
**Severity:** HIGH | **Lanes:** A (UAT-F-01), C (indirect confirmation through tool registration check)

The hm-l1-coordinator is the front-facing human interaction point, but it cannot delegate to L2 specialists because:
1. `delegate-task` tool is registered in plugin.ts (Lane D confirms it at line 109)
2. The tool WORKS (Phase 2 integration tests confirm L1→L2 chain)
3. But the hm-l1-coordinator's agent config (`.opencode/agents/hm-l1-coordinator.md`) does not grant permission to use it
4. The L1 coordinator's own output message confirmed: "delegate-task is not exposed as a callable tool in my current environment"

**Impact:** The entire hm-* delegation chain is broken at its entry point. This is a configuration gap, not a code bug. Fix is surgical: add `delegate-task` to the hm-l1-coordinator's permission profile.

### 🟡 F4: Runtime is Healthy, Documentation is Rotting
**Severity:** MEDIUM-HIGH | **Lanes:** B (57% governance drift), D (32/34 VERIFIED, 0 SDK drift), A (86% hm+hf findings)

The pattern is stark and consistent:
- **Surgery needed:** Update AGENTS.md (agent count, skill count, sync date footnote), ARCHITECTURE.md (tool count, agent count, skill count, command count), src/lib/AGENTS.md (notification-handler DEPRECATED tag)
- **Already corrected by Lane D:** `session.error` and `session.deleted` were NOT VERIFIED in RESEARCH.md — Lane D confirmed both as official v1 event types using bundled source reference
- **Reproducible fix path:** Run definitive counts → update all docs to match → validate-restart should clear 14/18 errors

### 🟡 F5: Legacy Pattern Gaps — 10 High-Impact Patterns Missing
**Severity:** MEDIUM | **Lane:** E

Of 84 legacy concepts, 24 are NOT_FOUND (completely absent from current codebase). 10 of these are high-impact re-implementation candidates for downstream feature gaps:
1. **P2 State Mutation Queue** (F-09b) — hook write-safety
2. **C1 Cognitive Packer** (F-08a) — state→context compilation
3. **C3 Injection Orchestrator** (F-08a) — budget-aware injection with TTL
4. **S4 Session Intent Classifier** (F-04c) — DEAD CODE, needs wiring only
5. **H3 Tool Tier Classification** (F-08b) — permission model tier taxonomy
6. **I2 Compressed Codemap** (F-08a) — token-efficient code representation
7. **P4 Q.U.A.N.T. Clarity Scoring** (F-08d) — spec quality validation
8. **T12 Agent Declaration** (F-03a) — agent self-awareness at turn start
9. **C5 Staleness Detection** (F-08a) — memory relevance scoring
10. **S1 Session Kernel Health** (F-08a) — diagnostics with A-F grading

**Wiring priority:** S4 (session-entry/purpose-classifier.ts) requires NO new code — just registration in plugin.ts.

---

## Navigation Index

### Lane Outputs (Source Evidence)
| Lane | File | Summary |
|------|------|---------|
| **Lane A** | [lane-a-uat-reclassification-2026-05-05.md](../map/lane-a-uat-reclassification-2026-05-05.md) | 22 UAT findings classified by 4-path × 3-lineage. Path distribution, lineage distribution, hm+hf differentiation table. |
| **Lane B** | [lane-b-governance-drift-audit-2026-05-05.md](../map/lane-b-governance-drift-audit-2026-05-05.md) | 7 governance claims verified: 3 CONFIRMED, 4 DRIFT. 4 critical drifts with downstream impact. |
| **Lane C** | [lane-c-ownership-matrix-2026-05-05.md](../map/lane-c-ownership-matrix-2026-05-05.md) | 116 modules classified. 28 orphans, 5 boundary violations, responsibility categories, CQRS distribution. |
| **Lane D** | [lane-d-runtime-sdk-spotcheck-2026-05-05.md](../map/lane-d-runtime-sdk-spotcheck-2026-05-05.md) | 34 API surfaces checked: 32 VERIFIED, 2 UNVERIFIED (stubs), 0 DRIFT. Focus checks all resolved. |
| **Lane E** | [lane-e-legacy-pattern-lineage-2026-05-05.md](../map/lane-e-legacy-pattern-lineage-2026-05-05.md) | 84 legacy concepts validated: 12 ACTIVE, 24 EVOLVED, 8 DEPRECATED, 16 SKIP, 24 NOT_FOUND. 10 high-impact gaps. |

### Reconciliation & Map (This Cycle)
| File | Path | Description |
|------|------|-------------|
| **Reconciliation Matrix** | [matrix/ecosystem-reconciliation-matrix-2026-05-05.md](ecosystem-reconciliation-matrix-2026-05-05.md) | Cross-lane conflict register, requirement coverage, path×lineage cross-tab, evidence summary. |
| **Ecosystem Map** | [matrix/ecosystem-map-2026-05-05.md](ecosystem-map-2026-05-05.md) | THIS FILE — human navigation index with overview, paths, lineages, findings, links. |
| **HER-0 Summary** | [../HER-0-SUMMARY-2026-05-05.md](../HER-0-SUMMARY-2026-05-05.md) | Phase completion metrics, requirement coverage, key findings, HER-1+ routing. |

### Reference Documents (Pre-HER-0 Research Foundation)
| File | Path | Description |
|------|------|-------------|
| ROADMAP | [../../ROADMAP.md](../../ROADMAP.md) | Workstream overview, HER-0 requirements A-G |
| RESEARCH | [../HER-0-RESEARCH.md](../HER-0-RESEARCH.md) | Pre-audit research synthesis, taxonomy definition, open questions |
| GAP-MATRIX | [../../../research/GAP-MATRIX-2026-05-05.md](../../../research/GAP-MATRIX-2026-05-05.md) | 20 feature gaps by path |
| FEATURE-DEPENDENCY-GRAPH | [../../../research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md](../../../research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md) | 35 dependency edges across features |
| IMPLEMENTATION-INVENTORY | [../../../../codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md](../../../../codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md) | 175-file inventory with LOC and consumer tracking |
| LEGACY-CONCEPT-CATALOG | [../../../research/legacy-concept-catalog-2026-05-05.md](../../../research/legacy-concept-catalog-2026-05-05.md) | 84 legacy concepts from prior architecture |
| VALIDATION-DECISIONS (Q1-Q6) | [../../../../proposals/VALIDATION-DECISIONS-2026-04-25.md](../../../../proposals/VALIDATION-DECISIONS-2026-04-25.md) | Locked architectural decisions |

### Quality Gate Skills (for HER-1 forward)
| Skill | Location | Purpose |
|-------|----------|---------|
| gate-l3-lifecycle-integration | `.opencode/skills/gate-l3-lifecycle-integration/` | CQRS boundary, actor hierarchy, classification fit |
| gate-l3-spec-compliance | `.opencode/skills/gate-l3-spec-compliance/` | Bidirectional traceability, gap detection |
| gate-l3-evidence-truth | `.opencode/skills/gate-l3-evidence-truth/` | L1-L5 evidence hierarchy, mock detection |

---

## Remaining Gaps

### Gaps That Block Immediate Action

| Gap | Description | Blocking | Recommended Action |
|-----|-------------|----------|-------------------|
| **GAP-01** | hm-l1-coordinator cannot delegate | All hm-* delegation chains | Add `delegate-task` to hm-l1-coordinator.md permissions — documented fix in UAT-F-01 |
| **GAP-02** | 14/18 commands reference non-existent agents | validate-restart reports broken ecosystem | Update all 14 command frontmatter to reference actual agent names (89 on disk) |
| **GAP-03** | 4 drifted documentation files | All downstream phases that read docs as source | Update ARCHITECTURE.md (tools, agents, skills, commands), AGENTS.md (agents, skills, sync date), src/lib/AGENTS.md (notification-handler status) |

### Gaps for HER-1+ Investigation

| Gap | Description | Target Phase | Required Evidence |
|-----|-------------|--------------|------------------|
| **GAP-04** | 2,959 LOC dead code — remove or wire | HER-2 (Cleanup) | Consumer analysis per orphan module |
| **GAP-05** | session-entry/ pipeline (644 LOC) — wire to F-04c | HER-1 (Feature gap analysis) | Integration test: purpose classifier → domain routing |
| **GAP-06** | prompt-packet/compaction-preservation.ts — wire to F-09a | HER-3 (Compaction survival) | Compaction cycle test with context preservation |
| **GAP-07** | State Mutation Queue (P2) — implement for F-09b | HER-4 (SDK hooks) | Hook write-safety verification |
| **GAP-08** | Cognitive Packer (C1) + Injection Orchestrator (C3) — implement for F-08a | HER-3 (Context management) | Token budget tracking + injection ledger |
| **GAP-09** | Agent overlap — 8 pairs with >50% keyword overlap | HER-1 (Agent rationalization) | validate-restart overlap report → merge or specialize |
| **GAP-10** | 22 unhandled SDK event types (permission.*, pty.*, file.*, vcs.*, etc.) | HER-4 (SDK integration) | Determine which events are relevant to delegation lifecycle |

### Gaps That Are By-Design (Not Actionable)

| Gap | Description | Why Not Actionable |
|-----|-------------|-------------------|
| BY-DESIGN-01 | 24 legacy concepts NOT_FOUND (Graph layer, tree-sitter, LSP) | Architectural decisions: no graph layer, no native deps |
| BY-DESIGN-02 | system.transform + experimental.chat.system.transform (empty stubs) | Removed in Phase 14-01 clean slate — no-op is intentional |
| BY-DESIGN-03 | PTY rejects human session IDs | CQRS boundary — tools only access harness-owned sessions |
| BY-DESIGN-04 | hf-only findings = 0 | hf-* lineage has no UAT coverage — this is a test gap, not a feature gap |

---

## Ecosystem Vital Signs

| Metric | Value | Health |
|--------|-------|--------|
| Tools operational | 15/16 (93.75%) | 🟢 Good |
| SDK API surfaces verified | 32/34 (94.1%) | 🟢 Good |
| SDK drift | 0/34 (0%) | 🟢 Excellent |
| Delegation pipeline | Verified (Phase 2 PASS) | 🟢 Good |
| Documentation accuracy | 3/7 claims (42.9%) | 🔴 Poor |
| Dead code ratio | 13.7% of src/lib/ | 🟡 Warning |
| Command health | 14/18 broken refs (78%) | 🔴 Critical |
| L1 delegation | BLOCKED | 🔴 Critical |
| Cross-lane consensus | 5/5 lanes agree on core facts | 🟢 Excellent |

**Overall ecosystem health: 🟡 WARNING.** The runtime core is healthy and verified. The documentation and configuration surface is significantly degraded. The fix path is clear: 3 documentation updates, 1 permission change, 1 tool improvement (session-patch). No architecture redesign required. This is a documentation-recovery, not a code-recovery, phase.

---

*Ecosystem map: 2026-05-05 by HER-0 Cycle 6 Reconciler. Navigation index for the harness-ecosystem-recovery workstream. Links preserved to all lane outputs and reference documents. Gaps enumerated with recommended routing to HER-1+ phases.*

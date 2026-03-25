# Session Inspection Export

- ses_id: `ses_2dfa26975ffe4nYU7AdS4RUJm4`
- prepared_at: `2026-03-24T15:03:03.387Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** 10 skill files in `.developing-skills/refactored-skills/`
**Question:** Structure, key mechanisms, consolidation impact, and cross-references for each skill

---

### Findings

#### 1. `tdd-delegation/SKILL.md` (252 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 2 (Domain). Frontmatter → load position → purpose/use/don't-use → prerequisites → sibling skills → red-green-refactor loop → rationalization prevention → test gate enforcement → build-verify → packet design → incremental suite → anti-patterns → bundled resources → independence rules. |
| **Key Mechanisms** | Red-green-refactor phase separation with HARD-GATE transitions. Denial-with-proof protocol (demanding raw command output, not claims). Extended delegation packet fields: `tdd_phase`, `test_gate_command`, `test_files`, `implementation_files`, `build_verify_command`. Rationalization prevention table (7 excuse/reality pairs). Incremental test order: unit → integration → e2e. |
| **Consolidation Impact** | **HIGH** — this is the base TDD delegation skill. Three other skills extend or overlap it: `tdd-phase-execution` extends with phase granularity, `test-gatekeeping-flow` duplicates much of its gate logic. Consolidating gate definitions into one source of truth would eliminate ~80 lines of duplicated gate/anti-pattern content. |
| **Cross-References** | Depends on `use-hivemind-delegation` (must load first). Extended by `tdd-phase-execution`. Overlaps `test-gatekeeping-flow` on gate definitions and `hivemind-gatekeeping-delegation` on loop control. Downstream fallback: `course-correction-delegation`. |

---

#### 2. `tdd-phase-execution/SKILL.md` (320 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Same structural template as tdd-delegation but adds: phase TDD lifecycle → phase test strategy matrix → multi-phase TDD state tracking → per-phase delegation packet → cross-phase regression prevention → phase TDD rollback. |
| **Key Mechanisms** | Per-phase red-green-refactor cycles (Phase N cannot start until Phase N passes transition gate). Phase test strategy matrix mapping 8 phase types to primary/secondary test levels. Multi-phase TDD checkpoint JSON schema with per-phase tdd_cycle status. Phase transition gate: 6 checks (phase tests, prior tests, type check, build, lint, deliverable verified). Per-phase delegation packet extends tdd-delegation packet with `phase_id`, `phase_index`, `phase_type`, `test_level`, `prior_phase_tests`, `transition_gate_cmd`, `plan_checkpoint_path`. |
| **Consolidation Impact** | **HIGH** — extends tdd-delegation, could be merged as a "phase mode" within tdd-delegation rather than a separate 320-line skill. The phase test strategy matrix and checkpoint schema are unique value, but the gate definitions nearly duplicate both tdd-delegation and test-gatekeeping-flow. |
| **Cross-References** | Extends `tdd-delegation` (must load first). Extends `use-hivemind-delegation` transitively. Composes with `hivemind-gatekeeping-delegation`. Consumes plans from `plan-engineering`. Parallel to `test-gatekeeping-flow` on gate definitions. |

---

#### 3. `test-gatekeeping-flow/SKILL.md` (305 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Purpose/use/don't-use → prerequisites → sibling skills → 5-gate protocol → test writing order → evidence format → anti-patterns → independence rules. |
| **Key Mechanisms** | Five sequential gates: (1) Pre-Implementation RED gate (test exists + fails), (2) Post-Implementation GREEN gate (all pass + types + build), (3) Post-Refactor REFACTOR gate (all still pass), (4) Phase Transition gate (current + prior + integration + types + build), (5) Completion gate (full suite + integration + types + build + lint). Structured evidence JSON format with `gate_id`, `timestamp`, `checks`, `gate_result`. Test writing order: unit → integration → e2e. |
| **Consolidation Impact** | **HIGH** — significant overlap with both tdd-delegation (gates 1-3 nearly identical) and tdd-phase-execution (gate 4 identical). This skill adds Gates 4-5 and the evidence JSON format, but Gates 1-3 are duplicated. Could be consolidated as "gate specification reference" consumed by the other two skills, rather than a standalone 305-line skill. |
| **Cross-References** | References `tdd-delegation` for delegation mechanics. References `hivemind-gatekeeping-delegation` for loop infrastructure. References `tdd-workflow` for TDD execution. Overlaps tdd-delegation on gates 1-3. Overlaps tdd-phase-execution on gate 4. |

---

#### 4. `plan-engineering/SKILL.md` (213 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 2 (Domain). Purpose/use/don't-use → prerequisites → sibling skills → 5-phase plan lifecycle → plan record schema → gate protocol → anti-patterns → independence rules. |
| **Key Mechanisms** | Five-phase lifecycle: (1) Plan Validation (completeness, feasibility, constraint, ambiguity residual), (2) Phase Decomposition (≤3 concerns, ≤5 files, single gate per phase), (3) Dependency Mapping (DAG, critical path, parallel candidates), (4) Execution Tracking (status, evidence, gate_result per phase), (5) Retraceability (decision chain: Epic → Phase → Slice → Packet → Commit). Plan record JSON schema with validation, phases, dependency_graph, carry_forward, retraceability. |
| **Consolidation Impact** | **MEDIUM** — clean separation of concerns. However, Phase 2 (Decomposition) overlaps with plan-breakdown's entire methodology. The decomposition step in plan-engineering is a thin abstraction over plan-breakdown's 6-step process. Could consolidate Phase 2 into a reference to plan-breakdown. |
| **Cross-References** | Consumes spec candidates from `spec-distillation`. Dispatches execution through `use-hivemind-delegation`. Referenced by `plan-breakdown` as sibling. Feeds plans to `tdd-phase-execution`. Uses `hivemind-codemap` for feasibility. |

---

#### 5. `plan-breakdown/SKILL.md` (301 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Purpose/use/don't-use → prerequisites → sibling skills → 6-step decomposition methodology → slice template → re-decomposition protocol → anti-patterns → independence rules. |
| **Key Mechanisms** | Six steps: (1) Authority Surface Analysis (8 surface types: tool/hook/core/shared/test/schema/config/docs), (2) Concern Separation (read/write/verify), (3) File Cluster Grouping (import graph, shared types, co-change pairs, max 5 files), (4) Slice Sizing (≤5 files, one concern, completable in one pass), (5) Dependency Ordering (topological sort, critical path, wave-based parallel dispatch), (6) Gate Definition (per-slice verification commands). Slice JSON template with `slice_id`, `concern`, `authority_surfaces`, `in_scope`/`out_of_scope`, `depends_on`/`blocks`, `gate`, `evidence_required`, `estimated_complexity`. Re-decomposition protocol with decision tree. |
| **Consolidation Impact** | **LOW** — this is the most methodologically dense skill and has the clearest single responsibility. However, its Step 2 (Concern Separation) and Step 6 (Gate Definition) overlap with tdd-delegation and test-gatekeeping-flow. Gate definitions should reference a central gate specification rather than redefining them. |
| **Cross-References** | Extends `use-hivemind-delegation` decomposition rules. Upstream: `spec-distillation` produces specs. Downstream: `tdd-delegation` for TDD slices. Sibling: `plan-engineering` for lifecycle. Reference: `hivemind-codemap` for seam inventory. |

---

#### 6. `spec-distillation/SKILL.md` (129 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). When to use → workflow diagram → requirement classification buckets → clarification policy → bundled resources → independence rules → anti-patterns → step-by-step protocol → terminal state. |
| **Key Mechanisms** | 5-step workflow: (1) Extract Requirement Atoms, (2) Build Ambiguity Map (clear/ambiguous/contradictory), (3) Clarification Loop (MCQ-first, one at a time, 10-round max, block on HIGH-IMPACT), (4) Generate 2-3 Spec Candidates with tradeoffs, (5) Recommend with rationale. 5 requirement buckets: functional, non-functional, integration, risk/compliance, operations. |
| **Consolidation Impact** | **NONE** — clean, self-contained, and the entry point for the planning pipeline. No significant overlap with other skills. Smallest skill at 129 lines. |
| **Cross-References** | Downstream: `plan-engineering` consumes its spec candidates. Can be invoked directly without sibling routing. |

---

#### 7. `hivemind-research-framework/SKILL.md` (203 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Use when → 6 research types → question framing protocol → classification decision tree → delegation patterns (sequential/parallel/iterative) → evidence grading (4-dimension table) → confidence scoring → contradiction resolution → output structure → bundled resources. |
| **Key Mechanisms** | 6 research types with signal words and source mapping. Question framing: identify gap → decompose to 3-5 sub-questions → assign type → define satisfactory answers → map to source strategy. 4-dimension evidence grading: source authority, recency, corroboration, relevance (H/M/L each). Confidence levels: full (all H), partial (mostly H/M), low (any L). Contradiction resolution protocol (log both, compare recency/authority, seek 3rd source, caveat block). Delegation patterns: sequential (dependent), parallel (independent with independence proof), iterative (deepening, max 3 rounds). |
| **Consolidation Impact** | **LOW** — cleanly separated from hivemind-research-tools (methodology vs. tools). Cross-reference is explicit. Could merge into a single research skill, but the separation is intentional and well-maintained. |
| **Cross-References** | Cross-references `hivemind-research-tools` for MCP tool execution. Upstream from delegation protocol. |

---

#### 8. `hivemind-research-tools/SKILL.md` (237 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Use when → MCP provider catalog (8 servers) → default research stack → setup protocol → execution protocols → Repomix deep patterns (6) → chaining protocols → anti-patterns (25+) → fallback hierarchy → retry contract → bundled resources. |
| **Key Mechanisms** | 8 MCP providers: Context7, DeepWiki, Repomix, Tavily, Exa, Sequential Thinking, Grep(Vercel), Brave Search. Default stack: Context7 + DeepWiki + Repomix + Grep + Sequential Thinking. 6 Repomix patterns: scoped remote, local dev, MCP interactive, XML ingestion, SDK usage, comparison analysis. Chaining protocols: standard (Repomix→Context7→Synthesis), deep tech (6-step), comparison (parallel pack+docs). Fallback hierarchy per provider. Retry contract: 3 retries with 3s/5s/10s delays. |
| **Consolidation Impact** | **LOW** — cleanly separated from hivemind-research-framework. Tool catalog and execution protocols are unique content. Anti-patterns list (25+) is extensive. |
| **Cross-References** | Cross-references `hivemind-research-framework` for methodology. Consumes `Repomix`, `Context7`, etc. via MCP. |

---

#### 9. `context-entry-verify/SKILL.md` (105 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). When to use → verification script → gate layers → interpreting results → bundled resources → independence rules → terminal state. |
| **Key Mechanisms** | `scripts/hm-verify.cjs` — zero-dependency Node.js CLI. 4 gate layers: (1) Project Reality (contracts, dependencies, sdk-surface, build, tests) — Hard, Universal, (2) Planning Integrity (exists, health, consistency) — Hard, Project-specific, (3) Git Evidence (branch-state, last-commit, diff-stat) — Hard, Universal, (4) Architecture (src-domains, dead-exports, circular-deps) — Soft/warnings. Two modes: `gate-chain` (fail-fast with `blocked_at` + `delegation_trigger`) and `landscape` (all gates, unified verdict PASS/DEGRADED/FAIL). |
| **Consolidation Impact** | **LOW** — self-contained verification skill. Clean separation from context-intelligence-entry (project truth vs. session health). The script is zero-dependency and standalone. |
| **Cross-References** | Complements `context-intelligence-entry` (this does project truth, that does session health). No upstream dependencies. Can be invoked directly. |

---

#### 10. `context-intelligence-entry/SKILL.md` (159 lines)

| Aspect | Detail |
|--------|--------|
| **Structure** | Slot 3 (Depth). Overview → 3 modes → output contract → context distrust → carry-forward → references → verification boundary → orchestrator integration → direct invocation → anti-patterns. |
| **Key Mechanisms** | `scripts/context-harness-init.cjs` with 3 modes: (1) Quick State Read (`--quick`) — session continuity probe, returns `can_proceed`, `session_stale`, issues, (2) Rot Check (`--rot`) — deterministic PASS/FAIL gate for context integrity (governance files, session state, git surface, plan refs, authority surface), (3) Full Analysis (`--full`) — deep health report with `rot_level`, `rot_score`, `trust`, `dimensions`, `context_flood`, `recommendations`. Context distrust protocol: trust-nothing mode, AGENTS.md verification against code, false signal awareness. Output contract via Zod schema (`schemas/output.schema.ts`). Orchestrator integration: quick mode runs inline, rot/full delegated to subagent. |
| **Consolidation Impact** | **LOW** — unique concern (session/context health vs. project health). Clean separation from context-entry-verify. The distrust protocol and rot taxonomy are unique value. |
| **Cross-References** | Pairs with `context-entry-verify` for project-truth checks. Referenced by AGENTS.md pollution posture section. Referenced by orchestrator for session freshness rule. |

---

### Structure Map

```
.refactored-skills/
├── tdd-delegation/          [SLOT 2 - Domain] Base TDD delegation
├── tdd-phase-execution/     [SLOT 3 - Depth]  Extends tdd-delegation with phases
├── test-gatekeeping-flow/   [SLOT 3 - Depth]  Gate methodology (overlaps 1 & 2)
├── plan-engineering/        [SLOT 2 - Domain] Plan lifecycle management
├── plan-breakdown/          [SLOT 3 - Depth]  Decomposition methodology
├── spec-distillation/       [SLOT 3 - Depth]  Requirements → structured specs
├── hivemind-research-framework/ [SLOT 3]      Research methodology
├── hivemind-research-tools/     [SLOT 3]      MCP tool protocols
├── context-entry-verify/        [SLOT 3]      Project state verification
└── context-intelligence-entry/  [SLOT 3]      Session/context health probe
```

### Patterns Found

1. **Slot distribution**: 2 skills at Slot 2 (Domain), 8 skills at Slot 3 (Depth). No Slot 1 entry routers present — these are all composable middle/bottom-layer skills.

2. **Extension chain**: `use-hivemind-delegation` → `tdd-delegation` → `tdd-phase-execution`. Each extends the prior with additional fields and phase-level granularity.

3. **Gate duplication triangle**: tdd-delegation, tdd-phase-execution, and test-gatekeeping-flow all define overlapping gate specifications. Gates 1-3 (red/green/refactor) are nearly identical across all three. Gate 4 (phase transition) is shared between tdd-phase-execution and test-gatekeeping-flow. Gate 5 (completion) exists only in test-gatekeeping-flow.

4. **Research pair**: hivemind-research-framework (methodology) and hivemind-research-tools (execution) are cleanly separated with explicit cross-references. This is the cleanest pair.

5. **Context pair**: context-entry-verify (project truth) and context-intelligence-entry (session health) have clear concern separation but share infrastructure concerns (git state, JSON output, gate-chain patterns).

6. **Planning pipeline**: spec-distillation → plan-engineering → plan-breakdown forms a clean sequential pipeline with well-defined handoff contracts.

### Consolidation Impact Summary

| Priority | Action | Impact |
|----------|--------|--------|
| **HIGH** | Extract gate definitions from tdd-delegation, tdd-phase-execution, test-gatekeeping-flow into a single shared gate specification | Eliminates ~150 lines of duplicated gate logic |
| **HIGH** | Consider merging test-gatekeeping-flow into tdd-delegation as a "gate specification" section | test-gatekeeping-flow adds Gates 4-5 and evidence format, but Gates 1-3 duplicate tdd-delegation |
| **MEDIUM** | Unify plan-engineering Phase 2 (Decomposition) with plan-breakdown | plan-engineering's Phase 2 is a thin wrapper over plan-breakdown's 6 steps |
| **LOW** | Merge hivemind-research-framework + hivemind-research-tools | Clean separation is intentional; merging saves 1 file but loses concern clarity |
| **NONE** | spec-distillation, context-entry-verify, context-intelligence-entry | Self-contained, no significant duplication |

### Gaps

- No Slot 1 entry router skills are present in this set. These 10 skills assume an entry router is already loaded.
- `hivemind-gatekeeping-delegation` is referenced by 3 skills (tdd-delegation, tdd-phase-execution, test-gatekeeping-flow) but is not in this analysis set.
- `use-hivemind-delegation` is referenced by 5 skills as a prerequisite but is not in this analysis set.
- `tdd-workflow` is referenced by tdd-delegation and test-gatekeeping-flow but is not in this analysis set.
- `course-correction-delegation` is referenced as a debug fallback but is not in this analysis set.

### Git Context

Current branch: `product-detox`. Working tree is a worktree of `hivemind-plugin`. All 10 files exist under `.developing-skills/refactored-skills/` and are read-only from this agent's perspective.
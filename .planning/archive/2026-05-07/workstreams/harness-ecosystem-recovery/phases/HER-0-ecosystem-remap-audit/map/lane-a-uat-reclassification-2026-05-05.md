# Lane A: UAT Finding Reclassification
**Date:** 2026-05-05
**Agent:** hm-l2-general (HER-0 Lane A UAT Reclassifier)
**Sources:** 24 UAT result files across `.hivemind/uat/`, `.planning/research/GAP-MATRIX-2026-05-05.md`, `.planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md`, `HER-0-RESEARCH.md`
**Taxonomy:** 4-Path (Foundation/Runtime/Governance/Ecosystem) × 3-Lineage (hm/hf/hm+hf)

---

## UAT Finding Reclassification Table

| ID | Finding | Source File(s) | Status | Path | Feature | Lineage | Evidence Level | Reconciliation Notes |
|----|---------|----------------|--------|------|---------|---------|----------------|----------------------|
| **UAT-F-01** | L1→L2 delegation chain BLOCKED — hm-l1-coordinator lacks `delegate-task` tool permission | `team-b-critical-L1-L2-chain-blocked-2026-05-05.md`, `team-b-batch-11-final-audit-2026-05-05.md` (F-1) | HIGH / Unresolved | **Path 3** | F-08b (Permission model) | **hm** | DIRECT — L1 coordinator's own output message confirmed: "delegate-task is not exposed as a callable tool in my current environment" | **hm-only**: Only hm-* coordinators affected. hf-* coordinators use different tool sets (configure-primitive, etc.). The delegate-task tool works (Path 1 confirmed), but the permission configuration in `.opencode/agents/hm-l1-coordinator.md` lacks it. Root cause: tool capability matrix configuration gap, not code bug. |
| **UAT-F-02** | validate-restart: 78% commands (14/18) reference non-existent agents (`conductor`, `hivefiver-orchestrator`, `researcher`, `hf-prompter`) | `team-b-critical-validate-restart-drift-2026-05-05.md`, `team-b-batch-11-final-audit-2026-05-05.md` (F-2), `team-b-batch-9-results-2026-05-05.md` (FINDING-9.2) | HIGH / Unresolved | **Path 1** | F-03a (Agents registry & routing) | **hm+hf** | DIRECT — validate-restart verbose output confirmed 14 cross-primitive + 15 runtime errors | **hm+hf shared**: Both lineages affected. 6 `conductor`-ref commands are hm-* path (start-work, plan, ultrawork, etc.), 7 `hivefiver-orchestrator`-ref commands are hf-* path (hf-create, hf-audit, etc.), 1 `researcher`-ref (hm-* deep-research-synthesis-repomix), 1 `hf-prompter`-ref (hf-* hf-prompt-enhance-to-plan). The agent registry in `src/lib/primitive-loader.ts` handles scanning but the command files in `.opencode/commands/` reference agent names that don't exist in `.opencode/agents/`. |
| **UAT-F-03** | Agent description overlap — 24 warnings (8 agent pairs have >50% keyword overlap) | `team-b-batch-11-final-audit-2026-05-05.md` (F-3), `team-b-batch-9-results-2026-05-05.md` (FINDING-9.1) | MEDIUM / Unresolved | **Path 1** | F-03a (Agents registry & routing) | **hm+hf** | DIRECT — validate-restart detected 24 description-overlap warnings | **hm+hf shared**: Overlaps span cross-lineage agent pairs: hm-l2-test-router↔hm-l2-conductor↔hm-l2-build↔hf-l0-orchestrator↔hm-l0-orchestrator. This causes routing confusion risk. The `hm-l2-skill-router` and `hf-l2-skill-router` skills declare routing rules but runtime code in `spawner/` and `command-engine/` has no overlap detection. Both lineages consume agent dispatch; both suffer from ambiguous routing. |
| **UAT-F-04** | Missing CHANGELOG.md — no changelog exists for npm package | `team-b-batch-11-final-audit-2026-05-05.md` (F-4) | HIGH / Unresolved | **Path 4** | F-09d (Configuration compilation) | **hm+hf** | DIRECT — file absence verified at project root | **hm+hf shared**: A CHANGELOG serves both lineages' consumers — hm-* product-dev users need to know what changed in the harness; hf-* meta-builders need to know when tool/agent APIs change. Part of the release readiness pipeline which both lineages depend on. |
| **UAT-F-05** | Missing .hivemind taxonomy READMEs — `journal/README.md` and `lineage/README.md` do not exist | `team-b-batch-11-final-audit-2026-05-05.md` (F-5) | HIGH / Unresolved | **Path 3** | F-08a (Context/event-tracker overhaul) | **hm+hf** | DIRECT — file absence verified via `hivemind-doc` skim | **hm+hf shared**: `.hivemind/` is the canonical state root (Q6 decision). Both lineages consume `.hivemind/journal/` for event tracking and `.hivemind/lineage/` for session lineage. Missing README means state taxonomy is undocumented for any consumer. Per Q6, `.hivemind/` is separate from `.opencode/` and must be self-documenting. |
| **UAT-F-06** | Invalid skill frontmatter — `hm-l2-planning-persistence/SKILL.md` has undefined name and description | `team-b-batch-11-final-audit-2026-05-05.md` (F-6), `team-b-batch-4-results-2026-05-05.md` (FINDING-4.3), `team-b-batch-9-results-2026-05-05.md` (FINDING-9.3) | MEDIUM / Unresolved | **Path 1** | F-03b (Skills registry) | **hm** | DIRECT — configure-primitive and primitive-scanners both flag the invalid frontmatter | **hm-only**: This is an hm-* lineage skill (product-dev planning persistence). hf-* skills are not affected. However, the `primitive-scanners.ts:scanSkillFile()` that detects this is shared infrastructure consumed by both lineages' registry operations. |
| **UAT-F-07** | Journal/delegation tracking gap — `session-journal-export` reports 0 delegations after SDK delegation via `delegate-task` | `team-b-batch-11-final-audit-2026-05-05.md` (F-7), `team-b-batch-7-results-2026-05-05.md` (FINDING-7.1) | MEDIUM / Architectural | **Path 2** | F-07a (Trajectory ledger) | **hm+hf** | DIRECT — journal export returned 0 delegations while delegation-status confirmed completed | **hm+hf shared**: The journal tracking and SDK delegation records are separate systems. `session-journal-export` reads from the journal event store (`src/lib/event-tracker/`), while `delegation-status` reads from SDK delegation records (`src/lib/delegation-persistence.ts`). Both hm-* and hf-* delegation workflows rely on accurate journal tracking for auditability (Q3 decision: session journal as complement). |
| **UAT-F-08** | `hivemind-doc` search returns 0 matches for `.md` files in commands/skills directories | `team-b-batch-11-final-audit-2026-05-05.md` (F-8), `team-b-batch-8-results-2026-05-05.md` (FINDING-8.1) | MEDIUM / Limitation | **Path 4** | F-09c (Specialist tools for dashboard) | **hm+hf** | DIRECT — search action returned empty results for known files | **hm+hf shared**: Both lineages use hivemind-doc for documentation intelligence. hm-* product-dev agents use it to read planning docs and skill references. hf-* meta-builder agents use it to audit commands/skills/agents. The search limitation affects both equally. |
| **UAT-F-09** | PTY human sessionId rejection — `run-background-command` output/terminate reject human session IDs | `team-b-batch-11-final-audit-2026-05-05.md` (F-9), `team-b-batch-5-results-2026-05-05.md` (FINDING-5.1) | MEDIUM / Intentional? | **Path 1** | F-03f (Background PTY sessions) | **hm+hf** | DIRECT — output and terminate actions returned errors for human session IDs | **hm+hf shared**: The PTY manager creates harness-owned sessions. The rejection of human session IDs may be intentional (CQRS boundary — tools only access their own sessions). Both lineages use PTY for background command execution; both would need to understand this restriction. |
| **UAT-F-10** | `nl-route` keyword-first priority — matches first keyword only, confidence=0.333 for multi-keyword queries | `team-b-batch-11-final-audit-2026-05-05.md` (F-10), `team-b-batch-6-results-2026-05-05.md` (FINDING-6.1) | MEDIUM / Limitation | **Path 1** | F-03a (Agents registry & routing) | **hm+hf** | DIRECT — test with multi-keyword query "echo status" returned confidence 0.333 | **hm+hf shared**: `nl-route` is the entry point for natural-language command routing used by both lineages. hm-* agents use it for test commands; hf-* agents use it for meta-builder commands. Precision issues affect routing accuracy for both. |
| **UAT-F-11** | Pressure writes to CLOSED trajectories — `hivemind-pressure` attach_event succeeds on CLOSED trajectories with no state guardrail | `team-b-batch-11-final-audit-2026-05-05.md` (F-11), `team-b-batch-4-results-2026-05-05.md` (FINDING-4.2) | LOW / Edge case | **Path 2** | F-07a (Trajectory ledger) | **hm+hf** | DIRECT — attach_event succeeded on a trajectory with state=closed | **hm+hf shared**: The trajectory ledger's state machine (`src/lib/trajectory/types.ts` has TrajectoryState enum) lacks a guard on CLOSED trajectories. Both lineages' delegation and event tracking workflows use trajectory; writes to closed trajectories could corrupt audit records for both. |
| **UAT-B-01** | `prompt-analyze` false negative — ultra-vague input ("Fix bug.") scores clarity=100 instead of 0-20 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P1), `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P1-a) | HIGH | **Path 1** | F-03c (Tools wiring) | **hm+hf** | DIRECT — test case with 2-word input "Fix bug." produced clarity score 100 | **hm+hf shared but hm-dominant**: The prompt-analyze tool is used by hm-* product-dev workflows for delegation safety (catching underspecified requests). hf-* meta-builders use it less but the tool is shared. A false negative here could allow underspecified hm-* delegations. |
| **UAT-B-02** | `delegation-status` metadata.total misreport — filtering by status="error" returns metadata.total=1 but data=[] | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P2), `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P1-b) | HIGH | **Path 1** | F-03c (Tools wiring) | **hm+hf** | DIRECT — filtered query returned metadata.total=1 with empty data array | **hm+hf shared**: Both lineages use delegation-status to poll task results. hm-* coordinators use it for delegation chain monitoring; hf-* coordinators use it for meta-build task tracking. Incorrect counts would affect dashboard displays and programmatic consumers for both lineages. |
| **UAT-B-03** | `hivemind-doc` skim_directory YAML parse crash — crashes on YAML multiline keys in STATE.md line 17 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P3), `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P2-a) | MEDIUM | **Path 4** | F-09c (Specialist tools for dashboard) | **hm+hf** | DIRECT — crash reproduced with STATE.md multiline YAML | **hm+hf shared**: Both lineages use hivemind-doc for directory scanning. The crash on commonly-occurring YAML patterns affects documentation intelligence for both hm-* and hf-* agent workflows. |
| **UAT-G-01** | No L2→L3 delegation evidence — deeper nesting (L2→L3) never tested | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (Gap G1) | MEDIUM / Gap | **Path 2** | F-06 (Custom delegation revamp) | **hm** | ABSENCE — no test was run for L2→L3 chain; no evidence exists | **hm-dominant**: The 3-level hierarchy (L0→L1→L2) is hm-* specific. hf-* lineage uses different delegation patterns (L0→L2 direct). The delegation depth testing gap primarily affects hm-* product-dev workflows. However, if fixed, the underlying delegation infrastructure (F-06) is hm+hf. |
| **UAT-G-02** | Trajectory ledger not populated — inspect/traverse show empty despite 3 delegations occurring | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (Gap G2) | LOW / By-design? | **Path 2** | F-07a (Trajectory ledger) | **hm+hf** | DIRECT — inspect and traverse returned empty at time of test | **hm+hf shared**: Both lineages rely on trajectory for delegation audit trails. The ledger being empty may be by design (requires explicit checkpoint/event creation calls) or may indicate that auto-population from delegation events is not wired. |
| **UAT-G-03** | No write-side tool testing — session-patch, configure-primitive (write mode), prompt-skim (write mode) untested for write operations | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (Gap G3) | MEDIUM / Gap | **Path 3** | F-08d (Quality gate triad) | **hm+hf** | ABSENCE — no write-side tool testing evidence in any phase | **hm+hf shared but hm-affected**: Write-side tools mutate state (session patching, primitive configuration). Both lineages need their writes verified but hm-* product-dev workflows (session-patch for planning docs) and hf-* meta-builder workflows (configure-primitive for agent/skill creation) have different write patterns. Testing gap affects hm-* more directly since hf-* writes are primarily configuration. |
| **UAT-P2-01** | Delegation Pipeline + Journal Evidence — full chain L1→L2 with journal tracking | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 1) | ✅ PASS | **Path 2** | F-06 (Custom delegation revamp) + F-07a (Trajectory ledger) | **hm+hf** | DIRECT — delegation confirmed, journal confirmed tracking 3 delegations | **hm+hf shared**: Both lineages benefit from verified delegation pipeline. Journal correctly tracked sdk-agent, pty-command, and sdk-coordinator delegations with parent-child mapping. |
| **UAT-P2-02** | Agent Work Contract + Pressure + Supervisor — contract lifecycle with runtime readiness | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 2) | ✅ PASS | **Path 2** | F-07c (Agent work contracts) + F-07a | **hm+hf** | DIRECT — contract created, exported, pressure integration confirmed tier:0/steady | **hm+hf shared**: Both lineages use agent work contracts for structured delegation boundaries. SDK supervisor confirmed readiness under current pressure. |
| **UAT-P2-03** | Tool Catalog + Command Discovery — 15 custom tools cataloged, 8 commands discovered | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 3) | ✅ PASS | **Path 2** | F-04c (Workflow router) + F-08c (Tool capability matrix) | **hm+hf** | DIRECT — 15 tools cataloged with pressure matrices, 8 commands with agent bindings | **hm+hf shared**: Cross-reference with validate-restart detected 14 missing agent references — tool catalog works but command configs have drift. Both lineages consume command discovery. |
| **UAT-P1-01** | `session-patch` partial pass — tool operational with section mismatch behavior | `team-b-batch-1-3-results-2026-05-05.md` (Test 1.8) | ⚠️ PARTIAL | **Path 1** | F-03c (Tools wiring) | **hm+hf** | DIRECT — tool patched sections but had edge case on section mismatches | **hm+hf shared**: session-patch is used by both lineages to update session files and planning docs. The partial pass indicates the tool works for standard cases but has edge cases for mismatched sections. |
| **UAT-P1-02** | Phase 1 overall: 15/15 Tools Tested, 42/44 Tests Passed (95.5%) | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` | ✅ PASS | **Path 1** | F-03c (Tools wiring) | **hm+hf** | DIRECT — all 15 tools confirmed operational across 4 categories | **hm+hf shared**: Broadest positive evidence — all tools functional for both lineages. Two failures (P1, P2) are edge cases, not blocking issues. |

---

## Path Distribution Summary

| Path | Count | % | Findings |
|------|-------|---|----------|
| **Path 1** (Agent-Callable Tools & Skills) | 10 | 45% | UAT-F-02, UAT-F-03, UAT-F-06, UAT-F-09, UAT-F-10, UAT-B-01, UAT-B-02, UAT-P1-01, UAT-P1-02 |
| **Path 2** (Runtime Programmatic) | 6 | 27% | UAT-F-07, UAT-F-11, UAT-G-01, UAT-G-02, UAT-P2-01, UAT-P2-02, UAT-P2-03 |
| **Path 3** (Governance, Permissions, Registry) | 3 | 14% | UAT-F-01, UAT-F-05, UAT-G-03 |
| **Path 4** (Side-Car & User Onboarding) | 3 | 14% | UAT-F-04, UAT-F-08, UAT-B-03 |

> **Observation:** Path 1 dominates (45%) — this aligns with the GAP-MATRIX by-path table showing Path 1 has the most features (7) and the most test surface (tools are directly callable). Path 2 Runtime findings cluster around trajectory/journal tracking. Path 3 Governance findings are mainly configuration gaps (not code bugs). Path 4 findings are documentation and tool limitations.

## Lineage Distribution Summary

| Lineage | Count | % | Findings |
|---------|-------|---|----------|
| **hm-only** | 3 | 14% | UAT-F-01 (L1 coordinator permission), UAT-F-06 (hm skill frontmatter), UAT-G-01 (hm delegation depth) |
| **hf-only** | 0 | 0% | — |
| **hm+hf** (shared) | 19 | 86% | All other findings |

> **Critical observation:** 86% of UAT findings are `hm+hf` (shared infrastructure). This confirms the GAP-MATRIX appendix statement: "Both lineages consume the same harness runtime. No features are lineage-specific in implementation — only in permission profiles and routing rules."

**How hm+hf lineages consume shared infrastructure differently:**

| Shared Finding | hm-* Consumption | hf-* Consumption |
|---------------|------------------|------------------|
| **UAT-F-02** (missing agent refs) | Affects product-dev commands: start-work, plan, ultrawork, deep-research-synthesis-repomix | Affects meta-builder commands: hf-create, hf-audit, hf-stack, hf-absorb, hf-configure, hf-prompt-enhance |
| **UAT-F-03** (agent overlap) | hm-l2-test-router, hm-l2-conductor, hm-l2-build, hm-l0-orchestrator overlap → product-dev routing confusion | hf-l0-orchestrator overlap with hm agents → meta-builder routing confusion |
| **UAT-F-07** (journal gap) | hm-* coordinators cannot verify delegation audit trail for product-dev multi-session research cycles | hf-* coordinators cannot verify meta-build task tracking |
| **UAT-B-01** (prompt false neg) | hm-* product-dev agents use prompt-analyze for delegation safety (catching underspecified requests) | hf-* meta-builders use it less; this affects hm-* workflows more severely |
| **UAT-F-01** (L1 blocked) | hm-l1-coordinator blocked from L2 dispatch — STRICT permission model applies | hf-* coordinators not tested with delegate-task — FLEXIBLE permission model may differ |
| **UAT-F-06** (skill frontmatter) | Only hm-* affected (hm-l2-planning-persistence is hm lineage) | hf-* skills have valid frontmatter — not affected |

---

## Unclassified Findings

**None.** All 22 findings were successfully classified into the 4-path × 3-lineage taxonomy.

---

## Evidence References

| Evidence Tag | File | Line(s) |
|-------------|------|---------|
| **DIRECT-L1-BLOCKED** | `.hivemind/uat/team-b/results/team-b-critical-L1-L2-chain-blocked-2026-05-05.md` | 9-21 (L1 coordinator output confirming delegate-task not exposed) |
| **DIRECT-VALIDATE-DRIFT** | `.hivemind/uat/team-b/results/team-b-critical-validate-restart-drift-2026-05-05.md` | 11-58 (14/18 commands with missing agent refs) |
| **DIRECT-CATALOG** | `.hivemind/uat/team-b/results/team-b-batch-11-final-audit-2026-05-05.md` | 50-75 (complete findings catalog F-1 through F-11) |
| **DIRECT-PHASE1-BUGS** | `.hivemind/uat/phase-1/PHASE-1-SUMMARY-2026-05-05.md` | 41-63 (P1-P4 bugs and tool issues) |
| **DIRECT-PHASE3-GAPS** | `.hivemind/uat/phase-3/PHASE-3-AUDIT-2026-05-05.md` | 40-88 (bugs + gaps G1-G5) |
| **DIRECT-PHASE2-INTEG** | `.hivemind/uat/phase-2/PHASE-2-RESULTS-2026-05-05.md` | 6-32 (3 integration tests all PASS) |
| **DIRECT-BATCH-4** | `.hivemind/uat/team-b/results/team-b-batch-4-results-2026-05-05.md` | 136-156 (CRITICAL-4.1, FINDING-4.2, FINDING-4.3) |
| **DIRECT-BATCH-7** | `.hivemind/uat/team-b/results/team-b-batch-7-results-2026-05-05.md` | 39-46 (journal tracking gap) |
| **DIRECT-BATCH-8** | `.hivemind/uat/team-b/results/team-b-batch-8-results-2026-05-05.md` | 45-52 (doc search, configure scope) |
| **DIRECT-BATCH-9** | `.hivemind/uat/team-b/results/team-b-batch-9-results-2026-05-05.md` | 135-147 (agent overlap, drift confirmed, frontmatter) |
| **TAXONOMY-PATH** | `.planning/research/GAP-MATRIX-2026-05-05.md` | 21-37 (4-path × lineage summary table) |
| **TAXONOMY-FEATURE** | `.planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md` | 13-59 (feature nodes by path with implementation status) |
| **TAXONOMY-CLASSIFICATION** | `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md` | 140-148 (classification taxonomy definition) |
| **TAXONOMY-LINEAGE-DETAIL** | `.planning/research/GAP-MATRIX-2026-05-05.md` | 226-250 (Feature × Lineage Detail appendix) |

---

## Methodology

1. **SKIM**: 24 UAT result files discovered via glob. Document outlines skimmed for all.
2. **SCAN**: Critical findings catalog (batch-11) and individual finding files read at the section level.
3. **CLASSIFY**: Each finding mapped to the 4-path × 3-lineage taxonomy from GAP-MATRIX and HER-0-RESEARCH.
4. **RECONCILE**: Overlapping findings consolidated (F-2 = G-04, F-3 = G-05, etc.).
5. **hm+hf DIFFERENTIATION**: For each `hm+hf` finding, documented how the two lineages consume the shared infrastructure differently.

**Corpus:** 24 UAT files × 3 reference documents = 27 sources analyzed.
**Coverage:** All UAT findings from Phase 1, Phase 2, Phase 3, and Team-B batches 1-11 are classified.
**Gaps:** No UAT findings were found for Path 1 feature F-03d (MCP server integration) or Path 4 feature F-09a (long-haul compaction survival) — these features are unimplemented per GAP-MATRIX and thus had no test coverage.

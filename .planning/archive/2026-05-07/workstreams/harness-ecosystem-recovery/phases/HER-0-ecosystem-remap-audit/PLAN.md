---
phase: HER-0-ecosystem-remap-audit
plan: canonical
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/uat-reclassification-index-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/lineage-consumption-index-2026-05-05.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md
autonomous: true
requirements: [HER-0-A, HER-0-B, HER-0-C, HER-0-D, HER-0-E, HER-0-F, HER-0-G]

must_haves:
  truths:
    - "All HER-0 work is read-only audit work; no source code edits occur."
    - "All 5 audit lanes return evidence with file references and status tags."
    - "Lane outputs are reconciled into a single ecosystem map with conflict handling."
    - "Structured deliverables use date-stamped filenames following name-YYYY-MM-DD."
    - "The final map provides both structured data and a human navigation index."
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/ROADMAP.md"
      provides: "Workstream roadmap with HER-0 requirements and execution wave summary"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md"
      provides: "UAT finding reclassification by 4 paths × 2 lineages"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md"
      provides: "Governance documentation drift audit"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md"
      provides: "Module ownership and lifecycle responsibility matrix"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md"
      provides: "OpenCode runtime SDK spot-check verification"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md"
      provides: "Legacy pattern lineage mapping"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md"
      provides: "Final human navigation index and unified ecosystem map"
  key_links:
    - from: "lane outputs"
      to: "ecosystem-reconciliation-matrix-2026-05-05.md"
      via: "conflict register and evidence reconciliation"
    - from: "ecosystem-reconciliation-matrix-2026-05-05.md"
      to: "ecosystem-map-2026-05-05.md"
      via: "final map production"
---

<objective>
Create the HER-0 Ecosystem Re-map & Reality Audit through 5 audit lanes, one reconciliation gate, and final map production.

Purpose: The harness ecosystem has multiple overlapping sources of truth: UAT results, governance docs, module inventories, runtime SDK assumptions, and legacy concept catalogs. HER-0 produces a reconciled, evidence-tagged map so later HER workstreams can act from reality rather than stale documentation.

Output: A read-only audit package under `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/` with structured directories (`map/`, `matrix/`, `reclassification/`, `lineage/`) and date-stamped deliverables.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
@.planning/research/GAP-MATRIX-2026-05-05.md
@.planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md
@.planning/codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md
@.planning/research/legacy-concept-catalog-2026-05-05.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/CONCERNS.md
@docs/proposals/VALIDATION-DECISIONS-2026-04-25.md

<interfaces>
Executor boundary:
- This phase is READ-ONLY with respect to source code (`src/`, `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`).
- Allowed writes are only HER-0 planning/audit artifacts under `.planning/workstreams/harness-ecosystem-recovery/`.
- Every subagent must announce it is a delegated subagent and must not edit source code.
- Every subagent must load the skills named in its lane instructions before analysis.
- Every factual claim in lane outputs must include file references, URL citations, or explicit evidence-level tags.

Taxonomy:
- Path 1: Foundation — types, helpers, state, concurrency, persistence primitives.
- Path 2: Runtime — plugin, hooks, lifecycle, delegation, session API.
- Path 3: Quality — completion detection, testing, observability, gates, validation.
- Path 4: Ecosystem — skills, agents, commands, permissions, governance docs.

Lineage:
- `hm`: strict product-development/runtime specialist lineage.
- `hf`: flexible meta-builder lineage.
- `hm+hf`: shared harness infrastructure with lineage-specific consumption notes required.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Cycle 0: Pre-audit setup and boundary verification</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/.gitkeep
  </files>
  <action>
Ensure the workstream ROADMAP.md exists and contains HER-0 requirements HER-0-A through HER-0-G. Create HER-0 output directories if missing: `map/`, `matrix/`, `reclassification/`, `lineage/`, each with `.gitkeep`. Confirm foundational inputs exist: GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, IMPLEMENTATION-INVENTORY, legacy-concept-catalog, ARCHITECTURE, CONCERNS, and VALIDATION-DECISIONS. Do not modify source code.

Entry criteria: HER-0-RESEARCH.md exists and is the decision source; no separate CONTEXT.md is required.

Exit criteria: ROADMAP.md exists, output directories exist, and foundational inputs are listed as accessible/non-empty.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md && test -f .planning/research/GAP-MATRIX-2026-05-05.md && test -f .planning/codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md && echo "PASS: HER-0 setup inputs exist"</automated>
  </verify>
  <done>HER-0 has a roadmap entry and writable audit artifact directories, with no source-code changes.</done>
</task>

<task type="auto">
  <name>Cycle 1: Lane A — UAT reclassification</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/uat-reclassification-index-2026-05-05.md
  </files>
  <action>
Dispatch a lane subagent with this required announcement: "You are the subagent Name: HER-0 Lane A UAT Reclassifier, role: audit specialist. You are being delegated and must not edit source code." Instruct it to load `hm-l3-detective` and `hm-l3-synthesis` before analysis.

Input files: `.hivemind/uat/team-b/results/*.md`, GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, HER-0-RESEARCH.md.

Classify every UAT finding by 4-path taxonomy and lineage (`hm`, `hf`, `hm+hf`). For `hm+hf`, document how the two lineages consume the shared infrastructure differently. Each row must include source file reference, finding status, path, lineage, evidence level (DIRECT, CORROBORATED, TESTIMONIAL), and reconciliation notes.

Entry criteria: Cycle 0 setup has completed and UAT result files are readable.

Exit criteria: All observed UAT result entries are classified or explicitly marked `UNCLASSIFIED` with rationale.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md && grep -E "DIRECT|CORROBORATED|TESTIMONIAL" .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md >/dev/null && echo "PASS: Lane A evidence tags present"</automated>
  </verify>
  <done>Lane A produces a complete UAT reclassification artifact and a navigation index under `reclassification/`.</done>
</task>

<task type="auto">
  <name>Cycle 2: Lane B — Governance drift audit</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md
  </files>
  <action>
Dispatch a lane subagent with this required announcement: "You are the subagent Name: HER-0 Lane B Governance Auditor, role: documentation drift specialist. You are being delegated and must not edit source code." Instruct it to load `hm-l3-detective`, `hm-l2-requirements-analysis`, and `gate-l3-spec-compliance` before analysis.

Input files: ARCHITECTURE.md, CONCERNS.md, PROJECT.md, STATE.md if present, ROADMAP files, VALIDATION-DECISIONS, GAP-MATRIX, and actual code/config counts from `src/`, `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`.

Verify governance claims against reality. Known required checks: ARCHITECTURE claims vs plugin tool count, CONCERNS notification-handler status, Q6 state-root separation, agent/skill/command counts, and phase status claims. Tag every claim `CONFIRMED`, `DRIFT`, or `UNVERIFIABLE`, with file references.

Entry criteria: Cycle 0 setup complete; governance docs are readable.

Exit criteria: Drift table includes verified evidence and at least the known drift candidates are resolved as confirmed drift or false alarm.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md && grep -E "CONFIRMED|DRIFT|UNVERIFIABLE" .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md >/dev/null && echo "PASS: Lane B status tags present"</automated>
  </verify>
  <done>Lane B produces an evidence-backed governance drift audit with no source changes.</done>
</task>

<task type="auto">
  <name>Cycle 3: Lane C — Module ownership matrix</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership-2026-05-05.csv
  </files>
  <action>
Dispatch a lane subagent with this required announcement: "You are the subagent Name: HER-0 Lane C Ownership Mapper, role: lifecycle responsibility specialist. You are being delegated and must not edit source code." Instruct it to load `hm-l3-detective`, `hm-l3-hivemind-engine-contracts`, and `hm-l3-hivemind-state-reference` before analysis.

Input files: IMPLEMENTATION-INVENTORY, ARCHITECTURE, `src/lib/*.ts`, `src/plugin.ts`, and `src/lib/AGENTS.md` if present.

Map each module to a lifecycle responsibility: composition, delegation, persistence, lifecycle, policy, API, utility, notification, or orphan. Include imports, exports, dependency depth, LOC, state mutation authority, and CQRS role. Emit markdown and CSV. Flag modules with unclear ownership or boundary violations.

Entry criteria: Cycle 0 setup complete and IMPLEMENTATION-INVENTORY is readable.

Exit criteria: Every current `src/lib/*.ts` module is represented once in markdown and CSV, or explicitly listed as excluded with rationale.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership-2026-05-05.csv && grep -E "module,responsibility" .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership-2026-05-05.csv >/dev/null && echo "PASS: Lane C CSV present"</automated>
  </verify>
  <done>Lane C produces module ownership artifacts covering the harness runtime modules.</done>
</task>

<task type="auto">
  <name>Cycle 4: Lane D — Runtime SDK spot-check verification</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md
  </files>
  <action>
Dispatch a lane subagent with this required announcement: "You are the subagent Name: HER-0 Lane D Runtime Verifier, role: OpenCode SDK integration specialist. You are being delegated and must not edit source code." Instruct it to load `hm-l3-deep-research`, `stack-l3-opencode`, `hm-l3-opencode-platform-reference`, and `hm-l3-tech-context-compliance` before analysis.

Input files: `src/plugin.ts`, `src/hooks/*.ts`, `src/lib/session-api.ts`, `src/lib/lifecycle-manager.ts`, HER-0-RESEARCH.md OpenCode Runtime Integration section.

Perform standard-depth spot-check verification against current OpenCode SDK docs/source. Verify representative tool registrations, hook registrations, event names, and compaction hooks. Required focus: `session.error`, `session.deleted`, `sendPromptAsync`, and `experimental.session.compacting`. If any verified API drift is detected, mark `ESCALATE_TO_DEEP=true` and list the exact follow-up verification needed.

Entry criteria: Cycle 0 setup complete; internet/MCP docs access available or documented unavailable.

Exit criteria: Runtime SDK artifact includes `VERIFIED`, `UNVERIFIED`, or `DRIFT` status for each sampled API surface, with citations.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md && grep -E "VERIFIED|UNVERIFIED|DRIFT" .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md >/dev/null && echo "PASS: Lane D verification statuses present"</automated>
  </verify>
  <done>Lane D produces standard-depth SDK verification with clear escalation status.</done>
</task>

<task type="auto">
  <name>Cycle 5: Lane E — Legacy pattern lineage validation</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/lineage-consumption-index-2026-05-05.md
  </files>
  <action>
Dispatch a lane subagent with this required announcement: "You are the subagent Name: HER-0 Lane E Legacy Pattern Mapper, role: pattern lineage specialist. You are being delegated and must not edit source code." Instruct it to load `hm-l3-detective`, `hm-l3-synthesis`, and `hm-l2-feature-ecosystem` before analysis.

Input files: legacy-concept-catalog, GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, and current source/module docs.

Validate the 84 legacy concepts against the current codebase and classify each as `ACTIVE`, `EVOLVED`, `DEPRECATED`, `SKIP`, or `NOT_FOUND`. Map each concept to path and lineage, including hm/hf consumption notes. Spot-check 3–5 concepts currently recommended as skip and flag `SKIP-REVIEW-NEEDED` when evidence is weak.

Entry criteria: Cycle 0 setup complete and legacy concept catalog is readable.

Exit criteria: Each legacy concept has a status, evidence reference, path mapping, lineage mapping, and downstream relevance note.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md && grep -E "ACTIVE|EVOLVED|DEPRECATED|SKIP|NOT_FOUND" .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md >/dev/null && echo "PASS: Lane E pattern statuses present"</automated>
  </verify>
  <done>Lane E produces legacy pattern lineage artifacts with status tags and lineage consumption notes.</done>
</task>

<task type="auto">
  <name>Cycle 6: Reconciliation gate and final ecosystem map production</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md
  </files>
  <action>
After Lanes A-E complete, run a reconciliation gate. The reconciler must load `hm-l2-gate-orchestrator`, `gate-l3-spec-compliance`, and `gate-l3-evidence-truth` before synthesis.

Cross-reference lane outputs by feature, module, path, lineage, and evidence level. Create a conflict register with categories: `PATH-CONFLICT`, `LINEAGE-CONFLICT`, `STATUS-CONFLICT`, `OWNERSHIP-CONFLICT`, `SDK-DRIFT`, `EVIDENCE-GAP`. Resolve conflicts using evidence hierarchy: live/source evidence > UAT evidence > current docs > legacy catalog > testimonial notes. If a conflict cannot be resolved, mark `CONFLICT-UNRESOLVED` and include exact next action.

Produce both:
1. `ecosystem-reconciliation-matrix-2026-05-05.md` — structured conflict and coverage matrix.
2. `ecosystem-map-2026-05-05.md` — human navigation index and unified map for downstream HER phases.
3. `HER-0-SUMMARY-2026-05-05.md` — metrics, requirement coverage, unresolved blockers, recommended HER-1+ routing.

Entry criteria: Lane A-E files exist and contain evidence/status tags.

Exit criteria: All HER-0 requirements are marked COVERED/PARTIAL/MISSING with evidence; unresolved conflicts are explicitly listed and not hidden.
  </action>
  <verify>
    <automated>test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md && test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md && echo "PASS: final HER-0 map artifacts exist"</automated>
  </verify>
  <done>Final HER-0 map and summary exist with requirement coverage and conflict register.</done>
</task>

</tasks>

<verification_gates>
## Lane Boundary Gates

| Gate | Trigger | Must Pass Before |
|------|---------|------------------|
| G0 Setup Gate | Cycle 0 complete | Any lane begins |
| G1 Lane Evidence Gate | Each lane output written | Reconciliation begins |
| G2 Reconciliation Gate | Lanes A-E complete | Final map production |
| G3 Evidence Truth Gate | Final map produced | HER-0 marked complete |

## Required Lane Return Format

Each subagent returns:
- `## LANE COMPLETE` or `## LANE BLOCKED`
- Files written
- Source files read
- Evidence tags used
- Conflicts or unresolved items
- Verification command result
</verification_gates>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Existing docs → audit artifacts | Existing docs may be stale and must not be trusted without source evidence |
| UAT results → reclassification | UAT findings may use older taxonomy and require normalization |
| External SDK docs → runtime verification | Online docs may be incomplete; unverified claims must be flagged |
| Lane outputs → final map | Independent lane outputs may conflict and require explicit reconciliation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-01 | Tampering | Audit artifacts | mitigate | Read-only source boundary; only `.planning/workstreams/harness-ecosystem-recovery/` writes allowed |
| T-HER0-02 | Information Disclosure | Runtime state files | mitigate | Do not include secrets, tokens, or raw session identifiers in outputs; redact if encountered |
| T-HER0-03 | Repudiation | Evidence claims | mitigate | Every factual claim must cite file path/URL or evidence level |
| T-HER0-04 | Denial of Service | Context-heavy lane reads | mitigate | Lanes use skim/grep first and summarize evidence; no full repo packing unless necessary |
| T-HER0-05 | Spoofing | SDK docs/source mismatch | mitigate | Cross-reference OpenCode docs with source search for critical API claims |
</threat_model>

<verification>
Overall phase verification:
```bash
test -f .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclassification-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-drift-audit-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md
test -f .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md
```
</verification>

<success_criteria>
- HER-0 requirements HER-0-A through HER-0-G are covered or explicitly marked partial/missing with evidence.
- All lane outputs are date-stamped and located under the requested structured directories.
- No source code edits are made.
- Lane D uses standard spot-check depth and escalates only if drift is detected.
- Final ecosystem map includes a human navigation index and structured reconciliation matrix.
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md`.
</output>

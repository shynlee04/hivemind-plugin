---
phase: HER-0-ecosystem-remap-audit
plan: 02
type: execute
wave: 1
depends_on: ["HER-0-01"]
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclass.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-audit.md
autonomous: true
requirements: [HER-0-A, HER-0-B]

must_haves:
  truths:
    - "All 116 UAT findings from 11 batches are reclassified by 4 paths × 2 lineages"
    - "Every governance claim in ARCHITECTURE.md and CONCERNS.md is verified against source files"
    - "Drift findings include file path and line number evidence"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclass.md"
      provides: "Complete UAT reclassification table with 4-path taxonomy"
      min_lines: 200
      contains: "path-1"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-audit.md"
      provides: "Governance drift report with per-claim verification"
      min_lines: 150
      contains: "DRIFT"
  key_links:
    - from: "lane-a-uat-reclass.md"
      to: ".hivemind/uat/team-b/results/"
      via: "source UAT batch files"
      pattern: "team-b-batch-"
    - from: "lane-b-governance-audit.md"
      to: ".planning/codebase/ARCHITECTURE.md"
      via: "claim verification"
      pattern: "ARCHITECTURE\\.md"
---

<objective>
Execute Lane A (UAT Reclassification) and Lane B (Governance Audit) in parallel.

Lane A: Read all 11 UAT batch files from `.hivemind/uat/team-b/results/`, reclassify all 116 PASS/FAIL findings by the 4-path taxonomy (path-1: foundation, path-2: runtime, path-3: quality, path-4: ecosystem) × 2 lineages (hm, hf). Tag each finding with an evidence level (DIRECT, CORROBORATED, TESTIMONIAL).

Lane B: Cross-reference all governance claims in ARCHITECTURE.md, CONCERNS.md, PROJECT.md, and STATE.md against actual source files. Flag claims that are stale, incorrect, or unverifiable. Known drift to verify: ARCHITECTURE.md claims "9 tools" but plugin.ts registers 16; CONCERNS.md marks notification-handler as DEPRECATED but it was re-activated.

Purpose: Lane A enables downstream reconciliation by putting all UAT findings into a consistent taxonomy. Lane B catches governance drift before it misleads downstream workstreams.

Output: lane-a-uat-reclass.md, lane-b-governance-audit.md
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/research/GAP-MATRIX-2026-05-05.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/CONCERNS.md
@.planning/PROJECT.md

<interfaces>
<!-- UAT source files the executor must read -->
Source directory: .hivemind/uat/team-b/results/
Batch files (11 total):
- team-b-batch-1-3-results-2026-05-05.md
- team-b-batch-4-results-2026-05-05.md
- team-b-batch-5-results-2026-05-05.md
- team-b-batch-6-results-2026-05-05.md
- team-b-batch-7-results-2026-05-05.md
- team-b-batch-8-results-2026-05-05.md
- team-b-batch-9-results-2026-05-05.md
- team-b-batch-10-results-2026-05-05.md
- team-b-batch-11-final-audit-2026-05-05.md
- team-b-critical-L1-L2-chain-blocked-2026-05-05.md
- team-b-critical-validate-restart-drift-2026-05-05.md

4-Path Taxonomy (from GAP-MATRIX):
- path-1: Foundation (types, helpers, state, concurrency)
- path-2: Runtime (plugin, hooks, lifecycle, delegation)
- path-3: Quality (completion-detection, testing, observability)
- path-4: Ecosystem (skills, agents, commands, permissions)

Evidence Levels:
- DIRECT: Finding references specific file:line evidence
- CORROBORATED: Finding matches multiple independent sources
- TESTIMONIAL: Finding from a single source without cross-reference
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Lane A — UAT Reclassification</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclass.md
  </files>
  <action>
Read all 11 UAT batch files from `.hivemind/uat/team-b/results/`. For each finding:

1. Extract the test ID, PASS/FAIL status, subsystem, and description
2. Classify by path: path-1 (foundation), path-2 (runtime), path-3 (quality), path-4 (ecosystem)
3. Classify by lineage: hm, hf, or hm+hf (shared infrastructure)
4. Tag evidence level: DIRECT (file:line cited), CORROBORATED (multiple sources), TESTIMONIAL (single source)
5. Note any findings that don't fit the 4-path taxonomy (flag as "UNCLASSIFIED")

Output format — markdown table per batch, then a summary section:

```
## Summary Statistics
- Total findings: N
- Path-1 (Foundation): N findings (N PASS, N FAIL)
- Path-2 (Runtime): N findings (N PASS, N FAIL)
- Path-3 (Quality): N findings (N PASS, N FAIL)
- Path-4 (Ecosystem): N findings (N PASS, N FAIL)
- Lineage hm-only: N findings
- Lineage hf-only: N findings
- Lineage hm+hf: N findings
- UNCLASSIFIED: N findings
- Evidence DIRECT: N, CORROBORATED: N, TESTIMONIAL: N
```

Write output to `map/lane-a-uat-reclass.md`. Target: 200-400 lines.
  </action>
  <verify>
    <automated>grep -c 'team-b-batch' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclass.md | grep -qv '0' && echo "PASS: Lane A output references UAT batches" || echo "FAIL: no batch references"</automated>
  </verify>
  <done>
All 116 UAT findings reclassified by 4 paths × 2 lineages with evidence tags. Summary statistics section present. Any unclassifiable findings flagged.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Lane B — Governance Drift Audit</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-audit.md
  </files>
  <action>
Cross-reference governance claims against source files. For each document, extract claims and verify:

**ARCHITECTURE.md claims to verify:**
- "9 tools registered" → check `src/plugin.ts` tool registrations (actual: 16 per RESEARCH.md)
- Module responsibility table → verify each module still exists and does what's claimed
- CQRS boundary description → verify hooks still follow read-side/write-side split

**CONCERNS.md claims to verify:**
- "notification-handler DEPRECATED" → check if `src/lib/notification-handler.ts` is still imported/used
- Known fragile areas → verify they haven't been refactored since CONCERNS.md was written
- Performance concerns → verify they're still relevant

**PROJECT.md claims to verify:**
- Agent count (claimed: 97) → actual count in `.opencode/agents/`
- Skill count (claimed: 51) → actual count in `.opencode/skills/`
- Command count (claimed: 18) → actual count in `.opencode/commands/`
- Q6 state root separation → verify `.hivemind/` exists and `.opencode/` has no state files

**STATE.md claims to verify:**
- Phase status entries → verify against actual phase directories

For each verified claim, tag: CONFIRMED (source matches), DRIFT (source diverged), UNVERIFIABLE (source not found).

Output format:
```
## Drift Report
| Claim | Source Doc | Actual | Status | Evidence |
|-------|-----------|--------|--------|----------|
```

Write output to `map/lane-b-governance-audit.md`. Target: 150-300 lines.
  </action>
  <verify>
    <automated>grep -c 'DRIFT' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-audit.md | grep -qv '0' && echo "PASS: Lane B drift report contains findings" || echo "FAIL: no DRIFT entries"</automated>
  </verify>
  <done>
All governance claims verified against source. Drift report with CONFIRMED/DRIFT/UNVERIFIABLE tags. Known drifts (9→16 tools, notification-handler) confirmed or resolved.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| UAT results → Lane A | Read-only consumption of test results (trusted internal data) |
| Governance docs → Lane B | Claims in .md files verified against source code |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-02 | I | Governance claims | accept | Read-only verification — no state mutation, findings are audit trails |
</threat_model>

<verification>
- lane-a-uat-reclass.md contains references to all 11 batch files
- lane-b-governance-audit.md contains at least 1 DRIFT entry (expected: tool count mismatch)
- Both files are well-structured markdown with tables
</verification>

<success_criteria>
- UAT reclassification covers all 116 findings across 4 paths × 2 lineages
- Governance drift report flags at minimum the known 9→16 tool count mismatch
- Both output files are non-empty, structured markdown
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-02-SUMMARY.md`
</output>

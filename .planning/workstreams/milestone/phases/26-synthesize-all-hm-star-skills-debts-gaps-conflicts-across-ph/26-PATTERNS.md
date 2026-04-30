# Phase 26: Synthesize hm-* Skill Debts into Unified Quality Requirements - Pattern Map

**Mapped:** 2026-04-25  
**Files analyzed:** 7 planned artifacts + 1 requirements update  
**Analogs found:** 8 / 8  
**Read-only boundary:** Phase 26 patterns apply to planning artifacts only. Do not mutate `src/**` or `.opencode/skills/**/SKILL.md` during execution.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/26.../26-PLAYBOOK.md` | documentation / quality contract | transform + batch synthesis | `26-01-PLAN.md`; `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md` | role-match |
| `.planning/phases/26.../26-ECOLOGY-AUDIT.md` | audit catalog | batch inventory + scoring | `CR-AUDIT-ECOSYSTEM.md`; `25-SOURCE-COVERAGE-AUDIT.md` | exact |
| `.planning/phases/26.../26-ARCHIVE-REPORT.md` | archive / closure report | evidence transform | `26-04-PLAN.md`; `.planning/STATE.md`; `.planning/ROADMAP.md` | role-match |
| `.planning/phases/26.../26-G-B-SPEC-hm-spec-driven-authoring.md` | specification | transform + acceptance contract | `16.5-SPEC.md`; `hm-spec-driven-authoring/SKILL.md`; `gsd-spec-phase/SKILL.md` | exact |
| `.planning/phases/26.../26-G-B-SPEC-hm-test-driven-execution.md` | specification | transform + acceptance contract | `16.5-SPEC.md`; `hm-test-driven-execution/SKILL.md`; `gsd-add-tests/SKILL.md` | exact |
| `.planning/phases/26.../26-EXECUTION-ROADMAP.md` | roadmap | dependency sequencing | `26-04-PLAN.md`; `26-RESEARCH.md` dependency map | exact |
| `.planning/REQUIREMENTS.md` update section | requirements registry | append-only traceability | Existing `.planning/REQUIREMENTS.md` requirement tables | exact |

## Naming Reconciliation Required

The delegated artifact list uses `26-*` filenames (`26-PLAYBOOK.md`, `26-ECOLOGY-AUDIT.md`, `26-ARCHIVE-REPORT.md`, `26-G-B-SPEC-*`, `26-EXECUTION-ROADMAP.md`). Existing Phase 26 plans use unprefixed names (`PLAYBOOK.md`, `ECOSYSTEM-AUDIT.md`, `SPEC-*`, `ROADMAP-27-30.md`, `ARCHIVE-22.md`, `ARCHIVE-23.md`) while `26-VALIDATION.md` expects prefixed names at lines 41-43 and 52-54. Planner/executor must choose one convention before execution and update plan references consistently.

## Pattern Assignments

### `26-PLAYBOOK.md` (documentation / quality contract, transform + batch synthesis)

**Primary analogs:**
- `.planning/phases/26.../26-01-PLAN.md`
- `.opencode/skills/hivefiver-use-authoring-skills/references/05-skill-quality-matrix.md`
- `.opencode/skills/hivefiver-use-authoring-skills/references/10-eval-lifecycle.md`

**Required sections pattern** (`26-01-PLAN.md` lines 77-90):
```markdown
Create `PLAYBOOK.md` with these exact top-level sections: `# hm-* Skill Quality Playbook`, `## Purpose`, `## Decision Traceability`, `## Quality Tiers`, `## Quality Dimensions`, `## Integration Wiring Requirements`, `## Cross-Platform Compatibility Rules`, `## Evidence Requirements`, `## Applying This Playbook in Phase 27+`.
...
Each subsection must contain these exact labels: `Description`, `PASS Criteria`, `FAIL Criteria`, `Verification Command`, `Exemplar Skill`, `Agent Integration`, `Command Integration`, `Tool Integration`, `Plugin Hook Integration`, `Runtime State Integration`.
```

**Rubric pattern** (`05-skill-quality-matrix.md` lines 3-21):
```markdown
| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Trigger Accuracy** | 25% | Description triggers on specific conditions, false positives minimized |
| **Action Coherence** | 25% | ONE thing well, clear entry/exit, no mission creep |
| **Reference Integrity** | 20% | 1-level depth, numbered files, no circular refs |
| **Non-Redundancy** | 15% | No overlap with existing skills, distinct purpose |
| **Edge Case Coverage** | 15% | Handles degraded, delegated, resumed, post-cancel states |
```

**Evidence loop pattern** (`10-eval-lifecycle.md` lines 126-138):
```markdown
1. Create evals (2-3 test cases minimum)
2. Run with-skill and without-skill for each eval
3. Grade outputs against assertions
4. Aggregate benchmarks and analyze patterns
5. Review outputs with a human
6. Propose improvements based on signals
7. Apply changes to SKILL.md
8. Repeat from step 2 in new iteration directory
9. Stop when: pass rate >= target, feedback is empty, no meaningful improvement
```

**Source inputs:** `26-CONTEXT.md` D-01 through D-07, `26-RESEARCH.md` quality dimensions, `CR-AUDIT-ECOSYSTEM.md` 6-NON criteria, `05-skill-quality-matrix.md`, `10-eval-lifecycle.md`, `src/plugin.ts` integration tools.  
**Verification pattern:** count `PASS Criteria`, `FAIL Criteria`, and `Verification Command` occurrences; grep required tool names from `src/plugin.ts` lines 86-97.

---

### `26-ECOLOGY-AUDIT.md` (audit catalog, batch inventory + scoring)

**Primary analogs:**
- `.planning/phases/18.../CR-AUDIT-ECOSYSTEM.md`
- `.planning/phases/25.../25-SOURCE-COVERAGE-AUDIT.md`
- `.planning/phases/26.../26-02-PLAN.md`

**Audit criteria pattern** (`CR-AUDIT-ECOSYSTEM.md` lines 9-18):
```markdown
| NON | Failure Mode | What to Check |
|-----|-------------|---------------|
| NON-1 | Non-audit | Does skill body cite a pre-authoring audit or parent→child→state→stage map? |
| NON-2 | Non-contextual | Does skill have "stacks with / clashes with" section or delta-map vs nearest sibling? |
| NON-3 | Non-cycles | Does skill body include entry trigger, exit criterion, loop-back path? |
| NON-4 | Non-hierarchy | Does frontmatter declare metadata.layer AND does description contain exclusion? |
| NON-5 | Non-ecosystem-eval | Does skill have stacked eval scenario (not just isolated trigger-query evals)? |
| NON-6 | Non-systematic-pattern | Is pattern decision documented? Body size appropriate? Scripts deterministic? |
```

**Audit grid pattern** (`CR-AUDIT-ECOSYSTEM.md` lines 20-24):
```markdown
| # | Skill | NON-1 | NON-2 | NON-3 | NON-4 | NON-5 | NON-6 | Cluster(s) | Grade | Decision |
|---|-------|-------|-------|-------|-------|-------|-------|------------|-------|----------|
```

**Coverage table pattern** (`25-SOURCE-COVERAGE-AUDIT.md` lines 6-17):
```markdown
| Source Type | Item | Coverage | Plan(s) |
|---|---|---|---|
| GOAL | ... | COVERED | 25-01, 25-02, 25-03 |
| REQ | ... | EXCLUDED — no mapped requirement IDs exist ... | All |
```

**Source inputs:** current `.opencode/skills/` directory, `CR-AUDIT-ECOSYSTEM.md`, `CR-GAP-MAP.md`, `CR-DECISIONS.md`, `26-RESEARCH.md` current inventory notes.  
**Required sections:** `Audit Method`, `Canonical Inventory`, `Research Count Discrepancy`, `Summary Statistics`, `Full Skill Inventory`, `8-Dimension Score Matrix`, `Tier Distribution`, `Priority Queue`, `Phase 18 Decision Reconciliation`, `Open Gap Register`.  
**Verification pattern:** inventory must be deduplicated by directory basename; grep for `hm-spec-driven-authoring`, `hm-test-driven-execution`, `hm-command-parser appears twice`, and enough `hm-`/`hivefiver-` rows.

---

### `26-ARCHIVE-REPORT.md` (archive / closure report, evidence transform)

**Primary analogs:**
- `.planning/phases/26.../26-04-PLAN.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`

**Closure evidence pattern** (`STATE.md` lines 91-112):
```markdown
| Phase | Status | Issue |
|-------|--------|-------|
| Phase 22 | NOT SUBSTANTIATED | No phase directory, commit scope doesn't match claims |
| Phase 23 | PARTIAL | Eval files expanded, but only 1/9 skills has stacked scenario |
...
| Phase 24 | COMPLETE | 3/3 plans — 6-NON removed from 18 skills, onboarding headings in 25 skills, Self-Correction in 5 coordinator skills |
```

**Archive record pattern** (`26-04-PLAN.md` lines 115-136):
```markdown
Create `ARCHIVE-22.md` with sections: `# Phase 22 Archive Record`, `## Status`, `## Original Claim`, `## Verified Reality`, `## Absorbed Scope`, `## Evidence`, `## Closure Decision`.
Set Status exactly to `NOT SUBSTANTIATED`.
...
Create `ARCHIVE-23.md` with sections: `# Phase 23 Archive Record`, `## Status`, `## Original Claim`, `## Verified Reality`, `## Absorbed Scope`, `## Evidence`, `## Closure Decision`.
Set Status exactly to `PARTIAL`.
```

**Roadmap status pattern** (`ROADMAP.md` lines 660-665):
```markdown
| 22. Script Hardening + 6-NON (Playbook Phase 4) | 0/7 skills | ❌ NOT SUBSTANTIATED — no phase dir, commit scope doesn't match claims |
| 23. Body Quality + Eval (Playbook Phase 5) | 1/9 skills | ⚠️ PARTIAL — eval files expanded, only 1/9 has stacked scenario |
| 24. Fix 22 Failed hm-* Skills (Playbook Phase 6) | 3/3 plans, 8/8 truths | ✅ COMPLETE — 2026-04-23 |
```

**Source inputs:** `STATE.md`, `ROADMAP.md`, `24-VERIFICATION.md`, `26-CONTEXT.md` D-08/D-09, `26-RESEARCH.md` Phase 22/23 absorption strategy.  
**Verification pattern:** grep archive report for `NOT SUBSTANTIATED`, `PARTIAL`, `PLAYBOOK D3`, `PLAYBOOK D4`, and `No separate re-execution required`.

---

### `26-G-B-SPEC-hm-spec-driven-authoring.md` (specification, transform + acceptance contract)

**Primary analogs:**
- `.planning/phases/16.5.../16.5-SPEC.md`
- `.opencode/skills/hm-spec-driven-authoring/SKILL.md`
- `/Users/apple/.claude/skills/gsd-spec-phase/SKILL.md`

**SPEC structure pattern** (`16.5-SPEC.md` lines 20-64):
```markdown
## Requirements

### R-01: Zod Schema Foundation (CYCLE 1)
...
### R-06: Test Harness (CYCLE 6)
- Unit tests for all schemas
- Integration tests for compiler round-trips
- End-to-end workflow tests
- CLI validation script for CI
```

**Requirement format pattern** (`hm-spec-driven-authoring/SKILL.md` lines 77-84):
```markdown
### REQ-01: <short description>
**Condition:** <exactly one falsifiable statement>
**Test:** <test file and function name>
**Status:** [not-tested | red | green | regressed]
```

**GSD benchmark pattern** (`gsd-spec-phase/SKILL.md` lines 15-28, 56-62):
```markdown
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.
...
Output: `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
...
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
```

**Current-state excerpts to cite:** `hm-spec-driven-authoring/SKILL.md` frontmatter and triggers lines 1-23, pipeline lines 42-75, reference map/cross-refs lines 95-107, eval trigger-only bundle `evals/evals.json` lines 1-10.  
**Required sections:** `Current State`, `Target State`, `Requirements`, `Integration Contract`, `Eval Contract`, `Verification Commands`, `Phase 27 Execution Notes`.  
**Verification pattern:** grep `REQ-SDA-`; count `Acceptance Criteria` ≥ 7; require `prompt-skim`, `prompt-analyze`, `hm-test-driven-execution`, `hm-planning-with-files`.

---

### `26-G-B-SPEC-hm-test-driven-execution.md` (specification, transform + acceptance contract)

**Primary analogs:**
- `.planning/phases/16.5.../16.5-SPEC.md`
- `.opencode/skills/hm-test-driven-execution/SKILL.md`
- `/Users/apple/.agents/skills/gsd-add-tests/SKILL.md`

**TDD workflow pattern** (`hm-test-driven-execution/SKILL.md` lines 41-75):
```markdown
### Red Phase
```bash
# Write test BEFORE implementation
# Run test — expect FAIL
npm test
# If it passes, test is invalid. Rewrite.
```

**Gate:** If test passes on first run, STOP. The test is not testing what you think it is.
...
**Gate:** If refactor breaks tests, revert and try smaller refactor steps.
```

**Coverage-claim pattern** (`hm-test-driven-execution/SKILL.md` lines 76-96):
```markdown
### Valid Claim
"Coverage: 87% (verified by `npm run test:coverage` at commit `a1b2c3d`)"

### Verification Command
```bash
# Always run coverage in the current message before claiming
npm run test:coverage
# Copy the output line that shows coverage percentage
```
```

**GSD test benchmark pattern** (`gsd-add-tests/SKILL.md` lines 16-21, 35-38):
```markdown
Generate unit and E2E tests for a completed phase, using its SUMMARY.md, CONTEXT.md, and VERIFICATION.md as specifications.
...
Preserve all workflow gates (classification approval, test plan approval, RED-GREEN verification, gap reporting).
```

**Current-state excerpts to cite:** `hm-test-driven-execution/SKILL.md` frontmatter/triggers lines 1-23, anti-patterns lines 98-105, cross-refs lines 114-119, eval trigger-only bundle `evals/evals.json` lines 1-10.  
**Required sections:** `Current State`, `Target State`, `Requirements`, `Integration Contract`, `Eval Contract`, `Verification Commands`, `Phase 27 Execution Notes`.  
**Verification pattern:** grep `REQ-TDE-`; count `Acceptance Criteria` ≥ 7; require `npm run test:coverage`, `pytest --cov`, `go test ./... -cover`, and `runtime-truthful`.

---

### `26-EXECUTION-ROADMAP.md` (roadmap, dependency sequencing)

**Primary analogs:**
- `.planning/phases/26.../26-04-PLAN.md`
- `.planning/phases/26.../26-RESEARCH.md` dependency map

**Dependency map pattern** (`26-RESEARCH.md` lines 268-288):
```text
Phase 26: PLAYBOOK + audit + G-B SPECs + archive records + HMQUAL requirements
  └─ Phase 27: G-B Quality Assurance Demonstration
       Inputs: PLAYBOOK.md, ECOSYSTEM-AUDIT.md, SPEC-hm-spec-driven-authoring.md, SPEC-hm-test-driven-execution.md
       Scope: Rewrite/expand exactly hm-spec-driven-authoring + hm-test-driven-execution
       Exit: both pass D1-D8 and include stacked evals
  └─ Phase 28: G-C Research Lineage
  └─ Phase 29: G-D Execution Lineage
  └─ Phase 30: G-A Guardrail Lineage
  └─ Phase 31: deferred cross-lineage E2E integration validation
```

**Roadmap section pattern** (`26-04-PLAN.md` lines 88-112):
```markdown
Create `ROADMAP-27-30.md` with exact sections: `# Phase 27-30 hm-* Quality Execution Roadmap`, `## Dependency Basis`, `## Phase 27: G-B Quality Assurance Demonstration`, `## Phase 28: G-C Research Lineage`, `## Phase 29: G-D Execution Lineage`, `## Phase 30: G-A Guardrail Lineage`, `## Deferred Scope Note`, `## Sequencing Rationale`, `## Entry Criteria Per Phase`, `## Exit Criteria Per Phase`.
...
Every Verification Gate must require all target skills to score PASS on all 8 PLAYBOOK dimensions.
```

**Source inputs:** completed playbook/audit/spec/archive outputs, `26-CONTEXT.md` deferred section lines 145-154, `26-RESEARCH.md` dependency map.  
**Verification pattern:** grep phase headings for 27-30; count `Verification Gate` ≥ 4; ensure Phase 31 appears only as deferred scope, not an execution section.

---

### `.planning/REQUIREMENTS.md` update section (requirements registry, append-only traceability)

**Primary analogs:**
- Existing `.planning/REQUIREMENTS.md` requirement tables
- `.planning/phases/26.../26-04-PLAN.md`

**Existing requirement field pattern** (`REQUIREMENTS.md` lines 116-124):
```markdown
| Field | Value |
|-------|-------|
| **ID** | RUN-3a |
| **Category** | Runtime Architecture |
| **Priority** | P0 — Foundation for all subsequent runtime features |
| **Status** | Verified |
| **Dependencies** | None (Phase 2 kickoff) |
| **Description** | Agents run in background processes, spawn in new terminal panes, and auto-cleanup on completion. |
| **Acceptance Criteria** | 1. Background agent spawns ... |
```

**HMQUAL append pattern** (`26-04-PLAN.md` lines 139-158):
```markdown
Append a new section to `.planning/REQUIREMENTS.md` titled `## Phase 26: hm-* Skill Quality Standards`.
Add exactly 8 requirements with IDs `HMQUAL-01` through `HMQUAL-08`, mapping to PLAYBOOK D1 through D8.
Each requirement must use the existing REQUIREMENTS.md table style with fields: ID, Category, Priority, Status, Dependencies, Description, Acceptance Criteria.
```

**Source inputs:** `26-PLAYBOOK.md` D1-D8, `26-EXECUTION-ROADMAP.md` phase traceability, existing requirements style.  
**Verification pattern:** grep `## Phase 26: hm-* Skill Quality Standards`, `HMQUAL-01`, `HMQUAL-08`; count `HMQUAL-` occurrences ≥ 16.

## Shared Patterns

### Evidence-First Claims
**Source:** `26-RESEARCH.md` lines 377-402; `10-eval-lifecycle.md` lines 94-125  
**Apply to:** all Phase 26 artifacts  
Every artifact must cite source paths/lines or command output. Avoid Phase 22-style unsubstantiated closure by including mechanical verification commands for every major claim.

### Runtime Integration Surface
**Source:** `src/plugin.ts` lines 86-97  
**Apply to:** playbook D6, G-B SPEC integration contracts, roadmap gates  
```typescript
tool: {
  "delegate-task": createDelegateTaskTool(delegationManager),
  "delegation-status": createDelegationStatusTool(delegationManager),
  ...(ptyManager ? {
    "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
  } : {}),
  "prompt-skim": createPromptSkimTool(directory),
  "prompt-analyze": createPromptAnalyzeTool(directory),
  "session-patch": createSessionPatchTool(directory),
  "configure-primitive": createConfigurePrimitiveTool(),
  "validate-restart": createValidateRestartTool(),
}
```

### Schema-Aligned Tool Contracts
**Source:** `src/schema-kernel/prompt-enhance.schema.ts` lines 12-31 and 43-71  
**Apply to:** playbook D6, G-B SPEC optional tool integrations  
Use strict Zod schemas as the model for any artifact fields that describe prompt skim/analyze output or future validation contracts.

### Eval Bundle Shape
**Source:** `hm-completion-looping/evals/evals.json` lines 1-38  
**Apply to:** playbook D4, ecology audit scoring, both G-B SPEC eval contracts  
Target quality requires both `trigger_queries` and `stacked_scenario`; G-B current evals only have trigger queries.

### Read-Only Phase Boundary
**Source:** `26-CONTEXT.md` lines 19-24; `26-RESEARCH.md` lines 240-245  
**Apply to:** all plans  
Phase 26 writes planning artifacts and a requirements update only. It must not rewrite skills, mutate `src/`, or touch IDE sync directories.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All requested artifact types have at least role-match analogs. The only gap is filename convention drift between delegated artifact names and existing Phase 26 plans/validation. |

## Metadata

**Analog search scope:** `.planning/phases/**`, `.planning/REQUIREMENTS.md`, `.opencode/skills/**`, selected GSD benchmark skills, `src/plugin.ts`, `src/schema-kernel/`  
**Files scanned/read:** 24 source files/directories  
**Pattern extraction date:** 2026-04-25

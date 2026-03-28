# Integration Plan: External Skill Patterns → HiveMind 15-Skill Ecosystem

**Created:** 2026-03-28
**Planner:** hiveplanner
**Branch:** v2.9.5-detox-dev
**Output root:** `.developing-skills/refactored-skills/`
**Methodology:** investigate (DONE) → audit (DONE) → pattern-gate (DONE) → plan (THIS) → implement (batches) → verify
**Status:** validated — ready for execution

---

## Dependency Graph

```
BATCH 1 (Foundation)
├── 1.1 hivemind-architecture NEW (6 refs + 2 templates)
├── 1.2 hivemind-patterns EXPAND (1 new ref + SKILL.md edit)
│
BATCH 2 (Execution Layer) — depends on Batch 1
├── 2.1 hivemind-execution NEW (4 refs + 2 templates)
├── 2.2 hivemind-refactor EXPAND (4 new refs + SKILL.md edit)
│
BATCH 3 (Domain Expansion) — depends on Batch 1
├── 3.1 use-hivemind-planning EXPAND (4 new refs)
├── 3.2 use-hivemind-tdd EXPAND (4 new refs)
├── 3.3 hivemind-spec-driven EXPAND (2 new refs)
├── 3.4 Pattern 3 conditional loading fixes (5 skills)
│
BATCH 4 (Cross-Skill Consistency) — depends on Batches 1-3
├── 4.1 use-hivemind-delegation EXPAND (2 new refs)
├── 4.2 use-hivemind-research EXPAND (2 new refs)
├── 4.3 Orphaned skill reference fixes (3 skills)
├── 4.4 Cross-skill consistency verification
```

### Critical Path

```
Batch 1.1 → Batch 2.1 → Batch 4.4 (longest chain)
```

### Parallel Candidates

- Batch 1.1 and 1.2 can run in parallel (no shared files)
- Batches 2.1 and 2.2 can run in parallel (no shared files)
- All 4 sub-tasks in Batch 3 can run in parallel (no shared skills)
- Batch 4.1 and 4.2 can run in parallel (no shared files)

---

## Task Inventory

| # | Task ID | Target Skill | Type | Pattern | Source Asset(s) | Est. Lines | Dependencies |
|---|---------|-------------|------|---------|-----------------|-----------|-------------|
| 1.1 | arch-new-skill | hivemind-architecture | create-new-skill | P3 | C1-C4 synthesis | ~380 | none |
| 1.2 | arch-refs-a | hivemind-architecture | create-reference | — | C2: ADR template | ~180 | 1.1 |
| 1.3 | arch-refs-b | hivemind-architecture | create-reference | — | C3: 42-rule clean arch catalog | ~220 | 1.1 |
| 1.4 | arch-refs-c | hivemind-architecture | create-reference | — | C2: NFR checklist | ~200 | 1.1 |
| 1.5 | arch-refs-d | hivemind-architecture | create-reference | — | C2: pattern selection matrix | ~160 | 1.1 |
| 1.6 | arch-refs-e | hivemind-architecture | create-reference | — | C2: database selection matrix | ~150 | 1.1 |
| 1.7 | arch-refs-f | hivemind-architecture | create-reference | — | C4: dependency categories | ~130 | 1.1 |
| 1.8 | arch-tmpl-a | hivemind-architecture | create-template | — | C2: ADR template adapted | ~80 | 1.1 |
| 1.9 | arch-tmpl-b | hivemind-architecture | create-template | — | C1: blueprint template adapted | ~100 | 1.1 |
| 1.10 | patterns-expand-ref | hivemind-patterns | create-reference | — | C2: architecture pattern matrix | ~180 | none |
| 1.11 | patterns-edit-md | hivemind-patterns | edit-skill-md | P3 | C2 synthesis | +30 | 1.10 |
| 2.1 | exec-new-skill | hivemind-execution | create-new-skill | P1 | B2 + A4 synthesis | ~300 | 1.1 |
| 2.2 | exec-refs-a | hivemind-execution | create-reference | — | A4: SOLID examples | ~200 | 2.1 |
| 2.3 | exec-refs-b | hivemind-execution | create-reference | — | A4: refactor ROI formula | ~120 | 2.1 |
| 2.4 | exec-refs-c | hivemind-execution | create-reference | — | A4: code quality metrics | ~160 | 2.1 |
| 2.5 | exec-refs-d | hivemind-execution | create-reference | — | A5: dependency audit workflow | ~150 | 2.1 |
| 2.6 | exec-tmpl-a | hivemind-execution | create-template | — | B2: execution packet adapted | ~90 | 2.1 |
| 2.7 | exec-tmpl-b | hivemind-execution | create-template | — | B2: quality gate adapted | ~80 | 2.1 |
| 2.8 | refactor-refs-a | hivemind-refactor | create-reference | — | A3: code review checklists | ~220 | none |
| 2.9 | refactor-refs-b | hivemind-refactor | create-reference | — | A2: reviewer dimension allocation | ~140 | none |
| 2.10 | refactor-refs-c | hivemind-refactor | create-reference | — | A2: severity calibration scoring | ~120 | none |
| 2.11 | refactor-refs-d | hivemind-refactor | create-reference | — | A1: PR review comment template | ~100 | none |
| 2.12 | refactor-edit-md | hivemind-refactor | edit-skill-md | P3 | A1-A3 synthesis | +40 | 2.8-2.11 |
| 3.1 | planning-refs-a | use-hivemind-planning | create-reference | — | B3: Priority × Value matrix | ~120 | none |
| 3.2 | planning-refs-b | use-hivemind-planning | create-reference | — | B3: INVEST criteria | ~140 | none |
| 3.3 | planning-refs-c | use-hivemind-planning | create-reference | — | B3: Fibonacci estimation | ~100 | none |
| 3.4 | planning-refs-d | use-hivemind-planning | create-reference | — | B3: dependency type taxonomy | ~130 | none |
| 3.5 | planning-edit-md | use-hivemind-planning | edit-skill-md | P1 | B3 synthesis | +25 | 3.1-3.4 |
| 3.6 | tdd-refs-a | use-hivemind-tdd | create-reference | — | B5: ISTQB test design | ~180 | none |
| 3.7 | tdd-refs-b | use-hivemind-tdd | create-reference | — | B5: ISO 25010 quality model | ~140 | none |
| 3.8 | tdd-refs-c | use-hivemind-tdd | create-reference | — | B5: quality gates entry/exit | ~150 | none |
| 3.9 | tdd-refs-d | use-hivemind-tdd | create-reference | — | B5: risk-based testing | ~130 | none |
| 3.10 | tdd-edit-md | use-hivemind-tdd | edit-skill-md | P1 | B5 synthesis | +25 | 3.6-3.9 |
| 3.11 | spec-refs-a | hivemind-spec-driven | create-reference | — | B4: Problem/Solution/Impact triad | ~120 | none |
| 3.12 | spec-refs-b | hivemind-spec-driven | create-reference | — | B4: Given/When/Then criteria | ~140 | none |
| 3.13 | spec-edit-md | hivemind-spec-driven | edit-skill-md | P1 | B4 synthesis | +20 | 3.11-3.12 |
| 3.14 | cond-refactor | hivemind-refactor | edit-skill-md | P3 | Pattern 3 fix | +15 | 2.12 |
| 3.15 | cond-debug | hivemind-system-debug | edit-skill-md | P3 | Pattern 3 fix | +15 | none |
| 3.16 | cond-patterns | hivemind-patterns | edit-skill-md | P3 | Pattern 3 fix | +15 | 1.11 |
| 3.17 | cond-delegation | use-hivemind-delegation | edit-skill-md | P3 | Pattern 3 fix | +15 | none |
| 3.18 | cond-research | use-hivemind-research | edit-skill-md | P3 | Pattern 3 fix | +15 | none |
| 4.1 | deleg-refs-a | use-hivemind-delegation | create-reference | — | A2: multi-reviewer protocol | ~140 | 3.17 |
| 4.2 | deleg-refs-b | use-hivemind-delegation | create-reference | — | B2: hard stop conditions | ~120 | 3.17 |
| 4.3 | deleg-edit-md | use-hivemind-delegation | edit-skill-md | P3 | A2 + B2 synthesis | +25 | 4.1-4.2 |
| 4.4 | research-refs-a | use-hivemind-research | create-reference | — | C5: git-backed experiment safety | ~130 | 3.18 |
| 4.5 | research-refs-b | use-hivemind-research | create-reference | — | C5: results TSV format | ~80 | 3.18 |
| 4.6 | research-edit-md | use-hivemind-research | edit-skill-md | P3 | C5 synthesis | +20 | 4.4-4.5 |
| 4.7 | orphan-debug | hivemind-system-debug | fix-cross-reference | — | Orphan fix | +10 | 3.15 |
| 4.8 | orphan-patterns | hivemind-patterns | fix-cross-reference | — | Orphan fix | +10 | 3.16 |
| 4.9 | orphan-authoring | use-hivemind-skill-authoring | fix-cross-reference | — | Orphan fix | +10 | none |
| 4.10 | cross-skill-check | ALL 17 skills | fix-cross-reference | — | Full consistency pass | 0 | 1.1-4.9 |

**Total tasks:** 53
**New skills:** 2 (hivemind-architecture, hivemind-execution)
**New reference files:** 26
**New template files:** 4
**SKILL.md edits:** 14
**Cross-reference fixes:** 4

---

## Batch 1: hivemind-architecture (NEW) + hivemind-patterns Expansion

**Goal:** Create the foundational architecture skill and expand the patterns catalog with architecture-specific content.
**Depends on:** Nothing (foundation batch).
**Target agent:** hivemaker
**Estimated tasks:** 11

### Task 1.1 — hivemind-architecture: Create SKILL.md

| Field | Value |
|-------|-------|
| **Task ID** | arch-new-skill |
| **Target** | `.developing-skills/refactored-skills/hivemind-architecture/SKILL.md` |
| **Type** | create-new-skill |
| **Pattern** | Pattern 3 (conditional details) |
| **Source** | Synthesis of C1 (architecture-blueprint-generator), C2 (architecture-designer), C3 (clean-architecture), C4 (improve-codebase-architecture) |
| **Est. Lines** | ~380 |
| **Dependencies** | None |

**SKILL.md structure:**
```yaml
---
name: hivemind-architecture
parent: use-hivemind
description: Architecture decision guidance — ADR templates, pattern selection, NFR checklists, and clean architecture rules for structural decisions.
---
```

**Required sections:**
1. Load Position (Layer: Depth, after use-hivemind + hivemind-patterns)
2. When You Need This (5+ triggers)
3. Do Not Use This For (4+ exclusions)
4. Architecture Decision Records — when/how to write ADRs
5. Pattern Selection Decision Tree — conditional loading trigger for references
6. NFR Checklist — quantified targets for performance, scalability, security
7. Clean Architecture Quick Reference — 42-rule summary with conditional loading
8. Anti-Patterns (5+ architecture anti-patterns)
9. Sibling Skills table
10. Bundled Resources table (listing all 6 refs + 2 templates)
11. Table of Contents linking all sections

**Success criteria:**
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] parent field = use-hivemind
- [ ] Table of Contents present
- [ ] Bundled Resources table listing all bundled files
- [ ] Pattern 3 decision tree present with conditional loading triggers
- [ ] Line count <500

---

### Task 1.2–1.7 — hivemind-architecture: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 1.2 | `references/architecture-decision-record.md` | C2: ADR template + example | ~180 | ADR structure template, status categories, example ADR |
| 1.3 | `references/clean-architecture-rules.md` | C3: 42-rule catalog | ~220 | All 42 rules organized by layer, dependency examples |
| 1.4 | `references/nfr-checklist.md` | C2: NFR checklist with quantified targets | ~200 | Performance targets, scalability thresholds, security checklist |
| 1.5 | `references/pattern-selection-matrix.md` | C2: architecture pattern selection matrix | ~160 | Monolith vs microservice vs modular, selection criteria |
| 1.6 | `references/database-selection-matrix.md` | C2: database selection matrix | ~150 | SQL vs NoSQL vs graph, selection criteria by use case |
| 1.7 | `references/dependency-categories.md` | C4: dependency categories taxonomy | ~130 | Stable vs volatile, framework vs domain, coupling analysis |

**Success criteria per file:**
- [ ] File exists in `references/` directory
- [ ] Content adapted from external source, not copied verbatim
- [ ] Uses HiveMind conventions (CQRS, tool.schema, etc.)
- [ ] No external branding or repo-specific references

---

### Task 1.8–1.9 — hivemind-architecture: Create Template Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 1.8 | `templates/architecture-decision.md` | C2: ADR template | ~80 | ADR markdown template with status, context, decision, consequences |
| 1.9 | `templates/blueprint-template.md` | C1: blueprint generator | ~100 | System blueprint template with layers, boundaries, data flow |

---

### Task 1.10–1.11 — hivemind-patterns: Expansion

| Task | File | Type | Source | Est. Lines |
|------|------|------|--------|-----------|
| 1.10 | `references/architecture-patterns.md` | create-reference | C2: architecture pattern matrix | ~180 |
| 1.11 | `SKILL.md` edit | edit-skill-md | Add conditional loading section + bundled resource entry | +30 |

**SKILL.md changes for 1.11:**
- Add `## Architecture Patterns` section with conditional loading trigger
- Add `references/architecture-patterns.md` to Bundled Resources table
- Add conditional loading decision tree: "If designing new system → load architecture-patterns.md; If evaluating existing → load pattern-catalog.md"

**Success criteria:**
- [ ] New reference file exists and is listed in Bundled Resources
- [ ] SKILL.md has conditional loading trigger for architecture patterns
- [ ] No existing content removed — only additive changes

---

### Batch 1 Success Criteria (Gate)

- [ ] `.developing-skills/refactored-skills/hivemind-architecture/SKILL.md` exists with valid YAML
- [ ] 6 reference files exist in `hivemind-architecture/references/`
- [ ] 2 template files exist in `hivemind-architecture/templates/`
- [ ] `hivemind-patterns/references/architecture-patterns.md` exists
- [ ] `hivemind-patterns/SKILL.md` lists new reference in Bundled Resources
- [ ] All SKILL.md files <500 lines
- [ ] All cross-references within batch are valid
- [ ] `wc -l` verification on all created files matches estimates ±20%
- [ ] User can manually copy Batch 1 to `.opencode/skills/` and restart

---

## Batch 2: hivemind-execution (NEW) + hivemind-refactor Expansion

**Goal:** Create the execution skill for hivemaker/hivehealer and expand refactor with review capabilities.
**Depends on:** Batch 1 complete (hivemind-execution cross-references hivemind-architecture for architecture decisions).
**Target agent:** hivemaker
**Estimated tasks:** 12

### Task 2.1 — hivemind-execution: Create SKILL.md

| Field | Value |
|-------|-------|
| **Task ID** | exec-new-skill |
| **Target** | `.developing-skills/refactored-skills/hivemind-execution/SKILL.md` |
| **Type** | create-new-skill |
| **Pattern** | Pattern 1 (high-level guide) |
| **Source** | Synthesis of B2 (executing-plans) + A4 (code-refactoring-refactor-clean) |
| **Est. Lines** | ~300 |
| **Dependencies** | Task 1.1 (hivemind-architecture exists for cross-reference) |

**SKILL.md structure:**
```yaml
---
name: hivemind-execution
parent: use-hivemind
description: Execution workflow for implementation agents — quality gates, code standards, and dependency audit guidance for clean delivery.
---
```

**Required sections:**
1. Load Position (Layer: Depth, after use-hivemind-delegation)
2. When You Need This (triggers for implementation agents)
3. Do Not Use This For (planning, debugging, refactoring)
4. The Execution Loop (receive slice → implement → verify → return)
5. Code Quality Standards (thresholds from A4)
6. Sibling Skills table (references hivemind-architecture, hivemind-refactor, use-hivemind-tdd)
7. Bundled Resources table (listing all 4 refs + 2 templates)
8. Table of Contents

**Success criteria:**
- [ ] SKILL.md exists with valid YAML
- [ ] parent = use-hivemind
- [ ] Pattern 1 workflow is linear and clear
- [ ] <500 lines

---

### Task 2.2–2.5 — hivemind-execution: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 2.2 | `references/solid-principles.md` | A4: SOLID examples multilanguage | ~200 | SRP, OCP, LSP, ISP, DIP with TypeScript + Python examples |
| 2.3 | `references/refactor-roi.md` | A4: refactoring ROI formula | ~120 | ROI calculation, break-even analysis, when to refactor vs rewrite |
| 2.4 | `references/code-quality-metrics.md` | A4: code quality metrics thresholds | ~160 | Cyclomatic complexity, LOC limits, coupling metrics, naming quality |
| 2.5 | `references/dependency-audit-workflow.md` | A5: dependency audit workflow | ~150 | Step-by-step dependency audit, stale dep detection, version pinning |

---

### Task 2.6–2.7 — hivemind-execution: Create Template Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 2.6 | `templates/execution-packet.md` | B2: execution workflow adapted | ~90 | Structured packet for implementation delegation |
| 2.7 | `templates/quality-gate.md` | B2: quality gate template | ~80 | Pre-commit quality gate checklist |

---

### Task 2.8–2.11 — hivemind-refactor: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 2.8 | `references/code-review-checklist.md` | A3: code review checklists (50+ items) | ~220 | Multi-dimensional review checklist: correctness, security, performance, readability |
| 2.9 | `references/reviewer-dimensions.md` | A2: multi-reviewer dimension allocation | ~140 | How to split review across dimensions (security reviewer, perf reviewer, etc.) |
| 2.10 | `references/severity-calibration.md` | A2: severity calibration scoring | ~120 | P0-P3 severity scoring with examples for each level |
| 2.11 | `references/review-comment-template.md` | A1: PR review comment template | ~100 | Structured review comment format: observation, evidence, suggestion |

---

### Task 2.12 — hivemind-refactor: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Task ID** | refactor-edit-md |
| **Target** | `.developing-skills/refactored-skills/hivemind-refactor/SKILL.md` |
| **Type** | edit-skill-md |
| **Source** | Synthesis of A1-A5 |
| **Changes** | +40 lines |

**SKILL.md changes:**
- Add `## Code Review Integration` section pointing to new references
- Update Bundled Resources table with 4 new reference files
- Add review workflow to refactor loop (Phase 4 VERIFY can optionally use review checklist)
- Conditional loading trigger: "If reviewing code → load code-review-checklist.md; If calibrating severity → load severity-calibration.md"

**Success criteria:**
- [ ] All 4 new references listed in Bundled Resources
- [ ] Code Review Integration section present
- [ ] No existing content removed
- [ ] Line count still <500

---

### Batch 2 Success Criteria (Gate)

- [ ] `.developing-skills/refactored-skills/hivemind-execution/SKILL.md` exists with valid YAML
- [ ] 4 reference files exist in `hivemind-execution/references/`
- [ ] 2 template files exist in `hivemind-execution/templates/`
- [ ] 4 new reference files exist in `hivemind-refactor/references/`
- [ ] `hivemind-refactor/SKILL.md` Bundled Resources updated
- [ ] hivemind-execution SKILL.md references hivemind-architecture (cross-reference valid)
- [ ] All SKILL.md files <500 lines
- [ ] `wc -l` verification matches estimates ±20%
- [ ] User can manually copy Batch 2 to `.opencode/skills/` and restart

---

## Batch 3: Planning/TDD/Spec Expansion + Pattern 3 Conditional Loading Fixes

**Goal:** Expand planning and TDD skills with breakdown techniques, expand spec-driven with acceptance criteria patterns, and fix Pattern 3 conditional loading across 5 skills.
**Depends on:** Batch 1 complete (planning may reference architecture patterns from hivemind-patterns).
**Target agent:** hivemaker
**Estimated tasks:** 18

### Task 3.1–3.4 — use-hivemind-planning: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 3.1 | `references/priority-value-matrix.md` | B3: Priority × Value matrix (P0-P3) | ~120 | P0 (critical) through P3 (nice-to-have) with quantified thresholds |
| 3.2 | `references/invest-criteria.md` | B3: INVEST criteria for story quality | ~140 | Independent, Negotiable, Valuable, Estimable, Small, Testable scoring rubric |
| 3.3 | `references/estimation-techniques.md` | B3: Fibonacci estimation | ~100 | Fibonacci sequence for effort estimation, velocity calculation |
| 3.4 | `references/dependency-types.md` | B3: dependency type taxonomy | ~130 | Hard, soft, resource, cross-team dependencies with detection signals |

### Task 3.5 — use-hivemind-planning: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Type** | edit-skill-md |
| **Changes** | +25 lines |

**SKILL.md changes:**
- Add `## Prioritization and Estimation` section pointing to new references
- Update Bundled Resources table with 4 new reference files
- Add prioritization note to Decomposition Steps (Step 4 references priority matrix)

---

### Task 3.6–3.9 — use-hivemind-tdd: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 3.6 | `references/test-design-techniques.md` | B5: ISTQB test design | ~180 | Equivalence partitioning, boundary value analysis, decision tables, state transition |
| 3.7 | `references/quality-model.md` | B5: ISO 25010 quality model | ~140 | 8 quality characteristics with HiveMind-specific targets |
| 3.8 | `references/quality-gates.md` | B5: quality gates with entry/exit criteria | ~150 | Per-phase quality gates: unit, integration, E2E, deployment |
| 3.9 | `references/risk-based-testing.md` | B5: risk-based testing prioritization | ~130 | Risk × Impact matrix, testing priority by risk level |

### Task 3.10 — use-hivemind-tdd: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Type** | edit-skill-md |
| **Changes** | +25 lines |

**SKILL.md changes:**
- Add `## Test Design Techniques` section referencing ISTQB techniques
- Add `## Quality Gates` section referencing entry/exit criteria
- Update Bundled Resources table with 4 new reference files

---

### Task 3.11–3.12 — hivemind-spec-driven: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 3.11 | `references/problem-solution-impact.md` | B4: Problem/Solution/Impact triad | ~120 | Structured feature proposal: problem statement, solution approach, expected impact |
| 3.12 | `references/acceptance-criteria-patterns.md` | B4: Given/When/Then criteria | ~140 | GWT patterns with examples for functional, non-functional, and integration tests |

### Task 3.13 — hivemind-spec-driven: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Type** | edit-skill-md |
| **Changes** | +20 lines |

**SKILL.md changes:**
- Update Acceptance Criteria Template section to reference GWT patterns
- Add `## Feature Proposal Format` section pointing to problem/solution/impact
- Update Bundled Resources table with 2 new reference files

---

### Task 3.14–3.18 — Pattern 3 Conditional Loading Fixes

These tasks add decision trees to SKILL.md files that are Pattern 3 but currently lack conditional loading triggers. Each adds ~15 lines in a new `## Conditional Loading` section.

| Task | Target Skill | Decision Tree Content |
|------|-------------|----------------------|
| 3.14 | hivemind-refactor | Smell type → load specific reference: Bloaters → code-smell-taxonomy.md, Coupling → refactor-techniques.md, Review → code-review-checklist.md |
| 3.15 | hivemind-system-debug | Failure type → load specific reference: Runtime error → debug-loop.md, Test failure → verification-before-completion.md, Build failure → load execution workflow |
| 3.16 | hivemind-patterns | Pattern type → load specific reference: Architecture → architecture-patterns.md, Design pattern → pattern-catalog.md, Anti-pattern → anti-pattern-catalog.md |
| 3.17 | use-hivemind-delegation | Delegation mode → load specific reference: Codescan → codescan-delegation.md, Debug → debug-delegation.md, Refactor → refactor-delegation.md, Research → research-thread-management.md |
| 3.18 | use-hivemind-research | Topic type → load specific reference: Technology eval → evidence-contract.md, Documentation → mcp-setup-guide.md, Multi-source → research-classification.md |

**Each task format:**
- Add `## Conditional Loading` section before Bundled Resources
- Decision tree in table format: `| Condition | Load Reference |`
- Update Table of Contents with link to new section
- No existing content removed

---

### Batch 3 Success Criteria (Gate)

- [ ] 4 new references in `use-hivemind-planning/references/`
- [ ] 4 new references in `use-hivemind-tdd/references/`
- [ ] 2 new references in `hivemind-spec-driven/references/`
- [ ] All 3 SKILL.md Bundled Resources updated
- [ ] 5 skills have Conditional Loading sections (refactor, system-debug, patterns, delegation, research)
- [ ] All conditional loading decision trees have ≥3 conditions
- [ ] All SKILL.md files <500 lines
- [ ] `wc -l` verification matches estimates ±20%
- [ ] User can manually copy Batch 3 to `.opencode/skills/` and restart

---

## Batch 4: Delegation/Research Expansion + Cross-Skill Consistency + Orphaned Reference Fixes

**Goal:** Complete expansion of delegation and research skills, fix all orphaned skill references, and perform final cross-skill consistency verification.
**Depends on:** Batches 1-3 complete (needs all new references and skills for consistency check).
**Target agent:** hivemaker (4.1-4.9), then hiveq (4.10)
**Estimated tasks:** 10

### Task 4.1–4.2 — use-hivemind-delegation: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 4.1 | `references/multi-reviewer-protocol.md` | A2: multi-reviewer dimension allocation | ~140 | How to dispatch review across multiple agents, dimension ownership rules |
| 4.2 | `references/hard-stop-conditions.md` | B2: hard stop conditions | ~120 | Conditions that require immediate delegation stop: scope violation, circular dependency, safety breach |

### Task 4.3 — use-hivemind-delegation: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Type** | edit-skill-md |
| **Changes** | +25 lines |

**SKILL.md changes:**
- Add `## Multi-Agent Review Protocol` section pointing to new reference
- Add `## Hard Stop Conditions` section listing immediate-stop triggers
- Update Bundled Resources table with 2 new reference files
- Cross-reference new section from Conditional Loading (added in 3.17)

---

### Task 4.4–4.5 — use-hivemind-research: Create Reference Files

| Task | File | Source Asset | Est. Lines | Key Content |
|------|------|-------------|-----------|-------------|
| 4.4 | `references/experiment-safety.md` | C5: git-backed experiment safety | ~130 | Git branch safety for experiments, rollback on failure, isolation rules |
| 4.5 | `references/results-format.md` | C5: results TSV format | ~80 | Structured results format for research output, TSV/JSON templates |

### Task 4.6 — use-hivemind-research: SKILL.md Edit

| Field | Value |
|-------|-------|
| **Type** | edit-skill-md |
| **Changes** | +20 lines |

**SKILL.md changes:**
- Add `## Experiment Safety Protocol` section pointing to new reference
- Update Bundled Resources table with 2 new reference files

---

### Task 4.7–4.9 — Orphaned Skill Reference Fixes

These 3 skills are not referenced by any sibling. Fix by adding bidirectional references.

| Task | Target Skill | Fix |
|------|-------------|-----|
| 4.7 | hivemind-system-debug | Add to Sibling Skills in: use-hivemind (entry router), use-hivemind-delegation (debug delegation mode). Add hivemind-system-debug to `use-hivemind` references as "debug router". |
| 4.8 | hivemind-patterns | Add to Sibling Skills in: hivemind-refactor (pattern selection), use-hivemind-planning (pattern-aware decomposition). Ensure hivemind-architecture references hivemind-patterns as sibling. |
| 4.9 | use-hivemind-skill-authoring | Add to Sibling Skills in: use-hivemind (skill authoring route). Add cross-reference from use-hivemind-skill-authoring to hivemind-patterns (pattern compliance). |

**Each task format:**
- Edit the REFERENCING skill's SKILL.md to add the orphaned skill to its Sibling Skills table
- Edit the orphaned skill's SKILL.md to add a bidirectional reference back
- ~10 lines added per file (sibling table entry + cross-reference note)

---

### Task 4.10 — Cross-Skill Consistency Verification

| Field | Value |
|-------|-------|
| **Task ID** | cross-skill-check |
| **Target** | ALL 17 skills in `.developing-skills/refactored-skills/` |
| **Type** | fix-cross-reference (verification-only) |
| **Target agent** | hiveq or hivexplorer (read-only verification) |

**Verification checklist:**

| # | Check | Pass Condition |
|---|-------|----------------|
| V1 | All 17 skills have valid YAML frontmatter | name + description + parent present |
| V2 | All 17 skills have Table of Contents | `## Table of Contents` present |
| V3 | All Bundled Resources tables are complete | Every file in `references/`, `templates/`, `scripts/`, `tests/` listed |
| V4 | All cross-references point to existing skills | No references to non-existent sibling skills |
| V5 | No duplicate sections | Each section header appears once |
| V6 | All Pattern 3 skills have Conditional Loading section | refactor, system-debug, patterns, delegation, research |
| V7 | All new reference files are listed in their skill's Bundled Resources | Every new .md file has a table entry |
| V8 | All SKILL.md files <500 lines | `wc -l` check |
| V9 | No orphaned skills | Every skill is referenced by ≥1 sibling |
| V10 | Terminology consistent across skills | God Function = >50 lines, God Component = >300 lines, Tight Coupling = canonical term |

**Success criteria:**
- [ ] All 10 verification checks pass
- [ ] Evidence: `wc -l` output for all 17 SKILL.md files
- [ ] Evidence: `grep` output confirming all cross-references resolve
- [ ] Evidence: Bundled Resources completeness check (file count matches table entries)
- [ ] Issues found are listed with severity and recommended fix

---

### Batch 4 Success Criteria (Gate)

- [ ] 2 new references in `use-hivemind-delegation/references/`
- [ ] 2 new references in `use-hivemind-research/references/`
- [ ] Both SKILL.md Bundled Resources updated
- [ ] 3 orphaned skills now referenced by ≥1 sibling
- [ ] Cross-skill consistency verification passes all 10 checks
- [ ] 0 critical issues, 0 high issues
- [ ] All SKILL.md files <500 lines
- [ ] User can manually copy Batch 4 to `.opencode/skills/` and restart
- [ ] Full ecosystem (17 skills) is self-consistent

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| SKILL.md exceeds 500 lines after expansion | MEDIUM | HIGH | Compress existing content into references before adding new sections. Priority: move verbose examples to references/ |
| Cross-reference to hivemind-architecture fails (skill not yet transferred) | LOW | MEDIUM | User transfers after each batch — dependency enforced by batch ordering |
| External content doesn't adapt cleanly to HiveMind conventions | MEDIUM | MEDIUM | Adapt, don't copy. Replace framework-specific examples with OpenCode/HiveMind patterns |
| Conditional loading decision trees too complex | LOW | LOW | Max 5 conditions per decision tree. If more needed, split into sub-trees |
| Reference file content overlaps with existing content | MEDIUM | LOW | Check existing references before creating new ones. Merge if overlap >50% |
| Overloaded skills (delegation 405 lines) can't absorb more | HIGH | MEDIUM | Only add reference pointers, not inline content. New content goes to references/ only |
| User forgets to restart after copy | LOW | MEDIUM | Document restart requirement in batch success criteria |

---

## Architect Decisions Needed

| Decision | Context | Urgency | Owner |
|----------|---------|---------|-------|
| hivemind-architecture: Include Clean Architecture as first-class section or reference-only? | C3 has 42 rules — inline would push >500 lines | Before Batch 1 Task 1.1 | architect |
| hivemind-execution: Scope to implementation agents only or include review/verification? | B2 has review-oriented content that overlaps gatekeeping | Before Batch 2 Task 2.1 | architect |
| use-hivemind-delegation: Split 405-line file or expand-then-split? | Already overloaded; new references may push it further | Before Batch 4 Task 4.3 | orchestrator |
| Conditional loading: Standardize decision tree format across all Pattern 3 skills? | Currently inconsistent format | Before Batch 3 Tasks 3.14-3.18 | architect |

---

## Delegation Packets

### Batch 1 Packet

```json
{
  "slice_id": "batch-1-architecture-foundation",
  "mode": "execution",
  "scope": "Create hivemind-architecture skill (SKILL.md + 6 refs + 2 templates) and expand hivemind-patterns (1 new ref + SKILL.md edit)",
  "authority_surfaces": [".developing-skills/refactored-skills/hivemind-architecture/", ".developing-skills/refactored-skills/hivemind-patterns/"],
  "in_scope": [
    "hivemind-architecture/SKILL.md",
    "hivemind-architecture/references/*.md",
    "hivemind-architecture/templates/*.md",
    "hivemind-patterns/references/architecture-patterns.md",
    "hivemind-patterns/SKILL.md (additive edits only)"
  ],
  "out_of_scope": [".opencode/skills/*", "src/*", "all other skills"],
  "constraints": [
    "All output in .developing-skills/refactored-skills/",
    "SKILL.md <500 lines",
    "Adapt external content to HiveMind conventions",
    "No how-to-implement — process guidance only",
    "Pattern 3 for hivemind-architecture, additive edits for hivemind-patterns"
  ],
  "success_metrics": "Batch 1 gate criteria all pass",
  "gate": "wc -l for all created files + grep for cross-references + Bundled Resources completeness",
  "return_format": "JSON with file paths, line counts, cross-reference verification"
}
```

### Batch 2 Packet

```json
{
  "slice_id": "batch-2-execution-refactor",
  "mode": "execution",
  "scope": "Create hivemind-execution skill (SKILL.md + 4 refs + 2 templates) and expand hivemind-refactor (4 new refs + SKILL.md edit)",
  "authority_surfaces": [".developing-skills/refactored-skills/hivemind-execution/", ".developing-skills/refactored-skills/hivemind-refactor/"],
  "in_scope": [
    "hivemind-execution/SKILL.md",
    "hivemind-execution/references/*.md",
    "hivemind-execution/templates/*.md",
    "hivemind-refactor/references/*.md (new files only)",
    "hivemind-refactor/SKILL.md (additive edits only)"
  ],
  "out_of_scope": [".opencode/skills/*", "src/*", "all other skills", "hivemind-architecture/*"],
  "constraints": [
    "All output in .developing-skills/refactored-skills/",
    "SKILL.md <500 lines",
    "hivemind-execution must cross-reference hivemind-architecture",
    "Adapt external content to HiveMind conventions"
  ],
  "success_metrics": "Batch 2 gate criteria all pass",
  "gate": "wc -l + cross-reference to hivemind-architecture + Bundled Resources completeness"
}
```

### Batch 3 Packet

```json
{
  "slice_id": "batch-3-domain-expansion",
  "mode": "execution",
  "scope": "Expand planning (4 refs + edit), TDD (4 refs + edit), spec-driven (2 refs + edit), and add Conditional Loading to 5 Pattern 3 skills",
  "authority_surfaces": [
    ".developing-skills/refactored-skills/use-hivemind-planning/",
    ".developing-skills/refactored-skills/use-hivemind-tdd/",
    ".developing-skills/refactored-skills/hivemind-spec-driven/",
    ".developing-skills/refactored-skills/hivemind-refactor/",
    ".developing-skills/refactored-skills/hivemind-system-debug/",
    ".developing-skills/refactored-skills/hivemind-patterns/",
    ".developing-skills/refactored-skills/use-hivemind-delegation/",
    ".developing-skills/refactored-skills/use-hivemind-research/"
  ],
  "in_scope": [
    "use-hivemind-planning/references/*.md (new only)",
    "use-hivemind-planning/SKILL.md (additive)",
    "use-hivemind-tdd/references/*.md (new only)",
    "use-hivemind-tdd/SKILL.md (additive)",
    "hivemind-spec-driven/references/*.md (new only)",
    "hivemind-spec-driven/SKILL.md (additive)",
    "5 Pattern 3 SKILL.md files (add Conditional Loading section)"
  ],
  "out_of_scope": [".opencode/skills/*", "src/*", "hivemind-architecture/*", "hivemind-execution/*"],
  "constraints": [
    "All output in .developing-skills/refactored-skills/",
    "SKILL.md <500 lines after edits",
    "Conditional Loading section format: table with Condition → Reference mapping",
    "Max 5 conditions per decision tree"
  ],
  "success_metrics": "Batch 3 gate criteria all pass",
  "gate": "wc -l + Conditional Loading section grep + Bundled Resources completeness"
}
```

### Batch 4 Packet

```json
{
  "slice_id": "batch-4-consistency-fixes",
  "mode": "execution",
  "scope": "Expand delegation (2 refs + edit), research (2 refs + edit), fix 3 orphaned skill references, run cross-skill consistency verification",
  "authority_surfaces": [
    ".developing-skills/refactored-skills/use-hivemind-delegation/",
    ".developing-skills/refactored-skills/use-hivemind-research/",
    ".developing-skills/refactored-skills/hivemind-system-debug/",
    ".developing-skills/refactored-skills/hivemind-patterns/",
    ".developing-skills/refactored-skills/use-hivemind-skill-authoring/",
    ".developing-skills/refactored-skills/use-hivemind/"
  ],
  "in_scope": [
    "use-hivemind-delegation/references/*.md (new only)",
    "use-hivemind-delegation/SKILL.md (additive)",
    "use-hivemind-research/references/*.md (new only)",
    "use-hivemind-research/SKILL.md (additive)",
    "3 orphaned skill SKILL.md files (add sibling references)",
    "use-hivemind/SKILL.md (add debug/authoring routes)",
    "ALL 17 skills (verification pass — read only)"
  ],
  "out_of_scope": [".opencode/skills/*", "src/*"],
  "constraints": [
    "All output in .developing-skills/refactored-skills/",
    "Verification pass is read-only — no edits",
    "Orphan fixes are bidirectional (both skills get edited)"
  ],
  "success_metrics": "Batch 4 gate criteria all pass + verification checklist all green",
  "gate": "Full 10-point verification checklist on all 17 skills"
}
```

---

## Execution Constraints

1. **Batches are sequential.** Each batch must pass its gate before the next begins.
2. **Within a batch, reference files can be created in parallel** (no interdependencies).
3. **SKILL.md edits depend on reference files** being created first (Bundled Resources must list existing files).
4. **All output in `.developing-skills/refactored-skills/`.** Never touch `.opencode/skills/`.
5. **User transfers manually** after each batch and restarts.
6. **Adapt, don't copy.** External content must be adapted to HiveMind conventions (CQRS, tool.schema, etc.).
7. **SKILL.md <500 lines** — hard limit. If approaching limit, compress inline content to references.
8. **No how-to-implement.** All content is process guidance, not implementation instructions.
9. **Evidence required.** Every delegation return must include file paths, line counts, cross-reference verification.

---

## Session Continuity

If this session disconnects, resume from:
- **This plan:** `.hivemind/activity/plans/integration-plan-2026-03-28.md`
- **Orchestration plan:** `.hivemind/activity/plans/orchestration-master-plan-2026-03-28-v2.md`
- **Improvement plan:** `.hivemind/activity/plans/skill-improvement-master-plan-2026-03-28.md`
- **Continuity:** `.hivemind/activity/sessions/continuity.json`

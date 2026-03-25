# Session Inspection Export

- ses_id: `ses_2de2988c2ffer8ZagbNaBIH3W8`
- prepared_at: `2026-03-24T21:55:38.199Z`

## Assistant Output

Here is the complete audit report. I'll organize it by the 15 SKILL.md files first, then supporting/reference files.

---

## Complete Orphan Reference Audit

### 1. `use-hivemind/SKILL.md` (7 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 1 | `use-hivemind/SKILL.md` | 39 | `use-hivemind-skill-writer` | Domain routing table: "Skill creation/audit → `use-hivemind-skill-writer`" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 2 | `use-hivemind/SKILL.md` | 41 | `use-hivemind-detox-refactor` | Domain routing table: "Multi-stage refactor → `use-hivemind-detox-refactor`" | **NO** | MISSING — needs research | Flag: was the framework refactor/router skill; no current replacement |
| 3 | `use-hivemind/SKILL.md` | 43 | `plan-engineering` | Domain routing table: "Planning work → `plan-engineering`" | YES | `use-hivemind-planning` | Replace old name |
| 4 | `use-hivemind/SKILL.md` | 55 | `plan-engineering` | Depth model: "Domain router... `use-hivemind-delegation`, `plan-engineering`, etc." | YES | `use-hivemind-planning` | Replace old name |
| 5 | `use-hivemind/SKILL.md` | 56 | `tdd-delegation` | Depth model: "Implementation skill... `tdd-delegation`, `hivemind-atomic-commit`" | YES | `use-hivemind-tdd` | Replace old name |
| 6 | `use-hivemind/SKILL.md` | 71 | `plan-engineering` | Role table: "Domain routers (`use-hivemind-delegation`, `plan-engineering`, etc.)" | YES | `use-hivemind-planning` | Replace old name |
| 7 | `use-hivemind/SKILL.md` | 72 | `tdd-delegation` | Role table: "Implementation skills (`tdd-delegation`, `hivemind-atomic-commit`, etc.)" | YES | `use-hivemind-tdd` | Replace old name |

### 2. `use-hivemind/templates/load-template.md` (3 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 8 | `use-hivemind/templates/load-template.md` | 38 | `hivemind-gatekeeping-delegation` | Slot template: "Slot 3: hivemind-gatekeeping-delegation" | YES | `hivemind-gatekeeping` | Replace old name |
| 9 | `use-hivemind/templates/load-template.md` | 98 | `hivemind-research-framework` | Slot template: "Slot 3: hivemind-research-framework" | YES | `use-hivemind-research` (bundled) | Replace old name |
| 10 | `use-hivemind/templates/load-template.md` | 125 | `hivemind-research-framework` | Research routing table: "Research → use-hivemind-delegation → hivemind-research-framework" | YES | `use-hivemind-research` (bundled) | Replace old name |

### 3. `use-hivemind-delegation/SKILL.md` (8 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 11 | `use-hivemind-delegation/SKILL.md` | 41 | `use-hivemind-detox-refactor` | Sibling skills table: "Router that triggers this skill" | **NO** | MISSING — needs research | Flag: was the orchestrator that triggered delegation |
| 12 | `use-hivemind-delegation/SKILL.md` | 44 | `spec-distillation` | Sibling skills table: "Planning mode — distillation outputs feed into planning delegation" | YES | `use-hivemind-planning` + `hivemind-spec-driven` | Replace with both |
| 13 | `use-hivemind-delegation/SKILL.md` | 46 | `git-continuity-memory` | Sibling skills table: "Git-aware continuity — commit SHAs and branch state" | YES | `use-hivemind-git-memory` (bundled) | Replace old name |
| 14 | `use-hivemind-delegation/SKILL.md` | 47 | `hivemind-gatekeeping-delegation` | Sibling skills table: "Iterative loops, synthesis gates, cascading failure" | YES | `hivemind-gatekeeping` | Replace old name |
| 15 | `use-hivemind-delegation/SKILL.md` | 178 | `hivemind-gatekeeping-delegation` | Cascading failure section: "see `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |
| 16 | `use-hivemind-delegation/SKILL.md` | 196 | `hivemind-gatekeeping-delegation` | Iterative loop section: "see `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |
| 17 | `use-hivemind-delegation/SKILL.md` | 261 | `hivemind-gatekeeping-delegation` | Composition table: "Iterative loops, synthesis gates, cascading failure" | YES | `hivemind-gatekeeping` | Replace old name |
| 18 | `use-hivemind-delegation/SKILL.md` | 270 | `use-hivemind-detox-refactor` | Closing: "may be selected directly or from `use-hivemind-detox-refactor`" | **NO** | MISSING — needs research | Flag: was the orchestrator |

### 4. `use-hivemind-delegation/_artifacts/` (8 orphan refs — artifacts)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 19 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 5 | `skill-creator` | Source skills list (historical) | N/A | Artifact only | No action (historical) |
| 20 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 5 | `skill-judge` | Source skills list (historical) | N/A | Artifact only | No action (historical) |
| 21 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 5 | `skill-review` | Source skills list (historical) | N/A | Artifact only | No action (historical) |
| 22 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 5 | `brainstorming` | Source skills list (historical) | N/A | Artifact only | No action (historical) |
| 23 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 282 | `skill-review` | "Nine-Phase Audit Adaptation (from skill-review)" | N/A | Artifact only | No action (historical) |
| 24 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 320 | `brainstorming` | "Apply the brainstorming principle of incremental validation" | N/A | Artifact only | No action (historical) |
| 25 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 334 | `skill-judge` | "Anti-Patterns to Avoid (from skill-judge AND Delegation-Specific)" | N/A | Artifact only | No action (historical) |
| 26 | `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 406 | `brainstorming` | "One-at-a-Time Validation (from brainstorming)" | N/A | Artifact only | No action (historical) |
| 27 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 4 | `skill-review` | "Auditor: OpenCode skill-review" | N/A | Artifact only | No action (historical) |
| 28 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 79 | `use-hivemind-detox-refactor` | Audit finding: "no reference to use-hivemind-detox-refactor" | **NO** | MISSING | Artifact — no action (historical) |
| 29 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `use-hivemind-detox-refactor` | Change summary: "Added table showing relationships to..." | **NO** | MISSING | Artifact — no action (historical) |
| 30 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `spec-distillation` | Change summary | YES | `hivemind-spec-driven` | Artifact — no action (historical) |
| 31 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `git-continuity-memory` | Change summary | YES | `use-hivemind-git-memory` | Artifact — no action (historical) |

### 5. `use-hivemind-delegation/references/` (4 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 32 | `use-hivemind-delegation/references/debug-delegation.md` | 61 | `hivemind-gatekeeping-delegation` | "Loop gating: `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |
| 33 | `use-hivemind-delegation/references/failure-recovery.md` | 76 | `hivemind-gatekeeping-delegation` | "see `hivemind-gatekeeping-delegation/references/cascading-failure.md`" | YES | `hivemind-gatekeeping` | Replace old name |
| 34 | `use-hivemind-delegation/references/refactor-delegation.md` | 59 | `use-hivemind-detox-refactor` | "Refactor methodology: `use-hivemind-detox-refactor`" | **NO** | MISSING — needs research | Flag: refactor methodology reference |
| 35 | `use-hivemind-delegation/references/refactor-delegation.md` | 61 | `hivemind-gatekeeping-delegation` | "Loop gating: `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |
| 36 | `use-hivemind-delegation/references/architecture-audit-delegation.md` | 49 | `hivemind-gatekeeping-delegation` | "Loop gating: `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |

### 6. `use-hivemind-tdd/SKILL.md` (2 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 37 | `use-hivemind-tdd/SKILL.md` | 309 | `tdd-delegation` | Asset table: "`templates/tdd-delegation-packet.md`" | YES | `use-hivemind-tdd` | Rename template file & reference |
| 38 | `use-hivemind-tdd/SKILL.md` | 317 | `hivemind-gatekeeping-delegation` | Depth companions: "`hivemind-atomic-commit`, `hivemind-gatekeeping-delegation`" | YES | `hivemind-gatekeeping` | Replace old name |

### 7. `use-hivemind-planning/SKILL.md` (2 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 39 | `use-hivemind-planning/SKILL.md` | 11 | `plan-engineering` | Consolidates section: "Consolidates: `plan-engineering`, `plan-breakdown`, `spec-distillation`" | YES | `use-hivemind-planning` (self) | Replace or clarify as historical note |
| 40 | `use-hivemind-planning/SKILL.md` | 236 | `plan-engineering` | Closing: "This skill consolidates: `plan-engineering` (lifecycle + retraceability), `plan-breakdown` (decomposition methodology), `spec-distillation` (requirement extraction)" | YES | `use-hivemind-planning` (self) | Replace with historical note |

### 8. `use-hivemind-planning/templates/decomposition-plan.json` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 41 | `use-hivemind-planning/templates/decomposition-plan.json` | 6 | `plan-breakdown` | JSON field: `"decomposition_method": "plan-breakdown v1.0"` | YES | `use-hivemind-planning` | Update to `use-hivemind-planning v2.0` |

### 9. `use-hivemind-planning/tests/direct-invocation.md` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 42 | `use-hivemind-planning/tests/direct-invocation.md` | 5 | `spec-distillation` | "Validate that `spec-distillation` can be selected and used directly" | YES | `hivemind-spec-driven` | Update test reference |

### 10. `use-hivemind-planning/references/decomposition-steps.md` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 43 | `use-hivemind-planning/references/decomposition-steps.md` | 90 | `spec-distillation` | "Return to `spec-distillation`" on Step 1 failure | YES | `hivemind-spec-driven` | Replace old name |

### 11. `use-hivemind-git-memory/SKILL.md` (17 orphan refs — highest density)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 44 | `use-hivemind-git-memory/SKILL.md` | 3 | `git-continuity-memory` | Description: "Routes to git-continuity-memory for session recovery" | YES | `use-hivemind-git-memory` (self — bundled) | Replace old name |
| 45 | `use-hivemind-git-memory/SKILL.md` | 3 | `git-memory-enforce` | Description: "git-memory-enforce for memory-first enforcement" | YES | `use-hivemind-git-memory` (self — bundled) | Replace old name |
| 46 | `use-hivemind-git-memory/SKILL.md` | 3 | `hierarchy-retrace` | Description: "hierarchy-retrace for decision indexing" | YES | `use-hivemind-git-memory` (self — bundled) | Replace old name |
| 47 | `use-hivemind-git-memory/SKILL.md` | 21 | `git-continuity-memory` | Routing table: resume | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 48 | `use-hivemind-git-memory/SKILL.md` | 22 | `git-continuity-memory` | Routing table: trace | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 49 | `use-hivemind-git-memory/SKILL.md` | 23 | `git-continuity-memory` | Routing table: retrieve | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 50 | `use-hivemind-git-memory/SKILL.md` | 24 | `git-continuity-memory` | Routing table: anchor | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 51 | `use-hivemind-git-memory/SKILL.md` | 26 | `git-memory-enforce` | Routing table: enforce commits | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 52 | `use-hivemind-git-memory/SKILL.md` | 27 | `hierarchy-retrace` | Routing table: index hierarchy | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 53 | `use-hivemind-git-memory/SKILL.md` | 39 | `git-continuity-memory` | Subagent table: Continuity | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 54 | `use-hivemind-git-memory/SKILL.md` | 41 | `git-memory-enforce` | Subagent table: Enforcement | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 55 | `use-hivemind-git-memory/SKILL.md` | 42 | `hierarchy-retrace` | Subagent table: Indexing | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 56 | `use-hivemind-git-memory/SKILL.md` | 48 | `git-continuity-memory` | Anti-patterns: "Loading `git-continuity-memory` directly" | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 57 | `use-hivemind-git-memory/SKILL.md` | 50 | `git-continuity-memory` | Anti-patterns: "Use `git-continuity-memory` (resume) for recovery" | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 58 | `use-hivemind-git-memory/SKILL.md` | 51 | `hierarchy-retrace` | Anti-patterns: "Route to `hierarchy-retrace` to build/query index" | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 59 | `use-hivemind-git-memory/SKILL.md` | 63 | `git-continuity-memory` | Flow diagram arrow | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 60 | `use-hivemind-git-memory/SKILL.md` | 63 | `git-memory-enforce` | Flow diagram arrow | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 61 | `use-hivemind-git-memory/SKILL.md` | 63 | `hierarchy-retrace` | Flow diagram arrow | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 62 | `use-hivemind-git-memory/SKILL.md` | 73 | `git-continuity-memory` | Flow diagram: dispatch | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 63 | `use-hivemind-git-memory/SKILL.md` | 77 | `git-memory-enforce` | Flow diagram: dispatch | YES | `use-hivemind-git-memory` (self) | Replace old name |
| 64 | `use-hivemind-git-memory/SKILL.md` | 79 | `hierarchy-retrace` | Flow diagram: dispatch | YES | `use-hivemind-git-memory` (self) | Replace old name |

### 12. `use-hivemind-git-memory/references/` (3 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 65 | `use-hivemind-git-memory/references/session-continuity.md` | 137 | `git-continuity-memory` | "When using `git-continuity-memory` to resume" | YES | `use-hivemind-git-memory` | Replace old name |
| 66 | `use-hivemind-git-memory/references/commit-memory-schema.md` | 36 | `git-memory-enforce` | JSON schema branch name: `"feature/git-memory-enforce"` | YES | `use-hivemind-git-memory` | Update branch reference |
| 67 | `use-hivemind-git-memory/references/index-registration.md` | 25 | `git-memory-enforce` | JSON schema branch name: `"feature/git-memory-enforce"` | YES | `use-hivemind-git-memory` | Update branch reference |

### 13. `use-hivemind-git-memory/tests/` (2 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 68 | `use-hivemind-git-memory/tests/direct-invocation.md` | 8 | `git-continuity-memory` | Test case: "`git-continuity-memory` classifies the task as `resume`" | YES | `use-hivemind-git-memory` | Update test reference |
| 69 | `use-hivemind-git-memory/tests/git-memory-enforce-direct-invocation.md` | 108 | `git-memory-enforce` | Test case: "Agent uses git-memory-enforce to resume context" | YES | `use-hivemind-git-memory` | Update test reference |

### 14. `use-hivemind-skill-authoring/SKILL.md` (10 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 70 | `use-hivemind-skill-authoring/SKILL.md` | 7 | `use-hivemind-skill-writer` | Consolidated skills list | YES | `use-hivemind-skill-authoring` (self) | Clarify as historical note |
| 71 | `use-hivemind-skill-authoring/SKILL.md` | 8 | `hivemind-skill-doctor` | Consolidated skills list | YES | `use-hivemind-skill-authoring` (self) | Clarify as historical note |
| 72 | `use-hivemind-skill-authoring/SKILL.md` | 9 | `hivemind-skill-write` | Consolidated skills list | YES | `use-hivemind-skill-authoring` (self) | Clarify as historical note |
| 73 | `use-hivemind-skill-authoring/SKILL.md` | 10 | `skill-universal-design` | Consolidated skills list | YES | `use-hivemind-skill-authoring` (self) | Clarify as historical note |
| 74 | `use-hivemind-skill-authoring/SKILL.md` | 11 | `skill-conflict-detect` | Consolidated skills list | YES | `use-hivemind-skill-authoring` (self) | Clarify as historical note |
| 75 | `use-hivemind-skill-authoring/SKILL.md` | 217 | `use-hivemind-skill-writer` | Superseded mapping: "→ superseded by Creation Template section" | YES | `use-hivemind-skill-authoring` (self) | Already labeled superseded |
| 76 | `use-hivemind-skill-authoring/SKILL.md` | 218 | `hivemind-skill-doctor` | Superseded mapping: "→ superseded by Review Checklist section" | YES | `use-hivemind-skill-authoring` (self) | Already labeled superseded |
| 77 | `use-hivemind-skill-authoring/SKILL.md` | 219 | `hivemind-skill-write` | Superseded mapping: "→ superseded by Skill Anatomy section" | YES | `use-hivemind-skill-authoring` (self) | Already labeled superseded |
| 78 | `use-hivemind-skill-authoring/SKILL.md` | 220 | `skill-universal-design` | Superseded mapping: "→ superseded by Universal Design section" | YES | `use-hivemind-skill-authoring` (self) | Already labeled superseded |
| 79 | `use-hivemind-skill-authoring/SKILL.md` | 221 | `skill-conflict-detect` | Superseded mapping: "→ superseded by Conflict Detection section" | YES | `use-hivemind-skill-authoring` (self) | Already labeled superseded |

### 15. `use-hivemind-skill-authoring/references/` (9 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 80 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 41 | `hivemind-skill-writer` | Example frontmatter: `name: hivemind-skill-writer` | YES | `use-hivemind-skill-authoring` | Update example |
| 81 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 162 | `hivemind-skill-writer` | Example frontmatter: `name: hivemind-skill-writer` | YES | `use-hivemind-skill-authoring` | Update example |
| 82 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 55 | `hivemind-skill-writer` | Pattern table row | YES | `use-hivemind-skill-authoring` | Replace old name |
| 83 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 225 | `hivemind-skill-writer` | "Meta skills (like hivemind-skill-writer)" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 84 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 274 | `hivemind-skill-writer` | Routing table | YES | `use-hivemind-skill-authoring` | Replace old name |
| 85 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 275 | `skill-audit-hivemind` | Routing table (new unlisted orphan) | YES | `use-hivemind-skill-authoring` | Replace old name |
| 86 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 276 | `skill-migration-hivemind` | Routing table (new unlisted orphan) | YES | `use-hivemind-skill-authoring` | Replace old name |
| 87 | `use-hivemind-skill-authoring/references/04-tdd-workflow.md` | 73 | `hivemind-skill-writer` | "Without hivemind-skill-writer loaded" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 88 | `use-hivemind-skill-authoring/references/04-tdd-workflow.md` | 76 | `hivemind-skill-writer` | "With hivemind-skill-writer loaded" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 89 | `use-hivemind-skill-authoring/references/sw-04-tdd-workflow.md` | 73 | `hivemind-skill-writer` | "Without hivemind-skill-writer loaded" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 90 | `use-hivemind-skill-authoring/references/sw-04-tdd-workflow.md` | 76 | `hivemind-skill-writer` | "With hivemind-skill-writer loaded" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 91 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 5 | `brainstorming` | "ensures brainstorming sessions load appropriate skills" | YES | N/A (concept, not skill) | Acceptable — generic term used as concept |
| 92 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 84 | `brainstorming` | "When user enters brainstorming mode" | YES | N/A (concept, not skill) | Acceptable — generic term |
| 93 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 108 | `hivemind-skill-writer` | "hivemind-skill-writer (companion)" | YES | `use-hivemind-skill-authoring` | Replace old name |
| 94 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 124 | `brainstorming` | "skilled user brainstorming" | YES | N/A (concept) | Acceptable — generic term |
| 95 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 207 | `brainstorming` | "Multiple brainstorming skills" | YES | N/A (concept) | Acceptable — generic term |

### 16. `hivemind-system-debug/SKILL.md` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 96 | `hivemind-system-debug/SKILL.md` | 8 | `use-hivemind-detox-refactor` | Description: "deep system-debug branch family for `use-hivemind-detox-refactor`" | **NO** | MISSING — needs research | Flag: parent router was deleted |

### 17. `hivemind-codemap/SKILL.md` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 97 | `hivemind-codemap/SKILL.md` | 8 | `use-hivemind-detox-refactor` | Description: "deep codemap branch family for `use-hivemind-detox-refactor`" | **NO** | MISSING — needs research | Flag: parent router was deleted |

### 18. `hivemind-refactor/SKILL.md` (3 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 98 | `hivemind-refactor/SKILL.md` | 265 | `tdd-delegation` | Composition table: "If refactor adds behavior, transition to TDD" | YES | `use-hivemind-tdd` | Replace old name |
| 99 | `hivemind-refactor/SKILL.md` | 266 | `course-correction-delegation` | Composition table: "If refactor breaks things, debug delegation takes over" | YES | `use-hivemind-delegation` (bundled) | Replace old name |
| 100 | `hivemind-refactor/SKILL.md` | 275 | `hivemind-gatekeeping-delegation` | "composes with `hivemind-gatekeeping-delegation` for multi-iteration refactor loops" | YES | `hivemind-gatekeeping` | Replace old name |

### 19. `hivemind-spec-driven/SKILL.md` (5 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 101 | `hivemind-spec-driven/SKILL.md` | 4 | `spec-distillation` | Description: "Consolidates spec-distillation into a full SDE methodology" | YES | `hivemind-spec-driven` (self) | Clarify as historical note |
| 102 | `hivemind-spec-driven/SKILL.md` | 30 | `spec-distillation` | Consolidates: "Consolidates: `spec-distillation` (expanded to full SDE lifecycle)" | YES | `hivemind-spec-driven` (self) | Clarify as historical note |
| 103 | `hivemind-spec-driven/SKILL.md` | 43 | `course-correction-delegation` | "Debug loops or course correction — use `course-correction-delegation`" | YES | `use-hivemind-delegation` (bundled) | Replace old name |
| 104 | `hivemind-spec-driven/SKILL.md` | 175 | `test-gatekeeping-flow` | Downstream table: "acceptance criteria become test gates" | YES | `use-hivemind-tdd` (bundled) | Replace old name |
| 105 | `hivemind-spec-driven/SKILL.md` | 176 | `tdd-delegation` | Downstream table: "traceable requirements drive TDD red phase" | YES | `use-hivemind-tdd` | Replace old name |

### 20. `hivemind-atomic-commit/SKILL.md` (1 orphan ref)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 106 | `hivemind-atomic-commit/SKILL.md` | 39 | `git-continuity-memory` | Companions table: "Records commit anchors and session continuity" | YES | `use-hivemind-git-memory` (bundled) | Replace old name |

### 21. `use-hivemind-research/SKILL.md` (6 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 107 | `use-hivemind-research/SKILL.md` | 3 | `hivemind-research-framework` | Description: "Routes to hivemind-research-framework (methodology) and hivemind-research-tools (MCP tool protocols)" | YES | `use-hivemind-research` (self) | Replace old names |
| 108 | `use-hivemind-research/SKILL.md` | 3 | `hivemind-research-tools` | Description: same as above | YES | `use-hivemind-research` (self) | Replace old names |
| 109 | `use-hivemind-research/SKILL.md` | 23 | `hivemind-research-framework` | Flow diagram node | YES | `use-hivemind-research` (self) | Replace old name |
| 110 | `use-hivemind-research/SKILL.md` | 25 | `hivemind-research-tools` | Flow diagram node | YES | `use-hivemind-research` (self) | Replace old name |
| 111 | `use-hivemind-research/SKILL.md` | 94 | `hivemind-research-framework` | File path: `../hivemind-research-framework/SKILL.md` | YES | `use-hivemind-research` (self) | Remove dead path |
| 112 | `use-hivemind-research/SKILL.md` | 95 | `hivemind-research-tools` | File path: `../hivemind-research-tools/SKILL.md` | YES | `use-hivemind-research` (self) | Remove dead path |

### 22. `use-hivemind-research/references/` (4 orphan refs)

| # | Skill File | Line | Old Reference | Context | Has Equivalent? | Equivalent Skill | Action Needed |
|---|-----------|------|--------------|---------|-----------------|-----------------|---------------|
| 113 | `use-hivemind-research/references/evidence-contract.md` | 3 | `hivemind-research-framework` | "grading standards for all research conducted under hivemind-research-framework" | YES | `use-hivemind-research` | Replace old name |
| 114 | `use-hivemind-research/references/evidence-contract.md` | 141 | `hivemind-research-framework` | File path reference | YES | `use-hivemind-research` | Remove dead path |
| 115 | `use-hivemind-research/references/evidence-contract.md` | 142 | `hivemind-research-tools` | File path reference | YES | `use-hivemind-research` | Remove dead path |
| 116 | `use-hivemind-research/references/tool-protocols.md` | 208 | `hivemind-research-tools` | "See `hivemind-research-tools/SKILL.md` for full chaining protocol details" | YES | `use-hivemind-research` | Remove dead path |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total orphan references found** | **116** |
| **Unique old skill names referenced** | **22** (21 from list + 2 new: `skill-audit-hivemind`, `skill-migration-hivemind`) |
| **References with equivalent** | **110** (94.8%) |
| **MISSING — no equivalent (`use-hivemind-detox-refactor`)** | **6** (5.2%) |
| **Acceptable `brainstorming` as generic concept** | **5** |
| **Artifact-only (historical, no action)** | **13** |

## Critical Finding: `use-hivemind-detox-refactor` — MISSING

This skill was the **framework-level orchestrator/router** that triggered multi-stage refactors, recovery, and detox across context and code. It appears in 6 live files (not just artifacts):

| File | Line | Role |
|------|------|------|
| `use-hivemind/SKILL.md` | 41 | Domain routing table entry |
| `use-hivemind-delegation/SKILL.md` | 41 | "Router that triggers this skill" |
| `use-hivemind-delegation/SKILL.md` | 270 | "may be selected directly or from `use-hivemind-detox-refactor`" |
| `use-hivemind-delegation/references/refactor-delegation.md` | 59 | "Refactor methodology: `use-hivemind-detox-refactor`" |
| `hivemind-system-debug/SKILL.md` | 8 | "deep system-debug branch family for `use-hivemind-detox-refactor`" |
| `hivemind-codemap/SKILL.md` | 8 | "deep codemap branch family for `use-hivemind-detox-refactor`" |

**What it provided:** A P1 router that classified refactor/recovery/detox requests and dispatched to sub-skills (`hivemind-system-debug`, `hivemind-codemap`, `hivemind-refactor`, `use-hivemind-delegation`). It was the parent orchestrator for these branch families. Deleting it leaves `hivemind-system-debug` and `hivemind-codemap` as orphaned branch-family skills with no parent router.

**Action needed:** Research whether a replacement router exists, or whether `use-hivemind` itself now handles this dispatch.

## Bonus: Previously Unlisted Orphans Found

| Old Reference | Found In | Equivalent |
|--------------|----------|------------|
| `skill-audit-hivemind` | `use-hivemind-skill-authoring/references/03-three-patterns.md:275` | `use-hivemind-skill-authoring` |
| `skill-migration-hivemind` | `use-hivemind-skill-authoring/references/03-three-patterns.md:276` | `use-hivemind-skill-authoring` |
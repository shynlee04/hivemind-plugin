# Session Inspection Export

- ses_id: `ses_2cd7d3571ffe1mHT7fmwttW0lj`
- prepared_at: `2026-03-28T03:39:11.990Z`

## Assistant Output

All data collected. Here is the complete structured report.

---

## Codebase Investigation Report

**Scope:** `.developing-skills/refactored-skills/` — full inventory, frontmatter extraction, reference counts, stale-string sweep, TOC check, verification-before-completion audit  
**Question:** Thorough enumeration and cross-reference of all 15 refactored skills  
**Git anchor:** `28663dfd7873963337adaadc0adff25ceb34ffa4` (`fix: replace stale context-intelligence-entry references with use-hivemind-context`)

---

### 1. Complete Directory Listing — 15 Skill Folders

| # | Skill Folder | SKILL.md Path |
|---|-------------|---------------|
| 1 | `hivemind-atomic-commit/` | `.developing-skills/refactored-skills/hivemind-atomic-commit/SKILL.md` |
| 2 | `hivemind-codemap/` | `.developing-skills/refactored-skills/hivemind-codemap/SKILL.md` |
| 3 | `hivemind-gatekeeping/` | `.developing-skills/refactored-skills/hivemind-gatekeeping/SKILL.md` |
| 4 | `hivemind-patterns/` | `.developing-skills/refactored-skills/hivemind-patterns/SKILL.md` |
| 5 | `hivemind-refactor/` | `.developing-skills/refactored-skills/hivemind-refactor/SKILL.md` |
| 6 | `hivemind-spec-driven/` | `.developing-skills/refactored-skills/hivemind-spec-driven/SKILL.md` |
| 7 | `hivemind-system-debug/` | `.developing-skills/refactored-skills/hivemind-system-debug/SKILL.md` |
| 8 | `use-hivemind/` | `.developing-skills/refactored-skills/use-hivemind/SKILL.md` |
| 9 | `use-hivemind-context/` | `.developing-skills/refactored-skills/use-hivemind-context/SKILL.md` |
| 10 | `use-hivemind-delegation/` | `.developing-skills/refactored-skills/use-hivemind-delegation/SKILL.md` |
| 11 | `use-hivemind-git-memory/` | `.developing-skills/refactored-skills/use-hivemind-git-memory/SKILL.md` |
| 12 | `use-hivemind-planning/` | `.developing-skills/refactored-skills/use-hivemind-planning/SKILL.md` |
| 13 | `use-hivemind-research/` | `.developing-skills/refactored-skills/use-hivemind-research/SKILL.md` |
| 14 | `use-hivemind-skill-authoring/` | `.developing-skills/refactored-skills/use-hivemind-skill-authoring/SKILL.md` |
| 15 | `use-hivemind-tdd/` | `.developing-skills/refactored-skills/use-hivemind-tdd/SKILL.md` |

**Non-skill files also present:**
- `.opencode/agents/hivefiver.md`
- `depth-skills.json`
- `hiveminder-operation-guidelines.md`
- `use-hivemind/` (also a skill folder, listed above)

---

### 2. YAML Frontmatter — Name & Description

| # | `name` Field | `description` Field (first sentence) |
|---|-------------|--------------------------------------|
| 1 | `hivemind-atomic-commit` | "Use when committing changes requires typed activity classification, dependency-aware ordering, pre-commit gate validation, and rollback planning." |
| 2 | `hivemind-codemap` | "Use when detox or restoration work needs whole-codebase mapping, seam discovery, high-level to low-level scan passes, or explicit concern slicing before refactor." |
| 3 | `hivemind-gatekeeping` | "Loop control and synthesis gates. When work needs iteration, this skill governs the loop." |
| 4 | `hivemind-patterns` | "Architecture patterns reference. Clean Architecture, CQRS, design patterns, anti-patterns." |
| 5 | `hivemind-refactor` | "Refactor methodology. Smallest safe change. Behavior preservation is non-negotiable." |
| 6 | `hivemind-spec-driven` | "Spec-driven engineering. From vague requirements to testable specs." |
| 7 | `hivemind-system-debug` | "Use when detox or restoration work has unresolved breakage and needs reproducibility, narrowing, containment, rollback logic, and explicit debug-to-refactor transition rules." |
| 8 | `use-hivemind` | "Master session entry router. Detects lineage, checks context health, routes to correct domain router." |
| 9 | `use-hivemind-context` | "The context health domain. Before you trust anything — docs, memory, prior sessions — check it here." |
| 10 | `use-hivemind-delegation` | "Enforce delegation when front-facing agents must split work across subagents." |
| 11 | `use-hivemind-git-memory` | "Git-based semantic memory operations — session recovery, continuity state, decision retrieval, and hierarchy indexing." |
| 12 | `use-hivemind-planning` | "The planning domain. From vague requirements to executable phases with numbered steps and dependency maps." |
| 13 | `use-hivemind-research` | "Router for structured research workflows. Use when the user asks research questions, needs multi-source investigation." |
| 14 | `use-hivemind-skill-authoring` | "The skill authoring domain. Creating, reviewing, auditing skills." |
| 15 | `use-hivemind-tdd` | "The TDD domain. Write the test first. Make it fail. Make it pass. Clean it up. Repeat for every phase." |

---

### 3. References Folder Contents — File Count per Skill

| # | Skill | Reference Files | Count |
|---|-------|----------------|-------|
| 1 | `hivemind-atomic-commit` | `activity-classifier.md`, `activity-mapper.md`, `git-gate.md`, `rollback-protocol.md`, `surface-ownership.md`, `verification-before-completion.md` | **6** |
| 2 | `hivemind-codemap` | `batching-loop.md`, `codemap-techniques.md`, `delegation-contract.md`, `repomix-mode.md`, `scan-layers.md`, `scan-levels.md` | **6** |
| 3 | `hivemind-gatekeeping` | `cascading-failure.md`, `evidence-based-gatekeeping.md`, `integration-verification.md`, `iterative-loop-control.md`, `loop-control.md`, `synthesis-gates.md` | **6** |
| 4 | `hivemind-patterns` | `anti-pattern-catalog.md`, `pattern-catalog.md` | **2** |
| 5 | `hivemind-refactor` | `code-review-reception.md`, `code-review-request.md`, `code-smell-taxonomy.md`, `refactor-techniques.md`, `verification-before-completion.md` | **5** |
| 6 | `hivemind-spec-driven` | `acceptance-criteria.md`, `traceability-matrix.md`, `verification-before-completion.md` | **3** |
| 7 | `hivemind-system-debug` | `debug-loop.md`, `verification-before-completion.md` | **2** |
| 8 | `use-hivemind` | `agent-roles.md`, `context-health-check.md`, `orchestrator-delegation.md`, `orchestrator-mandate.md`, `verification-before-completion.md` | **5** |
| 9 | `use-hivemind-context` | `context-distrust-protocol.md`, `context-rot-taxonomy.md`, `delegation-scope.md`, `entry-state-matrix.md`, `false-signal-detection.md`, `gate-chain-order.md`, `gate-definitions.md`, `platform-surface.md`, `trust-matrix.md` | **9** |
| 10 | `use-hivemind-delegation` | `architecture-audit-delegation.md`, `codescan-delegation.md`, `debug-delegation.md`, `delegation-decision.md`, `delegation-modes.md`, `domain-escalation.md`, `evidence-collection.md`, `failure-recovery.md`, `multi-wave-dispatch.md`, `parallel-dispatch.md`, `rb-role-platform-mapping.md`, `refactor-delegation.md`, `research-thread-management.md`, `role-boundaries.md`, `role-platform-mapping.md`, `source-validation.md`, `subagent-driven-development.md` | **17** |
| 11 | `use-hivemind-git-memory` | `activity-pathing.md`, `anchor-format.md`, `commit-memory-schema.md`, `context-capture.md`, `index-registration.md`, `knowledge-network.md`, `memory-fields.md`, `memory-message-format.md`, `packet-linkage.md`, `retrieval-methodology.md`, `retrieval-playbook.md`, `session-continuity.md` | **12** |
| 12 | `use-hivemind-planning` | `ambiguity-taxonomy.md`, `decomposition-steps.md`, `dependency-ordering.md`, `phase-numbering.md`, `plan-execution.md`, `plan-lifecycle.md`, `plan-to-delegation.md`, `planning-lifecycle.md`, `re-decomposition-protocol.md`, `slice-splitting-heuristics.md`, `verification-before-completion.md` | **11** |
| 13 | `use-hivemind-research` | `anti-patterns.md`, `delegation-for-research.md`, `evidence-contract.md`, `fallback-hierarchy.md`, `mcp-setup-guide.md`, `repomix-ingestion.md`, `research-classification.md`, `tool-protocols.md` | **8** |
| 14 | `use-hivemind-skill-authoring` | `01-skill-anatomy.md`, `02-frontmatter-standard.md`, `03-three-patterns.md`, `04-tdd-workflow.md`, `05-skill-quality-matrix.md`, `07-iterative-refinement.md`, `08-conflict-detection.md`, `sw-04-tdd-workflow.md` | **8** |
| 15 | `use-hivemind-tdd` | `interface-design.md`, `mocking-guide.md`, `phase-tdd-strategy.md`, `tdd-loop-delegation.md`, `tdd-loop.md`, `test-first-packet.md`, `test-gate-enforcement.md`, `test-quality.md`, `verification-before-completion.md`, `vertical-slicing.md` | **10** |

**Total reference files across all 15 skills: 110**  
**Skills with `verification-before-completion.md` as a reference file: 7** (atomic-commit, refactor, spec-driven, system-debug, use-hivemind, planning, tdd)

---

### 4. Stale Reference Cross-Reference — SKILL.md Sweep

**Command used:** `rg -c <pattern> --include="SKILL.md" .developing-skills/refactored-skills/`

| # | Stale String | Occurrences in SKILL.md Files | Verdict |
|---|-------------|-------------------------------|---------|
| 1 | `context-intelligence` (NOT `use-hivemind-context`) | **0** | ✅ Clean |
| 2 | `context-intelligence-entry` | **0** | ✅ Clean |
| 3 | `context-entry-verify` | **0** | ✅ Clean |
| 4 | `use-hivemind-detox-refactor` | **0** | ✅ Clean |
| 5 | `spec-distillation` | **0** | ✅ Clean |
| 6 | `context-rot-recovery` | **0** | ✅ Clean |
| 7 | `workflow-hierarchy` | **0** | ✅ Clean |
| 8 | `git-continuity-memory` | **0** | ✅ Clean |
| 9 | `hivemind-ownership` | **0** | ✅ Clean |
| 10 | `hivemind-secret-allow` | **0** | ✅ Clean |
| 11 | `hivemind-classify` | **0** | ✅ Clean |

**All 11 stale skill names produce ZERO matches across all 15 SKILL.md files.** The latest commit (`28663dfd`) explicitly fixes stale `context-intelligence-entry` references, confirming this was already addressed.

---

### 5. TOC / "Table of Contents" Check

**Command:** `rg -n "Table of Contents|## Contents|## Table of|## TOC" --include="SKILL.md" .developing-skills/refactored-skills/`

**Result: ZERO matches.** No SKILL.md file contains a Table of Contents or `## Contents` section.

---

### 6. `verification-before-completion` String in SKILL.md Files

**Command:** `rg -n "verification-before-completion" --include="SKILL.md" .developing-skills/refactored-skills/`

**Result: ZERO matches.** No SKILL.md file contains the literal string `verification-before-completion` in its body text.

However, **7 skills have a `references/verification-before-completion.md` file** on disk:
- `hivemind-atomic-commit/references/` 
- `hivemind-refactor/references/`
- `hivemind-spec-driven/references/`
- `hivemind-system-debug/references/`
- `use-hivemind/references/`
- `use-hivemind-planning/references/`
- `use-hivemind-tdd/references/`

This means the reference file exists but is **not linked/referenced by name** inside any SKILL.md body. The SKILL.md files presumably load these via some indirect mechanism or they are available as reference material without explicit naming.

---

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total skill folders | **15** |
| Total SKILL.md files | **15** (one per folder) |
| Total reference files | **110** |
| Skills with `references/` directory | **15/15** (all) |
| Stale reference occurrences in SKILL.md | **0** (all clean) |
| SKILL.md files with TOC section | **0** |
| SKILL.md files mentioning `verification-before-completion` | **0** |
| Reference files named `verification-before-completion.md` on disk | **7** |
| Non-skill loose files | **3** (`depth-skills.json`, `hiveminder-operation-guidelines.md`, `.opencode/agents/hivefiver.md`) |

### Gaps / Observations

1. **No SKILL.md explicitly names its `verification-before-completion.md` reference.** Seven skills carry this file but none of the SKILL.md bodies mention it. This may be intentional (loaded by convention) or an orphan gap.
2. **`use-hivemind-skill-authoring/references/` has numbering gaps:** files `01` through `05`, then `07`, `08`, plus `sw-04`. Missing `06` — either never created or was removed.
3. **No stale references remain.** The latest commit on this branch explicitly cleaned `context-intelligence-entry` → `use-hivemind-context` references. All 11 queried stale strings return zero hits.
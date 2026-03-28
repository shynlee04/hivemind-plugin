# Session Inspection Export

- ses_id: `ses_2da89ea29ffeGRUValbSfz1mlP`
- prepared_at: `2026-03-25T14:49:06.779Z`

## Assistant Output

I now have all the evidence. Here is the complete mapping report.

---

## Skill Name Mapping Report: OLD (`skills/skills/`) → NEW (`.opencode/skills/`)

**Git commit:** `HEAD` of `product-detox` worktree  
**Investigation date:** 2026-03-25

### Mapping Table

| # | OLD Name | OLD Path | NEW Name | NEW Path | Verdict | Evidence |
|---|----------|----------|----------|----------|---------|----------|
| 1 | `hivemind-gatekeeping-delegation` | `skills/skills/hivemind-gatekeeping-delegation/SKILL.md` (206 lines) | `hivemind-gatekeeping` | `.opencode/skills/hivemind-gatekeeping/SKILL.md` (165 lines) | **[PARTIAL]** — Same domain, content restructured | Same core purpose (loop control, synthesis gates, cascading failure recovery, carry-forward compression). Old version: formal "Purpose / Use This For / Do Not Use" structure. New version: conversational tone with Load Position (Slot 3) convention and loop-setup instructions. Core concepts identical but presentation diverged; old has 206 lines, new has 165. |
| 2 | `git-continuity-memory` | `skills/skills/git-continuity-memory/SKILL.md` (85 lines) | `use-hivemind-git-memory` | `.opencode/skills/use-hivemind-git-memory/SKILL.md` (84 lines) | **[PARTIAL]** — Expanded from standalone to router | Old version: standalone skill with 4 modes (`resume`, `trace`, `retrieve`, `anchor`) + session continuity protocol. New version: domain router that dispatches to specialist skills — routes `resume`/`trace`/`retrieve`/`anchor` to itself, but also routes `hivemind-atomic-commit` and decision-indexing. The new version is a superset; old content is absorbed into the router's self-reference. |
| 3 | `tdd-delegation` | `skills/skills/tdd-delegation/SKILL.md` (158 lines) | `use-hivemind-tdd` | `.opencode/skills/use-hivemind-tdd/SKILL.md` (319 lines) | **[PARTIAL]** — Same domain, massively expanded | Old version: TDD-aware delegation with red-green-refactor gates, extends `use-hivemind-delegation`. New version: full TDD lifecycle consolidating delegation mechanics + phase enforcement + gate protocol into one 319-line skill. Same RED/GREEN/REFACTOR loop, but new version has explicit Gate 1/2/3 protocol with detailed pass conditions. New is a superset. |
| 4 | `research-delegation` | `skills/skills/research-delegation/SKILL.md` (187 lines) | `use-hivemind-research` | `.opencode/skills/use-hivemind-research/SKILL.md` (95 lines) | **[PARTIAL]** — Different structure, delegation aspect separated | Old version: research-specific delegation extending `use-hivemind-delegation` with evidence contracts, source grading, multi-source synthesis. New version: thin router that classifies requests and dispatches to methodology or MCP tool protocols. The delegation mechanics from the old version were moved into `.opencode/skills/use-hivemind-delegation/` (confirmed by `references/research-thread-management.md` and `templates/research-delegation-packet.md` in delegation skill). |
| 5 | `course-correction-delegation` | `skills/skills/course-correction-delegation/SKILL.md` (191 lines) | **DEPRECATED — no equivalent** | — | **DEPRECATED** | No `.opencode/skills/` directory contains this skill. No references to `course-correction-delegation` found anywhere in `.opencode/skills/`. The debug/refactor concerns were split into standalone skills: `hivemind-system-debug/SKILL.md` (debug loops) and `hivemind-refactor/SKILL.md` (refactor methodology). The delegation aspect was absorbed into `use-hivemind-delegation`. |
| 6 | `spec-distillation` | `skills/skills/spec-distillation/SKILL.md` (110 lines) | `hivemind-spec-driven` | `.opencode/skills/hivemind-spec-driven/SKILL.md` (194 lines) | **[PARTIAL]** — Absorbed into expanded spec-driven skill | Old version: standalone spec distillation workflow (extract atoms → ambiguity map → clarification loop → output). New version: full SDE methodology that explicitly states "Consolidates: `hivemind-spec-driven` (expanded to full SDE lifecycle)" at line 30. The distillation workflow was also absorbed into `use-hivemind-planning` (line 29: "If there's noise, distill first"). Old content is a subset of what new covers. |
| 7 | `hivemind-research-tools` | `skills/skills/hivemind-research-tools/SKILL.md` (218 lines) | **No standalone equivalent — absorbed into `use-hivemind-research`** | `.opencode/skills/use-hivemind-research/` | **ABSORBED** | Old content (MCP provider catalog, tool protocols, chaining, fallback hierarchies, Repomix patterns) is now distributed across `.opencode/skills/use-hivemind-research/references/`: `mcp-setup-guide.md`, `tool-protocols.md`, `fallback-hierarchy.md`, `repomix-ingestion.md`, `anti-patterns.md`. No standalone `hivemind-research-tools` skill directory exists in `.opencode/skills/`. |
| 8 | `hivemind-research-framework` | `skills/skills/hivemind-research-framework/SKILL.md` (184 lines) | **No standalone equivalent — absorbed into `use-hivemind-research`** | `.opencode/skills/use-hivemind-research/` | **ABSORBED** | Old content (research types, question framing, evidence grading, confidence scoring, delegation strategies) is now in `.opencode/skills/use-hivemind-research/references/`: `research-classification.md`, `evidence-contract.md`, `delegation-for-research.md`. No standalone `hivemind-research-framework` skill directory exists in `.opencode/skills/`. |
| 9 | `context-intelligence-entry` | `skills/skills/context-intelligence-entry/SKILL.md` (140 lines) | **No standalone equivalent — referenced but not re-created** | — | **REFERENCED, NOT MIGRATED** | The old skill still exists at `skills/skills/context-intelligence-entry/` and is **extensively referenced** from new skills (`use-hivemind-context`, `use-hivemind`, `use-hivemind-delegation`, `use-hivemind-research`, `hivemind-system-debug`) — 33 references found. However, no `.opencode/skills/context-intelligence-entry/` directory was created. It remains at its old path and is used as a dependency, not migrated. |
| 10 | `context-entry-verify` | `skills/skills/context-entry-verify/SKILL.md` (86 lines) | **No standalone equivalent — referenced but not re-created** | — | **REFERENCED, NOT MIGRATED** | Same pattern as #9. The old skill still exists at `skills/skills/context-entry-verify/` and is referenced from `.opencode/skills/use-hivemind-context/SKILL.md` (lines 37-40, 80, 88). No `.opencode/skills/context-entry-verify/` directory was created. Used as a dependency by the new context router. |
| 11 | `use-hivemind-context-integrity` | `skills/_deprecated_hive/use-hivemind-context-integrity/SKILL.md` (83 lines) | **`use-hivemind-context`** | `.opencode/skills/use-hivemind-context/SKILL.md` (164 lines) | **[PARTIAL]** — Consolidated into context domain router | Old version: context health detection router that routes to `context-intelligence-entry` (rot recovery), `context-entry-verify` (truth verification), `harness-architecture` (delegation recovery). New version: domain router that covers the same trust-check workflow but with expanded distrust levels (CLEAN → SUSPECT → DEGRADED → POLLUTED → POISONED), 3-step trust check, and same downstream routing to `context-intelligence-entry` and `context-entry-verify`. New is a superset with stricter governance language. |

---

### Summary Statistics

| Category | Count | Skills |
|----------|-------|--------|
| **DIRECT MAP** (same content, renamed) | 0 | — |
| **[PARTIAL]** (same domain, content diverged) | 6 | gatekeeping, git-memory, tdd, research-delegation, spec-distillation, context-integrity |
| **ABSORBED** (old content split into references/templates of new skill) | 2 | hivemind-research-tools, hivemind-research-framework |
| **DEPRECATED** (no equivalent in .opencode/skills/) | 1 | course-correction-delegation |
| **REFERENCED, NOT MIGRATED** (old path still used as dependency) | 2 | context-intelligence-entry, context-entry-verify |

### Key Architectural Changes

1. **Slot-based load convention**: All new skills declare `Load Position` (Slot 1/2/3), replacing the old "prerequisites" pattern
2. **Router pattern**: Standalone skills were consolidated into domain routers (`use-hivemind-context` absorbs `use-hivemind-context-integrity` + routing for `context-intelligence-entry` + `context-entry-verify`)
3. **Delegation domain absorbed**: `course-correction-delegation` was split — debug → `hivemind-system-debug`, refactor → `hivemind-refactor`, delegation mechanics → `use-hivemind-delegation`
4. **Research triptych collapsed**: 3 skills (`hivemind-research-framework` + `hivemind-research-tools` + `research-delegation`) → 1 router (`use-hivemind-research`) with reference files

### Gaps

- `context-intelligence-entry` and `context-entry-verify` are still physically at `skills/skills/` — they are **not** in `.opencode/skills/` despite being heavily referenced by new skills. This creates a cross-directory dependency.
- `course-correction-delegation` has no 1:1 equivalent; users must now load `hivemind-system-debug` for debug loops or `hivemind-refactor` for refactor work separately.
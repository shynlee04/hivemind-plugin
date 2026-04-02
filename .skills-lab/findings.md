# Findings: Skill Authoring Package Rebuild
**Created:** 2026-04-03
**Last Updated:** 2026-04-03 (realignment session)

---
## Architecture
- Target: `use-authoring-skills/` skill package at `.skills-lab/refactoring-skills/use-authoring-skills/`
- Structure: SKILL.md + references/ (7 files) + templates/ (1 file)
- Total lines on current refs: 2,117 (2,117 in archive: identical)

### Agent Skills Specification (verified from agentskills.io)
- 6 frontmatter fields: name (required), description (required), license, optional), compatibility (optional), metadata (optional), allowed-tools (optional)
- Constraint: name must to match parent directory name (max 64 chars, lowercase + hyphens)
- Constraint: SKILL.md < 500 lines
 progressive disclosure)
- Spec allows `metadata` + `allowed-tools` but optional fields
- **User override: NO `compatibility` — user explicitly said "nonsense"
- **User override: Terminology — "Agent" not "Claude", "AGENTS.md" not "CLAUDE.md"

 ** everywhere**

### Quality Scores (Post-Wave 3, Estimated)
| File | Lines | Score | Status |
|------|------|-------|--------|
| 01-skill-anatomy.md | 150 | 7.0/10 | Deduplicated, stubs completed |
| 02-frontmatter-standard.md | 180 | 7.5/10 | Rewritten, C5 pending (2 compat refs remain) |
| 03-skill-patterns.md | 286 | 7.0/10 | Deduplicated |
| 04-tdd-workflow.md | 375 | 8.0/10 | Fixed + deduplicated |
| 05-skill-quality-matrix.md | 378 | 8.5/10 | Absorbed audit-checklist |
| 07-iterative-refinement.md | 237 | 7.0/10 | Rewritten with examples |
| 08-conflict-detection.md | 215 | 5.0/10 | Untouched (minor issues deferred) |
| sw-04-tdd-workflow.md | — | DELETED | Byte-identical duplicate of 04 |
| audit-checklist.md | — | DELETED (Merged into 05) |

### Spec Coverage
- Current: ~25% (42 gaps across 5 TABs)
- Target: >85%

### Deduplication Applied
- 01: 259→150 lines (removed P1/P2/P3 templates, frontmatter rules)
- 02: 321→180 lines (full rewrite, spec-aligned)
- 03: 323→286 lines (fixed self-link error, removed trivial stacking)
- 04: 392→375 lines (quality table → cross-ref to 05)
- 05: Absorbed audit-checklist content
- 07: 196→237 lines (full rewrite with concrete examples)

- Total: ~655 lines recoverable (263 duplication + 392 dead duplicate)

### CRITICAL Contradiction Fixed
- `04-tdd-workflow.md` GREEN phase showed 8 forbidden frontmatter fields in its template
- All 8 removed, replaced with spec-compliant `name` + `description` only

### Terminology Applied
- "Claude" → "Agent" everywhere in all Wave 2+3 edits
- "CLAUDE.md" → "AGENTS.md" everywhere in all Wave 2+3 edits
- SKILL.md description verified: no "Claude"/"CLAUDE.md" terminology

### User Corrections Applied
- C1: Removed `compatibility` from SKILL.md frontmatter
- C2: Archived 138 files to `.skills-lab/.archive/2026-04-03-pre-rebuild/`
- C3: GCC initialized (mode: git, branch: harness-experiment)
- C4: SOT hierarchy established (task_plan.md, findings.md, progress.md at `.skills-lab/` root)
- C5: PENDING — 2 compatibility refs remain in 02-frontmatter-standard.md

- C6: NEVER DONE — GCC commit was planned 10+ times but never executed

---
## Git State
- Last commit: `4df504e6` (checkpoint: lock .skills-lab/ + .GCC/ state)
- Archive: `.skills-lab/.archive/2026-04-03-pre-rebuild/` (138 files, untracked but commit)
- GCC: `.GCC/` (initialized, committed in checkpoint)
- Planning docs: `.skills-lab/task_plan.md`, `findings.md`, `progress.md` (committed in checkpoint)
- All reference file edits: committed in checkpoint

- SKILL.md: committed in checkpoint
- **.opencode/ files deleted but NOT committed** (AGENTS.md, harness-control-plane.ts, harness-rules.md, context-checkpoint.ts)

- **These deleted .opencode/ files are staged but not committed**

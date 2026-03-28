# Session Inspection Export

- ses_id: `ses_2da8ec6f0ffe9OsbUpifRWWPSV`
- prepared_at: `2026-03-25T14:44:42.818Z`

## Assistant Output

Now I have all the data. Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Skill inventory across `.opencode/skills/`, `.kilocode/skills/`, `skills/skills/`, agent definitions, and AGENTS.md  
**Question:** Complete mapping of all skills on disk vs. referenced skills, including orphaned references and unused skills

---

### 1. Skill Directories Under `.opencode/skills/` (15 directories)

| # | Directory Name | Canonical Skill Name (from SKILL.md frontmatter) |
|---|---|---|
| 1 | `hivemind-atomic-commit` | `hivemind-atomic-commit` |
| 2 | `hivemind-codemap` | `hivemind-codemap` |
| 3 | `hivemind-gatekeeping` | `hivemind-gatekeeping` |
| 4 | `hivemind-patterns` | `hivemind-patterns` |
| 5 | `hivemind-refactor` | `hivemind-refactor` |
| 6 | `hivemind-spec-driven` | `hivemind-spec-driven` |
| 7 | `hivemind-system-debug` | `hivemind-system-debug` |
| 8 | `use-hivemind` | `use-hivemind` |
| 9 | `use-hivemind-context` | `use-hivemind-context` |
| 10 | `use-hivemind-delegation` | `use-hivemind-delegation` |
| 11 | `use-hivemind-git-memory` | `use-hivemind-git-memory` |
| 12 | `use-hivemind-planning` | `use-hivemind-planning` |
| 13 | `use-hivemind-research` | `use-hivemind-research` |
| 14 | `use-hivemind-skill-authoring` | `use-hivemind-skill-authoring` |
| 15 | `use-hivemind-tdd` | `use-hivemind-tdd` |

**Evidence:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/`

---

### 2. Skill Directories Under `.kilocode/skills/` (15 directories — identical to `.opencode/skills/`)

| # | Directory Name | Canonical Skill Name |
|---|---|---|
| 1 | `hivemind-atomic-commit` | `hivemind-atomic-commit` |
| 2 | `hivemind-codemap` | `hivemind-codemap` |
| 3 | `hivemind-gatekeeping` | `hivemind-gatekeeping` |
| 4 | `hivemind-patterns` | `hivemind-patterns` |
| 5 | `hivemind-refactor` | `hivemind-refactor` |
| 6 | `hivemind-spec-driven` | `hivemind-spec-driven` |
| 7 | `hivemind-system-debug` | `hivemind-system-debug` |
| 8 | `use-hivemind` | `use-hivemind` |
| 9 | `use-hivemind-context` | `use-hivemind-context` |
| 10 | `use-hivemind-delegation` | `use-hivemind-delegation` |
| 11 | `use-hivemind-git-memory` | `use-hivemind-git-memory` |
| 12 | `use-hivemind-planning` | `use-hivemind-planning` |
| 13 | `use-hivemind-research` | `use-hivemind-research` |
| 14 | `use-hivemind-skill-authoring` | `use-hivemind-skill-authoring` |
| 15 | `use-hivemind-tdd` | `use-hivemind-tdd` |

**Evidence:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.kilocode/skills/`

---

### 3. Additional Skill Locations (not requested but discovered)

**`skills/skills/`** — 19 directories (older skill set, pre-consolidation):  
`context-entry-verify`, `context-intelligence-entry`, `course-correction-delegation`, `git-continuity-memory`, `hivemind-atomic-commit`, `hivemind-codemap`, `hivemind-gatekeeping-delegation`, `hivemind-research`, `hivemind-research-framework`, `hivemind-research-tools`, `hivemind-skill-doctor`, `hivemind-skill-write`, `hivemind-system-debug`, `research-delegation`, `spec-distillation`, `tdd-delegation`, `use-hivemind-delegation`, `use-hivemind-detox-refactor`, `use-hivemind-skill-writer`

**`skills/_deprecated_hive/`** — 27 directories (deprecated, quarantined)

---

### 4. Cross-Reference: Skills Referenced in Agent Definitions and AGENTS.md

Skills are referenced in two places:
- **AGENTS.md** — root governance document
- **`.opencode/agents/*.md`** — 13 agent definition files with tool permission lists and skill loading tables

| Skill Name Referenced | Referenced In | Exists in `.opencode/skills/`? | Exists in `skills/skills/`? |
|---|---|---|---|
| `use-hivemind-delegation` | 13 agent files | YES | YES |
| `use-hivemind-context-integrity` | 10 agent files | **NO** | **NO** (exists in `_deprecated_hive/`) |
| `hivemind-codemap` | 7 agent files | YES | YES |
| `hivemind-atomic-commit` | 5 agent files | YES | YES |
| `hivemind-gatekeeping-delegation` | 5 agent files | **NO** | YES |
| `hivemind-system-debug` | 4 agent files | YES | YES |
| `hivemind-research-tools` | 4 agent files | **NO** | YES |
| `use-hivemind-git-memory` | 4 agent files | YES | — |
| `hivemind-research` | 2 agent files | **NO** | YES |
| `hivemind-research-framework` | 2 agent files | **NO** | YES |
| `use-hivemind-hierarchy` | 1 agent file (`architect.md:356`) | **NO** | **NO** (exists in `_deprecated_hive/` and `.developing-skills/`) |
| `context-intelligence-entry` | 1 agent file (`handoff.md:248`) | **NO** | YES |
| `git-continuity-memory` | 1 agent file (`handoff.md:248`) | **NO** | YES |
| `course-correction-delegation` | 1 agent file (`handoff.md:248`) | **NO** | YES |
| `tdd-delegation` | 1 agent file (`handoff.md:248`) | **NO** | YES |
| `use-hivemind-detox-refactor` | AGENTS.md:13 | **NO** | YES |
| `git-advanced-workflows` | AGENTS.md:410 | **NO** | **NO** (exists at `/Users/apple/.agents/skills/git-advanced-workflows/` per error logs) |

---

### 5. ORPHANED REFERENCES — Skills Referenced But NOT in `.opencode/skills/`

These 10 skills are actively referenced by agent definitions or AGENTS.md but do NOT exist in the authoritative `.opencode/skills/` directory:

| # | Orphaned Skill | Where Referenced | Closest Location |
|---|---|---|---|
| 1 | `use-hivemind-context-integrity` | 10 agent files (tool permissions) | `skills/_deprecated_hive/use-hivemind-context-integrity/` |
| 2 | `hivemind-gatekeeping-delegation` | 5 agent files (tool permissions + skill tables) | `skills/skills/hivemind-gatekeeping-delegation/` |
| 3 | `hivemind-research-tools` | 4 agent files (tool permissions) | `skills/skills/hivemind-research-tools/` |
| 4 | `hivemind-research` | 2 agent files | `skills/skills/hivemind-research/` |
| 5 | `hivemind-research-framework` | 2 agent files | `skills/skills/hivemind-research-framework/` |
| 6 | `use-hivemind-hierarchy` | `architect.md:356` | `skills/_deprecated_hive/use-hivemind-hierarchy/` |
| 7 | `context-intelligence-entry` | `handoff.md:248` | `skills/skills/context-intelligence-entry/` |
| 8 | `git-continuity-memory` | `handoff.md:248` | `skills/skills/git-continuity-memory/` |
| 9 | `course-correction-delegation` | `handoff.md:248` | `skills/skills/course-correction-delegation/` |
| 10 | `tdd-delegation` | `handoff.md:248` | `skills/skills/tdd-delegation/` |
| 11 | `use-hivemind-detox-refactor` | AGENTS.md:13 | `skills/skills/use-hivemind-detox-refactor/` |
| 12 | `git-advanced-workflows` | AGENTS.md:410 | `/Users/apple/.agents/skills/git-advanced-workflows/` (external) |

---

### 6. UNUSED SKILLS — In `.opencode/skills/` But NOT Referenced Anywhere

These 5 skills exist in `.opencode/skills/` but are not referenced in any agent definition file or AGENTS.md:

| # | Unused Skill | Status |
|---|---|---|
| 1 | `hivemind-patterns` | Not referenced in any agent `.md` or AGENTS.md |
| 2 | `hivemind-refactor` | Not referenced in any agent `.md` or AGENTS.md |
| 3 | `hivemind-spec-driven` | Not referenced in any agent `.md` or AGENTS.md |
| 4 | `use-hivemind-planning` | Not referenced in any agent `.md` or AGENTS.md |
| 5 | `use-hivemind-skill-authoring` | Not referenced in any agent `.md` or AGENTS.md |

**Note:** `use-hivemind` (the master entry router) is referenced generically in AGENTS.md as the session entry point but not by specific agent skill tables.

---

### 7. Summary Statistics

| Metric | Count |
|---|---|
| `.opencode/skills/` directories | 15 |
| `.kilocode/skills/` directories | 15 (identical mirror) |
| `skills/skills/` directories | 19 (older pre-consolidation set) |
| `skills/_deprecated_hive/` directories | 27 (deprecated) |
| Unique skills referenced by agents/AGENTS.md | 22 |
| Orphaned references (referenced but missing from `.opencode/skills/`) | **12** |
| Unused skills (in `.opencode/skills/` but unreferenced) | **5** |
| Skills both on disk AND referenced | **10** |

### 8. Git Context

- Working tree: `/Users/apple/hivemind-plugin/.worktrees/product-detox`
- Investigation timestamp: 2026-03-25T21:41:10+07:00
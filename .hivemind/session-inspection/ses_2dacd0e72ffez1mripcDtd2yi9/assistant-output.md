# Session Inspection Export

- ses_id: `ses_2dacd0e72ffez1mripcDtd2yi9`
- prepared_at: `2026-03-25T13:35:40.252Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** All references to 23 old/deprecated skill names across `.developing-skills/refactored-skills/`
**Question:** Exhaustive grep for stale skill name references in .md, .json, .txt files

---

### Findings Grouped by File

#### FILE 1: `use-hivemind/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `use-hivemind-skill-writer` | 39 | `\| Skill creation/audit \| \`use-hivemind-skill-writer\` \| Authoring, auditing, or refactoring HiveMind skills \|` |
| 2 | `plan-engineering` | 43 | `\| Planning work \| \`plan-engineering\` \| Plan lifecycle, phase decomposition, execution tracking \|` |
| 3 | `use-hivemind-detox-refactor` | 41 | `\| Multi-stage refactor \| \`use-hivemind-detox-refactor\` \| Framework refactor, recovery, detox across context and code \|` |
| 4 | `tdd-delegation` | 56 | `\| 3 — Depth \| Implementation skill within the domain \| \`tdd-delegation\`, \`hivemind-atomic-commit\`, etc. \|` |
| 5 | `plan-engineering` | 55 | `\| 2 — Domain \| Domain router for the request type \| \`use-hivemind-delegation\`, \`plan-engineering\`, etc. \|` |
| 6 | `tdd-delegation` | 72 | `\| **Hivefiver** \| Executor \| Implements bounded work, writes code, produces artifacts \| Implementation skills (\`tdd-delegation\`, \`hivemind-atomic-commit\`, etc.) \|` |
| 7 | `plan-engineering` | 71 | `\| **Hiveminder** \| Orchestrator \| Coordinates work, delegates to subagents, never reads deep \| Domain routers (\`use-hivemind-delegation\`, \`plan-engineering\`, etc.) \|` |

---

#### FILE 2: `hivemind-refactor/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `tdd-delegation` | 265 | `\| \`tdd-delegation\` \| If refactor adds behavior, transition to TDD \|` |
| 2 | `course-correction-delegation` | 266 | `\| \`course-correction-delegation\` \| If refactor breaks things, debug delegation takes over \|` |
| 3 | `hivemind-gatekeeping-delegation` | 275 | `- This skill composes with \`hivemind-gatekeeping-delegation\` for multi-iteration refactor loops` |

---

#### FILE 3: `hivemind-spec-driven/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `course-correction-delegation` | 43 | `- Debug loops or course correction — use \`course-correction-delegation\`` |
| 2 | `test-gatekeeping-flow` | 175 | `\| \`test-gatekeeping-flow\` \| Downstream — acceptance criteria become test gates \|` |
| 3 | `tdd-delegation` | 176 | `\| \`tdd-delegation\` \| Downstream — traceable requirements drive TDD red phase \|` |
| 4 | `spec-distillation` | 4 | `Spec-driven engineering...Consolidates spec-distillation into a full SDE methodology...` |
| 5 | `spec-distillation` | 30 | `Consolidates: \`spec-distillation\` (expanded to full SDE lifecycle).` |

---

#### FILE 4: `use-hivemind-tdd/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `tdd-delegation` | 309 | `\| \`templates/tdd-delegation-packet.md\` \| Extended delegation packet JSON template \|` |
| 2 | `hivemind-gatekeeping-delegation` | 317 | `- Depth companions: \`hivemind-atomic-commit\`, \`hivemind-gatekeeping-delegation\`` |

---

#### FILE 5: `use-hivemind-git-memory/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 3 | `description: Entry router for git-based semantic memory operations. Routes to git-continuity-memory for session recovery...` |
| 2 | `git-continuity-memory` | 21 | `\| Resume from interruption or session break \| \`git-continuity-memory\` \| resume \|` |
| 3 | `git-continuity-memory` | 22 | `\| Trace why a change exists... \| \`git-continuity-memory\` \| trace \|` |
| 4 | `git-continuity-memory` | 23 | `\| Retrieve decisions or context from git history \| \`git-continuity-memory\` \| retrieve \|` |
| 5 | `git-continuity-memory` | 24 | `\| Anchor next checkpoint for future recovery \| \`git-continuity-memory\` \| anchor \|` |
| 6 | `git-memory-enforce` | 3 | `...git-memory-enforce for memory-first enforcement, and hierarchy-retrace for decision indexing.` |
| 7 | `git-memory-enforce` | 26 | `\| Enforce that commits carry decision memory \| \`git-memory-enforce\` \| — \|` |
| 8 | `hierarchy-retrace` | 3 | `...and hierarchy-retrace for decision indexing.` |
| 9 | `hierarchy-retrace` | 27 | `\| Index or query the decision hierarchy \| \`hierarchy-retrace\` \| — \|` |
| 10 | `git-continuity-memory` | 39 | `\| \`git-continuity-memory\` \| Continuity \| Session recovery, tracing, retrieval, anchoring \|` |
| 11 | `git-memory-enforce` | 41 | `\| \`git-memory-enforce\` \| Enforcement \| Memory-first commit validation, decision encoding \|` |
| 12 | `hierarchy-retrace` | 42 | `\| \`hierarchy-retrace\` \| Indexing \| Decision tree traversal, cross-session query, audit trails \|` |
| 13 | `git-continuity-memory` | 48 | `\| Loading \`git-continuity-memory\` directly \| Bypasses routing... \|` |
| 14 | `git-continuity-memory` | 50 | `\| ... \| Use \`git-continuity-memory\` (resume) for recovery \|` |
| 15 | `hierarchy-retrace` | 51 | `\| Querying hierarchy without indexing first... \| Route to \`hierarchy-retrace\` to build/query index \|` |
| 16 | `git-continuity-memory` | 63 | `→ git-continuity-memory \| hivemind-atomic-commit \| git-memory-enforce \| hierarchy-retrace` |
| 17 | `git-memory-enforce` | 63 | `(same line as above)` |
| 18 | `hierarchy-retrace` | 63 | `(same line as above)` |
| 19 | `git-continuity-memory` | 73 | `→ dispatch git-continuity-memory with mode parameter` |
| 20 | `git-memory-enforce` | 77 | `→ dispatch git-memory-enforce` |
| 21 | `hierarchy-retrace` | 79 | `→ dispatch hierarchy-retrace` |

---

#### FILE 6: `use-hivemind-git-memory/tests/direct-invocation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 8 | `- \`git-continuity-memory\` classifies the task as \`resume\`.` |

---

#### FILE 7: `use-hivemind-git-memory/tests/git-memory-enforce-direct-invocation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-memory-enforce` | 108 | `**When:** Agent uses git-memory-enforce to resume context.` |

---

#### FILE 8: `use-hivemind-git-memory/references/session-continuity.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 137 | `When using \`git-continuity-memory\` to resume:` |

---

#### FILE 9: `use-hivemind-git-memory/references/commit-memory-schema.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-memory-enforce` | 36 | `"branch": "feature/git-memory-enforce",` |

---

#### FILE 10: `use-hivemind-git-memory/references/index-registration.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-memory-enforce` | 25 | `"branch": "feature/git-memory-enforce",` |

---

#### FILE 11: `hivemind-atomic-commit/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 39 | `\| \`git-continuity-memory\` \| Records commit anchors and session continuity... \|` |

---

#### FILE 12: `use-hivemind-delegation/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 46 | `\| \`git-continuity-memory\` \| Git-aware continuity — commit SHAs and branch state recorded in packets \|` |
| 2 | `hivemind-gatekeeping-delegation` | 47 | `\| \`hivemind-gatekeeping-delegation\` \| Iterative loops, synthesis gates, cascading failure — extracted from this skill \|` |
| 3 | `use-hivemind-detox-refactor` | 41 | `\| \`use-hivemind-detox-refactor\` \| Router that triggers this skill — delegates slices here \|` |
| 4 | `spec-distillation` | 44 | `\| \`spec-distillation\` \| Planning mode — distillation outputs feed into planning delegation \|` |
| 5 | `hivemind-gatekeeping-delegation` | 178 | `For cascading failure and parallel-slice isolation at scale, see \`hivemind-gatekeeping-delegation\`.` |
| 6 | `hivemind-gatekeeping-delegation` | 196 | `For iterative loop control...see \`hivemind-gatekeeping-delegation\`.` |
| 7 | `hivemind-gatekeeping-delegation` | 261 | `\| \`hivemind-gatekeeping-delegation\` \| Iterative loops, synthesis gates, cascading failure \|` |
| 8 | `use-hivemind-detox-refactor` | 270 | `- It may be selected directly or from \`use-hivemind-detox-refactor\`.` |

---

#### FILE 13: `use-hivemind-delegation/references/debug-delegation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-gatekeeping-delegation` | 61 | `Loop gating: \`hivemind-gatekeeping-delegation\`` |

---

#### FILE 14: `use-hivemind-delegation/references/architecture-audit-delegation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-gatekeeping-delegation` | 49 | `Loop gating: \`hivemind-gatekeeping-delegation\`` |

---

#### FILE 15: `use-hivemind-delegation/references/refactor-delegation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-gatekeeping-delegation` | 61 | `Loop gating: \`hivemind-gatekeeping-delegation\`` |
| 2 | `use-hivemind-detox-refactor` | 59 | `Refactor methodology: \`use-hivemind-detox-refactor\`` |

---

#### FILE 16: `use-hivemind-delegation/references/failure-recovery.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-gatekeeping-delegation` | 76 | `For cascading failure protocols, see \`hivemind-gatekeeping-delegation/references/cascading-failure.md\`.` |

---

#### FILE 17: `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `git-continuity-memory` | 62 | `Added table showing relationships to \`use-hivemind-detox-refactor\`, ...and \`git-continuity-memory\`.` |
| 2 | `use-hivemind-detox-refactor` | 62 | `(same line)` |
| 3 | `spec-distillation` | 62 | `(same line)` |

---

#### FILE 18: `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `use-hivemind-detox-refactor` | 79 | `...no reference to: \`use-hivemind-detox-refactor\` (the router that triggers this skill)...` |
| 2 | `spec-distillation` | 79 | `...or \`spec-distillation\` (planning mode often follows distillation)...` |

---

#### FILE 19: `use-hivemind/templates/load-template.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-gatekeeping-delegation` | 38 | `Slot 3: hivemind-gatekeeping-delegation` |
| 2 | `hivemind-research-framework` | 98 | `Slot 3: hivemind-research-framework` |
| 3 | `hivemind-research-framework` | 125 | `\| Research \| use-hivemind-delegation \| hivemind-research-framework \|` |

---

#### FILE 20: `use-hivemind-research/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-research-framework` | 3 | `description: "Router for structured research workflows...Routes to hivemind-research-framework (methodology) and hivemind-research-tools (MCP tool protocols)."` |
| 2 | `hivemind-research-tools` | 3 | `(same line)` |
| 3 | `hivemind-research-framework` | 23 | `B -->\|Yes\| C[hivemind-research-framework]` |
| 4 | `hivemind-research-tools` | 25 | `D -->\|Yes\| E[hivemind-research-tools]` |
| 5 | `hivemind-research-framework` | 94 | `\| hivemind-research-framework \| \`../hivemind-research-framework/SKILL.md\` \| Methodology, types, grading \|` |
| 6 | `hivemind-research-tools` | 95 | `\| hivemind-research-tools \| \`../hivemind-research-tools/SKILL.md\` \| MCP protocols, chaining, fallbacks \|` |
| 7 | `spec-distillation` | 80 | `\| spec-distillation \| Refining vague research requests into answerable questions \|` |

---

#### FILE 21: `use-hivemind-research/references/evidence-contract.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-research-framework` | 3 | `Defines the grading system...for all research conducted under hivemind-research-framework.` |
| 2 | `hivemind-research-framework` | 141 | `- **hivemind-research-framework SKILL.md** — uses grading for all findings` |
| 3 | `hivemind-research-tools` | 142 | `- **hivemind-research-tools SKILL.md** — tool results feed into grading system` |

---

#### FILE 22: `use-hivemind-research/references/tool-protocols.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-research-tools` | 208 | `See \`hivemind-research-tools/SKILL.md\` for full chaining protocol details.` |

---

#### FILE 23: `hivemind-system-debug/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `use-hivemind-detox-refactor` | 8 | `This is the deep system-debug branch family for \`use-hivemind-detox-refactor\`.` |

---

#### FILE 24: `hivemind-codemap/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `use-hivemind-detox-refactor` | 8 | `This is the deep codemap branch family for \`use-hivemind-detox-refactor\`.` |

---

#### FILE 25: `use-hivemind-skill-authoring/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `use-hivemind-skill-writer` | 7 | `- use-hivemind-skill-writer` |
| 2 | `hivemind-skill-doctor` | 8 | `- hivemind-skill-doctor` |
| 3 | `hivemind-skill-write` | 9 | `- hivemind-skill-write` |
| 4 | `skill-universal-design` | 10 | `- skill-universal-design` |
| 5 | `skill-conflict-detect` | 11 | `- skill-conflict-detect` |
| 6 | `use-hivemind-skill-writer` | 217 | `- \`use-hivemind-skill-writer\` → superseded by Creation Template section` |
| 7 | `hivemind-skill-doctor` | 218 | `- \`hivemind-skill-doctor\` → superseded by Review Checklist section` |
| 8 | `hivemind-skill-write` | 219 | `- \`hivemind-skill-write\` → superseded by Skill Anatomy section` |
| 9 | `skill-universal-design` | 220 | `- \`skill-universal-design\` → superseded by Universal Design section` |
| 10 | `skill-conflict-detect` | 221 | `- \`skill-conflict-detect\` → superseded by Conflict Detection section` |

---

#### FILE 26: `use-hivemind-skill-authoring/references/03-three-patterns.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-skill-writer` | 55 | `\| \`hivemind-skill-writer\` \| hivemind-skill-writer \| anatomy, quality, tdd \|` |
| 2 | `hivemind-skill-writer` | 225 | `- Meta skills (like hivemind-skill-writer)` |
| 3 | `hivemind-skill-writer` | 274 | `\| hivemind-skill-writer \| context-intelligence \| Companion, stacking: 0 \|` |
| 4 | `skill-audit-hivemind` | 275 | `\| skill-audit-hivemind \| hivemind-skill-writer \| P3 specialist on demand \|` |
| 5 | `hivemind-skill-writer` | 275 | `(same line - as column 2)` |
| 6 | `skill-migration-hivemind` | 276 | `\| skill-migration-hivemind \| hivemind-skill-writer \| P3 specialist when migrating \|` |
| 7 | `hivemind-skill-writer` | 276 | `(same line - as column 2)` |

---

#### FILE 27: `use-hivemind-skill-authoring/references/sw-04-tdd-workflow.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-skill-writer` | 73 | `Without hivemind-skill-writer loaded:` |
| 2 | `hivemind-skill-writer` | 76 | `With hivemind-skill-writer loaded:` |

---

#### FILE 28: `use-hivemind-skill-authoring/references/04-tdd-workflow.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-skill-writer` | 73 | `Without hivemind-skill-writer loaded:` |
| 2 | `hivemind-skill-writer` | 76 | `With hivemind-skill-writer loaded:` |

---

#### FILE 29: `use-hivemind-skill-authoring/references/02-frontmatter-standard.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-skill-writer` | 41 | `name: hivemind-skill-writer` |
| 2 | `hivemind-skill-writer` | 162 | `name: hivemind-skill-writer` |

---

#### FILE 30: `use-hivemind-skill-authoring/references/08-conflict-detection.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `hivemind-skill-writer` | 108 | `├── hivemind-skill-writer (companion) — if creating skills` |

---

#### FILE 31: `use-hivemind-planning/SKILL.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `plan-engineering` | 11 | `Consolidates: \`plan-engineering\`, \`plan-breakdown\`, \`spec-distillation\`, \`hivemind-codemap\` (feasibility section).` |
| 2 | `plan-breakdown` | 11 | `(same line)` |
| 3 | `spec-distillation` | 11 | `(same line)` |
| 4 | `plan-engineering` | 236 | `This skill consolidates: \`plan-engineering\` (lifecycle + retraceability), \`plan-breakdown\` (decomposition methodology), \`spec-distillation\`...` |
| 5 | `plan-breakdown` | 236 | `(same line)` |
| 6 | `spec-distillation` | 236 | `(same line)` |

---

#### FILE 32: `use-hivemind-planning/templates/decomposition-plan.json`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `plan-breakdown` | 6 | `"decomposition_method": "plan-breakdown v1.0"` |

---

#### FILE 33: `use-hivemind-planning/references/decomposition-steps.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `spec-distillation` | 90 | `- **Step 1 fails** (cannot classify surface): The spec is ambiguous. Return to \`spec-distillation\`.` |

---

#### FILE 34: `use-hivemind-planning/tests/direct-invocation.md`
| # | Old Skill Name | Line | Content |
|---|----------------|------|---------|
| 1 | `spec-distillation` | 5 | `Validate that \`spec-distillation\` can be selected and used directly...` |

---

### Summary by Old Skill Name

| # | Old Skill Name | Total Matches | Files Affected |
|---|----------------|---------------|----------------|
| 1 | `course-correction-delegation` | 2 | 2 |
| 2 | `research-delegation` | 0 | 0 |
| 3 | `agent-role-boundary` | 0 | 0 |
| 4 | `tdd-delegation` | 5 | 4 |
| 5 | `tdd-phase-execution` | 0 | 0 |
| 6 | `test-gatekeeping-flow` | 1 | 1 |
| 7 | `git-continuity-memory` | 15 | 7 |
| 8 | `git-memory-enforce` | 8 | 5 |
| 9 | `hierarchy-retrace` | 6 | 2 |
| 10 | `hivemind-gatekeeping-delegation` | 11 | 7 |
| 11 | `hivemind-research-framework` | 7 | 4 |
| 12 | `hivemind-research-tools` | 5 | 3 |
| 13 | `hivemind-skill-doctor` | 2 | 1 |
| 14 | `hivemind-skill-write` | 2 | 1 |
| 15 | `hivemind-skill-writer` (+ `use-hivemind-skill-writer`) | 18 | 10 |
| 16 | `plan-breakdown` | 3 | 2 |
| 17 | `plan-engineering` | 5 | 2 |
| 18 | `skill-conflict-detect` | 2 | 1 |
| 19 | `skill-universal-design` | 2 | 1 |
| 20 | `spec-distillation` | 10 | 7 |
| 21 | `skill-audit-hivemind` | 1 | 1 |
| 22 | `skill-migration-hivemind` | 1 | 1 |
| 23 | `use-hivemind-detox-refactor` | 8 | 6 |

### Gaps — Zero Matches Found
- `research-delegation` — 0 references
- `agent-role-boundary` — 0 references
- `tdd-phase-execution` — 0 references

### Total: **~124 individual line references** across **34 unique files**, referencing **20 of the 23** old skill names.
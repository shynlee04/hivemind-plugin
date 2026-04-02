# Task Plan: Skill Authoring Package Rebuild
## Goal
Rebuild `use-authoring-skills` into a spec-compliant, progressively-disclosed, eval-driven, cross-platform skill authoring package.
 the meta-builder foundation for the HiveMind harness framework.

## Status: IN-PROGRESS — Realignment Applied, C5 Fixed, SOT Update pending

## Current Phase: REALIGNMENT
## Phases
- [x] 1. Context Scouting (Wave 0: 4 agents)
- [x] 2. Deep Audit (Wave 1: 3 agents)
- [x] 3. Fix CRITICALs (Wave 2: 3 agents)
- [x] 4. Deduplicate (Wave 3: 3 agents)
- [x] 5. Apply User Corrections (C1-C4)
- [ ] 6. Fix remaining C5 (2 compatibility refs in 02)
- [ ] 7. Rewrite SKILL.md body as routing hub
- [ ] 8. Create new reference files (06, 09-12)
- [ ] 9. Create templates, scripts, examples
- [ ] 10. Validation gate
- [ ] 11. Bridging

- [ ] 12. Git commit

implied by user)
- [ ] 13. Session 2 starts after realignment

NEXT

## Current Phase: 5

## Blockers: C5 incomplete (2 compatibility refs remain in 02-frontmatter-standard.md)

## Key Decisions (LOCKED)
- D1: Align with agentskills.io spec — metadata + allowed-tools useful optionals. NO compatibility
- D2: Incremental scope this session. New content next session
- D3-T1: Lean SKILL.md + deep progressive refs (concise entry, deep on demand)
- D3-T3: Adaptive with constraints — templates, examples, fallbacks
- D3-T4: Granular + incremental + programmatic measurable gates
- D3-T5: Universal — "Agent" not "Claude", "AGENTS.md" not "CLAUDE.md"
- D4: Explicit skill loads (skill-creator, skill-development, writing-skills)
## Active Skill Loads
- Creating/improving: `skill-creator`, `skill-development`, `writing-skills`
- Audit/refactor: `skill-judge`, `skill-review`
- Memory: `gcc` (git context controller)
- Planning: `planning-with-files` (task_plan.md, findings.md, progress.md)
## Hard Constraints (MUST follow)
- NEVER skip GCC commit after meaningful action
- NEVER leave planning docs stale — update after every phase change
- NEVER delete from refactoring-skills/ — always archive to .skills-lab/.archive/
- NEVER start SKILL.md body rewrite until C5 fix is done
- NEVER create new ref files until SKILL.md body is approved
- ALWAYS commit before starting new phase
- ALWAYS use `planning-with-files` discipline: read-before-decide
- ALWAYS write-to-disk after every 2 search/read actions
- ALWAYS verify file state with git before claiming "done"
## Verified File States (git: 4df504e6)
### SKILL.md: frontmatter fixed, body NOT rewritten. 281 lines of HiveMind-coupled mess.
### 01-skill-anatomy.md: deduplicated (259→150 lines)
### 02-frontmatter-standard.md: rewritten, C5 fix applied. 180 lines
### 03-skill-patterns.md: deduplicated (323→286 lines)
### 04-tdd-workflow.md: fixed + deduplicated (392→375 lines)
### 05-skill-quality-matrix.md: absorbed audit-checklist (~378 lines)
### 07-iterative-refinement.md: rewritten (196→237 lines)
### 08-conflict-detection.md: untouched (215 lines)
### sw-04-tdd-workflow.md: DELETED (byte-identical duplicate)
### audit-checklist.md: DELETED (merged into 05)
### Archive exists at .skills-lab/.archive/2026-04-03-pre-rebuild/
### Architecture design doc at workspace/knowledge/architecture-design-2026-04-03.md
### Master plan at workspace/master-plan/master-plan-2026-04-03.md
## What's NOT Done (sorted by priority)
- SKILL.md body rewrite (281 lines → universal, expert, <500 line routing hub)
- New ref files (06, 09-12)
- Templates (evals, grading, scaffold)
- Scripts (validation, overlap detection, trigger testing)
- Examples (P1, P2, P3 walkthroughs)
- OpenCode platform docs consumption (20 files in users resources)
- Cross-package bridging spec
## Resource Map
```
.skills-lab/
├── .archive/2026-04-03-pre-rebuild/   # NEVER delete until new pack functional
├── active/                            # For future
├── refactoring-skills/             # Current working directory
│   ├── use-authoring-skills/       # The skill being rebuilt
│   ├── users-prompting-workspace-resources/  # User requirements
│   └── workspace/                  # Subagent outputs + knowledge
├── realignment-2026-04-03.md    # THIS FILE — read first
├── task_plan.md                        # SOT plan
├── findings.md                       # SOT discoveries
└── progress.md                       # SOT action log
```
## Session Recovery
1. Read `.skills-lab/realignment-2026-04-03.md` → constraints
2. Read `.skills-lab/task_plan.md` → current phase
3. Read `.skills-lab/findings.md` → facts
4. Run `git log --oneline -5` → recent commits
5. Resume from current phase

# Task Plan: Meta-Builder Milestone 1 — GROUP 1 Skills + use-authoring-skills Completion

**Goal:** Complete the first milestone of the meta-builder harness: stabilize `use-authoring-skills` (GROUP 2) and build the first 3 GROUP 1 specialist skills.

**Status:** IN-PROGRESS — SOT docs updated, delegating to 4 parallel builder agents

## Milestone Scope

This milestone covers:
1. **use-authoring-skills** (GROUP 2) — complete missing reference files, templates, scripts
2. **user-intent-interactive-loop** (GROUP 1) — new skill for iterative user engagement
3. **coordinating-loop** (GROUP 1) — new skill for parallel/sequential coordination patterns
4. **planning-with-files** (GROUP 1) — replace broken version with proper repo version

## Phases

- [x] 0. Context scouting, audit, recovery (ses_2b05 → ses_2b07)
- [x] 1. SKILL.md body rewritten (337 lines, locked decisions encoded)
- [x] 2. Terminology cleaned (HiveMind/Claude → Agent/AGENTS.md)
- [x] 3. Meta-builder architecture spec written
- [ ] 4. **use-authoring-skills completion** — ref files 06, 09-12, templates, scripts
- [ ] 5. **user-intent-interactive-loop** — GROUP 1 skill #1
- [ ] 6. **coordinating-loop** — GROUP 1 skill #2
- [ ] 7. **planning-with-files replacement** — GROUP 1 skill #3
- [ ] 8. Validation gate — test all 4 skills against real scenarios
- [ ] 9. Commit all, update architecture spec

## Active Builder Agents

| Agent | Task | Status |
|-------|------|--------|
| builder-1 | Complete use-authoring-skills (ref 06, 09-12, templates, scripts) | PENDING |
| builder-2 | Create user-intent-interactive-loop skill | PENDING |
| builder-3 | Create coordinating-loop skill | PENDING |
| builder-4 | Replace planning-with-files with proper version | PENDING |

## Key Decisions (LOCKED — see findings.md for full quotes)

| Decision | Locked Answer |
|----------|---------------|
| D1: Spec policy | Align with agentskills.io spec. metadata + allowed-tools useful optionals. NO compatibility |
| D2: Session scope | Incremental waves with complete workflow nodes |
| T1: Coverage | Coverage wins over concision |
| T3: Flexibility | NOT "flexibility" — "adaptive with constraints" |
| T4: Gates | Programmatic measurable gates, ralph-loop compatible |
| T5: Platform | UNIVERSAL — Agent not Claude, AGENTS.md not CLAUDE.md |
| Terminology | "Claude" → "Agent", "CLAUDE.md" → "AGENTS.md" everywhere |
| Coordinator role | PLAN + DELEGATE, NEVER execute directly on skill files |

## Resource Map

```
.skills-lab/
├── .archive/2026-04-03-pre-rebuild/   # NEVER delete until new pack functional
├── refactoring-skills/
│   ├── use-authoring-skills/          # THE SKILL — being completed
│   │   ├── SKILL.md                   # ✅ 337 lines
│   │   ├── references/
│   │   │   ├── 01-skill-anatomy.md    # ✅
│   │   │   ├── 02-frontmatter-standard.md  # ✅
│   │   │   ├── 03-skill-patterns.md   # ✅
│   │   │   ├── 04-tdd-workflow.md     # ✅
│   │   │   ├── 05-skill-quality-matrix.md  # ✅
│   │   │   ├── 06-cross-platform-activation.md  # ❌ builder-1
│   │   │   ├── 07-iterative-refinement.md  # ✅
│   │   │   ├── 08-conflict-detection.md    # ✅
│   │   │   ├── 09-script-authoring.md       # ❌ builder-1
│   │   │   ├── 10-eval-lifecycle.md         # ❌ builder-1
│   │   │   ├── 11-description-optimization.md  # ❌ builder-1
│   │   │   └── 12-anti-deception.md         # ❌ builder-1
│   │   ├── templates/                 # ❌ builder-1
│   │   └── scripts/                   # ❌ builder-1
│   ├── users-prompting-workspace-resources/  # Source materials
│   └── workspace/                      # Builder outputs
├── task_plan.md                       # THIS FILE
├── findings.md                        # Locked decisions
├── progress.md                        # Action log
├── meta-builder-architecture-2026-04-03.md  # Architecture spec
└── .skills-lab/refactoring-skills/workspace/compact-history/
```

## Blockers

- None — all source materials available, architecture locked, ready to delegate

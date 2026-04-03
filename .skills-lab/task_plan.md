# Task Plan: Meta-Builder Long-Haul — Batch 2 (Fixes + Meta-Builder + Integration)

**Goal:** Complete the meta-builder harness foundation: fix Milestone 1 defects, create the meta-builder parent orchestrator skill, and write the cross-package bridging spec.

**Status:** IN-PROGRESS — Batch 2 launching

## Milestone Scope (Batch 2)

This batch covers:
1. **Fix Milestone 1 defects** — planning-with-files duplicates, missing scripts, missing cross-refs
2. **Meta-builder parent skill** — orchestrator routing between GROUP 1 and GROUP 2, consuming OpenCode concepts
3. **Cross-package bridging spec** — how all skill packs connect, share state, and stack

## Phases

- [x] 0. Context scouting, audit, recovery (ses_2b05 → ses_2b07)
- [x] 1. SKILL.md body rewritten (337 lines, locked decisions encoded)
- [x] 2. Terminology cleaned (HiveMind/Claude → Agent/AGENTS.md)
- [x] 3. Meta-builder architecture spec written
- [x] 4. **use-authoring-skills completion** — ref files 06, 09-12, templates, scripts (builder-1)
- [x] 5. **user-intent-interactive-loop** — GROUP 1 skill #1 (builder-2)
- [x] 6. **coordinating-loop** — GROUP 1 skill #2 (builder-3)
- [x] 7. **planning-with-files replacement** — GROUP 1 skill #3 (builder-4)
- [x] 8. Milestone 1 audit — identified 6 issues (1 critical, 3 medium, 2 low)
- [ ] 9. **Fix planning-with-files duplicates** — Error Discipline, Read vs Write, 5-Question appear twice
- [ ] 10. **Add scripts/ to user-intent-interactive-loop** — Essentials E3 portable toolkits
- [ ] 11. **Add GROUP 1↔2 cross-refs to use-authoring-skills**
- [ ] 12. **Create meta-builder parent skill** — orchestrator, OpenCode concepts, stacking rules
- [ ] 13. **Cross-package bridging spec** — integration, shared state, HiveMind v3 alignment
- [ ] 14. Validation gate — validate-skill.sh, check-overlaps.sh, real scenarios
- [ ] 15. Commit all, update architecture spec

## Active Builder Agents (Batch 2)

| Agent | Task | Status |
|-------|------|--------|
| fixer | Fix duplicates, add scripts, add cross-refs | PENDING |
| meta-builder | Create parent orchestrator skill | PENDING |
| integration-spec | Cross-package bridging spec | PENDING |

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

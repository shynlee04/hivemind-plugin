# Task Plan: Meta-Builder Phase 1 — Complete Rebuild of All 5 Skill Packs

**Goal:** Rebuild all 5 skill packs from scratch addressing ALL 56 flaws found in failure analysis + user's additional enforcement requirements.

**Status:** ✅ PHASE 1 REBUILD COMPLETE — All 5 packs rebuilt, validated, committed

## Phase 1 Scope: Complete Rebuild

This is NOT a patch job. Every skill pack is being rebuilt to address:
1. All 56 flaws identified by 5 parallel investigators
2. User's additional enforcement requirements (see below)
3. agentskills.io specification compliance

## User's Additional Requirements (LOCKED)

### A. use-authoring-skills Must Stand Alone
- Must be sufficient for skill creation, doctoring, auditing, refactoring WITHOUT requiring external skills
- Child domain skills (agent, tool, command, workflow authoring) are FUTURE extensions
- When child skills are mentioned, parent loads Phase 1 first

### B. Hierarchical Loading with Enforcement
- Entry → coupled background set (hard requirements) → hierarchy order → prerequisites → coverage
- ALL enforced deterministically by programs as hooks, force execution
- Must be role model and universal — if existing variants, facilitate versions

### C. Gate Keeping — Granular, Incremental, Programmatic
- Measurable and clear sustained metrics
- NOT anticipating "intelligence of AI agent" — must enforce mechanically:
  - First number of first actions = not allow some actions
  - Counting lines of content attachment
  - Limiting steps — not more than N tools
  - Questions must be asked (max 3 at a time)
  - And so on

### D. Interactive Loop with Users
- Ask no more than 3 questions at a time
- MUST use OpenCode question tool, NOT message output
- Must load these 3 skills:
  1. `skill({ name: "opencode-platform-reference" })` — SDK docs
  2. `skill({ name: "repomix-exploration-guide" })` — cheat-sheet
  3. `skill({ name: "opencode-non-interactive-shell" })` — shell strategy

### E. agentskills.io Specification
- Use `metadata` and `allowed-tools` fields per spec
- Prepare for later programmatic chaining, enforcing, tool use

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
- [x] 9. **Fix planning-with-files duplicates** — Error Discipline, Read vs Write, 5-Question appear twice
- [x] 10. **Add scripts/ to user-intent-interactive-loop** — Essentials E3 portable toolkits
- [x] 11. **Add GROUP 1↔2 cross-refs to use-authoring-skills**
- [x] 12. **Create meta-builder parent skill** — orchestrator, OpenCode concepts, stacking rules
- [x] 13. **Cross-package bridging spec** — integration, shared state, HiveMind v3 alignment
- [x] 14. Failure analysis — 56 flaws across 5 packs, master synthesis (commit d10f5752)
- [x] 15. **PHASE 1 REBUILD** — All 5 packs rebuilt addressing ALL 56 flaws + user requirements
- [x] 16. Validation gate — validate-skill.sh all 5 packs pass 11/11, stale .opencode/skills/ cleaned
- [x] 17. Commit all, update architecture spec (commit 00b40132)

## Active Builder Agents (Phase 1 Rebuild)

| Agent | Task | Status |
|-------|------|--------|
| builder-1 | Rebuild use-authoring-skills — standalone sufficiency, gate enforcement, hierarchical loading | PENDING |
| builder-2 | Rebuild meta-builder — concrete workflows, fix routing, trim noise, first-action directives | PENDING |
| builder-3 | Rebuild coordinating-loop — worked examples, fix flowchart, ship init script, platform adaptation | PENDING |
| builder-4 | Rebuild planning-with-files — clean templates, fix scripts, ship hooks, integration protocol | PENDING |
| builder-5 | Rebuild user-intent-interactive-loop — skill-specific probing, ≤3 questions via OpenCode tool, loop termination | PENDING |

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

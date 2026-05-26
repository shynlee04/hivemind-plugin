# Task Plan: hm-brainstorm

## Goal
Create the `hm-brainstorm` skill at `.opencode/skills/hm-brainstorm/` — a coordinator-level skill that bridges vague user intent to formal requirements through structured questioning, assumption detection, and requirements brief generation.

## Pattern
**P2 — Domain Pattern** (200-400 lines SKILL.md, 3 reference files)

## RICH-1: Third-Party Source Evidence

| # | Source | Discovery | Reviewed | Decision |
|---|--------|-----------|----------|----------|
| 1 | `obra/superpowers@brainstorming` | skills.sh / GitHub | SKILL.md (full crawl): 9-step process, hard gate, one-question-at-a-time, spec self-review, transition to writing-plans | ADOPT: sequential questioning, hard-gate-before-code, one-question-at-a-time, approach comparisons. ADAPT: remove superpowers-specific paths (docs/superpowers/specs/), remove visual companion. DEFER: visual companion feature. |
| 2 | `ratacat/claude-skills@brainstorming` | skills.sh / GitHub | SKILL.md (full crawl): 4-phase process (assess clarity → understand → explore → capture), question techniques (multiple choice, broad-to-narrow, validate assumptions), YAGNI, anti-patterns table, design doc template | ADOPT: YAGNI principles, anti-patterns table, question techniques, handoff options. ADAPT: generic design doc template → hm-specific requirements brief. DEFER: Phase 0 clarity assessment (covered by hm-user-intent-interactive-loop). |
| 3 | `Jamie-BitFlight/brainstorming-skill` | smithery.ai | Description (11 ideation patterns: perspective multiplication, constraint variation, inversion, analogical transfer, SCAMPER, scenario exploration, constraint-based ideation, chain-of-thought, combination exploration, assumption challenge) | ADOPT: assumption challenge technique, constraint variation. ADAPT: integrate into question-patterns.md reference. DEFER: creative ideation patterns (perspective multiplication, inversion, SCAMPER — these are for creative problem-solving, not requirements surfacing). |

## RICH-2: Transform-Improve-Adopt
- **Pattern 1 (adopt):** Sequential structured questioning from obra/superpowers — one question at a time, hard gate before code
- **Pattern 2 (adapt):** YAGNI + anti-patterns from ratacat/claude-skills — adapted for hm-* lineage
- **Pattern 3 (reject):** Creative ideation techniques (perspective multiplication, inversion) from Jamie-BitFlight — these are for creative problem-solving, not requirements surfacing

## RICH-3: Horizontal Integration
- **Adjacent skills:** hm-spec-driven-authoring (downstream consumer), hm-requirements-analysis (downstream), hm-deep-research (route-to), hm-detective (route-to)
- **Consumed by:** hm-coordinating-loop, hm-user-intent-interactive-loop
- **Agents:** Front-facing orchestrator agents (hivefiver-orchestrator, orchestrator)
- **Commands:** None directly — triggered by user phrases
- **Tools:** prompt-skim, prompt-analyze (optional), Read, Write

## RICH-4: Routing Integration
- **Sibling skills:** hm-deep-research, hm-detective, hm-synthesis (all in research/how-to-process lineage)
- **Parent:** hm-user-intent-interactive-loop (coordinator loads this as a process skill)
- **Child:** hm-spec-driven-authoring (handoff after requirements brief)
- **Sibling routing:** hm-deep-research (when more investigation needed), hm-detective (when codebase exploration needed)
- **Refuse boundary:** Does NOT design solutions — only clarifies WHAT

## RICH-5: Bundled Resources
- `references/question-patterns.md` — structured questioning techniques
- `references/assumption-detection.md` — detecting unstated assumptions
- `references/handoff-template.md` — requirements brief template for handoff to hm-spec-driven-authoring

## RICH-6: Independence Audit
- No GSD/BMAD/OMO framework assumptions — uses adapter notes
- No local path assumptions — uses relative paths within skill package
- Language-agnostic — no language-specific commands

## RICH-7: Gap Documentation
- Missing: hm-requirements-analysis (doesn't exist yet — documented in routing)
- Not missing: hm-spec-driven-authoring exists at `.opencode/skills/hm-spec-driven-authoring/`
- Not missing: hm-deep-research exists at `.opencode/skills/hm-deep-research/`
- Missing: hm-detective — exists but routing is documented

## RICH-8: Scoring (post-creation)
- Will run skill-judge after creation for scoring

## Progress
- [ ] STEP 1: Create task_plan.md → DONE
- [ ] STEP 2: Create SKILL.md with YAML frontmatter
- [ ] STEP 3: Write SKILL.md body
- [ ] STEP 4: Create references/question-patterns.md
- [ ] STEP 5: Create references/assumption-detection.md
- [ ] STEP 6: Create references/handoff-template.md
- [ ] STEP 7: Run validate-skill.sh
- [ ] STEP 8: Run check-overlaps.sh
- [ ] STEP 9: Final validate-gate.sh

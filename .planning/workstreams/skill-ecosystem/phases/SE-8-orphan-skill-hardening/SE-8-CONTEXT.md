---
phase: SE-8
workstream: skill-ecosystem
status: PLANNED
depends_on:
  - SE-2
blocks:
  - SE-9 (final verification requires all skills hardened)
created: 2026-04-29
---

# SE-8: Orphan Skill Hardening — Context

## Phase Goal
Harden the 25 skills not covered by any forward SE phase (SE-1 through SE-7). These skills exist on disk but have never been through a dedicated RICH audit or cross-reference integrity pass. This phase runs in the same wave as SE-3/SE-3.5 as a parallel hardening track.

## Starting State
- 25 active skills exist on disk without dedicated RICH audit coverage
- SE-2 planning-persistence reference fixes may or may not be complete (verify during this phase)
- `donotusethis-hm-planning-with-files` may still be referenced by active skills
- `opencode-config-workflow` exists but will be superseded by SE-6 deliverable (`hf-config-workflow`)

## Deliverables
- RICH-1 through RICH-8 audit for all 25 orphan skills
- Cross-reference integrity verification for all 25 skills
- Trigger description tuning for each skill
- Dead reference cleanup (especially `donotusethis-hm-planning-with-files` remnants)
- Verify `opencode-config-workflow` status relative to SE-6 deliverable

## Scope Breakdown

### hm-* Operational Skills (15)
| Skill | Purpose |
|-------|---------|
| `hm-completion-looping` | Completion detection, regression guardrails |
| `hm-coordinating-loop` | Multi-agent dispatch with validation gates |
| `hm-debug` | Systematic debugging with persistent state |
| `hm-omo-reference` | oh-my-openagent architecture reference |
| `hm-opencode-non-interactive-shell` | Shell safety for headless agents |
| `hm-opencode-platform-reference` | OpenCode platform docs |
| `hm-opencode-project-audit` | Project ecosystem audit |
| `hm-phase-execution` | Wave-based phase execution with checkpoint recovery |
| `hm-phase-loop` | Iterative phase loop management |
| `hm-planning-persistence` | Cross-session state persistence (verify SE-2 fixes) |
| `hm-refactor` | Surgical vs structural refactoring decision framework |
| `hm-spec-driven-authoring` | Spec-locking and requirement extraction |
| `hm-subagent-delegation-patterns` | Subagent dispatch and checkpoint protocols |
| `hm-test-driven-execution` | TDD RED/GREEN/REFACTOR cycles |
| `hm-user-intent-interactive-loop` | Interactive intent probing |

### hf-* Meta-Builder Skills (10)
| Skill | Purpose |
|-------|---------|
| `hf-agent-composition` | Agent XML markup and composition |
| `hf-agents-and-subagents-dev` | Agent architecture and dispatch |
| `hf-agents-md-sync` | AGENTS.md drift detection and repair |
| `hf-command-dev` | Command structure and shell safety |
| `hf-command-parser` | Propositional command argument parsing |
| `hf-context-absorb` | Multi-wave context absorption protocol |
| `hf-custom-tools-dev` | Plugin SDK and custom tool architecture |
| `hf-delegation-gates` | Pre-delegation authorization gates |
| `hf-skill-synthesis` | Skill pattern classification and scaffolding |
| `hf-use-authoring-skills` | Skill authoring quality and TDD |

### stack-* Reference Skills (6)
| Skill | Purpose |
|-------|---------|
| `stack-bun-pty` | bun-pty pseudo-terminal integration |
| `stack-json-render` | @json-render/react generative UI |
| `stack-nextjs` | Next.js 16.x App Router patterns |
| `stack-opencode` | OpenCode SDK and plugin internals |
| `stack-vitest` | Vitest testing framework reference |
| `stack-zod` | Zod v4 schema validation |

### Unprefixed Skills (1)
| Skill | Purpose |
|-------|---------|
| `opencode-config-workflow` | Will be replaced by SE-6 (`hf-config-workflow`) |

## Acceptance Criteria
- [ ] All 25 skills pass RICH-1 through RICH-8 audit
- [ ] Zero broken cross-references across all 25 skills
- [ ] Zero remaining references to `donotusethis-hm-planning-with-files`
- [ ] Trigger descriptions tuned for accuracy and discoverability
- [ ] `hm-planning-persistence` verified against SE-2 deliverables
- [ ] `opencode-config-workflow` status documented (superseded or retained)

## Known Risks
- Large scope (25 skills) — may need wave-based execution to manage context budget
- `hm-planning-persistence` audit depends on SE-2 partial completion being resolved first
- `opencode-config-workflow` overlap with SE-6 — coordinate to avoid double-work
- Dead references may cascade; fixing one may reveal others

## Skills Needed
- All 25 orphan skills listed above (audit targets)
- `hm-deep-research` / `hm-detective` — for investigating reference chains
- `hm-synthesis` — for compressing audit findings into actionable reports

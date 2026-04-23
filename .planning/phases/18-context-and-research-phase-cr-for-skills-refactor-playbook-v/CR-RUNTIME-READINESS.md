# CR-RUNTIME-READINESS.md — Runtime-Integration Readiness Map

**Deliverable:** CR-06
**Date:** 2026-04-23
**Method:** Per-skill assessment of soft→hard migration feasibility per Playbook I.3.1 stage 3

---

## Migration Model (from Playbook I.3.1)

| Stage | Format | Description |
|-------|--------|-------------|
| 1 (current) | .md files in skills-lab | Authoring + live testing via symlinks |
| 2 (validated) | Graded .md with evals | Skill-judge grade ≥ B, stacked evals pass |
| 3 (target) | TS module with Zod schema | Typed config + SDK hooks, no .md editing |

## Readiness Assessment Table

| # | Skill | Current Grade | Eval Coverage | Script Count | Zod Feasibility | SDK Surface | Migration Blocker | Readiness |
|---|-------|--------------|--------------|-------------|-----------------|-------------|-------------------|-----------|
| 1 | `agent-authorization` | — | 0/0 | 2 | COMPLEX | Permission rule schema | No evals; body is procedural | BLOCKED |
| 2 | `agents-and-subagents-dev` | D | 0/0 | 0 | COMPLEX | Agent definition schema | Grade < B; no evals | BLOCKED |
| 3 | `agents-md-sync` | — | 0/0 | 0 | PARTIAL | Sync protocol schema | No evals; minimal body | BLOCKED |
| 4 | `command-dev` | D | 0/0 | 0 | COMPLEX | Command definition schema | Grade < B; no evals | BLOCKED |
| 5 | `command-parser` | C | 0/0 | 0 | COMPLEX | Parser rule schema | No evals; conditional logic | BLOCKED |
| 6 | `coordinating-loop` | A | 2/2 | 8 | PARTIAL | Pipeline stage config | Grade A; has evals | PARTIAL |
| 7 | `custom-tools-dev` | D | 0/0 | 0 | COMPLEX | Tool definition schema | Grade < B; no evals | BLOCKED |
| 8 | `gsd-agent-composition` | — | 1/1 | 2 | COMPLEX | Composition rule schema | Re-author needed per I.6 | BLOCKED |
| 9 | `harness-audit` | — | 0/0 | 2 | PARTIAL | Audit checklist schema | No evals; body is checklist | BLOCKED |
| 10 | `harness-delegation-inspection` | — | 0/0 | 0 | COMPLEX | Inspection protocol schema | Split planned; no evals | BLOCKED |
| 11 | `hf-context-absorb` | — | 0/0 | 0 | PARTIAL | Context merge schema | No evals; swarm protocol | BLOCKED |
| 12 | `hm-deep-research` | C+ | 0/0 | 0 | NOT YET | Research pipeline config | Body IS the product (research guide) | NOT YET |
| 13 | `hm-detective` | — | 0/0 | 0 | NOT YET | Reading mode config | Body IS the product (reading guide) | NOT YET |
| 14 | `hm-synthesis` | — | 0/0 | 0 | NOT YET | Compression tier config | Body IS the product (synthesis guide) | NOT YET |
| 15 | `meta-builder` | B+ | 2/2 | 6 | PARTIAL | Meta-concept factory schema | Grade B+; has evals | PARTIAL |
| 16 | `oh-my-openagent-reference` | D | 0/0 | 0 | NOT YET | Reference loading protocol | Body IS reference content | NOT YET |
| 17 | `opencode-non-interactive-shell` | C | 0/0 | 0 | PARTIAL | Shell safety rule schema | No evals; rules are prose | BLOCKED |
| 18 | `opencode-platform-reference` | C+ | 0/0 | 0 | NOT YET | Reference loading protocol | 20 refs; content is the value | NOT YET |
| 19 | `phase-loop` | D | 0/0 | 0 | COMPLEX | Loop stage config | Grade < B; no evals | BLOCKED |
| 20 | `planning-with-files` | PASS | 0/0 | 0 | PARTIAL | 3-file memory schema | No evals; procedural body | BLOCKED |
| 21 | `session-context-manager` | FAIL | 0/0 | 1 | COMPLEX | Session state schema | Merge planned; grade FAIL | BLOCKED |
| 22 | `skill-synthesis` | — | 2/2 | 7 | PARTIAL | Pattern extraction schema | Has evals; scripts are complex | PARTIAL |
| 23 | `use-authoring-skills` | B | 2/2 | 8 | PARTIAL | Authoring guide schema | Has evals; grade B | PARTIAL |
| 24 | `user-intent-interactive-loop` | A | 2/2 | 5 | COMPLEX | Interactive loop config | Grade A; has evals | PARTIAL |

## Readiness Categories

| Category | Count | Skills |
|----------|-------|--------|
| READY (no blockers) | 0 | — |
| PARTIAL (1-2 blockers) | 6 | coordinating-loop, meta-builder, skill-synthesis, use-authoring-skills, user-intent-interactive-loop |
| BLOCKED (3+ blockers) | 14 | agent-authorization, agents-and-subagents-dev, agents-md-sync, command-dev, command-parser, custom-tools-dev, gsd-agent-composition, harness-audit, harness-delegation-inspection, hf-context-absorb, opencode-non-interactive-shell, phase-loop, planning-with-files, session-context-manager |
| NOT YET EXPRESSIBLE | 4 | hm-deep-research, hm-detective, hm-synthesis, oh-my-openagent-reference, opencode-platform-reference |

## Skills NOT Expressible in Zod/SDK Today

These skills have `.md` bodies that ARE the product — they are reference guides, research playbooks, or reading-mode instructions. They cannot be mechanically translated to typed config.

| Skill | Why Not Expressible | Alternative Migration Strategy |
|-------|---------------------|-------------------------------|
| `hm-deep-research` | Body is a research methodology guide with tutorial-style content | Runtime resource loading: ship as `.md` resource file loaded by research orchestrator |
| `hm-detective` | Body defines 3 reading modes (skim/scan/deep) with heuristics | Runtime resource loading: ship as config-driven reading mode selector |
| `hm-synthesis` | Body describes compression tiers and cross-dep analysis | Runtime resource loading: ship as synthesis strategy library |
| `oh-my-openagent-reference` | Body is reference documentation for OMO architecture | Runtime resource loading: ship as `.md` reference, loaded on-demand |
| `opencode-platform-reference` | Body is platform capability reference (20 sub-references) | Runtime resource loading: ship as reference tree, lazy-loaded |

## Migration Priority Order

1. **Tier 1 (Phase 20-21):** G-A/G-B cluster skills with highest refactor priority
   - coordinating-loop → hm-coordinating-loop (PARTIAL, has evals)
   - user-intent-interactive-loop → hm-user-intent-interactive-loop (PARTIAL, has evals)
   - phase-loop → hm-phase-loop (BLOCKED, needs evals + body rewrite)

2. **Tier 2 (Phase 21-22):** Skills with evals already
   - meta-builder → hm-meta-builder (PARTIAL)
   - skill-synthesis → hm-skill-synthesis (PARTIAL)
   - use-authoring-skills → hivefiver-use-authoring-skills (PARTIAL)

3. **Tier 3 (Phase 22-23):** Skills with scripts (automation is testable)
   - agent-authorization → hivefiver-delegation-gates (BLOCKED, has scripts)
   - harness-audit → hm-opencode-project-audit (BLOCKED, has scripts)
   - session-context-manager → merged (BLOCKED, has script)

4. **Tier 4 (Phase 23+):** Reference skills (lowest priority — content is the value)
   - hm-deep-research, hm-detective, hm-synthesis, oh-my-openagent-reference, opencode-platform-reference
   - Strategy: Runtime resource loading, not config schema migration

## Missing Skills Migration Assessment

| New Skill | Cluster | Migration Strategy | Notes |
|-----------|---------|-------------------|-------|
| `hm-completion-looping` | G-A | Author Zod-first from creation | Design with typed config from inception |
| `hm-spec-driven-authoring` | G-B | Author Zod-first from creation | Include stacked evals from inception |
| `hm-test-driven-execution` | G-B | Author Zod-first from creation | Include stacked evals from inception |
| `hm-eval-driven-development` | G-B | Author Zod-first from creation | Build on skill-synthesis eval patterns |
| `hm-debug` | G-D | Author Zod-first from creation | Design checkpoint state machine as typed config |
| `hm-refactor` | G-D | Author Zod-first from creation | Taxonomy as enum config |
| `hm-phase-execution` | G-D | Author Zod-first from creation | Wave config as typed pipeline |
| `hm-research-chain` | G-C | Author Zod-first from creation | Chain steps as ordered config |

---

*Deliverable: CR-06*
*Date: 2026-04-23*

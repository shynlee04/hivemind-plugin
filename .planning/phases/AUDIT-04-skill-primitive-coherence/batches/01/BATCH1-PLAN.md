# BATCH 1 — Session Start Context (3 skills + 3 archives)

**Date:** 2026-06-08
**Worktree:** `.worktree/` on branch `audit-04-batch1` (from HEAD 05f612b9, includes prior 4 cycle commits)
**Goal:** Establish the 3 skills that load at session start (per user direction "no more than 3 per load when session start"), and archive the 3 old skills they replace. Tech-agnostic + stack-agnostic, drop `l0/l1/l2/l3` hierarchy, full bundle per gold standard, show-don't-tell with named custom tools.

## The 3 skills (load at session start)

| # | Skill | Pattern | Role | Replaces |
|---|---|---|---|---|
| 1 | `hivemind-power-on` (refresh) | 1 Mindset | Governance core: discover sessions, query hierarchy, decide resume vs stack vs create | (no rename — already canonical) |
| 2 | `hm-coord-router` (NEW) | 2 Navigation | Orchestrating focus: classify user intent → route to command → pair with agent | `hm-l2-lineage-router` + `hf-skill-router` (merged) |
| 3 | `hm-spec-authoring` (NEW) | 3 Process | Specialist: transform vague requirements into falsifiable spec | `hm-l2-spec-driven-authoring` (renamed + cleaned) |

## The 3 archives (git mv to `assets/.archive/dev-tooling/skills/`)

| Old skill | Why archive |
|---|---|
| `hm-l2-lineage-router` | `l2-` prefix forbidden (F01), domain absorbed by `hm-coord-router` |
| `hf-skill-router` | Domain absorbed by `hm-coord-router` (cross-lineage consolidation) |
| `hm-l2-spec-driven-authoring` | `l2-` prefix forbidden (F01), replaced by `hm-spec-authoring` |

## Per-skill bundle (gold standard: SKILL.md + references/ + templates/ + workflows/ + scripts/ + evals/ + metrics/)

### Skill 1: `hivemind-power-on` (refresh)
- SKILL.md (existing 157 lines, clean F03 violation in frontmatter `consumed-by` field)
- references/ (existing 8 files, keep)
- scripts/ (NEW: `validate-state.sh`, `validate-resume.sh`)
- templates/ (NEW: `agent-work-contract-template.md`, `session-resume-pointer-template.md`)
- workflows/ (NEW: `session-start-checklist.md`, `delegate-with-context.md`)
- evals/ (NEW: `evals.json` with 5 test prompts)
- metrics/ (NEW: `gate-scorecard.md`)

### Skill 2: `hm-coord-router` (NEW)
- SKILL.md
- references/intent-classification-tree.md
- references/agent-routing-table.md
- references/command-routing-table.md
- references/delegation-packet-schema.md
- templates/delegation-packet-template.md
- templates/intent-summary-template.md
- workflows/route-and-delegate-workflow.md
- workflows/escalation-workflow.md
- scripts/match-agent-by-intent.sh
- evals/evals.json
- metrics/gate-scorecard.md

### Skill 3: `hm-spec-authoring` (NEW)
- SKILL.md
- references/ears-notation.md
- references/acceptance-criteria-patterns.md
- references/spec-vs-design-distinction.md
- references/source-synthesis.md (carried from old)
- references/spec-to-req-mapping.md (carried from old)
- references/acceptance-test-patterns.md (carried from old)
- templates/SPEC-template.md
- templates/requirement-traceability-matrix.md (carried from old)
- workflows/spec-lock-workflow.md (carried from old)
- scripts/validate-spec-falsifiability.sh (NEW)
- scripts/validate-rich-package.sh (carried from old)
- scripts/validate-skill.sh (carried from old)
- evals/evals.json
- metrics/gate-scorecard.md

## Cross-ref updates (4-phase strategy)

After all 3 new skills exist:
- **Phase A** (agents/agent-instructions): grep for old names, replace with new
- **Phase B** (skills): same
- **Phase C** (commands): same
- **Phase D** (workflows/references/templates): same

## Commit strategy (atomic per logical step)

1. `archive(batch1): move hm-l2-lineage-router, hf-skill-router, hm-l2-spec-driven-authoring to .archive/dev-tooling/skills/`
2. `feat(skill): refresh hivemind-power-on — clean F03, add full bundle (scripts/templates/workflows/evals/metrics)`
3. `feat(skill): add hm-coord-router — orchestrating focus (Pattern 2 Navigation, full bundle)`
4. `feat(skill): add hm-spec-authoring — specialist spec-driven (Pattern 3 Process, full bundle)`
5. `chore(cross-ref): update agents/commands/workflows/references/templates to reference new skill names`
6. `chore(validate): run validate-name.sh, npm typecheck, npm test for BATCH 1`

## Validation

- `assets/.hivemind-config/validate-name.sh <new_name> skill` → expect exit 0 for all 3
- `assets/.hivemind-config/validate-name.sh <archived_name> skill` → expect exit 1 (archive is intentional, not violation)
- `npm run typecheck` from repo root → expect 0 errors
- `npm test` (focused) → expect green

## Out of scope (deferred to BATCH 2+)

- All other 33 hm-l2-* + hm-l3-* skills (not in BATCH 1)
- hf-* meta-builder skills (separate lineage work)
- 3 gate-* + 6 stack-* skills (ARCHIVE-DEV-TOOLING)
- Build-orchestrator-handbook rewrite (hm-l2-build.md)
- src/** + tests/** gsd-* references (out of scope per src/AGENTS.md)
- `.hivemind/` runtime state (deep module, not primitive)

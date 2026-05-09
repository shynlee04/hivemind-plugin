---
feature: agent-system-audit-refactor
category: master-state
updated: 2026-05-10
---

# STATE — Agent System Baseline

## Current Inventory

| Category | Count | Details |
|----------|-------|---------|
| hm-* agents | 47 | 1 L0, 1 L1, 45 L2 (incl. conductor, build, general) |
| hf-* agents | 11 | 1 L0, 1 L1, 9 L2 |
| **Total agents** | **58** | |
| hm-* skills | 35 | L2: 20, L3: 15 |
| hf-* skills | 13 | All L2 |
| gate-* skills | 3 | INTERNAL only |
| stack-* skills | 6 | REFERENCE only |

## Permission Baseline

| Permission Pattern | Agents | Issue |
|-------------------|--------|-------|
| `deny` on task, delegate-task, delegation-status, session-journal-export, prompt-skim, prompt-analyze, session-patch, skill:* | ~48 L2 agents | ✓ Task: Fix deny→ask |
| `deny` on session-patch | L0 agents | ✓ Keep for now |
| Missing permission entries | 12 agents | ✓ Fill defaults |
| `tools` (deprecated) used | ? | ✓ Audit needed |
| `maxSteps` (deprecated) used | ? | ✓ Audit needed |

## Naming Issues (Verified)

- hm-* lineage conceptually STRICT but no mechanical enforcement
- hf-* lineage conceptually FLEXIBLE (can cross-load hm skills) but no mechanical enforcement
- l0/l1/l2/l3 in names don't correspond to any OpenCode-level enforcement
- `depth`, `lineage`, `domain`, `skills`, `instruction` are custom fields → absorbed into `options`, no runtime effect
- 21 skills have name/frontmatter `layer` mismatches

## OpenCode SDK Ground Truth (Verified 2026-05-10)

Source: `anomalyco/opencode`, `packages/opencode/src/config/agent.ts`

- `KNOWN_KEYS`: name, model, variant, prompt, description, temperature, top_p, mode, hidden, color, steps, maxSteps, options, permission, disable, tools
- `tools` → **DEPRECATED**, auto-migrated to `permission`
- `maxSteps` → **DEPRECATED**, use `steps`
- Custom keys → absorbed into `options`
- Permission values: `allow` | `ask` | `deny`
- Native permission keys: read, edit, glob, grep, list, bash, task, external_directory, todowrite, question, webfetch, websearch, lsp, doom_loop, skill

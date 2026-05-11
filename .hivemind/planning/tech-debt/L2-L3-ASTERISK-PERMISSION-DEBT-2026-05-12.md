# L2/L3 Asterisk Permission Debt Inventory

**Date:** 2026-05-12
**Author:** hf-l0-orchestrator
**Status:** TEMPORARY RESOLUTION — Debt Documented
**Severity:** MEDIUM (development hiccups at delegation depth 3+)

---

## Rationale

L2 and L3 agents across both hm-* and hf-* lineages are typically delegated to the
3rd depth of the delegation hierarchy. At this depth, the `'*': ask` permission
on `bash:`, `task:`, `skill:`, and `read:` blocks upstream authorization from reaching
the user — causing silent failures, permission denials, and development hiccups.

**Temporary fix:** All `'*': ask` entries in L2 agent permission blocks are changed to
`'*': allow`. The specific sub-entries (e.g., `git *: allow`, `node *: allow`,
`hm-l2-*: allow`) are preserved for documentation of design intent.

**Planned resolution:** Each asterisk group must be replaced with a complete,
granular allow-list of specific commands/agents/skills per agent role. This
document inventories exactly what is temporarily opened and what was intended.

---

## Inventory: All `'*': ask` → `'*': allow` Changes

### hm-l2-analyst
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-architect
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-assessor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-auditor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-brainstormer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-build
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: allow` was already unconditional (no asterisk group). |

### hm-l2-conductor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `read:` | YES | `'*.md': allow`, `'*.json': allow` |
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-connector
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-context-mapper
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-context-purifier
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-critic
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow`, `npm *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-curator
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-debugger
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | `hm-l2-investigator: allow` |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-ecologist
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-executor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | `hm-l2-reviewer: allow` |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: '*': allow` was already set. `edit: allow`, `write: allow` already set. |

### hm-l2-finisher
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-general
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: allow` was already unconditional. |

### hm-l2-guardian
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-integrator
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-intent-loop
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `read:` | YES | `'*.md': allow`, `'*.json': allow`, `'*.ts': allow`, `'*.yaml': allow`, `'*.yml': allow` |
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-investigator
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-mentor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-meta-synthesis
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow`, `hf-l2-*: allow` |

### hm-l2-operator
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-optimizer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-persistor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-phase-guardian
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-planner
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | `hm-l2-architect: allow`, `hm-l2-strategist: allow` |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-prompt-analyzer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* No `bash:` asterisk group in this agent. Has `bash: allow` elsewhere? No, no bash at all. |

### hm-l2-prompt-repackager
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* No `bash:` section at all. |

### hm-l2-prompt-skimmer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: allow` already unconditional. |

### hm-l2-researcher
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | `hm-l2-synthesizer: allow` |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-reviewer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | `hm-l2-validator: allow` |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-risk-assessor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* No `bash:` section in this agent. |

### hm-l2-router
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-scout
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-spec-verifier
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `read: '*': allow` was already set. |

### hm-l2-strategist
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-synthesizer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-technician
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-test-router
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: allow` already unconditional. |

### hm-l2-validator
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hm-l2-writer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

---

## hf-l2 Agents

### hf-l2-agent-builder
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-auditor
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-command-builder
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-meta-builder
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-prompter
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `edit: allow`, `write: allow`, `webfetch: allow`, `todowrite: allow` already set. |

### hf-l2-refactorer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-skill-builder
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |
| *Note:* `bash: '*': allow` already set. |

### hf-l2-synthesizer
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

### hf-l2-tool-builder
| Permission Group | Changed | Original Sub-Entries Under `'*': ask` |
|-----------------|---------|--------------------------------------|
| `bash:` | YES | `git *: allow`, `node *: allow`, `npx *: allow` |
| `task:` | YES | (none) |
| `skill:` | YES | `hf-l2-*: allow`, `hm-l2-*: allow`, `hm-l3-*: allow`, `gate-l3-*: allow`, `stack-l3-*: allow` |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total L2 agents modified | 50 |
| hm-l2 agents | 41 |
| hf-l2 agents | 9 |
| L3 agents (hm-l3, hf-l3) | 0 (none exist) |
| `bash: '*': ask` → `allow` | ~38 agents (12 already had allow or no bash section) |
| `task: '*': ask` → `allow` | ~50 agents |
| `skill: '*': ask` → `allow` | ~50 agents |
| `read: '*': ask` → `allow` | 2 agents (hm-l2-conductor, hm-l2-intent-loop) |

## Design Intent (for planned re-resolution)

Each permission group should eventually be replaced with a specific allow-list
appropriate to each agent's role. The current sub-entries document this intent:

1. **`bash:`** — Should allow specific command patterns: `git *`, `node *`, `npx *`,
   `npm *`, and role-specific commands (e.g., `tsc *`, `vitest *`, `curl *`).
   No agent should need unconditional bash access.

2. **`task:`** — Should allow delegation to specific downstream agents relevant
   to the agent's domain. E.g., hm-l2-planner should allow `hm-l2-architect`,
   `hm-l2-strategist`; terminal agents should have no task access.

3. **`skill:`** — Should allow loading of lineage-specific skills:
   - hm-*: `hm-l2-*`, `hm-l3-*`, `gate-l3-*`, `stack-l3-*`
   - hf-*: `hf-l2-*`, `hm-l2-*`, `hm-l3-*`, `gate-l3-*`, `stack-l3-*`

4. **`read:`** — Most agents should keep `read: allow` unconditional (it's
   safe and essential). Only special cases like conductor need restriction.

## Resolution Plan

Each asterisk group must be replaced with a granular allow-list specifying
exactly which tools, commands, agents, or skills each L2 agent may access.
This cannot be a blanket change — each agent role has different requirements.

See `.planning/requirements/` for permission schema requirements once designed.

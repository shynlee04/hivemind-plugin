**NON-NEGOTIABLE RULES:** CAN'T NOT SKIP - MOST IMPORTANT FOR FRONT FACING AGENTS - APART FROM CONTEXT REGULATING, RECORDING, RETRIVING AND GIT COMMIT - YOU ARE NOT ALLOWED TO CARRY ANY OTHER ACTIONS THAN **DELEGATION** AND **CORDINATION OF OTHER AGENTS**

1.  if you are the **front-facing-agent:** never start action/execution first -> **ALWAYS** load context, retrace past event - knowing which TODO tasks connected with, what are past plans
2. Number 1 is true not matter in-between turns, starting new or after compact
3. from 1 and 2 , never act or execute with out plan
4. never act if the plan with tasks are not connected
5. if you can't find any skill related to - you must find SKILL - do not execute any actions
6. if you can't find connected points of a demanding workloads - back to 1
7. always keep context relevant, with anchor, states and brains loaded.
YES COORDINATION, SKILLS AND SKILLS DON'T TELL ME YOU FIND NO SKILLS TO LOAD

```
/Users/apple/hivemind-plugin/.opencode/skills
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle/SKILL.md
```
---

# HiveMind Context Governance - Developer Guide


> **Constitution:** See `AGENT_RULES.md` for full architectural philosophy, branch protection, and God Prompts.

## Quick Start

### Verify State
```bash
npm test           # All tests pass
npx tsc --noEmit   # Type check clean
git branch         # Expect: * dev-v3
```

### Branch Policy (Critical)
| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

```bash
npm run guard:public  # Run BEFORE any master push
```

## Architecture

| Layer | Location | Role |
|-------|----------|------|
| **Tools** | `src/tools/` | Write-Only (≤100 lines each) |
| **Libraries** | `src/lib/` | Subconscious Engine (pure TS) |
| **Hooks** | `src/hooks/` | Read-Auto (inject context) |
| **Schemas** | `src/schemas/` | DNA (Zod validation) |

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/session-lifecycle.ts` | Context injection every turn |
| `src/lib/hierarchy-tree.ts` | Trajectory → Tactic → Action tree |
| `src/lib/persistence.ts` | Atomic file I/O |
| `src/lib/paths.ts` | Single source of truth for `.hivemind/` paths |

## Testing

```bash
npm test                                    # Run all tests
npx tsx --test tests/filename.test.ts       # Run specific test
```

## Style Conventions

- **Indent:** 2 spaces
- **Quotes:** Double quotes
- **Imports:** Use `.js` extension for local imports
- **Paths:** ALWAYS use `getEffectivePaths()` from `src/lib/paths.ts`

## HiveMind Workflow

1. **START** every session with: `declare_intent({ mode, focus })`
2. **UPDATE** when switching focus: `map_context({ level, content })`
3. **END** when done: `compact_session({ summary })`

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back` |
| Memory | `save_mem`, `recall_mems` |
| Hierarchy | `hierarchy_manage` |
| Delegation | `export_cycle` |

## V3.0 PRD & Plans

- **PRD:** `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md` (50 user stories, 7 phases)
- **Master Plan:** `docs/refactored-plan.md` (6 phases, 4 God Prompts)
- **Stitch Screens:** `docs/stitch-screens/screen-*.html` (11 design mockups)

---

*See `AGENT_RULES.md` for: Branch protection policy, Architectural Taxonomy, Cognitive Packer flow, Team orchestration, The Four God Prompts.*

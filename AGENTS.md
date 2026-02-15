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

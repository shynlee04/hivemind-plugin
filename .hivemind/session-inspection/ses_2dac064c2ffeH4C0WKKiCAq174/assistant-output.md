# Session Inspection Export

- ses_id: `ses_2dac064c2ffeH4C0WKKiCAq174`
- prepared_at: `2026-03-25T13:47:40.747Z`

## Assistant Output

Here are the complete results, grouped by pattern:

---

## Pattern 1: `activity/handoff/`

**Zero matches.** No references to `activity/handoff/` remain in the refactored skills tree.

---

## Pattern 2: `activity/hierarchy/`

**3 matches — all in `use-hivemind-git-memory`:**

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `use-hivemind-git-memory/tests/git-memory-enforce-direct-invocation.md` | 85 | `2. Look up decision in `.hivemind/activity/hierarchy/`` |
| 2 | `use-hivemind-git-memory/references/retrieval-methodology.md` | 45 | `cat .hivemind/activity/hierarchy/${DECISION}.json` |
| 3 | `use-hivemind-git-memory/references/knowledge-network.md` | 67 | `3. Read decision from .hivemind/activity/hierarchy/{decision_id}.json` |

All three are in the **git-memory** domain. The first is a test spec, the latter two are reference docs describing a lookup chain (`commit → decision (hierarchy) → packet (delegation) → phase`). The `activity/hierarchy/` folder has been removed from the domain-aware design, so these references are stale.

---

## Pattern 3: `activity/state/`

**2 matches — both in `use-hivemind-context`:**

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `use-hivemind-context/SKILL.md` | 128 | `.hivemind/activity/state/context-check.json    ← runtime cache (not official boundary)` |
| 2 | `use-hivemind-context/SKILL.md` | 140 | `- Store it in `{project}/.hivemind/activity/sessions/` or `{project}/.hivemind/activity/state/`` |

Both are in the handoff-paths section and carry-forward section of the context skill. `activity/state/` was a global folder that has been removed from the domain-aware design.

---

## Pattern 4: `activity/longhaul/`

**Zero matches.** No references to `activity/longhaul/` remain in the refactored skills tree.

---

## Pattern 5: `activity/agents/`

**2 matches — in two different skill domains:**

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `hivemind-system-debug/SKILL.md` | 45 | `Debug artifacts are stored in `{project}/.hivemind/activity/agents/{agent_name}/{pass_id}/`` |
| 2 | `hivemind-refactor/SKILL.md` | 274 | `- Refactor artifacts are stored in `{project}/.hivemind/activity/agents/{agent_name}/{pass_id}/`` |

Both reference the old global `activity/agents/` folder as the output location for debug and refactor artifacts. In the domain-aware design, these should be domain-scoped (e.g., `activity/debug/` and `activity/refactor/`).

---

## Pattern 6: `active-paths.json`

**5 matches across 3 files:**

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `use-hivemind-git-memory/references/activity-pathing.md` | 54 | `| `.hivemind/activity/pathing/active-paths.json` | Domain path resolution registry |` |
| 2 | `use-hivemind-git-memory/references/activity-pathing.md` | 60 | `` `pathing/active-paths.json` maps domain names to their activity paths: `` |
| 3 | `use-hivemind-git-memory/references/activity-pathing.md` | 95 | `- Using `pathing/active-paths.json` as a master registry that must be pre-populated` |
| 4 | `use-hivemind-planning/SKILL.md` | 210 | `` Resolve via `pathing/active-paths.json`, not ad-hoc paths. `` |
| 5 | `use-hivemind-context/SKILL.md` | 133 | `` Paths are relative to project root. Resolve via `pathing/active-paths.json`. `` |

The `activity-pathing.md` reference doc (lines 93–96) actually lists "Using `pathing/active-paths.json` as a master registry that must be pre-populated" as an **anti-pattern**, yet lines 54 and 60 present it positively. The planning and context skills both instruct resolving paths via `pathing/active-paths.json`.

---

## Summary

| Pattern | Matches | Affected Files |
|---------|---------|----------------|
| `activity/handoff/` | 0 | — |
| `activity/hierarchy/` | 3 | `use-hivemind-git-memory` (test + 2 references) |
| `activity/state/` | 2 | `use-hivemind-context/SKILL.md` |
| `activity/longhaul/` | 0 | — |
| `activity/agents/` | 2 | `hivemind-system-debug/SKILL.md`, `hivemind-refactor/SKILL.md` |
| `active-paths.json` | 5 | `use-hivemind-git-memory/references/activity-pathing.md`, `use-hivemind-planning/SKILL.md`, `use-hivemind-context/SKILL.md` |

**Total: 12 stale references** across 6 files that need updating for the domain-aware design.
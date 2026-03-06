# State-Authority Rationalization Pass

Date: 2026-03-06
Status: Decision pass completed
Scope: Injection authority, navigation authority, session-metadata authority

## Purpose

This pass records the current authoritative state surfaces after:

- `task_id` continuity landed in `cycle_log`
- `hivemind_inspect.traverse` v1 landed
- prompt-surface de-duplication entered the restricted hooks safely
- `tool-gate` was demoted to advisory-only
- child-session prompt minimization landed in the core runtime hooks

The goal is to prevent a fourth state authority from emerging while making the next migration decisions explicit.

## Current Authorities

### Injection authority

Canonical source:

- `src/lib/cognitive-packer.ts`
- underlying data from:
  - `graph/trajectory.json`
  - `graph/plans.json`
  - `graph/tasks.json`
  - `graph/mems.json`
  - `state/anchors.json`
- selected session metrics from `brain.json`

Why:

- It already compiles the densest structured prompt payload.
- It is budget-aware.
- It already carries the overlap that replaced duplicate status and anchor surfaces.
- It is now the correct baseline for both de-duplication and child-session minimization.

Implication:

- Prompt-facing hierarchy/status/anchor duplication should be treated as derived presentation only, not authoritative state.

### Navigation authority

Canonical source:

- `src/lib/hierarchy-tree.ts`
- persisted data in `state/hierarchy.json`

Why:

- `hivemind_inspect.traverse` v1 is tree-first by design.
- Cursor, ancestors, and sibling/descendant navigation are already expressed cleanly here.
- This is the safest navigation contract for agents before broad graph-walk behavior exists.

Implication:

- Tree navigation remains separate from graph relationship lookup for now.
- Any future graph traversal should be additive, not a replacement of the hierarchy tree.

### Session metadata authority

Canonical source:

- `src/schemas/brain-state.ts`
- persisted data in `state/brain.json`

Owns:

- session mode
- governance mode/status
- session role/kind/lineage scope
- metrics and counters
- cycle log
- compaction continuity fields
- recent messages
- checkpoint queue

Why:

- This is the hot store every hook already reads.
- It is the least disruptive place for continuity metadata such as `task_id`.
- It is already the place where role/kind inference resolves.

Implication:

- New continuity fields should land here first unless a clear contradiction emerges.

## Non-Authoritative or Derived Surfaces

### Prompt helper surfaces

Derived only:

- fallback anchor header in `messages-transform.ts`
- next-step status line assembly in `session-lifecycle.ts`
- plugin fallback governance message in `.opencode/.../context-injection.ts`

These may remain useful presentation layers, but they must not become independent state authorities.

### Runtime child-session lineage

Authoritative for runtime minimization only:

- OpenCode session lookup via `client.session.get({ sessionID })`

This is not yet the persisted source of truth for session lineage. It is a runtime overlay used to:

- detect `parentID`
- minimize child-session prompt surfaces
- avoid polluting delegated sessions with full main-session payloads

Decision:

- Keep runtime parent linkage as an execution-time overlay for now.
- Do not create a new persisted lineage registry.

### Extension-side state snapshot files

Fallback-only, not core authority:

- `runtime-profile.json`
- `todo.json`
- `health-metrics.json`
- `context-recovery.json`

These remain valid extension surfaces for GX-Pack fallback behavior, but they are not the canonical source for core session identity or core prompt authority.

## Migration / No-Migration Table

| State family | Current authority | Decision | Notes |
|---|---|---|---|
| Session mode, governance, counters, cycle log | `brain.json` | Keep | Hot runtime authority |
| `task_id` continuity | `brain.json -> cycle_log[]` | Keep | Already landed |
| Runtime child linkage | OpenCode session lookup | Keep runtime-only | Do not persist separately yet |
| Hierarchy cursor and tree navigation | `hierarchy.json` | Keep | Powers `traverse` v1 |
| Trajectory / plans / tasks / mems | `graph/*.json` | Keep | Injection compiler reads here |
| Anchors | `state/anchors.json` | Keep | Consumed by packer and helpers |
| Prompt status/anchor helper lines | hook-local derived text | Reduce over time | Not authoritative |
| GX-Pack fallback snapshot files | extension-side JSON | Keep fallback-only | Do not promote to core authority |

## Derived-Field List

These fields should be treated as derived presentations rather than independent truths:

- lifecycle next-step hint strings
- anchor fallback header strings
- duplicated status lines in `system[]`
- human-facing checklist summaries
- plugin fallback narrative summaries

These may change format without implying a schema migration.

## Follow-On Decisions

### Decision 1: No new state store

Rejected:

- separate continuity registry
- separate child-session registry
- separate prompt-ownership registry

Reason:

- Current authorities are sufficient if we keep responsibilities narrow.

### Decision 2: Child-session minimization should stay runtime-driven

Accepted:

- detect child linkage at runtime from OpenCode session ancestry
- use that signal to reduce prompt surfaces

Deferred:

- persisting `parent_session_id` into `brain.json` as a first-class session field

Reason:

- runtime linkage solves the prompt problem immediately without schema sprawl

### Decision 3: `cognitive-packer.ts` remains the leading injection compiler

Accepted:

- continue removing prompt-surface duplication in favor of structured packer output

Guard:

- do not remove remaining helpers without coverage proving the packer carries the needed context

## Next Recommended Work

1. Keep prompt-surface ownership migrating toward:
   - `system[]` = governance + stable warnings + short next-step guidance
   - `messages[] prepend` = canonical structured context
   - `messages[] append` = checklist + short end-of-turn guidance
2. Add direct GX-Pack fallback runtime coverage once `.opencode` hook modules expose a stable test import surface.
3. Begin the QA / research workflow design pass using these authorities as fixed assumptions.

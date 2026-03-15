# src/core/ — State Management

Trajectory ledger, workflow authority, and task lifecycle state.

## Boundary

| Sub-Module | Status | Purpose |
|-----------|--------|---------|
| `trajectory/` | ✅ Active | Trajectory ledger, events, checkpoints, assessment |
| `workflow-management/` | ✅ Active | Workflow authority, task lifecycle, routing, continuity |
| `session/` | ⛔ Deprecated | Dead code — zero consumers, parallel to `hooks/start-work/` |

## Audit Findings (2026-03-15)

> [!CAUTION]
> **`core/session/` is dead code.** `kernel.ts`, `boundary.ts`, `coherence.ts`, and `intent-classifier.ts` define a `Session` type that nothing in the codebase imports. The real session lifecycle lives in `hooks/start-work/`. Do NOT extend, import from, or reference `core/session/`.

> [!WARNING]
> `coherence.ts` has two TODO stubs: "Implement actual coherence checks" and "Implement repair strategies". These are misleading — they promise functionality that has never existed.

## Rules

- Trajectory and workflow modules are the state authority — tools delegate here
- State files live in `.hivemind/state/` — resolved via `shared/paths.ts`
- All state reads/writes go through store functions, never direct file I/O
- `core/session/*` — do not touch, scheduled for removal

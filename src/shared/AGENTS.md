# src/shared/ — Shared Utilities & Primitives

Cross-cutting utilities used by multiple modules. No domain logic.

## Boundary

- Path resolution (`paths.ts`): canonical path authority via `getEffectivePaths()`
- Runtime attachment (`runtime-attachment.ts`): session lifecycle state
- Tool helpers (`tool-helpers.ts`): JSON/list formatting for tool outputs
- **No business logic** — shared modules are pure utilities

## Key Exports

| Module | Purpose |
|--------|---------|
| `paths.ts` | `getEffectivePaths()` — single path authority |
| `runtime-attachment.ts` | Runtime attachment snapshot |
| `tool-helpers.ts` | Shared JSON/list helpers for tools |

## Rules

- All path constants in `paths.ts` — no hardcoded `.hivemind/` elsewhere
- Shared types use interface decomposition (≤10 fields per core type)
- No imports from `core/session/` (removed) or `event-bus.ts` (removed)

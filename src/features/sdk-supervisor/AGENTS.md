# SDK Supervisor Feature Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/sdk-supervisor/` owns read-only SDK supervisor diagnostics and readiness checks. It inspects SDK wrapper health, heartbeat status, and bounded diagnostics without replacing SDK wrappers. `types.ts` defines supervisor contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- SDK-supervisor may inspect SDK wrapper health and readiness state.
- SDK-supervisor may return diagnostic summaries consumed by tools.
- All operations are read-side inspection; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- SDK-supervisor SHALL NOT replace or wrap SDK wrappers; it inspects them.
- SDK-supervisor SHALL NOT mutate runtime state. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- SDK-supervisor SHALL NOT store state in `.opencode/`.
- SDK-supervisor SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/hivemind-sdk-supervisor.ts` | Queries SDK health diagnostics | Tools own CQRS mutation; feature owns inspection |
| `src/schema-kernel/sdk-supervisor.schema.ts` | Provides validation contracts | Schemas are leaf; feature owns behavior |
| Tests | Validate diagnostic accuracy | Must not treat inspection as integration proof |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/sdk-supervisor/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/features/sdk-supervisor/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Diagnostic changes must verify bounded inspection (no SDK replacement).
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

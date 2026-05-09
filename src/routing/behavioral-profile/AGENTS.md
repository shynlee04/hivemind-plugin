# Behavioral Profile Routing Guidance

**Parent sector:** `src/routing/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (profile resolution, cache invalidation)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/behavioral-profile/` owns config-first behavioral profile resolution and lazy session cache invalidation. `resolve-behavioral-profile.ts` resolves profiles from configuration. `profiles.ts` defines profile templates. `types.ts` defines profile contracts. Cache lifecycle is explicit and testable. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Behavioral-profile may resolve profiles from workspace configuration.
- Behavioral-profile may maintain lazy session profile caches with explicit invalidation.
- Behavioral-profile may return profile decisions consumed by routing and hooks.

## 3. Forbidden mutations / explicit no-go boundaries

- Behavioral-profile SHALL NOT perform durable writes; profile resolution is read-side. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Behavioral-profile SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Behavioral-profile SHALL NOT hide cache lifecycle; invalidation must be explicit and testable.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/routing/session-entry/` | Consumes profile resolution for intake routing | Session-entry owns routing; profile owns resolution |
| `src/hooks/` | Reads profiles for guard and observer behavior | Hooks must not bypass profile resolution |
| Tests | Validate profile resolution and cache invalidation | Must test cache lifecycle explicitly |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/routing/behavioral-profile/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/routing/behavioral-profile/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Cache changes must verify invalidation correctness.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

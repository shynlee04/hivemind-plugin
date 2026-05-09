# Session Entry Routing Guidance

**Parent sector:** `src/routing/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (language/profile/purpose classification)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/session-entry/` owns session language, profile, purpose classification, and intake gate routing. `language-resolution.ts` detects session language. `profile-resolver.ts` resolves behavioral profiles. `purpose-classifier.ts` classifies session purpose. `intake-gate.ts` routes sessions through intake decisions. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Session-entry may classify session intent and resolve profiles at intake time.
- Session-entry may maintain in-memory classification caches with explicit lifecycle.
- Session-entry may return routing decisions consumed by tools and hooks.

## 3. Forbidden mutations / explicit no-go boundaries

- Session-entry SHALL NOT perform durable writes; routing is read-side classification. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Session-entry SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Session-entry SHALL NOT execute commands; execution belongs to tools and coordination.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Reads routing decisions for guard behavior | Hooks must not bypass classification |
| `src/tools/` | Invokes session classification | Tools own CQRS mutation; routing owns classification |
| Tests | Validate classification accuracy | Must test edge cases in language and purpose detection |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/routing/session-entry/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/routing/session-entry/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Classification changes must have test coverage for edge cases.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

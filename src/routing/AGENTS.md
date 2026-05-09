# Routing Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/` owns session entry classification, behavioral profile resolution, command interpretation, and workflow route selection. Session-entry handles language, profile, and purpose classification at intake. Behavioral-profile resolves config-first profiles with lazy session cache invalidation. Command-engine discovers and renders bounded command contexts. Routing may classify and dispatch; it must not perform durable writes. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`.

## 2. Allowed mutation authority

- Routing modules may classify session intent, resolve behavioral profiles, and interpret commands.
- Routing modules may maintain in-memory caches (e.g., session profile cache) with explicit lifecycle.
- Routing modules may return routing decisions consumed by tools and hooks.

## 3. Forbidden mutations / explicit no-go boundaries

- Routing SHALL NOT perform durable writes; routing is read-side classification. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Routing SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Routing SHALL NOT execute commands; command execution belongs to tools and coordination modules.
- Routing SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Reads routing decisions for guard and observer behavior | Hooks must not bypass routing classification |
| `src/tools/` | Invokes routing to classify session intent | Tools own CQRS mutation; routing owns classification |
| `src/plugin.ts` | Wires routing dependencies at composition time | Keeps assembly logic only |
| Tests | Validate classification accuracy and profile resolution | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each routing module lives in its own subdirectory: `src/routing/{module-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Routing types belong in `{module-name}/types.ts`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Routing classification changes must have test coverage for edge cases.
- Docs-only edits remain L5 evidence and must not alter readiness status. Source evidence: `.planning/ROADMAP.md:47-49`.

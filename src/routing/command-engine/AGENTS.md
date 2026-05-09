# Command Engine Routing Guidance

**Parent sector:** `src/routing/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (command discovery, contract analysis)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/command-engine/` owns OpenCode command discovery, contract analysis, bounded context rendering, and preview-only routing. It discovers available commands, analyzes their contracts, and renders bounded contexts for routing decisions. Command execution belongs to tools and coordination modules. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Command-engine may discover and analyze command contracts.
- Command-engine may render bounded context previews for routing decisions.
- All operations are read-side; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Command-engine SHALL NOT execute commands; execution belongs elsewhere. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Command-engine SHALL NOT perform durable writes. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Command-engine SHALL NOT store state in `.opencode/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/hivemind-command-engine.ts` | Queries command discovery and routing preview | Tools own CQRS mutation; engine owns discovery |
| `src/hooks/` | Reads command routing for guard decisions | Hooks must not bypass command analysis |
| Tests | Validate command discovery accuracy | Must test command contract analysis |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/routing/command-engine/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/routing/command-engine/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Discovery changes must verify command contract accuracy.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

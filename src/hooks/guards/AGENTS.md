# Hook Guard Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/guards/` enforces policy and governance decisions around tool execution. `tool-guard-hooks.ts` intercepts tool calls to apply permission and budget guards. `governance-block.ts` blocks or shapes responses based on governance policy. Guards may block or shape but must not own durable state. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Guards may block tool execution by returning guard decisions.
- Guards may shape response payloads when classified as guard-decision. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-344`.
- Guards may call injected policy dependencies through `HookDependencies`.

## 3. Forbidden mutations / explicit no-go boundaries

- Guards SHALL NOT perform durable writes; `assertHookWriteBoundary()` is the CQRS boundary. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Guards SHALL NOT become state owners for `.hivemind/` persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:311-315`.
- Guards SHALL NOT bypass tool guards or transform data without explicit test coverage.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Instantiates guard factories | Keeps assembly logic only |
| OpenCode runtime | Receives guard decisions before tool execution | Guards must not mutate durable state |
| `src/task-management/` | May receive guard event facts | Owns lifecycle logic, not guard files |

## 5. Naming and placement conventions

- Guard files use `kebab-case.ts` in `src/hooks/guards/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/guards/`.

## 6. Quality gates and evidence expectations

- Changes must prove no durable writes from guard code.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Guard policy changes must have test coverage for blocking and shaping behavior.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

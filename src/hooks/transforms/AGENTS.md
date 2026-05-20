# Hook Transform Guidance

**Parent sector:** `src/hooks/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (payload shaping, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/transforms/` owns system and tool-after payload transformations. `tool-after-composer.ts` composes post-tool response shaping. Transforms are deterministic and side-effect free. The legacy `toggle-gates.ts` transform and `messages.transform` no-op were removed in Phases 18-19 as dead code. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Transforms may shape hook payloads (system, messages, tool-after) when classified as response-shaping.
- Transforms may call injected dependencies through `HookDependencies`. Source evidence: `.planning/codebase/ARCHITECTURE.md:329-333`.

## 3. Forbidden mutations / explicit no-go boundaries

- Transforms SHALL NOT perform durable writes; `assertHookWriteBoundary()` is the CQRS boundary. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Transforms SHALL NOT become state owners for `.hivemind/` persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:311-315`.
- Transforms SHALL NOT have hidden global dependencies; all deps must be factory-injected.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Instantiates transform factories | Keeps assembly logic only |
| OpenCode runtime | Receives transformed payloads | Transforms must not mutate durable state |
| Tests | Validate transform behavior | Must not treat mocked calls as integration proof |

## 5. Naming and placement conventions

- Transform files use `kebab-case.ts` in `src/hooks/transforms/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/transforms/`.

## 6. Quality gates and evidence expectations

- Changes must prove no durable writes from transform code.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

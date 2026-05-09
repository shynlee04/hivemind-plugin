# Hooks Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/` is the Hard Harness read-side sector. Hook factories observe OpenCode lifecycle events, perform response shaping, make guard decisions, route events to runtime managers, and inject shell/system/message transformations without owning durable state mutation. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Hooks may observe lifecycle events and pass facts to injected runtime dependencies. Evidence: `.planning/codebase/ARCHITECTURE.md:302-310`.
- Hooks may shape messages, systems, shell environment, and guard decisions when the effect is classified as observation, response-shaping, or guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-344`.
- Hooks may call injected managers through `HookDependencies`; dependencies must be passed by factory injection, not hidden global setup. Evidence: `.planning/codebase/ARCHITECTURE.md:329-333`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT perform durable writes directly. `assertHookWriteBoundary()` is the CQRS boundary for this sector. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Hooks SHALL NOT become state owners for `.hivemind/` persistence files; durable state ownership remains in library/tool surfaces. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Hooks SHALL NOT register tools or become plugin composition roots; `src/plugin.ts` owns hook composition and tool registration. Evidence: `.planning/codebase/ARCHITECTURE.md:413-415`.
- Hooks SHALL NOT bypass tool guards or transform user/runtime data without an explicit classification and test coverage.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Instantiates hook factories and spread-merges hook return objects | Keeps assembly logic only |
| OpenCode runtime | Emits session, message, tool, shell, and compaction events | Hooks observe and respond through supported surfaces |
| `src/task-management/lifecycle/` and related deps | Receive routed event facts | Owns lifecycle/state logic, not hook files |
| Tests | Validate hook behavior and CQRS boundary behavior | Must not treat mocked hook calls as full integration proof |

## 5. Naming and placement conventions

- Hook factory files use `create-{name}-hooks.ts` when introducing a factory. Evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Shared hook dependency types belong in `src/hooks/types.ts`. Evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror this sector under `tests/hooks/{name}.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:226-230`, `.planning/codebase/TESTING.md:52-64`.
- Keep hook files focused and below the 500 LOC cap. Evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 6. Quality gates and evidence expectations

- Any hook change must prove it does not introduce durable writes from hook code; inspect `hook-cqrs-boundary.ts` usage and run relevant hook tests.
- Runtime readiness requires live or integration evidence beyond docs. Unit tests or docs-only edits are not enough for integration readiness. Evidence: `.planning/ROADMAP.md:47-49`.
- Required evidence for code changes: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`; add integration evidence when claiming OpenCode event behavior. Evidence: `.planning/codebase/TESTING.md:41-48`, `.planning/codebase/TESTING.md:52-64`.

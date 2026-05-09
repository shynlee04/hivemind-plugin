# Hook Lifecycle Guidance

**Parent sector:** `src/hooks/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (lifecycle event routing, CQRS-compliant)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/lifecycle/` composes read-side OpenCode event behavior. `core-hooks.ts` wires session start/end, message, and tool lifecycle events. `session-hooks.ts` manages session-scoped lifecycle transitions. These hooks must preserve CQRS and avoid durable writes. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Lifecycle hooks may observe events and pass facts to injected runtime managers. Source evidence: `.planning/codebase/ARCHITECTURE.md:302-310`.
- Lifecycle hooks may call injected dependencies through `HookDependencies`. Source evidence: `.planning/codebase/ARCHITECTURE.md:329-333`.

## 3. Forbidden mutations / explicit no-go boundaries

- Lifecycle hooks SHALL NOT perform durable writes; `assertHookWriteBoundary()` is the CQRS boundary. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Lifecycle hooks SHALL NOT become state owners for `.hivemind/` persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:311-315`.
- Lifecycle hooks SHALL NOT register tools or become plugin composition roots. Source evidence: `.planning/codebase/ARCHITECTURE.md:413-415`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Instantiates lifecycle hook factories | Keeps assembly logic only |
| `src/task-management/lifecycle/` | Receives routed event facts | Owns lifecycle/state logic |
| OpenCode runtime | Emits session and message events | Hooks observe and respond |

## 5. Naming and placement conventions

- Lifecycle files use `kebab-case.ts` in `src/hooks/lifecycle/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/lifecycle/`.

## 6. Quality gates and evidence expectations

- Changes must prove no durable writes from lifecycle hook code.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

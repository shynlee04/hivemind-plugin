# Hook Observer Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/observers/` translates runtime events into append-only evidence through authorized task-management writers. `event-observers.ts` observes session, message, and tool events and routes facts to lifecycle and journal modules. Observers are read-side; they record, not act. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Observers may call injected task-management writers to append event evidence. Source evidence: `.planning/codebase/ARCHITECTURE.md:302-310`.
- Observers may pass facts to lifecycle managers through `HookDependencies`.

## 3. Forbidden mutations / explicit no-go boundaries

- Observers SHALL NOT perform durable writes directly; writes go through authorized task-management writers. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Observers SHALL NOT become state owners for `.hivemind/` persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:311-315`.
- Observers SHALL NOT transform or filter event data without explicit classification.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Instantiates observer factories | Keeps assembly logic only |
| `src/task-management/` | Receives append-only event evidence | Owns persistence; observers own observation |
| OpenCode runtime | Emits events consumed by observers | Observers must not block or mutate runtime |

## 5. Naming and placement conventions

- Observer files use `kebab-case.ts` in `src/hooks/observers/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/observers/`.

## 6. Quality gates and evidence expectations

- Changes must prove no direct durable writes from observer code.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

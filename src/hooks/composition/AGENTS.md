# Hook Composition Guidance

**Parent sector:** `src/hooks/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (CQRS boundary enforcement, factory wiring)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/composition/` wires hook factories and CQRS boundaries. `cqrs-boundary.ts` defines and enforces the write-boundary assertion that prevents hooks from performing durable writes. This layer is dependency-light and exists to compose hook behavior at plugin assembly time. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Composition utilities may wire hook factories into the plugin composition root.
- `cqrs-boundary.ts` may assert and enforce write boundaries. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Composition SHALL NOT embed business logic; it wires, not acts.
- Composition SHALL NOT perform durable writes; it defines the boundary that prevents them.
- Composition SHALL NOT depend on deep runtime modules; keep dependency-light. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Uses composition to wire hooks | Keeps assembly logic only |
| All hook files | Depend on CQRS boundary assertions | Must respect boundary enforcement |
| Tests | Validate boundary enforcement | Must not treat mocked calls as integration proof |

## 5. Naming and placement conventions

- Composition files use `kebab-case.ts` in `src/hooks/composition/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/composition/`.

## 6. Quality gates and evidence expectations

- Changes must verify CQRS boundary enforcement still holds.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

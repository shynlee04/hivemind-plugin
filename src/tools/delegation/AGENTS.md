# Delegation Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/delegation/` owns write-side OpenCode tool entrypoints for session/task delegation. `delegate-task.ts` dispatches delegated work through the coordination layer. `delegation-status.ts` polls delegation state for completion signals. Validation lives at the tool boundary; orchestration logic lives in `src/coordination/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call delegation managers and SDK wrappers when the tool contract requires it.
- Tools may write delegation records through approved coordination state owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT duplicate orchestration logic that belongs in `src/coordination/`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke delegation tools during workflows | Must pass schema-valid inputs |
| `src/coordination/delegation/` | Owns delegation manager logic | Tools call coordination; tools do not duplicate logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate delegation dispatch and status polling | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts`: `delegate-task.ts`, `delegation-status.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/delegation/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

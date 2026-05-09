# Session Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/session/` owns bounded session patching and journal export surfaces. `session-patch/` provides session state modification through validated inputs. `session-journal-export.ts` exports append-only journal evidence. These tools preserve state-root separation and use shared response envelopes. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Key tools: `session-patch/index.ts` (multi-file, state modification), `session-journal-export.ts` (single-file, read-only export). Architecture: `.planning/codebase/ARCHITECTURE.md:87-113`. Classification: Hard Harness — write-side tools. Session state lives in `.hivemind/`, never `.opencode/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call session API wrappers and task-management modules when the tool contract requires it.
- Tools may write session state through approved `.hivemind/` state owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim integration readiness from mocked/unit-only proof.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke session tools during workflows | Must pass schema-valid inputs |
| `src/task-management/` | Owns session state and journal logic | Tools call task-management; tools do not duplicate logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate session patching and journal export | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Multi-file tools use subdirectories: `src/tools/session/session-patch/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Single-file tools: `session-journal-export.ts`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/session/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

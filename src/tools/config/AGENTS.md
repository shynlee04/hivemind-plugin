# Config Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/config/` owns OpenCode primitive configuration and bootstrap layout tool entrypoints. `configure-primitive.ts` creates, reads, lists, or inspects OpenCode primitives (agents, commands, skills). `validate-restart.ts` verifies compiled primitives are discoverable and free of runtime issues after restart. `bootstrap-init.ts` creates local `.hivemind/` surfaces and installs symlinks. `bootstrap-recover.ts` repairs missing or broken symlinks. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call config modules, schema-kernel validators, and bootstrap feature modules.
- Tools may write primitive files and symlinks through approved filesystem operations. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT bypass config module contracts or schema validation.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke config tools for primitive management | Must pass schema-valid inputs |
| `src/config/` | Owns config compilation and workflow logic | Tools call config; tools do not duplicate logic |
| `src/features/bootstrap/` | Owns primitive loading and detection | Tools call bootstrap; tools do not own detection |
| `src/schema-kernel/` | Provides validation contracts | Schemas are leaf; tools own behavior |
| Tests | Validate primitive configuration and restart validation | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts`: `configure-primitive.ts`, `validate-restart.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/config/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Bootstrap operations must verify symlink correctness and filesystem safety.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

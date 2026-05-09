# Hivemind Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/hivemind/` owns runtime control-plane and evidence-query tool entrypoints. Tools include: `hivemind-doc.ts` (document intelligence queries), `hivemind-trajectory.ts` (trajectory ledger inspection), `hivemind-pressure.ts` (pressure classification and evidence), `hivemind-sdk-supervisor.ts` (SDK wrapper health checks), `hivemind-command-engine.ts` (command discovery and routing preview), `hivemind-agent-work.ts` (durable work contract management), and `run-background-command.ts` (background PTY/headless command execution). Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call feature modules (runtime-pressure, sdk-supervisor, agent-work-contracts, doc-intelligence, background-command) and task-management modules.
- Tools may write through approved `.hivemind/` state owners when the contract requires it. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT duplicate deep logic that belongs in feature modules.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke hivemind tools during workflows | Must pass schema-valid inputs |
| `src/features/` | Owns runtime feature logic | Tools call features; tools do not duplicate logic |
| `src/task-management/` | Owns trajectory and state persistence | Tools call task-management; tools do not own state |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate tool contracts and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts` with `hivemind-` prefix: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- `run-background-command.ts` is the exception (no prefix).
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/hivemind/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

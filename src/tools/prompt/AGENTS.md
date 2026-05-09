# Prompt Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/prompt/` owns bounded prompt skimming and analysis surfaces. `prompt-skim/` performs lightweight prompt classification. `prompt-analyze/` performs deeper prompt structure analysis. Both tools use schema-kernel contracts for input validation and produce compact, deterministic outputs. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Key tools: `prompt-skim/index.ts` (classification), `prompt-analyze/index.ts` (structural analysis). Both use `src/schema-kernel/prompt-enhance.schema.ts` for validation. Architecture: `.planning/codebase/ARCHITECTURE.md:87-113`. Classification: Hard Harness — read-only analysis tools. No durable writes.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call prompt enhancement modules when the tool contract requires it.
- Tools produce read-only analysis outputs; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT produce non-deterministic outputs for identical inputs.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke prompt tools for analysis | Must pass schema-valid inputs |
| `src/schema-kernel/prompt-enhance.schema.ts` | Provides validation contracts | Schemas are leaf; tools own behavior |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate skimming and analysis accuracy | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Multi-file tools use subdirectories: `src/tools/prompt/prompt-skim/index.ts`, `src/tools/prompt/prompt-analyze/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Schemas belong in `src/schema-kernel/prompt-enhance.schema.ts`.
- Tests live under `tests/tools/prompt/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Output determinism must be verified through test assertions.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

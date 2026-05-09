# Features Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/` owns standalone runtime feature modules that are neither routing, config, coordination, task-management, nor shared leaf utilities. Features include bootstrap (primitive loading and framework detection), background-command (PTY/headless execution), doc-intelligence (markdown parsing/chunking), prompt-packet (packet creation and compaction), runtime-pressure (pressure scoring and control-plane decisions), sdk-supervisor (read-only SDK diagnostics), and agent-work-contracts (durable contract creation/export). Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`.

## 2. Allowed mutation authority

- Feature modules may define and export typed public interfaces consumed by tools, hooks, and coordination modules.
- Features may perform internal state computation (pressure scoring, profile resolution, document parsing) without durable writes.
- Agent-work-contracts may write durable contract records through `.hivemind/` authority surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 3. Forbidden mutations / explicit no-go boundaries

- Features SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features SHALL NOT become hidden tool implementations; tool entrypoints live in `src/tools/`.
- Features SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Features SHALL NOT exceed the 500 LOC module cap or introduce circular imports. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Calls feature modules to perform runtime logic | Tools own CQRS mutation; features own computation |
| `src/hooks/` | Reads feature state for guard and observer decisions | Hooks must not mutate feature state directly |
| `src/plugin.ts` | Wires feature dependencies at composition time | Keeps assembly logic only |
| Tests | Validate feature behavior and public exports | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each feature lives in its own subdirectory: `src/features/{feature-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Feature types belong in `{feature-name}/types.ts`; schemas belong in `src/schema-kernel/`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions and `import type` for type-only imports. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
- Docs-only edits remain L5 evidence and must not alter readiness status.

# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- Use kebab-case for implementation and test filenames in `src/plugin/opencode-plugin.ts`, `src/shared/tool-helpers.ts`, `src/features/agent-work-contract/tools/create-contract-tool.ts`, and `tests/runtime-validator-regression.test.ts`.
- Reserve `index.ts` re-export files for module boundaries such as `src/schema-kernel/index.ts`, `src/core/index.ts`, and `src/commands/slash-command/index.ts`.
- Name tests with a `.test.ts` or `.test.tsx` suffix, either co-located in `src/plugin/context-renderer.test.ts` and `src/features/agent-work-contract/tools/create-contract-tool.test.ts` or under top-level `tests/` such as `tests/plugin-runtime.test.ts` and `tests/unit/context-renderer/workflow-style.test.ts`.

**Functions:**
- Use camelCase for functions and helpers, including factories prefixed with `create` or `build`, such as `createAgentWorkCreateContractTool` in `src/features/agent-work-contract/tools/create-contract-tool.ts`, `createEventHandler` in `src/hooks/event-handler.ts`, and `buildHivemindRuntimeStatus` referenced by `src/tools/runtime/tools.ts`.
- Use verb-first names for side-effecting operations like `executeHivemindRuntimeCommand` in `src/tools/runtime/tools.ts`, `bootstrapTrajectoryLedger` in `src/core/index.ts`, and `resolveStartWork` in `src/hooks/start-work/start-work-router.ts`.

**Variables:**
- Use camelCase for local variables and parameters, including descriptive domain names such as `turnSnapshot`, `dispatchKey`, `alreadyDispatched`, and `renderSnapshot` in `src/plugin/opencode-plugin.ts`.
- Use ALL_CAPS snake case for exported constants and tool identifiers, such as `HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID` in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts` and `SCHEMA_KERNEL_ACTIVE` in `src/schema-kernel/index.ts`.

**Types:**
- Use PascalCase for interfaces, classes, and schema-derived types, including `RuntimeError` in `src/shared/errors.ts`, `ToolResponse` in `src/shared/tool-response.ts`, `RuntimeBindingsSnapshot` in `src/plugin/context-renderer.test.ts`, and `CreateContractToolArgs` in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`.
- Keep literal union values lowercase and hyphenated for runtime contracts, such as `broad-search-execute`, `interactive-qa`, and `deep-research` in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`.

## Code Style

**Formatting:**
- No dedicated Prettier, Biome, or root ESLint config was detected in `/Users/apple/hivemind-plugin`; formatting is enforced by stable TypeScript style and code review norms visible in `src/plugin/opencode-plugin.ts`, `src/shared/errors.ts`, and `src/tools/runtime/tools.ts`.
- Prefer two-space indentation, semicolon-free TypeScript, trailing commas in multiline objects and calls, and blank lines between import groups and logical blocks, as shown in `src/plugin/opencode-plugin.ts` and `src/features/agent-work-contract/tools/create-contract-tool.ts`.
- Keep modules small and single-purpose; helper extraction is explicit in `src/features/agent-work-contract/tools/create-contract-tool.ts`, which delegates schema, helpers, normalizers, and operations to sibling files.

**Linting:**
- Primary enforcement is script-based rather than config-file-based. `package.json` defines `npm run lint:boundary`, which chains repository guard scripts such as `scripts/check-tool-schema.sh`, `scripts/check-hooks-readonly.sh`, and `scripts/check-plugin-assembly.sh`.
- `scripts/check-tool-schema.sh` requires tool definitions under `src/tools/` to use Zod-backed schemas and encourages `.describe()` metadata on tool args.
- Inline suppressions are rare and narrowly scoped; examples include `// eslint-disable-next-line @typescript-eslint/no-explicit-any` in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts` and `src/features/agent-work-contract/engine/chain-executor.test.ts`.

## Import Organization

**Order:**
1. Node built-ins first, usually as `node:*` imports in tests and utility modules, such as `node:assert/strict`, `node:fs/promises`, `node:os`, and `node:path` in `tests/plugin-runtime.test.ts` and `src/delegation/delegation-store.ts`.
2. External packages second, including `@opencode-ai/plugin`, `@opencode-ai/plugin/tool`, `@opencode-ai/sdk`, `zod`, and `bun:test`, as seen in `src/plugin/opencode-plugin.ts`, `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`, and `apps/opentui/tests/runtime-status.test.tsx`.
3. Internal imports last, grouped by relative path and often separated into type-only imports where useful, as in `src/plugin/context-renderer.test.ts` and `src/features/agent-work-contract/tools/create-contract-tool.ts`.

**Path Aliases:**
- No TypeScript path aliases are configured in `tsconfig.json`; use explicit relative `.js` import paths from compiled ESM modules, such as `../shared/tool-helpers.js` in `src/tools/runtime/tools.ts` and `./create-contract-tool.schema.js` in `src/features/agent-work-contract/tools/create-contract-tool.ts`.

## Error Handling

**Patterns:**
- Prefer typed error classes for reusable failure modes. `src/shared/errors.ts` defines `RuntimeError`, `ValidationError`, `NotFoundError`, `SchemaMigrationError`, `DelegationError`, and `SyncError`.
- Use `try`/`catch` around I/O and tool execution boundaries, then return structured JSON-safe error payloads rather than throwing raw errors at the edge, as shown in `src/features/agent-work-contract/tools/create-contract-tool.ts` and `src/shared/tool-helpers.ts`.
- Use explicit result unions for validation-heavy flows. `src/shared/errors.ts` defines `Result<T, E>`, and `src/delegation/delegation-store.ts` returns `{ ok: true | false }` objects for handoff file reads.
- Throw direct `Error` instances for hard contract violations in internal operations, such as missing runtime primitives in `src/features/runtime-entry/init-project.ts` and invalid field collisions in `src/plugin/context-renderer.constants.ts`.

## Logging

**Framework:** `console` plus structured metadata handoff to OpenCode tooling.

**Patterns:**
- Use `console.warn` for malformed or unknown runtime events in `src/hooks/event-handler.ts`.
- Use `console.log` for CLI-style validators and evidence reports in `src/plugin/evidence-reporter.ts`, `src/tools/runtime/runtime-command-validator.ts`, and `src/tools/runtime/runtime-status-validator.ts`.
- Use `context.metadata(...)` inside tool execution to expose structured side-channel details instead of embedding everything in the returned message, as seen in `src/features/agent-work-contract/tools/create-contract-tool.ts` and `src/tools/runtime/tools.ts`.

## Comments

**When to Comment:**
- Use top-of-file module headers and short intent comments for non-obvious constraints, such as assembly-only guidance in `src/plugin/opencode-plugin.ts`, version-bridge notes in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`, and authority notes in `src/shared/tool-helpers.ts`.
- Avoid routine inline comments unless a block has special governance or compatibility meaning; most business logic in `src/shared/errors.ts` and `src/tools/runtime/tools.ts` is self-describing without dense commentary.

**JSDoc/TSDoc:**
- JSDoc is common in exported modules and public helpers. Use `@module`, `@param`, `@returns`, and occasional `@example`, as shown in `src/shared/errors.ts`, `src/shared/tool-helpers.ts`, `src/features/runtime-entry/init-project.ts`, and `src/features/agent-work-contract/tools/create-contract-tool.ts`.
- Tests use lighter commentary; helper comments appear when the fixture shape is non-trivial, such as in `tests/runtime-validator-regression.test.ts` and `tests/unit/context-renderer/workflow-style.test.ts`.

## Function Design

**Size:**
- Keep public functions focused and extract helper modules instead of growing single files. `src/features/agent-work-contract/tools/create-contract-tool.ts` stays small by delegating parsing, normalization, metadata, and persistence to sibling modules.
- Plugin entrypoints may be longer but act as assembly surfaces rather than algorithm-heavy modules; `src/plugin/opencode-plugin.ts` wires hooks and tools while leaving business logic to imported modules.

**Parameters:**
- Prefer typed object parameters for structured inputs and partial overrides in tests, such as `createStartWorkInput(...)` in `src/plugin/input-helpers.ts` and `createInput(overrides)` in `src/hooks/start-work/start-work-router.test.ts`.
- Tool inputs must be validated with `tool.schema` definitions plus runtime parsing with Zod, as shown by `createContractToolArgs` and `CreateContractToolArgsSchema` in `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`.

**Return Values:**
- Return plain objects or JSON strings at boundaries. Tool factories return `ReturnType<typeof tool>` in `src/tools/runtime/tools.ts` and `src/features/agent-work-contract/tools/create-contract-tool.ts`; tool executors serialize output with `renderToolResult(...)` from `src/shared/tool-helpers.ts`.
- Use explicit success and error envelopes for tool responses via `success(...)` and `error(...)` in `src/shared/tool-response.ts`.

## Module Design

**Exports:**
- Prefer named exports for functions, constants, interfaces, and types across `src/`, such as `export function createHivemindRuntimeCommandTool` in `src/tools/runtime/tools.ts` and `export class RuntimeError` in `src/shared/errors.ts`.
- Re-export stable surfaces through `index.ts` files, including `src/schema-kernel/index.ts`, `src/core/index.ts`, and feature-local indexes like `src/features/agent-work-contract/tools/index.ts`.

**Barrel Files:**
- Barrel files are used for package boundaries and feature aggregation, not for every folder. Use them where an area exposes a supported surface, such as `src/commands/slash-command/index.ts` and `src/core/trajectory/index.ts`.
- Direct file imports remain common for implementation-specific modules, especially sibling helpers like `./create-contract-tool.operations.js` in `src/features/agent-work-contract/tools/create-contract-tool.ts`.

---

*Convention analysis: 2026-03-21*

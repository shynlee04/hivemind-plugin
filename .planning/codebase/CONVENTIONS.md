---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
---

# Coding Conventions

**Analysis Date:** 2026-05-20

## Naming Patterns

**Files:**
- Use `kebab-case.ts` for source files: `src/tools/delegation/delegate-task.ts`, `src/hooks/transforms/tool-before-guard.ts`.
- Use `kebab-case.schema.ts` for Zod contracts: `src/schema-kernel/agent-work-contract.schema.ts`, `src/schema-kernel/hivemind-configs.schema.ts`.
- Use `index.ts` for directory public surfaces and feature barrels: `src/index.ts`, `src/features/agent-work-contracts/index.ts`.
- Use `.test.ts` for tests and mirror the owning source surface where practical: `tests/tools/delegation/delegate-task-v2.test.ts`, `tests/hooks/transforms/tool-before-guard.test.ts`.

**Functions:**
- Use `camelCase` for functions and local variables: `unwrapData()` in `src/shared/helpers.ts`, `createToolBeforeGuard()` in `src/hooks/transforms/tool-before-guard.ts`.
- Use `createX` for factories that assemble tools, hooks, or managers: `createDelegateTaskTool()` in `src/tools/delegation/delegate-task.ts`, `createHarnessLifecycleManager()` in `src/task-management/lifecycle/index.ts`.
- Use `isX` / `hasX` for type guards or boolean checks: `isObject()` in `src/shared/helpers.ts`, `isSuccess()` in `src/shared/tool-response.ts`.
- Use action verbs for state mutations and persistence operations: `recordSessionContinuity()`, `patchSessionContinuity()`, `hydrateFromContinuity()` in `src/task-management/continuity/index.ts`.

**Types:**
- Use `PascalCase` for exported types, interfaces, classes, and schemas: `ToolResponse`, `DelegationManager`, `AgentWorkContractSchema`.
- Prefer `type` for object aliases in tests and narrow structural mocks: `MockClient`, `ManagerOptions` in `tests/lib/delegation-manager.test.ts`.
- Export inferred Zod types next to their schemas: `AgentWorkCreateToolInput` in `src/schema-kernel/agent-work-contract.schema.ts`.

## Code Style

**Formatting:**
- No ESLint, Prettier, or Biome configuration is present; TypeScript compiler options are the primary style gate.
- Use 2-space indentation and concise single-purpose helpers.
- Keep modules under the project 500 LOC cap; split broad behavior into focused files before adding more responsibilities.

**TypeScript constraints:**
- `tsconfig.json` uses `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `verbatimModuleSyntax`.
- Use `import type` for type-only imports: `src/plugin.ts`, `src/schema-kernel/agent-work-contract.schema.ts`, and `tests/lib/delegation-manager.test.ts` show the expected pattern.
- Internal relative imports must use ESM `.js` extensions: `../../shared/tool-response.js`, `./task-management/lifecycle/index.js`.
- Avoid new `any`; use `unknown`, narrow with helpers, or define local test-only structural types.

## Import Organization

**Order:**
1. Node built-ins and external packages: `node:fs`, `node:path`, `vitest`, `zod`, `@opencode-ai/plugin/tool`.
2. Runtime value imports from local modules using relative `.js` paths.
3. Type-only imports using `import type` or inline `type` specifiers.

**Path Aliases:**
- No path aliases are configured in `tsconfig.json`; use explicit relative imports.
- Keep imports aligned to source ownership boundaries: `src/shared/` remains leaf-like and must not import from tools, hooks, features, coordination, routing, or task-management.

## Error Handling

**Patterns:**
- Prefix thrown or rendered harness errors with `[Harness]`: examples appear in `src/shared/helpers.ts`, `src/tools/delegation/delegate-task.ts`, and `tests/cli/runCli.test.ts`.
- Parse untrusted tool input with Zod before executing behavior: `DelegateTaskV2Schema.safeParse()` in `src/tools/delegation/delegate-task.ts`.
- Convert SDK error shapes through shared helpers rather than duplicating SDK-specific parsing: `unwrapData()` in `src/shared/helpers.ts`.
- Best-effort observers and background startup tasks catch and log without blocking plugin initialization: `src/plugin.ts`, `src/hooks/transforms/tool-before-guard.ts`.
- Use explicit status envelopes for tool responses through `success()`, `error()`, and `pending()` in `src/shared/tool-response.ts`.

## Runtime State Conventions

**Canonical state root:**
- Internal durable runtime state belongs under `.hivemind/state/`, not `.opencode/`.
- Continuity writes resolve to `.hivemind/state/session-continuity.json` through `src/task-management/continuity/index.ts`.
- Delegation records belong to `.hivemind/state/delegations.json` through `src/task-management/continuity/delegation-persistence.ts`.
- Agent work contracts belong to `.hivemind/state/agent-work-contracts.json` through `src/features/agent-work-contracts/index.ts`.

**State safety:**
- Deep-clone data returned from stores so callers cannot mutate cached state by reference; see clone helpers in `src/task-management/continuity/index.ts` and tests in `tests/lib/agent-work-contracts/store.test.ts`.
- Redact sensitive boundary fields before persistence or export; use `src/shared/security/redaction.ts` and validate via `tests/lib/security/redaction.test.ts`.
- Quarantine corrupt JSON instead of overwriting it silently; continuity and delegation persistence use corrupt-file quarantine helpers.

## Documentation Expectations

**JSDoc/TSDoc:**
- Add JSDoc to exported functions, public types, factories, and non-obvious helpers.
- Include `@param` and `@returns` when the function is part of a reusable contract, as in `src/schema-kernel/agent-work-contract.schema.ts` and `src/shared/tool-response.ts`.
- Document why boundary behavior exists, especially CQRS, recovery, fallback, and best-effort paths.

**Inline comments:**
- Use comments for architectural intent and traceability, not obvious restatements.
- Section dividers (`// ---------------------------------------------------------------------------`) are used in long tests and state modules to group behavior.

## Function Design

**Size and shape:**
- Keep functions focused; extract helpers for parsing, cloning, rendering, persistence, and setup.
- Use object parameters when a function has multiple related dependencies or options: `setupDelegationModules(options)` in `src/plugin.ts`.
- Return discriminated shapes for tool and store APIs where consumers branch on status or kind.

**Validation:**
- Validate inputs at tool, schema, and persistence boundaries; do not trust agent-provided objects.
- Use `unknown` for raw external input and narrow via Zod or helper predicates.

## Module Design

**Exports:**
- Prefer named exports. `src/plugin.ts` may export the plugin composition root, while most modules export factories, schemas, classes, and helpers.
- Keep `src/plugin.ts` thin: assembly, dependency injection, tool registration, and hook wiring only.
- Keep business logic in owning modules under `src/tools/`, `src/hooks/`, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, or `src/schema-kernel/`.

**Boundaries:**
- Tools are write-side mutation entrypoints; hooks are read-side observers/guards/transforms.
- Hooks must not perform durable writes directly; route facts to injected dependencies or tool/state owners.
- `.opencode/` contains configurable primitives only; do not treat it as runtime state or implementation source.

---

*Convention analysis: 2026-05-20*

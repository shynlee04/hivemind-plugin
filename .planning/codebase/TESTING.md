# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:**
- Primary repo runner: Node's built-in `node:test`, executed through `tsx`, with root command coverage defined in `package.json` as `npm run test` -> `npm run lint:boundary && tsx --test tests/*.test.ts`.
- Co-located source tests also use `node:test`, including `src/plugin/context-renderer.test.ts`, `src/hooks/start-work/start-work-router.test.ts`, and `src/features/agent-work-contract/tools/create-contract-tool.test.ts`.
- Workspace-specific runner: `bun:test` is used only in `apps/opentui/tests/runtime-status.test.tsx`, with `bun test` defined in `apps/opentui/package.json`.
- Config: No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` file was detected in `/Users/apple/hivemind-plugin`.

**Assertion Library:**
- Main repo tests use `node:assert/strict`, as in `tests/plugin-runtime.test.ts`, `tests/runtime-validator-regression.test.ts`, and `src/plugin/context-renderer.test.ts`.
- `apps/opentui/tests/runtime-status.test.tsx` uses Bun's built-in `expect` assertions from `bun:test`.

**Run Commands:**
```bash
npm run test              # Run root boundary checks and top-level node:test suite
npx tsx --test tests/*.test.ts  # Run root node:test files directly
bun test                  # Run the OpenTUI workspace tests in `apps/opentui/`
```

## Test File Organization

**Location:**
- Use a hybrid layout: root integration and contract tests live under `tests/`, while feature-focused tests are co-located beside implementation files in `src/`.
- Root examples: `tests/plugin-runtime.test.ts`, `tests/runtime-entry-contract.test.ts`, `tests/runtime-surface-sync.test.ts`, and `tests/unit/context-renderer/workflow-style.test.ts`.
- Co-located examples: `src/plugin/context-renderer.test.ts`, `src/features/agent-work-contract/engine/contract-store.test.ts`, and `src/features/agent-work-contract/tools/create-contract-tool.test.ts`.

**Naming:**
- Use descriptive `.test.ts` suffixes with the unit or behavior encoded in the filename, such as `tests/runtime-validator-regression.test.ts` and `src/hooks/start-work/start-work-router.test.ts`.
- Use `.test.tsx` only for UI/workspace cases, as in `apps/opentui/tests/runtime-status.test.tsx`.

**Structure:**
```
tests/*.test.ts                       # root contract/integration coverage
tests/unit/**/*.test.ts              # targeted root unit suites
src/**/*.test.ts                     # co-located source tests
apps/opentui/tests/*.test.tsx        # Bun-backed workspace tests
```

## Test Structure

**Suite Organization:**
```typescript
import assert from 'node:assert/strict'
import test from 'node:test'

test('CreateContractTool - create - validates args, asks permission, and persists via context worktree', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-contract-project-root-'))

  try {
    const tool = createAgentWorkCreateContractTool(projectRoot)
    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)

    assert.equal(parsed.status, 'success')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
```
- This pattern is used directly in `src/features/agent-work-contract/tools/create-contract-tool.test.ts`.

**Patterns:**
- Prefer single-behavior tests with long descriptive names, as in `tests/runtime-validator-regression.test.ts` and `src/plugin/context-renderer.test.ts`.
- Use `describe(...)` selectively to group related behaviors when a file has several closely related scenarios, as in `tests/runtime-validator-regression.test.ts`, `tests/event-handler-unknown.test.ts`, and `tests/runtime-entry-contract.test.ts`.
- Use `try`/`finally` cleanup instead of global hooks. Temporary directories are removed manually in `tests/plugin-runtime.test.ts`, `tests/runtime-tools.test.ts`, and `src/hooks/start-work/start-work-router.test.ts`.

## Mocking

**Framework:**
- There is no dedicated repo-wide mocking library. The main suite uses handcrafted fakes, fixture builders, and temporary filesystem state with `node:test`.
- `node:test` mock APIs are scarcely used; `tests/event-handler-unknown.test.ts` imports `mock` but the prevalent pattern remains manual test doubles.

**Patterns:**
```typescript
function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: {
        showToast: async () => undefined,
      },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
  } as never
}
```
- This inline fake-input pattern appears in `tests/plugin-runtime.test.ts` and `tests/plugin-assembly-smoke.test.ts`.

```typescript
function createSnapshot(overrides: Partial<RuntimeBindingsSnapshot> = {}): RuntimeBindingsSnapshot {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    ...overrides,
  }
}
```
- Builder-style fixture factories are common in `tests/plugin-runtime.test.ts`, `src/plugin/context-renderer.test.ts`, and `tests/unit/context-renderer/workflow-style.test.ts`.

**What to Mock:**
- Mock OpenCode plugin inputs, runtime snapshots, contracts, and start-work decisions using plain objects in `tests/plugin-runtime.test.ts` and `src/plugin/context-renderer.test.ts`.
- Mock filesystem state with temporary directories and real file operations in `tests/runtime-surface-sync.test.ts`, `tests/sync-dry-run.test.ts`, and `tests/runtime-entry-contract.test.ts`.

**What NOT to Mock:**
- Avoid mocking core serialization and contract payloads when the code can exercise real parsers and stores. `src/features/agent-work-contract/tools/create-contract-tool.test.ts` persists real contract files through `ContractStore`, and `tests/delegation-schema-validation.test.ts` validates actual JSON payloads against schemas.
- Avoid introducing stub-only SDK behavior for primary root tests; the repo favors realistic input objects and contract assertions instead of heavy spy-based unit isolation.

## Fixtures and Factories

**Test Data:**
```typescript
function createInput(overrides: Partial<StartWorkInput> = {}): StartWorkInput {
  return {
    userMessage: 'plan plugin context',
    sessionId: 'ses_123',
    sessionScope: 'main',
    hasRuntimeAttachment: true,
    profileComplete: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    ...overrides,
  }
}
```
- This override-friendly fixture pattern is used in `src/hooks/start-work/start-work-router.test.ts` and mirrored by `createContract(...)`, `createSnapshot(...)`, and `createDecision(...)` in `tests/plugin-runtime.test.ts`.

**Location:**
- Fixtures usually stay inside the test file that owns the behavior, rather than in a shared test helpers directory. Examples include `tests/plugin-runtime.test.ts`, `src/plugin/context-renderer.test.ts`, and `tests/unit/context-renderer/workflow-style.test.ts`.

## Coverage

**Requirements:**
- No explicit percentage threshold or coverage reporter is configured in `package.json`.
- Practical coverage emphasis is on contract, runtime-boundary, and regression scenarios, visible in `tests/runtime-validator-regression.test.ts`, `tests/runtime-entry-contract.test.ts`, and `tests/runtime-authority-live-sanity.test.ts`.

**View Coverage:**
```bash
Not detected
```

## Test Types

**Unit Tests:**
- Pure logic and rendering tests live in co-located files such as `src/plugin/context-renderer.test.ts`, `src/features/agent-work-contract/engine/intent-classifier.test.ts`, and `src/features/agent-work-contract/engine/response-mode-resolver.test.ts`.
- These tests construct typed fixtures and assert exact object fields or rendered strings.

**Integration Tests:**
- Root `tests/` files emphasize integration across file I/O, runtime attachment, command bundles, and plugin hook assembly, including `tests/plugin-runtime.test.ts`, `tests/runtime-tools.test.ts`, `tests/runtime-surface-sync.test.ts`, and `tests/runtime-entry-contract.test.ts`.
- Integration tests often create temp directories with `mkdtemp(...)`, write real files, invoke tools or hook handlers, then assert on disk state and structured payloads.

**E2E Tests:**
- Browser-style E2E tooling is not used. No Playwright or Cypress config was detected.
- The closest repo-wide end-to-end coverage is runtime contract verification in `tests/runtime-authority-live-sanity.test.ts` and plugin assembly coverage in `tests/plugin-assembly-smoke.test.ts`.

## Common Patterns

**Async Testing:**
```typescript
test('resolveStartWork attaches active trajectory continuations', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-start-work-attach-'))

  try {
    await bootstrapTrajectoryLedger(projectRoot, { trajectoryId: 'traj_active', workflowId: 'wf_123', sessionId: 'ses_prev', lineage: 'hivefiver', purposeClass: 'planning', taskIds: ['task-1'] })
    const decision = resolveStartWork(createInput({ projectRoot, workflowId: 'wf_123', taskIds: ['task-1'] }))
    assert.equal(decision.routeDisposition, 'attach')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
```
- This real-I/O async pattern is used in `src/hooks/start-work/start-work-router.test.ts` and many root tests.

**Error Testing:**
```typescript
assert.throws(() => {
  createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot(),
    startWork: createStartWork(),
    agentWorkPacket: { contractId: 'contract-123' },
  })
})
```
- Exact failure assertions appear in `src/plugin/context-renderer.test.ts`, while rejected promise checks use `assert.rejects(...)` in `src/features/agent-work-contract/tools/create-contract-tool.test.ts`.

---

*Testing analysis: 2026-03-21*

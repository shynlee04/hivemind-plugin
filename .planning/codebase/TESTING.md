---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
---

# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- Vitest `4.1.5` configured in `vitest.config.ts`.
- Test globals are enabled, so tests can use `describe`, `it`, `expect`, `beforeEach`, `afterEach`, and `vi` without importing them in every file.
- Test discovery includes `tests/**/*.test.ts` and `eval/**/*.test.ts`.

**Assertion Library:**
- Use Vitest built-in assertions: `toBe`, `toEqual`, `toMatchObject`, `toContain`, `toThrow`, `rejects.toThrow`.
- Prefer specific assertions over snapshot-style broad output checks.

**Run Commands:**
```bash
npm test                                      # Run all tests with vitest run
npm run test:watch                            # Watch mode
npm run test:coverage                         # Coverage with configured thresholds
npx vitest run tests/lib/helpers.test.ts      # Single test file
npx vitest run -t "unwrapData"                # Name-filtered test run
npm run typecheck                             # Required TypeScript verification
```

## Coverage

**Requirements:**
- Coverage provider: V8 via `@vitest/coverage-v8`.
- Coverage include: `src/**/*.ts`.
- Coverage exclude: `src/index.ts` and `src/**/index.ts` barrel files.
- Enforced thresholds in `vitest.config.ts`: statements 85%, branches 72%, functions 85%, lines 85%.
- Reporters: `text`, `lcov`, and `json-summary`.

**Guidance:**
- Do not lower thresholds without an explicit audit amendment.
- Run scoped tests for small changes and run `npm test` or `npm run test:coverage` for shared contracts, state, delegation, hooks, plugin wiring, or cross-cutting changes.

## Test File Organization

**Location:**
- Tests live under root `tests/`; tracked source/test scan found `226` tracked `src/**/*.ts` files and `194` tracked `.test.ts` files.
- `tests/lib/` covers shared utilities, coordination, task management, runtime policy, recovery, PTY, prompt packets, and feature internals.
- `tests/tools/` covers OpenCode tool contracts such as `tests/tools/delegation/delegate-task-v2.test.ts` and `tests/tools/run-background-command.test.ts`.
- `tests/hooks/` covers hook factories, transforms, observers, guards, and CQRS boundaries.
- `tests/schema-kernel/` covers Zod schema contracts.
- `tests/cli/` covers CLI router, renderer, discovery, and commands.
- `tests/plugin/` covers plugin bootstrap and registration.
- `tests/sidecar/` covers read-only sidecar state.

**Naming:**
- Use `{source-name}.test.ts` for unit and contract tests.
- Use subdirectories that mirror the source sector when the source has a sector boundary: `tests/hooks/transforms/` for `src/hooks/transforms/`.
- Use phase or feature prefixes only for explicit lifecycle/regression contracts: `tests/CP-ST-03-01-excision.test.ts`.

## Test Structure

**Suite Organization:**
```typescript
describe("module or contract name", () => {
  beforeEach(() => {
    vi.useRealTimers()
    // create temp dirs, managers, mocks, or fixtures
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // restore env vars and remove temp dirs
  })

  describe("behavior group", () => {
    it("does one observable thing", async () => {
      // arrange, act, assert
    })
  })
})
```

**Patterns:**
- One top-level `describe` per module, class, or externally visible contract.
- Nested `describe` blocks group behaviors such as construction, dispatch, visibility, persistence, recovery, validation, and CLI routing.
- Each `it()` should assert one behavior or one regression rule.
- Use section dividers in long tests, as in `tests/lib/delegation-manager.test.ts`.

## Mocking

**Framework:**
- Use Vitest `vi.fn`, `vi.spyOn`, `vi.mock`, `vi.mocked`, fake timers, and real timers.

**Common patterns:**
```typescript
vi.mock("../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessageCount: vi.fn(),
}))

const spy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")
vi.useFakeTimers()
await vi.advanceTimersByTimeAsync(500)
vi.useRealTimers()
```

**What to mock:**
- OpenCode SDK calls and client surfaces: `client.session.create`, `client.session.promptAsync`, `client.app.agents`, `client.app.log`.
- Optional runtime dependencies such as PTY managers and external SDK wrappers.
- Time, environment variables, and temp directories where deterministic behavior is required.

**What not to mock:**
- Pure helpers such as `isObject()`, `stableStringify()`, and `makeToolSignature()` in `src/shared/helpers.ts`.
- Zod schemas when validating accepted/rejected shapes in `tests/schema-kernel/`.
- Store cloning and state-root behavior when the test is meant to prove persistence safety.

## Fixtures and Factories

**Local factories:**
- Define small factories in the test file that owns the behavior: `createMockClient()` and `createManager()` in `tests/lib/delegation-manager.test.ts`.
- Use override-based fixture builders for durable records: `createInput()` in `tests/lib/agent-work-contracts/store.test.ts`.
- Keep mock structural types local to tests unless multiple files prove the same public contract.

**Temp directories and env vars:**
- Use `mkdtempSync(join(tmpdir(), "prefix-"))` for isolated filesystem tests.
- Save and restore environment variables in `beforeEach` / `afterEach`; never let `OPENCODE_HARNESS_STATE_DIR` or similar overrides leak between tests.
- Remove temp directories with `rmSync(root, { recursive: true, force: true })` in cleanup.

## Test Types

**Unit and contract tests:**
- Primary test style across `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`, and `tests/cli/`.
- Test public contracts, state transitions, tool responses, schema parsing, and error messages.

**Integration-style tests:**
- Present where multiple modules interact but external systems are mocked or faked, such as `tests/tools/delegation/delegate-task-e2e.test.ts` and session-tracker feature tests.
- Classify mocked SDK evidence honestly; it does not prove live OpenCode runtime readiness by itself.

**CLI tests:**
- Use in-memory IO arrays rather than real stdout/stderr where possible, as in `tests/cli/runCli.test.ts`.
- Assert exit codes and emitted text separately.

## Common Patterns

**Async testing:**
```typescript
await expect(manager.dispatch({ agent: "not-real", prompt: "task" }))
  .rejects.toThrow("[Harness]")
```

**Error testing:**
```typescript
expect(() => buildHarnessCli([{ name: "help", summary: "duplicate", handler }]))
  .toThrow("[Harness]")
```

**Persistence testing:**
```typescript
expect(getAgentWorkContractsFilePath(root))
  .toBe(join(root, ".hivemind", "state", "agent-work-contracts.json"))
expect(readAgentWorkContracts(root).contracts[id]).not.toBe(mutatedReference)
```

**Redaction testing:**
- Assert that sensitive fields are replaced with redaction markers and that operational identifiers remain intact.
- Do not put real secrets in tests or docs; use synthetic placeholders only.

## Verification Expectations

**For source changes:**
- Run `npm run typecheck`.
- Run the closest scoped Vitest file for the changed module.
- Run broader `npm test` for shared contracts, tool response envelopes, runtime state, plugin composition, delegation, hooks, or schema changes.

**For docs-only mapping changes:**
- Verify assigned documents exist and have useful line counts.
- Do not claim runtime readiness from documentation updates.

---

*Testing analysis: 2026-05-20*

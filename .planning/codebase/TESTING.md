# Testing Patterns

**Analysis Date:** 2026-05-07

## Test Framework

**Runner:**
- Vitest 4.1.5 — `"vitest": "^4.1.5"`
- Config: `vitest.config.ts`
- Coverage provider: v8 (`@vitest/coverage-v8` 4.1.5)

**Configuration (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,                              // describe/it/expect/expec without imports
    include: ['tests/**/*.test.ts', 'eval/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 85,
        branches: 72,
        functions: 85,
        lines: 85,
      },
    },
  },
})
```

**Current coverage baseline (Node 20, 1163 tests):**
- Statements: 89.94% | Branches: 79.25% | Functions: 92.38% | Lines: 90.95%
- Thresholds sit ~5pp below actual to absorb normal churn while catching real regressions.
- Never lower thresholds without an explicit audit amendment (per Phase 48.4.1 gate).

**Run Commands:**
```bash
npm test                    # Run all tests (vitest run)
npm run test:watch          # Watch mode (vitest)
npm run test:coverage       # Coverage report (vitest run --coverage)
npx vitest run tests/lib/helpers.test.ts          # Run single file
npx vitest run -t "<test name>"                    # Run tests matching pattern
```

## Test File Organization

**Location:**
- Tests mirror source structure at the top level:
  ```
  tests/lib/     → src/lib/     (library unit tests)
  tests/tools/   → src/tools/   (tool unit tests)
  tests/hooks/   → src/hooks/   (hook factory tests)
  tests/cli/     → src/cli/     (CLI tooling tests)
  tests/plugins/ → src/plugin.ts (plugin lifecycle tests)
  tests/integration/             (cross-module integration tests)
  tests/sidecar/ → src/sidecar/ (sidecar tests)
  tests/schema-kernel/           (Zod schema validation tests)
  eval/                          (evaluation tests, separate from unit tests)
  ```

**Naming:**
- Test files: `<source-filename>.test.ts` — e.g., `helpers.test.ts` tests `helpers.ts`
- Subdirectory tests: `<submodule>.test.ts` in matching directory — e.g., `tests/lib/event-tracker/writer.test.ts` tests `src/lib/event-tracker/writer.ts`

**Current test stats (2026-05-07):**
- 125 test files
- 1,767 tests total
- 1,765 passing, 2 failing
- 2 failures in `tests/lib/session-journal.test.ts` — missing `.hivemind/journal/README.md` and `.hivemind/lineage/README.md` files (taxonomy heading assertion tests)

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { someFunction } from "../../src/lib/module.js"
import type { SomeType } from "../../src/lib/types.js"

describe("someFunction", () => {
  // Setup at describe level
  const baseArgs = { sessionID: "ses-test", agent: "hm-l2-researcher" }

  it("returns expected value for normal input", () => {
    const result = someFunction(baseArgs)
    expect(result).toEqual({ /* expected */ })
  })

  it("throws [Harness] on invalid input", () => {
    expect(() => someFunction({ ...baseArgs, sessionID: "" }))
      .toThrow("[Harness] sessionId must be a non-empty string")
  })

  it("handles edge case: undefined input", () => {
    expect(someFunction(undefined as never)).toBeUndefined()
  })
})
```

**Test structure conventions:**
- Each `describe` block maps to one exported function or class
- Each `it` block tests one behavior or edge case
- Test names are descriptive and lowercase: "returns true for plain objects", "throws on error property"
- Setup shared within `describe` via `const` or `let` assignments at the top of the block
- `beforeEach` / `afterEach` for lifecycle management (env cleanup, temp directories, mock resets)

**Assertion patterns:**
- `.toEqual()` — deep equality for objects and arrays
- `.toBe()` — strict equality for primitives
- `.toContain()` — substring or array membership
- `.toBeUndefined()`, `.toBeNull()`, `.toBeTruthy()`, `.toBeFalsy()`
- `.toThrow()` — exact match on error message (must include `[Harness]` prefix)
- `.toHaveLength()`, `.toStrictEqual()`
- `expect(new Set(values).size).toBe(expected)` — uniqueness assertions

**Edge case coverage (expected per function):**
- Null/undefined inputs
- Empty strings/arrays/objects
- Boundary values (max, min, zero)
- Invalid type inputs (string where object expected, etc.)
- Non-object intermediates in nested access patterns

## Mocking

**Framework:** vitest built-in mocking (`vi.fn()`, `vi.spyOn()`, `vi.mock()`, `vi.doMock()`)

**Mock patterns — SDK API faking:**
```typescript
// Pattern 1: vi.fn() for SDK method stubs
const mockSessionApi = {
  create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
  prompt: vi.fn().mockResolvedValue(undefined),
  promptAsync: vi.fn().mockResolvedValue(undefined),
  status: vi.fn().mockResolvedValue({ data: {} }),
  messages: vi.fn().mockResolvedValue({
    data: { messages: [{ role: "assistant", content: [{ type: "text", text: "result" }] }] }
  }),
  abort: vi.fn().mockResolvedValue(undefined),
  agents: vi.fn().mockResolvedValue({ data: { agents: [{ name: "hm-l2-researcher" }] } }),
}
```

**Mock patterns — vi.spyOn for module interception:**
```typescript
// Spy on exported functions to track calls
vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

// Spy on console for error/warning assertions
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("[Harness]"))

// Spy on class methods
const acquireSpy = vi.spyOn(DelegationConcurrencyQueue.prototype, "acquire")
```

**Mock patterns — vi.doMock for file-system level mocking:**
```typescript
// Used for continuity persistence tests — mock node:fs inline
vi.doMock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
  return {
    ...actual,
    writeFileSync: vi.fn<typeof actual.writeFileSync>((...args) => {
      // Track temp file writes while preserving actual behavior
      actual.writeFileSync(...args)
    }),
  }
})
```

**Mock patterns — vi.mock for static module replacement:**
```typescript
vi.mock("../../../src/lib/config-subscriber.js", () => ({
  getConfig: vi.fn(),
  getCachedConfig: vi.fn().mockReturnValue(getDefaultConfigs()),
  invalidateConfigCache: vi.fn(),
}))
```

**Mock lifecycle:**
```typescript
beforeEach(() => {
  vi.resetModules()        // Reset module cache for clean imports
  vi.unmock("node:fs")     // Ensure module is unmocked before re-mocking
  // Set up temp directories and env vars
})

afterEach(() => {
  vi.doUnmock("node:fs")   // Clean up dynamic mocks
  vi.resetModules()
  // Clean up temp directories
  // Restore env vars
})
```

**What to mock:**
- OpenCode SDK methods (`sessionApi`, `getSession`, `sendPrompt`, etc.) — any external dependency
- Node.js built-in modules (`node:fs`, `node:os`) when testing file I/O
- Config subscribers (`getCachedConfig`, `getConfig`)
- Console methods (`console.error`, `console.warn`) when testing logging behavior
- PTY operations (`spawn`, `read`, `write`, `terminate`)

**What NOT to mock:**
- Pure utility functions (`helpers.ts`) — tested with real inputs
- Type definitions and constants — tested through their consumers
- Simple state machines (`task-status.ts`) — tested directly
- Data validation (schemas) — tested with real Zod validation

## Fixtures and Factories

**Factory functions in test files:**
```typescript
// Inline factory at top of describe block
function makeRecord(sessionID: string): SessionContinuityRecord {
  return {
    sessionID,
    promptParams: {},
    metadata: {
      status: "running",
      description: `record ${sessionID}`,
      delegation: null,
      constraints: [],
      pendingNotifications: [],
      updatedAt: Date.now(),
    },
  }
}
```

**Default config fixtures:**
```typescript
function getDefaultConfigs() {
  return {
    MAX_DESCENDANTS_PER_ROOT: 5,
    CIRCUIT_BREAKER_THRESHOLD: 12,
  }
}
```

**Location:** Factories are defined inline in the test file, typically at the top of the `describe` block that uses them. No separate fixture files or directories.

## Coverage

**Requirements:**
- Coverage thresholds enforced in `vitest.config.ts`: 85% statements, 72% branches, 85% functions, 85% lines
- Coverage includes all `src/**/*.ts` files except `src/index.ts` and `src/**/index.ts` (barrel files)
- JSON summary reporter enables CI/automation parsing without scraping text output

**Known coverage gaps (from 2026-05-07 audit):**
| Area | Files | Gap |
|------|-------|-----|
| Schema-kernel files (10 files) | `trajectory.schema.ts`, `sdk-supervisor.schema.ts`, `runtime-pressure.schema.ts`, `skill-metadata.schema.ts`, `tool-definition.schema.ts`, `permission.schema.ts`, `mcp-server.schema.ts`, `doc-intelligence.schema.ts`, `command-engine.schema.ts`, `command-frontmatter.schema.ts` | No dedicated test files |
| `primitive-scanners.ts` | 182 LOC | Zero test coverage |
| `cli/commands/help.ts` | 28 LOC | No test file |

**View coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: individual functions, classes, and modules
- Location: `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`
- Approach: mock all external dependencies; test one function per `describe` block
- Count: ~120+ unit test files

**Integration Tests:**
- Location: `tests/integration/`
- Example: `tests/integration/prompt-enhance-pipeline.test.ts` — tests the full prompt skim → analyze → patch pipeline
- Scope: cross-module workflows where multiple units interact

**Plugin Lifecycle Tests:**
- Location: `tests/plugins/plugin-lifecycle.test.ts`
- Scope: verifies `plugin.ts` composition root wiring — hooks registration, tool mounting, lifecycle events

**E2E Tests:**
- Location: `eval/` directory (separate from main test suite)
- Included in vitest config: `include: ['tests/**/*.test.ts', 'eval/**/*.test.ts']`
- Scope: end-to-end verification of full workflows

## TDD Approach

**Workflow: RED → GREEN → REFACTOR**

Evidence from git history shows consistent TDD patterns:

```
test(CA-03-02): add failing tests for atomic_commit and commit_docs toggles
feat(CA-03-02): implement atomic_commit and commit_docs toggle gates

test(CA-03-01): add 12 governance block injection tests to system.transform
feat(CA-03-01): inject governance block at position 0 of system.transform

test(CA-03-01): add failing tests for toggle gate helpers
feat(CA-03-01): implement isToggleEnabled and getDiscussMode toggle gate helpers
```

**Process:**
1. **RED:** Write a failing test that asserts the desired behavior
2. **GREEN:** Implement the minimal code to make the test pass
3. **REFACTOR:** Clean up code while tests remain green
4. Commit after each step (test commit, then implementation commit)

**When to use TDD:**
- All new feature implementation
- Bug fixes (write test reproducing the bug first)
- Cross-cutting changes (see `hm-l2-cross-cutting-change` skill)

**When NOT to use TDD:**
- Exploratory spikes (use `gsd-spike` workflow)
- Documentation-only changes
- Purely cosmetic refactors where existing tests already cover behavior

## Async Testing

```typescript
it("quarantines corrupt session-continuity.json and throws visibly", async () => {
  const continuity = await import("../../src/lib/continuity.js")
  const filePath = continuity.getContinuityStoragePath()
  writeFileSync(filePath, "NOT JSON {{{", "utf-8")

  expect(() => continuity.listSessionContinuity()).toThrow(/^\[Harness\]/)
  expect(existsSync(filePath)).toBe(false)
})
```

**Patterns:**
- Use `async () =>` for dynamic imports (`await import(...)`) — used when mocking requires fresh module loads
- Use `mockResolvedValue()` / `mockRejectedValue()` for async mock returns
- No `done()` callback pattern — vitest handles promises natively

## Error Testing

```typescript
// Exact error string matching with [Harness] prefix
expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
  "[Harness] Something went wrong"
)

// Regex pattern matching for dynamic error content
expect(() => continuity.listSessionContinuity()).toThrow(/^\[Harness\]/)
```

**Pattern:** Test both the presence of the `[Harness]` prefix and the descriptive message content. Use exact match when the message is predictable, regex when dynamic content is included (timestamps, paths, UUIDs).

## Common Conventions

**Import style in tests:**
- vitest globals explicitly imported: `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"`
- Source imports use `.js` extension: `from "../../src/lib/helpers.js"`
- Type imports use `import type`: `import type { SomeType } from "../../src/lib/types.js"`

**No test globals auto-import:** Despite `globals: true` in config, test files explicitly import `describe`/`it`/`expect`/`vi` from `vitest` — this is the consistent convention observed across all test files.

**Test data:**
- Inline constants and fixtures preferred over external files
- Factory functions at top of `describe` block
- Explicit types on test data: `const rules: PermissionRule[] = [...]`
- Temporary directories via `mkdtempSync(join(tmpdir(), "test-name-"))` — cleaned in `afterEach`

**Test isolation:**
- Each test file is self-contained
- `vi.resetModules()` in `beforeEach` ensures clean module cache
- Environment variables set/restored in `beforeEach`/`afterEach`
- No shared state between test files

---

*Testing analysis: 2026-05-07*

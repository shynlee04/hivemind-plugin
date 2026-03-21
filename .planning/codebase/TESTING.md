# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:**
- **Framework:** Node.js native `node:test` (built-in test runner)
- **Config:** No external test config (no `vitest.config.*`, no `jest.config.*`)
- **Parallel execution:** Native Node.js test runner supports parallel execution
- **Assertion library:** `node:assert/strict` for all assertions

**Run Commands:**
```bash
npm test              # Full test suite (runs lint:boundary + all tests)
npx tsx --test tests/<file>.test.ts  # Single test file
npm run typecheck:core  # TypeScript type gate
```

## Test File Organization

**Location:**
- **Integration tests:** `tests/*.test.ts` - Full plugin assembly tests with real SDK interactions
- **Unit tests:** `tests/unit/*.test.ts` - Focused unit tests for individual modules
- **Feature tests:** Unit tests organized by module (e.g., `context-renderer/`, `tool-precedence/`)

**Naming:**
- **Pattern:** `<module>.test.ts` for integration, `<module>/<feature>.test.ts` for unit
- **Examples:**
  - `tests/plugin-runtime.test.ts` - Full plugin runtime behavior
  - `tests/runtime-entry-contract.test.ts` - Runtime entry contract validation
  - `tests/unit/context-renderer/tool-precedence.test.ts` - Tool precedence logic

**Structure:**
```
tests/
├── plugin-runtime.test.ts         # Integration: plugin assembly, hooks, tools
├── runtime-entry-contract.test.ts  # Integration: runtime entry authority
├── plugin-assembly-smoke.test.ts   # Integration: basic plugin wiring
├── runtime-authority-live-sanity.test.ts
├── runtime-tools.test.ts
├── cli-init-output.test.ts
└── unit/
    ├── context-renderer/          # Unit: context rendering logic
    │   ├── tool-precedence.test.ts
    │   └── workflow-style.test.ts
    └── [other unit modules...]
```

## Test Structure

**Suite Organization:**
```typescript
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('feature name', () => {
  it('specific behavior scenario', async () => {
    // Test implementation
    assert.equal(actual, expected)
  })
})
```

**Integration Test Pattern:**
```typescript
test('event hook keeps a single root binding while composing agent-work event evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-event-agent-work-'))
  
  try {
    // Bootstrap runtime state
    await bootstrapTrajectoryLedger(directory, { ... })
    await store.create(createContract())
    
    // Load real plugin with hooks
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    
    // Execute hook behavior
    await hooks.event?.({ event: { ... } })
    
    // Assertions on real state changes
    const ledger = await loadTrajectoryLedger(directory)
    assert.equal(event?.summary, 'event:session.compacted')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

**Unit Test Pattern:**
```typescript
describe('parseList', () => {
  it('handles empty string', () => {
    const result = parseList(undefined)
    assert.deepEqual(result, [])
  })
  
  it('splits and trims comma-separated values', () => {
    const result = parseList('a, b, c')
    assert.deepEqual(result, ['a', 'b', 'c'])
  })
})
```

## Mocking

**Framework:** No external mocking framework used

**No Stubbed SDK:** 
- **Critical rule:** No test may use stubs for `@opencode-ai/sdk` or `@opencode-ai/plugin`
- **Live SDK surface required:** All SDK behavior must be proven against actual OpenCode interfaces
- **Mocked PluginInput allowed:** `createPluginInput()` creates mock plugin context for local testing

**Mock Policy:**
```typescript
// ✅ ALLOWED: Mock plugin context for local testing
function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: {
        showToast: async () => undefined,  // Mock TUI
      },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
  } as never
}

// ❌ FORBIDDEN: Stub SDK functions
// Tests must import from '@opencode-ai/sdk' and '@opencode-ai/plugin'
```

**What to Mock:**
- **Plugin client:** `client.tui`, `client.app.log()` can be mocked in `createPluginInput()`
- **File system:** `mkdtemp()`, `rm()` for temp directories in tests
- **Test data:** Fixture objects and minimal state for isolation

**What NOT to Mock:**
- **SDK surfaces:** Never stub `tool()`, `context` in `ToolContext`, or SDK hooks
- **Core logic:** Test real feature implementations, not mocked versions
- **State persistence:** Use real `core/` modules, not in-memory fakes

## Coverage Requirements

**TDD Enforced:**
- **No development without passing tests:** Code changes blocked if tests fail
- **Gate before commit:** `npm run typecheck` runs TypeScript verification
- **Integration required:** Tests must surface actual SDK APIs (not stubbed implementations)

**Test Types Required:**
- **Unit tests:** Isolated module behavior testing
- **Integration tests:** Cross-module contract validation
- **SDK surface tests:** Real OpenCode interface verification

**Verification Gates:**
```bash
# Type safety gate
npx tsc --noEmit

# Full test suite
npm test

# Boundary checks
npm run lint:boundary
```

## Test Execution

**Node.js Native Test Runner:**
```typescript
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
```

**No external config:**
- Tests use built-in `node:test` directly
- No `vitest` or `jest` configuration files
- Type-only imports for test runner (`import type { ... }`)

**Test isolation:**
```typescript
const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-unique-test-'))

try {
  // Test code with real file system
} finally {
  await rm(directory, { recursive: true, force: true })
}
```

## Integration vs Unit Test Boundaries

**Integration Tests (`tests/*.test.ts`):**
- **Scope:** Full plugin assembly, hook wiring, tool registration
- **Real SDK usage:** Load actual plugin via `HiveMindPlugin()` with mock client
- **Cross-module contracts:** Test interactions between tools, hooks, core, and features
- **File system:** Real filesystem operations with temp directories
- **Examples:**
  - `plugin-runtime.test.ts` (956 lines) - Comprehensive runtime behavior
  - `runtime-entry-contract.test.ts` (457 lines) - Runtime entry authority

**Unit Tests (`tests/unit/*.test.ts`):**
- **Scope:** Isolated module behavior without dependencies
- **Focused assertions:** Single responsibility per test
- **No plugin loading:** Direct imports from source modules
- **Examples:**
  - `context-renderer/tool-precedence.test.ts` - Tool precedence logic only
  - `context-renderer/workflow-style.test.ts` - Workflow style detection

**Boundary Rule:**
- **Unit tests never import** `HiveMindPlugin()` or load full plugin
- **Integration tests always import** `HiveMindPlugin()` and real SDK
- **Feature modules imported** directly in unit tests, no mock wrappers

## Common Patterns

**Async Testing:**
```typescript
test('async operation with temp directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'test-'))
  
  try {
    const result = await someAsyncOperation(directory)
    assert.equal(result.status, 'success')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

**Error Testing:**
```typescript
test('error handling returns error kind', async () => {
  const result = await errorProneOperation()
  
  assert.equal(result.kind, 'error')
  assert.ok(result.message.includes('expected error'))
})
```

**Deep Equality:**
```typescript
test('complex object comparison', () => {
  const actual = { nested: { value: 42 } }
  const expected = { nested: { value: 42 } }
  
  assert.deepEqual(actual, expected)
})
```

**Array Testing:**
```typescript
test('array order and content', () => {
  const actual = ['a', 'b', 'c']
  
  assert.equal(actual.length, 3)
  assert.equal(actual[0], 'a')
})
```

## Test-Driven Development (TDD)

**Process:**
1. **Write failing test first:** Test for behavior not yet implemented
2. **Implement feature:** Write minimum code to make test pass
3. **Run tests:** Verify all tests pass
4. **Type check:** Run `npx tsc --noEmit`
5. **Commit:** Only after tests pass and type check succeeds

**TDD Requirements:**
- **Gradual test suite building:** Tests added incrementally as features grow
- **No nonsensical tests:** Every test must verify real behavior
- **API surface coverage:** Tests must cover actual SDK usage patterns
- **Cross-dependencies validated:** Test contracts between interacting modules

**Example TDD Flow:**
```bash
# 1. Write failing test
# 2. Implement minimal feature
# 3. Run: npx tsx --test tests/feature.test.ts
# 4. Run: npx tsc --noEmit
# 5. Verify all pass before commit
```

## Live Verification Authority

**Real OpenCode Proof Required:**
- **Local mocks only for isolation:** `createPluginInput()` mocks TUI, not SDK behavior
- **Live server + client:** Ultimate verification requires real OpenCode instance
- **Behavioral claims:** Must distinguish between local evidence and live proof
- **Documentation labeling:** Separate test evidence from runtime contract verification

**Evidence Classes:**
- **Local mock coverage:** Plugin assembly and hook wiring
- **Live SDK behavior:** Requires official OpenCode server/client interface
- **Distinguish clearly:** Label what proves what (e.g., "local hook logic proven", "live SDK behavior requires live verification")

---

*Testing analysis: 2026-03-21*

# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`) — primary
- Vitest — secondary, used in `tests/integration/semantic-naming.test.ts` (mixed usage, typically avoided per project rules)
- Executed via `tsx --test` for TypeScript support

**Assertion Library:**
- Node.js built-in `node:assert/strict` — primary (`assert.equal`, `assert.ok`, `assert.deepEqual`, `assert.match`, `assert.rejects`)
- Vitest `expect` — used in one integration test (`tests/integration/semantic-naming.test.ts`)

**Run Commands:**
```bash
npm test                                          # Full suite (lint:boundary + all tests)
tsx --test "tests/**/*.test.ts" "src/**/*.test.ts"  # All tests
npx tsx --test tests/plugin-assembly-smoke.test.ts  # Single test file
npx tsx --test src/schema-kernel/schema-records.test.ts  # Single co-located test
```

**Test Gate:**
- `npm test` runs `npm run lint:boundary` FIRST, then the test suite
- Both must pass — boundary violations are test failures

## Test File Organization

**Location:**
- Co-located: Unit tests live alongside source files in `src/`: `src/shared/paths.test.ts`
- Separate root: Integration and smoke tests in `tests/`: `tests/plugin-assembly-smoke.test.ts`
- Feature sub-directories: `src/features/event-tracker/classifier/event-classifier.test.ts`

**Naming:**
- Always `.test.ts` suffix (never `.spec.ts`)
- Red-phase TDD tests use `.red.test.ts`: `src/features/event-tracker/session-writer/delegation-append.red.test.ts`
- Test names describe behavior: `tests/plugin-assembly-smoke.test.ts`, `tests/authority-contract.test.ts`

**Structure:**
```
tests/
├── integration/                    # Cross-module integration tests
│   ├── handler-bugs.test.ts
│   ├── tool-invocation.test.ts
│   ├── semantic-naming.test.ts
│   ├── multi-turn-accumulation.test.ts
│   ├── chat-message-consolidated.test.ts
│   ├── compaction-consolidated.test.ts
│   └── text-complete-consolidated.test.ts
├── unit/                           # Focused unit tests
│   └── context-renderer/
│       ├── workflow-style.test.ts
│       ├── turn-hierarchy.test.ts
│       └── tool-precedence.test.ts
├── hooks/                          # Hook behavior tests
│   ├── transform-handler.test.ts
│   ├── compaction-handler.test.ts
│   ├── text-complete-handler.test.ts
│   └── session-idle-handler.test.ts
├── features/                       # Feature module tests
│   └── event-tracker/writers/
│       ├── base-writer.test.ts
│       ├── events-writer.test.ts
│       └── diagnostics-writer.test.ts
├── plugin/                         # Plugin assembly tests
│   └── event-tracker-wiring.test.ts
├── plugin-assembly-smoke.test.ts   # Plugin wiring validation
├── runtime-tools.test.ts           # Tool registration tests
├── runtime-entry-contract.test.ts  # Entry point contract tests
├── runtime-resilience.test.ts      # Resilience/error handling tests
├── authority-contract.test.ts      # Cross-sector authority tests
├── delegation-schema-validation.test.ts  # Schema validation tests
├── cli-init-output.test.ts         # CLI output tests
└── phase-10-legacy-removal.test.ts # Legacy removal verification

src/
├── shared/paths.test.ts            # Co-located unit tests
├── shared/config-groups.test.ts
├── shared/tiered-injection.test.ts
├── shared/skill-injection-loader.test.ts
├── shared/skill-registry-path.test.ts
├── schema-kernel/schema-records.test.ts
├── schema-kernel/default-agent-templates.test.ts
├── tools/hivemind-journal.test.ts
├── tools/hivefiver-tools.test.ts
├── plugin/context-renderer.test.ts
├── plugin/skill-injection-init.test.ts
├── hooks/event-handler.test.ts
├── hooks/start-work/start-work-router.test.ts
├── features/event-tracker/
│   ├── types.test.ts
│   ├── paths.test.ts
│   ├── consolidated-writer.test.ts
│   ├── consolidated-writer-v3.test.ts
│   ├── session-structure.test.ts
│   ├── session-v3-types.test.ts
│   ├── classifier/event-classifier.test.ts
│   ├── classifier/delegation-returned-evidence.test.ts
│   ├── classifier/writer-adapter.test.ts
│   ├── classifier/classifier-integration.test.ts
│   ├── classifier/event-id.test.ts
│   ├── parser/types.test.ts
│   ├── parser/turn-parser.test.ts
│   ├── parser/counter.test.ts
│   ├── parser/delegation-extractor.test.ts
│   ├── parser/meta-parser.test.ts
│   ├── parser/splitter.test.ts
│   ├── parser/header-parser.test.ts
│   ├── writers/index-writer.test.ts
│   ├── writers/synthesizer.test.ts
│   ├── writers/formatter.test.ts
│   └── session-writer/*.red.test.ts  # TDD red-phase tests
└── features/agent-work-contract/
    ├── tools/create-contract-tool.test.ts
    ├── tools/export-contract-tool.test.ts
    ├── tools/classify-intent-tool.test.ts
    ├── hooks/compaction-preservation.test.ts
    ├── hooks/agent-work-event-handler.test.ts
    ├── engine/response-mode-resolver.test.ts
    ├── engine/intent-classifier.test.ts
    ├── engine/contract-store.test.ts
    ├── engine/chain-executor.test.ts
    └── engine/anchor-recorder.test.ts
```

## Test Structure

**Suite Organization (node:test):**
```typescript
import assert from 'node:assert/strict'
import test from 'node:test'

// Top-level test function — no describe blocks in most files
test('SchemaName accepts valid enum values', () => {
  const parsed = SchemaName.parse('value')
  assert.equal(parsed, 'value')
})

test('SchemaName rejects invalid values', () => {
  assert.throws(() => SchemaName.parse('bad'), /invalid/i)
})
```

**Suite Organization (vitest — rare):**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Session file naming', () => {
  beforeEach(() => { /* setup */ })
  afterEach(() => { /* cleanup */ })
  it('creates session file with semantic naming format', async () => {
    expect(value).toBeDefined()
  })
})
```

**Patterns:**
- Flat test structure preferred (no nested `describe` blocks) when using `node:test`
- `beforeEach`/`afterEach` for filesystem cleanup in integration tests
- `try/finally` pattern for temp directory cleanup (more common than hooks):
```typescript
test('operation with temp directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-test-'))
  try {
    // ... test logic
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

## Mocking

**Framework:** No dedicated mocking library. Tests use real filesystem I/O with temp directories.

**Patterns:**
```typescript
// Pattern: minimal mock for SDK client
function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: { showToast: async () => undefined },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
  } as never
}

// Pattern: partial mock with as-never type assertion
await hooks['chat.message']?.({ sessionID: 'ses_123' } as never, output as never)

// Pattern: filesystem isolation with mkdtemp
const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
```

**What to Mock:**
- SDK client interface (`client.tui.showToast`, `client.app.log`)
- Plugin input shape (directory, client, serverUrl)
- OpenCode event/message hook input shapes

**What NOT to Mock:**
- Zod schema validation (tests exercise real schemas)
- Filesystem I/O (tests use real temp directories)
- Store operations (tests exercise real CRUD with real files)
- Internal business logic (tested directly, not through mocks)
- SDK imports (per AGENTS.md: "NO TEST WITH SDK CAN USE STUB")

## Fixtures and Factories

**Test Data:**
```typescript
// Pattern: factory function with overrides
function createTestContract(overrides: Partial<AgentWorkContract> = {}): AgentWorkContract {
  const now = new Date().toISOString()
  return {
    contractId: `contract-${Date.now()}`,
    sessionId: `session-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    userIntent: { raw: 'test intent', confidence: 0.9, ... },
    ...overrides,
  }
}

// Pattern: minimal builder for parser types
function makeDelegation(packetId: string | null): ParsedDelegation {
  return {
    delegatedTo: 'hivexplorer',
    description: 'Inspect event tracker contracts',
    subagentType: 'hivexplorer',
    packetId,
  }
}

// Pattern: input builder with optional evidence
function makeInput(packetId: string | null, evidence?: DelegationReturnedEvidence): ClassifierInput {
  return { sessionId: 'ses_plan5_red', timestamp: '...', turn: makeTurn(packetId), ... }
}
```

**Location:**
- Factory functions defined at the top of each test file
- No shared fixture files — each test file defines its own helpers
- Helper functions named with `create`, `make`, or `build` prefix

## Coverage

**Requirements:** No enforced coverage percentage

**View Coverage:** No coverage tool configured

**Coverage Approach:** Thorough but manual — driven by:
1. Schema validation tests (every Zod schema tested for valid + invalid input)
2. CRUD operation tests (create, get, update, delete, list)
3. Edge case tests (concurrent writes, malformed files, missing data)
4. Boundary tests (file naming, path resolution, dead code detection)
5. Integration tests (plugin assembly, hook wiring, multi-turn behavior)

## Test Types

**Unit Tests:**
- Co-located in `src/` alongside implementation
- Test single functions/classes in isolation
- Use real Zod schemas and real temp filesystem
- Examples: `src/shared/paths.test.ts`, `src/features/event-tracker/writers/formatter.test.ts`
- ~80 unit test files across the codebase

**Integration Tests:**
- Located in `tests/integration/`
- Test cross-module behavior (hook → event tracker, compaction → session file)
- Use real plugin assembly via `HiveMindPlugin(createPluginInput(directory))`
- Exercise real SDK input/output shapes
- Examples: `tests/integration/compaction-consolidated.test.ts`, `tests/integration/chat-message-consolidated.test.ts`
- ~7 integration test files

**Smoke/Contract Tests:**
- Located in `tests/` root
- Verify plugin assembly, tool registration, entry point contracts
- Examples: `tests/plugin-assembly-smoke.test.ts`, `tests/runtime-entry-contract.test.ts`, `tests/authority-contract.test.ts`
- Verify exact tool count, correct hook registration, absence of legacy patterns

**Legacy Removal Tests:**
- Verify deleted code has no remaining imports/references
- Example: `tests/phase-10-legacy-removal.test.ts`
- Boundary scripts also serve as automated removal verification

**Red-Phase TDD Tests:**
- Files with `.red.test.ts` suffix
- Document expected behavior BEFORE implementation
- Named to indicate they should fail initially: "These tests MUST fail against current code"
- Example: `src/plugin/skill-injection-init.test.ts`, `src/features/event-tracker/session-writer/delegation-append.red.test.ts`

## Common Patterns

**Async Testing:**
```typescript
test('async operation with cleanup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-test-'))
  try {
    const store = new ContractStore(directory)
    await store.create(contract)
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

**Error Testing:**
```typescript
// Pattern: assert.rejects for expected throws
test('throws for non-existent contract', async () => {
  const store = new ContractStore(directory)
  await assert.rejects(
    async () => store.update('non-existent', { responseMode: 'interactive-qa' }),
    /not found/
  )
})

// Pattern: assert.throws for synchronous Zod parse failures
test('rejects invalid values', () => {
  assert.throws(() => Schema.parse('invalid'), /invalid/i)
})
```

**Schema Validation Testing:**
```typescript
// Every Zod schema gets valid + invalid tests
test('UserPreferences parses valid input with defaults', () => {
  const parsed = UserPreferences.parse({})
  assert.equal(parsed.communication_language, 'en')
  assert.equal(parsed.expert_level, 'intermediate')
})

test('UserPreferences rejects invalid expert_level', () => {
  assert.throws(() => UserPreferences.parse({ expert_level: 'wizard' }), /invalid/i)
})
```

**Boundary/Dead-Code Detection Tests:**
```typescript
// Tests that verify removed items stay removed
test('ARTIFACTS_DIR constant is removed (never used)', () => {
  assert.equal((paths as any).ARTIFACTS_DIR, undefined)
})

test('STATE_FILES does not contain hiveneuron (file does not exist)', () => {
  assert.equal('hiveneuron' in paths.STATE_FILES, false)
})
```

---

*Testing analysis: 2026-03-27*

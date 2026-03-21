# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:** Node.js built-in `node:test` (not Jest or Vitest)
- Version: Node.js native (v20+)
- Config: No config file — runner auto-discovers `*.test.ts` files

**Assertion Library:** Node's `assert/strict`
```typescript
import assert from 'node:assert/strict'
```

**Run Commands:**
```bash
npm test                  # lint:boundary + tsx --test tests/*.test.ts
tsx --test tests/*.test.ts    # Run all tests
tsx --test tests/runtime-tools.test.ts  # Single test file
```

## Test File Organization

**Location:** Two patterns observed
1. **Co-located:** `src/**/*.test.ts` alongside source (e.g., `contract-store.test.ts` next to `contract-store.ts`)
2. **Top-level:** `tests/*.test.ts` for integration/smoke tests

**Naming:** `*.test.ts` suffix (not `*.spec.ts`)
```
tests/
├── runtime-tools.test.ts
├── plugin-assembly-smoke.test.ts
├── runtime-surface-sync.test.ts
└── ...

src/features/agent-work-contract/engine/
├── contract-store.ts
└── contract-store.test.ts
```

## Test Structure

**Standard test file pattern:**
```typescript
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// ... imports

test('Test description - expected behavior', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-prefix-'))

  try {
    // Arrange
    const store = new ContractStore(directory)
    const contract = createTestContract()

    // Act
    await store.create(contract)

    // Assert
    const retrieved = await store.get(contract.contractId)
    assert.equal(retrieved?.contractId, contract.contractId)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

## Test Fixtures & Factories

**Contract factory pattern (common):**
```typescript
function createTestContract(overrides: Partial<AgentWorkContract> = {}): AgentWorkContract {
  const now = new Date().toISOString()
  return {
    contractId: `contract-${Date.now()}`,
    sessionId: `session-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    userIntent: {
      raw: 'test intent',
      confidence: 0.9,
      purposeClass: 'project-driven' as PurposeClass,
      requiresPlan: true,
      requiresGovernance: true,
    },
    responseMode: 'broad-search-execute',
    workflow: { tasks: [] },
    chainActions: {
      onTaskComplete: 'next-task',
      onWorkflowEnd: 'archive',
      onDelegation: 'handoff-packet',
      onCompaction80: 'launch-context-agent',
    },
    ...overrides,
  }
}
```

**Plugin input factory:**
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
    worktree: directory,
  } as never
}
```

## Mocking

**No external mocking library** — Node's built-in capabilities used:

**Mocking ToolContext:**
```typescript
function createContext(root: string) {
  const metadataCalls: Array<Record<string, unknown>> = []
  const context: ToolContext = {
    sessionID: 'session-intent-123',
    messageID: 'message-intent-123',
    agent: 'hiveminder-primary-orchestrator',
    directory: join(root, 'nested-directory'),
    worktree: root,
    abort: new AbortController().signal,
    metadata(input) {
      metadataCalls.push(input)
    },
    async ask() {
      throw new Error('tool should not request edit permission')
    },
  }
  return { context, metadataCalls }
}
```

**Mocking SDK client:**
```typescript
const hooks = await HiveMindPlugin({
  directory,
  client: {
    tui: {
      showToast: async () => undefined,
    },
  },
  $: {},
  serverUrl: new URL('http://localhost:4096'),
  project: null,
} as never)
```

**Mock plugin input:** Use `as never` cast for incomplete objects

## Common Test Patterns

**Async operations with cleanup:**
```typescript
test('async operation with file system', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    // Test logic
    const result = await someAsyncOperation(directory)
    assert.equal(result.status, 'success')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
```

**Promise rejection testing:**
```typescript
test('throws for non-existent contract', async () => {
  const store = new ContractStore(directory)
  
  await assert.rejects(
    async () => store.update('non-existent', { responseMode: 'interactive-qa' }),
    /not found/
  )
})
```

**Array containing check:**
```typescript
assert.ok(contracts.some((c: AgentWorkContract) => c.contractId === 'c1'))
assert.ok(!contracts.some((c: AgentWorkContract) => c.contractId === 'c3'))
```

**Deep equality for objects:**
```typescript
assert.deepEqual(parsed.userIntent, contract.userIntent)
assert.deepEqual(metadataCalls[0], { title: 'Agent-work intent classified', ... })
```

## Zod Schema Testing

**SafeParse pattern (validation):**
```typescript
test('rejects empty raw intent', () => {
  const tool = createAgentWorkClassifyIntentTool('/unused')
  const parsed = toolSchema.schema.object(tool.args).safeParse({ rawIntent: '' })
  
  assert.equal(parsed.success, false)
})
```

**Execute with parsed args:**
```typescript
test('returns validated JSON classification', async () => {
  const tool = createAgentWorkClassifyIntentTool('/unused')
  const parsedArgs = toolSchema.schema.object(tool.args).parse({
    rawIntent: 'implement the official sdk create contract tool',
  })
  
  const output = await tool.execute(parsedArgs, context)
  const parsed = JSON.parse(output)
  
  assert.equal(parsed.status, 'success')
})
```

## Coverage

**No enforced coverage threshold** found in project

**View coverage:** Not configured

**Verification approach:** Assertions on specific fields, not blanket truthiness checks
```typescript
// Good - specific assertions
assert.equal(payload.workflowGateState.availableCommands.includes('hm-research'), true)
assert.equal(payload.capabilityMatrix.chainActions.support['handoff-packet'], 'live')

// Avoid - too generic
assert.ok(payload)
```

## Integration Tests

**Plugin assembly tests:**
```typescript
test('plugin assembly keeps only the authoritative runtime hooks', async () => {
  const hooks = await HiveMindPlugin(createPluginInput(directory))
  
  assert.ok(hooks['chat.message'])
  assert.ok(hooks['experimental.chat.messages.transform'])
  assert.equal(hooks['experimental.chat.system.transform'], undefined)
})
```

**Runtime tool execution tests:**
```typescript
test('runtime status tool exposes executable command capabilities', async () => {
  await bootstrapReadyRuntime(directory)
  const hooks = await HiveMindPlugin(createPluginInput(directory))
  const statusTool = hooks.tool?.hivemind_runtime_status
  
  const payload = JSON.parse(await statusTool.execute({} as never, {
    sessionID: 'ses_123',
    messageID: 'msg_123',
    agent: 'runtime-agent',
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata() {},
    async ask() { throw new Error('should not ask') },
  } as never))
  
  assert.equal(payload.workflowGateState.availableCommands.includes('hm-research'), true)
})
```

## Test Categories Observed

| Category | Location | Scope |
|----------|----------|-------|
| Unit tests | `src/**/*.test.ts` | Single function/class |
| Integration tests | `tests/*.test.ts` | Plugin assembly, tool catalog |
| Smoke tests | `tests/plugin-*.test.ts` | Surface-level verification |

## What NOT to Mock (Per AGENTS.md)

- `core/session/` — removed, does not exist
- `shared/event-bus.ts` — removed, use SDK event hook
- Direct OpenCode server/client — local tests are evidence, not proof

---

*Testing analysis: 2026-03-21*

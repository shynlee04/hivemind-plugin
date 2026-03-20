/**
 * Contract Store Tests
 *
 * Tests for the contract store engine component.
 * Validates CRUD operations, atomic writes, and persistence.
 *
 * @module agent-work-contract/engine/contract-store.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ContractStore } from './contract-store.js'
import type { AgentWorkContract, PurposeClass } from '../schema/index.js'

/**
 * Creates a test contract with common fields
 */
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
    workflow: {
      tasks: [],
    },
    chainActions: {
      onTaskComplete: 'next-task',
      onWorkflowEnd: 'archive',
      onDelegation: 'handoff-packet',
      onCompaction80: 'launch-context-agent',
    },
    ...overrides,
  }
}

test('ContractStore - create - persists contract to disk', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    
    // Verify file exists - ContractStore uses .hivemind/agent-work-contract/ path
    const filePath = join(directory, '.hivemind', 'agent-work-contract', `${contract.contractId}.json`)
    await access(filePath)
    
    // Verify content
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    assert.equal(parsed.contractId, contract.contractId)
    assert.equal(parsed.sessionId, contract.sessionId)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - create - validates contract with Zod schema', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    // Should succeed with valid contract
    await store.create(contract)
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal(retrieved?.contractId, contract.contractId)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - get - retrieves contract by ID', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    const retrieved = await store.get(contract.contractId)
    
    assert.ok(retrieved !== null)
    assert.equal(retrieved?.contractId, contract.contractId)
    assert.equal(retrieved?.sessionId, contract.sessionId)
    assert.deepEqual(retrieved?.userIntent, contract.userIntent)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - get - returns null for non-existent contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const retrieved = await store.get('non-existent-id')
    
    assert.equal(retrieved, null)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - get - validates on read with Zod parse', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    const retrieved = await store.get(contract.contractId)
    
    // Zod validation should preserve all fields
    assert.ok(retrieved !== null)
    assert.equal(typeof retrieved?.createdAt, 'string')
    assert.equal(typeof retrieved?.updatedAt, 'string')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - update - applies partial updates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    
    await store.update(contract.contractId, {
      responseMode: 'interactive-qa',
    })
    
    const retrieved = await store.get(contract.contractId)
    assert.equal(retrieved?.responseMode, 'interactive-qa')
    // Other fields should remain unchanged
    assert.equal(retrieved?.userIntent.raw, contract.userIntent.raw)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - update - atomic write with proper-lockfile', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    
    // Multiple concurrent updates should be atomic
    const updates = Array(3).fill(null).map((_, i) => 
      store.update(contract.contractId, { 
        responseMode: i % 2 === 0 ? 'broad-search-execute' : 'interactive-qa'
      })
    )
    
    await Promise.all(updates)
    
    // Should have a valid final state
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - update - throws for non-existent contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    
    await assert.rejects(
      async () => store.update('non-existent', { responseMode: 'interactive-qa' }),
      /not found/
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - update - preserves forward-compat unknown fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    // Create contract with an extra forward-compat field (unknown to current schema)
    const contractWithExtra = {
      ...contract,
      _forwardCompatField: 'future-value',
      _anotherForwardField: { nested: 'data' },
    }
    await store.create(contractWithExtra as AgentWorkContract)
    
    // Update a known field
    await store.update(contract.contractId, {
      responseMode: 'interactive-qa',
    })
    
    // Read back the contract directly from disk (to check raw persistence)
    const filePath = join(directory, '.hivemind', 'agent-work-contract', `${contract.contractId}.json`)
    const rawContent = await readFile(filePath, 'utf-8')
    const rawParsed = JSON.parse(rawContent)
    
    // Verify forward-compat fields are NOT stripped
    assert.equal(rawParsed._forwardCompatField, 'future-value', 'forward-compat string field should be preserved')
    assert.deepEqual(rawParsed._anotherForwardField, { nested: 'data' }, 'forward-compat object field should be preserved')
    
    // Also verify via store.get() (which validates with Zod but preserves fields after parse)
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal((retrieved as Record<string, unknown>)._forwardCompatField, 'future-value')
    assert.deepEqual((retrieved as Record<string, unknown>)._anotherForwardField, { nested: 'data' })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - delete - removes contract from store', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    await store.delete(contract.contractId)
    
    const retrieved = await store.get(contract.contractId)
    assert.equal(retrieved, null)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - delete - throws for non-existent contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    
    await assert.rejects(
      async () => store.delete('non-existent'),
      /not found/
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - list - returns all contracts for a session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const sessionId = 'session-list-test'
    
    const contract1 = createTestContract({ contractId: 'c1', sessionId })
    const contract2 = createTestContract({ contractId: 'c2', sessionId })
    const contract3 = createTestContract({ contractId: 'c3', sessionId: 'other-session' })
    
    await store.create(contract1)
    await store.create(contract2)
    await store.create(contract3)
    
    const contracts = await store.list(sessionId)
    
    assert.equal(contracts.length, 2)
    assert.ok(contracts.some((c: AgentWorkContract) => c.contractId === 'c1'))
    assert.ok(contracts.some((c: AgentWorkContract) => c.contractId === 'c2'))
    assert.ok(!contracts.some((c: AgentWorkContract) => c.contractId === 'c3'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - list - returns empty array for session with no contracts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contracts = await store.list('non-existent-session')
    
    assert.deepEqual(contracts, [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - archive - moves contract to archived directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    await store.archive(contract.contractId)
    
    // Archived contract should NOT be retrievable via get() (moved to archived/)
    const retrieved = await store.get(contract.contractId)
    assert.equal(retrieved, null)
    
    // Archived contract file should exist in archived subdirectory
    const archivedPath = join(directory, '.hivemind', 'agent-work-contract', 'archived', `${contract.contractId}.json`)
    await access(archivedPath)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - archive - throws for non-existent contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    
    await assert.rejects(
      async () => store.archive('non-existent'),
      /not found/
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - persists to .hivemind/agent-work-contract/ directory', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    
    await store.create(contract)
    
    // Verify correct subdirectory structure - ContractStore uses .hivemind/agent-work-contract/
    const contractDir = join(directory, '.hivemind', 'agent-work-contract')
    const filePath = join(contractDir, `${contract.contractId}.json`)
    
    await access(filePath)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('ContractStore - concurrent create operations are atomic', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-contract-store-'))
  
  try {
    const store = new ContractStore(directory)
    
    // Create multiple contracts concurrently
    await Promise.all([
      store.create(createTestContract({ contractId: 'c1', sessionId: 'session1' })),
      store.create(createTestContract({ contractId: 'c2', sessionId: 'session1' })),
      store.create(createTestContract({ contractId: 'c3', sessionId: 'session1' })),
    ])
    
    // All should succeed
    const all = await store.list('session1')
    assert.ok(all.length >= 3) // At least our 3 test contracts
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
/**
 * Anchor Recorder Tests
 *
 * Tests for the anchor recorder engine component.
 * Validates anchor point recording and retrieval.
 *
 * @module agent-work-contract/engine/anchor-recorder.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { recordAnchor } from './anchor-recorder.js'
import { ContractStore } from './contract-store.js'
import type { AgentWorkContract, PurposeClass, AnchorPoint } from '../schema/index.js'

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

test('AnchorRecorder - recordAnchor - appends anchor to contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    const anchor: AnchorPoint = {
      timestamp: new Date().toISOString(),
      kind: 'workflow-shift',
      description: 'Workflow transitioned to planning phase',
    }
    
    await recordAnchor(store, contract.contractId, anchor)
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.ok(retrieved.anchors !== undefined)
    assert.equal(retrieved.anchors?.length, 1)
    assert.equal(retrieved.anchors?.[0].kind, 'workflow-shift')
    assert.equal(retrieved.anchors?.[0].description, 'Workflow transitioned to planning phase')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - preserves existing anchors', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const existingAnchor: AnchorPoint = {
      timestamp: new Date().toISOString(),
      kind: 'planning-shift',
      description: 'Initial planning anchor',
    }
    
    const contract = createTestContract({
      anchors: [existingAnchor]
    })
    await store.create(contract)
    
    const newAnchor: AnchorPoint = {
      timestamp: new Date().toISOString(),
      kind: 'stage-shift',
      description: 'Stage transitioned to implementation',
    }
    
    await recordAnchor(store, contract.contractId, newAnchor)
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal(retrieved.anchors?.length, 2)
    assert.equal(retrieved.anchors?.[0].kind, 'planning-shift')
    assert.equal(retrieved.anchors?.[1].kind, 'stage-shift')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - supports all anchor kinds', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    const kinds: Array<AnchorPoint['kind']> = [
      'workflow-shift',
      'planning-shift',
      'stage-shift',
      'user-redirect',
    ]
    
    for (const kind of kinds) {
      await recordAnchor(store, contract.contractId, {
        timestamp: new Date().toISOString(),
        kind,
        description: `Anchor for ${kind}`,
      })
    }
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal(retrieved.anchors?.length, 4)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - includes optional snapshotRef', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    const anchor: AnchorPoint = {
      timestamp: new Date().toISOString(),
      kind: 'workflow-shift',
      description: 'Major workflow change',
      snapshotRef: 'snap-001',
    }
    
    await recordAnchor(store, contract.contractId, anchor)
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal(retrieved.anchors?.[0].snapshotRef, 'snap-001')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - updates contract updatedAt', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    const originalUpdatedAt = contract.updatedAt
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await recordAnchor(store, contract.contractId, {
      timestamp: new Date().toISOString(),
      kind: 'stage-shift',
      description: 'Stage update',
    })
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.notEqual(retrieved.updatedAt, originalUpdatedAt)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - throws for non-existent contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    
    await assert.rejects(
      async () => recordAnchor(store, 'non-existent', {
        timestamp: new Date().toISOString(),
        kind: 'workflow-shift',
        description: 'Test',
      }),
      /not found/
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - supports multiple anchors in sequence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    // Record multiple anchors
    for (let i = 0; i < 5; i++) {
      await recordAnchor(store, contract.contractId, {
        timestamp: new Date().toISOString(),
        kind: 'stage-shift',
        description: `Stage ${i}`,
      })
    }
    
    const retrieved = await store.get(contract.contractId)
    assert.ok(retrieved !== null)
    assert.equal(retrieved.anchors?.length, 5)
    
    // Anchors should be in order
    for (let i = 0; i < 5; i++) {
      assert.equal(retrieved.anchors?.[i].description, `Stage ${i}`)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('AnchorRecorder - recordAnchor - persists to disk via store', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-anchor-recorder-'))
  
  try {
    const store = new ContractStore(directory)
    const contract = createTestContract()
    await store.create(contract)
    
    await recordAnchor(store, contract.contractId, {
      timestamp: new Date().toISOString(),
      kind: 'user-redirect',
      description: 'User redirected workflow',
    })
    
    // Create new store instance to verify persistence
    const newStore = new ContractStore(directory)
    const retrieved = await newStore.get(contract.contractId)
    
    assert.ok(retrieved !== null)
    assert.equal(retrieved.anchors?.length, 1)
    assert.equal(retrieved.anchors?.[0].kind, 'user-redirect')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
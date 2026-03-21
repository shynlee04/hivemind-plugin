import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import {
  validateDelegationRecord,
  formatValidationIssues,
} from '../src/delegation/delegation-record.schema.js'
import {
  createDelegationHandoff,
  readDelegationHandoff,
  listDelegationHandoffs,
} from '../src/delegation/delegation-store.js'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

describe('delegation schema validation', () => {
  it('rejects malformed delegation records with schema validation errors', async () => {
    const tempRoot = await mkdtemp(join(projectRoot, '..', 'hm-delegation-validation-'))

    try {
      // Create a malformed delegation record (missing required fields)
      const malformedRecord = {
        id: 'dlg_test123',
        // missing createdAt, updatedAt, status, summary, packet, evidence
      }

      const result = validateDelegationRecord(malformedRecord)
      assert.equal(result.ok, false, 'should reject malformed record')
      if (!result.ok) {
        assert.equal(result.error, 'SCHEMA_VALIDATION_FAILED')
        assert.ok(Array.isArray(result.issues), 'should have issues array')
        assert.ok(result.issues.length > 0, 'should have at least one issue')
      }
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('rejects record with invalid evidence kind', async () => {
    const tempRoot = await mkdtemp(join(projectRoot, '..', 'hm-delegation-kind-'))

    try {
      const invalidKindRecord = {
        id: 'dlg_test123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'open',
        summary: 'Test delegation',
        nextSteps: [],
        packet: {
          delegationId: 'dlg_test123',
          sourceSessionId: 'session_1',
          targetSessionId: 'session_2',
          sourceAgent: 'orchestrator',
          targetAgent: 'worker',
          trajectoryId: 'traj_1',
          workflowId: 'wf_1',
          taskIds: [],
          subtaskIds: [],
          scope: 'test scope',
          constraints: [],
          memoryScope: [],
          successMetrics: [],
          evidenceContractId: undefined,
          requiredEvidence: [],
          returnContract: 'test return',
          pressureContractId: 'delegated-handoff',
        },
        evidence: [
          {
            kind: 'invalid_kind', // Invalid - should be one of the allowed kinds
            description: 'test evidence',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      }

      const result = validateDelegationRecord(invalidKindRecord)
      assert.equal(result.ok, false, 'should reject invalid evidence kind')
      if (!result.ok) {
        assert.ok(
          result.issues.some((i) => i.path.includes('evidence')),
          'issue should mention evidence path',
        )
      }
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('accepts valid delegation records', () => {
    const validRecord = {
      id: 'dlg_test123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'open',
      summary: 'Test delegation',
      nextSteps: ['step 1', 'step 2'],
      packet: {
        delegationId: 'dlg_test123',
        sourceSessionId: 'session_1',
        targetSessionId: 'session_2',
        sourceAgent: 'orchestrator',
        targetAgent: 'worker',
        trajectoryId: 'traj_1',
        workflowId: 'wf_1',
        taskIds: ['task_1'],
        subtaskIds: [],
        scope: 'test scope',
        constraints: [],
        memoryScope: [],
        successMetrics: [],
        evidenceContractId: undefined,
        requiredEvidence: [
          {
            kind: 'command_output',
            description: 'command output',
            required: true,
          },
        ],
        returnContract: 'test return',
        pressureContractId: 'delegated-handoff',
      },
      evidence: [
        {
          kind: 'command_output',
          description: 'test evidence',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    }

    const result = validateDelegationRecord(validRecord)
    assert.equal(result.ok, true, 'should accept valid record')
    if (result.ok) {
      assert.equal(result.value.id, 'dlg_test123')
    }
  })

  it('formats validation issues for diagnostic output', () => {
    const malformedRecord = { id: 'test' }
    const result = validateDelegationRecord(malformedRecord)

    if (!result.ok) {
      const formatted = formatValidationIssues(result.issues)
      assert.ok(typeof formatted === 'string', 'should return string')
      assert.ok(formatted.length > 0, 'should have formatted content')
      // Should mention required fields
      assert.ok(
        formatted.includes('createdAt') || formatted.includes('updatedAt') || formatted.includes('status'),
        'should mention missing required fields',
      )
    }
  })

  it('rejects record with invalid status value', () => {
    const invalidStatusRecord = {
      id: 'dlg_test123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'invalid_status', // Should be 'open' | 'validated' | 'closed'
      summary: 'Test',
      nextSteps: [],
      packet: {
        sourceSessionId: 'session_1',
        targetSessionId: 'session_2',
        sourceAgent: 'orchestrator',
        targetAgent: 'worker',
        workflowId: 'wf_1',
        taskIds: [],
        subtaskIds: [],
        scope: 'test',
        constraints: [],
        memoryScope: [],
        successMetrics: [],
        requiredEvidence: [],
        returnContract: 'test',
        pressureContractId: 'delegated-handoff',
      },
      evidence: [],
    }

    const result = validateDelegationRecord(invalidStatusRecord)
    assert.equal(result.ok, false, 'should reject invalid status')
  })

  it('rejects record with missing nested packet fields', () => {
    const missingPacketRecord = {
      id: 'dlg_test123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'open',
      summary: 'Test',
      nextSteps: [],
      packet: {
        // missing sourceSessionId, targetSessionId, etc.
        workflowId: 'wf_1',
      },
      evidence: [],
    }

    const result = validateDelegationRecord(missingPacketRecord)
    assert.equal(result.ok, false, 'should reject missing packet fields')
    if (!result.ok) {
      assert.ok(
        result.issues.some((i) => i.path.some((p) => typeof p === 'string' && p.includes('sourceSessionId'))),
        'should mention sourceSessionId in issues',
      )
    }
  })
})

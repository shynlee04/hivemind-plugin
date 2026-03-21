/**
 * Task Ledger Corruption Recovery Tests
 *
 * Regression tests for CONCERNSV1.md - Cluster 7:
 * "Task ledgers silently recover from malformed state by resetting to empty structures"
 *
 * Issue: JSON parse errors at task-lifecycle.ts:86 silently return `{ version: '1.0.0', tasks: [] }`
 * instead of surfacing a repair-needed state.
 *
 * Fix: loadLifecycleState returns Result<TaskLifecycleState, CorruptionError> and
 * public APIs propagate corruption instead of masking.
 *
 * @see task-lifecycle.ts:74-88
 */

import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  readWorkflowTaskState,
  activateWorkflowTask,
  createWorkflowTask,
  type TaskLifecycleState,
} from '../src/core/workflow-management/task-lifecycle.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function withTempProject(f: (projectRoot: string) => Promise<void>): Promise<void> {
  const tmp = await mkdtemp(join(tmpdir(), 'hivemind-task-corruption-'))
  try {
    await f(tmp)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// CORRECT BEHAVIOR (what the fix should achieve):
//
// 1. File does not exist -> return empty state (ok: true)
// 2. File exists but JSON malformed -> return error result (ok: false, error: CorruptionError)
// 3. File exists with valid JSON -> return parsed state (ok: true)
//
// CURRENT BROKEN BEHAVIOR:
// - All 3 cases above return { version: '1.0.0', tasks: [] }
// - Case 2 corruption is silently masked
// ---------------------------------------------------------------------------

describe('task ledger corruption recovery', () => {
  describe('readWorkflowTaskState', () => {
    it('returns ok result with empty state when file does not exist', async () => {
      await withTempProject(async (projectRoot) => {
        const result = readWorkflowTaskState(projectRoot)
        assert.ok(result.ok, 'Should return ok result when file does not exist')
        assert.equal(result.value.version, '1.0.0')
        assert.deepEqual(result.value.tasks, [])
      })
    })

    it('SURFACES corruption when JSON is malformed - NOT silent fallback', async () => {
      await withTempProject(async (projectRoot) => {
        const tasksPath = join(projectRoot, '.hivemind', 'state', 'tasks.json')
        await mkdir(join(projectRoot, '.hivemind', 'state'), { recursive: true })
        await writeFile(tasksPath, '{ invalid json }', 'utf-8')

        // After fix: readWorkflowTaskState returns Result type
        // When corruption occurs, it returns { ok: false, error: CorruptionError }
        // NOT { version: '1.0.0', tasks: [] }
        const result = readWorkflowTaskState(projectRoot) as unknown as {
          ok?: boolean
          error?: { code: string }
          version?: string
          tasks?: unknown[]
        }

        if (result && 'ok' in result) {
          // Discriminated result type - corruption case
          assert.ok(!result.ok, 'Malformed JSON should produce error result')
          assert.equal(result.error?.code, 'TASK_LEDGER_CORRUPTION')
        } else {
          // Direct state return - check it's NOT the silent fallback
          // If we get here without throwing, the state must indicate corruption
          // Previously this would return { version: '1.0.0', tasks: [] } masking the error
          assert.fail(
            `Expected error result for corrupted JSON, got: ${JSON.stringify(result)}`,
          )
        }
      })
    })

    it('SURFACES corruption when JSON has valid syntax but invalid schema', async () => {
      await withTempProject(async (projectRoot) => {
        const tasksPath = join(projectRoot, '.hivemind', 'state', 'tasks.json')
        await mkdir(join(projectRoot, '.hivemind', 'state'), { recursive: true })
        // Valid JSON but missing required 'tasks' field
        await writeFile(tasksPath, JSON.stringify({ broken: 'schema' }), 'utf-8')

        const result = readWorkflowTaskState(projectRoot) as unknown as {
          ok?: boolean
          error?: { code: string }
        }

        // After fix: should detect invalid schema and return error
        if (result && 'ok' in result) {
          assert.ok(!result.ok, 'Invalid schema should produce error result')
        } else {
          assert.fail(
            `Expected error result for invalid schema, got: ${JSON.stringify(result)}`,
          )
        }
      })
    })
  })

  describe('activateWorkflowTask corruption handling', () => {
    it('throws CorruptionError when ledger is corrupted', async () => {
      await withTempProject(async (projectRoot) => {
        const tasksPath = join(projectRoot, '.hivemind', 'state', 'tasks.json')
        await mkdir(join(projectRoot, '.hivemind', 'state'), { recursive: true })
        await writeFile(tasksPath, '{ invalid json }', 'utf-8')

        // After fix: should throw CorruptionError instead of silently succeeding
        assert.throws(
          () => {
            activateWorkflowTask(projectRoot, {
              workflowId: 'wf-1',
              taskId: 'task-1',
              title: 'Test task',
            })
          },
          (err: unknown) => {
            if (err instanceof Error) {
              return err.message.includes('TASK_LEDGER_CORRUPTION') ||
                     err.message.includes('corruption') ||
                     err.message.includes('parse')
            }
            return false
          },
          'Should throw CorruptionError when ledger JSON is malformed',
        )
      })
    })
  })

  describe('createWorkflowTask corruption handling', () => {
    it('throws CorruptionError when ledger is corrupted', async () => {
      await withTempProject(async (projectRoot) => {
        const tasksPath = join(projectRoot, '.hivemind', 'state', 'tasks.json')
        await mkdir(join(projectRoot, '.hivemind', 'state'), { recursive: true })
        await writeFile(tasksPath, '{ invalid json }', 'utf-8')

        // After fix: should throw CorruptionError instead of silently succeeding
        assert.throws(
          () => {
            createWorkflowTask(projectRoot, {
              workflowId: 'wf-1',
              taskId: 'task-1',
              title: 'Test task',
            })
          },
          (err: unknown) => {
            if (err instanceof Error) {
              return err.message.includes('TASK_LEDGER_CORRUPTION') ||
                     err.message.includes('corruption') ||
                     err.message.includes('parse')
            }
            return false
          },
          'Should throw CorruptionError when ledger JSON is malformed',
        )
      })
    })
  })
})

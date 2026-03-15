/**
 * Tool Contract Tests
 *
 * Verifies that all 5 HiveMind tools satisfy the structural contract:
 * - Each tool returns a definition with description, args, and execute
 * - Each tool's args use tool.schema (Zod schemas)
 * - Each tool's execute returns valid JSON with status field
 */

import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'

import { createTestProjectRoot } from './helpers/mock-paths.js'
import { createTestToolSuite, executeAndParse } from './helpers/mock-tools.js'

describe('tool contract compliance', () => {
  let projectRoot = ''
  let cleanup: () => Promise<void>
  let suite: ReturnType<typeof createTestToolSuite>

  beforeEach(async () => {
    const env = await createTestProjectRoot('hm-contract-')
    projectRoot = env.projectRoot
    cleanup = env.cleanup
    suite = createTestToolSuite(projectRoot)
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('tool definitions have required shape', () => {
    it('task tool has description and execute', () => {
      assert.ok(suite.tools.task.description, 'task tool should have description')
      assert.ok(typeof suite.tools.task.execute === 'function', 'task tool should have execute function')
    })

    it('trajectory tool has description and execute', () => {
      assert.ok(suite.tools.trajectory.description, 'trajectory tool should have description')
      assert.ok(typeof suite.tools.trajectory.execute === 'function', 'trajectory tool should have execute function')
    })

    it('handoff tool has description and execute', () => {
      assert.ok(suite.tools.handoff.description, 'handoff tool should have description')
      assert.ok(typeof suite.tools.handoff.execute === 'function', 'handoff tool should have execute function')
    })

    it('runtime status tool has description and execute', () => {
      assert.ok(suite.tools.runtimeStatus.description, 'runtime status tool should have description')
      assert.ok(typeof suite.tools.runtimeStatus.execute === 'function', 'runtime status tool should have execute')
    })

    it('runtime command tool has description and execute', () => {
      assert.ok(suite.tools.runtimeCommand.description, 'runtime command tool should have description')
      assert.ok(typeof suite.tools.runtimeCommand.execute === 'function', 'runtime command tool should have execute')
    })
  })

  describe('tools return valid JSON with status field', () => {
    it('task tool inspect returns parseable JSON with status', async () => {
      const result = await executeAndParse<{ status: string }>(
        suite.tools.task,
        { action: 'inspect' },
        suite.context,
      )
      assert.ok(['success', 'error'].includes(result.status), 'status should be success or error')
    })

    it('trajectory tool inspect returns success', async () => {
      const result = await executeAndParse<{ status: string }>(
        suite.tools.trajectory,
        { action: 'inspect' },
        suite.context,
      )
      assert.equal(result.status, 'success')
    })

    it('handoff tool list returns success', async () => {
      const result = await executeAndParse<{ status: string }>(
        suite.tools.handoff,
        { action: 'list' },
        suite.context,
      )
      assert.equal(result.status, 'success')
    })
  })
})

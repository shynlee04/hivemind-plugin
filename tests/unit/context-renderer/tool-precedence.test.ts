import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { renderToolPrecedence, type ToolPrecedenceChain, type ToolPrecedenceEntry } from '../../../src/plugin/context-renderer.js'

describe('renderToolPrecedence', () => {
  describe('with full chain', () => {
    it('renders tool precedence with ordered chain and mandatory reads', () => {
      const chain: ToolPrecedenceChain = {
        chain: [
          { tool: 'hivemind_doc', action: 'read', args: { filePath: 'task_plan.md' } },
          { tool: 'hivemind_task', action: 'list', args: {} },
        ],
        mandatory_reads: [
          { path: '.hivemind/task_plan.md', reason: 'current_work_scope' },
        ],
      }

      const result = renderToolPrecedence(chain)

      // Verify JSON parsing works
      const parsed = JSON.parse(result)

      // Verify structure
      assert.equal(parsed.execution_rule, 'tool-precedence-chain')
      assert.ok(Array.isArray(parsed.tool_precedence))
      assert.ok(Array.isArray(parsed.mandatory_reads))

      // Verify tool_precedence array content
      assert.equal(parsed.tool_precedence.length, 2)
      assert.equal(parsed.tool_precedence[0].tool, 'hivemind_doc')
      assert.equal(parsed.tool_precedence[0].action, 'read')
      assert.deepEqual(parsed.tool_precedence[0].args, { filePath: 'task_plan.md' })
      assert.equal(parsed.tool_precedence[1].tool, 'hivemind_task')
      assert.equal(parsed.tool_precedence[1].action, 'list')
      assert.deepEqual(parsed.tool_precedence[1].args, {})

      // Verify mandatory_reads array content
      assert.equal(parsed.mandatory_reads.length, 1)
      assert.equal(parsed.mandatory_reads[0].path, '.hivemind/task_plan.md')
      assert.equal(parsed.mandatory_reads[0].reason, 'current_work_scope')
    })

    it('renders multi-step chain with complex args', () => {
      const chain: ToolPrecedenceChain = {
        chain: [
          { tool: 'hivemind_doc', action: 'read', args: { filePath: 'task_plan.md' } },
          { tool: 'hivemind_task', action: 'list', args: {} },
          { tool: 'hivemind_task', action: 'complete', args: { taskId: 'task-123' } },
          { tool: 'hivemind_doc', action: 'write', args: { filePath: 'progress.md', content: '# Progress' } },
        ],
        mandatory_reads: [
          { path: '.hivemind/task_plan.md', reason: 'current_work_scope' },
          { path: '.hivemind/progress.md', reason: 'tracking_state' },
        ],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.equal(parsed.tool_precedence.length, 4)
      assert.equal(parsed.mandatory_reads.length, 2)
    })
  })

  describe('empty chain handling', () => {
    it('renders empty chain with empty arrays', () => {
      const chain: ToolPrecedenceChain = {
        chain: [],
        mandatory_reads: [],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.equal(parsed.execution_rule, 'tool-precedence-chain')
      assert.deepEqual(parsed.tool_precedence, [])
      assert.deepEqual(parsed.mandatory_reads, [])
    })

    it('renders chain with no mandatory_reads', () => {
      const chain: ToolPrecedenceChain = {
        chain: [{ tool: 'hivemind_doc', action: 'read', args: { filePath: 'task_plan.md' } }],
        mandatory_reads: [],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.equal(parsed.tool_precedence.length, 1)
      assert.deepEqual(parsed.mandatory_reads, [])
    })
  })

  describe('mandatory_reads array serialization', () => {
    it('serializes multiple mandatory reads correctly', () => {
      const chain: ToolPrecedenceChain = {
        chain: [],
        mandatory_reads: [
          { path: '.hivemind/session.json', reason: 'active_session_state' },
          { path: '.hivemind/trajectory.json', reason: 'trajectory_history' },
          { path: '.hivemind/workflow.json', reason: 'workflow_state' },
        ],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.equal(parsed.mandatory_reads.length, 3)
      assert.equal(parsed.mandatory_reads[0].path, '.hivemind/session.json')
      assert.equal(parsed.mandatory_reads[0].reason, 'active_session_state')
      assert.equal(parsed.mandatory_reads[1].path, '.hivemind/trajectory.json')
      assert.equal(parsed.mandatory_reads[1].reason, 'trajectory_history')
      assert.equal(parsed.mandatory_reads[2].path, '.hivemind/workflow.json')
      assert.equal(parsed.mandatory_reads[2].reason, 'workflow_state')
    })

    it('handles special characters in paths correctly', () => {
      const chain: ToolPrecedenceChain = {
        chain: [],
        mandatory_reads: [
          { path: '.hivemind/path/with spaces/file.md', reason: 'file with spaces' },
          { path: '.hivemind/path/with-dashes/file.md', reason: 'file-with-dashes' },
        ],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.equal(parsed.mandatory_reads[0].path, '.hivemind/path/with spaces/file.md')
      assert.equal(parsed.mandatory_reads[1].path, '.hivemind/path/with-dashes/file.md')
    })
  })

  describe('JSON parsing verification', () => {
    it('produces valid JSON that can be parsed', () => {
      const chain: ToolPrecedenceChain = {
        chain: [
          { tool: 'hivemind_doc', action: 'read', args: { filePath: 'test.md' } },
        ],
        mandatory_reads: [
          { path: '.hivemind/test.md', reason: 'test_reason' },
        ],
      }

      const result = renderToolPrecedence(chain)

      // Should not throw
      assert.doesNotThrow(() => JSON.parse(result))

      // Should be valid JSON
      const parsed = JSON.parse(result)
      assert.ok(typeof parsed === 'object')
      assert.ok(parsed !== null)
    })

    it('output is valid JSON object with expected structure', () => {
      const chain: ToolPrecedenceChain = {
        chain: [],
        mandatory_reads: [],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      // Verify it's an object (not array or primitive)
      assert.equal(typeof parsed, 'object')
      assert.ok(!Array.isArray(parsed))

      // Verify required keys exist
      assert.ok('execution_rule' in parsed)
      assert.ok('tool_precedence' in parsed)
      assert.ok('mandatory_reads' in parsed)

      // Verify execution_rule is the correct value
      assert.equal(parsed.execution_rule, 'tool-precedence-chain')
    })
  })

  describe('ToolPrecedenceEntry interface compliance', () => {
    it('handles entry with empty args', () => {
      const entry: ToolPrecedenceEntry = {
        tool: 'hivemind_task',
        action: 'list',
        args: {},
      }

      const chain: ToolPrecedenceChain = {
        chain: [entry],
        mandatory_reads: [],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.deepEqual(parsed.tool_precedence[0].args, {})
    })

    it('handles entry with multiple args', () => {
      const entry: ToolPrecedenceEntry = {
        tool: 'hivemind_doc',
        action: 'write',
        args: {
          filePath: 'output.md',
          content: '# Test',
          append: true,
        },
      }

      const chain: ToolPrecedenceChain = {
        chain: [entry],
        mandatory_reads: [],
      }

      const result = renderToolPrecedence(chain)
      const parsed = JSON.parse(result)

      assert.deepEqual(parsed.tool_precedence[0].args, {
        filePath: 'output.md',
        content: '# Test',
        append: true,
      })
    })
  })
})

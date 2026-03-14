import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  activateWorkflowTask,
  bootstrapWorkflowAuthority,
  completeWorkflowTask,
  verifyWorkflowTask,
} from '../src/core/workflow-management/index.js'

describe('workflow task lifecycle', () => {
  it('preserves a single active task and invalidates the previous one when rotated', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-task-lifecycle-'))

    try {
      const authority = bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_task',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })

      const first = activateWorkflowTask(dir, {
        workflowId: 'wf_task',
        taskId: 'task_first',
        title: 'First active task',
      })
      const second = activateWorkflowTask(dir, {
        workflowId: 'wf_task',
        taskId: 'task_second',
        title: 'Second active task',
        forceNewActive: true,
      })

      assert.equal(first.activeTaskId, 'task_first')
      assert.equal(second.activeTaskId, 'task_second')
      assert.equal(second.invalidatedTaskIds.includes('task_first'), true)

      const parsed = JSON.parse(await readFile(authority.stateTasksPath, 'utf-8')) as {
        tasks: Array<{ id: string; status: string }>
      }
      const firstTask = parsed.tasks.find((task) => task.id === 'task_first')
      const secondTask = parsed.tasks.find((task) => task.id === 'task_second')
      assert.equal(firstTask?.status, 'invalidated')
      assert.equal(secondTask?.status, 'in_progress')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('flows verification state upward through task transitions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-task-verify-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_verify',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })

      activateWorkflowTask(dir, {
        workflowId: 'wf_verify',
        taskId: 'task_verify',
        title: 'Verification candidate',
      })
      verifyWorkflowTask(dir, {
        workflowId: 'wf_verify',
        taskId: 'task_verify',
        verificationContractId: 'vc_runtime',
      })
      const completed = completeWorkflowTask(dir, {
        workflowId: 'wf_verify',
        taskId: 'task_verify',
        evidenceRefs: ['report:verify'],
      })

      assert.equal(completed.completedTaskId, 'task_verify')
      assert.equal(completed.workflowVerificationState, 'validated')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

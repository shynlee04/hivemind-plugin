import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  bootstrapWorkflowAuthority,
  inspectWorkflowAuthority,
  repairWorkflowAuthority,
} from '../src/core/workflow-management/index.js'

describe('workflow authority', () => {
  it('bootstraps planning and task authority instead of session-centric state files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-workflow-authority-'))

    try {
      const status = bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_bootstrap',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })

      assert.equal(status.healthy, true)

      const tasksRaw = JSON.parse(await readFile(status.stateTasksPath, 'utf-8')) as { tasks: unknown[] }
      const graphRaw = JSON.parse(await readFile(status.graphTasksPath, 'utf-8')) as { tasks: unknown[] }
      assert.equal(tasksRaw.tasks.length, 0)
      assert.equal(graphRaw.tasks.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('repairs missing planning and task ledgers through workflow authority', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-workflow-repair-'))

    try {
      const initial = inspectWorkflowAuthority(dir, {
        workflowId: 'wf_repair',
        sessionScope: 'main',
      })
      assert.equal(initial.healthy, false)

      const repaired = repairWorkflowAuthority(dir, {
        workflowId: 'wf_repair',
        sessionScope: 'main',
      })

      assert.equal(repaired.status.healthy, true)
      assert.equal(repaired.repaired.includes('bootstrap-workflow-authority'), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

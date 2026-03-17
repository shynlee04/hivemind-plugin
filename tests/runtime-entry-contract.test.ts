import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { initProject } from '../src/cli/init.js'
import { runDoctorCommand } from '../src/cli/doctor.js'

describe('runtime entry contract', () => {
  it('exposes hm-init closeout semantics through the shared runtime-entry contract', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-init-'))

    try {
      const result = await initProject(dir, { presetId: 'guided-onboarding', silent: true })

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(result.nextCommand, 'hm-harness')
      assert.deepEqual(result.recommendedCommands, ['hm-harness', 'opencode attach', '/hm-plan'])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exposes hm-doctor recovery guidance through the shared runtime-entry contract', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-entry-doctor-'))
    const server = createServer((req, res) => {
      if (req.url === '/global/health') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ healthy: true, version: 'test-opencode' }))
        return
      }
      res.writeHead(404)
      res.end()
    })

    try {
      const initResult = await initProject(dir, { presetId: 'guided-onboarding', silent: true })
      await writeFile(join(dir, '.hivemind', 'state', 'trajectory-ledger.json'), '{not-json')
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

      const result = await runDoctorCommand(dir, {
        sessionId: initResult.sessionId,
        trajectoryId: initResult.trajectoryId,
        workflowId: initResult.workflowId,
      })

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(result.nextCommand, 'hm-harness')
      assert.deepEqual(result.recommendedCommands, ['hm-harness', 'opencode attach', '/hm-plan'])
    } finally {
      server.close()
      await rm(dir, { recursive: true, force: true })
    }
  })
})

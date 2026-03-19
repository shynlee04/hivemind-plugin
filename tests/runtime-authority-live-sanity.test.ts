import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createOpencode } from '@opencode-ai/sdk'

import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { attachManagedRuntime, createManagedRuntime } from '../src/control-plane/sdk-runtime.js'
import { bootstrapTrajectoryLedger } from '../src/core/trajectory/index.js'
import { bootstrapWorkflowAuthority } from '../src/core/workflow-management/index.js'
import { loadRuntimeBindingsSnapshot, saveRuntimeAttachmentSettings } from '../src/shared/runtime-attachment.js'

test('keeps authority singular across managed init and attached reuse flows', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hm-runtime-live-sanity-'))
  const runtime = await createOpencode({ port: 0 })

  try {
    const managed = await createManagedRuntime({
      sessionId: 'ses_live_managed',
      createLifecycle: (serverOptions) => createOpencode({
        ...serverOptions,
        port: 0,
      }),
    })
    assert.equal(managed.runtimeAuthority, 'managed-sdk')
    assert.match(managed.runtimeInstanceId, /^managed-sdk:ses_live_managed:/)

    const attached = attachManagedRuntime({
      baseUrl: runtime.server.url,
      directory: dir,
      runtimeInstanceId: `attached-sdk:ses_live_attach:${runtime.server.url}`,
    })
    assert.equal(attached.runtimeAuthority, 'attached-sdk')
    assert.equal(attached.serverBaseUrl, runtime.server.url)
    assert.ok(attached.client)

    await saveRuntimeAttachmentSettings(dir, {
      runtimeAuthority: attached.runtimeAuthority,
      runtimeInstanceId: attached.runtimeInstanceId,
      serverBaseUrl: attached.serverBaseUrl,
    })
    bootstrapWorkflowAuthority(dir, {
      workflowId: 'wf_live_attach',
      sessionScope: 'main',
      lineage: 'hivefiver',
    })
    await bootstrapTrajectoryLedger(dir, {
      trajectoryId: 'trj_live_attach',
      workflowId: 'wf_live_attach',
      sessionId: 'ses_live_attach',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task_live_attach'],
    })

    const bundle = findSlashCommandBundle('hm-init')
    assert.ok(bundle)

    const redirected = await executeSlashCommandBundle(bundle!, {
      projectRoot: dir,
      sessionId: 'ses_live_redirect',
      sessionScope: 'main',
      lineage: 'hivefiver',
      purposeClass: 'planning',
    })
    const report = redirected.report as {
      routeDisposition?: string
      next_command?: string
    }

    assert.equal(report.routeDisposition, 'attach')
    assert.equal(report.next_command, 'hm-harness')
    assert.equal(redirected.stateTransitions?.includes('attach-active-bootstrap-refused'), true)

    const snapshot = await loadRuntimeBindingsSnapshot(dir)
    assert.equal(snapshot.runtimeAuthority, 'attached-sdk')
    assert.equal(snapshot.serverBaseUrl, runtime.server.url)
    assert.equal(snapshot.runtimeInstanceId, attached.runtimeInstanceId)
  } finally {
    runtime.server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

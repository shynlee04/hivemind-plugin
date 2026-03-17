import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { bootstrapTrajectoryLedger } from '../src/core/trajectory/index.js'
import { bootstrapWorkflowAuthority } from '../src/core/workflow-management/index.js'
import { saveRuntimeAttachmentSettings } from '../src/shared/runtime-attachment.js'

describe('runtime turn output exports', () => {
  it('exports yaml and markdown turn projections for completed control-plane commands', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-turn-output-'))

    try {
      const bundle = findSlashCommandBundle('hm-init')
      assert.ok(bundle)

      const result = await executeSlashCommandBundle(bundle!, {
        projectRoot: dir,
        sessionId: 'ses_turn_output',
        sessionScope: 'main',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        trajectoryId: 'trj_turn_output',
        workflowId: 'wf_turn_output',
        preferredUserName: 'Apple',
        language: 'en',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'concise',
      })

      const yamlRef = result.artifactRefs?.find((ref) => ref.endsWith('.yaml'))
      const markdownRef = result.artifactRefs?.find((ref) => ref.endsWith('.md'))
      assert.ok(yamlRef)
      assert.ok(markdownRef)

      const yaml = await readFile(yamlRef!, 'utf-8')
      const markdown = await readFile(markdownRef!, 'utf-8')

      assert.match(yaml, /sessionId: ses_turn_output/)
      assert.match(yaml, /workflowId: wf_turn_output/)
      assert.match(markdown, /# HiveMind Turn Output/)
      assert.match(markdown, /trajectory: `trj_turn_output`/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('redirects hm-init to attach continuation when attached-sdk runtime authority is already healthy', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-turn-output-attach-'))

    try {
      await saveRuntimeAttachmentSettings(dir, {
        runtimeAuthority: 'attached-sdk',
        runtimeInstanceId: 'attached-sdk:ses_attach:http://127.0.0.1:4096',
        serverBaseUrl: 'http://127.0.0.1:4096',
      })
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_attach',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_attach',
        workflowId: 'wf_attach',
        sessionId: 'ses_attach_existing',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task_attach'],
      })

      const bundle = findSlashCommandBundle('hm-init')
      assert.ok(bundle)

      const result = await executeSlashCommandBundle(bundle!, {
        projectRoot: dir,
        sessionId: 'ses_attach_current',
        sessionScope: 'main',
        lineage: 'hivefiver',
        purposeClass: 'planning',
      })

      const report = result.report as {
        routeDisposition?: string
        next_command?: string
      }
      assert.equal(report.routeDisposition, 'attach')
      assert.equal(report.next_command, 'hm-harness')
      assert.equal(result.stateTransitions?.includes('attach-active-bootstrap-refused'), true)
      assert.notEqual(report.next_command, 'hm-init')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

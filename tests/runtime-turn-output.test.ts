import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'

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
})

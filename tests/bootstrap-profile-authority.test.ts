import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { initProject } from '../src/cli/init.js'
import { updateProjectSettings } from '../src/cli/settings.js'
import { loadRuntimeAttachmentSettings } from '../src/shared/runtime-attachment.js'

describe('bootstrap profile authority', () => {
  it('normalizes bootstrap profile language aliases during first init', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-bootstrap-profile-'))

    try {
      await initProject(dir, {
        preferredUserName: 'Apple',
        language: 'Vietnamese',
        artifactLanguage: 'EN',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'beginner',
        outputStyle: 'explanatory',
        silent: true,
      })

      const settings = await loadRuntimeAttachmentSettings(dir)
      assert.equal(settings.preferredUserName, 'Apple')
      assert.equal(settings.language, 'vi')
      assert.equal(settings.artifactLanguage, 'en')
      assert.equal(settings.governanceMode, 'strict')
      assert.equal(settings.automationLevel, 'guided')
      assert.equal(settings.expertLevel, 'beginner')
      assert.equal(settings.outputStyle, 'explanatory')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('requires complete explicit bootstrap flags or a preset in non-interactive init', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-bootstrap-noninteractive-'))

    try {
      await assert.rejects(
        () => initProject(dir, {
          language: 'vi',
          governanceMode: 'strict',
          silent: true,
        }),
        /hm-init requires explicit profile intake before execution/,
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('keeps hm-init bootstrap-authoritative and reserves reconfiguration for settings', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-bootstrap-guard-'))

    try {
      await initProject(dir, {
        preferredUserName: 'Apple',
        language: 'vi',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'architecture',
        silent: true,
      })

      await initProject(dir, {
        preferredUserName: 'Codex',
        language: 'en',
        artifactLanguage: 'vi',
        governanceMode: 'assisted',
        automationLevel: 'assisted',
        expertLevel: 'beginner',
        outputStyle: 'concise',
        silent: true,
      })

      const afterSecondInit = await loadRuntimeAttachmentSettings(dir)
      assert.equal(afterSecondInit.preferredUserName, 'Apple')
      assert.equal(afterSecondInit.language, 'vi')
      assert.equal(afterSecondInit.artifactLanguage, 'en')
      assert.equal(afterSecondInit.governanceMode, 'strict')
      assert.equal(afterSecondInit.automationLevel, 'guided')
      assert.equal(afterSecondInit.expertLevel, 'advanced')
      assert.equal(afterSecondInit.outputStyle, 'architecture')

      await updateProjectSettings(dir, {
        preferredUserName: 'Codex',
        artifactLanguage: 'Vietnamese',
        automationLevel: 'coach',
      })

      const afterSettings = await loadRuntimeAttachmentSettings(dir)
      assert.equal(afterSettings.preferredUserName, 'Codex')
      assert.equal(afterSettings.artifactLanguage, 'vi')
      assert.equal(afterSettings.automationLevel, 'coach')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

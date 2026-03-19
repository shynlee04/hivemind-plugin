import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import { loadCommandAsset } from '../src/features/runtime-entry/instruction-loader.js'

const runtimeEntryFiles = [
  'src/features/runtime-entry/settings.ts',
  'src/features/runtime-entry/init.ts',
  'src/features/runtime-entry/harness.ts',
  'src/features/runtime-entry/handler-shared.ts',
  'src/features/runtime-entry/doctor.ts',
  'src/features/runtime-entry/command.ts',
] as const

describe('runtime entry loader authority', () => {
  it('loads command assets from the feature-owned runtime entry loader', async () => {
    const asset = await loadCommandAsset('hm-init')

    assert.equal(asset.fileName, 'hm-init.md')
    assert.equal(typeof asset.frontmatter, 'object')
    assert.ok(asset.body.length > 0)
    assert.ok(asset.raw.includes('hm-init'))
  })

  it('points runtime-entry consumers at the feature-owned loader path', async () => {
    const contents = await Promise.all(runtimeEntryFiles.map((file) => readFile(file, 'utf8')))

    for (const source of contents) {
      assert.equal(source.includes('hooks/runtime-bridge/instruction-loader'), false)
      assert.equal(source.includes('./instruction-loader.js'), true)
    }
  })
})

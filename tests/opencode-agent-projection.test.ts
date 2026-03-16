import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { syncRuntimeSurface } from '../src/cli/runtime-assets.js'
import { discoverSlashCommandBundles } from '../src/commands/slash-command/index.js'
import {
  createOpencodeAgentRegistry,
  validateSlashCommandAgentBindings,
} from '../src/shared/opencode-agent-registry.js'

describe('opencode agent projection', () => {
  it('projects canonical agents into OpenCode-safe runtime frontmatter', async () => {
    const registry = await createOpencodeAgentRegistry(process.cwd())

    assert.ok(registry.length >= 8)

    const hivefiver = registry.find((entry) => entry.id === 'hivefiver')
    assert.ok(hivefiver)
    assert.ok(hivefiver?.canonicalFrontmatter.contract)
    assert.equal('contract' in (hivefiver?.runtimeFrontmatter ?? {}), false)
    assert.match(hivefiver?.runtimeMarkdown ?? '', /^---\n/)
    assert.doesNotMatch(hivefiver?.runtimeMarkdown ?? '', /\ncontract:/)
    assert.equal(hivefiver?.runtimeFrontmatter.mode, 'all')
    assert.equal(typeof hivefiver?.runtimeFrontmatter.description, 'string')
  })

  it('writes projected runtime agent files instead of copying canonical frontmatter wholesale', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-agent-projection-'))

    try {
      await syncRuntimeSurface(dir)

      const projected = await readFile(join(dir, '.opencode', 'agents', 'hivefiver.md'), 'utf-8')
      assert.match(projected, /^---\n/)
      assert.match(projected, /mode: all/)
      assert.match(projected, /description: /)
      assert.doesNotMatch(projected, /\ncontract:/)
      assert.match(projected, /# HiveFiver/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('ensures every slash command bundle targets a registered projected agent', async () => {
    const registry = await createOpencodeAgentRegistry(process.cwd())
    const validation = validateSlashCommandAgentBindings(discoverSlashCommandBundles(), registry)

    assert.deepEqual(validation.missingAgentIds, [])
  })
})

import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { discoverSlashCommandBundles } from '../src/commands/slash-command/command-discovery.js'
import { syncRuntimeSurface } from '../src/cli/runtime-assets.js'
import { createOpencodeAgentRegistry } from '../src/shared/opencode-agent-registry.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

describe('runtime surface sync', () => {
  it('writes the authoritative plugin, command, and agent mirrors deterministically', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-surface-sync-'))

    try {
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })
      await writeFile(join(projectRoot, '.opencode', 'commands', 'hm-plan.md'), 'stale command')
      await writeFile(join(projectRoot, '.opencode', 'commands', 'hivemind-status.md'), 'stale extra command')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'hivefiver.md'), 'stale agent')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'legacy-agent.md'), 'stale extra agent')
      await writeFile(join(projectRoot, '.opencode', 'plugins', 'hivemind-context-governance.ts'), 'stale plugin')

      const first = await syncRuntimeSurface(projectRoot)
      const second = await syncRuntimeSurface(projectRoot)
      const mirroredCommands = (await readdir(join(projectRoot, '.opencode', 'commands'))).sort()
      const mirroredAgents = (await readdir(join(projectRoot, '.opencode', 'agents'))).sort()
      const expectedCommands = discoverSlashCommandBundles()
        .map((bundle) => bundle.commandFile)
        .sort()
      const expectedAgents = createOpencodeAgentRegistry(repoRoot)
        .map((entry) => `${entry.id}.md`)
        .sort()
      const hivefiverProjection = createOpencodeAgentRegistry(repoRoot)
        .find((entry) => entry.id === 'hivefiver')

      assert.deepEqual(mirroredCommands, expectedCommands)
      assert.deepEqual(mirroredAgents, expectedAgents)
      assert.deepEqual(second, first)
      assert.equal(mirroredCommands.includes('hivemind-status.md'), false)
      assert.equal(mirroredCommands.includes('hm-plan.md'), true)
      assert.equal(mirroredCommands.includes('hm-implement.md'), true)
      assert.equal(mirroredAgents.includes('legacy-agent.md'), false)
      assert.match(
        await readFile(first.pluginFile, 'utf8'),
        /import plugin from 'hivemind-context-governance\/plugin'/,
      )
      assert.equal(
        await readFile(join(projectRoot, '.opencode', 'commands', 'hm-plan.md'), 'utf8'),
        await readFile(join(repoRoot, 'commands', 'hm-plan.md'), 'utf8'),
      )
      assert.equal(
        await readFile(join(projectRoot, '.opencode', 'agents', 'hivefiver.md'), 'utf8'),
        hivefiverProjection?.runtimeMarkdown,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

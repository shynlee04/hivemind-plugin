import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { syncRuntimeSurface } from '../src/cli/runtime-assets.js'

const MTIME_TICK_MS = 50

describe('runtime surface sync', () => {
  it('writes only the plugin stub to .opencode/plugins/ deterministically', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-surface-sync-'))

    try {
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })
      await writeFile(join(projectRoot, '.opencode', 'plugins', 'hivemind-context-governance.ts'), 'stale plugin')

      const first = await syncRuntimeSurface(projectRoot)
      const pluginPath = first.pluginFile
      const firstPluginStat = await stat(pluginPath)

      await new Promise((resolve) => setTimeout(resolve, MTIME_TICK_MS))

      const second = await syncRuntimeSurface(projectRoot)

      assert.deepEqual(second, first)
      assert.equal((await stat(pluginPath)).mtimeMs, firstPluginStat.mtimeMs)
      assert.match(
        await readFile(first.pluginFile, 'utf8'),
        /import plugin from 'hivemind-context-governance\/plugin'/,
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('does not create .opencode/commands, .opencode/agents, or .opencode/skills directories', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-surface-sync-'))

    try {
      const result = await syncRuntimeSurface(projectRoot)

      assert.ok(result.pluginFile.endsWith('.opencode/plugins/hivemind-context-governance.ts'))

      const commandsDir = join(projectRoot, '.opencode', 'commands')
      const agentsDir = join(projectRoot, '.opencode', 'agents')
      const skillsDir = join(projectRoot, '.opencode', 'skills')

      assert.equal(await fileExists(commandsDir), false, 'commands directory should not be created')
      assert.equal(await fileExists(agentsDir), false, 'agents directory should not be created')
      assert.equal(await fileExists(skillsDir), false, 'skills directory should not be created')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

async function fileExists(path: string): Promise<boolean> {
  try {
    const { stat } = await import('node:fs/promises')
    await stat(path)
    return true
  } catch {
    return false
  }
}

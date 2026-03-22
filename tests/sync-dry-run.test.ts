import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { syncRuntimeSurface } from '../src/features/runtime-observability/sync.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

describe('runtime surface sync dry-run mode', () => {
  it('dry-run mode still writes plugin stub without affecting existing files', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-dryrun-'))

    try {
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })

      await writeFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'plugins', 'hivemind-context-governance.ts'), 'stale plugin')

      const result = await syncRuntimeSurface(projectRoot, {
        packageRoot: repoRoot,
        localPluginFile: 'hivemind-context-governance.ts',
        packagePluginName: 'hivemind-context-governance',
        packagePluginEntry: 'hivemind-context-governance/plugin',
        dryRun: true,
      })

      assert.equal(result.pluginFile.endsWith('hivemind-context-governance.ts'), true)
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale command file should still exist',
      )
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale agent file should still exist',
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('normal mode only writes plugin stub without affecting existing files', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-sync-'))

    try {
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })

      await writeFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'stale content')

      const result = await syncRuntimeSurface(projectRoot, {
        packageRoot: repoRoot,
        localPluginFile: 'hivemind-context-governance.ts',
        packagePluginName: 'hivemind-context-governance',
        packagePluginEntry: 'hivemind-context-governance/plugin',
      })

      assert.equal(result.pluginFile.endsWith('hivemind-context-governance.ts'), true)
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale command file should still exist',
      )
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale agent file should still exist',
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

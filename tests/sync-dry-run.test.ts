import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { syncRuntimeSurface } from '../src/features/runtime-observability/sync.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

describe('runtime surface sync dry-run mode', () => {
  it('dry-run mode returns would-delete list without removing files', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-dryrun-'))

    try {
      // Setup: create existing unmanaged files that should be deleted
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'skills'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })

      // Create stale unmanaged files
      await writeFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'stale content')

      // Run sync with dry-run
      const result = await syncRuntimeSurface(projectRoot, {
        packageRoot: repoRoot,
        localPluginFile: 'hivemind-context-governance.ts',
        packagePluginName: 'hivemind-context-governance',
        packagePluginEntry: 'hivemind-context-governance/plugin',
        dryRun: true,
      })

      // Verify files still exist
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale command file should still exist after dry-run',
      )
      assert.ok(
        await readFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'utf-8')
          .then(() => true)
          .catch(() => false),
        'stale agent file should still exist after dry-run',
      )

      // Verify dry-run result structure
      assert.ok(result.wouldDelete, 'should have wouldDelete array')
      assert.ok(Array.isArray(result.wouldDelete), 'wouldDelete should be array')
      assert.equal(result.dryRun, true, 'dryRun flag should be true')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('protected paths are not listed in would-delete', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-protected-'))

    try {
      // Setup: create existing unmanaged files
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })

      // Create stale unmanaged files
      await writeFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'my-custom-agent.md'), 'stale content')

      // Run sync with dry-run and protected paths
      const result = await syncRuntimeSurface(projectRoot, {
        packageRoot: repoRoot,
        localPluginFile: 'hivemind-context-governance.ts',
        packagePluginName: 'hivemind-context-governance',
        packagePluginEntry: 'hivemind-context-governance/plugin',
        dryRun: true,
        protectedPaths: [
          join(projectRoot, '.opencode', 'agents', 'my-custom-agent.md'),
        ],
      })

      // Verify protected file is not in wouldDelete
      const wouldDeleteSet = new Set(result.wouldDelete ?? [])
      assert.ok(
        !wouldDeleteSet.has(join(projectRoot, '.opencode', 'agents', 'my-custom-agent.md')),
        'protected path should not be in wouldDelete list',
      )
      assert.ok(result.protected, 'should have protected array')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('normal mode actually removes unmanaged files', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-sync-'))

    try {
      // Setup: create existing unmanaged files
      await mkdir(join(projectRoot, '.opencode', 'commands'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'agents'), { recursive: true })
      await mkdir(join(projectRoot, '.opencode', 'plugins'), { recursive: true })

      // Create stale unmanaged files
      await writeFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'stale content')
      await writeFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'stale content')

      // Run sync normally (no dry-run)
      await syncRuntimeSurface(projectRoot, {
        packageRoot: repoRoot,
        localPluginFile: 'hivemind-context-governance.ts',
        packagePluginName: 'hivemind-context-governance',
        packagePluginEntry: 'hivemind-context-governance/plugin',
      })

      // Verify stale files are gone
      assert.ok(
        !(await readFile(join(projectRoot, '.opencode', 'commands', 'stale-command.md'), 'utf-8')
          .then(() => true)
          .catch(() => false)),
        'stale command file should be removed',
      )
      assert.ok(
        !(await readFile(join(projectRoot, '.opencode', 'agents', 'stale-agent.md'), 'utf-8')
          .then(() => true)
          .catch(() => false)),
        'stale agent file should be removed',
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

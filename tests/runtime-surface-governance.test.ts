import assert from 'node:assert/strict'
import { lstat, readdir, readFile, readlink } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { discoverSlashCommandBundles } from '../src/commands/slash-command/command-discovery.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const resolved = join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectTypeScriptFiles(resolved)
    }
    return resolved.endsWith('.ts') ? [resolved] : []
  }))
  return files.flat()
}

describe('runtime surface governance', () => {
  it('keeps shipped hivemind command assets free of legacy root planning file references', async () => {
    const commandDirectory = join(repoRoot, 'commands')
    const files = (await readdir(commandDirectory))
      .filter((file) => file.startsWith('hivemind-') && file.endsWith('.md'))
      .sort()

    const offenders: string[] = []
    for (const file of files) {
      const source = await readFile(join(commandDirectory, file), 'utf-8')
      if (/(task_plan|progress|findings)\.md/.test(source)) {
        offenders.push(file)
      }
    }

    assert.deepEqual(offenders, [])
  })

  it('documents the single installation guide instead of the legacy assisted init quickstart', async () => {
    const source = await readFile(join(repoRoot, 'README.md'), 'utf-8')

    assert.match(source, /Install and configure HiveMind by following the instructions here:/)
    assert.match(source, /docs\/guide\/installation\.md/)
    assert.doesNotMatch(source, /docs\/guide\/installation-\d{4}-\d{2}-\d{2}\.md/)
    assert.doesNotMatch(source, /init --mode assisted/)
  })

  it('binds governance docs to the real runtime command registry and entry surfaces', async () => {
    const [rootAgents, commandAgents, slashCommandAgents] = await Promise.all([
      readFile(join(repoRoot, 'AGENTS.md'), 'utf-8'),
      readFile(join(repoRoot, 'commands', 'AGENTS.md'), 'utf-8'),
      readFile(join(repoRoot, 'src', 'commands', 'slash-command', 'AGENTS.md'), 'utf-8'),
    ])

    const bundleCount = discoverSlashCommandBundles().length

    assert.match(rootAgents, /Live install\/runtime entry is limited to `dist\/cli\.js` binaries/i)
    assert.match(rootAgents, /A root `commands\/\*\.md` file is a live runtime command surface only when registered/i)
    assert.match(rootAgents, /Unregistered command markdown is documentation or legacy material/i)
    assert.match(rootAgents, /SOT and governance paths must stay stable and non-date-stamped/i)
    assert.match(rootAgents, /Compatibility entry files should prefer symlinks back to the stable authority surface/i)

    assert.match(commandAgents, /reserved for bundle-backed or control-plane-adapter command assets/i)
    assert.match(commandAgents, /If a command file is not referenced by `src\/commands\/slash-command\/command-bundles\.ts`/i)
    assert.match(commandAgents, /may not rely on `\.opencode\/skills\/\*\*` shell pipelines/i)

    assert.match(slashCommandAgents, new RegExp(`registers ${bundleCount} command bundles`, 'i'))
    assert.match(slashCommandAgents, /Mirror scope equals `discoverSlashCommandBundles\(\)`/i)
    assert.match(slashCommandAgents, /Bundle metadata is runtime authority/i)
  })

  it('keeps stable governance entries and symlinked compatibility paths for SOT-facing docs', async () => {
    const stableInstallPath = join(repoRoot, 'docs', 'guide', 'installation.md')
    const datedInstallPath = join(repoRoot, 'docs', 'guide', 'installation-2026-03-17.md')
    const claudePath = join(repoRoot, 'CLAUDE.md')

    const [stableInstallStat, datedInstallStat, claudeStat] = await Promise.all([
      lstat(stableInstallPath),
      lstat(datedInstallPath),
      lstat(claudePath),
    ])

    assert.equal(stableInstallStat.isFile(), true)
    assert.equal(datedInstallStat.isSymbolicLink(), true)
    assert.equal(await readlink(datedInstallPath), 'installation.md')
    assert.equal(claudeStat.isSymbolicLink(), true)
    assert.equal(await readlink(claudePath), 'AGENTS.md')
  })

  it('limits runtime projection writes to first-run and repair entry flows inside src', async () => {
    const sourceFiles = await collectTypeScriptFiles(join(repoRoot, 'src'))
    const callers: string[] = []
    const definitions: string[] = []

    for (const file of sourceFiles) {
      const source = await readFile(file, 'utf-8')
      const relativePath = relative(repoRoot, file)
      if (/function syncRuntimeSurface\(/.test(source)) {
        definitions.push(relativePath)
      }
      if (/syncRuntimeSurface\(/.test(source) && !/function syncRuntimeSurface\(/.test(source)) {
        callers.push(relativePath)
      }
    }

    assert.deepEqual(definitions, ['src/cli/runtime-assets.ts'])
    assert.deepEqual(callers.sort(), [
      'src/cli/init.ts',
      'src/control-plane/control-plane-handler.ts',
    ])
  })
})

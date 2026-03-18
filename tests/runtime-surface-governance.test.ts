import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

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
  it('keeps shipped command assets free of legacy planning file references', async () => {
    const commandDirectory = join(repoRoot, 'commands')
    const files = (await readdir(commandDirectory))
      .filter((file) => file.endsWith('.md'))
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

  it('limits runtime projection writes to src only', async () => {
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

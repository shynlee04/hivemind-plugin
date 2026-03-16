import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  readChunked,
  readSection,
  searchDocuments,
  skimDirectory,
  skimDocument,
} from '../src/intelligence/doc/index.js'

async function createDocProject(): Promise<string> {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doc-intel-'))
  await mkdir(join(projectRoot, 'docs', 'guides'), { recursive: true })

  await writeFile(
    join(projectRoot, 'docs', 'guides', 'intro.md'),
    [
      '---',
      'title: Intro Guide',
      'owner: hivefiver',
      '---',
      '',
      '# Intro',
      '',
      'Welcome to the guide.',
      '',
      '## Setup',
      '',
      'Install the runtime bridge and verify the plugin boundary.',
      '',
      '## Verify',
      '',
      'Search should find plugin boundary guidance here.',
      '',
    ].join('\n'),
    'utf-8',
  )

  await writeFile(
    join(projectRoot, 'docs', 'guides', 'faq.md'),
    [
      '# FAQ',
      '',
      '## Boundaries',
      '',
      'The plugin boundary should stay assembly-only.',
      '',
    ].join('\n'),
    'utf-8',
  )

  return projectRoot
}

describe('doc intelligence read foundation', () => {
  it('skims a markdown document with metadata and outline', async () => {
    const projectRoot = await createDocProject()

    const skim = await skimDocument(projectRoot, 'docs/guides/intro.md')

    assert.equal(skim.path, 'docs/guides/intro.md')
    assert.equal(skim.metadata?.title, 'Intro Guide')
    assert.equal(skim.outline[0]?.text, 'Intro')
    assert.equal(skim.outline[0]?.children[0]?.text, 'Setup')
    assert.equal(skim.lineCount > 0, true)
    assert.equal(skim.tokenEstimate > 0, true)
  })

  it('reads a targeted markdown section body', async () => {
    const projectRoot = await createDocProject()

    const section = await readSection(projectRoot, 'docs/guides/intro.md', 'Setup')

    assert.equal(section, 'Install the runtime bridge and verify the plugin boundary.')
  })

  it('reads markdown content in bounded chunks', async () => {
    const projectRoot = await createDocProject()

    const chunks = await readChunked(projectRoot, 'docs/guides/intro.md', undefined, 10)

    assert.equal(chunks.length >= 2, true)
    assert.equal(chunks.every((chunk) => chunk.tokenEstimate > 0), true)
    assert.equal(chunks.some((chunk) => chunk.heading === 'Setup'), true)
  })

  it('searches markdown documents without hivemind runtime state', async () => {
    const projectRoot = await createDocProject()

    const results = await searchDocuments(projectRoot, 'docs', 'plugin boundary', '.md')

    assert.equal(results.length >= 2, true)
    assert.equal(results.some((entry) => entry.path === 'docs/guides/intro.md'), true)
    assert.equal(results.some((entry) => entry.path === 'docs/guides/faq.md'), true)
  })

  it('skims a markdown directory as a standalone library surface', async () => {
    const projectRoot = await createDocProject()

    const skims = await skimDirectory(projectRoot, 'docs', '.md')

    assert.equal(skims.length, 2)
    assert.equal(skims.every((entry) => entry.path.startsWith('docs/')), true)
  })
})

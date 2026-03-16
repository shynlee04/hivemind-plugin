import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  agentToolCatalog,
  createHivemindDocTool,
  createHivemindRuntimeCommandTool,
  createHivemindRuntimeStatusTool,
} from '../src/tools/index.js'
import { createRuntimeSurfaceRegistry } from '../src/plugin/index.js'

const mockContext = {
  sessionID: 'ses-runtime',
  messageID: 'msg-runtime',
  agent: 'hivefiver',
  directory: '',
  worktree: '',
  abort: new AbortController().signal,
  metadata() {
    return undefined
  },
  ask: async () => undefined,
} as const

describe('runtime tools', () => {
  it('registers runtime tools as first-class tool modules and canonical runtime surfaces', async () => {
    const surfaces = createRuntimeSurfaceRegistry()
    const docSurface = surfaces.find((entry) => entry.id === 'hivemind_doc')
    const runtimeStatusSurface = surfaces.find((entry) => entry.id === 'hivemind_runtime_status')
    const runtimeCommandSurface = surfaces.find((entry) => entry.id === 'hivemind_runtime_command')
    const contextInjectionSurface = surfaces.find((entry) => entry.id === 'context-injection')
    const promptTransformationSurface = surfaces.find((entry) => entry.id === 'prompt-transformation')
    const compactionSurface = surfaces.find((entry) => entry.id === 'hm-plan')

    assert.equal(agentToolCatalog.some((entry) => entry.id === 'hivemind_doc'), true)
    assert.equal(agentToolCatalog.some((entry) => entry.id === 'hivemind_runtime_status'), true)
    assert.equal(agentToolCatalog.some((entry) => entry.id === 'hivemind_runtime_command'), true)
    assert.equal(docSurface?.contractFile, 'src/tools/doc/tools.ts')
    assert.equal(runtimeStatusSurface?.contractFile, 'src/tools/runtime/tools.ts')
    assert.equal(runtimeCommandSurface?.contractFile, 'src/tools/runtime/tools.ts')
    assert.equal(contextInjectionSurface?.hostEvent, 'experimental.chat.messages.transform')
    assert.equal(promptTransformationSurface?.hostEvent, 'experimental.chat.messages.transform')
    assert.equal(compactionSurface?.hostEvent, 'slash-command.requested')
  })

  it('executes extracted runtime status and command tools through the tool module family', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-runtime-tools-'))

    try {
      const runtimeStatus = createHivemindRuntimeStatusTool(projectRoot)
      const runtimeCommand = createHivemindRuntimeCommandTool(projectRoot)

      const statusPayload = JSON.parse(await runtimeStatus.execute({}, {
        ...mockContext,
        directory: projectRoot,
        worktree: projectRoot,
      })) as {
        attached: boolean
        hasRuntimeAttachment: boolean
        availableCommands: string[]
      }
      assert.equal(statusPayload.attached, true)
      assert.equal(statusPayload.hasRuntimeAttachment, false)
      assert.equal(statusPayload.availableCommands.includes('hm-init'), true)

      const gatedPayload = JSON.parse(await runtimeCommand.execute({
        command: 'hm-init',
      }, {
        ...mockContext,
        directory: projectRoot,
        worktree: projectRoot,
      })) as {
        executionMode: string
        report: { status: string }
      }

      assert.equal(gatedPayload.executionMode, 'question-gate')
      assert.equal(gatedPayload.report.status, 'intake-required')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('executes the read-only hivemind_doc tool through the tool module family', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'hm-doc-tool-'))

    try {
      const docsDir = join(projectRoot, 'docs')
      await import('node:fs/promises').then(({ mkdir, writeFile }) => Promise.all([
        mkdir(docsDir, { recursive: true }),
        writeFile(
          join(docsDir, 'guide.md'),
          ['---', 'title: Tool Guide', '---', '', '# Intro', '', '## Setup', '', 'Tool verification text lives here.', ''].join('\n'),
          'utf-8',
        ),
      ]))

      const docTool = createHivemindDocTool(projectRoot)

      const skimPayload = JSON.parse(await docTool.execute({
        action: 'skim',
        filePath: 'docs/guide.md',
      }, {
        ...mockContext,
        directory: projectRoot,
        worktree: projectRoot,
      })) as {
        status: string
        data: { path: string; metadata: { title: string } }
      }

      assert.equal(skimPayload.status, 'success')
      assert.equal(skimPayload.data.path, 'docs/guide.md')
      assert.equal(skimPayload.data.metadata.title, 'Tool Guide')

      const readPayload = JSON.parse(await docTool.execute({
        action: 'read',
        filePath: 'docs/guide.md',
        heading: 'Setup',
      }, {
        ...mockContext,
        directory: projectRoot,
        worktree: projectRoot,
      })) as {
        data: string | null
      }

      assert.equal(readPayload.data, 'Tool verification text lives here.')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

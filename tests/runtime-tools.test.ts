import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  agentToolCatalog,
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
    const runtimeStatusSurface = surfaces.find((entry) => entry.id === 'hivemind_runtime_status')
    const runtimeCommandSurface = surfaces.find((entry) => entry.id === 'hivemind_runtime_command')
    const contextInjectionSurface = surfaces.find((entry) => entry.id === 'context-injection')
    const promptTransformationSurface = surfaces.find((entry) => entry.id === 'prompt-transformation')
    const compactionSurface = surfaces.find((entry) => entry.id === 'hm-plan')

    assert.equal(agentToolCatalog.some((entry) => entry.id === 'hivemind_runtime_status'), true)
    assert.equal(agentToolCatalog.some((entry) => entry.id === 'hivemind_runtime_command'), true)
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
})

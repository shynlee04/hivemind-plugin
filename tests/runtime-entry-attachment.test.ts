import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { findSlashCommandBundle, executeSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { syncRuntimeSurface } from "../src/cli/runtime-assets.js"
import { HiveMindPlugin } from "../src/index.js"
import { loadRuntimeBindingsSnapshot } from '../src/shared/runtime-attachment.js'
import { createHivemindRuntimeStatusTool } from '../src/tools/index.js'

function createToolContext(directory: string, sessionID = 'ses_runtime_tool') {
  return {
    sessionID,
    messageID: 'msg_runtime_tool',
    agent: 'hivefiver',
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata() {
      return undefined
    },
    ask: async () => undefined,
  }
}

describe("runtime entry attachment", () => {
  it("syncs project-level OpenCode assets for downstream project installs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-runtime-surface-"))

    try {
      const result = await syncRuntimeSurface(dir)
      const pluginSource = await readFile(result.pluginFile, "utf-8")
      const configSource = await readFile(join(dir, "opencode.json"), "utf-8")

      assert.match(pluginSource, /hivemind-context-governance\/plugin/)
      assert.equal(result.mirroredCommandFiles.some((file) => file.endsWith("hm-init.md")), true)
      assert.equal(result.mirroredCommandFiles.some((file) => file.endsWith("hm-plan.md")), true)
      assert.equal(result.mirroredAgentFiles.some((file) => file.endsWith("hivefiver.md")), true)
      assert.equal(JSON.parse(configSource).plugin.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("re-exports the OpenCode plugin from the package root", () => {
    assert.equal(typeof HiveMindPlugin, "function")
  })

  it('records managed runtime authority consistently across hm-init attachment and runtime status', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-managed-runtime-'))

    try {
      const bundle = findSlashCommandBundle('hm-init')
      assert.ok(bundle)

      const result = await executeSlashCommandBundle(bundle!, {
        projectRoot: dir,
        sessionId: 'wf_managed_runtime',
        sessionScope: 'main',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        preferredUserName: 'Apple',
        language: 'en',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'concise',
      })

      const snapshot = await loadRuntimeBindingsSnapshot(dir)
      const runtimeStatus = createHivemindRuntimeStatusTool(dir)
      const status = JSON.parse(await runtimeStatus.execute({}, createToolContext(dir, 'wf_managed_runtime'))) as {
        runtimeState: {
          runtimeAuthority: string
          runtimeInstanceId?: string
          serverBaseUrl?: string
        }
        supervisorState: {
          registry: {
            instances: Array<{
              instanceId: string
              runtimeAuthority: string
              runtimeInstanceId?: string
              serverBaseUrl?: string
            }>
          }
        }
      }

      assert.equal(result.closeoutStatus, 'qa-pending')
      assert.equal(snapshot.runtimeAuthority, 'managed-sdk')
      assert.match(snapshot.runtimeInstanceId ?? '', /^managed-sdk:wf_managed_runtime:http:\/\//)
      assert.match(snapshot.serverBaseUrl ?? '', /^http:\/\//)
      assert.equal(status.runtimeState.runtimeAuthority, snapshot.runtimeAuthority)
      assert.equal(status.runtimeState.runtimeInstanceId, snapshot.runtimeInstanceId)
      assert.equal(status.runtimeState.serverBaseUrl, snapshot.serverBaseUrl)
      assert.equal(status.supervisorState.registry.instances[0]?.instanceId, snapshot.runtimeInstanceId)
      assert.equal(status.supervisorState.registry.instances[0]?.runtimeAuthority, snapshot.runtimeAuthority)
      assert.equal(status.supervisorState.registry.instances[0]?.runtimeInstanceId, snapshot.runtimeInstanceId)
      assert.equal(status.supervisorState.registry.instances[0]?.serverBaseUrl, snapshot.serverBaseUrl)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

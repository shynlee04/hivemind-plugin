import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("bun-pty", () => ({
  spawn: vi.fn(() => ({
    pid: 4242,
    write: vi.fn(),
    kill: vi.fn(),
    onData: vi.fn(() => ({ dispose: vi.fn() })),
    onExit: vi.fn(() => ({ dispose: vi.fn() })),
  })),
}))

import { getSessionContinuity, recordSessionContinuity } from "../../src/lib/continuity.js"
import { createCoreHooks } from "../../src/hooks/create-core-hooks.js"
import { TaskStateManager } from "../../src/lib/state.js"
import { DelegationManager } from "../../src/lib/delegation-manager.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import { PtyManager } from "../../src/lib/pty/pty-manager.js"
import { HarnessControlPlane } from "../../src/plugin.js"

function createPluginClient() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-session" } }),
      status: vi.fn().mockResolvedValue({ data: {} }),
      abort: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockResolvedValue(undefined),
      messages: vi.fn().mockResolvedValue({ data: [] }),
    },
    app: {
      agents: vi.fn().mockResolvedValue({
        data: [{ name: "builder" }],
      }),
    },
  }
}

describe("plugin lifecycle wiring", () => {
  let previousStateDir: string | undefined
  let stateDir: string

  beforeEach(() => {
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "plugin-lifecycle-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }

    rmSync(stateDir, { recursive: true, force: true })
  })

  it("builds HarnessControlPlane without relying on an independent delegated-session lifecycle implementation", async () => {
    const plugin = await HarnessControlPlane({
      client: createPluginClient(),
      directory: process.cwd(),
    } as never)

    expect(plugin.tool["delegate-task"]).toBeDefined()
    expect(plugin.tool["delegation-status"]).toBeDefined()
  })

  it("automatically writes event-tracker artifacts for canonical OpenCode lifecycle events", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-event-tracker-"))

    try {
      const plugin = await HarnessControlPlane({
        client: createPluginClient(),
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", properties: { info: { id: "ses_2b7a" } } } })

      expect(existsSync(join(projectRoot, ".hivemind", "event-tracker", "ses_2b7a.json"))).toBe(true)
      expect(existsSync(join(projectRoot, ".hivemind", "event-tracker", "ses_2b7a.md"))).toBe(true)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("registers run-background-command when a shared PTY manager is supported", async () => {
    vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(true)

    const plugin = await HarnessControlPlane({
      client: createPluginClient(),
      directory: process.cwd(),
    } as never)

    expect(plugin.tool["run-background-command"]).toBeDefined()
  })

  it("treats HarnessLifecycleManager.launchDelegatedSession as a usable facade instead of a stub throw-path", async () => {
    const lifecycle = createHarnessLifecycleManager({
      client: createPluginClient() as never,
      pollTimeoutMs: 180_000,
      delegationManager: new DelegationManager(createPluginClient() as never),
    })

    await expect(lifecycle.launchDelegatedSession({
      sessionID: "ses-parent-session",
      description: "delegate work",
      agent: "builder",
      promptText: "ship it",
    })).resolves.toBeTypeOf("string")
  })

  it("replays pending notifications on parent session.created and clears the queue after successful delivery", async () => {
    const client = createPluginClient()

    recordSessionContinuity({
      sessionID: "ses-parent-replay-success",
      promptParams: {},
      metadata: {
        status: "running",
        description: "Parent replay session",
        delegation: null,
        constraints: [],
        lifecycle: { phase: "created" },
        pendingNotifications: [
          {
            sessionID: "child-session",
            description: "Delegation: builder",
            agent: "builder",
            status: "completed",
            briefSummary: "Delegated work finished with terminal state completed after 2.0s.",
            resultPreview: "Replayable completion payload",
            metadata: {
              delegationId: "del-replay-success",
              terminalState: "completed",
              recoveryGuarantee: "resumable",
              summaryPreview: "Replayable completion payload",
            },
            createdAt: Date.now(),
            delivered: false,
          },
        ],
        updatedAt: Date.now(),
      },
    })

    const hooks = createCoreHooks({
      client: client as never,
      lifecycleManager: { handleEvent: vi.fn() } as never,
      stateManager: new TaskStateManager(),
    })

    await hooks.event({ event: { type: "session.created", sessionID: "ses-parent-replay-success" } })

    expect(client.session.prompt).toHaveBeenCalledTimes(1)
    const payload = client.session.prompt.mock.calls[0]?.[0]?.body?.parts?.[0]?.text
    expect(payload).toContain("Summary: Delegated work finished with terminal state completed after 2.0s.")
    expect(payload).toContain('Metadata: {"delegationId":"del-replay-success","terminalState":"completed","recoveryGuarantee":"resumable","summaryPreview":"Replayable completion payload"}')
    expect(getSessionContinuity("ses-parent-replay-success")?.metadata.pendingNotifications).toEqual([])
  })

  it("keeps pending notifications when replay delivery fails on parent session.updated", async () => {
    const client = createPluginClient()
    client.session.prompt.mockRejectedValue(new Error("parent unavailable during replay"))

    recordSessionContinuity({
      sessionID: "ses-parent-replay-failure",
      promptParams: {},
      metadata: {
        status: "running",
        description: "Parent replay failure session",
        delegation: null,
        constraints: [],
        pendingNotifications: [
          {
            sessionID: "child-session",
            description: "Delegation: builder",
            agent: "builder",
            status: "completed",
            briefSummary: "Delegated work finished with terminal state completed after 2.0s.",
            resultPreview: "Replayable completion payload",
            metadata: {
              delegationId: "del-replay-failure",
              terminalState: "completed",
              recoveryGuarantee: "resumable",
              summaryPreview: "Replayable completion payload",
            },
            createdAt: Date.now(),
            delivered: false,
          },
        ],
        updatedAt: Date.now(),
      },
    })

    const hooks = createCoreHooks({
      client: client as never,
      lifecycleManager: { handleEvent: vi.fn() } as never,
      stateManager: new TaskStateManager(),
    })

    await hooks.event({ event: { type: "session.updated", sessionID: "ses-parent-replay-failure" } })

    expect(client.session.prompt).toHaveBeenCalledTimes(1)
    expect(getSessionContinuity("ses-parent-replay-failure")?.metadata.pendingNotifications).toHaveLength(1)
  })

})

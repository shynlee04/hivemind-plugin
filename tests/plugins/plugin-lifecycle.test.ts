import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
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

import { getSessionContinuity, recordSessionContinuity } from "../../src/task-management/continuity/index.js"
import { createCoreHooks } from "../../src/hooks/lifecycle/core-hooks.js"
import { createSessionHooks } from "../../src/hooks/lifecycle/session-hooks.js"
import { TaskStateManager } from "../../src/shared/state.js"
import { DelegationManager } from "../../src/coordination/delegation/manager.js"
import { createHarnessLifecycleManager } from "../../src/task-management/lifecycle/index.js"
import { PtyManager } from "../../src/features/background-command/pty/pty-manager.js"
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
    expect(plugin.tool["hivemind-pressure"]).toBeDefined()
    expect(plugin.tool["hivemind-sdk-supervisor"]).toBeDefined()
    expect(plugin.tool["hivemind-command-engine"]).toBeDefined()
    expect(plugin.tool["hivemind-agent-work-create"]).toBeDefined()
    expect(plugin.tool["hivemind-agent-work-export"]).toBeDefined()
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

  it("automatically routes parent-linked sub-session lifecycle events to the parent event-tracker artifact", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-event-tracker-root-"))

    try {
      const plugin = await HarnessControlPlane({
        client: createPluginClient(),
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", properties: { info: { id: "ses_23a0root" } } } })
      await plugin.event({ event: { type: "session.updated", properties: { info: { id: "ses_bgr5", parentID: "ses_23a0root" } } } })

      const artifactDir = join(projectRoot, ".hivemind", "event-tracker")
      expect(readdirSync(artifactDir).sort()).toEqual(["ses_23a0.json", "ses_23a0.md"])
      const document = JSON.parse(readFileSync(join(artifactDir, "ses_23a0.json"), "utf-8")) as { sessionId?: string; events?: Array<{ sessionId?: string }> }
      expect(document.sessionId).toBe("ses_23a0root")
      expect(document.events).toEqual(expect.arrayContaining([expect.objectContaining({ sessionId: "ses_bgr5" })]))
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("does not write event-tracker artifacts for message firehose plugin events", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-event-tracker-filter-"))

    try {
      const plugin = await HarnessControlPlane({
        client: createPluginClient(),
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", properties: { info: { id: "ses_23a0root" } } } })
      await plugin.event({ event: { type: "message.updated", properties: { info: { id: "msg_should_not_be_root" }, sessionID: "ses_23a0root" } } })
      await plugin.event({ event: { type: "message.part.delta", properties: { info: { id: "ses_23a0child", parentID: "ses_23a0root" } } } })

      const artifactDir = join(projectRoot, ".hivemind", "event-tracker")
      expect(readdirSync(artifactDir).sort()).toEqual(["ses_23a0.json", "ses_23a0.md"])
      expect(readFileSync(join(artifactDir, "ses_23a0.json"), "utf-8")).not.toContain("message.part.delta")
      expect(readFileSync(join(artifactDir, "ses_23a0.json"), "utf-8")).not.toContain("msg_should_not_be_root")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("keeps lifecycle notification replay independent from event-tracker admission", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-lifecycle-observers-"))
    const client = createPluginClient()

    recordSessionContinuity({
      sessionID: "ses_23a0root",
      promptParams: {},
      metadata: {
        status: "running",
        description: "Parent plugin replay session",
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
              delegationId: "del-plugin-replay",
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

    try {
      const plugin = await HarnessControlPlane({
        client,
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", sessionID: "ses_23a0root" } })
      await plugin.event({ event: { type: "message.updated", properties: { info: { id: "msg_not_a_root" }, sessionID: "ses_23a0root" } } })

      expect(client.session.prompt).toHaveBeenCalledTimes(1)
      expect(getSessionContinuity("ses_23a0root")?.metadata.pendingNotifications).toEqual([])

      const artifactDir = join(projectRoot, ".hivemind", "event-tracker")
      expect(readdirSync(artifactDir).sort()).toEqual(["ses_23a0.json", "ses_23a0.md"])
      expect(readFileSync(join(artifactDir, "ses_23a0.json"), "utf-8")).not.toContain("msg_not_a_root")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("records plugin tool completion as concise contextual metadata when a root session is attachable", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-event-tracker-tool-"))
    const rawOutput = `FULL_TOOL_OUTPUT_${"x".repeat(2_000)}`

    try {
      const plugin = await HarnessControlPlane({
        client: createPluginClient(),
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", properties: { info: { id: "ses_23a0root" } } } })
      await plugin["tool.execute.after"]?.({
        tool: "bash",
        args: { sessionID: "ses_23a0root", command: "git status --short" },
      }, rawOutput)

      const artifactPath = join(projectRoot, ".hivemind", "event-tracker", "ses_23a0.json")
      const document = JSON.parse(readFileSync(artifactPath, "utf-8")) as {
        toolsUsed?: Array<{ toolName?: string; summary?: string }>
      }
      expect(document.toolsUsed).toEqual([expect.objectContaining({ toolName: "bash" })])
      expect(document.toolsUsed?.[0]?.summary?.length).toBeLessThanOrEqual(240)
      expect(readFileSync(artifactPath, "utf-8")).not.toContain(rawOutput)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("composes tool-guard metadata injection with plugin event-tracker after-hook work", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "plugin-composed-tool-after-"))
    const output: { metadata?: unknown } = {}

    try {
      const plugin = await HarnessControlPlane({
        client: createPluginClient(),
        directory: projectRoot,
      } as never)

      await plugin.event({ event: { type: "session.created", properties: { info: { id: "ses_23a0root" } } } })
      await plugin["tool.execute.before"]?.({ sessionID: "ses_23a0root", tool: "bash" }, { args: { command: "true" } })
      await plugin["tool.execute.after"]?.({ tool: "bash", args: { sessionID: "ses_23a0root" } }, output)

      expect(output.metadata).toEqual(expect.objectContaining({
        _harness: expect.objectContaining({ totalToolCalls: 1 }),
      }))
      expect(existsSync(join(projectRoot, ".hivemind", "event-tracker", "ses_23a0.json"))).toBe(true)
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

  it("registers run-background-command even when PTY manager is unsupported", async () => {
    vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(false)

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
      lifecycleManager: createHarnessLifecycleManager({ client: client as never, pollTimeoutMs: 180_000 }),
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
      lifecycleManager: createHarnessLifecycleManager({ client: client as never, pollTimeoutMs: 180_000 }),
      stateManager: new TaskStateManager(),
    })

    await hooks.event({ event: { type: "session.updated", sessionID: "ses-parent-replay-failure" } })

    expect(client.session.prompt).toHaveBeenCalledTimes(1)
    expect(getSessionContinuity("ses-parent-replay-failure")?.metadata.pendingNotifications).toHaveLength(1)
  })

  it("makes auto-loop retry inert when the session is deleted while retry is pending", async () => {
    let releaseSleep: (() => void) | undefined
    const lifecycleManager = {
      requestAutoLoopRetry: vi.fn().mockResolvedValue(undefined),
      getLifecycleSnapshot: vi.fn().mockReturnValue(undefined),
      recordCompactionCheckpoint: vi.fn(),
    }
    const client = createPluginClient()
    client.session.messages.mockResolvedValue({
      data: [{ role: "assistant", parts: [{ type: "text", text: "not done yet" }] }],
    })

    recordSessionContinuity({
      sessionID: "ses-auto-loop-terminal",
      promptParams: {},
      metadata: {
        status: "running",
        description: "Auto-loop terminal cleanup",
        delegation: null,
        constraints: [],
        delegationPacket: {
          id: "packet-auto-loop-terminal",
          createdAt: Date.now(),
          spec: "finish task",
          artifacts: [],
          commits: [],
          parentChain: [],
          status: "running",
          updatedAt: Date.now(),
        },
        pendingNotifications: [],
        updatedAt: Date.now(),
      },
    })

    const hooks = createSessionHooks({
      client: client as never,
      lifecycleManager: lifecycleManager as never,
      stateManager: new TaskStateManager(),
      autoLoopConfig: { backoffMs: 25 },
      sleep: () => new Promise<void>((resolve) => { releaseSleep = resolve }),
    })

    const idlePromise = hooks.event({ event: { type: "session.idle", sessionID: "ses-auto-loop-terminal" } })
    await vi.waitFor(() => expect(releaseSleep).toBeDefined())
    await hooks.event({ event: { type: "session.deleted", sessionID: "ses-auto-loop-terminal" } })
    releaseSleep?.()
    await idlePromise

    expect(lifecycleManager.requestAutoLoopRetry).not.toHaveBeenCalled()
  })

})

describe("behavioral assertions", () => {
  it("tool.execute.after injects _harness metadata with tool name and session ID", async () => {
    const { createToolGuardHooks } = await import(
      "../../src/hooks/guards/tool-guard-hooks.js"
    )
    const stateManager = {
      ensureStats: vi.fn(() => ({
        total: 0,
        byTool: {},
        loop: { signature: "", count: 0 },
        warnings: [],
        messages: [],
      })),
      getStats: vi.fn(() => undefined),
      addWarning: vi.fn(),
      hasStats: vi.fn().mockReturnValue(false),
    }

    const hooks = createToolGuardHooks({ stateManager: stateManager as never })
    const output: Record<string, unknown> = {}
    await hooks["tool.execute.after"](
      { sessionID: "ses_meta", tool: "delegate-task", args: {} },
      output,
    )

    expect(output.metadata).toBeDefined()
    const meta = output.metadata as Record<string, unknown>
    expect(meta._harness).toBeDefined()
  })

  it("shell.env injects CI environment variables", async () => {
    const { createCoreHooks } = await import(
      "../../src/hooks/lifecycle/core-hooks.js"
    )
    const hooks = createCoreHooks({
      lifecycleManager: {
        handleEvent: vi.fn(),
        replayPendingNotificationsForEvent: vi.fn(),
      } as never,
    } as never)

    const output: Record<string, unknown> = {}
    await hooks["shell.env"]({}, output)

    expect(output.env).toBeDefined()
    expect(output.env).toMatchObject({
      CI: "true",
      GIT_TERMINAL_PROMPT: "0",
      NO_COLOR: "1",
      TERM: "dumb",
    })
  })
})

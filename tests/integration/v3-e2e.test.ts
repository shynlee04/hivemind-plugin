import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-v3-e2e-"))
  return join(tempDir, "session-continuity.json")
}

async function loadV3Modules(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()

  const [
    lifecycleModule,
    continuityModule,
    categoriesModule,
    sessionHooksModule,
    toolGuardModule,
    stateModule,
    backgroundManagerModule,
    backgroundToolModule,
    delegateTaskModule,
  ] = await Promise.all([
    import("../../src/lib/lifecycle-manager.js"),
    import("../../src/lib/continuity.js"),
    import("../../src/lib/categories.js"),
    import("../../src/hooks/create-session-hooks.js"),
    import("../../src/hooks/create-tool-guard-hooks.js"),
    import("../../src/lib/state.js"),
    import("../../src/lib/background-manager.js"),
    import("../../src/tools/background/index.js"),
    import("../../src/tools/delegate-task.js"),
  ])

  return {
    ...lifecycleModule,
    ...continuityModule,
    ...categoriesModule,
    ...sessionHooksModule,
    ...toolGuardModule,
    ...stateModule,
    ...backgroundManagerModule,
    ...backgroundToolModule,
    ...delegateTaskModule,
  }
}

function flushAsyncWork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

function buildExecutionMode() {
  return {
    family: "built-in" as const,
    submode: "builtin-subsession" as const,
    rationale: "Integration tests exercise builtin subsession execution.",
    characteristics: {
      isParallel: false,
      isInteractive: true,
      isResearch: false,
      isHeadless: false,
      runInBackground: false,
    },
    capabilityEvidence: {
      hasTmux: false,
      projectRoot: process.cwd(),
    },
  }
}

function parseResult<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function buildContinuityRecord(sessionID: string) {
  return {
    sessionID,
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read", "write"],
    },
    promptParams: {
      agent: "builder" as const,
      category: "implementation" as const,
      model: "claude-sonnet-4-6",
      temperature: 0.1,
      guidanceText: "keep going until done",
      tools: ["read", "write"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 1,
        agent: "builder" as const,
        category: "implementation" as const,
        model: "claude-sonnet-4-6",
        queueKey: "model:claude-sonnet-4-6",
      },
      title: "builder: continue feature",
      description: "continue feature",
      category: "implementation" as const,
      constraints: ["keep tests green"],
      runInBackground: false,
      status: "running" as const,
      createdAt: 1,
      updatedAt: 1,
      lifecycle: {
        phase: "running" as const,
        runMode: "sync" as const,
        queueKey: "model:claude-sonnet-4-6",
      },
    },
  }
}

function makeIdleEvent(sessionID: string) {
  return {
    type: "session.idle",
    properties: {
      info: {
        id: sessionID,
      },
    },
  }
}

function makeMessages(text: string) {
  return [
    {
      info: { role: "assistant" },
      parts: [{ type: "text", text }],
    },
  ]
}

afterEach(() => {
  const continuityFile = process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  if (continuityFile) {
    rmSync(dirname(continuityFile), { recursive: true, force: true })
  }

  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  delete process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT
  vi.resetModules()
})

describe("HiveMind V3 integration coverage", () => {
  it("routes queued delegated work through continuity, tool metadata, and compaction context", async () => {
    const continuityFile = makeTempContinuityFile()
    process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = "1"

    const {
      createHarnessLifecycleManager,
      getSessionContinuity,
      getCategoryConfig,
      getToolProfile,
      resolveModel,
      createSessionHooks,
      createToolGuardHooks,
      taskState,
    } = await loadV3Modules(continuityFile)

    taskState.clear()

    const firstPrompt = createDeferred<{ parts: Array<{ type: string; text: string }> }>()
    let createCount = 0
    const client = {
      session: {
        create: vi.fn(async () => ({ data: { id: `child-${++createCount}` } })),
        prompt: vi.fn(async ({ path }: { path: { id: string } }) => {
          if (path.id === "child-1") {
            return firstPrompt.promise
          }

          return {
            data: {
              parts: [{ type: "text", text: `done:${path.id}` }],
            },
          }
        }),
        messages: vi.fn(async () => ({ data: [] })),
      },
    }

    const lifecycleManager = createHarnessLifecycleManager({
      client: client as never,
      pollTimeoutMs: 50,
    })

    const category = "implementation" as const
    const categoryConfig = getCategoryConfig(category)
    const route = {
      category,
      effectiveAgent: getToolProfile(category),
      presetKey: getToolProfile(category),
      effectiveModel: resolveModel(category, undefined, ["claude-sonnet-4-6", "claude-haiku-4-5"]),
      temperature: categoryConfig.temperature,
      guidanceText: "Ship the requested change safely",
      fallbackUsed: false,
      rationale: "matched implementation category route",
      modelSource: "category" as const,
      agentSource: "category" as const,
      temperatureSource: "category" as const,
      warnings: [],
    }

    const firstLaunch = lifecycleManager.launchDelegatedSession({
      parentSessionID: "parent-session",
      rootID: "root-session",
      childDepth: 1,
      description: "first task",
      runInBackground: false,
      agent: route.effectiveAgent,
      route,
      permissionRules: [],
      compatibleTools: ["read", "write"],
      promptText: "first prompt",
      execution: buildExecutionMode(),
    })

    await flushAsyncWork()

    const secondLaunch = lifecycleManager.launchDelegatedSession({
      parentSessionID: "parent-session",
      rootID: "root-session",
      childDepth: 1,
      description: "second task",
      runInBackground: false,
      agent: route.effectiveAgent,
      route,
      permissionRules: [],
      compatibleTools: ["read", "write"],
      promptText: "second prompt",
      execution: buildExecutionMode(),
    })

    await flushAsyncWork()

    const queued = getSessionContinuity("child-2")
    expect(queued?.metadata.route?.effectiveAgent).toBe("builder")
    expect(queued?.metadata.route?.effectiveModel).toBe("claude-sonnet-4-6")
    expect(queued?.metadata.lifecycle?.phase).toBe("queued")
    expect(queued?.metadata.delegationPacket).toMatchObject({
      spec: "second task",
      parentChain: ["root-session", "parent-session", "child-2"],
      status: "pending",
    })

    const toolHooks = createToolGuardHooks({ stateManager: taskState })
    await toolHooks["tool.execute.before"](
      { sessionID: "child-2", tool: "read" },
      { args: { path: "/tmp/demo" } },
    )

    const afterOutput: { metadata?: unknown } = {}
    await toolHooks["tool.execute.after"]({ sessionID: "child-2" }, afterOutput)

    const harnessMeta = (afterOutput.metadata as { _harness: Record<string, unknown> })._harness
    expect(harnessMeta.specialistCategory).toBe("implementation")
    expect(harnessMeta.specialistAgent).toBe("builder")
    expect(harnessMeta.repeatedSignatureCount).toBe(1)
    expect((harnessMeta.routing as { effectiveModel: string }).effectiveModel).toBe("claude-sonnet-4-6")

    firstPrompt.resolve({
      parts: [{ type: "text", text: "done:child-1" }],
    })

    await expect(firstLaunch).resolves.toBe("done:child-1")
    await expect(secondLaunch).resolves.toBe("done:child-2")

    const completed = getSessionContinuity("child-2")
    expect(completed?.metadata.lifecycle?.phase).toBe("completed")
    expect(completed?.metadata.lifecycle?.queue?.pending).toBe(0)
    expect(completed?.metadata.lifecycle?.queue?.releasedAt).toBeDefined()
    expect(completed?.metadata.delegationPacket?.status).toBe("completed")

    const hooks = createSessionHooks({
      lifecycleManager,
      stateManager: taskState,
      client: client as never,
    })
    const compactionOutput: { context?: unknown } = {}

    await hooks["experimental.session.compacting"]({ sessionID: "child-2" }, compactionOutput)

    const context = compactionOutput.context as string[]
    const rendered = context.join("\n")
    expect(rendered).toContain("## Compaction Checkpoint")
    expect(rendered).toContain("**Tools**: read, write")
    expect(rendered).toContain("**Repeated signature count**: 1")
    expect(rendered).toContain("lifecycle_phase: completed")
    expect(rendered).toContain("lifecycle_queue_pending: 0")
    expect(rendered).toContain('"session_id": "child-2"')
  })

  it("stops auto-loop retries at the configured ceiling and reports exhaustion during compaction", async () => {
    const continuityFile = makeTempContinuityFile()

    const {
      createSessionHooks,
      recordSessionContinuity,
      TaskStateManager,
    } = await loadV3Modules(continuityFile)

    recordSessionContinuity(buildContinuityRecord("sess-loop"))

    const stateManager = new TaskStateManager()
    const requestAutoLoopRetry = vi.fn(async () => undefined)
    const lifecycleManager = {
      handleEvent: vi.fn(),
      requestAutoLoopRetry,
      recordCompactionCheckpoint: vi.fn(),
      getLifecycleSnapshot: vi.fn().mockReturnValue({
        phase: "running",
        runMode: "sync",
        queueKey: "model:claude-sonnet-4-6",
      }),
    }
    const prompt = vi.fn(async () => ({ data: { parts: [] } }))
    const messages = vi
      .fn()
      .mockResolvedValueOnce({ data: makeMessages("still working") })
      .mockResolvedValueOnce({
        data: [...makeMessages("still working"), ...makeMessages("need one more pass")],
      })
      .mockResolvedValueOnce({
        data: [
          ...makeMessages("still working"),
          ...makeMessages("need one more pass"),
          ...makeMessages("unfinished again"),
        ],
      })

    const hooks = createSessionHooks({
      lifecycleManager: lifecycleManager as never,
      stateManager,
      client: { session: { messages, prompt } } as never,
      sleep: vi.fn(async () => undefined),
      autoLoopConfig: { maxIterations: 2, backoffMs: 0 },
    })

    await hooks.event({ event: makeIdleEvent("sess-loop") })
    await hooks.event({ event: makeIdleEvent("sess-loop") })
    await hooks.event({ event: makeIdleEvent("sess-loop") })

    expect(requestAutoLoopRetry).toHaveBeenCalledTimes(2)
    expect(lifecycleManager.handleEvent).not.toHaveBeenCalled()
    expect(
      stateManager
        .getStats("sess-loop")
        ?.warnings.some((warning) => warning.includes("max auto-loop iterations")),
    ).toBe(true)

    const compactionOutput: { context?: unknown } = {}
    await hooks["experimental.session.compacting"]({ sessionID: "sess-loop" }, compactionOutput)

    const rendered = (compactionOutput.context as string[]).join("\n")
    expect(rendered).toContain("auto_loop_iteration: 2/2")
    expect(rendered).toContain("auto_loop_exhausted: true")
  })

  it("restores persisted compaction checkpoint state after reload", async () => {
    const continuityFile = makeTempContinuityFile()

    const firstLoad = await loadV3Modules(continuityFile)
    firstLoad.taskState.clear()
    firstLoad.recordSessionContinuity(buildContinuityRecord("sess-restore"))

    const stats = firstLoad.taskState.ensureStats("sess-restore")
    stats.total = 5
    stats.byTool = { read: 3, write: 2 }
    stats.loop = { signature: "read:/repo/file.ts", count: 2 }
    stats.warnings = ["checkpoint warning"]
    firstLoad.taskState.setDelegationMeta("sess-restore", {
      rootID: "root-session",
      depth: 1,
      budgetUsed: 1,
      agent: "builder",
      category: "implementation",
      model: "claude-sonnet-4-6",
      queueKey: "model:claude-sonnet-4-6",
    })

    const recordingLifecycleManager = firstLoad.createHarnessLifecycleManager({
      client: { session: {} } as never,
      pollTimeoutMs: 50,
    })
    const hooks = firstLoad.createSessionHooks({
      lifecycleManager: recordingLifecycleManager,
      stateManager: firstLoad.taskState,
      client: { session: { messages: vi.fn(), prompt: vi.fn() } } as never,
    })

    await hooks["experimental.session.compacting"]({ sessionID: "sess-restore" }, {})

    const secondLoad = await loadV3Modules(continuityFile)
    secondLoad.taskState.clear()
    const lifecycleManager = secondLoad.createHarnessLifecycleManager({
      client: { session: {} } as never,
      pollTimeoutMs: 50,
    })

    lifecycleManager.hydrateFromContinuity()

    expect(secondLoad.getSessionContinuity("sess-restore")?.metadata.compactionCheckpoint).toMatchObject({
      warnings: ["checkpoint warning"],
      sessionStats: {
        total: 5,
        byTool: { read: 3, write: 2 },
        loop: { signature: "read:/repo/file.ts", count: 2 },
      },
    })
    expect(secondLoad.taskState.getStats("sess-restore")).toMatchObject({
      total: 5,
      byTool: { read: 3, write: 2 },
      warnings: ["checkpoint warning"],
      loop: { signature: "read:/repo/file.ts", count: 2 },
    })
    expect(secondLoad.taskState.getDelegationMeta("sess-restore")).toMatchObject({
      rootID: "root-session",
      agent: "builder",
      queueKey: "model:claude-sonnet-4-6",
    })
  })

  it("runs the background tool lifecycle with session-scoped visibility", async () => {
    const continuityFile = makeTempContinuityFile()

    const { BackgroundManager, createBackgroundTool } = await loadV3Modules(continuityFile)

    const manager = new BackgroundManager()
    const tool = createBackgroundTool(manager, process.cwd())
    const sessionOneCtx = {
      messageID: "message-1",
      sessionID: "session-1",
      agent: "builder",
      directory: process.cwd(),
      worktree: process.cwd(),
      abort: new AbortController().signal,
      metadata: () => ({}),
      ask: async () => undefined,
    }
    const sessionTwoCtx = {
      ...sessionOneCtx,
      sessionID: "session-2",
    }

    const spawnOne = parseResult<{ data: { id: string; parentSessionID: string; status: string } }>(
      await tool.execute(
        {
          action: "spawn",
          command: "node",
          args: ["-e", "process.stdout.write('session-one-done')"],
        },
        sessionOneCtx,
      ),
    )
    const spawnTwo = parseResult<{ data: { id: string } }>(
      await tool.execute(
        {
          action: "spawn",
          command: "node",
          args: ["-e", "process.stdout.write('session-two-done')"],
        },
        sessionTwoCtx,
      ),
    )

    expect(spawnOne.data.parentSessionID).toBe("session-1")
    expect(spawnOne.data.status).toBe("running")
    expect(spawnTwo.data.id).not.toBe(spawnOne.data.id)

    const listed = parseResult<{ data: Array<{ id: string; parentSessionID: string }> }>(
      await tool.execute({ action: "list" }, sessionOneCtx),
    )
    expect(listed.data).toHaveLength(1)
    expect(listed.data[0]?.id).toBe(spawnOne.data.id)
    expect(listed.data[0]?.parentSessionID).toBe("session-1")

    const waited = parseResult<{ data: { status: string; stdout: string } }>(
      await tool.execute({ action: "wait", task_id: spawnOne.data.id }, sessionOneCtx),
    )
    expect(waited.data.status).toBe("completed")
    expect(waited.data.stdout).toContain("session-one-done")
  })

  it("uses the delegate-task reservation flow end-to-end", async () => {
    const continuityFile = makeTempContinuityFile()

    const { createHarnessLifecycleManager, createDelegateTaskTool, taskState } = await loadV3Modules(
      continuityFile,
    )

    taskState.clear()

    const client = {
      session: {
        get: vi.fn(async ({ path }: { path: { id: string } }) => ({
          data: { id: path.id },
        })),
        create: vi.fn(async () => ({ data: { id: "child-delegate" } })),
        prompt: vi.fn(async () => ({
          data: {
            parts: [{ type: "text", text: "done:child-delegate" }],
          },
        })),
        messages: vi.fn(async () => ({ data: [] })),
      },
    }

    const lifecycleManager = createHarnessLifecycleManager({
      client: client as never,
      pollTimeoutMs: 50,
    })
    const tool = createDelegateTaskTool(lifecycleManager, client as never)

    await expect(
      tool.execute(
        {
          description: "delegate task success",
          prompt: "Complete the delegated task.",
          run_in_background: false,
        },
        {
          messageID: "message-1",
          sessionID: "parent-session",
          agent: "builder",
          directory: process.cwd(),
          worktree: process.cwd(),
          abort: new AbortController().signal,
          metadata: () => ({}),
          ask: async () => undefined,
        },
      ),
    ).resolves.toBe("done:child-delegate")

    expect(taskState.getRootBudget("parent-session")?.reserved ?? 0).toBe(0)
    expect(taskState.getRootBudget("parent-session")?.descendants.has("child-delegate")).toBe(true)
  })

  it("rolls back the delegate-task reservation when launch fails", async () => {
    const continuityFile = makeTempContinuityFile()

    const { createHarnessLifecycleManager, createDelegateTaskTool, taskState } = await loadV3Modules(
      continuityFile,
    )

    taskState.clear()

    const client = {
      session: {
        get: vi.fn(async ({ path }: { path: { id: string } }) => ({
          data: { id: path.id },
        })),
        create: vi.fn(async () => {
          throw new Error("create failed")
        }),
      },
    }

    const lifecycleManager = createHarnessLifecycleManager({
      client: client as never,
      pollTimeoutMs: 50,
    })
    const tool = createDelegateTaskTool(lifecycleManager, client as never)

    await expect(
      tool.execute(
        {
          description: "delegate task failure",
          prompt: "Complete the delegated task.",
          run_in_background: false,
        },
        {
          messageID: "message-1",
          sessionID: "parent-session",
          agent: "builder",
          directory: process.cwd(),
          worktree: process.cwd(),
          abort: new AbortController().signal,
          metadata: () => ({}),
          ask: async () => undefined,
        },
      ),
    ).rejects.toThrow("create failed")

    expect(taskState.getRootBudget("parent-session")?.reserved ?? 0).toBe(0)
    expect(taskState.getRootBudget("parent-session")?.descendants.size ?? 0).toBe(0)
  })
})

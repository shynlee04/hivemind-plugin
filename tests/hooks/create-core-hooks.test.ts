import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { DelegationRouteResolution, SessionContinuityRecord } from "../../src/lib/types.js"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-core-hooks-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadHookModules(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()

  const [{ createCoreHooks }, { createSessionHooks }, continuityModule, governanceModule, { TaskStateManager }] =
    await Promise.all([
      import("../../src/hooks/create-core-hooks.js"),
      import("../../src/hooks/create-session-hooks.js"),
      import("../../src/lib/continuity.js"),
      import("../../src/lib/governance-engine.js"),
      import("../../src/lib/state.js"),
    ])

  return {
    createCoreHooks,
    createSessionHooks,
    getSessionContinuity: continuityModule.getSessionContinuity,
    recordSessionContinuity: continuityModule.recordSessionContinuity,
    recordGovernancePersistenceState: continuityModule.recordGovernancePersistenceState,
    getGovernancePersistenceState: continuityModule.getGovernancePersistenceState,
    mutateGovernanceRule: governanceModule.mutateGovernanceRule,
    TaskStateManager,
  }
}

function makeEvent(sessionID: string, type = "session.idle") {
  return {
    type,
    properties: {
      info: {
        id: sessionID,
      },
    },
  }
}

function buildRoute(overrides: Partial<DelegationRouteResolution> = {}): DelegationRouteResolution {
  return {
    effectiveAgent: "builder",
    presetKey: "builder",
    temperature: 0.15,
    fallbackUsed: false,
    rationale: "matched builder route",
    guidanceText: "Implement directly and keep the patch focused.",
    modelSource: "category",
    agentSource: "category",
    temperatureSource: "category",
    warnings: [],
    ...overrides,
  }
}

function buildContinuityRecord(sessionID: string, overrides: Partial<SessionContinuityRecord> = {}): SessionContinuityRecord {
  return {
    sessionID,
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read", "write", "task"],
    },
    promptParams: {
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      temperature: 0,
      guidanceText: "keep going until done",
      tools: ["read", "write", "task"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 2,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      title: "builder: continue feature",
      description: "continue feature",
      category: "implementation",
      route: buildRoute(),
      constraints: ["keep tests green"],
      runInBackground: false,
      status: "running",
      createdAt: 1,
      updatedAt: 1,
      compactionCheckpoint: {
        agent: "builder",
        model: "gpt-5.4",
        tools: ["read", "write", "task"],
        delegationMeta: {
          rootID: "root-session",
          depth: 2,
          budgetUsed: 1,
          agent: "builder",
          category: "implementation",
          model: "gpt-5.4",
          queueKey: "gpt-5.4:builder:implementation",
        },
        warnings: ["Recovered warning snapshot includes 1 warning(s)."],
        sessionStats: {
          total: 2,
          byTool: { read: 1, write: 1 },
          loop: { signature: "", count: 0 },
        },
        capturedAt: 1,
      },
      delegationPacket: {
        id: "packet-1",
        spec: "Delegation packet",
        plan: null,
        artifacts: [],
        commits: [],
        parentChain: ["root-session"],
        status: "running",
        createdAt: 1,
        updatedAt: 1,
      },
    },
    ...overrides,
  }
}

afterEach(() => {
  const continuityFile = process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  if (continuityFile) {
    rmSync(dirname(continuityFile), { recursive: true, force: true })
  }

  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  vi.resetModules()
})

describe("createCoreHooks", () => {
  let continuityFile: string

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
  })

  it("fans out event handling so lifecycle and session observers both run", async () => {
    const { createCoreHooks, TaskStateManager } = await loadHookModules(continuityFile)
    const handleEvent = vi.fn()
    const sessionObserver = vi.fn().mockResolvedValue(undefined)
    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent } as never,
      client: {} as never,
      stateManager: new TaskStateManager(),
      eventObservers: [sessionObserver],
    })

    const event = makeEvent("sess-core")
    await hooks.event({ event })

    expect(handleEvent).toHaveBeenCalledWith({
      event,
      eventType: "session.idle",
      sessionID: "sess-core",
    })
    expect(sessionObserver).toHaveBeenCalledWith({ event })
  })

  it("uses the same injection evaluator at session start and compaction time", async () => {
    const {
      createCoreHooks,
      createSessionHooks,
      recordSessionContinuity,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    const stateManager = new TaskStateManager()
    recordSessionContinuity(buildContinuityRecord("sess-inject"))

    const lifecycleManager = {
      handleEvent: vi.fn(),
      getLifecycleSnapshot: vi.fn().mockReturnValue(undefined),
      recordCompactionCheckpoint: vi.fn(),
      requestAutoLoopRetry: vi.fn(),
    }
    const coreHooks = createCoreHooks({
      lifecycleManager: lifecycleManager as never,
      client: {} as never,
      stateManager,
    })
    const sessionHooks = createSessionHooks({
      lifecycleManager: lifecycleManager as never,
      client: { session: { messages: vi.fn() } } as never,
      stateManager,
    })
    const systemOutput: { system?: unknown } = {}
    const compactionOutput: { context?: unknown } = {}

    await coreHooks["system.transform"]({ sessionID: "sess-inject" }, systemOutput)
    await sessionHooks["experimental.session.compacting"](
      { sessionID: "sess-inject" },
      compactionOutput,
    )

    expect(systemOutput.system).toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
    expect(systemOutput.system).toEqual(
      expect.arrayContaining([expect.stringContaining("record-handoff-context")]),
    )
    expect(compactionOutput.context).toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
    expect(compactionOutput.context).toEqual(
      expect.arrayContaining([expect.stringContaining("record-handoff-context")]),
    )
  })

  it("keeps actively governance-blocked injections out of both session-start and compaction output", async () => {
    const {
      createCoreHooks,
      createSessionHooks,
      recordSessionContinuity,
      mutateGovernanceRule,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    const stateManager = new TaskStateManager()
    recordSessionContinuity(buildContinuityRecord("sess-blocked"))
    mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "rule-1",
        scope: "tool.execute.before",
        condition: { sessionIDs: ["sess-blocked"] },
        action: { type: "block", message: "Governance blocked runtime injection for this session." },
      },
    })

    const lifecycleManager = {
      handleEvent: vi.fn(),
      getLifecycleSnapshot: vi.fn().mockReturnValue(undefined),
      recordCompactionCheckpoint: vi.fn(),
      requestAutoLoopRetry: vi.fn(),
    }
    const coreHooks = createCoreHooks({
      lifecycleManager: lifecycleManager as never,
      client: {} as never,
      stateManager,
    })
    const sessionHooks = createSessionHooks({
      lifecycleManager: lifecycleManager as never,
      client: { session: { messages: vi.fn() } } as never,
      stateManager,
    })
    const systemOutput: { system?: unknown } = {}
    const compactionOutput: { context?: unknown } = {}

    await coreHooks["system.transform"]({ sessionID: "sess-blocked" }, systemOutput)
    await sessionHooks["experimental.session.compacting"](
      { sessionID: "sess-blocked" },
      compactionOutput,
    )

    expect(systemOutput.system).toBeUndefined()
    expect(compactionOutput.context).not.toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
  })

  it("does not suppress session-start injections when only historical block violations exist", async () => {
    const {
      createCoreHooks,
      recordSessionContinuity,
      recordGovernancePersistenceState,
      getGovernancePersistenceState,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-historical-only"))

    const governance = getGovernancePersistenceState()
    recordGovernancePersistenceState({
      ...governance,
      violations: [
        ...governance.violations,
        {
          id: "old-block-1",
          ruleID: "old-rule",
          scope: "tool.execute.before",
          sessionID: "sess-historical-only",
          actionType: "block",
          message: "An old block should remain audit data only.",
          createdAt: 1,
        },
      ],
    })

    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent: vi.fn() } as never,
      client: {} as never,
      stateManager: new TaskStateManager(),
    })
    const systemOutput: { system?: unknown } = {}

    await hooks["system.transform"]({ sessionID: "sess-historical-only" }, systemOutput)

    expect(systemOutput.system).toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
  })

  it("suppresses session-start injections when an active block rule matches the current session", async () => {
    const {
      createCoreHooks,
      recordSessionContinuity,
      mutateGovernanceRule,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-active-block"))
    mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "block-current-session",
        scope: "tool.execute.before",
        condition: { sessionIDs: ["sess-active-block"] },
        action: { type: "block", message: "Active governance blocks runtime injection." },
      },
    })

    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent: vi.fn() } as never,
      client: {} as never,
      stateManager: new TaskStateManager(),
    })
    const systemOutput: { system?: unknown } = {}

    await hooks["system.transform"]({ sessionID: "sess-active-block" }, systemOutput)

    expect(systemOutput.system).toBeUndefined()
  })

  it("returns no prompt additions for non-matching sessions in either phase", async () => {
    const {
      createCoreHooks,
      createSessionHooks,
      recordSessionContinuity,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    const stateManager = new TaskStateManager()
    recordSessionContinuity(
      buildContinuityRecord("sess-none", {
        metadata: {
          ...buildContinuityRecord("sess-none").metadata,
          route: buildRoute({ fallbackUsed: true, warnings: ["Specialist routing used the generalist fallback."] }),
          delegation: {
            rootID: "root-session",
            depth: 0,
            budgetUsed: 0,
            agent: "builder",
            category: "implementation",
            model: "gpt-5.4",
            queueKey: "gpt-5.4:builder:implementation",
          },
          compactionCheckpoint: {
            ...buildContinuityRecord("sess-none").metadata.compactionCheckpoint!,
            warnings: [],
          },
          delegationPacket: {
            ...buildContinuityRecord("sess-none").metadata.delegationPacket!,
            status: "completed",
          },
        },
      }),
    )

    const lifecycleManager = {
      handleEvent: vi.fn(),
      getLifecycleSnapshot: vi.fn().mockReturnValue(undefined),
      recordCompactionCheckpoint: vi.fn(),
      requestAutoLoopRetry: vi.fn(),
    }
    const coreHooks = createCoreHooks({
      lifecycleManager: lifecycleManager as never,
      client: {} as never,
      stateManager,
    })
    const sessionHooks = createSessionHooks({
      lifecycleManager: lifecycleManager as never,
      client: { session: { messages: vi.fn() } } as never,
      stateManager,
    })
    const systemOutput: { system?: unknown } = {}
    const compactionOutput: { context?: unknown } = {}

    await coreHooks["system.transform"]({ sessionID: "sess-none" }, systemOutput)
    await sessionHooks["experimental.session.compacting"](
      { sessionID: "sess-none" },
      compactionOutput,
    )

    expect(systemOutput.system).toBeUndefined()
    expect(compactionOutput.context).not.toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
  })

  it("replays pending background notifications when the parent session is created", async () => {
    const {
      createCoreHooks,
      getSessionContinuity,
      recordSessionContinuity,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    const showToast = vi.fn()
    recordSessionContinuity(buildContinuityRecord("sess-pending", {
      metadata: {
        ...buildContinuityRecord("sess-pending").metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastObservedAt: Date.now(),
        lifecycle: {
          phase: "created",
          runMode: "async",
          queueKey: "gpt-5.4:builder:implementation",
        },
        pendingNotifications: [
          {
            sessionID: "child-pending",
            description: "compile report",
            agent: "researcher",
            status: "completed",
            briefSummary: "Researcher finished the background report.",
            outputLink: "session://child-pending",
            createdAt: 1,
            delivered: false,
          },
        ],
      },
    }))

    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent: vi.fn() } as never,
      client: { tui: { showToast } } as never,
      stateManager: new TaskStateManager(),
    })
    const systemOutput: { system?: unknown } = {}

    await hooks.event({ event: makeEvent("sess-pending", "session.created") })
    await hooks["system.transform"]({ sessionID: "sess-pending" }, systemOutput)

    expect(showToast).toHaveBeenCalledWith({
      body: {
        message: expect.stringContaining("Pending background task notifications:"),
        variant: "info",
      },
    })
    expect(getSessionContinuity("sess-pending")?.metadata.pendingNotifications).toEqual([])
    expect(systemOutput.system).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Pending background task notifications:")]),
    )
  })

  it("replays pending background notifications once on session updates after recovery", async () => {
    const {
      createCoreHooks,
      getSessionContinuity,
      recordSessionContinuity,
      TaskStateManager,
    } = await loadHookModules(continuityFile)
    const showToast = vi.fn()
    const now = Date.now()

    recordSessionContinuity(buildContinuityRecord("sess-resume", {
      metadata: {
        ...buildContinuityRecord("sess-resume").metadata,
        createdAt: now,
        updatedAt: now,
        lastObservedAt: now,
        status: "running",
        compactionCheckpoint: {
          ...buildContinuityRecord("sess-resume").metadata.compactionCheckpoint!,
          warnings: [],
          capturedAt: now,
        },
        delegationPacket: {
          ...buildContinuityRecord("sess-resume").metadata.delegationPacket!,
          status: "completed",
          updatedAt: now,
        },
        pendingNotifications: [
          {
            sessionID: "child-resume",
            description: "resume work",
            agent: "builder",
            status: "completed",
            briefSummary: "Recovered child session finished while parent was away.",
            outputLink: "session://child-resume",
            createdAt: now,
            delivered: false,
          },
        ],
      },
    }))

    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent: vi.fn() } as never,
      client: { tui: { showToast } } as never,
      stateManager: new TaskStateManager(),
    })
    const systemOutput: { system?: unknown } = {}

    await hooks.event({ event: makeEvent("sess-resume", "session.updated") })
    await hooks["system.transform"]({ sessionID: "sess-resume" }, systemOutput)

    expect(showToast).toHaveBeenCalledWith({
      body: {
        message: expect.stringContaining("Recovered child session finished while parent was away."),
        variant: "info",
      },
    })
    expect(getSessionContinuity("sess-resume")?.metadata.pendingNotifications).toEqual([])
    expect(systemOutput.system).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Pending background task notifications:")]),
    )
  })
})

/* -------------------------------------------------------------------------- */
/* Task 4: Replay persisted delegate-task results to parent session            */
/* -------------------------------------------------------------------------- */
describe("Task 4: core hooks replay persisted results", () => {
  let continuityFile: string

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
  })

  async function loadHookModules(filePath: string) {
    process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
    vi.resetModules()

    const [{ createCoreHooks }, continuityModule, { TaskStateManager }] =
      await Promise.all([
        import("../../src/hooks/create-core-hooks.js"),
        import("../../src/lib/continuity.js"),
        import("../../src/lib/state.js"),
      ])

    return {
      createCoreHooks,
      getSessionContinuity: continuityModule.getSessionContinuity,
      recordSessionContinuity: continuityModule.recordSessionContinuity,
      patchSessionContinuity: continuityModule.patchSessionContinuity,
      TaskStateManager,
    }
  }

  /* WHY: Requirement 3+5 — parent session resumes with persisted child results available.
   * WHAT: After patching resultCapture into continuity, parent can read it back.
   * CONNECTS TO: Task 4 requirements 3, 5 */
  it("parent session can read persisted resultCapture from continuity after child completion", async () => {
    const { recordSessionContinuity, patchSessionContinuity, getSessionContinuity } =
      await loadHookModules(continuityFile)

    recordSessionContinuity(buildContinuityRecord("child-result-test", {
      metadata: {
        ...buildContinuityRecord("child-result-test").metadata,
        status: "completed",
        lifecycle: {
          phase: "completed",
          runMode: "async",
          queueKey: "gpt-5.4:builder:implementation",
          launchedAt: 1000,
          completedAt: 5000,
        },
      },
    }))

    patchSessionContinuity("child-result-test", {
      resultCapture: {
        resultText: "Implemented the feature in /src/new.ts",
        artifactPaths: ["/src/new.ts"],
        gitCommits: ["abc1234"],
        toolCallSummary: [{ tool: "Write" }],
        messageCount: 4,
        capturedAt: 5000,
      },
    })

    const record = getSessionContinuity("child-result-test")
    expect(record?.metadata.resultCapture).toBeDefined()
    expect(record?.metadata.resultCapture?.resultText).toBe("Implemented the feature in /src/new.ts")
    expect(record?.metadata.resultCapture?.artifactPaths).toEqual(["/src/new.ts"])
    expect(record?.metadata.resultCapture?.gitCommits).toEqual(["abc1234"])
  })

  /* WHY: Requirement 5 — system.transform must inject pending notifications with result data.
   * WHAT: When parent resumes, pending notifications include result previews from resultCapture.
   * CONNECTS TO: Task 4 requirement 5 */
  it("replays notification with result preview from persisted resultCapture", async () => {
    const { createCoreHooks, recordSessionContinuity, getSessionContinuity, TaskStateManager } =
      await loadHookModules(continuityFile)
    const showToast = vi.fn()
    const now = Date.now()

    recordSessionContinuity(buildContinuityRecord("parent-with-results", {
      metadata: {
        ...buildContinuityRecord("parent-with-results").metadata,
        createdAt: now,
        updatedAt: now,
        lifecycle: {
          phase: "created",
          runMode: "async",
          queueKey: "gpt-5.4:builder:implementation",
        },
        pendingNotifications: [
          {
            sessionID: "completed-child",
            description: "build feature",
            agent: "builder",
            status: "completed",
            resultPreview: "Implemented feature X. Created /src/feature.ts",
            briefSummary: "Feature X is complete.",
            artifacts: ["/src/feature.ts"],
            commits: ["deadbeef"],
            outputLink: "session://completed-child",
            createdAt: now - 1000,
            delivered: false,
          },
        ],
      },
    }))

    const hooks = createCoreHooks({
      lifecycleManager: { handleEvent: vi.fn() } as never,
      client: { tui: { showToast } } as never,
      stateManager: new TaskStateManager(),
    })

    await hooks.event({ event: makeEvent("parent-with-results", "session.created") })
    await hooks["system.transform"]({ sessionID: "parent-with-results" }, {})

    expect(showToast).toHaveBeenCalledWith({
      body: {
        message: expect.stringContaining("build feature"),
        variant: "info",
      },
    })

    const afterClear = getSessionContinuity("parent-with-results")
    expect(afterClear?.metadata.pendingNotifications).toEqual([])
  })

  /* WHY: Requirement 5 — result data survives round-trip through continuity persistence.
   * WHAT: Patch resultCapture, then read it back — data must be intact.
   * CONNECTS TO: Task 4 requirement 5 */
  it("resultCapture survives round-trip through patchSessionContinuity", async () => {
    const { recordSessionContinuity, patchSessionContinuity, getSessionContinuity } =
      await loadHookModules(continuityFile)

    recordSessionContinuity(buildContinuityRecord("round-trip"))

    const captured = {
      resultText: "Round trip test",
      artifactPaths: ["/src/a.ts", "/src/b.ts"],
      gitCommits: ["sha1", "sha2"],
      toolCallSummary: [
        {
          tool: "Write",
          args: '{"filePath":"/src/a.ts"}',
          output: "wrote /src/a.ts",
          status: "completed",
        },
        {
          tool: "Bash",
          args: '{"command":"npm test"}',
          output: "ok",
          status: "failed",
        },
      ],
      messageCount: 10,
      capturedAt: 12345,
    }

    patchSessionContinuity("round-trip", { resultCapture: captured })

    vi.resetModules()
    process.env.OPENCODE_HARNESS_CONTINUITY_FILE = continuityFile
    const continuityModule = await import("../../src/lib/continuity.js")

    const record = continuityModule.getSessionContinuity("round-trip")
    const rc = record?.metadata.resultCapture

    expect(rc).toBeDefined()
    expect(rc!.resultText).toBe("Round trip test")
    expect(rc!.artifactPaths).toEqual(["/src/a.ts", "/src/b.ts"])
    expect(rc!.gitCommits).toEqual(["sha1", "sha2"])
    expect(rc!.toolCallSummary).toHaveLength(2)
    expect(rc!.toolCallSummary[0]).toEqual(expect.objectContaining({
      tool: "Write",
      output: "wrote /src/a.ts",
      status: "completed",
    }))
    expect(rc!.toolCallSummary[1]).toEqual(expect.objectContaining({
      tool: "Bash",
      output: "ok",
      status: "failed",
    }))
    expect(rc!.messageCount).toBe(10)
    expect(rc!.capturedAt).toBe(12345)

    rc!.toolCallSummary[0]!.output = "mutated"
    rc!.toolCallSummary[1]!.status = "mutated"

    const reread = continuityModule.getSessionContinuity("round-trip")
    expect(reread?.metadata.resultCapture?.toolCallSummary[0]?.output).toBe("wrote /src/a.ts")
    expect(reread?.metadata.resultCapture?.toolCallSummary[1]?.status).toBe("failed")
  })
})

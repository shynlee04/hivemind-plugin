import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { DelegationRouteResolution } from "../../src/lib/types.js"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-session-hooks-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadSessionHookModules(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()

  const [
    { createSessionHooks },
    { recordSessionContinuity, getSessionContinuity, recordGovernancePersistenceState, getGovernancePersistenceState },
    { mutateGovernanceRule },
    { TaskStateManager },
  ] = await Promise.all([
    import("../../src/hooks/create-session-hooks.js"),
    import("../../src/lib/continuity.js"),
    import("../../src/lib/governance-engine.js"),
    import("../../src/lib/state.js"),
  ])

  return {
    createSessionHooks,
    recordSessionContinuity,
    getSessionContinuity,
    recordGovernancePersistenceState,
    getGovernancePersistenceState,
    mutateGovernanceRule,
    TaskStateManager,
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
      model: "gpt-5.4",
      temperature: 0,
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
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      title: "builder: continue feature",
      description: "continue feature",
      category: "implementation" as const,
      route: buildRoute(),
      constraints: ["keep tests green"],
      runInBackground: false,
      status: "running" as const,
      createdAt: 1,
      updatedAt: 1,
      lifecycle: {
        phase: "running" as const,
        runMode: "sync" as const,
        queueKey: "gpt-5.4:builder:implementation",
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
  vi.resetModules()
})

describe("createSessionHooks", () => {
  let continuityFile: string

  beforeEach(() => {
    continuityFile = makeTempContinuityFile()
  })

  it("injects formatted checkpoint context during compaction", async () => {
    const { createSessionHooks, recordSessionContinuity, getSessionContinuity, TaskStateManager } =
      await loadSessionHookModules(continuityFile)
    const stateManager = new TaskStateManager()
    const stats = stateManager.ensureStats("sess-compaction")
    stats.total = 6
    stats.loop = { signature: "read:/repo/src/plugin.ts", count: 2 }
    stats.warnings = ["watch loop"]
    stateManager.setDelegationMeta("sess-compaction", {
      rootID: "root-session",
      depth: 1,
      budgetUsed: 1,
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      queueKey: "gpt-5.4:builder:implementation",
    })
    recordSessionContinuity(buildContinuityRecord("sess-compaction"))

    const recordCompactionCheckpoint = vi.fn()
    const hooks = createSessionHooks({
      lifecycleManager: {
        getLifecycleSnapshot: vi.fn().mockReturnValue({
          phase: "running",
          runMode: "sync",
          queueKey: "gpt-5.4:builder:implementation",
        }),
        handleEvent: vi.fn(),
        recordCompactionCheckpoint,
      } as any,
      stateManager,
      client: { session: { messages: vi.fn(), prompt: vi.fn() } } as any,
    })
    const output: { context?: unknown } = {}

    await hooks["experimental.session.compacting"](
      { sessionID: "sess-compaction" },
      output,
    )

    expect(output.context).toEqual(
      expect.arrayContaining([expect.stringContaining("## Compaction Checkpoint")]),
    )
    expect((output.context as string[])[0]).toContain("**Tools**: read, write")
    expect((output.context as string[])[0]).toContain("**Repeated signature count**: 2")
    expect(output.context).toEqual(
      expect.arrayContaining([expect.stringContaining("Harness continuity snapshot")]),
    )
    expect(getSessionContinuity("sess-compaction")?.metadata.compactionCheckpoint).toBeUndefined()
    expect(recordCompactionCheckpoint).toHaveBeenCalledWith(
      "sess-compaction",
      expect.objectContaining({
        warnings: ["watch loop"],
        sessionStats: expect.objectContaining({
          total: 6,
          loop: { signature: "read:/repo/src/plugin.ts", count: 2 },
        }),
        tools: ["read", "write"],
      }),
    )
  })

  it("keeps compaction injections active when only historical block violations exist", async () => {
    const {
      createSessionHooks,
      recordSessionContinuity,
      recordGovernancePersistenceState,
      getGovernancePersistenceState,
      TaskStateManager,
    } = await loadSessionHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-compaction-history"))

    const governance = getGovernancePersistenceState()
    recordGovernancePersistenceState({
      ...governance,
      violations: [
        ...governance.violations,
        {
          id: "old-compaction-block",
          ruleID: "old-block",
          scope: "tool.execute.before",
          sessionID: "sess-compaction-history",
          actionType: "block",
          message: "Historical block remains audit only.",
          createdAt: 1,
        },
      ],
    })

    const hooks = createSessionHooks({
      lifecycleManager: {
        getLifecycleSnapshot: vi.fn(),
        handleEvent: vi.fn(),
        recordCompactionCheckpoint: vi.fn(),
      } as any,
      stateManager: new TaskStateManager(),
      client: { session: { messages: vi.fn(), prompt: vi.fn() } } as any,
    })
    const output: { context?: unknown } = {}

    await hooks["experimental.session.compacting"](
      { sessionID: "sess-compaction-history" },
      output,
    )

    expect(output.context).toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
  })

  it("suppresses compaction injections when an active block rule matches the current session", async () => {
    const {
      createSessionHooks,
      recordSessionContinuity,
      mutateGovernanceRule,
      TaskStateManager,
    } = await loadSessionHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-compaction-active-block"))
    mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "block-compaction-session",
        scope: "tool.execute.before",
        condition: { sessionIDs: ["sess-compaction-active-block"] },
        action: { type: "block", message: "Active governance blocks compaction injection." },
      },
    })

    const hooks = createSessionHooks({
      lifecycleManager: {
        getLifecycleSnapshot: vi.fn(),
        handleEvent: vi.fn(),
        recordCompactionCheckpoint: vi.fn(),
      } as any,
      stateManager: new TaskStateManager(),
      client: { session: { messages: vi.fn(), prompt: vi.fn() } } as any,
    })
    const output: { context?: unknown } = {}

    await hooks["experimental.session.compacting"](
      { sessionID: "sess-compaction-active-block" },
      output,
    )

    expect(output.context).not.toEqual(
      expect.arrayContaining([expect.stringContaining("builder-specialist-lane")]),
    )
  })

  it("routes idle retries through lifecycle write-path instead of sending prompts directly", async () => {
    const { createSessionHooks, recordSessionContinuity, TaskStateManager } =
      await loadSessionHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-loop"))

    const sleep = vi.fn().mockResolvedValue(undefined)
    const messages = vi.fn().mockResolvedValue({ data: makeMessages("Still working") })
    const requestAutoLoopRetry = vi.fn().mockResolvedValue(undefined)
    const lifecycleManager = {
      getLifecycleSnapshot: vi.fn(),
      handleEvent: vi.fn(),
      requestAutoLoopRetry,
    }

    const hooks = createSessionHooks({
      lifecycleManager: lifecycleManager as any,
      stateManager: new TaskStateManager(),
      client: { session: { messages } } as any,
      sleep,
      autoLoopConfig: { maxIterations: 2, backoffMs: 7 },
    })

    await hooks.event({ event: makeIdleEvent("sess-loop") })

    expect(lifecycleManager.handleEvent).not.toHaveBeenCalled()
    expect(sleep).toHaveBeenCalledWith(7)
    expect(requestAutoLoopRetry).toHaveBeenCalledTimes(1)
    expect(requestAutoLoopRetry).toHaveBeenCalledWith({
      sessionID: "sess-loop",
      promptText: expect.stringContaining("Auto-loop retry 1/2"),
    })
    expect(requestAutoLoopRetry.mock.calls[0][0].promptText).toContain("<promise>DONE</promise>")
    expect(requestAutoLoopRetry.mock.calls[0][0].promptText).toContain("Still working")
  })

  it("stops retrying once the completion promise is detected", async () => {
    const { createSessionHooks, recordSessionContinuity, TaskStateManager } =
      await loadSessionHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-done"))

    const requestAutoLoopRetry = vi.fn().mockResolvedValue(undefined)
    const hooks = createSessionHooks({
      lifecycleManager: {
        getLifecycleSnapshot: vi.fn(),
        handleEvent: vi.fn(),
        requestAutoLoopRetry,
      } as any,
      stateManager: new TaskStateManager(),
      client: {
        session: {
          messages: vi.fn().mockResolvedValue({
            data: makeMessages("Complete now <promise>DONE</promise>"),
          }),
        },
      } as any,
      sleep: vi.fn().mockResolvedValue(undefined),
    })

    await hooks.event({ event: makeIdleEvent("sess-done") })

    expect(requestAutoLoopRetry).not.toHaveBeenCalled()
  })

  it("stops at max iterations and does not re-dispatch again", async () => {
    const { createSessionHooks, recordSessionContinuity, TaskStateManager } =
      await loadSessionHookModules(continuityFile)
    recordSessionContinuity(buildContinuityRecord("sess-max"))

    const stateManager = new TaskStateManager()
    const requestAutoLoopRetry = vi.fn().mockResolvedValue(undefined)
    const messages = vi
      .fn()
      .mockResolvedValueOnce({ data: makeMessages("not done") })
      .mockResolvedValueOnce({
        data: [
          ...makeMessages("not done"),
          ...makeMessages("still not done"),
        ],
      })
      .mockResolvedValueOnce({
        data: [
          ...makeMessages("not done"),
          ...makeMessages("still not done"),
          ...makeMessages("unfinished again"),
        ],
      })
    const hooks = createSessionHooks({
      lifecycleManager: {
        getLifecycleSnapshot: vi.fn(),
        handleEvent: vi.fn(),
        requestAutoLoopRetry,
      } as any,
      stateManager,
      client: {
        session: {
          messages,
        },
      } as any,
      sleep: vi.fn().mockResolvedValue(undefined),
      autoLoopConfig: { maxIterations: 2, backoffMs: 0 },
    })

    await hooks.event({ event: makeIdleEvent("sess-max") })
    await hooks.event({ event: makeIdleEvent("sess-max") })
    await hooks.event({ event: makeIdleEvent("sess-max") })

    expect(requestAutoLoopRetry).toHaveBeenCalledTimes(2)
    expect(
      stateManager
        .getStats("sess-max")
        ?.warnings.some((warning) => warning.includes("max auto-loop iterations")),
    ).toBe(true)
  })
})

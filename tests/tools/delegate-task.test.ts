import { describe, it, expect, beforeEach, vi } from "vitest"

import { CATEGORY_DEFAULTS } from "../../src/lib/categories.js"
import { setDelegationMeta } from "../../src/lib/state.js"
import { taskState } from "../../src/lib/state.js"
import type { HarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { createDelegateTaskTool } from "../../src/tools/delegate-task.js"
import { DEFAULT_RUNTIME_POLICY, resolveConcurrencyForKey } from "../../src/lib/runtime-policy.js"
import type { RuntimePolicy } from "../../src/lib/types.js"

const mockCtx = {
  messageID: "message-1",
  sessionID: "ses_parent",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => {},
}

function createClient(sessionMap: Record<string, Record<string, unknown>>): OpenCodeClient {
  return {
    session: {
      get: vi.fn(async ({ path }: { path: { id: string } }) => ({ data: sessionMap[path.id] })),
    },
  } as unknown as OpenCodeClient
}

function createLifecycleManagerMock() {
  const launchDelegatedSession = vi.fn(async (_args: unknown) => "delegated-session")

  return {
    lifecycleManager: {
      launchDelegatedSession,
    } as unknown as HarnessLifecycleManager,
    launchDelegatedSession,
  }
}

function createLifecycleManagerPayloadMock() {
  const launchDelegatedSession = vi.fn(async (args: any) => {
    const payload = {
      ok: true,
      mode: "async",
      session_id: "child-session",
      parent_session_id: args.parentSessionID,
      root_session_id: args.rootID,
      agent: args.agent,
      category: args.route.category,
      model: args.route.effectiveModel,
      depth: args.childDepth,
      budget_used: args.spawnReservation ? 1 : 0,
      concurrency_key: args.route.presetKey,
      concurrency_active: 1,
      concurrency_pending: 0,
      concurrency_limit: 1,
      route: args.route,
      description: args.description,
      lifecycle: {
        phase: "dispatching",
        runMode: "async",
      },
      execution: args.execution,
      output_link: "session://child-session",
      instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
    }

    return JSON.stringify(payload, null, 2)
  })

  return {
    lifecycleManager: {
      launchDelegatedSession,
    } as unknown as HarnessLifecycleManager,
    launchDelegatedSession,
  }
}

function enableTrustedAsyncRuntime(sessionID = "ses_parent") {
  setDelegationMeta(sessionID, {
    rootID: sessionID,
    depth: 0,
    budgetUsed: 0,
    agent: "builder",
    category: "implementation",
    queueKey: "parent",
    runtimePolicyOverride: {
      trustedRuntime: {
        builtinAsyncBackgroundChildSessions: true,
      },
    },
  })
}

describe("delegate-task tool category routing", () => {
  beforeEach(() => {
    taskState.clear()
  })

  it("describes async_dispatch as async child-session delegation", () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    expect(tool.description).toContain("async child session")
    expect(tool.description).not.toContain("background processes")
    expect(tool.description).not.toContain("run_in_background")
    expect(tool.description).not.toContain("build→builder")
    expect(tool.description).not.toContain("plan→general")
    expect(tool.description).not.toContain("explore→general")
  })

  it("rejects invalid session_id overrides before any SDK lookup", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await expect(
      tool.execute(
        {
          description: "Invalid override",
          prompt: "Attempt delegation with a bad parent override.",
          session_id: "not-a-ses-id",
          async_dispatch: false,
        },
        mockCtx,
      ),
    ).rejects.toThrow("[Harness] Invalid session_id override. Expected an OpenCode session ID starting with 'ses'.")

    expect(client.session.get).not.toHaveBeenCalled()
    expect(launchDelegatedSession).not.toHaveBeenCalled()
  })

  it("rejects blank session_id overrides before any SDK lookup", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await expect(
      tool.execute(
        {
          description: "Blank override",
          prompt: "Attempt delegation with a blank parent override.",
          session_id: "   ",
          async_dispatch: false,
        },
        mockCtx,
      ),
    ).rejects.toThrow("[Harness] Invalid session_id override. Expected an OpenCode session ID starting with 'ses'.")

    expect(client.session.get).not.toHaveBeenCalled()
    expect(launchDelegatedSession).not.toHaveBeenCalled()
  })

  it("uses category defaults to resolve effective agent, model, and temperature without unsupported public override metadata", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Investigate routing",
        prompt: "Trace the category routing path.",
        category: "research",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      agent: string
      route: {
        effectiveAgent: string
        effectiveModel?: string
        temperature: number
        agentSource: string
        modelSource: string
      }
    }

    expect(launchArgs.agent).toBe("researcher")
    expect(launchArgs.route.effectiveAgent).toBe("researcher")
    expect(launchArgs.route.effectiveModel).toBe(CATEGORY_DEFAULTS.research.model)
    expect(launchArgs.route.temperature).toBe(CATEGORY_DEFAULTS.research.temperature)
    expect(launchArgs.route.agentSource).toBe("category")
    expect(launchArgs.route.modelSource).toBe("category")
    expect(launchArgs).not.toHaveProperty("defaultDispatchMode")
    expect(launchArgs).not.toHaveProperty("tmuxAvailability")
    expect(launchArgs).not.toHaveProperty("pollIntervalMs")
  })

  it("marks signal-driven specialist selection with truthful source metadata", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Investigate runtime evidence and analyze the failure mode",
        prompt: "Research the current state and compare evidence across the code path.",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      route: {
        agentSource: string
        effectiveAgent: string
        requestedCategory?: string
      }
    }

    expect(launchArgs.route.effectiveAgent).toBe("researcher")
    expect(launchArgs.route.requestedCategory).toBeUndefined()
    expect(launchArgs.route.agentSource).toBe("signal")
  })

  it("lets an explicit agent override the category tool profile and temperature source", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Review routing",
        prompt: "Review the route resolution.",
        category: "research",
        agent: "critic",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      agent: string
      route: {
        effectiveAgent: string
        temperature: number
        agentSource: string
        temperatureSource: string
      }
      permissionRules: Array<{ permission: string; action: string }>
    }

    expect(launchArgs.agent).toBe("critic")
    expect(launchArgs.route.effectiveAgent).toBe("critic")
    expect(launchArgs.route.temperature).toBe(0.05)
    expect(launchArgs.route.agentSource).toBe("explicit")
    expect(launchArgs.route.temperatureSource).toBe("agent")
    expect(launchArgs.permissionRules).toContainEqual({ permission: "edit", pattern: "*", action: "deny" })
  })

  it("lets an explicit model override category model resolution", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Implement routing",
        prompt: "Implement the routing fix.",
        category: "implementation",
        model: "gpt-5.4",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      route: {
        effectiveModel?: string
        modelSource: string
      }
    }

    expect(launchArgs.route.effectiveModel).toBe("gpt-5.4")
    expect(launchArgs.route.modelSource).toBe("explicit")
  })

  it("keeps sync delegate-task work on the single builtin-subsession lane", async () => {
    const previousTmux = process.env.TMUX
    process.env.TMUX = "pane-1"

    try {
      const client = createClient({
        ses_parent: { id: "ses_parent" },
      })
      const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
      const tool = createDelegateTaskTool(lifecycleManager, client)

      await tool.execute(
        {
          description: "Review the parallel background routing wording only",
          prompt: "Mention background and concurrent work in prose, but do not dispatch async.",
          agent: "critic",
          async_dispatch: false,
        },
        mockCtx,
      )

      const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
        execution: {
          family: string
          submode: string
          rationale: string
          characteristics: { isParallel: boolean; runInBackground: boolean }
        }
      }

      expect(launchArgs.execution.family).toBe("built-in")
      expect(launchArgs.execution.submode).toBe("builtin-subsession")
      expect(launchArgs.execution.characteristics).toMatchObject({ isParallel: false, runInBackground: false })
      expect(launchArgs.execution.rationale.toLowerCase()).not.toContain("tmux")
    } finally {
      if (previousTmux === undefined) {
        delete process.env.TMUX
      } else {
        process.env.TMUX = previousTmux
      }
    }
  })

  it("supports deep and quick categories using explicit category profiles", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Deep investigation",
        prompt: "Investigate thoroughly.",
        category: "deep",
        async_dispatch: false,
      },
      mockCtx,
    )

    await tool.execute(
      {
        description: "Quick implementation",
        prompt: "Handle the quick path.",
        category: "quick",
        async_dispatch: false,
      },
      mockCtx,
    )

    const deepLaunchArgs = launchDelegatedSession.mock.calls[0][0] as {
      agent: string
      route: { temperature: number }
    }
    const quickLaunchArgs = launchDelegatedSession.mock.calls[1][0] as {
      agent: string
      route: { temperature: number }
    }

    expect(deepLaunchArgs.agent).toBe("researcher")
    expect(deepLaunchArgs.route.temperature).toBe(CATEGORY_DEFAULTS.deep.temperature)
    expect(quickLaunchArgs.agent).toBe("builder")
    expect(quickLaunchArgs.route.temperature).toBe(CATEGORY_DEFAULTS.quick.temperature)
  })

  it("passes a spawn reservation into the launch path", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Reserve before launch",
        prompt: "Launch through the reservation flow.",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      parentSessionID: string
      rootID: string
      spawnReservation?: {
        parentID: string
        rootID: string
        reservedAt: number
        release: () => void
        rollback: () => void
      }
    }

    expect(launchArgs.spawnReservation).toBeDefined()
    expect(launchArgs.spawnReservation?.parentID).toBe("ses_parent")
    expect(launchArgs.spawnReservation?.rootID).toBe("ses_parent")
    expect(typeof launchArgs.spawnReservation?.reservedAt).toBe("number")
    expect(typeof launchArgs.spawnReservation?.release).toBe("function")
    expect(typeof launchArgs.spawnReservation?.rollback).toBe("function")
  })

  it("classifies interactive work before launching the delegated session", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Implement routing",
        prompt: "Edit the runtime wiring to complete the task.",
        category: "implementation",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      execution: {
        family: string
        submode: string
        rationale: string
        capabilityEvidence: { projectRoot: string }
      }
    }

    expect(launchArgs.execution).toMatchObject({
      family: "built-in",
      submode: "builtin-subsession",
      capabilityEvidence: { projectRoot: process.cwd() },
    })
    expect(launchArgs.execution.rationale).toContain("single built-in child-session lane")
  })

  it("classifies research work as builtin-subsession and preserves execution audit metadata", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)
    enableTrustedAsyncRuntime()

    await tool.execute(
      {
        description: "Research runtime gaps",
        prompt: "Investigate the runtime gap and produce a read-only report.",
        category: "research",
        async_dispatch: true,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      route: { effectiveAgent: string }
      execution: {
        family: string
        submode: string
        rationale: string
        characteristics: {
          isResearch: boolean
          isHeadless: boolean
          runInBackground: boolean
        }
        capabilityEvidence: { hasTmux: boolean; projectRoot: string }
      }
    }

    expect(launchArgs.route.effectiveAgent).toBe("researcher")
    expect(launchArgs.execution).toMatchObject({
      family: "built-in",
      submode: "builtin-subsession",
      characteristics: {
        isParallel: false,
        isResearch: true,
        isHeadless: true,
        runInBackground: true,
      },
      capabilityEvidence: {
        hasTmux: expect.any(Boolean),
        projectRoot: process.cwd(),
      },
    })
    expect(launchArgs.execution.rationale).toContain("single built-in child-session lane")
  })

  it("forces async launches onto builtin-subsession even when tmux is available", async () => {
    const previousTmux = process.env.TMUX
    process.env.TMUX = "pane-1"

    try {
      const client = createClient({
        ses_parent: { id: "ses_parent" },
      })
      const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
      const tool = createDelegateTaskTool(lifecycleManager, client)
      enableTrustedAsyncRuntime()

      await tool.execute(
        {
          description: "Background implementation",
          prompt: "Update the child launch path and continue in the background.",
          async_dispatch: true,
        },
        mockCtx,
      )

      const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
        execution: {
          family: string
          submode: string
          rationale: string
          capabilityEvidence: { hasTmux: boolean }
        }
      }

      expect(launchArgs.execution.family).toBe("built-in")
      expect(launchArgs.execution.submode).toBe("builtin-subsession")
      expect(launchArgs.execution.capabilityEvidence.hasTmux).toBe(true)
      expect(launchArgs.execution.rationale.toLowerCase()).toContain("builtin")
      expect(launchArgs.execution.rationale.toLowerCase()).not.toContain("tmux-pane")
      expect(launchArgs.execution.rationale.toLowerCase()).not.toContain("builtin-process")
    } finally {
      if (previousTmux === undefined) {
        delete process.env.TMUX
      } else {
        process.env.TMUX = previousTmux
      }
    }
  })

  it("rejects async builtin background dispatch by default when runtime durability is not explicitly trusted", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await expect(
      tool.execute(
        {
          description: "Background implementation",
          prompt: "Continue in the background.",
          async_dispatch: true,
        },
        mockCtx,
      ),
    ).rejects.toThrow(/builtin async disabled because runtime durability cannot be proven/i)

    expect(launchDelegatedSession).not.toHaveBeenCalled()
  })

  it("allows async builtin background dispatch when trusted runtime policy explicitly enables it", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    setDelegationMeta("ses_parent", {
      rootID: "ses_parent",
      depth: 0,
      budgetUsed: 0,
      agent: "builder",
      category: "implementation",
      queueKey: "parent",
      runtimePolicyOverride: {
        trustedRuntime: {
          builtinAsyncBackgroundChildSessions: true,
        },
      },
    })

    await tool.execute(
      {
        description: "Background implementation",
        prompt: "Continue in the background.",
        async_dispatch: true,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      runtimePolicyOverride?: {
        trustedRuntime?: {
          builtinAsyncBackgroundChildSessions?: boolean
        }
      }
      execution: {
        family: string
        submode: string
      }
    }

    expect(launchArgs.runtimePolicyOverride?.trustedRuntime?.builtinAsyncBackgroundChildSessions).toBe(true)
    expect(launchArgs.execution).toMatchObject({ family: "built-in", submode: "builtin-subsession" })
  })

  it("allows async builtin background dispatch when the workspace runtime policy explicitly enables it", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const workspacePolicy: RuntimePolicy = {
      concurrency: DEFAULT_RUNTIME_POLICY.concurrency,
      budget: DEFAULT_RUNTIME_POLICY.budget,
      trustedRuntime: {
        builtinAsyncBackgroundChildSessions: true,
      },
    }
    const tool = createDelegateTaskTool(lifecycleManager, client, workspacePolicy)

    await expect(
      tool.execute(
        {
          description: "Background implementation via trusted workspace policy",
          prompt: "Continue in the background.",
          async_dispatch: true,
        },
        mockCtx,
      ),
    ).resolves.toBe("delegated-session")

    expect(launchDelegatedSession).toHaveBeenCalledTimes(1)
  })

  it("returns the immediate async payload contract without drifting onto tmux/process lanes", async () => {
    const previousTmux = process.env.TMUX
    process.env.TMUX = "pane-1"

    try {
      const client = createClient({
        ses_parent: { id: "ses_parent" },
      })
      const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerPayloadMock()
      const tool = createDelegateTaskTool(lifecycleManager, client)
      enableTrustedAsyncRuntime()

      const raw = await tool.execute(
        {
          description: "Background implementation payload",
          prompt: "Continue in the background and report through the child session handle.",
          category: "implementation",
          async_dispatch: true,
        },
        mockCtx,
      )

      const parsed = JSON.parse(raw) as {
        ok: boolean
        mode: string
        session_id: string
        parent_session_id: string
        root_session_id: string
        agent: string
        category?: string
        model?: string
        depth: number
        budget_used: number
        concurrency_key: string
        concurrency_active: number
        concurrency_pending: number
        concurrency_limit: number
        route: { effectiveAgent: string; presetKey: string }
        description: string
        output_link: string
        execution: { family: string; submode: string }
        lifecycle: { phase: string; runMode: string }
        instruction: string
      }
      const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
        execution: { family: string; submode: string }
      }

      expect(parsed.ok).toBe(true)
      expect(parsed.mode).toBe("async")
      expect(parsed.session_id).toBe("child-session")
      expect(parsed.parent_session_id).toBe("ses_parent")
      expect(parsed.root_session_id).toBe("ses_parent")
      expect(parsed.agent).toBe("builder")
      expect(parsed.category).toBe("implementation")
      expect(parsed.model).toBe(CATEGORY_DEFAULTS.implementation.model)
      expect(parsed.depth).toBe(1)
      expect(parsed.budget_used).toBe(1)
      expect(parsed.concurrency_key).toBe(launchArgs.route.presetKey)
      expect(parsed.concurrency_active).toBe(1)
      expect(parsed.concurrency_pending).toBe(0)
      expect(parsed.concurrency_limit).toBe(1)
      expect(parsed.route).toMatchObject({ effectiveAgent: "builder", presetKey: launchArgs.route.presetKey })
      expect(parsed.description).toBe("Background implementation payload")
      expect(parsed.output_link).toBe("session://child-session")
      expect(parsed.lifecycle).toEqual({ phase: "dispatching", runMode: "async" })
      expect(parsed.execution).toMatchObject({ family: "built-in", submode: "builtin-subsession" })
      expect(parsed.instruction).toContain("Continue with other work")
      expect(launchArgs.execution).toMatchObject({ family: "built-in", submode: "builtin-subsession" })
    } finally {
      if (previousTmux === undefined) {
        delete process.env.TMUX
      } else {
        process.env.TMUX = previousTmux
      }
    }
  })

  it.each(["build", "plan", "explore", "made-up-agent"])(
    "degrades requested agent %s to general with fallback warnings instead of throwing",
    async (requestedAgent) => {
      const client = createClient({
        ses_parent: { id: "ses_parent" },
      })
      const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
      const tool = createDelegateTaskTool(lifecycleManager, client)
      enableTrustedAsyncRuntime()

      await tool.execute(
        {
          description: "Fallback routing",
          prompt: "Read the files and summarize them.",
          agent: requestedAgent,
          async_dispatch: true,
        },
        mockCtx,
      )

      const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
        agent: string
        route: {
          effectiveAgent: string
          fallbackUsed: boolean
          warnings: string[]
          requestedAgent?: string
        }
        execution: {
          family: string
          submode: string
        }
      }

      expect(launchArgs.agent).toBe("general")
      expect(launchArgs.route.effectiveAgent).toBe("general")
      expect(launchArgs.route.fallbackUsed).toBe(true)
      expect(launchArgs.route.requestedAgent).toBe("general")
      expect(launchArgs.route.warnings.join(" ").toLowerCase()).toContain("general")
      expect(launchArgs.route.warnings.join(" ").toLowerCase()).toContain("fallback")
      expect(launchArgs.execution.family).toBe("built-in")
      expect(launchArgs.execution.submode).toBe("builtin-subsession")
    },
  )

  it.each(["build", "plan", "explore"])(
    "routes alias %s through the general permission/tool profile",
    async (requestedAgent) => {
      const client = createClient({
        ses_parent: { id: "ses_parent" },
      })
      const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
      const tool = createDelegateTaskTool(lifecycleManager, client)
      enableTrustedAsyncRuntime()

      await tool.execute(
        {
          description: "Alias fallback permissions",
          prompt: "Read files only and report findings.",
          agent: requestedAgent,
          async_dispatch: true,
        },
        mockCtx,
      )

      const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
        permissionRules: Array<{ permission: string; action: string }>
      }

      expect(launchArgs.permissionRules).toContainEqual({ permission: "edit", pattern: "*", action: "deny" })
      expect(launchArgs.permissionRules).toContainEqual({ permission: "write", pattern: "*", action: "deny" })
      expect(launchArgs.permissionRules).toContainEqual({ permission: "bash", pattern: "*", action: "deny" })
    },
  )

  it("preserves invalid-agent warning text for fallback launches", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)
    enableTrustedAsyncRuntime()

    await tool.execute(
      {
        description: "Unknown agent fallback",
        prompt: "Read the files and summarize them.",
        agent: "made-up-agent",
        async_dispatch: true,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      route: { warnings: string[]; fallbackUsed: boolean }
    }

    expect(launchArgs.route.fallbackUsed).toBe(true)
    expect(launchArgs.route.warnings.join(" ").toLowerCase()).toContain("invalid")
    expect(launchArgs.route.warnings.join(" ").toLowerCase()).toContain("made-up-agent")
    expect(launchArgs.route.warnings.join(" ")).not.toContain("build→builder")
    expect(launchArgs.route.warnings.join(" ")).not.toContain("build, plan, explore")
  })

  it("threads a trusted parent runtime policy override into child delegation metadata", async () => {
    const client = createClient({
      ses_parent: { id: "ses_parent" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    setDelegationMeta("ses_parent", {
      rootID: "ses_parent",
      depth: 0,
      budgetUsed: 0,
      agent: "builder",
      category: "implementation",
      queueKey: "parent",
      runtimePolicyOverride: {
        budget: {
          maxToolCallsPerSession: 3,
        },
      },
    })

    await tool.execute(
      {
        description: "Inherit runtime policy override",
        prompt: "Launch a delegated child using the trusted parent override.",
        async_dispatch: false,
      },
      mockCtx,
    )

    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      runtimePolicyOverride?: {
        budget?: {
          maxToolCallsPerSession?: number
        }
      }
    }

    expect(launchArgs.runtimePolicyOverride?.budget?.maxToolCallsPerSession).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// lifecycle-runtime-policy helper tests (02-07 Task 2)
// ---------------------------------------------------------------------------

describe("runtime-policy: resolveConcurrencyForKey (inlined from lifecycle-runtime-policy)", () => {
  it("resolves queue limit and timeout from workspace runtime policy", () => {
    const policy: RuntimePolicy = {
      concurrency: {
        globalLimit: 5,
        perKey: {
          "model:gpt-5": { limit: 2, acquireTimeoutMs: 30000 },
        },
      },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveConcurrencyForKey(policy, "model:gpt-5")

    expect(result.limit).toBe(2)
    expect(result.acquireTimeoutMs).toBe(30000)
  })

  it("falls back to global limit when no per-key override exists", () => {
    const policy: RuntimePolicy = {
      concurrency: { globalLimit: 5 },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveConcurrencyForKey(policy, "agent:builder")

    expect(result.limit).toBe(5)
    expect(result.acquireTimeoutMs).toBeUndefined()
  })

  it("returns per-key values when key exists", () => {
    const policy: RuntimePolicy = {
      concurrency: {
        globalLimit: 3,
        perKey: {
          "model:gpt-5": { limit: 1, acquireTimeoutMs: 5000 },
        },
      },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveConcurrencyForKey(policy, "model:gpt-5")

    expect(result.limit).toBe(1)
    expect(result.acquireTimeoutMs).toBe(5000)
  })

  it("returns global limit for unknown keys", () => {
    const policy: RuntimePolicy = {
      concurrency: { globalLimit: 7 },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveConcurrencyForKey(policy, "category:research")

    expect(result.limit).toBe(7)
    expect(result.acquireTimeoutMs).toBeUndefined()
  })
})

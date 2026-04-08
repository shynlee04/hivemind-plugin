import { describe, it, expect, beforeEach, vi } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { CATEGORY_DEFAULTS } from "../../src/lib/categories.js"
import { taskState } from "../../src/lib/state.js"
import type { HarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { createDelegateTaskTool } from "../../src/tools/delegate-task.js"
import { DEFAULT_RUNTIME_POLICY, resolveConcurrencyForKey } from "../../src/lib/runtime-policy.js"
import type { RuntimePolicy } from "../../src/lib/types.js"
import { resolveLifecycleConcurrency } from "../../src/lib/lifecycle-runtime-policy.js"

const mockCtx = {
  messageID: "message-1",
  sessionID: "parent-session",
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

describe("delegate-task tool category routing", () => {
  beforeEach(() => {
    taskState.clear()
  })

  it("uses category defaults to resolve effective agent, model, and temperature", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Investigate routing",
        prompt: "Trace the category routing path.",
        category: "research",
        run_in_background: false,
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
  })

  it("lets an explicit agent override the category tool profile and temperature source", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Review routing",
        prompt: "Review the route resolution.",
        category: "research",
        agent: "critic",
        run_in_background: false,
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
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Implement routing",
        prompt: "Implement the routing fix.",
        category: "implementation",
        model: "gpt-5.4",
        run_in_background: false,
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

  it("supports deep and quick categories using explicit category profiles", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Deep investigation",
        prompt: "Investigate thoroughly.",
        category: "deep",
        run_in_background: false,
      },
      mockCtx,
    )

    await tool.execute(
      {
        description: "Quick implementation",
        prompt: "Handle the quick path.",
        category: "quick",
        run_in_background: false,
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
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Reserve before launch",
        prompt: "Launch through the reservation flow.",
        run_in_background: false,
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
    expect(launchArgs.spawnReservation?.parentID).toBe("parent-session")
    expect(launchArgs.spawnReservation?.rootID).toBe("parent-session")
    expect(typeof launchArgs.spawnReservation?.reservedAt).toBe("number")
    expect(typeof launchArgs.spawnReservation?.release).toBe("function")
    expect(typeof launchArgs.spawnReservation?.rollback).toBe("function")
  })
})

// ---------------------------------------------------------------------------
// lifecycle-runtime-policy helper tests (02-07 Task 2)
// ---------------------------------------------------------------------------

describe("lifecycle-runtime-policy: resolveLifecycleConcurrency", () => {
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

    const result = resolveLifecycleConcurrency(policy, "model:gpt-5")

    expect(result.limit).toBe(2)
    expect(result.acquireTimeoutMs).toBe(30000)
  })

  it("falls back to global limit when no per-key override exists", () => {
    const policy: RuntimePolicy = {
      concurrency: { globalLimit: 5 },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveLifecycleConcurrency(policy, "agent:builder")

    expect(result.limit).toBe(5)
    expect(result.acquireTimeoutMs).toBeUndefined()
  })

  it("records resolved policy inputs in audit metadata", () => {
    const policy: RuntimePolicy = {
      concurrency: {
        globalLimit: 3,
        perKey: {
          "model:gpt-5": { limit: 1, acquireTimeoutMs: 5000 },
        },
      },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveLifecycleConcurrency(policy, "model:gpt-5")

    expect(result.audit).toBeDefined()
    expect(result.audit.key).toBe("model:gpt-5")
    expect(result.audit.source).toBe("perKey")
    expect(result.audit.resolvedLimit).toBe(1)
    expect(result.audit.resolvedTimeoutMs).toBe(5000)
  })

  it("audit metadata indicates global fallback source", () => {
    const policy: RuntimePolicy = {
      concurrency: { globalLimit: 7 },
      budget: DEFAULT_RUNTIME_POLICY.budget,
    }

    const result = resolveLifecycleConcurrency(policy, "category:research")

    expect(result.audit.source).toBe("globalLimit")
    expect(result.audit.resolvedLimit).toBe(7)
  })
})

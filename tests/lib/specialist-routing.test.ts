import { describe, expect, it, vi } from "vitest"

import type { HarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { createDelegateTaskTool } from "../../src/tools/delegate-task.js"
import { resolveSpecialistRoute } from "../../src/lib/specialist-router.js"

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

describe("resolveSpecialistRoute", () => {
  it("resolves a strong category match to the matching specialist preset", () => {
    const route = resolveSpecialistRoute({
      description: "Investigate runtime routing failures and collect evidence",
      prompt: "Research the runtime routing issue and summarize the findings.",
      category: "research",
    })

    expect(route.effectiveAgent).toBe("researcher")
    expect(route.agentSource).toBe("category")
    expect(route.presetKey).toBe("researcher")
    expect(route.fallbackUsed).toBe(false)
  })

  it("falls back to the broad generalist builder preset for weak or ambiguous requests", () => {
    const route = resolveSpecialistRoute({
      description: "Handle this task",
      prompt: "Do the thing.",
    })

    expect(route.effectiveAgent).toBe("builder")
    expect(route.presetKey).toBe("generalist-builder")
    expect(route.fallbackUsed).toBe(true)
    expect(route.rationale).toMatch(/fallback/i)
  })

  it("records requested inputs, resolved preset, and rationale for downstream audit", () => {
    const route = resolveSpecialistRoute({
      description: "Review the implementation for regressions",
      prompt: "Audit the implementation for regressions.",
      category: "review",
      agent: "critic",
      model: "gpt-5.4",
    })

    expect(route).toMatchObject({
      requestedCategory: "review",
      requestedAgent: "critic",
      requestedModel: "gpt-5.4",
      presetKey: "critic",
      rationale: expect.any(String),
    })
  })
})

describe("delegate-task specialist routing integration", () => {
  it("passes the resolved preset metadata through the launch path", async () => {
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
      route: {
        presetKey: string
        rationale: string
        fallbackUsed: boolean
      }
    }

    expect(launchArgs.route.presetKey).toBe("researcher")
    expect(launchArgs.route.rationale).toMatch(/research/i)
    expect(launchArgs.route.fallbackUsed).toBe(false)
  })
})

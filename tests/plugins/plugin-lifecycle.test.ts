import { describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/lib/delegation-manager.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
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
  it("builds HarnessControlPlane without relying on an independent delegated-session lifecycle implementation", async () => {
    const plugin = await HarnessControlPlane({
      client: createPluginClient(),
      directory: process.cwd(),
    } as never)

    expect(plugin.tool["delegate-task"]).toBeDefined()
    expect(plugin.tool["delegation-status"]).toBeDefined()
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
})

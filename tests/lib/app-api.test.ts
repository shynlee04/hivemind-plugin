import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { describe, expect, it, vi } from "vitest"

type MockAppClient = {
  app: {
    agents: ReturnType<typeof vi.fn>
  }
}

function mockClient(): MockAppClient {
  return {
    app: {
      agents: vi.fn(),
    },
  }
}

describe("app-api typed wrappers", () => {
  it("calls client.app.agents once and returns array data", async () => {
    const client = mockClient()
    client.app.agents.mockResolvedValue({ data: [{ name: "builder" }] })

    const { getAppAgents } = await import("../../src/lib/app-api.js")
    const result = await getAppAgents(client as unknown as OpenCodeClient)

    expect(client.app.agents).toHaveBeenCalledTimes(1)
    expect(client.app.agents).toHaveBeenCalledWith()
    expect(result).toEqual([{ name: "builder" }])
  })

  it("unwraps SDK responses shaped as { agents: [...] }", async () => {
    const client = mockClient()
    client.app.agents.mockResolvedValue({ data: { agents: [{ name: "critic" }] } })

    const { getAppAgents } = await import("../../src/lib/app-api.js")
    const result = await getAppAgents(client as unknown as OpenCodeClient)

    expect(client.app.agents).toHaveBeenCalledTimes(1)
    expect(result).toEqual([{ name: "critic" }])
  })

  it("returns an empty list for unexpected app agent response shapes", async () => {
    const client = mockClient()
    client.app.agents.mockResolvedValue({ data: { agents: "not-an-array" } })

    const { getAppAgents } = await import("../../src/lib/app-api.js")
    const result = await getAppAgents(client as unknown as OpenCodeClient)

    expect(result).toEqual([])
  })
})

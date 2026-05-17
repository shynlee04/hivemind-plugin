import { AgentResolver } from "../../../../src/coordination/delegation/agent-resolver.js"

describe("AgentResolver", () => {
  it("validates that the requested agent exists in the app registry", async () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [{ name: "gsd-executor", tools: { read: true } }] }) } },
      projectRoot: process.cwd(),
    })

    await expect(resolver.resolve("gsd-executor")).resolves.toMatchObject({ name: "gsd-executor" })
    await expect(resolver.resolve("missing-agent")).rejects.toThrow('[Harness] Unknown delegation agent "missing-agent"')
  })

  it("resolves a permission profile from agent primitive metadata", async () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [{ name: "gsd-executor", tools: { read: true, edit: true } }] }) } },
      projectRoot: process.cwd(),
    })

    const agent = await resolver.resolve("gsd-executor")
    const profile = resolver.buildPermissionProfile(agent, {
      agent: "gsd-executor",
      category: "implementation",
      prompt: "implement the slice",
    })

    expect(profile).toEqual({ mode: "write-capable", tools: ["read", "edit"] })
  })

  it("disables recursive delegation tools for resolved agents", () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [] }) } },
      projectRoot: process.cwd(),
    })

    expect(resolver.buildDisabledTools()).toEqual({ "delegate-task": false, task: false })
  })
})

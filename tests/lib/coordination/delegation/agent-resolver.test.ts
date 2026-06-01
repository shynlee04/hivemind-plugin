import { AgentResolver } from "../../../../src/coordination/delegation/agent-resolver.js"
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const tempDir = mkdtempSync(join(tmpdir(), "agent-resolver-test-"))

describe("AgentResolver", () => {
  it("validates that the requested agent exists in the app registry", async () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [{ name: "gsd-executor", tools: { read: true } }] }) } },
      projectRoot: tempDir,
    })

    await expect(resolver.resolve("gsd-executor")).resolves.toMatchObject({ name: "gsd-executor" })
    await expect(resolver.resolve("missing-agent")).rejects.toThrow('[Harness] Unknown delegation agent "missing-agent"')
  })

  it("resolves a permission profile from agent primitive metadata", async () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [{ name: "gsd-executor", tools: { read: true, edit: true } }] }) } },
      projectRoot: tempDir,
    })

    const agent = await resolver.resolve("gsd-executor")
    const profile = resolver.buildPermissionProfile(agent, {
      agent: "gsd-executor",
      category: "implementation",
      prompt: "implement the slice",
    })

    // With CapabilityGate integration (P44-03), gsd-executor matches the
    // l2-implementation-specialists seed profile ("executor" is in the match list),
    // so it receives additional Read, Write, and Session category tools beyond
    // what the explicit permission metadata alone provides.
    expect(profile.mode).toBe("write-capable")
    expect(profile.tools).toContain("read")
    expect(profile.tools).toContain("edit")
    expect(profile.tools).toContain("glob")
    expect(profile.tools).toContain("grep")
    expect(profile.tools).toContain("execute-slash-command")
    // CapabilityGate adds session tools for l2 implementation specialists
    expect(profile.tools).toContain("session-tracker")
    expect(profile.tools).toContain("hivemind-sdk-supervisor")
    expect(profile.tools.length).toBeGreaterThan(5)
  })

  it("disables recursive delegation tools for resolved agents", () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [] }) } },
      projectRoot: tempDir,
    })

    expect(resolver.buildDisabledTools()).toEqual({ "delegate-task": false, task: false })
  })
})

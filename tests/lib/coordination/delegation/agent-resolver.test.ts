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
    await expect(resolver.resolve("missing-agent")).rejects.toThrow('[Hivemind] Unknown delegation agent "missing-agent"')
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

    // After tool-governance consolidation, the CapabilityGate layer was removed.
    // Only explicit agent primitive metadata drives tool assignment.
    // gsd-executor with tools: { read: true, edit: true } gets WRITE_CAPABLE_TOOLS
    // filtered by explicit metadata (read + edit pass; glob/grep/execute-slash-command filtered).
    expect(profile.mode).toBe("write-capable")
    expect(profile.tools).toContain("read")
    expect(profile.tools).toContain("edit")
    expect(profile.tools.length).toBe(5)
  })

  it("disables recursive delegation tools for resolved agents", () => {
    const resolver = new AgentResolver({
      client: { app: { agents: async () => ({ agents: [] }) } },
      projectRoot: tempDir,
    })

    expect(resolver.buildDisabledTools()).toEqual({ "delegate-task": false, task: false })
  })
})

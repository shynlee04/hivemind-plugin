import { createDelegateTaskTool } from "../../src/tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "../../src/tools/delegation/delegation-status.js"
import { AutoLoopEngine } from "../../src/features/auto-loop/index.js"
import { RalphLoopEngine } from "../../src/features/ralph-loop/index.js"
import { setupDelegationModules } from "../../src/plugin.js"

function parse(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function createClient() {
  return {
    app: {
      agents: vi.fn(async () => [{ name: "builder", tools: { read: true } }, { name: "critic", tools: { read: true } }]),
      log: vi.fn(async () => undefined),
    },
  }
}

describe("delegation v2 plugin integration", () => {
  it("wires plugin modules through DelegationCoordinator for a delegate-task dispatch", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const nativeTask = vi.fn(async () => undefined)
    const tool = createDelegateTaskTool(modules.delegationManager, { nativeTask })

    const raw = await tool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1", task: nativeTask })

    const result = parse(raw)
    expect(result.kind).toBe("success")
    expect((result.data as Record<string, unknown>).delegationId).toMatch(/^dt-/)
    expect(nativeTask).toHaveBeenCalledWith({ agent: "builder", prompt: "build", disabledTools: ["delegate-task", "task"] })
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(1)
  })

  it("completes three sequential delegations with parent-isolated status visibility", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager, { nativeTask: vi.fn(async () => undefined) })

    const outputs = await Promise.all([
      tool.execute({ agent: "builder", prompt: "one" } as never, { sessionID: "parent-a" }),
      tool.execute({ agent: "builder", prompt: "two" } as never, { sessionID: "parent-b" }),
      tool.execute({ agent: "critic", prompt: "three" } as never, { sessionID: "parent-c" }),
    ])
    const ids = outputs.map((raw) => (parse(raw).data as Record<string, string>).delegationId)
    for (const id of ids) modules.coordinator.handleCompletion(id, { delegationId: id, status: "completed", result: `done:${id}` })

    expect(modules.delegationManager.listDelegations("parent-a").map((d) => d.id)).toEqual([ids[0]])
    expect(modules.delegationManager.listDelegations("parent-b").map((d) => d.id)).toEqual([ids[1]])
    expect(modules.delegationManager.listDelegations("parent-c").map((d) => d.id)).toEqual([ids[2]])
  })

  it("denies category-gated dispatch without creating a delegation", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder", category: "deny", prompt: "blocked" } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("error")
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(0)
  })

  it("rejects depth-limit dispatch before lifecycle registration", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })

    await expect(modules.coordinator.dispatch({ agent: "builder", currentDepth: 3, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })).rejects.toThrow("Max delegation depth")

    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(0)
  })

  it("marks timeout through active coordinator cleanup", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const result = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })

    modules.coordinator.handleTimeout(result.delegationId)

    expect(modules.delegationManager.getStatus(result.delegationId)?.status).toBe("timeout")
  })

  it("aborts an active delegation through the status tool control action", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "abort" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.getStatus(dispatched.delegationId)?.error).toContain("aborted")
  })

  it("redirects an active delegation through the status tool control action", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { coordinator: modules.coordinator, lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "redirect", redirectAgent: "critic" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.listDelegations("parent-1").some((d) => d.agent === "critic")).toBe(true)
  })

  it("runs auto-loop for three context-chained iterations through the plugin coordinator", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    vi.spyOn(modules.coordinator, "dispatch")
      .mockResolvedValueOnce({ delegationId: "dt-1", queueKey: "auto", result: "one", status: "completed" })
      .mockResolvedValueOnce({ delegationId: "dt-2", queueKey: "auto", result: "two", status: "completed" })
      .mockResolvedValueOnce({ delegationId: "dt-3", queueKey: "auto", result: "three", status: "completed" })

    const result = await new AutoLoopEngine(modules.coordinator).run({ agent: "builder", initialPrompt: "iterate", maxIterations: 3 })

    expect(result.iterations).toBe(3)
    expect(modules.coordinator.dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ prompt: expect.stringContaining("Previous result: one") }))
  })

  it("runs ralph-loop rotation for two agents across two cycles", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    vi.spyOn(modules.coordinator, "dispatch")
      .mockResolvedValueOnce({ delegationId: "dt-a", queueKey: "ralph", result: "a", status: "completed" })
      .mockResolvedValueOnce({ delegationId: "dt-b", queueKey: "ralph", result: "b", status: "completed" })

    const result = await new RalphLoopEngine(modules.coordinator).run({ agents: ["builder", "critic"], initialPrompt: "review", maxCycles: 2 })

    expect(result.cycles).toBe(2)
    expect(modules.coordinator.dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ agent: "builder" }))
    expect(modules.coordinator.dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ agent: "critic" }))
  })
})

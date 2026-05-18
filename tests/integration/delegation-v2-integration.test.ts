import { createDelegateTaskTool } from "../../src/tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "../../src/tools/delegation/delegation-status.js"
import { AutoLoopEngine } from "../../src/features/auto-loop/index.js"
import { RalphLoopEngine } from "../../src/features/ralph-loop/index.js"
import { HarnessControlPlane, setupDelegationModules } from "../../src/plugin.js"

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

function createRuntimeClient() {
  return {
    app: {
      agents: vi.fn(async () => [{ name: "builder", tools: { read: true } }, { name: "critic", tools: { read: true } }]),
      log: vi.fn(async () => undefined),
    },
    session: {
      create: vi.fn(async () => ({ data: { id: "child-integration" } })),
      messages: vi.fn(async () => ({ data: [] })),
      promptAsync: vi.fn(async () => ({ data: undefined })),
      status: vi.fn(async () => ({ data: {} })),
    },
    tui: {
      appendPrompt: vi.fn(async () => ({ data: undefined })),
      showToast: vi.fn(async () => ({ data: undefined })),
    },
  }
}

describe("delegation v2 plugin integration", () => {
  it("starts delegate-task through the SDK child-session starter", async () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client: client as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })

    const result = parse(raw)
    expect(result.kind).toBe("success")
    expect(client.session.create).toHaveBeenCalled()
    expect(client.session.promptAsync).toHaveBeenCalled()
    expect(modules.delegationManager.listDelegations("parent-1")[0]).toMatchObject({ childSessionId: "child-integration", status: "running" })
  })

  it("keeps coordinator parent isolation as L3 module evidence, not plugin runtime proof", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const outputs = await Promise.all([
      modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-a", prompt: "one", queueKey: "agent:builder:a", surface: "agent-delegation" }),
      modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-b", prompt: "two", queueKey: "agent:builder:b", surface: "agent-delegation" }),
      modules.coordinator.dispatch({ agent: "critic", currentDepth: 0, parentSessionId: "parent-c", prompt: "three", queueKey: "agent:critic:c", surface: "agent-delegation" }),
    ])
    const ids = outputs.map((entry) => entry.delegationId)
    for (const id of ids) modules.coordinator.handleCompletion(id, { delegationId: id, status: "completed", result: `done:${id}` })

    expect(modules.delegationManager.listDelegations("parent-a").map((d) => d.id)).toEqual([ids[0]])
    expect(modules.delegationManager.listDelegations("parent-b").map((d) => d.id)).toEqual([ids[1]])
    expect(modules.delegationManager.listDelegations("parent-c").map((d) => d.id)).toEqual([ids[2]])
  })

  it("delegate-task does not convert category-gated requests into fake runtime dispatches", async () => {
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

  it("completes a coordinator-tracked delegation through session idle event routing", async () => {
    const modules = setupDelegationModules({ client: createRuntimeClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })
    modules.coordinator.attachChildSession(dispatched.delegationId, "child-hook")

    modules.delegationManager.handleSessionIdle("child-hook")
    const raw = await statusTool.execute({ delegationId: dispatched.delegationId } as never, { sessionID: "parent-1" })

    expect(parse(raw).data).toMatchObject({ delegationId: dispatched.delegationId, status: "completed" })
  })

  it("confirms first action and extracts completion result through plugin message/tool/session hooks", async () => {
    const client = createRuntimeClient()
    const plugin = await HarnessControlPlane({ client: client as never, directory: "/tmp/project" } as never)
    const dispatchRaw = await plugin.tool["delegate-task"].execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })
    const delegationId = (parse(dispatchRaw).data as Record<string, unknown>).delegationId as string

    await plugin["chat.message"]?.({ message: { content: "implemented runtime behavior", role: "assistant" }, sessionID: "child-integration" }, {})
    await plugin["tool.execute.after"]?.({ args: {}, sessionID: "child-integration", tool: "read" }, {})
    await plugin.event({ event: { properties: { info: { id: "child-integration" } }, type: "session.idle" } })
    const statusRaw = await plugin.tool["delegation-status"].execute({ delegationId } as never, { sessionID: "parent-1" })
    const data = parse(statusRaw).data as Record<string, unknown>

    expect(data).toMatchObject({
      delegationId,
      evidenceLevel: "message-and-tool",
      executionState: "confirmed",
      finalMessageExcerpt: "implemented runtime behavior",
      status: "completed",
    })
    expect(data.result).toContain("implemented runtime behavior")
    expect(data.signals).toMatchObject({ messageCount: 1, toolCallCount: 1 })
  })

  it("aborts an active delegation through the status tool control action", async () => {
    const modules = setupDelegationModules({ client: createRuntimeClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "abort" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.getStatus(dispatched.delegationId)?.error).toContain("aborted")
  })

  it("redirects active delegations through the SDK starter", async () => {
    const modules = setupDelegationModules({ client: createRuntimeClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "redirect", redirectAgent: "critic" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.listDelegations("parent-1").some((d) => d.agent === "critic" && d.redirectedFrom === dispatched.delegationId)).toBe(true)
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

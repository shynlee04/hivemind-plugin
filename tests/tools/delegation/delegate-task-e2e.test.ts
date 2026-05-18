import { createDelegateTaskTool } from "../../../src/tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "../../../src/tools/delegation/delegation-status.js"
import { setupDelegationModules } from "../../../src/plugin.js"

function parse(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function createClient() {
  return { app: { agents: vi.fn(async () => [{ name: "builder", tools: { read: true } }, { name: "critic", tools: { read: true } }]), log: vi.fn(async () => undefined) } }
}

describe("delegate-task e2e tool boundary", () => {
  it("returns a runtime-blocked response through plugin-wired v2 modules", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })

    expect(parse(raw)).toMatchObject({ kind: "error" })
    expect(parse(raw).message).toContain("runtime child-session dispatch is blocked")
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(0)
  })

  it("returns validation error without creating a delegation", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder" } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("error")
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(0)
  })

  it("supports cancel control actions for coordinator-tracked delegations", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { coordinator: modules.coordinator, lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "cancel" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.getStatus(dispatched.delegationId)?.error).toContain("cancelled")
  })

  it("keeps legacy manager-compatible status listing shape", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "list" } as never, { sessionID: "parent-1" })

    const data = parse(raw).data as Array<Record<string, unknown>>
    expect(data[0]).toMatchObject({ agent: "builder", status: "dispatched" })
  })
})

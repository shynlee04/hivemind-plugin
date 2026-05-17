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
  it("dispatches a valid request through plugin-wired v2 modules", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager, { nativeTask: vi.fn(async () => undefined) })

    const raw = await tool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })

    expect(parse(raw)).toMatchObject({ kind: "success" })
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(1)
  })

  it("returns validation error without creating a delegation", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder" } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("error")
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(0)
  })

  it("supports control actions through delegation-status after dispatch", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const delegateTool = createDelegateTaskTool(modules.delegationManager)
    const statusTool = createDelegationStatusTool(modules.delegationManager, { coordinator: modules.coordinator, lifecycle: modules.lifecycle })
    const dispatched = parse(await delegateTool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })).data as Record<string, string>

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "cancel" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.getStatus(dispatched.delegationId)?.error).toContain("cancelled")
  })

  it("keeps legacy manager-compatible status listing shape", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const delegateTool = createDelegateTaskTool(modules.delegationManager)
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    await delegateTool.execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })

    const raw = await statusTool.execute({ action: "list" } as never, { sessionID: "parent-1" })

    const data = parse(raw).data as Array<Record<string, unknown>>
    expect(data[0]).toMatchObject({ agent: "builder", status: "dispatched" })
  })
})

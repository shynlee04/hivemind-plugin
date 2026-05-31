import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createDelegateTaskTool } from "../../src/tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "../../src/tools/delegation/delegation-status.js"
import { AutoLoopEngine } from "../../src/features/auto-loop/index.js"
import { RalphLoopEngine } from "../../src/features/ralph-loop/index.js"
import { HarnessControlPlane, setupDelegationModules, replayPendingDelegationNotifications } from "../../src/plugin.js"

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
  let stateDir: string

  beforeAll(() => {
    stateDir = mkdtempSync(join(tmpdir(), "delegation-v2-integration-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterAll(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(stateDir, { recursive: true, force: true })
  })

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

  it("delegate-task ignores deprecated category input and dispatches through v2 runtime", async () => {
    const modules = setupDelegationModules({ client: createClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const tool = createDelegateTaskTool(modules.delegationManager)

    const raw = await tool.execute({ agent: "builder", category: "deny", prompt: "blocked" } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(1)
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

  it("keeps parent TUI append terminal-only when progress notifications are routed", async () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client: client as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const result = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })

    modules.notificationRouter.route({ delegationId: result.delegationId, message: "checkpoint at 60s", timestamp: Date.now(), type: "progress" })
    modules.coordinator.handleCompletion(result.delegationId, { delegationId: result.delegationId, result: "done", status: "completed" })

    // 2 prompts: 1 for "started" notification (dispatch), 1 for "success" notification (handleCompletion)
    expect(client.session.promptAsync).toHaveBeenCalledTimes(2)
    // Last call should be the completion notification
    const lastCall = client.session.promptAsync.mock.calls[client.session.promptAsync.mock.calls.length - 1]
    expect(lastCall[0]).toEqual(expect.objectContaining({
      path: expect.objectContaining({ id: "parent-1" }),
      body: expect.objectContaining({ parts: expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("success") })]) }),
    }))
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

  it("chains active delegations through the SDK starter", async () => {
    const modules = setupDelegationModules({ client: createRuntimeClient() as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project", recordCategoryGateask: () => true })
    const statusTool = createDelegationStatusTool(modules.delegationManager, { lifecycle: modules.lifecycle })
    const dispatched = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", surface: "agent-delegation" })

    const raw = await statusTool.execute({ action: "control", delegationId: dispatched.delegationId, control: { action: "chain", chainParentSessionId: "parent-2" } } as never, { sessionID: "parent-1" })

    expect(parse(raw).kind).toBe("success")
    expect(modules.delegationManager.listDelegations("parent-2").some((d) => d.agent === "builder" && d.chainedFrom === dispatched.delegationId)).toBe(true)
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

  // ───────────────────────────────────────────────────────────────────────────────
  // 15-04 RED tests — pending notification replay, toast removal, sendPromptAsync injection
  // ───────────────────────────────────────────────────────────────────────────────

  it("does NOT call showTuiToast on terminal notification deliver (RED 15-04)", async () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client: client as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project" })

    const result = await modules.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })
    vi.mocked(client.tui.showToast).mockClear()
    modules.notificationRouter.route({ delegationId: result.delegationId, message: "done", timestamp: Date.now(), type: "success" })

    // Drain microtasks so the async deliver callback completes
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    // showTuiToast should NOT be called after 15-04 change
    expect(client.tui.showToast).not.toHaveBeenCalled()
  })

  it("injects sendPromptAsync into DelegationManager options (RED 15-04)", () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client: client as never, persistDelegations: () => undefined, projectDirectory: "/tmp/project" })

    const options = (modules.delegationManager as unknown as { options: Record<string, unknown> }).options
    expect(typeof options.sendPromptAsync).toBe("function")
  })

  it("replays pending notifications from continuity at plugin init (RED 15-04)", async () => {
    const client = createRuntimeClient()

    // Prep: write a pending notification to continuity
    const { recordSessionContinuity, patchSessionContinuity } = await import("../../src/task-management/continuity/index.js")
    const testSessionId = "replay-test-parent"
    recordSessionContinuity({
      sessionID: testSessionId,
      metadata: {
        pendingNotifications: [{
          agent: "delegate-task",
          createdAt: Date.now(),
          delivered: false,
          description: "Delegation dt-replay success",
          metadata: { delegationId: "dt-replay", terminalState: "completed" },
          resultPreview: "replay result completed",
          sessionID: "dt-replay",
          status: "completed",
        }],
        constraints: [],
        delegation: null,
        status: "running",
        updatedAt: Date.now(),
      },
      promptParams: {},
    })

    await HarnessControlPlane({ client: client as never, directory: "/tmp/project" } as never)

    // Init should replay the pending notification (fire-and-forget, so retry via waitFor)
    await vi.waitFor(() => {
      expect(client.tui.appendPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.objectContaining({ text: expect.stringContaining("replay result completed") }) }),
      )
    })

    // Clean up
    patchSessionContinuity(testSessionId, { pendingNotifications: [] })
  })
})

import { describe, expect, it, vi } from "vitest"

vi.mock("../../src/task-management/lifecycle/index.js", () => ({
  createHarnessLifecycleManager: () => ({
    hydrateFromContinuity: vi.fn(),
    getCompletionDetector: vi.fn(() => ({})),
  }),
}))

vi.mock("../../src/coordination/delegation/manager.js", () => ({
  DelegationManager: class {
    recoverPending = vi.fn(async () => undefined)
    setCompletionDetector = vi.fn()
    handleSessionIdle = vi.fn()
    handleSessionDeleted = vi.fn()
  },
}))

vi.mock("../../src/shared/state.js", () => ({ taskState: {} }))
vi.mock("../../src/hooks/create-core-hooks.js", () => ({ createCoreHooks: () => ({}) }))
vi.mock("../../src/hooks/create-session-hooks.js", () => ({
  createSessionHooks: () => ({ event: vi.fn(async () => ({ kind: "noop" })) }),
}))
vi.mock("../../src/hooks/create-tool-guard-hooks.js", () => ({
  createToolGuardHooks: () => ({ "tool.execute.after": vi.fn(async () => undefined) }),
}))
vi.mock("../../src/hooks/plugin-event-observers.js", () => ({
  createDelegationEventObserver: () => vi.fn(async () => ({ kind: "noop" })),
  createSessionEntryEventObserver: () => ({ observer: vi.fn(async () => undefined), getIntake: vi.fn(() => null) }),
  createSessionJourneyEventObserver: () => vi.fn(async () => ({ kind: "noop" })),
}))
vi.mock("../../src/hooks/tool-after-composer.js", () => ({
  createToolExecuteAfterHook: () => vi.fn(async () => ({ kind: "noop" })),
}))
vi.mock("../../src/shared/plugin-tool-output-summary.js", () => ({ summarizePluginToolOutput: vi.fn(() => "summary") }))
vi.mock("../../src/lib/pty/pty-runtime.js", () => ({ createPtyManagerIfSupported: vi.fn(async () => null) }))
vi.mock("../../src/shared/runtime-policy.js", () => ({ loadRuntimePolicy: vi.fn(() => ({})) }))
vi.mock("../../src/shared/workspace-runtime-policy.js", () => ({ resolveWorkspaceRuntimePolicy: vi.fn(() => "/policy") }))
vi.mock("../../src/coordination/spawner/auto-loop.js", () => ({ runAutoLoop: vi.fn(async () => undefined) }))
vi.mock("../../src/coordination/spawner/ralph-loop.js", () => ({ runRalphLoop: vi.fn(async () => undefined), escalationMessage: "escalate" }))
vi.mock("../../src/task-management/journal/event-tracker/index.js", () => ({
  createEventTrackerArtifactsFromHook: vi.fn(),
  shouldTrackEventTrackerEvent: vi.fn(() => false),
}))
vi.mock("../../src/lib/config-subscriber.js", () => ({ getConfig: vi.fn(() => ({})) }))
vi.mock("../../src/lib/behavioral-profile/resolve-behavioral-profile.js", () => ({
  resolveBehavioralProfile: vi.fn(() => ({})),
}))

describe("bootstrap tool registration", () => {
  it("registers bootstrap-init and bootstrap-recover on the plugin tool registry", async () => {
    const { HarnessControlPlane } = await import("../../src/plugin.js")
    const plugin = await HarnessControlPlane({ client: {}, directory: process.cwd() } as never)
    expect(Object.keys(plugin.tool ?? {})).toEqual(expect.arrayContaining(["bootstrap-init", "bootstrap-recover"]))
  })

  it("rejects invalid bootstrap tool scope before mutation", async () => {
    const { HarnessControlPlane } = await import("../../src/plugin.js")
    const plugin = await HarnessControlPlane({ client: {}, directory: process.cwd() } as never)

    const initTool = plugin.tool?.["bootstrap-init"]
    const recoverTool = plugin.tool?.["bootstrap-recover"]
    expect(initTool).toBeDefined()
    expect(recoverTool).toBeDefined()

    const initResult = JSON.parse(await initTool.execute({ projectRoot: process.cwd(), scope: "bogus", nonInteractive: true, config: {} }))
    const recoverResult = JSON.parse(await recoverTool.execute({ projectRoot: process.cwd(), scope: "bogus" }))

    expect(initResult.kind).toBe("error")
    expect(recoverResult.kind).toBe("error")
  })
})

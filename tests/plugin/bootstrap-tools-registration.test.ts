import { describe, expect, it, vi, afterEach } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

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
    handleSessionError = vi.fn()
    handleSessionIdle = vi.fn()
    handleSessionDeleted = vi.fn()
  },
}))

vi.mock("../../src/shared/state.js", () => ({ taskState: {} }))
vi.mock("../../src/hooks/lifecycle/core-hooks.js", () => ({ createCoreHooks: () => ({}) }))
vi.mock("../../src/hooks/lifecycle/session-hooks.js", () => ({
  createSessionHooks: () => ({ event: vi.fn(async () => ({ kind: "noop" })) }),
}))
vi.mock("../../src/hooks/guards/tool-guard-hooks.js", () => ({
  createToolGuardHooks: () => ({ "tool.execute.after": vi.fn(async () => undefined) }),
}))
vi.mock("../../src/hooks/observers/event-observers.js", () => ({
  createDelegationEventObserver: () => vi.fn(async () => ({ kind: "noop" })),
  createSessionEntryEventObserver: () => ({ observer: vi.fn(async () => undefined), getIntake: vi.fn(() => null) }),
  createSessionIsMainObserver: () => ({ observer: vi.fn(async () => undefined), isMainSession: vi.fn(() => true) }),
}))
vi.mock("../../src/hooks/transforms/tool-after-composer.js", () => ({
  createToolExecuteAfterHook: () => vi.fn(async () => ({ kind: "noop" })),
}))
vi.mock("../../src/shared/plugin-tool-output-summary.js", () => ({ summarizePluginToolOutput: vi.fn(() => "summary") }))
vi.mock("../../src/features/background-command/pty/pty-runtime.js", () => ({ createPtyManagerIfSupported: vi.fn(async () => null) }))
vi.mock("../../src/shared/runtime-policy.js", () => ({ loadRuntimePolicy: vi.fn(() => ({})) }))
vi.mock("../../src/shared/workspace-runtime-policy.js", () => ({ resolveWorkspaceRuntimePolicy: vi.fn(() => "/policy") }))
vi.mock("../../src/coordination/spawner/auto-loop.js", () => ({ runAutoLoop: vi.fn(async () => undefined) }))
vi.mock("../../src/coordination/spawner/ralph-loop.js", () => ({ runRalphLoop: vi.fn(async () => undefined), escalationMessage: "escalate" }))
vi.mock("../../src/config/subscriber.js", () => ({ getConfig: vi.fn(() => ({})), getCachedConfig: vi.fn(() => ({})) }))
vi.mock("../../src/routing/behavioral-profile/resolve-behavioral-profile.js", () => ({
  resolveBehavioralProfile: vi.fn(() => ({})),
}))

describe("bootstrap tool registration", () => {
  let tempDir: string

  afterEach(() => {
    if (tempDir) {
      try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
    }
  })

  it("registers bootstrap-init and bootstrap-recover on the plugin tool registry", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bootstrap-test-"))
    const { HarnessControlPlane } = await import("../../src/plugin.js")
    const plugin = await HarnessControlPlane({ client: {}, directory: tempDir } as never)
    expect(Object.keys(plugin.tool ?? {})).toEqual(expect.arrayContaining(["bootstrap-init", "bootstrap-recover"]))
  }, 15_000)

  it("rejects invalid bootstrap tool scope before mutation", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "bootstrap-test-"))
    const { HarnessControlPlane } = await import("../../src/plugin.js")
    const plugin = await HarnessControlPlane({ client: {}, directory: tempDir } as never)

    const initTool = plugin.tool?.["bootstrap-init"]
    const recoverTool = plugin.tool?.["bootstrap-recover"]
    expect(initTool).toBeDefined()
    expect(recoverTool).toBeDefined()

    const initResult = JSON.parse(await initTool.execute({ projectRoot: tempDir, scope: "bogus", nonInteractive: true, config: {} }))
    const recoverResult = JSON.parse(await recoverTool.execute({ projectRoot: tempDir, scope: "bogus" }))

    expect(initResult.kind).toBe("error")
    expect(recoverResult.kind).toBe("error")
  })
})

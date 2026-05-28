/**
 * Tests for SessionCreatedHandler — extracted from EventCapture.
 *
 * REQ-C6-01: Tests gate 0 (pending dispatch), SDK parentID path,
 * hierarchy index path, pending registry path, and root session path.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OpenCodeClient } from "../../../../src/shared/session-api.js"
import type { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import type { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import type { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../../../../src/features/session-tracker/persistence/project-index-writer.js"
import type { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"
import type { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import type { LastMessageCapture } from "../../../../src/features/session-tracker/capture/last-message-capture.js"

// Handler class will be imported from the FUTURE extracted path
// This import will FAIL until Wave 1 implementation
import { SessionCreatedHandler } from "../../../../src/features/session-tracker/capture/handlers/session-created-handler.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
      session: { get: vi.fn().mockResolvedValue({ parentID: null }) },
    } as unknown as OpenCodeClient,
    sessionWriter: {
      createSessionDir: vi.fn().mockResolvedValue(undefined),
      initializeSessionFile: vi.fn().mockResolvedValue(undefined),
      addChildRef: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionWriter,
    childWriter: {
      createChildFile: vi.fn().mockResolvedValue(undefined),
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter,
    sessionIndexWriter: {
      addChild: vi.fn().mockResolvedValue(undefined),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionIndexWriter,
    projectIndexWriter: {
      addSession: vi.fn().mockResolvedValue(undefined),
      incrementChildCount: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProjectIndexWriter,
    hierarchyIndex: {
      isChild: vi.fn().mockReturnValue(false),
      getParent: vi.fn().mockReturnValue(undefined),
      getRootMain: vi.fn().mockReturnValue(undefined),
      registerChild: vi.fn(),
      getDepth: vi.fn().mockReturnValue(1),
    } as unknown as HierarchyIndex,
    pendingRegistry: {
      getAnyActiveEntry: vi.fn().mockReturnValue(undefined),
      get: vi.fn().mockReturnValue(undefined),
      getByParent: vi.fn().mockReturnValue(undefined),
      has: vi.fn().mockReturnValue(false),
    } as unknown as PendingDispatchRegistry,
    manifestWriter: {
      addChild: vi.fn().mockResolvedValue(undefined),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as HierarchyManifestWriter,
    lastMessageCapture: {} as unknown as LastMessageCapture,
    assistantTurnCounters: new Map<string, number>(),
  }
}

describe("SessionCreatedHandler", () => {
  let handler: SessionCreatedHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    handler = new SessionCreatedHandler(deps)
  })

  it("should return early when pending dispatch is detected (Gate 0)", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mock("../../../../src/shared/session-api.js", () => ({
      getSession: vi.fn().mockResolvedValue({ parentID: null }),
      getSessionMessages: vi.fn().mockResolvedValue([]),
    }))

    deps.pendingRegistry.getAnyActiveEntry = vi.fn().mockReturnValue({
      parentSessionID: "parent-1",
      subagentType: "hm-executor",
      delegationDepth: 1,
    })

    await handler.handle("child-session-1")

    expect(deps.childWriter.createChildFile).toHaveBeenCalled()
    expect(deps.sessionWriter.createSessionDir).not.toHaveBeenCalled()
  })

  it("should write child file when SDK reports parentID", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: "parent-session" } as any)

    await handler.handle("child-session-2")

    expect(deps.childWriter.createChildFile).toHaveBeenCalled()
    expect(deps.sessionWriter.createSessionDir).not.toHaveBeenCalled()
  })

  it("should write child file when hierarchy index identifies child", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    deps.hierarchyIndex.isChild = vi.fn().mockReturnValue(true)
    deps.hierarchyIndex.getParent = vi.fn().mockReturnValue("parent-from-index")

    await handler.handle("child-session-3")

    expect(deps.childWriter.createChildFile).toHaveBeenCalled()
  })

  it("should register delegation from pending registry (Gate 3)", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    deps.pendingRegistry.has = vi.fn().mockReturnValue(true)
    deps.pendingRegistry.get = vi.fn().mockReturnValue({
      parentSessionID: "parent-from-pending",
      subagentType: "hm-l2-agent",
    })

    await handler.handle("child-session-4")

    expect(deps.childWriter.createChildFile).toHaveBeenCalled()
  })

  it("should create root directory for root sessions", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: null, title: "Root Session" } as any)

    await handler.handle("root-session-1")

    expect(deps.sessionWriter.createSessionDir).toHaveBeenCalledWith("root-session-1")
    expect(deps.sessionWriter.initializeSessionFile).toHaveBeenCalled()
  })
})

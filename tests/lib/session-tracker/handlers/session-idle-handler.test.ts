/**
 * Tests for SessionIdleHandler — extracted from EventCapture.
 *
 * REQ-C6-01: Tests child status update, main session completion,
 * lastMessage capture, and turn counter increment.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OpenCodeClient } from "../../../../src/shared/session-api.js"
import type { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import type { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import type { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import type { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import type { ChildBackfiller } from "../../../../src/features/session-tracker/capture/child-backfiller.js"
import type { LastMessageCapture } from "../../../../src/features/session-tracker/capture/last-message-capture.js"

// Mock session-api at module level
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

import { SessionIdleHandler } from "../../../../src/features/session-tracker/capture/handlers/session-idle-handler.js"
import { getSession, getSessionMessages } from "../../../../src/shared/session-api.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
    } as unknown as OpenCodeClient,
    sessionWriter: {
      sessionFileExists: vi.fn().mockResolvedValue(true),
      updateFrontmatter: vi.fn().mockResolvedValue(undefined),
      appendAssistantTurn: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionWriter,
    childWriter: {
      childFileExists: vi.fn().mockResolvedValue(true),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChildWriter,
    sessionIndexWriter: {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionIndexWriter,
    manifestWriter: {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as HierarchyManifestWriter,
    backfiller: {
      backfillChildTurnsFromSdk: vi.fn().mockResolvedValue(undefined),
      messageRole: vi.fn().mockReturnValue("user"),
      extractTextFromSdkMessage: vi.fn().mockReturnValue(""),
    } as unknown as ChildBackfiller,
    lastMessageCapture: {
      getLastMessage: vi.fn().mockReturnValue(""),
      clearSession: vi.fn(),
    } as unknown as LastMessageCapture,
    assistantTurnCounters: new Map<string, number>(),
    pendingRegistry: undefined,
  }
}

describe("SessionIdleHandler", () => {
  let handler: SessionIdleHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    vi.clearAllMocks()
    deps = createMockDeps()
    handler = new SessionIdleHandler(deps)
  })

  it("should update child status to completed for child sessions", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: "parent-1" } as any)

    await handler.handle("child-idle-1")

    expect(deps.childWriter.updateChildStatus).toHaveBeenCalledWith("parent-1", "child-idle-1", "completed")
    expect(deps.sessionIndexWriter.updateChildStatus).toHaveBeenCalled()
  })

  it("should complete main session and capture lastMessage", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)
    deps.lastMessageCapture.getLastMessage = vi.fn().mockReturnValue("Hello from assistant")

    await handler.handle("main-idle-1")

    expect(deps.sessionWriter.updateFrontmatter).toHaveBeenCalledWith("main-idle-1", {
      status: "completed",
      lastMessage: "Hello from assistant",
    })
  })

  it("should increment assistantTurnCounters on repeated calls", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)
    deps.lastMessageCapture.getLastMessage = vi.fn().mockReturnValue("Turn text")

    await handler.handle("turn-counter-session")
    await handler.handle("turn-counter-session")

    const count = deps.assistantTurnCounters.get("turn-counter-session")
    expect(count).toBeGreaterThanOrEqual(2)
  })
})

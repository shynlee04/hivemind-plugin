/**
 * Tests for SessionErrorHandler — extracted from EventCapture.
 *
 * REQ-C6-01: Tests child error status and main session error status.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OpenCodeClient } from "../../../../src/shared/session-api.js"
import type { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import type { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import type { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import type { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import type { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"
import type { ChildBackfiller } from "../../../../src/features/session-tracker/capture/child-backfiller.js"
import type { LastMessageCapture } from "../../../../src/features/session-tracker/capture/last-message-capture.js"

vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

import { SessionErrorHandler } from "../../../../src/features/session-tracker/capture/handlers/session-error-handler.js"
import { getSession } from "../../../../src/shared/session-api.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
    } as unknown as OpenCodeClient,
    sessionWriter: {
      sessionFileExists: vi.fn().mockResolvedValue(true),
      updateFrontmatter: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionWriter,
    childWriter: {
      childFileExists: vi.fn().mockResolvedValue(true),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
      backfillChildMetadata: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChildWriter,
    sessionIndexWriter: {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionIndexWriter,
    manifestWriter: {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as HierarchyManifestWriter,
    pendingRegistry: {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as PendingDispatchRegistry,
    backfiller: {
      backfillChildTurnsFromSdk: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChildBackfiller,
    lastMessageCapture: {
      clearSession: vi.fn(),
    } as unknown as LastMessageCapture,
    assistantTurnCounters: new Map<string, number>(),
  }
}

describe("SessionErrorHandler", () => {
  let handler: SessionErrorHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    vi.clearAllMocks()
    deps = createMockDeps()
    handler = new SessionErrorHandler(deps)
  })

  it("should set error status on child sessions", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: "parent-1" } as any)

    await handler.handle("child-error-1")

    expect(deps.childWriter.updateChildStatus).toHaveBeenCalledWith("parent-1", "child-error-1", "error")
    expect(deps.sessionIndexWriter.updateChildStatus).toHaveBeenCalledWith(
      expect.anything(),
      "child-error-1",
      "error",
    )
  })

  it("should set error status on main sessions", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    await handler.handle("main-error-1")

    expect(deps.sessionWriter.updateFrontmatter).toHaveBeenCalledWith("main-error-1", {
      status: "error",
    })
    expect(deps.lastMessageCapture.clearSession).toHaveBeenCalledWith("main-error-1")
  })
})

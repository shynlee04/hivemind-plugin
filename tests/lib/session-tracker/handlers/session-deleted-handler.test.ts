/**
 * Tests for SessionDeletedHandler — extracted from EventCapture.
 *
 * REQ-C6-01: Tests child deletion, main session cleanup, and backfill trigger.
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

import { SessionDeletedHandler } from "../../../../src/features/session-tracker/capture/handlers/session-deleted-handler.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
      session: { get: vi.fn().mockResolvedValue({ parentID: null, title: "Deleted Session" }) },
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

describe("SessionDeletedHandler", () => {
  let handler: SessionDeletedHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    handler = new SessionDeletedHandler(deps)
  })

  it("should update child status to completed for child sessions", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: "parent-1" } as any)

    await handler.handle("child-deleted-1")

    expect(deps.childWriter.updateChildStatus).toHaveBeenCalledWith("parent-1", "child-deleted-1", "completed")
  })

  it("should complete main session and clean up cache", async () => {
    const { getSession } = await import("../../../../src/shared/session-api.js")
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    await handler.handle("main-deleted-1")

    expect(deps.sessionWriter.updateFrontmatter).toHaveBeenCalledWith("main-deleted-1", {
      status: "completed",
    })
    expect(deps.lastMessageCapture.clearSession).toHaveBeenCalledWith("main-deleted-1")
  })
})

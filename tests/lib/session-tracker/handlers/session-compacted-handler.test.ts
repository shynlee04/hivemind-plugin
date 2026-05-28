/**
 * Tests for SessionCompactedHandler — extracted from EventCapture.
 *
 * REQ-C6-01: Tests event payload summary, message history fallback,
 * and child compaction.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OpenCodeClient } from "../../../../src/shared/session-api.js"
import type { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import type { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import type { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import type { ChildBackfiller } from "../../../../src/features/session-tracker/capture/child-backfiller.js"

vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

import { SessionCompactedHandler } from "../../../../src/features/session-tracker/capture/handlers/session-compacted-handler.js"
import { getSession } from "../../../../src/shared/session-api.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
    } as unknown as OpenCodeClient,
    sessionWriter: {
      appendCompactionBlock: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionWriter,
    childWriter: {
      childFileExists: vi.fn().mockResolvedValue(true),
      appendJourneyEntry: vi.fn().mockResolvedValue(undefined),
      readChildData: vi.fn().mockResolvedValue(null),
    } as unknown as ChildWriter,
    manifestWriter: {
      getChildren: vi.fn().mockResolvedValue({}),
    } as unknown as HierarchyManifestWriter,
    backfiller: {
      messageRole: vi.fn().mockReturnValue("user"),
      extractTextFromSdkMessage: vi.fn().mockReturnValue(""),
    } as unknown as ChildBackfiller,
    assistantTurnCounters: new Map<string, number>(),
  }
}

describe("SessionCompactedHandler", () => {
  let handler: SessionCompactedHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    vi.clearAllMocks()
    deps = createMockDeps()
    handler = new SessionCompactedHandler(deps)
  })

  it("should use event payload summary when available", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    await handler.handle("compacted-1", { summary: "Context was compacted" })

    expect(deps.sessionWriter.appendCompactionBlock).toHaveBeenCalledWith(
      "compacted-1",
      expect.stringContaining("Context was compacted"),
    )
  })

  it("should fall back to message history when event payload has no summary", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: null } as any)

    await handler.handle("compacted-2", {})

    expect(deps.sessionWriter.appendCompactionBlock).toHaveBeenCalled()
  })

  it("should handle child compaction via journey entry", async () => {
    vi.mocked(getSession).mockResolvedValue({ parentID: "parent-1" } as any)

    await handler.handle("compacted-child-1", { summary: "Child compacted" })

    expect(deps.childWriter.appendJourneyEntry).toHaveBeenCalled()
  })
})

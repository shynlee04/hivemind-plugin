import { describe, it, expect } from "vitest"

import {
  SIDECAR_EVENT_TYPES,
  type SidecarEventType,
  type SidecarEvent,
  type DirectoryEntry,
} from "../../src/sidecar/types.js"

describe("SidecarEventType", () => {
  it("has exactly 11 members", () => {
    expect(SIDECAR_EVENT_TYPES).toHaveLength(11)
  })

  it("contains all expected event names", () => {
    const expected = [
      "session.created",
      "session.updated",
      "session.idle",
      "session.deleted",
      "session.error",
      "delegation.dispatched",
      "delegation.completed",
      "delegation.failed",
      "delegation.timeout",
      "invalidate.cache",
      "heartbeat",
    ] satisfies SidecarEventType[]
    for (const name of expected) {
      expect(SIDECAR_EVENT_TYPES).toContain(name)
    }
  })
})

describe("SidecarEvent interface", () => {
  it("compiles with session.created type", () => {
    const event: SidecarEvent = {
      type: "session.created",
      payload: { sessionID: "ses_1" },
      timestamp: Date.now(),
    }
    expect(event.type).toBe("session.created")
    expect(event.payload.sessionID).toBe("ses_1")
    expect(typeof event.timestamp).toBe("number")
  })

  it("has payload typed as Record<string, unknown>", () => {
    const event: SidecarEvent = {
      type: "delegation.dispatched",
      payload: { delegationID: "d_abc", target: "gsd-executor" },
      timestamp: 1_000_000,
    }
    expect(event.payload.delegationID).toBe("d_abc")
    expect(event.timestamp).toBe(1_000_000)
  })
})

describe("DirectoryEntry interface", () => {
  it("has the correct shape for a file entry", () => {
    const entry: DirectoryEntry = {
      name: "config.json",
      type: "file",
      size: 1024,
      mtime: 1_700_000_000_000,
    }
    expect(entry.name).toBe("config.json")
    expect(entry.type).toBe("file")
    expect(entry.size).toBe(1024)
    expect(entry.mtime).toBe(1_700_000_000_000)
  })

  it("has the correct shape for a directory entry", () => {
    const entry: DirectoryEntry = {
      name: "state",
      type: "directory",
      size: 0,
      mtime: 1_700_000_000_001,
    }
    expect(entry.name).toBe("state")
    expect(entry.type).toBe("directory")
  })
})

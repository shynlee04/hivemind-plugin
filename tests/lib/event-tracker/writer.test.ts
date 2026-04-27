import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs"
import {
  createJourneyEventFromHook,
  sanitizeSessionArtifactStem,
  shouldTrackEventTrackerEvent,
  getEventTrackerArtifactPaths,
} from "../../../src/lib/event-tracker/writer.js"

describe("sanitizeSessionArtifactStem", () => {
  it("extracts 4-character alphanumeric suffix from session ID", () => {
    // Regex /ses[_-]?([A-Za-z0-9]{4})/i matches first 4 alphanumeric after ses[-_]?
    const result = sanitizeSessionArtifactStem("ses-abc12345")
    expect(result).toBe("ses_abc1")
    // Should NOT contain hyphens
    expect(result).not.toContain("-")
  })

  it("falls back to last 4 alphanumeric chars when no ses_ pattern", () => {
    const result = sanitizeSessionArtifactStem("some-random-id-xyz9")
    expect(result).toBe("ses_xyz9")
  })

  it("pads short IDs with zeros", () => {
    const result = sanitizeSessionArtifactStem("a")
    expect(result).toBe("ses_a000")
  })

  it("returns lowercase stem", () => {
    const result = sanitizeSessionArtifactStem("SES_ABCDEFGH")
    // Regex matches ses_ABCD (first 4 after SES_), lowercased
    expect(result).toBe("ses_abcd")
  })
})

describe("shouldTrackEventTrackerEvent", () => {
  it("returns true for session.created events", () => {
    expect(shouldTrackEventTrackerEvent({ type: "session.created" })).toBe(true)
  })

  it("returns true for session.updated events", () => {
    expect(shouldTrackEventTrackerEvent({ type: "session.updated" })).toBe(true)
  })

  it("returns true for session.idle events", () => {
    expect(shouldTrackEventTrackerEvent({ type: "session.idle" })).toBe(true)
  })

  it("returns true for session.deleted events", () => {
    expect(shouldTrackEventTrackerEvent({ type: "session.deleted" })).toBe(true)
  })

  it("returns false for message.updated (ignored hook type)", () => {
    expect(shouldTrackEventTrackerEvent({ type: "message.updated" })).toBe(false)
  })

  it("returns false for unknown event types", () => {
    expect(shouldTrackEventTrackerEvent({ type: "some.random.event" })).toBe(false)
  })

  it("returns true for tool.execute.after with sessionID", () => {
    expect(
      shouldTrackEventTrackerEvent({
        type: "tool.execute.after",
        sessionID: "ses_001",
      })
    ).toBe(true)
  })
})

describe("getEventTrackerArtifactPaths", () => {
  it("returns correct .hivemind/event-tracker/ paths", () => {
    const paths = getEventTrackerArtifactPaths("/tmp/test-project", "ses_test")
    expect(paths.jsonPath).toContain(".hivemind/event-tracker/")
    expect(paths.markdownPath).toContain(".hivemind/event-tracker/")
    expect(paths.artifactStem).toBeDefined()
    expect(paths.jsonPath).toContain(".json")
    expect(paths.markdownPath).toContain(".md")
  })
})

describe("createJourneyEventFromHook", () => {
  it("produces valid SessionJourneyEvent from session.created input", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.created", sessionID: "ses_create_1" },
      sessionId: "ses_create_1",
      timestamp: 1700000000000,
      source: "opencode.event",
    })

    expect(event.type).toBe("session_start")
    expect(event.sessionId).toBe("ses_create_1")
    expect(event.actor).toBe("system")
    expect(event.title).toBe("Session started")
    expect(event.timestamp).toBe(1700000000000)
    expect(event.source).toBe("opencode.event")
    expect(event.id).toBeDefined()
    expect(event.artifactStem).toBeDefined()
  })

  it("produces valid event for session.idle", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.idle", sessionID: "ses_idle_1", properties: { sessionID: "ses_idle_1" } },
      sessionId: "ses_idle_1",
    })

    expect(event.type).toBe("session_idle")
    expect(event.sessionId).toBe("ses_idle_1")
    expect(event.title).toBe("Session idle")
  })

  it("throws when session ID cannot be resolved", () => {
    expect(() =>
      createJourneyEventFromHook({
        event: {},
        sessionId: "",
      })
    ).toThrow(/Cannot write event-tracker artifact without session ID/)
  })

  it("handles tool execute events with tool metadata", () => {
    const event = createJourneyEventFromHook({
      event: {
        type: "tool.execute.after",
        sessionID: "ses_tool_1",
        tool: "delegate-task",
        properties: {
          tool: "delegate-task",
          status: "completed",
          summary: "Delegation created successfully",
        },
      },
      sessionId: "ses_tool_1",
    })

    expect(event.actor).toBe("tool")
    expect(event.toolUsage).toBeDefined()
    expect(event.toolUsage?.toolName).toBe("delegate-task")
  })
})

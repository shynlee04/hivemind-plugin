import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  createJourneyEventFromHook,
  sanitizeSessionArtifactStem,
  shouldTrackEventTrackerEvent,
  getEventTrackerArtifactPaths,
  writeSessionJourneyArtifacts,
  createEventTrackerArtifactsFromHook,
} from "../../../src/task-management/journal/event-tracker/writer.js"
import {
  createJourneyEventFromHook as createJourneyEventFromHookDirect,
  sanitizeSessionArtifactStem as sanitizeSessionArtifactStemDirect,
  shouldTrackEventTrackerEvent as shouldTrackEventTrackerEventDirect,
} from "../../../src/task-management/journal/event-tracker/hook-event.js"
import { renderJourneyEventMarkdown } from "../../../src/task-management/journal/event-tracker/markdown-renderer.js"
import { writeSessionJourneyArtifacts as writeSessionJourneyArtifactsDirect } from "../../../src/task-management/journal/event-tracker/artifact-writer.js"

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

describe("hook-event direct imports", () => {
  it("exposes the same pure hook-event helpers as writer.js", () => {
    const hook = {
      type: "tool.execute.after",
      sessionID: "ses_direct_1",
      properties: {
        tool: "delegate-task",
        status: "completed",
        summary: "token=secret-1234567890 completed",
      },
    }

    expect(sanitizeSessionArtifactStemDirect("ses-direct-1")).toBe(sanitizeSessionArtifactStem("ses-direct-1"))
    expect(shouldTrackEventTrackerEventDirect(hook)).toBe(shouldTrackEventTrackerEvent(hook))

    const fromWriter = createJourneyEventFromHook({ event: hook, timestamp: 1700000000000 })
    const fromDirect = createJourneyEventFromHookDirect({ event: hook, timestamp: 1700000000000 })
    expect(fromDirect).toEqual(fromWriter)
    expect(fromDirect.summary).not.toContain("secret-1234567890")
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

describe("event-tracker artifact compatibility", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "event-tracker-writer-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("writes compatible JSON and Markdown artifacts without duplicating events", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.created", sessionID: "ses_artifact_1" },
      timestamp: 1700000000000,
    })

    const first = writeSessionJourneyArtifacts({ projectRoot, event })
    const second = writeSessionJourneyArtifactsDirect({ projectRoot, event })
    const jsonText = readFileSync(first.paths.jsonPath, "utf-8")
    const document = JSON.parse(jsonText) as { _schema: string; counters: { eventCount: number }; events: unknown[] }
    const markdown = readFileSync(first.paths.markdownPath, "utf-8")

    expect(first.written).toBe(true)
    expect(second.written).toBe(false)
    expect(document._schema).toBe("harness/event-tracker/v1")
    expect(document.counters.eventCount).toBe(1)
    expect(document.events).toHaveLength(1)
    expect(markdown).toContain("# ses_")
    expect(markdown).toContain("## Table of Contents")
    expect(markdown).toContain("**eventCount:** 1")
    expect(markdown).toContain("## Session started")
  })

  it("redacts and sanitizes tool summaries in Markdown output", () => {
    writeSessionJourneyArtifacts({
      projectRoot,
      event: createJourneyEventFromHook({
        event: { type: "session.created", sessionID: "ses_tool_2" },
        timestamp: 1700000000000,
      }),
    })

    const result = createEventTrackerArtifactsFromHook({
      projectRoot,
      hook: {
        event: {
          type: "tool.execute.after",
          sessionID: "ses_tool_2",
          tool: "delegate-task",
          properties: {
            tool: "delegate-task",
            status: "completed",
            output: "api_key=abcdef1234567890\ncompleted",
          },
        },
        timestamp: 1700000000001,
      },
    })

    const markdown = readFileSync(result.paths.markdownPath, "utf-8")
    expect(existsSync(result.paths.jsonPath)).toBe(true)
    expect(markdown).toContain("Tool delegate-task")
    expect(markdown).not.toContain("abcdef1234567890")
    expect(markdown).not.toContain("\ncompleted")
  })

  it("supports direct renderer and artifact-writer imports", () => {
    const event = createJourneyEventFromHookDirect({
      event: { type: "session.created", sessionID: "ses_direct_write" },
      timestamp: 1700000000002,
    })
    const result = writeSessionJourneyArtifactsDirect({ projectRoot, event })
    const rendered = renderJourneyEventMarkdown(event)

    expect(result.written).toBe(true)
    expect(rendered).toContain("## Session started")
  })
})

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"

import {
  createEventTrackerArtifactsFromHook,
  createJourneyEventFromHook,
  getEventTrackerArtifactPaths,
  mergeSessionExportMarkdownArtifacts,
  parseSessionJourneyJson,
  parseSessionJourneyMarkdown,
  renderJourneyEventMarkdown,
  writeSessionJourneyArtifacts,
  type EventTrackerFileSystem,
} from "../../../src/lib/event-tracker/index.js"

function tempProjectRoot(): string {
  return mkdtempSync(join(tmpdir(), "harness-event-tracker-"))
}

describe("event-tracker automatic writer", () => {
  it("automatically creates paired JSON and Markdown artifacts under .hivemind/event-tracker", () => {
    const projectRoot = tempProjectRoot()

    try {
      const result = createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: { event: { type: "session.created", properties: { sessionID: "ses_2b7a" } }, timestamp: 1_777_000_000_000, source: "e2e-test" },
      })

      expect(result.paths.dir).toBe(join(projectRoot, ".hivemind", "event-tracker"))
      expect(result.paths.jsonPath).toBe(join(projectRoot, ".hivemind", "event-tracker", "ses_2b7a.json"))
      expect(result.paths.markdownPath).toBe(join(projectRoot, ".hivemind", "event-tracker", "ses_2b7a.md"))
      expect(existsSync(result.paths.dir)).toBe(true)
      expect(existsSync(result.paths.jsonPath)).toBe(true)
      expect(existsSync(result.paths.markdownPath)).toBe(true)

      const jsonMeta = parseSessionJourneyJson(readFileSync(result.paths.jsonPath, "utf-8"))
      const markdownMeta = parseSessionJourneyMarkdown(readFileSync(result.paths.markdownPath, "utf-8"))

      expect(jsonMeta).toMatchObject({ sessionId: "ses_2b7a", artifactStem: "ses_2b7a", status: "active" })
      expect(jsonMeta.counters).toMatchObject({ eventCount: 1, sessionStartCount: 1, sessionEndCount: 0 })
      expect(markdownMeta).toMatchObject({ sessionId: "ses_2b7a", artifactStem: "ses_2b7a", status: "active" })
      expect(markdownMeta.eventTypes).toContain("session_start")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("accepts canonical OpenCode event shape with properties.info.id", () => {
    const projectRoot = tempProjectRoot()

    try {
      const result = createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: { event: { type: "session.created", properties: { info: { id: "ses_2b7a" } } }, timestamp: 10, source: "canonical-test" },
      })

      expect(result.paths.jsonPath).toBe(join(projectRoot, ".hivemind", "event-tracker", "ses_2b7a.json"))
      expect(result.document.sessionId).toBe("ses_2b7a")
      expect(result.document.events[0]).toMatchObject({ actor: "system", type: "session_start" })
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("merges manual session export metadata into the bounded root lineage artifact", () => {
    const projectRoot = tempProjectRoot()
    const fixture = readFileSync(join(process.cwd(), "session-ses_23a0.md"), "utf-8")

    try {
      createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: { event: { type: "session.updated", properties: { info: { id: "ses_23a0b5eabffeB413854W6gnUKC" } } }, timestamp: 20, source: "canonical-test" },
      })
      const result = mergeSessionExportMarkdownArtifacts({ projectRoot, markdown: fixture, source: "manual-export-test" })

      expect(result.paths.jsonPath).toBe(join(projectRoot, ".hivemind", "event-tracker", "ses_23a0.json"))
      expect(result.document.sessionId).toBe("ses_23a0b5eabffeB413854W6gnUKC")
      expect(result.document.events.length).toBeLessThanOrEqual(100)
      expect(result.document.exportMeta).toMatchObject({ artifactStem: "ses_23a0" })
      expect(result.document.actors).toEqual(expect.arrayContaining(["Coordinator", "gsd-executor", "user"]))
      expect(result.document.subSessions).toEqual(expect.arrayContaining([
        expect.objectContaining({ sessionId: "ses_23a09f902ffeZcgOTkaOBE4D2x", delegatedTo: "gsd-executor" }),
      ]))
      expect(result.document.lastMessageOutput).toContain("Resume verifier")
      expect(result.document.lastMessageOutput).toContain("gsd-verifier")
      expect(result.document.lastMessageOutput.length).toBeLessThanOrEqual(2_000)
      expect(result.document.counters.eventCount).toBe(result.document.events.length)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("routes known sub-session events into the exported root artifact instead of creating sub-session root files", () => {
    const projectRoot = tempProjectRoot()
    const fixture = readFileSync(join(process.cwd(), "session-ses_23a0.md"), "utf-8")
    const rootSessionId = "ses_23a0b5eabffeB413854W6gnUKC"
    const knownSubSessionId = "ses_23a09f902ffeZcgOTkaOBE4D2x"

    try {
      mergeSessionExportMarkdownArtifacts({ projectRoot, markdown: fixture, source: "manual-export-test" })

      const subEventResult = createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: {
          event: {
            type: "session.updated",
            properties: { info: { id: knownSubSessionId, parentID: rootSessionId } },
          },
          timestamp: 30,
          source: "sub-session-test",
        },
      })
      createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: {
          event: {
            type: "session.updated",
            properties: { info: { id: "ses_bgr5", parentID: rootSessionId } },
          },
          timestamp: 31,
          source: "sub-session-test",
        },
      })

      const artifactDir = join(projectRoot, ".hivemind", "event-tracker")
      expect(readdirSync(artifactDir).sort()).toEqual(["ses_23a0.json", "ses_23a0.md"])
      expect(subEventResult.paths.jsonPath).toBe(join(artifactDir, "ses_23a0.json"))
      expect(subEventResult.document.sessionId).toBe(rootSessionId)
      expect(subEventResult.document.mainSessionId).toBe(rootSessionId)
      expect(subEventResult.document.events).toEqual(expect.arrayContaining([
        expect.objectContaining({ sessionId: knownSubSessionId, type: "session_updated" }),
      ]))
      expect(subEventResult.document.subSessions).toEqual(expect.arrayContaining([
        expect.objectContaining({ sessionId: knownSubSessionId, delegatedTo: "gsd-executor" }),
      ]))
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("does not create arbitrary root artifacts for unknown non-start events", () => {
    const projectRoot = tempProjectRoot()

    try {
      const result = createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: { event: { type: "session.updated", properties: { info: { id: "ses_randomSubOnly" } } }, timestamp: 40, source: "unknown-root-test" },
      })

      expect(result.written).toBe(false)
      const artifactDir = join(projectRoot, ".hivemind", "event-tracker")
      expect(existsSync(artifactDir) ? readdirSync(artifactDir) : []).toEqual([])
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("fails if the event-tracker directory cannot be created", () => {
    const event = createJourneyEventFromHook({ event: { type: "session.created", sessionID: "ses_2b7a" }, timestamp: 1 })
    const fs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => { throw new Error("mkdir denied") },
      readFileSync: () => "",
      writeFileSync: () => undefined,
    }

    expect(() => writeSessionJourneyArtifacts({ projectRoot: "/tmp/project", event, fs })).toThrow(
      "[Harness] Failed to create event-tracker directory",
    )
  })

  it("fails if JSON cannot be written", () => {
    const event = createJourneyEventFromHook({ event: { type: "session.created", sessionID: "ses_2b7a" }, timestamp: 1 })
    const fs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => undefined,
      readFileSync: () => "",
      writeFileSync: (path) => {
        if (String(path).endsWith(".json")) throw new Error("json denied")
      },
    }

    expect(() => writeSessionJourneyArtifacts({ projectRoot: "/tmp/project", event, fs })).toThrow(
      "[Harness] Failed to write event-tracker JSON",
    )
  })

  it("fails if Markdown cannot be written", () => {
    const event = createJourneyEventFromHook({ event: { type: "session.created", sessionID: "ses_2b7a" }, timestamp: 1 })
    const fs: EventTrackerFileSystem = {
      existsSync: () => false,
      mkdirSync: () => undefined,
      readFileSync: () => "",
      writeFileSync: (path) => {
        if (String(path).endsWith(".md")) throw new Error("markdown denied")
      },
    }

    expect(() => writeSessionJourneyArtifacts({ projectRoot: "/tmp/project", event, fs })).toThrow(
      "[Harness] Failed to write event-tracker Markdown",
    )
  })

  it("surfaces malformed existing JSON instead of silently discarding it", () => {
    const event = createJourneyEventFromHook({ event: { type: "session.created", sessionID: "ses_2b7a" }, timestamp: 1 })
    const fs: EventTrackerFileSystem = {
      existsSync: () => true,
      mkdirSync: () => undefined,
      readFileSync: () => "{ not valid json",
      writeFileSync: () => undefined,
    }

    expect(() => writeSessionJourneyArtifacts({ projectRoot: "/tmp/project", event, fs })).toThrow(
      "[Harness] Failed to parse event-tracker JSON",
    )
  })

  it("keeps updatedAt monotonic when older events arrive after newer events", () => {
    const projectRoot = tempProjectRoot()

    try {
      const newer = createJourneyEventFromHook({ event: { type: "session.updated", sessionID: "ses_2b7a", rootSessionID: "ses_2b7a" }, timestamp: 200 })
      const older = createJourneyEventFromHook({ event: { type: "session.created", sessionID: "ses_2b7a" }, timestamp: 100 })

      writeSessionJourneyArtifacts({ projectRoot, event: newer })
      const result = writeSessionJourneyArtifacts({ projectRoot, event: older })

      expect(result.document.startedAt).toBe(100)
      expect(result.document.updatedAt).toBe(200)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("fails when required selective metadata cannot be parsed from JSON or Markdown", () => {
    expect(() => parseSessionJourneyJson(JSON.stringify({ _schema: "harness/event-tracker/v1" }))).toThrow(
      "[Harness] Event-tracker JSON missing required sessionId",
    )
    expect(() => parseSessionJourneyMarkdown("# missing metadata\n\n## Table of Contents")).toThrow(
      "[Harness] Event-tracker Markdown missing required Session ID",
    )
  })

  it("sanitizes traversal and session-id injection to a four-character session suffix", () => {
    const projectRoot = tempProjectRoot()

    try {
      const result = createEventTrackerArtifactsFromHook({
        projectRoot,
        hook: { event: { type: "session.created", sessionID: "../../ses_2b7a/evil.json" }, timestamp: 2 },
      })

      expect(basename(result.paths.jsonPath)).toBe("ses_2b7a.json")
      expect(basename(result.paths.markdownPath)).toBe("ses_2b7a.md")
      expect(dirname(result.paths.jsonPath)).toBe(join(projectRoot, ".hivemind", "event-tracker"))
      expect(result.document.sessionId).toBe("../../ses_2b7a/evil.json")
      expect(result.document.artifactStem).toBe("ses_2b7a")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("renders bounded Markdown without raw hook payload firehose", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.updated", sessionID: "ses_2b7a", properties: { raw: "SHOULD_NOT_RENDER" } },
      timestamp: 3,
      source: "unit-test",
    })

    expect(renderJourneyEventMarkdown(event)).toContain("Session updated")
    expect(renderJourneyEventMarkdown(event)).not.toContain("SHOULD_NOT_RENDER")
  })

  it("derives corrected event-tracker paths without the previous sessions/journey-events path", () => {
    const paths = getEventTrackerArtifactPaths("/project", "ses_2b7a")

    expect(paths.dir).toBe(join("/project", ".hivemind", "event-tracker"))
    expect(paths.jsonPath).toBe(join("/project", ".hivemind", "event-tracker", "ses_2b7a.json"))
    expect(paths.jsonPath).not.toContain("sessions")
    expect(paths.markdownPath).not.toContain("journey-events")
  })
})

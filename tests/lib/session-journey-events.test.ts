import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  createJourneyEventFromHook,
  renderJourneyEventMarkdown,
  writeSessionJourneyArtifacts,
} from "../../src/lib/session-journey-events.js"

describe("session journey event writer", () => {
  it("maps OpenCode session events into bounded journey metadata", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.created", properties: { sessionID: "ses_start" } },
      timestamp: 1_777_000_000_000,
      source: "unit-test",
    })

    expect(event).toMatchObject({
      id: "ses_start::session_start::1777000000000",
      sessionId: "ses_start",
      type: "session_start",
      actor: "system",
      stateRole: "audit trail",
      source: "unit-test",
    })
  })

  it("writes JSON and Markdown journey artifacts under .hivemind/sessions/journey-events", () => {
    const dir = mkdtempSync(join(tmpdir(), "journey-events-"))

    try {
      const event = createJourneyEventFromHook({
        event: { type: "session.idle", sessionID: "ses_idle" },
        timestamp: 1_777_000_000_001,
        source: "unit-test",
      })

      const result = writeSessionJourneyArtifacts({ projectRoot: dir, event })
      const json = JSON.parse(readFileSync(result.jsonPath, "utf-8")) as Record<string, unknown>
      const markdown = readFileSync(result.markdownPath, "utf-8")

      expect(result.jsonPath).toBe(join(dir, ".hivemind", "sessions", "journey-events", "ses_idle.json"))
      expect(json).toMatchObject({
        _schema: "harness/session-journey/v1",
        sessionId: "ses_idle",
        counters: { eventCount: 1, sessionStartCount: 0, sessionEndCount: 0 },
      })
      expect(markdown).toContain("# ses_idle")
      expect(markdown).toContain("## Table of Contents")
      expect(markdown).toContain("session_idle")
      expect(markdown).not.toContain("properties")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("sanitizes session IDs before using them as artifact file names", () => {
    const dir = mkdtempSync(join(tmpdir(), "journey-events-path-"))

    try {
      const event = createJourneyEventFromHook({
        event: { type: "session.created", sessionID: "../ses/unsafe" },
        timestamp: 1_777_000_000_003,
        source: "unit-test",
      })

      const result = writeSessionJourneyArtifacts({ projectRoot: dir, event })

      expect(result.jsonPath).toBe(join(dir, ".hivemind", "sessions", "journey-events", ".._ses_unsafe.json"))
      const json = JSON.parse(readFileSync(result.jsonPath, "utf-8")) as Record<string, unknown>
      expect(json.sessionId).toBe("../ses/unsafe")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("renders a concise event block without raw hook payload firehose", () => {
    const event = createJourneyEventFromHook({
      event: { type: "session.updated", sessionID: "ses_render", properties: { raw: "SHOULD_NOT_RENDER" } },
      timestamp: 1_777_000_000_002,
      source: "unit-test",
    })

    const markdown = renderJourneyEventMarkdown(event)

    expect(markdown).toContain("Session updated")
    expect(markdown).not.toContain("SHOULD_NOT_RENDER")
  })

  it("is wired as an automatic plugin event writer and public export", () => {
    const plugin = readFileSync("src/plugin.ts", "utf-8")
    const index = readFileSync("src/index.ts", "utf-8")

    expect(plugin).toContain("createJourneyEventFromHook")
    expect(plugin).toContain("writeSessionJourneyArtifacts")
    expect(plugin).toContain("sessionJourneyEventObserver")
    expect(index).toContain('export * from "./lib/session-artifact-parser.js"')
    expect(index).toContain('export * from "./lib/session-journey-events.js"')
  })
})

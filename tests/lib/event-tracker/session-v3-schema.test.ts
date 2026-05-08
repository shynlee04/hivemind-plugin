import { readFileSync } from "node:fs"

import { createEmptyDocument, renderDocumentMarkdown } from "../../../src/task-management/journal/event-tracker/index.js"

describe("event-tracker session v3 metadata", () => {
  it("defaults v3 metadata on newly created and legacy-shaped documents", () => {
    const event = {
      id: "evt-1",
      sessionId: "ses_v3",
      artifactStem: "ses_v3",
      type: "session_start" as const,
      actor: "system" as const,
      title: "Session started",
      summary: "Started session",
      timestamp: 100,
      source: "test",
      stateRole: "audit trail" as const,
    }

    const document = createEmptyDocument(event)
    const legacy = JSON.parse(JSON.stringify({ ...document, lineage: undefined, purposeClass: undefined, keyFindings: undefined, resumable: undefined }))
    const markdown = renderDocumentMarkdown(legacy)

    expect(document.lineage).toEqual([])
    expect(document.purposeClass).toBe("unspecified")
    expect(document.keyFindings).toEqual([])
    expect(document.resumable).toBe(true)
    expect(markdown).toContain("**Purpose Class:** unspecified")
    expect(markdown).toContain("**Resumable:** true")
    expect(markdown).toContain("**Lineage:** None")
    expect(markdown).toContain("**Key Findings:** None")
  })

  it("bounds v3 metadata in Markdown rendering", () => {
    const longFinding = `finding-${"x".repeat(3_000)}`
    const document = {
      _schema: "harness/event-tracker/v1" as const,
      sessionId: "ses_v3",
      semanticSessionId: "ses_v3",
      artifactStem: "ses_v3",
      mainSessionId: "ses_root",
      startedAt: 1,
      updatedAt: 2,
      status: "active" as const,
      counters: { eventCount: 0, sessionStartCount: 0, sessionEndCount: 0 },
      actors: [],
      subSessions: [],
      delegations: [],
      toolsUsed: [],
      lastMessageOutput: "",
      exportMeta: null,
      toc: [],
      events: [],
      lineage: ["ses_root", "ses_v3"],
      purposeClass: "implementation",
      keyFindings: [longFinding],
      resumable: false,
    }

    const markdown = renderDocumentMarkdown(document)

    expect(markdown).toContain("**Lineage:** ses_root → ses_v3")
    expect(markdown).toContain("**Purpose Class:** implementation")
    expect(markdown).toContain("**Resumable:** false")
    expect(markdown.length).toBeLessThan(readFileSync(new URL("../../../src/task-management/journal/event-tracker/markdown-renderer.ts", import.meta.url), "utf-8").length + 5_000)
  })
})

import { parseSessionArtifactMarkdown } from "../../src/lib/session-artifact-parser.js"

describe("session artifact parser", () => {
  it("parses session header, turns, tool calls, and task delegations", () => {
    const parsed = parseSessionArtifactMarkdown(`# Session Example

**Session ID:** ses_demo
**Created:** 2026-04-26T00:00:00.000Z
**Updated:** 2026-04-26T00:01:00.000Z

---
## User

Build the tracker.

---
## Assistant (gsd-executor · openai/gpt-5.5 · 1.5s)

_Thinking:_
Need evidence.

**Tool: task**

**Input:**
\`\`\`json
{"agent":"critic","description":"review parser","subagent_type":"critic","packet_id":"pkt-1"}
\`\`\`

**Output:**
\`\`\`
done
\`\`\`
`)

    expect(parsed.header).toMatchObject({
      sessionId: "ses_demo",
      created: "2026-04-26T00:00:00.000Z",
      updated: "2026-04-26T00:01:00.000Z",
    })
    expect(parsed.turns).toHaveLength(1)
    expect(parsed.turns[0]).toMatchObject({
      turnNumber: 1,
      userMessage: "Build the tracker.",
      agentName: "gsd-executor",
      model: "openai/gpt-5.5",
      durationMs: 1500,
    })
    expect(parsed.turns[0]?.toolInvocations).toEqual([
      expect.objectContaining({ toolName: "task", outputSummary: "done" }),
    ])
    expect(parsed.turns[0]?.delegations).toEqual([
      expect.objectContaining({ packetId: "pkt-1", delegatedTo: "critic" }),
    ])
    expect(parsed.counters).toMatchObject({ userMessageCount: 1, assistantOutputCount: 1, toolCallCount: 1, delegationCount: 1 })
  })

  it("returns a bounded empty parse result for blank artifacts", () => {
    const parsed = parseSessionArtifactMarkdown("")

    expect(parsed.header.sessionId).toBe("")
    expect(parsed.turns).toEqual([])
    expect(parsed.counters).toMatchObject({ userMessageCount: 0, assistantOutputCount: 0, toolCallCount: 0, delegationCount: 0 })
  })
})

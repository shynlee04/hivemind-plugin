import { parseProductDetoxSessionMarkdown } from "../../../src/lib/event-tracker/index.js"

describe("event-tracker product-detox artifact parser", () => {
  it("parses header, assistant metadata, tools, and task delegation evidence from session Markdown", () => {
    const parsed = parseProductDetoxSessionMarkdown(`# ses_2b7a

**Session ID:** ses_2b7a
**Created:** 2026-04-01T00:00:00.000Z
**Updated:** 2026-04-01T00:01:00.000Z

---
## User

Build the tracker.

---
## Assistant (gsd-executor · openai/gpt-5.5 · 1.5s)

_Thinking:_
Need evidence.

**Tool:** task

**Input:**
json
{"agent":"critic","description":"review parser","subagent_type":"critic","packet_id":"pkt-1"}


**Output:**

done

`.replaceAll("\u001f\u001f\u001f", "```"))

    expect(parsed.header).toMatchObject({ sessionId: "ses_2b7a", title: "ses_2b7a" })
    expect(parsed.turns).toHaveLength(1)
    expect(parsed.turns[0]).toMatchObject({
      turnNumber: 1,
      userMessage: "Build the tracker.",
      agentName: "gsd-executor",
      model: "openai/gpt-5.5",
      durationMs: 1500,
    })
    expect(parsed.turns[0]?.toolInvocations).toEqual([expect.objectContaining({ toolName: "task", outputSummary: "done" })])
    expect(parsed.turns[0]?.delegations).toEqual([expect.objectContaining({ packetId: "pkt-1", delegatedTo: "critic" })])
    expect(parsed.counters).toMatchObject({ userMessageCount: 1, assistantOutputCount: 1, toolCallCount: 1, delegationCount: 1 })
  })
})

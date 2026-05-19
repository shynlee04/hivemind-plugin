import {
  checkSemanticCompletion,
  computeTotalToolActivityDuration,
  findLastToolActivity,
  hasAssistantLastMessage,
  hasFileChangeIndicators,
} from "../../../../src/coordination/delegation/completion-detector.js"

function mockMessage(role: string, parts: unknown[], ts?: number): Record<string, unknown> {
  const m: Record<string, unknown> = { info: { role }, parts }
  if (ts !== undefined) m.timestamp = ts
  return m
}
function mockToolUse(name: string, input: Record<string, unknown>, ts?: number): Record<string, unknown> {
  const p: Record<string, unknown> = { type: "tool_use", name, input }
  if (ts !== undefined) p.timestamp = ts
  return p
}
function mockToolResult(output: string, ts?: number): Record<string, unknown> {
  const p: Record<string, unknown> = { type: "tool_result", output }
  if (ts !== undefined) p.timestamp = ts
  return p
}
function mockTextPart(text: string): Record<string, unknown> {
  return { type: "text", text }
}

describe("completion-detector", () => {
  const NOW = 1_000_000

  describe("checkSemanticCompletion", () => {
    it("returns all false for empty messages", () => {
      const r = checkSemanticCompletion([])
      expect(r.toolActivityStalled).toBe(false)
      expect(r.hasAssistantMessage).toBe(false)
      expect(r.hasFileChanges).toBe(false)
      expect(r.isComplete).toBe(false)
      expect(r.lastToolActivityAt).toBeNull()
      expect(r.secondsSinceLastToolActivity).toBeNull()
    })

    it("returns false for user-only messages", () => {
      const r = checkSemanticCompletion([mockMessage("user", [mockTextPart("hi")])], { now: NOW })
      expect(r.hasAssistantMessage).toBe(false)
      expect(r.hasFileChanges).toBe(false)
      expect(r.isComplete).toBe(false)
    })

    it("detects assistant last message but no tools", () => {
      const r = checkSemanticCompletion([
        mockMessage("user", [mockTextPart("do stuff")]),
        mockMessage("assistant", [mockTextPart("done")]),
      ], { now: NOW })
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.toolActivityStalled).toBe(false)
      expect(r.hasFileChanges).toBe(false)
    })

    it("detects recent tool activity as not stalled", () => {
      const r = checkSemanticCompletion([
        mockMessage("assistant", [
          mockToolUse("bash", { command: "ls" }, NOW - 1000),
          mockToolResult("file.ts", NOW - 500),
        ]),
        mockMessage("assistant", [mockTextPart("listed")]),
      ], { now: NOW })
      expect(r.toolActivityStalled).toBe(false)
      expect(r.lastToolActivityAt).toBe(NOW - 1000)
    })

    it("detects stalled tool activity with old timestamp", () => {
      const r = checkSemanticCompletion([
        mockMessage("assistant", [
          mockToolUse("bash", { command: "ls" }, NOW - 120_000),
          mockToolResult("output", NOW - 119_000),
        ]),
        mockMessage("assistant", [mockTextPart("done")]),
      ], { now: NOW })
      expect(r.toolActivityStalled).toBe(true)
      expect(r.secondsSinceLastToolActivity).toBe(120)
    })

    it("detects file change indicators in tool_result", () => {
      const r = checkSemanticCompletion([mockMessage("assistant", [
        mockToolUse("write", { path: "/src/index.ts" }, NOW - 5000),
        mockToolResult("Wrote /src/index.ts successfully", NOW - 4000),
      ])], { now: NOW })
      expect(r.hasFileChanges).toBe(true)
    })

    it("detects file change by tool name", () => {
      const r = checkSemanticCompletion([mockMessage("assistant", [
        mockToolUse("edit", { filePath: "/foo.ts" }, NOW - 5000),
      ])], { now: NOW })
      expect(r.hasFileChanges).toBe(true)
    })

    it("isComplete is true when all three conditions met", () => {
      const r = checkSemanticCompletion([
        mockMessage("assistant", [
          mockToolUse("write", { path: "/src/a.ts" }, NOW - 120_000),
          mockToolResult("Wrote /src/a.ts", NOW - 119_000),
        ]),
        mockMessage("assistant", [mockTextPart("file written")]),
      ], { now: NOW })
      expect(r.toolActivityStalled).toBe(true)
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.hasFileChanges).toBe(true)
      expect(r.isComplete).toBe(true)
    })

    it("respects custom toolIdleThresholdMs", () => {
      const msgs = [
        mockMessage("assistant", [mockToolUse("bash", { cmd: "ls" }, NOW - 5000)]),
        mockMessage("assistant", [mockTextPart("done")]),
      ]
      expect(checkSemanticCompletion(msgs, { now: NOW }).toolActivityStalled).toBe(false)
      expect(checkSemanticCompletion(msgs, { now: NOW, toolIdleThresholdMs: 3000 }).toolActivityStalled).toBe(true)
    })

    it("uses custom now injection for time-dependent logic", () => {
      const t = 1_000_000
      const msgs = [
        mockMessage("assistant", [
          mockToolUse("write", { path: "/src/x.ts" }, t),
          mockToolResult("Wrote /src/x.ts", t + 100),
        ]),
        mockMessage("assistant", [mockTextPart("done")]),
      ]
      expect(checkSemanticCompletion(msgs, { now: t + 30_000 }).toolActivityStalled).toBe(false)
      const after = checkSemanticCompletion(msgs, { now: t + 90_000 })
      expect(after.toolActivityStalled).toBe(true)
      expect(after.isComplete).toBe(true)
    })

    it("handles mixed message sequence with multiple tools", () => {
      const r = checkSemanticCompletion([
        mockMessage("user", [mockTextPart("build")]),
        mockMessage("assistant", [mockToolUse("bash", {}, NOW - 200_000), mockToolResult("ok", NOW - 199_000)]),
        mockMessage("assistant", [mockToolUse("write", { path: "/src/f.ts" }, NOW - 150_000), mockToolResult("Wrote /src/f.ts", NOW - 149_000)]),
        mockMessage("assistant", [mockToolUse("bash", {}, NOW - 80_000), mockToolResult("3 passed", NOW - 79_000)]),
        mockMessage("assistant", [mockTextPart("complete")]),
      ], { now: NOW })
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.hasFileChanges).toBe(true)
      expect(r.lastToolActivityAt).toBe(NOW - 80_000)
      expect(r.toolActivityStalled).toBe(true)
      expect(r.isComplete).toBe(true)
    })
  })

  describe("computeTotalToolActivityDuration", () => {
    const NOW = 1_000_000

    it("returns 0 for empty messages", () => {
      expect(computeTotalToolActivityDuration([])).toBe(0)
    })

    it("returns 0 for messages with no tool_use parts", () => {
      const msgs = [mockMessage("assistant", [mockTextPart("hi")])]
      expect(computeTotalToolActivityDuration(msgs)).toBe(0)
    })

    it("returns now - timestamp for a single tool_use", () => {
      const msgs = [mockMessage("assistant", [mockToolUse("bash", {}, NOW - 5000)])]
      expect(computeTotalToolActivityDuration(msgs, NOW)).toBe(5000)
    })

    it("sums intervals between two tool_use timestamps plus last to now", () => {
      const msgs = [mockMessage("assistant", [mockToolUse("bash", {}, NOW - 80000)])]
      expect(computeTotalToolActivityDuration(msgs, NOW)).toBe(80000)
    })

    it("accumulates multiple tool_use parts correctly", () => {
      const msgs = [
        mockMessage("assistant", [mockToolUse("bash", {}, NOW - 100000)]),
        mockMessage("assistant", [mockToolUse("write", {}, NOW - 80000), mockToolUse("edit", {}, NOW - 30000)]),
      ]
      // Intervals: 100k→80k = 20k, 80k→30k = 50k, 30k→now = 30k => 100k total
      expect(computeTotalToolActivityDuration(msgs, NOW)).toBe(100000)
    })

    it("returns short duration for 3 quick tool calls in 10s", () => {
      const burstBase = NOW - 10000  // 10s ago
      const msgsShort = [
        mockMessage("assistant", [mockToolUse("bash", {}, burstBase)]),
        mockMessage("assistant", [mockToolUse("write", {}, burstBase + 3000)]),
        mockMessage("assistant", [mockToolUse("bash", {}, burstBase + 7000)]),
      ]
      // intervals: 3000 + 4000 = 7000, last ts = NOW-3000, interval to now = 3000
      // Total = 7000 + 3000 = 10000
      expect(computeTotalToolActivityDuration(msgsShort, NOW)).toBe(10000)
    })

    it("uses provided now parameter", () => {
      const testNow = 500000
      const msgs = [mockMessage("assistant", [mockToolUse("bash", {}, testNow - 30000)])]
      expect(computeTotalToolActivityDuration(msgs, testNow)).toBe(30000)
    })
  })

  describe("findLastToolActivity", () => {
    it("returns null for no tool_use parts", () => {
      expect(findLastToolActivity([])).toBeNull()
      expect(findLastToolActivity([mockMessage("user", [mockTextPart("hi")])])).toBeNull()
    })
    it("returns the last tool_use timestamp", () => {
      expect(findLastToolActivity([
        mockMessage("assistant", [mockToolUse("bash", {}, 1000)]),
        mockMessage("assistant", [mockToolUse("write", {}, 2000)]),
      ])).toBe(2000)
    })
    it("falls back to message timestamp when part lacks one", () => {
      expect(findLastToolActivity([mockMessage("assistant", [mockToolUse("bash", {})], 5000)])).toBe(5000)
    })
  })

  describe("hasAssistantLastMessage", () => {
    it("returns false for empty array", () => { expect(hasAssistantLastMessage([])).toBe(false) })
    it("returns false when last message is user", () => {
      expect(hasAssistantLastMessage([mockMessage("user", [mockTextPart("hi")])])).toBe(false)
    })
    it("returns false for assistant with empty parts", () => {
      expect(hasAssistantLastMessage([mockMessage("assistant", [])])).toBe(false)
    })
    it("returns true for assistant with text parts", () => {
      expect(hasAssistantLastMessage([mockMessage("assistant", [mockTextPart("ok")])])).toBe(true)
    })
  })

  describe("hasFileChangeIndicators", () => {
    it("returns false for no tool results or file tools", () => {
      expect(hasFileChangeIndicators([])).toBe(false)
      expect(hasFileChangeIndicators([mockMessage("assistant", [mockTextPart("nope")])])).toBe(false)
    })
    it("returns true for tool_result with file path", () => {
      expect(hasFileChangeIndicators([mockMessage("assistant", [mockToolResult("Created /src/new-file.ts")])])).toBe(true)
    })
    it("returns false for tool_result without file indicators", () => {
      expect(hasFileChangeIndicators([mockMessage("assistant", [mockToolResult("command completed")])])).toBe(false)
    })
    it("returns true for known file tool names", () => {
      expect(hasFileChangeIndicators([mockMessage("assistant", [mockToolUse("create_file", { path: "f" })])])).toBe(true)
    })
  })
})

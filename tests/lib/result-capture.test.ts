import { describe, it, expect } from "vitest"
import {
  extractAssistantText,
  extractToolCallSummary,
  extractArtifactPaths,
  extractGitCommits,
  captureProcessResult,
  truncateResultText,
} from "../../src/lib/result-capture.js"

describe("result-capture", () => {
  // ---------------------------------------------------------------------------
  // extractAssistantText
  // ---------------------------------------------------------------------------
  describe("extractAssistantText", () => {
    it("returns empty string for empty array", () => {
      expect(extractAssistantText([])).toBe("")
    })

    it("returns empty string when no assistant messages", () => {
      const messages = [{ role: "user", parts: [{ type: "text", text: "hello" }] }]
      expect(extractAssistantText(messages)).toBe("")
    })

    it("concatenates text parts from assistant messages", () => {
      const messages = [
        { role: "assistant", parts: [{ type: "text", text: "hello " }] },
        { role: "assistant", parts: [{ type: "text", text: "world" }] },
      ]
      expect(extractAssistantText(messages)).toBe("hello world")
    })

    it("reads assistant text when SDK stores role under info.role", () => {
      const messages = [
        { info: { role: "assistant" }, parts: [{ type: "text", text: "hello nested" }] },
      ]
      expect(extractAssistantText(messages)).toBe("hello nested")
    })

    it("ignores non-text parts", () => {
      const messages = [
        {
          role: "assistant",
          parts: [{ type: "tool-call", name: "Read" }],
        },
      ]
      expect(extractAssistantText(messages)).toBe("")
    })

    it("truncates at 10240 characters", () => {
      const longText = "a".repeat(20000)
      const messages = [
        { role: "assistant", parts: [{ type: "text", text: longText }] },
      ]
      const result = extractAssistantText(messages)
      expect(result.length).toBeLessThanOrEqual(10240 + "...[truncated]".length)
      expect(result.endsWith("...[truncated]")).toBe(true)
    })

    it("handles messages without parts array", () => {
      const messages = [{ role: "assistant", content: "no parts" }]
      expect(extractAssistantText(messages)).toBe("")
    })
  })

  // ---------------------------------------------------------------------------
  // extractToolCallSummary
  // ---------------------------------------------------------------------------
  describe("extractToolCallSummary", () => {
    it("returns empty array for empty messages", () => {
      expect(extractToolCallSummary([])).toEqual([])
    })

    it("extracts tool-call parts with name", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Read", arguments: { path: "/foo" } },
          ],
        },
      ]
      const result = extractToolCallSummary(messages)
      expect(result).toHaveLength(1)
      expect(result[0].tool).toBe("Read")
    })

    it("handles tool_call variant type", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool_call", name: "Write", arguments: { path: "/bar" } },
          ],
        },
      ]
      const result = extractToolCallSummary(messages)
      expect(result).toHaveLength(1)
      expect(result[0].tool).toBe("Write")
    })

    it("handles tool variant type", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool", name: "Bash", args: { command: "ls" } },
          ],
        },
      ]
      const result = extractToolCallSummary(messages)
      expect(result).toHaveLength(1)
      expect(result[0].tool).toBe("Bash")
    })

    it("truncates args to 200 chars", () => {
      const longArgs = { data: "x".repeat(500) }
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Write", arguments: longArgs },
          ],
        },
      ]
      const result = extractToolCallSummary(messages)
      expect(result[0].args!.length).toBeLessThanOrEqual(203) // 200 + "..."
    })

    it("caps at 50 summaries", () => {
      const parts = Array.from({ length: 60 }, (_, i) => ({
        type: "tool-call" as const,
        name: `Tool${i}`,
        arguments: {},
      }))
      const messages = [{ role: "assistant", parts }]
      const result = extractToolCallSummary(messages)
      expect(result.length).toBe(50)
    })

    it("skips parts without name", () => {
      const messages = [
        {
          role: "assistant",
          parts: [{ type: "tool-call" }],
        },
      ]
      expect(extractToolCallSummary(messages)).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // extractArtifactPaths
  // ---------------------------------------------------------------------------
  describe("extractArtifactPaths", () => {
    it("returns empty array for empty messages", () => {
      expect(extractArtifactPaths([])).toEqual([])
    })

    it("extracts filePath from Write tool calls", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool-call",
              name: "Write",
              arguments: { filePath: "/src/foo.ts" },
            },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/src/foo.ts"])
    })

    it("extracts path from Edit tool calls", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool-call",
              name: "Edit",
              arguments: { path: "/src/bar.ts" },
            },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/src/bar.ts"])
    })

    it("deduplicates paths", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Write", arguments: { filePath: "/dup.ts" } },
            { type: "tool-call", name: "Edit", arguments: { path: "/dup.ts" } },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/dup.ts"])
    })

    it("ignores tools without recognized path fields", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Bash", arguments: { command: "ls" } },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual([])
    })

    it("handles args field as well as arguments", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Write", args: { filePath: "/args.ts" } },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/args.ts"])
    })
  })

  // ---------------------------------------------------------------------------
  // extractGitCommits
  // ---------------------------------------------------------------------------
  describe("extractGitCommits", () => {
    it("returns empty array for no git output", () => {
      expect(extractGitCommits([])).toEqual([])
    })

    it("extracts 7-char SHAs from tool-result output text", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool-result",
              output: "[feature abc1234] some commit",
            },
          ],
        },
      ]
      expect(extractGitCommits(messages)).toEqual(["abc1234"])
    })

    it("extracts 40-char SHAs from tool-result output text", () => {
      const sha40 = "abc1234def567890123456789012345678901234"
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool-result",
              output: `commit ${sha40}`,
            },
          ],
        },
      ]
      expect(extractGitCommits(messages)).toEqual([sha40])
    })

    it("deduplicates SHAs", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-result", output: "abc1234" },
            { type: "tool-result", output: "abc1234 again" },
          ],
        },
      ]
      expect(extractGitCommits(messages)).toEqual(["abc1234"])
    })
  })

  // ---------------------------------------------------------------------------
  // captureProcessResult
  // ---------------------------------------------------------------------------
  describe("captureProcessResult", () => {
    it("wraps stdout into resultText", () => {
      const result = captureProcessResult("hello world", "")
      expect(result.resultText).toBe("hello world")
    })

    it("includes stderr when present", () => {
      const result = captureProcessResult("out", "err")
      expect(result.resultText).toBe("out\nerr")
    })

    it("sets messageCount to 1", () => {
      const result = captureProcessResult("x", "")
      expect(result.messageCount).toBe(1)
    })

    it("sets capturedAt to a finite number", () => {
      const result = captureProcessResult("x", "")
      expect(Number.isFinite(result.capturedAt)).toBe(true)
    })

    it("truncates stdout at 10240", () => {
      const longText = "a".repeat(20000)
      const result = captureProcessResult(longText, "")
      expect(result.resultText.length).toBeLessThanOrEqual(10240 + "...[truncated]".length)
      expect(result.resultText.endsWith("...[truncated]")).toBe(true)
    })

    it("returns empty arrays for artifactPaths, gitCommits, toolCallSummary", () => {
      const result = captureProcessResult("x", "")
      expect(result.artifactPaths).toEqual([])
      expect(result.gitCommits).toEqual([])
      expect(result.toolCallSummary).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // truncateResultText
  // ---------------------------------------------------------------------------
  describe("truncateResultText", () => {
    it("returns text unchanged when under limit", () => {
      expect(truncateResultText("hello")).toBe("hello")
    })

    it("appends truncation suffix when over limit", () => {
      const text = "a".repeat(20000)
      const result = truncateResultText(text)
      expect(result.length).toBe(10240 + "...[truncated]".length)
      expect(result.endsWith("...[truncated]")).toBe(true)
    })
  })
})

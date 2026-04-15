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

    it("prefers real SDK tool-part fields over legacy fields", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool",
              tool: "Read",
              name: "legacy-name-should-not-win",
              arguments: { path: "/legacy.ts" },
              state: {
                input: { filePath: "/real.ts" },
                output: "file contents",
                status: "completed",
              },
            },
          ],
        },
      ]

      const result = extractToolCallSummary(messages)
      expect(result).toEqual([
        {
          tool: "Read",
          args: JSON.stringify({ filePath: "/real.ts" }),
          output: "file contents",
          status: "completed",
        },
      ])
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

    it("extracts artifact paths from real SDK state.input payloads", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool",
              tool: "Write",
              state: {
                input: { filePath: "/sdk-write.ts" },
                output: { ok: true },
                status: "completed",
              },
            },
            {
              type: "tool",
              tool: "Edit",
              state: {
                input: { path: "/sdk-edit.ts" },
                output: { ok: true },
                status: "completed",
              },
            },
          ],
        },
      ]

      expect(extractArtifactPaths(messages)).toEqual(["/sdk-write.ts", "/sdk-edit.ts"])
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

    it("extracts commit SHAs from real SDK tool state output", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            {
              type: "tool",
              tool: "bash",
              state: {
                input: { command: "git commit -m 'test'" },
                output: "[feature abc1234] test commit",
                status: "completed",
              },
            },
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

  // ---------------------------------------------------------------------------
  // Task 4: Comprehensive result capture content tests
  // ---------------------------------------------------------------------------
  describe("Task 4: result capture completeness", () => {
    it("extracts all four capture dimensions from a realistic session", () => {
      const messages = [
        { role: "user", parts: [{ type: "text", text: "implement feature X" }] },
        {
          role: "assistant",
          parts: [
            { type: "text", text: "I'll implement feature X in the following file:" },
            { type: "tool-call", name: "Write", arguments: { filePath: "/src/feature.ts", content: "export const X = 1" } },
          ],
        },
        {
          role: "assistant",
          parts: [
            { type: "tool-result", output: "File written successfully: abc1234" },
            { type: "tool-call", name: "Bash", arguments: { command: "git commit -m 'feat: add feature X'" } },
          ],
        },
        {
          role: "assistant",
          parts: [
            { type: "tool-result", output: "[main deadbeef] feat: add feature X" },
            { type: "text", text: "Feature X has been implemented and committed." },
          ],
        },
      ]

      const text = extractAssistantText(messages)
      expect(text).toContain("I'll implement feature X")
      expect(text).toContain("Feature X has been implemented")

      const tools = extractToolCallSummary(messages)
      expect(tools.map((t) => t.tool)).toEqual(expect.arrayContaining(["Write", "Bash"]))

      const artifacts = extractArtifactPaths(messages)
      expect(artifacts).toContain("/src/feature.ts")

      const commits = extractGitCommits(messages)
      expect(commits.length).toBeGreaterThanOrEqual(1)
      expect(commits).toEqual(expect.arrayContaining([expect.stringMatching(/^[0-9a-f]{7,40}$/)]))
    })

    it("extracts tool call summary with args preserved", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Read", arguments: { filePath: "/src/foo.ts" } },
            { type: "tool-call", name: "Edit", arguments: { filePath: "/src/bar.ts", oldString: "a", newString: "b" } },
          ],
        },
      ]
      const tools = extractToolCallSummary(messages)
      expect(tools).toHaveLength(2)
      expect(tools[0].tool).toBe("Read")
      expect(tools[0].args).toContain("/src/foo.ts")
      expect(tools[1].tool).toBe("Edit")
      expect(tools[1].args).toContain("/src/bar.ts")
    })

    it("extracts multiple distinct artifact paths", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "Write", arguments: { filePath: "/a.ts" } },
            { type: "tool-call", name: "Write", arguments: { filePath: "/b.ts" } },
            { type: "tool-call", name: "Edit", arguments: { path: "/c.ts" } },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/a.ts", "/b.ts", "/c.ts"])
    })

    it("extracts commit SHAs from bash tool-result output", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-result", output: "[feature a1b2c3d] implement X\n 2 files changed" },
          ],
        },
      ]
      expect(extractGitCommits(messages)).toEqual(["a1b2c3d"])
    })

    it("extracts 40-char full SHAs from git output", () => {
      const sha = "a1b2c3d4e5f6789012345678901234567890abcd"
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-result", output: `commit ${sha}\nAuthor: test` },
          ],
        },
      ]
      expect(extractGitCommits(messages)).toEqual([sha])
    })

    it("handles mixed message roles correctly — only assistant text captured", () => {
      const messages = [
        { role: "user", parts: [{ type: "text", text: "user says hi" }] },
        { role: "system", parts: [{ type: "text", text: "system message" }] },
        { role: "assistant", parts: [{ type: "text", text: "assistant reply" }] },
        { role: "tool", parts: [{ type: "text", text: "tool output" }] },
      ]
      expect(extractAssistantText(messages)).toBe("assistant reply")
    })

    it("extracts artifact paths from 'read' and 'write' tool variants", () => {
      const messages = [
        {
          role: "assistant",
          parts: [
            { type: "tool-call", name: "read", arguments: { filePath: "/read-path.ts" } },
            { type: "tool-call", name: "write", arguments: { filePath: "/write-path.ts" } },
          ],
        },
      ]
      expect(extractArtifactPaths(messages)).toEqual(["/read-path.ts", "/write-path.ts"])
    })
  })
})

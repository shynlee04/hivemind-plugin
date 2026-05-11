import { describe, it, expect, vi, beforeEach } from "vitest"
import { createToolGuardHooks } from "../../src/hooks/guards/tool-guard-hooks.js"
import { HivemindConfigsSchema } from "../../src/schema-kernel/hivemind-configs.schema.js"

/**
 * In-memory state manager that tracks tool calls.
 */
function createFakeStateManager() {
  const stats = new Map<string, {
    total: number
    byTool: Record<string, number>
    loop: { signature: string; count: number }
    warnings: string[]
    messages: Array<{ role: string; content: string }>
  }>()

  return {
    ensureStats(sessionID: string) {
      if (!stats.has(sessionID)) {
        stats.set(sessionID, {
          total: 0,
          byTool: {},
          loop: { signature: "", count: 0 },
          warnings: [],
          messages: [],
        })
      }
      return stats.get(sessionID)!
    },
    getStats(sessionID: string) {
      return stats.get(sessionID)
    },
    addWarning: vi.fn(),
    hasStats: vi.fn().mockReturnValue(false),
  }
}

describe("createToolGuardHooks", () => {
  let stateManager: ReturnType<typeof createFakeStateManager>

  beforeEach(() => {
    stateManager = createFakeStateManager()
  })

  describe("tool.execute.before", () => {
    it("accepts tools within budget (allow path)", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Should not throw for first few tool calls
      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001", tool: "delegate-task" },
          { args: { agent: "builder" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001", tool: "delegation-status" },
          { args: {} }
        )
      ).resolves.toBeUndefined()

      const s = stateManager.getStats("ses_001")
      expect(s?.total).toBe(2)
    })

    it("bails out when sessionID is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      await expect(
        hooks["tool.execute.before"](
          { tool: "delegate-task" },
          {}
        )
      ).resolves.toBeUndefined()

      // No stats should be created
      expect(stateManager.getStats("any")).toBeUndefined()
    })

    it("bails out when tool name is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001" },
          {}
        )
      ).resolves.toBeUndefined()
    })

    it("throws when tool budget is exceeded", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Max is 400 by default (DEFAULT_RUNTIME_POLICY)
      const stats = stateManager.ensureStats("ses_002")
      stats.total = 401

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_002", tool: "delegate-task" },
          {}
        )
      ).rejects.toThrow(/exceeded the tool call budget/)
    })

    it("counts repeated same-signature tool calls", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Same args produce same signature
      const input = { sessionID: "ses_003", tool: "delegate-task" }
      const output = { args: { agent: "builder", prompt: "do work" } }

      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      const s = stateManager.getStats("ses_003")
      expect(s?.total).toBe(3)
      expect(s?.loop.count).toBe(3)
    })

    it("trips circuit breaker after threshold repeated calls", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const input = { sessionID: "ses_cb", tool: "delegate-task" }
      const output = { args: { agent: "builder" } }

      // Circuit breaker threshold is 16 by default
      // Call 15 times with identical signature — should succeed
      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 16th call should trip the circuit breaker
      await expect(
        hooks["tool.execute.before"](input, output)
      ).rejects.toThrow(/Circuit breaker tripped/)
    })
  })

  describe("tool.execute.after", () => {
    it("injects _harness metadata into output", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {}
      await hooks["tool.execute.after"](
        { sessionID: "ses_010", tool: "delegate-task", args: {} },
        output
      )

      expect(output.metadata).toBeDefined()
      const meta = output.metadata as Record<string, unknown>
      expect(meta._harness).toBeDefined()
      const harness = meta._harness as Record<string, unknown>
      expect(harness).toMatchObject({
        totalToolCalls: expect.any(Number),
        recentWarnings: expect.any(Array),
      })
    })

    it("merges _harness with existing metadata", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {
        metadata: { existingKey: "existingValue" },
      }
      await hooks["tool.execute.after"](
        { sessionID: "ses_011", tool: "delegate-task", args: {} },
        output
      )

      const meta = output.metadata as Record<string, unknown>
      expect(meta.existingKey).toBe("existingValue")
      expect(meta._harness).toBeDefined()
    })

    it("bails out when sessionID is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {}
      await hooks["tool.execute.after"](
        { tool: "delegate-task" },
        output
      )

      // No metadata injected since sessionID is missing
      expect(output.metadata).toBeUndefined()
    })
  })

  describe("document language tool guard (BOOT-09)", () => {
    const docLangConfig = HivemindConfigsSchema.parse({
      documents_and_artifacts_language: "en",
      document_paths: [".hivemind/planning/"],
    })

    it("injects language reminder for Write at .md file under document_paths", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/notes.md",
          content: "Some content",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_01", tool: "write" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.content).toContain("[LANGUAGE: Write this file in en per Language Governance.]")
      expect(args.content).toContain("Some content")
    })

    it("injects language reminder for Edit at .md file under document_paths", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/notes.md",
          oldString: "old",
          newString: "new",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_02", tool: "edit" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.newString).toContain("[LANGUAGE: Write this file in en per Language Governance.]")
      expect(args.newString).toContain("new")
    })

    it("does NOT inject reminder for Write at .md outside document_paths", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const content = "Some content"
      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/src/whatever/notes.md",
          content,
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_03", tool: "write" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.content).toBe(content)
    })

    it("does NOT inject reminder for non-.md files under document_paths", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const content = "Some content"
      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/notes.txt",
          content,
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_04", tool: "write" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.content).toBe(content)
    })

    it("injects generic _languageReminder for apply_patch", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          patchText: "--- a/file.md\n+++ b/file.md\n@@ -1 +1 @@\n-old\n+new",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_05", tool: "apply_patch" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args._languageReminder).toContain("REMINDER: All .md files in this patch MUST be written in en")
    })

    it("skips apply_patch reminder when documents_and_artifacts_language is not set", async () => {
      const noLangConfig = HivemindConfigsSchema.parse({
        document_paths: [".hivemind/planning/"],
      })

      // documents_and_artifacts_language defaults to "en" due to schema default
      // To truly test defensive behavior, we need to construct a partial
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: undefined,
      })

      const output: Record<string, unknown> = {
        args: {
          patchText: "--- a/file.md\n+++ b/file.md\n@@ -1 +1 @@\n-old\n+new",
        },
      }

      // Should not throw
      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_lang_06", tool: "apply_patch" },
          output
        )
      ).resolves.toBeUndefined()

      const args = output.args as Record<string, unknown>
      expect(args._languageReminder).toBeUndefined()
    })

    it("does NOT inject reminder for non-matching tools like read", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/notes.md",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_07", tool: "read" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args._languageReminder).toBeUndefined()
    })

    it("reminder contains the configured documents_and_artifacts_language value", async () => {
      const viConfig = HivemindConfigsSchema.parse({
        documents_and_artifacts_language: "vi",
        document_paths: [".hivemind/planning/"],
      })

      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: viConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/notes.md",
          content: "Nội dung",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_08", tool: "write" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.content).toContain("[LANGUAGE: Write this file in vi per Language Governance.]")
    })

    it("does NOT throw when hivemindConfig is undefined (defensive)", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: undefined,
      })

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_lang_09", tool: "write" },
          { args: { filePath: "/project/.hivemind/planning/notes.md", content: "hi" } }
        )
      ).resolves.toBeUndefined()
    })

    it("existing circuit-breaker behavior is unchanged when hivemindConfig is set", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: docLangConfig,
      })

      const input = { sessionID: "ses_lang_cb", tool: "delegate-task" }
      const output = { args: { agent: "builder" } }

      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      await expect(
        hooks["tool.execute.before"](input, output)
      ).rejects.toThrow(/Circuit breaker tripped/)
    })

    it("Edit at .md under document_paths with configured Vietnamese language", async () => {
      const viConfig = HivemindConfigsSchema.parse({
        documents_and_artifacts_language: "vi",
        document_paths: [".hivemind/planning/"],
      })

      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: viConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/planning/doc.md",
          oldString: "old",
          newString: "new content",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_10", tool: "edit" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.newString).toContain("[LANGUAGE: Write this file in vi per Language Governance.]")
      expect(args.newString).toContain("new content")
    })

    it("works with custom document_paths", async () => {
      const customConfig = HivemindConfigsSchema.parse({
        documents_and_artifacts_language: "ja",
        document_paths: [".docs/", ".hivemind/journal/"],
      })

      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
        hivemindConfig: customConfig,
      })

      const output: Record<string, unknown> = {
        args: {
          filePath: "/project/.hivemind/journal/session-001.md",
          content: "Journal entry",
        },
      }

      await hooks["tool.execute.before"](
        { sessionID: "ses_lang_11", tool: "write" },
        output
      )

      const args = output.args as Record<string, unknown>
      expect(args.content).toContain("[LANGUAGE: Write this file in ja per Language Governance.]")
    })
  })
})

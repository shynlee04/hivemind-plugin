import { describe, it, expect, vi, beforeEach } from "vitest"
import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
import type { PluginInput } from "@opencode-ai/plugin"

/** Known commands returned by mock command.list() */
const KNOWN_COMMANDS = [
  { name: "gsd-help", description: "Show GSD help", agent: "hm-operator", template: "Help text body", subtask: false },
  { name: "gsd-stats", description: "Show stats", template: "Stats body" },
  { name: "gsd-subtask-cmd", description: "Subtask test", agent: "hm-operator", template: "Subtask body", subtask: true },
  { name: "gsd-model-cmd", description: "Model test", model: "claude-sonnet-4-20250514", template: "Model body", subtask: false },
]

/** Create a mock SDK v1 client with all surfaces the tool uses. */
function createMockClient() {
  return {
    tui: {
      clearPrompt: vi.fn().mockResolvedValue(undefined),
      appendPrompt: vi.fn().mockResolvedValue(undefined),
      submitPrompt: vi.fn().mockResolvedValue(undefined),
    },
    session: {
      command: vi.fn().mockResolvedValue({ info: { role: "assistant", content: [] }, parts: [] }),
      prompt: vi.fn().mockResolvedValue({ info: { role: "assistant", content: [] }, parts: [] }),
    },
    command: {
      list: vi.fn().mockResolvedValue(KNOWN_COMMANDS),
    },
  } as unknown as PluginInput["client"]
}

/** Create a minimal mock ToolContext. */
function createMockCtx(overrides: Record<string, unknown> = {}) {
  return {
    sessionID: "ses_test123",
    agent: "hm-operator",
    metadata: vi.fn(),
    directory: "/tmp/test",
    worktree: "/tmp/test",
    abort: new AbortController().signal,
    ask: vi.fn(),
    messageID: "msg_test",
    ...overrides,
  } as any
}

/**
 * Parse the JSON output from a tool execution result.
 * The tool wraps ToolResponse into { output: JSON string, metadata }.
 */
function parseOutput(result: { output: string }) {
  return JSON.parse(result.output)
}

describe("execute-slash-command tool — REQ-01: SDK-native command execution", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should dispatch via SDK session.command() primary path", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-help", arguments: "--verbose" },
      createMockCtx(),
    )

    // session.command called with v1 body shape: { command, arguments } — no parts, no variant
    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          command: "gsd-help",
          arguments: "--verbose",
        }),
      }),
    )

    // Preflight called
    expect(client.command.list).toHaveBeenCalled()

    // TUI path NOT used as primary
    expect(client.tui.submitPrompt).not.toHaveBeenCalled()

    // Returns success
    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })

  it("should fall back to TUI append path when SDK session.command() fails", async () => {
    client.session.command = vi.fn().mockRejectedValue(new Error("Session busy"))

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-help", arguments: "test" },
      createMockCtx(),
    )

    // TUI path should have been used as fallback
    // Text includes @frontmatter-agent because preflight enriched the command data
    expect(client.tui.clearPrompt).toHaveBeenCalled()
    expect(client.tui.appendPrompt).toHaveBeenCalledWith({
      body: { text: "@hm-operator /gsd-help test" },
    })
    expect(client.tui.submitPrompt).toHaveBeenCalled()

    // Returns success (fallback succeeded)
    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
    expect(parsed.data).toEqual(
      expect.objectContaining({ fallback: true }),
    )
  })
})

describe("execute-slash-command tool — REQ-02: Real TUI agent switching", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should pass agent to session.command() for mechanism (a)", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-help", arguments: "", agent: "hm-researcher" },
      createMockCtx(),
    )

    // session.command called with agent parameter
    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          command: "gsd-help",
          agent: "hm-researcher",
        }),
      }),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })

  it("should run command under target agent then restore for mechanism (b)", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const ctx = createMockCtx({ agent: "hm-current" })
    const result = await tool.execute(
      { command: "gsd-help", arguments: "", agent: "hm-target", restore: true },
      ctx,
    )

    // Two session.command calls: first with target agent, second with prior agent
    expect(client.session.command).toHaveBeenCalledTimes(2)

    // First call: dispatch under target agent
    expect(client.session.command).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        body: expect.objectContaining({
          command: "gsd-help",
          agent: "hm-target",
        }),
      }),
    )

    // Second call: restore prior agent (command: "" signals no command to execute)
    expect(client.session.command).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        body: expect.objectContaining({
          command: "",
          agent: "hm-current",
        }),
      }),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
    expect(parsed.data).toEqual(
      expect.objectContaining({ restored: true, priorAgent: "hm-current" }),
    )
  })
})

describe("execute-slash-command tool — REQ-03: Command existence preflight", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should return graceful error for unknown command without dispatching", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "nonexistent-cmd", arguments: "" },
      createMockCtx(),
    )

    // session.command must NOT have been called — preflight blocked dispatch
    expect(client.session.command).not.toHaveBeenCalled()
    expect(client.tui.appendPrompt).not.toHaveBeenCalled()

    // Error response
    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("not found")

    // Available commands included in error data
    expect(parsed.data).toEqual(
      expect.objectContaining({
        availableCommands: expect.arrayContaining(["gsd-help", "gsd-stats", "gsd-subtask-cmd"]),
      }),
    )
  })

  it("should proceed with command execution when preflight passes", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-stats", arguments: "" },
      createMockCtx(),
    )

    // Command found — session.command should have been called
    expect(client.session.command).toHaveBeenCalled()

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })
})

describe("execute-slash-command tool — REQ-04: Command frontmatter awareness", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should use frontmatter agent when no explicit agent is provided", async () => {
    const tool = createExecuteSlashCommandTool(client)
    // gsd-help has frontmatter agent: "hm-operator"
    const result = await tool.execute(
      { command: "gsd-help", arguments: "" },
      createMockCtx(),
    )

    // No explicit agent — frontmatter agent should be used
    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ agent: "hm-operator" }),
      }),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })

  it("should prefer explicit agent over frontmatter agent", async () => {
    const tool = createExecuteSlashCommandTool(client)
    // gsd-help has frontmatter agent: "hm-operator", but we pass explicit "hm-researcher"
    const result = await tool.execute(
      { command: "gsd-help", arguments: "", agent: "hm-researcher" },
      createMockCtx(),
    )

    // Explicit agent should win over frontmatter
    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ agent: "hm-researcher" }),
      }),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })

  it("should use frontmatter model when no explicit model is provided", async () => {
    const tool = createExecuteSlashCommandTool(client)
    // gsd-model-cmd has frontmatter model: "claude-sonnet-4-20250514"
    const result = await tool.execute(
      { command: "gsd-model-cmd", arguments: "" },
      createMockCtx(),
    )

    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ model: "claude-sonnet-4-20250514" }),
      }),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
  })
})

describe("execute-slash-command tool — REQ-04 subtask: Subtask routing", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should route subtask commands via session.prompt() with SubtaskPartInput", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-subtask-cmd", arguments: "test args" },
      createMockCtx(),
    )

    // session.prompt called (NOT session.command)
    expect(client.session.prompt).toHaveBeenCalled()
    expect(client.session.command).not.toHaveBeenCalled()

    // Verify SubtaskPartInput shape
    expect(client.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              type: "subtask",
              agent: "hm-operator",
              prompt: expect.stringContaining("Subtask body"),
            }),
          ]),
        }),
      }),
    )

    // Returns success with subtask mode
    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
    expect(parsed.metadata).toEqual(
      expect.objectContaining({ mode: "subtask" }),
    )
  })
})

describe("execute-slash-command tool — REQ-05: Argument/template parsing", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should pass arguments string to session.command() for server-side parsing", async () => {
    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "gsd-help", arguments: "21.1 --skip research" },
      createMockCtx(),
    )

    // Arguments passed verbatim to SDK server — tool does NOT parse at this level
    expect(client.session.command).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          arguments: "21.1 --skip research",
        }),
      }),
    )
  })
})

describe("execute-slash-command tool — REQ-06: Primitive discovery / agent listing", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should include available commands in preflight error when command not found", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "zzz-unknown", arguments: "" },
      createMockCtx(),
    )

    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("error")

    // Error data has availableCommands from preflight
    expect(parsed.data).toEqual(
      expect.objectContaining({
        availableCommands: expect.arrayContaining([
          "gsd-help",
          "gsd-stats",
          "gsd-subtask-cmd",
          "gsd-model-cmd",
        ]),
      }),
    )

    // Error message includes command name and hints
    expect(parsed.message).toContain("zzz-unknown")
    expect(parsed.message).toContain("Available commands")
  })
})

describe("execute-slash-command tool — REQ-07: Standard result envelope", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should return standard ToolResponse envelope on success", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-help", arguments: "" },
      createMockCtx(),
    )

    // ToolResponse shape inside output: kind, message, data, metadata
    const parsed = parseOutput(result)
    expect(parsed).toHaveProperty("kind", "success")
    expect(parsed).toHaveProperty("message")
    expect(parsed).toHaveProperty("data")
    expect(parsed).toHaveProperty("metadata")
    expect(parsed.message).toEqual(expect.any(String))
  })

  it("should return standard ToolResponse envelope on preflight error", async () => {
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "nonexistent", arguments: "" },
      createMockCtx(),
    )

    const parsed = parseOutput(result)
    expect(parsed).toHaveProperty("kind", "error")
    expect(parsed).toHaveProperty("message")
    expect(parsed).toHaveProperty("data")
    expect(parsed).toHaveProperty("metadata")
  })
})

describe("execute-slash-command tool — Critical flaw coverage", () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  it("should use correct appendPrompt body format in TUI fallback (flaw 3)", async () => {
    // Force SDK path to fail, triggering TUI fallback
    client.session.command = vi.fn().mockRejectedValue(new Error("SDK error"))

    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "gsd-help", arguments: "verbose", agent: "hm-researcher" },
      createMockCtx(),
    )

    // appendPrompt must use { body: { text } } format — NOT raw text or { text } directly
    expect(client.tui.appendPrompt).toHaveBeenCalledWith({
      body: { text: "@hm-researcher /gsd-help verbose" },
    })
  })

  it("should gracefully handle restore chain errors (flaw 4)", async () => {
    // First call succeeds, second (restore) call fails
    client.session.command = vi.fn()
      .mockResolvedValueOnce({ info: { role: "assistant", content: [] }, parts: [] }) // primary dispatch
      .mockRejectedValueOnce(new Error("Restore failed")) // restore fails

    const tool = createExecuteSlashCommandTool(client)
    const ctx = createMockCtx({ agent: "hm-current" })
    const result = await tool.execute(
      { command: "gsd-help", arguments: "", agent: "hm-target", restore: true },
      ctx,
    )

    // Both session.command calls were made (primary + restore attempted)
    expect(client.session.command).toHaveBeenCalledTimes(2)

    // Restore failed — TUI fallback should have been used
    expect(client.tui.clearPrompt).toHaveBeenCalled()
    expect(client.tui.appendPrompt).toHaveBeenCalled()

    // Returns success (fallback worked) with fallback flag
    const parsed = parseOutput(result)
    expect(parsed.kind).toBe("success")
    expect(parsed.data).toEqual(
      expect.objectContaining({ fallback: true }),
    )
  })
})

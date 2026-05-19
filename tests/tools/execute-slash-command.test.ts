import { describe, it, expect, vi } from "vitest"
import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
import type { PluginInput } from "@opencode-ai/plugin"

describe("execute-slash-command tool", () => {
  it("should successfully dispatch through the OpenCode TUI prompt pipeline", async () => {
    const clearPromptMock = vi.fn(async () => undefined)
    const appendPromptMock = vi.fn(async () => undefined)
    const submitPromptMock = vi.fn(async () => undefined)
    
    const client = {
      tui: {
        clearPrompt: clearPromptMock,
        appendPrompt: appendPromptMock,
        submitPrompt: submitPromptMock,
      },
    } as unknown as PluginInput["client"]

    const executeSlashCommandTool = createExecuteSlashCommandTool(client)

    // Mock ToolContext
    const metadataMock = vi.fn()
    const ctx = {
      sessionID: "ses_abc123",
      agent: "hm-operator",
      metadata: metadataMock,
      directory: "/fake/dir",
      worktree: "/fake/worktree",
      abort: new AbortController().signal,
      ask: vi.fn(),
      messageID: "msg_abc"
    } as any

    const args = {
      command: "test-echo",
      arguments: "hello world"
    }

    const result = await executeSlashCommandTool.execute(args, ctx)

    // Verify the architectural boundary: tool uses the non-blocking TUI pipeline.
    expect(clearPromptMock).toHaveBeenCalledOnce()
    expect(appendPromptMock).toHaveBeenCalledWith({
      body: { text: "/test-echo hello world" },
    })
    expect(submitPromptMock).toHaveBeenCalledOnce()

    // Verify successful return format
    expect(result).toMatchObject({
      metadata: { command: "test-echo", dispatched: true, promptText: "/test-echo hello world" },
    })
    expect(result.output).toContain("Command /test-echo hello world dispatched to TUI prompt")

    // Verify UI metadata was emitted
    expect(metadataMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Executing /test-echo hello world" }))
  })

  it("should gracefully return a failure envelope if TUI dispatch throws", async () => {
    const clearPromptMock = vi.fn(async () => undefined)
    const appendPromptMock = vi.fn().mockRejectedValue(new Error("Network Error"))
    const submitPromptMock = vi.fn(async () => undefined)
    
    const client = {
      tui: {
        clearPrompt: clearPromptMock,
        appendPrompt: appendPromptMock,
        submitPrompt: submitPromptMock,
      },
    } as unknown as PluginInput["client"]

    const executeSlashCommandTool = createExecuteSlashCommandTool(client)

    const result = await executeSlashCommandTool.execute({ command: "bad-command", arguments: "" }, {
      sessionID: "ses_abc123",
      agent: "hm-operator",
      metadata: vi.fn()
    } as any)

    // Verify the tool gracefully handles rejection without crashing the plugin.
    expect(result).toEqual({
      output: "✗ Failed to dispatch /bad-command: Network Error",
      metadata: {
        error: true,
        errorType: "internal",
        command: "bad-command",
        message: "Network Error",
      },
    })
  })
})

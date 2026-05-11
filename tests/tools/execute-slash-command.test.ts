import { describe, it, expect, vi } from "vitest"
import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
import type { PluginInput } from "@opencode-ai/plugin"

describe("execute-slash-command tool", () => {
  it("should successfully call the OpenCode client session command API", async () => {
    // Mock the OpenCode client session.command endpoint
    const commandMock = vi.fn().mockResolvedValue({
      data: {
        info: { id: "msg_123" }
      }
    })
    
    const client = {
      session: {
        command: commandMock
      }
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

    // Verify the architectural boundary: tool calls the correct SDK endpoint
    expect(commandMock).toHaveBeenCalledWith({
      path: { id: "ses_abc123" },
      body: {
        command: "test-echo",
        arguments: "hello world",
        agent: "hm-operator"
      }
    })

    // Verify successful return format
    expect(result).toEqual({
      output: "Successfully executed /test-echo. Response ID: msg_123",
      metadata: { responseId: "msg_123", command: "test-echo" }
    })

    // Verify UI metadata was emitted
    expect(metadataMock).toHaveBeenCalledWith({ title: "Executing /test-echo" })
  })

  it("should gracefully return a failure string if the SDK throws", async () => {
    const commandMock = vi.fn().mockRejectedValue(new Error("Network Error"))
    
    const client = {
      session: {
        command: commandMock
      }
    } as unknown as PluginInput["client"]

    const executeSlashCommandTool = createExecuteSlashCommandTool(client)

    const result = await executeSlashCommandTool.execute({ command: "bad-command", arguments: "" }, {
      sessionID: "ses_abc123",
      agent: "hm-operator",
      metadata: vi.fn()
    } as any)

    // Verify the tool gracefully handles rejection without crashing the plugin
    expect(result).toBe("Failed to execute command /bad-command: Network Error")
  })
})

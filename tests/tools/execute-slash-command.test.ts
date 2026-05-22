import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, it, expect, vi } from "vitest"
import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
import type { PluginInput } from "@opencode-ai/plugin"

async function createProjectWithCommand(commandName: string, commandContent: string): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "hivemind-command-test-"))
  const commandsDir = path.join(projectRoot, ".opencode", "commands")
  await mkdir(commandsDir, { recursive: true })
  await writeFile(path.join(commandsDir, `${commandName}.md`), commandContent, "utf-8")
  return projectRoot
}

async function createGlobalConfigWithCommand(commandDirName: "command" | "commands", commandName: string, commandContent: string): Promise<string> {
  const globalConfigRoot = await mkdtemp(path.join(tmpdir(), "hivemind-global-command-test-"))
  const commandsDir = path.join(globalConfigRoot, commandDirName)
  await mkdir(commandsDir, { recursive: true })
  await writeFile(path.join(commandsDir, `${commandName}.md`), commandContent, "utf-8")
  return globalConfigRoot
}

async function waitForDeferredDispatch(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 75))
}

describe("execute-slash-command tool", () => {
  it("should return immediately even when deferred subtask prompt never resolves", async () => {
    const promptMock = vi.fn(() => new Promise(() => undefined))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "never-resolve-command",
      `---
description: "Never resolve command"
---

Run with: $ARGUMENTS
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "never-resolve-command", arguments: "no hang", agent: "hm-l2-general", subtask: true },
      {
        sessionID: "ses_never",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_never",
      } as any,
    )

    expect(result.metadata).toMatchObject({
      command: "never-resolve-command",
      agent: "hm-l2-general",
      mode: "subtask",
      scheduled: true,
      dispatched: true,
    })
  })

  it("should allow one-shot subtask and agent overrides for commands without those frontmatter fields", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "plain-command",
      `---
description: "Plain command"
---

Run with: $ARGUMENTS
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "plain-command", arguments: "natural language intent", agent: "hm-l2-researcher", subtask: true },
      {
        sessionID: "ses_override",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_override",
      } as any,
    )

    expect(result.metadata).toMatchObject({ scheduled: true })
    await waitForDeferredDispatch()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      path: { id: "ses_override" },
      body: {
        agent: "hm-l2-researcher",
        parts: [
          {
            type: "subtask",
            agent: "hm-l2-researcher",
            description: "Plain command",
            prompt: "Run with: natural language intent",
          },
        ],
      },
    }))
  })

  it("should reject explicit subtask false agent override — front-facing dispatch is not supported by current SDK", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "front-agent-command",
      `---
description: "Front agent command"
---

Do front-agent work with: $ARGUMENTS
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "front-agent-command", arguments: "phase 21.2", agent: "gsd-executor", subtask: false },
      {
        sessionID: "ses_front_agent",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_front_agent",
      } as any,
    )

    expect(client.tui.appendPrompt).not.toHaveBeenCalled()
    expect(result.metadata).toMatchObject({
      command: "front-agent-command",
      error: true,
      errorType: "unsupported",
    })
    expect(result.output).toContain("front-facing dispatch (subtask:false) requires upstream OpenCode SDK support")
  })

  it("should discover global singular command directory when project command is absent", async () => {
    const previousGlobalConfigDir = process.env.OPENCODE_GLOBAL_CONFIG_DIR
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await mkdtemp(path.join(tmpdir(), "hivemind-empty-project-"))
    const globalConfigRoot = await createGlobalConfigWithCommand(
      "command",
      "global-command",
      `---
description: "Global command"
agent: hm-l1-coordinator
subtask: true
---

Global says: $ARGUMENTS
`,
    )

    try {
      process.env.OPENCODE_GLOBAL_CONFIG_DIR = globalConfigRoot
      const tool = createExecuteSlashCommandTool(client)
      await tool.execute(
        { command: "global-command", arguments: "from global" },
        {
          sessionID: "ses_global",
          agent: "hm-build",
          metadata: vi.fn(),
          directory: projectRoot,
          worktree: projectRoot,
          abort: new AbortController().signal,
          ask: vi.fn(),
          messageID: "msg_global",
        } as any,
      )
    } finally {
      if (previousGlobalConfigDir === undefined) delete process.env.OPENCODE_GLOBAL_CONFIG_DIR
      else process.env.OPENCODE_GLOBAL_CONFIG_DIR = previousGlobalConfigDir
    }

    await waitForDeferredDispatch()
    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      path: { id: "ses_global" },
      body: expect.objectContaining({
        agent: "hm-l1-coordinator",
        parts: [expect.objectContaining({ prompt: "Global says: from global" })],
      }),
    }))
  })

  it("should dispatch subtask commands with expanded body, description, and agent", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "hf-prompt-enhance",
      `---
description: "Enhance prompt"
agent: hm-l1-coordinator
subtask: true
---

Variable mapping: \`$ARGUMENTS\` becomes \`$USER_PROMPT\`.

User prompt:
"$ARGUMENTS"
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "hf-prompt-enhance", arguments: "manual example" },
      {
        sessionID: "ses_test",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_test",
      } as any,
    )

    await waitForDeferredDispatch()
    expect(promptMock).toHaveBeenCalledWith({
      path: { id: "ses_test" },
      body: {
        agent: "hm-l1-coordinator",
        parts: [
          {
            type: "subtask",
            agent: "hm-l1-coordinator",
            description: "Enhance prompt",
            prompt: expect.stringContaining('User prompt:\n"manual example"'),
          },
        ],
      },
      query: { directory: projectRoot },
    })
    expect(result.metadata).toMatchObject({
      command: "hf-prompt-enhance",
      agent: "hm-l1-coordinator",
      mode: "subtask",
      scheduled: true,
      dispatched: true,
    })
  })

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

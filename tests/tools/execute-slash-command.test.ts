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

async function waitForDeferredDispatch(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 75))
}

describe("execute-slash-command tool", () => {
  it("should dispatch synthetic parent prompt for subtask:false + agent and restore original agent", async () => {
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
      agent: "gsd-executor",
      mode: "synthetic-parent-prompt",
      scheduled: true,
      dispatched: true,
    })
    await waitForDeferredDispatch()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      path: { id: "ses_front_agent" },
      body: {
        agent: "gsd-executor",
        parts: [
          {
            type: "text",
            text: "Do front-agent work with: phase 21.2",
          },
        ],
      },
      query: { directory: projectRoot },
    }))

    expect(promptMock).toHaveBeenCalledTimes(2)
    const restoreCall = promptMock.mock.calls[1][0] as Record<string, unknown>
    expect(restoreCall.body).toMatchObject({
      agent: "hm-build",
    })
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

  it("should dispatch one-shot subtask override with explicit agent and expanded body", async () => {
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

  it("should dispatch subtask:true command from frontmatter when agent is available", async () => {
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
      "auto-subtask-cmd",
      `---
description: "Auto subtask cmd"
agent: hm-l1-coordinator
subtask: true
---
Auto-subtask body
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "auto-subtask-cmd" },
      {
        sessionID: "ses_auto",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_auto",
      } as any,
    )

    await waitForDeferredDispatch()
    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        agent: "hm-l1-coordinator",
        parts: [expect.objectContaining({ type: "subtask" })],
      },
    }))
  })

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

  it("should dispatch to TUI prompt pipeline when no agent or subtask override", async () => {
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

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "test-echo", arguments: "hello world" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: "/fake/dir",
        worktree: "/fake/worktree",
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_abc",
      } as any,
    )

    expect(clearPromptMock).toHaveBeenCalledOnce()
    expect(appendPromptMock).toHaveBeenCalledWith({ body: { text: "/test-echo hello world" } })
    expect(submitPromptMock).toHaveBeenCalledOnce()
    expect(result.output).toContain("Command /test-echo hello world dispatched to TUI prompt")
  })

  it("should gracefully return failure envelope if TUI dispatch throws", async () => {
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

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "bad-command" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
      } as any,
    )

    expect(result.metadata).toMatchObject({ error: true, command: "bad-command" })
    expect(result.output).toContain("Network Error")
  })
})

import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, it, expect, vi } from "vitest"
import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
import type { PluginInput } from "@opencode-ai/plugin"

/** Wait for deferred (setTimeout 50ms) dispatch to fire. */
async function flushDeferred(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 60))
}

async function createProjectWithCommand(commandName: string, commandContent: string): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "hivemind-command-test-"))
  const commandsDir = path.join(projectRoot, ".opencode", "commands")
  await mkdir(commandsDir, { recursive: true })
  await writeFile(path.join(commandsDir, `${commandName}.md`), commandContent, "utf-8")
  return projectRoot
}

describe("execute-slash-command tool", () => {
  it("should dispatch synthetic parent prompt for subtask:false + agent", async () => {
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
    await flushDeferred()

    expect(client.tui.appendPrompt).not.toHaveBeenCalled()
    expect(result.metadata).toMatchObject({
      command: "front-agent-command",
      agent: "gsd-executor",
      mode: "synthetic-parent-prompt",
      scheduled: true,
      dispatched: true,
    })

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      path: { id: "ses_front_agent" },
      body: {
        agent: "gsd-executor",
        parts: [{ type: "text", text: "Do front-agent work with: phase 21.2" }],
      },
      query: { directory: projectRoot },
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
    await flushDeferred()

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
            commandSource: "user",
            parentSessionID: "ses_test",
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
    await flushDeferred()
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
            commandSource: "user",
            parentSessionID: "ses_override",
          },
        ],
      },
      query: { directory: projectRoot },
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
    await flushDeferred()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        agent: "hm-l1-coordinator",
        parts: [expect.objectContaining({ type: "subtask" })],
      },
    }))
  })

  it("returns error envelope when subtask prompt dispatch fails", async () => {
    const promptMock = vi.fn().mockRejectedValue(new Error("Dispatch rejected by SDK"))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(async () => undefined),
        appendPrompt: vi.fn(async () => undefined),
        submitPrompt: vi.fn(async () => undefined),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "fail-dispatch-command",
      `---
description: "Fail dispatch command"
---
Run with: $ARGUMENTS
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "fail-dispatch-command", arguments: "no hang", agent: "hm-l2-general", subtask: true },
      {
        sessionID: "ses_fail",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_fail",
      } as any,
    )

    // Real SDK dispatch errors are now propagated back to the tool output
    expect(result).toHaveProperty("error", true)
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
    const projectRoot = await createProjectWithCommand(
      "test-echo",
      `---
description: "Echo test"
---
Echo body
`
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "test-echo", arguments: "hello world" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
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
    const projectRoot = await createProjectWithCommand(
      "bad-command",
      `---
description: "Bad command test"
---
Bad body
`
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "bad-command" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
      } as any,
    )

    expect(result.metadata).toMatchObject({ error: true, command: "bad-command" })
    expect(result.output).toContain("Network Error")
  })

  it("should match command with fuzzy hyphens/underscores/casing", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "my-test-command",
      `---
description: "Fuzzy matching test"
---
Test body
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "MY_TEST_command", agent: "gsd-executor", subtask: false },
      {
        sessionID: "ses_fuzzy",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_fuzzy",
      } as any,
    )

    expect(result.metadata).toMatchObject({
      command: "MY_TEST_command",
      agent: "gsd-executor",
      mode: "synthetic-parent-prompt",
    })
  })

  it("should track pending dispatches in sessionTracker pendingRegistry", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "subtask-cmd-track",
      `---
description: "Subtask tracking test"
agent: hm-l1-coordinator
subtask: true
---
Track body
`,
    )

    const addMock = vi.fn()
    const mockSessionTracker = {
      pendingRegistry: {
        add: addMock,
      },
    }

    const tool = createExecuteSlashCommandTool(client, mockSessionTracker)
    await tool.execute(
      { command: "subtask-cmd-track" },
      {
        sessionID: "ses_track",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_track",
      } as any,
    )

    expect(addMock).toHaveBeenCalledOnce()
    expect(addMock).toHaveBeenCalledWith(expect.objectContaining({
      parentSessionID: "ses_track",
      subagentType: "hm-l1-coordinator",
      tool: "execute-slash-command",
    }))
  })

  it("should return consistent { output, metadata, error } success envelope with execution tracking and commandSource", async () => {
    const client = {
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as any
    const projectRoot = await createProjectWithCommand(
      "test-echo",
      `---
description: "Echo test"
---
Echo body
`
    )
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "test-echo", arguments: "hello world", commandSource: "agent", trackExecution: true },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
      } as any,
    )

    expect(result).toHaveProperty("output")
    expect(result).toHaveProperty("metadata")
    expect(result).toHaveProperty("error", false)
    expect(result.metadata).toMatchObject({
      commandSource: "agent",
      trackExecution: true,
      command: "test-echo",
      mode: "user-session",
      parentSessionID: "ses_abc",
    })
    expect(result.metadata.id).toBeDefined()
    expect(typeof result.metadata.id).toBe("string")
    expect(result.metadata.commandStart).toBeDefined()
    expect(result.metadata.commandEnd).toBeDefined()
    expect(typeof result.metadata.commandDuration).toBe("number")
  })

  it("should return invalid command error envelope when input fails Zod validation", async () => {
    const client = {} as any
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "@invalid-cmd", arguments: "hello" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
      } as any,
    )

    expect(result).toHaveProperty("output")
    expect(result).toHaveProperty("metadata")
    expect(result).toHaveProperty("error", true)
    expect(result.metadata).toMatchObject({
      error: true,
      errorType: "missing_arg",
      field: "command",
      command: "@invalid-cmd",
    })
    expect(result.metadata.cause).toBeDefined()
  })

  it("should return agent_not_found error envelope when requested agent is not found in app registry", async () => {
    const agentsMock = vi.fn().mockResolvedValue({ data: ["known-agent"] })
    const client = {
      app: { agents: agentsMock },
    } as any
    const projectRoot = await createProjectWithCommand(
      "agent-test-cmd",
      `---
description: "Agent test command"
agent: unknown-agent
subtask: true
---
Body
`,
    )
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "agent-test-cmd" },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
      } as any,
    )

    expect(result).toHaveProperty("error", true)
    expect(result.metadata).toMatchObject({
      error: true,
      errorType: "not_found",
      agent: "unknown-agent",
      command: "agent-test-cmd",
    })
  })

  it("should return CommandNotFoundError when command file is not found for subtask dispatch", async () => {
    const client = {} as any
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "non-existent-cmd", agent: "hm-l2-agent", subtask: true },
      {
        sessionID: "ses_abc",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: "/tmp",
        worktree: "/tmp",
      } as any,
    )

    expect(result).toHaveProperty("error", true)
    expect(result.metadata).toMatchObject({
      error: true,
      errorType: "not_found",
      command: "non-existent-cmd",
    })
  })

  it("should return DelegationContextError when parentSessionID is missing or invalid in subtask mode", async () => {
    const projectRoot = await createProjectWithCommand(
      "subtask-no-context",
      `---
description: "Subtask no context"
agent: hm-l1-coordinator
subtask: true
---
Body
`,
    )
    const client = {} as any
    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "subtask-no-context", parentSessionID: "INVALID_SESSION" },
      {
        sessionID: "INVALID_SESSION",
        agent: "hm-operator",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
      } as any,
    )

    expect(result).toHaveProperty("error", true)
    expect(result.metadata).toMatchObject({
      error: true,
      errorType: "dispatch_failed",
      parentSessionID: "INVALID_SESSION",
      command: "subtask-no-context",
    })
  })

  it("should substitute $PHASE_ID, $PADDED_PHASE, and $PHASE_NAME variables", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]
    const projectRoot = await createProjectWithCommand(
      "variable-test-command",
      `---
description: "Variable substitution test"
agent: hm-l1-coordinator
subtask: true
---
Phase: $PHASE_ID
Padded: $PADDED_PHASE
Name: $PHASE_NAME
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "variable-test-command", arguments: "6.2-my-awesome-phase" },
      {
        sessionID: "ses_vars",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_vars",
      } as any,
    )
    await flushDeferred()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        agent: "hm-l1-coordinator",
        parts: [
          expect.objectContaining({
            prompt: expect.stringContaining("Phase: 6.2\nPadded: 06.2\nName: my awesome phase"),
          }),
        ],
      },
    }))
  })

  it("should dynamically resolve @ references relative to the project root", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]
    
    // Create a command that references a file relative to the project root
    const projectRoot = await createProjectWithCommand(
      "ref-test-command",
      `---
description: "Reference resolution test"
agent: hm-l1-coordinator
subtask: true
---
Before ref
@relative/referenced-file.md
After ref
`,
    )
    
    // Create the referenced file
    const refContent = "This is the content of the referenced file."
    await mkdir(path.join(projectRoot, "relative"), { recursive: true })
    await writeFile(path.join(projectRoot, "relative", "referenced-file.md"), refContent, "utf-8")

    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "ref-test-command", arguments: "" },
      {
        sessionID: "ses_ref",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_ref",
      } as any,
    )
    await flushDeferred()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        agent: "hm-l1-coordinator",
        parts: [
          expect.objectContaining({
            prompt: expect.stringContaining(
              "Before ref\n<reference path=\"relative/referenced-file.md\">\nThis is the content of the referenced file.\n</reference>\nAfter ref"
            ),
          }),
        ],
      },
    }))
  })

  it("should handle missing @ references by showing comment warning", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const client = {
      session: { prompt: promptMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]
    
    const projectRoot = await createProjectWithCommand(
      "missing-ref-command",
      `---
description: "Missing reference test"
agent: hm-l1-coordinator
subtask: true
---
@missing-file.md
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    await tool.execute(
      { command: "missing-ref-command", arguments: "" },
      {
        sessionID: "ses_missing_ref",
        agent: "hm-build",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_missing_ref",
      } as any,
    )
    await flushDeferred()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        agent: "hm-l1-coordinator",
        parts: [
          expect.objectContaining({
            prompt: expect.stringContaining("<!-- Reference path not found: missing-file.md -->"),
          }),
        ],
      },
    }))
  })

  it("should dynamically override misaligned agent to prefix-aligned agent at runtime", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const agentsMock = vi.fn().mockResolvedValue([
      { name: "gsd-executor", description: "Executes plans atomically" },
      { name: "hm-orchestrator", description: "Orchestration agent" },
      { name: "build", description: "Universal build agent" },
    ])
    const client = {
      session: { prompt: promptMock },
      app: { agents: agentsMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]

    const projectRoot = await createProjectWithCommand(
      "gsd-misaligned-cmd",
      `---
description: "Misaligned agent test command"
agent: hm-orchestrator
subtask: true
---
Verify prefix override.
`,
    )

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "gsd-misaligned-cmd" },
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
    await flushDeferred()

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        agent: "gsd-executor", // Should be aligned dynamically!
      }),
    }))
    expect(result.metadata).toMatchObject({
      agent: "gsd-executor",
    })
  })

  it("should prevent subtask delegation and force subtask:false when running inside a child session", async () => {
    const promptMock = vi.fn(async () => ({ info: { role: "assistant", content: [] }, parts: [] }))
    const commandMock = vi.fn(async () => undefined)
    const client = {
      session: { prompt: promptMock, command: commandMock },
      tui: {
        clearPrompt: vi.fn(),
        appendPrompt: vi.fn(),
        submitPrompt: vi.fn(),
      },
    } as unknown as PluginInput["client"]

    const projectRoot = await createProjectWithCommand(
      "subtask-in-child-cmd",
      `---
description: "Subtask command running inside child session"
agent: gsd-executor
subtask: true
---
Body content.
`,
    )

    // Write a mock session file so resolveSessionFile identifies it as a child session
    const parentSessionTrackerDir = path.join(projectRoot, ".hivemind", "session-tracker", "ses_parent")
    await mkdir(parentSessionTrackerDir, { recursive: true })
    const sessionFile = path.join(parentSessionTrackerDir, "ses_child.json")
    await writeFile(sessionFile, JSON.stringify({ sessionID: "ses_child", type: "child" }), "utf-8")

    const tool = createExecuteSlashCommandTool(client)
    const result = await tool.execute(
      { command: "subtask-in-child-cmd", subtask: true }, // Explicitly requested subtask:true
      {
        sessionID: "ses_child",
        agent: "gsd-executor",
        metadata: vi.fn(),
        directory: projectRoot,
        worktree: projectRoot,
        abort: new AbortController().signal,
        ask: vi.fn(),
        messageID: "msg_child",
      } as any,
    )
    await flushDeferred()

    expect(result.metadata).toMatchObject({
      mode: "session-prompt", // Dispatched directly as session-prompt to child session
      dispatched: true,
    })

    expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
      path: { id: "ses_child" },
      body: {
        parts: [{ type: "text", text: "/subtask-in-child-cmd" }],
      }
    }))
  })
})


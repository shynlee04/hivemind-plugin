import { afterEach, describe, expect, it, vi } from "vitest"

import { deleteSessionContinuity, getSessionContinuity } from "../../src/lib/continuity.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import { createInMemoryClient } from "./helpers/in-memory-client.js"

function route() {
  return {
    category: "implementation" as const,
    effectiveAgent: "builder" as const,
    presetKey: "builder" as const,
    effectiveModel: "gpt-5.4",
    temperature: 0,
    fallbackUsed: false,
    rationale: "builtin-process route",
    modelSource: "explicit" as const,
    agentSource: "explicit" as const,
    temperatureSource: "agent" as const,
    warnings: [],
  }
}

function execution(runInBackground: boolean) {
  return {
    family: "built-in" as const,
    submode: "builtin-process" as const,
    rationale: "process-runner coverage",
    characteristics: { isParallel: false, isInteractive: false, isResearch: false, isHeadless: true, runInBackground },
    capabilityEvidence: { hasTmux: false, projectRoot: process.cwd() },
  }
}

function installCreateIds(client: ReturnType<typeof createInMemoryClient>, ids: string[]) {
  client.session.create.mockImplementation(async ({ body }: { body: Record<string, unknown> }) => {
    const id = ids.shift() ?? `process-${Date.now()}`
    const session = { id, status: { type: "idle" }, ...body }
    client._sessions.set(id, session)
    return { data: session }
  })
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

async function waitTurn() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe("builtin-process lifecycle (session-based, not child-process)", () => {
  afterEach(() => {
    vi.useRealTimers()
    for (const id of [
      "process-parent-sync",
      "process-root-sync",
      "process-child-sync",
      "process-parent-abort",
      "process-root-abort",
      "process-child-abort",
      "process-parent-fail",
      "process-root-fail",
      "process-child-fail",
      "process-parent-async",
      "process-root-async",
      "process-child-async",
      "process-parent-timeout",
      "process-root-timeout",
      "process-child-timeout",
    ]) deleteSessionContinuity(id)
  })

  /* WHY: The process runner now uses sendPrompt() (not child-process spawning) for sync mode.
   * WHAT: A builtin-process sync launch sends the prompt to the LLM and returns the assistant output.
   * HOW: Launch with runInBackground=false, verify sendPrompt was called with correct body. */
  it("sync mode calls sendPrompt with correct body", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-sync"])
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 60_000 })

    client.session.prompt.mockResolvedValue({
      data: {
        parts: [{ type: "text", text: "assistant response text" }],
      },
    })

    const result = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-sync",
      rootID: "process-root-sync",
      childDepth: 1,
      description: "process sync lifecycle",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "test prompt text",
      execution: execution(false),
    })

    // Verify sendPrompt was called with the correct body
    expect(client.session.prompt).toHaveBeenCalled()
    const promptCall = client.session.prompt.mock.calls[0][0]
    expect(promptCall.body.parts).toEqual([{ type: "text", text: "test prompt text" }])
    expect(promptCall.body.agent).toBe("builder")

    // Result should contain the assistant output
    expect(result).toContain("assistant response text")

    // Lifecycle should be completed
    expect(getSessionContinuity("process-child-sync")?.metadata.lifecycle?.phase).toBe("completed")
  })

  /* WHY: Aborting owned-process work must stop waiting callers and preserve a failed lifecycle state.
   * WHAT: Cancelling an async builtin-process child records cancellation failure.
   * HOW: Launch async work, cancel it, then assert abort + failed lifecycle state. */
  it("process runner handles session abort gracefully", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-abort"])
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 60_000 })

    client.session.promptAsync.mockResolvedValue(undefined)

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-abort",
      rootID: "process-root-abort",
      childDepth: 1,
      description: "process abort lifecycle",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "abort me",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }

    // Cancel the session
    await manager.cancelDelegatedSession(parsed.session_id)

    // Abort should have been called
    expect(client.session.abort).toHaveBeenCalledWith({ path: { id: parsed.session_id } })

    // Lifecycle should show failed state
    expect(getSessionContinuity(parsed.session_id)?.metadata.status).toBe("error")
    expect(getSessionContinuity(parsed.session_id)?.metadata.lifecycle?.phase).toBe("failed")
  })

  /* WHY: The builtin-process failure path must report errors from sendPrompt/sendPromptAsync.
   * WHAT: Process failure rejects the launch and stores the error in lifecycle continuity.
   * HOW: Make sendPrompt throw, then assert the thrown error and failed continuity record. */
  it("process runner reports error on sync failure", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-fail"])
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 60_000 })

    client.session.prompt.mockRejectedValue(new Error("sendPrompt failed"))

    await expect(manager.launchDelegatedSession({
      parentSessionID: "process-parent-fail",
      rootID: "process-root-fail",
      childDepth: 1,
      description: "process failure lifecycle",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "explode",
      execution: execution(false),
    })).rejects.toThrow("sendPrompt failed")

    expect(getSessionContinuity("process-child-fail")?.metadata).toMatchObject({
      status: "error",
      lifecycle: expect.objectContaining({ phase: "failed" }),
    })
  })

  /* WHY: Async mode must call sendPromptAsync and start the background observer.
   * WHAT: Async dispatch returns immediately with session_id, observer polls for completion.
   * HOW: Launch with runInBackground=true, verify promptAsync was called and session is in dispatching state. */
  it("async mode calls sendPromptAsync and returns immediately", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-async"])
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50 })

    client.session.promptAsync.mockResolvedValue(undefined)
    // Status poll returns idle (session still running)
    client.session.status.mockResolvedValue({
      data: {
        "process-child-async": { type: "idle" },
      },
    })
    // Messages poll returns empty (no activity yet)
    client.session.messages.mockResolvedValue([])

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-async",
      rootID: "process-root-async",
      childDepth: 1,
      description: "process async test",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "async task",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }

    // sendPromptAsync should have been called
    expect(client.session.promptAsync).toHaveBeenCalled()
    const promptCall = client.session.promptAsync.mock.calls[0][0]
    expect(promptCall.body.parts).toEqual([{ type: "text", text: "async task" }])

    expect(parsed.session_id).toBe("process-child-async")
    expect(parsed.mode).toBe("async")
  })

  it("async mode respects the lifecycle manager poll timeout instead of hardcoding 120s", async () => {
    vi.useFakeTimers()
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-timeout"])
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50 })

    client.session.promptAsync.mockResolvedValue(undefined)
    client.session.messages.mockResolvedValue({ data: [] })
    client._setGetSessionError(new Error("missing session"))

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-timeout",
      rootID: "process-root-timeout",
      childDepth: 1,
      description: "process async timeout test",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "async timeout task",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }
    await vi.advanceTimersByTimeAsync(20_000)

    expect(getSessionContinuity(parsed.session_id)?.metadata.status).toBe("error")
    expect(getSessionContinuity(parsed.session_id)?.metadata.lastError).toMatch(/deleted|timed out/i)
  })
})

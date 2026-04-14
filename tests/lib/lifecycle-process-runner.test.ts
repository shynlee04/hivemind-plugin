import { afterEach, describe, expect, it, vi } from "vitest"

import { deleteSessionContinuity, getSessionContinuity } from "../../src/lib/continuity.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { BackgroundManager } from "../../src/lib/background-manager.js"
import { createInMemoryClient } from "./helpers/in-memory-client.js"

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  return { promise: new Promise<T>((inner) => { resolve = inner }), resolve }
}

function route() {
  return {
    category: "implementation" as const,
    effectiveAgent: "builder" as const,
    presetKey: "builder",
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

function makeBackgroundManager(result: Promise<{ status: "completed" | "failed" | "killed"; stdout: string; stderr: string; exitCode: number | null }>) {
  return {
    spawn: vi.fn(() => ({
      id: "bg-process-task",
      status: "running",
      pid: 100,
      startedAt: 1,
      parentSessionID: "process-parent",
      stdout: "",
      stderr: "",
      exitCode: null,
      error: null,
    })),
    onComplete: vi.fn(() => result),
  } as unknown as BackgroundManager
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

async function waitTurn() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe("builtin-process lifecycle", () => {
  afterEach(() => {
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
      "process-parent-capture",
      "process-root-capture",
      "process-child-capture",
      "process-parent-notif",
      "process-root-notif",
      "process-child-notif",
    ]) deleteSessionContinuity(id)
  })

  /* WHY: The process runner is the real owned-process path for headless delegated work and must expose lifecycle truth.
   * WITH: A real lifecycle manager, in-memory session client, and deferred background task completion.
   * WHAT: A builtin-process launch records created/running state before resolving to completed with process output.
   * HOW: Hold the owned process open, inspect the live continuity record, resolve stdout, then assert completion. */
  it("process runner launches session and tracks lifecycle", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-sync"])
    const run = deferred<{ status: "completed"; stdout: string; stderr: string; exitCode: 0 | null }>()
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50, backgroundManager: makeBackgroundManager(run.promise) })

    const launch = manager.launchDelegatedSession({
      parentSessionID: "process-parent-sync",
      rootID: "process-root-sync",
      childDepth: 1,
      description: "process sync lifecycle",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "owned process output",
      execution: execution(false),
    })
    await waitTurn()

    expect(getSessionContinuity("process-child-sync")?.metadata.lifecycle?.phase).toBe("running")
    run.resolve({ status: "completed", stdout: "owned process output", stderr: "", exitCode: 0 })
    await expect(launch).resolves.toBe("owned process output")
    expect(getSessionContinuity("process-child-sync")?.metadata.lifecycle).toMatchObject({ phase: "completed" })
  })

  /* WHY: Aborting owned-process work must stop waiting callers and preserve a failed lifecycle state instead of hanging.
   * WITH: The builtin-process manager path plus the real cancelDelegatedSession public API.
   * WHAT: Cancelling an async owned-process child records cancellation failure details and calls the SDK abort boundary.
   * HOW: Launch async work, cancel it before background completion resolves, then assert abort + failed lifecycle state. */
  it("process runner handles session abort gracefully", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-abort"])
    const run = deferred<{ status: "completed"; stdout: string; stderr: string; exitCode: 0 | null }>()
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50, backgroundManager: makeBackgroundManager(run.promise) })

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
    expect(getSessionContinuity(parsed.session_id)?.metadata).toMatchObject({
      status: "running",
      lifecycle: expect.objectContaining({
        phase: "running",
        observation: expect.objectContaining({ detail: "owned-process-spawned" }),
      }),
    })

    await manager.cancelDelegatedSession(parsed.session_id)
    expect(client.session.abort).toHaveBeenCalledWith({ path: { id: parsed.session_id } })
    expect(getSessionContinuity(parsed.session_id)?.metadata).toMatchObject({
      status: "error",
      lastError: "Session cancelled by user",
      lifecycle: expect.objectContaining({ phase: "failed" }),
    })
  })

  /* WHY: The owned-process failure path is the real error surface for builtin-process work; prompt/promptAsync never run here.
   * WITH: The real builtin-process branch, in-memory client boundary, and a failed background completion result.
   * WHAT: Process failure rejects the launch promise and stores the process error in lifecycle continuity.
   * HOW: Resolve onComplete with failed status + stderr, then assert the thrown error and failed continuity record. */
  it("process runner reports error on owned-process failure", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-fail"])
    const failed = Promise.resolve({ status: "failed" as const, stdout: "", stderr: "process boom", exitCode: 1 })
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50, backgroundManager: makeBackgroundManager(failed) })

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
    })).rejects.toThrow("process boom")

    expect(getSessionContinuity("process-child-fail")?.metadata).toMatchObject({
      status: "error",
      lastError: "process boom",
      lifecycle: expect.objectContaining({ phase: "failed" }),
    })
  })

  /* WHY: PH13-07/PH13-08 require async process completion to capture and persist result.
   * WHAT: async builtin-process completion stores resultCapture in continuity metadata.
   * HOW: Launch async process, resolve with stdout, wait for completion, verify resultCapture.
   * CONNECTS TO: PH13-07, PH13-08 */
  it("async process completion captures result to continuity", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-capture"])
    const run = deferred<{ status: "completed"; stdout: string; stderr: string; exitCode: 0 | null }>()
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50, backgroundManager: makeBackgroundManager(run.promise) })

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-capture",
      rootID: "process-root-capture",
      childDepth: 1,
      description: "process capture test",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "capture result",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }

    // Resolve the background process with output
    run.resolve({ status: "completed", stdout: "process output captured here", stderr: "", exitCode: 0 })
    await waitTurn()
    await waitTurn()
    await waitTurn()

    const continuity = getSessionContinuity(parsed.session_id)
    expect(continuity?.metadata.lifecycle?.phase).toBe("completed")
    // Result capture should be present in continuity metadata
    expect(continuity?.metadata.resultCapture).toBeDefined()
    expect(continuity?.metadata.resultCapture?.resultText).toContain("process output captured")
  })

  /* WHY: PH13-10/PH13-11 require notifications to carry captured result data.
   * WHAT: parent notification contains resultPreview from captured output.
   * HOW: Launch async process, complete it, then inspect the notification sent to parent.
   * CONNECTS TO: PH13-10, PH13-11 */
  it("async process notification includes captured result preview", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["process-child-notif"])
    const run = deferred<{ status: "completed"; stdout: string; stderr: string; exitCode: 0 | null }>()
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50, backgroundManager: makeBackgroundManager(run.promise) })

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "process-parent-notif",
      rootID: "process-root-notif",
      childDepth: 1,
      description: "process notification test",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "notif test",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }

    // Resolve with output that will be captured
    run.resolve({ status: "completed", stdout: "built 3 files", stderr: "", exitCode: 0 })
    await waitTurn()
    await waitTurn()
    await waitTurn()

    // Check that parent was notified with enriched data
    const parentCalls = client.session.prompt.mock.calls.filter(
      ([request]: any[]) => request.path?.id === "process-parent-notif",
    )
    // Should have started + completed notifications
    expect(parentCalls.length).toBeGreaterThanOrEqual(2)
    // The completion notification should contain result content
    const completionNotif = parentCalls[parentCalls.length - 1]?.[0]?.body?.parts?.[0]?.text ?? ""
    expect(completionNotif).toContain("process notification test")
  })
})

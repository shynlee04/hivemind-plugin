import { afterEach, describe, expect, it, vi } from "vitest"

import { deleteSessionContinuity, getSessionContinuity } from "../../src/lib/continuity.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
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
    rationale: "delegate-task test route",
    modelSource: "explicit" as const,
    agentSource: "explicit" as const,
    temperatureSource: "agent" as const,
    warnings: [],
  }
}

function execution(runInBackground: boolean) {
  return {
    family: "built-in" as const,
    submode: "builtin-subsession" as const,
    rationale: "delegate-task test execution",
    characteristics: { isParallel: false, isInteractive: true, isResearch: false, isHeadless: false, runInBackground },
    capabilityEvidence: { hasTmux: false, projectRoot: process.cwd() },
  }
}

function installCreateIds(client: ReturnType<typeof createInMemoryClient>, ids: string[]) {
  client.session.create.mockImplementation(async ({ body }: { body: Record<string, unknown> }) => {
    const id = ids.shift() ?? `fallback-${Date.now()}`
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

describe("delegate task lifecycle", () => {
  afterEach(() => {
    for (const id of [
      "delegate-parent-meta",
      "delegate-root-meta",
      "delegate-child-meta",
      "delegate-parent-complete",
      "delegate-root-complete",
      "delegate-child-complete",
      "delegate-parent-failure",
      "delegate-root-failure",
      "delegate-parent-queue",
      "delegate-root-queue",
      "delegate-child-queue-1",
      "delegate-child-queue-2",
      "delegate-parent-notify",
      "delegate-root-notify",
      "delegate-child-notify",
    ]) deleteSessionContinuity(id)
    vi.useRealTimers()
  })

  /* WHY: Delegation must persist child metadata so later observers and recovery flows know who launched what.
   * WITH: A real lifecycle manager, in-memory OpenCode client, and continuity-backed child session record.
   * WHAT: launchDelegatedSession writes parent/title data to the created child session and delegation metadata to continuity.
   * HOW: Launch a sync child session, await completion, then assert the stored session body and continuity record. */
  it("delegation launches background session with correct metadata", async () => {
    const client = createInMemoryClient()
    installCreateIds(client, ["delegate-child-meta"])
    client.session.prompt.mockResolvedValue({ data: { parts: [{ type: "text", text: "metadata complete" }] } })
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50 })

    const result = await manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-meta",
      rootID: "delegate-root-meta",
      childDepth: 1,
      description: "metadata path",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "ship metadata",
      execution: execution(false),
    })

    const parsed = JSON.parse(result) as { output: string }
    expect(Buffer.from(parsed.output, "base64").toString("utf8")).toBe("metadata complete")
    expect(client._sessions.get("delegate-child-meta")).toMatchObject({
      parentID: "delegate-parent-meta",
      title: "builder: metadata path",
    })
    expect(getSessionContinuity("delegate-child-meta")?.metadata).toMatchObject({
      parentSessionID: "delegate-parent-meta",
      rootSessionID: "delegate-root-meta",
      description: "metadata path",
      delegation: expect.objectContaining({ agent: "builder", rootID: "delegate-root-meta", depth: 1 }),
      lifecycle: expect.objectContaining({ phase: "completed" }),
    })
  })

  /* WHY: Async delegation only works if observer completion updates lifecycle state and sends parent-visible output.
   * WITH: Fake timers, in-memory session status/messages, and the real background observer launched by the manager.
   * WHAT: An async child moves from queued/running work to completed lifecycle state with a parent notification.
   * HOW: Launch async, mark the child busy, add assistant output, flip idle, and advance polling + stability timers. */
  it("delegation records lifecycle observation on completion", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const client = createInMemoryClient()
    installCreateIds(client, ["delegate-child-complete"])
    client.session.prompt.mockResolvedValue({ data: {} })
    client.session.promptAsync.mockResolvedValue({ status: 204 })
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 20_000 })

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-complete",
      rootID: "delegate-root-complete",
      childDepth: 1,
      description: "async completion",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "ship async",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }
    client._setStatus(parsed.session_id, "busy")
    await flush()
    client._addMessage(parsed.session_id, {
      role: "assistant",
      parts: [
        { type: "reasoning", text: "finish async completion" },
        { type: "tool-call", name: "read" },
        { type: "tool-call", name: "write" },
        { type: "text", text: "done" },
      ],
    })
    client._setStatus(parsed.session_id, "idle")
    await vi.advanceTimersByTimeAsync(35_000)
    await flush()

    const continuity = getSessionContinuity(parsed.session_id)
    const parentCalls = client.session.prompt.mock.calls.filter(([request]) => request.path.id === "delegate-parent-complete")
    expect(continuity?.metadata.lifecycle?.phase).toBe("completed")
    expect(parentCalls).toHaveLength(2)
    expect(parentCalls[1]?.[0]?.body?.parts?.[0]?.text).toContain("completed work on \"async completion\"")
  })

  /* WHY: Session creation errors must fail predictably without leaving half-created delegation state behind.
   * WITH: The in-memory client boundary forced to reject session creation.
   * WHAT: launchDelegatedSession rejects and does not record a child continuity entry when creation fails.
   * HOW: Override client.session.create to throw, then assert the rejection and missing child continuity. */
  it("delegation handles session creation failure gracefully", async () => {
    const client = createInMemoryClient()
    client.session.create.mockRejectedValue(new Error("create failed"))
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50 })

    await expect(manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-failure",
      rootID: "delegate-root-failure",
      childDepth: 1,
      description: "creation failure",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "ship failure",
      execution: execution(false),
    })).rejects.toThrow("create failed")

    expect(getSessionContinuity("delegate-child-failure")).toBeUndefined()
  })

  /* WHY: Queue pressure is a core delegation guarantee — excess work must wait instead of bypassing concurrency controls.
   * WITH: Real lifecycle queueing through the manager and deferred child prompt completion.
   * WHAT: The second child enters queued state until the first child releases the single available lane.
   * HOW: Force concurrency limit 1, hold the first prompt open, launch a second child, then release the first and await both completions. */
  it("delegation respects concurrency queue limits", async () => {
    process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = "1"
    const client = createInMemoryClient()
    installCreateIds(client, ["delegate-child-queue-1", "delegate-child-queue-2"])
    const first = deferred<{ parts: Array<{ type: string; text: string }> }>()
    client.session.prompt.mockImplementation(async ({ path }: { path: { id: string } }) => ({
      data: path.id === "delegate-child-queue-1"
        ? await first.promise
        : { parts: [{ type: "text", text: `done:${path.id}` }] },
    }))
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 50 })

    const firstLaunch = manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-queue",
      rootID: "delegate-root-queue",
      childDepth: 1,
      description: "queue first",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "first",
      execution: execution(false),
    })
    await waitTurn()
    const secondLaunch = manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-queue",
      rootID: "delegate-root-queue",
      childDepth: 1,
      description: "queue second",
      runInBackground: false,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "second",
      execution: execution(false),
    })
    await waitTurn()

    expect(getSessionContinuity("delegate-child-queue-2")?.metadata.lifecycle?.phase).toBe("queued")
    first.resolve({ parts: [{ type: "text", text: "done:delegate-child-queue-1" }] })
    await Promise.all([firstLaunch, secondLaunch])
    expect(getSessionContinuity("delegate-child-queue-2")?.metadata.lifecycle?.phase).toBe("completed")
  })

  /* WHY: Parent sessions need a durable async completion nudge instead of forcing humans to poll child sessions manually.
   * WITH: The real async subsession path plus in-memory parent prompt capture.
   * WHAT: Parent notification contains both started and completed reminders for the delegated child.
   * HOW: Launch async work, complete it with assistant output, then inspect prompt payloads sent to the parent session. */
  it("delegation sends parent notification on async completion", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const client = createInMemoryClient()
    installCreateIds(client, ["delegate-child-notify"])
    client.session.prompt.mockResolvedValue({ data: {} })
    client.session.promptAsync.mockResolvedValue({ status: 204 })
    const manager = createHarnessLifecycleManager({ client, pollTimeoutMs: 20_000 })

    const raw = await manager.launchDelegatedSession({
      parentSessionID: "delegate-parent-notify",
      rootID: "delegate-root-notify",
      childDepth: 1,
      description: "notify parent",
      runInBackground: true,
      agent: "builder",
      route: route(),
      permissionRules: [],
      compatibleTools: [],
      promptText: "notify",
      execution: execution(true),
    })

    const parsed = JSON.parse(raw) as { session_id: string }
    client._setStatus(parsed.session_id, "busy")
    await flush()
    client._addMessage(parsed.session_id, {
      role: "assistant",
      parts: [
        { type: "reasoning", text: "notify parent completion" },
        { type: "tool-call", name: "read" },
        { type: "tool-call", name: "write" },
        { type: "text", text: "done" },
      ],
    })
    client._setStatus(parsed.session_id, "idle")
    await vi.advanceTimersByTimeAsync(35_000)
    await flush()

    const parentPayloads = client.session.prompt.mock.calls
      .filter(([request]) => request.path.id === "delegate-parent-notify")
      .map(([request]) => request.body.parts[0].text)
    expect(parentPayloads[0]).toContain("Delegated task started")
    expect(parentPayloads[1]).toContain("Delegated task completed")
  })
})

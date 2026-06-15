import type { createOpencodeClient } from "@opencode-ai/sdk"
import { createOpencodeClient as createV2Client, type OpencodeClient as OpencodeClientV2 } from "@opencode-ai/sdk/v2"

import { asString, getNestedValue, unwrapData } from "./helpers.js"
import { generateSessionTitle, parseSessionTitle } from "./session-naming.js"

export type OpenCodeClient = ReturnType<typeof createOpencodeClient>

// ---------------------------------------------------------------------------
// Health Probe (D-37/D-38/REQ-02) — distinguishes real OpenCode server from
// Hivemind sidecar to prevent V2 SDK from hitting the wrong endpoint.
// ---------------------------------------------------------------------------

const HEALTH_PROBE_TIMEOUT_MS = 2000
const PROBE_ENDPOINT = "/global/health"

/**
 * Probe result discriminator.
 * - "opencode-server": real OpenCode server (V2 client can be used)
 * - "sidecar": Hivemind sidecar (force V1)
 * - "unreachable": connection refused / timeout / unknown (force V1)
 */
export type HealthProbeResult = "opencode-server" | "sidecar" | "unreachable"

/**
 * Type guard for OpenCode server health response (D-38).
 * Discriminates OpenCode server shape from Hivemind sidecar shape.
 *
 * OpenCode: { healthy: true, version: string }
 * Sidecar:   { status: "ok", uptime: number }
 * Unknown:   treated as sidecar (fail-secure per D-38)
 */
export function isOpenCodeHealthResponse(
  obj: unknown,
): obj is { healthy: true; version: string } {
  if (obj === null || typeof obj !== "object") return false
  const record = obj as Record<string, unknown>
  if (record["healthy"] !== true) return false
  if (typeof record["version"] !== "string") return false
  return true
}

/**
 * Probe the baseUrl to determine if it points to a real OpenCode server
 * or a Hivemind sidecar (D-37). Returns discriminator used by
 * SessionClientAdapter.create() to decide whether to construct V2 client.
 *
 * @param baseUrl - The URL to probe (e.g., http://localhost:4096 or http://localhost:4106)
 * @returns "opencode-server" if response matches OpenCode health shape,
 *          "sidecar" if response matches sidecar shape OR unknown shape (fail-secure),
 *          "unreachable" if fetch throws or times out.
 */
export async function probeHealth(baseUrl: string): Promise<HealthProbeResult> {
  try {
    const response = await globalThis.fetch(`${baseUrl}${PROBE_ENDPOINT}`, {
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
    })
    if (!response.ok) return "sidecar" // 4xx/5xx → fail-secure
    const body: unknown = await response.json()
    if (isOpenCodeHealthResponse(body)) return "opencode-server"
    return "sidecar" // unknown shape → fail-secure (D-38)
  } catch (err) {
    // fetch throws on connection refused, timeout, or abort
    void err
    return "unreachable"
  }
}

// ---------------------------------------------------------------------------
// SessionClientAdapter — wraps v2 OpencodeClient with v1-compatible signatures
// ---------------------------------------------------------------------------

/**
 * Adapter that wraps an `@opencode-ai/sdk/v2` `OpencodeClient` and exposes
 * session API methods with v1-compatible return shapes. Consumers remain
 * unaware of whether the v1 or v2 client is used internally.
 *
 * When the v2 client is absent (creation failed or older SDK), each method
 * falls back to the provided v1 client with the original nested-param calls.
 */
export class SessionClientAdapter {
  constructor(
    private readonly v1: OpenCodeClient,
    private readonly v2: OpencodeClientV2 | null,
  ) {}

  /** Factory: try v2, fall back to null (v1-only mode).
   *
   * The v2 client requires a `baseUrl` to make HTTP requests. Without one,
   * URL construction produces relative paths that fail with `new Request()`.
   * We only create the v2 client when a `baseUrl` is explicitly provided.
   */
  /**
   * Mode-aware factory with health probe (per D-37/D-38/REQ-02 + GA-01-C).
   *
   * - mode = "v2" + no baseUrl → THROWS `[Hivemind] SDK mode "v2" requires a reachable baseUrl`
   * - mode = "v2" + baseUrl + probeResult="sidecar"|"unreachable" → THROWS
   * - mode = "v1" → force v1-only (v2 client bypassed, NO probe issued)
   * - mode = "auto" (default) + no baseUrl → v1-only
   * - mode = "auto" + baseUrl + probeResult="opencode-server" → construct v2
   * - mode = "auto" + baseUrl + probeResult="sidecar"|"unreachable" → v2=null (v1-only)
   * - probeResult undefined → backward compat: construct v2 unconditionally when baseUrl set
   */
  static create(
    v1: OpenCodeClient,
    config?: {
      baseUrl?: string
      mode?: "v1" | "v2" | "auto"
      directory?: string
      probeResult?: HealthProbeResult
      [key: string]: unknown
    },
  ): SessionClientAdapter {
    const mode = config?.mode ?? "auto"
    const baseUrl = config?.baseUrl
    const probeResult = config?.probeResult

    // Fail-secure per Option C
    if (mode === "v2" && !baseUrl) {
      throw new Error('[Hivemind] SDK mode "v2" requires a reachable baseUrl; got none')
    }

    let v2: OpencodeClientV2 | null = null

    if (baseUrl && mode !== "v1") {
      if (probeResult === "opencode-server") {
        // Probe confirms real OpenCode server — construct v2
        try {
          v2 = createV2Client({
            baseUrl,
            ...(config?.directory ? { directory: config.directory } : {}),
          } as Parameters<typeof createV2Client>[0])
          console.info(`[Hivemind] Health probe detected OpenCode server at ${baseUrl} — using mode=v2`)
        } catch (err) {
          if (mode === "v2") {
            throw new Error(
              `[Hivemind] SDK mode "v2" init failed: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
          console.warn("[Hivemind] Failed to create v2 OpenCode client — falling back to v1-only session API.")
        }
      } else if (probeResult === "sidecar") {
        // Probe detected Hivemind sidecar — force v1 to avoid V2 hitting sidecar
        console.info(`[Hivemind] Health probe detected sidecar at ${baseUrl} — forcing mode=v1`)
        v2 = null
      } else if (probeResult === "unreachable") {
        // Probe failed (ECONNREFUSED or timeout) — force v1 (or throw if mode=v2)
        if (mode === "v2") {
          throw new Error(
            '[Hivemind] SDK mode "v2" requires a reachable baseUrl; probe failed (unreachable)',
          )
        }
        console.info(`[Hivemind] Health probe detected unreachable at ${baseUrl} — forcing mode=v1`)
        v2 = null
      } else {
        // probeResult undefined → backward compat: construct v2 unconditionally
        try {
          v2 = createV2Client({
            baseUrl,
            ...(config?.directory ? { directory: config.directory } : {}),
          } as Parameters<typeof createV2Client>[0])
        } catch (err) {
          if (mode === "v2") {
            throw new Error(
              `[Hivemind] SDK mode "v2" init failed: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
          console.warn("[Hivemind] Failed to create v2 OpenCode client — falling back to v1-only session API.")
        }
      }
    }

    // v1 forced: bypass v2 even if constructed
    if (mode === "v1") v2 = null

    console.info(`[Hivemind] SDK mode: ${mode}${baseUrl ? ` (baseUrl: ${baseUrl})` : ""}`)
    return new SessionClientAdapter(v1, v2)
  }

  async get(sessionID: string): Promise<Record<string, unknown>> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      return unwrapData(await this.v2.session.get({ sessionID: validID }))
    }
    return unwrapData(await this.v1.session.get({ path: { id: validID } }))
  }

  async create(opts: {
    parentID?: string
    title: string
    directory?: string
  }): Promise<Record<string, unknown>> {
    if (this.v2) {
      return unwrapData(await this.v2.session.create({
        directory: opts.directory,
        parentID: opts.parentID ? assertValidSessionID(opts.parentID, "parent session ID") : undefined,
        title: opts.title,
      }))
    }
    return unwrapData(await this.v1.session.create({
      body: { title: opts.title, ...(opts.parentID ? { parentID: assertValidSessionID(opts.parentID, "parent session ID") } : {}) },
      ...(opts.directory ? { query: { directory: opts.directory } } : {}),
    }))
  }

  async abort(sessionID: string): Promise<unknown> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      return unwrapData(await this.v2.session.abort({ sessionID: validID }))
    }
    return unwrapData(await this.v1.session.abort({ path: { id: validID } }))
  }

  async messages(sessionID: string, opts?: { limit?: number }): Promise<unknown[]> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      const data = unwrapData(await this.v2.session.messages({ sessionID: validID, limit: opts?.limit }))
      return Array.isArray(data) ? data : []
    }
    const request: SessionMessagesRequest = {
      path: { id: validID },
      ...(opts?.limit !== undefined ? { query: { limit: opts.limit } } : {}),
    }
    const data = unwrapData(await this.v1.session.messages(request))
    return Array.isArray(data) ? data : []
  }

  async status(): Promise<Record<string, { type: string }>> {
    if (this.v2) {
      const data = unwrapData(await this.v2.session.status())
      return (data as Record<string, unknown>) as Record<string, { type: string }>
    }
    const data = unwrapData(await this.v1.session.status())
    return (data as Record<string, unknown>) as Record<string, { type: string }>
  }

  async prompt(sessionID: string, body: unknown, noReply?: boolean, directory?: string): Promise<unknown> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      const parts = (body as Record<string, unknown>)?.parts as Array<Record<string, unknown>>
      return unwrapData(await this.v2.session.prompt({
        sessionID: validID,
        noReply,
        ...(directory ? { directory } : {}),
        parts: parts as Parameters<OpencodeClientV2["session"]["prompt"]>[0]["parts"],
      }))
    }
    const request: SessionPromptRequest = {
      path: { id: validID },
      body: {
        ...(body as SessionPromptRequest["body"]),
        ...(noReply !== undefined ? { noReply } : {}),
      } as SessionPromptRequest["body"],
      ...(directory ? { query: { directory } } : {}),
    }
    return unwrapData(await this.v1.session.prompt(request))
  }

  async promptAsync(sessionID: string, body: unknown): Promise<void> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      const parts = (body as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined
      await this.v2.session.promptAsync({
        sessionID: validID,
        noReply: true,
        parts: parts as Parameters<OpencodeClientV2["session"]["promptAsync"]>[0]["parts"],
      })
      return
    }
    await this.v1.session.promptAsync({
      path: { id: validID },
      body: body as Parameters<OpenCodeClient["session"]["promptAsync"]>[0]["body"],
    })
  }

  async children(sessionID: string, directory?: string): Promise<Array<{ id: string; parentID?: string }>> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      const result = await this.v2.session.children({ sessionID: validID, ...(directory ? { directory } : {}) })
      return (unwrapData(result) as Array<{ id: string; parentID?: string }>)
    }
    const result = await (this.v1.session as unknown as {
      children(params: { path: { id: string } }): Promise<{ data?: Array<{ id: string; parentID?: string }> }>
    }).children({ path: { id: validID } })
    return result.data ?? []
  }

  /**
   * Fire-and-forget via v2 `experimental.session.background()` when available.
   * Falls back to `promptAsync` on older SDK versions.
   */
  async background(sessionID: string, opts?: { directory?: string; workspace?: string }): Promise<void> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2?.experimental?.session?.background) {
      await this.v2.experimental.session.background({ sessionID: validID, ...opts })
      return
    }
    // Fallback: v1 promptAsync
    await this.v1.session.promptAsync({
      path: { id: validID },
      body: { noReply: true, parts: [] },
    })
  }

  /**
   * REQ-06 (T-11): Run a slash command on a session.
   * Dual-mode: v2 flat-param OR v1 nested-param.
   * @see runSessionCommand for module-level wrapper.
   */
  async command(sessionID: string, body: Record<string, unknown>): Promise<unknown> {
    const validID = assertValidSessionID(sessionID)
    if (this.v2) {
      // SDK JSDoc: v2.session.command takes flat-param shape { sessionID, ...body }
      return unwrapData(await (this.v2.session as unknown as {
        command(params: { sessionID: string } & Record<string, unknown>): Promise<{ data?: unknown }>
      }).command({ sessionID: validID, ...body }))
    }
    // v1: nested-param shape { path: { id }, body }
    return unwrapData(await (this.v1.session as unknown as {
      command(params: { path: { id: string }; body: Record<string, unknown> }): Promise<{ data?: unknown }>
    }).command({ path: { id: validID }, body }))
  }

  /**
   * REQ-06 (T-11): List sessions.
   * Dual-mode: v2 flat-param OR v1 flat-param.
   * @see listSessions for module-level wrapper.
   */
  async list(opts?: { limit?: number; start?: string }): Promise<unknown> {
    if (this.v2) {
      return unwrapData(await (this.v2.session as unknown as {
        list(params?: { limit?: number; start?: string }): Promise<{ data?: unknown }>
      }).list(opts ?? {}))
    }
    return unwrapData(await (this.v1.session as unknown as {
      list(params?: { limit?: number; start?: string }): Promise<{ data?: unknown }>
    }).list(opts ?? {}))
  }
}

type SessionRecord = Record<string, unknown>
type SessionCreateRequest = Parameters<OpenCodeClient["session"]["create"]>[0]
type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]
type SessionMessagesRequest = Parameters<OpenCodeClient["session"]["messages"]>[0]
type TuiAppendPromptRequest = Parameters<OpenCodeClient["tui"]["appendPrompt"]>[0]
// Using inline cast for showToast — the SDK Options type is complex
// type TuiShowToastRequest is intentionally unused

type CreateSessionOptions = {
  parentID?: string
  title: string
  directory?: string
}

type GetSessionMessagesOptions = {
  limit?: number
}

const SYNC_PROMPT_FALLBACK_TIMEOUT_MS = 30_000
const SYNC_PROMPT_FALLBACK_POLL_MS = 1_000

/** Module-level adapter for v2 session API — set once at init. */
let _adapter: SessionClientAdapter | null = null

/**
 * Module-level promise for adapter init (per GA-07 / deferred init pattern).
 * `setupDelegationModules()` stays SYNC; `initAdapter()` is async and its
 * promise is exported so callers (e.g., plugin.ts) can await initialization
 * if they need the v2 client ready before a critical section.
 *
 * Read-only access: callers should `await getAdapterInitPromise()` rather
 * than assigning to this binding directly.
 */
let _adapterInitPromise: Promise<void> | null = null

/**
 * Read the deferred init promise set by `initAdapter()`.
 * Returns `null` if init has not been called yet.
 */
export function getAdapterInitPromise(): Promise<void> | null {
  return _adapterInitPromise
}

/**
 * Reset the v2 session adapter to null.
 * Used in tests to clear module-level state between test cases.
 */
export function resetAdapter(): void {
  _adapter = null
  _adapterInitPromise = null
}

/**
 * Initialize the v2 session client adapter with health probe (per D-37/D-38/GA-01-C).
 * Must be called once at plugin init. When v2 creation fails, the adapter operates in v1-only mode.
 *
 * Async: performs `await probeHealth()` before constructing SessionClientAdapter.
 * Callers that cannot await (sync plugin init) should use the deferred init pattern:
 *   adapterInitPromise = initAdapter(v1, config)
 */
export async function initAdapter(
  v1: OpenCodeClient,
  config?: { baseUrl?: string; mode?: "v1" | "v2" | "auto"; directory?: string; [key: string]: unknown },
): Promise<void> {
  const promise = (async () => {
    try {
      const mode = config?.mode ?? "auto"
      const baseUrl = config?.baseUrl

      // Probe health before constructing adapter (D-37/REQ-02)
      let probeResult: HealthProbeResult | undefined
      if (baseUrl && mode !== "v1" && mode !== "v2") {
        // Only probe in "auto" mode — explicit v1 bypasses; explicit v2 throws on probe failure
        probeResult = await probeHealth(baseUrl)
      } else if (baseUrl && mode === "v2") {
        // mode=v2 explicit: probe MUST succeed (throw on failure)
        probeResult = await probeHealth(baseUrl)
        if (probeResult !== "opencode-server") {
          throw new Error(
            `[Hivemind] SDK mode "v2" requires a reachable OpenCode server; probe detected ${probeResult}`,
          )
        }
      }

      _adapter = SessionClientAdapter.create(v1, { ...config, probeResult })
    } catch (err) {
      console.warn(
        `[Hivemind] Failed to init v2 session adapter — falling back to v1-only. ${err instanceof Error ? err.message : String(err)}`,
      )
      _adapter = null
    }
  })()
  _adapterInitPromise = promise
  return promise
}

function assertValidSessionID(sessionID: string, label = "session ID"): string {
  const trimmed = sessionID.trim()
  if (process.env.NODE_ENV === "test" && /^(child|parent)-/.test(trimmed)) {
    return trimmed
  }
  if (!trimmed.startsWith("ses")) {
    throw new Error(
      `[Hivemind] Invalid ${label} '${sessionID}'. Expected an OpenCode session ID starting with 'ses'.`,
    )
  }

  return trimmed
}

export async function createSession(client: OpenCodeClient, opts: CreateSessionOptions): Promise<SessionRecord> {
  const { directory, ...body } = opts

  let finalTitle = body.title
  let parsed = parseSessionTitle(finalTitle)

  if (parsed) {
    if (body.parentID) {
      try {
        const parentSession = await getSession(client, body.parentID)
        const parentTitle = (parentSession.title as string) || ""
        const parsedParent = parseSessionTitle(parentTitle)
        const expectedDepth = parsedParent ? parsedParent.depth + 1 : 1
        const expectedClassification = expectedDepth === 1 ? "child" : "grandchild"

        if (parsed.depth !== expectedDepth || parsed.classification !== expectedClassification) {
          finalTitle = generateSessionTitle({
            ...parsed,
            depth: expectedDepth,
            classification: expectedClassification,
          })
        }
      } catch {
        // Fallback: if parent fetch fails, keep the formatted title as is
      }
    } else {
      if (parsed.depth !== 0 || parsed.classification !== "root") {
        finalTitle = generateSessionTitle({
          ...parsed,
          depth: 0,
          classification: "root",
        })
      }
    }
  } else {
    let framework = "hm"
    let workflow = body.parentID ? "delegate" : "spawn"
    let classification: "root" | "child" | "grandchild" | "fork" = body.parentID ? "child" : "root"
    let agent = "agent"
    let depth = 0

    if (body.parentID) {
      try {
        const parentSession = await getSession(client, body.parentID)
        const parentTitle = (parentSession.title as string) || ""
        const parsedParent = parseSessionTitle(parentTitle)
        if (parsedParent) {
          framework = parsedParent.framework
          workflow = parsedParent.workflow
          depth = parsedParent.depth + 1
          classification = depth === 1 ? "child" : "grandchild"
          agent = parsedParent.agent
        } else {
          depth = 1
          classification = "child"
        }
      } catch {
        depth = 1
        classification = "child"
      }
    }

    let purpose = finalTitle || "session"
    const agentMatch = /\b((?:hm|gsd|hf)-[a-z0-9-]+)\b/i.exec(purpose)
    if (agentMatch) {
      agent = agentMatch[1].toLowerCase()
      purpose = purpose
        .replace(agentMatch[0], "")
        .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
        .trim()

      if (agent.startsWith("gsd-")) {
        framework = "gsd"
      } else if (agent.startsWith("hm-") || agent.startsWith("hf-")) {
        framework = "hm"
      }
    }

    const lowerTitle = (finalTitle || "").toLowerCase()
    if (lowerTitle.includes("governance")) {
      workflow = "governance"
    } else if (lowerTitle.includes("planning") || lowerTitle.includes("plan-")) {
      workflow = "planning"
    } else if (lowerTitle.includes("execute") || lowerTitle.includes("exec-")) {
      workflow = "execute"
    } else if (lowerTitle.includes("delegate") || lowerTitle.includes("subagent") || body.parentID) {
      workflow = "delegate"
    }

    const safePurpose = purpose.slice(0, 40).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "session"

    finalTitle = generateSessionTitle({
      framework,
      workflow,
      classification,
      agent,
      purpose: safePurpose,
      depth,
    })
  }

  if (_adapter) {
    return _adapter.create({
      parentID: body.parentID,
      title: finalTitle,
      directory,
    })
  }

  const request: SessionCreateRequest = {
    body: {
      ...body,
      title: finalTitle,
      ...(body.parentID ? { parentID: assertValidSessionID(body.parentID, "parent session ID") } : {}),
    },
    ...(directory ? { query: { directory } } : {}),
  }

  return unwrapData(await client.session.create(request))
}

export async function getSession(client: OpenCodeClient, sessionID: string): Promise<SessionRecord> {
  const validSessionID = assertValidSessionID(sessionID)
  if (_adapter) return _adapter.get(validSessionID)
  return unwrapData(await client.session.get({ path: { id: validSessionID } }))
}

/**
 * Get the status map for all sessions.
 * Returns a map of sessionID -> { type: "idle" | "busy" | "retry" }
 */
export async function getSessionStatusMap(client: OpenCodeClient): Promise<Record<string, { type: string }>> {
  if (_adapter) return _adapter.status()
  const response = await client.session.status()
  const data = unwrapData(response)
  // The response is { data: { [sessionID: string]: SessionStatus } }
  // SessionStatus has shape { type: "idle" | "busy" | "retry" }
  return (data as Record<string, unknown>) as Record<string, { type: string }>
}

export async function abortSession(client: OpenCodeClient, sessionID: string): Promise<unknown> {
  const validSessionID = assertValidSessionID(sessionID)
  if (_adapter) return _adapter.abort(validSessionID)
  return unwrapData(await client.session.abort({ path: { id: validSessionID } }))
}

export async function getSessionMessages(
  client: OpenCodeClient,
  sessionID: string,
  opts?: GetSessionMessagesOptions
): Promise<unknown[]> {
  const validSessionID = assertValidSessionID(sessionID)
  if (_adapter) return _adapter.messages(validSessionID, opts)
  const request: SessionMessagesRequest = {
    path: { id: validSessionID },
    ...(opts?.limit !== undefined ? { query: { limit: opts.limit } } : {}),
  }

  const response = unwrapData(await client.session.messages(request))

  return Array.isArray(response) ? response : []
}

export async function getSessionMessageCount(
  client: OpenCodeClient,
  sessionID: string,
): Promise<number | null> {
  try {
    const messages = await getSessionMessages(client, sessionID)
    return messages.length
  } catch {
    return null
  }
}

function getMessageRole(message: unknown): string | undefined {
  return (
    asString(getNestedValue(message, ["info", "role"])) ??
    asString(getNestedValue(message, ["role"]))
  )
}

function hasUsableAssistantParts(message: unknown): boolean {
  const parts = getNestedValue(message, ["parts"])
  return Array.isArray(parts) && parts.length > 0
}

async function waitForAssistantResponse(
  client: OpenCodeClient,
  sessionID: string,
  baselineMessageCount: number,
): Promise<unknown> {
  const deadline = Date.now() + SYNC_PROMPT_FALLBACK_TIMEOUT_MS

  while (Date.now() < deadline) {
    const messages = await getSessionMessages(client, sessionID)
    const newMessages = messages.slice(baselineMessageCount)
    const assistantMessage = newMessages.find(
      (message) => getMessageRole(message) === "assistant" && hasUsableAssistantParts(message),
    )
    if (assistantMessage) {
      return assistantMessage
    }

    await new Promise((resolve) => setTimeout(resolve, SYNC_PROMPT_FALLBACK_POLL_MS))
  }

  throw new Error(
    `[Hivemind] session.prompt returned an empty response and no assistant output was captured within ${SYNC_PROMPT_FALLBACK_TIMEOUT_MS}ms.`,
  )
}

type SessionPromptAsyncRequest = Parameters<OpenCodeClient["session"]["promptAsync"]>[0]

export async function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown,
  noReply?: boolean,
  directory?: string
): Promise<unknown> {
  const validSessionID = assertValidSessionID(sessionID)
  const baselineMessageCount = (await getSessionMessages(client, validSessionID).catch(() => [] as unknown[])).length

  if (_adapter) {
    const response = await _adapter.prompt(validSessionID, body, noReply, directory)
    if (typeof response !== "string") return response
    const trimmed = (response as string).trim()
    if (!trimmed) {
      return waitForAssistantResponse(client, validSessionID, baselineMessageCount)
    }
    try { return JSON.parse(trimmed) as unknown } catch {
      return { parts: [{ type: "text", text: trimmed }] }
    }
  }

  const request: SessionPromptRequest = {
    path: { id: validSessionID },
    body: {
      ...(body as SessionPromptRequest["body"]),
      ...(noReply !== undefined ? { noReply } : {}),
    } as SessionPromptRequest["body"],
    ...(directory ? { query: { directory } } : {}),
  }

  const response = unwrapData(await client.session.prompt(request))
  if (typeof response !== "string") {
    return response
  }

  const trimmed = response.trim()
  if (!trimmed) {
    return waitForAssistantResponse(client, validSessionID, baselineMessageCount)
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return {
      parts: [{ type: "text", text: trimmed }],
    }
  }
}

/**
 * Prompt a session asynchronously — returns 204 immediately.
 *
 * Use this for background/background delegation tasks where the caller
 * should not wait for the assistant's response. Harness must only use this
 * path when a trusted runtime policy explicitly says the host is durable.
 */
export async function sendPromptAsync(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown
): Promise<void> {
  const validSessionID = assertValidSessionID(sessionID)
  if (_adapter) {
    await _adapter.promptAsync(validSessionID, body)
    return
  }
  const request: SessionPromptAsyncRequest = {
    path: { id: validSessionID },
    body: body as SessionPromptAsyncRequest["body"],
  }

  await client.session.promptAsync(request)
}

/**
 * Fire-and-forget via v2 `experimental.session.background()` when available.
 * Falls back to `sendPromptAsync` on older SDK versions.
 *
 * REQ-12: Feature-detect before using. The v2 background() API detaches
 * synchronous subagents and continues them in the background.
 */
export async function sendBackground(
  client: OpenCodeClient,
  sessionID: string,
  opts?: { directory?: string; workspace?: string },
): Promise<void> {
  const validSessionID = assertValidSessionID(sessionID)
  if (_adapter) {
    await _adapter.background(validSessionID, opts)
    return
  }
  // Fallback: v1 promptAsync
  await client.session.promptAsync({
    path: { id: validSessionID },
    body: { noReply: true, parts: [] },
  })
}

/**
 * REQ-06: Run a slash command on a session.
 * Module-level wrapper for `SessionClientAdapter.command()`.
 * Routes through the adapter facade so v2/v1 SDK shape differences
 * stay encapsulated — callers MUST NOT call `client.session.command` directly.
 *
 * @see REQ-06 in `.planning/phases/AUDIT-04.02.2-v2-full-migration-end2end/AUDIT-04.02.2-SPEC.md`
 */
export async function runSessionCommand(
  client: OpenCodeClient,
  sessionID: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  if (_adapter) {
    return _adapter.command(sessionID, body)
  }
  // Fallback when no adapter is initialized — use v1 nested-param shape.
  return unwrapData(await (client.session as unknown as {
    command(params: { path: { id: string }; body: Record<string, unknown> }): Promise<{ data?: unknown }>
  }).command({ path: { id: assertValidSessionID(sessionID) }, body }))
}

/**
 * REQ-06: List sessions.
 * Module-level wrapper for `SessionClientAdapter.list()`.
 *
 * @see REQ-06 in `.planning/phases/AUDIT-04.02.2-v2-full-migration-end2end/AUDIT-04.02.2-SPEC.md`
 */
export async function listSessions(
  client: OpenCodeClient,
  opts?: { limit?: number; start?: string },
): Promise<unknown> {
  if (_adapter) {
    return _adapter.list(opts)
  }
  // Fallback when no adapter is initialized.
  return unwrapData(await (client.session as unknown as {
    list(params?: { limit?: number; start?: string }): Promise<{ data?: unknown }>
  }).list(opts ?? {}))
}

/**
 * Append a bounded parent-facing notification line to the active OpenCode TUI prompt.
 *
 * @param client - OpenCode SDK client with the `tui.appendPrompt` surface.
 * @param text - Text to append to the foreground prompt input.
 * @returns The unwrapped SDK response when append succeeds.
 */
export async function appendTuiPrompt(client: OpenCodeClient, text: string): Promise<unknown> {
  const request: TuiAppendPromptRequest = { body: { text } } as TuiAppendPromptRequest
  return unwrapData(await client.tui.appendPrompt(request))
}

/**
 * Show a compact delegation toast in the OpenCode TUI when the host exposes it.
 *
 * Step 1 (notification redesign): replaces `appendTuiPrompt` for user-visible notifications.
 * Toast is transient — user sees it, agent's context does NOT receive it.
 *
 * SDK v1 API: `client.tui.showToast({ body: { message, variant, duration?, title? } })`
 *
 * @param client - OpenCode SDK client with the `tui.showToast` surface.
 * @param message - Toast message to display.
 * @param variant - Optional visual style: "info" | "success" | "error" | "warning".
 * @returns The unwrapped SDK response when the toast succeeds.
 */
/**
 * Check if a message carries the `[Hivemind]` prefix that flags it as
 * an internal runtime error that should be suppressed from TUI toasts.
 *
 * When `true`, the caller should route the message to `console.warn`
 * instead of `client.tui.showToast()`.
 */
export function isHivemindError(message: string): boolean {
  return message.startsWith("[Hivemind]")
}

export async function showTuiToast(
  client: OpenCodeClient,
  message: string,
  variant?: "info" | "success" | "error" | "warning",
): Promise<unknown> {
  // REQ-34C: [Hivemind]-prefixed errors route to console.warn instead of TUI toast.
  // This prevents internal runtime errors from cluttering the user's TUI.
  if (isHivemindError(message)) {
    console.warn(`[showToast suppressed] ${message}`)
    return undefined
  }

  return unwrapData(await client.tui.showToast({
    body: { message, ...(variant ? { variant } : {}) },
  } as Parameters<typeof client.tui.showToast>[0]))
}

export function getSessionID(session: unknown): string | undefined {
  return (
    asString(getNestedValue(session, ["id"])) ??
    asString(getNestedValue(session, ["sessionID"])) ??
    asString(getNestedValue(session, ["info", "id"])) ??
    asString(getNestedValue(session, ["info", "sessionID"]))
  )
}

export function getParentID(session: unknown): string | undefined {
  return (
    asString(getNestedValue(session, ["parentID"])) ??
    asString(getNestedValue(session, ["parentId"])) ??
    asString(getNestedValue(session, ["info", "parentID"])) ??
    asString(getNestedValue(session, ["info", "parentId"]))
  )
}

function getEventSessionInfo(event: unknown): unknown {
  return getNestedValue(event, ["properties", "info"])
}

function getEventType(event: unknown): string | undefined {
  return asString(getNestedValue(event, ["type"]))
}

function isMessageScopedEvent(event: unknown): boolean {
  return getEventType(event)?.startsWith("message.") ?? false
}

function getExplicitEventSessionID(event: unknown): string | undefined {
  return (
    asString(getNestedValue(event, ["properties", "sessionID"])) ??
    asString(getNestedValue(event, ["properties", "sessionId"])) ??
    asString(getNestedValue(event, ["properties", "part", "sessionID"])) ??
    asString(getNestedValue(event, ["properties", "part", "sessionId"])) ??
    asString(getNestedValue(event, ["properties", "info", "sessionID"])) ??
    asString(getNestedValue(event, ["properties", "info", "sessionId"])) ??
    asString(getNestedValue(event, ["sessionID"])) ??
    asString(getNestedValue(event, ["sessionId"]))
  )
}

export function getEventSessionID(event: unknown): string | undefined {
  const explicitSessionID = getExplicitEventSessionID(event)
  if (isMessageScopedEvent(event)) {
    return explicitSessionID
  }

  return (
    getSessionID(getEventSessionInfo(event)) ??
    explicitSessionID
  )
}

export function getEventParentID(event: unknown): string | undefined {
  return getParentID(getEventSessionInfo(event))
}

/**
 * Child session data returned by getChildSessions().
 */
export interface ChildSessionInfo {
  sessionID: string
  status: string
  agent?: string
  lastMessage?: string
  lastActivity?: string
}

/**
 * Queries the OpenCode SDK for child sessions of a given parent session.
 *
 * Feature-detects `client.session.children()` before calling (graceful no-op
 * on older SDK versions). For each child, fetches session metadata via
 * `getSession()` and the last message via `getSessionMessages()`.
 *
 * @param client - OpenCode SDK client
 * @param parentSessionID - The parent session whose children to query
 * @returns Array of child session info objects, or empty array on failure
 */
export async function getChildSessions(
  client: OpenCodeClient,
  parentSessionID: string,
): Promise<ChildSessionInfo[]> {
  try {
    const entries = _adapter
      ? await _adapter.children(parentSessionID)
      : (await (client.session as unknown as {
          children(params: { path: { id: string } }): Promise<{
            data?: Array<{ id: string; parentID?: string }>
          }>
        }).children({ path: { id: parentSessionID } })).data ?? []

    const children: ChildSessionInfo[] = []
    for (const entry of entries) {
      if (!entry.id) continue

      try {
        const sessionData = await getSession(client, entry.id)
        const status = asString(getNestedValue(sessionData, ["status"])) ?? "unknown"
        const agent = asString(getNestedValue(sessionData, ["agent"])) ?? asString(getNestedValue(sessionData, ["info", "agent"]))

        let lastMessage: string | undefined
        let lastActivity: string | undefined

        try {
          const messages = await getSessionMessages(client, entry.id, { limit: 1 })
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1]
            // getNestedValue does not traverse arrays, so extract parts directly
            const parts = getNestedValue(lastMsg, ["parts"])
            const text = Array.isArray(parts) && parts.length > 0
              ? asString(getNestedValue(parts[0], ["text"])) ?? asString(getNestedValue(parts[0], ["content"]))
              : undefined
            if (text) {
              lastMessage = text.length > 200 ? text.slice(0, 200) + "..." : text
            }
            const ts = asString(getNestedValue(lastMsg, ["timestamp"])) ??
              asString(getNestedValue(lastMsg, ["time", "created"]))
            if (ts) {
              lastActivity = ts
            }
          }
        } catch {
          // Best-effort: message fetch failure doesn't block child data
        }

        children.push({
          sessionID: entry.id,
          status,
          ...(agent ? { agent } : {}),
          ...(lastMessage ? { lastMessage } : {}),
          ...(lastActivity ? { lastActivity } : {}),
        })
      } catch {
        // Best-effort: skip child whose session data can't be fetched
      }
    }

    return children
  } catch {
    return []
  }
}

export async function walkParentChain(client: OpenCodeClient, sessionID: string): Promise<SessionRecord[]> {
  const chain: SessionRecord[] = []
  const visited = new Set<string>()

  let currentID: string | undefined = assertValidSessionID(sessionID)
  while (currentID) {
    if (visited.has(currentID)) {
      throw new Error(`[Hivemind] Detected cyclic session parent chain at ${currentID}`)
    }

    visited.add(currentID)
    const session = await getSession(client, currentID)
    chain.push(session)
    currentID = getParentID(session)
  }

  return chain
}



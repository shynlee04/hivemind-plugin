import type { createOpencodeClient } from "@opencode-ai/sdk"

import { asString, getNestedValue, unwrapData } from "./helpers.js"
import { generateSessionTitle, parseSessionTitle } from "./session-naming.js"

export type OpenCodeClient = ReturnType<typeof createOpencodeClient>

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

function assertValidSessionID(sessionID: string, label = "session ID"): string {
  const trimmed = sessionID.trim()
  if (process.env.NODE_ENV === "test" && /^(child|parent)-/.test(trimmed)) {
    return trimmed
  }
  if (!trimmed.startsWith("ses")) {
    throw new Error(
      `[Harness] Invalid ${label} '${sessionID}'. Expected an OpenCode session ID starting with 'ses'.`,
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
  return unwrapData(await client.session.get({ path: { id: validSessionID } }))
}

/**
 * Get the status map for all sessions.
 * Returns a map of sessionID -> { type: "idle" | "busy" | "retry" }
 */
export async function getSessionStatusMap(client: OpenCodeClient): Promise<Record<string, { type: string }>> {
  const response = await client.session.status()
  const data = unwrapData(response)
  // The response is { data: { [sessionID: string]: SessionStatus } }
  // SessionStatus has shape { type: "idle" | "busy" | "retry" }
  return (data as Record<string, unknown>) as Record<string, { type: string }>
}

export async function abortSession(client: OpenCodeClient, sessionID: string): Promise<unknown> {
  const validSessionID = assertValidSessionID(sessionID)
  return unwrapData(await client.session.abort({ path: { id: validSessionID } }))
}

export async function getSessionMessages(
  client: OpenCodeClient,
  sessionID: string,
  opts?: GetSessionMessagesOptions
): Promise<unknown[]> {
  const validSessionID = assertValidSessionID(sessionID)
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
    `[Harness] session.prompt returned an empty response and no assistant output was captured within ${SYNC_PROMPT_FALLBACK_TIMEOUT_MS}ms.`,
  )
}

type SessionPromptAsyncRequest = Parameters<OpenCodeClient["session"]["promptAsync"]>[0]

export async function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown,
  noReply?: boolean
): Promise<unknown> {
  const validSessionID = assertValidSessionID(sessionID)
  const baselineMessageCount = (await getSessionMessages(client, validSessionID).catch(() => [] as unknown[])).length
  const request: SessionPromptRequest = {
    path: { id: validSessionID },
    body: {
      ...(body as SessionPromptRequest["body"]),
      ...(noReply !== undefined ? { noReply } : {}),
    } as SessionPromptRequest["body"],
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
  const request: SessionPromptAsyncRequest = {
    path: { id: validSessionID },
    body: body as SessionPromptAsyncRequest["body"],
  }

  await client.session.promptAsync(request)
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
 * Check if a message carries the `[Harness]` prefix that flags it as
 * an internal runtime error that should be suppressed from TUI toasts.
 *
 * When `true`, the caller should route the message to `console.warn`
 * instead of `client.tui.showToast()`.
 */
export function isHarnessError(message: string): boolean {
  return message.startsWith("[Harness]")
}

export async function showTuiToast(
  client: OpenCodeClient,
  message: string,
  variant?: "info" | "success" | "error" | "warning",
): Promise<unknown> {
  // REQ-34C: [Harness]-prefixed errors route to console.warn instead of TUI toast.
  // This prevents internal runtime errors from cluttering the user's TUI.
  if (isHarnessError(message)) {
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

export async function walkParentChain(client: OpenCodeClient, sessionID: string): Promise<SessionRecord[]> {
  const chain: SessionRecord[] = []
  const visited = new Set<string>()

  let currentID: string | undefined = assertValidSessionID(sessionID)
  while (currentID) {
    if (visited.has(currentID)) {
      throw new Error(`[Harness] Detected cyclic session parent chain at ${currentID}`)
    }

    visited.add(currentID)
    const session = await getSession(client, currentID)
    chain.push(session)
    currentID = getParentID(session)
  }

  return chain
}



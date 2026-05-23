import type { createOpencodeClient } from "@opencode-ai/sdk"

import { asString, getNestedValue, unwrapData } from "./helpers.js"
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"

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
  const request: SessionCreateRequest = {
    body: {
      ...body,
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
export async function showTuiToast(
  client: OpenCodeClient,
  message: string,
  variant?: "info" | "success" | "error" | "warning",
): Promise<unknown> {
  return unwrapData(await client.tui.showToast({
    body: { message, ...(variant ? { variant } : {}) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any))
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

/**
 * Retrieves the resolved behavioral profile for a session.
 * Delegates to resolveBehavioralProfile with lazy caching.
 *
 * @param sessionId - The session ID to resolve profile for
 * @param projectRoot - Absolute path to project root
 * @param sessionContext - Optional session context for runtime profile detection
 * @returns The resolved behavioral profile
 * @see D-10 in CA-02-CONTEXT.md
 */
export function getSessionBehavioralProfile(
  sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  return resolveBehavioralProfile(sessionId, projectRoot, sessionContext)
}

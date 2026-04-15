import type { createOpencodeClient } from "@opencode-ai/sdk"

import { asString, getNestedValue, unwrapData } from "./helpers.js"

export type OpenCodeClient = ReturnType<typeof createOpencodeClient>

type SessionRecord = Record<string, unknown>
type SessionCreateRequest = Parameters<OpenCodeClient["session"]["create"]>[0]
type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]
type SessionMessagesRequest = Parameters<OpenCodeClient["session"]["messages"]>[0]

type CreateSessionOptions = {
  parentID?: string
  title: string
  directory?: string
  permission?: unknown
}

type GetSessionMessagesOptions = {
  limit?: number
}

const SYNC_PROMPT_FALLBACK_TIMEOUT_MS = 30_000
const SYNC_PROMPT_FALLBACK_POLL_MS = 1_000

export async function createSession(client: OpenCodeClient, opts: CreateSessionOptions): Promise<SessionRecord> {
  const { directory, ...body } = opts
  const request: SessionCreateRequest = {
    body,
    ...(directory ? { query: { directory } } : {}),
  }

  return unwrapData(await client.session.create(request))
}

export async function getSession(client: OpenCodeClient, sessionID: string): Promise<SessionRecord> {
  return unwrapData(await client.session.get({ path: { id: sessionID } }))
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
  return unwrapData(await client.session.abort({ path: { id: sessionID } }))
}

export async function getSessionMessages(
  client: OpenCodeClient,
  sessionID: string,
  opts?: GetSessionMessagesOptions
): Promise<unknown[]> {
  const request: SessionMessagesRequest = {
    path: { id: sessionID },
    ...(opts?.limit !== undefined ? { query: { limit: opts.limit } } : {}),
  }

  const response = unwrapData(await client.session.messages(request))

  return Array.isArray(response) ? response : []
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
  body: unknown
): Promise<unknown> {
  const baselineMessageCount = (await getSessionMessages(client, sessionID).catch(() => [] as unknown[])).length
  const request: SessionPromptRequest = {
    path: { id: sessionID },
    body: body as SessionPromptRequest["body"],
  }

  const response = unwrapData(await client.session.prompt(request))
  if (typeof response !== "string") {
    return response
  }

  const trimmed = response.trim()
  if (!trimmed) {
    return waitForAssistantResponse(client, sessionID, baselineMessageCount)
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
 * should not wait for the assistant's response. The OpenCode platform
 * keeps the child session alive independently of the parent's lifecycle.
 */
export async function sendPromptAsync(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown
): Promise<void> {
  const request: SessionPromptAsyncRequest = {
    path: { id: sessionID },
    body: body as SessionPromptAsyncRequest["body"],
  }

  await client.session.promptAsync(request)
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

export function getEventSessionID(event: unknown): string | undefined {
  return (
    getSessionID(getEventSessionInfo(event)) ??
    asString(getNestedValue(event, ["properties", "sessionID"])) ??
    asString(getNestedValue(event, ["sessionID"]))
  )
}

export function getEventParentID(event: unknown): string | undefined {
  return getParentID(getEventSessionInfo(event))
}

export async function walkParentChain(client: OpenCodeClient, sessionID: string): Promise<SessionRecord[]> {
  const chain: SessionRecord[] = []
  const visited = new Set<string>()

  let currentID: string | undefined = sessionID
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

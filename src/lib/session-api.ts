import type { createOpencodeClient } from "@opencode-ai/sdk"

import { asString, getNestedValue, unwrapData } from "./helpers.js"
import type { SessionCompletionTracker } from "./session-completion-tracker.js"

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

export type PromptBody = {
  parts: unknown[]
  agent?: string
  model?: unknown
  temperature?: number
  tools?: unknown
  [key: string]: unknown
}

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

export async function sendPrompt(
  client: OpenCodeClient,
  sessionID: string,
  body: PromptBody
): Promise<unknown> {
  const request: SessionPromptRequest = {
    path: { id: sessionID },
    body: body as SessionPromptRequest["body"],
  }

  return unwrapData(await client.session.prompt(request))
}

export async function sendPromptAsync(
  client: OpenCodeClient,
  sessionID: string,
  body: PromptBody
): Promise<unknown> {
  if (typeof client.session.promptAsync === "function") {
    return unwrapData(
      await client.session.promptAsync({
        path: { id: sessionID },
        body: body as SessionPromptRequest["body"],
      })
    )
  }

  return sendPrompt(client, sessionID, body)
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

export function extractAssistantText(messages: unknown[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    const role = asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))

    if (role !== "assistant") {
      continue
    }

    const parts = getNestedValue(message, ["parts"])
    if (!Array.isArray(parts)) {
      continue
    }

    const text = parts
      .map((part) => {
        if (asString(getNestedValue(part, ["type"])) !== "text") {
          return ""
        }

        return (
          asString(getNestedValue(part, ["text"])) ??
          asString(getNestedValue(part, ["text", "value"])) ??
          asString(getNestedValue(part, ["content"])) ??
          ""
        )
      })
      .join("")
      .trim()

    if (text) {
      return text
    }
  }

  return ""
}

export async function waitForAssistantText(
  client: OpenCodeClient,
  tracker: SessionCompletionTracker,
  sessionID: string,
  timeoutMs: number
): Promise<string> {
  const result = await tracker.watch(sessionID, timeoutMs)

  switch (result.signal) {
    case "idle": {
      const text = extractAssistantText(await getSessionMessages(client, sessionID))
      if (text) {
        return text
      }
      throw new Error(`[Harness] Session ${sessionID} completed without assistant output`)
    }
    case "error":
      throw new Error(`[Harness] Session ${sessionID} failed: ${result.error ?? "Unknown error"}`)
    case "deleted":
      throw new Error(`[Harness] Session ${sessionID} was deleted before assistant output was available`)
    case "timeout":
      throw new Error(`[Harness] Timed out waiting for session ${sessionID} after ${timeoutMs}ms`)
    case "cancelled":
      throw new Error(`[Harness] Waiting for session ${sessionID} was cancelled`)
  }
}

import { asString, getNestedValue, isObject, sleep, stableStringify, unwrapData } from "./helpers.js"
import type { SessionStatus } from "./types.js"

export type SessionCompletionObservation = {
  assistantText?: string
  completionSignal: "assistant-text" | "status-idle" | "session-idle"
  statusType?: string
  sessionStatusType?: string
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

function normalizeSessionStatus(entry: unknown): SessionStatus | undefined {
  if (typeof entry === "string" && entry.length > 0) {
    return { type: entry }
  }

  if (!isObject(entry)) {
    return undefined
  }

  const type =
    asString(getNestedValue(entry, ["type"])) ??
    asString(getNestedValue(entry, ["status"])) ??
    asString(getNestedValue(entry, ["state"]))

  if (!type) {
    return undefined
  }

  return {
    ...(entry as Record<string, unknown>),
    type,
  }
}

function getSessionStatusCandidate(session: unknown): unknown {
  const candidates = [
    getNestedValue(session, ["status"]),
    getNestedValue(session, ["info", "status"]),
    getNestedValue(session, ["state"]),
    getNestedValue(session, ["info", "state"]),
  ]

  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return candidate
    }
  }

  return undefined
}

async function getDirectSessionStatus(client: any, sessionID: string): Promise<SessionStatus | undefined> {
  try {
    const session = await getSessionByAnyPath(client, sessionID)
    return normalizeSessionStatus(getSessionStatusCandidate(session))
  } catch {
    return undefined
  }
}

export function formatSessionStatus(status: SessionStatus | undefined): string {
  if (!status) {
    return "unknown"
  }

  const details = Object.entries(status)
    .filter(([key, value]) => key !== "type" && value !== undefined)
    .map(([key, value]) => `${key}=${stableStringify(value)}`)

  return details.length > 0 ? `${status.type} (${details.join(", ")})` : status.type
}

export async function getSessionByAnyPath(client: any, sessionID: string): Promise<any> {
  const attempts = [
    () => client.session.get({ path: { sessionID } }),
    () => client.session.get({ path: { id: sessionID } }),
    () => client.session.get({ sessionID }),
    () => client.session.get({ id: sessionID }),
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return unwrapData(await attempt())
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch session ${sessionID}`)
}

export async function createSessionByAnyPath(
  client: any,
  payload: Record<string, unknown>
): Promise<any> {
  const attempts = [() => client.session.create({ body: payload }), () => client.session.create(payload)]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return unwrapData(await attempt())
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create child session")
}

export async function promptSessionByAnyPath(
  client: any,
  sessionID: string,
  body: Record<string, unknown>
): Promise<any> {
  const attempts = [
    () => client.session.prompt({ path: { sessionID }, body }),
    () => client.session.prompt({ path: { id: sessionID }, body }),
    () => client.session.prompt({ sessionID, body }),
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return unwrapData(await attempt())
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to prompt session ${sessionID}`)
}

export async function promptSessionAsyncByAnyPath(
  client: any,
  sessionID: string,
  body: Record<string, unknown>
): Promise<any> {
  const promptAsync = client?.session?.promptAsync
  const attempts =
    typeof promptAsync === "function"
      ? [
          () => promptAsync({ path: { sessionID }, body }),
          () => promptAsync({ path: { id: sessionID }, body }),
          () => promptAsync({ sessionID, body }),
        ]
      : []

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return unwrapData(await attempt())
    } catch (error) {
      lastError = error
    }
  }

  if (attempts.length === 0) {
    return promptSessionByAnyPath(client, sessionID, body)
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to prompt session ${sessionID} asynchronously`)
}

export async function getMessagesByAnyPath(client: any, sessionID: string): Promise<any[]> {
  const attempts = [
    () => client.session.messages({ path: { sessionID } }),
    () => client.session.messages({ path: { id: sessionID } }),
    () => client.session.messages({ sessionID }),
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      const result = unwrapData(await attempt())
      return Array.isArray(result) ? result : []
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch messages for ${sessionID}`)
}

export async function getStatusMap(client: any): Promise<Map<string, SessionStatus>> {
  const statusMap = new Map<string, SessionStatus>()
  const getter = client?.session?.status

  if (typeof getter !== "function") {
    return statusMap
  }

  const result = unwrapData(await getter())

  const writeStatus = (entry: unknown, fallbackID?: string) => {
    const status = normalizeSessionStatus(entry)
    const sessionID =
      fallbackID ?? asString(getNestedValue(entry, ["sessionID"])) ?? asString(getNestedValue(entry, ["id"]))

    if (sessionID && status) {
      statusMap.set(sessionID, status)
    }
  }

  if (Array.isArray(result)) {
    for (const entry of result) {
      writeStatus(entry)
    }
    return statusMap
  }

  if (isObject(result)) {
    for (const [key, value] of Object.entries(result)) {
      writeStatus(value, key)
    }
  }

  return statusMap
}

export async function walkParentChain(client: any, sessionID: string): Promise<any[]> {
  const chain: any[] = []
  const visited = new Set<string>()
  let currentID: string | undefined = sessionID

  while (currentID) {
    if (visited.has(currentID)) {
      throw new Error(`Detected cyclic session parent chain at ${currentID}`)
    }
    visited.add(currentID)
    const session = await getSessionByAnyPath(client, currentID)
    chain.push(session)
    currentID = getParentID(session)
  }

  return chain
}

export function extractAssistantText(messages: any[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    const role = asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))

    if (role !== "assistant") {
      continue
    }

    const parts = Array.isArray(getNestedValue(message, ["parts"]))
      ? (getNestedValue(message, ["parts"]) as unknown[])
      : []

    const text = parts
      .map((part) => {
        const partType = asString(getNestedValue(part, ["type"]))
        if (partType === "text") {
          return asString(getNestedValue(part, ["text"])) ?? ""
        }
        return (
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
  client: any,
  sessionID: string,
  pollIntervalMs: number,
  timeoutMs: number
): Promise<SessionCompletionObservation & { assistantText: string }> {
  const observation = await waitForSessionCompletion(client, sessionID, pollIntervalMs, timeoutMs)

  if (observation.assistantText) {
    return {
      ...observation,
      assistantText: observation.assistantText,
    }
  }

  const fallbackMessages = await getMessagesByAnyPath(client, sessionID)
  const fallbackText = extractAssistantText(fallbackMessages)
  if (fallbackText) {
    return {
      ...observation,
      assistantText: fallbackText,
    }
  }

  throw new Error(
    `Session ${sessionID} reached ${observation.completionSignal} without assistant output ` +
      `(status=${observation.statusType ?? "unknown"}, session=${observation.sessionStatusType ?? "unknown"})`
  )
}

export async function waitForSessionCompletion(
  client: any,
  sessionID: string,
  pollIntervalMs: number,
  timeoutMs: number
): Promise<SessionCompletionObservation> {
  const startedAt = Date.now()
  let lastStatus: SessionStatus | undefined
  let lastSessionStatus: SessionStatus | undefined

  while (Date.now() - startedAt < timeoutMs) {
    const messages = await getMessagesByAnyPath(client, sessionID)
    const assistantText = extractAssistantText(messages)
    if (assistantText) {
      return {
        assistantText,
        completionSignal: "assistant-text",
        statusType: lastStatus?.type,
        sessionStatusType: lastSessionStatus?.type,
      }
    }

    const statuses = await getStatusMap(client)
    const status = statuses.get(sessionID)
    lastStatus = status ?? lastStatus
    const directSessionStatus = await getDirectSessionStatus(client, sessionID)
    lastSessionStatus = directSessionStatus ?? lastSessionStatus

    if (status?.type?.toLowerCase() === "idle") {
      return {
        completionSignal: "status-idle",
        statusType: status.type,
        sessionStatusType: directSessionStatus?.type ?? lastSessionStatus?.type,
      }
    }

    if (directSessionStatus?.type?.toLowerCase() === "idle") {
      return {
        completionSignal: "session-idle",
        statusType: status?.type ?? lastStatus?.type,
        sessionStatusType: directSessionStatus.type,
      }
    }

    await sleep(pollIntervalMs)
  }

  throw new Error(
    `Timed out waiting for delegated session ${sessionID} to complete ` +
      `(status=${formatSessionStatus(lastStatus)}, session=${formatSessionStatus(lastSessionStatus)})`
  )
}

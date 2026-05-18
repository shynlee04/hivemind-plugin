import type { createOpencodeClient } from "@opencode-ai/sdk"
import type { SnapshotFileDiff, OpencodeClient as V2OpencodeClient, TextPartInput } from "@opencode-ai/sdk/v2/client"

import { asString, getNestedValue, unwrapData } from "./helpers.js"
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"

export type OpenCodeClient = ReturnType<typeof createOpencodeClient>

type SessionRecord = Record<string, unknown>
type SessionCreateRequest = Parameters<OpenCodeClient["session"]["create"]>[0]
type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]
type SessionMessagesRequest = Parameters<OpenCodeClient["session"]["messages"]>[0]

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
  body: unknown
): Promise<unknown> {
  const validSessionID = assertValidSessionID(sessionID)
  const baselineMessageCount = (await getSessionMessages(client, validSessionID).catch(() => [] as unknown[])).length
  const request: SessionPromptRequest = {
    path: { id: validSessionID },
    body: body as SessionPromptRequest["body"],
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

// ---------------------------------------------------------------------------
// v2 SDK Client — coexists with v1, used for completion detection & control
// ---------------------------------------------------------------------------

/**
 * Result of a completion check against a child session.
 */
export interface CompletionCheckResult {
  isComplete: boolean
  summary: string
  filesChanged: string[]
  toolExecutionTimeMs: number
  reason: string
}

/**
 * Options for v2 session client methods.
 */
export type V2SessionOptions = {
  directory?: string
  workspace?: string
}

/**
 * v2 SDK session client wrapper.
 *
 * Provides access to v2-only capabilities: summarize, diff, enhanced messages,
 * and abort. Coexists with v1 client — does NOT replace v1 functionality.
 *
 * v2 uses flat parameter shapes ({ sessionID }) vs v1 nested shapes
 * ({ path: { id } }).
 */
export class V2SessionClient {
  private readonly v2Client: V2OpencodeClient
  private readonly defaults: V2SessionOptions

  constructor(v2Client: V2OpencodeClient, defaults: V2SessionOptions = {}) {
    this.v2Client = v2Client
    this.defaults = defaults
  }

  /**
   * Create a child session with v2 parameter shape.
   *
   * @param parentID - Parent session ID
   * @param params - Creation parameters
   * @returns Created session data
   */
  async create(
    parentID: string,
    params: {
      title?: string
      agent?: string
      permissions?: Array<{ permission: string; pattern: string; action: "allow" | "deny" | "ask" }>
    },
  ): Promise<unknown> {
    const response = await this.v2Client.session.create({
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      parentID: assertValidSessionID(parentID, "parent session ID"),
      title: params.title,
      agent: params.agent,
      permission: params.permissions,
    })
    return unwrapData(response)
  }

  /**
   * Generate a concise summary of the session using AI compaction.
   *
   * @param sessionID - The session to summarize
   * @param opts - Optional model/provider override
   * @returns Summary text from AI compaction
   */
  async summarize(
    sessionID: string,
    opts?: { providerID?: string; modelID?: string; auto?: boolean },
  ): Promise<string> {
    const validSessionID = assertValidSessionID(sessionID)
    const response = await this.v2Client.session.summarize({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      providerID: opts?.providerID,
      modelID: opts?.modelID,
      auto: opts?.auto,
    })
    const data = unwrapData(response)
    return (data as { summary?: string })?.summary ?? ""
  }

  /**
   * Get file changes (diff) that resulted from a specific user message.
   *
   * @param sessionID - The session to query
   * @param messageID - The message to get diff for
   * @returns Array of file diffs
   */
  async diff(sessionID: string, messageID?: string): Promise<SnapshotFileDiff[]> {
    const validSessionID = assertValidSessionID(sessionID)
    const response = await this.v2Client.session.diff({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      messageID,
    })
    const data = unwrapData(response)
    return (data as { diffs?: SnapshotFileDiff[] })?.diffs ?? []
  }

  /**
   * Get session messages with v2 pagination support (before cursor).
   *
   * @param sessionID - The session to query
   * @param opts - Pagination options
   * @returns Array of messages
   */
  async messages(
    sessionID: string,
    opts?: { limit?: number; before?: string },
  ): Promise<unknown[]> {
    const validSessionID = assertValidSessionID(sessionID)
    const response = await this.v2Client.session.messages({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      limit: opts?.limit,
      before: opts?.before,
    })
    const data = unwrapData(response)
    return Array.isArray(data) ? data : []
  }

  /**
   * Abort an active session.
   *
   * @param sessionID - The session to abort
   */
  async abort(sessionID: string): Promise<void> {
    const validSessionID = assertValidSessionID(sessionID)
    await this.v2Client.session.abort({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
    })
  }

  /**
   * Update session properties (title, permission, archive time).
   *
   * @param sessionID - The session to update
   * @param params - Update parameters
   */
  async update(
    sessionID: string,
    params: { title?: string; permission?: Array<{ permission: string; pattern: string; action: "allow" | "deny" | "ask" }>; archived?: number },
  ): Promise<unknown> {
    const validSessionID = assertValidSessionID(sessionID)
    const response = await this.v2Client.session.update({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      title: params.title,
      permission: params.permission,
      time: params.archived !== undefined ? { archived: params.archived } : undefined,
    })
    return unwrapData(response)
  }

  /**
   * Prompt a session with v2 parameter shape.
   *
   * @param sessionID - The session to prompt
   * @param params - Prompt parameters
   * @returns Prompt response
   */
  async prompt(
    sessionID: string,
    params: {
      parts?: Array<TextPartInput>
      agent?: string
      noReply?: boolean
    },
  ): Promise<unknown> {
    const validSessionID = assertValidSessionID(sessionID)
    const response = await this.v2Client.session.prompt({
      sessionID: validSessionID,
      directory: this.defaults.directory,
      workspace: this.defaults.workspace,
      parts: params.parts,
      agent: params.agent,
      noReply: params.noReply,
    })
    return unwrapData(response)
  }
}

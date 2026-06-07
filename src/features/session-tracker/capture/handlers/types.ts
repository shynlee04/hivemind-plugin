/**
 * Shared types and interfaces for session-tracker event handlers.
 *
 * REQ-C6-01: Extracts HandlerDeps interface and shared helper functions
 * that are used across multiple handler classes.
 *
 * @module session-tracker/capture/handlers/types
 */

import type { OpenCodeClient } from "../../../../shared/session-api.js"
import { getSession } from "../../../../shared/session-api.js"
import type { SessionWriter } from "../../persistence/session-writer.js"
import type { ChildWriter } from "../../persistence/child-writer.js"
import type { SessionIndexWriter } from "../../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../../persistence/project-index-writer.js"
import type { HierarchyIndex } from "../../persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "../../persistence/pending-dispatch-registry.js"
import type { HierarchyManifestWriter } from "../../persistence/hierarchy-manifest.js"
import type { LastMessageCapture } from "../last-message-capture.js"
import { ChildBackfiller } from "../child-backfiller.js"
import type { ChildSessionRecord, DelegationType } from "../../types.js"

// ---------------------------------------------------------------------------
// HandlerDeps interface — shared dependencies for all handlers
// ---------------------------------------------------------------------------

/**
 * Dependencies injected into all session event handlers.
 *
 * Passed via constructor to each handler class. The EventCapture
 * class constructs this once and shares it across all handlers.
 */
export interface HandlerDeps {
  client: OpenCodeClient
  sessionWriter: SessionWriter
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter?: ProjectIndexWriter
  hierarchyIndex?: HierarchyIndex
  pendingRegistry?: PendingDispatchRegistry
  manifestWriter?: HierarchyManifestWriter
  lastMessageCapture?: LastMessageCapture
  backfiller: ChildBackfiller
  assistantTurnCounters: Map<string, number>
  projectRoot: string
}

// ---------------------------------------------------------------------------
// Child route resolution
// ---------------------------------------------------------------------------

/**
 * Resolves lifecycle status routing for a child session.
 *
 * Uses SDK parent metadata first, then the in-memory hierarchy index, then
 * pending dispatch metadata. Status writes need both immediate parent and
 * root main because child `.json` paths and session-continuity indexes use
 * different authorities.
 *
 * @param deps - Handler dependencies.
 * @param sessionID - Session receiving a lifecycle status event.
 * @returns Child route data, or `undefined` when the session is main/unknown.
 */
export async function resolveChildLifecycleRoute(
  deps: HandlerDeps,
  sessionID: string,
): Promise<{ parentID: string; rootMainID: string } | undefined> {
  let parentID: string | null | undefined
  try {
    const session = await getSession(deps.client, sessionID)
    parentID = session.parentID as string | null | undefined
  } catch {
    parentID = undefined
  }

  const indexedParent = deps.hierarchyIndex?.getParent(sessionID)
  const pendingParent = deps.pendingRegistry?.get(sessionID)?.parentSessionID
  const effectiveParentID = parentID ?? indexedParent ?? pendingParent
  if (!effectiveParentID) return undefined

  if (deps.hierarchyIndex && !deps.hierarchyIndex.isChild(sessionID)) {
    deps.hierarchyIndex.registerChild(effectiveParentID, sessionID)
  }

  const rootMainID = deps.hierarchyIndex?.getRootMain(sessionID) ?? effectiveParentID
  return { parentID: effectiveParentID, rootMainID }
}

// ---------------------------------------------------------------------------
// Immediate child file writing
// ---------------------------------------------------------------------------

/**
 * Writes the child .json file IMMEDIATELY at session.created (D-06).
 *
 * This closes the race window where child data was lost between
 * session.created and PostToolUse.
 *
 * @param deps - Handler dependencies.
 * @param sessionID - The child session ID.
 * @param parentID - The immediate parent session ID.
 * @param explicitSubagentType - Subagent type from PendingDispatchRegistry.
 * @param explicitDelegationDepth - Delegation depth override.
 */
export async function writeImmediateChildFile(
  deps: HandlerDeps,
  sessionID: string,
  parentID: string,
  explicitSubagentType?: string,
  explicitDelegationDepth?: number,
  /**
   * Optional delegation discriminator. Set at the
   * writer call site (never derived from event payloads). The pending-registry
   * entry's `tool` field is the writer's source of truth for which enum value
   * to set; the explicit parameter overrides when the caller already knows.
   */
  explicitDelegationType?: DelegationType,
): Promise<void> {
  if (!deps.childWriter) return

  const now = new Date().toISOString()
  const pendingEntry =
    deps.pendingRegistry?.get(sessionID) ??
    deps.pendingRegistry?.getByParent(parentID)
  const entry = Array.isArray(pendingEntry) ? pendingEntry[0] : pendingEntry
  const subagentType = explicitSubagentType ?? entry?.subagentType ?? "unknown"
  let delegationDepth = explicitDelegationDepth ?? 1

  // Compute delegationType at write time from
  // the tool name (per MVD §12.3). The pending-registry entry carries
  // the tool that produced the child; the explicit parameter overrides
  // when the caller already computed it.
  const entryTool = entry?.tool ?? "task"
  const delegationType: DelegationType =
    explicitDelegationType ??
    (entryTool === "delegate-task" ? "async-spawn" :
     entryTool === "task" ? "native-task" :
     entryTool === "execute-slash-command" ? "slash-cmd" :
     "sdk-direct")

  try {
    if (deps.hierarchyIndex) {
      deps.hierarchyIndex.registerChild(parentID, sessionID)
      delegationDepth = explicitDelegationDepth ?? deps.hierarchyIndex.getDepth?.(sessionID) ?? 1
    }

    await deps.childWriter.createChildFile(parentID, sessionID, {
      sessionID,
      parentSessionID: parentID,
      delegationDepth,
      delegatedBy: {
        agentName: subagentType,
        model: entry?.model ?? "",
        tool: entry?.tool ?? "task",
        description: "",
        subagentType,
      },
      created: now,
      updated: now,
      status: "active",
      mainAgent: {
        name: subagentType,
        model: entry?.model ?? "",
      },
      turns: [],
      children: [],
      journey: [],
      // mirror to child .json (R9)
      delegationType,
    })

    deps.childWriter.setDelegationContext(sessionID, {
      agentName: subagentType,
      model: entry?.model,
    })

    if (deps.hierarchyIndex && deps.manifestWriter) {
      const rootMain = deps.hierarchyIndex.getRootMain(sessionID)
      if (rootMain) {
        if (typeof deps.sessionIndexWriter.addChild === "function") {
          await deps.sessionIndexWriter.addChild(
            rootMain,
            sessionID,
            `${sessionID}.json`,
            delegationDepth,
            subagentType,
            delegationDepth > 1 ? parentID : undefined,
          )
        }
        await deps.projectIndexWriter?.incrementChildCount(rootMain, delegationDepth)
        await deps.projectIndexWriter?.addSession(
          sessionID,
          `${rootMain}/`,
          `${sessionID}.json`,
        )
        if (typeof deps.manifestWriter.addChild === "function") {
          await deps.manifestWriter.addChild({
            rootMainSessionID: rootMain,
            childSessionID: sessionID,
            parentSessionID: parentID,
            delegationDepth,
            delegatedBy: entry?.tool ?? "task",
            subagentType,
            childFile: `${sessionID}.json`,
            // mirror to manifest (R9)
            delegationType,
          })
        }
        await deps.sessionWriter.addChildRef(rootMain, {
          sessionID,
          childFile: `${sessionID}.json`,
        })
      }
    }
  } catch (err) {
    void deps.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Hivemind] Session tracker: immediate child .json write failed for "${sessionID}" — enqueued to retry queue`,
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Compaction helpers
// ---------------------------------------------------------------------------

/**
 * Finds the most likely compact summary string in a version-tolerant payload.
 *
 * @param value - Raw event value to scan.
 * @returns The first non-empty summary-like string without trimming content.
 */
export function findCompactionText(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim().length > 0 ? value : undefined
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

  const record = value as Record<string, unknown>
  const preferredKeys = [
    "summary", "compactSummary", "compactionSummary",
    "content", "context", "message", "text",
    "compact_summary", "compaction_text", "output",
  ]
  for (const key of preferredKeys) {
    const candidate = record[key]
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
  }
  for (const key of Object.keys(record)) {
    const val = record[key]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = findCompactionText(val)
      if (nested) return nested
    }
  }
  return undefined
}

/**
 * Resolves compaction content from session message history.
 * Fallback when the session.compacted event payload is metadata-only.
 *
 * @param deps - Handler dependencies.
 * @param sessionID - The session that was compacted.
 * @returns Markdown content for the compaction section.
 */
export async function resolveCompactionFromMessages(
  deps: HandlerDeps,
  sessionID: string,
): Promise<string> {
  try {
    const messages = await (await import("../../../../shared/session-api.js")).getSessionMessages(deps.client, sessionID)
    if (messages && messages.length > 0) {
      let lastAssistantMsg: unknown
      for (let i = messages.length - 1; i >= 0; i--) {
        if (deps.backfiller.messageRole(messages[i]) === "assistant") {
          lastAssistantMsg = messages[i]
          break
        }
      }
      if (lastAssistantMsg) {
        const text = deps.backfiller.extractTextFromSdkMessage(lastAssistantMsg)
        if (text && text.trim().length > 0) {
          return `**compact_summary:**\n\n${text}\n`
        }
      }
      const lastMsg = messages[messages.length - 1]
      const fallbackText = deps.backfiller.extractTextFromSdkMessage(lastMsg)
      if (fallbackText && fallbackText.trim().length > 0) {
        return `**compact_summary:**\n\n${fallbackText}\n`
      }
    }
  } catch {
    // getSessionMessages failed — fall through
  }

  const childData = await deps.childWriter.readChildData(sessionID)
  if (childData) {
    const summary = extractSummaryFromChildRecord(childData)
    if (summary) return `**compact_summary:**\n\n${summary}\n`
  }

  const childSummaries = await collectChildSummaries(deps, sessionID)
  if (childSummaries && childSummaries.length > 0) {
    return `**compact_summary (from children):**\n\n${childSummaries.join("\n---\n")}\n`
  }

  return "**Compaction occurred — summary unavailable.**\n"
}

/**
 * Collects lastMessage summaries from all child sessions.
 */
export async function collectChildSummaries(
  deps: HandlerDeps,
  rootSessionID: string,
): Promise<string[]> {
  try {
    if (!deps.manifestWriter) return []
    const children = await deps.manifestWriter.getChildren(rootSessionID)
    if (!children || Object.keys(children).length === 0) return []

    const summaries: string[] = []
    for (const [childID, meta] of Object.entries(children)) {
      if (meta.status === "completed") {
        const childData = await deps.childWriter.readChildData(childID)
        if (childData?.lastMessage && childData.lastMessage.trim().length > 0) {
          summaries.push(`**${childID}:** ${childData.lastMessage.substring(0, 2000)}`)
        }
      }
    }
    return summaries
  } catch {
    return []
  }
}

/**
 * Extracts a compaction summary from a child session record.
 *
 * @param record - The child session record to extract from.
 * @returns Summary text, or `undefined` if no usable content found.
 */
export function extractSummaryFromChildRecord(record: ChildSessionRecord): string | undefined {
  if (record.lastMessage && record.lastMessage.trim().length > 0) {
    return record.lastMessage.trim()
  }

  const turns = record.turns
  if (turns && turns.length > 0) {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i]
      if (t.role === "assistant" || t.actor.includes("agent")) {
        if (t.content && t.content.trim().length > 0) return t.content.trim()
      }
    }
    const last = turns[turns.length - 1]
    if (last.content && last.content.trim().length > 0) return last.content.trim()
  }

  return undefined
}

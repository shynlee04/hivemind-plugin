/**
 * Child session backfill from SDK messages.
 *
 * Extracted from EventCapture to reduce module size and enable independent
 * testing. Handles backfilling turns and lastMessage from OpenCode SDK
 * messages when a child session completes.
 *
 * @module session-tracker/capture/child-backfiller
 */

import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import { getSessionMessages } from "../../../shared/session-api.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { Turn } from "../types.js"
import { asString, getNestedValue } from "../../../shared/helpers.js"

/**
 * Dependencies for child session backfill operations.
 */
export interface ChildBackfillerDeps {
  client: OpenCodeClient
  childWriter: ChildWriter
  /**
   * Optional project root for disk-based child file discovery.
   * When provided, `forceBackfillAllChildren()` can scan
   * `.hivemind/session-tracker/{parentID}/` to enumerate children.
   * Without this, force-backfill is a no-op (only per-child backfill
   * via `backfillChildTurnsFromSdk()` is available).
   */
  projectRoot?: string
}

/**
 * Summary of a force-backfill operation across all children of a parent.
 *
 * Returned by `forceBackfillAllChildren()` so callers can detect partial
 * failures without having to inspect per-child exceptions.
 */
export interface BackfillSummary {
  /** Total number of child files discovered on disk. */
  total: number
  /** Number of children whose backfill completed without error. */
  succeeded: number
  /** Number of children whose backfill threw an error. */
  failed: number
  /** Per-child error details for the failures. */
  errors: Array<{ childID: string; error: string }>
}

/**
 * Handles backfilling turns and lastMessage from OpenCode SDK messages
 * when a child session completes.
 *
 * This is a pure utility class with no mutable state — safe to share
 * across concurrent child session completions (up to 10 parallel children).
 */
export class ChildBackfiller {
  private client: OpenCodeClient
  private childWriter: ChildWriter
  private projectRoot: string | undefined

  constructor(deps: ChildBackfillerDeps) {
    this.client = deps.client
    this.childWriter = deps.childWriter
    this.projectRoot = deps.projectRoot
  }

  /**
   * Force-backfills ALL children of a parent session from SDK messages.
   *
   * 6th layer of defense in the child session capture resilience stack
   * (Phase 62). Called when a delegation cycle ends (tool.execute.after
   * or session.idle). Iterates every child .json on disk for the given
   * parent and calls `backfillChildTurnsFromSdk()` for each. Per-child
   * failures are caught and aggregated so one slow/broken SDK call
   * does not abort the rest of the cycle.
   *
   * Discovery uses DISK (not in-memory hierarchyIndex) because the
   * in-memory index may be incomplete — children discovered by proactive
   * polling between sync points may not yet be registered. The file
   * system is the single source of truth.
   *
   * No-op when `projectRoot` was not provided at construction (returns
   * zero summary) or when the parent has no children on disk.
   *
   * @param parentSessionID - The parent whose children to backfill.
   * @returns Summary of the operation (totals + per-child errors).
   */
  async forceBackfillAllChildren(
    parentSessionID: string,
  ): Promise<BackfillSummary> {
    const result: BackfillSummary = { total: 0, succeeded: 0, failed: 0, errors: [] }
    try {
      const childIDs = await this.discoverChildFiles(parentSessionID)
      result.total = childIDs.length
      if (childIDs.length === 0) return result

      for (const childID of childIDs) {
        try {
          await this.backfillChildTurnsFromSdk(parentSessionID, childID)
          result.succeeded++
        } catch (err) {
          result.failed++
          result.errors.push({
            childID,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    } catch (err) {
      // Outer catch: discovery itself failed (rare — readdir rejected).
      // We still return the partial summary so callers can inspect what
      // was attempted, and log a structured warning for diagnostics.
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Force backfill failed for parent "${parentSessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
    return result
  }

  /**
   * Discovers child session IDs from the parent's child directory.
   *
   * Scans `.hivemind/session-tracker/{parentSessionID}/*.json` and
   * returns the filename stems (without `.json` extension) for files
   * that look like session IDs (`ses_` prefix). Non-json files and
   * non-session-id filenames are filtered out defensively.
   *
   * Returns `[]` on any error (missing directory, permission denied, etc.)
   * — this is a best-effort discovery, never throws.
   *
   * @param parentSessionID - The parent whose child files to enumerate.
   * @returns Array of child session IDs discovered on disk.
   */
  private async discoverChildFiles(parentSessionID: string): Promise<string[]> {
    if (!this.projectRoot) return []
    try {
      const childDir = resolve(this.projectRoot, ".hivemind", "session-tracker", parentSessionID)
      const files = await readdir(childDir)
      return files
        .filter((f) => f.endsWith(".json") && !f.startsWith("."))
        .map((f) => f.replace(/\.json$/, ""))
        .filter((id) => id.startsWith("ses_"))
    } catch {
      return []
    }
  }

  /**
   * Backfills turns from SDK messages for a completed child session.
   *
   * Called from session.idle, session.deleted, and session.error handlers
   * when the completed session is a child (has parentID). The backfill is
   * fire-and-forget — errors are logged, never thrown.
   *
   * @param parentID - The parent session ID.
   * @param childSessionID - The completed child session ID.
   */
  async backfillChildTurnsFromSdk(
    parentID: string,
    childSessionID: string,
  ): Promise<void> {
    try {
      const messages = await getSessionMessages(this.client, childSessionID)
      if (!messages || messages.length === 0) return

      // Find the index of the last assistant message
      let lastAssistantIndex = -1
      for (let i = messages.length - 1; i >= 0; i--) {
        if (this.messageRole(messages[i]) === "assistant") {
          lastAssistantIndex = i
          break
        }
      }

      const turns: Turn[] = []
      let turnNumber = 1
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        const role = this.messageRole(message)
        const isLastAssistant = i === lastAssistantIndex
        const content = this.extractTextFromSdkMessage(message, isLastAssistant)
        if (!content) continue

        turns.push({
          turn: turnNumber++,
          actor: (getNestedValue(message, ["agent"]) as string) || (role === "user" ? "user" : "unknown"),
          content,
          tools: [],
          role,
        })
      }

      if (turns.length > 0) {
        await this.childWriter.backfillChildTurns(parentID, childSessionID, turns)
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Session tracker: failed to backfill child turns for "${childSessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Extracts the role from an SDK message object.
   * Handles both `{ info: { role } }` and `{ role }` shapes.
   */
  messageRole(message: unknown): string | undefined {
    return asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))
  }

  /**
   * Extracts text content from an SDK message's parts array.
   * Handles text parts, thinking parts (optional), and tool-only fallback.
   */
  extractTextFromSdkMessage(message: unknown, includeThinking = false): string | undefined {
    const parts = getNestedValue(message, ["parts"]) as unknown[] | undefined
    if (!Array.isArray(parts) || parts.length === 0) return undefined

    const textParts = parts
      .filter((part: unknown) => {
        const type = getNestedValue(part, ["type"])
        return type === "text" || (includeThinking && type === "thinking")
      })
      .map((part: unknown) => {
        const type = getNestedValue(part, ["type"])
        const text = asString(getNestedValue(part, ["text"]))
        const content = asString(getNestedValue(part, ["content"]))
        const val = text || content || ""
        if (type === "thinking" && val.trim().length > 0) {
          return `<thinking>\n${val.trim()}\n</thinking>`
        }
        return val
      })
      .filter((text): text is string => typeof text === "string" && text.length > 0)

    if (textParts.length > 0) return textParts.join("\n")

    // Fallback: extract tool names for tool-only messages
    const toolParts = parts
      .filter((part: unknown) => getNestedValue(part, ["type"]) === "tool")
      .map((part: unknown): string => {
        const toolName = asString(getNestedValue(part, ["tool"])) || asString(getNestedValue(part, ["name"])) || "tool"
        return toolName
      })
      .filter((name): name is string => name.length > 0)

    if (toolParts.length > 0) return "Tools: " + toolParts.join(", ")

    return undefined
  }
}

/**
 * Session lifecycle event capture handler.
 *
 * Handles `session.created`, `session.idle`, `session.deleted`, and
 * `session.error` events from the OpenCode `event` hook. Distinguishes
 * root sessions from child sessions via SDK `parentID` check.
 *
 * Root sessions: creates `.hivemind/session-tracker/{sessionID}/` subdir
 * and `{sessionID}.md` file. Child sessions: skipped (handled by tool-capture
 * when `task` tool fires).
 *
 * All handlers are best-effort — errors are logged, never thrown.
 *
 * @module session-tracker/capture/event-capture
 */

import type { OpenCodeClient } from "../../../shared/session-api.js"
import { getSession } from "../../../shared/session-api.js"
import type { SessionWriter } from "../persistence/session-writer.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
import type { HierarchyIndex } from "../persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
import type { HierarchyManifestWriter } from "../persistence/hierarchy-manifest.js"
import type { JourneyEntry } from "../types.js"
import { sanitizeSessionID } from "../persistence/atomic-write.js"
import { isValidSessionID } from "../types.js"

// ---------------------------------------------------------------------------
// EventCapture class
// ---------------------------------------------------------------------------

/**
 * Handles session lifecycle events from the OpenCode `event` hook.
 *
 * Delegated by the hook pipeline. Never writes files directly — relies on
 * {@link SessionWriter} for all persistence operations.
 */
export class EventCapture {
  private client: OpenCodeClient
  private sessionWriter: SessionWriter
  private childWriter: ChildWriter
  private sessionIndexWriter: SessionIndexWriter
  private projectIndexWriter: ProjectIndexWriter | undefined
  private hierarchyIndex: HierarchyIndex | undefined
  private pendingRegistry: PendingDispatchRegistry | undefined
  private manifestWriter: HierarchyManifestWriter | undefined

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for session queries.
   * @param deps.sessionWriter - The session writer for persistence.
   * @param deps.childWriter - The child writer for child session .json updates (DEFECT-08).
   * @param deps.sessionIndexWriter - The session index writer for hierarchy updates (DEFECT-08).
   * @param deps.projectIndexWriter - Optional project index writer for session registration.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    childWriter: ChildWriter
    sessionIndexWriter: SessionIndexWriter
    projectIndexWriter?: ProjectIndexWriter
    hierarchyIndex?: HierarchyIndex
    pendingRegistry?: PendingDispatchRegistry
    manifestWriter?: HierarchyManifestWriter
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
    this.childWriter = deps.childWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
    this.projectIndexWriter = deps.projectIndexWriter
    this.hierarchyIndex = deps.hierarchyIndex
    this.pendingRegistry = deps.pendingRegistry
    this.manifestWriter = deps.manifestWriter
  }

  /**
   * Handles a session lifecycle event from the `event` hook.
   *
   * @param event - Hook input containing eventType, sessionID, and raw event data.
   * @returns Promise that resolves when the event has been processed.
   *
   * @remarks
   * Supported event types:
   * - `session.created` — creates subdir + .md for root sessions
   * - `session.idle` — updates session status to "idle"
   * - `session.deleted` — marks session status as "completed"
   * - `session.error` — marks session status as "error"
   */
  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    try {
      if (!event?.sessionID || !isValidSessionID(event.sessionID)) {
        return
      }

      // Validate sessionID matches its own sanitized form — reject any
      // sessionID that would be altered by sanitization (path traversal guard).
      if (event.sessionID !== sanitizeSessionID(event.sessionID)) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session tracker: sessionID contains unsafe characters: "${event.sessionID}"`,
          },
        })
        return
      }

      switch (event.eventType) {
        case "session.created":
          await this.handleSessionCreated(event.sessionID)
          break
        case "session.idle":
          await this.handleSessionIdle(event.sessionID)
          break
        case "session.deleted":
          await this.handleSessionDeleted(event.sessionID)
          break
        case "session.error":
          await this.handleSessionError(event.sessionID)
          break
        case "session.compacted":
          await this.handleSessionCompacted(event.sessionID, event.event as Record<string, unknown>)
          break
        default:
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: unknown event type "${event.eventType}"`,
            },
          })
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: event handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles `session.created` — creates subdir + .md for root sessions only.
   *
   * Uses `client.session.get()` (via `getSession` helper) to check `parentID`.
   * Root sessions (null parentID) get a new subdirectory + .md file initialized.
   * Child sessions (non-null parentID) are skipped — the task tool handler
   * will create their child .json file under the parent's subdir when the
   * delegation spawn event fires.
   */
  private async handleSessionCreated(sessionID: string): Promise<void> {
    try {
      // Gate 0 (CP-ST-05-01): BEFORE-THE-FACT classification.
      // Check if ANY task dispatch was recently recorded via PreToolUse hook.
      // If so, this session is almost certainly a child — write .json immediately
      // without waiting for SDK parentID or creating a directory.
      // Uses getAnyActiveEntry() unconditionally (Option A) — handles any number
      // of concurrent dispatches (normal when agents delegate 10+ tasks rapidly).
      // No longer bails on pendingCount > 1 (Option B) — falls through to SDK
      // retry + Gates 2/3 for defense-in-depth.
      const anyPending = this.pendingRegistry?.getAnyActiveEntry()
      if (anyPending) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "info",
            message: `[Harness] Session tracker: Gate 0 classification — pending dispatch detected for "${sessionID}"`,
          },
        })
        await this.writeImmediateChildFile(sessionID, anyPending.parentSessionID, anyPending.subagentType, anyPending.delegationDepth)
        return
      }

      // Retry logic: the SDK might not report parentID on the first call
      // if the child session was JUST created (race with task tool completion).
      let parentID: string | null | undefined
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const session = await getSession(this.client, sessionID)
          parentID = session.parentID as string | null | undefined
          if (parentID) break
          // If parentID is null/undefined on first attempt, wait and retry
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 100))
          }
        } catch {
          // SDK call failed — fall through to hierarchy index check.
          break
        }
      }

      if (parentID != null) {
        // D-06: Child session — write child .json IMMEDIATELY
        // (not deferred to PostToolUse handleTask)
        await this.writeImmediateChildFile(sessionID, parentID)
        return
      }

      // parentID is null/undefined — run gates to classify session.

      // Gate 2: Check hierarchy index before treating as root.
      // If the SDK doesn't report parentID but the hierarchy index knows
      // this session is a child, write child .json immediately.
      if (this.hierarchyIndex?.isChild(sessionID)) {
        // D-06: Child session via hierarchy index — resolve parent
        const resolvedParent = this.hierarchyIndex.getParent(sessionID)
        if (resolvedParent) {
          await this.writeImmediateChildFile(sessionID, resolvedParent)
        }
        // Classified as child — never create root directory
        return
      }

      // Gate 3: Check pending dispatch registry.
      // If a parent session recently dispatched a task, the resulting
      // child session is tracked here even before the SDK or hierarchy
      // index knows about it.
      if (this.pendingRegistry?.has(sessionID)) {
        // D-06: Child session via pending registry — resolve parent
        const pendingEntry = this.pendingRegistry.get(sessionID)
        const effectiveParent = pendingEntry?.parentSessionID
        if (effectiveParent) {
          await this.writeImmediateChildFile(sessionID, effectiveParent, pendingEntry?.subagentType)
        }
        return
      }

      // All three gates passed — root main session (D-02).
      // This is the ONLY path that creates directories for session.created.
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "info",
          message: `[Harness] Session tracker: creating root main session directory for "${sessionID}"`,
        },
      })

      // Root session — create subdirectory + .md file
      await this.sessionWriter.createSessionDir(sessionID)
      await this.sessionWriter.initializeSessionFile(sessionID, {
        sessionID,
        parentSessionID: null,
        delegationDepth: 0,
        status: "active",
      })

      // Register the session in the project-level continuity index
      if (this.projectIndexWriter) {
        await this.projectIndexWriter.addSession(
          sessionID,
          `${sessionID}/`,
          `${sessionID}.md`,
        )
      }
      // Child sessions are handled by tool-capture when task tool fires
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.created for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles `session.idle` — updates the session status to "idle".
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionIdle(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const childRoute = await this.resolveChildLifecycleRoute(sessionID)
      if (childRoute) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(childRoute.parentID, sessionID, "idle")
        // Also update session-local index hierarchy
        await this.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "idle")
        // D-07: update hierarchy-manifest.json
        if (this.manifestWriter) {
          await this.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "idle")
        }
        return
      }
      // Main session — existing behavior
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "idle",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.idle for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles `session.deleted` — marks the session status as "completed".
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionDeleted(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const childRoute = await this.resolveChildLifecycleRoute(sessionID)
      if (childRoute) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(childRoute.parentID, sessionID, "completed")
        await this.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        // D-07: update hierarchy-manifest.json
        if (this.manifestWriter) {
          await this.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        }
        // F-18: Backfill child metadata with real agent identity
        const pendingEntry = this.pendingRegistry?.get(sessionID)
        const agentName = pendingEntry?.subagentType ?? "unknown"
        await this.childWriter.backfillChildMetadata(
          childRoute.parentID,
          sessionID,
          { agentName, model: "" },
        ).catch((err) => {
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: backfill failed for "${sessionID}"`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
        return
      }
      // Main session — existing behavior
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "completed",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.deleted for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles `session.error` — marks the session status as "error".
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionError(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const childRoute = await this.resolveChildLifecycleRoute(sessionID)
      if (childRoute) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(childRoute.parentID, sessionID, "error")
        await this.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "error")
        // D-07: update hierarchy-manifest.json
        if (this.manifestWriter) {
          await this.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "error")
        }
        // F-18: Backfill child metadata with real agent identity
        const pendingEntry = this.pendingRegistry?.get(sessionID)
        const agentName = pendingEntry?.subagentType ?? "unknown"
        await this.childWriter.backfillChildMetadata(
          childRoute.parentID,
          sessionID,
          { agentName, model: "" },
        ).catch((err) => {
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: backfill failed for "${sessionID}"`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
        return
      }
      // Main session — existing behavior
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "error",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.error for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Writes the child .json file IMMEDIATELY at session.created (D-06).
   *
   * This closes the race window where child data was lost between
   * session.created and PostToolUse. The child .json is written under
   * the root main session directory (via childWriter.resolveWriteParent,
   * per CP-ST-04-02). The hierarchy manifest is also updated (D-07).
   *
   * RC-5: Errors propagate to caller and are enqueued to the retry queue
   * by childWriter. A failed immediate write does not block the session
   * lifecycle but is logged for observability.
   *
   * @param sessionID - The child session ID.
   * @param parentID - The immediate parent session ID.
   * @param explicitSubagentType - Subagent type from PendingDispatchRegistry,
   *   if available. Falls back to "unknown".
   */
  private async writeImmediateChildFile(
    sessionID: string,
    parentID: string,
    explicitSubagentType?: string,
    explicitDelegationDepth?: number,
    explicitAgentName?: string,
    explicitModel?: string,
  ): Promise<void> {
    if (!this.childWriter) return

    const now = new Date().toISOString()
    const pendingEntry = this.pendingRegistry?.get(sessionID)
    const subagentType = explicitSubagentType ?? pendingEntry?.subagentType ?? "unknown"
    let delegationDepth = explicitDelegationDepth ?? 1

    try {
      if (this.hierarchyIndex) {
        this.hierarchyIndex.registerChild(parentID, sessionID)
        delegationDepth = explicitDelegationDepth ?? this.hierarchyIndex.getDepth?.(sessionID) ?? 1
      }

      // Write child .json under the root main session directory
      // (childWriter.resolveWriteParent resolves to root main per CP-ST-04-02)
      await this.childWriter.createChildFile(parentID, sessionID, {
        sessionID,
        parentSessionID: parentID,
        delegationDepth,
        delegatedBy: {
          agentName: explicitAgentName ?? subagentType,
          model: explicitModel ?? "",
          tool: pendingEntry?.tool ?? "task",
          description: "",
          subagentType,
        },
        created: now,
        updated: now,
        status: "active",
        mainAgent: {
          name: explicitAgentName ?? subagentType,
          model: explicitModel ?? "",
        },
        turns: [],
        children: [],
        journey: [],
      })

      // D-07: update hierarchy-manifest.json
      // Register child in hierarchy index first so getRootMain works
      if (this.hierarchyIndex && this.manifestWriter) {
        const rootMain = this.hierarchyIndex.getRootMain(sessionID)
        if (rootMain) {
          if (typeof this.sessionIndexWriter.addChild === "function") {
            await this.sessionIndexWriter.addChild(
              rootMain,
              sessionID,
              `${sessionID}.json`,
              delegationDepth,
              subagentType,
              delegationDepth > 1 ? parentID : undefined,
            )
          }
          await this.projectIndexWriter?.incrementChildCount(rootMain, delegationDepth)
          await this.projectIndexWriter?.addSession(
            sessionID,
            `${rootMain}/`,
            `${sessionID}.json`,
          )
        }
      }
    } catch (err) {
      // RC-5: Log but don't swallow — childWriter already enqueued to retry queue
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: immediate child .json write failed for "${sessionID}" — enqueued to retry queue`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Resolves lifecycle status routing for a child session.
   *
   * Uses SDK parent metadata first, then the in-memory hierarchy index, then
   * pending dispatch metadata. Status writes need both immediate parent and
   * root main because child `.json` paths and session-continuity indexes use
   * different authorities.
   *
   * @param sessionID - Session receiving a lifecycle status event.
   * @returns Child route data, or `undefined` when the session is main/unknown.
   */
  private async resolveChildLifecycleRoute(sessionID: string): Promise<{
    parentID: string
    rootMainID: string
  } | undefined> {
    let parentID: string | null | undefined
    try {
      const session = await getSession(this.client, sessionID)
      parentID = session.parentID as string | null | undefined
    } catch {
      parentID = undefined
    }

    const indexedParent = this.hierarchyIndex?.getParent(sessionID)
    const pendingParent = this.pendingRegistry?.get(sessionID)?.parentSessionID
    const effectiveParentID = parentID ?? indexedParent ?? pendingParent
    if (!effectiveParentID) return undefined

    if (this.hierarchyIndex && !this.hierarchyIndex.isChild(sessionID)) {
      this.hierarchyIndex.registerChild(effectiveParentID, sessionID)
    }

    const rootMainID = this.hierarchyIndex?.getRootMain(sessionID) ?? effectiveParentID
    return { parentID: effectiveParentID, rootMainID }
  }

  /**
   * Handles `session.compacted` — writes a compaction block to the session .md file (D-10).
   *
   * Records the compaction timestamp and references session-continuity.json
   * for active delegations and pending work at time of compaction.
   */
  private async handleSessionCompacted(
    sessionID: string,
    event: Record<string, unknown> | undefined,
  ): Promise<void> {
    try {
      const now = new Date().toISOString()
      const compactContext = this.renderCompactionContext(event)
      const section =
        `## COMPACTED (${now})\n\n` +
        compactContext +
        `\n**Continuity index:** See \`session-continuity.json\` for active delegations and pending work at time of compaction.\n`

      const childRoute = await this.resolveChildLifecycleRoute(sessionID)
      if (childRoute) {
        await this.childWriter.appendJourneyEntry(childRoute.parentID, sessionID, {
          timestamp: now,
          type: "session_compacted",
          content: compactContext,
          metadata: { capturedFrom: "session.compacted" },
        })
        return
      }

      await this.sessionWriter.appendCompactionBlock(sessionID, section)
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: compaction capture failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Renders the compacted session payload without truncation.
   *
   * The OpenCode compact event shape can vary across SDK versions. This method
   * preserves prioritized summary-like fields as readable markdown and also
   * stores the full raw event JSON when available so no compact context is lost.
   *
   * @param event - Raw `session.compacted` event payload.
   * @returns Markdown content for the compaction section or child journey entry.
   */
  private renderCompactionContext(event: Record<string, unknown> | undefined): string {
    const summary = this.findCompactionText(event)
    const raw = this.stringifyEvent(event)

    if (summary && raw) {
      return `**compact_summary:**\n\n${summary}\n\n**raw_event:**\n\n\`\`\`json\n${raw}\n\`\`\`\n`
    }
    if (summary) {
      return `**compact_summary:**\n\n${summary}\n`
    }
    if (raw) {
      return `**raw_event:**\n\n\`\`\`json\n${raw}\n\`\`\`\n`
    }
    return "**Pre-compaction state preserved.** Compact event carried no textual payload.\n"
  }

  /**
   * Finds the most likely compact summary string in a version-tolerant payload.
   *
   * @param value - Raw event value to scan.
   * @returns The first non-empty summary-like string without trimming content.
   */
  private findCompactionText(value: unknown): string | undefined {
    if (typeof value === "string") return value.trim().length > 0 ? value : undefined
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

    const record = value as Record<string, unknown>
    const preferredKeys = ["summary", "compactSummary", "compactionSummary", "content", "context", "message", "text"]
    for (const key of preferredKeys) {
      const candidate = record[key]
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate
    }
    for (const key of preferredKeys) {
      const nested = this.findCompactionText(record[key])
      if (nested) return nested
    }
    return undefined
  }

  /**
   * Serializes an event payload for lossless audit context when possible.
   *
   * @param event - Raw event payload.
   * @returns Pretty JSON, or undefined when no serializable payload exists.
   */
  private stringifyEvent(event: Record<string, unknown> | undefined): string | undefined {
    if (!event || Object.keys(event).length === 0) return undefined
    try {
      return JSON.stringify(event, null, 2)
    } catch {
      return undefined
    }
  }

  /**
   * Records a journey entry for either a main or child session.
   *
   * Routes to `childWriter.appendJourneyEntry` for child sessions (non-null
   * parentID) or `sessionWriter.appendJourneyEntry` for main sessions.
   *
   * Best-effort: errors are logged but never thrown.
   *
   * @param sessionID - The session identifier.
   * @param entry - The journey entry to record.
   * @returns Promise that resolves when the entry is recorded.
   */
  async recordJourneyEntry(
    sessionID: string,
    entry: JourneyEntry,
  ): Promise<void> {
    try {
      if (!isValidSessionID(sessionID)) return

      let parentID: string | null | undefined
      try {
        const session = await getSession(this.client, sessionID)
        parentID = session.parentID as string | null | undefined
      } catch {
        // SDK call failed — fall back to main session routing
        parentID = null
      }

      if (parentID) {
        // Child session — append to .json journey array
        await this.childWriter.appendJourneyEntry(parentID, sessionID, entry)
      } else {
        // Main session — append to .md file
        await this.sessionWriter.appendJourneyEntry(sessionID, entry)
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: journey recording failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}

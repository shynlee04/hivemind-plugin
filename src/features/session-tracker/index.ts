/**
 * Session Tracker feature module.
 *
 * Owns session knowledge capture under `.hivemind/session-tracker/`.
 * Hooks observe OpenCode lifecycle events and route to this module;
 * the module owns persistence logic and error handling.
 *
 * Architecture: Read-side observer (hooks) → SessionTracker → persistence layer.
 * CQRS compliance: hooks must NEVER write files directly (REQ-ST-11).
 *
 * @module session-tracker
 */

// Barrel re-exports — types
export type {
  SessionTrackerConfig,
  SessionRecord,
  ChildSessionRecord,
  SessionContinuityIndex,
  ProjectContinuityIndex,
  ProjectSessionEntry,
  DelegatedBy,
  MainAgent,
  Turn,
  ToolRecord,
  ChildRef,
  ChildHierarchyEntry,
} from "./types.js"

export { isValidSessionID, isValidHookPayload } from "./types.js"
export { SessionRecovery } from "./recovery/session-recovery.js"
export type { ReconsumptionResult, SessionContext } from "./recovery/session-recovery.js"

// ---------------------------------------------------------------------------
// SessionTracker class
// ---------------------------------------------------------------------------

// NOTE: OpenCodeClient type is imported from shared/session-api.
// We use a lightweight import to avoid circular dependencies.
import type { OpenCodeClient } from "../../shared/session-api.js"
import { getSession } from "../../shared/session-api.js"
import { EventCapture } from "./capture/event-capture.js"
import { MessageCapture } from "./capture/message-capture.js"
import { ToolCapture } from "./capture/tool-capture.js"
import { SessionWriter } from "./persistence/session-writer.js"
import { ChildWriter } from "./persistence/child-writer.js"
import { SessionIndexWriter } from "./persistence/session-index-writer.js"
import { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import { AgentTransform } from "./transform/agent-transform.js"
import { SessionRecovery } from "./recovery/session-recovery.js"
import { readFile } from "node:fs/promises"
import { isValidSessionID } from "./types.js"
import { safeSessionPath } from "./persistence/atomic-write.js"

/**
 * Central session tracker class.
 *
 * Instantiated in plugin.ts with dependency injection:
 * ```typescript
 * const tracker = new SessionTracker({ client, projectRoot })
 * ```
 *
 * Hook callbacks call the public handler methods:
 * - `handleSessionEvent()` — session.created, session.idle, session.deleted, session.error
 * - `handleChatMessage()` — user/assistant message capture
 * - `handleToolExecuteAfter()` — tool metadata capture (skill, read, task, etc.)
 *
 * All handler methods are best-effort: they catch errors internally and
 * never throw to the OpenCode runtime.
 */
export class SessionTracker {
  private client: OpenCodeClient
  private projectRoot: string

  // Capture handlers — initialized in initialize()
  private eventCapture!: EventCapture
  private messageCapture!: MessageCapture
  private toolCapture!: ToolCapture

  // Persistence writers
  private sessionWriter!: SessionWriter
  private childWriter!: ChildWriter
  private sessionIndexWriter!: SessionIndexWriter
  private projectIndexWriter!: ProjectIndexWriter

  // Recovery
  private recovery!: SessionRecovery

  // Transform
  private agentTransform!: AgentTransform

  /**
   * Tracks sessions that have been lazy-bootstrapped (dir + .md file created).
   * Avoids redundant work on subsequent events for the same session.
   */
  private bootstrappedSessions: Set<string> = new Set()

  /**
   * Creates a new SessionTracker instance.
   *
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for session queries.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
  }

  /**
   * Lazy-bootstraps a session that was created before the harness loaded.
   *
   * When the plugin loads into an already-running session, `session.created`
   * has already fired without us. This method creates the session directory,
   * initializes the `.md` file, and registers the session in the project index
   * on the first observed event (chat message or tool execution).
   *
   * Idempotent — skips if the session has already been bootstrapped.
   *
   * @param sessionID - The session identifier to bootstrap.
   * @returns Promise that resolves when bootstrap is complete.
   */
  private async ensureSessionReady(sessionID: string): Promise<void> {
    // Guard: if initialize() hasn't completed yet, skip (best-effort)
    if (!this.sessionWriter || !this.projectIndexWriter) return
    if (this.bootstrappedSessions.has(sessionID)) return
    if (!isValidSessionID(sessionID)) return

    // F-01: Query SDK to check if this is a child session.
    // Child sessions must NOT get their own directory or project index entry —
    // they belong under their parent's directory (REQ-ST-01).
    try {
      const session = await getSession(this.client, sessionID)
      const parentID = (session as { parentID?: string } | undefined)?.parentID
      if (parentID) {
        // This is a child session — skip directory creation and index registration.
        // Mark as bootstrapped so we don't re-check every event.
        this.bootstrappedSessions.add(sessionID)
        return
      }
    } catch {
      // SDK call failed — cannot determine parentID. Treat conservatively
      // as a main session (create directory rather than risk data loss).
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: cannot determine parentID for "${sessionID}" — treating as main session (conservative fallback)`,
        },
      })
    }

    this.bootstrappedSessions.add(sessionID)

    try {
      await this.sessionWriter.createSessionDir(sessionID)
      await this.sessionWriter.initializeSessionFile(sessionID, {
        sessionID,
        parentSessionID: null,
        delegationDepth: 0,
        status: "active",
      })
      await this.projectIndexWriter.addSession(
        sessionID,
        `${sessionID}/`,
        `${sessionID}.md`,
      )
    } catch (err) {
      // If any step fails, remove from bootstrapped set so retry is possible
      this.bootstrappedSessions.delete(sessionID)
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: lazy bootstrap failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles session lifecycle events from the OpenCode `event` hook.
   *
   * @param event - The raw hook input containing eventType, sessionID, and event payload.
   * @returns Promise that resolves when the event has been processed.
   *
   * @remarks
   * Event types handled:
   * - `session.created` — creates subdirectory + .md file for root sessions
   * - `session.idle` — updates session status to "idle"
   * - `session.deleted` — marks session status as "deleted"
   * - `session.error` — marks session status as "error"
   */
  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    try {
      // F-02: session.created directory creation is now owned exclusively by
      // eventCapture.handleSessionCreated (which checks parentID before creating dirs).
      // ensureSessionReady is no longer called here — it runs only in the lazy-bootstrap
      // paths (handleChatMessage, handleToolExecuteAfter) for cold-start sessions.
      if (this.eventCapture) {
        await this.eventCapture.handleSessionEvent(event)
      }

      // Fork handling: when a new main session is created from a checkpoint,
      // reference-copy child delegation records from the parent session.
      // This ensures the forked session shares the same child .json files
      // without duplicating data (reference-copy, not deep-copy — IN-02).
      if (
        event.eventType === "session.created" &&
        this.projectIndexWriter &&
        this.sessionIndexWriter
      ) {
        try {
          const session = await this.getSessionSafely(event.sessionID)
          const parentID =
            session && typeof session === "object" && "parentID" in session
              ? (session as { parentID?: string }).parentID
              : undefined
          if (parentID) {
            await this.copyForkedChildren(event.sessionID, parentID)
          }
        } catch {
          // Parent index may not exist — that's fine, fork proceeds without children
        }
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
   * Reference-copies child delegation records from a parent session to
   * a newly-forked session. Both sessions share the same child .json files
   * (reference-copy, not deep-copy) to prevent split-brain data divergence
   * (IN-02, T-12-11).
   *
   * @param newSessionID - The newly created forked session ID.
   * @param parentID - The parent session ID to inherit children from.
   */
  private async copyForkedChildren(
    newSessionID: string,
    parentID: string,
  ): Promise<void> {
    if (!isValidSessionID(parentID)) return

    const parentIndexPath = safeSessionPath(
      this.projectRoot,
      parentID,
      "session-continuity.json",
    )

    let parentIndex: Record<string, unknown> | null = null
    try {
      const raw = await readFile(parentIndexPath, "utf-8")
      parentIndex = JSON.parse(raw) as Record<string, unknown>
    } catch {
      // Parent index doesn't exist or is unreadable — nothing to copy
      return
    }

    const hierarchy = parentIndex?.hierarchy as
      | { children?: Record<string, { file?: string; depth?: number; delegatedBy?: string }> }
      | undefined
    const parentChildren = hierarchy?.children
    if (!parentChildren || Object.keys(parentChildren).length === 0) {
      return
    }

    // Reference-copy children into the new session's index
    for (const [childId, childEntry] of Object.entries(parentChildren)) {
      try {
        await this.sessionIndexWriter.addChild(
          newSessionID,
          childId,
          childEntry.file || `${childId}.json`,
          childEntry.depth || 1,
          childEntry.delegatedBy || "forked",
        )
      } catch {
        // Best-effort per child — one failure shouldn't block others
      }
    }
  }

  /**
   * Safely retrieves a session via the SDK client without throwing.
   *
   * @param sessionID - The session identifier to look up.
   * @returns The session object, or `undefined` if not found.
   */
  private async getSessionSafely(
    sessionID: string,
  ): Promise<unknown> {
    if (!isValidSessionID(sessionID)) return undefined
    try {
      return await getSession(this.client, sessionID)
    } catch {
      return undefined
    }
  }

  /**
   * Handles chat message events from the OpenCode `chat.message` hook.
   *
   * @param input - The hook input containing sessionID, agent, model, messageID, variant.
   * @param output - The hook output containing the message and parts.
   * @returns Promise that resolves when the message has been captured.
   *
   * @remarks
   * User messages are captured as `## USER (turn N)` sections.
   * Assistant messages are transformed into `main_l0_agent` blocks
   * with name, model, and thinking_duration metadata.
   * Thinking blocks are filtered out.
   */
  async handleChatMessage(
    input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      messageID?: string
      variant?: string
    },
    output: { message: unknown; parts: unknown[] },
  ): Promise<void> {
    try {
      // Lazy bootstrap: ensure session directory + index exist (cold-start)
      await this.ensureSessionReady(input.sessionID)
      if (this.messageCapture) {
        await this.messageCapture.handleChatMessage(
          input as Parameters<MessageCapture["handleChatMessage"]>[0],
          output as Parameters<MessageCapture["handleChatMessage"]>[1],
        )
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: chat.message handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Handles tool execution events from the OpenCode `tool.execute.after` hook.
   *
   * @param input - The hook input containing tool name, sessionID, callID, and args.
   * @param output - The hook output containing title, output, and metadata.
   * @returns Promise that resolves when the tool invocation has been captured.
   *
   * @remarks
   * Per-tool pruning rules per SPEC.md Section 5.1:
   * - `skill` → input name + first header line of output only
   * - `read` → file path only; never capture file content (REQ-ST-05)
   * - `task` → description + subagent_type from input, task_id from output; triggers child .json creation
   * - other tools → input metadata only
   */
  async handleToolExecuteAfter(
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    try {
      // Lazy bootstrap: ensure session directory + index exist (cold-start)
      await this.ensureSessionReady(input.sessionID)
      if (this.toolCapture) {
        await this.toolCapture.handleToolExecuteAfter(
          input as Parameters<ToolCapture["handleToolExecuteAfter"]>[0],
          output as Parameters<ToolCapture["handleToolExecuteAfter"]>[1],
        )
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: tool.execute.after handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Initializes the session tracker module.
   *
   * Called once during plugin startup. Creates all persistence writers,
   * capture handlers, and recovery infrastructure. Reads
   * `project-continuity.json` to build an in-memory session map.
   *
   * @returns Promise that resolves when initialization is complete.
   */
  async initialize(): Promise<void> {
    try {
      // Create persistence writers
      this.sessionWriter = new SessionWriter({ projectRoot: this.projectRoot })
      this.childWriter = new ChildWriter({ projectRoot: this.projectRoot })
      this.sessionIndexWriter = new SessionIndexWriter({ projectRoot: this.projectRoot })
      this.projectIndexWriter = new ProjectIndexWriter({ client: this.client, projectRoot: this.projectRoot })

      // Create transform utility
      this.agentTransform = new AgentTransform()

      // Create capture handlers
      this.eventCapture = new EventCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
      })
      this.messageCapture = new MessageCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        agentTransform: this.agentTransform,
        projectRoot: this.projectRoot,
        sessionIndexWriter: this.sessionIndexWriter,
      })
      this.toolCapture = new ToolCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
      })

      // Initialize recovery (reads project-continuity.json per D-05)
      this.recovery = new SessionRecovery({
        client: this.client,
        projectRoot: this.projectRoot,
      })
      await this.recovery.initialize()

      // Initialize project-level index if needed
      await this.projectIndexWriter.initializeIndex()

      // Clean up orphaned .tmp.* files from interrupted writes
      await this.cleanupOrphanedTmpFiles()

      void this.client.tui?.showToast?.({
        body: {
          title: "Session Tracker",
          message: "Session tracker initialized",
          variant: "info",
        },
      })
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: initialization failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Performs cleanup when the plugin is shutting down or on module init.
   *
   * Removes contaminated `.json` and `.md` files from the legacy
   * `.hivemind/event-tracker/` directory (REQ-ST-13). Preserves the
   * source code at `src/task-management/journal/event-tracker/`.
   *
   * @returns Promise that resolves when cleanup is complete.
   */
  async cleanup(): Promise<void> {
    try {
      // Legacy cleanup: remove contaminated event-tracker state files (REQ-ST-13)
      await this.removeLegacyStateFiles()
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: cleanup failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Removes orphaned `*.tmp.*` files from the session-tracker root.
   *
   * These accumulate when writes are interrupted (process killed between
   * writeFile and rename in atomicWriteJson/atomicAppendMarkdown).
   * Safe to remove — they're atomic-write intermediates, never the
   * authoritative file.
   */
  private async cleanupOrphanedTmpFiles(): Promise<void> {
    try {
      const { readdir, unlink } = await import("node:fs/promises")
      const { resolve } = await import("node:path")
      const trackerRoot = resolve(this.projectRoot, ".hivemind", "session-tracker")

      const entries = await readdir(trackerRoot, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue
        if (entry.name.includes(".tmp.")) {
          const filePath = resolve(trackerRoot, entry.name)
          try {
            await unlink(filePath)
          } catch {
            // Best-effort: skip files that can't be removed
          }
        }
      }
    } catch {
      // Best-effort: directory may not exist or be inaccessible
    }
  }

  /**
   * Removes contaminated legacy state files from `.hivemind/event-tracker/`.
   *
   * Per REQ-ST-13: removes only `.json` and `.md` files, never `.gitkeep` or
   * the source code directory at `src/task-management/journal/event-tracker/`.
   */
  private async removeLegacyStateFiles(): Promise<void> {
    try {
      const { readdir, unlink } = await import("node:fs/promises")
      const { resolve } = await import("node:path")
      const legacyDir = resolve(this.projectRoot, ".hivemind", "event-tracker")

      try {
        const entries = await readdir(legacyDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isFile()) continue
          if (entry.name === ".gitkeep") continue
          if (entry.name.endsWith(".json") || entry.name.endsWith(".md")) {
            const filePath = resolve(legacyDir, entry.name)
            try {
              await unlink(filePath)
            } catch {
              // Best-effort: skip files that can't be removed
            }
          }
        }
      } catch {
        // Legacy directory may not exist — that's fine
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: legacy cleanup failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}

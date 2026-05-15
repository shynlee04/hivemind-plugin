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
import { HierarchyIndex } from "./persistence/hierarchy-index.js"
import { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"
import { HierarchyManifestWriter } from "./persistence/hierarchy-manifest.js"
import { AgentTransform } from "./transform/agent-transform.js"
import { SessionRecovery } from "./recovery/session-recovery.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { isValidSessionID } from "./types.js"
import { safeSessionPath, sessionTrackerRoot } from "./persistence/atomic-write.js"

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

  // Global hierarchy index (childID → parentID) for session classification
  // Consulted by ensureSessionReady and handleChatMessage as a SECOND gate
  // after SDK parentID. Built from disk at init, updated live by handleTask().
  private hierarchyIndex!: HierarchyIndex

  /**
   * In-memory registry for sessions that had task tool dispatch detected
   * at PreToolUse time but whose child session ID is not yet known.
   * Provides Gate 3 (fallback) classification. Never persisted to disk.
   */
  private pendingRegistry!: PendingDispatchRegistry

  // Hierarchy manifest writer (D-07)
  private manifestWriter!: HierarchyManifestWriter

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
    //
    // Retry logic: the SDK might not report parentID on the first call if the
    // child session was JUST created (race with the task tool completion).
    // Try twice with a short delay between attempts.
    let parentID: string | undefined
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const session = await getSession(this.client, sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
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

    if (parentID) {
      // This is a child session — skip directory creation and index registration.
      // Mark as bootstrapped so we don't re-check every event.
      this.bootstrappedSessions.add(sessionID)
      return
    }

    // F-01.1: Second gate — check the global hierarchy index.
    // If this session ID was registered as a child by a task delegation
    // (recorded in session-continuity.json hierarchy.children), treat it
    // as a child regardless of what the SDK reports.
    //
    // This fixes the orphan-directory bug: OpenCode child sessions often
    // fire events BEFORE the SDK records parentID, or the SDK never records
    // it at all. The hierarchy index (populated by handleTask() at task
    // delegation time) knows the truth.
    if (this.hierarchyIndex?.isChild(sessionID)) {
      this.bootstrappedSessions.add(sessionID)
      return
    }

    // Gate 3: Check pending dispatch registry.
    // If a parent session recently dispatched a task tool (detected at
    // PreToolUse time), the resulting child session is tracked here even
    // before the SDK reports parentID or the hierarchy index is populated.
    // This closes the race condition where session.created fires during
    // TaskTool.execute(), before tool.execute.after populates HierarchyIndex.
    if (this.pendingRegistry?.has(sessionID)) {
      this.bootstrappedSessions.add(sessionID)
      return
    }

    // All three gates failed (SDK parentID, hierarchyIndex, pendingRegistry).
    // This is a root main session — create directory (D-02).
    // Child sessions are NEVER allowed to reach this point.
    // This is the ONLY path that creates directories.

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
      // ── D-05: Classify FIRST before any I/O ──────────────────────────
      // Child sessions must NEVER get their own directory. Classification
      // must happen BEFORE ensureSessionReady (which may call mkdir).
      //
      // Gate 1: SDK parentID (fastest — avoids disk I/O).
      // Gate 2: Hierarchy index (fallback when SDK doesn't report parentID).
      // Gate 3: Pending dispatch registry (race condition guard).

      let parentID: string | undefined
      try {
        const session = await this.getSessionSafely(input.sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
      } catch {
        // SDK call failed — proceed to hierarchy index fallback
      }

      if (!parentID && this.hierarchyIndex) {
        const hierarchyParent = this.hierarchyIndex.getParent(input.sessionID)
        if (hierarchyParent) {
          parentID = hierarchyParent
        }
      }

      // Gate 3: Check pending dispatch registry (D-04 fix).
      // If a parent recently dispatched a task tool, and the registry
      // still has entries, the resulting session is a child even if
      // the exact parentID isn't resolved by Gates 1/2.
      if (!parentID && this.pendingRegistry?.has(input.sessionID)) {
        const pendingEntry = this.pendingRegistry.get(input.sessionID)
        if (pendingEntry) {
          parentID = pendingEntry.parentSessionID
        }
      }

      if (parentID && this.childWriter) {
        // STEP 2: CHILD session — skip ensureSessionReady entirely.
        // No directory creation — child .json only (D-03, D-05).
        this.bootstrappedSessions.add(input.sessionID)

        // Capture chat message to child .json under ROOT main (D-03)
        const messageRole = (output.message as Record<string, unknown> | null)?.role
        const parts = output.parts as Array<{ type: string; text?: string }>
        const content = parts
          .filter((p) => p.type === "text" && typeof p.text === "string")
          .map((p) => p.text!)
          .join("\n") || (typeof messageRole === "string" ? `[${messageRole} message]` : "unknown")
        await this.childWriter.appendChildTurn(
          parentID,
          input.sessionID,
          {
            turn: 0, // Computed from current turns count by appendChildTurn
            actor: input.agent || "unknown",
            content,
            tools: [],
          },
        )
        return // Child messages go to child .json only, not main .md
      }

      // STEP 3: MAIN session — now it's safe to create directory.
      await this.ensureSessionReady(input.sessionID)

      // STEP 4: Capture to main .md (existing messageCapture path)
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
      // Detect child session BEFORE lazy bootstrap to prevent orphan directories.
      // Same dual-gate pattern as handleChatMessage (SDK parentID + hierarchy index).
      let parentID: string | undefined
      try {
        const session = await this.getSessionSafely(input.sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
      } catch {
        // SDK call failed — proceed to hierarchy index fallback
      }

      if (!parentID && this.hierarchyIndex) {
        const hierarchyParent = this.hierarchyIndex.getParent(input.sessionID)
        if (hierarchyParent) {
          parentID = hierarchyParent
        }
      }

      if (parentID) {
        // Child session — skip directory creation entirely.
        // Mark as bootstrapped to prevent ensureSessionReady from creating a dir.
        this.bootstrappedSessions.add(input.sessionID)
        // Still capture the tool event in the child's .json if it's a non-task tool.
        // Task tool events for child sessions are the child dispatching its OWN
        // sub-tasks, which tool-capture handles normally.
        if (this.toolCapture) {
          await this.toolCapture.handleToolExecuteAfter(
            input as Parameters<ToolCapture["handleToolExecuteAfter"]>[0],
            output as Parameters<ToolCapture["handleToolExecuteAfter"]>[1],
          )
          // Clean up pending dispatch registry (AC-05: entry removed at PostToolUse)
          if (this.pendingRegistry && input.callID) {
            this.pendingRegistry.removeByCallID(input.callID)
          }
        }
        return
      }

      // Main session — lazy bootstrap + capture
      await this.ensureSessionReady(input.sessionID)
      if (this.toolCapture) {
        await this.toolCapture.handleToolExecuteAfter(
          input as Parameters<ToolCapture["handleToolExecuteAfter"]>[0],
          output as Parameters<ToolCapture["handleToolExecuteAfter"]>[1],
        )
        // Clean up pending dispatch registry (AC-05: entry removed at PostToolUse)
        if (this.pendingRegistry && input.callID) {
          this.pendingRegistry.removeByCallID(input.callID)
        }
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
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Called synchronously from the plugin.ts tool.execute.before hook.
   * Must NOT block tool execution — fire-and-forget polling only.
   *
   * Per D-02 (CONTEXT.md):
   * - Detects task tool dispatch (tool === "task")
   * - Stores pending entry in PendingDispatchRegistry
   * - Fire-and-forget polls client.session.children() for new child sessions
   * - On child discovery: registers in HierarchyIndex, removes from pending registry
   * - Resume detection: if task_id is present, skip registration (AC-10)
   *
   * @param params - Hook input parameters.
   * @param params.sessionID - The parent session ID (tool executor's session).
   * @param params.callID - The tool call identifier.
   * @param params.subagentType - The subagent_type from task tool args (e.g., "hm-l2-researcher").
   * @param params.description - The task description.
   * @param params.taskId - If present, this is a resume (existing session) — skip registration.
   */
  async handleToolExecuteBefore(params: {
    sessionID: string
    callID: string
    subagentType: string
    description: string
    taskId?: string
  }): Promise<void> {
    try {
      if (!isValidSessionID(params.sessionID)) return

      // Resume detection (AC-10): if task_id is present, this is a resume dispatch.
      // The child session already exists — no need to register a pending entry.
      if (params.taskId) {
        return
      }

      // Ensure pendingRegistry is initialized (may not be during plugin startup race)
      if (!this.pendingRegistry) return

      // Register pending dispatch entry for Gate 3 classification
      this.pendingRegistry.add({
        parentSessionID: params.sessionID,
        callID: params.callID,
        subagentType: params.subagentType || "unknown",
        timestamp: Date.now(),
      })

      // Fire-and-forget polling: discover child session via Server API.
      // The task tool creates the child during execution — poll to catch it
      // before session.created fires.
      // IMPORTANT: do NOT await here — would block tool execution.
      void this.pollForChildSessions(params.sessionID, params.callID)
    } catch (err) {
      // Best-effort: never throw to the OpenCode runtime
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: handleToolExecuteBefore failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Fire-and-forget polling loop to discover child sessions after task dispatch.
   *
   * Per SPEC §3.3: polls client.session.children() every 200ms for up to 5 attempts.
   * On discovery: registers child in HierarchyIndex and updates pending registry.
   * Never throws — all errors caught silently (best-effort).
   *
   * @param parentID - The parent session ID to check children for.
   * @param callID - The tool call ID for pending registry cleanup.
   */
  private async pollForChildSessions(
    parentID: string,
    callID: string,
  ): Promise<void> {
    const MAX_ATTEMPTS = 5
    const POLL_INTERVAL_MS = 200

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const client = this.client as OpenCodeClient & {
          session: {
            children(params: { path: { id: string } }): Promise<{
              data?: Array<{ id: string; parentID?: string }>
            }>
          }
        }
        const result = await client.session.children({ path: { id: parentID } })
        const entries = result.data ?? []

        // Filter for children: (a) not already in hierarchy index, (b) valid session IDs
        const newChildren = entries.filter(
          (c) => c.id && isValidSessionID(c.id) && !this.hierarchyIndex?.isChild(c.id),
        )

        if (newChildren.length > 0) {
          for (const child of newChildren) {
            // Register in hierarchy index (Gate 2 cache)
            if (child.id) {
              this.hierarchyIndex?.registerChild(parentID, child.id)
            }
            // Update pending registry with real child ID (Gate 3 cache)
            if (child.id) {
              this.pendingRegistry?.updateWithChildID(callID, child.id)
            }
          }
          // Success: children discovered, exit polling loop
          return
        }
      } catch {
        // Server API may not be ready — retry after interval
      }

      // Wait before next attempt (don't sleep on final attempt)
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    }

    // Max attempts exhausted without discovery — child may appear later via
    // tool.execute.after handleTask(). Pending registry entry serves as
    // Gate 3 fallback for up to 30s (STALE_THRESHOLD_MS).
    void this.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Harness] Session tracker: polling exhausted for parent "${parentID}" — relying on PostToolUse registration`,
      },
    })
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
      this.childWriter = new ChildWriter({ projectRoot: this.projectRoot, hierarchyIndex: this.hierarchyIndex })
      this.sessionIndexWriter = new SessionIndexWriter({ projectRoot: this.projectRoot })
      this.projectIndexWriter = new ProjectIndexWriter({ client: this.client, projectRoot: this.projectRoot })

      // Build the global hierarchy index from existing session-continuity.json files.
      // This ensures sessions created before this harness instance loaded are correctly
      // classified when their events arrive (cold-start scenario).
      this.hierarchyIndex = new HierarchyIndex({ projectRoot: this.projectRoot })
      await this.hierarchyIndex.buildFromDisk()

      // Create pending dispatch registry (Gate 3 classification fallback).
      // Populated at tool.execute.before time by handleToolExecuteBefore(),
      // consumed by ensureSessionReady() and handleSessionCreated().
      this.pendingRegistry = new PendingDispatchRegistry()

      // Create hierarchy manifest writer (D-07).
      // Writes hierarchy-manifest.json in each root main session directory.
      this.manifestWriter = new HierarchyManifestWriter({
        projectRoot: this.projectRoot,
      })

      // Create transform utility
      this.agentTransform = new AgentTransform()

      // Create capture handlers
      this.eventCapture = new EventCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
        manifestWriter: this.manifestWriter, // D-07
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
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
      })

      // Initialize recovery (reads project-continuity.json per D-05)
      this.recovery = new SessionRecovery({
        client: this.client,
        projectRoot: this.projectRoot,
      })
      await this.recovery.initialize()

      // Initialize project-level index if needed
      await this.projectIndexWriter.initializeIndex()

      // Seed turn counters from existing .md files (prevent reset-to-zero on restart)
      if (this.messageCapture) {
        try {
          const indexPath = resolve(sessionTrackerRoot(this.projectRoot), "project-continuity.json")
          try {
            const raw = await readFile(indexPath, "utf-8")
            const index = JSON.parse(raw) as { sessions?: Record<string, { dir?: string }>; chronologicalOrder?: string[] }
            const sessionIds = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
            for (const sessionID of sessionIds) {
              await this.messageCapture.seedTurnCounters(sessionID)
            }
          } catch {
            // Index may not exist yet — no sessions to seed
          }
        } catch {
          // Best-effort: if seeding fails, turn counters start fresh
        }
      }

      // Clean up orphaned .tmp.* files from interrupted writes
      await this.cleanupOrphanedTmpFiles()

      // Clean up orphan child session directories (CP-ST-02, D-06).
      // This fixes the live bug where L1 child sessions have their own
      // directories instead of existing only as .json files under the parent.
      await this.cleanupOrphanDirectories()

      // Ensure project-continuity.json contains ALL sessions (main + children).
      // Fills any gaps from before CP-ST-02 fix (AC-08).
      await this.ensureProjectContinuityCompleteness()

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
   * Legacy event-tracker cleanup removed in CP-ST-03; one-shot migration
   * in plugin.ts handles `.hivemind/event-tracker/` removal.
   *
   * @returns Promise that resolves when cleanup is complete.
   */
  async cleanup(): Promise<void> {
    try {
      // Legacy event-tracker cleanup removed (CP-ST-03); migration in plugin.ts
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
   * Removes orphan child session directories from `.hivemind/session-tracker/`.
   *
   * An orphan is a directory that contains session files but whose session ID
   * is registered as an L1/L2 child in another directory's session-continuity.json.
   * These directories were created by the race condition CP-ST-02 fixes.
   *
   * Only removes directories for sessions classified as children under a parent's
   * hierarchy index. Preserves child .json files that already exist under the parent.
   *
   * Best-effort: individual failures are silently skipped.
   */
  private async cleanupOrphanDirectories(): Promise<void> {
    const { readdir, rm } = await import("node:fs/promises")
    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, { withFileTypes: true })) as unknown as {
        name: string
        isDirectory(): boolean
      }[]
    } catch {
      // Root directory doesn't exist yet — nothing to clean
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const sessionID = entry.name

      // Skip non-session directories (e.g., .gitkeep-created dirs)
      if (!isValidSessionID(sessionID)) continue

      // Check if this session is a CHILD of any known parent.
      // If the hierarchy index classifies it as a child, the directory
      // is an orphan — the child should only exist as a .json file.
      if (this.hierarchyIndex?.isChild(sessionID)) {
        const { resolve } = await import("node:path")
        const dirPath = resolve(trackerRoot, sessionID)
        try {
          await rm(dirPath, { recursive: true, force: true })
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "info",
              message: `[Harness] Session tracker: removed orphan child directory "${sessionID}"`,
            },
          })
        } catch {
          // Best-effort: skip directories that can't be removed (permissions, etc.)
        }
      }
    }
  }

  /**
   * Ensures project-continuity.json contains ALL known sessions.
   *
   * Walks the session-tracker directory tree and checks that every session
   * (main .md files AND child .json files) is registered in the project index.
   * Missing entries are added. This fixes CP-ST-02's AC-08 requirement.
   *
   * Best-effort: individual failures are silently skipped.
   */
  private async ensureProjectContinuityCompleteness(): Promise<void> {
    if (!this.projectIndexWriter) return

    const { readdir } = await import("node:fs/promises")
    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, { withFileTypes: true })) as unknown as {
        name: string
        isDirectory(): boolean
        isFile(): boolean
      }[]
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const parentID = entry.name
      if (!isValidSessionID(parentID)) continue

      const { resolve } = await import("node:path")
      const parentDir = resolve(trackerRoot, parentID)

      // Register the main session if not already in the index
      try {
        await this.projectIndexWriter.addSession(
          parentID,
          `${parentID}/`,
          `${parentID}.md`,
        )
      } catch {
        // Already registered or can't register — skip
      }

      // Scan for child .json files under this directory
      let childEntries: { name: string; isFile(): boolean }[]
      try {
        childEntries = (await readdir(parentDir, { withFileTypes: true })) as unknown as {
          name: string
          isFile(): boolean
        }[]
      } catch {
        continue
      }

      for (const child of childEntries) {
        if (!child.isFile()) continue
        if (!child.name.endsWith(".json")) continue
        // Skip session-continuity.json (internal index file, not a child session)
        if (child.name === "session-continuity.json") continue

        // Extract child session ID from filename (e.g., "ses_abc123.json" → "ses_abc123")
        const childID = child.name.slice(0, -5) // remove ".json" suffix
        if (!isValidSessionID(childID)) continue

        // Register child session in project index
        try {
          await this.projectIndexWriter.addSession(
            childID,
            `${parentID}/`,
            `${childID}.json`,
          )
        } catch {
          // Already registered or can't register — skip
        }
      }
    }
  }
}

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
import { EventCapture } from "./capture/event-capture.js"
import { MessageCapture } from "./capture/message-capture.js"
import { ToolCapture } from "./capture/tool-capture.js"
import { ChildWriter } from "./persistence/child-writer.js"
import { SessionIndexWriter } from "./persistence/session-index-writer.js"
import { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import { HierarchyIndex } from "./persistence/hierarchy-index.js"
import { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"
import { HierarchyManifestWriter } from "./persistence/hierarchy-manifest.js"
import { OrphanCleanup } from "./orphan-cleanup.js"
import { SessionRecovery } from "./recovery/session-recovery.js"
import { SessionBootstrap } from "./bootstrap.js"
import { SessionClassifier } from "./classification.js"
import { SessionRouter } from "./session-router.js"
import { ChildRecorder } from "./child-recorder.js"
import { constructDependencies, sessionTrackerRoot } from "./initialization.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { isValidSessionID } from "./types.js"
import type { ChildSessionRecord } from "./types.js"


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

  // Bootstrap (extracted from index.ts — CP-ST-05-03)
  private bootstrap!: SessionBootstrap

  // Classification (extracted from index.ts — CP-ST-05-03)
  private classifier!: SessionClassifier
  /** Session router — classify-before-I/O routing (CP-ST-06-02). */
  private sessionRouter!: SessionRouter
  /** Child recorder — child delegation message capture (CP-ST-06-02). */
  private childRecorder!: ChildRecorder

  // Orphan cleanup (extracted from index.ts — CP-ST-05-03)
  private orphanCleanup!: OrphanCleanup

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
    await this.bootstrap.ensureSessionReady(sessionID, this.bootstrappedSessions)
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
    await this.bootstrap.copyForkedChildren(newSessionID, parentID)
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
    return this.bootstrap.getSessionSafely(sessionID)
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
      // Three-gate fallback: SDK parentID → hierarchy index → pending registry.
      const decision = await this.sessionRouter.route(input.sessionID)

      if (decision.route === "child" && this.childWriter) {
        // STEP 2: CHILD session — delegate to child recorder (D-03, D-05).
        await this.childRecorder.recordChildMessage(
          decision.parentID,
          input.sessionID,
          { sessionID: input.sessionID, agent: input.agent, model: input.model, messageID: input.messageID },
          { message: output.message, parts: output.parts },
        )
        return // Child messages go to child .json only, not main .md
      }

      // STEP 3: MAIN or unknownSub session — now it's safe to create directory.
      // RC-3: unknownSub is treated as child/default-sub in the router,
      // but if we reach here, it falls through to main session handling.
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
      // Same three-gate pattern as handleChatMessage.
      const classification = await this.classifier.classify(
        input.sessionID,
        (id) => this.getSessionSafely(id),
      )
      const parentID = classification.kind === "child" ? classification.parentID : undefined

      if (parentID && this.childWriter) {
        // Child session — skip directory creation entirely.
        // Mark as bootstrapped to prevent ensureSessionReady from creating a dir.
        this.bootstrappedSessions.add(input.sessionID)
        await this.recordChildToolJourney(parentID, input, output)
        if (input.tool === "task") {
          await this.recordChildTaskDelegation(parentID, input, output)
        }
        // Clean up pending dispatch registry (AC-05: entry removed at PostToolUse)
        if (this.pendingRegistry && input.callID) {
          this.pendingRegistry.removeByCallID(input.callID)
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
   * Records a child-session tool event to the child `.json` journey array.
   *
   * Child sessions must never be routed through {@link ToolCapture} for normal
   * tool metadata capture because ToolCapture writes main-session `.md` blocks
   * via SessionWriter. This method preserves equivalent pruned metadata in the
   * child JSON file without creating a child subdirectory.
   *
   * @param parentID - Immediate parent session ID for the child session.
   * @param input - Tool execution hook input.
   * @param output - Tool execution hook output.
   */
  private async recordChildToolJourney(
    parentID: string,
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    await this.ensureChildRoute(parentID, input.sessionID)
    await this.childWriter.appendJourneyEntry(parentID, input.sessionID, {
      timestamp: new Date().toISOString(),
      type: "tool_call",
      content: `Tool: ${input.tool}`,
      metadata: {
        tool: input.tool,
        callID: input.callID,
        input: this.pruneToolInput(input.tool, input.args),
        output: this.pruneToolOutput(input.tool, output.output, output.metadata),
      },
    })
  }

  /**
   * Ensures a child write can resolve to the root main directory.
   *
   * SDK-based classification can discover an L2 child before the local
   * hierarchy index has seen its L1 parent. Hydrating ancestors first prevents
   * child writes from falling back to the immediate L1 directory.
   *
   * @param parentID - Immediate parent session ID.
   * @param childID - Child session ID being written.
   */
  private async ensureChildRoute(parentID: string, childID: string): Promise<void> {
    await this.ensureAncestorRoute(parentID, new Set<string>())
    if (!this.hierarchyIndex.isChild(childID)) {
      this.hierarchyIndex.registerChild(parentID, childID)
    }
  }

  /**
   * Recursively registers a parent session's own parent chain from SDK data.
   *
   * @param sessionID - Session whose ancestors should be registered.
   * @param seen - Cycle guard for defensive SDK data handling.
   */
  private async ensureAncestorRoute(sessionID: string, seen: Set<string>): Promise<void> {
    if (seen.has(sessionID)) return
    seen.add(sessionID)
    const session = await this.getSessionSafely(sessionID)
    const parentID =
      session && typeof session === "object" && "parentID" in session
        ? (session as { parentID?: string }).parentID
        : undefined
    if (!parentID) return
    await this.ensureAncestorRoute(parentID, seen)
    if (!this.hierarchyIndex.isChild(sessionID)) {
      this.hierarchyIndex.registerChild(parentID, sessionID)
    }
  }

  /**
   * Records a child-session task delegation as an L2 child JSON record.
   *
   * @param parentID - Immediate parent session ID for the L1 session.
   * @param input - Task tool execution hook input from the child session.
   * @param output - Task tool execution hook output containing `task_id`.
   */
  private async recordChildTaskDelegation(
    parentID: string,
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    const childSessionID = this.extractTaskID(output.output)
    if (!childSessionID) return

    const args = this.asRecord(input.args)
    const description = typeof args.description === "string" ? args.description : ""
    const subagentType = typeof args.subagent_type === "string" ? args.subagent_type : "unknown"

    if (!this.hierarchyIndex.isChild(input.sessionID)) {
      this.hierarchyIndex.registerChild(parentID, input.sessionID)
    }
    const rootMain = this.hierarchyIndex.getRootMain(input.sessionID) ?? parentID
    this.hierarchyIndex.registerChild(input.sessionID, childSessionID)
    const depth = this.hierarchyIndex.getDepth(childSessionID)
    const now = new Date().toISOString()
    const childMetadata: ChildSessionRecord = {
      sessionID: childSessionID,
      parentSessionID: input.sessionID,
      delegationDepth: depth,
      delegatedBy: {
        agentName: subagentType,
        model: "unknown",
        tool: "task",
        description,
        subagentType,
      },
      created: now,
      updated: now,
      status: "active",
      mainAgent: {
        name: subagentType,
        model: "unknown",
      },
      turns: [],
      children: [],
      journey: [],
    }

    await this.childWriter.createChildFile(input.sessionID, childSessionID, childMetadata)
    await this.childWriter.appendChildTurn(input.sessionID, childSessionID, {
      turn: 0,
      actor: subagentType,
      content: description || "Task delegation initiated",
      tools: [],
    })
    await this.sessionIndexWriter.addChild(
      rootMain,
      childSessionID,
      `${childSessionID}.json`,
      depth,
      subagentType,
    )
    await this.projectIndexWriter.incrementChildCount(rootMain, depth)
    await this.projectIndexWriter.addSession(
      childSessionID,
      `${rootMain}/`,
      `${childSessionID}.json`,
    )
    await this.manifestWriter.addChild({
      rootMainSessionID: rootMain,
      childSessionID,
      parentSessionID: input.sessionID,
      delegationDepth: depth,
      delegatedBy: subagentType,
      subagentType,
      childFile: `${childSessionID}.json`,
    })
  }

  /**
   * Returns safe, pruned tool input metadata for child-session JSON journeys.
   *
   * @param tool - Tool name.
   * @param args - Raw tool args.
   * @returns Pruned metadata matching the main-session markdown capture policy.
   */
  private pruneToolInput(tool: string, args: unknown): Record<string, unknown> {
    const record = this.asRecord(args)
    if (tool === "read") {
      return { filePath: record.filePath }
    }
    if (tool === "skill") {
      return { name: record.name }
    }
    if (tool === "task") {
      return {
        description: record.description,
        subagent_type: record.subagent_type,
        task_id: this.extractTaskID(record.task_id),
      }
    }
    return { callID: record.callID }
  }

  /**
   * Returns safe, pruned output metadata for child-session JSON journeys.
   *
   * @param tool - Tool name.
   * @param output - Raw tool output.
   * @param metadata - Raw tool metadata.
   * @returns Pruned output metadata.
   */
  private pruneToolOutput(
    tool: string,
    output: unknown,
    metadata: unknown,
  ): Record<string, unknown> {
    const meta = this.asRecord(metadata)
    const result: Record<string, unknown> = {}
    if (tool === "task") {
      result.task_id = this.extractTaskID(output)
    }
    if (meta.status === "error" || meta.error !== undefined) {
      result.status = "error"
    }
    return result
  }

  /**
   * Extracts a task session ID from task tool output or direct values.
   *
   * @param value - Raw output or task ID value.
   * @returns Extracted session ID, or undefined.
   */
  private extractTaskID(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined
    const direct = value.match(/\bses_[A-Za-z0-9_-]+\b/)
    return direct?.[0]
  }

  /**
   * Safely narrows an unknown value to a record.
   *
   * @param value - Unknown value to inspect.
   * @returns The value as a record, or an empty object.
   */
  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    return {}
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
          (c) => c.id && isValidSessionID(c.id) && !this.classifier.isChildRegistered(c.id),
        )

        if (newChildren.length > 0) {
          for (const child of newChildren) {
            // Register in hierarchy index (Gate 2 cache)
            if (child.id) {
              this.classifier.registerChild(parentID, child.id)
            }
            // Update pending registry with real child ID (Gate 3 cache)
            if (child.id) {
              this.classifier.updatePendingWithChildID(callID, child.id)
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
      // Construct all dependencies via initialization module (CP-ST-06-02)
      await this.hierarchyIndex?.buildFromDisk?.()
      const deps = constructDependencies(
        this.client,
        this.projectRoot,
        {
          getSessionSafely: (id) => this.getSessionSafely(id),
          ensureChildRoute: (parentID, childSessionID) => this.ensureChildRoute(parentID, childSessionID),
          bootstrappedSessions: this.bootstrappedSessions,
        },
      )
      // Build hierarchy index from disk (shared authority)
      await deps.hierarchyIndex.buildFromDisk()

      // Assign all constructed dependencies to instance fields
      Object.assign(this, deps)

      // Initialize recovery (reads project-continuity.json per D-05)
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
      // TODO: implement cleanup — legacy event-tracker cleanup removed (CP-ST-03);
      // one-shot migration in plugin.ts handles `.hivemind/event-tracker/` removal.
      // Future: add orphan quarantine cleanup, stale session removal, etc.
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
   * Delegated to OrphanCleanup module (CP-ST-05-03).
   */
  private async cleanupOrphanedTmpFiles(): Promise<void> {
    await this.orphanCleanup.cleanupOrphanedTmpFiles()
  }

  /**
   * Removes orphan child session directories from `.hivemind/session-tracker/`.
   *
   * Delegated to OrphanCleanup module which uses quarantine protocol
   * instead of direct deletion (CP-ST-05-03).
   */
  private async cleanupOrphanDirectories(): Promise<void> {
    await this.orphanCleanup.cleanupOrphanDirectories()
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

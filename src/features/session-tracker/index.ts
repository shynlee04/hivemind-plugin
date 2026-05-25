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

import type { OpenCodeClient } from "../../shared/session-api.js"
import { MessageCapture } from "./capture/message-capture.js"
import { constructDependencies, sessionTrackerRoot } from "./initialization.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { ToolDelegation } from "./tool-delegation.js"
import { ProjectContinuityChecker } from "./project-continuity.js"
import { FLUSH_INTERVAL_MS } from "./persistence/retry-queue.js"

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
 * - `handleToolExecuteBefore()` — proactive child session discovery
 *
 * All handler methods are best-effort: they catch errors internally and
 * never throw to the OpenCode runtime.
 */
export class SessionTracker {
  private client: OpenCodeClient
  private projectRoot: string

  // Capture handlers — initialized in initialize()
  private eventCapture!: Parameters<typeof constructDependencies>[0]["eventCapture"]
  private lastMessageCapture!: Parameters<typeof constructDependencies>[0]["lastMessageCapture"]
  private messageCapture!: MessageCapture
  private toolCapture!: Parameters<typeof constructDependencies>[0]["toolCapture"]
  // Persistence writers
  private childWriter!: Parameters<typeof constructDependencies>[0]["childWriter"]
  private sessionIndexWriter!: Parameters<typeof constructDependencies>[0]["sessionIndexWriter"]
  private projectIndexWriter!: Parameters<typeof constructDependencies>[0]["projectIndexWriter"]
  private hierarchyIndex!: Parameters<typeof constructDependencies>[0]["hierarchyIndex"]
  private pendingRegistry!: Parameters<typeof constructDependencies>[0]["pendingRegistry"]
  private manifestWriter!: Parameters<typeof constructDependencies>[0]["manifestWriter"]
  private recovery!: Parameters<typeof constructDependencies>[0]["recovery"]
  private retryQueue!: Parameters<typeof constructDependencies>[0]["retryQueue"]
  private bootstrap!: Parameters<typeof constructDependencies>[0]["bootstrap"]
  private classifier!: Parameters<typeof constructDependencies>[0]["classifier"]
  /** Session router — classify-before-I/O routing (CP-ST-06-02). */
  private sessionRouter!: Parameters<typeof constructDependencies>[0]["sessionRouter"]
  /** Child recorder — child delegation message capture (CP-ST-06-02). */
  private childRecorder!: Parameters<typeof constructDependencies>[0]["childRecorder"]
  private orphanCleanup!: Parameters<typeof constructDependencies>[0]["orphanCleanup"]
  /** Tool delegation handler (CP-ST-06-02). */
  private toolDelegation!: ToolDelegation
  /** Project continuity checker (CP-ST-06-02). */
  private projectContinuityChecker!: ProjectContinuityChecker
  /** Tracks lazy-bootstrapped sessions to avoid redundant mkdir + .md creation. */
  private bootstrappedSessions: Set<string> = new Set()
  private retryFlushInterval: ReturnType<typeof setInterval> | undefined

  /**
   * @param deps - Injected dependencies (client, projectRoot).
   */
  constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
  }

  /**
   * Returns the LastMessageCapture instance for event observer wiring.
   *
   * Used by plugin.ts to register {@link LastMessageCapture.handleEvent}
   * in the event observer pipeline for `message.updated` /
   * `message.part.updated` events.
   */
  getLastMessageCapture(): Parameters<typeof constructDependencies>[0]["lastMessageCapture"] {
    return this.lastMessageCapture
  }

  /** Lazy-bootstrap a pre-existing session (idempotent). */
  private async ensureSessionReady(sessionID: string): Promise<void> {
    await this.bootstrap.ensureSessionReady(sessionID, this.bootstrappedSessions)
  }

  /**
   * Checks whether a main-session markdown file already exists.
   *
   * Unknown sub-sessions must never create a new main directory. Existing main
   * sessions, however, may continue receiving message/tool captures after the
   * router reports `unknownSub` because SDK parent metadata can be absent.
   *
   * @param sessionID - Session ID to check.
   * @returns `true` when the main session `.md` file exists on disk.
   */
  private async hasMainSessionFile(sessionID: string): Promise<boolean> {
    try {
      const filePath = resolve(sessionTrackerRoot(this.projectRoot), sessionID, `${sessionID}.md`)
      await readFile(filePath, "utf-8")
      return true
    } catch {
      return false
    }
  }

  /**
   * Handles session lifecycle events from the OpenCode `event` hook.
   *
   * @param event - The raw hook input containing eventType, sessionID, and event payload.
   * @returns Promise that resolves when the event has been processed.
   */
  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    try {
      if (this.eventCapture) {
        await this.eventCapture.handleSessionEvent(event)
      } else {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session tracker: handleSessionEvent skipped — ` +
              `eventCapture not initialized (sessionID: ${event.sessionID}, eventType: ${event.eventType})`,
          },
        })
      }

      // Fork handling: reference-copy child delegation records from parent session.
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
          if (parentID && !this.hierarchyIndex?.isChild(event.sessionID)) {
            await this.copyForkedChildren(event.sessionID, parentID)
          }
        } catch (err) {
          // Parent index may not exist — fork proceeds without children,
          // but the error must be logged for observability (GA-1).
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: "[Harness] Session tracker: fork child-copy failed, proceeding without children",
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
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
   * a newly-forked session (IN-02, T-12-11).
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
  private async getSessionSafely(sessionID: string): Promise<unknown> {
    return this.bootstrap.getSessionSafely(sessionID)
  }

  /**
   * Handles chat message events from the OpenCode `chat.message` hook.
   *
   * @param input - The hook input containing sessionID, agent, model, messageID, variant.
   * @param output - The hook output containing the message and parts.
   * @returns Promise that resolves when the message has been captured.
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
      // D-05: Classify FIRST before any I/O
      const decision = await this.sessionRouter.route(input.sessionID)

      if (decision.route === "child" && this.childWriter) {
        await this.childRecorder.recordChildMessage(
          decision.parentID,
          input.sessionID,
          { sessionID: input.sessionID, agent: input.agent, model: input.model, messageID: input.messageID },
          { message: output.message, parts: output.parts },
        )
        return
      }

      if (decision.route === "unknownSub") {
        if (!(await this.hasMainSessionFile(input.sessionID))) {
          return
        }
      } else {
        await this.ensureSessionReady(input.sessionID)
      }

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
   */
  async handleToolExecuteAfter(
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    try {
      const classification = await this.classifier.classify(
        input.sessionID,
        (id: string) => this.getSessionSafely(id),
      )
      const parentID = classification.kind === "child" ? classification.parentID : undefined

      if (parentID && this.childWriter) {
        this.bootstrappedSessions.add(input.sessionID)
        await this.toolDelegation.recordChildToolJourney(
          parentID, input, output, this.ensureChildRoute.bind(this),
        )
        if (input.tool === "task" || input.tool === "delegate-task") {
          await this.toolDelegation.recordChildTaskDelegation(
            parentID, input, output, this.ensureChildRoute.bind(this),
          )
        }
        if (this.pendingRegistry && input.callID) {
          this.pendingRegistry.refreshTimestamp(input.callID)
        }
        return
      }

      if (classification.kind === "unknownSub") {
        const hasMainFile = await this.hasMainSessionFile(input.sessionID)
        if (!hasMainFile && input.tool === "task" && await this.isSdkRootSession(input.sessionID)) {
          await this.ensureSessionReady(input.sessionID)
        } else if (!hasMainFile) {
          return
        }
      } else {
        await this.ensureSessionReady(input.sessionID)
      }

      await this.messageCapture.backfillUserTurnsFromSdk(input.sessionID)

      if (this.toolCapture) {
        await this.toolCapture.handleToolExecuteAfter(
          input as Parameters<typeof this.toolCapture.handleToolExecuteAfter>[0],
          output as Parameters<typeof this.toolCapture.handleToolExecuteAfter>[1],
        )
        if (this.pendingRegistry && input.callID) {
          this.pendingRegistry.refreshTimestamp(input.callID)
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
   * Confirms a session is an SDK-visible root before allowing lazy task bootstrap.
   *
   * This preserves first-tool lazy bootstrap for real main sessions while still
   * blocking unresolved child/default-sub sessions from creating root dirs.
   *
   * @param sessionID - Session to check through the SDK wrapper.
   * @returns True only when the SDK returns a session with `parentID: null`.
   */
  private async isSdkRootSession(sessionID: string): Promise<boolean> {
    const session = await this.getSessionSafely(sessionID)
    return Boolean(
      session &&
      typeof session === "object" &&
      "parentID" in session &&
      (session as { parentID?: string | null }).parentID === null,
    )
  }

  /**
   * Recursively registers a parent session's own parent chain from SDK data.
   *
   * Includes MAX_DEPTH guard (F-13 / REQ-21-07) to prevent stack overflow
   * on corrupt SDK data or deep ancestor chains.
   *
   * @param sessionID - Session whose ancestors should be registered.
   * @param seen - Cycle guard for defensive SDK data handling.
   * @param depth - Current recursion depth (internal, pass 0 on first call).
   */
  private async ensureAncestorRoute(
    sessionID: string,
    seen: Set<string>,
    depth: number = 0,
  ): Promise<void> {
    const MAX_DEPTH = 20

    // F-13: Stack overflow guard — return gracefully with warning
    if (depth > MAX_DEPTH) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: ensureAncestorRoute exceeded MAX_DEPTH=${MAX_DEPTH} at "${sessionID}" — truncating to prevent stack overflow`,
        },
      })
      return
    }

    if (seen.has(sessionID)) return
    seen.add(sessionID)

    const session = await this.getSessionSafely(sessionID)
    const parentID =
      session && typeof session === "object" && "parentID" in session
        ? (session as { parentID?: string }).parentID
        : undefined
    if (!parentID) return

    await this.ensureAncestorRoute(parentID, seen, depth + 1)
    if (!this.hierarchyIndex.isChild(sessionID)) {
      this.hierarchyIndex.registerChild(parentID, sessionID)
    }
  }

  /**
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Called from the plugin.ts tool.execute.before hook.
   * Must NOT block tool execution — fire-and-forget polling only.
   *
   * @param params - Hook input parameters.
   * @param params.sessionID - The parent session ID.
   * @param params.callID - The tool call identifier.
   * @param params.subagentType - The subagent_type from task tool args.
   * @param params.description - The task description.
   * @param params.taskId - If present, this is a resume dispatch — skip registration.
   */
  async handleToolExecuteBefore(params: {
    sessionID: string
    callID: string
    subagentType: string
    description: string
    taskId?: string
    tool?: string
  }): Promise<void> {
    try {
      await this.toolDelegation.handleToolExecuteBefore(params)
    } catch (err) {
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
   * Synchronously constructs all session-tracker dependencies.
   *
   * Must be called BEFORE delegation wiring so that `onChildSessionCreated`
   * callbacks immediately find `eventCapture`, `pendingRegistry`, and other
   * critical deps available — eliminating the race window where async
   * `initialize()` would otherwise leave them `undefined` (D-01, REQ-01).
   *
   * Safe to call multiple times: does NOT perform I/O, does NOT start
   * intervals, does NOT reset existing deps. Call once during plugin init.
   */
  constructCoreDependencies(): void {
    const deps = constructDependencies(
      this.client,
      this.projectRoot,
      {
        getSessionSafely: (id) => this.getSessionSafely(id),
        ensureChildRoute: (parentID, childSessionID) => this.ensureChildRoute(parentID, childSessionID),
        bootstrappedSessions: this.bootstrappedSessions,
      },
    )
    Object.assign(this, deps)
  }

  /**
   * Initializes the session tracker module.
   *
   * Called once during plugin startup. Creates all persistence writers,
   * capture handlers, and recovery infrastructure.
   *
   * @returns Promise that resolves when initialization is complete.
   */
  async initialize(): Promise<void> {
    try {
      if (!this.hierarchyIndex) {
        this.constructCoreDependencies()
      }
      await this.hierarchyIndex.buildFromDisk()
      await this.retryQueue.flush()
      this.startRetryFlushLoop()

      // Construct tool delegation handler and project continuity checker (CP-ST-06-02)
      this.toolDelegation = new ToolDelegation({
        client: this.client,
        classifier: this.classifier,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
        manifestWriter: this.manifestWriter,
      })
      this.projectContinuityChecker = new ProjectContinuityChecker({
        projectIndexWriter: this.projectIndexWriter,
        projectRoot: this.projectRoot,
      })

      await this.recovery.initialize()
      await this.projectIndexWriter.initializeIndex()

      // Seed turn counters from existing .md files
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

      await this.cleanupOrphanedTmpFiles()
      await this.cleanupOrphanDirectories()
      await this.projectContinuityChecker.ensureCompleteness()

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
   * Performs cleanup when the plugin is shutting down.
   *
   * @returns Promise that resolves when cleanup is complete.
   */
  async cleanup(): Promise<void> {
    try {
      if (this.retryFlushInterval) {
        clearInterval(this.retryFlushInterval)
        this.retryFlushInterval = undefined
      }
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

  /** Starts the periodic child-write retry flush loop. */
  private startRetryFlushLoop(): void {
    if (this.retryFlushInterval) return
    this.retryFlushInterval = setInterval(() => {
      void this.retryQueue.flush()
    }, FLUSH_INTERVAL_MS)
    this.retryFlushInterval.unref?.()
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
}

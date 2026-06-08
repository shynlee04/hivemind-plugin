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
 * CANONICAL SOURCE: Session-tracker (`.hivemind/session-tracker/`) is the
 * canonical source for delegation/hierarchy state (REQ-P41D-01).
 * Continuity's `session-continuity.json` (Q6) is the canonical source for
 * continuity session state (metadata, lifecycle, delegation meta).
 *
 * Event handler logic is extracted to `session-event-handler.ts` (GA-4 ≤500 LOC).
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

export { readRawDelegations } from "./read-delegations.js"

export { isValidSessionID, isValidHookPayload } from "./types.js"
export { SessionRecovery } from "./recovery/session-recovery.js"
export type { ReconsumptionResult, SessionContext } from "./recovery/session-recovery.js"

// ---------------------------------------------------------------------------
// Phase 58 (G5, REQ-58-05, D-58-11): Per-session manualOverride state
// ---------------------------------------------------------------------------

/**
 * P58 G5: Module-level map holding the per-session manualOverride state.
 * The map is exported via getManualOverrideState / setManualOverrideState
 * helpers so callers (tmux-copilot, appendTuiPrompt wrapper) can access it
 * without holding a SessionTracker instance reference.
 */
const sessionOverrideMap = new Map<string, { manualOverride: boolean; takenAt?: number; takenBy?: string }>()

/**
 * P58 G5: Read the per-session manualOverride state.
 */
export function getManualOverrideState(sessionId: string | undefined): { manualOverride: boolean; takenAt?: number; takenBy?: string } | undefined {
  if (!sessionId) return undefined
  return sessionOverrideMap.get(sessionId)
}

/**
 * P58 G5: Write the per-session manualOverride state.
 */
export function setManualOverrideState(sessionId: string, state: { manualOverride: boolean; takenAt?: number; takenBy?: string }): void {
  sessionOverrideMap.set(sessionId, state)
}

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import type { OpenCodeClient } from "../../shared/session-api.js"
import type { InitializedDeps } from "./initialization.js"
import { MessageCapture } from "./capture/message-capture.js"
import { constructDependencies, sessionTrackerRoot } from "./initialization.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { ToolDelegation } from "./tool-delegation.js"
import { ProjectContinuityChecker } from "./project-continuity.js"
import { FLUSH_INTERVAL_MS } from "./persistence/retry-queue.js"
import {
  handleSessionEvent as handleSessionEventFn,
  handleChatMessage as handleChatMessageFn,
  handleToolExecuteAfter as handleToolExecuteAfterFn,
  ensureAncestorRoute,
} from "./session-event-handler.js"
import type { TrackerHandlerContext } from "./session-event-handler.js"

// ---------------------------------------------------------------------------
// SessionTracker class
// ---------------------------------------------------------------------------

/**
 * Central session tracker class.
 *
 * Hook callbacks call the public handler methods; each delegates to the
 * extracted functions in `session-event-handler.ts`.
 */
export class SessionTracker {
  private client: OpenCodeClient
  private projectRoot: string

  // Capture handlers — initialized in initialize()
  private eventCapture!: InitializedDeps["eventCapture"]
  private lastMessageCapture!: InitializedDeps["lastMessageCapture"]
  private messageCapture!: MessageCapture
  private toolCapture!: InitializedDeps["toolCapture"]
  // Persistence writers
  private childWriter!: InitializedDeps["childWriter"]
  private sessionIndexWriter!: InitializedDeps["sessionIndexWriter"]
  private projectIndexWriter!: InitializedDeps["projectIndexWriter"]
  private hierarchyIndex!: InitializedDeps["hierarchyIndex"]
  private pendingRegistry!: InitializedDeps["pendingRegistry"]
  private manifestWriter!: InitializedDeps["manifestWriter"]
  private recovery!: InitializedDeps["recovery"]
  private retryQueue!: InitializedDeps["retryQueue"]
  private bootstrap!: InitializedDeps["bootstrap"]
  private classifier!: InitializedDeps["classifier"]
  private sessionRouter!: InitializedDeps["sessionRouter"]
  private childRecorder!: InitializedDeps["childRecorder"]
  private orphanCleanup!: InitializedDeps["orphanCleanup"]
  private toolDelegation!: ToolDelegation
  private projectContinuityChecker!: ProjectContinuityChecker
  private bootstrappedSessions: Set<string> = new Set()
  private retryFlushInterval: ReturnType<typeof setInterval> | undefined

  constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
  }

  /** Returns the LastMessageCapture instance for event observer wiring. */
  getLastMessageCapture(): InitializedDeps["lastMessageCapture"] {
    return this.lastMessageCapture
  }

  /** Builds the handler context for delegation to session-event-handler.ts. */
  private ctx(): TrackerHandlerContext {
    return {
      client: this.client,
      projectRoot: this.projectRoot,
      classifier: this.classifier,
      hierarchyIndex: this.hierarchyIndex,
      toolDelegation: this.toolDelegation,
      messageCapture: this.messageCapture,
      bootstrappedSessions: this.bootstrappedSessions,
      eventCapture: this.eventCapture,
      toolCapture: this.toolCapture,
      pendingRegistry: this.pendingRegistry,
      childWriter: this.childWriter,
      projectIndexWriter: this.projectIndexWriter,
      sessionIndexWriter: this.sessionIndexWriter,
      bootstrap: this.bootstrap,
      sessionRouter: this.sessionRouter,
      childRecorder: this.childRecorder,
    }
  }

  /** Lazy-bootstrap a pre-existing session (idempotent). */
  private async ensureSessionReady(sessionID: string): Promise<void> {
    await this.bootstrap.ensureSessionReady(sessionID, this.bootstrappedSessions)
  }

  /** Safely retrieves a session via the SDK client without throwing. */
  private async getSessionSafely(sessionID: string): Promise<unknown> {
    return this.bootstrap.getSessionSafely(sessionID)
  }

  // -------------------------------------------------------------------------
  // Event handler delegation (GA-4: thin wrappers → session-event-handler.ts)
  // -------------------------------------------------------------------------

  /** Handles session lifecycle events from the OpenCode `event` hook. */
  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    return handleSessionEventFn(this.ctx(), event)
  }

  /** Handles chat message events from the OpenCode `chat.message` hook. */
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
    return handleChatMessageFn(this.ctx(), input, output, (id) => this.ensureSessionReady(id))
  }

  /** Handles tool execution events from the OpenCode `tool.execute.after` hook. */
  async handleToolExecuteAfter(
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    return handleToolExecuteAfterFn(this.ctx(), input, output, (id) => this.ensureSessionReady(id))
  }

  /**
   * Ensures a child write can resolve to the root main directory.
   *
   * Delegates to `ensureAncestorRoute` from session-event-handler.ts.
   * Kept as a class method because constructCoreDependencies passes it
   * as a callback during dependency construction.
   */
  private async ensureChildRoute(parentID: string, childID: string): Promise<void> {
    await ensureAncestorRoute(this.ctx(), parentID, new Set<string>())
    if (!this.hierarchyIndex.isChild(childID)) {
      this.hierarchyIndex.registerChild(parentID, childID)
    }
  }

  // -------------------------------------------------------------------------
  // Tool execute before — small enough to keep inline
  // -------------------------------------------------------------------------

  /**
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Must NOT block tool execution — fire-and-forget polling only.
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
          message: "[Hivemind] Session tracker: handleToolExecuteBefore failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  // -------------------------------------------------------------------------
  // Lifecycle methods
  // -------------------------------------------------------------------------

  /**
   * Synchronously constructs all session-tracker dependencies.
   *
   * Must be called BEFORE delegation wiring so that `onChildSessionCreated`
   * callbacks immediately find critical deps available (D-01, REQ-01).
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
   */
  async initialize(): Promise<void> {
    try {
      if (!this.hierarchyIndex) {
        this.constructCoreDependencies()
      }
      await this.hierarchyIndex.buildFromDisk()
      await this.retryQueue.flush()
      this.startRetryFlushLoop()

      this.toolDelegation = new ToolDelegation({
        client: this.client,
        classifier: this.classifier,
        sessionRouter: this.sessionRouter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
        manifestWriter: this.manifestWriter,
        projectRoot: this.projectRoot,
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

      await this.orphanCleanup.cleanupOrphanedTmpFiles()
      await this.orphanCleanup.cleanupOrphanDirectories()
      const staleRemoved = await this.projectIndexWriter.cleanupStaleEntries()
      if (staleRemoved > 0) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "info",
            message: `[Hivemind] Session tracker: cleaned ${staleRemoved} stale entries from project-continuity.json`,
          },
        })
      }
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
          message: "[Hivemind] Session tracker: initialization failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /** Performs cleanup when the plugin is shutting down. */
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
          message: "[Hivemind] Session tracker: cleanup failed",
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
}

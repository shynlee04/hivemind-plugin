/**
 * Initialization — lifecycle assembly helpers for SessionTracker.
 *
 * Extracts the dependency-construction logic from index.ts initialize().
 * Returns constructed instances without mutating SessionTracker state directly.
 *
 * @module session-tracker/initialization
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import { resolve } from "node:path"
import { HierarchyIndex } from "./persistence/hierarchy-index.js"
import { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"
import { SessionWriter } from "./persistence/session-writer.js"
import { ChildWriter } from "./persistence/child-writer.js"
import { ChildWriteRetryQueue } from "./persistence/retry-queue.js"
import { SessionIndexWriter } from "./persistence/session-index-writer.js"
import { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import { SessionBootstrap } from "./bootstrap.js"
import { SessionClassifier } from "./classification.js"
import { SessionRouter } from "./session-router.js"
import { ChildRecorder } from "./child-recorder.js"
import { OrphanQuarantine } from "./persistence/orphan-quarantine.js"
import { OrphanCleanup } from "./orphan-cleanup.js"
import { HierarchyManifestWriter } from "./persistence/hierarchy-manifest.js"
import { AgentTransform } from "./transform/agent-transform.js"
import { EventCapture } from "./capture/event-capture.js"
import { LastMessageCapture } from "./capture/last-message-capture.js"
import { MessageCapture } from "./capture/message-capture.js"
import { ToolCapture } from "./capture/tool-capture.js"
import { SessionRecovery } from "./recovery/session-recovery.js"

/**
 * Minimal client surface documentation.
 *
 * The `constructDependencies` function accepts `OpenCodeClient` (the full SDK
 * client type) because downstream constructors require it. The session-tracker
 * modules only use a small subset:
 *   - `app.log()` — structured logging
 *   - `session.get()` / `session.messages()` — session data queries
 *   - `session.children()` — child delegation polling
 *   - `tui.showToast()` — user notifications
 *
 * This documentation-only note replaces the former `ClientLike = any` alias
 * that erased the type entirely. C1 concern-remediation 2026-05-28.
 */

/**
 * All constructed dependencies from initialization.
 * index.ts assigns these to its own fields.
 */
export interface InitializedDeps {
  hierarchyIndex: HierarchyIndex
  pendingRegistry: PendingDispatchRegistry
  sessionWriter: SessionWriter
  childWriter: ChildWriter
  retryQueue: ChildWriteRetryQueue
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  childRecorder: ChildRecorder
  bootstrap: SessionBootstrap
  classifier: SessionClassifier
  sessionRouter: SessionRouter
  quarantine: OrphanQuarantine
  orphanCleanup: OrphanCleanup
  manifestWriter: HierarchyManifestWriter
  agentTransform: AgentTransform
  eventCapture: EventCapture
  lastMessageCapture: LastMessageCapture
  messageCapture: MessageCapture
  toolCapture: ToolCapture
  recovery: SessionRecovery
}

/**
 * External callbacks needed by the initializer.
 */
export interface InitCallbacks {
  getSessionSafely: (id: string) => Promise<unknown>
  ensureChildRoute: (parentID: string, childSessionID: string) => Promise<void>
  bootstrappedSessions: Set<string>
}

/**
 * Constructs all SessionTracker dependencies in correct order.
 *
 * Callers assign the returned properties to their own fields.
 * This function does NOT perform async initialization (recovery, index seeding)
 * — those remain in index.ts initialize() because they involve I/O sequencing.
 *
 * @param client - OpenCode client instance.
 * @param projectRoot - Absolute path to the project root.
 * @param callbacks - External callbacks for DI wiring.
 * @returns All constructed dependency instances.
 */
export function constructDependencies(
  client: OpenCodeClient,
  projectRoot: string,
  callbacks: InitCallbacks,
): InitializedDeps {
  // Build shared authorities
  const hierarchyIndex = new HierarchyIndex({ projectRoot })
  const pendingRegistry = new PendingDispatchRegistry()
  const retryQueue = new ChildWriteRetryQueue({ projectRoot })

  // Create persistence writers
  const sessionWriter = new SessionWriter({ projectRoot })
  const childWriter = new ChildWriter({ projectRoot, hierarchyIndex, retryQueue })
  const sessionIndexWriter = new SessionIndexWriter({ projectRoot })
  const projectIndexWriter = new ProjectIndexWriter({ client, projectRoot, hierarchyIndex })

  // Create child recorder — child delegation message capture
  const childRecorder = new ChildRecorder({
    childWriter,
    bootstrappedSessions: callbacks.bootstrappedSessions,
    ensureChildRoute: callbacks.ensureChildRoute,
  })

  // Create bootstrap helper
  const bootstrap = new SessionBootstrap({
    client,
    projectRoot,
    sessionWriter,
    projectIndexWriter,
    sessionIndexWriter,
  })

  // Create session classifier + router
  const classifier = new SessionClassifier({ hierarchyIndex, pendingRegistry })
  const sessionRouter = new SessionRouter({
    classifier,
    getSessionSafely: callbacks.getSessionSafely,
  })

  // Create orphan quarantine and cleanup
  const trackerRoot = resolve(projectRoot, ".hivemind", "session-tracker")
  const quarantine = new OrphanQuarantine({ trackerRoot })
  const orphanCleanup = new OrphanCleanup({
    client,
    projectRoot,
    hierarchyIndex,
    quarantine,
  })

  // Create hierarchy manifest writer (D-07)
  const manifestWriter = new HierarchyManifestWriter({ projectRoot })

  // Create transform utility
  const agentTransform = new AgentTransform()

  // Create capture handlers
  const lastMessageCapture = new LastMessageCapture({
    onLastMessageUpdate: (sessionID: string, text: string) => {
      // Continuous frontmatter update as assistant text streams in.
      // This preserves the latest text even if the session crashes or
      // the user disconnects before session.idle fires.
      sessionWriter.updateFrontmatter(
        sessionID,
        { lastMessage: text },
      ).catch((err) => {
        console.warn(
          `[Harness] Session tracker: frontmatter update failed for "${sessionID}":`,
          err instanceof Error ? err.message : String(err),
        )
      })
    },
  })
  const eventCapture = new EventCapture({
    client,
    sessionWriter,
    childWriter,
    sessionIndexWriter,
    projectIndexWriter,
    hierarchyIndex,
    pendingRegistry,
    manifestWriter,
    lastMessageCapture,
  })
  const messageCapture = new MessageCapture({
    client,
    sessionWriter,
    agentTransform,
    projectRoot,
    sessionIndexWriter,
  })
  const toolCapture = new ToolCapture({
    client,
    sessionWriter,
    childWriter,
    sessionIndexWriter,
    projectIndexWriter,
    hierarchyIndex,
    pendingRegistry,
  })

  // Create recovery (async init happens in index.ts)
  const recovery = new SessionRecovery({ client, projectRoot })

  return {
    hierarchyIndex,
    pendingRegistry,
    sessionWriter,
    childWriter,
    retryQueue,
    sessionIndexWriter,
    projectIndexWriter,
    childRecorder,
    bootstrap,
    classifier,
    sessionRouter,
    quarantine,
    orphanCleanup,
    manifestWriter,
    agentTransform,
    eventCapture,
    lastMessageCapture,
    messageCapture,
    toolCapture,
    recovery,
  }
}

/**
 * Resolves the session tracker root directory.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns Path to `.hivemind/session-tracker/`.
 */
export function sessionTrackerRoot(projectRoot: string): string {
  return resolve(projectRoot, ".hivemind", "session-tracker")
}

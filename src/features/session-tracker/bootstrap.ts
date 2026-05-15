/**
 * Session bootstrap logic extracted from index.ts.
 *
 * Handles lazy session initialization, SDK session lookup,
 * and forked child copying. Reduces index.ts LOC count.
 *
 * @module session-tracker/bootstrap
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import { getSession } from "../../shared/session-api.js"
import type { SessionWriter } from "./persistence/session-writer.js"
import type { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import type { SessionIndexWriter } from "./persistence/session-index-writer.js"
import { isValidSessionID } from "./types.js"
import { safeSessionPath } from "./persistence/atomic-write.js"
import { readFile } from "node:fs/promises"

/**
 * Manages session bootstrap operations: lazy directory creation,
 * SDK session lookup, and forked child inheritance.
 */
export class SessionBootstrap {
  private client: OpenCodeClient
  private projectRoot: string
  private sessionWriter: SessionWriter
  private projectIndexWriter: ProjectIndexWriter
  private sessionIndexWriter: SessionIndexWriter

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: {
    client: OpenCodeClient
    projectRoot: string
    sessionWriter: SessionWriter
    projectIndexWriter: ProjectIndexWriter
    sessionIndexWriter: SessionIndexWriter
  }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
    this.sessionWriter = deps.sessionWriter
    this.projectIndexWriter = deps.projectIndexWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
  }

  /**
   * Lazy-bootstraps a session that was created before the harness loaded.
   *
   * Creates the session directory, initializes the `.md` file, and registers
   * the session in the project index. Idempotent — skips if already bootstrapped.
   *
   * @param sessionID - The session identifier to bootstrap.
   * @param bootstrappedSessions - Set tracking already-bootstrapped sessions.
   * @returns Promise that resolves when bootstrap is complete.
   */
  async ensureSessionReady(
    sessionID: string,
    bootstrappedSessions: Set<string>,
  ): Promise<void> {
    // Guard: if writers haven't been initialized yet, skip (best-effort)
    if (!this.sessionWriter || !this.projectIndexWriter) return
    if (bootstrappedSessions.has(sessionID)) return
    if (!isValidSessionID(sessionID)) return

    bootstrappedSessions.add(sessionID)

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
      bootstrappedSessions.delete(sessionID)
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
   * Safely retrieves a session via the SDK client without throwing.
   *
   * @param sessionID - The session identifier to look up.
   * @returns The session object, or `undefined` if not found.
   */
  async getSessionSafely(sessionID: string): Promise<unknown> {
    if (!isValidSessionID(sessionID)) return undefined
    try {
      return await getSession(this.client, sessionID)
    } catch {
      return undefined
    }
  }

  /**
   * Reference-copies child delegation records from a parent session to
   * a newly-forked session. Both sessions share the same child .json files
   * (reference-copy, not deep-copy) to prevent split-brain data divergence.
   *
   * @param newSessionID - The newly created forked session ID.
   * @param parentID - The parent session ID to inherit children from.
   */
  async copyForkedChildren(
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
}

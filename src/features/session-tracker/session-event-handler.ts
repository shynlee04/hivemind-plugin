/**
 * Session event handler functions extracted from SessionTracker.
 *
 * Contains the event routing, classification, and dispatch logic
 * extracted from index.ts to satisfy the ≤500 LOC gate (GA-4).
 *
 * Each function is a standalone async function that receives a context
 * object with the dependencies it needs. The SessionTracker class methods
 * build the context from their `this.*` fields and delegate here.
 *
 * @module session-tracker/session-event-handler
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import type { HierarchyIndex } from "./persistence/hierarchy-index.js"
import type { SessionClassifier } from "./classification.js"
import type { ToolDelegation } from "./tool-delegation.js"
import type { MessageCapture } from "./capture/message-capture.js"
import type { SessionRouter } from "./session-router.js"
import { isValidSessionID } from "./types.js"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { sessionTrackerRoot } from "./initialization.js"

// ---------------------------------------------------------------------------
// Context interface — built by SessionTracker from its fields
// ---------------------------------------------------------------------------

/**
 * All dependencies the extracted event handlers need from SessionTracker.
 *
 * The class builds this from `this.*` fields and passes it to each
 * handler function. This avoids circular imports and keeps the extraction
 * boundary clean.
 */
export interface TrackerHandlerContext {
  client: OpenCodeClient
  projectRoot: string
  classifier: SessionClassifier
  hierarchyIndex: HierarchyIndex
  toolDelegation: ToolDelegation
  messageCapture: MessageCapture
  bootstrappedSessions: Set<string>

  /** Optional capture/event handlers (may be undefined before init). */
  eventCapture: { handleSessionEvent(event: unknown): Promise<void> } | undefined
  toolCapture: { handleToolExecuteAfter(input: unknown, output: unknown): Promise<void> } | undefined
  pendingRegistry: { refreshTimestamp(callID: string): void } | undefined
  childWriter: unknown
  /** Truthiness-only: checked before fork child-copy logic. */
  projectIndexWriter: unknown
  /** Truthiness-only: checked before fork child-copy logic. */
  sessionIndexWriter: unknown

  /** Bootstrap helpers. */
  bootstrap: {
    copyForkedChildren(newID: string, parentID: string): Promise<void>
    getSessionSafely(sessionID: string): Promise<unknown>
  }

  /** Session router for classify-before-I/O routing. */
  sessionRouter: SessionRouter

  /** Child recorder for delegation message capture. */
  childRecorder: {
    recordChildMessage(parentID: string, childID: string, msgInput: unknown, msgOutput: unknown): Promise<void>
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * Handles session lifecycle events from the OpenCode `event` hook.
 *
 * @param ctx - Tracker handler context with all dependencies.
 * @param event - The raw hook input containing eventType, sessionID, and event payload.
 */
export async function handleSessionEvent(
  ctx: TrackerHandlerContext,
  event: {
    eventType: string
    sessionID: string
    event: unknown
  },
): Promise<void> {
  try {
    if (ctx.eventCapture) {
      await ctx.eventCapture.handleSessionEvent(event)
    } else {
      void ctx.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Session tracker: handleSessionEvent skipped — ` +
            `eventCapture not initialized (sessionID: ${event.sessionID}, eventType: ${event.eventType})`,
        },
      })
    }

    // Fork handling: reference-copy child delegation records from parent session.
    if (
      event.eventType === "session.created" &&
      ctx.projectIndexWriter &&
      ctx.sessionIndexWriter
    ) {
      try {
        const session = await ctx.bootstrap.getSessionSafely(event.sessionID)
        const parentID =
          session && typeof session === "object" && "parentID" in session
            ? (session as { parentID?: string }).parentID
            : undefined
        if (parentID) {
          const routeDecision = await ctx.sessionRouter.route(event.sessionID)
          if (routeDecision.route !== "child") {
            await ctx.bootstrap.copyForkedChildren(event.sessionID, parentID)
          }
        }
      } catch (err) {
        void ctx.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: "[Hivemind] Session tracker: fork child-copy failed, proceeding without children",
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      }
    }
  } catch (err) {
    void ctx.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Hivemind] Session tracker: event handler failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

/**
 * Handles chat message events from the OpenCode `chat.message` hook.
 *
 * @param ctx - Tracker handler context with all dependencies.
 * @param input - The hook input containing sessionID, agent, model, messageID, variant.
 * @param output - The hook output containing the message and parts.
 * @param ensureSessionReady - Lazy-bootstrap a pre-existing session.
 */
export async function handleChatMessage(
  ctx: TrackerHandlerContext,
  input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  },
  output: { message: unknown; parts: unknown[] },
  ensureSessionReady: (sessionID: string) => Promise<void>,
): Promise<void> {
  try {
    const decision = await ctx.sessionRouter.route(input.sessionID)

    if (decision.route === "child" && ctx.childWriter) {
      await ctx.childRecorder.recordChildMessage(
        decision.parentID!,
        input.sessionID,
        { sessionID: input.sessionID, agent: input.agent, model: input.model, messageID: input.messageID },
        { message: output.message, parts: output.parts },
      )
      return
    }

    if (decision.route === "unknownSub") {
      if (!(await hasMainSessionFile(ctx.projectRoot, input.sessionID))) {
        return
      }
    } else {
      await ensureSessionReady(input.sessionID)
    }

    if (ctx.messageCapture) {
      await ctx.messageCapture.handleChatMessage(
        input as Parameters<MessageCapture["handleChatMessage"]>[0],
        output as Parameters<MessageCapture["handleChatMessage"]>[1],
      )
    }
  } catch (err) {
    void ctx.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Hivemind] Session tracker: chat.message handler failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

/**
 * Handles tool execution events from the OpenCode `tool.execute.after` hook.
 *
 * @param ctx - Tracker handler context with all dependencies.
 * @param input - The hook input containing tool name, sessionID, callID, and args.
 * @param output - The hook output containing title, output, and metadata.
 * @param ensureSessionReady - Lazy-bootstrap a pre-existing session.
 */
export async function handleToolExecuteAfter(
  ctx: TrackerHandlerContext,
  input: { tool: string; sessionID: string; callID: string; args: unknown },
  output: { title: string; output: unknown; metadata: unknown },
  ensureSessionReady: (sessionID: string) => Promise<void>,
): Promise<void> {
  try {
    const decision = await ctx.sessionRouter.route(input.sessionID)
    const parentID = decision.route === "child" ? decision.parentID : undefined

    if (parentID && ctx.childWriter) {
      ctx.bootstrappedSessions.add(input.sessionID)
      await ctx.toolDelegation.recordChildToolJourney(
        parentID, input, output,
        (pID: string, cID: string) => ensureChildRoute(ctx, pID, cID),
      )
      if (input.tool === "task" || input.tool === "delegate-task") {
        await ctx.toolDelegation.recordChildTaskDelegation(
          parentID, input, output,
          (pID: string, cID: string) => ensureChildRoute(ctx, pID, cID),
        )
      }
      if (ctx.pendingRegistry && input.callID) {
        ctx.pendingRegistry.refreshTimestamp(input.callID)
      }
      return
    }

    if (decision.classification.kind === "unknownSub") {
      const hasMainFile = await hasMainSessionFile(ctx.projectRoot, input.sessionID)
      if (!hasMainFile && input.tool === "task" && await isSdkRootSession(ctx, input.sessionID)) {
        await ensureSessionReady(input.sessionID)
      } else if (!hasMainFile) {
        return
      }
    } else {
      await ensureSessionReady(input.sessionID)
    }

    await ctx.messageCapture.backfillUserTurnsFromSdk(input.sessionID)

    if (ctx.toolCapture) {
      await ctx.toolCapture.handleToolExecuteAfter(input, output)
      if (ctx.pendingRegistry && input.callID) {
        ctx.pendingRegistry.refreshTimestamp(input.callID)
      }
    }
  } catch (err) {
    void ctx.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Hivemind] Session tracker: tool.execute.after handler failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Checks whether a main-session markdown file already exists.
 *
 * Unknown sub-sessions must never create a new main directory. Existing main
 * sessions, however, may continue receiving message/tool captures after the
 * router reports `unknownSub` because SDK parent metadata can be absent.
 *
 * @param projectRoot - The project root path.
 * @param sessionID - Session ID to check.
 * @returns `true` when the main session `.md` file exists on disk.
 */
export async function hasMainSessionFile(projectRoot: string, sessionID: string): Promise<boolean> {
  try {
    if (!isValidSessionID(sessionID)) return false
    const filePath = resolve(sessionTrackerRoot(projectRoot), sessionID, `${sessionID}.md`)
    await readFile(filePath, "utf-8")
    return true
  } catch {
    return false
  }
}

/**
 * Confirms a session is an SDK-visible root before allowing lazy task bootstrap.
 *
 * @param ctx - Tracker handler context.
 * @param sessionID - Session to check through the SDK wrapper.
 * @returns True only when the SDK returns a session with `parentID: null`.
 */
async function isSdkRootSession(
  ctx: TrackerHandlerContext,
  sessionID: string,
): Promise<boolean> {
  const session = await ctx.bootstrap.getSessionSafely(sessionID)
  return Boolean(
    session &&
    typeof session === "object" &&
    "parentID" in session &&
    (session as { parentID?: string | null }).parentID === null,
  )
}

/**
 * Ensures a child write can resolve to the root main directory.
 *
 * SDK-based classification can discover an L2 child before the local
 * hierarchy index has seen its L1 parent. Hydrating ancestors first prevents
 * child writes from falling back to the immediate L1 directory.
 *
 * @param ctx - Tracker handler context.
 * @param parentID - Immediate parent session ID.
 * @param childID - Child session ID being written.
 */
async function ensureChildRoute(
  ctx: TrackerHandlerContext,
  parentID: string,
  childID: string,
): Promise<void> {
  await ensureAncestorRoute(ctx, parentID, new Set<string>())
  const routeDecision = await ctx.sessionRouter.route(childID)
  if (routeDecision.route !== "child") {
    ctx.hierarchyIndex.registerChild(parentID, childID)
  }
}

/**
 * Recursively registers a parent session's own parent chain from SDK data.
 *
 * Includes MAX_DEPTH guard (F-13 / REQ-21-07) to prevent stack overflow
 * on corrupt SDK data or deep ancestor chains.
 *
 * @param ctx - Tracker handler context.
 * @param sessionID - Session whose ancestors should be registered.
 * @param seen - Cycle guard for defensive SDK data handling.
 * @param depth - Current recursion depth (internal, pass 0 on first call).
 */
export async function ensureAncestorRoute(
  ctx: TrackerHandlerContext,
  sessionID: string,
  seen: Set<string>,
  depth: number = 0,
): Promise<void> {
  const MAX_DEPTH = 20

  if (depth > MAX_DEPTH) {
    void ctx.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Hivemind] Session tracker: ensureAncestorRoute exceeded MAX_DEPTH=${MAX_DEPTH} at "${sessionID}" — truncating to prevent stack overflow`,
      },
    })
    return
  }

  if (seen.has(sessionID)) return
  seen.add(sessionID)

  const session = await ctx.bootstrap.getSessionSafely(sessionID)
  const parentID =
    session && typeof session === "object" && "parentID" in session
      ? (session as { parentID?: string }).parentID
      : undefined
  if (!parentID) return

  await ensureAncestorRoute(ctx, parentID, seen, depth + 1)
  const routeDecision = await ctx.sessionRouter.route(sessionID)
  if (routeDecision.route !== "child") {
    ctx.hierarchyIndex.registerChild(parentID, sessionID)
  }
}

/**
 * Tool delegation handler for session tracker.
 *
 * Extracts child-session task delegation, polling, tool journey recording,
 * and utility methods from index.ts to satisfy the ≤500 LOC gate (GA-4).
 *
 * @module session-tracker/tool-delegation
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import type { SessionClassifier } from "./classification.js"
import type { ChildWriter } from "./persistence/child-writer.js"
import type { SessionIndexWriter } from "./persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import type { HierarchyIndex } from "./persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"
import type { HierarchyManifestWriter } from "./persistence/hierarchy-manifest.js"
import type { ChildSessionRecord } from "./types.js"
import { isValidSessionID } from "./types.js"

/** Dependencies injected by SessionTracker for tool delegation operations. */
export interface ToolDelegationDeps {
  client: OpenCodeClient
  classifier: SessionClassifier
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  hierarchyIndex: HierarchyIndex
  pendingRegistry: PendingDispatchRegistry
  manifestWriter: HierarchyManifestWriter
}

/**
 * Manages child-session task delegation, tool journey recording,
 * and proactive child session discovery via polling.
 *
 * Extracted from SessionTracker to keep index.ts under 500 LOC.
 * All methods are best-effort and catch errors internally.
 */
export class ToolDelegation {
  private readonly client: OpenCodeClient
  private readonly classifier: SessionClassifier
  private readonly childWriter: ChildWriter
  private readonly sessionIndexWriter: SessionIndexWriter
  private readonly projectIndexWriter: ProjectIndexWriter
  private readonly hierarchyIndex: HierarchyIndex
  private readonly pendingRegistry: PendingDispatchRegistry
  private readonly manifestWriter: HierarchyManifestWriter

  /**
   * Creates a new ToolDelegation handler.
   *
   * @param deps - Injected dependencies from SessionTracker.
   */
  constructor(deps: ToolDelegationDeps) {
    this.client = deps.client
    this.classifier = deps.classifier
    this.childWriter = deps.childWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
    this.projectIndexWriter = deps.projectIndexWriter
    this.hierarchyIndex = deps.hierarchyIndex
    this.pendingRegistry = deps.pendingRegistry
    this.manifestWriter = deps.manifestWriter
  }

  /**
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Called synchronously from the plugin.ts tool.execute.before hook.
   * Must NOT block tool execution — fire-and-forget polling only.
   *
   * @param params - Hook input parameters.
   * @param params.sessionID - The parent session ID (tool executor's session).
   * @param params.callID - The tool call identifier.
   * @param params.subagentType - The subagent_type from task tool args.
   * @param params.description - The task description.
   * @param params.taskId - If present, this is a resume — skip registration.
   * @param params.tool - The tool name used for dispatch ("task" or "delegate-task").
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
      if (!isValidSessionID(params.sessionID)) return

      // Resume detection (AC-10): if task_id is present, this is a resume dispatch.
      if (params.taskId) {
        return
      }

      if (!this.pendingRegistry) return

      // Register pending dispatch entry for Gate 3 classification
      this.pendingRegistry.add({
        parentSessionID: params.sessionID,
        callID: params.callID,
        subagentType: params.subagentType || "unknown",
        timestamp: Date.now(),
        tool: params.tool ?? "task",
      })

      // Fire-and-forget polling: discover child session via Server API.
      // IMPORTANT: do NOT await here — would block tool execution.
      void this.pollForChildSessions(params.sessionID, params.callID)
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
   * Fire-and-forget polling loop to discover child sessions after task dispatch.
   *
   * Per SPEC §3.3: polls client.session.children() every 200ms for up to 5 attempts.
   * On discovery: registers child in HierarchyIndex and updates pending registry.
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
        // Feature-detect session.children() before unsafe cast (WR-02)
        if (
          !this.client?.session ||
          typeof (this.client.session as unknown as Record<string, unknown>).children !== "function"
        ) {
          return
        }
        const client = this.client as OpenCodeClient & {
          session: {
            children(params: { path: { id: string } }): Promise<{
              data?: Array<{ id: string; parentID?: string }>
            }>
          }
        }
        const result = await client.session.children({ path: { id: parentID } })
        const entries = result.data ?? []

        const newChildren = entries.filter(
          (c) => c.id && isValidSessionID(c.id) && !this.classifier.isChildRegistered(c.id),
        )

        if (newChildren.length > 0) {
          for (const child of newChildren) {
            if (child.id) {
              this.classifier.registerChild(parentID, child.id)
            }
            if (child.id) {
              this.classifier.updatePendingWithChildID(callID, child.id)
            }
          }
          return
        }
      } catch {
        // Server API may not be ready — retry after interval
      }

      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    }

    void this.client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Harness] Session tracker: polling exhausted for parent "${parentID}" — relying on PostToolUse registration`,
      },
    })
  }

  /**
   * Records a child-session tool event to the child `.json` journey array.
   *
   * @param parentID - Immediate parent session ID for the child session.
   * @param input - Tool execution hook input.
   * @param output - Tool execution hook output.
   * @param ensureChildRoute - Callback to ensure child route is registered.
   */
  async recordChildToolJourney(
    parentID: string,
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
    ensureChildRoute: (parentID: string, childID: string) => Promise<void>,
  ): Promise<void> {
    await ensureChildRoute(parentID, input.sessionID)
    await this.childWriter.appendJourneyEntry(parentID, input.sessionID, {
      timestamp: new Date().toISOString(),
      type: "tool_call",
      content: `Tool: ${input.tool}`,
      metadata: {
        tool: input.tool,
        callID: input.callID,
        input: pruneToolInput(input.tool, input.args),
        output: pruneToolOutput(input.tool, output.output, output.metadata),
      },
    })
  }

  /**
   * Records a child-session task delegation as an L2 child JSON record.
   *
   * @param parentID - Immediate parent session ID for the L1 session.
   * @param input - Task tool execution hook input from the child session.
   * @param output - Task tool execution hook output containing `task_id`.
   * @param ensureChildRoute - Callback to ensure child route is registered.
   */
  async recordChildTaskDelegation(
    parentID: string,
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: unknown; metadata: unknown },
    ensureChildRoute: (parentID: string, childID: string) => Promise<void>,
  ): Promise<void> {
    const childSessionID = extractTaskID(output.output)
    if (!childSessionID) return

    const args = asRecord(input.args)
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
        tool: input.tool,
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

    await ensureChildRoute(parentID, input.sessionID)
    await this.childWriter.createChildFile(input.sessionID, childSessionID, childMetadata)
    // Record delegation initiation as a journey entry (not a turn) to avoid
    // polluting lastMessage with the delegation prompt before the child completes.
    await this.childWriter.appendJourneyEntry(input.sessionID, childSessionID, {
      timestamp: now,
      type: "tool_call",
      content: `Tool: ${input.tool} — delegation initiated`,
      metadata: {
        tool: input.tool,
        callID: input.callID,
        phase: "dispatch",
        description: description || "Task delegation initiated",
        subagentType,
      },
    })
    await this.sessionIndexWriter.addChild(
      rootMain,
      childSessionID,
      `${childSessionID}.json`,
      depth,
      subagentType,
      input.sessionID,
    )
    await this.projectIndexWriter.incrementChildCount(rootMain, depth)
    await this.projectIndexWriter.addSession(
      childSessionID,
      `${rootMain}/`,
      `${childSessionID}.json`,
    )
    const taskResult = extractTaskResult(output.output, childSessionID)
    if (taskResult) {
      await this.childWriter.appendChildTurn(input.sessionID, childSessionID, {
        turn: 0,
        actor: subagentType,
        content: taskResult,
        tools: [],
      })
      await this.childWriter.appendJourneyEntry(input.sessionID, childSessionID, {
        timestamp: now,
        type: "assistant_message",
        content: taskResult,
        metadata: {
          capturedFrom: "task_tool_result",
          taskID: childSessionID,
        },
      })
      await this.childWriter.updateChildStatus(input.sessionID, childSessionID, "completed")
      await this.sessionIndexWriter.updateChildStatus(rootMain, childSessionID, "completed")
      await this.manifestWriter.updateChildStatus(rootMain, childSessionID, "completed")
    }
  }
}

// ---------------------------------------------------------------------------
// Pure utility functions (exported for reuse and testability)
// ---------------------------------------------------------------------------

/**
 * Returns safe, pruned tool input metadata for child-session JSON journeys.
 *
 * @param tool - Tool name.
 * @param args - Raw tool args.
 * @returns Pruned metadata matching the main-session markdown capture policy.
 */
export function pruneToolInput(tool: string, args: unknown): Record<string, unknown> {
  const record = asRecord(args)
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
      task_id: extractTaskID(record.task_id),
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
export function pruneToolOutput(
  tool: string,
  output: unknown,
  metadata: unknown,
): Record<string, unknown> {
  const meta = asRecord(metadata)
  const result: Record<string, unknown> = {}
  if (tool === "task") {
    result.task_id = extractTaskID(output)
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
export function extractTaskID(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const direct = value.match(/\bses_[A-Za-z0-9_-]+\b/)
  return direct?.[0]
}

/**
 * Extracts completed child-session content from a task tool result.
 *
 * @param value - Raw task tool output.
 * @param taskID - Child task/session identifier to remove from the payload.
 * @returns Result content, or undefined for dispatch-only output.
 */
export function extractTaskResult(value: unknown, taskID: string): string | undefined {
  if (typeof value !== "string") return undefined
  const tagged = value.match(/<task_result>\s*([\s\S]*?)\s*<\/task_result>/)
  if (tagged?.[1]?.trim()) return tagged[1].trim()

  const withoutTaskID = value
    .replace(new RegExp(`task_id:\\s*${taskID}`, "g"), "")
    .trim()
  return withoutTaskID.length > 0 ? withoutTaskID : undefined
}

/**
 * Safely narrows an unknown value to a record.
 *
 * @param value - Unknown value to inspect.
 * @returns The value as a record, or an empty object.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

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
import type { ChildSessionRecord, SessionTrackerEvent, DelegationLifecycleStatus } from "./types.js"
import { isValidSessionID } from "./types.js"
import { asRecord, deriveAgentNameFromSession, extractTaskID, extractTaskResult, pruneToolInput, pruneToolOutput } from "./tool-delegation-utils.js"

// Re-export pure utilities for backward compatibility
export { pruneToolInput, pruneToolOutput, extractTaskID, extractTaskResult, deriveSubagentType, deriveAgentNameFromSession, asRecord } from "./tool-delegation-utils.js"

// ---------------------------------------------------------------------------
// Phase 58 (G6, REQ-58-06): In-memory event log for the 3 delegation lifecycle
// events. P25.1 trajectory precedent. Exposed via getDelegationEventLog for
// BATS slot 66 monotonicity assertions. Single source of truth across all
// ToolDelegation instances — module-level array, not a class field.
// ---------------------------------------------------------------------------

const delegationEventLog: SessionTrackerEvent[] = []

/** P58 G6: Test seam — returns the in-memory event log for BATS assertions. */
export function getDelegationEventLog(): readonly SessionTrackerEvent[] {
  return delegationEventLog
}

/** P58 G6: Test seam — clears the in-memory event log (test isolation). */
export function clearDelegationEventLog(): void {
  delegationEventLog.length = 0
}

/** P58 G6: Internal helper to append a delegation event to the in-memory log. */
function appendDelegationEvent(event: SessionTrackerEvent): void {
  delegationEventLog.push(event)
}

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
  projectRoot: string
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
  /** Project root for trajectory/contract writes (used by createDelegationTrajectoryAndContract). */
  private readonly projectRoot: string

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
    this.projectRoot = deps.projectRoot
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
    // REQ-23.2-05: Support both task (subagent_type) and delegate-task (agent) arg keys
    const subagentType =
      typeof args.subagent_type === "string" ? args.subagent_type :
      typeof args.agent === "string" ? args.agent :
      "unknown"

    if (!this.hierarchyIndex.isChild(input.sessionID)) {
      this.hierarchyIndex.registerChild(parentID, input.sessionID)
    }
    const rootMain = this.hierarchyIndex.getRootMain(input.sessionID) ?? parentID
    this.hierarchyIndex.registerChild(input.sessionID, childSessionID)
    const depth = this.hierarchyIndex.getDepth(childSessionID)

    // P58 G6 (REQ-58-06, D-58-13): emit delegation-queued event
    appendDelegationEvent({
      type: "delegation-queued",
      delegationId: childSessionID,
      agent: subagentType,
      status: "queued",
      depth,
      parentId: input.sessionID,
      tmuxSessionId: null,
      emittedAt: Date.now(),
    })
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

    // BUG-5 FIX: Ensure the L1 parent (input.sessionID) is registered in the
    // session-index hierarchy BEFORE adding the nested child. Without this,
    // addChild(parentSessionID=input.sessionID) throws because the parent entry
    // doesn't exist in the on-disk index yet — only in the in-memory hierarchyIndex.
    const parentDepth = this.hierarchyIndex.getDepth(input.sessionID)
    if (parentDepth > 0) {
      // L1+ parent: register as top-level child in the root main's index
      await this.sessionIndexWriter.addChild(
        rootMain,
        input.sessionID,
        `${input.sessionID}.json`,
        parentDepth,
        subagentType,
        // No parentSessionID → top-level insertion
      )
    }

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
    // REQ-23.2-04: Populate hierarchy-manifest.json (was missing — addChild defined but never called)
    await this.manifestWriter.addChild({
      rootMainSessionID: rootMain,
      childSessionID,
      parentSessionID: input.sessionID,
      delegationDepth: depth,
      delegatedBy: deriveAgentNameFromSession(input as unknown as Record<string, unknown>) ?? input.tool ?? "unknown",
      subagentType,
      childFile: `${childSessionID}.json`,
    })
    await this.projectIndexWriter.incrementChildCount(rootMain, depth)
    await this.projectIndexWriter.addSession(
      childSessionID,
      `${rootMain}/`,
      `${childSessionID}.json`,
    )

    // P58 G6 (REQ-58-06, D-58-13): emit delegation-dispatched event after SDK child-session creation
    appendDelegationEvent({
      type: "delegation-dispatched",
      delegationId: childSessionID,
      agent: subagentType,
      status: "dispatched",
      depth,
      parentId: input.sessionID,
      tmuxSessionId: null,  // tmuxSessionId wired in PLAN-02 G3 (always null at queue/dispatch time)
      emittedAt: Date.now(),
    })

    // REQ-25.1-01, REQ-25.1-02: Create trajectory record and agent-work-contract
    await this.createDelegationTrajectoryAndContract(
      childSessionID, input.sessionID, subagentType, description, rootMain, input.tool,
    )
    // BUG-3 FIX: Extract the child agent's final assistant response and append it
    // as both a journey entry AND a turn. OpenCode fires chat.message for the parent
    // session (not the child), so child assistant responses are never captured by the
    // child-recorder. We must capture them here from the delegation result.
    const taskResult = input.tool === "delegate-task" ? undefined : extractTaskResult(output.output, childSessionID)
    if (taskResult) {
      // Journey entry for audit trail
      await this.childWriter.appendJourneyEntry(input.sessionID, childSessionID, {
        timestamp: now,
        type: "assistant_message",
        content: taskResult,
        metadata: {
          capturedFrom: "task_tool_result",
          taskID: childSessionID,
        },
      })
      // BUG-3 FIX: Also append as a turn so lastMessage is set and the turn
      // appears in the child's turns array for recovery/resumption.
      await this.childWriter.appendChildTurn(input.sessionID, childSessionID, {
        turn: 0, // Placeholder — auto-assigned by appendChildTurn
        actor: subagentType || "unknown",
        content: taskResult,
        tools: [],
      })
      await this.childWriter.updateChildStatus(input.sessionID, childSessionID, "completed")
      await this.sessionIndexWriter.updateChildStatus(rootMain, childSessionID, "completed")
      await this.manifestWriter.updateChildStatus(rootMain, childSessionID, "completed")
    }
  }

  /**
   * P58 G6 (REQ-58-06, D-58-14): Emit a delegation-terminal event when a
   * delegation reaches a final state. Called from DelegationManager's
   * terminalFallback path and abortDelegation path.
   *
   * @param delegationId - The delegation id reaching terminal state.
   * @param status - The final status. Must be a DelegationLifecycleStatus.
   * @param tmuxSessionId - Optional tmux session id (null for delegations
   *   without a tmux pane attachment; set for delegations that had a pane).
   */
  recordDelegationTerminal(
    delegationId: string,
    status: DelegationLifecycleStatus,
    tmuxSessionId: string | null = null,
  ): void {
    appendDelegationEvent({
      type: "delegation-terminal",
      delegationId,
      agent: "unknown",  // terminal events may fire after the record is pruned; agent is optional
      status,
      depth: 0,  // depth is not available at terminal time without record lookup
      parentId: null,
      tmuxSessionId,
      emittedAt: Date.now(),
    })
  }

  /**
   * Creates trajectory record and agent-work-contract for a delegation.
   * Best-effort: failures are logged but do not break delegation.
   *
   * @param childSessionID - The child session ID.
   * @param parentSessionID - The parent session ID.
   * @param subagentType - The subagent type.
   * @param description - The task description.
   * @param rootMain - The root main session ID.
   * @param tool - The tool name used for dispatch.
   */
  private async createDelegationTrajectoryAndContract(
    childSessionID: string,
    parentSessionID: string,
    subagentType: string,
    description: string,
    rootMain: string,
    tool: string,
  ): Promise<void> {
    const trajectoryId = `traj-${childSessionID}`
    const contractId = `awc-${childSessionID}`

    // --- Trajectory (REQ-25.1-01) ---
    try {
      const { attachTrajectoryEvidence, eventTrajectory } = await import(
        "../../task-management/trajectory/index.js"
      )
      attachTrajectoryEvidence({
        projectRoot: this.projectRoot,
        trajectoryId,
        rootSessionId: rootMain,
        sessionId: childSessionID,
        parentTrajectoryId: `traj-${parentSessionID}`,
        evidenceRef: `session-tracker:delegation:${tool}:${childSessionID}`,
      })
      eventTrajectory({
        projectRoot: this.projectRoot,
        trajectoryId,
        eventType: "delegation_dispatch",
        summary: `${tool} delegation to ${subagentType}: ${description.slice(0, 200)}`,
        evidenceRef: `session-tracker:child-json:${childSessionID}`,
      })
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Trajectory creation failed for delegation ${childSessionID}`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }

    // --- Contract (REQ-25.1-02) ---
    try {
      const { createAgentWorkContract } = await import(
        "../../features/agent-work-contracts/index.js"
      )
      createAgentWorkContract({
        projectRoot: this.projectRoot,
        id: contractId,
        owner: {
          agent: subagentType,
          sessionId: childSessionID,
          parentSessionId: parentSessionID,
        },
        scope: {
          taskBoundary: description.slice(0, 500) || "Delegated task",
          allowedSurfaces: [],
          dependencies: [],
          nonGoals: [],
        },
        evidence: {
          requiredProof: [],
          minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
          verificationCommands: [],
          blockedStateRules: [],
        },
        compaction: {
          briefing: description.slice(0, 200) || "",
          summary: "",
          anchors: [],
          reinjectionPayload: "",
          sourceRefs: [],
        },
        trajectoryId,
      })
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Contract creation failed for delegation ${childSessionID}`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}



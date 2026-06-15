/**
 * TaskCaptureHandler — extracted task tool capture logic.
 *
 * Extracted from `tool-capture.ts` to satisfy the ≤500 LOC gate (GA-4).
 * Owns the full `handleTask` method that processes task tool delegations,
 * creates child session records, and updates indices.
 *
 * @module session-tracker/capture/task-capture-handler
 */

import type { SessionWriter } from "../persistence/session-writer.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
import type { HierarchyIndex } from "../persistence/hierarchy-index.js"
import type { SessionRouter } from "../session-router.js"
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
import type { ChildBackfiller } from "./child-backfiller.js"
import type { ChildSessionRecord } from "../types.js"
import { isValidSessionID } from "../types.js"
import { parseSessionTitle } from "../../../shared/session-naming.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import {
  extractTaskId as extractTaskIdFn,
  extractTaskResult as extractTaskResultFn,
  asString as asStringFn,
} from "./tool-capture-helpers.js"
import { writeImmediateChildFile, finalPollForChildSessions } from "./tool-before-helper.js"
import type { PollDeps } from "./tool-before-helper.js"

interface ToolInput {
  tool: string
  sessionID: string
  callID: string
  args: unknown
}

interface ToolOutput {
  title?: string
  output?: unknown
  metadata?: unknown
}

export interface TaskCaptureHandlerDeps {
  client: OpenCodeClient
  sessionWriter: SessionWriter
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  hierarchyIndex: HierarchyIndex
  sessionRouter: SessionRouter
  pendingRegistry?: PendingDispatchRegistry
  backfiller?: ChildBackfiller
}

/**
 * Handles task tool capture — creating child session records, updating
 * indices, and managing pending dispatch lifecycle.
 */
export class TaskCaptureHandler {
  private readonly deps: TaskCaptureHandlerDeps

  constructor(deps: TaskCaptureHandlerDeps) {
    this.deps = deps
  }

  /**
   * Builds PollDeps from the current instance state.
   */
  private buildPollDeps(): PollDeps {
    return {
      client: this.deps.client as unknown as PollDeps["client"],
      classifier: {
        registerChild: (parentID: string, childID: string) => {
          this.deps.hierarchyIndex.registerChild(parentID, childID)
        },
        updatePendingWithChildID: (callID: string, childID: string) => {
          this.deps.pendingRegistry?.refreshTimestamp?.(callID)
          if (this.deps.pendingRegistry && "updateWithChildID" in this.deps.pendingRegistry) {
            ;(this.deps.pendingRegistry as unknown as { updateWithChildID: (callID: string, childID: string) => void }).updateWithChildID(callID, childID)
          }
        },
        isChildRegistered: (id: string) => this.deps.hierarchyIndex.isChild(id),
      },
      pendingRegistry: this.deps.pendingRegistry as unknown as PollDeps["pendingRegistry"],
      childWriter: this.deps.childWriter as unknown as PollDeps["childWriter"],
      hierarchyIndex: this.deps.hierarchyIndex as unknown as PollDeps["hierarchyIndex"],
    }
  }

  /**
   * Captures a task tool invocation — the authoritative delegation signal.
   *
   * Input: captures `args.description` and `args.subagent_type`.
   * Output: extracts `task_id` from output to create the child `.json` file
   * and update both continuity indices (REQ-ST-06, D-04).
   */
  async handleTask(
    input: ToolInput,
    output: ToolOutput,
  ): Promise<void> {
    const args = (input.args || {}) as Record<string, unknown>
    const description = (args.description as string) || ""
    const subagentType = (args.subagent_type as string) || ""
    const childSessionID = this.extractTaskId(output.output)

    if (childSessionID) {
      const now = new Date().toISOString()
      const childFile = `${childSessionID}.json`

      // Compute depth dynamically by walking the hierarchy index
      this.deps.hierarchyIndex.registerChild(input.sessionID, childSessionID)
      let depth = this.deps.hierarchyIndex.getDepth(childSessionID)
      if (depth === 0) {
        const route = await this.deps.sessionRouter.route(input.sessionID)
        depth = route.route === "child" ? 2 : 1
      }

      await this.deps.sessionIndexWriter.updateToolSummary(input.sessionID, "task")

      // Resolve delegator agentName — priority order per D-04
      const sessionTitle = (input.args as Record<string, unknown>)?.title as string | undefined
        ?? (input as unknown as Record<string, unknown>).title as string | undefined
      const parsedTitle = sessionTitle ? parseSessionTitle(sessionTitle) : null

      let delegatorAgentName = parsedTitle?.agent ?? "unknown"
      if (delegatorAgentName === "unknown" && this.deps.pendingRegistry) {
        const registryName = this.deps.pendingRegistry.getSubagentType(childSessionID)
        if (registryName) {
          delegatorAgentName = registryName
        }
      }
      if (delegatorAgentName === "unknown" && subagentType) {
        delegatorAgentName = subagentType
      }

      // Create child session record
      const childMetadata: ChildSessionRecord = {
        sessionID: childSessionID,
        parentSessionID: input.sessionID,
        delegationDepth: depth,
        delegatedBy: {
          agentName: delegatorAgentName,
          model: "unknown",
          tool: "task",
          description,
          subagentType,
        },
        created: now,
        updated: now,
        status: "active",
        mainAgent: {
          name: (parsedTitle?.agent ?? subagentType) || "unknown",
          model: "unknown",
        },
        turns: [],
        journey: [],
        children: [],
        delegationType: "native-task",
      }

      // Create child .json file under parent's subdir
      await this.deps.childWriter.createChildFile(
        input.sessionID,
        childSessionID,
        childMetadata,
      )

      // Record initial delegation_spawn turn
      await this.deps.childWriter.appendChildTurn(
        input.sessionID,
        childSessionID,
        {
          turn: 0,
          actor: (parsedTitle?.agent ?? subagentType) || "unknown",
          content: description || "Task delegation initiated",
          tools: [],
          role: "user",
        },
      )

      const taskResult = this.extractTaskResult(output.output, childSessionID)
      if (taskResult) {
        await this.deps.childWriter.appendChildTurn(
          input.sessionID,
          childSessionID,
          {
            turn: 0,
            actor: (parsedTitle?.agent ?? subagentType) || "unknown",
            content: taskResult,
            tools: [],
            role: "assistant",
          },
        )
        await this.deps.childWriter.appendJourneyEntry(input.sessionID, childSessionID, {
          timestamp: now,
          type: "assistant_message",
          content: taskResult,
          metadata: {
            capturedFrom: "task_tool_result",
            taskID: childSessionID,
          },
        })
        await this.deps.childWriter.updateChildStatus(input.sessionID, childSessionID, "completed")
      }

      // Update session-local index
      await this.deps.sessionIndexWriter.addChild(
        input.sessionID,
        childSessionID,
        childFile,
        depth,
        (parsedTitle?.agent ?? subagentType) || "unknown",
      )

      // Update project-level index
      await this.deps.projectIndexWriter.incrementChildCount(input.sessionID, depth)
      await this.deps.projectIndexWriter.addSession(
        childSessionID,
        `${input.sessionID}/`,
        `${childSessionID}.json`,
      )

      // Refresh pending dispatch registry entry
      if (this.deps.pendingRegistry) {
        const callID = input.callID || ""
        if (callID) {
          this.deps.pendingRegistry.refreshTimestamp(callID)
        }
      }

      // Append the task tool block to the main session .md
      await this.deps.sessionWriter.appendToolBlock(
        input.sessionID,
        "task",
        { description, subagent_type: subagentType, task_id: childSessionID },
        `task_id: ${childSessionID}`,
        undefined,
      )
    } else {
      // REQ-62-02: task_id absent — cancellation/disconnection fallback
      if (this.deps.pendingRegistry && this.deps.backfiller) {
        const parentEntries = this.deps.pendingRegistry.getByParent(input.sessionID)
        if (parentEntries && parentEntries.length > 0) {
          const latestEntry = parentEntries[parentEntries.length - 1]
          const fallbackChildID = latestEntry.childSessionID
          if (fallbackChildID && isValidSessionID(fallbackChildID)) {
            await writeImmediateChildFile(
              { childWriter: this.deps.childWriter as unknown as PollDeps["childWriter"],
                hierarchyIndex: this.deps.hierarchyIndex as unknown as PollDeps["hierarchyIndex"],
                pendingRegistry: this.deps.pendingRegistry as unknown as PollDeps["pendingRegistry"] },
              fallbackChildID,
              input.sessionID,
              latestEntry.subagentType,
              undefined,
              "cancelled",
            )
            await this.deps.childWriter.updateChildStatus(input.sessionID, fallbackChildID, "cancelled")
            await this.deps.backfiller.backfillChildTurnsFromSdk(input.sessionID, fallbackChildID)
          }
        }
      }
      await this.deps.sessionWriter.appendToolBlock(
        input.sessionID,
        "task",
        { description, subagent_type: subagentType },
        undefined,
        undefined,
      )
    }
    // REQ-62-03: Post-execution final poll for late child discovery
    void finalPollForChildSessions(this.buildPollDeps(), input.sessionID)
  }

  private extractTaskId(output: unknown): string | null {
    return extractTaskIdFn(output, asStringFn)
  }

  private extractTaskResult(output: unknown, taskID: string): string | undefined {
    return extractTaskResultFn(output, taskID, asStringFn)
  }
}

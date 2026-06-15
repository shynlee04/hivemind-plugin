/**
 * Tool metadata capture handler with per-tool pruning rules.
 *
 * Handles `tool.execute.after` hook events from OpenCode. Applies
 * SPEC.md Section 5.1 capture rules for each tool type:
 *
 * - **skill**: captures skill name + first `#` header line only (REQ-ST-04)
 * - **read**: captures file path only, NEVER file content (REQ-ST-05)
 * - **task**: captures delegation metadata + triggers child `.json` creation (REQ-ST-06)
 * - **other**: captures tool name and callID only (metadata safe)
 *
 * All handlers are best-effort — errors are logged, never thrown.
 *
 * @module session-tracker/capture/tool-capture
 */

import type { SessionWriter } from "../persistence/session-writer.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
import type { HierarchyIndex } from "../persistence/hierarchy-index.js"
import type { SessionRouter } from "../session-router.js"
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
import type { ChildBackfiller } from "./child-backfiller.js"
import { isValidSessionID } from "../types.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import { extractFirstHeader as extractFirstHeaderFn, asString as asStringFn } from "./tool-capture-helpers.js"
import { registerPendingDispatch, pollForChildSessions } from "./tool-before-helper.js"
import type { PollDeps } from "./tool-before-helper.js"
import { TaskCaptureHandler } from "./task-capture-handler.js"

// ---------------------------------------------------------------------------
// Hook input/output shapes
// ---------------------------------------------------------------------------

/** Shape of the tool.execute.after hook input. */
interface ToolInput {
  tool: string
  sessionID: string
  callID: string
  args: unknown
}

/** Shape of the tool.execute.after hook output. */
interface ToolOutput {
  title?: string
  output?: unknown
  metadata?: unknown
}

// ---------------------------------------------------------------------------
// ToolCapture class
// ---------------------------------------------------------------------------

/**
 * Captures tool execution metadata from the `tool.execute.after` hook.
 *
 * Applies per-tool pruning rules to keep session knowledge files focused
 * and avoid capturing sensitive or excessive data.
 */
export class ToolCapture {
  private client: OpenCodeClient
  private sessionWriter: SessionWriter
  private childWriter: ChildWriter
  private sessionIndexWriter: SessionIndexWriter
  private hierarchyIndex: HierarchyIndex
  private pendingRegistry: PendingDispatchRegistry | undefined
  private readonly taskHandler: TaskCaptureHandler

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for logging.
   * @param deps.sessionWriter - The main session writer for .md output.
   * @param deps.childWriter - The child session writer for .json delegation files.
   * @param deps.sessionIndexWriter - The session-local index writer.
   * @param deps.projectIndexWriter - The project-level index writer.
   * @param deps.backfiller - Optional child backfiller for cancelled child backfill.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    childWriter: ChildWriter
    sessionIndexWriter: SessionIndexWriter
    projectIndexWriter: ProjectIndexWriter
    hierarchyIndex: HierarchyIndex
    sessionRouter: SessionRouter
    pendingRegistry?: PendingDispatchRegistry
    backfiller?: ChildBackfiller
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
    this.childWriter = deps.childWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
    this.hierarchyIndex = deps.hierarchyIndex
    this.pendingRegistry = deps.pendingRegistry
    this.taskHandler = new TaskCaptureHandler(deps)
  }

  /**
   * Builds PollDeps from the current instance state.
   *
   * Passes client, classifier (via hierarchyIndex), pendingRegistry,
   * childWriter, and hierarchyIndex to the shared before-hook utility functions.
   */
  private buildPollDeps(): PollDeps {
    return {
      client: this.client as unknown as PollDeps["client"],
      classifier: {
        registerChild: (parentID: string, childID: string) => {
          this.hierarchyIndex.registerChild(parentID, childID)
        },
        updatePendingWithChildID: (callID: string, childID: string) => {
          this.pendingRegistry?.refreshTimestamp?.(callID)
          if (this.pendingRegistry && "updateWithChildID" in this.pendingRegistry) {
            ;(this.pendingRegistry as unknown as { updateWithChildID: (callID: string, childID: string) => void }).updateWithChildID(callID, childID)
          }
        },
        isChildRegistered: (id: string) => this.hierarchyIndex.isChild(id),
      },
      pendingRegistry: this.pendingRegistry as unknown as PollDeps["pendingRegistry"],
      childWriter: this.childWriter as unknown as PollDeps["childWriter"],
      hierarchyIndex: this.hierarchyIndex as unknown as PollDeps["hierarchyIndex"],
    }
  }

  /**
   * Handles the tool.execute.before hook — proactive child session discovery.
   *
   * Creates pending dispatch entry before tool execution (REQ-62-01) so the
   * child .json can be created proactively rather than waiting for after-hook.
   *
   * Called from plugin.ts tool.execute.before hook for "task" and "delegate-task"
   * tools. Fire-and-forget polling — does NOT block tool execution.
   *
   * @param input - Hook input containing tool name, sessionID, callID, and args.
   */
  async handleToolExecuteBefore(input: {
    tool: string
    sessionID: string
    callID: string
    args: Record<string, unknown>
  }): Promise<void> {
    if (input.tool !== "task" && input.tool !== "delegate-task") return
    if (!input?.sessionID || !isValidSessionID(input.sessionID)) return

    const args = (input.args || {}) as Record<string, unknown>
    const subagentType = (args.subagent_type as string) ||
      (args.agent as string) || "unknown"

    await registerPendingDispatch(this.buildPollDeps(), {
      sessionID: input.sessionID,
      callID: input.callID,
      subagentType,
      tool: input.tool,
    })

    // Fire-and-forget polling — will call writeImmediateChildFile on discovery
    void pollForChildSessions(this.buildPollDeps(), input.sessionID, input.callID)
  }

  /**
   * Handles a tool.execute.after hook event.
   *
   * @param input - Hook input containing tool name, sessionID, callID, and args.
   * @param output - Hook output containing title, output, and metadata.
   * @returns Promise that resolves when the tool invocation has been captured.
   */
  async handleToolExecuteAfter(
    input: ToolInput,
    output: ToolOutput,
  ): Promise<void> {
    try {
      if (!input?.sessionID || !isValidSessionID(input.sessionID)) {
        return
      }
      if (!input.tool || typeof input.tool !== "string") {
        return
      }

      // Validate input.args is a non-null, non-array object (or undefined).
      if (
        input.args !== undefined &&
        (input.args === null || Array.isArray(input.args) || typeof input.args !== "object")
      ) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Hivemind] Session tracker: invalid args shape for tool "${input.tool}" — skipping`,
          },
        })
        return
      }

      switch (input.tool) {
        case "skill":
          await this.handleSkill(input, output)
          break
        case "read":
          await this.handleRead(input, output)
          break
        case "task":
          await this.taskHandler.handleTask(input, output)
          break
        default:
          await this.handleOther(input)
          break
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Hivemind] Session tracker: tool.execute.after handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  // -----------------------------------------------------------------------
  // Per-tool handlers
  // -----------------------------------------------------------------------

  /**
   * Captures a skill tool invocation.
   *
   * Input: captures `args.name` (the skill name).
   * Output: captures only the first `#` header line, if present (REQ-ST-04).
   *
   * @param input - The hook input.
   * @param output - The hook output.
   */
  private async handleSkill(
    input: ToolInput,
    output: ToolOutput,
  ): Promise<void> {
    const args = (input.args || {}) as Record<string, unknown>
    const skillName = args.name as string | undefined
    const firstHeader = this.extractFirstHeader(output.output)

    await this.sessionIndexWriter.updateToolSummary(input.sessionID, "skill")

    await this.sessionWriter.appendToolBlock(
      input.sessionID,
      "skill",
      { name: skillName },
      firstHeader,
      undefined,
    )
  }

  /**
   * Captures a read tool invocation.
   *
   * Input: captures `args.filePath` (the file path).
   * Output: NEVER captures file content — only the path (REQ-ST-05).
   * If the output indicates an error, the error message is captured.
   *
   * @param input - The hook input.
   * @param output - The hook output.
   */
  private async handleRead(
    input: ToolInput,
    output: ToolOutput,
  ): Promise<void> {
    const args = (input.args || {}) as Record<string, unknown>
    const filePath = args.filePath as string | undefined

    // Check structured metadata for errors — NEVER inspect file content (DEFECT-04, CR-03)
    const outputMeta = output.metadata as Record<string, unknown> | undefined
    const isError =
      outputMeta?.error !== undefined || outputMeta?.status === "error"
    const errorMessage = isError ? "File read failed" : undefined

    await this.sessionIndexWriter.updateToolSummary(input.sessionID, "read")

    await this.sessionWriter.appendToolBlock(
      input.sessionID,
      "read",
      { filePath },
      undefined,
      errorMessage, // Fixed string ONLY — never passes file content
    )
  }



  /**
   * Captures unknown tool invocations as metadata only.
   *
   * Only the `callID` is captured — no args or output content.
   * This prevents sensitive tool output from being captured verbatim.
   *
   * @param input - The hook input.
   */
  private async handleOther(input: ToolInput): Promise<void> {
    await this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)

    await this.sessionWriter.appendToolBlock(
      input.sessionID,
      input.tool,
      { callID: input.callID },
      undefined,
      undefined,
    )
  }

  /**
   * Passthrough to taskHandler.handleTask. Preserved for backward compatibility
   * — tests and older callers that dispatch to handleTask directly.
   * @deprecated Use taskHandler.handleTask directly.
   */
  async handleTask(input: ToolInput, output: ToolOutput): Promise<void> {
    return this.taskHandler.handleTask(input, output)
  }

  private extractFirstHeader(output: unknown): string | undefined {
    return extractFirstHeaderFn(output, asStringFn)
  }
}

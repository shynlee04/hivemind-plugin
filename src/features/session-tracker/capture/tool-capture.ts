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
import type { ChildSessionRecord } from "../types.js"
import { isValidSessionID } from "../types.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"

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
  private projectIndexWriter: ProjectIndexWriter
  private hierarchyIndex: HierarchyIndex

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for logging.
   * @param deps.sessionWriter - The main session writer for .md output.
   * @param deps.childWriter - The child session writer for .json delegation files.
   * @param deps.sessionIndexWriter - The session-local index writer.
   * @param deps.projectIndexWriter - The project-level index writer.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    childWriter: ChildWriter
    sessionIndexWriter: SessionIndexWriter
    projectIndexWriter: ProjectIndexWriter
    hierarchyIndex: HierarchyIndex
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
    this.childWriter = deps.childWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
    this.projectIndexWriter = deps.projectIndexWriter
    this.hierarchyIndex = deps.hierarchyIndex
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
            message: `[Harness] Session tracker: invalid args shape for tool "${input.tool}" — skipping`,
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
          await this.handleTask(input, output)
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
          message: "[Harness] Session tracker: tool.execute.after handler failed",
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
   * Captures a task tool invocation — the authoritative delegation signal.
   *
   * Input: captures `args.description` and `args.subagent_type`.
   * Output: extracts `task_id` from output to create the child `.json` file
   * and update both continuity indices (REQ-ST-06, D-04).
   *
   * @param input - The hook input.
   * @param output - The hook output.
   */
  private async handleTask(
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

      // Compute depth dynamically by walking the hierarchy index.
      // After registerChild() below sets childSessionID → input.sessionID,
      // getDepth() walks the chain. Pre-register first so depth is correct.
      this.hierarchyIndex.registerChild(input.sessionID, childSessionID)
      let depth = this.hierarchyIndex.getDepth(childSessionID)
      // Fallback: if hierarchy index doesn't know the parent, infer from
      // whether the parent is itself a child (L2) or not (L1).
      if (depth === 0) {
        depth = this.hierarchyIndex.isChild(input.sessionID) ? 2 : 1
      }

      await this.sessionIndexWriter.updateToolSummary(input.sessionID, "task")

      // Create child session record
      const childMetadata: ChildSessionRecord = {
        sessionID: childSessionID,
        parentSessionID: input.sessionID,
        delegationDepth: depth,
        delegatedBy: {
          agentName: "unknown", // Parent-agent name not available in tool.execute.after hook
          model: "unknown",
          tool: "task",
          description,
          subagentType,
        },
        created: now,
        updated: now,
        status: "active",
        mainAgent: {
          name: subagentType || "unknown",
          model: "unknown",
        },
        turns: [],
        children: [],
      }

      // Create child .json file under parent's subdir
      await this.childWriter.createChildFile(
        input.sessionID,
        childSessionID,
        childMetadata,
      )

      // Record initial delegation_spawn turn (DEFECT-03)
      await this.childWriter.appendChildTurn(
        input.sessionID,
        childSessionID,
        {
          turn: 0,
          actor: subagentType || "unknown",
          content: description || "Task delegation initiated",
          tools: [],
        },
      )

      // Update session-local index
      await this.sessionIndexWriter.addChild(
        input.sessionID,
        childSessionID,
        childFile,
        depth,
        subagentType || "unknown",
      )

      // Update project-level index
      // childCount is tracked by project-index-writer internally
      await this.projectIndexWriter.incrementChildCount(input.sessionID, depth)

      // Register child session in project index (AC-04: all sessions represented)
      await this.projectIndexWriter.addSession(
        childSessionID,
        `${input.sessionID}/`,
        `${childSessionID}.json`,
      )

      // Also append the task tool block to the main session .md
      await this.sessionWriter.appendToolBlock(
        input.sessionID,
        "task",
        { description, subagent_type: subagentType, task_id: childSessionID },
        `task_id: ${childSessionID}`,
        undefined,
      )
    } else {
      // No task_id found — capture as metadata only
      await this.sessionWriter.appendToolBlock(
        input.sessionID,
        "task",
        { description, subagent_type: subagentType },
        undefined,
        undefined,
      )
    }
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

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Extracts the first markdown header line (`# ...`) from tool output.
   *
   * @param output - The raw tool output.
   * @returns The first header line, or `undefined` if none found.
   */
  private extractFirstHeader(output: unknown): string | undefined {
    const str = this.asString(output)
    if (!str) return undefined

    const match = str.match(/^# .+$/m)
    return match ? match[0] : undefined
  }

  /**
   * Extracts a task_id from the output string.
   *
   * Recognizes two formats:
   * - `task_id: ses_abc123` (the canonical format from Plan 01 task tool output)
   * - A standalone session ID starting with `ses_` that appears in the output
   *
   * @param output - The raw tool output.
   * @returns The extracted task/session ID, or `null` if none found.
   */
  private extractTaskId(output: unknown): string | null {
    const str = this.asString(output)
    if (!str) return null

    // Try "task_id: ses_..." format first
    const match = str.match(/task_id:\s*(ses_[a-zA-Z0-9_]+)/)
    if (match) return match[1]

    // Try standalone ses_ ID in the output
    const sesMatch = str.match(/(ses_[a-zA-Z0-9_]{6,})/)
    if (sesMatch) return sesMatch[1]

    return null
  }

  /**
   * Safely converts unknown output to a string.
   *
   * @param value - The value to convert.
   * @returns The string representation, or `undefined` if not representable.
   */
  private asString(value: unknown): string | undefined {
    if (typeof value === "string") return value
    if (value === null || value === undefined) return undefined
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
}

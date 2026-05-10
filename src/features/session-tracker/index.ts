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

// ---------------------------------------------------------------------------
// SessionTracker class
// ---------------------------------------------------------------------------

// NOTE: OpenCodeClient type is imported from shared/session-api.
// We use a lightweight import to avoid circular dependencies.
import type { OpenCodeClient } from "../../shared/session-api.js"

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
 *
 * All handler methods are best-effort: they catch errors internally and
 * never throw to the OpenCode runtime.
 */
export class SessionTracker {
  private client: OpenCodeClient
  private projectRoot: string

  /**
   * Creates a new SessionTracker instance.
   *
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for session queries.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
    // Consumed by handler methods in subsequent plans (CP-ST-01-plan-02+).
    void this.client
    void this.projectRoot
  }

  /**
   * Handles session lifecycle events from the OpenCode `event` hook.
   *
   * @param event - The raw hook input containing eventType, sessionID, and event payload.
   * @returns Promise that resolves when the event has been processed.
   *
   * @remarks
   * Event types handled:
   * - `session.created` — creates subdirectory + .md file for root sessions
   * - `session.idle` — updates session status to "idle"
   * - `session.deleted` — marks session status as "deleted"
   * - `session.error` — marks session status as "error"
   */
  async handleSessionEvent(_event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    // TODO(CP-ST-01-plan-02): Implement session lifecycle event handling.
    // Will use client.session.get() to distinguish root vs child sessions.
    // Root sessions → create .hivemind/session-tracker/{sessionID}/ directory + .md file.
    // Child sessions → no new subdirectory; file written under parent's subdir.
  }

  /**
   * Handles chat message events from the OpenCode `chat.message` hook.
   *
   * @param _input - The hook input containing sessionID, agent, model, messageID, variant.
   * @param _output - The hook output containing the message and parts.
   * @returns Promise that resolves when the message has been captured.
   *
   * @remarks
   * User messages are captured as `## USER (turn N)` sections.
   * Assistant messages are transformed into `main_l0_agent` blocks
   * with name, model, and thinking_duration metadata.
   */
  async handleChatMessage(
    _input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      messageID?: string
      variant?: string
    },
    _output: { message: unknown; parts: unknown[] },
  ): Promise<void> {
    // TODO(CP-ST-01-plan-03): Implement chat message capture.
    // User messages → append ## USER (turn N) to main session .md.
    // Assistant messages → transform to main_l0_agent block.
    // Skip thinking blocks.
  }

  /**
   * Handles tool execution events from the OpenCode `tool.execute.after` hook.
   *
   * @param _input - The hook input containing tool name, sessionID, callID, and args.
   * @param _output - The hook output containing title, output, and metadata.
   * @returns Promise that resolves when the tool invocation has been captured.
   *
   * @remarks
   * Per-tool pruning rules per SPEC.md Section 5.1:
   * - `skill` → input name + first header line of output only
   * - `read` → file path only; never capture file content (REQ-ST-05)
   * - `task` → description + subagent_type from input, task_id from output; triggers child .json creation
   * - other tools → input metadata only
   */
  async handleToolExecuteAfter(
    _input: { tool: string; sessionID: string; callID: string; args: unknown },
    _output: { title: string; output: unknown; metadata: unknown },
  ): Promise<void> {
    // TODO(CP-ST-01-plan-04): Implement tool capture.
    // Apply pruning rules per SPEC.md Section 5.1 capture rules table.
    // Task tool: extract task_id from output, trigger child .json creation
    //   via child-writer.ts.
  }

  /**
   * Initializes the session tracker module.
   *
   * Called once during plugin startup. Reads `project-continuity.json`
   * to build an in-memory session map for recovery purposes.
   *
   * @returns Promise that resolves when initialization is complete.
   */
  async initialize(): Promise<void> {
    // TODO(CP-ST-01-plan-02): Read project-continuity.json to build session map.
    // This is initialization, not recovery (per D-05).
  }

  /**
   * Performs cleanup when the plugin is shutting down.
   *
   * Ensures any in-flight writes are completed and resources are released.
   *
   * @returns Promise that resolves when cleanup is complete.
   */
  async cleanup(): Promise<void> {
    // TODO(CP-ST-01-plan-02): Ensure in-flight write queues are drained.
  }
}

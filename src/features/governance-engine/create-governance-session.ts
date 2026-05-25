import { tool } from "@opencode-ai/plugin"
import type { ToolDefinition } from "@opencode-ai/plugin"
import { z } from "zod"
import { execSync } from "node:child_process"

import {
  createSession,
  sendPrompt,
  showTuiToast,
  getSessionID,
  type OpenCodeClient,
} from "../../shared/session-api.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"

/**
 * Zod schema for the governance session tool input.
 *
 * Validates the three accepted fields:
 * - `agent` (required): Name of the agent to run the governance session.
 * - `brief` (required): Governance work brief injected as the initial prompt.
 * - `title` (optional): Custom title suffix for the session name.
 *   When omitted, defaults to `"governance"`.
 */
const GovernanceSessionInput = z.object({
  agent: z.string().min(1, { message: "agent is required" }),
  brief: z.string().min(1, { message: "brief is required" }),
  title: z.string().optional(),
})

/** Internal tool context shape exposed by the OpenCode plugin runtime. */
type ToolContext = {
  sessionID: string
  directory?: string
  worktree?: string
}

/**
 * Creates the `create-governance-session` custom tool.
 *
 * Factory pattern that accepts an OpenCode SDK client via closure
 * injection — the client is NOT read from ToolContext. This follows
 * the established convention from `execute-slash-command.ts` and
 * `delegate-task.ts`.
 *
 * The tool:
 * 1. Validates args via Zod schema (`agent`, `brief`, optional `title`)
 * 2. Commits current workspace state via git (best-effort, never throws)
 * 3. Creates a named child session with `hm-governance:` title prefix
 * 4. Injects governance context via `sendPrompt` on the new session
 * 5. Notifies the user via TUI toast
 * 6. Returns `{ sessionID, title }` on success
 *
 * @param client - The OpenCode SDK client instance (injected from plugin composition root).
 * @returns ToolDefinition for the create-governance-session tool.
 *
 * @example
 * ```typescript
 * // In plugin.ts:
 * import { createGovernanceSessionTool } from "./features/governance-engine/index.js"
 * // ...
 * tool: {
 *   "create-governance-session": createGovernanceSessionTool(client),
 * }
 * ```
 */
export function createGovernanceSessionTool(client: OpenCodeClient): ToolDefinition {
  const s = tool.schema

  return tool({
    description:
      "Creates a named child session with 'hm-governance:' title prefix, " +
      "injects governance context via prompt, commits workspace state via git, " +
      "and notifies the user via TUI toast. " +
      "Accepts 'agent' (required), 'brief' (required), and optional 'title'. " +
      "Returns { sessionID, title } on success.",
    args: {
      agent: s.string().describe("Agent name to run the governance session"),
      brief: s.string().describe("Governance work brief to inject as the initial prompt"),
      title: s.string().optional().describe("Optional custom title suffix for the session name"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      // --- Step 1: Parse and validate input ---
      const parsed = GovernanceSessionInput.safeParse(rawArgs)
      if (!parsed.success) {
        return renderToolResult(
          error(`[Harness] Invalid governance session input: ${z.prettifyError(parsed.error)}`),
        )
      }

      const args = parsed.data
      const sessionTitle = args.title
        ? `hm-governance:${args.agent}-${args.title}`
        : `hm-governance:${args.agent}-governance`

      // --- Step 2: Git commit (best-effort, REQ-06) ---
      try {
        const cwd = context.directory ?? context.worktree ?? process.cwd()
        execSync(
          `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
          { cwd, env: { ...process.env } },
        )
      } catch {
        // Best-effort: git failure must never propagate to the caller (T-24.3.1-02)
      }

      // --- Step 3: Create child session (REQ-03) ---
      let session: Record<string, unknown>
      try {
        session = await createSession(client, {
          parentID: context.sessionID,
          title: sessionTitle,
          directory: context.directory,
        })
      } catch (caughtError: unknown) {
        const msg = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(
          error(`[Harness] Failed to create governance session: ${msg}`),
        )
      }

      const sessionID = getSessionID(session)
      if (!sessionID) {
        return renderToolResult(
          error("[Harness] Session creation succeeded but no session ID was returned"),
        )
      }

      // --- Step 4: Inject governance brief as prompt (REQ-04) ---
      try {
        await sendPrompt(client, sessionID, {
          parts: [{ type: "text", text: args.brief }],
        })
      } catch (caughtError: unknown) {
        const msg = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(
          error(`[Harness] Governance session created but prompt injection failed: ${msg}`, {
            sessionID,
            title: sessionTitle,
          }),
        )
      }

      // --- Step 5: TUI notification (REQ-05) ---
      try {
        await showTuiToast(
          client,
          `✅ Governance session created: ${sessionTitle} (${sessionID})`,
          "success",
        )
      } catch {
        // Best-effort: toast failure must never fail the tool call
      }

      // --- Step 6: Return result (REQ-07) ---
      return renderToolResult(
        success(`[Harness] Governance session created: ${sessionTitle}`, {
          sessionID,
          title: sessionTitle,
        }),
      )
    },
  })
}

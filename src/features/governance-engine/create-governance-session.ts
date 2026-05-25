/**
 * Governance session tool factory.
 *
 * Creates a root session (no parentID) with a naming-service-generated title,
 * resolves the target agent via config reader, and dispatches governance
 * context via coordinator.dispatch() or falls back to raw sendPrompt.
 *
 * @module governance-engine/create-governance-session
 */

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
import { generateSessionTitle } from "../../shared/session-naming.js"
import { readGovernanceConfig, resolveAgentForBrief } from "./config-reader.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"

/**
 * Coordinator-like interface for agent dispatch.
 */
interface CoordinatorLike {
  dispatch(params: Record<string, unknown>): Promise<unknown>
}

/**
 * Zod schema for the governance session tool input.
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
 * injection and an optional coordinator for agent dispatch.
 *
 * @param client - The OpenCode SDK client instance.
 * @param coordinator - Optional coordinator for agent dispatch.
 * @returns ToolDefinition for the create-governance-session tool.
 */
export function createGovernanceSessionTool(
  client: OpenCodeClient,
  coordinator?: CoordinatorLike,
): ToolDefinition {
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

      // --- Step 2: Resolve agent from brief via config reader ---
      let resolvedAgent = args.agent
      try {
        const config = await readGovernanceConfig()
        resolvedAgent = resolveAgentForBrief(args.brief, config)
      } catch {
        // Config read failure is non-fatal — use provided agent
        resolvedAgent = args.agent
      }

      // --- Step 3: Generate title via naming service ---
      const sessionTitle = generateSessionTitle({
        framework: "hm",
        workflow: "governance",
        classification: "root",
        agent: resolvedAgent,
        purpose: (args.title || args.brief).slice(0, 40).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        depth: 0,
      })

      // --- Step 4: Git commit (best-effort) ---
      try {
        const cwd = context.directory ?? context.worktree ?? process.cwd()
        execSync(
          `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
          { cwd, env: { ...process.env } },
        )
      } catch {
        // Best-effort: git failure must never propagate to the caller
      }

      // --- Step 5: Create ROOT session (NO parentID) ---
      let session: Record<string, unknown>
      try {
        session = await createSession(client, {
          // NO parentID — creates a root session visible in session list
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

      // --- Step 6: Dispatch agent via coordinator or fall back to sendPrompt ---
      if (coordinator) {
        try {
          await coordinator.dispatch({
            agent: resolvedAgent,
            currentDepth: 0,
            parentSessionId: sessionID,
            prompt: args.brief,
            queueKey: `agent:${resolvedAgent}`,
            surface: "governance-dispatch",
            workingDirectory: context.directory ?? context.worktree ?? process.cwd(),
          })
        } catch (caughtError: unknown) {
          const msg = caughtError instanceof Error ? caughtError.message : String(caughtError)
          return renderToolResult(
            error(`[Harness] Governance session created but agent dispatch failed: ${msg}`, {
              sessionID,
              title: sessionTitle,
            }),
          )
        }
      } else {
        // Fallback: raw sendPrompt if no coordinator available
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
      }

      // --- Step 7: TUI notification ---
      try {
        await showTuiToast(
          client,
          `✅ Governance session created: ${sessionTitle} (${sessionID})`,
          "success",
        )
      } catch {
        // Best-effort: toast failure must never fail the tool call
      }

      // --- Step 8: Return result ---
      return renderToolResult(
        success(`[Harness] Governance session created: ${sessionTitle}`, {
          sessionID,
          title: sessionTitle,
        }),
      )
    },
  })
}

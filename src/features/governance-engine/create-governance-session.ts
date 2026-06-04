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
import { execFile } from "node:child_process"
import type { ExecFileOptions } from "node:child_process"

/**
 * Async wrapper around child_process.execFile.
 * Avoids util.promisify to remain mock-friendly in tests.
 */
function execFileAsync(command: string, args: string[], options?: ExecFileOptions): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (err, stdout, stderr) => {
      if (err) reject(err)
      else resolve({ stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

import {
  createSession,
  getSession,
  sendPrompt,
  showTuiToast,
  getSessionID,
  type OpenCodeClient,
} from "../../shared/session-api.js"
import { generateSessionTitle } from "../../shared/session-naming.js"
import {
  readGovernanceConfig,
  resolveAgentForBrief,
  validateNamingTitle,
} from "./config-reader.js"
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
      let governanceConfig: ReturnType<typeof readGovernanceConfig> | undefined
      try {
        governanceConfig = readGovernanceConfig()
        resolvedAgent = resolveAgentForBrief(args.brief, governanceConfig)
      } catch {
        // Config read failure is non-fatal — use provided agent
        resolvedAgent = args.agent
      }

      // --- Step 2.5: SR-05 Expand governance brief template from config ---
      let expandedBrief = args.brief
      try {
        if (!governanceConfig) {
          governanceConfig = readGovernanceConfig()
        }
        const govTemplate = governanceConfig.templates?.["governance-brief"]
        if (govTemplate?.content) {
          // Template format: "You are a governance {{role}}. Review the following: {{brief}}"
          expandedBrief = govTemplate.content
            .replace(/\{\{role\}\}/g, resolvedAgent)
            .replace(/\{\{brief\}\}/g, args.brief)
        }
      } catch {
        // Non-fatal — use raw brief if template expansion fails
        expandedBrief = args.brief
      }

      // --- Step 3: Generate title via naming service ---
      // Sanitize user input: strip all non-alphanumeric chars (except hyphens) to prevent
      // any injection vectors in git commit messages or session titles.
      const rawPurpose = (args.title || expandedBrief).slice(0, 40).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      const safePurpose = rawPurpose || "governance" // Fallback if sanitization strips everything
      const sessionTitle = generateSessionTitle({
        framework: "hm",
        workflow: "governance",
        classification: "root",
        agent: resolvedAgent,
        purpose: safePurpose,
        depth: 0,
      })

      // --- Step 3.5: SR-05 Naming validation (soft enforcement per Decision 6) ---
      try {
        if (!governanceConfig) {
          governanceConfig = readGovernanceConfig()
        }
        const namingStandards = governanceConfig.naming_standards
        if (namingStandards) {
          const isValid = validateNamingTitle(sessionTitle, namingStandards)
          if (!isValid) {
            // Soft enforcement (Decision 6): warn but don't block
            void client.app?.log?.({
              body: { service: "governance", level: "warn", message: `[Harness] Session title "${sessionTitle}" does not match naming standards` }
            })
          }
        }
      } catch {
        // Non-fatal — naming validation is soft enforcement
      }

      // --- Step 4: Git commit (best-effort, async) ---
      try {
        const cwd = context.directory ?? context.worktree ?? process.cwd()
        // Per REQ-03: scoped env allowlist matching buildMinimalEnv pattern — prevents
        // accidental exposure of API keys, tokens, or secrets to child git process
        const env = {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TERM: process.env.TERM,
          LANG: process.env.LANG,
          PWD: process.env.PWD,
          GIT_AUTHOR_NAME: "HiveMind",
          GIT_AUTHOR_EMAIL: "hivemind@local",
          GIT_COMMITTER_NAME: "HiveMind",
          GIT_COMMITTER_EMAIL: "hivemind@local",
        }
        // Stage all files
        await execFileAsync("git", ["add", "-A"], { cwd, env })
        // Commit
        await execFileAsync("git", ["commit", "-m", `phase(24.3.1): pre-governance handoff - ${sessionTitle}`, "--no-verify"], { cwd, env })
      } catch (err) {
        // Best-effort: git failure must never propagate to the caller.
        // Log at debug level for troubleshooting without blocking the workflow.
        void client.app?.log?.({
          body: { service: "governance", level: "debug", message: `[Harness] Git commit failed: ${err instanceof Error ? err.message : String(err)}` }
        })
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

      // --- Step 6: Inherit model from current session ---
      let inheritedModel: { providerID: string; modelID: string } | undefined
      try {
        const currentSession = await getSession(client, context.sessionID)
        const raw = currentSession as Record<string, unknown>
        const providerID = raw.providerID ?? (raw as Record<string, unknown>).providerId ?? (raw as Record<string, unknown>).provider
        const modelID = raw.modelID ?? (raw as Record<string, unknown>).modelId ?? raw.model
        if (typeof providerID === "string" && typeof modelID === "string") {
          inheritedModel = { providerID, modelID }
        }
      } catch {
        // Non-fatal — coordinator will resolve model from agent config
      }

      // --- Step 7: Dispatch agent via coordinator or fall back to sendPrompt ---
      if (coordinator) {
        try {
          await coordinator.dispatch({
            agent: resolvedAgent,
            currentDepth: 0,
            parentSessionId: sessionID,
            prompt: expandedBrief,
            queueKey: `agent:${resolvedAgent}`,
            surface: "governance-dispatch",
            workingDirectory: context.directory ?? context.worktree ?? process.cwd(),
            ...(inheritedModel ? { model: inheritedModel } : {}),
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
            parts: [{ type: "text", text: expandedBrief }],
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

      // --- Step 8: TUI notification ---
      try {
        await showTuiToast(
          client,
          `✅ Governance session created: ${sessionTitle} (${sessionID})`,
          "success",
        )
      } catch {
        // Best-effort: toast failure must never fail the tool call
      }

      // --- Step 9: Return result ---
      return renderToolResult(
        success(`[Harness] Governance session created: ${sessionTitle}`, {
          sessionID,
          title: sessionTitle,
        }),
      )
    },
  })
}

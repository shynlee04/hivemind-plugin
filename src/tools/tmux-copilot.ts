/**
 * Hivemind tmux-copilot — co-pilot affordance for the tmux visual orchestration layer.
 *
 * Phase 43 design notes (D-43-02, REQ-04, REQ-05, REQ-06):
 * - 4 actions: send-keys, list-panes, compute-grid, respawn
 * - Discriminated union Zod schema; each branch has its own payload shape
 * - Permission-gated: only orchestrator-tier agents may invoke (T-43-05)
 *   The OpenCode SDK `tool()` helper does NOT support a `requiresPermission`
 *   field — the gate is enforced at execute() runtime via context.agent.
 *   REQUIRES_PERMISSIONS is exported as a module const so future
 *   harness-level enforcement layers can consume it.
 * - Graceful unavailable: when the fork is not wired, returns
 *   {available: false, reason: "fork-not-wired"} instead of throwing.
 *   This is the T-43-09 mitigation (DoS) — no exception escapes.
 * - All adapter calls wrapped in try/catch so tmux/fork failures produce
 *   structured error results rather than uncaught exceptions.
 */
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"
import { getForkSessionManager, type PaneState, type PaneTreeNode, type SplitCommand } from "../features/tmux/fork-bridge.js"
import { renderToolResult } from "../shared/tool-helpers.js"

// ---------------------------------------------------------------------------
// Permission gate (T-43-05 mitigation)
// ---------------------------------------------------------------------------

/**
 * Single source of truth for orchestrator-tier agents permitted to invoke
 * this tool. Each entry pairs an agent name with its permission tier. Both
 * `REQUIRES_PERMISSIONS` (tier list, exported for future harness-level
 * enforcement layers) and `ORCHESTRATOR_AGENT_NAMES` (the runtime gate
 * set) are derived from this table so adding a new orchestrator-tier agent
 * only requires updating one place.
 *
 * Add a new orchestrator-tier agent by appending an entry here — no other
 * change is required.
 */
const ORCHESTRATOR_AGENTS = [
  { name: "hm-l0-orchestrator", tier: "orchestrator" },
  { name: "hm-orchestrator", tier: "orchestrator" },
  { name: "hf-l0-orchestrator", tier: "orchestrator" },
  { name: "hf-l1-coordinator", tier: "orchestrator" },
] as const

/**
 * Exported so Hivemind can layer future authorization checks on top of
 * the tool's runtime gate. Derived from ORCHESTRATOR_AGENTS — do NOT
 * hardcode tier names here directly.
 */
export const REQUIRES_PERMISSIONS = [
  ...new Set(ORCHESTRATOR_AGENTS.map((a) => a.tier)),
] as const

const ORCHESTRATOR_AGENT_NAMES = new Set<string>(
  ORCHESTRATOR_AGENTS.map((a) => a.name),
)

// ---------------------------------------------------------------------------
// Zod schema — discriminated union of 4 actions
// ---------------------------------------------------------------------------

const PaneTreeNodeSchema: z.ZodType<PaneTreeNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    children: z.array(PaneTreeNodeSchema).optional(),
  }),
)

const SendKeysActionSchema = z.object({
  action: z.literal("send-keys"),
  paneId: z.string().min(1),
  text: z.string(),
  literal: z.boolean().optional(),
})

const ListPanesActionSchema = z.object({
  action: z.literal("list-panes"),
  mainPaneId: z.string().optional(),
})

const ComputeGridActionSchema = z.object({
  action: z.literal("compute-grid"),
  tree: PaneTreeNodeSchema,
})

const RespawnActionSchema = z.object({
  action: z.literal("respawn"),
  sessionId: z.string().min(1),
})

const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
  SendKeysActionSchema,
  ListPanesActionSchema,
  ComputeGridActionSchema,
  RespawnActionSchema,
])

// ---------------------------------------------------------------------------
// Result union (exported for tests + downstream consumers)
// ---------------------------------------------------------------------------

export type TmuxCopilotResult =
  | { available: false; reason: "fork-not-wired" | "tmux-not-installed" }
  | { sent: true; paneId: string }
  | { sent: false; paneId: string; error: { message: string } }
  | { panes: PaneState[] }
  | { commands: SplitCommand[] }
  | { respawned: true; paneId: string }
  | { respawned: false; error: { reason: string } }
  | { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
  | { error: { kind: "permission-denied"; agent: string } }

// ---------------------------------------------------------------------------
// Tool context — minimal shape (mirrors delegation-status.ts pattern)
// ---------------------------------------------------------------------------

type ToolContext = { sessionID?: string; agent?: string }

// ---------------------------------------------------------------------------
// Tool export
// ---------------------------------------------------------------------------

const s = tool.schema

export const tmuxCopilotTool: ReturnType<typeof tool> = tool({
  description:
    "Co-pilot affordance for the tmux visual orchestration layer. Sends keys, " +
    "lists panes, computes split grids, and respawns closed-pane sessions. " +
    "Orchestrator-tier only.",
  // `args` is a structural hint for the framework (uses SDK-bundled
  // tool.schema to satisfy the type contract); we do the canonical
  // parse inside execute() via TmuxCopilotActionSchema.safeParse so we
  // can return graceful {error: {kind: "invalid-input", issues}} on
  // parse failure instead of relying on the framework to throw.
  args: {
    action: s.string().describe("One of: send-keys, list-panes, compute-grid, respawn"),
    paneId: s.string().optional().describe("(send-keys) target tmux pane id"),
    text: s.string().optional().describe("(send-keys) text to send"),
    literal: s.boolean().optional().describe("(send-keys) if true, send as literal text"),
    mainPaneId: s.string().optional().describe("(list-panes) optional main pane to scope listing"),
    tree: s.unknown().optional().describe("(compute-grid) PaneTreeNode — recursive {id, children?}"),
    sessionId: s.string().optional().describe("(respawn) session id to respawn"),
  },
  async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
    // 1. Permission gate
    const callerAgent = context.agent
    if (!callerAgent || !ORCHESTRATOR_AGENT_NAMES.has(callerAgent)) {
      return renderToolResult({
        error: { kind: "permission-denied", agent: callerAgent ?? "unknown" },
      })
    }

    // 2. Input validation
    const parsed = TmuxCopilotActionSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return renderToolResult({
        error: { kind: "invalid-input", issues: parsed.error.issues },
      })
    }
    const input = parsed.data

    // 3. Bridge check
    const adapter = getForkSessionManager()
    if (adapter === null) {
      return renderToolResult({ available: false, reason: "fork-not-wired" })
    }

    // 4. Dispatch
    switch (input.action) {
      case "send-keys": {
        try {
          await adapter.sendKeys(input.paneId, input.text, input.literal ?? false)
          return renderToolResult({ sent: true, paneId: input.paneId })
        } catch (err) {
          return renderToolResult({
            sent: false,
            paneId: input.paneId,
            error: { message: err instanceof Error ? err.message : String(err) },
          })
        }
      }
      case "list-panes": {
        try {
          const panes = await adapter.listPanes(input.mainPaneId)
          return renderToolResult({ panes })
        } catch (err) {
          // Classify error kind so callers can distinguish installation
          // problems (user-fixable) from transient tmux server issues
          // (may be retryable) from genuine bugs.
          const message = err instanceof Error ? err.message : String(err)
          const code = (err as NodeJS.ErrnoException | null)?.code
          const isNotInstalled = code === "ENOENT" || /enoent/i.test(message)
          const isTimeout = code === "ETIMEDOUT" || /timeout/i.test(message)
          if (isNotInstalled) {
            return renderToolResult({ available: false, reason: "tmux-not-installed" })
          }
          if (isTimeout) {
            return renderToolResult({ available: false, reason: "tmux-timeout" })
          }
          return renderToolResult({
            available: false,
            reason: "tmux-error",
            error: { message },
          })
        }
      }
      case "compute-grid": {
        const commands = adapter.createPaneGridPlanner().computeSplitSequence(input.tree)
        return renderToolResult({ commands })
      }
      case "respawn": {
        const result = await adapter.respawnIfKnown(input.sessionId)
        if (result === null) {
          return renderToolResult({
            respawned: false,
            error: { reason: "session-not-closed" },
          })
        }
        return renderToolResult({ respawned: true, paneId: result.paneId })
      }
    }
  },
})

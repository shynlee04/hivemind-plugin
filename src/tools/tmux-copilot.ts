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
 * - Graceful unavailable: when the in-tree integration is not wired,
 *   returns {available: false, reason: "tmux-not-wired"} instead of
 *   throwing. This is the T-43-09 mitigation (DoS) — no exception escapes.
 * - All adapter calls wrapped in try/catch so tmux/in-tree failures
 *   produce structured error results rather than uncaught exceptions.
 *
 * Phase 51 migration: the consumer now uses `getSessionManagerAdapter`
 * (from `../features/tmux/types.js`) instead of the deleted
 * `getForkSessionManager` (from `../features/tmux/fork-bridge.js`).
 * The bridge pattern (module-level mutable state populated by the
 * integration factory at plugin-init time) is preserved.
 */
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"
import {
  getSessionManagerAdapter,
  setSessionManagerAdapter,
  type PaneState,
  type PaneTreeNode,
  type SplitCommand,
} from "../features/tmux/types.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { getManualOverrideState, setManualOverrideState } from "../features/session-tracker/index.js"

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
  { name: "hf-coordinator", tier: "orchestrator" },
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

// P58 G4 (REQ-58-04): forward-prompt — main-agent-to-delegate prompt with sentinel
const ForwardPromptActionSchema = z.object({
  action: z.literal("forward-prompt"),
  paneId: z.string().min(1),
  text: z.string(),
  literal: z.boolean().optional(),
})

// P58 G5 (REQ-58-05): take-over — set manualOverride=true on a session
const TakeOverActionSchema = z.object({
  action: z.literal("take-over"),
  sessionId: z.string().min(1),
  paneId: z.string().min(1),
})

// P58 G5 (REQ-58-05): release — clear manualOverride=false on a session
const ReleaseActionSchema = z.object({
  action: z.literal("release"),
  sessionId: z.string().min(1),
})

const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
  SendKeysActionSchema,
  ListPanesActionSchema,
  ComputeGridActionSchema,
  RespawnActionSchema,
  ForwardPromptActionSchema,  // P58 G4
  TakeOverActionSchema,        // P58 G5
  ReleaseActionSchema,         // P58 G5
])

// ---------------------------------------------------------------------------
// Result union (exported for tests + downstream consumers)
// ---------------------------------------------------------------------------

export type TmuxCopilotResult =
  | { available: false; reason: "tmux-not-wired" | "tmux-not-installed" | "tmux-timeout" }
  | { available: false; reason: "tmux-error"; error: { message: string } }
  | { sent: true; paneId: string }
  | { sent: false; paneId: string; error: { message: string } }
  | { panes: PaneState[] }
  | { commands: SplitCommand[] }
  | { respawned: true; paneId: string }
  | { respawned: false; error: { reason: string } }
  | { paneId: string; deliveredAt: string; byteLength: number }  // P58 G4: forward-prompt success
  | { suppressed: true; reason: "manualOverride" | "session-not-found"; paneId: string; textPreview: string; evaluatedAt: string }  // P58 G5
  | { sessionId: string; paneId: string; takenBy: string; takenAt: string }  // P58 G5: take-over success
  | { sessionId: string; releasedAt: string }  // P58 G5: release success
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
    const adapter = getSessionManagerAdapter()
    if (adapter === null) {
      return renderToolResult({ available: false, reason: "tmux-not-wired" })
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
      case "forward-prompt": {
        // P58 G5 (REQ-58-05, D-58-12): suppression check FIRST — if manualOverride
        // is set, return suppressed envelope without sending keys.
        const sessionId = context.sessionID
        const overrideState = getManualOverrideState(sessionId)
        if (overrideState?.manualOverride === true) {
          return renderToolResult({
            suppressed: true,
            reason: "manualOverride",
            paneId: input.paneId,
            textPreview: input.text.slice(0, 80),
            evaluatedAt: new Date().toISOString(),
          })
        }
        // P58 G4 (REQ-58-04, D-58-09/10): prepend sentinel, then sendKeys.
        const sentinel = `[orchestrator-forward ${new Date().toISOString()}]\n`
        const payload = sentinel + input.text
        const byteLength = Buffer.byteLength(payload, "utf8")
        try {
          await adapter.sendKeys(input.paneId, payload, input.literal ?? true)
          return renderToolResult({
            paneId: input.paneId,
            deliveredAt: new Date().toISOString(),
            byteLength,
          })
        } catch (err) {
          return renderToolResult({
            sent: false,
            paneId: input.paneId,
            error: { message: err instanceof Error ? err.message : String(err) },
          })
        }
      }
      case "take-over": {
        // P58 G5 (REQ-58-05, D-58-11): set manualOverride=true with audit fields.
        setManualOverrideState(input.sessionId, {
          manualOverride: true,
          takenAt: Date.now(),
          takenBy: "human-operator",
        })
        return renderToolResult({
          sessionId: input.sessionId,
          paneId: input.paneId,
          takenBy: "human-operator",
          takenAt: new Date().toISOString(),
        })
      }
      case "release": {
        // P58 G5 (REQ-58-05): clear manualOverride=false.
        setManualOverrideState(input.sessionId, { manualOverride: false })
        return renderToolResult({
          sessionId: input.sessionId,
          releasedAt: new Date().toISOString(),
        })
      }
    }
  },
})

// ---------------------------------------------------------------------------
// Test seam (P58 PLAN-07, Gap 3 fix)
// ---------------------------------------------------------------------------

/**
 * P58 PLAN-07 (Gap 3 fix): BATS-friendly test seam that injects a mock
 * `SessionManagerAdapter` (alias "TmuxMultiplexer") so the tool can run
 * without a real tmux session. Delegates to the existing
 * `setSessionManagerAdapter()` at `src/features/tmux/types.ts`
 * (already wired by the P51 migration per tmux-copilot.ts:18-22).
 *
 * BATS tests should:
 *   1. Construct a mock with a `sendKeys` method that captures calls
 *   2. Call `__setTmuxMultiplexerForTesting(mock)` before invoking the tool
 *   3. Invoke the tool action
 *   4. Assert the mock captured the expected call
 *   5. Restore via `__setTmuxMultiplexerForTesting(null)` in teardown
 *
 * The seam is intentionally NOT prefixed with `_` (which is the convention
 * for "private" in some codebases) because the leading double-underscore
 * `__` is the project's TEST-ONLY marker (per the
 * `__getDelegationsForTesting` pattern at `src/coordination/delegation/manager.ts`).
 *
 * NOT for production code. Production wiring still goes through
 * `src/features/tmux/integration.ts` which calls
 * `setSessionManagerAdapter()` directly.
 */
export function __setTmuxMultiplexerForTesting(mux: unknown): void {
  setSessionManagerAdapter(mux as Parameters<typeof setSessionManagerAdapter>[0])
}

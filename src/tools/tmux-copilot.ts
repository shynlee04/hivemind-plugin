/**
 * Hivemind tmux-copilot — co-pilot affordance for the tmux visual orchestration layer.
 *
 * Phase 43 design notes (D-43-02, REQ-04, REQ-05, REQ-06):
 * - 4 actions: send-keys, list-panes, compute-grid, respawn
 * - Discriminated union Zod schema; each branch has its own payload shape
 * - Permission-gated: orchestrator-tier agents may invoke any action (T-43-05)
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
 *
 * Phase 58.8 (P58 gap-fix S2, REQ-58-08): a second tier of callers
 * (`USER_SESSION` — agent name `user` / `__user__`) is permitted past
 * the gate, but only for a restricted action subset (D-58-22 LOCKED):
 * take-over, release, peek. All other actions remain orchestrator-only.
 * This closes the S2 symptom where a human operator had no
 * orchestrator-context affordance to inspect or intervene on a
 * delegate pane.
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
// P58.8 (S2, REQ-58-08): USER_SESSION tier — second tier of callers that
// may invoke a restricted subset of tmux-copilot actions.
//
// Rationale (D-58-22 LOCKED): the user / human operator needs read-side
// affordances against delegate panes (peek capture, take over a session
// for manual intervention, release back to auto-dispatch) but does NOT
// need write-side affordances (send-keys, list-panes, compute-grid,
// respawn, forward-prompt) — those remain orchestrator-only because they
// mutate tmux server state on behalf of the automation pipeline.
//
// Two sentinel agent names are accepted to accommodate OpenCode's
// heterogeneous naming of the human caller:
//   - "user"      — runtime-emitted by the SDK user-tier
//   - "__user__"  — internal convention used by handoff/test seams
// ---------------------------------------------------------------------------

const USER_SESSION_AGENT_NAMES = new Set<string>(["user", "__user__"])

/**
 * Action set invokable from USER_SESSION tier (D-58-22 LOCKED).
 * Anything outside this set is rejected with `permission-denied` when the
 * caller is a user-tier agent, mirroring the orchestrator-tier guard.
 */
const USER_SESSION_ALLOWED_ACTIONS = new Set<string>([
  "take-over",
  "release",
  "peek",
])

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

// P58.8 (S2, REQ-58-08): peek — read the most recent capture-pane
// content for a pane id without re-running the tmux CLI. Surfaces an
// affordance for the USER_SESSION tier to inspect a delegate pane
// between dispatches. If the in-tree integration has not yet cached
// a capture for the pane, returns a zero-byte envelope (NOT an
// error) so callers can distinguish "no content yet" from "lookup
// failed".
const PeekActionSchema = z.object({
  action: z.literal("peek"),
  paneId: z.string().min(1),
})

const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
  SendKeysActionSchema,
  ListPanesActionSchema,
  ComputeGridActionSchema,
  RespawnActionSchema,
  ForwardPromptActionSchema,  // P58 G4
  TakeOverActionSchema,        // P58 G5
  ReleaseActionSchema,         // P58 G5
  PeekActionSchema,            // P58.8 S2 (REQ-58-08)
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
  | { paneId: string; content: string; capturedAt: string; byteLength: number }  // P58.8 S2: peek success (empty content when no capture cached)
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
    "lists panes, computes split grids, respawns closed-pane sessions, " +
    "forwards prompts to delegates, and surfaces session takeover/release/" +
    "peek affordances for the human operator. " +
    "Orchestrator-tier may invoke all actions; USER_SESSION tier may invoke " +
    "take-over, release, peek only (D-58-22 LOCKED).",
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
    const isOrchestrator = callerAgent !== undefined && ORCHESTRATOR_AGENT_NAMES.has(callerAgent)
    const isUserSession = callerAgent !== undefined && USER_SESSION_AGENT_NAMES.has(callerAgent)
    if (!isOrchestrator && !isUserSession) {
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

    // 2.5 Per-tier action restriction (P58.8 S2, D-58-22 LOCKED).
    // USER_SESSION callers may ONLY invoke the actions enumerated in
    // USER_SESSION_ALLOWED_ACTIONS. All other actions remain
    // orchestrator-only. This keeps write-side affordances (send-keys,
    // forward-prompt, list-panes, compute-grid, respawn) out of the
    // human operator's reach while preserving read/control
    // affordances (peek, take-over, release).
    if (isUserSession && !USER_SESSION_ALLOWED_ACTIONS.has(input.action)) {
      return renderToolResult({
        error: { kind: "permission-denied", agent: callerAgent ?? "unknown" },
      })
    }

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
      case "peek": {
        // P58.8 S2 (REQ-58-08): read the most recent capture-pane record
        // for the requested pane. Uses the optional `getLatestCapture`
        // method on the adapter (added by S1, types.ts:160-161). When
        // the adapter is a BATS mock without `getLatestCapture`, or
        // when no capture has been cached yet, we return a zero-byte
        // envelope with `capturedAt` = now() — NOT an error — so
        // callers can distinguish "no content yet" from "lookup
        // failed" without coupling to the bridge lifecycle.
        const capture = adapter.getLatestCapture?.(input.paneId) ?? null
        const content = capture?.content ?? ""
        const byteLength = capture?.byteLength ?? Buffer.byteLength(content, "utf8")
        return renderToolResult({
          paneId: input.paneId,
          content,
          capturedAt: capture?.capturedAt
            ? new Date(capture.capturedAt).toISOString()
            : new Date().toISOString(),
          byteLength,
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

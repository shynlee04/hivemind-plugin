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
import { resolveSessionToPaneId, getSendPrompt, getSessionMessagesFetcher, getSessionPaneRegistryEntries } from "../features/tmux/types.js"

// ---------------------------------------------------------------------------
// Permission gate (T-43-05 mitigation, P59 A1 fix)
// ---------------------------------------------------------------------------

/**
 * P59 (A1): Tier-based permission model — replaces the hardcoded 4-agent
 * whitelist with a config-based approach. Three tiers:
 *
 * - `orchestrator`: Full access (all actions). Maps to the 4 original
 *   orchestrator agent names + any agent with role: "orchestrator".
 * - `observer`: Read-only child monitoring. Any agent that dispatches a
 *   child session (executor, planner, debugger, etc.) is granted peek
 *   and list-panes on its own session tree so it can monitor child progress.
 * - `user`: Terminal interaction. The human operator (agent name "user"
 *   or "__user__") gets take-over, release, peek, and list-panes.
 *
 * P59 A1 widens the first gate: instead of rejecting all agents outside the
 * hardcoded 4, we let any agent through and then constrain by action per
 * tier. This ensures parent agents of ANY type can peek at their own child
 * panes.
 */

// Tier-based agent-name restrictions removed in P59 R1.
// Every agent (including "build", "hm-executor", gsd-debugger, etc.)
// has access to ALL copilot actions. The main session agent MUST be
// able to take-over, peek, and intervene on its own children.

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
// P59 R2: added optional `prompt` + `promptMode` — injects structured prompt
// into the child session via SDK. `promptMode: "steer"` (default) uses
// noReply:true (child absorbs context without responding). `promptMode: "respond"`
// uses noReply:false (child processes and responds as a new user message).
const TakeOverActionSchema = z.object({
  action: z.literal("take-over"),
  sessionId: z.string().min(1),
  paneId: z.string().min(1),
  prompt: z.string().optional(),
  promptMode: z.enum(["steer", "respond"]).optional().default("steer"),
})

// P58 G5 (REQ-58-05): release — clear manualOverride=false on a session
const ReleaseActionSchema = z.object({
  action: z.literal("release"),
  sessionId: z.string().min(1),
})

// P58.8 S2 (REQ-58-08): peek — user-tier read access to capture-pane content
const PeekActionSchema = z.object({
  action: z.literal("peek"),
  paneId: z.string().min(1),
  maxBytes: z.number().int().positive().optional(),
  // P59 R4: format — "summary" (default) returns structured activity
  // summary (tool calls, assistant messages, files); "raw" returns
  // literal pane content as before.
  format: z.enum(["summary", "raw"]).optional().default("summary"),
})

// P59 A2: peek-by-session — accepts sessionId instead of paneId, resolves
// via the session→paneId registry. Uses the same peek logic internally.
const PeekBySessionActionSchema = z.object({
  action: z.literal("peek-by-session"),
  sessionId: z.string().min(1),
  maxBytes: z.number().int().positive().optional(),
  format: z.enum(["summary", "raw"]).optional().default("summary"),
})

const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
  SendKeysActionSchema,
  ListPanesActionSchema,
  ComputeGridActionSchema,
  RespawnActionSchema,
  ForwardPromptActionSchema,  // P58 G4
  TakeOverActionSchema,        // P58 G5
  ReleaseActionSchema,         // P58 G5
  PeekActionSchema,            // P58.8 S2
  PeekBySessionActionSchema,   // P59 A2
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
  | { sessionId: string; paneId: string; content: string; capturedAt: string; byteLength: number }  // P59 A2: peek-by-session success
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
    "All agents may invoke all actions. Agent-name-based denial removed in P59 R1.",
  // `args` is a structural hint for the framework (uses SDK-bundled
  // tool.schema to satisfy the type contract); we do the canonical
  // parse inside execute() via TmuxCopilotActionSchema.safeParse so we
  // can return graceful {error: {kind: "invalid-input", issues}} on
  // parse failure instead of relying on the framework to throw.
  args: {
    action: s.string().describe("One of: send-keys, list-panes, compute-grid, respawn, take-over, release, peek, forward-prompt"),
    paneId: s.string().optional().describe("(send-keys|forward-prompt|peek) target tmux pane id"),
    text: s.string().optional().describe("(send-keys|forward-prompt) text to send"),
    literal: s.boolean().optional().describe("(send-keys|forward-prompt) if true, send as literal text"),
    mainPaneId: s.string().optional().describe("(list-panes) optional main pane to scope listing"),
    tree: s.unknown().optional().describe("(compute-grid) PaneTreeNode — recursive {id, children?}"),
    sessionId: s.string().optional().describe("(respawn|take-over|release|peek-by-session) session id"),
    maxBytes: s.number().optional().describe("(peek|peek-by-session) cap the returned content length"),
  },
  async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
    // 1. Permission gate — every agent is allowed all actions.
    //    Agent-name-based denial was removed in P59 R1 because the main
    //    session agent (e.g. "build") MUST be able to take-over, peek,
    //    list-panes, and intervene on its own child sessions. The only
    //    invalid caller is a null/undefined agent — that is rejected.
    const callerAgent = context.agent
    if (!callerAgent) {
      return renderToolResult({
        error: { kind: "permission-denied", agent: "unknown" },
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
        //
        // [P58.8 S2 — D-58-22 DEFER] `forward-prompt` is INTENTIONALLY
        // NOT in USER_SESSION_ALLOWED_ACTIONS. The human operator
        // takes a delegate via `take-over` (which sets manualOverride)
        // and then types directly into the pane via their own tmux
        // client. The `forward-prompt` action remains orchestrator-only
        // because (a) it pre-pends a `[orchestrator-forward ...]`
        // sentinel that contaminates the delegate's transcript with
        // an automation-source marker, and (b) bypassing the
        // suppression check would let USER_SESSION race past a
        // take-over the operator has not yet completed. If a future
        // requirement needs USER_SESSION to inject text, route it
        // through `send-keys` (which the operator can re-enable under
        // a separate D-XX LOCKED decision) — do NOT add `forward-prompt`
        // to USER_SESSION_ALLOWED_ACTIONS without re-validating D-58-22.
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
        // P59 R2: if `prompt` is provided, inject it into the child session's
        // conversation via the module-level sendPrompt function (wired from
        // plugin.ts using client.session.prompt).
        setManualOverrideState(input.sessionId, {
          manualOverride: true,
          takenAt: Date.now(),
          takenBy: "human-operator",
        })

        let promptDelivered = false
        let promptError: string | undefined
        if (input.prompt) {
          const sendPrompt = getSendPrompt()
          if (sendPrompt) {
            try {
              await sendPrompt(input.sessionId, input.prompt, {
                noReply: input.promptMode === "steer",
              })
              promptDelivered = true
            } catch (err) {
              promptError = err instanceof Error ? err.message : String(err)
            }
          } else {
            promptError = "sendPrompt not wired"
          }
        }

        return renderToolResult({
          sessionId: input.sessionId,
          paneId: input.paneId,
          takenBy: "human-operator",
          takenAt: new Date().toISOString(),
          ...(input.prompt ? { promptDelivered, promptMode: input.promptMode, ...(promptError ? { promptError } : {}) } : {}),
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
        // P59 R4: default to "summary" mode which returns structured
        // activity (tool calls, assistant messages, file changes) instead
        // of just raw pane content. Use format: "raw" to get the literal
        // pane content as before.
        if (input.format === "raw") {
          const capture = adapter.getLatestCapture?.(input.paneId) ?? null
          const content = capture?.content ?? ""
          const byteLength = capture?.byteLength ?? Buffer.byteLength(content, "utf8")
          return renderToolResult({
            paneId: input.paneId,
            format: "raw" as const,
            content,
            capturedAt: capture?.capturedAt
              ? new Date(capture.capturedAt).toISOString()
              : new Date().toISOString(),
            byteLength,
          })
        }
        // Summary mode: fetch messages via the module-level fetcher wired
        // from plugin.ts. Resolve paneId → sessionId via the registry,
        // then call the fetcher.
        const sessionId = getSessionPaneRegistryEntries()
          .find(([, pane]) => pane === input.paneId)?.[0]
        if (!sessionId) {
          return renderToolResult({
            paneId: input.paneId,
            format: "summary" as const,
            activity: {
              messageCount: 0,
              toolCalls: [],
              lastAssistantMessage: null,
              files: [],
              note: "No session registered for this paneId. Use peek-by-session if you have a sessionId.",
            },
          })
        }
        return buildSessionSummary(sessionId, input.maxBytes)
      }
      case "peek-by-session": {
        // P59 A2: resolve sessionId → paneId via the registry, then
        // delegate to the same peek logic as the regular peek action.
        const resolvedPaneId = resolveSessionToPaneId(input.sessionId)
        if (!resolvedPaneId) {
          return renderToolResult({
            error: {
              kind: "invalid-input" as const,
              issues: [{ code: "custom", message: `No paneId registered for session ${input.sessionId}`, path: ["sessionId"] } as unknown as z.ZodIssue],
            },
          })
        }
        if (input.format === "raw") {
          const sessionCapture = adapter.getLatestCapture?.(resolvedPaneId) ?? null
          const sessionContent = sessionCapture?.content ?? ""
          const sessionByteLength = sessionCapture?.byteLength ?? Buffer.byteLength(sessionContent, "utf8")
          return renderToolResult({
            sessionId: input.sessionId,
            paneId: resolvedPaneId,
            format: "raw" as const,
            content: input.maxBytes && sessionContent.length > input.maxBytes
              ? sessionContent.slice(-input.maxBytes)
              : sessionContent,
            capturedAt: sessionCapture?.capturedAt
                ? new Date(sessionCapture.capturedAt).toISOString()
                : new Date().toISOString(),
            byteLength: sessionByteLength,
          })
        }
        // Summary mode: fetch messages and build structured activity
        return buildSessionSummary(input.sessionId, input.maxBytes)
      }
    }
  },
})

// ---------------------------------------------------------------------------
// P59 R4: buildSessionSummary — fetches session messages and returns a
// structured activity summary (tool calls, last assistant message, files
// touched) instead of just raw pane content. This is what peek returns
// by default — it answers "how far has the sub session gotten" without
// forcing the caller to parse raw TUI text.
// ---------------------------------------------------------------------------

async function buildSessionSummary(sessionId: string, maxBytes?: number): Promise<string> {
  const resolvedPaneId = resolveSessionToPaneId(sessionId)
  const fetcher = getSessionMessagesFetcher()
  if (!fetcher) {
    return renderToolResult({
      sessionId,
      paneId: resolvedPaneId,
      format: "summary" as const,
      activity: {
        messageCount: 0,
        toolCalls: [],
        lastAssistantMessage: null,
        files: [],
        note: "Session messages fetcher not wired. Peek summary unavailable.",
      },
    })
  }
  const messages = await fetcher(sessionId, 100)

  // P59 R4.1: capture ALL activity types, not just tool calls. This
  // answers "how far has the sub session gotten" honestly. We surface:
  //   - toolCalls: tools with names (read, write, bash, etc.)
  //   - bashExecutions: bash commands specifically (with the command)
  //   - fileReads: read tool invocations (with file path)
  //   - fileWrites: write/edit tool invocations (with file path)
  //   - thoughts: assistant messages that are pure reasoning
  //   - lastAssistantMessage: most recent text content from assistant
  //   - files: deduplicated set of file paths touched
  const toolCalls: Array<{ tool: string; args: string[]; timestamp?: number; hasResult?: boolean }> = []
  const bashExecutions: Array<{ command: string; timestamp?: number }> = []
  const fileReads: Array<{ path: string; timestamp?: number }> = []
  const fileWrites: Array<{ path: string; timestamp?: number }> = []
  let thoughtCount = 0

  for (const m of messages) {
    if (m.toolName) {
      const args = m.toolArgs ? Object.keys(m.toolArgs) : []
      const argValues = m.toolArgs ? Object.values(m.toolArgs).map((v) => String(v)) : []
      toolCalls.push({ tool: m.toolName, args, timestamp: m.timestamp, hasResult: m.toolResult !== undefined })
      if (m.toolName === "bash" || m.toolName === "shell") {
        const cmd = argValues.find((v) => v.length > 3) ?? argValues[0] ?? ""
        bashExecutions.push({ command: cmd, timestamp: m.timestamp })
      }
      if (m.toolName === "read" || m.toolName === "read_file") {
        const path = argValues.find((v) => v.includes("/") || v.includes("."))
        if (path) fileReads.push({ path, timestamp: m.timestamp })
      }
      if (m.toolName === "write" || m.toolName === "edit" || m.toolName === "create_file") {
        const path = argValues.find((v) => v.includes("/") || v.includes("."))
        if (path) fileWrites.push({ path, timestamp: m.timestamp })
      }
    } else if (m.isThought) {
      thoughtCount++
    }
  }

  const allFiles = Array.from(
    new Set(
      [...fileReads, ...fileWrites]
        .map((f) => f.path)
        .filter((p) => typeof p === "string" && p.length > 0)
    )
  )

  // Find the last assistant message with text content
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.hasText)
  const lastAssistantMessage = lastAssistant
    ? maxBytes && lastAssistant.content.length > maxBytes
      ? lastAssistant.content.slice(0, maxBytes) + "…"
      : lastAssistant.content
    : null

  return renderToolResult({
    sessionId,
    paneId: resolvedPaneId,
    format: "summary" as const,
    activity: {
      messageCount: messages.length,
      toolCallCount: toolCalls.length,
      thoughtCount,
      toolCalls: toolCalls.slice(-15),
      bashExecutions: bashExecutions.slice(-10),
      fileReads: fileReads.slice(-10),
      fileWrites: fileWrites.slice(-10),
      lastAssistantMessage,
      files: allFiles,
    },
  })
}

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

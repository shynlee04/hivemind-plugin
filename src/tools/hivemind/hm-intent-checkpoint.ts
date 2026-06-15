/**
 * hm-intent-checkpoint tool (AC-42, AC-43, AC-45, AC-46, AC-47).
 *
 * The single entry point for the agent to interact with the intent-lock
 * gate's checkpoint system. Per AD-2 in the SPEC, this is a dedicated tool
 * (not a hook) because:
 *
 * - Hooks have no `client` access (AD-3 — hard OpenCode SDK constraint).
 * - Confirmation at critical transitions needs `question` interaction.
 * - Submitting evidence needs the success toast (`success` variant).
 *
 * P27.2 additions (T3, T26):
 * - `continuity` and `c1_3` checkpoint IDs for SL-1/SL-2 lifecycle.
 * - Locale-aware question strings (T26, P27.2-LANG-SUPPLEMENT).
 *
 * Three actions:
 * - `submit`: Validate + persist checkpoint evidence via the store. Fires a
 *   `success` toast on accept (AC-42), returns `REJECTED` on validation
 *   failure (AC-45).
 * - `confirm`: At critical transitions (pre_executing, pre_verifying,
 *   continuity, c1_3), returns a `PENDING_CONFIRMATION` payload with a
 *   question shape the agent can forward to the built-in `question` tool.
 * - `status`: Read-only — returns the current state and evidence for a
 *   checkpoint.
 */

import { tool } from "@opencode-ai/plugin/tool"

import { showTuiToast, type OpenCodeClient } from "../../shared/session-api.js"
import {
  readIntentLockState,
  submitCheckpointEvidence,
  upsertIntentLockState,
} from "../../features/intent-lock/store.js"
import { lockIntentCodeChange } from "../../features/intent-lock/state-machine.js"
import { IntentState } from "../../features/intent-lock/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { addSessionOverride } from "../../hooks/guards/intent-lock-gate.js"

/**
 * Locale-keyed question templates for each checkpoint.
 *
 * Each template resolves to `[header, question, optionLabel, optionDesc]`
 * where the last two may be repeated for the second option.
 * Per D-07, every checkpoint has exactly 2 options.
 */
const CHECKPOINT_TEMPLATES: Record<
  string,
  {
    en: [string, string, string, string, string, string]
    vi: [string, string, string, string, string, string]
  }
> = {
  pre_executing: {
    en: [
      "Confirm Execution Entry",
      "The intent-lock gate requests confirmation before proceeding to execution. Code changes will begin.",
      "Proceed to execution",
      "Allow code changes to begin",
      "Review intent first",
      "Stay in current state and review the declared intent",
    ],
    vi: [
      "Xác nhận Bắt đầu",
      "Cổng intent-lock yêu cầu xác nhận trước khi tiến hành thực thi. Các thay đổi mã sẽ bắt đầu.",
      "Tiến hành thực thi",
      "Cho phép bắt đầu thay đổi mã",
      "Xem lại ý định trước",
      "Ở lại trạng thái hiện tại và xem lại ý định đã khai báo",
    ],
  },
  pre_verifying: {
    en: [
      "Confirm Verification Entry",
      "The intent-lock gate requests confirmation before starting verification. Implementation should be complete.",
      "Begin verification",
      "Implementation is complete, start verification",
      "Continue implementation",
      "More work needed before verification",
    ],
    vi: [
      "Xác nhận Xác minh",
      "Cổng intent-lock yêu cầu xác nhận trước khi bắt đầu xác minh. Việc triển khai sẽ hoàn tất.",
      "Bắt đầu xác minh",
      "Triển khai hoàn tất, bắt đầu xác minh",
      "Tiếp tục triển khai",
      "Cần thêm công việc trước khi xác minh",
    ],
  },
  continuity: {
    en: [
      "Resume?",
      "Resume from {prevSessionId}? Locked phase: {phaseId}, intent: {summary}.",
      "Resume from {prevSessionId}",
      "Inherit previous session state and continue work",
      "Start fresh",
      "Begin a new session from scratch (UNLOCKED state)",
    ],
    vi: [
      "Tiếp tục?",
      "Tiếp tục từ {prevSessionId}? Giai đoạn đã khóa: {phaseId}, ý định: {summary}.",
      "Tiếp tục từ {prevSessionId}",
      "Kế thừa trạng thái phiên trước và tiếp tục làm việc",
      "Bắt đầu mới",
      "Bắt đầu phiên mới từ đầu (trạng thái UNLOCKED)",
    ],
  },
  c1_3: {
    en: [
      "Intent?",
      "Classified intent: {category} (confidence: {pct}%). Phase: {phaseId}. Continue?",
      "Continue with {category}",
      "Proceed with this classified intent",
      "Refine intent",
      "Re-classify with a different intent category",
    ],
    vi: [
      "Ý định?",
      "Ý định đã phân loại: {category} (độ tin cậy: {pct}%). Giai đoạn: {phaseId}. Tiếp tục?",
      "Tiếp tục với {category}",
      "Tiến hành với ý định đã phân loại này",
      "Tinh chỉnh ý định",
      "Phân loại lại với danh mục ý định khác",
    ],
  },
}

/** Context passed by OpenCode to the tool's execute function. */
type ToolContext = {
  sessionID?: string
  directory?: string
  worktree?: string
  projectRoot?: string
}

/**
 * Confirmation question spec. Mirrors the OpenCode built-in `question`
 * tool's input shape. Returned in `PENDING_CONFIRMATION` so the agent can
 * pass it through to the built-in `question` tool.
 */
interface QuestionSpec {
  questions: Array<{
    question: string
    header: string
    options: Array<{ label: string; description: string }>
    multiple?: boolean
  }>
}

/**
 * Interpolate template variables in a string.
 * Supports `{key}` placeholders.
 */
function interpolate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }
  return result
}

/**
 * Resolve locale from context or fallback.
 * Uses `"en"` as default when locale cannot be determined.
 */
function resolveLocale(_context: ToolContext): "en" | "vi" {
  // Production wiring reads from config; fallback to English.
  // P27.2-LANG-SUPPLEMENT T26: the session-start handler injects
  // locale into the tool context from `getFreshConfig().conversation_language`.
  return "en"
}

/**
 * Build the confirmation question for a known checkpoint.
 *
 * Returns `null` for unknown checkpoint IDs (caller should surface
 * `REJECTED` to the agent). Supports locale-aware strings via T26.
 */
function buildConfirmationQuestion(
  checkpoint: string,
  context: ToolContext,
  extras?: {
    prevSessionId?: string
    phaseId?: string
    summary?: string
    category?: string
    pct?: string
  },
): QuestionSpec | null {
  const template = CHECKPOINT_TEMPLATES[checkpoint]
  if (!template) return null

  const locale = resolveLocale(context)
  const [header, question, opt1Label, opt1Desc, opt2Label, opt2Desc] =
    template[locale] ?? template.en

  const vars: Record<string, string> = {
    prevSessionId: extras?.prevSessionId ?? "unknown",
    phaseId: extras?.phaseId ?? "unknown",
    summary: extras?.summary ?? "unknown",
    category: extras?.category ?? "unknown",
    pct: extras?.pct ?? "0%",
  }

  return {
    questions: [
      {
        header,
        question: interpolate(question, vars),
        options: [
          { label: interpolate(opt1Label, vars), description: interpolate(opt1Desc, vars) },
          { label: interpolate(opt2Label, vars), description: interpolate(opt2Desc, vars) },
        ],
      },
    ],
  }
}

/**
 * Create the hm-intent-checkpoint tool factory.
 *
 * @param client - OpenCode SDK client (used for `showTuiToast`).
 * @returns OpenCode tool instance with `submit`, `confirm`, and `status` actions.
 */
export function createIntentCheckpointTool(
  client: OpenCodeClient,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Submit checkpoint evidence, request user confirmation at critical transitions, or check checkpoint status for the intent-lock gate.",
    args: {
      action: s
        .enum(["submit", "confirm", "status"])
        .describe("Action: 'submit' evidence, 'confirm' critical transition, or 'status' lookup"),
      checkpoint: s
        .string()
        .min(1)
        .describe("Checkpoint identifier (e.g., 'pre_executing', 'pre_verifying', 'continuity', 'c1_3')"),
      evidence: s
        .array(s.string())
        .optional()
        .describe("[submit] Array of non-empty evidence strings"),
    },
    async execute(args: { action: string; checkpoint: string; evidence?: string[] }, context: ToolContext) {
      const sessionId = context.sessionID ?? "unknown"
      const projectRoot =
        (context as { projectRoot?: string }).projectRoot ??
        context.directory ??
        process.cwd()

      // ---- status ----
      if (args.action === "status") {
        const state = readIntentLockState(projectRoot, sessionId)
        const evidence = state.checkpointEvidence?.[args.checkpoint] ?? []
        return renderToolResult({
          checkpoint: args.checkpoint,
          currentState: state.state,
          hasEvidence: evidence.length > 0,
          evidence,
        })
      }

      // ---- submit ----
      if (args.action === "submit") {
        if (!args.evidence || args.evidence.length === 0) {
          return renderToolResult({ status: "REJECTED", reason: "Evidence required" })
        }

        const result = submitCheckpointEvidence(
          projectRoot,
          sessionId,
          args.checkpoint,
          args.evidence,
        )

        // D-01: checkpoint "intent_locked" and "c1_3" trigger state transition
        if (result.accepted && (args.checkpoint === "intent_locked" || args.checkpoint === "c1_3")) {
          const currentState = readIntentLockState(projectRoot, sessionId)
          if (currentState.state === IntentState.UNLOCKED) {
            const newState = lockIntentCodeChange(
              currentState,
              `intent-${sessionId}`,
              args.evidence[0] ?? "declared intent",
              [".planning/**"],
            )
            upsertIntentLockState(projectRoot, newState)
          }
        }

        // BLOCKER-1: override_gate handler (D-04 question-based escape hatch)
        if (result.accepted && args.checkpoint === "override_gate" && args.evidence?.length) {
          addSessionOverride(sessionId)
          return renderToolResult({
            status: "ACCEPTED",
            checkpointId: result.checkpointId,
            message: "Session override activated — gate bypassed for this session",
          })
        }

        if (result.accepted) {
          const state = readIntentLockState(projectRoot, sessionId)
          await showTuiToast(
            client,
            `Checkpoint ${args.checkpoint} passed — advancing to ${state.state}`,
            "success",
          )
          return renderToolResult({
            status: "ACCEPTED",
            checkpointId: result.checkpointId,
            newState: state.state,
          })
        }

        return renderToolResult({ status: "REJECTED", reason: result.reason })
      }

      // ---- confirm ----
      if (args.action === "confirm") {
        const questions = buildConfirmationQuestion(args.checkpoint, context)
        if (!questions) {
          return renderToolResult({
            status: "REJECTED",
            reason: `Unknown confirmation checkpoint: ${args.checkpoint}`,
          })
        }

        return renderToolResult({
          status: "PENDING_CONFIRMATION",
          checkpointId: args.checkpoint,
          guidance: `Call the built-in question tool with: ${JSON.stringify(questions)}`,
          questionSpec: questions,
        })
      }

      return renderToolResult({ status: "REJECTED", reason: `Unknown action: ${args.checkpoint}` })
    },
  })
}

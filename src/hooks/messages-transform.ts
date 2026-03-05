/**
 * Messages Transform Hook — Pre-stop checklist and context anchoring.
 * 
 * V3.0 Design:
 * - Uses PREPEND for anchor context (synthetic part, doesn't mutate user text)
 * - Uses APPEND for checklist (at end, before final message)
 * - pending_failure_ack checklist item RESTORED (safety critical)
 * - Research artifacts check REMOVED (was noise, not actionable)
 * 
 * P3: try/catch — never break message flow
 */

import { createStateManager, loadConfig } from "../lib/persistence.js"
import { queueStateMutation } from "../lib/state-mutation-queue.js"
import { countCompleted, loadTree } from "../lib/hierarchy-tree.js"
import {
  estimateContextPercent,
  MAX_COMPACTION_COUNT,
  shouldCreateNewSession,
} from "../lib/session-boundary.js"
import { packCognitiveState } from "../lib/cognitive-packer.js"
import { loadGraphTasks } from "../lib/graph-io.js"
import { loadLastSessionContext, buildTransformedPrompt, getConfidenceBreakdown } from "../lib/session_coherence.js"
import { buildClarificationPacket, renderClarificationPacket, shouldTriggerClarification } from "../lib/intent-clarification.js"
import { existsSync, readdirSync } from "fs"
import type { Message, Part } from "@opencode-ai/sdk"
import type { BrainState } from "../schemas/brain-state.js"
import { createLogger } from "../lib/logging.js"
import { getEffectivePaths } from "../lib/paths.js"
import { detectAutoRealignment } from "../lib/hivefiver-integration.js"
import { evaluateEntityChecklist } from "../lib/entity-checklist.js"
import { randomUUID } from "node:crypto"
import {
  detectRationaleOptionSelection,
  detectV29OutputStyleSelection,
  generateFirstTurnConfirmationBlock,
} from "./session-lifecycle-helpers.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { detectLongSession } from "../lib/long-session.js"
import {
  createTurnInjectionKey,
  createTurnInjectionLedger,
  getRemainingBudget,
  reserveInjectionBudget,
} from "../lib/injection-orchestrator.js"
import { shouldSuppressHumanFacingGovernance } from "../lib/session-role.js"

type MessagePart = {
  id?: string
  sessionID?: string
  messageID?: string
  type?: string
  text?: string
  synthetic?: boolean
  [key: string]: unknown
}

type MessageWithParts = {
  info: Message
  parts: Part[]
}

type LegacyMessage = {
  role?: string
  content?: string | MessagePart[]
  synthetic?: boolean
  [key: string]: unknown
}

export type MessageV2 = MessageWithParts | LegacyMessage

function isMessageWithParts(message: MessageV2): message is MessageWithParts {
  return (
    typeof message === "object" &&
    message !== null &&
    "info" in message &&
    "parts" in message &&
    Array.isArray((message as MessageWithParts).parts)
  )
}

// LOW #1: Magic number extracted for clarity
const MAX_CHECKLIST_CHARS = 1000

function buildChecklist(items: string[], maxChars: number): string {
  if (items.length === 0) return ""

  const lines = ["<system-reminder>", "CHECKLIST BEFORE STOPPING (Pre-Stop Conditional):"]
  lines.push("You are about to complete your turn. BEFORE you output your final message, you MUST verify:")
  for (const item of items) {
    const candidate = [...lines, `- [ ] ${item}`, "</system-reminder>"].join("\n")
    if (candidate.length > maxChars) break
    lines.push(`- [ ] ${item}`)
  }
  lines.push("If NO, you must execute these tools now. Do not stop your turn.")
  lines.push("</system-reminder>")
  return lines.join("\n")
}

function buildAutoRealignReminder(decision: ReturnType<typeof detectAutoRealignment>): string {
  const menuLines = decision.nextStepMenu.slice(0, 3).map((option, index) => {
    const gate = option.requiresPermission ? "permission" : "auto"
    return `${index + 1}) /${option.command} [${gate}] - ${option.label}`
  })
  if (decision.nextStepMenu.length > 3) {
    menuLines.push(`... +${decision.nextStepMenu.length - 3} more options`)
  }

  const initiationLine = decision.requiresPermission
    ? `Permission required before execution. ${decision.permissionPrompt ?? "Ask explicit Yes/No before continuing."}`
    : `Auto-init allowed: append /${decision.recommendedCommand} as the next step and continue unless user says no.`

  return [
    "<system-reminder>",
    `[AUTO-REALIGN] ${decision.reason}.`,
    `If user command is missing or invalid, route via /${decision.recommendedCommand}.`,
    "[NEXT-STEP MENU]",
    ...menuLines,
    initiationLine,
    "</system-reminder>",
  ].join("\n")
}

function isEmptyPackedContext(xml: string): boolean {
  return (
    xml.includes('timestamp="1970-01-01T00:00:00.000Z"') &&
    xml.includes("<trajectory />") &&
    xml.includes('session=""')
  )
}

function isSyntheticMessage(message: MessageV2): boolean {
  if (isMessageWithParts(message)) {
    return message.parts.some(part => {
      if (part.type !== "text") return false
      return Boolean((part as MessagePart).synthetic)
    })
  }

  if (message.synthetic === true) return true
  if (!Array.isArray(message.content)) return false
  return message.content.some(part => part.synthetic === true)
}

function getLastNonSyntheticUserMessageIndex(messages: MessageV2[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const role = isMessageWithParts(message) ? message.info.role : message.role
    if (role === "user" && !isSyntheticMessage(message)) {
      return i
    }
  }
  return -1
}

function getMessageText(message: MessageV2): string {
  if (isMessageWithParts(message)) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join(" ")
  }

  if (typeof message.content === "string") {
    return message.content
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((part) => part.type === "text")
      .map((part) => (part as MessagePart).text || "")
      .join(" ")
  }

  return ""
}

function detectOffTrackIntent(text: string): string | null {
  const normalized = text.trim()
  if (!normalized) return null
  const lower = normalized.toLowerCase()
  const cues = [
    "park this",
    "off-track",
    "off track",
    "later",
    "after this",
    "different slice",
    "out of scope",
    "todo pending",
  ]
  const matched = cues.some((cue) => lower.includes(cue))
  return matched ? normalized : null
}

function isLowSignalContinuation(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return true
  return [
    "hi",
    "hello",
    "continue",
    "ok",
    "okay",
    "thanks",
    "next",
    "go on",
  ].includes(normalized)
}

/**
 * V3.0: Build anchor context as SEPARATE synthetic part.
 * Does NOT mutate user text - uses prependSyntheticPart instead.
 */
function buildAnchorContext(state: BrainState): string {
  const phase = state.hierarchy.trajectory || "Unset"
  const task = state.hierarchy.action || "Unset"
  const hierarchyStatus = state.metrics.context_updates > 0 ? "Active" : "Stale"

  return `[SYSTEM ANCHOR: ${phase} | Active Task: ${task} | Hierarchy: ${hierarchyStatus}]`
}

/**
 * V3.0: PREPEND synthetic part (anchor context at START).
 * Does NOT mutate user's original text - adds separate part.
 */
function prependSyntheticPart(message: MessageV2, text: string): void {
  if (isMessageWithParts(message)) {
    const firstPart = message.parts[0] as MessagePart | undefined
    const sessionID = firstPart?.sessionID ?? message.info.sessionID
    const messageID = firstPart?.messageID ?? message.info.id

    if (!sessionID || !messageID) return

    const syntheticPart: Part = {
      id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionID,
      messageID,
      type: "text",
      text,
      synthetic: true,
      experimental_providerMetadata: {
        opencode: {
          ui_hidden: true
        }
      }
    } as Part
    // Prepend to start
    message.parts = [syntheticPart, ...message.parts]
    return
  }

  const syntheticPart: MessagePart = {
    type: "text",
    text,
    synthetic: true,
  }

  if (Array.isArray(message.content)) {
    message.content = [syntheticPart, ...message.content]
    return
  }

  if (typeof message.content === "string") {
    message.content = [
      syntheticPart,
      {
        type: "text",
        text: message.content,
      },
    ]
    return
  }

  message.content = [syntheticPart] // Fallback
}

/**
 * APPEND synthetic part (checklist at END).
 */
function appendSyntheticPart(message: MessageV2, text: string): void {
  if (isMessageWithParts(message)) {
    const firstPart = message.parts[0] as MessagePart | undefined
    const sessionID = firstPart?.sessionID ?? message.info.sessionID
    const messageID = firstPart?.messageID ?? message.info.id

    if (!sessionID || !messageID) return

    const syntheticPart: Part = {
      id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionID,
      messageID,
      type: "text",
      text,
      synthetic: true,
      experimental_providerMetadata: {
        opencode: {
          ui_hidden: true
        }
      }
    } as Part
    // Append to end
    message.parts = [...message.parts, syntheticPart]
    return
  }

  const syntheticPart: MessagePart = {
    type: "text",
    text,
    synthetic: true,
  }

  if (Array.isArray(message.content)) {
    message.content = [...message.content, syntheticPart]
    return
  }

  if (typeof message.content === "string") {
    message.content = [
      {
        type: "text",
        text: message.content,
      },
      syntheticPart,
    ]
    return
  }

  message.content = [syntheticPart] // Fallback
}

export function createMessagesTransformHook(_log: { warn: (message: string) => Promise<void> }, directory: string) {
  const stateManager = createStateManager(directory)
  const injectedSessionIds = new Set<string>()
  const paths = getEffectivePaths(directory)
  const loggerPromise = createLogger(paths.logsDir, "session-coherence")

  return async (
    _input: {},
    output: { messages: MessageV2[] }
  ): Promise<void> => {
    try {
      if (!Array.isArray(output.messages)) return

      const config = await loadConfig(directory)
      if (config.governance_mode === "permissive") return

      const state = await stateManager.load()

      const maxResponseTokens = config.agent_behavior?.constraints?.max_response_tokens ?? 4096
      const approxContextWindowChars = Math.max(8000, Math.floor(maxResponseTokens * 4))
      const resolvedSessionId = state?.session?.id || "unknown-session"
      const turnCount = state?.metrics?.turn_count ?? 0
      const turnKey = createTurnInjectionKey(resolvedSessionId, turnCount)
      createTurnInjectionLedger({
        sessionId: resolvedSessionId,
        turnCount,
        contextWindowChars: approxContextWindowChars,
      })
      const suppressHumanFacing = state ? shouldSuppressHumanFacingGovernance(state) : false

      const reserveCoreMessageText = (text: string): string | null => {
        if (!text.trim()) return null
        const granted = reserveInjectionBudget({
          turnKey,
          channel: "core-message",
          requestedChars: text.length,
        })
        if (granted <= 0) return null
        if (granted >= text.length) return text
        if (granted <= 32) return null
        return `${text.slice(0, Math.max(0, granted - 32))}\n...[truncated by shared budget]`
      }

      // === PHASE 1: First-Turn Session Coherence (EXCLUSIVE — returns early) ===
      // Persistent marker-based gate (counter-independent).
      // Inject only when state exists and marker is false.
      const sessionId = state?.session?.id ?? ""
      const markerInjected = state?.first_turn_context_injected ?? false
      const canInjectForSession = sessionId.length > 0 && !injectedSessionIds.has(sessionId)

      if (state && !markerInjected && canInjectForSession) {
        const index = getLastNonSyntheticUserMessageIndex(output.messages)
        if (index >= 0) {
          try {
            // Extract user message text
            const userMessage = output.messages[index]
            const userMessageText = getMessageText(userMessage)

            // Load last session context (from archive if available)
            const lastSessionContext = await loadLastSessionContext(directory)
            const firstTurnRemaining = getRemainingBudget(turnKey)

            // Build transformed prompt
            const transformedPrompt = buildTransformedPrompt(userMessageText, lastSessionContext, {
              maxTasks: 5,
              maxMems: 3,
              maxTodos: 10,
              includeAnchors: true,
              budget: Math.max(400, Math.min(1800, Math.floor(firstTurnRemaining * 0.7))),
            })

            const transformedPromptBounded = reserveCoreMessageText(transformedPrompt)
            if (transformedPromptBounded) {
              prependSyntheticPart(output.messages[index], transformedPromptBounded)
            }
            const confidence = getConfidenceBreakdown(state, directory)
            if (!suppressHumanFacing && shouldTriggerClarification(confidence.score)) {
              const clarification = buildClarificationPacket({
                confidence: confidence.score,
                userMessage: userMessageText,
                recommendations: confidence.recommendations,
              })
              const clarificationBounded = reserveCoreMessageText(renderClarificationPacket(clarification))
              if (clarificationBounded) {
                prependSyntheticPart(output.messages[index], clarificationBounded)
              }
            }
            if (!suppressHumanFacing && state.first_turn_confirmation.required) {
              const firstTurnConfirmation = reserveCoreMessageText(
                generateFirstTurnConfirmationBlock(config.language)
              )
              if (firstTurnConfirmation) {
                prependSyntheticPart(output.messages[index], firstTurnConfirmation)
              }
            }

            const rationaleOption = detectRationaleOptionSelection(userMessageText)
            const selectedStyle = detectV29OutputStyleSelection(userMessageText)
            if (state.first_turn_confirmation.required && rationaleOption && selectedStyle) {
              queueStateMutation({
                type: "UPDATE_STATE",
                payload: {
                  first_turn_confirmation: {
                    required: false,
                    confirmed: true,
                    rationale_option: rationaleOption,
                    selected_output_style: selectedStyle,
                    confirmed_at: Date.now(),
                  },
                  selected_output_style_v29: selectedStyle,
                },
                source: "messages-transform-hook:first-turn-confirmed",
              })
            }

            // CQRS: Queue mutation instead of direct save
            queueStateMutation({
              type: "UPDATE_STATE",
              payload: {
                first_turn_context_injected: true,
              },
              source: "messages-transform-hook:first-turn",
            })

            injectedSessionIds.add(sessionId)

            if (process.env.HIVEMIND_DEBUG_FIRST_TURN === "1") {
              const logger = await loggerPromise
              await logger.debug("\n🔗 [SESSION COHERENCE] First-turn context injected:")
              await logger.debug("---")
              await logger.debug(transformedPrompt)
              await logger.debug("---\n")
            }

            // First-turn session coherence is exclusive.
            // Do not stack anchor/checklist injections in same transform pass.
            return
          } catch {
            // P3: never break message flow - silently fail
          }
        }
      }

      // === PHASE 2: State Load + Early Exit ===
      if (!state) return

      // === PHASE 3: Recent Messages Capture ===
      // Store last 6 messages in brain state for session split
      try {
        const recentMessages: Array<{ role: "user" | "assistant"; content: string }> = []
        for (const msg of output.messages) {
          // Determine role from message shape
          let role: string | undefined
          let content = ""
          
          if (isMessageWithParts(msg)) {
            role = msg.info?.role
            content = msg.parts.filter(p => p.type === "text").map(p => p.text || "").join(" ")
          } else {
            // LegacyMessage
            role = (msg as LegacyMessage).role
            const msgContent = (msg as LegacyMessage).content
            if (typeof msgContent === "string") {
              content = msgContent
            } else if (Array.isArray(msgContent)) {
              content = msgContent.filter(p => p.type === "text").map(p => (p as MessagePart).text || "").join(" ")
            }
          }
          
          if (role && (role === "user" || role === "assistant") && content) {
            recentMessages.push({ role: role as "user" | "assistant", content })
          }
        }
        
        // Keep only last 6 messages
        const trimmedMessages = recentMessages.slice(-6)
        const latestArtifact = trimmedMessages[trimmedMessages.length - 1]
        const memoryGovernancePatch = latestArtifact
          ? (() => {
              return {
                ...state.memory_governance,
                last_classified_at: Date.now(),
              }
            })()
          : undefined
        
        // CQRS: Queue mutation instead of direct save
        queueStateMutation({
          type: "UPDATE_STATE",
          payload: {
            recent_messages: trimmedMessages,
            ...(memoryGovernancePatch
              ? {
                  memory_governance: memoryGovernancePatch,
                }
              : {}),
          },
          source: "messages-transform-hook:recent-messages",
        })
      } catch {
        // P3: Never break message flow - silently fail
      }
      // === End P0-6 message capture ===

      // === PHASE 4: User Message Location + Context Injection ===
      const index = getLastNonSyntheticUserMessageIndex(output.messages)
      if (index >= 0) {
        const latestUserText = getMessageText(output.messages[index])
        const selectedRationale = detectRationaleOptionSelection(latestUserText)
        const selectedStyle = detectV29OutputStyleSelection(latestUserText)
        if (state.first_turn_confirmation.required && selectedRationale && selectedStyle) {
          queueStateMutation({
            type: "UPDATE_STATE",
            payload: {
              first_turn_confirmation: {
                required: false,
                confirmed: true,
                rationale_option: selectedRationale,
                selected_output_style: selectedStyle,
                confirmed_at: Date.now(),
              },
              selected_output_style_v29: selectedStyle,
            },
            source: "messages-transform-hook:first-turn-confirmed",
          })
        }

        const offTrackIntent = detectOffTrackIntent(latestUserText)
        if (offTrackIntent) {
          const duplicate = state.offtrack_todo_pending.some(
            (item) =>
              item.status === "pending" &&
              item.content.trim().toLowerCase() === offTrackIntent.toLowerCase()
          )
          if (!duplicate) {
            queueStateMutation({
              type: "UPDATE_STATE",
              payload: {
                offtrack_todo_pending: [
                  ...state.offtrack_todo_pending,
                  {
                    id: randomUUID(),
                    content: offTrackIntent,
                    created_at: Date.now(),
                    source: "messages-transform",
                    status: "pending",
                  },
                ],
              },
              source: "messages-transform-hook:offtrack",
            })
          }
        }

        const autoRealign = detectAutoRealignment(latestUserText)
        const shouldInjectAutoRealign = !suppressHumanFacing && autoRealign.shouldRealign && !isLowSignalContinuation(latestUserText)
        if (shouldInjectAutoRealign) {
          const autoRealignReminder = reserveCoreMessageText(buildAutoRealignReminder(autoRealign))
          if (autoRealignReminder) {
            prependSyntheticPart(output.messages[index], autoRealignReminder)
          }
        }

        // === PHASE 5: Cognitive Packer Injection ===
        const checklistReserve = 900
        const remainingBeforeCognitive = getRemainingBudget(turnKey)
        const availableForCognitive = Math.max(0, remainingBeforeCognitive - checklistReserve)
        if (availableForCognitive > 160) {
          const packedContext = packCognitiveState(directory, {
            budget: Math.max(240, Math.min(1200, Math.floor(availableForCognitive * 0.85))),
          })
          if (!isEmptyPackedContext(packedContext)) {
            const packedContextBounded = reserveCoreMessageText(packedContext)
            if (packedContextBounded) {
              prependSyntheticPart(output.messages[index], packedContextBounded)
            }
          }
        }

        // === PHASE 6: Contextual Anchoring ===
        const anchorHeader = reserveCoreMessageText(buildAnchorContext(state))
        if (anchorHeader) {
          prependSyntheticPart(output.messages[index], anchorHeader)
        }

        // === PHASE 7: Pre-Stop Checklist Assembly ===
        const requiredItems: string[] = []
        const items: string[] = []
        const lowPriorityItems: string[] = []
        const entityChecklistItems: string[] = []

        if (!suppressHumanFacing && offTrackIntent) {
          items.push(
            "Off-track intent detected: queued to TODO-Pending and excluded from inline execution."
          )
        }

        // Add standard governance checks
        if (!state.hierarchy.action) items.push("Action-level focus is missing (call map_context)")
        if (state.metrics.context_updates === 0) items.push("Is the file tree updated? (No map_context yet)")
        if (!suppressHumanFacing && state.metrics.files_touched.length > 0) {
          items.push("Have you forced an atomic git commit / PR for touched files?")
        }

        // V3.0: RESTORED - pending_failure_ack checklist (safety critical)
        if (state.pending_failure_ack) {
          requiredItems.push("Acknowledge pending subagent failure (call export_cycle or map_context with blocked status)")
        }

        // === PHASE 7b: Entity Checklist Evaluation (K1-T03) ===
        try {
          const entityChecklist = await evaluateEntityChecklist(
            directory,
            state.session?.id || "unknown",
            `turn-${Date.now()}`
          )
          if (!entityChecklist.passed) {
            const failedItems = entityChecklist.items.filter(item => item.status === "fail")
            for (const item of failedItems) {
              entityChecklistItems.push(`Entity check failed: ${item.key} (${item.message})`)
            }
          }
        } catch {
          // P3: Entity checklist failure is non-fatal
        }

        // === PHASE 7c: Governance signals (D7 — migrated from session-lifecycle) ===
        // These were previously in session-governance.ts → system prompt (dual-channel).
        // Now consolidated here as the single canonical channel.
        try {
          // Chain breaks detection
          const chainBreaks = detectChainBreaks(state)
          if (chainBreaks.length > 0) {
            lowPriorityItems.push(`Chain breaks detected (${chainBreaks.length})`)
          }

          // Drift detection
          if (!suppressHumanFacing && state.metrics.drift_score < 50) {
            lowPriorityItems.push("High drift detected — use map_context to re-focus")
          }

          // Long session detection
          const longSession = detectLongSession(state, config.auto_compact_on_turns)
          if (!suppressHumanFacing && longSession.isLong) {
            lowPriorityItems.push(longSession.suggestion)
          }
        } catch {
          // P3: Governance signal failure is non-fatal
        }

        // US-016: Pending tasks — single-source read from graph/tasks.json
        // D7: Removed dual-read pattern (trajectory.json + tasks.json).
        // Now reads tasks directly — simpler, no redundant trajectory load.
        let pendingTaskCount = 0

        // LOW #2: Parallelize async - start tree loading in parallel with task checks
        const treePromise = loadTree(directory)

        if (existsSync(paths.graphTasks)) {
          try {
            const graphTasks = await loadGraphTasks(directory, { enabled: false })
            if (graphTasks?.tasks) {
              const activeTasks = graphTasks.tasks.filter((task: { id: string; status?: string }) =>
                task.status && task.status !== "complete" && task.status !== "invalidated" && task.status !== "cancelled"
              )
              pendingTaskCount = activeTasks.length
            }
          } catch {
            // P3: Task loading failure is non-fatal
          }
        }

        if (!suppressHumanFacing && pendingTaskCount > 0) {
          requiredItems.push(`Review ${pendingTaskCount} pending task(s)`)
        }

        if (shouldInjectAutoRealign) {
          const initiationMode = autoRealign.requiresPermission
            ? "permission-gated"
            : "auto-init"
          requiredItems.push(
            `Auto-realign workflow now (${initiationMode}): /${autoRealign.recommendedCommand} + skills (${autoRealign.recommendedSkills.join(", ")})`
          )
        }

        if (entityChecklistItems.length > 0) {
          lowPriorityItems.push(...entityChecklistItems.slice(0, 2))
        }

        // Session Boundary check
        const contextPercent = estimateContextPercent(state.metrics.user_turn_count, config.auto_compact_on_turns)
        let completedBranchCount = 0
        // LOW #2: Use pre-loaded tree promise
        const tree = await treePromise
        if (tree.root) completedBranchCount = countCompleted(tree)

        // V3.0: Pass user_turn_count and compaction_count
        const boundaryRecommendation = shouldCreateNewSession({
          turnCount: state.metrics.turn_count,
          userTurnCount: state.metrics.user_turn_count,
          contextPercent,
          hierarchyComplete: completedBranchCount > 0,
          isMainSession: !shouldSuppressHumanFacingGovernance(state),
          compactionExhausted: (state.compaction_count ?? 0) >= MAX_COMPACTION_COUNT,
          hasDelegations: (state.cycle_log ?? []).some(entry => entry.tool === "task"),
          compactionCount: state.compaction_count ?? 0,
        })

        if (!suppressHumanFacing && boundaryRecommendation.recommended) {
           items.push(`Session boundary reached: ${boundaryRecommendation.reason}`)
        }

        // Phase 3B: Surface off-track TODO-Pending count without inlining content
        const pendingOfftrack = (state.offtrack_todo_pending ?? []).filter(item => item.status === "pending")
        if (!suppressHumanFacing && pendingOfftrack.length > 0) {
          lowPriorityItems.push(`${pendingOfftrack.length} off-track TODO(s) sequestered (use hivemind_session_memory todo_pending to review)`)
        }

        // US-016: Artifacts check - verify session artifacts are properly linked
        // Checks if session has been persisted to .hivemind/sessions/active/
        const sessionDir = directory.includes(".hivemind/sessions/")
          ? null // Already in session directory
          : paths?.activeDir
        if (!suppressHumanFacing && sessionDir && state.session?.id) {
          // Session files are named {date}-{mode}-{slug}.md, not by session ID suffix
          // Check if ANY session file exists in active directory
          try {
            const sessionFiles = readdirSync(sessionDir).filter(f => f.endsWith('.md'))
            if (sessionFiles.length === 0) {
              lowPriorityItems.push("Session not persisted to sessions/active/ (run declare_intent or compact_session)")
            }
          } catch {
            // Directory doesn't exist or can't be read
            lowPriorityItems.push("Session not persisted to sessions/active/ (run declare_intent or compact_session)")
          }
        }

        if (lowPriorityItems.length > 0) {
          items.push(...lowPriorityItems)
        }

        const orderedChecklistItems = [...requiredItems, ...items]

        // Preserve checklist compatibility: keep enough room for mandatory auto-realign skill stacks.
        const checklistBudget = Math.min(MAX_CHECKLIST_CHARS, Math.max(240, getRemainingBudget(turnKey)))
        const checklist = buildChecklist(orderedChecklistItems, checklistBudget)
        if (checklist) {
          const checklistBounded = reserveCoreMessageText(checklist)
          if (checklistBounded) {
            appendSyntheticPart(output.messages[index], checklistBounded)
          }
        }
      }

    } catch {
      // P3: never break message flow
    }
  }
}

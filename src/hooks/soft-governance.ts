/**
 * Soft Governance Hook — Counter/Detection Engine.
 *
 * Fires after EVERY tool call (tool.execute.after).
 * Responsibilities:
 *   - Increment turn count + track tool health
 *   - Classify tool type (read/write/query/governance)
 *   - Track consecutive failures + section repetition
 *   - Scan tool output for stuck/confused keywords
 *   - Detect governance violations (write in LOCKED)
 *   - Chain break, drift, and long session detection
 *   - Write ALL counters to brain.json.metrics
 *
 * This hook does NOT transform prompts — it stores signals for
 * session-lifecycle.ts (system.transform) to compile on next turn.
 *
 * P3: try/catch — never break tool execution
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import type { BrainState } from "../schemas/brain-state.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { TOOL_DENIAL_REASONS } from "../lib/governance-instruction.js"
import { queueStateMutation, flushMutations } from "../lib/state-mutation-queue.js"
import {
  addFileTouched,
  addViolationCount,
  incrementTurnCount,
  setLastCommitSuggestionTurn,
  addCycleLogEntry,
  queueOffTrackIntent,
} from "../schemas/brain-state.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { shouldSuggestCommit } from "../lib/commit-advisor.js"
import { detectLongSession } from "../lib/long-session.js"
import { evaluateEntityChecklist } from "../lib/entity-checklist.js"
import { loadGraphTasks, loadTrajectory } from "../lib/graph-io.js"
import { executeAutoCommit, extractModifiedFiles, shouldAutoCommit } from "../lib/auto-commit.js"
import { getClient } from "./sdk-context.js"
import { checkAndRecordToast, resetAllThrottles } from "../lib/toast-throttle.js"
import { maybeCreateNonDisruptiveSessionSplit } from "../lib/session-split.js"
import { normalizeToolAlias } from "../lib/tool-names.js"
import { applyResolvedSessionRoleContext, shouldSuppressHumanFacingGovernance } from "../lib/session-role.js"
import {
  classifyTool,
  incrementToolType,
  trackToolResult,
  scanForKeywords,
  addKeywordFlags,
  createDetectionState,
  computeGovernanceSeverity,
  computeUnacknowledgedCycles,
  compileIgnoredTier,
  trackSectionUpdate,
  resetSectionTracking,
  formatIgnoredEvidence,
  registerGovernanceSignal,
  type GovernanceCounters,
  type DetectionState,
} from "../lib/detection.js"

const MANDATORY_EXEMPT_TOOLS = new Set([
  "read", "glob", "grep", "ls", "cat", "find",
  "hivemind_inspect", "hivemind_hierarchy", "hivemind_memory", "hivemind_anchor",
  "hivemind_context", "hivemind_declare",
])

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))]
}

/**
 * Extract a delegated task identifier from task tool metadata or output text.
 *
 * @param output - Raw task tool output captured by the hook.
 * @param metadata - Tool metadata emitted by the runtime, if any.
 * @returns A normalized delegated task identifier when present.
 */
function extractDelegatedTaskId(output: string, metadata: Record<string, unknown> | undefined): string | undefined {
  const directCandidates = [
    metadata?.task_id,
    metadata?.taskId,
  ]

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  const nestedMetadata = metadata?.metadata
  if (typeof nestedMetadata === "object" && nestedMetadata !== null) {
    const nestedRecord = nestedMetadata as Record<string, unknown>
    const nestedCandidates = [nestedRecord.task_id, nestedRecord.taskId]
    for (const candidate of nestedCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  }

  try {
    const parsed = JSON.parse(output) as Record<string, unknown>
    const parsedCandidates = [
      parsed.task_id,
      parsed.taskId,
      typeof parsed.metadata === "object" && parsed.metadata !== null
        ? (parsed.metadata as Record<string, unknown>).task_id
        : undefined,
      typeof parsed.metadata === "object" && parsed.metadata !== null
        ? (parsed.metadata as Record<string, unknown>).taskId
        : undefined,
    ]
    for (const candidate of parsedCandidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  } catch {
    // Output is often plain text; fall back to regex extraction.
  }

  const match = output.match(/\btask_id\b\s*[:=]\s*([A-Za-z0-9_-]+)/i)
  if (match?.[1]) {
    return match[1]
  }

  return undefined
}

type ToastVariant = "info" | "warning" | "error"

function localize(language: "en" | "vi", en: string, vi: string): string {
  return language === "vi" ? vi : en
}

function variantFromSeverity(severity: "info" | "warning" | "error"): ToastVariant {
  return severity
}

/**
 * Emit governance toast with centralized throttling.
 * Uses the toast-throttle utility to prevent noise cascade.
 */
export async function emitGovernanceToast(
  log: Logger,
  opts: {
    key: string
    message: string
    variant: ToastVariant
    eventType?: string
  },
): Promise<boolean> {
  const eventType = opts.eventType ?? "governance"

  // Use centralized throttle - 60s cooldown, max 5 per session per event type
  if (!checkAndRecordToast(eventType, opts.key)) {
    await log.debug(`Toast throttled: ${opts.key}`)
    return false
  }

  const client = getClient() as {
    tui?: {
      showToast?: (input: { body: { message: string; variant: ToastVariant } }) => Promise<unknown>
    }
  } | null
  if (!client?.tui?.showToast) {
    await log.debug(`Toast skipped (no SDK client): ${opts.key}`)
    return false
  }

  try {
    await client.tui.showToast({
      body: {
        message: opts.message,
        variant: opts.variant,
      },
    })
    return true
  } catch (error: unknown) {
    await log.warn(`Toast dispatch failed for ${opts.key}: ${error}`)
    return false
  }
}

/**
 * Reset toast cooldowns - exported for use by other hooks if needed.
 */
export function resetToastCooldowns(): void {
  resetAllThrottles()
}

function buildIgnoredTriageMessage(language: "en" | "vi", reason: string, action: string): string {
  return localize(
    language,
    `Reason: ${reason} | Current phase/action: ${action} | Suggested fix: map_context({ level: \"action\", content: \"<next action>\" })`,
    `Ly do: ${reason} | Current phase/action: ${action} | Lenh goi y: map_context({ level: \"action\", content: \"<hanh dong tiep theo>\" })`,
  )
}

function getActiveActionLabel(state: Pick<BrainState, "hierarchy">): string {
  if (state.hierarchy.action) return state.hierarchy.action
  if (state.hierarchy.tactic) return state.hierarchy.tactic
  if (state.hierarchy.trajectory) return state.hierarchy.trajectory
  return "(none)"
}

function extractToolContent(output: { output: string; metadata: unknown }): string {
  const metadata = typeof output.metadata === "object" && output.metadata !== null
    ? (output.metadata as Record<string, unknown>)
    : {}
  if (typeof metadata.content === "string" && metadata.content.trim().length > 0) {
    return metadata.content
  }

  try {
    const parsed = JSON.parse(output.output ?? "")
    const metadataContent = parsed?.metadata?.content
    if (typeof metadataContent === "string" && metadataContent.trim().length > 0) {
      return metadataContent
    }
    const directContent = parsed?.content
    if (typeof directContent === "string" && directContent.trim().length > 0) {
      return directContent
    }
  } catch {
    // ignore parse errors
  }

  return ""
}

function normalizeTrackedPath(path: string): string {
  return path.trim().replace(/\\/g, "/")
}

function isLikelyTrackedPath(value: string): boolean {
  if (!value || value.length > 1024) return false
  if (value.includes("\n")) return false
  if (/^[a-z]+:\/\//i.test(value)) return false
  return value.includes("/") || value.includes("\\") || value.includes(".")
}

function collectFilePaths(value: unknown, depth = 0): string[] {
  if (depth > 4 || value == null) return []
  if (typeof value === "string") {
    return isLikelyTrackedPath(value) ? [normalizeTrackedPath(value)] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectFilePaths(item, depth + 1))
  }
  if (typeof value !== "object") return []

  const obj = value as Record<string, unknown>
  const singlePathKeys = new Set(["filePath", "path", "targetFile", "file", "source", "destination"])
  const listPathKeys = new Set(["files", "paths", "filePaths", "modifiedFiles", "selectedFiles"])
  const paths: string[] = []

  for (const [key, child] of Object.entries(obj)) {
    if (singlePathKeys.has(key) && typeof child === "string") {
      paths.push(...collectFilePaths(child, depth + 1))
      continue
    }
    if (listPathKeys.has(key) && Array.isArray(child)) {
      paths.push(...collectFilePaths(child, depth + 1))
      continue
    }
    paths.push(...collectFilePaths(child, depth + 1))
  }

  return paths
}

function extractPathTags(outputText: string): string[] {
  const matches = outputText.matchAll(/<path>([^<]+)<\/path>/g)
  const found: string[] = []
  for (const match of matches) {
    const value = match[1]?.trim()
    if (value && isLikelyTrackedPath(value)) {
      found.push(normalizeTrackedPath(value))
    }
  }
  return found
}

function extractTrackedPaths(
  input: { args?: unknown; input?: unknown; params?: unknown },
  output: { output: string; metadata: unknown },
): string[] {
  const candidates = [
    ...collectFilePaths(input.args),
    ...collectFilePaths(input.input),
    ...collectFilePaths(input.params),
    ...collectFilePaths(output.metadata),
    ...extractPathTags(output.output ?? ""),
  ]
  return [...new Set(candidates)]
}

function detectOffTrackIntent(toolName: string, output: { output: string; metadata: unknown }): string | null {
  if (toolName !== "map_context" && toolName !== "hivemind_session") {
    return null
  }

  const content = extractToolContent(output).trim()
  if (!content) return null
  const lower = content.toLowerCase()
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
  return cues.some((cue) => lower.includes(cue)) ? content : null
}

/**
 * Creates the soft governance hook for tool execution tracking.
 *
 * This is the COUNTER engine. It fires after every tool call and writes
 * detection state to brain.json.metrics. The session-lifecycle hook then
 * reads these counters and compiles signals into prompt warnings.
 *
 * @param log Logger used for diagnostics, warnings, and toast fallbacks.
 * @param directory Project directory used for config and state resolution.
 * @param _initConfig Initial config snapshot; runtime config is reloaded on every invocation.
 * @returns A tool.execute.after hook that acts as the persisted write boundary for governance state.
 */
export function createSoftGovernanceHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  return async (
    input: {
      tool: string
      sessionID: string
      callID: string
      args?: unknown
      input?: unknown
      params?: unknown
    },
    _output: {
      title: string
      output: string
      metadata: unknown
    }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      const state = await stateManager.load()
      if (!state) {
        await log.warn("soft-governance: no brain state available")
        // Denial — mutate output so agent READS the denial, not just log
        _output.title = `⛔ DENIED — ${TOOL_DENIAL_REASONS.NO_STATE}`
        _output.output = [
          _output.output,
          `\n---\n⛔ GOVERNANCE DENIAL: ${TOOL_DENIAL_REASONS.NO_STATE}`,
          `Run: \`npx -y hivemind-context-governance --mode assisted\` to auto-initialize.`,
          `Or call \`hivemind_bootstrap\` tool as manual fallback.`,
        ].join("\n")
        return
      }

      // Increment turn count for every tool call
      let newState = applyResolvedSessionRoleContext(incrementTurnCount(state))
      const suppressHumanFacing = shouldSuppressHumanFacingGovernance(newState)
      let counters: GovernanceCounters = newState.metrics.governance_counters
      const canonicalTool = normalizeToolAlias(input.tool)
      let pendingMandatory = dedupeStrings(newState.pending_mandatory_tools ?? [])
      if (pendingMandatory.includes(canonicalTool)) {
        pendingMandatory = pendingMandatory.filter((tool) => tool !== canonicalTool)
      }

      if (
        pendingMandatory.length > 0 &&
        !MANDATORY_EXEMPT_TOOLS.has(canonicalTool) &&
        !pendingMandatory.includes(canonicalTool)
      ) {
        const repetitionCount = counters.out_of_order
        counters = registerGovernanceSignal(counters, "out_of_order")
        const severity = computeGovernanceSeverity({
          kind: "out_of_order",
          repetitionCount,
        })
        if (!suppressHumanFacing) {
          await emitGovernanceToast(log, {
            key: `mandatory_pending:${severity}`,
            message: localize(
              config.language,
              `Mandatory governance step pending: ${pendingMandatory.join(", ")}.`,
              `Buoc governance bat buoc dang cho: ${pendingMandatory.join(", ")}.`,
            ),
            variant: variantFromSeverity(severity),
            eventType: "governance",
          })
        }
      }

      const offTrackIntent = detectOffTrackIntent(input.tool, _output)
      if (offTrackIntent) {
        newState = queueOffTrackIntent(newState, offTrackIntent, `soft-governance:${input.tool}`)
      }

      // Check for drift (high turns without context update)
      // Threshold: drift_score < 30 AND user_turn_count >= 10 (consistent with event-handler.ts)
      const driftWarning = !suppressHumanFacing && newState.metrics.turn_count >= config.max_turns_before_warning &&
        newState.metrics.drift_score < 30

      // === Detection Engine: Tool Classification ===
      const toolCategory = classifyTool(canonicalTool)
      const trackedPaths = extractTrackedPaths(input, _output)
      const filesReadThisSession = new Set(
        (newState.metrics.files_read_this_session ?? []).map(normalizeTrackedPath)
      )

      if (toolCategory === "read" && trackedPaths.length > 0) {
        for (const trackedPath of trackedPaths) {
          filesReadThisSession.add(trackedPath)
        }
        newState = {
          ...newState,
          metrics: {
            ...newState.metrics,
            files_read_this_session: [...filesReadThisSession],
          },
        }
      }

      if (toolCategory === "write") {
        const pathsToTrack = trackedPaths.length > 0
          ? trackedPaths
          : [`[via ${input.tool}]`]

        for (const trackedPath of pathsToTrack) {
          newState = addFileTouched(newState, trackedPath)
        }
      }

      // === FileGuard: Write-without-read tracking ===
      // Track blind writes per file path, not just per session read count.
      if (toolCategory === "write" && input.tool !== "bash") {
        const hasUnreadWriteTarget = trackedPaths.length > 0
          ? trackedPaths.some((trackedPath) => !filesReadThisSession.has(trackedPath))
          : (newState.metrics.tool_type_counts?.read ?? 0) === 0

        if (hasUnreadWriteTarget) {
          newState = {
            ...newState,
            metrics: {
              ...newState.metrics,
              write_without_read_count: (newState.metrics.write_without_read_count ?? 0) + 1,
            },
          };
        }
      }

      // Get or initialize detection state from brain.json.metrics
      let detection: DetectionState = {
        consecutive_failures: newState.metrics.consecutive_failures ?? 0,
        consecutive_same_section: newState.metrics.consecutive_same_section ?? 0,
        last_section_content: newState.metrics.last_section_content ?? "",
        tool_type_counts: newState.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
        keyword_flags: newState.metrics.keyword_flags ?? [],
      }

      const currentUserTurn = newState.metrics.user_turn_count ?? 0
      let keywordFlagsResetTurn = newState.metrics.keyword_flags_reset_turn ?? currentUserTurn
      if (keywordFlagsResetTurn !== currentUserTurn) {
        detection = {
          ...detection,
          keyword_flags: [],
        }
        keywordFlagsResetTurn = currentUserTurn
      }

      // Increment tool type counter
      detection = {
        ...detection,
        tool_type_counts: incrementToolType(detection.tool_type_counts, toolCategory),
      }

      // Track tool result (success inferred — hook fires means no exception)
      detection = trackToolResult(detection, true)

      // Track section repetition when map_context is called
      if (input.tool === "map_context" || canonicalTool === "hivemind_session") {
        const focus =
          newState.hierarchy.action ||
          newState.hierarchy.tactic ||
          newState.hierarchy.trajectory
        detection = trackSectionUpdate(detection, focus)
      }

      // New intent declaration resets repetition tracking
      if (input.tool === "declare_intent" || canonicalTool === "hivemind_declare") {
        detection = resetSectionTracking(detection)
      }

      // Scan tool output for stuck/confused keywords
      const outputText = _output.output ?? ""
      const newKeywords = scanForKeywords(outputText, detection.keyword_flags)
      if (newKeywords.length > 0) {
        detection = addKeywordFlags(detection, newKeywords)
        await log.debug(`Detection: keyword flags detected: ${newKeywords.join(", ")}`)
      }

      // === Write detection state back into brain.json.metrics ===
      newState = {
        ...newState,
        metrics: {
          ...newState.metrics,
          consecutive_failures: detection.consecutive_failures,
          consecutive_same_section: detection.consecutive_same_section,
          last_section_content: detection.last_section_content,
          tool_type_counts: detection.tool_type_counts,
          keyword_flags: detection.keyword_flags,
          keyword_flags_reset_turn: keywordFlagsResetTurn,
        },
      }

      // === K1-T07: Entity Checklist Governance Signal ===
      // Evaluate entity checklist once per OPEN tool cycle.
      // On failure, increment out_of_order OR evidence_pressure AT MOST ONCE.
      if (state.session.governance_status === "OPEN") {
        try {
          const entityResult = await evaluateEntityChecklist(
            directory,
            state.session?.id || "unknown",
            `tool-${input.tool}-${Date.now()}`,
          )
          if (!entityResult.passed) {
            const failedKeys = entityResult.items
              .filter(item => item.status === "fail")
              .map(item => item.key)

            // Determine which counter to increment based on failure type
            // Missing hierarchy/action/config -> out_of_order (structural prerequisite)
            // Missing anchors/mems/planning -> evidence_pressure (evidence gap)
            const structuralKeys = ["hivemind_config", "hierarchy_chain", "active_action"]
            const hasStructuralFailure = failedKeys.some(key => structuralKeys.includes(key))

            if (hasStructuralFailure) {
              counters = registerGovernanceSignal(counters, "out_of_order")
            } else {
              counters = registerGovernanceSignal(counters, "evidence_pressure")
            }

            await log.debug(
              `K1-T07: Entity checklist failed (${failedKeys.join(", ")}). ` +
              `Signal: ${hasStructuralFailure ? "out_of_order" : "evidence_pressure"}`,
            )
          }
        } catch {
          // P3: Entity checklist failure is non-fatal
        }
      }

      // === Governance Violations ===
      const isIgnoredTool = shouldTrackAsViolation(canonicalTool, state.session.governance_mode)

      if (isIgnoredTool && state.session.governance_status === "LOCKED") {
        // Agent is trying to use tools when session is LOCKED
        newState = addViolationCount(newState)
        const repetitionCount = counters.out_of_order
        counters = registerGovernanceSignal(counters, "out_of_order")
        const severity = computeGovernanceSeverity({
          kind: "out_of_order",
          repetitionCount,
        })

        // Only emit toast on severity escalation (not every occurrence)
        const outOfOrderMessage = localize(
          config.language,
          `Tool ${input.tool} used before prerequisites. Call declare_intent first, then continue.`,
          `Da dung tool ${input.tool} truoc prerequisite. Goi declare_intent truoc roi tiep tuc.`,
        )
        if (!suppressHumanFacing) {
          await emitGovernanceToast(log, {
            key: `out_of_order:${severity}`,
            message: outOfOrderMessage,
            variant: variantFromSeverity(severity),
            eventType: "governance",
          })
        }

        await log.warn(
          `Governance violation: tool '${input.tool}' used in LOCKED session. Violation count: ${newState.metrics.violation_count}`
        )
      }

      const hasEvidencePressure =
        detection.keyword_flags.length > 0 ||
        detection.consecutive_failures > 0
      if (hasEvidencePressure && config.governance_mode !== "permissive") {
        const repetitionCount = counters.drift
        counters = registerGovernanceSignal(counters, "evidence_pressure")
        const severity = computeGovernanceSeverity({
          kind: "evidence_pressure",
          repetitionCount,
        })

        // Only emit toast on severity escalation
        const evidenceMessage = localize(
          config.language,
          `Evidence pressure active. Use think_back and verify before next claim.`,
          `Evidence pressure dang bat. Dung think_back va xac minh truoc khi ket luan tiep.`,
        )
        if (!suppressHumanFacing) {
          await emitGovernanceToast(log, {
            key: `evidence_pressure:${severity}`,
            message: evidenceMessage,
            variant: variantFromSeverity(severity),
            eventType: "evidence",
          })
        }
      }

      const ignoredTier = compileIgnoredTier({
        counters,
        governanceMode: config.governance_mode,
        expertLevel: config.agent_behavior.expert_level,
        evidence: {
          declaredOrder: "declare_intent -> map_context(tactic) -> map_context(action) -> execution",
          actualOrder: `turn ${newState.metrics.turn_count}: ${input.tool}`,
          missingPrerequisites: [
            ...(newState.hierarchy.trajectory ? [] : ["trajectory"]),
            ...(newState.hierarchy.tactic ? [] : ["tactic"]),
            ...(newState.hierarchy.action ? [] : ["action"]),
          ],
          expectedHierarchy: "trajectory -> tactic -> action",
          actualHierarchy: `trajectory=${newState.hierarchy.trajectory || "(empty)"}, tactic=${newState.hierarchy.tactic || "(empty)"}, action=${newState.hierarchy.action || "(empty)"}`,
        },
      })

      if (!suppressHumanFacing && ignoredTier) {
        const actionLabel = getActiveActionLabel(newState)
        const triage = buildIgnoredTriageMessage(
          config.language,
          `IGNORED tier: ${computeUnacknowledgedCycles(counters)} unacknowledged governance cycles (${ignoredTier.tone})`,
          actionLabel,
        )
        await emitGovernanceToast(log, {
          key: "ignored:triage:error",
          message: triage,
          variant: "error",
          eventType: "ignored",
        })
        await log.warn(`IGNORED evidence: ${formatIgnoredEvidence(ignoredTier.evidence)}`)
      }

      newState = {
        ...newState,
        metrics: {
          ...newState.metrics,
          governance_counters: counters,
        },
      }

      // Track tool call health (success rate)
      newState = trackToolHealth(newState, true)

      // Chain break logging
      const chainBreaks = detectChainBreaks(newState);
      if (chainBreaks.length > 0) {
        await log.warn(
          `Chain breaks: ${chainBreaks.map(b => b.message).join("; ")}`
        );
      }

      // Track commit suggestion timing
      const commitSuggestion = shouldSuggestCommit(newState, config.commit_suggestion_threshold);
      if (commitSuggestion) {
        newState = setLastCommitSuggestionTurn(newState, newState.metrics.turn_count);
      }

      // Long session detection
      const longSession = detectLongSession(newState, config.auto_compact_on_turns);
      if (!suppressHumanFacing && longSession.isLong) {
        await log.warn(longSession.suggestion);
      }

      // === Cycle Intelligence: Auto-capture Task tool returns ===
      if (input.tool === "task" || canonicalTool === "task") {
        const taskOutput = _output.output ?? "";
        const outputMetadata = typeof _output.metadata === "object" && _output.metadata !== null
          ? _output.metadata as Record<string, unknown>
          : undefined
        const delegatedTaskId = extractDelegatedTaskId(taskOutput, outputMetadata)
        newState = addCycleLogEntry(newState, input.tool, taskOutput, {
          taskId: delegatedTaskId,
        });
        if (newState.pending_failure_ack) {
          await log.warn(
            `Cycle intelligence: subagent reported failure signals. pending_failure_ack set. Agent must call export_cycle or map_context(blocked) to acknowledge.`
          );
        }
        await log.debug(
          `Cycle intelligence: auto-captured Task return (${taskOutput.length} chars, failure=${newState.pending_failure_ack}, task_id=${delegatedTaskId ?? "none"})`,
        );
      }

      // Soft-ramp deterministic trigger tracking.
      // - after task delegation: require cycle export capture
      // - after write batch: require explicit context checkpoint
      if ((input.tool === "task" || canonicalTool === "task") && !pendingMandatory.includes("hivemind_cycle")) {
        pendingMandatory.push("hivemind_cycle")
      }
      if (toolCategory === "write" && canonicalTool !== "task" && !pendingMandatory.includes("hivemind_session")) {
        pendingMandatory.push("hivemind_session")
      }
      pendingMandatory = dedupeStrings(pendingMandatory)
      newState = {
        ...newState,
        pending_mandatory_tools: pendingMandatory,
      }

      let hasActiveTask = false
      let activeTaskStatus: string | undefined
      try {
        const trajectoryState = await loadTrajectory(directory)
        const activeTaskIdsFromTrajectory = trajectoryState?.trajectory?.active_task_ids ?? []
        if (activeTaskIdsFromTrajectory.length > 0) {
          const graphTasks = await loadGraphTasks(directory, { enabled: false })
          const activeTaskIds = new Set(activeTaskIdsFromTrajectory)
          const activeTask = graphTasks.tasks.find((task) => (
            activeTaskIds.has(task.id)
            && (task.status === "in_progress" || task.status === "active")
          ))
          if (activeTask) {
            hasActiveTask = true
            activeTaskStatus = activeTask.status
          }
        }
      } catch {
        // P3: auto-commit context loading failure is non-fatal
      }

      if (shouldAutoCommit({
        tool: input.tool,
        hasActiveTask,
        taskStatus: activeTaskStatus,
        configEnabled: config.auto_commit,
      })) {
        const modifiedFiles = extractModifiedFiles(
          _output.metadata,
          newState.metrics.files_touched,
        )

        if (modifiedFiles.length > 0) {
          try {
            const autoCommit = await executeAutoCommit({
              tool: input.tool,
              directory,
              sessionID: input.sessionID,
              files: modifiedFiles,
            })
            const logPrefix = autoCommit.success ? "Auto-commit succeeded" : "Auto-commit skipped"
            await log.debug(`${logPrefix}: ${autoCommit.message}`)
          } catch (error: unknown) {
            await log.debug(`Auto-commit skipped: ${error instanceof Error ? error.message : String(error)}`)
          }
        } else {
          await log.debug(`Auto-commit skipped: no modified files detected for ${input.tool}`)
        }
      }

      const splitResult = await maybeCreateNonDisruptiveSessionSplit(
        directory,
        newState,
        {
          log,
          hiveMindConfig: config,
          sessionID: input.sessionID,
          triggerTool: input.tool,
          client: getClient() as unknown as Parameters<typeof maybeCreateNonDisruptiveSessionSplit>[2]["client"],
          emitToast: (opts) => emitGovernanceToast(log, opts),
        }
      )
      if (splitResult) {
        newState = splitResult.state
      }

      // CQRS-compliant: queue mutation then flush immediately on tool boundary.
      // This ensures mutations are applied atomically at every tool call,
      // not deferred until a HiveMind tool happens to run.
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: newState,
        source: "soft-governance"
      }, input.sessionID)

      try {
        await flushMutations(stateManager, input.sessionID)
      } catch (flushError) {
        // Non-fatal: mutations stay in queue for next flush opportunity
        await log.warn(`Mutation flush failed in soft-governance: ${flushError instanceof Error ? flushError.message : String(flushError)}`)
      }

      // Log drift warnings if detected
      if (driftWarning) {
        await log.warn(
          `Drift detected: ${newState.metrics.turn_count} turns without context update. Use map_context to re-focus.`
        )
      }

      // FLAW-TOAST-007 FIX: Removed drift toast emission
      // Drift is visible in scan_hierarchy output - no push notification needed
      // Counter updates happen in session.idle event handler (event-handler.ts)

      await log.debug(
        `Soft governance: tracked ${input.tool} (${toolCategory}), turns=${newState.metrics.turn_count}, violations=${newState.metrics.violation_count}`
      )
    } catch (error) {
      // P3: Never break tool execution
      await log.error(`Soft governance hook error: ${error}`)
    }
  }
}

/**
 * Determines if a tool usage should be tracked as a governance violation.
 *
 * Certain tools indicate the agent is ignoring governance:
 *   - write/edit tools when session is LOCKED (should use declare_intent first)
 *   - Repeated tool calls without any map_context updates
 */
function shouldTrackAsViolation(toolName: string, governanceMode: string): boolean {
  if (governanceMode === "strict") {
    return toolName === "write" || toolName === "edit"
  }
  return false
}

/**
 * Track tool health metrics (success rate).
 */
function trackToolHealth(state: BrainState, success: boolean): BrainState {
  const total = state.metrics.total_tool_calls + 1
  const successful = success
    ? state.metrics.successful_tool_calls + 1
    : state.metrics.successful_tool_calls
  const healthScore = total > 0 ? Math.round((successful / total) * 100) : 100

  return {
    ...state,
    metrics: {
      ...state.metrics,
      total_tool_calls: total,
      successful_tool_calls: successful,
      auto_health_score: healthScore,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  }
}

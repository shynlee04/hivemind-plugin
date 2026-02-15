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

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  addViolationCount,
  incrementTurnCount,
  setLastCommitSuggestionTurn,
  addCycleLogEntry,
  type BrainState,
} from "../schemas/brain-state.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { shouldSuggestCommit } from "../lib/commit-advisor.js"
import { detectLongSession } from "../lib/long-session.js"
import { executeAutoCommit, extractModifiedFiles, shouldAutoCommit } from "../lib/auto-commit.js"
import { getClient } from "./sdk-context.js"
import { checkAndRecordToast, resetAllThrottles } from "../lib/toast-throttle.js"
import { loadTree, countCompleted, getAncestors } from "../lib/hierarchy-tree.js"
import { estimateContextPercent, shouldCreateNewSession } from "../lib/session-boundary.js"
import { generateExportData, generateJsonExport, generateMarkdownExport } from "../lib/session-export.js"
import { getExportDir } from "../lib/planning-fs.js"
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
  evaluateIgnoredResetPolicy,
  formatIgnoredEvidence,
  acknowledgeGovernanceSignals,
  registerGovernanceSignal,
  resetGovernanceCounters,
  type GovernanceCounters,
  type DetectionState,
} from "../lib/detection.js"

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

  const client = getClient()
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

function getActiveActionLabel(state: any): string {
  if (state.hierarchy.action) return state.hierarchy.action
  if (state.hierarchy.tactic) return state.hierarchy.tactic
  if (state.hierarchy.trajectory) return state.hierarchy.trajectory
  return "(none)"
}

const AUTO_SPLIT_TRIGGER_TOOLS = new Set(["map_context", "export_cycle", "scan_hierarchy"])

async function maybeCreateNonDisruptiveSessionSplit(opts: {
  log: Logger
  directory: string
  config: HiveMindConfig
  state: BrainState
  sessionID: string
  triggerTool: string
}): Promise<BrainState> {
  const { log, directory, config, state, sessionID, triggerTool } = opts

  if (config.automation_level !== "full") return state
  if (!AUTO_SPLIT_TRIGGER_TOOLS.has(triggerTool)) return state
  if (state.pending_failure_ack) return state

  const role = (state.session.role || "").toLowerCase()
  const isMainSession = !role.includes("subagent")
  if (!isMainSession) return state

  const hasDelegations = (state.cycle_log ?? []).some(entry => entry.tool === "task")
  const contextPercent = estimateContextPercent(
    state.metrics.turn_count,
    config.auto_compact_on_turns
  )
  if (contextPercent >= 80 || state.metrics.turn_count < 30 || hasDelegations) {
    return state
  }

  let completedBranchCount = 0
  let treeFocusPath = ""
  try {
    const tree = await loadTree(directory)
    if (tree.root) {
      completedBranchCount = countCompleted(tree)
      if (tree.cursor) {
        const path = getAncestors(tree.root, tree.cursor).map(node => node.content).join(" > ")
        if (path) treeFocusPath = path
      }
    }
  } catch {
    return state
  }

  const boundary = shouldCreateNewSession({
    turnCount: state.metrics.turn_count,
    contextPercent,
    hierarchyComplete: completedBranchCount > 0,
    isMainSession,
    hasDelegations,
  })

  if (!boundary.recommended) return state

  const client = getClient() as any
  if (!client?.session?.create) {
    await log.debug("Auto split skipped: SDK client.session.create unavailable")
    return state
  }

  try {
    const summary = `Auto split: ${boundary.reason}`
    const exportData = generateExportData(state, summary)
    const exportDir = getExportDir(directory)
    await mkdir(exportDir, { recursive: true })
    const stamp = new Date().toISOString().split("T")[0]
    const baseName = `session_${stamp}_${state.session.id}_autosplit`
    const body = [
      summary,
      state.hierarchy.trajectory ? `Trajectory: ${state.hierarchy.trajectory}` : "",
      state.hierarchy.tactic ? `Tactic: ${state.hierarchy.tactic}` : "",
      state.hierarchy.action ? `Action: ${state.hierarchy.action}` : "",
    ].filter(Boolean).join("\n")

    await writeFile(join(exportDir, `${baseName}.json`), generateJsonExport(exportData))
    await writeFile(join(exportDir, `${baseName}.md`), generateMarkdownExport(exportData, body))

    const focus =
      state.hierarchy.action ||
      state.hierarchy.tactic ||
      state.hierarchy.trajectory ||
      treeFocusPath ||
      "Continuation"
    const created = await client.session.create({
      directory,
      title: `HiveMind split: ${focus}`,
      parentID: sessionID,
    })
    const createdSessionId = typeof created?.id === "string" ? created.id : "unknown"

    await emitGovernanceToast(log, {
      key: "session_split:info",
      message: `Boundary reached. Started continuation session ${createdSessionId}.`,
      variant: "info",
      eventType: "session_split",
    })

    const now = Date.now()
    const resetDetection = createDetectionState()
    const splitState: BrainState = {
      ...state,
      session: {
        ...state.session,
        start_time: now,
        last_activity: now,
        date: new Date(now).toISOString().split("T")[0],
      },
      metrics: {
        ...state.metrics,
        turn_count: 0,
        drift_score: 100,
        files_touched: [],
        consecutive_failures: 0,
        consecutive_same_section: 0,
        last_section_content: "",
        tool_type_counts: resetDetection.tool_type_counts,
        keyword_flags: [],
        write_without_read_count: 0,
        governance_counters: resetGovernanceCounters(state.metrics.governance_counters, {
          full: true,
          prerequisitesCompleted: Boolean(
            state.hierarchy.trajectory &&
            state.hierarchy.tactic &&
            state.hierarchy.action
          ),
        }),
      },
      complexity_nudge_shown: false,
    }

    await log.info(`[autosplit] Created non-disruptive session ${createdSessionId} (${boundary.reason})`)
    return splitState
  } catch (error: unknown) {
    await log.warn(
      `Auto split skipped: ${error instanceof Error ? error.message : String(error)}`
    )
    return state
  }
}

/**
 * Creates the soft governance hook for tool execution tracking.
 *
 * This is the COUNTER engine. It fires after every tool call and writes
 * detection state to brain.json.metrics. The session-lifecycle hook then
 * reads these counters and compiles signals into prompt warnings.
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
    },
    _output: {
      title: string
      output: string
      metadata: any
    }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      const state = await stateManager.load()
      if (!state) {
        await log.warn("Soft governance: no brain state found")
        return
      }

      // Increment turn count for every tool call
      let newState = incrementTurnCount(state)
      let counters: GovernanceCounters = newState.metrics.governance_counters
      const prerequisitesCompleted = Boolean(
        newState.hierarchy.trajectory &&
        newState.hierarchy.tactic &&
        newState.hierarchy.action
      )
      counters = {
        ...counters,
        prerequisites_completed: prerequisitesCompleted,
      }

      if (input.tool === "map_context" || input.tool === "declare_intent") {
        counters = acknowledgeGovernanceSignals(counters)
      }

      const hierarchyImpact =
        !newState.hierarchy.trajectory || !newState.hierarchy.tactic
          ? "high"
          : !newState.hierarchy.action
            ? "medium"
            : "low"
      const resetDecision = evaluateIgnoredResetPolicy({
        counters,
        prerequisitesCompleted,
        missedStepCount: counters.out_of_order + counters.evidence_pressure,
        hierarchyImpact,
      })
      if (resetDecision.fullReset) {
        counters = resetGovernanceCounters(counters, {
          full: true,
          prerequisitesCompleted,
        })
      } else if (resetDecision.downgrade) {
        counters = {
          ...counters,
          ignored: Math.max(0, counters.ignored - resetDecision.decrementBy),
          acknowledged: false,
          prerequisites_completed: prerequisitesCompleted,
        }
      }

      // Check for drift (high turns without context update)
      const driftWarning = newState.metrics.turn_count >= config.max_turns_before_warning &&
                           newState.metrics.drift_score < 50

      // === Detection Engine: Tool Classification ===
      const toolCategory = classifyTool(input.tool)

      // === FileGuard: Write-without-read tracking ===
      // If a write/edit tool fires and no reads have occurred yet, increment blind-write counter
      if (toolCategory === "write" && input.tool !== "bash") {
        const readCount = newState.metrics.tool_type_counts?.read ?? 0;
        if (readCount === 0) {
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

      // Increment tool type counter
      detection = {
        ...detection,
        tool_type_counts: incrementToolType(detection.tool_type_counts, toolCategory),
      }

      // Track tool result (success inferred — hook fires means no exception)
      detection = trackToolResult(detection, true)

      // Track section repetition when map_context is called
      if (input.tool === "map_context") {
        const focus =
          newState.hierarchy.action ||
          newState.hierarchy.tactic ||
          newState.hierarchy.trajectory
        detection = trackSectionUpdate(detection, focus)
      }

      // New intent declaration resets repetition tracking
      if (input.tool === "declare_intent") {
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
        },
      }

      // === Governance Violations ===
      const isIgnoredTool = shouldTrackAsViolation(input.tool, state.session.governance_mode)

      if (isIgnoredTool && state.session.governance_status === "LOCKED") {
        // Agent is trying to use tools when session is LOCKED
        newState = addViolationCount(newState)
        const repetitionCount = counters.out_of_order
        counters = registerGovernanceSignal(counters, "out_of_order")
        const severity = computeGovernanceSeverity({
          kind: "out_of_order",
          repetitionCount,
          acknowledged: counters.acknowledged,
        })

        // Only emit toast on severity escalation (not every occurrence)
        const outOfOrderMessage = localize(
          config.language,
          `Tool ${input.tool} used before prerequisites. Call declare_intent first, then continue.`,
          `Da dung tool ${input.tool} truoc prerequisite. Goi declare_intent truoc roi tiep tuc.`,
        )
        await emitGovernanceToast(log, {
          key: `out_of_order:${severity}`,
          message: outOfOrderMessage,
          variant: variantFromSeverity(severity),
          eventType: "governance",
        })

        await log.warn(
          `Governance violation: tool '${input.tool}' used in LOCKED session. Violation count: ${newState.metrics.violation_count}`
        )
      }

      const hasEvidencePressure =
        detection.keyword_flags.length > 0 ||
        detection.consecutive_failures > 0
      if (hasEvidencePressure && config.governance_mode !== "permissive") {
        const repetitionCount = counters.evidence_pressure
        counters = registerGovernanceSignal(counters, "evidence_pressure")
        const severity = computeGovernanceSeverity({
          kind: "evidence_pressure",
          repetitionCount,
          acknowledged: counters.acknowledged,
        })

        // Only emit toast on severity escalation
        const evidenceMessage = localize(
          config.language,
          `Evidence pressure active. Use think_back and verify before next claim.`,
          `Evidence pressure dang bat. Dung think_back va xac minh truoc khi ket luan tiep.`,
        )
        await emitGovernanceToast(log, {
          key: `evidence_pressure:${severity}`,
          message: evidenceMessage,
          variant: variantFromSeverity(severity),
          eventType: "evidence",
        })
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

      if (ignoredTier) {
        const actionLabel = getActiveActionLabel(newState)
        const triage = buildIgnoredTriageMessage(
          config.language,
          `IGNORED tier: ${computeUnacknowledgedCycles(counters)} unacknowledged governance cycles (${ignoredTier.tone})`,
          actionLabel,
        )
        counters = registerGovernanceSignal(counters, "ignored")
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
      if (longSession.isLong) {
        await log.warn(longSession.suggestion);
      }

      // === Cycle Intelligence: Auto-capture Task tool returns ===
      if (input.tool === "task") {
        const taskOutput = _output.output ?? "";
        newState = addCycleLogEntry(newState, input.tool, taskOutput);
        if (newState.pending_failure_ack) {
          await log.warn(
            `Cycle intelligence: subagent reported failure signals. pending_failure_ack set. Agent must call export_cycle or map_context(blocked) to acknowledge.`
          );
        }
        await log.debug(`Cycle intelligence: auto-captured Task return (${taskOutput.length} chars, failure=${newState.pending_failure_ack})`);
      }

      if (config.auto_commit && shouldAutoCommit(input.tool)) {
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

      newState = await maybeCreateNonDisruptiveSessionSplit({
        log,
        directory,
        config,
        state: newState,
        sessionID: input.sessionID,
        triggerTool: input.tool,
      })

      // Single save at the end
      await stateManager.save(newState)

      // Log drift warnings if detected
      if (driftWarning) {
        await log.warn(
          `Drift detected: ${newState.metrics.turn_count} turns without context update. Use map_context to re-focus.`
        )
      }

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
function trackToolHealth(state: any, success: boolean): any {
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

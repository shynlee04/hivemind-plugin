import { type Logger } from "../lib/logging.js"
import { type HiveMindConfig } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { detectFrameworkContext } from "../lib/framework-context.js"
import { isSessionLocked, type BrainState } from "../schemas/brain-state.js"
import { checkComplexity } from "../lib/complexity.js";
import { checkAndRecordToast } from "../lib/toast-throttle.js";
import { normalizeToolAlias } from "../lib/tool-names.js";
import { treeExists } from "../lib/hierarchy-tree.js"
import { loadGraphTasks, loadTrajectory } from "../lib/graph-io.js"
import { validateSessionState, type GatekeeperResult } from "../lib/gatekeeper.js"
import { applyPendingStateMutations } from "../lib/state-mutation-queue.js"
import { shouldSuppressHumanFacingGovernance } from "../lib/session-role.js"

// Tools exempt from governance checks (read-only or meta-tools)
// HC5 CANONICAL NAMES ONLY — legacy names removed in Phase 2 Knot 3
const EXEMPT_TOOLS = new Set([
  // OpenCode built-in read-only tools
  "read", "glob", "grep", "ls", "cat", "find",
  // HiveMind canonical tools (registered in src/tools/index.ts)
  "hivemind_inspect", "hivemind_hierarchy", "hivemind_cycle",
  "hivemind_context", "hivemind_memory", "hivemind_anchor",
  "hivemind_codemap", "hivemind_read_skeleton", "hivemind_mesh_pull",
  "hivemind_plan", "hivemind_declare",
])

/** Canonical tool names for reference (all registered in src/tools/index.ts) */
export const CANONICAL_TOOL_NAMES = [
  "hivemind_session", "hivemind_inspect", "hivemind_memory",
  "hivemind_anchor", "hivemind_hierarchy", "hivemind_cycle",
  "hivemind_context", "hivemind_session_memory", "hivemind_codemap",
  "hivemind_ideate", "hivemind_read_skeleton", "hivemind_precision_patch",
  "hivemind_mesh_pull", "hivemind_doc", "hivemind_declare",
  "hivemind_plan",
] as const

const WRITE_TOOLS = new Set([
  "write", "edit", "bash", "create_file", "delete_file", "move_file", "task",
  "replace_in_file", "append_to_file", "create_directory"
])

// Tools safe to run even during framework conflict (mostly analysis/governance)
const CONFLICT_SAFE_TOOLS = new Set([
  "read", "glob", "grep", "ls", "cat", "find",
  "hivemind_inspect", "hivemind_hierarchy", "hivemind_codemap",
  "hivemind_cycle", "hivemind_read_skeleton",
])

interface ToolGovernancePolicy {
  tier: "universal" | "workflow" | "deterministic"
  allowedRoles: string[]
  mandatoryAt?: string[]
}

const TOOL_POLICIES: Record<string, ToolGovernancePolicy> = {
  read: { tier: "universal", allowedRoles: [] },
  glob: { tier: "universal", allowedRoles: [] },
  grep: { tier: "universal", allowedRoles: [] },
  ls: { tier: "universal", allowedRoles: [] },
  cat: { tier: "universal", allowedRoles: [] },
  find: { tier: "universal", allowedRoles: [] },
  hivemind_inspect: { tier: "deterministic", allowedRoles: [], mandatoryAt: ["before_action"] },
  hivemind_cycle: { tier: "deterministic", allowedRoles: [], mandatoryAt: ["after_subagent"] },
  hivemind_session: { tier: "workflow", allowedRoles: [] },
  write: { tier: "workflow", allowedRoles: ["build", "debug", "hivemaker", "hivehealer"] },
  edit: { tier: "workflow", allowedRoles: ["build", "debug", "hivemaker", "hivehealer"] },
  bash: { tier: "workflow", allowedRoles: ["build", "debug", "hivemaker", "hivehealer"] },
  task: { tier: "workflow", allowedRoles: ["hiveminder", "hivefiver"] },
}

function isExemptTool(toolName: string): boolean {
  const normalized = normalizeToolAlias(toolName)
  return EXEMPT_TOOLS.has(toolName) || EXEMPT_TOOLS.has(normalized)
}

function isWriteTool(toolName: string): boolean {
  const normalized = normalizeToolAlias(toolName)
  return WRITE_TOOLS.has(toolName) || WRITE_TOOLS.has(normalized)
}

/**
 * Build advisory message for framework conflict.
 * Replaces pseudo-blocking language with clear guidance.
 */
function buildFrameworkAdvisory(guidance: string, toolName: string): string {
  return `Governance advisory: ${guidance} Tool '${toolName}' proceeding. Consider resolving framework selection for cleaner tracking.`
}

export interface ToolGateResult {
  allowed: boolean  // Always true - advisory only
  warning?: string
  signal?: {
    type: "governance" | "drift" | "framework" | "complexity"
    severity: "info" | "warning" | "advisory"
    message: string
  }
}

type ToolGateInput = {
  sessionID: string
  tool: string
}

type ToolGateHook = ((
  input: {
    tool: string
    sessionID: string
    callID: string
  },
  _output: {
    args: unknown
  }
) => Promise<void>) & {
  internal: (input: ToolGateInput) => Promise<ToolGateResult>
}

/**
 * Creates the tool gate hook for OpenCode integration.
 *
 * Hook factory pattern — captures config + logger + directory.
 * Returns an OpenCode-compatible hook with correct signature.
 *
 * @param log Logger used for advisory warnings and diagnostics.
 * @param directory Project directory used for config and state resolution.
 * @param _initConfig Initial config snapshot; runtime config is reloaded on each invocation.
 * @returns An OpenCode-compatible advisory-only tool gate hook with `.internal` exposed for tests.
 */
export function createToolGateHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  // Internal hook logic with original signature for direct testing
  const internalHook = async (input: ToolGateInput): Promise<ToolGateResult> => {
    try {
      const { tool: toolName } = input
      const normalizedToolName = normalizeToolAlias(toolName)

      // Always allow exempt tools (governance tools + read-only)
      if (isExemptTool(toolName)) {
        return { allowed: true }
      }

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // Load brain state
      let state = await stateManager.load()
      if (state) {
        state = applyPendingStateMutations(state)
      }
      const suppressHumanFacing = Boolean(state && shouldSuppressHumanFacingGovernance(state))
      if (suppressHumanFacing) {
        return { allowed: true }
      }

      const policy = TOOL_POLICIES[toolName] ?? TOOL_POLICIES[normalizedToolName]
      const normalizedRole = (state?.session.role || "").trim().toLowerCase()
      if (
        policy &&
        policy.allowedRoles.length > 0 &&
        normalizedRole.length > 0 &&
        !policy.allowedRoles.some((role) => normalizedRole.includes(role.toLowerCase()))
      ) {
        return {
          allowed: true,
          warning: `Governance advisory: role '${state?.session.role}' is outside policy for '${toolName}'. Prefer delegation or role-aligned execution.`,
          signal: {
            type: "governance",
            severity: "advisory",
            message: `Tool policy mismatch: ${toolName} requires one of [${policy.allowedRoles.join(", ")}].`,
          },
        }
      }

      // Framework conflict gate (GOV-06/GOV-07)
      const frameworkContext = await detectFrameworkContext(directory)
      if (frameworkContext.mode === "both") {
        const selection = state?.framework_selection
        const selectedFramework = selection?.choice === "gsd" || selection?.choice === "spec-kit"
        const hasGsdSelection = selection?.choice === "gsd" && selection.active_phase.trim().length > 0
        const hasSpecSelection = selection?.choice === "spec-kit" && selection.active_spec_path.trim().length > 0
        const hasSelectionMetadata = selectedFramework && (hasGsdSelection || hasSpecSelection)

        if (!hasSelectionMetadata) {
          const acceptedOverrideOnly = (selection?.acceptance_note?.trim().length ?? 0) > 0
          const guidanceSuffix = acceptedOverrideOnly
            ? " Override note recorded; framework selection metadata is still recommended."
            : ""
          const guidance = `Framework conflict: both the canonical planning root and .spec-kit are active. Consolidate first, then choose framework via locked menu metadata (active_phase or active_spec_path).${guidanceSuffix}`

          // Advisory only - no blocking (HC1 compliance)
          if (!CONFLICT_SAFE_TOOLS.has(toolName)) {
            return {
              allowed: true,
              warning: buildFrameworkAdvisory(guidance, toolName),
              signal: {
                type: "framework",
                severity: "advisory",
                message: guidance,
              },
            }
          }
        }
      }

      // No state = no session initialized yet - Advisory only
      if (!state) {
        const hasTree = treeExists(directory)
        const msg = hasTree
          ? "No session initialized. Use declare_intent to start a tracked session."
          : "Project not scanned. Run hivemind-scan first to build context backbone."

        switch (config.governance_mode) {
          case "strict":
          case "assisted":
            // HC1 COMPLIANCE: Always allow, just advise
            return {
              allowed: true,
              warning: msg,
              signal: {
                type: "governance",
                severity: "advisory",
                message: msg,
              },
            }
          case "permissive":
            return { allowed: true }
        }
      }

      // Session is locked — governance gate - Advisory only
      if (state && isSessionLocked(state)) {
        switch (config.governance_mode) {
          case "strict":
            if (isWriteTool(toolName)) {
              // HC1 COMPLIANCE: Always allow, just advise
              return {
                allowed: true,
                warning: "Session locked. Consider using declare_intent to unlock for better tracking.",
                signal: {
                  type: "governance",
                  severity: "advisory",
                  message: "Write tool used while session locked. Declare intent for proper tracking.",
                },
              }
            }
            return { allowed: true }
          case "assisted":
            if (isWriteTool(toolName)) {
              await log.warn(
                `Write tool "${toolName}" used while session locked.`
              )
              return {
                allowed: true,
                warning: "Session locked. Declare your intent for better tracking.",
              }
            }
            return { allowed: true }
          case "permissive":
            return { allowed: true }
        }
      }

      // Phase 5: First-turn confirmation advisory for write tools
      if (state && isWriteTool(toolName) && state.first_turn_confirmation.required && !state.first_turn_confirmation.confirmed) {
        if (config.governance_mode !== "permissive") {
          return {
            allowed: true,
            warning: "First-turn confirmation pending. Present rationale options and output style before writing.",
            signal: {
              type: "governance",
              severity: "advisory",
              message: "Write tool used before first-turn confirmation. Agent should confirm rationale + output style first.",
            },
          }
        }
      }

      // Session is open — advisory only (persisted writes live in soft-governance).
      if (state) {
        // NOTE: Drift calculation removed (Wave 1 Fix 1.1).
        // tool-gate was using projected turn_count which diverges from
        // calculateDriftScore()'s canonical user_turn_count.
        // Drift warnings are handled by soft-governance.ts as the single owner.

        // Check complexity and show nudge (once per session)
        const complexityCheck = checkComplexity(state)
        if (complexityCheck.isComplex) {
          // Throttle complexity toasts to avoid noise
          if (checkAndRecordToast("complexity", "nudge")) {
            await log.warn(
              `[Advisory] ${complexityCheck.message}`
            )
          }

          return {
            allowed: true,
            signal: {
              type: "complexity",
              severity: "info",
              message: complexityCheck.message,
            },
          }
        }

        // Phase 4: TaskNode advisory for write tools
        if (isWriteTool(toolName)) {
          try {
            const trajectoryState = await loadTrajectory(directory)
            const activeTaskIds = new Set(trajectoryState?.trajectory?.active_task_ids ?? [])

            if (activeTaskIds.size === 0) {
              return {
                allowed: true,
                warning: "No active TaskNode found. Consider creating a task/plan before making changes.",
                signal: {
                  type: "governance",
                  severity: "advisory",
                  message: "Write tool used without active TaskNode. Changes may not be tracked in SOT.",
                },
              }
            }

            const graphTasks = await loadGraphTasks(directory, { enabled: false })
            const hasTrackedTask = graphTasks.tasks.some((task) => (
              activeTaskIds.has(task.id)
              && (task.status === "in_progress" || task.status === "active")
            ))
            if (!hasTrackedTask) {
              return {
                allowed: true,
                warning: "No active TaskNode found. Consider creating a task/plan before making changes.",
                signal: {
                  type: "governance",
                  severity: "advisory",
                  message: "Write tool used without active TaskNode. Changes may not be tracked in SOT.",
                },
              }
            }
          } catch {
            // P3: TaskNode lookup failure is non-fatal
          }
        }
      }

      return { allowed: true }
    } catch (error) {
      // P3: Never break tool execution
      await log.error(`Tool gate error: ${error}`)
      return { allowed: true }
    }
  }

  // OpenCode-compatible hook with proper signature
  // tool.execute.before receives: { tool: string, sessionID: string, callID: string }
  // and receives output: { args: unknown } to modify
  const outerHook: ToolGateHook = async (
    input: {
      tool: string
      sessionID: string
      callID: string
    },
    _output: {
      args: unknown
    }
  ): Promise<void> => {
    // Call internal hook for governance logic
    const result = await internalHook({
      sessionID: input.sessionID,
      tool: input.tool
    })

    // Log warnings (we never block execution - HC1 compliance)
    if (result.warning) {
      await log.warn(result.warning)
    }
    if (result.signal) {
      await log.debug(`Tool gate signal: ${result.signal.type} - ${result.signal.message}`)
    }
  }

  // Expose internal hook for testing
  outerHook.internal = internalHook

  return outerHook
}

/**
 * Creates the tool gate hook and returns its internal logic for direct testing.
 * Equivalent to createToolGateHook(log, directory, config).internal
 *
 * @deprecated Use createToolGateHook(log, directory, config).internal instead.
 */
export function createToolGateHookInternal(
  log: Logger,
  directory: string,
  config: HiveMindConfig
): (input: {
  sessionID: string
  tool: string
}) => Promise<ToolGateResult> {
  const hook = createToolGateHook(log, directory, config)
  return hook.internal
}

/**
 * US-016: Hard Gatekeeper - Pre-stop validation.
 *
 * Call this before stopping to enforce programmatic checks.
 * Returns violations and suggestions - does NOT block execution (HC1 compliance).
 *
 * @param brain The current brain state to validate
 * @param options Validation options (maxDriftScore, maxTurns)
 * @returns GatekeeperResult with pass/fail status and violations
 */
export function runPreStopGate(
  brain: BrainState,
  options?: {
    maxDriftScore?: number
    maxTurns?: number
  }
): GatekeeperResult {
  return validateSessionState(brain, options)
}

/**
 * Create a pre-stop gate function with directory context.
 * Loads brain state from disk and runs gatekeeper validation.
 */
export function createPreStopGate(
  directory: string,
  options?: {
    maxDriftScore?: number
    maxTurns?: number
  }
): () => Promise<GatekeeperResult> {
  const stateManager = createStateManager(directory)

  return async (): Promise<GatekeeperResult> => {
    const state = await stateManager.load()
    if (!state) {
      return {
        passed: false,
        violations: [{
          code: "NO_SESSION",
          message: "No session state found",
          severity: "critical",
          suggestion: "Initialize session with declare_intent first",
        }],
        summary: "Gatekeeper blocked: No session state",
      }
    }
    return validateSessionState(state, options)
  }
}

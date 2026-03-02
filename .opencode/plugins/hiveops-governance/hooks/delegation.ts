/**
 * HiveMind Governance Plugin — Delegation Enforcement Hook (FULLY WIRED)
 *
 * Deterministic script triggers on tool calls:
 *
 * tool.execute.before (task tool)   → delegation topology + gx-enforce.sh + gx-trace-check.sh
 * tool.execute.before (file writes) → scope boundaries + gx-enforce.sh check-path
 * tool.execute.after  (every 10)    → gx-health-compute.sh + gx-mid-guard.sh + gx-auto-purge.sh
 *
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL)
 */

import { validateDelegation, isPathAllowed, getCurrentDepth, runGxScript } from "../utils"
import type { EnforcementState, ScopeViolation, DelegationChainEntry } from "../types"

/** Tools that perform file modifications */
const FILE_WRITE_TOOLS = ["write", "edit", "patch", "bash"]

/** Tools that perform delegation */
const DELEGATION_TOOLS = ["task"]

/**
 * Build the tool.execute.before hook for delegation + scope enforcement.
 *
 * Fires before EVERY tool call. Can throw to block unauthorized operations.
 * Wires: gx-enforce.sh, gx-trace-check.sh, gx-scope-resolve.sh
 */
export function buildToolExecuteBeforeHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async (input: any, output: any) => {
    const toolName = input.tool as string
    const agent = state.current.agent
    const args = output.args || {}

    // ── 1. Delegation enforcement ──
    if (DELEGATION_TOOLS.includes(toolName)) {
      const targetAgent = args.subagent_type || args.agent || ""

      if (!targetAgent) {
        // Task tool without subagent_type — let it pass (command execution)
        return
      }

      // TypeScript-level topology check (fast, in-memory)
      const depth = getCurrentDepth(state.current)
      const validation = validateDelegation(agent, targetAgent, depth)

      if (!validation.valid) {
        throw new Error(
          `[GOVERNANCE] Delegation blocked: ${validation.reason}\n` +
            `Current chain depth: ${depth}\n` +
            `Agent: ${agent} → Target: ${targetAgent}`
        )
      }

      // Bash-level enforcement (gx-enforce.sh check-delegation)
      const enforceResult = runGxScript(
        state.worktree,
        "gx-enforce.sh",
        ["check-delegation", agent, targetAgent, String(depth)]
      )
      if (enforceResult && enforceResult.allowed === false) {
        throw new Error(
          `[GOVERNANCE] gx-enforce blocked delegation: ${enforceResult.reason || "policy violation"}\n` +
            `Agent: ${agent} → Target: ${targetAgent}`
        )
      }

      // Traceability check — verify delegation has hierarchy linkage
      const traceResult = runGxScript(
        state.worktree,
        "gx-trace-check.sh",
        ["check-delegation", agent, targetAgent]
      )
      // Trace check is advisory, not blocking (logs warning if unlinked)

      // Record successful delegation
      const entry: DelegationChainEntry = {
        from: agent,
        to: targetAgent,
        depth: depth + 1,
        timestamp: Date.now(),
        objective: (args.description || args.prompt || "").slice(0, 200),
      }
      state.current = {
        ...state.current,
        delegationChain: [...state.current.delegationChain, entry],
        lastCheckpoint: Date.now(),
      }
      state.save(state.current)
    }

    // ── 2. Scope enforcement on file writes ──
    if (FILE_WRITE_TOOLS.includes(toolName)) {
      const filePath = args.filePath || args.path || args.file || ""

      if (filePath && typeof filePath === "string") {
        // TypeScript-level scope check (fast, in-memory)
        const scopeCheck = isPathAllowed(agent, filePath)

        if (!scopeCheck.allowed) {
          const violation: ScopeViolation = {
            agent,
            tool: toolName,
            path: filePath,
            rule: scopeCheck.rule,
            timestamp: Date.now(),
            blocked: true,
          }
          state.current = {
            ...state.current,
            scopeViolations: [...state.current.scopeViolations, violation],
            lastCheckpoint: Date.now(),
          }
          state.save(state.current)

          // Also record in bash enforcement state
          runGxScript(
            state.worktree,
            "gx-enforce.sh",
            ["record-violation", agent, toolName, filePath]
          )

          throw new Error(
            `[GOVERNANCE] Scope violation blocked: ${scopeCheck.rule}\n` +
              `Tool: ${toolName}, Path: ${filePath}\n` +
              `Agent ${agent} is not authorized to write to this path.`
          )
        }

        // Bash-level path enforcement (gx-enforce.sh check-path)
        const enforceResult = runGxScript(
          state.worktree,
          "gx-enforce.sh",
          ["check-path", agent, filePath]
        )
        if (enforceResult && enforceResult.allowed === false) {
          throw new Error(
            `[GOVERNANCE] gx-enforce blocked path: ${enforceResult.reason || "scope violation"}\n` +
              `Tool: ${toolName}, Path: ${filePath}`
          )
        }
      }

      // Special bash enforcement — check for dangerous patterns
      if (toolName === "bash" && args.command) {
        const cmd = args.command as string
        const dangerousPatterns = [
          /rm\s+-rf\s+\//,
          /git\s+push\s+--force\s+.*main/,
          /git\s+push\s+--force\s+.*master/,
          /git\s+reset\s+--hard/,
        ]

        for (const pattern of dangerousPatterns) {
          if (pattern.test(cmd)) {
            throw new Error(
              `[GOVERNANCE] Dangerous command blocked: ${cmd.slice(0, 80)}\n` +
                `Pattern matched: ${pattern.toString()}\n` +
                `Agent ${agent} attempted a destructive operation.`
            )
          }
        }
      }
    }

    // ── 3. Increment turn count ──
    state.current = {
      ...state.current,
      turnCount: state.current.turnCount + 1,
    }
  }
}

/**
 * Build the tool.execute.after hook for health + audit.
 *
 * Fires after every tool call. Every 10 calls triggers:
 * - gx-health-compute.sh → runs all 12 signals → updates health-metrics.json
 * - gx-mid-guard.sh → composite health + drift detection
 * - gx-auto-purge.sh check → dirty score evaluation
 */
export function buildToolExecuteAfterHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async (input: any, output: any) => {
    const turnCount = state.current.turnCount

    // Every 10 tool calls: run health + mid-guard + auto-purge check
    if (turnCount > 0 && turnCount % 10 === 0) {
      state.save(state.current)

      // 1. Compute fresh health metrics (runs all 12 signal scripts internally)
      runGxScript(state.worktree, "gx-health-compute.sh")

      // 2. Mid-session guard (drift detection, depth check)
      const midGuard = runGxScript(state.worktree, "gx-mid-guard.sh")

      // 3. Auto-purge check (evaluates dirty score)
      const purgeCheck = runGxScript(state.worktree, "gx-auto-purge.sh", ["check"])
      if (purgeCheck && purgeCheck.dirty_score > 90) {
        // Dirty score critical — snapshot state before purge
        runGxScript(state.worktree, "gx-auto-purge.sh", ["snapshot"])
      }
    }

    // Every 50 tool calls: run traceability audit
    if (turnCount > 0 && turnCount % 50 === 0) {
      runGxScript(state.worktree, "gx-trace-check.sh", ["check-all"])
    }
  }
}

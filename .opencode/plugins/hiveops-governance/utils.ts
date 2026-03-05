/**
 * HiveMind Governance Plugin — Utility Functions
 *
 * Shared helpers for path matching, state I/O, and
 * delegation chain validation.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"
import type { EnforcementState, ScopeViolation, DelegationChainEntry } from "./types"
import { DELEGATION_TOPOLOGY, SCOPE_BOUNDARIES } from "./types"

const STATE_DIR = ".hivemind/state"
const ENFORCEMENT_FILE = "enforcement.json"

/** Check if a file path matches a scope pattern */
export function matchesScope(filePath: string, pattern: string): boolean {
  if (pattern === "*") return true
  const normalized = filePath.replace(/^\/+/, "").replace(/\\/g, "/")
  const normalizedPattern = pattern.replace(/\*+$/, "").replace(/\/+$/, "/")
  return normalized.startsWith(normalizedPattern)
}

/** Check if an agent is allowed to edit a given path */
export function isPathAllowed(agent: string, filePath: string): { allowed: boolean; rule: string } {
  const boundary = SCOPE_BOUNDARIES[agent]
  if (!boundary) return { allowed: false, rule: `Unknown agent: ${agent}` }

  // Check deny paths first (deny takes precedence)
  for (const denyPath of boundary.denyPaths) {
    if (matchesScope(filePath, denyPath)) {
      return { allowed: false, rule: `Agent ${agent} denied: ${denyPath}` }
    }
  }

  // Check allow paths
  for (const allowPath of boundary.allowPaths) {
    if (matchesScope(filePath, allowPath)) {
      return { allowed: true, rule: `Agent ${agent} allowed: ${allowPath}` }
    }
  }

  return { allowed: false, rule: `Agent ${agent}: path not in allow list` }
}

/** Validate a delegation attempt */
export function validateDelegation(
  fromAgent: string,
  toAgent: string,
  currentDepth: number
): { valid: boolean; reason: string } {
  const rule = DELEGATION_TOPOLOGY[fromAgent]
  if (!rule) {
    return { valid: false, reason: `Unknown delegating agent: ${fromAgent}` }
  }

  if (!rule.canDelegateTo.includes(toAgent)) {
    return {
      valid: false,
      reason: `Agent ${fromAgent} cannot delegate to ${toAgent}. Allowed: [${rule.canDelegateTo.join(", ")}]`,
    }
  }

  if (currentDepth >= rule.maxDepth) {
    return {
      valid: false,
      reason: `Delegation depth ${currentDepth + 1} exceeds max ${rule.maxDepth} for ${fromAgent}`,
    }
  }

  const targetRule = DELEGATION_TOPOLOGY[toAgent]
  if (targetRule && targetRule.canDelegateTo.length === 0 && currentDepth > 0) {
    // Terminal agent — fine, they can't delegate further
  }

  return { valid: true, reason: `Delegation ${fromAgent} → ${toAgent} at depth ${currentDepth + 1} approved` }
}

/** Load enforcement state from disk */
export function loadEnforcementState(worktree: string): EnforcementState | null {
  const statePath = join(worktree, STATE_DIR, ENFORCEMENT_FILE)
  if (!existsSync(statePath)) return null
  try {
    const raw = readFileSync(statePath, "utf-8")
    return JSON.parse(raw) as EnforcementState
  } catch {
    return null
  }
}

/** Save enforcement state to disk */
export function saveEnforcementState(worktree: string, state: EnforcementState): void {
  const dir = join(worktree, STATE_DIR)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const statePath = join(dir, ENFORCEMENT_FILE)
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8")
}

/** Create a fresh enforcement state */
export function createEnforcementState(sessionId: string, agent: string): EnforcementState {
  return {
    sessionId,
    agent,
    delegationChain: [],
    gatesPassed: [],
    scopeViolations: [],
    turnCount: 0,
    lastCheckpoint: Date.now(),
    classificationPending: false,
    classificationDone: false,
  }
}

/** Record a delegation in the chain */
export function recordDelegation(
  state: EnforcementState,
  entry: DelegationChainEntry
): EnforcementState {
  return {
    ...state,
    delegationChain: [...state.delegationChain, entry],
    lastCheckpoint: Date.now(),
  }
}

/** Record a scope violation */
export function recordViolation(
  state: EnforcementState,
  violation: ScopeViolation
): EnforcementState {
  return {
    ...state,
    scopeViolations: [...state.scopeViolations, violation],
    lastCheckpoint: Date.now(),
  }
}

/** Get current delegation depth */
export function getCurrentDepth(state: EnforcementState): number {
  return state.delegationChain.length
}

// ── Cross-platform script runner ──────────────────────────────────────────────
// Works on macOS (bash), Linux (bash), Windows (Git Bash / WSL).
// Uses `bash` which ships with Git-for-Windows and WSL.
// Every call is fire-and-forget with a hard timeout so hooks never block > N ms.

const SCRIPTS_DIR = ".opencode/skills/gx-context-engine/scripts"

/** Resolve bash binary — Git Bash on Windows, /usr/bin/env bash elsewhere */
function resolveBash(): string {
  if (process.platform === "win32") {
    // Git for Windows ships bash at C:\Program Files\Git\bin\bash.exe
    const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe"
    if (existsSync(gitBash)) return `"${gitBash}"`
    // Fallback: hope it's on PATH (WSL, MSYS2, Cygwin)
    return "bash"
  }
  return "bash"
}

/**
 * Run a GX script deterministically. Returns parsed JSON or null on failure.
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL).
 *
 * @param worktree  - project root
 * @param script    - script name relative to scripts/ (e.g. "gx-health-compute.sh")
 * @param args      - additional CLI args passed after worktree
 * @param timeoutMs - hard kill timeout (default 8000ms)
 */
export function runGxScript(
  worktree: string,
  script: string,
  args: string[] = [],
  timeoutMs = 8000
): Record<string, any> | null {
  const scriptPath = join(worktree, SCRIPTS_DIR, script)
  if (!existsSync(scriptPath)) return null

  const bash = resolveBash()
  // Normalize paths to forward slashes for bash on all platforms
  const normalizedScript = scriptPath.replace(/\\/g, "/")
  const normalizedWorktree = worktree.replace(/\\/g, "/")
  const argsStr = args.map((a) => `"${a.replace(/\\/g, "/")}"`).join(" ")
  const cmd = `${bash} "${normalizedScript}" "${normalizedWorktree}" ${argsStr}`.trim()

  try {
    const stdout = execSync(cmd, {
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, GX_NON_INTERACTIVE: "1" },
      cwd: worktree,
    })
    const text = stdout.toString("utf-8").trim()
    if (!text) return null
    // Parse last JSON object in output (scripts may emit logs before JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}\s*$/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

/**
 * Run a GX script async (fire-and-forget). Does NOT block the hook.
 * For non-critical side-effects (archival, SOT registration).
 */
export function runGxScriptAsync(
  worktree: string,
  script: string,
  args: string[] = []
): void {
  const scriptPath = join(worktree, SCRIPTS_DIR, script)
  if (!existsSync(scriptPath)) return

  const bash = resolveBash()
  const normalizedScript = scriptPath.replace(/\\/g, "/")
  const normalizedWorktree = worktree.replace(/\\/g, "/")
  const argsStr = args.map((a) => `"${a.replace(/\\/g, "/")}"`).join(" ")
  const cmd = `${bash} "${normalizedScript}" "${normalizedWorktree}" ${argsStr}`.trim()

  try {
    execSync(cmd, {
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, GX_NON_INTERACTIVE: "1" },
      cwd: worktree,
    })
  } catch {
    // Fire and forget — never crash the hook
  }
}

/** Format enforcement state as a compact summary for injection */
export function formatEnforcementSummary(state: EnforcementState): string {
  const lines: string[] = [
    `## Governance Enforcement State`,
    `- Agent: ${state.agent}`,
    `- Turn: ${state.turnCount}`,
    `- Delegation depth: ${state.delegationChain.length}`,
  ]

  if (state.delegationChain.length > 0) {
    const chain = state.delegationChain.map((e) => `${e.from}→${e.to}`).join(" → ")
    lines.push(`- Chain: ${chain}`)
  }

  if (state.scopeViolations.length > 0) {
    const blocked = state.scopeViolations.filter((v) => v.blocked).length
    lines.push(`- Scope violations: ${state.scopeViolations.length} (${blocked} blocked)`)
  }

  if (state.gatesPassed.length > 0) {
    const passed = state.gatesPassed.filter((g) => g.status === "passed").map((g) => g.gate)
    lines.push(`- Gates passed: [${passed.join(", ")}]`)
  }

  return lines.join("\n")
}

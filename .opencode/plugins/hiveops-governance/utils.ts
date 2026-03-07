/**
 * @deprecated DISABLED 2026-03-08 — This plugin is disabled in opencode.json.
 * Reason: References nonexistent GX-Pack scripts, deep cross-layer imports,
 * and duplicates governance already handled by canonical src/hooks/*.
 * Canonical replacement: src/hooks/ (session-lifecycle, soft-governance,
 * tool-gate, compaction, event-handler, messages-transform).
 * See AGENTS.md §Dual-Injection Systems for context.
 *
 * --- Original description ---
 * HiveMind Governance Plugin — Utility Functions
 *
 * Shared helpers for path matching, state I/O, and
 * delegation chain validation.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { isAbsolute, join } from "node:path"
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
// Single source of truth for non-interactive policy enforcement.

const SCRIPTS_DIR = ".opencode/skills/gx-context-engine/scripts"

const NON_INTERACTIVE_ENV_DEFAULTS: Readonly<Record<string, string>> = {
  CI: "true",
  DEBIAN_FRONTEND: "noninteractive",
  GIT_TERMINAL_PROMPT: "0",
  GIT_EDITOR: "true",
  GIT_PAGER: "cat",
  GCM_INTERACTIVE: "never",
  PAGER: "cat",
  HOMEBREW_NO_AUTO_UPDATE: "1",
  npm_config_yes: "true",
  PIP_NO_INPUT: "1",
  YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
  GX_NON_INTERACTIVE: "1",
  LANG: "C",
  LC_ALL: "C",
}

/** Resolve bash binary — Git Bash on Windows, /usr/bin/env bash elsewhere */
function resolveBashBinary(): string {
  if (process.platform === "win32") {
    // Git for Windows ships bash at C:\Program Files\Git\bin\bash.exe
    const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe"
    if (existsSync(gitBash)) return gitBash
    // Fallback: hope it's on PATH (WSL, MSYS2, Cygwin)
    return "bash"
  }
  return "bash"
}

/**
 * Execute a bash script with enforced non-interactive shell policy.
 *
 * This is the authoritative execution primitive for all governance scripts.
 * All higher-level runners MUST delegate to this helper so environment policy,
 * timeout behavior, and deterministic shell constraints stay centralized.
 *
 * @param worktree - Project root used as process cwd.
 * @param relativeScriptPath - Relative (or absolute) script path to execute.
 * @param args - Positional script arguments.
 * @param timeoutMs - Hard timeout in milliseconds.
 * @returns Trimmed stdout content, or null if execution fails or script is missing.
 */
export function runNonInteractiveScript(
  worktree: string,
  relativeScriptPath: string,
  args: string[] = [],
  timeoutMs = 8000,
): string | null {
  const scriptPath = isAbsolute(relativeScriptPath)
    ? relativeScriptPath
    : join(worktree, relativeScriptPath)

  if (!existsSync(scriptPath)) return null

  const normalizedScriptPath = scriptPath.replace(/\\/g, "/")
  const normalizedArgs = args.map((arg) => arg.replace(/\\/g, "/"))

  try {
    const stdout = execFileSync(resolveBashBinary(), [normalizedScriptPath, ...normalizedArgs], {
      cwd: worktree,
      timeout: timeoutMs,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...NON_INTERACTIVE_ENV_DEFAULTS },
      maxBuffer: 10 * 1024 * 1024,
    })

    return typeof stdout === "string" ? stdout.trim() : null
  } catch {
    return null
  }
}

/**
 * Run a GX script deterministically. Returns parsed JSON or null on failure.
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL).
 *
 * @param worktree  - project root
 * @param script    - script name relative to scripts/ (e.g. "gx-health-compute.sh")
 * @param args      - additional CLI args passed after worktree
 * @param timeoutMs - hard kill timeout (default 8000ms)
 * @returns Parsed JSON object from script output, or null when unavailable/invalid.
 */
export function runGxScript(
  worktree: string,
  script: string,
  args: string[] = [],
  timeoutMs = 8000
): Record<string, any> | null {
  const stdout = runNonInteractiveScript(
    worktree,
    join(SCRIPTS_DIR, script),
    [worktree, ...args],
    timeoutMs,
  )
  if (!stdout) return null

  // Parse last JSON object in output (scripts may emit logs before JSON)
  const jsonMatch = stdout.match(/\{[\s\S]*\}\s*$/)
  if (!jsonMatch) return null

  try {
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
  try {
    runNonInteractiveScript(worktree, join(SCRIPTS_DIR, script), [worktree, ...args], 10000)
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

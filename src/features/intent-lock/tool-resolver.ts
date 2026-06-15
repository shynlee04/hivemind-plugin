/**
 * Intent-lock gate — tool resolver.
 *
 * Maps `IntentState` → allowed tools via a lookup table; applies the bash
 * moderate blocklist (6 regexes) to `bash` tool calls. Per SPEC §6
 * critical note: child sessions are NEVER gated; they inherit the parent's
 * gate via work-contract `allowedSurfaces` enforcement.
 *
 * @see 27.1-SPEC.md §8
 */

import { IntentState, type SessionContext, type ToolDecision } from "./types.js"

/**
 * Permission matrix: per SPEC §8.1. Each state has a Set of allowed
 * tool/action names. The lookup is O(1) via `Set.has`.
 *
 * CRITICAL: The SPEC matrix uses tool names like `task:hm-phase-researcher`
 * and `hivemind-doc:create:.planning/notes/**`. These are kept verbatim.
 */
export const PERMISSION_MATRIX: Record<IntentState, Set<string>> = {
  [IntentState.UNLOCKED]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:read",
    "hivemind-doc:any",
    "delegation-status:find-stackable",
    "execute-slash-command",
    "bash:read-only",
    "hm-intent-checkpoint",
    "hivemind-trajectory:create",
    "hivemind-agent-work-create",
  ]),
  [IntentState.LOCKED_NON_CODE]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:read",
    "hivemind-doc:create:.planning/**",
    "hivemind-doc:upsert:.planning/**",
    "hivemind-doc:write:.planning/**",
    "task:hm-phase-researcher",
    "task:hm-l0-orchestrator",
    "hivemind-trajectory:event:research",
    "hivemind-trajectory:event:planning",
    "delegation-status:find-stackable",
    "execute-slash-command",
    "bash:read-only",
  ]),
  [IntentState.LOCKED_CODE_CHANGE]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:read",
    "hivemind-doc:create:.planning/**",
    "hivemind-doc:upsert:.planning/**",
    "hivemind-doc:write:.planning/**",
    "task:hm-phase-researcher",
    "task:hm-l0-orchestrator",
    "hivemind-trajectory:event:any",
    "hivemind-agent-work-create",
    "delegation-status:find-stackable",
    "execute-slash-command",
    "bash:read-only",
  ]),
  [IntentState.PHASE_READY]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:read",
    "hivemind-doc:create:.planning/**",
    "hivemind-doc:upsert:.planning/**",
    "hivemind-doc:write:.planning/**",
    "task:hm-phase-researcher",
    "task:hm-l0-orchestrator",
    "hivemind-trajectory:event:any",
    "hivemind-agent-work-create",
    "delegation-status:find-stackable",
    "execute-slash-command",
    "bash:read-only",
  ]),
  [IntentState.PHASE_AUTHORIZED]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:read",
    "hivemind-doc:create:.planning/**",
    "hivemind-doc:create:phase-dir",
    "hivemind-doc:upsert:.planning/**",
    "hivemind-doc:write:.planning/**",
    "task:hm-phase-researcher",
    "task:hm-l0-orchestrator",
    "hivemind-trajectory:event:any",
    "hivemind-agent-work-create",
    "delegation-status:find-stackable",
    "execute-slash-command",
    "bash:read-only",
  ]),
  [IntentState.EXECUTING]: new Set([
    "read",
    "glob",
    "grep",
    "hivemind-doc:any",
    "task:any-specialist",
    "delegate-task:any",
    "execute-slash-command:/hm-*",
    "hivemind-trajectory:event:any",
    "hivemind-agent-work-create",
    "write",
    "edit",
    "bash:any",
    "git:commit",
    "git:add",
  ]),
  [IntentState.COMPLETED]: new Set([
    "read",
    "hivemind-doc:read",
    "execute-slash-command:/hm-verify*",
    "execute-slash-command:/hm-ship*",
  ]),
}

/**
 * Bash moderate blocklist — 6 regex patterns per SPEC §8.2.
 *
 * Note on false positives (per RESEARCH Pitfall 4):
 * - The `mv \S+ \S+` pattern may match e.g. `npm run foo:bar` if `foo:bar`
 *   is treated as two tokens. We accept this false-positive rate because
 *   the user can always split the command. The PERMISSION_MATRIX still
 *   gates the `bash` tool, so the user is not stuck.
 */
export const MODERATE_BASH_PATTERNS: RegExp[] = [
  />>?\s*(?!\/dev\/null(?:\s|$)|&)\S/, // > or >> to a real file (excludes fd-redirects like 2>&1 and /dev/null)
  /\bsed\s+-i\b/,
  /\btee\s+/,
  /\brm\s+(-[a-z]*f|-rf)/,
  /\bmv\s+\S+\s+\S+/,
  /\bchmod\s+/,
]

/** Read-only tools that always pass through without state lookup. */
export const READ_ONLY_TOOLS: Set<string> = new Set(["read", "glob", "grep"])

/**
 * P27.2 surface allowlist: tools that are ALWAYS allowed regardless of
 * the current intent-lock state. These are the user's escape hatches
 * and documentation tools that must never be blocked.
 *
 * - `question`: built-in OpenCode tool for user interaction. Must be
 *   available in any state so the gate can ask confirmation questions.
 * - `hivemind-doc`: document intelligence tool for reading/writing
 *   planning artifacts. Always permitted since it accesses `.planning/**`
 *   which is always safe.
 */
export const ALWAYS_ALLOWED_TOOLS: Set<string> = new Set(["question"])

/**
 * P27.2 surface allowlist: hm-* agents that are allowed via the `task`
 * tool in SL-1/SL-2 (UNLOCKED through PHASE_AUTHORIZED). These agents
 * explore, research, analyze, and clarify intent but do not write code.
 *
 * Agents NOT in this list (hm-executor, hm-planner, etc.) require
 * SL-3+ (EXECUTING state) to execute.
 *
 * @see `ALLOWED_READ_ONLY_AGENTS` in types.ts (same set, exported for
 *   the gate hook's use). We duplicate here to keep tool-resolver
 *   self-contained for unit testing.
 */
export const ALLOWED_HM_AGENTS: ReadonlySet<string> = new Set([
  "hm-intent-loop",
  "hm-codebase-mapper",
  "hm-pattern-mapper",
  "hm-phase-researcher",
  "hm-project-researcher",
  "hm-platform-references",
  "hm-ecologist",
])

/**
 * Read-only bash command prefixes that bypass the blocklist entirely.
 *
 * Checked BEFORE the blocklist — if a command starts with one of these
 * prefixes AND has no shell metacharacters, it is safe and allowed
 * regardless of the state matrix.
 */
export const READ_ONLY_BASH_PREFIXES: readonly string[] = [
  "cat ",
  "ls ",
  "head ",
  "tail ",
  "find ",
  "grep ",
  "rg ",
  "git log",
  "git status",
  "git diff",
  "git show",
  "git rev-parse",
  "git branch",
  "npm test",
  "npm run lint",
  "npm run typecheck",
  "npm run test",
  "npm run build",
  "echo ",
  "echo\"",
  "echo'",
  "node -e ",
  "npx vitest",
] as const

/**
 * Shell metacharacters that disable the read-only whitelist.
 *
 * If any of these appear in the command, the whitelist is skipped and the
 * command falls through to the blocklist + matrix evaluation. This prevents
 * injection attacks like `cat foo.txt; rm -rf /`.
 */
const SHELL_METACHARACTERS = /;|&&|\|\||\||`|\$\(|<|>/

/**
 * Check if a bash command starts with a read-only prefix and has no
 * shell metacharacters. If so, the command is safe and bypasses the
 * blocklist regardless of state.
 *
 * @param command - The bash command string to check.
 * @returns `true` if the command matches a read-only prefix and has no
 *   metacharacters.
 */
export function isReadOnlyBashCommand(command: string): boolean {
  if (SHELL_METACHARACTERS.test(command)) return false
  return READ_ONLY_BASH_PREFIXES.some((prefix) => command.startsWith(prefix))
}

/**
 * Decide whether a tool call is allowed under the current intent-lock state.
 *
 * Decision precedence (first match wins):
 * 1. Non-root classification → `allowed: true` (child inherits parent gate).
 * 2. Read-only tool → `allowed: true`.
 * 3. Gate disabled (`intentLockState === undefined`) → `allowed: true`.
 * 4. Exact match in `PERMISSION_MATRIX[state]` → `allowed: true`.
 * 5. `bash` tool: blocklist first; if passes, check `bash:any` / `bash:read-only`.
 * 6. Non-bash tools: umbrella (`*:any`) and scoped path-aware matching.
 * 7. Default → blocked.
 */
export async function resolveToolPermission(
  toolName: string,
  args: unknown,
  sessionContext: SessionContext,
): Promise<ToolDecision> {
  // Step 1: child sessions are NEVER gated.
  if (sessionContext.classificationKind !== "root") {
    return {
      allowed: true,
      reason: "child session inherits parent gate",
    }
  }

  // Step 2: read-only tools always pass.
  if (READ_ONLY_TOOLS.has(toolName)) {
    return { allowed: true, reason: "read-only tool" }
  }

  // Step 2.5: P27.2 surface allowlist — always-allowed tools.
  // These bypass all state checks and are available in any state.
  // For multi-segment tool names (e.g. "hivemind-doc:create"), check
  // via prefix match so "hivemind-doc" matches "hivemind-doc:create".
  const ALWAYS_ALLOWED_MATCH = [...ALWAYS_ALLOWED_TOOLS].find(
    (allowed) => toolName === allowed || toolName.startsWith(allowed + ":"),
  )
  if (ALWAYS_ALLOWED_MATCH !== undefined) {
    return { allowed: true, reason: `always allowed: ${toolName}` }
  }

  // Step 2.6: P27.2 task tool subagent-type allowlist.
  // In SL-1/SL-2 (pre-EXECUTING), only read-only hm-* agents are
  // permitted via the `task` tool. Code-writing agents require SL-3+.
  if (toolName === "task") {
    const subagentType = extractSubagentType(args)
    if (subagentType !== undefined) {
      if (ALLOWED_HM_AGENTS.has(subagentType)) {
        return { allowed: true, reason: `permitted in state ${sessionContext.intentLockState?.state} (read-only hm-* agent: ${subagentType})` }
      }
      // Known hm-* agent that is not in the allowlist — explicitly deny.
      if (subagentType.startsWith("hm-")) {
        return {
          allowed: false,
          reason: `task tool agent '${subagentType}' not in this list of read-only hm-* agents. Use one of: ${[...ALLOWED_HM_AGENTS].join(", ")}`,
          nextCommand: "advance the gate to EXECUTING state for full tool access",
          alternatives: [...ALLOWED_HM_AGENTS],
        }
      }
    }
  }

  // Step 2.7: P27.2 delegate-task is blocked — hint to use native task tool.
  if (toolName === "delegate-task") {
    return {
      allowed: false,
      reason: "delegate-task is not permitted in gated states. Use the native task tool instead.",
      nextCommand: "use native task tool",
      alternatives: ["task"],
    }
  }

  // Step 3: gate disabled.
  if (sessionContext.intentLockState === undefined) {
    return { allowed: true, reason: "gate disabled" }
  }

  const state = sessionContext.intentLockState.state
  const allowedSet = PERMISSION_MATRIX[state]

  // Step 4: exact match in matrix.
  if (allowedSet.has(toolName)) {
    return { allowed: true, reason: `permitted in state ${state}` }
  }

  // Step 5: bash-specific handling — whitelist before blocklist.
  // The read-only prefix whitelist is checked first; if matched, bypass
  // both blocklist and matrix. Otherwise fall through to blocklist, then
  // matrix entries (bash:any / bash:read-only).
  if (toolName === "bash") {
    const cmd = extractBashCommand(args)
    if (cmd !== undefined) {
      // 5a: Read-only prefix whitelist (checked before blocklist).
      if (isReadOnlyBashCommand(cmd)) {
        return { allowed: true, reason: "read-only bash prefix" }
      }
      // 5b: Blocklist check.
      for (const pattern of MODERATE_BASH_PATTERNS) {
        if (pattern.test(cmd)) {
          return {
            allowed: false,
            reason: `bash command matches moderate blocklist: ${pattern.source}`,
            nextCommand: "use write/edit tool instead",
            alternatives: ["write", "edit", "hivemind-doc:write"],
          }
        }
      }
    }
    // Blocklist passed — check umbrella entries.
    if (allowedSet.has("bash:any")) {
      return { allowed: true, reason: `permitted in state ${state}` }
    }
    if (allowedSet.has("bash:read-only")) {
      return { allowed: true, reason: `permitted in state ${state}` }
    }
    return {
      allowed: false,
      reason: `tool '${toolName}' not permitted in state ${state}`,
      nextCommand: "complete current step to advance state",
      alternatives: [...allowedSet].slice(0, 3),
    }
  }

  // Step 6: non-bash tools — umbrella and scoped path-aware matching.
  const toolSegments = toolName.split(":")
  const toolHead = toolSegments[0] ?? toolName

  for (const allowed of allowedSet) {
    const allowedSegments = allowed.split(":")
    const allowedHead = allowedSegments[0] ?? allowed

    // Only consider entries from the same tool family.
    if (allowedHead !== toolHead) continue

    // 6a: Single-segment entry → allow any sub-command (e.g. execute-slash-command).
    if (allowedSegments.length === 1) {
      return { allowed: true, reason: `permitted in state ${state} (head match: ${allowedHead})` }
    }

    // 6b: Umbrella entries — second segment is "any" or starts with "any-".
    if (allowedSegments.length === 2 && (allowedSegments[1] === "any" || (allowedSegments[1]?.startsWith("any-") ?? false))) {
      return { allowed: true, reason: `permitted in state ${state} (umbrella: ${allowed})` }
    }

    // 6c: Scoped entries (3+ segments) — first 2 segments must match exactly,
    //     AND the target path from args must match the scope glob.
    if (allowedSegments.length >= 3 && toolSegments.length >= 2) {
      if (allowedSegments[1] === toolSegments[1]) {
        const scopeGlob = allowedSegments.slice(2).join(":")
        // Wildcard "any" in 3rd+ segment → allow without path check.
        if (scopeGlob === "any") {
          return { allowed: true, reason: `permitted in state ${state} (scoped any: ${allowed})` }
        }
        const targetPath = extractTargetPath(args)
        if (targetPath !== undefined && matchesScopeGlob(targetPath, scopeGlob)) {
          return { allowed: true, reason: `permitted in state ${state} (scoped: ${allowed})` }
        }
      }
    }
  }

  // Step 7: default deny.
  return {
    allowed: false,
    reason: `tool '${toolName}' not permitted in state ${state}`,
    nextCommand: "complete current step to advance state",
    alternatives: [...allowedSet].slice(0, 3),
  }
}

/**
 * Safely extract the `command` field from a `bash` tool's args.
 * Returns `undefined` if `args` is not an object with a string `command`.
 */
function extractBashCommand(args: unknown): string | undefined {
  if (typeof args !== "object" || args === null) return undefined
  const rec = args as Record<string, unknown>
  const cmd = rec["command"]
  return typeof cmd === "string" ? cmd : undefined
}

/**
 * Safely extract the `target` field from a tool's args (e.g. hivemind-doc).
 * Returns `undefined` if `args` is not an object with a string `target`.
 */
function extractTargetPath(args: unknown): string | undefined {
  if (typeof args !== "object" || args === null) return undefined
  const rec = args as Record<string, unknown>
  const target = rec["target"]
  return typeof target === "string" ? target : undefined
}

/**
 * Safely extract the `subagent_type` field from a `task` tool's args.
 * Returns `undefined` if `args` is not an object with a string `subagent_type`.
 */
function extractSubagentType(args: unknown): string | undefined {
  if (typeof args !== "object" || args === null) return undefined
  const rec = args as Record<string, unknown>
  const subagentType = rec["subagent_type"]
  return typeof subagentType === "string" ? subagentType : undefined
}

/**
 * Check whether a target path matches a scope glob like `.planning/**`.
 *
 * Converts trailing glob patterns (`**`, `*`) to a prefix check. For our
 * permission matrix entries the scope is always a directory prefix with a
 * trailing `/**`, so a simple `startsWith` is sufficient and avoids pulling
 * in a minimatch dependency.
 */
function matchesScopeGlob(targetPath: string, scopeGlob: string): boolean {
  const prefix = scopeGlob.replace(/\/?\*+$/, "")
  return targetPath === prefix || targetPath.startsWith(prefix + "/")
}

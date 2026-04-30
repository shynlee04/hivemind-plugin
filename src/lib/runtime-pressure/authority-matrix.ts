import type { ToolAuthority } from "./types.js"

/**
 * Authority matrix for tools currently registered by `HarnessControlPlane`.
 */
export const TOOL_AUTHORITY_MATRIX: readonly ToolAuthority[] = [
  { name: "delegate-task", authority: "execute", mutatesState: true, canExecute: true, reason: "dispatches child sessions and persists delegation records" },
  { name: "delegation-status", authority: "read", mutatesState: false, canExecute: false, reason: "reads delegation status and result records" },
  { name: "run-background-command", authority: "execute", mutatesState: false, canExecute: true, reason: "runs user-supplied shell commands in a PTY" },
  { name: "prompt-skim", authority: "read", mutatesState: false, canExecute: false, reason: "reads prompt text and file path metadata" },
  { name: "prompt-analyze", authority: "read", mutatesState: false, canExecute: false, reason: "analyzes prompt text without persistence" },
  { name: "session-patch", authority: "write", mutatesState: true, canExecute: false, reason: "patches session files and creates backups" },
  { name: "session-journal-export", authority: "read", mutatesState: false, canExecute: false, reason: "exports journal and lineage projections" },
  { name: "hivemind-doc", authority: "read", mutatesState: false, canExecute: false, reason: "read-only document intelligence" },
  { name: "hivemind-trajectory", authority: "state", mutatesState: true, canExecute: false, reason: "writes trajectory ledger checkpoints, events, and evidence refs" },
  { name: "hivemind-pressure", authority: "state", mutatesState: true, canExecute: false, reason: "may attach pressure evidence to the trajectory ledger only" },
  { name: "hivemind-sdk-supervisor", authority: "read", mutatesState: false, canExecute: false, reason: "reports SDK wrapper health, heartbeat, diagnostics, and readiness without executing SDK operations" },
  { name: "hivemind-command-engine", authority: "read", mutatesState: false, canExecute: false, reason: "discovers command bundles and previews routes without command execution or process launch" },
  { name: "hivemind-agent-work-create", authority: "state", mutatesState: true, canExecute: false, reason: "writes dedicated agent work contract records after pressure gating" },
  { name: "hivemind-agent-work-export", authority: "read", mutatesState: false, canExecute: false, reason: "exports bounded work contract handoff payloads without persistence" },
  { name: "configure-primitive", authority: "write", mutatesState: true, canExecute: false, reason: "creates or updates OpenCode primitive files" },
  { name: "validate-restart", authority: "read", mutatesState: false, canExecute: false, reason: "validates primitive discovery without mutating files" },
] as const

/**
 * Inspect the complete tool authority matrix.
 *
 * @returns A copy of registered tool authority rows.
 */
export function inspectToolAuthorityCatalog(): ToolAuthority[] {
  return TOOL_AUTHORITY_MATRIX.map((toolAuthority) => ({ ...toolAuthority }))
}

/**
 * Look up authority metadata for a registered tool.
 *
 * @param toolName - Registered OpenCode tool name.
 * @returns Matching authority row, or undefined for unknown tools.
 */
export function getToolAuthority(toolName?: string): ToolAuthority | undefined {
  if (!toolName) return undefined
  const authority = TOOL_AUTHORITY_MATRIX.find((toolAuthority) => toolAuthority.name === toolName)
  return authority ? { ...authority } : undefined
}

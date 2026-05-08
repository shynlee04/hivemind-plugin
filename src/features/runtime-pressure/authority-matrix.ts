import type { ToolAuthority, ToolPressureBehavior } from "./types.js"

/**
 * Standard per-band behavior for `.hivemind/state/*` writers — allowed
 * at steady, advised at advisory, require approval at gated, blocked at
 * blocking pressure.
 */
const HIVEMIND_STATE_WRITER: ToolPressureBehavior = {
  steady: "allow",
  advisory: "advise",
  gated: "require_approval",
  blocking: "block",
}

/**
 * Standard per-band behavior for `.opencode/` primitive configurators —
 * same as `.hivemind` writers but never deferred (primitive churn must
 * complete or fail loudly).
 */
const OPENCODE_PRIMITIVE_WRITER: ToolPressureBehavior = {
  steady: "allow",
  advisory: "advise",
  gated: "require_approval",
  blocking: "block",
}

/**
 * Standard per-band behavior for read-only inspection tools — allowed
 * everywhere except blocking, where reads are deferred to avoid
 * snapshotting stale state mid-incident.
 */
const READ_ONLY_INSPECTOR: ToolPressureBehavior = {
  steady: "allow",
  advisory: "allow",
  gated: "advise",
  blocking: "defer",
}

/**
 * Standard per-band behavior for external command runners — strictest
 * pressure behavior: gated and blocking both reject because shell
 * commands can have unbounded side effects.
 */
const EXTERNAL_COMMAND_RUNNER: ToolPressureBehavior = {
  steady: "allow",
  advisory: "advise",
  gated: "require_approval",
  blocking: "block",
}

/**
 * Authority matrix for tools currently registered by `HarnessControlPlane`.
 *
 * Every entry is a complete contract row — all fields required by the
 * Phase 57 planning contract are populated. Adding a new tool elsewhere
 * in the codebase without registering it here is caught by the Phase 67
 * conformance test.
 */
export const TOOL_AUTHORITY_MATRIX: readonly ToolAuthority[] = [
  {
    name: "delegate-task",
    authority: "execute",
    mutatesState: true,
    canExecute: true,
    stateSurface: "hivemind-state",
    pressureBehavior: EXTERNAL_COMMAND_RUNNER,
    evidenceAttachment: "execution-lineage",
    reason: "dispatches child sessions and persists delegation records",
  },
  {
    name: "delegation-status",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "reads delegation status and result records",
  },
  {
    name: "run-background-command",
    authority: "execute",
    mutatesState: false,
    canExecute: true,
    stateSurface: "external-command",
    pressureBehavior: EXTERNAL_COMMAND_RUNNER,
    evidenceAttachment: "execution-lineage",
    reason: "runs user-supplied shell commands in a PTY",
  },
  {
    name: "prompt-skim",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "reads prompt text and file path metadata",
  },
  {
    name: "prompt-analyze",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "analyzes prompt text without persistence",
  },
  {
    name: "session-patch",
    authority: "write",
    mutatesState: true,
    canExecute: false,
    stateSurface: "hivemind-state",
    pressureBehavior: HIVEMIND_STATE_WRITER,
    evidenceAttachment: "session-journal",
    reason: "patches session files and creates backups",
  },
  {
    name: "session-journal-export",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "exports journal and lineage projections",
  },
  {
    name: "hivemind-doc",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "read-only document intelligence",
  },
  {
    name: "hivemind-trajectory",
    authority: "state",
    mutatesState: true,
    canExecute: false,
    stateSurface: "hivemind-state",
    pressureBehavior: HIVEMIND_STATE_WRITER,
    evidenceAttachment: "trajectory-ledger",
    reason: "writes trajectory ledger checkpoints, events, and evidence refs",
  },
  {
    name: "hivemind-pressure",
    authority: "state",
    mutatesState: true,
    canExecute: false,
    stateSurface: "hivemind-state",
    pressureBehavior: HIVEMIND_STATE_WRITER,
    evidenceAttachment: "trajectory-ledger",
    reason: "may attach pressure evidence to the trajectory ledger only",
  },
  {
    name: "hivemind-sdk-supervisor",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "reports SDK wrapper health, heartbeat, diagnostics, and readiness without executing SDK operations",
  },
  {
    name: "hivemind-command-engine",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "discovers command bundles and previews routes without command execution or process launch",
  },
  {
    name: "hivemind-agent-work-create",
    authority: "state",
    mutatesState: true,
    canExecute: false,
    stateSurface: "hivemind-state",
    pressureBehavior: HIVEMIND_STATE_WRITER,
    evidenceAttachment: "trajectory-ledger",
    reason: "writes dedicated agent work contract records after pressure gating",
  },
  {
    name: "hivemind-agent-work-export",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "exports bounded work contract handoff payloads without persistence",
  },
  {
    name: "configure-primitive",
    authority: "write",
    mutatesState: true,
    canExecute: false,
    stateSurface: "opencode-primitive",
    pressureBehavior: OPENCODE_PRIMITIVE_WRITER,
    evidenceAttachment: "execution-lineage",
    reason: "creates or updates OpenCode primitive files",
  },
  {
    name: "validate-restart",
    authority: "read",
    mutatesState: false,
    canExecute: false,
    stateSurface: "read-only",
    pressureBehavior: READ_ONLY_INSPECTOR,
    evidenceAttachment: "none",
    reason: "validates primitive discovery without mutating files",
  },
] as const

/**
 * Inspect the complete tool authority matrix.
 *
 * @returns A copy of registered tool authority rows.
 */
export function inspectToolAuthorityCatalog(): ToolAuthority[] {
  return TOOL_AUTHORITY_MATRIX.map(cloneAuthority)
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
  return authority ? cloneAuthority(authority) : undefined
}

/**
 * Deep-clone a `ToolAuthority` row so callers cannot mutate the
 * canonical matrix entry through the returned reference.
 */
function cloneAuthority(toolAuthority: ToolAuthority): ToolAuthority {
  return {
    ...toolAuthority,
    pressureBehavior: { ...toolAuthority.pressureBehavior },
  }
}

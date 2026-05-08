import type { SessionContinuityRecord } from "../../shared/types.js"

/** Version of the kernel packet schema. */
export const KERNEL_PACKET_VERSION = "1.0.0"

/**
 * The core prompt packet carrying session context for agent dispatch.
 *
 * Contains session metadata, tool profiles, detection results, todo state,
 * execution lineage, and delegation information. This is the foundational
 * packet type from which other packet types (e.g. delegation) extend.
 *
 * @property packet_version - Schema version (currently "1.0.0").
 * @property packet_type - Discriminator, always `"kernel"` for this type.
 * @property session_id - Unique identifier for this session.
 * @property parent_session_id - Parent session ID, or null for root sessions.
 * @property root_session_id - Root session ID in the delegation chain, or null.
 * @property title - Short title derived from the session description.
 * @property description - Full session description / task boundary.
 * @property purpose_category - Category of the session's purpose, or null.
 * @property agent_type - Requested agent type, or null for default.
 * @property model - Requested LLM model identifier, or null for default.
 * @property temperature - Requested sampling temperature, or null for default.
 * @property tool_allow_list - Explicitly allowed tool names.
 * @property tool_deny_list - Explicitly denied tool names.
 * @property constraints - Constraints applied to this session.
 * @property scope - Scope string, or null.
 * @property project_root - Absolute project root path, or null.
 * @property detected_language - Auto-detected primary language.
 * @property detected_frameworks - Auto-detected framework names.
 * @property detected_project_type - Derived project type identifier.
 * @property codemap_file_count - Number of source files from codemap.
 * @property todo_active - Active todo item identifiers.
 * @property todo_completed_count - Number of completed todos.
 * @property todo_total_count - Total number of todos.
 * @property execution_lineage - Chain of agent/execution identifiers.
 * @property recent_tool_calls - Recent tool call signatures.
 * @property session_history_summary - Summary of session history.
 * @property session_created_at - Session creation timestamp, or null.
 * @property session_updated_at - Session last-update timestamp, or null.
 * @property session_status - Current session status string.
 * @property lifecycle_phase - Current lifecycle phase name.
 * @property queue_key - Concurrency queue key, or null.
 * @property run_mode - Session run mode, or null.
 * @property delegation_depth - Depth in the delegation chain (0 for root).
 */
export type KernelPacket = {
  packet_version: string
  packet_type: "kernel"
  session_id: string
  parent_session_id: string | null
  root_session_id: string | null
  title: string
  description: string
  purpose_category: string | null
  agent_type: string | null
  model: string | null
  temperature: number | null
  tool_allow_list: string[]
  tool_deny_list: string[]
  constraints: string[]
  scope: string | null
  project_root: string | null
  detected_language: string
  detected_frameworks: string[]
  detected_project_type: string
  codemap_file_count: number
  todo_active: string[]
  todo_completed_count: number
  todo_total_count: number
  execution_lineage: string[]
  recent_tool_calls: string[]
  session_history_summary: string
  session_created_at: number | null
  session_updated_at: number | null
  session_status: string
  lifecycle_phase: string
  queue_key: string | null
  run_mode: string | null
  delegation_depth: number
}

/**
 * Create a kernel packet from a session continuity record.
 *
 * Extracts session metadata, tool profiles, delegation info, and lifecycle
 * state into the flat kernel packet format. Detection-related fields
 * (language, frameworks, project type, codemap) default to empty/unknown
 * unless overridden.
 *
 * @param record - The session continuity record to extract context from.
 * @param overrides - Optional overrides for auto-detection fields.
 * @param overrides.detected_language - Override detected language.
 * @param overrides.detected_frameworks - Override detected frameworks.
 * @param overrides.detected_project_type - Override detected project type.
 * @param overrides.codemap_file_count - Override codemap file count.
 * @returns A fully populated {@link KernelPacket}.
 *
 * @example
 * ```typescript
 * const packet = createKernelPacket(record, {
 *   detected_language: "typescript",
 *   detected_frameworks: ["nextjs"],
 * })
 * ```
 */
export function createKernelPacket(
  record: SessionContinuityRecord,
  overrides?: Partial<Pick<KernelPacket, "detected_language" | "detected_frameworks" | "detected_project_type" | "codemap_file_count">>,
): KernelPacket {
  const meta = record.metadata
  const delegation = meta.delegation

  return {
    packet_version: KERNEL_PACKET_VERSION,
    packet_type: "kernel",
    session_id: record.sessionID,
    parent_session_id: null,
    root_session_id: delegation?.rootID ?? null,
    title: meta.description.slice(0, 120),
    description: meta.description,
    purpose_category: meta.category ?? record.promptParams.category ?? null,
    agent_type: record.promptParams.agent ?? null,
    model: (typeof record.promptParams.model === "string" ? record.promptParams.model : null) ?? null,
    temperature: typeof record.promptParams.temperature === "number" ? record.promptParams.temperature : null,
    tool_allow_list: Array.isArray(record.toolProfile?.allowed) ? record.toolProfile.allowed : [],
    tool_deny_list: Array.isArray(record.toolProfile?.denied) ? record.toolProfile.denied : [],
    constraints: meta.constraints,
    scope: (typeof record.promptParams.scope === "string" ? record.promptParams.scope : null) ?? null,
    project_root: (typeof record.promptParams.projectRoot === "string" ? record.promptParams.projectRoot : null) ?? null,
    detected_language: overrides?.detected_language ?? "unknown",
    detected_frameworks: overrides?.detected_frameworks ?? [],
    detected_project_type: overrides?.detected_project_type ?? "unknown",
    codemap_file_count: overrides?.codemap_file_count ?? 0,
    todo_active: [],
    todo_completed_count: 0,
    todo_total_count: 0,
    execution_lineage: [],
    recent_tool_calls: [],
    session_history_summary: "",
    session_created_at: null,
    session_updated_at: meta.updatedAt ?? null,
    session_status: meta.status,
    lifecycle_phase: meta.lifecycle?.phase ?? "created",
    queue_key: delegation?.queueKey ?? null,
    run_mode: meta.lifecycle?.runMode ?? null,
    delegation_depth: delegation?.depth ?? 0,
  }
}

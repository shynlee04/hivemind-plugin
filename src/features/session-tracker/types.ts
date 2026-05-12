/**
 * Session tracker type definitions.
 *
 * All field names use camelCase per REQ-ST-12. These interfaces define the
 * contracts for session knowledge capture files written under
 * `.hivemind/session-tracker/`.
 *
 * @module session-tracker/types
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration passed to the SessionTracker constructor. */
export interface SessionTrackerConfig {
  /** Absolute path to the project root directory. */
  projectRoot: string
}

// ---------------------------------------------------------------------------
// Core session records
// ---------------------------------------------------------------------------

/** Reference to a child session from within the parent's `children` array. */
export interface ChildRef {
  /** The child session's unique identifier. */
  sessionID: string
  /** The filename of the child session JSON file (e.g. "ses_abc.json"). */
  childFile: string
}

/**
 * Main session file frontmatter (YAML section of the `.md` knowledge file).
 * Mirrors the SPEC.md Section 5.1 format with camelCase field names.
 *
 * @example
 * ```typescript
 * const record: SessionRecord = {
 *   sessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
 *   created: "2026-05-10T21:54:36Z",
 *   updated: "2026-05-10T22:08:04Z",
 *   parentSessionID: null,
 *   delegationDepth: 0,
 *   children: [],
 *   continuityIndex: "session-continuity.json",
 *   status: "active",
 * }
 * ```
 */
export interface SessionRecord {
  /** Unique session identifier (e.g. "ses_1ed9df1adffe2hbJudz3sK60y3"). */
  sessionID: string
  /** ISO 8601 timestamp of session creation. */
  created: string
  /** ISO 8601 timestamp of last update. */
  updated: string
  /** Parent session ID, or `null` for root sessions. */
  parentSessionID: string | null
  /** Delegation depth: 0 = root, 1 = child, 2 = grandchild. */
  delegationDepth: number
  /** Array of child session references. */
  children: ChildRef[]
  /** Path to the session-local continuity index file. */
  continuityIndex: string
  /** Session status: active | idle | completed | error. */
  status: string
}

/** Metadata about the agent that performed a delegation. */
export interface DelegatedBy {
  /** Name of the delegating agent (e.g. "Hm-L0-Orchestrator"). */
  agentName: string
  /** Model identifier of the delegating agent (e.g. "DeepSeek V4 Pro"). */
  model: string
  /** Tool used to delegate (typically "task"). */
  tool: string
  /** Description of the delegated task. */
  description: string
  /** The type of subagent dispatched (e.g. "hm-l2-investigator"). */
  subagentType: string
}

/** Metadata about the primary agent running a child session. */
export interface MainAgent {
  /** Agent display name. */
  name: string
  /** Model identifier (e.g. "DeepSeek V4 Pro"). */
  model: string
}

/** A single tool invocation record within a turn. */
export interface ToolRecord {
  /** Name of the tool invoked (e.g. "skill", "read", "task"). */
  tool: string
  /** Tool input arguments (pruned to metadata for captured tools). */
  input: unknown
  /** Pruned/pruned output if applicable, or `undefined` if not captured. */
  outputPruned?: string
  /** Execution status: "success" | "error" | undefined if unknown. */
  status?: string
}

/** A single turn (exchange) within a session. */
export interface Turn {
  /** One-based turn number within the session. */
  turn: number
  /** Actor designation (e.g. "main_l0_agent", "user"). */
  actor: string
  /** Original actor type before transformation, if applicable. */
  actorTransformedFrom?: string
  /** Message content text. */
  content: string
  /** Tool invocations that occurred during this turn. */
  tools: ToolRecord[]
}

/**
 * Child session file contents (SPEC.md Section 5.2).
 * Stored as `.json` under the parent session's subdirectory.
 *
 * @example
 * ```typescript
 * const child: ChildSessionRecord = {
 *   sessionID: "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
 *   parentSessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
 *   delegationDepth: 1,
 *   delegatedBy: {
 *     agentName: "Hm-L0-Orchestrator",
 *     tool: "task",
 *     description: "Investigate event tracker bugs",
 *     subagentType: "hm-l2-investigator",
 *   },
 *   created: "2026-05-10T21:56:44Z",
 *   updated: "2026-05-10T22:04:47Z",
 *   status: "completed",
 *   mainAgent: { name: "Hm-L2-Investigator", model: "DeepSeek V4 Pro" },
 *   turns: [],
 *   children: [],
 * }
 * ```
 */
export interface ChildSessionRecord {
  /** Unique child session identifier. */
  sessionID: string
  /** Parent session's unique identifier. */
  parentSessionID: string
  /** Delegation depth (1 = direct child, 2 = grandchild, etc.). */
  delegationDepth: number
  /** Metadata about the agent that delegated this child session. */
  delegatedBy: DelegatedBy
  /** ISO 8601 timestamp of child session creation. */
  created: string
  /** ISO 8601 timestamp of last update. */
  updated: string
  /** Session status: active | completed | error. */
  status: string
  /** Metadata about the agent running this child session. */
  mainAgent: MainAgent
  /** Ordered array of turns within this child session. */
  turns: Turn[]
  /** Nested child sessions of this child (grandchildren). */
  children: string[]
  /** Last assistant message summary (first 200 chars), for resumption context. */
  lastMessage?: string
}

// ---------------------------------------------------------------------------
// Continuity indices
// ---------------------------------------------------------------------------

/** A child entry within the session-local hierarchy tree. */
export interface ChildHierarchyEntry {
  /** Filename of the child session file. */
  file: string
  /** Delegation depth of this child. */
  depth: number
  /** Current status of the child session. */
  status: string
  /** Who delegated this child (agent name or "main_l0_agent"). */
  delegatedBy: string
  /** Nested children map, keyed by child session ID. */
  children: Record<string, ChildHierarchyEntry>
}

/**
 * Session-local continuity index (SPEC.md Section 5.3).
 * Lives at `.hivemind/session-tracker/{sessionID}/session-continuity.json`.
 * Tracks the parent-child hierarchy within a single main session.
 */
export interface SessionContinuityIndex {
  /** Schema version (currently "2.0"). */
  version: string
  /** The main session ID this index belongs to. */
  sessionID: string
  /** ISO 8601 timestamp of last index update. */
  lastUpdated: string
  /** Hierarchy tree for this session. */
  hierarchy: {
    /** Root session ID. */
    root: string
    /** Map of child session IDs to hierarchy entries. */
    children: Record<string, ChildHierarchyEntry>
  }
  /** Total number of turns recorded. */
  turnCount: number
  /** Summary of tool invocations by tool name. */
  toolSummary: Record<string, number>
}

/**
 * Metadata about a main session in the project-level index.
 * Used as values in the `sessions` map of ProjectContinuityIndex.
 */
export interface ProjectSessionEntry {
  /** Relative directory path for this session's files. */
  dir: string
  /** Filename of the main session .md file. */
  mainFile: string
  /** Relative path to the session-local continuity index. */
  continuityIndex: string
  /** ISO 8601 timestamp of session creation. */
  created: string
  /** ISO 8601 timestamp of last session update. */
  updated: string
  /** Session status: active | completed | error. */
  status: string
  /** Number of child sessions. */
  childCount: number
  /** Maximum delegation depth reached. */
  totalDelegationDepth: number
}

/**
 * Project-level continuity index (SPEC.md Section 5.4).
 * Lives at `.hivemind/session-tracker/project-continuity.json`.
 * Connects all main sessions across the project.
 */
export interface ProjectContinuityIndex {
  /** Schema version (currently "2.0"). */
  version: string
  /** Absolute path to the project root directory. */
  projectRoot: string
  /** ISO 8601 timestamp of last index update. */
  lastUpdated: string
  /** Map of session IDs to their project-level metadata. */
  sessions: Record<string, ProjectSessionEntry>
  /** Session IDs in chronological order (oldest first). */
  chronologicalOrder: string[]
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/**
 * Validates whether a value is a well-formed session ID string.
 *
 * Session IDs must not contain path traversal characters ("/", "\\", "..").
 * Path safety is enforced by sanitizeSessionID and safeSessionPath in
 * atomic-write.ts. This validation rejects only path-injection characters
 * (DEFECT-14).
 *
 * @param id - The value to check.
 * @returns `true` if `id` is a valid session ID string.
 *
 * @example
 * ```typescript
 * isValidSessionID("ses_1ed9df1adffe2hbJudz3sK60y3") // true
 * isValidSessionID("../etc/passwd")   // false
 * isValidSessionID(null)   // false
 * ```
 */
export function isValidSessionID(id: unknown): id is string {
  if (typeof id !== "string") return false
  if (id.length === 0) return false
  if (!id.startsWith("ses")) return false // OpenCode convention — matches assertValidSessionID()
  if (id.includes("..")) return false   // Path traversal — still dangerous
  if (id.startsWith("/")) return false   // Absolute Unix path — dangerous
  if (id.startsWith("\\")) return false  // Absolute Windows path — dangerous
  // safeSessionPath() provides the actual filesystem safety at the
  // persistence boundary (Phase 13 F-11).
  return true
}

/**
 * Minimal validation that a hook payload object contains a valid sessionID.
 * Does not validate the full payload shape — only confirms the object exists
 * and carries a parseable session identifier.
 *
 * @param payload - The hook payload to check.
 * @returns `true` if `payload` is an object with a valid `sessionID` field.
 */
export function isValidHookPayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return false
  if (typeof payload !== "object") return false
  if (!("sessionID" in (payload as Record<string, unknown>))) return false
  const sessionID = (payload as Record<string, unknown>).sessionID
  if (typeof sessionID !== "string") return false
  return isValidSessionID(sessionID)
}

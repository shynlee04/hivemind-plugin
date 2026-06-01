/**
 * Tool Intelligence Engine type definitions.
 *
 * Defines the event, decision, and contextual guidance types used by the
 * Hivemind-owned ToolIntelligenceEngine. This engine is independent of
 * OpenCode's native `permission:` allow/ask/deny system and makes conditional
 * runtime decisions based on session hierarchy, agent role, tool arguments,
 * delegation depth, and recent call history.
 *
 * @module tool-intelligence/types
 */

// ---------------------------------------------------------------------------
// Decision kinds
// ---------------------------------------------------------------------------

/** Possible outcomes from a tool intelligence evaluation. */
export type ToolIntelligenceDecisionKind =
  | "allow"
  | "warn"
  | "block"
  | "needs_jit_grant";

// ---------------------------------------------------------------------------
// Contextual guidance (block / warn messages)
// ---------------------------------------------------------------------------

/**
 * Structured guidance returned when a tool call is blocked or warned.
 *
 * Every block must include all five fields so that agents receive actionable
 * correction instructions instead of bare deny messages.
 */
export type ToolIntelligenceGuidance = {
  /** The agent name that attempted the tool call. */
  agent: string;
  /** The tool name that was blocked or warned. */
  tool: string;
  /** Why the tool call was blocked or warned. */
  reason: string;
  /** The recommended alternative tool or action. */
  useInstead: string;
  /** Additional context (session hierarchy, delegation depth, etc.). */
  context: string;
};

// ---------------------------------------------------------------------------
// Event (input to engine)
// ---------------------------------------------------------------------------

/**
 * Bounded event describing a tool call about to execute.
 *
 * The engine evaluates this event and returns a decision. Fields are optional
 * where the hook infrastructure may not have full context (e.g., no active
 * contract or no recent history).
 */
export type ToolIntelligenceEvent = {
  /** Session ID making the tool call. */
  sessionID: string;
  /** Agent name extracted from delegation metadata or session state. */
  agentName: string;
  /** Tool name being invoked. */
  toolName: string;
  /** Raw tool arguments (used for intent classification). */
  args: Record<string, unknown>;
  /** Unique call ID for this tool invocation. */
  callID: string;
  /** Delegation depth of the calling session (0 = root). */
  delegationDepth: number;
  /** Whether the session is a child of another session. */
  isChildSession: boolean;
  /** Recent tool names called in this session (bounded window). */
  recentToolSequence: readonly string[];
  /** Optional active work contract ID. */
  activeContractId?: string;
};

// ---------------------------------------------------------------------------
// Decision (output from engine)
// ---------------------------------------------------------------------------

/**
 * Decision returned by ToolIntelligenceEngine.evaluateToolCall().
 *
 * `allow` and `warn` let execution continue. `block` and `needs_jit_grant`
 * halt execution with contextual guidance.
 */
export type ToolIntelligenceDecision = {
  /** The decision kind. */
  kind: ToolIntelligenceDecisionKind;
  /** Human-readable reason for the decision. */
  reason: string;
  /** Structured guidance for block/warn/needs_jit_grant decisions. */
  guidance?: ToolIntelligenceGuidance;
  /** The tool category from TOOL_CAPABILITY_MAP, if applicable. */
  toolCategory?: string;
  /** Whether the decision was made using CapabilityGate baseline data. */
  fromCapabilityBaseline: boolean;
  /** ISO 8601 timestamp of the decision. */
  timestamp: string;
};

// ---------------------------------------------------------------------------
// JIT grant tracking
// ---------------------------------------------------------------------------

/**
 * A just-in-time capability grant for a specific session+agent+tool tuple.
 */
export type JITGrant = {
  /** Session ID the grant applies to. */
  sessionID: string;
  /** Agent name the grant applies to. */
  agentName: string;
  /** Tool name the grant allows. */
  toolName: string;
  /** ISO 8601 timestamp when the grant was issued. */
  grantedAt: string;
  /** Reason for the grant. */
  reason: string;
};

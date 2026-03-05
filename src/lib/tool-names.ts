/**
 * Tool Names — Single Source of Truth
 *
 * All user-facing tool name strings should reference these constants
 * rather than hardcoding tool names. This prevents:
 *   1. Agent hallucination (suggesting non-existent tools)
 *   2. Silent breakage when tools are renamed
 *   3. Inconsistency between suggest-strings and actual registrations
 *
 * Wave 1 Fix 1.3: Extracted from 36+ hardcoded `declare_intent` strings
 */

/** Canonical tool names used in HiveMind plugin */
export const TOOL_NAMES = {
    /** Session lifecycle: start, update, close, status, resume, branch */
    SESSION: "hivemind_session",
    /** Context mapping: set trajectory/tactic/action focus */
    CONTEXT: "map_context",
    /** Compact current session */
    COMPACT: "compact_session",
    /** Hierarchy tree operations */
    HIERARCHY: "hivemind_hierarchy",
    /** Memory recall */
    RECALL: "recall_mems",
    /** Planning tool */
    PLAN: "hivemind_plan",
    /** Declaration tool */
    DECLARE: "hivemind_declare",
    /** Inspection tool */
    INSPECT: "deep_inspect",
    /** Think-back tool */
    THINK_BACK: "think_back",
} as const;

/**
 * Legacy tool name aliases.
 * These names may appear in:
 *   - detection.ts regex patterns (for backward compat with older agents)
 *   - User-facing markdown docs
 *   - Agent prompt instructions referencing old names
 *
 * Keep these for detection/matching only. Never suggest these to agents.
 */
export const LEGACY_TOOL_NAMES = {
    /** @deprecated Use TOOL_NAMES.SESSION */
    DECLARE_INTENT: "declare_intent",
} as const;

/** Convenience: tool name for session start suggestions */
export const SESSION_START_SUGGESTION = `${TOOL_NAMES.SESSION}({ action: "start" })`;

/** Convenience: tool name for context update suggestions */
export const CONTEXT_UPDATE_SUGGESTION = `${TOOL_NAMES.CONTEXT}({ level: "tactic" })`;

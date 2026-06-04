/**
 * Tool Intelligence Engine — Hivemind-owned runtime tool decision engine.
 *
 * This engine evaluates tool calls before execution using session hierarchy,
 * agent role, delegation depth, tool arguments, and CapabilityGate baseline.
 * It is **independent** of OpenCode's native `permission:` allow/ask/deny
 * system and does not consult it as an authority.
 *
 * Initial narrow rules cover:
 * 1. Allow native `task` for front-facing/root orchestration when valid dispatch shape
 * 2. Block native `task` inside child sessions without JIT grant
 * 3. Block `delegate-task` for code/artifact editing intent → recommend native `task`
 * 4. Block malformed task calls missing subagent target
 * 5. Unknown cases fall back to allow (existing governance still runs)
 *
 * @module tool-intelligence
 */

import { TOOL_CAPABILITY_MAP } from "../capability-gate/index.js";
import type {
  ToolIntelligenceEvent,
  ToolIntelligenceDecision,
  ToolIntelligenceGuidance,
  JITGrant,
} from "./types.js";

export type {
  ToolIntelligenceEvent,
  ToolIntelligenceDecision,
  ToolIntelligenceDecisionKind,
  ToolIntelligenceGuidance,
  JITGrant,
} from "./types.js";

// ---------------------------------------------------------------------------
// Guidance formatting
// ---------------------------------------------------------------------------

/**
 * Build a structured guidance object for block/warn decisions.
 */
function buildGuidance(
  agent: string,
  tool: string,
  reason: string,
  useInstead: string,
  context: string,
): ToolIntelligenceGuidance {
  return { agent, tool, reason, useInstead, context };
}

/**
 * Render guidance as a human-readable multi-line string for error messages.
 */
export function renderGuidance(g: ToolIntelligenceGuidance): string {
  return [
    `Agent: ${g.agent}`,
    `Tool: ${g.tool}`,
    `Reason: ${g.reason}`,
    `Use instead: ${g.useInstead}`,
    `Context: ${g.context}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// ToolIntelligenceEngine
// ---------------------------------------------------------------------------

/**
 * Runtime tool intelligence engine.
 *
 * Stateless evaluation of tool calls against Hivemind policy. JIT grants
 * are tracked in-memory for the current process lifetime.
 */
export class ToolIntelligenceEngine {
  private readonly jitGrants: Map<string, JITGrant> = new Map();

  /**
   * Grant a JIT capability for a specific session+agent+tool.
   * The key is `${sessionID}:${agentName}:${toolName}`.
   */
  grantJIT(sessionID: string, agentName: string, toolName: string, reason: string): void {
    const key = `${sessionID}:${agentName}:${toolName}`;
    this.jitGrants.set(key, {
      sessionID,
      agentName,
      toolName,
      grantedAt: new Date().toISOString(),
      reason,
    });
  }

  /**
   * Check whether a JIT grant exists for the given tuple.
   */
  hasJITGrant(sessionID: string, agentName: string, toolName: string): boolean {
    const key = `${sessionID}:${agentName}:${toolName}`;
    return this.jitGrants.has(key);
  }

  /**
   * Evaluate a tool call and return a decision.
   *
   * This is the main entry point called from `tool.execute.before`.
   * Rules are evaluated in priority order; the first matching rule wins.
   * If no rule matches, the decision defaults to `allow`.
   */
  evaluateToolCall(event: ToolIntelligenceEvent): ToolIntelligenceDecision {
    const timestamp = new Date().toISOString();
    const toolRecord = TOOL_CAPABILITY_MAP.get(event.toolName);
    const toolCategory = toolRecord?.category;

    // -----------------------------------------------------------------------
    // Rule 1: Block malformed task calls (missing subagent_type)
    // -----------------------------------------------------------------------
    if (event.toolName === "task") {
      const args = event.args ?? {};
      const hasSubagentType =
        typeof args.subagent_type === "string" &&
        args.subagent_type.length > 0;

      if (!hasSubagentType) {
        const guidance = buildGuidance(
          event.agentName,
          event.toolName,
          "Native task call is missing required 'subagent_type' argument. Every delegation must name its target agent.",
          "task({ subagent_type: 'agent-name', prompt: '...' })",
          `Session ${event.sessionID}, depth=${event.delegationDepth}, child=${event.isChildSession}`,
        );
        return {
          kind: "warn",
          reason: "Malformed task call: missing subagent_type (soft governance — call will proceed with warning)",
          guidance,
          toolCategory: toolCategory ?? "delegate",
          fromCapabilityBaseline: false,
          timestamp,
        };
      }
    }

    // -----------------------------------------------------------------------
    // Rule 2: Block native task in child sessions without JIT grant
    // -----------------------------------------------------------------------
    if (event.toolName === "task" && event.isChildSession) {
      if (!this.hasJITGrant(event.sessionID, event.agentName, "task")) {
        const guidance = buildGuidance(
          event.agentName,
          event.toolName,
          "Recursive native task spawning inside a child session is blocked to prevent unbounded delegation depth. Only the root/facing-facing orchestration layer may dispatch new subagents unless a JIT grant is issued.",
          "Return results to the parent session. The parent orchestrator will decide if further delegation is needed.",
          `Session ${event.sessionID} is a child session at depth=${event.delegationDepth}. A JIT grant is required for recursive task dispatch.`,
        );
        return {
          kind: "warn",
          reason: "Child session recursive task without JIT grant (soft governance — call will proceed with warning; orchestrator may want to review)",
          guidance,
          toolCategory: toolCategory ?? "delegate",
          fromCapabilityBaseline: false,
          timestamp,
        };
      }
    }

    // -----------------------------------------------------------------------
    // Rule 3: Allow native task for root/front-facing orchestration
    // -----------------------------------------------------------------------
    if (event.toolName === "task" && !event.isChildSession) {
      return {
        kind: "allow",
        reason: "Root/front-facing orchestration dispatching via native task",
        toolCategory: toolCategory ?? "delegate",
        fromCapabilityBaseline: true,
        timestamp,
      };
    }

    // -----------------------------------------------------------------------
    // Rule 4: Block delegate-task for code/artifact editing intent
    // -----------------------------------------------------------------------
    if (event.toolName === "delegate-task") {
      const args = event.args ?? {};
      const prompt = typeof args.prompt === "string" ? args.prompt.toLowerCase() : "";
      const isCodeOrArtifactEdit =
        prompt.includes("implement") ||
        prompt.includes("write code") ||
        prompt.includes("edit file") ||
        prompt.includes("create file") ||
        prompt.includes("modify file") ||
        prompt.includes("fix bug") ||
        prompt.includes("refactor") ||
        prompt.includes("build feature") ||
        prompt.includes("apply patch") ||
        prompt.includes("update source") ||
        prompt.includes("create component") ||
        prompt.includes("code change");

      if (isCodeOrArtifactEdit) {
        const guidance = buildGuidance(
          event.agentName,
          event.toolName,
          "SOFT SUGGESTION: delegate-task is a wrapper for async background delegation. For code/artifact editing work, native task is generally preferred for synchronous, first-class subagent dispatch with full parent-child hierarchy tracking. This is a suggestion, not a block — the call will proceed.",
          "task({ subagent_type: 'specialist-agent', prompt: '...' })",
          `Session ${event.sessionID} attempted delegate-task. User's intent takes precedence over this suggestion.`,
        );
        return {
          kind: "warn",
          reason: "SOFT GOVERNANCE: delegate-task detected with code/artifact intent. Call will proceed with warning logged. User intent takes precedence.",
          guidance,
          toolCategory: toolCategory ?? "delegate",
          fromCapabilityBaseline: false,
          timestamp,
        };
      }
    }

    // -----------------------------------------------------------------------
    // Default: allow (existing governance: budget, circuit breaker, etc. still runs)
    // -----------------------------------------------------------------------
    return {
      kind: "allow",
      reason: "No tool intelligence rule matched — defaulting to allow",
      toolCategory: toolCategory?.toString(),
      fromCapabilityBaseline: false,
      timestamp,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton (shared across hook instances within a process)
// ---------------------------------------------------------------------------

let _instance: ToolIntelligenceEngine | undefined;

/**
 * Get the shared ToolIntelligenceEngine singleton.
 * Lazily created on first access.
 */
export function getToolIntelligenceEngine(): ToolIntelligenceEngine {
  if (!_instance) {
    _instance = new ToolIntelligenceEngine();
  }
  return _instance;
}

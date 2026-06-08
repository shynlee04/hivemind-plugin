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

import { TOOL_CAPABILITY_MAP } from "../capability-gate/index.js"
import type {
  ToolIntelligenceEvent,
  ToolIntelligenceDecision,
  ToolIntelligenceGuidance,
  JITGrant,
  ToolIntelligenceDecisionKind,
} from "./types.js"

export type {
  ToolIntelligenceEvent,
  ToolIntelligenceDecision,
  ToolIntelligenceDecisionKind,
  ToolIntelligenceGuidance,
  JITGrant,
} from "./types.js"

/**
 * Config-side severity for governance rules. Mirrors the enum in
 * `.hivemind/configs.schema.json` (governance.rules[].action.type).
 * - `escalate` and `needs_jit_grant` are both mapped to the runtime kind
 *   `needs_jit_grant` — they require an explicit JIT grant before proceeding.
 */
export type GovernanceActionType =
  | "allow"
  | "warn"
  | "block"
  | "escalate"
  | "needs_jit_grant"

/**
 * Map a config-side severity to the runtime-side decision kind.
 * - `escalate` / `needs_jit_grant` → `needs_jit_grant`
 * - `allow` / `warn` / `block` → pass-through
 */
function toDecisionKind(s: GovernanceActionType): ToolIntelligenceDecisionKind {
  if (s === "escalate" || s === "needs_jit_grant") return "needs_jit_grant"
  return s
}

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

  // Read .hivemind/configs.json governance rules to make severity configurable.
  // Per user: default is warn; configs.json can override to allow/warn/block.
  // Schema reference: .hivemind/configs.schema.json (governance.rules[].action.type)
  // Config path: .hivemind/configs.json
  private readonly severityOverrides: Map<string, GovernanceActionType>;

  constructor(
    governanceRules?: ReadonlyArray<{ id: string; action: { type: GovernanceActionType } }>,
  ) {
    this.severityOverrides = new Map();
    if (governanceRules) {
      for (const rule of governanceRules) {
        this.severityOverrides.set(rule.id, rule.action.type);
      }
    }
  }

  /**
   * Resolve decision severity for a rule, checking config first.
   * Falls back to the hardcoded default if no config rule matches.
   *
   * Per binding contract: status is driven by `.hivemind/configs.json`;
   * never hardcoded. Default severity is `warn` when no rule matches.
   */
  private resolveSeverity(
    ruleId: string,
    fallback: GovernanceActionType,
  ): GovernanceActionType {
    return this.severityOverrides.get(ruleId) ?? fallback;
  }


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
        const kind = toDecisionKind(this.resolveSeverity("R1-malformed-task", "block"));
        return {
          kind,
          reason: kind === "needs_jit_grant"
            ? "Malformed task call: missing subagent_type (config: needs_jit_grant)"
            : kind === "block"
              ? "Malformed task call: missing subagent_type (config-driven block)"
              : kind === "warn"
                ? "Malformed task call: missing subagent_type (soft governance — call will proceed with warning)"
                : "Malformed task call: missing subagent_type (config-driven allow)",
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
        const kind = toDecisionKind(this.resolveSeverity("R2-child-recursive-task", "needs_jit_grant"));
        return {
          kind,
          reason: kind === "needs_jit_grant"
            ? "Child session recursive task without JIT grant (config: needs_jit_grant — return to parent orchestrator)"
            : kind === "block"
              ? "Child session recursive task without JIT grant (config-driven block — security boundary)"
              : kind === "warn"
                ? "Child session recursive task without JIT grant (soft governance — call will proceed with warning; orchestrator may want to review)"
                : "Child session recursive task without JIT grant (config-driven allow)",
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
        const kind = toDecisionKind(this.resolveSeverity("R4-delegate-task-code-intent", "block"));
        return {
          kind,
          reason: kind === "needs_jit_grant"
            ? "delegate-task with code/artifact intent requires JIT grant (config-driven)"
            : kind === "block"
              ? "delegate-task blocked for code/artifact intent by config — use native task"
              : kind === "warn"
                ? "SOFT GOVERNANCE: delegate-task detected with code/artifact intent. Call will proceed with warning logged. User intent takes precedence."
                : "delegate-task with code/artifact intent (config-driven allow)",
          guidance,
          toolCategory: toolCategory ?? "delegate",
          fromCapabilityBaseline: false,
          timestamp,
        };
      }
    }

    // -----------------------------------------------------------------------
    // Default: allow (existing governance: budget, circuit breaker, capability gate still runs)
    // Config-driven — `.hivemind/configs.json` `governance.rules[]` can override
    // any rule to `warn` / `block` / `escalate` without code change.
    // -----------------------------------------------------------------------
    const defaultKind = toDecisionKind(this.resolveSeverity("default", "allow"));
    if (defaultKind === "block") {
      return {
        kind: "block",
        reason: "No tool intelligence rule matched — config default is block",
        toolCategory: toolCategory?.toString(),
        fromCapabilityBaseline: false,
        timestamp,
      };
    }
    if (defaultKind === "warn") {
      return {
        kind: "warn",
        reason: "No tool intelligence rule matched — config default is warn",
        toolCategory: toolCategory?.toString(),
        fromCapabilityBaseline: false,
        timestamp,
      };
    }
    return {
      kind: "allow",
      reason: "No tool intelligence rule matched — defaulting to allow (config-driven)",
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
 * Reset the shared singleton. Used by tests and by config-reload hooks.
 * After reset, the next `getToolIntelligenceEngine()` call rebuilds the engine
 * from the current `.hivemind/configs.json` governance rules.
 */
export function resetToolIntelligenceEngine(): void {
  _instance = undefined;
}

/**
 * Get the shared ToolIntelligenceEngine singleton.
 * Lazily created on first access. On first creation, the engine reads
 * `.hivemind/configs.json` `governance.rules[]` and uses the `action.type`
 * of each enabled rule to override the per-rule severity.
 *
 * Per binding contract: severity is never hardcoded; it is config-driven.
 * Default severity is `warn` when no rule matches.
 */
export function getToolIntelligenceEngine(): ToolIntelligenceEngine {
  if (!_instance) {
    let governanceRules: ReadonlyArray<{ id: string; action: { type: GovernanceActionType } }> | undefined;
    try {
      // Lazy require to avoid a hard dep cycle with the config layer.
      const { readConfigs } = require("../../schema-kernel/hivemind-configs.schema.js") as typeof import("../../schema-kernel/hivemind-configs.schema.js");
      const cfgs = readConfigs(process.cwd());
      governanceRules = cfgs.governance?.rules as ReadonlyArray<{ id: string; action: { type: GovernanceActionType } }>;
    } catch {
      // Config load failed — proceed with no overrides; defaults apply.
      governanceRules = undefined;
    }
    _instance = new ToolIntelligenceEngine(governanceRules);
  }
  return _instance;
}

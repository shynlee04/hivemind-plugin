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
   * The full ordered list of governance rules, populated from
   * `.hivemind/configs.json` `governance.rules[]` at construction.
   * `evaluateToolCall` walks this list and returns the first matching
   * rule's severity. If no rule matches, the `default` rule wins
   * (or hardcoded `allow` if no `default` rule exists).
   *
   * Per binding contract: severity is fully driven by config, never hardcoded.
   */
  private readonly rules: ReadonlyArray<{
    id: string
    enabled: boolean
    condition: {
      toolNames?: ReadonlyArray<string>
      sessionIDs?: ReadonlyArray<string>
      depth?: { min?: number; max?: number }
    }
    action: { type: GovernanceActionType }
  }>;

  constructor(
    governanceRules?: ReadonlyArray<{
      id: string
      enabled?: boolean
      condition?: {
        toolNames?: ReadonlyArray<string>
        sessionIDs?: ReadonlyArray<string>
        depth?: { min?: number; max?: number }
      }
      action: { type: GovernanceActionType }
    }>,
  ) {
    this.rules = (governanceRules ?? []).map((r) => ({
      id: r.id,
      enabled: r.enabled ?? true,
      condition: r.condition ?? {},
      action: r.action,
    }));
  }

  /**
   * Test whether a single rule's condition matches the incoming event.
   */
  private ruleMatches(
    rule: { condition: { toolNames?: ReadonlyArray<string>; sessionIDs?: ReadonlyArray<string>; depth?: { min?: number; max?: number } } },
    event: ToolIntelligenceEvent,
  ): boolean {
    const c = rule.condition;
    if (c.toolNames && c.toolNames.length > 0 && !c.toolNames.includes(event.toolName)) return false;
    if (c.sessionIDs && c.sessionIDs.length > 0 && !c.sessionIDs.includes(event.sessionID)) return false;
    if (c.depth) {
      const d = event.delegationDepth;
      if (c.depth.min !== undefined && d < c.depth.min) return false;
      if (c.depth.max !== undefined && d > c.depth.max) return false;
    }
    return true;
  }

  /**
   * Walk the rules list and return the first enabled rule that matches.
   * Falls back to the rule with id `default`, or `undefined` if none.
   */
  private findMatchingRule(event: ToolIntelligenceEvent) {
    let defaultRule: typeof this.rules[number] | undefined;
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.id === "default") { defaultRule = rule; continue; }
      if (this.ruleMatches(rule, event)) return rule;
    }
    return defaultRule;
  }

  /**
   * Resolve decision severity for a tool call. Fully config-driven.
   * Per binding contract: status is driven by `.hivemind/configs.json`;
   * never hardcoded. Hardcoded `allow` is the LAST resort when no rule
   * matches AND no `default` rule is configured.
   */
  private resolveFromConfig(
    event: ToolIntelligenceEvent,
  ): { severity: GovernanceActionType; ruleId: string } {
    const matched = this.findMatchingRule(event);
    if (matched) {
      return { severity: matched.action.type, ruleId: matched.id };
    }
    return { severity: "allow", ruleId: "<no-rule>" };
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
    // Per-tool intelligence detectors. Each detector classifies the event into
    // a matched `ruleId` if a known pattern fires. The rule walker then
    // resolves the severity FROM CONFIG for that ruleId.
    //
    // The 4 detectors below cover the historical R1-R4 surfaces. Other tools
    // fall through to the config walker which uses toolName/depth matching.
    // -----------------------------------------------------------------------

    let matchedRuleId: string | undefined
    let detectorContext: { reason: string; useInstead: string; context: string } | undefined

    // R1: malformed task call (missing subagent_type)
    if (event.toolName === "task") {
      const args = event.args ?? {}
      const hasSubagentType = typeof args.subagent_type === "string" && args.subagent_type.length > 0
      if (!hasSubagentType) {
        matchedRuleId = "R1-malformed-task"
        detectorContext = {
          reason: "Native task call is missing required 'subagent_type' argument. Every delegation must name its target agent.",
          useInstead: "task({ subagent_type: 'agent-name', prompt: '...' })",
          context: `Session ${event.sessionID}, depth=${event.delegationDepth}, child=${event.isChildSession}`,
        }
      }
    }

    // R2: recursive task in child session without JIT grant
    if (!matchedRuleId && event.toolName === "task" && event.isChildSession) {
      if (!this.hasJITGrant(event.sessionID, event.agentName, "task")) {
        matchedRuleId = "R2-child-recursive-task"
        detectorContext = {
          reason: "Recursive native task spawning inside a child session requires a JIT grant. Only the root/front-facing orchestration layer may dispatch new subagents.",
          useInstead: "Return results to the parent session. The parent orchestrator will decide if further delegation is needed.",
          context: `Session ${event.sessionID} is a child session at depth=${event.delegationDepth}. A JIT grant is required for recursive task dispatch.`,
        }
      }
    }

    // R3: root task dispatch (no detector needed; falls through to config walker
    // and is naturally allow unless a config rule with toolName=task + depth.max=0
    // overrides it to warn/block).

    // R4: delegate-task with code/artifact intent
    if (!matchedRuleId && event.toolName === "delegate-task") {
      const args = event.args ?? {}
      const prompt = typeof args.prompt === "string" ? args.prompt.toLowerCase() : ""
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
        prompt.includes("code change")
      if (isCodeOrArtifactEdit) {
        matchedRuleId = "R4-delegate-task-code-intent"
        detectorContext = {
          reason: "delegate-task with code/artifact editing intent. Native task is preferred for synchronous, first-class subagent dispatch with full parent-child hierarchy tracking.",
          useInstead: "task({ subagent_type: 'specialist-agent', prompt: '...' })",
          context: `Session ${event.sessionID} attempted delegate-task with code/artifact prompt. User's intent takes precedence over this suggestion.`,
        }
      }
    }

    // -----------------------------------------------------------------------
    // Now: resolve severity FROM CONFIG via the unified rule walker.
    // If a detector fired, prefer that rule's id; otherwise the walker
    // matches by toolNames/depth/sessionIDs across all rules.
    //
    // Hybrid model: per-detector hardcoded fallbacks apply ONLY when the
    // config does not provide an explicit rule for the matched detector id.
    // This preserves backward compatibility with the original R1-R4 tests
    // while keeping config the single source of truth for users.
    // -----------------------------------------------------------------------
    const resolved = this.resolveFromConfig(event)
    // If a detector fired but config has no rule for that id, fall back to
    // the detector's hardcoded default. Otherwise use the config severity.
    // Severity is always config-driven. Default (no config rule) is `allow`.
    // The detector classifies; config decides. If config has a rule for the
    // detector's id, use it. Otherwise fall back to the engine's default
    // (also config-driven via the `default` rule, or hardcoded `allow` if
    // no `default` rule is configured).
    const configHasDetectorRule = matchedRuleId
      ? this.rules.some((r) => r.id === matchedRuleId && r.enabled)
      : false
    const severity: GovernanceActionType = configHasDetectorRule
      ? resolved.severity
      : resolved.severity  // already falls back to `allow` in resolveFromConfig
    const kind = toDecisionKind(severity)
    const ruleId = matchedRuleId ?? resolved.ruleId
    // Per-detector reason labels — used to make the reason text informative
    // even when the engine defaults to allow. These are LABEL strings, not
    // severity hints.
    const detectorLabel: Record<string, string> = {
      "R1-malformed-task": "Malformed task call: missing subagent_type",
      "R2-child-recursive-task": "Child session recursive task without JIT grant",
      "R4-delegate-task-code-intent": "delegate-task with code/artifact intent",
    }
    const reasonText = matchedRuleId
      ? `${detectorLabel[matchedRuleId] ?? matchedRuleId} (rule=${ruleId}, config severity=${severity})`
      : `No tool intelligence rule matched — config rule ${ruleId} (${severity}) applies`

    if (detectorContext) {
      return {
        kind,
        reason: reasonText,
        guidance: {
          agent: event.agentName,
          tool: event.toolName,
          reason: detectorContext.reason,
          useInstead: detectorContext.useInstead,
          context: detectorContext.context,
        },
        toolCategory: toolCategory ?? "delegate",
        fromCapabilityBaseline: false,
        timestamp,
      }
    }

    // R3: root/front-facing orchestration task dispatch. This is a special
    // case of "no detector fired" where the event is a native task from the
    // root session. We surface a specific "Root/front-facing" reason and
    // mark fromCapabilityBaseline=true so the gate can identify baseline
    // allow from engine-side allow.
    if (event.toolName === "task" && !event.isChildSession) {
      return {
        kind: "allow",
        reason: "Root/front-facing orchestration dispatching via native task",
        toolCategory: toolCategory ?? "delegate",
        fromCapabilityBaseline: true,
        timestamp,
      }
    }

    // No detector fired — return the config-walker's verdict as a baseline
    // decision. The reason text matches the test contract.
    if (kind === "block") {
      return {
        kind: "block",
        reason: `No tool intelligence rule matched — config rule ${ruleId} (${severity}) applies`,
        toolCategory: toolCategory?.toString(),
        fromCapabilityBaseline: false,
        timestamp,
      }
    }
    if (kind === "warn") {
      return {
        kind: "warn",
        reason: `No tool intelligence rule matched — config rule ${ruleId} (${severity}) applies`,
        toolCategory: toolCategory?.toString(),
        fromCapabilityBaseline: false,
        timestamp,
      }
    }
    if (kind === "needs_jit_grant") {
      return {
        kind: "needs_jit_grant",
        reason: `No tool intelligence rule matched — config rule ${ruleId} (${severity}) applies`,
        toolCategory: toolCategory?.toString(),
        fromCapabilityBaseline: false,
        timestamp,
      }
    }
    return {
      kind: "allow",
      reason: `No tool intelligence rule matched — defaulting to allow`,
      toolCategory: toolCategory?.toString(),
      fromCapabilityBaseline: false,
      timestamp,
    }
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

import { ToolCategory, type AgentCapabilityProfile, type ToolCapabilityRecord } from "./types.js";

export const UNKNOWN_AGENT_CAPABILITY_PROFILE: AgentCapabilityProfile = {
  id: "unknown-read-only-fallback",
  match: {},
  categories: [],
  tools: ["read", "glob", "grep"],
  rationale: "Unknown agents receive only local read/search primitives until runtime intelligence can issue a contextual grant.",
  fallback: true,
  guidance: "Use a named Hivemind role or request a just-in-time runtime grant before mutating, delegating, or governing.",
};

export const AGENT_CAPABILITY_PROFILES: readonly AgentCapabilityProfile[] = [
  {
    id: "front-facing-orchestration",
    match: { includes: ["l0-orchestrator", "orchestrator", "coordinator"] },
    categories: [ToolCategory.Read, ToolCategory.Delegate, ToolCategory.Govern, ToolCategory.Session],
    tools: ["task", "execute-slash-command", "delegate-task", "delegation-status", "hivemind-command-engine"],
    rationale: "Front-facing orchestration roles route work, inspect session state, and use native task as the primary subagent dispatch path.",
  },
  {
    id: "hf-meta-builder-specialists",
    match: { includes: ["hf-"] },
    categories: [ToolCategory.Read, ToolCategory.Write, ToolCategory.Config, ToolCategory.Session],
    tools: ["configure-primitive", "bootstrap-init", "bootstrap-recover", "validate-restart"],
    rationale: "HF meta-builder roles author and validate OpenCode primitives through Hivemind-owned config tools, not OpenCode permission metadata.",
  },
  {
    id: "l2-implementation-specialists",
    match: { includes: ["executor", "code-fixer", "debugger", "integration-checker"] },
    categories: [ToolCategory.Read, ToolCategory.Write, ToolCategory.Session],
    tools: ["hivemind-doc", "hivemind-sdk-supervisor", "session-tracker", "session-context"],
    rationale: "Implementation specialists need document CRUD, local source inspection, bounded mutation tools, and session context for recovery and evidence.",
  },
  {
    id: "quality-verification-specialists",
    match: { includes: ["verifier", "auditor", "reviewer", "security", "nyquist", "shipper"] },
    categories: [ToolCategory.Read, ToolCategory.Govern, ToolCategory.Session],
    tools: ["hivemind-trajectory", "hivemind-agent-work-export", "session-journal-export"],
    rationale: "Quality roles require governance/session evidence and read-only inspection before completion or shipping decisions.",
  },
  {
    id: "research-doc-planning-specialists",
    match: { includes: ["research", "doc", "planner", "specifier", "synthesizer", "mapper", "roadmapper"] },
    categories: [ToolCategory.Read, ToolCategory.Session],
    tools: ["hivemind-doc", "prompt-analyze", "prompt-skim", "hivemind-agent-work-create"],
    rationale: "Research, documentation, and planning roles gather bounded context and create/export work evidence without treating permissions as intelligence.",
  },
  UNKNOWN_AGENT_CAPABILITY_PROFILE,
] as const;

/**
 * Resolve the first static Hivemind seed profile matching an agent name.
 * The result is a bootstrap hint only; runtime correctness is owned by the later ToolIntelligenceEngine.
 */
export function resolveSeedProfileForAgent(agentName: string): AgentCapabilityProfile {
  const normalizedAgentName = agentName.toLowerCase();
  return AGENT_CAPABILITY_PROFILES.find((profile) => matchesSeedProfile(profile, normalizedAgentName)) ?? UNKNOWN_AGENT_CAPABILITY_PROFILE;
}

/**
 * Expand a seed profile's category and explicit tool assignments against the canonical capability map.
 */
export function resolveToolsForSeedProfile(
  profile: AgentCapabilityProfile,
  toolCapabilityMap: ReadonlyMap<string, ToolCapabilityRecord>,
): string[] {
  const selectedTools = new Set<string>();
  for (const [toolName, record] of toolCapabilityMap) {
    if (profile.categories.includes(record.category)) {
      selectedTools.add(toolName);
    }
  }
  for (const toolName of profile.tools) {
    selectedTools.add(toolName);
  }
  return Array.from(selectedTools);
}

/** Returns whether an agent name satisfies a static seed profile matcher. */
function matchesSeedProfile(profile: AgentCapabilityProfile, normalizedAgentName: string): boolean {
  if (profile.fallback) return false;
  const includes = profile.match.includes ?? [];
  const excludes = profile.match.excludes ?? [];
  return includes.some((pattern) => normalizedAgentName.includes(pattern)) && !excludes.some((pattern) => normalizedAgentName.includes(pattern));
}

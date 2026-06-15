import type { AgentCapabilityProfile } from "./types.js";

export const UNKNOWN_AGENT_CAPABILITY_PROFILE: AgentCapabilityProfile = {
  id: "unknown-read-only-fallback",
  match: {},
  categories: [],
  tools: ["read", "glob", "grep"],
  rationale: "Unknown agents receive only local read/search primitives until runtime intelligence can issue a contextual grant.",
  fallback: true,
  guidance: "Use a named Hivemind role or request a just-in-time runtime grant before mutating, delegating, or governing.",
};

export const BUILD_PASSTHROUGH_PROFILE: AgentCapabilityProfile = {
  id: "build-passthrough",
  match: { includes: ["build"] },
  categories: [],
  tools: [],
  passthrough: true,
  rationale:
    "The native OpenCode 'build' agent is OpenCode-native and must be LEFT UNAFFECTED. Hivemind capability-gate does not apply any restriction; OpenCode's own permission: field on the build agent definition is the sole authority.",
  guidance:
    "If the build agent needs bounded tools, edit its agent .md frontmatter permission: field. Do not add a Hivemind profile for build.",
};

/**
 * Resolve the seed profile for an agent name.
 *
 * After the tool-governance consolidation, only two outcomes exist:
 * - The OpenCode-native `build` agent → {@link BUILD_PASSTHROUGH_PROFILE}
 * - Everything else → {@link UNKNOWN_AGENT_CAPABILITY_PROFILE}
 *
 * All role-based tool assignment is now owned by OpenCode's `permission:` field
 * on agent definitions and the governance engine's rule walker.
 */
export function resolveSeedProfileForAgent(agentName: string): AgentCapabilityProfile {
  const normalizedAgentName = agentName.toLowerCase();
  if (normalizedAgentName === "build") return BUILD_PASSTHROUGH_PROFILE;
  return UNKNOWN_AGENT_CAPABILITY_PROFILE;
}

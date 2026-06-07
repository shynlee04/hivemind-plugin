import { ToolCategory, type ToolCapabilityRecord, type CapabilitySnapshot, type CapabilityMutationEvent } from "./types.js";
import { resolveSeedProfileForAgent, resolveToolsForSeedProfile } from "./agent-capability-profiles.js";

export { ToolCategory } from "./types.js";
export type { ToolCapabilityRecord, CapabilitySnapshot, CapabilityMutationEvent, AgentCapabilityProfile } from "./types.js";
export { AGENT_CAPABILITY_PROFILES, UNKNOWN_AGENT_CAPABILITY_PROFILE, resolveSeedProfileForAgent, resolveToolsForSeedProfile } from "./agent-capability-profiles.js";

export const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const;
export const WRITE_CAPABLE_TOOLS = ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"] as const;
export const WRITE_TOOLS = new Set(["edit", "write", "bash", "execute-slash-command"]);

export const TOOL_CAPABILITY_MAP: ReadonlyMap<string, ToolCapabilityRecord> = new Map([
  ["read", { category: ToolCategory.Read, description: "OpenCode built-in read", source: "built-in" }],
  ["edit", { category: ToolCategory.Write, description: "OpenCode built-in edit", source: "built-in" }],
  ["write", { category: ToolCategory.Write, description: "OpenCode built-in write", source: "built-in" }],
  ["bash", { category: ToolCategory.Write, description: "OpenCode built-in bash", source: "built-in" }],
  ["glob", { category: ToolCategory.Read, description: "OpenCode built-in glob", source: "built-in" }],
  ["grep", { category: ToolCategory.Read, description: "OpenCode built-in grep", source: "built-in" }],
  ["execute-slash-command", { category: ToolCategory.Delegate, description: "OpenCode slash command runner", source: "built-in" }],
  ["task", { category: ToolCategory.Delegate, description: "OpenCode native subagent dispatch tool", source: "built-in" }],
  ["delegate-task", { category: ToolCategory.Delegate, description: "Delegate work to child session", source: "hivemind" }],
  ["delegation-status", { category: ToolCategory.Delegate, description: "Poll delegation status", source: "hivemind" }],
  ["run-background-command", { category: ToolCategory.Delegate, description: "Run background shell command", source: "hivemind" }],
  ["hivemind-pressure", { category: ToolCategory.Govern, description: "Query runtime pressure score", source: "hivemind" }],
  ["hivemind-trajectory", { category: ToolCategory.Govern, description: "Inspect phase trajectory", source: "hivemind" }],
  ["hivemind-session-view", { category: ToolCategory.Govern, description: "Unified session view", source: "hivemind" }],
  ["hivemind-command-engine", { category: ToolCategory.Govern, description: "Discover slash commands", source: "hivemind" }],
  ["create-governance-session", { category: ToolCategory.Govern, description: "Create governance child session", source: "hivemind" }],
  ["configure-primitive", { category: ToolCategory.Config, description: "Configure OpenCode primitive", source: "hivemind" }],
  ["bootstrap-init", { category: ToolCategory.Config, description: "Bootstrap hivemind init", source: "hivemind" }],
  ["bootstrap-recover", { category: ToolCategory.Config, description: "Recover primitive symlinks", source: "hivemind" }],
  ["validate-restart", { category: ToolCategory.Config, description: "Validate compiled primitives", source: "hivemind" }],
  ["session-tracker", { category: ToolCategory.Session, description: "Query session tracker", source: "hivemind" }],
  ["session-hierarchy", { category: ToolCategory.Session, description: "Inspect delegation hierarchy", source: "hivemind" }],
  ["session-context", { category: ToolCategory.Session, description: "Aggregate cross-session context", source: "hivemind" }],
  ["session-journal-export", { category: ToolCategory.Session, description: "Export session journal", source: "hivemind" }],
  ["session-delegation-query", { category: ToolCategory.Session, description: "Query delegation history", source: "hivemind" }],
  ["hivemind-agent-work-create", { category: ToolCategory.Session, description: "Create agent work contract", source: "hivemind" }],
  ["hivemind-agent-work-export", { category: ToolCategory.Session, description: "Export agent work contract", source: "hivemind" }],
  ["hivemind-sdk-supervisor", { category: ToolCategory.Session, description: "Inspect SDK wrapper health", source: "hivemind" }],
  ["session-patch", { category: ToolCategory.Session, description: "Patch session prompt", source: "hivemind" }],
  ["hivemind-doc", { category: ToolCategory.Read, description: "Read project markdown docs", source: "hivemind" }],
  ["prompt-analyze", { category: ToolCategory.Read, description: "Analyze prompt structure", source: "hivemind" }],
  ["prompt-skim", { category: ToolCategory.Read, description: "Skim prompt content", source: "hivemind" }],
  ["tmux-copilot", { category: ToolCategory.Delegate, description: "Tmux visual orchestration co-pilot", source: "hivemind" }],
  ["tmux-state-query", { category: ToolCategory.Read, description: "Read-only tmux session metadata", source: "hivemind" }],
]);

export class CapabilityGate {
  private readonly readOnlyTools: readonly string[];

  private readonly grants: Map<string, Map<string, Set<string>>> = new Map();

  constructor(readOnlyTools = READ_ONLY_TOOLS, private readonly emitCapabilityEvent?: (event: CapabilityMutationEvent) => void) {
    this.readOnlyTools = readOnlyTools;
  }

  resolveToolsForAgent(agentName: string): string[] {
    const profile = resolveSeedProfileForAgent(agentName);
    if (profile.fallback) return [...this.readOnlyTools];
    const tools = resolveToolsForSeedProfile(profile, TOOL_CAPABILITY_MAP);
    return tools.length > 0 ? tools : [...this.readOnlyTools];
  }

  grantCapability(sessionId: string, agentName: string, toolName: string): void {
    if (!TOOL_CAPABILITY_MAP.has(toolName)) return;
    const perSession = this.grants.get(sessionId) ?? new Map();
    const perAgent = perSession.get(agentName) ?? new Set();
    perAgent.add(toolName);
    perSession.set(agentName, perAgent);
    this.grants.set(sessionId, perSession);
    this.emitCapabilityEvent?.({ agentName, toolName, action: "grant", sessionId, timestamp: new Date().toISOString() });
  }

  revokeCapability(sessionId: string, agentName: string, toolName: string): void {
    const perSession = this.grants.get(sessionId);
    if (!perSession) return;
    const perAgent = perSession.get(agentName);
    if (!perAgent) return;
    perAgent.delete(toolName);
    if (perAgent.size === 0) {
      perSession.delete(agentName);
    }
    this.emitCapabilityEvent?.({ agentName, toolName, action: "revoke", sessionId, timestamp: new Date().toISOString() });
  }

  getCapabilitySnapshot(): CapabilitySnapshot {
    const grants: CapabilitySnapshot["grants"] = new Map(
      Array.from(this.grants.entries()).map(([sessionId, perAgent]) => [
        sessionId,
        new Map(
          Array.from(perAgent.entries()).map(([agentName, tools]) => [agentName, Array.from(tools)]),
        ),
      ]),
    );
    return { tools: TOOL_CAPABILITY_MAP, grants, lastUpdated: new Date().toISOString() };
  }
}

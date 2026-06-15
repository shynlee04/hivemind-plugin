import { ToolCategory } from "./types.js";

export { ToolCategory } from "./types.js";
export type { ToolCapabilityRecord, CapabilitySnapshot, CapabilityMutationEvent, AgentCapabilityProfile } from "./types.js";
export { UNKNOWN_AGENT_CAPABILITY_PROFILE, BUILD_PASSTHROUGH_PROFILE, resolveSeedProfileForAgent } from "./agent-capability-profiles.js";

export const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const;
export const WRITE_CAPABLE_TOOLS = ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"] as const;
export const WRITE_TOOLS = new Set(["edit", "write", "bash", "execute-slash-command"]);

/**
 * Slim tool-name → category map. Retained for tool-intelligence telemetry
 * (`toolCategory` on decisions). No longer carries description/source metadata.
 *
 * After the tool-governance consolidation, the full `TOOL_CAPABILITY_MAP` was
 * deleted — OpenCode's native `permission:` field is the sole authority for
 * tool access control.
 */
export const TOOL_CATEGORY_MAP: ReadonlyMap<string, string> = new Map([
  ["read", ToolCategory.Read],
  ["edit", ToolCategory.Write],
  ["write", ToolCategory.Write],
  ["bash", ToolCategory.Write],
  ["glob", ToolCategory.Read],
  ["grep", ToolCategory.Read],
  ["execute-slash-command", ToolCategory.Delegate],
  ["task", ToolCategory.Delegate],
  ["delegate-task", ToolCategory.Delegate],
  ["delegation-status", ToolCategory.Delegate],
  ["run-background-command", ToolCategory.Delegate],
  ["hivemind-pressure", ToolCategory.Govern],
  ["hivemind-trajectory", ToolCategory.Govern],
  ["hivemind-session-view", ToolCategory.Govern],
  ["hivemind-command-engine", ToolCategory.Govern],
  ["create-governance-session", ToolCategory.Govern],
  ["configure-primitive", ToolCategory.Config],
  ["bootstrap-init", ToolCategory.Config],
  ["bootstrap-recover", ToolCategory.Config],
  ["validate-restart", ToolCategory.Config],
  ["session-tracker", ToolCategory.Session],
  ["session-hierarchy", ToolCategory.Session],
  ["session-context", ToolCategory.Session],
  ["session-journal-export", ToolCategory.Session],
  ["session-delegation-query", ToolCategory.Session],
  ["hivemind-agent-work-create", ToolCategory.Session],
  ["hivemind-agent-work-export", ToolCategory.Session],
  ["hivemind-sdk-supervisor", ToolCategory.Session],
  ["session-patch", ToolCategory.Session],
  ["hivemind-doc", ToolCategory.Write],
  ["prompt-analyze", ToolCategory.Read],
  ["prompt-skim", ToolCategory.Read],
  ["tmux-copilot", ToolCategory.Delegate],
  ["tmux-state-query", ToolCategory.Read],
]);

export class CapabilityGate {
  private readonly readOnlyTools: readonly string[];

  private readonly grants: Map<string, Map<string, Set<string>>> = new Map();

  constructor(readOnlyTools = READ_ONLY_TOOLS, private readonly emitCapabilityEvent?: (event: import("./types.js").CapabilityMutationEvent) => void) {
    this.readOnlyTools = readOnlyTools;
  }

  resolveToolsForAgent(_agentName: string): string[] {
    return [...this.readOnlyTools];
  }

  grantCapability(sessionId: string, agentName: string, toolName: string): void {
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

  getCapabilitySnapshot(): import("./types.js").CapabilitySnapshot {
    const grants: import("./types.js").CapabilitySnapshot["grants"] = new Map(
      Array.from(this.grants.entries()).map(([sessionId, perAgent]) => [
        sessionId,
        new Map(
          Array.from(perAgent.entries()).map(([agentName, tools]) => [agentName, Array.from(tools)]),
        ),
      ]),
    );
    return { tools: new Map(), grants, lastUpdated: new Date().toISOString() };
  }
}

export enum ToolCategory {
  Read = "read",
  Write = "write",
  Delegate = "delegate",
  Govern = "govern",
  Config = "config",
  Session = "session",
}

export type ToolCapabilityRecord = {
  readonly category: ToolCategory;
  readonly description: string;
  readonly source: "built-in" | "hivemind";
};

export type CapabilitySnapshot = {
  readonly tools: ReadonlyMap<string, ToolCapabilityRecord>;
  readonly grants: ReadonlyMap<string, ReadonlyMap<string, readonly string[]>>;
  readonly lastUpdated: string;
};

export type CapabilityMutationEvent = {
  readonly agentName: string;
  readonly toolName: string;
  readonly action: "grant" | "revoke";
  readonly sessionId: string;
  readonly timestamp: string;
};

export type AgentCapabilityProfileMatcher = {
  readonly includes?: readonly string[];
  readonly excludes?: readonly string[];
};

export type AgentCapabilityProfile = {
  readonly id: string;
  readonly match: AgentCapabilityProfileMatcher;
  readonly categories: readonly ToolCategory[];
  readonly tools: readonly string[];
  readonly rationale: string;
  readonly fallback?: boolean;
  readonly guidance?: string;
};

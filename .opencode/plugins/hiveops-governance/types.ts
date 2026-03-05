/**
 * HiveMind Governance Plugin — Type Definitions
 *
 * Shared types for delegation tracking, scope enforcement,
 * and runtime state across all plugin hooks.
 */

/** Agent delegation topology — who can delegate to whom */
export interface DelegationRule {
  agent: string
  canDelegateTo: string[]
  maxDepth: number
  recursive: boolean
}

/** Runtime delegation chain entry */
export interface DelegationChainEntry {
  from: string
  to: string
  depth: number
  timestamp: number
  objective: string
}

/** Scope boundary definition per agent */
export interface ScopeBoundary {
  agent: string
  allowPaths: string[]
  denyPaths: string[]
}

/** Quality gate state */
export interface GateState {
  gate: string
  status: "pending" | "passed" | "failed" | "blocked"
  evidence: string[]
  timestamp: number
}

/** Session enforcement state persisted in .hivemind */
export interface EnforcementState {
  sessionId: string
  agent: string
  delegationChain: DelegationChainEntry[]
  gatesPassed: GateState[]
  scopeViolations: ScopeViolation[]
  turnCount: number
  lastCheckpoint: number
  entryDetection?: EntryDetection
  intentClassification?: IntentClassification
  classificationPending?: boolean
  classificationDone?: boolean
}

/** Entry detection result from scripts/detect-entry.sh */
export interface EntryDetection {
  state_exists: boolean
  lineage: "hivefiver" | "hiveminder" | "unresolved"
  hierarchy_status: string
  trajectory_status: string
  entry_condition: "bootstrap_required" | "classify_required" | "ready"
  detected_at: number
  bootstrap_executed?: boolean
}

/** First-turn classification result from scripts/classify-intent.sh */
export interface IntentClassification {
  lineage: "hivefiver" | "hiveminder" | "unresolved"
  classified_at: number
  source: "classify-intent.sh"
  input_excerpt: string
  persisted_to_profile: boolean
}

/** Scope violation record */
export interface ScopeViolation {
  agent: string
  tool: string
  path: string
  rule: string
  timestamp: number
  blocked: boolean
}

/** Delegation topology — loaded from agent profiles */
export const DELEGATION_TOPOLOGY: Record<string, DelegationRule> = {
  hiveminder: {
    agent: "hiveminder",
    canDelegateTo: ["hivemaker", "hivehealer", "hivexplorer", "hiveq", "hiverd", "hiveplanner", "hivefiver"],
    maxDepth: 3,
    recursive: true,
  },
  hivemaker: {
    agent: "hivemaker",
    canDelegateTo: ["hivexplorer", "hiverd", "hiveq"],
    maxDepth: 2,
    recursive: false,
  },
  hivehealer: {
    agent: "hivehealer",
    canDelegateTo: ["hivexplorer", "hiveq"],
    maxDepth: 2,
    recursive: false,
  },
  hivefiver: {
    agent: "hivefiver",
    canDelegateTo: ["hivexplorer", "hiverd", "hiveplanner"],
    maxDepth: 2,
    recursive: false,
  },
  hiveplanner: {
    agent: "hiveplanner",
    canDelegateTo: ["hivexplorer", "hiverd"],
    maxDepth: 2,
    recursive: false,
  },
  hiveq: {
    agent: "hiveq",
    canDelegateTo: ["hivexplorer"],
    maxDepth: 1,
    recursive: false,
  },
  hiverd: {
    agent: "hiverd",
    canDelegateTo: [],
    maxDepth: 0,
    recursive: false,
  },
  hivexplorer: {
    agent: "hivexplorer",
    canDelegateTo: [],
    maxDepth: 0,
    recursive: false,
  },
  hitea: {
    agent: "hitea",
    canDelegateTo: ["hivexplorer", "hiverd"],
    maxDepth: 2,
    recursive: false,
  },
}

/** Scope boundaries per agent */
export const SCOPE_BOUNDARIES: Record<string, ScopeBoundary> = {
  hiveminder: {
    agent: "hiveminder",
    allowPaths: [".hivemind/", "docs/", ".opencode/", "agents/", "commands/", "workflows/", "skills/"],
    denyPaths: ["src/", "tests/"],
  },
  hivemaker: {
    agent: "hivemaker",
    allowPaths: ["src/", "tests/", "docs/", ".hivemind/"],
    denyPaths: [".opencode/agents/", ".opencode/commands/", ".opencode/skills/"],
  },
  hivehealer: {
    agent: "hivehealer",
    allowPaths: ["src/", "tests/", ".hivemind/"],
    denyPaths: [".opencode/"],
  },
  hivefiver: {
    agent: "hivefiver",
    allowPaths: [".opencode/", ".hivemind/"],
    denyPaths: ["src/", "tests/"],
  },
  hiveplanner: {
    agent: "hiveplanner",
    allowPaths: ["docs/", ".hivemind/", ".planning/"],
    denyPaths: ["src/", "tests/", ".opencode/"],
  },
  hiveq: {
    agent: "hiveq",
    allowPaths: ["docs/", ".hivemind/"],
    denyPaths: ["src/"],
  },
  hiverd: {
    agent: "hiverd",
    allowPaths: ["docs/", ".hivemind/"],
    denyPaths: ["src/", "tests/", ".opencode/"],
  },
  hivexplorer: {
    agent: "hivexplorer",
    allowPaths: ["*"],
    denyPaths: [],
  },
  hitea: {
    agent: "hitea",
    allowPaths: [".opencode/", "tests/"],
    denyPaths: ["src/"],
  },
}

/** Anti-pattern IDs from governance rules */
export const BLOCKED_ANTIPATTERNS = {
  "G-01": "Wildcard task delegation",
  "G-02": "Unrestricted bash permissions",
  "G-03": "Shallow alias commands",
  "G-04": "Version downgrade",
  "G-05": "Selector collision",
  "G-06": "Missing exit criteria",
  "G-07": "Skill avalanche (5+ loaded)",
  "G-08": "Contract-free command",
  "G-09": "Parity drift",
  "G-10": "Silent unknown action",
} as const

/** Context recovery state for post-compaction injection (CR-07) */
export interface CompactionRecovery {
  trajectory_summary: string
  active_todos: string[]
  key_decisions: string[]
  workflow_positions: { workflow_id: string; current_step: number; step_name: string }[]
  health_summary: { score: number; status: string; degraded_signals: string[] }
  recommended_next: string
  recovered_at: number
}

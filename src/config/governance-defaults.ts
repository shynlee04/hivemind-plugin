import type { GovernanceConfigs } from "../schema-kernel/hivemind-configs.schema.js"
import { AGENT_CONFIGS } from "./agent-configs.js"
import { TOOL_REGISTRY } from "./tool-registry.js"
import { COMMAND_AGENT_MAPPINGS } from "./command-mappings.js"

/**
 * Default governance configurations for the Hivemind ecosystem.
 * Contains governance rules, gate policies, naming standards, agent configs,
 * command mappings, and tool registry.
 */
export const DEFAULT_GOVERNANCE_CONFIGS: GovernanceConfigs = {
  default_action: "allow",
  write_denylist_override: "disabled",
  hardcoded_gates: { manual_state_writes: "warn" },
  tool_denied_message: {
    edit: {
      message:
        "Tool '{toolName}' is denied for agent '{agentName}' by OpenCode permission. Use hivemind-doc (action: write) instead for document edits.",
    },
    write: {
      message:
        "Tool '{toolName}' is denied for agent '{agentName}' by OpenCode permission. Use hivemind-doc (action: create/write) instead for document writes.",
    },
  },
  rules: [
    {
      id: "gov-delegate-task-subagent-only",
      condition: { toolNames: ["delegate-task"], depth: { max: 0 } },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-write-depth-warn",
      condition: { toolNames: ["write", "edit"], depth: { min: 2 } },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-delegate-task-depth-block",
      condition: { toolNames: ["delegate-task"], depth: { min: 3 } },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-create-session-naming-warn",
      condition: { toolNames: ["create-governance-session"] },
      action: { type: "warn" },
      enabled: true,
    },
    {
      id: "gov-unsafe-tools-allow",
      condition: { toolNames: ["bash"], depth: { min: 1 } },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-bash-in-child-allow",
      condition: { toolNames: ["bash"], depth: { min: 1 } },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-tmux-copilot-allow",
      condition: { toolNames: ["tmux-copilot"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-tmux-state-query-allow",
      condition: { toolNames: ["tmux-state-query"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-session-tools-allow",
      condition: {
        toolNames: [
          "session-tracker",
          "session-hierarchy",
          "session-context",
          "session-delegation-query",
          "session-journal-export",
          "session-patch",
        ],
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-hivemind-tools-allow",
      condition: {
        toolNames: [
          "hivemind-doc",
          "hivemind-trajectory",
          "hivemind-pressure",
          "hivemind-session-view",
          "hivemind-command-engine",
          "hivemind-sdk-supervisor",
          "hivemind-agent-work-create",
          "hivemind-agent-work-export",
        ],
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-config-tools-allow",
      condition: {
        toolNames: [
          "configure-primitive",
          "validate-restart",
          "bootstrap-init",
          "bootstrap-recover",
          "prompt-skim",
          "prompt-analyze",
        ],
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-run-background-command-allow",
      condition: { toolNames: ["run-background-command"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "R1-malformed-task",
      condition: { toolNames: ["task"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "R2-child-recursive-task",
      condition: { toolNames: ["task"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "R4-delegate-task-code-intent",
      condition: { toolNames: ["delegate-task"] },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-configs-supreme",
      condition: {},
      action: { type: "allow" },
      enabled: true,
    },
  ],
  naming_standards: {
    allowed_frameworks: ["hm", "hf", "gate", "stack"],
    allowed_classifications: ["root", "child", "grandchild", "fork"],
    naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
  },
  templates: {
    "governance-brief": {
      content: "You are a governance {{role}}. Review the following: {{brief}}",
    },
    "audit-brief": {
      content: "Audit the following against project standards: {{brief}}",
    },
  },
  agent_configs: AGENT_CONFIGS,
  command_agent_mappings: COMMAND_AGENT_MAPPINGS,
  tool_registry: TOOL_REGISTRY,
}

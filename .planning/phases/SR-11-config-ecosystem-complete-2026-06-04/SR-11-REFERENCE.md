# SR-11 Configuration Ecosystem Reference

## Overview

This document describes the default behavior of the Hivemind configuration system, including schema fields, bootstrap behavior, and tool registry integration.

## Default Behavior

### getDefaultConfigs()

The `getDefaultConfigs()` function returns a complete Hivemind configuration object with the following defaults:

- **conversation_language**: `"en"`
- **documents_and_artifacts_language**: `"en"`
- **mode**: `"expert-advisor"`
- **user_expert_level**: `"intermediate-high-level"`
- **delegation_systems**: `{ native_task: true, delegate_task: true, background_delegation: true }`
- **parallelization**: `true`
- **atomic_commit**: `true`
- **commit_docs**: `true`
- **workflow**: Research enabled, plan check enabled, verifier enabled, discuss mode "sufficient-phase-discussion"
- **governance**: Complete governance configuration with 42 agents, 124 commands, 27 tools, 5 rules, naming standards, and templates

### DEFAULT_GOVERNANCE_CONFIGS

The `DEFAULT_GOVERNANCE_CONFIGS` object provides sensible defaults for all governance primitives:

- **rules**: 5 core governance rules for tool usage control
- **naming_standards**: Framework and classification conventions
- **agent_configs**: 42 agent configurations with descriptions
- **command_agent_mappings**: 124 command-to-agent mappings
- **templates**: Standard governance and audit templates
- **tool_registry**: 27 tool registrations with permissions

## Bootstrap Behavior

### When configs.json is Missing

The bootstrap process creates a complete configuration file by:

1. Creating a default configuration with `$schema` reference
2. Merging with `DEFAULT_GOVERNANCE_CONFIGS`
3. Writing the merged configuration to `.hivemind/configs.json`

### When configs.json is Empty or Invalid

The bootstrap process:

1. Reads the existing file
2. Validates against the schema
3. If invalid, falls back to default configuration
4. Merges with `DEFAULT_GOVERNANCE_CONFIGS`
5. Writes the merged configuration back

### Non-Destructive Merging

The bootstrap process uses non-destructive merging:

- User values take precedence over defaults
- Arrays are replaced (not merged)
- Objects are merged recursively
- Missing fields are filled with defaults

## Schema Fields

### GovernanceConfigsSchema

The governance configuration schema includes:

```typescript
{
  rules: GovernanceRuleSchema[]           // Array of governance rules
  naming_standards?: NamingStandardsSchema // Naming convention configuration
  agent_configs?: Record<string, AgentConfigSchema> // Agent configurations
  command_agent_mappings?: Record<string, CommandConfigSchema> // Command mappings
  templates?: Record<string, TemplateConfigSchema> // Template configurations
  tool_registry?: Record<string, ToolRegistryItemSchema> // Tool registrations
}
```

### ToolRegistryItemSchema

Each tool registry item includes:

```typescript
{
  name: string        // Tool name
  description: string // Tool description
  permissions: string[] // Required permissions
}
```

### GovernanceRuleSchema

Each governance rule includes:

```typescript
{
  id: string          // Unique rule identifier
  condition: {
    toolNames?: string[]    // Tools the rule applies to
    sessionIDs?: string[]   // Specific session IDs (optional)
    depth?: {
      min?: number // Minimum depth
      max?: number // Maximum depth
    }
  }
  action: {
    type: string     // "allow", "warn", "block", "escalate"
    escalation?: Record<string, unknown> // Escalation details
  }
  enabled: boolean   // Whether the rule is active
}
```

## Tool Registry

### Registration

Tools are registered in `configs.json` under `governance.tool_registry`:

```json
{
  "governance": {
    "tool_registry": {
      "my-tool": {
        "name": "my-tool",
        "description": "My custom tool",
        "permissions": ["read", "write"]
      }
    }
  }
}
```

### Default Tools

The system includes 27 default tool registrations covering:

- Hivemind custom tools (delegate-task, delegation-status, etc.)
- Session management tools (session-tracker, session-context, etc.)
- Configuration tools (configure-primitive, validate-restart, etc.)
- Execution tools (execute-slash-command, run-background-command, etc.)

### Merging Behavior

Tool registry merging is additive:

- Default tools are always present
- User tools are added to the registry
- Existing user tools override defaults with the same name
- Missing tools are filled from defaults

## Skill Usage

### hm-l2-governance-config

The `hm-l2-governance-config` skill provides guidance on:

1. **Rule Creation**: How to define governance rules
2. **Agent Configuration**: How to configure agent settings
3. **Tool Registry**: How to register and manage tools
4. **Naming Standards**: How to set naming conventions

### Using the Skill

Load the skill when you need to:

- Configure governance rules for your project
- Set up agent configurations
- Register custom tools
- Define naming standards

The skill provides step-by-step guides and examples for each configuration area.

## Configuration Validation

### Type Checking

Run `npm run typecheck` to validate your configuration against the schema.

### Testing

Run `npm test` to verify your governance rules work correctly.

### Manual Inspection

Review your `configs.json` file to ensure:

1. All required fields are present
2. Values match your intended configuration
3. No syntax errors in JSON

## Examples

### Complete Configuration Example

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "en",
  "mode": "hivemind-powered",
  "user_expert_level": "intermediate-high-level",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "discuss_mode": "sufficient-phase-discussion"
  },
  "governance": {
    "rules": [
      {
        "id": "gov-delegate-task-subagent-only",
        "condition": {
          "toolNames": ["delegate-task"],
          "depth": { "max": 0 }
        },
        "action": { "type": "allow" },
        "enabled": true
      }
    ],
    "naming_standards": {
      "allowed_frameworks": ["hm", "hf", "gate", "stack"],
      "allowed_classifications": ["root", "child", "grandchild", "fork"],
      "naming_format": "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}"
    },
    "agent_configs": {
      "hm-executor": {
        "description": "Executes PLAN.md tasks atomically with wave-based parallelization"
      }
    },
    "tool_registry": {
      "delegate-task": {
        "name": "delegate-task",
        "description": "Delegate work to a specialist agent",
        "permissions": ["delegate", "session"]
      }
    }
  }
}
```

### Custom Rule Example

```json
{
  "governance": {
    "rules": [
      {
        "id": "custom-bash-warning",
        "condition": {
          "toolNames": ["bash"],
          "depth": { "min": 1 }
        },
        "action": {
          "type": "warn"
        },
        "enabled": true
      }
    ]
  }
}
```

### Custom Tool Registration Example

```json
{
  "governance": {
    "tool_registry": {
      "my-custom-tool": {
        "name": "my-custom-tool",
        "description": "My custom tool for specific tasks",
        "permissions": ["read", "write", "execute"]
      }
    }
  }
}
```

## Troubleshooting

### Configuration Not Taking Effect

1. Check that your `configs.json` is valid JSON
2. Run `npm run typecheck` to validate the schema
3. Ensure you're editing the correct file (`.hivemind/configs.json`)

### Rules Not Working

1. Verify the rule is enabled (`"enabled": true`)
2. Check that the condition matches your use case
3. Ensure the action is appropriate for your needs

### Agent Configuration Issues

1. Verify the agent name matches an existing agent
2. Check that tools and commands are valid
3. Ensure temperature is between 0.0 and 1.0

### Tool Registration Issues

1. Verify the tool name is correct
2. Check that permissions are valid
3. Ensure the tool is properly registered in the registry
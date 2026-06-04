---
name: hm-l2-governance-config
description: Guide for configuring Hivemind governance primitives (rules, agents, tools, naming standards).
triggers:
  - "configure governance"
  - "set up rules"
  - "add agent config"
  - "tool registry setup"
  - "naming standards"
lineage: hm
level: l2
---

# Governance Configuration Guide

## Overview

This skill provides guidance on configuring Hivemind governance primitives using the configuration system. It covers rule creation, agent configuration, tool registry setup, and naming standards configuration.

## When to Use

Use this skill when:
- You need to configure governance rules for tool usage
- You want to set up agent configurations
- You need to register tools in the tool registry
- You want to define naming standards for skills, agents, and commands
- You're setting up a new Hivemind project configuration

## Workflow

1. **Understand the Configuration Structure**: Learn about the governance configuration schema
2. **Plan Your Configuration**: Determine what rules, agents, tools, and naming standards you need
3. **Edit configs.json**: Modify the `.hivemind/configs.json` file with your governance settings
4. **Validate Configuration**: Run `npm run typecheck` to ensure your configuration is valid
5. **Test Configuration**: Run tests to verify your governance rules work as expected

## Rule Creation Guide

### Understanding Rules

Governance rules define how tools can be used in different contexts. Each rule has:
- **id**: Unique identifier for the rule
- **condition**: When the rule applies (tool names, session IDs, depth)
- **action**: What to do when the rule matches (allow, warn, block, escalate)
- **enabled**: Whether the rule is active

### Creating Rules

Add rules to `configs.json` under `governance.rules`:

```json
{
  "governance": {
    "rules": [
      {
        "id": "my-custom-rule",
        "condition": {
          "toolNames": ["bash"],
          "depth": { "min": 2 }
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

### Rule Conditions

- **toolNames**: Array of tool names the rule applies to
- **sessionIDs**: Array of specific session IDs (optional)
- **depth**: Depth condition with `min` and/or `max` values

### Rule Actions

- **allow**: Permit the tool usage
- **warn**: Allow but show a warning
- **block**: Prevent the tool usage
- **escalate**: Allow but escalate for review

## Agent Configuration Guide

### Understanding Agent Configs

Agent configurations define settings for specific agents. Each agent config has:
- **description**: What the agent does
- **allowedCommands**: Commands the agent can use
- **tools**: Tools available to the agent
- **temperature**: Creativity level (0.0 to 1.0)

### Configuring Agents

Add agent configs to `configs.json` under `governance.agent_configs`:

```json
{
  "governance": {
    "agent_configs": {
      "my-agent": {
        "description": "My custom agent",
        "allowedCommands": ["read", "write"],
        "tools": ["bash"],
        "temperature": 0.7
      }
    }
  }
}
```

### Default Agents

The system comes with 42 default agent configurations. You can override any of these by adding your own configuration with the same agent name.

## Tool Registry Guide

### Understanding Tool Registry

The tool registry defines metadata for tools available in the system. Each tool has:
- **name**: Tool name
- **description**: What the tool does
- **permissions**: Required permissions to use the tool

### Registering Tools

Add tools to `configs.json` under `governance.tool_registry`:

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

The system comes with 27 default tool registrations. You can add custom tools or override existing ones.

## Naming Standards Guide

### Understanding Naming Standards

Naming standards define conventions for naming skills, agents, and commands. They include:
- **allowed_frameworks**: Framework prefixes (hm, hf, gate, stack)
- **allowed_classifications**: Classification types (root, child, grandchild, fork)
- **naming_format**: Format pattern for names
- **max_title_length**: Maximum length for titles

### Configuring Naming Standards

Add naming standards to `configs.json` under `governance.naming_standards`:

```json
{
  "governance": {
    "naming_standards": {
      "allowed_frameworks": ["hm", "hf", "gate", "stack"],
      "allowed_classifications": ["root", "child", "grandchild", "fork"],
      "naming_format": "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
      "max_title_length": 128
    }
  }
}
```

### Naming Convention Reference

For detailed naming rules, refer to the `hf-naming-syndicate` skill.

## Configuration Validation

After making changes to your configuration:

1. **Type Check**: Run `npm run typecheck` to ensure your configuration is valid
2. **Test**: Run `npm test` to verify your governance rules work correctly
3. **Inspect**: Manually review your `configs.json` file for correctness

## Example Configuration

Here's a complete example configuration:

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
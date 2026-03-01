# Asset Contracts Reference

> Defines contract schemas for each asset type in OpenCode framework.

## Agent Profile Contract

### Required Frontmatter Fields

```yaml
---
name: string          # Required: agent identifier
description: string   # Required: what + when-to-use
mode: string          # Optional: execution mode
tasks: object         # Optional: task permissions
workflows: array      # Optional: associated workflows
prompts: array        # Optional: prompt templates
tools: object         # Optional: tool permissions
permission: object    # Optional: permission rules
identity: object     # Optional: role, specialization
scope_paths: object   # Required: allow/forbidden paths
delegation_policy: object  # Optional: delegation rules
verification_obligations: array  # Required: verification checklist
model: string         # Optional: model preference
---
```

### Required Body Sections

1. **Scope** — in-scope and out-of-scope paths
2. **Core Responsibilities** — key duties
3. **Delegation Topology** — allowed delegation targets

## Command Contract

### Required Frontmatter Fields

```yaml
---
name: string          # Command identifier
description: string  # What the command does
agent: string         # Target agent
mode: inline|subtask # Execution mode
arguments: object    # Argument definitions
---
```

### Required Body Sections

1. **Action** — deterministic behavior description
2. **Unknown Action Fallback** — how to handle unrecognized input
3. **Return Schema** — machine-readable output format (if chaining expected)

## Workflow Contract

### Required Frontmatter Fields

```yaml
---
name: string              # Workflow identifier
description: string       # What the workflow does
version: string           # Semantic version
contract_version: string  # Contract schema version
steps: array              # Ordered steps
---
```

### Step Schema

```yaml
- id: string              # Unique step identifier
  name: string            # Human-readable step name
  entry_criteria: array    # What must be true before step
  exit_criteria: array    # What must be true after step
  agent: string            # Which agent executes
  command: string          # Command to invoke
  depends_on: array       # Step dependencies
```

## Skill Contract

### Required Frontmatter Fields

```yaml
---
name: string      # Skill identifier
description: string  # When to use this skill
---
```

### Required Body Sections

1. **Purpose** — what the skill accomplishes
2. **Triggers** — when to invoke the skill
3. **References** — what reference files to load

### Progressive Disclosure Guidelines

| Level | Trigger | Token Budget |
|-------|---------|--------------|
| L0 | Always | ~100 |
| L1 | On invoke | ~500-2K |
| L2 | Complexity > 2 | ~1K-5K |
| L3 | Audit mode | ~5K-15K |

## Contract Validation Checklist

- [ ] All required frontmatter fields present
- [ ] YAML syntax valid (parse without error)
- [ ] All referenced files exist
- [ ] Dependencies correctly specified
- [ ] Version numbers follow semver
- [ ] Entry/exit criteria defined for workflows

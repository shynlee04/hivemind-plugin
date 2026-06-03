# Contract Declaration Schema

The formal schema for declaring agent↔skill bindings in both SKILL.md and agent .md files. Machine-verifiable via `scripts/validate-contracts.sh`.

## SKILL.md Frontmatter Schema

Every SKILL.md file MUST declare its consumer agents in the YAML frontmatter:

```yaml
---
name: hm-l3-detective
description: ...
metadata:
  layer: "3"
  role: "investigation"
  pattern: P2
  lineage: "hm-*"
  consumed-by:                          # REQUIRED — which agents load this skill
    - "hm-l2-researcher"                #   primary consumer
    - "hm-l2-scout"                     #   additional consumer
    - "hm-l2-investigator"              #   additional consumer
  lineage-scope: "hm-*"                 # REQUIRED — hm-*, hf-*, gate-*, stack-*, or both
  cross-lineage-justification: null     # REQUIRED if hf agents in consumed-by for an hm skill
---
```

### Field Definitions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `consumed-by` | YES | string[] | Agent names that load this skill. Empty array = orphan. |
| `lineage-scope` | YES | string | Which lineage this skill belongs to. One of: `hm-*`, `hf-*`, `gate-*`, `stack-*`, `both` |
| `cross-lineage-justification` | CONDITIONAL | string | Required ONLY when `consumed-by` includes agents from a different lineage than `lineage-scope`. Use `null` for same-lineage skills. |

### lineage-scope Values

| Value | Meaning | Examples |
|-------|---------|----------|
| `hm-*` | Product-dev lineage only | hm-l3-detective, hm-l2-debug |
| `hf-*` | Meta-builder lineage only | hf-agent-composition, hf-naming-syndicate |
| `gate-*` | Internal quality gates only | gate-evidence-truth (THIS PROJECT ONLY) |
| `stack-*` | Read-only reference packs | stack-vitest, stack-zod |
| `both` | Available to both lineages | opencode-config-workflow |

## Agent .md File Schema

Every agent .md file SHOULD declare its required skills:

```yaml
---
name: hm-l2-researcher
description: ...
metadata:
  domain: "research"                    # Agent's primary domain
  required-skills:                      # RECOMMENDED — per-task-category skill lists
    default:                            #   loaded on every dispatch
      - "hm-l3-detective"
      - "hm-l3-tech-stack-ingest"
    research-task:                      #   loaded for research tasks
      - "hm-l3-deep-research"
      - "hm-l3-research-chain"
    synthesis-task:                     #   loaded for synthesis tasks
      - "hm-l3-synthesis"
    quality-task:                       #   loaded for quality tasks (if applicable)
      - "gate-evidence-truth"
---
```

### Field Definitions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `domain` | RECOMMENDED | string | Agent's primary domain (research, planning, implementation, quality, debug, orchestration, meta-builder, discovery, writing, routing) |
| `required-skills.default` | YES | string[] | Skills loaded on every dispatch regardless of task |
| `required-skills.<task-category>` | OPTIONAL | string[] | Skills loaded for specific task categories. Category names are domain-specific. |

## Validation Rules

### For SKILL.md

1. `consumed-by` MUST exist and be a string array
2. If `consumed-by` is empty (`[]`), the skill is orphaned → flag
3. If `lineage-scope` is `hm-*` and `consumed-by` includes `hf-*` agents, `cross-lineage-justification` MUST not be null
4. If `lineage-scope` is `gate-*` and `consumed-by` includes agents not in the permitted list, → violation (D-02)
5. Every entry in `consumed-by` MUST reference an existing agent

### For Agent .md Files

1. `required-skills.default` SHOULD exist (not enforced — agents without this field use the domain-level defaults from `agent-to-skill-bindings.md`)
2. No `required-skills` entry SHOULD include `hf-*` skills if the agent's domain is `hm-*` (D-AD-01 STRICT)
3. No `required-skills` entry SHOULD include `gate-*` skills if the agent is not in the permitted list (D-02)

## Template: Adding a New Skill

When creating a new skill, add these fields to the frontmatter:

```yaml
metadata:
  consumed-by:
    - "hm-l2-<agent-type>"              # Replace with actual consumer(s)
  lineage-scope: "hm-*"                 # Replace with correct lineage
  cross-lineage-justification: null     # Add justification if cross-lineage
```

## Template: Adding a New Agent

When creating a new agent, add these fields to the frontmatter:

```yaml
metadata:
  domain: "<domain>"                    # research|planning|implementation|quality|debug|orchestration|meta-builder|discovery|writing|routing
  required-skills:
    default:
      - "<skill-name>"                  # At least one skill
```

Then update `references/agent-to-skill-bindings.md` to add the new agent's domain entry.

## Programmatic Access

The validation script parses these schemas:

```bash
# Extract consumed-by from a SKILL.md
grep -A 5 "consumed-by:" path/to/SKILL.md | grep "^- " | sed 's/.*"\(.*\)".*/\1/'

# Extract required-skills from an agent .md
grep -A 10 "required-skills:" path/to/agent.md | grep "^- " | sed 's/.*"\(.*\)".*/\1/'
```

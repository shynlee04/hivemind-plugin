# Cross-Cutting Change Plan Template

```yaml
# Cross-Cutting Change Plan

id: <change-id>
title: <one-line summary>
owner: <agent or user>
started_at: <ISO timestamp>
target_completion: <ISO timestamp>

# Scope
change_description: |
  <2-3 sentence description of the change>

# Affected surfaces
affected_surfaces:
  - skills: <N files>
  - agents: <N files>
  - commands: <N files>
  - workflows: <N files>
  - references: <N files>
  - templates: <N files>
  - agent_instructions: <N files>

# Cross-refs to update
cross_refs:
  old: <old-name-or-pattern>
  new: <new-name-or-pattern>
  estimated_count: <N>
  risk_tier: HIGH | MEDIUM | LOW  # HIGH = >20 refs, MEDIUM = 5-20, LOW = <5

# Commit strategy
commit_strategy:
  ordering: "references -> templates -> skills -> commands -> workflows -> agents"
  phases:
    - phase: A
      scope: agents
      commit_count: <N>
    - phase: B
      scope: skills
      commit_count: <N>
    - phase: C
      scope: commands
      commit_count: <N>
    - phase: D
      scope: workflows + references + templates
      commit_count: <N>

# Deprecation
deprecation:
  needs_shim: <true|false>
  shim_expiry: <date if shim>

# Validation
validation:
  - <command>
  - <command>

# Rollback
rollback:
  strategy: git revert <commit-sha>
  estimated_time: <N minutes>
```

## Usage

Save as `assets/skills/<skill>/templates/cross-cutting-plan.md` and
fill the placeholders. Reference from SKILL.md when invoked.

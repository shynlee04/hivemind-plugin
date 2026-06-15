# Cross-Cutting Change Workflow

The 7-step workflow for executing a cross-cutting change.

## Step 1: Inventory

Map the change. What surfaces are affected? How many inbound refs?
Run `grep -r` on the old name across 7 surfaces.

```bash
grep -rln "<old_name>" assets/agents assets/commands assets/workflows assets/references assets/templates assets/agent-instructions assets/skills
```

## Step 2: Risk Tier

| Refs | Tier | Strategy |
|---|---|---|
| <5 | LOW | Single atomic commit |
| 5-20 | MEDIUM | 4-phase commit strategy |
| ≥20 | HIGH | 4-phase + deprecation shim |

## Step 3: Plan

Fill `templates/cross-cutting-plan.md`. Commit ordering:
references → templates → skills → commands → workflows → agents.

## Step 4: Execute Phase A (agents)

Update `assets/agents/*.md` first. Each `tools:` field gets the new
Hivemind custom tools. Each description gets the new skill names.

Atomic commit per surface.

## Step 5: Execute Phase B (skills)

Update `assets/skills/*/SKILL.md`:
- description: triggers on new keywords
- body: name Hivemind custom tools
- `## GSD Compatibility` section if applicable (per master plan §9.2)

## Step 6: Execute Phase C (commands)

Update `assets/commands/*.md`:
- description: route to new skill
- `agent:` field: new agent name

## Step 7: Execute Phase D (workflows/refs/templates)

Update remaining 3 surfaces. Lowest priority.

## Validation After Each Phase

```bash
# Run after each phase
npm run typecheck
assets/.hivemind-config/validate-name.sh <new_name> skill
# Verify no stale refs remain
grep -rln "<old_name>" assets/{agents,commands,workflows,references,templates,agent-instructions,skills}
```

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Big-bang commit | Bisect useless | 1 atomic commit per surface |
| Update without inventory | Miss refs | Step 1 first |
| Skip Phase A | Higher layers point to nothing | Order matters |
| No shim for HIGH RISK | Breaks users | 2-cycle rename + shim |
| Forget validate-name | F01/F04 violations | Run after each phase |

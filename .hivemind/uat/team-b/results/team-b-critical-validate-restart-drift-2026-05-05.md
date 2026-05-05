# CRITICAL-4.1: validate-restart — 78% of Commands Reference Non-Existent Agents
**Date:** 2026-05-05
**Severity:** HIGH
**Tester:** Team-B
**Marker:** team-b

---

## Finding

`validate-restart --verbose` detected 14 cross-primitive errors and 15 runtime errors: 14 of 18 commands (78%) reference agents that do not exist in `.opencode/agents/`.

## Missing Agent References

### Agent `conductor` (6 commands)
- `start-work`
- `plan`
- `sync-agents-md`
- `ultrawork`
- `harness-doctor`

### Agent `hivefiver-orchestrator` (7 commands)
- `hf-create`
- `harness-audit`
- `hf-stack`
- `hf-absorb`
- `hf-configure`
- `hf-audit`
- `hf-prompt-enhance`

### Agent `researcher` (1 command)
- `deep-research-synthesis-repomix`

### Agent `hf-prompter` (1 command)
- `hf-prompt-enhance-to-plan`

## Agent Description Overlaps (>50% keyword overlap)
- hm-l2-test-router ↔ hm-l2-conductor, hf-l0-orchestrator, hm-l0-orchestrator
- hm-l2-conductor ↔ hm-l2-build, hf-l0-orchestrator
- hm-l2-build ↔ hf-l0-orchestrator, hm-l0-orchestrator
- hf-l0-orchestrator ↔ hm-l0-orchestrator

## Impact Assessment

These commands will fail at runtime when attempting to dispatch to their configured agent. The tool itself (`validate-restart`) works correctly — it's the project configuration that has drifted.

## Recommended Fix

Update command frontmatter in `.opencode/commands/` to reference existing agent names:
- `conductor` → likely `hm-l2-conductor` or `hm-l0-orchestrator`
- `hivefiver-orchestrator` → likely `hf-l0-orchestrator`
- `researcher` → likely `hm-l2-researcher`
- `hf-prompter` → already exists as `hf-prompter.md` in agents — check file naming

## Evidence
- validate-restart verbose output (captured in batch-4 results)
- configure-primitive list: 18 commands found
- 86 agent files in `.opencode/agents/` — none named `conductor`, `hivefiver-orchestrator`, or `researcher`

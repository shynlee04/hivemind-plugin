# Phase SE-6: Meta-Builder Skills Enhancement — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-6
**Depends on:** SE-5 (lineage routing) + agent-synthesis workstream (agent patterns)
**Status:** DRAFT — awaiting discuss-phase authorization

## Authorized Decision
Replace faulty `opencode-config-workflow` (zero bundled resources, zero cross-references) and create agent synthesizer. Complete hf-* bidirectional cross-references.

## Scope (WHAT — locked)

| Skill | Purpose | Notes |
|-------|---------|-------|
| hf-config-workflow | REPLACES opencode-config-workflow. Full 8-turn workflow with bundled resources: turn templates, primitive schemas, validation scripts. | hf-* prefix: hivefiver-exclusive meta-builder |
| hf-agent-synthesizer | Synthesizes agent definitions from GSD+OMO patterns with YAML config, hierarchical classification, 3-level-depth wiring. | Depends on agent-synthesis workstream research |

### Cross-Reference Fixes (hf-* bidirectional)
- hf-agents-and-subagents-dev ↔ hf-command-dev
- hf-agents-and-subagents-dev ↔ hf-custom-tools-dev
- hf-agents-and-subagents-dev ↔ hf-use-authoring-skills
- Bridge hf-delegation-gates → hm-coordinating-loop

## Constraints
- hf-* prefix: these are hivefiver-exclusive per the playbook lineage model
- Must use skill-creator + skill-judge for quality verification
- hf-agent-synthesizer must consume agent-synthesis workstream research artifacts

## NOT in Scope
- Agent implementation (agent-synthesis workstream)
- Modifying hm-* skills

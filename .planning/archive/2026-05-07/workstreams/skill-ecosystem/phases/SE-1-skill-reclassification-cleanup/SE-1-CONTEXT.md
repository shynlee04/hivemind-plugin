# Phase SE-1: Skill Reclassification & Cleanup — CONTEXT

**Workstream:** skill-ecosystem  
**Phase:** SE-1  
**Created:** 2026-04-27  
**Status:** ✅ COMPLETE (2026-04-29)

## Authorized Decisions (from discuss-phase)

### SHIP (hm-*) — Product + Runtime Skills
These ship with the Hivemind harness. Must be language-agnostic, framework-independent. Help end users build their products using the Hivemind meta-framework.

| Skill | Role | Notes |
|-------|------|-------|
| hm-spec-driven-authoring | Spec-locking from PRD | Must pass RICH gate reauthorization |
| hm-test-driven-execution | RED/GREEN/REFACTOR | Must pass RICH gate reauthorization |
| hm-debug | Systematic debugging | Must pass RICH gate reauthorization |
| hm-refactor | Surgical/structural refactoring | Must pass RICH gate reauthorization |
| hm-deep-research | Version-matched research | Must pass RICH gate reauthorization |
| hm-detective | Codebase investigation | Must pass RICH gate reauthorization |
| hm-synthesis | Research compression | Must pass RICH gate reauthorization |
| hm-research-chain | Research pipeline orchestrator | Must pass RICH gate reauthorization |
| hm-completion-looping | Guardrail against premature completion | Hivemind runtime feature |
| hm-coordinating-loop | Multi-agent coordination | Hivemind runtime feature |
| hm-subagent-delegation-patterns | Delegation dispatch patterns | Hivemind runtime feature |
| hm-phase-execution | Wave-based phase execution | Hivemind runtime feature |
| hm-phase-loop | Iterative phase loops | Hivemind runtime feature |
| hm-user-intent-interactive-loop | Intent clarification | Hivemind runtime feature |

### SHIP (hf-*) — Hivefiver-Exclusive Meta-Builder Skills
Ship as hivefiver lineage only. For when users need to create, modify, or doctor their innate meta concepts (skills, agents, commands, custom tools) to work with OpenCode + Hivemind.

| Skill | Role |
|-------|------|
| hf-agents-and-subagents-dev | Agent creation/audit — hivefiver exclusive |
| hf-command-dev | Command creation/audit — hivefiver exclusive |
| hf-context-absorb | Multi-wave context absorption — hivefiver exclusive |
| hf-custom-tools-dev | Custom tool creation — hivefiver exclusive |
| hf-use-authoring-skills | Skill creation/audit/validation — hivefiver exclusive |

### RENAME (hivefiver-* → hf-*) — Hivefiver-Exclusive Meta-Builder Skills
All hivefiver-exclusive skills must use hf-* prefix per the playbook lineage model.

| Current | New | Reason |
|---------|-----|--------|
| hivefiver-agents-and-subagents-dev | hf-agents-and-subagents-dev | Agent creation/audit — hivefiver exclusive |
| hivefiver-command-dev | hf-command-dev | Command creation/audit — hivefiver exclusive |
| hivefiver-context-absorb | hf-context-absorb | Context absorption — hivefiver exclusive |
| hivefiver-custom-tools-dev | hf-custom-tools-dev | Custom tool creation — hivefiver exclusive |
| hivefiver-delegation-gates | hf-delegation-gates | Pre-delegation authorization — hivefiver exclusive (INTERNAL-USE) |
| hivefiver-use-authoring-skills | hf-use-authoring-skills | Skill creation/audit — hivefiver exclusive |

### RENAME (hm→hf) — Meta-Builder Concerns (originally mis-prefixed)
These currently have hm-* prefix but are meta-builder skills. Rename to hf-*.

| Current | New | Reason |
|---------|-----|--------|
| hm-agent-composition | hf-agent-composition | Teaches agents how to compose other agents (meta) |
| hm-agents-md-sync | hf-agents-md-sync | Syncs AGENTS.md with codebase (meta maintenance) |
| hm-command-parser | hf-command-parser | Parses command syntax (meta utility) |
| hm-skill-synthesis | hf-skill-synthesis | Synthesizes skills from repos (meta builder) |

### INTERNAL-USE — This Project Only
Not shipped. Serve THIS project's quality gatekeeping, platform reference, and internal routing.

| Skill | Role |
|-------|------|
| gate-evidence-truth | Terminal quality gate |
| gate-lifecycle-integration | Lifecycle quality gate |
| gate-spec-compliance | Spec compliance quality gate |
| hm-meta-builder | Internal routing hub |
| hm-opencode-non-interactive-shell | Shell safety reference |
| hm-opencode-platform-reference | OpenCode platform reference |
| hm-opencode-project-audit | Project audit |
| hf-delegation-gates | Pre-delegation authorization |

### REMOVE
| Skill | Reason |
|-------|--------|
| hm-opencode-project-inspection | 95% overlap with hm-opencode-project-audit |

### REPLACE (in future phases)
| Current | Replacement | Phase |
|---------|------------|-------|
| hm-planning-with-files (disabled) | hm-artifact-hierarchy | SE-2 |
| opencode-config-workflow | hf-config-workflow | SE-6 |

### KEEP (Reference)
| Skill | Reason |
|-------|--------|
| hm-omo-reference | OMO project reference — synthesize harness patterns from OMO architecture. NOT OpenCode platform reference. Different project. |

## Phase SE-1 Scope (Mechanical Only)

1. **Rename 6 skill directories** (hivefiver-* → hf-*): agents-and-subagents-dev, command-dev, context-absorb, custom-tools-dev, delegation-gates, use-authoring-skills
2. **Rename 4 skill directories** (hm→hf): agent-composition, agents-md-sync, command-parser, skill-synthesis
3. **Remove 1 skill directory** (hm-opencode-project-inspection)
4. **Fix all cross-references** to renamed skills in SKILL.md, agent .md, and command .md files
5. **Fix 8 prefix inconsistencies** in cross-references
6. **Add gate-* agent permissions** to coordinator/conductor agents
7. **Update AGENTS.md** counts and skill lists

## NOT in SE-1 Scope
- RICH gate reauthorization of shipping skills → deferred to SE-7 verification
- hm-artifact-hierarchy creation → SE-2
- New skill creation → SE-3 through SE-6
- Agent-synthesis workstream → separate workstream

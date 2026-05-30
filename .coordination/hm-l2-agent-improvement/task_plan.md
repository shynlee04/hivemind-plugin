# Task Plan: hm-l2 Agent Improvement Project

**Coordinator:** hm-l1-coordinator
**Delegated by:** hf-l0-orchestrator
**Domain:** Meta-concept improvement (hm-* lineage)
**Total agents:** 43 L2 + 2 L0/L1 = 45
**Status:** IN PROGRESS

## Wave Structure

### Wave 1: Classification & Assessment (Phase A)
- Task A1: Classify 43 agents into 16 functional groups
- Task A2: Read each agent's current frontmatter + first 50 lines
- Task A3: Produce classification table with quality scores

### Wave 2: Research & Template Synthesis (Phase B + C)
- Task B1: Research patterns per functional group (GSD/OMO patterns)
- Task C1: Synthesize group templates
- Task C2: Produce template for each group

### Wave 3: Agent File Improvement (Phase D) - Batch 1
- Write improved agents: GROUP 1 (Research, Investigation, Synthesis)
- Write improved agents: GROUP 2 (Planning, Phase/Execution)
- Write improved agents: GROUP 3 (Gatekeeping, Quality)
- Write improved agents: GROUPS 4-8 (Remaining groups)

### Wave 4: L3 Matching & L0/L1 (Phase E + F)
- Task E1: Map L2 agents to L3 skills
- Task E2: Identify gaps and orphans
- Task F1: Improve L0/L1 profiles

## Agent Quality Baseline

| Quality Level | Count | Examples |
|--------------|-------|----------|
| HIGH (150+ lines, complete) | ~15 | reviewer, investigator, researcher, etc. |
| MEDIUM (100-150 lines) | ~15 | analyst, executor, finisher, etc. |
| LOW (<100 lines, sparse) | ~13 | build, general, prompt-skimmer, prompt-analyzer, etc. |

## Key Issues Found
1. Missing `<execution_flow>` XML in low-quality agents
2. `self_correction` wraps other XML elements incorrectly in some agents
3. Many agents have thin/no verification section
4. Missing peer network cross-references
5. Missing quality gate checklists
6. `instruction: [AGENTS.md]` may be invalid OpenCode field
7. No recovery/self-correction paths in low-quality agents
8. Missing hierarchical classification tags (depth, lineage, domain)

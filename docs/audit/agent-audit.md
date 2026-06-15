# Agent Orphan Audit Report

**Date:** 2026-04-07
**Scope:** All 21 agent definition files in `agents-lab/active/refactoring/`
**Method:** Read every agent file, then grep across skills-lab, commands-lab, workflows-lab, and cross-agent references.

---

## Summary

| Metric | Count |
|--------|-------|
| Total agents audited | 21 |
| Agents with ≥1 connection | 15 |
| Orphaned agents (zero connections) | 6 |
| Agents with quality issues | 8 |

---

## Agent-by-Agent Report

---

### 1. builder

| Field | Value |
|-------|-------|
| **name** | builder |
| **type** | Specialist — code implementation |
| **connections_to_skills** | agent-authorization, harness-delegation-inspection, meta-builder, oh-my-openagent-reference, skill-synthesis, use-authoring-skills |
| **connections_to_commands** | hf-prompt-enhance, start-work, ultrawork |
| **connections_to_workflow** | create, prompt-enhance, stack |
| **connections_to_agents** | Referenced by: conductor, coordinator, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-orchestrator, hivefiver, meta-synthesis-agent |
| **is_orphan** | false |
| **quality_score** | 9/10 |
| **issues** | None significant. Well-structured with clear workflow, rules, and output contract. |

---

### 2. conductor

| Field | Value |
|-------|-------|
| **name** | conductor |
| **type** | Primary orchestrator |
| **connections_to_skills** | (none) |
| **connections_to_commands** | harness-doctor, plan, start-work, ultrawork |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: builder, critic, researcher. Referenced by: coordinator |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No skill references — unusual for a primary orchestrator. No workflow references. Description is identical to coordinator.md (line-by-line same first line), suggesting potential duplication. |

---

### 3. context-mapper

| Field | Value |
|-------|-------|
| **name** | context-mapper |
| **type** | Prompt-enhance lane — repository grounding |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager, prompt-skimmer |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and other prompt-enhance lane agents. |

---

### 4. context-purifier

| Field | Value |
|-------|-------|
| **name** | context-purifier |
| **type** | Prompt-enhance lane — distillation |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and prompt-repackager. |

---

### 5. coordinator

| Field | Value |
|-------|-------|
| **name** | coordinator |
| **type** | Primary orchestrator |
| **connections_to_skills** | coordinating-loop, planning-with-files |
| **connections_to_commands** | harness-audit |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: builder, explore, hivefiver. Referenced by: meta-synthesis-agent, phase-guardian, prompt-repackager |
| **is_orphan** | false |
| **quality_score** | 3/10 |
| **issues** | **CRITICAL:** Duplicate `permission:` block in frontmatter (lines 6-17 and lines 19-51). Second block overrides first. Contains duplicated content blocks (Task_Management section appears twice, lines 55-113 and 116-166). Has malformed markdown (backtick escaping issues like `\Todowrite\``). Description is identical to conductor.md. The file appears to be a rough merge of two different agent definitions. |

---

### 6. critic

| Field | Value |
|-------|-------|
| **name** | critic |
| **type** | Specialist — quality verification |
| **connections_to_skills** | agent-authorization, harness-audit, phase-loop, use-authoring-skills |
| **connections_to_commands** | deep-init, harness-audit, start-work, ultrawork |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | Referenced by: conductor, hivefiver-agent-builder, hivefiver-orchestrator, intent-loop, meta-synthesis-agent, prompt-analyzer, prompt-repackager, risk-assessor, spec-verifier |
| **is_orphan** | false |
| **quality_score** | 9/10 |
| **issues** | No workflow references — the only specialist without workflow connections. Otherwise excellent structure. |

---

### 7. explore

| Field | Value |
|-------|-------|
| **name** | explore |
| **type** | Fast subagent — repository investigation |
| **connections_to_skills** | oh-my-openagent-reference, repomix-explorer, user-intent-interactive-loop |
| **connections_to_commands** | deep-init, deep-research-synthesis-repomix, ultrawork |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | Referenced by: coordinator, hivefiver-orchestrator, hivefiver, researcher |
| **is_orphan** | false |
| **quality_score** | 5/10 |
| **issues** | **CRITICAL:** This file is 410 lines of tool taxonomy documentation (Parts I-IV) with mermaid diagrams, not an agent definition. The actual agent body (lines 1-108) is a thin wrapper, then it devolves into a reference document about OpenCode tools. The file content is nearly identical to researcher.md (also 411 lines with same tool taxonomy). Duplicate `todoread` and `todowrite` entries in frontmatter (lines 22-25). No workflow references. |

---

### 8. hivefiver-agent-builder

| Field | Value |
|-------|-------|
| **name** | hivefiver-agent-builder |
| **type** | Specialist — agent definition creation |
| **connections_to_skills** | agent-authorization |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | create |
| **connections_to_agents** | References: builder, critic, hivefiver-orchestrator, hivefiver, researcher. Referenced by: hivefiver-orchestrator |
| **is_orphan** | false |
| **quality_score** | 8/10 |
| **issues** | No command directly targets this agent — it's only dispatched by hivefiver-orchestrator via Task tool. References `hivefiver-tool-builder` in its own anti-patterns table (line 242: "Not in any command's `agent:` field") — ironic self-awareness. |

---

### 9. hivefiver-command-builder

| Field | Value |
|-------|-------|
| **name** | hivefiver-command-builder |
| **type** | Specialist — command definition creation |
| **connections_to_skills** | agent-authorization |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | create |
| **connections_to_agents** | References: builder, hivefiver-orchestrator, hivefiver. Referenced by: hivefiver-orchestrator |
| **is_orphan** | false |
| **quality_score** | 8/10 |
| **issues** | No command directly targets this agent — only dispatched by hivefiver-orchestrator. |

---

### 10. hivefiver-orchestrator

| Field | Value |
|-------|-------|
| **name** | hivefiver-orchestrator |
| **type** | Primary orchestrator — meta-builder routing |
| **connections_to_skills** | (none) |
| **connections_to_commands** | harness-audit, hf-audit, hf-create, hf-prompt-enhance, hf-stack |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: builder, critic, explore, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-skill-author, hivefiver, researcher. Referenced by: hivefiver-agent-builder, hivefiver-command-builder, hivefiver-skill-author |
| **is_orphan** | false |
| **quality_score** | 8/10 |
| **issues** | No skill references it — surprising for the central orchestrator. No workflow references. References `hivefiver-tool-builder` in routing table (line 63) but no such agent file exists — dead reference. |

---

### 11. hivefiver-skill-author

| Field | Value |
|-------|-------|
| **name** | hivefiver-skill-author |
| **type** | Specialist — skill creation/audit |
| **connections_to_skills** | agent-authorization |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | create |
| **connections_to_agents** | References: hivefiver-orchestrator, hivefiver. Referenced by: hivefiver-orchestrator |
| **is_orphan** | false |
| **quality_score** | 8/10 |
| **issues** | No command directly targets this agent — only dispatched by hivefiver-orchestrator. |

---

### 12. hivefiver

| Field | Value |
|-------|-------|
| **name** | hivefiver |
| **type** | Primary orchestrator — MINDNETWORK graph traversal |
| **connections_to_skills** | agent-authorization, harness-delegation-inspection, meta-builder |
| **connections_to_commands** | harness-audit, hf-audit, hf-create, hf-prompt-enhance, hf-stack |
| **connections_to_workflow** | create |
| **connections_to_agents** | References: builder, explore. Referenced by: coordinator, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-orchestrator, hivefiver-skill-author |
| **is_orphan** | false |
| **quality_score** | 6/10 |
| **issues** | Role overlaps significantly with hivefiver-orchestrator — both are described as "orchestrator" with similar routing responsibilities. The MINDNETWORK graph concept is mentioned but never explained or implemented. No workflow references beyond create.md. Duplicate skill entries in frontmatter (repomix-exploration-guide appears twice, opencode-platform-reference appears twice). |

---

### 13. intent-loop

| Field | Value |
|-------|-------|
| **name** | intent-loop |
| **type** | Specialist — Phase 0 intent clarification |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: critic |
| **is_orphan** | **true** |
| **quality_score** | 6/10 |
| **issues** | **ORPHANED:** Zero connections to any skill, command, or workflow. Only references the critic agent. Well-structured with clear iteration protocol, but no entry point exists. The description says "Triggers on clarify intent, draft specification, intent loop" but no command uses it. No skill mentions it. No workflow dispatches it. |

---

### 14. meta-synthesis-agent

| Field | Value |
|-------|-------|
| **name** | meta-synthesis-agent |
| **type** | Specialist — meta-concept analysis and synthesis |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: builder, coordinator, critic |
| **is_orphan** | **true** |
| **quality_score** | 5/10 |
| **issues** | **ORPHANED:** Zero connections to any skill, command, or workflow. Uses non-standard frontmatter format (`tools: [Read, Bash, ...]` and `color: magenta` instead of `permission:` block). No agent references it. The file uses XML-style tags (`<role>`, `<construction_patterns>`, etc.) which is inconsistent with all other agents. References GSD agents (gsd-verifier, gsd-plan-checker, gsd-codebase-mapper) that may not exist in this project. |

---

### 15. phase-guardian

| Field | Value |
|-------|-------|
| **name** | phase-guardian |
| **type** | Specialist — phase guardrails and loop termination |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: coordinator |
| **is_orphan** | **true** |
| **quality_score** | 7/10 |
| **issues** | **ORPHANED:** Zero connections to any skill, command, or workflow. Only references coordinator. Well-structured with detailed gate/checkpoint/escalation protocols, but no entry point. The description says "Triggers on: 'guardrail loops', 'phase exit decision'..." but no command or workflow uses these trigger phrases. |

---

### 16. prompt-analyzer

| Field | Value |
|-------|-------|
| **name** | prompt-analyzer |
| **type** | Prompt-enhance lane — deep analysis |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager, prompt-skimmer |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and other prompt-enhance lane agents. |

---

### 17. prompt-repackager

| Field | Value |
|-------|-------|
| **name** | prompt-repackager |
| **type** | Prompt-enhance lane — final assembly |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager (self-references context-mapper, context-purifier, coordinator, prompt-analyzer, prompt-skimmer, risk-assessor as inputs) |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and other prompt-enhance lane agents. |

---

### 18. prompt-skimmer

| Field | Value |
|-------|-------|
| **name** | prompt-skimmer |
| **type** | Prompt-enhance lane — Phase 0 skim |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and prompt-repackager. The workflow references "skim" conceptually but doesn't name this agent explicitly by filename. |

---

### 19. researcher

| Field | Value |
|-------|-------|
| **name** | researcher |
| **type** | Specialist — repository investigation |
| **connections_to_skills** | (none) |
| **connections_to_commands** | deep-research-synthesis-repomix, hf-prompt-enhance, start-work, ultrawork |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: explore. Referenced by: conductor, hivefiver-agent-builder, hivefiver-orchestrator |
| **is_orphan** | false |
| **quality_score** | 4/10 |
| **issues** | **CRITICAL:** File content is nearly identical to explore.md (both are 410-411 lines with the same tool taxonomy documentation, Parts I-IV, mermaid diagrams). The actual agent definition is only the first ~108 lines; the rest is a reference document about OpenCode tools. No skill references it. No workflow references it. Duplicate `todoread` and `todowrite` entries in frontmatter. |

---

### 20. risk-assessor

| Field | Value |
|-------|-------|
| **name** | risk-assessor |
| **type** | Prompt-enhance lane — safety analysis |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | prompt-enhance |
| **connections_to_agents** | Referenced by: prompt-repackager, prompt-skimmer |
| **is_orphan** | false |
| **quality_score** | 7/10 |
| **issues** | No command references it directly. No skill references it. Only connected via workflow and other prompt-enhance lane agents. |

---

### 21. spec-verifier

| Field | Value |
|-------|-------|
| **name** | spec-verifier |
| **type** | Specialist — Phase 1 spec verification |
| **connections_to_skills** | (none) |
| **connections_to_commands** | (none) |
| **connections_to_workflow** | (none) |
| **connections_to_agents** | References: critic |
| **is_orphan** | **true** |
| **quality_score** | 7/10 |
| **issues** | **ORPHANED:** Zero connections to any skill, command, or workflow. Only references critic. Well-structured with clear Check-Revise-Escalate loop, but no entry point. Description says "Triggers on 'verify spec', 'spec verification loop', 'check requirements'" but no command or workflow uses these phrases. |

---

## Orphaned Agents Summary

| Agent | Type | Why Orphaned |
|-------|------|-------------|
| **intent-loop** | Phase 0 specialist | No command, skill, or workflow dispatches it |
| **meta-synthesis-agent** | Meta-concept analyst | No command, skill, or workflow dispatches it; non-standard frontmatter |
| **phase-guardian** | Phase guardrails | No command, skill, or workflow dispatches it |
| **spec-verifier** | Spec verification | No command, skill, or workflow dispatches it |
| **conductor** | Primary orchestrator | Has command refs but no skill or workflow refs; description duplicates coordinator |
| **hivefiver** | Primary orchestrator | Has command/skill refs but role overlaps with hivefiver-orchestrator |

**Strictly orphaned (zero connections across all 4 categories):** intent-loop, meta-synthesis-agent, phase-guardian, spec-verifier

---

## Cross-Cutting Issues

### 1. explore.md and researcher.md Are Near-Duplicates

Both files contain the same 400+ line tool taxonomy reference document (Parts I-IV with mermaid diagrams). The actual agent definitions are only the first ~108 lines. These should be split: a thin agent definition + a shared reference file.

### 2. coordinator.md Has Structural Corruption

Duplicate `permission:` blocks, duplicated Task_Management sections, and malformed markdown suggest this file was merged incorrectly.

### 3. Dead Reference: hivefiver-tool-builder

hivefiver-orchestrator.md line 63 references `hivefiver-tool-builder` in its routing table, but no such agent file exists in agents-lab/active/refactoring/.

### 4. Prompt-Enhance Lane Agents Have No Direct Command Entry

All 6 prompt-enhance lane agents (prompt-skimmer, prompt-analyzer, context-mapper, risk-assessor, context-purifier, prompt-repackager) are only connected via the prompt-enhance workflow. They have no direct command references and no skill references. This is acceptable if the workflow is the sole entry point, but creates a fragile dependency chain.

### 5. conductor.md and coordinator.md Share Identical Descriptions

Both files have the same first-line description: "Primary orchestrator. Receives tasks, classifies intent, delegates to specialists, and maintains wisdom across sessions. Does not implement directly." This suggests they were intended to be distinct but the differentiation was lost.

---

## Connection Matrix

```
                    Skills  Commands  Workflows  Agent-Refs  ORPHAN?
builder               ✓        ✓         ✓          ✓         No
conductor             ✗        ✓         ✗          ✓         No (weak)
context-mapper        ✗        ✗         ✓          ✓         No
context-purifier      ✗        ✗         ✓          ✓         No
coordinator           ✓        ✓         ✗          ✓         No
critic                ✓        ✓         ✗          ✓         No
explore               ✓        ✓         ✗          ✓         No
hivefiver-agent-bld   ✓        ✗         ✓          ✓         No
hivefiver-cmd-bld     ✓        ✗         ✓          ✓         No
hivefiver-orchestrator✗        ✓         ✗          ✓         No
hivefiver-skill-auth  ✓        ✗         ✓          ✓         No
hivefiver             ✓        ✓         ✓          ✓         No
intent-loop           ✗        ✗         ✗          ✓(ref)    YES
meta-synthesis-agent  ✗        ✗         ✗          ✓(ref)    YES
phase-guardian        ✗        ✗         ✗          ✓(ref)    YES
prompt-analyzer       ✗        ✗         ✓          ✓         No
prompt-repackager     ✗        ✗         ✓          ✓         No
prompt-skimmer        ✗        ✗         ✓          ✓         No
researcher            ✗        ✓         ✗          ✓         No
risk-assessor         ✗        ✗         ✓          ✓         No
spec-verifier         ✗        ✗         ✗          ✓(ref)    YES
```

Note: "✓(ref)" means the agent references others but is not referenced by any skill, command, workflow, or other agent — making it effectively orphaned despite having outbound references.

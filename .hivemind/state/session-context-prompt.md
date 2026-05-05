# Session Context Prompt

## Current Workflow: Prompt Enhancement for Custom Tools Design Criteria

**Session ID:** hf-orchestrator-prompt-enhance-2026-05-05
**Workflow Type:** Prompt Engineering → Document Formalization
**Target Output:** `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/CUSTOM-TOOLS-CRITERIA.md`

## User Intent

Improve and formalize custom tools design criteria for the Hivemind harness project. The criteria should:
1. Be linguistically accurate and professionally written
2. Match the Hivemind harness project architecture
3. Serve as validation metrics for when custom tools are designed
4. Cover 10 key categories of tool design considerations

## Project Context

- **Project:** Hivemind V3 - runtime composition engine for OpenCode
- **Architecture:** CQRS Plugin with WaiterModel Delegation
- **Custom Tools Location:** `src/tools/` (16 registered tools)
- **Tool Pattern:** Zod schema + `execute()` function + `ToolResponse<T>` envelope
- **Key Tools:** delegate-task, delegation-status, configure-primitive, prompt-skim, prompt-analyze, session-patch, hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-agent-work-create, hivemind-agent-work-export, validate-restart, run-background-command, session-journal-export

## Tool Categories (from user prompt)

1. Task management, coordination, delegation, hand-off, governance loops
2. Governance, state updates, context-governance, context-purification, memory persistence
3. Inspection, investigation, research-based, knowledge synthesis
4. Code intelligence, AST, signatures, symbols, type injections
5. Planning documents, artifacts, doc-intelligence, hierarchical planning
6. Quality and guardrails tools for audit, review, verification, compliance
7. Gate-keeping, integration, cross-domain evidence-based verification
8. Lineage classification (hm-* or hf-* or shared)

## Constraints

- Output must be in Markdown format
- Must align with existing Hivemind architecture patterns
- Must reference OpenCode platform capabilities (custom tools, plugins, Zod schemas)
- Must be actionable for tool designers
- Date stamp: 2026-05-05

## Workflow Phases

- [ ] Phase 0: Skim (prompt-skim)
- [ ] Phase 1: Analysis (prompt-analyze)
- [ ] Phase 2: Context mapping
- [ ] Phase 3: Risk assessment
- [ ] Phase 4: Distillation
- [ ] Phase 5: Final assembly

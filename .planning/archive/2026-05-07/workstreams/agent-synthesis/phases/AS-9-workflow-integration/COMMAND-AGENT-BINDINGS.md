# COMMAND-AGENT-BINDINGS.md — Command-to-Agent Routing Map

**Phase:** AS-9 — Workflow Integration
**Created:** 2026-04-30
**Status:** DRAFT
**Dependencies:** AS-7 (workflow_awareness baseline), AS-8 (permissions matrix)

## Overview

This document maps every OpenCode command to its primary routing agent (L0 orchestrator) and the downstream dispatch chain through L1 coordinators to L2 specialists. It serves as the canonical reference for command dispatch, cross-lineage handoffs, and recovery paths.

## Command Binding Conventions

| Convention | Description |
|------------|-------------|
| **L0 Primary Agent** | The front-facing orchestrator that receives the command |
| **L1 Coordinator** | The coordinator that decomposes and dispatches L2 waves |
| **L2 Specialists** | The domain specialists that execute the work |
| **Cross-Lineage** | Commands that span hm-* and hf-* lineage boundaries |
| **Recovery Path** | Files used for session continuity on interruption |

---

## HM Lineage Commands (hm-l0-orchestrator)

HM commands serve the product development lifecycle: research, planning, implementation, quality, and lifecycle management.

| Command | L0 Agent | L1 Coordinator | L2 Specialists | Cross-Lineage | Recovery |
|---------|----------|----------------|----------------|---------------|----------|
| `/plan` | hm-l0-orchestrator | hm-l1-coordinator (planning wave) | hm-planner, hm-architect, hm-brainstormer | None | `.hivemind/state/session-continuity.json` |
| `/start-work` | hm-l0-orchestrator | hm-l1-coordinator (execution wave) | hm-executor, hm-technician, hm-writer | None | `.hivemind/state/session-continuity.json` |
| `/ultrawork` | hm-l0-orchestrator | hm-l1-coordinator (full lifecycle wave) | hm-planner → hm-executor → hm-validator | None | `.hivemind/state/session-continuity.json` |
| `/deep-init` | hm-l0-orchestrator | hm-l1-coordinator (init wave) | hm-researcher, hm-scout, hm-analyst | None | `.hivemind/state/session-continuity.json` |
| `/harness-doctor` | hm-l0-orchestrator | hm-l1-coordinator (audit wave) | hm-auditor, hm-validator | None | `.hivemind/state/session-continuity.json` |
| `/harness-audit` | hm-l0-orchestrator | hm-l1-coordinator (audit wave) | hm-auditor, hm-validator, hm-reviewer | None | `.hivemind/state/session-continuity.json` |
| `/deep-research-synthesis-repomix` | hm-l0-orchestrator | hm-l1-coordinator (research wave) | hm-researcher, hm-synthesizer, hm-investigator | None | `.hivemind/state/session-continuity.json` |

---

## HF Lineage Commands (hf-l0-orchestrator)

HF commands serve meta-concept creation, auditing, and lifecycle: agents, skills, commands, tools, and prompt engineering.

| Command | L0 Agent | L1 Coordinator | L2 Specialists | Cross-Lineage | Recovery |
|---------|----------|----------------|----------------|---------------|----------|
| `/hf-create` | hf-l0-orchestrator | hf-l1-coordinator (creation wave) | hf-agent-builder, hf-skill-builder, hf-command-builder, hf-tool-builder | May dispatch hm-researcher for codebase patterns | `.hivemind/state/session-continuity.json` |
| `/hf-audit` | hf-l0-orchestrator | hf-l1-coordinator (audit wave) | hf-auditor, hf-synthesizer, hf-refactorer | May dispatch hm-investigator for codebase investigation | `.hivemind/state/session-continuity.json` |
| `/hf-stack` | hf-l0-orchestrator | hf-l1-coordinator (stack wave) | hf-skill-builder, hf-synthesizer | None | `.hivemind/state/session-continuity.json` |
| `/hf-absorb` | hf-l0-orchestrator | hf-l1-coordinator (context wave) | hf-prompter, hf-synthesizer | May dispatch hm-researcher for deep investigation | `.hivemind/state/session-continuity.json` |
| `/hf-configure` | hf-l0-orchestrator | hf-l1-coordinator (configure wave) | hf-agent-builder, hf-skill-builder, hf-command-builder | None | `.hivemind/state/session-continuity.json` |
| `/hf-prompt-enhance` | hf-l0-orchestrator | hf-l1-coordinator (prompt wave) | hf-prompter, prompt-skimmer → prompt-analyzer → context-mapper → risk-assessor → context-purifier → prompt-repackager | May dispatch hm-researcher for codebase grounding | `.hivemind/state/session-continuity.json` |
| `/hf-prompt-enhance-to-plan` | hf-l0-orchestrator | hf-l1-coordinator → **hm-l1-coordinator** (cross-lineage) | hf-prompter (enhance) → hm-planner, hm-architect (plan) | **YES**: hm→hf cross-lineage handoff | `.hivemind/state/session-continuity.json`, `.hivemind/state/delegations.json` |
| `/sync-agents-md` | hf-l0-orchestrator | hf-l1-coordinator (sync wave) | hf-auditor, hm-investigator, hm-scout | May dispatch hm-* L2 for codebase investigation | `.hivemind/state/session-continuity.json` |

---

## Cross-Lineage Handoff Protocols

### HM → HF (meta-concept creation requests)

When a user requests meta-concept work (agent/skill/command/tool creation/audit) through an hm-* command context:

1. **Detection:** hm-l0-orchestrator identifies meta-concept intent
2. **Announcement:** "This is a meta-concept task. Routing to hf-orchestrator (hf-* meta-builder lineage)."
3. **Handoff:** hm-l0-orchestrator provides structured context to hf-l0-orchestrator
4. **Execution:** hf-l0-orchestrator classifies domain → hf-l1-coordinator → hf-l2-* specialists
5. **Return:** Results flow back through hf-l1-coordinator → hf-l0-orchestrator → user

### HF → HM (codebase investigation requests)

When a meta-concept task requires understanding existing codebase patterns:

1. **Assessment:** hf-l0-orchestrator determines if codebase investigation is needed
2. **Dispatch:** hf-l0-orchestrator → hm-l0-orchestrator → hm-l1-coordinator → hm-l2-* specialists
3. **Investigation:** hm-researcher, hm-investigator, hm-scout perform read-only codebase research
4. **Return:** Investigation findings → hm-l1-coordinator → hm-l0-orchestrator → hf-l0-orchestrator
5. **Feed:** hf-l0-orchestrator feeds findings into hf-* creation wave

### Direct Cross-Lineage L2 Dispatch (hf FLEXIBLE only)

hf-l1-coordinator may directly dispatch hm-* L2 specialists for single investigations without full L1 coordination. This is permitted only under hf FLEXIBLE lineage binding. hm-* lineage (STRICT) never dispatches hf-* agents directly.

---

## Recovery Paths

All commands share these recovery files for session continuity:

| File | Purpose | Owner | When Written |
|------|---------|-------|-------------|
| `.hivemind/state/session-continuity.json` | Active session state, pending delegations, gate status | L0 orchestrators | Session end, interruption, checkpoint |
| `.hivemind/state/delegations.json` | All delegation records with session IDs, statuses, results | L0 orchestrators | Every delegation dispatch + completion |
| `.hivemind/state/planning/<session-id>/task_plan.md` | Current task plan with phases and decisions | L0 orchestrators | Gate completion, phase transitions |

**Recovery Protocol:**
1. On session start: check `.hivemind/state/session-continuity.json`
2. If interrupted: read `.hivemind/state/delegations.json` for active delegation IDs
3. Poll `delegation-status` for each active delegation
4. Resume from checkpoint or re-dispatch as needed

---

## Agent Hierarchy Reference

```
User (direct) / OpenCode Commands
    │
    ├─→ hm-l0-orchestrator (product dev)
    │       └─→ hm-l1-coordinator
    │               ├─→ hm-l2-researcher (Research)
    │               ├─→ hm-l2-investigator (Debug)
    │               ├─→ hm-l2-synthesizer (Research)
    │               ├─→ hm-l2-analyst (Requirements)
    │               ├─→ hm-l2-planner (Planning)
    │               ├─→ hm-l2-architect (Architecture)
    │               ├─→ hm-l2-brainstormer (Discovery)
    │               ├─→ hm-l2-executor (Implementation)
    │               ├─→ hm-l2-technician (Technology)
    │               ├─→ hm-l2-writer (Documentation)
    │               ├─→ hm-l2-reviewer (Quality)
    │               ├─→ hm-l2-auditor (Quality)
    │               ├─→ hm-l2-validator (Quality)
    │               ├─→ hm-l2-assessor (Risk)
    │               ├─→ hm-l2-ecologist (Ecosystem)
    │               ├─→ hm-l2-mentor (Discovery)
    │               ├─→ hm-l2-persistor (State)
    │               ├─→ hm-l2-finisher (Execution)
    │               ├─→ hm-l2-guardian (Phase)
    │               ├─→ hm-l2-operator (Execution)
    │               ├─→ hm-l2-debugger (Debug)
    │               ├─→ hm-l2-integrator (Integration)
    │               ├─→ hm-l2-connector (Integration)
    │               ├─→ hm-l2-scout (Intelligence)
    │               ├─→ hm-l2-strategist (Intelligence)
    │               ├─→ hm-l2-curator (Quality)
    │               ├─→ hm-l2-optimizer (Performance)
    │               ├─→ hm-l2-router (Task Routing)
    │               └─→ [15 core→hm agents]
    │
    └─→ hf-l0-orchestrator (meta-builder)
            └─→ hf-l1-coordinator
                    ├─→ hf-l2-agent-builder
                    ├─→ hf-l2-skill-builder
                    ├─→ hf-l2-command-builder
                    ├─→ hf-l2-tool-builder
                    ├─→ hf-l2-prompter
                    ├─→ hf-l2-auditor
                    ├─→ hf-l2-synthesizer
                    ├─→ hf-l2-refactorer
                    └─→ hf-l2-meta-builder
```

---

## File Tracking

- **Created:** AS-9, 2026-04-30
- **References:** hm-l0-orchestrator.md, hf-l0-orchestrator.md, hm-l1-coordinator.md, hf-l1-coordinator.md
- **Depends On:** AS-7 (workflow_awareness baseline), AS-8 (permissions matrix)
- **Feeds Into:** AS-7 (Wiring & Verification)

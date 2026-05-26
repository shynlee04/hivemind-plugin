# Wave 1 Comparison Sheet: Orchestration & Intent Clarification

This document details the audit and comparison for Wave 1 agents (`hm-orchestrator` and `hm-intent-loop`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-orchestrator vs GSD Orchestration Primitives

| Compared Element | GSD Orchestration (Redux / Workflows) | hm-orchestrator (Hivemind L0) | Superior Points in Hivemind |
|---|---|---|---|
| **Architecture** | Flat agent execution; orchestration logic is hardcoded inside procedural YAML/Bash workflow files (e.g. `execute-phase.md`). | Structured L0 orchestration agent profile driving programmatic tools, hooks, and L2 specialists. | De-clutters agent profiles from procedural shell commands while keeping natural-language routing and gatekeeper orchestration intact. |
| **Domain Routing** | Namespace routing based on task name prefix. | Multi-domain classification mapping 12 semantic domains directly to their target specialist agents. | Avoids prefix dependency; routes based on semantic context, reducing developer error. |
| **Quality Gates** | Gate checks are flat bash steps verifying file presence or test commands. | Integrates the sequential **Quality Gate Triad** (Lifecycle Integration → Spec Compliance → Evidence Truth). | Enforces strict, multi-dimensional verification. A checkpoint fails immediately if any gate in the sequence trips. |
| **Session Tracking** | Basic logs written to a single folder. | Durable, programmatic session continuity tracking under `.hivemind/state/`. | Enables session stacking (attaching child work to completed sessions) and recovery across parent-child lineages. |

### Upgrades applied to `hm-orchestrator`:
- Added explicit L0/L1 coordination parameters.
- Specified routing validation: Deny routing of `hm-*` or `hf-*` developer tooling commands (which are subjects of development) and mandate routing of tooling commands to `gsd-*` commands/workflows.
- Documented that L0 delegates tasks using the `task` tool, passing explicit `task_id` parameters for session continuity and session stacking.

---

## 2. hm-intent-loop vs GSD Intent Primitives

| Compared Element | GSD Intent Handling | hm-intent-loop (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Ambiguity Resolution** | Flat prompting asking the user "What do you want to build?" | Progressive disclosure Q&A loop mapped directly to `hm-l2-user-intent-interactive-loop` skill. | Starts broad and dynamically refines questions through 5 distinct levels (broad, specific, confirm, edge, close). |
| **Context Protection** | None; infinite loops can occur if the user gives ambiguous answers, exhausting tokens. | Enforces a hard ceiling of max 10 questions per session. | Guarantees loop termination. If limits are reached, writes a partial `INTENT.md` and halts safely. |
| **Artifact Generation** | Scatters findings across plan files or logs. | Produces a single authoritative `INTENT.md` containing locked choices, explicit assumptions, and a decision log. | Creates a single source of truth for the planner and checker to reference directly. |

### Upgrades applied to `hm-intent-loop`:
- Refined progressive disclosure questioning protocol to explicitly map each Q&A turn to the corresponding Level 1-5 validation step.
- Added explicit boundary rules to check for context drift: if the user's intent drifts from the original phase scope, the agent aborts the loop and signals the orchestrator to route to the correct workflow.

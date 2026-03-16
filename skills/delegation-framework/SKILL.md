---
name: "delegation-framework"
description: "Use when delegating work to subagents or deciding between parallel/sequential execution. Provides delegation readiness guard, packet schema, and result validation. Supersedes delegation-intelligence and delegation-packet-contract."
---

# Delegation Framework

**Core principle:** Delegation is a precision instrument, not a fire-and-forget mechanism.

## When to Use

- Before delegating ANY task to a subagent
- When choosing parallel vs sequential execution
- After a subagent returns results
- When building delegation packets

## Platform Adaptation

> Delegation mechanics differ by platform. The DECISION FRAMEWORK is universal:
> - **OpenCode**: `task(...)` delegation plus explicit verification and, when needed, handoff/task artifact capture through the live HiveMind runtime surfaces
> - **Claude Code**: Subagent tool calls with structured prompts
> - **Antigravity**: `browser_subagent` / `run_command` patterns
> - **Codex**: Task-based delegation via API
>
> The concept of "what to delegate, when, and how to validate" is constant. Only the tool syntax changes.

## Pre-Delegation Readiness Guard

**NEVER delegate until ALL are confirmed:**

1. [ ] **Intent classified** — User intent is 100% clear (not assumed)
2. [ ] **Lineage confirmed** — Correct orchestrator identified (not defaulted)
3. [ ] **Complexity assessed** — Independent task? Dependent chain? Unknown (→ investigate first)?
4. [ ] **Session continuity checked** — Ongoing session? Fresh? Post-compaction?
5. [ ] **Packet complete** — Objective, scope, constraints, criteria, format all specified
6. [ ] **Intelligence export planned** — How will cycle results be captured?

## Parallel vs Sequential Decision Tree

```
Is the task decomposable into independent subtasks?
├── YES: Can subtask N succeed without subtask M's output?
│   ├── YES for ALL pairs → PARALLEL allowed
│   └── NO for ANY pair → SEQUENTIAL required
└── NO: Single delegation

Additional parallel conditions (ALL must be true):
- No shared state mutation between subtasks
- No ordering dependency in results
- Failure of one subtask doesn't invalidate others
- Combined context fits within token budgets
```

**Default to SEQUENTIAL.** Parallel is an optimization, not a starting point.

## Delegation Packet Schema

Every delegation must include:

| Field | Required | Description |
|-------|----------|-------------|
| Objective | ✅ | What the subagent must accomplish (not HOW) |
| Scope | ✅ | Explicit boundaries — what IS and IS NOT in scope |
| Constraints | ✅ | Time, token, file, or architectural limits |
| Acceptance Criteria | ✅ | How the orchestrator will verify success |
| Output Format | ✅ | Expected structure of the result |
| Context Payload | ⚠️ | Relevant decisions, findings, state (when available) |
| Anti-Constraints | ⚠️ | What the subagent must NOT do |

## After Subagent Returns — Validation Protocol

```
Subagent returns result
    │
    ├── Contains failure signals? (failed, error, couldn't, unable, blocked, partial, skipped)
    │   YES → Record outcome as FAILURE or PARTIAL
    │   NO  → Continue
    │
    ├── Describes what was ACTUALLY done?
    │   VAGUE → Request specifics before proceeding
    │   SPECIFIC → Verify independently
    │
    ├── Can you verify independently?
    │   Run appropriate verification (test/build/grep for expected changes)
    │   PASS → Record outcome as SUCCESS
    │   FAIL → Record outcome as FAILURE
    │
    └── Update work hierarchy with accurate outcome
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Fire-and-forget | No result validation | Always verify after delegation returns |
| Vague delegation | "Fix the bug" without scope | Use packet schema — all 5 required fields |
| Premature parallel | Assuming independence | Default sequential, prove independence first |
| Result inflation | Accepting "done" at face value | Check for failure signals, verify independently |
| Context omission | Delegating without state | Include relevant decisions and constraints in packet |
| Recursive delegation | Subagent delegates to sub-subagent | Executors do NOT recursively delegate |

## Consequence of Poor Delegation

| Skip | Cost |
|------|------|
| No readiness guard | Wrong agent, wrong task, wrong lineage |
| No acceptance criteria | "Done" means nothing — no way to verify |
| No result validation | False completion, bugs surface at 10x cost |
| No intelligence export | Next cycle re-discovers what this cycle already found |

## Bundled Resources

| Resource | Trigger | Content |
|----------|---------|---------|
| [spawning-guard.md](references/spawning-guard.md) | Before any delegation | Pre-spawn checklist, execution model, post-return validation |
| [delegation-packet.md](templates/delegation-packet.md) | Building a delegation packet | Fill-in-the-blank template with all required and optional fields |

> [!IMPORTANT]
> If `entry-resolution` already loaded its bundled spawning-guard, do NOT re-load this one. They share the same content.

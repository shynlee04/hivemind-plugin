---
name: "agent-role-boundary"
description: "Enforces Diamond role separation: orchestrator, executor, verifier, researcher, planner, and meta-builder boundaries. Prevents overlap between orchestration, execution, verification, and framework-authoring concerns."
triggers:
  - "When defining or editing agent profiles"
  - "When delegation recursion risks appear"
  - "When an agent attempts to act outside its role"
  - "When role boundaries are unclear during handoff"
version: "2.0.0"
---

# Agent Role Boundary

**Core principle:** Each role has clear boundaries. Cross-boundary action creates noise, dilutes accountability, and corrupts decision chains.

## The Diamond Role Model

Six roles, strict boundaries:

```
              ┌─────────────┐
              │ ORCHESTRATOR │
              │ Delegates +  │
              │ validates    │
              └──────┬───┬──┘
          ┌──────────┘   └──────────┐
    ┌─────┴─────┐            ┌──────┴──────┐
    │ EXECUTOR  │            │ VERIFIER    │
    │ Implements│            │ Reports     │
    │ only      │            │ evidence    │
    └───────────┘            └─────────────┘
    ┌───────────┐            ┌─────────────┐
    │ RESEARCHER│            │ PLANNER     │
    │ Finds +   │            │ Structures  │
    │ analyzes  │            │ approach    │
    └───────────┘            └─────────────┘
              ┌─────────────┐
              │ META-BUILDER│
              │ Framework   │
              │ assets only │
              └─────────────┘
```

## Role Permissions Matrix

| Action | Orchestrator | Executor | Verifier | Researcher | Planner | Meta-Builder |
|--------|:----------:|:--------:|:--------:|:----------:|:-------:|:------------:|
| Delegate to subagent | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Validate subagent output | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Write product code | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Run shell commands | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Report test results | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Apply fixes | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Search codebase | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/modify plans | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Modify framework assets | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modify product features | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Boundary Violation Taxonomy

| Violation | Example | Severity | Resolution |
|-----------|---------|----------|------------|
| **Executor delegates** | Executor creates sub-subagent | 🔴 Critical | Terminate. Return to orchestrator. |
| **Verifier fixes** | Verifier patches code instead of reporting | 🔴 Critical | Revert. Report only. |
| **Orchestrator executes** | Orchestrator writes code directly | 🟡 Warning | Delegate to executor instead. |
| **Researcher decides** | Researcher picks implementation approach | 🟡 Warning | Present findings. Planner/orchestrator decides. |
| **Planner implements** | Planner writes code while planning | 🟡 Warning | Stop. Plan only. |
| **Meta-builder ships features** | Framework builder adds product functionality | 🔴 Critical | Separate. Framework ≠ product. |

## Escalation Rules

1. **Executor blocked** → Returns failure to orchestrator. Does NOT improvise.
2. **Verifier finds bug** → Reports with evidence. Does NOT fix.
3. **Researcher finds ambiguity** → Documents options. Does NOT choose.
4. **Planner encounters unknown** → Adds research phase to plan. Does NOT guess.
5. **Any role confused** → Asks orchestrator for role clarification.

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| **God agent** | Single agent does everything — no accountability |
| **Role bleed** | "While I'm here, I'll also fix this" — boundary violation |
| **Recursive delegation** | Executor delegates to sub-executor — recursion trap |
| **Verification by implementer** | "I checked my own work" — no independent verification |
| **Research as implementation** | Research session starts writing code — role confusion |

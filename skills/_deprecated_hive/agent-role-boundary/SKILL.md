---
name: "agent-role-boundary"
description: "Describes Diamond role separation: orchestrator, executor, verifier, researcher, planner, and meta-builder boundaries. Use as guidance when defining agent profiles, when delegation recursion risks appear, when an agent acts outside its role, or when role boundaries are unclear during handoff. NOTE: This is documentation only - it does not enforce role separation."
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

## Platform Adaptation

> The Diamond model is CONCEPTUAL. On single-agent platforms, roles become sequential phases.
> - **Multi-agent** (OpenCode, Claude Code, Antigravity): Roles map to separate agents
> - **Single-agent** (Cursor, Windsurf, Kilo Code): Roles collapse to phases — agent switches hats
>
> For detailed platform mapping, **see** [references/role-platform-mapping.md](references/role-platform-mapping.md).

## PLAN.md Protocol Anchor

This skill activates at **Step 4 (Decision)** — determines which role has authority to decide, and at **Step 7 (Execute)** — enforces that only Executors implement.

## Bundled Resources

| Resource | Trigger | Content |
|----------|---------|---------|
| [role-platform-mapping.md](references/role-platform-mapping.md) | Single-agent platform detected | How Diamond model adapts to single vs multi-agent |
| [role-declaration.md](templates/role-declaration.md) | Session start or role transition | Fill-in template for declaring active role |

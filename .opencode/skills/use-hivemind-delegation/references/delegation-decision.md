# Delegation Decision Criteria

## Purpose

Provides the decision framework for when to delegate work to subagents versus executing inline. Covers the cost/benefit analysis, delegation overhead, and the deterministic decision flow that orchestrators must follow.

## When to Delegate

Delegate when **any** of the following conditions are true:

| Condition | Why Delegation Is Required |
|-----------|---------------------------|
| Work touches >3 files | Orchestrator context accumulates fast; multi-file reads pollute the session |
| Work requires deep reads | Session freshness rule: the orchestrator must not do deep analysis inline |
| Work has independent verification needs | Verification agent needs fresh context, separate from implementation |
| Session context is stale or suspect | Stale context produces wrong decisions; fresh subagent starts clean |
| Multiple concerns mixed (read + write + verify) | Each concern has different success tests and authority levels |
| User explicitly requests delegation or splitting | User intent overrides cost considerations |
| Work involves debugging a reproduced failure | Debug loops accumulate evidence that pollutes routing decisions |

## When NOT to Delegate

Do NOT delegate when:

| Condition | Action Instead |
|-----------|---------------|
| Single-file edit with clear scope and fresh context | Execute inline |
| Task completable in <3 inline actions | Execute inline |
| Scope is unclear | Emit a scope-clarification question, not a packet |
| All potential slices share the same authority surface and concern type | Execute inline — delegation overhead exceeds benefit |

## Cost/Benefit

Delegation overhead includes:
- **Packet creation** (~1 turn to write scope, constraints, return contract)
- **Subagent dispatch** (startup latency, fresh context assembly)
- **Return synthesis** (reading and integrating the child's output)

For tasks completable in <3 inline actions, delegation overhead often exceeds inline execution cost. **Exception:** session freshness always wins. If context is suspect, delegate regardless of task size.

## Decision Flow

```
Is scope clear?
  NO → Ask clarifying question → Re-evaluate
  YES ↓

Does work meet any delegation condition?
  NO → Execute inline
  YES ↓

Can the work be decomposed into ≤5-file slices?
  NO → Work is too large for one delegation; decompose first, then delegate each slice
  YES ↓

Do slices share state or dependencies?
  YES → Sequential delegation
  NO → Parallel delegation (with independence proof)
```

## Related

- `delegation-modes.md` for mode selection after decision
- `role-boundaries.md` for parent/child responsibility enforcement
- `failure-recovery.md` for handling delegation failures

# Failure and Recovery

## Partial Return Handling

When a subagent returns `status: "partial"`:

1. Read `blocked_routes` — what prevented completion?
2. Read `recommended_next_action` — what does the child suggest?
3. Decide: re-delegate, decompose, or escalate

| Partial Return | Action |
|----------------|--------|
| `blocked_routes` is resolvable (missing file access, scope too narrow) | Re-delegate with expanded authority or constraints |
| `blocked_routes` indicates the slice was too large | Decompose into smaller slices and re-delegate each |
| `blocked_routes` is unresolvable (external dependency, user decision needed) | Escalate to user with evidence |
| `recommended_next_action` is specific and actionable | Follow the child's recommendation |

## Timeout Protocol

| Scenario | Action |
|----------|--------|
| Subagent does not return within 2x expected window | Emit a status probe or abort and re-delegate |
| Subagent returns but with empty findings | Treat as partial — check if scope was wrong |
| Subagent returns with fabricated completeness | Quarantine the return — check `files_checked` against `scope` |

Log all timeout events to `{activity}/delegation/registry.json` for pattern detection.

## Escalation Ladder

Use this order. Do not skip levels.

| Level | Action | When |
|-------|--------|------|
| 1 | **Re-delegate** with tighter constraints | First failure or blocked route |
| 2 | **Decompose** the slice further | Blocked twice — slice was too large |
| 3 | **Escalate to user** with evidence | Decomposition still fails |
| 4 | **Abort** | Slice is no longer needed |

## Parallel-Slice Failure Isolation

- One failure does NOT abort other parallel slices unless a dependency exists
- Collect all returns before deciding on integration
- If a parallel slice fails and others succeed: integrate successes, re-delegate only the failed slice
- If >50% of parallel slices fail: stop and reassess task decomposition — slices may be incorrectly scoped

## Scope Violation

When a child exceeds scope or mutates files outside `authority_surfaces`:

1. Mark the return as `scope_violation`
2. Do NOT merge the child's output
3. Re-delegate with tighter constraints or escalate to user
4. Log the violation to `{activity}/delegation/registry.json`

## Blocked Route Resolution

When `blocked_routes` are returned:

1. **Identify the blocker type:**
   - `missing_access` — child needs authority over additional surfaces
   - `missing_context` — child needs additional artifacts or prior findings
   - `external_dependency` — blocker is outside the project
   - `ambiguous_scope` — scope was unclear

2. **Resolve by type:**

| Blocker Type | Resolution |
|--------------|------------|
| `missing_access` | Add to `authority_surfaces`, re-delegate |
| `missing_context` | Add to `must_read_artifacts`, re-delegate |
| `external_dependency` | Escalate to user |
| `ambiguous_scope` | Rewrite the scope with explicit in/out boundaries |

3. **Track resolution:** Record the blocker and resolution in the delegation registry for pattern detection.

For cascading failure protocols, see `hivemind-gatekeeping/references/cascading-failure.md`.

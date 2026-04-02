# Sequential vs Parallel Execution

Decision framework for choosing the right execution mode when coordinating multiple agents.

---

## The Core Tension

Parallel execution is faster but risks conflicts. Sequential execution is safer but slower. The wrong choice wastes time or corrupts results.

This framework makes the decision **programmatic and measurable** — not a gut feeling.

---

## Decision Tree

```
                    ┌─────────────────────┐
                    │  How many tasks?    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           1 task         2 tasks         3+ tasks
              │               │               │
              ▼               ▼               ▼
        Execute         Check independence  Check independence
        directly        (see below)         (see below)
                              │               │
                     ┌────────┴────────┐      │
                     │                 │      │
                Independent       Dependent   │
                     │                 │      │
                     ▼                 ▼      ▼
               Sequential       Sequential  Check file overlap
                                             (see below)
                                                    │
                                           ┌────────┴────────┐
                                           │                 │
                                      No overlap        Overlap
                                           │                 │
                                           ▼                 ▼
                                     Parallel         Sequential
```

---

## Independence Criteria

Two tasks are **independent** if ALL of the following are true:

| Criterion | Check | Pass If |
|-----------|-------|---------|
| File overlap | Do tasks modify the same files? | No shared files |
| State dependency | Does task B need task A's output? | No dependency |
| Resource conflict | Do tasks use the same external resource? | No shared resource |
| Root cause | Are failures from the same underlying issue? | Different root causes |
| Validation | Can each task be verified independently? | Independent verification |

**If any criterion fails → tasks are dependent → use sequential.**

---

## When to Use Parallel Dispatch

**All conditions must be met:**

1. **3+ tasks** — Fewer than 3, the coordination overhead isn't worth it.
2. **Independent domains** — Each task touches different files or subsystems.
3. **Different root causes** — Fixing one won't affect the others.
4. **No shared state** — No file, database, or resource conflicts.
5. **Independent verification** — Each task can be validated on its own.

**Example — Parallel is correct:**
```
Task 1: Fix auth.test.ts — timing issues in token refresh
Task 2: Fix batch.test.ts — event structure bug (threadId in wrong place)
Task 3: Fix race.test.ts — missing async wait for tool execution
```
Three files, three root causes, no shared code → parallel dispatch.

**Example — Sequential is correct:**
```
Task 1: Fix auth.test.ts — token refresh timing
Task 2: Fix auth.test.ts — session validation after refresh
Task 3: Fix auth.test.ts — logout clears refresh token
```
Same file, related features → sequential (fix one may affect others).

---

## When to Use Sequential Execution

**Use sequential when ANY of these are true:**

| Condition | Reason |
|-----------|--------|
| Same file modified | Risk of merge conflicts or overwrites |
| Shared state mutation | One task's output is another's input |
| Exploratory debugging | Root cause unknown — need full context |
| Related failures | Fixing one might fix others |
| 1-2 tasks | Coordination overhead exceeds benefit |
| Unclear independence | When in doubt, go sequential |

---

## Adaptive Execution with Constraints

The framework is **adaptive with constraints** — not rigid. Adjust based on evidence:

### Start Sequential, Escalate to Parallel

If you begin investigating sequentially and discover tasks are truly independent:

1. **Stop** the current sequential investigation.
2. **Document** what you've learned so far (write to disk).
3. **Re-assess** using the independence criteria above.
4. **Dispatch parallel** if criteria are met.

### Start Parallel, Fall Back to Sequential

If parallel agents discover their tasks are related:

1. **Halt** remaining parallel agents.
2. **Collect** results from completed agents.
3. **Re-assess** the remaining work as a single domain.
4. **Continue sequentially** with full context.

---

## Measuring the Decision

After execution, evaluate whether the mode choice was correct:

| Metric | Parallel Success | Sequential Success |
|--------|-----------------|-------------------|
| Time saved vs sequential | >30% faster | N/A (baseline) |
| Conflict rate | 0 file conflicts | N/A |
| Context adequacy | Each agent had enough info | Full context available |
| Integration effort | Minimal merge work | Linear progression |

**If parallel had conflicts or insufficient context → next time, use sequential for similar tasks.**
**If sequential was much slower with no benefit → next time, use parallel for similar tasks.**

---

## Integration After Parallel Dispatch

When parallel agents return:

1. **Review each summary** — Understand what changed and why.
2. **Check for conflicts** — Did any agents edit the same code?
3. **Run full validation** — Verify all fixes work together.
4. **Spot check** — Agents can make systematic errors; verify critical changes.
5. **Write integration report** — Document what was merged, what passed, what needs follow-up.

**If conflicts found:** Resolve manually or dispatch a focused integration agent.
**If validation fails:** Identify which agent's change caused the failure, loop back.

---

## Cross-References

- `references/01-handoff-protocols.md` — How to construct task envelopes for each mode
- `references/03-parent-child-cycles.md` — How parent monitors parallel vs sequential children
- `references/04-ralph-loop-integration.md` — How to loop until all gates pass in either mode
- `dispatching-parallel-agents` skill — The underlying parallel dispatch pattern this builds on

# Coordination Philosophy

## Why this matters

Coordination patterns are not arbitrary. Each design decision — WaiterModel vs blocking, checkpoint vs continuous, bounded vs unbounded iteration — carries a philosophical stance about what multi-agent systems can and cannot be trusted to do autonomously. This document explains the reasoning behind the patterns in SKILL.md so you can adapt them, not just copy them.

---

## Why WaiterModel Over Blocking

### The blocking model (what most systems do)

```
Parent dispatches agent → parent blocks (waits for return) → parent resumes
```

This looks simple but creates three problems:

1. **Context debt.** The parent's context window fills while waiting. When the child returns, the parent has less room to process the result.
2. **Failure blindness.** If the child stalls or times out, the parent is stuck. No timeout = no recovery.
3. **Single-path execution.** The parent can only do one thing at a time. True parallelism requires multiple concurrent dispatches, which blocking prevents.

### The WaiterModel (what Hivemind does)

```
Parent dispatches agent → receives delegation ID immediately → continues work
Parent polls delegation-status → when "completed" or "error" → processes result
```

Benefits:
- **Context conservation.** The parent does not hold context while waiting. It continues other work or yields.
- **Failure detection.** The 60-second stall timeout catches silent failures. The parent can decide: retry, escalate, skip.
- **True parallelism.** Parent dispatches 3 agents → receives 3 IDs → polls 3 statuses → merges 3 results. No blocking per dispatch.
- **Dual-signal verification.** The parent does not trust the child's "I'm done" claim. It verifies via `delegation-status`. If the child says "completed" but the status shows "error," the status wins.

### The trade-off

WaiterModel requires polling infrastructure (`delegation-status` or equivalent). If your platform lacks this, you revert to blocking — but accept the risks. Never claim WaiterModel behavior without polling. The worst failure mode is: parent dispatches, assumes completion, and continues with stale state.

---

## Why Checkpoint Gates Prevent Drift

### The problem: autonomous drift

Multi-agent workflows that run for more than 3 steps without human input tend to drift. Not because agents are bad, but because:

1. **Compounding ambiguity.** Agent 1 makes a reasonable assumption. Agent 2 builds on it. Agent 3 assumes the assumption is fact. By agent 5, the workflow is building on fiction.
2. **Goal displacement.** The original goal was "fix the login bug." By iteration 3, agents are refactoring the auth module. The scope creep is invisible to the system because each step is internally rational.
3. **Silent failure accumulation.** Agent 3 partially fails. Agent 4 compensates. Agent 5 doesn't know about the compensation. The workflow "completes" with 3 patches on top of a patch.

### The fix: gates that require human input

A checkpoint gate is not a progress report. It is a **hard stop** that says: "I will not proceed until a human explicitly says yes."

**Effective gates:**
- "I found 3 issues in the auth module. The critical one is a missing CSRF token. Fixing it will touch 8 files. Proceed?"
- "Wave 1 complete: 4 agents finished, 0 errors. Wave 2 will create the migration. This is irreversible. Continue?"

**Ineffective gates (checkpoint theater):**
- "Wave 1 complete. Everything looks good. Moving to Wave 2." (No decision requested — auto-approve territory)
- "Progress update: 3 of 5 tasks done. Continuing." (Status update, not a gate)

### Placement rules

Insert gates at:
- **Irreversibility boundaries.** Before any step that cannot be undone (migrations, deletions, schema changes).
- **Boundary crossings.** When the workflow transitions from analysis → design → implementation → verification.
- **Budget exhaustion.** When 60% of the iteration budget is consumed. Budget = ceil(max_iterations * 0.6).
- **Ambiguity thresholds.** When an agent says "probably," "should work," or "seems correct" — these are uncertainty signals, not confidence signals.

---

## Why Max-Iteration Enforcement Is Non-Negotiable

### The infinite loop problem

An agent that retries on failure without changing its approach will fail forever. This is not a bug — it is a property of deterministic failure: same input + same tool + same approach = same failure.

The max-iteration limit (5) is not an arbitrary number. It is derived from:

1. **Human attention budget.** After 5 attempts at the same problem, a human needs to look. Automated systems lose context; humans regain it.
2. **Context decay rate.** Each retry burns context. After 5 iterations, the agent's reasoning quality degrades measurably because earlier context is compressed or truncated.
3. **Escalation signal.** "5 iterations reached" is a strong signal that the current approach is wrong. The correct response is to change the approach, not tighten the retry loop.

### Why 5, not 3 or 10?

- **3 iterations**: Too few for genuinely complex problems that benefit from 2–3 refinement cycles. Would trigger false escalations.
- **10 iterations**: Too many. By iteration 7, context is so degraded that the agent is effectively guessing. The extra 3 iterations add noise, not progress.
- **5 iterations**: The sweet spot. Enough for initial attempt + 2 refinement cycles + 1 recovery attempt + 1 escalatory final attempt with instrumentation.

### The escalation contract

When iteration 5 is reached, the agent MUST NOT:
- Say "one more try" (iteration 6 violates the contract)
- Restart the loop from iteration 1 ("this time it's different" — it's not)
- Delegate the problem to another agent without human approval (passing the buck)

The agent MUST:
- Present a structured summary of what was tried (iterations 1–5)
- Identify the unresolved blocker
- Offer exactly 3 options: (a) human takeover, (b) re-authorize with approach change, (c) accept partial result

---

## Why Batching Beats One-at-a-Time

### The coordination overhead curve

```
Coordination overhead
  │
  │                              ╱
  │                           ╱
  │                        ╱
  │                     ╱
  │                  ╱
  │               ╱
  │            ╱
  │_________╱___________________ Number of agents
  1    2    3    4    5    6    7
```

Below 3 agents: coordination overhead is negligible. Dispatch freely.
At 3–5 agents: overhead is manageable but requires tracking.
Above 5 agents: overhead dominates. Batching or wave-based dispatch required.

### Why batching works

Batching takes 8 tasks and splits them into 2 waves of 4. This gives you:
- **Predictable completion.** Each wave finishes as a unit. You gate-check between waves.
- **Controlled context.** Each wave's agents share a bounded time window. You don't have agent 1 finishing at t=0 and agent 8 finishing at t=300 with completely different context states.
- **Recovery granularity.** If wave 1 fails, you fix wave 1. Wave 2 hasn't started yet — no wasted work.

### The anti-pattern: "just dispatch all 8 at once"

Dispatching 8 agents simultaneously creates:
- **Merge hell.** 8 agents writing files. If any two touch the same file, one's work is lost.
- **Status chaos.** Tracking 8 concurrent completions is combinatorially harder than tracking 4+4.
- **Context competition.** All 8 agents share the same parent context window budget. Later agents get less.

---

## The Principle of Least Coordination

The final philosophical stance: **use the simplest coordination pattern that solves the problem.**

- 1 task → do inline. Don't coordinate.
- 2 tasks, independent → parallel (2). Don't wave.
- 3+ tasks, dependencies → wave or pipeline. Don't over-engineer.

The goal of coordination is not to build elaborate orchestration — it is to make multi-agent work **boring and reliable.** A good coordination pattern is one you forget you're using because it just works.

Every additional coordination layer (waves, gates, checkpoints, iteration counters) adds failure modes. Add them only when the risk they mitigate is real, not hypothetical.

**The litmus test:** If you cannot name the specific failure mode each coordination layer prevents, you don't need it yet. Remove it until the remaining layers each have a clear, named purpose.

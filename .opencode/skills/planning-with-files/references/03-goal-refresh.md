# Goal Refresh: How task_plan.md Prevents Drift

Why re-reading the plan file is the single most important habit for long-running tasks.

---

## The Problem: Lost in the Middle

After approximately 50 tool calls, the original goal drifts out of the Agent's effective attention window. This is a known limitation of transformer architectures — the "lost in the middle" effect.

**Symptoms of goal drift:**
- Agent starts working on tangential tasks not in the plan.
- Agent forgets constraints documented in early phases.
- Agent repeats work already completed.
- Agent loses track of which phase it's on.
- Agent makes decisions that contradict earlier documented decisions.

**Root cause:** The original goal statement is at the top of the context. After many tool calls, it is far from the "recent attention" zone where the model focuses most.

---

## The Solution: Goal Refresh via Recitation

Re-reading `task_plan.md` brings the goal back into the recent attention window. This is attention manipulation through recitation.

```
Start of context: [Original goal — far away, forgotten]
...many tool calls, file reads, edits, errors...
End of context: [Just read task_plan.md — gets MAXIMUM attention!]
                                                          ↑
                                          This is where the model focuses
```

### The Mechanism

1. **Agent reads `task_plan.md`** — The entire file is loaded into context.
2. **Goal statement appears at the end** — Recent content gets highest attention weight.
3. **Agent makes decision** — The decision is informed by the freshly-recited goal.
4. **Agent acts** — Actions align with the goal because it's top-of-mind.

### When to Refresh

| Situation | Action |
|-----------|--------|
| Before any major decision | Read `task_plan.md` |
| After 10+ tool calls since last read | Read `task_plan.md` |
| After an error that required rethinking | Read `task_plan.md` |
| When starting a new phase | Read `task_plan.md` |
| When context feels "stale" | Read `task_plan.md` |
| After `/clear` or session recovery | Read `task_plan.md` first |

### What Gets Refreshed

Re-reading `task_plan.md` refreshes:
- **Goal** — The one-sentence north star.
- **Current phase** — Where the Agent should be working.
- **Remaining phases** — What's still to come.
- **Decisions made** — Why certain choices were made.
- **Errors encountered** — What has already been tried.

---

## Why This Works

### Attention Weight Distribution

Transformer models assign higher attention weight to content near the end of the context window. Content at the beginning gets the least attention after the window fills.

```
Attention weight:
  [Beginning] ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [End]
               Low attention                              High attention
```

By re-reading `task_plan.md` before decisions, the goal and current phase appear in the high-attention zone.

### KV-Cache Efficiency

Re-reading the same file repeatedly improves KV-cache hit rates. The model has already processed this content, so re-reading is computationally cheaper than processing new content.

---

## Anti-Drift Checklist

Before making any decision that affects the task direction:

- [ ] Have I read `task_plan.md` in the last 10 tool calls?
- [ ] Does my next action align with the `## Goal` statement?
- [ ] Am I working on the phase marked `in_progress`?
- [ ] Have I checked `## Decisions Made` to avoid contradicting earlier choices?
- [ ] Have I checked `## Errors Encountered` to avoid repeating failures?

If any answer is "no," read `task_plan.md` before proceeding.

---

## The Read-Before-Decide Pattern

```
[Many tool calls have happened...]
[Context is getting long...]
[Original goal might be forgotten...]

→ Read task_plan.md          # This brings goals back into attention!
→ Now make the decision       # Goals are fresh in context
```

This is why Manus can handle ~50 tool calls without losing track. The plan file acts as a "goal refresh" mechanism, not just a static document.

---

## Common Drift Scenarios

### Scenario 1: Feature Creep

**What happens:** Agent starts adding features not in the original plan.

**Prevention:** Re-read `task_plan.md` → see the `## Goal` → recognize the scope boundary.

### Scenario 2: Rabbit Hole Debugging

**What happens:** Agent spends 20 tool calls debugging a minor issue while the main task stalls.

**Prevention:** Re-read `task_plan.md` → see `## Current Phase` → recognize the phase is blocked → escalate or move on.

### Scenario 3: Forgotten Constraints

**What happens:** Agent implements a solution that violates a constraint documented in Phase 1.

**Prevention:** Re-read `task_plan.md` → see `## Decisions Made` → remember the constraint.

### Scenario 4: Repeated Failures

**What happens:** Agent tries the same failing approach multiple times.

**Prevention:** Re-read `task_plan.md` → see `## Errors Encountered` → recognize this was already tried.

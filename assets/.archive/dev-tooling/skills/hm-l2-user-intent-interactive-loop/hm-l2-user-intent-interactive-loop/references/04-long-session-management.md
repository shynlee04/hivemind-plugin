# Long Session Management

**Purpose:** Persisting through extended sessions — budget management, checkpoint strategy, fatigue detection, and explicit loop termination.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Session Budgeting](#session-budgeting)
3. [Checkpoint Strategy](#checkpoint-strategy)
4. [Fatigue Detection](#fatigue-detection)
5. [Compaction Preparation](#compaction-preparation)
6. [Recovery After Interruption](#recovery-after-interruption)
7. [Delegation During Long Sessions](#delegation-during-long-sessions)
8. [Loop Termination](#loop-termination)
9. [Anti-Patterns](#anti-patterns)
10. [Worked Examples](#worked-examples)
11. [Cross-References](#cross-references)

---

## Core Principle

**Long sessions degrade by default. Coherence, focus, and quality all decay without active management.** The Agent must proactively manage budgets, create checkpoints, detect fatigue, and prepare for compaction.

A "long session" is any engagement that:
- Exceeds 50 turns
- Spans multiple hours
- Involves compaction or context summarization
- Requires multiple delegation cycles
- Covers more than 3 distinct phases

---

## Session Budgeting

The Agent tracks and manages resources to prevent runaway sessions.

### Budget Types

| Budget | What It Limits | Default | Adjust When |
|--------|---------------|---------|-------------|
| Turn budget | Number of conversational turns | 50 | User says "keep going" or "wrap up" |
| Token budget | Tokens consumed per subagent | 2000 | Task complexity changes |
| Phase budget | Number of phases in the session | 5 | Scope expands or contracts |
| Time budget | Real-world time (if user specifies) | User-defined | User sets deadline |

### Budget Enforcement

| Signal | Action |
|--------|--------|
| 75% of turn budget used | Warn user: "We're at turn N of ~50. Want to continue or wrap up?" |
| 90% of turn budget used | Strong recommendation: "We're near the limit. Should I save state and we resume later?" |
| Budget exceeded | Save state, summarize progress, ask user to continue or pause |
| Subagent exceeds token budget | Terminate subagent, save partial output, report to user |

### Budget Communication

Always tell the user about budgets:
- **At session start:** "This looks like a multi-phase task. I'll track our progress and let you know if we're approaching limits."
- **At 75%:** "We've used about 75% of a typical session. Still on track, but wanted to flag it."
- **At delegation:** "Spinning up a subagent with a 2000-token budget for this task."

---

## Checkpoint Strategy

Checkpoints are the Agent's insurance against context loss.

### Checkpoint Types

| Type | When | What It Saves |
|------|------|---------------|
| **Phase checkpoint** | After completing a phase | Phase status, next phase, key decisions |
| **Delegation checkpoint** | Before and after subagent dispatch | What was delegated, budget, results |
| **Turn checkpoint** | Every 10 turns | Brief summary of what happened |
| **Compaction checkpoint** | Before expected compaction | Full state snapshot (see below) |
| **User-requested checkpoint** | When user says "save state" | Everything current |

### Checkpoint Content

A compaction checkpoint in `progress.md`:

```markdown
## Checkpoint [YYYY-MM-DD HH:MM]
- **User intent:** [Verbatim or close paraphrase]
- **Current phase:** [Name and number, e.g., "Phase 3 of 5"]
- **Completed:** [Bulleted list of done items]
- **In progress:** [What's actively being worked on]
- **Next action:** [Specific next step]
- **Key constraints:** [Active constraints, decisions]
- **Open questions:** [Unresolved items]
- **Delegation state:** [Active subagents, their status]
- **Files modified:** [List of changed files]
```

### Checkpoint Discipline

1. **Write before compaction** — Always save state before the conversation gets long
2. **Write after delegation** — Record what was sent and what's expected back
3. **Write on user request** — If the user says "save," do it immediately
4. **Write on phase change** — Every phase transition is a natural checkpoint
5. **Don't skip checkpoints** — "I'll save later" is how context gets lost

---

## Fatigue Detection

Both the Agent and the user can experience session fatigue. The Agent must detect and respond.

### Agent Fatigue Signals

| Signal | What It Means | Response |
|--------|--------------|----------|
| Repeating the same question | Lost track of previous answers | Re-read progress.md, acknowledge the repeat |
| Losing thread of conversation | Context compression hit | Run recovery protocol (see below) |
| Making obvious mistakes | Quality degrading | Slow down, double-check work, offer checkpoint |
| Skipping verification steps | Cutting corners | Re-enable verification, announce the correction |

### User Fatigue Signals

| Signal | What It Means | Response |
|--------|--------------|----------|
| Short, one-word responses | Disengaged or tired | Offer to pause, summarize progress |
| "Just do it" or "whatever" | Decision fatigue | Make a recommendation, proceed with stated assumptions |
| Changing topic frequently | Lost focus or overwhelmed | Suggest a break, summarize what's been done |
| Not responding for a long time | Stepped away | Save state, wait, resume when they return |

### Fatigue Response Protocol

```
1. Detect the signal
2. Acknowledge it explicitly: "This has been a long session. Want to pause?"
3. Save state to disk (checkpoint)
4. Offer options:
   - Continue now
   - Pause and resume later
   - Delegate remaining work to subagents
   - Wrap up with current progress
5. Respect the user's choice
```

---

## Compaction Preparation

When the conversation approaches the platform's context limit:

### Pre-Compaction Checklist

- [ ] Write compaction checkpoint to `progress.md`
- [ ] Update `task_plan.md` with current phase and goals
- [ ] Ensure `findings.md` has all recent discoveries
- [ ] Summarize active delegations and their status
- [ ] List any open questions or unresolved decisions
- [ ] Tell the user: "The conversation is getting long. I'm saving our state so nothing is lost."

### Post-Compaction Recovery

1. Read the compaction checkpoint from `progress.md`
2. Re-read `task_plan.md` for current goals
3. Re-read `findings.md` for known facts
4. Reconstruct mental model using the state reconstruction algorithm
5. Confirm with user: "I've recovered from compaction. Here's where we are..."

---

## Recovery After Interruption

When the session is interrupted (platform crash, user closes window, network issue):

### Recovery Steps

```
1. Read task_plan.md → What phase? What goals?
2. Read findings.md → What facts do we know?
3. Read progress.md → What was the last action?
4. Answer the 5 Recovery Questions:
   a. Where am I?
   b. Where am I going?
   c. What's the goal?
   d. What have I learned?
   e. What have I done?
5. Write recovery state to progress.md
6. Confirm with user
```

### Recovery Message Template

```
"I've recovered from a session interruption. Here's our state:

**Phase:** [X of Y]
**Last completed:** [specific task]
**In progress:** [current task]
**Next step:** [specific action]
**Key decisions:** [list]

Does this match your understanding? Any changes since we last spoke?"
```

---

## Delegation During Long Sessions

Long sessions often require delegation. The Agent must manage subagents carefully.

### Delegation Rules for Long Sessions

| Rule | Reason |
|------|--------|
| Always pass user intent verbatim | Subagents lose context without it |
| Set explicit token budgets | Prevents runaway subagent consumption |
| Require disk output | Results survive if subagent session ends |
| Track delegation state | Know what's in flight and what's returned |
| Report back to user | Never let delegation happen in silence |

### Delegation State Tracking

In `progress.md`:

```markdown
## Active Delegations
- **Subagent 1:** [Task description]
  - Dispatched: [timestamp]
  - Budget: [tokens/turns]
  - Status: [running/complete/failed]
  - Output: [file path or "pending"]
```

### When to Delegate vs Execute

| Condition | Action |
|-----------|--------|
| Task is well-scoped and independent | Delegate |
| Task requires user judgment | Execute (stay in control) |
| Task depends on previous output | Sequential delegation |
| Multiple independent tasks | Parallel delegation |
| Task is ambiguous | Do NOT delegate — clarify first |
| Session is near budget limit | Execute directly (delegation adds overhead) |

---

## Loop Termination

The interactive loop **must terminate**. "Loop Until Done" is meaningless without a definition of "done."

### Termination Criteria

The loop terminates when **ALL** of the following are true:

| # | Criterion | How to Check |
|---|-----------|-------------|
| 1 | User's confirmed intent is fully addressed | Can point to specific deliverables that match the confirmed intent |
| 2 | All success criteria are met | User can verify "done" against the criteria defined in Phase 1 |
| 3 | All planned phases are complete | `task_plan.md` shows all phases marked as complete |
| 4 | No open blockers remain | Blockers section in `task_plan.md` is empty or all resolved |
| 5 | User has acknowledged delivery | User said "looks good", "done", "ship it", or equivalent |

### Termination Check (Run After Every Phase)

```
After each phase, evaluate:
1. Is the user's intent still being served? → If no, return to PROBE
2. Has anything changed (new constraints, new info)? → If yes, return to PROBE
3. Are we closer to the success criteria? → If no, return to PLAN
4. Are all 5 termination criteria met? → If yes, enter DELIVER phase
5. If any answer is unclear → return to PROBE
```

### DELIVER Phase Actions

When all termination criteria are met:

1. **Summarize delivery** — List what was produced, with file paths
2. **Point to outputs** — Reference specific files, commits, or artifacts
3. **Offer final adjustments** — "Want any changes before we wrap?"
4. **Write final checkpoint** — Record delivery in `progress.md`
5. **Commit if using git** — `git add . && git commit -m "delivery: <summary>"`
6. **Close the loop** — "Session complete. All criteria met."

### Forced Termination

If the session hits budget limits without meeting all criteria:

1. Save all state to disk (checkpoint)
2. Summarize what was completed vs what remains
3. Offer options:
   - Continue in a new session (state is persisted)
   - Delegate remaining work to subagents
   - Accept partial delivery
4. Write a "partial delivery" note in `progress.md` with remaining items

---

## Anti-Patterns

| Pattern | What It Looks Like | Why It Fails | Fix |
|---------|-------------------|--------------|-----|
| The Marathon Runner | 100+ turns without checkpoint | Context lost, can't recover | Checkpoint every 10 turns |
| The Budget Ignorer | No awareness of session limits | Runs out of context mid-task | Track and communicate budgets |
| The Silent Delegator | Dispatches subagents, never reports | User doesn't know what's happening | Report on dispatch and return |
| The Amnesiac | "What were we doing?" after compaction | No pre-compaction checkpoint | Always checkpoint before compaction |
| The Fatigue Denier | Keeps going when quality drops | Produces bad work | Detect fatigue, offer pause |
| The Context Hoarder | Keeps everything in memory | Memory gets compressed | Write to disk every turn |
| The Premature Wrapper | Wraps up too early | Incomplete work | Check against all 5 termination criteria |
| The Orphan Session | No recovery plan if interrupted | Can't resume after crash | Maintain recovery files |
| The Infinite Looper | Loops without checking termination | Never delivers | Run termination check after every phase |

---

## Worked Examples

### Example 1: Normal Long Session with Checkpoints

```
Turn 1-10:  Phase 1 — Probing and planning
  → Checkpoint: "Phase 1 complete. Moving to Phase 2."

Turn 11-25: Phase 2 — Execution (SKILL.md)
  → Checkpoint: "SKILL.md written (380 lines). Starting reference files."

Turn 26-40: Phase 3 — Reference files (2 of 4 complete)
  → Turn checkpoint: "We're at turn 35. 2 reference files done, 2 remaining."

Turn 41-50: Phase 3 continued
  → Budget warning: "Approaching typical session limit. 2 files left. Want to continue or pause?"

User: "Continue"

Turn 51-60: Phase 3 complete, Phase 4 — Validation
  → Checkpoint: "All files written. Running validation."

Turn 61-65: Phase 5 — Delivery
  → Termination check: All 5 criteria met
  → DELIVER: "All phases complete. Delivered SKILL.md + 4 reference files + 2 scripts."
```

### Example 2: Recovery After Crash

```
[Session restarts]

Agent: "Let me recover our state..."
  → Reads task_plan.md: "Phase 3 of 5 — writing reference files"
  → Reads findings.md: "4 reference files planned, 2 complete"
  → Reads progress.md: "Last action: wrote 02-context-preservation.md.
     Next: write 03-brainstorming-patterns.md"

Agent: "We were writing reference files for the user-intent-interactive-loop skill.
        Two of four are complete (question protocols and context preservation).
        Next up is the brainstorming patterns file. Want me to continue?"
```

### Example 3: Fatigue Detection and Response

```
Turn 45: Agent notices user giving one-word responses

Agent: "This has been a solid 45-turn session. We've completed 3 of 5 phases.
        Remaining: 2 reference files (~20 turns), validation (~5), commit (~2).

        Options:
        - Continue now (~27 more turns)
        - I delegate the reference files to a subagent and report back
        - Pause here and resume later

        What works best?"

User: "Delegate the files"

Agent: "Understood. Spinning up a subagent with full context and constraints.
        Budget: 3000 tokens. I'll report back with results."
```

### Example 4: Forced Termination at Budget Limit

```
Turn 50: Budget warning triggered

Agent: "We're at turn 50 — typical session limit. Here's our state:
        - Completed: Phases 1-3 (SKILL.md + 2 reference files)
        - Remaining: 2 reference files, validation scripts, commit
        - Estimated remaining: ~15 turns

        Options:
        - Continue now (will exceed typical session)
        - Save state and resume in a new session
        - Delegate remaining work to a subagent

        What works best?"

User: "Save state, I'll continue later"

Agent: "Saving full checkpoint to progress.md and .checkpoints/.
        All state is on disk. When you're ready, start a new session
        and I'll recover from the checkpoint."
```

---

## Cross-References

| Topic | Reference |
|-------|-----------|
| Probing intent during long sessions | `01-question-protocols.md` |
| Context preservation across interruptions | `02-context-preservation.md` |
| Brainstorming when sessions span ideation | `03-brainstorming-patterns.md` |
| Git-backed memory for session state | `gcc` skill |
| File-based planning for multi-session work | `hm-planning-persistence` skill |
| Parallel delegation patterns | `dispatching-parallel-agents` skill |

---
name: user-intent-interactive-loop
description: Use when the Agent needs to iteratively probe user intent, maintain context across long sessions, facilitate brainstorming, manage parent/child task delegation, or act as a strategist updating users throughout extended work. Triggers on: "figure out what I want", "help me think through", "keep going with this", "what should we do next", "stay focused on", "don't lose track of", "delegate this", "keep me updated", "long session", "interactive loop".
---

# user-intent-interactive-loop

Front-agent skill for iterative user engagement. The Agent stays in control, probes intent, delegates appropriately, and keeps users informed across long sessions. Deep material lives in `references/`; this body encodes the loop pattern, delegation rules, and persistence discipline.

---

## Required Skill Loads

| Purpose | Skills |
|---------|--------|
| Parallel dispatch | `dispatching-parallel-agents` |
| File-based planning | `planning-with-files` |
| Deep investigation | `deep-research` or `deep-investigation` |
| Git-backed memory | `gcc` |
| Skill creation | `skill-creator`, `writing-skills` |

---

## When to Use

| Symptom | Route |
|---------|-------|
| User's request is vague or underspecified | → `references/01-question-protocols.md` |
| Session spans many turns, context drifting | → `references/02-context-preservation.md` |
| User wants to explore ideas, not just execute | → `references/03-brainstorming-patterns.md` |
| Session exceeds 50+ turns or hits compaction | → `references/04-long-session-management.md` |
| Need to decide: execute vs delegate vs clarify | → Core Pattern below |
| User says "keep going" or "stay on track" | → This skill, full loop |

---

## Core Pattern: The Interactive Loop

```
PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → REPEAT
```

### Phase 1: PROBE — Extract Intent

Ask targeted questions. Never overwhelm. One question per turn unless the user invites more.

| Question Type | Purpose | Example |
|---------------|---------|---------|
| Scope boundary | Define what's in/out | "Should this include X, or focus only on Y?" |
| Success criteria | Define done | "What does 'working' look like for this?" |
| Constraint check | Surface limits | "Any deadlines, tech constraints, or preferences?" |
| Priority signal | Rank importance | "Is speed or correctness the priority here?" |
| Delegation appetite | Gauge trust level | "Should I handle this directly or spin up a subagent?" |

**Stop probing when:** The Agent can articulate the user's intent back and the user confirms.

→ Full protocols: `references/01-question-protocols.md`

### Phase 2: UNDERSTAND — Synthesize and Confirm

Restate the intent in the Agent's own words. Include:
- What the user wants (outcome)
- What constraints exist (boundaries)
- What success looks like (criteria)
- What the Agent will do next (action)

**Example:**
> "So you want a skill that manages iterative user engagement — it should probe intent, delegate tasks, and persist context across long sessions. Constraints: under 500 lines, universal terminology, reference files for depth. I'll start with the SKILL.md structure, then fill references. Correct?"

### Phase 3: PLAN — Structure the Work

Break into discrete, verifiable tasks. Use `planning-with-files` for multi-session work.

| Task Granularity | When |
|------------------|------|
| Single file change | Execute directly |
| 2-5 related changes | Execute with checkpoints |
| 6+ changes or cross-cutting | Delegate to subagent |
| Unknown scope | Probe more, then decide |

### Phase 4: DELEGATE — Hand Off or Stay

| Condition | Action |
|-----------|--------|
| Task is well-scoped, independent | Dispatch subagent with full context |
| Task requires user judgment | Stay in control, ask user |
| Task depends on previous output | Sequential dispatch |
| Multiple independent tasks | Parallel dispatch (`dispatching-parallel-agents`) |
| Task is ambiguous | Do NOT delegate — clarify first |

**Delegation rules:**
- Always pass the user's original intent verbatim
- Include constraints and success criteria
- Require the subagent to write outputs to disk
- Set a budget (token limit or turn limit)

→ Delegation patterns: `dispatching-parallel-agents`

### Phase 5: UPDATE — Keep User Informed

| Event | Update Type |
|-------|-------------|
| Phase complete | Brief summary + next step |
| Blocker found | Problem + options + recommendation |
| Delegation dispatched | "Spinning up subagent for X, will report back" |
| Session checkpoint | "Saved state to disk. We're at step N of M." |
| User asks for status | Full progress report |

**Update discipline:**
- Be specific, not vague ("Fixed the parser" not "Made progress")
- Include what changed, not just what happened
- Offer options when blocked, don't just report problems
- Never update more than once per turn unless asked

### Phase 6: REPEAT — Loop Until Done

After each phase, check:
1. Is the user's intent still being served?
2. Has anything changed (new constraints, new info)?
3. Are we closer to the success criteria?
4. Should we delegate, execute, or probe more?

If any answer is unclear → return to PROBE.

---

## Hierarchy Awareness

The Agent must understand its position in the task hierarchy:

| Role | Responsibility |
|------|----------------|
| Front Agent | Owns user relationship, controls delegation, maintains context |
| Parent Agent | Manages child sessions, enforces budgets, aggregates results |
| Child Agent | Executes scoped task, writes output to disk, reports back |

**Key rule:** The Front Agent never fully delegates the user relationship. It delegates tasks, not trust.

---

## Session Persistence Protocol

Context is lost between turns by default. The only defense is write-to-disk.

| What to Persist | Where | When |
|-----------------|-------|------|
| User's stated intent | `progress.md` or session notes | Every confirmation |
| Current phase + step | `task_plan.md` | Every phase change |
| Decisions made | `progress.md` | Every decision |
| Discovered facts | `findings.md` | Every 2-3 discoveries |
| Delegation state | `progress.md` | Every dispatch/return |

**Recovery rule:** On session restart, read `task_plan.md` first, then `findings.md`, then `progress.md`. Reconstruct state from disk, not from memory.

→ Full persistence: `references/02-context-preservation.md`, `references/04-long-session-management.md`

---

## Quick Reference: Decision Matrix

| Situation | Probe? | Plan? | Delegate? | Update? |
|-----------|--------|-------|-----------|---------|
| Vague request | ✅ First | After | ❌ | After confirm |
| Clear task, small scope | ❌ | Mental | ❌ | On complete |
| Clear task, large scope | ❌ | ✅ Written | ✅ | On dispatch + complete |
| Blocked | ✅ Root cause | ✅ Options | Maybe | Immediately |
| User checks in | ❌ | ❌ | ❌ | ✅ Full report |
| Session restart | ✅ Re-confirm | ✅ Re-read | After | On recovery |

---

## Anti-Patterns

1. **The Interrogator** — Asking 5+ questions in one turn. One per turn unless invited.
2. **The Yes-Agent** — Accepting vague requests without probing. Always clarify before acting.
3. **The Abandoner** — Delegating and disappearing. Always report back with results.
4. **The Amnesiac** — Losing context between turns. Write to disk every turn.
5. **The Micromanager** — Refusing to delegate well-scoped tasks. Trust subagents with clear specs.
6. **The Silent Worker** — Executing for 20 turns without updates. Update at phase boundaries.
7. **The Scope Creep** — Adding features the user didn't ask for. Stay within confirmed intent.
8. **The Orphan Dispatcher** — Sending subagents without context or success criteria.
9. **The Context Hoarder** — Keeping everything in memory instead of writing to disk.
10. **The Premature Executor** — Acting before understanding. Probe first, always.

---

## Good vs Bad Usage

### Good: Iterative Probing
```
User: "I want to improve the skill system"
Agent: "What aspect — creation, discovery, quality, or something else?"
User: "Quality"
Agent: "Got it. Should I audit existing skills for gaps, or build a quality framework from scratch?"
```

### Bad: The Interrogator
```
User: "I want to improve the skill system"
Agent: "What aspect? What's the priority? Any deadlines? Which skills? What format?
        Should I audit or build? Who's the audience? Any constraints?"
```

### Good: Delegation with Context
```
Agent: "I'll spin up a subagent to audit the 5 existing skills against the quality matrix.
        It will write findings to disk and report back. Budget: 2000 tokens."
```

### Bad: The Abandoner
```
Agent: "Delegating to subagent."
[10 turns of silence]
```

### Good: Strategic Positioning
```
Agent: "We've completed 3 of 5 phases. Current blocker: the quality matrix needs
        a scoring rubric. Options: (1) I draft one now, (2) delegate to a subagent
        with examples, (3) pause for your input. I recommend option 1 — it's quick
        and you can review."
```

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `planning-with-files` | Use for multi-session planning. This skill decides WHEN to use it. |
| `dispatching-parallel-agents` | Use for parallel task execution. This skill decides WHAT to parallelize. |
| `deep-research` / `deep-investigation` | Use for deep topic exploration. This skill decides WHEN depth is needed. |
| `gcc` | Use for git-backed memory. This skill decides WHAT to persist. |
| `coordinating-loop` | Sibling skill in GROUP 1. Handles orchestration patterns; this skill handles user engagement. |

---

## Reference Map

| File | Purpose |
|------|---------|
| `references/01-question-protocols.md` | How to probe user intent effectively — question types, sequencing, stop conditions |
| `references/02-context-preservation.md` | Maintaining awareness across sessions — persistence, recovery, compaction handling |
| `references/03-brainstorming-patterns.md` | Facilitating ideation — divergence/convergence, option generation, decision frameworks |
| `references/04-long-session-management.md` | Persisting through extended sessions — budget management, checkpoint strategy, fatigue detection |

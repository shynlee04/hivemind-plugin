# Parent-Child Agent Cycles

Managing nested agent lifecycles: creation, monitoring, failure handling, and result aggregation.

---

## The Parent-Child Model

The parent Agent is the **strategist and coordinator**. Child Agents are **specialized executors**.

```
┌─────────────────────────────────────────┐
│           Parent Agent                  │
│  - Holds full session context           │
│  - Makes coordination decisions         │
│  - Monitors child progress              │
│  - Integrates results                   │
│  - Preserves context for next cycle     │
└──────────┬──────────────┬───────────────┘
           │              │
    ┌──────▼──────┐ ┌─────▼──────┐
    │ Child A     │ │ Child B    │
    │ Isolated    │ │ Isolated   │
    │ Focused     │ │ Focused    │
    │ No history  │ │ No history │
    └─────────────┘ └────────────┘
```

**Critical rule:** Child Agents must NOT inherit the parent's session history. The parent constructs exactly what each child needs — nothing more, nothing less.

---

## Child Agent Lifecycle

### Phase 1: Creation

The parent Agent creates a child with:

1. **Task Envelope** — See `references/01-handoff-protocols.md` for the full format.
2. **Isolated context** — Only the information needed for this specific task.
3. **Scope boundaries** — Explicit include/exclude lists.
4. **Expected output format** — What the child should return.
5. **Verification step** — What gate the child must pass before returning.

### Filled-In Prompt Template

Here is a complete, filled-in prompt for a child Agent. Replace the bracketed sections with your specific values:

```markdown
You are a specialized Agent tasked with: Writing the SKILL.md file for a new "deep-research" skill

## Context
The skill lives at .opencode/skills/deep-research/SKILL.md. It must have YAML frontmatter
with name, description, and metadata fields. The body should contain procedural guidance
for conducting research. The skill should be 300+ lines.

Existing skill patterns to follow:
- .opencode/skills/use-authoring-skills/SKILL.md (structure reference)
- .opencode/skills/skill-creator/SKILL.md (frontmatter reference)

## Scope
- Work on: .opencode/skills/deep-research/SKILL.md only
- Do NOT touch: Any other files in the repository

## Expected Output
- A complete SKILL.md file with valid frontmatter and procedural body content
- Summary of sections created and line count

## Verification
- Run: head -5 .opencode/skills/deep-research/SKILL.md — confirm frontmatter opens with ---
- Run: wc -l .opencode/skills/deep-research/SKILL.md — confirm >300 lines

## Constraints
- Do NOT modify files outside scope
- Do NOT introduce new dependencies
- Return summary even if task cannot be completed
```

### Context Filtering Guide

When constructing a child Agent's context, apply these rules systematically:

| Include | Exclude | Reason |
|---------|---------|--------|
| File paths the child will modify | Full session history | History dilutes focus |
| Error messages or failure output | Unrelated test failures | Noise distracts from signal |
| Relevant code snippets (max 50 lines) | Design debates or alternatives | Child needs facts, not opinions |
| Expected output format | Internal coordination decisions | Child doesn't need parent's planning |
| Verification commands | Speculative hypotheses | Child needs concrete checks |
| Existing patterns to follow (1-2 examples) | Other skills' internal content | Irrelevant to child's task |

**Context size rule:** If the context section of your Task Envelope exceeds 500 characters, you are including too much. Trim to the minimum information the child needs to start.

**Rule of thumb:** If the child does not need a piece of information to complete its task, do not include it.

---

### Phase 2: Monitoring

The parent Agent tracks child progress:

| What to Monitor | How | Action if Problem |
|----------------|-----|-------------------|
| Completion status | Child returns output | If no output, check for errors |
| Scope adherence | Review changes made | If out-of-scope changes, revert and re-dispatch |
| Verification pass | Child ran the gate step | If gate failed, do not accept output |
| Time elapsed | Wall clock or token budget | If exceeded, halt and assess |
| Error state | Child reports errors | Classify: retryable vs escalate |

**Monitoring rule:** The parent does NOT micromanage. It checks at defined gates, not continuously.

### Phase 3: Integration

When a child returns:

1. **Read the summary** — What did the child do?
2. **Verify the gate** — Did the child pass its verification step?
3. **Check scope** — Did the child stay within boundaries? Run `git diff --name-only` and compare against the scope in the Task Envelope.
4. **Review changes** — Spot-check critical modifications.
5. **Record result** — Write to disk with timestamp and outcome.

### Phase 4: Aggregation

After all children return:

1. **Collect all outputs** — Read each child's summary and changes.
2. **Check for conflicts** — Did any children modify overlapping code?
3. **Run full validation** — Execute the complete test suite or validation gate.
4. **Write integration report** — Document what passed, what failed, what needs follow-up.

---

## Error Recovery

### Retryable Failures

A failure is **retryable** if:

- The child had insufficient context (missing file, unclear instructions).
- The child encountered a transient errors (timeout, resource unavailable).
- The child's approach was correct but implementation had a bug.

**Retry protocol:**
1. **Diagnose** — Why did the child fail? Be specific.
2. **Augment** — Add missing context or clarify instructions.
3. **Re-dispatch** — Send to a new child Agent (not the same one).
4. **Max 1 retry** — If the retry fails, escalate to the user.

### Escalation

A failure requires **escalation** if:

- The task is fundamentally unclear or underspecified.
- The child's approach was wrong and the parent cannot determine the right approach.
- The retry also failed.
- The task requires human judgment (design decisions, trade-offs).

**Escalation protocol:**
1. **Stop** all related child agents.
2. **Collect** all outputs and error messages.
3. **Summarize** — What was attempted, what failed, why.
4. **Present to user** — With options for how to proceed.
5. **Wait for direction** — Do not guess.

---

## Budget Enforcement

The parent Agent enforces budgets on child agents:

| Budget Type | Default | Enforcement |
|-------------|---------|-------------|
| Token budget | Inherited from session | Track usage, halt if exceeded |
| File scope | Explicit include list | Reject changes outside scope |
| Time budget | Task-dependent | Monitor wall clock, alert if exceeded |
| Retry count | 1 | No more than 1 retry per task |
| Dependency count | 0 new dependencies | Reject any new imports or packages |

---

## Context Preservation

The parent Agent must preserve its own context throughout the cycle:

1. **Write state to disk** before dispatching children — `progress.md` with current phase.
2. **Do NOT absorb child context** — Read child outputs but don't let them replace parent's understanding.
3. **Maintain decision log** — Record why each child was dispatched and what was expected.
4. **Recovery handle** — If the parent's session is interrupted, it can resume from the last written state.

**Recovery rule:** If the parent Agent loses context, it reads `progress.md` and any child output files to reconstruct state. It does NOT rely on session memory.

---

## Anti-Patterns

| Anti-Pattern | What It Looks Like | Consequence | Fix |
|-------------|-------------------|-------------|-----|
| The Helicopter Parent | Parent micromanages every child step | Wastes parent context, slows children | Define gates, check at gates only |
| The Absentee Parent | Parent dispatchs and forgets | Children go off-scope, no integration | Monitor at defined gates |
| The Context Dump | Parent sends full session to child | Child loses focus, hallucinates | Construct focused prompts |
| The Inheritance | Child inherits parent's full history | Context pollution, scope creep | Isolate child context |
| The Silent Death | Child fails but parent doesn't notice | Work is lost, gates fail downstream | Require confirmation and verification |
| The Infinite Retry | Parent keeps retrying the same approach | Wastes tokens, never progresses | Max 1 retry, then escalate |

---

## Cross-References

- `references/01-handoff-protocols.md` — Task Envelope format for child creation
- `references/02-sequential-vs-parallel.md` — When to dispatch children in parallel vs sequence
- `references/04-ralph-loop-integration.md` — How parent-child cycles integrate with ralph-loop
- `dispatching-parallel-agents` skill — Underlying pattern for parallel child dispatch

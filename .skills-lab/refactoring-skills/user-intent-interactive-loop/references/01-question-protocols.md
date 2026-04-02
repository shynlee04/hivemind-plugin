# Question Protocols

**Purpose:** How the Agent probes user intent effectively without overwhelming.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Question Taxonomy](#question-taxonomy)
3. [Sequencing Rules](#sequencing-rules)
4. [Stop Conditions](#stop-conditions)
5. [Adaptive Probing](#adaptive-probing)
6. [Anti-Patterns](#anti-patterns)
7. [Worked Examples](#worked-examples)
8. [Cross-References](#cross-references)

---

## Core Principle

**One question per turn unless the user invites more.** The goal is convergence, not interrogation. Each question should eliminate at least one ambiguity or confirm one assumption.

The Agent probes because:
- Users rarely state their full intent in the first message
- Assumptions left unchecked cause wasted work
- Clarification upfront saves rework downstream
- The Agent owns the user relationship — it cannot delegate understanding

---

## Question Taxonomy

### Type 1: Scope Boundary

**Purpose:** Define what's in and what's out.

| Pattern | Example |
|---------|---------|
| Inclusion check | "Should this include X, or focus only on Y?" |
| Exclusion check | "Anything explicitly out of scope?" |
| Boundary test | "If we delivered X but not Y, would that be useful?" |

**When to use:** First or second turn. Before any planning.

### Type 2: Success Criteria

**Purpose:** Define what "done" looks like.

| Pattern | Example |
|---------|---------|
| Outcome description | "What does 'working' look like for this?" |
| Acceptance test | "How would you verify this is correct?" |
| Minimum viable | "What's the smallest version that would still be useful?" |

**When to use:** After scope is roughly understood. Before execution.

### Type 3: Constraint Check

**Purpose:** Surface limits that affect approach.

| Pattern | Example |
|---------|---------|
| Time constraint | "Any deadline I should optimize for?" |
| Tech constraint | "Any frameworks, languages, or tools I should avoid or prefer?" |
| Quality constraint | "Is speed or correctness the priority?" |
| Resource constraint | "Any budget limits for subagent delegation?" |

**When to use:** After success criteria. Before choosing an approach.

### Type 4: Priority Signal

**Purpose:** Rank competing concerns.

| Pattern | Example |
|---------|---------|
| Trade-off probe | "If you had to pick one: speed, quality, or completeness?" |
| Phase priority | "Should I tackle the hardest part first or build incrementally?" |
| Risk tolerance | "Are you comfortable with experimental approaches, or prefer proven patterns?" |

**When to use:** When multiple valid approaches exist.

### Type 5: Delegation Appetite

**Purpose:** Gauge how much the user trusts the Agent to work independently.

| Pattern | Example |
|---------|---------|
| Directness check | "Should I handle this directly or spin up a subagent?" |
| Review frequency | "Do you want updates at each step, or just when it's done?" |
| Autonomy level | "Should I make judgment calls on details, or check with you first?" |

**When to use:** Before any delegation decision. Re-check if the user seems disengaged or overly involved.

### Type 6: Intent Confirmation

**Purpose:** Verify the Agent's understanding matches the user's intent.

| Pattern | Example |
|---------|---------|
| Restatement | "So you want X, constrained by Y, with Z as success. Correct?" |
| Gap check | "Did I miss anything important?" |
| Assumption callout | "I'm assuming X — is that right, or should I adjust?" |

**When to use:** After all probing, before any execution or delegation.

---

## Sequencing Rules

Questions must follow a logical order. Wrong sequencing confuses users and wastes turns.

```
Turn 1:  Scope boundary (what are we building?)
Turn 2:  Success criteria (how do we know it's done?)
Turn 3:  Constraint check (what limits our approach?)
Turn 4:  Priority signal (what matters most?)
Turn 5:  Delegation appetite (how should I work?)
Turn 6:  Intent confirmation (did I understand correctly?)
```

**Compression rule:** If the user's initial message already answers a question type, skip it. Don't ask what's already answered.

**Expansion rule:** If a single answer opens new ambiguities, insert a follow-up question of the appropriate type before continuing the sequence.

---

## Stop Conditions

The Agent stops probing when ALL of the following are true:

| Condition | Check |
|-----------|-------|
| Scope is bounded | Can describe what's in and out |
| Success is defined | Can describe what "done" looks like |
| Constraints are known | Can list active constraints |
| Priority is set | Can rank competing concerns |
| Delegation level is set | Knows how much autonomy to use |
| User has confirmed | User said "yes", "correct", or equivalent |

**If any condition is false → continue probing.**

**Emergency stop:** If the user says "just start" or "figure it out," proceed with best judgment but:
1. State your assumptions explicitly
2. Build the smallest increment first
3. Show results early and often
4. Be ready to pivot if assumptions were wrong

---

## Adaptive Probing

Not all users need the same depth. The Agent adapts based on signals.

### Signal: User Provides Detail

If the user's message is detailed and specific:
- Skip scope and constraint questions
- Jump to success criteria and delegation appetite
- Confirm understanding in one turn

### Signal: User Is Vague

If the user's message is short or abstract:
- Start with scope boundary
- Use concrete examples in questions ("Do you mean X like [example], or Y like [example]?")
- Expect 4-6 turns of probing

### Signal: User Changes Direction

If the user pivots mid-session:
- Acknowledge the change explicitly
- Re-run the relevant question types (usually scope + success)
- Update any persisted state (`progress.md`, `task_plan.md`)
- Don't assume old constraints still apply

### Signal: User Is Impatient

If the user pushes back on questions:
- Compress to one confirmation question
- State assumptions and proceed
- Show a small result quickly
- Offer to adjust based on feedback

---

## Anti-Patterns

| Pattern | What It Looks Like | Why It Fails | Fix |
|---------|-------------------|--------------|-----|
| The Interrogator | 5+ questions in one turn | Overwhelms user, causes shallow answers | One question per turn |
| The Assumer | Acts without confirming | Builds the wrong thing | Always confirm before executing |
| The Repeater | Asks what the user already said | Wastes turns, frustrates user | Read the message carefully before asking |
| The Abstractor | Uses vague questions ("What do you want?") | User can't answer concretely | Use specific examples in questions |
| The Premature Planner | Plans before understanding | Plans are wrong, must be redone | Probe first, plan second |
| The Silent Guesser | Makes assumptions silently | User can't correct what they can't see | State assumptions explicitly |

---

## Worked Examples

### Example 1: Vague Request (Full Sequence)

```
User: "I want to improve our testing"

Agent: "What aspect — unit tests, integration tests, E2E, or the testing process itself?"
  → Type 1: Scope boundary

User: "Unit tests. Our coverage is low."

Agent: "What coverage target would make you confident? And should I focus on new code or existing gaps?"
  → Type 2: Success criteria + Type 4: Priority

User: "80% overall. Focus on the core library first."

Agent: "Got it. 80% coverage on the core library. Any frameworks I should use, or stick with what's already in place?"
  → Type 3: Constraint check

User: "Same framework, Vitest."

Agent: "Should I write tests and commit them directly, or create a plan first for your review?"
  → Type 5: Delegation appetite

User: "Plan first."

Agent: "Understood. I'll audit the core library, identify the biggest coverage gaps, and present a prioritized test plan. I'll write findings to disk so we can resume if needed. Starting now."
  → Type 6: Intent confirmation + action statement
```

### Example 2: Detailed Request (Compressed)

```
User: "Add a circuit breaker to the session API. It should trip after 5 consecutive failures,
       reset after 30 seconds, and log each state change. Use the existing logger."

Agent: "So: circuit breaker on session API, 5-failure threshold, 30s reset, log state changes,
        use existing logger. I'll implement directly and show you the diff. Correct?"
  → Compressed: scope, success, constraints all answered. Only confirmation needed.

User: "Yes."

Agent: "Starting implementation."
```

### Example 3: Direction Change

```
User: "Build a dashboard for the metrics"

Agent: "What metrics — performance, usage, errors, or all of them?"

User: "Actually, forget the dashboard. I need a CLI tool to export the data instead."

Agent: "Got it — pivoting from dashboard to CLI export. What format should the export be? CSV, JSON, or something else?"
  → Acknowledged change, re-probing scope

User: "CSV is fine."

Agent: "CSV export via CLI. Any specific fields, or all available metrics?"
  → Continuing probe on new scope
```

---

## Cross-References

| Topic | Reference |
|-------|-----------|
| Context preservation across probing turns | `02-context-preservation.md` |
| Brainstorming when user wants exploration, not answers | `03-brainstorming-patterns.md` |
| Managing long probing sessions | `04-long-session-management.md` |
| Planning after probing is complete | `planning-with-files` skill |
| Deciding what to delegate after understanding | `dispatching-parallel-agents` skill |

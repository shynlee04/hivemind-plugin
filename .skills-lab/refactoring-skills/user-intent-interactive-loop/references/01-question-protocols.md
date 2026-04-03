# Question Protocols

**Purpose:** How the Agent probes user intent effectively without overwhelming. Includes skill-creation-specific examples.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Question Taxonomy](#question-taxonomy)
3. [Skill-Creation Question Selection](#skill-creation-question-selection)
4. [Sequencing Rules](#sequencing-rules)
5. [Stop Conditions](#stop-conditions)
6. [Adaptive Probing](#adaptive-probing)
7. [Anti-Patterns](#anti-patterns)
8. [Worked Examples](#worked-examples)
9. [Cross-References](#cross-references)

---

## Core Principle

**One question per turn unless the user invites more. Maximum 3 questions per turn via OpenCode question tool.** The goal is convergence, not interrogation. Each question should eliminate at least one ambiguity or confirm one assumption.

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

## Skill-Creation Question Selection

When the user's request involves creating, cloning, or converting skills, use this domain-specific question selection instead of the generic sequence.

### Scenario: "I want to create a skill"

| Turn | Question Type | Example Question |
|------|--------------|-----------------|
| 1 | Scope boundary | "What should this skill do? What triggers it?" |
| 2 | Success criteria | "What does a good version look like — line count, trigger accuracy, reference depth?" |
| 3 | Constraint check | "Are there existing skills this should reference or avoid overlapping with?" |

### Scenario: "Clone this pattern into a skill"

| Turn | Question Type | Example Question |
|------|--------------|-----------------|
| 1 | Constraint check | "Should it follow the exact structure of the source, or adapt it for a different purpose?" |
| 2 | Scope boundary | "What parts of the source pattern are essential vs optional?" |
| 3 | Delegation appetite | "Should I clone it directly or analyze the pattern first and propose improvements?" |

### Scenario: "Turn this document into a skill"

| Turn | Question Type | Example Question |
|------|--------------|-----------------|
| 1 | Success criteria | "What's the core behavior? What should the Agent do when this skill activates?" |
| 2 | Scope boundary | "Should this be a single SKILL.md or split into references for progressive disclosure?" |
| 3 | Constraint check | "Any naming conventions, file structure rules, or platform requirements to follow?" |

### Scenario: "Improve this skill"

| Turn | Question Type | Example Question |
|------|--------------|-----------------|
| 1 | Scope boundary | "What aspect — description, references, scripts, or the whole pack?" |
| 2 | Priority signal | "Is trigger accuracy, content quality, or structural cleanup the priority?" |
| 3 | Constraint check | "Should I preserve the existing structure or is a rebuild acceptable?" |

### Scenario: "I need help figuring out..."

| Turn | Question Type | Example Question |
|------|--------------|-----------------|
| 1 | Scope boundary | "What domain are we in — code, skills, config, or something else?" |
| 2 | Success criteria | "What would a useful answer look like?" |
| 3 | Delegation appetite | "Should I investigate directly or spin up a research subagent?" |

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

**Max 3 questions per turn:** If multiple question types are needed in one turn, combine them into at most 3 questions. Use the OpenCode `question` tool.

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
| The Interrogator | 4+ questions in one turn | Overwhelms user, causes shallow answers | Max 3 questions per turn |
| The Assumer | Acts without confirming | Builds the wrong thing | Always confirm before executing |
| The Repeater | Asks what the user already said | Wastes turns, frustrates user | Read the message carefully before asking |
| The Abstractor | Uses vague questions ("What do you want?") | User can't answer concretely | Use specific examples in questions |
| The Premature Planner | Plans before understanding | Plans are wrong, must be redone | Probe first, plan second |
| The Silent Guesser | Makes assumptions silently | User can't correct what they can't see | State assumptions explicitly |
| The Generic Prober | Uses the same questions for skill creation as for debugging | Misses domain-specific concerns | Use skill-creation question selection table |

---

## Worked Examples

### Example 1: Skill Creation (Full Sequence)

```
User: "I want to create a skill for code review"

Agent: [PROBE — Turn 1, Scope boundary]
  question("Should this skill cover just code review, or also include
            security auditing and performance analysis?")

User: "Just code review for now"

Agent: [PROBE — Turn 2, Success criteria]
  question("What does a good code review skill look like to you —
            should it check for specific patterns, or give general guidance?")

User: "Specific patterns — security, performance, and style"

Agent: [PROBE — Turn 3, Constraint check]
  question("Any existing review skills or configs this should reference
            or avoid overlapping with?")

User: "No, this should be standalone"

Agent: [UNDERSTAND]
  "So: a standalone code review skill covering security, performance, and style
   patterns. I'll draft the SKILL.md with reference files for each pattern category.
   Should I write it directly or dispatch a writer subagent?"

User: "Write it directly"

Agent: [PLAN → EXECUTE]
  "Starting with SKILL.md structure."
```

### Example 2: Clone Pattern (Compressed)

```
User: "Clone the deep-research pattern into a new skill for API analysis"

Agent: [PROBE — Turn 1, Constraint check]
  question("Should it follow the exact SKILL.md + references structure of the
            deep-research skill, or adapt it for API-specific workflows?")

User: "Adapt it — API analysis needs different reference files"

Agent: [UNDERSTAND]
  "Got it — same structural pattern as deep-research, but with API-specific
   references. I'll audit the source structure, then create the adapted version.
   Correct?"

User: "Yes"

Agent: [PLAN → DELEGATE]
  "Spinning up a writer subagent with the source pattern and API context."
```

### Example 3: Document to Skill

```
User: "Turn this architecture doc into a skill"

Agent: [PROBE — Turn 1, Success criteria]
  question("What should the Agent do when this skill activates — explain the
            architecture, enforce it, or both?")

User: "Enforce it — make sure new code follows the architecture"

Agent: [PROBE — Turn 2, Scope boundary]
  question("Should this be a single SKILL.md with rules, or split into
            references for each architectural layer?"

User: "Split it — we have 4 layers"

Agent: [UNDERSTAND]
  "So: an enforcement skill with SKILL.md as the entry point and 4 reference
   files, one per architectural layer. I'll extract the rules from the doc
   and structure them. Correct?"

User: "Yes"

Agent: [PLAN → EXECUTE]
  "Extracting architectural rules from the document."
```

### Example 4: Direction Change

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

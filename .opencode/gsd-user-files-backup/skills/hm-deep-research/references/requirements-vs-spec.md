# Requirements vs. Spec

Research has boundaries. Cross them and you change the nature of your work. This reference teaches you to detect those boundaries and handle transitions correctly.

---

## The Three Phases

| Phase | Mindset | Question | Output | Duration |
|-------|---------|----------|--------|----------|
| **Research** | "What's possible?" | Open-ended, divergent | Findings, options, tradeoffs | Unbounded |
| **Requirements** | "What do we need?" | Convergent, measurable | Needs, constraints, priorities | 1-2 sessions |
| **Specification** | "How do we build it?" | Precise, testable | Interfaces, models, test cases | Per feature |

### The Natural Flow

```
RESEARCH ──────────────> REQUIREMENTS ──────────────> SPECIFICATION
"What's out there?"       "What do we need?"           "How do we build it?"
findings → options        needs → constraints          interfaces → test cases

DIVERGENT                 CONVERGENT                   PRECISE
(expand possibilities)    (narrow to decisions)        (define exactly)
```

### The Boundary Signals

You have crossed from Research into Requirements when:
- You stop asking "what else exists?" and start asking "which one fits?"
- You start listing constraints ("must support TypeScript", "needs to handle 10k RPS")
- You use the word "should" instead of "they offer"

You have crossed from Requirements into Spec when:
- You start defining function signatures
- You list acceptance criteria
- You describe data models with specific field types

---

## Case Study: ORM Selection

### Research Phase

**Question**: "What ORM options exist for TypeScript projects in 2026?"

**Output**: Comparison table of Prisma, Drizzle, Kysely, TypeORM, MikroORM

| Finding | Source |
|---------|--------|
| Prisma: schema-first, generated client, strong migrations | Context7 + official docs |
| Drizzle: SQL-like, type-inferred, lightweight | Context7 + GitHub README |
| Kysely: query builder, no magic, close to SQL | DeepWiki + community benchmarks |
| TypeORM: decorator-based, Active Record pattern | Context7 (older docs) |
| MikroORM: decorator-based, Data Mapper pattern | Context7 + GitHub stars trending |

**Status**: Research complete. All major options cataloged.

### Requirements Phase

**Question**: "What do we need from our ORM?"

| Requirement | Priority | Must-Have |
|------------|----------|-----------|
| TypeScript-first | High | Yes |
| Migration tooling | High | Yes |
| Serverless-compatible (cold starts) | High | Yes |
| Raw SQL escape hatch | Medium | Preferred |
| Community size > 5k stars | Medium | No |
| Learning curve < 2 days | Low | No |

**Status**: Requirements defined. Now evaluate options against them.

### Specification Phase

**Question**: "How do we integrate Drizzle into our project?"

**Output**: 
- Schema file structure
- Migration workflow
- Query patterns
- Error handling approach
- Connection pooling config

**Status**: Spec complete. Ready for implementation.

---

## Handling Premature Specification

The most common failure mode: jumping to spec during research.

### Detection Signals

| Signal | You Are In | Should Be In |
|--------|-----------|-------------|
| "The function signature should be..." | Spec | Research |
| "We need to support X, Y, Z" | Requirements | Research |
| "Let me design the data model" | Spec | Research |
| "What other options exist?" | Research | Correct |
| "Which of these fits our constraints?" | Requirements | Correct |

### Recovery Protocol

```
1. STOP whatever you are writing
2. IDENTIFY what triggered the jump:
   - Did the user ask for a design?
   - Did you assume a specific solution?
   - Did you run out of options to explore?
3. CLASSIFY where you actually are:
   - If you haven't finished exploring options → back to Research
   - If you have options but no constraints → move to Requirements
   - If you have constraints and a chosen option → Spec is appropriate
4. WRITE the boundary:
   - "Research phase complete: [summary of findings]"
   - "Requirements phase starting: [what we need]"
   - "Specification phase starting: [what we're building]"
5. PROCEED in the correct phase
```

---

## The Transition Template

When moving from Research to Requirements, produce this artifact:

```markdown
# Research → Requirements Transition

## Research Summary
- Question: [original research question]
- Options investigated: [list]
- Key findings: [3-5 bullet points]
- Gaps remaining: [what you couldn't answer]

## Requirements Definition
- Must-have constraints: [list]
- Preferred constraints: [list]
- Nice-to-have constraints: [list]

## Option Evaluation
| Requirement | Option A | Option B | Option C |
|------------|----------|----------|----------|
| [Must-have 1] | Pass/Fail | Pass/Fail | Pass/Fail |
| [Must-have 2] | Pass/Fail | Pass/Fail | Pass/Fail |
| [Preferred 1] | Strong/Weak/Missing | ... | ... |

## Recommendation
- Chosen: [option]
- Reason: [why, linked to specific requirements]
- Risks: [what could go wrong]
- Trigger for re-evaluation: [what would change this decision]
```

When moving from Requirements to Spec, produce this artifact:

```markdown
# Requirements → Specification Transition

## Requirements Summary
- Must-haves: [list with acceptance criteria]
- Preferred: [list]
- Out of scope: [explicitly excluded]

## Specification
- Interfaces: [function signatures, type definitions]
- Data model: [schemas, relationships]
- Error handling: [error types, recovery strategies]
- Test cases: [acceptance tests derived from requirements]

## Validation
- Every requirement maps to at least one spec element: [matrix]
- Every spec element traces to at least one requirement: [matrix]
```

---

## Anti-Patterns

| Anti-Pattern | What Happens | Fix |
|-------------|-------------|-----|
| **Spec-first research** | Design before understanding options | Write research question first, find 3+ options before designing |
| **Analysis paralysis** | Never leaving research phase | Set time box, produce findings at deadline regardless of completeness |
| **Requirements by assumption** | Stating needs without evidence | Every requirement must reference a finding or a constraint |
| **Spec creep** | Spec keeps expanding during implementation | Lock spec, track changes as separate requirements |
| **Research without requirements** | Exploring without knowing what you need | Define at least 2 constraints before starting research |

---

## Quick Decision: Am I In The Right Phase?

```
What am I doing right now?

+-- Listing options and their features
|   → RESEARCH (correct)
|
+-- Evaluating options against constraints
|   → REQUIREMENTS (correct)
|
+-- Defining interfaces or data models
|   → SPECIFICATION (correct IF requirements are defined)
|   → SPECIFICATION (wrong IF requirements are NOT defined — go back)
|
+-- Looking for more options
|   → RESEARCH (correct IF not all options found)
|   → RESEARCH (wrong IF you already have 3+ viable options — move to Requirements)
|
+-- Unsure
|   → Ask: "Do I have at least 3 options?" If no → Research
|   → Ask: "Do I have at least 2 constraints?" If no → Requirements  
|   → Ask: "Do I have a chosen option?" If no → Requirements
|   → If yes to all → Specification
```

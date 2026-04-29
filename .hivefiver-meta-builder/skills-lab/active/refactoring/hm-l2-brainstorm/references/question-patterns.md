# Question Patterns for Requirements Surfacing

Structured questioning techniques for bridging vague user intent to concrete requirements. These patterns are loadable during Phase 1 of the brainstorming workflow.

## Core Principle: One Question at a Time

Every question must be self-contained in a single message. Never combine multiple questions. If a topic requires exploration across multiple dimensions, break it into separate sequential questions.

## Question Priority Order

Follow this order by default. Skip categories already answered by the user's initial request.

| Order | Category | Purpose | Max Questions |
|-------|----------|---------|---------------|
| 1 | Purpose & Problem | What gap does this fill? | 1 |
| 2 | Users & Stakeholders | Who benefits and how? | 1 |
| 3 | Constraints & Boundaries | What limits exist? | 1 |
| 4 | Success Criteria | How do we know it's done? | 1 |
| 5 | Scope Boundaries | What is explicitly excluded? | 1 |

**Total cap: 5 questions maximum per session.**

## Pattern 1: Multiple Choice Narrowing

Use when the answer space has a small set of natural options. This reduces cognitive load on the user and prevents open-ended stalls.

**Structure:**
```
[Question stem]?
(a) [Option A — concrete, specific]
(b) [Option B — concrete, specific]
(c) [Option C — or "something else — describe"]
```

**Examples:**
- "What's the primary purpose of this feature? (a) automate an existing manual workflow, (b) add new capability users are requesting, (c) replace a legacy system, or (d) something else?"
- "Who are the primary users? (a) end-users of the product, (b) internal developers/tooling, (c) system administrators, or (d) multiple groups?"
- "What's the deployment environment? (a) cloud-hosted SaaS, (b) on-premise enterprise, (c) both, or (d) not sure yet?"

**When NOT to use:** When options aren't naturally bounded, or when the question is genuinely exploratory. Use Pattern 2 instead.

## Pattern 2: Broad-to-Narrow Probing

Use when the answer space is open-ended. Start with a broad framing question, then narrow based on the response.

**Sequence:**
1. **Broad:** "What problem does this feature solve for your users?"
2. **Narrowing (based on answer):** "You mentioned [specific detail from answer]. Is that the primary use case, or are there secondary ones?"
3. **Constraint (based on answer):** "Given that [constraint], would it be acceptable if [trade-off]?"

**When to use:** New feature requests, greenfield exploration, user hasn't articulated clear requirements.

## Pattern 3: Explicit Assumption Validation

Use when you've formed an assumption that would materially affect requirements. State it explicitly and ask for confirmation.

**Structure:**
```
I'm assuming [specific assumption] based on [what you observed].

Is that correct, or is [alternative] more accurate?
```

**Examples:**
- "I'm assuming users will be authenticated before accessing this feature. Is that correct, or should unauthenticated users have access?"
- "I'm assuming this will be a REST API rather than GraphQL, based on the existing codebase patterns. Is that the direction you want?"
- "I'm assuming the data volume is in the thousands, not millions, of records. Does that match your expectations?"

**When to use:** After every 2-3 questions, before proposing approach directions.

## Pattern 4: Scope Boundary Surfacing

Use to define what is explicitly OUT of scope. Users often know what they don't want more clearly than what they do want.

**Structure:**
```
To help me bound the requirements: what should this feature explicitly NOT do?

For example: [concrete boundary example that's plausible but wrong for this feature]
```

**Examples:**
- "To help me bound the requirements: what should this explicitly NOT do? For example, should it NOT handle real-time notifications, or is that in scope?"
- "Should this feature be admin-only, or should regular users have access? I want to make sure I don't assume the wrong audience."

**When to use:** Before producing the requirements brief. Always ask at least one scope boundary question.

## Pattern 5: Success Criteria Elicitation

Use to convert vague "make it better" requests into measurable outcomes.

**Structure:**
```
How will you know this feature is working well?

(a) [measurable outcome A]
(b) [measurable outcome B]
(c) [other — describe]
```

**Fallback (if user is stuck):**
```
Let me propose a success criterion: [specific, measurable outcome].
Does that capture what you're looking for, or would you adjust it?
```

**Examples:**
- "How will you know this is working? (a) users complete the workflow in under 30 seconds, (b) error rate drops below 5%, (c) support tickets for this area stop coming in, or (d) another measure?"
- "Let me propose a success criterion: the onboarding flow converts 80%+ of new signups. Does that capture what you're looking for?"

**When to use:** After purpose and users are clear. Critical for spec-driven-authoring handoff.

## Pattern 6: Assumption Challenge (from Jamie-BitFlight)

Adapted from creative ideation for requirements surfacing. Challenge what the user (and you) take for granted.

**Types of challenges:**

| Challenge Type | Question | When to Use |
|---------------|----------|-------------|
| **Necessity** | "What if we didn't build this at all? What's the actual cost of the status quo?" | When scope feels bloated |
| **Audience** | "What if the primary user is different from who you described? Who else might need this?" | When user focus seems narrow |
| **Constraint** | "What if [constraint] didn't exist? How would the requirements change?" | When constraints seem self-imposed |
| **Order** | "What if we built the P2 items first? Would that change the P0 design?" | When priorities seem fixed |

**Warning:** Use sparingly (1-2 times per session). Too many challenges exhaust the user.

## When to Stop Asking Questions

Stop immediately when any of these occur:

1. **User says stop:** "proceed", "let's move on", "that's enough", "just build it"
2. **Cap reached:** 5 questions asked (even if answers are incomplete)
3. **Intent clear:** You can state "We need to build [X] so that [Y] can [Z]" with confidence
4. **Diminishing returns:** Last 2 questions produced no new information
5. **Research needed:** A question reveals you need external investigation first

## Anti-Patterns in Questioning

| Anti-Pattern | Example | Fix |
|-------------|---------|-----|
| **Leading questions** | "You want a React app, right?" | "What technology stack did you have in mind? (a) React, (b) Vue, (c) no preference, (d) other?" |
| **Binary that should be open** | "Is this a web app?" | "What's the target platform? (a) web, (b) mobile, (c) CLI, (d) multiple?" |
| **Question overload** | 3+ questions in one message | One question per message. Always. |
| **Premature specificity** | "What database schema should we use?" in Phase 1 | Phase 1 is about WHAT. Schema is HOW — that's Phase 2 at earliest. |
| **Repeated questions** | Asking same question rephrased | If the user didn't answer, move on. Don't re-ask. |
| **Dismissing user answers** | User says "doesn't matter" → you assume | If user defers, surface as an explicit assumption and move on. |

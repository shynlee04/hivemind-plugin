# Intent Gate Protocol

## Articulation

The Intent Gate is the first phase of every ideation session. It prevents scope misalignment by forcing explicit classification of what the user wants before any work begins. Without it, agents default to assuming implementation — the most expensive mistake.

## The Routing Decision Tree

```
Raw Message
  → Is it a question? → YES → Is it about existing code? → YES → RESEARCH
                                        → NO → Is it about a decision? → YES → EVALUATION
                                                                             → NO → RESEARCH
  → Is it a command? → YES → Is it "fix/debug"? → YES → FIX (not ideation)
                             → Is it "add/create/build"? → YES → IMPLEMENTATION
                             → Is it "check/investigate"? → YES → INVESTIGATION (not ideation)
                             → Other → OPEN-ENDED
  → Neither clear question nor command → AMBIGUOUS → Clarify first
```

## Edge Cases

### Ambiguous Messages

Messages that could be multiple intent types:
- "I need dark mode" — Implementation? Or evaluation of whether to add it?
- **Resolution:** Ask "Are you asking me to build this, or exploring whether it's worth building?"

### Multi-Intent Messages

Messages containing multiple requests:
- "Add OAuth2 and explain how the auth flow works"
- **Resolution:** Split into separate intents. Handle the research inline; the implementation goes through the pipeline.

### Carry-Over from Prior Turns

When the conversation context suggests one intent but the current message suggests another:
- **Rule:** Current message wins. Always.
- Prior turn: "Add a login page" → current turn: "Actually, how does JWT work?"
- **Classification:** Research, not implementation. Prior turn is history.

## Concrete Examples Per Intent Type

### Research

1. "Explain how the trajectory tool works" → explore → answer
2. "What is CQRS and when should I use it?" → explore → answer
3. "How does React's reconciliation algorithm work?" → explore → answer

### Implementation

1. "Add a new handoff tool" → plan → execute
2. "Create a settings page with dark mode toggle" → plan → execute
3. "Implement rate limiting on the API endpoints" → plan → execute

### Investigation (NOT ideation)

1. "Check why tests are failing in src/tools/" → isolate → diagnose
2. "What's causing the memory leak in production?" → isolate → diagnose
3. "Investigate the slow query on the dashboard" → isolate → diagnose

### Evaluation

1. "What do you think about using CQRS for hooks?" → clarify → evaluate
2. "Should we use REST or GraphQL for the new API?" → clarify → evaluate
3. "Is it worth migrating to TypeScript 6?" → clarify → evaluate

### Fix (NOT ideation)

1. "The build is broken after last commit" → diagnose → fix
2. "Fix the flaky test in the CI pipeline" → diagnose → fix
3. "Regression: login returns 500 error" → diagnose → fix

### Open-ended

1. "Refactor the shared utilities" → clarify → ideate (Standard)
2. "Migrate from monolith to microservices" → clarify → ideate (Deep)
3. "Redesign the authentication flow" → clarify → ideate (Standard)

## Step 1.5: Turn-Local Intent Reset

### Enforcement Rules

1. On every new turn, re-read ONLY the current user message
2. Classify from scratch — ignore all prior classifications
3. If the message is a response to a prior question, extract the intent from the response content, not the question context
4. Log the re-classification:
   ```bash
   # Log intent to activity
   echo "{\"intent\":\"<type>\",\"source\":\"turn-local-reset\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
     >> .hivemind/activity/ideating/{session-id}/intent-log.json
   ```

### When Override Is Allowed

You may consider prior context ONLY when:
- The current message is a one-word response ("yes", "no", "ok")
- The current message is a direct continuation ("continue", "go ahead")
- The current message explicitly references a prior statement ("as I said before...")

## Step 2.5: Context-Completion Gate Checklist

Before proceeding to Phase 1, verify:

| # | Condition | How to Check |
|---|-----------|-------------|
| 1 | Goal is stated or inferable | Can I write a one-sentence problem statement? |
| 2 | Relevant context available | Do I know: domain, stack, constraints? |
| 3 | No blocking ambiguity | Are there zero unresolved HIGH-IMPACT questions? |

### Scoring

- All 3 true → PROCEED to Phase 1
- 1-2 true → Ask ONE targeted question, then re-check
- 0 true → Ask the user to state their goal clearly

## Coordination

- Works with `use-hivemind` (entry router) for initial classification
- Feeds into Phase 1 (Ideation Intake) with classified intent
- May short-circuit to other skills (research, fix) if intent is not ideation

## Metrics

| Metric | Target |
|--------|--------|
| Intent accuracy | ≥95% first-turn correct classification |
| Ambiguity resolution | ≤2 clarifying questions before classification |
| False-positive ideation | ≤5% (ideation triggered when not needed) |

## Conditions

- **Use when:** Any user message that could lead to feature work or architectural change
- **Do NOT use when:** Simple factual questions, bug reports, direct commands with clear scope

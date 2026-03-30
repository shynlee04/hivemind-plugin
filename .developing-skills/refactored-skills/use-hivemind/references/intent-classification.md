# Intent Classification Protocol

Phase 0 gate for classifying user intent before any routing or action. Fires on every new message.

---

## Table of Contents

- [Intent Verbalization](#intent-verbalization)
- [Signal Words Table](#signal-words-table)
- [Routing Decision Tree](#routing-decision-tree)
- [Turn-Local Intent Reset](#turn-local-intent-reset)
- [Context-Completion Gate](#context-completion-gate)
- [Ambiguity Resolution](#ambiguity-resolution)
- [Edge Cases](#edge-cases)
- [Metrics](#metrics)

---

## Intent Verbalization

Before any action, verbalize what you detect:

> "I detect a **[research / implementation / investigation / evaluation / fix / open-ended]** request — [reason]. My approach: **[explore -> answer / plan -> execute / clarify first / etc.]**."

---

## Signal Words Table

| Intent | Signal Words | Route | Mode |
|--------|-------------|-------|------|
| Research | "explain", "how does", "what is" | Explore -> Answer | Lightweight or inline |
| Implementation | "add", "create", "build", "implement" | Plan -> Execute | Lightweight |
| Investigation | "check", "why", "debug", "failing" | Isolate -> Diagnose | Inline (not ideation) |
| Evaluation | "what do you think", "should we", "compare" | Clarify -> Evaluate | Standard |
| Fix | "broken", "error", "crash", "regression" | Diagnose -> Fix | Inline (not ideation) |
| Open-ended | "refactor", "migrate", "redesign", "rebuild" | Clarify -> Ideate | Standard or Deep |

---

## Routing Decision Tree

```
Raw Message
  -> Is it a question?
    -> YES -> Is it about existing code? -> YES -> RESEARCH
                     -> NO -> Is it about a decision? -> YES -> EVALUATION
                                                    -> NO -> RESEARCH
  -> Is it a command?
    -> YES -> Is it "fix/debug"? -> YES -> FIX (not ideation)
           -> Is it "add/create/build"? -> YES -> IMPLEMENTATION
           -> Is it "check/investigate"? -> YES -> INVESTIGATION (not ideation)
           -> Other -> OPEN-ENDED
  -> Neither clear question nor command -> AMBIGUOUS -> Clarify first
```

---

## Turn-Local Intent Reset

**Re-classify from the current message only.** Prior turn context informs but never overrides.

### Enforcement Rules

1. On every new turn, re-read ONLY the current user message
2. Classify from scratch — ignore all prior classifications
3. If the message is a response to a prior question, extract intent from the response content, not the question context
4. Log the re-classification to activity output

### When Override Is Allowed

Consider prior context ONLY when:
- The current message is a one-word response ("yes", "no", "ok")
- The current message is a direct continuation ("continue", "go ahead")
- The current message explicitly references a prior statement ("as I said before...")

---

## Context-Completion Gate

Before proceeding past Phase 0, ALL three conditions must be true:

| # | Condition | Check |
|---|-----------|-------|
| 1 | User's goal is stated or inferable | Can I write a one-sentence problem statement? |
| 2 | Relevant context is available | Do I know the domain, stack, and constraints? |
| 3 | No blocking ambiguity remains | Are there zero unresolved HIGH-IMPACT questions? |

### Scoring

- All 3 true -> PROCEED
- 1-2 true -> Ask ONE targeted question, then re-check
- 0 true -> Ask the user to state their goal clearly

If any condition fails -> ask one targeted question. Do not batch questions.

---

## Ambiguity Resolution

If intent is ambiguous, ask ONE clarifying question. Do not proceed until resolved.

Questions to ask:
- "Are you asking me to research this, or do you want to start building it?"
- "Is this a quick question or are you exploring a new feature?"
- "Should I investigate the current state first, or are you proposing a change?"

### Validation Before Acting

- **Assumptions Check:** List any assumptions. If more than 2, ask the user to confirm.
- **Delegation Check:** Can this be answered inline in <3 actions? If yes, handle directly.

### When to Challenge the User

- User proposes adding a feature that duplicates existing functionality -> flag it
- User wants to skip research for a cross-stack change -> push back
- User is solving a symptom, not the root cause -> reframe the problem
- User's scope keeps expanding -> invoke creep prevention early

---

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

When conversation context suggests one intent but the current message suggests another:
- **Rule:** Current message wins. Always.
- Prior turn: "Add a login page" -> current turn: "Actually, how does JWT work?"
- **Classification:** Research, not implementation. Prior turn is history.

---

## Metrics

| Metric | Target |
|--------|--------|
| Intent accuracy | >=95% first-turn correct classification |
| Ambiguity resolution | <=2 clarifying questions before classification |
| False-positive ideation | <=5% (ideation triggered when not needed) |

---

## Conditions

- **Use when:** Any user message that could lead to feature work or architectural change
- **Do NOT use when:** Simple factual questions, bug reports, direct commands with clear scope

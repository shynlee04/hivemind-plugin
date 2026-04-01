# Brainstorming Pipeline

## Articulation

The brainstorming pipeline governs the one-question-at-a-time dialogue that turns a vague idea into structured approaches. It prevents premature convergence and ensures the agent understands the problem before proposing solutions.

## Step-by-Step Procedure

### Step 1: Establish the Problem Frame

Ask the user to describe the problem in their own words:
> "Before I suggest approaches, help me understand: what problem are you trying to solve?"

Do NOT skip this. Even if the problem seems obvious, confirm it.

### Step 2: Build the Vocabulary Map

Identify core terms from the user's description:
1. List the key nouns and verbs
2. Ask about any ambiguous terms
3. Map to domain vocabulary

Template: [templates/vocabulary-map.md](../templates/vocabulary-map.md).

### Step 3: One-Question-at-a-Time Discovery

For each turn, ask exactly ONE question. Wait for the answer. Then ask the next.

Question sequence (adapt to context):

| # | Question Category | Example Question | Purpose |
|---|-------------------|-----------------|---------|
| 1 | Users | "Who will use this?" | Identify target audience |
| 2 | Current state | "What exists today?" | Baseline understanding |
| 3 | Success | "What does success look like?" | Define measurable outcome |
| 4 | Constraints | "What can't change?" | Identify hard boundaries |
| 5 | Priority | "What matters most?" | Force ranking |

### Step 4: Generate Approaches

After sufficient context (≥3 questions answered), generate 2-3 approaches.

Each approach:
```markdown
### Approach N: <Name>
**Description:** <one paragraph>
**Pros:**
- <pro 1>
- <pro 2>
**Cons:**
- <con 1>
- <con 2>
**Estimated Complexity:** <Low / Medium / High>
**Requirements Impacted:** <R1, R2, etc.>
```

### Step 5: Understanding Lock

Present the approaches and ask for confirmation:

> "I understand the problem as: **<problem statement>**.
>
> I'm considering these approaches:
> 1. **<Approach 1>** — <one-line summary>
> 2. **<Approach 2>** — <one-line summary>
>
> Should I proceed with research to validate these, or would you like to adjust anything?"

**Hard gate:** Do NOT proceed until user explicitly confirms.

### Step 6: Start Decision Log

Record the approach selection as the first decision.

Template: [templates/decision-log.md](../templates/decision-log.md).

## Demonstration: Good vs Bad Questioning

### BAD (Batching questions)

> "Tell me about the users, what the current system looks like, what success means, and any constraints you have. Also, what's your timeline?"

**Problem:** User overwhelmed. Answers will be shallow. No opportunity to dig deeper on any one point.

### GOOD (One at a time)

> Turn 1: "Who will be using this feature?"
> Turn 2 (after answer): "Got it — developers on your team. What does the current workflow look like?"
> Turn 3 (after answer): "So today you're manually doing X. What would an ideal workflow look like?"

**Benefit:** Each answer informs the next question. Depth increases naturally.

### BAD (Premature solution)

> "I think we should use React Context for this. Here's how..."

**Problem:** Solution proposed before understanding the problem. May solve the wrong thing.

### GOOD (Problem-first)

> "Before I suggest an approach, help me understand: what problem are you trying to solve?"
> (Wait for answer)
> "Got it. And who's affected by this?"

**Benefit:** Solution matches the actual problem.

## Commands

```bash
# Track brainstorming progress
echo "{\"phase\":\"brainstorming\",\"question_number\":3,\"approaches_pending\":true}" \
  > .hivemind/activity/ideating/{session-id}/brainstorming-state.json
```

## Coordination

| Phase | Skill Involved |
|-------|---------------|
| Problem frame | This skill only |
| Vocabulary map | This skill + vocabulary template |
| Discovery questions | This skill only |
| Approach generation | This skill + cross-stack research |
| Understanding Lock | This skill + user confirmation |
| Decision Log | This skill + decision-log template |

## Metrics

| Metric | Target |
|--------|--------|
| Questions before first approach | 3-5 (Standard), 1-2 (Lightweight) |
| Approaches generated | 2-3 minimum |
| Understanding Lock bypasses | 0 (hard gate) |

## Conditions

- **Use when:** User has a vague or partially-formed idea that needs structure
- **Do NOT use when:** User has a clear, specific requirement with no ambiguity
- **Upgrade scope when:** User introduces second concern during questioning

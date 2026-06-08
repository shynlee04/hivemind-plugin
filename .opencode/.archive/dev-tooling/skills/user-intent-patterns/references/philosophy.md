# Philosophy: Why Progressive Intent Extraction Over One-Shot Questioning

---

## The One-Shot Fallacy

The naive approach to understanding user intent goes like this:

> "Ask the user everything you need to know in one turn. Get all answers. Then act."

This seems efficient. It's actually the most common failure mode in agent-user interaction.

### Why One-Shot Fails

**1. Users don't know what they don't know.**

When you ask "what are your constraints?" in round 1, before the user has thought about the problem domain, the answer is random. The user hasn't formed a mental model yet. You're asking them to articulate something they haven't internalized.

**Progressive approach:** First confirm the domain and scope. Let the user think within a bounded frame. Then ask about constraints. The answer is now 10x more useful.

**2. Early answers constrain later thinking.**

If the user says "priority: speed" in round 1, and then discovers in round 3 that correctness is actually the priority, they feel locked into the first answer. Progressive extraction lets them discover priorities naturally.

**3. The question that matters most may not exist yet.**

You can't ask about something you don't know you don't know. The most important constraint or edge case often emerges from discussion, not from a checklist. Progressive extraction creates space for emergence.

**4. One-shot creates question fatigue immediately.**

Receiving 5+ questions at once feels like an interrogation. The user may answer all superficially to "get through it" — and you now have 5 low-quality answers instead of 2 high-quality ones.

---

## The Progressive Philosophy

Progressive intent extraction acknowledges a fundamental truth about human communication:

> **Understanding is not transmitted — it's constructed iteratively.**

You don't receive the user's intent like a file download. You build a shared understanding through rounds of: the user says something → you interpret → you restate → the user corrects → you reinterpret → convergence.

This is how humans communicate face-to-face. It's how doctors diagnose. It's how consultants scope projects. AI agents should follow the same pattern.

### The Three-Layer Model

Intent extraction happens in three layers, from surface to depth:

| Layer | What You Learn | When | Method |
|-------|---------------|------|--------|
| **Surface Intent** | What the user SAID | Round 1-2 | Read the prompt. Parse keywords. Identify the domain. |
| **Structural Intent** | What the user MEANT | Round 2-4 | Probe scope boundaries. Identify hidden assumptions. Surface constraints the user didn't mention. |
| **Deep Intent** | What the user NEEDS | Round 3-6 | Challenge assumptions. Find the real problem behind the stated problem. Discover non-obvious constraints. |

**The XY Problem is Layer 3 thinking:** The user asks about X (surface intent — "how do I parse this string?"). They actually need Y (deep intent — "how do I extract data from this log file?"). Progressive extraction is more likely to uncover Y than one-shot questioning because later rounds challenge earlier assumptions.

---

## Why Frameworks Converge on Progressive Patterns

GSD, BMAD, and Hivemind — despite different origins and philosophies — all implement progressive intent extraction. This is not coincidence. It's convergence on an effective pattern.

### GSD: Structure-First Progression

GSD structures the progression through its discuss → plan → execute → verify cycle. Intent is extracted in discuss-phase, formalized in SPEC.md, and re-confirmed at each phase boundary.

The progression is: **discover → structure → execute → verify → repeat.**

GSD's insight: **Intent extraction is a phase, not a question set.** You don't just ask questions — you go through a formal phase with its own entry criteria, process, and exit criteria.

### BMAD: Absorption-First Progression

BMAD structures the progression through waves of absorption. Instead of asking questions up front, it absorbs first, then identifies gaps.

The progression is: **absorb → synthesize → identify gaps → ask → re-absorb → converge.**

BMAD's insight: **The user has already communicated intent — in their prompt, their files, their links.** Extraction starts by mining what's already there, not by asking for more.

### Hivemind: Loop-First Progression

Hivemind structures the progression as an explicit loop with hard gates. Each phase has stop conditions that must be met before moving to the next.

The progression is: **probe → understand → plan → delegate → update → deliver → repeat.**

Hivemind's insight: **Intent extraction lives inside a larger cycle of work.** You don't extract intent in isolation — you extract it as part of a loop that includes understanding, planning, and execution.

---

## The Budget Principle

Every question costs attention. Attention is the scarcest resource in human-agent interaction.

### The Question Budget Formula

```
Available budget = User's patience (turns) × User's engagement (attention per turn)
Effective questions = Available budget − Overhead (repetition, confusion, platform friction)
```

A user might have patience for 10 turns and engagement for 2 focused questions per turn. That's a budget of 20 question-equivalents. But overhead consumes ~30%: platform delays, misunderstandings, repetition. So your effective budget is ~14 questions.

**Spend this budget on the highest-value unknowns:**

| Question Value | Type | Budget Allocation |
|---------------|------|-------------------|
| HIGH | Scope boundary — what's IN/OUT | Spend freely. Without this, everything downstream is wrong. |
| HIGH | Constraints — what limits exist | Spend freely. Constraints block execution more than anything else. |
| MEDIUM | Success criteria — what does "done" mean | Worth 1-2 questions. Important but can be inferred from scope. |
| LOW | Preferences — "do you prefer X or Y" | Only ask if both options are genuinely equivalent in outcome. |
| WASTE | Clarifying what the user already clarified | Re-read the conversation before asking. |

---

## When to Break the Progressive Pattern

Progressive extraction is the default. But there are times when it's wrong:

### Skip to Execution When...

- The user provides exact file paths and exact changes needed
- The task is a well-known pattern you've executed 100 times
- The user explicitly says "just do it" with clear scope
- The cost of getting it wrong is low (trivial change, easy to revert)

### Switch to One-Shot When...

- The user is about to disconnect ("one last thing before I go")
- The platform has a hard turn limit and the task is urgent
- All 5 dimensions are already covered by the user's initial message

### Abandon Progression When...

- After 3 rounds of questioning, the user's answers are getting less specific, not more
- The user shows signs of question fatigue: one-word answers, "whatever you think", "just do something"
- You realize the user doesn't actually know what they want — they need exploration, not extraction

In these cases, switch to the approach GSD and Hivemind both recommend: **present your best understanding as a concrete statement and ask for a yes/no.** "I understand you want X, with constraints Y, and success looks like Z. Is this correct?" This forces convergence.

---

## The Meta-Principle

> **The best intent extraction strategy is the one the user doesn't notice is happening.**

A user who writes 500 words of specs should not be asked structured QA questions. A user who says "help me with my project" should not be left in silence. Match the method to the human, not the human to the method.

The frameworks (GSD, BMAD, Hivemind) are tools. The user is not a tool user — they're a person communicating what they need. The framework's job is to meet them where they are.

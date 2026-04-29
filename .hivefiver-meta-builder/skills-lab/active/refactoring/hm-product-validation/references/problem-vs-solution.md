# Problem vs. Solution: The Anti-Solution-Check

## Anti-Solution-Check: Purpose and Scope

Detect when a user is asking for a specific solution ("build a real-time dashboard") rather than describing the underlying problem ("I can't tell when orders are delayed"). The anti-solution-check is a structured probe that surfaces the real user need, separates validated problems from unvalidated assumptions, and prevents teams from building features that solve no one's actual pain.

## The Core Principle

**Users describe solutions. Teams build solutions. Great product validation discovers the problem behind the solution.**

A user saying "I need a notification system" has already jumped to a solution. Until you understand what they need to be notified about, why they miss it today, and what happens when they miss it, you cannot validate whether a notification system is the right answer.

## Anti-Solution-Check Procedure

When a user describes a solution, follow this sequence. Do not accept the solution at face value.

### Step 1: Restate the Request as a Hypothesis

```
"I hear you asking for [solution X]. Before we evaluate whether to build [X],
let me confirm: this is a proposed solution to a problem. Let's make sure
we understand the problem first."
```

This reframes the conversation from "should we build X?" to "what problem are we solving?"

### Step 2: Trace the Solution Back to the Pain

Ask these four questions, one at a time:

| Order | Question | What It Reveals |
|---|---|---|
| 1 | "What happens today because [solution X] doesn't exist?" | The cost of inaction — real pain or hypothetical annoyance? |
| 2 | "Who experiences this? How many people? How often?" | Scope and frequency — is this a daily pain for many or a quarterly nuisance for few? |
| 3 | "What do they do today to work around it? How much time/effort does that cost?" | The workaround — the bar any solution must beat. If the workaround is "spend 10 seconds checking manually," a 2-week feature may not be justified. |
| 4 | "What's the worst outcome if we don't solve this in the next 6 months?" | The urgency — does the pain compound, stay constant, or fade? |

### Step 3: Classify the Problem

Based on the answers, assign a classification:

| Classification | Signal | Action |
|---|---|---|
| **Validated Pain** | Specific users, measurable cost, current workaround exists and is painful | Proceed to RICE scoring. This is a real problem. |
| **Hypothetical Pain** | "Users might want..." — no specific users, no current workaround, no measurable cost | Do NOT build. Recommend user research: "Let's talk to 5 users and validate whether this pain is real before we invest." |
| **Solution Envy** | "Competitor X has this feature" — described in competitive terms, not user terms | Ask: "Do our users ask for this? Has anyone complained about its absence?" If no → deprioritize. Competitors aren't users. |
| **Technical Desire** | "It would be cool to use [technology Y]" — described in implementation terms | Ask: "What user problem does [technology Y] solve that our current stack can't?" If none → table for technical exploration cycle, not user-facing development. |
| **Vanity Feature** | "It would make us look modern/innovative" — described in aesthetic/perception terms | Ask: "Would users notice if we shipped this vs. something else?" If the answer is uncertain → defer. Aesthetics without function rarely deliver ROI. |

### Step 4: Produce a Problem Statement

If the problem passes classification as Validated Pain, produce a structured problem statement:

```markdown
## Problem Statement: [Descriptive Name]

**Current State:** [what happens today — the pain]
**Affected Users:** [segment, count, frequency]
**Current Workaround:** [what they do today, cost in time/effort/errors]
**Consequence of Inaction:** [what worsens over 6 months if unresolved]
**Evidence:** [how we know — support tickets, user interviews, analytics, churn data]
**Validation Status:** Validated Pain / Hypothetical / Requires Research
```

This problem statement becomes the anchor for all subsequent product validation. Every proposed solution must trace back to the problem statement.

## The Five Whys for Product Decisions

Adapt the Five Whys root-cause technique for product validation. Use when a requested feature seems disconnected from user value.

### Procedure

Start with the requested solution and ask "Why?" five times, each answer becoming the next question:

```
Request: "We need admin users to have a bulk-edit feature."

Why #1: "Why do admin users need bulk editing?"
→ "Because they manage hundreds of product listings and editing one-by-one takes hours."

Why #2: "Why is editing one-by-one so time-consuming?"
→ "Because they have to update pricing when the supplier changes rates, and it affects most products."

Why #3: "Why does supplier rate changes affect so many products?"
→ "Because most products use the same base material cost, and when that changes, all prices shift."

Why #4: "Why are product prices manually maintained instead of derived from material cost?"
→ "Because the pricing system was built before we had supplier integration."

Why #5: "Why hasn't the pricing system been updated to support derived pricing?"
→ [If answer reveals a real constraint] → "Then the problem isn't bulk-editing. The problem is the pricing system doesn't support supplier-linked pricing."

Real need discovered: Supplier-linked pricing automation.
Requested solution (bulk-edit) was a workaround for the real problem.
```

### When to Stop Asking Why

Stop the Five Whys when:
- The answer reveals a systemic constraint (technical, organizational, or resource)
- The answer circles back to an earlier answer (you've found the root)
- The answer is "because that's how we've always done it" (process debt, not product need)
- You reach a decision point: "We could fix the root cause, but the cost exceeds the value"

### Anti-Pattern: Five Whys as Interrogation

The Five Whys is a collaborative exploration, not an interrogation. If the user becomes defensive:

- Reframe: "I'm not questioning the value of [X]. I'm trying to understand the full picture so we build the right thing."
- Stop at 3 Whys if the user is uncomfortable. Three layers is usually enough to distinguish surface request from real need.
- Write down the chain and share it: "Here's what I understand. Does this trace look right to you?"

## User Problem Articulation Templates

### The "Job to Be Done" Frame

```
When [situation/context],
I want to [desired outcome],
so that [underlying need/benefit].
```

Example: "When I notice inventory is running low, I want to reorder before we stock out, so that we don't lose sales to unavailability."

### The "Pain Point" Frame

```
Currently, [who] experiences [pain] when [trigger].
This happens [frequency] and costs [measurable impact].
They work around it by [current behavior], which takes [effort].
```

Example: "Currently, support agents experience frustration when they can't find a customer's order history. This happens 20+ times per day and costs ~5 minutes per lookup. They work around it by asking the customer to read order numbers over the phone, which takes 2-3 minutes per call."

### The "Before/After" Frame

```
Before: [current experience — the pain]
After: [desired experience — the relief]
Gap: [what's missing today]
```

Use this frame to establish a clear contrast. "Before" must be based on evidence (observed behavior, analytics, user reports). "After" must be specific (numeric improvement, not "better").

## Red Flags: When the Solution Replaces the Problem

Watch for these signals that the team is solution-locked and has lost sight of the problem:

| Signal | What It Means | Intervention |
|---|---|---|
| The feature is described entirely by its UI ("a dashboard with 6 widgets") | The team has designed the solution before understanding the need | Ask: "What decision does each widget help someone make?" |
| The feature name is a technology ("use a graph database", "add a Kafka queue") | Implementation is leading, not user need | Ask: "What user experience changes because we use this technology?" |
| The justification is competitive ("competitor X has this") | Feature-parity thinking, not user-value thinking | Ask: "Have our users asked for this? What happens if we don't add it?" |
| The scope keeps expanding ("and while we're at it, we could also...") | Scope creep filling a vacuum — no clear problem boundary | Ask: "Which of these additions solves the core user problem we identified?" |
| No one can name a specific user who asked for it | The request is internally generated, not user-validated | Block: "Let's talk to 3 users before we commit to building this." |

## Integration with Other Product-Validation Phases

After completing the anti-solution-check:

- If the problem is **Validated Pain** → proceed to RICE scoring (Phase 2 in SKILL.md).
- If the problem is **Hypothetical** → recommend user research; route to `hm-brainstorm` if broader ideation is needed.
- If the problem is **Technical Desire** → defer to a technology exploration spike; do NOT allocate user-facing development.
- If the problem is **Solution Envy** → benchmark the competitor feature against your user needs. It may be valid, but validate independently.

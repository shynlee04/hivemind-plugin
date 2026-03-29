# Feature Quality Gates

Active in **Phase 3** of `use-hivemind-ideating` SKILL.md. Validates scope, impact, and necessity before multi-agent review.

## Table of Contents

- 5-Question Creep Check
- 10x Opportunity Analysis
- YAGNI Check
- Scoring
- Pass/Fail Criteria
- Anti-Patterns

## 5-Question Creep Check

Five questions adapted from feature-creep prevention, contextualized for HiveMind. Each answer is Yes/No with evidence.

### 1. Validate the Problem

> "Does this feature solve a real, stated problem for actual users?"

| Answer | Implication |
|--------|-------------|
| Yes + evidence | Proceed to Q2 |
| Yes + assumption | Flag assumption — needs validation before Q2 |
| No | **FAIL** — feature is a solution looking for a problem |

**HiveMind context:** "Users" includes both the human operator and downstream agents consuming the output.

### 2. Check Alignment

> "Does this feature align with the project's architecture principles and governance rules?"

| Answer | Implication |
|--------|-------------|
| Yes | Proceed to Q3 |
| Partially | Identify which principle is strained — may need architect input |
| No | **FAIL** — violates project constitution |

**Check against:** AGENTS.md governing principles, CQRS boundary, SDK-first rule, authority principle.

### 3. Measure Impact

> "What is the measurable impact? Can we quantify the improvement?"

| Answer | Implication |
|--------|-------------|
| Clear metric | Proceed to Q4 — record the metric |
| Qualitative benefit | Acceptable but weaker — note as subjective |
| No measurable impact | **SOFT FAIL** — still possible if user strongly wants it, but flag |

**HiveMind context:** Impact measures include: reduced agent confusion, faster pipeline execution, fewer failed handoffs, improved user satisfaction.

### 4. Assess Complexity

> "What is the implementation complexity? Does it justify the impact?"

| Complexity | Impact Required to Justify |
|-----------|---------------------------|
| Small (1-2 files, <100 LOC) | Any positive impact |
| Medium (3-5 files, 100-300 LOC) | Clear measurable impact |
| Large (>5 files, >300 LOC) | Significant 10x impact required |

### 5. Final Gut Check

> "If we ship this and it causes problems in 2 weeks, will we regret building it?"

| Answer | Implication |
|--------|-------------|
| No regret | **PASS** |
| Some concern | Document the concern in Decision Log |
| High regret risk | **FAIL** — too risky without more validation |

## 10x Opportunity Analysis

Beyond "is this feature okay," ask: "Is there a 10x version of this idea?"

### Scales

| Scale | Definition | Example |
|-------|-----------|---------|
| **Massive** | 10x improvement in a core metric | Reducing ideating time from hours to minutes |
| **Medium** | 3-5x improvement | Automating a currently manual review step |
| **Small** | 1.5-2x improvement | Better formatting of output documents |

### 10 Idea Categories

| # | Category | Question | HiveMind Example |
|---|----------|----------|-----------------|
| 1 | **Speed** | Can this be 10x faster? | Parallel agent dispatch vs sequential |
| 2 | **Automation** | Can a human step be automated? | Auto-generate Decision Log from dialogue |
| 3 | **Intelligence** | Can we add predictive capability? | Predict which approach will pass review |
| 4 | **Integration** | Can we connect two disconnected things? | Link ideating output directly to planning input |
| 5 | **Collaboration** | Can multiple agents work together better? | Swarm wave synthesis |
| 6 | **Personalization** | Can this adapt to context? | Adjust question depth based on user expertise |
| 7 | **Visibility** | Can we surface hidden information? | Show scoring breakdown to user |
| 8 | **Confidence** | Can we increase certainty? | Cross-stack validation evidence |
| 9 | **Delight** | Can we make this unexpectedly good? | Progress visualization during swarm |
| 10 | **Access** | Can we lower the barrier? | Simplified entry for first-time users |

## YAGNI Check

Challenge every feature addition through the YAGNI lens.

| Addition Type | Challenge | Defer If |
|--------------|-----------|----------|
| "Nice to have" | "Will users notice if missing?" | Cannot articulate concrete scenario |
| "Future-proofing" | "What's the trigger for activation?" | No trigger within current scope |
| "Consistency" (with other tools) | "Do OUR users need this?" | Feature exists elsewhere and isn't core |
| "Extensibility" | "What's the first extension?" | No planned extension |

### The 48-Hour Rule

If a feature idea cannot be tied to a concrete user need within 48 hours of real usage scenarios, defer it to a follow-up ideating session.

## Scoring

| Symbol | Meaning | Score Range |
|--------|---------|-------------|
| 🔥 | Hot — strong 10x candidate | 8-10 |
| 👍 | Good — solid improvement | 5-7 |
| 🤔 | Uncertain — needs more validation | 3-4 |
| ❌ | Skip — not worth pursuing | 0-2 |

### Scoring Criteria

| Criterion | Weight | 🔥 | 👍 | 🤔 | ❌ |
|-----------|--------|----|----|----|----|
| Problem validity | 25% | Real problem, clear evidence | Likely problem | Assumed problem | No problem |
| Alignment | 20% | Perfect fit | Good fit | Strained fit | Violates principles |
| Impact | 25% | 10x measurable | 3-5x measurable | Qualitative | No impact |
| Complexity | 15% | Small | Medium | Large | Very large |
| Risk | 15% | Low | Moderate | High | Unacceptable |

## Pass/Fail Criteria

### Gate Must Pass to Advance to Phase 4

| Gate | Pass Condition | Fail Action |
|------|---------------|-------------|
| 5-Q Creep | ≤2 "Yes" answers | Revise scope — remove creep elements |
| 10x Analysis | At least one 🔥 or 👍 category | Reconsider approach — is there a better angle? |
| YAGNI | All additions challenged and justified | Remove unjustified additions |

### Composite Pass

All three gates must individually pass. One hard fail = overall fail.

## Anti-Patterns

| # | Anti-Pattern | What Happens | Correct Behavior |
|---|--------------|--------------|------------------|
| 1 | Skip creep check | Scope balloons with "nice to haves" | Run all 5 questions — no shortcuts |
| 2 | Rate everything 🔥 | Inflated scores lose meaning | Be honest — most ideas are 👍 or 🤔 |
| 3 | Ignore YAGNI challenges | Feature list grows unchecked | Every addition needs justification |
| 4 | Skip 10x analysis | Miss optimization opportunities | Always ask "is there a 10x version?" |

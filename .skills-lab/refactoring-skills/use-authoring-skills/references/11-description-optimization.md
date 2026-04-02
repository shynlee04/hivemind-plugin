# Description Optimization for Skills

## Table of Contents

- [Purpose](#purpose)
- [Why Description Is the Primary Triggering Mechanism](#why-description-is-the-primary-triggering-mechanism)
- [Writing Effective Descriptions](#writing-effective-descriptions)
- [Good vs Bad Descriptions](#good-vs-bad-descriptions)
- [The Pushy Description Pattern](#the-pushy-description-pattern)
- [Trigger Query Design](#trigger-query-design)
- [The Optimization Loop](#the-optimization-loop)
- [Common Mistakes](#common-mistakes)
- [Testing Descriptions Against Real Queries](#testing-descriptions-against-real-queries)
- [Applying the Result](#applying-the-result)
- [References](#references)

---

## Purpose

How to optimize skill descriptions for reliable triggering. The `description` field in `SKILL.md` frontmatter is the single most important factor in whether a skill gets activated. This file covers how to write, test, and iteratively improve descriptions for maximum triggering accuracy.

See [02-frontmatter-standard.md](02-frontmatter-standard.md) for the frontmatter schema and [06-cross-platform-activation.md](06-cross-platform-activation.md) for platform-specific triggering behavior.

---

## Why Description Is the Primary Triggering Mechanism

Agents use progressive disclosure to manage context. At startup, they load only the `name` and `description` of each available skill — just enough to decide when a skill might be relevant. When a user's task matches a description, the Agent reads the full `SKILL.md` into context and follows its instructions.

This means the description carries the **entire burden of triggering**. If the description does not convey when the skill is useful, the Agent will not know to reach for it.

### The Nuance

Agents typically only consult skills for tasks that require knowledge or capabilities beyond what they can handle alone. A simple, one-step request like "read this PDF" may not trigger a PDF skill even if the description matches perfectly, because the Agent can handle it with basic tools. Tasks that involve specialized knowledge — an unfamiliar API, a domain-specific workflow, or an uncommon format — are where a well-written description makes the difference.

---

## Writing Effective Descriptions

### Core Principles

| Principle | Explanation | Example |
|-----------|-------------|---------|
| **Imperative phrasing** | Frame as instruction to the Agent: "Use when..." not "This skill does..." | "Use when creating a new skill" |
| **Focus on user intent** | Describe what the user is trying to achieve, not the skill's internal mechanics | "when the user has a CSV and wants to explore data" |
| **Be pushy** | Explicitly list contexts where the skill applies, including cases where the user does not name the domain directly | "even if they don't explicitly mention 'CSV'" |
| **Stay concise** | A few sentences to a short paragraph. Hard limit: 1024 characters | 2-4 sentences with trigger keywords |

### Description Structure

A well-structured description has three parts:

```yaml
description: >
  [WHAT the skill does — action verbs + domain terms]
  Use when [WHEN to activate — specific conditions]
  Triggers: [KEYWORDS for discovery — comma-separated]
```

### Example

```yaml
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data.
  Use when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
  Triggers: "spreadsheet", "data file", "chart from data", "clean this data".
```

---

## Good vs Bad Descriptions

### Excellent

```yaml
description: >
  Use when creating a new agent skill, auditing an existing skill,
  improving skill quality, optimizing skill descriptions, writing
  evals for skills, packaging skills for distribution, or resolving
  conflicts between skills. Covers frontmatter compliance, skill
  pattern selection, TDD for skills, quality scoring via 5-dimension
  rubric, eval-driven development, description optimization, and
  cross-platform skill architecture.
  Triggers: "write a skill", "create a skill", "audit this skill",
  "improve this skill", "skill authoring", "skill frontmatter",
  "skill pattern", "skill quality", "skill description", "skill eval".
```

**Why it works:**
- Starts with "Use when..." — imperative activation context
- Covers breadth of use cases (creating, auditing, improving, packaging)
- Includes specific trigger keywords
- Stays under 1024 characters
- Describes both what and when

### Acceptable

```yaml
description: >
  Use when writing or auditing agent skills. Covers frontmatter,
  patterns, and quality evaluation.
  Triggers: "write a skill", "audit skill".
```

**Why it's acceptable but not great:**
- Covers the basics but lacks depth
- Missing edge case triggers (packaging, conflicts, description optimization)
- Could be more pushy about implicit triggers

### Bad

```yaml
description: Helps with skills.
```

**Why it fails:**
- No activation context
- No keywords
- No specificity
- Agent cannot match this to any real task

### Bad — Too Implementation-Focused

```yaml
description: >
  This skill provides a 5-dimension quality matrix, TDD workflow
  enforcement, and a routing system with P1/P2/P3 patterns.
```

**Why it fails:**
- Describes internal mechanics, not user intent
- Does not say when to use it
- Agent matches against what the user asked for, not what the skill contains

---

## The Pushy Description Pattern

The "pushy" pattern means explicitly listing contexts where the skill applies, **including cases where the user does not name the domain directly**.

### Why Pushy Matters

Users rarely use the exact terminology your skill expects. They describe their need, not the domain:

| User Says | Skill Domain | Without Pushy | With Pushy |
|-----------|-------------|---------------|------------|
| "my boss wants a chart from this data file" | CSV analysis | Missed | Triggered |
| "clean up this messy spreadsheet" | Data cleaning | Missed | Triggered |
| "make this thing follow the rules" | Skill auditing | Missed | Triggered |

### Pushy Pattern Template

```yaml
description: >
  [WHAT] — [specific capabilities].
  Use when [explicit conditions],
  even when [implicit conditions where user doesn't name the domain].
  Triggers: [keywords including synonyms and related terms].
```

### Example: Pushy vs Non-Pushy

```yaml
# Non-pushy
description: >
  Use when creating or auditing agent skills.
  Triggers: "create skill", "audit skill".

# Pushy
description: >
  Use when creating a new agent skill, auditing an existing skill,
  improving skill quality, or resolving conflicts between skills.
  Also use when the user mentions "skill", "agent behavior",
  "instruction quality", or "prompt engineering" in the context
  of building reusable Agent capabilities, even if they don't
  explicitly say "skill authoring."
  Triggers: "write a skill", "create a skill", "audit this skill",
  "improve this skill", "skill authoring", "agent instructions",
  "reusable behavior", "prompt templates".
```

---

## Trigger Query Design

To test triggering, you need a set of eval queries — realistic user prompts labeled with whether they should or should not trigger your skill.

### Query Format

```json
[
  {
    "query": "I've got a spreadsheet in ~/data/q4_results.xlsx with revenue in col C — can you add a profit margin column?",
    "should_trigger": true
  },
  {
    "query": "whats the quickest way to convert this json file to yaml",
    "should_trigger": false
  }
]
```

See `templates/trigger-queries.json` for a complete template.

### Should-Trigger Queries

Vary along these axes:

| Axis | Variation | Example |
|------|-----------|---------|
| **Phrasing** | Formal, casual, typos | "Create a skill" vs "hey can u make a skill" |
| **Explicitness** | Names domain directly vs describes need | "audit this skill" vs "this instruction set is confusing" |
| **Detail** | Terse vs context-heavy | "write a skill" vs "my manager asked me to create a reusable agent capability for PDF processing" |
| **Complexity** | Single-step vs multi-step | "create a skill" vs "create a skill, then test it, then fix the issues" |

The most useful should-trigger queries are ones where the skill would help but the connection is not obvious from the query alone.

### Should-Not-Trigger Queries

The most valuable negative test cases are **near-misses** — queries that share keywords or concepts with your skill but actually need something different.

| Weak Negative | Why It's Weak | Strong Negative | Why It's Strong |
|--------------|--------------|-----------------|-----------------|
| "Write a fibonacci function" | Obviously irrelevant | "Write a Python script that reads a CSV and uploads each row to our database" | Involves CSV, but task is ETL, not skill authoring |
| "What's the weather today?" | No keyword overlap | "Update the formulas in my Excel budget spreadsheet" | Shares "spreadsheet" concept, but needs Excel editing |

### Target: ~20 Queries

- 10 should-trigger (varied phrasing, explicitness, detail, complexity)
- 10 should-not-trigger (near-misses, adjacent domains, keyword overlap but different intent)

---

## The Optimization Loop

```
┌─────────────────────────────────────────────────────────────┐
│                  DESCRIPTION OPTIMIZATION LOOP                │
│                                                              │
│  1. Evaluate current description on train + validation sets  │
│  2. Identify failures in train set                           │
│  3. Revise description (generalize, don't overfit)           │
│  4. Repeat until train set passes or no improvement          │
│  5. Select best iteration by validation pass rate            │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Evaluate

Run all queries through your Agent with the skill installed. Observe whether the Agent invokes the skill.

A query "passes" if:
- `should_trigger` is `true` and the skill was invoked, OR
- `should_trigger` is `false` and the skill was NOT invoked

### Step 2: Identify Failures

| Failure Type | What It Means | Fix Strategy |
|-------------|---------------|-------------|
| **False negative** (should trigger, did not) | Description too narrow | Broaden scope, add context about when skill is useful |
| **False positive** (should not trigger, did) | Description too broad | Add specificity, clarify boundaries |
| **Inconsistent** (triggers sometimes, not others) | Description ambiguous | Add examples, more specific guidance |

### Step 3: Revise

| Situation | Action |
|-----------|--------|
| Should-trigger queries failing | Description may be too narrow. Broaden scope or add context. |
| Should-not-trigger queries false-triggering | Description may be too broad. Add specificity about what the skill does NOT do. |
| Stuck after several iterations | Try a structurally different approach. Different framing or sentence structure. |

**Critical:** Avoid adding specific keywords from failed queries — that is overfitting. Find the general category or concept those queries represent and address that.

### Step 4: Train/Validation Split

Split your query set to avoid overfitting:

| Set | Percentage | Purpose |
|-----|-----------|---------|
| **Train** | ~60% | Identify failures and guide improvements |
| **Validation** | ~40% | Check whether improvements generalize |

Make sure both sets contain a proportional mix of should-trigger and should-not-trigger queries. Shuffle randomly and keep the split fixed across iterations.

### Step 5: Select Best Iteration

Select by validation pass rate — the fraction of queries in the validation set that passed. Note that the best description may not be the last one; an earlier iteration might have a higher validation pass rate than later ones that overfit to the train set.

Five iterations is usually enough. If performance is not improving, the issue may be with the queries (too easy, too hard, or poorly labeled) rather than the description.

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **Summarizing workflow in description** | Description reads like a table of contents | Focus on activation conditions, not internal steps |
| **Being too abstract** | "Use when working with data" — matches everything | Add specific domain terms and conditions |
| **Overfitting to test queries** | Passes test set, fails on real queries | Use train/validation split, generalize from failures |
| **Forgetting the 1024-character limit** | Description grows during optimization | Check length after every revision |
| **Only testing obvious triggers** | High pass rate but skill still misses real use cases | Include implicit/near-miss queries in should-trigger set |
| **Using "This skill does..." phrasing** | Agent does not recognize activation context | Start with "Use when..." |
| **No trigger keywords** | Agent cannot match description to user queries | Add "Triggers:" section with comma-separated keywords |

---

## Testing Descriptions Against Real Queries

### Manual Testing

1. Install the skill in the platform's recognized location
2. Start a fresh session
3. Send each query from your trigger query set
4. Observe whether the Agent loads the skill's `SKILL.md`
5. Record pass/fail for each query

### Automated Testing

Use a script to test triggering systematically. Run each query multiple times (3+ runs), compute trigger rate (`triggers / runs`), and compare against the threshold (0.5). See `templates/trigger-queries.json` for the query format and `scripts/` for validation scripts.

Platform-specific detection logic varies — check your agent's execution logs for skill tool calls.

---

## Applying the Result

Once you have selected the best description:

1. Update the `description` field in your `SKILL.md` frontmatter
2. Verify the description is under the 1024-character limit
3. Verify the description triggers as expected with a quick sanity check
4. For a more rigorous test, write 5-10 fresh queries (never part of the optimization process) and run them through the eval script — this gives you an honest check on whether the description generalizes

### Before and After

```yaml
# Before
description: Process CSV files.

# After
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

The improved description is more specific about what the skill does and broader about when it applies.

---

## References

- [02-frontmatter-standard.md](02-frontmatter-standard.md) — Frontmatter schema and description constraints
- [06-cross-platform-activation.md](06-cross-platform-activation.md) — Platform-specific triggering
- [10-eval-lifecycle.md](10-eval-lifecycle.md) — Full eval methodology
- `templates/trigger-queries.json` — Trigger query template (20 queries)
- Agent Skills spec — https://agentskills.io/optimizing-descriptions

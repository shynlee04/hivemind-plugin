# Description Optimization

## Why Description Is the Primary Trigger

Agents use progressive disclosure. At startup, they load only `name` and `description` of each skill. When a user's task matches a description, the full `SKILL.md` is loaded.

The description carries the **entire burden of triggering**.

## Writing Effective Descriptions

### Core Principles

| Principle | Explanation | Example |
|-----------|-------------|---------|
| **Imperative phrasing** | "Use when..." not "This skill does..." | "Use when creating a new skill" |
| **Focus on user intent** | What the user is trying to achieve | "when the user has a CSV and wants to explore data" |
| **Be pushy** | List contexts including implicit ones | "even if they don't explicitly mention 'CSV'" |
| **Stay concise** | Hard limit: 1024 characters | 2-4 sentences with trigger keywords |

### Description Structure

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
  Triggers: "spreadsheet", "data file", "chart from data".
```

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
  "improve this skill", "skill authoring", "skill frontmatter".
```

**Why it works:** Starts with "Use when...", covers breadth, includes trigger keywords, stays under 1024 chars.

### Bad

```yaml
description: Helps with skills.
```

**Why it fails:** No activation context, no keywords, no specificity.

### Bad — Too Implementation-Focused

```yaml
description: >
  This skill provides a 5-dimension quality matrix, TDD workflow
  enforcement, and a routing system with P1/P2/P3 patterns.
```

**Why it fails:** Describes internal mechanics, not user intent.

## The Pushy Description Pattern

The "pushy" pattern means explicitly listing contexts where the skill applies, **including cases where the user does not name the domain directly**.

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

## The Optimization Loop

```
1. Evaluate current description on train + validation sets
2. Identify failures in train set
3. Revise description (generalize, don't overfit)
4. Repeat until train set passes or no improvement
5. Select best iteration by validation pass rate
```

### Failure Types

| Failure Type | What It Means | Fix Strategy |
|-------------|---------------|-------------|
| **False negative** (should trigger, did not) | Description too narrow | Broaden scope, add context |
| **False positive** (should not trigger, did) | Description too broad | Add specificity, clarify boundaries |
| **Inconsistent** (triggers sometimes) | Description ambiguous | Add examples, more specific guidance |

### Train/Validation Split

| Set | Percentage | Purpose |
|-----|-----------|---------|
| **Train** | ~60% | Identify failures and guide improvements |
| **Validation** | ~40% | Check whether improvements generalize |

**Critical:** Avoid adding specific keywords from failed queries — that is overfitting. Find the general category those queries represent and address that.

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **Summarizing workflow in description** | Reads like a table of contents | Focus on activation conditions |
| **Being too abstract** | "Use when working with data" — matches everything | Add specific domain terms |
| **Overfitting to test queries** | Passes test set, fails on real queries | Use train/validation split |
| **Forgetting the 1024-char limit** | Description grows during optimization | Check length after every revision |
| **Using "This skill does..." phrasing** | Agent does not recognize activation context | Start with "Use when..." |

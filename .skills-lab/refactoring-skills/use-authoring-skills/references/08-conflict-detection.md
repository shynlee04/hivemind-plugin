# Conflict Detection

## Five Conflict Types

| Type | What It Looks Like | Detection |
|------|-------------------|-----------|
| **Scope overlap** | Two skills claim same trigger | Grep trigger phrases across skills |
| **Contradictory instructions** | One says "always X", another "never X" | Compare "When to Load" sections |
| **Shared state mutation** | Both write to same file | Compare output paths |
| **Boundary violation** | Depth skill has routing logic | Check for IF/THEN routing in body |
| **Dependency cycle** | A requires B, B requires A | Trace dependency chains |

## Overlap Types

| Type | Definition | Action |
|------|-------------|--------|
| **Exact Duplicate** | Same purpose, same triggers | Consolidate |
| **Partial Overlap** | Shared triggers, different focus | Differentiate |
| **Border Overlap** | Adjacent domains, clear boundaries | Document |
| **No Overlap** | Distinct purpose | No action |

## Detection Protocol

### Step 1: Pre-Approval Questions

Before approving any new skill, ask:

1. **What exact role does it play — P1, P2, or P3?**
2. **What currently stable skill would a user confuse it with?**
3. **Should this be a branch, a reference, an alias, or a new pack?**
4. **Does it create a new load decision, or merely duplicate an old one?**

### Step 2: Overlap Analysis

Run these checks:

```bash
# Check for trigger phrase overlap
grep -r "Use when" .skills-lab/*/SKILL.md | sort

# Check for duplicate purpose statements
grep -r "^## Purpose" .skills-lab/*/SKILL.md

# Check for shared file writes
grep -r "Write\|Edit\|Create" .skills-lab/*/SKILL.md | grep -oE '[a-zA-Z0-9_.-]+\.(md|json|sh|ts)' | sort | uniq -d
```

### Step 3: Conflict Resolution

| Conflict Type | Resolution |
|---------------|------------|
| Trigger overlap | Differentiate triggers, merge if appropriate |
| Domain overlap | Define clear domain boundaries |
| Pattern conflict | Escalate to architecture review |
| Stack conflict | Prioritize by pattern level (P1 > P2 > P3) |

## Authority Conflict Resolution

When same-level authority sources disagree:

1. **Recognize conflict** — Don't force a decision
2. **Inspect freshness, scope, evidence** — Compare sources
3. **Prefer latest valid same-level authority** — When logically justified
4. **Surface uncertainty explicitly** — When no safe resolution exists

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **Duplicate triggers** | Multiple skills fire on same prompt | Consolidate or differentiate |
| **Domain confusion** | Skills claim same domain | Define clear boundaries |
| **Stack explosion** | Skills loaded without prerequisites | Prerequisite chain enforcement |
| **Skill avalanche** | Loading all skills "just in case" | Signal detection first |

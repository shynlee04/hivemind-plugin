# Brainstorming Patterns

**Purpose:** Facilitating ideation with users — divergence, convergence, and decision frameworks. Includes skill-creation examples.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Divergence Phase](#divergence-phase)
3. [Convergence Phase](#convergence-phase)
4. [Decision Frameworks](#decision-frameworks)
5. [Agent's Role in Brainstorming](#agents-role-in-brainstorming)
6. [Skill-Creation Brainstorming](#skill-creation-brainstorming)
7. [Adaptive Patterns](#adaptive-patterns)
8. [Anti-Patterns](#anti-patterns)
9. [Worked Examples](#worked-examples)
10. [Cross-References](#cross-references)

---

## Core Principle

**Brainstorming is structured exploration, not free-form chat.** The Agent guides the user through divergence (generating options) and convergence (selecting the best option) with clear transitions and decision criteria.

The Agent is a facilitator, not a dictator. It generates options, surfaces trade-offs, and helps the user decide — but the user owns the final choice.

---

## Divergence Phase

Goal: Generate as many viable options as possible without judging them.

### Techniques

| Technique | When to Use | How |
|-----------|-------------|-----|
| Category expansion | User has one idea | "What about X? Or Y? Or Z?" |
| Constraint removal | User is stuck | "If there were no limits, what would you build?" |
| Analogy prompting | User needs inspiration | "How does [similar system] handle this?" |
| Extreme cases | User needs range | "What's the simplest version? What's the most ambitious?" |
| Role reversal | User can't see options | "If you were the user of this system, what would you want?" |

### Divergence Rules

1. **No judgment during divergence** — Every idea is valid at this stage
2. **Aim for 3-7 options** — Fewer than 3 means not enough exploration; more than 7 means decision paralysis
3. **Write options to disk** — Persist to `findings.md` so they survive compaction
4. **Include the user's original idea** — Always include it as one option, even if the Agent thinks it's weak

### Option Format

When presenting options, use this structure:

```markdown
## Options Generated

### Option A: [Name]
- **What:** [One-line description]
- **Pros:** [2-3 benefits]
- **Cons:** [1-2 drawbacks]
- **Effort:** [Low/Medium/High]

### Option B: [Name]
...
```

---

## Convergence Phase

Goal: Narrow options to the best choice using clear criteria.

### Techniques

| Technique | When to Use | How |
|-----------|-------------|-----|
| Criteria weighting | Multiple competing concerns | "Rank these: speed, quality, cost" |
| Elimination rounds | Too many options | "Which can we rule out immediately?" |
| Scenario testing | Options seem equally good | "If X happened, which option handles it best?" |
| User preference | User has a gut feeling | "Which one feels right?" |
| Agent recommendation | User wants guidance | "I recommend X because [reasons]. Agree?" |

### Convergence Rules

1. **Use the user's criteria, not the Agent's** — The user's priorities drive the decision
2. **Explain trade-offs explicitly** — "Option A is faster but less complete. Option B is thorough but takes longer."
3. **Don't rush convergence** — Let the user sit with options. Offer to wait.
4. **Document the decision** — Write the chosen option and reasoning to `progress.md`

---

## Decision Frameworks

### Framework 1: Weighted Scoring

Use when options compete on multiple dimensions.

```
1. List criteria (from user's priorities)
2. Assign weights (must sum to 100%)
3. Score each option 1-5 per criterion
4. Calculate: sum(score × weight) for each option
5. Highest score wins
```

**Example:**
```
Criteria: Speed (40%), Quality (35%), Completeness (25%)

Option A: Speed 4, Quality 3, Completeness 2
  Score: (4×0.4) + (3×0.35) + (2×0.25) = 1.6 + 1.05 + 0.5 = 3.15

Option B: Speed 2, Quality 5, Completeness 4
  Score: (2×0.4) + (5×0.35) + (4×0.25) = 0.8 + 1.75 + 1.0 = 3.55

Winner: Option B
```

### Framework 2: MoSCoW Prioritization

Use when scoping a feature set.

| Category | Meaning | Action |
|----------|---------|--------|
| **M**ust have | Non-negotiable | Build first |
| **S**hould have | Important but not critical | Build second |
| **C**ould have | Nice to have | Build if time permits |
| **W**on't have | Explicitly out of scope | Document and defer |

### Framework 3: Effort vs Impact Matrix

Use when prioritizing among many tasks.

```
              High Impact
                  |
    Quick Win     |    Major Project
    (do first)    |    (plan carefully)
                  |
 ------------------|------------------
                  |
    Fill-in       |    Thankless Task
    (do when free)|    (avoid or delegate)
                  |
              Low Impact
        Low Effort          High Effort
```

---

## Agent's Role in Brainstorming

The Agent is a **strategic facilitator**, not a passive listener or a domineering director.

| Role | What the Agent Does | What the Agent Doesn't Do |
|------|---------------------|---------------------------|
| Option generator | Suggests alternatives the user hasn't considered | Force options the user doesn't want |
| Trade-off analyst | Surfaces pros/cons honestly | Push a preferred option |
| Criteria clarifier | Helps the user articulate priorities | Set priorities for the user |
| Decision documenter | Records the choice and reasoning | Make the choice for the user |
| Scope guardian | Reminds the user of constraints | Enforce constraints rigidly |

### When to Recommend

The Agent should offer a recommendation when:
- The user explicitly asks ("What would you do?")
- Options are nearly equal and the user is stuck
- The Agent has domain expertise the user lacks

**Recommendation format:**
> "I recommend [Option X] because:
> 1. [Reason 1 — tied to user's stated priority]
> 2. [Reason 2 — concrete benefit]
> 3. [Reason 3 — risk mitigation]
>
> The main trade-off is [drawback]. Want to go with this, or explore further?"

---

## Skill-Creation Brainstorming

When brainstorming about skill creation, use these domain-specific patterns.

### Pattern: Skill Architecture Options

When the user wants to create a skill but hasn't decided on structure:

```
Option A: Single SKILL.md (<200 lines)
  - Best for: Simple, focused skills with minimal references
  - Pros: Easy to load, simple to maintain
  - Cons: Gets long fast, hard to navigate

Option B: SKILL.md + reference files (200-500 lines SKILL.md)
  - Best for: Skills with deep domain knowledge
  - Pros: Progressive disclosure, keeps entry point lean
  - Cons: More files to manage, requires cross-references

Option C: SKILL.md + references + scripts (full pack)
  - Best for: Skills with enforcement, validation, or automation
  - Pros: Complete, self-contained, programmatic gates
  - Cons: Most complex, may over-engineer simple needs
```

### Pattern: Skill Trigger Design

When deciding what should activate a skill:

```
Option A: Narrow triggers (exact phrases)
  - "Use when: 'audit this skill', 'check skill quality'"
  - Pros: Precise activation, no false positives
  - Cons: May miss valid use cases

Option B: Broad triggers (conceptual matching)
  - "Use when: skill quality, audit, review, improve, fix"
  - Pros: Catches more valid uses
  - Cons: May activate on unrelated requests

Option C: Hybrid (narrow + conceptual)
  - "Use when: 'audit this skill', 'check quality', skill audit, review skill"
  - Pros: Best of both worlds
  - Cons: Requires careful description writing
```

### Pattern: Skill Scope Decisions

When deciding how broad a skill should be:

```
Option A: Single-purpose skill
  - "This skill audits skill descriptions only"
  - Pros: Clear boundaries, easy to test
  - Cons: May need companion skills for related tasks

Option B: Multi-purpose skill
  - "This skill handles creation, auditing, and improvement"
  - Pros: One-stop shop, fewer skills to manage
  - Cons: Gets long, harder to navigate, may violate single-purpose principle

Option C: Hub skill with references
  - "SKILL.md routes to reference files for each sub-task"
  - Pros: Scalable, organized, progressive disclosure
  - Cons: Requires careful cross-reference management
```

---

## Adaptive Patterns

### Pattern 1: Quick Brainstorm (User Wants Speed)

```
Turn 1: "Here are 3 options based on what you described. [List with pros/cons]"
Turn 2: "Which direction feels right?"
Turn 3: "Got it. Starting with [chosen option]."
```

### Pattern 2: Deep Brainstorm (User Wants Exploration)

```
Turn 1-2: Divergence — generate 5-7 options
Turn 3: Write options to findings.md
Turn 4-5: Convergence — apply decision framework
Turn 6: Document decision in progress.md
Turn 7: Begin execution
```

### Pattern 3: Collaborative Brainstorm (User Wants to Think Together)

```
Turn 1: "Let's think through this together. What's your initial instinct?"
Turn 2: Build on user's idea, add 2 alternatives
Turn 3: "Here's what we have so far. [List]. What's missing?"
Turn 4: Iterate until user is satisfied with the option set
Turn 5: "Ready to decide, or want to explore more?"
```

---

## Anti-Patterns

| Pattern | What It Looks Like | Why It Fails | Fix |
|---------|-------------------|--------------|-----|
| The Dictator | "We should do X. Starting now." | User didn't choose, may disagree | Present options, let user decide |
| The Paralysis Generator | 15 options with no structure | Decision paralysis | Cap at 7 options, use frameworks |
| The Yes Machine | "Sure, whatever you want!" | No value added, no guidance | Offer analysis and recommendations |
| The Premature Converger | "Let's go with the first idea" | No exploration, may miss better options | Generate at least 3 options |
| The Abstract Brainstormer | "Think about possibilities!" | Too vague, no actionable output | Use concrete examples and categories |
| The Forgotten Brainstorm | Brainstorms but doesn't document | Loses options after compaction | Write to findings.md |

---

## Worked Examples

### Example 1: Skill Architecture Decision

```
User: "Should the skill be one big file or split into references?"

Agent: "Good question. Here are the options:

  **Option A: Single SKILL.md**
  - Pros: Simple, everything in one place, easy to load
  - Cons: Gets long fast, hard to navigate, wastes tokens on unused sections
  - Effort: Low

  **Option B: SKILL.md + reference files**
  - Pros: Progressive disclosure, keeps SKILL.md under 500 lines, deep content available on demand
  - Cons: More files to manage, requires cross-references
  - Effort: Medium

  **Option C: SKILL.md + references + templates**
  - Pros: Everything bundled, ready-to-use assets
  - Cons: Most complex, may over-engineer
  - Effort: High

  Given your constraint of <500 lines for SKILL.md, Option B seems like the fit.
  Want to go with that, or explore Option C?"

User: "Option B is fine"

Agent: "Confirmed. SKILL.md as routing hub, references for depth. Starting structure."
```

### Example 2: Feature Prioritization for Skill Pack

```
User: "We need to add several features to the skill system"

Agent: "Let's prioritize. What features are on your list?"

User: "Better descriptions, evals, cross-references, templates, and a validation script"

Agent: "Let me map these on effort vs impact:

  **Quick Wins** (low effort, high impact):
  - Better descriptions — edit existing SKILL.md files
  - Cross-references — add reference links

  **Major Projects** (high effort, high impact):
  - Evals — need test framework, scenarios, scoring
  - Validation script — need to write, test, integrate

  **Fill-in** (low effort, low impact):
  - Templates — useful but not blocking

  Want to start with the quick wins, or tackle a major project first?"

User: "Quick wins first, then the validation script"

Agent: "Got it. Phase 1: descriptions + cross-references. Phase 2: validation script.
        I'll write this to task_plan.md and start with descriptions."
```

### Example 3: Skill Trigger Brainstorming

```
User: "I'm not sure what triggers should activate this skill"

Agent: "Let's think through this. The skill does code review. Here are trigger options:

  **Option A: Exact phrases**
  - 'review this code', 'code review', 'check this PR'
  - Precise but may miss variations

  **Option B: Conceptual keywords**
  - 'review', 'audit', 'check', 'inspect', 'analyze'
  - Broad but may activate on non-code-review requests

  **Option C: Hybrid (recommended)**
  - 'review this code', 'code review', 'audit this PR', 'check for issues'
  - Combines exact phrases with conceptual keywords

  I recommend Option C. It's precise enough to avoid false positives but
  broad enough to catch natural language variations. Agree?"

User: "Yes, Option C works"

Agent: "Noted. I'll write the description with hybrid triggers."
```

---

## Cross-References

| Topic | Reference |
|-------|-----------|
| Probing intent before brainstorming | `01-question-protocols.md` |
| Persisting brainstorm output | `02-context-preservation.md` |
| Managing long brainstorming sessions | `04-long-session-management.md` |
| Delegating brainstorm subtasks | `dispatching-parallel-agents` skill |
| Planning after brainstorming | `hm-planning-persistence` skill |

# Conflict Detection for Skills

## Purpose

Cross-pack overlap detection that ensures brainstorming sessions load appropriate skills without conflicts, redundancy, or authority confusion.

---

## Overlap Detection Matrix

### Skill-to-Skill Overlap

| Skill | Overlaps With | Overlap Type | Resolution |
|-------|--------------|--------------|-------------|
| context-intelligence | delegation-scope | Border | Different patterns (P1 vs P2) |
| context-intelligence | workflow-hierarchy | Border | Different patterns (P1 vs P2) |
| delegation-scope | workflow-hierarchy | No overlap | Different domains |
| context-rot-recovery | context-intelligence | Extends | Parent/child relationship |

### Overlap Types

| Type | Definition | Action |
|------|-------------|--------|
| **Exact Duplicate** | Same purpose, same triggers | Consolidate |
| **Partial Overlap** | Shared triggers, different focus | Differentiate |
| **Border Overlap** | Adjacent domains, clear boundaries | Document |
| **No Overlap** | Distinct purpose | No action |

---

## Conflict Detection Protocol

### Step 1: Pre-Approval Questions

Before approving any new skill, ask:

1. **What exact role does it play in P1, P2, or P3?**
   - P1: Entry routing
   - P2: Domain-specific
   - P3: Specialist depth

2. **What currently stable skill would a user confuse it with?**
   - Search existing skills for similar triggers
   - Check cross-reference matrix

3. **Should this be a branch, a reference, an alias, or a new pack?**
   - Branch: Same pack, different focus
   - Reference: Deeper detail
   - Alias: Alternate name for existing
   - New pack: Distinct domain

4. **Does it create a new load decision, or merely duplicate an old one?**
   - New decision = justified
   - Duplicate = consolidate

### Step 2: Overlap Analysis

Run these checks:

```typescript
interface OverlapCheck {
  triggerOverlap: boolean;      // Do triggers fire on same prompts?
  domainOverlap: boolean;       // Do skills address same domain?
  patternConflict: boolean;     // Are patterns contradictory?
  stackConflict: boolean;       // Do they compete for stack slots?
}
```

### Step 3: Conflict Resolution

| Conflict Type | Resolution |
|---------------|------------|
| Trigger overlap | Differentiate triggers, merge if appropriate |
| Domain overlap | Define clear domain boundaries |
| Pattern conflict | Escalate to architecture review |
| Stack conflict | Prioritize by pattern level (P1 > P2 > P3) |

---

## Brainstorming Integration

### Brainstorming Signal Detection

When user enters brainstorming mode:

1. **Detect brainstorm signal:**
   - "brainstorm" / "ideate" / "explore"
   - "what if" / "how might we"
   - "generate ideas" / "think through"

2. **Load appropriate skills:**
```markdown
IF brainstorm_signal → load context-intelligence (P1)
                       THEN assess domain
                       THEN load domain-specific P2 if needed
                       MAINTAIN stack ≤3
```

3. **Conflict prevention:**
   - Check overlap matrix before loading
   - Ensure no redundant skills in stack
   - Verify authority boundaries

### Brainstorming Stack Model

```
context-intelligence (P1) — always loaded
    ├── hivemind-skill-writer (companion) — if creating skills
    ├── domain-specific P2 — if domain detected
    └── Specialist P3 — only if justified
```

---

## Cross-Pack Coordination Protocol

### Open Questions (from Research)

| Question | Current Answer | Recommendation |
|-----------|---------------|----------------|
| Cross-Pack Coordination | P1 skills stack up to 3 | Define subagent spawn decision tree |
| Self-Improvement Frequency | Hooks can trigger on completion | Confidence threshold >0.8 |
| Conflict Detection Automation | Skill-Judge evaluates non-redundancy | Build overlap matrix into entry checks |
| Brainstorm Integration | Phase enables "skilled user brainstorming" | Explicit signal detection in routing |

### Coordination Decision Tree

```
Is task single-domain?
├── YES → Primary execution
└── NO → Check domain count
    ├── 2 domains → Subagent for secondary
    └── 3+ domains → Multi-agent orchestration
```

### Authority Conflict Resolution

When same-level authority sources disagree:

1. **Recognize conflict** — Don't force a decision
2. **Inspect freshness, scope, evidence** — Compare sources
3. **Prefer latest valid same-level authority** — When logically justified
4. **Surface uncertainty explicitly** — When no safe resolution exists

---

## Stacking Validation

### Stack Budget Check

Before loading any skill:

```typescript
function validateStack(currentStack: Skill[], newSkill: Skill): { valid: boolean; reason: string } {
  // Count skills with stacking > 0
  const stackCount = currentStack.filter(s => s.stacking > 0).length;
  
  // Check if new skill would exceed budget
  if (stackCount + newSkill.stacking > 3) {
    return { valid: false, reason: 'stack_budget_exceeded' };
  }
  
  // Check for conflicts with existing stack
  for (const existing of currentStack) {
    if (hasOverlap(existing, newSkill)) {
      return { valid: false, reason: 'conflict_detected' };
    }
  }
  
  return { valid: true, reason: 'valid_activation' };
}
```

---

## Integration with context-intelligence

Every skill operation must integrate with context-intelligence entry checks:

| Check | Integration Point |
|-------|-------------------|
| Entry state | Session state recognition |
| Trust threshold | Minimum trust score |
| Stack budget | Max 3 skills per entry |
| Authority conflict | Same-level disagreement |
| Overlap detection | Cross-pack matrix |

---

## Anti-Patterns

### Overlap Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Duplicate triggers | Multiple skills fire on same prompt | Consolidate or differentiate |
| Domain confusion | Skills claim same domain | Define clear boundaries |
| Authority pollution | Old/stale authorities treated as truth | Freshness validation |
| Stack explosion | >3 skills loaded at entry | Stack budget enforcement |

### Brainstorming Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Skill avalanche | Loading all skills "just in case" | Signal detection first |
| Context exhaustion | Brainstorming uses all context | Delegate to subagent |
| Authority confusion | Multiple brainstorming skills | Single P1 router |

---

## References

- `05-skill-quality-matrix.md` — Non-Redundancy dimension
- `06-agent-activation.md` — Cross-pack integration
- `07-iterative-refinement.md` — Pattern extraction

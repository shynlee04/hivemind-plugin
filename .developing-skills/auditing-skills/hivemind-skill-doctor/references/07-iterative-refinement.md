# Iterative Refinement for Skills

## Purpose

Hooks-based self-correction pattern that learns from skill experience for continuous quality improvement.

---

## Self-Improvement Loop Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVEMENT LOOP                       │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│   Skill Event → Extract Experience → Abstract Pattern → Update│
│        │                  │                │         │          │
│        ▼                  ▼                ▼         ▼          │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              MULTI-MEMORY SYSTEM                     │      │
│   ├─────────────────────────────────────────────────────┤      │
│   │  Semantic Memory   │  Episodic Memory  │ Working Memory│   │
│   │  (Patterns/Rules)  │  (Experiences)    │  (Current)    │   │
│   └─────────────────────────────────────────────────────┘      │
│                                                                │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              FEEDBACK LOOP                           │      │
│   │  User Feedback → Confidence Update → Pattern Adapt   │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Hook Integration

| Hook | When | Action |
|------|------|--------|
| `before_skill_audit` | Pre-audit | Log session context, validate skill structure |
| `after_skill_create` | Post-create | Extract pattern, update semantic memory |
| `on_validation_fail` | Skill-Judge <3.5 | Trigger refinement loop |

---

## Pattern Extraction Protocol

### Step 1: Identify Experience

When a skill completes successfully:
1. Capture the session context
2. Identify what worked well
3. Identify what was ambiguous or difficult
4. Note any edge cases encountered

### Step 2: Abstract Pattern

From successful experiences:
```markdown
## Pattern: [Name]

**When:** [Triggering condition]
**Then:** [Successful behavior]
**Confidence:** [0.0-1.0]
**Evidence:** [Supporting examples]
```

### Step 3: Confidence Threshold

**CRITICAL:** Only extract patterns with confidence >0.8

Lower confidence patterns should be noted but not stored in semantic memory.

### Step 4: Update Memory

- **Semantic Memory:** Store high-confidence patterns as rules
- **Episodic Memory:** Store experiences with timestamps
- **Working Memory:** Maintain current session patterns

---

## Refinement Loop

### Trigger: Skill-Judge Score <3.5

When validation fails, enter refinement loop:

1. **Analyze Failure**
   - Which dimension(s) scored below threshold?
   - What specific criteria failed?
   - What evidence supports the failure?

2. **Identify Gap**
   - Missing trigger condition?
   - Unclear action?
   - Poor reference structure?
   - Overlap with existing skill?
   - Missing edge case?

3. **Apply Fix**
   - Add missing trigger conditions
   - Clarify action language
   - Restructure references
   - Differentiate from similar skills
   - Add edge case handling

4. **Re-validate**
   - Run TDD GREEN phase again
   - Run Skill-Judge evaluation
   - Confirm score ≥3.5

5. **Extract Learning**
   - If validation passes: extract pattern
   - If validation still fails: escalate to manual review

---

## Memory System Integration

### Semantic Memory

**Storage:** Patterns and rules that have proven reliable.

```typescript
interface SemanticMemory {
  patterns: Pattern[];
  rules: Rule[];
  confidence: number; // >0.8 threshold
}
```

### Episodic Memory

**Storage:** Experiences with timestamps for context.

```typescript
interface EpisodicMemory {
  experiences: Experience[];
  timestamps: Date[];
  context: SessionContext;
}
```

### Working Memory

**Storage:** Current session patterns for active use.

```typescript
interface WorkingMemory {
  current: Pattern[];
  active: boolean;
  capacity: number; // Limited to prevent context pollution
}
```

---

## Integration with context-intelligence

The refinement loop must integrate with context-intelligence:

| Context State | Refinement Action |
|---------------|-------------------|
| FRESH | Standard refinement loop |
| RESUMED | Reconstruct from last check |
| DELEGATED | Preserve main session, delegate refinement |
| DEGRADED | Stop refinement, escalate to recovery |
| INTERRUPTED | Reconstruct from last trusted |
| RECOVERED | Resume refinement after recovery |

---

## Anti-Patterns

### Pattern Pollution

**Problem:** Extracting too many low-confidence patterns.
**Fix:** Only extract with confidence >0.8

### Context Explosion

**Problem:** Storing too much in working memory.
**Fix:** Limit working memory, move to episodic

### Refinement Loop

**Problem:** Endless refinement without progress.
**Fix:** Set max iterations (3), then escalate

---

## References

- `04-tdd-workflow.md` — TDD methodology
- `05-skill-quality-matrix.md` — Skill-Judge evaluation
- `06-agent-activation.md` — Cross-pack integration

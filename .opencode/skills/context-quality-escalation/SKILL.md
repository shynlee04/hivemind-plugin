# Context Quality Escalation System

**Purpose**: Lightweight runtime metric that escalates warnings based on turn count, forcing context collection and human confirmation before context rot occurs.

**Integration Point**: `src/hooks/session-lifecycle.ts` → `buildGovernanceSignals()`

---

## The Four-Level Escalation

### Level 1 (Turn 1) — MILD: Foundation Check
```
⚠️ CONTEXT CHECK [1/4]
Role: [MAIN/SUB] | Mode: [Coordinator/Executor/Researcher]
→ Verify session intent declared
→ Classify: Project-related? Execution-oriented?
→ Snapshot: Complete | Ongoing | Deferred
```

**Agent Action**: Declare intent, classify task type, snapshot state.

---

### Level 2 (Turns 2-3) — URGENT: Complexity Warning
```
⚠️⚠️ CONTEXT DECAY [2/4]
Turns: 2-3 | Hierarchy: [Complexity indicator]
→ Context relationships unclear
→ Knowledge symlinks accumulating
→ Consider: Summarize current state
→ Demand: Identify rot points NOW
```

**Agent Action**: Run `think_back({})`, identify gaps, consider `map_context` update.

---

### Level 3 (Turn 4) — CRITICAL: Reconstruction Required
```
⚠️⚠️⚠️ CONTEXT ROT [3/4]
Turns: 4 | Action: HALT FOR RECONSTRUCTION
→ Spawn subagents for context collection ONLY
→ DO NOT proceed with execution
→ Present findings for explicit confirmation
→ Output: Handoff prompt OR continuation decision
```

**Agent Action**: 
1. STOP execution
2. Call `scan_hierarchy({})`
3. Spawn hivexplorer for context collection
4. Output summary with explicit next-step options

---

### Level 4 (Turn 5+) — EMERGENCY: Mandatory Stop
```
🛑 MANDATORY STOP [4/4]
Context integrity compromised. Session must end or restart.

SUMMARY:
- Attempted: [List of actions]
- Open Questions: [List]
- Conflicts: [List]

HANDOFF PROMPT (copy to new session):
"""
[Paste this into new session]
Project: [Name]
Last Known State: [From hierarchy]
Open Tasks: [List]
Required Context: [Files to read]
Why Stopped: [Context rot at turn N]
"""
```

**Agent Action**: Output handoff prompt, refuse further autonomous action.

---

## Mode-Specific Behavior

### MAIN Agents (hiveminder, hivefiver)
- **Level 1-2**: Continue with awareness
- **Level 3**: MUST ask user for explicit confirmation
- **Level 4**: MUST output handoff prompt

### SUB Agents (hivemaker, hivehealer, etc.)
- **Level 1-3**: Continue executing within scope
- **Level 3**: Report context concerns to parent
- **Level 4**: Return to parent with "context_limit" status

---

## Integration Code

Add to `src/lib/session-governance.ts`:

```typescript
export function escalateContextWarning(
  turnCount: number,
  role: 'MAIN' | 'SUB',
  hierarchy: HierarchyState
): { level: 1|2|3|4; block: string } {
  if (turnCount >= 5) {
    return { level: 4, generateEmergencyBlock(hierarchy) }
  }
  if (turnCount === 4) {
    return { level: 3, generateCriticalBlock(hierarchy) }
  }
  if (turnCount >= 2 && turnCount <= 3) {
    return { level: 2, generateUrgentBlock(hierarchy) }
  }
  return { level: 1, generateMildBlock(role, hierarchy) }
}
```

---

## SOT Validation Checklist (Ask Every Turn)

```markdown
## Source of Truth Validation

### Naming Convention
✗ INVALID: `docs/PRD-2024-02-18.md` (timestamped = branch)
✗ INVALID: `.hivemind/plan.md` (flat, no hierarchy)
✓ VALID: `docs/plans/PRD-HIVEMIND-ENGINE.md`
✓ VALID: `.hivemind/governance/constitution.md`

### Hierarchy Structure
```
docs/
├── governance/     ← SOTs live here
├── plans/          ← SOTs live here
└── research/       ← Branches/temporary

.hivemind/
├── governance/     ← SOTs live here
├── sessions/       ← Branches/temporary
└── cache/          ← Temporary
```

### Validation Questions
1. Is this SOT connected to parent governance docs?
2. Is it referenced by other SOTs (cross-validation)?
3. Is it <48 hours old OR has update mechanism?
4. Does it follow hierarchy structure above?

If ANY answer is NO → NOT a valid SOT
```

---

## Assumption Denial Protocol

```markdown
## RADICAL DENIAL MINDSET

"I DEFLECT ALL ASSUMPTIONS AND HAPPY-PATH CONFIDENCE TO PRIORITIZE:
1. GUARDRAILS
2. SAFETY  
3. BEST-PRACTICES

I WILL:
- Collect context before action
- Think radically as a whole
- Present conclusions with verbose rationale
- Demand EXPLICIT confirmation from human-user

I WILL NOT:
- Trust AGENTS.md/CLAUDE.md blindly
- Assume SOT validity without validation
- Proceed with context rot
- Execute without clear lineage"
```

---

## Compact/Context-Purification Trigger

**Automatic Triggers**:
- Compact event occurs
- Turn count > 4
- User forces continuation despite warnings
- Wall-of-text without clear structure

**Purification Actions**:
1. STOP execution immediately
2. Summarize: What's been attempted, what's open
3. List conflicts/gaps identified
4. Output ONE of:
   - Copy-paste prompt for fresh session
   - Explicit user confirmation to continue with risks stated

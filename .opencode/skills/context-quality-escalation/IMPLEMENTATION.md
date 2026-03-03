# Context Quality Escalation System — Implementation Summary

## What Was Created

### 1. Skill: `context-quality-escalation`
**Location**: `.opencode/skills/context-quality-escalation/SKILL.md`

- Four-level escalation system (MILD → URGENT → CRITICAL → EMERGENCY)
- Mode-specific behavior (MAIN vs SUB agents)
- SOT validation checklist
- Assumption denial protocol
- Compact/purification triggers

### 2. Tool: `hivemind_declare`
**Location**: `src/tools/hivemind-declare.ts`

Runtime agent declaration tool with:
- Role declaration (MAIN/SUB, hierarchy chain)
- Mode activation (coordinator/executor/researcher)
- Context state tracking (turns, quality level, gaps)
- Confidence validation (instructions, lineage, SOTs)
- Automatic halt detection
- Handoff prompt generation for Level 4

### 3. Library: `context-escalation`
**Location**: `src/lib/context-escalation.ts`

Integration helpers for session-lifecycle hook:
- `calculateContextLevel(turnCount)` → 1-4
- `generateEscalationBlock()` → formatted block
- `formatEscalationForInjection()` → <hivemind> ready
- `generateHandoffPrompt()` → Level 4 handoff

### 4. Examples: `EXAMPLES.md`
**Location**: `.opencode/skills/context-quality-escalation/EXAMPLES.md`

Example outputs for all four levels showing:
- Declaration format
- Warning messages
- Halt conditions
- Handoff prompts

---

## Integration Points

### Hook Integration (session-lifecycle.ts)

```typescript
import { generateEscalationBlock, formatEscalationForInjection } from "../lib/context-escalation.js"

// In buildGovernanceSignals()
const escalation = generateEscalationBlock(
  state.metrics.turn_count,
  isMainAgent(state) ? "MAIN" : "SUB",
  state.hierarchy
)
const escalationBlock = formatEscalationForInjection(escalation)
warningLines.push(escalationBlock)
```

### Tool Registration (tools/index.ts)

```typescript
export { createHivemindDeclareTool } from "./hivemind-declare.js"
```

### Agent Usage (at turn start)

```typescript
hivemind_declare({
  agent_name: "hiveminder",
  agent_role: "MAIN",
  hierarchy_chain: "hiveminder > hiveplanner",
  focus: "Building auth system",
  active_modes: ["coordinator"],
  instructions_clear: true,
  lineage_valid: true,
  sots_connected: true,
  ready_to_proceed: true
})
```

---

## The Four Levels

| Level | Turns | Severity | Behavior |
|-------|-------|----------|----------|
| 1 | 1 | MILD | Declare, continue |
| 2 | 2-3 | URGENT | `think_back()`, consider `map_context` |
| 3 | 4 | CRITICAL | HALT for MAIN, ask confirmation |
| 4 | 5+ | EMERGENCY | Mandatory stop, handoff prompt |

---

## SOT Validation Rules

### Valid SOT Locations
- `docs/governance/*.md`
- `docs/plans/*.md`
- `.hivemind/governance/*.md`

### Invalid SOT Indicators
- Timestamp in filename (e.g., `PRD-2024-02-18.md`)
- Flat structure (e.g., `.hivemind/plan.md`)
- No parent references
- Age > 48h without update mechanism

---

## Next Steps

1. **Wire into session-lifecycle.ts**: Add escalation block to `buildGovernanceSignals()`
2. **Add to agent permissions**: Enable `hivemind_declare` in agent YAML frontmatter
3. **Test escalation flow**: Simulate 5-turn session to verify Level 4 handoff
4. **Document in AGENTS.md**: Add reference to context-quality-escalation skill

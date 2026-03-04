# Context Quality Escalation — Example Outputs

This document shows example outputs for each of the four context levels.

---

## Level 1 Output (Turn 1) — MILD

```
# AGENT DECLARATION

**Role**: MAIN — hiveminder
**Hierarchy**: hiveminder
**Mode**: COORDINATOR
**Context Level**: 1/4 ⚠️ MILD

**Confidence Check**:
- [✓] Instructions clear
- [✓] Lineage valid
- [✓] SOTs connected
- [✓] Ready to proceed

**Intent**:
- Focus: Build authentication system with JWT
- Classification: project-related
- Orientation: execution

**State**:
- Turns: 1
- SOTs Validated: 3
- Gaps: None identified
- Compact Pending: No
```

**Agent Behavior**: Continue with confidence. Declare intent, snapshot state.

---

## Level 2 Output (Turns 2-3) — URGENT

```
⚠️⚠️ CONTEXT DECAY [2/4]
Turns: 3 | Hierarchy: Complex

→ Context relationships becoming unclear
→ Knowledge symlinks accumulating
→ Consider: Summarize current state
→ Demand: Identify rot points NOW

# AGENT DECLARATION

**Role**: MAIN — hiveminder
**Hierarchy**: hiveminder > hiveplanner
**Mode**: COORDINATOR + RESEARCHER
**Context Level**: 2/4 ⚠️⚠️ URGENT

**Confidence Check**:
- [✓] Instructions clear
- [✓] Lineage valid
- [✗] SOTs connected
- [✓] Ready to proceed

**Intent**:
- Focus: Researching JWT vs OAuth2 tradeoffs
- Classification: project-related
- Orientation: discovery-research

**State**:
- Turns: 3
- SOTs Validated: 2
- Gaps: ["Missing parent PRD reference", "Architecture doc >48h old"]
- Compact Pending: No
```

**Agent Behavior**:
- Run `think_back({})` to refresh context
- Address gaps identified
- Consider `map_context` update
- Continue but with awareness

---

## Level 3 Output (Turn 4) — CRITICAL

```
⚠️⚠️⚠️ CONTEXT ROT [3/4]
Turns: 4 | Action: HALT FOR RECONSTRUCTION

→ Spawn subagents for context collection ONLY
→ DO NOT proceed with execution
→ Present findings for explicit confirmation
→ Output: Handoff prompt OR continuation decision

# AGENT DECLARATION

**Role**: MAIN — hiveminder
**Hierarchy**: hiveminder > hiveplanner > hivexplorer
**Mode**: COORDINATOR
**Context Level**: 3/4 ⚠️⚠️⚠️ CRITICAL

**Confidence Check**:
- [✗] Instructions clear
- [✓] Lineage valid
- [✗] SOTs connected
- [✗] Ready to proceed

**Intent**:
- Focus: Unclear — multiple pivots occurred
- Classification: project-related
- Orientation: discovery-research

**State**:
- Turns: 4
- SOTs Validated: 0
- Gaps: ["Lost original requirement", "3 pivots in 4 turns", "No clear parent doc"]
- Compact Pending: No

---
**HALT REQUIRED**: Context level 3: MAIN agent must seek explicit confirmation

Please confirm ONE of the following:

1. **Continue** — I understand the risks, proceed with current focus: [X]
2. **Pivot** — New direction: [specify]
3. **Handoff** — Generate session handoff prompt for fresh start
4. **Collect** — Spawn hivexplorer to gather context before deciding
```

**Agent Behavior**:
- STOP execution
- Do NOT proceed without explicit user choice
- Present clear options
- If user chooses "Collect", spawn hivexplorer

---

## Level 4 Output (Turn 5+) — EMERGENCY

```
🛑 MANDATORY STOP [4/4]
Context integrity compromised. Session must end or restart.

SUMMARY OF ATTEMPTED WORK:
- Turn 1: Declared intent to build auth system
- Turn 2: Researched JWT libraries
- Turn 3: Pivoted to OAuth2 research (user request)
- Turn 4: Started implementing JWT anyway (confusion)
- Turn 5+: Context lost, no clear direction

OPEN QUESTIONS:
1. JWT or OAuth2? (Pivot at turn 3 not resolved)
2. Where is the PRD? (Referenced but not found)
3. What was original requirement? (Lost after pivots)

CONFLICTS:
- Turn 3 said OAuth2, Turn 4 implemented JWT
- No parent architecture doc found
- SOT chain broken (docs/prd.md → 404)

---

**HANDOFF PROMPT** (copy to new session):

```
Project: hivemind-plugin
Last Focus: Authentication system (JWT vs OAuth2 unresolved)
Session ID: sess_abc123
Why Stopped: Context level 4 at turn 5

Required Context (read these first):
- docs/plans/PRD-*.md (find latest)
- docs/governance/architecture.md
- src/lib/auth/ (current auth code)

Open Decisions:
1. JWT vs OAuth2 choice
2. Library selection (jose vs passport)

DO NOT:
- Trust previous session's assumptions
- Proceed without re-reading PRD
- Implement until choice is confirmed
```

**Agent Behavior**:
- Output handoff prompt
- Refuse further autonomous action
- User must start fresh session with handoff prompt

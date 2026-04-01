# Absolute Entry Variables

Detailed protocol for evaluating the 7 entry variables at A-GATE 1
of `orchestrator-entry.md`. Used when the quick-check table is
insufficient — ambiguous signals, edge cases, or distrust triggers.

## Variable 1: Prompt Clarity

Assess whether the user's current message communicates a clear intent.

| Score | Criteria | Action |
|-------|----------|--------|
| CLEAR | Single actionable request, specific subject, bounded scope | Proceed |
| AMBIGUOUS | Multiple possible interpretations, vague subject, unbounded | Ask ONE question |
| ABSURD | Contradictory, impossible, or nonsensical request | BLOCK, escalate |

Edge cases:
- Multi-part prompt with one clear + one vague → classify as AMBIGUOUS,
  ask about the vague part only, proceed on the clear part
- Prompt references prior context not in current session → AMBIGUOUS,
  ask whether prior context should be recovered
- One-word prompt ("fix", "continue") → AMBIGUOUS, ask for scope

## Variable 2: Attached Documents

Verify presence and trustworthiness of any referenced documents.

| Score | Criteria | Action |
|-------|----------|--------|
| TRUSTED | File exists on disk, modified <48h, content matches description | Proceed |
| STALE | File exists but modified >48h ago | Flag, verify before trusting |
| ABSENT | Referenced file does not exist | Ask user for location |

## Variable 3: Active Agent Context

Determine whether session has sufficient agent context loaded.

| Score | Criteria | Action |
|-------|----------|--------|
| LOADED | Agent description present, tools accessible, skills available | Proceed |
| PARTIAL | Some context missing but core identity is clear | Flag, load missing pieces |
| EMPTY | No agent context, no identity, no tools | BLOCK, load agent context first |

## Variable 4: Hierarchy Link

Determine whether the work connects to a parent plan.

| Score | Criteria | Action |
|-------|----------|--------|
| LINKED | Work references a specific plan file or task ID | Proceed |
| STANDALONE | No parent plan, new work | Establish plan before proceeding |
| ORPHAN | References a plan that does not exist | BLOCK, ask to establish new plan |

## Variable 5: Work Type Classification

Classify the nature of the requested work.

| Score | Criteria | Action |
|-------|----------|--------|
| DEFINED | Clear work type: research, implement, review, debug | Route to correct workflow |
| FUZZY | Could be multiple work types | Ask ONE clarifying question |
| CONFLICT | Requested work type conflicts with agent capabilities | BLOCK, escalate |

Edge cases:
- "Research and implement" → classify as FUZZY, ask priority
- "Just look into it" → AMBIGUOUS between research and debug, ask intent
- User says "plan" → ALWAYS route to planning, never implement directly

## Variable 6: Disk Artifacts

Verify that referenced files actually exist on disk.

| Score | Criteria | Action |
|-------|----------|--------|
| PRESENT | All referenced files exist at stated paths | Proceed |
| PARTIAL | Some exist, some missing | Ask about missing files |
| ABSENT | None of the referenced files exist | BLOCK, verify project state |

## Variable 7: Artifact Trust

Assess freshness and reliability of disk artifacts.

| Score | Criteria | Action |
|-------|----------|--------|
| FRESH | Modified within 48 hours | TRUSTED |
| STALE | Modified 48h - 7 days | SUSPECT, flag for verification |
| AGED | Modified >7 days | DEGRADED, recommend re-verification |
| UNKNOWN | Cannot determine modification time | SUSPECT |

## Composite Scoring

After evaluating all 7 variables:

| Composite | Rule | Action |
|-----------|------|--------|
| PASS | ALL variables CLEAR or TRUSTED | Proceed to A-GATE 2 |
| SOFT-BLOCK | 1-2 variables AMBIGUOUS, no ABSURD/ABSENT | Ask ONE question, proceed on resolution |
| HARD-BLOCK | ANY variable ABSURD, >2 AMBIGUOUS, or ABSENT | BLOCK, escalate to user |

No partial credit. No "probably fine." The scoring is quantitative and binary per variable.

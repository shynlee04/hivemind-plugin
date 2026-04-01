# Subagent-Driven Development

## The Pattern
Fresh subagent per task + two-stage review (spec compliance first, then code quality).

## The Flow
1. Read plan → extract all tasks → create TodoWrite
2. Per task:
   a. Dispatch implementer subagent with full task text + context
   b. Implementer reports: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
   c. Dispatch spec compliance reviewer
   d. If issues → implementer fixes → reviewer re-checks
   e. Dispatch code quality reviewer (only after spec passes)
   f. If issues → implementer fixes → reviewer re-checks
   g. Mark task complete
3. After all tasks → final code reviewer for entire implementation

## Implementer Status Handling
- DONE → proceed to spec review
- DONE_WITH_CONCERNS → read concerns, then proceed
- BLOCKED → assess blocker, provide context or break task down
- NEEDS_CONTEXT → provide missing context, re-dispatch

## Model Selection
- Mechanical tasks (1-2 files, clear spec) → cheap/fast model
- Integration tasks (multi-file) → standard model
- Architecture/review → most capable model

## Red Flags
- Never skip reviews (spec OR quality)
- Never start on main/master without consent
- Never dispatch multiple implementers in parallel (conflicts)
- Never accept "close enough" on spec compliance

# Context Repair Checklists

> Step-by-step checklists for each repair scenario. Follow the matching checklist exactly — do not freestyle repairs.

## Checklist 1: Post-Compaction Repair

Context was compressed. Some information may be lost.

1. [ ] Identify what persistent stores exist (saved decisions, anchors, knowledge)
2. [ ] Reload the most recent persistent state
3. [ ] Compare current understanding to the reloaded state — list gaps
4. [ ] For each gap: can it be recovered from persistent stores?
   - YES → Reconstruct from store
   - NO → Flag as "context loss — requires re-investigation or user clarification"
5. [ ] Re-declare trajectory aligned with recovered state
6. [ ] Checkpoint the recovered context immediately (to survive next compaction)

## Checklist 2: Post-Gap Repair (Hours/Days Between Sessions)

1. [ ] Find the last active session or conversation
2. [ ] Trace: what was the declared intent? What work was completed?
3. [ ] Check persistent stores for saved decisions
4. [ ] Check version control: what changed since last session?
5. [ ] Declare intent as "continuing [topic]" with evidence from trace
6. [ ] If intent is unclear → ask user ONE clarifying question before proceeding

## Checklist 3: Post-Chaos Repair (Multiple Pivots)

User changed direction multiple times. The work tree has branches.

1. [ ] View the full hierarchy of work — each pivot should be visible
2. [ ] Identify the FINAL direction (most recent user instruction)
3. [ ] Anchor a decision at the stable point with reasoning
4. [ ] Mark abandoned branches as completed/abandoned
5. [ ] Prune if the hierarchy allows it
6. [ ] Set trajectory to the final direction
7. [ ] Checkpoint immediately

## Checklist 4: Post-Handoff Repair (Subagent Context Switch)

Returning from subagent execution, or receiving handoff from another agent.

1. [ ] Read the cycle export / delegation result
2. [ ] Verify: does the result match what was delegated?
3. [ ] Integrate findings into current context
4. [ ] Update the work hierarchy with the subagent's outcome
5. [ ] Resume from the correct parent-level position (not the subagent's position)

## Universal Repair Principle

After ANY repair, always:
1. State what you believe the current situation is
2. State what you plan to do next
3. Checkpoint both of these immediately

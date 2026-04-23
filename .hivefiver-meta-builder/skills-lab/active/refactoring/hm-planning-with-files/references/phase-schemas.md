# Phase Schemas

Don't force a rigid waterfall. Generate phases based on what the task needs:

| Task Type | Phase Pattern |
|-----------|--------------|
| Research | Discover, Synthesize, Deliver |
| Debugging | Reproduce, Isolate, Fix, Verify |
| Feature | Design, Implement, Test, Polish |
| Refactoring | Analyze, Restructure, Verify |
| Skill Authoring | Audit, Draft, Validate, Iterate |
| Generic | Plan, Execute, Verify |

**Rules:** Minimum 2 phases. Maximum 7 (beyond 7, split into sub-tasks). Each phase needs deliverables (checkboxes) and a status field.

## The 5-Question Sanity Check

At any point, the agent should be able to answer:

| Question | Answer Source |
|----------|---------------|
| Where am I? | Current phase in task_plan.md |
| Where am I going? | Remaining phases |
| What's the goal? | Goal statement |
| What have I learned? | findings.md |
| What have I done? | progress.md |

If unable to answer all 5, re-read the files.

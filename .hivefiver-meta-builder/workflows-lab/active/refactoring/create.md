# Create Workflow — Meta-Concept Creation

## Objective
Route a meta-concept creation request to the appropriate Hivefiver specialist agent, verify the output, and report completion.

## Execution Flow

### Step 1: Load Project State
```bash
# Check existing meta-concepts
ls .opencode/agents/ 2>/dev/null
ls .opencode/commands/ 2>/dev/null
ls .opencode/skills/ 2>/dev/null

# Check git state
git status --short
git log --oneline -3
```

### Step 2: Classify Intent
Map user request to specialist:

| User Says | Route To | Specialist Agent |
|-----------|----------|-----------------|
| "create a skill" | use-authoring-skills | hivefiver-skill-author |
| "create an agent" | agents-and-subagents-dev | hivefiver-agent-builder |
| "create a command" | command-dev | hivefiver-command-builder |
| "create a tool" | custom-tools-dev | hivefiver-tool-builder |

If intent is ambiguous, ask up to 3 clarifying questions (max).

### Step 3: Load Relevant Skills
Load skills based on routing decision. Max 3 skills per stack.

### Step 4: Dispatch to Specialist
Construct the delegation prompt with:
- Full task text (not file references)
- Scene-setting context (2-3 sentences)
- Scope (specific files/paths to include and exclude)
- Output format (status + specific requirements)

### Step 5: Collect and Verify
Check specialist status:
- DONE → Two-stage review (spec compliance, then quality)
- DONE_WITH_CONCERNS → Read concerns, address if correctness
- NEEDS_CONTEXT → Provide missing context, re-dispatch
- BLOCKED → Assess and escalate to user

### Step 6: Report
Return structured completion report.

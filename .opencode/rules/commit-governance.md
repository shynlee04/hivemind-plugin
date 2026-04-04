# Git Commit Governance

## Rules

- Commit message format: `phase: what changed — why it matters`
- Commit after each meaningful change (subagent returns, phase completes, gate passes)
- Never accumulate changes across multiple phases without committing
- If it's not in git, it doesn't exist

## Agent Commit Boundaries

Agents may only manage commits for their **own work**. They do NOT:
- Constrain or override commits from other development activity
- Block commits initiated by the user or other agents outside their scope
- Reorder or amend commits they did not create

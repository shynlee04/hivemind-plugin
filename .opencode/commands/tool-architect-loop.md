---
description: Start an iterative build loop for an OpenCode plugin, custom tool set, or CLI utility. Creates prd.json from requirements, then runs build-verify-commit cycles until all stories pass.
argument-hint: <what-to-build> or path-to-existing-prd.json
---

Load the `tool-architect-loop` skill, then proceed.

## Input

User wants to build: $ARGUMENTS

## Process

### Phase 0: Determine Starting Point

If the argument is a path to an existing prd.json:
1. Read the file
2. Find the first story with `passes: false` and no blocking dependencies
3. Resume the loop from that story

If the argument is a description:
1. Load the `opencode-tool-architect` skill for design context
2. Classify the build target (plugin, tool, CLI script, tool set)
3. Ask clarifying questions if needed
4. Generate a prd.json using the appropriate template from `tool-architect-loop/templates/`

### Phase 1: Create prd.json

Based on the classification, create a prd.json file:

1. Break requirements into right-sized user stories (one per agent context window)
2. Set dependency ordering (scaffold -> core -> extensions -> tests -> docs)
3. Add quality gates (tsc, tests, lint as appropriate)
4. Append quality gates to each story's acceptance criteria
5. Save to `tasks/[project-name].prd.json`

Ask user to review before proceeding.

### Phase 2: Build Loop

For each story in priority/dependency order:

```
1. Read story + acceptance criteria
2. Implement the changes
3. Verify EACH criterion:
   - Run quality gates
   - Check file existence
   - Verify types/signatures
4. If ALL pass:
   - Mark passes: true in prd.json
   - Commit: "US-XXX: <title>"
   - Report progress
5. If ANY fail:
   - Fix and re-verify
   - If stuck after 3 attempts, ask user for help
```

### Phase 3: Integration Check

After all stories pass:
1. Run all quality gates one final time
2. Verify cross-story integration
3. Report final status
4. Suggest documentation updates

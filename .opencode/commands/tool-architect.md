---
description: Design and build OpenCode plugins, custom tools, CLI scripts, or bin utilities. Handles clarification, research, brainstorming, design, scaffold, and implementation.
argument-hint: <task-or-question>
---


Load the `opencode-tool-architect` skill, then proceed.


## Delegation to / Coordinate with 
-[agent](tool-architect-scaffold.md)
-[agent](tool-architect-loop.md)

## Input

The user wants: $ARGUMENTS

## Process

1. **Classify the request:**
   - Is this a DESIGN question? (what to build, hook vs tool vs script)
   - Is this a SCAFFOLD request? (create project structure)
   - Is this an IMPLEMENT request? (write the actual code)
   - Is this a REFACTOR request? (improve existing tool/plugin)
   - Is this a CLARIFICATION needed? (ambiguous intent)

2. **If ambiguous, ask:**
   - What problem does this solve?
   - Who calls it (agent, human, hook)?
   - What project is this for?
   - Does something similar already exist?

3. **If clear, execute the appropriate mode:**

### Design Mode
- Present the decision tree (hook vs tool vs script vs command)
- Apply the 5 agent-native design principles
- Run the 7-point pitfall checklist
- Produce an interface spec (args, output, hooks)

### Scaffold Mode
- Create directory structure
- Write all starter files from skill templates
- Set up package.json if needed
- Provide next-steps instructions

### Implement Mode
- Write production code following OpenCode patterns
- Include error handling and graceful degradation
- Write or update tests
- Verify with typecheck

### Refactor Mode
- Read and analyze existing code
- Identify principle violations
- Propose changes with rationale
- Implement preserving behavior

4. **Always verify** that the result follows all 5 design principles.

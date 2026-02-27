---
name: hivefiver-ideate
description: Enter the Creative Ideating Room to brainstorm and lock down specs
  via Q.U.A.N.T. Matrix.
owner_agent: hivefiver
kind: alias
alias_resolved_to: hivefiver ideate
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
---

# /hivefiver ideate

Enter the Creative Ideating Room to transform vague ideas into deterministic, gapless specifications.

## Usage

```
/hivefiver ideate [idea_description]
/hivefiver ideate --random-stack
```

## Execution Pipeline

1. Load the `creative-ideating-room` skill
2. If `--random-stack` is passed, randomize a bleeding-edge framework stack
3. Research the stack's integration patterns via DeepWiki/GitHub MCP tools
4. Execute the Ideation Squeeze until the `hivemind_ideate` tool (action: evaluate) passes all 5 Q.U.A.N.T. dimensions
5. Save the finalized spec and proceed to `hivemind_session` (action: start) for implementation

## Example

```
/hivefiver ideate "Build a real-time collaborative document editor with offline support"
```

The agent will:
1. Draft requirements with MECE state matrices
2. Strip all ambiguous language
3. Map every feature to Given/When/Then test vectors
4. Ground all entities against the codebase via code-intel
5. Submit to Q.U.A.N.T. gate — iterate until 100/100 score

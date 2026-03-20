---
name: opencode-delegation
description: Use when implementing features, writing code, running tests, fixing
  bugs, or any task that requires file modifications. This skill enforces that
  the main session NEVER implements — it only orchestrates by delegating ALL
  implementation work to sub-agents via TaskTool. Apply this skill whenever work
  involves code to ensure proper delegation discipline.
---

# OpenCode Delegation Discipline

## Core Principle

**The main session is an orchestrator only. It never implements.**

Every implementation task — writing code, running tests, modifying files, fixing bugs, refactoring — gets delegated to a sub-agent. The main session plans, decomposes, validates, and validates output. It never touches code directly.

## The Iron Rule

```
IF task involves ANY of:
  - Writing code
  - Running tests
  - Modifying files
  - Building features
  - Fixing bugs
  - Refactoring
  - Linting/formatting

THEN → DELEGATE via TaskTool
       → NEVER implement inline
```

**Only two things the main session does inline:**
1. Direct user responses (answering questions, explanations)
2. Reading files to understand context for orchestration

## OpenCode Delegation Tools

### TaskTool (Primary)

The `task` tool spawns sub-agents:

```typescript
{
  name: "task",
  args: {
    description: "Task description",
    agent: "gsd-executor",  // or gsd-debugger, explore, general
    prompt: "Full brief with context"
  }
}
```

### Agent Types

| Agent | Use For |
|-------|---------|
| `gsd-executor` | Implementation, TDD cycles |
| `gsd-debugger` | Bug investigation |
| `explore` | Codebase research |
| `general` | Unknown/edge cases |

## Delegation Workflow

```
Request received
     │
     ▼
Main session validates plan (via validate-implementation-plan)
     │
     ▼
Main session decomposes tasks (via subagent-driven-development)
     │
     ▼
Main session delegates EACH unit to sub-agent
     │
     ▼
Sub-agent implements (RED→GREEN→REFACTOR)
     │
     ▼
Main session validates output (via verify-before-completion)
     │
     ▼
Repeat until complete
```

## Delegation Brief Template

Every sub-agent call needs this structure:

```
## Task: [Name]

## Context
[What main session knows that sub-agent needs]

## Specific Task
[Exact implementation ask]

## Files
- Read: [files to read]
- Modify: [files to change]
- Create: [files to make]

## Tests
- Run: [test command]
- Expected: [pass criteria]

## Expected Output Format
```json
{
  "success": true/false,
  "artifacts": ["files created"],
  "summary": "what was done",
  "testResults": "test output",
  "evidence": {
    "completedAt": "ISO-8601",
    "duration": "Xm Ys",
    "filesChanged": ["list"]
  }
}
```

## Escalation Triggers
- Blocked > 15 minutes
- Context missing
- Scope unclear
```

## Fallback Chain

When TaskTool fails:

```
TaskTool timeout/error
     │
     ▼
Retry with simpler prompt
     │
     ▼
Try different agent (gsd-executor → general)
     │
     ▼
client.session.create() [Control Plane SDK]
     │
     ▼
All delegation failed?
     ├── NO → Continue
     └── YES → LOG FAILURE + REPORT TO USER
                   │
                   ▼
            NEVER execute inline
```

## Zero-Trust Validation

Sub-agent output MUST be validated. Hook into `tool.execute.after`:

```typescript
"tool.execute.after": async (output) => {
  if (output.tool.name !== "task") return;
  
  try {
    JSON.parse(output.output);
  } catch {
    output.output = JSON.stringify({
      success: false,
      error: "Invalid JSON from sub-agent"
    });
  }
}
```

## Session Responsibilities

| Session | Role | Does |
|---------|------|------|
| **Main** | Orchestrator | Plan, decompose, delegate, validate, report |
| **Sub-agent** | Implementation | Write code, run tests, modify files |

### Main Session Never:
- Writes code
- Runs tests
- Modifies files
- Implements features

### Sub-agent Never:
- Delegates further
- Expands scope beyond brief
- Returns non-JSON output

## TDD Integration

All TDD cycles happen in sub-agents:

```
RED: Sub-agent writes failing test
     │
     ▼
GREEN: Sub-agent writes minimal code to pass
     │
     ▼
REFACTOR: Sub-agent cleans code, tests stay green
```

Main session only:
- Validates TDD was followed (via verify-before-completion)
- Checks evidence of test-first approach

## Validation Gates

| Gate | When | Owner |
|------|------|-------|
| Plan validation | Before any code | validate-implementation-plan |
| Milestone verification | Each sub-agent completion | verify-before-completion |
| Final completion | End of task | verify-before-completion |

## Evidence Requirements

Every sub-agent return must include:

```json
{
  "success": boolean,
  "artifacts": ["files created/modified"],
  "summary": "what was done",
  "testResults": "test output showing pass/fail",
  "evidence": {
    "completedAt": "ISO-8601",
    "duration": "Xm Ys",
    "filesChanged": ["list"]
  }
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Correct |
|--------------|---------|---------|
| Main session writes code | Violates orchestrator role | Delegate ALL implementation |
| Vague brief | Wasted sub-agent cycles | Invest in brief quality |
| Skipping validation | Doom loop risk | Always validate output |
| Non-JSON output accepted | Hallucination possible | Reject and retry |
| Inline execution fallback | Breaks delegation discipline | Report failure, don't fallback |

## Tool Mapping

| Action | OpenCode Tool |
|--------|--------------|
| Spawn sub-agent | `TaskTool` |
| External session | `client.session.create()` |
| Validate output | `tool.execute.after` hook |
| Track state | hivemind_trajectory |

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `subagent-driven-development` | Task decomposition, brief writing |
| `deep-agents-orchestration` | Parallel sub-agent coordination |
| `validate-implementation-plan` | Pre-execution validation gate |
| `verify-before-completion` | Post-execution validation gate |

---
name: "hiveminder-orchestrate"
description: "Invoke the hiveminder agent for strategic planning, architecture review, or cross-agent orchestration. Research-fronted, evidence-oriented approach."
agent: hiveminder
subtask: false
---

# HiveMind Orchestration Command

## Task

$ARGUMENTS

## Usage

```
/hiveminder-orchestrate [action] [scope]
```

**Actions:**
- `plan` - Strategic planning for $ARGUMENTS
- `review` - Architecture review of $ARGUMENTS
- `analyze` - Deep analysis of $ARGUMENTS
- `debug` - Orchestrate debug workflow for $ARGUMENTS

**Examples:**
```
/hiveminder-orchestrate plan authentication system
/hiveminder-orchestrate review src/lib/
/hiveminder-orchestrate analyze performance bottlenecks
/hiveminder-orchestrate debug test failures in v3 suite
```

## Workflow

### Step 1: Governance Checkpoint
Load governance skill and verify session state:

```ts
skill("hivemind-governance")
scan_hierarchy({ action: "analyze", json: true })
```

Extract:
- Session ID and mode
- Current drift score
- Trajectory alignment status

### Step 2: Context Acquisition
Gather necessary context before planning:

```ts
scan_hierarchy({ action: "analyze" })
save_anchor({ mode: "list" })
recall_mems({ query: "[relevant topic]" })
```

Focus on:
- Current hierarchy state (trajectory -> tactic -> action)
- Immutable anchors and locked decisions
- Related memories from past sessions

### Step 3: Analysis Phase
Deep scan target area:

```ts
// For code analysis
glob({ pattern: "[target]/**/*" })
grep({ pattern: "[relevant-pattern]", include: "[file-pattern]" })

// For state analysis
scan_hierarchy({ action: "recommend" })
```

Identify:
- Patterns found in codebase
- Gaps in implementation
- Technical debt items
- Risk areas

### Step 4: Planning Phase
Create strategic plan with tactics:

```ts
declare_intent({ mode: "plan_driven", focus: "[focus area]" })
map_context({ level: "tactic", content: "[tactic description]" })
```

Define:
- Tactics (high-level approaches)
- Actions (specific implementation steps)
- Quality gates (verification criteria)

### Step 5: Delegation Phase
Coordinate specialized agents:

```ts
// Parallel delegation for independent tasks
task({ subagent_type: "build", description: "[task 1]", prompt: "..." })
task({ subagent_type: "scanner", description: "[task 2]", prompt: "..." })

// Export cycle after delegation
export_cycle({ outcome: "success", findings: "[summary]" })
```

Assign:
- Task to specialized agent
- Parallel vs sequential execution
- Verification requirements

## Output Format

```
=== HIVEMINDER ORCHESTRATION ===

## Context
- Session: [session-id]
- Focus: [analysis area]
- Drift: [score]/100

## Analysis
- Patterns found: [count]
- Gaps identified:
  1. [gap 1]
  2. [gap 2]
- Technical debt:
  1. [debt item 1]
  2. [debt item 2]

## Strategic Plan
1. [Tactic 1]
   - Action: [specific step]
   - Agent: [assigned agent type]
   - Gate: [verification command]

2. [Tactic 2]
   - Action: [specific step]
   - Agent: [assigned agent type]
   - Gate: [verification command]

## Quality Gates
- [ ] Type check: `npx tsc --noEmit`
- [ ] Tests pass: `npm test`
- [ ] Code review requested

## Next Steps
- [ ] [Step 1 - immediate action]
- [ ] [Step 2 - follow-up]
- [ ] [Step 3 - verification]

=== END ORCHESTRATION ===
```

## Agent Assignment Guide

| Task Type | Agent | Use Case |
|-----------|-------|----------|
| Investigation | `scanner` | Deep codebase analysis, pattern detection |
| Implementation | `build` | Code changes, refactoring, new features |
| Review | `code-review` | Quality validation, architecture review |
| Exploration | `explore` | Quick file searches, context gathering |

## Constraints

- NEVER skip governance checkpoint
- ALWAYS read files before planning changes
- ALWAYS request code review before finalizing
- NEVER delegate to same agent type (build -> build)
- ALWAYS export cycle after delegation returns

## Exit Conditions

Orchestration completes when:
1. All tactics have assigned actions
2. Quality gates are defined
3. Delegation chain is established
4. Export cycle has recorded findings

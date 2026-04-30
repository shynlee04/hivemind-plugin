# Command Anatomy — OpenCode Custom Commands

## Full Command Template

```markdown
---
description: "[Specific — shown in TUI. Must include what it does AND when to use it]"
agent: [which agent runs this — must match an existing agent name]
subtask: [true = spawns subagent, false = runs in main session]
---

## Current State
!`git status --short`
!`git log --oneline -5`

## Your Job
1. Load the right skills (specify which ones)
2. [Procedural steps — what to do]
3. [Verification — how to know it worked]

## Anti-Patterns (DO NOT)
- Do NOT [specific thing that breaks in non-interactive shell]
- Do NOT [specific thing that breaks the command pattern]
```

## $ARGUMENTS Usage

Pass user input into command templates:

```markdown
---
description: "Create a new React component with TypeScript support."
---

Create a new React component named $ARGUMENTS with TypeScript support.
Include proper typing and basic structure.
```

Usage: `/component Button` → $ARGUMENTS becomes "Button"

Positional parameters: `$1`, `$2`, `$3`, etc.

```markdown
Create a file named $1 in the directory $2 with content: $3
```

Usage: `/create-file config.json src "{ \"key\": \"value\" }"`

## !bash Injection

Inject shell command output into the prompt:

```markdown
## Current State
!`git status --short`
!`git log --oneline -5`
!`ls task_plan.md findings.md progress.md 2>/dev/null || echo "No planning files"`
```

Commands run in project root. Output becomes part of the prompt.

## @file References

Include file content in the prompt:

```markdown
Review the component in @src/components/Button.tsx.
Check for performance issues and suggest improvements.
```

## agent: and subtask:

- `agent:` — specifies which agent runs the command (must match existing agent name)
- `subtask: true` — forces subagent invocation (doesn't pollute primary context)
- `subtask: false` — runs in main session

## Worked Example: /deep-tech-research

```markdown
---
description: "Deep technical research on any topic. Auto-selects investigation depth and spawns research subagents. Use when you need comprehensive research, architecture analysis, or cross-stack investigation."
agent: coordinator
subtask: true
---

You are running deep research on: $ARGUMENTS

## Current State
!`git log --oneline -5`
!`ls task_plan.md findings.md progress.md 2>/dev/null || echo "No planning files"`

## Your Job

1. **Load skills:**
   - Load `planning-with-files` — create investigation triplet
   - Load `user-intent-interactive-loop` — probe if topic is ambiguous (max 3 questions)
   - Load `coordinating-loop` — for multi-subagent dispatch

2. **Classify investigation depth:**
   - QUICK (1 subagent): narrow topic, 1-2 files → dispatch one researcher
   - STANDARD (2-3 subagents): spans multiple domains → parallel researchers, synthesize
   - DEEP (multi-cycle): cross-stack analysis → plan phases, dispatch per phase

3. **Dispatch subagents using investigator template from coordinating-loop references**

4. **After each subagent returns:**
   - Write findings to findings.md
   - Check status: DONE → continue, BLOCKED → assess and escalate

5. **Final synthesis:**
   - Combine all findings into findings.md
   - Report: summary, key findings, resources, gaps remaining

## Anti-Patterns (DO NOT)
- Do NOT investigate yourself — delegate to subagents
- Do NOT pass session history to subagents — construct exact context
- Do NOT skip writing findings to disk
- Do NOT claim completion without evidence — cite file:line or URL
```

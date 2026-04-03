# File Structure — Dynamic Schema

## Overview

Three files form the planning system. Each has a specific role and update discipline.

## Schema Rules

### Dynamic Phase Generation

Do NOT use a fixed 5-phase waterfall. Generate phases based on task type:

```
Task classification:
1. What is the user asking for?
2. Does it involve code changes? (Yes → Feature/Debug/Refactor)
3. Does it involve research? (Yes → Research)
4. Does it involve creating skills/docs? (Yes → Authoring)
5. Default → Generic (Plan → Execute → Verify)
```

Phase count: 2-7. Beyond 7, split into sub-tasks with their own planning files.

## task_plan.md

**Role:** Phase tracker and goal anchor. Re-read before every major decision.

### Required Sections

| Section | Purpose | Content Rules |
|---------|---------|--------------|
| `# Task Plan: <title>` | Title line | Brief, specific description |
| `## Goal` | Single north-star sentence | One sentence. No lists. No sub-bullets. |
| `## Current Phase` | Active phase identifier | e.g., "Phase 2" |
| `## Phases` | Phase definitions | 2-7 phases. Each has checkboxes + `**Status:**` |
| `## Decisions Made` | Technical choices | Table: Decision \| Rationale |
| `## Errors Encountered` | Failure log | Table: Error \| Attempt \| Resolution |

### Phase Format

Each phase MUST follow this structure:

```markdown
### Phase N: <Descriptive Title>
- [ ] <actionable item 1>
- [ ] <actionable item 2>
- **Status:** pending | in_progress | complete
```

### Status Transitions

```
pending → in_progress → complete
```

- Only ONE phase can be `in_progress` at a time
- Phases can be added mid-task if scope expands
- Phases can be removed if proven unnecessary (log in Decisions Made)

### Optional Sections

| Section | When to Include |
|---------|----------------|
| `## Key Questions` | When the task has unknowns that guide decisions |
| `## Notes` | When additional context doesn't fit elsewhere |

### What NOT to Include

- Web search results → go to `findings.md`
- Full error stack traces → summarize in Errors table, full trace in `progress.md`
- Code snippets → go to `findings.md` or deliverable files
- Progress logs → go to `progress.md`

## findings.md

**Role:** Knowledge store. Everything discovered, decided, or learned.

### Required Sections

| Section | Purpose | Content Rules |
|---------|---------|--------------|
| `## Requirements` | What the user asked for | Extract from user request. Bullet list. |
| `## Research Findings` | Discoveries from exploration | Key facts, API details, patterns found |
| `## Technical Decisions` | Architecture and implementation choices | Table: Decision \| Rationale |
| `## Issues Encountered` | Problems and resolutions | Table: Issue \| Resolution |
| `## Resources` | URLs, file paths, references | Bullet list with links |

### The 2-Action Rule

After every 2 view/search/browser operations, update `findings.md`. Visual/multimodal content does not persist in context — capture it as text immediately.

### Optional Sections

| Section | When to Include |
|---------|----------------|
| `## Visual Findings` | When images, PDFs, or screenshots were viewed |
| `## Code Patterns` | When recurring patterns were discovered in the codebase |

## progress.md

**Role:** Session log. Chronological record of what happened.

### Required Sections

| Section | Purpose | Content Rules |
|---------|---------|--------------|
| `## Session: <date>` | Group actions by date | ISO date format: YYYY-MM-DD |
| Per-phase log | Actions, files, status | Under each session, group by phase |
| `## Test Results` | Verification outcomes | Table: Test \| Expected \| Actual \| Status |
| `## Error Log` | Detailed error entries | Table: Timestamp \| Error \| Attempt \| Resolution |

### Per-Phase Log Format

```markdown
### Phase N: <Title>
- **Status:** pending | in_progress | complete
- **Started:** <timestamp>
- Actions taken:
  - <specific action 1>
  - <specific action 2>
- Files created/modified:
  - <path> (created | modified)
```

### Update Triggers

Update `progress.md` when:
- A phase status changes
- An error occurs
- A test is run
- Files are created or significantly modified
- Session is about to end

## File Relationships

```
task_plan.md  ← Goal + phases (read frequently, updated at phase boundaries)
findings.md   ← Knowledge (append-only during execution, read when re-orienting)
progress.md   ← Log (append-only, read during recovery)
```

### Read Frequency

| File | When to Read |
|------|-------------|
| `task_plan.md` | Before every Write/Edit/Bash, after every 5 tool calls, at session start |
| `findings.md` | When starting a new phase, when making technical decisions |
| `progress.md` | At session start (recovery), when debugging what went wrong |

### Write Frequency

| File | When to Write |
|------|--------------|
| `task_plan.md` | At session start (create), at phase boundaries (update status), when errors occur |
| `findings.md` | After every 2 view/search operations, after making decisions |
| `progress.md` | After completing actions, after errors, at session end |

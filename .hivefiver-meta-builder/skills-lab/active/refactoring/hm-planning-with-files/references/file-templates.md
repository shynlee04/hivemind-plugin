# File Templates

## task_plan.md — The North Star

Answers: "Where am I, where am I going, and what decisions got me here?"

```markdown
# Task Plan: [Descriptive Title]

## Goal
[One sentence. The north star. Every action should move toward this.]

## Current Phase
Phase N: [name]

## Phases

### Phase 1: [Descriptive name, not "Phase 1"]
- [ ] Specific deliverable
- [ ] Specific deliverable
**Status:** pending | in_progress | complete

### Phase 2: [Descriptive name]
- [ ] ...
**Status:** pending

## Decisions Made
| Decision | Rationale | When |
|----------|-----------|------|
| Used X over Y | Because Z | Phase 1 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default |
```

## findings.md — The Knowledge Store

Answers: "What have I learned that's too important to lose?"

```markdown
# Findings: [Task Title]

## Requirements
[What the user actually needs, extracted from conversation]

## Research Findings
[Key discoveries from exploration, web searches, code analysis]

## Technical Decisions
| Choice | Rationale | Reference |
|--------|-----------|-----------|
| X over Y | Because Z | file:line or URL |

## Resources
[URLs, file paths, API references discovered during work]
```

Critical rule: Web/search results go here, NOT in task_plan.md. Keep the plan lean.

## progress.md — The Session Log

Answers: "What happened, when, and what's the handoff?"

```markdown
# Progress: [Task Title]

## Session: [Date]
### Phase: [current phase name]
- **Started:** [time or relative marker]
- **Actions:**
  - Did X (result: Y)
  - Did Z (result: W)
- **Files Modified:** file1.ts, file2.ts
- **Errors:** [any errors encountered]
- **Handoff:** [what the next agent/session needs to know]
```

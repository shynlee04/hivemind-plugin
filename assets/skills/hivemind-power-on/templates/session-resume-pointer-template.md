# Session Resume Pointer Template

Captures where a session left off, for clean resume after disconnect/compact.

```markdown
# Session Resume Pointer

**Session ID:** `<ses_xxx>`
**Last tool call:** `<tool-name>`
**Last activity:** `<ISO timestamp>`

## State

- **Open delegations:** <list with IDs>
- **In-flight files:** <list with paths>
- **Uncommitted work:** <list with paths + brief description>

## Resume steps

1. <step 1 — e.g., "Read .hivemind/session-tracker/ses_xxx/journal.md">
2. <step 2 — e.g., "Poll open delegations with delegation-status">
3. <step 3 — e.g., "Continue from <specific file:line>">

## Risks

- <risk 1 — e.g., "compaction may have lost the last 3 tool results">
- <risk 2>

## Open questions

- <question 1>
```

## When to use

- Before any long-running dispatch (5+ minutes expected)
- After compaction
- Before pause/hand-off

## Storage

Save as `.hivemind/session-tracker/<session-id>/resume-pointer.md`.

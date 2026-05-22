# Execute Slash Command Live UAT — 2026-05-22

## Scope

Validate `execute-slash-command` against a command that does not define `agent` or `subtask` in frontmatter, then supply those fields as one-shot tool overrides.

## Test Command

Command file: `.opencode/commands/test-echo.md`

```markdown
---
description: Echo back the user's message
---

Echo back exactly what the user said: $ARGUMENTS
```

## Live UAT Attempt

Tool input:

```json
{
  "command": "test-echo",
  "arguments": "hello world from on-the-fly subtask",
  "agent": "hm-l2-general",
  "subtask": true
}
```

## Result

**Verdict:** FAIL for the pre-fix implementation.

Evidence:

| Source | Finding |
|--------|---------|
| `session-ses_1b48.md:12903-12918` | `execute-slash-command` hung until the user aborted the tool |
| `session-ses_1b48.md:12932-12947` | The subtask payload appeared only after cancellation |

## Root Cause

The tool awaited `client.session.prompt()` while the same OpenCode session was already busy executing the tool. This reproduces the known busy-session SDK deadlock pattern: the SDK request cannot complete until the active tool execution exits, but the tool cannot exit while waiting for the SDK request.

## Remediation Applied

Subtask dispatch was changed from awaited SDK execution to deferred scheduling:

- The command body is expanded immediately.
- The tool returns a scheduled success result immediately.
- `client.session.prompt()` runs after the tool returns.
- Errors from the deferred call are caught and logged with `[Harness]` prefix.

## Current Evidence After Remediation

| Gate | Result |
|------|--------|
| `npx vitest run tests/tools/execute-slash-command.test.ts` | Passed, 6/6 |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

## Remaining UAT

Restart OpenCode/plugin runtime after the deferred fix, then rerun the same `test-echo` one-shot override case. Runtime readiness remains pending until the restarted live UAT proves the deferred prompt is accepted without user cancellation.

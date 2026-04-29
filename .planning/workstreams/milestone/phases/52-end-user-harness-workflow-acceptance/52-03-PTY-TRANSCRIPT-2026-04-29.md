# Phase 52 PTY Transcript — 2026-04-29

## Planned Action Sequence

1. `run-background-command` with `action: run`, `command: "bash"`, `args: ["-lc", "printf 'phase52-ok\\n'; sleep 30"]`
2. `run-background-command` with `action: output`, using returned `sessionId` and `offset: 0`
3. `run-background-command` with `action: list`
4. `run-background-command` with `action: terminate`, using the same `sessionId`

## Required Capture Fields

| Field | Value |
| --- | --- |
| parentSessionId | `ses_226e89cd1ffetJwNcJdzeGN1jY` |
| delegationId | `35b952b5-ef5d-4685-9f41-93d8ca0d936b` |
| ptySessionId | Pending live execution |
| run output | Pending live execution |
| list visibility | Pending live execution |
| terminate metadata | Pending live execution |
| accessible-view-terminal note | Contextual only unless grounded to a real runtime/repo artifact |

## Live Output Sections

### Run

Pending.

### Output

Pending.

### List

Pending.

### Terminate

Pending.

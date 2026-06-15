---
description: "Session workflow: discover sessions → inspect hierarchy → check status → resume or stack → report."
---

# hm-session

## Goal
Manage Hivemind sessions: discover active sessions via session-tracker, inspect delegation hierarchy, check status, resume interrupted sessions, or stack new work onto existing sessions.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Session Management | hm-orchestrator | Discovers, inspects, and manages sessions |

## Execution Phases
1. **Discover Sessions**: Use session-tracker to list all sessions. Filter by status (active, completed, error).
2. **Inspect Hierarchy**: Use session-hierarchy get-manifest for selected sessions to view delegation tree.
3. **Check Status**: Use hivemind-session-view for unified view of session state + delegations.
4. **Determine Action**:
   - resume: Use task tool with session task_id to continue interrupted session.
   - stack: Use delegate-task with parentSessionId in context to attach new work.
5. **Report**: Write session-report.md with findings and action taken.

## Exit Criteria
- Sessions discovered and displayed.
- Action applied (resume/stack) if requested.
- Session report written with status and hierarchy info.

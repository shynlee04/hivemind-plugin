---
description: "Archive the current session, preserve context, and prepare for the next session handoff."
agent: hiveminder
subtask: false
---

# HiveMind Session Compact

Perform a clean session archival with context preservation.

## Pre-Compact Checklist
1. Review the active plan or progress artifacts for unfinished work.
2. Summarize completed work, remaining blockers, and the exact next step.
3. If the session produced reusable delegation output, capture it in the live handoff/task surfaces rather than inventing legacy memory calls.

## Compact
Session compaction is handled by the OpenCode session compaction flow plus HiveMind's `experimental.session.compacting` hook. Do not call removed legacy tools such as `compact_session`.

## Post-Compact
- Inform the user the session was archived
- Provide the continuation summary and next bounded task
- Point the next session to the current planning artifacts and any handoff output

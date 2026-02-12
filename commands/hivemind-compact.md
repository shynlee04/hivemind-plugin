---
description: "Archive the current session, preserve context, and prepare for the next session."
---

# HiveMind Session Compact

Perform a clean session archival with context preservation.

## Pre-Compact Checklist
1. Call `check_drift` — verify you completed what was declared
2. Review any pending items: are there uncompleted actions in the hierarchy?
3. If there are important decisions or patterns learned, call `save_mem` to persist them

## Compact
Call `compact_session({ summary: "<brief summary of what was accomplished>" })`

## Post-Compact
- Inform the user the session was archived
- Show the archive location
- Remind them to call `declare_intent` when starting new work

---
name: "hivefiver-validate"
description: "Alias command for /hivefiver validate to run quality gates, schema checks, and export readiness controls."
---

# HiveFiver Validate Alias

Run `/hivefiver validate` behavior.

## Required Behavior
1. Run schema checks.
2. Verify TODO/story lineage.
3. Verify confidence labeling.
4. Emit remediation checklist for any failing gate.

## Output Contract
- `alias_resolved_to`: `/hivefiver validate`
- `next_command`: `/hivefiver-ralph-bridge`

#!/bin/bash
# pre-tool-use.sh — Read first 30 lines of task_plan.md to keep goals in context
# Hook: Runs before every tool use to refresh goals into attention
# Returns {"decision": "allow"} — this hook never blocks tools

PLAN_FILE="task_plan.md"

if [ -f "$PLAN_FILE" ]; then
    # Log plan context to stderr (visible in hook logs)
    head -30 "$PLAN_FILE" >&2
fi

echo '{"decision": "allow"}'
exit 0

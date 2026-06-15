#!/usr/bin/env bash
# pre-tool-use.sh — Enforce prerequisites before tool use
# Hook: Runs before every tool use to check planning files exist
# Returns {"decision": "allow"} — this hook never blocks tools

PLAN_FILE="task_plan.md"

if [ -f "$PLAN_FILE" ]; then
    # Log first 30 lines of plan to stderr (visible in hook logs)
    head -30 "$PLAN_FILE" >&2
fi

echo '{"decision": "allow"}'
exit 0

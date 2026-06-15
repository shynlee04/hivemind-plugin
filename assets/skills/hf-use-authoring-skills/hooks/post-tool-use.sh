#!/usr/bin/env bash
# post-tool-use.sh — Remind agent to update progress after file modifications
# Hook: Runs after every tool use to enforce write-to-disk discipline

if [ -f task_plan.md ]; then
    echo "[use-authoring-skills] Update progress.md with what you just did. If a phase is now complete, update task_plan.md status."
fi
exit 0

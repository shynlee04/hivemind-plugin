#!/usr/bin/env bash
# gx-signal-todo-progression.sh — S4: TODO Progression
# CRs: CR-13 (S4)
# Score: ratio of completed tasks to total tasks
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="todo_progression"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
TODO_FILE="$STATE_DIR/todo.json"

if [ ! -f "$TODO_FILE" ]; then
  jq -n \
    --arg signal "$SIGNAL_NAME" \
    --argjson score 50 \
    --arg formula 'score = (completed / total) * 100; no todo file => 50 (neutral)' \
    '{
      signal: $signal,
      score: $score,
      detail: {
        completed: 0,
        total: 0,
        in_progress: 0,
        pending: 0,
        formula: $formula,
        reason: "todo file missing",
        sources: [".hivemind/state/todo.json"]
      }
    }'
  exit 0
fi

# Count by status
completed=$(jq '[.[] | select(.status == "completed")] | length' "$TODO_FILE" 2>/dev/null || echo "0")
in_progress=$(jq '[.[] | select(.status == "in_progress")] | length' "$TODO_FILE" 2>/dev/null || echo "0")
pending=$(jq '[.[] | select(.status == "pending")] | length' "$TODO_FILE" 2>/dev/null || echo "0")
cancelled=$(jq '[.[] | select(.status == "cancelled")] | length' "$TODO_FILE" 2>/dev/null || echo "0")
total=$(jq 'length' "$TODO_FILE" 2>/dev/null || echo "0")

# Non-cancelled total for score calculation
active_total=$((total - cancelled))

score=50
if [ "$active_total" -gt 0 ]; then
  score=$((completed * 100 / active_total))
fi

# Clamp
if [ "$score" -lt 0 ]; then score=0; fi
if [ "$score" -gt 100 ]; then score=100; fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson completed "$completed" \
  --argjson in_progress "$in_progress" \
  --argjson pending "$pending" \
  --argjson cancelled "$cancelled" \
  --argjson total "$total" \
  --arg formula 'score = (completed / (total - cancelled)) * 100; 0 active => 50' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      completed: $completed,
      in_progress: $in_progress,
      pending: $pending,
      cancelled: $cancelled,
      total: $total,
      formula: $formula,
      sources: [".hivemind/state/todo.json"]
    }
  }'

exit 0

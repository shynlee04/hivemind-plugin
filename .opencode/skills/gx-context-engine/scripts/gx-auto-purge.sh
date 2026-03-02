#!/usr/bin/env bash
# gx-auto-purge.sh — Auto-purge on dirty context
#
# CHAIN: Auto-Purge (Chain 6) — Steps 1-2
# TRIGGER: Plugin hook when dirty_score > 90
# ACTIONS: snapshot | spawn-retrieval
# OUTPUT: .hivemind/state/pre-purge-snapshot.json OR spawns retrieval agent
#
# Dirty Score Computation:
#   drift < 40       → 30 points
#   turnCount > 30   → 20 points
#   violations > 3   → 20 points
#   depth > 3        → 15 points
#   todo.blocked > 5 → 15 points
#   Threshold: >70 WARNING, >90 AUTO-PURGE

set -euo pipefail

WORKDIR="${1:-.}"
ACTION="${2:-check}"

STATE_DIR="$WORKDIR/.hivemind/state"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"
TODO_FILE="$STATE_DIR/todo.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"
SNAPSHOT_FILE="$STATE_DIR/pre-purge-snapshot.json"
RECOVERY_FILE="$STATE_DIR/context-recovery.json"
ARCHIVE_DIR="$WORKDIR/.hivemind/archive"

# Ensure directories exist
mkdir -p "$STATE_DIR"
mkdir -p "$ARCHIVE_DIR"

# ── Compute Dirty Score ──

compute_dirty_score() {
  local score=0

  if [ -f "$ENFORCEMENT_FILE" ]; then
    local turn_count
    turn_count=$(jq -r '.turnCount // 0' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
    local violations
    violations=$(jq -r '.scopeViolations | length // 0' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
    local depth
    depth=$(jq -r '.delegationChain | length // 0' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")

    if [ "$turn_count" -gt 30 ]; then score=$((score + 20)); fi
    if [ "$violations" -gt 3 ]; then score=$((score + 20)); fi
    if [ "$depth" -gt 3 ]; then score=$((score + 15)); fi
  fi

  if [ -f "$TODO_FILE" ]; then
    local blocked
    blocked=$(jq '[.items[] | select(.status == "blocked")] | length' "$TODO_FILE" 2>/dev/null || echo "0")
    if [ "$blocked" -gt 5 ]; then score=$((score + 15)); fi
  fi

  echo "$score"
}

# ── Action: check ──

if [ "$ACTION" = "check" ]; then
  DIRTY_SCORE=$(compute_dirty_score)

  if [ "$DIRTY_SCORE" -gt 90 ]; then
    echo "{\"status\":\"auto_purge\",\"dirty_score\":$DIRTY_SCORE,\"action\":\"snapshot+spawn\"}"
  elif [ "$DIRTY_SCORE" -gt 70 ]; then
    echo "{\"status\":\"warning\",\"dirty_score\":$DIRTY_SCORE,\"action\":\"recommend_compact\"}"
  else
    echo "{\"status\":\"healthy\",\"dirty_score\":$DIRTY_SCORE,\"action\":\"none\"}"
  fi
  exit 0
fi

# ── Action: snapshot ──

if [ "$ACTION" = "snapshot" ]; then
  TIMESTAMP=$(date +%s)
  DIRTY_SCORE=$(compute_dirty_score)

  # Capture schematic state snapshot
  SNAPSHOT_DATA='{}'

  # Add enforcement state
  if [ -f "$ENFORCEMENT_FILE" ]; then
    SNAPSHOT_DATA=$(echo "$SNAPSHOT_DATA" | jq --slurpfile enforcement "$ENFORCEMENT_FILE" \
      '. + {enforcement: $enforcement[0]}')
  fi

  # Add TODO state
  if [ -f "$TODO_FILE" ]; then
    SNAPSHOT_DATA=$(echo "$SNAPSHOT_DATA" | jq --slurpfile todo "$TODO_FILE" \
      '. + {todo: $todo[0]}')
  fi

  # Add hierarchy cursor
  if [ -f "$HIERARCHY_FILE" ]; then
    SNAPSHOT_DATA=$(echo "$SNAPSHOT_DATA" | jq --slurpfile hierarchy "$HIERARCHY_FILE" \
      '. + {hierarchy_cursor: $hierarchy[0]}')
  fi

  # Add runtime profile
  if [ -f "$STATE_DIR/runtime-profile.json" ]; then
    SNAPSHOT_DATA=$(echo "$SNAPSHOT_DATA" | jq --slurpfile profile "$STATE_DIR/runtime-profile.json" \
      '. + {runtime_profile: $profile[0]}')
  fi

  # Add metadata
  SNAPSHOT_DATA=$(echo "$SNAPSHOT_DATA" | jq \
    --argjson timestamp "$TIMESTAMP" \
    --argjson dirty_score "$DIRTY_SCORE" \
    '. + {snapshot_timestamp: $timestamp, dirty_score: $dirty_score, reason: "auto_purge"}')

  echo "$SNAPSHOT_DATA" > "$SNAPSHOT_FILE"

  # Archive a copy
  DATE_DIR="$ARCHIVE_DIR/$(date +%Y-%m-%d)"
  mkdir -p "$DATE_DIR"
  cp "$SNAPSHOT_FILE" "$DATE_DIR/pre-purge-$TIMESTAMP.json"

  echo "{\"status\":\"snapshot_created\",\"file\":\"$SNAPSHOT_FILE\",\"archive\":\"$DATE_DIR/pre-purge-$TIMESTAMP.json\"}"
  exit 0
fi

# ── Action: spawn-retrieval ──

if [ "$ACTION" = "spawn-retrieval" ]; then
  RETRIEVAL_PROMPT="Load gx-context-engine skill. Read .hivemind/state/pre-purge-snapshot.json. Read .hivemind/state/hierarchy.json — locate deepest active node. Read .hivemind/state/todo.json — list pending/blocked items. Write synthesis to .hivemind/state/context-recovery.json with keys: trajectory_summary, active_todos, key_decisions, recommended_next."

  # Output the command to spawn — plugin will execute this
  echo "{\"status\":\"retrieval_prompt_ready\",\"agent\":\"hivexplorer\",\"prompt\":$(echo "$RETRIEVAL_PROMPT" | jq -Rs .)}"
  exit 0
fi

echo "{\"error\":\"unknown_action\",\"action\":\"$ACTION\",\"valid_actions\":[\"check\",\"snapshot\",\"spawn-retrieval\"]}"
exit 1

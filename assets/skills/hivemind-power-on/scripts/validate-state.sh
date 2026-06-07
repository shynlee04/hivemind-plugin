#!/usr/bin/env bash
# validate-state.sh
# Validates the runtime state root is intact and discoverable.
# Usage: ./validate-state.sh
set -euo pipefail

STATE_ROOT="${OPENCODE_HARNESS_STATE_DIR:-.hivemind}"

echo "Validating state root: $STATE_ROOT"

# 1. State root exists and is a directory
if [[ ! -d "$STATE_ROOT" ]]; then
  echo "FAIL: state root '$STATE_ROOT' does not exist"
  exit 1
fi

# 2. session-tracker subdir exists
if [[ ! -d "$STATE_ROOT/session-tracker" ]]; then
  echo "FAIL: $STATE_ROOT/session-tracker does not exist"
  exit 1
fi

# 3. At least one session dir exists
SESSION_COUNT=$(find "$STATE_ROOT/session-tracker" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
if [[ "$SESSION_COUNT" -lt 1 ]]; then
  echo "WARN: no session directories under $STATE_ROOT/session-tracker"
fi
echo "PASS: found $SESSION_COUNT session directories"

# 4. delegations subdir exists (if any delegation has been recorded)
if [[ -d "$STATE_ROOT/delegations" ]]; then
  DELEGATION_COUNT=$(find "$STATE_ROOT/delegations" -type f | wc -l | tr -d ' ')
  echo "PASS: $DELEGATION_COUNT delegation records"
fi

echo ""
echo "VERDICT: State root is intact."

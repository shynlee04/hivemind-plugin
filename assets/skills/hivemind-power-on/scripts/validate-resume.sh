#!/usr/bin/env bash
# validate-resume.sh
# Pre-flight check before resuming a session via the task tool with task_id.
# Usage: ./validate-resume.sh <session-id>
set -euo pipefail

SESSION_ID="${1:-}"

if [[ -z "$SESSION_ID" ]]; then
  echo "Usage: $0 <session-id>" >&2
  exit 64
fi

STATE_ROOT="${OPENCODE_HARNESS_STATE_DIR:-.hivemind}"

echo "Validating resume target: $SESSION_ID"

# 1. Session dir exists
if [[ ! -d "$STATE_ROOT/session-tracker/$SESSION_ID" ]]; then
  echo "FAIL: session directory not found at $STATE_ROOT/session-tracker/$SESSION_ID"
  echo "  → This session may not be resumable. Check session-tracker with list-sessions."
  exit 1
fi

# 2. session-continuity.json exists (required for resume)
if [[ ! -f "$STATE_ROOT/session-tracker/$SESSION_ID/session-continuity.json" ]]; then
  echo "WARN: session-continuity.json not found. Resume may not restore full context."
fi

# 3. hierarchy-manifest.json exists (required for delegation-aware resume)
if [[ ! -f "$STATE_ROOT/session-tracker/$SESSION_ID/hierarchy-manifest.json" ]]; then
  echo "WARN: hierarchy-manifest.json not found. Delegation context may be lost."
fi

# 4. Most recent journal file
JOURNAL=$(ls -t "$STATE_ROOT/session-tracker/$SESSION_ID"/ses_*.md 2>/dev/null | head -1)
if [[ -n "$JOURNAL" ]]; then
  echo "PASS: most recent journal = $JOURNAL"
fi

echo ""
echo "VERDICT: Resume target is valid (with caveats for missing files)."
echo "  → Use: task({ subagent_type: \"<agent>\", task_id: \"$SESSION_ID\", prompt: \"Continue\" })"

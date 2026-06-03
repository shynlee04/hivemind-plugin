#!/usr/bin/env bash
# init-session.sh — Creates .coordination/ directory and session structure
# Usage: ./init-session.sh <session-name>
#
# Bootstrap mode: Creates the full coordination directory structure from scratch.
# Works without any pre-existing infrastructure.
#
# Exit codes:
#   0 — Session initialized successfully
#   1 — Missing required argument

set -euo pipefail

SESSION="${1:?Usage: init-session.sh <session-name>}"
DATE=$(date +%Y-%m-%d)
COORD_DIR="${COORD_DIR:-.coordination}"

# Create session directory structure
mkdir -p "$COORD_DIR/$SESSION"
mkdir -p "$COORD_DIR/$SESSION/children"

# Create task_plan.md
cat > "$COORD_DIR/$SESSION/task_plan.md" << EOF
# Task Plan: $SESSION
# Date: $DATE

## Current Phase: ASSESS
## Goals:
- [ ] Identify all tasks
- [ ] Group by independence
- [ ] Decide execution mode

## Locked Decisions:
(none yet)

## Blockers:
(none yet)
EOF

# Create findings.md
cat > "$COORD_DIR/$SESSION/findings.md" << EOF
# Findings: $SESSION
# Date: $DATE

(Research and discovered facts go here)
EOF

# Create progress.md
cat > "$COORD_DIR/$SESSION/progress.md" << EOF
# Progress: $SESSION
# Date: $DATE

## Timeline
- $(date '+%H:%M') — Session initialized, phase: ASSESS
EOF

echo "[init-session] Session '$SESSION' initialized at $COORD_DIR/$SESSION/"
echo "[init-session] Directory structure created:"
echo "  $COORD_DIR/$SESSION/"
echo "  ├── task_plan.md"
echo "  ├── findings.md"
echo "  ├── progress.md"
echo "  └── children/"
echo "[init-session] Ready for ASSESS phase."
exit 0

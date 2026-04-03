#!/usr/bin/env bash
# init-session.sh — Create clean skeleton planning files
# Usage: bash init-session.sh [project-name]
# Creates task_plan.md, findings.md, progress.md in current directory

set -euo pipefail

PROJECT_NAME="${1:-project}"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

echo "Initializing planning files for: $PROJECT_NAME"

# Create task_plan.md if it doesn't exist
if [ ! -f "task_plan.md" ]; then
    cat > task_plan.md << 'SKELETON'
# Task Plan: <Brief Description>

## Goal
<One sentence describing the end state>

## Current Phase
Phase 1

## Phases

### Phase 1: <Descriptive Title>
- [ ] <actionable item>
- **Status:** in_progress

### Phase 2: <Descriptive Title>
- [ ] <actionable item>
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
SKELETON
    echo "Created task_plan.md"
else
    echo "task_plan.md already exists, skipping"
fi

# Create findings.md if it doesn't exist
if [ ! -f "findings.md" ]; then
    cat > findings.md << 'SKELETON'
# Findings & Decisions

## Requirements
<Extracted from user request>

## Research Findings
<Key discoveries from exploration>

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
<URLs, file paths, API references>
SKELETON
    echo "Created findings.md"
else
    echo "findings.md already exists, skipping"
fi

# Create progress.md if it doesn't exist
if [ ! -f "progress.md" ]; then
    cat > progress.md << EOF
# Progress Log

## Session: $DATE

### Phase 1: <Title>
- **Status:** in_progress
- **Started:** $TIMESTAMP
- Actions taken:
  -
- Files created/modified:
  -

## Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
EOF
    echo "Created progress.md"
else
    echo "progress.md already exists, skipping"
fi

echo ""
echo "Planning files initialized!"
echo "Files: task_plan.md, findings.md, progress.md"
echo "Next step: Fill in the Goal section of task_plan.md"

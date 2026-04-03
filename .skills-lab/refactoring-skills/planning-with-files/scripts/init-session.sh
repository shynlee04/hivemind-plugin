#!/usr/bin/env bash
# init-session.sh — Create clean skeleton planning files with validation
# Usage: bash init-session.sh [project-name]
# Creates task_plan.md, findings.md, progress.md in current directory
# Exit codes: 0 = success, 1 = failed to create files, 2 = validation failed

set -euo pipefail

PROJECT_NAME="${1:-project}"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATED=0
EXISTING=0

echo "[planning-with-files] Initializing planning files for: $PROJECT_NAME"

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
    echo "[planning-with-files] Created task_plan.md"
    CREATED=$((CREATED + 1))
else
    echo "[planning-with-files] task_plan.md already exists, skipping"
    EXISTING=$((EXISTING + 1))
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
    echo "[planning-with-files] Created findings.md"
    CREATED=$((CREATED + 1))
else
    echo "[planning-with-files] findings.md already exists, skipping"
    EXISTING=$((EXISTING + 1))
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
    echo "[planning-with-files] Created progress.md"
    CREATED=$((CREATED + 1))
else
    echo "[planning-with-files] progress.md already exists, skipping"
    EXISTING=$((EXISTING + 1))
fi

# Validation — ensure files have required sections
VALIDATION_ERRORS=0

for file in task_plan.md findings.md progress.md; do
    if [ ! -f "$file" ]; then
        echo "[planning-with-files] ERROR: $file was not created"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        continue
    fi
    
    # Check minimum file size (skeleton should be > 100 bytes)
    FILE_SIZE=$(wc -c < "$file")
    if [ "$FILE_SIZE" -lt 100 ]; then
        echo "[planning-with-files] WARNING: $file is suspiciously small ($FILE_SIZE bytes)"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    fi
done

# Validate task_plan.md has required sections
if [ -f "task_plan.md" ]; then
    for section in "## Goal" "## Current Phase" "## Phases" "## Errors Encountered"; do
        if ! grep -qF "$section" task_plan.md; then
            echo "[planning-with-files] ERROR: task_plan.md missing required section: $section"
            VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        fi
    done
fi

echo ""
if [ "$VALIDATION_ERRORS" -gt 0 ]; then
    echo "[planning-with-files] Validation failed with $VALIDATION_ERRORS error(s)"
    exit 2
fi

echo "[planning-with-files] Planning files initialized successfully!"
echo "[planning-with-files] Created: $CREATED, Existing: $EXISTING"
echo "[planning-with-files] Files: task_plan.md, findings.md, progress.md"
echo "[planning-with-files] NEXT: Fill in the Goal section of task_plan.md before any Write/Edit/Bash calls"

exit 0

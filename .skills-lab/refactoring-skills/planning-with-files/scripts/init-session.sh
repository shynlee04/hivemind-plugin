#!/bin/bash
# Initialize planning files for a new session
# Usage: ./init-session.sh [project-name]
#
# Creates task_plan.md, findings.md, and progress.md in the current directory
# if they don't already exist. Safe to run multiple times — skips existing files.

set -e

PROJECT_NAME="${1:-project}"
DATE=$(date +%Y-%m-%d)

echo "Initializing planning files for: $PROJECT_NAME"

# Create task_plan.md if it doesn't exist
if [ ! -f "task_plan.md" ]; then
    cat > task_plan.md << 'EOF'
# Task Plan: [Brief Description]

## Goal
[One sentence describing the end state]

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [ ] Understand user intent and extract requirements
- [ ] Identify constraints and edge cases
- [ ] Document findings in findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure
- [ ] Define technical approach
- [ ] Create project structure if needed
- [ ] Document decisions with rationale in findings.md
- **Status:** pending

### Phase 3: Implementation
- [ ] Execute the plan step by step
- [ ] Write code to files before executing
- [ ] Test incrementally after each change
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Verify all requirements met
- [ ] Document test results in progress.md
- [ ] Fix any issues found
- **Status:** pending

### Phase 5: Delivery
- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** pending

## Key Questions
1. [Question to answer during the task]
2. [Question to answer during the task]

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| | |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| | 1 | |
EOF
    echo "Created task_plan.md"
else
    echo "task_plan.md already exists, skipping"
fi

# Create findings.md if it doesn't exist
if [ ! -f "findings.md" ]; then
    cat > findings.md << 'EOF'
# Findings: [Task Name]

## Requirements
- [Requirement extracted from user request]
- [Constraint identified during discovery]

## Research Findings
- [Key discovery from web search or code exploration]
- [Technical fact discovered]

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| | |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| | |

## Resources
- [URL or file path with brief description]
EOF
    echo "Created findings.md"
else
    echo "findings.md already exists, skipping"
fi

# Create progress.md if it doesn't exist
if [ ! -f "progress.md" ]; then
    cat > progress.md << EOF
# Progress Log

## Session: $DATE

### Phase 1: Requirements & Discovery
- **Status:** in_progress
- **Started:** $(date +%H:%M)
- Actions taken:
  - Initialized planning session
- Files created/modified:
  - task_plan.md (created)
  - findings.md (created)
  - progress.md (created)

### Phase 2: Planning & Structure
- **Status:** pending
- Actions taken:
  -
- Files created/modified:
  -

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| | | | | |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| | | 1 | |
EOF
    echo "Created progress.md"
else
    echo "progress.md already exists, skipping"
fi

echo ""
echo "Planning files initialized!"
echo "Files: task_plan.md, findings.md, progress.md"

#!/usr/bin/env bash
# first-action.sh — Mandatory first action when user-intent-interactive-loop loads.
#
# Usage: bash scripts/first-action.sh
#
# This script:
# 1. Creates .opencode/state/ directory
# 2. Initializes tracking files (question-count.json, intent.json)
# 3. Checks that 3 platform skills are loaded
# 4. Blocks (exit 1) if any prerequisite is missing
#
# Exit codes:
#   0 = All prerequisites met, may proceed to PROBE
#   1 = Blocked — missing prerequisites (details to stderr)
#   2 = Script error (missing directories, etc.)

set -uo pipefail

STATE_DIR=".opencode/state"
REQUIRED_SKILLS=("opencode-platform-reference" "repomix-exploration-guide" "opencode-non-interactive-shell")

# ── Step 1: Create state directory ─────────────────────────────────────────────
mkdir -p "$STATE_DIR" 2>/dev/null || {
    echo "FAIL: Cannot create $STATE_DIR" >&2
    exit 2
}

# ── Step 2: Initialize tracking files (idempotent) ─────────────────────────────
# Question counter — tracks all questions asked (tool + plain text)
if [ ! -f "$STATE_DIR/question-count.json" ]; then
    cat > "$STATE_DIR/question-count.json" << 'EOF'
{"tool_questions": 0, "text_questions": 0, "total": 0, "questions": []}
EOF
fi

# Intent capture — all 6 stop conditions start empty
if [ ! -f "$STATE_DIR/intent.json" ]; then
    cat > "$STATE_DIR/intent.json" << 'EOF'
{
    "in_scope": [],
    "out_of_scope": [],
    "success_criteria": "",
    "constraints": [],
    "priority": "",
    "delegation_level": "",
    "user_confirmed": false
}
EOF
fi

# ── Step 3: Check platform skills are loaded ───────────────────────────────────
# Skills are "loaded" if their SKILL.md exists in any known skill directory
SKILL_DIRS=(
    ".opencode/skills"
    ".skills-lab/refactoring-skills"
    "$HOME/.config/opencode/skills"
    "$HOME/.agents/skills"
    "$HOME/.claude/skills"
)

MISSING_SKILLS=()
for skill in "${REQUIRED_SKILLS[@]}"; do
    found=false
    for dir in "${SKILL_DIRS[@]}"; do
        if [ -f "$dir/$skill/SKILL.md" ]; then
            found=true
            break
        fi
    done
    if [ "$found" = false ]; then
        MISSING_SKILLS+=("$skill")
    fi
done

if [ ${#MISSING_SKILLS[@]} -gt 0 ]; then
    echo "BLOCKED: Missing required platform skills:" >&2
    for skill in "${MISSING_SKILLS[@]}"; do
        echo "  - $skill" >&2
    done
    echo "" >&2
    echo "Load these skills FIRST before proceeding:" >&2
    echo '  skill("opencode-platform-reference")' >&2
    echo '  skill("repomix-exploration-guide")' >&2
    echo '  skill("opencode-non-interactive-shell")' >&2
    exit 1
fi

# ── Step 4: Record loaded skills ──────────────────────────────────────────────
cat > "$STATE_DIR/loaded-skills.json" << EOF
{
    "platform_skills": ["${REQUIRED_SKILLS[0]}", "${REQUIRED_SKILLS[1]}", "${REQUIRED_SKILLS[2]}"],
    "loaded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "ready"
}
EOF

# ── Step 5: Record first action completion ─────────────────────────────────────
cat > "$STATE_DIR/first-action.json" << EOF
{
    "state_dir_created": true,
    "tracking_files_initialized": true,
    "platform_skills_verified": true,
    "completed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "complete"
}
EOF

echo "FIRST ACTION: Complete"
echo "  State directory: $STATE_DIR"
echo "  Tracking files: initialized"
echo "  Platform skills: all 3 loaded"
echo "  Ready for PROBE phase"
exit 0

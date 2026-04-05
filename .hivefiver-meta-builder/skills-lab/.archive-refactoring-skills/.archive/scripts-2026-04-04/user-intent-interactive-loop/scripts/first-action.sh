#!/usr/bin/env bash
# first-action.sh — Mandatory first action when user-intent-interactive-loop loads.
#
# Usage: bash scripts/first-action.sh
#
# This script:
# 1. Runs hierarchy verification (verify-hierarchy.sh)
# 2. If hierarchy check fails, outputs missing skills and exits 1
# 3. Registers this skill as loaded (register-skill.sh)
# 4. Creates .opencode/state/ directory
# 5. Initializes tracking files (question-count.json, intent.json)
# 6. Checks that 3 platform skills are loaded
# 7. Blocks (exit 1) if any prerequisite is missing
#
# Exit codes:
#   0 = All prerequisites met, may proceed to PROBE
#   1 = Blocked — missing prerequisites (details to stderr)
#   2 = Script error (missing directories, etc.)

set -uo pipefail

# Path resolution (NO hardcoded platform guesses):
#   STATE_DIR  → $STATE_DIR env > $PWD/state
#   SKILLS_ROOT → $SKILLS_ROOT env > $PWD
STATE_DIR="${STATE_DIR:-$PWD/state}"
SKILLS_ROOT="${SKILLS_ROOT:-$PWD}"
REQUIRED_SKILLS=("opencode-platform-reference" "repomix-exploration-guide" "opencode-non-interactive-shell")

# ── Step 0: Run hierarchy verification ─────────────────────────────────────────
VERIFY_SCRIPT=""
if [ -f "scripts/verify-hierarchy.sh" ]; then
    VERIFY_SCRIPT="scripts/verify-hierarchy.sh"
fi

if [ -n "$VERIFY_SCRIPT" ]; then
    echo "[first-action] Running hierarchy verification..."
    if ! bash "$VERIFY_SCRIPT" user-intent-interactive-loop --state-dir "$STATE_DIR" --skills-root "$SKILLS_ROOT"; then
        echo "BLOCKED: Hierarchy verification failed." >&2
        echo "Missing background skills. Load these FIRST:" >&2
        echo '  skill("opencode-platform-reference")' >&2
        echo '  skill("repomix-exploration-guide")' >&2
        echo '  skill("opencode-non-interactive-shell")' >&2
        echo "Then re-run this script." >&2
        exit 1
    fi
    echo "[first-action] Hierarchy verification passed."
else
    echo "[first-action] WARNING: verify-hierarchy.sh not found, skipping hierarchy check." >&2
fi

# ── Step 1: Register this skill as loaded ──────────────────────────────────────
REGISTER_SCRIPT=""
if [ -f "scripts/register-skill.sh" ]; then
    REGISTER_SCRIPT="scripts/register-skill.sh"
fi

if [ -n "$REGISTER_SCRIPT" ]; then
    echo "[first-action] Registering skill as loaded..."
    bash "$REGISTER_SCRIPT" user-intent-interactive-loop --state-dir "$STATE_DIR"
else
    echo "[first-action] WARNING: register-skill.sh not found, skipping registration." >&2
fi

# ── Step 2: Create state directory ─────────────────────────────────────────────
mkdir -p "$STATE_DIR" 2>/dev/null || {
    echo "FAIL: Cannot create $STATE_DIR" >&2
    exit 2
}

# ── Step 3: Initialize tracking files (idempotent) ─────────────────────────────
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
    "scope_in": [],
    "scope_out": [],
    "success_criteria": "",
    "constraints": [],
    "priority": "",
    "delegation": "",
    "user_confirmed": false
}
EOF
fi

# ── Step 4: Check platform skills are loaded ───────────────────────────────────
# Skills are "loaded" if their SKILL.md exists in $SKILLS_ROOT
# The: caller decides where skills live. NO platform guesses.

MISSING_SKILLS=()
for skill in "${REQUIRED_SKILLS[@]}"; do
    found=false
    if [ -f "$SKILLS_ROOT/$skill/SKILL.md" ]; then
        found=true
        break
    fi
    if [ "$found" = false ]; then
        MISSING_SKILLS+=("$skill")
    fi

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

# ── Step 5: Record loaded skills is handled by register-skill.sh ────────────────
# Do NOT overwrite loaded-skills.json — the format must stay compatible
# with verify-hierarchy.sh which reads .skills[$s].status

# ── Step 6: Record first action completion ─────────────────────────────────────
HIERARCHY_VERIFIED=false
SKILL_REGISTERED=false

if [ -n "$VERIFY_SCRIPT" ]; then
    HIERARCHY_VERIFIED=true
fi

if [ -n "$REGISTER_SCRIPT" ]; then
    SKILL_REGISTERED=true
fi

cat > "$STATE_DIR/first-action.json" << EOF
{
    "hierarchy_verified": $HIERARCHY_VERIFIED,
    "skill_registered": $SKILL_REGISTERED,
    "state_dir_created": true,
    "tracking_files_initialized": true,
    "platform_skills_verified": true,
    "completed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "complete"
}
EOF

echo "FIRST ACTION: Complete"
if [ "$HIERARCHY_VERIFIED" = true ]; then
    echo "  Hierarchy verification: passed"
else
    echo "  Hierarchy verification: SKIPPED (verify-hierarchy.sh not found)"
fi
if [ "$SKILL_REGISTERED" = true ]; then
    echo "  Skill registration: done"
else
    echo "  Skill registration: SKIPPED (register-skill.sh not found)"
fi
echo "  State directory: $STATE_DIR"
echo "  Tracking files: initialized"
echo "  Platform skills: all 3 loaded"
echo "  Ready for PROBE phase"
exit 0

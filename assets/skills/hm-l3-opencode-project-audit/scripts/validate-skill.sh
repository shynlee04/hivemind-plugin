#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

cd "$SKILL_DIR"

errors=0

if [ ! -f "SKILL.md" ]; then
    echo "ERROR: SKILL.md not found"
    exit 1
fi

if ! grep -q "^name:" SKILL.md; then
    echo "ERROR: SKILL.md missing 'name' field in frontmatter"
    errors=1
fi

if ! grep -q "^description:" SKILL.md; then
    echo "ERROR: SKILL.md missing 'description' field in frontmatter"
    errors=1
fi

profile_count=$(ls -1 assets/profiles/ 2>/dev/null | wc -l)
if [ "$profile_count" -ne 7 ]; then
    echo "ERROR: Expected 7 profiles in assets/profiles/, found $profile_count"
    errors=1
fi

if [ ! -f "references/pointers.md" ]; then
    echo "ERROR: references/pointers.md not found"
    errors=1
fi

if [ ! -f "scripts/compile-bundle.sh" ]; then
    echo "ERROR: scripts/compile-bundle.sh not found"
    errors=1
fi

if [ "$errors" -eq 0 ]; then
    echo "OK: All checks passed"
    exit 0
else
    exit 1
fi

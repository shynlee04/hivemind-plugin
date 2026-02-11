#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Setting up HiveMind git hooks..."

# Copy hooks to .git/hooks
cp "$PROJECT_ROOT/.githooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"
chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"

echo "✅ Git hooks installed. Pre-commit hook will enforce atomic commits."
echo ""
echo "The pre-commit hook will:"
echo "  - Check if .hivemind/brain.json was modified"
echo "  - Check if .hivemind/sessions/active.md was modified"
echo "  - Prompt for a focused commit message if so"

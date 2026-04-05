#!/usr/bin/env bash
set -euo pipefail

# eval-runner.sh — Thin wrapper around eval_runner.py
# Produces results in agentskills.io JSON format
#
# Usage:
#   eval-runner.sh --skill <name> [--eval <id>] [--verbose]
#   eval-runner.sh --chain <name> [--verbose]
#   eval-runner.sh --all [--verbose]

# ── Resolve paths relative to script location ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

# ── Delegate to Python ──
exec python3 "$SCRIPT_DIR/eval_runner.py" \
  --skills-root "$SKILLS_ROOT" \
  --script-dir "$SCRIPT_DIR" \
  --results-dir "$RESULTS_DIR" \
  "$@"

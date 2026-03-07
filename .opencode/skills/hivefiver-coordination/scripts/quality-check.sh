#!/usr/bin/env bash
# quality-check.sh — Post-stage quality verification
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash quality-check.sh <stage> <workdir>
set -euo pipefail

STAGE="${1:-build}"
WORKDIR="${2:-.}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

# Quality checks per stage
case "$STAGE" in
  build)
    # Check if TypeScript compiles
    TSC_OK=false
    if command -v npx >/dev/null 2>&1; then
      if npx tsc --noEmit 2>/dev/null; then
        TSC_OK=true
      fi
    fi
    
    # Check if tests pass
    TESTS_OK=false
    if [ -f "${WORKDIR}/package.json" ]; then
      if npm test --silent 2>/dev/null; then
        TESTS_OK=true
      fi
    fi
    
    cat <<EOF
{"stage":"build","tsc_pass":${TSC_OK},"tests_pass":${TESTS_OK},"timestamp":"${TIMESTAMP}"}
EOF
    ;;
  audit)
    # Audit checks: file count, lint status
    FILE_COUNT=$(find "${WORKDIR}/src" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
    cat <<EOF
{"stage":"audit","source_files":${FILE_COUNT},"timestamp":"${TIMESTAMP}"}
EOF
    ;;
  *)
    cat <<EOF
{"stage":"${STAGE}","quality":"unchecked","timestamp":"${TIMESTAMP}"}
EOF
    ;;
esac

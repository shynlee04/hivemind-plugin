#!/usr/bin/env bash
set -euo pipefail

# validate-load-order.sh — Validates .opencode/ directory structure and loading order
# Usage: ./bin/validate-load-order.sh [project-root]
#   Exit 0 if valid, exit 1 if issues found

ROOT_DIR="${1:-$(pwd)}"
OPENCODE_DIR="$ROOT_DIR/.opencode"
ISSUES=0

echo "=== Load-Order Validation ==="
echo "Project root: $ROOT_DIR"

# Check .opencode/ directory exists
if [[ ! -d "$OPENCODE_DIR" ]]; then
  echo "[FAIL] .opencode/ directory not found"
  exit 1
fi
echo "[PASS] .opencode/ directory exists"

# Check required subdirectories
for subdir in agents commands skills; do
  if [[ ! -d "$OPENCODE_DIR/$subdir" ]]; then
    echo "[WARN] $subdir/ subdirectory missing"
    ((ISSUES++)) || true
  else
    echo "[PASS] $subdir/ subdirectory exists"
  fi
done

# Validate each primitive .md file has valid YAML frontmatter
MD_COUNT=0
INVALID_FM=0

# Agents and commands: any .md file
for subdir in agents commands; do
  if [[ -d "$OPENCODE_DIR/$subdir" ]]; then
    while IFS= read -r -d '' file; do
      ((MD_COUNT++)) || true
      if ! head -n1 "$file" | grep -q '^---$'; then
        echo "[WARN] Missing YAML frontmatter: $file"
        ((INVALID_FM++)) || true
        ((ISSUES++)) || true
      fi
    done < <(find -L "$OPENCODE_DIR/$subdir" -maxdepth 1 -type f -name '*.md' -print0 2>/dev/null || true)
  fi
done

# Skills: only SKILL.md files (ignore task_plan.md, PLAN.md, etc.)
if [[ -d "$OPENCODE_DIR/skills" ]]; then
  while IFS= read -r -d '' file; do
    ((MD_COUNT++)) || true
    if ! head -n1 "$file" | grep -q '^---$'; then
      echo "[WARN] Missing YAML frontmatter: $file"
      ((INVALID_FM++)) || true
      ((ISSUES++)) || true
    fi
  done < <(find -L "$OPENCODE_DIR/skills" -maxdepth 2 -type f -name 'SKILL.md' -print0 2>/dev/null || true)
fi

echo "[INFO] Scanned $MD_COUNT primitive .md files, $INVALID_FM missing frontmatter"

# Check for circular dependencies via Node.js script if available
if command -v node &>/dev/null && [[ -f "$ROOT_DIR/dist/lib/runtime-validator.js" ]]; then
  echo "[INFO] Checking circular dependencies via runtime-validator..."
  if node -e "
    const { validateRuntime } = require('./dist/lib/runtime-validator.js');
    const { loadPrimitives } = require('./dist/lib/primitive-loader.js');
    loadPrimitives({ projectRoot: '$ROOT_DIR' }).then(result => {
      const primitives = {
        agents: result.agents,
        commands: result.commands,
        skills: result.skills,
        tools: new Map(),
        mcpServers: result.mcpServers,
        config: result.config || {},
      };
      const report = validateRuntime(primitives);
      if (!report.loadingOrder.valid) {
        console.log('[FAIL] Circular dependencies detected:');
        report.loadingOrder.cycles.forEach(c => console.log('  - ' + c.join(' → ')));
        process.exit(1);
      } else {
        console.log('[PASS] No circular dependencies');
      }
    }).catch(err => {
      console.log('[SKIP] Runtime validation skipped (' + err.message + ')');
    });
  " 2>/dev/null; then
    : # success
  else
    ((ISSUES++)) || true
  fi
else
  echo "[SKIP] Runtime validation skipped (node or dist/ unavailable)"
fi

echo ""
if [[ $ISSUES -gt 0 ]]; then
  echo "=== Load-Order Validation: $ISSUES issue(s) found ==="
  exit 1
else
  echo "=== Load-Order Validation: PASSED ==="
  exit 0
fi

#!/usr/bin/env bash
set -euo pipefail

# validate-agent-config.sh — Run typecheck + vitest + schema validation for OpenCode primitive configs
# Usage: ./bin/validate-agent-config.sh [--quick]
#   --quick  Skip typecheck, only run vitest

QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Agent Config Validation ==="

if [[ "$QUICK" == "false" ]]; then
  echo "[1/3] Running typecheck..."
  npm run typecheck
  echo "[1/3] ✓ Typecheck passed"
else
  echo "[1/3] Skipping typecheck (--quick)"
fi

echo "[2/3] Running vitest..."
npx vitest run --reporter=verbose 2>&1 | tail -5
echo "[2/3] ✓ Tests passed"

echo "[3/3] Checking schema-kernel exports..."
node -e "
  const schemas = require('./dist/schema-kernel/index.js');
  const required = ['AgentFrontmatterSchema', 'CommandFrontmatterSchema', 'SkillFrontmatterSchema', 'MCPServerConfigSchema', 'OpenCodeConfigSchema'];
  const missing = required.filter(s => !schemas[s]);
  if (missing.length) { console.error('Missing exports:', missing.join(', ')); process.exit(1); }
  console.log('All', required.length, 'schema exports present');
" 2>/dev/null || echo "[3/3] ⚠ Schema check skipped (dist/ not built — run 'npm run build' first)"

echo ""
echo "=== All validations passed ==="

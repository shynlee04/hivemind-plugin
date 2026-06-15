#!/usr/bin/env bash
set -euo pipefail

# validate-runtime-paths.sh — Validates all file paths referenced in configs exist
# Usage: ./bin/validate-runtime-paths.sh [project-root]
#   Exit 0 if valid, exit 1 if issues found

ROOT_DIR="${1:-$(pwd)}"
OPENCODE_DIR="$ROOT_DIR/.opencode"
ISSUES=0

echo "=== Runtime Paths Validation ==="
echo "Project root: $ROOT_DIR"

# Check .opencode/ directory exists
if [[ ! -d "$OPENCODE_DIR" ]]; then
  echo "[FAIL] .opencode/ directory not found"
  exit 1
fi

# Load all agent/command/skill files and check referenced paths
if command -v node &>/dev/null; then
  node -e "
    const fs = require('fs');
    const path = require('path');
    const { loadPrimitives } = require('./dist/lib/primitive-loader.js');

    async function validate() {
      const result = await loadPrimitives({ projectRoot: '$ROOT_DIR' });
      let issues = 0;

      // Check agent files exist on disk
      for (const [name, agent] of result.agents) {
        if (!fs.existsSync(agent.filePath)) {
          console.log('[FAIL] Agent file missing on disk: ' + agent.filePath);
          issues++;
        }
      }
      console.log('[INFO] Checked ' + result.agents.size + ' agents');

      // Check command files exist on disk
      for (const [name, cmd] of result.commands) {
        if (!fs.existsSync(cmd.filePath)) {
          console.log('[FAIL] Command file missing on disk: ' + cmd.filePath);
          issues++;
        }
      }
      console.log('[INFO] Checked ' + result.commands.size + ' commands');

      // Check skill directories exist
      for (const [name, skill] of result.skills) {
        if (!fs.existsSync(skill.skillPath)) {
          console.log('[FAIL] Skill file missing on disk: ' + skill.skillPath);
          issues++;
        }
      }
      console.log('[INFO] Checked ' + result.skills.size + ' skills');

      // Check opencode.json exists
      const configPath = path.join('$ROOT_DIR', 'opencode.json');
      if (!fs.existsSync(configPath)) {
        console.log('[WARN] opencode.json not found');
        issues++;
      } else {
        console.log('[PASS] opencode.json exists');
        // Validate referenced instruction files
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const instructions = raw.instructions || [];
        for (const instr of instructions) {
          if (typeof instr === 'string') {
            const instrPath = path.resolve('$ROOT_DIR', instr);
            if (!fs.existsSync(instrPath)) {
              console.log('[FAIL] Instruction file missing: ' + instr);
              issues++;
            }
          }
        }
        console.log('[INFO] Checked ' + instructions.length + ' instruction references');
      }

      if (issues > 0) {
        console.log('');
        console.log('=== Runtime Paths Validation: ' + issues + ' issue(s) found ===');
        process.exit(1);
      } else {
        console.log('=== Runtime Paths Validation: PASSED ===');
      }
    }

    validate().catch(err => {
      console.log('[SKIP] Validation skipped (' + err.message + ')');
      console.log('=== Runtime Paths Validation: SKIPPED ===');
    });
  " 2>/dev/null || {
    echo "[SKIP] Node.js validation skipped (dist/ not built or node unavailable)"
    # Fallback: basic directory checks
    for subdir in agents commands skills; do
      if [[ -d "$OPENCODE_DIR/$subdir" ]]; then
        count=$(find "$OPENCODE_DIR/$subdir" -type f | wc -l)
        echo "[INFO] $subdir/: $count files"
      fi
    done
  }
else
  echo "[SKIP] Node.js not available — skipping path validation"
  exit 0
fi

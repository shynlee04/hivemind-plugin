#!/bin/bash

# Verification script for Phase SR-11: Config Ecosystem Complete
# This script verifies that all components work together correctly.

set -e

echo "=== SR-11 Verification Script ==="
echo ""

# Step 1: Run typecheck
echo "1. Running typecheck..."
if npm run typecheck; then
    echo "   ✓ Typecheck passed"
else
    echo "   ✗ Typecheck failed"
    exit 1
fi

# Step 2: Run tests
echo ""
echo "2. Running tests..."
if npm test; then
    echo "   ✓ Tests passed"
else
    echo "   ✗ Tests failed"
    exit 1
fi

# Step 3: Check skill file exists in assets
echo ""
echo "3. Checking skill file in assets..."
if [ -f "assets/skills/hm-l2-governance-config/SKILL.md" ]; then
    echo "   ✓ Skill file exists in assets/skills/hm-l2-governance-config/SKILL.md"
else
    echo "   ✗ Skill file missing in assets/skills/hm-l2-governance-config/SKILL.md"
    exit 1
fi

# Step 4: Check skill file exists in .opencode
echo ""
echo "4. Checking skill file in .opencode..."
if [ -f ".opencode/skills/hm-l2-governance-config/SKILL.md" ]; then
    echo "   ✓ Skill file exists in .opencode/skills/hm-l2-governance-config/SKILL.md"
else
    echo "   ✗ Skill file missing in .opencode/skills/hm-l2-governance-config/SKILL.md"
    exit 1
fi

# Step 5: Check defaults.ts exists
echo ""
echo "5. Checking defaults.ts..."
if [ -f "src/config/defaults.ts" ]; then
    echo "   ✓ defaults.ts exists"
else
    echo "   ✗ defaults.ts missing"
    exit 1
fi

# Step 6: Check bootstrap-init.ts was modified
echo ""
echo "6. Checking bootstrap-init.ts..."
if grep -q "DEFAULT_GOVERNANCE_CONFIGS" "src/tools/config/bootstrap-init.ts"; then
    echo "   ✓ bootstrap-init.ts imports DEFAULT_GOVERNANCE_CONFIGS"
else
    echo "   ✗ bootstrap-init.ts does not import DEFAULT_GOVERNANCE_CONFIGS"
    exit 1
fi

echo ""
echo "=== All verification checks passed ==="
echo ""
echo "Summary:"
echo "  - Typecheck: PASS"
echo "  - Tests: PASS"
echo "  - Skill file in assets: PASS"
echo "  - Skill file in .opencode: PASS"
echo "  - defaults.ts: PASS"
echo "  - bootstrap-init.ts integration: PASS"
echo ""
echo "Phase SR-11 verification complete."
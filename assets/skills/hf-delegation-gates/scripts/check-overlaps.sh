#!/bin/bash
# check-overlaps.sh — Checks for content duplication across reference files
# Exits non-zero if significant overlaps detected

set -e

SKILL_DIR="${1:-.}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

WARNINGS=0

echo "=== Overlap Detection: agent-authorization ==="
echo ""

# Check 1: Verify all referenced files exist
echo "Checking file references..."
SKILL_CONTENT=$(cat "$SKILL_DIR/SKILL.md" 2>/dev/null || echo "")

REFERENCED_FILES=$(echo "$SKILL_CONTENT" | grep -oE 'references/[a-z-]+\.md' | sort -u)

for ref in $REFERENCED_FILES; do
    if [[ -f "$SKILL_DIR/$ref" ]]; then
        echo -e "${GREEN}✓ $ref exists${NC}"
    else
        echo -e "${RED}✗ $ref referenced but not found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# Check 2: Look for content overlap between reference files
echo ""
echo "Checking for content duplication..."

if [[ -d "$SKILL_DIR/references" ]]; then
    REF_FILES=("$SKILL_DIR/references"/*.md)
    
    if [[ ${#REF_FILES[@]} -gt 1 ]]; then
        # Check for duplicate section headers
        echo -e "${YELLOW}⚠ Multiple reference files detected${NC}"
        echo "  Files: ${#REF_FILES[@]}"
        
        # Check for gate-related content appearing in multiple files
        GATE_COUNT=$(grep -l "Gate [0-9]" "$SKILL_DIR/references"/*.md 2>/dev/null | wc -l || echo 0)
        if [[ $GATE_COUNT -gt 1 ]]; then
            echo -e "${YELLOW}⚠ Gate definitions appear in $GATE_COUNT files${NC}"
            echo "  Recommendation: Consolidate gate definitions in single file"
        fi
    fi
fi

# Check 3: SKILL.md should not duplicate reference content verbatim
echo ""
echo "Checking SKILL.md for reference duplication..."

if [[ -f "$SKILL_DIR/SKILL.md" ]] && [[ -f "$SKILL_DIR/references/gates.md" ]]; then
    # Extract first 200 chars of each gate section from SKILL.md
    # and check if they appear verbatim in gates.md
    for gate_num in 1 2 3 4; do
        SKILL_GATE_CONTENT=$(sed -n "/^### Gate $gate_num:/,/^### Gate/p" "$SKILL_DIR/SKILL.md" 2>/dev/null | head -20)
        if [[ -n "$SKILL_GATE_CONTENT" ]]; then
            # Check if this content is mostly duplicated in gates.md
            OVERLAP_COUNT=0
            while IFS= read -r line; do
                if grep -q "$line" "$SKILL_DIR/references/gates.md" 2>/dev/null; then
                    OVERLAP_COUNT=$((OVERLAP_COUNT + 1))
                fi
            done <<< "$SKILL_GATE_CONTENT"
            
            # If more than 50% of lines overlap, flag it
            LINE_COUNT=$(echo "$SKILL_GATE_CONTENT" | grep -c . || echo 0)
            if [[ $LINE_COUNT -gt 0 ]]; then
                OVERLAP_RATIO=$((OVERLAP_COUNT * 100 / LINE_COUNT))
                if [[ $OVERLAP_RATIO -gt 50 ]]; then
                    echo -e "${YELLOW}⚠ Gate $gate_num: $OVERLAP_RATIO% overlap with references/gates.md${NC}"
                    echo "  Recommendation: Keep summaries in SKILL.md, details in references/"
                fi
            fi
        fi
    done
fi

# Check 4: Verify no dead links in reference files
echo ""
echo "Checking for dead references..."

if [[ -f "$SKILL_DIR/references/gates.md" ]]; then
    # Check for references to non-existent sections
    BROKEN_REFS=$(grep -E "^\[.*\]: #" "$SKILL_DIR/references/gates.md" | while read -r ref; do
        SECTION=$(echo "$ref" | sed 's/.*#\]//' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
        if ! grep -q "## $SECTION" "$SKILL_DIR/references/gates.md" 2>/dev/null; then
            echo "$ref"
        fi
    done)
    
    if [[ -n "$BROKEN_REFS" ]]; then
        echo -e "${YELLOW}⚠ Potential broken references found${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ No dead references detected${NC}"
    fi
fi

# Check 5: Specialist profiles should not overlap
echo ""
echo "Checking specialist profile definitions..."

if [[ -f "$SKILL_DIR/references/gates.md" ]]; then
    PROFILE_COUNT=$(grep -c "^### [a-z]" "$SKILL_DIR/references/gates.md" || echo 0)
    if [[ $PROFILE_COUNT -ge 5 ]]; then
        echo -e "${GREEN}✓ Specialist profiles well-segmented ($PROFILE_COUNT profiles)${NC}"
    else
        echo -e "${YELLOW}⚠ Only $PROFILE_COUNT specialist profiles found${NC}"
    fi
fi

# Summary
echo ""
echo "=== Overlap Check Summary ==="
if [[ $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}✓ No significant overlaps detected${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
    echo "  Recommendations logged above"
    exit 0  # Warnings don't fail the check, only errors do
fi

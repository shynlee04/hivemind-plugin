#!/bin/bash
# validate-skill.sh — Validates hf-delegation-gates skill structure
# Exits non-zero if validation fails

set -e

SKILL_DIR="${1:-.}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo "=== Skill Validation: hf-delegation-gates ==="
echo ""

# Check 1: SKILL.md exists
if [[ ! -f "$SKILL_DIR/SKILL.md" ]]; then
    echo -e "${RED}✗ SKILL.md not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ SKILL.md exists${NC}"
fi

# Check 2: Frontmatter validation
if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
    # Check for required frontmatter fields
    if ! grep -q "^name: hf-delegation-gates" "$SKILL_DIR/SKILL.md"; then
        echo -e "${RED}✗ Frontmatter missing 'name: hf-delegation-gates'${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ Frontmatter has correct name${NC}"
    fi
    
    if ! grep -q "^description:" "$SKILL_DIR/SKILL.md"; then
        echo -e "${RED}✗ Frontmatter missing 'description'${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ Frontmatter has description${NC}"
    fi
    
    # Check description has trigger phrases
    DESCRIPTION=$(sed -n '/^description:/,/^---/p' "$SKILL_DIR/SKILL.md" | head -20)
    if echo "$DESCRIPTION" | grep -qi "use when"; then
        echo -e "${GREEN}✓ Description has 'Use when' trigger phrase${NC}"
    else
        echo -e "${RED}✗ Description missing 'Use when' trigger phrase${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for specific trigger keywords
    TRIGGER_COUNT=0
    for phrase in "checkpoint gate" "authorization gate" "capability matrices" "validating agent permissions"; do
        if echo "$DESCRIPTION" | grep -qi "$phrase"; then
            TRIGGER_COUNT=$((TRIGGER_COUNT + 1))
        fi
    done
    
    if [[ $TRIGGER_COUNT -ge 3 ]]; then
        echo -e "${GREEN}✓ Description has $TRIGGER_COUNT trigger phrases${NC}"
    else
        echo -e "${YELLOW}⚠ Description has only $TRIGGER_COUNT trigger phrases (recommended: 3+)${NC}"
    fi
fi

# Check 3: references/ directory exists with gates.md
if [[ ! -d "$SKILL_DIR/references" ]]; then
    echo -e "${RED}✗ references/ directory not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ references/ directory exists${NC}"
fi

if [[ -f "$SKILL_DIR/references/gates.md" ]]; then
    echo -e "${GREEN}✓ references/gates.md exists${NC}"
    
    # Check gates.md has substantive content
    GATES_LINES=$(wc -l < "$SKILL_DIR/references/gates.md" 2>/dev/null || echo 0)
    if [[ $GATES_LINES -lt 100 ]]; then
        echo -e "${YELLOW}⚠ references/gates.md is thin ($GATES_LINES lines, recommended: 100+)${NC}"
    else
        echo -e "${GREEN}✓ references/gates.md has $GATES_LINES lines${NC}"
    fi
else
    echo -e "${RED}✗ references/gates.md not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [[ -f "$SKILL_DIR/references/boundary-guardrails.md" ]]; then
    echo -e "${GREEN}✓ references/boundary-guardrails.md exists${NC}"
else
    echo -e "${RED}✗ references/boundary-guardrails.md not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: SKILL.md uses imperative form (not declarative)
if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
    DECLARATIVE_COUNT=$(grep -c "this skill\|the agent should\|is designed to" "$SKILL_DIR/SKILL.md" 2>/dev/null || true)
    if [[ $DECLARATIVE_COUNT -gt 2 ]]; then
        echo -e "${YELLOW}⚠ SKILL.md has $DECLARATIVE_COUNT declarative phrases (recommend: <3)${NC}"
    else
        echo -e "${GREEN}✓ SKILL.md uses imperative form${NC}"
    fi
fi

# Check 5: Gate definitions present in SKILL.md
if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
    GATE_COUNT=$(grep -c "^### Gate" "$SKILL_DIR/SKILL.md" || true)
    if [[ $GATE_COUNT -ge 4 ]]; then
        echo -e "${GREEN}✓ SKILL.md has $GATE_COUNT gate definitions${NC}"
    else
        echo -e "${YELLOW}⚠ SKILL.md has only $GATE_COUNT gate definitions (expected: 4)${NC}"
    fi
fi

if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
    for token in "Boundary Guardrails" "Handoff Metadata" "resume pointer"; do
        if ! grep -qi "$token" "$SKILL_DIR/SKILL.md" "$SKILL_DIR/references/gates.md" "$SKILL_DIR/references/boundary-guardrails.md"; then
            echo -e "${RED}✗ Missing Phase 30 token: $token${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

# Check 6: Specialist profiles documented
if [[ -f "$SKILL_DIR/references/gates.md" ]]; then
    SPECIALIST_COUNT=$(grep -c "^### " "$SKILL_DIR/references/gates.md" || echo 0)
    if [[ $SPECIALIST_COUNT -ge 5 ]]; then
        echo -e "${GREEN}✓ references/gates.md has $SPECIALIST_COUNT specialist profiles${NC}"
    else
        echo -e "${YELLOW}⚠ references/gates.md has only $SPECIALIST_COUNT profiles (expected: 5+)${NC}"
    fi
fi

# Check 7: scripts/ directory exists
if [[ ! -d "$SKILL_DIR/scripts" ]]; then
    echo -e "${RED}✗ scripts/ directory not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ scripts/ directory exists${NC}"
fi

# Check 8: YAML frontmatter structure (basic check)
if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
    # Check frontmatter starts/ends properly
    if head -1 "$SKILL_DIR/SKILL.md" | grep -q "^---" && \
       sed -n '/^---/,/^---/p' "$SKILL_DIR/SKILL.md" | tail -1 | grep -q "^---"; then
        echo -e "${GREEN}✓ SKILL.md has valid frontmatter delimiters${NC}"
    else
        echo -e "${RED}✗ SKILL.md frontmatter malformed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "=== Validation Summary ==="
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✓ All checks passed${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    exit 1
fi

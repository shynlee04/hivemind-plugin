#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
PROFILES_DIR="$SKILL_DIR/assets/profiles"
OUTPUT_DIR="$SKILL_DIR/.harness-audit/compiled"

REQUIRED_FIELDS=("role" "core_principle" "verification_dimensions" "structured_returns" "success_criteria")

mkdir -p "$OUTPUT_DIR"

count=0
invalid=0

for profile in "$PROFILES_DIR"/phase-*-*.md; do
    if [[ ! -f "$profile" ]]; then
        continue
    fi

    ((count++))

    filename="$(basename "$profile")"
    echo "Processing: $filename"

    if ! grep -qE "^# .*Phase [0-9]" "$profile"; then
        echo "ERROR: $filename - missing profile header"
        ((invalid++))
        continue
    fi

    missing_fields=()
    for field in "${REQUIRED_FIELDS[@]}"; do
        field_spaced="${field//_/ }"
        found=0
        while IFS= read -r line; do
            if [[ "$line" =~ ^[[:space:]]*${field}[[:space:]]*: ]]; then
                found=1
            elif [[ "$line" =~ ^[[:space:]]*${field_spaced}[[:space:]]*: ]]; then
                found=1
            elif [[ "$line" =~ ^[[:space:]]*\*{2}${field}\*{2}[[:space:]]*: ]]; then
                found=1
            elif [[ "$line" =~ ^[[:space:]]*\*{2}${field_spaced}\*{2}[[:space:]]*: ]]; then
                found=1
            elif [[ "$line" =~ ^[[:space:]]+-[[:space:]]*\*{2}${field}\*{2}[[:space:]]*: ]]; then
                found=1
            elif [[ "$line" =~ ^[[:space:]]+-[[:space:]]*\*{2}${field_spaced}\*{2}[[:space:]]*: ]]; then
                found=1
            fi
        done < "$profile"
        if [[ $found -eq 0 ]]; then
            missing_fields+=("$field")
        fi
    done

    if [[ ${#missing_fields[@]} -gt 0 ]]; then
        echo "ERROR: $filename - missing required envelope fields: ${missing_fields[*]}"
        ((invalid++))
        continue
    fi

    cp "$profile" "$OUTPUT_DIR/"
    echo "  -> Valid, copied to compiled/"
done

if [[ $invalid -gt 0 ]]; then
    echo ""
    echo "Bundle compilation FAILED: $invalid profile(s) invalid"
    exit 1
fi

echo ""
echo "Bundle compiled: $count profiles ready"
exit 0
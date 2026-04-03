#!/usr/bin/env bash
set -euo pipefail

# check-overlaps.sh — Checks for content overlap/duplication across reference files
# Usage: bash scripts/check-overlaps.sh <skill-directory>
# Exit 0 = no significant overlaps, Exit 1 = overlaps detected (with report to stdout)

readonly SCRIPT_NAME="$(basename "$0")"
readonly SKILL_DIR="${1:?Usage: $SCRIPT_NAME <skill-directory>}"

overlaps=0
tmp_dir=""

cleanup() {
  if [[ -n "$tmp_dir" ]] && [[ -d "$tmp_dir" ]]; then
    rm -rf "$tmp_dir"
  fi
}
trap cleanup EXIT

report_overlap() {
  local severity="$1"
  local file_a="$2"
  local file_b="$3"
  local detail="$4"
  overlaps=$((overlaps + 1))
  echo "[$severity] $file_a <-> $file_b: $detail"
}

# --- Gate 1: Directory Validation ---

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "Error: Directory '$SKILL_DIR' does not exist" >&2
  exit 1
fi

if [[ ! -f "$SKILL_DIR/SKILL.md" ]]; then
  echo "Error: SKILL.md not found in $SKILL_DIR" >&2
  exit 1
fi

# --- Gate 2: Collect All Markdown Files ---

md_files=()
while IFS= read -r file; do
  [[ -n "$file" ]] && md_files+=("$file")
done < <(find "$SKILL_DIR" -name "*.md" -type f | sort)

if [[ ${#md_files[@]} -lt 2 ]]; then
  echo "No overlaps possible (only ${#md_files[@]} markdown file found)"
  exit 0
fi

tmp_dir=$(mktemp -d)

# --- Gate 3: Check for Duplicate Headings ---

heading_file="$tmp_dir/headings.txt"
> "$heading_file"

for file in "${md_files[@]}"; do
  rel_path="${file#$SKILL_DIR/}"
  grep '^## ' "$file" 2>/dev/null | while IFS= read -r heading; do
    heading_clean=$(echo "$heading" | sed 's/^## *//' | tr '[:upper:]' '[:lower:]')
    echo "${heading_clean}|${rel_path}"
  done >> "$heading_file" || true
done

if [[ -s "$heading_file" ]]; then
  sort "$heading_file" | while IFS='|' read -r heading file; do
    echo "$heading"
  done | sort | uniq -d > "$tmp_dir/dup_headings.txt" || true

  while IFS= read -r dup_heading; do
    [[ -z "$dup_heading" ]] && continue
    files_with_heading=$(grep "^${dup_heading}|" "$heading_file" | cut -d'|' -f2 | sort -u)
    file_count=$(echo "$files_with_heading" | wc -l | tr -d ' ')
    if [[ "$file_count" -gt 1 ]]; then
      file_list=$(echo "$files_with_heading" | tr '\n' ', ' | sed 's/,$//')
      report_overlap "MEDIUM" "$file_list" "" "Duplicate H2 heading: '$dup_heading'"
    fi
  done < "$tmp_dir/dup_headings.txt"
fi

# --- Gate 4: Check for Repeated Paragraphs (3+ lines) ---

blocks_file="$tmp_dir/blocks.txt"
> "$blocks_file"

for file in "${md_files[@]}"; do
  rel_path="${file#$SKILL_DIR/}"
  line_count=$(wc -l < "$file" | tr -d ' ')

  if [[ "$line_count" -lt 3 ]]; then
    continue
  fi

  i=1
  while [[ $i -le $((line_count - 2)) ]]; do
    block=$(sed -n "${i},$((i + 2))p" "$file" | tr '\n' ' ' | sed 's/  */ /g')
    if [[ -z "$block" ]] || [[ "$block" == "---"* ]] || [[ "$block" == '```'* ]]; then
      i=$((i + 1))
      continue
    fi

    block_hash=$(echo "$block" | md5sum | cut -d' ' -f1)
    echo "${block_hash}|${rel_path}|${block:0:80}" >> "$blocks_file"
    i=$((i + 1))
  done
done

if [[ -s "$blocks_file" ]]; then
  cut -d'|' -f1 "$blocks_file" | sort | uniq -d > "$tmp_dir/dup_hashes.txt" || true

  while IFS= read -r dup_hash; do
    [[ -z "$dup_hash" ]] && continue
    files_with_block=$(grep "^${dup_hash}|" "$blocks_file" | cut -d'|' -f2 | sort -u)
    file_count=$(echo "$files_with_block" | wc -l | tr -d ' ')
    if [[ "$file_count" -gt 1 ]]; then
      preview=$(grep "^${dup_hash}|" "$blocks_file" | head -1 | cut -d'|' -f3)
      file_list=$(echo "$files_with_block" | tr '\n' ', ' | sed 's/,$//')
      report_overlap "LOW" "$file_list" "" "Repeated 3-line block: '$preview...'"
    fi
  done < "$tmp_dir/dup_hashes.txt"
fi

# --- Gate 5: Check for Cross-File Content Duplication ---

ref_files=()
while IFS= read -r file; do
  [[ -n "$file" ]] && ref_files+=("$file")
done < <(find "$SKILL_DIR/references" -name "*.md" -type f 2>/dev/null | sort)

if [[ ${#ref_files[@]} -ge 2 ]]; then
  for ((i = 0; i < ${#ref_files[@]}; i++)); do
    for ((j = i + 1; j < ${#ref_files[@]}; j++)); do
      file_a="${ref_files[$i]}"
      file_b="${ref_files[$j]}"
      rel_a="${file_a#$SKILL_DIR/}"
      rel_b="${file_b#$SKILL_DIR/}"

      grep -oE '[a-zA-Z]{5,}' "$file_a" 2>/dev/null | tr '[:upper:]' '[:lower:]' | sort -u > "$tmp_dir/words_a.txt" || true
      grep -oE '[a-zA-Z]{5,}' "$file_b" 2>/dev/null | tr '[:upper:]' '[:lower:]' | sort -u > "$tmp_dir/words_b.txt" || true

      if [[ ! -s "$tmp_dir/words_a.txt" ]] || [[ ! -s "$tmp_dir/words_b.txt" ]]; then
        continue
      fi

      shared=$(comm -12 "$tmp_dir/words_a.txt" "$tmp_dir/words_b.txt" | wc -l | tr -d ' ')
      total_a=$(wc -l < "$tmp_dir/words_a.txt" | tr -d ' ')
      total_b=$(wc -l < "$tmp_dir/words_b.txt" | tr -d ' ')
      min_total=$((total_a < total_b ? total_a : total_b))

      if [[ "$min_total" -gt 0 ]]; then
        overlap_pct=$((shared * 100 / min_total))

        if [[ "$overlap_pct" -gt 40 ]]; then
          report_overlap "HIGH" "$rel_a" "$rel_b" "High content overlap: ${overlap_pct}% shared vocabulary ($shared words)"
        elif [[ "$overlap_pct" -gt 25 ]]; then
          report_overlap "MEDIUM" "$rel_a" "$rel_b" "Moderate content overlap: ${overlap_pct}% shared vocabulary ($shared words)"
        fi
      fi
    done
  done
fi

# --- Gate 6: Check SKILL.md for Oversized Sections ---

if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
  current_section=""
  section_lines=0

  while IFS= read -r line; do
    if echo "$line" | grep -qE '^## [A-Z]'; then
      if [[ "$section_lines" -gt 50 ]] && [[ -n "$current_section" ]]; then
        report_overlap "LOW" "SKILL.md" "references/" "Section '$current_section' is $section_lines lines — consider moving to references/"
      fi
      current_section=$(echo "$line" | sed 's/^## *//')
      section_lines=0
    fi
    section_lines=$((section_lines + 1))
  done < "$SKILL_DIR/SKILL.md"

  if [[ "$section_lines" -gt 50 ]] && [[ -n "$current_section" ]]; then
    report_overlap "LOW" "SKILL.md" "references/" "Section '$current_section' is $section_lines lines — consider moving to references/"
  fi
fi

# --- Summary ---

echo ""
if [[ $overlaps -gt 0 ]]; then
  echo "Overlap check complete: $overlaps overlap(s) detected"
  echo ""
  echo "Severity guide:"
  echo "  HIGH   — Significant duplication. Merge or differentiate files."
  echo "  MEDIUM — Notable overlap. Review for consolidation opportunities."
  echo "  LOW    — Minor repetition. May be intentional (cross-references, examples)."
  exit 1
else
  echo "Overlap check complete: No significant overlaps detected"
  exit 0
fi

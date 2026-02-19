#!/usr/bin/env bash
set -euo pipefail

root="${1:-skills}"
report_path="${2:-}"

if [[ ! -d "$root" ]]; then
  echo "skill root not found: $root" >&2
  exit 1
fi

mapfile -t skill_files < <(find "$root" -maxdepth 2 -name SKILL.md | sort)
if [[ "${#skill_files[@]}" -eq 0 ]]; then
  echo "no SKILL.md files found under $root" >&2
  exit 2
fi

if [[ -z "$report_path" ]]; then
  report_path="/tmp/hivefiver-skill-audit-$(date +%Y%m%d-%H%M%S).md"
fi

contains_keyword() {
  local text="$1"
  shift
  local kw
  for kw in "$@"; do
    if [[ "$text" == *"$kw"* ]]; then
      return 0
    fi
  done
  return 1
}

dev=0
marketing=0
finance=0
office=0
web=0

for file in "${skill_files[@]}"; do
  body="$(tr '[:upper:]' '[:lower:]' < "$file")"
  if contains_keyword "$body" "typescript" "architecture" "test" "plugin" "sdk" "code"; then
    dev=$((dev + 1))
  fi
  if contains_keyword "$body" "marketing" "campaign" "content" "seo" "growth"; then
    marketing=$((marketing + 1))
  fi
  if contains_keyword "$body" "finance" "budget" "forecast" "account" "tco"; then
    finance=$((finance + 1))
  fi
  if contains_keyword "$body" "office" "documentation" "workflow" "sop" "onboarding"; then
    office=$((office + 1))
  fi
  if contains_keyword "$body" "research" "web" "browse" "search" "deepwiki" "tavily"; then
    web=$((web + 1))
  fi
done

{
  echo "# HiveFiver Skill Coverage Audit"
  echo
  echo "- Scanned root: \`$root\`"
  echo "- Total skills: ${#skill_files[@]}"
  echo
  echo "## Domain Coverage"
  echo
  echo "| Domain | Matching Skills | Status |"
  echo "|---|---:|---|"
  printf "| Dev | %d | %s |\n" "$dev" "$([[ $dev -gt 0 ]] && echo covered || echo gap)"
  printf "| Marketing | %d | %s |\n" "$marketing" "$([[ $marketing -gt 0 ]] && echo covered || echo gap)"
  printf "| Finance | %d | %s |\n" "$finance" "$([[ $finance -gt 0 ]] && echo covered || echo gap)"
  printf "| Office Ops | %d | %s |\n" "$office" "$([[ $office -gt 0 ]] && echo covered || echo gap)"
  printf "| Web Research | %d | %s |\n" "$web" "$([[ $web -gt 0 ]] && echo covered || echo gap)"
  echo
  echo "## Skill Files"
  echo
  for file in "${skill_files[@]}"; do
    echo "- \`$file\`"
  done
} > "$report_path"

echo "$report_path"

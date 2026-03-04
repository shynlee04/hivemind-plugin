#!/usr/bin/env bash
# validate-plan-frontmatter.sh
# Version: 1.0.0
# Description: Validate required plan metadata in Markdown plan documents.
# Usage:
#   validate-plan-frontmatter.sh [--json] [--strict] [directory]
#   validate-plan-frontmatter.sh --help
# Author: hivemaker

set -euo pipefail

VERSION="1.0.0"
SCRIPT_NAME="$(basename "$0")"
DEFAULT_DIR=".hivemind/plans/"

JSON_MODE=0
STRICT_MODE=0
TARGET_DIR=""

STATUS_VALUES_REGEX='draft|active|completed|deprecated|superseded'
DATE_REGEX='[0-9]{4}-[0-9]{2}-[0-9]{2}'
PLAN_ID_REGEX='[A-Z][A-Z0-9]*[0-9]+-[A-Z][A-Z0-9]*[0-9]+(-[A-Z][A-Z0-9]*[0-9]+)?'

usage() {
  cat <<EOF
${SCRIPT_NAME} v${VERSION}

Validate required frontmatter-style metadata for plan documents.

Required keys:
  - title   (H1 heading: '# ...')
  - date    (date field, body date, or filename date YYYY-MM-DD)
  - status  (draft|active|completed|deprecated|superseded)
  - owner   (owner field, bold Owner label, or Maintained By)
  - plan_id (plan_id/Plan ID field or plan ID pattern)

Usage:
  ${SCRIPT_NAME} [--json] [--strict] [directory]

Options:
  --json     Output machine-readable JSON
  --strict   Exit 1 when any warnings are found
  --help     Show this help message

Examples:
  ${SCRIPT_NAME}
  ${SCRIPT_NAME} .hivemind/plans/
  ${SCRIPT_NAME} --strict docs/plans/
  ${SCRIPT_NAME} --json .hivemind/plans/
EOF
}

init_colors() {
  if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    C_GREEN='\033[0;32m'
    C_YELLOW='\033[0;33m'
    C_RED='\033[0;31m'
    C_RESET='\033[0m'
  else
    C_GREEN=''
    C_YELLOW=''
    C_RED=''
    C_RESET=''
  fi
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
}

trim() {
  printf '%s' "$1" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//'
}

first_nonempty_body_line() {
  awk '
    BEGIN { in_fm = 0 }
    NR == 1 && $0 == "---" { in_fm = 1; next }
    in_fm == 1 && $0 == "---" { in_fm = 0; next }
    in_fm == 1 { next }
    /^[[:space:]]*$/ { next }
    { print; exit }
  ' "$1" 2>/dev/null || true
}

extract_title() {
  local file="$1"
  local first_line
  local title
  first_line="$(first_nonempty_body_line "$file")"
  if printf '%s' "$first_line" | grep -Eq '^# '; then
    title="${first_line#\# }"
    trim "$title"
    return 0
  fi
  return 1
}

extract_date() {
  local file="$1"
  local base
  local line
  local value

  line="$(grep -Eim1 "^[[:space:]]*[Dd]ate[[:space:]]*:[[:space:]]*${DATE_REGEX}" "$file" || true)"
  if [ -n "$line" ]; then
    value="$(printf '%s' "$line" | grep -Eo "${DATE_REGEX}" | sed -n '1p')"
    if [ -n "$value" ]; then
      printf '%s\n' "$value"
      return 0
    fi
  fi

  value="$(grep -Eo "${DATE_REGEX}" "$file" | sed -n '1p' || true)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi

  base="$(basename "$file")"
  value="$(printf '%s' "$base" | grep -Eo "${DATE_REGEX}" | sed -n '1p' || true)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi

  return 1
}

extract_status() {
  local file="$1"
  local line
  local value

  line="$(grep -Eim1 "^[[:space:]]*[Ss]tatus[[:space:]]*:[[:space:]]*(${STATUS_VALUES_REGEX})[[:space:]]*$" "$file" || true)"
  if [ -z "$line" ]; then
    line="$(grep -Eim1 "\*\*[Ss]tatus\*\*[[:space:]]*:[[:space:]]*(${STATUS_VALUES_REGEX})[[:space:]]*$" "$file" || true)"
  fi

  if [ -n "$line" ]; then
    value="$(printf '%s' "$line" | sed -E 's/^.*:[[:space:]]*//; s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')"
    if printf '%s' "$value" | grep -Eq "^(${STATUS_VALUES_REGEX})$"; then
      printf '%s\n' "$value"
      return 0
    fi
  fi

  return 1
}

extract_owner() {
  local file="$1"
  local line
  local value

  line="$(grep -Eim1 '^[[:space:]]*[Oo]wner[[:space:]]*:[[:space:]]*.+$' "$file" || true)"
  if [ -z "$line" ]; then
    line="$(grep -Eim1 '^\*\*[Oo]wner\*\*[[:space:]]*:[[:space:]]*.+$' "$file" || true)"
  fi
  if [ -z "$line" ]; then
    line="$(grep -Eim1 '^[[:space:]]*[Mm]aintained[[:space:]]+[Bb]y[[:space:]]*:[[:space:]]*.+$' "$file" || true)"
  fi

  if [ -n "$line" ]; then
    value="$(printf '%s' "$line" | sed -E 's/^.*:[[:space:]]*//; s/[[:space:]]*$//')"
    if [ -n "$value" ]; then
      printf '%s\n' "$value"
      return 0
    fi
  fi

  return 1
}

extract_plan_id() {
  local file="$1"
  local base
  local line
  local value

  line="$(grep -Eim1 '^[[:space:]]*plan_id[[:space:]]*:[[:space:]]*[^[:space:]].*$' "$file" || true)"
  if [ -z "$line" ]; then
    line="$(grep -Eim1 '^[[:space:]]*Plan[[:space:]]+ID[[:space:]]*:[[:space:]]*[^[:space:]].*$' "$file" || true)"
  fi
  if [ -n "$line" ]; then
    value="$(printf '%s' "$line" | sed -E 's/^.*:[[:space:]]*//; s/[[:space:]]*$//')"
    if [ -n "$value" ]; then
      printf '%s\n' "$value"
      return 0
    fi
  fi

  value="$(grep -Eo "${PLAN_ID_REGEX}" "$file" | sed -n '1p' || true)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi

  base="$(basename "$file")"
  value="$(printf '%s' "$base" | grep -Eo "${PLAN_ID_REGEX}" | sed -n '1p' || true)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return 0
  fi

  return 1
}

print_human_result() {
  local status="$1"
  local file_display="$2"
  local title_ok="$3"
  local title_val="$4"
  local date_ok="$5"
  local date_val="$6"
  local status_ok="$7"
  local status_val="$8"
  local owner_ok="$9"
  local owner_val="${10}"
  local plan_ok="${11}"
  local plan_val="${12}"

  local marker
  if [ "$status" = "PASS" ]; then
    marker="${C_GREEN}[PASS]${C_RESET}"
  else
    marker="${C_YELLOW}[WARN]${C_RESET}"
  fi

  printf '%b %s\n' "$marker" "$file_display"

  if [ "$title_ok" -eq 1 ]; then
    printf '  %b title: "%s"\n' "${C_GREEN}✓${C_RESET}" "$title_val"
  else
    printf '  %b title: not found\n' "${C_YELLOW}✗${C_RESET}"
  fi

  if [ "$date_ok" -eq 1 ]; then
    printf '  %b date: %s\n' "${C_GREEN}✓${C_RESET}" "$date_val"
  else
    printf '  %b date: not found\n' "${C_YELLOW}✗${C_RESET}"
  fi

  if [ "$status_ok" -eq 1 ]; then
    printf '  %b status: %s\n' "${C_GREEN}✓${C_RESET}" "$status_val"
  else
    printf '  %b status: not found\n' "${C_YELLOW}✗${C_RESET}"
  fi

  if [ "$owner_ok" -eq 1 ]; then
    printf '  %b owner: %s\n' "${C_GREEN}✓${C_RESET}" "$owner_val"
  else
    printf '  %b owner: not found\n' "${C_YELLOW}✗${C_RESET}"
  fi

  if [ "$plan_ok" -eq 1 ]; then
    printf '  %b plan_id: %s\n' "${C_GREEN}✓${C_RESET}" "$plan_val"
  else
    printf '  %b plan_id: not found\n' "${C_YELLOW}✗${C_RESET}"
  fi

  printf '\n'
}

build_missing_json_array() {
  local title_ok="$1"
  local date_ok="$2"
  local status_ok="$3"
  local owner_ok="$4"
  local plan_ok="$5"
  local missing=''
  local sep=''

  if [ "$title_ok" -eq 0 ]; then
    missing="${missing}${sep}\"title\""
    sep=','
  fi
  if [ "$date_ok" -eq 0 ]; then
    missing="${missing}${sep}\"date\""
    sep=','
  fi
  if [ "$status_ok" -eq 0 ]; then
    missing="${missing}${sep}\"status\""
    sep=','
  fi
  if [ "$owner_ok" -eq 0 ]; then
    missing="${missing}${sep}\"owner\""
    sep=','
  fi
  if [ "$plan_ok" -eq 0 ]; then
    missing="${missing}${sep}\"plan_id\""
  fi

  printf '[%s]' "$missing"
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --json)
        JSON_MODE=1
        ;;
      --strict)
        STRICT_MODE=1
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      --)
        shift
        break
        ;;
      -*)
        printf 'Error: unknown option: %s\n' "$1" >&2
        usage >&2
        exit 2
        ;;
      *)
        if [ -n "$TARGET_DIR" ]; then
          printf 'Error: multiple directories provided\n' >&2
          usage >&2
          exit 2
        fi
        TARGET_DIR="$1"
        ;;
    esac
    shift
  done

  if [ "$#" -gt 0 ]; then
    if [ -n "$TARGET_DIR" ]; then
      printf 'Error: multiple directories provided\n' >&2
      usage >&2
      exit 2
    fi
    TARGET_DIR="$1"
  fi

  if [ -z "$TARGET_DIR" ]; then
    TARGET_DIR="$DEFAULT_DIR"
  fi
}

main() {
  parse_args "$@"
  init_colors

  if [ ! -d "$TARGET_DIR" ]; then
    if [ "$JSON_MODE" -eq 1 ]; then
      printf '{\n'
      printf '  "tool": "validate-plan-frontmatter",\n'
      printf '  "version": "%s",\n' "$VERSION"
      printf '  "error": "Directory not found",\n'
      printf '  "directory": "%s"\n' "$(json_escape "$TARGET_DIR")"
      printf '}\n'
    else
      printf '%bError:%b directory not found: %s\n' "$C_RED" "$C_RESET" "$TARGET_DIR" >&2
    fi
    exit 1
  fi

  local files=()
  local file
  while IFS= read -r file; do
    files+=("$file")
  done < <(find "$TARGET_DIR" -type f -name '*.md' -print | sort)

  local total="${#files[@]}"
  local pass_count=0
  local warn_count=0
  local results_json=''
  local json_sep=''

  if [ "$JSON_MODE" -eq 0 ]; then
    printf 'validate-plan-frontmatter v%s\n' "$VERSION"
    printf 'Scanning: %s\n' "$TARGET_DIR"
    printf 'Found: %s plan files\n\n' "$total"
  fi

  for file in "${files[@]}"; do
    local file_display
    local file_json
    local is_text=1

    local title_ok=0
    local date_ok=0
    local status_ok=0
    local owner_ok=0
    local plan_ok=0

    local title_val='not found'
    local date_val='not found'
    local status_val='not found'
    local owner_val='not found'
    local plan_val='not found'

    local check_status='WARN'
    local missing_json='[]'

    file_display="${file#${TARGET_DIR%/}/}"
    if [ "$file_display" = "$file" ]; then
      file_display="$(basename "$file")"
    fi

    if ! LC_ALL=C grep -Iq . "$file"; then
      is_text=0
    fi

    if [ "$is_text" -eq 1 ]; then
      if title_val="$(extract_title "$file")"; then
        title_ok=1
      fi
      if date_val="$(extract_date "$file")"; then
        date_ok=1
      fi
      if status_val="$(extract_status "$file")"; then
        status_ok=1
      fi
      if owner_val="$(extract_owner "$file")"; then
        owner_ok=1
      fi
      if plan_val="$(extract_plan_id "$file")"; then
        plan_ok=1
      fi
    else
      title_val='binary/non-text file'
      date_val='binary/non-text file'
      status_val='binary/non-text file'
      owner_val='binary/non-text file'
      plan_val='binary/non-text file'
    fi

    if [ "$title_ok" -eq 1 ] && [ "$date_ok" -eq 1 ] && [ "$status_ok" -eq 1 ] && [ "$owner_ok" -eq 1 ] && [ "$plan_ok" -eq 1 ]; then
      check_status='PASS'
      pass_count=$((pass_count + 1))
    else
      check_status='WARN'
      warn_count=$((warn_count + 1))
    fi

    missing_json="$(build_missing_json_array "$title_ok" "$date_ok" "$status_ok" "$owner_ok" "$plan_ok")"

    if [ "$JSON_MODE" -eq 0 ]; then
      print_human_result \
        "$check_status" \
        "$file_display" \
        "$title_ok" "$title_val" \
        "$date_ok" "$date_val" \
        "$status_ok" "$status_val" \
        "$owner_ok" "$owner_val" \
        "$plan_ok" "$plan_val"
    fi

    file_json="{\"file\":\"$(json_escape "$file_display")\",\"status\":\"$check_status\",\"checks\":{\"title\":{\"ok\":$([ "$title_ok" -eq 1 ] && printf true || printf false),\"value\":\"$(json_escape "$title_val")\"},\"date\":{\"ok\":$([ "$date_ok" -eq 1 ] && printf true || printf false),\"value\":\"$(json_escape "$date_val")\"},\"status\":{\"ok\":$([ "$status_ok" -eq 1 ] && printf true || printf false),\"value\":\"$(json_escape "$status_val")\"},\"owner\":{\"ok\":$([ "$owner_ok" -eq 1 ] && printf true || printf false),\"value\":\"$(json_escape "$owner_val")\"},\"plan_id\":{\"ok\":$([ "$plan_ok" -eq 1 ] && printf true || printf false),\"value\":\"$(json_escape "$plan_val")\"}},\"missing\":$missing_json}"

    results_json="${results_json}${json_sep}${file_json}"
    json_sep=','
  done

  local exit_code=0
  if [ "$STRICT_MODE" -eq 1 ] && [ "$warn_count" -gt 0 ]; then
    exit_code=1
  fi

  if [ "$JSON_MODE" -eq 1 ]; then
    printf '{\n'
    printf '  "tool": "validate-plan-frontmatter",\n'
    printf '  "version": "%s",\n' "$VERSION"
    printf '  "scanning": "%s",\n' "$(json_escape "$TARGET_DIR")"
    printf '  "found": %s,\n' "$total"
    printf '  "strict": %s,\n' "$([ "$STRICT_MODE" -eq 1 ] && printf true || printf false)"
    printf '  "results": [%s],\n' "$results_json"
    printf '  "summary": {"passed": %s, "warnings": %s},\n' "$pass_count" "$warn_count"
    printf '  "exit_code": %s\n' "$exit_code"
    printf '}\n'
  else
    printf 'Summary: %s passed, %s warnings\n' "$pass_count" "$warn_count"
  fi

  exit "$exit_code"
}

main "$@"

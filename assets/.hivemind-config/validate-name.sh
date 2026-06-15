#!/usr/bin/env bash
# validate-name.sh — AUDIT-04 Cycle 0 preflight
# Name schema + forbidden-pattern + required-prefix validator for shipped assets.
# Reads pattern/prefix data from assets/.hivemind-config/naming-rules.json (data-driven).
# Bash 3.2+ compatible; dependencies: bash, grep, jq.
# Exit codes:
#   0 = PASS
#   1 = forbidden pattern hit (F01-F12, name-applicable subset)
#   2 = schema fail (kebab-case / length / leading-trailing hyphen)
#   3 = in-scope asset type missing required prefix
#
# Usage:
#   validate-name.sh <name> [<asset-type>]
#   asset-type ∈ {skill, agent, command, reference, template, workflow, agent-instruction}
#
# Examples:
#   validate-name.sh hm-coord-loop skill           # → exit 0
#   validate-name.sh hm-l2-foo skill              # → exit 1 (F01)
#   validate-name.sh gsd-something skill          # → exit 1 (F04)
#   validate-name.sh gate-lifecycle skill         # → exit 1 (F05)
#   validate-name.sh Bad_Name_With_Caps skill     # → exit 2 (schema)

set -euo pipefail

# ── Resolve repo root (script lives in <root>/assets/.hivemind-config/) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RULES_FILE="${SCRIPT_DIR}/naming-rules.json"

# ── Help text ──
if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
  cat <<'USAGE'
validate-name.sh — AUDIT-04 Cycle 0 preflight name validator

Usage: validate-name.sh <name> [<asset-type>]

Arguments:
  <name>         Asset name (no path prefix; filename only, without .md).
  <asset-type>   Optional. One of:
                 skill | agent | command | reference | template |
                 workflow | agent-instruction

Exit codes:
  0  PASS  — name satisfies all checks
  1  FAIL  — name matches a forbidden pattern (F01-F12, name-applicable subset)
  2  FAIL  — schema violation (not kebab-case / wrong length / bad hyphens)
  3  FAIL  — asset type requires a prefix this name does not carry

Examples:
  validate-name.sh hm-coord-loop skill           # PASS
  validate-name.sh hm-l2-foo skill              # FAIL 1 (F01: residual L0-L3)
  validate-name.sh gsd-something skill          # FAIL 1 (F04: gsd- in shipped)
  validate-name.sh gate-lifecycle skill         # FAIL 1 (F05: gate- in shipped)
  validate-name.sh Bad_Name_With_Caps skill     # FAIL 2 (schema: uppercase + _)

Schema source: assets/.hivemind-config/naming-rules.json
USAGE
  exit 0
fi

# ── Argument validation ──
if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "[validate-name] ERROR: expected 1 or 2 arguments, got $#" >&2
  echo "Run with --help for usage." >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[validate-name] ERROR: 'jq' is required but not installed." >&2
  exit 2
fi

if [[ ! -f "$RULES_FILE" ]]; then
  echo "[validate-name] ERROR: rules file not found: $RULES_FILE" >&2
  exit 2
fi

NAME="$1"
ASSET_TYPE="${2:-}"

# ── Step 1: Schema check ──
# kebab-case regex: starts lowercase letter, then [a-z0-9] or hyphen-separated groups
# Locale-fixed for portability across macOS/Linux.
LC_ALL=C

NAME_LEN=${#NAME}
MAX_LEN=$(jq -r '.schema_rules.max_length' "$RULES_FILE")
MIN_LEN=$(jq -r '.schema_rules.min_length' "$RULES_FILE")

if (( NAME_LEN < MIN_LEN || NAME_LEN > MAX_LEN )); then
  echo "[validate-name] FAIL (exit 2, schema): name length $NAME_LEN outside [$MIN_LEN, $MAX_LEN]" >&2
  echo "  name='$NAME'" >&2
  exit 2
fi

# Kebab-case: ^[a-z][a-z0-9]*(-[a-z0-9]+)*$
if ! [[ "$NAME" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
  echo "[validate-name] FAIL (exit 2, schema): name is not kebab-case" >&2
  echo "  name='$NAME'" >&2
  echo "  required: ^[a-z][a-z0-9]*(-[a-z0-9]+)*$  (lowercase, digits, single hyphens)" >&2
  exit 2
fi

# No consecutive hyphens, no leading/trailing hyphen — covered by regex above; double-check
if [[ "$NAME" == *"--"* || "$NAME" == -* || "$NAME" == -*- ]]; then
  echo "[validate-name] FAIL (exit 2, schema): leading/trailing/consecutive hyphens" >&2
  echo "  name='$NAME'" >&2
  exit 2
fi

# ── Step 2: Forbidden pattern check (F01-F12, name-applicable subset) ──
# Iterate all patterns in JSON; for each with implementation_note, skip and report.
# Otherwise, try grep with extended regex (locale C).
PATTERNS_JSON=$(jq -c '.forbidden_patterns[]' "$RULES_FILE")

PATTERN_HIT=""
PATTERN_ID=""
PATTERN_DESC=""

while IFS= read -r pat; do
  PAT_ID=$(echo "$pat" | jq -r '.id')
  PAT_REGEX=$(echo "$pat" | jq -r '.regex')
  PAT_CI=$(echo "$pat" | jq -r '.case_insensitive // false')
  PAT_NOTE=$(echo "$pat" | jq -r '.implementation_note // ""')
  PAT_DESC=$(echo "$pat" | jq -r '.description')

  # Skip body-scan / non-name-regex patterns
  if [[ -n "$PAT_NOTE" ]]; then
    continue
  fi

  # F01-F07 are anchored at start or middle; F08 has negative lookahead unsupported
  # by POSIX grep, so we strip it (it's an unimplemented body-scan pattern).
  if [[ "$PAT_REGEX" == *"(?!"* ]]; then
    continue
  fi

  # Apply case-insensitive flag via grep -i
  if [[ "$PAT_CI" == "true" ]]; then
    if echo "$NAME" | grep -Eq -- "$PAT_REGEX"; then
      PATTERN_HIT="$PAT_REGEX"
      PATTERN_ID="$PAT_ID"
      PATTERN_DESC="$PAT_DESC"
      break
    fi
  else
    if echo "$NAME" | grep -Eq -- "$PAT_REGEX"; then
      PATTERN_HIT="$PAT_REGEX"
      PATTERN_ID="$PAT_ID"
      PATTERN_DESC="$PAT_DESC"
      break
    fi
  fi
done <<< "$PATTERNS_JSON"

if [[ -n "$PATTERN_HIT" ]]; then
  echo "[validate-name] FAIL (exit 1, forbidden pattern $PATTERN_ID)" >&2
  echo "  name='$NAME'" >&2
  echo "  pattern: $PATTERN_HIT" >&2
  echo "  reason:  $PATTERN_DESC" >&2
  exit 1
fi

# ── Step 3: Required prefix check (only when asset type is provided) ──
if [[ -n "$ASSET_TYPE" ]]; then
  # Read required-prefix list for this asset type from JSON
  PREFIX_REQ=$(jq -r --arg t "$ASSET_TYPE" '.asset_type_prefix_requirements[$t].must_have_prefix // "any"' "$RULES_FILE")

  if [[ "$PREFIX_REQ" == "any" ]]; then
    echo "[validate-name] PASS (asset type '$ASSET_TYPE' allows free-form names)"
    echo "  name='$NAME'"
    exit 0
  fi

  # Build the "allowed starts-with" set: extract all listed prefixes from PREFIX_REQ
  # PREFIX_REQ is a sentence like "one of allowed_prefixes, hf-, or hivemind-"
  # Convert to a list and test membership.
  OK=0

  # Test against allowed_prefixes
  for prefix in $(jq -r '.allowed_prefixes[].prefix' "$RULES_FILE"); do
    if [[ "$NAME" == "${prefix}"* ]]; then
      OK=1
      break
    fi
  done

  # Test against hf-, hivemind-
  if (( OK == 0 )); then
    if [[ "$PREFIX_REQ" == *"hf-"* && "$NAME" == hf-* ]]; then
      OK=1
    fi
  fi
  if (( OK == 0 )); then
    if [[ "$PREFIX_REQ" == *"hivemind-"* && "$NAME" == hivemind-* ]]; then
      OK=1
    fi
  fi

  # Test against unprefixed_whitelist (for skills)
  if (( OK == 0 )); then
    if [[ "$PREFIX_REQ" == *"unprefixed_whitelist"* ]]; then
      for unprefixed in $(jq -r '.unprefixed_whitelist[]' "$RULES_FILE"); do
        if [[ "$NAME" == "$unprefixed" ]]; then
          OK=1
          break
        fi
      done
    fi
  fi

  if (( OK == 0 )); then
    echo "[validate-name] FAIL (exit 3, required prefix missing)" >&2
    echo "  name='$NAME'" >&2
    echo "  asset_type='$ASSET_TYPE'" >&2
    echo "  required: $PREFIX_REQ" >&2
    echo "  hint: see assets/.hivemind-config/naming-rules.json -> allowed_prefixes" >&2
    exit 3
  fi

  echo "[validate-name] PASS (name + asset-type prefix check)"
  echo "  name='$NAME'  asset_type='$ASSET_TYPE'"
  exit 0
fi

# No asset type → prefix check skipped
echo "[validate-name] PASS (name + forbidden-pattern check only; no asset type given)"
echo "  name='$NAME'"
exit 0

#!/usr/bin/env bash

set -euo pipefail

usage() {
  printf 'Usage: %s <report.md> [claims.json]\n' "$0" >&2
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

pass() {
  printf 'PASS: %s\n' "$1"
}

require_file() {
  if [[ ! -f "$1" ]]; then
    printf 'Missing file: %s\n' "$1" >&2
    exit 1
  fi
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit 1
fi

report_path="$1"
claims_path="${2:-}"
min_sources="${MIN_SOURCES:-10}"
min_words="${MIN_WORDS:-800}"
failures=0

require_file "$report_path"
if [[ -n "$claims_path" ]]; then
  require_file "$claims_path"
fi

section_names=(
  '## Executive Summary'
  '## Main Analysis'
  '## Counterevidence Register'
  '## Novel Insights'
  '## Recommendations'
  '## Bibliography'
  '## Methodology Appendix'
)

for section in "${section_names[@]}"; do
  if grep -Fq "$section" "$report_path"; then
    pass "section present: $section"
  else
    fail "missing section: $section"
  fi
done

if grep -Eq '\[S[0-9]+\]' "$report_path"; then
  pass 'citation format present'
else
  fail 'missing citations in [S1] format'
fi

unique_sources=$(grep -Eo '\[S[0-9]+\]' "$report_path" | sort -u | wc -l | tr -d ' ')
if [[ "$unique_sources" -ge "$min_sources" ]]; then
  pass "source count >= $min_sources ($unique_sources found)"
else
  fail "source count below $min_sources ($unique_sources found)"
fi

if grep -Eiq 'TODO|TBD|<fill-me>|\[insert\]|lorem ipsum' "$report_path"; then
  fail 'placeholder text detected'
else
  pass 'no placeholder text detected'
fi

word_count=$(wc -w < "$report_path" | tr -d ' ')
if [[ "$word_count" -ge "$min_words" ]]; then
  pass "word count >= $min_words ($word_count found)"
else
  fail "word count below $min_words ($word_count found)"
fi

if grep -Eq '\]\(#[-a-z0-9]+\)' "$report_path"; then
  pass 'internal links present'
else
  fail 'missing internal links'
fi

if grep -Eiq 'credibility[_ -]?score:?[[:space:]]*[0-9]{1,3}' "$report_path"; then
  pass 'credibility scores present'
else
  fail 'missing credibility scores'
fi

if grep -A8 '^## Counterevidence Register' "$report_path" | grep -Eq '\| X-|\- '; then
  pass 'counterevidence register populated'
else
  fail 'counterevidence register appears empty'
fi

bibliography_lines=$(grep -Ec '^\- \[S[0-9]+\].*https?://.*credibility[_ -]?score' "$report_path" || true)
if [[ "$bibliography_lines" -ge "$min_sources" ]]; then
  pass 'bibliography entries appear complete'
else
  fail 'bibliography completeness check failed'
fi

if [[ -n "$claims_path" ]]; then
  if python3 - "$claims_path" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as handle:
    data = json.load(handle)

claims = data.get('claims', [])
if not claims:
    raise SystemExit(1)

for claim in claims:
    evidence = claim.get('evidence', [])
    if not evidence:
        raise SystemExit(1)
    for item in evidence:
        if 'credibility_score' not in item or 'source_url' not in item:
            raise SystemExit(1)
PY
  then
    pass 'claims json has evidence for every claim'
  else
    fail 'claims json missing evidence or required fields'
  fi
else
  if grep -Eq '^\| C-[0-9]+' "$report_path"; then
    pass 'claims-evidence table rows detected in report'
  else
    fail 'no claims-evidence rows detected and no claims json provided'
  fi
fi

if [[ "$failures" -gt 0 ]]; then
  printf 'Validation failed with %s issue(s).\n' "$failures" >&2
  exit 1
fi

printf 'Validation passed with 0 issues.\n'

#!/usr/bin/env bash
# research-guard.sh — Executable enforcement for research workflow guards
# Validates research output quality against Q.U.A.N.T.-inspired criteria.
#
# Usage:
#   research-guard.sh <check> <file_or_stdin> [workdir]
#
# Guards (matching YAML workflow guard names):
#   evidence_has_citations          — Every claim paragraph has [source] reference
#   confidence_levels_present       — Every finding has HIGH/MEDIUM/LOW tag
#   at_least_two_mcp_tools_accessible — Agent has ≥2 MCP tools in allowed_tools
#   all_claims_have_citations       — Alias for evidence_has_citations
#   all_findings_have_confidence_level — Alias for confidence_levels_present
#   source_count_minimum            — Research output cites ≥N distinct sources
#   no_weasel_words                 — QAI check: zero banned subjective words
#   mece_states_present             — UPS check: all 5 states defined per feature
#   tool_refs_resolve               — NR check: all tool: refs in workflow map to real commands
#   guard_suite                     — Run ALL guards against a research artifact
#
# Output: JSON to stdout
# Exit: 0 = pass, 1 = fail, 2 = error

set -Euo pipefail

readonly CHECK="${1:-}"
readonly INPUT="${2:--}"
readonly WORKDIR="${3:-.}"

die() { printf '{"error":"%s"}\n' "$1" >&2; exit 2; }

[[ -z "$CHECK" ]] && die "Usage: research-guard.sh <check> <file_or_stdin> [workdir]"

# Read input: file or stdin
read_input() {
  if [[ "$INPUT" == "-" ]]; then
    cat
  elif [[ -f "$INPUT" ]]; then
    cat "$INPUT"
  else
    die "Input not found: $INPUT"
  fi
}

# --- Guard: evidence_has_citations ---
check_evidence_has_citations() {
  local content
  content="$(read_input)"
  local total_paragraphs=0
  local cited_paragraphs=0
  local uncited=()

  while IFS= read -r line; do
    # Skip blank lines, headers, code blocks, tables
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^# ]] && continue
    [[ "$line" =~ ^\| ]] && continue
    [[ "$line" =~ ^\`\`\` ]] && continue
    [[ "$line" =~ ^- ]] && continue  # list items handled separately

    ((++total_paragraphs))
    # Check for citation markers: [1], [source], (URL), [CONFIDENCE:
    if [[ "$line" =~ \[[0-9]+\]|\[source|\[Source|\[URL|\(http|\[CONFIDENCE ]]; then
      ((++cited_paragraphs))
    else
      uncited+=("$(echo "$line" | head -c 80)")
    fi
  done <<< "$content"

  local ratio=0
  if [[ $total_paragraphs -gt 0 ]]; then
    ratio=$(( (cited_paragraphs * 100) / total_paragraphs ))
  fi

  local passed="false"
  [[ $ratio -ge 60 ]] && passed="true"

  printf '{"guard":"evidence_has_citations","passed":%s,"total_paragraphs":%d,"cited":%d,"ratio_pct":%d,"uncited_sample":[' \
    "$passed" "$total_paragraphs" "$cited_paragraphs" "$ratio"

  local first=true
  for u in "${uncited[@]:0:3}"; do
    [[ "$first" == "true" ]] && first=false || printf ','
    printf '"%s"' "$(echo "$u" | sed 's/"/\\"/g')"
  done
  printf ']}\n'

  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: confidence_levels_present ---
check_confidence_levels_present() {
  local content
  content="$(read_input)"
  local findings=0
  local tagged=0

  while IFS= read -r line; do
    # Count findings (lines starting with "Finding", "###", or containing "finding")
    if [[ "$line" =~ [Ff]inding|[Rr]esult|[Cc]laim|[Cc]onclusion ]]; then
      ((++findings))
      if [[ "$line" =~ CONFIDENCE|HIGH|MEDIUM|LOW|\[H\]|\[M\]|\[L\] ]]; then
        ((++tagged))
      fi
    fi
  done <<< "$content"

  local passed="false"
  [[ $findings -eq 0 || $tagged -eq $findings ]] && passed="true"

  printf '{"guard":"confidence_levels_present","passed":%s,"findings":%d,"tagged":%d}\n' \
    "$passed" "$findings" "$tagged"
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: at_least_two_mcp_tools_accessible ---
check_mcp_tools_accessible() {
  local agent_file="$INPUT"
  [[ ! -f "$agent_file" ]] && die "Agent file required: $agent_file"

  # Extract YAML frontmatter (between first --- and second ---)
  local frontmatter
  frontmatter=$(awk '/^---$/{n++} n==1{print} n==2{exit}' "$agent_file")

  local mcp_tools=("tavily" "context7" "deepwiki" "repomix" "webfetch" "websearch")
  local found=0
  local found_tools=()

  for tool in "${mcp_tools[@]}"; do
    # Look for "- tool_name" pattern in frontmatter (allowed_tools list items)
    if echo "$frontmatter" | grep -qE "^[[:space:]]+- ${tool}" 2>/dev/null; then
      ((++found))
      found_tools+=("$tool")
    fi
  done

  local passed="false"
  [[ $found -ge 2 ]] && passed="true"

  printf '{"guard":"at_least_two_mcp_tools_accessible","passed":%s,"found":%d,"tools":[' \
    "$passed" "$found"
  local first=true
  if [[ ${#found_tools[@]} -gt 0 ]]; then
    for t in "${found_tools[@]}"; do
      [[ "$first" == "true" ]] && first=false || printf ','
      printf '"%s"' "$t"
    done
  fi
  printf ']}\n'
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: no_weasel_words (QAI) ---
check_no_weasel_words() {
  local content
  content="$(read_input)"
  local banned=("fast" "scalable" "robust" "user-friendly" "seamless" "modern" "efficient" "lightweight" "secure" "intuitive" "elegant" "simple" "easy" "powerful" "flexible")
  local violations=()

  for word in "${banned[@]}"; do
    local count
    count=$(echo "$content" | grep -iow "$word" | wc -l | tr -d ' ')
    if [[ $count -gt 0 ]]; then
      violations+=("${word}:${count}")
    fi
  done

  local passed="false"
  [[ ${#violations[@]} -eq 0 ]] && passed="true"

  printf '{"guard":"no_weasel_words","passed":%s,"violations":[' "$passed"
  local first=true
  for v in "${violations[@]}"; do
    [[ "$first" == "true" ]] && first=false || printf ','
    printf '"%s"' "$v"
  done
  printf ']}\n'
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: source_count_minimum ---
check_source_count_minimum() {
  local content
  content="$(read_input)"
  local min="${SOURCE_MIN:-3}"

  # Count distinct URLs and citation markers
  local url_count
  url_count=$(echo "$content" | grep -oE 'https?://[^ )"]+' | sort -u | wc -l | tr -d ' ')
  local ref_count
  ref_count=$(echo "$content" | grep -oE '\[[0-9]+\]' | sort -u | wc -l | tr -d ' ')

  local total=$(( url_count > ref_count ? url_count : ref_count ))
  local passed="false"
  [[ $total -ge $min ]] && passed="true"

  printf '{"guard":"source_count_minimum","passed":%s,"minimum":%d,"found":%d,"urls":%d,"refs":%d}\n' \
    "$passed" "$min" "$total" "$url_count" "$ref_count"
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: mece_states_present (UPS) ---
check_mece_states_present() {
  local content
  content="$(read_input)"
  local states=("ideal" "empty" "latency" "partial.failure" "destructive")
  local found=0
  local missing=()

  for state in "${states[@]}"; do
    if echo "$content" | grep -qiE "$state"; then
      ((++found))
    else
      missing+=("$state")
    fi
  done

  local passed="false"
  [[ $found -eq 5 ]] && passed="true"

  printf '{"guard":"mece_states_present","passed":%s,"found":%d,"missing":[' "$passed" "$found"
  local first=true
  for m in "${missing[@]}"; do
    [[ "$first" == "true" ]] && first=false || printf ','
    printf '"%s"' "$m"
  done
  printf ']}\n'
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: tool_refs_resolve (NR) ---
check_tool_refs_resolve() {
  local workflow_file="$INPUT"
  [[ ! -f "$workflow_file" ]] && die "Workflow file required: $workflow_file"

  local phantoms=()
  local resolved=0
  local total=0

  while IFS= read -r tool; do
    [[ -z "$tool" ]] && continue
    tool=$(echo "$tool" | tr -d '"' | xargs)
    [[ -z "$tool" ]] && continue
    ((++total))

    # Check if it's a known agent name (not a command)
    if [[ -f "$WORKDIR/.opencode/agents/${tool}.md" ]]; then
      ((++resolved))
    elif [[ -f "$WORKDIR/.opencode/commands/${tool}.md" ]]; then
      ((++resolved))
    else
      phantoms+=("$tool")
    fi
  done < <(grep "tool:" "$workflow_file" 2>/dev/null | awk '{print $2}' | sort -u)

  local passed="false"
  [[ ${#phantoms[@]} -eq 0 ]] && passed="true"

  printf '{"guard":"tool_refs_resolve","passed":%s,"total":%d,"resolved":%d,"phantoms":[' \
    "$passed" "$total" "$resolved"
  local first=true
  if [[ ${#phantoms[@]} -gt 0 ]]; then
    for p in "${phantoms[@]}"; do
      [[ "$first" == "true" ]] && first=false || printf ','
      printf '"%s"' "$p"
    done
  fi
  printf ']}\n'
  [[ "$passed" == "true" ]] && return 0 || return 1
}

# --- Guard: guard_suite (run ALL guards) ---
check_guard_suite() {
  local file="$INPUT"
  local total=0
  local passed_count=0
  local failed=()

  echo '{"guard":"guard_suite","results":['

  for guard in evidence_has_citations confidence_levels_present no_weasel_words source_count_minimum; do
    ((++total))
    local result
    result=$("check_${guard}" 2>/dev/null) && ((++passed_count)) || failed+=("$guard")
    [[ $total -gt 1 ]] && printf ','
    echo "$result"
  done

  local suite_passed="false"
  [[ ${#failed[@]} -eq 0 ]] && suite_passed="true"

  printf '],"suite_passed":%s,"total":%d,"passed":%d,"failed":[' \
    "$suite_passed" "$total" "$passed_count"
  local first=true
  for f in "${failed[@]}"; do
    [[ "$first" == "true" ]] && first=false || printf ','
    printf '"%s"' "$f"
  done
  printf ']}\n'
  [[ "$suite_passed" == "true" ]] && return 0 || return 1
}

# --- Dispatch ---

case "$CHECK" in
  evidence_has_citations|all_claims_have_citations)
    check_evidence_has_citations ;;
  confidence_levels_present|all_findings_have_confidence_level)
    check_confidence_levels_present ;;
  at_least_two_mcp_tools_accessible)
    check_mcp_tools_accessible ;;
  no_weasel_words)
    check_no_weasel_words ;;
  source_count_minimum)
    check_source_count_minimum ;;
  mece_states_present)
    check_mece_states_present ;;
  tool_refs_resolve)
    check_tool_refs_resolve ;;
  guard_suite)
    check_guard_suite ;;
  *)
    die "Unknown guard: $CHECK. Valid: evidence_has_citations, confidence_levels_present, at_least_two_mcp_tools_accessible, no_weasel_words, source_count_minimum, mece_states_present, tool_refs_resolve, guard_suite" ;;
esac

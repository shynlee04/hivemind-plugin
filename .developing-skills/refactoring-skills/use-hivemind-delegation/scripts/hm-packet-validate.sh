#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_NAME="$(basename "$0")"
readonly AGENT_PATTERN='^(architect|code-skeptic|handoff|hitea|hivehealer|hivemaker|hiveminder|hiveplanner|hiveq|hiverd|hivexplorer)$'

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

validate_packet() {
  local file="$1"
  jq -e '.target_agent and .scope and .expected_return and .output_path' "$file" >/dev/null || \
    die "Packet missing required fields: target_agent, scope, expected_return, output_path"
  local agent
  agent="$(jq -r '.target_agent' "$file")"
  [[ "$agent" =~ $AGENT_PATTERN ]] || die "Unknown target_agent: $agent"
  jq -e '(.scope | type == "string" and length > 0) or (.scope.question and (.scope.question | length > 0))' "$file" >/dev/null || \
    die "Packet scope must be bounded and non-empty"
  jq -e '(.scope | tostring | test("everything|entire repo|whole repo|all files"; "i") | not)' "$file" >/dev/null || \
    die "Packet scope is too broad"
  jq -e '.expected_return.required_fields and .expected_return.evidence_schema' "$file" >/dev/null || \
    die "Packet expected_return must define required_fields and evidence_schema"
}

validate_return() {
  local file="$1"
  jq -e '.status and .evidence and .blocked_routes and .recommended_next and ._meta.producer' "$file" >/dev/null || \
    die "Return missing required fields"
  jq -e '.status | test("^(complete|partial|blocked)$")' "$file" >/dev/null || \
    die "Return status must be complete, partial, or blocked"
  jq -e 'all(.evidence[]?; .claim and (.evidence_quote // .quote) and (.source_url // .source) and .source_title and (.confidence != null))' "$file" >/dev/null || \
    die "Each evidence item must include claim, quote/evidence_quote, source/source_url, source_title, and confidence"
  jq -e 'all(.evidence[]?; (.confidence | type) == "number" and .confidence >= 0 and .confidence <= 1)' "$file" >/dev/null || \
    die "Each evidence confidence must be a number between 0 and 1"
}

validate_multi_domain() {
  local file="$1"
  local agent_pattern="$AGENT_PATTERN"
  jq -e '.investigation_id and .domains and .cross_domain_claims and .synthesis_queue and ._meta.producer' "$file" >/dev/null || \
    die "Multi-domain investigation missing required fields"
  jq -e 'all(.domains[]?; .name and .slices and (.status | test("^(pending|complete|partial|blocked)$")))' "$file" >/dev/null || \
    die "Each domain must include name, status, and slices"
  jq -e 'all(.domains[]?.slices[]?; .id and .agent and .status and .findings and .evidence_refs)' "$file" >/dev/null || \
    die "Each slice must include id, agent, status, findings, and evidence_refs"
  jq -e --arg pattern "$agent_pattern" 'all(.domains[]?.slices[]?; (.agent | test($pattern)))' "$file" >/dev/null || \
    die "Each slice agent must be a known HiveMind agent"
}

main() {
  [[ $# -eq 1 ]] || die "Usage: $SCRIPT_NAME <packet-or-return.json>"
  local file="$1"
  [[ -f "$file" ]] || die "File not found: $file"

  require_cmd jq

  jq -e 'type == "object"' "$file" >/dev/null || die "Input must be a JSON object"

  if jq -e 'has("target_agent")' "$file" >/dev/null; then
    validate_packet "$file"
    printf 'VALID: delegation packet\n'
    exit 0
  fi

  if jq -e 'has("evidence") and has("status")' "$file" >/dev/null; then
    validate_return "$file"
    printf 'VALID: evidence return\n'
    exit 0
  fi

  if jq -e 'has("domains") and has("synthesis_queue") and has("investigation_id")' "$file" >/dev/null; then
    validate_multi_domain "$file"
    printf 'VALID: multi-domain investigation\n'
    exit 0
  fi

  die "Input is neither a delegation packet nor an evidence return"
}

main "$@"

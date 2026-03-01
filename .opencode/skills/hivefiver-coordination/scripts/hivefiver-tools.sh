#!/usr/bin/env bash
# hivefiver-tools.sh — CLI tooling for HiveFiver V2 framework operations
# Provides subcommands for state management, asset validation, inventory, and parity checking.
#
# Usage: hivefiver-tools.sh <subcommand> [args...]
#
# Subcommands:
#   state load                    — Parse Pipeline State from STATE.md into JSON
#   state set <field> <value>     — Update a Pipeline State field
#   verify asset-contracts        — Validate all assets against contract schemas
#   inventory scan                — Count and health-check all framework assets
#   parity check                  — Compare .opencode/ with root mirrors
#   guard snapshot <file>         — Schema-guard: pre-edit snapshot
#   guard verify <file>           — Schema-guard: post-edit verification
#   guard commit <file>           — Schema-guard: atomic git commit

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SUBCOMMAND="${1:-}"
readonly SUBACTION="${2:-}"
readonly ARG3="${3:-}"
readonly ARG4="${4:-}"

# Resolve working directory (default: project root)
find_project_root() {
  local dir="$SCRIPT_DIR"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/opencode.json" ]] || [[ -d "$dir/.opencode" ]]; then
      printf '%s' "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  printf '%s' "$(pwd)"
}

readonly WORKDIR="$(find_project_root)"

# Script paths (co-located in hivefiver-coordination/scripts/)
readonly COORDINATION_SCRIPTS="$WORKDIR/.opencode/skills/hivefiver-coordination/scripts"
readonly MODE_SCRIPTS="$WORKDIR/.opencode/skills/hivefiver-mode/scripts"

die() { printf '{"error": "%s"}\n' "$1" >&2; exit 1; }

# --- State subcommand ---
do_state() {
  case "$SUBACTION" in
    load|read)
      bash "$COORDINATION_SCRIPTS/state-update.sh" read "$WORKDIR"
      ;;
    set)
      local field="${ARG3:-}"
      local value="${ARG4:-}"
      if [[ -z "$field" || -z "$value" ]]; then
        die "Usage: hivefiver-tools.sh state set <field> <value>"
      fi
      case "$field" in
        active)    bash "$COORDINATION_SCRIPTS/state-update.sh" set-active "$value" "$WORKDIR" ;;
        stage)     bash "$COORDINATION_SCRIPTS/state-update.sh" set-stage "$value" "$WORKDIR" ;;
        completed) bash "$COORDINATION_SCRIPTS/state-update.sh" add-completed "$value" "$WORKDIR" ;;
        target)    bash "$COORDINATION_SCRIPTS/state-update.sh" set-target "$value" "$WORKDIR" ;;
        gate)      bash "$COORDINATION_SCRIPTS/state-update.sh" set-gate "$value" "$WORKDIR" ;;
        *)         die "Unknown state field: $field. Valid: active, stage, completed, target, gate" ;;
      esac
      ;;
    *)
      die "Usage: hivefiver-tools.sh state <load|set> [args...]"
      ;;
  esac
}

# --- Verify subcommand ---
do_verify() {
  case "$SUBACTION" in
    asset-contracts|contracts)
      bash "$COORDINATION_SCRIPTS/quality-check.sh" build "$WORKDIR"
      ;;
    gate)
      local stage="${ARG3:-build}"
      bash "$COORDINATION_SCRIPTS/gate-check.sh" "$stage" "$WORKDIR"
      ;;
    *)
      die "Usage: hivefiver-tools.sh verify <asset-contracts|gate> [stage]"
      ;;
  esac
}

# --- Inventory subcommand ---
do_inventory() {
  local agents=0 commands=0 skills=0 workflows=0 scripts_count=0 references=0

  # Count assets
  agents="$(find "$WORKDIR/.opencode/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  commands="$(find "$WORKDIR/.opencode/commands" -name "hivefiver*.md" 2>/dev/null | wc -l | tr -d ' ')"
  skills="$(find "$WORKDIR/.opencode/skills" -maxdepth 2 -name "SKILL.md" -path "*/hivefiver*/*" 2>/dev/null | wc -l | tr -d ' ')"
  workflows="$(find "$WORKDIR/.opencode/workflows/hivefiver" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  scripts_count="$(find "$WORKDIR/.opencode/skills/hivefiver-coordination/scripts" "$WORKDIR/.opencode/skills/hivefiver-mode/scripts" -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')"
  references="$(find "$WORKDIR/.opencode/skills/hivefiver-mode/references" "$WORKDIR/.opencode/skills/hivefiver-coordination/references" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"

  # Health assessment
  local health="healthy"
  local issues=0

  # Check for critical issues
  if (( agents == 0 )); then health="critical"; (( issues++ )); fi
  if (( commands == 0 )); then health="critical"; (( issues++ )); fi
  if (( skills == 0 )); then health="critical"; (( issues++ )); fi
  if (( workflows == 0 )); then health="degraded"; (( issues++ )); fi

  # Run quality check for detailed findings
  local quality_result
  quality_result="$(bash "$COORDINATION_SCRIPTS/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{"passed":false}')"
  local quality_passed
  quality_passed="$(printf '%s' "$quality_result" | grep -o '"passed": *[a-z]*' | sed 's/"passed": *//' || echo "unknown")"

  printf '{\n'
  printf '  "inventory": {\n'
  printf '    "agents": %d,\n' "$agents"
  printf '    "commands": %d,\n' "$commands"
  printf '    "skills": %d,\n' "$skills"
  printf '    "workflows": %d,\n' "$workflows"
  printf '    "scripts": %d,\n' "$scripts_count"
  printf '    "references": %d\n' "$references"
  printf '  },\n'
  printf '  "health": "%s",\n' "$health"
  printf '  "issues": %d,\n' "$issues"
  printf '  "quality_check_passed": %s\n' "$quality_passed"
  printf '}\n'
}

# --- Parity subcommand ---
do_parity() {
  printf '{\n'
  printf '  "parity_checks": [\n'

  local first=true
  local drifts=0

  # Check agents
  for oc_file in "$WORKDIR"/.opencode/agents/*.md; do
    [[ -f "$oc_file" ]] || continue
    local basename
    basename="$(basename "$oc_file")"
    local root_file="$WORKDIR/agents/$basename"

    if [[ -f "$root_file" ]]; then
      if ! diff -q "$oc_file" "$root_file" &>/dev/null; then
        if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
        printf '    {"file": "%s", "status": "drift", "location": "agents/"}' "$basename"
        (( drifts++ ))
      fi
    else
      if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
      printf '    {"file": "%s", "status": "missing_root_mirror", "location": "agents/"}' "$basename"
    fi
  done

  # Check commands
  for oc_file in "$WORKDIR"/.opencode/commands/hivefiver*.md; do
    [[ -f "$oc_file" ]] || continue
    local basename
    basename="$(basename "$oc_file")"
    local root_file="$WORKDIR/commands/$basename"

    if [[ -f "$root_file" ]]; then
      if ! diff -q "$oc_file" "$root_file" &>/dev/null; then
        if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
        printf '    {"file": "%s", "status": "drift", "location": "commands/"}' "$basename"
        (( drifts++ ))
      fi
    fi
  done

  printf '\n  ],\n'
  printf '  "total_drifts": %d\n' "$drifts"
  printf '}\n'
}

# --- Guard subcommand (delegates to schema-guard.sh) ---
do_guard() {
  local action="$SUBACTION"
  local filepath="$ARG3"

  if [[ -z "$action" || -z "$filepath" ]]; then
    die "Usage: hivefiver-tools.sh guard <snapshot|verify|commit> <filepath>"
  fi

  bash "$COORDINATION_SCRIPTS/schema-guard.sh" "$action" "$filepath" "$WORKDIR"
}

# --- Route subcommand (delegates to route-stage.sh) ---
do_route() {
  bash "$MODE_SCRIPTS/route-stage.sh" "$WORKDIR"
}

# --- Help ---
do_help() {
  cat <<'HELP'
HiveFiver Tools — CLI for framework operations

Usage: hivefiver-tools.sh <subcommand> [args...]

Subcommands:
  state load                    Parse Pipeline State from STATE.md into JSON
  state set <field> <value>     Update a Pipeline State field
                                Fields: active, stage, completed, target, gate
  verify asset-contracts        Validate all assets against contract schemas
  verify gate [stage]           Run gate-check for a stage
  inventory scan                Count and health-check all framework assets
  parity check                  Compare .opencode/ with root mirrors for drift
  guard snapshot <file>         Pre-edit frontmatter snapshot (schema protection)
  guard verify <file>           Post-edit frontmatter verification
  guard commit <file>           Atomic git commit of single file
  route                         Detect current pipeline stage
  help                          Show this help

Examples:
  hivefiver-tools.sh state load
  hivefiver-tools.sh state set stage build
  hivefiver-tools.sh verify asset-contracts
  hivefiver-tools.sh inventory scan
  hivefiver-tools.sh guard snapshot .opencode/agents/hivefiver.md
HELP
}

# --- Dispatch ---
case "$SUBCOMMAND" in
  state)      do_state ;;
  verify)     do_verify ;;
  inventory)  do_inventory ;;
  parity)     do_parity ;;
  guard)      do_guard ;;
  route)      do_route ;;
  help|--help|-h) do_help ;;
  "")         do_help ;;
  *)          die "Unknown subcommand: $SUBCOMMAND. Run 'hivefiver-tools.sh help' for usage." ;;
esac

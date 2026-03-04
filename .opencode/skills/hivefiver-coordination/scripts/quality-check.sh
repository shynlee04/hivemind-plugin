#!/usr/bin/env bash
# quality-check.sh — Comprehensive validation for HiveFiver V2 framework assets
# Validates frontmatter schemas, permissions, cross-references, anti-patterns, and parity.
#
# Usage: quality-check.sh <stage> [working-directory]
# Output: JSON with passed/failures/warnings
# Exit: 0 always (failures are in JSON, not exit code)

set -Eeuo pipefail

readonly STAGE="${1:-build}"
readonly WORKDIR="${2:-.}"

# --- Accumulators ---
FAILURES=()
WARNINGS=()
CHECKS_RUN=0

fail() { FAILURES+=("$1"); }
warn() { WARNINGS+=("$1"); }
check() { (( ++CHECKS_RUN )); }

# === CHECK 1: Command frontmatter validation ===
check_command_frontmatter() {
  check
  local cmd_files
  cmd_files="$(find "$WORKDIR/.opencode/commands" -name "hivefiver*.md" 2>/dev/null || true)"

  for file in $cmd_files; do
    local bname
    bname="$(basename "$file")"

    # Must have frontmatter delimiters
    if ! head -1 "$file" | grep -q '^---$'; then
      fail "C-FM-01: Missing frontmatter in command: $bname"
      continue
    fi

    local fm
    fm="$(sed -n '2,/^---$/p' "$file" | grep -v '^---$')"

    # Required fields: name, description, agent
    if ! printf '%s' "$fm" | grep -q '^name:'; then
      fail "C-FM-02: Missing 'name' field in: $bname"
    fi
    if ! printf '%s' "$fm" | grep -q '^description:'; then
      fail "C-FM-03: Missing 'description' field in: $bname"
    fi
    if ! printf '%s' "$fm" | grep -q '^agent:'; then
      fail "C-FM-04: Missing 'agent' field in: $bname"
    fi

    # Agent must reference existing agent
    local agent_name
    agent_name="$(printf '%s' "$fm" | grep '^agent:' | sed 's/^agent: *//' | tr -d '"' | tr -d "'")"
    if [[ -n "$agent_name" && ! -f "$WORKDIR/.opencode/agents/$agent_name.md" ]]; then
      fail "C-FM-05: Command $bname references non-existent agent: $agent_name"
    fi
  done
}

# === CHECK 2: Agent frontmatter validation ===
check_agent_frontmatter() {
  check
  local agent_files
  agent_files="$(find "$WORKDIR/.opencode/agents" -name "*.md" 2>/dev/null || true)"

  for file in $agent_files; do
    local bname
    bname="$(basename "$file")"

    if ! head -1 "$file" | grep -q '^---$'; then
      fail "A-FM-01: Missing frontmatter in agent: $bname"
      continue
    fi

    local fm
    fm="$(sed -n '2,/^---$/p' "$file" | grep -v '^---$')"

    # Required: name, description
    if ! printf '%s' "$fm" | grep -q '^name:'; then
      fail "A-FM-02: Missing 'name' field in: $bname"
    fi
    if ! printf '%s' "$fm" | grep -q '^description:'; then
      fail "A-FM-03: Missing 'description' field in: $bname"
    fi

    # Description quality: should contain triggering language
    # Handle multi-line YAML descriptions (continuation lines start with spaces)
    local desc
    desc="$(printf '%s\n' "$fm" | awk '
      /^description:/ { sub(/^description: */, ""); val=$0; next }
      val && /^  / { sub(/^  */, ""); val = val " " $0; next }
      val { exit }
      END { print val }
    ')"
    if [[ -n "$desc" ]] && ! printf '%s' "$desc" | grep -qi "use when\|triggers on\|when.*building\|when.*auditing\|when.*fixing\|when.*planning\|when.*research\|when.*investigat"; then
      warn "A-FM-04: Agent $bname description lacks triggering language (e.g., 'Use when...')"
    fi
  done
}

# === CHECK 3: Skill frontmatter validation ===
check_skill_frontmatter() {
  check
  local skill_files
  skill_files="$(find "$WORKDIR/.opencode/skills" -name "SKILL.md" 2>/dev/null || true)"

  for file in $skill_files; do
    local skill_dir
    skill_dir="$(basename "$(dirname "$file")")"

    if ! head -1 "$file" | grep -q '^---$'; then
      warn "S-FM-01: Skill $skill_dir SKILL.md missing frontmatter delimiters"
      continue
    fi

    local fm
    fm="$(sed -n '2,/^---$/p' "$file" | grep -v '^---$')"

    if ! printf '%s' "$fm" | grep -q '^name:'; then
      warn "S-FM-02: Missing 'name' field in skill: $skill_dir"
    fi
    if ! printf '%s' "$fm" | grep -q '^description:'; then
      fail "S-FM-03: Missing 'description' field in skill: $skill_dir"
    fi
  done
}

# === CHECK 4: Cross-reference integrity ===
check_cross_references() {
  check
  local cmd_files
  cmd_files="$(find "$WORKDIR/.opencode/commands" -name "hivefiver*.md" 2>/dev/null || true)"

  for file in $cmd_files; do
    local bname
    bname="$(basename "$file")"

    # Check @filepath references
    local refs
    refs="$(grep -oE '@[a-zA-Z0-9_./-]+' "$file" 2>/dev/null | sed 's/^@//' || true)"
    for ref in $refs; do
      if [[ -n "$ref" && ! -f "$WORKDIR/$ref" ]]; then
        fail "XREF-01: Dead @reference in $bname: $ref"
      fi
    done

    # Check !`bash ...` script references
    local scripts
    scripts="$(grep -oE 'bash [.a-zA-Z0-9_/-]+\.sh' "$file" 2>/dev/null | sed 's/^bash //' || true)"
    for script in $scripts; do
      if [[ -n "$script" && ! -f "$WORKDIR/$script" ]]; then
        fail "XREF-02: Dead script reference in $bname: $script"
      fi
    done

    # Check /hivefiver-* command references (only standalone refs, not path segments)
    # Valid command refs appear as: `/hivefiver-start`, `/hivefiver-intake`, etc.
    # NOT path segments like `.opencode/skills/hivefiver-coordination/scripts/`
    local cmdrefs
    cmdrefs="$(grep -oE '(^|[^/a-z])/hivefiver-[a-z]+' "$file" 2>/dev/null | \
      grep -oE '/hivefiver-[a-z]+' | \
      grep -v '/hivefiver-mode' | \
      grep -v '/hivefiver-coordination' | \
      grep -v '/hivefiver-orchestrator' | \
      grep -v '/hivefiver-v' | \
      sort -u || true)"
    for cmdref in $cmdrefs; do
      local cmdfile="$WORKDIR/.opencode/commands/${cmdref#/}.md"
      if [[ ! -f "$cmdfile" ]]; then
        fail "XREF-03: Dead command reference in $bname: $cmdref"
      fi
    done
  done
}

# === CHECK 5: Anti-pattern detection (G-01 through G-10) ===
check_anti_patterns() {
  check

  # G-01: Wildcard task delegation (allow-all, not deny-first)
  for agent in "$WORKDIR"/.opencode/agents/*.md; do
    [[ -f "$agent" ]] || continue
    local bname
    bname="$(basename "$agent")"
    # Look for task: section with "*": allow WITHOUT a preceding "*": deny
    if grep -q '"[*]":.*allow' "$agent" 2>/dev/null; then
      local task_section
      task_section="$(sed -n '/task:/,/^  [a-z]/p' "$agent" 2>/dev/null || true)"
      if printf '%s' "$task_section" | grep -q '"[*]":.*allow' && ! printf '%s' "$task_section" | grep -q '"[*]":.*deny'; then
        fail "G-01: Wildcard task allow without deny-first in: $bname"
      fi
    fi
  done

  # G-02: Unrestricted bash
  for agent in "$WORKDIR"/.opencode/agents/*.md; do
    [[ -f "$agent" ]] || continue
    local bname
    bname="$(basename "$agent")"
    local bash_section
    bash_section="$(sed -n '/bash:/,/^  [a-z]/p' "$agent" 2>/dev/null || true)"
    if printf '%s' "$bash_section" | grep -q '"[*]":.*allow'; then
      fail "G-02: Unrestricted bash permission in: $bname"
    fi
  done

  # G-03: Orphan alias (command with no deterministic behavior section)
  for file in "$WORKDIR"/.opencode/commands/hivefiver*.md; do
    [[ -f "$file" ]] || continue
    local bname
    bname="$(basename "$file")"
    if ! grep -qiE '<process>|<routing>|<objective>|Step [0-9]' "$file" 2>/dev/null; then
      warn "G-03: Command $bname has no deterministic behavior section"
    fi
  done

  # G-06: Missing exit criteria in workflows
  for wf in "$WORKDIR"/.opencode/workflows/hivefiver/*.md; do
    [[ -f "$wf" ]] || continue
    if ! grep -qi "exit criteria\|exit_criteria" "$wf" 2>/dev/null; then
      warn "G-06: Missing exit criteria in workflow: $(basename "$wf")"
    fi
  done

  # G-07: Skill avalanche warning
  local skill_count
  skill_count="$(find "$WORKDIR/.opencode/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')"
  if (( skill_count > 10 )); then
    warn "G-07: High skill count ($skill_count). Risk of context budget overrun"
  fi

  # G-08: Contract-free command
  for file in "$WORKDIR"/.opencode/commands/hivefiver*.md; do
    [[ -f "$file" ]] || continue
    local bname
    bname="$(basename "$file")"
    if ! grep -q '<output_contract>' "$file" 2>/dev/null; then
      warn "G-08: No <output_contract> in command: $bname"
    fi
  done

  # G-09: Parity drift
  if [[ -d "$WORKDIR/agents" && -d "$WORKDIR/.opencode/agents" ]]; then
    for agent in "$WORKDIR"/.opencode/agents/*.md; do
      [[ -f "$agent" ]] || continue
      local bname root_agent
      bname="$(basename "$agent")"
      root_agent="$WORKDIR/agents/$bname"
      if [[ -f "$root_agent" ]]; then
        if ! diff -q "$agent" "$root_agent" &>/dev/null; then
          warn "G-09: Parity drift: .opencode/agents/$bname differs from agents/$bname"
        fi
      fi
    done
  fi

  # G-10: Silent unknown action
  local router="$WORKDIR/.opencode/commands/hivefiver.md"
  if [[ -f "$router" ]]; then
    if ! grep -qi "unknown\|unrecognized\|fallback\|NEVER silently" "$router" 2>/dev/null; then
      fail "G-10: Router command lacks unknown action handling"
    fi
  fi
}

# === CHECK 6: Dead reference scan ===
check_dead_references() {
  check
  local dead_patterns="hivefiver-specforge\|hivefiver-skillforge\|hivefiver-gsd-bridge\|hivefiver-ralph-bridge"

  local hits
  hits="$(grep -rl "$dead_patterns" "$WORKDIR/.opencode/" 2>/dev/null || true)"

  for hit in $hits; do
    local bname
    bname="$(basename "$hit")"
    # Skip scripts that search FOR dead refs (they contain the pattern as a search string)
    if [[ "$bname" == "gate-check.sh" || "$bname" == "hivefiver-doctor.md" || "$bname" == "quality-check.sh" ]]; then
      continue
    fi

    # Workflow blueprints may intentionally reference planned commands/skills.
    # Treat these as warnings until implementation lands.
    if [[ "$hit" == *"/workflows/"* ]]; then
      warn "DEAD-WF-01: Planned reference found in workflow blueprint: $bname"
    else
      fail "DEAD-01: Dead reference found in: $bname"
    fi
  done
}

# === CHECK 7: Workflow existence ===
check_workflows() {
  check
  local workflow_dir="$WORKDIR/.opencode/workflows/hivefiver"
  if [[ ! -d "$workflow_dir" ]]; then
    warn "WF-01: Workflow directory missing: .opencode/workflows/hivefiver/"
    return 0
  fi

  local count
  count="$(find "$workflow_dir" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if (( count == 0 )); then
    warn "WF-02: No workflow files in .opencode/workflows/hivefiver/"
  elif (( count < 7 )); then
    warn "WF-03: Only $count/7 stage workflows exist"
  fi
}

# === CHECK 8: Enforcement block validation ===
check_enforcement_blocks() {
  check
  for file in "$WORKDIR"/.opencode/commands/hivefiver-*.md; do
    [[ -f "$file" ]] || continue
    local bname
    bname="$(basename "$file")"
    if ! grep -q '<enforcement>' "$file" 2>/dev/null; then
      fail "ENF-01: No <enforcement> block in: $bname"
    fi
    if ! grep -q 'bash.*\.sh' "$file" 2>/dev/null; then
      warn "ENF-02: No bash script injection in: $bname"
    fi
  done
}

# === CHECK 9: Schema guard stale artifacts ===
check_stale_guards() {
  check
  local guards
  guards="$(find "$WORKDIR/.opencode" -name "*.guard" 2>/dev/null || true)"
  for guard in $guards; do
    warn "GUARD-01: Stale .guard file: $(basename "$guard") — schema-guard verify was not completed"
  done
}

# === CHECK 10: Entry consistency + canonical plugin path ===
check_entry_consistency() {
  check

  # Rule A: No contradictory load-order phrasing in active skill docs
  local contradiction_hits
  contradiction_hits="$(
    grep -RIn "Load hivefiver-mode and hivefiver-coordination skills first" \
      "$WORKDIR/.opencode/skills" 2>/dev/null | grep -v "quality-check.sh" || true
  )"
  if [[ -n "$contradiction_hits" ]]; then
    fail "CONS-01: Contradictory load-order phrase found in skill docs"
  fi

  # Rule B: Canonical plugin path is .opencode/plugins/hiveops-governance/**
  # Fail on singular path usage in active governance assets.
  local singular_hits
  singular_hits="$(
    {
      grep -RIn "\.opencode/plugin/hiveops-governance" "$WORKDIR/.opencode/agents" 2>/dev/null || true
      grep -RIn "\.opencode/plugin/hiveops-governance" "$WORKDIR/agents" 2>/dev/null || true
      grep -RIn "\.opencode/plugin/hiveops-governance" "$WORKDIR/.opencode/skills" 2>/dev/null || true
      grep -RIn "\.opencode/plugin/hiveops-governance" "$WORKDIR/.hivemind/plans" 2>/dev/null || true
      grep -RIn "\.opencode/plugin/hiveops-governance" "$WORKDIR/opencode.json" 2>/dev/null || true
    } | sed '/session-ses_/d' | grep -v "quality-check.sh" || true
  )"
  if [[ -n "$singular_hits" ]]; then
    fail "CONS-02: Non-canonical singular plugin path found in active assets"
  fi

  # Rule C: Critical hivefiver skills should not keep unresolved TODO/FIXME markers
  local todo_hits
  todo_hits="$(
    {
      grep -nE "TODO|FIXME|TBD" "$WORKDIR/.opencode/skills/hivefiver-prime/SKILL.md" 2>/dev/null || true
      grep -nE "TODO|FIXME|TBD" "$WORKDIR/.opencode/skills/hivefiver-mode/SKILL.md" 2>/dev/null || true
      grep -nE "TODO|FIXME|TBD" "$WORKDIR/.opencode/skills/hivefiver-coordination/SKILL.md" 2>/dev/null || true
      grep -nE "TODO|FIXME|TBD" "$WORKDIR/.opencode/skills/hivefiver-context-enforcer/SKILL.md" 2>/dev/null || true
    } || true
  )"
  if [[ -n "$todo_hits" ]]; then
    warn "CONS-03: TODO/FIXME/TBD markers remain in critical hivefiver skills"
  fi
}

# === Main ===

main() {
  # Run checks based on stage
  case "$STAGE" in
    start|intake)
      check_agent_frontmatter
      check_dead_references
      check_stale_guards
      ;;
    spec)
      check_agent_frontmatter
      check_skill_frontmatter
      check_dead_references
      check_stale_guards
      ;;
    architect)
      check_agent_frontmatter
      check_skill_frontmatter
      check_cross_references
      check_dead_references
      check_stale_guards
      ;;
    build|audit|doctor|*)
      check_command_frontmatter
      check_agent_frontmatter
      check_skill_frontmatter
      check_cross_references
      check_anti_patterns
      check_dead_references
      check_workflows
      check_enforcement_blocks
      check_stale_guards
      check_entry_consistency
      ;;
  esac

  # Determine pass/fail
  local passed=true
  if (( ${#FAILURES[@]} > 0 )); then
    passed=false
  fi

  # Output JSON
  printf '{\n'
  printf '  "stage": "%s",\n' "$STAGE"
  printf '  "passed": %s,\n' "$passed"
  printf '  "checks_run": %d,\n' "$CHECKS_RUN"
  printf '  "failures": [\n'
  local first=true
  for f in ${FAILURES[@]+"${FAILURES[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$f"
  done
  printf '\n  ],\n'
  printf '  "warnings": [\n'
  first=true
  for w in ${WARNINGS[@]+"${WARNINGS[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$w"
  done
  printf '\n  ]\n'
  printf '}\n'
}

main

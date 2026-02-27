#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# HIVEMIND Structural Audit — S-01 through S-18
# Deterministic checks for Sector-2 framework asset integrity.
#
# Usage: bash scripts/structural-audit.sh [--json] [--verbose]
# Output: PASS/FAIL/WARN per criterion with details
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
# Walk up to find project root (contains package.json AND .opencode/ directory)
# This avoids false matches on .opencode/package.json
PROJECT_ROOT="$SKILL_DIR"
while [[ "$PROJECT_ROOT" != "/" ]]; do
  if [[ -f "$PROJECT_ROOT/package.json" && -d "$PROJECT_ROOT/.opencode" && "$PROJECT_ROOT" != *"/.opencode"* ]]; then
    break
  fi
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  echo "ERROR: Could not find project root (no package.json + .opencode/ found)"
  exit 1
fi

OPENCODE_DIR="$PROJECT_ROOT/.opencode"
AGENTS_DIR="$OPENCODE_DIR/agents"
SKILLS_DIR="$OPENCODE_DIR/skills"
COMMANDS_DIR="$OPENCODE_DIR/commands"
WORKFLOWS_DIR="$OPENCODE_DIR/workflows"
TEMPLATES_DIR="$OPENCODE_DIR/templates"
REFERENCES_DIR="$OPENCODE_DIR/references"
PROMPTS_DIR="$OPENCODE_DIR/prompts"
REGISTRY="$SKILLS_DIR/registry.yaml"
HIVEMIND_DIR="$PROJECT_ROOT/.hivemind"

# ── Output format ──────────────────────────────────────────────────
JSON_MODE=false
VERBOSE=false
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
RESULTS=()

report() {
  local id="$1" status="$2" message="$3"
  case "$status" in
    PASS) ((PASS_COUNT++)) ;;
    FAIL) ((FAIL_COUNT++)) ;;
    WARN) ((WARN_COUNT++)) ;;
  esac
  RESULTS+=("$id|$status|$message")
  if ! $JSON_MODE; then
    printf "  [%-4s] %-6s %s\n" "$id" "$status" "$message"
  fi
}

# ── S-01: Agent YAML Completeness ──────────────────────────────────
check_s01() {
  local required_fields=("mode" "tools" "tasks" "workflows" "prompts")
  local total=0 complete=0 missing_list=""

  if [[ ! -d "$AGENTS_DIR" ]]; then
    report "S-01" "FAIL" "Agents directory not found: $AGENTS_DIR"
    return
  fi

  for agent_file in "$AGENTS_DIR"/*.md; do
    [[ -f "$agent_file" ]] || continue
    ((total++))
    local agent_name
    agent_name="$(basename "$agent_file" .md)"
    local missing=""
    for field in "${required_fields[@]}"; do
      if ! grep -q "^${field}:" "$agent_file" 2>/dev/null; then
        missing="${missing}${field},"
      fi
    done
    if [[ -z "$missing" ]]; then
      ((complete++))
    else
      missing_list="${missing_list}${agent_name}(${missing%,}) "
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-01" "FAIL" "No agent files found in $AGENTS_DIR"
  elif [[ $complete -eq $total ]]; then
    report "S-01" "PASS" "$complete/$total agents have complete YAML frontmatter"
  else
    report "S-01" "FAIL" "$complete/$total complete. Missing: ${missing_list}"
  fi
}

# ── S-02: Command Wiring ──────────────────────────────────────────
check_s02() {
  local total=0 wired=0 unwired_list=""

  if [[ ! -d "$COMMANDS_DIR" ]]; then
    report "S-02" "WARN" "Commands directory not found: $COMMANDS_DIR"
    return
  fi

  for cmd_file in "$COMMANDS_DIR"/*.md; do
    [[ -f "$cmd_file" ]] || continue
    local kind
    kind="$(grep "^kind:" "$cmd_file" 2>/dev/null | head -1 | sed 's/kind: *//' | tr -d '"' | tr -d "'")"
    [[ "$kind" == "router" ]] || continue
    ((total++))
    local exec_ctx
    exec_ctx="$(grep "^execution_context:" "$cmd_file" 2>/dev/null | head -1 | sed 's/execution_context: *//' | tr -d '"' | tr -d "'")"
    if [[ -n "$exec_ctx" ]]; then
      # Check if referenced workflow exists
      local wf_path="$OPENCODE_DIR/$exec_ctx"
      if [[ -f "$wf_path" ]]; then
        ((wired++))
      else
        unwired_list="${unwired_list}$(basename "$cmd_file" .md)(missing:$exec_ctx) "
      fi
    else
      unwired_list="${unwired_list}$(basename "$cmd_file" .md)(no-exec-ctx) "
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-02" "WARN" "No router commands found"
  elif [[ $wired -eq $total ]]; then
    report "S-02" "PASS" "$wired/$total router commands have valid execution_context"
  else
    report "S-02" "FAIL" "$wired/$total wired. Unwired: ${unwired_list}"
  fi
}

# ── S-03: Workflow V2 Compliance ──────────────────────────────────
check_s03() {
  local total=0 v2=0 non_v2_list=""

  if [[ ! -d "$WORKFLOWS_DIR" ]]; then
    report "S-03" "WARN" "Workflows directory not found: $WORKFLOWS_DIR"
    return
  fi

  for wf_file in "$WORKFLOWS_DIR"/*.yaml "$WORKFLOWS_DIR"/*.yml; do
    [[ -f "$wf_file" ]] || continue
    ((total++))
    local has_v2=true
    grep -q "contract_version:" "$wf_file" 2>/dev/null || has_v2=false
    grep -q "target_agent:" "$wf_file" 2>/dev/null || has_v2=false
    grep -q "steps:" "$wf_file" 2>/dev/null || has_v2=false

    if $has_v2; then
      ((v2++))
    else
      non_v2_list="${non_v2_list}$(basename "$wf_file") "
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-03" "WARN" "No workflow files found"
  elif [[ $v2 -eq $total ]]; then
    report "S-03" "PASS" "$v2/$total workflows are v2-compliant"
  else
    report "S-03" "FAIL" "$v2/$total v2-compliant. Non-v2: ${non_v2_list}"
  fi
}

# ── S-04: Skill Registry Sync ────────────────────────────────────
check_s04() {
  if [[ ! -f "$REGISTRY" ]]; then
    report "S-04" "FAIL" "Skill registry not found: $REGISTRY"
    return
  fi

  local dir_skills=() reg_skills=() orphan_dirs="" orphan_reg=""

  # Skills from directories
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    local skill_name
    skill_name="$(basename "$skill_dir")"
    [[ -f "$skill_dir/SKILL.md" ]] && dir_skills+=("$skill_name")
  done

  # Skills from registry
  while IFS= read -r line; do
    local name
    name="$(echo "$line" | sed 's/.*name: *//' | tr -d '"' | tr -d "'")"
    [[ -n "$name" ]] && reg_skills+=("$name")
  done < <(grep "^  - name:" "$REGISTRY" 2>/dev/null)

  # Check directory skills exist in registry
  for ds in "${dir_skills[@]}"; do
    local found=false
    for rs in "${reg_skills[@]}"; do
      [[ "$ds" == "$rs" ]] && found=true && break
    done
    $found || orphan_dirs="${orphan_dirs}${ds} "
  done

  # Check registry entries have directories
  for rs in "${reg_skills[@]}"; do
    [[ -f "$SKILLS_DIR/$rs/SKILL.md" ]] || orphan_reg="${orphan_reg}${rs} "
  done

  if [[ -z "$orphan_dirs" && -z "$orphan_reg" ]]; then
    report "S-04" "PASS" "${#dir_skills[@]} skills synced between dirs and registry"
  else
    local msg=""
    [[ -n "$orphan_dirs" ]] && msg="Dirs without registry: ${orphan_dirs}. "
    [[ -n "$orphan_reg" ]] && msg="${msg}Registry without dirs: ${orphan_reg}"
    report "S-04" "FAIL" "$msg"
  fi
}

# ── S-08: No Orphan Skills (bidirectional — alias of S-04) ────────
check_s08() {
  # S-08 is the bidirectional version of S-04; already covered above
  # We add explicit orphan SKILL.md check (dirs with no SKILL.md)
  local orphan_dirs=""
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    local skill_name
    skill_name="$(basename "$skill_dir")"
    [[ -f "$skill_dir/SKILL.md" ]] || orphan_dirs="${orphan_dirs}${skill_name} "
  done

  if [[ -z "$orphan_dirs" ]]; then
    report "S-08" "PASS" "All skill directories contain SKILL.md"
  else
    report "S-08" "FAIL" "Dirs without SKILL.md: ${orphan_dirs}"
  fi
}

# ── S-05: Parity Sync ────────────────────────────────────────────
check_s05() {
  local root_agents="$PROJECT_ROOT/agents"
  if [[ -d "$root_agents" && -d "$AGENTS_DIR" ]]; then
    local diff_output
    diff_output="$(diff -rq "$root_agents" "$AGENTS_DIR" 2>/dev/null || true)"
    if [[ -z "$diff_output" ]]; then
      report "S-05" "PASS" "Root agents/ and .opencode/agents/ are in sync"
    else
      local count
      count="$(echo "$diff_output" | wc -l | tr -d ' ')"
      report "S-05" "WARN" "$count file(s) differ between root and .opencode agents"
    fi
  else
    report "S-05" "WARN" "Cannot check parity — root agents/ or .opencode/agents/ missing"
  fi
}

# ── S-06: Template Coverage ──────────────────────────────────────
check_s06() {
  if [[ ! -d "$TEMPLATES_DIR" ]]; then
    report "S-06" "WARN" "Templates directory not found — manual audit needed"
    return
  fi
  local template_count
  template_count="$(find "$TEMPLATES_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ $template_count -gt 0 ]]; then
    report "S-06" "PASS" "$template_count template(s) found — manual coverage audit recommended"
  else
    report "S-06" "WARN" "No templates found — create templates for workflow outputs"
  fi
}

# ── S-07: Reference Coverage ────────────────────────────────────
check_s07() {
  if [[ ! -d "$REFERENCES_DIR" ]]; then
    report "S-07" "WARN" "References directory not found — manual audit needed"
    return
  fi
  local ref_count
  ref_count="$(find "$REFERENCES_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ $ref_count -gt 0 ]]; then
    report "S-07" "PASS" "$ref_count reference(s) found — manual coverage audit recommended"
  else
    report "S-07" "WARN" "No references found — create references for domain knowledge"
  fi
}

# ── S-09: TypeScript Clean ───────────────────────────────────────
check_s09() {
  if [[ -f "$PROJECT_ROOT/tsconfig.json" ]]; then
    if npx tsc --noEmit --project "$PROJECT_ROOT" 2>/dev/null; then
      report "S-09" "PASS" "TypeScript compilation clean (0 errors)"
    else
      report "S-09" "FAIL" "TypeScript compilation has errors"
    fi
  else
    report "S-09" "WARN" "No tsconfig.json found — skipping TypeScript check"
  fi
}

# ── S-10: Full Test Pass ─────────────────────────────────────────
check_s10() {
  if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    if npm test --prefix "$PROJECT_ROOT" 2>/dev/null 1>/dev/null; then
      report "S-10" "PASS" "All tests pass"
    else
      report "S-10" "FAIL" "Some tests failed"
    fi
  else
    report "S-10" "WARN" "No package.json found — skipping test check"
  fi
}

# ── S-11: Prompt Quality ─────────────────────────────────────────
check_s11() {
  if [[ ! -d "$PROMPTS_DIR" ]]; then
    report "S-11" "WARN" "Prompts directory not found: $PROMPTS_DIR"
    return
  fi

  local total=0 linked=0 unlinked_list=""

  for prompt_file in "$PROMPTS_DIR"/*.md; do
    [[ -f "$prompt_file" ]] || continue
    total=$((total + 1))
    local prompt_name
    prompt_name="$(basename "$prompt_file")"
    # Check if any command references this prompt via required_prompts
    if grep -rlq "$prompt_name" "$COMMANDS_DIR" 2>/dev/null; then
      linked=$((linked + 1))
    else
      unlinked_list="${unlinked_list}${prompt_name%.md} "
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-11" "WARN" "No prompt files found"
  elif [[ $linked -eq $total ]]; then
    report "S-11" "PASS" "$linked/$total prompts linked to commands"
  else
    report "S-11" "FAIL" "$linked/$total linked. Orphan prompts: ${unlinked_list}"
  fi
}

# ── S-12: Template Structure Validation ──────────────────────────
check_s12() {
  if [[ ! -d "$TEMPLATES_DIR" ]]; then
    report "S-12" "WARN" "Templates directory not found: $TEMPLATES_DIR"
    return
  fi

  local total=0 valid=0 issues_list=""

  for tpl_file in "$TEMPLATES_DIR"/*.md; do
    [[ -f "$tpl_file" ]] || continue
    total=$((total + 1))
    local tpl_name has_issue=false
    tpl_name="$(basename "$tpl_file")"

    # Check for placeholder variables ({{var}} or [PLACEHOLDER])
    if ! grep -qE '\{\{|^\[[A-Z_]+\]' "$tpl_file" 2>/dev/null; then
      has_issue=true
      issues_list="${issues_list}${tpl_name%.md}(no-placeholders) "
    fi

    # Check if referenced by any command or workflow
    local is_linked=false
    if grep -rlq "$tpl_name" "$COMMANDS_DIR" 2>/dev/null; then
      is_linked=true
    fi
    if grep -rlq "$tpl_name" "$WORKFLOWS_DIR" 2>/dev/null; then
      is_linked=true
    fi
    if ! $is_linked; then
      has_issue=true
      issues_list="${issues_list}${tpl_name%.md}(unlinked) "
    fi

    if ! $has_issue; then
      valid=$((valid + 1))
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-12" "WARN" "No template files found"
  elif [[ $valid -eq $total ]]; then
    report "S-12" "PASS" "$valid/$total templates have placeholders and are linked"
  else
    report "S-12" "WARN" "$valid/$total valid. Issues: ${issues_list}"
  fi
}

# ── S-13: Reference Completeness ────────────────────────────────
check_s13() {
  if [[ ! -d "$REFERENCES_DIR" ]]; then
    report "S-13" "WARN" "References directory not found: $REFERENCES_DIR"
    return
  fi

  local total=0 linked=0 orphan_list=""

  for ref_file in "$REFERENCES_DIR"/*.md; do
    [[ -f "$ref_file" ]] || continue
    total=$((total + 1))
    local ref_name is_referenced=false
    ref_name="$(basename "$ref_file")"

    # Check if referenced by commands, workflows, or skills
    if grep -rlq "$ref_name" "$COMMANDS_DIR" 2>/dev/null; then
      is_referenced=true
    fi
    if grep -rlq "$ref_name" "$WORKFLOWS_DIR" 2>/dev/null; then
      is_referenced=true
    fi
    if grep -rlq "$ref_name" "$SKILLS_DIR" 2>/dev/null; then
      is_referenced=true
    fi

    if $is_referenced; then
      linked=$((linked + 1))
    else
      orphan_list="${orphan_list}${ref_name%.md} "
    fi
  done

  if [[ $total -eq 0 ]]; then
    report "S-13" "WARN" "No reference files found"
  elif [[ $linked -eq $total ]]; then
    report "S-13" "PASS" "$linked/$total references are linked to commands/workflows/skills"
  else
    report "S-13" "WARN" "$linked/$total linked. Orphan references: ${orphan_list}"
  fi
}

# ── S-14: Command Body Quality (GREEN-FLAG Pattern) ─────────────
check_s14() {
  if [[ ! -d "$COMMANDS_DIR" ]]; then
    report "S-14" "WARN" "Commands directory not found"
    return
  fi

  local router_total=0 green_flag=0 weak_list=""

  for cmd_file in "$COMMANDS_DIR"/*.md; do
    [[ -f "$cmd_file" ]] || continue
    local kind
    kind="$(grep "^kind:" "$cmd_file" 2>/dev/null | head -1 | sed 's/kind: *//' | tr -d '"' | tr -d "'" || true)"
    [[ "$kind" == "router" ]] || continue
    router_total=$((router_total + 1))

    # Check for GREEN-FLAG structure markers in body (after frontmatter)
    local has_objective=false has_context=false has_process=false has_criteria=false
    # Check both XML-style tags and markdown headers
    if grep -qiE '<objective>|## *objective' "$cmd_file" 2>/dev/null; then
      has_objective=true
    fi
    if grep -qiE '<context>|## *context' "$cmd_file" 2>/dev/null; then
      has_context=true
    fi
    if grep -qiE '<process>|## *process|## *steps|## *workflow' "$cmd_file" 2>/dev/null; then
      has_process=true
    fi
    if grep -qiE '<success_criteria>|## *success.criteria|## *acceptance|## *exit.criteria' "$cmd_file" 2>/dev/null; then
      has_criteria=true
    fi

    if $has_objective && $has_context && $has_process && $has_criteria; then
      green_flag=$((green_flag + 1))
    else
      local missing=""
      $has_objective || missing="${missing}obj,"
      $has_context || missing="${missing}ctx,"
      $has_process || missing="${missing}proc,"
      $has_criteria || missing="${missing}crit,"
      weak_list="${weak_list}$(basename "$cmd_file" .md)(${missing%,}) "
    fi
  done

  if [[ $router_total -eq 0 ]]; then
    report "S-14" "WARN" "No router commands found to check body quality"
  elif [[ $green_flag -eq $router_total ]]; then
    report "S-14" "PASS" "$green_flag/$router_total router commands have GREEN-FLAG body structure"
  else
    report "S-14" "WARN" "$green_flag/$router_total GREEN-FLAG. Weak bodies: ${weak_list}"
  fi
}

# ── S-15: Agent Reference Integrity ─────────────────────────────
check_s15() {
  if [[ ! -d "$AGENTS_DIR" ]]; then
    report "S-15" "FAIL" "Agents directory not found"
    return
  fi

  local total_refs=0 broken=0 broken_list=""

  for agent_file in "$AGENTS_DIR"/*.md; do
    [[ -f "$agent_file" ]] || continue
    local agent_name
    agent_name="$(basename "$agent_file" .md)"

    # Extract workflows: field entries (YAML list items under workflows:)
    local in_workflows=false
    while IFS= read -r line; do
      # Detect start of workflows: block
      if [[ "$line" =~ ^workflows: ]]; then
        in_workflows=true
        continue
      fi
      # Detect end of block (new top-level key)
      if $in_workflows && [[ "$line" =~ ^[a-z] && ! "$line" =~ ^[[:space:]] ]]; then
        in_workflows=false
        continue
      fi
      # Process list items under workflows:
      if $in_workflows && [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(.*) ]]; then
        local wf_ref="${BASH_REMATCH[1]}"
        wf_ref="$(echo "$wf_ref" | tr -d '"' | tr -d "'" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')"
        [[ -z "$wf_ref" ]] && continue
        total_refs=$((total_refs + 1))
        local wf_path="$OPENCODE_DIR/$wf_ref"
        # Try with and without workflows/ prefix
        if [[ ! -f "$wf_path" && ! -f "$WORKFLOWS_DIR/$wf_ref" && ! -f "$WORKFLOWS_DIR/${wf_ref}.yaml" && ! -f "$WORKFLOWS_DIR/${wf_ref}.yml" ]]; then
          broken=$((broken + 1))
          broken_list="${broken_list}${agent_name}→${wf_ref} "
        fi
      fi
    done < "$agent_file"
  done

  if [[ $total_refs -eq 0 ]]; then
    report "S-15" "WARN" "No agent workflow references found to validate"
  elif [[ $broken -eq 0 ]]; then
    report "S-15" "PASS" "$total_refs agent references verified — all resolve"
  else
    report "S-15" "FAIL" "$broken/$total_refs broken agent refs: ${broken_list}"
  fi
}

# ── S-16: Command Chain Consistency ─────────────────────────────
check_s16() {
  if [[ ! -d "$COMMANDS_DIR" ]]; then
    report "S-16" "WARN" "Commands directory not found"
    return
  fi

  local chain_groups=() inconsistent=0

  # Collect all chain_group values
  for cmd_file in "$COMMANDS_DIR"/*.md; do
    [[ -f "$cmd_file" ]] || continue
    local cg
    cg="$(grep "^chain_group:" "$cmd_file" 2>/dev/null | head -1 | sed 's/chain_group: *//' | tr -d '"' | tr -d "'" || true)"
    [[ -n "$cg" ]] && chain_groups+=("$cg")
  done

  if [[ ${#chain_groups[@]} -eq 0 ]]; then
    report "S-16" "WARN" "No chain_group fields found in commands"
    return
  fi

  # Check alias_resolved_to values point to real commands
  local bad_alias="" alias_count=0
  for cmd_file in "$COMMANDS_DIR"/*.md; do
    [[ -f "$cmd_file" ]] || continue
    local alias_to
    alias_to="$(grep "^alias_resolved_to:" "$cmd_file" 2>/dev/null | head -1 | sed 's/alias_resolved_to: *//' | tr -d '"' | tr -d "'" || true)"
    [[ -z "$alias_to" ]] && continue
    alias_count=$((alias_count + 1))
    # Check if target command exists (handle spaces in alias names by also checking dash-form)
    local alias_dash
    alias_dash="$(echo "$alias_to" | tr ' ' '-')"
    if [[ ! -f "$COMMANDS_DIR/${alias_to}.md" && ! -f "$COMMANDS_DIR/${alias_dash}.md" ]]; then
      inconsistent=$((inconsistent + 1))
      bad_alias="${bad_alias}$(basename "$cmd_file" .md)→${alias_to} "
    fi
  done

  local unique_groups
  unique_groups="$(printf '%s\n' "${chain_groups[@]}" | sort -u | wc -l | tr -d ' ')"

  if [[ $inconsistent -gt 0 ]]; then
    report "S-16" "FAIL" "$inconsistent broken alias(es): ${bad_alias}"
  else
    report "S-16" "PASS" "${#chain_groups[@]} chain_group assignments across $unique_groups groups; $alias_count alias(es) verified"
  fi
}

# ── S-17: Workflow Hand-off Validation ──────────────────────────
check_s17() {
  if [[ ! -d "$WORKFLOWS_DIR" ]]; then
    report "S-17" "WARN" "Workflows directory not found"
    return
  fi

  local total_handoffs=0 broken_handoffs=0 issues=""

  for wf_file in "$WORKFLOWS_DIR"/*.yaml "$WORKFLOWS_DIR"/*.yml; do
    [[ -f "$wf_file" ]] || continue
    local wf_name
    wf_name="$(basename "$wf_file")"

    # Extract ordered target_agent values
    local agents=()
    while IFS= read -r line; do
      local agent
      agent="$(echo "$line" | sed 's/.*target_agent: *//' | tr -d '"' | tr -d "'")"
      [[ -n "$agent" ]] && agents+=("$agent")
    done < <(grep "target_agent:" "$wf_file" 2>/dev/null || true)

    # Check for hand-offs (adjacent steps with different agents)
    local prev=""
    for agent in "${agents[@]}"; do
      if [[ -n "$prev" && "$prev" != "$agent" ]]; then
        total_handoffs=$((total_handoffs + 1))
        # For a proper hand-off, the workflow should have exit_criteria and entry_criteria
        if ! grep -q "exit_criteria:" "$wf_file" 2>/dev/null || ! grep -q "entry_criteria:" "$wf_file" 2>/dev/null; then
          broken_handoffs=$((broken_handoffs + 1))
          issues="${issues}${wf_name}(${prev}→${agent}) "
        fi
      fi
      prev="$agent"
    done
  done

  if [[ $total_handoffs -eq 0 ]]; then
    report "S-17" "PASS" "No cross-agent hand-offs found (single-agent workflows)"
  elif [[ $broken_handoffs -eq 0 ]]; then
    report "S-17" "PASS" "$total_handoffs hand-off(s) all have entry/exit criteria"
  else
    report "S-17" "WARN" "$broken_handoffs/$total_handoffs hand-offs lack entry/exit criteria: ${issues}"
  fi
}

# ── S-18: Planning Artifact Hierarchy ────────────────────────────
check_s18() {
  if [[ ! -d "$HIVEMIND_DIR" ]]; then
    report "S-18" "WARN" "No .hivemind/ directory — cannot check planning hierarchy"
    return
  fi

  local project_dir="$HIVEMIND_DIR/project"
  if [[ ! -d "$project_dir" ]]; then
    report "S-18" "WARN" "No .hivemind/project/ directory — planning artifacts not structured"
    return
  fi

  # Check for hierarchy structure: project/ > planning/ > phases/ > tasks/
  local has_planning=false
  [[ -d "$project_dir/planning" ]] && has_planning=true
  # Also accept planning/ under .hivemind/ directly
  [[ -d "$HIVEMIND_DIR/planning" ]] && has_planning=true

  # Count orphan files (files at project root without parent refs)
  local orphan_count=0
  for f in "$project_dir"/*.md "$project_dir"/*.json; do
    [[ -f "$f" ]] || continue
    if ! grep -qiE 'parent:|phase:|trajectory:' "$f" 2>/dev/null; then
      orphan_count=$((orphan_count + 1))
    fi
  done

  if $has_planning; then
    if [[ $orphan_count -gt 3 ]]; then
      report "S-18" "WARN" "Planning hierarchy exists but $orphan_count orphan file(s) at project root"
    else
      report "S-18" "PASS" "Planning hierarchy structured (planning/ exists, $orphan_count orphan files)"
    fi
  else
    report "S-18" "WARN" "No planning/ subdirectory — flat artifact structure"
  fi
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  if ! $JSON_MODE; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  HIVEMIND Structural Audit — S-01 through S-18          ║"
    echo "║  Project: $(basename "$PROJECT_ROOT")"
    echo "║  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Base Structural Checks (S-01 → S-10):"
  fi

  check_s01
  check_s02
  check_s03
  check_s04
  check_s05
  check_s06
  check_s07
  check_s08
  check_s09
  check_s10

  if ! $JSON_MODE; then
    echo ""
    echo "  Extended Entity Quality (S-11 → S-18):"
  fi

  check_s11
  check_s12
  check_s13
  check_s14
  check_s15
  check_s16
  check_s17
  check_s18

  if ! $JSON_MODE; then
    echo ""
    echo "────────────────────────────────────────────────────────────"
    printf "  TOTAL: %d PASS / %d FAIL / %d WARN\n" "$PASS_COUNT" "$FAIL_COUNT" "$WARN_COUNT"
    echo "────────────────────────────────────────────────────────────"

    if [[ $FAIL_COUNT -gt 0 ]]; then
      echo "  VERDICT: BLOCKED — fix FAILs before proceeding"
      exit 1
    elif [[ $WARN_COUNT -gt 0 ]]; then
      echo "  VERDICT: PASS WITH WARNINGS — review WARNs"
      exit 0
    else
      echo "  VERDICT: ALL CLEAR"
      exit 0
    fi
  else
    # JSON output
    echo "{"
    echo "  \"pass\": $PASS_COUNT,"
    echo "  \"fail\": $FAIL_COUNT,"
    echo "  \"warn\": $WARN_COUNT,"
    echo "  \"verdict\": \"$([ $FAIL_COUNT -gt 0 ] && echo 'BLOCKED' || echo 'PASS')\","
    echo "  \"results\": ["
    local first=true
    for r in "${RESULTS[@]}"; do
      IFS='|' read -r id status message <<< "$r"
      $first || echo ","
      printf '    {"id": "%s", "status": "%s", "message": "%s"}' "$id" "$status" "$message"
      first=false
    done
    echo ""
    echo "  ]"
    echo "}"
  fi
}

main "$@"

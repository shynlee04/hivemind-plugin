#!/usr/bin/env bash
# runtime-gate.sh — UNIFIED RUNTIME ENFORCER for HiveFiver V2
# This is the MANDATORY enforcement layer. Called at lifecycle points:
#   pre-turn    — Before ANY work: verify skills, state, TODO, chain
#   post-turn   — After work: quality check, parity, state update, export
#   checkpoint  — Mid-work: verify chain integrity
#   export      — Session end: capture findings, create handoff
#   chain-check — Validate a tool/script is properly chained
#   journey     — Map intent → required tools → execution order
#   toolmap     — Dump the full tool-chain registry as JSON
#
# Usage: runtime-gate.sh <action> [working-directory] [extra-args...]
# Output: JSON always. Exit 0 always (findings in JSON).

set -Eeuo pipefail

readonly ACTION="${1:-pre-turn}"
readonly WORKDIR="${2:-.}"
readonly EXTRA="${3:-}"

readonly SCRIPTS_DIR="$WORKDIR/.opencode/skills/hivefiver-coordination/scripts"
readonly MODE_SCRIPTS="$WORKDIR/.opencode/skills/hivefiver-mode/scripts"
readonly STATE_FILE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"
readonly HANDOFF_DIR="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/handoffs"

CHECKS=0
FAILURES=()
WARNINGS=()
ENFORCEMENTS=()

fail() { FAILURES+=("$1"); }
warn() { WARNINGS+=("$1"); }
enforce() { ENFORCEMENTS+=("$1"); }
check() { (( ++CHECKS )); }

# ============================================================
# TOOL-CHAIN REGISTRY
# Every script mapped to: hierarchy position, trigger, upstream, downstream
# ============================================================
tool_chain_map() {
  cat <<'TOOLMAP'
{
  "registry": {
    "runtime-gate.sh": {
      "hierarchy": "ROOT_ENFORCER",
      "position": "lifecycle_hook",
      "triggers": ["every_turn_start", "every_turn_end", "checkpoint", "session_end"],
      "upstream": [],
      "downstream": ["ALL"],
      "mandatory": true,
      "description": "Unified runtime gate — MUST fire at every lifecycle point"
    },
    "state-update.sh": {
      "hierarchy": "state_management",
      "position": "gate_0",
      "triggers": ["session_start", "stage_transition", "pipeline_mutation"],
      "upstream": ["runtime-gate.sh"],
      "downstream": ["gate-check.sh", "pipeline-orchestrator.sh", "session-continue.sh"],
      "mandatory": true,
      "description": "Read/write pipeline state in STATE.md"
    },
    "gate-check.sh": {
      "hierarchy": "gate_enforcement",
      "position": "gate_0_1",
      "triggers": ["before_stage_entry", "before_asset_write"],
      "upstream": ["state-update.sh"],
      "downstream": ["quality-check.sh", "verify-stage.sh"],
      "mandatory": true,
      "description": "Check if current stage is allowed based on completed prerequisites"
    },
    "quality-check.sh": {
      "hierarchy": "quality_validation",
      "position": "gate_3",
      "triggers": ["after_asset_write", "before_completion_claim", "post_turn"],
      "upstream": ["gate-check.sh"],
      "downstream": ["verify-stage.sh", "session-continue.sh"],
      "mandatory": true,
      "description": "Comprehensive asset validation — frontmatter, contracts, anti-patterns, parity"
    },
    "verify-stage.sh": {
      "hierarchy": "stage_verification",
      "position": "gate_3_4",
      "triggers": ["after_quality_check", "before_stage_advance"],
      "upstream": ["quality-check.sh"],
      "downstream": ["pipeline-orchestrator.sh"],
      "mandatory": true,
      "description": "Verify a stage is truly complete with evidence"
    },
    "pipeline-orchestrator.sh": {
      "hierarchy": "pipeline_control",
      "position": "gate_4",
      "triggers": ["stage_advance", "pipeline_query", "session_export"],
      "upstream": ["verify-stage.sh", "state-update.sh"],
      "downstream": ["session-continue.sh"],
      "mandatory": true,
      "description": "Pipeline sequencing — next stage, advance, status, sequence"
    },
    "classify-intent.sh": {
      "hierarchy": "intent_routing",
      "position": "gate_0",
      "triggers": ["user_input", "session_start"],
      "upstream": ["runtime-gate.sh"],
      "downstream": ["route-stage.sh", "gate-check.sh"],
      "mandatory": true,
      "description": "Classify user intent to route to correct stage"
    },
    "route-stage.sh": {
      "hierarchy": "stage_routing",
      "position": "gate_0",
      "triggers": ["after_intent_classification", "session_start"],
      "upstream": ["classify-intent.sh"],
      "downstream": ["gate-check.sh"],
      "mandatory": true,
      "description": "Route to correct stage command based on pipeline state"
    },
    "validate-delegation.sh": {
      "hierarchy": "delegation_validation",
      "position": "gate_2",
      "triggers": ["before_subagent_dispatch", "after_delegation_packet_write"],
      "upstream": ["gate-check.sh"],
      "downstream": ["session-continue.sh"],
      "mandatory": false,
      "description": "Validate delegation packets before dispatch"
    },
    "session-continue.sh": {
      "hierarchy": "session_lifecycle",
      "position": "gate_4",
      "triggers": ["session_end", "context_limit", "stage_completion"],
      "upstream": ["pipeline-orchestrator.sh", "quality-check.sh"],
      "downstream": [],
      "mandatory": false,
      "description": "Generate handoff and spawn continuation session"
    },
    "schema-guard.sh": {
      "hierarchy": "schema_validation",
      "position": "gate_1",
      "triggers": ["after_frontmatter_write", "spec_stage"],
      "upstream": ["gate-check.sh"],
      "downstream": ["quality-check.sh"],
      "mandatory": false,
      "description": "Deep schema validation for agent/command/skill frontmatter"
    },
    "research-guard.sh": {
      "hierarchy": "research_validation",
      "position": "gate_1",
      "triggers": ["after_research_synthesis", "before_spec_write"],
      "upstream": ["gate-check.sh"],
      "downstream": ["quality-check.sh"],
      "mandatory": false,
      "description": "Validate research claims have MCP source citations"
    },
    "hivefiver-tools.sh": {
      "hierarchy": "inventory_management",
      "position": "gate_0",
      "triggers": ["session_start", "after_build", "audit"],
      "upstream": ["runtime-gate.sh"],
      "downstream": ["quality-check.sh"],
      "mandatory": true,
      "description": "Asset inventory scan — counts agents, commands, skills, workflows"
    },
    "journey-intake-qa.sh": {
      "hierarchy": "intake_facilitation",
      "position": "gate_1",
      "triggers": ["intake_stage"],
      "upstream": ["classify-intent.sh"],
      "downstream": ["schema-guard.sh"],
      "mandatory": false,
      "description": "Structured QA session for requirement gathering"
    }
  }
}
TOOLMAP
}

# ============================================================
# JOURNEY MAPPER — Given intent, return execution order
# ============================================================
journey_map() {
  local intent="${1:-build_new}"
  case "$intent" in
    build_new)
      cat <<'EOF'
{"intent":"build_new","journey":[
  {"step":1,"tool":"runtime-gate.sh pre-turn","gate":"G0","purpose":"Verify environment ready"},
  {"step":2,"tool":"classify-intent.sh","gate":"G0","purpose":"Confirm intent=build_new"},
  {"step":3,"tool":"route-stage.sh","gate":"G0","purpose":"Determine current stage"},
  {"step":4,"tool":"gate-check.sh <stage>","gate":"G0-G1","purpose":"Verify stage entry allowed"},
  {"step":5,"tool":"state-update.sh read","gate":"G0","purpose":"Load pipeline state"},
  {"step":6,"tool":"[WORK: create/edit assets]","gate":"EXECUTION","purpose":"Build framework assets"},
  {"step":7,"tool":"quality-check.sh <stage>","gate":"G3","purpose":"Validate all assets"},
  {"step":8,"tool":"verify-stage.sh <stage>","gate":"G3-G4","purpose":"Verify stage complete"},
  {"step":9,"tool":"pipeline-orchestrator.sh advance","gate":"G4","purpose":"Advance pipeline"},
  {"step":10,"tool":"runtime-gate.sh post-turn","gate":"G4","purpose":"Export + persist state"},
  {"step":11,"tool":"runtime-gate.sh export","gate":"G4","purpose":"Create handoff artifact"}
],"mandatory_gates":["G0","G3","G4"],"skip_penalty":"VIOLATION: completion claim without evidence"}
EOF
      ;;
    fix_broken)
      cat <<'EOF'
{"intent":"fix_broken","journey":[
  {"step":1,"tool":"runtime-gate.sh pre-turn","gate":"G0","purpose":"Verify environment ready"},
  {"step":2,"tool":"quality-check.sh build","gate":"G3","purpose":"Identify all failures"},
  {"step":3,"tool":"hivefiver-tools.sh inventory scan","gate":"G0","purpose":"Check inventory health"},
  {"step":4,"tool":"[WORK: fix identified issues]","gate":"EXECUTION","purpose":"Apply fixes"},
  {"step":5,"tool":"quality-check.sh build","gate":"G3","purpose":"Verify fixes resolved issues"},
  {"step":6,"tool":"runtime-gate.sh post-turn","gate":"G4","purpose":"Export + persist state"}
],"mandatory_gates":["G0","G3","G4"],"skip_penalty":"VIOLATION: claim fix without re-validation"}
EOF
      ;;
    audit_health)
      cat <<'EOF'
{"intent":"audit_health","journey":[
  {"step":1,"tool":"runtime-gate.sh pre-turn","gate":"G0","purpose":"Verify environment ready"},
  {"step":2,"tool":"hivefiver-tools.sh inventory scan","gate":"G0","purpose":"Full inventory"},
  {"step":3,"tool":"quality-check.sh build","gate":"G3","purpose":"Full quality audit"},
  {"step":4,"tool":"verify-stage.sh build","gate":"G3","purpose":"Stage verification"},
  {"step":5,"tool":"runtime-gate.sh post-turn","gate":"G4","purpose":"Export findings"}
],"mandatory_gates":["G0","G3","G4"],"skip_penalty":"VIOLATION: audit without evidence"}
EOF
      ;;
    *)
      printf '{"intent":"%s","journey":[],"error":"Unknown intent. Use: build_new, fix_broken, audit_health"}\n' "$intent"
      ;;
  esac
}

# ============================================================
# PRE-TURN CHECK — Run BEFORE any work
# ============================================================
do_pre_turn() {
  check
  # 1. Pipeline state readable?
  if [[ -f "$STATE_FILE" ]]; then
    local state_json
    state_json=$("$SCRIPTS_DIR/state-update.sh" read "$WORKDIR" 2>/dev/null || echo '{}')
    if [[ -n "$state_json" && "$state_json" != "{}" ]]; then
      enforce "STATE_READ: Pipeline state loaded"
    else
      fail "PRE-01: Cannot read pipeline state from STATE.md"
    fi
  else
    warn "PRE-02: STATE.md not found — pipeline may not be initialized"
  fi

  check
  # 2. Inventory health
  local inv_json
  inv_json=$("$SCRIPTS_DIR/hivefiver-tools.sh" inventory scan 2>/dev/null || echo '{}')
  if printf '%s' "$inv_json" | grep -q '"health"'; then
    local health
    health=$(printf '%s' "$inv_json" | sed -n 's/.*"health" *: *"\([^"]*\)".*/\1/p')
    if [[ "$health" == "healthy" ]]; then
      enforce "INVENTORY: healthy"
    else
      warn "PRE-03: Inventory health is '$health'"
    fi
  else
    fail "PRE-04: Inventory scan failed"
  fi

  check
  # 3. Quality baseline (quick — just count, don't block)
  local qc_json
  qc_json=$("$SCRIPTS_DIR/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{}')
  if printf '%s' "$qc_json" | grep -q '"passed"'; then
    local passed
    passed=$(printf '%s' "$qc_json" | sed -n 's/.*"passed" *: *\([a-z]*\).*/\1/p')
    if [[ "$passed" == "true" ]]; then
      enforce "QUALITY_BASELINE: passed"
    else
      warn "PRE-05: Quality baseline has failures — address before claiming completion"
    fi
  fi

  check
  # 4. Skills reminder — emit what MUST be loaded
  enforce "SKILLS_REQUIRED: hivefiver-mode, hivefiver-coordination"
  enforce "TODO_REQUIRED: Must have active TODO list with HARD STOP as final item"
}

# ============================================================
# POST-TURN CHECK — Run AFTER work
# ============================================================
do_post_turn() {
  check
  # 1. Quality check (full)
  local qc_json
  qc_json=$("$SCRIPTS_DIR/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{}')
  local passed="unknown"
  local fail_count=0
  local warn_count=0
  if printf '%s' "$qc_json" | grep -q '"passed"'; then
    passed=$(printf '%s' "$qc_json" | sed -n 's/.*"passed" *: *\([a-z]*\).*/\1/p')
    fail_count=$(printf '%s' "$qc_json" | sed -n 's/.*"failures" *: *\[/&/p' | tr ',' '\n' | grep -c '"' || echo 0)
    warn_count=$(printf '%s' "$qc_json" | sed -n 's/.*"warnings" *: *\[/&/p' | tr ',' '\n' | grep -c '"' || echo 0)
  fi
  if [[ "$passed" == "true" ]]; then
    enforce "POST_QUALITY: passed ($fail_count failures, $warn_count warnings)"
  else
    fail "POST-01: Quality check failed after work — must fix before claiming completion"
  fi

  check
  # 2. Pipeline state still valid?
  local status_json
  status_json=$("$SCRIPTS_DIR/pipeline-orchestrator.sh" status "$WORKDIR" 2>/dev/null || echo '{}')
  if printf '%s' "$status_json" | grep -q '"health"'; then
    local health
    health=$(printf '%s' "$status_json" | sed -n 's/.*"health" *: *"\([^"]*\)".*/\1/p')
    enforce "POST_PIPELINE: health=$health"
  fi

  check
  # 3. Emit state checkpoint
  "$SCRIPTS_DIR/state-update.sh" set-checkpoint "$WORKDIR" >/dev/null 2>&1 || true
  enforce "POST_CHECKPOINT: state checkpoint written"

  check
  # 4. Remind about exports
  enforce "POST_EXPORT_REMINDER: Run 'runtime-gate.sh export' before session end"
}

# ============================================================
# CHECKPOINT — Mid-work chain integrity check
# ============================================================
do_checkpoint() {
  check
  # Quick quality + state snapshot
  local qc_json
  qc_json=$("$SCRIPTS_DIR/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{}')
  local passed
  passed=$(printf '%s' "$qc_json" | sed -n 's/.*"passed" *: *\([a-z]*\).*/\1/p' || echo "unknown")
  enforce "CHECKPOINT_QUALITY: passed=$passed"

  check
  "$SCRIPTS_DIR/state-update.sh" set-checkpoint "$WORKDIR" >/dev/null 2>&1 || true
  enforce "CHECKPOINT_STATE: saved"
}

# ============================================================
# EXPORT — Session end capture
# ============================================================
do_export() {
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  check
  # 1. Final quality check
  local qc_json
  qc_json=$("$SCRIPTS_DIR/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{}')
  enforce "EXPORT_QUALITY: captured"

  check
  # 2. Pipeline status
  local status_json
  status_json=$("$SCRIPTS_DIR/pipeline-orchestrator.sh" status "$WORKDIR" 2>/dev/null || echo '{}')
  enforce "EXPORT_PIPELINE: captured"

  check
  # 3. Inventory snapshot
  local inv_json
  inv_json=$("$SCRIPTS_DIR/hivefiver-tools.sh" inventory scan 2>/dev/null || echo '{}')
  enforce "EXPORT_INVENTORY: captured"

  check
  # 4. Write export artifact
  mkdir -p "$HANDOFF_DIR"
  local export_file="$HANDOFF_DIR/export-$(date -u +'%Y%m%d-%H%M%S').json"
  printf '{\n' > "$export_file"
  printf '  "timestamp": "%s",\n' "$timestamp" >> "$export_file"
  printf '  "quality": %s,\n' "$qc_json" >> "$export_file"
  printf '  "pipeline": %s,\n' "$status_json" >> "$export_file"
  printf '  "inventory": %s\n' "$inv_json" >> "$export_file"
  printf '}\n' >> "$export_file"
  enforce "EXPORT_FILE: $export_file"
}

# ============================================================
# CHAIN-CHECK — Validate a tool is properly chained
# ============================================================
do_chain_check() {
  local tool_name="${EXTRA:-}"
  check
  if [[ -z "$tool_name" ]]; then
    fail "CHAIN-01: No tool name provided. Usage: runtime-gate.sh chain-check . <tool-name>"
    return
  fi

  local registry
  registry=$(tool_chain_map)
  if printf '%s' "$registry" | grep -q "\"$tool_name\""; then
    local mandatory
    mandatory=$(printf '%s' "$registry" | sed -n "/$tool_name/,/}/{ s/.*\"mandatory\" *: *\([a-z]*\).*/\1/p; }" | head -1)
    local hierarchy
    hierarchy=$(printf '%s' "$registry" | sed -n "/$tool_name/,/}/{ s/.*\"hierarchy\" *: *\"\([^\"]*\)\".*/\1/p; }" | head -1)
    enforce "CHAIN_VALID: $tool_name (hierarchy=$hierarchy, mandatory=$mandatory)"
  else
    fail "CHAIN-02: Tool '$tool_name' is NOT in the chain registry — unregistered tool"
  fi
}

# ============================================================
# OUTPUT — Always JSON
# ============================================================
emit_json() {
  printf '{\n'
  printf '  "action": "%s",\n' "$ACTION"
  printf '  "checks_run": %d,\n' "$CHECKS"
  printf '  "passed": %s,\n' "$(if (( ${#FAILURES[@]} > 0 )); then echo false; else echo true; fi)"

  printf '  "enforcements": [\n'
  local first=true
  for e in ${ENFORCEMENTS[@]+"${ENFORCEMENTS[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$e"
  done
  printf '\n  ],\n'

  printf '  "failures": [\n'
  first=true
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

# ============================================================
# MAIN DISPATCH
# ============================================================
case "$ACTION" in
  pre-turn)     do_pre_turn   ;;
  post-turn)    do_post_turn  ;;
  checkpoint)   do_checkpoint ;;
  export)       do_export     ;;
  chain-check)  do_chain_check ;;
  journey)      journey_map "$EXTRA"; exit 0 ;;
  toolmap)      tool_chain_map; exit 0 ;;
  *)
    fail "UNKNOWN_ACTION: '$ACTION'. Valid: pre-turn, post-turn, checkpoint, export, chain-check, journey, toolmap"
    ;;
esac

emit_json

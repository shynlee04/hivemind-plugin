#!/usr/bin/env bash
# hm-codescan.sh — Structured code scanning helper for hivemind-codemap
#
# Produces machine-readable JSON output for code-scanning workflows.
# Zero external dependencies beyond standard Unix tools.
#
# Usage:
#   bash hm-codescan.sh <command> [options]
#
# Commands:
#   structure    Repository structure extraction (dirs, files, sizes)
#   exports      Find exported symbols in TypeScript source
#   imports      Map import relationships
#   seams        Detect boundary files (index.ts, barrel exports)
#   hotspots     Find large or complex files (>200 lines)
#   batch-plan   Generate batch plan for deep/exhaustive scans
#
# Options:
#   --scope DIR        Scope scan to a directory (default: src/)
#   --pass-id ID       Pass identifier for multi-pass tracking
#   --batch-size N     Files per batch for batch-plan (default: 20)
#   --cwd DIR          Project root directory (default: pwd)

set -uo pipefail

SCOPE="src"
PASS_ID="pass_$(date +%s)"
BATCH_SIZE=20
COMMAND=""
PROJECT_ROOT=""

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      structure|exports|imports|seams|hotspots|batch-plan)
        COMMAND="$1"; shift ;;
      --scope) SCOPE="$2"; shift 2 ;;
      --pass-id) PASS_ID="$2"; shift 2 ;;
      --batch-size) BATCH_SIZE="$2"; shift 2 ;;
      --cwd) PROJECT_ROOT="$2"; shift 2 ;;
      *) echo "Unknown argument: $1" >&2; exit 1 ;;
    esac
  done
  if [[ -z "$COMMAND" ]]; then
    echo "Usage: hm-codescan.sh <command> [options]" >&2
    exit 1
  fi
  if [[ -z "$PROJECT_ROOT" ]]; then
    PROJECT_ROOT="$(pwd)"
  fi
}

ts_now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

find_ts_files() {
  find "$1" -type f \( -name '*.ts' -o -name '*.tsx' \) \
    -not -path '*/node_modules/*' -not -path '*/dist/*' 2>/dev/null || true
}

cmd_structure() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local total
  total=$(find_ts_files "$target" | wc -l | tr -d ' ')
  local dirs_json=""
  while IFS= read -r dir; do
    local count
    count=$(find "$dir" -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | wc -l | tr -d ' ')
    local rel="${dir#${PROJECT_ROOT}/}"
    if [[ -n "$dirs_json" ]]; then dirs_json="${dirs_json},"; fi
    dirs_json="${dirs_json}{\"path\":\"${rel}\",\"ts_files\":${count}}"
  done < <(find "$target" -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' 2>/dev/null | sort || true)
  echo "{\"command\":\"structure\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"total_ts_files\":${total},\"directories\":[${dirs_json}]}"
}

cmd_exports() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local results=""
  while IFS= read -r file; do
    local rel="${file#${PROJECT_ROOT}/}"
    local count
    count=$(grep -c '^export ' "$file" 2>/dev/null || echo "0")
    if [[ "$count" -gt 0 ]]; then
      if [[ -n "$results" ]]; then results="${results},"; fi
      results="${results}{\"file\":\"${rel}\",\"export_count\":${count}}"
    fi
  done < <(find_ts_files "$target" | sort || true)
  echo "{\"command\":\"exports\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"results\":[${results}]}"
}

cmd_imports() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local results=""
  while IFS= read -r file; do
    local rel="${file#${PROJECT_ROOT}/}"
    local total_count
    total_count=$(grep -c '^import ' "$file" 2>/dev/null || echo "0")
    local local_count
    local_count=$(grep -c "^import.*from ['\"]\\./" "$file" 2>/dev/null || echo "0")
    if [[ "$total_count" -gt 0 ]]; then
      if [[ -n "$results" ]]; then results="${results},"; fi
      results="${results}{\"file\":\"${rel}\",\"total\":${total_count},\"local\":${local_count},\"external\":$((total_count - local_count))}"
    fi
  done < <(find_ts_files "$target" | sort || true)
  echo "{\"command\":\"imports\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"results\":[${results}]}"
}

cmd_seams() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local seams=""
  while IFS= read -r file; do
    local rel="${file#${PROJECT_ROOT}/}"
    local reexports
    reexports=$(grep -c "^export.*from" "$file" 2>/dev/null || echo "0")
    if [[ -n "$seams" ]]; then seams="${seams},"; fi
    seams="${seams}{\"file\":\"${rel}\",\"reexports\":${reexports}}"
  done < <(find "$target" -type f -name 'index.ts' -not -path '*/node_modules/*' -not -path '*/dist/*' 2>/dev/null | sort || true)
  echo "{\"command\":\"seams\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"seams\":[${seams}]}"
}

cmd_hotspots() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local hotspots=""
  while IFS= read -r file; do
    local rel="${file#${PROJECT_ROOT}/}"
    local lines
    lines=$(wc -l < "$file" | tr -d ' ')
    if [[ "$lines" -gt 200 ]]; then
      if [[ -n "$hotspots" ]]; then hotspots="${hotspots},"; fi
      hotspots="${hotspots}{\"file\":\"${rel}\",\"lines\":${lines}}"
    fi
  done < <(find_ts_files "$target" | sort || true)
  echo "{\"command\":\"hotspots\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"threshold\":200,\"hotspots\":[${hotspots}]}"
}

cmd_batch_plan() {
  local target="${PROJECT_ROOT}/${SCOPE}"
  if [[ ! -d "$target" ]]; then
    echo "{\"error\":\"not found: ${target}\"}"
    return 1
  fi
  local all_files=()
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    all_files+=("${file#${PROJECT_ROOT}/}")
  done < <(find_ts_files "$target" | sort || true)
  local total=${#all_files[@]}
  local batch_count=$(( (total + BATCH_SIZE - 1) / BATCH_SIZE ))
  local batches=""
  for (( i=0; i<batch_count; i++ )); do
    local start=$((i * BATCH_SIZE))
    local end=$((start + BATCH_SIZE))
    if [[ $end -gt $total ]]; then end=$total; fi
    local files_str=""
    for (( j=start; j<end; j++ )); do
      if [[ -n "$files_str" ]]; then files_str="${files_str},"; fi
      files_str="${files_str}\"${all_files[$j]}\""
    done
    if [[ -n "$batches" ]]; then batches="${batches},"; fi
    batches="${batches}{\"batch_id\":\"batch_$((i+1))\",\"file_count\":$((end - start)),\"files\":[${files_str}]}"
  done
  echo "{\"command\":\"batch-plan\",\"pass_id\":\"${PASS_ID}\",\"scope\":\"${SCOPE}\",\"timestamp\":\"$(ts_now)\",\"batch_size\":${BATCH_SIZE},\"total_files\":${total},\"batch_count\":${batch_count},\"batches\":[${batches}]}"
}

parse_args "$@"
case "$COMMAND" in
  structure)   cmd_structure ;;
  exports)     cmd_exports ;;
  imports)     cmd_imports ;;
  seams)       cmd_seams ;;
  hotspots)    cmd_hotspots ;;
  batch-plan)  cmd_batch_plan ;;
  *) echo "Unknown: $COMMAND" >&2; exit 1 ;;
esac

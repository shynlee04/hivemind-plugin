#!/usr/bin/env bash
# hm-activity-classify.sh — Classify a file path by activity class → JSON to stdout
set -uo pipefail

FILE_PATH=""
PROJECT_ROOT=""
OVERRIDES_FILE=""

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cwd) PROJECT_ROOT="$2"; shift 2 ;;
      --overrides) OVERRIDES_FILE="$2"; shift 2 ;;
      --help) echo "Usage: hm-activity-classify.sh <file-path> [--cwd DIR] [--overrides FILE]"; exit 0 ;;
      -*) echo "Unknown option: $1" >&2; exit 1 ;;
      *)
        if [[ -z "$FILE_PATH" ]]; then FILE_PATH="$1"; shift
        else echo "Unexpected argument: $1" >&2; exit 1; fi ;;
    esac
  done
  if [[ -z "$FILE_PATH" ]]; then echo '{"error":"no file path provided"}' >&2; exit 1; fi
  PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
  OVERRIDES_FILE="${OVERRIDES_FILE:-${PROJECT_ROOT}/.hivemind-classify.json}"
}

check_overrides() {
  if [[ -f "$OVERRIDES_FILE" ]]; then
    local o
    o=$(grep "\"${FILE_PATH}\"" "$OVERRIDES_FILE" 2>/dev/null | head -1 | sed 's/.*: *"//;s/".*//' || true)
    if [[ -n "$o" ]]; then echo "$o"; return 0; fi
  fi
  return 1
}

classify_path() {
  local p="$1" fn
  fn=$(basename "$p")
  if [[ "$p" == .hivemind/* ]]; then echo "runtime"; return; fi
  if [[ "$p" == dist/* ]]; then echo "runtime"; return; fi
  if [[ "$p" == .opencode/* ]]; then echo "projection"; return; fi
  if [[ "$p" == docs/generated/* ]]; then echo "projection"; return; fi
  if [[ "$fn" == "AGENTS.md" || "$fn" == "package.json" || "$fn" == "opencode.json" ]]; then echo "meta"; return; fi
  if [[ "$fn" == *.skill.md ]]; then echo "meta"; return; fi
  if [[ "$fn" == *.adr.md || "$p" == docs/plans/* || "$p" == docs/specs/* ]]; then echo "artifact"; return; fi
  if [[ "$p" == src/* ]]; then echo "code"; return; fi
  if [[ "$p" == tests/* ]]; then echo "code"; return; fi
  if [[ "$fn" == *.ts || "$fn" == *.tsx || "$fn" == *.js || "$fn" == *.jsx ]]; then echo "code"; return; fi
  if [[ "$p" == docs/* ]]; then echo "artifact"; return; fi
  echo "artifact"
}

detect_granularity() {
  case "$1" in runtime) echo "line" ;; code) echo "chunk" ;; *) echo "whole-file" ;; esac
}

detect_operation() {
  local fp="${PROJECT_ROOT}/${1}" st
  if [[ ! -f "$fp" ]]; then
    if git -C "$PROJECT_ROOT" ls-files --deleted 2>/dev/null | grep -qF "$1"; then echo "D"; return; fi
    echo "C"; return
  fi
  st=$(git -C "$PROJECT_ROOT" status --porcelain -- "$1" 2>/dev/null | awk '{print $1}' | head -1 || true)
  case "$st" in A|??) echo "C" ;; M) echo "M" ;; D) echo "D" ;; R*) echo "R" ;; *) echo "M" ;; esac
}

parse_args "$@"
OVERRIDE_CLASS=""
if OVERRIDE_CLASS=$(check_overrides); then CLASS="$OVERRIDE_CLASS"
else CLASS=$(classify_path "$FILE_PATH"); fi
GRANULARITY=$(detect_granularity "$CLASS")
OPERATION=$(detect_operation "$FILE_PATH")
if [[ "$FILE_PATH" == .hivemind/* ]]; then RULE=".hivemind/**"
elif [[ "$FILE_PATH" == dist/* ]]; then RULE="dist/**"
elif [[ "$FILE_PATH" == .opencode/* ]]; then RULE=".opencode/**"
elif [[ "$FILE_PATH" == docs/generated/* ]]; then RULE="docs/generated/**"
elif [[ "$FILE_PATH" == src/* ]]; then RULE="src/**"
elif [[ "$FILE_PATH" == tests/* ]]; then RULE="tests/**"
elif [[ "$FILE_PATH" == docs/* ]]; then RULE="docs/**"
else RULE="default"; fi
OV="null"; [[ -n "$OVERRIDE_CLASS" ]] && OV="\"${OVERRIDE_CLASS}\""
echo "{\"file\":\"${FILE_PATH}\",\"class\":\"${CLASS}\",\"operation\":\"${OPERATION}\",\"granularity\":\"${GRANULARITY}\",\"rule_matched\":\"${RULE}\",\"override\":${OV}}"

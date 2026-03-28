#!/usr/bin/env bash
# hm-git-gate.sh — Pre-commit gate checks → JSON gate result to stdout
set -uo pipefail

PROJECT_ROOT=""
ACTIVITY_CLASS="code"
GATE_ID="gate_$(date +%s)"

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cwd) PROJECT_ROOT="$2"; shift 2 ;;
      --class) ACTIVITY_CLASS="$2"; shift 2 ;;
      --help) echo "Usage: hm-git-gate.sh [--cwd DIR] [--class CLASS]"; exit 0 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done
  PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
}

ts_now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

check_branch() {
  local b; b=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "UNKNOWN")
  if [[ "$b" == "HEAD" ]]; then echo "{\"name\":\"branch\",\"passed\":false,\"detail\":\"detached HEAD\"}"
  elif [[ "$b" == "main" || "$b" == "master" ]]; then echo "{\"name\":\"branch\",\"passed\":false,\"detail\":\"direct commit to ${b} blocked\"}"
  else echo "{\"name\":\"branch\",\"passed\":true,\"detail\":\"${b}\"}"; fi
}

check_worktree() {
  local gd; gd=$(git -C "$PROJECT_ROOT" rev-parse --git-dir 2>/dev/null || echo "")
  if [[ "$gd" == *".git/worktrees/"* ]]; then echo "{\"name\":\"worktree\",\"passed\":true,\"detail\":\"linked worktree\"}"
  else echo "{\"name\":\"worktree\",\"passed\":true,\"detail\":\"not a linked worktree — single-branch workflow\"}"; fi
}

check_clean_tree() {
  local s u; s=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
  u=$(git -C "$PROJECT_ROOT" diff --name-only 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$u" -gt 0 ]]; then echo "{\"name\":\"clean_tree\",\"passed\":false,\"detail\":\"${u} unstaged changes present\"}"
  elif [[ "$s" -eq 0 ]]; then echo "{\"name\":\"clean_tree\",\"passed\":false,\"detail\":\"no staged files\"}"
  else echo "{\"name\":\"clean_tree\",\"passed\":true,\"detail\":\"${s} staged files\"}"; fi
}

check_branch_appropriateness() {
  local b prefix; b=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  prefix="${b%%/*}"; local ok="true" d=""
  case "$prefix" in
    feature|feat) [[ "$ACTIVITY_CLASS" == "artifact" ]] && { ok="false"; d="feature branch does not allow artifact"; } || d="feature branch allows ${ACTIVITY_CLASS}" ;;
    docs|documentation) [[ "$ACTIVITY_CLASS" != "artifact" ]] && { ok="false"; d="docs branch only allows artifact"; } || d="docs branch allows artifact" ;;
    fix|bugfix) [[ "$ACTIVITY_CLASS" != "code" && "$ACTIVITY_CLASS" != "meta" ]] && { ok="false"; d="fix branch only allows code/meta"; } || d="fix branch allows ${ACTIVITY_CLASS}" ;;
    chore|refactor|release) d="${prefix} branch allows ${ACTIVITY_CLASS}" ;;
    *) d="unrecognized branch prefix '${prefix}' — warning only" ;;
  esac
  echo "{\"name\":\"branch_appropriateness\",\"passed\":${ok},\"detail\":\"${d}\"}"
}

check_secrets() {
  local m; m=$(git -C "$PROJECT_ROOT" diff --cached 2>/dev/null | grep -iE "(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9+/]{20,}" | head -5 || true)
  if [[ -n "$m" ]]; then
    local af="${PROJECT_ROOT}/.hivemind-secret-allow"
    if [[ -f "$af" ]]; then
      local am; am=$(echo "$m" | while IFS= read -r l; do while IFS= read -r p; do [[ -z "$p" || "$p" == \#* ]] && continue; echo "$l" | grep -qE "$p" && { echo "allowed"; break; }; done < "$af"; done | head -1 || true)
      if [[ "$am" == "allowed" ]]; then echo "{\"name\":\"secrets\",\"passed\":true,\"detail\":\"secret patterns found but allowed by .hivemind-secret-allow\"}"; return; fi
    fi
    local fh; fh=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null | head -1 || echo "unknown")
    echo "{\"name\":\"secrets\",\"passed\":false,\"detail\":\"secret pattern detected in staged diff (e.g., ${fh})\"}"
  else echo "{\"name\":\"secrets\",\"passed\":true,\"detail\":\"no secret patterns detected\"}"; fi
}

check_conflicts() {
  local c; c=$(git -C "$PROJECT_ROOT" diff --cached 2>/dev/null | grep -cE "^(<{7}|={7}|>{7})" 2>/dev/null || true)
  c="${c:-0}"
  if [[ "$c" -gt 0 ]]; then echo "{\"name\":\"conflicts\",\"passed\":false,\"detail\":\"${c} conflict markers found in staged files\"}"
  else echo "{\"name\":\"conflicts\",\"passed\":true,\"detail\":\"0 conflict markers\"}"; fi
}

parse_args "$@"
CB=$(check_branch); CW=$(check_worktree); CC=$(check_clean_tree)
CA=$(check_branch_appropriateness); CS=$(check_secrets); CX=$(check_conflicts)
PASSED="true"; REASONS=""
for cj in "$CB" "$CW" "$CC" "$CA" "$CS" "$CX"; do
  if ! echo "$cj" | grep -q '"passed":true'; then
    PASSED="false"; d="" n=""
    d=$(echo "$cj" | grep -o '"detail":"[^"]*"' | head -1 | sed 's/"detail":"//;s/"$//')
    n=$(echo "$cj" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')
    [[ -n "$REASONS" ]] && REASONS="${REASONS},"
    REASONS="${REASONS}\"Gate check '${n}' failed: ${d}\""
  fi
done
echo "{\"gate_id\":\"${GATE_ID}\",\"timestamp\":\"$(ts_now)\",\"passed\":${PASSED},\"checks\":[${CB},${CW},${CC},${CA},${CS},${CX}],\"blocked_reasons\":[${REASONS}]}"

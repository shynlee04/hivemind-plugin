#!/usr/bin/env bash
# gx-entry-guard.sh — Session entry: build runtime profile, verify policy, lock state
#
# CHAIN: Session Entry (Chain 1) — Step 1
# TRIGGER: Command invocation (!`cmd` pre-prompt injection)
# OUTPUT: .hivemind/state/runtime-profile.json
#
# Algorithm:
#   1. CLASSIFY INTENT (reuse classify-intent.sh if available, else basic)
#   2. RESOLVE ROLE ENVELOPE (intent → primary/secondary/monitor mapping)
#   3. COMPUTE CAPABILITIES (from delegation topology)
#   4. BUILD PROFILE ID (deterministic hash)
#   5. PERSIST + validate
#   6. LOCK STATE (mark profile active)
#
# Determinism: identical inputs → identical profile ID (sha256 of intent+scope+policy)

set -euo pipefail

WORKDIR="${1:-.}"
INTENT_HINT="${2:-}"
POLICY_VERSION="gx-pack-v1"

STATE_DIR="$WORKDIR/.hivemind/state"
PROFILE_FILE="$STATE_DIR/runtime-profile.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"
TODO_FILE="$STATE_DIR/todo.json"

# Ensure state directory exists
mkdir -p "$STATE_DIR"

# ── Step 1: CLASSIFY INTENT ──

classify_intent() {
  local hint="$1"

  # If hint provided, use it directly
  if [ -n "$hint" ]; then
    case "$hint" in
      build_new|fix_broken|audit_health|extend|improve)
        echo "$hint"
        return
        ;;
    esac
  fi

  # Try to use classify-intent.sh from hivefiver-mode
  local classifier="$WORKDIR/.opencode/skills/hivefiver-mode/scripts/classify-intent.sh"
  if [ -x "$classifier" ] && [ -n "$hint" ]; then
    local result
    result=$(bash "$classifier" "$hint" 2>/dev/null || echo '{"intent":"build_new"}')
    echo "$result" | jq -r '.intent // "build_new"' 2>/dev/null || echo "build_new"
    return
  fi

  # Default
  echo "build_new"
}

INTENT=$(classify_intent "$INTENT_HINT")

# ── Step 2: RESOLVE ROLE ENVELOPE ──

resolve_envelope() {
  local intent="$1"
  case "$intent" in
    build_new)
      echo '{"primary":{"agent":"hiveminder","level":2},"secondary":{"agent":"hivemaker","level":3},"monitor":{"agent":"hiveq","level":3}}'
      ;;
    fix_broken)
      echo '{"primary":{"agent":"hiveminder","level":2},"secondary":{"agent":"hivehealer","level":3},"monitor":{"agent":"hiveq","level":3}}'
      ;;
    audit_health)
      echo '{"primary":{"agent":"hiveq","level":2},"secondary":{"agent":"hivexplorer","level":3},"monitor":{"agent":"hiveminder","level":3}}'
      ;;
    extend|improve)
      echo '{"primary":{"agent":"hiveminder","level":2},"secondary":{"agent":"hivemaker","level":3},"monitor":{"agent":"hiveq","level":3}}'
      ;;
    *)
      echo '{"primary":{"agent":"hiveminder","level":2},"secondary":{"agent":"hivexplorer","level":3},"monitor":{"agent":"hiveq","level":3}}'
      ;;
  esac
}

ENVELOPE=$(resolve_envelope "$INTENT")

# ── Step 3: COMPUTE CAPABILITIES ──

compute_capabilities() {
  local intent="$1"
  local envelope="$2"
  local secondary
  secondary=$(echo "$envelope" | jq -r '.secondary.agent')
  local depth_limit
  depth_limit=$(echo "$envelope" | jq -r '.primary.level + 1')

  # Base tools available to all
  local tools='["read","glob","grep","task","skill","hiveops_todo","hiveops_gate","hiveops_sot","hiveops_export"]'

  # Scope based on intent
  local paths
  case "$intent" in
    audit_health)
      paths='[".opencode/**",".hivemind/**","docs/**"]'
      ;;
    *)
      paths='[".opencode/**",".hivemind/**","docs/**"]'
      ;;
  esac

  # Delegate list from secondary + monitor + hivexplorer
  local delegates
  delegates=$(echo "$envelope" | jq -c '[.secondary.agent, .monitor.agent, "hivexplorer"] | unique')

  jq -n \
    --argjson tools "$tools" \
    --argjson paths "$paths" \
    --argjson depth_limit "$depth_limit" \
    --argjson delegates "$delegates" \
    '{tools: $tools, paths: $paths, depth_limit: $depth_limit, delegate_to: $delegates}'
}

CAPABILITIES=$(compute_capabilities "$INTENT" "$ENVELOPE")

# ── Step 4: BUILD PROFILE ID (deterministic) ──

build_profile_id() {
  local intent="$1"
  local scope="$2"
  local policy="$3"
  local input="${intent}:${scope}:${policy}"

  if command -v sha256sum >/dev/null 2>&1; then
    echo "gx-profile-$(echo -n "$input" | sha256sum | head -c 12)"
  elif command -v shasum >/dev/null 2>&1; then
    echo "gx-profile-$(echo -n "$input" | shasum -a 256 | head -c 12)"
  else
    # Fallback: use md5
    echo "gx-profile-$(echo -n "$input" | md5 | head -c 12)"
  fi
}

SCOPE=$(echo "$CAPABILITIES" | jq -r '.paths | join(",")')
PROFILE_ID=$(build_profile_id "$INTENT" "$SCOPE" "$POLICY_VERSION")

# ── Step 5: CHECK EXISTING PROFILE ──

if [ -f "$PROFILE_FILE" ]; then
  EXISTING_ID=$(jq -r '.id // ""' "$PROFILE_FILE" 2>/dev/null || echo "")
  EXISTING_TTL=$(jq -r '.ttl // 0' "$PROFILE_FILE" 2>/dev/null || echo "0")
  EXISTING_CREATED=$(jq -r '.created_epoch // 0' "$PROFILE_FILE" 2>/dev/null || echo "0")
  NOW=$(date +%s)
  ELAPSED=$(( NOW - EXISTING_CREATED ))
  TTL_SECONDS=$(( EXISTING_TTL / 1000 ))

  if [ "$EXISTING_ID" = "$PROFILE_ID" ] && [ "$ELAPSED" -lt "$TTL_SECONDS" ]; then
    # Profile still valid
    echo "{\"status\":\"cached\",\"profile_id\":\"$PROFILE_ID\",\"ttl_remaining\":$(( TTL_SECONDS - ELAPSED ))}"
    exit 0
  fi
fi

# ── Step 6: BUILD CONSTRAINTS ──

build_constraints() {
  local intent="$1"
  local constraints='[]'

  # Universal constraints
  constraints=$(echo "$constraints" | jq '. + [
    "L3 agents cannot execute critical-path edits without delegation packet",
    "Monitor must verify before stage promotion",
    "All delegation packets must include profile_id"
  ]')

  # Intent-specific constraints
  case "$intent" in
    build_new)
      constraints=$(echo "$constraints" | jq '. + ["New assets must have contract compliance before write"]')
      ;;
    fix_broken)
      constraints=$(echo "$constraints" | jq '. + ["Fixes must not introduce new anti-patterns","Root cause must be identified before applying fix"]')
      ;;
    audit_health)
      constraints=$(echo "$constraints" | jq '. + ["Audit is read-only — no modifications allowed","Findings must be severity-ranked"]')
      ;;
  esac

  echo "$constraints"
}

CONSTRAINTS=$(build_constraints "$INTENT")

# ── Step 7: PERSIST PROFILE ──

NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NOW_EPOCH=$(date +%s)

jq -n \
  --arg id "$PROFILE_ID" \
  --arg created "$NOW_ISO" \
  --argjson created_epoch "$NOW_EPOCH" \
  --argjson ttl 3600000 \
  --arg intent "$INTENT" \
  --arg policy_version "$POLICY_VERSION" \
  --argjson role_envelope "$ENVELOPE" \
  --argjson capabilities "$CAPABILITIES" \
  --argjson constraints "$CONSTRAINTS" \
  '{
    id: $id,
    created: $created,
    created_epoch: $created_epoch,
    ttl: $ttl,
    intent: $intent,
    policy_version: $policy_version,
    role_envelope: $role_envelope,
    capabilities: $capabilities,
    constraints: $constraints
  }' > "$PROFILE_FILE"

# ── Step 8: LOCK STATE ──

# Update enforcement state with profile reference
if [ -f "$ENFORCEMENT_FILE" ]; then
  TMP_FILE=$(mktemp)
  jq --arg profile_id "$PROFILE_ID" \
     --arg intent "$INTENT" \
     '. + {active_profile: $profile_id, active_intent: $intent}' \
     "$ENFORCEMENT_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$ENFORCEMENT_FILE"
fi

# ── OUTPUT ──

echo "{\"status\":\"created\",\"profile_id\":\"$PROFILE_ID\",\"intent\":\"$INTENT\",\"policy\":\"$POLICY_VERSION\",\"ttl\":3600}"

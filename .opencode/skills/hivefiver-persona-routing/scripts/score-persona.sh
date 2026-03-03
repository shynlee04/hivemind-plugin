#!/usr/bin/env bash
set -euo pipefail

json_mode=0
if [[ "${1:-}" == "--json" ]]; then
  json_mode=1
  shift
fi

input="${1:-}"
if [[ -z "$input" ]]; then
  echo "usage: score-persona.sh [--json] \"user text\"" >&2
  exit 1
fi

lower="$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]')"
score_enterprise=0
score_vibe=0

domain="hybrid"
if [[ "$lower" == *"marketing"* || "$lower" == *"campaign"* || "$lower" == *"seo"* ]]; then
  domain="marketing"
elif [[ "$lower" == *"finance"* || "$lower" == *"budget"* || "$lower" == *"forecast"* ]]; then
  domain="finance"
elif [[ "$lower" == *"office"* || "$lower" == *"sop"* || "$lower" == *"document"* ]]; then
  domain="office-ops"
elif [[ "$lower" == *"api"* || "$lower" == *"backend"* || "$lower" == *"frontend"* || "$lower" == *"saas"* ]]; then
  domain="dev"
fi

for token in compliance corporate enterprise scale dependency architecture governance audit; do
  [[ "$lower" == *"$token"* ]] && score_enterprise=$((score_enterprise + 1))
done
for token in app idea quickly beginner no-code vibe tutorial simple; do
  [[ "$lower" == *"$token"* ]] && score_vibe=$((score_vibe + 1))
done

if (( score_enterprise >= score_vibe )); then
  lane="enterprise"
else
  lane="vibecoder"
fi

if (( json_mode == 1 )); then
  printf '{"lane":"%s","domain":"%s"}\n' "$lane" "$domain"
else
  echo "$lane"
fi

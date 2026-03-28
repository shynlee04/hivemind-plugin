#!/usr/bin/env bash
set -euo pipefail

input_file="${1:-}"
if [[ -z "$input_file" || ! -f "$input_file" ]]; then
  echo "usage: extract-requirements.sh <raw-text-file>" >&2
  exit 1
fi

mapfile -t lines < <(awk 'NF { print }' "$input_file")

echo "# Distilled Requirement Atoms"
echo

echo "## Functional"
for line in "${lines[@]}"; do
  lower="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
  if [[ "$lower" == *"feature"* || "$lower" == *"workflow"* || "$lower" == *"user"* || "$lower" == *"screen"* || "$lower" == *"api"* ]]; then
    echo "- $line"
  fi
done

echo
echo "## Non-Functional"
for line in "${lines[@]}"; do
  lower="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
  if [[ "$lower" == *"performance"* || "$lower" == *"scale"* || "$lower" == *"reliability"* || "$lower" == *"latency"* || "$lower" == *"availability"* ]]; then
    echo "- $line"
  fi
done

echo
echo "## Integration and Dependencies"
for line in "${lines[@]}"; do
  lower="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
  if [[ "$lower" == *"integrat"* || "$lower" == *"dependenc"* || "$lower" == *"sdk"* || "$lower" == *"mcp"* || "$lower" == *"third-party"* ]]; then
    echo "- $line"
  fi
done

echo
echo "## Risk and Compliance"
for line in "${lines[@]}"; do
  lower="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
  if [[ "$lower" == *"risk"* || "$lower" == *"compliance"* || "$lower" == *"audit"* || "$lower" == *"security"* || "$lower" == *"policy"* ]]; then
    echo "- $line"
  fi
done

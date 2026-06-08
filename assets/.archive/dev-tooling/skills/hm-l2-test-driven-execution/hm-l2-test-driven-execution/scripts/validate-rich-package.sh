#!/usr/bin/env bash
set -euo pipefail

# Validates that the hm-test-driven-execution package contains the Phase 27 RICH evidence resources.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
required=(
  "SKILL.md"
  "references/source-synthesis.md"
  "references/red-green-refactor.md"
  "references/coverage-verification.md"
  "templates/test-case-template.md"
  "workflows/tdd-session-workflow.md"
  "metrics/rich-eval-rubric.json"
  "evals/evals.json"
)

for rel in "${required[@]}"; do
  if [[ ! -s "${ROOT}/${rel}" ]]; then
    echo "FAIL: missing or empty ${rel}" >&2
    exit 1
  fi
done

for needle in \
  "addyosmani/agent-skills@test-driven-development" \
  "helderberto/skills@tdd" \
  "jellydn/my-ai-tools@tdd" \
  "one-test-at-a-time" \
  "GSD" \
  "Spec-kit"; do
  if ! grep -R --fixed-strings --quiet "$needle" "${ROOT}/SKILL.md" "${ROOT}/references/source-synthesis.md" "${ROOT}/references/red-green-refactor.md"; then
    echo "FAIL: expected provenance, discipline, or independence marker not found: ${needle}" >&2
    exit 1
  fi
done

if grep -R --fixed-strings --quiet "/Users/apple" "${ROOT}/SKILL.md" "${ROOT}/references" "${ROOT}/templates" "${ROOT}/workflows" "${ROOT}/metrics"; then
  echo "FAIL: local absolute path leaked into portable skill resources" >&2
  exit 1
fi

echo "PASS: hm-test-driven-execution RICH package resources validated"

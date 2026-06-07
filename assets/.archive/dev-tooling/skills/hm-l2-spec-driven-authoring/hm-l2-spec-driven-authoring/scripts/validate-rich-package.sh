#!/usr/bin/env bash
set -euo pipefail

# Validates that the hm-spec-driven-authoring package contains the Phase 27 RICH evidence resources.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
required=(
  "SKILL.md"
  "references/source-synthesis.md"
  "references/spec-to-req-mapping.md"
  "references/acceptance-test-patterns.md"
  "templates/requirement-traceability-matrix.md"
  "workflows/spec-lock-workflow.md"
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
  "addyosmani/agent-skills@spec-driven-development" \
  "proffesor-for-testing/agentic-qe@qe-requirements-validation" \
  "kw12121212/auto-spec-driven@spec-driven-sync-specs" \
  "GSD" \
  "Spec-kit"; do
  if ! grep -R --fixed-strings --quiet "$needle" "${ROOT}/SKILL.md" "${ROOT}/references/source-synthesis.md"; then
    echo "FAIL: expected provenance or independence marker not found: ${needle}" >&2
    exit 1
  fi
done

if grep -R --fixed-strings --quiet "/Users/apple" "${ROOT}/SKILL.md" "${ROOT}/references" "${ROOT}/templates" "${ROOT}/workflows" "${ROOT}/metrics"; then
  echo "FAIL: local absolute path leaked into portable skill resources" >&2
  exit 1
fi

echo "PASS: hm-spec-driven-authoring RICH package resources validated"

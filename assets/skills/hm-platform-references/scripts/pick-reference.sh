#!/usr/bin/env bash
# pick-reference.sh
# Given a question, suggest which of the 15 platform reference skills to load.
# Usage: ./pick-reference.sh "<question>"
set -euo pipefail

QUESTION="${1:-}"

if [[ -z "$QUESTION" ]]; then
  echo "Usage: $0 '<question>'" >&2
  exit 64
fi

# Simple keyword match (no LLM, but covers the most common cases)
case "$(echo "$QUESTION" | tr '[:upper:]' '[:lower:]')" in
  *research*|*investigate*|*deep-dive*) echo "hm-research-deep" ;;
  *codebase*|*scan*|*scout*) echo "hm-detective" ;;
  *engine*|*plugin*|*sdk*|*harness*|*internal*) echo "hm-engine-contracts" ;;
  *state*|*hivemind/state*|*session*) echo "hm-state-reference" ;;
  *binding*|*registry*|*which-agent*|*which-skill*) echo "hm-integration-contracts" ;;
  *oh-my-openagent*|*omo*|*reference-impl*) echo "hm-omo-reference" ;;
  *opencode*sdk*|*@opencode-ai*) echo "hm-platform-opencode" ;;
  *audit*|*boundary*|*project*|*check*) echo "hm-project-audit" ;;
  *chain*|*orchestrate-research*) echo "hm-research-chain" ;;
  *delegate*|*subagent*|*dispatch*) echo "hm-subagent-patterns" ;;
  *compress*|*synthesize*|*summary*) echo "hm-synthesis" ;;
  *compatible*|*tech-stack*|*library-version*) echo "hm-tech-compliance" ;;
  *ingest*|*third-party*|*sdk-docs*) echo "hm-tech-ingest" ;;
  *tool*|*capability*|*which-tools*) echo "hm-tooling-capability" ;;
  *shell*|*non-interactive*|*ci=true*) echo "hm-non-interactive-shell" ;;
  *) echo "AMBIGUOUS: use templates/reference-load-card.md to manually pick" ;;
esac

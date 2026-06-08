# Workflow: Command Creation

> **Loading trigger:** When routing to command creation.

## 5-Step Procedural

1. **Classify intent** — what action should this command trigger?
2. **Define arguments** — what `$ARGUMENTS` does it accept?
3. **Bind agent** — which agent executes this command?
4. **Shell safety** — enforce CI=true, set -euo pipefail, ban TTY commands
5. **Validate** — check frontmatter, test execution, verify non-interactive safety

## Delegation
Route to: `hf-command-dev` → Hivemind command-builder specialist

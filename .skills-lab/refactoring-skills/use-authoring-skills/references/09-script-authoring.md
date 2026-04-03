# Script Authoring

## When to Bundle Scripts vs Inline Instructions

### Use Inline Instructions When

- The task is a single command or two
- The command is well-known and stable (e.g., `git status`, `npm test`)
- The command has few flags and is hard to get wrong

### Bundle Scripts When

- The command is complex enough to be hard to get right on the first try
- Multiple steps must execute in order
- Error handling is non-trivial
- The logic needs to be tested and versioned independently
- Output must be structured (JSON, CSV) for downstream consumption

**Rule of thumb:** If a command has more than 3 flags, or requires conditional logic, or needs error recovery — bundle it as a script.

## Script Types

| Type | Purpose | Characteristics |
|------|---------|-----------------|
| **Validation** | Check requirements before proceeding | Exit 0 on success, non-zero on failure. No side effects. |
| **Initialization** | Set up environment or workspace | Idempotent. Safe to run multiple times. |
| **Testing** | Run evals, check triggers, validate outputs | Structured output (JSON preferred). |
| **Cleanup** | Restore state after execution | Always safe to run. Never delete user data. |

## Universal Bash Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail
readonly SCRIPT_NAME="$(basename "$0")"
readonly SKILL_DIR="${1:?Usage: $SCRIPT_NAME <skill-directory>}"

errors=0
fail() { echo "Error: $1" >&2; errors=$((errors + 1)); }

# Validation logic here
[[ -f "$SKILL_DIR/SKILL.md" ]] || { fail "SKILL.md not found"; }

if [[ $errors -gt 0 ]]; then
  echo "Validation failed: $errors error(s)" >&2
  exit 1
fi
echo "Validation passed"
exit 0
```

## Key Patterns

| Pattern | Purpose |
|---------|---------|
| `set -euo pipefail` | Fail fast on errors, unset vars, pipe failures |
| `readonly VAR="${1:?msg}"` | Required argument with usage message |
| `echo "Error: ..." >&2` | Error messages to stderr |
| `exit N` | Distinct exit codes for failure types |
| `trap 'cleanup' EXIT` | Guaranteed cleanup on exit |

## Structured Output Pattern

```bash
output_result() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }
output_result "pass" "All checks passed"
```

## When to Use Python vs Shell

| Use Shell | Use Python |
|-----------|-----------|
| File operations, grep, find | YAML/JSON parsing |
| Simple validation checks | Complex logic, data transformation |
| Platform-native commands | Cross-platform portability needed |
| Quick one-liners | Structured output generation |

## Cross-Platform Portability

| Rule | Reason |
|------|--------|
| Use `#!/usr/bin/env bash` not `#!/bin/bash` | bash may not be at `/bin/bash` on all systems |
| Quote all variables | Prevents word splitting on paths with spaces |
| Avoid GNU-specific flags | `grep -P` works on Linux but not macOS |
| Use `printf` not `echo -e` | `echo` behavior varies across shells |

## Testing Scripts

```bash
# Valid input — expect exit 0
bash scripts/validate-skill.sh /path/to/valid-skill

# Invalid input — expect non-zero exit
bash scripts/validate-skill.sh /path/to/nonexistent

# Missing arguments — expect usage message on stderr
bash scripts/validate-skill.sh 2>&1 | grep -q "Usage:"

# Idempotency — run twice, both should succeed
bash scripts/init-session.sh /tmp/test-workspace
bash scripts/init-session.sh /tmp/test-workspace
```

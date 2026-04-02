# Script Authoring for Skills

## Table of Contents

- [Purpose](#purpose)
- [When to Bundle Scripts vs Inline Instructions](#when-to-bundle-scripts-vs-inline-instructions)
- [Script Types and Their Roles](#script-types-and-their-roles)
- [Shell Script Patterns](#shell-script-patterns)
- [Python Script Patterns](#python-script-patterns)
- [Script Discoverability and Execution](#script-discoverability-and-execution)
- [Ralph-Loop Pattern Integration](#ralph-loop-pattern-integration)
- [Script Testing Methodology](#script-testing-methodology)
- [Good vs Bad Script Examples](#good-vs-bad-script-examples)
- [Cross-Platform Script Considerations](#cross-platform-script-considerations)
- [References](#references)

---

## Purpose

How to write, bundle, and test executable scripts for skill packs. Scripts turn skill instructions into reliable, repeatable automation. This file covers when to use scripts, how to design them for Agent execution, and how to integrate them into the ralph-loop validation pattern.

See [01-skill-anatomy.md](01-skill-anatomy.md) for directory structure and [06-cross-platform-activation.md](06-cross-platform-activation.md) for platform-specific execution differences.

---

## When to Bundle Scripts vs Inline Instructions

### Use Inline Instructions When

- The task is a single command or two
- The command is well-known and stable (e.g., `git status`, `npm test`)
- The command has few flags and is hard to get wrong
- The ecosystem provides reliable one-liners (`npx`, `uvx`, `pipx run`)

```markdown
## Workflow

1. Run the test suite:
   ```bash
   npm test -- --coverage
   ```
```

### Bundle Scripts When

- The command is complex enough to be hard to get right on the first try
- Multiple steps must execute in order
- Error handling is non-trivial
- The logic needs to be tested and versioned independently
- The same logic is reused across multiple skill workflows
- Output must be structured (JSON, CSV) for downstream consumption

**Rule of thumb:** If a command has more than 3 flags, or requires conditional logic, or needs error recovery — bundle it as a script.

---

## Script Types and Their Roles

### Validation Scripts

Check that something meets requirements before proceeding.

```
scripts/validate-skill.sh     # Validates skill pack structure
scripts/check-frontmatter.sh  # Validates frontmatter fields
```

**Characteristics:**
- Exit 0 on success, non-zero on failure
- Print specific error messages to stderr
- No side effects (read-only checks)

### Initialization Scripts

Set up the environment or workspace before skill execution.

```
scripts/init-session.sh       # Creates workspace directories
scripts/install-deps.sh       # Installs required dependencies
```

**Characteristics:**
- Idempotent — safe to run multiple times
- Create directories, files, or install dependencies
- Print progress to stderr, results to stdout

### Testing Scripts

Run evals, check triggers, or validate outputs.

```
scripts/test-triggers.sh      # Tests skill description triggering
scripts/run-evals.sh          # Executes eval test cases
scripts/check-complete.sh     # Ralph-loop completion gate
```

**Characteristics:**
- Produce structured output (JSON preferred)
- Include timing and token data when available
- Separate diagnostics (stderr) from results (stdout)

### Cleanup Scripts

Restore state after skill execution or failed runs.

```
scripts/cleanup.sh            # Removes temporary files
scripts/reset-workspace.sh    # Restores workspace to clean state
```

**Characteristics:**
- Always safe to run (no-op if nothing to clean)
- Never delete user data
- Print what was cleaned to stderr

---

## Shell Script Patterns

### Universal Bash Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail
readonly SCRIPT_NAME="$(basename "$0")"
readonly SKILL_DIR="${1:?Usage: $SCRIPT_NAME <skill-directory>}"

validate_skill() {
  local dir="$1"
  local errors=0
  [[ -f "$dir/SKILL.md" ]] || { echo "Error: SKILL.md not found" >&2; return 1; }
  head -1 "$dir/SKILL.md" | grep -q '^---$' || { echo "Error: Missing frontmatter" >&2; errors=$((errors+1)); }
  return $errors
}

if ! validate_skill "$SKILL_DIR"; then echo "Validation failed" >&2; exit 1; fi
echo "Validation passed"; exit 0
```

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| `set -euo pipefail` | Fail fast on errors, unset vars, pipe failures |
| `readonly VAR="${1:?msg}"` | Required argument with usage message |
| `echo "Error: ..." >&2` | Error messages to stderr |
| `exit N` | Distinct exit codes for failure types |
| `trap 'cleanup' EXIT` | Guaranteed cleanup on exit |

### Structured Output Pattern

```bash
output_result() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }
output_result "pass" "All checks passed"
```

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| `set -euo pipefail` | Fail fast on errors, unset vars, pipe failures |
| `readonly VAR="${1:?msg}"` | Required argument with usage message |
| `echo "Error: ..." >&2` | Error messages to stderr |
| `exit N` | Distinct exit codes for failure types |
| `trap 'cleanup' EXIT` | Guaranteed cleanup on exit |

### Structured Output Pattern

```bash
output_result() { printf '{"status":"%s","message":"%s"}\n' "$1" "$2"; }
output_result "pass" "All checks passed"
```

### Key Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `set -euo pipefail` | Fail fast on errors, unset vars, pipe failures | Always at top |
| `readonly VAR="${1:?msg}"` | Required argument with usage message | Input validation |
| `echo "Error: ..." >&2` | Error messages to stderr | Agent-readable errors |
| `exit N` | Distinct exit codes for failure types | 0=ok, 1=invalid, 2=missing |
| `trap 'cleanup' EXIT` | Guaranteed cleanup on exit | Temp file removal |

### Structured Output Pattern

```bash
output_result() {
  printf '{"status":"%s","message":"%s"}\n' "$1" "$2"
}
output_result "pass" "All checks passed"
```

---

## Python Script Patterns

Use PEP 723 inline metadata for self-contained scripts with dependencies. Run with `uv run scripts/script.py`:

```python
#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6.0"]
# ///
import sys, yaml
from pathlib import Path

def validate_skill(skill_dir: Path) -> list[str]:
    errors = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        errors.append(f"SKILL.md not found in {skill_dir}")
        return errors
    content = skill_md.read_text()
    if not content.startswith("---"):
        errors.append("Missing YAML frontmatter delimiter")
        return errors
    parts = content.split("---", 2)
    if len(parts) < 3:
        errors.append("Incomplete frontmatter")
        return errors
    try:
        fm = yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        errors.append(f"Invalid YAML: {e}")
        return errors
    if "name" not in fm: errors.append("Missing required field: name")
    if "description" not in fm: errors.append("Missing required field: description")
    return errors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: validate-skill.py <skill-directory>", file=sys.stderr)
        sys.exit(1)
    errors = validate_skill(Path(sys.argv[1]))
    if errors:
        for e in errors: print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    print("Validation passed")
```

### When to Use Python vs Shell

| Use Shell | Use Python |
|-----------|-----------|
| File operations, grep, find | YAML/JSON parsing |
| Simple validation checks | Complex logic, data transformation |
| Platform-native commands | Cross-platform portability needed |
| Quick one-liners | Structured output generation |
| Git operations | API calls, network requests |

---

## Script Discoverability and Execution

Always document available scripts in `SKILL.md` so the Agent knows they exist. Use relative paths from the skill directory root:

```markdown
## Available Scripts
- **`scripts/validate-skill.sh`** — Validates skill pack structure
- **`scripts/check-overlaps.sh`** — Checks content duplication
```

The Agent resolves paths relative to the **skill directory root**, not the current working directory.

---

## Ralph-Loop Pattern Integration

The ralph-loop pattern runs a task repeatedly until all acceptance criteria pass. Scripts are the enforcement mechanism.

### check-complete.sh — Completion Gate

```bash
#!/usr/bin/env bash
set -euo pipefail
readonly SKILL_DIR="${1:?Usage: $0 <skill-directory>}"
failures=0
[[ -f "$SKILL_DIR/SKILL.md" ]] || { echo "FAIL: SKILL.md missing" >&2; failures=$((failures+1)); }
grep -ri "CLAUDE\.md" "$SKILL_DIR" --include="*.md" >/dev/null 2>&1 && { echo "FAIL: Banned term found" >&2; failures=$((failures+1)); }
[[ $failures -eq 0 ]] && echo '{"status":"complete"}' && exit 0
echo '{"status":"incomplete"}' && exit 1
```

### init-session.sh — Workspace Setup

```bash
#!/usr/bin/env bash
set -euo pipefail
readonly WORKSPACE="${1:?Usage: $0 <workspace-directory>}"
mkdir -p "$WORKSPACE"/{iterations,evals,outputs}
```

### Loop Structure

```bash
MAX_ITERATIONS=10
for i in $(seq 1 $MAX_ITERATIONS); do
  run_task "$@"
  if bash scripts/check-complete.sh "$SKILL_DIR"; then
    echo "Passed after $i iterations" >&2; exit 0
  fi
done
echo "Exceeded max iterations" >&2; exit 1
```

### init-session.sh — Workspace Setup

```bash
#!/usr/bin/env bash
set -euo pipefail
readonly WORKSPACE="${1:?Usage: $0 <workspace-directory>}"
mkdir -p "$WORKSPACE"/{iterations,evals,outputs}
```

### Loop Structure

```bash
MAX_ITERATIONS=10
for i in $(seq 1 $MAX_ITERATIONS); do
  run_task "$@"
  if bash scripts/check-complete.sh "$SKILL_DIR"; then
    echo "Passed after $i iterations" >&2; exit 0
  fi
done
echo "Exceeded max iterations" >&2; exit 1
```

---

## Script Testing Methodology

Test each script independently with valid input, invalid input, and missing arguments. Verify exit codes match expectations. Test idempotency by running twice — second run should not fail. Verify error messages are actionable (contain "Error:" prefix and usage hints).

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

---

## Good vs Bad Script Examples

See `scripts/validate-skill.sh` for a complete, well-structured validation script. Key qualities: argument validation with usage messages, specific error messages to stderr, distinct exit codes, no side effects, and structured output.

Avoid: unquoted variables, no error handling, no exit codes, no usage documentation, and unstructured output.

---

## Cross-Platform Script Considerations

### Portability Rules

| Rule | Reason |
|------|--------|
| Use `#!/usr/bin/env bash` not `#!/bin/bash` | bash may not be at `/bin/bash` on all systems |
| Quote all variables | Prevents word splitting on paths with spaces |
| Avoid GNU-specific flags | `grep -P` works on Linux but not macOS |
| Use `printf` not `echo -e` | `echo` behavior varies across shells |

### Platform-Specific Execution

| Platform | Script Support | Notes |
|----------|---------------|-------|
| **OpenCode** | Full shell access | All scripts work |
| **Claude Code** | Full shell access | All scripts work |
| **Codex** | Sandboxed | May block writes outside workspace |
| **Cursor** | Full shell access | All scripts work |

### Dependency Management

For scripts with external dependencies, use self-contained patterns: Python with PEP 723 (`uv run`), Node.js with `npx package@version`, Go with `go run package@version`, or pure bash with no external dependencies. Document prerequisites in `SKILL.md`.

---

## References

- [01-skill-anatomy.md](01-skill-anatomy.md) — Directory structure including `scripts/`
- [06-cross-platform-activation.md](06-cross-platform-activation.md) — Platform execution differences
- [10-eval-lifecycle.md](10-eval-lifecycle.md) — How scripts integrate with eval runs
- [12-anti-deception.md](12-anti-deception.md) — Validation scripts for gatekeeping
- Agent Skills spec — https://agentskills.io/using-scripts

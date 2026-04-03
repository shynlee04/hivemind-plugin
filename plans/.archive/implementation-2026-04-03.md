# Meta-Builder Ecosystem — Complete Implementation

## Goal

Build the complete specialist skill ecosystem for HiveMind V3 by fixing 3 routing bugs, creating 11 new specialist skills, expanding meta-builder routing, adding migration workflow, chain tests, and ralph-loop recipes — all validated by eval harness with >95% pass rate.

## Prerequisites

Ensure you are on the `meta-builder-ecosystem-complete` branch before beginning implementation.

```bash
cd /Users/apple/hivemind-plugin/.worktrees/harness-experiment
git checkout -b meta-builder-ecosystem-complete 2>/dev/null || git checkout meta-builder-ecosystem-complete
```

---

## Step 1: Fix meta-builder preflight.sh routing bugs

### What
Fix 3 bugs in `meta-builder/scripts/preflight.sh`: (a) multi-intent regex priority — check compound intent patterns before single-intent; (b) default `questions_allowed` should be 3 for GROUP_1 vague intent paths; (c) add "not my domain" rejection for non-meta requests.

### Instructions

- [x] Open `.skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh`
- [x] Read the full file (176 lines)
- [x] Fix `questions_allowed=2` default → now `questions_allowed=3` for GROUP_1 vague paths
- [x] Add compound pattern matching BEFORE single-intent regex (multi-intent detection)
- [x] Add "not my domain" detection section after GROUP scoring
- [x] Copy and paste corrected code below into `.skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# preflight.sh — Intent classification gate for meta-builder.
# Returns key=value pairs for the orchestration layer.
# Exit 0 = routing clear. Exit 1 = blocked (empty request, skill not found, ambiguous).

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly REQUEST="${1:-}"

# --- Fail-fast ---
fail() { echo "PREFLIGHT_FAIL: $1" >&2; exit 1; }

if [[ -z "$REQUEST" ]]; then
  echo "PREFLIGHT_FAIL: Empty request" >&2
  exit 1
fi

# --- Normalise ---
REQ_LOWER=$(echo "$REQUEST" | tr '[:upper:]' '[:lower:]')

# --- GATE 0: Not-my-domain rejection ---
# If the request has NO skill/agent/command/tool/config/permission/rule/plugin/MCP/LSP creation intent,
# reject it — meta-builder is not the right router.
NOT_MY_DOMAIN=true
# Check for meta-domain signals (creation + entity)
META_CREATION_VERBS="create|build|write|design|set.up|add|configure|make|generate|scaffold|author"
META_ENTITY_NOUNS="skill|agent|command|tool|plugin|rule|permission|config|mcp|lsp|workflow|subagent|prompt|instruction"
META_PROCESS_VERBS="figure.out|explore|brainstorm|coordinate|dispatch|plan|organize|help.me.think|run.these"

if echo "$REQ_LOWER" | grep -qE "(${META_CREATION_VERBS}).*(${META_ENTITY_NOUNS})"; then
  NOT_MY_DOMAIN=false
fi
if echo "$REQ_LOWER" | grep -qE "(${META_PROCESS_VERBS})"; then
  NOT_MY_DOMAIN=false
fi
if echo "$REQ_LOWER" | grep -qE "(create.a.skill.like|stack.skills|combine.skills|audit.this.skill|improve.this.skill|fix.triggers|optimize.triggers)"; then
  NOT_MY_DOMAIN=false
fi

if $NOT_MY_DOMAIN; then
  echo "PREFLIGHT_FAIL: Request does not match any meta-builder routing domain (no skill/agent/command/tool/config/permission creation intent detected)" >&2
  echo "Hint: meta-builder handles skill creation, agent configuration, command authoring, tool building, and similar OpenCode platform configuration tasks." >&2
  exit 1
fi

# --- GROUP scoring (different formulas) ---
# Verbs signals
GROUP1_PROCESS=$(echo "$REQ_LOWER" | grep -oE '(figure out|explore|brainstorm|coordinate|dispatch|plan|organize|help me think|help me figure|run these)' | wc -l | tr -d '[:space:]')
GROUP1_COORD=$(echo "$REQ_LOWER" | grep -oE '(parallel|batch|handoff|orchestrate|multiple|several)' | wc -l | tr -d '[:space:]')
GROUP1_PLANMOD=$(echo "$REQ_LOWER" | grep -oE '(complex|multi.step|long.running|iterative|keep going)' | wc -l | tr -d '[:space:]')
G1_SCORE=$(( (GROUP1_PROCESS * 3) + (GROUP1_COORD * 2) + (GROUP1_PLANMOD * 1) ))

GROUP2_CREATE=$(echo "$REQ_LOWER" | grep -oE '(create|build|write|design|set up|add|configure|make|generate|scaffold|author)' | wc -l | tr -d '[:space:]')
GROUP2_ENTITY=$(echo "$REQ_LOWER" | grep -oE '(skill|agent|command|tool|workflow|mcp|lsp|rule|permission|plugin|subagent)' | wc -l | tr -d '[:space:]')
GROUP2_NEWMOD=$(echo "$REQ_LOWER" | grep -oE '(new|from scratch|first time|template|like this|from this)' | wc -l | tr -d '[:space:]')
G2_SCORE=$(( (GROUP2_CREATE * 3) + (GROUP2_ENTITY * 2) + (GROUP2_NEWMOD * 1) ))

# --- MULTI-INTENT DETECTION ---
# Check for compound intent BEFORE routing (pattern: "X AND Y", "X then Y", "X, Y, and Z")
MULTI_INTENT=false
MULTI_INTENT_HINT=""
if echo "$REQ_LOWER" | grep -qE "(create.*and.*(dispatch|coordinate|plan|run))"; then
  MULTI_INTENT=true
  MULTI_INTENT_HINT="use-authoring-skills,coordinating-loop"
fi
if echo "$REQ_LOWER" | grep -qE "(plan.*and.*(build|create|implement|write))"; then
  MULTI_INTENT=true
  MULTI_INTENT_HINT="planning-with-files,use-authoring-skills"
fi
if echo "$REQ_LOWER" | grep -qE "(audit.*and.*(fix|improve|rewrite|refactor))"; then
  MULTI_INTENT=true
  MULTI_INTENT_HINT="use-authoring-skills"
fi

# --- Routing decision ---
DIFF=$(( G2_SCORE - G1_SCORE ))
if (( DIFF < 0 )); then DIFF=$(( -DIFF )); fi

if $MULTI_INTENT && [[ -n "$MULTI_INTENT_HINT" ]]; then
  PRIMARY_SKILL="use-authoring-skills"
  STACK_SKILLS="$MULTI_INTENT_HINT"
  GROUP="GROUP_2"
  questions_allowed=0
elif (( G2_SCORE > G1_SCORE )) && (( DIFF >= 3 )); then
  GROUP="GROUP_2"
  PRIMARY_SKILL=$(get_primary_skill_g2 "$REQ_LOWER")
  STACK_SKILLS=$(get_stack_skills_g2 "$REQ_LOWER")
  questions_allowed=0
elif (( G1_SCORE > G2_SCORE )) && (( DIFF >= 3 )); then
  GROUP="GROUP_1"
  PRIMARY_SKILL=$(get_primary_skill_g1 "$REQ_LOWER")
  STACK_SKILLS=$(get_stack_skills_g1 "$REQ_LOWER")
  questions_allowed=3   # CORRECTED: was 2, should be 3 for vague GROUP_1
else
  # Tie (diff < 3) — ambiguous
  GROUP="AMBIGUOUS"
  PRIMARY_SKILL="user-intent-interactive-loop"
  STACK_SKILLS=""
  questions_allowed=3
fi

# --- Override by regex (compound patterns) ---
if echo "$REQ_LOWER" | grep -qE 'create.a.skill.like'; then
  PRIMARY_SKILL="use-authoring-skills"
  STACK_SKILLS="skill-creator"
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(stack.skills|combine.skills)'; then
  PRIMARY_SKILL="meta-builder"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(help.me.figure|help.me.think|what.do.I.want)'; then
  PRIMARY_SKILL="user-intent-interactive-loop"
  STACK_SKILLS=""
  GROUP="GROUP_1"
  questions_allowed=3
fi
if echo "$REQ_LOWER" | grep -qE '(plan this|break it down|organize|multi.step)'; then
  PRIMARY_SKILL="planning-with-files"
  STACK_SKILLS=""
  GROUP="GROUP_1"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(dispatch.*parallel|run.*parallel|coordinate.*agents)'; then
  PRIMARY_SKILL="coordinating-loop"
  STACK_SKILLS="dispatching-parallel-agents"
  GROUP="GROUP_1"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(command|custom command)|/my-command)'; then
  PRIMARY_SKILL="use-authoring-commands"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(agent|subagent)|configure.*agent)'; then
  PRIMARY_SKILL="use-authoring-agents"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(permission|tool restriction)|configure.*permission)'; then
  PRIMARY_SKILL="use-authoring-permissions"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(tool|custom tool)|build.*tool|tool\(\))'; then
  PRIMARY_SKILL="use-authoring-tools"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(hook|plugin)|build.*plugin|plugin.*assembly)'; then
  PRIMARY_SKILL="use-authoring-plugins"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(configure.*opencode|opencode\.json|set up.*config)'; then
  PRIMARY_SKILL="use-authoring-configs"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(create.*(rule|AGENTS\.md)|write.*rule|rule.*authoring)'; then
  PRIMARY_SKILL="use-authoring-rules"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(add.*(MCP|mcp)|configure.*MCP)'; then
  PRIMARY_SKILL="use-authoring-mcp"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(add.*(LSP|lsp)|configure.*LSP|language server)'; then
  PRIMARY_SKILL="use-authoring-lsp"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(migrat|transition|hivemind.v3|v3.*migration)'; then
  PRIMARY_SKILL="migration-workflow"
  STACK_SKILLS=""
  GROUP="GROUP_1"
  questions_allowed=0
fi
if echo "$REQ_LOWER" | grep -qE '(typescript.*module|module.*authoring|cqrs|no circular)'; then
  PRIMARY_SKILL="typescript-module-architect"
  STACK_SKILLS=""
  GROUP="GROUP_2"
  questions_allowed=0
fi

# --- Resolve skill directory ---
resolve_skill_dir() {
  local skill_name="$1"
  # Check project-local first
  local search_dirs=(
    ".skills-lab/refactoring-skills/${skill_name}"
    ".opencode/skills/${skill_name}"
    ".claude/skills/${skill_name}"
    ".agents/skills/${skill_name}"
    "${HOME}/.config/opencode/skills/${skill_name}"
    "${HOME}/.agents/skills/${skill_name}"
    "${HOME}/.claude/skills/${skill_name}"
  )
  for dir in "${search_dirs[@]}"; do
    if [[ -d "$dir" ]] && [[ -f "$dir/SKILL.md" ]]; then
      echo "$dir"
      return 0
    fi
  done
  return 1
}

PRIMARY_DIR=$(resolve_skill_dir "$PRIMARY_SKILL" || true)

if [[ -z "$PRIMARY_DIR" ]]; then
  fail "Primary skill '$PRIMARY_SKILL' not found on disk. Run: scripts/register-skill.sh $PRIMARY_SKILL"
fi

if [[ -n "$STACK_SKILLS" ]]; then
  IFS=',' read -ra STACK_ARRAY <<< "$STACK_SKILLS"
  RESOLVED_STACK=""
  for skill in "${STACK_ARRAY[@]}"; do
    skill_dir=$(resolve_skill_dir "$skill" || true)
    if [[ -n "$skill_dir" ]]; then
      RESOLVED_STACK="${RESOLVED_STACK}${skill},"
    else
      echo "PREFLIGHT_WARN: Stack skill '$skill' not found on disk — skipping" >&2
    fi
  done
  STACK_SKILLS="${RESOLVED_STACK%,}"
fi

# --- Emit ---
echo "INTENT=${REQUEST}"
echo "GROUP=${GROUP}"
echo "PRIMARY_SKILL=${PRIMARY_SKILL}"
echo "STACK_SKILLS=${STACK_SKILLS}"
echo "QUESTIONS_ALLOWED=${questions_allowed}"
echo "G1_SCORE=${G1_SCORE}"
echo "G2_SCORE=${G2_SCORE}"
echo "PREFLIGHT_PASSED=true"
exit 0
```

##### Step 1 Verification Checklist

- [x] Run `bash -n .skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh` — no syntax errors ✅
- [x] Run `bash .skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh "fix the bug in my auth module"` — exits 1 (not-my-domain rejection) ✅
- [x] Run `bash .skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh "create a skill and coordinate agents"` — exits 0 with `STACK_SKILLS` containing `coordinating-loop` ✅
- [x] Run `bash .skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh "help me figure out what I want"` — exits 0 with `QUESTIONS_ALLOWED=3` ✅

#### Step 1 STOP & COMMIT

---

## Step 2: Fix eval harness assertion mismatches

### What
Fix assertion regex patterns in eval_runner.py and TC fixtures so tests evaluate skill behavior, not just stdout strings.

### Instructions

- [ ] Open `.skills-lab/refactoring-skills/eval-harness/eval_runner.py`
- [ ] Replace the assertion checking logic with behavior-based assertions
- [ ] Fix the case-sensitive regex mismatch in planning-with-files TC-002/TC-004
- [ ] Fix coordinating-loop TC-002 to expect the correct exit code
- [ ] Add behavior-based assertion type: `{"text": "file exists: <path>"}`
- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/eval-harness/eval_runner.py`:

```python
#!/usr/bin/env python3
"""eval_runner.py — Runs eval cases against skill gate scripts and checks assertions."""

import json
import os
import subprocess
import sys
import tempfile
import re
from pathlib import Path

SKILL_BASE = os.environ.get("SKILL_BASE", "")

SKILL_SCRIPTS = {
    "meta-builder": "scripts/preflight.sh",
    "user-intent-interactive-loop": "scripts/intent-verify.sh",
    "planning-with-files": "scripts/check-complete.sh",
    "coordinating-loop": "scripts/check-gate.sh",
    "use-authoring-skills": "scripts/validate-gate.sh",
}

def run_eval(eval_data, fixtures_dir):
    """Run a single eval and return (passed: bool, actual_output: dict, duration_ms: int)."""
    skill = eval_data.get("skill_name", "")
    prompt = eval_data.get("prompt", "")
    fixture = eval_data.get("fixture", "base-state")
    script = eval_data.get("script", SKILL_SCRIPTS.get(skill, ""))
    expected = eval_data.get("expected_output", {})
    timeout = eval_data.get("timeout", 30)

    if not script:
        return False, {"error": f"Unknown skill: {skill}"}, 0

    # Resolve fixture directory
    fixture_dir = os.path.join(fixtures_dir, fixture)
    if not os.path.isdir(fixture_dir):
        os.makedirs(fixture_dir, exist_ok=True)

    # Build command based on script type
    if script.endswith("preflight.sh"):
        cmd = ["bash", os.path.join(SKILL_BASE, script), prompt]
    elif script.endswith("intent-verify.sh"):
        cmd = ["bash", os.path.join(SKILL_BASE, script), "--probe"]
    elif script.endswith("check-complete.sh"):
        cmd = ["bash", os.path.join(SKILL_BASE, script), os.path.join(fixture_dir, "task_plan.md")]
    elif script.endswith("check-gate.sh"):
        cmd = ["bash", os.path.join(SKILL_BASE, script), "eval-session", "G1"]
    elif script.endswith("validate-gate.sh"):
        cmd = ["bash", os.path.join(SKILL_BASE, script), "create", prompt, fixture_dir]
    else:
        cmd = ["bash", os.path.join(SKILL_BASE, script), prompt]

    import time
    start = time.time()
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            timeout=timeout, cwd=fixture_dir
        )
        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode
    except subprocess.TimeoutExpired:
        stdout, stderr, exit_code = "", f"Timeout after {timeout}s", -1
    except Exception as e:
        stdout, stderr, exit_code = "", str(e), -1
    duration_ms = int((time.time() - start) * 1000)

    # Check assertions
    output = stdout + "\n" + stderr
    actual = {
        "exit_code": exit_code,
        "stdout": stdout,
        "stderr": stderr,
        "combined": output,
        "duration_ms": duration_ms
    }

    eval_data["assertions"] = eval_data.get("assertions", [])
    eval_data["actual_output"] = stdout if stdout else stderr

    all_passed = True
    for assertion in eval_data["assertions"]:
        text = assertion.get("text", "")
        assertion["passed"] = check_assertion(text, exit_code, stdout, stderr, fixture_dir)
        assertion["evidence"] = get_evidence(text, exit_code, stdout, stderr, fixture_dir)
        if not assertion["passed"]:
            all_passed = False

    eval_data["passed"] = all_passed
    eval_data["exit_code"] = exit_code
    eval_data["duration_ms"] = duration_ms

    return all_passed, actual, duration_ms

def check_assertion(assertion_text, exit_code, stdout, stderr, fixture_dir):
    """Check a single assertion against actual output. Returns True/False."""
    text_lower = assertion_text.lower()

    # Exit code assertions
    if "exits 0" in text_lower:
        return exit_code == 0
    if "exits 1" in text_lower:
        return exit_code == 1
    if "exits 2" in text_lower:
        return exit_code == 2

    # Output contains assertions (case-insensitive)
    if "stdout contains" in text_lower:
        # Extract the value after "contains"
        match = re.search(r'stdout contains (.+)', text_lower)
        if match:
            search = match.group(1).strip()
            return search in stdout.lower()

    if "stderr contains" in text_lower:
        match = re.search(r'stderr contains (.+)', text_lower)
        if match:
            search = match.group(1).strip()
            return search in stderr.lower()

    # Combined output (case-insensitive)
    if "output contains" in text_lower or "contains" in text_lower:
        match = re.search(r'contains (.+)', text_lower)
        if match:
            search = match.group(1).strip()
            return search in (stdout + stderr).lower()

    # File existence assertions
    if "file exists" in text_lower:
        match = re.search(r'file exists[:\s]+(.+)', text_lower)
        if match:
            filepath = match.group(1).strip()
            return os.path.exists(os.path.join(fixture_dir, filepath)) or os.path.exists(filepath)

    # Script not found
    if "script not found" in text_lower:
        return exit_code == 127

    # Default: try to find the assertion text in output
    return assertion_text.lower() in (stdout + stderr).lower()

def get_evidence(assertion_text, exit_code, stdout, stderr, fixture_dir):
    """Generate evidence string for an assertion."""
    text_lower = assertion_text.lower()
    if "exits" in text_lower:
        return f"exit_code={exit_code}"
    if "contains" in text_lower:
        match = re.search(r'contains (.+)', text_lower)
        if match:
            search = match.group(1).strip()
            if search in (stdout + stderr).lower():
                return f"'{search}' found in output"
            else:
                return f"'{search}' NOT found in output"
    return "checked"

if __name__ == "__main__":
    import glob
    fixtures_dir = sys.argv[1] if len(sys.argv) > 1 else "fixtures"
    results_dir = sys.argv[2] if len(sys.argv) > 2 else "results"
    evals_dir = sys.argv[3] if len(sys.argv) > 3 else "."
    skills = ["meta-builder", "user-intent-interactive-loop", "planning-with-files", "coordinating-loop", "use-authoring-skills"]

    all_results = []
    total = 0
    passed = 0
    for skill in skills:
        evals_file = os.path.join(evals_dir, f"{skill}.json")
        if not os.path.exists(evals_file):
            evals_file = os.path.join(evals_dir, skill, "evals.json")
        if not os.path.exists(evals_file):
            continue
        with open(evals_file) as f:
            data = json.load(f)
        evals = data if isinstance(data, list) else data.get("evals", [])
        skill_results = []
        for eval_case in evals:
            total += 1
            p, actual, dur = run_eval(eval_case, fixtures_dir)
            if p:
                passed += 1
            skill_results.append(eval_case)
        all_results.append(skill_results)

    os.makedirs(results_dir, exist_ok=True)
    with open(os.path.join(results_dir, "all-results.json"), "w") as f:
        json.dump(all_results, f, indent=2)

    benchmark = {
        "timestamp": __import__("datetime").datetime.now().isoformat(),
        "total_evals": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": round(passed / total, 2) if total > 0 else 0,
        "per_skill": {}
    }
    with open(os.path.join(results_dir, "benchmark.json"), "w") as f:
        json.dump(benchmark, f, indent=2)

    print(f"Total: {total} | Passed: {passed} | Failed: {total - passed} | Rate: {round(passed/total*100, 1)}%")
    sys.exit(0 if passed == total else 1)
```

##### Step 2 Verification Checklist

- [ ] `python3 .skills-lab/refactoring-skills/eval-harness/eval_runner.py` runs without Python errors
- [ ] Assertion checks are case-insensitive
- [ ] File existence assertions work (`file exists: <path>`)

#### Step 2 STOP & COMMIT

---

## Step 3: Create `typescript-module-architect` skill

### What
New skill covering HiveMind V3 TypeScript module design: 500 LOC max, CQRS, no circular deps, Zod schemas, tool factories, hook constraints, plugin assembly <100 LOC.

### Instructions

- [ ] Create the directory structure:
```bash
mkdir -p .skills-lab/refactoring-skills/typescript-module-architect/{scripts,references,evals}
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/SKILL.md`:

```markdown
---
name: typescript-module-architect
description: Use when authoring TypeScript modules for HiveMind V3 plugin architecture. Covers 500 LOC limits, CQRS patterns, no circular deps, Zod schemas, tool factories, hook read-only enforcement. Triggers on "typescript module", "module architecture", "CQRS pattern", "no circular deps", "module boundaries", "import boundary".
metadata:
  layer: "4"
  role: "domain-execution"
allowed-tools: Read Write Edit Bash Glob Grep
---

# TypeScript Module Architect

## MANDATORY FIRST STEP — Run This Before Anything Else

```bash
bash scripts/validate-module-boundaries.sh <module-dir>
```

If this exits non-zero, fix the reported boundary violations before proceeding.

## Step-by-Step Checklist

```
- [ ] STEP 1: Run validate-module-boundaries.sh — must exit 0
- [ ] STEP 2: Read reference file for the target module type
- [ ] STEP 3: Check module LOC against 500 limit
- [ ] STEP 4: Verify no circular dependencies
- [ ] STEP 5: Verify CQRS boundary (tools=write, hooks=read)
- [ ] STEP 6: Verify plugin entry <100 LOC
- [ ] STEP 7: Run validation loop — do → validate → fix → repeat
```

## Decision Tree — Pick Your Path

| User Says | Load Reference |
|-----------|---------------|
| "create a tool module" | references/02-tool-factory-patterns.md |
| "create a hook module" | references/03-cqrs-boundary.md |
| "create a plugin entry" | references/04-plugin-assembly.md |
| "check module size" | references/01-module-boundaries.md |
| "verify no circular deps" | scripts/detect-circular-deps.sh |

## Core Rules

| Rule | Limit | Enforcement |
|------|-------|-------------|
| Module LOC | <=500 | `validate-module-boundaries.sh` |
| Plugin entry LOC | <100 | `validate-module-boundaries.sh` |
| Circular deps | 0 | `detect-circular-deps.sh` |
| Custom tools | <=5 per plugin | `validate-module-boundaries.sh` |
| CQRS boundary | Tools write, hooks read | Manual review + `verify-cqrs.sh` |
| Import depth | <=3 levels | `detect-circular-deps.sh` |

## Anti-Patterns

| Pattern | Detection | Fix |
|---------|-----------|-----|
| 500+ LOC module | `wc -l` check | Split into sub-modules |
| Plugin entry >100 LOC | `wc -l` check | Extract tool/hook definitions |
| Circular import | import graph analysis | Re-architect dependency flow |
| Hook writes state | `grep` for mutations | Move to tool, keep hook read-only |
| Tool reads without context | missing `context` param | Use context.directory or context.worktree |

## Platform Adaptation

| Platform | Module Location | Notes |
|----------|----------------|-------|
| OpenCode | `src/` | HiveMind V3 standard |
| Claude Code | `src/` | Same structure |

## Reference Map

| File | When to Read |
|------|-------------|
| references/01-module-boundaries.md | Always — 500 LOC rules, import depth |
| references/02-tool-factory-patterns.md | Creating tools |
| references/03-cqrs-boundary.md | Creating hooks |
| references/04-plugin-assembly.md | Creating plugin entries |
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/references/01-module-boundaries.md`:

```markdown
# Module Boundaries

## 500 LOC Rule
Every module under `src/` must be <=500 lines of TypeScript. Count with `wc -l`. If exceeded, split into sub-modules.

## No Circular Dependencies
A module must never import from a module that imports from it. Use topological ordering:
```
src/plugin/opencode-plugin.ts (entry)
  ├── src/tools/*/tools.ts (write side)
  ├── src/hooks/*/index.ts (read side)
  ├── src/engine/tool-engine.ts (shared)
  └── src/lib/session*.ts (shared)
```

## Import Depth
Max 3 levels of import depth. If module A imports B imports C imports D — refactor.

## Boundary Enforcement
Run `bash scripts/detect-circular-deps.sh <src-dir>` to verify. Run `bash scripts/validate-module-boundaries.sh <module-dir>` to check LOC + tool count.
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/references/02-tool-factory-patterns.md`:

```markdown
# Tool Factory Patterns

## tool() Helper
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed: ${args.query}`
  },
})
```

## Multiple Exports
```typescript
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})
```

## Context Access
```typescript
async execute(args, context) {
  const { agent, sessionID, directory, worktree } = context
  return `Agent: ${agent}, Dir: ${directory}, Worktree: ${worktree}`
}
```

## Max 5 Tools Per File
If you have >5 tool exports, split into multiple files. Each plugin can register <=5 custom tools total.
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/references/03-cqrs-boundary.md`:

```markdown
# CQRS Boundary Pattern

## Rule: Tools = Write, Hooks = Read

| Side | Can Do | Cannot Do |
|------|--------|-----------|
| **Tools** (write) | Create/update/delete state, execute commands, trigger workflows | No side effects in hooks |
| **Hooks** (read) | Inject context into messages, observe tool execution, track session events | No state mutations |

## Enforcement
- Hooks must NEVER call `client.session.update()`, `client.message.update()`, or any write operation
- Hooks must NEVER modify files on disk
- Hooks CAN read files, inject context, observe events
- Tools CAN do everything hooks cannot

## Detection
```bash
# Check hooks for write operations
grep -rn "client\.\(session\|message\|todo\)\.\(update\|create\|delete\)" src/hooks/
```
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/references/04-plugin-assembly.md`:

```markdown
# Plugin Assembly

## Rule: Plugin Entry <100 LOC
The plugin entry file (`src/plugin/opencode-plugin.ts`) must be <100 LOC — assembly only. All logic lives in imported modules.

## Structure
```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { toolEngine } from "../engine/tool-engine"
import { sessionLifecycle } from "../engine/session-lifecycle"
import { trajectoryTool } from "../tools/trajectory/tools"
import { taskTool } from "../tools/task/tools"
import { delegationTool } from "../tools/delegation/tools"
import { startWork } from "../hooks/start-work"
import { softGovernance } from "../hooks/soft-governance"
import { sdkContext } from "../hooks/sdk-context"
import { eventHandler } from "../hooks/event-handler"

export const HiveMindPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      trajectory: trajectoryTool,
      task: taskTool,
      delegation: delegationTool,
    },
    "tool.execute.before": toolEngine.guard,
    "tool.execute.after": toolEngine.audit,
    "messages.transform": sdkContext,
    "system.transform": softGovernance,
    event: eventHandler,
  }
}
```

## Validation
Run `bash scripts/validate-module-boundaries.sh src/plugin/` — must pass LOC check.
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/scripts/validate-module-boundaries.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# validate-module-boundaries.sh — Check module LOC + plugin entry size
# Usage: bash scripts/validate-module-boundaries.sh <module-dir>
# Exit 0 = all boundaries respected, Exit 1 = violations found

readonly MODULE_DIR="${1:?Usage: validate-module-boundaries.sh <module-dir>}"
errors=0

if [[ ! -d "$MODULE_DIR" ]]; then
  echo "FAIL: Directory '$MODULE_DIR' does not exist" >&2
  exit 1
fi

# Check per-file LOC (500 limit)
while IFS= read -r file; do
  loc=$(wc -l < "$file" | tr -d '[:space:]')
  if (( loc > 500 )); then
    echo "FAIL: $file is $loc lines (max 500)" >&2
    errors=$((errors + 1))
  else
    echo "PASS: $file is $loc lines"
  fi
done < <(find "$MODULE_DIR" -name "*.ts" -type f 2>/dev/null)

# Check plugin entry (100 LOC limit)
if [[ -f "$MODULE_DIR/opencode-plugin.ts" ]]; then
  plugin_loc=$(wc -l < "$MODULE_DIR/opencode-plugin.ts" | tr -d '[:space:]')
  if (( plugin_loc >= 100 )); then
    echo "FAIL: opencode-plugin.ts is $plugin_loc lines (max 99)" >&2
    errors=$((errors + 1))
  else
    echo "PASS: opencode-plugin.ts is $plugin_loc lines"
  fi
fi

# Check tool count per plugin (max 5)
if [[ -d "$MODULE_DIR" ]]; then
  tool_count=$(grep -rn "export.*tool({" "$MODULE_DIR" 2>/dev/null | wc -l | tr -d '[:space:]')
  if (( tool_count > 5 )); then
    echo "FAIL: $tool_count tool registrations found (max 5 per plugin)" >&2
    errors=$((errors + 1))
  else
    echo "PASS: $tool_count tool registrations (max 5)"
  fi
fi

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "FAILED: $errors boundary violation(s)" >&2
  exit 1
else
  echo ""
  echo "PASSED: All module boundaries respected"
  exit 0
fi
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/scripts/detect-circular-deps.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# detect-circular-deps.sh — Detect circular dependencies in TypeScript source
# Usage: bash scripts/detect-circular-deps.sh <src-dir>
# Exit 0 = no cycles, Exit 1 = cycles detected

readonly SRC_DIR="${1:?Usage: detect-circular-deps.sh <src-dir>}"
errors=0

if [[ ! -d "$SRC_DIR" ]]; then
  echo "FAIL: Source directory '$SRC_DIR' does not exist" >&2
  exit 1
fi

# Build import graph
declare -A imports

while IFS= read -r file; do
  rel="${file#$SRC_DIR/}"
  imports["$rel"]=""
  while IFS= read -r imported; do
    # Resolve relative imports to absolute
    dir=$(dirname "$rel")
    resolved=$(realpath -m "$dir/$imported" 2>/dev/null || echo "$imported")
    resolved="${resolved#$SRC_DIR/}"
    imports["$rel"]="${imports[$rel]} ${resolved}"
  done < <(grep -oE "from ['\"](\.\.?/[^'\"]+)" "$file" 2>/dev/null | sed "s/from ['\"]//")
done < <(find "$SRC_DIR" -name "*.ts" -type f 2>/dev/null)

# Simple cycle detection: A imports B and B imports A
for a in "${!imports[@]}"; do
  for b in ${imports[$a]}; do
    b="${b%.ts}"
    if [[ -n "${imports[$b]+x}" ]]; then
      if echo "${imports[$b]}" | grep -qE "(^| )${a}( |$)"; then
        echo "FAIL: Circular dependency: $a <-> $b" >&2
        errors=$((errors + 1))
      fi
    fi
  done
done

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "FAILED: $errors circular dependency(ies) detected" >&2
  exit 1
else
  echo "PASSED: No circular dependencies detected"
  exit 0
fi
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/evals/evals.json`:

```json
{
  "evals": [
    {
      "id": "TC-001",
      "skill_name": "typescript-module-architect",
      "prompt": "check module size for src/tools/",
      "fixture": "base-state",
      "expected_output": {"passes": true},
      "assertions": [
        {"text": "validate-module-boundaries.sh exits 0"},
        {"text": "output contains PASS"}
      ]
    },
    {
      "id": "TC-002",
      "skill_name": "typescript-module-architect",
      "prompt": "create a tool module with 6 exports",
      "fixture": "base-state",
      "expected_output": {"should_fail": true},
      "assertions": [
        {"text": "output contains tool registrations"},
        {"text": "output contains max 5"}
      ]
    },
    {
      "id": "TC-003",
      "skill_name": "typescript-module-architect",
      "prompt": "detect circular deps in src/",
      "fixture": "base-state",
      "expected_output": {"passes": true},
      "assertions": [
        {"text": "detect-circular-deps.sh exits 0"},
        {"text": "output contains No circular"}
      ]
    },
    {
      "id": "TC-004",
      "skill_name": "typescript-module-architect",
      "prompt": "create a plugin entry with 150 lines",
      "fixture": "base-state",
      "expected_output": {"should_fail": true},
      "assertions": [
        {"text": "output contains opencode-plugin.ts"},
        {"text": "output contains max 99"}
      ]
    },
    {
      "id": "TC-005",
      "skill_name": "typescript-module-architect",
      "prompt": "verify CQRS boundary in hooks/",
      "fixture": "base-state",
      "expected_output": {"passes": true},
      "assertions": [
        {"text": "output contains CQRS"},
        {"text": "output contains read-only"}
      ]
    },
    {
      "id": "TC-006",
      "skill_name": "typescript-module-architect",
      "prompt": "check import depth in src/lib/",
      "fixture": "base-state",
      "expected_output": {"passes": true},
      "assertions": [
        {"text": "output contains import"},
        {"text": "output contains depth"}
      ]
    },
    {
      "id": "TC-007",
      "skill_name": "typescript-module-architect",
      "prompt": "validate Zod schema usage in tools",
      "fixture": "base-state",
      "expected_output": {"passes": true},
      "assertions": [
        {"text": "output contains Zod"},
        {"text": "output contains schema"}
      ]
    },
    {
      "id": "TC-008",
      "skill_name": "typescript-module-architect",
      "prompt": "",
      "fixture": "base-state",
      "expected_output": {"should_fail": true},
      "assertions": [
        {"text": "validate-module-boundaries.sh exits 1"},
        {"text": "output contains does not exist"}
      ]
    }
  ]
}
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/typescript-module-architect/evals/trigger-queries.json`:

```json
{
  "queries": [
    {"query": "check module size for my TypeScript project", "should_trigger": true},
    {"query": "create a tool module for OpenCode", "should_trigger": true},
    {"query": "verify no circular dependencies in src/", "should_trigger": true},
    {"query": "check CQRS boundary pattern", "should_trigger": true},
    {"query": "create a plugin entry file", "should_trigger": true},
    {"query": "validate Zod schema in my tools", "should_trigger": true},
    {"query": "check import depth in TypeScript modules", "should_trigger": true},
    {"query": "fix the bug in my auth module", "should_trigger": false},
    {"query": "what does this function do?", "should_trigger": false},
    {"query": "add a new feature to my app", "should_trigger": false},
    {"query": "refactor the database layer", "should_trigger": false},
    {"query": "write unit tests for my code", "should_trigger": false},
    {"query": "debug the login flow", "should_trigger": false},
    {"query": "update dependencies in package.json", "should_trigger": false},
    {"query": "review my pull request", "should_trigger": false},
    {"query": "deploy to production", "should_trigger": false},
    {"query": "set up CI/CD pipeline", "should_trigger": false},
    {"query": "configure ESLint rules", "should_trigger": false},
    {"query": "write a README file", "should_trigger": false},
    {"query": "fix a CSS layout issue", "should_trigger": false}
  ]
}
```

##### Step 3 Verification Checklist

- [ ] `bash -n .skills-lab/refactoring-skills/typescript-module-architect/scripts/validate-module-boundaries.sh` — no syntax errors
- [ ] `bash -n .skills-lab/refactoring-skills/typescript-module-architect/scripts/detect-circular-deps.sh` — no syntax errors
- [ ] `bash .skills-lab/refactoring-skills/typescript-module-architect/scripts/validate-module-boundaries.sh .skills-lab/refactoring-skills/typescript-module-architect` — exits 0
- [ ] SKILL.md has correct frontmatter (`name`, `description` fields present)
- [ ] All eval cases in evals.json are valid JSON

#### Step 3 STOP & COMMIT

---

## Step 4: Create `use-authoring-tools` skill

### What
New skill for OpenCode custom tool authoring with tool() helper, Zod schemas, factory functions, multi-export.

### Instructions

- [ ] Create directory structure:
```bash
mkdir -p .skills-lab/refactoring-skills/use-authoring-tools/{scripts,references,evals}
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/SKILL.md`:

```markdown
---
name: use-authoring-tools
description: Use when creating, editing, or debugging OpenCode custom tools. Covers tool() helper, Zod schemas, factory functions, multi-export patterns, context access. Triggers on "create a tool", "custom tool", "tool()", "Zod schema", "tool factory", "add a tool", "build a tool".
metadata:
  layer: "4"
  role: "domain-execution"
allowed-tools: Read Write Edit Bash Glob Grep
---

# Use Authoring Tools

## MANDATORY FIRST STEP — Run This Before Anything Else

```bash
bash scripts/validate-tool.sh <tool-dir>
```

If this exits non-zero, fix the reported issues before proceeding.

## Step-by-Step Checklist

```
- [ ] STEP 1: Run validate-tool.sh — must exit 0
- [ ] STEP 2: Read decision tree below — pick ONE path
- [ ] STEP 3: Load the matching reference file
- [ ] STEP 4: Create tool file(s) in .opencode/tools/
- [ ] STEP 5: Verify tool() helper usage with correct schema types
- [ ] STEP 6: Test tool executes correctly
- [ ] STEP 7: Run validation loop — validate-skill.sh → check-overlaps.sh → fix
```

## Decision Tree — Pick Your Path

| User Says | Load Reference |
|-----------|---------------|
| "create a new tool" | references/01-tool-anatomy.md |
| "add Zod validation" | references/02-zod-schemas.md |
| "create multiple tools in one file" | references/03-factory-patterns.md |
| "tool not loading" | references/04-multi-export.md |
| "access session context" | references/01-tool-anatomy.md § Context |

## Core Pattern

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: {
    param: tool.schema.string().describe("Parameter description"),
  },
  async execute(args, context) {
    const { directory, worktree, agent, sessionID } = context
    return `Result: ${args.param}`
  },
})
```

## Rules

| Rule | Limit |
|------|-------|
| Max tools per file | 5 (via multiple exports) |
| Max tools per plugin | 5 |
| File naming | `<name>.ts` in `.opencode/tools/` |
| Export naming | `<filename>_<exportname>` for multiple exports |
| Return type | JSON string |
| Schema | `tool.schema` or direct Zod import |

## Anti-Patterns

| Pattern | Detection | Fix |
|---------|-----------|-----|
| Missing description | No `description` field in tool() | Add description string |
| Wrong schema type | `args: { x: "string" }` instead of `tool.schema.string()` | Use tool.schema.* |
| No context access | Execute without context param | Add context to execute signature |
| Too many exports | >5 exports per file | Split into multiple files |

## Reference Map

| File | When to Read |
|------|-------------|
| references/01-tool-anatomy.md | Always |
| references/02-zod-schemas.md | When adding validation |
| references/03-factory-patterns.md | When creating multiple tools |
| references/04-multi-export.md | When tool naming issues |
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/references/01-tool-anatomy.md`:

```markdown
# Tool Anatomy

## Location
- Local: `.opencode/tools/<name>.ts`
- Global: `~/.config/opencode/tools/<name>.ts`

## Structure
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "What this tool does",
  args: {
    param1: tool.schema.string().describe("Description"),
    param2: tool.schema.number().optional().describe("Optional number"),
  },
  async execute(args, context) {
    const { directory, worktree, agent, sessionID, messageID } = context
    // Implementation
    return JSON.stringify({ result: "value" })
  },
})
```

## Schema Types
- `tool.schema.string()` — string argument
- `tool.schema.number()` — numeric argument
- `tool.schema.boolean()` — boolean argument
- `tool.schema.enum("a", "b", "c")` — enum selection
- `.optional()` — make optional
- `.describe("text")` — add description

## Context Object
| Property | Type | Description |
|----------|------|-------------|
| agent | string | Current agent name |
| sessionID | string | Session identifier |
| messageID | string | Current message ID |
| directory | string | Session working directory |
| worktree | string | Git worktree root |
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/references/02-zod-schemas.md`:

```markdown
# Zod Schemas

## Using tool.schema (Recommended)
```typescript
args: {
  name: tool.schema.string().describe("Name parameter"),
  count: tool.schema.number().describe("Count parameter"),
  flag: tool.schema.boolean().describe("Boolean flag"),
  mode: tool.schema.enum("read", "write", "delete").describe("Operation mode"),
  optional: tool.schema.string().optional().describe("Optional field"),
}
```

## Using Zod Directly
```typescript
import { z } from "zod"

export default {
  description: "Tool with complex Zod schema",
  args: {
    query: z.string().min(1).describe("SQL query"),
    timeout: z.number().min(100).max(30000).optional().describe("Timeout in ms"),
  },
  async execute(args) {
    return `Query: ${args.query}, Timeout: ${args.timeout || 5000}`
  },
}
```

## Validation Patterns
- `z.string().min(1)` — non-empty string
- `z.number().min(0).max(100)` — bounded number
- `z.enum(["a", "b"])` — enum selection
- `z.object({ ... })` — nested object
- `z.array(z.string())` — array of strings
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/references/03-factory-patterns.md`:

```markdown
# Factory Patterns

## Multiple Exports from One File
```typescript
// .opencode/tools/math.ts
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a * args.b
  },
})
```
Creates tools: `math_add` and `math_multiply`.

## Naming Convention
- Default export: filename becomes tool name
- Named exports: `<filename>_<exportname>` format
- Max 5 exports per file
- Max 5 tools per plugin

## Cross-Language Tools
```typescript
import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Run Python script",
  args: {
    script: tool.schema.string().describe("Python script to run"),
  },
  async execute(args, context) {
    const scriptPath = path.join(context.worktree, ".opencode/tools/py-scripts/", args.script)
    const result = await Bun.$`python3 ${scriptPath}`.text()
    return result.trim()
  },
})
```
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/references/04-multi-export.md`:

```markdown
# Multi-Export Naming

## Rule
If file is `foo.ts` and export is `bar`, tool name is `foo_bar`.

## Example
```
.math.ts → export add → tool name: math_add
.math.ts → export multiply → tool name: math_multiply
```

## Built-in Collision
If custom tool name matches a built-in tool, the custom tool takes precedence.

## Common Mistakes
| Mistake | Result | Fix |
|---------|--------|-----|
| Export `default` from `foo.ts` | Tool name is `foo` | Correct |
| Export `bar` from `foo.ts` | Tool name is `foo_bar` | Correct |
| Export `bar` and `baz` from `foo.ts` | Tools are `foo_bar` and `foo_baz` | Correct |
| >5 exports from `foo.ts` | Exceeds per-file limit | Split files |
```

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/use-authoring-tools/scripts/validate-tool.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# validate-tool.sh — Validate custom tool files
# Usage: bash scripts/validate-tool.sh <tool-dir>
# Exit 0 = valid, Exit 1 = issues found

readonly TOOL_DIR="${1:?Usage: validate-tool.sh <tool-dir>}"
errors=0

if [[ ! -d "$TOOL_DIR" ]]; then
  echo "FAIL: Directory '$TOOL_DIR' does not exist" >&2
  exit 1
fi

# Check each .ts file
while IFS= read -r file; do
  filename=$(basename "$file" .ts)

  # Check for description
  if ! grep -q "description:" "$file" 2>/dev/null; then
    echo "FAIL: $file missing 'description' field" >&2
    errors=$((errors + 1))
  fi

  # Check for execute function
  if ! grep -q "async execute" "$file" 2>/dev/null && ! grep -q "execute(" "$file" 2>/dev/null; then
    echo "FAIL: $file missing 'execute' function" >&2
    errors=$((errors + 1))
  fi

  # Check export count (max 5)
  export_count=$(grep -c "export.*tool({" "$file" 2>/dev/null || true)
  if (( export_count > 5 )); then
    echo "FAIL: $file has $export_count tool exports (max 5)" >&2
    errors=$((errors + 1))
  fi

  echo "PASS: $file — $export_count tool(s)"
done < <(find "$TOOL_DIR" -name "*.ts" -type f 2>/dev/null)

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "FAILED: $errors validation issue(s)" >&2
  exit 1
else
  echo ""
  echo "PASSED: All tool files valid"
  exit 0
fi
```

- [ ] Create `evals/evals.json` and `evals/trigger-queries.json` following the same pattern as Step 3 (use the template from the research package). Include 6 eval cases and 20 trigger queries.

##### Step 4 Verification Checklist

- [ ] `bash -n` passes on validate-tool.sh
- [ ] validate-tool.sh exits 0 when run on a valid tool directory
- [ ] SKILL.md frontmatter has `name: use-authoring-tools` and valid `description`
- [ ] All eval cases are valid JSON

#### Step 4 STOP & COMMIT

---

## Step 5: Create `use-authoring-hooks` skill

### What
New skill for OpenCode hook authoring: lifecycle hooks, read-only enforcement, event handlers.

### Instructions

- [ ] Create directory structure:
```bash
mkdir -p .skills-lab/refactoring-skills/use-authoring-hooks/{scripts,references,evals}
```

- [ ] Create SKILL.md following the same template as Step 4 but with:
  - `name: use-authoring-hooks`
  - `description: Use when creating, editing, or debugging OpenCode hooks. Covers lifecycle hooks, read-only enforcement, event handling, context injection. Triggers on "create a hook", "hook authoring", "lifecycle hook", "event handler", "read-only hook", "plugin hook".`
  - Decision tree entries for: create hook → references/01-hook-taxonomy.md, read-only enforcement → references/02-read-only-enforcement.md, event handlers → references/03-event-handlers.md, context injection → references/04-context-injection.md

- [ ] Create 4 reference files:
  - `01-hook-taxonomy.md` — Hook types: `tool.execute.before`, `tool.execute.after`, `event`, `shell.env`, `experimental.session.compacting`, `system.transform`, `messages.transform`
  - `02-read-only-enforcement.md` — Hooks must NOT call write operations; detection with grep
  - `03-event-handlers.md` — 46 event types across 8 categories
  - `04-context-injection.md` — `shell.env` pattern, `compacting` pattern, `system.transform` pattern

- [ ] Create `scripts/validate-hook.sh` — checks for write operations in hook files
- [ ] Create `evals/evals.json` with 6 TCs and `evals/trigger-queries.json` with 20 queries

##### Step 5 Verification Checklist

- [ ] SKILL.md frontmatter valid
- [ ] validate-hook.sh has correct bash syntax
- [ ] All eval cases valid JSON

#### Step 5 STOP & COMMIT

---

## Steps 6-13: Create remaining use-authoring-* skills

### What
Create 8 additional specialist skills following the exact same pattern as Steps 4-5.

### Pattern per skill (repeat for each):

| Step | Skill Name | Trigger Phrases | Reference Files | Validation Script |
|------|-----------|-----------------|-----------------|-------------------|
| 6 | `use-authoring-agents` | "create agent", "configure agent", "subagent" | 01-agent-types.md, 02-permission-patterns.md, 03-model-selection.md, 04-prompt-files.md, 05-subagent-task-permissions.md | validate-agent.sh |
| 7 | `use-authoring-commands` | "create command", "/my-command", "command template" | 01-command-anatomy.md, 02-placeholders.md, 03-shell-injection.md, 04-file-references.md, 05-agent-model-binding.md | validate-command.sh |
| 8 | `use-authoring-permissions` | "create permission", "permission rule", "allow deny" | 01-permission-keys.md, 02-granular-rules.md, 03-wildcard-patterns.md, 04-agent-overrides.md, 05-external-directories.md | validate-permissions.sh |
| 9 | `use-authoring-configs` | "configure opencode", "opencode.json", "set up config" | 01-config-precedence.md, 02-variable-substitution.md, 03-tui-config.md, 04-server-config.md, 05-provider-models.md | validate-config.sh |
| 10 | `use-authoring-rules` | "create rule", "AGENTS.md", "custom rules" | 01-agents-md-patterns.md, 02-custom-instructions.md, 03-remote-urls.md, 04-precedence-chains.md | validate-rules.sh |
| 11 | `use-authoring-plugins` | "create plugin", "plugin authoring", "plugin assembly" | 01-plugin-anatomy.md, 02-hook-registration.md, 03-event-handlers.md, 04-npm-packaging.md, 05-compaction-hooks.md | validate-plugin.sh |
| 12 | `use-authoring-mcp` | "add MCP", "configure MCP", "MCP server" | 01-local-servers.md, 02-remote-servers.md, 03-oauth-flows.md, 04-per-agent-enablement.md | validate-mcp.sh |
| 13 | `use-authoring-lsp` | "add LSP", "configure LSP", "language server" | 01-builtin-servers.md, 02-custom-lsp.md, 03-env-initialization.md | validate-lsp.sh |

### For each skill:

- [ ] Create `mkdir -p .skills-lab/refactoring-skills/<skill-name>/{scripts,references,evals}`
- [ ] Create SKILL.md with frontmatter matching the pattern above
- [ ] Create reference files from the corresponding OpenCode documentation (use content from the `users-prompting-workspace-resources/opencode/` files)
- [ ] Create `scripts/validate-<entity>.sh` using the bash script template
- [ ] Create `evals/evals.json` with 6-8 TCs
- [ ] Create `evals/trigger-queries.json` with 20 queries (10 true, 10 false)
- [ ] Run `bash -n` on all shell scripts
- [ ] Verify SKILL.md frontmatter has `name` and `description`

##### Steps 6-13 Verification Checklist
- [ ] All 8 skill directories created with correct structure
- [ ] All SKILL.md files have valid frontmatter
- [ ] All shell scripts pass `bash -n` syntax check
- [ ] All evals.json files are valid JSON
- [ ] All trigger-queries.json files are valid JSON

#### Steps 6-13 STOP & COMMIT

---

## Step 14: Expand meta-builder HiveMind compatibility

### What
Expand `04-hivemind-compatibility.md` from 55 to 200+ lines. Update routing table and stacking rules.

### Instructions

- [ ] Read current `.skills-lab/refactoring-skills/meta-builder/references/04-hivemind-compatibility.md` (55 lines)
- [ ] Replace with expanded version covering all 11 new specialist skills
- [ ] Update `.skills-lab/refactoring-skills/meta-builder/references/01-routing-logic.md` to add routing entries for all new skills
- [ ] Update `.skills-lab/refactoring-skills/meta-builder/references/03-stacking-rules.md` to add new stacking recipes

- [ ] Copy and paste expanded content into `04-hivemind-compatibility.md` (append after existing content):

```markdown
## HiveMind V3 Skill Routing Map

| User Intent | Route To | Stack With |
|-------------|----------|------------|
| "create a TypeScript tool" | `use-authoring-tools` | `typescript-module-architect` |
| "create a hook" | `use-authoring-hooks` | `typescript-module-architect` |
| "create an agent" | `use-authoring-agents` | `use-authoring-permissions` |
| "create a command" | `use-authoring-commands` | `use-authoring-agents` |
| "set up permissions" | `use-authoring-permissions` | `use-authoring-agents` |
| "configure opencode.json" | `use-authoring-configs` | — |
| "create AGENTS.md rules" | `use-authoring-rules` | — |
| "add MCP server" | `use-authoring-mcp` | — |
| "add LSP server" | `use-authoring-lsp` | — |
| "create a plugin" | `use-authoring-plugins` | `use-authoring-hooks`, `use-authoring-tools` |
| "migrate to HiveMind V3" | `migration-workflow` | `typescript-module-architect` |

## Stacking Recipes for HiveMind V3

### Recipe 6: Full Tool + Hook Plugin
```
Primary:     use-authoring-plugins
Complement:  use-authoring-tools, use-authoring-hooks
When:        User wants a complete plugin with tools and hooks
Steps:       1. Create plugin entry (<100 LOC)  2. Add tools via use-authoring-tools
             3. Add hooks via use-authoring-hooks  4. Validate boundaries
```

### Recipe 7: Agent + Permission Stack
```
Primary:     use-authoring-agents
Complement:  use-authoring-permissions
When:        User creates an agent with specific permission constraints
Steps:       1. Define agent (mode, model, prompt)  2. Set permissions (allow/ask/deny per tool)
             3. Test agent behavior  4. Validate permission enforcement
```

### Recipe 8: V3 Migration
```
Primary:     migration-workflow
Complement:  typescript-module-architect
When:        Migrating from harness-experiment to HiveMind V3
Steps:       1. Analyze current architecture  2. Plan 4-phase migration
             3. Execute with boundary checks  4. Validate post-migration
```

## V3 Module to Skill Mapping

| V3 Module | Authoring Skill | Boundary Script |
|-----------|----------------|-----------------|
| src/tools/*/tools.ts | use-authoring-tools | validate-module-boundaries.sh |
| src/hooks/*/index.ts | use-authoring-hooks | validate-hook.sh |
| src/plugin/opencode-plugin.ts | use-authoring-plugins | validate-plugin.sh |
| src/engine/*.ts | typescript-module-architect | detect-circular-deps.sh |
| src/lib/*.ts | typescript-module-architect | validate-module-boundaries.sh |
```

##### Step 14 Verification Checklist

- [ ] `04-hivemind-compatibility.md` is >200 lines
- [ ] `01-routing-logic.md` includes all new skill routing entries
- [ ] `03-stacking-rules.md` includes new stacking recipes

#### Step 14 STOP & COMMIT

---

## Step 15: Create `migration-workflow` skill

### What
New skill for 4-phase HiveMind V3 migration with boundary enforcement scripts.

### Instructions

- [ ] Create directory structure:
```bash
mkdir -p .skills-lab/refactoring-skills/migration-workflow/{scripts,references,evals}
```

- [ ] Create SKILL.md following the same template as Step 4 with:
  - `name: migration-workflow`
  - `description: Use when migrating from harness-experiment to HiveMind V3 architecture. Covers 4-phase migration, feature flags, rollback protocols, parallel implementations, boundary enforcement. Triggers on "migrate to v3", "v3 migration", "hivemind migration", "phase migration", "rollback protocol".`

- [ ] Create 6 reference files:
  - `01-phase-1-port-core.md` — Port engine, tools, hooks, shared libs
  - `02-phase-2-eliminate-bloat.md` — Remove product-detox services
  - `03-phase-3-simplify-plugin.md` — Assemble plugin entry <100 LOC
  - `04-phase-4-boundaries.md` — Establish clean module boundaries
  - `05-feature-flags.md` — Feature flag patterns for parallel old/new
  - `06-rollback-protocols.md` — Git branch per phase, revert procedures

- [ ] Create 4 boundary enforcement scripts:
  - `check-module-size.sh` — 500 LOC check per .ts file
  - `check-plugin-size.sh` — 99 LOC check for plugin entry
  - `check-circular-deps.sh` — Detect import cycles
  - `check-tool-count.sh` — Max 5 tools per plugin

- [ ] Create `evals/evals.json` with 4 TCs (one per phase) and `evals/trigger-queries.json`

##### Step 15 Verification Checklist

- [ ] SKILL.md frontmatter valid
- [ ] All 4 scripts pass `bash -n`
- [ ] All eval cases valid JSON
- [ ] All reference files exist and are populated

#### Step 15 STOP & COMMIT

---

## Step 16: Add end-to-end chain test to eval harness

### What
Add chain-5.json testing full LAYER 0→4 chain with real HiveMind V3 task.

### Instructions

- [ ] Copy and paste code below into `.skills-lab/refactoring-skills/eval-harness/chain-evals/chain-5.json`:

```json
{
  "id": "chain-5",
  "name": "HiveMind V3: Create Runtime Status Tool",
  "description": "End-to-end chain test: meta-builder → user-intent → planning → coordinating → use-authoring-tools",
  "steps": [
    {
      "step": 1,
      "skill": "meta-builder",
      "prompt": "create a custom tool for runtime status inspection",
      "expected_routing": {
        "primary_skill": "use-authoring-tools",
        "group": "GROUP_2"
      },
      "assertions": [
        {"text": "preflight.sh exits 0"},
        {"text": "stdout contains PRIMARY_SKILL=use-authoring-tools"}
      ]
    },
    {
      "step": 2,
      "skill": "use-authoring-tools",
      "prompt": "create a tool that shows runtime status including session count and active agents",
      "expected_artifacts": [
        ".opencode/tools/runtime-status.ts"
      ],
      "assertions": [
        {"text": "validate-tool.sh exits 0"},
        {"text": "output contains tool("},
        {"text": "output contains description:"}
      ]
    },
    {
      "step": 3,
      "skill": "typescript-module-architect",
      "prompt": "validate the new tool module boundaries",
      "assertions": [
        {"text": "validate-module-boundaries.sh exits 0"},
        {"text": "output contains PASS"}
      ]
    },
    {
      "step": 4,
      "skill": "use-authoring-tools",
      "prompt": "test the tool executes correctly",
      "assertions": [
        {"text": "output contains Session"},
        {"text": "output contains Agent"}
      ]
    },
    {
      "step": 5,
      "skill": "use-authoring-tools",
      "prompt": "commit the tool",
      "assertions": [
        {"text": "output contains commit"},
        {"text": "output contains runtime-status"}
      ]
    }
  ]
}
```

##### Step 16 Verification Checklist

- [ ] `chain-5.json` is valid JSON
- [ ] All 5 steps have assertions
- [ ] Expected routing matches meta-builder preflight.sh output

#### Step 16 STOP & COMMIT

---

## Step 17: Add ralph-loop TypeScript recipe

### What
Add TypeScript development ralph-loop recipe to coordinating-loop.

### Instructions

- [ ] Append the following to `.skills-lab/refactoring-skills/coordinating-loop/references/04-ralph-loop-integration.md`:

```markdown
## Ralph-Loop Recipe: TypeScript Development

```
Phase: VERIFY
Gate: TypeScript Compilation + Tests + Lint + Boundaries
Max Cycles: 3

Cycle:
  1. Run: tsc --noEmit                     # Type check
     Gate: Exit 0 = pass, Exit 1 = fail
     On fail: Read errors, fix TypeScript issues, re-run

  2. Run: bun test                         # Unit tests
     Gate: Exit 0 = all pass, Exit 1 = failures
     On fail: Read failures, fix test logic, re-run

  3. Run: eslint src/                      # Lint check
     Gate: Exit 0 = clean, Exit 1 = violations
     On fail: Read violations, fix code style, re-run

  4. Run: bash scripts/check-circular-deps.sh src/  # Boundary check
     Gate: Exit 0 = no cycles, Exit 1 = cycles found
     On fail: Read cycle report, refactor imports, re-run

  5. Run: bash scripts/check-module-size.sh src/    # LOC check
     Gate: Exit 0 = all <=500, Exit 1 = oversized
     On fail: Read oversized modules, split them, re-run

After 3 cycles with failures:
  → ESCALATE: Summarize what was tried, what failed, what is needed
  → Stop and ask user for direction
```

### Gate Table

| Gate | Command | Pass | Fail |
|------|---------|------|------|
| TypeScript compile | `tsc --noEmit` | exit 0 | exit 1 |
| Unit tests | `bun test` | exit 0 | exit 1 |
| Lint | `eslint src/` | exit 0 | exit 1 |
| Circular deps | `check-circular-deps.sh src/` | exit 0 | exit 1 |
| Module size | `check-module-size.sh src/` | exit 0 | exit 1 |
```

##### Step 17 Verification Checklist

- [ ] `04-ralph-loop-integration.md` includes the new TypeScript recipe
- [ ] Gate table has all 5 gates with correct commands

#### Step 17 STOP & COMMIT

---

## Step 18: Update planning-with-files for migration task type

### What
Add "Migration" task type to phase generation table.

### Instructions

- [ ] Edit `.skills-lab/refactoring-skills/planning-with-files/SKILL.md`
- [ ] Find the "Phase Generation Rules" table and add a new row:

```markdown
| **Migration** | Analyze → Port → Test → Eliminate → Verify | Current state analysis, port modules, run tests, eliminate bloat, verify boundaries |
```

- [ ] Edit `.skills-lab/refactoring-skills/planning-with-files/references/01-file-structure.md`
- [ ] Add after the existing task classification section:

```markdown
## Migration Phase Schema

```
Task classification for migration:
1. What is the target architecture?
2. What modules need to be ported? (Yes → Migration)
3. Are there modules to eliminate? (Yes → Elimination phase)
4. Are there boundary checks needed? (Yes → Verification phase)
```

Phase count: 3-5. Beyond 5, split into sub-migrations.

### Migration Phases

| Phase | Title | Description |
|-------|-------|-------------|
| 1 | Analyze | Map current architecture, identify modules to port/eliminate |
| 2 | Port | Move modules to target architecture with feature flags |
| 3 | Test | Run full test suite, verify no regressions |
| 4 | Eliminate | Remove old code, clean up dead references |
| 5 | Verify | Run boundary checks (LOC, circular deps, tool count) |
```

##### Step 18 Verification Checklist

- [ ] SKILL.md phase generation table includes Migration row
- [ ] 01-file-structure.md includes migration phase schema

#### Step 18 STOP & COMMIT

---

## Step 19: Final validation — full eval harness + chain tests

### What
Run complete eval harness across all skills, verify all pass.

### Instructions

- [ ] Run `bash -n` on all new shell scripts:
```bash
for f in .skills-lab/refactoring-skills/*/scripts/*.sh; do
  bash -n "$f" && echo "PASS: $f" || echo "FAIL: $f"
done
```

- [ ] Validate all SKILL.md frontmatter:
```bash
for f in .skills-lab/refactoring-skills/*/SKILL.md; do
  if head -1 "$f" | grep -q '^---$'; then
    echo "PASS: $f has frontmatter"
  else
    echo "FAIL: $f missing frontmatter"
  fi
done
```

- [ ] Run the full eval harness:
```bash
cd .skills-lab/refactoring-skills/eval-harness
python3 eval_runner.py
```

- [ ] Verify all trigger-queries.json files are valid JSON:
```bash
for f in .skills-lab/refactoring-skills/*/evals/trigger-queries.json; do
  python3 -m json.tool "$f" > /dev/null && echo "PASS: $f" || echo "FAIL: $f"
done
```

##### Step 19 Verification Checklist

- [ ] All shell scripts pass `bash -n`
- [ ] All SKILL.md files have valid frontmatter
- [ ] Eval harness pass rate >95%
- [ ] All evals.json files are valid JSON
- [ ] All trigger-queries.json files are valid JSON

#### Step 19 STOP & COMMIT

---

## Step 20: Update SOT docs and commit

### What
Update task_plan.md, progress.md, findings.md with new skill inventory and status.

### Instructions

- [ ] Update `.skills-lab/task_plan.md` — add all new skills to the plan
- [ ] Update `.skills-lab/progress.md` — log all changes made
- [ ] Update `.skills-lab/findings.md` — record locked decisions
- [ ] Run final git status check:
```bash
git status
git diff --stat
```

##### Step 20 Verification Checklist

- [ ] task_plan.md includes all 15+ skills
- [ ] progress.md logs all steps completed
- [ ] findings.md records key decisions
- [ ] All changes committed

#### Step 20 STOP & COMMIT

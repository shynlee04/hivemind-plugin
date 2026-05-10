# Phase 7f + 7g: Integration Fixes + System-Wide Re-Validation

## Goal
Fix broken cross-references, create state bridge between `.hivemind/state/` and harness continuity, fix agent `instruction` → `instructions` field across 4 agents, and validate all 4 fixed skills + 3 agents against HIVEFIVER-PLAYBOOK and universal-rules.md.

## Prerequisites
- Ensure you are on the `harness-experiment` worktree branch
- All Phase 7a-7e fixes are already applied and committed
- Git status should be clean before starting

---

## Step 1: Fix Duplicate Content in session-context-protocol.md

The reference file for session-context-manager has a duplicated paragraph that needs cleanup.

- [ ] Read the file to confirm duplicate paragraphs
- [ ] Remove the duplicate paragraph
- [ ] Verify file still has complete content

```markdown
File: .opencode/skills/session-context-manager/references/session-context-protocol.md
```

**Action:** The file has this paragraph duplicated (appears twice consecutively):

```
**Discovery pattern:** The file lives at a project-relative path under the workspace root. The conventional location is `.hivemind/state/session-context-prompt.md`, but agents should discover it relative to the workspace root rather than assuming a fixed absolute path.
<workspace-root>/.hivemind/state/session-context-prompt.md
```

Remove the duplicate block (lines ~12-15 in the file). Keep only one instance.

Also remove the duplicate paragraph in the Context Injection Format section:

```
Append this block to every subagent prompt before dispatching work. Do not use `--constraint` flags — OpenCode has no such flag. Context flows through prompt text only.
```

This paragraph appears twice — keep only one.

##### Step 1 Verification Checklist
- [ ] No duplicate paragraphs in the file
- [ ] File still contains complete protocol documentation
- [ ] All YAML examples are intact
- [ ] `wc -l` shows reduced line count vs original (~450 lines → ~440)

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Run `git status`, review changes, then `git add` and `git commit -m "phase-7f: remove duplicate paragraphs in session-context-protocol.md — cleaner reference"` — wait for user confirmation.

---

## Step 2: Fix Agent `instruction` → `instructions` Field

The HIVEFIVER-PLAYBOOK specifies `instructions` (plural) as the correct field name. Four agents use `instruction` (singular).

- [ ] Fix `.opencode/agents/hivefiver-orchestrator.md`
- [ ] Fix `.opencode/agents/intent-loop.md`
- [ ] Fix `.opencode/agents/spec-verifier.md`
- [ ] Fix `.opencode/agents/phase-guardian.md`

### Agent 1: hivefiver-orchestrator.md

**File:** `.opencode/agents/hivefiver-orchestrator.md`

**Current frontmatter (lines ~1-35):**
```yaml
---
name: "hivefiver-orchestrator"
description: "Meta-builder orchestrator for HiveMind..."
mode: primary
temperature: 0.2
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  edit: allow
  ...
```

**Fix:** Change `instruction` to `instructions`:
```yaml
---
name: "hivefiver-orchestrator"
description: "Meta-builder orchestrator for HiveMind. Routes meta-concept requests (skills, agents, commands, tools) to specialist subagents via the Task tool, manages delegation cycles, and maintains quality gates. Spawned by /hf-create, /hf-audit, /hf-stack, /hf-prompt-enhance commands."
mode: primary
temperature: 0.2
instructions: [.opencode/rules/*.md]
permission:
  read: allow
  edit: allow
  write: allow
  bash:
    "*": allow
    "git status*": allow
    "git diff*": allow
    "git log*": allow
    "ls*": allow
    "find*": allow
    "cat*": allow
    "grep*": allow
    "rm -f*": allow
    "mkdir*": allow
  task: allow
  skill:
    "*": ask
    "meta-builder": allow
    "use-authoring-skills": allow
    "agents-and-subagents-dev": allow
    "command-dev": allow
    "custom-tools-dev": allow
    "opencode-platform-reference": allow
    "skill-creator": allow
    "skill-judge": allow
    "coordinating-loop": allow
    "planning-with-files": allow
    "repomix-explorer": allow
  glob: allow
  grep: allow
  webfetch: allow
---
```

### Agent 2: intent-loop.md

**File:** `.opencode/agents/intent-loop.md`

**Current frontmatter:**
```yaml
---
description: "Specialist for Phase 0 intent clarification..."
mode: subagent
temperature: 0.2
steps: 50
instruction: [".opencode/rules/anti-patterns.md", ".opencode/rules/skill-activation.md"]
permission:
  ...
```

**Fix:** Change `instruction` to `instructions` and add `name` field (optional but recommended for consistency):
```yaml
---
name: intent-loop
description: "Specialist for Phase 0 intent clarification and draft spec creation. Uses question tool iteratively until fully understanding user intent. Describes granular features from user journey perspective. Designed for non-technical users. Triggers on: 'clarify intent', 'draft specification', 'intent loop'."
mode: subagent
temperature: 0.2
steps: 50
instructions: [".opencode/rules/anti-patterns.md", ".opencode/rules/skill-activation.md"]
permission:
  read:
    "*": ask
    "*.md": allow
    "*.json": allow
    "*.ts": allow
    "*.yaml": allow
    "*.yml": allow
  edit:
    "*": ask
  write:
    "*": ask
    ".opencode/**/*.md": allow
  bash:
    "*": ask
  task:
    "*": ask
  skill:
    "*": ask
    "brainstorming": allow
    "use-authoring-skills": allow
  glob: allow
  grep: allow
  webfetch: ask
  websearch: ask
---
```

### Agent 3: spec-verifier.md

**File:** `.opencode/agents/spec-verifier.md`

**Current frontmatter:**
```yaml
---
name: spec-verifier
description: "Phase 1 specialist for spec verification loop..."
mode: subagent
temperature: 0.1
steps: 60
instruction: [".opencode/rules/anti-patterns.md", ".opencode/rules/skill-activation.md"]
permission:
  ...
```

**Fix:** Change `instruction` to `instructions`:
```yaml
---
name: spec-verifier
description: "Phase 1 specialist for spec verification loop. Triggers on: 'verify spec', 'spec verification loop', 'check requirements'. Handles Check-Revise-Escalate cycle for spec compliance."
mode: subagent
temperature: 0.1
steps: 60
instructions: [".opencode/rules/anti-patterns.md", ".opencode/rules/skill-activation.md"]
permission:
  read:
    "*": allow
    "*.md": allow
    "*.ts": allow
    "*.json": allow
  edit:
    "*": ask
    "**/specs/**": allow
    "**/.opencode/**": allow
  write:
    "*": ask
    "**/specs/**": allow
    "**/.opencode/**": allow
  bash: ask
  task: ask
  skill:
    "*": ask
    "use-authoring-skills": allow
    "planning-with-files": allow
  glob: allow
  grep: allow
  webfetch: ask
---
```

### Agent 4: phase-guardian.md

**File:** `.opencode/agents/phase-guardian.md`

**Current frontmatter:**
```yaml
---
name: phase-guardian
description: "Specialist for phase guardrails and loop termination..."
mode: subagent
temperature: 0.25
steps: 60
instruction: [".opencode/rules/anti-patterns.md", ".opencode/rules/execution-loop.md"]
permission:
  ...
```

**Fix:** Change `instruction` to `instructions`:
```yaml
---
name: phase-guardian
description: "Specialist for phase guardrails and loop termination. Use when managing intra-phase iterations, validating completion criteria, enforcing authorization gates, or determining phase exit. Triggers on: 'guardrail loops', 'phase exit decision', 'validate completion', 'max iterations reached', 'checkpoint authorization'."
mode: subagent
temperature: 0.25
steps: 60
instructions: [".opencode/rules/anti-patterns.md", ".opencode/rules/execution-loop.md"]
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    "*": ask
    "git status*": allow
    "git diff*": allow
    "git log*": allow
  task: ask
  delegate-task: ask
  skill:
    "*": ask
    "agent-authorization": allow
    "use-authoring-skills": allow
  glob: allow
  grep: allow
  webfetch: ask
---
```

##### Step 2 Verification Checklist
- [ ] All 4 agents have `instructions` (not `instruction`)
- [ ] All 4 agents have `steps` field present
- [ ] No `name` field conflicts with filename
- [ ] YAML frontmatter parses without errors (validate with any YAML parser)
- [ ] All referenced rule files exist: `.opencode/rules/anti-patterns.md`, `.opencode/rules/skill-activation.md`, `.opencode/rules/execution-loop.md`

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Run `git status`, review changes, then `git add` and `git commit -m "phase-7f: fix instruction → instructions in 4 agents per HIVEFIVER-PLAYBOOK spec"` — wait for user confirmation.

---

## Step 3: Create State Bridge Mechanism

Create a thin bridge file that documents the relationship between `.hivemind/state/` (session context) and the harness continuity system at `.opencode/state/opencode-harness/`.

- [ ] Create the state bridge documentation file
- [ ] Create a validation script that checks both state directories

### Create State Bridge Documentation

**File:** `.hivemind/state/STATE-BRIDGE.md`

```markdown
# State Bridge — Session Context ↔ Harness Continuity

## Purpose

This document bridges two state systems that coexist in the HiveMind V3 project:

1. **`.hivemind/state/`** — Session context, phase tracking, and task state (soft meta-concepts)
2. **`.opencode/state/opencode-harness/`** — Harness continuity JSON (hard runtime state)

## Directory Map

### HiveMind State (`.hivemind/state/`)

| File | Purpose | Format |
|------|---------|--------|
| `session-context-prompt.md` | Primary session context with YAML frontmatter | Markdown + YAML |
| `task_plan.md` | Multi-phase task plan | Markdown |
| `findings.md` | Work tracking discoveries | Markdown |
| `progress.md` | Session progress log | Markdown |
| `SESSION-STATE.md` | Current session state snapshot | Markdown |
| `.patches/` | Backup patches from state changes | Markdown |

### Harness Continuity (`.opencode/state/opencode-harness/`)

| File | Purpose | Format |
|------|---------|--------|
| `session-continuity.json` | Durable JSON state for delegation chains, lifecycle, concurrency | JSON |

## Bridge Rules

1. **Session context is the planning layer** — `.hivemind/state/` tracks what the agent *intends* to do
2. **Harness continuity is the execution layer** — `.opencode/state/opencode-harness/` tracks what the agent *actually did*
3. **No direct writes between systems** — Neither system should modify the other's files
4. **Session ID correlation** — The `session_id` in session-context-prompt.md should match the session key in session-continuity.json

## Validation Script

To verify both state systems are healthy:

```bash
#!/usr/bin/env bash
# validate-state.sh — Check both state directories
set -euo pipefail

STATE_DIR=".hivemind/state"
HARNESS_DIR=".opencode/state/opencode-harness"

errors=0

echo "=== HiveMind State Check ==="
if [ -d "$STATE_DIR" ]; then
  echo "✓ $STATE_DIR exists"
  for f in session-context-prompt.md task_plan.md findings.md progress.md; do
    if [ -f "$STATE_DIR/$f" ]; then
      echo "  ✓ $f exists ($(wc -l < "$STATE_DIR/$f") lines)"
    else
      echo "  ✗ $f missing"
      ((errors++))
    fi
  done
else
  echo "✗ $STATE_DIR not found"
  ((errors++))
fi

echo ""
echo "=== Harness Continuity Check ==="
if [ -d "$HARNESS_DIR" ]; then
  echo "✓ $HARNESS_DIR exists"
  if [ -f "$HARNESS_DIR/session-continuity.json" ]; then
    echo "  ✓ session-continuity.json exists"
    if command -v python3 &>/dev/null; then
      if python3 -c "import json; json.load(open('$HARNESS_DIR/session-continuity.json'))" 2>/dev/null; then
        echo "  ✓ Valid JSON"
      else
        echo "  ✗ Invalid JSON"
        ((errors++))
      fi
    fi
  else
    echo "  ⚠ session-continuity.json not found (may be first session)"
  fi
else
  echo "  ⚠ $HARNESS_DIR not found (harness may not be initialized)"
fi

echo ""
if [ $errors -eq 0 ]; then
  echo "✅ All state checks passed"
  exit 0
else
  echo "❌ $errors state check(s) failed"
  exit 1
fi
```

**Location:** `.hivemind/state/scripts/validate-state.sh`

Make executable: `chmod +x .hivemind/state/scripts/validate-state.sh`

##### Step 3 Verification Checklist
- [ ] `.hivemind/state/STATE-BRIDGE.md` exists and is readable
- [ ] `.hivemind/state/scripts/validate-state.sh` exists and is executable
- [ ] Running `bash .hivemind/state/scripts/validate-state.sh` passes (exit 0)
- [ ] All referenced state files either exist or have appropriate warnings

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Run `git status`, review changes, then `git add` and `git commit -m "phase-7f: add state bridge docs + validation script between hivemind and harness"` — wait for user confirmation.

---

## Step 4: Validate All 4 Fixed Skills Against HIVEFIVER-PLAYBOOK

Run systematic validation of the 4 skills that were fixed in Phase 7a-7d. Each must pass the playbook's validation gate.

### Validation Script

**File:** `.opencode/skills/validate-all-skills.sh`

```bash
#!/usr/bin/env bash
# validate-all-skills.sh — Validate all fixed skills against HIVEFIVER-PLAYBOOK rules
set -euo pipefail

SKILLS_DIR=".opencode/skills"
errors=0
passes=0

check_skill() {
  local skill_name="$1"
  local skill_dir="$SKILLS_DIR/$skill_name"
  local skill_file="$skill_dir/SKILL.md"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Validating: $skill_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ ! -f "$skill_file" ]; then
    echo "  ✗ SKILL.md not found"
    ((errors++))
    return
  fi
  
  # 1. Check frontmatter exists
  if ! head -1 "$skill_file" | grep -q "^---"; then
    echo "  ✗ Missing YAML frontmatter opening"
    ((errors++))
    return
  fi
  
  # 2. Check name field
  if ! grep -q "^name:" "$skill_file"; then
    echo "  ✗ Missing 'name' field in frontmatter"
    ((errors++))
  else
    echo "  ✓ 'name' field present"
  fi
  
  # 3. Check description field
  if ! grep -q "^description:" "$skill_file"; then
    echo "  ✗ Missing 'description' field"
    ((errors++))
  else
    echo "  ✓ 'description' field present"
  fi
  
  # 4. Check description has trigger phrases
  if grep -qi "use when" "$skill_file" && grep -qi "triggers" "$skill_file"; then
    echo "  ✓ Description has trigger phrases"
  elif grep -qi "use when" "$skill_file"; then
    echo "  ⚠ Description has 'use when' but no 'triggers' — consider adding"
  else
    echo "  ✗ Description missing trigger phrases"
    ((errors++))
  fi
  
  # 5. Check allowed-tools format (YAML list or omitted)
  if grep -q "^allowed-tools:" "$skill_file"; then
    if grep -A1 "^allowed-tools:" "$skill_file" | grep -q "^\s*- "; then
      echo "  ✓ allowed-tools is proper YAML list"
    else
      echo "  ✗ allowed-tools is NOT a proper YAML list (space-separated string)"
      ((errors++))
    fi
  else
    echo "  ✓ allowed-tools omitted (valid per agentskills.io)"
  fi
  
  # 6. Check no banned fields
  if grep -q "^compatibility:" "$skill_file"; then
    echo "  ✗ Banned 'compatibility' field found"
    ((errors++))
  else
    echo "  ✓ No banned fields"
  fi
  
  # 7. Check referenced files exist
  local refs
  refs=$(grep -oP 'references/[^ ]+' "$skill_file" 2>/dev/null || true)
  for ref in $refs; do
    if [ -f "$skill_dir/$ref" ]; then
      echo "  ✓ Reference exists: $ref"
    else
      echo "  ✗ Reference missing: $ref"
      ((errors++))
    fi
  done
  
  # 8. Check SKILL.md body uses imperative form
  local declarative_count
  declarative_count=$(grep -ci "this skill handles\|the agent should" "$skill_file" 2>/dev/null || echo "0")
  if [ "$declarative_count" -gt 0 ]; then
    echo "  ⚠ Body has $declarative_count declarative statements (should be imperative)"
  else
    echo "  ✓ Body uses imperative form"
  fi
  
  # 9. Check line count (not bloated)
  local line_count
  line_count=$(wc -l < "$skill_file")
  if [ "$line_count" -gt 800 ]; then
    echo "  ✗ SKILL.md is $line_count lines (max 800 per playbook)"
    ((errors++))
  else
    echo "  ✓ SKILL.md is $line_count lines (under 800 limit)"
  fi
  
  echo ""
  if [ $errors -eq 0 ]; then
    ((passes++))
  fi
}

# Validate the 4 fixed skills
check_skill "session-context-manager"
check_skill "phase-loop"
check_skill "command-parser"
check_skill "agent-authorization"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passed: $passes / 4"
echo "Errors: $errors"

if [ $errors -eq 0 ]; then
  echo "✅ All skills pass validation"
  exit 0
else
  echo "❌ $errors issue(s) found — review output above"
  exit 1
fi
```

Make executable: `chmod +x .opencode/skills/validate-all-skills.sh`

### Run the validation

- [ ] Run `bash .opencode/skills/validate-all-skills.sh`
- [ ] Review any failures
- [ ] Fix any issues found

##### Step 4 Verification Checklist
- [ ] Script runs without errors (exit 0)
- [ ] All 4 skills pass validation
- [ ] No broken file references
- [ ] No banned fields in frontmatter
- [ ] All descriptions have trigger phrases
- [ ] allowed-tools is proper YAML list or omitted

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** If validation passes, run `git add` and `git commit -m "phase-7g: add skill validation script + validate all 4 fixed skills"` — wait for user confirmation.

---

## Step 5: Validate All 3 Target Agents Against HIVEFIVER-PLAYBOOK

Validate intent-loop, spec-verifier, and phase-guardian against the playbook's agent definition rules.

### Validation Script

**File:** `.opencode/agents/validate-agents.sh`

```bash
#!/usr/bin/env bash
# validate-agents.sh — Validate agents against HIVEFIVER-PLAYBOOK rules
set -euo pipefail

AGENTS_DIR=".opencode/agents"
errors=0
passes=0

check_agent() {
  local agent_file="$AGENTS_DIR/$1"
  local agent_name="$1"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Validating: $agent_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ ! -f "$agent_file" ]; then
    echo "  ✗ File not found"
    ((errors++))
    return
  fi
  
  # 1. Check frontmatter exists
  if ! head -1 "$agent_file" | grep -q "^---"; then
    echo "  ✗ Missing YAML frontmatter"
    ((errors++))
    return
  fi
  
  # 2. Check required fields: description, mode, steps
  for field in description mode steps; do
    if grep -q "^${field}:" "$agent_file"; then
      echo "  ✓ '$field' field present"
    else
      echo "  ✗ Missing required field: '$field'"
      ((errors++))
    fi
  done
  
  # 3. Check instructions (plural) not instruction (singular)
  if grep -q "^instruction:" "$agent_file"; then
    echo "  ✗ Uses 'instruction' (singular) — should be 'instructions'"
    ((errors++))
  elif grep -q "^instructions:" "$agent_file"; then
    echo "  ✓ Uses 'instructions' (plural)"
  else
    echo "  ⚠ No 'instructions' field — agent has no rule references"
  fi
  
  # 4. Check no 'name' field in frontmatter (name comes from filename)
  if grep -q "^name:" "$agent_file"; then
    echo "  ⚠ 'name' field in frontmatter — name should come from filename"
  else
    echo "  ✓ No redundant 'name' field"
  fi
  
  # 5. Check permission structure
  if grep -q "^permission:" "$agent_file"; then
    echo "  ✓ Permission block present"
    
    # Check read permission
    if grep -A1 "^permission:" "$agent_file" | grep -q "read:"; then
      echo "  ✓ Read permission defined"
    else
      echo "  ✗ Read permission not defined"
      ((errors++))
    fi
    
    # Check edit permission
    if grep -q "edit:" "$agent_file"; then
      echo "  ✓ Edit permission defined"
    else
      echo "  ✗ Edit permission not defined"
      ((errors++))
    fi
  else
    echo "  ✗ No permission block"
    ((errors++))
  fi
  
  # 6. Check referenced instruction files exist
  local instr_files
  instr_files=$(grep -oP '\.opencode/rules/[^"]+' "$agent_file" 2>/dev/null || true)
  for instr in $instr_files; do
    # Remove glob characters for file check
    local clean_path
    clean_path=$(echo "$instr" | sed 's/\*//g' | sed 's/\[\]//g')
    if [ -f "$clean_path" ]; then
      echo "  ✓ Instruction file exists: $instr"
    elif [ -f "$instr" ]; then
      echo "  ✓ Instruction file exists: $instr"
    else
      # Try glob match
      local dir
      dir=$(dirname "$clean_path")
      if [ -d "$dir" ]; then
        echo "  ✓ Instruction directory exists: $instr"
      else
        echo "  ✗ Instruction file missing: $instr"
        ((errors++))
      fi
    fi
  done
  
  # 7. Check not using generic agent types
  if grep -qi "general.*agent\|explore.*agent\|plan.*agent" "$agent_file"; then
    echo "  ✗ References generic agent types"
    ((errors++))
  else
    echo "  ✓ No generic agent type references"
  fi
  
  echo ""
  if [ $errors -eq 0 ]; then
    ((passes++))
  fi
}

# Validate the 3 target agents
check_agent "intent-loop.md"
check_agent "spec-verifier.md"
check_agent "phase-guardian.md"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AGENT VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passed: $passes / 3"
echo "Errors: $errors"

if [ $errors -eq 0 ]; then
  echo "✅ All agents pass validation"
  exit 0
else
  echo "❌ $errors issue(s) found — review output above"
  exit 1
fi
```

Make executable: `chmod +x .opencode/agents/validate-agents.sh`

### Run the validation

- [ ] Run `bash .opencode/agents/validate-agents.sh`
- [ ] Review any failures
- [ ] Fix any issues found (the `instruction` → `instructions` fix from Step 2 should resolve the main issue)

##### Step 5 Verification Checklist
- [ ] Script runs without errors (exit 0)
- [ ] All 3 agents pass validation
- [ ] All agents use `instructions` (not `instruction`)
- [ ] All agents have `steps` field
- [ ] All agents have `permission` block
- [ ] All referenced rule files exist

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** If validation passes, run `git add` and `git commit -m "phase-7g: add agent validation script + validate intent-loop, spec-verifier, phase-guardian"` — wait for user confirmation.

---

## Step 6: Fix Broken Cross-References Across All Skills

Run a comprehensive scan for any broken file references in all 108 skill files.

- [ ] Run the cross-reference checker script
- [ ] Fix any broken references found

### Cross-Reference Checker Script

**File:** `.opencode/skills/check-cross-refs.sh`

```bash
#!/usr/bin/env bash
# check-cross-refs.sh — Find broken file references across all skills
set -euo pipefail

SKILLS_DIR=".opencode/skills"
errors=0
checked=0

echo "Scanning all skills for broken references..."
echo ""

for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"
  
  if [ ! -f "$skill_file" ]; then
    continue
  fi
  
  ((checked++))
  skill_errors=0
  
  # Check <files_to_read> references
  local_refs=$(grep -oP '(?<=<files_to_read>\s*\n)[^-]*(?=\n\s*</files_to_read>)' "$skill_file" 2>/dev/null || true)
  # Simpler approach: find any references/ paths mentioned
  refs=$(grep -oP 'references/[^ )`]+' "$skill_file" 2>/dev/null || true)
  
  for ref in $refs; do
    full_path="$skill_dir/$ref"
    if [ ! -f "$full_path" ]; then
      echo "✗ $skill_name: broken reference → $ref"
      ((errors++))
      ((skill_errors++))
    fi
  done
  
  # Check script references
  scripts=$(grep -oP 'scripts/[^ )`]+' "$skill_file" 2>/dev/null || true)
  for script in $scripts; do
    full_path="$skill_dir/$script"
    if [ ! -f "$full_path" ]; then
      echo "✗ $skill_name: broken reference → $script"
      ((errors++))
      ((skill_errors++))
    fi
  done
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CROSS-REFERENCE CHECK SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Skills checked: $checked"
echo "Broken references: $errors"

if [ $errors -eq 0 ]; then
  echo "✅ No broken references found"
  exit 0
else
  echo "❌ $errors broken reference(s) found — fix each one"
  exit 1
fi
```

Make executable: `chmod +x .opencode/skills/check-cross-refs.sh`

### Run and fix

- [ ] Run `bash .opencode/skills/check-cross-refs.sh`
- [ ] For each broken reference found:
  - Either create the missing file
  - Or remove the dead reference from SKILL.md
- [ ] Re-run until all pass

##### Step 6 Verification Checklist
- [ ] Script exits with 0 (no broken references)
- [ ] All SKILL.md files reference only existing files
- [ ] No dead links in any skill
- [ ] All `references/` directories have real content (not stubs)

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Once all cross-refs are clean, run `git add` and `git commit -m "phase-7f: fix broken cross-references across skills"` — wait for user confirmation.

---

## Step 7: Final System-Wide Validation and Report

Run a comprehensive end-to-end validation that ties everything together.

- [ ] Create and run the final validation script
- [ ] Update task_plan.md with completion status
- [ ] Generate final report

### Final Validation Script

**File:** `.opencode/skills/final-validation.sh`

```bash
#!/usr/bin/env bash
# final-validation.sh — Complete Phase 7f+7g system-wide validation
set -euo pipefail

total_errors=0

echo "═══════════════════════════════════════════"
echo "PHASE 7f + 7g: SYSTEM-WIDE VALIDATION"
echo "═══════════════════════════════════════════"
echo ""

# 1. State Bridge Validation
echo "1. STATE BRIDGE"
echo "───────────────────────────────────────────"
if [ -f ".hivemind/state/STATE-BRIDGE.md" ]; then
  echo "✓ State bridge documentation exists"
else
  echo "✗ State bridge documentation missing"
  ((total_errors++))
fi

if [ -x ".hivemind/state/scripts/validate-state.sh" ]; then
  if bash .hivemind/state/scripts/validate-state.sh; then
    echo "✓ State validation passes"
  else
    echo "✗ State validation fails"
    ((total_errors++))
  fi
else
  echo "✗ State validation script not found or not executable"
  ((total_errors++))
fi
echo ""

# 2. Skill Validation
echo "2. SKILL VALIDATION (4 fixed skills)"
echo "───────────────────────────────────────────"
if [ -x ".opencode/skills/validate-all-skills.sh" ]; then
  if bash .opencode/skills/validate-all-skills.sh; then
    echo "✓ All skills pass validation"
  else
    echo "✗ Some skills fail validation"
    ((total_errors++))
  fi
else
  echo "✗ Skill validation script not found"
  ((total_errors++))
fi
echo ""

# 3. Agent Validation
echo "3. AGENT VALIDATION (3 target agents)"
echo "───────────────────────────────────────────"
if [ -x ".opencode/agents/validate-agents.sh" ]; then
  if bash .opencode/agents/validate-agents.sh; then
    echo "✓ All agents pass validation"
  else
    echo "✗ Some agents fail validation"
    ((total_errors++))
  fi
else
  echo "✗ Agent validation script not found"
  ((total_errors++))
fi
echo ""

# 4. Cross-Reference Check
echo "4. CROSS-REFERENCE CHECK"
echo "───────────────────────────────────────────"
if [ -x ".opencode/skills/check-cross-refs.sh" ]; then
  if bash .opencode/skills/check-cross-refs.sh; then
    echo "✓ No broken cross-references"
  else
    echo "✗ Broken cross-references found"
    ((total_errors++))
  fi
else
  echo "✗ Cross-reference checker not found"
  ((total_errors++))
fi
echo ""

# 5. Universal Rules Compliance
echo "5. UNIVERSAL RULES COMPLIANCE"
echo "───────────────────────────────────────────"
if [ -f ".opencode/rules/universal-rules.md" ]; then
  echo "✓ Universal rules file exists"
  
  # Check no skill references GSD paths
  gsd_refs=$(grep -r "\$HOME/.claude\|~/.claude\|gsd-tools" .opencode/skills/*/SKILL.md 2>/dev/null || true)
  if [ -z "$gsd_refs" ]; then
    echo "✓ No GSD CLI dependencies in skills"
  else
    echo "✗ GSD CLI dependencies found:"
    echo "$gsd_refs"
    ((total_errors++))
  fi
  
  # Check no hardcoded home paths
  home_paths=$(grep -r "/Users/" .opencode/skills/*/SKILL.md 2>/dev/null || true)
  if [ -z "$home_paths" ]; then
    echo "✓ No hardcoded home paths in skills"
  else
    echo "✗ Hardcoded home paths found:"
    echo "$home_paths"
    ((total_errors++))
  fi
else
  echo "✗ Universal rules file missing"
  ((total_errors++))
fi
echo ""

# 6. Playbook Compliance
echo "6. PLAYBOOK COMPLIANCE"
echo "───────────────────────────────────────────"
if [ -f ".hivefiver-meta-builder/references-lab/active/refactoring/HIVEFIVER-PLAYBOOK.md" ]; then
  echo "✓ HIVEFIVER-PLAYBOOK exists"
  
  # Check all skills have <files_to_read> blocks or don't need them
  for skill_dir in .opencode/skills/*/; do
    skill_name=$(basename "$skill_dir")
    skill_file="$skill_dir/SKILL.md"
    [ -f "$skill_file" ] || continue
    
    # Check YAML frontmatter is valid
    if head -1 "$skill_file" | grep -q "^---"; then
      # Find closing ---
      line_num=$(grep -n "^---$" "$skill_file" | head -2 | tail -1 | cut -d: -f1)
      if [ -n "$line_num" ]; then
        echo "  ✓ $skill_name: valid frontmatter"
      else
        echo "  ✗ $skill_name: unclosed frontmatter"
        ((total_errors++))
      fi
    fi
  done
else
  echo "✗ HIVEFIVER-PLAYBOOK missing"
  ((total_errors++))
fi
echo ""

# Final Summary
echo "═══════════════════════════════════════════"
echo "FINAL SUMMARY"
echo "═══════════════════════════════════════════"

if [ $total_errors -eq 0 ]; then
  echo "✅ ALL VALIDATIONS PASSED"
  echo ""
  echo "Phase 7f + 7g is COMPLETE."
  echo "All 4 fixed skills validated."
  echo "All 3 target agents validated."
  echo "State bridge operational."
  echo "No broken cross-references."
  echo "Playbook rules compliant."
  exit 0
else
  echo "❌ $total_errors VALIDATION(S) FAILED"
  echo ""
  echo "Review output above for details."
  exit 1
fi
```

Make executable: `chmod +x .opencode/skills/final-validation.sh`

### Run Final Validation

- [ ] Run `bash .opencode/skills/final-validation.sh`
- [ ] If any failures, fix and re-run
- [ ] Update task_plan.md

### Update task_plan.md

- [ ] Open `task_plan.md`
- [ ] Change Phase 7 status from `in_progress` to `complete`
- [ ] Mark 7f and 7g checkboxes as done

```markdown
### Fix Tasks
- [x] 7a. session-context-manager — workspace-relative paths, no --constraint, added `<files_to_read>`
- [x] 7b. phase-loop — YAML allowed-tools, removed TS code, added `<files_to_read>`, fixed generic roles
- [x] 7c. command-parser — was already clean (audit read stale version)
- [x] 7d. agent-authorization — YAML format, soft task_plan.md ref, specialist names as examples, softened thresholds, removed meta-builder dead ref
- [x] 7e. HIVEFIVER-PLAYBOOK — instruction→instructions, removed phantom name field, added steps field, fixed allowed-tools example
- [x] 7f. Integration fixes — broken cross-refs, state bridge, agent instruction→instructions fix
- [x] 7g. System-wide re-validation — all 4 skills + 3 agents validated against playbook

**Status:** complete
```

##### Step 7 Verification Checklist
- [ ] Final validation script passes (exit 0)
- [ ] All 4 skills validated
- [ ] All 3 agents validated
- [ ] State bridge operational
- [ ] No broken cross-references
- [ ] No GSD dependencies in skills
- [ ] No hardcoded paths
- [ ] task_plan.md updated with `complete` status
- [ ] All commits made

#### Step 7 STOP & COMMIT
**STOP & COMMIT:** Once final validation passes, run `git add` and `git commit -m "phase-7g: final system-wide validation + mark Phase 7 complete"` — wait for user confirmation.

---

## Final Commit Summary

After all steps complete, verify with:

```bash
git log --oneline -10
git status
```

Expected commits for this phase:
1. `phase-7f: remove duplicate paragraphs in session-context-protocol.md`
2. `phase-7f: fix instruction → instructions in 4 agents per HIVEFIVER-PLAYBOOK spec`
3. `phase-7f: add state bridge docs + validation script`
4. `phase-7g: add skill validation script + validate all 4 fixed skills`
5. `phase-7g: add agent validation script + validate 3 target agents`
6. `phase-7f: fix broken cross-references across skills` (if any found)
7. `phase-7g: final system-wide validation + mark Phase 7 complete`

---

## Complete Artifacts Checklist

| Artifact | Location | Status |
|----------|----------|--------|
| session-context-manager SKILL.md | `.opencode/skills/session-context-manager/SKILL.md` | ✅ FIXED (7a) |
| session-context-protocol.md | `.opencode/skills/session-context-manager/references/` | ✅ FIXED (7f) |
| phase-loop SKILL.md | `.opencode/skills/phase-loop/SKILL.md` | ✅ FIXED (7b) |
| command-parser SKILL.md | `.opencode/skills/command-parser/SKILL.md` | ✅ CLEAN (7c) |
| agent-authorization SKILL.md | `.opencode/skills/agent-authorization/SKILL.md` | ✅ FIXED (7d) |
| HIVEFIVER-PLAYBOOK.md | `.hivefiver-meta-builder/references-lab/` | ✅ FIXED (7e) |
| State Bridge | `.hivemind/state/STATE-BRIDGE.md` | ✅ NEW (7f) |
| State Validation Script | `.hivemind/state/scripts/validate-state.sh` | ✅ NEW (7f) |
| Skill Validation Script | `.opencode/skills/validate-all-skills.sh` | ✅ NEW (7g) |
| Agent Validation Script | `.opencode/agents/validate-agents.sh` | ✅ NEW (7g) |
| Cross-Ref Checker | `.opencode/skills/check-cross-refs.sh` | ✅ NEW (7f) |
| Final Validation Script | `.opencode/skills/final-validation.sh` | ✅ NEW (7g) |
| 4 Agent fixes | `.opencode/agents/{orchestrator,intent-loop,spec-verifier,phase-guardian}.md` | ✅ FIXED (7f) |
| task_plan.md | Root `task_plan.md` | ✅ UPDATED (7g) |

---

## Output Contract

After completing all steps, return:

```markdown
## PHASE 7 COMPLETE

**Phase:** 7f + 7g — Integration Fixes + System-Wide Re-Validation
**Status:** DONE

### What Was Done
- Fixed duplicate paragraphs in session-context-protocol.md
- Fixed `instruction` → `instructions` in 4 agents
- Created state bridge between .hivemind/state/ and harness continuity
- Created 5 validation scripts (state, skills, agents, cross-refs, final)
- Validated all 4 fixed skills against HIVEFIVER-PLAYBOOK
- Validated all 3 target agents against HIVEFIVER-PLAYBOOK
- Verified no broken cross-references across 108 skill files
- Confirmed no GSD dependencies in any skill
- Updated task_plan.md with complete status

### Commits
- [List all commit hashes and messages]

### Validation Results
- State bridge: ✅ PASS
- Skill validation: ✅ 4/4 PASS
- Agent validation: ✅ 3/3 PASS
- Cross-reference check: ✅ PASS
- Universal rules: ✅ PASS
- Playbook compliance: ✅ PASS
```
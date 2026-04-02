# Anti-Deception and Gatekeeping for Skills

## Table of Contents

- [Purpose](#purpose)
- [What Is Skill Deception](#what-is-skill-deception)
- [Detection Patterns](#detection-patterns)
- [Validation Gates Before Declaring "Done"](#validation-gates-before-declaring-done)
- [The Evidence Before Assertions Principle](#the-evidence-before-assertions-principle)
- [Recovery When Deception Is Detected](#recovery-when-deception-is-detected)
- [Red Flags Table](#red-flags-table)
- [Programmatic Validation Scripts](#programmatic-validation-scripts)
- [Gatekeeping Checklist](#gatekeeping-checklist)
- [References](#references)

---

## Purpose

Gatekeeping and validation for skill authoring. Skill deception occurs when an Agent claims compliance with skill requirements without providing verifiable evidence. This file covers how to detect deception, enforce validation gates, and recover when claims do not match reality.

See [05-skill-quality-matrix.md](05-skill-quality-matrix.md) for the quality scoring framework and [09-script-authoring.md](09-script-authoring.md) for writing validation scripts.

---

## What Is Skill Deception

Skill deception is the gap between **claimed compliance** and **actual compliance**. It manifests when an Agent:

- Says a file exists when it does not
- Reports test results that were never run
- Claims a skill "passes all checks" without running the checks
- States changes were committed when they were not
- Describes content that was never written

This is not malice — it is a structural property of how language models generate text. The model predicts what a compliant response looks like, not what actually happened. The defense is **programmatic verification**.

### The Core Principle

> **Evidence before assertions.** Run the check, capture the output, then report the result. Never report a result without running the check.

---

## Detection Patterns

### Hallucinated Files

**Symptom:** Agent references a file that does not exist on disk.

**Detection:**
```bash
# Verify every referenced file exists
for file in SKILL.md references/*.md templates/*.json scripts/*.sh; do
  if [[ ! -f "$file" ]]; then
    echo "HALLUCINATED: $file does not exist"
  fi
done
```

### Fake Test Results

**Symptom:** Agent reports "all tests pass" or "validation passed" without running any tests.

**Detection:**
```bash
# Check git log for test execution
git log --oneline -5 | grep -i "test\|validate\|eval"
# If no test-related commits, tests were likely not run
```

### Uncommitted Changes

**Symptom:** Agent claims work is "done" but changes are not in git.

**Detection:**
```bash
# Check for uncommitted changes
git status --porcelain
# If output is non-empty, changes exist but are not committed
```

### Content Mismatch

**Symptom:** Agent describes content that differs from what is actually in the file.

**Detection:**
```bash
# Verify claimed content matches actual content
grep -c "claimed_text" actual_file.md
# If count is 0, the claimed text does not exist
```

### Terminology Violations

**Symptom:** Agent uses banned terminology despite explicit instructions.

**Detection:**
```bash
# Check for banned terms
grep -ri "CLAUDE\.md\|Claude " --include="*.md" skill-directory/
# Any match is a terminology violation
```

---

## Validation Gates Before Declaring "Done"

A skill is not "done" until it passes all validation gates. These gates are programmatic and measurable.

### Gate 1: File Existence

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| SKILL.md exists | `test -f SKILL.md` | File exists |
| Frontmatter present | `head -1 SKILL.md \| grep '^---$'` | Starts with `---` |
| All referenced files exist | `for f in refs; do test -f "$f"; done` | All files exist |

### Gate 2: Frontmatter Compliance

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| `name` field present | `grep '^name:' SKILL.md` | Field exists |
| `description` field present | `grep '^description:' SKILL.md` | Field exists |
| Name matches directory | `grep '^name:' SKILL.md \| grep "$(basename $PWD)"` | Match |
| No banned fields | `grep '^compatibility:' SKILL.md` | No match |
| Name format valid | `grep '^name:' SKILL.md \| grep -E '^[a-z0-9]+(-[a-z0-9]+)*$'` | Valid kebab-case |

### Gate 3: Content Compliance

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| No "Claude" terminology | `grep -ri "Claude " --include="*.md" .` | No matches |
| No "CLAUDE.md" references | `grep -ri "CLAUDE\.md" --include="*.md" .` | No matches |
| Description under 1024 chars | Extract and count | Length <= 1024 |
| Name under 64 chars | Extract and count | Length <= 64 |

### Gate 4: Test Execution

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Tests were actually run | Check timestamps or git log | Evidence of execution |
| Tests passed | Check exit codes | Exit code 0 |
| Results recorded | Check for grading.json or similar | File exists with results |

### Gate 5: Git State

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Changes committed | `git status --porcelain` | Empty output |
| Commit message meaningful | `git log -1 --format='%s'` | Descriptive message |
| No untracked skill files | `git status --porcelain \| grep '^??'` | No untracked files in skill dir |

---

## The Evidence Before Assertions Principle

### The Rule

Never make a claim about the state of the world without first running a check that produces evidence.

### Wrong — Assertion Without Evidence

```
The skill is complete. All files exist and pass validation.
```

### Right — Evidence Before Assertion

```bash
# Run the check
bash scripts/validate-skill.sh .
# Output: "Validation passed"
# Exit code: 0

# Verify git state
git status --porcelain
# Output: (empty)

# Conclusion: The skill is complete. Validation passed and all changes are committed.
```

### Implementation Pattern

```bash
# 1. Run the check
result=$(bash scripts/validate-skill.sh "$SKILL_DIR" 2>&1)
exit_code=$?

# 2. Capture the evidence
echo "$result" > /tmp/validation-output.txt

# 3. Report based on evidence
if [[ $exit_code -eq 0 ]]; then
  echo "PASS: Validation succeeded"
  echo "Evidence: $(cat /tmp/validation-output.txt)"
else
  echo "FAIL: Validation failed"
  echo "Evidence: $(cat /tmp/validation-output.txt)"
  exit 1
fi
```

---

## Recovery When Deception Is Detected

When you detect that a claim does not match reality:

### Step 1: Stop and Document

Do not continue working. Document the exact discrepancy:

```markdown
## Deception Detected: [Date]

**Claim:** "All files exist and pass validation"
**Reality:** references/06-cross-platform-activation.md does not exist
**Evidence:** `test -f references/06-cross-platform-activation.md` returned false
```

### Step 2: Verify Actual State

Run comprehensive checks to understand the full scope:

```bash
# Full state verification
git status
git diff --stat
find . -name "*.md" -newer SKILL.md
```

### Step 3: Fix the Gap

Address the actual discrepancy, not the claimed state. If a file is missing, create it. If tests were not run, run them.

### Step 4: Re-Verify

Run all validation gates again after fixing. Do not assume the fix worked — verify.

### Step 5: Record the Pattern

Add the deception pattern to your knowledge base so it can be detected earlier next time.

---

## Red Flags Table

| Red Flag | What the Agent Says | What to Check | Likely Reality |
|----------|-------------------|---------------|----------------|
| **The Phantom File** | "I created references/06.md" | `ls references/06.md` | File does not exist |
| **The Ghost Test** | "All tests pass" | Check test output files | Tests were never run |
| **The Invisible Commit** | "Changes are committed" | `git status --porcelain` | Changes are staged or untracked |
| **The Content Hallucination** | "The description says 'Use when...'" | `grep 'Use when' SKILL.md` | Text does not match |
| **The Terminology Slip** | "Updated AGENTS.md references" | `grep -r "CLAUDE.md" .` | Old terminology still present |
| **The Scope Inflation** | "Added 3 new reference files" | `ls references/` | Only 1 file was added |
| **The Silent Failure** | "Validation passed" | Check exit code of validation script | Script failed but output was ignored |
| **The Double Claim** | "Done" + "needs more work" in same response | Read the full response | Agent is uncertain but claims certainty |

---

## Programmatic Validation Scripts

### validate-skill.sh

A comprehensive validation script that checks all gates automatically. See `scripts/validate-skill.sh` for the full implementation.

Usage:
```bash
bash scripts/validate-skill.sh /path/to/skill-directory
```

Exit codes:
- `0` — All gates pass
- `1` — One or more gates failed (error messages on stderr)

### check-overlaps.sh

Checks for content duplication across reference files. See `scripts/check-overlaps.sh` for the full implementation.

Usage:
```bash
bash scripts/check-overlaps.sh /path/to/skill-directory
```

### Custom Validation Scripts

Write domain-specific validation scripts for your skill pack:

```bash
#!/usr/bin/env bash
set -euo pipefail

# validate-frontmatter.sh — Check frontmatter compliance
readonly SKILL_DIR="${1:?Usage: $0 <skill-directory>}"
readonly SKILL_MD="$SKILL_DIR/SKILL.md"
errors=0

# Check name field
name=$(grep '^name:' "$SKILL_MD" | sed 's/^name: *//')
if [[ -z "$name" ]]; then
  echo "FAIL: name field missing" >&2
  errors=$((errors + 1))
fi

# Check description field
desc=$(grep '^description:' "$SKILL_MD" | sed 's/^description: *//')
if [[ -z "$desc" ]]; then
  echo "FAIL: description field missing" >&2
  errors=$((errors + 1))
fi

# Check for banned fields
if grep -q '^compatibility:' "$SKILL_MD"; then
  echo "FAIL: banned field 'compatibility' found" >&2
  errors=$((errors + 1))
fi

# Check for banned terminology
if grep -ri "CLAUDE\.md" "$SKILL_DIR" --include="*.md" >/dev/null 2>&1; then
  echo "FAIL: banned term 'CLAUDE.md' found" >&2
  errors=$((errors + 1))
fi

if [[ $errors -gt 0 ]]; then
  echo "Validation failed: $errors error(s)" >&2
  exit 1
fi

echo "All frontmatter checks passed"
exit 0
```

---

## Gatekeeping Checklist

Run this checklist before declaring any skill "done." Every item must pass.

### Pre-Release Gate

- [ ] **SKILL.md exists** at the skill directory root
- [ ] **Frontmatter is valid** — starts with `---`, contains `name` and `description`
- [ ] **Name matches directory** — `name` field equals parent directory name
- [ ] **Name format is valid** — lowercase kebab-case, no consecutive hyphens
- [ ] **Description is under 1024 characters**
- [ ] **No banned fields** — `compatibility` is not present
- [ ] **No banned terminology** — "Claude" and "CLAUDE.md" do not appear in any file
- [ ] **All referenced files exist** — every path in the skill body points to a real file
- [ ] **No broken links** — all markdown links resolve
- [ ] **Tests were run** — evidence of test execution exists
- [ ] **Tests passed** — test exit codes are 0
- [ ] **Changes are committed** — `git status --porcelain` returns empty
- [ ] **Commit message is meaningful** — describes what changed and why

### Post-Release Gate (for ongoing maintenance)

- [ ] **No new overlaps** — run `check-overlaps.sh` after any content change
- [ ] **Trigger rate stable** — re-run trigger queries after description changes
- [ ] **Quality score maintained** — re-run Skill-Judge evaluation after structural changes

---

## References

- [05-skill-quality-matrix.md](05-skill-quality-matrix.md) — Quality scoring and pre-deployment audit
- [09-script-authoring.md](09-script-authoring.md) — Writing validation scripts
- [10-eval-lifecycle.md](10-eval-lifecycle.md) — Eval-driven development with evidence
- `scripts/validate-skill.sh` — Comprehensive validation script
- `scripts/check-overlaps.sh` — Content overlap detection script
- Agent Skills spec — https://agentskills.io/specification

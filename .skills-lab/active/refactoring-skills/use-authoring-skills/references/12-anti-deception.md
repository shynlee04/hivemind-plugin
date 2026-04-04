# Anti-Deception and Gatekeeping

## What Is Skill Deception

Skill deception is the gap between **claimed compliance** and **actual compliance**. It manifests when an Agent:

- Says a file exists when it does not
- Reports test results that were never run
- Claims a skill "passes all checks" without running the checks
- States changes were committed when they were not
- Describes content that was never written

This is not malice — it is a structural property of how language models generate text. The defense is **programmatic verification**.

### The Core Principle

> **Evidence before assertions.** Run the check, capture the output, then report the result.

## Detection Patterns

### Hallucinated Files

```bash
for file in SKILL.md references/*.md templates/*.json scripts/*.sh; do
  [[ -f "$file" ]] || echo "HALLUCINATED: $file does not exist"
done
```

### Fake Test Results

```bash
git log --oneline -5 | grep -i "test\|validate\|eval"
# If no test-related commits, tests were likely not run
```

### Uncommitted Changes

```bash
git status --porcelain
# If output is non-empty, changes exist but are not committed
```

### Terminology Violations

```bash
grep -ri "CLAUDE\.md" --include="*.md" skill-directory/
# Any match is a terminology violation
```

## Validation Gates Before Declaring "Done"

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
| Name format valid | `grep '^name:' SKILL.md \| grep -E '^[a-z0-9]+(-[a-z0-9]+)*$'` | Valid kebab-case |

### Gate 3: Content Compliance

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| No banned terminology | `grep -ri "CLAUDE\.md" --include="*.md" .` | No matches |
| Description under 1024 chars | Extract and count | Length <= 1024 |
| Name under 64 chars | Extract and count | Length <= 64 |

### Gate 4: Git State

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Changes committed | `git status --porcelain` | Empty output |
| Commit message meaningful | `git log -1 --format='%s'` | Descriptive message |

## Red Flags Table

| Red Flag | What the Agent Says | What to Check | Likely Reality |
|----------|-------------------|---------------|----------------|
| **The Phantom File** | "I created references/06.md" | `ls references/06.md` | File does not exist |
| **The Ghost Test** | "All tests pass" | Check test output files | Tests were never run |
| **The Invisible Commit** | "Changes are committed" | `git status --porcelain` | Changes are untracked |
| **The Content Hallucination** | "The description says 'Use when...'" | `grep 'Use when' SKILL.md` | Text does not match |
| **The Terminology Slip** | "Updated AGENTS.md references" | `grep -r "CLAUDE.md" .` | Old terminology present |
| **The Silent Failure** | "Validation passed" | Check exit code | Script failed but output ignored |

## Recovery When Deception Is Detected

1. **Stop and document** — Record the exact discrepancy
2. **Verify actual state** — Run comprehensive checks
3. **Fix the gap** — Address the actual discrepancy, not the claimed state
4. **Re-verify** — Run all validation gates again
5. **Record the pattern** — Add to knowledge base for earlier detection next time

## Gatekeeping Checklist

Run before declaring any skill "done":

- [ ] SKILL.md exists at the skill directory root
- [ ] Frontmatter is valid — starts with `---`, contains `name` and `description`
- [ ] Name matches directory — `name` field equals parent directory name
- [ ] Name format is valid — lowercase kebab-case, no consecutive hyphens
- [ ] Description is under 1024 characters
- [ ] No banned fields — `compatibility` is not present (unless truly needed)
- [ ] No banned terminology — "CLAUDE.md" does not appear in any file
- [ ] All referenced files exist — every path points to a real file
- [ ] Tests were run — evidence of test execution exists
- [ ] Tests passed — test exit codes are 0
- [ ] Changes are committed — `git status --porcelain` returns empty
- [ ] Commit message is meaningful — describes what changed and why

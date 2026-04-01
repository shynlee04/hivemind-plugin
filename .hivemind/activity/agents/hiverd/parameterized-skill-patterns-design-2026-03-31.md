---
name: parameterized-skill-patterns-design
description: Design document for converting hardcoded skills to parameterized pattern skills
version: 1.0.0
date_created: 2026-03-31
owner: hiverd
status: draft
tags: [skill-development, platform-agnostic, patterns, hivemind]
---

# Parameterized, Platform-Agnostic Skill Patterns

## Design Document

**Question:** How should skills present HOW-TO patterns with parameters instead of ONE specific way with hardcoded values?

**Sources Checked:** 3 primary sources
- Anthropic official skills development guidelines (`anthropic-official-skills-dev.md`)
- GitHub awesome-copilot `create-implementation-plan` skill (https://skills.sh/github/awesome-copilot/create-implementation-plan)
- Hivemind existing skills analysis (`hivemind-execution`, `hivemind-atomic-commit`, `use-hivemind-delegation`)

---

## Key Findings

| # | Finding | Source | Confidence | Freshness |
|---|---------|--------|------------|-----------|
| 1 | Skills use concrete examples as ILLUSTRATIONS, not hardcoded requirements | Anthropic guidelines line 53: "scripts/rotate_pdf.py" | HIGH | 2026 |
| 2 | Good pattern: `${input:PlanPurpose}` parameterization | skills.sh create-implementation-plan | HIGH | Feb 2026 |
| 3 | Skills present "e.g., ..." to illustrate without mandating | skills.sh template | HIGH | Feb 2026 |
| 4 | Hivemind skills have hardcoded npm commands (violation) | hivemind-execution lines 95-99 | CONFIRMED | Current |
| 5 | Hivemind skills have hardcoded file paths (violation) | use-hivemind-delegation lines 446-450 | CONFIRMED | Current |

---

## The Core Principle

**Skills should teach PATTERNS, not prescribe COMMANDS.**

A parameterized skill describes:
- **WHAT** operation is needed (conceptual)
- **HOW** to parameterize it (platform-aware)
- **E.G.** specific implementations (illustrative, not mandatory)

---

## Violation Categories

### Category 1: Hardcoded Build/Type Commands

**Bad (hardcoded):**
```bash
npx tsc --noEmit    # Type check — zero errors required
npm test            # All tests must pass
npm run lint        # Zero lint violations
npm run build       # Build must succeed
```

**Good (parameterized):**
```markdown
Run the project's type checking verification:
- TypeScript projects: `npx tsc --noEmit` or equivalent
- Python projects: `mypy` or `pyright`
- Go projects: `go vet` or `golangci-lint run`
- Rust projects: `cargo check`

Run the project's test suite:
- npm projects: `npm test`
- Python projects: `pytest` or `python -m unittest`
- Go projects: `go test ./...`
- Rust projects: `cargo test`
```

### Category 2: Hardcoded File Paths

**Bad (hardcoded):**
```bash
cat .hivemind/activity/delegation/packet.json | jq '.scope'
ls .hivemind/activity/agents/*/
grep -r "blocked_routes" .hivemind/activity/
```

**Good (parameterized):**
```markdown
Read the delegation packet scope:
- Linux/macOS: `cat {runtime_state}/activity/delegation/packet.json | jq '.scope'`
- Windows: `type {runtime_state}\activity\delegation\packet.json | findstr "scope"`

List active agent sessions:
- Linux/macOS: `ls {runtime_state}/activity/agents/*/`
- Windows: `dir {runtime_state}\activity\agents\*\`
```

### Category 3: Hardcoded Version Control Commands

**Bad (hardcoded):**
```bash
git diff --cached --name-only
git diff --cached --check
git log --oneline -5
```

**Good (parameterized):**
```markdown
Query staged changes:
- Git: `git diff --cached --name-only` or `git diff --staged --name-only`
- Mercurial: `hg status --rev .^:`

Query recent commits:
- Git: `git log --oneline -5`
- Mercurial: `hg log -5`
- SVN: `svn log -5`
```

### Category 4: Hardcoded Framework-Specific Terminology

**Bad (hardcoded):**
```markdown
Write to the .hivemind/activity/sessions/continuity.json file
```

**Good (parameterized):**
```markdown
Write to the session continuity file in the runtime state directory:
- Hivemind: `{runtime_state}/sessions/continuity.json`
- Similar frameworks: `{framework_runtime}/sessions/continuity.json`
- The pattern is: `{runtime_state}/sessions/` with platform-appropriate extension
```

---

## Source Analysis

### Anthropic Guidelines: Illustrations, Not Requirements

From `anthropic-official-skills-dev.md` line 53:
> "Example: scripts/rotate_pdf.py for PDF rotation tasks"

The PDF rotation script is an **illustration** of when to use scripts/. It is NOT a requirement that every skill must include a Python script for PDF rotation. The skill author decides whether scripts are needed based on their concrete examples.

Key quote (line 112):
> "Considering how to execute on the example from scratch"

This means: derive the skill structure from concrete use cases, not from abstract requirements.

### skills.sh Pattern: Template Parameterization

From `create-implementation-plan`:
```markdown
Your goal is to create a new implementation plan file for `${input:PlanPurpose}`
```

The `${input:PlanPurpose}` is a placeholder that the skill consumer fills in. The skill defines the FORMAT and PROCESS; the consumer provides the CONTENT.

The template uses "e.g., ..." extensively:
- "e.g., upgrade-system-command-4.md"
- "e.g., feature-auth-module-1.md"

These are illustrative examples showing the naming convention, not mandatory formats.

---

## Design Rules

### Rule 1: Concept Before Command

**Before:** "Run `npx tsc --noEmit`"
**After:** "Run type checking (e.g., `npx tsc --noEmit` for TypeScript, `mypy` for Python)"

The skill first names the CONCEPT (type checking), then illustrates with ONE example per platform.

### Rule 2: Parameterize Paths, Not Just Commands

**Before:** `.hivemind/activity/delegation/packet.json`
**After:** `{runtime_state}/activity/delegation/packet.json` or "the delegation packet in the runtime state directory"

Use curly braces `{}` for parameterization. Describe the semantic meaning of each path segment.

### Rule 3: Hivemind Terminology as One Example

Hivemind-specific terms should be presented as ONE instance of a general pattern:

**Before:** "Emit the delegation packet to `.hivemind/activity/delegation/`"
**After:** "Emit the delegation packet to the delegation activity directory (e.g., `.hivemind/activity/delegation/` for Hivemind, or `{your_framework}/activity/delegation/` for similar frameworks)"

### Rule 4: Platform-Specific Examples in Bulleted Lists

When multiple platforms exist, use this format:

```markdown
Run the test suite:
- **JavaScript/TypeScript (npm):** `npm test`
- **Python:** `pytest` or `python -m unittest`
- **Go:** `go test ./...`
- **Rust:** `cargo test`
- **Java:** `mvn test` or `./gradlew test`
```

### Rule 5: Scripts as Bundled Resources, Not Hardcoded Examples

From Anthropic guidelines line 54:
> "Scripts may still need to be read by Claude for patching or environment-specific adjustments"

This means: if a skill needs a script, it goes in `scripts/` as an actual file, not as a hardcoded example in SKILL.md.

**Before:**
```markdown
To rotate a PDF, run: scripts/rotate_pdf.py
```

**After:**
```markdown
For PDF operations, use the bundled script:
- **`scripts/rotate_pdf.py`** — rotates PDF files by 90-degree increments
```

---

## Conversion Checklist

For each hardcoded pattern in a skill, apply this transformation:

| Step | Action |
|------|--------|
| 1 | Identify the hardcoded element (command, path, or term) |
| 2 | Name the CONCEPT it represents |
| 3 | Add "e.g., " prefix to the original as ONE illustration |
| 4 | Add alternative platforms/frameworks as additional "e.g., " items |
| 5 | Parameterize paths with `{}` notation |
| 6 | Verify: does this still make sense if the consumer uses a different platform? |

---

## Contradictions Found

### Contradiction 1: Hivemind-Specific vs Platform-Agnostic

The existing Hivemind skills (e.g., `hivemind-execution`) contain hardcoded npm commands that assume a Node.js/TypeScript platform. This contradicts the platform-agnostic principle.

**Analysis:** These skills were written for the Hivemind plugin's specific TypeScript project context. The tension is between:
- **Specificity:** Skills should work for the immediate use case
- **Generality:** Skills should work across different platforms

**Resolution:** Use the "concrete example" approach from Anthropic guidelines. The TypeScript examples are ONE illustration. Document the pattern for other platforms without mandating them.

### Contradiction 2: Hivemind Paths vs Standard Paths

Hivemind uses `.hivemind/` as its runtime state directory. This is both a convention and a hardcoded assumption.

**Resolution:** Parameterize as `{runtime_state}` and note that this defaults to `.hivemind/` for Hivemind installations.

---

## Recommendations for Verification

1. **Audit existing skills** for hardcoded patterns using this grep:
   ```bash
   grep -rn "npx tsc\|npm test\|npm run\|git diff\|.hivemind/" skills/*/SKILL.md
   ```

2. **Create a reference file** `references/platform-commands.md` with parameterized equivalents for:
   - Type checking
   - Testing
   - Building
   - Linting
   - Version control operations

3. **Update skill template** to include a "platform-agnostic check" in the validation checklist

---

## Source Evidence

### Source 1: Anthropic Guidelines (Local)
- File: `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/guidelines/anthropic-official-skills-dev.md`
- Key passages: Lines 53-54 (scripts as illustrations), lines 112-128 (concrete examples analysis)

### Source 2: skills.sh create-implementation-plan (External)
- URL: https://skills.sh/github/awesome-copilot/create-implementation-plan
- Key passages: `${input:PlanPurpose}` parameterization, "e.g.," examples throughout template

### Source 3: Hivemind Existing Skills (Local)
- Files analyzed: `hivemind-execution/SKILL.md`, `hivemind-atomic-commit/SKILL.md`, `use-hivemind-delegation/SKILL.md`
- Violations found: Lines with hardcoded npm commands, git commands, and file paths

---

## Conclusion

The principle is clear: **teach patterns, don't dictate commands**. The Anthropic guidelines and skills.sh example both demonstrate that concrete examples serve as illustrations, not requirements. Hivemind skills currently violate this in several categories (build commands, file paths, VCS commands), but the fix is systematic: identify the concept, parameterize with `{}`, and add "e.g.," examples for each supported platform.

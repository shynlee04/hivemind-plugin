# Task Envelope: Edge Case Analysis

## Task
Identify all failure cases, uncovered domain edge cases, and missing skills by reading all 20 SKILL.md files and analyzing their trigger conditions, procedural steps, and known limitations.

## Scope
### Include
- `.claude/skills/*/SKILL.md` — all 20 skill files (read complete body, not just frontmatter)
- `.hivemind/research/skills-audit/synthesis/cycle1-aggregate-bundle-findings-2026-04-09.md` — known issues from Cycle 1
- `.hivemind/research/skills-audit/inventory/bundle-scan-*.md` — bundle health context

### Exclude
- All test files
- All implementation code
- `.opencode/skills/` — use `.claude/skills/` as canonical source

## Context
**From Cycle 1 Critical Issues:**
1. skill-synthesis validate-gate.sh bug (action mismatch)
2. meta-builder has 4 stub references (empty content)
3. oh-my-openagent-reference has 1 phantom ref, 1 empty file
4. eval-harness is bare SKILL.md (unimplemented)

**From Cycle 1 Gaps:**
- 11 orphan scripts (exist but SKILL.md never calls them)
- 8 skills with D/F grade (minimal or zero bundle)
- 9 cross-skill conflict pairs (duplicated scripts, naming collisions)
- No progressive disclosure in harness-delegation-inspection (1,217 lines loaded)

**What "red fail case" means:**
- Skill triggers when it shouldn't (false positive)
- Skill doesn't trigger when it should (false negative)
- Skill produces wrong output type
- Skill procedure cannot complete (missing step, broken script reference)
- Skill has internal conflict (SKILL.md says X, script does Y)

**What "edge case" means:**
- User input is ambiguous between 2+ skills
- Skill trigger phrase overlaps with another skill
- Skill requires context not in its bundle
- Skill assumes platform features that don't exist

## Expected Output
**File:** `planning/edge-case-analysis-2026-04-09.md`

**Section 1: Red Fail Cases**
- List each fail case with:
  - Skill name
  - Fail type (false-positive, false-negative, wrong-output, incomplete, conflict)
  - Trigger phrase/procedure that fails
  - Expected vs actual behavior
  - Severity (blocking, degraded, cosmetic)

**Section 2: Uncovered Domain Edge Cases**
- Group by domain (orchestration, authoring, platform, debugging)
- For each edge case:
  - Describe the scenario
  - List skills that ALMOST cover it
  - Explain why none fully cover it

**Section 3: Missing Skills**
- Domains with no skill coverage
- Tasks mentioned in agent definitions but no matching skill
- Gap between what agents need and what skills provide

**Format:** Markdown with structured lists. Min 200 lines.

## Verification
1. Run: `wc -l planning/edge-case-analysis-2026-04-09.md` — must be ≥ 200 lines
2. Run: `grep -c "Red Fail Case" planning/edge-case-analysis-2026-04-09.md` — must find at least 3 entries
3. Run: `grep -c "Severity:" planning/edge-case-analysis-2026-04-09.md` — must find at least 3 entries
4. Confirm all 20 skills were analyzed (count should appear in file)
5. Confirm at least 15 edge cases identified
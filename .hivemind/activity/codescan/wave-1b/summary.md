# Wave 1b — hivemind-* Depth Skills Quality Audit

**Date:** 2026-03-28
**Git Commit:** 28663dfd7873963337adaadc0adff25ceb34ffa4
**Scope:** 5 hivemind-* depth skills
**Method:** 9-phase review checklist + bundled resources verification + cross-reference integrity + terminology consistency

---

## Overall Verdict

**0 of 5 skills pass all 9 phases cleanly.** Every skill has at least one `PARTIAL` or `FAIL`. None are blocked — all issues are fixable. The most common problem is a missing `parent` field in frontmatter YAML (all 5 skills).

---

## Phase-by-Phase Summary

| Phase | atomic-commit | codemap | gatekeeping | patterns | refactor |
|-------|:---:|:---:|:---:|:---:|:---:|
| 1. Frontmatter | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| 2. Load Position | INFO | INFO | ✅ | ✅ | ✅ |
| 3. Trigger clarity | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4. Content depth | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5. Anti-patterns | ✅ (4) | ✅ (3) | ✅ (12) | ✅ (6) | ✅ (8) |
| 6. Naming | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7. Line count | 184 | 182 | 304 | 194 | 275 |
| 8. Independence | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9. Universal design | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key:** ✅ = PASS, PARTIAL = partial, number in parentheses = anti-pattern count

---

## Critical Findings

### 1. Missing `parent` field (ALL 5 SKILLS)

Every SKILL.md frontmatter has `name` and `description` but **none** include `parent`. The `use-hivemind-skill-authoring` skill defines `parent` as a required frontmatter field (line 5, 78, 154). This is a systemic gap.

**Affected files:**
- `.developing-skills/refactored-skills/hivemind-atomic-commit/SKILL.md` (lines 1-5)
- `.developing-skills/refactored-skills/hivemind-codemap/SKILL.md` (lines 1-4)
- `.developing-skills/refactored-skills/hivemind-gatekeeping/SKILL.md` (lines 1-6)
- `.developing-skills/refactored-skills/hivemind-patterns/SKILL.md` (lines 1-5)
- `.developing-skills/refactored-skills/hivemind-refactor/SKILL.md` (lines 1-5)

### 2. hivemind-refactor: Duplicate sibling + dead cross-reference

**Line 264 and 266** both reference `use-hivemind-delegation`:
- Line 264: "Required prerequisite — provides delegation protocol"
- Line 266: "If refactor breaks things, debug delegation takes over"

Line 266 should reference `hivemind-system-debug` (which exists in the refactored-skills directory). The description "debug delegation takes over" maps to the system-debug skill, not delegation.

**Line 268** references `clean-code` — this skill **does not exist** in `.developing-skills/refactored-skills/`.

### 3. hivemind-patterns: No Bundled Resources table

Despite having `references/` (2 files) and `templates/` (1 file) directories, hivemind-patterns has **no Bundled Resources table** in SKILL.md. Three files exist on disk but are undeclared:
- `references/anti-pattern-catalog.md`
- `references/pattern-catalog.md`
- `templates/pattern-decision.md`

### 4. Terminology inconsistency: hivemind-refactor vs hivemind-patterns

Three-way mismatch for equivalent anti-pattern concepts:

| hivemind-patterns | hivemind-refactor (SKILL.md) | hivemind-refactor (code-smell-taxonomy.md) |
|---|---|---|
| God Component | God component | — |
| God Function | Long function | Long Method |
| Dead Code | Dead code | — |
| Zombie Code | *(not listed)* | — |
| — | Magic values | — |
| — | Poor naming | — |

**Capitalization mismatch:** "God Component" (patterns) vs "God component" (refactor)
**Label mismatch:** "God Function" (patterns) vs "Long function" (refactor SKILL.md) vs "Long Method" (refactor code-smell-taxonomy.md) — all three describe the same concept.
**Coverage gap:** patterns has "Zombie Code" but refactor doesn't. refactor has "Magic values" and "Poor naming" but patterns doesn't.

---

## Per-Skill Issues & Warnings

### hivemind-atomic-commit
| Type | Finding |
|------|---------|
| ⚠️ Warning | No explicit Load Position slot declaration |
| ⚠️ Warning | `references/verification-before-completion.md` exists on disk but is NOT in the Bundled Resources table |

### hivemind-codemap
| Type | Finding |
|------|---------|
| ⚠️ Warning | No explicit Load Position slot declaration |
| ⚠️ Warning | `references/scan-layers.md` exists on disk but is NOT in the Bundled Resources table |

### hivemind-gatekeeping
| Type | Finding |
|------|---------|
| ❌ Issue | Missing `scripts/` directory — no scripts bundled despite being a depth skill with operational mechanics (checkpoints, gates, bead tracking) |
| ⚠️ Warning | `references/loop-control.md` exists on disk but is NOT in the Bundled Resources table |

### hivemind-patterns
| Type | Finding |
|------|---------|
| ❌ Issue | No Bundled Resources table — 3 files undeclared |

### hivemind-refactor
| Type | Finding |
|------|---------|
| ❌ Issue | Duplicate sibling reference: `use-hivemind-delegation` listed twice (lines 264, 266) |
| ❌ Issue | Dead sibling reference: `clean-code` does not exist (line 268) |
| ❌ Issue | Orphaned HTML comment: LOAD-POSITION metadata in body (lines 7-11) instead of YAML frontmatter |
| ⚠️ Warning | Terminology inconsistency with hivemind-patterns for equivalent anti-pattern names |

---

## Strengths

Despite the issues above, the 5 depth skills show strong structural quality:

- **Anti-pattern coverage exceeds the >=3 threshold across all 5 skills** (ranging from 3 to 12 entries)
- **Content depth is uniformly strong** — no placeholder text found in any skill
- **Line counts are well under 450** (range: 182-304)
- **Independence is clean** — no cross-skill state mutation detected
- **Universal design holds** — abstract terminology, no framework lock-in
- **Trigger clarity is good** — all 5 skills have specific "When You Need This" sections

---

## Bundled Resources Discrepancy Summary

| Skill | Table? | Claimed | On Disk | Missing | Extra |
|-------|--------|---------|---------|---------|-------|
| atomic-commit | ✅ | 13 | 14 | 0 | `references/verification-before-completion.md` |
| codemap | ✅ | 13 | 14 | 0 | `references/scan-layers.md` |
| gatekeeping | ✅ | 9 | 10 | 0 | `references/loop-control.md` |
| patterns | ❌ | 0 | 3 | 0 | all 3 undeclared |
| refactor | ✅ | 7 | 7 | 0 | none |

---

## Recommended Fixes (Priority Order)

1. **Add `parent` field to all 5 frontmatters** — systemic, quick fix
2. **Fix hivemind-refactor Sibling Skills table** — replace duplicate `use-hivemind-delegation` (line 266) with `hivemind-system-debug`, replace dead `clean-code` with a valid reference or remove
3. **Add Bundled Resources table to hivemind-patterns** — declare the 3 existing files
4. **Align terminology** — choose canonical labels for "God Function"/"Long function"/"Long Method" across hivemind-patterns and hivemind-refactor (and the code-smell-taxonomy.md reference)
5. **Audit extra on-disk files** — decide whether `verification-before-completion.md`, `scan-layers.md`, and `loop-control.md` should be added to their respective Bundled Resources tables or removed
6. **Extract LOAD-POSITION** in hivemind-refactor from HTML comment (lines 7-11) to YAML frontmatter `parent` field

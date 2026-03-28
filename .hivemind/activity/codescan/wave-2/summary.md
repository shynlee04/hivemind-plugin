# Wave 2: Cross-Skill Conflict Audit — Summary

**Scope:** All 15 skills in `.developing-skills/refactored-skills/`
**Date:** 2026-03-28
**Status:** Investigation complete

---

## Executive Summary

The 15-skill ecosystem is **structurally sound** with good workflow coverage across 8 of 9 expected phases. However, **9 prioritized issues** were found: 3 invalid cross-references to non-existent skills, 1 self-referencing router confusion, 2 terminology mismatches, 2 template inconsistencies, and 1 workflow gap (missing code review skill).

---

## Critical Findings (Priority 1-2)

### 1. Three Invalid Cross-References to Non-Existent Skills

| Source Skill | Line | Invalid Reference | Should Be |
|---|---|---|---|
| `hivemind-atomic-commit` | SKILL.md:32 | `git-advanced-workflows` | `use-hivemind-git-memory` or remove |
| `hivemind-refactor` | SKILL.md:268 | `clean-code` | `hivemind-patterns` or remove |
| `hivemind-spec-driven` | SKILL.md:44 | `review-and-refactor` | `hivemind-refactor` |

**Impact:** Agents following sibling skill references will fail to find the referenced skill.

### 2. Self-Referencing Router: `use-hivemind-git-memory`

The routing table at lines 21-27 and 73-79 dispatches to `use-hivemind-git-memory` for resume/trace/retrieve/anchor/enforce/index — but **the skill IS `use-hivemind-git-memory`**. No separate specialist skills exist for these operations. This creates infinite routing loop risk.

---

## Terminology Conflicts

### God Function ↔ Long Method

| Source | Term | Threshold |
|---|---|---|
| `hivemind-patterns/SKILL.md:125` | God Function | 100+ lines |
| `hivemind-patterns/references/anti-pattern-catalog.md:56` | God Function | >50 lines |
| `hivemind-refactor/SKILL.md:81` | Long function | >50 lines |
| `hivemind-refactor/references/code-smell-taxonomy.md:7` | Long Method | >30 lines |
| Project constitution | God Function | (name matches, no threshold) |

**Verdict:** Same concept, 4 different names/thresholds. Recommend canonical name: **God Function** (matches project constitution).

### God Component ↔ Large Class

| Source | Term | Threshold |
|---|---|---|
| `hivemind-patterns/SKILL.md:118` | God Component | 500+ lines |
| `hivemind-patterns/references/anti-pattern-catalog.md:255` | God Component | >300 lines |
| `hivemind-refactor/references/code-smell-taxonomy.md:182` | Large Class | >10 fields or >20 methods |

**Verdict:** Same concept, different framing (LOC vs field/method count). Recommend canonical name: **God Component**.

### Tight Coupling ↔ Tangled Dependencies

| Source | Term |
|---|---|
| `hivemind-patterns/SKILL.md:145` | Tight Coupling |
| `hivemind-refactor/SKILL.md:83` | Tangled dependencies |

**Verdict:** Same concept, different names. Recommend canonical: **Tight Coupling**.

---

## Cross-Reference Matrix (Abbreviated)

```
FROM → TO                          Valid?
───────────────────────────────────────────
hivemind-atomic-commit → use-hivemind-git-memory   ✓
hivemind-atomic-commit → use-hivemind-delegation    ✓
hivemind-atomic-commit → hivemind-codemap           ✓
hivemind-atomic-commit → git-advanced-workflows     ✗ INVALID
hivemind-refactor → clean-code                      ✗ INVALID
hivemind-spec-driven → review-and-refactor          ✗ INVALID
use-hivemind-context → context-intelligence-entry   ⚠ STALE (historical)
use-hivemind-context → context-entry-verify         ⚠ STALE (historical)
use-hivemind-git-memory → [self]                    ⚠ CONFUSION
```

**Stale names checked against registry:**
- ✅ `use-hivemind-context` — correct (not context-intelligence-entry)
- ✅ `use-hivemind-delegation` — correct (not course-correction-delegation)
- ✅ `use-hivemind-tdd` — correct (not tdd-delegation)
- ✅ `hivemind-system-debug` — correct (not systematic-debugging)
- ✅ `use-hivemind-git-memory` — correct (not git-continuity-memory)
- ✅ `use-hivemind-research` — correct (not hivemind-research-tools)

---

## Template Consistency Assessment

| Check | Pass? | Details |
|---|---|---|
| `_meta` with `created_at`/`updated_at` | ⚠ Partial | 4/8 templates compliant |
| H1 heading at start | ✓ | All templates start with H1 or ```json |
| `.md` file extension | ⚠ Partial | 6 `.md`, 1 `.json`, 1 `.json.md` |
| Consistent field naming | ✗ | `packet_id` vs `plan_id` vs `record_id` |

**Verdict:** MODERATE consistency. Needs a minimum template contract.

---

## Workflow Coverage

| Phase | Primary Skill | Coverage |
|---|---|---|
| Investigate | `hivemind-codemap` | ✅ Complete |
| Research | `use-hivemind-research` | ✅ Complete |
| Plan | `use-hivemind-planning` | ✅ Complete |
| Spec | `hivemind-spec-driven` | ✅ Complete |
| Implement | `use-hivemind-tdd` | ✅ Complete |
| Test | `use-hivemind-tdd` | ✅ Complete |
| Verify | `hivemind-gatekeeping` | ✅ Complete |
| Commit | `hivemind-atomic-commit` | ✅ Complete |
| **Review** | **NONE** | **🔴 GAP** |

**The review phase has no dedicated skill.** `use-hivemind/SKILL.md:110` references `code-skeptic (adversarial review)` but no such skill exists in the ecosystem.

---

## Prioritized Fix List

| # | Priority | Category | Issue |
|---|---|---|---|
| 1 | P1 | Invalid refs | 3 skills reference non-existent sibling skills |
| 2 | P2 | Router confusion | `use-hivemind-git-memory` dispatches to itself |
| 3 | P3 | Terminology | God Function vs Long Method naming conflict |
| 4 | P4 | Terminology | God Component vs Large Class naming conflict |
| 5 | P5 | Templates | 4/8 templates lack `_meta` schema |
| 6 | P6 | Workflow gap | No code review skill exists |
| 7 | P7 | Templates | No universal JSON field vocabulary |
| 8 | P8 | Terminology gap | Duplicate Code and Magic Values missing from patterns catalog |
| 9 | P9 | Thresholds | LOC thresholds vary 2-3x across documents |

---

## Evidence Trail

| File | Verified |
|---|---|
| `hivemind-patterns/SKILL.md` | ✅ Read (194 lines) |
| `hivemind-refactor/SKILL.md` | ✅ Read (275 lines) |
| `hivemind-patterns/references/anti-pattern-catalog.md` | ✅ Read (260 lines) |
| `hivemind-refactor/references/code-smell-taxonomy.md` | ✅ Read (188 lines) |
| All 15 SKILL.md files | ✅ Read |
| 8 template files | ✅ Read |
| Cross-reference grep across all 15 skills | ✅ Complete |

**Git commit at investigation:** HEAD (verified via `git status`)

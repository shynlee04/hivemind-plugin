# Frontmatter Contradiction & TDD Workflow Audit

**Date:** 2026-04-03
**Scope:** `.skills-lab/refactoring-skills/use-authoring-skills/references/`
**Severity:** CRITICAL — template teaches authors to write non-compliant skills

---

## A. Contradiction Inventory: `04-tdd-workflow.md` vs `02-frontmatter-standard.md`

### A.1 PRIMARY VIOLATION — GREEN Phase Template (Lines 116–128)

**File:** `04-tdd-workflow.md`  
**Location:** GREEN Phase → Step 2: Write SKILL.md → lines 116–128

**What 04 SHOWS (the violation):**
```yaml
---
name: skill-name
description: Use when [trigger] — [effect]
version: 1.0.0          ← FORBIDDEN
framework: hivemind      ← FORBIDDEN
pack: pack-name          ← FORBIDDEN
entry-level: L1|L2|L3    ← FORBIDDEN
pattern: P1|P2|P3        ← FORBIDDEN
stacking: 0-3            ← FORBIDDEN
owner: hivemind          ← FORBIDDEN
status: draft            ← FORBIDDEN
---
```

**What 02 FORBIDS (the rule):**

| Forbidden Field | 02 Reference | 02 Reason |
|---|---|---|
| `version` | `02-frontmatter-standard.md:177` | "Not recognized by any platform" |
| `framework` | `02-frontmatter-standard.md:178` | "Redundant — implied by location" |
| `pack` | `02-frontmatter-standard.md:179` | "Not recognized by platforms" |
| `entry-level` | `02-frontmatter-standard.md:180` | "Internal metadata — belongs in SKILL.md body" |
| `pattern` | `02-frontmatter-standard.md:181` | "Internal metadata — belongs in SKILL.md body" |
| `stacking` | `02-frontmatter-standard.md:182` | "Internal metadata — belongs in SKILL.md body" |
| `owner` | `02-frontmatter-standard.md:183` | "Internal metadata — belongs in SKILL.md body" |
| `status` | `02-frontmatter-standard.md:184` | "Internal metadata — use file/directory status" |

**The irony:** Line 114 says *"Follow the anatomy template and frontmatter standard."* — then immediately shows a template that violates both.

### A.2 SECONDARY VIOLATION — REFACTOR Phase Checklist (Line 172)

**File:** `04-tdd-workflow.md`  
**Location:** REFACTOR Phase → Step 3: Validate Structure → line 172

**What 04 says:**
```
- [ ] Frontmatter complete
```

**Problem:** "Frontmatter complete" is ambiguous. It implies the forbidden fields should be present. The correct checklist item per `02-frontmatter-standard.md:128` is:
```
- [ ] ONLY `name` and `description` in frontmatter
```

### A.3 TERTIARY ISSUE — SKILL.md Body Shows Internal Metadata in Frontmatter Position

The 04 template shows internal metadata (`pattern`, `stacking`, `owner`, `status`) **as if they belong in frontmatter**. Per `02-frontmatter-standard.md:99–122`, these must appear in the SKILL.md **body**, not frontmatter.

---

## B. Spec Alignment: `02-frontmatter-standard.md` vs Official Agent Skills Spec

### B.1 Official Spec Field Registry (from TAB 2, `authoring-skills-improved-resources.md` lines 38–46)

| Field | Required | In 02? | Status |
|---|---|---|---|
| `name` | Yes | Yes (allowed) | ✅ Aligned |
| `description` | Yes | Yes (allowed) | ✅ Aligned |
| `license` | No | NOT mentioned → implicitly forbidden by "ONLY name + description" | ⚠️ 02 is MORE restrictive |
| `compatibility` | No | NOT mentioned → implicitly forbidden | ⚠️ 02 is MORE restrictive |
| `metadata` | No | NOT mentioned → implicitly forbidden | ⚠️ 02 is MORE restrictive |
| `allowed-tools` | No | NOT mentioned → implicitly forbidden | ⚠️ 02 is MORE restrictive |

### B.2 HiveMind-Specific Fields (NOT in official spec)

| Field | In 02? | In 04? | Verdict |
|---|---|---|---|
| `version` | Explicitly FORBIDDEN (line 177) | PRESENT (line 120) | ❌ 04 violates both 02 AND official spec |
| `framework` | Explicitly FORBIDDEN (line 178) | PRESENT (line 121) | ❌ 04 violates both |
| `pack` | Explicitly FORBIDDEN (line 179) | PRESENT (line 122) | ❌ 04 violates both |
| `entry-level` | Explicitly FORBIDDEN (line 180) | PRESENT (line 123) | ❌ 04 violates both |
| `pattern` | Explicitly FORBIDDEN (line 181) | PRESENT (line 124) | ❌ 04 violates both |
| `stacking` | Explicitly FORBIDDEN (line 182) | PRESENT (line 125) | ❌ 04 violates both |
| `owner` | Explicitly FORBIDDEN (line 183) | PRESENT (line 126) | ❌ 04 violates both |
| `status` | Explicitly FORBIDDEN (line 184) | PRESENT (line 127) | ❌ 04 violates both |
| `tags` | Explicitly FORBIDDEN (line 89) | Absent | ✅ OK |
| `depends-on` | Explicitly FORBIDDEN (line 91) | Absent | ✅ OK |
| `enables` | Explicitly FORBIDDEN (line 92) | Absent | ✅ OK |
| `complementary` | Explicitly FORBIDDEN (line 93) | Absent | ✅ OK |

### B.3 02 Divergence from Official Spec

`02-frontmatter-standard.md` is **more restrictive** than the official Agent Skills spec. The official spec permits 4 optional fields (`license`, `compatibility`, `metadata`, `allowed-tools`) that 02 effectively bans by saying "ONLY name and description."

**Assessment:** This is a deliberate HiveMind constraint for cross-platform compatibility (`02-frontmatter-standard.md:201–212`). The divergence is **intentional and documented**. No fix needed in 02 for this.

**However**, if a HiveMind skill needs `license` or `metadata`, the current 02 spec has no escape hatch. This should be noted for future consideration but is NOT part of the 04 contradiction.

---

## C. Fix Specification for `04-tdd-workflow.md`

### C.1 Fix 1: Replace Lines 116–128 (PRIMARY)

**Current (FORBIDDEN):**
```yaml
---
name: skill-name
description: Use when [trigger] — [effect]
version: 1.0.0
framework: hivemind
pack: pack-name
entry-level: L1|L2|L3
pattern: P1|P2|P3
stacking: 0-3
owner: hivemind
status: draft
---
```

**Replace with:**
```yaml
---
name: skill-name
description: Use when [triggering conditions] — [effect] — [constraints]. Include WHAT, WHEN, and KEYWORDS for activation.
---
```

Then add a separate body-content block showing where internal metadata goes:

```markdown
## Pattern

**Pattern:** P1|P2|P3 (see `references/03-three-patterns.md`)
**Stacking:** 0-3 (counts against stack limit)

## Status

**Status:** draft (use file/directory status, NOT frontmatter)

## Owner

**Owner:** hivemind (internal metadata, NOT frontmatter)
```

**Exact line change:**
- **Delete:** Lines 120–127 (the 8 forbidden fields)
- **Keep:** Lines 117–119 (`name` and `description` lines + opening `---`)
- **Keep:** Line 128 (closing `---`)
- **Insert after line 128:** A new section showing body-content placement for pattern/stacking/owner/status

### C.2 Fix 2: Replace Line 172 (SECONDARY)

**Current:**
```
- [ ] Frontmatter complete
```

**Replace with:**
```
- [ ] Frontmatter contains ONLY `name` and `description` (see `references/02-frontmatter-standard.md`)
```

### C.3 Fix 3: Add Compliance Note at Line 114

**Current:**
```
Follow the anatomy template and frontmatter standard.
```

**Replace with:**
```
Follow the anatomy template and frontmatter standard. **CRITICAL:** Frontmatter MUST contain ONLY `name` and `description`. All internal metadata (pattern, stacking, owner, status, etc.) belongs in the SKILL.md body — see `references/02-frontmatter-standard.md`.
```

### C.4 Summary of All Line-Level Changes

| Line | Current | Fix | Rationale |
|---|---|---|---|
| 114 | `Follow the anatomy template and frontmatter standard.` | Add CRITICAL warning about name+description only | Reinforces rule at point of use |
| 120 | `version: 1.0.0` | DELETE | Forbidden by 02:177 |
| 121 | `framework: hivemind` | DELETE | Forbidden by 02:178 |
| 122 | `pack: pack-name` | DELETE | Forbidden by 02:179 |
| 123 | `entry-level: L1\|L2\|L3` | DELETE | Forbidden by 02:180 |
| 124 | `pattern: P1\|P2\|P3` | DELETE | Forbidden by 02:181 |
| 125 | `stacking: 0-3` | DELETE | Forbidden by 02:182 |
| 126 | `owner: hivemind` | DELETE | Forbidden by 02:183 |
| 127 | `status: draft` | DELETE | Forbidden by 02:184 |
| 128 | `---` | KEEP | Closing delimiter |
| 128+ | (none) | INSERT body-content example | Shows correct placement of deleted fields |
| 172 | `- [ ] Frontmatter complete` | `- [ ] Frontmatter contains ONLY name and description` | Ambiguity → explicit rule |

---

## D. Duplicate Confirmation: `sw-04-tdd-workflow.md`

### D.1 Verification Evidence

| Check | Result |
|---|---|
| SHA-256 (04) | `9aa02cc72a705297166cd04a3bcc62542506b23b7e879596dc253c02c382e824` |
| SHA-256 (sw-04) | `9aa02cc72a705297166cd04a3bcc62542506b23b7e879596dc253c02c382e824` |
| `diff` output | `IDENTICAL` (exit code 0) |
| Line count | Both 392 lines |
| Byte count | Identical |

**Verdict: 100% byte-for-byte duplicate.** No unique content in sw-04.

### D.2 Origin Hypothesis

The `sw-` prefix likely indicates a "superpowers-writing" or "spec-workflow" snapshot. The file was probably copied as a backup or parallel version but never diverged.

### D.3 Recommendation

**DELETE `sw-04-tdd-workflow.md`.** Rationale:
1. Zero unique content — pure duplication
2. Creates confusion about which is canonical (the `sw-` prefix implies it might be the "real" version)
3. Any fix applied to 04 must be mirrored to sw-04, doubling maintenance burden
4. No references to `sw-04-tdd-workflow.md` found in any other file in the skill package (grep confirmed)

**Deletion target:**
```
.skills-lab/refactoring-skills/use-authoring-skills/references/sw-04-tdd-workflow.md
```

---

## E. Migration Path: Other Files Referencing Forbidden Fields

### E.1 Files Needing Review/Update

| File | Lines | Issue | Severity | Action |
|---|---|---|---|---|
| `references/04-tdd-workflow.md` | 116–128, 172 | PRIMARY VIOLATION — forbidden frontmatter template + vague checklist | CRITICAL | Apply fixes C.1–C.3 |
| `references/sw-04-tdd-workflow.md` | ALL | 100% duplicate of 04 | HIGH | DELETE entirely |
| `SKILL.md` | 56 | Lists `parent` as frontmatter field: `YAML frontmatter ← name, description, parent` | MEDIUM | Remove `parent` from frontmatter line (not in official spec or 02) |
| `references/01-skill-anatomy.md` | 240–247 | "Status Values" table (`active`/`draft`/`deprecated`/`archived`) could imply frontmatter usage | LOW | Add note: "Status is internal metadata for SKILL.md body, NOT frontmatter" |
| `references/03-three-patterns.md` | 273–274 | Uses `stacking: 1` in table body — not frontmatter, but could confuse | INFO | No action needed — context is body content, not frontmatter |

### E.2 Files Already Compliant (No Action Needed)

| File | Status |
|---|---|
| `references/02-frontmatter-standard.md` | ✅ Defines the rule correctly |
| `references/01-skill-anatomy.md` (lines 20–29) | ✅ Correctly shows name+description only |
| `references/05-skill-quality-matrix.md` | ✅ No frontmatter examples |
| `references/07-iterative-refinement.md` | ✅ No frontmatter examples |
| `references/08-conflict-detection.md` | ✅ No frontmatter examples |
| `references/audit-checklist.md` | ✅ No frontmatter examples |

### E.3 Execution Order

1. **DELETE** `sw-04-tdd-workflow.md` (removes duplicate, prevents confusion)
2. **FIX** `04-tdd-workflow.md` (apply C.1, C.2, C.3 — resolves primary contradiction)
3. **FIX** `SKILL.md` line 56 (remove `parent` from frontmatter list)
4. **ANNOTATE** `01-skill-anatomy.md` lines 240–247 (add clarification note about body vs frontmatter)

---

## Appendix: Evidence Citations

| Citation ID | File | Line(s) | Content |
|---|---|---|---|
| 02:RULE | `02-frontmatter-standard.md` | 5 | "Only `name` and `description` are allowed in frontmatter" |
| 02:FORBIDDEN-LIST | `02-frontmatter-standard.md` | 24–25 | Lists all forbidden fields |
| 02:FORBIDDEN-TABLE | `02-frontmatter-standard.md` | 76–93 | Table of forbidden fields with reasons |
| 02:CHECKLIST | `02-frontmatter-standard.md` | 128 | "ONLY name and description in frontmatter" |
| 02:WRONG-EXAMPLE | `02-frontmatter-standard.md` | 169–197 | WRONG examples showing forbidden fields |
| 04:VIOLATION | `04-tdd-workflow.md` | 116–128 | Template with 8 forbidden fields |
| 04:IRONIC | `04-tdd-workflow.md` | 114 | "Follow the anatomy template and frontmatter standard" |
| 04:VAGUE | `04-tdd-workflow.md` | 172 | "Frontmatter complete" checklist item |
| SPEC:OFFICIAL | `authoring-skills-improved-resources.md` | 38–46 | Official field registry (name, description, license, compatibility, metadata, allowed-tools) |
| SPEC:METADATA | `authoring-skills-improved-resources.md` | 181–198 | `metadata` field spec (key-value for additional properties) |
| DUP:SHA | Both files | — | SHA-256 identical: `9aa02cc72a705297166cd04a3bcc62542506b23b7e879596dc253c02c382e824` |

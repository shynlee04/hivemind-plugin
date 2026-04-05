# Cross-File Duplication & Ownership Audit

**Date:** 2026-04-03  
**Scope:** `.skills-lab/refactoring-skills/use-authoring-skills/references/` (8 files + 1 dead duplicate)  
**Prior art:** `wave1-a-frontmatter-tdd-audit.md` (contradiction analysis)  
**Agent:** hivexplorer (read-only)

---

## File Inventory

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `01-skill-anatomy.md` | 259 | Standard structure for all skills |
| 2 | `02-frontmatter-standard.md` | 321 | YAML frontmatter schema |
| 3 | `03-three-patterns.md` | 323 | P1/P2/P3 pattern system |
| 4 | `04-tdd-workflow.md` | 392 | TDD methodology for skills |
| 5 | `05-skill-quality-matrix.md` | 339 | Skill-Judge 5-dimension evaluation |
| 6 | `07-iterative-refinement.md` | 196 | Hooks-based self-correction |
| 7 | `08-conflict-detection.md` | 215 | Cross-pack overlap detection |
| 8 | `audit-checklist.md` | 32 | Skill audit checklist |
| — | `sw-04-tdd-workflow.md` | 392 | **DEAD DUPLICATE** (byte-identical to 04) |
| **TOTAL** | | **2468** | |

---

## A. Complete Duplication Matrix

### Cluster 1: P1/P2/P3 Pattern Definitions — MASSIVE

**Files:** `01-skill-anatomy.md` ↔ `03-three-patterns.md`  
**Duplication type:** Near-identical structure templates + tables  
**Severity:** CRITICAL — largest single duplication block

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 01 | 108–116 | P1 spec table (size, body, refs, stacking) | 03 | 11–15 (overview), 22–27 (P1 chars) | Same data, 01 is verbose, 03 compressed |
| 01 | 117–134 | P1 example SKILL.md structure | 03 | 30–48 | **~95% identical** — only diff: "Trigger A" vs "Condition A", "load sub-pack-X" vs "load [sub-pack-A]" |
| 01 | 136–143 | P2 spec table | 03 | 11–15 (overview), 69–75 (P2 chars) | Same data |
| 01 | 145–169 | P2 example SKILL.md structure | 03 | 79–110 | **~90% identical** — same Purpose/When/Steps/Anti-Patterns skeleton |
| 01 | 171–178 | P3 spec table | 03 | 11–15 (overview), 130–138 (P3 chars) | Same data |
| 01 | 179–212 | P3 example SKILL.md structure | 03 | 141–188 | **~85% identical** — same TOC/section/reference skeleton; 03 adds index.md detail |

**Total duplicated lines from 01 side:** ~107 lines (lines 106–212)  
**Total duplicated lines from 03 side:** ~183 lines of pattern structure overlap  
**Gross duplication (both sides):** ~290 lines of overlapping pattern content

### Cluster 2: Frontmatter Standard Rules

**Files:** `01-skill-anatomy.md` ↔ `02-frontmatter-standard.md`  
**Duplication type:** Identical rule statement + YAML block + internal metadata example

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 01 | 20–29 | "CRITICAL: Only name and description" + YAML block | 02 | 9–18 | **Exact same YAML block**; same "CRITICAL" rule text |
| 01 | 31–45 | Internal metadata example (Pattern/Stacking/Dependencies code block) | 02 | 97–122 | **~90% identical** — same Pattern/Stacking/Dependencies example; 02 adds more fields (Complements, Related Skills table) |
| 01 | 216–226 | Naming Rules table (kebab-case for dir, files, scripts) | 02 | 32–49 | Partial overlap — both specify kebab-case for `name` field; 01 broader (dir, ref files, scripts) |

**Total duplicated lines from 01 side:** ~42 lines  
**Total duplicated lines from 02 side:** ~44 lines  
**Gross duplication:** ~52 unique lines of content appearing in both

### Cluster 3: Skill-Judge Evaluation Dimensions

**Files:** `04-tdd-workflow.md` ↔ `05-skill-quality-matrix.md`  
**Duplication type:** Identical table with dimension names, weights, and descriptions

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 04 | 179–186 | 5-dimension table (Trigger 25%, Action 25%, Reference 20%, Non-Redundancy 15%, Edge 15%) | 05 | 11–18 | **100% identical** — same dimensions, same weights, same descriptions |
| 04 | 188 | "All thresholds must be met for release" | 05 | 339 | Same statement |

**Total duplicated lines:** ~10 lines

### Cluster 4: Skill-Judge Grade Thresholds

**Files:** `04-tdd-workflow.md` ↔ `05-skill-quality-matrix.md`  
**Duplication type:** Identical table

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 04 | 359–364 | Grade table (EXCELLENT 4.5+, GOOD 4.0+, ACCEPTABLE 3.0+, NEEDS WORK <3.0) | 05 | 276–280 | **100% identical** |

**Total duplicated lines:** ~6 lines

### Cluster 5: Single-Domain Decision Tree

**Files:** `03-three-patterns.md` ↔ `08-conflict-detection.md`  
**Duplication type:** Exact byte-for-byte copy

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 03 | 289–294 | "Is task single-domain? YES→Primary, NO→2→Subagent, 3+→Orchestration" | 08 | 129–134 | **100% identical** |

**Total duplicated lines:** ~6 lines

### Cluster 6: Integration with context-intelligence

**Files:** `03-three-patterns.md` ↔ `07-iterative-refinement.md` ↔ `08-conflict-detection.md`  
**Duplication type:** Same topic, 3 files, same integration points listed

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 03 | 296–303 | 4 bullet points: Entry State, Trust Threshold, Rot Detection, Recovery | 08 | 176–187 | **~80% overlap** — same 4 checks + Stack budget as table |
| 07 | 158–169 | Table with 6 context states (FRESH/RESUMED/DELEGATED/DEGRADED/INTERRUPTED/RECOVERED) | 08 | 176–187 | **~70% overlap** — 07 has state-specific refinement actions; 08 has check-type integration |

**Total duplicated lines:** ~32 lines across 3 files covering same integration surface

### Cluster 7: Skill Overlap / Cross-Reference Matrix

**Files:** `05-skill-quality-matrix.md` ↔ `08-conflict-detection.md`  
**Duplication type:** Same data about which skills overlap, different presentation

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 05 | 195–200 | Matrix: context-intelligence vs delegation-scope vs workflow-hierarchy vs context-rot-recovery with Border/Extends/No-overlap | 08 | 13–18 | **Same data, different shape** — 05 is NxN matrix, 08 is flat list with resolution column |

**Total duplicated lines:** ~12 lines (6 per file)

### Cluster 8: Reference Depth Rules

**Files:** `01-skill-anatomy.md` ↔ `03-three-patterns.md` ↔ `05-skill-quality-matrix.md`  
**Duplication type:** Same rule stated in 3 places with varying detail

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 01 | 59–76 | references/ directory rules: "1-level depth MAX", numbered files, index.md for P3 | 03 | 307–323 | **~80% identical** — same tree structure, same "1-level deep" rule, same "CANNOT reference other references/" |
| 01 | 74 | "1-level depth MAX" | 05 | 123, 132–133, 167 | Same rule in evaluation criteria |

**Total duplicated lines:** ~35 lines across 3 files (canonical in 05 with full evaluation criteria)

### Cluster 9: Cross-Pack / Domain Interconnectedness

**Files:** `03-three-patterns.md` ↔ `08-conflict-detection.md`  
**Duplication type:** Same coordination topic, overlapping data

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 03 | 269–277 | Cross-Pack Integration table (context-intelligence, use-hivemind-skill-authoring) | 08 | 117–124 | **~60% overlap** — same packs mentioned, different columns |
| 03 | 279–285 | Subagent Routing (cross-domain detection, multi-framework audit, pack migration) | 08 | 86–102 | **~50% semantic overlap** — both cover "what to load when" |
| 03 | 287–294 | Decision tree (see Cluster 5) | 08 | 129–134 | **100% identical** (counted in Cluster 5) |

**Total duplicated lines (excluding Cluster 5 overlap):** ~30 lines

### Cluster 10: Validation / Pre-Commit / Release Criteria

**Files:** `04-tdd-workflow.md` ↔ `05-skill-quality-matrix.md` ↔ `audit-checklist.md`  
**Duplication type:** Same checks listed in 3 places

| Source File | Line Range | Content | Target File | Line Range | Similarity |
|---|---|---|---|---|---|
| 04 | 345–355 | Pre-Commit Checklist (8 items: RED documented, GREEN passes, evidence, score ≥3.5, no GSD impact, stacking, ref depth) | 05 | 329–338 | **~70% overlap** — same thresholds, different framing (checklist vs criteria table) |
| 04 | 352 | "Skill-Judge score ≥3.5" | audit | 29 | "Trigger phrases are vague" (related fail condition) |
| audit | 5–9 | Core checks (frontmatter, description, lean body, paths exist, no duplicate headings) | 04:345–355 + 05:329–338 | Partial overlap — audit is highest-level, 04/05 are detailed |

**Total duplicated lines:** ~53 lines across 3 files

### Cluster 11: CONTRADICTION (Not Duplication — But Critical)

**Files:** `04-tdd-workflow.md` ↔ `02-frontmatter-standard.md`  
**Type:** Direct contradiction (04 teaches FORBIDDEN fields as template)

| Source File | Line Range | Content | Violates |
|---|---|---|---|
| 04 | 116–129 | Shows `version`, `framework`, `pack`, `entry-level`, `pattern`, `stacking`, `owner`, `status` in frontmatter template | 02:24–25, 02:76–93 (explicitly FORBIDDEN) |
| 04 | 172 | "Frontmatter complete" (ambiguous — implies forbidden fields should exist) | 02:128 ("ONLY name and description in frontmatter") |

**Total contradictory lines:** ~14 lines  
**Severity:** CRITICAL — already documented in `wave1-a-frontmatter-tdd-audit.md`

### Cluster 12: Dead Duplicate

**Files:** `sw-04-tdd-workflow.md` ↔ `04-tdd-workflow.md`  
**Type:** 100% byte-identical copy (SHA-256 verified in wave1-a)

| File | Lines | Status |
|---|---|---|
| `sw-04-tdd-workflow.md` | 392 | **DELETE** — zero unique content |

**Total removable lines:** 392 lines (entire file)

---

## B. Content Ownership Assignment

Each topic must have exactly ONE canonical owner. All other files cross-reference.

| Topic | Canonical Owner | Current Appearances (non-canonical) | Rationale |
|---|---|---|---|
| **Frontmatter schema** | `02-frontmatter-standard.md` | 01:20–29, 04:116–129 | 02 is the complete spec with examples, wrong examples, and validation checklist |
| **Internal metadata placement** | `02-frontmatter-standard.md:97–122` | 01:31–45 | 02 shows complete Pattern/Stacking/Dependencies/Related Skills body examples |
| **P1/P2/P3 pattern definitions** | `03-three-patterns.md` | 01:106–212 | 03 has full pattern system with characteristics, examples, stacking, decision tree, anti-patterns |
| **Reference depth rules** | `05-skill-quality-matrix.md` (Dim 3) | 01:59–76, 03:307–323 | 05 evaluates compliance; anatomy and patterns files should defer |
| **Skill directory structure** | `01-skill-anatomy.md` | — | Unique: SKILL.md + references/ + scripts/ + templates/ anatomy |
| **Naming conventions** | `01-skill-anatomy.md:216–226` | 02:32–49 (name field only) | 01 owns broad naming; 02 owns name-specific frontmatter format |
| **Version policy** | `01-skill-anatomy.md:229–237` | — | Unique to 01 |
| **Status values** | `01-skill-anatomy.md:240–248` | — | Unique to 01 |
| **TDD methodology (RED/GREEN/REFACTOR)** | `04-tdd-workflow.md` | — | Unique: cycle, failure capture, test prompts, baseline protocol |
| **Skill-Judge dimensions** | `05-skill-quality-matrix.md` | 04:175–188 | 05 is the canonical evaluation framework |
| **Skill-Judge grade thresholds** | `05-skill-quality-matrix.md:275–280` | 04:357–364 | 05 defines grades; 04 should cross-ref |
| **Release criteria** | `05-skill-quality-matrix.md:329–338` | 04:345–355, audit:1–32 | 05 is the quality gate; audit checklist merges into 05 |
| **Cross-pack coordination** | `08-conflict-detection.md` | 03:265–304 | 08 owns conflict/coordination; 03 should defer |
| **Skill overlap matrix** | `08-conflict-detection.md:9–28` | 05:195–200 | 08 is the conflict authority; 05's Non-Redundancy dimension should cross-ref |
| **Context-intelligence integration** | `08-conflict-detection.md:176–187` | 03:296–303, 07:158–169 | 08 is the integration hub; others cross-ref |
| **Single-domain decision tree** | `08-conflict-detection.md:129–134` | 03:287–294 | 8 owns coordination decisions |
| **Iterative refinement loop** | `07-iterative-refinement.md` | — | Unique: memory system, confidence thresholds, hooks |
| **Conflict detection protocol** | `08-conflict-detection.md` | — | Unique: overlap types, brainstorming integration, stacking validation |
| **Stacking discipline** | `08-conflict-detection.md:147–172` | Scattered: 01, 02, 03, 04 | 08 has the authoritative stack validation code |

---

## C. Deduplication Plan

### C.1 `01-skill-anatomy.md` (259 lines → ~115 lines, **save ~144 lines**)

| Action | Line Range | Lines | Replacement |
|---|---|---|---|
| **REMOVE** | 20–29 | 10 | Replace with: `> See \`02-frontmatter-standard.md\` for the complete frontmatter schema. **Rule: ONLY \`name\` and \`description\` in frontmatter.**` |
| **REMOVE** | 31–45 | 15 | Replace with: `> See \`02-frontmatter-standard.md:97–122\` for internal metadata placement examples (Pattern, Stacking, Dependencies).` |
| **CONDENSE** | 59–76 | 18→5 | Keep brief mention of references/ directory; remove detailed rules → cross-ref `03-three-patterns.md:307–323` |
| **REMOVE** | 106–212 | 107 | Replace with: `> See \`03-three-patterns.md\` for complete P1/P2/P3 definitions, structure templates, and stacking rules.` |
| **CONDENSE** | 216–226 | 11→6 | Remove kebab-case `name` rules (owned by 02:32–49); keep directory/file/script naming rules unique to 01 |

### C.2 `02-frontmatter-standard.md` (321 lines → 321 lines, **save 0 lines**)

No removals — this file is the canonical owner. It may GAIN readership as other files cross-reference it.

### C.3 `03-three-patterns.md` (323 lines → ~270 lines, **save ~53 lines**)

| Action | Line Range | Lines | Replacement |
|---|---|---|---|
| **REMOVE** | 265–304 | 40 | Replace with: `> See \`08-conflict-detection.md\` for cross-pack coordination, subagent routing decisions, and context-intelligence integration.` |
| **REMOVE** | 307–323 | 17 | Replace with: `> See \`01-skill-anatomy.md:59–76\` for directory structure rules and \`05-skill-quality-matrix.md\` Dimension 3 for reference depth evaluation.` |

### C.4 `04-tdd-workflow.md` (392 lines → ~354 lines, **save ~38 lines**)

| Action | Line Range | Lines | Replacement |
|---|---|---|---|
| **REPLACE** | 116–129 | 14→5 | Fix contradiction: show ONLY `name` and `description` in frontmatter block. Add cross-ref to `02-frontmatter-standard.md`. (See wave1-a for exact fix spec.) |
| **REMOVE** | 175–188 | 14→3 | Replace Skill-Judge dimensions table with: `> Run Skill-Judge evaluation against 5 dimensions (see \`05-skill-quality-matrix.md\`). All thresholds must be met for release.` |
| **REMOVE** | 357–364 | 8→2 | Replace grade thresholds table with: `> See \`05-skill-quality-matrix.md:275–280\` for grade definitions and actions.` |
| **CONDENSE** | 345–355 | 11→6 | Remove items that duplicate 05's release criteria; keep TDD-specific items (RED documented, GREEN passes, evidence captured) |
| **FIX** | 172 | 1 | Change "Frontmatter complete" → "Frontmatter contains ONLY `name` and `description` (see `02-frontmatter-standard.md`)" |

### C.5 `05-skill-quality-matrix.md` (339 lines → ~335 lines, **save ~4 lines**)

| Action | Line Range | Lines | Replacement |
|---|---|---|---|
| **REMOVE** | 195–200 | 6→2 | Replace cross-reference matrix with: `> See \`08-conflict-detection.md:9–28\` for the complete skill-to-skill overlap detection matrix.` |

### C.6 `07-iterative-refinement.md` (196 lines → ~186 lines, **save ~10 lines**)

| Action | Line Range | Lines | Replacement |
|---|---|---|---|
| **REMOVE** | 158–169 | 12→2 | Replace context-intelligence integration table with: `> See \`08-conflict-detection.md:176–187\` for context-intelligence integration points during refinement.` |

### C.7 `08-conflict-detection.md` (215 lines → 215 lines, **save 0 lines**)

No removals — this file is the canonical owner for cross-pack coordination.  
**NOTE:** This file GAINS content ownership from 03 (lines 265–304), but the transfer means 03 shrinks rather than 08 growing — the content already exists in 08.

### C.8 `audit-checklist.md` (32 lines → 0, **save 32 lines**)

| Action | Lines | Replacement |
|---|---|---|
| **MERGE into 05** | 32 | Add as `## Quick Audit Checklist` section at end of `05-skill-quality-matrix.md` (~18 lines after removing items already covered by 05's existing sections) |

### C.9 `sw-04-tdd-workflow.md` (392 lines → 0, **save 392 lines**)

| Action | Lines | Replacement |
|---|---|---|
| **DELETE** | 392 | Byte-identical to `04-tdd-workflow.md`. No unique content. No inbound references. |

---

## D. Estimated Savings

### Per-File Summary

| File | Before | After | Lines Saved | Method |
|---|---|---|---|---|
| `01-skill-anatomy.md` | 259 | ~115 | **~144** | Remove pattern defs, frontmatter, metadata; condense naming |
| `02-frontmatter-standard.md` | 321 | 321 | 0 | Canonical owner — no changes |
| `03-three-patterns.md` | 323 | ~270 | **~53** | Remove cross-pack coord, reference depth rule |
| `04-tdd-workflow.md` | 392 | ~354 | **~38** | Fix frontmatter contradiction, remove Skill-Judge tables |
| `05-skill-quality-matrix.md` | 339 | ~353 | **−14** (grows) | Gains audit checklist section (+18), loses overlap matrix (−4) |
| `07-iterative-refinement.md` | 196 | ~186 | **~10** | Remove context-intelligence integration |
| `08-conflict-detection.md` | 215 | 215 | 0 | Canonical owner — no changes |
| `audit-checklist.md` | 32 | 0 | **32** | Merged into 05 |
| `sw-04-tdd-workflow.md` | 392 | 0 | **392** | Dead duplicate deleted |
| **TOTAL** | **2468** | **~1814** | **~655** | |

### Breakdown by Duplication Type

| Category | Lines Saved |
|---|---|
| Dead duplicate (`sw-04`) | 392 |
| P1/P2/P3 pattern duplication (01→03) | 107 |
| Frontmatter duplication (01→02) | 25 |
| Internal metadata duplication (01→02) | 15 |
| Reference depth duplication (01+03→05) | 30 |
| Skill-Judge duplication (04→05) | 24 |
| Cross-pack duplication (03→08) | 40 |
| Context-intelligence duplication (03+07→08) | 22 |
| **Subtotal (dedup only)** | **263** |
| Dead duplicate | **392** |
| **GRAND TOTAL** | **~655** |

### Reconciliation with "~550 lines" Estimate

The user's "~550 lines of cross-file duplication" estimate maps to the **dedup-only subtotal of ~263 removable lines** if counting one side of each duplication, or **~526 lines** if counting both sides (i.e., gross content appearing in multiple places). The dead duplicate (`sw-04`, 392 lines) is additive, bringing the actionable total to **~655 lines**.

---

## E. Reorganization Recommendations

### E.1 MERGE: `audit-checklist.md` → `05-skill-quality-matrix.md`

**Rationale:** The 32-line audit checklist contains only high-level items already detailed in 05's dimension checklists and release criteria. As a standalone file, it adds a file-load cost without unique depth. Merging it as a "Quick Audit Checklist" section at the end of 05 consolidates the quality validation surface.

**New section in 05:**
```markdown
## Quick Audit Checklist

### Core Checks
- [ ] Frontmatter: `name` + `description` only (see `02-frontmatter-standard.md`)
- [ ] Description: concrete trigger phrases with WHAT/WHEN/KEYWORDS
- [ ] SKILL body: lean, routes detail to references/templates
- [ ] Bundled resources: all paths exist
- [ ] No duplicate headings

### Operational Checks
- [ ] ≥3 concrete tool/command examples
- [ ] Decision tree or IF/THEN routing present
- [ ] Template coverage for repeated output shapes
```

### E.2 DELETE: `sw-04-tdd-workflow.md`

**Rationale:** SHA-256 verified byte-identical to `04-tdd-workflow.md`. No inbound references. Creates confusion about canonical version. Already documented in `wave1-a-frontmatter-tdd-audit.md:D.1–D.3`.

### E.3 RESTRUCTURE: `01-skill-anatomy.md` — Split Concerns

**Current problem:** 01 tries to be both "skill anatomy template" AND "pattern definition reference." After dedup, it becomes a lean anatomy reference (~115 lines) covering:
- Required/optional elements (SKILL.md, references/, scripts/, templates/)
- Naming rules (directory, file, script conventions)
- Version policy
- Status values
- Integration points checklist

**Recommendation:** Keep as-is after dedup. The file's natural scope is "what files does a skill contain and how are they named" — which is distinct from 03's "which pattern should I use." No split needed post-dedup.

### E.4 CONSIDER: Rename `05-skill-quality-matrix.md` → `05-quality-and-release.md`

**Rationale:** After merging audit-checklist.md and becoming the home for release criteria, the file's scope broadens from "evaluation matrix" to "quality evaluation + release gate + audit checklist." A rename would reflect this. **Low priority** — content structure matters more than filename.

### E.5 CONSIDER: Extract Stacking Discipline into a Shared Section

**Finding:** Stacking rules are mentioned in 6 files (01:39,115,143,175 / 02:116,182,275 / 03:58–64,120–126,197–202,273 / 04:171 / 08:96,149–171) without a single authoritative definition.

**Recommendation:** After dedup, `08-conflict-detection.md` already has the most complete stacking treatment (lines 147–172 with TypeScript validation code). Add a one-line cross-reference in other files: `> Stacking discipline: max 3 active skills, see \`08-conflict-detection.md:147–172\`.`

---

## Appendix: Duplication Cluster Summary by Severity

| Cluster | Severity | Files Involved | Gross Lines | Net Removable | Type |
|---|---|---|---|---|---|
| 12: Dead duplicate | DELETE | sw-04 | 392 | 392 | Byte-identical file |
| 1: P1/P2/P3 patterns | CRITICAL | 01 ↔ 03 | 290 | 107 | Near-identical templates |
| 11: Frontmatter contradiction | CRITICAL | 04 ↔ 02 | 14 | 14 | Teaches wrong pattern |
| 9: Cross-pack coordination | HIGH | 03 ↔ 08 | 70 | 40 | Semantic overlap |
| 8: Reference depth rules | HIGH | 01, 03, 05 | 89 | 35 | Rule stated in 3 places |
| 2: Frontmatter standard | MEDIUM | 01 ↔ 02 | 52 | 25 | Identical YAML + rule text |
| 10: Validation/checklist | MEDIUM | 04, 05, audit | 53 | 32 | Mergable checklist |
| 6: Context-intelligence integration | MEDIUM | 03, 07, 08 | 32 | 22 | Same integration points |
| 3: Skill-Judge dimensions | LOW | 04 ↔ 05 | 10 | 10 | Identical table |
| 4: Grade thresholds | LOW | 04 ↔ 05 | 6 | 6 | Identical table |
| 5: Decision tree | LOW | 03 ↔ 08 | 6 | 6 | Exact copy |
| 7: Overlap matrix | LOW | 05 ↔ 08 | 12 | 6 | Same data, different shape |

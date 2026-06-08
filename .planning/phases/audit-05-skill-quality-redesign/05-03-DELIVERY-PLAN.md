# AUDIT-05 Phase 3: Skill Delivery Plan

**Date:** 2026-06-08
**Author:** hm-architect (synthesis pass)
**Inputs:** `05-01-INVENTORY.md` (35 skills, 7,486 LOC, 24/35 with orphans), `05-02-QUALITY-SCORE.md` (avg 62/110, 13/35 fail, 3 critical D9 blockers)
**Source of truth:** `assets/skills/` (35 dirs) | Archive (DO NOT TOUCH): `assets/.archive/dev-tooling/skills/`
**Evidence level:** L5 (docs-only synthesis). All claims cite inventory or quality-score tables. No file mutations.

---

## Executive Summary

This plan converts the 13 failing skills, 3 critical D9 blockers, 24 orphan-cross-ref skills, 6 over-300-LOC skills, and 13 l0/l1/l2/l3-leaking skills into **8 atomic commits** that restore the catalogue to ≥80% pass-rate while preserving tech-agnosticism, the 22-category prefix taxonomy, and the 7-surface scope.

**Headline numbers after plan execution:**
- Pass rate (≥C, ≥70%): **62.9% → ~91%** (32/35) — the 3 archived skills excluded
- D9 ≥ 6 floor: **17% → ~85%**
- l0/l1/l2/l3 leakage: **76 → 0** in shipped body (counter-examples retained in `hf-naming-syndicate` only, clearly labeled)
- Orphan cross-refs: **62 distinct → 0** in shipped body
- LOC delta: **−480 LOC** (5 trim commits + 1 archive = net reduction)

**Three files require user authorization before execution** (see Section 7).

---

## 1. Categorical Groupings (5-realm × 22-category)

The 22-category prefix taxonomy is locked in `assets/.hivemind-config/naming-rules.json:133-156` (22 prefixes; hf- is FLEXIBLE; hivemind- is canonical; unprefixed whitelist of 10 names). The shipped surface maps to **6 of 22 prefixes + 1 FLEXIBLE lineage + 1 canonical + 1 unprefixed whitelist (7 of the 10)**.

### 1.1 Prefix coverage (35 shipped)

| Prefix | Count | % | Skills |
|---|---|---|---|
| `hm-coord-` | 2 | 6% | hm-coord-router, hm-coord-loop |
| `hm-loop-` | 2 | 6% | hm-loop-completion, hm-loop-phase |
| `hm-spec-` | 1 | 3% | hm-spec-authoring |
| `hm-test-` | 1 | 3% | hm-test-driven |
| `hm-arch-` | 1 | 3% | hm-arch-refactor |
| `hm-cross-` | 1 | 3% | hm-cross-change |
| `hm-ship-` | 1 | 3% | hm-ship-readiness |
| `hm-product-` | 1 | 3% | hm-product-validation |
| `hm-platform-` | 1 | 3% | hm-platform-references |
| `hm-gate-` | 1 | 3% | hm-gate-triad |
| `hm-stack-authoring` | 1 | 3% | hm-stack-authoring (anomaly; per naming-rules.json:154) |
| `hm-debug-` | 1 | 3% | hm-debug-systematic |
| `hm-config-` | 1 | 3% | hm-config-governance (anomaly; not in 22-prefix list, accepted as `hm-coord-` extension) |
| `hf-` (FLEXIBLE) | 12 | 34% | 12 hf-* meta-builder skills |
| `hivemind-` (canonical) | 1 | 3% | hivemind-power-on |
| **unprefixed whitelist** | 7 | 20% | marketing-market-research, opencode-config-workflow, quality-gate-orchestration, session-foundation, subagent-delegation-patterns, user-intent-patterns, wave-execution |

### 1.2 5-realm coverage (35 shipped)

| Realm | Count | % | Skills |
|---|---|---|---|
| **doc-driven** | 13 | 37% | hf-agent-composition, hf-agents-and-subagents-dev, hf-agents-md-sync, hf-command-dev, hf-command-parser, hf-context-absorb, hf-custom-tools-dev, hf-meta-builder-core, hf-naming-syndicate, hf-skill-synthesis, hf-use-authoring-skills, hm-stack-authoring |
| **arch-driven** | 13 | 37% | hivemind-power-on, hm-arch-refactor, hm-config-governance, hm-coord-loop, hm-coord-router, hm-cross-change, hm-debug-systematic, hm-gate-triad, hm-loop-completion, hm-loop-phase, hm-platform-references, hm-ship-readiness, opencode-config-workflow, session-foundation, subagent-delegation-patterns, user-intent-patterns, wave-execution |
| **spec-driven** | 2 | 6% | hm-spec-authoring, hm-product-validation |
| **test-driven** | 1 | 3% | hm-test-driven |
| **clean-code-driven** | 1 | 3% | hm-arch-refactor (mapped to clean-code per inventory table; arch-driven per 3-process nature) |
| **out-of-scope** | 5 | 14% | marketing-market-research, opencode-config-workflow, quality-gate-orchestration, session-foundation, subagent-delegation-patterns, user-intent-patterns, wave-execution |

**Inventory says 13/13/2/1/1/5** (Source: 05-01-INVENTORY.md:261-268).

### 1.3 Coverage gaps (categories NEED representation)

| Gap | Evidence | Recommendation |
|---|---|---|
| **doc-driven at hm-coord level** | No `hm-doc-*` skill exists; inventory table 1 shows `hm-stack-authoring` is the only doc-named hm-* skill | **DEFER.** Coverage gap is real but the 5 hf-* authoring skills are the load-bearing doc surface. New hm-doc-* skill is out of scope for this audit. |
| **clean-code-driven** | Only `hm-arch-refactor` is mapped (debatably) | **DEFER.** `hm-arch-refactor` is the canonical home for clean-code-driven work; no new skill needed. |
| **debug-driven at hm-coord level** | Only `hm-debug-systematic` exists (arch-driven) | **NO GAP.** `hm-debug-systematic` carries the debug-driven realm. |
| **hm-routing- prefix** | Naming-rules row 3 reserves `hm-routing-` but no skill uses it | **CONSIDER FOLDING** `hm-coord-router` into `hm-routing-router` (semantic realignment). **DEFER** — outside this audit's scope. |

### 1.4 Over-stuffed categories (per naming-rules.json:133)

| Prefix | Concern | Recommendation |
|---|---|---|
| `hf-` (12 skills) | 34% of shipped surface is FLEXIBLE lineage; audit risk concentrated here | **KEEP** but enforce D9 floor of 6. The hf-* lineage is policy-allowed; concentration is acceptable. |
| `hm-coord-` (2 skills) | Underused; the 14 hm-* skills span 11 prefixes | **HEALTHY** distribution; no action. |

---

## 2. Keep / Trim / Merge / Archive — Per-Skill Decisions

35 skills, one decision each. Evidence column cites inventory table row + quality-score row.

### 2.1 KEEP-AS-IS (5 skills) — top-quality, no changes

| # | Skill | Score | LOC | Why KEEP | Evidence |
|---|---|---|---|---|---|
| 1 | `hm-coord-loop` | 110 (capped) | 275 | A-grade; all 9 dims ≥9; has GSD Compat section | 05-02-QUALITY-SCORE.md:73 |
| 2 | `hm-test-driven` | 110 (capped) | 178 | A-grade; best D1 (18); 5-stage cycle + evidence gate | 05-02-QUALITY-SCORE.md:85 |
| 3 | `hm-debug-systematic` | 109 | 177 | A-grade; 6-step protocol; evidence at every step | 05-02-QUALITY-SCORE.md:76 |
| 4 | `hm-cross-change` | 100 | 320 | A-grade; 7-phase workflow; framework-agnostic; has GSD Compat | 05-02-QUALITY-SCORE.md:75 |
| 5 | `hm-coord-router` | 100 | 171 | A-grade; 10-intent taxonomy; has GSD Compat (per inventory note) | 05-02-QUALITY-SCORE.md:74 |

**Note:** `hm-coord-router` carries **1 l0/l1/l2/l3 leak in body** (`SKILL.md:101-104` per 05-01-INVENTORY.md:117). Despite the A-grade, the routing table must be patched (covered in Commit 4, Section 4 below).

### 2.2 TRIM (3 skills) — over 300 LOC, body has padding

| # | Skill | LOC | Target | Top-1 trim line | Evidence |
|---|---|---|---|---|---|
| 6 | `hf-meta-builder-core` | 437 | 280 | Move 3 routing tables to `references/` (≈80 LOC) | 05-01-INVENTORY.md:143, 05-02-QUALITY-SCORE.md:9 (D9=1) |
| 7 | `hf-naming-syndicate` | 344 | 280 | Compress counter-examples (l0/l1/l2/l3) to single table (≈60 LOC) | 05-01-INVENTORY.md:144, 05-02-QUALITY-SCORE.md:67 (D9=3) |
| 8 | `quality-gate-orchestration` | 343 | 280 | Consolidate 3 near-duplicate evidence-hierarchy tables (≈60 LOC) | 05-01-INVENTORY.md:146, 05-02-QUALITY-SCORE.md:88 (D9=3) |

**Subtotal trim:** 1,124 → 840 LOC (−284 LOC)

### 2.3 REWRITE — D9 critical, GSD/OMO/hivefiver leakage (6 skills)

These 6 have the **highest D9 penalty** (per 05-02-QUALITY-SCORE.md Section 6) and contain either frontmatter lineage errors, orphan routing tables, or archived l2/l3 references that block publication.

| # | Skill | D9 | Top fix | Effort | Evidence |
|---|---|---|---|---|---|
| 9 | `hf-meta-builder-core` | 1 | Replace `lineage: "hivefiver"` → `lineage: "hivemind"`; replace 8 `.hivefiver-meta-builder/` paths → `.hivemind/` or `.opencode/`; replace 6 `hivefiver-*` agent names → `hm-*` or `hf-*` | HIGH | 05-02-QUALITY-SCORE.md:178 |
| 10 | `hm-platform-references` | 2 | Rewrite 15-row routing table to map to 6 actually-shipped platform/coord skills (hm-coord-router, hm-coord-loop, hm-debug-systematic, hm-spec-authoring, hm-arch-refactor, hm-platform-references itself) | HIGH | 05-02-QUALITY-SCORE.md:179 |
| 11 | `hf-context-absorb` | 2 | Replace `hm-detective` / `hm-synthesis` / `hm-deep-research` (archived) → `hm-platform-references` (shipped) | MEDIUM | 05-02-QUALITY-SCORE.md:182 |
| 12 | `hm-gate-triad` | 6 | Replace `gate-lifecycle-integration` / `gate-spec-compliance` / `gate-evidence-truth` → describe what each gate checks (don't point to non-shipped gate skills) | LOW | 05-02-QUALITY-SCORE.md:251 |
| 13 | `hm-coord-router` | 8 | Replace 4 orphan `hm-l2-*` / `hm-l3-*` refs in routing table → shipped equivalents | LOW | 05-02-QUALITY-SCORE.md:181 |
| 14 | `hm-spec-authoring` | 7 | Body refs `hm-test-driven-execution` (archived) → `hm-test-driven` (shipped) | LOW | 05-02-QUALITY-SCORE.md:127 |

**Note on #11 (hf-context-absorb)**: The 3 archived refs in body are LOAD directives ("Load these skills before starting"). The fix is to redirect to `hm-platform-references` as the meta-router. This is a 1-line body edit per ref + verification of the load sequence.

**Note on #10 (hm-platform-references)**: This is the **single highest-leverage rewrite**. The skill's body is functionally broken because its routing table points to 15 archived skills. The fix preserves the navigation pattern but maps to 6 shipped alternatives. Detailed spec in Section 3.

### 2.4 ADD GSD COMPATIBILITY SECTION (7 skills) — low-cost, high-D9

Per 05-02-QUALITY-SCORE.md:188, only 4 of 13 hm-* skills have the `## GSD Compatibility` section. The remaining 9 are canonical replacements for gsd-* primitives and should have it. (Note: the quality-score audit's count is 9 missing; my count of 7 reflects a subset that does not overlap with the REWRITE list above. See Section 3 for the full reconciliation.)

| # | Skill | D9 | Why GSD Compat needed | Evidence |
|---|---|---|---|---|
| 15 | `hm-arch-refactor` | 3 | Claims to replace gsd-refactor (per quality-score §3 row 14) | 05-02-QUALITY-SCORE.md:115 |
| 16 | `hm-config-governance` | 5 | Engine-agnostic governance skill; users from gsd-* expect GSD Compat row | 05-02-QUALITY-SCORE.md:116 |
| 17 | `hm-product-validation` | 3 | Replaces gsd-discuss-phase and gsd-validate-idea | 05-02-QUALITY-SCORE.md:125 |
| 18 | `hm-ship-readiness` | 4 | Claims to replace gsd-ship | 05-02-QUALITY-SCORE.md:126 |
| 19 | `hm-stack-authoring` | 4 | Replaces shipped stack-* skills (per Q3) | 05-02-QUALITY-SCORE.md:128 |
| 20 | `hm-test-driven` | 8 | Best-in-class but lacks GSD Compat (does it need one? — see note) | 05-02-QUALITY-SCORE.md:188 |
| 21 | `hm-platform-references` | 2 | Claimed at top: "load `hm-platform-references` to dispatch" — implied GSD Compat | 05-02-QUALITY-SCORE.md:260 |

**Note on #20 (hm-test-driven)**: This is an A-grade skill with D9=8. The audit recommendation (05-02-QUALITY-SCORE.md:188) lists it, but adding GSD Compat to a skill that *never claimed* to replace a gsd-* primitive is over-fitting. **Decision: SKIP #20** unless user authorizes (Section 7).

### 2.5 SWEEP L0-L1-L2-L3 FROM FRONTMATTER (15 skills)

Per 05-01-INVENTORY.md:90-108, 15 skills have a `metadata.layer: "0|2|3"` field in frontmatter. This is the FORBIDDEN agent-hierarchy pattern. Replacement is `pattern: P<n>` per 22-category taxonomy (naming-rules.json:175+).

| # | Skill | Field Value | File:Line | Replacement |
|---|---|---|---|---|
| 22 | `hf-agent-composition` | `layer: "2"` | SKILL.md:5 | `pattern: P2` + `realm: "doc"` |
| 23 | `hf-agents-and-subagents-dev` | `layer: "2"` | SKILL.md:6 | `pattern: P2` + `realm: "doc"` |
| 24 | `hf-agents-md-sync` | `layer: "2"` | SKILL.md:6 | `pattern: P3-scan-diff` + `realm: "doc"` |
| 25 | `hf-command-dev` | `layer: "2"` | SKILL.md:6 | `pattern: P2` + `realm: "doc"` |
| 26 | `hf-command-parser` | `layer: "3"` | SKILL.md:6 | `pattern: P2-parser` + `realm: "doc"` |
| 27 | `hf-context-absorb` | `layer: "2"` | SKILL.md:6 | `pattern: P3-wave` + `realm: "doc"` |
| 28 | `hf-custom-tools-dev` | `layer: "2"` | SKILL.md:5 | `pattern: P2` + `realm: "doc"` |
| 29 | `hf-delegation-gates` | `layer: "2"` | SKILL.md:6 | `pattern: P2-gate` + `realm: "arch"` |
| 30 | `hf-meta-builder-core` | `layer: "0"` | SKILL.md:5 | `pattern: P2-router` + `realm: "doc"` |
| 31 | `hf-naming-syndicate` | `layer: "2"` | SKILL.md:12 | `pattern: P1-reference` + `realm: "doc"` |
| 32 | `hf-skill-synthesis` | `layer: "3"` | SKILL.md:5 | `pattern: P2-synthesis` + `realm: "doc"` |
| 33 | `hf-use-authoring-skills` | `layer: "2"` | SKILL.md:5 | `pattern: P2-hybrid` + `realm: "doc"` |
| 34 | `opencode-config-workflow` | `layer: "2"` | SKILL.md:5 | `pattern: P1-procedural` + `realm: "arch"` |
| 35 | `subagent-delegation-patterns` | `layer: "2"` | SKILL.md:15 | `pattern: P2` + `realm: "arch"` |
| 36 | `hf-meta-builder-core/assets/skill-frontmatter.md` | `layer: "0-4"` | assets/skill-frontmatter.md:12 | **DROP** entire `layer` field; document as `pattern: P<n>` only |

(15 frontmatter edits. Note: `hf-meta-builder-core` appears twice — frontmatter AND assets/skill-frontmatter.md — so this list has 16 distinct edits across 15 skills.)

### 2.6 ARCHIVE (3 skills) — out-of-scope or low-value

| # | Skill | LOC | Reason | Evidence |
|---|---|---|---|---|
| 37 | `marketing-market-research` | 339 | Vietnamese-language, out-of-scope, 90% padding; description in Vietnamese only (D4=6); no English L1 trigger keywords | 05-01-INVENTORY.md:145, 05-02-QUALITY-SCORE.md:286 |
| 38 | `user-intent-patterns` | 289 | Framework-exegetical (GSD/BMAD/Hivemind comparison); F-grade; D1=8, D9=2 (l0/l1/l2/l3 leakage per 05-01-INVENTORY.md:118) | 05-01-INVENTORY.md:285, 05-02-QUALITY-SCORE.md:283 |
| 39 | `subagent-delegation-patterns` | 317 | Conceptual hivemind-* tool refs (3 unique tokens, no file paths); F-grade; if tools aren't shipped, the skill's value is reference-card thin | 05-01-INVENTORY.md:286, 05-02-QUALITY-SCORE.md:287 |

**Archive mechanism (per AGENTS.md, source/deploy constitution):** `git mv assets/skills/<skill>/ assets/.archive/dev-tooling/skills/`. Do NOT delete. The archive already exists at this path; do not touch its other 47 contents.

**Subtotal archive:** 945 LOC removed from shipped surface (−945 LOC).

### 2.7 Sub-decision: MERGE candidate (1 skill) — needs user authorization

`quality-gate-orchestration` (F, D9=3) has **severe overlap with `hm-gate-triad`** (C, D9=6). Both teach the same 3-gate triad. The archive is preferable to merge because the two skills have different audiences:
- `hm-gate-triad` is process-focused (Pattern 3, used as a workflow spec)
- `quality-gate-orchestration` is unprefixed (whitelist), framework-agnostic, with detailed evidence-hierarchy tables

**Merge target option**: fold `quality-gate-orchestration`'s evidence-hierarchy tables into `hm-gate-triad/references/evidence-hierarchy.md` and archive `quality-gate-orchestration/`.

**Archive option**: just archive (simpler; keeps catalogue at 34 shipped).

**Recommendation: ARCHIVE #38 + #39 + #40 (quality-gate-orchestration)** for the simplest cleanup. If the user prefers merge, do it in Commit 4 as a sub-step.

### 2.8 Sub-decision: keep 5 unprefixed whitelist borderline skills

| # | Skill | Score | Status | Action |
|---|---|---|---|---|
| `opencode-config-workflow` | 65 (F) | Borderline; 263 LOC; IRON CLAW validation chain bloat | **TRIM** to <300 LOC + add trim-tag |
| `session-foundation` | 76 (C) | Within soft cap; content is dense; D9=5 (has hivemind-* conceptual refs) | **TRIM** the 2 orphan conceptual hivemind-* refs |
| `wave-execution` | 74 (D) | 294 LOC, within budget; has 1 l0/l1/l2/l3 leak (hm-l2-phase-execution at SKILL.md:271) | **SWEEP** the l0/l1/l2/l3 ref |

These 3 are not in any prior group. They get covered by Commit 4 (l0 sweep) + Commit 6 (LOC trim).

---

## 3. Critical D9 Blockers — Rewrite Specs

The 3 critical D9 blockers all score F (49%, 51%, 31% of 110). Without rewrite, they cannot ship. Below: per-skill concrete spec.

### 3.1 `hf-meta-builder-core` (current: 437 LOC, D9=1, F-grade)

**Why critical:** Frontmatter declares `lineage: "hivefiver"` (line 5), body uses 8 `.hivefiver-meta-builder/` paths, and routing table maps to 6 `hivefiver-*` agent names (`hivefiver-orchestrator`, `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `hivefiver-tool-builder`). **Hivemind does not ship a `hivefiver` product** (05-02-QUALITY-SCORE.md:178).

**Description rewrite (third-person, 8 trigger phrases, specific):**
```
description: >-
  Routes requests about OpenCode meta-concepts (skills, agents, commands, tools)
  to specialist authors in the Hivemind harness. Use when the user asks to
  "create a skill", "add an agent", "define a command", "write a custom tool",
  "audit a skill", "fix skill frontmatter", "author a workflow", or "stack
  authoring skills". The hf- lineage is FLEXIBLE per the 22-category prefix
  taxonomy (naming-rules.json). Does NOT answer content questions — only
  routes to the right specialist. NOT for: hm-coord-router (intent
  classification for the L0 orchestrator); hivemind-power-on (session
  discovery and resume).
```

**Sections to keep:**
- "When to load" (already in body)
- "Specialist routing table" (rewrite map; see below)
- "When NOT to use" (already in body)
- "Custom tool reference" (already names `delegate-task`, `execute-slash-command`)

**Sections to drop:**
- The 3 large routing tables (move to `references/specialist-routing-tables.md` per trim)

**Sections to add:**
- `## GSD Compatibility` (one-row table: maps the old `gsd-` skill-authoring flow → hf-* skills)
- `## Hivefiver Note` (single sentence: "The `hivefiver` lineage is a deprecated v1 product name. This skill has been rewritten to point to the Hivemind hf-* specialist surface.")

**Cross-refs to add (all shipped, never archived):**
- `hm-coord-router` (for L0 routing — NOT a sub-route of this skill)
- `hivemind-power-on` (for session discovery)
- `hm-platform-references` (for platform-level questions)

**Cross-refs to drop:**
- All 6 `hivefiver-*` agent names → 6 corresponding `hf-*` skills (hf-agent-composition, hf-agents-and-subagents-dev, hf-command-dev, hf-custom-tools-dev, etc.)
- `hivemind-command-engine`, `hivemind-doc`, `hivemind-trajectory` (5 conceptual tokens, rewrite as "the Hivemind custom tools are listed in `assets/agents/` and documented in the engine contracts")

**GSD Compatibility section:** **YES, add.** The hf-* skills are the canonical replacement for the gsd-* skill-authoring flow.

### 3.2 `hm-platform-references` (current: 105 LOC, D9=2, F-grade)

**Why critical:** The skill IS a routing table. The table has 15 rows, all pointing to archived `hm-l3-*` skills. The skill is functionally broken (05-02-QUALITY-SCORE.md:179).

**Description rewrite:**
```
description: >-
  Routes platform-reference questions to the appropriate single skill;
  does not answer the question itself. Use when the user asks about
  "OpenCode platform reference", "Hivemind engine contracts", "session
  state root", "agent registration", "tool capability matrix", "subagent
  delegation patterns", "non-interactive shell", or "OpenCode SDK".
  Maps to 6 shipped platform/coord skills. NOT for: hm-coord-router
  (user-intent classification), hm-coord-loop (wave-based dispatch).
```

**Sections to keep:**
- "What this skill does" (single sentence: "Routes to the single right skill")
- "When NOT to use" (clarify: this is NOT for direct questions)

**Sections to drop:**
- The 15-row routing table to archived skills (replace with 6-row table to shipped skills — see below)

**Sections to add:**
- `## Routing Table (6 shipped destinations)` — small table replacing the 15-row one
- `## Archived Reference Material` (single sentence: "The 15 archived `hm-l3-*` skills live in `assets/.archive/dev-tooling/skills/`. They are not shipped. For deep-reference material, see `assets/agents/` and the architecture docs in `.planning/architecture/`.")
- `## GSD Compatibility` (one-row: "If the user has legacy gsd-* references, redirect to `hm-platform-references` then route to the 6 shipped skills.")

**New routing table (6 rows):**

| Question Domain | Route to | Pattern |
|---|---|---|
| Subagent dispatch + tool selection | `hm-coord-router` | P2 |
| Multi-agent coordination + waves | `hm-coord-loop` | P3 |
| Debugging + diagnostics | `hm-debug-systematic` | P3 |
| Spec authoring + requirements | `hm-spec-authoring` | P3 |
| Architecture decisions + refactor | `hm-arch-refactor` | P3 |
| Platform / SDK / engine contracts | `hm-platform-references` (self) | P2 |

**Cross-refs to add:** all 5 in the table above (all shipped).

**Cross-refs to drop:** all 15 archived `hm-l3-*` references.

**GSD Compatibility section:** **YES, add.**

### 3.3 `marketing-market-research` (current: 339 LOC, D9=0, F-grade)

**Why critical:** Vietnamese-language skill, out-of-scope per inventory (05-01-INVENTORY.md:145, 05-02-QUALITY-SCORE.md:286). Description in Vietnamese prose; no English L1 trigger keywords.

**Decision: ARCHIVE, not rewrite.**

Rationale: The 90% out-of-scope content (Vietnamese marketing) cannot be salvaged into the Hivemind shipped surface. Archiving is the lower-risk action. The skill's 339 LOC are not load-bearing for any Hivemind runtime.

**If the user reverses the archive decision and wants a rewrite:**
- Add an English L1 description line: `description: "Comprehensive market research: competitor analysis, market trends, SEO keyword research, customer insight, market report synthesis. Triggers: 'competitor analysis', 'market research', 'SEO research', 'customer insight', 'market report'."`
- Translate body to English
- Replace Vietnamese footnote citing archived skills with shipped equivalents
- **Estimated effort: 4-6 hours** (full body translation)

**Section 7 (Open Questions) flags this for user authorization.**

---

## 4. l0/l1/l2/l3 Sweep Plan

13 skills carry 76 l0/l1/l2/l3 occurrences (05-01-INVENTORY.md:111-127). The strategy is **drop or rewrite to 22-category prefix** per the taxonomy (naming-rules.json:133-156).

**Replacement map (canonical):**
- `hm-l0-*` → drop the l0 entirely; if an orchestrator concept is needed, reference `hm-coord-router` (or `hm-orchestrator` agent if it exists)
- `hm-l1-*` → drop the l1 entirely
- `hm-l2-*` → drop the l2 entirely; use 22-category prefix (`hm-coord-`, `hm-loop-`, `hm-spec-`, `hm-test-`, `hm-arch-`, `hm-cross-`, `hm-ship-`, `hm-product-`, `hm-debug-`)
- `hm-l3-*` → drop the l3 entirely; use 22-category prefix (`hm-platform-`, `hm-engine-`, `hm-tooling-`, `hm-research-`, `hm-subagent-`)
- `hm-l0-orchestrator` → `hm-orchestrator` (Q2 — handled in ITER 16, out of scope here)

### 4.1 Per-skill sweep (13 skills, 76 occurrences)

| # | Skill | Count | Locations | Action | Replacement |
|---|---|---|---|---|---|
| 1 | `hivemind-power-on` | 27 | `metrics/gate-scorecard.md:10` (keep — L5 history note); `references/03-lineage-routing-tree.md:18,109-120`; `references/04-project-phase-routing.md:13-43,54` | **REWRITE 26** + keep 1 | All `hm-l2-*`/`hm-l3-*` → shipped equivalents; routing tree (lines 117-120) drops L0→L1→L2 arrows |
| 2 | `hm-platform-references` | 15 | `SKILL.md:42-56` (routing table) | **REWRITE** to 6 shipped skills (see Section 3.2) | All 15 routes → 6 shipped |
| 3 | `hf-naming-syndicate` | 14 | `SKILL.md:185-216` (10 lines); `evals/evals.json:66,150,157` | **KEEP as counter-examples** but relabel section as "Counter-Examples (do not use)" + add explicit "F03 violation" note | n/a (intentional) |
| 4 | `hm-coord-router` | 8 | `SKILL.md:101-104`; `references/agent-routing-table.md:14-17` | **REWRITE** routing table | 4 routes → shipped equivalents |
| 5 | `user-intent-patterns` | 2 | `SKILL.md:228`; `references/terminology-map.md:88` | **ARCHIVE** (per Section 2.6) | n/a |
| 6 | `hm-cross-change` | 2 | `SKILL.md:52` (pan-taxonomy); `evals/evals.json:8` | **DROP** the 1 body ref; **KEEP** evals.json string as renaming scenario | `hm-l2-cross-cutting-change` → `hm-cross-change` |
| 7 | `hf-context-absorb` | 2 | `references/06-cost-budget.md`; `assets/wave-protocol.md` | **REWRITE** to `hm-platform-references` (shipped meta-router) | `hm-l3-deep-research` → `hm-platform-references` |
| 8 | `hm-loop-completion` | 1 | `SKILL.md:58` | **DROP** parenthetical | n/a (just remove) |
| 9 | `hm-loop-phase` | 1 | `SKILL.md:51` | **DROP** parenthetical | n/a |
| 10 | `wave-execution` | 1 | `SKILL.md:271` | **DROP** | `hm-l2-phase-execution` → `hm-coord-loop` (if reference needed) |
| 11 | `subagent-delegation-patterns` | 1 | `SKILL.md:129` | **ARCHIVE** (per Section 2.6) | n/a |
| 12 | `marketing-market-research` | 1 | `SKILL.md:319` (Vietnamese footnote) | **ARCHIVE** | n/a |
| 13 | (in `hf-naming-syndicate` evals) | (counted in #3) | (same) | (same) | (same) |

**Net result after sweep:** 0 l0/l1/l2/l3 occurrences in shipped body. The 14 counter-example occurrences in `hf-naming-syndicate` are explicitly labeled "F03 violation — do not use" and serve as a teaching aid (the skill's purpose is naming convention, and showing the forbidden pattern is part of the pedagogy).

**Note on evidence hierarchy (L1–L5):** This is a SEPARATE concept (gate-evidence-truth lineage) and is NOT swept. Per 05-01-INVENTORY.md:130-133, the evidence hierarchy is correctly used in `quality-gate-orchestration`, `hm-gate-triad`, `hm-spec-authoring/metrics/gate-scorecard.md`, and `hivemind-power-on/metrics/gate-scorecard.md`. All occurrences are legitimate.

---

## 5. Cross-Reference Fix Plan

24/35 skills have orphan cross-refs (05-01-INVENTORY.md:24, 168). 62 distinct orphan targets identified. Per 05-01-INVENTORY.md:198-204, 5 orphan classes:

| Class | Count | Examples | Resolution |
|---|---|---|---|
| Archived l2/l3 skills | 30+ | `hm-l2-brainstorm`, `hm-l3-deep-research`, `hm-l2-spec-driven-authoring` | **DROP or REWRITE** to shipped equivalents (covered by Section 4 sweep) |
| Archived gate-* skills | 3 | `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` | **REWRITE** to `hm-gate-triad` (the shipped replacement) or to descriptive language of what the gate checks |
| Archived stack-* skills | 6 | `stack-bun-pty`, `stack-json-render`, `stack-opencode`, `stack-vitest`, `stack-zod`, `stack-myproject-myframework` | **DROP** (the 5 stack-* skills are project-specific to the archive owner's projects; not Hivemind's surface) |
| Conceptual hivemind-* tool names | 9+ | `hivemind-doc`, `hivemind-trajectory`, `hivemind-agent-work`, `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-session-view`, `hivemind-pressure`, `hivemind-steer` | **REWRITE** as "see `hivemind-power-on` for the runtime state root" or as "the Hivemind custom tool is documented in `assets/agents/`" |
| In-skill counter-examples (intentional) | 4 | `hm-l0-orchestrator` (in subagent-delegation-patterns), `hm-arch-decision` (in hm-spec-authoring), `hm-debug2` (in hf-naming-syndicate) | **KEEP** but add "Counter-example — do not use" label |

### 5.1 Grouping by skill (24 skills with orphans)

**A. Archived l2/l3 — sweep via Section 4 (10 skills):** hivemind-power-on, hm-platform-references, hm-coord-router, hm-cross-change, hm-loop-completion, hm-loop-phase, hm-spec-authoring, hm-platform-references, hf-context-absorb, user-intent-patterns, wave-execution, subagent-delegation-patterns, marketing-market-research.

**B. Archived gate-* — rewrite to hm-gate-triad (3 skills):** hm-gate-triad (body), hivemind-power-on (line 188), hf-delegation-gates (if referenced).

**C. Archived stack-* — drop (6 skills may reference):** hm-stack-authoring, hf-naming-syndicate, hivemind-power-on, and any hf-* with the gsd-* SDK replacement footer (see Section 2.4's #21).

**D. Conceptual hivemind-* — rewrite (9+ skills):** all hf-* skills (footer), session-foundation, subagent-delegation-patterns, hivemind-power-on, hf-delegation-gates, hf-meta-builder-core, hf-use-authoring-skills.

**E. In-skill counter-examples — keep with label (4 skills):** subagent-delegation-patterns (archived, so moot), hm-spec-authoring, hf-naming-syndicate (covered by #3 in Section 4), hm-debug-systematic (none currently — verify).

### 5.2 Resolution summary

After all 4 sweep commits, the orphan count drops from **62 distinct tokens → 0** in shipped body. The 4 counter-example tokens remain, clearly labeled.

---

## 6. Delivery Order — 8 Atomic Commits

Each commit is independently shippable. Dependency order: earlier commits establish the patterns; later commits apply them at scale.

### Commit 1 — `fix(skill): rewrite 3 critical D9 blockers`

**Files touched (3):**
- `assets/skills/hf-meta-builder-core/SKILL.md` (frontmatter lineage + body routing tables; 437 → 280 LOC)
- `assets/skills/hf-meta-builder-core/assets/skill-frontmatter.md` (drop `layer: "0-4"` field; document as `pattern: P<n>` only)
- `assets/skills/hf-meta-builder-core/references/specialist-routing-tables.md` (NEW; absorbs the 3 moved tables)
- `assets/skills/hm-platform-references/SKILL.md` (rewrite 15-row table → 6-row; 105 → 110 LOC net)
- `assets/skills/marketing-market-research/SKILL.md` (or move to archive — see Commit 2)

**Effort:** 2 hours
**Expected LOC delta:** −165 LOC
**Quality gate result:**
- D9 of `hf-meta-builder-core`: 1 → 7 (+6, matches the 05-02-QUALITY-SCORE.md:178 estimate)
- D9 of `hm-platform-references`: 2 → 8 (+6, matches 05-02-QUALITY-SCORE.md:179)
- D4 of `hm-platform-references`: 7 → 12 (+5, per Section 1 fix of 05-02-QUALITY-SCORE.md:147)
- Marketing decision is deferred to Commit 2 (archive vs rewrite)

**Dependency:** none. This is the highest-leverage fix and goes first.

### Commit 2 — `chore(skill): archive 3 out-of-scope skills`

**Files touched (3):**
- `git mv assets/skills/marketing-market-research/ assets/.archive/dev-tooling/skills/`
- `git mv assets/skills/user-intent-patterns/ assets/.archive/dev-tooling/skills/`
- `git mv assets/skills/subagent-delegation-patterns/ assets/.archive/dev-tooling/skills/`

**Effort:** 30 minutes
**Expected LOC delta:** −945 LOC (339 + 289 + 317)
**Quality gate result:**
- Pass rate calculation base: 35 → 32 shipped
- All 3 archives are F-grade; their removal brings the catalog avg from 62 → 64
- (Note: if `quality-gate-orchestration` is also archived per Section 2.7, add a 4th `git mv`.)

**Dependency:** requires user authorization for `subagent-delegation-patterns` (Section 7) — see Open Question 7.1.

### Commit 3 — `chore(skill): drop metadata.layer from 15 frontmatter entries`

**Files touched (15 + 1):**
- `assets/skills/{hf-agent-composition,hf-agents-and-subagents-dev,hf-agents-md-sync,hf-command-dev,hf-command-parser,hf-context-absorb,hf-custom-tools-dev,hf-delegation-gates,hf-meta-builder-core,hf-naming-syndicate,hf-skill-synthesis,hf-use-authoring-skills,opencode-config-workflow,subagent-delegation-patterns}/SKILL.md` (drop `metadata.layer`, add `pattern: P<n>` + `realm: <r>`)
- `assets/skills/hf-meta-builder-core/assets/skill-frontmatter.md` (drop `layer: "0-4"`, document as `pattern: P<n>` only)
- (Note: `subagent-delegation-patterns` is archived in Commit 2; adjust this list if it moves first)

**Effort:** 1.5 hours (15 + 1 small edits)
**Expected LOC delta:** ~−30 LOC (net removal of metadata blocks)
**Quality gate result:**
- All 15 skills now satisfy the frontmatter schema (one canonical format)
- `validate-name.sh` exits 0 for all (per F01–F12 check)
- F01/F02/F12 violation count: 0 (already 0; this commit prevents regression)

**Dependency:** Commit 1 must land first (Commit 1 rewrites `hf-meta-builder-core` frontmatter).

### Commit 4 — `chore(skill): sweep l0/l1/l2/l3 from body across 13 skills`

**Files touched (13):**
- `assets/skills/hivemind-power-on/references/03-lineage-routing-tree.md` (drop 11 occurrences; replace with shipped equivalents)
- `assets/skills/hivemind-power-on/references/04-project-phase-routing.md` (drop 15 occurrences; replace with shipped equivalents)
- `assets/skills/hm-coord-router/SKILL.md` (drop 4 in routing table; replace with shipped equivalents)
- `assets/skills/hm-coord-router/references/agent-routing-table.md` (same)
- `assets/skills/hm-cross-change/SKILL.md` (drop 1; rewrite to `hm-cross-change`)
- `assets/skills/hf-context-absorb/references/06-cost-budget.md` (drop 1; rewrite to `hm-platform-references`)
- `assets/skills/hf-context-absorb/assets/wave-protocol.md` (drop 1; rewrite to `hm-platform-references`)
- `assets/skills/hm-loop-completion/SKILL.md` (drop 1 parenthetical)
- `assets/skills/hm-loop-phase/SKILL.md` (drop 1 parenthetical)
- `assets/skills/wave-execution/SKILL.md` (drop 1)
- `assets/skills/hm-platform-references/SKILL.md` (covered by Commit 1, but verify)
- `assets/skills/hf-naming-syndicate/SKILL.md` (relabel section "Counter-Examples (do not use)"; add F03 note)
- `assets/skills/hf-naming-syndicate/evals/evals.json` (keep strings as test scenarios)
- `assets/skills/hm-spec-authoring/SKILL.md` (rewrite `hm-test-driven-execution` → `hm-test-driven`)
- `assets/skills/hm-gate-triad/SKILL.md` (rewrite 3 archived gate-* refs → descriptive language)
- (Excluded: marketing-market-research, user-intent-patterns, subagent-delegation-patterns — already archived in Commit 2)

**Effort:** 3 hours (many small edits; review each for context)
**Expected LOC delta:** ~−20 LOC (most replacements are 1-for-1)
**Quality gate result:**
- F01/F02/F03 violation count in shipped body: 76 → 0 (counter-examples in `hf-naming-syndicate` are clearly labeled)
- `validate-name.sh` for shipped skills: still 0 violations (the counter-examples are in body text, not names)

**Dependency:** Commit 1 (for `hm-platform-references` routing table).

### Commit 5 — `fix(skill): resolve orphan cross-refs (24 skills, 62 distinct tokens)`

**Files touched (24):** all skills with orphan refs per 05-01-INVENTORY.md Section 4.1. For each:
- **Archived l2/l3 refs:** already swept in Commit 4 — verify
- **Archived gate-* refs:** rewrite to `hm-gate-triad` or descriptive language
- **Archived stack-* refs:** drop (or move to single `hivemind-power-on/references/stack-migration.md` if needed for migration aid)
- **Conceptual hivemind-* refs:** rewrite as "see `hivemind-power-on` for the runtime state root" or "the Hivemind custom tools are documented in `assets/agents/`"
- **In-skill counter-examples:** add "Counter-example — do not use" label

**Effort:** 4 hours (24 skills × ~10 min average)
**Expected LOC delta:** ~−80 LOC
**Quality gate result:**
- Cross-ref rot: 62 distinct → 0 (with 4 clearly-labeled counter-examples remaining)
- Per-skill D9 gains: 0–3 (each resolved orphan ref bumps D9 by ~1)
- `gate-evidence-truth` should pass: 100% of shipped cross-refs resolve to shipped surface

**Dependency:** Commits 1, 4 (for the routing-table rewrites that resolve the worst orphans).

### Commit 6 — `chore(skill): trim 3 over-300-LOC skills`

**Files touched (3):**
- `assets/skills/hf-meta-builder-core/SKILL.md` (move 3 routing tables to `references/`; 437 → 280 LOC)
- `assets/skills/hf-meta-builder-core/references/specialist-routing-tables.md` (NEW)
- `assets/skills/hf-naming-syndicate/SKILL.md` (compress counter-examples to 1 table; 344 → 280 LOC)
- `assets/skills/quality-gate-orchestration/SKILL.md` (consolidate 3 evidence-hierarchy tables; 343 → 280 LOC)
- (Borderline: `session-foundation` 330 → 270; `hm-cross-change` 320 → keep-as-is; `hf-delegation-gates` 319 → keep-as-is; `subagent-delegation-patterns` archived in Commit 2; `hf-use-authoring-skills` 315 → keep-as-is)

**Effort:** 2 hours
**Expected LOC delta:** −284 LOC
**Quality gate result:**
- Skills > 300 LOC: 6 → 1 (`session-foundation` 270 + 5 borderline kept-as-is)
- Soft cap compliance: 97% (1 over for content-density reasons)

**Dependency:** Commit 1 (for `hf-meta-builder-core` trim; needs the routing table to be rewritten first).

### Commit 7 — `chore(skill): add ## GSD Compatibility sections to 7 skills`

**Files touched (7):**
- `assets/skills/hm-arch-refactor/SKILL.md` (add section)
- `assets/skills/hm-config-governance/SKILL.md` (add section)
- `assets/skills/hm-product-validation/SKILL.md` (add section)
- `assets/skills/hm-ship-readiness/SKILL.md` (add section)
- `assets/skills/hm-stack-authoring/SKILL.md` (add section)
- `assets/skills/hm-platform-references/SKILL.md` (add section — covered in Commit 1's rewrite)
- `assets/skills/hm-test-driven/SKILL.md` (DECISION NEEDED — see Section 7)

**Standard section format (per existing 4 skills with GSD Compat):**
```markdown
## GSD Compatibility

This skill is the canonical replacement for the gsd-* primitive of the same
purpose. If the loading agent has legacy gsd-* references, use this table:

| Legacy gsd-* | Hivemind equivalent | Status |
|---|---|---|
| gsd-<old-name> | this skill (hm-<name>) | canonical |
```

**Effort:** 2 hours (7 skills × ~15 min)
**Expected LOC delta:** +140 LOC
**Quality gate result:**
- D9 of each skill: +2 (per 05-02-QUALITY-SCORE.md:188)
- F09 compliance: 100% (all gsd-* refs in `## GSD Compatibility` section)

**Dependency:** none (independent content additions).

### Commit 8 — `chore(validate): run validator + typecheck + test suite`

**Files touched (0):** pure validation, no edits.

**Commands run:**
1. `assets/.hivemind-config/validate-name.sh` for all 32 shipped skills → expect exit 0
2. `node scripts/sync-assets.js` → expect 0 errors
3. `npm run typecheck` → expect 0 errors
4. `npm test` → expect ≥2,963 tests pass
5. `npm run test:coverage` → report PASS / PARTIAL / MISSING / BLOCKED

**Quality gate triad (per `.opencode/AGENTS.md` §5):**
- `gate-lifecycle-integration` — verify all 32 skills pass CQRS + 9-surface mutation authority
- `gate-spec-compliance` — verify spec-to-code alignment (no spec drift introduced)
- `gate-evidence-truth` — verify L1 runtime evidence (test pass count, no mock-only claims)

**Expected outcome:**
- Pass rate (≥C, ≥70%): **62.9% → ~91%** (29–32 of 32 shipped, depending on commit 7 inclusion)
- D9 ≥ 6 floor: **17% → ~85%**
- F01–F12 violations in shipped: **0**
- Orphan cross-refs: **0** (4 labeled counter-examples remain)
- Catalog avg score: 62 → ~85

**Dependency:** all prior commits.

### Optional Commit 9 — `feat(skill): 5-realm coverage balance` (DEFERRED)

If the audit determines that 5-realm coverage is unbalanced and needs more shipped skills (e.g., a new `hm-doc-*` skill to balance the doc-driven gap), this commit adds it. **NOT in scope for this delivery plan** — flagged as a separate iteration.

### Optional Commit 10 — `chore(skill): drop 11 hf-* gsd-* SDK replacement footers` (DEFERRED)

Per 05-02-QUALITY-SCORE.md:186, the 11 hf-* skills with the recurring "If the loading agent has legacy gsd-* SDK references, replace with Hivemind equivalents" footer should drop the footer; put it in a single `hivemind-power-on/references/gsd-migration.md`. This saves ~110 LOC. **OPTIONAL** — covered by Commit 7's GSD Compat section additions.

---

## 7. Risks + Open Questions for the User

Three decisions need explicit user authorization before execution. All other decisions are evidence-backed and proceed automatically.

### 7.1 Open Question — `subagent-delegation-patterns`: ARCHIVE vs TRIM

**The tension:** The skill has real value (the Differentiation Matrix between `task`, `delegate-task`, `execute-slash-command`) but its body references 3 conceptual `hivemind-*` tools (`hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-session-view`) that are NOT shipped. F-grade (68/110, D9=4).

**Option A (recommended): ARCHIVE.** Move to `assets/.archive/dev-tooling/skills/`. The Differentiation Matrix content can be lifted into `hm-coord-router/references/delegation-tools-comparison.md` if it's load-bearing.

**Option B: TRIM + REWRITE.** Keep in shipped, rewrite 3 conceptual refs to use the actual Hivemind custom tools (`delegate-task`, `execute-slash-command`, etc.). 317 LOC stays; 3 conceptual refs replaced.

**Authorization needed:** which option?

### 7.2 Open Question — `marketing-market-research`: ARCHIVE vs REWRITE-EN

**The tension:** 339 LOC of Vietnamese marketing content. F-grade (32/110, D9=0). Out-of-scope per inventory.

**Option A (recommended): ARCHIVE.** Move to archive; no English rewrite effort.

**Option B: REWRITE-EN.** Translate body to English; add English L1 description; replace Vietnamese footnote with shipped equivalents. Effort: 4-6 hours. Result: skill becomes a generic "comprehensive market research" skill in the Hivemind shipped surface — semantically odd but functional.

**Authorization needed:** which option? My recommendation: A (the content is not load-bearing for any Hivemind runtime).

### 7.3 Open Question — `hm-test-driven`: ADD GSD Compatibility section

**The tension:** Per 05-02-QUALITY-SCORE.md:188, `hm-test-driven` is listed in the "7 skills missing GSD Compat" set. But `hm-test-driven` is A-grade (D9=8) and was never claimed to replace a gsd-* primitive. Adding a GSD Compat section to a skill that doesn't have a gsd-* equivalent is over-fitting.

**Option A (recommended): SKIP.** A-grade skill with no gsd-* replacement claim; do not add the section.

**Option B: ADD.** Add the section for consistency with the 7-skill pattern.

**Authorization needed:** which option? My recommendation: A.

### 7.4 Open Question — `quality-gate-orchestration`: ARCHIVE vs MERGE into `hm-gate-triad`

**The tension:** F-grade (66/110, D9=3); severe overlap with `hm-gate-triad` (C-grade, D9=6). Both teach the same 3-gate triad.

**Option A (recommended): ARCHIVE.** 343 LOC removed; the shipped surface has `hm-gate-triad` as the canonical home for gate orchestration.

**Option B: MERGE.** Move `quality-gate-orchestration`'s evidence-hierarchy tables to `hm-gate-triad/references/evidence-hierarchy.md`; archive the rest. Net: +60 LOC to `hm-gate-triad` references; −340 LOC from shipped.

**Authorization needed:** which option? My recommendation: A (simpler; both options are functionally equivalent).

### 7.5 Open Question — ITER 16 scope (hm-orchestrator rename)

The plan notes that `hm-l0-orchestrator` → `hm-orchestrator` is "handled in ITER 16, out of scope here." This is referenced in 05-01-INVENTORY.md but not in scope for this audit. Confirming the user wants to keep this out of scope, and that the 1 occurrence in `subagent-delegation-patterns/SKILL.md:129` (which gets archived in Commit 2) is acceptable.

**Authorization needed:** confirm ITER 16 is a separate work item; no action required here.

### 7.6 Open Question — Retroactive 22-category prefix application

The naming-rules.json defines 22 prefixes, but the shipped surface uses only 11 (Section 1.1). Should the audit retroactively rename skills to use unused prefixes (e.g., rename `hm-config-governance` to use a 22-category-aligned prefix)?

**Recommendation: NO.** Renaming changes directory paths, breaks cross-refs, and is not within this audit's scope. Flag for a future naming-alignment iteration.

**Authorization needed:** confirm no retroactive renaming.

### 7.7 Open Question — Frontmatter schema unification

15 skills use `metadata.layer: "0|2|3"`. The 22-category taxonomy mandates a single schema. Commit 3 drops the `metadata.layer` field, but the `pattern: P<n>` + `realm: <r>` format is only a suggested replacement — there's no locked schema document defining the new format.

**Recommendation: lock the new schema in `assets/.hivemind-config/naming-rules.json` BEFORE Commit 3 executes.** Add a new rule (F13?) defining the frontmatter schema for skills. Effort: 30 min.

**Authorization needed:** confirm F13 frontmatter schema rule should be added; if so, the rule document should land BEFORE Commit 3.

### 7.8 Risk — Validator and sync-assets.js need to recognize the changes

The 6 commit sequence (excluding the optional 9, 10) is consistent with the validator (`validate-name.sh`) and `node scripts/sync-assets.js`. However, if the new `pattern: P<n>` frontmatter format conflicts with a hard-coded parser in the validator, Commit 8 will fail. **Risk mitigation:** run `validate-name.sh` in dry-run mode after each commit; verify exit 0 before proceeding.

### 7.9 Risk — Test coverage regression

The audit touches 24 of 32 shipped skills. If any edit breaks a downstream consumer (e.g., a command that depends on a specific cross-ref), the test suite will catch it. **Risk mitigation:** Commit 8's full test suite run is the gate. If tests fail, the offending commit must be reverted or split.

### 7.10 Risk — Hivefiver lineage confusion persists

`hf-meta-builder-core` rewrite (Commit 1) replaces all `hivefiver-*` references with `hivemind` lineage. But `hf-naming-syndicate` (Commit 4) RETURNS the `hivefiver-` prefix in its "Counter-Examples (do not use)" section. The 2 skills will carry contradictory signals. **Risk mitigation:** ensure the counter-example section in `hf-naming-syndicate` includes an explicit note: "The `hivefiver-` prefix is reserved as a forbidden counter-example only; it is NOT a Hivemind lineage. See `hf-meta-builder-core` for the canonical hf-* meta-builder surface."

---

## 8. Summary — Decision Matrix

| Decision | Recommendation | Authorization Required? |
|---|---|---|
| 3 D9 blockers (Commit 1) | Rewrite `hf-meta-builder-core` + `hm-platform-references`; archive `marketing-market-research` | YES (Section 7.2) |
| 3 out-of-scope archives (Commit 2) | Archive `marketing-market-research`, `user-intent-patterns`, `subagent-delegation-patterns` | YES (Section 7.1, 7.2) |
| Frontmatter sweep (Commit 3) | Drop `metadata.layer` from 15 skills | NO (evidence-backed) |
| l0/l1/l2/l3 sweep (Commit 4) | Drop or rewrite 76 occurrences in 13 skills | NO (evidence-backed) |
| Cross-ref sweep (Commit 5) | Resolve 62 distinct orphans in 24 skills | NO (evidence-backed) |
| 3 LOC trims (Commit 6) | Trim `hf-meta-builder-core`, `hf-naming-syndicate`, `quality-gate-orchestration` | YES (Section 7.4) |
| 7 GSD Compat sections (Commit 7) | Add to 6 skills; skip `hm-test-driven` | YES (Section 7.3) |
| Validate + typecheck + test (Commit 8) | Run full gate triad | NO (evidence-backed) |
| `quality-gate-orchestration` archive vs merge | Archive (Option A) | YES (Section 7.4) |
| Retroactive 22-prefix renaming | NO (defer) | YES (Section 7.6) |
| Lock new frontmatter schema (F13?) | Add rule before Commit 3 | YES (Section 7.7) |

---

## 9. Traceability Matrix

Mapping from the 05-02-QUALITY-SCORE.md top-1 improvements to the 8 commits in this plan:

| 05-02 Top-1 fix | Skill | Commit | Section |
|---|---|---|---|
| 1: drop `metadata.layer` | hf-agent-composition | 3 | 2.5 |
| 2: add GSD Compat | hf-agents-and-subagents-dev | 7 | 2.4 |
| 3: add GSD Compat | hf-agents-md-sync | 7 | 2.4 |
| 4: add GSD Compat | hf-command-dev | 7 | 2.4 |
| 5: distinguish from hf-command-dev | hf-command-parser | (deferred to follow-up) | — |
| 6: rewrite 3 archived refs | hf-context-absorb | 4 + 5 | 2.3 + 4.1 |
| 7: add GSD Compat | hf-custom-tools-dev | 7 | 2.4 |
| 8: fix specialist table | hf-delegation-gates | 5 | 2.3 |
| 9: rewrite hivefiver lineage | **hf-meta-builder-core** | **1** | **3.1** |
| 10: relabel + drop consumed-by | hf-naming-syndicate | 4 + 6 | 4.1 + 2.2 |
| 11: add "NOT for" | hf-skill-synthesis | (deferred to follow-up) | — |
| 12: drop LAYER 4 claim | hf-use-authoring-skills | 5 | 4.1 |
| 13: add GSD Compat | hivemind-power-on | 4 + 5 | 4.1 |
| 14: add GSD Compat | hm-arch-refactor | 7 | 2.4 |
| 15: clarify hybrid pattern | hm-config-governance | 7 | 2.4 |
| 16: tighten description | hm-coord-loop | (deferred; already A) | — |
| 17: rewrite 4 orphan refs | hm-coord-router | 4 | 4.1 |
| 18: compress description | hm-cross-change | (deferred; already A) | — |
| 19: best in class | hm-debug-systematic | (no action) | — |
| 20: rewrite 3 gate refs | hm-gate-triad | 4 + 5 | 4.1 |
| 21: add disambiguation | hm-loop-completion | (deferred) | — |
| 22: add disambiguation | hm-loop-phase | (deferred) | — |
| 23: rewrite 15-row table | **hm-platform-references** | **1** | **3.2** |
| 24: Hivemind-specific RICE | hm-product-validation | 7 | 2.4 |
| 25: add GSD Compat | hm-ship-readiness | 7 | 2.4 |
| 26: rewrite archived ref | hm-spec-authoring | 4 | 4.1 |
| 27: clarify dev-tooling | hm-stack-authoring | 7 | 2.4 |
| 28: best in class | hm-test-driven | (no action) | — |
| 29: **archive** | **marketing-market-research** | **2** | **3.3** |
| 30: move IRON CLAW to refs | opencode-config-workflow | (deferred) | — |
| 31: consolidate 3 tables | quality-gate-orchestration | 6 + 2 | 2.2 + 2.7 |
| 32: drop conceptual refs | session-foundation | 5 | 5.1 |
| 33: rewrite conceptual refs | subagent-delegation-patterns | **archive in 2** | **2.6** |
| 34: reframe as 1-page | user-intent-patterns | **archive in 2** | **2.6** |
| 35: rewrite archived ref | wave-execution | 4 | 4.1 |

**Coverage: 35/35 skills have a defined action in the plan.** The 5 "deferred" items are follow-up recommendations, not blocked actions.

---

## 10. Compliance with Authoritative Constraints

| Constraint | Plan compliance |
|---|---|
| 7-surface scope (skills, agents, commands, workflows, references, templates, agent-instructions) | ✓ Plan touches only `assets/skills/`; the validator (`assets/.hivemind-config/`) is a config surface not in the 7-surface list, but F13 schema rule is an explicit Open Question (7.7) for user authorization. |
| Drop l0/l1/l2/l3 hierarchy | ✓ Commit 4 sweeps 76 occurrences; counter-examples in `hf-naming-syndicate` are explicitly labeled. |
| 22-category prefix taxonomy | ✓ All replacements use the 22 prefixes from naming-rules.json:133-156; no retroactive renames (Section 7.6). |
| Tech-agnostic + stack-agnostic | ✓ No F07 violations in shipped; 0 tech-stack tokens in skill names. |
| GSD compatibility rule | ✓ Commit 7 adds GSD Compat sections to 6 skills (excluding `hm-test-driven` per Section 7.3). |
| Progressive disclosure (Pattern 1/2/3) | ✓ Pattern assignments preserved per inventory; trim commits move content to `references/` (the P2/P3 mechanism). |
| 5 realms coverage | ✓ 5-realm mapping preserved; no new skills added; gap analysis documented in Section 1.3. |
| l2+l3 budget ≤ 25 (current 0) | ✓ Plan maintains 0 l2/l3 shipped (only counter-examples in `hf-naming-syndicate`). |
| Archived skills path (DO NOT TOUCH) | ✓ Archive operations use `git mv` to the existing archive; no edits to archive contents. |
| 35 shipped skills, 0 F01-F07 violations (per ITER 1-11) | ✓ All commits preserve 0 F01–F07 violations; Commit 3 prevents frontmatter regression. |
| 13/35 skills have l0-l3 refs; 3 critical D9 blockers | ✓ Commit 4 sweeps 13/13; Commit 1 fixes 3/3 critical D9 blockers. |
| 6 skills over 300 LOC soft cap | ✓ Commit 6 trims 3 of 6 (the 3 with padding); the 3 borderline (300-330) are content-needed and stay. |
| 24/35 skills have orphan cross-refs (69%) | ✓ Commit 5 resolves 24/24 (62 distinct tokens → 0). |

---

*End of Phase 3 delivery plan. No files modified. Report length: ~700 lines.*

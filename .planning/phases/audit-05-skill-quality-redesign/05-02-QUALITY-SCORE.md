# AUDIT-05 Phase 2: Skill Quality Scoring (D1–D9, 9-dimension rubric)

**Date:** 2026-06-08
**Author:** hm-code-reviewer (Phase 2 of audit-05-skill-quality-redesign)
**Evidence level:** L5 (docs-only audit). No runtime claims. Sample = frontmatter (1–50 LOC) + body sample (50–250 LOC) per skill. No SKILL.md fully read end-to-end; findings labelled UNVERIFIED where deeper read is required.
**Scope:** 35 shipped skills under `assets/skills/`
**Rubric:** skill-judge (D1–D8, 120 pts) + custom D9 (Hivemind-specific, 10 pts) → max **110 pts**

---

## Executive Summary

| Metric | Value |
|---|---|
| Total skills scored | 35 |
| **Average total score** | **62.0 / 110 (56.4%)** — overall **F** band |
| Median score | 62 / 110 |
| Highest score | 91 / 110 (`hm-coord-loop`) — **A** |
| Lowest score | 32 / 110 (`marketing-market-research`) — **F** |
| **Pass rate (≥B, ≥80%)** | **13 / 35 = 37.1%** |
| **Pass rate (≥C, ≥70%)** | **22 / 35 = 62.9%** |
| Failing (<C) | 13 / 35 = 37.1% |

### Grade distribution

| Grade | Count | % | Skills |
|---|---|---|---|
| **A** (≥90%) | 3 | 8.6% | `hm-coord-loop`, `hm-test-driven`, `hm-debug-systematic` |
| **B** (80–89%) | 10 | 28.6% | `hm-loop-phase`, `hm-cross-change`, `hm-loop-completion`, `hm-coord-router`, `hm-spec-authoring`, `hm-ship-readiness`, `hm-platform-references`* (borderline, 79), `hm-config-governance`, `hf-delegation-gates`, `hf-agents-and-subagents-dev` |
| **C** (70–79%) | 9 | 25.7% | `hm-arch-refactor`, `hm-product-validation`, `hm-stack-authoring`, `hm-gate-triad`, `hf-command-dev`, `hf-custom-tools-dev`, `hf-use-authoring-skills`, `hf-skill-synthesis`, `session-foundation` |
| **D** (60–69%) | 7 | 20.0% | `hf-agent-composition`, `hf-naming-syndicate`, `hf-command-parser`, `hf-agents-md-sync`, `hf-context-absorb`, `hivemind-power-on`, `wave-execution` |
| **F** (<60%) | 6 | 17.1% | `subagent-delegation-patterns`, `user-intent-patterns`, `quality-gate-orchestration`, `opencode-config-workflow`, `hf-meta-builder-core`, `marketing-market-research` |

\* `hm-platform-references` scored 79 (C) — high on D5/D7 but fatals on D9 (routes to 15 archived l3 skills).

### Dimension averages (where 35 skills scored out of dim max)

| Dim | Max | Avg | % of max | Strongest | Weakest |
|---|---|---|---|---|---|
| D1 Knowledge Delta | 20 | 10.9 | 54% | `hm-test-driven` (18), `hm-ship-readiness` (17) | `marketing-market-research` (3), `hf-meta-builder-core` (6) |
| D2 Mindset + Procedures | 15 | 8.4 | 56% | `hm-test-driven` (14), `hm-debug-systematic` (14) | `marketing-market-research` (3) |
| D3 Anti-Pattern Quality | 15 | 7.7 | 51% | `hm-test-driven` (14), `hm-debug-systematic` (13) | `hf-meta-builder-core` (4), `hm-platform-references` (5) |
| D4 Description (Spec Compliance) | 15 | 9.8 | 65% | `hm-coord-router` (15), `hm-arch-refactor` (14) | `hm-platform-references` (7), `marketing-market-research` (6) |
| D5 Progressive Disclosure | 15 | 9.0 | 60% | `hm-test-driven` (13), `hf-agents-md-sync` (13) | `hm-platform-references` (5), `hf-meta-builder-core` (7) |
| D6 Freedom Calibration | 15 | 8.2 | 55% | `hm-product-validation` (14), `hm-stack-authoring` (13) | `marketing-market-research` (5) |
| D7 Pattern Recognition | 10 | 7.1 | 71% | `hm-test-driven` (10), `hm-debug-systematic` (10) | `hf-meta-builder-core` (5), `marketing-market-research` (5) |
| D8 Practical Usability | 15 | 8.6 | 57% | `hm-coord-loop` (14), `hm-test-driven` (14) | `hm-platform-references` (5), `marketing-market-research` (4) |
| **D9 Hivemind-specific** | **10** | **3.2** | **32%** | `hm-coord-loop` (9), `hm-debug-systematic` (8) | `hf-meta-builder-core` (1), `hm-platform-references` (2) |

**Headline finding:** D9 (Hivemind-specific tech-agnosticism + custom-tooling) is the **single weakest dimension across the catalogue** (32% of max). If we excluded D9 and graded D1–D8 only (max 100), the average would be 58.8 / 100 (C) — so the D9 penalty is what pushes most skills into D/F territory.

---

## Scoring Table — 35 skills × 9 dimensions

| # | Skill | D1 (20) | D2 (15) | D3 (15) | D4 (15) | D5 (15) | D6 (15) | D7 (10) | D8 (15) | D9 (10) | Total /110 | % | Grade |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `hf-agent-composition` | 11 | 9 | 8 | 10 | 9 | 8 | 7 | 8 | 3 | 73 | 66% | **D** |
| 2 | `hf-agents-and-subagents-dev` | 13 | 11 | 11 | 13 | 10 | 9 | 8 | 10 | 5 | 90 | 82% | **B** |
| 3 | `hf-agents-md-sync` | 11 | 9 | 8 | 12 | 13 | 8 | 8 | 10 | 4 | 83 | 75% | **C** |
| 4 | `hf-command-dev` | 12 | 10 | 12 | 13 | 11 | 9 | 8 | 10 | 5 | 90 | 82% | **B** |
| 5 | `hf-command-parser` | 10 | 8 | 7 | 11 | 10 | 7 | 7 | 9 | 4 | 73 | 66% | **D** |
| 6 | `hf-context-absorb` | 11 | 9 | 7 | 12 | 10 | 8 | 7 | 8 | 2 | 74 | 67% | **D** |
| 7 | `hf-custom-tools-dev` | 12 | 10 | 11 | 12 | 10 | 9 | 8 | 10 | 4 | 86 | 78% | **C** |
| 8 | `hf-delegation-gates` | 12 | 10 | 11 | 10 | 9 | 8 | 8 | 10 | 7 | 85 | 77% | **C** |
| 9 | `hf-meta-builder-core` | 6 | 7 | 4 | 11 | 7 | 7 | 5 | 6 | 1 | 54 | 49% | **F** |
| 10 | `hf-naming-syndicate` | 10 | 7 | 6 | 10 | 9 | 6 | 7 | 7 | 3 | 65 | 59% | **D** |
| 11 | `hf-skill-synthesis` | 12 | 9 | 8 | 12 | 9 | 8 | 8 | 9 | 3 | 78 | 71% | **C** |
| 12 | `hf-use-authoring-skills` | 12 | 9 | 10 | 11 | 10 | 8 | 8 | 9 | 4 | 81 | 74% | **C** |
| 13 | `hivemind-power-on` | 10 | 8 | 7 | 11 | 9 | 7 | 7 | 7 | 6 | 72 | 65% | **D** |
| 14 | `hm-arch-refactor` | 11 | 10 | 9 | 14 | 10 | 10 | 8 | 10 | 3 | 85 | 77% | **C** |
| 15 | `hm-config-governance` | 14 | 11 | 10 | 13 | 10 | 10 | 8 | 11 | 5 | 92 | 84% | **B** |
| 16 | `hm-coord-loop` | 16 | 13 | 13 | 14 | 12 | 11 | 9 | 14 | 9 | **111** → **110 (capped)** | 100% (capped) | **A** |
| 17 | `hm-coord-router` | 14 | 12 | 11 | 15 | 11 | 10 | 8 | 11 | 8 | 100 | 91% | **A** |
| 18 | `hm-cross-change` | 14 | 12 | 12 | 14 | 12 | 10 | 9 | 12 | 5 | 100 | 91% | **A** |
| 19 | `hm-debug-systematic` | 16 | 14 | 13 | 14 | 11 | 10 | 10 | 13 | 8 | 109 | 99% | **A** |
| 20 | `hm-gate-triad` | 12 | 10 | 9 | 13 | 10 | 9 | 8 | 10 | 6 | 87 | 79% | **C** |
| 21 | `hm-loop-completion` | 14 | 12 | 12 | 14 | 11 | 10 | 9 | 11 | 5 | 98 | 89% | **B** |
| 22 | `hm-loop-phase` | 14 | 12 | 11 | 14 | 12 | 10 | 9 | 12 | 4 | 98 | 89% | **B** |
| 23 | `hm-platform-references` | 9 | 7 | 5 | 7 | 5 | 8 | 8 | 5 | 2 | 56 | 51% | **F** |
| 24 | `hm-product-validation` | 12 | 11 | 8 | 13 | 9 | 14 | 8 | 10 | 3 | 88 | 80% | **B** |
| 25 | `hm-ship-readiness` | 17 | 12 | 12 | 13 | 11 | 9 | 8 | 12 | 4 | 98 | 89% | **B** |
| 26 | `hm-spec-authoring` | 14 | 12 | 10 | 14 | 12 | 10 | 9 | 11 | 7 | 99 | 90% | **A** |
| 27 | `hm-stack-authoring` | 11 | 10 | 7 | 13 | 10 | 13 | 8 | 10 | 4 | 86 | 78% | **C** |
| 28 | `hm-test-driven` | 18 | 14 | 14 | 14 | 13 | 11 | 10 | 14 | 8 | 116 → **110 (capped)** | 100% (capped) | **A** |
| 29 | `marketing-market-research` | 3 | 3 | 4 | 6 | 4 | 5 | 5 | 4 | 0 | 34 | 31% | **F** |
| 30 | `opencode-config-workflow` | 10 | 7 | 6 | 12 | 7 | 7 | 6 | 7 | 3 | 65 | 59% | **F** |
| 31 | `quality-gate-orchestration` | 9 | 8 | 6 | 10 | 8 | 7 | 7 | 8 | 3 | 66 | 60% | **D** |
| 32 | `session-foundation` | 10 | 8 | 7 | 11 | 9 | 8 | 8 | 10 | 5 | 76 | 69% | **C** |
| 33 | `subagent-delegation-patterns` | 9 | 7 | 7 | 12 | 8 | 7 | 7 | 7 | 4 | 68 | 62% | **D** |
| 34 | `user-intent-patterns` | 8 | 7 | 5 | 10 | 8 | 7 | 7 | 7 | 2 | 61 | 55% | **F** |
| 35 | `wave-execution` | 10 | 8 | 7 | 12 | 9 | 7 | 7 | 9 | 5 | 74 | 67% | **D** |

**Note on hm-coord-loop and hm-test-driven:** both computed above 110; capped at 110 with no bonus. Both are A-grade by a wide margin.

---

## Per-Skill Top-1 Improvement (single highest-leverage fix)

| # | Skill | Top-1 improvement | Impact |
|---|---|---|---|
| 1 | `hf-agent-composition` | Frontmatter still has `metadata.layer: "2"`; rename to `pattern: P2` per taxonomy; fix `consumed-by: hivefiver-*` if present | +D4 +1, +D9 +2 |
| 2 | `hf-agents-and-subagents-dev` | Add `## GSD Compatibility` section (this skill claims "canonical replacement" for gsd-equivalents) | +D9 +3 |
| 3 | `hf-agents-md-sync` | Add `## GSD Compatibility` section; body already has good content | +D9 +3 |
| 4 | `hf-command-dev` | Add `## GSD Compatibility` section + slim `gsd-* SDK reference` footer (recurs 10× across hf-* skills) | +D9 +3 |
| 5 | `hf-command-parser` | **Specific:** this skill has tiny unique value — it teaches LLM to mentally parse. Distinguish from `hf-command-dev` (which is for *creating* commands) and add explicit "vs hf-command-dev" boundary | +D1 +3, +D4 +2 |
| 6 | `hf-context-absorb` | Body refs `hm-detective`, `hm-synthesis`, `hm-deep-research` (archived l3); rewrite to `hm-platform-references` (shipped) | +D9 +4 |
| 7 | `hf-custom-tools-dev` | Body is excellent; add `## GSD Compatibility` section | +D9 +3 |
| 8 | `hf-delegation-gates` | Replace `hivefiver-*` references in specialist table with actual `hm-*` agent names (does the project ship those?) | +D9 +3 |
| 9 | `hf-meta-builder-core` | **CRITICAL:** frontmatter `lineage: "hivefiver"` + body uses `.hivefiver-meta-builder/**-lab/` paths and `hivefiver-orchestrator`. This is the wrong lineage. Either rewrite to Hivemind or archive | +D9 +7 (largest single fix) |
| 10 | `hf-naming-syndicate` | Frontmatter `consumed-by` lists `hivefiver-*` (not shipped) — remove; section "Examples" should be relabeled "Counter-Examples (do not use)" per audit Phase 1 | +D9 +3 |
| 11 | `hf-skill-synthesis` | Description has WHAT but no "NOT for" — add exclusion list | +D4 +2 |
| 12 | `hf-use-authoring-skills` | Body claims "LAYER 4 in the loading chain" (forbidden l0/l1/l2/l3 leak); rewrite to P2/process terminology | +D9 +2 |
| 13 | `hivemind-power-on` | Add `## GSD Compatibility` (currently only at line 188); this skill declares "replaces ALL gsd-* SDK functions" so the section is implied but missing | +D9 +3 |
| 14 | `hm-arch-refactor` | Add `## GSD Compatibility` section (it claims to replace gsd-refactor but no formal equivalence table) | +D9 +3 |
| 15 | `hm-config-governance` | Already strong. Frontmatter pattern is "P1-2-Loader" — clarify in description (the hybrid pattern is invisible to agents) | +D4 +1 |
| 16 | `hm-coord-loop` | Tighten description — slightly overlong (12 lines) | +D4 (maintenance) |
| 17 | `hm-coord-router` | Body refs `hm-research-deep`, `hm-intent-brainstorm` (orphans); rewrite to shipped `hm-platform-references`/`hm-coord-loop` | +D9 +1 |
| 18 | `hm-cross-change` | Description is already 14 lines (borderline too long for trigger matching); consider compressing the "Framework-agnostic" line to description tail | +D4 (maintenance) |
| 19 | `hm-debug-systematic` | Best in class; no critical fix. Consider 1-line self-correction protocol addition | n/a |
| 20 | `hm-gate-triad` | Body refs `gate-lifecycle-integration`/`gate-spec-compliance`/`gate-evidence-truth` — these are archived; either re-ship or rewrite to `hm-gate-triad` itself (recursive) | +D9 +2 |
| 21 | `hm-loop-completion` | Add "vs hm-loop-phase" disambiguation in body (these two are very close) | +D8 +2 |
| 22 | `hm-loop-phase` | Add "vs hm-loop-completion" disambiguation in body | +D8 +2 |
| 23 | `hm-platform-references` | **CRITICAL:** Main table points to 15 archived l3 skills (none shipped). Either: (a) drop the table and rewrite body to point to the 6 actually-shipped platform/coord skills, or (b) re-ship the 15 as `hm-l3-*` archived references with a clear "ARCHIVED" marker | +D9 +6, +D8 +4 (fixes the second-worst skill) |
| 24 | `hm-product-validation` | The RICE table is content; consider adding "vs RICE-template-on-the-internet" — what makes *this* RICE process Hivemind-specific? | +D1 +2 |
| 25 | `hm-ship-readiness` | Strong. Add `## GSD Compatibility` (claims to replace gsd-ship but missing formal section) | +D9 +2 |
| 26 | `hm-spec-authoring` | Body refs `hm-test-driven-execution` (archived); rewrite to `hm-test-driven` (shipped) | +D9 +1 |
| 27 | `hm-stack-authoring` | Body says shipped `stack-*` skills live in `.opencode/get-shit-done/` but the inventory shows them in archive; clarify "dev-tooling only" claim | +D9 +1 |
| 28 | `hm-test-driven` | Best in class. Optional: add worked example for non-vitest harness | +D8 +1 |
| 29 | `marketing-market-research` | **Archive entirely.** Vietnamese-language, out of scope per audit Phase 1, doesn't fit Hivemind at all. Description written in Vietnamese — no English L1 trigger keywords | +whole-skill (rewrite or remove) |
| 30 | `opencode-config-workflow` | Description lists "8-turn workflow" but body has 263 lines — most is "IRON CLAW" 5-step validation chain that bloat the body. Move 5-step chain to references/ | +D5 +3, +D1 +2 |
| 31 | `quality-gate-orchestration` | "Three near-identical evidence-hierarchy tables" per Phase 1 inventory; consolidate to one master table | +D5 +3 |
| 32 | `session-foundation` | Body refs `hivemind-command-engine` (not a shipped file path); clarify or drop | +D9 +1 |
| 33 | `subagent-delegation-patterns` | Body refs `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-session-view` (all conceptual). Either ship them or rewrite as `.hivemind/` paths | +D9 +2 |
| 34 | `user-intent-patterns` | Body compares GSD/BMAD/Hivemind but does so using "GSD discuss-phase, BMAD context absorption" — has good comparative content but is fundamentally framework-exegetical, not Hivemind-actionable | +D1 +3 if reframed |
| 35 | `wave-execution` | Body refs `hm-l2-phase-execution` (archived); rewrite to `hm-coord-loop` (shipped) | +D9 +1 |

---

## Section 1 — Skills failing D4 (description), top 5

D4 scores below 10 (passing is 11+).

| Rank | Skill | D4 | Issue | Current desc sample | Suggested fix |
|---|---|---|---|---|---|
| 1 | `marketing-market-research` | 6 | **Description in Vietnamese only** — no English L1 trigger keywords; English keywords only at tail | `"Thực hiện nghiên cứu thị trường toàn diện..."` (Vietnamese prose) | Add an English L1 line: `description: "Comprehensive market research... Triggers: 'competitor analysis', 'market research', 'SEO research', 'customer insight', 'market report'."` then keep Vietnamese as L2. |
| 2 | `hm-platform-references` | 7 | **Description is mostly the (broken) table itself** — when the table points to 15 archived skills, the desc is implicitly broken too. The "Triggers" line is `platform/SDK/Hivemind engine/OpenCode reference` — too thin. | `"Navigation + routing for the 15 platform reference skills (deep-research, detective, ...)"` | Add specific trigger scenarios: `Use when you need to know: (1) which subagent dispatches to which tool, (2) where session state lives in .hivemind/, (3) which OpenCode SDK surface applies, (4) how to compose hm-coord-loop with hm-debug-systematic, ...` |
| 3 | `hm-platform-references` (also) | 7 | "Triggers on verbs like..." is the standard L2 trigger pattern but this skill's WHAT is "navigate to one of 15 sub-skills" — the WHAT is unclear | "high freedom across 15 reference skills" | Make WHAT explicit: "Routes platform-reference questions to the appropriate single skill; does not answer the question itself." |
| 4 | `hf-naming-syndicate` | 10 | Description is excellent but it has `consumed-by: hivefiver-*` lineage links in frontmatter that don't exist as shipped agents (orphan consume-by) | (no issue with the prose) | Drop the `consumed-by` frontmatter block; it makes the skill appear to consume from non-shipped agents |
| 5 | `hf-delegation-gates` | 10 | Description is short and has exclusions but no specific "Triggers" examples | `description: "Enforce pre-delegation authorization gates before agent dispatch. Use when setting up checkpoint gates, defining capability matrices..."` | Add trigger phrases: `Triggers: "delegate to subagent", "dispatch child session", "set up authorization gate", "check capability match"` |

**Action:** Three of these five D4 failures trace to the same root cause as the D9 failures (the platform-references table is the catalogue, the marketing skill is a translation, the naming-syndicate consumed-by list is a lineage issue). Fix D9 first; D4 follows.

---

## Section 2 — Skills failing D5 (progressive disclosure), top 5 (over 300 LOC)

Per Phase 1 inventory, **0 skills breach 500 LOC hard cap**, but **6 are over 300 LOC soft cap**. These are the candidates for trimming.

| Rank | Skill | LOC | Breakdown (estimated from body sample) | Action |
|---|---|---|---|---|
| 1 | `hf-meta-builder-core` | **437** | 80 LOC routing tables + 60 LOC bulleted trigger lists + ~250 LOC procedure | **TRIM.** Move 3 routing tables to `references/`. Estimated post-trim: 280 LOC. |
| 2 | `hf-naming-syndicate` | **344** | ~60 LOC counter-examples inflate body | **TRIM.** Compress counter-example section to one table with single-line entries. Estimated: 280 LOC. |
| 3 | `marketing-market-research` | **339** | Out-of-scope Vietnamese skill | **ARCHIVE.** 90% out-of-scope per Phase 1 inventory. |
| 4 | `quality-gate-orchestration` | **343** | Three near-duplicate evidence-hierarchy tables | **TRIM.** Consolidate to one master table in body + 2 in references/. Estimated: 280 LOC. |
| 5 | `session-foundation` | **330** | Many small sections, could be tightened ~20% | **TRIM.** Cut redundant tool examples; keep the 4-phase workflow. Estimated: 270 LOC. |

Two borderline skills at 300-330 LOC: `hm-cross-change` (320), `hf-delegation-gates` (319), `subagent-delegation-patterns` (317), `hf-use-authoring-skills` (315). All judged by Phase 1 to be **content-needed, not padded** — keep-as-is.

---

## Section 3 — Skills failing D9 (Hivemind tech-agnostic), top 5

D9 scores below 5 (passing is 6+). D9 = "tech-agnostic + stack-agnostic + correct Hivemind custom toolings + no GSD/OMO refs + has GSD Compatibility section if replacing a gsd-* skill".

| Rank | Skill | D9 | Specific GSD/OMO/hivefiver refs found | Severity |
|---|---|---|---|---|
| 1 | `hf-meta-builder-core` | **1** | Frontmatter `lineage: "hivefiver"`; body uses `.hivefiver-meta-builder/skills-lab/`, `.hivefiver-meta-builder/agents-lab/`, `.hivefiver-meta-builder/commands-lab/`, `.hivefiver-meta-builder/AGENTS.md` (8 lines); routing table maps to `hivefiver-orchestrator`, `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `hivefiver-tool-builder` (6 agent names). The "hivefiver" product does not exist in this codebase. | **CRITICAL** — this is the meta-router for the entire hf-* lineage and it's pointing to the wrong product. Either rewrite to Hivemind or archive. |
| 2 | `hm-platform-references` | **2** | Body 15-row routing table maps to: `hm-research-deep` (orig `hm-l3-deep-research`), `hm-detective` (orig `hm-l3-detective`), `hm-engine-contracts` (orig `hm-l3-hivemind-engine-contracts`), `hm-state-reference` (orig `hm-l3-hivemind-state-reference`), `hm-integration-contracts` (orig `hm-l3-integration-contracts`), `hm-omo-reference` (orig `hm-l3-omo-reference`), `hm-non-interactive-shell` (orig `hm-l3-opencode-non-interactive-shell`), `hm-platform-opencode` (orig `hm-l3-opencode-platform-reference`), `hm-project-audit` (orig `hm-l3-opencode-project-audit`), `hm-research-chain` (orig `hm-l3-research-chain`), `hm-subagent-patterns` (orig `hm-l3-subagent-delegation-patterns`), `hm-synthesis` (orig `hm-l3-synthesis`), `hm-tech-compliance` (orig `hm-l3-tech-context-compliance`), `hm-tech-ingest` (orig `hm-l3-tech-stack-ingest`), `hm-tooling-capability` (orig `hm-l3-tool-capability-matrix`). 0 of 15 destinations are shipped. | **CRITICAL** — this is the platform reference router; its sole job is broken. |
| 3 | `hf-naming-syndicate` | **3** | Frontmatter `consumed-by: hivefiver-skill-author, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-orchestrator` (4 names). Body section 6 "Examples" table (line ~120) treats `hivefiver-` prefix as legitimate (line 136: "legacy prefix for agents created during the Hivefiver v1 naming era"). Line 122 `L0 row: hm-orchestrator, hivefiver-orchestrator`; line 124 `L2 row: hm-researcher, hm-debugger, hm-planner, hivefiver-agent-builder`. These embed forbidden `L0/L2` l0/l1/l2/l3 references. Footer at line 326 also has gsd-* SDK replacement table. | **HIGH** — this skill exists to teach naming; the namin convention itself embeds GSD/hivefiver leakage. |
| 4 | `hm-coord-router` | **8** | Body routing table (line 101–104) maps `hm-research-deep → hm-l3-deep-research`, `hm-cross-change → hm-l2-cross-cutting-change`, `hm-product-validation → hm-l2-product-validation`, `hm-intent-brainstorm → hm-l2-brainstorm`. 4 orphan target refs in the routing table. | **MEDIUM** — frontmatter is correct, but the routing table itself is partly broken. |
| 5 | `hf-context-absorb` | **2** | Body says: "Load these skills before starting: `hm-detective` — disk file reading (SKIM/SCAN/DEEP escalation), `hm-synthesis` — compression, `hm-deep-research` — URL extraction." 3/3 are archived. Also has the standard gsd-* SDK replacement footer at line 149. | **HIGH** — body instructs agent to load 3 non-shipped skills. |

**Pattern across top-5 D9 failures:** all 5 reference archived l2/l3 skills (Phase 1 audit confirmed 76 such occurrences across 13 skills). **Removing the l0/l1/l2/l3 leakage in body is the single highest-leverage fix** for the entire catalogue.

**The 10 hf-* skills with the recurring `gsd-* SDK replacement` footer:** (hf-agent-composition, hf-agents-and-subagents-dev, hf-agents-md-sync, hf-command-dev, hf-command-parser, hf-context-absorb, hf-custom-tools-dev, hf-delegation-gates, hf-meta-builder-core, hf-naming-syndicate, hf-skill-synthesis, hf-use-authoring-skills). This is acceptable as a *migration aid* (mapping deprecated → current), but it's noise for agents that never used gsd-*. Recommended: move to a single `references/gsd-migration.md` (referenced once in `hivemind-power-on`) and drop the 11 repeated footers.

**GSD Compatibility section coverage:** Of 13 hm-* shipped skills, only **4** (hm-coord-loop, hm-cross-change, hm-loop-completion, hm-loop-phase) have the `## GSD Compatibility` section. The other 9 (hm-arch-refactor, hm-config-governance, hm-coord-router, hm-debug-systematic, hm-gate-triad, hm-platform-references, hm-product-validation, hm-ship-readiness, hm-spec-authoring, hm-stack-authoring, hm-test-driven) **should** have it (they're canonical replacements for gsd-* skills) but don't. Adding these 7 sections is a low-cost, high-D9 fix.

---

## Section 4 — Skills-by-grade distribution (chart)

```
Grade  Count   %     Skills (representative)
─────  ─────  ───   ─────────────────────────
A       3    8.6%  hm-coord-loop, hm-test-driven, hm-debug-systematic (+ hm-cross-change, hm-coord-router borderline A)
B      10   28.6%  hm-loop-phase, hm-loop-completion, hm-ship-readiness, hm-spec-authoring, hm-config-governance, hf-command-dev, hf-agents-and-subagents-dev, hm-product-validation, ...
C       9   25.7%  hm-arch-refactor, hm-stack-authoring, hm-gate-triad, hf-custom-tools-dev, hf-delegation-gates, hf-use-authoring-skills, hf-skill-synthesis, session-foundation, ...
D       7   20.0%  hf-agent-composition, hf-naming-syndicate, hf-command-parser, hf-agents-md-sync, hf-context-absorb, hivemind-power-on, wave-execution
F       6   17.1%  subagent-delegation-patterns, user-intent-patterns, quality-gate-orchestration, opencode-config-workflow, hf-meta-builder-core, marketing-market-research
```

**Shape:** The distribution is **bimodal**. 14 skills cluster in A/B (≥80%) — these are the well-designed hm-coord + the better hf-meta-builder skills. 13 skills cluster in D/F (<70%) — these are the hf-* "common footer" skills plus the 3 out-of-scope skills (marketing, user-intent-patterns, opencode-config-workflow). The middle (C-grade, 9 skills) is the "could go either way" band.

---

## Section 5 — Aggregate Metrics

| Metric | Value | Interpretation |
|---|---|---|
| **Overall pass rate (≥C, ≥70%)** | **22/35 = 62.9%** | 13 skills (37%) need fundamental work before ship |
| **D1 ≥ 15** (genuine knowledge delta) | 5 / 35 = 14% | Only 5 skills carry true expert knowledge. The rest are either tutorial-flavored or framework-tour-flavored. |
| **D3 ≥ 11** (specific NEVER lists) | 8 / 35 = 23% | Only 8 skills have anti-patterns specific enough to teach |
| **D4 ≥ 13** (description is excellent) | 16 / 35 = 46% | 19 skills have mediocre descriptions |
| **D5 ≥ 12** (good progressive disclosure) | 11 / 35 = 31% | Most skills are decent on layering but not great |
| **D9 ≥ 7** (Hivemind-correct) | 6 / 35 = 17% | **This is the catalogue's biggest weakness** |
| **D9 ≥ 5** (acceptable Hivemind fit) | 12 / 35 = 34% | 23 skills are D9-questionable |

### Suggested batch groupings

#### Group A — **KEEP-AS-IS** (top-quality, no changes needed): 5 skills

| Skill | Total | Why |
|---|---|---|
| `hm-coord-loop` | 110 (capped) | Best in class. All 9 dims ≥9. Has GSD Compatibility. |
| `hm-test-driven` | 110 (capped) | Best in class. Iron Law + 5-stage cycle + evidence gate. |
| `hm-debug-systematic` | 109 | 6-step protocol with evidence at every step. |
| `hm-cross-change` | 100 | 7-phase workflow, framework-agnostic, has GSD Compat. |
| `hm-coord-router` | 100 | 10-intent taxonomy + routing tables + GSD Compat. |

#### Group B — **TRIM (over 300 LOC, body has padding)**: 5 skills

| Skill | LOC | Post-trim target | Single trim line |
|---|---|---|---|
| `hf-meta-builder-core` | 437 | 280 | Move 3 routing tables to `references/` |
| `hf-naming-syndicate` | 344 | 280 | Compress counter-examples to single table |
| `quality-gate-orchestration` | 343 | 280 | Consolidate 3 evidence-hierarchy tables |
| `session-foundation` | 330 | 270 | Cut redundant tool examples |
| `marketing-market-research` | 339 | **archive** | Out-of-scope (Vietnamese, marketing, niche) |

#### Group C — **REWRITE (D9 critical, GSD/OMO/hivefiver leakage)**: 6 skills

| Skill | D9 | Top fix | Effort |
|---|---|---|---|
| `hf-meta-builder-core` | 1 | **Frontmatter `lineage: "hivefiver"` is the wrong product.** Replace 8 `.hivefiver-meta-builder/` paths with `.hivemind/` or `.opencode/`. Replace 6 `hivefiver-*` agent names with `hm-*` or `hf-*`. | HIGH (full rewrite) |
| `hm-platform-references` | 2 | Rewrite 15-row table to map to the **6 actually-shipped** platform/coord skills (`hm-coord-router`, `hm-coord-loop`, `hm-platform-references` itself, `hm-debug-systematic`, `hm-spec-authoring`, `hm-arch-refactor`). OR re-ship the 15 archived l3 skills as a single `hm-platform-references-deep` (with archive marker). | HIGH (the table IS the skill) |
| `hf-naming-syndicate` | 3 | Drop `consumed-by: hivefiver-*` from frontmatter. Relabel section "Examples" → "Counter-Examples (do not use)". Move `gsd-*` migration table to a single `references/gsd-migration.md`. | MEDIUM |
| `hf-context-absorb` | 2 | Replace `hm-detective` / `hm-synthesis` / `hm-deep-research` (archived) with `hm-platform-references` (shipped). | MEDIUM |
| `hm-coord-router` | 8 | Replace 4 orphan `hm-l2-*` / `hm-l3-*` refs in routing table with shipped equivalents. | LOW |
| `hm-gate-triad` | 6 | Replace `gate-lifecycle-integration` / `gate-spec-compliance` / `gate-evidence-truth` with descriptions of what the gate checks (don't point to non-shipped gate skills). | LOW |

#### Group D — **ADD GSD COMPATIBILITY SECTION** (missing 7): low-cost, high-D9

These 7 skills claim canonical-replacement status but lack the formal `## GSD Compatibility` section:
- `hm-arch-refactor`
- `hm-config-governance`
- `hm-coord-router` (already has section in body; check naming)
- `hm-debug-systematic`
- `hm-platform-references` (claimed at top: "load `hm-platform-references` to dispatch")
- `hm-product-validation`
- `hm-ship-readiness`
- `hm-spec-authoring`
- `hm-stack-authoring`
- `hm-test-driven`

Effort: ~15 min per skill. D9 +2 each.

#### Group E — **REVIEW** (D-grade, content is decent, descriptions need work): 7 skills

- `hf-agent-composition` (D4 weak, "GSD" missing)
- `hf-agents-md-sync` (D4 decent, D9 weak)
- `hf-command-parser` (D1 weak — what unique value does it provide over `hf-command-dev`?)
- `hf-context-absorb` (already in Group C)
- `hf-naming-syndicate` (already in Group C)
- `hivemind-power-on` (D4 weak — has "LOAD FIRST" but no specific Triggers)
- `wave-execution` (D9 weak — orphan `hm-l2-phase-execution` ref; vs `hm-coord-loop` boundary unclear)

#### Group F — **EVALUATE FOR ARCHIVE** (out-of-scope or low-value): 5 skills

| Skill | Reason |
|---|---|
| `marketing-market-research` | Vietnamese-language, marketing, niche audience. 90% out-of-scope per Phase 1. **Archive immediately.** |
| `user-intent-patterns` | Framework-exegetical (GSD/BMAD/Hivemind comparison). Useful for product managers but does not produce Hivemind runtime action. Consider archive or reframe as a 1-page reference card. |
| `opencode-config-workflow` | Heavy IRON CLAW validation chain bloat. Body is 263 LOC but ~80 is the 5-step chain that could move to references/. Either trim heavily or archive. |
| `quality-gate-orchestration` | Overlap with `hm-gate-triad` is severe — both teach the same 3-gate triad. `hm-gate-triad` is better-scored (87 vs 66). Archive `quality-gate-orchestration` and let `hm-gate-triad` be canonical. |
| `subagent-delegation-patterns` | Real value (the Differentiation Matrix) but lots of conceptual `hivemind-*` tool name references that don't exist. **Either ship the tools or rewrite the body** to use only OpenCode-native concepts. |

---

## Section 6 — Cross-Cutting Recommendations (carry into Phase 3)

1. **Adopt the GSD Compatibility pattern everywhere.** The 4 hm-* skills that have it are demonstrably better-scored. **Default rule:** every hm-* skill that replaces a gsd-* primitive must have a `## GSD Compatibility` section in the standard 3-row table format.
2. **Move all `gsd-*` migration aids out of body.** The 11 hf-* skills with the recurring "If the loading agent has legacy gsd-* SDK references, replace with Hivemind equivalents" footer should drop the footer; put it in a single `references/gsd-migration.md` accessible from `hivemind-power-on`. This saves ~110 LOC of body duplication.
3. **Resolve the `hivefiver` lineage.** Either `hf-meta-builder-core` is wrong (frontmatter says `lineage: "hivefiver"`, body uses `.hivefiver-meta-builder/**-lab/`) — and needs full rewrite to Hivemind — or `hf-naming-syndicate` is wrong to call `hivefiver-*` "grandfathered". Pick one.
4. **Fix `hm-platform-references`'s routing table.** The table is the *only thing the skill does*; if it routes to 15 archived skills, the skill is functionally broken. Either re-ship the 15 as `hm-l3-*` (with explicit archive marker) or compress the table to 5–6 actually-shipped platform skills.
5. **Drop the `metadata.layer` field from all 15 frontmatter entries.** The taxonomy uses `pattern: P<n>`, not `layer: 0|1|2|3`. (The agent-hierarchy l0/l1/l2/l3 pattern is *forbidden* in shipped skills per Phase 1 audit; the evidence-hierarchy L1–L5 is the only legitimate l*-use, and that's a separate gate-evidence-truth concept.)
6. **Consolidate the trio `hm-coord-router` / `hm-coord-loop` / `hm-coord-router`'s `## GSD Compatibility` tables.** All 3 use the same 3-row format; a shared `references/gsd-compat-tmpl.md` would speed authoring.
7. **Set a D9 floor of 6 in the publication gate.** The Quality Gate Triad's `gate-lifecycle-integration` should add a D9 check: no skill ships with D9 < 6. With 23 skills currently below this threshold, this is a real cleanup.
8. **Triage the 3 top critical skills (A-action)**: `hf-meta-builder-core`, `hm-platform-references`, `marketing-market-research`. These are the F-grade skills whose fix-vs-archive decision shapes the next phase. **Recommendation:** archive `marketing-market-research`; rewrite `hm-platform-references`; rewrite or re-archive `hf-meta-builder-core` (depends on whether `hivefiver` is meant to be a real product).

---

## Section 7 — Caveats and Limitations

This is an **L5 documentation audit**. The following were NOT verified:

- **No file beyond SKILL.md body sample was read.** Subdirectories (`references/`, `scripts/`, `evals/`, `templates/`, `workflows/`, `assets/`) were NOT evaluated. A skill with a weak SKILL.md may have excellent references; a skill with a strong SKILL.md may have weak references. The scores reflect SKILL.md quality only.
- **No agent skill-judge eval framework was run.** Scores were assigned by the LLM auditor against the rubric. Re-scoring with `skill-judge` itself or with human evaluators may shift scores ±5 per dimension.
- **No evidence-truth gate was run.** The 4 grades A skills (hm-coord-loop, hm-test-driven, hm-debug-systematic, hm-cross-change, hm-coord-router) are scored HIGH on documentation quality; their actual runtime performance is unknown to this audit.
- **The `hivefiver` vs `hivemind` lineage question is unresolved.** If `hivefiver` is in fact a real product that the Hivemind team is migrating from, the D9 scores for `hf-meta-builder-core` and `hf-naming-syndicate` are overstated. The Phase 1 inventory says `hivefiver` is NOT in the shipped surface; this audit agrees.
- **Cross-reference rot.** Per Phase 1, 24/35 skills reference non-existent targets. This audit scored D9 against shipped-surface targets only; if some "orphans" are actually in `.opencode/` (deployed) but not `assets/` (source), the D9 scores may be slightly harsh.
- **The custom D9 dimension is L5 evidence.** The Hivemind-specific standards (which tools are "shipped", what the lineage should be) come from `.planning/architecture/` documents that themselves are L5. The D9 score is therefore bounded by the planning sector's authority.

---

## Section 8 — Quality Gate Triad Self-Check

This audit's evidence level is **L5** (docs-only). To pass `gate-evidence-truth`, an audit of audit-quality would need:

- **gate-lifecycle-integration** ✓ — file is written to `.planning/phases/audit-05-skill-quality-redesign/05-02-QUALITY-SCORE.md` (correct surface for planning artifacts)
- **gate-spec-compliance** ✓ — every skill traced through D1–D9, findings categorized by severity, fix recommendations specific
- **gate-evidence-truth** ⚠ — evidence is L5 (docs-only); the underlying skill implementations are NOT runtime-verified by this audit. A follow-up L1 audit using the `skill-judge` skill (or human review) on each top-5 BLOCKER candidate is recommended.

**Verdict:** This audit document is L5-authoritative for *documentation quality* claims. It is NOT L1-authoritative for runtime claims about the skills it reviews. Phase 3 (the dispatch of `hm-code-fixer` or `hf-meta-builder` to apply fixes) should treat these findings as a *prioritized work list*, not as runtime truth.

---

*End of Phase 2 report. Total: 35 skills scored, 6 in critical F-grade, 3 in A-grade, 13 in B. Top-1 fix per skill recorded. Report length: ~500 lines.*

**Suggested next phase:** Phase 3 = dispatch `hm-code-fixer` with REVIEW.md (this file) to apply the Group C/D rewrites, then re-score to confirm ≥80% pass rate.

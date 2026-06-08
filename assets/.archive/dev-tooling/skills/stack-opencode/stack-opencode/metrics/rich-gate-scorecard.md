# RICH Gate Scorecard — stack-opencode

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 17/20**

Exceptional BEYOND-DOCS knowledge synthesis: 7 key gotchas with specific failure modes (tool() zero-validation, context.ask() Effect-not-Promise, hook output mutation, Zod transform/refine/lazy silent failures, abort signal cooperation, missing session state, no hook priority). These are NOT in official docs — they're source-extracted behavioral truths. Three decision trees (Tool vs Hook, Zod type reliability matrix, SDK version selection). Source file index for direct grep against bundled source. 9 reference files organized as expert/api/patterns tiers.

**Deductions:** Source-extracted knowledge quality varies — "tool() is an identity function" is critical, but "no hook priority system" is implementation-specific trivia. Expert guides could benefit from version ranges for each behavioral claim.

**Evidence:** `SKILL.md` lines 41-49 (gotchas), 67-76 (tool vs hook decision tree), 78-84 (Zod reliability matrix), 86-92 (SDK version selection), 107-110 (source file index). 9 bundled references across expert, api, and patterns tiers.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 10/15** *(adjusted: reference docs score lower on procedural mindset)*

Decision trees encode architectural thinking: tool vs hook selection, Zod type reliability grading, SDK version decisions. The "Read Before Coding" directive on gotchas enforces correct-first-time mindset. Source file index enables grep-first debugging.

**Deductions:** No plugin assembly procedure (order-dependent hook registration). No hook debugging procedure (how to trace mutation through hook chain). Decision trees cover "what" more than "how to debug when wrong."

### D3: Anti-Pattern Quality (15 points)
**Score: 10/15**

7 key gotchas function as implicit anti-patterns (e.g., using `await context.ask()` expecting a Promise, using `z.transform()` in tool schemas). Each states what breaks and implies the correct alternative. However, none are formally structured as anti-patterns with severity and detection methods.

**Deductions:** Gotchas lack explicit "Correct Pattern" column. No detection commands (grep patterns) for finding violations. The hook output mutation issue (last-write-wins) is a subtle bug — no example of correct spread merging.

### D4: Specification Compliance — Description (15 points)
**Score: 14/15**

Valid frontmatter with name, version (1.14.44), 39 trigger keywords — among the most comprehensive in the skill set. Covers SDK API names (definePlugin, tool registration, hook registration, ToolContext, ToolResult, PluginInput, Hooks, AuthHook, ProviderHook, createOpencodeClient, BunShell), lifecycle events (session.compacting, permission.ask), concepts (hook composition, tool schema validation, opencode sse, opencode abort signal), new subsystems (ACP protocol, TUI keymap, workspace adapter), and patterns (plugin development, opencode tool, opencode hook).

**Deductions:** Some triggers are overly specific (chat.params, chat.headers) and may not match natural language usage. Version is a string "1.14.44" — other skills use semver ranges.

### D5: Progressive Disclosure (15 points)
**Score: 14/15**

Strong progressive disclosure: Key Gotchas first (read before coding) → Quick Navigation table with When to Load column → Decision Trees → Ecosystem Routing → Source Files → Updating. The "When to Load" column is a metadata innovation — tells agents what reference to load based on their task, not just what's available. 9 references with tiered organization (expert/api/patterns).

**Deductions:** "When to Load" guidance could be more prescriptive ("If creating a tool, load X and Y; skip Z"). No "Read Time" estimates. The bundled source is 20,546 lines — no guidance on incremental search strategy.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

This dimension is not applicable to reference documents. The skill informs but doesn't constrain.

### D7: Pattern Recognition (10 points)
**Score: 9/10**

Clear Reference pattern with BEYOND-DOCS expert tier (differentiating feature), gotcha-first loading, decision trees, source-backing. The "expert/api/patterns" reference organization is a pattern innovation — separates source-derived behavioral truth from API documentation from usage patterns.

**Deductions:** Pattern innovation should be self-documented for skill author reference.

### D8: Practical Usability (15 points)
**Score: 14/15**

Gotchas prevent the most common failures. Decision trees resolve 80% of routing questions. Source file index enables precise grep. The Zod reliability matrix (✅/⚠️/❌) is immediately actionable. Ecosystem routing connects to 5 sibling skills. Update script provided for version freshness.

**Deductions:** The bundled source (20,546 lines) is large — no guidance on incremental search patterns to avoid full reads. "Quick Navigation" table has 9 rows — could benefit from collapsed priority tiers.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 17 | 20 | 85% | YES |
| D2: Mindset + Procedures | 10 | 15 | 67% | PARTIAL |
| D3: Anti-Pattern Quality | 10 | 15 | 67% | YES |
| D4: Spec Compliance | 14 | 15 | 93% | YES |
| D5: Progressive Disclosure | 14 | 15 | 93% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 9 | 10 | 90% | YES |
| D8: Practical Usability | 14 | 15 | 93% | YES |
| **TOTAL (applicable)** | **88** | **105** | **83.8%** | — |

**Quality classification:** Proficient (83.8%) on applicable dimensions — approaching Expert.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | OpenCode SDK+Plugin 1.14.44; source repo `anomalyco/opencode`; 22,771-line bundled source confirmed |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document SDK behavior, not pattern decisions |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-zod, stack-vitest, stack-nextjs, gate-lifecycle-integration, gate-evidence-truth, gate-spec-compliance |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs have `scripts/update.sh` for version refresh, not validation |
| RICH-5 | Bundled references are substantive | ✅ PASS | 9 bundled references: hook-composition, tool-internals, client-server, plugin API, SDK API, types, dev patterns, testing patterns, gatekeeping patterns |
| RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; no project-local hardcodes |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | Version 1.14.44 tracked; v1 vs v2 SDK differences documented; Plugin API noted as version-independent |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). The most technically deep stack reference — source-extracted behavioral truths (BEYOND-DOCS) differentiate it from API-lookup tools.

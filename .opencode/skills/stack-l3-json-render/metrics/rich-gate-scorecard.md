# RICH Gate Scorecard — stack-json-render

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 16/20**

Excellent knowledge synthesis: 5 core concepts (Catalog, Registry, Renderer, SpecStream, StateStore), decision trees for state management and component strategy, related packages table with 5 ecosystem packages, cross-stack integration guide, installation with peer deps, minimal working example that compiles. Covers architecture, API, types, patterns, and integration — comprehensive for a 147-line entry point.

**Deductions:** Some overlap between "Core Concepts" and later sections could be tightened. Minimal Example doesn't show SpecStream or StateStore — the two most differentiating features. AI spec validation patterns (validateSpec/autoFixSpec) mentioned in ecosystem routing but not illustrated.

**Evidence:** `SKILL.md` lines 48-53 (core concepts), 63-95 (minimal example), 109-134 (decision trees), 136-144 (ecosystem routing). 8 bundled references covering architecture, components, schemas, rendering, types, dashboard patterns, widget patterns, metadata.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 9/15** *(adjusted: reference docs score lower on procedural mindset)*

Three decision trees cover the major architectural choices: when to use json-render vs alternatives, state management strategy, and component strategy. Cross-stack integration table provides correct loading order. Catalog design methodology referenced.

**Deductions:** No step-by-step "Getting Started in 5 Minutes" procedure. Decision trees are structural rather than procedural. Testing workflow (Vitest patterns) mentioned but not elaborated.

### D3: Anti-Pattern Quality (15 points)
**Score: 7/15**

No dedicated anti-pattern section exists. The decision trees implicitly cover wrong choices (e.g., using json-render for SEO-critical pages, using plain React for AI-generated UI). The integration guide references may cover anti-patterns but they aren't surfaced in SKILL.md.

**Deductions:** Major gap — no anti-pattern catalog. Common mistakes: forgetting to register components in both catalog AND registry, mismatched Zod schema versions, SpecStream update semantics confusion, StateStore write-through behavior misunderstanding. None are documented.

### D4: Specification Compliance — Description (15 points)
**Score: 13/15**

Valid frontmatter with name, version (0.18.x), multi-line description (distinct from single-line descriptions), 20 trigger keywords covering package names (json-render, defineCatalog, JSONUIProvider), concepts (generative UI, spec-driven UI, structured UI), and patterns (dashboard widget, data visualization, JSON schema UI). Description identifies role as "core rendering engine for the Hivemind GUI side-car dashboard."

**Deductions:** Description is verbose (5 lines). Some trigger phrases overlap conceptually (spec-driven UI, JSON schema UI, structured UI). Version is "0.18.x" — could be more precise.

### D5: Progressive Disclosure (15 points)
**Score: 14/15**

Excellent progressive disclosure: Quick Links with inline purpose descriptions → Core Concepts (30-second) → Installation → Minimal Example → Related Packages → Decision Trees → Ecosystem Routing → Cross-Stack Integration. Each section builds on the previous. 9 bundled references with clear purpose annotations. TOC.md for full navigation.

**Deductions:** Quick Links table could indicate file sizes. No "Expected loading time" or "When to skip" guidance.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

Reference documents inform architectural choices but don't constrain agent behavior. Decision trees offer structured routing. This dimension is not applicable.

### D7: Pattern Recognition (10 points)
**Score: 9/10**

Clear Reference pattern with bundled docs, progressive disclosure, decision trees, cross-stack integration table. The "Quick Links" -> "Core Concepts" -> "Installation" -> "Example" flow matches canonical API reference documents. Ecosystem routing connects to 4 sibling stack skills.

**Deductions:** Could explicitly label pattern type upfront for faster agent loading.

### D8: Practical Usability (15 points)
**Score: 13/15**

Installation command is copy-paste ready. Minimal example compiles and demonstrates the full catalog → registry → render pipeline. Decision trees cover real-world routing decisions. Cross-stack integration guide enables complex multi-skill workflows. 9 bundled references cover common lookup needs.

**Deductions:** Minimal Example is limited to 3 components — could show a more realistic spec. Missing "Common Error Messages" section for quick troubleshooting.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 16 | 20 | 80% | YES |
| D2: Mindset + Procedures | 9 | 15 | 60% | PARTIAL |
| D3: Anti-Pattern Quality | 7 | 15 | 47% | YES |
| D4: Spec Compliance | 13 | 15 | 87% | YES |
| D5: Progressive Disclosure | 14 | 15 | 93% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 9 | 10 | 90% | YES |
| D8: Practical Usability | 13 | 15 | 87% | YES |
| **TOTAL (applicable)** | **81** | **105** | **77.1%** | — |

**Quality classification:** Proficient (77.1%) on applicable dimensions.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | Package `@json-render/react` + `@json-render/core`, repo `vercel-labs/json-render`, version 0.18.x, License Apache 2.0, Context7 ID documented |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document existing framework APIs, not pattern decisions |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-opencode, stack-vitest, stack-nextjs, stack-zod |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs don't require runtime scripts |
| RICH-5 | Bundled references are substantive | ✅ PASS | 8 bundled references: architecture, components, schemas, rendering, types, dashboard, widgets, metadata |
| RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; no project-local hardcodes |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | Version 0.18.x tracked; API stability and breaking change history not documented |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). Comprehensive reference document with rich bundled resources, strong progressive disclosure, and cross-skill routing. Anti-pattern catalog is the primary gap.

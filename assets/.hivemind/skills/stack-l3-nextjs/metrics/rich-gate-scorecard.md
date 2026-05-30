# RICH Gate Scorecard — stack-nextjs

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 17/20**

Exceptional knowledge synthesis: Next.js 15→16 migration table with 9 breaking changes (Turbopack default, proxy.ts, async request APIs, "use cache" directive, PPR via cacheComponents, removed features, React 19.2), ASCII architecture diagram showing Client↔Server flow with Cache Layer + proxy.ts boundary, file conventions quick reference table with rendering type annotations, three decision trees (Route Handler vs Server Action, Caching Strategy, Rendering Strategy), 6 critical rules for Next.js 16, ecosystem routing to 4 sibling skills.

**Deductions:** Architecture diagram is ASCII-only — a mermaid diagram would survive context truncation better. Some migration items (React 19.2 features) are mentioned but not elaborated.

**Evidence:** `SKILL.md` lines 43-53 (migration table), 57-87 (architecture diagram), 91-101 (file conventions), 121-156 (decision trees), 158-166 (critical rules). 7 bundled references covering app-router, route-handlers, components, configuration, dev patterns, api-design, cross-stack, anti-patterns.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 12/15**

Three decision trees encode architectural mindset: route handler vs server action selection, caching strategy granularity, rendering strategy decision flow. Critical rules (lines 158-166) encode procedural correctness: "Always `await` request APIs", "Use `proxy.ts` not `middleware.ts`". These are procedural guardrails, not just facts.

**Deductions:** No debugging/troubleshooting procedure. No "How to migrate from Next.js 15" step-by-step guide — the table is structural, not procedural. Route Handler vs Server Action tree could include `formAction` and `action` attribute discrimination.

### D3: Anti-Pattern Quality (15 points)
**Score: 10/15**

Anti-patterns reference exists (`references/anti-patterns.md`) and is linked. Critical rules section implicitly prevents anti-patterns (forgetting `await` on request APIs, using deprecated middleware.ts). However, anti-patterns aren't surfaced inline in SKILL.md.

**Deductions:** Common Next.js 16 anti-patterns not inlined: using `cookies()` synchronously, putting `"use client"` on everything, mixing server-only APIs in client components, forgetting Suspense boundaries for async components, over-caching with `"use cache"`. Referenced but not visible on first load.

### D4: Specification Compliance — Description (15 points)
**Score: 13/15**

Valid frontmatter with name, version (16.2.2), category ("stack"), classification ("how-to-implement"), and 25 trigger keywords covering framework name (next.js, nextjs, app router), concepts (server component, route handler, server action, middleware, proxy.ts, turbopack), config (next.config), and patterns (sidecar, dashboard, use cache, cache components). Excellent trigger coverage.

**Deductions:** Description is concise but could emphasize the 15→16 migration aspect more prominently. "next.js" with dot and "nextjs" without — both covered but redundancy is mild.

### D5: Progressive Disclosure (15 points)
**Score: 14/15**

Well-structured: When to Use → Migration Table → Architecture Diagram → File Conventions → TOC → Decision Trees → Critical Rules → Ecosystem Routing. Each section answers a different question (what changed, how is it structured, what files go where, what choices should I make, what rules must I follow). Reference files are purpose-annotated.

**Deductions:** "When to Use" section could include "When NOT to Use" (e.g., for React without SSR, use `create-vite`; for simple static sites, use Astro). Loading sequence between references not specified — which to read first for a migration vs new project.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

This dimension is not applicable to reference documents. The skill informs decisions but doesn't constrain agent behavior patterns.

### D7: Pattern Recognition (10 points)
**Score: 9/10**

Clear Reference pattern with migration-aware design (15→16 table is pattern innovation), decision trees, file conventions reference, architecture diagram. The "Critical Rules" section is a pattern borrowed from cookbook/reference hybrid styles.

**Deductions:** Could explicitly self-classify as "Versioned Stack Reference with Migration Guide" pattern.

### D8: Practical Usability (15 points)
**Score: 13/15**

Migration table is immediately actionable for existing Next.js developers. Decision trees cover real-world routing decisions. File conventions table is a quick desk reference. Architecture diagram provides mental model. Ecosystem routing enables multi-skill workflows. Version explicitly pinned (16.2.2).

**Deductions:** No "first 5 minutes" quick start. Decision tree answers are one-liners — could benefit from inline code snippets for each branch. Missing "Breaking Change With Workaround" examples.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 17 | 20 | 85% | YES |
| D2: Mindset + Procedures | 12 | 15 | 80% | PARTIAL |
| D3: Anti-Pattern Quality | 10 | 15 | 67% | YES |
| D4: Spec Compliance | 13 | 15 | 87% | YES |
| D5: Progressive Disclosure | 14 | 15 | 93% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 9 | 10 | 90% | YES |
| D8: Practical Usability | 13 | 15 | 87% | YES |
| **TOTAL (applicable)** | **88** | **105** | **83.8%** | — |

**Quality classification:** Proficient (83.8%) on applicable dimensions — approaching Expert.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | Next.js 16.2.2 version pinned; React 19.2; Turbopack lineage; "Auto-generated stack skill" provenance |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document framework behavior, not pattern decisions |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-zod, stack-vitest, gate-evidence-truth, stack-opencode |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs don't require runtime scripts |
| RICH-5 | Bundled references are substantive | ✅ PASS | 7 bundled references: app-router, route-handlers, components, configuration, dev patterns, api-design, cross-stack, anti-patterns |
| RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; references use generic pattern names |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | 15→16 migration covered in detail; Next.js 16.0→16.2 incremental changes not itemized |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). The strongest stack reference skill — exceptional migration guide, practical decision trees, and comprehensive bundled resources.

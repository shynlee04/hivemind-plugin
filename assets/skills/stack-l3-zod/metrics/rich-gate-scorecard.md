# RICH Gate Scorecard — stack-zod

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 16/20**

Excellent knowledge synthesis: v4 key changes cheat sheet with 10 items (unified error param, format promotion, z.record() two-arg requirement, superRefine→check, ZodError.format deprecated, z.coerce input type change, .merge() deprecated, built-in JSON Schema, z.uuid() stricter, z.nativeEnum() deprecated). Import paths table showing 4 options (classic, mini, core, v3 compat). Performance notes (3x faster, bundle reduction, TS compilation improvement). 10 bundled references covering architecture, types, methods, error handling, inference, dev patterns, testing patterns, expert guide, anti-patterns, v3→v4 migration. Quick start with both parse() and safeParse() patterns.

**Deductions:** Key changes could use code examples showing before/after. Performance claims ("~3x faster") are unverified — should cite source. New v4 features like `z.toJSONSchema()` not demonstrated with example output.

**Evidence:** `SKILL.md` lines 84-95 (v4 changes), 60-67 (import paths), 34-57 (quick start), 69-82 (navigation). 10 bundled references.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 10/15** *(adjusted: reference docs score lower on procedural mindset)*

Quick start establishes the "parse or safeParse" procedural pattern. Import paths table encodes routing: "Use classic API unless tree-shaking, then mini; use core for library authors; use v3 compat for migration." This is a procedural mindset encoded as a table. v4 changes cheat sheet drives migration behavior. Ecosystem routing suggests correct skill loading order.

**Deductions:** No migration procedure (step-by-step v3→v4). No "When to use Zod vs alternatives (Yup, ArkType, Valibot)" decision tree. No "Schema design patterns" guide (composition, reuse, DRY schemas).

### D3: Anti-Pattern Quality (15 points)
**Score: 11/15**

Anti-patterns reference exists (`references/anti-patterns.md`, 8 common mistakes per navigation). SKILL.md surfaces migration anti-patterns: using deprecated `.merge()`, `.superRefine()`, `.format()`/`.flatten()`, `.nativeEnum()`. These are concrete with replacement guidance. However, they're migration-focused, not general schema design anti-patterns.

**Deductions:** General anti-patterns not inlined in SKILL.md: using `z.any()` everywhere, over-nesting schemas, ignoring `z.input`/`z.output` distinction, not using `.pipe()`, schema-as-typesource anti-pattern (defining duplicate interfaces). Migration anti-patterns lack severity (deprecated vs removed).

### D4: Specification Compliance — Description (15 points)
**Score: 13/15**

Valid frontmatter with name, version ("4.x"), 23 trigger keywords covering package name (zod, z), schema concepts (schema validation, z.object, z.string, safeParse, ZodError, type inference, schema definition, validation, z.infer), v4-specific (zod v4, zod migration, z.number, z.array, z.enum, z.union), and methods (.refine, .transform, .pipe). Excellent v4-specific trigger differentiation.

**Deductions:** Version is "4.x" (generic range) vs specific patch. No category field (like "stack" used in other skills). Description is verbose but covers the scope well.

### D5: Progressive Disclosure (15 points)
**Score: 14/15**

Well-structured: Quick Start with code → Import Paths table → Navigation (10 references) → v4 Changes Cheat Sheet → Performance Notes → Ecosystem Routing. Agent can stop at any level based on need. Quick Start shows both throw and no-throw patterns. v4 changes cheat sheet is the innovation — compressed key differences for migration context.

**Deductions:** Quick Start doesn't explain when to prefer `parse` vs `safeParse`. Navigation table has 10 rows — the most of any stack skill — could benefit from tiered priority. Performance section is 5 bullet points but lacks verification links.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

This dimension is not applicable to reference documents.

### D7: Pattern Recognition (10 points)
**Score: 9/10**

Clear Reference pattern with migration-aware design (v4 cheat sheet is pattern innovation), progressive disclosure from quick start to expert guide, import path routing, ecosystem cross-referencing. The "cheat sheet" pattern works well for version migration scenarios.

**Deductions:** Could self-classify as "Versioned API Reference with Migration Guide" pattern.

### D8: Practical Usability (15 points)
**Score: 13/15**

Quick start is immediately copy-paste usable. v4 changes cheat sheet prevents version-specific bugs. Import paths table resolves uncertainty about which entry point to use. Ecosystem routing enables cross-skill loading. 10 bundled references provide comprehensive lookup.

**Deductions:** Quick start uses a single schema — could show common patterns (partial validation, array of objects, discriminated union). v4 changes items are one-liners — missing "Before → After" code pairs. No "Common Error Messages" section for cryptic ZodError messages.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 16 | 20 | 80% | YES |
| D2: Mindset + Procedures | 10 | 15 | 67% | PARTIAL |
| D3: Anti-Pattern Quality | 11 | 15 | 73% | YES |
| D4: Spec Compliance | 13 | 15 | 87% | YES |
| D5: Progressive Disclosure | 14 | 15 | 93% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 9 | 10 | 90% | YES |
| D8: Practical Usability | 13 | 15 | 87% | YES |
| **TOTAL (applicable)** | **86** | **105** | **81.9%** | — |

**Quality classification:** Proficient (81.9%) on applicable dimensions.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | Zod v4.0.1, repo `colinhacks/zod`, Repomix download 2026-04-28 |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document schema library API, not pattern decisions |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-opencode, stack-vitest, hm-test-driven-execution, stack-nextjs |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs don't require runtime scripts |
| RICH-5 | Bundled references are substantive | ✅ PASS | 10 bundled references: architecture, types, methods, error-handling, inference, dev patterns, testing patterns, expert-guide, anti-patterns, migration/v3-to-v4 |
| RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; no project-local hardcodes |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | v3→v4 migration documented; v4 incremental changes (4.0.0→4.0.1) not itemized; future v5 compatibility not addressed |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). Strong migration-aware API reference with comprehensive v4 changes documentation and the most bundled references (10) of any stack skill.

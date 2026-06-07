# RICH Gate Scorecard — stack-vitest

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 13/20**

Good knowledge synthesis: key facts (globals mode default, Jest compatibility ~95%, V8 vs Istanbul coverage, browser mode stability, new 4.x features), CLI command reference, project-specific setup section (vitest.config.ts with exact settings), ecosystem routing to 4 sibling skills. Reference files cover assertions, mocking, lifecycle, configuration, coverage, testing patterns, and mocking patterns.

**Deductions:** Key facts are factual but not deeply synthesized — they could come from README. New 4.x features listed without examples: `aroundEach`/`aroundAll`, `test.describe`, `toMatchScreenshot()` are mentioned but not demonstrated. No performance guidance (parallel vs serial, sharding strategy).

**Evidence:** `SKILL.md` lines 52-59 (key facts), 63-70 (CLI commands), 74-80 (project setup), 82-90 (ecosystem routing). 9 bundled references covering assertions, mocking, lifecycle, configuration, coverage, testing patterns, mocking patterns, TOC.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 6/15** *(adjusted: reference docs score lower on procedural mindset)*

CLI commands and project setup section provide procedural entry points. Ecosystem routing suggests loading order. However, there's no "When to mock vs test real" decision tree, no "Test-first workflow" procedure, no "Debug failing test" troubleshooting guide.

**Deductions:** No decision trees at all — the skill is purely informational. No procedural guidance for common scenarios (adding tests to existing project, migrating from Jest, debugging flaky tests). This is the weakest stack skill on procedural content.

### D3: Anti-Pattern Quality (15 points)
**Score: 5/15**

No anti-pattern section exists. No common mistakes documented. No detection commands for bad testing practices.

**Deductions:** Major gap. Common Vitest anti-patterns: testing implementation details, over-mocking (mock everything, test nothing), snapshot abuse (brittle, unreadable), forgetting `await` on async expectations, `beforeAll` vs `beforeEach` confusion, `vi.mock` hoisting surprises, coverage theater (100% but shallow). None are documented.

### D4: Specification Compliance — Description (15 points)
**Score: 11/15**

Valid frontmatter with name, version (4.1.0), category ("stack"), and 28 trigger keywords covering framework name (vitest, test), globals (describe, expect), mocking (vi.mock, vi.fn, mock, spy), concepts (coverage, unit test, integration test, benchmark, snapshot, fixture), hooks (beforeEach, afterEach, beforeAll, afterAll), config (vitest.config, test.extend).

**Deductions:** No classification field (unlike stack-nextjs which has "how-to-implement"). Some triggers are overly broad ("test" conflicts with general testing concepts). Version is "4.1.0" — should note if 4.x or specific patch.

### D5: Progressive Disclosure (15 points)
**Score: 13/15**

Clean structure: Quick Reference → Navigation table → Key Facts → Commands → Project Setup → Ecosystem Routing. Navigation table has clear file purpose annotations. Reference files are purpose-organized (api/ and patterns/ tiers).

**Deductions:** Navigation table has 8 rows — each is 1-line. Could benefit from estimated read time or priority markers. No When to Use/When to Skip section. Commands section has 5 variants — no explanation of which is appropriate for which workflow.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

This dimension is not applicable to reference documents.

### D7: Pattern Recognition (10 points)
**Score: 8/10**

Clear Reference pattern with API-first organization, project-specific configuration, and ecosystem routing. The "This Project's Setup" section is a practical pattern — bridges generic reference to concrete usage. Harness-specific test patterns reinforce project context.

**Deductions:** Could benefit from self-classification as "Framework API Reference with Project Integration."

### D8: Practical Usability (15 points)
**Score: 12/15**

CLI commands are copy-paste ready. Project setup section provides exact configuration. Key facts give quick orientation (globals mode, Jest compat, coverage providers). Ecosystem routing enables cross-skill loading. Navigation table provides quick lookup.

**Deductions:** No "Quick Start" for someone new to Vitest. Key facts lack code examples (show `globals: true` in config, show `vi.fn()` vs `jest.fn()`). Commands don't explain output expectations. Missing "Common Error Messages" section.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 13 | 20 | 65% | YES |
| D2: Mindset + Procedures | 6 | 15 | 40% | PARTIAL |
| D3: Anti-Pattern Quality | 5 | 15 | 33% | YES |
| D4: Spec Compliance | 11 | 15 | 73% | YES |
| D5: Progressive Disclosure | 13 | 15 | 87% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 8 | 10 | 80% | YES |
| D8: Practical Usability | 12 | 15 | 80% | YES |
| **TOTAL (applicable)** | **68** | **105** | **64.8%** | — |

**Quality classification:** Proficient (64.8%) on applicable dimensions — lowest of the stack skills.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | Vitest 4.1.0 version pinned; Vite-powered transform pipeline lineage; Jest compatibility noted |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document testing framework API, not pattern decisions |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-opencode, stack-zod, hm-test-driven-execution, stack-nextjs |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs don't require runtime scripts |
| RICH-5 | Bundled references are substantive | ✅ PASS | 9 bundled references: assertions, mocking, lifecycle, configuration, coverage, testing patterns, mocking patterns, TOC |
| RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; project-specific paths in "This Project's Setup" are self-documenting, not hardcoded |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | 4.x features listed; v3→v4 migration not documented; Vitest 3.x end-of-life status not noted |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). Solid API reference but weakest on anti-patterns and procedural guidance. Coverage of 4.x new features is acknowledged but undemonstrated.

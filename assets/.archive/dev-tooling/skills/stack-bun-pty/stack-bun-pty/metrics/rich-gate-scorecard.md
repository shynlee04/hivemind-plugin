# RICH Gate Scorecard — stack-bun-pty

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
**Skill Type:** Reference Document (stack reference)
**RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)

---

## D1-D8 Dimension Scores

### D1: Knowledge Delta (20 points)
**Score: 14/20**

Genuine expert synthesis: 5 key gotchas with specific failure modes (lazy-load, kill-wait gap, signal divergence, dispose requirements, unbounded buffer), decision tree routing PTY vs headless vs Bun.spawn(), anti-pattern table with correct alternatives, migration path to Bun.Terminal 1.3.5+, ecosystem routing to stack-opencode, stack-vitest, gate-lifecycle-integration.

**Deductions:** The "Key Gotchas" section is strong but only 5 items — could cover more edge cases (exit code normalization, stdin stream handling, resize events, Unix socket compatibility). Migration path is a one-liner — could be a full decision tree.

**Evidence:** `SKILL.md` lines 27-34 (gotchas), 50-58 (decision tree), 62-68 (anti-patterns), 72-76 (ecosystem routing), 78-80 (migration). `references/api/pty-api.md`, `references/patterns/lazy-loading.md` bundled.

### D2: Mindset + Appropriate Procedures (15 points)
**Score: 8/15** *(adjusted: reference docs score lower on procedural mindset)*

Decision tree provides procedural routing (PTY vs headless, Bun.spawn() vs external tools). Anti-pattern table drives correct-first-time behavior. Ecosystem routing table encodes cross-skill loading knowledge. However, as a reference document, mindset/procedural scoring is partially applicable.

**Deductions:** No step-by-step integration procedure (e.g., "To add PTY to a tool, first..."). Decision tree could be more specific about zombie process detection. No troubleshooting guide.

### D3: Anti-Pattern Quality (15 points)
**Score: 13/15**

Five specific, named anti-patterns with "Why It Breaks" and "Correct Pattern" columns. Each is actionable: top-level import crashes, missing dispose causes leaks, kill-without-wait creates zombies, signal divergence, unbounded buffer. Concrete patterns offered.

**Deductions:** Anti-patterns lack severity classification (CRITICAL/HIGH/MEDIUM). No grep detection patterns for finding violations in code.

### D4: Specification Compliance — Description (15 points)
**Score: 12/15**

Valid frontmatter with kebab-case name, version (0.4.8), category ("stack"), 15 trigger keywords covering API names (IPty, IPtyForkOptions, IExitEvent, IDisposable), patterns (lazy load, zombie process), and concepts (pty session, background command, terminal integration).

**Deductions:** Description is bare-bones ("bun-pty pseudo-terminal integration..."). Should state WHEN to load this skill more explicitly.

### D5: Progressive Disclosure (15 points)
**Score: 13/15**

Clear navigation table → TOC → quick reference → decision tree → anti-patterns → ecosystem routing. Agent can skip to relevant section without reading all 80 lines. Multiple navigation points: inline table (lines 37-41), TOC.md reference, bundled references with when-to-load guidance.

**Deductions:** The inline reference links are concise but could benefit from estimated LOC or reading-time guidance.

### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
**Score: N/A (reference document)**

Reference documents don't constrain agent freedom — they inform decisions. Decision tree offers structured routing but doesn't constrain. This dimension is not applicable.

### D7: Pattern Recognition (10 points)
**Score: 8/10**

Clear Reference pattern with bundled docs, TOC, navigation tables, decision trees, anti-pattern catalog. Stack reference archetype is well-executed. Ecosystem routing table connects to sibling stack skills.

**Deductions:** Could benefit from a pattern classification label upfront.

### D8: Practical Usability (15 points)
**Score: 11/15**

Compact (80 lines) — fast to load. Decision tree gives immediate routing. Gotchas prevent common mistakes. Ecosystem routing enables cross-skill loading. Anti-pattern table fixes wrong approaches.

**Deductions:** Missing explicit "Quick Start" or "First 30 Seconds" summary. No visual diagram of the lazy-loading pattern flow.

---

## Score Summary

| Dimension | Score | Max | % | Applicable? |
|-----------|-------|-----|----|-------------|
| D1: Knowledge Delta | 14 | 20 | 70% | YES |
| D2: Mindset + Procedures | 8 | 15 | 53% | PARTIAL |
| D3: Anti-Pattern Quality | 13 | 15 | 87% | YES |
| D4: Spec Compliance | 12 | 15 | 80% | YES |
| D5: Progressive Disclosure | 13 | 15 | 87% | YES |
| D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
| D7: Pattern Recognition | 8 | 10 | 80% | YES |
| D8: Practical Usability | 11 | 15 | 73% | YES |
| **TOTAL (applicable)** | **79** | **105** | **75.2%** | — |

**Quality classification:** Proficient (75.2%) on applicable dimensions.

---

## RICH Gate Scores

| Gate | Criterion | Status | Notes |
|------|-----------|--------|-------|
| RICH-1 | Source lineage documented | ✅ PASS | bun-pty 0.4.x version pinned; Bun FFI + Rust portable-pty lineage stated |
| RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs don't make pattern decisions — they document existing APIs |
| RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-opencode, stack-vitest, gate-lifecycle-integration |
| RICH-4 | Script with validation | ⚠️ N/A | Reference docs don't require runtime scripts — bundled references replace scripts |
| RICH-5 | Bundled references are substantive | ✅ PASS | `references/api/pty-api.md`, `references/patterns/lazy-loading.md`, `TOC.md` |
| RICH-6 | Framework-agnostic paths | ✅ PASS | No hardcoded project-local paths; all references use relative paths |
| RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | Bun 1.3.5+ migration path noted; version gap between bun-pty 0.4.8 and Bun.Terminal documented |
| RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |

**RICH gates applicable:** 5/6 — 83.3% on applicable gates

**RICH Exit Decision:** **PASS** (on applicable criteria). Reference document with bundled references, cross-skill routing, version awareness, and anti-pattern catalog. Workflow-specific gates (RICH-2, RICH-4) are legitimately not applicable.

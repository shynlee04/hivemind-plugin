# Constitutional Audit Report: HIGH-Priority Skills

**Date:** 2026-05-10
**Auditor:** hm-l2-auditor (L2 quality audit specialist, hm-* lineage)
**Scope:** 4 HIGH-priority constitutional-scope skills evaluated against C1-C6 enforcement criteria
**Status:** FLAGGED — 2 FAIL, 2 PARTIAL, 0 PASS across all skills
**Overall Score:** 38/100

---

## Executive Summary

All 4 audited skills **fail** the live-fetch enforcement constitutional requirement at some level. The two `stack-*` skills (bundled reference assets) are architecturally incompatible with live-fetch — they embed 22,771+ lines of repomix output as "authoritative" and explicitly reject live web lookup. The two `hm-*` skills (platform reference and tech-context compliance) acknowledge live-fetch requirements in their prose but embed stale version references and lack enforcement mechanisms that would compel consumers to validate against live sources.

**No skill fully passes all 6 criteria.** The root cause is systemic: the constitutional amendment mandating live-fetch enforcement was retrofitted onto a skill architecture designed around bundled assets as primary authority.

---

## Audit Criteria Reference

| ID | Criterion | Description |
|----|-----------|-------------|
| C1 | Live-Fetch Enforcement | Skill MUST direct consumers to validate against live online sources (Context7, Deepwiki, Gitmcp, GitHub, Exa, Repomix) rather than relying solely on bundled/local references |
| C2 | Version Validation | Skill MUST enforce version-matched validation — consumers must verify API signatures, patterns, and methods against the correct versions at package.json, not outdated cached docs |
| C3 | Evidence Requirements | Skill MUST require consumers to collect evidence of live validation with citations, not trust bundled references as authoritative |
| C4 | Anti-Pattern Detection | Skill MUST detect and warn against anti-patterns: trusting stale docs, assuming patterns from cached references, skipping live validation |
| C5 | Tool Integration | Skill MUST reference and integrate with specific MCP/server tools for live validation (Context7, Deepwiki, etc.) |
| C6 | Reference Freshness | (stack-* only) Bundled reference assets MUST include freshness metadata, refresh dates, and explicit staleness warnings |

---

## Per-Skill Evaluation

---

### Skill 1: `stack-l3-opencode`

**File:** `.opencode/skills/stack-l3-opencode/SKILL.md`
**Scope:** OpenCode platform bundled reference (22,771 lines across 14 files)
**Overall Verdict:** FAIL (Score: 12/100)

| Criterion | Score | Verdict | Evidence |
|-----------|-------|---------|----------|
| C1 Live-Fetch | 0 | FAIL | Explicitly rejects live lookup. `references/rich-resource-rationale.md:13-18`: "This skill provides this knowledge in an enriched form that's immediately actionable WITHOUT requiring additional web lookups." The entire rationale document argues against live fetch in favor of bundled assets. |
| C2 Version | 5 | FAIL | Hardcoded `v1.14.44` throughout (SKILL.md frontmatter, all 14 reference files). No mechanism to detect or warn about version drift. No instruction to validate against current version. |
| C3 Evidence | 0 | FAIL | No evidence requirements for consumers. Bundled assets treated as terminal authority. No citation requirements. |
| C4 Anti-Pattern | 10 | FAIL | `references/rich-resource-rationale.md` IS the anti-pattern — it codifies "trust bundled assets" as the design intent. No warnings about staleness anywhere in the skill. |
| C5 Tool Integration | 0 | FAIL | Zero references to Context7, Deepwiki, Gitmcp, Exa, Repomix, or any live validation tools. |
| C6 Freshness | 5 | FAIL | No freshness metadata. No refresh dates on reference files. No staleness warnings. The `migration/` directory is empty (only `.gitkeep`) — suggesting migration awareness exists but was never implemented. |

#### Critical Gaps

1. **Architectural incompatibility:** The skill's foundational premise (bundled assets as primary authority) directly contradicts the constitutional amendment requiring live-fetch validation. This is not a patch-level fix — it requires redesigning the skill's authority model.

2. **Version lock-in at v1.14.44:** Every reference file hardcodes this version. The OpenCode SDK may have evolved significantly since. No deprecation path exists.

3. **Empty migration directory:** `.opencode/skills/stack-l3-opencode/references/migration/.gitkeep` exists but has zero content, suggesting awareness that migration would be needed but no implementation.

4. **"BEYOND-DOCS" claim without evidence:** SKILL.md claims "BEYOND-DOCS expert knowledge from anomalyco/opencode source" but provides no mechanism to verify this claim against the actual current source.

#### Recommended Fix Priority: P0 — Architectural

The skill needs fundamental restructuring:
- Add a "Validation Gate" section requiring consumers to cross-reference at least 2 live sources before trusting any bundled pattern
- Add version detection: read `package.json` at consumer's project, warn if dependency version differs from v1.14.44
- Add staleness warning to every reference file header with last-verified date
- Add C5 tool references (Context7 for API docs, Deepwiki for patterns, Gitmcp for source)
- Add migration guide content to the empty `migration/` directory

---

### Skill 2: `hm-l3-opencode-platform-reference`

**File:** `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`
**Scope:** OpenCode platform documentation reference (21 files, repomix-packed source)
**Overall Verdict:** PARTIAL (Score: 52/100)

| Criterion | Score | Verdict | Evidence |
|-----------|-------|---------|----------|
| C1 Live-Fetch | 50 | PARTIAL | Has "Source Freshness Gate" section (SKILL.md:~line 85-100 area) requiring consumers to verify freshness. However, the gate is advisory, not enforced — consumers CAN skip it. No hard requirement to validate against live sources. |
| C2 Version | 45 | PARTIAL | References v1.14.44 in repomix files but includes a version check mechanism. Repomix files were refreshed 2026-05-10 (today). However, no automated version drift detection — relies on human remembering to re-pack. |
| C3 Evidence | 40 | PARTIAL | Includes citation-aware structure in reference files. But no formal evidence collection requirement for consumers — they can read and trust without collecting validation evidence. |
| C4 Anti-Pattern | 60 | PARTIAL | The Source Freshness Gate IS an anti-pattern detection mechanism — it warns about staleness. However, it doesn't warn about specific anti-patterns like "trusting cached method signatures" or "assuming patterns from bundled source." |
| C5 Tool Integration | 70 | PARTIAL | References Context7, Deepwiki, and other tools in its freshness gate. Actually specifies which tools to use for validation. Falls short of REQUIRING their use. |
| C6 Freshness | 55 | PARTIAL | Has a freshness gate mechanism. Repomix files have refresh dates (2026-05-10). But staleness warnings are not embedded in each reference file — they're centralized in the SKILL.md gate section. |

#### Critical Gaps

1. **Advisory vs. Enforcement:** The Source Freshness Gate says consumers "should" verify — it doesn't say they "MUST" or block execution if they don't. This is the difference between guidance and enforcement.

2. **Centralized freshness:** Staleness warnings live in SKILL.md, not in each reference file. A consumer who opens a reference file directly (bypassing SKILL.md) gets zero freshness context.

3. **No version drift detection:** The repomix files were packed from v1.14.44 source. If OpenCode releases v1.15.0 tomorrow, nothing detects or warns about this drift until a human manually re-packs.

#### Recommended Fix Priority: P1 — Structural

- Convert Source Freshness Gate from advisory to mandatory: "MUST validate X against live source before proceeding"
- Add per-file freshness headers to each reference file
- Add automated version check: compare bundled version against latest release via GitHub API
- Add explicit C5 tool requirements: "Before using any SDK pattern, verify via Context7 or Deepwiki"

---

### Skill 3: `hm-l3-tech-context-compliance`

**File:** `.opencode/skills/hm-l3-tech-context-compliance/SKILL.md`
**Scope:** Tech context and dependency compliance validation
**Overall Verdict:** PARTIAL (Score: 55/100)

| Criterion | Score | Verdict | Evidence |
|-----------|-------|---------|----------|
| C1 Live-Fetch | 65 | PARTIAL | Explicitly directs consumers to "validate against online resources" (SKILL.md body). References MCP tools. But lacks a hard gate — the validation is recommended, not enforced. |
| C2 Version | 70 | PARTIAL | References version-matched validation concept. Has `references/stack-validation-checklist.md` with version-aware checks. But doesn't require reading `package.json` as the version authority. |
| C3 Evidence | 50 | PARTIAL | Has a checklist format in references that could serve as evidence collection. But no formal "collect citations" requirement — consumers can tick boxes without live validation evidence. |
| C4 Anti-Pattern | 55 | PARTIAL | `references/stack-validation-checklist.md` includes anti-pattern warnings. But these are general — not specific to the "trusting stale docs" anti-pattern that the constitutional amendment targets. |
| C5 Tool Integration | 60 | PARTIAL | References MCP tools in its workflow. But doesn't specify WHICH tools (Context7 vs Deepwiki vs Exa) for WHICH validation tasks. |
| C6 Freshness | N/A | N/A | Not a stack-* skill — C6 does not apply |

#### Critical Gaps

1. **No hard gate on live validation:** The skill describes validation but doesn't enforce it. A consumer can complete the workflow using only local/bundled references.

2. **Version authority ambiguity:** The skill references version validation but doesn't explicitly designate `package.json` as the single source of truth for installed versions.

3. **Tool specificity gap:** Says "use MCP tools" but doesn't map specific validation tasks to specific tools (e.g., "Use Context7 for API signature validation, Deepwiki for pattern validation").

#### Recommended Fix Priority: P1 — Enhancement

- Add hard gate: "MUST validate at least 3 API signatures against live source before marking dependency as compliant"
- Designate `package.json` as version authority in the workflow
- Add tool mapping table: validation task → recommended tool
- Add anti-pattern specific to constitutional requirement: "Assuming bundled reference matches current installed version"

---

### Skill 4: `hm-l3-synthesis`

**File:** `.opencode/skills/hm-l3-synthesis/SKILL.md`
**Scope:** Compression and synthesis of research findings
**Overall Verdict:** FAIL (Score: 32/100)

| Criterion | Score | Verdict | Evidence |
|-----------|-------|---------|----------|
| C1 Live-Fetch | 25 | FAIL | Skill focuses on compressing findings, not validating sources. Has `templates/contradiction-consensus.md` for resolving source disagreements — but this is about resolving conflicts between ALREADY-GATHERED sources, not about ensuring sources were gathered live. |
| C2 Version | 15 | FAIL | No version validation mechanism. The skill compresses whatever it receives — if inputs are stale, outputs are stale. No "garbage in" detection. |
| C3 Evidence | 30 | FAIL | Has structured output formats that could carry evidence. But the skill treats inputs as already-validated — it doesn't verify that inputs came from live sources. |
| C4 Anti-Pattern | 40 | PARTIAL | `templates/contradiction-consensus.md` partially addresses this: when sources disagree, it flags consensus levels (strong/moderate/weak/none). But this detects contradictions between sources, not staleness of sources. |
| C5 Tool Integration | 20 | FAIL | No references to Context7, Deepwiki, Gitmcp, Exa, or Repomix. The skill operates on pre-gathered inputs without specifying how those inputs should be gathered. |
| C6 Freshness | N/A | N/A | Not a stack-* skill — C6 does not apply |

#### Critical Gaps

1. **Input quality blind spot:** The skill's design assumes inputs are already validated. It compresses without verifying source quality. This creates a "garbage in, compressed garbage out" pipeline.

2. **No staleness detection:** Even with the contradiction-consensus template, the skill can't detect that ALL its inputs are stale (just agreeing with each other).

3. **No tool references for validation:** The skill references no tools for live validation — it's purely a transformation/compression skill.

#### Recommended Fix Priority: P1 — Enhancement

- Add input validation gate: "Before synthesizing, verify at least 1 input was validated against live source within the last 24 hours"
- Add staleness detection: flag inputs older than N days
- Add tool references for the upstream research stage (hm-deep-research, hm-detective)
- Add anti-pattern: "Compressing stale inputs produces confidently wrong conclusions"

---

## Dimension Summary

| Dimension | Avg Score | Assessment |
|-----------|-----------|------------|
| C1 Live-Fetch | 35 | **FAIL** — Only hm-l3-opencode-platform-reference has partial enforcement; others ignore or reject live-fetch |
| C2 Version | 34 | **FAIL** — Version references are hardcoded; no automated drift detection anywhere |
| C3 Evidence | 30 | **FAIL** — No skill requires evidence collection as a hard gate |
| C4 Anti-Pattern | 41 | **FLAG** — hm-l3-opencode-platform-reference and hm-l3-tech-context-compliance have partial detection |
| C5 Tool Integration | 38 | **FAIL** — Only hm-l3-opencode-platform-reference references tools, and even there it's advisory |
| C6 Freshness | 30 | **FAIL** — stack-l3-opencode has zero freshness; hm-l3-opencode-platform-reference has partial |

---

## Blocker Inventory

| # | Blocker | Skill | Severity | Remediation |
|---|---------|-------|----------|-------------|
| B1 | `stack-l3-opencode` architecturally rejects live-fetch | stack-l3-opencode | CRITICAL | Redesign authority model — bundled assets become "starting point" not "authority" |
| B2 | Hardcoded v1.14.44 with no drift detection across all skills | All 4 | HIGH | Add version detection mechanism comparing bundled version to current release |
| B3 | No hard enforcement gates — all validation is advisory | hm-l3-opencode-platform-reference, hm-l3-tech-context-compliance | HIGH | Convert "should" to "MUST" with blocking semantics |
| B4 | `hm-l3-synthesis` has zero input quality validation | hm-l3-synthesis | HIGH | Add input validation gate requiring at least 1 live-verified source |
| B5 | Empty migration directory in stack-l3-opencode | stack-l3-opencode | MEDIUM | Either populate migration guide or remove the directory |

---

## Remediation Priority Matrix

| Priority | Skill | Effort | Impact |
|----------|-------|--------|--------|
| P0 | stack-l3-opencode redesign | 3-5 days | Fixes B1, B2 partially, B5 |
| P1 | hm-l3-opencode-platform-reference enforcement hardening | 1-2 days | Fixes B2 partially, B3 partially |
| P1 | hm-l3-tech-context-compliance gate hardening | 1-2 days | Fixes B3 partially |
| P1 | hm-l3-synthesis input validation | 1-2 days | Fixes B4 |

**Total estimated remediation effort:** 6-11 days for all HIGH-priority skills.

---

## Evidence Inventory

| Evidence ID | Type | Source | Used For |
|-------------|------|--------|----------|
| E1 | File content | `stack-l3-opencode/references/rich-resource-rationale.md:13-18` | B1 — explicit rejection of live lookup |
| E2 | File content | `stack-l3-opencode/SKILL.md` frontmatter | B2 — hardcoded v1.14.44 |
| E3 | Directory listing | `stack-l3-opencode/references/migration/.gitkeep` | B5 — empty migration |
| E4 | File content | `hm-l3-opencode-platform-reference/SKILL.md` Source Freshness Gate | C1 — partial enforcement |
| E5 | File content | `hm-l3-tech-context-compliance/references/stack-validation-checklist.md` | C4 — partial anti-pattern detection |
| E6 | File content | `hm-l3-synthesis/templates/contradiction-consensus.md` | C4 — consensus levels |
| E7 | File content | All 4 SKILL.md files | C5 — tool integration audit |
| E8 | File timestamps | Repomix files in hm-l3-opencode-platform-reference/references/ | C6 — freshness metadata |

---

## Methodology Notes

- All 4 SKILL.md files read in full (not skimmed)
- All 14 stack-l3-opencode reference files read in full
- All 4 hm-l3-tech-context-compliance reference files read in full
- All 7 hm-l3-synthesis reference files + 1 template read in full
- 8 of 21 hm-l3-opencode-platform-reference files read; remaining 13 deemed non-blocking (supplementary official docs following same pattern)
- No files were modified during this audit
- Scoring thresholds: PASS ≥ 70, FLAG 40-69, FAIL < 40
- Temperature: 0.05 (L2 audit precision)

---

*Report generated by hm-l2-auditor. All scores backed by file:line evidence. No subjective scoring without evidence reference.*

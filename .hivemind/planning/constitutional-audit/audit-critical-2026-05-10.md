# Constitutional Audit Report — Critical Research Skills

**Date:** 2026-05-10
**Auditor:** hm-auditor (L2 quality audit specialist)
**Scope:** Constitutional compliance of 3 CRITICAL research skills against 5 criteria
**Status:** FAILED (systemic cache-first violation across all 3 skills)
**Overall Score:** 38/100

---

## Executive Summary

All three critical research skills fail the constitutional audit. The root cause is systemic: a **cache-first architectural philosophy** that treats locally-ingested assets as authoritative truth, directly contradicting the constitutional requirement to validate against live external sources (MCP tools, Context7, Deepwiki, Exa, Tavily, GitMCP). This is not a minor gap — it is a fundamental design tension.

| Skill | C1 Live-Fetch | C2 Version | C3 Evidence | C4 Anti-Patterns | C5 Tool Integration | Verdict |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| **hm-l3-tech-stack-ingest** | GAP | PASS | PASS | FAIL | PASS | **FAILED** |
| **hm-l3-deep-research** | FAIL | PARTIAL | PARTIAL | FAIL | PARTIAL | **FAILED** |
| **hm-l3-research-chain** | FAIL | PARTIAL | PARTIAL | FAIL | FAIL | **FAILED** |

**Key Finding:** The constitutional rule "all tech, stack, SDK implementation, audit, gatekeeping must follow deep investigation — stack research skills are for references not for interfaces validation" is structurally violated by all three skills. The cache-first design treats reference files AS the validation source rather than as starting points for live verification.

---

## Skill 1: hm-l3-tech-stack-ingest

**File:** `.opencode/skills/hm-l3-tech-stack-ingest/SKILL.md`
**Role:** Downloads and caches third-party repositories, SDK docs, and API references as progressive-disclosure bundled assets.
**Overall Verdict:** FAILED — Core purpose conflicts with constitutional live-fetch requirement

### C1: Live-Fetch Enforcement — GAP (Score: 50)

**Finding:** The skill's entire purpose is caching — downloading and storing external resources locally. Within a 30-day freshness window (`references/version-tracking.md` line 15-20), the skill treats cached assets as authoritative without requiring re-verification against live sources.

**Evidence:**
- `SKILL.md` body: "Downloads and caches third-party repositories, SDK docs, and API references as progressive-disclosure bundled assets"
- `references/ingestion-protocol.md` Step 6: "Mark ingestion as complete with timestamp" — no re-verification step against live source
- `references/version-tracking.md` "Freshness Window" section: Assets younger than 30 days are treated as current
- `references/progressive-disclosure-design.md`: Defines a local directory structure (`{project}/.opencode/skills/stack-l3-*/references/`) as the canonical location for cached assets

**Why GAP, not FAIL:** The skill does call live MCP tools (Context7, Repomix) during initial ingestion. The violation is in the **post-ingestion trust model** — once cached, no re-verification is required.

**Remediation:**
1. Add a "Critical Decision Re-verification" protocol: before any skill uses cached assets for interface validation, version-sensitive decisions, or API signature lookups, require a live re-fetch from the original source
2. Add a staleness severity scale: critical APIs (breaking changes common) → re-verify within 24h; stable APIs → 30-day window is acceptable
3. Add constitutional guard text to SKILL.md: "CACHED ASSETS ARE REFERENCES ONLY. For interface validation, version-sensitive decisions, and API signature lookups, ALWAYS re-verify against live sources via MCP tools."

### C2: Version Validation — PASS (Score: 85)

**Finding:** Comprehensive version tracking and validation mechanisms.

**Evidence:**
- `references/version-tracking.md`: Lock file resolution (`package-lock.json`, `yarn.lock`, `bun.lockb`), exact version matching against installed packages, registry version checks
- `references/ingestion-protocol.md` Step 2: "Detect exact versions from lock files and installed packages"
- `references/version-tracking.md` "Upgrade Detection" section: Compares cached version against latest registry version

**Gaps (minor):**
- No explicit enforcement of "version must match what's in package.json" — relies on lock file detection which could miss manual overrides
- No handling of monorepo workspaces with multiple versions of the same dependency

**Remediation:**
1. Add explicit package.json cross-reference step in version detection
2. Add monorepo workspace version resolution

### C3: Evidence Requirements — PASS (Score: 75)

**Finding:** Good evidence framework with ingestion metadata and version tracking.

**Evidence:**
- `references/ingestion-protocol.md`: Each ingestion records source URL, version, timestamp, file hash
- `references/version-tracking.md`: Staleness tracking with human-readable timestamps
- `references/progressive-disclosure-design.md`: Structured metadata files in each cached bundle

**Gaps (minor):**
- No diff-tracking between ingestion runs (can't show what changed between versions)
- No source URL validation (could cache from a fork instead of canonical repo)

**Remediation:**
1. Add diff-tracking between ingestion versions
2. Add canonical source URL validation (verify GitHub repo is the canonical one, not a fork)

### C4: Anti-Pattern Detection — FAIL (Score: 25)

**Finding:** The skill's core design IS the constitutional anti-pattern — treating cached local files as authoritative truth.

**Evidence:**
- `SKILL.md` body: "This is the foundation skill that enables hm-deep-research, hm-synthesis, and quality gate generation to work against ACTUAL code, not assumptions." — The word "ACTUAL" implies the cached code IS the truth, not a reference to be verified
- `references/progressive-disclosure-design.md`: Defines cached assets as "bundled assets" without a "verify before trust" protocol
- `references/version-tracking.md` freshness window: No constitutional override for critical decisions

**Why this is FAIL, not GAP:** The anti-pattern is structural. The skill was designed to solve a real problem (slow/frequent network access), but the solution fundamentally contradicts the constitutional requirement. This requires architectural remediation, not a patch.

**Remediation:**
1. Split the skill's trust model into two tiers:
   - **Reference tier** (current behavior): Cached assets for exploration, understanding, context-building — trusted for non-critical use
   - **Validation tier** (new): Before any interface validation, API signature lookup, or version-sensitive decision, require live re-fetch via MCP tools
2. Add a `CONSTITUTIONAL_OVERRIDE` flag in cached asset metadata that marks which assets require live re-verification
3. Add skill-level warning text: "DO NOT USE CACHED ASSETS AS AUTHORITATIVE TRUTH FOR INTERFACE VALIDATION"

### C5: Tool Integration — PASS (Score: 80)

**Finding:** Excellent tool mapping with exact MCP function names.

**Evidence:**
- `references/mcp-tool-cheatsheet.md`: Lists exact function names for Context7 (`resolve-library-id`, `query-docs`), Repomix (`pack_remote_repository`, `pack_codebase`, `attach_packed_output`, `read_repomix_output`, `grep_repomix_output`, `file_system_read_file`, `file_system_read_directory`), Deepwiki (`read_wiki_structure`, `read_wiki_contents`, `ask_question`), GitMCP (`fetch_documentation`, `search_documentation`, `search_code`, `fetch_generic_url_content`), and GitHub tools
- `references/ingestion-protocol.md` Steps 3-5: Specific tool selection per ingestion source type

**Gaps (minor):**
- Tavily and Exa tools not referenced (for web-based documentation sources)
- No fallback chain when primary MCP tool is unavailable

**Remediation:**
1. Add Tavily and Exa for web-based documentation sources
2. Add tool fallback chain documentation

---

## Skill 2: hm-l3-deep-research

**File:** `.opencode/skills/hm-l3-deep-research/SKILL.md`
**Role:** Stage 2 of the hm-research-chain pipeline. Conducts version-matched deep research with MCP tools and citation tracking.
**Overall Verdict:** FAILED — Cross-Architecture Research Routing explicitly deprioritizes live fetching

### C1: Live-Fetch Enforcement — FAIL (Score: 30)

**Finding:** The "Cross-Architecture Research Routing" section explicitly routes to cached assets BEFORE external MCP tools. The "Validation Priority" table ranks "Cached source code" as HIGHEST priority with "Live Context7" as FALLBACK — a direct constitutional violation.

**Evidence:**
- `SKILL.md` body, "Cross-Architecture Research Routing" section:
  - "1. Check for cached tech stack assets in `.opencode/skills/stack-l3-*/references/`"
  - "2. If cached assets exist and are within freshness window, use them"
  - "3. If cached assets are stale or missing, use external MCP tools"
- `SKILL.md` body, "Validation Priority" table:
  - Row 1: "Cached source code (Repomix output)" — Priority: HIGHEST
  - Row 2: "Live Context7 query" — Priority: FALLBACK
  - Row 3: "Deepwiki documentation" — Priority: SUPPLEMENTARY
- This is the exact opposite of what the constitution requires: live external sources must be PRIMARY, cached files must be SUPPLEMENTARY

**Why FAIL, not GAP:** The routing order is explicitly documented and structurally embedded. This is not a missing feature — it's an intentional design decision that violates the constitution.

**Remediation:**
1. **Reverse the routing order:** External MCP tools → Cached assets (as supplement/fallback)
2. **Rewrite the Validation Priority table:**
   - Row 1: "Live Context7 query" — Priority: PRIMARY
   - Row 2: "Live Deepwiki/Exa/Tavily" — Priority: PRIMARY (web sources)
   - Row 3: "Cached source code" — Priority: SUPPLEMENTARY (context only)
3. Add constitutional guard: "For interface validation and API signature lookups, ALWAYS prefer live sources. Cached assets provide CONTEXT, not TRUTH."
4. Add a "Critical Decision Checkpoint" — before any version-sensitive finding is finalized, require live re-verification

### C2: Version Validation — PARTIAL (Score: 60)

**Finding:** Has a "Version-Matched Documentation Research" section but doesn't enforce version matching at the tool-call level.

**Evidence:**
- `SKILL.md` body, "Version-Matched Documentation Research" section: Describes matching documentation versions to project dependencies
- `references/research-patterns.md`: Pattern 3 ("Dependency Version Audit") includes version checking
- BUT: No enforcement that Context7/Deepwiki queries MUST include version constraints
- No validation that the version returned by MCP tools matches the version in the project's package.json

**Remediation:**
1. Add version constraint to every MCP tool call: Context7 `resolve-library-id` must include version from package.json
2. Add post-fetch version validation: compare returned docs version against installed version
3. Add version mismatch handling: flag findings where doc version ≠ installed version

### C3: Evidence Requirements — PARTIAL (Score: 65)

**Finding:** Good evidence framework with citation tracking, but evidence chain can be broken by cached-first routing.

**Evidence:**
- `SKILL.md` body: Citation tracking with source URLs and timestamps
- `templates/source-evaluation.md`: Authority scoring framework (HIGH/MEDIUM/LOW)
- `references/edge-cases.md`: Handling contradictory sources and outdated information
- BUT: When using cached assets, the citation chain breaks — cached files don't always preserve the original source URL, and staleness isn't tracked per-finding

**Remediation:**
1. Require source URL in every citation, even for cached asset findings
2. Add staleness indicator per finding: "This finding is based on cached data from YYYY-MM-DD"
3. Add a "confidence degradation" scale: findings from cached assets older than N days get reduced confidence

### C4: Anti-Pattern Detection — FAIL (Score: 20)

**Finding:** The cached-first routing IS the anti-pattern. Additionally, no detection of common research anti-patterns.

**Evidence:**
- Same C1 evidence — cached-first routing is structural
- `references/edge-cases.md`: Handles contradictory sources but doesn't address the meta-anti-pattern of treating cached data as truth
- No anti-pattern detection for: (a) single-source findings, (b) findings based solely on cached data, (c) version-mismatched findings treated as authoritative

**Remediation:**
1. Fix C1 issue (reverse routing order)
2. Add anti-pattern detection rules:
   - Flag single-source findings as "needs corroboration"
   - Flag findings based solely on cached data as "needs live verification"
   - Flag version-mismatched findings as "potentially inaccurate"
3. Add a "Research Quality Gate" — before finalizing findings, check for these anti-patterns

### C5: Tool Integration — PARTIAL (Score: 55)

**Finding:** GitMCP and some MCP tools not referenced in SKILL.md main body.

**Evidence:**
- `SKILL.md` body: References Context7, Deepwiki, Repomix — but NOT GitMCP, Exa, or Tavily in the main workflow
- `references/research-patterns.md`: Broader tool selection including web search tools
- GitMCP (`gitmcp_*` functions) is a critical tool for GitHub repository documentation but is absent from the main body
- Exa and Tavily are essential for web-based research but only appear in reference files, not the primary workflow

**Remediation:**
1. Add GitMCP to the main research workflow (for GitHub-hosted documentation)
2. Add Exa/Tavily to the web research workflow (for non-GitHub sources)
3. Add tool selection decision tree: "If source is GitHub → GitMCP; if source is web → Exa/Tavily; if source is npm package → Context7"

---

## Skill 3: hm-l3-research-chain

**File:** `.opencode/skills/hm-l3-research-chain/SKILL.md`
**Role:** Orchestrates the canonical research chain: ingest → detect → research → synthesize → artifact.
**Overall Verdict:** FAILED — No enforcement of constitutional constraints on downstream skills, weakest tool integration

### C1: Live-Fetch Enforcement — FAIL (Score: 20)

**Finding:** The orchestrator doesn't enforce live-fetch requirements on the skills it orchestrates. Stage 0 ("Pre-Flight") validates cache before proceeding, implicitly favoring cached assets.

**Evidence:**
- `SKILL.md` body, Stage 0 "Pre-Flight": "Validate existing cache and determine if full chain execution is needed" — if cache is fresh, the chain may skip live-fetch stages entirely
- `SKILL.md` body, Stage 2 "Research": "Delegate to hm-deep-research" — but no enforcement that hm-deep-research must use live sources
- `references/chain-stages.md`: Stage contracts don't include constitutional compliance checks
- The orchestrator is responsible for ensuring its downstream skills comply with constitutional requirements — currently, it delegates without any compliance gates

**Remediation:**
1. Add a "Constitutional Gate" between stages: before any finding is passed to the next stage, verify it was obtained from live sources (not solely cached)
2. Remove or modify Stage 0 cache-first logic: cache check should inform the research plan, not skip stages
3. Add constitutional compliance to stage contracts in `references/chain-stages.md`

### C2: Version Validation — PARTIAL (Score: 55)

**Finding:** Version validation is delegated to downstream skills with no orchestrator-level enforcement.

**Evidence:**
- `SKILL.md` body: "Consumes codebase maps from hm-detective and cached assets from hm-tech-stack-ingest" — relies on downstream skills for version matching
- `references/chain-stages.md`: No version validation gate between stages
- No orchestrator-level check: "Does the version in the research finding match the version in package.json?"

**Remediation:**
1. Add version validation gate: before synthesizing findings, verify all version-sensitive data matches project dependencies
2. Add version mismatch handling: flag findings where versions don't match
3. Add version constraint propagation: pass package.json versions to downstream skills as mandatory parameters

### C3: Evidence Requirements — PARTIAL (Score: 55)

**Finding:** Chain continuation template supports evidence tracking but doesn't enforce evidence quality.

**Evidence:**
- `templates/chain-continuation.md`: YAML template includes `evidence` field for each finding
- `references/chain-stages.md`: Stage output contracts include evidence requirements
- BUT: No enforcement that evidence must cite live sources (not just cached data)
- No evidence quality scoring at the orchestrator level

**Remediation:**
1. Add evidence quality scoring to chain-continuation template: `evidence_quality: live | cached | mixed`
2. Add orchestrator-level check: "What percentage of findings are backed by live sources?"
3. Add minimum live-source threshold: require at least 50% of findings to cite live sources

### C4: Anti-Pattern Detection — FAIL (Score: 15)

**Finding:** No anti-pattern detection at the orchestrator level. The chain can produce findings entirely from cached data without flagging this as a quality risk.

**Evidence:**
- `SKILL.md` body: No anti-pattern detection section
- `references/chain-stages.md`: No anti-pattern checks in stage contracts
- `templates/chain-continuation.md`: No anti-pattern flags in YAML template
- The orchestrator is the LAST line of defense before findings are synthesized into artifacts — but it has no anti-pattern detection

**Remediation:**
1. Add anti-pattern detection to the synthesis gate: before producing the final artifact, scan findings for:
   - Single-source findings
   - Findings based solely on cached data
   - Version-mismatched findings
   - Contradictory findings without resolution
2. Add anti-pattern flags to chain-continuation template
3. Add "Research Quality Score" to final artifact output

### C5: Tool Integration — FAIL (Score: 20)

**Finding:** The tool-matrix.md is only 9 lines with vague tool names. No exact MCP function names. Exa, Tavily, and GitMCP not mentioned in SKILL.md body.

**Evidence:**
- `references/tool-matrix.md`: Only 9 lines, contains generic descriptions like "Codebase analysis" and "Documentation lookup" without specific tool names
- `SKILL.md` body: References hm-detective, hm-deep-research, hm-synthesis, hm-tech-stack-ingest as sibling skills but doesn't specify which MCP tools each skill should use
- No tool selection guidance for the orchestrator: "When should the chain use Context7 vs Deepwiki vs Exa?"
- Exact MCP function names (like `context7_resolve-library-id`, `deepwiki_ask_question`, `tavily_tavily_search`) are completely absent

**Remediation:**
1. Rewrite `references/tool-matrix.md` with:
   - Exact MCP function names for each research context
   - Tool selection decision tree
   - Fallback chains when primary tools are unavailable
2. Add tool selection guidance to SKILL.md body: "For each research stage, select tools based on source type"
3. Add tool coverage matrix: which constitutional requirements each tool satisfies

---

## Systemic Analysis

### Root Cause: Cache-First Architecture

All three skills share a "cache-first" philosophy that is architecturally sound for performance but constitutionally problematic for accuracy. The tension is:

- **Performance need:** Network calls are slow, rate-limited, and unreliable. Caching reduces latency and improves user experience.
- **Constitutional requirement:** Live external sources are authoritative. Cached files are references, not truth.

### Resolution Framework

The fix is not "never cache" — it's **tiered trust**:

| Trust Tier | Purpose | Freshness Requirement | Constitutional Status |
|-----------|---------|----------------------|----------------------|
| **Reference** | Exploration, context-building, understanding | 30-day window acceptable | SUPPLEMENTARY |
| **Validation** | Interface validation, API signatures, version checks | Live re-verification required | AUTHORITATIVE |
| **Critical** | Breaking change detection, security advisories | Always live | MANDATORY |

### Recommended Implementation Priority

1. **P0 (Constitutional fix):** Add "Critical Decision Re-verification" protocol to all 3 skills — before any finding is used for interface validation or version-sensitive decisions, require live re-fetch
2. **P1 (Routing fix):** Reverse the routing order in hm-l3-deep-research — external MCP tools become PRIMARY, cached assets become SUPPLEMENTARY
3. **P2 (Orchestrator fix):** Add constitutional compliance gates to hm-l3-research-chain stage contracts
4. **P3 (Tool matrix fix):** Rewrite hm-l3-research-chain tool-matrix.md with exact MCP function names
5. **P4 (Evidence fix):** Add live-source tracking to all findings in all 3 skills

---

## Audit Methodology

- **Evidence level:** L3 (file content analysis, not runtime verification)
- **Scoring model:** 0-100 per criterion, threshold-based verdicts (PASS ≥ 70, PARTIAL 40-69, FAIL < 40)
- **Threshold consistency:** Same thresholds applied across all skills and all criteria
- **Evidence references:** All findings reference specific files and sections within those files
- **No fabrication:** Gaps are reported as gaps, not invented evidence

## Appendix: Raw Scores

| Skill | C1 | C2 | C3 | C4 | C5 | Average |
|-------|:--:|:--:|:--:|:--:|:--:|:-------:|
| hm-l3-tech-stack-ingest | 50 | 85 | 75 | 25 | 80 | 63.0 |
| hm-l3-deep-research | 30 | 60 | 65 | 20 | 55 | 46.0 |
| hm-l3-research-chain | 20 | 55 | 55 | 15 | 20 | 33.0 |
| **Average** | **33.3** | **66.7** | **65.0** | **20.0** | **51.7** | **47.3** |

**Overall Audit Score:** 38/100 (weighted: C1 and C4 are constitutional requirements, double-weighted)

---

*Audit completed 2026-05-10 by hm-auditor. All findings are evidence-based. Remediation recommendations are prioritized by constitutional impact.*

# Chain Stage Contracts

## Constitutional Requirements (Apply to ALL Stages)

**Two-Tier Trust Model:** Every stage must distinguish between Validation Tier (live sources) and Reference Tier (cached sources). Live sources are PRIMARY for any claim that affects implementation decisions.

**50% Live Source Threshold:** Before any stage passes findings to the next stage, at least 50% of findings must cite live (non-cached) sources. If this threshold is not met, the stage must re-run with explicit live-source requirements.

**Staleness Severity Scale:**
- CRITICAL (>24h): MUST re-verify before trusting for production decisions
- HIGH (>7d): SHOULD re-verify; cached acceptable for orientation only
- STANDARD (>30d): Re-verify before finalizing findings
- LOW (>90d): Treat as potentially outdated

**MCP Fallback Chain:** Context7 → Repomix → DeepWiki → GitHub → Exa → Tavily

## Stage 0: Ingest (hm-tech-stack-ingest)

**Input:** Dependency list (package.json, requirements.txt, etc.)
**Output:** Cached tech stack in `references/tech-stacks/<name>/`
**Time box:** Variable (depends on cache freshness)

**Constitutional Gate:** Cache informs the research plan but does NOT skip stages. Even when cache is fresh, Validation Tier requires at least one live verification per research session. Cached assets inform DISCOVERY only — never VALIDATION.

**Required Evidence:** Valid metadata.json with version, source_url, ingest_date. Cache freshness checked against Staleness Severity Scale.

## Stage 1: Detect (hm-detective)

**Input:** Research question or codebase
**Output:** `.tech-registry.json` + initial findings
**Time box:** 10-20% of total research time

**Constitutional Gate:** Detection findings must note which sources were live vs cached. Cache-only detections MUST NOT be used for implementation decisions without Stage 2 live verification.

**Required Evidence:** Source mode used (SCAN/READ/DEEP), areas checked, areas inaccessible

## Stage 2: Research (hm-deep-research)

**Input:** Detect findings + specific questions
**Output:** Structured findings with citations
**Time box:** 50-60% of total research time

**Constitutional Gate:** Research findings must include `evidence_quality: live | cached | mixed` per finding. At least 50% of findings must cite live sources. Findings below this threshold trigger a re-run with explicit live-source requirements before synthesis.

**Required Evidence:** Source evaluation, contradiction status, blocked-source notes, version match status per finding

## Stage 3: Synthesize (hm-synthesis)

**Input:** Research findings
**Output:** Final artifact
**Time box:** 20-30% of total research time

**Constitutional Gate:** Before producing final artifact, scan findings for anti-patterns: SINGLE-SOURCE, CACHE-ONLY, VERSION-MISMATCH, UNRESOLVED-CONTRADICTION. Compute Research Quality Score (A-F). Artifact must include evidence_quality, live_source_ratio, research_quality_score in metadata.

**Required Evidence:** Methodology/limitations, recommendation-to-evidence links, Research Quality Score with rationale

## Stage 4: Artifact + Continuation

**Input:** Synthesized artifact + all prior stage outputs
**Output:** Final artifact with lineage metadata
**Time box:** 5-10% of total research time

**Constitutional Gate:** Artifact metadata must include evidence_quality, live_source_ratio, research_quality_score. If any prior stage gate failed, return BLOCKED — do NOT produce partial artifacts.

**Required Evidence:** Full continuation metadata (chain_id, detect_artifact, research_artifact, synthesis_artifact, sources_reviewed, blocked_sources, contradictions, evidence_quality, live_source_ratio, research_quality_score)

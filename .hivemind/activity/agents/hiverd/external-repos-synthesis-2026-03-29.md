# External Skill Repositories Synthesis Report

**Packet ID:** inv-1b-external-repos  
**Date:** 2026-03-29  
**Researcher:** hiverd (External Research Specialist)  
**Status:** COMPLETED

---

## Executive Summary

Analyzed two external skill repositories for patterns, templates, scripts, metrics, and workflows applicable to HiveMind's research and synthesis capabilities:

1. **jwynia/agent-skills** (35 stars, MIT license) - TypeScript-heavy skill library with research methodology, fact-checking, and task decomposition patterns
2. **199-biotechnologies/claude-deep-research-skill** (327 stars, MIT license) - Enterprise-grade Python-based research engine with 8-phase pipeline, validation infrastructure, and source credibility scoring

**Key Finding:** Both repos emphasize **separation of concerns** (research vs verification), **structured phase-gated workflows**, **evidence persistence**, and **automated validation**. Neither repo fully addresses agent delegation patterns or multi-agent coordination.

---

## Repositories Analyzed

| # | Repository | Stars | Language | Focus |
|---|-----------|-------|----------|-------|
| 1 | jwynia/agent-skills | 35 | TypeScript (97%), Python | Research methodology, fact-checking, task decomposition |
| 2 | 199-biotechnologies/claude-deep-research-skill | 327 | Python | 8-phase research pipeline, validation, credibility scoring |

---

## Repository 1: jwynia/agent-skills

**URL:** https://github.com/jwynia/agent-skills

### Methodology Extracted

#### Research Skill (4-Phase Methodology)

**Phase 0: Analysis** - Scope calibration with decision-stakes assessment
- Stakes matrix: Reversible/low → Quick scan (60-70% confidence) | Irreversible/high → Deep expertise (90-95% confidence)
- Pre-search template for topic structuring

**Phase 1: Vocabulary Discovery** - Expert terminology unlocking
- Identifies insider vs outsider terms
- Cross-domain synonym mapping
- Expert terms surface deeper academic content

**Phase 2: Foundational Search** - Authoritative source gathering
- Question-pattern → command mapping table
- Source-type selection criteria (Academic/Practitioner/News/Official)
- 2-3 authoritative sources per major perspective

**Phase 3: Counter-Perspective Search** - Explicit adversarial search
- `--exclude` flag to avoid echo chambers
- Failure-mode queries
- Strongest-counterargument search

**Phase 4: Synthesis** - Confidence-marked completion
- Three completion tiers: Minimum Viable, Working Knowledge, Deep Expertise
- Diminishing-returns signals (circular citations, familiar content)
- Confidence markers: Established | Strong evidence | Moderate evidence | Limited evidence | Unknown

#### Diagnostic States (R0-R7)

| State | Symptom | Phase to Revisit |
|-------|---------|------------------|
| R0: No Analysis | Searching without structuring topic | Phase 0 |
| R1: No Vocabulary | Using outsider terms | Phase 1 |
| R2: Single-Perspective | All sources support one view | Phase 3 |
| R3: Domain Blindness | Searching only in familiar field | Phase 1 |
| R4: Recency Bias | Only recent sources | Phase 2 |
| R5: Breadth Without Depth | Many tabs, no synthesis | Phase 4 |
| R6: Completion Uncertainty | Unsure when to stop | Phase 4 |
| R7: Complete | Can explain, identify uncertainties | Done |

### Templates Found

1. **Research Analysis Template** - Topic structuring with concepts, stakeholders, temporal scope, domains, controversies
2. **Vocabulary Map Template** - Term/domain/depth matrix with cross-domain synonyms
3. **Synthesis Template** - Summary, confidence, key findings, perspectives table, counter-evidence, caveats
4. **Scope Calibration Table** - Decision stakes vs research depth mapping
5. **Question-Pattern → Command Mapping** - How question types map to search commands

### Scripts Found

1. **Tavily CLI** (`scripts/tavily-cli.ts`) - Deno-based search tool
   - Commands: `--answer`, `--depth`, `--results`, `--topic`, `--time`, `--include`, `--exclude`, `--raw`, `--json`
   - Supports academic, news, finance topics

### Metrics Found

1. **Confidence Levels** - High/Medium/Low with explicit phrases
2. **Source Quality Indicators** - Authority, recency, expertise, bias
3. **Stakes-Depth Calibration** - Decision irreversibility mapped to research depth

### Workflows Found

1. **4-Phase Research Workflow** - Analysis → Vocabulary → Foundational → Counter-perspectives → Synthesis
2. **Vocabulary Discovery Process** - 5-step iterative terminology expansion
3. **Foundational Search Process** - Expert terms → queries → perspective tracking
4. **Counter-Perspective Process** - 5-step adversarial search with exclusion

### Key Patterns

1. **Vocabulary-First Search** - Expert terminology unlocks deeper content
2. **Counter-Perspective as Phase** - Explicit adversarial search, not optional
3. **Decision-Stakes Calibration** - Research depth proportional to decision importance
4. **Diminishing-Returns Signals** - Stop when new sources cite same foundational works
5. **Diagnostic State Machine** - R0-R7 states to identify research stalls

---

## Repository 2: 199-biotechnologies/claude-deep-research-skill

**URL:** https://github.com/199-biotechnologies/claude-deep-research-skill

### Methodology Extracted

#### 8-Phase Pipeline

| Phase | Name | Quick | Standard | Deep | UltraDeep |
|-------|------|-------|----------|------|-----------|
| 1 | SCOPE | Y | Y | Y | Y |
| 2 | PLAN | - | Y | Y | Y |
| 3 | RETRIEVE | Y | Y | Y | Y |
| 4 | TRIANGULATE | - | Y | Y | Y |
| 4.5 | OUTLINE REFINEMENT | - | Y | Y | Y |
| 5 | SYNTHESIZE | - | Y | Y | Y |
| 6 | CRITIQUE | - | - | Y | Y |
| 7 | REFINE | - | - | Y | Y |
| 8 | PACKAGE | Y | Y | Y | Y |

#### Phase 3: RETRIEVE - Parallel Information Gathering
- **First Finish Search (FFS) Pattern** - Adaptive quality thresholds by mode
- Parallel execution with 5-10 concurrent searches + 2-3 focused sub-agents
- Structured evidence objects: `{"claim", "evidence_quote", "source_url", "source_title", "confidence"}`
- Sub-agent output format enforced to prevent synthesis fatigue

#### Phase 4: TRIANGULATE
- Core claims require 3+ independent sources
- Cross-reference verification
- Flag contradictions explicitly
- Document verification status per claim

#### Phase 4.5: OUTLINE REFINEMENT (Dynamic Evolution)
- Evidence-driven outline adaptation
- Signals for adaptation vs keep-current decisions
- Targeted gap filling with time-boxed delta-queries
- Documented adaptation rationale

#### Phase 6: CRITIQUE
- Red Team Questions framework
- Persona-Based Critique (Deep/UltraDeep only):
  - Skeptical Practitioner
  - Adversarial Reviewer
  - Implementation Engineer
- **Critical Gap Loop-Back**: Return to Phase 3 with delta-queries if gaps found

#### Phase 8: PACKAGE
- Progressive file assembly strategy
- Report auto-continuation for >18K words via recursive agent spawning
- Disk-persisted citations survive context compaction

### Templates Found

1. **Report Template** (`templates/report_template.md`) - Complete report structure
   - Executive Summary (200-400 words)
   - Introduction (scope, methodology, assumptions)
   - Main Analysis (4-8 findings, 600-2,000 words each)
   - Synthesis & Insights (patterns, novel insights, implications)
   - Limitations & Caveats (counterevidence register, known gaps)
   - Recommendations (immediate, next steps, further research)
   - Bibliography (complete, no placeholders)
   - Methodology Appendix (phase execution, sources, verification, claims-evidence table)

2. **McKinsey HTML Report Template** - Professional output styling

3. **Claims-Evidence Table** - Explicit mapping of claims to sources with confidence levels

### Scripts Found

1. **validate_report.py** - 9 automated quality checks
   - Executive summary length
   - Required sections present
   - Citation formatting
   - Bibliography completeness
   - No placeholder text
   - Word count
   - Source count ≥10
   - No broken internal links

2. **verify_citations.py** - DOI/URL/hallucination detection

3. **source_evaluator.py** - Source credibility scoring (0-100)
   - Domain authority (35% weight)
   - Recency (20% weight)
   - Expertise (25% weight)
   - Bias score (20% weight)
   - HIGH_AUTHORITY_DOMAINS list (arxiv, nature, science, IEEE, gov domains)
   - MODERATE_AUTHORITY_DOMAINS (tech news, industry publications)
   - LOW_AUTHORITY_INDICATORS (blogspot, wordpress, subdomain)

4. **citation_manager.py** - Citation tracking with disk persistence

5. **md_to_html.py** - Markdown to McKinsey-style HTML

6. **research_engine.py** - Core orchestration engine

### Metrics Found

1. **Source Credibility Score (0-100)** - Composite scoring with component breakdown
2. **First Finish Search Thresholds**:
   - Quick: 10+ sources, avg credibility >60, OR 2 min elapsed
   - Standard: 15+ sources, avg credibility >60, OR 5 min elapsed
   - Deep: 25+ sources, avg credibility >70, OR 10 min elapsed
   - UltraDeep: 30+ sources, avg credibility >75, OR 15 min elapsed
3. **Minimum 3 Sources per Major Claim** - Triangulation enforcement
4. **Quality Gates** - 9 automated validation checks
5. **Validation Loop Protocol** - Max 3 retry cycles

### Workflows Found

1. **4-Mode Research Pipeline** - Quick (3 phases, 2-5 min) | Standard (6 phases, 5-10 min) | Deep (8 phases, 10-20 min) | UltraDeep (8+ phases, 20-45 min)
2. **Parallel Retrieval Protocol** - All searches in single message, then spawn sub-agents
3. **Graph-of-Thoughts Reasoning** - Non-linear branching with backtracking
4. **Validation Loop Protocol** - validate → fix → retry (max 3 cycles)
5. **Progressive File Assembly** - Section-by-section with immediate writes
6. **Critique Loop-Back** - Phase 6 can return to Phase 3 with delta-queries

### Key Patterns

1. **Mode-Scalable Depth** - Quick/Standard/Deep/UltraDeep adapts to decision stakes
2. **Parallel-First Retrieval** - Concurrent searches + sub-agents, not sequential
3. **Structured Evidence Objects** - JSON format for agent returns prevents synthesis fatigue
4. **Source Credibility Scoring** - 0-100 composite with domain authority lists
5. **Critique-Refine Cycle** - Red-team persona-based critique before packaging
6. **Outline Evolution** - Evidence-driven outline adaptation mid-research
7. **First Finish Search** - Adaptive threshold stops when sufficient quality reached
8. **Disk-Persisted Citations** - Survives context compaction
9. **Anti-Truncation** - Explicitly forbids "Content continues..." patterns

---

## Cross-Repository Patterns

### Pattern 1: Separation of Generation and Verification
Both repos enforce **separate passes** for content generation vs verification.
- jwynia: Research (gather) → Fact-check (verify)
- 199-biotech: Synthesize → Critique → Refine
- **HiveMind Relevance:** `use-hivemind-research` vs potential verification skill

### Pattern 2: Phase-Gated Workflows with Loop-Back
Both repos use structured phases with conditional returns:
- jwynia: Diagnostic states (R0-R7) trigger phase revisits
- 199-biotech: Phase 6 critique can loop-back to Phase 3
- **HiveMind Relevance:** Current `hivemind-gatekeeping` could incorporate diagnostic states

### Pattern 3: Confidence-Marked Synthesis
Both repos require explicit confidence assignment:
- jwynia: Established | Strong | Moderate | Limited | Unknown
- 199-biotech: High/Medium/Low per claim, composite source scores
- **HiveMind Relevance:** Could enhance `hivemind-synthesis` output contracts

### Pattern 4: Vocabulary/Terminology Discovery
jwynia's Phase 1 (Vocabulary Discovery) is unique - no equivalent in 199-biotech
- **HiveMind Relevance:** Could enhance research skill with terminology mapping

### Pattern 5: Source Credibility Scoring
199-biotech's `source_evaluator.py` provides 0-100 composite scoring
- jwynia lacks explicit scoring, uses authority-domain heuristics
- **HiveMind Relevance:** Could integrate credibility scoring into research outputs

### Pattern 6: Anti-Hallucination Protocols
Both repos have explicit hallucination prevention:
- jwynia: Separate pass, source citation required
- 199-biotech: Citation tracking, verify before citing, explicit uncertainty markers
- **HiveMind Relevance:** Could strengthen delegation return contracts

### Pattern 7: Diminishing Returns Detection
Both repos signal when to stop:
- jwynia: Circular citations, familiar content, marginal value
- 199-biotech: First Finish Search adaptive thresholds
- **HiveMind Relevance:** Could enhance `use-hivemind-research` stop conditions

### Pattern 8: Task Decomposition (jwynia only)
jwynia's `task-decomposition` skill provides:
- Vertical slicing patterns
- Cognitive limits (7±2 items, 15-20 files)
- Walking skeleton pattern
- **HiveMind Relevance:** Could inform `hivemind-refactor` or planning skills

---

## Gap Analysis vs HiveMind

### Research Skill Gaps

| Gap | Description | Source | Recommendation |
|-----|-------------|--------|----------------|
| G1: Vocabulary Discovery | No phase for expert terminology mapping | jwynia | Add Phase 1 (Vocabulary) to `use-hivemind-research` |
| G2: Counter-Perspective Search | No explicit adversarial search phase | jwynia | Add counter-perspective requirement to research packets |
| G3: Source Credibility Scoring | No 0-100 scoring infrastructure | 199-biotech | Integrate `source_evaluator.py`-style scoring |
| G4: Decision-Stakes Calibration | No research-depth-to-stakes mapping | jwynia | Add stakes matrix to research initialization |
| G5: Multi-Mode Depth | No Quick/Standard/Deep/UltraDeep scaling | 199-biotech | Add mode selection to research packets |

### Synthesis Skill Gaps

| Gap | Description | Source | Recommendation |
|-----|-------------|--------|----------------|
| G6: Claims-Evidence Mapping | No explicit claim-to-source tracking | 199-biotech | Add claims table to synthesis outputs |
| G7: Confidence per Claim | No per-claim confidence assignment | 199-biotech | Enhance synthesis template with claim confidence |
| G8: Counterevidence Register | No explicit contradictory evidence section | 199-biotech | Add counterevidence documentation to synthesis |
| G9: Progressive Assembly | No section-by-section generation strategy | 199-biotech | Add progressive generation for large syntheses |
| G10: Novel Insights Section | Synthesis templates lack "beyond sources" insight | 199-biotech | Add insight-generation phase to synthesis |

### Delegation Skill Gaps

| Gap | Description | Source | Recommendation |
|-----|-------------|--------|----------------|
| G11: Structured Evidence Returns | Sub-agents return free text, not JSON evidence | 199-biotech | Add structured evidence schema to delegation packets |
| G12: Parallel Agent Coordination | No First-Finish pattern for parallel retrieval | 199-biotech | Add adaptive completion thresholds |
| G13: Loop-Back Protocols | Critique→Retrieve loop-back not formalized | 199-biotech | Add phase-return protocol to delegation |
| G14: Cognitive Limits in Delegation | No working-memory or context-switch guidance | jwynia | Add cognitive limit checks to delegation packets |
| G15: Delta-Query Specification | No standard for targeted gap-filling queries | 199-biotech | Add delta-query format to research packets |

### Verification Skill Gaps

| Gap | Description | Source | Recommendation |
|-----|-------------|--------|----------------|
| G16: Separate Verification Pass | Fact-check as mandatory separate phase | jwynia | Create `use-hivemind-verification` skill |
| G17: Hallucination Patterns Catalog | Common hallucination types catalog | jwynia | Add to verification skill |
| G18: Attribution Drift Detection | Specific hallucination subtype detection | jwynia | Add to verification patterns |
| G19: Citation Verification Script | Automated DOI/URL validation | 199-biotech | Integrate `verify_citations.py` patterns |
| G20: Validation Loop Protocol | validate→fix→retry cycles | 199-biotech | Add to verification skill |

---

## Integration Recommendations

### Recommendation 1: Extend `use-hivemind-research`

**Pattern:** Vocabulary-First Search + Decision-Stakes Calibration  
**Source:** jwynia research methodology  
**How:** Add Phase 0.5 (Vocabulary Discovery) and stakes assessment to research initialization

```markdown
## Research Initialization
1. Assess decision stakes (reversible/irreversible, low/high impact)
2. Calibrate research depth to stakes
3. Discover expert terminology before deep search
4. Plan counter-perspective searches
```

### Recommendation 2: Create `use-hivemind-verification`

**Pattern:** Separate Verification Pass + Hallucination Catalog  
**Source:** jwynia fact-check skill  
**How:** New skill for post-generation verification

**Core capabilities:**
- Claim extraction (verifiable statements)
- Source verification (external grounding)
- Hallucination pattern detection
- Confidence assignment per claim

### Recommendation 3: Enhance `hivemind-synthesis`

**Pattern:** Claims-Evidence Table + Confidence per Claim + Novel Insights  
**Source:** 199-biotech report template  
**How:** Extend synthesis output to include:

```markdown
## Synthesis Output Extension
- Claims-evidence table with source citations
- Per-claim confidence (High/Medium/Low)
- Counterevidence register
- Novel insights section (beyond sources)
- Diminishing-returns declaration
```

### Recommendation 4: Add Source Credibility Scoring

**Pattern:** Domain Authority Lists + Composite Scoring  
**Source:** 199-biotech `source_evaluator.py`  
**How:** Create `src/shared/source-credibility.ts` with:

- HIGH_AUTHORITY_DOMAINS list (academic, gov, established tech docs)
- MODERATE_AUTHORITY_DOMAINS (tech news, industry publications)
- LOW_AUTHORITY_INDICATORS (personal blogs, unknown domains)
- Composite scoring: domain(35%) + recency(20%) + expertise(25%) + bias(20%)

### Recommendation 5: Formalize Validation Loops

**Pattern:** validate→fix→retry (max 3 cycles)  
**Source:** 199-biotech quality-gates  
**How:** Add validation loop protocol to `hivemind-gatekeeping`

```
## Validation Loop
1. Run structure validation
2. Run citation verification
3. If fails: fix specific issues, re-run
4. Max 3 cycles, then STOP and report
```

### Recommendation 6: Add Parallel Agent Evidence Schema

**Pattern:** Structured Evidence Objects  
**Source:** 199-biotech Phase 3 sub-agent returns  
**How:** Standardize delegation return schema:

```typescript
interface EvidenceObject {
  claim: string;
  evidence_quote: string;
  source_url: string;
  source_title: string;
  confidence: number; // 0-100
}
```

### Recommendation 7: Integrate Task Decomposition Patterns

**Pattern:** Vertical Slicing + Cognitive Limits  
**Source:** jwynia task-decomposition skill  
**How:** Enhance `hivemind-refactor` or planning skills:

- Max 7±2 concepts per task
- Max 15-20 files per task
- Vertical slice per deployable value
- Walking skeleton for new systems

---

## Blocked Routes

| Route | Reason | Impact |
|-------|--------|--------|
| None | Both repositories fully accessible via web search and GitHub | N/A |

---

## Recommended Next Action

**Immediate next step:** Implement source credibility scoring infrastructure

**Rationale:**
1. Both repos agree that source quality is foundational to research quality
2. 199-biotech's `source_evaluator.py` provides a complete, working implementation
3. Credibility scoring is independent of other gaps - can be implemented standalone
4. Enables downstream validation (high-confidence sources for critical claims)

**Implementation path:**
1. Create `src/shared/source-credibility.ts` with domain lists and scoring function
2. Integrate into `use-hivemind-research` outputs as `sourceCredibility` field
3. Add `minCredibility` threshold parameter to research packets
4. Update synthesis templates to filter/weight by credibility

**Estimated effort:** 1-2 days (scoring function is self-contained)

---

## Source Index

| Source | Type | Confidence | Accessed |
|--------|------|------------|----------|
| https://playbooks.com/skills/jwynia/agent-skills/research | Documentation | HIGH | 2026-03-29 |
| https://playbooks.com/skills/jwynia/agent-skills/fact-check | Documentation | HIGH | 2026-03-29 |
| https://playbooks.com/skills/jwynia/agent-skills/research-workflow | Documentation | HIGH | 2026-03-29 |
| https://playbooks.com/skills/jwynia/agent-skills/task-decomposition | Documentation | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/README.md | GitHub | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/SKILL.md | GitHub | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/COMPETITIVE_ANALYSIS.md | GitHub | MEDIUM | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/reference/methodology.md | GitHub | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/reference/quality-gates.md | GitHub | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/scripts/validate_report.py | Source Code | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/scripts/source_evaluator.py | Source Code | HIGH | 2026-03-29 |
| https://github.com/199-biotechnologies/claude-deep-research-skill/templates/report_template.md | Template | HIGH | 2026-03-29 |

---

## Appendix: Validation Scripts Summary

### validate_report.py (199-biotech)

**9 automated checks:**
1. Executive summary length (200-400 words)
2. Required sections present
3. Citations formatted [N]
4. Bibliography matches citations
5. No placeholder text (TBD, TODO)
6. Content truncation patterns
7. Word count (500-10000)
8. Minimum 10 sources
9. No broken internal links

**Bibliography truncation detection:**
- Citation ranges ([8-75])
- "Additional citations" phrases
- "[...continue" patterns
- Standalone "etc."

### source_evaluator.py (199-biotech)

**Component scoring:**
- Domain authority: 0-100 (HIGH/MODERATE/LOW lists)
- Recency: 0-100 (age-based decay)
- Expertise: 0-100 (academic/gov/tech indicators)
- Bias: 0-100 (sensationalism detection, balanced language)

**Overall:** Weighted composite (35% domain + 20% recency + 25% expertise + 20% bias)

---

*Report generated by hiverd (External Research Specialist)*  
*For internal HiveMind skill development use only*

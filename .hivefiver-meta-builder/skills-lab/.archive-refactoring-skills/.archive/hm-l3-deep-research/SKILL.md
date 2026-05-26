---
name: hm-l3-deep-research
description: Conduct version-matched deep research with MCP tools and citation tracking. Use when investigating libraries, verifying API signatures, or gathering multi-source evidence. Stage 2 of the hm-research-chain pipeline. Consumes codebase maps from hm-detective and cached assets from hm-tech-stack-ingest. Feeds findings into hm-synthesis for artifact compression. NOT for quick lookups or single-source checks.
metadata:
  layer: "3"
  role: "research"
  pattern: P1
allowed-tools: Read Write Edit Bash Glob Grep
---

## Overview

Conduct version-matched deep research with MCP tools and citation tracking. Use when investigating libraries, verifying API signatures, gathering multi-source evidence, or producing comprehensive research reports. Returns structured findings with citations and evidence persistence.

## Quick Jump

| Research Need | Start Here |
|---------------|------------|
| "This case vs. that case" | [Case Comparison](references/case-comparison.md) |
| "Something went wrong" | [Edge Cases](references/edge-cases.md) |
| "When do I stop researching?" | [Requirements vs. Spec](references/requirements-vs-spec.md) |
| "Where do I draw the line?" | [Interface Tradeoffs](references/interface-tradeoffs.md) |
| "Turn findings into features" | [Brainstorming & Shaping](references/brainstorming-shaping.md) |
| "What kind of research am I doing?" | [Research Patterns](references/research-patterns.md) |
| "This is high-stakes or exhaustive" | [Sequential Research Gates](workflows/sequential-research-gates.md) |
| "Which sources should I trust?" | [Source Evaluation Template](templates/source-evaluation.md) |
| "Sources disagree" | [Contradiction Matrix](templates/contradiction-matrix.md) |

<execution_context>
For reading modes during investigation: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis

For cached tech stack assets (offline API signatures, repo references): load skill "hm-tech-stack-ingest"
Cross-architecture research routing: LIVE external sources are PRIMARY. Cached assets provide CONTEXT and SUPPLEMENT live verification. When hm-tech-stack-ingest has cached a library, use cached assets for ORIENTATION but ALWAYS validate API signatures and version-sensitive claims against live Context7, DeepWiki, or other MCP tools before finalizing findings.

For artifact export and compression: load skill "hm-synthesis"
Export tier: Standard (findings + decisions) for most research
Compression: Snapshot for full analysis, Focused for targeted investigation

For chain orchestration: load skill "hm-research-chain"
hm-deep-research is Stage 2 of the canonical research chain.
</execution_context>

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## Cross-Architecture Research Routing

LIVE external sources are PRIMARY. Cached assets provide CONTEXT, not TRUTH. For interface validation and API signature lookups, ALWAYS prefer live sources. Cached assets supplement understanding but cannot substitute for live verification of version-sensitive claims.

### Two-Tier Trust Model (Consistent with hm-tech-stack-ingest)

| Tier | Role | Sources | When to Trust |
|------|------|---------|---------------|
| **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live Exa/Tavily, Live GitMCP, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
| **Reference Tier** (SUPPLEMENTARY) | Provide context | Cached source code (repomix raw/), Cached API docs (context7 api/), Cached structured docs (deepwiki docs/) | For architecture orientation, pattern understanding, historical context, offline research |

### Staleness Severity Scale

| Severity | Age | Action |
|----------|-----|--------|
| CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
| HIGH | > 7 days | SHOULD re-verify; cached data acceptable for orientation only |
| STANDARD | > 30 days | Re-verify before finalizing findings |
| LOW | > 90 days | Treat as potentially outdated; note in findings |

### Routing Decision Tree (Live-First)

```
1. ALWAYS start with live sources:
   ├── Need library documentation? → Context7 (resolve → query with version)
   ├── Need GitHub-hosted docs/source? → GitMCP or Repomix
   ├── Need web sources/articles? → Exa or Tavily search
   └── Need architecture overview? → DeepWiki

2. SUPPLEMENT with cached assets (if available):
   ├── Cached source code exists? → Use for orientation and pattern understanding
   ├── Cached API docs exist? → Use to formulate better live queries
   └── Cached version differs from installed? → Flag discrepancy, trust INSTALLED version

3. VALIDATE findings:
   ├── For version-sensitive claims → Live re-verification is MANDATORY
   ├── For API signatures → Live Context7 or source inspection is PRIMARY
   └── For architectural patterns → Cached + live corroboration is ideal
```

### Validation Priority (Constitutional)

| Source | Priority | When to Trust |
|--------|----------|---------------|
| **Live Context7 query** | PRIMARY | For API signatures, type definitions, version-matched documentation |
| **Live DeepWiki/Exa/Tavily** | PRIMARY | For web sources, architecture overview, community patterns |
| **Live GitMCP/GitHub** | PRIMARY | For GitHub-hosted source code, README, issue discussions |
| **Live Repomix** | PRIMARY | For full repo analysis with cross-dependency tracking |
| **Cached source code** | SUPPLEMENTARY | For orientation only — provides CONTEXT, not TRUTH |
| **Cached API docs** | SUPPLEMENTARY | For initial understanding — MUST validate against live sources |
| **Cached structured docs** | SUPPLEMENTARY | For background — flag staleness in findings |

### Critical Decision Checkpoint

Before finalizing ANY version-sensitive finding (API signature, breaking change, deprecation notice):
1. **Ask:** "Was this verified against a live source?"
2. **If NO:** Stop. Re-verify via live MCP tool before including in findings.
3. **If YES but from cached source:** Mark as "needs live corroboration" in findings.
4. **Record:** Source URL, fetch timestamp, and version in every citation.

---

## The Six Concepts

Every research task touches at least two of these. Complex tasks touch all six.

### 1. Case Comparison — "This Case vs. That Case"

Research is comparative by nature. You are always deciding between approaches, tools, patterns, or solutions. The case comparison framework gives you a structure for side-by-side analysis.

**When to use it**: Every time you evaluate two or more options.

| Dimension | Case A | Case B |
|-----------|--------|--------|
| Approach | [what A does] | [what B does] |
| Depth needed | [shallow/medium/deep] | [shallow/medium/deep] |
| Risk of wrong answer | [low/medium/high] | [low/medium/high] |
| Time to validate | [hours/days] | [hours/days] |
| Reversibility | [easy/hard] | [easy/hard] |

**Example**: "Should we use Prisma or Drizzle for our ORM?"

| | Prisma | Drizzle |
|---|--------|---------|
| Approach | Schema-first, generated client | SQL-like, type-inferred |
| Depth needed | Medium (docs are thorough) | Deep (patterns are emergent) |
| Risk of wrong answer | Medium (lock-in) | Low (closer to SQL) |
| Time to validate | 2 days (migration tooling) | 1 day (simpler setup) |
| Reversibility | Hard (schema migration) | Easy (raw SQL fallback) |

Load [references/case-comparison.md](references/case-comparison.md) for 5 complete case pairs with decision frameworks.

---

### 2. Edge Cases — When Research Goes Wrong

Research fails in predictable ways. The top 6 failure modes:

| Failure | Signal | First Response |
|---------|--------|----------------|
| Contradictory sources | Two authoritative sources disagree | Check dates. Newer wins, but verify changelogs. |
| Outdated information | Last update > 12 months, API version mismatch | Search with freshness filter. Check GitHub releases. |
| Too new for patterns | < 6 months old, < 100 GitHub stars | Read source code directly. Build a prototype. |
| Vendor docs are wrong | Code doesn't match documented behavior | Create a minimal repro. File an issue. Use the code, not the docs. |
| No clear winner | 3+ valid approaches, zero differentiation | Define your constraints first. Pick the simplest that fits. |
| Scope creep | Research question keeps expanding | Write a one-sentence scope. Anything outside = separate investigation. |

Load [references/edge-cases.md](references/edge-cases.md) for each failure's full resolution workflow.

---

### 3. Requirements vs. Spec — When to Stop Researching

Research has a natural endpoint. Cross it and you are writing a specification, not doing research. The boundary looks like this:

| Phase | Mindset | Output | Duration |
|-------|---------|--------|----------|
| **Research** | "What's possible?" | Findings, options, tradeoffs | Open-ended |
| **Requirements** | "What do we need?" | Measurable needs, constraints, priorities | Convergent |
| **Specification** | "How do we build it?" | Interfaces, data models, test cases | Precise |

**Signals you've crossed the boundary**:

- You start defining function signatures → you are in spec territory
- You list acceptance criteria → you are in requirements territory
- You say "we should" instead of "they offer" → you left research territory

**How to handle premature specification**: Stop. Write down what triggered it. Ask: "Do I have enough evidence for this decision?" If no, go back to research. If yes, acknowledge the transition and switch to requirements framing.

Load [references/requirements-vs-spec.md](references/requirements-vs-spec.md) for the full transition template.

---

### 4. Interface Tradeoffs — Where to Draw Lines

During research, you investigate interfaces — APIs, type boundaries, module contracts. The question is always: how deep do I go?

**Decision framework**:

```
1. SCOPE: What surface area does this research cover?
   - Single function → SCAN mode, 15 min max
   - Module boundary → DEEP mode on public exports only
   - Cross-module → DEEP mode on interfaces, SKIM on implementations

2. DEPTH: How much do I need to understand?
   - "What does it do?" → SKIM + examples
   - "How does it work?" → SCAN + error paths
   - "Can I change it?" → DEEP + dependents + tests

3. CONFIDENCE: How sure do I need to be?
   - High confidence (production decision) → 3+ sources, working prototype
   - Medium confidence (architecture planning) → 2 sources, interface extraction
   - Low confidence (exploration) → 1 source, document as hypothesis

4. STOP CONDITION: When do I stop investigating this interface?
   - When confidence matches the decision's reversibility
   - Easy to reverse → low confidence is fine → stop early
   - Hard to reverse → high confidence needed → keep digging
```

Load [references/interface-tradeoffs.md](references/interface-tradeoffs.md) for worked examples from real codebases.

---

### 5. Brainstorming & Shaping — From Findings to Features

Research produces findings. Findings become features through this pipeline:

```
RESEARCH → SYNTHESIZE → BRAINSTORM → SHAPE → VALIDATE
  findings    patterns     ideas      proposals    evidence
```

**The critical rule**: Brainstorm from evidence, not imagination. Every feature idea must trace back to at least one research finding.

**Shaping a feature proposal**:

| Element | Question | Source |
|---------|----------|--------|
| Problem | What user pain exists? | Research finding |
| Approach | What solution does the evidence support? | Best-evaluated option |
| Scope | What's the minimum viable version? | Constraint analysis |
| Risks | What could go wrong? | Edge case findings |
| Validation | How do we know it worked? | Measurable criteria |

**Anti-patterns to avoid**:

- Feature creep: adding capabilities beyond what research supports
- Analysis paralysis: requiring 100% confidence before proposing anything
- Premature optimization: designing for scale the research doesn't justify
- Solution shopping: researching until you find confirmation of a pre-chosen answer

Load [references/brainstorming-shaping.md](references/brainstorming-shaping.md) for the full brainstorming-to-proposal workflow.

---

### 6. Research Patterns — Five Archetypes

Every research task falls into one of five archetypes. Identify yours, then follow the matching workflow.

| Archetype | Question | Depth | Breadth |
|-----------|----------|-------|---------|
| **Technology Scan** | "What's out there?" | Shallow | Broad |
| **Market Analysis** | "What's the landscape?" | Medium | Broad |
| **Codebase Archaeology** | "What's in here?" | Deep | Narrow |
| **API Investigation** | "How does this work?" | Deep | Narrow |
| **Competitive Audit** | "How do others do it?" | Medium | Medium |

### Quick Pattern Selection

```
What are you researching?
|
+-- A technology, library, or tool
|   +-- "What options exist?" → Technology Scan
|   +-- "How does this specific one work?" → API Investigation
|
+-- A market, product area, or business question
|   +-- "What's the competitive landscape?" → Market Analysis
|   +-- "How do competitors solve this?" → Competitive Audit
|
+-- An existing codebase or system
|   +-- "What does this code do?" → Codebase Archaeology
|   +-- "How does this API work?" → API Investigation
|
+-- Not sure yet
    → Start with Technology Scan (broadest, cheapest)
      Then narrow to the specific archetype that matches
```

Load [references/research-patterns.md](references/research-patterns.md) for complete workflows per archetype (5-7 steps, tools, output format, validation gate).

---

## Research Workflow (All Patterns)

Regardless of archetype, every research task follows this skeleton:

### High-Stakes Sequential Gate

For deep, exhaustive, compliance, architecture, or public-facing research, run the gated sequence before the normal loop. This adapts the strict phase-gate pattern from third-party deep-research packages while keeping the workflow harness-neutral.

1. **Frame gate:** write the research question, scope boundary, decision owner, and stop condition.
2. **Source gate:** collect at least three relevant sources or document why fewer exist; classify each source with `templates/source-evaluation.md`.
3. **Deep-read gate:** extract claims into a durable note before synthesizing; do not summarize from snippets alone.
4. **Contradiction gate:** fill `templates/contradiction-matrix.md` for any competing claims, version differences, or source conflicts.
5. **Artifact gate:** produce a final artifact with source links, unresolved gaps, and continuation IDs if work may resume later.

**Stop rule:** If a gate output is missing, stop and document `BLOCKED`, not `PASS`.

### Step 1: Frame the Question

Write one sentence. If you cannot, the question is too broad.

```
Good: "What ORM options exist for TypeScript serverless projects in 2026?"
Bad: "What's the best database setup?"
```

### Step 2: Identify the Archetype

Use the pattern selection tree above. Load the matching workflow from [references/research-patterns.md](references/research-patterns.md).

### Step 3: Set the Context Budget

Estimate tokens available. Divide by 4 for character budget. Never spend > 70% on fetching — reserve 30% for synthesis.

### Step 4: Execute the Research Loop

```
LOOP:
  1. Pick next hypothesis or question
  2. Select tool (see Tool Quick Reference below)
  3. Execute search/extraction
  4. Write finding immediately — never batch
  5. Check: answered? If no, refine query (max 3 attempts)
  6. Check: contradicts prior finding? If yes, flag for resolution
  7. Next hypothesis
UNTIL all questions addressed OR budget exhausted
```

### Step 5: Synthesize

Merge findings into a coherent answer. Structure depends on archetype:

| Archetype | Synthesis Output |
|-----------|-----------------|
| Technology Scan | Comparison table + recommendation |
| Market Analysis | Landscape map + positioning |
| Codebase Archaeology | Architecture diagram + dependency map |
| API Investigation | Interface contract + usage patterns |
| Competitive Audit | Feature matrix + gap analysis |

### Step 6: Validate

Every claim needs a source. Key claims need direct evidence (source code, official docs) or 2+ corroborating sources.

### Step 7: Persist Provenance

Before handing off, create or update a research artifact with:

- source list with evaluated authority and freshness
- contradiction matrix entries and resolution status
- continuation key (`research_id`, upstream issue, PR, URL, or interaction ID)
- unresolved gaps that must not be hidden behind confident language

Use [workflows/sequential-research-gates.md](workflows/sequential-research-gates.md) when the artifact will feed implementation, planning, or verification.

```
Evidence levels:
  DIRECT       → Code/docs prove it
  CORROBORATED → 2+ independent sources agree
  TESTIMONIAL  → One source says so (mark "unverified")
  ABSENCE      → No evidence found (not the same as disproved)
```

### Step 7: Deliver

Produce the artifact. Minimum structure:

1. **Executive summary** — 3-5 sentences, the answer
2. **Key findings** — numbered, each with evidence level and source
3. **Tradeoffs** — what you gave up, what you gained
4. **Gaps** — what you couldn't answer, and why
5. **Source index** — every URL, file path, or tool output consulted

---

## Tool Quick Reference

| Task | Primary Tool | Fallback | Tool Type |
|------|-------------|----------|-----------|
| Library documentation | Context7 (resolve → query) | DeepWiki | Live Validation |
| Repo understanding | DeepWiki | Repomix pack | Live Validation |
| GitHub docs/source | GitMCP | GitHub API | Live Validation |
| Broad web discovery | Exa (semantic search) | Tavily search | Live Validation |
| Targeted web extraction | Tavily extract | Fetcher | Live Validation |
| Code search | Exa web search | Grep | Live Validation |
| Recent news/releases | Tavily search (time_range) | Exa | Live Validation |
| Site documentation crawl | Tavily crawl | Manual extract loop | Live Validation |
| Complex multi-source | Tavily research (pro) | Multi-search + manual synthesize | Live Validation |
| Cached API signatures | hm-tech-stack-ingest references | — | Reference Tier |
| Cached source code | hm-tech-stack-ingest raw/ | — | Reference Tier |

### Budget Rules

- Context7: resolve-library-id ONCE, then max 3 query-docs calls per library
- Tavily: start with basic depth. Escalate to advanced only when basic is insufficient
- Repomix: always use compress=true (70% reduction). Always set includePatterns
- Context > 70% consumed: stop fetching, synthesize what you have, document gaps

---

## Version-Matched Documentation Research

When researching libraries or frameworks where version matters (APIs, breaking changes, deprecation), use version-specific Context7 queries rather than generic ones. Generic queries return latest-version documentation that may not match the codebase's pinned version.

### When to Use

- Researching a library where the user's version is >1 major behind latest
- Investigating breaking changes between versions
- Searching for migration guides or deprecation notices
- The codebase's `package.json`, `Cargo.toml`, or `go.mod` specifies exact versions

### Protocol

```
Step 1: Read .tech-registry.json (via hm-detective SCAN or hm-synthesis detection)
  - Extract resolved versions from stack.framework, stack.runtime, stack.test_framework
  - Also check lockfiles for transitive dependency versions

Step 2: Resolve versioned library in Context7
  - Use resolve-library-id with versioned name: "Next.js 14" not just "Next.js"
  - If resolve-library-id fails with version suffix, try without version, then filter results

Step 3: Query with version-specific questions
  - "Next.js 14 app router API for middleware"
  - "React 18 useEffect cleanup behavior changes"
  - "TypeScript 5.2 satisfies keyword usage"

Step 4: Detect breaking changes
  - Compare user's version vs. latest documented version
  - Flag when >2 major versions behind
  - Search for migration guides: "migrate from X to Y [library]"
```

### Breaking Change Detection

| Gap | Action | Context7 Query Pattern |
|-----|--------|------------------------|
| 1 major version behind | Note in findings, no action | — |
| 2 major versions behind | Flag as tech debt, estimate effort | "[library] [old] to [new] migration guide" |
| 3+ major versions behind | Require ADR before recommending upgrade | "[library] [old] breaking changes [new]" |
| Deprecated API in use | Immediate replacement recommendation | "[library] [version] [api] deprecated alternative" |

**Rule:** Do NOT recommend upgrading across >2 major versions without a dedicated migration research phase. The risk of silent breaking changes exceeds the benefit of newer features.

---

## Anti-Patterns — Stop When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Single-Source Synthesis | Only 1 source for a key claim | Find a second source before asserting |
| Full-Page Fetch | Reading > 50KB when you need 3 lines | Use grep + offset reading |
| Infinite Research Loop | 3rd search returns no new findings | Stop. Synthesize what you have. |
| Premature Specification | Defining function signatures during research | Write the spec idea down, return to research |
| Feature Creep in Research | Question expands beyond original scope | Write scope boundary, defer expansions |
| Solution Shopping | Only researching one option | Require 2+ alternatives before recommending |
| Context Graveyard | 30 min investigation with nothing on disk | Write findings every batch |
| Stale Cite | Source > 6 months old for current tech | Use freshness filters, re-validate |

## Research Quality Gate

Before finalizing ANY research artifact, run this quality gate check:

### Pre-Delivery Checklist

| Check | Condition | Action |
|-------|-----------|--------|
| Single-source flag | Key claim backed by only 1 source | Mark as "needs corroboration"; seek 2nd source |
| Cache-only flag | Finding based solely on cached data | Mark as "needs live verification"; run live MCP query |
| Version-mismatch flag | Doc version ≠ installed version | Mark as "potentially inaccurate"; verify against correct version |
| Staleness flag | Source > severity threshold age | Re-verify via live source per Staleness Severity Scale |
| Missing citation flag | Finding has no source URL | Add source URL or remove finding |

### Evidence Confidence Scale

| Level | Meaning | Requirements |
|-------|---------|-------------|
| HIGH | Live-verified + corroborated | ≥1 live source + ≥1 independent source agree |
| MEDIUM | Live-verified but single source | 1 live source, no corroboration available |
| LOW | Cached-only or stale | Based on cached/supplementary data; needs live re-verification |
| UNVERIFIED | No source evidence | Hypothesis only; do not use for production decisions |

### Per-Finding Citation Requirements

Every finding MUST include:
1. **Source URL or file path** — even for cached asset findings
2. **Fetch timestamp** — when the source was consulted (use ISO 8601)
3. **Source tier** — "Validation Tier (live)" or "Reference Tier (cached)"
4. **Staleness indicator** — "This finding is based on cached data from YYYY-MM-DD" (for cached sources)
5. **Confidence level** — HIGH / MEDIUM / LOW / UNVERIFIED

### Tool Selection Decision Tree

```
What type of source are you researching?
├── GitHub-hosted project? → GitMCP (read docs/search code) OR Repomix (pack repo)
├── npm package documentation? → Context7 (resolve → query with version)
├── General web content? → Exa (semantic search) OR Tavily (search/extract)
├── Architecture/overview needed? → DeepWiki (repo wiki) OR Tavily Research (comprehensive)
└── Multiple sources needed? → Tavily Research (pro mode, multi-source synthesis)
```

### MCP Tool Fallback Chain (Consistent with hm-tech-stack-ingest)

```
Context7 → Repomix → DeepWiki → GitHub (GitMCP) → Exa → Tavily
```

Each step is tried if the previous returns insufficient results. Document which tool(s) were used in findings.

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md is insufficient for your task.

- **[Case Comparison](references/case-comparison.md)** — Side-by-side research scenarios with decision frameworks
- **[Edge Cases](references/edge-cases.md)** — Real-life edge cases with resolution workflows
- **[Requirements vs. Spec](references/requirements-vs-spec.md)** — Boundary detection and transition templates
- **[Interface Tradeoffs](references/interface-tradeoffs.md)** — Depth decisions with worked examples
- **[Brainstorming & Shaping](references/brainstorming-shaping.md)** — Findings-to-features pipeline
- **[Research Patterns](references/research-patterns.md)** — 5 archetypes with full workflows

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple lookup (< 3 searches) | All references | SKILL.md has enough |
| Only need tool parameters | All references | Tool Quick Reference above is sufficient |
| Single-option evaluation | case-comparison.md, competitive patterns | No comparison needed |
| Context > 50% consumed | ALL references | Synthesize what you have, document gaps |

## Self-Correction

When research produces unreliable findings or reaches a dead end, use these correction modes before escalating:

### Mode 1: Contradictory Sources (two authoritative sources disagree)

```
1. Check publication dates — newer source wins, but verify its changelog
2. Check version alignment — does the contradiction stem from version differences?
3. Fill templates/contradiction-matrix.md with both claims and evidence
4. If unresolvable: flag as UNRESOLVED, document both positions, recommend investigation
5. If resolvable: document the winning claim with rationale
```

### Mode 2: Source Failure (MCP tool returned empty, error, or irrelevant results)

```
Which tool failed?
├── Context7 → re-resolve library ID without version, then filter results; fall back to deepwiki
├── Tavily → refine query: add "docs", "API", or "reference"; try brave-search as fallback
├── DeepWiki → use repomix_pack_remote_repository instead; search GitHub directly
├── Repomix → try context7 for API surface; use web extraction for docs
├── Exa → try tavily-search with same query; use brave-search
└── All tools failed → document as BLOCKED in findings, proceed with available evidence
```

### Mode 3: Infinite Research Loop (3rd search iteration with no new findings)

```
1. STOP. Do not run another search.
2. Review existing findings: is the question actually answered?
   ├── YES → Synthesize what you have, document remaining gaps
   └── NO → Reframe the question more narrowly, limit to 1 more search cycle
3. If still looping after reframed question → document as NEEDS_CONTEXT
```

### Mode 4: Premature Specification (research bleeding into spec territory)

```
Self-check:
└── Are you defining function signatures? → STOP. Move to requirements framing.
└── Are you saying "we should" instead of "they offer"? → STOP. Return to research.
└── Are you writing acceptance criteria? → STOP. Acknowledge the transition.
```

### Mode 5: Stale or Missing Version Match (researched docs don't match installed version)

```
1. Re-read .tech-registry.json for the exact pinned version
2. Run version-specific Context7 query with the exact version (LIVE source first)
3. If live source unavailable → check cached API signatures from hm-tech-stack-ingest (SUPPLEMENTARY)
4. If latest docs don't match → check migration guides, changelogs, breaking change notices via live search
5. If version gap > 2 majors → require ADR before recommending upgrade
6. Always record: source URL, fetch timestamp, version verified, confidence level
```

### Maximum Correction Attempts

3 per research task. After 3 correction cycles without resolution:
- Document findings with evidence levels (DIRECT, CORROBORATED, TESTIMONIAL, ABSENCE)
- Flag unresolved contradictions in the matrix
- Write continuation key for future investigation
- Export artifact with methodology, limitations, and gap documentation

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)    (upstream)     (this skill)     (downstream)
```

hm-deep-research is **Stage 2 (Research)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached API signatures, repo references, and version-matched source code. Use cached assets for signature-level validation before external searches. See [Cross-Architecture Research Routing](#cross-architecture-research-routing). |
| `hm-detective` | Codebase map and `.tech-registry.json`. hm-detective tells hm-deep-research WHAT technology stack is in use so research is version-matched. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-synthesis` | hm-deep-research produces structured findings with citations and evidence levels. hm-synthesis compresses these into actionable artifacts. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-deep-research is Stage 2 of the chain. hm-research-chain decides when to trigger hm-deep-research after Stage 1 detection. |

### Boundary Clarification

| Nearby Skill | What hm-deep-research Does | What the Other Skill Does |
|-------------|--------------------------|--------------------------|
| `hm-tech-stack-ingest` | Uses cached API signatures for research validation; researches what isn't cached using MCP tools | Downloads and caches libraries; does NOT perform research or compare approaches |
| `hm-detective` | Researches external libraries, APIs, and web sources using version-matched queries | Investigates local codebase structure with SCAN/READ/DEEP modes |
| `hm-synthesis` | Produces structured research findings with citations, evidence levels, and source evaluation | Compresses and restructures those findings into plans, ADRs, and exportable artifacts |
| `hm-research-chain` | Executes Stage 2 evidence gathering when triggered by the chain | Orchestrates the full pipeline, routes between stages, and handles continuation metadata |

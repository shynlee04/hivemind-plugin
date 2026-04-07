---
name: hm-deep-research
description: "Multi-stage deep research for technology, market, and codebase investigation. Use when the user asks to research, investigate, analyze, compare, explore, evaluate, or deep-dive into any topic — from market analysis and technology comparison to codebase archaeology and API investigation. Covers the full research lifecycle: framing \u2192 domain research \u2192 cross-tech synthesis \u2192 validation. Triggers on: research, investigate, analyze, compare, explore, evaluate, deep dive, look into, find out, what's the state of, how does X work, compare X vs Y, can we build X, is X viable, audit, analyze codebase, map architecture."
---

# HM Deep Research

The ONE skill for any research task. Stages advance from framing to validated synthesis.

## Quick Jump

| Research Need | Stage | Jump |
|---------------|-------|------|
| "What's the state of X?" | Framing | [Stage 1: Framing](#stage-1-framing) |
| "How does X work?" | Domain | [Stage 2: Domain Research](#stage-2-domain-research) |
| "Compare X vs Y vs Z" | Domain (comparative) | [Stage 2: Domain Research](#stage-2-domain-research) |
| "Investigate across repos/stacks" | Cross-Tech | [Stage 3: Cross-Tech Research](#stage-3-cross-tech-research) |
| "Validate findings / cite sources" | Validation | [Stage 4: Validation](#stage-4-validation--synthesis) |
| "Which tool do I use?" | Tool Selection | [Tool Selection Matrix](#tool-selection-matrix) |
| "Quick lookup for tool params" | Cheat Sheet | [references/cheat-sheets.md](references/cheat-sheets.md) |
| "What can go wrong?" | Anti-Patterns | [Anti-Patterns](#anti-patterns--stop-when-you-detect-these) |

## Stage Gate Model

Each stage has an entry gate and exit gate. Do NOT skip stages.

```
STAGE 1: FRAMING          -> Output: research-plan.md
  | (gate: plan has scope, hypotheses, tool budget)
STAGE 2: DOMAIN RESEARCH  -> Output: findings-stage2.md  
  | (gate: all hypotheses addressed OR explicitly deferred)
STAGE 3: CROSS-TECH       -> Output: findings-stage3.md (only if needed)
  | (gate: contradictions resolved, gaps identified)
STAGE 4: VALIDATION       -> Output: synthesis-report.md
  | (gate: every claim has source, every gap documented)
DONE
```

## Stage 1: Framing

MANDATORY: Load references/stage-1-framing.md before proceeding. Agents that skip this WILL miss critical framing procedures and anti-patterns.

### Identify Research Type

| Question Type | Research Type | Tool Bundle | Time Budget |
|---------------|---------------|-------------|-------------|
| "Does X exist?" | Discovery | tavily-search (basic) -> Context7 -> code search | 15 min |
| "How does X work?" | Technical | Context7 -> tavily-extract -> DeepWiki | 30 min |
| "Compare X vs Y" | Comparative | Parallel: Context7 per lib + tavily-search for benchmarks | 45 min |
| "Why is X broken?" | Diagnostic | grep -> LSP -> git log -> repomix | 30-60 min |
| "Can we build X?" | Feasibility | Context7 + repomix + tavily-search | 60 min |
| "Map architecture of X" | Audit | repomix pack -> grep -> read -> LSP | 60-120 min |

### Framing Checklist

- [ ] Write the research question in ONE sentence
- [ ] Identify research type from table above
- [ ] List 3-5 hypotheses or unknowns to investigate
- [ ] Estimate context budget (tokens available / 4 = approx chars budget)
- [ ] Select tool bundle from table
- [ ] Write research-plan.md (use references/research-plan-template.md)
- [ ] **Gate check**: plan has scope, hypotheses, and tool budget -> proceed to Stage 2

## Stage 2: Domain Research

MANDATORY: Load references/stage-2-domain-research.md before proceeding. Agents that skip this WILL miss tool-specific pitfalls and query refinement procedures.

### Tool Selection Matrix

| Task | Primary Tool | Fallback | When to Use |
|------|-------------|----------|-------------|
| Broad discovery | tavily-search (basic) | brave-search | First pass, unknown territory |
| Targeted retrieval | tavily-extract | fetcher | Known URLs, need content |
| Library docs | Context7 (resolve -> query) | DeepWiki | Framework/library specifics |
| Repo understanding | DeepWiki | repomix pack | Architecture, design decisions |
| Code search | codesearch (Exa) | grep | API patterns, code examples |
| News/recent | brave-news | tavily-search (time_range: week) | Current events, releases |
| Site download | tavily-crawl | manual extract loop | Documentation sites |
| Full analysis | tavily-research (pro) | multi-search + manual synthesize | Complex multi-source questions |

_For per-tool parameter details, see [Tool Operations](references/tool-operations.md) or [Cheat Sheets](references/cheat-sheets.md)._

### Research Loop

```
LOOP:
  1. Pick next hypothesis from research-plan.md
  2. Select tool from matrix above
  3. Execute search/extraction
  4. Write finding IMMEDIATELY to findings-stage2.md (format: references/findings-format-template.md)
  5. Check: did this answer the hypothesis? If NO -> refine query, try again (max 3x)
  6. Check: does finding contradict prior finding? If YES -> flag for Stage 4
  7. Next hypothesis
UNTIL all hypotheses addressed OR budget exhausted
```

### Context Budget Rules

- Estimate before fetching: ~4 chars/token. If target > 50KB, use grep/offset NOT full read.
- Repomix: always use compress (70% reduction). Always set includePatterns. Always grep before read.
- Tavily: start with basic depth (1 credit). Escalate to advanced (2 credits) only when basic is insufficient.
- Context7: resolve-library-id ONCE, then max 3 query-docs calls. No retries on same query.
- When context > 70% consumed: stop fetching, synthesize what you have, document gaps.

### Gate Check

- [ ] All hypotheses addressed OR explicitly deferred with reason
- [ ] Every finding has a source (URL, file path, or tool output)
- [ ] No finding contradicts another without being flagged
- [ ] Context budget not exceeded
- [ ] If cross-stack/cross-repo needed -> **PREREQUISITE: load coordinating-loop skill** -> proceed to Stage 3

## Stage 3: Cross-Tech Research

MANDATORY: Load references/stage-3-cross-tech-research.md before proceeding. Agents that skip this WILL miss delegation patterns and subagent prompt envelope requirements.

**PREREQUISITE: This stage requires delegation. Load `coordinating-loop` skill before proceeding.**

### When Cross-Tech Is Needed

| Scenario | Pattern | Agents |
|----------|---------|--------|
| Compare 3+ libraries | Parallel: 1 agent per lib | researcher x N |
| Investigate bug across stack | Parallel: competing hypotheses | explore x N + critic x 1 |
| Feasibility check | Sequential: stack -> code -> validate | researcher -> explore -> critic |
| Architecture audit | 4-batch: survey -> deep -> cross-ref -> persist | researcher x 2 -> explore x 2 -> critic x 1 |

### Subagent Prompt Envelope (5 Required Sections)

Every research subagent MUST receive:
1. **Task**: One sentence (e.g., "Investigate Prisma's multi-tenant schema support")
2. **Scope**: Include/exclude files, domains, or topics
3. **Context**: Max 50 lines of relevant background
4. **Expected Output**: Concrete deliverable (e.g., "findings-prisma.md with 3 sections: features, limitations, code examples")
5. **Verification**: Command to check output (e.g., "grep -c '##' findings-prisma.md -> expects >= 3")

### Wave Structure

```
Wave 1: Broad     -> 2-3 parallel researcher agents -> findings-wave1-agent-N.md
Wave 2: Deep      -> 1-2 explore agents (deep-dive on Wave 1 leads) -> findings-wave2-deep-N.md  
Wave 3: Validate  -> 1 critic agent (cross-reference, flag contradictions) -> findings-wave3-validation.md
Wave 4: Synthesize -> Coordinator merges all -> synthesis-report.md
```

### Gate Check

- [ ] All parallel streams completed OR documented why incomplete
- [ ] Partial failures integrated (never discard successful results)
- [ ] Contradictions between streams identified and flagged
- [ ] Cross-references validated against source code or official docs
- [ ] Proceed to Stage 4

## Stage 4: Validation & Synthesis

MANDATORY: Load references/stage-4-validation-synthesis.md before proceeding. Agents that skip this WILL miss evidence scoring procedures and citation tracking requirements.

### Evidence Scoring

| Level | Definition | Example |
|-------|-----------|---------|
| **Direct** | Code/docs prove it | Source code shows the API, official docs confirm |
| **Correlational** | Timing/patterns suggest it | Version release coincides with feature announcement |
| **Testimonial** | Someone said it works | Blog post, StackOverflow answer, "works on my machine" |
| **Absence** | No evidence found != disproved | Searched 3 sources, none mention the feature |

**Rule**: Key claims require Direct evidence or 2+ Correlational sources. Testimonial-only claims must be marked "unverified."

### Citation Format

Every claim in the synthesis report MUST include:
```
**Claim**: [statement]
**Evidence**: [Direct|Correlational|Testimonial|Absence]
**Source**: [URL or file path]
**Confidence**: [High|Medium|Low]
```

### Synthesis Report Structure

Use references/synthesis-report-template.md. Minimum sections:
1. Executive Summary (3-5 sentences)
2. Key Findings (numbered, each with evidence)
3. Contradictions & Resolutions
4. Gaps (what we couldn't answer)
5. Recommendations (actionable next steps)
6. Source Index (all URLs/files consulted)

### Gate Check (FINAL)

- [ ] Every claim has a source
- [ ] Key claims have Direct evidence or 2+ Correlational
- [ ] All contradictions resolved or documented
- [ ] All gaps documented with reason (budget, tool limit, time)
- [ ] Report is actionable: every finding has an implication
- [ ] **DONE -> deliver synthesis-report.md to user**

_Quick tool reference: [Cheat Sheets](references/cheat-sheets.md) | [Tool Operations](references/tool-operations.md)_

## Anti-Patterns — STOP When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Single-Source Synthesis | Only 1 source for key claim | Find >=1 more source before asserting |
| Full-Page Fetch | Reading > 50KB when you need 3 lines | Use grep + offset reading |
| Infinite Research Loop | 3rd search with no new findings | STOP. Synthesize what you have. |
| Rate Burn | Used all Context7 calls in first minute | Budget: resolve ONCE, query max 3x. Fallback: Context7 miss → DeepWiki → tavily-search with include_domains: ["github.com"] |
| Stale Cite | Source > 6 months old for current tech | Use freshness filters. Re-validate. |
| Hallucinated API | Describing API without source | If you can't cite it, mark "unverified" |
| Context Graveyard | 30 min investigation with nothing on disk | Write findings EVERY batch. |
| Broadcast Delegation | Same prompt to 5 agents | Each agent gets unique scope/hypothesis |
| Fire-and-Forget | Dispatched agents, never read results | Collect and integrate after every wave |

## References (Progressive Disclosure)

- **[Stage 1: Framing](references/stage-1-framing.md)** — Research types, hypothesis formation, budget estimation
- **[Stage 2: Domain Research](references/stage-2-domain-research.md)** — Tool bundles, query refinement, findings protocol
- **[Stage 3: Cross-Tech](references/stage-3-cross-tech-research.md)** — Delegation triggers, wave structure, prompt envelopes
- **[Stage 4: Validation](references/stage-4-validation-synthesis.md)** — Evidence scoring, citation tracking, report writing
- **[Tool Operations](references/tool-operations.md)** — Per-tool operational knowledge (rate limits, params, pitfalls)
- **[Cheat Sheets](references/cheat-sheets.md)** — Quick reference cards for every tool
- **[Research Plan Template](references/research-plan-template.md)** — Stage 1 output template
- **[Findings Format Template](references/findings-format-template.md)** — Stage 2-3 findings template
- **[Synthesis Report Template](references/synthesis-report-template.md)** — Stage 4 output template

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple lookup (< 3 searches) | All stage references | SKILL.md has enough for discovery searches |
| Only need tool params | stage-1 through stage-4 | Load only tool-operations.md or cheat-sheets.md |
| Single-domain research | stage-3-cross-tech-research.md | No delegation needed |
| Already have findings | stage-1-framing.md, stage-2-domain-research.md | Jump to stage-4 for validation |
| Context > 50% consumed | ALL references | Synthesize what you have, document gaps |

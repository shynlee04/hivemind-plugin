---
name: research-methodology
description: "Structured research process: question framing, source evaluation, evidence grading, confidence scoring."
---

# Research Methodology

Use this skill when conducting structured research that requires multi-source investigation, evidence grading, and confidence-scored findings.

## Question Framing

Transform vague topics into specific, answerable questions:
1. Identify the core knowledge gap — what exactly is unknown?
2. Decompose into 3-5 sub-questions with clear scope boundaries.
3. For each sub-question, define what a satisfactory answer looks like.
4. Identify which sub-questions can be answered from code vs. web vs. documentation.

## Source Discovery Strategy

Use MCP tools in this priority order:
1. **DeepWiki + Repomix** — For repository-specific knowledge (architecture, patterns, API contracts)
2. **Context7** — For library/framework documentation with code examples
3. **Tavily search + extract** — For web articles, blog posts, official docs
4. **Google search** — For broad discovery when specific tools miss

Target 8-12 sources per research topic. Fewer = insufficient coverage. More = diminishing returns.

## Evidence Grading

For each piece of evidence, assign:
- **Source reliability**: Official docs (high), maintained repo (high), blog post (medium), forum answer (low)
- **Recency**: <6 months (current), 6-18 months (recent), >18 months (stale — flag for verification)
- **Corroboration**: Multiple sources agree (strong), single source (moderate), contradicted (weak)

## Confidence Scoring

Grade each finding:
- **High** — Multiple corroborating reliable sources, recent evidence, directly answers the question
- **Partial** — Single reliable source or inference from strong indirect evidence
- **Low** — Inference without direct evidence, or based on stale/unreliable sources

## Contradiction Handling

When sources disagree:
1. Document both positions with full citations.
2. Assess which source has higher reliability and recency.
3. Check for context differences (different versions, different use cases).
4. Present resolution recommendation with explicit reasoning.
5. If unresolvable, present both positions with confidence caveats.

## Output Structure

Every research output must include:
- Sub-questions addressed
- Source inventory with reliability grades
- Findings per sub-question with confidence scores
- Contradictions and resolutions
- Coverage gaps identified
- Actionable recommendations

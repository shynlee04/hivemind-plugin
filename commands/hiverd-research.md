---
name: "hiverd-research"
description: "Run structured multi-source research on a topic with evidence gathering, source evaluation, and synthesis."
execution_context: "workflows/hiverd-deep-research.yaml"
required_skills:
  - "research-methodology"
  - "source-evaluation"
required_templates:
  - "templates/research-report-template.md"
chain_group: "hiverd"
entry_gate: "session_declared"
---

# HiveRD Research

## Objective

Conduct structured, multi-source research on a given topic. Produce an evidence-backed research report with confidence scoring, source citations, and gap identification.

## Process

1. **Frame the question** — Transform the user's topic into 3-5 specific, answerable sub-questions with scope boundaries.
2. **Discover sources** — Use MCP tools (Tavily, Context7, DeepWiki, web-search) to find 8-12 relevant sources.
3. **Evaluate sources** — Grade each source for reliability, recency, authority using the source-evaluation skill rubric.
4. **Gather evidence** — Extract key findings from each source with direct citations.
5. **Synthesize** — Resolve contradictions, identify patterns, note gaps in coverage.
6. **Report** — Produce structured output using `research-report-template.md`.

## Arguments

- `$ARGUMENTS` — The research topic or question. Can be a phrase, URL, or structured query.

## MCP Tool Priority

1. DeepWiki + Repomix (repo-specific knowledge)
2. Context7 (library documentation)
3. Tavily search + extract (web sources)
4. Google search (broad discovery)

## Output

A structured research report saved to `docs/research/` with:
- Executive summary
- Source inventory with reliability grades
- Findings organized by sub-question
- Confidence scores per finding
- Contradictions and gap analysis
- Recommendations

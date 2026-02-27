---
name: hiverd-compare
description: Comparative analysis of technologies, patterns, or approaches with
  weighted scoring.
owner_agent: hiverd
kind: router
execution_context: workflows/hiverd-comparative-analysis.yaml
required_skills:
  - comparative-analysis
  - source-evaluation
required_templates:
  - templates/analysis-matrix-template.md
required_references:
  - references/research-quality-criteria.md
required_prompts:
  - prompts/comparison-criteria.md
chain_group: hiverd
group: hiverd
entry_gate: session_declared
---
# HiveRD Compare

## Objective

Conduct a structured comparative analysis between 2-5 candidates (technologies, patterns, approaches). Produce a weighted scoring matrix with clear recommendation.

## Process

1. **Define criteria** — Establish 5-8 evaluation criteria with weights based on project priorities.
2. **Investigate candidates** — Research each candidate using MCP tools and documentation.
3. **Score** — Rate each candidate 1-5 on each criterion with evidence justification.
4. **Sensitivity analysis** — Test if the recommendation changes when weights shift ±20%.
5. **Recommend** — Present winner with tradeoff analysis and runner-up alternatives.

## Arguments

- `$ARGUMENTS` — The candidates to compare and the context for comparison.

## Output

A comparative analysis using `analysis-matrix-template.md` with:
- Criteria definitions and weight justifications
- Per-candidate evidence summaries
- Scoring matrix with weighted totals
- Sensitivity analysis results
- Recommendation with tradeoffs

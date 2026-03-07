---
name: hiverd-analyze
description: Deep analysis of a codebase, architecture, or domain with structured findings.
owner_agent: hiverd
kind: router
execution_context: workflows/hiverd-comparative-analysis.yaml
required_skills:
  - comparative-analysis
  - research-methodology
required_templates:
  - templates/analysis-matrix-template.md
required_references:
  - references/research-quality-criteria.md
required_prompts:
  - prompts/analysis-methodology.md
chain_group: hiverd
group: hiverd
entry_gate: session_declared
---

# HiveRD Analyze

## Objective

Perform deep, structured analysis of a codebase, architecture pattern, or domain. Produce findings with evidence, severity classification, and actionable recommendations.

## Process

1. **Define scope** — Clarify what is being analyzed, boundaries, and evaluation criteria.
2. **Investigate** — Use glob, grep, read, and MCP tools to gather evidence.
3. **Classify findings** — Categorize by severity (P0/P1/P2), type (architecture, quality, performance, security), and effort to remediate.
4. **Cross-reference** — Validate findings against existing documentation and planning artifacts.
5. **Report** — Produce structured analysis with evidence citations.

## Arguments

- `$ARGUMENTS` — The subject to analyze. Can be a file path, directory, concept, or domain.

## Output

A structured analysis report with:
- Scope definition and methodology
- Findings table with severity, type, evidence
- Impact assessment
- Recommendations prioritized by effort/impact ratio

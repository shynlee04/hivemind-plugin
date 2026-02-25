 ---
name: "hiverd-document"
description: "Generate structured documentation from analysis findings."
execution_context: "workflows/hiverd-synthesis-pipeline.yaml"
required_skills:
  - "synthesis-patterns"
chain_group: "hiverd"
entry_gate: "session_declared"
---

# HiveRD Document

## Objective

Transform raw analysis findings, research outputs, or technical knowledge into structured, publishable documentation.

## Process

1. **Assess source material** — Review input documents for completeness and accuracy.
2. **Define document structure** — Choose appropriate format (spec, guide, reference, report) based on content type.
3. **Draft sections** — Write each section with proper technical depth for the target audience.
4. **Cross-reference** — Ensure all claims link back to evidence sources.
5. **Produce output** — Write final document to appropriate docs/ subdirectory.

## Arguments

- `$ARGUMENTS` — Topic to document, source material paths, or documentation goal.

## Output

A structured document in `docs/` with:
- Clear section hierarchy
- Technical accuracy verified against sources
- Cross-references to related documents
- Audience-appropriate depth

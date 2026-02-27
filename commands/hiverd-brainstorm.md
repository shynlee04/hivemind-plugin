---
name: hiverd-brainstorm
description: Run divergent ideation session with convergent evaluation and
  decision documentation.
owner_agent: hiverd
kind: router
execution_context: workflows/hiverd-brainstorm-session.yaml
required_skills:
  - synthesis-patterns
required_templates:
  - templates/brainstorm-session-template.md
required_references:
  - references/research-quality-criteria.md
required_prompts:
  - prompts/brainstorm-framing.md
chain_group: hiverd
group: hiverd
entry_gate: session_declared
---

# HiveRD Brainstorm

## Objective

Facilitate a structured brainstorming session: diverge widely on ideas, then converge on the most viable options with documented rationale.

## Process

1. **Define the problem** — Clarify the problem statement, constraints, and success criteria with the user.
2. **Divergent ideation** — Generate 8-15 ideas without filtering. Include wild/unconventional options.
3. **Categorize** — Group ideas by theme, feasibility tier, and effort level.
4. **Convergent evaluation** — Score each idea against success criteria. Use weighted matrix if criteria > 3.
5. **Select and document** — Present top 3 candidates with tradeoff analysis. Recommend one with rationale.

## Arguments

- `$ARGUMENTS` — The problem or opportunity to brainstorm about.

## Output

A brainstorm session report using `brainstorm-session-template.md` with:
- Problem statement and constraints
- Full idea inventory
- Evaluation matrix
- Top 3 candidates with tradeoffs
- Recommended direction with rationale

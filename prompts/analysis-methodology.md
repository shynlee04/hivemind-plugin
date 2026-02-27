# Analysis Methodology

Use this prompt when running deep analysis on a codebase, architecture, or technical domain.

## Method

1. Define scope first: what is included, excluded, and why this boundary is correct.
2. State evaluation lenses before investigation: architecture, quality, performance, security, operability.
3. Collect evidence from code and commands, not assumptions. Prefer direct file and command references.
4. Classify each finding by severity (P0/P1/P2) and impact domain.
5. For every finding, include the observed symptom, probable root cause, and confidence level.
6. Distinguish facts from interpretation. Label inferred conclusions explicitly.
7. Identify constraints and tradeoffs that limit the recommendation space.
8. Prioritize recommendations by effort-to-impact ratio.

## Output Requirements

- Start with scope and methodology in 3-6 bullet points.
- Provide a findings table with severity, type, evidence, and impact.
- End with a ranked action plan (immediate, near-term, strategic).
- Include unresolved questions and what evidence is still needed.

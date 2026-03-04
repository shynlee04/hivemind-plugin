---
name: synthesis-patterns
description: "Techniques for combining multiple sources: thematic analysis, contradiction resolution, gap identification."
---

# Synthesis Patterns

Use this skill when combining multiple research outputs, evidence sources, or analysis reports into a unified, coherent document.

## Pattern 1: Thematic Convergence

When multiple sources address the same topic from different angles:
1. Extract key claims from each source.
2. Group claims by theme (not by source).
3. For each theme, present the consensus view with citations from all supporting sources.
4. Note where sources add unique perspectives not found in others.

## Pattern 2: Contradiction Resolution

When sources disagree:
1. State both positions clearly with full citations.
2. Identify the root of disagreement (different context? different version? different priorities?).
3. Apply resolution strategies in order:
   - **Context disambiguation**: The contradiction disappears when context is specified
   - **Temporal resolution**: One source is more recent and reflects current state
   - **Authority resolution**: One source has higher domain authority
   - **Empirical resolution**: One position can be verified by running code/tests
4. If unresolvable, present both positions with explicit "unresolved" flag and recommend how to resolve (e.g., "test both approaches").

## Pattern 3: Gap Bridging

When coverage is incomplete:
1. List all topics that should be covered (from the research question scope).
2. Map which topics are covered by which sources.
3. Identify gaps — topics with 0 or 1 source coverage.
4. For each gap:
   - Attempt to fill via additional MCP tool queries.
   - If unfillable, document as "gap — requires further investigation" with suggested approach.

## Pattern 4: Hierarchical Synthesis

For large synthesis tasks (>5 sources):
1. Group sources into clusters by sub-topic.
2. Synthesize within each cluster first (micro-synthesis).
3. Then synthesize across clusters (macro-synthesis).
4. This prevents context overload and maintains coherence.

## Anti-Patterns to Avoid

- **Source-by-source summary**: Don't just summarize each source in order. Synthesize by theme.
- **Cherry-picking**: Don't ignore contradicting sources. Address all perspectives.
- **False consensus**: Don't present a single source's view as universal agreement.
- **Gap hiding**: Don't omit topics where evidence is weak. Flag them explicitly.
- **Unattributed claims**: Every factual claim must cite its source(s).

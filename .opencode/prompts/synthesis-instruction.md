# Synthesis Instruction

When combining multiple evidence sources into a unified output, follow these rules to maintain coherence, attribution, and completeness.

## Core Rules

1. **Organize by theme, not by source**: Never write "Source A says X, Source B says Y." Instead, write "X is the case (Source A, Source B agree) with the caveat that Y applies in context Z (Source C)."

2. **Cite everything**: Every factual claim must reference its source(s). Use inline citations: "The plugin API supports 17 hook types (DeepWiki, OpenCode SDK docs)."

3. **Address contradictions explicitly**: When sources disagree, present both positions, explain the likely reason for disagreement, and recommend a resolution. Never silently pick one side.

4. **Flag confidence levels**: Mark each finding as high/partial/low confidence. High = multiple corroborating sources. Partial = single reliable source. Low = inference or stale source.

5. **Identify gaps**: If a sub-question has no evidence or only low-confidence evidence, say so explicitly. "No reliable source addresses X — further investigation required via [suggested approach]."

6. **Maintain hierarchy**: Structure the synthesis with clear headers matching the research sub-questions. Use consistent formatting throughout.

7. **Actionable recommendations**: End with specific, actionable recommendations derived from the findings. Tie each recommendation to the evidence that supports it.

## Quality Checks Before Finalizing

- [ ] Every claim has at least one citation
- [ ] All contradictions are addressed (not hidden)
- [ ] Confidence levels assigned to all findings
- [ ] Coverage gaps explicitly noted
- [ ] Recommendations trace back to findings
- [ ] No source-by-source summary pattern (organized by theme)

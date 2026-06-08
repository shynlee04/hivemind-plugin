# Sequential Research Gates

Run these gates for high-stakes research. Do not advance until the required output exists.

| Gate | Required output | Validation |
|---|---|---|
| 1. Frame | one-sentence question, scope boundary, stop condition | question is narrow enough to answer |
| 2. Discover | source list with at least three candidates or documented scarcity | source-evaluation table started |
| 3. Review | notes from primary materials, not just snippets | reviewed materials named explicitly |
| 4. Compare | contradiction matrix or explicit "no contradictions found" note | unresolved conflicts marked |
| 5. Synthesize | artifact with recommendation, alternatives, and gaps | every key claim cites evidence |
| 6. Continue | continuation key and next action | future agent can resume without re-discovery |

## Continuation Key Format

```yaml
research_id: YYYY-MM-DD-topic-slug
sources_reviewed: [url-or-repo]
artifact_path: path/to/report.md
unresolved_gaps: []
next_action: verify | implement | ask | block
```

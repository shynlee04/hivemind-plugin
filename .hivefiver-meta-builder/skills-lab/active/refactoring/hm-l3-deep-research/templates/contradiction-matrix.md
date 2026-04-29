# Contradiction Matrix

Use this when two or more sources disagree, when a source is stale, or when implementation differs from documentation.

| Claim | Source A | Source B | Conflict type | Resolution method | Final status |
|---|---|---|---|---|---|
| [specific claim] | [citation] | [citation] | version / interpretation / missing context / direct contradiction | source-code check / changelog / repro / defer | resolved / unresolved / blocked |

## Conflict Types

- **Version:** sources describe different releases or dates.
- **Interpretation:** sources agree on facts but disagree on recommendation.
- **Missing context:** one source omits constraints another source includes.
- **Direct contradiction:** sources cannot both be true.

## Resolution Rule

If the conflict changes a recommendation and cannot be resolved with primary evidence, mark the recommendation `BLOCKED`.

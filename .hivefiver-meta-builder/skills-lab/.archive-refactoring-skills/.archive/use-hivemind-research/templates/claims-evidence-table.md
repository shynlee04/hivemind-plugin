# Claims-Evidence Table

Use this table for human-readable packaging. Mirror the same identifiers in the JSON return contract.

| Claim # | Claim Text | Evidence Quote | Source URL | Source Title | Credibility Score | Confidence Level |
|---|---|---|---|---|---:|---|
| C-01 | `<single verifiable statement>` | `<exact quote or precise factual summary>` | `https://example.com` | `<source title>` | 85 | High |
| C-02 | `<single verifiable statement>` | `<exact quote or precise factual summary>` | `https://example.com` | `<source title>` | 72 | Medium |
| C-03 | `<single verifiable statement>` | `<exact quote or precise factual summary>` | `https://example.com` | `<source title>` | 48 | Low |

## Completion Rules

- One row per claim-source pairing
- Split a claim into multiple rows if multiple sources support it
- Use High / Medium / Low only for the confidence column
- Do not leave placeholder rows in final artifacts

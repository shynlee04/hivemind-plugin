# Vocabulary Discovery

Phase 0.5 exists to translate outsider language into expert search language before expensive retrieval begins.

## Purpose

- Replace vague user phrasing with domain-native terminology
- Discover adjacent terms that unlock better documentation and academic sources
- Prevent shallow search loops caused by beginner vocabulary

## Expert vs Outsider Mapping

| Outsider Phrase | Expert Phrase | Why It Matters |
|---|---|---|
| login flow | authentication flow / auth pipeline | Official docs rarely say "login flow" only |
| background job | worker / queue consumer / scheduler | Dependency docs often split concepts |
| undo support | reversible mutation / compensating transaction | Architecture guidance uses precise terms |
| app speed | latency / throughput / render time | Performance sources require measurable language |
| data syncing | replication / reconciliation / eventual consistency | Cross-system docs use formal terms |

## Cross-Domain Synonym Table Template

| User Term | Domain | Expert Term | Adjacent Term | Negative Term to Exclude |
|---|---|---|---|---|
| `<user term>` | `<frontend/backend/data/security>` | `<preferred term>` | `<secondary synonym>` | `<avoid noisy result term>` |
| `<user term>` | `<domain>` | `<expert term>` | `<related jargon>` | `<exclude>` |

## 5-Step Terminology Expansion Process

1. **Extract raw nouns and verbs** from the user request.
2. **Map each term to the owning domain**: frontend, backend, platform, data, security, product, or operations.
3. **Generate expert replacements** using docs, package names, architecture vocabulary, and error strings already present in the codebase.
4. **Generate adjacent terms** that experts might search for even if the user never said them.
5. **Generate exclusion terms** to reduce noisy or wrong-domain results.

## Query Construction Pattern

Build search queries from three layers:

1. **Primary query** = expert term + exact task
2. **Adjacent query** = expert term + adjacent term + constraint
3. **Adversarial query** = expert term + failure mode + negative evidence

### Example

User request: `Why is our login flow flaky after moving to server actions?`

- Primary: `Next.js server actions authentication race conditions`
- Adjacent: `server actions session invalidation cookies csrf`
- Adversarial: `Next.js server actions auth failure modes not recommended`

## Vocabulary Sources

Use these in order:

1. Local code terms from imports, errors, config keys, and README sections
2. Official dependency names from `package.json` and lockfiles
3. Context7/Deepwiki terminology from docs and repo structure
4. Tavily/Exa results only after local and official vocabulary are exhausted

## Completion Check

Phase 0.5 is complete only when the packet has:

- at least 3 expert terms
- at least 2 adjacent terms
- at least 1 exclusion term
- a populated `vocabulary_map`

## Anti-Patterns

- Searching the user phrase verbatim for every provider
- Treating marketing language as engineering language
- Ignoring dependency-specific nouns already present in the codebase
- Skipping exclusion terms when results collapse into blogspam or job posts

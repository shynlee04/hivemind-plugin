# MCP Provider Research Protocol

**CONDITIONAL LOAD**: When research-methodology is active AND MCP providers are available.

> Consolidated from the MCP research loop skill. Lineage-agnostic — any agent conducting research can use MCP providers.

## Provider Readiness Check

Before running MCP-backed research, verify available providers:

| Provider | Purpose | Readiness Check |
|----------|---------|----------------|
| **Context7** | Official library/framework documentation | Can resolve library IDs |
| **Repomix** | Repository structure and code analysis | Can pack codebase |
| **Tavily** | Web search with AI extraction | Search returns results |
| **Exa** | Code-focused web search | Search returns results |

If any provider is unavailable, continue but **downgrade confidence accordingly**.

## Evidence Collection Order

Retrieve evidence in this grounded order (most authoritative first):

```
1. Repository analysis (Repomix)     → ground truth: actual code
2. Official docs (Context7)          → semantics: intended behavior
3. Web search (Tavily + Exa)         → corroboration: external sources
```

**Rationale**: Code is truth. Docs explain intent. Web corroborates.

## Query Matrix by Domain

| Domain | Primary Providers | Query Focus |
|--------|------------------|-------------|
| Codebase architecture | Repomix → Context7 | Structure, patterns, APIs |
| Library/framework usage | Context7 → Exa | Docs, examples, best practices |
| External integration | Tavily → Exa → Context7 | APIs, compatibility, alternatives |
| General knowledge | Tavily → Exa | Articles, tutorials, comparisons |

## Contradiction Register

When sources disagree:

1. Log both positions with source attribution
2. Check recency (newer sources may reflect API changes)
3. Check authority (official docs > blog posts)
4. Attempt resolution through a third source
5. If unresolvable after 3 attempts: emit explicit caveat block

## Confidence Contract

| Level | Meaning | Action |
|-------|---------|--------|
| `full` | Corroborated across 2+ providers, no critical gaps | Proceed with findings |
| `partial` | Usable but has non-critical gaps | Proceed with caveats |
| `low` | Critical gaps, contradictions, or single-source only | Flag for user review |

## Retry Contract

- Validate contradictions up to 10 iterations
- At iteration 10: force explicit caveat block, do NOT continue resolving
- Track attempt count to prevent infinite research loops

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Skipping readiness check | Provider may be unavailable → silent failures |
| Single-source conclusions | No corroboration → confidence overstatement |
| Ignoring contradictions | Unresolved conflicts → unreliable findings |
| Infinite research | 10-iteration cap prevents rabbit holes |

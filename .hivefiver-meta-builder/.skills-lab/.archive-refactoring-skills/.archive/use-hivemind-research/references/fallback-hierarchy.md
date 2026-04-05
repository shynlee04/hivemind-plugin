# Fallback Hierarchy — Decision Trees for Tool Failures

When a provider fails, follow these decision trees to maintain research continuity.

## General Fallback Rules

1. **Retry first**: 3 retries with 3s/5s/10s delays
2. **Then fallback**: Use next provider in hierarchy
3. **Track failures**: Log which providers failed and why
4. **After all fallbacks**: Emit low-confidence caveat with gap description

## Provider Fallback Trees

### Documentation Retrieval: Context7

```
Context7 query
├── Success → Use result
├── Failure (retry 1) → Wait 3s, retry
├── Failure (retry 2) → Wait 5s, retry
├── Failure (retry 3) → Wait 10s, retry
└── Failure (all retries) → FALLBACK
    ├── DeepWiki (if repo has wiki)
    │   ├── Success → Use result, note "via DeepWiki (Context7 unavailable)"
    │   └── Failure → FALLBACK
    │       └── Tavily (web docs)
    │           ├── Success → Use result, note "via Tavily (Context7+DeepWiki unavailable)"
    │           └── Failure → LOW-CONFIDENCE: "Documentation retrieval failed"
    └── Tavily (if no DeepWiki applicable)
        └── [same as above]
```

### Code Analysis: Repomix

```
Repomix query
├── Success → Use result
├── Failure (retry 1-3) → Retry with delays
└── Failure (all retries) → FALLBACK
    ├── Grep (Vercel) (code search)
    │   ├── Success → Use result, note "via Grep (Repomix unavailable)"
    │   └── Failure → FALLBACK
    │       └── Tavily (web code search)
    │           ├── Success → Use result, note "via Tavily code search"
    │           └── Failure → LOW-CONFIDENCE: "Code analysis failed"
    └── Tavily (if Grep not configured)
        └── [same as above]
```

### Web Search: Tavily

```
Tavily query
├── Success → Use result
├── Failure (retry 1-3) → Retry with delays
└── Failure (all retries) → FALLBACK
    ├── Exa
    │   ├── Success → Use result, note "via Exa (Tavily unavailable)"
    │   └── Failure → FALLBACK
    │       └── Brave Search
    │           ├── Success → Use result, note "via Brave (Tavily+Exa unavailable)"
    │           └── Failure → LOW-CONFIDENCE: "Web search failed"
    └── Brave Search (if Exa not configured)
        └── [same as above]
```

### Code Search: Exa

```
Exa query
├── Success → Use result
├── Failure (retry 1-3) → Retry with delays
└── Failure (all retries) → FALLBACK
    ├── Tavily (general search)
    │   ├── Success → Use result, note "via Tavily (Exa unavailable)"
    │   └── Failure → FALLBACK
    │       └── Brave Search
    │           ├── Success → Use result
    │           └── Failure → LOW-CONFIDENCE: "Code search failed"
    └── Brave Search (if Tavily not configured)
        └── [same as above]
```

### Repository Analysis: DeepWiki

```
DeepWiki query
├── Success → Use result
├── Failure (retry 1-3) → Retry with delays
└── Failure (all retries) → FALLBACK
    ├── Repomix (direct code analysis)
    │   ├── Success → Use result, note "via Repomix (DeepWiki unavailable)"
    │   └── Failure → FALLBACK
    │       └── Grep (Vercel) (targeted search)
    │           ├── Success → Use result
    │           └── Failure → LOW-CONFIDENCE: "Repository analysis failed"
    └── Grep (if Repomix failed too)
        └── [same as above]
```

## Composite Failure Scenarios

### All Documentation Sources Down

```
Context7 fails → DeepWiki fails → Tavily fails
Action: Use Repomix to read code directly. Infer behavior from implementation.
Confidence: partial (code is truth but lacks official explanation)
```

### All Web Search Down

```
Tavily fails → Exa fails → Brave fails
Action: Proceed with code analysis (Repomix) and docs (Context7) only.
Confidence: partial (missing external corroboration)
```

### All MCP Down

```
Every provider fails
Action: Use fetcher tools for manual web access. Read local files directly.
Confidence: low (limited sources, no MCP extraction benefits)
```

## Failure Tracking Template

```markdown
## Provider Failure Log

| Provider | Query | Error | Retries | Fallback Used | Fallback Result |
|---|---|---|---|---|---|
| Context7 | "React hooks" | timeout | 3 | DeepWiki | success |
| Repomix | "owner/repo" | 404 | 3 | Grep | success |
```

## Confidence Impact of Fallbacks

| Scenario | Confidence Impact |
|---|---|
| Primary provider succeeds | No impact |
| Fallback provider succeeds | Downgrade 1 level (full→partial) |
| 2+ fallbacks needed | Downgrade to partial minimum |
| All providers fail | Downgrade to low |
| Fallback from code→web | Note "web source, not code-verified" |

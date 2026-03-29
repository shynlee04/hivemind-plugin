# MCP Tool Selection Matrix

## Articulation

Extended guide for selecting the right MCP tool for each research need during ideation. Covers usage patterns, rate limits, fallbacks, and error recovery.

## Full Selection Matrix

| Need | Primary Tool | When to Use | Rate Limit | Fallback |
|------|-------------|-------------|-----------|----------|
| High-quality web content | Exa | Blog posts, documentation, detailed articles | Sequential with other web tools | Tavily, then Brave |
| Current web information | Tavily | News, current events, specific facts | Sequential with other web tools | Brave, then Exa |
| General web search | Brave | Broad search, news, video, local | Sequential with other web tools | Tavily, then Exa |
| Library documentation | Context7 | Version-specific API patterns | resolve-library-id first, max 3/query | Exa for docs |
| Repository Q&A | DeepWiki | Architecture questions about repos | Anytime | Repomix |
| Full repo analysis | Repomix | Need complete codebase view | After identifying target | GitHub MCP file-by-file |
| Code pattern search | GitHub MCP | Find implementations, patterns | Anytime | Brave with `site:github.com` |

## Context7 Usage Guide

### Step 1: Resolve Library ID

Always call `resolve-library-id` before `query-docs`:

```
Query: "React hooks patterns"
→ Returns: library IDs like `/facebook/react`
```

### Step 2: Query Documentation

Use the resolved library ID:

```
Library ID: /facebook/react
Query: "useEffect cleanup patterns"
```

### Limits

- Max 3 calls per question
- If `resolve-library-id` returns no match → try a different query
- If `query-docs` returns irrelevant results → refine the query

### Error Recovery

| Error | Recovery |
|-------|----------|
| No library found | Try alternate names (e.g., "next.js" → "nextjs") |
| Rate limited | Wait and retry, or fall back to Exa docs search |
| Irrelevant results | Refine query with more specific terms |

## DeepWiki Usage Guide

### Format

Repository name in `owner/repo` format:

```
facebook/react
vercel/next.js
opencode-ai/opencode
```

### Question Framing

Good questions:
- "How does the plugin system work?"
- "What is the data flow for tool execution?"
- "How are hooks registered and called?"

Bad questions:
- "Tell me about React" (too broad)
- "Is it good?" (subjective)
- "What's new?" (use web search instead)

### Error Recovery

| Error | Recovery |
|-------|----------|
| Repo not found | Check spelling, try alternative names |
| No relevant content | Rephrase question with specific technical terms |
| Timeout | Retry once, then use Repomix |

## Repomix Usage Guide

### Local vs Remote

| Mode | When | Command |
|------|------|---------|
| Local | Analyzing current project | `pack_codebase` with directory path |
| Remote | Analyzing external repo | `pack_remote_repository` with GitHub URL |

### Compress Option

- Use `compress: true` for repos >100 files to reduce token usage by ~70%
- Keep uncompressed for small repos where implementation details matter

### Error Recovery

| Error | Recovery |
|-------|----------|
| Directory not found | Verify path exists |
| Remote clone fails | Check URL, try again with different branch |
| Output too large | Enable compress, or use includePatterns |

## GitHub MCP Usage Guide

### Code Search Syntax

```
q: "tool.schema" language:typescript
q: "useEffect cleanup" repo:facebook/react
q: "export default tool" path:src/tools
```

### Error Recovery

| Error | Recovery |
|-------|----------|
| No results | Broaden search terms |
| Rate limited | Wait and retry |
| Invalid syntax | Check GitHub search documentation |

## Exa / Tavily / Brave Query Tips

### Exa

- Use natural language descriptions: "blog post comparing React and Vue performance"
- NOT just keywords: "React vs Vue"
- Use `numResults: 8` for broad, `numResults: 3` for focused
- Use `freshness` for recent content

### Tavily

- Use `search_depth: advanced` for thorough research
- Use `search_depth: basic` for quick lookups
- Use `include_domains` for targeting specific sites
- Use `topic: general` (default)

### Brave

- Use `freshness: pm` for last month's results
- Use `count: 10` for broad, `count: 5` for focused
- Use `search_lang` for non-English content
- Use `result_filter: ["web", "news"]` to combine result types

## Error Recovery Summary

| Tool | On Failure | Retry | Escalate |
|------|-----------|-------|----------|
| Exa | Try Tavily | 1 retry | Brave → mark incomplete |
| Tavily | Try Brave | 1 retry | Exa → mark incomplete |
| Brave | Try Tavily | 1 retry | Exa → mark incomplete |
| Context7 | Try alternate name | 1 retry | Exa docs search |
| DeepWiki | Rephrase question | 1 retry | Repomix local analysis |
| Repomix | Check path/URL | 1 retry | GitHub MCP file-by-file |
| GitHub MCP | Broaden search | 1 retry | Brave with site: filter |

## Metrics

| Metric | Target |
|--------|--------|
| Tool selection accuracy | ≥90% first-choice correct |
| Fallback usage | ≤20% of queries need fallback |
| Rate limit violations | 0 |

## Conditions

- **Use when:** Any Phase 3 research activity
- **Do NOT use when:** Lightweight scope with no external evidence needs

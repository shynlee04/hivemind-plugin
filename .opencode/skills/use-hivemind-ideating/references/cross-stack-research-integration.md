# Cross-Stack Research Integration

## Articulation

Cross-stack research gathers external evidence to validate or challenge ideation approaches. It chains MCP tools in a structured pipeline, respecting rate limits and ensuring evidence triangulation.

## Tool-by-Tool Protocol

### Exa (Web Discovery)

| Aspect | Rule |
|--------|------|
| When | Need high-quality web content, blog posts, documentation |
| Rate | Sequential — never parallel with Tavily or Brave |
| Max results | 8 per query |
| Query tips | Use natural language descriptions, not keywords |
| Fallback | If Exa fails → try Tavily, then Brave |

```bash
# Check readiness
node scripts/check-research-readiness.mjs
```

### Tavily (Web Search + Extract)

| Aspect | Rule |
|--------|------|
| When | Need current web information, URL extraction |
| Rate | Sequential — never parallel with Exa or Brave |
| Max results | 5 per query (basic), 10 (advanced) |
| Search depth | `basic` for quick, `advanced` for thorough |
| Fallback | If Tavily fails → try Brave, then Exa |

### Brave Search

| Aspect | Rule |
|--------|------|
| When | General web search, news, video, local |
| Rate | Sequential — never parallel with Exa or Tavily |
| Max results | 10 per query |
| Freshness filters | `pd` (24h), `pw` (7d), `pm` (31d), `py` (1y) |
| Fallback | If Brave fails → try Tavily, then Exa |

### Context7 (Library Documentation)

| Aspect | Rule |
|--------|------|
| When | Need version-specific API docs, library patterns |
| Prerequisite | Must call `resolve-library-id` before `query-docs` |
| Max calls | 3 per question |
| Library ID format | `/org/project` or `/org/project/version` |
| Fallback | If Context7 fails → use Exa/Tavily to find docs |

```bash
# Context7 workflow
# 1. Resolve library ID
# 2. Query docs (max 3 times)
# 3. Extract relevant patterns
```

### DeepWiki (Repository Q&A)

| Aspect | Rule |
|--------|------|
| When | Architecture questions about specific repos |
| Format | `owner/repo` (e.g., `facebook/react`) |
| When NOT | For trivial questions answerable by reading README |
| Fallback | If DeepWiki fails → use Repomix to pack and analyze |

### Repomix (Repo Packaging)

| Aspect | Rule |
|--------|------|
| When | Need full repo analysis for architecture decisions |
| Modes | Local directory or remote GitHub repo |
| Compress | Use `compress: true` for large repos to reduce tokens |
| Fallback | If Repomix fails → use GitHub MCP for file-by-file reading |

### GitHub MCP (Code Search)

| Aspect | Rule |
|--------|------|
| When | Need to find code patterns, reference implementations |
| Syntax | Standard GitHub search syntax |
| Fallback | If GitHub MCP fails → use Brave search with `site:github.com` |

## Rate Limiting Rules

**CRITICAL:** Exa, Tavily, and Brave are web search tools. NEVER run them in parallel.

```
CORRECT:
  Exa query 1 → wait → Exa query 2 → wait → Tavily query 1

WRONG:
  Exa query 1 ┐
  Tavily query 1 ┤ (parallel — rate limit violation)
  Brave query 1 ┘
```

Other tools (Context7, DeepWiki, Repomix, GitHub MCP) can run in parallel with each other and with the current web search tool.

## Research Mode Selection

| Mode | When | Sources | Minimum Evidence Items |
|------|------|---------|----------------------|
| Quick | Lightweight scope, single library | Context7 or 1 web search | 1 |
| Standard | Standard scope, known stack | Context7 + 1 web source | 2 |
| Deep | Deep scope, cross-stack | Full MCP chain | 3 |
| UltraDeep | Novel territory, no prior art | Full chain + Repomix + DeepWiki | 5 |

## Evidence Triangulation

Every claim that influences a decision must have ≥2 independent sources.

| Source Count | Trust Level | Label |
|-------------|-------------|-------|
| ≥3 sources, ≥2 high-authority | High | "Verified" |
| 2 sources | Medium | "Supported" |
| 1 source | Low | "Unverified" |
| 0 sources | None | "Assertion" |

## Decision Tree: Which Tool When

```
Need external evidence?
  → Is it about a specific library?
    → YES: Context7 (resolve-library-id → query-docs)
    → NO: Is it about a specific repo?
      → YES: DeepWiki → Repomix (if deep analysis needed)
      → NO: Is it a general web question?
        → YES: Exa → Tavily → Brave (sequential, first success)
        → NO: GitHub MCP for code patterns
```

## Source Credibility Scoring

From `hivemind-synthesis`:

| Source Type | Authority Level | Freshness Weight |
|-------------|----------------|-----------------|
| Official documentation | Level 1 | High |
| Source code | Level 1 | Current |
| Established tech blog | Level 2 | Medium |
| Community forum | Level 3 | Low |
| Uncited web content | Level 4 | Very Low |

## Commands

```bash
# Check research readiness
node scripts/check-research-readiness.mjs

# Validate research artifact
bash ../use-hivemind-delegation/scripts/hm-artifact-validate.sh \
  .hivemind/activity/ideating/{session-id}/evidence-package.json
```

## Coordination

| Tool | Integration Point |
|------|-------------------|
| `use-hivemind-research` | Full research pipeline for complex queries |
| `hivemind-synthesis` | Multi-source compression and grading |
| MCP tools | Direct invocation during Phase 3 |

## Metrics

| Metric | Target |
|--------|--------|
| Evidence items per claim | ≥2 for decisions |
| Source diversity | ≥2 different source types |
| Research completion rate | ≥90% within mode limits |

## Conditions

- **Use when:** Standard or Deep scope where external evidence is needed
- **Do NOT use when:** Lightweight scope with known solutions, or trivial changes

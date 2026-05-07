# Tool Selection Matrix

## Overview

Subagents in Waves 1-3 need the right tools for their tasks. This reference provides detailed tool comparison, latency expectations, and quality tradeoffs for each extraction category.

## URL Extraction Tools

### Primary: `tavily_extract`

| Dimension | Rating |
|-----------|--------|
| Speed | Fast (2-5s per URL) |
| Quality | High for articles, docs, blog posts |
| Batch | Up to 20 URLs per call |
| Blocking | Handles most paywalls |
| Best for | General web content, documentation, articles |

**When to use:** First tool for any URL list. Batch all URLs into a single call when possible.

**Limitations:** May return partial content for SPAs. No JavaScript execution.

### Fallback: `brave_web_search` → `fetcher_fetch_url`

| Dimension | Rating |
|-----------|--------|
| Speed | Medium (5-10s per URL, search + fetch) |
| Quality | High, includes JavaScript rendering |
| Batch | One URL at a time |
| Blocking | Better for SPAs and dynamic content |
| Best for | Content behind JavaScript, interactive pages |

**When to use:** tavily_extract returns empty/partial results. Pages that need JavaScript rendering.

### Deep: `tavily_research`

| Dimension | Rating |
|-----------|--------|
| Speed | Slow (30-60s per topic) |
| Quality | Very high, multi-source synthesis |
| Batch | One topic per call |
| Blocking | Aggregates from multiple sources |
| Best for | Complex topics needing multiple perspectives |

**When to use:** A URL represents a complex topic that needs cross-referencing from multiple sources. When single-URL extraction is insufficient.

## Library Documentation Tools

### Primary: `context7_resolve-library-id` → `context7_query-docs`

| Dimension | Rating |
|-----------|--------|
| Speed | Fast (3-8s for resolve + query) |
| Quality | High, documentation-specific |
| Batch | One library per resolve, multiple queries |
| Coverage | Major libraries well-covered |
| Best for | npm packages, frameworks, APIs |

**Workflow:**
1. Call `context7_resolve-library-id` with library name → get library ID
2. Call `context7_query-docs` with library ID + specific question → get documentation chunks
3. Synthesize chunks into coherent answer

**When to use:** User's URLs reference specific library documentation (React, Express, Stripe SDK, etc.)

### Fallback: `deepwiki_ask_question`

| Dimension | Rating |
|-----------|--------|
| Speed | Medium (10-20s per question) |
| Quality | High, repo-aware |
| Coverage | Any public GitHub repo |
| Best for | GitHub repositories, open-source projects |

**When to use:** Context7 doesn't cover the library. The URL is a GitHub repository. Need repo-specific architecture understanding.

## Codebase Analysis Tools

### `repomix_pack_remote_repository`

| Dimension | Rating |
|-----------|--------|
| Speed | Slow (30-120s depending on repo size) |
| Quality | Complete codebase snapshot |
| Output | Single packed file |
| Best for | Full codebase analysis, architecture understanding |

**When to use:** Need to understand an entire repository's structure and code. Complementary to deepwiki for deep analysis.

**Caution:** Large repos produce very large output files. Always set token budget and use grep_repomix_output for targeted reading.

## Disk File Reading Tools

### `hm-detective` Escalation Protocol

| Level | Trigger | Action | Output |
|-------|---------|--------|--------|
| SKIM | File > 500 lines | Read frontmatter + first 50 + last 50 lines | Structure overview, key terms |
| SCAN | File ≤ 500 lines OR SKIM insufficient | Full file read | Complete content |
| DEEP | SCAN reveals complex patterns | Targeted grep + offset reads | Specific pattern extraction |

**Decision tree:**
```
File exists?
  NO → Flag as file_not_found, continue
  YES → Check line count
    > 500 → SKIM
    ≤ 500 → SCAN
    SKIM insufficient → SCAN
    SCAN reveals patterns → DEEP (targeted)
```

### Direct `Read` Tool

Use for files under 100 lines where hm-detective overhead isn't justified.

## Search and Pattern Tools

### `grep` / `ripgrep`

| Pattern | Use Case |
|---------|----------|
| `https?://[^\s)`"`']+` | URL extraction from text |
| `[a-zA-Z0-9_/.-]+\.(md\|ts\|js\|json\|yaml\|txt)` | File path extraction |
| `[A-Z][a-z]+(?:\s[A-Z][a-z]+)+` | Named entity extraction (heuristic) |
| `\d{4}-\d{2}-\d{2}` | ISO date extraction |
| `(yesterday\|last week\|tomorrow\|in \d+ days)` | Relative date extraction |

### `glob`

Use for discovering related files when file paths are partially specified:
- `**/*.md` — all markdown files
- `src/**/*.ts` — TypeScript source files
- `docs/**/*` — documentation tree

## Cross-Reference Tools

### `hm-synthesis` FOCUSED Tier

| Dimension | Rating |
|-----------|--------|
| Speed | Medium (depends on input size) |
| Quality | High compression with key entity preservation |
| Input | Multiple text sources |
| Output | Compressed synthesis with cross-references |
| Best for | Merging disk file content with URL content |

**When to use:** Wave 2C (Cross-Reference subagent). Both disk files and URLs were processed and connections need to be identified.

### Manual Cross-Reference

When hm-synthesis isn't loaded or available:
1. Extract entity lists from each source separately
2. Find intersection of entity sets
3. Find conflicting claims between sources
4. Find complementary information (unique to each source)

## Tool Selection Decision Matrix

| Input Type | First Tool | Fallback | Deep Analysis |
|-----------|-----------|----------|---------------|
| General URL | `tavily_extract` | `fetcher_fetch_url` | `tavily_research` |
| Library docs URL | `context7` pair | `deepwiki_ask_question` | Manual docs reading |
| GitHub repo URL | `deepwiki_ask_question` | `repomix_pack_remote_repository` | Full codebase pack |
| Disk file < 100 lines | `Read` | — | — |
| Disk file 100-500 lines | `Read` full | — | `grep` targeted |
| Disk file > 500 lines | `hm-detective` SKIM | `hm-detective` SCAN | `hm-detective` DEEP |
| Text/narrative input | Parse in prompt | — | `hm-synthesis` FOCUSED |
| Search needed | `brave_web_search` | `tavily_search` | `tavily_research` |

## Quality vs Speed Tradeoffs

### Fast Path (use when time-sensitive)
1. `tavily_extract` for all URLs (batch)
2. `Read` for all disk files < 500 lines
3. `hm-detective` SKIM for files > 500 lines
4. Narrative synthesis in-prompt (no hm-synthesis)

### Thorough Path (default)
1. `tavily_extract` for URLs → `fetcher_fetch_url` for failures
2. `context7` for library URLs → `deepwiki` for repo URLs
3. `hm-detective` SCAN for all disk files
4. `hm-synthesis` FOCUSED for narrative synthesis
5. `hm-synthesis` cross-dep for cross-referencing

### Deep Path (use for critical context)
1. All of Thorough Path, plus:
2. `tavily_research` for complex topics
3. `repomix_pack_remote_repository` for key repos
4. `hm-detective` DEEP for files with complex patterns
5. Multiple `context7_query-docs` calls for library details

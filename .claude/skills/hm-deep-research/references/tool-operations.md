# Tool Operations

Per-tool operational knowledge. Rate limits, parameter ranges, pitfalls, and best practices for every tool available to the research pipeline.

---

## Tavily Search

**Tool name**: `tavily_tavily_search`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| query | string | max 400 chars, 50 words | required | Describe the ideal page, not keywords |
| max_results | number | 1-10 (basic) / 1-20 (advanced) | 5 | Higher = more context consumed |
| search_depth | enum | basic, advanced, fast, ultra-fast | basic | basic=1 credit, advanced=2 credits |
| topic | enum | general | general | Only "general" supported |
| time_range | enum | day, week, month, year, null | null | null = no time filter |
| include_domains | string[] | domain list | [] | Whitelist domains |
| exclude_domains | string[] | domain list | [] | Blacklist domains |
| include_raw_content | boolean | - | false | Returns cleaned HTML — expensive on context |
| include_images | boolean | - | false | Image URLs only, not image data |
| country | string | full country name | "" | "United States", "Japan", etc. |
| start_date | string | YYYY-MM-DD | "" | Results after this date |
| end_date | string | YYYY-MM-DD | "" | Results before this date |

### Best Practices

- Start with `search_depth: "basic"` (1 credit). Escalate to `"advanced"` only when basic misses relevant results.
- Use `include_domains` to target official docs: `["docs.rs", "github.com", "npmjs.com"]`.
- Use `exclude_domains` to remove noise: `["reddit.com", "medium.com"]` when seeking primary sources.
- Set `max_results: 3` for focused lookups. Set `max_results: 10` for broad discovery.
- For current events or recent releases, always set `time_range: "month"` or narrower.
- `include_raw_content: true` is a context budget killer — only use when you need the full page text for extraction. Prefer snippets first.

### Pitfalls

- Query length matters: a 400-char query with 50 words gets better results than "rust websocket batching".
- `search_depth: "fast"` optimizes for latency, not depth. Use for quick existence checks only.
- Rate limit: 20 requests/minute on most plans.

---

## Tavily Extract

**Tool name**: `tavily_tavily_extract`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| urls | string[] | 1-20 URLs | required | Batch up to 20 per call |
| extract_depth | enum | basic, advanced | basic | advanced = JS rendering, slower |
| format | enum | markdown, text | markdown | markdown preserves structure |
| include_images | boolean | - | false | Include image URLs |
| query | string | any | "" | Reranks content chunks by relevance |

### Best Practices

- Always batch URLs: pass all 20 at once rather than calling 20 times.
- Use `extract_depth: "advanced"` for JS-heavy pages (SPAs, docs sites with dynamic content).
- Use `extract_depth: "basic"` for static HTML pages (blogs, GitHub README).
- Set `query` parameter to rerank extracted content toward your research question — reduces noise.
- After extraction, grep for key terms rather than reading entire output.

### Pitfalls

- Some sites block automated extraction. If extract fails, fall back to `fetcher_fetch_url`.
- Advanced extraction is 2-3x slower than basic. Only use when needed.
- Extract output can be large. Check size before consuming in full.

---

## Tavily Crawl

**Tool name**: `tavily_tavily_crawl`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| url | string | valid URL | required | Starting URL |
| max_depth | number | 1-10 | 1 | How far from base URL to explore |
| max_breadth | number | 1-20 | 20 | Links to follow per page |
| limit | number | 1-50 | 50 | Total pages to process |
| select_paths | string[] | regex patterns | [] | Filter URLs by path pattern |
| select_domains | string[] | regex patterns | [] | Restrict to domains |
| allow_external | boolean | - | true | Follow links to other domains |
| instructions | string | natural language | "" | Guide crawler to relevant pages |
| extract_depth | enum | basic, advanced | basic | Advanced for JS-rendered pages |

### Best Practices

- Start with `max_depth: 2, limit: 20` for documentation sites. Adjust up if needed.
- Always set `select_paths` to target relevant sections: `["/docs/.*", "/api/.*"]`.
- Set `allow_external: false` to prevent crawling off-site.
- Use `instructions` to guide the crawler: "Focus on API reference pages and migration guides."
- For large doc sites, crawl in multiple targeted passes rather than one deep crawl.

### Pitfalls

- `limit: 50` with `max_depth: 10` can consume massive context. Budget carefully.
- Crawl is slow (1-2 min for 50 pages). Start extraction while waiting if possible.
- `select_domains` uses regex, not glob: `^docs\.example\.com$` not `docs.example.com`.

---

## Tavily Map

**Tool name**: `tavily_tavily_map`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| url | string | valid URL | required | Starting URL |
| max_depth | number | 1-10 | 1 | How far to explore |
| max_breadth | number | 1-20 | 20 | Links per page |
| limit | number | 1-50 | 50 | Max URLs to return |
| select_paths | string[] | regex patterns | [] | Filter by path pattern |
| select_domains | string[] | regex patterns | [] | Restrict domains |
| allow_external | boolean | - | true | Include external URLs |
| instructions | string | natural language | "" | Guide URL discovery |

### Best Practices

- Use map BEFORE crawl to understand site structure. Map returns URLs only (fast).
- Set `limit: 50` for a thorough map. Set `limit: 10` for a quick survey.
- Use `select_paths` to find specific sections: `["/api/v[0-9]+/.*"]` for versioned APIs.
- Map is faster than crawl. When you need to "find where X is documented", map first.

### Pitfalls

- Map does NOT extract content. It only returns URL lists.
- Some sites with heavy JS navigation may not be fully mapped.

---

## Tavily Research

**Tool name**: `tavily_tavily_research`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| input | string | any length | required | NOT "query" — use "input" |
| model | enum | mini, pro, auto | auto | mini=narrow, pro=broad, auto=picks |
| max_tokens | number | - | - | Not configurable in tool call |

### Best Practices

- Use `model: "mini"` for narrow, focused questions. Use `model: "pro"` for broad, multi-topic research.
- The `input` field accepts multi-paragraph descriptions with context. Include background, constraints, and what you need.
- Research takes 30-120 seconds. Do NOT retry — it's working.
- Rate limit: 20 requests/minute.

### Pitfalls

- The parameter is `input`, not `query`. Using `query` will fail silently or error.
- Research output can be very large (50KB+). Budget context before calling.
- Not suitable for simple fact lookups — use `tavily-search` for those.

---

## Brave Web Search

**Tool name**: `brave-search_brave_web_search`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| query | string | max 400 chars, 50 words | required | Search query |
| count | number | 1-20 | 10 | Number of results |
| offset | number | 0-9 | 0 | Pagination offset |
| freshness | enum | pd, pw, pm, py, YYYY-MM-DDtoYYYY-MM-DD | null | pd=24h, pw=7d, pm=31d, py=365d |
| country | string | 2-char code | US | US, GB, DE, JP, etc. |
| search_lang | string | language code | en | en, jp, de, fr, etc. |
| extra_snippets | boolean | - | false | 5 additional excerpts per result |
| safesearch | enum | off, moderate, strict | moderate | Content filtering |
| summary | boolean | - | false | Enable summarizer key generation |

### Best Practices

- Set `freshness: "pm"` for anything related to current technology. Default (null) returns stale results.
- Set `extra_snippets: true` when you need more context per result without full extraction.
- Use `count: 5` for focused lookups. `count: 20` for broad surveys.
- For non-English documentation, set `search_lang` appropriately.
- After search, use `brave-search_brave_summarizer` with the returned key for AI-generated summaries.

### Pitfalls

- `offset` max is 9. To get more results, refine query rather than paginating.
- `extra_snippets` is only available on paid plans.
- Brave results may differ from Tavily. Use Brave as a secondary source for cross-validation.

---

## Brave News Search

**Tool name**: `brave-search_brave_news_search`

| Parameter | Type | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| query | string | max 400 chars | required | News search query |
| count | number | 1-50 | 20 | Number of results |
| freshness | enum | pd, pw, pm, py, YYYY-MM-DDtoYYYY-MM-DD | pd | Default: last 24 hours |
| country | string | 2-char code | US | Country filter |
| search_lang | string | language code | en | Language filter |
| extra_snippets | boolean | - | false | Additional excerpts |

### Best Practices

- Default `freshness: "pd"` only returns last 24 hours. For weekly roundups, set `"pw"`.
- Use for: release announcements, CVE disclosures, breaking changes, industry trends.
- Pair with `tavily-search` for comprehensive coverage: Brave for news, Tavily for depth.

---

## Context7

**Tools**: `context7_resolve-library-id`, `context7_query-docs`

### resolve-library-id

| Parameter | Type | Notes |
|-----------|------|-------|
| libraryName | string | Package name: "react", "express", "@opencode-ai/plugin" |
| query | string | What you need help with — used for ranking |

### query-docs

| Parameter | Type | Notes |
|-----------|------|-------|
| libraryId | string | From resolve step: "/facebook/react", "/vercel/next.js" |
| query | string | Specific question — "How to set up JWT auth in Express" |

### Best Practices

- ALWAYS call `resolve-library-id` first. You cannot guess the library ID.
- After resolving, call `query-docs` max 3 times per question. No retries on same query.
- Make queries specific: "How to configure middleware in Express.js" not "express".
- Library ID format: `/org/project` or `/org/project/version` for specific versions.
- When comparing libraries, resolve each one separately, then query each in parallel.

### Pitfalls

- Calling `query-docs` without resolving first will fail.
- 3 queries per question is a hard limit. Plan your questions before calling.
- Some niche libraries may not be indexed. Fall back to DeepWiki or tavily-search.

---

## DeepWiki

**Tools**: `deepwiki_ask_question`, `deepwiki_read_wiki_structure`, `deepwiki_read_wiki_contents`

| Tool | Parameters | Notes |
|------|-----------|-------|
| ask_question | repoName, question | Up to 10 repos at once |
| read_wiki_structure | repoName | Returns topic list |
| read_wiki_contents | repoName | Full wiki content |

### Best Practices

- `ask_question` accepts an array of repos. Use this for cross-repo comparison: `["facebook/react", "vuejs/core"]`.
- Start with `read_wiki_structure` to understand what's documented before asking specific questions.
- Use `ask_question` for architecture questions: "How does the plugin system work?"
- DeepWiki is best for: architecture understanding, design rationale, module relationships.

### Pitfalls

- DeepWiki knowledge may be outdated (generated from repo at a point in time).
- Not all repos have complete wiki coverage. Check structure first.
- Falls back to general knowledge for less-documented repos.

---

## Repomix

**Tools**: `repomix_pack_codebase`, `repomix_pack_remote_repository`, `repomix_grep_repomix_output`, `repomix_read_repomix_output`, `repomix_attach_packed_output`

| Tool | Key Parameters | Notes |
|------|---------------|-------|
| pack_codebase | directory, compress, includePatterns, ignorePatterns | Pack local dir |
| pack_remote_repository | remote, compress, includePatterns | Clone + pack remote |
| grep_repomix_output | outputId, pattern, contextLines | Search packed output |
| read_repomix_output | outputId, startLine, endLine | Read packed output |

### Best Practices

- ALWAYS use `compress: true` for 70% token reduction. Only skip when you need full implementation details.
- ALWAYS set `includePatterns` to target relevant files: `"src/**/*.ts"`, `"**/*.{js,ts}"`.
- ALWAYS `grep` before `read`. Find the relevant sections, then read targeted line ranges.
- Use `pack_remote_repository` for investigating external repos without cloning.
- For large codebases, pack in layers: first broad (structure), then narrow (specific modules).

### Pitfalls

- Uncompressed packs of large repos can exceed 500KB. Always compress.
- `repomix_read_repomix_output` without `startLine`/`endLine` reads everything — context killer.
- Remote repository packing requires network access and takes 30-60s for large repos.

---

## Fetcher

**Tools**: `fetcher_fetch_url`, `fetcher_fetch_urls`

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| url/urls | string/string[] | required | Single or batch |
| extractContent | boolean | true | Main content extraction |
| maxLength | number | no limit | Max chars to return |
| returnHtml | boolean | false | Return HTML not markdown |
| waitForNavigation | boolean | false | Wait for JS redirects |
| disableMedia | boolean | true | Skip images/styles/fonts |

### Best Practices

- Use `fetcher` when `tavily-extract` fails (blocked sites, JS-heavy pages).
- Set `maxLength` to prevent context overflow: `maxLength: 10000` for quick checks.
- Set `waitForNavigation: true` for pages with JS redirects or anti-bot checks.
- Batch URLs with `fetcher_fetch_urls` for efficiency.

### Pitfalls

- Some sites require browser rendering. If fetcher returns empty, try with `waitForNavigation: true`.
- No built-in grep. Extract then grep the result separately.

---

## OpenCode Built-in Tools

### grep

| Parameter | Notes |
|-----------|-------|
| pattern | Regex pattern |
| include | File pattern: "*.ts", "*.{js,ts}" |
| path | Directory to search |

- Results sorted by modification time (newest first).
- Use `include` to narrow: `include: "*.ts"` for TypeScript only.

### read

| Parameter | Notes |
|-----------|-------|
| filePath | Absolute path |
| offset | Start line (1-indexed) |
| limit | Max lines (default 2000) |

- 50KB cap per read. Use offset + limit for large files.
- Default returns up to 2000 lines from start.
- Lines longer than 2000 chars are truncated.

### glob

| Parameter | Notes |
|-----------|-------|
| pattern | Glob pattern: "**/*.ts", "src/**/*.test.ts" |
| path | Directory to search |

- Returns matching file paths sorted by modification time.

### Bash (rg — ripgrep)

When built-in grep isn't enough, use `rg` via Bash for:
- Count matches: `rg -c "pattern" path/`
- Context lines: `rg -C 3 "pattern" path/`
- File-only: `rg -l "pattern" path/`
- Invert: `rg -v "pattern" path/`

---

## Subagent Task Tool

**Key constraints for research delegation:**

- Subagents start FRESH — no inherited conversation context.
- `task` and `todowrite` tools are DISABLED by default in subagents.
- Use `task_id` parameter to resume a previous subagent.
- Context window: typically 200,000 tokens, effective limit ~180,000.

### Prompt Envelope Rules

1. Every subagent prompt must be self-contained (no references to "the conversation above").
2. Include file paths, not file contents — agents read from disk.
3. Specify output file path where the agent should write findings.
4. Keep prompts under 200 lines — subagents have their own context limits.

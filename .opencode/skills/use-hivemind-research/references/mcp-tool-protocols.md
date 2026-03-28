# MCP Tool Protocols

Executable reference for research-oriented MCP usage. Prefer exact tool IDs over server names. Treat rate-limited providers as sequential resources, not parallel fan-out targets.

## Tool Selection Order

1. Use `context7_resolve-library-id` → `context7_query-docs` for version-specific library docs.
2. Use `deepwiki_ask_question` for public repository understanding when Deepwiki covers the repo.
3. Use `tavily_tavily_search` → `tavily_tavily_extract` for broad web evidence with extractable content.
4. Use `exa_web_search_exa` → `exa_crawling_exa` for semantic discovery and code-adjacent search.
5. Use `brave-search_brave_web_search` for fresh web coverage and real-time fallbacks.
6. Use `repomix_pack_codebase` → `repomix_grep_repomix_output` for local code truth.

## Context7

### Primary Chain

`context7_resolve-library-id(query: string, libraryName: string)` → `context7_query-docs(libraryId: string, query: string)`

### Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `context7_resolve-library-id` | `query` | string | Yes | Task phrasing used to rank candidate libraries |
| `context7_resolve-library-id` | `libraryName` | string | Yes | Plain package or framework name |
| `context7_query-docs` | `libraryId` | string | Yes | Exact Context7 ID such as `/vercel/next.js` |
| `context7_query-docs` | `query` | string | Yes | Specific question; include version/context when known |

### Return Format

| Tool | Returns |
|---|---|
| `context7_resolve-library-id` | Ranked library matches with IDs, reputation, snippet counts, versions |
| `context7_query-docs` | Documentation chunks, examples, and contextual excerpts |

### Use When

- Library/version behavior matters more than general web opinion
- API names may have changed across versions
- Migration guidance or code examples must match a concrete dependency

### Rate Limit

- Free tier is treated as **60 requests/hour** and ~1,000 requests/month
- Batch library resolution early; reuse resolved `libraryId` values for the whole packet

### Fallback Chain

1. `tavily_tavily_skill`
2. `deepwiki_ask_question` on the upstream repo
3. Official docs via `webfetch`

### Common Errors

- Wrong `libraryId` selected from ambiguous search results
- Query too broad (`"auth"`) instead of task-specific (`"server actions authentication"`)
- Free-tier throttling after repeated retries

---

## Deepwiki

### Primary Chain

`deepwiki_ask_question(repoName: string | string[], question: string)`

### Supporting Tools

- `deepwiki_read_wiki_structure(repoName: string)`
- `deepwiki_read_wiki_contents(repoName: string)`

### Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `deepwiki_ask_question` | `repoName` | string \| string[] | Yes | `owner/repo` or list of repos |
| `deepwiki_ask_question` | `question` | string | Yes | Natural-language repo question |

### Return Format

- Markdown answer grounded in repo-aware documentation and indexed code summaries
- Repository structure or topic listing for the structure/content tools

### Use When

- Public GitHub repository is the unit of analysis
- Need fast repository understanding before cloning or packing
- Need a "how does this repo do X?" answer without local setup

### Rate Limit

- Treated as **unlimited free** for public research packets
- Still sequence requests to preserve coherent evidence capture

### Fallback Chain

1. `repomix_pack_remote_repository`
2. `gitmcp_search_github_com_code`
3. `webfetch` against repo docs/README URLs

### Common Errors

- Repo not indexed or repo name misspelled
- Questions too broad (`"Explain repo"`) instead of path/feature oriented
- Treating Deepwiki summaries as code truth without a code-grounded follow-up

---

## Tavily

### Primary Chain

`tavily_tavily_search(query: string, max_results?: number, search_depth?: "basic" | "advanced" | "fast" | "ultra-fast")`
→ `tavily_tavily_extract(urls: string[], extract_depth?: "basic" | "advanced", format?: "markdown" | "text")`

### Key Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `tavily_tavily_search` | `query` | string | Yes | Primary search question |
| `tavily_tavily_search` | `max_results` | integer | No | Default small; 5-10 is typical |
| `tavily_tavily_search` | `search_depth` | enum | No | Use `advanced` when evidence quality matters |
| `tavily_tavily_search` | `topic` | string | No | Use `general` unless domain-specific support matters |
| `tavily_tavily_extract` | `urls` | string[] | Yes | Extract full content from chosen results |
| `tavily_tavily_extract` | `extract_depth` | enum | No | Use `advanced` for tables/embedded content |

### Return Format

| Tool | Returns |
|---|---|
| `tavily_tavily_search` | Search result list with snippets, URLs, sometimes raw content |
| `tavily_tavily_extract` | Parsed markdown/text from the supplied URLs |

### Use When

- Need a credible set of web sources quickly
- Need extraction in the same research pass
- Need freshness controls or multi-domain breadth

### Rate Limit

- Free tier treated as **1,000 credits/month**
- Search is cheap; deep research and large extract batches burn credits quickly

### Fallback Chain

1. `exa_web_search_exa`
2. `brave-search_brave_web_search`
3. `google_search`

### Common Errors

- Using `advanced` search when `basic` is sufficient and burning credits
- Extracting every URL instead of only shortlisted evidence
- Ignoring duplicate domains, which inflates source count without improving diversity

---

## Exa

### Primary Chain

`exa_web_search_exa(query: string, numResults?: number, type?: "auto" | "fast", freshness?: "24h" | "week" | "month" | "year" | "any")`
→ `exa_crawling_exa(urls: string[], maxCharacters?: number, maxAgeHours?: number, subpages?: number, subpageTarget?: string)`

### Key Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `exa_web_search_exa` | `query` | string | Yes | Natural-language semantic query |
| `exa_web_search_exa` | `numResults` | integer | No | 5-8 is usually enough |
| `exa_web_search_exa` | `freshness` | enum | No | Use for recent ecosystem shifts |
| `exa_crawling_exa` | `urls` | string[] | Yes | One or more shortlisted URLs |
| `exa_crawling_exa` | `subpages` | integer | No | Use only when a docs hub needs expansion |
| `exa_crawling_exa` | `subpageTarget` | string | No | Bias subpage choice toward a missing topic |

### Return Format

- Ranked semantic search results with highlights
- Clean content extraction for selected pages and optional subpages

### Use When

- Query language is fuzzy or conceptual
- Need semantic discovery rather than exact keyword match
- Need code-adjacent or documentation-adjacent content beyond a single domain

### Rate Limit

- Treat search as **10 QPS** and content extraction as high-throughput but still budgeted

### Fallback Chain

1. `brave-search_brave_web_search`
2. `google_search`
3. `tavily_tavily_search` when extraction is the real need

### Common Errors

- Writing keyword-only queries instead of describing the ideal page
- Crawling too many URLs before triaging relevance
- Using Exa for live-news needs better handled by Brave or Google

---

## Brave

### Primary Chain

`brave-search_brave_web_search(query: string, count?: integer, freshness?: string)`

### Optional Specialty Tools

- `brave-search_brave_news_search`
- `brave-search_brave_local_search`
- `brave-search_brave_summarizer`

### Key Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `brave-search_brave_web_search` | `query` | string | Yes | Exact or news-oriented query |
| `brave-search_brave_web_search` | `count` | integer | No | Keep small to avoid noisy coverage |
| `brave-search_brave_web_search` | `freshness` | string | No | Use `pd`, `pw`, `pm`, or date ranges |

### Return Format

- Structured web results with title, description, URL, and optional extra result groups

### Use When

- Need fresh web state, news, or mainstream coverage
- Need a cheap fallback after Exa/Tavily
- Need keyword-exact rather than semantic-heavy retrieval

### Rate Limit

- Search plan treated as **50 QPS**

### Fallback Chain

1. `google_search`
2. `fetch_fetch` or `webfetch` against known URLs

### Common Errors

- Using Brave instead of Exa for meaning-based discovery
- Forgetting `freshness` on time-sensitive topics
- Counting snippets as evidence without extracting the underlying page

---

## Repomix

### Local Chain

`repomix_pack_codebase(directory: string, compress?: boolean, includePatterns?: string, ignorePatterns?: string, style?: "xml" | "markdown" | "json" | "plain")`
→ `repomix_grep_repomix_output(outputId: string, pattern: string, contextLines?: number)`

### Remote Chain

`repomix_pack_remote_repository(remote: string, compress?: boolean, includePatterns?: string, ignorePatterns?: string, style?: "xml" | "markdown" | "json" | "plain")`
→ `repomix_grep_repomix_output(outputId: string, pattern: string, contextLines?: number)`

### Key Parameters

| Tool | Parameter | Type | Required | Notes |
|---|---|---|---|---|
| `repomix_pack_codebase` | `directory` | string | Yes | Absolute local path |
| `repomix_pack_remote_repository` | `remote` | string | Yes | `owner/repo` or GitHub URL |
| `repomix_pack_*` | `compress` | boolean | No | Use for very large repos |
| `repomix_pack_*` | `includePatterns` | string | No | Scope to target folders/files |
| `repomix_grep_repomix_output` | `outputId` | string | Yes | ID from the pack step |
| `repomix_grep_repomix_output` | `pattern` | string | Yes | JavaScript RegExp syntax |

### Return Format

- Pack step returns an `outputId` plus metrics and tree summary
- Grep step returns matching lines with optional context

### Use When

- Local codebase is the source of truth
- Need whole-repo reasoning without manual file-by-file scanning
- Need fallback when Deepwiki does not cover a repo

### Rate Limit

- No external provider limit; constrained only by local compute and repository size

### Fallback Chain

1. `deepwiki_ask_question` for indexed public repos
2. Native `glob` + `grep` + `read` for narrow local slices

### Common Errors

- Packing entire monorepos without include patterns
- Forgetting `compress=true` for giant trees
- Treating packed output as fresher than the local working tree after edits

---

## Cross-Server Patterns

### Version-Specific Dependency Question

1. Read dependency version locally (`package.json`, lockfile, or `npm ls --depth=0`)
2. Resolve library: `context7_resolve-library-id`
3. Query docs: `context7_query-docs`
4. If docs are incomplete, use `tavily_tavily_skill` or `deepwiki_ask_question`

### Public Repository Evaluation

1. Ask Deepwiki first: `deepwiki_ask_question`
2. Pack remotely with Repomix only if Deepwiki coverage is weak
3. Use Context7 only after the library or framework identity is confirmed

### Brownfield Error or Migration Trace

1. Inspect local dependencies and imports
2. Search the web with Tavily or Exa for the exact error or migration topic
3. Validate official behavior with Context7
4. Validate local truth with Repomix or native file tools

## Error Escalation Rules

- If Context7 is throttled, stop retry loops after one fallback attempt and switch providers.
- If Deepwiki and Repomix disagree, treat Repomix or local file reads as code truth.
- If Tavily and Exa return the same low-authority domains, pivot query wording before adding more sources.
- If Brave or Google produce only news/blog coverage, escalate to official docs before concluding.

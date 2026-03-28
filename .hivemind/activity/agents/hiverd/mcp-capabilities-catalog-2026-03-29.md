# MCP Server Capabilities Catalog

**Report Date:** 2026-03-29  
**Agent:** hiverd (External Research Specialist)  
**Packet ID:** inv-1b-mcp-capabilities  
**Sources:** Web search research, official documentation, API references

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Servers Cataloged** | 14 |
| **Tools Cataloged** | 60+ |
| **Servers with Rate Limits Documented** | 11 |
| **Servers with Rate Limits Unclear** | 3 |

---

## Per-Tool Capabilities Matrix

### 1. EXA (exa_web_search_exa, exa_crawling_exa, exa_get_code_context_exa)

| Field | Value |
|-------|-------|
| **Tool Names** | `exa_web_search_exa`, `exa_crawling_exa`, `exa_get_code_context_exa` |
| **Server** | Exa AI |
| **Category** | search / extract / code-search |
| **What It Does** | Semantic web search that understands meaning, not just keywords. Returns relevance-ranked documents with optional full-content extraction. |
| **Best For** | AI agents requiring semantic discovery, research dataset curation, code search with context, finding documents by meaning rather than exact keywords |
| **When NOT To Use** | When you need real-time news; when you need precise keyword matching; when cost is the primary concern |
| **Rate Limits** | `/search`: 10 QPS; `/findSimilar`: 10 QPS; `/contents`: 100 QPS; `/answer`: 10 QPS; `/research`: 15 concurrent tasks |
| **Fallback** | Tavily Search, Brave Search |
| **Example Query** | `"explain how Next.js 15 server components work with practical examples"` |
| **Output Quality** | High — semantic relevance scoring, query-dependent highlights, full page text extraction available. Exa Deep provides structured output with field-level citations. |

**Pricing (March 2026):**
- Standard Search (1-10 results): $7 / 1,000 requests
- Additional results beyond 10: +$1 / 1,000 results
- Agentic / Deep Search: $12 / 1,000 requests
- Deep Search with Reasoning: $15 / 1,000 requests
- Contents (full page text): $1 / 1,000 pages
- Answer API: $5 / 1,000 answers
- Free tier: $10 free credits

---

### 2. TAVILY (Multiple Tools)

| Field | Value |
|-------|-------|
| **Tool Names** | `tavily_tavily_search`, `tavily_tavily_extract`, `tavily_tavily_crawl`, `tavily_tavily_map`, `tavily_tavily_research`, `tavily_tavily_skill` |
| **Server** | Tavily AI |
| **Category** | search / extract / crawl / research / skill |
| **What It Does** | AI-focused search API with integrated content extraction, crawling, mapping, and research synthesis. Optimized for RAG pipelines. |
| **Best For** | RAG systems, AI agents needing end-to-end content acquisition, research synthesis, documentation retrieval |
| **When NOT To Use** | High-volume production (cost escalates quickly); when you need semantic/meaning-based search |
| **Rate Limits** | **Search:** Dev: 10 req/10min, Prod: 1,000 req/min; **Crawl:** 100 RPM (both Dev and Prod); **Research:** 20 RPM (both Dev and Prod); **Extract:** Bundled with search credits |
| **Fallback** | Exa (semantic), Brave Search (real-time), Google Search |
| **Example Query** | `"tavily_tavily_search query="OpenAI GPT-5 release date 2026"` |
| **Output Quality** | High — clean markdown extraction, RAG-optimized responses, bundled content in search results |

**Credit System:**
- Free: 1,000 credits/month
- Search (basic): 1 credit; Search (advanced): 2 credits
- Extract: 1 credit per 5 URLs
- Map: 1 credit per 10 pages
- Research: 4-250 credits depending on model and complexity
- Pay-as-you-go: $0.008/credit

---

### 3. BRAVE SEARCH (Multiple Tools)

| Field | Value |
|-------|-------|
| **Tool Names** | `brave-search_brave_web_search`, `brave-search_brave_local_search`, `brave-search_brave_video_search`, `brave-search_brave_image_search`, `brave-search_brave_news_search`, `brave-search_brave_summarizer` |
| **Server** | Brave Search API |
| **Category** | search / local / video / image / news / summarization |
| **What It Does** | Privacy-focused search with LLM Context API for grounding. Returns structured results with snippets optimized for AI consumption. |
| **Best For** | Real-time web search, privacy-sensitive queries, grounding AI responses with fresh web data, local business search |
| **When NOT To Use** | When you need semantic/meaning search (use Exa); when you need deep research synthesis (use Tavily Research) |
| **Rate Limits** | **Search Plan:** 50 QPS, $5/1,000 requests, $5 free credit/month; **Answers Plan:** 2 QPS, $4/1,000 queries + $5/million tokens; **Spellcheck/Autosuggest:** 100 QPS, $5/10,000 requests |
| **Fallback** | Exa (semantic), Tavily (RAG-optimized), Google Search |
| **Example Query** | `"brave-search_brave_web_search query="latest React 19 features 2026"` |
| **Output Quality** | Medium-High — real-time data, clean snippets, LLM Context API provides token-efficient context |

**Important Note (March 2026):** Brave eliminated free tier, replaced with $5/month credit (~1,000 queries). Only independent Western search index after Microsoft killed Bing API.

---

### 4. REPOFIX/REPOFIX-MCP (repomix_pack_codebase, repomix_pack_remote_repository, etc.)

| Field | Value |
|-------|-------|
| **Tool Names** | `repomix_pack_codebase`, `repomix_pack_remote_repository`, `repomix_generate_skill`, `repomix_attach_packed_output`, `repomix_read_repomix_output`, `repomix_grep_repomix_output`, `repomix_file_system_read_file`, `repomix_file_system_read_directory` |
| **Server** | Repomix |
| **Category** | pack / repo-analysis / file-read |
| **What It Does** | Packs repositories into AI-friendly formats (XML, Markdown, JSON, plain text) with security checks, token counting, and code compression. |
| **Best For** | Whole-codebase analysis, code review automation, documentation generation, refactoring large projects with AI |
| **When NOT To Use** | Real-time file monitoring; incremental changes; very large repositories without compression |
| **Rate Limits** | No published rate limits — operates on local/remote file access |
| **Fallback** | Deepwiki (documentation-focused), GitMCP (GitHub-focused), Context7 (library docs) |
| **Example Query** | `repomix_pack_codebase directory="/path/to/project" compress=true style="xml"` |
| **Output Quality** | High — consistent formatting, security validation (detects API keys/passwords), intelligent compression |

**Key Security Features:**
- Detects and flags API keys, passwords, secrets
- Validates absolute paths to prevent directory traversal
- Includes built-in .gitignore support

---

### 5. DEEPWIKI (deepwiki_read_wiki_structure, deepwiki_read_wiki_contents, deepwiki_ask_question)

| Field | Value |
|-------|-------|
| **Tool Names** | `deepwiki_read_wiki_structure`, `deepwiki_read_wiki_contents`, `deepwiki_ask_question` |
| **Server** | Deepwiki |
| **Category** | docs / repo-analysis / Q&A |
| **What It Does** | Provides programmatic access to Deepwiki's documentation and Q&A for GitHub repositories. Turns any indexed repo into a documentation hub. |
| **Best For** | Understanding repository structure, answering questions about codebases, documentation lookup for indexed libraries |
| **When NOT To Use** | Repositories not indexed by Deepwiki; very large codebases (use Repomix); real-time data needs |
| **Rate Limits** | **No authentication required** — completely free with no login. No published rate limits. |
| **Fallback** | Repomix (local code), GitMCP (GitHub integration), Context7 (library docs) |
| **Example Query** | `deepwiki_ask_question repoName="facebook/react" question="How does useTransition work?"` |
| **Output Quality** | High for indexed repos — clean markdown, structured answers, citation-backed responses |

**Installation:** `npx @anthropic/deepwiki-mcp`

---

### 6. CONTEXT7 (context7_resolve-library-id, context7_query-docs)

| Field | Value |
|-------|-------|
| **Tool Names** | `context7_resolve-library-id`, `context7_query-docs` |
| **Server** | Context7 (Upstash) |
| **Category** | docs / library-search |
| **What It Does** | Fetches version-specific library documentation and code examples directly into prompts. Solves AI hallucination problem for library APIs. |
| **Best For** | Getting current library documentation, code examples for specific library versions, fixing hallucinated API suggestions |
| **When NOT To Use** | Libraries not in Context7 database; when offline access is required (consider local-first alternatives) |
| **Rate Limits** | **Without API key:** ~1,000 requests/month (as of January 2026 reduced from ~6,000); **With free API key:** higher limits; **60 requests/hour** reported for free tier |
| **Fallback** | Tavily Skill (documentation search), Deepwiki (repo docs), official library documentation |
| **Example Query** | `context7_query-docs libraryId="/vercel/next.js" query="server actions authentication"` |
| **Output Quality** | High — version-specific, actual working code examples, community-driven library additions |

**Critical Issue (January 2026):** Context7 reduced free tier from ~6,000 to 1,000 requests/month and added 60 requests/hour rate limit. Heavy users report being rate-limited within first week.

---

### 7. GITHUB MCP (gitmcp_fetch_github_com_documentation, gitmcp_search_github_com_code, etc.)

| Field | Value |
|-------|-------|
| **Tool Names** | `gitmcp_fetch_github_com_documentation`, `gitmcp_search_github_com_documentation`, `gitmcp_search_github_com_code`, `gitmcp_fetch_generic_url_content` |
| **Server** | GitMCP |
| **Category** | code-search / docs / repo-access |
| **What It Does** | Transforms any GitHub repository into a documentation hub. Allows AI tools to access code and documentation. |
| **Best For** | Repository code search, documentation retrieval from GitHub, understanding public repo structure |
| **When NOT To Use** | Private repositories (requires authentication setup); large-scale operations (rate limits apply) |
| **Rate Limits** | **No specific MCP rate limits published** — uses underlying GitHub API rate limits (5,000 requests/hour for authenticated users) |
| **Fallback** | GitHub REST API directly, Repomix (local), Deepwiki (if indexed) |
| **Example Query** | `gitmcp_search_github_com_code query="language:typescript react useState"` |
| **Output Quality** | Medium-High — depends on repository indexing and search syntax |

**Security Note:** GitMCP is a public free endpoint. Maintainers indicate rate limits exist for fair usage but exact limits are not published.

---

### 8. GITHUB REST API MCP (github_* tools)

| Field | Value |
|-------|-------|
| **Tool Names** | `github_create_or_update_file`, `github_search_repositories`, `github_get_file_contents`, `github_push_files`, `github_create_repository`, `github_create_issue`, `github_create_pull_request`, `github_list_commits`, `github_list_issues`, `github_get_pull_request`, `github_merge_pull_request`, and 30+ others |
| **Server** | GitHub MCP Server (github-mcp-server) |
| **Category** | repo-management / code-search / issue-tracking / PR-management |
| **What It Does** | Full GitHub API access including repository management, issues, PRs, code search, file operations. Exposes 83+ tools. |
| **Best For** | Automating GitHub workflows, code review automation, repository management, CI/CD integration |
| **When NOT To Use** | When you only need read-only GitHub access (use more focused tools); when rate limits are a concern |
| **Rate Limits** | **5,000 requests/hour** for authenticated users; **15,000 requests/hour** for GitHub Enterprise Cloud; **300 requests/minute** for Git LFS |
| **Fallback** | GitHub CLI (`gh`), GitHub REST API directly |
| **Example Query** | `github_search_repositories query="language:typescript react state management"` |
| **Output Quality** | High — full API coverage, proper authentication handling |

**Critical Security Warning:** GitHub MCP exposes 83 tools including destructive operations (`delete_file`, `push_files`, `merge_pull_request`, `create_repository`). No built-in rate limits per tool. Security researchers recommend external rate limiting for production use.

---

### 9. FETCH / WEB FETCH (fetch_fetch, fetcher_fetch_url, fetcher_fetch_urls)

| Field | Value |
|-------|-------|
| **Tool Names** | `fetch_fetch`, `fetcher_fetch_url`, `fetcher_fetch_urls` |
| **Server** | Generic Fetch |
| **Category** | extract / crawl |
| **What It Does** | Retrieves raw content from URLs. Supports markdown extraction, HTML parsing, JavaScript rendering (with waitForNavigation). |
| **Best For** | Fetching specific web pages, extracting content from custom URLs, when you know exactly which pages you need |
| **When NOT To Use** | Discovery mode (don't know which URLs); bulk scraping (rate limits, anti-bot detection); when you need semantic search |
| **Rate Limits** | **No MCP-level rate limits published** — depends on target site and hosting |
| **Fallback** | Tavily Extract, Brave Search + Extract, Exa Crawling |
| **Example Query** | `fetcher_fetch_url url="https://docs.example.com/api" extractContent=true` |
| **Output Quality** | Variable — depends on target site structure; raw HTML or markdown; may require parsing |

**Options:**
- `extractContent`: AI-powered content extraction (removes ads/navigation)
- `returnHtml`: Raw HTML instead of markdown
- `disableMedia`: Disable images/stylesheets for faster loading
- `waitForNavigation`: Wait for JS rendering

---

### 10. MINIMAX (MiniMax_web_search, MiniMax_understand_image)

| Field | Value |
|-------|-------|
| **Tool Names** | `MiniMax_web_search`, `MiniMax_understand_image` |
| **Server** | MiniMax |
| **Category** | search / image-understanding |
| **What It Does** | Web search and image understanding powered by MiniMax AI models. |
| **Best For** | Multimodal search (images + text), Chinese-language search results, MiniMax model integration |
| **When NOT To Use** | Western-focused search (Brave/Exa perform better); when you need semantic code search |
| **Rate Limits** | **NEEDS_RESEARCH** — No official rate limit documentation found for MiniMax MCP tools |
| **Fallback** | Brave Search (general), Exa (semantic), Tavily (RAG) |
| **Example Query** | `MiniMax_web_search query="latest AI model releases March 2026"` |
| **Output Quality** | **NEEDS_VERIFICATION** — Limited documentation available |

---

### 11. GOOGLE SEARCH (google_search)

| Field | Value |
|-------|-------|
| **Tool Names** | `google_search` |
| **Server** | Google Search |
| **Category** | search |
| **What It Does** | Direct Google Search API access for web search results with citations. |
| **Best For** | General web search, real-time information, broad coverage |
| **When NOT To Use** | RAG pipelines (results need processing); semantic search needs (use Exa); when Google API costs are a concern |
| **Rate Limits** | **No MCP-specific rate limits documented** — varies by Google API plan; Search API has tiered rate limits |
| **Fallback** | Brave Search, Tavily Search, Exa Search |
| **Example Query** | `google_search query="OpenAI announces GPT-5 2026"` |
| **Output Quality** | Medium — real-time, broad coverage, raw snippets require processing |

**Note:** Google Search API is separate from Google AI Studio/Gemini API which has strict rate limits (Tier 1: 250 RPD).

---

### 12. STITCH (stitch_create_project, stitch_generate_screen_from_text, etc.)

| Field | Value |
|-------|-------|
| **Tool Names** | `stitch_create_project`, `stitch_get_project`, `stitch_list_projects`, `stitch_list_screens`, `stitch_get_screen`, `stitch_generate_screen_from_text`, `stitch_edit_screens`, `stitch_generate_variants`, `stitch_create_design_system`, `stitch_update_design_system`, `stitch_list_design_systems`, `stitch_apply_design_system` |
| **Server** | Stitch (Google) |
| **Category** | UI-generation / design-system |
| **What It Does** | AI-powered UI generation from text prompts. Creates screens, design systems, and variants using Google's generative AI. |
| **Best For** | Rapid UI prototyping, design system creation, converting text descriptions to screens |
| **When NOT To Use** | Production UI code (outputs are designs not code); complex interactive UIs |
| **Rate Limits** | **NEEDS_RESEARCH** — No official rate limit documentation for Stitch MCP tools |
| **Fallback** | Manual design implementation, other UI generation tools |
| **Example Query** | `stitch_generate_screen_from_text projectId="12345" prompt="Login screen with email and password fields"` |
| **Output Quality** | Medium — generates visual designs, not production code. Requires human interpretation. |

---

### 13. NOTION (notion_API-* tools)

| Field | Value |
|-------|-------|
| **Tool Names** | `notion_API-get-user`, `notion_API-get-users`, `notion_API-get-self`, `notion_API-post-search`, `notion_API-get-block-children`, `notion_API-patch-block-children`, `notion_API-retrieve-a-block`, `notion_API-update-a-block`, `notion_API-delete-a-block`, `notion_API-retrieve-a-page`, `notion_API-patch-page`, `notion_API-post-page`, `notion_API-retrieve-a-page-property`, `notion_API-retrieve-a-comment`, `notion_API-create-a-comment`, `notion_API-query-data-source`, `notion_API-retrieve-a-data-source`, `notion_API-update-a-data-source`, `notion_API-create-a-data-source`, `notion_API-list-data-source-templates`, `notion_API-retrieve-a-database`, `notion_API-move-page` |
| **Server** | Notion |
| **Category** | database / content-management / collaboration |
| **What It Does** | Full Notion API access for database operations, page CRUD, content management, comments, and search. |
| **Best For** | Notion database automation, content publishing workflows, knowledge base management |
| **When NOT To Use** | Real-time collaboration features; handling very large page hierarchies (>100 nested levels) |
| **Rate Limits** | **Average of 3 requests per second** with burst allowances. Returns HTTP 429 when exceeded. Retry-After header indicates wait time. |
| **Fallback** | Notion official API directly, manual Notion operations |
| **Example Query** | `notion_API-post-search query="meeting notes"` |
| **Output Quality** | High — structured JSON, proper Notion data types |

**Key Limits:**
- Rich text content: 2,000 characters per text object
- URL fields: 2,000 characters
- Array blocks: 100 elements maximum
- Relations: 100 related pages maximum
- Email/phone: 200 characters maximum

---

### 14. TAVILY SKILL (tavily_tavily_skill)

| Field | Value |
|-------|-------|
| **Tool Name** | `tavily_tavily_skill` |
| **Server** | Tavily |
| **Category** | documentation-search |
| **What It Does** | Specialized documentation search endpoint for libraries, APIs, and tools. Returns structured documentation chunks. |
| **Best For** | Finding documentation for specific libraries, API reference lookup, framework documentation |
| **When NOT To Use** | General web search (use tavily_tavily_search); code search (use Exa or GitMCP) |
| **Rate Limits** | **Shares Tavily account rate limits** — uses search credits |
| **Fallback** | Context7 (version-specific libs), Deepwiki (repo docs), official library docs |
| **Example Query** | `tavily_tavily_skill query="celery beat periodic tasks configuration"` |
| **Output Quality** | High — documentation-focused results, clean markdown, relevant chunks |

---

## Cross-Server Decision Matrices

### Decision Matrix 1: Web Search

| Scenario | Primary Choice | Fallback 1 | Fallback 2 |
|----------|----------------|-------------|------------|
| **Semantic/meaning search** | Exa | Tavily (basic) | Brave Search |
| **RAG pipeline with extraction** | Tavily Search + Extract | Exa (search) + Fetch (extract) | Brave + custom extraction |
| **Real-time news/current events** | Brave Search | Google Search | Tavily (news category) |
| **Research synthesis** | Tavily Research | Exa Deep Search | Gemini API with grounding |
| **Privacy-sensitive queries** | Brave Search | Exa | N/A |
| **Broad general search** | Google Search | Brave Search | Tavily |
| **Code/technical search** | Exa | GitMCP | GitHub Search API |
| **Cheapest option** | Brave Search ($5/1k) | Exa ($7/1k basic) | Tavily ($8-16/1k) |
| **Highest quality snippets** | Exa (highlights) | Tavily (raw content) | Brave (LLM context) |

---

### Decision Matrix 2: Content Extraction

| Scenario | Primary Choice | Fallback 1 | Fallback 2 |
|----------|----------------|-------------|------------|
| **Single known URL** | Fetch | Tavily Extract | Exa Crawling |
| **Multiple URLs (batch)** | Tavily Extract | Exa Crawling | Fetch (sequential) |
| **Website mapping/discovery** | Tavily Map | Tavily Crawl | Brave + custom |
| **Full page with JS rendering** | Fetch (waitForNavigation) | Tavily Crawl | External scraper |
| **RAG-optimized content** | Tavily Extract | Exa (with contents) | Fetch + post-processing |
| **Clean markdown output** | Tavily Extract | Fetch (extractContent) | Deepwiki (if doc page) |
| **Rate-limit sensitive** | Fetch (direct) | Tavily Extract (credit-based) | N/A |

---

### Decision Matrix 3: Code/Repository Analysis

| Scenario | Primary Choice | Fallback 1 | Fallback 2 |
|----------|----------------|-------------|------------|
| **Local codebase analysis** | Repomix | GitMCP (clone) | Manual file reads |
| **Remote public repo** | Deepwiki | GitMCP | Repomix (remote) |
| **GitHub integration** | GitMCP | GitHub MCP (83 tools) | gh CLI |
| **Library documentation** | Context7 | Tavily Skill | Deepwiki |
| **Cross-repo search** | GitMCP (code search) | GitHub Search API | Exa (semantic) |
| **Documentation generation** | Repomix | Deepwiki | Context7 |
| **Understanding new codebase** | Deepwiki (ask_question) | Repomix (pack) | Deepwiki (structure) |
| **Security-sensitive operation** | Repomix (local) | Deepwiki (no auth needed) | N/A |

---

### Decision Matrix 4: Documentation Search

| Scenario | Primary Choice | Fallback 1 | Fallback 2 |
|----------|----------------|-------------|------------|
| **Specific library version** | Context7 | Tavily Skill | Official docs |
| **Framework general docs** | Tavily Skill | Context7 | Deepwiki |
| **GitHub repo docs** | Deepwiki | GitMCP | Fetch (raw) |
| **Multi-library comparison** | Tavily Skill (multi) | Context7 (sequential) | Web search |
| **API reference lookup** | Context7 | Tavily Skill | Official API docs |
| **Getting started guides** | Deepwiki | Tavily Skill | Web search |
| **Rate-limit sensitive** | Context7 (free tier) | Deepwiki (unlimited) | N/A |

---

## Fallback Chain Protocol

### Web Search Fallback Chain
```
Exa Search (10 QPS)
  ↓ [rate limit hit or semantic needed]
Tavily Search (basic, 1 credit)
  ↓ [extraction needed]
Tavily Extract OR Brave Search
  ↓ [all exhausted]
return blocked_routes: ["web_search"]
```

### Content Extraction Fallback Chain
```
Tavily Extract (1 credit/5 URLs)
  ↓ [rate limit]
Exa Crawling (100 QPS contents)
  ↓ [content quality issues]
Fetch Direct (no rate limit but no extraction)
  ↓ [anti-bot detection]
return blocked_routes: ["content_extraction"]
```

### Documentation Search Fallback Chain
```
Context7 (version-specific)
  ↓ [not found or rate limited]
Tavily Skill (documentation)
  ↓ [not found]
Deepwiki (repo docs)
  ↓ [repo not indexed]
return blocked_routes: ["documentation_search"]
```

### Repository Analysis Fallback Chain
```
Deepwiki (if indexed, free)
  ↓ [not indexed]
GitMCP (public repos)
  ↓ [auth or rate limit]
Repomix Pack (local clone)
  ↓ [large repo]
Context7 (for dependencies)
  ↓ [all failed]
return blocked_routes: ["code_analysis"]
```

---

## Rate Limit Strategy

### Priority-Based Execution Order

1. **Execute Context7 queries FIRST** — free tier is most restrictive (60 req/hour), should be prioritized before other tools warm up
2. **Batch Tavily operations SECOND** — credit-based system allows planning; extract multiple URLs in single calls
3. **Use Deepwiki for repo structure THIRD** — completely free with no auth, unlimited for public repos
4. **Reserve Exa for semantic needs FOURTH** — highest cost but best semantic quality; use when others fail
5. **Use Brave for real-time data LAST** — good rate limits (50 QPS on Search plan) but paid; use for news/current events
6. **Use GitHub MCP sparingly** — 83 tools but 5,000 req/hour limit shared; implement request queuing

### Request Sequencing Recommendations

| Time Window | Recommended Operations |
|-------------|----------------------|
| **First minute** | Context7 queries (most restrictive), Deepwiki structure queries |
| **Minutes 2-5** | Tavily searches and extracts (credit-based planning) |
| **After minute 5** | Exa queries for semantic gaps not filled |
| **Continuous** | Repomix local operations (no external rate limits) |
| **Batch mode** | GitHub MCP operations (queue and throttle to 100 req/min) |

### Rate Limit Monitoring

**Implement these headers to track limits:**

| Server | Header | Action on Low |
|--------|--------|---------------|
| **Tavily** | `retry-after` | Wait specified seconds |
| **Brave** | `X-RateLimit-Remaining` | Stop at <10% remaining |
| **Exa** | QPS enforcement | Implement client-side throttling |
| **GitHub** | `x-ratelimit-remaining` | Stop at <100 remaining |
| **Notion** | HTTP 429 + `Retry-After` | Exponential backoff |

---

## Gaps Found

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| **MiniMax MCP tools** | HIGH | No official rate limit documentation found. Recommend avoiding for production until verified. |
| **Stitch MCP tools** | HIGH | No official rate limit documentation found. Verify with Google Cloud documentation. |
| **Context7 recent rate limit reduction** | MEDIUM | January 2026 reduction from 6,000 to 1,000 req/month significantly impacts free tier users. Recommend paid tier for production. |
| **GitMCP rate limits** | MEDIUM | No specific MCP-level limits published. Uses underlying GitHub API limits. |
| **Exa contents pricing** | LOW | Additive pricing ($7 search + $1 contents) makes effective cost $8/1k for agents needing full text. |
| **Brave free tier elimination** | LOW | March 2026 change requires payment info. $5/1k is still competitive but no longer free. |

---

## Blocked Routes

| Route | Blocker | Workaround |
|-------|--------|------------|
| **Context7 high-volume free** | Rate limit: 60 req/hour | Switch to paid tier; use Deepwiki for public repos |
| **Tavily free research** | Credit exhaustion | Use basic search + extract; upgrade plan |
| **GitHub MCP without auth** | Limited to 60 req/hour (unauthenticated) | Use GitHub Personal Access Token |
| **Large repo analysis** | Token limits | Use Repomix compression; analyze in slices |

---

## Recommended Next Action

**Immediate actions for HiveMind skill integration:**

1. **Update Context7 usage patterns** — current rate limits (60 req/hour free tier) require request batching and caching
2. **Add Deepwiki as primary for public repo questions** — no auth, no rate limits, free
3. **Implement request queuing for GitHub MCP** — 83 tools but shared 5,000 req/hour limit
4. **Create fallback chains for each scenario** — implement the chains defined above in skill logic
5. **Monitor Tavily credit usage** — implement credit budgeting per session
6. **Test MiniMax and Stitch rate limits** — these need live environment testing before production use

---

## Source Citations

| Source | URL | Access Date |
|--------|-----|-------------|
| Tavily Rate Limits | https://docs.tavily.com/documentation/rate-limits | 2026-03-29 |
| Tavily Pricing | https://help.tavily.com/articles/8816424538-pricing | 2026-03-29 |
| Exa Rate Limits | https://exa.ai/docs/reference/rate-limits | 2026-03-29 |
| Exa vs Tavily Comparison | https://exa.ai/versus/tavily | 2026-03-29 |
| Brave Search Pricing | https://api-dashboard.search.brave.com/documentation/pricing | 2026-03-29 |
| Brave Rate Limiting | https://api-dashboard.search.brave.com/documentation/guides/rate-limiting | 2026-03-29 |
| Context7 GitHub Issues | https://github.com/upstash/context7/issues/2145 | 2026-03-29 |
| Context7 Documentation | https://docs.stacklok.com/toolhive/guides-mcp/context7 | 2026-03-29 |
| GitHub API Rate Limits | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | 2026-03-29 |
| Notion API Limits | https://developers.notion.com/reference/request-limits | 2026-03-29 |
| Deepwiki MCP Info | https://cognition.ai/blog/deepwiki-mcp-server | 2026-03-29 |
| GitMCP Security Issues | https://github.com/github-mcp-server/issues/2233 | 2026-03-29 |

---

**Report Generated:** 2026-03-29  
**Confidence Level:** MEDIUM-HIGH for documented servers; UNVERIFIED for MiniMax and Stitch

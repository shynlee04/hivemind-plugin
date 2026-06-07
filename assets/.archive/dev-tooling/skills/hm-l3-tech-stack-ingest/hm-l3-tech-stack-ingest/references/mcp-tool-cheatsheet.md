# MCP Tool Cheatsheet — Tech Stack Ingestion

This reference maps every available MCP tool to its optimal use case for tech stack ingestion. Select tools based on what you need, not by habit.

## Tool Selection Matrix

| What You Need | Primary Tool | Secondary (Fallback) | When Primary Fails |
|---------------|-------------|---------------------|--------------------|
| **Full repository source code** | `repomix_pack_remote_repository` | `tavily_tavily_crawl` (crawl docs site) | Repo is private or >500MB |
| **API signatures, types, interfaces** | `context7_query_docs` | `repomix_pack_remote_repository` + grep | Library not in Context7 index |
| **Structured documentation** | `deepwiki_read_wiki_contents` | `repomix_pack_remote_repository` + `generate_skill` | Repo not in DeepWiki |
| **Specific code files** | `gitmcp_search_github_com_code` | `repomix_pack_remote_repository` + grep | File too large or not indexed |
| **Repository-level documentation** | `gitmcp_fetch_github_com_documentation` | `deepwiki_read_wiki_contents` | GitHub doc not available |
| **Web documentation pages** | `exa_web_search_exa` + `exa_web_fetch_exa` | `tavily_tavily_search` + `tavily_tavily_extract` | Site blocks crawling |
| **Blog posts, tutorials, guides** | `tavily_tavily_search` (freshness: "py") | `brave_search_brave_web_search` | Paywalled content |
| **Package metadata (version, repo URL)** | Native package manager (`npm view`, `pip show`) | `tavily_tavily_search` | Package not published |
| **Code examples and snippets** | `context7_query_docs` (query: "examples") | `repomix_pack_remote_repository` + grep for `example` | No examples in docs |
| **Library ecosystem overview** | `deepwiki_ask_question` (broad question) | `tavily_tavily_research` | No wiki exists |

## Tool-by-Tool Reference

### repomix Tools

**`repomix_pack_remote_repository`** — Clone and package an entire GitHub repo into a structured file.

```
Use when: You need the FULL source code of a repository.
Best for: SDKs, frameworks, type libraries — anything where you'll grep for signatures.
Not for: Huge repos (>500MB), private repos.

Key parameters:
  - remote: "github.com/user/repo" or full GitHub URL
  - style: "xml" (structured with <file> tags) or "markdown"
  - compress: false (we want full content) for most cases; true for >500MB repos
  - includePatterns: "src/**" to focus on source code only
  - ignorePatterns: "test/**,docs/**" to reduce size

Storage path: references/tech-stacks/<name>/raw/repomix-output.xml
```

**`repomix_pack_codebase`** — Package a LOCAL directory. Not used for remote ingestion — use `repomix_pack_remote_repository` instead.

**`repomix_generate_skill`** — Generate a skill from a local code directory. Useful for creating reference skills from cached repos.

**`repomix_read_repomix_output`** / **`repomix_grep_repomix_output`** — Read or search within previously generated repomix output. Use these to query cached repos without re-downloading.

### deepwiki Tools

**`deepwiki_read_wiki_structure`** — Get the table of contents for a repo's documentation.

```
Use when: You need to understand what documentation is available before diving in.
Best for: Planning what to ingest — shows topic hierarchy.
Key parameter:
  - repoName: "owner/repo" (e.g., "colinhacks/zod")
```

**`deepwiki_read_wiki_contents`** — Read the full documentation for a repo.

```
Use when: You need the complete structured documentation.
Best for: Comprehensive doc ingestion.
Key parameter:
  - repoName: "owner/repo"
Storage path: references/tech-stacks/<name>/docs/deepwiki-output.md
```

**`deepwiki_ask_question`** — Ask a specific question about a repo.

```
Use when: You have a targeted question (e.g., "how does error handling work?")
Best for: Targeted research after initial ingestion.
Key parameters:
  - repoName: "owner/repo" or ["repo1", "repo2", ...] (up to 10)
  - question: "How does the validation pipeline work?"
```

### gitmcp Tools

**`gitmcp_search_github_com_code`** — Search for specific code within a GitHub repo.

```
Use when: You need to find specific files or code patterns.
Best for: Finding type definitions, interfaces, specific implementations.
Key parameters:
  - query: "repo:owner/repo path:src zod" or "repo:owner/repo export type"
  - page: page number (1-based, 30 results per page)

Storage path: references/tech-stacks/<name>/api/gitmcp-search-<query>.md
```

**`gitmcp_fetch_github_com_documentation`** — Fetch the documentation file from a GitHub repo.

```
Use when: The repo has a docs/ directory or README with comprehensive docs.
Best for: Quick doc extraction without cloning the full repo.
No parameters needed — auto-fetches from the configured repo.
```

**`gitmcp_fetch_generic_url_content`** — Fetch content from any absolute URL.

```
Use when: You need to fetch documentation from a non-GitHub URL.
Key parameter:
  - url: "https://docs.example.com/api-reference"
```

### context7 Tools

**`context7_resolve_library_id`** — Find the Context7 library ID for a package.

```
Use when: You need to know the Context7 identifier before querying docs.
Key parameters:
  - query: "What library do you need docs for?"
  - libraryName: "zod" (use the official name with proper punctuation)

Returns: Library ID like "/colinhacks/zod" or "/colinhacks/zod/v4"
```

**`context7_query_docs`** — Query the documentation for API signatures, types, and examples.

```
Use when: You need specific API information — types, exports, examples, configurations.
Best for: API surface extraction, type validation, example gathering.
Key parameters:
  - libraryId: "/colinhacks/zod" (from resolve_library_id)
  - query: "all exported types and functions" or "all public API methods"
  - researchMode: false (first attempt); true (retry for deep research)

Storage path: references/tech-stacks/<name>/api/context7-<query>.md
```

### exa Tools

**`exa_web_search_exa`** — Search the web for documentation pages.

```
Use when: You need to find documentation pages, blog posts, or tutorials.
Best for: Discovery — finding where the docs live.
Key parameters:
  - query: "zod validation library API documentation"
  - numResults: 10 (for thorough coverage)

Note: Use semantic queries, not keywords. "zod schema validation API reference" not "zod docs".
```

**`exa_web_fetch_exa`** — Fetch and extract content from specific URLs.

```
Use when: You found relevant docs pages and need the full content.
Best for: Extracting specific documentation pages.
Key parameters:
  - urls: ["https://zod.dev/", "https://zod.dev/?id=basic-usage"]
  - maxCharacters: 5000 (increase for comprehensive extraction)

Storage path: references/tech-stacks/<name>/docs/exa-<page-name>.md
```

### tavily Tools

**`tavily_tavily_search`** — Web search for documentation and references.

```
Use when: exa doesn't find good results, or you need news/time-filtered results.
Best for: Recent documentation, blog posts, tutorials.
Key parameters:
  - query: "zod v4 API reference"
  - max_results: 10
  - search_depth: "advanced" (for thorough results)
  - time_range: "year" (or "month" for recent changes)
```

**`tavily_tavily_crawl`** — Crawl an entire documentation site.

```
Use when: You need comprehensive coverage of a documentation site.
Best for: Documentation sites with many interlinked pages.
Key parameters:
  - url: "https://zod.dev/"
  - max_depth: 3
  - limit: 50
  - select_paths: ["/docs/.*", "/api/.*"]

Storage path: references/tech-stacks/<name>/docs/tavily-crawl/
```

**`tavily_tavily_extract`** — Extract content from specific URLs.

```
Use when: You have specific URLs and need clean markdown content.
Best for: Targeted page extraction.
Key parameters:
  - urls: ["https://zod.dev/?id=schemas"]
  - extract_depth: "advanced" (for complex pages with tables)

Storage path: references/tech-stacks/<name>/docs/tavily-extract-<page>.md
```

**`tavily_tavily_research`** — Deep research on a topic with automatic multi-source synthesis.

```
Use when: You need a comprehensive research report on a library.
Best for: Overview research before detailed ingestion.
Key parameters:
  - input: "Comprehensive research on zod validation library: API surface, type system, error handling, ecosystem"
  - model: "pro" (for broad topics)
```

**`tavily_tavily_map`** — Map a website's URL structure.

```
Use when: You need to understand a documentation site's structure before crawling.
Best for: Planning a crawl — see what pages exist.
Key parameters:
  - url: "https://zod.dev/"
  - max_depth: 2
```

### brave-search Tools

**`brave_search_brave_web_search`** — Alternative web search.

```
Use when: tavily or exa results are insufficient.
Best for: General web search as fallback.
Key parameters:
  - query: "zod library documentation"
  - count: 10
```

### fetch Tool

**`fetch_fetch`** — Simple URL fetching.

```
Use when: You need a quick, lightweight page fetch.
Best for: Single page extraction when other tools are overkill.
Key parameters:
  - url: "https://example.com/docs"
  - max_length: 10000
```

### Native Package Manager Commands

**npm:**
```bash
npm view <package> repository.url    # Get repo URL
npm view <package> version           # Get latest version
npm view <package> description       # Get description
npm view <package> keywords          # Get keywords
```

**pip:**
```bash
pip show <package>                   # Get metadata
pip index versions <package>         # List all versions
```

**Go:**
```bash
go doc <module-path>                 # Get package documentation
go list -m -json <module>@<version>  # Get module metadata
```

## Fallback Chain

When one tool fails, always try the next in this order:

```
Primary tool
  ↓ (FAILS: timeout, empty result, access denied)
Secondary tool (from matrix above)
  ↓ (FAILS: still no results)
Web search (tavily/exa/brave)
  ↓ (FAILS: no docs exist online)
Report NEEDS_CONTEXT — cannot find documentation for this package
```

## Tool Combinations by Package Type

### SDK / Framework (e.g., @opencode-ai/plugin, next, django)

```
1. repomix_pack_remote_repository  →  Full source code (as XML)
2. context7_query_docs             →  API surface, types, interfaces
3. deepwiki_read_wiki_contents     →  Structured documentation
4. exa_web_search_exa              →  Tutorials, blog posts
```

### Type Library (e.g., zod, yup, io-ts)

```
1. context7_query_docs             →  Type definitions (primary)
2. repomix_pack_remote_repository  →  Source code for type extraction
3. deepwiki_ask_question           →  Specific type usage questions
```

### Testing Framework (e.g., vitest, jest, pytest)

```
1. deepwiki_read_wiki_contents     →  Full documentation
2. context7_query_docs             →  API reference (assert, mock, etc.)
3. tavily_tavily_search            →  Blog posts, patterns, best practices
```

### Utility Library (e.g., yaml, chalk, lodash)

```
1. context7_query_docs             →  API surface (lighter weight)
2. repomix_pack_remote_repository  →  Source code (if needed)
3. tavily_tavily_extract           →  Readme/docs pages
```

### Build Tool (e.g., webpack, vite, esbuild)

```
1. repomix_pack_remote_repository  →  Source code
2. deepwiki_read_wiki_contents     →  Documentation
3. tavily_tavily_crawl             →  Official docs site
```

## Toolkit Capability Gaps

| Gap | Workaround |
|-----|------------|
| No MCP tool for private npm registries | Use `npm view` with auth, or skip ingest and flag |
| No MCP tool for reading local node_modules directly | Use `glob` + `read` on `node_modules/<package>/` |
| No MCP tool for Maven Central / Gradle | Use `tavily_tavily_search` for docs, skip source ingestion |
| No MCP tool for in-repo monorepo docs | Extract docs from the repo itself using `grep` + `glob` |
| API rate limits on MCP tools | Spread ingestion across sessions; prioritize HIGH-priority packages first |

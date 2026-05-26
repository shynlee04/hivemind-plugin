# Research Tool Matrix

MCP tool reference for the hm-research-chain pipeline (ingest → detect → research → synthesize → artifact).
Every function name listed here is an exact MCP tool function — not a shorthand.

---

## 1. MCP Tool Function Reference

| Category | Tool | MCP Function | Best For | Fallback Chain |
|----------|------|--------------|----------|----------------|
| API/SDK Docs | Context7 | `context7_resolve-library-id` then `context7_query-docs` | Library docs, API signatures, version-matched queries | Context7 → Repomix → DeepWiki |
| Repo Analysis | Repomix | `repomix_pack_remote_repository`, `repomix_pack_codebase`, `repomix_grep_repomix_output`, `repomix_read_repomix_output`, `repomix_attach_packed_output` | Codebase structure, cross-dependency analysis, full repo packing, targeted search within packed output | Repomix → GitHub Code Search → Exa |
| Architecture Docs | DeepWiki | `deepwiki_ask_question`, `deepwiki_read_wiki_structure`, `deepwiki_read_wiki_contents` | Architecture patterns, design decisions, repo-level understanding | DeepWiki → Context7 → Exa |
| GitHub Access | GitMCP | `gitmcp_search_github_com_code`, `gitmcp_fetch_github_com_documentation`, `gitmcp_fetch_generic_url_content`, `gitmcp_search_github_com_documentation` | Source code search, issue history, PR context, commit inspection | GitMCP → GitHub REST → Repomix |
| Web Search | Exa | `exa_web_search_exa`, `exa_web_fetch_exa` | Semantic web search, finding articles, AI-optimized results, category:people / category:company | Exa → Tavily → WebFetch |
| Web Search (alt) | Tavily | `tavily_tavily_search`, `tavily_tavily_extract`, `tavily_tavily_crawl`, `tavily_tavily_map`, `tavily_tavily_research` | Current events, content extraction, site crawling, site mapping, deep research with citations | Tavily → Exa → WebFetch |
| Content Fetch | WebFetch | `fetch_fetch`, `fetcher_fetch_url`, `fetcher_fetch_urls` | Raw URL content retrieval, HTML extraction, batch URL fetching | Any → WebFetch as last resort |
| GitHub REST | GitHub | `github_search_code`, `github_get_file_contents`, `github_list_commits`, `github_search_issues`, `github_search_repositories`, `github_list_issues`, `github_list_pull_requests`, `github_get_issue`, `github_get_pull_request` | Direct GitHub API: issues, PRs, file contents, commit history, repository search | GitHub REST → GitMCP → Repomix |
| ZRead | ZRead | `zread_search_doc`, `zread_read_file`, `zread_get_repo_structure` | GitHub repo documentation search, file reading, structure listing — alternative to GitHub REST for doc-heavy repos | ZRead → GitHub REST → GitMCP |

---

## 2. Tool Selection Decision Tree

```
Research Question
├── "What is the API signature for X?"
│   ├── Context7: context7_resolve_library_id("X") → context7_query_docs("API signature for X")
│   ├── Fallback: Repomix: repomix_pack_remote_repository("X repo") → repomix_grep_repomix_output("signature")
│   └── Fallback: DeepWiki: deepwiki_ask_question("X repo", "API signature for X")
│
├── "How does X work internally?"
│   ├── Repomix: repomix_pack_remote_repository("X repo") → repomix_grep_repomix_output("class|export|function")
│   ├── Fallback: DeepWiki: deepwiki_read_wiki_structure("X repo") + deepwiki_ask_question("X repo", "how does X work")
│   └── Fallback: GitHub: github_search_code("X implementation")
│
├── "What is the current state of X?"
│   ├── Tavily: tavily_tavily_search("X latest state 2026")
│   ├── Fallback: Exa: exa_web_search_exa("X current status latest")
│   └── Fallback: WebFetch: fetcher_fetch_url("known URL about X")
│
├── "What does the source code of X look like?"
│   ├── GitHub: github_get_file_contents("owner", "repo", "path/to/file")
│   ├── Fallback: Repomix: repomix_pack_remote_repository("owner/repo") → repomix_read_repomix_output(outputId)
│   └── Fallback: GitMCP: gitmcp_search_github_com_code("X source code")
│
├── "What are people saying about X?"
│   ├── Exa: exa_web_search_exa("X discussion review comparison")
│   ├── Fallback: Tavily: tavily_tavily_search("X review discussion")
│   └── Fallback: WebFetch: fetcher_fetch_urls(["blog1_url", "blog2_url"])
│
├── "Does X support feature Y in version Z?"
│   ├── Context7: context7_resolve_library_id("X") → context7_query_docs("feature Y in version Z")
│   ├── Fallback: DeepWiki: deepwiki_ask_question("X repo", "does X support Y in version Z")
│   └── Fallback: GitHub: github_search_issues("X Y version Z")
│
├── "What is the directory structure of repo X?"
│   ├── ZRead: zread_get_repo_structure("owner/repo")
│   ├── Fallback: GitHub: github_get_file_contents("owner", "repo", "/")
│   └── Fallback: Repomix: repomix_pack_remote_repository("owner/repo", { compress: true })
│
└── "Crawl entire documentation site for X"
    ├── Tavily: tavily_tavily_crawl("https://docs.X.com", { max_depth: 3 })
    ├── Fallback: Exa: exa_web_fetch_exa(["page1", "page2", "page3"])
    └── Fallback: WebFetch: fetcher_fetch_urls(["url1", "url2", "url3"])
```

---

## 3. Canonical MCP Fallback Chain

```
Context7 → Repomix → DeepWiki → GitHub (GitMCP) → Exa → Tavily → WebFetch
```

**Rules:**

1. Each step is tried when the previous returns insufficient results.
2. Document which tool(s) were used in research findings — never silently fall back.
3. The chain is advisory; specialized queries may skip steps (e.g., "current events" starts at Tavily/Exa).
4. After 3 fallback attempts, synthesize what you have rather than continuing indefinitely.

---

## 4. Two-Tier Trust Model

| Tier | Tools | Use Case | Evidence Weight |
|------|-------|----------|-----------------|
| **Validation Tier** (live verification) | Context7 (`context7_query-docs`), DeepWiki (`deepwiki_ask_question`), Exa (`exa_web_search_exa`), Tavily (`tavily_tavily_search`), GitHub (`github_search_code`, `github_get_file_contents`) | Confirming API signatures, version-sensitive claims, breaking changes, current best practices | **HIGH** — live query against current source/docs |
| **Reference Tier** (cached/supplementary) | Repomix (`repomix_pack_remote_repository`, `repomix_grep_repomix_output`), cached Context7 docs, cached DeepWiki wiki contents, ZRead (`zread_search_doc`) | Architecture orientation, pattern understanding, offline research, cross-dependency analysis | **MEDIUM** — packed/cached data may be stale; verify critical claims via Validation Tier |

**Decision rule:** Any claim about API signatures, version compatibility, or current behavior **must** be backed by at least one Validation Tier source. Reference Tier sources are sufficient for architecture patterns, design rationale, and historical context.

---

## 5. Research Context → Tool Matrix

| Research Context | Primary Tool (MCP Function) | Secondary Tool (MCP Function) | Rationale |
|------------------|----------------------------|-------------------------------|-----------|
| Verify API signature | `context7_query-docs` | `repomix_grep_repomix_output` | Version-matched docs first; code search as backup |
| Find current best practice | `tavily_tavily_search` | `exa_web_search_exa` | Current info requires live web search |
| Understand repo architecture | `deepwiki_read_wiki_structure` + `deepwiki_ask_question` | `repomix_pack_remote_repository` | Architecture docs first; code packing as backup |
| Search source code | `github_search_code` | `gitmcp_search_github_com_code` | GitHub REST API first; GitMCP as alternative |
| Read specific repo file | `github_get_file_contents` | `zread_read_file` | GitHub API first; ZRead as alternative |
| Check GitHub issues/PRs | `github_search_issues` | `github_list_issues` | Search API first; list as paginated alternative |
| Check commit history | `github_list_commits` | `gitmcp_fetch_github_com_documentation` | REST API for commit log; GitMCP as fallback |
| Extract page content | `tavily_tavily_extract` | `fetcher_fetch_url` | Tavily handles JS rendering; fetcher as fallback |
| Batch-extract URLs | `fetcher_fetch_urls` | `tavily_tavily_extract` | Fetcher for batch; Tavily for JS-heavy pages |
| Crawl documentation site | `tavily_tavily_crawl` | `exa_web_fetch_exa` (batch) | Crawl for multi-page docs; Exa batch as alternative |
| Map site structure | `tavily_tavily_map` | Manual URL discovery via `fetcher_fetch_url` | Map for navigation planning; manual as fallback |
| Deep research report | `tavily_tavily_research` | Multi-tool manual chain | Tavily research for comprehensive reports; manual orchestration as alternative |
| Pack repo for analysis | `repomix_pack_remote_repository` | `repomix_pack_codebase` (local) | Remote packing first; local packing as alternative |
| Search within packed repo | `repomix_grep_repomix_output` | `repomix_read_repomix_output` | Grep for targeted search; read for full content |
| Attach existing pack | `repomix_attach_packed_output` | Re-pack via `repomix_pack_remote_repository` | Attach if file exists; re-pack as fallback |
| Find articles/blog posts | `exa_web_search_exa` | `tavily_tavily_search` | Exa for semantic search; Tavily as alternative |
| Search repo documentation | `zread_search_doc` | `gitmcp_search_github_com_documentation` | ZRead for doc-focused search; GitMCP as fallback |
| Get repo directory tree | `zread_get_repo_structure` | `github_get_file_contents` (root path) | ZRead for structured tree; GitHub API as fallback |

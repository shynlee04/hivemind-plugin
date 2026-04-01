# MCP Tool Catalog

## Table of Contents

- [MCP Server Tool Inventory](#mcp-server-tool-inventory)
- [Tool Selection Decision Matrix](#tool-selection-decision-matrix)
- [MCP Tool Composition Patterns](#mcp-tool-composition-patterns)

## MCP Server Tool Inventory

| MCP Server | Tools | Primary Use |
|------------|-------|------------|
| **Context7** | `resolve-library-id`, `query-docs` | Library documentation, version compatibility, API behavior |
| **Deepwiki** | `read-wiki-structure`, `read-wiki-contents`, `ask-question` | GitHub repo documentation, architecture understanding |
| **Tavily** | `tavily_search`, `tavily_extract`, `tavily_crawl`, `tavily_research` | Web research, content extraction, comprehensive research |
| **Exa** | `web_search_exa`, `crawling_exa`, `get_code_context_exa` | Code search, web search, content extraction |
| **Git Fetcher** | `fetch_github_com_documentation`, `search_github_com_documentation`, `search_github_com_code` | GitHub docs and code search |
| **Repomix** | `pack_codebase`, `pack_remote`, `attach_packed_output`, `grep_repomix_output`, `read_repomix_output`, `generate_skill` | Codebase packaging + analysis |
| **Notion** | `API-get-user`, `API-get-users`, `API-post-search`, `API-get-block-children`, etc. | Notion workspace integration |
| **Stitch** | `create_project`, `get_project`, `list_screens`, `generate_screen`, `edit_screens` | UI design generation |
| **Web Fetch** | `fetch_fetch`, `fetcher_fetch_url`, `fetcher_fetch_urls` | URL content retrieval |

## Tool Selection Decision Matrix

| Need | Primary MCP | Fallback | Why |
|------|-------------|----------|-----|
| Library docs | Context7 | Deepwiki | Context7 has version-specific docs; Deepwiki has repo-level |
| Web research | Tavily | Exa web search | Tavily has structured research; Exa has broader coverage |
| Code search | Exa code | Repomix grep | Exa searches across repos; Repomix searches packed codebase |
| Repo documentation | Deepwiki | Git Fetcher | Deepwiki has AI Q&A; Git Fetcher has raw docs |
| Codebase analysis | Repomix | Built-in grep/glob | Repomix handles large codebases; built-in for small |
| Content extraction | Tavily extract | Exa crawling | Both extract page content; Tavily is more structured |
| UI design | Stitch | — | Stitch is the only UI generation MCP |
| Notion data | Notion API | — | Notion API is the only Notion integration |

## MCP Tool Composition Patterns

### Research Pipeline
```
Tavily search → Exa extract → Context7 verify → Synthesize
```
Use when: Comprehensive research with multiple source validation.

### Codebase Investigation
```
Repomix pack → grep → attach → read → Cross-validate
```
Use when: Deep codebase analysis with targeted queries.

### Library Validation
```
Context7 resolve → query docs → Deepwiki ask → Verify
```
Use when: Validating library usage, API behavior, version compatibility.

### External Research + Codebase
```
Repomix pack (local) → Tavily search (external) → Exa code (ecosystem) → Synthesize
```
Use when: Understanding how local codebase relates to broader ecosystem.

### Documentation Generation
```
Repomix pack → Deepwiki ask → Context7 query → Generate
```
Use when: Generating documentation that combines code analysis with external context.

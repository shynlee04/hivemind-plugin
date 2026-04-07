# MCP Server Reality

## What LLMs Don't Know

LLMs are trained on static data. MCP servers provide **live, current information**. This document maps what's actually available in the user's OpenCode config and how to use each server.

---

## Available MCP Servers (from mcp.json)

### Context & Research

| Server | Type | URL/Command | Purpose |
|--------|------|-------------|---------|
| **context7** | HTTP | `https://mcp.context7.com/mcp` | Library documentation lookups. Use for ANY library/API question. |
| **exa** | npx | `npx -y mcp-remote https://mcp.exa.ai/mcp` | Web search with clean content extraction. Better than generic web search. |
| **tavily** | HTTP | `https://mcp.tavily.com/mcp/?tavilyApiKey=$TAVILY_API_KEY` | Research with multi-source synthesis. Good for current events. |
| **brave-search** | npx | `npx -y @brave/brave-search-mcp-server` | Web search with Brave API. Good for general queries. |
| **web-search-prime** | HTTP | `https://api.z.ai/api/mcp/web_search_prime/mcp` | Z.AI web search. |
| **deepwiki** | HTTP | `https://mcp.deepwiki.com/mcp` | GitHub repository documentation. Use for repo-specific questions. |

### Code & Repository

| Server | Type | URL/Command | Purpose |
|--------|------|-------------|---------|
| **github** | npx | `npx -y @modelcontextprotocol/server-github` | Full GitHub API access. Search code, read files, list repos. |
| **repomix** | npx | `npx -y repomix --mcp` | Pack entire codebases into analysis-ready format. Compress option available. |

### Web Fetching

| Server | Type | URL/Command | Purpose |
|--------|------|-------------|---------|
| **fetcher** | npx | `npx -y fetcher-mcp` | Fetch web pages with JavaScript rendering. |
| **fetch** | uvx | `uvx mcp-server-fetch` | Simple URL fetching. |
| **web-reader** | HTTP | `https://api.z.ai/api/mcp/web_reader/mcp` | Z.AI web reader. |
| **zread** | HTTP | `https://api.z.ai/api/mcp/zread/mcp` | Z.AI document reader. |

### Other

| Server | Type | URL/Command | Purpose |
|--------|------|-------------|---------|
| **notion** | HTTP | `https://mcp.notion.com/mcp` | Notion workspace access. |
| **stitch** | HTTP | `https://stitch.googleapis.com/mcp` | Google Stitch design generation. |
| **gitmcp** | HTTP | `https://gitmcp.io` | Git repository access. |
| **desktop-commander** | npx | `@wonderwhy-er/desktop-commander` | Desktop file operations. |
| **mcp-playwright** | npx | `npx -y @playwright/mcp@latest` | Browser automation. |
| **memory** | npx | `npx -y @modelcontextprotocol/server-memory` | Persistent memory storage. |
| **sequential-thinking** | npx | `npx -y @modelcontextprotocol/server-sequential-thinking` | Chain-of-thought reasoning. |
| **netlify** | npx | `npx -y @netlify/mcp` | Netlify deployment management. |

---

## How to Use Each Server

### Context7 (MOST IMPORTANT)

**When:** Any question about a library, framework, or API.

**Flow:**
1. `context7_resolve-library-id` — find the library ID
2. `context7_query-docs` — query the documentation

**Example:**
```
Query: "How to set up authentication with JWT in Express.js"
Library: "express"
→ Returns current docs, not training data
```

**Never assume** API signatures. Always verify with Context7.

### Repomix

**When:** Need to understand a codebase structure.

**Flow:**
1. `repomix_pack_codebase` with `compress: true` for essential structure
2. `repomix_grep_repomix_output` for pattern searches
3. `repomix_read_repomix_output` with offset/limit for targeted reads

**Example:**
```
Pack: /path/to/project
Compress: true
→ Returns essential code signatures and structure, ~70% token reduction
```

### GitHub

**When:** Need to read files from a GitHub repo.

**Flow:**
1. `github_get_file_contents` — read specific files
2. `github_search_code` — search across repos
3. `github_list_commits` — inspect history

**Example:**
```
Owner: "gsd-build"
Repo: "get-shit-done"
Path: "agents/gsd-executor.md"
→ Returns full file content
```

### DeepWiki

**When:** Need documentation about a GitHub repo.

**Flow:**
1. `deepwiki_read_wiki_structure` — get topic list
2. `deepwiki_read_wiki_contents` — read documentation
3. `deepwiki_ask_question` — ask specific questions

**Example:**
```
Repo: "facebook/react"
Question: "How does the concurrent rendering work?"
→ Returns AI-powered answer from repo docs
```

### Exa

**When:** Need clean web content extraction.

**Flow:**
1. `exa_web_search_exa` — search with natural language
2. `exa_web_fetch_exa` — read full page content

**Example:**
```
Query: "blog post comparing React and Vue performance"
→ Returns clean markdown content from top results
```

---

## Priority Order for Audit/Inspection

1. **Context7** — verify library docs (never assume)
2. **Repomix** — pack and analyze codebase
3. **GitHub** — read specific files from repos
4. **DeepWiki** — get repo-specific documentation
5. **Exa** — search web for current information
6. **Tavily** — multi-source research

---

## What LLMs Get Wrong

| Wrong Assumption | Reality |
|-----------------|---------|
| "I know the Express.js API" | Training data is stale. Use Context7. |
| "The file structure is X" | Use Repomix to verify. |
| "This repo has Y pattern" | Use GitHub MCP to read actual files. |
| "The latest version does Z" | Use Context7 to check current docs. |
| "I can infer the architecture" | Use Repomix + DeepWiki to verify. |

---

## Environment Variables Required

| Server | Required Env Var |
|--------|-----------------|
| notion | `$NOTION_API_TOKEN` |
| web-search-prime | `$ZAI_API_KEY` |
| web-reader | `$ZAI_API_KEY` |
| zread | `$ZAI_API_KEY` |
| desktop-commander | `$SMITHERY_CLI_KEY` |
| exa | `$EXA_API_KEY` |
| github | `$GITHUB_PAT` |
| netlify | `$NETLIFY_PAT` |
| brave-search | `$BRAVE_API_KEY` |
| tavily | `$TAVILY_API_KEY` (in URL) |

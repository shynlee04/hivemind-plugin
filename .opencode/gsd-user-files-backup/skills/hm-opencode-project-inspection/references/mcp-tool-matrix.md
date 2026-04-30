# MCP Tool Matrix

Available MCP servers and their recommended use cases for project inspection.

## Context7 MCP

**Purpose:** Query official documentation for libraries and frameworks.

**Workflow:**
1. `context7_resolve-library-id` — resolve library name to ID
2. `context7_query-docs` — query specific questions

**Best for:**
- API signature verification
- Version-matched documentation
- Official examples and patterns

**Anti-patterns:**
- Never assume API from training knowledge
- Never skip resolution step
- Never query without a specific question

## Repomix MCP

**Purpose:** Pack and inspect local or remote codebases.

**Workflow:**
1. `repomix_pack_codebase` — pack directory with optional compression
2. `repomix_grep_repomix_output` — search packed output
3. `repomix_read_repomix_output` — read specific sections

**Best for:**
- Large codebase overview
- Cross-file pattern search
- Token-efficient code reading

**Anti-patterns:**
- Don't pack `node_modules/` or `dist/`
- Don't read entire packed output at once — use grep first
- Don't assume packed structure matches file tree exactly

## GitHub MCP

**Purpose:** Access GitHub repositories, issues, PRs, and code.

**Workflow:**
1. `github_get_file_contents` — read specific files
2. `github_search_code` — search across repos
3. `github_list_commits` — inspect history

**Best for:**
- Third-party dependency inspection
- Reference implementation lookup
- Commit history analysis

**Anti-patterns:**
- Don't use for local files (use Read/Glob/Grep instead)
- Don't search without a specific query
- Don't assume repo structure

## Tavily MCP

**Purpose:** Web search and content extraction.

**Workflow:**
1. `tavily_search` — find relevant pages
2. `tavily_extract` — read specific URLs
3. `tavily_research` — deep research with citations

**Best for:**
- Current events and latest documentation
- Market research
- Competitor analysis

**Anti-patterns:**
- Don't use for codebase inspection (use Repomix instead)
- Don't trust search snippets without reading full page
- Don't use for API verification (use Context7 instead)

## Tool Selection Decision Tree

```
Need to verify an API signature?
└── YES → Context7

Need to search a large codebase?
└── YES → Repomix

Need to read a specific GitHub file?
└── YES → GitHub MCP

Need current information from the web?
└── YES → Tavily

Need to inspect local meta-concepts?
└── YES → Read / Glob / Grep (built-ins)
```

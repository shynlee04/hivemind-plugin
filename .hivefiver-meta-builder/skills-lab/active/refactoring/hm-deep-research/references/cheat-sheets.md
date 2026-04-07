# Cheat Sheets

Copy-paste-ready tool invocation examples. Use these for quick parameter lookups during active research.

**This file = examples + parameter values.** For rate limits, pitfalls, and best practices, see [Tool Operations](tool-operations.md).

---

## Tavily Cheat Sheet

### tavily-search

```
Tool: tavily_tavily_search
Credits: basic=1, advanced=2, fast=1, ultra-fast=1

Quick lookup:
  query: "rust websocket batching"
  max_results: 5
  search_depth: "basic"

Deep search:
  query: "drizzle orm vs prisma type inference comparison"
  max_results: 10
  search_depth: "advanced"

Recent results:
  query: "next.js 15 release announcement"
  time_range: "month"

Targeted:
  query: "express middleware guide"
  include_domains: ["expressjs.com", "github.com"]
  exclude_domains: ["medium.com", "reddit.com"]
```

### tavily-extract

```
Tool: tavily_tavily_extract
Max: 20 URLs per call

Single URL:
  urls: ["https://docs.example.com/api"]
  extract_depth: "basic"

JS-heavy page:
  urls: ["https://spa-docs.example.com/api"]
  extract_depth: "advanced"

Batch:
  urls: ["https://url1.com", "https://url2.com", ...]
  extract_depth: "basic"
  query: "composite types"   # reranks chunks
```

### tavily-crawl

```
Tool: tavily_tavily_crawl

Documentation site:
  url: "https://docs.example.com"
  max_depth: 2
  max_breadth: 10
  limit: 20
  select_paths: ["/docs/.*", "/api/.*"]

Full site:
  url: "https://example.com"
  max_depth: 3
  max_breadth: 15
  limit: 50
```

### tavily-map

```
Tool: tavily_tavily_map

Quick survey:
  url: "https://docs.example.com"
  max_depth: 1
  limit: 20

Find API pages:
  url: "https://example.com"
  max_depth: 2
  select_paths: ["/api/.*"]
  limit: 30
```

### tavily-research

```
Tool: tavily_tavily_research
Rate limit: 20 req/min, 30-120 sec per call

Focused:
  input: "Compare Prisma vs Drizzle type inference for PG composite types"
  model: "mini"

Broad:
  input: "State of TypeScript ORMs in 2025: features, performance, ecosystem"
  model: "pro"

Auto:
  input: "[your research question with context]"
  model: "auto"
```

---

## Brave Cheat Sheet

### brave-web-search

```
Tool: brave-search_brave_web_search

Basic:
  query: "rust websocket library"
  count: 10

Recent:
  query: "react 19 release"
  freshness: "pm"
  count: 5

Extra context:
  query: "next.js app router patterns"
  extra_snippets: true
  count: 5
```

### brave-news-search

```
Tool: brave-search_brave_news_search

Today:
  query: "typescript 5.5 release"
  freshness: "pd"

This week:
  query: "node.js security vulnerability"
  freshness: "pw"
```

### Freshness values

| Value | Time Range |
|-------|-----------|
| pd | Last 24 hours |
| pw | Last 7 days |
| pm | Last 31 days |
| py | Last 365 days |
| 2024-01-01to2024-06-30 | Date range |

---

## Context7 Cheat Sheet

```
Step 1: resolve-library-id
  libraryName: "react"
  query: "server components streaming"

Step 2: query-docs (max 3 per question)
  libraryId: "/facebook/react"     <- from step 1
  query: "How do React Server Components handle streaming?"

Common library IDs:
  /facebook/react
  /vercel/next.js
  /prisma/prisma
  /drizzle-team/drizzle-orm
  /expressjs/express
  /oven-sh/bun
  /withastro/astro
```

---

## DeepWiki Cheat Sheet

```
Tool: deepwiki_ask_question

Single repo:
  repoName: "facebook/react"
  question: "How does the fiber reconciler work?"

Multi-repo comparison:
  repoName: ["facebook/react", "vuejs/core"]
  question: "How does each framework handle reactivity?"

Structure first:
  Tool: deepwiki_read_wiki_structure
  repoName: "vercel/next.js"
```

---

## Repomix Cheat Sheet

```
Tool: repomix_pack_codebase

Local, focused:
  directory: "/path/to/project"
  compress: true
  includePatterns: "src/**/*.ts"

Local, broad:
  directory: "/path/to/project"
  compress: true

Remote repo:
  Tool: repomix_pack_remote_repository
  remote: "drizzle-team/drizzle-orm"
  compress: true
  includePatterns: "src/**/*.ts"

After packing:
  Tool: repomix_grep_repomix_output
  outputId: "[from pack result]"
  pattern: "export.*function"
  contextLines: 3

  Tool: repomix_read_repomix_output
  outputId: "[from pack result]"
  startLine: 145
  endLine: 200
```

---

## OpenCode Built-in Cheat Sheet

### grep

```
Tool: grep
  pattern: "class.*Manager"
  include: "*.ts"
  path: "src/lib"
```

### read (use offset + limit)

```
Tool: read
  filePath: "/abs/path/to/file.ts"
  offset: 45
  limit: 50

Read first 100 lines:
  offset: 1
  limit: 100

Read lines 200-250:
  offset: 200
  limit: 51
```

### glob

```
Tool: glob
  pattern: "src/lib/**/*.ts"
  path: "/abs/path/to/project"
```

### Bash (ripgrep)

```
Count matches:     rg -c "pattern" path/
Context lines:     rg -C 3 "pattern" path/
File list only:    rg -l "pattern" path/
Invert match:      rg -v "pattern" path/
Case insensitive:  rg -i "pattern" path/
File type:         rg -t ts "pattern" path/
```

---

## Evidence Scoring Quick Reference

| Level | Required For | Alone Sufficient? |
|-------|-------------|-------------------|
| Direct | All claims | Yes — stands alone |
| Correlational | Supporting claims | Need 2+ for key claims |
| Testimonial | Context only | No — must mark "unverified" |
| Absence | Negative claims | Documents search, not proof |

**Key claim rule**: Direct evidence OR 2+ Correlational. Never Testimonial-only.

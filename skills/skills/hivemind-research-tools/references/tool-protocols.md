# Tool Protocols — Per-Provider Execution

Execution protocols for each MCP research provider. Defines what to call, how to interpret results, and how to chain outputs.

## Context7 Protocol

### Resolution Flow

```
1. resolve-library-id(query) → library ID
2. query-docs(libraryId, query) → documentation chunks
```

### Query Formulation

| Research Need | Query Style | Example |
|---|---|---|
| API usage | "How to [verb] [feature]" | "How to use useEffect cleanup" |
| Configuration | "[feature] configuration options" | "Next.js middleware configuration" |
| Behavior | "What happens when [scenario]" | "What happens when useState receives null" |
| Best practices | "[feature] best practices" | "React error boundary best practices" |

### Result Interpretation

- **Code snippets** are high-authority (direct from docs)
- **Version-specific** notes — check if version matches project
- **Cross-reference** with Repomix to verify docs match actual implementation

---

## DeepWiki Protocol

### Query Flow

```
1. read_wiki_structure(repoName) → topic list
2. read_wiki_contents(repoName) → full wiki
3. ask_question(repoName, question) → targeted answer
```

### Best Practices

- Use `ask_question` for specific queries — more focused than reading entire wiki
- DeepWiki synthesizes — it's not raw code, it's interpreted
- Cross-reference with Repomix for ground truth

---

## Repomix Protocol

### Query Flow (Remote)

```
1. repomix_pack_remote_repository(remote, includePatterns) → outputId
2. repomix_read_repomix_output(outputId) → full content
3. repomix_grep_repomix_output(outputId, pattern) → matches
```

### Query Flow (Local)

```
1. repomix_pack_codebase(directory, includePatterns) → outputId
2. Same as remote steps 2-3
```

### Pattern Selection

| Need | Tool | Parameters |
|---|---|---|
| Pack full repo | `pack_remote_repository` | `remote: "owner/repo"` |
| Pack specific files | `pack_remote_repository` | + `includePatterns: "src/**/*.ts"` |
| Search packed code | `grep_repomix_output` | `pattern: "export class"` |
| Read full structure | `read_repomix_output` | `outputId` from pack |

### Deep Patterns

See `references/repomix-ingestion.md` for 6 advanced Repomix patterns (scoped remote, local dev, MCP interactive, XML ingestion, SDK, comparison).

---

## Tavily Protocol

### Query Flow

```
1. tavily_search(query, searchDepth, maxResults) → results
2. tavily_extract(urls) → full page content
3. tavily_crawl(url, maxDepth) → site content
```

### Search Depth Selection

| Depth | Use When | Speed | Quality |
|---|---|---|---|
| `basic` | General queries, quick checks | Fast | Good |
| `advanced` | Deep research, need full content | Slow | Excellent |

### Result Interpretation

- **Snippets** — good for initial discovery
- **Extracted content** — use for detailed analysis
- **Crawled content** — use for site-wide analysis (slow)

---

## Exa Protocol

### Query Flow

```
1. exa_web_search_exa(query, type) → search results
2. exa_get_code_context_exa(query, tokensNum) → code-specific results
```

### Search Types

| Type | Use When | Strength |
|---|---|---|
| `auto` | General queries | Balanced |
| `fast` | Quick fact-check | Speed |
| `deep` | Thorough analysis | Completeness |

### Code Search

Use `exa_get_code_context_exa` for programming-specific queries. It searches GitHub, Stack Overflow, and docs.

---

## Grep (Vercel) Protocol

### Query Flow

```
1. Search with grep-style pattern → file matches
2. Read specific file for context
```

### Query Formulation

| Need | Pattern | Example |
|---|---|---|
| Function definitions | `function <name>` | `function handleError` |
| Class declarations | `class <Name>` | `class ReactComponent` |
| Exports | `export (default )?(function\|class\|const)` | Find all exports |
| Imports | `import.*from ['"]<module>` | Find all imports of a module |

---

## Brave Search Protocol

### Query Flow

```
1. brave_web_search(query) → web results
2. brave_news_search(query) → news results
3. brave_summarizer(key) → AI summary
```

### Result Filtering

- Use `freshness` parameter for recent results (`pd`, `pw`, `pm`, `py`)
- Use `country` for region-specific results
- Use `result_filter` to get specific types (web, news, discussions)

---

## Sequential Thinking Protocol

### Usage

Use for complex reasoning chains where multiple steps of analysis are needed.

```
1. Provide initial thought/problem
2. System generates reasoning chain
3. Each step builds on previous
4. Final step synthesizes conclusion
```

### When to Use

- Complex "why" questions requiring logical deduction
- Multi-step analysis of trade-offs
- Evaluating conflicting evidence

---

## Cross-Provider Chaining

### Standard Chain

```
Repomix (code truth) → Context7 (docs intent) → Synthesis
```

### Verification Chain

```
Context7 (docs claim) → Repomix (verify in code) → Confirm or flag discrepancy
```

### Comparison Chain

```
Repomix-A + Repomix-B (parallel) → Context7-A + Context7-B (parallel) → Tavily (articles) → Synthesis
```

See `hivemind-research-tools/SKILL.md` for full chaining protocol details.

---
name: "hivemind-research-tools"
description: "MCP tool protocols for research execution. Use when setting up MCP providers, chaining tool calls, handling failures with fallback hierarchies, or executing research against codebases, documentation, and web sources. Covers 8 MCP servers, Repomix deep patterns, and anti-pattern prevention."
---

# hivemind-research-tools — MCP Tool Protocols

Protocols for executing research using MCP (Model Context Protocol) providers. Covers provider catalog, setup, execution protocols, chaining strategies, anti-patterns, and fallback hierarchies.

## Use This For

- MCP providers need to be configured or validated
- Research requires codebase analysis via Repomix
- Documentation retrieval via Context7 or DeepWiki needed
- Web search with extraction via Tavily or Exa
- Tool chaining for multi-step research pipelines
- Fallback handling when primary tools fail

> **Cross-reference**: For research methodology, question framing, evidence grading, and confidence scoring, see `hivemind-research-framework/SKILL.md`.

## MCP Provider Catalog (8 Servers)

| Provider | Primary Role | Auth | Setup Complexity |
|---|---|---|---|
| **Context7** | Official library/framework documentation | Endpoint enablement | Low |
| **DeepWiki** | Repository synthesis and source navigation | Endpoint enablement | Low |
| **Repomix** | Local/remote repository packing and analysis | `npx -y repomix --mcp` | Low |
| **Tavily** | Web search with AI extraction | `TAVILY_API_KEY` | Medium |
| **Exa** | Code-focused web search enrichment | `EXA_API_KEY` | Medium |
| **Sequential Thinking** | Multi-step reasoning chains | Endpoint enablement | Low |
| **Grep (Vercel)** | Code search across GitHub repos | Endpoint enablement | Low |
| **Brave Search** | General web search | `BRAVE_API_KEY` | Medium |

### Default Research Stack

For any research request, start with this minimum viable stack:

```
Context7 + DeepWiki + Repomix + Grep(Vercel) + Sequential Thinking
```

Add Tavily/Exa/Brave when web search is specifically needed.

## Setup Protocol

See `references/mcp-setup-guide.md` for step-by-step per-provider setup.

Quick verification: `node scripts/check-mcp-readiness.mjs [config-path]`

## Execution Protocols

See `references/tool-protocols.md` for per-provider execution details.

### General Execution Flow

```
1. Verify provider readiness (check-mcp-readiness.mjs)
2. Select provider based on research type (see Framework classification)
3. Execute query with retry (3 retries: 3s/5s/10s delays)
4. On failure: fallback to next provider in hierarchy
5. Grade evidence from result
6. Chain to next provider if multi-step
```

## Repomix Deep Patterns (6 Patterns)

Repomix is the most versatile research tool — it can analyze local code, remote repos, and produce structured XML for ingestion.

### Pattern 1: Scoped Remote Analysis

Analyze a specific subdirectory of a remote repository without cloning.

```bash
npx repomix --remote user/repo --include "src/**/*.ts"
```

Use when: You need specific files from a remote repo without full clone overhead.

### Pattern 2: Local Development Analysis

Pack the current working directory for codebase understanding.

```bash
npx repomix --output repomix-output.xml
```

Use when: Analyzing the current project's architecture, patterns, or API surface.

### Pattern 3: MCP Interactive Mode

Use Repomix as an MCP server for interactive queries during research.

```
Tool: repomix_pack_remote_repository
  remote: "user/repo"
  includePatterns: "src/**"

Tool: repomix_grep_repomix_output
  pattern: "export (class|interface|function)"
  outputId: "<from pack result>"
```

Use when: Need to search packed repos for specific patterns interactively.

### Pattern 4: XML Ingestion Pipeline

Pack → save XML → grep/search the structured output programmatically.

```
Step 1: repomix_pack_codebase → get outputId
Step 2: repomix_read_repomix_output → get full XML
Step 3: grep/search XML for patterns
Step 4: Extract findings into evidence table
```

Use when: Need structured, repeatable analysis of codebase content.

### Pattern 5: SDK Usage

Use the Repomix SDK for programmatic packing in research automation.

```javascript
import { pack } from 'repomix';

const result = await pack({
  directory: '/path/to/repo',
  include: ['src/**/*.ts'],
  output: { style: 'xml' }
});
```

Use when: Building automated research pipelines that need codebase context.

### Pattern 6: Comparison Analysis

Pack two repos side-by-side to compare architecture, patterns, or API surfaces.

```
Step 1: repomix_pack_remote_repository remote="repo-a"
Step 2: repomix_pack_remote_repository remote="repo-b"
Step 3: Compare output structures, exports, dependencies
Step 4: Generate comparison evidence table
```

Use when: Technology comparison requires examining actual implementation, not just docs.

## Chaining Protocols

### Standard Chain (Most Research)

```
Repomix (code truth) → Context7 (docs intent) → Synthesis
```

Time: 2-5 minutes. Use for: API behavior, library usage, architecture analysis.

### Deep Tech Chain

```
Repomix (code) → Context7 (docs) → DeepWiki (repo synthesis) → Grep (cross-repo) → Exa (blog posts) → Synthesis
```

Time: 5-15 minutes. Use for: Deep technology evaluation, migration planning.

### Comparison Chain

```
Repomix-A + Repomix-B (parallel) → Context7-A + Context7-B (parallel) → Tavily (trade-off articles) → Synthesis
```

Time: 5-10 minutes. Use for: Technology comparison, "X vs Y" questions.

## Anti-Patterns (25+ Cataloged)

See `references/anti-patterns.md` for full catalog with WHY explanations.

Top 5:

| # | Anti-Pattern | WHY It's Harmful |
|---|---|---|
| 1 | Using web search before checking code | Web is outdated; code is ground truth |
| 2 | Single-source conclusion | No corroboration = confidence overstatement |
| 3 | Ignoring provider readiness check | Silent failures produce empty results |
| 4 | Chaining without grading intermediate results | Bad input to next step cascades errors |
| 5 | No fallback on provider failure | Research stalls instead of adapting |

## Fallback Hierarchy

See `references/fallback-hierarchy.md` for decision trees per provider failure.

General fallback order:

```
Context7 fails → DeepWiki → Tavily (web docs)
Repomix fails → Grep(Vercel) → Tavily (web code search)
Tavily fails → Exa → Brave Search
Exa fails → Tavily → Brave Search
All MCP fails → Manual web search via fetcher tools
```

### Retry Contract

- 3 retries per provider: 3s, 5s, 10s delays
- After 3 failures: trigger fallback provider
- Track failure count to prevent infinite loops
- After exhausting all fallbacks: emit low-confidence caveat

## Bundled Resources

| Resource | Path | Content |
|---|---|---|
| MCP Setup Guide | `references/mcp-setup-guide.md` | Step-by-step per-provider setup |
| Tool Protocols | `references/tool-protocols.md` | Execution protocol per tool |
| Anti-Patterns | `references/anti-patterns.md` | 25+ dumb uses with WHY |
| Fallback Hierarchy | `references/fallback-hierarchy.md` | Decision trees for failures |
| Repomix Ingestion | `references/repomix-ingestion.md` | CLI, MCP, XML, grep, SDK reference |
| MCP Config Template | `templates/mcp-config-template.json` | Ready-to-use opencode.json snippet |
| Readiness Check | `scripts/check-mcp-readiness.mjs` | Verify provider availability |

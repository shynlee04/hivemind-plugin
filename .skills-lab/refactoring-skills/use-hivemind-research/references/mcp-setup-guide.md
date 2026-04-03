# MCP Setup Guide — Per-Provider Configuration

Step-by-step setup for each of the 8 MCP research providers.

## Quick Start

1. Add MCP entries to `opencode.json` (use `templates/mcp-config-template.json`)
2. Set required environment variables
3. Run `node scripts/check-mcp-readiness.mjs` to verify

## Provider Setup

### 1. Context7 — Official Documentation

**What it does**: Retrieves official library/framework documentation with code examples.

**Setup**:
```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

**Auth**: None required — endpoint is public.

**Verification**: Call `resolve-library-id` with query `"react"`. Should return library matches.

**Troubleshooting**: If no results, check that the URL is reachable (firewall/proxy issues).

---

### 2. DeepWiki — Repository Synthesis

**What it does**: Provides AI-powered analysis and documentation of GitHub repositories.

**Setup**:
```json
{
  "mcp": {
    "deepwiki": {
      "type": "remote",
      "url": "https://mcp.deepwiki.com/mcp"
    }
  }
}
```

**Auth**: None required.

**Verification**: Call `read_wiki_structure` with `repoName: "facebook/react"`. Should return topic list.

---

### 3. Repomix — Repository Packing

**What it does**: Packs local or remote repositories into structured output for analysis.

**Setup**:
```json
{
  "mcp": {
    "repomix": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"]
    }
  }
}
```

**Auth**: None (local execution).

**Verification**: Call `repomix_pack_remote_repository` with `remote: "user/repo"`. Should return packed output.

**Note**: First run may take time as `npx` downloads the package.

---

### 4. Tavily — AI Web Search

**What it does**: Web search with AI-powered content extraction and summarization.

**Setup**:
```json
{
  "mcp": {
    "tavily": {
      "type": "remote",
      "url": "https://mcp.tavily.com/mcp"
    }
  }
}
```

**Auth**: Set `TAVILY_API_KEY` environment variable. Get key from https://tavily.com/

**Verification**: Call `tavily_search` with query `"latest React release"`. Should return results.

**Rate Limits**: Free tier has daily limits. Monitor usage.

---

### 5. Exa — Code-Aware Search

**What it does**: Web search with code-specific understanding, finds APIs, examples, and documentation.

**Setup**:
```json
{
  "mcp": {
    "exa": {
      "type": "remote",
      "url": "https://mcp.exa.ai/mcp"
    }
  }
}
```

**Auth**: Set `EXA_API_KEY` environment variable. Get key from https://exa.ai/

**Verification**: Call `exa_web_search_exa` with query `"React hooks tutorial"`. Should return results.

---

### 6. Sequential Thinking — Multi-Step Reasoning

**What it does**: Provides structured multi-step reasoning chains for complex analysis.

**Setup**:
```json
{
  "mcp": {
    "sequential-thinking": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Auth**: None (local execution).

**Verification**: Tool should be available as `sequentialthinking` in tool list.

---

### 7. Grep (Vercel) — GitHub Code Search

**What it does**: Search code across GitHub repositories using grep-style patterns.

**Setup**:
```json
{
  "mcp": {
    "grep": {
      "type": "remote",
      "url": "https://mcp.grep.app/mcp"
    }
  }
}
```

**Auth**: None required.

**Verification**: Call search tool with query `"useState" language:react`. Should return code matches.

---

### 8. Brave Search — General Web Search

**What it does**: General web search with news, video, and image capabilities.

**Setup**:
```json
{
  "mcp": {
    "brave-search": {
      "type": "remote",
      "url": "https://mcp.brave.com/mcp"
    }
  }
}
```

**Auth**: Set `BRAVE_API_KEY` environment variable. Get key from https://brave.com/search/api/

**Verification**: Call `brave_web_search` with query `"latest Node.js release"`. Should return results.

---

## Environment Variables Summary

| Variable | Provider | Required | Where to Get |
|---|---|---|---|
| `TAVILY_API_KEY` | Tavily | Yes | https://tavily.com/ |
| `EXA_API_KEY` | Exa | Yes | https://exa.ai/ |
| `BRAVE_API_KEY` | Brave Search | Yes | https://brave.com/search/api/ |

All other providers use public endpoints or local execution — no credentials needed.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Provider not found" | MCP entry missing from config | Add entry to `opencode.json` |
| "Authentication failed" | Missing or invalid API key | Set correct environment variable |
| "Connection refused" | Network/proxy issue | Check firewall, try different network |
| "Tool not available" | Provider loaded but tool not registered | Restart OpenCode after config change |
| Slow first response | `npx` downloading package | Normal for Repomix and Sequential Thinking |

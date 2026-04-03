# Opencode Tool Taxonomy — Complete Reference

What agents underutilize and how to use each tool for deep research.

---

## Complete Tool Registry

Opencode registers tools with this priority order:

| Tool | Kind | Underused Capability | Key Params |
|------|------|---------------------|------------|
| `read` | read | **Offset reading** for large files, directory listing mode | `filePath`, `offset` (1-indexed), `limit` (default 2000) |
| `grep` | search | `include` glob filter, results sorted by mtime | `pattern` (regex), `path`, `include` |
| `glob` | search | Results sorted by mtime (most recent first), 100-file limit | `pattern`, `path` |
| `list` | read | Accepts glob patterns for filtering | `path` |
| `bash` | execute | Full shell — git, curl, jq, sed, awk, piping | `command`, `description` |
| `webfetch` | fetch | `format`: text/markdown/html, timeout control | `url`, `format`, `timeout` |
| `websearch` | search | `type`: auto/fast/deep, `livecrawl`: fallback/preferred | `query`, `numResults`, `type` |
| `codesearch` | search | **Exa Code API** for npm/library docs, 1K-50K tokens | `query`, `tokensNum` |
| `lsp` | other | **9 operations** — experimental, needs env flag | `operation`, `filePath`, `line`, `character` |
| `skill` | other | Loads `SKILL.md` + bundled files into context | `name` |
| `task` | other | Subagent delegation with `task_id` resume | `prompt`, `description`, `subagent_type`, `task_id` |
| `batch` | other | **Parallel tool execution**, 1-25 calls | `tool_calls[]` |
| `apply_patch` | edit | Multi-file atomic patches with LSP diagnostics | `patchText` |
| `edit` | edit | Surgical line edits | `filePath`, ... |
| `write` | edit | Create/overwrite files | `filePath`, `content` |
| `todowrite` | other | Persistent task tracking across turns | `todos[]` |

---

## Read Tool — Offset Reading

The `ReadTool` has a 50KB byte cap and 2000-line default limit. When truncated, it explicitly tells the agent to use `offset`:

```
Output capped at 50 KB. Showing lines 1-847. Use offset=848 to continue.
Showing lines 1-2000 of 5432. Use offset=2001 to continue.
```

**Orchestrator instruction pattern:**
```
Read the file at /path/to/large-file.ts. If truncated, continue reading 
with offset= as indicated until you have the complete picture of [specific 
section/function/class]. Report back the full content of [target].
```

---

## LSP Tool — 9 Operations

Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` (or `OPENCODE_EXPERIMENTAL=true`).

| Operation | Research Use Case |
|-----------|------------------|
| `goToDefinition` | Trace where a type/function is actually defined |
| `findReferences` | Find all callers/consumers of a symbol |
| `hover` | Get type signature without reading full file |
| `documentSymbol` | List all symbols in a file (classes, functions, exports) |
| `workspaceSymbol` | Search symbols across entire workspace |
| `goToImplementation` | Find concrete implementations of interfaces |
| `prepareCallHierarchy` | Set up call hierarchy analysis |
| `incomingCalls` | Who calls this function? |
| `outgoingCalls` | What does this function call? |

**Orchestrator instruction pattern:**
```
Use the LSP tool to trace the call hierarchy of `delegateTask` in 
src/delegation/manager.ts. First use documentSymbol to find the line number, 
then use incomingCalls and outgoingCalls to map the full call graph. 
Report the dependency chain.
```

**Call hierarchy trace sequence:**
```
1. documentSymbol → find the symbol and its line number
2. prepareCallHierarchy → set up the hierarchy at that position
3. incomingCalls → who calls this?
4. outgoingCalls → what does this call?
```

---

## CodeSearch — npm/Library Documentation on Demand

Uses Exa Code API — no API key needed. Returns code examples, docs, and API references for any library/SDK.

**Key insight:** `tokensNum` is adjustable from 1,000 to 50,000. Default 5,000 is often too low for comprehensive library research.

```
codesearch({ query: "zod schema validation advanced patterns discriminated unions", tokensNum: 20000 })
codesearch({ query: "Model Context Protocol SDK server tool registration TypeScript", tokensNum: 15000 })
codesearch({ query: "Tree-sitter TypeScript parser AST node types", tokensNum: 10000 })
```

---

## WebSearch vs WebFetch

| | `websearch` | `webfetch` |
|---|---|---|
| Purpose | **Discovery** — find what exists | **Retrieval** — get specific content |
| Backend | Exa AI MCP | Direct HTTP fetch |
| Auth | None needed | None needed |
| Key params | `query`, `type` (auto/fast/deep), `numResults` | `url`, `format` (text/markdown/html) |

**Research chain pattern:**
```
1. websearch({ query: "hivemind plugin architecture patterns", type: "deep" })
2. webfetch({ url: "<best result URL>", format: "markdown" })
3. codesearch({ query: "<specific API from the article>", tokensNum: 15000 })
```

---

## Batch Tool — Parallel Tool Execution

The `batch` tool executes 1-25 tool calls concurrently. This is **intra-agent parallelism** (complement to Task's inter-agent parallelism).

Enable with `experimental.batch_tool: true` in config.

```json
[
  {"tool": "read", "parameters": {"filePath": "/path/to/src/core/index.ts", "limit": 500}},
  {"tool": "read", "parameters": {"filePath": "/path/to/src/delegation/manager.ts", "limit": 500}},
  {"tool": "read", "parameters": {"filePath": "/path/to/src/intelligence/engine.ts", "limit": 500}},
  {"tool": "grep", "parameters": {"pattern": "export class.*Plugin", "path": "/path/to/src"}},
  {"tool": "grep", "parameters": {"pattern": "implements.*Interface", "path": "/path/to/src"}}
]
```

---

## Apply Patch — Iterative Document Updates

The `apply_patch` tool supports multi-file atomic patches with add/update/delete/move operations and automatic LSP diagnostics after application.

**For iterative synthesis documents:**
```
apply_patch({
  patchText: `*** Begin Patch
*** Update File: .opencode/research/hivemind-architecture.md
@@@ --- a/.opencode/research/hivemind-architecture.md
+++ b/.opencode/research/hivemind-architecture.md
@@ Section: Delegation Layer @@
-TODO: Map delegation patterns
+## Delegation Layer
+
+### Core Classes
+- DelegationManager (src/delegation/manager.ts:45)
+- TaskRouter (src/delegation/router.ts:12)
*** End Patch`
})
```

---

## Context7 MCP — Library Documentation Search

Opencode recognizes `context7_resolve_library_id` and `context7_get_library_docs` as search-kind tools.

Configure in `opencode.json`:
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

**Usage pattern:** Add `use context7` to prompts, or put in `AGENTS.md`:
```md
When you need to search docs, use `context7` tools.
```

---

## Agent Architecture

Opencode has 4 native visible agents + hidden utility agents:

| Agent | Mode | Tools | Purpose |
|-------|------|-------|---------|
| `build` | primary | All (with question, plan_enter) | Default coding agent |
| `plan` | primary | Read-only + plan files | Planning mode, no edits |
| `general` | subagent | All except todo | Multi-step autonomous tasks |
| `explore` | subagent | grep, glob, list, bash, read, webfetch, websearch, codesearch | **Read-only codebase exploration** |
| `compaction` | primary (hidden) | None | Context compaction |
| `title` | primary (hidden) | None | Title generation |
| `summary` | primary (hidden) | None | Summary generation |

The `explore` agent is the key research subagent — it has read-only permissions and access to all search/fetch tools.

---

## Shell Output Chaining for Research

```bash
# Git archaeology — find most-changed files (hot spots)
git log --since="6 months ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -30

# Find all cross-repo imports
grep -rn "from.*@opencode\|from.*@hivemind\|from.*openagent" src/ --include="*.ts"

# Dependency graph via package.json
cat package.json | jq '.dependencies + .devDependencies | keys[]' | sort

# Find circular dependencies
npx madge --circular src/index.ts

# Git blame for understanding ownership
git blame --line-porcelain src/delegation/manager.ts | grep "^author " | sort | uniq -c | sort -rn

# Diff between branches for refactoring scope
git diff main..v2.9.5-detox-dev --stat
git diff main..v2.9.5-detox-dev -- src/delegation/
```

---

## Auto-Parsed Prompting & Command Chaining

Opencode supports slash commands via Task tool:

```
Task(description="Run custom check", prompt="/check-architecture src/delegation/", subagent_type="general")
```

Custom modes can restrict tool access for research-only sessions:

```json
{
  "mode": {
    "research": {
      "prompt": "{file:./prompts/research-protocol.txt}",
      "tools": {
        "write": false, "edit": false, "bash": true,
        "read": true, "grep": true, "glob": true,
        "list": true, "webfetch": true, "websearch": true
      }
    }
  }
}
```

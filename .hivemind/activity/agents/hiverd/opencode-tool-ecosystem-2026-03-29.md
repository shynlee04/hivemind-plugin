# OpenCode Tool Ecosystem Catalog

**Research Date:** 2026-03-29
**Sources:** Local SDK reference (`.sdk-lib/opencode/opencode-built-in-tools.md`), Official OpenCode docs (https://opencode.ai/docs/tools/), LSP docs, Permissions docs, Custom Tools docs, MCP docs, SDK docs, Agents docs, web search
**Confidence:** HIGH (primary sources confirmed identical; web docs dated 2026-03-26)
**Gaps:** `.repo-sdk-packed/opencode-api-sdk.xml` was referenced but not present on disk — NOT VERIFIED

---

## Executive Summary

OpenCode provides **13 built-in tools** across 7 functional groups. All tools use ripgrep under the hood for search operations (grep, glob, list). The LSP tool is experimental and requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`. Custom tools are TypeScript-first but can invoke any language. MCP servers integrate external capabilities.

---

## Primary Source Provenance

| Source | Status | Freshness |
|--------|--------|-----------|
| `.sdk-lib/opencode/opencode-built-in-tools.md` | ✅ Exists | 276 lines, matches web exactly |
| `.repo-sdk-packed/opencode-api-sdk.xml` | ❌ NOT FOUND | — |
| https://opencode.ai/docs/tools/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/lsp/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/permissions/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/custom-tools/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/mcp-servers/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/sdk/ | ✅ Fetched | Updated Mar 26, 2026 |
| https://opencode.ai/docs/agents/ | ✅ Fetched | Updated Mar 26, 2026 |

---

## Tools Catalog

### 1. `bash`

| Field | Value |
|-------|-------|
| **Group** | execution |
| **Permission Key** | `bash` |
| **What It Does** | Executes shell commands in the project environment (npm, git, etc.) |
| **When To Use** | Running build tools, git operations, package managers, compilation, running tests, any CLI operation not covered by other tools |
| **When NOT To Use** | File operations (use read/edit/write instead); searching file contents (use grep); finding files by name (use glob/list); when permission is denied |
| **Fallback** | No direct fallback — if bash is denied, file operations and code intelligence must use other tools |
| **Example Command** | `bash { "command": "npm run build && npm test" }` |
| **Rate/Cost Considerations** | Subject to doom_loop detection (3x identical = blocked); permissions can restrict to specific command prefixes (e.g., `"git *": "allow"`) |
| **Skill Integration** | `bash-master`, `bash-pro`, `git-advanced-workflows` — any skill needing shell execution |

---

### 2. `edit`

| Field | Value |
|-------|-------|
| **Group** | write |
| **Permission Key** | `edit` (covers edit, write, patch, multiedit) |
| **What It Does** | Modifies existing files using exact string replacements |
| **When To Use** | Changing specific lines/blocks in existing files; applying targeted fixes; refactoring |
| **When NOT To Use** | Creating new files (use write); applying unified diffs/patches (use patch); full file rewrites (use write with caution) |
| **Fallback** | `write` (overwrites entire file) if edit fails on exact match |
| **Example Command** | `edit { "filePath": "src/index.ts", "oldString": "const x = 1", "newString": "const x = 2" }` |
| **Rate/Cost Considerations** | Requires exact string match — whitespace matters; case-sensitive |
| **Skill Integration** | `refactor`, `clean-code`, `tdd`, `review-and-refactor` — any skill modifying code |

---

### 3. `write`

| Field | Value |
|-------|-------|
| **Group** | write |
| **Permission Key** | `edit` |
| **What It Does** | Creates new files or overwrites existing ones entirely |
| **When To Use** | Creating new source files; generating documentation; outputting artifacts; overwriting configs |
| **When NOT To Use** | Modifying specific lines in existing files (use edit); applying patches (use patch) |
| **Fallback** | `edit` for partial modifications to avoid full overwrite |
| **Example Command** | `write { "content": "export const x = 1\n", "filePath": "src/new-file.ts" }` |
| **Rate/Cost Considerations** | **DESTRUCTIVE** — overwrites existing files without confirmation; always reads before writing |
| **Skill Integration** | `skill-development`, `command-creator`, `doc-prd` — any skill creating files |

---

### 4. `read`

| Field | Value |
|-------|-------|
| **Group** | read |
| **Permission Key** | `read` |
| **What It Does** | Reads file contents with optional line range support (offset/limit) |
| **When To Use** | Inspecting file contents; reading specific sections; code review; understanding implementation |
| **When NOT To Use** | Searching across many files (use grep); finding files by pattern (use glob); when .env files are involved (denied by default) |
| **Fallback** | `bash { "command": "cat file" }` as last resort (but subject to bash permissions) |
| **Example Command** | `read { "filePath": "src/core/trajectory.ts", "offset": 1, "limit": 100 }` |
| **Rate/Cost Considerations** | Supports line ranges for large files; .env files denied by default; external_directory paths require explicit allow |
| **Skill Integration** | `context-map`, `repomix-explorer`, `use-hivemind-codemap` — any skill needing file inspection |

---

### 5. `grep`

| Field | Value |
|-------|-------|
| **Group** | search |
| **Permission Key** | `grep` |
| **What It Does** | Fast regex content search across codebase using ripgrep under the hood |
| **When To Use** | Finding function calls, variable usages, regex patterns; cross-file search; searching with regex syntax |
| **When NOT To Use** | Finding files by name (use glob/list); when .gitignore-filtered results are needed; when you need only file names not content |
| **Fallback** | `bash { "command": "rg pattern" }` (but ripgrep has more smarts with ignore) |
| **Example Command** | `grep { "pattern": "function\\s+getTrajectory", "path": "src/", "include": "*.ts" }` |
| **Rate/Cost Considerations** | Respects .gitignore by default; use .ignore file to include extra paths (e.g., `!node_modules/`) |
| **Skill Integration** | `finding-duplicate-functions`, `code-review`, `repomix-explorer` — any skill needing content search |

---

### 6. `glob`

| Field | Value |
|-------|-------|
| **Group** | search |
| **Permission Key** | `glob` |
| **What It Does** | Finds files by glob pattern matching (e.g., `**/*.ts`), returns paths sorted by modification time |
| **When To Use** | Finding all files of a type (e.g., `**/*.test.ts`); discovering project structure; locating config files |
| **When NOT To Use** | When you need file contents not just paths (use grep); when you need directory listing (use list) |
| **Fallback** | `list` for directory traversal; `glob` in bash (less efficient) |
| **Example Command** | `glob { "pattern": "src/**/*.ts" }` |
| **Rate/Cost Considerations** | Respects .gitignore; uses ripgrep under the hood |
| **Skill Integration** | `context-map`, `planning-with-files`, `use-hivemind-codemap` — any skill discovering files |

---

### 7. `list`

| Field | Value |
|-------|-------|
| **Group** | search |
| **Permission Key** | `list` |
| **What It Does** | Lists directory contents, optionally filtered by glob patterns |
| **When To Use** | Exploring directory structure; getting immediate children of a directory; discovering workspace layout |
| **When NOT To Use** | Finding files recursively across subdirs (use glob); searching file contents (use grep) |
| **Fallback** | `bash { "command": "ls -la" }` (less structured) |
| **Example Command** | `list { "filePath": "src/tools/" }` |
| **Rate/Cost Considerations** | Subject to external_directory permissions for paths outside workspace |
| **Skill Integration** | `context-map`, `use-hivemind-codemap` — any skill exploring directory structure |

---

### 8. `patch`

| Field | Value |
|-------|-------|
| **Group** | write |
| **Permission Key** | `edit` |
| **What It Does** | Applies patch/diff files to the codebase |
| **When To Use** | Applying unified diffs; applying changes from code review; applying automated refactoring output |
| **When NOT To Use** | Single-file targeted edits (use edit); full file writes (use write); when patch format is unavailable |
| **Fallback** | `edit` for single-file edits; `write` for full overwrite |
| **Example Command** | `patch { "patch": "--- a/file.ts\n+++ b/file.ts\n@@ -1,3 +1,3 @@\n const x = 1\n-const y = 2\n+const y = 3\n" }` |
| **Rate/Cost Considerations** | Less commonly used; primarily for automated/review workflows |
| **Skill Integration** | `git-advanced-workflows` (patch application) |

---

### 9. `lsp` (experimental)

| Field | Value |
|-------|-------|
| **Group** | lsp |
| **Permission Key** | `lsp` |
| **What It Does** | Provides code intelligence via Language Server Protocol — definitions, references, hover, symbols, call hierarchy |
| **When To Use** | Finding symbol definitions; tracking all references to a symbol; understanding call graphs; document structure analysis |
| **When NOT To Use** | When LSP server not configured for the language; when you need regex search (use grep); experimental flag required |
| **Fallback** | `grep` for references (less precise); `read` + manual analysis for definitions |
| **Example Command** | `lsp { "operation": "goToDefinition", "filePath": "src/core/trajectory.ts", "position": { "line": 42, "character": 5 } }` |
| **Supported Operations** | `goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, `outgoingCalls` |
| **Rate/Cost Considerations** | Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`; requires appropriate LSP server installed for the language; auto-starts when file extension matches enabled servers |
| **Skill Integration** | `code-architecture-review`, `finding-duplicate-functions`, `refactor` — skills needing semantic code understanding |

---

### 10. `skill`

| Field | Value |
|-------|-------|
| **Group** | meta |
| **Permission Key** | `skill` |
| **What It Does** | Loads a SKILL.md file and injects its content into the conversation |
| **When To Use** | Activating domain-specific guidance; loading skill instructions for specialized tasks; capability extension |
| **When NOT To Use** | When the skill is already loaded; for simple lookups (inline answer is faster) |
| **Fallback** | Direct inline knowledge if skill unavailable |
| **Example Command** | `skill { "name": "use-hivemind-tdd" }` |
| **Rate/Cost Considerations** | Skills can be loaded per-turn for granular control; skill content adds to context |
| **Skill Integration** | **Meta-skill** — referenced by virtually all HiveMind skills |

---

### 11. `todowrite`

| Field | Value |
|-------|-------|
| **Group** | meta |
| **Permission Key** | `todowrite` |
| **What It Does** | Creates and updates task lists for tracking multi-step operations |
| **When To Use** | Complex multi-step workflows requiring progress tracking; orchestrating subagent tasks |
| **When NOT To Use** | Subagents by default (disabled unless enabled); simple single-step tasks |
| **Fallback** | Manual tracking; session notes |
| **Example Command** | `todowrite { "action": "create", "title": "Implement feature X", "taskId": "task-1" }` |
| **Rate/Cost Considerations** | Disabled for subagents by default; requires explicit agent permission override |
| **Skill Integration** | `planning-with-files`, `breakdown-plan`, `bmad-product-planning` — any task orchestration skill |

---

### 12. `webfetch`

| Field | Value |
|-------|-------|
| **Group** | web |
| **Permission Key** | `webfetch` |
| **What It Does** | Fetches and reads web pages from specific URLs |
| **When To Use** | Retrieving specific documentation; reading a known URL; fetching API specs; accessing release notes |
| **When NOT To Use** | When you don't know the URL (use websearch); for discovery/ exploration |
| **Fallback** | `websearch` + `webfetch` combo for unknown URLs |
| **Example Command** | `webfetch { "url": "https://opencode.ai/docs/tools/", "format": "markdown" }` |
| **Rate/Cost Considerations** | Subject to URL pattern permissions; can be allowed/denied per domain |
| **Skill Integration** | `use-hivemind-research`, `deep-research`, `knowledge-synthesis` — any research skill |

---

### 13. `websearch`

| Field | Value |
|-------|-------|
| **Group** | web |
| **Permission Key** | `websearch` |
| **What It Does** | Searches the web using Exa AI for discovery and research |
| **When To Use** | Finding current information; researching topics; discovering resources; news/events; anything beyond training data |
| **When NOT To Use** | When you have the specific URL (use webfetch); for code search (use grep/glob) |
| **Fallback** | `webfetch` with known URLs |
| **Example Command** | `websearch { "query": "OpenCode LSP tool configuration 2026", "count": 10 }` |
| **Rate/Cost Considerations** | Requires OpenCode provider OR `OPENCODE_ENABLE_EXA=true`; no API key needed (direct Exa integration); available MCP: `codesearch` permission key for MCP web search |
| **Skill Integration** | `use-hivemind-research`, `deep-research`, `exa_web_search_exa` — any discovery/research skill |

---

### 14. `question`

| Field | Value |
|-------|-------|
| **Group** | meta |
| **Permission Key** | `question` |
| **What It Does** | Asks the user questions during execution with options for selection |
| **When To Use** | Gathering requirements; clarifying ambiguous instructions; user preference; implementation decisions |
| **When NOT To Use** | When instructions are clear; during automated subagent runs; when user already provided all info |
| **Fallback** | Assume sensible defaults and proceed; or escalate to user before proceeding |
| **Example Command** | `question { "header": "Confirm action", "question": "Which approach should I take?", "options": [{ "label": "Option A" }, { "label": "Option B" }] }` |
| **Rate/Cost Considerations** | Blocks execution until user responds; use sparingly in automated workflows |
| **Skill Integration** | `brainstorming`, `use-hivemind-planning` — skills needing user input clarification |

---

## Cross-Tool Decision Matrix

| Scenario | Primary Tool | Fallback | Never Use |
|----------|-------------|----------|-----------|
| Find all TypeScript files | `glob` | `list` (manual) | `grep` (wrong tool) |
| Search for regex pattern in code | `grep` | `bash` + rg | `read` (too slow) |
| Read lines 50-100 of a file | `read` (offset/limit) | `bash` + sed | `grep` (no line range) |
| Find files named "test*" | `glob` | `list` + grep | `grep` (searches content) |
| List directory contents | `list` | `bash` + ls | `glob` (wrong output) |
| Edit specific text in file | `edit` | `write` (full overwrite) | `patch` (overkill) |
| Create new file | `write` | — | `edit` (requires existing) |
| Apply a unified diff | `patch` | `edit` manually | `write` (overwrites) |
| Run npm build | `bash` | — | Any other tool |
| Git operations | `bash` (git *) | GitHub MCP | `edit` (wrong purpose) |
| Find where symbol is defined | `lsp` goToDefinition | `grep` (less precise) | `read` (scanning blind) |
| Find all usages of symbol | `lsp` findReferences | `grep` (broader) | `read` (scanning blind) |
| Get call hierarchy | `lsp` prepareCallHierarchy + incomingCalls/outgoingCalls | `grep` (manual reconstruction) | `read` (can't infer) |
| Get document structure | `lsp` documentSymbol | `grep` for patterns | `list` (wrong purpose) |
| Search workspace symbols | `lsp` workspaceSymbol | `grep` (less structured) | `glob` (name-based only) |
| Load a skill | `skill` | Read SKILL.md manually | Any other tool |
| Track task progress | `todowrite` | Manual notes | `write` (no tracking) |
| Fetch docs from known URL | `webfetch` | `websearch` first | `question` (wrong purpose) |
| Discover unknown resource | `websearch` | `webfetch` with guess URL | `grep` (local only) |
| Ask user for preference | `question` | Proceed with default | Any automated tool |
| Access external DB/API | MCP server | Custom tool | Built-in tools insufficient |
| Execute cross-platform script | `bash` | Custom tool | Any tool requiring specific file path |

---

## LSP Tools Deep-Dive

### Architecture

The `lsp` tool is a unified interface to Language Server Protocol servers. It requires:
- `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` (or `OPENCODE_EXPERIMENTAL=true`)
- Appropriate LSP server installed for the target language
- File extension auto-detection triggers LSP server startup

**Auto-installed LSP servers (37 total):** astro, bash, clangd, csharp, clojure-lsp, dart, deno, elixir-ls, eslint, fsharp, gleam, gopls, hls, jdtls, julials, kotlin-ls, lua-ls, nixd, ocaml-lsp, oxlint, php intelephense, prisma, pyright, ruby-lsp, rust-analyzer, sourcekit-lsp, svelte, terraform, tinymist, typescript, vue, yaml-ls, zls

### Operation Comparison

#### `goToDefinition` vs `grep` for Definitions

| Aspect | `goToDefinition` | `grep` |
|--------|-----------------|--------|
| **Precision** | Semantic — jumps to actual declaration | Syntactic — may match comments or strings |
| **Cross-file** | Yes (LSP handles imports) | Yes (with -r) |
| **Type-aware** | Yes (understands scopes, shadowing) | No (regex may false-match) |
| **Performance** | O(1) lookup via index | O(n) full scan |
| **Language Support** | Only if LSP server available | Universal (any text file) |
| **Output** | Direct file:line:character | Match with context lines |

**When goToDefinition wins:** TypeScript interfaces, class methods, imported symbols, overloaded functions
**When grep wins:** Comments referencing a name, string literals, no LSP server available

#### `findReferences` vs `grep`

| Aspect | `findReferences` | `grep` |
|--------|-----------------|--------|
| **Precision** | Semantic — actual symbol references | Syntactic — any text match |
| **Excludes** | Shadowed variables, different scopes | Matches strings, comments, unrelated symbols |
| **Cross-project** | Yes (workspace-aware) | Only within scanned paths |
| **Performance** | Indexed | Full scan |
| **Output** | File + line + context + usage kind | File + line + matched text |

**Example:** `grep "getTrajectory"` returns 50 matches including comments, strings, and unrelated `getTrajectory` functions. `findReferences` on the actual symbol returns only actual call sites.

#### `prepareCallHierarchy` + `incomingCalls`/`outgoingCalls`

This combination enables **call graph analysis**:

```
prepareCallHierarchy → "traverse" → 
  outgoingCalls (what this function calls)
  incomingCalls (who calls this function)
```

**Practical use cases:**
- Finding dead code (never incoming = orphan)
- Tracing data flow (incoming → outgoing chain)
- Security analysis (who can reach this sensitive function)
- Refactoring impact assessment (what breaks if I change this)

**Performance note:** Call hierarchy operations are more expensive than symbol lookups. Use sparingly on large codebases.

#### `documentSymbol` vs `workspaceSymbol`

| Aspect | `documentSymbol` | `workspaceSymbol` |
|--------|-----------------|-------------------|
| **Scope** | Single file | Entire workspace |
| **Content** | Full hierarchy (classes, methods, imports) | Top-level symbols only |
| **Performance** | Fast (one file) | Slower (searches all indexed files) |
| **Use case** | "What is in this file?" | "Where is the User class defined?" |

---

## Permission Architecture

Permissions use pattern matching with wildcards (`*`, `?`). Key rules:

| Permission Key | Defaults | Special Rules |
|---------------|----------|---------------|
| `read` | allow (except `.env` files) | Pattern-matched to file path |
| `edit` | allow | Covers edit, write, patch, multiedit |
| `bash` | allow | Pattern-matched to command string |
| `grep` | allow | Pattern-matched to regex |
| `glob` | allow | Pattern-matched to glob pattern |
| `list` | allow | Pattern-matched to directory path |
| `lsp` | allow | Non-granular (all or nothing) |
| `webfetch` | allow | Pattern-matched to URL |
| `websearch` | allow | Pattern-matched to query |
| `skill` | allow | Pattern-matched to skill name |
| `todowrite` | allow | Non-granular |
| `external_directory` | ask | Paths outside workspace |
| `doom_loop` | ask | Same tool × 3 identical calls |

**Granular bash example:**
```json
{
  "bash": {
    "*": "ask",
    "git *": "allow",
    "npm *": "allow",
    "rm *": "deny"
  }
}
```

---

## MCP Servers vs Custom Tools

### MCP Servers

- **Protocol:** Model Context Protocol
- **Use for:** External services (GitHub, Sentry, database), API integrations, third-party capabilities
- **Context cost:** HIGH — each MCP server adds tools to context; can exceed limits
- **Auth:** OAuth auto-handled or API keys via headers
- **Configuration:** Remote (URL) or Local (command execution)

**Notable MCP servers documented:**
- Sentry (issue tracking)
- Context7 (documentation search)
- Grep by Vercel (GitHub code search)

### Custom Tools

- **Language:** TypeScript/JavaScript for definition; any language for execution
- **Use for:** Project-specific operations; database queries; internal APIs
- **Context cost:** Lower than MCP (project-scoped)
- **Location:** `.opencode/tools/` (project) or `~/.config/opencode/tools/` (global)
- **Pattern:** `tool()` helper from `@opencode-ai/plugin`

---

## Internal Implementation Notes

- `grep`, `glob`, `list` use **ripgrep** under the hood
- ripgrep **respects .gitignore** by default
- To override: create `.ignore` file with `!path/to/include` patterns
- LSP servers auto-start when file extension matches detected

---

## Gaps Found

| Gap | Severity | Note |
|-----|----------|------|
| `.repo-sdk-packed/opencode-api-sdk.xml` not present | MEDIUM | Referenced in AGENTS.md but doesn't exist on disk |
| LSP tool is experimental | LOW | Noted as requiring flag; behavior may change |
| `patch` tool documentation is minimal | LOW | Only described as "applying patches" — no argument details |
| `todowrite` subagent disable default | LOW | Documented but no detail on how to enable |
| Multi-edit pattern (bulk edits) | LOW | Mentioned in permissions but not as a distinct tool |
| No documented rate limits for web tools | LOW | `websearch` uses Exa directly; no OpenCode-specific limits found |

---

## Output Summary

```json
{
  "tools_cataloged": 14,
  "per_tool": { ... 14 tool entries above ... },
  "decision_matrix": [ ... 20 scenarios ... ],
  "lsp_deep_dive": {
    "goToDefinition_vs_grep": "semantic vs syntactic, indexed vs scan",
    "findReferences_vs_grep": "symbol-aware vs text-match, excludes shadowing",
    "callHierarchy": "prepareCallHierarchy + incomingCalls/outgoingCalls for call graphs",
    "documentSymbol_vs_workspaceSymbol": "single-file full hierarchy vs workspace top-level search",
    "performance": "LSP is O(1) indexed lookup; grep is O(n) full scan; call hierarchy is most expensive"
  },
  "gaps_found": [
    ".repo-sdk-packed/opencode-api-sdk.xml NOT_FOUND",
    "patch tool arg details undocumented",
    "todowrite subagent enable mechanism undocumented"
  ],
  "blocked_routes": [],
  "recommended_next_action": "Write this catalog to .hivemind/activity/agents/hiverd/opencode-tool-ecosystem-2026-03-29.md. Next: validate LSP deep-dive claims against actual LSP behavior in a live OpenCode session with experimental flag enabled."
}
```

---

## Source Citations

1. `.sdk-lib/opencode/opencode-built-in-tools.md` — Local authoritative reference (276 lines, fetched 2026-03-29)
2. `https://opencode.ai/docs/tools/` — Official tools page (last updated Mar 26, 2026)
3. `https://opencode.ai/docs/lsp/` — LSP configuration docs (Mar 26, 2026)
4. `https://opencode.ai/docs/permissions/` — Permissions system (Mar 26, 2026)
5. `https://opencode.ai/docs/custom-tools/` — Custom tool authoring (Mar 26, 2026)
6. `https://opencode.ai/docs/mcp-servers/` — MCP server integration (Mar 26, 2026)
7. `https://opencode.ai/docs/sdk/` — JS/TS SDK reference (Mar 26, 2026)
8. `https://opencode.ai/docs/agents/` — Agent configuration (Mar 26, 2026)
9. Web search results — Current community feedback on tool behavior (2026-03-29)

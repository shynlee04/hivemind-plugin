# Orchestration Prompt Templates

Ready-to-use templates for research orchestration. Copy, adapt, and fill in the bracketed placeholders.

---

## Template: Initial Framing

```
You are conducting a deep codebase research audit. DO NOT modify any files 
except in .opencode/research/. Follow this protocol:

1. FRAME: Use repomix pack_codebase (compressed) on the target directory.
   Read the directory structure and metrics from the response.
   Use grep_repomix_output to locate entry points (index.ts, main exports).

2. MAP: Launch parallel explore subagents to map each major module.
   Each agent should return: file list, key exports, class hierarchy, 
   dependency imports.

3. TRACE: Use LSP (if available) or grep to trace cross-module dependencies.
   Use codesearch/websearch for external library documentation.

4. SYNTHESIZE: Write findings to .opencode/research/<topic>.md using apply_patch.
   Generate a skill using repomix generate_skill for persistent reference.

Current target: [REPO_PATH]
Focus area: [SPECIFIC_SUBSYSTEM]
```

---

## Template: Subagent Research Delegation

```
Task(
  description="Map [MODULE_NAME] architecture",
  subagent_type="explore",
  prompt=`RESEARCH ONLY - no file modifications.

  Target: [REPO_PATH]/src/[MODULE]/
  
  Execute these steps:
  1. glob({ pattern: "**/*.ts", path: "[REPO_PATH]/src/[MODULE]" })
  2. For each key file, grep for exports: grep({ pattern: "^export", path: "[file]" })
  3. Read the main entry point with read({ filePath: "[entry]", limit: 200 })
  4. If files are large, use offset reading to get specific sections
  
  Return a structured report:
  - File tree with descriptions
  - Key exports and their types
  - Import dependencies (what this module depends on)
  - Exported APIs (what other modules consume)
  - Patterns observed (singleton, factory, observer, etc.)
  `
)
```

---

## Template: Cross-Repo Dependency Tracing

```
Task(
  description="Trace MCP integration across repos",
  subagent_type="explore",
  prompt=`RESEARCH ONLY.

  I have already packed these repos:
  - hivemind-plugin outputId: [ID1]
  - oh-my-openagent outputId: [ID2]
  
  Use grep_repomix_output on both outputs to find:
  1. All MCP server registrations: pattern "registerTool|McpServer|mcp"
  2. All tool definitions: pattern "Tool\\.define|registerTool"
  3. All plugin hooks: pattern "hook|lifecycle|register|dispose"
  
  Cross-reference the patterns. Report:
  - Shared abstractions between repos
  - Divergent implementations
  - Integration points where one repo could adopt patterns from another
  `
)
```

---

## Template: LSP Call Hierarchy Trace

```
Use the LSP tool to trace the call hierarchy of `[FUNCTION_NAME]` in 
[REPO_PATH]/src/[MODULE]/[FILE].ts:

1. Use documentSymbol to find the line number of `[FUNCTION_NAME]`
2. Use prepareCallHierarchy at that position
3. Use incomingCalls — who calls this function?
4. Use outgoingCalls — what does this function call?

Report the full dependency chain as a tree structure.
```

---

## Template: Parallel Batch Read + Grep

```json
[
  {"tool": "read", "parameters": {"filePath": "[REPO_PATH]/src/[FILE_A].ts", "limit": 500}},
  {"tool": "read", "parameters": {"filePath": "[REPO_PATH]/src/[FILE_B].ts", "limit": 500}},
  {"tool": "read", "parameters": {"filePath": "[REPO_PATH]/src/[FILE_C].ts", "limit": 500}},
  {"tool": "grep", "parameters": {"pattern": "export class|export interface|export type", "path": "[REPO_PATH]/src/[MODULE]"}},
  {"tool": "grep", "parameters": {"pattern": "import.*from.*[DEPENDENCY]", "path": "[REPO_PATH]/src"}}
]
```

---

## Template: Disk-Based Synthesis Chain

```
Cycle 1 — Survey:
  pack_codebase({ directory: "[REPO_PATH]", compress: true })
  → Read output, note directory structure, file count, token count
  → Write .opencode/research/01-survey.md

Cycle 2 — Deep Dive (parallel):
  Task(description="Map module A", subagent_type="explore", prompt="[template above]")
  Task(description="Map module B", subagent_type="explore", prompt="[template above]")
  Task(description="Map module C", subagent_type="explore", prompt="[template above]")
  → Collect outputs
  → Write .opencode/research/02-modules.md

Cycle 3 — Cross-Reference:
  read .opencode/research/02-modules.md
  pack_remote_repository for external dependencies
  codesearch({ query: "[library] [specific API]", tokensNum: 15000 })
  → Write .opencode/research/03-cross-deps.md

Cycle 4 — Persist:
  read .opencode/research/03-cross-deps.md
  generate_skill({ directory: "[REPO_PATH]", skillName: "[topic]-reference", compress: true })
  → Write .opencode/research/04-synthesis.md
```

---

## Template: Research Protocol for opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "read": "allow",
    "grep": "allow",
    "glob": "allow",
    "list": "allow",
    "bash": "allow",
    "webfetch": "allow",
    "websearch": "allow",
    "codesearch": "allow",
    "skill": "allow",
    "lsp": "allow",
    "edit": "allow"
  },
  "experimental": {
    "batch_tool": true
  },
  "mcp": {
    "repomix": {
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"]
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  },
  "agent": {
    "researcher": {
      "mode": "subagent",
      "description": "Deep codebase researcher. Use for comprehensive architecture analysis, cross-repo dependency tracing, and synthesis document generation.",
      "permission": {
        "edit": { "*": "deny", ".opencode/research/*": "allow" },
        "task": { "explore": "allow" }
      }
    }
  }
}
```

---

## Template: Git Archaeology (Shell)

```bash
# Most-changed files (hot spots for refactoring)
git log --since="6 months ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -30

# Cross-repo imports
grep -rn "from.*@opencode\|from.*@hivemind\|from.*openagent" src/ --include="*.ts"

# Dependency graph
cat package.json | jq '.dependencies + .devDependencies | keys[]' | sort

# Circular dependencies
npx madge --circular src/index.ts

# Code ownership
git blame --line-porcelain src/delegation/manager.ts | grep "^author " | sort | uniq -c | sort -rn

# Branch diff scope
git diff main..feature-branch --stat
git diff main..feature-branch -- src/target-module/
```

---

## TodoWrite Template for Multi-Cycle Research

```json
todowrite({ todos: [
  { "id": "1", "content": "Survey target repo architecture (pack + grep entry points)", "status": "completed" },
  { "id": "2", "content": "Map module A: [describe]", "status": "in_progress" },
  { "id": "3", "content": "Map module B: [describe]", "status": "pending" },
  { "id": "4", "content": "Trace cross-module dependencies (LSP + grep)", "status": "pending" },
  { "id": "5", "content": "Cross-reference with external deps (codesearch + websearch)", "status": "pending" },
  { "id": "6", "content": "Write synthesis to .opencode/research/[topic].md", "status": "pending" },
  { "id": "7", "content": "Generate persistent skill (generate_skill)", "status": "pending" }
]})
```

---
name: opencode-research-orchestrator
description: Orchestrates deep codebase research using Opencode's full tool suite — subagent delegation, parallel exploration, LSP tracing, repomix packing, and disk-based synthesis chains. Use when dispatching multiple agents to research a codebase, tracing cross-module dependencies, mapping architecture across repos, or building persistent knowledge artifacts. Triggers on "deep codebase research", "architecture audit", "cross-repo analysis", "dependency tracing", "research protocol", "multi-agent research", "codebase synthesis".
---

# Opencode Research Orchestrator

Orchestrate deep codebase research by combining Opencode's underused tools — LSP, codesearch, batch, apply_patch, task delegation — with repomix packing into structured research pipelines.

**See also:** `repomix-exploration-guide` for repomix MCP/CLI details. This skill focuses on the **orchestration layer** — how agents coordinate, what tools to combine, and how to structure multi-cycle research.

---

## Core Principle

Repomix gives you the forest. Local tools give you the trees. **Orchestration** is how you navigate between them — dispatching parallel agents, synthesizing across cycles, and persisting knowledge to disk.

```
pack → grep → read → LSP trace → synthesize → persist (skill/doc)
         ↑                                          |
         └──── dispatch parallel explore agents ─────┘
```

---

## 1. When to Use This Skill

| Situation | Action |
|-----------|--------|
| Researching a codebase with 3+ modules | Launch parallel `explore` agents per module |
| Tracing cross-module call chains | Use LSP `incomingCalls`/`outgoingCalls` + repomix grep |
| Comparing patterns across repos | Pack each repo, grep both outputs, cross-reference |
| Building persistent knowledge | Use `generate_skill` + synthesis docs in `.opencode/research/` |
| Multi-cycle research (long-haul) | Use disk-based synthesis chain with `todowrite` tracking |
| Verifying architectural claims | Use `batch` tool for parallel reads + grep |

**Do NOT use this skill for:** simple lookups (1-2 grep/read calls), web research (use `deep-research`), single-file analysis.

---

## 2. The Tool Stack

Most agents only scratch the surface. Here's what's available and what's underused:

| Tool | Underused Capability | Research Use |
|------|---------------------|-------------|
| `read` | **Offset reading** — `offset` param for large files | Read specific sections of large files without loading all 2000 lines |
| `lsp` | **9 operations** — `goToDefinition`, `findReferences`, `incomingCalls`, `outgoingCalls`, `documentSymbol`, `workspaceSymbol`, `hover`, `prepareCallHierarchy`, `goToImplementation` | Trace call graphs, find implementations, map symbol relationships |
| `codesearch` | **Adjustable `tokensNum`** (1K-50K) — default 5K is often too low | Research npm/library docs and API references |
| `batch` | **Parallel tool execution** — 1-25 calls | Read 3 files + grep 2 patterns simultaneously |
| `task` | **Session resumption** via `task_id` | Continue a subagent's work across turns |
| `apply_patch` | **Multi-file atomic patches** with LSP diagnostics | Write synthesis docs incrementally |
| `glob` | **Sorted by mtime** — most recent files first | Find recently modified code quickly |

**Requires experimental flags:**
```bash
export OPENCODE_EXPERIMENTAL=true          # Enables LSP tool
export OPENCODE_EXPERIMENTAL_LSP_TOOL=true # LSP specifically
```

For the complete tool registry with all parameters, see `references/opencode-tool-taxonomy.md`.

---

## 3. Orchestration Workflow

### Phase 1: Frame (Single Orchestrator Turn)

```
1. pack_codebase (compressed) — get directory structure + metrics
2. grep_repomix_output — locate entry points (index.ts, main exports)
3. Write findings to .opencode/research/01-survey.md
```

### Phase 2: Map (Parallel Subagents)

Launch 2-4 `explore` agents in a single message — one per major module:

```
Task(description="Map [MODULE_A] architecture", subagent_type="explore",
  prompt="RESEARCH ONLY. Glob src/[MODULE_A]/**/*.ts, grep for exports,
  read the entry point. Return: file tree, key exports, class hierarchy, import dependencies.")

Task(description="Map [MODULE_B] architecture", subagent_type="explore",
  prompt="...same pattern...")
```

**Each agent returns:** file list, key exports, class hierarchy, dependency imports.

### Phase 3: Trace (Sequential, Building on Phase 2)

```
1. Read Phase 2 outputs from disk
2. Use LSP findReferences/incomingCalls to trace cross-module dependencies
3. Use codesearch (tokensNum: 15000) for external library documentation
4. Write to .opencode/research/02-modules.md
```

### Phase 4: Synthesize (Orchestrator)

```
1. Read all prior outputs
2. Cross-reference findings
3. Write synthesis to .opencode/research/03-synthesis.md using apply_patch
4. Generate persistent skill via repomix generate_skill
```

### Phase 5: Persist (Knowledge Artifacts)

```
generate_skill({ directory: "<repo>", skillName: "<topic>-reference", compress: true })
```

Skills land in `.claude/skills/<name>/` with SKILL.md + references/ containing summary.md, project-structure.md, files.md, tech-stacks.md.

---

## 4. Subagent Delegation Patterns

### Concurrent Launch (Single Message, Multiple Tasks)

Launch parallel agents by putting multiple `task` calls in one message:

```
Task(subagent_type="explore", description="Map delegation layer", prompt="...")
Task(subagent_type="explore", description="Map plugin layer", prompt="...")
Task(subagent_type="explore", description="Map MCP integration", prompt="...")
```

### Session Resumption

Continue a subagent's work across turns:

```
Task(task_id="ses_abc123", prompt="Continue. Now trace the delegation chain from Manager.dispatch().", subagent_type="explore")
```

### Permission Control

Configure which subagents an orchestrator can invoke:

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": { "*": "deny", "explore": "allow", "general": "allow" }
      }
    }
  }
}
```

For delegation patterns in detail (task permission, batch vs task, research vs code distinction), see `references/delegation-patterns.md`.

---

## 5. Disk-Based Synthesis Chain

For long-haul research spanning multiple cycles, persist state to disk:

```
Batch 1: Survey  → write .opencode/research/01-survey.md
Batch 2: DeepDive → read 01-survey.md → 3x explore agents → write 02-modules.md
Batch 3: CrossRef → read 02-modules.md → pack deps + codesearch → write 03-cross-deps.md
Batch 4: Persist  → read 03-cross-deps.md → generate_skill → write 04-synthesis.md
```

Use `todowrite` to track across cycles:

```json
todowrite({ todos: [
  { "id": "1", "content": "Survey architecture", "status": "completed" },
  { "id": "2", "content": "Map delegation layer", "status": "in_progress" },
  { "id": "3", "content": "Trace MCP integration", "status": "pending" },
  { "id": "4", "content": "Generate synthesis skill", "status": "pending" }
]})
```

---

## 6. The Batch Tool — Intra-Agent Parallelism

The `batch` tool executes 1-25 tool calls concurrently. Use for parallel reads + greps within a single agent turn:

```json
[
  {"tool": "read", "parameters": {"filePath": "/path/to/src/core/index.ts", "limit": 500}},
  {"tool": "read", "parameters": {"filePath": "/path/to/src/delegation/manager.ts", "limit": 500}},
  {"tool": "grep", "parameters": {"pattern": "export class.*Plugin", "path": "/path/to/src"}},
  {"tool": "grep", "parameters": {"pattern": "implements.*Interface", "path": "/path/to/src"}}
]
```

Enable with `experimental.batch_tool: true` in config.

---

## 7. Research Chain Patterns

### Discovery → Retrieval → Code Verification

```
1. websearch({ query: "library X architecture", type: "deep" })
2. webfetch({ url: "<best result>", format: "markdown" })
3. codesearch({ query: "specific API from article", tokensNum: 15000 })
4. grep / LSP — verify the pattern exists in your codebase
```

### Offset Reading for Large Files

When a file exceeds the read cap (50KB / 2000 lines), the agent says:

```
Showing lines 1-2000 of 5432. Use offset=2001 to continue.
```

**Instruction pattern:** "Read the file. If truncated, continue with offset= until you have the full picture of [specific section]. Report back [target content]."

### LSP Call Hierarchy Tracing

```
1. lsp({ operation: "documentSymbol", filePath: "src/delegation/manager.ts" })
2. lsp({ operation: "prepareCallHierarchy", filePath: "...", line: 45, character: 10 })
3. lsp({ operation: "incomingCalls", ... })  // who calls this?
4. lsp({ operation: "outgoingCalls", ... })  // what does this call?
```

---

## 8. Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Single agent doing all research | Launch parallel `explore` agents per module |
| Reading entire large files | Use `grep` first, then targeted `read` with `offset` |
| Research results lost between turns | Write to `.opencode/research/` after each phase |
| Ignoring LSP for dependency tracing | Use `findReferences` + `incomingCalls` before grep |
| Using default `tokensNum` (5000) for codesearch | Bump to 15000-20000 for comprehensive library docs |
| Sequential tool calls when parallel is possible | Use `batch` tool for 3+ independent operations |
| No persistent knowledge artifact | Always end with `generate_skill` or synthesis doc |

---

## 9. Environment Setup

For full research power, enable these in your config:

```json
{
  "experimental": { "batch_tool": true },
  "mcp": {
    "repomix": { "command": "npx", "args": ["-y", "repomix", "--mcp"] },
    "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" }
  }
}
```

```bash
export OPENCODE_EXPERIMENTAL=true
export OPENCODE_EXPERIMENTAL_LSP_TOOL=true
```

---

## Reference Files

| File | Content |
|------|---------|
| `references/opencode-tool-taxonomy.md` | Complete Opencode tool registry with all parameters, underused capabilities, and research-specific usage patterns |
| `references/delegation-patterns.md` | Subagent delegation patterns, permission control, batch vs task decisions, research-only mode configuration |
| `references/orchestration-templates.md` | Ready-to-use prompt templates for framing, subagent delegation, cross-repo tracing, and multi-cycle research |

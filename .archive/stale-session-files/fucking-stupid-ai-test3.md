# Creating deep research synthesis skill

**Session ID:** ses_2ae4c5605ffeIv3zmgWbCnOAOG
**Created:** 4/3/2026, 11:57:02 AM
**Updated:** 4/3/2026, 11:58:05 AM

---

## User

'/Users/apple/hivemind-plugin/.worktrees/harness-experiment/commands-lab/research-analysis-group/deep-research-synthesis-repomix.md' create skill

---

## Assistant (Coordinator · MiniMax-M2.7 · 13.6s)

_Thinking:_

The user wants me to create a skill based on the file path they've provided. Let me first read the file to understand what it contains, then use the skill-creator or use-authoring-skills skill to create a proper skill from it.

Let me first load the appropriate skill for creating skills, and also read the source file to understand what needs to be created.

I'll read the source file first to understand the content, then use the skill creation workflow.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/harness-experiment/commands-lab/research-analysis-group/deep-research-synthesis-repomix.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/harness-experiment/commands-lab/research-analysis-group/deep-research-synthesis-repomix.md</path>
<type>file</type>
<content>1: # Advanced Repomix + Opencode Orchestration: Deep Research & Cross-Dependency Cheat Sheet
2: 
3: ---
4: 
5: ## Part I: Opencode Tool Taxonomy -- What Agents Underutilize
6: 
7: ### 1.1 Complete Tool Registry
8: 
9: Opencode registers tools in `ToolRegistry` with this priority order: [1-cite-0](#1-cite-0) 
10: 
11: | Tool | Kind | What agents miss | Key params |
12: |---|---|---|---|
13: | `read` | read | **Offset reading** for large files, directory listing mode | `filePath`, `offset` (1-indexed), `limit` (default 2000) |
14: | `grep` | search | `include` glob filter, results sorted by mtime | `pattern` (regex), `path`, `include` |
15: | `glob` | search | Results sorted by mtime (most recent first), 100-file limit | `pattern`, `path` |
16: | `list` | read | Accepts glob patterns for filtering | `path` |
17: | `bash` | execute | Full shell -- git, curl, jq, sed, awk, piping | `command`, `description` |
18: | `webfetch` | fetch | `format`: text/markdown/html, timeout control | `url`, `format`, `timeout` |
19: | `websearch` | search | `type`: auto/fast/deep, `livecrawl`: fallback/preferred | `query`, `numResults`, `type` |
20: | `codesearch` | search | **Exa Code API** for npm/library docs, 1K-50K tokens | `query`, `tokensNum` |
21: | `lsp` | other | **9 operations** -- experimental, needs env flag | `operation`, `filePath`, `line`, `character` |
22: | `skill` | other | Loads `SKILL.md` + bundled files into context | `name` |
23: | `task` | other | Subagent delegation with `task_id` resume | `prompt`, `description`, `subagent_type`, `task_id` |
24: | `batch` | other | **Parallel tool execution**, 1-25 calls | `tool_calls[]` |
25: | `apply_patch` | edit | Multi-file atomic patches with LSP diagnostics | `patchText` |
26: | `edit` | edit | Surgical line edits | `filePath`, ... |
27: | `write` | edit | Create/overwrite files | `filePath`, `content` |
28: | `todowrite` | other | Persistent task tracking across turns | `todos[]` |
29: 
30: ### 1.2 The Read Tool -- Offset Reading (Agents Almost Never Use This)
31: 
32: The `ReadTool` has a 50KB byte cap and 2000-line default limit. When truncated, it explicitly tells the agent to use `offset`: [1-cite-1](#1-cite-1) 
33: 
34: ```
35: Output capped at 50 KB. Showing lines 1-847. Use offset=848 to continue.
36: Showing lines 1-2000 of 5432. Use offset=2001 to continue.
37: ``` [1-cite-2](#1-cite-2) 
38: 
39: **Orchestrator instruction pattern:**
40: ```
41: Read the file at /path/to/large-file.ts. If truncated, continue reading 
42: with offset= as indicated until you have the complete picture of [specific 
43: section/function/class]. Report back the full content of [target].
44: ```
45: 
46: ### 1.3 LSP Tool -- The Most Underused Power Tool
47: 
48: Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` (or `OPENCODE_EXPERIMENTAL=true`). [1-cite-3](#1-cite-3) 
49: 
50: 9 operations available:
51: 
52: | Operation | Use Case in Research |
53: |---|---|
54: | `goToDefinition` | Trace where a type/function is actually defined |
55: | `findReferences` | Find all callers/consumers of a symbol |
56: | `hover` | Get type signature without reading full file |
57: | `documentSymbol` | List all symbols in a file (classes, functions, exports) |
58: | `workspaceSymbol` | Search symbols across entire workspace |
59: | `goToImplementation` | Find concrete implementations of interfaces |
60: | `prepareCallHierarchy` | Set up call hierarchy analysis |
61: | `incomingCalls` | Who calls this function? |
62: | `outgoingCalls` | What does this function call? | [1-cite-4](#1-cite-4) 
63: 
64: **Orchestrator instruction pattern:**
65: ```
66: Use the LSP tool to trace the call hierarchy of `delegateTask` in 
67: src/delegation/manager.ts. First use documentSymbol to find the line number, 
68: then use incomingCalls and outgoingCalls to map the full call graph. 
69: Report the dependency chain.
70: ```
71: 
72: ### 1.4 CodeSearch -- npm/Library Documentation on Demand
73: 
74: Uses Exa Code API (`get_code_context_exa`) -- no API key needed. Returns code examples, docs, and API references for any library/SDK. [1-cite-5](#1-cite-5) 
75: 
76: **Key insight agents miss:** `tokensNum` is adjustable from 1,000 to 50,000. Default 5,000 is often too low for comprehensive library research.
77: 
78: ```
79: codesearch({ query: "zod schema validation advanced patterns discriminated unions", tokensNum: 20000 })
80: codesearch({ query: "Model Context Protocol SDK server tool registration TypeScript", tokensNum: 15000 })
81: codesearch({ query: "Tree-sitter TypeScript parser AST node types", tokensNum: 10000 })
82: ```
83: 
84: ### 1.5 WebSearch vs WebFetch -- Discovery vs Retrieval [1-cite-6](#1-cite-6) [1-cite-7](#1-cite-7) 
85: 
86: | | `websearch` | `webfetch` |
87: |---|---|---|
88: | Purpose | **Discovery** -- find what exists | **Retrieval** -- get specific content |
89: | Backend | Exa AI MCP (`web_search_exa`) | Direct HTTP fetch |
90: | Auth | None needed | None needed |
91: | Enable | `OPENCODE_ENABLE_EXA=1` or OpenCode provider | Always available |
92: | Key params | `query`, `type` (auto/fast/deep), `numResults` | `url`, `format` (text/markdown/html) |
93: 
94: **Research chain pattern:**
95: ```
96: 1. websearch({ query: "hivemind plugin architecture patterns 2025", type: "deep" })
97: 2. webfetch({ url: "<best result URL>", format: "markdown" })
98: 3. codesearch({ query: "<specific API from the article>", tokensNum: 15000 })
99: ```
100: 
101: ### 1.6 Context7 MCP -- Library Documentation Search
102: 
103: Opencode recognizes `context7_resolve_library_id` and `context7_get_library_docs` as search-kind tools. [1-cite-8](#1-cite-8) 
104: 
105: Configure in `opencode.json`:
106: ```json
107: {
108:   "mcp": {
109:     "context7": {
110:       "type": "remote",
111:       "url": "https://mcp.context7.com/mcp"
112:     }
113:   }
114: }
115: ``` [1-cite-9](#1-cite-9) 
116: 
117: **Usage pattern:** Add `use context7` to prompts, or put in `AGENTS.md`:
118: ```md
119: When you need to search docs, use `context7` tools.
120: ```
121: 
122: ---
123: 
124: ## Part II: Orchestrator & Swarm Delegation Patterns
125: 
126: ### 2.1 Agent Architecture in Opencode
127: 
128: Opencode has 4 native visible agents + hidden utility agents: [1-cite-10](#1-cite-10) 
129: 
130: | Agent | Mode | Tools | Purpose |
131: |---|---|---|---|
132: | `build` | primary | All (with question, plan_enter) | Default coding agent |
133: | `plan` | primary | Read-only + plan files | Planning mode, no edits |
134: | `general` | subagent | All except todo | Multi-step autonomous tasks |
135: | `explore` | subagent | grep, glob, list, bash, read, webfetch, websearch, codesearch | **Read-only codebase exploration** |
136: | `compaction` | primary (hidden) | None | Context compaction |
137: | `title` | primary (hidden) | None | Title generation |
138: | `summary` | primary (hidden) | None | Summary generation |
139: 
140: The `explore` agent is the key research subagent -- it has read-only permissions and access to all search/fetch tools: [1-cite-11](#1-cite-11) 
141: 
142: ### 2.2 Task Tool -- Subagent Delegation
143: 
144: The `TaskTool` is how orchestrators spawn subagents: [1-cite-12](#1-cite-12) 
145: 
146: Critical patterns agents miss:
147: 
148: **a) Concurrent subagent launch** (single message, multiple tool uses):
149: ```
150: // Launch 3 explore agents in parallel
151: Task(description="Map hivemind-plugin architecture", prompt="...", subagent_type="explore")
152: Task(description="Map openagent MCP layer", prompt="...", subagent_type="explore")  
153: Task(description="Map opencode SDK plugin system", prompt="...", subagent_type="explore")
154: ``` [1-cite-13](#1-cite-13) 
155: 
156: **b) Session resumption** via `task_id`:
157: ```
158: Task(task_id="ses_abc123", prompt="Continue from where you left off. Now trace the delegation chain...", subagent_type="explore")
159: ``` [1-cite-14](#1-cite-14) 
160: 
161: **c) Research vs. code distinction** -- always tell the subagent:
162: ```
163: Task(
164:   description="Research hivemind delegation layer",
165:   prompt="This is a RESEARCH-ONLY task. Do NOT modify any files. 
166:   Use grep, glob, read, and bash (git log only) to:
167:   1. Find all files in src/delegation/
168:   2. Map the class hierarchy
169:   3. Identify all public APIs
170:   Return a structured summary with file paths and key function signatures.",
171:   subagent_type="explore"
172: )
173: ``` [1-cite-15](#1-cite-15) 
174: 
175: ### 2.3 Task Permission Control for Orchestrator Patterns
176: 
177: Configure which subagents an orchestrator can invoke:
178: ```json
179: {
180:   "agent": {
181:     "orchestrator": {
182:       "mode": "primary",
183:       "permission": {
184:         "task": {
185:           "*": "deny",
186:           "explore": "allow",
187:           "general": "allow",
188:           "researcher-*": "allow"
189:         }
190:       }
191:     }
192:   }
193: }
194: ```
195: Last matching rule wins. When set to `deny`, the subagent is removed from the Task tool description entirely. [1-cite-16](#1-cite-16) 
196: 
197: ### 2.4 Batch Tool -- Parallel Tool Execution Within a Single Agent
198: 
199: The `BatchTool` executes 1-25 tool calls concurrently. This is the **intra-agent parallelism** complement to Task's **inter-agent parallelism**. [1-cite-17](#1-cite-17) [1-cite-18](#1-cite-18) 
200: 
201: Enable with `experimental.batch_tool: true` in config.
202: 
203: ```json
204: // Batch payload example: read 3 files + grep 2 patterns simultaneously
205: [
206:   {"tool": "read", "parameters": {"filePath": "/path/to/hivemind/src/core/index.ts", "limit": 500}},
207:   {"tool": "read", "parameters": {"filePath": "/path/to/hivemind/src/delegation/manager.ts", "limit": 500}},
208:   {"tool": "read", "parameters": {"filePath": "/path/to/hivemind/src/intelligence/engine.ts", "limit": 500}},
209:   {"tool": "grep", "parameters": {"pattern": "export class.*Plugin", "path": "/path/to/hivemind/src"}},
210:   {"tool": "grep", "parameters": {"pattern": "implements.*Interface", "path": "/path/to/hivemind/src"}}
211: ]
212: ```
213: 
214: ### 2.5 Apply Patch -- Iterative Document Updates
215: 
216: The `ApplyPatchTool` supports multi-file atomic patches with add/update/delete/move operations and automatic LSP diagnostics after application: [1-cite-19](#1-cite-19) [1-cite-20](#1-cite-20) 
217: 
218: **For iterative synthesis documents:**
219: ```
220: apply_patch({
221:   patchText: `*** Begin Patch
222: *** Update File: .opencode/research/hivemind-architecture.md
223: @@@ --- a/.opencode/research/hivemind-architecture.md
224: +++ b/.opencode/research/hivemind-architecture.md
225: @@ Section: Delegation Layer @@
226: -TODO: Map delegation patterns
227: +## Delegation Layer
228: +
229: +### Core Classes
230: +- DelegationManager (src/delegation/manager.ts:45)
231: +- TaskRouter (src/delegation/router.ts:12)
232: +...
233: *** End Patch`
234: })
235: ```
236: 
237: ---
238: 
239: ## Part III: Repomix Advanced Techniques for Deep Research
240: 
241: ### 3.1 Remote Repository Packing for Cross-Dependency Research
242: 
243: Pack any GitHub repo (public or accessible) without cloning locally: [1-cite-21](#1-cite-21) 
244: 
245: ```jsonc
246: // Pack a specific npm library's source to understand its internals
247: { "remote": "yamadashy/repomix", "includePatterns": "src/**/*.ts", "compress": true }
248: 
249: // Pack a dependency you're investigating
250: { "remote": "modelcontextprotocol/typescript-sdk", "includePatterns": "src/**" }
251: 
252: // Pack with branch targeting
253: { "remote": "https://github.com/shynlee04/hivemind-plugin/tree/v2.9.5-detox-dev",
254:   "includePatterns": "src/delegation/**,src/intelligence/**" }
255: ```
256: 
257: ### 3.2 Skill Generation as Persistent Knowledge Artifacts
258: 
259: The `generate_skill` tool creates a structured knowledge package that persists across sessions: [1-cite-22](#1-cite-22) 
260: 
261: **Output structure:**
262: ```
263: .claude/skills/<skill-name>/
264: ├── SKILL.md                    # Entry point with usage guide
265: └── references/
266:     ├── summary.md              # Purpose, format, and statistics
267:     ├── project-structure.md    # Directory tree with line counts
268:     ├── files.md                # All file contents
269:     └── tech-stacks.md          # Languages, frameworks, dependencies
270: ```
271: 
272: **The skill loading chain in opencode:**
273: When an agent calls `skill({ name: "..." })`, the `SkillTool` loads `SKILL.md` content + up to 10 bundled files into the conversation context: [1-cite-23](#1-cite-23) 
274: 
275: ### 3.3 The Pack-Grep-Read Pipeline (Incremental Exploration)
276: 
277: This is the core pattern for token-efficient deep research. The repomix MCP server instructions explicitly describe this workflow: [1-cite-24](#1-cite-24) 
278: 
279: ```mermaid
280: flowchart TD
281:     A["pack_codebase / pack_remote_repository\n(get outputId + directory structure)"] --> B["grep_repomix_output\n(regex search within packed output)"]
282:     B --> C["read_repomix_output\n(read specific line ranges)"]
283:     C --> D{"Need more detail?"}
284:     D -->|"Yes"| B
285:     D -->|"No"| E["Synthesize findings\ninto skill or document"]
286: ```
287: 
288: **grep_repomix_output** supports asymmetric context windows: [1-cite-25](#1-cite-25) 
289: 
290: ```jsonc
291: // Show 2 lines before, 15 lines after each match (see full function body after signature)
292: { "outputId": "<id>", "pattern": "export class DelegationManager", "beforeLines": 2, "afterLines": 15 }
293: 
294: // Case-insensitive search for cross-cutting concerns
295: { "outputId": "<id>", "pattern": "lifecycle|dispose|cleanup|teardown", "ignoreCase": true, "contextLines": 3 }
296: ```
297: 
298: ### 3.4 Stacking Skills for Multi-Repo Synthesis
299: 
300: **Phase 1: Generate skills from each repo**
301: ```jsonc
302: // Via repomix MCP
303: generate_skill({ directory: "/path/to/hivemind-plugin", skillName: "hivemind-core", compress: true,
304:   includePatterns: "src/**/*.ts", ignorePatterns: "**/*.test.*,**/*.spec.*" })
305: 
306: generate_skill({ directory: "/path/to/oh-my-openagent", skillName: "openagent-mcp-system",
307:   includePatterns: "src/mcp/**,src/plugin/**,src/hooks/**" })
308: 
309: // For remote repos you don't have locally:
310: // First pack_remote_repository, then use the output as reference
311: ```
312: 
313: **Phase 2: Load skills in orchestrator context**
314: ```
315: skill({ name: "hivemind-core" })
316: skill({ name: "openagent-mcp-system" })
317: // Now the agent has both codebases in context for cross-reference
318: ```
319: 
320: **Phase 3: Cross-reference with targeted searches**
321: ```
322: // Use opencode grep to find live code patterns
323: grep({ pattern: "McpServer|registerTool|MCP", path: "/path/to/hivemind-plugin/src" })
324: // Use repomix grep on packed openagent output
325: grep_repomix_output({ outputId: "<openagent-id>", pattern: "McpServer|registerTool" })
326: ```
327: 
328: ---
329: 
330: ## Part IV: Orchestration Patterns Aligned with Your Research Protocol
331: 
332: ### 4.1 Mapping to Your Protocol's Core Constraints
333: 
334: | Protocol Rule | Implementation |
335: |---|---|
336: | No deep line-by-line reading | Use `grep` + `glob` first, then targeted `read` with `limit` |
337: | No long-horizon agentic execution | Use `batch` for parallel tool calls; use `task` with specific bounded prompts |
338: | No file mutation (research mode) | Use `explore` subagent (edit permissions denied); use `plan` mode |
339: | Disk-based synthesis | Use `apply_patch` or `write` to create synthesis docs in `.opencode/research/` |
340: | Batch planning for subagents | Launch multiple `task` calls in single message; chain via `task_id` |
341: 
342: ### 4.2 The Hierarchical Exploration Pattern
343: 
344: ```mermaid
345: flowchart TD
346:     subgraph "Cycle 1: Frame"
347:         A1["Orchestrator: pack_codebase (compressed)\nGet directory structure + metrics"]
348:         A2["Orchestrator: grep_repomix_output\nfor entry points, exports, main"]
349:         A1 --> A2
350:     end
351: 
352:     subgraph "Cycle 2: Map (Parallel Subagents)"
353:         B1["explore: Map module A\n(grep + glob + read)"]
354:         B2["explore: Map module B\n(grep + glob + read)"]
355:         B3["explore: Map module C\n(grep + glob + read)"]
356:     end
357: 
358:     subgraph "Cycle 3: Trace (Sequential)"
359:         C1["explore: Trace cross-module deps\n(LSP findReferences + incomingCalls)"]
360:         C2["explore: Trace external deps\n(codesearch + webfetch for docs)"]
361:     end
362: 
363:     subgraph "Cycle 4: Synthesize"
364:         D1["Orchestrator: write synthesis doc\n(.opencode/research/findings.md)"]
365:         D2["Orchestrator: generate_skill\n(persist as reusable knowledge)"]
366:     end
367: 
368:     A2 --> B1
369:     A2 --> B2
370:     A2 --> B3
371:     B1 --> C1
372:     B2 --> C1
373:     B3 --> C1
374:     C1 --> C2
375:     C2 --> D1
376:     D1 --> D2
377: ```
378: 
379: ### 4.3 Concrete Orchestrator Prompt Templates
380: 
381: **Template: Initial Framing**
382: ```
383: You are conducting a deep codebase research audit. DO NOT modify any files 
384: except in .opencode/research/. Follow this protocol:
385: 
386: 1. FRAME: Use repomix pack_codebase (compressed) on the target directory.
387:    Read the directory structure and metrics from the response.
388:    Use grep_repomix_output to locate entry points (index.ts, main exports).
389: 
390: 2. MAP: Launch parallel explore subagents to map each major module.
391:    Each agent should return: file list, key exports, class hierarchy, 
392:    dependency imports.
393: 
394: 3. TRACE: Use LSP (if available) or grep to trace cross-module dependencies.
395:    Use codesearch/websearch for external library documentation.
396: 
397: 4. SYNTHESIZE: Write findings to .opencode/research/<topic>.md using apply_patch.
398:    Generate a skill using repomix generate_skill for persistent reference.
399: 
400: Current target: [REPO_PATH]
401: Focus area: [SPECIFIC_SUBSYSTEM]
402: ```
403: 
404: **Template: Subagent Research Delegation**
405: ```
406: Task(
407:   description="Map [MODULE_NAME] architecture",
408:   subagent_type="explore",
409:   prompt=`RESEARCH ONLY - no file modifications.
410: 
411:   Target: [REPO_PATH]/src/[MODULE]/
412:   
413:   Execute these steps:
414:   1. glob({ pattern: "**/*.ts", path: "[REPO_PATH]/src/[MODULE]" })
415:   2. For each key file, grep for exports: grep({ pattern: "^export", path: "[file]" })
416:   3. Read the main entry point with read({ filePath: "[entry]", limit: 200 })
417:   4. If files are large, use offset reading to get specific sections
418:   
419:   Return a structured report:
420:   - File tree with descriptions
421:   - Key exports and their types
422:   - Import dependencies (what this module depends on)
423:   - Exported APIs (what other modules consume)
424:   - Patterns observed (singleton, factory, observer, etc.)
425:   `
426: )
427: ```
428: 
429: **Template: Cross-Repo Dependency Tracing**
430: ```
431: Task(
432:   description="Trace MCP integration across repos",
433:   subagent_type="explore",
434:   prompt=`RESEARCH ONLY.
435: 
436:   I have already packed these repos:
437:   - hivemind-plugin outputId: [ID1]
438:   - oh-my-openagent outputId: [ID2]
439:   
440:   Use grep_repomix_output on both outputs to find:
441:   1. All MCP server registrations: pattern "registerTool|McpServer|mcp"
442:   2. All tool definitions: pattern "Tool\\.define|registerTool"
443:   3. All plugin hooks: pattern "hook|lifecycle|register|dispose"
444:   
445:   Cross-reference the patterns. Report:
446:   - Shared abstractions between repos
447:   - Divergent implementations
448:   - Integration points where hivemind-plugin could adopt openagent patterns
449:   `
450: )
451: ```
452: 
453: ### 4.4 Shell Output Chaining & $Argument Patterns
454: 
455: Use `bash` tool for git-based research and piped analysis:
456: 
457: ```bash
458: # Git archaeology -- find most-changed files (hot spots for refactoring)
459: git log --since="6 months ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -30
460: 
461: # Find all cross-repo imports
462: grep -rn "from.*@opencode\|from.*@hivemind\|from.*openagent" src/ --include="*.ts"
463: 
464: # Dependency graph via package.json
465: cat package.json | jq '.dependencies + .devDependencies | keys[]' | sort
466: 
467: # Find circular dependencies
468: npx madge --circular src/index.ts
469: 
470: # Git blame for understanding ownership
471: git blame --line-porcelain src/delegation/manager.ts | grep "^author " | sort | uniq -c | sort -rn
472: 
473: # Diff between branches for refactoring scope
474: git diff main..v2.9.5-detox-dev --stat
475: git diff main..v2.9.5-detox-dev -- src/delegation/
476: ```
477: 
478: ### 4.5 Auto-Parsed Prompting & Command Chaining
479: 
480: Opencode supports slash commands via Task tool: [1-cite-26](#1-cite-26) 
481: 
482: ```
483: Task(description="Run custom check", prompt="/check-architecture src/delegation/", subagent_type="general")
484: ```
485: 
486: Custom modes can restrict tool access for research-only sessions: [1-cite-27](#1-cite-27) 
487: 
488: ```json
489: {
490:   "mode": {
491:     "research": {
492:       "prompt": "{file:./prompts/research-protocol.txt}",
493:       "tools": {
494:         "write": false, "edit": false, "bash": true,
495:         "read": true, "grep": true, "glob": true,
496:         "list": true, "webfetch": true, "websearch": true
497:       }
498:     }
499:   }
500: }
501: ```
502: 
503: ---
504: 
505: ## Part V: Integrated Workflow -- Long-Haul Audit Protocol
506: 
507: ### 5.1 The Disk-Based Synthesis Chain
508: 
509: Aligned with your protocol's `Batch 1 -> Disk Write -> Batch 2 -> ...` pattern:
510: 
511: ```mermaid
512: flowchart LR
513:     subgraph "Batch 1: Survey"
514:         S1["pack_codebase (compressed)"]
515:         S2["grep for architecture markers"]
516:         S3["write -> .opencode/research/01-survey.md"]
517:     end
518: 
519:     subgraph "Batch 2: Deep Dive"
520:         D1["read 01-survey.md"]
521:         D2["3x explore subagents (parallel)"]
522:         D3["write -> .opencode/research/02-modules.md"]
523:     end
524: 
525:     subgraph "Batch 3: Cross-Reference"
526:         X1["read 02-modules.md"]
527:         X2["pack_remote_repository (dependencies)"]
528:         X3["codesearch + websearch"]
529:         X4["write -> .opencode/research/03-cross-deps.md"]
530:     end
531: 
532:     subgraph "Batch 4: Persist"
533:         P1["read 03-cross-deps.md"]
534:         P2["generate_skill (repomix)"]
535:         P3["write -> .opencode/research/04-synthesis.md"]
536:     end
537: 
538:     S3 --> D1
539:     D3 --> X1
540:     X4 --> P1
541: ```
542: 
543: ### 5.2 TodoWrite for Multi-Cycle Tracking
544: 
545: Use `todowrite` to maintain research state across cycles: [1-cite-28](#1-cite-28) 
546: 
547: ```jsonc
548: todowrite({ todos: [
549:   { "id": "1", "content": "Survey hivemind-plugin architecture", "status": "completed" },
550:   { "id": "2", "content": "Map delegation layer in detail", "status": "in_progress" },
551:   { "id": "3", "content": "Trace MCP integration points", "status": "pending" },
552:   { "id": "4", "content": "Cross-reference with openagent patterns", "status": "pending" },
553:   { "id": "5", "content": "Generate synthesis skill", "status": "pending" }
554: ]})
555: ```
556: 
557: ### 5.3 Complete opencode.json for Research-Optimized Setup
558: 
559: ```json
560: {
561:   "$schema": "https://opencode.ai/config.json",
562:   "permission": {
563:     "read": "allow",
564:     "grep": "allow",
565:     "glob": "allow",
566:     "list": "allow",
567:     "bash": "allow",
568:     "webfetch": "allow",
569:     "websearch": "allow",
570:     "codesearch": "allow",
571:     "skill": "allow",
572:     "lsp": "allow",
573:     "edit": "allow"
574:   },
575:   "experimental": {
576:     "batch_tool": true
577:   },
578:   "mcp": {
579:     "repomix": {
580:       "command": "npx",
581:       "args": ["-y", "repomix", "--mcp"]
582:     },
583:     "context7": {
584:       "type": "remote",
585:       "url": "https://mcp.context7.com/mcp"
586:     },
587:     "gh_grep": {
588:       "type": "remote",
589:       "url": "https://mcp.grep.app"
590:     }
591:   },
592:   "agent": {
593:     "researcher": {
594:       "mode": "subagent",
595:       "description": "Deep codebase researcher. Use for comprehensive architecture analysis, cross-repo dependency tracing, and synthesis document generation.",
596:       "permission": {
597:         "edit": { "*": "deny", ".opencode/research/*": "allow" },
598:         "task": { "explore": "allow" }
599:       }
600:     }
601:   },
602:   "mode": {
603:     "research": {
604:       "prompt": "{file:./prompts/research-protocol.txt}",
605:       "tools": {
606:         "write": false, "edit": false, "bash": true,
607:         "read": true, "grep": true, "glob": true
608:       }
609:     }
610:   }
611: }
612: ```
613: 
614: ### 5.4 Environment Variables for Full Power
615: 
616: ```bash
617: # Enable all experimental features
618: export OPENCODE_EXPERIMENTAL=true          # Enables LSP tool + other experimental features
619: export OPENCODE_EXPERIMENTAL_LSP_TOOL=true # LSP tool specifically
620: export OPENCODE_ENABLE_EXA=1

(End of file - total 620 lines)
</content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "skill-creator"
}
```

**Output:**
```
<skill_content name="skill-creator">
# Skill: skill-creator

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the results both qualitatively and quantitatively
  - While the runs happen in the background, draft some quantitative evals if there aren't any (if there are some, you can either use as is or modify if you feel something needs to change about them). Then explain them to the user (or if they already existed, explain the ones that already exist)
  - Use the `eval-viewer/generate_review.py` script to show the user the results for them to look at, and also let them look at the quantitative metrics
- Rewrite the skill based on feedback from the user's evaluation of the results (and also if there are any glaring flaws that become apparent from the quantitative benchmarks)
- Repeat until you're satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and then jump in and help them progress through these stages. So for instance, maybe they're like "I want to make a skill for X". You can help narrow down what they mean, write a draft, write the test cases, figure out how they want to evaluate, run all the prompts, and repeat.

On the other hand, maybe they already have a draft of the skill. In this case you can go straight to the eval/iterate part of the loop.

Of course, you should always be flexible and if the user is like "I don't need to run a bunch of evaluations, just vibe with me", you can do that instead.

Then after the skill is done (but again, the order is flexible), you can also run the skill description improver, which we have a whole separate script for, to optimize the triggering of the skill.

Cool? Cool.

## Communicating with the user

The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. If you haven't heard (and how could you, it's only very recently that it started), there's a trend now where the power of Claude is inspiring plumbers to open up their terminals, parents and grandparents to google "how to install npm". On the other hand, the bulk of users are probably fairly computer-literate.

So please pay attention to context cues to understand how to phrase your communication! In the default case, just to give you some idea:

- "evaluation" and "benchmark" are borderline, but OK
- for "JSON" and "assertion" you want to see serious cues from the user that they know what those things are before using them without explaining them

It's OK to briefly explain terms if you're in doubt, and feel free to clarify terms with a short definition if you're unsure if the user will get it.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding to the next step.

1. What should this skill enable Claude to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works? Skills with objectively verifiable outputs (file transforms, data extraction, code generation, fixed workflow steps) benefit from test cases. Skills with subjective outputs (writing style, art) often don't need them. Suggest the appropriate default based on the skill type, but let the user decide.

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until you've got this part ironed out.

Check available MCPs - if useful for research (searching docs, finding similar skills, looking up best practices), research in parallel via subagents if available, otherwise inline. Come prepared with context to reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier
- **description**: When to trigger, what it does. This is the primary triggering mechanism - include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Note: currently Claude has a tendency to "undertrigger" skills -- to not use them when they'd be useful. To combat this, please make the skill descriptions a little bit "pushy". So for instance, instead of "How to build a simple fast dashboard to display internal Anthropic data.", you might write "How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill :)**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** - As needed (unlimited, scripts can execute without loading)

These word counts are approximate and you can feel free to go longer if needed.

**Key patterns:**
- Keep SKILL.md under 500 lines; if you're approaching this limit, add an additional layer of hierarchy along with clear pointers about where the model using the skill should go next to follow up.
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude reads only the relevant reference file.

#### Principle of Lack of Surprise

This goes without saying, but skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described. Don't go along with requests to create misleading skills or skills designed to facilitate unauthorized access, data exfiltration, or other malicious activities. Things like a "roleplay as an XYZ" are OK though.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats** - You can do it like this:
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern** - It's useful to include examples. You can format them like this (but if "Input" and "Output" are in the examples you might want to deviate a little):
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed musty MUSTs. Use theory of mind and try to make the skill general and not super-narrow to specific examples. Start by writing a draft and then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user: [you don't have to use this exact language] "Here are a few test cases I'd like to try. Do these look right, or do you want to add more?" Then run them.

Save test cases to `evals/evals.json`. Don't write assertions yet — just the prompts. You'll draft assertions in the next step while the runs are in progress.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema (including the `assertions` field, which you'll add later).

## Running and evaluating test cases

This section is one continuous sequence — don't stop partway through. Do NOT use `/skill-test` or any other testing skill.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory (`eval-0/`, `eval-1/`, etc.). Don't create all of this upfront — just create directories as you go.

### Step 1: Spawn all runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents in the same turn — one with the skill, one without. This is important: don't spawn the with-skill runs first and then come back for baselines later. Launch everything at once so it all finishes around the same time.

**With-skill run:**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline run** (same prompt, but the baseline depends on context):
- **Creating a new skill**: no skill at all. Same prompt, no skill path, save to `without_skill/outputs/`.
- **Improving an existing skill**: the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline subagent at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case (assertions can be empty for now). Give each eval a descriptive name based on what it's testing — not just "eval-0". Use this name for the directory too. If this iteration uses new or modified eval prompts, create these files for each new eval directory — don't assume they carry over from previous iterations.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2: While runs are in progress, draft assertions

Don't just wait for the runs to finish — you can use this time productively. Draft quantitative assertions for each test case and explain them to the user. If assertions already exist in `evals/evals.json`, review them and explain what they check.

Good assertions are objectively verifiable and have descriptive names — they should read clearly in the benchmark viewer so someone glancing at the results immediately understands what each one checks. Subjective skills (writing style, design quality) are better evaluated qualitatively — don't force assertions onto things that need human judgment.

Update the `eval_metadata.json` files and `evals/evals.json` with the assertions once drafted. Also explain to the user what they'll see in the viewer — both the qualitative outputs and the quantitative benchmark.

### Step 3: As runs complete, capture timing data

When each subagent task completes, you receive a notification containing `total_tokens` and `duration_ms`. Save this data immediately to `timing.json` in the run directory:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

This is the only opportunity to capture this data — it comes through the task notification and isn't persisted elsewhere. Process each notification as it arrives rather than trying to batch them.

### Step 4: Grade, aggregate, and launch the viewer

Once all runs are done:

1. **Grade each run** — spawn a grader subagent (or grade inline) that reads `agents/grader.md` and evaluates each assertion against the outputs. Save results to `grading.json` in each run directory. The grading.json expectations array must use the fields `text`, `passed`, and `evidence` (not `name`/`met`/`details` or other variants) — the viewer depends on these exact field names. For assertions that can be checked programmatically, write and run a script rather than eyeballing it — scripts are faster, more reliable, and can be reused across iterations.

2. **Aggregate into benchmark** — run the aggregation script from the skill-creator directory:
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   This produces `benchmark.json` and `benchmark.md` with pass_rate, time, and tokens for each configuration, with mean ± stddev and the delta. If generating benchmark.json manually, see `references/schemas.md` for the exact schema the viewer expects.
Put each with_skill version before its baseline counterpart.

3. **Do an analyst pass** — read the benchmark data and surface patterns the aggregate stats might hide. See `agents/analyzer.md` (the "Analyzing Benchmark Results" section) for what to look for — things like assertions that always pass regardless of skill (non-discriminating), high-variance evals (possibly flaky), and time/token tradeoffs.

4. **Launch the viewer** with both qualitative outputs and quantitative data:
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

   **Cowork / headless environments:** If `webbrowser.open()` is not available or the environment has no display, use `--static <output_path>` to write a standalone HTML file instead of starting a server. Feedback will be downloaded as a `feedback.json` file when the user clicks "Submit All Reviews". After download, copy `feedback.json` into the workspace directory for the next iteration to pick up.

Note: please use generate_review.py to create the viewer; there's no need to write custom HTML.

5. **Tell the user** something like: "I've opened the results in your browser. There are two tabs — 'Outputs' lets you click through each test case and leave feedback, 'Benchmark' shows the quantitative comparison. When you're done, come back here and let me know."

### What the user sees in the viewer

The "Outputs" tab shows one test case at a time:
- **Prompt**: the task that was given
- **Output**: the files the skill produced, rendered inline where possible
- **Previous Output** (iteration 2+): collapsed section showing last iteration's output
- **Formal Grades** (if grading was run): collapsed section showing assertion pass/fail
- **Feedback**: a textbox that auto-saves as they type
- **Previous Feedback** (iteration 2+): their comments from last time, shown below the textbox

The "Benchmark" tab shows the stats summary: pass rates, timing, and token usage for each configuration, with per-eval breakdowns and analyst observations.

Navigation is via prev/next buttons or arrow keys. When done, they click "Submit All Reviews" which saves all feedback to `feedback.json`.

### Step 5: Read the feedback

When the user tells you they're done, read `feedback.json`:

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

Empty feedback means the user thought it was fine. Focus your improvements on the test cases where the user had specific complaints.

Kill the viewer server when you're done with it:

```bash
kill $VIEWER_PID 2>/dev/null
```

---

## Improving the skill

This is the heart of the loop. You've run the test cases, the user has reviewed the results, and now you need to make the skill better based on their feedback.

### How to think about improvements

1. **Generalize from the feedback.** The big picture thing that's happening here is that we're trying to create skills that can be used a million times (maybe literally, maybe even more who knows) across many different prompts. Here you and the user are iterating on only a few examples over and over again because it helps move faster. The user knows these examples in and out and it's quick for them to assess new outputs. But if the skill you and the user are codeveloping works only for those examples, it's useless. Rather than put in fiddly overfitty changes, or oppressively constrictive MUSTs, if there's some stubborn issue, you might try branching out and using different metaphors, or recommending different patterns of working. It's relatively cheap to try and maybe you'll land on something great.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. Make sure to read the transcripts, not just the final outputs — if it looks like the skill is making the model waste a bunch of time doing things that are unproductive, you can try getting rid of the parts of the skill that are making it do that and seeing what happens.

3. **Explain the why.** Try hard to explain the **why** behind everything you're asking the model to do. Today's LLMs are *smart*. They have good theory of mind and when given a good harness can go beyond rote instructions and really make things happen. Even if the feedback from the user is terse or frustrated, try to actually understand the task and why the user is writing what they wrote, and what they actually wrote, and then transmit this understanding into the instructions. If you find yourself writing ALWAYS or NEVER in all caps, or using super rigid structures, that's a yellow flag — if possible, reframe and explain the reasoning so that the model understands why the thing you're asking for is important. That's a more humane, powerful, and effective approach.

4. **Look for repeated work across test cases.** Read the transcripts from the test runs and notice if the subagents all independently wrote similar helper scripts or took the same multi-step approach to something. If all 3 test cases resulted in the subagent writing a `create_docx.py` or a `build_chart.py`, that's a strong signal the skill should bundle that script. Write it once, put it in `scripts/`, and tell the skill to use it. This saves every future invocation from reinventing the wheel.

This task is pretty important (we are trying to create billions a year in economic value here!) and your thinking time is not the blocker; take your time and really mull things over. I'd suggest writing a draft revision and then looking at it anew and making improvements. Really do your best to get into the head of the user and understand what they want and need.

### The iteration loop

After improving the skill:

1. Apply your improvements to the skill
2. Rerun all test cases into a new `iteration-<N+1>/` directory, including baseline runs. If you're creating a new skill, the baseline is always `without_skill` (no skill) — that stays the same across iterations. If you're improving an existing skill, use your judgment on what makes sense as the baseline: the original version the user came in with, or the previous iteration.
3. Launch the reviewer with `--previous-workspace` pointing at the previous iteration
4. Wait for the user to review and tell you they're done
5. Read the new feedback, improve again, repeat

Keep going until:
- The user says they're happy
- The feedback is all empty (everything looks good)
- You're not making meaningful progress

---

## Advanced: Blind comparison

For situations where you want a more rigorous comparison between two versions of a skill (e.g., the user asks "is the new version actually better?"), there's a blind comparison system. Read `agents/comparator.md` and `agents/analyzer.md` for the details. The basic idea is: give two outputs to an independent agent without telling it which is which, and let it judge quality. Then analyze why the winner won.

This is optional, requires subagents, and most users won't need it. The human review loop is usually sufficient.

---

## Description Optimization

The description field in SKILL.md frontmatter is the primary mechanism that determines whether Claude invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — a mix of should-trigger and should-not-trigger. Save as JSON:

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

The queries must be realistic and something a Claude Code or Claude.ai user would actually type. Not abstract requests, but requests that are concrete and specific and have a good amount of detail. For instance, file paths, personal context about the user's job or situation, column names and values, company names, URLs. A little bit of backstory. Some might be in lowercase or contain abbreviations or typos or casual speech. Use a mix of different lengths, and focus on edge cases rather than making them clear-cut (the user will get a chance to sign off on them).

Bad: `"Format this data"`, `"Extract text from PDF"`, `"Create a chart"`

Good: `"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

For the **should-trigger** queries (8-10), think about coverage. You want different phrasings of the same intent — some formal, some casual. Include cases where the user doesn't explicitly name the skill or file type but clearly needs it. Throw in some uncommon use cases and cases where this skill competes with another but should win.

For the **should-not-trigger** queries (8-10), the most valuable ones are the near-misses — queries that share keywords or concepts with the skill but actually need something different. Think adjacent domains, ambiguous phrasing where a naive keyword match would trigger but shouldn't, and cases where the query touches on something the skill does but in a context where another tool is more appropriate.

The key thing to avoid: don't make should-not-trigger queries obviously irrelevant. "Write a fibonacci function" as a negative test for a PDF skill is too easy — it doesn't test anything. The negative cases should be genuinely tricky.

### Step 2: Review with user

Present the eval set to the user for review using the HTML template:

1. Read the template from `assets/eval_review.html`
2. Replace the placeholders:
   - `__EVAL_DATA_PLACEHOLDER__` → the JSON array of eval items (no quotes around it — it's a JS variable assignment)
   - `__SKILL_NAME_PLACEHOLDER__` → the skill's name
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → the skill's current description
3. Write to a temp file (e.g., `/tmp/eval_review_<skill-name>.html`) and open it: `open /tmp/eval_review_<skill-name>.html`
4. The user can edit queries, toggle should-trigger, add/remove entries, then click "Export Eval Set"
5. The file downloads to `~/Downloads/eval_set.json` — check the Downloads folder for the most recent version in case there are multiple (e.g., `eval_set (1).json`)

This step matters — bad eval queries lead to bad descriptions.

### Step 3: Run the optimization loop

Tell the user: "This will take some time — I'll run the optimization loop in the background and check on it periodically."

Save the eval set to the workspace, then run in the background:

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

Use the model ID from your system prompt (the one powering the current session) so the triggering test matches what the user actually experiences.

While it runs, periodically tail the output to give the user updates on which iteration it's on and what the scores look like.

This handles the full optimization loop automatically. It splits the eval set into 60% train and 40% held-out test, evaluates the current description (running each query 3 times to get a reliable trigger rate), then calls Claude to propose improvements based on what failed. It re-evaluates each new description on both train and test, iterating up to 5 times. When it's done, it opens an HTML report in the browser showing the results per iteration and returns JSON with `best_description` — selected by test score rather than train score to avoid overfitting.

### How skill triggering works

Understanding the triggering mechanism helps design better eval queries. Skills appear in Claude's `available_skills` list with their name + description, and Claude decides whether to consult a skill based on that description. The important thing to know is that Claude only consults skills for tasks it can't easily handle on its own — simple, one-step queries like "read this PDF" may not trigger a skill even if the description matches perfectly, because Claude can handle them directly with basic tools. Complex, multi-step, or specialized queries reliably trigger skills when the description matches.

This means your eval queries should be substantive enough that Claude would actually benefit from consulting a skill. Simple queries like "read file X" are poor test cases — they won't trigger skills regardless of description quality.

### Step 4: Apply the result

Take `best_description` from the JSON output and update the skill's SKILL.md frontmatter. Show the user before/after and report the scores.

---

### Package and Present (only if `present_files` tool is available)

Check whether you have access to the `present_files` tool. If you don't, skip this step. If you do, package the skill and present the .skill file to the user:

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

After packaging, direct the user to the resulting `.skill` file path so they can install it.

---

## Claude.ai-specific instructions

In Claude.ai, the core workflow is the same (draft → test → review → improve → repeat), but because Claude.ai doesn't have subagents, some mechanics change. Here's what to adapt:

**Running test cases**: No subagents means no parallel execution. For each test case, read the skill's SKILL.md, then follow its instructions to accomplish the test prompt yourself. Do them one at a time. This is less rigorous than independent subagents (you wrote the skill and you're also running it, so you have full context), but it's a useful sanity check — and the human review step compensates. Skip the baseline runs — just use the skill to complete the task as requested.

**Reviewing results**: If you can't open a browser (e.g., Claude.ai's VM has no display, or you're on a remote server), skip the browser reviewer entirely. Instead, present results directly in the conversation. For each test case, show the prompt and the output. If the output is a file the user needs to see (like a .docx or .xlsx), save it to the filesystem and tell them where it is so they can download and inspect it. Ask for feedback inline: "How does this look? Anything you'd change?"

**Benchmarking**: Skip the quantitative benchmarking — it relies on baseline comparisons which aren't meaningful without subagents. Focus on qualitative feedback from the user.

**The iteration loop**: Same as before — improve the skill, rerun the test cases, ask for feedback — just without the browser reviewer in the middle. You can still organize results into iteration directories on the filesystem if you have one.

**Description optimization**: This section requires the `claude` CLI tool (specifically `claude -p`) which is only available in Claude Code. Skip it if you're on Claude.ai.

**Blind comparison**: Requires subagents. Skip it.

**Packaging**: The `package_skill.py` script works anywhere with Python and a filesystem. On Claude.ai, you can run it and the user can download the resulting `.skill` file.

**Updating an existing skill**: The user might be asking you to update an existing skill, not create a new one. In this case:
- **Preserve the original name.** Note the skill's directory name and `name` frontmatter field -- use them unchanged. E.g., if the installed skill is `research-helper`, output `research-helper.skill` (not `research-helper-v2`).
- **Copy to a writeable location before editing.** The installed skill path may be read-only. Copy to `/tmp/skill-name/`, edit there, and package from the copy.
- **If packaging manually, stage in `/tmp/` first**, then copy to the output directory -- direct writes may fail due to permissions.

---

## Cowork-Specific Instructions

If you're in Cowork, the main things to know are:

- You have subagents, so the main workflow (spawn test cases in parallel, run baselines, grade, etc.) all works. (However, if you run into severe problems with timeouts, it's OK to run the test prompts in series rather than parallel.)
- You don't have a browser or display, so when generating the eval viewer, use `--static <output_path>` to write a standalone HTML file instead of starting a server. Then proffer a link that the user can click to open the HTML in their browser.
- For whatever reason, the Cowork setup seems to disincline Claude from generating the eval viewer after running the tests, so just to reiterate: whether you're in Cowork or in Claude Code, after running tests, you should always generate the eval viewer for the human to look at examples before revising the skill yourself and trying to make corrections, using `generate_review.py` (not writing your own boutique html code). Sorry in advance but I'm gonna go all caps here: GENERATE THE EVAL VIEWER *BEFORE* evaluating inputs yourself. You want to get them in front of the human ASAP!
- Feedback works differently: since there's no running server, the viewer's "Submit All Reviews" button will download `feedback.json` as a file. You can then read it from there (you may have to request access first).
- Packaging works — `package_skill.py` just needs Python and a filesystem.
- Description optimization (`run_loop.py` / `run_eval.py`) should work in Cowork just fine since it uses `claude -p` via subprocess, not a browser, but please save it until you've fully finished making the skill and the user agrees it's in good shape.
- **Updating an existing skill**: The user might be asking you to update an existing skill, not create a new one. Follow the update guidance in the claude.ai section above.

---

## Reference files

The agents/ directory contains instructions for specialized subagents. Read them when you need to spawn the relevant subagent.

- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — How to do blind A/B comparison between two outputs
- `agents/analyzer.md` — How to analyze why one version beat another

The references/ directory has additional documentation:
- `references/schemas.md` — JSON structures for evals.json, grading.json, etc.

---

Repeating one more time the core loop here for emphasis:

- Figure out what the skill is about
- Draft or edit the skill
- Run claude-with-access-to-the-skill on test prompts
- With the user, evaluate the outputs:
  - Create benchmark.json and run `eval-viewer/generate_review.py` to help the user review them
  - Run quantitative evals
- Repeat until you and the user are satisfied
- Package the final skill and return it to the user.

Please add steps to your TodoList, if you have such a thing, to make sure you don't forget. If you're in Cowork, please specifically put "Create evals JSON and run `eval-viewer/generate_review.py` so human can review test cases" in your TodoList to make sure it happens.

Good luck!

Base directory for this skill: file:///Users/apple/.agents/skills/skill-creator
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/.agents/skills/skill-creator/assets/eval_review.html</file>
<file>/Users/apple/.agents/skills/skill-creator/LICENSE.txt</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/utils.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/generate_report.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/run_loop.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/__init__.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/aggregate_benchmark.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/improve_description.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/quick_validate.py</file>
<file>/Users/apple/.agents/skills/skill-creator/scripts/package_skill.py</file>
</skill_files>
</skill_content>
```

---

## Assistant (Coordinator · MiniMax-M2.7 · 19.3s)

_Thinking:_

Now I have the source document and the skill creation instructions. Let me analyze the content:

The source document is a comprehensive cheat sheet for "Advanced Repomix + Opencode Orchestration: Deep Research & Cross-Dependency Cheat Sheet". It covers:

1. Opencode Tool Taxonomy (complete tool registry, offset reading, LSP tool, CodeSearch, WebSearch vs WebFetch, Context7 MCP)
2. Orchestrator & Swarm Delegation Patterns (agent architecture, Task tool, permission control, Batch tool, Apply Patch)
3. Repomix Advanced Techniques (remote repo packing, skill generation, pack-grep-read pipeline, stacking skills)
4. Orchestration Patterns (hierarchical exploration, concrete templates, shell chaining)
5. Integrated Workflow (long-haul audit protocol, todo tracking, opencode.json setup, environment variables)

This is a very rich, technical document that should become a skill for deep research workflows using OpenCode + Repomix.

Let me create a SKILL.md based on this content. The skill should:
1. Enable deep codebase research with Repomix + OpenCode
2. Trigger when user wants to analyze repos, do cross-dependency research, or needs comprehensive architecture analysis
3. Follow the hierarchical exploration pattern described in the document

Let me draft the SKILL.md:

Key information to extract:
- name: deep-research-repomix or repomix-deep-research
- description: triggers on deep research, codebase analysis, cross-repo dependency tracing, architecture audits, comprehensive analysis
- The skill should cover the tool patterns, orchestration patterns, and the complete workflow

Let me create a well-structured skill following the skill-creator guidelines.


Now I understand the content. This is a comprehensive cheat sheet for **Deep Research & Cross-Dependency Analysis using Repomix + OpenCode orchestration**. Let me create a skill from this.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Draft SKILL.md from source document",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Create skill directory structure",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Save skill to .claude/skills/",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Create test eval prompts for the skill",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Draft SKILL.md from source document",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Create skill directory structure",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Save skill to .claude/skills/",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Create test eval prompts for the skill",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Coordinator · MiniMax-M2.7 · 4.7s)

_Thinking:_

Let me first check the directory structure of existing skills to understand the format and where to place this.

**Tool: glob**

**Input:**
```json
{
  "pattern": "/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.claude/skills/**/*"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "/Users/apple/.claude/skills/**/*"
}
```

**Output:**
```
No files found
```

---

## Assistant (Coordinator · MiniMax-M2.7 · 13.0s)

_Thinking:_

Let me check for existing skills at the workspace level.

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la /Users/apple/hivemind-plugin/.worktrees/harness-experiment/.claude/ 2>/dev/null || echo \"No .claude directory\"",
  "description": "Check for .claude directory"
}
```

**Output:**
```
total 16
drwxr-xr-x   4 apple  staff   128 Apr  2 19:55 .
drwxr-xr-x  41 apple  staff  1312 Apr  3 11:13 ..
-rw-r--r--   1 apple  staff    71 Apr  2 19:03 settings.json
-rw-r--r--   1 apple  staff   179 Apr  2 19:55 settings.local.json

```

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la /Users/apple/.claude/ 2>/dev/null | head -20",
  "description": "Check .claude directory structure"
}
```

**Output:**
```
total 1368
drwxr-xr-x    43 apple  staff    1376 Apr  2 19:51 .
drwxr-x---+  108 apple  staff    3456 Apr  3 11:55 ..
-rw-------@    1 apple  staff   55908 Nov 15 21:27 .claude.json
-rw-------@    1 apple  staff   55514 Nov 12 08:00 .claude.json.backup
-rw-r--r--@    1 apple  staff   14340 Feb 12 21:18 .DS_Store
drwxr-xr-x@   22 apple  staff     704 Mar 18 00:11 agents
drwxr-xr-x     7 apple  staff     224 Apr  3 01:19 backups
drwxr-xr-x     4 apple  staff     128 Feb  9 20:33 cache
-rw-r--r--@    1 apple  staff    3003 Jan 12 17:09 CLAUDE.md
drwxr-xr-x     4 apple  staff     128 Feb 12 21:21 claudesetting
drwx------@   10 apple  staff     320 Mar 18 00:11 commands
drwx------@   16 apple  staff     512 Apr  2 19:17 debug
drwxr-xr-x     2 apple  staff      64 Feb 11 19:43 downloads
drwx------@    3 apple  staff      96 Apr  1 22:26 file-history
drwxr-xr-x     7 apple  staff     224 Mar 18 00:11 get-shit-done
-rw-r--r--     1 apple  staff   17597 Mar 18 00:11 gsd-file-manifest.json
-rw-r--r--@    1 apple  staff  475884 Apr  2 19:51 history.jsonl
drwxr-xr-x     5 apple  staff     160 Mar 18 00:11 hooks
drwxr-xr-x@    5 apple  staff     160 Apr  3 08:06 ide

```

---

## Assistant (Coordinator · MiniMax-M2.7 · 12.8s)

_Thinking:_

Let me check if there's a skills directory or where skills are installed.

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la /Users/apple/.claude/skills 2>/dev/null || echo \"No skills dir\"; ls -la ~/.agents/skills 2>/dev/null | head -20",
  "description": "Check skills directory locations"
}
```

**Error:**
```
The user rejected permission to use this specific tool call.
```

---


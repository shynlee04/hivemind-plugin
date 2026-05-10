---
name: hm-l3-tool-capability-matrix
description: >
  Complete tool capability matrix for the Hivemind ecosystem. Documents ALL tools available
  (native OpenCode + Hivemind custom + MCP provider), with per-tool descriptions, permission
  levels (allow/ask/ask), glob support, per-depth typical permissions, and per-lineage rules
  (hm STRICT, hf FLEXIBLE, gate INTERNAL, stack reference). Use when configuring agent permissions,
  designing delegation boundaries, auditing tool exposure, or deciding which tools a specialist
  agent needs. Triggers: tool permission, tool capability, tool matrix, what tools are available,
  agent tool configuration, delegation tool boundary, which tools can L2 agents use, lineage
  tool rules, hm lineage tools, hf lineage tools.
  NOT for general coding tasks or direct code implementation.
metadata:
  layer: "3"
  role: "reference"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  context-bomb: false
  scope: "All 5 lineages — hm-*, hf-*, gate-*, stack-*, unprefixed"
allowed-tools:
  - Read
  - Grep
  - Glob
---

## The Iron Law

```
Every tool allowance is a trust boundary. Know the matrix before opening the gates.
```

# Tool Capability Matrix

## Overview

This reference skill documents ALL tools available in the Hivemind ecosystem across three categories: native OpenCode built-in tools, Hivemind custom harness tools (from `opencode-harness` npm package), and MCP-provided external tools. It provides per-depth typical permission patterns derived from the actual 56 agent definitions in `.opencode/agents/`, and documents lineage-specific tool rules.

**Purpose:** When configuring agent permissions, designing delegation boundaries, or auditing tool exposure, use this matrix to make consistent, lineage-compliant decisions.

**This skill documents — it does not configure.** Route actual permission changes through `hf-meta-builder` or `opencode-config-workflow`.

## On Load

1. Identify the agent depth (L0/L1/L2/L3) and lineage (hm/hf/gate/stack/unprefixed)
2. Scan the per-depth matrix for the agent's typical tool allowances
3. Check the per-lineage rules for cross-lineage restrictions
4. If designing a new agent, use the `Per-Depth Typical Permissions` section as a starting template
5. Verify any proposed tool allowances against the lineage rules before finalizing

---

## Part 1: Complete Tool Catalog

### 1A. Native OpenCode Tools

These are built into every OpenCode runtime. Always available unless explicitly denied.

| Tool | Category | Permissions | Glob/Pattern Support | Description |
|------|----------|------------|----------------------|-------------|
| `read` | Read | allow/ask/ask | Yes (file path) | Read file contents. Supports line ranges. `.env` files denied by default. |
| `grep` | Read | allow/ask/ask | Yes (regex) | Search file contents using regex. Respects `.gitignore` via ripgrep. |
| `glob` | Read | allow/ask/ask | Yes (glob patterns) | Find files by pattern matching. Returns paths sorted by modification time. |
| `list` | Read | allow/ask/ask | Yes (directory path) | List files and directories. Supports glob filtering. |
| `edit` | Write | allow/ask/ask | Yes (file path) | Modify existing files via exact string replacements. Covers `write`, `patch`, `multiedit`. |
| `write` | Write | allow/ask/ask | Yes (file path) | Create new files or overwrite existing ones. Controlled by `edit` permission. |
| `patch` | Write | allow/ask/ask | — | Apply patches/diffs to codebase. Controlled by `edit` permission. |
| `bash` | Execute | allow/ask/ask | Yes (command prefix) | Execute shell commands. Granular rules match command prefixes (e.g., `git *`). |
| `task` | Dispatch | allow/ask/ask | Yes (subagent type) | Launch subagent sessions. Disabled for subagents by default. |
| `skill` | Load | allow/ask/ask | Yes (skill name) | Load SKILL.md content. Pattern matching by skill name. |
| `todowrite` | Tracking | allow/ask/ask | — | Manage structured task lists. Disabled for subagents by default. |
| `webfetch` | Network | allow/ask/ask | Yes (URL) | Fetch web page content as markdown. Pattern matching by URL. |
| `websearch` | Network | allow/ask/ask | Yes (query) | Search the web via Exa AI. Requires `OPENCODE_ENABLE_EXA=1`. |
| `codesearch` | Network | allow/ask/ask | Yes (query) | Search code across repositories. |
| `question` | Interaction | allow/ask/ask | — | Ask user questions during execution with structured options. |
| `lsp` | Intelligence | allow/ask/ask | — (experimental) | Interact with LSP servers: definitions, references, hover, call hierarchy. Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`. |

**Permission special cases:**
- `external_directory` — triggered when any tool touches paths outside the working directory. Default: `ask`.
- `doom_loop` — triggered when the same tool call repeats 3+ times with identical input. Default: `ask`.
- `edit` covers ALL file modification tools: `edit`, `write`, `patch`, `multiedit`.

### 1B. Hivemind Custom Tools (opencode-harness)

These are registered by the `opencode-harness` npm package plugin. Available when the plugin is loaded in `opencode.json`.

| Tool | Source File | Category | Permissions | Description |
|------|-----------|----------|------------|-------------|
| `delegate-task` | `src/tools/delegate-task.ts` | Delegation | allow/ask/ask | Delegate work to a specialist agent via SDK child-session dispatch. Always-background WaiterModel. Returns delegation ID immediately. |
| `delegation-status` | `src/tools/delegation-status.ts` | Delegation | allow/ask/ask | Check delegation status and retrieve results. Query by delegation ID or filter by status. |
| `run-background-command` | `src/tools/run-background-command.ts` | Execution | allow/ask/ask | Run CLI commands in shared background PTY sessions with queue-governed dispatch, output reads, interactive input, and termination. |
| `session-journal-export` | `src/tools/session-journal-export.ts` | Persistence | allow/ask/ask | Export bounded Session Journal and Execution Lineage quick-read summaries as JSON or Markdown. |
| `prompt-skim` | `src/tools/prompt-skim/` | Analysis | allow/ask/ask | Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths, calculate complexity score. |
| `prompt-analyze` | `src/tools/prompt-analyze/` | Analysis | allow/ask/ask | Deep prompt analysis: contradictions, vagueness, missing scope, clarity signals. |
| `session-patch` | `src/tools/session-patch/` | Mutation | allow/ask/ask | Patch specific sections in a session file with backup. |
| `configure-primitive` | `src/tools/configure-primitive.ts` | Configuration | allow/ask/ask | Configure, read, list, or inspect OpenCode primitives (agent, command, skill). Supports compile/decompile from JSON/YAML with dry-run preview. |
| `validate-restart` | `src/tools/validate-restart.ts` | Validation | allow/ask/ask | Validate that compiled OpenCode primitives are discoverable and free of runtime issues after restart. Checks circular deps, missing refs, permission inheritance breaks. |
| `nl-route` | (harness-native) | Routing | allow/ask/ask | Route a natural language request to one of three test commands (test-echo, test-list, test-status). |

### 1C. MCP-Provided Tools (External Providers)

These tools are available when their MCP servers are configured in `opencode.json`. Availability depends on API keys and server configuration.

| Provider | Key Tools | Category | Auth Required |
|----------|-----------|----------|---------------|
| **Brave Search** | `brave_web_search`, `brave_local_search`, `brave_video_search`, `brave_image_search`, `brave_news_search`, `brave_summarizer` | Web | API key (`BRAVE_API_KEY`) |
| **Tavily** | `tavily_search`, `tavily_extract`, `tavily_crawl`, `tavily_map`, `tavily_research` | Web | API key (`TAVILY_API_KEY`) |
| **Exa** | `exa_web_search_exa`, `exa_web_fetch_exa` | Web | API key (`EXA_API_KEY`) |
| **Context7** | `context7_resolve-library-id`, `context7_query-docs` | Docs | API key or anonymous |
| **DeepWiki** | `deepwiki_read_wiki_structure`, `deepwiki_read_wiki_contents`, `deepwiki_ask_question` | Docs | None |
| **Repomix** | `repomix_pack_codebase`, `repomix_pack_remote_repository`, `repomix_generate_skill`, `repomix_attach_packed_output`, `repomix_read_repomix_output`, `repomix_grep_repomix_output` | Code | None |
| **GitHub** | `github_create_or_update_file`, `github_search_repositories`, `github_create_repository`, `github_get_file_contents`, `github_push_files`, `github_create_issue`, `github_create_pull_request`, `github_fork_repository`, `github_create_branch`, `github_list_commits`, `github_list_issues`, `github_update_issue`, `github_add_issue_comment`, `github_search_code`, `github_search_issues`, `github_search_users`, `github_get_issue`, `github_get_pull_request`, `github_list_pull_requests`, `github_create_pull_request_review`, `github_merge_pull_request`, `github_get_pull_request_files`, `github_get_pull_request_status`, `github_update_pull_request_branch`, `github_get_pull_request_comments`, `github_get_pull_request_reviews` | Git | `GITHUB_TOKEN` |
| **GitMCP** | `gitmcp_fetch_github_com_documentation`, `gitmcp_search_github_com_documentation`, `gitmcp_search_github_com_code`, `gitmcp_fetch_generic_url_content` | Git | None |
| **Playwright** | `mcp_playwright_browser_navigate`, `browser_click`, `browser_snapshot`, `browser_screenshot`, `browser_fill_form`, `browser_type`, `browser_evaluate`, `browser_tabs`, `browser_wait_for`, `browser_close`, `browser_resize`, `browser_console_messages`, `browser_handle_dialog`, `browser_file_upload`, `browser_drag`, `browser_hover`, `browser_select_option`, `browser_press_key`, `browser_run_code` | Browser | None (uses bundled Chromium) |
| **Fetcher** | `fetcher_fetch_url`, `fetcher_fetch_urls`, `fetcher_browser_install` | Web | None |
| **Sequential Thinking** | `sequential_thinking_sequentialthinking` | Reasoning | None |
| **Stitch** | `stitch_create_project`, `stitch_get_project`, `stitch_list_projects`, `stitch_list_screens`, `stitch_get_screen`, `stitch_generate_screen_from_text`, `stitch_edit_screens`, `stitch_generate_variants`, `stitch_create_design_system`, `stitch_update_design_system`, `stitch_list_design_systems`, `stitch_apply_design_system` | Design | API key |
| **MCP Playwright (alt)** | `mcp-playwright_browser_navigate`, etc. | Browser | None |

> **Note:** MCP tool names use the `mcp__server__tool` or `server_tool` format depending on the MCP transport. Actual tool names in your environment may differ. Use `list` or check MCP server configuration for exact names.

### 1D. Special Permission Guards

| Guard | Default | When Triggered | Controls |
|-------|---------|----------------|----------|
| `external_directory` | `ask` | Any tool touches paths outside working directory | All file-system tools (read, edit, bash, glob, grep, list) |
| `doom_loop` | `ask` | Same tool call repeats 3+ times with identical input | All tools |
| `read` → `*.env` | `ask` | Reading `.env` files | `read` tool specifically |

---

## Part 2: Per-Depth Typical Permissions

Derived from the actual 56 agent definitions in `.opencode/agents/`. Use these as starting templates when designing new agents.

### L0 (Orchestrator — Primary, front-facing)

L0 orchestrators coordinate multi-agent workflows. They route, they do not implement.

| Tool | Typical | Rationale |
|------|---------|-----------|
| `read` | `allow` | Read project context, plans, state files |
| `edit` | `ask` | Orchestrators do not modify files |
| `write` | `ask` | Orchestrators do not create files |
| `bash` | `ask` (all) | No shell execution; delegate to L1/L2 |
| `glob` | `allow` | Discover project structure |
| `grep` | `allow` | Search codebase for context |
| `task` | `allow` (specific agents) | Primary function: dispatch L1 coordinators |
| `delegate-task` | `allow` | Harness delegation with tracking |
| `delegation-status` | `allow` | Monitor dispatched tasks |
| `skill` | `allow` | Load coordinator skills |

**Actual L0 agent examples:** `hm-l0-orchestrator`, `hf-l0-orchestrator`, `gsd-executor`

### L1 (Coordinator — Subagent, dispatches L2 specialists)

L1 coordinators manage parallel task waves. They orchestrate subagent dispatch but do not implement directly.

| Tool | Typical | Rationale |
|------|---------|-----------|
| `read` | `allow` | Read context, plans, subagent results |
| `edit` | `ask` | Coordinators do not modify files |
| `write` | `ask` | Coordinators do not create files |
| `bash` | Restricted: `git *`, `node *` | Git operations, Node.js for state queries |
| `glob` | `allow` | Discover project structure |
| `grep` | `allow` | Search codebase for context |
| `task` | `allow` (all hm-l2-* or hf-l2-* agents) | Primary function: dispatch L2 specialists |
| `delegate-task` | `allow` or `ask` | Varies — hm coordinators ask, hf coordinators may allow |
| `delegation-status` | `allow` or `ask` | Varies |
| `skill` | `allow` | Load coordination skills |

**Actual L1 agent examples:** `hm-l1-coordinator`, `hf-l1-coordinator`

### L2 (Specialist — Subagent, implements/analyzes)

L2 specialists perform the actual work: research, implementation, review, debugging, authoring. Permissions are domain-specific.

#### Read-Only L2 (researcher, reviewer, auditor, validator, evaluator)

| Tool | Typical | Rationale |
|------|---------|-----------|
| `read` | `allow` | Core function |
| `edit` | `ask` | Read-only role |
| `write` | `ask` | Read-only role |
| `bash` | Restricted: `git *`, `node *`, `npx *` | Git status, test execution, Node.js CLI tools |
| `glob` | `allow` | Search and navigation |
| `grep` | `allow` | Content search |
| `task` | `ask` (all) or restricted to specific sub-agents | Most read-only specialists cannot delegate |
| `webfetch` | `allow` | Research tasks |
| `websearch` | `allow` | Research tasks |

**Actual read-only L2 agent examples:** `hm-l2-researcher`, `hm-l2-reviewer`, `hm-l2-auditor`, `hm-l2-validator`, `hm-l2-assessor`, `hm-l2-scout`, `hm-l2-synthesizer`

#### Read-Write L2 (executor, fixer, builder)

| Tool | Typical | Rationale |
|------|---------|-----------|
| `read` | `allow` | Read source files |
| `edit` | `allow` | Modify code |
| `write` | `allow` | Create new files |
| `bash` | Restricted: `git *`, `node *`, `npm *`, `npx *` | Build, test, commit |
| `glob` | `allow` | File discovery |
| `grep` | `allow` | Code search |
| `task` | `ask` (all) or restricted (e.g., `hm-l2-reviewer`) | Most cannot delegate; some can dispatch reviewers |
| `webfetch` | `allow` if research needed | Documentation lookup |
| `websearch` | `allow` if research needed | Internet search |

**Actual read-write L2 agent examples:** `hm-l2-executor`, `hm-l2-debugger`, `hm-l2-implementator`, `hm-l2-optimizer`, `hf-l2-skill-builder`, `hf-l2-agent-builder`, `hf-l2-command-builder`, `hf-l2-tool-builder`

#### Hivemind Harness Tool Denials at L2

Most L2 agents explicitly ask these harness tools (they are L0/L1 tools):

| Tool | L2 Default | Rationale |
|------|-----------|-----------|
| `delegate-task` | `ask` | Delegation is coordinator privilege |
| `delegation-status` | `ask` | Status polling is coordinator privilege |
| `session-journal-export` | `ask` | Session management is coordinator privilege |
| `prompt-skim` | `ask` | Prompt pipeline is coordinator/service privilege |
| `prompt-analyze` | `ask` | Prompt pipeline is coordinator/service privilege |
| `session-patch` | `ask` | Session mutation is coordinator privilege |
| `configure-primitive` | `ask` | Primitive configuration is meta-builder privilege |
| `validate-restart` | `ask` | System validation is meta-builder privilege |
| `run-background-command` | `ask` | Background execution is coordinator privilege |

### L3 (Reference — Read-only, research/reference-only)

L3 skills are reference and research skills. They are loaded by the `skill` tool, not dispatched as agents. When an L3 skill is activated as an agent:

| Tool | Typical | Rationale |
|------|---------|-----------|
| `read` | `allow` | Read reference files |
| `grep` | `allow` | Search reference content |
| `glob` | `allow` | Find reference files |
| `edit` | `ask` | Reference skills do not modify code |
| `write` | `ask` | Reference skills do not create code |
| `bash` | `ask` (all) | No execution |
| `task` | `ask` (all) | No delegation |
| `webfetch` | `ask` | Not needed for offline reference |

---

## Part 3: Per-Lineage Tool Rules

### hm-* Lineage (Product Development) — STRICT

```
hm-* agents MAY ONLY load:
  ✅ hm-* skills (product development)
  ✅ gate-* skills (quality triad)
  ✅ stack-* skills (tech reference)
  
hm-* agents MUST NOT:
  ❌ hf-* skills (meta-builder) — route to hf-orchestrator instead
  ❌ hf-* agents (via task or delegate-task)
  ❌ Run meta-concept creation tools (configure-primitive, validate-restart)
```

**Tool boundary enforcement at hm-L1/L2:**
- `skill` tool: only hm-*, gate-*, stack-* skill names allowed
- `task` tool: only hm-* agent types allowed
- `delegate-task`: only hm-* agent types allowed
- `configure-primitive`: always ask
- `validate-restart`: always ask

### hf-* Lineage (Meta-Builder) — FLEXIBLE

```
hf-* agents MAY LOAD:
  ✅ hf-* skills (meta-builder)
  ✅ hm-* skills (for codebase investigation, cross-validation)
  ✅ gate-* skills (quality triad)
  ✅ stack-* skills (tech reference)

hf-* agents MAY DELEGATE:
  ✅ hf-* agents (meta-builder specialists)
  ✅ hm-* agents (for codebase investigation tasks)

hf-* agents have WRITE access to:
  ✅ .opencode/ (agents, commands, skills, rules, permissions)
  ✅ src/tools/ (tool implementors)
  ✅ .hivefiver-meta-builder/ (lab source of truth)
```

**Tool permissions for hf-L2 agents:**
- `edit`/`write`: restricted to `.opencode/**`, `src/tools/**`, `.hivefiver-meta-builder/**`
- `configure-primitive`: allow (core meta-builder function)
- `validate-restart`: allow (core meta-builder function)

### gate-* Lineage (Internal Quality Gates) — INTERNAL ONLY

```
gate-* skills are THIS PROJECT ONLY (not shipped).
They are internal quality verification gates.

gate-* skills:
  ✅ May be loaded by hm-* and hf-* agents (as quality checks)
  ✅ Run as read-only evaluations
  ✅ Produce scorecards and evidence reports
  ❌ May NOT modify code
  ❌ May NOT delegate to other agents
  ❌ Are NOT included in shipped npm package
```

### stack-* Lineage (Tech Stack Reference) — REFERENCE

```
stack-* skills are shipped reference documentation.
They document specific technology stacks.

stack-* tools:
  read — allow
  grep — allow
  glob — allow
  All others — ask (reference skills are read-only)
```

### Unprefixed (Framework-Agnostic) — NEUTRAL

```
opencode-config-workflow is framework-agnostic.
Tools determined by the OpenCode config workflow needs.
Typically: read, glob, grep, configure-primitive.
```

---

## Part 4: Permission Pattern Reference

### Granular Bash Rules

```json
{
  "bash": {
    "*": "ask",
    "git *": "allow",
    "node *": "allow",
    "npm *": "allow",
    "npx *": "allow"
  }
}
```

### Granular Edit Rules (Path-Scoped)

```json
{
  "edit": {
    "*": "ask",
    ".opencode/**": "allow",
    "src/tools/**": "allow"
  }
}
```

### Granular Task Rules (Agent-Type-Scoped)

```json
{
  "task": {
    "*": "ask",
    "hm-l2-reviewer": "allow",
    "hm-l2-*": "allow"
  }
}
```

### Granular Skill Rules (Lineage-Scoped)

```json
{
  "skill": {
    "*": "ask",
    "hm-*": "allow",
    "gate-*": "allow",
    "stack-*": "allow"
  }
}
```

---

## Part 5: 56-Agent Tool Allowance Summary

Based on actual agent definitions in `.opencode/agents/` (April 2026):

| Depth | Count | Tool Pattern |
|-------|-------|-------------|
| **L0 Primary** | 2 (hm, hf) | read+glob+grep+task+skill; no edit/write/bash |
| **L1 Coordinator** | 2 (hm, hf) | read+glob+grep+task(specific)+bash(git,node); no edit/write |
| **L2 hm Specialist** | 44 | Domain-specific: read-only (researchers/reviewers) or read-write (executors/builders); bash restricted to git+node+npx |
| **L2 hf Specialist** | 10 | read+edit/write(scoped to .opencode/)+bash(git,node)+glob+grep; task denied or restricted |
| **GSD Agents** | 33 | Varies by role; gsd-executor has full read-write; gsd-code-reviewer is read-only |

**Key observation:** 0 out of 56 agents have unrestricted `bash` permission. All bash access is pattern-restricted.

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Gate-Opener** — allowing unrestricted bash to L2 agents | `bash: allow` without patterns | Restrict to `git *`, `node *`, `npm *`, `npx *` |
| **The Cross-Lineage Breaker** — hm agent loading hf skill | hm agent frontmatter includes hf-* in skills array | Remove hf-* skills; cross-lineage access is hf→hm only |
| **The Delegation Leaker** — L2 agent allowed to delegate via task | `task: allow` on read-only agent | Set `task: "*": ask` for all L2 specialists |
| **The File-Scoper** — edit allowed on entire project | `edit: allow` without path restriction | Scope to specific directories: `.opencode/**`, `src/**` |
| **The Harness Abuser** — L2 agent using delegate-task | `delegate-task: allow` on specialist agent | ask all harness delegation tools on L2 |
| **The Blind Agent** — no read permission but expected to analyze code | `read: ask` on researcher agent | Always allow `read` on any agent expected to read code |

---

## Self-Correction

### Mode 1: Permission Too Restrictive (Agent Cannot Function)

```
Is the agent failing with "permission denied" errors?
├── Check the tool name in the error → is it needed for the agent's domain?
│   ├── YES → Add a granular allow rule scoped to the specific use case
│   ├── NO → The agent is attempting unauthorized work → flag for review
│   └── UNCLEAR → Check the agent's skills list and role description
└── After adding permission → verify the agent can complete its task
```

**Example:** Researcher agent getting `webfetch: ask` errors. If research-domain agent, add `webfetch: allow`. If execution-domain agent, ask is correct — the agent is straying from its domain.

### Mode 2: Permission Too Permissive (Agent Has Unnecessary Access)

```
Is the agent using tools outside its domain?
├── Audit successful tool calls → which tools are used?
├── Check for unused tool permissions → list tools allowed but never called
│   ├── UNUSED → Remove the permission (principle of least privilege)
│   └── RARELY USED → Consider ask instead of allow
└── Check for cross-lineage tool usage → hm agent using hf tools?
    └── YES → Violation. Remove the tool and route the task.
```

### Mode 3: Lineage Boundary Violation

```
Is this an hm agent attempting meta-builder work?
├── Agent tried to load hf-* skill → BLOCK. Route to hf-orchestrator.
├── Agent tried to use configure-primitive → BLOCK. Route to hf-meta-builder.
├── Agent tried to use validate-restart → BLOCK. Route to hf-meta-builder.
├── Agent tried to delegate to hf-* agent → BLOCK. Cross-lineage delegation is hf→hm only.
└── Agent is doing meta-concept work → Route user to hf lineage.
```

### Mode 4: MCP Tool Availability Confusion

```
Agent expected MCP tool but it's not available?
├── Check opencode.json for the MCP server configuration
├── Check if the required API key is set (env var)
│   ├── NOT SET → MCP tools from that provider are not available
│   └── SET → Check MCP server is running; restart OpenCode if needed
├── Check if the tool name matches the actual MCP naming convention
│   └── MCP tools may use mcp__provider__tool or provider_tool format
└── If tool is confirmed unavailable → redesign without it or add the provider
```

### Maximum Correction Attempts

3 per permission configuration cycle. After 3 correction cycles without resolution:
- Document the agent's domain and the specific permission gap
- Report: `Agent: <name>, Blocked Tool: <tool>, Reason: <why it's needed>, Attempts: <count>`
- Escalate to manual review with the matrix as context

---

## Validation Loop

```
do → audit → fix → repeat

1. AUDIT: Read the target agent's frontmatter permissions
2. COMPARE: Check each allowed tool against this matrix (depth + lineage rules)
3. DETECT: Flag violations (cross-lineage, overly permissive, missing required)
4. FIX: Apply granular rules following the templates in Section 4
5. VERIFY: Confirm the agent can perform its domain tasks
```

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `hm-l3-opencode-platform-reference` | Source for native tool permissions documentation |
| `hm-l3-subagent-delegation-patterns` | Delegation patterns that depend on correct tool permissions |
| `hf-l2-naming-syndicate` | Naming rules for agents whose tools this matrix covers |
| `hf-l2-delegation-gates` | Authorization gates that use tool permissions as enforcement |
| `opencode-config-workflow` | Configuration workflow for applying permission rules |

---

## Success Criteria

- [ ] All 17 native OpenCode tools documented with permission levels and pattern support
- [ ] All 10 Hivemind custom tools documented with source files and descriptions
- [ ] 13 MCP provider groups documented with key tools and auth requirements
- [ ] Per-depth typical permissions documented for L0, L1, L2 (read-only), L2 (read-write), L3
- [ ] Per-lineage rules documented for hm-* (STRICT), hf-* (FLEXIBLE), gate-*, stack-*, unprefixed
- [ ] 56-agent tool allowance summary derived from actual agent definitions
- [ ] Granular permission pattern templates (bash, edit, task, skill) for copy-paste usage
- [ ] Self-correction with 4 failure modes
- [ ] Evals with 3 scenarios in `evals/evals.json`
- [ ] RICH-8 scorecard in `metrics/rich-gate-scorecard.md`
- [ ] No hardcoded paths except example patterns

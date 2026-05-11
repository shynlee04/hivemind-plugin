---
sessionID: ses_1e99c28bbffek55k6UCs0G7d4N
created: 2026-05-11T09:35:02.481Z
updated: 2026-05-11T09:35:02.481Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with adding/upgrading the IRON CLAW governance section in 4 OpenCode platform reference skills. You MUST read each SKILL.md, find the right insertion point (after the frontmatter/overview, before the main content), and add the standardized IRON CLAW block using the Edit tool.

## Files to Edit (in /Users/apple/hivemind-plugin-private/.opencode/skills/):

1. `hm-l3-opencode-platform-reference/SKILL.md` - Already has "## Constitutional Live-Fetch Compliance" section. Insert the IRON CLAW block right after the "## Overview" section (which ends around line 18), BEFORE "## Constitutional Live-Fetch Compliance". Place it as a new section between Overview and Constitutional.

2. `stack-l3-opencode/SKILL.md` - Already has "## Constitutional Compliance: Two-Tier Trust Model" at line 97. The skill has a "## Quick Navigation" section. Insert the IRON CLAW block as a new section right BEFORE "## Constitutional Compliance: Two-Tier Trust Model" (around line 97), or as a prominent subsection WITHIN the Constitutional Compliance area.

3. `hm-l3-opencode-non-interactive-shell/SKILL.md` - Has "## The Iron Law" at line 18 for shell safety. Add the tech-stack IRON CLAW as a new section called "## 🔨 IRON CLAW: Tech-Stack References Governance" right after "## Reference Map" section (near the end of the file, check the structure first).

4. `hm-l3-opencode-project-audit/SKILL.md` - Has "## The Iron Law" at line 22 for audit. Add the tech-stack IRON CLAW as a new section called "## 🔨 IRON CLAW: Tech-Stack References Governance" before the "## Architecture" section (around line 38). Read the file to find the exact insertion point.

## The Standardized IRON CLAW Block

For EACH file, add this EXACT block (with the heading adapted to each file's context):

```
## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |
```

## Execution Instructions

For each file:
1. Read the SKILL.md first to understand its structure
2. Find the best insertion point (after Overview, before main content sections, or as a new section in the governance area)
3. Use the Edit tool to add the block
4. Adapt the heading slightly to fit the file's existing section hierarchy (e.g., if it already has "## Constitutional Compliance", insert right before it)

## Return Format

Return a structured report listing each file edited, the insertion point chosen, and confirmation that the edit was applied.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-opencode
3:   version: "1.14.44"
4:   description: "OpenCode SDK v1.14.44 + Plugin internals for feature development, architecture, auditing, quality checking, test building, TUI development, ACP IDE integration, and gatekeeping. Use when you need to: create an OpenCode tool, register a plugin hook, understand chat.params or shell.env, work with the TUI keymap API, implement ACP agent client protocol, debug hook composition chains, validate tool schemas with Zod, handle session compaction, build TUI plugins with keybindings, integrate OpenCode with an IDE via ACP, or understand the SDK client/server architecture. Contains BEYOND-DOCS expert knowledge extracted from anomalyco/opencode source. Triggers on: opencode sdk, opencode plugin, definePlugin, tool registration, hook registration, session management, delegate task, opencode api, plugin development, opencode tool, opencode hook, tool.execute, chat.params, chat.headers, shell.env, permission.ask, session.compacting, ToolContext, ToolResult, PluginInput, Hooks, AuthHook, ProviderHook, createOpencodeClient, BunShell, hook composition, tool schema validation, opencode sse, opencode abort signal, acp protocol, agent client protocol, TUI keymap, workspace adapter, api.keymap, TUI plugin, ACP integration, IDE integration, keybinding, keymap registerLayer, opencode ACP, opencode TUI v2, stack opencode, opencode reference, opencode API docs."
5: metadata:
6:   layer: "3"
7:   role: "reference"
8:   lineage: "stack"
9: ---
10: 
11: # Stack: OpenCode SDK + Plugin
12: 
13: > **Version:** 1.14.44 | **Source:** [anomalyco/opencode](https://github.com/anomalyco/opencode) | **Bundled:** 22,771 lines
14: 
15: ## ⚠️ Key Gotchas (Read Before Coding)
16: 
17: 1. **`tool()` is an identity function** — zero runtime validation, pure TypeScript branding
18: 2. **`context.ask()` returns Effect, not Promise** — `await` does nothing; use `Effect.runPromise()`
19: 3. **Hook output is mutable pass-through** — last-write-wins at field level; always spread
20: 4. **`z.transform()`/`.refine()`/`z.lazy()` silently break** in tool schemas — only use primitives
21: 5. **Abort signal is cooperative** — runtime doesn't force-kill your async operations
22: 6. **Session has no "completed" state** — only idle/busy/retry; sessions live until deleted
23: 7. **No hook priority system** — ordering determined by `Config.plugin[]` array position
24: 
25: > ⚠️ **Validation Gate:** These gotchas are behavioral claims verified at v1.14.44. Before relying on any gotcha in production code, perform live verification via MCP tools (see Constitutional Compliance section). SDK updates may invalidate these claims.
26: 
27: ## Quick Navigation
28: 
29: | Document | What You'll Find | When to Load |
30: |----------|-----------------|--------------|
31: | **[Expert: Hook Composition](references/expert/hook-composition.md)** | Multi-plugin ordering, output mutation, compaction flow, event types (32-40+), permission override | Writing hooks, debugging hook chains, compaction recovery |
32: | **[Expert: Tool Internals](references/expert/tool-internals.md)** | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, ToolState machine | Creating tools, debugging tool errors, schema design |
33: | **[Expert: Client-Server](references/expert/client-server.md)** | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences | SDK integration, delegation, session recovery |
34: | [API: Plugin](references/api/plugin.md) | Hook signatures, PluginInput shape, auth/provider hooks | Looking up exact TypeScript signatures |
35: | [API: SDK](references/api/sdk.md) | Session CRUD, messaging, client setup | SDK client usage |
36: | [API: Types](references/api/types.md) | All exported TypeScript types | Type lookup |
37: | [Patterns: Dev](references/patterns/dev.md) | Tool creation, hook wiring, plugin assembly | Feature development |
38: | [Patterns: Testing](references/patterns/testing.md) | Mock SDK, tool testing, hook testing | Writing tests |
39: | [Patterns: Gatekeeping](references/patterns/gatekeeping.md) | Quality gates, type safety, hook correctness | Code review |
40: | **[API: ACP](references/api/acp.md)** | Agent Client Protocol — JSON-RPC over stdio for IDE integration | Building IDE plugins, Zed/VS Code integration |
41: | **[API: TUI v2](references/api/tui-v2.md)** | TUI keymap API, keybinding layers, command dispatch | TUI plugin development, custom keybindings |
42: | **[Pipeline Patterns](references/pipeline-patterns.md)** | How stack-opencode composes with other skills in development workflows | Architecture design, workflow composition |
43: | **[Stack Chains](references/stack-chains.md)** | Dependency ordering between stack-* skills | Skill loading order, dependency resolution |
44: | **[Department Bundles](references/department-bundles.md)** | Role-based skill loading bundles | Team configuration, agent setup |
45: 
46: ## Decision Trees
47: 
48: ### "Should I use a tool or a hook?"
49: 
50: ```
51: Need the LLM to call it?           → TOOL (tool.execute flow)
52: Need to modify LLM behavior?       → HOOK (chat.params, tool.definition)
53: Need to observe events?            → EVENT hook (fire-and-forget)
54: Need to inject env vars?           → SHELL.ENV hook (not tool args!)
55: Need to auto-approve permissions?  → PERMISSION.ASK hook
56: Need to recover from compaction?   → SESSION.COMPACTING + AUTOCONTINUE hooks
57: ```
58: 
59: ### "Which Zod types work in tool schemas?"
60: 
61: ```
62: z.string/number/boolean/array/object/enum/optional → ✅ Reliable
63: z.record/tuple/union/default                        → ⚠️ Partial conversion
64: z.transform/refine/lazy/any                         → ❌ Silent failure
65: ```
66: 
67: ### "Which SDK version should I use?"
68: 
69: ```
70: Need workspace isolation or session restore? → v2 (createOpencodeClient v2)
71: Just basic session/message CRUD?             → v1 works fine
72: Writing a plugin (hooks/tools)?              → Plugin API is version-independent
73: ```
74: 
75: ## Ecosystem Routing
76: 
77: | When working on... | Also load... | Because... |
78: |---------------------|--------------|------------|
79: | Tool schemas with Zod | `stack-zod` | Zod→JSON Schema conversion has silent failures |
80: | Testing plugin behavior | `stack-vitest` | SDK mocking patterns, ToolContext mock setup |
81: | Next.js sidecar dashboard | `stack-nextjs` | Sidecar reads SSE events, consumes SDK client |
82: | Quality gate for plugin code | `gate-lifecycle-integration` | 9-surface mutation authority table, CQRS boundaries |
83: | Evidence for tool outputs | `gate-evidence-truth` | L1-L5 hierarchy, ToolStateCompleted as evidence |
84: | Spec compliance for features | `gate-spec-compliance` | Traceability between specs and tool/hook implementations |
85: 
86: ## Source Files (for grep in bundled/)
87: 
88: | Package | Key Files |
89: |---------|-----------|
90: | `@opencode-ai/plugin` | `index.ts` (types), `tool.ts` (helper), `shell.ts` (BunShell), `tui.ts` (TUI API) |
91: | `@opencode-ai/sdk` | `index.ts`, `client.ts`, `server.ts`, `gen/sdk.gen.ts`, `gen/types.gen.ts` |
92: 
93: ## Updating
94: 
95: Run `scripts/update.sh` to re-download source when OpenCode version changes.
96: 
97: ## Constitutional Compliance: Two-Tier Trust Model
98: 
99: > **This skill enforces a strict two-tier authority model.** Bundled references provide orientation context; live sources provide truth.
100: 
101: ### Trust Tiers
102: 
103: | Tier | Role | Sources | When to Trust |
104: |------|------|---------|---------------|
105: | **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live GitHub, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
106: | **Reference Tier** (SUPPLEMENTARY) | Provide context | Bundled source pack, local cached assets | For architecture orientation, pattern understanding, historical context |
107: 
108: ### Staleness Severity Scale
109: 
110: | Severity | Age | Action |
111: |----------|-----|--------|
112: | CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
113: | HIGH | > 7 days | SHOULD re-verify; bundled data acceptable for orientation only |
114: | STANDARD | > 30 days | Re-verify before finalizing findings |
115: | LOW | > 90 days | Treat as potentially outdated; note in findings |
116: 
117: ### Version Drift Detection (MANDATORY GATE)
118: 
119: **Before using ANY bundled reference for production code, perform this check:**
120: 
121: 1. Read the `version` field in `metadata.json` (currently: `1.14.44`)
122: 2. Compare against the consumer's installed versions:
123:    ```bash
124:    npm list @opencode-ai/plugin @opencode-ai/sdk
125:    ```
126: 3. If versions differ:
127:    - **WARN** the consumer that bundled references may be stale
128:    - **REQUIRE** live verification via MCP tools before proceeding
129:    - **NOTE** the version gap in any findings or code comments
130: 4. If versions match: bundled references are valid for orientation but still require live verification for production decisions
131: 
132: ### MCP Live Verification Tools
133: 
134: When live verification is required (which is always before production use), use these C5 tools:
135: 
136: | Tool | Purpose | When to Use |
137: |------|---------|-------------|
138: | `context7_resolve_library_id` → `context7_query_docs` | API documentation lookup | Verifying API signatures, hook shapes, type definitions |
139: | `deepwiki_ask_question` | Architecture pattern queries | Understanding design decisions, composition patterns |
140: | `gitmcp_search_github_com_code` | Source code search | Finding specific implementations, verifying behavioral claims |
141: | `github_get_file_contents` | Read specific files from `anomalyco/opencode` | Checking exact source for a function, type, or constant |
142: | `repomix_pack_remote_repository` | Full repo analysis | When comprehensive source review is needed |
143: 
144: ### Constitutional Gate Rule
145: 
146: > **Before any bundled pattern is used in production code, at least ONE live verification source must confirm the pattern is still valid for the installed version.**
147: 
148: This means:
149: - Gotchas (Section "Key Gotchas") are version-sensitive behavioral claims — verify before trusting
150: - Zod reliability matrix is source-verified at v1.14.44 — re-verify if SDK version changes
151: - Hook ordering rules are derived from specific source — validate against live code
152: - Tool schema patterns may evolve — check current `tool()` implementation before use
153: 
154: ## Self-Correction
155: 
156: > Reference documents provide orientation context, not terminal truth. When facts conflict with reality, this section guides resolution through live verification.
157: 
158: ### When Information May Be Outdated
159: 1. **Check staleness:** Read `metadata.json` `ingest_date` field. If > 7 days, bundled data is HIGH severity staleness — treat as orientation only.
160: 2. **Run version drift detection** (see above). Compare bundled version against installed `@opencode-ai/plugin` and `@opencode-ai/sdk` versions.
161: 3. **Mandatory live verification:** Use MCP tools (`context7_query_docs`, `deepwiki_ask_question`, or `github_get_file_contents` on `anomalyco/opencode`) to verify the specific claim against the installed version.
162: 4. **Run `scripts/update.sh`** to re-download source when a version mismatch is confirmed.
163: 5. **Key gotchas are version-sensitive:** The `context.ask()` returning Effect (not Promise) and `tool()` being an identity function are behavioral claims — MUST be verified via live source.
164: 
165: ### When Unsure About API Accuracy
166: 1. **Live verification first:** Use `context7_resolve_library_id` with query `"@opencode-ai/plugin"` or `"@opencode-ai/sdk"`, then `context7_query_docs` for the specific API.
167: 2. **Fall back to bundled source** for orientation: `references/expert/tool-internals.md` for tool behavior, `references/expert/hook-composition.md` for hook ordering.
168: 3. **Cross-reference with GitHub:** Use `github_get_file_contents` on `anomalyco/opencode` at the matching version tag.
169: 4. **The Zod reliability matrix is source-verified at v1.14.44 only.** If `z.transform()` behavior changes in a newer SDK, the matrix MUST be re-verified via live source.
170: 
171: ### When the User Contradicts Reference Content
172: 1. **Acknowledge the version gap:** "Bundled references are at v1.14.44 (ingested `ingest_date`). Your installed version may differ."
173: 2. **Verify via live source immediately:** Use MCP tools to check the current behavior at the user's version.
174: 3. **User's runtime wins:** If live verification confirms the user's observation, update the finding and note the version where behavior changed.
175: 4. **Do not override with stale data:** Bundled references never override live-verified behavior.
176: 
177: ### When an Edge Case Is Encountered
178: 1. **Document the gap:** Missing coverage includes hook composition with 3+ plugins, ToolContext timeout behavior, SSE event ordering guarantees, session state machine edge cases (retry→idle transition), and permission inheritance across nested delegations.
179: 2. **Search bundled references first** — expert docs (`references/expert/`) cover deep internals for orientation.
180: 3. **Verify via live source:** Use `deepwiki_ask_question` on `anomalyco/opencode` or `github_get_file_contents` to check current behavior.
181: 4. **Check GitHub issues:** `anomalyco/opencode` repo for known SDK bugs.
182: 5. **Escalate to skill maintainer:** File an update request with SDK version, hook/tool chain, observed behavior, and live verification results.

(End of file - total 182 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-non-interactive-shell/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-project-audit/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-project-audit/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l3-opencode-project-audit
3: description: Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, mapping ecosystem structure, or auditing setup. NOT for code review or direct implementation.
4: metadata:
5:   layer: "3"
6:   role: "auditor"
7:   pattern: P3
8:   version: "3.0.0"
9: allowed-tools:
10:   - Read
11:   - Write
12:   - Bash
13:   - Glob
14:   - Grep
15:   - Task
16: ---
17: 
18: ## Overview
19: 
20: Comprehensive audit of OpenCode project configuration across skills, agents, commands, tools, and permissions. Use when onboarding to a new project, after structural changes, or when verifying ecosystem integrity. Produces a fact-based audit report covering boundaries, governance, and configuration health.
21: 
22: ## The Iron Law
23: 
24: ```
25: AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES. NEVER DOES THE WORK ITSELF.
26: ```
27: 
28: <files_to_read>
29: .opencode/skills/harness-audit/references/pointers.md
30: .opencode/skills/harness-audit/scripts/compile-bundle.sh
31: .opencode/skills/harness-audit/scripts/validate-skill.sh
32: </files_to_read>
33: 
34: # harness-audit
35: 
36: Comprehensive audit orchestrator for ANY OpenCode project. Reports facts, leaves judgment to the agent.
37: ## Architecture
38: 
39: ```
40: harness-audit/
41: ├── SKILL.md                    # Thin orchestrator (this file) — no YAML agent config
42: ├── assets/
43: │   └── profiles/               # 7 subagent profile templates
44: │       ├── phase-1-skills.md
45: │       ├── phase-2-commands.md
46: │       ├── phase-3-tools.md
47: │       ├── phase-4-permissions.md
48: │       ├── phase-5-agents.md
49: │       ├── phase-6-subagents.md
50: │       └── phase-7-synthesis.md
51: ├── references/                 # Skill pointers for execution_context
52: │   └── pointers.md
53: └── scripts/
54:     ├── compile-bundle.sh
55:     └── validate-skill.sh
56: ```
57: 
58: ## On Load
59: 
60: 1. Run `bash scripts/compile-bundle.sh` — compiles all 7 subagent profiles
61: 2. Run `bash scripts/validate-skill.sh` — validates structure before dispatch
62: 3. Read project context: `opencode.json`, `AGENTS.md`
63: 4. Apply the official OpenCode scope matrix before deciding what exists or is missing: agents in `.opencode/agents` or `opencode.json.agent`, commands in `.opencode/commands` or `opencode.json.command`, config overrides from `OPENCODE_CONFIG`/`OPENCODE_CONFIG_DIR`, and rules precedence from `AGENTS.md`/`CLAUDE.md` plus configured instructions.
64: 
65: ## Execution Flow
66: 
67: ### Phase 0: Bootstrap (FIRST RUN ONLY)
68: If `assets/profiles/` is empty, inform user:
69: > "Subagent bundle compiled. Please restart session and re-run audit."
70: 
71: ### Phases 1-6: Parallel Dispatch (run simultaneously)
72: 
73: | Phase | Target | Profile | Execution Context |
74: |-------|--------|---------|-------------------|
75: | 1 | Skills | `assets/profiles/phase-1-skills.md` | `use-authoring-skills` |
76: | 2 | Commands | `assets/profiles/phase-2-commands.md` | `command-dev` |
77: | 3 | Tools | `assets/profiles/phase-3-tools.md` | `custom-tools-dev` |
78: | 4 | Permissions | `assets/profiles/phase-4-permissions.md` | `opencode-platform-reference` |
79: | 5 | Agents | `assets/profiles/phase-5-agents.md` | `agents-and-subagents-dev` |
80: | 6 | Subagents | `assets/profiles/phase-6-subagents.md` | `agents-and-subagents-dev` |
81: | 7 | Verification | spec-verifier agent | Independent validation pass |
82: 
83: Dispatch each via Task tool with `run_in_background: true`.
84: 
85: ### Phase 7: Sequential Synthesis (after 1-6 complete)
86: 
87: | Profile | Focus |
88: |---------|-------|
89: | `assets/profiles/phase-7-synthesis.md` | Aggregate all findings, write audit-report-YYYY-MM-DD.md |
90: 
91: ## Subagent Profile Envelope
92: 
93: Each profile contains:
94: 
95: ```
96: role: <specialist-auditor>
97: core_principle: <audit focus>
98: verification_dimensions:
99:   - <dimension-name>: <what to verify>
100: templates:
101:   - name: <template-name>
102:     description: <what-to-check>
103:     command: <bash-command-if-applicable>
104: forbidden_files:
105:   - <paths-to-avoid>
106: critical_rules:
107:   - <rule-1>
108:   - <rule-2>
109: structured_returns:
110:   findings: <json-schema>
111:   evidence: <file-references>
112:   risk_level: <none|low|medium|high|critical>
113: success_criteria:
114:   - <criterion-1>
115:   - <criterion-2>
116: ```
117: 
118: ## Dispatch Protocol
119: 
120: ```
121: delegate-task (run_in_background: true)
122:   └── spawns: 6 parallel subagents (Phases 1-6)
123:       └── each MAY spawn multiple children for deep investigation
124:   └── after all complete → Phase 7 (sequential)
125: ```
126: 
127: - NO YAML agent configuration files
128: - All routing controlled via this SKILL.md
129: - One subagent can spawn multiple children
130: - Parallel: 4-6 simultaneous subagents maximum
131: 
132: ## Inputs
133: 
134: | Input | Description | Required |
135: |-------|-------------|----------|
136: | `target_repo` | Path to OpenCode project | Yes (defaults to cwd) |
137: | `scope` | full | No |
138: 
139: ## RICH Gate Source Decisions
140: 
141: | Source | Decision | Local adaptation |
142: |--------|----------|------------------|
143: | OpenCode official agents docs | ADOPT | Audit checks primary/subagent mode, tool permissions, markdown/JSON definition surfaces. |
144: | OpenCode official commands docs | ADOPT | Audit includes command frontmatter/config, `$ARGUMENTS`, positional args, shell output, file references, and `subtask`. |
145: | OpenCode official config/rules docs | ADOPT | Audit reports config precedence, `OPENCODE_CONFIG_DIR`, managed config, AGENTS/CLAUDE precedence, and configured instruction files. |
146: | GitHub agent skill resource model | ADAPT | Bundled profiles/scripts are retained as professional resources; audit outputs remain fact reports. |
147: 
148: ## Independence Notes
149: 
150: This skill audits arbitrary OpenCode projects. It must not require HiveMind/GSD/BMAD paths. If a target project lacks `.opencode/`, inspect official global/config override locations before reporting absence.
151: 
152: ## Outputs
153: 
154: `audit-report-YYYY-MM-DD.md` with:
155: - Per-phase findings (structured JSON)
156: - Cross-phase risk assessment
157: - Remediation recommendations
158: - Evidence file references
159: 
160: ## Anti-Patterns
161: 
162: | Anti-Pattern | Detection | Correction |
163: |-------------|-----------|------------|
164: | **The Fixer** | Skill calls write/edit | STOP. Report only. |
165: | **The Hoarder** | No Task tool calls | Dispatch subagents. |
166: | **The Blocker** | Blocking on warnings | Report facts. |
167: | **The Executor** | Editing instead of delegating | Delegate. |
168: 
169: ## Severity Levels
170: 
171: | Level | Meaning | Action |
172: |-------|---------|--------|
173: | CRITICAL | Broken functionality | Must fix |
174: | WARNING | May cause failures | Should fix |
175: | INFO | Improvement opportunity | Fix when convenient |
176: 
177: ## Self-Correction
178: 
179: ### When the Task Keeps Failing
180: 
181: [Detection] If subagent bundles fail to compile (scripts/compile-bundle.sh exits non-zero), check whether the `assets/profiles/` directory is populated — on first run, profiles may need to be generated before compilation. If subagents return empty or malformed findings, verify that the dispatch envelope included the correct execution context skill reference and that the target repository path is accessible. If Phase 7 (synthesis) cannot aggregate findings because earlier phases returned errors, re-dispatch only the failed phases rather than restarting the entire audit.
182: 
183: [Recovery] Check profile directory population first. Re-dispatch only failed phases. Verify execution context skill names match actual available skills.
184: 
185: ### When Unsure About the Next Step
186: 
187: [Detection] If you cannot determine whether to run a full audit (all 7 phases) or a targeted audit, check the user's request — if they asked about a specific surface (e.g., "check my skills"), run only that phase. If the request is broad ("audit my project"), run all phases. If the project has no `.opencode/` directory, check global and config override locations before reporting absence — OpenCode can be configured entirely through global config.
188: 
189: [Recovery] Match audit scope to user request. Check override locations before reporting absence. For partial audits, note which phases were skipped in the report.
190: 
191: ### When the User Contradicts Skill Guidance
192: 
193: [Detection] If the user asks you to fix issues found during the audit, remind them of the Iron Law — the audit reports facts, it does not fix. Offer to route the findings to the appropriate fix workflow (e.g., code review, refactor, debug) but do not apply fixes within the audit session. If the user disagrees with a severity classification (e.g., thinks a WARNING should be INFO), accept their reclassification but document both the original and user-adjusted severity in the audit report.
194: 
195: [Recovery] Route fixes to appropriate workflows. Document severity reclassifications with both values. Never apply fixes within audit.
196: 
197: ### When an Edge Case Is Encountered
198: 
199: [Detection] If the target project has a mixed configuration (some primitives in `.opencode/`, some in global config, some in environment variables), the audit must report the actual configuration source for each primitive, not assume `.opencode/` as the default. If a subagent profile references an execution context skill that doesn't exist in the current environment, load the closest available equivalent and note the substitution. If the audit discovers circular dependencies between skills/agents/commands, report the cycle explicitly in the synthesis phase rather than letting subagents handle it independently.
200: 
201: [Recovery] Report actual configuration sources per primitive. Substitute unavailable execution context skills with closest equivalents. Escalate circular dependencies to synthesis phase.
202: 
203: ## Self-Correction (continued)
204: 
205: ### When the Audit Report Grows Unmanageably Large
206: 
207: [Detection] If the synthesis phase produces a report exceeding reasonable length, prioritize CRITICAL and WARNING findings in the summary. Move INFO-level findings to an appendix. If evidence file references are broken (files moved or deleted during audit), mark them as unverifiable rather than removing them.
208: 
209: [Recovery] Prioritize findings by severity. Move INFO to appendix. Mark broken evidence references as unverifiable.

(End of file - total 209 lines)
</content>
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_EMWnATe65T7kdRgyBGNy6028"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_T7vZtisSLlTofENGi38H9779"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_t7wjwR8gc4ITEfjEqoyf2639"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_03_yFoNutDfQcNFaNMUHjJ43524"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_if363rlenPqQqHm9at4Y5650"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_MZH1RUPyDJpnw608guY94450"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8zO48owI4YNmio5j4fwg0977"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_n0oN4JvE4ikIXtr7Woiz7367"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_k3Pid61ivUVSb7kkn4sl8439"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_i2UYLKWqLHuM9uUf90yF9465"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ggocAXdJzAayFUFWJ4315091"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_hsPY5OFuVfxa9raEacWw2891"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_dM5tz6FoYRxlgufeBIkW3358"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_C2uroLwjPrcxI9ci2q9A7948"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_A4A3eCrrA7IYZTe3AzLQ8332"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_XvYpnPOhLrW5DdPPZQyc6474"
}
```


---
sessionID: ses_1e7dededeffe4vNNqKk0QKMqIP
created: 2026-05-11T17:41:24.934Z
updated: 2026-05-11T17:41:24.934Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

<objective>
Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
</execution_context>

<flags>
- **--fast**: Lightweight scan mode — spawns one mapper agent instead of four. Accepts an optional `--focus` value: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default). Faster and lower-context than the full map.
- **--query**: Codebase intelligence query mode. Sub-commands: `query <term>`, `status`, `diff`, `refresh`. Requires intel to be enabled in config (`intel.enabled: true`). Runs inline for query/status/diff; spawns an agent for refresh.
- **(no flag)**: Full parallel map — spawns 4 mapper agents to produce all 7 codebase documents.
</flags>

<context>
Arguments: 

Parse the first token of :
- If it is `--fast`: strip the flag, run the scan workflow (passing remaining args including optional --focus).
- If it is `--query`: strip the flag, run the intel workflow (passing remaining args as the subcommand).
- Otherwise: pass all of  as focus area to the map-codebase workflow.

**Load project state if exists:**
Check for .planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before /gsd-new-project (brownfield codebases) - creates codebase map first
- After /gsd-new-project (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization (understand existing code first)
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase
- Before major refactoring (understand current state)
- When STATE.md references outdated codebase info

**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>

<process>
1. Check if .planning/codebase/ already exists (offer to refresh or skip)
2. Create .planning/codebase/ directory structure
3. Spawn 4 parallel gsd-codebase-mapper agents:
   - Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
   - Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
   - Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
   - Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: /gsd-new-project or /gsd-plan-phase)
</process>

<success_criteria>
- [ ] .planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .planning/codebase/
3: 
4: Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.
5: 
6: Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
7: </purpose>
8: 
9: <available_agent_types>
10: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
11: - gsd-codebase-mapper — Maps project structure and dependencies
12: </available_agent_types>
13: 
14: <philosophy>
15: **Why dedicated mapper agents:**
16: - Fresh context per domain (no token contamination)
17: - Agents write documents directly (no context transfer back to orchestrator)
18: - Orchestrator only summarizes what was created (minimal context usage)
19: - Faster execution (agents run simultaneously)
20: 
21: **Document quality over length:**
22: Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.
23: 
24: **Always include file paths:**
25: Documents are reference material for the agent when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.
26: </philosophy>
27: 
28: <process>
29: 
30: <step name="parse_paths_flag" priority="first">
31: Parse an optional `--paths <p1,p2,...>` argument. When supplied (by the
32: post-execute codebase-drift gate in `/gsd-execute-phase` or by a user running
33: `/gsd-map-codebase --paths apps/accounting,packages/ui`), the workflow
34: operates in **incremental-remap mode**:
35: 
36: - Pass `--paths <p1>,<p2>,...` through to each spawned `gsd-codebase-mapper`
37:   agent's prompt. Agents scope their Glob/Grep/Bash exploration to the listed
38:   repo-relative prefixes only — no whole-repo scan.
39: - Reject path values that contain `..`, start with `/`, or include shell
40:   metacharacters (`;`, `` ` ``, `$`, `&`, `|`, `<`, `>`). If all provided
41:   paths are invalid, fall back to a normal whole-repo run.
42: - On write, each mapper stamps `last_mapped_commit: <HEAD sha>` into the YAML
43:   frontmatter of every document it produces (see `bin/lib/drift.cjs:writeMappedCommit`).
44: 
45: **Explicit contract — propagate `--paths` through a single normalized
46: variable.** Downstream steps (`spawn_agents`, `sequential_mapping`, and any
47: Agent-mode prompt construction) MUST use `${PATH_SCOPE_HINT}` to ensure every
48: mapper receives the same deterministic scope. Without this contract
49: incremental-remap can silently regress to a whole-repo scan.
50: 
51: ```bash
52: # Validated, comma-separated paths (empty if --paths absent or all rejected):
53: SCOPED_PATHS="<validated paths or empty>"
54: if [ -n "$SCOPED_PATHS" ]; then
55:   PATH_SCOPE_HINT="--paths $SCOPED_PATHS"
56: else
57:   PATH_SCOPE_HINT=""
58: fi
59: ```
60: 
61: All mapper prompts built later in this workflow MUST include
62: `${PATH_SCOPE_HINT}` (expanded to empty when full-repo mode is in effect).
63: 
64: When `--paths` is absent, behave exactly as before: full-repo scan, all 7
65: documents refreshed.
66: </step>
67: 
68: <step name="init_context" priority="first">
69: Load codebase mapping context:
70: 
71: ```bash
72: INIT=$(gsd-sdk query init.map-codebase)
73: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
74: AGENT_SKILLS_MAPPER=$(gsd-sdk query agent-skills gsd-codebase-mapper)
75: ```
76: 
77: Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`, `subagent_timeout`, `date`.
78: </step>
79: 
80: <step name="check_existing">
81: Check if .planning/codebase/ already exists using `has_maps` from init context.
82: 
83: If `codebase_dir_exists` is true:
84: ```bash
85: ls -la .planning/codebase/
86: ```
87: 
88: **If exists:**
89: 
90: ```
91: .planning/codebase/ already exists with these documents:
92: [List files found]
93: 
94: What's next?
95: 1. Refresh - Delete existing and remap codebase
96: 2. Update - Keep existing, only update specific documents
97: 3. Skip - Use existing codebase map as-is
98: ```
99: 
100: Wait for user response.
101: 
102: If "Refresh": Delete .planning/codebase/, continue to create_structure
103: If "Update": Ask which documents to update, continue to spawn_agents (filtered)
104: If "Skip": Exit workflow
105: 
106: **If doesn't exist:**
107: Continue to create_structure.
108: </step>
109: 
110: <step name="create_structure">
111: Create .planning/codebase/ directory:
112: 
113: ```bash
114: mkdir -p .planning/codebase
115: ```
116: 
117: **Expected output files:**
118: - STACK.md (from tech mapper)
119: - INTEGRATIONS.md (from tech mapper)
120: - ARCHITECTURE.md (from arch mapper)
121: - STRUCTURE.md (from arch mapper)
122: - CONVENTIONS.md (from quality mapper)
123: - TESTING.md (from quality mapper)
124: - CONCERNS.md (from concerns mapper)
125: 
126: Continue to spawn_agents.
127: </step>
128: 
129: <step name="detect_runtime_capabilities">
130: Before spawning agents, detect whether the current runtime supports the `Agent` tool for subagent delegation.
131: 
132: **How to detect:** Check if you have access to an `Agent` tool (may be capitalized as `Agent` or lowercase as `agent` depending on runtime). If you do NOT have an `Agent`/`agent` tool (or only have tools like `browser_subagent` which is for web browsing, NOT code analysis):
133: 
134: → **Skip `spawn_agents` and `collect_confirmations`** — go directly to `sequential_mapping` instead.
135: 
136: **CRITICAL:** Never use `browser_subagent` or `Explore` as a substitute for `Agent`. The `browser_subagent` tool is exclusively for web page interaction and will fail for codebase analysis. If `Agent` is unavailable, perform the mapping sequentially in-context.
137: </step>
138: 
139: <step name="spawn_agents" condition="Agent tool is available">
140: Spawn 4 parallel gsd-codebase-mapper agents.
141: 
142: Use Agent tool with `subagent_type="gsd-codebase-mapper"`, `model="{mapper_model}"`, and `run_in_background=true` for parallel execution.
143: 
144: **CRITICAL:** Use the dedicated `gsd-codebase-mapper` agent, NOT `Explore` or `browser_subagent`. The mapper agent writes documents directly.
145: 
146: **Agent 1: Tech Focus**
147: 
148: ```text
149: Agent(
150:   subagent_type="gsd-codebase-mapper",
151:   model="{mapper_model}",
152:   run_in_background=true,
153:   description="Map codebase tech stack",
154:   prompt="Focus: tech
155: Today's date: {date}
156: 
157: Analyze this codebase for technology stack and external integrations.
158: 
159: Write these documents to .planning/codebase/:
160: - STACK.md - Languages, runtime, frameworks, dependencies, configuration
161: - INTEGRATIONS.md - External APIs, databases, auth providers, webhooks
162: 
163: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
164: 
165: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
166: 
167: Explore thoroughly. Write documents directly using templates. Return confirmation only.
168: ${AGENT_SKILLS_MAPPER}"
169: )
170: ```
171: 
172: **Agent 2: Architecture Focus**
173: 
174: ```text
175: Agent(
176:   subagent_type="gsd-codebase-mapper",
177:   model="{mapper_model}",
178:   run_in_background=true,
179:   description="Map codebase architecture",
180:   prompt="Focus: arch
181: Today's date: {date}
182: 
183: Analyze this codebase architecture and directory structure.
184: 
185: Write these documents to .planning/codebase/:
186: - ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
187: - STRUCTURE.md - Directory layout, key locations, naming conventions
188: 
189: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
190: 
191: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
192: 
193: Explore thoroughly. Write documents directly using templates. Return confirmation only.
194: ${AGENT_SKILLS_MAPPER}"
195: )
196: ```
197: 
198: **Agent 3: Quality Focus**
199: 
200: ```text
201: Agent(
202:   subagent_type="gsd-codebase-mapper",
203:   model="{mapper_model}",
204:   run_in_background=true,
205:   description="Map codebase conventions",
206:   prompt="Focus: quality
207: Today's date: {date}
208: 
209: Analyze this codebase for coding conventions and testing patterns.
210: 
211: Write these documents to .planning/codebase/:
212: - CONVENTIONS.md - Code style, naming, patterns, error handling
213: - TESTING.md - Framework, structure, mocking, coverage
214: 
215: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
216: 
217: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
218: 
219: Explore thoroughly. Write documents directly using templates. Return confirmation only.
220: ${AGENT_SKILLS_MAPPER}"
221: )
222: ```
223: 
224: **Agent 4: Concerns Focus**
225: 
226: ```
227: Agent(
228:   subagent_type="gsd-codebase-mapper",
229:   model="{mapper_model}",
230:   run_in_background=true,
231:   description="Map codebase concerns",
232:   prompt="Focus: concerns
233: Today's date: {date}
234: 
235: Analyze this codebase for technical debt, known issues, and areas of concern.
236: 
237: Write this document to .planning/codebase/:
238: - CONCERNS.md - Tech debt, bugs, security, performance, fragile areas
239: 
240: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
241: 
242: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
243: 
244: Explore thoroughly. Write document directly using template. Return confirmation only.
245: ${AGENT_SKILLS_MAPPER}"
246: )
247: ```
248: 
249: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all 4 Agent() calls above with `run_in_background=true`, do NOT read any source files, analyze the codebase, or write any mapping documents independently while the subagents are active. Wait for all 4 agents to complete before proceeding to collect_confirmations. This prevents duplicate work and wasted context.
250: 
251: Continue to collect_confirmations.
252: </step>
253: 
254: <step name="collect_confirmations">
255: Wait for all 4 agents to complete using TaskOutput tool.
256: 
257: **For each agent task_id returned by the Agent tool calls above:**
258: ```
259: TaskOutput tool:
260:   task_id: "{task_id from Agent result}"
261:   block: true
262:   timeout: {subagent_timeout from init context, default 300000}
263: ```
264: 
265: > The timeout is configurable via `workflow.subagent_timeout` in `.planning/config.json` (milliseconds). Default: 300000 (5 minutes). Increase for large codebases or slower models.
266: 
267: Call TaskOutput for all 4 agents in parallel (single message with 4 TaskOutput calls).
268: 
269: Once all TaskOutput calls return, read each agent's output file to collect confirmations.
270: 
271: **Expected confirmation format from each agent:**
272: ```
273: ## Mapping Complete
274: 
275: **Focus:** {focus}
276: **Documents written:**
277: - `.planning/codebase/{DOC1}.md` ({N} lines)
278: - `.planning/codebase/{DOC2}.md` ({N} lines)
279: 
280: Ready for orchestrator summary.
281: ```
282: 
283: **What you receive:** Just file paths and line counts. NOT document contents.
284: 
285: If any agent failed, note the failure and continue with successful documents.
286: 
287: Continue to verify_output.
288: </step>
289: 
290: <step name="sequential_mapping" condition="Agent tool is NOT available (e.g. Antigravity, Gemini CLI, Codex)">
291: When the `Agent` tool is unavailable, perform codebase mapping sequentially in the current context. This replaces `spawn_agents` and `collect_confirmations`.
292: 
293: **IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool. Use only file system tools (Read, Bash, Write, Grep, Glob, list_dir, view_file, grep_search, or equivalent tools available in your runtime).
294: 
295: **IMPORTANT:** Use `{date}` from init context for all `[YYYY-MM-DD]` date placeholders in documents. NEVER guess the date.
296: 
297: **SCOPE:** When `${PATH_SCOPE_HINT}` is non-empty (i.e. `--paths` was supplied), restrict every pass below to the validated path prefixes in `${SCOPED_PATHS}`. Do NOT scan files outside those prefixes. When `${PATH_SCOPE_HINT}` is empty, perform a full-repo scan.
298: 
299: Perform all 4 mapping passes sequentially:
300: 
301: **Pass 1: Tech Focus**
302: - Explore package.json/Cargo.toml/go.mod/requirements.txt, config files, dependency trees
303: - Write `.planning/codebase/STACK.md` — Languages, runtime, frameworks, dependencies, configuration
304: - Write `.planning/codebase/INTEGRATIONS.md` — External APIs, databases, auth providers, webhooks
305: 
306: **Pass 2: Architecture Focus**
307: - Explore directory structure, entry points, module boundaries, data flow
308: - Write `.planning/codebase/ARCHITECTURE.md` — Pattern, layers, data flow, abstractions, entry points
309: - Write `.planning/codebase/STRUCTURE.md` — Directory layout, key locations, naming conventions
310: 
311: **Pass 3: Quality Focus**
312: - Explore code style, error handling patterns, test files, CI config
313: - Write `.planning/codebase/CONVENTIONS.md` — Code style, naming, patterns, error handling
314: - Write `.planning/codebase/TESTING.md` — Framework, structure, mocking, coverage
315: 
316: **Pass 4: Concerns Focus**
317: - Explore TODOs, known issues, fragile areas, security patterns
318: - Write `.planning/codebase/CONCERNS.md` — Tech debt, bugs, security, performance, fragile areas
319: 
320: Use the same document templates as the `gsd-codebase-mapper` agent. Include actual file paths formatted with backticks.
321: 
322: Continue to verify_output.
323: </step>
324: 
325: <step name="verify_output">
326: Verify all documents created successfully:
327: 
328: ```bash
329: ls -la .planning/codebase/
330: wc -l .planning/codebase/*.md
331: ```
332: 
333: **Verification checklist:**
334: - All 7 documents exist
335: - No empty documents (each should have >20 lines)
336: 
337: If any documents missing or empty, note which agents may have failed.
338: 
339: Continue to scan_for_secrets.
340: </step>
341: 
342: <step name="scan_for_secrets">
343: **CRITICAL SECURITY CHECK:** Scan output files for accidentally leaked secrets before committing.
344: 
345: Run secret pattern detection:
346: 
347: ```bash
348: # Check for common API key patterns in generated docs
349: grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
350: ```
351: 
352: **If SECRETS_FOUND=true:**
353: 
354: ```
355: ⚠️  SECURITY ALERT: Potential secrets detected in codebase documents!
356: 
357: Found patterns that look like API keys or tokens in:
358: [show grep output]
359: 
360: This would expose credentials if committed.
361: 
362: **Action required:**
363: 1. Review the flagged content above
364: 2. If these are real secrets, they must be removed before committing
365: 3. Consider adding sensitive files to Claude Code "Deny" permissions
366: 
367: Pausing before commit. Reply "safe to proceed" if the flagged content is not actually sensitive, or edit the files first.
368: ```
369: 
370: Wait for user confirmation before continuing to commit_codebase_map.
371: 
372: **If SECRETS_FOUND=false:**
373: 
374: Continue to commit_codebase_map.
375: </step>
376: 
377: <step name="commit_codebase_map">
378: Commit the codebase map:
379: 
380: ```bash
381: gsd-sdk query commit "docs: map existing codebase" --files .planning/codebase/*.md
382: ```
383: 
384: Continue to offer_next.
385: </step>
386: 
387: <step name="offer_next">
388: Present completion summary and next steps.
389: 
390: **Get line counts:**
391: ```bash
392: wc -l .planning/codebase/*.md
393: ```
394: 
395: **Output format:**
396: 
397: ```
398: Codebase mapping complete.
399: 
400: Created .planning/codebase/:
401: - STACK.md ([N] lines) - Technologies and dependencies
402: - ARCHITECTURE.md ([N] lines) - System design and patterns
403: - STRUCTURE.md ([N] lines) - Directory layout and organization
404: - CONVENTIONS.md ([N] lines) - Code style and patterns
405: - TESTING.md ([N] lines) - Test structure and practices
406: - INTEGRATIONS.md ([N] lines) - External services and APIs
407: - CONCERNS.md ([N] lines) - Technical debt and issues
408: 
409: 
410: ---
411: 
412: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
413: 
414: **Initialize project** — use codebase context for planning
415: 
416: `/clear` then:
417: 
418: `/gsd-new-project`
419: 
420: ---
421: 
422: **Also available:**
423: - Re-run mapping: `/gsd-map-codebase`
424: - Review specific file: `cat .planning/codebase/STACK.md`
425: - Edit any document before proceeding
426: 
427: ---
428: ```
429: 
430: End workflow.
431: </step>
432: 
433: </process>
434: 
435: <success_criteria>
436: - .planning/codebase/ directory created
437: - If Agent tool available: 4 parallel gsd-codebase-mapper agents spawned with run_in_background=true
438: - If Agent tool NOT available: 4 sequential mapping passes performed inline (never using browser_subagent)
439: - All 7 codebase documents exist
440: - No empty documents (each should have >20 lines)
441: - Clear completion summary with line counts
442: - User offered clear next steps in GSD style
443: </success_criteria>

(End of file - total 443 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Canonical runtime skill location is `.opencode/skills/`; meta-builder source may be reflected from `.hivefiver-meta-builder/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .opencode/:** Agent, skill, and command counts verified. Lineage conventions (hm-*/hf-*/gate-*/stack-*) unchanged. No stale references found — primitives-only sector boundary preserved.  
**Next work affecting .opencode/:** MCM-03 (config integration) and MCM-04 (end-user customization) may modify primitive configurations.

</system-reminder>

## USER (turn 2)

<objective>
Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
</execution_context>

<flags>
- **--fast**: Lightweight scan mode — spawns one mapper agent instead of four. Accepts an optional `--focus` value: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default). Faster and lower-context than the full map.
- **--query**: Codebase intelligence query mode. Sub-commands: `query <term>`, `status`, `diff`, `refresh`. Requires intel to be enabled in config (`intel.enabled: true`). Runs inline for query/status/diff; spawns an agent for refresh.
- **(no flag)**: Full parallel map — spawns 4 mapper agents to produce all 7 codebase documents.
</flags>

<context>
Arguments: 

Parse the first token of :
- If it is `--fast`: strip the flag, run the scan workflow (passing remaining args including optional --focus).
- If it is `--query`: strip the flag, run the intel workflow (passing remaining args as the subcommand).
- Otherwise: pass all of  as focus area to the map-codebase workflow.

**Load project state if exists:**
Check for .planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before /gsd-new-project (brownfield codebases) - creates codebase map first
- After /gsd-new-project (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization (understand existing code first)
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase
- Before major refactoring (understand current state)
- When STATE.md references outdated codebase info

**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>

<process>
1. Check if .planning/codebase/ already exists (offer to refresh or skip)
2. Create .planning/codebase/ directory structure
3. Spawn 4 parallel gsd-codebase-mapper agents:
   - Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
   - Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
   - Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
   - Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: /gsd-new-project or /gsd-plan-phase)
</process>

<success_criteria>
- [ ] .planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .planning/codebase/
3: 
4: Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.
5: 
6: Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
7: </purpose>
8: 
9: <available_agent_types>
10: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
11: - gsd-codebase-mapper — Maps project structure and dependencies
12: </available_agent_types>
13: 
14: <philosophy>
15: **Why dedicated mapper agents:**
16: - Fresh context per domain (no token contamination)
17: - Agents write documents directly (no context transfer back to orchestrator)
18: - Orchestrator only summarizes what was created (minimal context usage)
19: - Faster execution (agents run simultaneously)
20: 
21: **Document quality over length:**
22: Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.
23: 
24: **Always include file paths:**
25: Documents are reference material for the agent when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.
26: </philosophy>
27: 
28: <process>
29: 
30: <step name="parse_paths_flag" priority="first">
31: Parse an optional `--paths <p1,p2,...>` argument. When supplied (by the
32: post-execute codebase-drift gate in `/gsd-execute-phase` or by a user running
33: `/gsd-map-codebase --paths apps/accounting,packages/ui`), the workflow
34: operates in **incremental-remap mode**:
35: 
36: - Pass `--paths <p1>,<p2>,...` through to each spawned `gsd-codebase-mapper`
37:   agent's prompt. Agents scope their Glob/Grep/Bash exploration to the listed
38:   repo-relative prefixes only — no whole-repo scan.
39: - Reject path values that contain `..`, start with `/`, or include shell
40:   metacharacters (`;`, `` ` ``, `$`, `&`, `|`, `<`, `>`). If all provided
41:   paths are invalid, fall back to a normal whole-repo run.
42: - On write, each mapper stamps `last_mapped_commit: <HEAD sha>` into the YAML
43:   frontmatter of every document it produces (see `bin/lib/drift.cjs:writeMappedCommit`).
44: 
45: **Explicit contract — propagate `--paths` through a single normalized
46: variable.** Downstream steps (`spawn_agents`, `sequential_mapping`, and any
47: Agent-mode prompt construction) MUST use `${PATH_SCOPE_HINT}` to ensure every
48: mapper receives the same deterministic scope. Without this contract
49: incremental-remap can silently regress to a whole-repo scan.
50: 
51: ```bash
52: # Validated, comma-separated paths (empty if --paths absent or all rejected):
53: SCOPED_PATHS="<validated paths or empty>"
54: if [ -n "$SCOPED_PATHS" ]; then
55:   PATH_SCOPE_HINT="--paths $SCOPED_PATHS"
56: else
57:   PATH_SCOPE_HINT=""
58: fi
59: ```
60: 
61: All mapper prompts built later in this workflow MUST include
62: `${PATH_SCOPE_HINT}` (expanded to empty when full-repo mode is in effect).
63: 
64: When `--paths` is absent, behave exactly as before: full-repo scan, all 7
65: documents refreshed.
66: </step>
67: 
68: <step name="init_context" priority="first">
69: Load codebase mapping context:
70: 
71: ```bash
72: INIT=$(gsd-sdk query init.map-codebase)
73: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
74: AGENT_SKILLS_MAPPER=$(gsd-sdk query agent-skills gsd-codebase-mapper)
75: ```
76: 
77: Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`, `subagent_timeout`, `date`.
78: </step>
79: 
80: <step name="check_existing">
81: Check if .planning/codebase/ already exists using `has_maps` from init context.
82: 
83: If `codebase_dir_exists` is true:
84: ```bash
85: ls -la .planning/codebase/
86: ```
87: 
88: **If exists:**
89: 
90: ```
91: .planning/codebase/ already exists with these documents:
92: [List files found]
93: 
94: What's next?
95: 1. Refresh - Delete existing and remap codebase
96: 2. Update - Keep existing, only update specific documents
97: 3. Skip - Use existing codebase map as-is
98: ```
99: 
100: Wait for user response.
101: 
102: If "Refresh": Delete .planning/codebase/, continue to create_structure
103: If "Update": Ask which documents to update, continue to spawn_agents (filtered)
104: If "Skip": Exit workflow
105: 
106: **If doesn't exist:**
107: Continue to create_structure.
108: </step>
109: 
110: <step name="create_structure">
111: Create .planning/codebase/ directory:
112: 
113: ```bash
114: mkdir -p .planning/codebase
115: ```
116: 
117: **Expected output files:**
118: - STACK.md (from tech mapper)
119: - INTEGRATIONS.md (from tech mapper)
120: - ARCHITECTURE.md (from arch mapper)
121: - STRUCTURE.md (from arch mapper)
122: - CONVENTIONS.md (from quality mapper)
123: - TESTING.md (from quality mapper)
124: - CONCERNS.md (from concerns mapper)
125: 
126: Continue to spawn_agents.
127: </step>
128: 
129: <step name="detect_runtime_capabilities">
130: Before spawning agents, detect whether the current runtime supports the `Agent` tool for subagent delegation.
131: 
132: **How to detect:** Check if you have access to an `Agent` tool (may be capitalized as `Agent` or lowercase as `agent` depending on runtime). If you do NOT have an `Agent`/`agent` tool (or only have tools like `browser_subagent` which is for web browsing, NOT code analysis):
133: 
134: → **Skip `spawn_agents` and `collect_confirmations`** — go directly to `sequential_mapping` instead.
135: 
136: **CRITICAL:** Never use `browser_subagent` or `Explore` as a substitute for `Agent`. The `browser_subagent` tool is exclusively for web page interaction and will fail for codebase analysis. If `Agent` is unavailable, perform the mapping sequentially in-context.
137: </step>
138: 
139: <step name="spawn_agents" condition="Agent tool is available">
140: Spawn 4 parallel gsd-codebase-mapper agents.
141: 
142: Use Agent tool with `subagent_type="gsd-codebase-mapper"`, `model="{mapper_model}"`, and `run_in_background=true` for parallel execution.
143: 
144: **CRITICAL:** Use the dedicated `gsd-codebase-mapper` agent, NOT `Explore` or `browser_subagent`. The mapper agent writes documents directly.
145: 
146: **Agent 1: Tech Focus**
147: 
148: ```text
149: Agent(
150:   subagent_type="gsd-codebase-mapper",
151:   model="{mapper_model}",
152:   run_in_background=true,
153:   description="Map codebase tech stack",
154:   prompt="Focus: tech
155: Today's date: {date}
156: 
157: Analyze this codebase for technology stack and external integrations.
158: 
159: Write these documents to .planning/codebase/:
160: - STACK.md - Languages, runtime, frameworks, dependencies, configuration
161: - INTEGRATIONS.md - External APIs, databases, auth providers, webhooks
162: 
163: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
164: 
165: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
166: 
167: Explore thoroughly. Write documents directly using templates. Return confirmation only.
168: ${AGENT_SKILLS_MAPPER}"
169: )
170: ```
171: 
172: **Agent 2: Architecture Focus**
173: 
174: ```text
175: Agent(
176:   subagent_type="gsd-codebase-mapper",
177:   model="{mapper_model}",
178:   run_in_background=true,
179:   description="Map codebase architecture",
180:   prompt="Focus: arch
181: Today's date: {date}
182: 
183: Analyze this codebase architecture and directory structure.
184: 
185: Write these documents to .planning/codebase/:
186: - ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
187: - STRUCTURE.md - Directory layout, key locations, naming conventions
188: 
189: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
190: 
191: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
192: 
193: Explore thoroughly. Write documents directly using templates. Return confirmation only.
194: ${AGENT_SKILLS_MAPPER}"
195: )
196: ```
197: 
198: **Agent 3: Quality Focus**
199: 
200: ```text
201: Agent(
202:   subagent_type="gsd-codebase-mapper",
203:   model="{mapper_model}",
204:   run_in_background=true,
205:   description="Map codebase conventions",
206:   prompt="Focus: quality
207: Today's date: {date}
208: 
209: Analyze this codebase for coding conventions and testing patterns.
210: 
211: Write these documents to .planning/codebase/:
212: - CONVENTIONS.md - Code style, naming, patterns, error handling
213: - TESTING.md - Framework, structure, mocking, coverage
214: 
215: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
216: 
217: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
218: 
219: Explore thoroughly. Write documents directly using templates. Return confirmation only.
220: ${AGENT_SKILLS_MAPPER}"
221: )
222: ```
223: 
224: **Agent 4: Concerns Focus**
225: 
226: ```
227: Agent(
228:   subagent_type="gsd-codebase-mapper",
229:   model="{mapper_model}",
230:   run_in_background=true,
231:   description="Map codebase concerns",
232:   prompt="Focus: concerns
233: Today's date: {date}
234: 
235: Analyze this codebase for technical debt, known issues, and areas of concern.
236: 
237: Write this document to .planning/codebase/:
238: - CONCERNS.md - Tech debt, bugs, security, performance, fragile areas
239: 
240: IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.
241: 
242: Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.
243: 
244: Explore thoroughly. Write document directly using template. Return confirmation only.
245: ${AGENT_SKILLS_MAPPER}"
246: )
247: ```
248: 
249: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all 4 Agent() calls above with `run_in_background=true`, do NOT read any source files, analyze the codebase, or write any mapping documents independently while the subagents are active. Wait for all 4 agents to complete before proceeding to collect_confirmations. This prevents duplicate work and wasted context.
250: 
251: Continue to collect_confirmations.
252: </step>
253: 
254: <step name="collect_confirmations">
255: Wait for all 4 agents to complete using TaskOutput tool.
256: 
257: **For each agent task_id returned by the Agent tool calls above:**
258: ```
259: TaskOutput tool:
260:   task_id: "{task_id from Agent result}"
261:   block: true
262:   timeout: {subagent_timeout from init context, default 300000}
263: ```
264: 
265: > The timeout is configurable via `workflow.subagent_timeout` in `.planning/config.json` (milliseconds). Default: 300000 (5 minutes). Increase for large codebases or slower models.
266: 
267: Call TaskOutput for all 4 agents in parallel (single message with 4 TaskOutput calls).
268: 
269: Once all TaskOutput calls return, read each agent's output file to collect confirmations.
270: 
271: **Expected confirmation format from each agent:**
272: ```
273: ## Mapping Complete
274: 
275: **Focus:** {focus}
276: **Documents written:**
277: - `.planning/codebase/{DOC1}.md` ({N} lines)
278: - `.planning/codebase/{DOC2}.md` ({N} lines)
279: 
280: Ready for orchestrator summary.
281: ```
282: 
283: **What you receive:** Just file paths and line counts. NOT document contents.
284: 
285: If any agent failed, note the failure and continue with successful documents.
286: 
287: Continue to verify_output.
288: </step>
289: 
290: <step name="sequential_mapping" condition="Agent tool is NOT available (e.g. Antigravity, Gemini CLI, Codex)">
291: When the `Agent` tool is unavailable, perform codebase mapping sequentially in the current context. This replaces `spawn_agents` and `collect_confirmations`.
292: 
293: **IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool. Use only file system tools (Read, Bash, Write, Grep, Glob, list_dir, view_file, grep_search, or equivalent tools available in your runtime).
294: 
295: **IMPORTANT:** Use `{date}` from init context for all `[YYYY-MM-DD]` date placeholders in documents. NEVER guess the date.
296: 
297: **SCOPE:** When `${PATH_SCOPE_HINT}` is non-empty (i.e. `--paths` was supplied), restrict every pass below to the validated path prefixes in `${SCOPED_PATHS}`. Do NOT scan files outside those prefixes. When `${PATH_SCOPE_HINT}` is empty, perform a full-repo scan.
298: 
299: Perform all 4 mapping passes sequentially:
300: 
301: **Pass 1: Tech Focus**
302: - Explore package.json/Cargo.toml/go.mod/requirements.txt, config files, dependency trees
303: - Write `.planning/codebase/STACK.md` — Languages, runtime, frameworks, dependencies, configuration
304: - Write `.planning/codebase/INTEGRATIONS.md` — External APIs, databases, auth providers, webhooks
305: 
306: **Pass 2: Architecture Focus**
307: - Explore directory structure, entry points, module boundaries, data flow
308: - Write `.planning/codebase/ARCHITECTURE.md` — Pattern, layers, data flow, abstractions, entry points
309: - Write `.planning/codebase/STRUCTURE.md` — Directory layout, key locations, naming conventions
310: 
311: **Pass 3: Quality Focus**
312: - Explore code style, error handling patterns, test files, CI config
313: - Write `.planning/codebase/CONVENTIONS.md` — Code style, naming, patterns, error handling
314: - Write `.planning/codebase/TESTING.md` — Framework, structure, mocking, coverage
315: 
316: **Pass 4: Concerns Focus**
317: - Explore TODOs, known issues, fragile areas, security patterns
318: - Write `.planning/codebase/CONCERNS.md` — Tech debt, bugs, security, performance, fragile areas
319: 
320: Use the same document templates as the `gsd-codebase-mapper` agent. Include actual file paths formatted with backticks.
321: 
322: Continue to verify_output.
323: </step>
324: 
325: <step name="verify_output">
326: Verify all documents created successfully:
327: 
328: ```bash
329: ls -la .planning/codebase/
330: wc -l .planning/codebase/*.md
331: ```
332: 
333: **Verification checklist:**
334: - All 7 documents exist
335: - No empty documents (each should have >20 lines)
336: 
337: If any documents missing or empty, note which agents may have failed.
338: 
339: Continue to scan_for_secrets.
340: </step>
341: 
342: <step name="scan_for_secrets">
343: **CRITICAL SECURITY CHECK:** Scan output files for accidentally leaked secrets before committing.
344: 
345: Run secret pattern detection:
346: 
347: ```bash
348: # Check for common API key patterns in generated docs
349: grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
350: ```
351: 
352: **If SECRETS_FOUND=true:**
353: 
354: ```
355: ⚠️  SECURITY ALERT: Potential secrets detected in codebase documents!
356: 
357: Found patterns that look like API keys or tokens in:
358: [show grep output]
359: 
360: This would expose credentials if committed.
361: 
362: **Action required:**
363: 1. Review the flagged content above
364: 2. If these are real secrets, they must be removed before committing
365: 3. Consider adding sensitive files to Claude Code "Deny" permissions
366: 
367: Pausing before commit. Reply "safe to proceed" if the flagged content is not actually sensitive, or edit the files first.
368: ```
369: 
370: Wait for user confirmation before continuing to commit_codebase_map.
371: 
372: **If SECRETS_FOUND=false:**
373: 
374: Continue to commit_codebase_map.
375: </step>
376: 
377: <step name="commit_codebase_map">
378: Commit the codebase map:
379: 
380: ```bash
381: gsd-sdk query commit "docs: map existing codebase" --files .planning/codebase/*.md
382: ```
383: 
384: Continue to offer_next.
385: </step>
386: 
387: <step name="offer_next">
388: Present completion summary and next steps.
389: 
390: **Get line counts:**
391: ```bash
392: wc -l .planning/codebase/*.md
393: ```
394: 
395: **Output format:**
396: 
397: ```
398: Codebase mapping complete.
399: 
400: Created .planning/codebase/:
401: - STACK.md ([N] lines) - Technologies and dependencies
402: - ARCHITECTURE.md ([N] lines) - System design and patterns
403: - STRUCTURE.md ([N] lines) - Directory layout and organization
404: - CONVENTIONS.md ([N] lines) - Code style and patterns
405: - TESTING.md ([N] lines) - Test structure and practices
406: - INTEGRATIONS.md ([N] lines) - External services and APIs
407: - CONCERNS.md ([N] lines) - Technical debt and issues
408: 
409: 
410: ---
411: 
412: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
413: 
414: **Initialize project** — use codebase context for planning
415: 
416: `/clear` then:
417: 
418: `/gsd-new-project`
419: 
420: ---
421: 
422: **Also available:**
423: - Re-run mapping: `/gsd-map-codebase`
424: - Review specific file: `cat .planning/codebase/STACK.md`
425: - Edit any document before proceeding
426: 
427: ---
428: ```
429: 
430: End workflow.
431: </step>
432: 
433: </process>
434: 
435: <success_criteria>
436: - .planning/codebase/ directory created
437: - If Agent tool available: 4 parallel gsd-codebase-mapper agents spawned with run_in_background=true
438: - If Agent tool NOT available: 4 sequential mapping passes performed inline (never using browser_subagent)
439: - All 7 codebase documents exist
440: - No empty documents (each should have >20 lines)
441: - Clear completion summary with line counts
442: - User offered clear next steps in GSD style
443: </success_criteria>

(End of file - total 443 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Canonical runtime skill location is `.opencode/skills/`; meta-builder source may be reflected from `.hivefiver-meta-builder/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .opencode/:** Agent, skill, and command counts verified. Lineage conventions (hm-*/hf-*/gate-*/stack-*) unchanged. No stale references found — primitives-only sector boundary preserved.  
**Next work affecting .opencode/:** MCM-03 (config integration) and MCM-04 (end-user customization) may modify primitive configurations.

</system-reminder>

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_01_89fBsewaKAwodbulhvJw5688"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_DLG5tXsnQQpIt76cCWzE2440"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_vbyrxTIPdI5flLTDndVU0135"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_Y9Mpfg2hjZ5FZ3lAhykn5332"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_kMLrgWRAUepKoiB20DHd0479"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Map codebase tech stack",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1e7dd61dfffe5zWKhWlIOesPr8"
}
```

**Output:** (pruned)
```
task_id: ses_1e7dd61dfffe5zWKhWlIOesPr8
```


### Tool: task

**Input:**
```json
{
  "description": "Map codebase architecture",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1e7dd546effe7Ym8qUpoxGv36e"
}
```

**Output:** (pruned)
```
task_id: ses_1e7dd546effe7Ym8qUpoxGv36e
```


### Tool: task

**Input:**
```json
{
  "description": "Map codebase conventions",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1e7dd4883ffeCukWarRx36syB2"
}
```

**Output:** (pruned)
```
task_id: ses_1e7dd4883ffeCukWarRx36syB2
```


### Tool: task

**Input:**
```json
{
  "description": "Map codebase concerns",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1e7dd3bf7ffeDIYZUm1Lxh6PSl"
}
```

**Output:** (pruned)
```
task_id: ses_1e7dd3bf7ffeDIYZUm1Lxh6PSl
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_PrAy8qFKimfBMlXt120s1466"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_q4hfFkBZ91dnEi81gE8g3153"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_pAGUqSGHOvi9Q37Wr6zB2561"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_jF6E1OHfgY9aCqZgtcuc7268"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_4VGWGfi6aE5B14rRgJOC2917"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_aDsFKHGdAKXed2qP2oha6913"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_cr8IFUajlXdFexqenKA49079"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Xlq4znSa908ReMwpZRTU7444"
}
```


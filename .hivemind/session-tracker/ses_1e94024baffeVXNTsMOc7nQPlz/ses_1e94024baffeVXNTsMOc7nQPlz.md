---
sessionID: ses_1e94024baffeVXNTsMOc7nQPlz
created: 2026-05-11T11:15:32.886Z
updated: 2026-05-11T11:15:32.886Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `11`
- If a documented flag is absent from `11`, treat it as inactive

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase: 11

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `11`:**
- `--wave N` is active only if the literal `--wave` token is present in `11`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `11`
- `--interactive` is active only if the literal `--interactive` token is present in `11`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to subagents.
3: </purpose>
4: 
5: <core_principle>
6: Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
7: </core_principle>
8: 
9: <runtime_compatibility>
10: **Subagent spawning is runtime-specific:**
11: - **Claude Code:** Uses `Agent(subagent_type="gsd-executor", ...)` — blocks until complete, returns result
12: - **Copilot:** Subagent spawning does not reliably return completion signals. **Default to
13:   sequential inline execution**: read and follow execute-plan.md directly for each plan
14:   instead of spawning parallel agents. Only attempt parallel spawning if the user
15:   explicitly requests it — and in that case, rely on the spot-check fallback in step 3
16:   to detect completion.
17: - **Other runtimes:** If `Agent`/`agent` tool is unavailable, use sequential inline execution as the
18:   fallback. Check for tool availability at runtime rather than assuming based on runtime name.
19: 
20: **Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
21: the orchestrator never receives the completion signal, treat it as successful based on spot-checks
22: and continue to the next wave/plan. Never block indefinitely waiting for a signal — always verify
23: via filesystem and git state.
24: </runtime_compatibility>
25: 
26: <required_reading>
27: Read STATE.md before any operation to load project context.
28: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
29: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
31: </required_reading>
32: 
33: <available_agent_types>
34: These are the valid GSD subagent types registered in .claude/agents/ (or equivalent for your runtime).
35: Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:
36: 
37: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
38: - gsd-verifier — Verifies phase completion, checks quality gates
39: - gsd-planner — Creates detailed plans from phase scope
40: - gsd-phase-researcher — Researches technical approaches for a phase
41: - gsd-plan-checker — Reviews plan quality before execution
42: - gsd-debugger — Diagnoses and fixes issues
43: - gsd-codebase-mapper — Maps project structure and dependencies
44: - gsd-integration-checker — Checks cross-phase integration
45: - gsd-nyquist-auditor — Validates verification coverage
46: - gsd-ui-researcher — Researches UI/UX approaches
47: - gsd-ui-checker — Reviews UI implementation quality
48: - gsd-ui-auditor — Audits UI against design requirements
49: </available_agent_types>
50: 
51: <process>
52: 
53: <step name="parse_args" priority="first">
54: Parse `$ARGUMENTS` before loading any context:
55: 
56: - First positional token → `PHASE_ARG`
57: - Optional `--wave N` → `WAVE_FILTER`
58: - Optional `--gaps-only` keeps its current meaning
59: - Optional `--cross-ai` → `CROSS_AI_FORCE=true` (force all plans through cross-AI execution)
60: - Optional `--no-cross-ai` → `CROSS_AI_DISABLED=true` (disable cross-AI for this run, overrides config and frontmatter)
61: 
62: If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
63: </step>
64: 
65: <step name="initialize" priority="first">
66: Load all context in one call:
67: 
68: ```bash
69: INIT=$(gsd-sdk query init.execute-phase "${PHASE_ARG}")
70: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
71: AGENT_SKILLS=$(gsd-sdk query agent-skills gsd-executor)
72: ```
73: 
74: Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
75: 
76: **Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls — do NOT pass `model="inherit"` to Agent. Omitting the `model=` parameter causes Claude Code to inherit the current orchestrator model automatically. Only set `model=` when `executor_model` is an explicit model name (e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-7"`).
77: 
78: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
79: 
80: Read worktree config:
81: 
82: ```bash
83: USE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")
84: ```
85: 
86: If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every plan in a submodule project even when the plan was nowhere near a submodule. Compute submodule paths once and intersect them per-plan with the plan's declared `files_modified` frontmatter.
87: 
88: ```bash
89: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
90: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
91: if [ -f .gitmodules ]; then
92:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
93: else
94:   SUBMODULE_PATHS=""
95: fi
96: ```
97: 
98: `SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different files — only plans whose paths intersect a submodule must drop worktree isolation; plans nowhere near a submodule keep parallel isolation.
99: 
100: When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are project-disabled.
101: 
102: Read context window size for adaptive prompt enrichment:
103: 
104: ```bash
105: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
106: ```
107: 
108: When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
109: - Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
110: - Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
111: - This enables cross-phase awareness and history-aware verification
112: 
113: When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
114: - Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
115: - Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
116: - Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
117: - This reduces executor static overhead by ~40% while preserving behavioral correctness
118: 
119: **If `phase_found` is false:** Error — phase directory not found.
120: **If `plan_count` is 0:** Error — no plans found in phase.
121: **If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.
122: 
123: When `parallelization` is false, plans within a wave execute sequentially.
124: 
125: **Runtime detection for Copilot:**
126: Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
127: or absence of the `Agent()` subagent API. If running under Copilot, force sequential inline
128: execution regardless of the `parallelization` setting — Copilot's subagent completion
129: signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
130: internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
131: inline path for each plan.
132: 
133: **REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference). You MUST execute this bash block before any config reads:
134: ```bash
135: # REQUIRED: prevents stale auto-chain from previous --auto runs
136: if [[ ! "$ARGUMENTS" =~ --auto ]]; then
137:   gsd-sdk query config-set workflow._auto_chain_active false || true
138: fi
139: ```
140: 
141: Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
142: ```bash
143: MVP_FLAG_ARG=""
144: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
145: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
146: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
147: ```
148: 
149: **MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
150: ```bash
151: if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
152:   IS_BEHAVIOR_ADDING=$(gsd-sdk query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)
153:   if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
154:     RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
155:     if [ -z "$RED_COMMIT" ]; then
156:       gsd-sdk query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true
157:       echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
158:       exit 1
159:     fi
160:   fi
161: fi
162: ```
163: Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. See `execute-mvp-tdd.md` for the halt report format.
164: </step>
165: 
166: <step name="check_blocking_antipatterns" priority="first">
167: **MANDATORY — Check for blocking anti-patterns before any other work.**
168: 
169: Look for a `.continue-here.md` in the current phase directory:
170: 
171: ```bash
172: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
173: ```
174: 
175: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
176: 
177: **If one or more `blocking` anti-patterns are found:**
178: 
179: This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:
180: 
181: 1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
182: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
183: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.
184: 
185: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
186: 
187: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
188: </step>
189: 
190: <step name="check_interactive_mode">
191: **Parse `--interactive` flag from $ARGUMENTS.**
192: 
193: **If `--interactive` flag present:** Switch to interactive execution mode.
194: 
195: Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
196: checkpoints between tasks. The user can review, modify, or redirect work at any point.
197: 
198: **Interactive execution flow:**
199: 
200: 1. Load plan inventory as normal (discover_and_group_plans)
201: 2. For each plan (sequentially, ignoring wave grouping):
202: 
203:    a. **Present the plan to the user:**
204:       ```
205:       ## Plan {plan_id}: {plan_name}
206: 
207:       Objective: {from plan file}
208:       Tasks: {task_count}
209: 
210:       Options:
211:       - Execute (proceed with all tasks)
212:       - Review first (show task breakdown before starting)
213:       - Skip (move to next plan)
214:       - Stop (end execution, save progress)
215:       ```
216: 
217:    b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.
218: 
219:    c. **If "Execute":** Read and follow `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md` **inline**
220:       (do NOT spawn a subagent). Execute tasks one at a time.
221: 
222:    d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
223:       their feedback before continuing. Otherwise proceed to next task.
224: 
225:    e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.
226: 
227: 3. After all plans: proceed to verification (same as normal mode).
228: 
229: **Benefits of interactive mode:**
230: - No subagent overhead — dramatically lower token usage
231: - User catches mistakes early — saves costly verification cycles
232: - Maintains GSD's planning/tracking structure
233: - Best for: small phases, bug fixes, verification gaps, learning GSD
234: 
235: **Skip to handle_branching step** (interactive plans execute inline after grouping).
236: </step>
237: 
238: <step name="handle_branching">
239: Check `branching_strategy` from init:
240: 
241: **"none":** Skip, continue on current branch.
242: 
243: **"phase" or "milestone":** Use pre-computed `branch_name` from init.
244: 
245: Fork the new phase branch off `origin/HEAD` (the project's default branch), not the current HEAD — otherwise consecutive phases compound and stay unpushed (#2916). If `$BRANCH_NAME` already exists locally, reuse it as-is.
246: 
247: ```bash
248: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
249: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
250: 
251: if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
252:   git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to existing branch '$BRANCH_NAME'." >&2; exit 1; }
253: else
254:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then  # #2916
255:     git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" \
256:       || { echo "ERROR: fetch origin/$DEFAULT_BRANCH failed and no local copy exists. Refusing to create '$BRANCH_NAME' off current HEAD (#2916)." >&2; exit 1; }
257:     echo "WARNING: fetch origin/$DEFAULT_BRANCH failed; using local copy as base." >&2
258:   fi
259:   if [ -n "$(git status --porcelain)" ]; then
260:     echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
261:   else
262:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
263:   fi
264:   # Pinned base + fail-fast: on success HEAD is exactly at origin/$DEFAULT_BRANCH,
265:   # so a post-creation merge-base or "ahead-of" guard would be unreachable. The
266:   # explicit base argument here is the single source of correctness for #2916.
267:   git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" \
268:     || { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
269: fi
270: ```
271: 
272: All subsequent commits go to this branch. User handles merging.
273: </step>
274: 
275: <step name="validate_phase">
276: From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.
277: 
278: Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
279: 
280: **Update STATE.md for phase start:**
281: ```bash
282: gsd-sdk query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
283: ```
284: This updates Status, Last Activity, Current focus, Current Position, and plan counts in STATE.md so frontmatter and body text reflect the active phase immediately.
285: </step>
286: 
287: <step name="discover_and_group_plans">
288: Load plan inventory with wave grouping in one call:
289: 
290: ```bash
291: PLAN_INDEX=$(gsd-sdk query phase-plan-index "${PHASE_NUMBER}")
292: ```
293: 
294: Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.
295: 
296: **Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If `WAVE_FILTER` is set: also skip plans whose `wave` does not equal `WAVE_FILTER`.
297: 
298: **Wave safety check:** If `WAVE_FILTER` is set and there are still incomplete plans in any lower wave that match the current execution mode, STOP and tell the user to finish earlier waves first. Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete.
299: 
300: If all filtered: "No matching incomplete plans" → exit.
301: 
302: Report:
303: ```
304: ## Execution Plan
305: 
306: **Phase {X}: {Name}** — {total_plans} matching plans across {wave_count} wave(s)
307: 
308: {If WAVE_FILTER is set: `Wave filter active: executing only Wave {WAVE_FILTER}`.}
309: 
310: | Wave | Plans | What it builds |
311: |------|-------|----------------|
312: | 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
313: | 2 | 01-03 | ... |
314: ```
315: </step>
316: 
317: <step name="cross_ai_delegation">
318: **Optional step 2.5 — Delegate plans to an external AI runtime.**
319: 
320: This step runs after plan discovery and before normal wave execution. It identifies plans
321: that should be delegated to an external AI command and executes them via stdin-based prompt
322: delivery. Plans handled here are removed from the execute_waves plan list so the normal
323: executor skips them.
324: 
325: **Activation logic:**
326: 
327: 1. If `CROSS_AI_DISABLED` is true (`--no-cross-ai` flag): skip this step entirely.
328: 2. If `CROSS_AI_FORCE` is true (`--cross-ai` flag): mark ALL incomplete plans for cross-AI execution.
329: 3. Otherwise: check each plan's frontmatter for `cross_ai: true` AND verify config
330:    `workflow.cross_ai_execution` is `true`. Plans matching both conditions are marked for cross-AI.
331: 
332: ```bash
333: CROSS_AI_ENABLED=$(gsd-sdk query config-get workflow.cross_ai_execution 2>/dev/null || echo "false")
334: CROSS_AI_CMD=$(gsd-sdk query config-get workflow.cross_ai_command 2>/dev/null || echo "")
335: CROSS_AI_TIMEOUT=$(gsd-sdk query config-get workflow.cross_ai_timeout 2>/dev/null || echo "300")
336: ```
337: 
338: **If no plans are marked for cross-AI:** Skip to execute_waves.
339: 
340: **If plans are marked but `cross_ai_command` is empty:** Error — tell user to set
341: `workflow.cross_ai_command` via `gsd-sdk query config-set workflow.cross_ai_command "<command>"`.
342: 
343: **For each cross-AI plan (sequentially):**
344: 
345: 1. **Construct the task prompt** from the plan file:
346:    - Extract `<objective>` and `<tasks>` sections from the PLAN.md
347:    - Append PROJECT.md context (project name, description, tech stack)
348:    - Format as a self-contained execution prompt
349: 
350: 2. **Check for dirty working tree before execution:**
351:    ```bash
352:    if ! git diff --quiet HEAD 2>/dev/null; then
353:      echo "WARNING: dirty working tree detected — the external AI command may produce uncommitted changes that conflict with existing modifications"
354:    fi
355:    ```
356: 
357: 3. **Run the external command** from the project root, writing the prompt to stdin.
358:    Never shell-interpolate the prompt — always pipe via stdin to prevent injection:
359:    ```bash
360:    echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
361:    EXIT_CODE=$?
362:    ```
363: 
364: 4. **Evaluate the result:**
365: 
366:    **Success (exit 0 + valid summary):**
367:    - Read `$CANDIDATE_SUMMARY` and validate it contains meaningful content
368:      (not empty, has at least a heading and description — a valid SUMMARY.md structure)
369:    - Write it as the plan's SUMMARY.md file
370:    - Update STATE.md plan status to complete
371:    - Update ROADMAP.md progress
372:    - Mark plan as handled — skip it in execute_waves
373: 
374:    **Failure (non-zero exit or invalid summary):**
375:    - Display the error output and exit code
376:    - Warn: "The external command may have left uncommitted changes or partial edits
377:      in the working tree. Review `git status` and `git diff` before proceeding."
378:    - Offer three choices:
379:      - **retry** — run the same plan through cross-AI again
380:      - **skip** — fall back to normal executor for this plan (re-add to execute_waves list)
381:      - **abort** — stop execution entirely, preserve state for resume
382: 
383: 5. **After all cross-AI plans processed:** Remove successfully handled plans from the
384:    incomplete plan list so execute_waves skips them. Any skipped-to-fallback plans remain
385:    in the list for normal executor processing.
386: </step>
387: 
388: <step name="execute_waves">
389: Execute each selected wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.
390: 
391: **Stream-idle-timeout prevention — checkpoint heartbeats (#2410):**
392: 
393: Multi-plan phases can accumulate enough subagent context that the the agent API
394: SSE layer terminates with `Stream idle timeout - partial response received`
395: between a large tool_result and the next assistant turn (seen on Claude Code
396: + Opus 4.7 at ~200K+ cache_read). To keep the stream warm, emit short
397: assistant-text heartbeats — **no tool call, just a literal line** — at every
398: wave and plan boundary. Each heartbeat MUST start with `[checkpoint]` so
399: tooling and `/gsd-manager`'s background-completion handler can grep partial
400: transcripts. `{P}/{Q}` is the phase-wide completed/total plans counter and
401: increases monotonically across waves. `{status}` is `complete` (success),
402: `failed` (executor error), or `checkpoint` (human-gate returned).
403: 
404: ```
405: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
406: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
407: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} {status} ({P}/{Q} plans done)
408: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
409: ```
410: 
411: **For each wave:**
412: 
413: 1. **Intra-wave files_modified overlap check (BEFORE spawning):**
414: 
415:    Before spawning any agents for this wave, inspect the `files_modified` list of all plans
416:    in the wave. Check every pair of plans in the wave — if any two plans share even one file
417:    in their `files_modified` lists, those plans have an implicit dependency and MUST NOT run
418:    in parallel.
419: 
420:    **Detection algorithm (pseudocode):**
421:    ```
422:    seen_files = {}
423:    overlapping_plans = []
424:    for each plan in wave_plans:
425:      for each file in plan.files_modified:
426:        if file in seen_files:
427:          overlapping_plans.add(plan, seen_files[file])  # both plans overlap on this file
428:        else:
429:          seen_files[file] = plan
430:    ```
431: 
432:    **If overlap is detected:**
433:    - Warn the user:
434:      ```
435:      ⚠ Intra-wave files_modified overlap detected in Wave {N}:
436:        Plan {A} and Plan {B} both modify {file}
437:        Running these plans sequentially to avoid parallel worktree conflicts.
438:      ```
439:    - Override `PARALLELIZATION` to `false` for this wave only — run all plans in the wave
440:      sequentially regardless of the global parallelization setting.
441:    - This is a safety net for plans that were incorrectly assigned to the same wave.
442:      The planner should have caught this; flag it as a planning defect so the user can
443:      replan the phase if desired.
444: 
445:    **If no overlap:** proceed normally (parallel if `PARALLELIZATION=true`).
446: 
447: 2. **Describe what's being built (BEFORE spawning):**
448: 
449:    **First, emit the wave-start checkpoint heartbeat as a literal assistant-text
450:    line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
451:    is required before any further reasoning or spawning:**
452: 
453:    ```
454:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
455:    ```
456: 
457:    Then read each plan's `<objective>`. Extract what's being built and why.
458: 
459:    ```
460:    ---
461:    ## Wave {N}
462: 
463:    **{Plan ID}: {Plan Name}**
464:    {2-3 sentences: what this builds, technical approach, why it matters}
465: 
466:    Spawning {count} agent(s)...
467:    ---
468:    ```
469: 
470:    - Bad: "Executing terrain generation plan"
471:    - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."
472: 
473: 2.5. **Per-plan worktree decision (run for each plan in this wave BEFORE its dispatch):**
474: 
475:    Read and execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. It extracts `PLAN_FILES` from the plan's JSON, intersects against `SUBMODULE_PATHS` (with normalization, bidirectional matching, and glob-prefix handling), and sets `USE_WORKTREES_FOR_PLAN` to `false` when the plan touches a submodule path. Append `plan_id` to a `WAVE_WORKTREE_PLANS` accumulator when `USE_WORKTREES_FOR_PLAN != false`.
476: 
477:    The dispatch branches in step 3 below MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.
478: 
479: 3. **Spawn executor agents:**
480: 
481:    **Emit a plan-start heartbeat (literal line, no tool call) immediately before
482:    each `Agent()` dispatch (#2410):**
483: 
484:    ```
485:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
486:    ```
487: 
488:    Pass paths only — executors read files themselves with their fresh context window.
489:    For 200k models, this keeps orchestrator context lean (~10-15%).
490:    For 1M+ models (Opus 4.6, Sonnet 4.6), richer context can be passed directly.
491: 
492:    **Worktree mode** (`USE_WORKTREES_FOR_PLAN` is not `false` — evaluated per-plan in step 2.5):
493: 
494:    Before spawning, capture the current HEAD:
495:    ```bash
496:    EXPECTED_BASE=$(git rev-parse HEAD)
497:    ```
498: 
499:    **Sequential dispatch for parallel execution (waves with 2+ agents):**
500:    When spawning multiple agents in a wave, dispatch each `Agent()` call **one at a time
501:    with `run_in_background: true`** — do NOT send all Agent calls in a single message.
502:    `git worktree add` acquires an exclusive lock on `.git/config.lock`, so simultaneous
503:    calls race for this lock and fail. Sequential dispatch ensures each worktree finishes
504:    creation before the next begins (the round-trip latency of each tool call provides
505:    natural spacing), while all agents still **run in parallel** once created.
506: 
507:    ```text
508:    # CORRECT: dispatch one Agent() per message, each with run_in_background: true
509:    # → worktrees created sequentially, agents execute in parallel
510:    #
511:    # WRONG: multiple Agent() calls in a single message
512:    # → simultaneous git worktree add → .git/config.lock contention → failures
513:    ```
514: 
515:    ```text
516:    Agent(
517:      subagent_type="gsd-executor",
518:      description="Execute plan {plan_number} of phase {phase_number}",
519:      # Only include model= when executor_model is an explicit model name.
520:      # When executor_model is "inherit", omit this parameter entirely so
521:      # Claude Code inherits the orchestrator model automatically.
522:      model="{executor_model}",  # omit this line when executor_model == "inherit"
523:      isolation="worktree",
524:      prompt="
525:        <objective>
526:        Execute plan {plan_number} of phase {phase_number}-{phase_name}.
527:        Commit each task atomically. Create SUMMARY.md.
528:        Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes after all worktree agents in the wave complete.
529:        </objective>
530: 
531:        <worktree_branch_check>
532:        FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
533:        spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
534:        namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
535:        or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
536:        that destroys concurrent commits in multi-active scenarios (#2924). Only after
537:        Step 1 passes is `git reset --hard` safe (#2015 — affects all platforms).
538:        ```bash
539:        HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
540:        ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
541:        if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
542:          echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
543:          exit 1
544:        fi
545:        if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
546:          echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
547:          exit 1
548:        fi
549:        ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
550:        if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
551:          git reset --hard {EXPECTED_BASE}
552:          [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
553:        fi
554:        ```
555:        Per-commit HEAD/cwd-drift/path-guard: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md` (in <execution_context>).
556:        </worktree_branch_check>
557: 
558:        <parallel_execution>
559:        You are running as a PARALLEL executor agent in a git worktree. Worktree path safety (cwd-drift, absolute-path guards) is in `worktree-path-safety.md` (loaded below).
560:        Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify`
561:        unless the orchestrator surfaces `workflow.worktree_skip_hooks=true` in this
562:        prompt; silent bypass violates project AGENTS.md guidance (#2924).
563: 
564:        IMPORTANT: Do NOT modify STATE.md or ROADMAP.md. execute-plan.md
565:        auto-detects worktree mode (`.git` is a file, not a directory) and skips
566:        shared file updates automatically. The orchestrator updates them centrally
567:        after merge.
568: 
569:        REQUIRED: SUMMARY.md MUST be committed before you return. In worktree mode the
570:        git_commit_metadata step in execute-plan.md commits SUMMARY.md and REQUIREMENTS.md
571:        only (STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer
572:        this commit — the orchestrator force-removes the worktree after you return, and
573:        any uncommitted SUMMARY.md will be permanently lost (#2070).
574:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
575:        </parallel_execution>
576: 
577:        <execution_context>
578:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
579:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
580:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
581:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
582:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
583:        ${CONTEXT_WINDOW < 200000 ? '' : '@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md'}
584:        </execution_context>
585: 
586:        <files_to_read>
587:        Read these files at execution start using the Read tool:
588:        - {phase_dir}/{plan_file} (Plan)
589:        - .planning/PROJECT.md (Project context — core value, requirements, evolution rules)
590:        - .planning/STATE.md (State)
591:        - .planning/config.json (Config, if exists)
592:        ${CONTEXT_WINDOW >= 500000 ? `
593:        - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
594:        - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
595:        - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
596:        ` : ''}
597:        - ./AGENTS.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
598:        - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
599:        </files_to_read>
600: 
601:        ${AGENT_SKILLS}
602: 
603:        <mcp_tools>
604:        If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch, context7,
605:        or other MCP servers), prefer those tools over Grep/Glob for code navigation when available.
606:        MCP tools often save significant tokens by providing structured code indexes.
607:        Check tool availability first — if MCP tools are not accessible, fall back to Grep/Glob.
608:        </mcp_tools>
609: 
610:        <success_criteria>
611:        - [ ] All tasks executed
612:        - [ ] Each task committed individually
613:        - [ ] SUMMARY.md created in plan directory
614:        - [ ] No modifications to shared orchestrator artifacts (the orchestrator handles all post-wave shared-file writes)
615:        </success_criteria>
616:      "
617:    )
618:    ```
619: 
620:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
621: 
622:    **Sequential mode** (`USE_WORKTREES_FOR_PLAN` is `false` — either project-level `USE_WORKTREES=false`, or per-plan submodule intersection forced it false in step 2.5):
623: 
624:    Omit `isolation="worktree"` from the Agent call. Replace the `<parallel_execution>` block with:
625: 
626:    ```
627:        <sequential_execution>
628:        You are running as a SEQUENTIAL executor agent on the main working tree.
629:        Use normal git commits (with hooks). Do NOT use --no-verify.
630:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
631:        </sequential_execution>
632:    ```
633: 
634:    The sequential mode Agent prompt uses the same structure as worktree mode but with these differences in success_criteria — since there is only one agent writing at a time, there are no shared-file conflicts:
635: 
636:    ```
637:        <success_criteria>
638:        - [ ] All tasks executed
639:        - [ ] Each task committed individually
640:        - [ ] SUMMARY.md created in plan directory
641:        - [ ] STATE.md updated with position and decisions
642:        - [ ] ROADMAP.md updated with plan progress (via `roadmap update-plan-progress`)
643:        </success_criteria>
644:    ```
645: 
646:    When worktrees are disabled for a plan (per-plan or project-level), that plan's executor runs on the main working tree. If **any** plan in the current wave dropped to sequential mode, execute the affected plan(s) **one at a time** to avoid concurrent writes to the main working tree — plans in the same wave that retained worktree isolation can still run in parallel alongside the sequential ones, but two non-worktree plans in the same wave must serialize. When the project-level `USE_WORKTREES=false`, all plans in the wave serialize regardless of the `PARALLELIZATION` setting.
647: 
648: 4. **Wait for all agents in wave to complete.**
649: 
650:    **Plan-complete heartbeat (#2410):** as each executor returns (or is verified
651:    via spot-check below), emit one line — `complete` advances `{P}`, `failed`
652:    and `checkpoint` do not but still warm the stream:
653: 
654:    ```
655:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
656:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
657:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
658:    ```
659: 
660:    **Completion signal fallback (Copilot and runtimes where Agent() may not return):**
661: 
662:    If a spawned agent does not return a completion signal but appears to have finished
663:    its work, do NOT block indefinitely. Instead, verify completion via spot-checks:
664: 
665:    ```bash
666:    # For each plan in this wave, check if the executor finished:
667:    SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
668:    COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
669:    ```
670: 
671:    **If SUMMARY.md exists AND commits are found:** The agent completed successfully —
672:    treat as done and proceed to step 5. Log: `"✓ {Plan ID} completed (verified via spot-check — completion signal not received)"`
673: 
674:    **If SUMMARY.md does NOT exist after a reasonable wait:** The agent may still be
675:    running or may have failed silently. Check `git log --oneline -5` for recent
676:    activity. If commits are still appearing, wait longer. If no activity, report
677:    the plan as failed and route to the failure handler in step 6.
678: 
679:    **This fallback applies automatically to all runtimes.** Claude Code's Agent() normally
680:    returns synchronously, but the fallback ensures resilience if it doesn't.
681: 
682: 5. **Post-wave hook validation (parallel mode only):** Hooks run on every executor commit by default (#2924); this post-wave run only fires when `workflow.worktree_skip_hooks=true` opted out of per-commit hooks:
683:    ```bash
684:    SKIP_HOOKS=$(gsd-sdk query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
685:    if [ "$SKIP_HOOKS" = "true" ]; then
686:      # Stash uncommitted changes under a named ref so we always pop (bare `git stash` strands them on hook/script failure).
687:      STASHED=false
688:      if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
689:      git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review before continuing"
690:      [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop gsd-post-wave-hook stash — recover manually")
691:    fi
692:    ```
693:    If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"
694: 
695: 5.5. **Worktree cleanup (when `isolation="worktree"` was used):**
696: 
697:    **Standard wave contract:** Each wave's worktrees merge to main via the templated path below before the next wave's worktrees fork. The cleanup loop runs once per wave at the end of the wave lifecycle. Worktrees created in wave N must be fully removed before wave N+1 forks new ones.
698: 
699:    **Cross-wave dependency deviation (supported execution mode):** When the orchestrator legitimately deviates from the standard wave model — for example, a phase with cross-wave plan dependencies that requires custom inter-worktree base-update merges (e.g., `merge: bring 09-01 + 09-02 into 09-03 base`) — the cleanup loop below is NOT automatically re-entered for those custom merges. The deviation path produces correct final history but bypasses this loop, leaving `worktree-agent-*` directories in place. Use the **cleanup-tail snippet** below to remove any residual worktrees after such a deviation.
700: 
701:    When executor agents ran in worktree isolation, their commits land on temporary branches in separate working trees. After the wave completes, merge these changes back and clean up:
702: 
703:    ```bash
704:    # List worktrees created by this wave's agents.
705:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
706:    # `.claude/worktrees/agent-` (the namespace Claude Code's `isolation="worktree"`
707:    # uses). The previous exclusion filter (`grep -v "$(pwd)$"`) destroyed the parent
708:    # workspace's `.git` whenever the workspace itself was a worktree (multi-workspace
709:    # setups, and the cross-drive Windows case where `git worktree list` reports the
710:    # registry path on a different drive than `$(pwd)`).
711:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
712:    while IFS= read -r WT; do
713:      [ -z "$WT" ] && continue
714:      # Get the branch name for this worktree
715:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
716:      if [ -n "$WT_BRANCH" ] && [ "$WT_BRANCH" != "HEAD" ]; then
717:        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
718: 
719:        # --- Orchestrator file protection (#1756) ---
720:        # Snapshot orchestrator-owned files BEFORE merge. If the worktree
721:        # branch outlived a milestone transition, its versions of STATE.md
722:        # and ROADMAP.md are stale. Main always wins for these files.
723:        STATE_BACKUP=$(mktemp)
724:        ROADMAP_BACKUP=$(mktemp)
725:        [ -f .planning/STATE.md ] && cp .planning/STATE.md "$STATE_BACKUP" || true
726:        [ -f .planning/ROADMAP.md ] && cp .planning/ROADMAP.md "$ROADMAP_BACKUP" || true
727: 
728:        # Snapshot list of files on main BEFORE merge to detect resurrections
729:        PRE_MERGE_FILES=$(git ls-files .planning/)
730: 
731:        # Pre-merge deletion check: warn if the worktree branch deletes tracked files
732:        DELETIONS=$(git diff --diff-filter=D --name-only HEAD..."$WT_BRANCH" 2>/dev/null || true)
733:        if [ -n "$DELETIONS" ]; then
734:          echo "BLOCKED: Worktree branch $WT_BRANCH contains file deletions: $DELETIONS"
735:          echo "Review these deletions before merging. If intentional, remove this guard and re-run."
736:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
737:          continue
738:        fi
739: 
740:        # Merge the worktree branch into the current branch (--no-ff ensures a merge commit so HEAD~1 is reliable)
741:        git merge "$WT_BRANCH" --no-ff --no-edit -m "chore: merge executor worktree ($WT_BRANCH)" 2>&1 || {
742:          echo "⚠ Merge conflict from worktree $WT_BRANCH — resolve manually"
743:          echo "  STATE.md backup:   $STATE_BACKUP"
744:          echo "  ROADMAP.md backup: $ROADMAP_BACKUP"
745:          echo "  Restore with: cp \$STATE_BACKUP .planning/STATE.md && cp \$ROADMAP_BACKUP .planning/ROADMAP.md"
746:          break
747:        }
748: 
749:        # Post-merge deletion audit: detect bulk file deletions in merge commit (#2384)
750:        # --diff-filter=D HEAD~1 HEAD shows files deleted by the merge commit itself.
751:        # Exclude .planning/ — orchestrator-owned deletions there are expected (resurrections
752:        # are handled below). Require ALLOW_BULK_DELETE=1 to bypass for intentional large refactors.
753:        MERGE_DEL_COUNT=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -vc '^\.planning/' || true)
754:        if [ "$MERGE_DEL_COUNT" -gt 5 ] && [ "${ALLOW_BULK_DELETE:-0}" != "1" ]; then
755:          MERGE_DELETIONS=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -v '^\.planning/' || true)
756:          echo "⚠ BLOCKED: Merge of $WT_BRANCH deleted $MERGE_DEL_COUNT files outside .planning/ — reverting to protect repository integrity (#2384)"
757:          echo "$MERGE_DELETIONS"
758:          echo "  If these deletions are intentional, re-run with ALLOW_BULK_DELETE=1"
759:          git reset --hard HEAD~1 2>/dev/null || true
760:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
761:          continue
762:        fi
763: 
764:        # Restore orchestrator-owned files (main always wins)
765:        if [ -s "$STATE_BACKUP" ]; then
766:          cp "$STATE_BACKUP" .planning/STATE.md
767:        fi
768:        if [ -s "$ROADMAP_BACKUP" ]; then
769:          cp "$ROADMAP_BACKUP" .planning/ROADMAP.md
770:        fi
771:        rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
772: 
773:        # Detect files deleted on main but re-added by worktree merge
774:        # (e.g., archived phase directories that were intentionally removed)
775:        # A "resurrected" file must have a deletion event in main's ancestry —
776:        # brand-new files (e.g. SUMMARY.md just created by the executor) have no
777:        # such history and must NOT be removed (#2501).
778:        DELETED_FILES=$(git diff --diff-filter=A --name-only HEAD~1 -- .planning/ 2>/dev/null || true)
779:        for RESURRECTED in $DELETED_FILES; do
780:          # Only delete if this file was previously tracked on main and then
781:          # deliberately removed (has a deletion event in git history).
782:          WAS_DELETED=$(git log --follow --diff-filter=D --name-only --format="" HEAD~1 -- "$RESURRECTED" 2>/dev/null | grep -c . || true)
783:          if [ "${WAS_DELETED:-0}" -gt 0 ]; then
784:            git rm -f "$RESURRECTED" 2>/dev/null || true
785:          fi
786:        done
787: 
788:        # Amend merge commit with restored files if any changed
789:        if ! git diff --quiet .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || \
790:           [ -n "$DELETED_FILES" ]; then
791:          # Only amend the commit with .planning/ files if commit_docs is enabled (#1783)
792:          COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
793:          if [ "$COMMIT_DOCS" != "false" ]; then
794:            git add .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || true
795:            git commit --amend --no-edit 2>/dev/null || true
796:          fi
797:        fi
798: 
799:        # Safety net: rescue uncommitted SUMMARY.md before worktree removal (#2070, #2838).
800:        # Filesystem-level (find + cp) bypasses git's --exclude-standard filter, which silently
801:        # drops .planning/SUMMARY.md when projects gitignore .planning/ — the rescue's prior
802:        # `git ls-files --exclude-standard` form returned empty in that case and the SUMMARY
803:        # was lost on `git worktree remove --force`.
804:        while IFS= read -r SUMMARY; do
805:          [ -z "$SUMMARY" ] && continue
806:          REL_PATH="${SUMMARY#$WT/}"
807:          if [ ! -f "$REL_PATH" ] || ! cmp -s "$SUMMARY" "$REL_PATH"; then
808:            mkdir -p "$(dirname "$REL_PATH")"
809:            cp "$SUMMARY" "$REL_PATH"
810:            echo "⚠ Rescued $REL_PATH from worktree before removal"
811:          fi
812:        done < <(find "$WT/.planning" -name "*SUMMARY.md" 2>/dev/null)
813: 
814:        # Remove the worktree
815:        if ! git worktree remove "$WT" --force; then
816:          WT_NAME=$(basename "$WT")
817:          if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
818:            echo "⚠ Worktree $WT is locked — attempting to unlock and retry"
819:            git worktree unlock "$WT" 2>/dev/null || true
820:            if ! git worktree remove "$WT" --force; then
821:              echo "⚠ Residual worktree at $WT — manual cleanup required after session exits:"
822:              echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
823:            fi
824:          else
825:            echo "⚠ Residual worktree at $WT (remove failed) — investigate manually"
826:          fi
827:        fi
828: 
829:        # Delete the temporary branch
830:        git branch -D "$WT_BRANCH" 2>/dev/null || true
831:      fi
832:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
833:    ```
834: 
835:    **Cleanup-tail snippet (use after any wave whose merges did not flow through the templated path above):**
836: 
837:    If the orchestrator deviated from the standard wave merge path (e.g., custom inter-worktree base-update merges with `merge: bring …` style messages), run this snippet after the custom merges are complete. It discovers and removes any residual `worktree-agent-*` worktrees. Safe to run when no residuals exist — it is a no-op in that case.
838: 
839:    ```bash
840:    # Cleanup-tail: remove residual agent worktrees after a cross-wave-dependency deviation.
841:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
842:    # `.claude/worktrees/agent-`. Do NOT use exclusion filters (grep -v "$(pwd)$") —
843:    # they destroy the parent workspace's .git in multi-workspace or cross-drive setups.
844:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
845:    while IFS= read -r WT; do
846:      [ -z "$WT" ] && continue
847:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
848:      [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
849:      echo "Cleaning up residual worktree: $WT (branch: $WT_BRANCH)"
850:      git worktree unlock "$WT" 2>/dev/null || true
851:      if ! git worktree remove "$WT" --force; then
852:        WT_NAME=$(basename "$WT")
853:        if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
854:          echo "⚠ Worktree $WT is locked — unlock failed; manual cleanup required:"
855:          echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
856:        else
857:          echo "⚠ Residual worktree at $WT — remove failed; manual cleanup required"
858:        fi
859:      else
860:        git branch -D "$WT_BRANCH" 2>/dev/null || true
861:      fi
862:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
863:    git worktree prune
864:    ```
865: 
866:    **When to skip step 5.5:**
867: 
868:    **If no plan in this wave used worktree isolation** (project-level `USE_WORKTREES=false` OR every plan in the wave had `USE_WORKTREES_FOR_PLAN=false` — i.e. `WAVE_WORKTREE_PLANS` from step 2.5 is empty): all agents ran on the main working tree — skip this step entirely.
869: 
870:    **If the orchestrator merged via custom messages (cross-wave-dependency deviation):** the templated cleanup loop above was not triggered for those merges. Run the cleanup-tail snippet above instead. After the snippet completes, proceed to step 5.6.
871: 
872:    **If at least one plan used worktrees but others did not:** still run this cleanup — it iterates over actual `git worktree list` output and only merges back the worktrees that were created, leaving sequential plans' commits on the main tree untouched.
873: 
874:    **If no worktrees found at runtime:** Skip silently — agents may have been spawned without worktree isolation, or the orchestrator already cleaned them up.
875: 
876: 5.6. **Post-merge build & test gate:**
877: 
878:    After merging all worktrees in a wave (parallel mode), or after the last plan completes
879:    (serial mode), run a build and then the project's test suite to catch cross-plan
880:    integration issues that individual worktree self-checks cannot detect (e.g., conflicting
881:    type definitions, removed exports, import changes, link errors).
882: 
883:    This addresses the Generator self-evaluation blind spot identified in Anthropic's
884:    harness engineering research: agents reliably report Self-Check: PASSED even when
885:    merging their work creates failures.
886: 
887:    Read and execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`.
888: 
889: 5.7. **Post-wave shared artifact update (when at least one plan used worktrees, skip if tests failed):**
890: 
891:    When **any** executor agent in this wave ran with `isolation="worktree"`, that agent skipped STATE.md and ROADMAP.md updates to avoid last-merge-wins overwrites. The orchestrator is the single writer for these files. After worktrees are merged back, update shared artifacts once for every completed plan in the wave (worktree-mode plans **and** sequential plans that ran on the main tree but deferred to the orchestrator for tracking writes).
892: 
893:    **Only update tracking when tests passed (TEST_EXIT=0).**
894:    If tests failed or timed out, skip the tracking update — plans should
895:    not be marked as complete when integration tests are failing or inconclusive.
896: 
897:    ```bash
898:    # Guard: only update tracking if post-merge tests passed
899:    # Timeout (124) is treated as inconclusive — do NOT mark plans complete
900:    if [ "${TEST_EXIT}" -eq 0 ]; then
901:      # Update ROADMAP plan progress for each completed plan in this wave
902:      for plan_id in {completed_plan_ids}; do
903:        gsd-sdk query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
904:      done
905: 
906:      # Only commit tracking files if they actually changed
907:      if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
908:        gsd-sdk query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
909:      fi
910:    elif [ "${TEST_EXIT}" -eq 124 ]; then

(Output capped at 50 KB. Showing lines 1-910. Use offset=911 to continue.)
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

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_kK8fWQ1NjY3K6gp4JKBt9402"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_FwlLKPlhmNObg9ysHppO1504"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_j5lV45HwbtQfdmVOJs9U7976"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_vWeZdAP2Oi4eJxpoe08l9295"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_04_vxlERk8YLXuwt4KCDpxX0129"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_D1Duo33kzRPbd3bLghMO7858"
}
```


---
sessionID: ses_1e94024baffeVXNTsMOc7nQPlz
created: 2026-05-11T13:17:09.791Z
updated: 2026-05-11T13:17:09.791Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

# Hivemind Power-On — Session Governance

## 7 IRON LAWS

```
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

## ROUTING TABLE

| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
| `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02 §1] |
| Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
| L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
| Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
| Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |

## QUICK REFERENCE — Session-Tracker Cheat Sheet

```
find all sessions:     session-tracker({action:"list-sessions"})
export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
read project index:    read(".hivemind/session-tracker/project-continuity.json")
grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

Full tool API reference: [ref-06 §1]

## REFERENCE MAP

```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
```

## ASSET BUNDLES

| Agent Type | Load | Why |
|------------|------|-----|
| **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
| **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
| **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
| **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
| **Post-compact (any)** | ref-03 + ref-06 | survive + track |
| **Lineage ambiguous** | ref-01 | routing decision tree |

## ESCALATION RULES

```
- 3 consecutive gate failures → escalate to user with full gap report
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
- task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
```

## LIFECYCLE SUMMARY

```
POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
```

## CRITICAL LOADING ORDER

```
hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
```

> **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
> **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.


continue from the above I got disconnected

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_RnuzlzZVs33m9sAw5azB1006"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_fBydZ8rcl9OHRRQxfdNv5408"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_3cDYH7aM6mpYLVratqA02417"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_S7DXtTqQUeDrj9xmiCEV8929"
}
```


---
sessionID: ses_1e94024baffeVXNTsMOc7nQPlz
created: 2026-05-11T13:20:04.480Z
updated: 2026-05-11T13:20:04.480Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

# Hivemind Power-On — Session Governance

## 7 IRON LAWS

```
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

## ROUTING TABLE

| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
| `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02 §1] |
| Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
| L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
| Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
| Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |

## QUICK REFERENCE — Session-Tracker Cheat Sheet

```
find all sessions:     session-tracker({action:"list-sessions"})
export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
read project index:    read(".hivemind/session-tracker/project-continuity.json")
grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

Full tool API reference: [ref-06 §1]

## REFERENCE MAP

```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
```

## ASSET BUNDLES

| Agent Type | Load | Why |
|------------|------|-----|
| **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
| **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
| **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
| **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
| **Post-compact (any)** | ref-03 + ref-06 | survive + track |
| **Lineage ambiguous** | ref-01 | routing decision tree |

## ESCALATION RULES

```
- 3 consecutive gate failures → escalate to user with full gap report
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
- task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
```

## LIFECYCLE SUMMARY

```
POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
```

## CRITICAL LOADING ORDER

```
hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
```

> **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
> **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.


continue from the above I got disconnected

### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_OGE9t1a9peIvYeZnk5p64964"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_RegOGLJE660sbAJPDIqY6343"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_TzyyioQ2Of8lBOA5JFMT9334"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_EqUlqPrjsaFogbdOioz07825"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_uET2Bc8ooDlwCxhIpIGT6544"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ME5LkrpsNDr2L6kWRihW6356"
}
```


## USER (turn 2)

# Hivemind Power-On — Session Governance

## 7 IRON LAWS

```
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

## ROUTING TABLE

| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
| `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02 §1] |
| Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
| L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
| Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
| Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |

## QUICK REFERENCE — Session-Tracker Cheat Sheet

```
find all sessions:     session-tracker({action:"list-sessions"})
export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
read project index:    read(".hivemind/session-tracker/project-continuity.json")
grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

Full tool API reference: [ref-06 §1]

## REFERENCE MAP

```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
```

## ASSET BUNDLES

| Agent Type | Load | Why |
|------------|------|-----|
| **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
| **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
| **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
| **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
| **Post-compact (any)** | ref-03 + ref-06 | survive + track |
| **Lineage ambiguous** | ref-01 | routing decision tree |

## ESCALATION RULES

```
- 3 consecutive gate failures → escalate to user with full gap report
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
- task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
```

## LIFECYCLE SUMMARY

```
POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
```

## CRITICAL LOADING ORDER

```
hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
```

> **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
> **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.

### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_YkbyE7m3DTuCGhSWXbvt7342"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_QmSp2sUAEQxvtjHbcFQx3694"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 11-01 archive infrastructure + truth matrix",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e8cbcfe4ffe7XcTNaAZczyLvj"
}
```

**Output:** (pruned)
```
task_id: ses_1e8cbcfe4ffe7XcTNaAZczyLvj
```


## USER (turn 3)

trace id and resume exactly everything preserved context live written 

### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_0nMtKu18Dv973WrEcLzJ9682"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_uxLlXKKvd5MeojxinSGD1495"
}
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_RbDZ1irlRiOe3OlLtGjs7600"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json</path>
<type>file</type>
<content>
1: [
2:   {
3:     "id": "48da362c-e105-4601-8613-29406ad1d41c",
4:     "parentSessionId": "ses_concurrent",
5:     "childSessionId": "fake-ses-1",
6:     "agent": "builder",
7:     "status": "error",
8:     "createdAt": 1778494122790,
9:     "safetyCeilingMs": 1800000,
10:     "lastMessageCount": 0,
11:     "stablePollCount": 0,
12:     "lastMessageCountChangeAt": 1778494122790,
13:     "nestingDepth": 1,
14:     "executionMode": "sdk",
15:     "workingDirectory": "/Users/apple/hivemind-plugin-private",
16:     "queueKey": "agent:builder",
17:     "surface": "agent-delegation",
18:     "recoveryGuarantee": "resumable",
19:     "explicitCancellation": false,
20:     "completedAt": 1778494122792,
21:     "error": "Failed to send prompt to child session",
22:     "gracePeriodExpiresAt": 1778494722794
23:   },
24:   {
25:     "id": "1b8a7c7e-f6fc-4ed2-b464-6ffc20055546",
26:     "parentSessionId": "ses_concurrent",
27:     "childSessionId": "fake-ses-2",
28:     "agent": "researcher",
29:     "status": "error",
30:     "createdAt": 1778494122796,
31:     "safetyCeilingMs": 1800000,
32:     "lastMessageCount": 0,
33:     "stablePollCount": 0,
34:     "lastMessageCountChangeAt": 1778494122796,
35:     "nestingDepth": 1,
36:     "executionMode": "sdk",
37:     "workingDirectory": "/Users/apple/hivemind-plugin-private",
38:     "queueKey": "agent:researcher",
39:     "surface": "agent-delegation",
40:     "recoveryGuarantee": "resumable",
41:     "explicitCancellation": false,
42:     "completedAt": 1778494122799,
43:     "error": "Failed to send prompt to child session",
44:     "gracePeriodExpiresAt": 1778494722800
45:   }
46: ]

(End of file - total 46 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json</path>
<type>file</type>
<content>
1: {
2:   "version": 1,
3:   "updatedAt": 1778446132343,
4:   "sessions": {
5:     "ses-parent-tool": {
6:       "sessionID": "ses-parent-tool",
7:       "promptParams": {},
8:       "metadata": {
9:         "status": "running",
10:         "description": "Recovered parent session notification queue",
11:         "delegation": null,
12:         "constraints": [],
13:         "pendingNotifications": [
14:           {
15:             "sessionID": "pty:pty-delete-on-terminate",
16:             "description": "Delegation: command-runner",
17:             "agent": "command-runner",
18:             "status": "failed",
19:             "error": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
20:             "resultPreview": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
21:             "briefSummary": "Delegated work finished with terminal state non-resumable-after-restart after 29ms. Summary preview: [Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
22:             "outputLink": "session://pty:pty-delete-on-terminate",
23:             "duration": 29,
24:             "metadata": {
25:               "delegationId": "90632060-2283-4880-8b6c-fec96f7cc923",
26:               "terminalState": "error",
27:               "recoveryGuarantee": "best-effort",
28:               "summaryPreview": "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts"
29:             },
30:             "createdAt": 1778446132342,
31:             "delivered": false
32:           }
33:         ],
34:         "updatedAt": 1778446132342
35:       }
36:     }
37:   },
38:   "governance": {
39:     "rules": [],
40:     "violations": [],
41:     "updatedAt": 1778446132303
42:   }
43: }

(End of file - total 43 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-05-PLAN.md"
}
```


## USER (turn 4)

follow the skill

## USER (turn 5)

# Hivemind Power-On — Session Governance

## 7 IRON LAWS

```
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

## ROUTING TABLE

| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
| `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02 §1] |
| Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
| L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
| Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
| Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |

## QUICK REFERENCE — Session-Tracker Cheat Sheet

```
find all sessions:     session-tracker({action:"list-sessions"})
export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
read project index:    read(".hivemind/session-tracker/project-continuity.json")
grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

Full tool API reference: [ref-06 §1]

## REFERENCE MAP

```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
```

## ASSET BUNDLES

| Agent Type | Load | Why |
|------------|------|-----|
| **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
| **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
| **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
| **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
| **Post-compact (any)** | ref-03 + ref-06 | survive + track |
| **Lineage ambiguous** | ref-01 | routing decision tree |

## ESCALATION RULES

```
- 3 consecutive gate failures → escalate to user with full gap report
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
- task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
```

## LIFECYCLE SUMMARY

```
POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
```

## CRITICAL LOADING ORDER

```
hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
```

> **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
> **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_5b1HIenOP3gZ6KZNkyAI5744"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_wKB6buquV3bOM2qlR43Y7449"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_gmQ7IZE0oCU7U1AWyNNC5461"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_dVquTCQJEfr5QtZZxdp14835"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 11-01: Archive infrastructure + truth matrix",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e8c91c4fffeX2qab4st6W1vXX"
}
```

**Output:** (pruned)
```
task_id: ses_1e8c91c4fffeX2qab4st6W1vXX
```


---
sessionID: ses_1e94024baffeVXNTsMOc7nQPlz
created: 2026-05-11T13:59:22.785Z
updated: 2026-05-11T13:59:22.785Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

use skill to continue the above

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_HyZ8gzHcX44CIOzDmIid4994"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_vFLOYxOpDPJpU9f4Xpwg3551"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_iloN31jCt692urTTlI0J3823"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_t295RjGCyKR9Dc5hPPp26867"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_tkxDqNRclF8FVLEebk5G3143"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-05-PLAN.md"
}
```


---
sessionID: ses_1e94024baffeVXNTsMOc7nQPlz
created: 2026-05-11T14:05:14.154Z
updated: 2026-05-11T14:05:14.154Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

use skill to continue the above

## USER (turn 2)

use skill to continue the above

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


### Tool: skill

**Input:**
```json
{
  "name": "gsd-resume-work"
}
```

**Output:** (pruned)
```
# Skill: gsd-resume-work
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_ORZXmxws0tEwXztri2jd7911"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_SrIz7rE16F6G34FQI6TN8524"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_wDvAULYFEowXvwEpV9F85220"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_R4VtKCDCoxwlVFsp2ID26554"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 11-01: Archive + truth matrix",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e8a2a61cffe3ZeCBCldtLDZXl"
}
```

**Output:** (pruned)
```
task_id: ses_1e8a2a61cffe3ZeCBCldtLDZXl
```


## USER (turn 3)

resume on session id aborted or what do as skills say

### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_5hxBWnK2fRrUEgwJPxcM2278"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_TdpeogD64dFjdmIpMv5S0744"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_jdFW9ghbdpvC0XjCwKOl5773"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_49etljjT5WYI9PBehqbE7112"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_D1I33bcP38C8idxIVN2t1305"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hivemind-power-on/references/02-session-resume-protocol.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_K2M6EvvjxrkSPCVoI0Lx0537"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_BMQrozl7rQ3lJO5mpQ2a4616"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_ODmUidSrAXrn20vECO9w9893"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zYYJeu6fzpaVX2IF35SV0244"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_L5T3m388fbqg53Dz5ok98251"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_elN7AYYHQKGlX0bpXJWU8926"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_eYxENqRvCKxOlObzp4k76121"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_D8pFKpLzOTWhDXvggNnD2303"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_tabAS452yucblOHBX5lq4101"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_idLDhPFnqa2gEtdCMtGF0656"
}
```


### Tool: task

**Input:**
```json
{
  "description": "resume",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e8a2a61cffe3ZeCBCldtLDZXl"
}
```

**Output:** (pruned)
```
task_id: ses_1e8a2a61cffe3ZeCBCldtLDZXl
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 11-05: AGENTS.md sector audit",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e88f011bffe3I6hxHpmPerPLi"
}
```

**Output:** (pruned)
```
task_id: ses_1e88f011bffe3I6hxHpmPerPLi
```


## USER (turn 4)

I was disconnected please resume from the above

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_gpdqzJuciIA7AeG1XRzY8538"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_C1Gd32C5bF3azjwT2gNL5980"
}
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_02_r35GVB0JRUk5LiAKEUaC7745"
}
```


### Tool: task

**Input:**
```json
{
  "description": "resume",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1e88f011bffe3I6hxHpmPerPLi"
}
```

**Output:** (pruned)
```
task_id: ses_1e88f011bffe3I6hxHpmPerPLi
```


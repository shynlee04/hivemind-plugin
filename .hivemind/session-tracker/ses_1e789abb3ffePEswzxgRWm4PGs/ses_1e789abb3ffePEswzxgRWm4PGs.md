---
sessionID: ses_1e789abb3ffePEswzxgRWm4PGs
created: 2026-05-11T19:14:28.591Z
updated: 2026-05-11T19:14:28.591Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)


<objective>
Execute plan 02 of phase 12: cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-.
Commit each task atomically. Create SUMMARY.md. Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes.
</objective>

<sequential_execution>
You are running as a SEQUENTIAL executor agent on the main working tree.
Use normal git commits (with hooks). Do NOT use --no-verify.
REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit.
</sequential_execution>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
</execution_context>

<files_to_read>
Read these files at execution start using the Read tool:
- .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-02-PLAN.md (Plan)
- .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-01-SUMMARY.md (Prior wave summary — what Wave 1 already built)
- .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-REVIEW.md if it exists (Original review findings)
- .planning/PROJECT.md (Project context)
- .planning/STATE.md (State)
- .planning/config.json (Config)
- ./AGENTS.md (Project instructions)
</files_to_read>

<mcp_tools>
If AGENTS.md or project instructions reference MCP tools, prefer those tools over Grep/Glob for code navigation when available.
</mcp_tools>

<success_criteria>
- [ ] All 4 tasks executed
- [ ] Each task committed individually
- [ ] SUMMARY.md created in plan directory at .planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-02-SUMMARY.md
- [ ] STATE.md updated with position and decisions
- [ ] ROADMAP.md updated with plan progress (via gsd-sdk query roadmap.update-plan-progress)
</success_criteria>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute a phase prompt (PLAN.md) and create the outcome summary (SUMMARY.md).
3: </purpose>
4: 
5: <required_reading>
6: Read STATE.md before any operation to load project context.
7: Read config.json for planning behavior settings.
8: 
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/git-integration.md
10: </required_reading>
11: 
12: <available_agent_types>
13: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
14: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
15: </available_agent_types>
16: 
17: <process>
18: 
19: <step name="init_context" priority="first">
20: Load execution context (paths only to minimize orchestrator context):
21: 
22: ```bash
23: INIT=$(gsd-sdk query init.execute-phase "${PHASE}")
24: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
25: ```
26: 
27: Extract from init JSON: `executor_model`, `commit_docs`, `sub_repos`, `phase_dir`, `phase_number`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.
28: 
29: If `.planning/` missing: error.
30: </step>
31: 
32: <step name="identify_plan">
33: ```bash
34: # Use plans/summaries from INIT JSON, or list files
35: (ls .planning/phases/XX-name/*-PLAN.md 2>/dev/null || true) | sort
36: (ls .planning/phases/XX-name/*-SUMMARY.md 2>/dev/null || true) | sort
37: ```
38: 
39: Find first PLAN without matching SUMMARY. Decimal phases supported (`01.1-hotfix/`):
40: 
41: ```bash
42: PHASE=$(echo "$PLAN_PATH" | grep -oE '[0-9]+(\.[0-9]+)?-[0-9]+')
43: # config settings can be fetched via gsd-sdk query config-get if needed
44: ```
45: 
46: <if mode="yolo">
47: Auto-approve: `⚡ Execute {phase}-{plan}-PLAN.md [Plan X of Y for Phase Z]` → parse_segments.
48: </if>
49: 
50: <if mode="interactive" OR="custom with gates.execute_next_plan true">
51: Present plan identification, wait for confirmation.
52: </if>
53: </step>
54: 
55: <step name="record_start_time">
56: ```bash
57: PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
58: PLAN_START_EPOCH=$(date +%s)
59: ```
60: </step>
61: 
62: <step name="parse_segments">
63: ```bash
64: # Count tasks — match <task tag at any indentation level
65: TASK_COUNT=$(grep -cE '^\s*<task[[:space:]>]' .planning/phases/XX-name/{phase}-{plan}-PLAN.md 2>/dev/null || echo "0")
66: INLINE_THRESHOLD=$(gsd-sdk query config-get workflow.inline_plan_threshold 2>/dev/null || echo "2")
67: grep -n "type=\"checkpoint" .planning/phases/XX-name/{phase}-{plan}-PLAN.md
68: ```
69: 
70: **Primary routing: task count threshold (#1979)**
71: 
72: If `INLINE_THRESHOLD > 0` AND `TASK_COUNT <= INLINE_THRESHOLD`: Use Pattern C (inline) regardless of checkpoint type. Small plans execute faster inline — avoids ~14K token subagent spawn overhead and preserves prompt cache. Configure threshold via `workflow.inline_plan_threshold` (default: 2, set to `0` to always spawn subagents).
73: 
74: Otherwise: Apply checkpoint-based routing below.
75: 
76: **Checkpoint-based routing (plans with > threshold tasks):**
77: 
78: | Checkpoints | Pattern | Execution |
79: |-------------|---------|-----------|
80: | None | A (autonomous) | Single subagent: full plan + SUMMARY + commit |
81: | Verify-only | B (segmented) | Segments between checkpoints. After none/human-verify → SUBAGENT. After decision/human-action → MAIN |
82: | Decision | C (main) | Execute entirely in main context |
83: 
84: **Pattern A:** init_agent_tracking → capture `EXPECTED_BASE=$(git rev-parse HEAD)` → spawn Agent(subagent_type="gsd-executor", model=executor_model) with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash → track agent_id → wait → update tracking → report. **Include `isolation="worktree"` only if `workflow.use_worktrees` is not `false`** (read via `config-get workflow.use_worktrees`). **When using `isolation="worktree"`, include a `<worktree_branch_check>` block in the prompt** instructing the executor to: (1) FIRST assert `git symbolic-ref HEAD` resolves to a per-agent branch (NOT a protected ref like `main`/`master`/`develop`/`trunk`/`release/*`) and HALT with a blocker if not — never self-recover via `git update-ref refs/heads/<protected>` (#2924); (2) only after that assertion passes, run `git merge-base HEAD {EXPECTED_BASE}` and, if the result differs from `{EXPECTED_BASE}`, hard-reset the branch with `git reset --hard {EXPECTED_BASE}` before starting work, then verify with `[ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && exit 1`. The HEAD assertion (Step 1) MUST run before any reset/checkout. This corrects a known issue where `EnterWorktree` creates branches from `main` instead of the feature branch HEAD (affects all platforms — #2015) and prevents the destructive HEAD-on-master self-recovery path (#2924).
85: 
86: **Pattern B:** Execute segment-by-segment. Autonomous segments: spawn subagent for assigned tasks only (no SUMMARY/commit). Checkpoints: main context. After all segments: aggregate, create SUMMARY, commit. See segment_execution.
87: 
88: **Pattern C:** Execute in main using standard flow (step name="execute").
89: 
90: Fresh context per subagent preserves peak quality. Main context stays lean.
91: </step>
92: 
93: <step name="init_agent_tracking">
94: ```bash
95: if [ ! -f .planning/agent-history.json ]; then
96:   echo '{"version":"1.0","max_entries":50,"entries":[]}' > .planning/agent-history.json
97: fi
98: rm -f .planning/current-agent-id.txt
99: if [ -f .planning/current-agent-id.txt ]; then
100:   INTERRUPTED_ID=$(cat .planning/current-agent-id.txt)
101:   echo "Found interrupted agent: $INTERRUPTED_ID"
102: fi
103: ```
104: 
105: If interrupted: ask user to resume (Task `resume` parameter) or start fresh.
106: 
107: **Tracking protocol:** On spawn: write agent_id to `current-agent-id.txt`, append to agent-history.json: `{"agent_id":"[id]","task_description":"[desc]","phase":"[phase]","plan":"[plan]","segment":[num|null],"timestamp":"[ISO]","status":"spawned","completion_timestamp":null}`. On completion: status → "completed", set completion_timestamp, delete current-agent-id.txt. Prune: if entries > max_entries, remove oldest "completed" (never "spawned").
108: 
109: Run for Pattern A/B before spawning. Pattern C: skip.
110: </step>
111: 
112: <step name="segment_execution">
113: Pattern B only (verify-only checkpoints). Skip for A/C.
114: 
115: 1. Parse segment map: checkpoint locations and types
116: 2. Per segment:
117:    - Subagent route: spawn gsd-executor for assigned tasks only. Prompt: task range, plan path, read full plan for context, execute assigned tasks, track deviations, NO SUMMARY/commit. Track via agent protocol.
118:    - Main route: execute tasks using standard flow (step name="execute")
119: 3. **Critical ordering — write and commit SUMMARY.md as one atomic block.** Do NOT
120:    emit narrative output between the Write tool call and the commit tool call.
121:    Truncation at this boundary is a known failure mode (see #2070 rescue logic in
122:    execute-phase.md step 5.5).
123: 
124:    After ALL segments: aggregate files/deviations/decisions → create SUMMARY.md → self-check:
125:    - Verify key-files.created exist on disk with `[ -f ]`
126:    - Check `git log --oneline --all --grep="{phase}-{plan}"` returns ≥1 commit
127:    - Re-run ALL `<acceptance_criteria>` from every task — if any fail, fix before finalizing SUMMARY
128:    - Re-run the plan-level `<verification>` commands — log results in SUMMARY
129:    - Append `## Self-Check: PASSED` or `## Self-Check: FAILED` to SUMMARY
130:    Then commit (no narrative between Write and commit).
131: 
132:    **Known Claude Code bug (classifyHandoffIfNeeded):** If any segment agent reports "failed" with `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a real failure. Run spot-checks; if they pass, treat as successful.
133: 
134: 
135: 
136: 
137: </step>
138: 
139: <step name="load_prompt">
140: ```bash
141: cat .planning/phases/XX-name/{phase}-{plan}-PLAN.md
142: ```
143: This IS the execution instructions. Follow exactly. If plan references CONTEXT.md: honor user's vision throughout.
144: 
145: **If plan contains `<interfaces>` block:** These are pre-extracted type definitions and contracts. Use them directly — do NOT re-read the source files to discover types. The planner already extracted what you need.
146: </step>
147: 
148: <step name="previous_phase_check">
149: ```bash
150: gsd-sdk query phases.list --type summaries --raw
151: # Extract the second-to-last summary from the JSON result
152: ```
153: 
154: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
155: If previous SUMMARY has unresolved "Issues Encountered" or "Next Phase Readiness" blockers: question(header="Previous Issues", options: "Proceed anyway" | "Address first" | "Review previous").
156: </step>
157: 
158: <step name="execute">
159: Deviations are normal — handle via rules below.
160: 
161: 1. Read @context files from prompt
162: 2. **MCP tools:** If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch for code navigation), prefer them over Grep/Glob when available. Fall back to Grep/Glob if MCP tools are not accessible.
163: 3. Per task:
164:    - **MANDATORY read_first gate:** If the task has a `<read_first>` field, you MUST read every listed file BEFORE making any edits. This is not optional. Do not skip files because you "already know" what's in them — read them. The read_first files establish ground truth for the task.
165:    - `type="auto"`: if `tdd="true"` → TDD execution. Implement with deviation rules + auth gates. Verify done criteria. Commit (see task_commit). Track hash for Summary.
166:    - `type="checkpoint:*"`: STOP → checkpoint_protocol → wait for user → continue only after confirmation.
167:    - **HARD GATE — acceptance_criteria verification:** After completing each task, if it has `<acceptance_criteria>`, you MUST run a verification loop before proceeding:
168:      1. For each criterion: execute the grep, file check, or CLI command that proves it passes
169:      2. Log each result as PASS or FAIL with the command output
170:      3. If ANY criterion fails: fix the implementation immediately, then re-run ALL criteria
171:      4. Repeat until all criteria pass — you are BLOCKED from starting the next task until this gate clears
172:      5. If a criterion cannot be satisfied after 2 fix attempts, log it as a deviation with reason — do NOT silently skip it
173:      This is not advisory. A task with failing acceptance criteria is an incomplete task.
174: 3. Run `<verification>` checks
175: 4. Confirm `<success_criteria>` met
176: 5. Document deviations in Summary
177: </step>
178: 
179: <authentication_gates>
180: 
181: ## Authentication Gates
182: 
183: Auth errors during execution are NOT failures — they're expected interaction points.
184: 
185: **Indicators:** "Not authenticated", "Unauthorized", 401/403, "Please run {tool} login", "Set {ENV_VAR}"
186: 
187: **Protocol:**
188: 1. Recognize auth gate (not a bug)
189: 2. STOP task execution
190: 3. Create dynamic checkpoint:human-action with exact auth steps
191: 4. Wait for user to authenticate
192: 5. Verify credentials work
193: 6. Retry original task
194: 7. Continue normally
195: 
196: **Example:** `vercel --yes` → "Not authenticated" → checkpoint asking user to `vercel login` → verify with `vercel whoami` → retry deploy → continue
197: 
198: **In Summary:** Document as normal flow under "## Authentication Gates", not as deviations.
199: 
200: </authentication_gates>
201: 
202: <deviation_rules>
203: 
204: ## Deviation Rules
205: 
206: Apply deviation rules from the gsd-executor agent definition (single source of truth):
207: - **Rules 1-3** (bugs, missing critical, blockers): auto-fix, test, verify, track as deviations
208: - **Rule 4** (architectural changes): STOP, present decision to user, await approval
209: - **Scope boundary**: do not auto-fix pre-existing issues unrelated to current task
210: - **Fix attempt limit**: max 3 retries per deviation before escalating
211: - **Priority**: Rule 4 (STOP) > Rules 1-3 (auto) > unsure → Rule 4
212: 
213: </deviation_rules>
214: 
215: <deviation_documentation>
216: 
217: ## Documenting Deviations
218: 
219: Summary MUST include deviations section. None? → `## Deviations from Plan\n\nNone - plan executed exactly as written.`
220: 
221: Per deviation: **[Rule N - Category] Title** — Found during: Task X | Issue | Fix | Files modified | Verification | Commit hash
222: 
223: End with: **Total deviations:** N auto-fixed (breakdown). **Impact:** assessment.
224: 
225: </deviation_documentation>
226: 
227: <tdd_plan_execution>
228: ## TDD Execution
229: 
230: For `type: tdd` plans — RED-GREEN-REFACTOR:
231: 
232: 1. **Infrastructure** (first TDD plan only): detect project, install framework, config, verify empty suite
233: 2. **RED:** Read `<behavior>` → failing test(s) → run (MUST fail) → commit: `test({phase}-{plan}): add failing test for [feature]`
234: 3. **GREEN:** Read `<implementation>` → minimal code → run (MUST pass) → commit: `feat({phase}-{plan}): implement [feature]`
235: 4. **REFACTOR:** Clean up → tests MUST pass → commit: `refactor({phase}-{plan}): clean up [feature]`
236: 
237: Errors: RED doesn't fail → investigate test/existing feature. GREEN doesn't pass → debug, iterate. REFACTOR breaks → undo.
238: 
239: See `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` for structure.
240: </tdd_plan_execution>
241: 
242: <precommit_failure_handling>
243: ## Pre-commit Hook Failure Handling
244: 
245: Your commits may trigger pre-commit hooks. Auto-fix hooks handle themselves transparently — files get fixed and re-staged automatically.
246: 
247: **If running as a parallel executor agent (spawned by execute-phase):**
248: Run commits normally — let pre-commit hooks run. Do NOT use `--no-verify` by default
249: (#2924). Hooks should run so issues surface at the introducing commit, and silent
250: bypass violates project AGENTS.md guidance. If a project explicitly opts out via
251: `workflow.worktree_skip_hooks=true`, the orchestrator will surface that flag in the
252: prompt; absent that signal, hooks run normally. If a hook fails, follow the
253: sequential-mode handling below.
254: 
255: **If running as the sole executor (sequential mode):**
256: If a commit is BLOCKED by a hook:
257: 
258: 1. The `git commit` command fails with hook error output
259: 2. Read the error — it tells you exactly which hook and what failed
260: 3. Fix the issue (type error, lint violation, secret leak, etc.)
261: 4. `git add` the fixed files
262: 5. Retry the commit
263: 6. Budget 1-2 retry cycles per commit
264: </precommit_failure_handling>
265: 
266: <task_commit>
267: ## Task Commit Protocol
268: 
269: Canonical per-task commit rules live in **`agents/gsd-executor.md`** (`<task_commit_protocol>`). Follow that section for staging, `{type}({phase}-{plan})` messages, `commit-to-subrepo` when `sub_repos` is set, post-commit checks, and untracked-file handling — do not duplicate or paraphrase the full protocol here (single source of truth).
270: 
271: **Orchestrator note:** After each task, the spawned executor reports commit hashes; this workflow does not re-specify commit semantics beyond pointing at the executor.
272: 
273: </task_commit>
274: 
275: <step name="checkpoint_protocol">
276: On `type="checkpoint:*"`: automate everything possible first. Checkpoints are for verification/decisions only.
277: 
278: Display: `CHECKPOINT: [Type]` box → Progress {X}/{Y} → Task name → type-specific content → `YOUR ACTION: [signal]`
279: 
280: | Type | Content | Resume signal |
281: |------|---------|---------------|
282: | human-verify (90%) | What was built + verification steps (commands/URLs) | "approved" or describe issues |
283: | decision (9%) | Decision needed + context + options with pros/cons | "Select: option-id" |
284: | human-action (1%) | What was automated + ONE manual step + verification plan | "done" |
285: 
286: After response: verify if specified. Pass → continue. Fail → inform, wait. WAIT for user — do NOT hallucinate completion.
287: 
288: See /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md for details.
289: </step>
290: 
291: <step name="checkpoint_return_for_orchestrator">
292: When spawned via Task and hitting checkpoint: return structured state (cannot interact with user directly).
293: 
294: **Required return:** 1) Completed Tasks table (hashes + files) 2) Current Task (what's blocking) 3) Checkpoint Details (user-facing content) 4) Awaiting (what's needed from user)
295: 
296: Orchestrator parses → presents to user → spawns fresh continuation with your completed tasks state. You will NOT be resumed. In main context: use checkpoint_protocol above.
297: </step>
298: 
299: <step name="verification_failure_gate">
300: If verification fails:
301: 
302: **Check if node repair is enabled** (default: on):
303: ```bash
304: NODE_REPAIR=$(gsd-sdk query config-get workflow.node_repair 2>/dev/null || echo "true")
305: ```
306: 
307: If `NODE_REPAIR` is `true`: invoke `@./.opencode/get-shit-done/workflows/node-repair.md` with:
308: - FAILED_TASK: task number, name, done-criteria
309: - ERROR: expected vs actual result
310: - PLAN_CONTEXT: adjacent task names + phase goal
311: - REPAIR_BUDGET: `workflow.node_repair_budget` from config (default: 2)
312: 
313: Node repair will attempt RETRY, DECOMPOSE, or PRUNE autonomously. Only reaches this gate again if repair budget is exhausted (ESCALATE).
314: 
315: If `NODE_REPAIR` is `false` OR repair returns ESCALATE: STOP. Present: "Verification failed for Task [X]: [name]. Expected: [criteria]. Actual: [result]. Repair attempted: [summary of what was tried]." Options: Retry | Skip (mark incomplete) | Stop (investigate). If skipped → SUMMARY "Issues Encountered".
316: </step>
317: 
318: <step name="record_completion_time">
319: ```bash
320: PLAN_END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
321: PLAN_END_EPOCH=$(date +%s)
322: 
323: DURATION_SEC=$(( PLAN_END_EPOCH - PLAN_START_EPOCH ))
324: DURATION_MIN=$(( DURATION_SEC / 60 ))
325: 
326: if [[ $DURATION_MIN -ge 60 ]]; then
327:   HRS=$(( DURATION_MIN / 60 ))
328:   MIN=$(( DURATION_MIN % 60 ))
329:   DURATION="${HRS}h ${MIN}m"
330: else
331:   DURATION="${DURATION_MIN} min"
332: fi
333: ```
334: </step>
335: 
336: <step name="generate_user_setup">
337: ```bash
338: grep -A 50 "^user_setup:" .planning/phases/XX-name/{phase}-{plan}-PLAN.md | head -50
339: ```
340: 
341: If user_setup exists: create `{phase}-USER-SETUP.md` using template `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/user-setup.md`. Per service: env vars table, account setup checklist, dashboard config, local dev notes, verification commands. Status "Incomplete". Set `USER_SETUP_CREATED=true`. If empty/missing: skip.
342: </step>
343: 
344: <step name="create_summary">
345: **Critical ordering — write and commit SUMMARY.md as one atomic block.** Do NOT
346: emit narrative output between the Write tool call and the commit tool call.
347: Truncation at this boundary is a known failure mode (see #2070 rescue logic in
348: execute-phase.md step 5.5).
349: 
350: Create `{phase}-{plan}-SUMMARY.md` at `.planning/phases/XX-name/`. Use `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md`.
351: 
352: **Frontmatter:** phase, plan, subsystem, tags | requires/provides/affects | tech-stack.added/patterns | key-files.created/modified | key-decisions | requirements-completed (**MUST** copy `requirements` array from PLAN.md frontmatter verbatim) | duration ($DURATION), completed ($PLAN_END_TIME date).
353: 
354: Title: `# Phase [X] Plan [Y]: [Name] Summary`
355: 
356: One-liner SUBSTANTIVE: "JWT auth with refresh rotation using jose library" not "Authentication implemented"
357: 
358: Include: duration, start/end times, task count, file count.
359: 
360: Next: more plans → "Ready for {next-plan}" | last → "Phase complete, ready for next step".
361: </step>
362: 
363: <step name="update_current_position">
364: **Skip this step if running in parallel mode** (the orchestrator in execute-phase.md
365: handles STATE.md/ROADMAP.md updates centrally after merging worktrees to avoid
366: merge conflicts).
367: 
368: Update STATE.md using gsd-sdk query (or legacy gsd-tools) state mutations:
369: 
370: ```bash
371: # Auto-detect parallel mode: .git is a file in worktrees, a directory in main repo
372: IS_WORKTREE=$([ -f .git ] && echo "true" || echo "false")
373: 
374: # Skip in parallel mode — orchestrator handles STATE.md centrally
375: if [ "$IS_WORKTREE" != "true" ]; then
376:   # Advance plan counter (handles last-plan edge case)
377:   gsd-sdk query state.advance-plan
378: 
379:   # Recalculate progress bar from disk state
380:   gsd-sdk query state.update-progress
381: 
382:   # Record execution metrics
383:   gsd-sdk query state.record-metric \
384:     --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
385:     --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"
386: fi
387: ```
388: </step>
389: 
390: <step name="extract_decisions_and_issues">
391: From SUMMARY: Extract decisions and add to STATE.md:
392: 
393: ```bash
394: # Add each decision from SUMMARY key-decisions
395: # Prefer file inputs for shell-safe text (preserves `$`, `*`, etc. exactly)
396: gsd-sdk query state.add-decision \
397:   --phase "${PHASE}" --summary-file "${DECISION_TEXT_FILE}" --rationale-file "${RATIONALE_FILE}"
398: 
399: # Add blockers if any found
400: gsd-sdk query state.add-blocker --text-file "${BLOCKER_TEXT_FILE}"
401: ```
402: </step>
403: 
404: <step name="update_session_continuity">
405: Update session info using gsd-sdk query (or legacy gsd-tools):
406: 
407: ```bash
408: gsd-sdk query state.record-session \
409:   --stopped-at "Completed ${PHASE}-${PLAN}-PLAN.md" \
410:   --resume-file "None"
411: ```
412: 
413: Keep STATE.md under 150 lines.
414: </step>
415: 
416: <step name="issues_review_gate">
417: If SUMMARY "Issues Encountered" ≠ "None": yolo → log and continue. Interactive → present issues, wait for acknowledgment.
418: </step>
419: 
420: <step name="update_roadmap">
421: Run this step only when NOT executing inside a git worktree (i.e.
422: `use_worktrees: false`, the bug #2661 reproducer). In worktree mode each
423: worktree has its own ROADMAP.md, so per-plan writes here would diverge
424: across siblings; the orchestrator owns the post-merge sync centrally
425: (see execute-phase.md §5.7, single-writer contract from #1486 / dcb50396).
426: 
427: ```bash
428: # Auto-detect worktree mode: .git is a file in worktrees, a directory in main repo.
429: # This mirrors the use_worktrees config flag for the executing handler.
430: IS_WORKTREE=$([ -f .git ] && echo "true" || echo "false")
431: 
432: if [ "$IS_WORKTREE" != "true" ]; then
433:   # use_worktrees: false → this handler is the sole post-plan sync point (#2661)
434:   gsd-sdk query roadmap.update-plan-progress "${PHASE}"
435: fi
436: ```
437: Counts PLAN vs SUMMARY files on disk. Updates progress table row with correct count and status (`In Progress` or `Complete` with date).
438: </step>
439: 
440: <step name="update_requirements">
441: Mark completed requirements from the PLAN.md frontmatter `requirements:` field:
442: 
443: ```bash
444: gsd-sdk query requirements.mark-complete ${REQ_IDS}
445: ```
446: 
447: Extract requirement IDs from the plan's frontmatter (e.g., `requirements: [AUTH-01, AUTH-02]`). If no requirements field, skip.
448: </step>
449: 
450: <step name="git_commit_metadata">
451: **Critical ordering — write and commit SUMMARY.md as one atomic block.** Do NOT
452: emit narrative output between the Write tool call and the commit tool call.
453: Truncation at this boundary is a known failure mode (see #2070 rescue logic in
454: execute-phase.md step 5.5).
455: 
456: Task code already committed per-task. Commit plan metadata:
457: 
458: ```bash
459: # Auto-detect parallel mode: .git is a file in worktrees, a directory in main repo
460: IS_WORKTREE=$([ -f .git ] && echo "true" || echo "false")
461: 
462: # In parallel mode: exclude STATE.md and ROADMAP.md (orchestrator commits these)
463: if [ "$IS_WORKTREE" = "true" ]; then
464:   gsd-sdk query commit "docs({phase}-{plan}): complete [plan-name] plan" --files .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md .planning/REQUIREMENTS.md
465: else
466:   gsd-sdk query commit "docs({phase}-{plan}): complete [plan-name] plan" --files .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
467: fi
468: ```
469: </step>
470: 
471: <step name="update_codebase_map">
472: If .planning/codebase/ doesn't exist: skip.
473: 
474: ```bash
475: FIRST_TASK=$(git log --oneline --grep="feat({phase}-{plan}):" --grep="fix({phase}-{plan}):" --grep="test({phase}-{plan}):" --reverse | head -1 | cut -d' ' -f1)
476: git diff --name-only ${FIRST_TASK}^..HEAD 2>/dev/null || true
477: ```
478: 
479: Update only structural changes: new src/ dir → STRUCTURE.md | deps → STACK.md | file pattern → CONVENTIONS.md | API client → INTEGRATIONS.md | config → STACK.md | renamed → update paths. Skip code-only/bugfix/content changes.
480: 
481: ```bash
482: gsd-sdk query commit "" --files .planning/codebase/*.md --amend
483: ```
484: </step>
485: 
486: <step name="offer_next">
487: If `USER_SETUP_CREATED=true`: display `⚠️ USER SETUP REQUIRED` with path + env/config tasks at TOP.
488: 
489: ```bash
490: (ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null || true) | wc -l
491: (ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null || true) | wc -l
492: ```
493: 
494: | Condition | Route | Action |
495: |-----------|-------|--------|
496: | summaries < plans | **A: More plans** | Find next PLAN without SUMMARY. Yolo: auto-continue. Interactive: show next plan, suggest `/gsd-execute-phase {phase}` + `/gsd-verify-work`. STOP here. |
497: | summaries = plans, current < highest phase | **B: Phase done** | Show completion, suggest `/gsd-plan-phase {Z+1}` + `/gsd-verify-work {Z}` + `/gsd-discuss-phase {Z+1}` |
498: | summaries = plans, current = highest phase | **C: Milestone done** | Show banner, suggest `/gsd-complete-milestone` + `/gsd-verify-work` + `/gsd-add-phase` |
499: 
500: All routes: `/clear` first for fresh context.
501: </step>
502: 
503: </process>
504: 
505: <success_criteria>
506: 
507: - All tasks from PLAN.md completed
508: - All verifications pass
509: - USER-SETUP.md generated if user_setup in frontmatter
510: - SUMMARY.md created with substantive content
511: - STATE.md updated (position, decisions, issues, session) — unless parallel mode (orchestrator handles)
512: - ROADMAP.md updated — unless parallel mode (orchestrator handles)
513: - If codebase map exists: map updated with execution changes (or skipped if no significant changes)
514: - If USER-SETUP.md created: prominently surfaced in completion output
515: </success_criteria>

(End of file - total 515 lines)
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

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md</path>
<type>file</type>
<content>
1: <overview>
2: Plans execute autonomously. Checkpoints formalize interaction points where human verification or decisions are needed.
3: 
4: **Core principle:** the agent automates everything with CLI/API. Checkpoints are for verification and decisions, not manual work.
5: 
6: **Golden rules:**
7: 1. **If the agent can run it, the agent runs it** - Never ask user to execute CLI commands, start servers, or run builds
8: 2. **the agent sets up the verification environment** - Start dev servers, seed databases, configure env vars
9: 3. **User only does what requires human judgment** - Visual checks, UX evaluation, "does this feel right?"
10: 4. **Secrets come from user, automation comes from the agent** - Ask for API keys, then the agent uses them via CLI
11: 5. **Auto-mode bypasses verification/decision checkpoints** — When `workflow._auto_chain_active` or `workflow.auto_advance` is true in config: human-verify auto-approves, decision auto-selects first option, human-action still stops (auth gates cannot be automated)
12: </overview>
13: 
14: <checkpoint_types>
15: 
16: <type name="human-verify">
17: ## checkpoint:human-verify (Most Common - 90%)
18: 
19: **When:** the agent completed automated work, human confirms it works correctly.
20: 
21: **Use for:**
22: - Visual UI checks (layout, styling, responsiveness)
23: - Interactive flows (click through wizard, test user flows)
24: - Functional verification (feature works as expected)
25: - Audio/video playback quality
26: - Animation smoothness
27: - Accessibility testing
28: 
29: **Structure:**
30: ```xml
31: <task type="checkpoint:human-verify" gate="blocking">
32:   <what-built>[What the agent automated and deployed/built]</what-built>
33:   <how-to-verify>
34:     [Exact steps to test - URLs, commands, expected behavior]
35:   </how-to-verify>
36:   <resume-signal>[How to continue - "approved", "yes", or describe issues]</resume-signal>
37: </task>
38: ```
39: 
40: **Example: UI Component (shows key pattern: the agent starts server BEFORE checkpoint)**
41: ```xml
42: <task type="auto">
43:   <name>Build responsive dashboard layout</name>
44:   <files>src/components/Dashboard.tsx, src/app/dashboard/page.tsx</files>
45:   <action>Create dashboard with sidebar, header, and content area. Use Tailwind responsive classes for mobile.</action>
46:   <verify>npm run build succeeds, no TypeScript errors</verify>
47:   <done>Dashboard component builds without errors</done>
48: </task>
49: 
50: <task type="auto">
51:   <name>Start dev server for verification</name>
52:   <action>Run `npm run dev` in background, wait for "ready" message, capture port</action>
53:   <verify>fetch http://localhost:3000 returns 200</verify>
54:   <done>Dev server running at http://localhost:3000</done>
55: </task>
56: 
57: <task type="checkpoint:human-verify" gate="blocking">
58:   <what-built>Responsive dashboard layout - dev server running at http://localhost:3000</what-built>
59:   <how-to-verify>
60:     Visit http://localhost:3000/dashboard and verify:
61:     1. Desktop (>1024px): Sidebar left, content right, header top
62:     2. Tablet (768px): Sidebar collapses to hamburger menu
63:     3. Mobile (375px): Single column layout, bottom nav appears
64:     4. No layout shift or horizontal scroll at any size
65:   </how-to-verify>
66:   <resume-signal>Type "approved" or describe layout issues</resume-signal>
67: </task>
68: ```
69: 
70: **Example: Xcode Build**
71: ```xml
72: <task type="auto">
73:   <name>Build macOS app with Xcode</name>
74:   <files>App.xcodeproj, Sources/</files>
75:   <action>Run `xcodebuild -project App.xcodeproj -scheme App build`. Check for compilation errors in output.</action>
76:   <verify>Build output contains "BUILD SUCCEEDED", no errors</verify>
77:   <done>App builds successfully</done>
78: </task>
79: 
80: <task type="checkpoint:human-verify" gate="blocking">
81:   <what-built>Built macOS app at DerivedData/Build/Products/Debug/App.app</what-built>
82:   <how-to-verify>
83:     Open App.app and test:
84:     - App launches without crashes
85:     - Menu bar icon appears
86:     - Preferences window opens correctly
87:     - No visual glitches or layout issues
88:   </how-to-verify>
89:   <resume-signal>Type "approved" or describe issues</resume-signal>
90: </task>
91: ```
92: </type>
93: 
94: <type name="decision">
95: ## checkpoint:decision (9%)
96: 
97: **When:** Human must make choice that affects implementation direction.
98: 
99: **Use for:**
100: - Technology selection (which auth provider, which database)
101: - Architecture decisions (monorepo vs separate repos)
102: - Design choices (color scheme, layout approach)
103: - Feature prioritization (which variant to build)
104: - Data model decisions (schema structure)
105: 
106: **Structure:**
107: ```xml
108: <task type="checkpoint:decision" gate="blocking">
109:   <decision>[What's being decided]</decision>
110:   <context>[Why this decision matters]</context>
111:   <options>
112:     <option id="option-a">
113:       <name>[Option name]</name>
114:       <pros>[Benefits]</pros>
115:       <cons>[Tradeoffs]</cons>
116:     </option>
117:     <option id="option-b">
118:       <name>[Option name]</name>
119:       <pros>[Benefits]</pros>
120:       <cons>[Tradeoffs]</cons>
121:     </option>
122:   </options>
123:   <resume-signal>[How to indicate choice]</resume-signal>
124: </task>
125: ```
126: 
127: **Example: Auth Provider Selection**
128: ```xml
129: <task type="checkpoint:decision" gate="blocking">
130:   <decision>Select authentication provider</decision>
131:   <context>
132:     Need user authentication for the app. Three solid options with different tradeoffs.
133:   </context>
134:   <options>
135:     <option id="supabase">
136:       <name>Supabase Auth</name>
137:       <pros>Built-in with Supabase DB we're using, generous free tier, row-level security integration</pros>
138:       <cons>Less customizable UI, tied to Supabase ecosystem</cons>
139:     </option>
140:     <option id="clerk">
141:       <name>Clerk</name>
142:       <pros>Beautiful pre-built UI, best developer experience, excellent docs</pros>
143:       <cons>Paid after 10k MAU, vendor lock-in</cons>
144:     </option>
145:     <option id="nextauth">
146:       <name>NextAuth.js</name>
147:       <pros>Free, self-hosted, maximum control, widely adopted</pros>
148:       <cons>More setup work, you manage security updates, UI is DIY</cons>
149:     </option>
150:   </options>
151:   <resume-signal>Select: supabase, clerk, or nextauth</resume-signal>
152: </task>
153: ```
154: 
155: **Example: Database Selection**
156: ```xml
157: <task type="checkpoint:decision" gate="blocking">
158:   <decision>Select database for user data</decision>
159:   <context>
160:     App needs persistent storage for users, sessions, and user-generated content.
161:     Expected scale: 10k users, 1M records first year.
162:   </context>
163:   <options>
164:     <option id="supabase">
165:       <name>Supabase (Postgres)</name>
166:       <pros>Full SQL, generous free tier, built-in auth, real-time subscriptions</pros>
167:       <cons>Vendor lock-in for real-time features, less flexible than raw Postgres</cons>
168:     </option>
169:     <option id="planetscale">
170:       <name>PlanetScale (MySQL)</name>
171:       <pros>Serverless scaling, branching workflow, excellent DX</pros>
172:       <cons>MySQL not Postgres, no foreign keys in free tier</cons>
173:     </option>
174:     <option id="convex">
175:       <name>Convex</name>
176:       <pros>Real-time by default, TypeScript-native, automatic caching</pros>
177:       <cons>Newer platform, different mental model, less SQL flexibility</cons>
178:     </option>
179:   </options>
180:   <resume-signal>Select: supabase, planetscale, or convex</resume-signal>
181: </task>
182: ```
183: </type>
184: 
185: <type name="human-action">
186: ## checkpoint:human-action (1% - Rare)
187: 
188: **When:** Action has NO CLI/API and requires human-only interaction, OR the agent hit an authentication gate during automation.
189: 
190: **Use ONLY for:**
191: - **Authentication gates** - the agent tried CLI/API but needs credentials (this is NOT a failure)
192: - Email verification links (clicking email)
193: - SMS 2FA codes (phone verification)
194: - Manual account approvals (platform requires human review)
195: - Credit card 3D Secure flows (web-based payment authorization)
196: - OAuth app approvals (web-based approval)
197: 
198: **Do NOT use for pre-planned manual work:**
199: - Deploying (use CLI - auth gate if needed)
200: - Creating webhooks/databases (use API/CLI - auth gate if needed)
201: - Running builds/tests (use Bash tool)
202: - Creating files (use Write tool)
203: 
204: **Structure:**
205: ```xml
206: <task type="checkpoint:human-action" gate="blocking">
207:   <action>[What human must do - the agent already did everything automatable]</action>
208:   <instructions>
209:     [What the agent already automated]
210:     [The ONE thing requiring human action]
211:   </instructions>
212:   <verification>[What the agent can check afterward]</verification>
213:   <resume-signal>[How to continue]</resume-signal>
214: </task>
215: ```
216: 
217: **Example: Email Verification**
218: ```xml
219: <task type="auto">
220:   <name>Create SendGrid account via API</name>
221:   <action>Use SendGrid API to create subuser account with provided email. Request verification email.</action>
222:   <verify>API returns 201, account created</verify>
223:   <done>Account created, verification email sent</done>
224: </task>
225: 
226: <task type="checkpoint:human-action" gate="blocking">
227:   <action>Complete email verification for SendGrid account</action>
228:   <instructions>
229:     I created the account and requested verification email.
230:     Check your inbox for SendGrid verification link and click it.
231:   </instructions>
232:   <verification>SendGrid API key works: curl test succeeds</verification>
233:   <resume-signal>Type "done" when email verified</resume-signal>
234: </task>
235: ```
236: 
237: **Example: Authentication Gate (Dynamic Checkpoint)**
238: ```xml
239: <task type="auto">
240:   <name>Deploy to Vercel</name>
241:   <files>.vercel/, vercel.json</files>
242:   <action>Run `vercel --yes` to deploy</action>
243:   <verify>vercel ls shows deployment, fetch returns 200</verify>
244: </task>
245: 
246: <!-- If vercel returns "Error: Not authenticated", the agent creates checkpoint on the fly -->
247: 
248: <task type="checkpoint:human-action" gate="blocking">
249:   <action>Authenticate Vercel CLI so I can continue deployment</action>
250:   <instructions>
251:     I tried to deploy but got authentication error.
252:     Run: vercel login
253:     This will open your browser - complete the authentication flow.
254:   </instructions>
255:   <verification>vercel whoami returns your account email</verification>
256:   <resume-signal>Type "done" when authenticated</resume-signal>
257: </task>
258: 
259: <!-- After authentication, the agent retries the deployment -->
260: 
261: <task type="auto">
262:   <name>Retry Vercel deployment</name>
263:   <action>Run `vercel --yes` (now authenticated)</action>
264:   <verify>vercel ls shows deployment, fetch returns 200</verify>
265: </task>
266: ```
267: 
268: **Key distinction:** Auth gates are created dynamically when the agent encounters auth errors. NOT pre-planned — the agent automates first, asks for credentials only when blocked.
269: </type>
270: </checkpoint_types>
271: 
272: <execution_protocol>
273: 
274: When the agent encounters `type="checkpoint:*"`:
275: 
276: 1. **Stop immediately** - do not proceed to next task
277: 2. **Display checkpoint clearly** using the format below
278: 3. **Wait for user response** - do not hallucinate completion
279: 4. **Verify if possible** - check files, run tests, whatever is specified
280: 5. **Resume execution** - continue to next task only after confirmation
281: 
282: **For checkpoint:human-verify:**
283: ```
284: ╔═══════════════════════════════════════════════════════╗
285: ║  CHECKPOINT: Verification Required                    ║
286: ╚═══════════════════════════════════════════════════════╝
287: 
288: Progress: 5/8 tasks complete
289: Task: Responsive dashboard layout
290: 
291: Built: Responsive dashboard at /dashboard
292: 
293: How to verify:
294:   1. Visit: http://localhost:3000/dashboard
295:   2. Desktop (>1024px): Sidebar visible, content fills remaining space
296:   3. Tablet (768px): Sidebar collapses to icons
297:   4. Mobile (375px): Sidebar hidden, hamburger menu appears
298: 
299: ────────────────────────────────────────────────────────
300: → YOUR ACTION: Type "approved" or describe issues
301: ────────────────────────────────────────────────────────
302: ```
303: 
304: **For checkpoint:decision:**
305: ```
306: ╔═══════════════════════════════════════════════════════╗
307: ║  CHECKPOINT: Decision Required                        ║
308: ╚═══════════════════════════════════════════════════════╝
309: 
310: Progress: 2/6 tasks complete
311: Task: Select authentication provider
312: 
313: Decision: Which auth provider should we use?
314: 
315: Context: Need user authentication. Three options with different tradeoffs.
316: 
317: Options:
318:   1. supabase - Built-in with our DB, free tier
319:      Pros: Row-level security integration, generous free tier
320:      Cons: Less customizable UI, ecosystem lock-in
321: 
322:   2. clerk - Best DX, paid after 10k users
323:      Pros: Beautiful pre-built UI, excellent documentation
324:      Cons: Vendor lock-in, pricing at scale
325: 
326:   3. nextauth - Self-hosted, maximum control
327:      Pros: Free, no vendor lock-in, widely adopted
328:      Cons: More setup work, DIY security updates
329: 
330: ────────────────────────────────────────────────────────
331: → YOUR ACTION: Select supabase, clerk, or nextauth
332: ────────────────────────────────────────────────────────
333: ```
334: 
335: **For checkpoint:human-action:**
336: ```
337: ╔═══════════════════════════════════════════════════════╗
338: ║  CHECKPOINT: Action Required                          ║
339: ╚═══════════════════════════════════════════════════════╝
340: 
341: Progress: 3/8 tasks complete
342: Task: Deploy to Vercel
343: 
344: Attempted: vercel --yes
345: Error: Not authenticated. Please run 'vercel login'
346: 
347: What you need to do:
348:   1. Run: vercel login
349:   2. Complete browser authentication when it opens
350:   3. Return here when done
351: 
352: I'll verify: vercel whoami returns your account
353: 
354: ────────────────────────────────────────────────────────
355: → YOUR ACTION: Type "done" when authenticated
356: ────────────────────────────────────────────────────────
357: ```
358: </execution_protocol>
359: 
360: <authentication_gates>
361: 
362: **Auth gate = the agent tried CLI/API, got auth error.** Not a failure — a gate requiring human input to unblock.
363: 
364: **Pattern:** the agent tries automation → auth error → creates checkpoint:human-action → user authenticates → the agent retries → continues
365: 
366: **Gate protocol:**
367: 1. Recognize it's not a failure - missing auth is expected
368: 2. Stop current task - don't retry repeatedly
369: 3. Create checkpoint:human-action dynamically
370: 4. Provide exact authentication steps
371: 5. Verify authentication works
372: 6. Retry the original task
373: 7. Continue normally
374: 
375: **Key distinction:**
376: - Pre-planned checkpoint: "I need you to do X" (wrong - the agent should automate)
377: - Auth gate: "I tried to automate X but need credentials" (correct - unblocks automation)
378: 
379: </authentication_gates>
380: 
381: <automation_reference>
382: 
383: **The rule:** If it has CLI/API, the agent does it. Never ask human to perform automatable work.
384: 
385: ## Service CLI Reference
386: 
387: | Service | CLI/API | Key Commands | Auth Gate |
388: |---------|---------|--------------|-----------|
389: | Vercel | `vercel` | `--yes`, `env add`, `--prod`, `ls` | `vercel login` |
390: | Railway | `railway` | `init`, `up`, `variables set` | `railway login` |
391: | Fly | `fly` | `launch`, `deploy`, `secrets set` | `fly auth login` |
392: | Stripe | `stripe` + API | `listen`, `trigger`, API calls | API key in .env |
393: | Supabase | `supabase` | `init`, `link`, `db push`, `gen types` | `supabase login` |
394: | Upstash | `upstash` | `redis create`, `redis get` | `upstash auth login` |
395: | PlanetScale | `pscale` | `database create`, `branch create` | `pscale auth login` |
396: | GitHub | `gh` | `repo create`, `pr create`, `secret set` | `gh auth login` |
397: | Node | `npm`/`pnpm` | `install`, `run build`, `test`, `run dev` | N/A |
398: | Xcode | `xcodebuild` | `-project`, `-scheme`, `build`, `test` | N/A |
399: | Convex | `npx convex` | `dev`, `deploy`, `env set`, `env get` | `npx convex login` |
400: 
401: ## Environment Variable Automation
402: 
403: **Env files:** Use Write/Edit tools. Never ask human to create .env manually.
404: 
405: **Dashboard env vars via CLI:**
406: 
407: | Platform | CLI Command | Example |
408: |----------|-------------|---------|
409: | Convex | `npx convex env set` | `npx convex env set OPENAI_API_KEY sk-...` |
410: | Vercel | `vercel env add` | `vercel env add STRIPE_KEY production` |
411: | Railway | `railway variables set` | `railway variables set API_KEY=value` |
412: | Fly | `fly secrets set` | `fly secrets set DATABASE_URL=...` |
413: | Supabase | `supabase secrets set` | `supabase secrets set MY_SECRET=value` |
414: 
415: **Secret collection pattern:**
416: ```xml
417: <!-- WRONG: Asking user to add env vars in dashboard -->
418: <task type="checkpoint:human-action">
419:   <action>Add OPENAI_API_KEY to Convex dashboard</action>
420:   <instructions>Go to dashboard.convex.dev → Settings → Environment Variables → Add</instructions>
421: </task>
422: 
423: <!-- RIGHT: the agent asks for value, then adds via CLI -->
424: <task type="checkpoint:human-action">
425:   <action>Provide your OpenAI API key</action>
426:   <instructions>
427:     I need your OpenAI API key for Convex backend.
428:     Get it from: https://platform.openai.com/api-keys
429:     Paste the key (starts with sk-)
430:   </instructions>
431:   <verification>I'll add it via `npx convex env set` and verify</verification>
432:   <resume-signal>Paste your API key</resume-signal>
433: </task>
434: 
435: <task type="auto">
436:   <name>Configure OpenAI key in Convex</name>
437:   <action>Run `npx convex env set OPENAI_API_KEY {user-provided-key}`</action>
438:   <verify>`npx convex env get OPENAI_API_KEY` returns the key (masked)</verify>
439: </task>
440: ```
441: 
442: ## Dev Server Automation
443: 
444: | Framework | Start Command | Ready Signal | Default URL |
445: |-----------|---------------|--------------|-------------|
446: | Next.js | `npm run dev` | "Ready in" or "started server" | http://localhost:3000 |
447: | Vite | `npm run dev` | "ready in" | http://localhost:5173 |
448: | Convex | `npx convex dev` | "Convex functions ready" | N/A (backend only) |
449: | Express | `npm start` | "listening on port" | http://localhost:3000 |
450: | Django | `python manage.py runserver` | "Starting development server" | http://localhost:8000 |
451: 
452: **Server lifecycle:**
453: ```bash
454: # Run in background, capture PID
455: npm run dev &
456: DEV_SERVER_PID=$!
457: 
458: # Wait for ready (max 30s) — uses fetch() for cross-platform compatibility
459: timeout 30 bash -c 'until node -e "fetch(\"http://localhost:3000\").then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))" 2>/dev/null; do sleep 1; done'
460: ```
461: 
462: **Port conflicts:** Kill stale process (`lsof -ti:3000 | xargs kill`) or use alternate port (`--port 3001`).
463: 
464: **Server stays running** through checkpoints. Only kill when plan complete, switching to production, or port needed for different service.
465: 
466: ## CLI Installation Handling
467: 
468: | CLI | Auto-install? | Command |
469: |-----|---------------|---------|
470: | npm/pnpm/yarn | No - ask user | User chooses package manager |
471: | vercel | Yes | `npm i -g vercel` |
472: | gh (GitHub) | Yes | `brew install gh` (macOS) or `apt install gh` (Linux) |
473: | stripe | Yes | `npm i -g stripe` |
474: | supabase | Yes | `npm i -g supabase` |
475: | convex | No - use npx | `npx convex` (no install needed) |
476: | fly | Yes | `brew install flyctl` or curl installer |
477: | railway | Yes | `npm i -g @railway/cli` |
478: 
479: **Protocol:** Try command → "command not found" → auto-installable? → yes: install silently, retry → no: checkpoint asking user to install.
480: 
481: ## Pre-Checkpoint Automation Failures
482: 
483: | Failure | Response |
484: |---------|----------|
485: | Server won't start | Check error, fix issue, retry (don't proceed to checkpoint) |
486: | Port in use | Kill stale process or use alternate port |
487: | Missing dependency | Run `npm install`, retry |
488: | Build error | Fix the error first (bug, not checkpoint issue) |
489: | Auth error | Create auth gate checkpoint |
490: | Network timeout | Retry with backoff, then checkpoint if persistent |
491: 
492: **Never present a checkpoint with broken verification environment.** If the local server isn't responding, don't ask user to "visit localhost:3000".
493: 
494: > **Cross-platform note:** Use `node -e "fetch('http://localhost:3000').then(r=>console.log(r.status))"` instead of `curl` for health checks. `curl` is broken on Windows MSYS/Git Bash due to SSL/path mangling issues.
495: 
496: ```xml
497: <!-- WRONG: Checkpoint with broken environment -->
498: <task type="checkpoint:human-verify">
499:   <what-built>Dashboard (server failed to start)</what-built>
500:   <how-to-verify>Visit http://localhost:3000...</how-to-verify>
501: </task>
502: 
503: <!-- RIGHT: Fix first, then checkpoint -->
504: <task type="auto">
505:   <name>Fix server startup issue</name>
506:   <action>Investigate error, fix root cause, restart server</action>
507:   <verify>fetch http://localhost:3000 returns 200</verify>
508: </task>
509: 
510: <task type="checkpoint:human-verify">
511:   <what-built>Dashboard - server running at http://localhost:3000</what-built>
512:   <how-to-verify>Visit http://localhost:3000/dashboard...</how-to-verify>
513: </task>
514: ```
515: 
516: ## Automatable Quick Reference
517: 
518: | Action | Automatable? | the agent does it? |
519: |--------|--------------|-----------------|
520: | Deploy to Vercel | Yes (`vercel`) | YES |
521: | Create Stripe webhook | Yes (API) | YES |
522: | Write .env file | Yes (Write tool) | YES |
523: | Create Upstash DB | Yes (`upstash`) | YES |
524: | Run tests | Yes (`npm test`) | YES |
525: | Start dev server | Yes (`npm run dev`) | YES |
526: | Add env vars to Convex | Yes (`npx convex env set`) | YES |
527: | Add env vars to Vercel | Yes (`vercel env add`) | YES |
528: | Seed database | Yes (CLI/API) | YES |
529: | Click email verification link | No | NO |
530: | Enter credit card with 3DS | No | NO |
531: | Complete OAuth in browser | No | NO |
532: | Visually verify UI looks correct | No | NO |
533: | Test interactive user flows | No | NO |
534: 
535: </automation_reference>
536: 
537: <writing_guidelines>
538: 
539: **DO:**
540: - Automate everything with CLI/API before checkpoint
541: - Be specific: "Visit https://myapp.vercel.app" not "check deployment"
542: - Number verification steps
543: - State expected outcomes: "You should see X"
544: - Provide context: why this checkpoint exists
545: 
546: **DON'T:**
547: - Ask human to do work the agent can automate ❌
548: - Assume knowledge: "Configure the usual settings" ❌
549: - Skip steps: "Set up database" (too vague) ❌
550: - Mix multiple verifications in one checkpoint ❌
551: 
552: **Placement:**
553: - **After automation completes** - not before the agent does the work
554: - **After UI buildout** - before declaring phase complete
555: - **Before dependent work** - decisions before implementation
556: - **At integration points** - after configuring external services
557: 
558: **Bad placement:** Before automation ❌ | Too frequent ❌ | Too late (dependent tasks already needed the result) ❌
559: </writing_guidelines>
560: 
561: <examples>
562: 
563: ### Example 1: Database Setup (No Checkpoint Needed)
564: 
565: ```xml
566: <task type="auto">
567:   <name>Create Upstash Redis database</name>
568:   <files>.env</files>
569:   <action>
570:     1. Run `upstash redis create myapp-cache --region us-east-1`
571:     2. Capture connection URL from output
572:     3. Write to .env: UPSTASH_REDIS_URL={url}
573:     4. Verify connection with test command
574:   </action>
575:   <verify>
576:     - upstash redis list shows database
577:     - .env contains UPSTASH_REDIS_URL
578:     - Test connection succeeds
579:   </verify>
580:   <done>Redis database created and configured</done>
581: </task>
582: 
583: <!-- NO CHECKPOINT NEEDED - the agent automated everything and verified programmatically -->
584: ```
585: 
586: ### Example 2: Full Auth Flow (Single checkpoint at end)
587: 
588: ```xml
589: <task type="auto">
590:   <name>Create user schema</name>
591:   <files>src/db/schema.ts</files>
592:   <action>Define User, Session, Account tables with Drizzle ORM</action>
593:   <verify>npm run db:generate succeeds</verify>
594: </task>
595: 
596: <task type="auto">
597:   <name>Create auth API routes</name>
598:   <files>src/app/api/auth/[...nextauth]/route.ts</files>
599:   <action>Set up NextAuth with GitHub provider, JWT strategy</action>
600:   <verify>TypeScript compiles, no errors</verify>
601: </task>
602: 
603: <task type="auto">
604:   <name>Create login UI</name>
605:   <files>src/app/login/page.tsx, src/components/LoginButton.tsx</files>
606:   <action>Create login page with GitHub OAuth button</action>
607:   <verify>npm run build succeeds</verify>
608: </task>
609: 
610: <task type="auto">
611:   <name>Start dev server for auth testing</name>
612:   <action>Run `npm run dev` in background, wait for ready signal</action>
613:   <verify>fetch http://localhost:3000 returns 200</verify>
614:   <done>Dev server running at http://localhost:3000</done>
615: </task>
616: 
617: <!-- ONE checkpoint at end verifies the complete flow -->
618: <task type="checkpoint:human-verify" gate="blocking">
619:   <what-built>Complete authentication flow - dev server running at http://localhost:3000</what-built>
620:   <how-to-verify>
621:     1. Visit: http://localhost:3000/login
622:     2. Click "Sign in with GitHub"
623:     3. Complete GitHub OAuth flow
624:     4. Verify: Redirected to /dashboard, user name displayed
625:     5. Refresh page: Session persists
626:     6. Click logout: Session cleared
627:   </how-to-verify>
628:   <resume-signal>Type "approved" or describe issues</resume-signal>
629: </task>
630: ```
631: </examples>
632: 
633: <anti_patterns>
634: 
635: ### ❌ BAD: Asking user to start dev server
636: 
637: ```xml
638: <task type="checkpoint:human-verify" gate="blocking">
639:   <what-built>Dashboard component</what-built>
640:   <how-to-verify>
641:     1. Run: npm run dev
642:     2. Visit: http://localhost:3000/dashboard
643:     3. Check layout is correct
644:   </how-to-verify>
645: </task>
646: ```
647: 
648: **Why bad:** the agent can run `npm run dev`. User should only visit URLs, not execute commands.
649: 
650: ### ✅ GOOD: the agent starts server, user visits
651: 
652: ```xml
653: <task type="auto">
654:   <name>Start dev server</name>
655:   <action>Run `npm run dev` in background</action>
656:   <verify>fetch http://localhost:3000 returns 200</verify>
657: </task>
658: 
659: <task type="checkpoint:human-verify" gate="blocking">
660:   <what-built>Dashboard at http://localhost:3000/dashboard (server running)</what-built>
661:   <how-to-verify>
662:     Visit http://localhost:3000/dashboard and verify:
663:     1. Layout matches design
664:     2. No console errors
665:   </how-to-verify>
666: </task>
667: ```
668: 
669: ### ❌ BAD: Asking human to deploy / ✅ GOOD: the agent automates
670: 
671: ```xml
672: <!-- BAD: Asking user to deploy via dashboard -->
673: <task type="checkpoint:human-action" gate="blocking">
674:   <action>Deploy to Vercel</action>
675:   <instructions>Visit vercel.com/new → Import repo → Click Deploy → Copy URL</instructions>
676: </task>
677: 
678: <!-- GOOD: the agent deploys, user verifies -->
679: <task type="auto">
680:   <name>Deploy to Vercel</name>
681:   <action>Run `vercel --yes`. Capture URL.</action>
682:   <verify>vercel ls shows deployment, fetch returns 200</verify>
683: </task>
684: 
685: <task type="checkpoint:human-verify">
686:   <what-built>Deployed to {url}</what-built>
687:   <how-to-verify>Visit {url}, check homepage loads</how-to-verify>
688:   <resume-signal>Type "approved"</resume-signal>
689: </task>
690: ```
691: 
692: ### ❌ BAD: Too many checkpoints / ✅ GOOD: Single checkpoint
693: 
694: ```xml
695: <!-- BAD: Checkpoint after every task -->
696: <task type="auto">Create schema</task>
697: <task type="checkpoint:human-verify">Check schema</task>
698: <task type="auto">Create API route</task>
699: <task type="checkpoint:human-verify">Check API</task>
700: <task type="auto">Create UI form</task>
701: <task type="checkpoint:human-verify">Check form</task>
702: 
703: <!-- GOOD: One checkpoint at end -->
704: <task type="auto">Create schema</task>
705: <task type="auto">Create API route</task>
706: <task type="auto">Create UI form</task>
707: 
708: <task type="checkpoint:human-verify">
709:   <what-built>Complete auth flow (schema + API + UI)</what-built>
710:   <how-to-verify>Test full flow: register, login, access protected page</how-to-verify>
711:   <resume-signal>Type "approved"</resume-signal>
712: </task>
713: ```
714: 
715: ### ❌ BAD: Vague verification / ✅ GOOD: Specific steps
716: 
717: ```xml
718: <!-- BAD -->
719: <task type="checkpoint:human-verify">
720:   <what-built>Dashboard</what-built>
721:   <how-to-verify>Check it works</how-to-verify>
722: </task>
723: 
724: <!-- GOOD -->
725: <task type="checkpoint:human-verify">
726:   <what-built>Responsive dashboard - server running at http://localhost:3000</what-built>
727:   <how-to-verify>
728:     Visit http://localhost:3000/dashboard and verify:
729:     1. Desktop (>1024px): Sidebar visible, content area fills remaining space
730:     2. Tablet (768px): Sidebar collapses to icons
731:     3. Mobile (375px): Sidebar hidden, hamburger menu in header
732:     4. No horizontal scroll at any size
733:   </how-to-verify>
734:   <resume-signal>Type "approved" or describe layout issues</resume-signal>
735: </task>
736: ```
737: 
738: ### ❌ BAD: Asking user to run CLI commands
739: 
740: ```xml
741: <task type="checkpoint:human-action">
742:   <action>Run database migrations</action>
743:   <instructions>Run: npx prisma migrate deploy && npx prisma db seed</instructions>
744: </task>
745: ```
746: 
747: **Why bad:** the agent can run these commands. User should never execute CLI commands.
748: 
749: ### ❌ BAD: Asking user to copy values between services
750: 
751: ```xml
752: <task type="checkpoint:human-action">
753:   <action>Configure webhook URL in Stripe</action>
754:   <instructions>Copy deployment URL → Stripe Dashboard → Webhooks → Add endpoint → Copy secret → Add to .env</instructions>
755: </task>
756: ```
757: 
758: **Why bad:** Stripe has an API. the agent should create the webhook via API and write to .env directly.
759: 
760: </anti_patterns>
761: 
762: <type name="tdd-review">
763: ## checkpoint:tdd-review (TDD Mode Only)
764: 
765: **When:** All waves in a phase complete and `workflow.tdd_mode` is enabled. Inserted by the execute-phase orchestrator after `aggregate_results`.
766: 
767: **Purpose:** Collaborative review of TDD gate compliance across all `type: tdd` plans in the phase. Advisory — does not block execution.
768: 
769: **Use for:**
770: - Verifying RED/GREEN/REFACTOR commit sequence for each TDD plan
771: - Surfacing gate violations (missing RED or GREEN commits)
772: - Reviewing test quality (tests fail for the right reason)
773: - Confirming minimal GREEN implementations
774: 
775: **Structure:**
776: ```xml
777: <task type="checkpoint:tdd-review" gate="advisory">
778:   <what-checked>TDD gate compliance for {count} plans in Phase {X}</what-checked>
779:   <gate-results>
780:     | Plan | RED | GREEN | REFACTOR | Status |
781:     |------|-----|-------|----------|--------|
782:     | {id} |  ✓  |   ✓   |    ✓     | Pass   |
783:   </gate-results>
784:   <violations>[List of gate violations, or "None"]</violations>
785:   <resume-signal>Review complete — proceed to phase verification</resume-signal>
786: </task>
787: ```
788: 
789: **Auto-mode behavior:** When `workflow._auto_chain_active` or `workflow.auto_advance` is true, the TDD review checkpoint auto-approves (advisory gate — never blocks).
790: </type>
791: 
792: <summary>
793: 
794: Checkpoints formalize human-in-the-loop points for verification and decisions, not manual work.
795: 
796: **The golden rule:** If the agent CAN automate it, the agent MUST automate it.
797: 
798: **Checkpoint priority:**
799: 1. **checkpoint:human-verify** (90%) - the agent automated everything, human confirms visual/functional correctness
800: 2. **checkpoint:decision** (9%) - Human makes architectural/technology choices
801: 3. **checkpoint:human-action** (1%) - Truly unavoidable manual steps with no API/CLI
802: 
803: **When NOT to use checkpoints:**
804: - Things the agent can verify programmatically (tests, builds)
805: - File operations (the agent can read files)
806: - Code correctness (tests and static analysis)
807: - Anything automatable via CLI/API
808: </summary>

(End of file - total 808 lines)
</content>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md</path>
<type>file</type>
<content>
1: # Summary Template
2: 
3: Template for `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md` - phase completion documentation.
4: 
5: ---
6: 
7: ## File Template
8: 
9: ```markdown
10: ---
11: phase: XX-name
12: plan: YY
13: subsystem: [primary category: auth, payments, ui, api, database, infra, testing, etc.]
14: tags: [searchable tech: jwt, stripe, react, postgres, prisma]
15: 
16: # Dependency graph
17: requires:
18:   - phase: [prior phase this depends on]
19:     provides: [what that phase built that this uses]
20: provides:
21:   - [bullet list of what this phase built/delivered]
22: affects: [list of phase names or keywords that will need this context]
23: 
24: # Tech tracking
25: tech-stack:
26:   added: [libraries/tools added in this phase]
27:   patterns: [architectural/code patterns established]
28: 
29: key-files:
30:   created: [important files created]
31:   modified: [important files modified]
32: 
33: key-decisions:
34:   - "Decision 1"
35:   - "Decision 2"
36: 
37: patterns-established:
38:   - "Pattern 1: description"
39:   - "Pattern 2: description"
40: 
41: requirements-completed: []  # REQUIRED — Copy ALL requirement IDs from this plan's `requirements` frontmatter field.
42: 
43: # Metrics
44: duration: Xmin
45: completed: YYYY-MM-DD
46: ---
47: 
48: # Phase [X]: [Name] Summary
49: 
50: **[Substantive one-liner describing outcome - NOT "phase complete" or "implementation finished"]**
51: 
52: ## Performance
53: 
54: - **Duration:** [time] (e.g., 23 min, 1h 15m)
55: - **Started:** [ISO timestamp]
56: - **Completed:** [ISO timestamp]
57: - **Tasks:** [count completed]
58: - **Files modified:** [count]
59: 
60: ## Accomplishments
61: - [Most important outcome]
62: - [Second key accomplishment]
63: - [Third if applicable]
64: 
65: ## Task Commits
66: 
67: Each task was committed atomically:
68: 
69: 1. **Task 1: [task name]** - `abc123f` (feat/fix/test/refactor)
70: 2. **Task 2: [task name]** - `def456g` (feat/fix/test/refactor)
71: 3. **Task 3: [task name]** - `hij789k` (feat/fix/test/refactor)
72: 
73: **Plan metadata:** `lmn012o` (docs: complete plan)
74: 
75: _Note: TDD tasks may have multiple commits (test → feat → refactor)_
76: 
77: ## Files Created/Modified
78: - `path/to/file.ts` - What it does
79: - `path/to/another.ts` - What it does
80: 
81: ## Decisions Made
82: [Key decisions with brief rationale, or "None - followed plan as specified"]
83: 
84: ## Deviations from Plan
85: 
86: [If no deviations: "None - plan executed exactly as written"]
87: 
88: [If deviations occurred:]
89: 
90: ### Auto-fixed Issues
91: 
92: **1. [Rule X - Category] Brief description**
93: - **Found during:** Task [N] ([task name])
94: - **Issue:** [What was wrong]
95: - **Fix:** [What was done]
96: - **Files modified:** [file paths]
97: - **Verification:** [How it was verified]
98: - **Committed in:** [hash] (part of task commit)
99: 
100: [... repeat for each auto-fix ...]
101: 
102: ---
103: 
104: **Total deviations:** [N] auto-fixed ([breakdown by rule])
105: **Impact on plan:** [Brief assessment - e.g., "All auto-fixes necessary for correctness/security. No scope creep."]
106: 
107: ## Issues Encountered
108: [Problems and how they were resolved, or "None"]
109: 
110: [Note: "Deviations from Plan" documents unplanned work that was handled automatically via deviation rules. "Issues Encountered" documents problems during planned work that required problem-solving.]
111: 
112: ## User Setup Required
113: 
114: [If USER-SETUP.md was generated:]
115: **External services require manual configuration.** See [{phase}-USER-SETUP.md](./{phase}-USER-SETUP.md) for:
116: - Environment variables to add
117: - Dashboard configuration steps
118: - Verification commands
119: 
120: [If no USER-SETUP.md:]
121: None - no external service configuration required.
122: 
123: ## Next Phase Readiness
124: [What's ready for next phase]
125: [Any blockers or concerns]
126: 
127: ---
128: *Phase: XX-name*
129: *Completed: [date]*
130: ```
131: 
132: <frontmatter_guidance>
133: **Purpose:** Enable automatic context assembly via dependency graph. Frontmatter makes summary metadata machine-readable so plan-phase can scan all summaries quickly and select relevant ones based on dependencies.
134: 
135: **Fast scanning:** Frontmatter is first ~25 lines, cheap to scan across all summaries without reading full content.
136: 
137: **Dependency graph:** `requires`/`provides`/`affects` create explicit links between phases, enabling transitive closure for context selection.
138: 
139: **Subsystem:** Primary categorization (auth, payments, ui, api, database, infra, testing) for detecting related phases.
140: 
141: **Tags:** Searchable technical keywords (libraries, frameworks, tools) for tech stack awareness.
142: 
143: **Key-files:** Important files for @context references in PLAN.md.
144: 
145: **Patterns:** Established conventions future phases should maintain.
146: 
147: **Population:** Frontmatter is populated during summary creation in execute-plan.md. See `<step name="create_summary">` for field-by-field guidance.
148: </frontmatter_guidance>
149: 
150: <one_liner_rules>
151: The one-liner MUST be substantive:
152: 
153: **Good:**
154: - "JWT auth with refresh rotation using jose library"
155: - "Prisma schema with User, Session, and Product models"
156: - "Dashboard with real-time metrics via Server-Sent Events"
157: 
158: **Bad:**
159: - "Phase complete"
160: - "Authentication implemented"
161: - "Foundation finished"
162: - "All tasks done"
163: 
164: The one-liner should tell someone what actually shipped.
165: </one_liner_rules>
166: 
167: <example>
168: ```markdown
169: # Phase 1: Foundation Summary
170: 
171: **JWT auth with refresh rotation using jose library, Prisma User model, and protected API middleware**
172: 
173: ## Performance
174: 
175: - **Duration:** 28 min
176: - **Started:** 2025-01-15T14:22:10Z
177: - **Completed:** 2025-01-15T14:50:33Z
178: - **Tasks:** 5
179: - **Files modified:** 8
180: 
181: ## Accomplishments
182: - User model with email/password auth
183: - Login/logout endpoints with httpOnly JWT cookies
184: - Protected route middleware checking token validity
185: - Refresh token rotation on each request
186: 
187: ## Files Created/Modified
188: - `prisma/schema.prisma` - User and Session models
189: - `src/app/api/auth/login/route.ts` - Login endpoint
190: - `src/app/api/auth/logout/route.ts` - Logout endpoint
191: - `src/middleware.ts` - Protected route checks
192: - `src/lib/auth.ts` - JWT helpers using jose
193: 
194: ## Decisions Made
195: - Used jose instead of jsonwebtoken (ESM-native, Edge-compatible)
196: - 15-min access tokens with 7-day refresh tokens
197: - Storing refresh tokens in database for revocation capability
198: 
199: ## Deviations from Plan
200: 
201: ### Auto-fixed Issues
202: 
203: **1. [Rule 2 - Missing Critical] Added password hashing with bcrypt**
204: - **Found during:** Task 2 (Login endpoint implementation)
205: - **Issue:** Plan didn't specify password hashing - storing plaintext would be critical security flaw
206: - **Fix:** Added bcrypt hashing on registration, comparison on login with salt rounds 10
207: - **Files modified:** src/app/api/auth/login/route.ts, src/lib/auth.ts
208: - **Verification:** Password hash test passes, plaintext never stored
209: - **Committed in:** abc123f (Task 2 commit)
210: 
211: **2. [Rule 3 - Blocking] Installed missing jose dependency**
212: - **Found during:** Task 4 (JWT token generation)
213: - **Issue:** jose package not in package.json, import failing
214: - **Fix:** Ran `npm install jose`
215: - **Files modified:** package.json, package-lock.json
216: - **Verification:** Import succeeds, build passes
217: - **Committed in:** def456g (Task 4 commit)
218: 
219: ---
220: 
221: **Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
222: **Impact on plan:** Both auto-fixes essential for security and functionality. No scope creep.
223: 
224: ## Issues Encountered
225: - jsonwebtoken CommonJS import failed in Edge runtime - switched to jose (planned library change, worked as expected)
226: 
227: ## Next Phase Readiness
228: - Auth foundation complete, ready for feature development
229: - User registration endpoint needed before public launch
230: 
231: ---
232: *Phase: 01-foundation*
233: *Completed: 2025-01-15*
234: ```
235: </example>
236: 
237: <guidelines>
238: **Frontmatter:** MANDATORY - complete all fields. Enables automatic context assembly for future planning.
239: 
240: **One-liner:** Must be substantive. "JWT auth with refresh rotation using jose library" not "Authentication implemented".
241: 
242: **Decisions section:**
243: - Key decisions made during execution with rationale
244: - Extracted to STATE.md accumulated context
245: - Use "None - followed plan as specified" if no deviations
246: 
247: **After creation:** STATE.md updated with position, decisions, issues.
248: </guidelines>

(End of file - total 248 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/CONTEXT.md
# Phase Context Template

Template for `.planning/phases/XX-name/{phase_num}-CONTEXT.md` - captures implementation decisions for a phase.

**Purpose:** Document decisions that downstream agents need. Researcher uses this to know WHAT to investigate. Planner uses this to know WHAT choices are locked vs flexible.

**Key principle:** Categories are NOT predefined. They emerge from what was actually discussed for THIS phase. A CLI phase has CLI-relevant sections, a UI phase has UI-relevant sections.

**Downstream consumers:**
- `gsd-phase-researcher` — Reads decisions to focus research (e.g., "card layout" → research card component patterns)
- `gsd-planner` — Reads decisions to create specific tasks (e.g., "infinite scroll" → task includes virtualization)

---

## File Template

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor. This comes from ROADMAP.md and is fixed. Discussion clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- **D-01:** [Specific decision made]
- **D-02:** [Another decision if applicable]

### [Area 2 that was discussed]
- **D-03:** [Specific decision made]

### [Area 3 that was discussed]
- **D-04:** [Specific decision made]

### the agent's Discretion
[Areas where user explicitly said "you decide" — the agent has flexibility here during planning/implementation]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion. Product references, specific behaviors, interaction patterns.]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[List every spec, ADR, feature doc, or design doc that defines requirements or constraints for this phase. Use full relative paths so agents can read them directly. Group by topic area when the phase has multiple concerns.]

### [Topic area 1]
- `path/to/spec-or-adr.md` — [What this doc decides/defines that's relevant]
- `path/to/doc.md` §N — [Specific section and what it covers]

### [Topic area 2]
- `path/to/feature-doc.md` — [What capability this defines]

[If the project has no external specs: "No external specs — requirements are fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it could be used in this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<deferred>
## Deferred Ideas

[Ideas that came up during discussion but belong in other phases. Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

<good_examples>

**Example 1: Visual feature (Post Feed)**

```markdown
# Phase 3: Post Feed - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Display posts from followed users in a scrollable feed. Users can view posts and see engagement counts. Creating posts and interactions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout style
- Card-based layout, not timeline or list
- Each card shows: author avatar, name, timestamp, full post content, reaction counts
- Cards have subtle shadows, rounded corners — modern feel

### Loading behavior
- Infinite scroll, not pagination
- Pull-to-refresh on mobile
- New posts indicator at top ("3 new posts") rather than auto-inserting

### Empty state
- Friendly illustration + "Follow people to see posts here"
- Suggest 3-5 accounts to follow based on interests

### the agent's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling

</decisions>

<canonical_refs>
## Canonical References

### Feed display
- `docs/features/social-feed.md` — Feed requirements, post card fields, engagement display rules
- `docs/decisions/adr-012-infinite-scroll.md` — Scroll strategy decision, virtualization requirements

### Empty states
- `docs/design/empty-states.md` — Empty state patterns, illustration guidelines

</canonical_refs>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator without disrupting your scroll position"
- Cards should feel like Linear's issue cards — clean, not cluttered

</specifics>

<deferred>
## Deferred Ideas

- Commenting on posts — Phase 5
- Bookmarking posts — add to backlog

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**Example 2: CLI tool (Database backup)**

```markdown
# Phase 2: Backup Command - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI command to backup database to local file or S3. Supports full and incremental backups. Restore command is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Output format
- JSON for programmatic use, table format for humans
- Default to table, --json flag for JSON
- Verbose mode (-v) shows progress, silent by default

### Flag design
- Short flags for common options: -o (output), -v (verbose), -f (force)
- Long flags for clarity: --incremental, --compress, --encrypt
- Required: database connection string (positional or --db)

### Error recovery
- Retry 3 times on network failure, then fail with clear message
- --no-retry flag to fail fast
- Partial backups are deleted on failure (no corrupt files)

### the agent's Discretion
- Exact progress bar implementation
- Compression algorithm choice
- Temp file handling

</decisions>

<canonical_refs>
## Canonical References

### Backup CLI
- `docs/features/backup-restore.md` — Backup requirements, supported backends, encryption spec
- `docs/decisions/adr-007-cli-conventions.md` — Flag naming, exit codes, output format standards

</canonical_refs>

<specifics>
## Specific Ideas

- "I want it to feel like pg_dump — familiar to database people"
- Should work in CI pipelines (exit codes, no interactive prompts)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled backups — separate phase
- Backup rotation/retention — add to backlog

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**Example 3: Organization task (Photo library)**

```markdown
# Phase 1: Photo Organization - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize existing photo library into structured folders. Handle duplicates and apply consistent naming. Tagging and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Grouping criteria
- Primary grouping by year, then by month
- Events detected by time clustering (photos within 2 hours = same event)
- Event folders named by date + location if available

### Duplicate handling
- Keep highest resolution version
- Move duplicates to _duplicates folder (don't delete)
- Log all duplicate decisions for review

### Naming convention
- Format: YYYY-MM-DD_HH-MM-SS_originalname.ext
- Preserve original filename as suffix for searchability
- Handle name collisions with incrementing suffix

### the agent's Discretion
- Exact clustering algorithm
- How to handle photos with no EXIF data
- Folder emoji usage

</decisions>

<canonical_refs>
## Canonical References

### Organization rules
- `docs/features/photo-organization.md` — Grouping rules, duplicate policy, naming spec
- `docs/decisions/adr-003-exif-handling.md` — EXIF extraction strategy, fallback for missing metadata

</canonical_refs>

<specifics>
## Specific Ideas

- "I want to be able to find photos by roughly when they were taken"
- Don't delete anything — worst case, move to a review folder

</specifics>

<deferred>
## Deferred Ideas

- Face detection grouping — future phase
- Cloud sync — out of scope for now

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

</good_examples>

<guidelines>
**This template captures DECISIONS for downstream agents.**

The output should answer: "What does the researcher need to investigate? What choices are locked for the planner?"

**Good content (concrete decisions):**
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

**Bad content (too vague):**
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"
- "Easy to use"

**After creation:**
- File lives in phase directory: `.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` uses decisions to focus investigation AND reads canonical_refs to know WHAT docs to study
- `gsd-planner` uses decisions + research to create executable tasks AND reads canonical_refs to verify alignment
- Downstream agents should NOT need to ask the user again about captured decisions

**CRITICAL — Canonical references:**
- The `<canonical_refs>` section is MANDATORY. Every CONTEXT.md must have one.
- If your project has external specs, ADRs, or design docs, list them with full relative paths grouped by topic
- If ROADMAP.md lists `Canonical refs:` per phase, extract and expand those
- Inline mentions like "see ADR-019" scattered in decisions are useless to downstream agents — they need full paths and section references in a dedicated section they can find
- If no external specs exist, say so explicitly — don't silently omit the section
</guidelines>

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md</path>
<type>file</type>
<content>
1: <overview>
2: TDD is about design quality, not coverage metrics. The red-green-refactor cycle forces you to think about behavior before implementation, producing cleaner interfaces and more testable code.
3: 
4: **Principle:** If you can describe the behavior as `expect(fn(input)).toBe(output)` before writing `fn`, TDD improves the result.
5: 
6: **Key insight:** TDD work is fundamentally heavier than standard tasks—it requires 2-3 execution cycles (RED → GREEN → REFACTOR), each with file reads, test runs, and potential debugging. TDD features get dedicated plans to ensure full context is available throughout the cycle.
7: </overview>
8: 
9: <when_to_use_tdd>
10: ## When TDD Improves Quality
11: 
12: **TDD candidates (create a TDD plan):**
13: - Business logic with defined inputs/outputs
14: - API endpoints with request/response contracts
15: - Data transformations, parsing, formatting
16: - Validation rules and constraints
17: - Algorithms with testable behavior
18: - State machines and workflows
19: - Utility functions with clear specifications
20: 
21: **Skip TDD (use standard plan with `type="auto"` tasks):**
22: - UI layout, styling, visual components
23: - Configuration changes
24: - Glue code connecting existing components
25: - One-off scripts and migrations
26: - Simple CRUD with no business logic
27: - Exploratory prototyping
28: 
29: **Heuristic:** Can you write `expect(fn(input)).toBe(output)` before writing `fn`?
30: → Yes: Create a TDD plan
31: → No: Use standard plan, add tests after if needed
32: </when_to_use_tdd>
33: 
34: <tdd_plan_structure>
35: ## TDD Plan Structure
36: 
37: Each TDD plan implements **one feature** through the full RED-GREEN-REFACTOR cycle.
38: 
39: ```markdown
40: ---
41: phase: XX-name
42: plan: NN
43: type: tdd
44: ---
45: 
46: <objective>
47: [What feature and why]
48: Purpose: [Design benefit of TDD for this feature]
49: Output: [Working, tested feature]
50: </objective>
51: 
52: <context>
53: @.planning/PROJECT.md
54: @.planning/ROADMAP.md
55: @relevant/source/files.ts
56: </context>
57: 
58: <feature>
59:   <name>[Feature name]</name>
60:   <files>[source file, test file]</files>
61:   <behavior>
62:     [Expected behavior in testable terms]
63:     Cases: input → expected output
64:   </behavior>
65:   <implementation>[How to implement once tests pass]</implementation>
66: </feature>
67: 
68: <verification>
69: [Test command that proves feature works]
70: </verification>
71: 
72: <success_criteria>
73: - Failing test written and committed
74: - Implementation passes test
75: - Refactor complete (if needed)
76: - All 2-3 commits present
77: </success_criteria>
78: 
79: <output>
80: After completion, create SUMMARY.md with:
81: - RED: What test was written, why it failed
82: - GREEN: What implementation made it pass
83: - REFACTOR: What cleanup was done (if any)
84: - Commits: List of commits produced
85: </output>
86: ```
87: 
88: **One feature per TDD plan.** If features are trivial enough to batch, they're trivial enough to skip TDD—use a standard plan and add tests after.
89: </tdd_plan_structure>
90: 
91: <execution_flow>
92: ## Red-Green-Refactor Cycle
93: 
94: **RED - Write failing test:**
95: 1. Create test file following project conventions
96: 2. Write test describing expected behavior (from `<behavior>` element)
97: 3. Run test - it MUST fail
98: 4. If test passes: feature exists or test is wrong. Investigate.
99: 5. Commit: `test({phase}-{plan}): add failing test for [feature]`
100: 
101: **GREEN - Implement to pass:**
102: 1. Write minimal code to make test pass
103: 2. No cleverness, no optimization - just make it work
104: 3. Run test - it MUST pass
105: 4. Commit: `feat({phase}-{plan}): implement [feature]`
106: 
107: **REFACTOR (if needed):**
108: 1. Clean up implementation if obvious improvements exist
109: 2. Run tests - MUST still pass
110: 3. Only commit if changes made: `refactor({phase}-{plan}): clean up [feature]`
111: 
112: **Result:** Each TDD plan produces 2-3 atomic commits.
113: </execution_flow>
114: 
115: <test_quality>
116: ## Good Tests vs Bad Tests
117: 
118: **Test behavior, not implementation:**
119: - Good: "returns formatted date string"
120: - Bad: "calls formatDate helper with correct params"
121: - Tests should survive refactors
122: 
123: **One concept per test:**
124: - Good: Separate tests for valid input, empty input, malformed input
125: - Bad: Single test checking all edge cases with multiple assertions
126: 
127: **Descriptive names:**
128: - Good: "should reject empty email", "returns null for invalid ID"
129: - Bad: "test1", "handles error", "works correctly"
130: 
131: **No implementation details:**
132: - Good: Test public API, observable behavior
133: - Bad: Mock internals, test private methods, assert on internal state
134: </test_quality>
135: 
136: <framework_setup>
137: ## Test Framework Setup (If None Exists)
138: 
139: When executing a TDD plan but no test framework is configured, set it up as part of the RED phase:
140: 
141: **1. Detect project type:**
142: ```bash
143: # JavaScript/TypeScript
144: if [ -f package.json ]; then echo "node"; fi
145: 
146: # Python
147: if [ -f requirements.txt ] || [ -f pyproject.toml ]; then echo "python"; fi
148: 
149: # Go
150: if [ -f go.mod ]; then echo "go"; fi
151: 
152: # Rust
153: if [ -f Cargo.toml ]; then echo "rust"; fi
154: ```
155: 
156: **2. Install minimal framework:**
157: | Project | Framework | Install |
158: |---------|-----------|---------|
159: | Node.js | Jest | `npm install -D jest @types/jest ts-jest` |
160: | Node.js (Vite) | Vitest | `npm install -D vitest` |
161: | Python | pytest | `pip install pytest` |
162: | Go | testing | Built-in |
163: | Rust | cargo test | Built-in |
164: 
165: **3. Create config if needed:**
166: - Jest: `jest.config.js` with ts-jest preset
167: - Vitest: `vitest.config.ts` with test globals
168: - pytest: `pytest.ini` or `pyproject.toml` section
169: 
170: **4. Verify setup:**
171: ```bash
172: # Run empty test suite - should pass with 0 tests
173: npm test  # Node
174: pytest    # Python
175: go test ./...  # Go
176: cargo test    # Rust
177: ```
178: 
179: **5. Create first test file:**
180: Follow project conventions for test location:
181: - `*.test.ts` / `*.spec.ts` next to source
182: - `__tests__/` directory
183: - `tests/` directory at root
184: 
185: Framework setup is a one-time cost included in the first TDD plan's RED phase.
186: </framework_setup>
187: 
188: <error_handling>
189: ## Error Handling
190: 
191: **Test doesn't fail in RED phase:**
192: - Feature may already exist - investigate
193: - Test may be wrong (not testing what you think)
194: - Fix before proceeding
195: 
196: **Test doesn't pass in GREEN phase:**
197: - Debug implementation
198: - Don't skip to refactor
199: - Keep iterating until green
200: 
201: **Tests fail in REFACTOR phase:**
202: - Undo refactor
203: - Commit was premature
204: - Refactor in smaller steps
205: 
206: **Unrelated tests break:**
207: - Stop and investigate
208: - May indicate coupling issue
209: - Fix before proceeding
210: </error_handling>
211: 
212: <commit_pattern>
213: ## Commit Pattern for TDD Plans
214: 
215: TDD plans produce 2-3 atomic commits (one per phase):
216: 
217: ```
218: test(08-02): add failing test for email validation
219: 
220: - Tests valid email formats accepted
221: - Tests invalid formats rejected
222: - Tests empty input handling
223: 
224: feat(08-02): implement email validation
225: 
226: - Regex pattern matches RFC 5322
227: - Returns boolean for validity
228: - Handles edge cases (empty, null)
229: 
230: refactor(08-02): extract regex to constant (optional)
231: 
232: - Moved pattern to EMAIL_REGEX constant
233: - No behavior changes
234: - Tests still pass
235: ```
236: 
237: **Comparison with standard plans:**
238: - Standard plans: 1 commit per task, 2-4 commits per plan
239: - TDD plans: 2-3 commits for single feature
240: 
241: Both follow same format: `{type}({phase}-{plan}): {description}`
242: 
243: **Benefits:**
244: - Each commit independently revertable
245: - Git bisect works at commit level
246: - Clear history showing TDD discipline
247: - Consistent with overall commit strategy
248: </commit_pattern>
249: 
250: <gate_enforcement>
251: ## Gate Enforcement Rules
252: 
253: When `workflow.tdd_mode` is enabled in config, the RED/GREEN/REFACTOR gate sequence is enforced for all `type: tdd` plans.
254: 
255: ### Gate Definitions
256: 
257: | Gate | Required | Commit Pattern | Validation |
258: |------|----------|---------------|------------|
259: | RED | Yes | `test({phase}-{plan}): ...` | Test exists AND fails before implementation |
260: | GREEN | Yes | `feat({phase}-{plan}): ...` | Test passes after implementation |
261: | REFACTOR | No | `refactor({phase}-{plan}): ...` | Tests still pass after cleanup |
262: 
263: ### Fail-Fast Rules
264: 
265: 1. **Unexpected GREEN in RED phase:** If the test passes before any implementation code is written, STOP. The feature may already exist or the test is wrong. Investigate before proceeding.
266: 2. **Missing RED commit:** If no `test(...)` commit precedes the `feat(...)` commit, the TDD discipline was violated. Flag in SUMMARY.md.
267: 3. **REFACTOR breaks tests:** Undo the refactor immediately. Commit was premature — refactor in smaller steps.
268: 
269: ### Executor Gate Validation
270: 
271: After completing a `type: tdd` plan, the executor validates the git log:
272: ```bash
273: # Check for RED gate commit
274: git log --oneline --grep="^test(${PHASE}-${PLAN})" | head -1
275: # Check for GREEN gate commit  
276: git log --oneline --grep="^feat(${PHASE}-${PLAN})" | head -1
277: # Check for optional REFACTOR gate commit
278: git log --oneline --grep="^refactor(${PHASE}-${PLAN})" | head -1
279: ```
280: 
281: If RED or GREEN gate commits are missing, add a `## TDD Gate Compliance` section to SUMMARY.md with the violation details.
282: </gate_enforcement>
283: 
284: <end_of_phase_review>
285: ## End-of-Phase TDD Review Checkpoint
286: 
287: When `workflow.tdd_mode` is enabled, the execute-phase orchestrator inserts a collaborative review checkpoint after all waves complete but before phase verification.
288: 
289: ### Review Checkpoint Format
290: 
291: ```
292: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
293:  TDD REVIEW — Phase {X}
294: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
295: 
296: TDD Plans: {count} | Gate violations: {count}
297: 
298: | Plan | RED | GREEN | REFACTOR | Status |
299: |------|-----|-------|----------|--------|
300: | {id} |  ✓  |   ✓   |    ✓     | Pass   |
301: | {id} |  ✓  |   ✗   |    —     | FAIL   |
302: 
303: {If violations exist:}
304: ⚠ Gate violations are advisory — review before advancing.
305: ```
306: 
307: ### What the Review Checks
308: 
309: 1. **Gate sequence:** Each TDD plan has RED → GREEN commits in order
310: 2. **Test quality:** RED phase tests fail for the right reason (not import errors or syntax)
311: 3. **Minimal GREEN:** Implementation is minimal — no premature optimization in GREEN phase
312: 4. **Refactor discipline:** If REFACTOR commit exists, tests still pass
313: 
314: This checkpoint is advisory — it does not block phase completion but surfaces TDD discipline issues for human review.
315: </end_of_phase_review>
316: 
317: <context_budget>
318: ## Context Budget
319: 
320: TDD plans target **~40% context usage** (lower than standard plans' ~50%).
321: 
322: Why lower:
323: - RED phase: write test, run test, potentially debug why it didn't fail
324: - GREEN phase: implement, run test, potentially iterate on failures
325: - REFACTOR phase: modify code, run tests, verify no regressions
326: 
327: Each phase involves reading files, running commands, analyzing output. The back-and-forth is inherently heavier than linear task execution.
328: 
329: Single feature focus ensures full quality throughout the cycle.
330: </context_budget>

(End of file - total 330 lines)
</content>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md</path>
<type>file</type>
<content>
1: # Worktree Path Safety
2: 
3: Guards for executor agents running inside Claude Code worktrees. Three checks
4: must run before any staging, Edit, or Write operation in worktree mode.
5: 
6: ---
7: 
8: ## Worktree branch check (run once at spawn-time)
9: 
10: FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
11: spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
12: namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
13: or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
14: that destroys concurrent commits in multi-active scenarios (#2924). Only after
15: this passes is `git reset --hard` safe (#2015 — affects all platforms).
16: 
17: ```bash
18: HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
19: ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
20: if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
21:   echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
22:   exit 1
23: fi
24: if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
25:   echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
26:   exit 1
27: fi
28: ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
29: if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
30:   git reset --hard {EXPECTED_BASE}
31:   [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
32: fi
33: ```
34: 
35: Per-commit HEAD assertion: `agents/gsd-executor.md` `<task_commit_protocol>` step 0.
36: 
37: ---
38: 
39: ## cwd-drift sentinel — step 0a (#3097)
40: 
41: A prior Bash call may have `cd`'d out of the worktree into the main repo. When
42: that happens `[ -f .git ]` is false (main repo's `.git` is a directory), silently
43: skipping all worktree guards. The sentinel captures the spawn-time toplevel and
44: detects drift before every commit.
45: 
46: ```bash
47: if [ -f .git ]; then  # we are in a worktree
48:   WT_GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
49:   case "$WT_GIT_DIR" in
50:     *.git/worktrees/*)
51:       SENTINEL="$WT_GIT_DIR/gsd-spawn-toplevel"
52:       [ ! -f "$SENTINEL" ] && git rev-parse --show-toplevel > "$SENTINEL" 2>/dev/null
53:       EXPECTED_TL=$(cat "$SENTINEL" 2>/dev/null)
54:       ACTUAL_TL=$(git rev-parse --show-toplevel 2>/dev/null)
55:       if [ -n "$EXPECTED_TL" ] && [ "$ACTUAL_TL" != "$EXPECTED_TL" ]; then
56:         echo "FATAL: cwd drifted from spawn-time worktree root (#3097)" >&2
57:         echo "  Spawn-time: $EXPECTED_TL" >&2
58:         echo "  Current:    $ACTUAL_TL" >&2
59:         echo "RECOVERY: cd \"$EXPECTED_TL\" before staging, then re-run this commit." >&2
60:         exit 1
61:       fi
62:       ;;
63:   esac
64: fi
65: ```
66: 
67: ---
68: 
69: ## Absolute-path guard — step 0b (#3099)
70: 
71: Edit/Write calls using absolute paths constructed from the **orchestrator's** `pwd`
72: (main repo root) will resolve to the main repo, not the worktree. Writes land in
73: the wrong directory; `git commit` from the worktree sees a clean tree and the work
74: is silently lost.
75: 
76: Before any Edit or Write using an absolute path:
77: 
78: ```bash
79: WT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
80: # Fail fast if ABS_PATH resolves outside the worktree
81: if [[ "$ABS_PATH" != "$WT_ROOT"* ]]; then
82:   echo "WARNING: $ABS_PATH is outside the worktree ($WT_ROOT)" >&2
83:   echo "Use a relative path or recompute the absolute path from WT_ROOT." >&2
84: fi
85: ```
86: 
87: **Prefer relative paths** for all Edit/Write operations. When an absolute path is
88: unavoidable, always derive it from `git rev-parse --show-toplevel` run inside the
89: worktree — never from `pwd` captured in the orchestrator context.

(End of file - total 89 lines)
</content>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md</path>
<type>file</type>
<content>
1: # Executor Extended Examples
2: 
3: > Reference file for gsd-executor agent. Loaded on-demand via `@` reference.
4: > For sub-200K context windows, this content is stripped from the agent prompt and available here for on-demand loading.
5: 
6: ## Deviation Rule Examples
7: 
8: ### Rule 1 — Auto-fix bugs
9: 
10: **Examples of Rule 1 triggers:**
11: - Wrong queries returning incorrect data
12: - Logic errors in conditionals
13: - Type errors and type mismatches
14: - Null pointer exceptions / undefined access
15: - Broken validation (accepts invalid input)
16: - Security vulnerabilities (XSS, SQL injection)
17: - Race conditions in async code
18: - Memory leaks from uncleaned resources
19: 
20: ### Rule 2 — Auto-add missing critical functionality
21: 
22: **Examples of Rule 2 triggers:**
23: - Missing error handling (unhandled promise rejections, no try/catch on I/O)
24: - No input validation on user-facing endpoints
25: - Missing null checks before property access
26: - No auth on protected routes
27: - Missing authorization checks (user can access other users' data)
28: - No CSRF/CORS configuration
29: - No rate limiting on public endpoints
30: - Missing DB indexes on frequently queried columns
31: - No error logging (failures silently swallowed)
32: 
33: ### Rule 3 — Auto-fix blocking issues
34: 
35: **Examples of Rule 3 triggers:**
36: - Missing dependency not in package.json
37: - Wrong types preventing compilation
38: - Broken imports (wrong path, wrong export name)
39: - Missing env var required at runtime
40: - DB connection error (wrong URL, missing credentials)
41: - Build config error (wrong entry point, missing loader)
42: - Missing referenced file (import points to non-existent module)
43: - Circular dependency preventing module load
44: 
45: ### Rule 4 — Ask about architectural changes
46: 
47: **Examples of Rule 4 triggers:**
48: - New DB table (not just adding a column)
49: - Major schema changes (renaming tables, changing relationships)
50: - New service layer (adding a queue, cache, or message bus)
51: - Switching libraries/frameworks (e.g., replacing Express with Fastify)
52: - Changing auth approach (switching from session to JWT)
53: - New infrastructure (adding Redis, S3, etc.)
54: - Breaking API changes (removing or renaming endpoints)
55: 
56: ## Edge Case Decision Guide
57: 
58: | Scenario | Rule | Rationale |
59: |----------|------|-----------|
60: | Missing validation on input | Rule 2 | Security requirement |
61: | Crashes on null input | Rule 1 | Bug — incorrect behavior |
62: | Need new database table | Rule 4 | Architectural decision |
63: | Need new column on existing table | Rule 1 or 2 | Depends on context |
64: | Pre-existing linting warnings | Out of scope | Not caused by current task |
65: | Unrelated test failures | Out of scope | Not caused by current task |
66: 
67: **Decision heuristic:** "Does this affect correctness, security, or ability to complete the current task?"
68: - YES → Rules 1-3 (fix automatically)
69: - MAYBE → Rule 4 (ask the user)
70: - NO → Out of scope (log to deferred-items.md)
71: 
72: ## Checkpoint Examples
73: 
74: ### Good checkpoint placement
75: 
76: ```xml
77: <!-- Automate everything, then verify at the end -->
78: <task type="auto">Create database schema</task>
79: <task type="auto">Create API endpoints</task>
80: <task type="auto">Create UI components</task>
81: <task type="checkpoint:human-verify">
82:   <what-built>Complete auth flow (schema + API + UI)</what-built>
83:   <how-to-verify>
84:     1. Visit http://localhost:3000/register
85:     2. Create account with test@example.com
86:     3. Log in with those credentials
87:     4. Verify dashboard loads with user name
88:   </how-to-verify>
89: </task>
90: ```
91: 
92: ### Bad checkpoint placement
93: 
94: ```xml
95: <!-- Too many checkpoints — causes verification fatigue -->
96: <task type="auto">Create schema</task>
97: <task type="checkpoint:human-verify">Check schema</task>
98: <task type="auto">Create API</task>
99: <task type="checkpoint:human-verify">Check API</task>
100: <task type="auto">Create UI</task>
101: <task type="checkpoint:human-verify">Check UI</task>
102: ```
103: 
104: ### Auth gate handling
105: 
106: When an auth error occurs during `type="auto"` execution:
107: 1. Recognize it as an auth gate (not a bug) — indicators: "Not authenticated", "401", "403", "Please run X login"
108: 2. STOP the current task
109: 3. Return a `checkpoint:human-action` with exact auth steps
110: 4. In SUMMARY.md, document auth gates as normal flow, not deviations

(End of file - total 110 lines)
</content>

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_LHwQSpP6yA34mKv64WMZ4909"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-02-PLAN.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-02-PLAN.md</path>
<type>file</type>
<content>
1: ---
2: phase: "12-cp-st-01-remediation"
3: plan: 2
4: type: execute
5: wave: 2
6: depends_on: ["12-CP-ST-01-01"]
7: files_modified:
8:   - src/tools/hivemind/session-tracker.ts
9:   - src/tools/hivemind/session-hierarchy.ts
10:   - src/tools/hivemind/session-context.ts
11:   - src/schema-kernel/session-tracker.schema.ts
12:   - src/plugin.ts
13: autonomous: true
14: requirements:
15:   - REQ-ST-01
16:   - REQ-ST-06
17:   - REQ-ST-07
18:   - REQ-ST-08
19:   - REQ-ST-10
20:   - REQ-ST-12
21: 
22: must_haves:
23:   truths:
24:     - "Agents can export full session .md content via session-tracker with export-session action"
25:     - "Agents can list all sessions (directory-scanning fallback when index is stale)"
26:     - "Agents can search sessions by keyword via session-tracker with search-sessions action"
27:     - "Agents can query child/parent hierarchy via session-hierarchy with get-children and get-parent-chain actions"
28:     - "Agents can find related sessions via session-context with find-related action"
29:     - "All three tools reject path traversal attempts (safeSessionPath + isValidSessionID guards)"
30:     - "Each tool is ≤200 LOC (C4 compliance) and kebab-case"
31:     - "All tool Zod schemas validate session IDs at boundary"
32:   artifacts:
33:     - path: "src/tools/hivemind/session-tracker.ts"
34:       provides: "Export/list/search/status/summary tool (≤200 LOC)"
35:       min_lines: 100
36:       max_lines: 200
37:     - path: "src/tools/hivemind/session-hierarchy.ts"
38:       provides: "Child/parent navigation tool (≤200 LOC, NEW)"
39:       min_lines: 80
40:       max_lines: 200
41:     - path: "src/tools/hivemind/session-context.ts"
42:       provides: "Cross-session synthesis tool (≤200 LOC, NEW)"
43:       min_lines: 80
44:       max_lines: 200
45:     - path: "src/schema-kernel/session-tracker.schema.ts"
46:       provides: "Zod schemas for all three tools with session ID refinement"
47:       contains: "refine"
48:   key_links:
49:     - from: "src/plugin.ts"
50:       to: "src/tools/hivemind/session-tracker.ts"
51:       via: "tool registration"
52:       pattern: "session-tracker.*createSessionTrackerTool"
53:     - from: "src/plugin.ts"
54:       to: "src/tools/hivemind/session-hierarchy.ts"
55:       via: "tool registration"
56:       pattern: "session-hierarchy.*createSessionHierarchyTool"
57:     - from: "src/plugin.ts"
58:       to: "src/tools/hivemind/session-context.ts"
59:       via: "tool registration"
60:       pattern: "session-context.*createSessionContextTool"
61:     - from: "src/tools/hivemind/session-tracker.ts"
62:       to: "src/features/session-tracker/persistence/atomic-write.ts"
63:       via: "safeSessionPath import"
64:       pattern: "safeSessionPath"
65: ---
66: 
67: <objective>
68: Replace the single action-dispatched `session-tracker` tool with three domain-focused tools per CUSTOM-TOOLS-CRITERIA (D-08, D-09): `session-tracker` (export/list/search/status/summary), `session-hierarchy` (child/parent navigation), `session-context` (cross-session synthesis). Fix all 6 tool gaps (GAP-01 through GAP-06) identified in the current tool surface. Each tool ≤200 LOC (C4), kebab-case, with Zod-validated inputs and `safeSessionPath()` guards.
69: 
70: **Purpose:** Give agents queryable access to session knowledge data with proper safety boundaries and focused, composable tool surfaces. Backward-compatible with existing action names.
71: 
72: **Output:** 3 tool files + 1 updated schema file + plugin.ts registration update. All tools discoverable after `npm run build`.
73: </objective>
74: 
75: <execution_context>
76: @.agent/get-shit-done/workflows/execute-plan.md
77: @.agent/get-shit-done/templates/summary.md
78: </execution_context>
79: 
80: <context>
81: @.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md
82: @.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md (sections 2 and 3 — tool redesign analysis)
83: @.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/03-TOOL-GAPS.md
84: @.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md
85: @src/tools/hivemind/session-tracker.ts (current tool — being rewritten)
86: @src/plugin.ts (tool registration patterns)
87: @src/shared/tool-response.ts (response envelope)
88: </context>
89: 
90: <tasks>
91: 
92: <!-- ========================================================================= -->
93: <!-- T-01: Rewrite session-tracker tool with expanded actions + fix all GAPs   -->
94: <!-- ========================================================================= -->
95: <task type="implement" id="T-01">
96:   <name>Task 1: Rewrite session-tracker tool (GAP-01, GAP-02, GAP-03, GAP-05, GAP-06)</name>
97:   <depends_on></depends_on>
98:   <files>
99:     - src/tools/hivemind/session-tracker.ts
100:     - src/schema-kernel/session-tracker.schema.ts
101:   </files>
102:   <read_first>
103:     - src/tools/hivemind/session-tracker.ts (reason: current tool — being rewritten entirely)
104:     - src/schema-kernel/session-tracker.schema.ts (reason: current schema — being rewritten)
105:     - src/shared/tool-response.ts (reason: success() / error() signature)
106:     - src/shared/tool-helpers.ts (reason: renderToolResult signature)
107:     - src/features/session-tracker/persistence/atomic-write.ts (reason: sessionTrackerRoot, safeSessionPath)
108:     - src/features/session-tracker/types.ts (reason: isValidSessionID)
109:     - src/tools/hivemind/hivemind-doc.ts (reason: reference template for ≤200 LOC tool with Zod)
110:     - src/plugin.ts line 183 (reason: current registration to update)
111:   </read_first>
112:   <action>
113:     Rewrite `src/tools/hivemind/session-tracker.ts` from scratch. Delete all content and write:
114: 
115:     **New tool structure:**
116:     ```typescript
117:     import { tool } from "@opencode-ai/plugin/tool"
118:     import { readFile, readdir, stat, access } from "node:fs/promises"
119:     import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
120:     import { isValidSessionID } from "../../features/session-tracker/types.js"
121:     import { success, error } from "../../shared/tool-response.js"
122:     import { renderToolResult } from "../../shared/tool-helpers.js"
123:     ```
124: 
125:     **5 actions:**
126:     1. `export-session` — Same as current, but with `safeSessionPath()` + `isValidSessionID()` before path construction (fixes GAP-01). Returns full .md content. Uses async `readFile`. Requires `sessionId`.
127:     2. `list-sessions` — Directory-scanning fallback when `project-continuity.json` index is stale (fixes GAP-06). Falls back to `readdir(trackerRoot)` scanning directories starting with `ses_`. Returns session IDs, statuses from individual `session-continuity.json` files.
128:     3. `search-sessions` — Same as current, but with `safeSessionPath()` + `isValidSessionID()` per-directory (fixes GAP-03). Replace `existsSync` with `access().then(() => true).catch(() => false)` (fixes GAP-02). Replace `statSync` with `stat()`.
129:     4. `get-status` — NEW. Reads `session-continuity.json` for a specific session, returns `status`, `lastUpdated`, `turnCount`, `childCount`, `toolSummary`.
130:     5. `get-summary` — NEW. Returns frontmatter only from .md file (using gray-matter), skipping full body. Efficient for agents that need metadata without 200KB+ of content.
131: 
132:     **Zod schema (rewrite `src/schema-kernel/session-tracker.schema.ts`):**
133:     ```typescript
134:     import { z } from "zod"
135: 
136:     const safeSessionId = z.string().min(1).refine(
137:       (id) => !id.includes("/") && !id.includes("..") && !id.includes("\\"),
138:       { message: "sessionId must not contain path separators or traversal sequences" }
139:     )
140: 
141:     export const SessionTrackerInputSchema = z.discriminatedUnion("action", [
142:       z.object({ action: z.literal("export-session"), sessionId: safeSessionId, format: z.enum(["markdown", "json"]).optional().default("markdown") }),
143:       z.object({ action: z.literal("get-status"), sessionId: safeSessionId }),
144:       z.object({ action: z.literal("get-summary"), sessionId: safeSessionId }),
145:       z.object({ action: z.literal("list-sessions"), limit: z.number().min(1).max(100).optional().default(20) }),
146:       z.object({ action: z.literal("search-sessions"), query: z.string().min(1), limit: z.number().min(1).max(100).optional().default(20) }),
147:     ])
148:     ```
149: 
150:     **Critical path safety rule (enforced in ALL handlers):**
151:     ```typescript
152:     if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
153:     const safeDir = safeSessionPath(projectRoot, sessionId, "")
154:     const safeFilePath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
155:     ```
156:     NEVER use `resolve(trackerRoot, sessionId, ...)` directly. Always through `safeSessionPath()`.
157:   </action>
158:   <acceptance_criteria>
159:     - `grep "safeSessionPath" src/tools/hivemind/session-tracker.ts` returns at least 4 matches (all 5 handlers that use paths)
160:     - `grep "isValidSessionID" src/tools/hivemind/session-tracker.ts` returns at least 4 matches (export-session, get-status, get-summary, search-sessions handlers)
161:     - `grep "statSync\|existsSync" src/tools/hivemind/session-tracker.ts` returns ZERO matches (all async — GAP-02 fixed)
162:     - `grep "resolve.*trackerRoot.*sessionId" src/tools/hivemind/session-tracker.ts` returns ZERO matches (no raw resolve — GAP-01 fixed)
163:     - `grep "get-status\|get-summary" src/tools/hivemind/session-tracker.ts` returns matches (new actions)
164:     - `grep "refine\|includes.*\\\"/\\\"\|includes.*\\\"..\\\"" src/schema-kernel/session-tracker.schema.ts` returns match (Zod refinement)
165:     - `wc -l src/tools/hivemind/session-tracker.ts` is ≤ 200 LOC
166:     - `npx vitest run tests/tools/hivemind/session-tracker.test.ts` passes
167:     - `npm run typecheck` passes
168:     - `npm run build` succeeds
169:   </acceptance_criteria>
170:   <autonomous>true</autonomous>
171: </task>
172: 
173: <!-- ========================================================================= -->
174: <!-- T-02: Create session-hierarchy tool (NEW)                                 -->
175: <!-- ========================================================================= -->
176: <task type="implement" id="T-02">
177:   <name>Task 2: Create session-hierarchy tool (NEW — child/parent navigation)</name>
178:   <depends_on></depends_on>
179:   <files>
180:     - src/tools/hivemind/session-hierarchy.ts
181:     - src/schema-kernel/session-tracker.schema.ts
182:   </files>
183:   <read_first>
184:     - src/tools/hivemind/session-tracker.ts (reason: existing tool patterns for structure reference)
185:     - src/tools/hivemind/hivemind-doc.ts (reason: reference template for new tool factory pattern)
186:     - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath, sessionTrackerRoot)
187:     - src/features/session-tracker/types.ts (reason: isValidSessionID, SessionContinuityIndex type)
188:     - src/shared/tool-response.ts (reason: success/error signatures)
189:     - src/shared/tool-helpers.ts (reason: renderToolResult)
190:     - src/plugin.ts (reason: where to add registration)
191:   </read_first>
192:   <action>
193:     Create NEW file `src/tools/hivemind/session-hierarchy.ts` (≤160 LOC):
194: 
195:     **3 actions:**
196:     1. `get-children` — Reads parent session's `session-continuity.json`, returns `hierarchy.children` with each child's status, depth, delegatedBy, and childFile. Requires `sessionId`.
197:     2. `get-parent-chain` — Walks `parent_session_id` field from each session's `session-continuity.json` up to root. Returns ordered array [{sessionId, status, depth}, ...].
198:     3. `get-delegation-depth` — Returns the max delegation depth under the given session (recursive walk of children's children). Returns single number.
199: 
200:     **Structure (follow existing tool pattern):**
201:     ```typescript
202:     import { tool } from "@opencode-ai/plugin/tool"
203:     import { readFile } from "node:fs/promises"
204:     import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
205:     import { isValidSessionID } from "../../features/session-tracker/types.js"
206:     import { success, error } from "../../shared/tool-response.js"
207:     import { renderToolResult } from "../../shared/tool-helpers.js"
208: 
209:     export function createSessionHierarchyTool(projectRoot: string) {
210:       const s = tool.schema
211:       return tool({
212:         description: "Navigate session delegation hierarchy...",
213:         args: {
214:           action: s.enum(["get-children", "get-parent-chain", "get-delegation-depth"]),
215:           sessionId: s.string(),
216:           includeStatus: s.boolean().optional().default(true),
217:         },
218:         async execute(rawArgs) { ... }
219:       })
220:     }
221:     ```
222: 
223:     **Zod schema:** Extend `session-tracker.schema.ts` to add:
224:     ```typescript
225:     export const SessionHierarchyInputSchema = z.discriminatedUnion("action", [
226:       z.object({ action: z.literal("get-children"), sessionId: safeSessionId, includeStatus: z.boolean().optional().default(true) }),
227:       z.object({ action: z.literal("get-parent-chain"), sessionId: safeSessionId }),
228:       z.object({ action: z.literal("get-delegation-depth"), sessionId: safeSessionId }),
229:     ])
230:     ```
231: 
232:     **Data sources:**
233:     - `get-children`: reads `.hivemind/session-tracker/{sessionId}/session-continuity.json` → `hierarchy.children`
234:     - `get-parent-chain`: reads `session-continuity.json` → `parentSessionID` field, then loops up
235:     - `get-delegation-depth`: recursive walk of `hierarchy.children`, returns `Math.max(0, ...children.map(c => 1 + getDepth(c)))`
236: 
237:     **Path safety:**
238:     ```typescript
239:     if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID`))
240:     const indexPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
241:     ```
242:   </action>
243:   <acceptance_criteria>
244:     - `grep "get-children" src/tools/hivemind/session-hierarchy.ts` returns match
245:     - `grep "get-parent-chain" src/tools/hivemind/session-hierarchy.ts` returns match
246:     - `grep "get-delegation-depth" src/tools/hivemind/session-hierarchy.ts` returns match
247:     - `grep "safeSessionPath" src/tools/hivemind/session-hierarchy.ts` returns at least 1 match
248:     - `grep "isValidSessionID" src/tools/hivemind/session-hierarchy.ts` returns at least 1 match
249:     - `wc -l src/tools/hivemind/session-hierarchy.ts` is ≤ 160 LOC
250:     - `npx vitest run tests/tools/hivemind/session-hierarchy.test.ts` passes (test file must exist — create in Wave 2 task)
251:     - `npm run typecheck` passes
252:     - `npm run build` succeeds
253:   </acceptance_criteria>
254:   <autonomous>true</autonomous>
255: </task>
256: 
257: <!-- ========================================================================= -->
258: <!-- T-03: Create session-context tool (NEW)                                   -->
259: <!-- ========================================================================= -->
260: <task type="implement" id="T-03">
261:   <name>Task 3: Create session-context tool (NEW — cross-session synthesis)</name>
262:   <depends_on></depends_on>
263:   <files>
264:     - src/tools/hivemind/session-context.ts
265:     - src/schema-kernel/session-tracker.schema.ts
266:   </files>
267:   <read_first>
268:     - src/tools/hivemind/session-tracker.ts (reason: existing tool patterns for structure reference)
269:     - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath, sessionTrackerRoot)
270:     - src/features/session-tracker/types.ts (reason: isValidSessionID, ProjectContinuityIndex type)
271:     - src/shared/tool-response.ts (reason: success/error signatures)
272:     - src/shared/tool-helpers.ts (reason: renderToolResult)
273:     - src/tools/hivemind/hivemind-doc.ts (reason: reference for ≤200 LOC tool)
274:   </read_first>
275:   <action>
276:     Create NEW file `src/tools/hivemind/session-context.ts` (≤180 LOC):
277: 
278:     **3 actions:**
279:     1. `find-related` — Scans `project-continuity.json` for sessions sharing: same agent types used, similar tool usage patterns (from `toolSummary`), or time proximity (±30 min `created` window). Returns ranked list with relevance scores. Requires `sessionId`.
280:     2. `cross-reference` — Searches ALL child `.json` files across the project for a specific tool name or agent name. Returns matching child sessions with context. Requires `sessionId` (as reference point) + optional `query` (tool name or agent name).
281:     3. `synthesize-context` — Produces a compact markdown summary of a session: frontmatter + child session tree + tool usage summary + turn count + status. Designed for agent re-consumption after context compaction.
282: 
283:     **Structure:**
284:     ```typescript
285:     import { tool } from "@opencode-ai/plugin/tool"
286:     import { readFile, readdir } from "node:fs/promises"
287:     import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
288:     import { isValidSessionID } from "../../features/session-tracker/types.js"
289:     import { success, error } from "../../shared/tool-response.js"
290:     import { renderToolResult } from "../../shared/tool-helpers.js"
291:     ```
292: 
293:     **Zod schema (extend session-tracker.schema.ts):**
294:     ```typescript
295:     export const SessionContextInputSchema = z.discriminatedUnion("action", [
296:       z.object({ action: z.literal("find-related"), sessionId: safeSessionId, maxRelated: z.number().min(1).max(50).optional().default(10) }),
297:       z.object({ action: z.literal("cross-reference"), sessionId: safeSessionId, query: z.string().min(1).optional() }),
298:       z.object({ action: z.literal("synthesize-context"), sessionId: safeSessionId }),
299:     ])
300:     ```
301: 
302:     **Data sources:**
303:     - `find-related`: reads `project-continuity.json` → iterates `sessions` → checks `toolSummary` overlap
304:     - `cross-reference`: walks `readdir(trackerRoot)` → finds child `.json` files → searches for query in tool names or agent names
305:     - `synthesize-context`: reads `.md` frontmatter (via gray-matter) + `session-continuity.json` + child `.json` statuses → produces markdown
306: 
307:     **Path safety:** Same pattern as T-01 and T-02 — `isValidSessionID()` + `safeSessionPath()` before every path operation.
308:   </action>
309:   <acceptance_criteria>
310:     - `grep "find-related" src/tools/hivemind/session-context.ts` returns match
311:     - `grep "cross-reference" src/tools/hivemind/session-context.ts` returns match
312:     - `grep "synthesize-context" src/tools/hivemind/session-context.ts` returns match
313:     - `grep "safeSessionPath" src/tools/hivemind/session-context.ts` returns at least 1 match
314:     - `grep "isValidSessionID" src/tools/hivemind/session-context.ts` returns at least 1 match
315:     - `wc -l src/tools/hivemind/session-context.ts` is ≤ 180 LOC
316:     - `npx vitest run tests/tools/hivemind/session-context.test.ts` passes (test file must exist — create in Wave 2 task)
317:     - `npm run typecheck` passes
318:     - `npm run build` succeeds
319:   </acceptance_criteria>
320:   <autonomous>true</autonomous>
321: </task>
322: 
323: <!-- ========================================================================= -->
324: <!-- T-04: Wire tools in plugin.ts + verify discovery                         -->
325: <!-- ========================================================================= -->
326: <task type="implement" id="T-04">
327:   <name>Task 4: Register all 3 tools in plugin.ts and verify discovery</name>
328:   <depends_on>T-01, T-02, T-03</depends_on>
329:   <files>src/plugin.ts</files>
330:   <read_first>
331:     - src/plugin.ts (reason: current tool registration at line 183, imports at line 38)
332:     - src/tools/hivemind/session-tracker.ts (reason: verify createSessionTrackerTool export)
333:     - src/tools/hivemind/session-hierarchy.ts (reason: verify createSessionHierarchyTool export)
334:     - src/tools/hivemind/session-context.ts (reason: verify createSessionContextTool export)
335:   </read_first>
336:   <action>
337:     In `src/plugin.ts`:
338: 
339:     **Step 1 — Add imports** (near line 38, after existing session-tracker import):
340:     ```typescript
341:     import { createSessionTrackerTool } from "./tools/hivemind/session-tracker.js"
342:     import { createSessionHierarchyTool } from "./tools/hivemind/session-hierarchy.js"   // NEW
343:     import { createSessionContextTool } from "./tools/hivemind/session-context.js"        // NEW
344:     ```
345: 
346:     **Step 2 — Update tool registrations** (near line 183):
347:     Replace the single registration:
348:     ```typescript
349:     // Before:
350:     "session-tracker": createSessionTrackerTool(projectDirectory),
351: 
352:     // After:
353:     "session-tracker": createSessionTrackerTool(projectDirectory),
354:     "session-hierarchy": createSessionHierarchyTool(projectDirectory),    // NEW
355:     "session-context": createSessionContextTool(projectDirectory),         // NEW
356:     ```
357: 
358:     **Step 3 — Verify:**
359:     ```bash
360:     npm run build && npm run typecheck
361:     ```
362: 
363:     Ensure all three tools are registered in the `tools` object under `createTools()`.
364:     Remove any references to the OLD single-action dispatched tool if they still exist (the tool is being rewritten, not deleted).
365: 
366:     **Note:** Keep the existing `session-tracker` key — the tool is being rewritten (not removed). The new `session-hierarchy` and `session-context` are net-new registrations.
367:   </action>
368:   <acceptance_criteria>
369:     - `grep "session-hierarchy" src/plugin.ts` returns match (import + registration)
370:     - `grep "session-context" src/plugin.ts` returns match (import + registration)
371:     - `grep "createSessionHierarchyTool" src/plugin.ts` returns match
372:     - `grep "createSessionContextTool" src/plugin.ts` returns match
373:     - `npm run typecheck` passes
374:     - `npm run build` succeeds
375:   </acceptance_criteria>
376:   <autonomous>true</autonomous>
377: </task>
378: 
379: </tasks>
380: 
381: <threat_model>
382: ## Trust Boundaries
383: 
384: | Boundary | Description |
385: |----------|-------------|
386: | Agent input → tool Zod schema | Untrusted session IDs enter tool boundary — validated by Zod refinement |
387: | Zod-validated sessionId → filesystem path | safeSessionPath() is the only path constructor — no raw resolve() |
388: | Tool output → agent context | Session data returned to agents — no mutation authority, read-only |
389: 
390: ## STRIDE Threat Register
391: 
392: | Threat ID | Category | Component | Disposition | Mitigation Plan |
393: |-----------|----------|-----------|-------------|-----------------|
394: | T-12-07 | Tampering | session-tracker.ts handleExportSession (GAP-01, CR-02) | mitigate | Zod schema validates sessionId with `.refine()` rejecting "/", "..", "\\". Handler applies safeSessionPath() before ANY path construction. Never uses raw resolve(trackerRoot, sessionId, ...). |
395: | T-12-08 | Tampering | session-hierarchy.ts all handlers | mitigate | Same pattern: isValidSessionID() + safeSessionPath() before every readFile call. Zod refinement at boundary. |
396: | T-12-09 | Tampering | session-context.ts all handlers | mitigate | Same pattern: isValidSessionID() + safeSessionPath(). Directory scanning uses readdir() on safeSessionRoot, individual paths through safeSessionPath(). |
397: | T-12-10 | Information Disclosure | session-tracker.ts export-session | accept | Returns session .md content to requesting agent — by design (tool is read-only query). Content is session knowledge, not system secrets. Accept as intended exposure. |
398: | T-12-11 | Denial of Service | session-tracker.ts search-sessions (statSync) | mitigate | Replace blocking statSync/existsSync with async node:fs/promises equivalents to prevent event loop blockage. |
399: </threat_model>
400: 
401: <verification>
402: Wave 2 completion gate:
403: 1. `npm run typecheck` — passes (zero errors)
404: 2. `npm run build` — succeeds (all 3 tools compiled into dist/)
405: 3. `grep -r "resolve.*trackerRoot.*sessionId" src/tools/hivemind/` returns ZERO matches (path traversal eliminated)
406: 4. `grep -r "statSync\|existsSync" src/tools/hivemind/` returns ZERO matches (all async I/O)
407: 5. `wc -l src/tools/hivemind/session-tracker.ts` ≤ 200 LOC
408: 6. `wc -l src/tools/hivemind/session-hierarchy.ts` ≤ 160 LOC
409: 7. `wc -l src/tools/hivemind/session-context.ts` ≤ 180 LOC
410: 8. All 3 tools registered in plugin.ts tools object
411: 9. Zod schemas have .refine() on sessionId for path safety
412: 10. Backward-compatible: existing `action: "export-session"`, `"list-sessions"`, `"search-sessions"` still work
413: </verification>
414: 
415: <success_criteria>
416: 1. GAP-01 (CR-02): Path traversal fixed — all path construction uses safeSessionPath() + Zod refinement
417: 2. GAP-02: No blocking I/O — all file ops use async node:fs/promises
418: 3. GAP-03: Session ID validation at tool boundary — Zod schema refines before handler logic
419: 4. GAP-04: Missing query actions added — get-status, get-summary, get-children, get-parent-chain, get-delegation-depth, find-related, cross-reference, synthesize-context
420: 5. GAP-05: Schema-level validation — Zod refinement on ALL sessionId inputs
421: 6. GAP-06: Stale index fallback — list-sessions scans directories when index is stale
422: 7. All 3 tools ≤200 LOC (C4 compliance)
423: 8. All 3 tools discoverable after build (C7 compliance)
424: 9. Backward-compatible with existing tool action names
425: </success_criteria>
426: 
427: <output>
428: After completion, create `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-02-SUMMARY.md`
429: </output>

(End of file - total 429 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-01-SUMMARY.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-01-SUMMARY.md</path>
<type>file</type>
<content>
1: ---
2: phase: "12-cp-st-01-remediation"
3: plan: 1
4: subsystem: session-tracker
5: tags: [session-tracker, writer-engine, defect-fix, queue-recovery, path-safety, compaction]
6: 
7: # Dependency graph
8: requires:
9:   - phase: 11-governance-reconciliation
10:     provides: "Truth matrix, requirement traceability, sector AGENTS.md"
11: provides:
12:   - "Unblocked project index serial queue with stale detection (DEFECT-02)"
13:   - "Fixed childCount corruption — no undefined spread (DEFECT-01)"
14:   - "Fixed handleRead content capture — metadata-based error detection (DEFECT-04, CR-03)"
15:   - "Wired toolSummary updates in all 4 tool handlers (DEFECT-07)"
16:   - "Fixed turnCount confusion — child additions don't increment turns (DEFECT-05)"
17:   - "Fixed frontmatter double-read race with direct atomic write (DEFECT-06)"
18:   - "Replaced dynamic import with static import (DEFECT-10)"
19:   - "Routed child session lifecycle events through childWriter (DEFECT-08, DEFECT-09)"
20:   - "Added delegation_spawn turn on child creation (DEFECT-03)"
21:   - "Fixed thinkingDuration honesty — returns undefined (DEFECT-11)"
22:   - "Added turn counter seeding from existing .md files (DEFECT-13)"
23:   - "Loosened session ID validation to path-traversal-only check (DEFECT-14)"
24:   - "Wired cleanup() call after initialize() in plugin.ts (DEFECT-12)"
25:   - "Applied path safety to session-recovery.ts (CR-01)"
26:   - "Implemented compaction capture writing ## COMPACTED blocks (D-10)"
27: affects: [wave-2-tool-redesign, wave-3-integration-verification]
28: 
29: # Tech tracking
30: tech-stack:
31:   added: []
32:   patterns:
33:     - "Stale queue detection with auto-reset (5-min threshold)"
34:     - "Metadata-based error detection (never inspect file content)"
35:     - "Direct atomic write pattern for frontmatter updates (no re-read)"
36:     - "Child session routing: parentID check → childWriter.updateChildStatus"
37:     - "Path-safety-first validation with safeSessionPath+isValidSessionID"
38: 
39: key-files:
40:   created:
41:     - tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts
42:   modified:
43:     - src/features/session-tracker/persistence/project-index-writer.ts
44:     - src/features/session-tracker/capture/tool-capture.ts
45:     - src/features/session-tracker/persistence/session-index-writer.ts
46:     - src/features/session-tracker/persistence/session-writer.ts
47:     - src/features/session-tracker/index.ts
48:     - src/features/session-tracker/capture/event-capture.ts
49:     - src/features/session-tracker/transform/agent-transform.ts
50:     - src/features/session-tracker/capture/message-capture.ts
51:     - src/features/session-tracker/types.ts
52:     - src/features/session-tracker/recovery/session-recovery.ts
53:     - src/plugin.ts
54:     - tests/features/session-tracker/capture/event-capture.test.ts
55:     - tests/features/session-tracker/capture/tool-capture.test.ts
56:     - tests/features/session-tracker/types.test.ts
57:     - tests/features/session-tracker/transform/agent-transform.test.ts
58:     - tests/features/session-tracker/integration/e2e-verification.test.ts
59: 
60: key-decisions:
61:   - "Stale queue recovery uses 5-minute threshold with warn+reset — non-destructive, preserves in-flight writes"
62:   - "handleRead error detection uses output.metadata (structured), not output string heuristics"
63:   - "updateFrontmatter now uses direct writeFile+rename to eliminate TOCTOU race"
64:   - "Child lifecycle events route through childWriter.updateChildStatus for .json updates"
65:   - "isValidSessionID rejects only path traversal characters — path safety delegated to safeSessionPath"
66: 
67: requirements-completed:
68:   - REQ-ST-01
69:   - REQ-ST-02
70:   - REQ-ST-04
71:   - REQ-ST-05
72:   - REQ-ST-06
73:   - REQ-ST-07
74:   - REQ-ST-08
75:   - REQ-ST-09
76:   - REQ-ST-10
77:   - REQ-ST-11
78:   - REQ-ST-12
79:   - REQ-ST-13
80: 
81: # Metrics
82: duration: 27min
83: completed: 2026-05-11
84: ---
85: 
86: # Phase 12 Plan 01: CP-ST-01 Remediation — Writer Engine Defect Fixes Summary
87: 
88: **14 source defects fixed across the session tracker capture pipeline and persistence layer, restoring the writer engine to functional state for Wave 2 tool redesign.**
89: 
90: ## Performance
91: 
92: - **Duration:** ~27 min
93: - **Started:** 2026-05-11T18:44:08Z
94: - **Completed:** 2026-05-11T19:11:12Z
95: - **Tasks:** 6
96: - **Files modified:** 16 (11 source + 5 test)
97: - **Files created:** 1 (recovery test)
98: - **Regression tests:** 192 passed / 18 test files
99: 
100: ## Accomplishments
101: - Unblocked frozen project index serial queue with stale detection and auto-recovery (DEFECT-02)
102: - Fixed 6 data integrity bugs: childCount corruption, handleRead content capture, toolSummary, turnCount, frontmatter race, dynamic import
103: - Routed child session lifecycle events (idle/deleted/error) through dedicated childWriter handlers (DEFECT-08, DEFECT-09)
104: - Added delegation_spawn turns on child creation and compaction capture blocks
105: - Applied path safety validation to session-recovery.ts and loosened session ID validation
106: - Wired cleanup() call after initialize() in plugin.ts
107: 
108: ## Task Commits
109: 
110: Each task was committed atomically:
111: 
112: 1. **Task 1: Unblock frozen project index serial queue (DEFECT-02)** - `fc381cbb` (fix)
113: 2. **Task 2: Fix childCount, handleRead, toolSummary (DEFECT-01/04/07, CR-03)** - `6802681f` (fix)
114: 3. **Task 3: Fix turnCount, frontmatter race, dynamic import (DEFECT-05/06/10)** - `78d35891` (fix)
115: 4. **Task 4: Route child session lifecycle events (DEFECT-09/08/03)** - `a7d6d7fc` (fix)
116: 5. **Task 5: Fix thinking duration, turn seeding, session ID validation (DEFECT-11/13/14)** - `60d91023` (fix)
117: 6. **Task 6: Wire cleanup(), fix recovery path traversal, compaction capture (DEFECT-12, CR-01, D-10)** - `2b282968` (fix)
118: 
119: ## Files Created/Modified
120: - `src/features/session-tracker/persistence/project-index-writer.ts` — Stale queue detection, lastWriteTime, getQueueHealth
121: - `src/features/session-tracker/capture/tool-capture.ts` — childCount fix, metadata-based handleRead, toolSummary wiring, delegation_spawn turn
122: - `src/features/session-tracker/persistence/session-index-writer.ts` — Removed turnCount++ from addChild
123: - `src/features/session-tracker/persistence/session-writer.ts` — Direct atomic write in updateFrontmatter, static imports, appendCompactionBlock
124: - `src/features/session-tracker/index.ts` — ensureSessionReady in handleSessionEvent, inject childWriter/sessionIndexWriter into EventCapture
125: - `src/features/session-tracker/capture/event-capture.ts` — ChildWriter+SessionIndexWriter deps, child routing in idle/deleted/error, compaction handler
126: - `src/features/session-tracker/transform/agent-transform.ts` — computeThinkingDuration returns undefined
127: - `src/features/session-tracker/capture/message-capture.ts` — seedTurnCounters method, projectRoot field
128: - `src/features/session-tracker/types.ts` — Path-traversal-only isValidSessionID
129: - `src/features/session-tracker/recovery/session-recovery.ts` — safeSessionPath+isValidSessionID in readSessionFile
130: - `src/plugin.ts` — Chained cleanup() after initialize()
131: - `tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts` — New recovery tests
132: 
133: ## Decisions Made
134: - Stale queue recovery uses 5-minute threshold with warn+reset — non-destructive
135: - handleRead error detection uses output.metadata (structured), not output string heuristics
136: - updateFrontmatter now uses direct writeFile+rename pattern to eliminate TOCTOU race
137: - Child lifecycle events route through childWriter.updateChildStatus for .json updates
138: - isValidSessionID rejects only path traversal characters — path safety delegated to safeSessionPath
139: 
140: ## Deviations from Plan
141: 
142: None — plan executed exactly as written. All test updates were required by the changed API contracts and are documented per task.
143: 
144: ## Issues Encountered
145: - Test updates needed for: handleRead metadata changes, isValidSessionID loosening, computeThinkingDuration honesty, EventCapture constructor signature changes — all updated within task scope
146: - 3 existing test files modified to match new API contracts (types, transform, e2e)
147: 
148: ## Next Phase Readiness
149: - Writer engine restored to functional state — ready for Wave 2 tool redesign and Wave 3 integration verification
150: - All 192 regression tests pass as baseline
151: - Queue health monitoring available via getQueueHealth()
152: 
153: ---
154: *Phase: 12-cp-st-01-remediation*
155: *Completed: 2026-05-11*

(End of file - total 155 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/session-tracker.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/session-tracker.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-tracker tool — read-only query/export tool for session knowledge files.
3:  *
4:  * Provides agents with query access to persisted session tracker data under
5:  * `.hivemind/session-tracker/`. Designed for extensibility (D-02) with
6:  * action-based routing.
7:  *
8:  * Actions:
9:  * - `export-session` — returns the full content of a session's .md capture file
10:  * - `list-sessions` — returns all known sessions from project-continuity.json
11:  * - `search-sessions` — scans session files for a query string
12:  *
13:  * All operations are read-only (CQRS read-side). No mutation authority.
14:  *
15:  * @module tools/hivemind/session-tracker
16:  */
17: 
18: import { tool } from "@opencode-ai/plugin/tool"
19: import { readFile, readdir } from "node:fs/promises"
20: import { resolve } from "node:path"
21: import { statSync, existsSync } from "node:fs"
22: 
23: import {
24:   SessionTrackerInputSchema,
25:   type SessionTrackerInput,
26: } from "../../schema-kernel/session-tracker.schema.js"
27: import { sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
28: import { renderToolResult } from "../../shared/tool-helpers.js"
29: import { success, error } from "../../shared/tool-response.js"
30: 
31: // ---------------------------------------------------------------------------
32: // Constants
33: // ---------------------------------------------------------------------------
34: 
35: const MAX_SEARCH_CHUNK_BYTES = 50000 // Per-file read limit for search
36: 
37: // ---------------------------------------------------------------------------
38: // Tool factory
39: // ---------------------------------------------------------------------------
40: 
41: type ToolContext = { sessionID?: string }
42: 
43: /**
44:  * Creates the session-tracker tool instance.
45:  *
46:  * @param projectRoot - Absolute path to the project root.
47:  * @returns An OpenCode tool definition for session query/export operations.
48:  *
49:  * @example
50:  * ```typescript
51:  * const sessionTrackerTool = createSessionTrackerTool(process.cwd())
52:  * ```
53:  */
54: export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
55:   const s = tool.schema
56: 
57:   return tool({
58:     description:
59:       "Query and export session tracker data. Actions: export-session (get full session capture), list-sessions (list all sessions), search-sessions (search session content).",
60:     args: {
61:       action: s.string().describe("Action: export-session, list-sessions, or search-sessions"),
62:       sessionId: s.string().optional().describe("Session ID (required for export-session)"),
63:       query: s.string().optional().describe("Search query (required for search-sessions)"),
64:       limit: s.number().optional().describe("Maximum results (default 20, max 100)"),
65:     },
66:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
67:       try {
68:         const input = SessionTrackerInputSchema.parse(rawArgs) as SessionTrackerInput
69: 
70:         switch (input.action) {
71:           case "export-session":
72:             return await handleExportSession(projectRoot, input)
73:           case "list-sessions":
74:             return await handleListSessions(projectRoot, input)
75:           case "search-sessions":
76:             return await handleSearchSessions(projectRoot, input)
77:           default:
78:             return renderToolResult(error(`Unknown action: ${(input as { action: string }).action}`))
79:         }
80:       } catch (caughtError) {
81:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
82:         return renderToolResult(error(message))
83:       }
84:     },
85:   })
86: }
87: 
88: // ---------------------------------------------------------------------------
89: // Action handlers
90: // ---------------------------------------------------------------------------
91: 
92: /**
93:  * Exports the full content of a session's .md capture file.
94:  *
95:  * @param projectRoot - Absolute project root path.
96:  * @param input - Tool input (must include sessionId).
97:  * @returns Rendered tool response with file content.
98:  */
99: async function handleExportSession(
100:   projectRoot: string,
101:   input: SessionTrackerInput,
102: ): Promise<string> {
103:   if (!input.sessionId) {
104:     return renderToolResult(error("sessionId is required for export-session action"))
105:   }
106: 
107:   const trackerRoot = sessionTrackerRoot(projectRoot)
108:   const filePath = resolve(trackerRoot, input.sessionId, `${input.sessionId}.md`)
109: 
110:   try {
111:     const content = await readFile(filePath, "utf-8")
112:     return renderToolResult(
113:       success(`Session export: ${input.sessionId}`, {
114:         sessionId: input.sessionId,
115:         content,
116:         filePath,
117:       }),
118:     )
119:   } catch {
120:     return renderToolResult(error(`Session not found: ${input.sessionId}`))
121:   }
122: }
123: 
124: /**
125:  * Lists all known sessions from the project-continuity.json index.
126:  *
127:  * @param projectRoot - Absolute project root path.
128:  * @param input - Tool input (limit controls max results).
129:  * @returns Rendered tool response with session list.
130:  */
131: async function handleListSessions(
132:   projectRoot: string,
133:   input: SessionTrackerInput,
134: ): Promise<string> {
135:   const trackerRoot = sessionTrackerRoot(projectRoot)
136:   const indexPath = resolve(trackerRoot, "project-continuity.json")
137: 
138:   try {
139:     const raw = await readFile(indexPath, "utf-8")
140:     const index = JSON.parse(raw) as {
141:       sessions?: Record<string, unknown>
142:       chronologicalOrder?: string[]
143:     }
144: 
145:     const allSessions = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
146:     const limit = input.limit ?? 20
147:     const sessions = allSessions.slice(0, limit)
148: 
149:     const sessionDetails: Array<{ sessionId: string; metadata?: unknown }> = []
150:     for (const sessionId of sessions) {
151:       sessionDetails.push({
152:         sessionId,
153:         metadata: index.sessions?.[sessionId] ?? null,
154:       })
155:     }
156: 
157:     return renderToolResult(
158:       success(`Found ${sessions.length} sessions`, {
159:         total: allSessions.length,
160:         sessions: sessionDetails,
161:         hasMore: allSessions.length > limit,
162:         indexLastUpdated: (index as { lastUpdated?: string }).lastUpdated ?? null,
163:       }),
164:     )
165:   } catch {
166:     return renderToolResult(error("No session index found. Session tracking may not be running."))
167:   }
168: }
169: 
170: /**
171:  * Searches session .md files for a query string.
172:  *
173:  * @param projectRoot - Absolute project root path.
174:  * @param input - Tool input (must include query string).
175:  * @returns Rendered tool response with matching sessions.
176:  */
177: async function handleSearchSessions(
178:   projectRoot: string,
179:   input: SessionTrackerInput,
180: ): Promise<string> {
181:   if (!input.query || input.query.trim().length === 0) {
182:     return renderToolResult(error("query is required for search-sessions action"))
183:   }
184: 
185:   const trackerRoot = sessionTrackerRoot(projectRoot)
186:   const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []
187: 
188:   try {
189:     const entries = await readdir(trackerRoot, { withFileTypes: true })
190: 
191:     for (const entry of entries) {
192:       if (!entry.isDirectory()) continue
193:       if (!entry.name.startsWith("ses_")) continue
194: 
195:       const sessionId = entry.name
196:       const mdPath = resolve(trackerRoot, sessionId, `${sessionId}.md`)
197: 
198:       if (!existsSync(mdPath)) continue
199: 
200:       try {
201:         const fileStat = statSync(mdPath)
202:         if (fileStat.size > MAX_SEARCH_CHUNK_BYTES) continue
203: 
204:         const content = await readFile(mdPath, "utf-8")
205:         const lines = content.split("\n")
206:         const queryLower = input.query.toLowerCase()
207: 
208:         for (let i = 0; i < lines.length; i++) {
209:           if (lines[i].toLowerCase().includes(queryLower)) {
210:             // Get surrounding context (2 lines before, 2 after)
211:             const start = Math.max(0, i - 2)
212:             const end = Math.min(lines.length, i + 3)
213:             const snippet = lines.slice(start, end).join("\n").trim()
214: 
215:             matches.push({
216:               sessionId,
217:               file: `${sessionId}/${sessionId}.md`,
218:               snippet,
219:               matchLine: i + 1,
220:             })
221:             break // One match per session
222:           }
223:         }
224:       } catch {
225:         // Skip unreadable files
226:       }
227:     }
228:   } catch {
229:     return renderToolResult(error("Unable to scan session directory."))
230:   }
231: 
232:   const limit = input.limit ?? 20
233:   const paginated = matches.slice(0, limit)
234: 
235:   return renderToolResult(
236:     success(`Found ${matches.length} matches across sessions`, {
237:       totalMatches: matches.length,
238:       sessions: paginated,
239:       hasMore: matches.length > limit,
240:     }),
241:   )
242: }

(End of file - total 242 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/hivemind/AGENTS.md
# Hivemind Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/hivemind/` owns runtime control-plane and evidence-query tool entrypoints. Tools include: `hivemind-doc.ts` (document intelligence queries), `hivemind-agent-work.ts` (durable work contract create/export), `hivemind-trajectory.ts` (trajectory ledger inspection), `hivemind-pressure.ts` (pressure classification and evidence), `hivemind-sdk-supervisor.ts` (SDK wrapper health checks), `hivemind-command-engine.ts` (command discovery and routing preview), and `run-background-command.ts` (background PTY/headless command execution). Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side tools calling feature modules. Classification: Hard Harness. These tools consume `.opencode/` Soft Meta-Concepts as inputs but never store logic in `.opencode/`. Internal state persists to `.hivemind/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call feature modules (runtime-pressure, sdk-supervisor, agent-work-contracts, doc-intelligence, background-command) and task-management modules.
- Tools may write through approved `.hivemind/` state owners when the contract requires it. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT duplicate deep logic that belongs in feature modules.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke hivemind tools during workflows | Must pass schema-valid inputs |
| `src/features/` | Owns runtime feature logic | Tools call features; tools do not duplicate logic |
| `src/task-management/` | Owns trajectory and state persistence | Tools call task-management; tools do not own state |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate tool contracts and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts` with `hivemind-` prefix: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- `run-background-command.ts` is the exception (no prefix).
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/hivemind/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/tools/AGENTS.md
# Tools Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/` is the Hard Harness write-side sector. Tool implementations expose validated OpenCode tool commands for delegation, status polling, background commands, prompt enhancement, primitive configuration, trajectory, pressure, SDK supervision, command engine, and agent work contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Source architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side mutation authority. Tools call `src/task-management/`, `src/coordination/`, `src/features/` for durable operations. Soft Meta-Concepts (`.opencode/`) configure tool behavior via agent/command/skill primitives; `.opencode/` NEVER owns tool business logic or runtime state.

## 2. Allowed mutation authority

- Tools are the CQRS mutation authority for runtime operations and may write through approved library state owners. Evidence: `.planning/codebase/ARCHITECTURE.md:72-80`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/ARCHITECTURE.md:295-300`.
- Tools may call OpenCode SDK wrappers, delegation managers, state owners, config workflow, and schema validators when the tool contract explicitly requires it. Evidence: `.planning/codebase/ARCHITECTURE.md:273-285`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for external or agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Tools SHALL NOT register themselves directly in arbitrary files; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim completion, integration, or runtime readiness from mocked/unit-only proof when the claim is about OpenCode integration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke tool contracts during workflows | Must pass schema-valid inputs |
| `src/plugin.ts` | Registers tool definitions with OpenCode | Does not embed tool business logic |
| `src/task-management/`, `src/coordination/`, `src/features/` owners | Perform durable state, lifecycle, SDK, and orchestration logic | Tools call them; tools do not duplicate deep logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests/gates | Verify validation, outputs, and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Single-file tools live at `src/tools/{tool-name}.ts`; multi-file tools live at `src/tools/{tool-name}/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Add or update schemas in `src/schema-kernel/{tool-name}.schema.ts` when validation is needed. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tool tests live under `tests/tools/{tool-name}.test.ts` and mirror the source contract. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/TESTING.md:52-64`.
- Tool output must use the shared envelope rather than bespoke response shapes. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests; run broader `npm test` when touching shared contracts or state owners. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface and proof that `.opencode/` was not used for internal state.
- Docs-only edits to this file are L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts</path>
<type>file</type>
<content>
1: /**
2:  * Zod schema for the session-tracker tool.
3:  *
4:  * Defines the input contract for agent-initiated session tracker queries.
5:  * Actions: export-session, list-sessions, search-sessions.
6:  * All operations are read-only (CQRS read-side).
7:  *
8:  * @module schema-kernel/session-tracker-schema
9:  */
10: 
11: import { z } from "zod"
12: 
13: /**
14:  * Valid actions for the session-tracker tool.
15:  */
16: export const SessionTrackerActionSchema = z.enum([
17:   "export-session",
18:   "list-sessions",
19:   "search-sessions",
20: ])
21: 
22: /**
23:  * Input schema for the session-tracker tool.
24:  *
25:  * @example
26:  * ```typescript
27:  * // Export a session
28:  * SessionTrackerInputSchema.parse({
29:  *   action: "export-session",
30:  *   sessionId: "ses_abc123",
31:  * })
32:  *
33:  * // List all sessions
34:  * SessionTrackerInputSchema.parse({
35:  *   action: "list-sessions",
36:  *   limit: 20,
37:  * })
38:  *
39:  * // Search sessions
40:  * SessionTrackerInputSchema.parse({
41:  *   action: "search-sessions",
42:  *   query: "investigator",
43:  * })
44:  * ```
45:  */
46: export const SessionTrackerInputSchema = z.object({
47:   /** The action to perform. */
48:   action: SessionTrackerActionSchema,
49:   /** Session ID (required for export-session). */
50:   sessionId: z.string().optional(),
51:   /** Search query string (required for search-sessions). */
52:   query: z.string().optional(),
53:   /** Maximum number of results (default: 20, max: 100). */
54:   limit: z.number().min(1).max(100).default(20).optional(),
55: })
56: 
57: /** Inferred type for session-tracker tool input. */
58: export type SessionTrackerInput = z.infer<typeof SessionTrackerInputSchema>

(End of file - total 58 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/schema-kernel/AGENTS.md
# Schema Kernel Sector Guidance

**Parent sector:** `src/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — validation-leaf (Zod v4 contracts, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/schema-kernel/` is the Hard Harness validation-contract sector. It owns Zod v4 schemas for OpenCode meta-concepts, permissions, MCP servers, prompt enhancement, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, and trajectory surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/codebase/STRUCTURE.md:114-118`.

## 2. Allowed mutation authority

- Schema files may define and export validation contracts, typed parse results, fallback validation helpers, and barrel exports.
- Schema changes may support tools, config workflow, validation/restart checks, and primitive configuration when paired with consumers. Evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/REQUIREMENTS.md:42-56`.
- Schema changes may reject, strip, or warn on invalid structures according to the owning tool or config workflow contract. Evidence: `.planning/codebase/ARCHITECTURE.md:397-401`.

## 3. Forbidden mutations / explicit no-go boundaries

- Schemas SHALL NOT perform durable writes, SDK calls, filesystem state mutation, or command execution.
- Schemas SHALL NOT become hidden runtime feature implementations; they define contracts consumed by tools/lib modules.
- Schemas SHALL NOT introduce `any` on new code or bypass TypeScript strictness. Evidence: `.planning/codebase/CONVENTIONS.md:70-75`.
- Schemas SHALL NOT claim registry/config completeness when consumers are partial or missing. Evidence: `.planning/REQUIREMENTS.md:42-56`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/configure-primitive.ts` and `validate-restart` | Validate primitive and restart contracts | Must handle schema errors through tool responses |
| Config workflow and runtime policy modules | Parse and validate workspace/config contracts | Must own side effects outside the schema |
| Tests | Validate accepted/rejected shapes | Schema tests do not prove runtime integration |
| `.opencode/` primitives | Are validated by schemas where supported | Schema existence is not registry enforcement by itself |

## 5. Naming and placement conventions

- Schema files use `kebab-case.schema.ts`; barrel exports live in `src/schema-kernel/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tests live under `tests/schema-kernel/` and validate real Zod behavior. Evidence: `.planning/codebase/TESTING.md:52-64`, `.planning/codebase/TESTING.md:208-213`.
- Use named exports and ESM `.js` import conventions where imports are needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.

## 6. Quality gates and evidence expectations

- Schema changes require `npm run typecheck` and scoped `npx vitest run tests/schema-kernel/...` evidence.
- If a schema change claims runtime enforcement, provide consumer evidence from the owning tool/lib module; schema-only proof is insufficient.
- Docs-only edits remain L5 evidence and must not alter readiness status. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/tool-response.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/tool-response.ts</path>
<type>file</type>
<content>
1: /**
2:  * Standard tool-response envelope. All prompt-enhance tools return this
3:  * shape so that the pipeline can uniformly detect success, error, and
4:  * pending states.
5:  */
6: export type ToolResponse<T = unknown> = {
7:   kind: "success" | "error" | "pending"
8:   message: string
9:   data?: T
10:   metadata?: Record<string, unknown>
11: }
12: 
13: /**
14:  * Create a success response.
15:  * @param message - Human-readable status message
16:  * @param data - Optional payload data
17:  * @param metadata - Optional diagnostic metadata
18:  */
19: export function success<T>(
20:   message: string,
21:   data?: T,
22:   metadata?: Record<string, unknown>,
23: ): ToolResponse<T> {
24:   return { kind: "success", message, data, metadata }
25: }
26: 
27: /**
28:  * Create an error response.
29:  * @param message - Human-readable error message
30:  * @param data - Optional payload data (e.g. partial results)
31:  * @param metadata - Optional diagnostic metadata
32:  */
33: export function error<T>(
34:   message: string,
35:   data?: T,
36:   metadata?: Record<string, unknown>,
37: ): ToolResponse<T> {
38:   return { kind: "error", message, data, metadata }
39: }
40: 
41: /**
42:  * Create a pending response (operation in progress).
43:  * @param message - Human-readable status message
44:  * @param data - Optional payload data
45:  * @param metadata - Optional diagnostic metadata
46:  */
47: export function pending<T>(
48:   message: string,
49:   data?: T,
50:   metadata?: Record<string, unknown>,
51: ): ToolResponse<T> {
52:   return { kind: "pending", message, data, metadata }
53: }
54: 
55: /**
56:  * Type guard: true if response is a success.
57:  */
58: export function isSuccess(
59:   response: ToolResponse,
60: ): response is ToolResponse & { kind: "success" } {
61:   return response.kind === "success"
62: }
63: 
64: /**
65:  * Type guard: true if response is an error.
66:  */
67: export function isError(
68:   response: ToolResponse,
69: ): response is ToolResponse & { kind: "error" } {
70:   return response.kind === "error"
71: }

(End of file - total 71 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/shared/AGENTS.md
# Shared Utilities Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/shared/` is the Hard Harness leaf utility sector for cross-cutting tool response helpers. It provides the standardized tool response envelope and rendering utilities consumed by tool implementations. Source evidence: `.planning/codebase/ARCHITECTURE.md:188-193`, `.planning/codebase/STRUCTURE.md:109-113`.

**Leaf-like constraint:** `src/shared/` MUST remain a leaf dependency — it never imports from `src/tools/`, `src/hooks/`, `src/features/`, `src/config/`, `src/routing/`, `src/task-management/`, or `src/coordination/`. This sector is consumed by all others but consumes none. Soft Meta-Concepts (`.opencode/`) never depend on shared; shared is a Hard Harness internal leaf.

## 2. Allowed mutation authority

- Shared utilities may define pure response envelope types, constructors, type guards, and rendering helpers.
- Shared utilities may be consumed by any tool that needs consistent `success`, `error`, or `pending` output. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.
- Shared changes may adjust response contracts only with corresponding tool/test updates.

## 3. Forbidden mutations / explicit no-go boundaries

- Shared utilities SHALL NOT import from tools, hooks, plugin, or deep state owners; this sector must remain leaf-like.
- Shared utilities SHALL NOT perform durable writes, SDK calls, event handling, command execution, or runtime policy loading.
- Shared utilities SHALL NOT become a dumping ground for feature logic; put business logic in `src/task-management/`, `src/coordination/`, `src/features/`, or the owning tool.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Standardized result rendering | Tools own behavior and side effects |
| Tests | Validate envelope behavior through direct or tool-level tests | Shared tests do not prove tool integration alone |
| OpenCode runtime | Receives rendered tool output indirectly | Runtime behavior still requires tool/plugin evidence |

## 5. Naming and placement conventions

- Keep files small and focused; current files are `tool-response.ts` and `tool-helpers.ts`. Evidence: `.planning/codebase/STRUCTURE.md:109-113`.
- Use named exports, strict TypeScript, and relative ESM imports with `.js` extensions when needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.
- Tests should live under `tests/` in the closest matching contract area; shared behavior may be covered directly or through tool tests.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and tests for every affected tool response behavior.
- Because this sector is cross-cutting, response-shape changes require broader tool regression evidence, not just one consumer.
- Docs-only edits remain L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/tool-helpers.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/atomic-write.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session tracker type definitions.
3:  *
4:  * All field names use camelCase per REQ-ST-12. These interfaces define the
5:  * contracts for session knowledge capture files written under
6:  * `.hivemind/session-tracker/`.
7:  *
8:  * @module session-tracker/types
9:  */
10: 
11: // ---------------------------------------------------------------------------
12: // Configuration
13: // ---------------------------------------------------------------------------
14: 
15: /** Configuration passed to the SessionTracker constructor. */
16: export interface SessionTrackerConfig {
17:   /** Absolute path to the project root directory. */
18:   projectRoot: string
19: }
20: 
21: // ---------------------------------------------------------------------------
22: // Core session records
23: // ---------------------------------------------------------------------------
24: 
25: /** Reference to a child session from within the parent's `children` array. */
26: export interface ChildRef {
27:   /** The child session's unique identifier. */
28:   sessionID: string
29:   /** The filename of the child session JSON file (e.g. "ses_abc.json"). */
30:   childFile: string
31: }
32: 
33: /**
34:  * Main session file frontmatter (YAML section of the `.md` knowledge file).
35:  * Mirrors the SPEC.md Section 5.1 format with camelCase field names.
36:  *
37:  * @example
38:  * ```typescript
39:  * const record: SessionRecord = {
40:  *   sessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
41:  *   created: "2026-05-10T21:54:36Z",
42:  *   updated: "2026-05-10T22:08:04Z",
43:  *   parentSessionID: null,
44:  *   delegationDepth: 0,
45:  *   children: [],
46:  *   continuityIndex: "session-continuity.json",
47:  *   status: "active",
48:  * }
49:  * ```
50:  */
51: export interface SessionRecord {
52:   /** Unique session identifier (e.g. "ses_1ed9df1adffe2hbJudz3sK60y3"). */
53:   sessionID: string
54:   /** ISO 8601 timestamp of session creation. */
55:   created: string
56:   /** ISO 8601 timestamp of last update. */
57:   updated: string
58:   /** Parent session ID, or `null` for root sessions. */
59:   parentSessionID: string | null
60:   /** Delegation depth: 0 = root, 1 = child, 2 = grandchild. */
61:   delegationDepth: number
62:   /** Array of child session references. */
63:   children: ChildRef[]
64:   /** Path to the session-local continuity index file. */
65:   continuityIndex: string
66:   /** Session status: active | idle | completed | error. */
67:   status: string
68: }
69: 
70: /** Metadata about the agent that performed a delegation. */
71: export interface DelegatedBy {
72:   /** Name of the delegating agent (e.g. "Hm-L0-Orchestrator"). */
73:   agentName: string
74:   /** Tool used to delegate (typically "task"). */
75:   tool: string
76:   /** Description of the delegated task. */
77:   description: string
78:   /** The type of subagent dispatched (e.g. "hm-l2-investigator"). */
79:   subagentType: string
80: }

(Showing lines 1-80 of 294. Use offset=81 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-doc.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-doc.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: 
3: import { executeDocIntelligenceAction } from "../../features/doc-intelligence/index.js"
4: import { DocIntelligenceInputSchema, type DocIntelligenceSchemaInput } from "../../schema-kernel/doc-intelligence.schema.js"
5: import { renderToolResult } from "../../shared/tool-helpers.js"
6: import { error, success } from "../../shared/tool-response.js"
7: 
8: type ToolContext = { sessionID?: string }
9: 
10: /**
11:  * Create the read-only document intelligence tool.
12:  *
13:  * @param projectRoot - Trusted project root used to scope every document path.
14:  * @returns OpenCode tool instance exposing skim, skim_directory, read, chunk, and search actions.
15:  *
16:  * @example
17:  * ```typescript
18:  * const hivemindDoc = createHivemindDocTool(process.cwd())
19:  * ```
20:  */
21: export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
22:   const s = tool.schema
23: 
24:   return tool({
25:     description: "Read-only document intelligence for Markdown skim, directory skim, read, chunk, and search actions.",
26:     args: {
27:       action: s.string().describe("Action: skim, skim_directory, read, chunk, or search"),
28:       path: s.string().describe("Project-root-relative Markdown file or directory path"),
29:       query: s.string().optional().describe("Search query for the search action"),
30:       maxCharacters: s.number().optional().describe("Maximum characters for read/chunk sizing"),
31:       maxResults: s.number().optional().describe("Maximum matches for search actions"),
32:     },
33:     async execute(rawArgs: DocIntelligenceSchemaInput, _context: ToolContext): Promise<string> {
34:       try {
35:         const args = DocIntelligenceInputSchema.parse(rawArgs)
36:         return renderToolResult(success("Doc intelligence action completed", executeDocIntelligenceAction(projectRoot, args)))
37:       } catch (caughtError) {
38:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
39:         return renderToolResult(error(message))
40:       }
41:     },
42:   })
43: }
44: 
45: export { DocIntelligenceInputSchema }

(End of file - total 45 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/atomic-write.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/atomic-write.ts</path>
<type>file</type>
<content>
81:  *
82:  * @param dirPath - Absolute path to the directory.
83:  * @returns Promise that resolves when the directory exists.
84:  */
85: export async function ensureDirectory(dirPath: string): Promise<void> {
86:   await mkdir(dirPath, { recursive: true })
87: }
88: 
89: /**
90:  * Sanitizes a session ID by stripping characters that are not alphanumeric,
91:  * underscore, or hyphen.
92:  *
93:  * @param sessionID - Raw session ID to sanitize.
94:  * @returns The sanitized session ID.
95:  * @throws {Error} If the sanitized ID is shorter than 3 characters.
96:  */
97: export function sanitizeSessionID(sessionID: string): string {
98:   const sanitized = sessionID.replace(/[^a-zA-Z0-9_-]/g, "")
99:   if (sanitized.length < 3) {
100:     throw new Error(
101:       `[Harness] Invalid session ID after sanitization: "${sessionID}" (result: "${sanitized}")`,
102:     )
103:   }
104:   return sanitized
105: }
106: 
107: const SESSION_TRACKER_DIR = ".hivemind/session-tracker"
108: 
109: /**
110:  * Constructs a safe filesystem path under the session tracker root.
111:  *
112:  * Sanitizes the session ID and validates that the resolved path does not
113:  * escape the `.hivemind/session-tracker/` root (prevents path traversal).
114:  *
115:  * @param projectRoot - Absolute path to the project root.
116:  * @param sessionID - Session identifier to use as the subdirectory name.
117:  * @param filename - The filename within the session directory.
118:  * @returns Absolute, validated path under the session tracker root.
119:  * @throws {Error} If the resolved path escapes the tracker root.
120:  */
121: export function safeSessionPath(
122:   projectRoot: string,
123:   sessionID: string,
124:   filename: string,
125: ): string {
126:   // Detect path traversal in raw inputs BEFORE sanitization
127:   if (sessionID.includes("/") || sessionID.includes("\\") || sessionID.includes("..")) {
128:     throw new Error(
129:       `[Harness] Path traversal detected in sessionID: "${sessionID}"`,
130:     )
131:   }
132:   if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
133:     throw new Error(
134:       `[Harness] Path traversal detected in filename: "${filename}"`,
135:     )
136:   }
137: 
138:   const safe = sanitizeSessionID(sessionID)
139:   const trackerRoot = resolve(projectRoot, SESSION_TRACKER_DIR)
140:   const resolved = resolve(trackerRoot, safe, filename)
141: 
142:   if (!resolved.startsWith(trackerRoot + "/") && resolved !== trackerRoot) {
143:     throw new Error(
144:       `[Harness] Path traversal detected — resolved path "${resolved}" is outside tracker root "${trackerRoot}"`,
145:     )
146:   }
147: 
148:   return resolved
149: }
150: 
151: /**
152:  * Returns the absolute path to the session tracker root for a given project.
153:  *
154:  * @param projectRoot - Absolute path to the project root.
155:  * @returns Absolute path to `.hivemind/session-tracker/`.
156:  */
157: export function sessionTrackerRoot(projectRoot: string): string {
158:   return resolve(projectRoot, SESSION_TRACKER_DIR)
159: }

(End of file - total 159 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts</path>
<type>file</type>
<content>
80: }
81: 
82: /** Metadata about the primary agent running a child session. */
83: export interface MainAgent {
84:   /** Agent display name. */
85:   name: string
86:   /** Model identifier (e.g. "DeepSeek V4 Pro"). */
87:   model: string
88: }
89: 
90: /** A single tool invocation record within a turn. */
91: export interface ToolRecord {
92:   /** Name of the tool invoked (e.g. "skill", "read", "task"). */
93:   tool: string
94:   /** Tool input arguments (pruned to metadata for captured tools). */
95:   input: unknown
96:   /** Pruned/pruned output if applicable, or `undefined` if not captured. */
97:   outputPruned?: string
98:   /** Execution status: "success" | "error" | undefined if unknown. */
99:   status?: string
100: }
101: 
102: /** A single turn (exchange) within a session. */
103: export interface Turn {
104:   /** One-based turn number within the session. */
105:   turn: number
106:   /** Actor designation (e.g. "main_l0_agent", "user"). */
107:   actor: string
108:   /** Original actor type before transformation, if applicable. */
109:   actorTransformedFrom?: string
110:   /** Message content text. */
111:   content: string
112:   /** Tool invocations that occurred during this turn. */
113:   tools: ToolRecord[]
114: }
115: 
116: /**
117:  * Child session file contents (SPEC.md Section 5.2).
118:  * Stored as `.json` under the parent session's subdirectory.
119:  *
120:  * @example
121:  * ```typescript
122:  * const child: ChildSessionRecord = {
123:  *   sessionID: "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
124:  *   parentSessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
125:  *   delegationDepth: 1,
126:  *   delegatedBy: {
127:  *     agentName: "Hm-L0-Orchestrator",
128:  *     tool: "task",
129:  *     description: "Investigate event tracker bugs",

(Showing lines 80-129 of 294. Use offset=130 to continue.)
</content>
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_AaEyjIoCiojOXokIsue85523"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_Y65NESyRNNkadXRQW3M05101"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_lWPYnh3k7o713mJkAwKT0083"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_wzSHEztqosBhh4akS92V7144"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_PEsu25xhUvayQkM5ZJJz1020"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_3nuuqC34rHXKjDijZ4k01954"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_g2UUTRMRR6jP43emgEJt4990"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_WZpDEmDxwGVQuLP1dfqU3462"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_kOXyUyQPpCB1VNDawhHP6540"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_6l8LYdOMbqVPZqHlBHCb4373"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_UdTA5GJ2T3Dsc0X06f3Z5064"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/features/session-tracker/recovery/session-recovery.test.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_yulWHWsZ5YDKhhxUJglV9869"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4qL6hIwLq38UbK0pWlBu9863"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4YjcbhVhVF2IfJ7zCcFy3595"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_WT8k9seE9430tMHCUlEv9440"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_UeVW27Dwb5jFqL8whcpx3793"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_VbbFbQEqPsG7bYrcYGtD9978"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_uwMBlP6w5QowmkJtqPkG1532"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/session-tracker.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_gGcK1EitwnJsIfi4c58V4675"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Kps8EYFdtF1ykAvQWm4h2057"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eKPunTFPaRs6Xw2xwTxw3100"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_u6ZFoTVKlpDVwCHrMauI2141"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_I1YfGr68bikS07PYPqZj9465"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_xzO8A6KpS4MBJW5aAOnw6770"
}
```


---
sessionID: ses_1e88f011bffe3I6hxHpmPerPLi
created: 2026-05-11T14:29:01.822Z
updated: 2026-05-11T14:29:01.822Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)


Execute plan 11-05 of phase 11. Follow the execute-plan workflow: read the plan, execute each task atomically, commit per task, produce SUMMARY.md.

You are the gsd-executor specialist. You are being delegated this plan execution by the execute-phase orchestrator. Your job: read the plan file, execute tasks, commit atomically, write SUMMARY.md.

<objective>
Execute plan 11-05 of phase 11-governance-reconciliation-update-all-core-artifacts-state-md.
Audit all 7 sector-level AGENTS.md files for stale references, correct src/lib/ → new plane path mappings, and add Current Phase Context sections per D-11.
Commit each task atomically. Create SUMMARY.md in the plan directory.
</objective>

<sequential_execution>
You are running on the main working tree. Use normal git commits (with hooks). Do NOT use --no-verify.
</sequential_execution>

<files_to_read>
Read these files at execution start:
- .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-05-PLAN.md
- .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md (evidence baseline from 11-01)
- .planning/PROJECT.md
- .planning/STATE.md
- .planning/config.json
- ./AGENTS.md

All 7 sector AGENTS.md locations to check:
- .opencode/AGENTS.md
- .planning/AGENTS.md  
- .hivemind/AGENTS.md
- .hivefiver-meta-builder/AGENTS.md
- src/AGENTS.md
- tests/AGENTS.md
- docs/AGENTS.md
</files_to_read>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
</execution_context>

<success_criteria>
- All tasks in the plan executed
- Each task committed individually with atomic commits  
- SUMMARY.md created in .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/
- STATE.md updated with position and decisions
- ROADMAP.md updated with plan progress
</success_criteria>

IMPORTANT: Read the 11-05-PLAN.md file first, then execute each task in order. The 11-TRUTH-MATRIX.md from plan 11-01 is your evidence baseline — use its verified claims to correct stale references in AGENTS.md files.
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

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md</path>
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
</content>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md</path>
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
</content>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-05-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md"
}
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/config.json"
}
```


## USER (turn 2)

Resume session.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/AGENTS.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/AGENTS.md</path>
<type>file</type>
<content>
1: # AGENTS.md
2: 
3: ## Project Overview
4: 
5: Current planning route: WS-SR source-plane restructuring is COMPLETE after SR-04 through SR-10 remediation (`882b0686`). `src/lib/` has been removed; runtime code now lives under `src/shared/`, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, `src/hooks/`, and `src/tools/`. CP-PTY-00 is the shell/PTY/background-command control-plane spike (docs/spec-only, COMPLETE). CP-PTY-01 (Background Shell Control-Plane MVP) is READY, unblocked by BOOT-07 and WS-SR completion. CP-PTY-02, CP-PTY-03, and CP-PTY-04 extend the runway. SC-PTY-01 remains DEFERRED.
6: 
7: 
8: ## NON-NEGOTIABLE RULES
9: if you are l0 and l1 agents - you must always load `hivemind-power-on` skill to start, resume the session, act accordingly to the skill - the skill governance, sessions and sub-sessions are continuely persistent on disk programatically - ust resume on aborted do not think much - the skill overwrite and supersede every in-session router
10: 
11: - WHEN REQUEST IS CONFUSING AND LARGE -> never try to audit everything at once master planning - loop on phases with traversal and progressive batch of research - investigate - planning - implementing - verification then moving to the next batch -> reapt the integrated cycles with regression validation and integration loops of gatekeeping - never try to handle everything at once
12: 
13: - DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION. DO NOT USE ANY CUSTOM TOOLS YET. DO NOT USE INTERACTIVE BASH OR PTY COMMANDS!
14: 
15: - Handoff and artifacts between sessions, from research, audit, planning, review, verification, must all commit, written-to-local-disk and referenced as master jump links
16: 
17: - all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`
18: 
19: - any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 
20: 
21: - all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS
22: 
23: - design patterns and must be obeyed strictly according to the architecture of the project.
24: 
25: - atomic git commit for context preservation.
26: 
27: - context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed
28: 
29: - AGENTS.md must be routinely updated - after each cycle, each batch of implementation.
30: 
31: - AGENTS.md are nested under dirs and subdirs, beware when maintaining them.
32: 
33: - files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 
34: 
35: - folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 
36: 
37: - code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.
38: 
39: - The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces
40: 
41: - The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks
42: 
43: - The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks
44: 
45: - When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.
46: 
47: <!-- NOTE: explore agent is MISSING from the filesystem -->
48: 
49: - For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.
50: 
51: - The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 
52: 
53: - **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important
54: 
55: 
56: - - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
57: 
58: 
59: ## SKILLS TO WORKFLOW ROUTER
60: **Important guidelines**
61: 
62: - To load best set of skills agents must know if you are front-facing or being delegated as subagents; knowing your hierarchy of tasks (looking at the meta data marked as `#USER` to confirm it is from the human user, meaning you are front-facing agent, otherwise subagents) 
63: 
64: - consider loading new skill(s) (not always but once **intents** of human users and/or **workflows**, **tasks** shifted this order is a **must**)
65: 
66: - **subagents** (know your agent **domain** by looking at description; analyze **task** to fetch `specilist` skills) fetch skills belong  `how-to-implement` and/or `specialist` classifications.
67: 
68: - **orchestrator/coordinator agents** : loading `how-to-delegate`, `how-to-process/loop/iterative`, `guardrails, gatekeeping, context,`  skills classifications. For complex tasks this group may need to load `outer-cycle-how-to-implement` skills  
69: 
70: - **respecting framework `oneness`** : it is if you are using `gsd` skill sets - pick them first - then pick another only when `gsd` skill sets lack the `domain-specific` or `task-specialist` that you find the superior ones. 
71: 
72: ### **going from greater cycles to the inner cycles** for skills to coordinate and orchestrate
73: 
74: - **brainstorming, user-intent discussion** always make sure to understand, think twice load set helping to get clear user-intent through QA and discussion to prevent regressions or conflicts
75: 
76: - **research, investigate, synthesis** do not skip research load `hm-deep-research` - `hm-detectice` (if need to learn about the sector of codebase) and
77: 
78: - **write new code:** load `clean-code` skill
79: 
80: - **debugging:** load `gsd` debug skills and `systematic-debug` skill
81: 
82: - **planning and implementing** must load set of spec-driven and authentic tdd skills
83: 
84: - **iterative loop** coordinating skills and gatekeeping at correct set loop til completione
85: 
86: - **quality gatekeeping** must go through cycles of code-review, validation, verification, then integration gatekeeping. making sure to trace of regression
87: 
88: ## IMPORTANT UPDATE TO ALL AGENTS
89: 
90: - when lost -> access real-time eventracker at `/.hivemind/event-tracker/*.md , *.json - list/glob first - then look for the correct session id -use hm-detective skill to investigate the sessions
91: 
92: - **important tracking path for delegation:**
93: .hivemind/state/session-continuity.json
94: .hivemind/state/delegations.json 
95: 
96: - If the agents recieve GSD command, all they must is to act following it. THE COMMAND SUPERSEDE ALL ASSUMPTIONS AND LOADING SKILLS OTHER, BECAUSE THE COMMAND OF GSD IS THE SKILL
97: 
98: - ALL AGENTS MUST ANNOUNCE THIS EVERY TURN DEPENDING ON MAIN-HUMAN-FACING ORCHESTRATOR OR SUBAGENT BEING DELEGATED
99: 
100: - IF you are a front-facing -> you will mostly delegate **Everytime Delegation** in the prompt YOU MUST LET the subagent know that IT IS THE SUBAGENT BY ANNOUNCING: *You are the subagent Name:XXX role...., you must do as this prompt instructed and knowing that you are being delegated
101: 
102: - As subagent you must anounce your roles so the skills must also match. Say: I am **subagent, I CAN ONLY delegate further if the cycles and my tasks allow, and I must fulfill my work. If need verification, I will return the verification needed in the report handoff
103: 
104: 
105: <EXTREMELY-IMPORTANT>
106: If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
107: 
108: IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
109: 
110: This is not negotiable. This is not optional. You cannot rationalize your way out of this.
111: </EXTREMELY-IMPORTANT>
112: 
113: ## Instruction Priority
114: 
115: This override default system prompt behavior, but **user instructions always take precedence**:
116: 
117: 
118: 
119: 
120: Hivemind is a **runtime composition engine** for OpenCode. It is an npm package (`hivemind`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project has progressed through 31 phases covering runtime architecture, delegation revamp, skills quality, and planning documentation refresh. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.
121: 
122: **This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.
123: 
124: ### Two Halves (never confuse them)
125: 
126: | Half | What | Where | Architecture Reference |
127: |------|------|-------|----------------------|
128: | **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf), Task-Management (state), Coordination (delegation), Features (runtime), Config, Routing | `src/` | `.planning/codebase/ARCHITECTURE.md` — CQRS, 9-surface model |
129: | **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions — NEVER development implementation, NEVER runtime state | `.opencode/` | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — primitives-only |
130: | **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory — NEVER stored in `.opencode/` | `.hivemind/` | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — canonical Q6 root |
131: | **Meta-Authoring** (source-of-truth) | Lab environment for authoring primitives before reflection to `.opencode/` | `.hivefiver-meta-builder/` | `.planning/codebase/ARCHITECTURE.md` — Source-of-Truth layer |
132: | **Governance** (planning/authorization) | Requirements, roadmaps, architecture maps, phase authorization — never runtime code | `.planning/` | `.planning/AGENTS.md` — Planning/Governance sector |
133: 
134: ### Runtime features this project delivers
135: 
136: Background agents, auto-loop/ralph-loop, WaiterModel delegation with dual-signal completion, task queuing with queue-key validation, category system, session recovery, PTY integration (Bun-only via the `bun-pty` **optional dependency** — runtime gracefully falls back to headless `node:child_process` on Node and any other host where `bun-pty` is absent or fails to load; recovery of a PTY delegation across a harness restart deliberately surfaces `terminalKind: "non-resumable-after-restart"` because OS PTY processes do not survive parent restart — see Phase 16.2.1). See `docs/draft/architecture-proposal-hivemind-v3.md` for feature-to-code mapping.
137: 
138: ---
139: 
140: ## Setup Commands
141: 
142: ```bash
143: npm install                    # Install dependencies
144: npm run build                  # Clean + compile TypeScript to dist/
145: npm run typecheck              # Type-check without emitting
146: npm run test                   # Run all tests (vitest)
147: npm run test:watch             # Watch mode
148: npm run test:coverage          # Coverage report (src/**/*.ts)
149: ```
150: 
151: - Requires Node.js >= 20.0.0
152: - Peer dependency: `@opencode-ai/plugin` >= 1.1.0
153: - No environment variables required for build/test
154: - Runtime state overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`
155: 
156: ---
157: 
158: ## Project Structure
159: 
160: ```
161: src/
162: ├── plugin.ts                  # Composition root
163: ├── index.ts                   # Public API re-exports
164: ├── shared/                    # Leaf utilities, types, SDK wrappers, runtime policy, security
165: ├── task-management/           # Continuity, journal, event tracker, recovery, trajectory, lifecycle
166: ├── coordination/              # Delegation, completion, concurrency, SDK/command delegation, spawner
167: ├── features/                  # Standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, work contracts
168: ├── config/                    # Config subscriber/compiler/workflow
169: ├── routing/                   # Session entry, behavioral profile, command engine
170: ├── hooks/                     # Lifecycle, guards, observers, transforms, composition
171: ├── tools/                     # Delegation, session, config, hivemind, prompt tool entrypoints
172: └── schema-kernel/             # Zod schemas and generated config schema support
173: 
174: tests/lib/                     # Legacy test grouping for moved runtime modules
175: tests/tools/                   # Tool-focused unit tests
176: .opencode/                 # Soft meta-concepts (skills, agents, commands) — NO state storage
177: .hivemind/               # Internal deep module state (journals, lineage, runtime state) — canonical per Q6
178: ```
179: 
180: ### Dependency rules (non-negotiable)
181: 
182: - `src/shared/types.ts` is leaf-like shared contract authority; avoid adding deep runtime imports without a source-backed decision
183: - `src/shared/helpers.ts`, `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` — leaf or near-leaf
184: - `src/task-management/lifecycle/index.ts` is the lifecycle manager surface
185: - No circular dependencies
186: - Max module size: 500 LOC
187: - `src/task-management/continuity/delegation-persistence.ts` — delegation record I/O
188: 
189: ### Where to find things
190: 
191: | Task | File |
192: |------|------|
193: | Change session persistence format | `src/task-management/continuity/index.ts` |
194: | Add a lifecycle phase | `src/shared/types.ts` + `src/task-management/lifecycle/index.ts` |
195: | Change SDK call patterns | `src/shared/session-api.ts` |
196: | Change concurrency model | `src/coordination/concurrency/queue.ts` |
197: | Change delegation behavior | `src/coordination/delegation/manager.ts` — DelegationManager class (WaiterModel dispatch, dual-signal completion) |
198: | Change delegate-task tool | `src/tools/delegation/delegate-task.ts` — dispatch tool wrapper |
199: | Check delegation status | `src/tools/delegation/delegation-status.ts` — status polling tool |
200: | Change completion detection | `src/coordination/completion/detector.ts` |
201: | Change task status transitions | `src/shared/task-status.ts` |
202: | Change agent config (temperature, tools) | `src/plugin.ts` — `AGENT_DEFAULTS`, `AGENT_TOOLS` |
203: | Change circuit breaker / tool budget | `src/plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |
204: | Persist delegation records | `src/task-management/continuity/delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()` |
205: | Change tool response envelope | `src/shared/tool-response.ts` — standard response wrapper |
206: | Change prompt-enhance schemas | `src/schema-kernel/prompt-enhance.schema.ts` — Zod schemas for skim/analyze/patch |
207: 
208: ---
209: 
210: ## Testing Instructions
211: 
212: - Run all tests: `npm test`
213: - Run single test file: `npx vitest run tests/lib/helpers.test.ts`
214: - Run tests matching pattern: `npx vitest run -t "<test name>"`
215: - Watch mode: `npm run test:watch`
216: - Coverage: `npm run test:coverage` — covers `src/**/*.ts`, excludes `src/index.ts`
217: - Test files live in `tests/lib/` and `tests/tools/` — mirror `src/` modules and `src/tools/`
218: - Tests use vitest globals (no imports needed for `describe`, `it`, `expect`)
219: - **Type-check before committing:** `npm run typecheck`
220: 
221: ---
222: 
223: ## Code Style
224: 
225: - TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
226: - ES2022 target, NodeNext module resolution
227: - `verbatimModuleSyntax: true` — use `import type` for type-only imports
228: - Deep-clone-on-read in continuity store
229: - `[Harness]` prefix on all thrown errors
230: - Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`)
231: - No `any` types on new code
232: - Max module size: 500 LOC
233: 
234: ---
235: 
236: ## Build and Deployment
237: 
238: - Build: `npm run build` — compiles `src/` → `dist/` with declarations + source maps
239: - Package entrypoints:
240:   - `hivemind` → `./dist/index.js`
241:   - `hivemind/plugin` → `./dist/plugin.js`
242: - Prepack runs build automatically: `npm pack` / `npm publish`
243: - Runtime state path: `.hivemind/state/` (canonical per Q6; legacy `.opencode/state/opencode-harness/` supported via compatibility bridge during migration)
244: 
245: ---
246: 
247: ## OpenCode Integration
248: 
249: - Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
250: - Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
251: - 89 agents in `.opencode/agents/`: 33 GSD specialist agents (internal project build tools — NOT shipped) + 45 hm-* agents (harness module specialists + core/internal agents: analyst, architect, assessor, auditor, brainstormer, build, conductor, connector, context-mapper, context-purifier, coordinator, critic, curator, debugger, ecologist, executor, finisher, general, guardian, integrator, intent-loop, investigator, mentor, meta-synthesis, operator, optimizer, orchestrator, persistor, phase-guardian, planner, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, reviewer, risk-assessor, router, scout, spec-verifier, strategist, synthesizer, technician, test-router, validator, writer) + 11 hf-* agents (hf-prompter, hf-l2-agent-builder, hf-l2-command-builder, hf-l0-hm-l0-orchestrator, hf-l2-skill-builder, hf-l2-tool-builder, hf-l2-meta-builder + 4 additional). Note: explore agent is MISSING from the filesystem.
252: - 59 skills in `.opencode/skills/`: 35 hm-* (product dev: brainstorm, requirements-analysis, feature-ecosystem, product-validation, coordinating-loop, user-intent-interactive-loop, cross-cutting-change, spec-driven-authoring, test-driven-execution, debug, refactor, deep-research, detective, synthesis, research-chain, completion-looping, phase-loop, phase-execution, planning-persistence, subagent-delegation-patterns, production-readiness, roadmap-maintainability, tech-context-compliance, tech-stack-ingest, omo-reference, opencode-platform-reference, opencode-non-interactive-shell, opencode-project-audit, gate-orchestrator, lineage-router, brainstorm, skill-router, hivemind-engine-contracts, hivemind-state-reference, integration-contracts) + 13 hf-* (meta-builder: agent-composition, agents-and-subagents-dev, agents-md-sync, command-dev, command-parser, context-absorb, custom-tools-dev, delegation-gates, meta-builder, skill-synthesis, use-authoring-skills) + 3 gate-* (internal quality gate triad: evidence-truth, lifecycle-integration, spec-compliance — THIS PROJECT ONLY, not shipped) + 6 stack-* (reference: bun-pty, json-render, nextjs, opencode, vitest, zod) + 1 unprefixed (opencode-config-workflow) + 1 hivemind-* (governance: hivemind-power-on — cross-lineage session governance, loaded FIRST by all hm-* and hf-* L0/L1 agents). Note: the previously disabled `hm-planning-with-files` skill has been removed.
253: - Note: 65 gsd-* skills and 33 gsd-* agents exist in `.opencode/` as developer tooling (GSD framework used to build this project). They are NOT shipped primitives. Any synthesis from gsd-* must be transformed to hm-*/hf-* conventions.
254: - 19 commands in `.opencode/commands/`: 7 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork) + 7 extended (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) + 1 sync (sync-agents-md) + 4 test (test-echo, test-list, test-spike-execute, test-status)
255: 
256: ### `.opencode/` = Soft Meta-Concepts ONLY — NEVER Development Assets
257: 
258: `.opencode/` is **ONLY** for OpenCode configurable primitives (agents, commands, skills, rules, permissions) that compose runtime behavior from outside the npm package. **No internal runtime state** is stored here. **No development implementation** lives here. **No build artifacts** belong here.
259: 
260: This is a critical distinction:
261: - **`.opencode/` IS:** Agent definitions, skill packages, command files, permission rules, plugin loader wrappers → these CONFIGURE runtime behavior
262: - **`.opencode/` IS NOT:** Source code, compiled output, business logic, state persistence, development tools, npm package assets → these belong in `src/`, `dist/`, or `.hivemind/`
263: 
264: All Hivemind deep module state (journals, lineage, runtime state, graph/vector memory) writes to `.hivemind/` at project root per Q6. This prevents corruption by other plugins or user dependencies.
265: 
266: ### Canonical Skill Location
267: 
268: `.opencode/skills/` is the **ONLY** canonical location for project skills. All skill authoring happens in `.hivefiver-meta-builder/skills-lab/` and is reflected in `.opencode/skills/` via directory-level symlink.
269: 
270: IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are **third-party sync artifacts**, not project deliverables. They are gitignored and must never be committed. `.claude/skills/` does not exist in this repository.
271: 
272: ---
273: 
274: ## Architecture Foundation (Authoritative Docs)
275: 
276: ### Must-Have References (current as of 2026-05-10)
277: 
278: | Document | Purpose | Authority |
279: |----------|---------|-----------|
280: | `.planning/codebase/ARCHITECTURE.md` | CQRS model, 9-surface authority, component graph, dependency rules | Source-backed architecture map |
281: | `.planning/codebase/STRUCTURE.md` | File tree, placement conventions, naming, folder registration | Source-backed structure map |
282: | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` | Surface ownership model, Phase 0 mutation gates, target source planes | Governance baseline |
283: | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | Naming contract, lineage contract (hm/hf/gate/stack/gsd), L0-L3 hierarchy | Governance baseline |
284: | `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md` | Target sector AGENTS.md shape, deferred implementation | Target architecture |
285: | `.planning/research/omo-adaptation-architecture-2026-05-07.md` | OMO adapt/reject table, Hivemind surface preservation rules | Research foundation |
286: | `.hivemind/planning/agents-system-overhaul-2026-05-10/` | Agent/skill/command overhaul: 15 REQs, 12 phases, shipped count = 49 | Overhaul planning |
287: 
288: ---
289: 
290: ## Locked Validation Decisions (Q1-Q6)
291: 
292: Six architectural decisions locked 2026-04-25 as the foundation for Phases 27-30 and all future work. Source: `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`
293: 
294: | Decision | Description |
295: |----------|-------------|
296: | **Q1** | Hybrid + Spec-Driven Automated Runtime Detection — deep codemap, file watcher, MCP tools, dependency graph; Layer 2 taxonomy |
297: | **Q2** | Artifact-Focused Sidecar — Next.js 15 + `@json-render/react`, reads `.hivemind/` and `.planning/`, READ-ONLY for canonical state |
298: | **Q3** | Session Journal as Complement + Time-Machine — append-only event timeline, independent of continuity.ts |
299: | **Q4** | MVP = 5 of 8 memory categories; Post-MVP = 3 with explicit gates |
300: | **Q5** | Full RICH gate required — 0 of 25 skills pass today is honest status; no threshold lowering |
301: | **Q6** | `.hivemind/` is internal state root; `.opencode/` is ONLY for OpenCode primitives — one-way migration |
302: 
303: ---
304: 
305: ## Architecture Rules (from architecture-proposal-hivemind-v3.md)
306: 
307: ### Script rule
308: A script should **REPORT FACTS** and **LEAVE JUDGMENT TO THE AGENT**. Pure helpers only (exit 0, no governance). No hardcoded paths, no state mutation outside CQRS tools.
309: 
310: ### Anti-patterns to avoid
311: - Static `.md` files acting as agent definitions (they are templates/references only)
312: - Bash scripts outside `bin/` CLI substrate
313: - Governance scripts that block progression (facts only)
314: - Feature bloat: keep modules under 500 LOC, total codebase target ~4,000-5,000 LOC
315: - Skill proliferation: target ~20 SKILL.md files, not hundreds
316: 
317: ### Target architecture (from proposal)
318: 5 tools (~500 LOC total), hooks (~800 LOC), lifecycle (~400 LOC), delegation (~400 LOC), continuity (~400 LOC), CLI substrate (~500 LOC), control-plane (~400 LOC), shared (~800 LOC).
319: 
320: ---
321: 
322: ## Git Commit Discipline
323: 
324: - Commit message format: `phase: what changed — why it matters`
325: - Commit after each meaningful change (subagent returns, phase completes, gate passes)
326: - Never accumulate changes across multiple phases without committing
327: - Agents may only manage commits for their own work — they do not constrain or override commits from other development activity
328: 
329: ---
330: 
331: ## Terminology
332: 
333: | Use | Not |
334: |-----|-----|
335: | Harness | Framework, system |
336: | Agent (specialist: researcher/builder/critic) | Claude, AI, model |
337: | Skill | Prompt, instruction |
338: | Runtime composition | Static definition |
339: | Delegation packet | Task assignment |
340: 
341: <!-- GSD:profile-start -->
342: ## Developer Profile
343: 
344: > Generated by GSD from session_analysis. Run `/gsd-profile-user --refresh` to update.
345: 
346: | Dimension | Rating | Confidence |
347: |-----------|--------|------------|
348: | Communication | mixed | LOW |
349: | Decisions | fast-intuitive | LOW |
350: | Explanations | concise | LOW |
351: | Debugging | fix-first | UNSCORED |
352: | UX Philosophy | backend-focused | LOW |
353: | Vendor Choices | pragmatic-fast | UNSCORED |
354: | Frustrations | scope-creep | UNSCORED |
355: | Learning | self-directed | LOW |
356: 
357: **Directives:**
358: - **Communication:** Adapt communication style to context — accept terse directives for execution, provide structured responses when the developer establishes context. When uncertain, match the developer's current message length and formality.
359: - **Decisions:** Present recommendations directly and proceed quickly when accepted — this developer makes execution decisions fast. If a decision has significant architectural impact, briefly note the stakes before proceeding but do not over-deliberate.
360: - **Explanations:** Provide brief explanations of approach alongside code. Focus on architectural decisions and their impact. Skip conceptual background unless the developer explicitly asks. When in doubt, ask if more detail is needed.
361: - **Debugging:** No strong preference detected. Ask the developer when this dimension is relevant.
362: - **UX Philosophy:** Focus on backend architecture, code quality, and system design. No UI/UX polish needed for current work. If the project shifts to frontend, ask the developer about their UX preferences.
363: - **Vendor Choices:** No strong preference detected. Ask the developer when this dimension is relevant.
364: - **Frustrations:** Stay within stated scope and deliver honest assessments. Do not overstate capabilities or add unrequested features. When presenting work, be factual about what was delivered versus what was promised.
365: - **Learning:** Provide code and architectural details for independent assessment. Ask targeted questions rather than offering walkthroughs. When the developer explores a new domain, offer concise references and let them direct the learning pace.
366: <!-- GSD:profile-end -->
367: 
368: <!-- Last synced: 2026-05-11 — Phase 11 audit: skill count corrected to 58 (disabled removed), commands 18→19, package name `hivemind` per P0-ID -->
369: 
370: ## Current Phase Context
371: 
372: **Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All core artifacts (STATE.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md, 7 sector AGENTS.md) being reconciled against live evidence.  
373: **Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
374: **What this means for this file:** All numeric claims (test counts, file counts, LOC) have been verified and corrected. Path references updated for post-SR restructuring (src/lib/ has been removed; migrated to new planes). Section added per Phase 11 D-11.  
375: **Next phase:** GOV-01 completion → CP-PTY-01 (Background Shell Control-Plane MVP) and CP-ST-01 (Session Tracker Revamp).

(End of file - total 375 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/AGENTS.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_eugDCdVVxjbYTLftNA211212"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_taumC4AhNCrUiIaqtUKo5062"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_iwSPaboURw01ATKwcSOZ6804"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_BMyQRaMR6efXg05ERvA13074"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_uDNHBYWa83GQGan11zSZ8993"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_gd4ZWKgrwphzcjAU6HjI1950"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_khYcg31930POK7cufXCy3609"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_YzTGKhT1cINoTTSX9EOw9877"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_LO0cTxGXFKfk4NgHguuZ9326"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_SKQY0Ow8vTqrpaMfZBVY5395"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_hdOi570ozq9spkWhY1dy1958"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_x2Ni56ssQja5mNHA3NlJ3425"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_03_35Ak4Rp6Pf9mLw6LyACm2455"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_p4tgkfdy8rSMHGyuU0NV8714"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_XhwCDxDaSIDFWvFKiZhB6418"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_0BCA3CcAZ9PeLfxnU0oH6846"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2c0ez2U27jO1mtUYWt0g1831"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_dZ4UT9bSZLKCnr9ILYqB6152"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7OfrsJGY9Ti5Uf84I3QM4390"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_4VSERQ5ROA5Rra3ugY4Y8245"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Uaqsiut7A5otGoEMKrIQ3013"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JwlbH4Co5LFLCnpO3PTL6430"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7X1qKfKvQ83EMc4ROp1V3916"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ZQJ6CG5BhbH5ILJGAteZ6696"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_hgOEd9iT11F3K10FWsTB6886"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_irHMnY5qSwIYFzlviVRE5001"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_HaDpVsNTXs59bJuqW0F28382"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jof5LdPHOxCuoHr6N4qI4011"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_FEPlNTxnPUsagCrvFFFO3982"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_WH9wMMLtplK9Ja7KyJx59038"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ZMzEH48lB3XXJHfCVbOx4717"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_4LAPUDMbBwcFLcYjORQe4379"
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
  "callID": "call_00_IG9qVQJYNeIGud4F7tFJ5634"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_k66vMwfa65yg4GQp14Jh3442"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eiWXKQU1MfEmIiwfjoEf8621"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_15745pAYoUhAnYaATSCX5415"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_64Ht4Gkdwkt26GZrlBTg0167"
}
```


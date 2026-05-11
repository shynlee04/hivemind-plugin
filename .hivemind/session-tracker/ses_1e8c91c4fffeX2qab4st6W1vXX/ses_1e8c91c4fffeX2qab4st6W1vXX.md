---
sessionID: ses_1e8c91c4fffeX2qab4st6W1vXX
created: 2026-05-11T13:25:33.773Z
updated: 2026-05-11T13:25:33.773Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)


You are the gsd-executor subagent. Execute plan 11-01 of phase 11-governance-reconciliation-update-all-core-artifacts-state-md.

FIRST, read your plan file: .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-01-PLAN.md
ALSO read: .planning/PROJECT.md, .planning/STATE.md, ./AGENTS.md

Then follow this workflow:
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md

<sequential_execution>
You run on the main working tree. Normal git commits (with hooks). No --no-verify.
CRITICAL ORDER: Write SUMMARY.md → commit it → only then write narration. No text between Write and commit.
</sequential_execution>

Success criteria:
- All plan tasks executed with atomic commits
- SUMMARY.md created at .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-01-SUMMARY.md
- STATE.md and ROADMAP.md updated
- Return a compact report: tasks completed, commits made, SUMMARY.md path
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

</system-reminder>

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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/PROJECT.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/PROJECT.md</path>
<type>file</type>
<content>
1: # Hivemind — Runtime Composition Engine
2: 
3: **Phase 0 authority:** `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` locks canonical naming. Product = Hivemind. Package/bin = `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only.
4: 
5: ## What This Is
6: 
7: Hivemind is a **runtime composition engine** for OpenCode — an npm package (`hivemind`) providing tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. It makes agents genuinely intelligent through architecture: the **HIVE** (structure, hierarchy, delegation) and the **MIND** (memory, continuity, MEMS-BRAIN knowledge pieces). Not through bigger models — through compounding intelligence across sessions.
8: 
9: **Two halves:** Hard Harness (`src/` npm package) + Soft Meta-Concepts (`.opencode/` agents, skills, commands). State lives in `.hivemind/` (canonical per Q6).
10: 
11: ## Core Value
12: 
13: **Agents build on each other's work across sessions.** Without Hivemind, every session starts from zero. With it, decisions, patterns, and lessons compound. The human collaborates with agents across cognitive layers — the human provides intent and judgment, agents provide execution and pattern recognition.
14: 
15: ## Requirements
16: 
17: ### Validated
18: 
19: - ✓ TypeScript strict mode, ES2022, NodeNext modules — builds clean, 0 type errors
20: - ✓ 16 custom tools registered in plugin.ts with Zod schemas (CQRS write-side)
21: - ✓ 6 hook types registered (session.created, system.transform, messages.transform, shell.env, tool.execute.after, chat.system.transform)
22: - ✓ Dual-layer state: continuity.ts (durable JSON) + state.ts (in-memory Maps)
23: - ✓ 125 test files, 1767 tests, 90%+ coverage — gate-enforced
24: - ✓ Delegation hierarchy: L0 → L1 → L2 → L3 agent chain with CQRS boundaries
25: - ✓ Q6 state root: `.hivemind/` canonical, `.opencode/` primitives-only
26: - ✓ 89 agents, 123 active skill directories, 19 commands tracked in the current primitive inventory (source in `.hivefiver-meta-builder/`)
27: - ✓ 3 config modes: expert-advisor, hivemind-powered, free-style
28: - ✓ Behavioral profile system with mode dispatch
29: - ✓ 14 workflow toggles in configs.json (6 wired, 4 with @future-consumer, 4 deferred)
30: 
31: ### Active
32: 
33: - [ ] **Bootstrap/recovery**: `.opencode/` and `.hivemind/` must be restorable (postinstall script or CLI init)
34: - [ ] **Config consumer wiring**: Phase 0 config contract requires every active config field to have named consumers or explicit deferred/dead status
35: - [ ] **Dead code removal**: `messages-transform.ts` (67 LOC, confirmed dead in Phase 35)
36: - [ ] **Plugin.ts LOC reduction**: 447 LOC vs 100 LOC target — extract into dedicated hook/tool modules
37: - [ ] **12 stale modules**: document or wire (toggle-gates.ts, runtime-detection/, etc.)
38: - [ ] **f-04 auto-routing engine**: intent classification, command parsing, workflow routing (MISSING)
39: - [ ] **E2E tests**: all 1767 tests are unit — zero integration/E2E
40: - [ ] **Delegation hierarchy enforcement**: L0→L1→L2 depth not runtime-validated
41: - [ ] **`.hivemind/` state modules**: 19 subdirectories, only 2 have typed CRUD owners (continuity.ts, delegation-persistence.ts)
42: - [ ] **Lifecycle audit**: gate-l3-lifecycle-integration SKILL.md references/ directory is empty — criteria docs missing
43: - [ ] **Naming validation CI**: no automated check for hm-*/hf-*/gate-*/stack-* conventions
44: 
45: ### Out of Scope
46: 
47: - Sidecar GUI dashboard — WS-8 (DEFERRED, blocked on Core + Workflows completion)
48: - Graph-based delegation — GAP-22 (blocked on WS-5 delegation revamp)
49: - MCP tool registry — GAP-06 (blocked on WS-3 primitive registry)
50: - Full autonomy mode — Hivemind is collaborative by default; full autonomy available as option later
51: - GSD framework, BMAD methodology — Hivemind hosts them, doesn't embed them
52: - `.planning/` → `.hivemind/planning/` migration — D-2 OPEN, no schedule
53: 
54: ## Context
55: 
56: **Technical environment:** Node.js >= 20, TypeScript ^5.0 strict, ES2022 target, ESM, Zod v4 for schema validation, @opencode-ai/sdk ^1.14.28, @opencode-ai/plugin ^1.14.28 (peer), Bun optional for PTY. Vitest for testing with V8 coverage, thresholds enforced (85/72/85/85).
57: 
58: **Architecture:** CQRS pattern (tools = write-side, hooks = read-side). Plugin composition root at `plugin.ts`. 34 Lib modules, 6 hook files, 8 tool files, 16 schema-kernel files, 5 sidecar files. Max module: 500 LOC. No circular deps. `types.ts` is leaf — all modules depend outward.
59: 
60: **Prior work:** Project originated from oh-my-openagent (OMO) architecture study + harneess-experiment worktree. 71 milestone phases delivered core features (concurrency, delegation revamp, completion detection, PTY integration, session journal, lifecycle manager). WS-1 Restructuring consolidated into 3 themed workstreams (Core Architecture, Agent Workflows, User Experience). Core Architecture (CA-01 through CA-03) delivered configs schema, behavioral profiles, and toggle gate binding. Skill-ecosystem (SE-1 through SE-14) delivered 48/51 hm-* skills at ≥6/8 RICH-8 quality. Agent-synthesis (AS-0 through AS-11) delivered 89 agents with lineage classification.
61: 
62: **Known issues:** STATE.md claimed Phase 70-71 COMPLETE with no git evidence. 14 archived milestone phases still on disk. 2 empty workstreams (primitive-registry, bootstrap-cli-onboarding). `asString` duplicated in helpers.ts and continuity.ts. `storeCache` singleton prevents isolated testing in continuity.ts. `.hivemind/` git-track vs gitignore contradiction.
63: 
64: **User philosophy:** Hivemind is for "wanders-of-curiosity" — people who explore, not just execute. It optimizes for compounded learning, not throughput. The 5 pillars: Hierarchical Superiority, Collaborative Domains, Strategically Measurable, Iteratively Granular, Growing MEMS-BRAIN. The user envisions graph-based, hierarchical, domain-classified agent collaboration where complexity is "behind-scenes" and the front-facing context stays high-level.
65: 
66: ## Constraints
67: 
68: - **Tech stack**: Node.js >= 20, TypeScript strict, Zod v4, vitest — no new runtime deps without explicit gate
69: - **Module size**: 500 LOC max (target 300)
70: - **Lineage**: hm-* (product dev, STRICT), hf-* (meta-builder, FLEXIBLE), gate-* (quality, INTERNAL), stack-* (reference)
71: - **CQRS**: tools mutate, hooks observe — enforced by `hook-cqrs-boundary.ts`
72: - **State root**: `.hivemind/` for runtime state, `.opencode/` for primitives only (Q6)
73: - **Error prefix**: `[Harness]` on all thrown errors
74: - **Commit format**: `type(scope): description — why`
75: - **No hf-* skills in hm-* lineage** — STRICT binding
76: - **OpenCode runtime**: all features must work within OpenCode SDK surfaces — no standalone execution
77: 
78: ## Key Decisions
79: 
80: | Decision | Rationale | Outcome |
81: |----------|-----------|---------|
82: | Q1: Hybrid + Spec-Driven Runtime Detection | Deep codemap, file watcher, MCP tools, dependency graph | — Pending |
83: | Q2: Artifact-Focused Sidecar | Next.js 15 + @json-render/react, READ-ONLY canonical state | — Pending |
84: | Q3: Session Journal as Complement | Append-only event timeline, independent of continuity.ts | — Pending |
85: | Q4: MVP = 5 of 8 memory categories | Post-MVP = 3 with explicit gates | — Pending |
86: | Q5: Full RICH gate required | 0 of 25 skills pass today is honest status | — Pending |
87: | Q6: `.hivemind/` internal state root | One-way migration, `.opencode/` ONLY for primitives | ✓ Locked |
88: | D-CONF-05: configs.json loaded every session | Missing → defaults, invalid → warn, unknown → strip | ✓ Locked |
89: | D-BIND-03: every active config field must have consumer | Phase 0 config contract maps field consumers/status; unresolved fields must be wired or explicitly deferred | ⚠️ Revisit |
90: | P0-ID: Hivemind identity contract | Product Hivemind; package/bin `hivemind`; harness is project type; OpenCode is platform | ✓ Locked |
91: | D-CRUD-05: each `.hivemind/` dir has typed owner | Only 2/19 dirs have owners | ⚠️ Revisit |
92: | D-WS-01: 5→3 themed workstreams | Core Architecture → Agent Workflows → User Experience | ✓ Good |
93: 
94: ---
95: *Last updated: 2026-05-07 after Phase 0 governance baseline*

(End of file - total 95 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-CONTEXT.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_wrF3hGmTQSU1fr8mRDbx7058"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8aDTQ4WPSWNmhcfDrtQB2745"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md</path>
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

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/01-boot-task-list-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/02-phase-0-governance-progress-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/03-sr-decisions-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/04-accumulated-context-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/05-next-actions-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/state-history/06-delivered-components-2026-05-11.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_WlWuGyUIDBTw8pS6JBpX3674"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_FwxD80XvIVqzdkrUmEsx8216"
}
```


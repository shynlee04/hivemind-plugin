---
sessionID: ses_1e7df6e7dffeuoHMHJggIuqMry
created: 2026-05-11T17:40:48.168Z
updated: 2026-05-11T17:40:48.168Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: 12 "with these including context and the analysis from debugssion /Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/01-EVIDENCE-MATRIX.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/02-SOURCE-DEFECTS.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/03-TOOL-GAPS.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/04-REVIEW-FINDINGS-STATUS.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/05-DISK-EVIDENCE-SAMPLES.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-DISCUSSION-LOG.md " (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: 
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
10: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
11: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
12: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
13: </required_reading>
14: 
15: <available_agent_types>
16: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
17: - gsd-phase-researcher — Researches technical approaches for a phase
18: - gsd-pattern-mapper — Analyzes codebase for existing patterns, produces PATTERNS.md
19: - gsd-planner — Creates detailed plans from phase scope
20: - gsd-plan-checker — Reviews plan quality before execution
21: </available_agent_types>
22: 
23: <process>
24: 
25: ## 0. Git Branch Invariant
26: 
27: **Do not create, rename, or switch git branches during plan-phase.** Branch identity is established at discuss-phase and is owned by the user's git workflow. A phase rename in ROADMAP.md is a plan-level change only — it does not mutate git branch names. If `phase_slug` in the init JSON differs from the current branch name, that is expected and correct; leave the branch unchanged.
28: 
29: ## 1. Initialize
30: 
31: Load all context in one call (paths only to minimize orchestrator context):
32: 
33: ```bash
34: INIT=$(gsd-sdk query init.plan-phase "$PHASE")
35: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
36: AGENT_SKILLS_RESEARCHER=$(gsd-sdk query agent-skills gsd-phase-researcher)
37: AGENT_SKILLS_PLANNER=$(gsd-sdk query agent-skills gsd-planner)
38: AGENT_SKILLS_CHECKER=$(gsd-sdk query agent-skills gsd-plan-checker)
39: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
40: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
41: MVP_MODE_CFG=$(gsd-sdk query config-get workflow.mvp_mode 2>/dev/null || echo "false")
42: ```
43: 
44: When `TDD_MODE` is `true`, the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The planner's `<required_reading>` is extended to include `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` so gate enforcement rules are available during planning.
45: 
46: When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardless of recency (e.g., Phase 7 declaring `Depends on: Phase 2` always sees Phase 2's context). Bounded recency keeps the planner's context budget focused on recent work.
47: 
48: Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
49: 
50: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
51: 
52: **File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.
53: 
54: **If `planning_exists` is false:** Error — run `/gsd-new-project` first.
55: 
56: ## 2. Parse and Normalize Arguments
57: 
58: Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--reviews`, `--text`, `--bounce`, `--skip-bounce`, `--chunked`, `--mvp`).
59: 
60: **`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only — the planner spawn (step 8), plan-checker, verification, gaps, bounce, and post-planning-gaps blocks all skip on `RESEARCH_ONLY`. Use this for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `/gsd-research-phase` command.
61: 
62: In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:
63: 
64: - **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
65: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.
66: 
67: ```bash
68: RESEARCH_ONLY=false
69: VIEW_ONLY=false
70: if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
71:   RESEARCH_ONLY=true
72:   PHASE="${BASH_REMATCH[1]}"
73: fi
74: if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
75:   VIEW_ONLY=true
76: fi
77: ```
78: 
79: Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for Claude Code remote sessions (`/rc` mode) where TUI menus don't work through the the agent App.
80: 
81: **MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-implement the chain.
82: 
83: ```bash
84: MVP_FLAG_ARG=""
85: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
86: ```
87: 
88: Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation).
89: The verb returns `true|false`. Full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostics. The mode is **all-or-nothing per phase** (PRD decision Q1) — never selective per task.
90: 
91: **Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:
92: 
93: ```bash
94: WALKING_SKELETON=false
95: if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
96:   PRIOR_SUMMARIES=$(gsd-sdk query phases.list --pick summaries_total 2>/dev/null || echo "0")
97:   if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
98: fi
99: ```
100: 
101: When `WALKING_SKELETON=true`:
102: - Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md`.
103: - The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.
104: 
105: **Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are active on Phase 1 of a new project, the planner receives `WALKING_SKELETON=true` and PRD-derived context simultaneously — the PRD informs *what the skeleton should prove*. No precedence is needed; the two signals are orthogonal. See [`references/mvp-concepts.md`](../references/mvp-concepts.md) for the broader interaction map.
106: 
107: Extract `--prd <filepath>` from $ARGUMENTS. If present, set PRD_FILE to the filepath.
108: 
109: **If no phase number:** Detect next unplanned phase from roadmap.
110: 
111: **If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `phase_slug` and `padded_phase` from init:
112: ```bash
113: mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
114: ```
115: 
116: **Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.
117: 
118: Set `CHUNKED_MODE` from flag or config:
119: ```bash
120: CHUNKED_CFG=$(gsd-sdk query config-get workflow.plan_chunked 2>/dev/null || echo "false")
121: CHUNKED_MODE=false
122: if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
123:   CHUNKED_MODE=true
124: fi
125: ```
126: 
127: ## 2.5. Validate `--reviews` Prerequisite
128: 
129: **Skip if:** No `--reviews` flag.
130: 
131: **If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.
132: 
133: **If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**
134: 
135: Error:
136: ```
137: No REVIEWS.md found for Phase {N}. Run reviews first:
138: 
139: /gsd-review --phase {N}
140: 
141: Then re-run /gsd-plan-phase {N} --reviews
142: ```
143: Exit workflow.
144: 
145: ## 3. Validate Phase
146: 
147: ```bash
148: PHASE_INFO=$(gsd-sdk query roadmap.get-phase "${PHASE}")
149: ```
150: 
151: **If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.
152: 
153: Now that `PHASE` is finalized, resolve MVP mode:
154: ```bash
155: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)
156: ```
157: 
158: ## 3.5. Handle PRD Express Path
159: 
160: **Skip if:** No `--prd` flag in arguments.
161: 
162: **If `--prd <filepath>` provided:**
163: 
164: 1. Read the PRD file:
165: ```bash
166: PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
167: if [ -z "$PRD_CONTENT" ]; then
168:   echo "Error: PRD file not found: $PRD_FILE"
169:   exit 1
170: fi
171: ```
172: 
173: 2. Display banner:
174: ```
175: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
176:  GSD ► PRD EXPRESS PATH
177: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
178: 
179: Using PRD: {PRD_FILE}
180: Generating CONTEXT.md from requirements...
181: ```
182: 
183: 3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
184:    - Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
185:    - Map each to a locked decision (everything in the PRD is treated as a locked decision)
186:    - Identify any areas the PRD doesn't cover and mark as "the agent's Discretion"
187:    - **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
188:    - Create CONTEXT.md in the phase directory
189: 
190: 4. Write CONTEXT.md:
191: ```markdown
192: # Phase [X]: [Name] - Context
193: 
194: **Gathered:** [date]
195: **Status:** Ready for planning
196: **Source:** PRD Express Path ({PRD_FILE})
197: 
198: <domain>
199: ## Phase Boundary
200: 
201: [Extracted from PRD — what this phase delivers]
202: 
203: </domain>
204: 
205: <decisions>
206: ## Implementation Decisions
207: 
208: {For each requirement/story/criterion in the PRD:}
209: ### [Category derived from content]
210: - [Requirement as locked decision]
211: 
212: ### the agent's Discretion
213: [Areas not covered by PRD — implementation details, technical choices]
214: 
215: </decisions>
216: 
217: <canonical_refs>
218: ## Canonical References
219: 
220: **Downstream agents MUST read these before planning or implementing.**
221: 
222: [MANDATORY. Extract from ROADMAP.md and any docs referenced in the PRD.
223: Use full relative paths. Group by topic area.]
224: 
225: ### [Topic area]
226: - `path/to/spec-or-adr.md` — [What it decides/defines]
227: 
228: [If no external specs: "No external specs — requirements fully captured in decisions above"]
229: 
230: </canonical_refs>
231: 
232: <specifics>
233: ## Specific Ideas
234: 
235: [Any specific references, examples, or concrete requirements from PRD]
236: 
237: </specifics>
238: 
239: <deferred>
240: ## Deferred Ideas
241: 
242: [Items in PRD explicitly marked as future/v2/out-of-scope]
243: [If none: "None — PRD covers phase scope"]
244: 
245: </deferred>
246: 
247: ---
248: 
249: *Phase: XX-name*
250: *Context gathered: [date] via PRD Express Path*
251: ```
252: 
253: 5. Commit:
254: ```bash
255: gsd-sdk query commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
256: ```
257: 
258: 6. Set `context_content` to the generated CONTEXT.md content and continue to step 5 (Handle Research).
259: 
260: **Effect:** This completely bypasses step 4 (Load CONTEXT.md) since we just created it. The rest of the workflow (research, planning, verification) proceeds normally with the PRD-derived context.
261: 
262: ## 4. Load CONTEXT.md
263: 
264: **Skip if:** PRD express path was used (CONTEXT.md already created in step 3.5).
265: 
266: Check `context_path` from init JSON.
267: 
268: If `context_path` is not null, display: `Using phase context from: ${context_path}`
269: 
270: **If `context_path` is null (no CONTEXT.md exists):**
271: 
272: Read discuss mode for context gate label:
273: ```bash
274: DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
275: ```
276: 
277: If `TEXT_MODE` is true, present as a plain-text numbered list:
278: ```
279: No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included.
280: 
281: 1. Continue without context — Plan using research + requirements only
282: [If DISCUSS_MODE is "assumptions":]
283: 2. Gather context (assumptions mode) — Analyze codebase and surface assumptions before planning
284: [If DISCUSS_MODE is "discuss" or unset:]
285: 2. Run discuss-phase first — Capture design decisions before planning
286: 
287: Enter number:
288: ```
289: 
290: Otherwise use question:
291: - header: "No context"
292: - question: "No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
293: - options:
294:   - "Continue without context" — Plan using research + requirements only
295:   If `DISCUSS_MODE` is `"assumptions"`:
296:   - "Gather context (assumptions mode)" — Analyze codebase and surface assumptions before planning
297:   If `DISCUSS_MODE` is `"discuss"` (or unset):
298:   - "Run discuss-phase first" — Capture design decisions before planning
299: 
300: If "Continue without context": Proceed to step 5.
301: If "Run discuss-phase first":
302:   **IMPORTANT:** Do NOT invoke discuss-phase as a nested Skill/Task call — question
303:   does not work correctly in nested subcontexts (#1009). Instead, display the command
304:   and exit so the user runs it as a top-level command:
305:   ```
306:   Run this command first, then re-run /gsd-plan-phase {X} ${GSD_WS}:
307: 
308:   /gsd-discuss-phase {X} ${GSD_WS}
309:   ```
310:   **Exit the plan-phase workflow. Do not continue.**
311: 
312: ## 4.5. Check AI-SPEC
313: 
314: **Skip if:** `ai_integration_phase_enabled` from config is false, or `--skip-ai-spec` flag provided.
315: 
316: ```bash
317: AI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-AI-SPEC.md 2>/dev/null | head -1)
318: AI_PHASE_CFG=$(gsd-sdk query config-get workflow.ai_integration_phase 2>/dev/null || echo "true")
319: ```
320: 
321: **Skip if `AI_PHASE_CFG` is `false`.**
322: 
323: **If `AI_SPEC_FILE` is empty:** Check phase goal for AI keywords:
324: ```bash
325: echo "${phase_goal}" | grep -qi "agent\|llm\|rag\|chatbot\|embedding\|langchain\|llamaindex\|crewai\|langgraph\|openai\|anthropic\|vector\|eval\|ai system"
326: ```
327: 
328: **If AI keywords detected AND no AI-SPEC.md:**
329: ```
330: ◆ Note: This phase appears to involve AI system development.
331:   Consider running /gsd-ai-integration-phase {N} before planning to:
332:   - Select the right framework for your use case
333:   - Research its docs and best practices
334:   - Design an evaluation strategy
335: 
336:   Continue planning without AI-SPEC? (non-blocking — /gsd-ai-integration-phase can be run after)
337: ```
338: 
339: Use question with options:
340: - "Continue — plan without AI-SPEC"
341: - "Stop — I'll run /gsd-ai-integration-phase {N} first"
342: 
343: If "Stop": Exit with `/gsd-ai-integration-phase {N}` reminder.
344: If "Continue": Proceed. (Non-blocking — planner will note AI-SPEC is absent.)
345: 
346: **If `AI_SPEC_FILE` is non-empty:** Extract framework for planner context:
347: ```bash
348: FRAMEWORK_LINE=$(grep "Selected Framework:" "${AI_SPEC_FILE}" | head -1)
349: ```
350: Pass `ai_spec_path` and `framework_line` to planner in step 7 so it can reference the AI design contract.
351: 
352: ## 5. Handle Research
353: 
354: **Skip if:** `--gaps` flag or `--skip-research` flag or `--reviews` flag.
355: 
356: ### 5.0. Research-Only Modifiers (`--view`, `--research`, prompt)
357: 
358: **Skip if:** `RESEARCH_ONLY` is `false`.
359: 
360: Three branches in research-only mode (`--research-phase <N>`):
361: 
362: 1. **`--view`** (or user picks "View" in the prompt below): print `RESEARCH.md` to stdout, no spawn, exit. If `RESEARCH.md` is missing, error with: `--view requires an existing RESEARCH.md; drop --view to spawn the researcher.`
363: 2. **`--research`** (force-refresh): re-spawn researcher unconditionally — fall through to "Spawn gsd-phase-researcher" below.
364: 3. **Neither flag AND `has_research=true`:** emit `RESEARCH.md already exists for Phase ${PHASE}.` and prompt the user with three choices: `1. Update — re-spawn researcher and refresh RESEARCH.md`, `2. View — print existing RESEARCH.md and exit (no spawn)`, `3. Skip — exit without spawning or printing`. Map "Update" → fall through to spawn, "View" → set `VIEW_ONLY=true` and emit RESEARCH.md as in (1), "Skip" → exit cleanly. Mirrors the deleted `/gsd-research-phase` standalone's existing-artifact menu (#3042 parity).
365: 
366: ```bash
367: if [[ "$VIEW_ONLY" == "true" ]]; then
368:   [[ -f "$research_path" ]] || { echo "Error: --view requires an existing RESEARCH.md (Phase ${PHASE}). Drop --view to spawn the researcher."; exit 1; }
369:   cat "$research_path"; exit 0
370: fi
371: ```
372: 
373: ### 5.1. Standard Research Decision
374: 
375: **Skip if** `RESEARCH_ONLY=true` (the research-only mode in 5.0 already determined the path: spawn or exit). Without this guard, an LLM following the workflow could fall through into "use existing, skip to step 6" → planner spawn, violating the research-only contract. **CR #3045 finding: this gate makes the early-exit unreachable from any non-research-only branch.**
376: 
377: **If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.
378: 
379: **If RESEARCH.md missing OR `--research` flag:**
380: 
381: **If no explicit flag (`--research` or `--skip-research`) and not `--auto`:**
382: Ask the user whether to research, with a contextual recommendation based on the phase:
383: 
384: If `TEXT_MODE` is true, present as a plain-text numbered list:
385: ```
386: Research before planning Phase {X}: {phase_name}?
387: 
388: 1. Research first (Recommended) — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
389: 2. Skip research — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.
390: 
391: Enter number:
392: ```
393: 
394: Otherwise use question:
395: ```
396: question([
397:   {
398:     question: "Research before planning Phase {X}: {phase_name}?",
399:     header: "Research",
400:     multiSelect: false,
401:     options: [
402:       { label: "Research first (Recommended)", description: "Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes." },
403:       { label: "Skip research", description: "Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks." }
404:     ]
405:   }
406: ])
407: ```
408: 
409: If user selects "Skip research": skip to step 6.
410: 
411: **If `--auto` and `research_enabled` is false:** Skip research silently (preserves automated behavior).
412: 
413: Display banner:
414: ```
415: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
416:  GSD ► RESEARCHING PHASE {X}
417: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
418: 
419: ◆ Spawning researcher...
420: ```
421: 
422: ### Spawn gsd-phase-researcher
423: 
424: ```bash
425: PHASE_DESC=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section)
426: ```
427: 
428: Research prompt:
429: 
430: ```markdown
431: <objective>
432: Research how to implement Phase {phase_number}: {phase_name}
433: Answer: "What do I need to know to PLAN this phase well?"
434: </objective>
435: 
436: <files_to_read>
437: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
438: - {requirements_path} (Project requirements)
439: - {state_path} (Project decisions and history)
440: </files_to_read>
441: 
442: ${AGENT_SKILLS_RESEARCHER}
443: 
444: <additional_context>
445: **Phase description:** {phase_description}
446: **Phase requirement IDs (MUST address):** {phase_req_ids}
447: 
448: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
449: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns
450: </additional_context>
451: 
452: <output>
453: Write to: {phase_dir}/{phase_num}-RESEARCH.md
454: </output>
455: ```
456: 
457: ```
458: Agent(
459:   prompt=research_prompt,
460:   subagent_type="gsd-phase-researcher",
461:   model="{researcher_model}",
462:   description="Research Phase {phase}"
463: )
464: ```
465: 
466: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
467: 
468: ### Handle Researcher Return
469: 
470: - **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 6
471: - **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort
472: 
473: ### Research-Only Early Exit (`--research-phase`)
474: 
475: **Skip if:** `RESEARCH_ONLY` is `false` (the default).
476: 
477: **If `RESEARCH_ONLY=true`:** the user invoked `/gsd-plan-phase --research-phase <N>` for research-only mode. Do **not** continue to Section 5.5+ (validation strategy, planner, plan-checker, verification, gaps, bounce, post-planning-gaps). Print the research-complete summary and exit cleanly:
478: 
479: ```text
480: ✓ Research-only mode complete (#3042)
481: 
482:   Phase:       ${PHASE}
483:   RESEARCH.md: ${research_path}
484: 
485: Re-run /gsd-plan-phase ${PHASE} to plan the phase using this research,
486: or /gsd-plan-phase ${PHASE} --research to refresh research and plan.
487: ```
488: 
489: This exits the workflow. The planner / plan-checker / verifier blocks below are skipped.
490: 
491: ## 5.5. Create Validation Strategy
492: 
493: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
494: 
495: If `research_enabled` is false and `nyquist_validation_enabled` is true: warn "Nyquist validation enabled but research disabled — VALIDATION.md cannot be created without RESEARCH.md. Plans will lack validation requirements (Dimension 8)." Continue to step 6.
496: 
497: **But Nyquist is not applicable for this run** when all of the following are true:
498: - `research_enabled` is false
499: - `has_research` is false
500: - no `--research` flag was provided
501: 
502: In that case: **skip validation-strategy creation entirely**. Do **not** expect `RESEARCH.md` or `VALIDATION.md` for this run, and continue to Step 6.
503: 
504: ```bash
505: grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null || true
506: ```
507: 
508: **If found:**
509: 1. Read template: `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
510: 2. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md` (use Write tool)
511: 3. Fill frontmatter: `{N}` → phase number, `{phase-slug}` → slug, `{date}` → current date
512: 4. Verify:
513: ```bash
514: test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
515: ```
516: 5. If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6
517: 6. If `commit_docs`: `commit "docs(phase-${PHASE}): add validation strategy"`
518: 
519: **If not found:** Warn and continue — plans may fail Dimension 8.
520: 
521: ## 5.55. Security Threat Model Gate
522: 
523: > Skip if `workflow.security_enforcement` is explicitly `false`. Absent = enabled.
524: 
525: ```bash
526: SECURITY_CFG=$(gsd-sdk query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
527: SECURITY_ASVS=$(gsd-sdk query config-get workflow.security_asvs_level --raw 2>/dev/null || echo "1")
528: SECURITY_BLOCK=$(gsd-sdk query config-get workflow.security_block_on --raw 2>/dev/null || echo "high")
529: ```
530: 
531: **If `SECURITY_CFG` is `false`:** Skip to step 5.6.
532: 
533: **If `SECURITY_CFG` is `true`:** Display banner:
534: 
535: ```
536: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
537:  GSD ► SECURITY THREAT MODEL REQUIRED (ASVS L{SECURITY_ASVS})
538: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
539: 
540: Each PLAN.md must include a <threat_model> block.
541: Block on: {SECURITY_BLOCK} severity threats.
542: Opt out: set security_enforcement: false in .planning/config.json
543: ```
544: 
545: Continue to step 5.6. Security config is passed to the planner in step 8.
546: 
547: ## 5.6. UI Design Contract Gate
548: 
549: > Skip if `workflow.ui_phase` is explicitly `false` AND `workflow.ui_safety_gate` is explicitly `false` in `.planning/config.json`. If keys are absent, treat as enabled.
550: 
551: ```bash
552: UI_PHASE_CFG=$(gsd-sdk query config-get workflow.ui_phase 2>/dev/null || echo "true")
553: UI_GATE_CFG=$(gsd-sdk query config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
554: ```
555: 
556: **If both are `false`:** Skip to step 6.
557: 
558: Check if phase has frontend indicators:
559: 
560: ```bash
561: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" 2>/dev/null)
562: echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
563: HAS_UI=$?
564: ```
565: 
566: **If `HAS_UI` is 0 (frontend indicators found):**
567: 
568: Check for existing UI-SPEC:
569: ```bash
570: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
571: ```
572: 
573: **If UI-SPEC.md found:** Set `UI_SPEC_PATH=$UI_SPEC_FILE`. Display: `Using UI design contract: ${UI_SPEC_PATH}`
574: 
575: **If UI-SPEC.md missing AND `--skip-ui` flag is present in $ARGUMENTS:** Skip silently to step 6.
576: 
577: **If UI-SPEC.md missing AND `UI_GATE_CFG` is `true`:**
578: 
579: Read ephemeral chain flag (same field as `check.auto-mode` → `auto_chain_active`):
580: ```bash
581: AUTO_CHAIN=$(gsd-sdk query check auto-mode --pick auto_chain_active 2>/dev/null || echo "false")
582: ```
583: 
584: **If `AUTO_CHAIN` is `true` (running inside a `--chain` or `--auto` pipeline):**
585: 
586: Auto-generate UI-SPEC without prompting:
587: ```
588: Skill(skill="gsd-ui-phase", args="${PHASE} --auto ${GSD_WS}")
589: ```
590: After `gsd-ui-phase` returns, re-read:
591: ```bash
592: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
593: UI_SPEC_PATH="${UI_SPEC_FILE}"
594: ```
595: Continue to step 6.
596: 
597: **If `AUTO_CHAIN` is `false` (manual invocation):**
598: 
599: Output this markdown directly (not as a code block):
600: 
601: ```
602: ## ⚠ UI-SPEC.md missing for Phase {N}
603: ▶ Recommended next step:
604: `/gsd-ui-phase {N} ${GSD_WS}` — generate UI design contract before planning
605: ───────────────────────────────────────────────
606: Also available:
607: - `/gsd-plan-phase {N} --skip-ui ${GSD_WS}` — plan without UI-SPEC (not recommended for frontend phases)
608: ```
609: 
610: **Exit the plan-phase workflow. Do not continue.**
611: 
612: **If `HAS_UI` is 1 (no frontend indicators):** Skip silently to step 5.7.
613: 
614: ## 5.7. Schema Push Detection Gate
615: 
616: > Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.
617: 
618: Check if any files in the phase scope match schema patterns:
619: 
620: ```bash
621: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
622: ```
623: 
624: Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:
625: 
626: | ORM | File Patterns |
627: |-----|--------------|
628: | Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
629: | Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
630: | Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
631: | Supabase | `supabase/migrations/*.sql` |
632: | TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |
633: 
634: Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.
635: 
636: **If schema-relevant files detected:**
637: 
638: Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.
639: 
640: Determine the push command for the detected ORM:
641: 
642: | ORM | Push Command | Non-TTY Workaround |
643: |-----|-------------|-------------------|
644: | Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
645: | Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
646: | Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
647: | Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
648: | TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |
649: 
650: Inject the following into the planner prompt (step 8) as an additional constraint:
651: 
652: ```markdown
653: <schema_push_requirement>
654: **[BLOCKING] Schema Push Required**
655: 
656: This phase modifies schema-relevant files ({detected_files}). The planner MUST include
657: a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
658: modifications are complete but BEFORE verification.
659: 
660: - ORM detected: {SCHEMA_ORM}
661: - Push command: {push_command}
662: - Non-TTY workaround: {env_hint}
663: - If push requires interactive prompts that cannot be suppressed, flag the task for
664:   manual intervention with `autonomous: false`
665: 
666: This task is mandatory — the phase CANNOT pass verification without it. Build and
667: type checks will pass without the push (types come from config, not the live database),
668: creating a false-positive verification state.
669: </schema_push_requirement>
670: ```
671: 
672: Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`
673: 
674: **If no schema-relevant files detected:** Skip silently to step 6.
675: 
676: ## 6. Check Existing Plans
677: 
678: ```bash
679: ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
680: ```
681: 
682: **If exists AND `--reviews` flag:** Skip prompt — go straight to replanning (the purpose of `--reviews` is to replan with review feedback).
683: 
684: **If exists AND no `--reviews` flag:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.
685: 
686: ## 7. Use Context Paths from INIT
687: 
688: Extract from INIT JSON:
689: 
690: ```bash
691: _gsd_field() { node -e "const o=JSON.parse(process.argv[1]); const v=o[process.argv[2]]; process.stdout.write(v==null?'':String(v))" "$1" "$2"; }
692: STATE_PATH=$(_gsd_field "$INIT" state_path)
693: ROADMAP_PATH=$(_gsd_field "$INIT" roadmap_path)
694: REQUIREMENTS_PATH=$(_gsd_field "$INIT" requirements_path)
695: RESEARCH_PATH=$(_gsd_field "$INIT" research_path)
696: VERIFICATION_PATH=$(_gsd_field "$INIT" verification_path)
697: UAT_PATH=$(_gsd_field "$INIT" uat_path)
698: CONTEXT_PATH=$(_gsd_field "$INIT" context_path)
699: REVIEWS_PATH=$(_gsd_field "$INIT" reviews_path)
700: PATTERNS_PATH=$(_gsd_field "$INIT" patterns_path)
701: 
702: # Detect spike/sketch findings skills (project-local)
703: SPIKE_FINDINGS_PATH=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
704: SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
705: ```
706: 
707: ## 7.5. Verify Nyquist Artifacts
708: 
709: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
710: 
711: Also skip if all of the following are true:
712: - `research_enabled` is false
713: - `has_research` is false
714: - no `--research` flag was provided
715: 
716: In that no-research path, Nyquist artifacts are **not required** for this run.
717: 
718: ```bash
719: VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
720: ```
721: 
722: If missing and Nyquist is still enabled/applicable — ask user:
723: 1. Re-run: `/gsd-plan-phase {PHASE} --research ${GSD_WS}`
724: 2. Disable Nyquist with the exact command:
725:    `gsd-sdk query config-set workflow.nyquist_validation false`
726: 3. Continue anyway (plans fail Dimension 8)
727: 
728: Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled) only if user selects 2 or 3.
729: 
730: ## 7.8. Spawn gsd-pattern-mapper Agent (Optional)
731: 
732: **Skip if** `workflow.pattern_mapper` is explicitly set to `false` in config.json (absent key = enabled). Also skip if no CONTEXT.md and no RESEARCH.md exist for this phase (nothing to extract file lists from).
733: 
734: Check config:
735: ```bash
736: PATTERN_MAPPER_CFG=$(gsd-sdk query config-get workflow.pattern_mapper 2>/dev/null || echo "true")
737: ```
738: 
739: **If `PATTERN_MAPPER_CFG` is `false`:** Skip to step 8.
740: 
741: **If PATTERNS.md already exists** (`PATTERNS_PATH` is non-empty from step 7): Skip to step 8 (use existing).
742: 
743: Display banner:
744: ```
745: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
746:  GSD ► PATTERN MAPPING PHASE {X}
747: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
748: 
749: ◆ Spawning pattern mapper...
750: ```
751: 
752: Pattern mapper prompt:
753: 
754: ```markdown
755: <pattern_mapping_context>
756: **Phase:** {phase_number} - {phase_name}
757: **Phase directory:** {phase_dir}
758: **Padded phase:** {padded_phase}
759: 
760: <files_to_read>
761: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
762: - {research_path} (Technical Research)
763: </files_to_read>
764: 
765: **Output file:** {phase_dir}/{padded_phase}-PATTERNS.md
766: 
767: Extract the list of files to be created/modified from CONTEXT.md and RESEARCH.md. For each file, classify by role and data flow, find the closest existing analog in the codebase, extract concrete code excerpts, and produce PATTERNS.md.
768: </pattern_mapping_context>
769: ```
770: 
771: Spawn with:
772: ```
773: Agent(
774:   prompt="{above}",
775:   subagent_type="gsd-pattern-mapper",
776:   model="{researcher_model}",
777: )
778: ```
779: 
780: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
781: 
782: **Handle return:**
783: - **`## PATTERN MAPPING COMPLETE`:** Update `PATTERNS_PATH` to the created file path, continue to step 8.
784: - **Any error or empty return:** Log warning, continue to step 8 without patterns (non-blocking).
785: 
786: After pattern mapper completes, update the path variable:
787: ```bash
788: PATTERNS_PATH="${PHASE_DIR}/${PADDED_PHASE}-PATTERNS.md"
789: ```
790: 
791: ## 8. Spawn gsd-planner Agent
792: 
793: Display banner:
794: ```
795: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
796:  GSD ► PLANNING PHASE {X}
797: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
798: 
799: ◆ Spawning planner...
800: ```
801: 
802: Planner prompt:
803: 
804: ```markdown
805: <planning_context>
806: **Phase:** {phase_number}
807: **Mode:** {standard | gap_closure | reviews}
808: 
809: <files_to_read>
810: - {state_path} (Project State)
811: - {roadmap_path} (Roadmap)
812: - {requirements_path} (Requirements)
813: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
814: - {research_path} (Technical Research)
815: - {PATTERNS_PATH} (Pattern Map — analog files and code excerpts, if exists)
816: - {verification_path} (Verification Gaps - if --gaps)
817: - {uat_path} (UAT Gaps - if --gaps)
818: - {reviews_path} (Cross-AI Review Feedback - if --reviews)
819: - {UI_SPEC_PATH} (UI Design Contract — visual/interaction specs, if exists)
820: - {SPIKE_FINDINGS_PATH} (Spike Findings — validated patterns, constraints, landmines from experiments, if exists)
821: - {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction, if exists)
822: ${CONTEXT_WINDOW >= 500000 ? `
823: **Cross-phase context (1M model enrichment):**
824: - CONTEXT.md files from the 3 most recent completed phases (locked decisions — maintain consistency)
825: - SUMMARY.md files from the 3 most recent completed phases (what was built — reuse patterns, avoid duplication)
826: - LEARNINGS.md files from the 3 most recent completed phases (structured decisions, patterns, lessons, surprises — skip silently if a phase has no LEARNINGS.md; prefix each block with \`[from Phase N LEARNINGS]\` for source attribution; if total size exceeds 15% of context budget, drop oldest first)
827: - CONTEXT.md, SUMMARY.md, and LEARNINGS.md from any phases listed in the current phase's "Depends on:" field in ROADMAP.md (regardless of recency — explicit dependencies always load, deduplicated against the 3 most recent)
828: - Skip all other prior phases to stay within context budget
829: ` : ''}
830: </files_to_read>
831: 
832: ${AGENT_SKILLS_PLANNER}
833: 
834: **Phase requirement IDs (every ID MUST appear in a plan's `requirements` field):** {phase_req_ids}
835: 
836: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
837: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
838: 
839: ${TDD_MODE === 'true' ? `
840: <tdd_mode_active>
841: **TDD Mode is ENABLED.** Apply TDD heuristics from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md to all eligible tasks:
842: - Business logic with defined I/O → type: tdd
843: - API endpoints with request/response contracts → type: tdd
844: - Data transformations, validation, algorithms → type: tdd
845: - UI, config, glue code, CRUD → standard plan (type: execute)
846: Each TDD plan gets one feature with RED/GREEN/REFACTOR gate sequence.
847: </tdd_mode_active>
848: ` : ''}
849: 
850: **MVP_MODE:** ${MVP_MODE} (when true, follow vertical-slice rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md`; when false, ignore MVP guidance entirely.)
851: **WALKING_SKELETON:** ${WALKING_SKELETON} (when true, the first deliverable must be a Walking Skeleton — produce SKELETON.md alongside PLAN.md.)
852: 
853: ${MVP_MODE === 'true' ? `
854: <mvp_mode_active>
855: **MVP Mode is ENABLED.** Follow vertical-slice planning rules from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md. Each plan must deliver a complete vertical slice — thin end-to-end functionality rather than horizontal layers.
856: </mvp_mode_active>
857: ` : ''}
858: </planning_context>
859: 
860: <downstream_consumer>
861: Output consumed by /gsd-execute-phase. Plans need:
862: - Frontmatter (wave, depends_on, files_modified, autonomous)
863: - Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY on every task)
864: - Verification criteria
865: - must_haves for goal-backward verification
866: </downstream_consumer>
867: 
868: <deep_work_rules>
869: ## Anti-Shallow Execution Rules (MANDATORY)
870: 
871: Every task MUST include these fields — they are NOT optional:
872: 
873: 1. **`<read_first>`** — Files the executor MUST read before touching anything. Always include:
874:    - The file being modified (so executor sees current state, not assumptions)
875:    - Any "source of truth" file referenced in CONTEXT.md (reference implementations, existing patterns, config files, schemas)
876:    - Any file whose patterns, signatures, types, or conventions must be replicated or respected
877: 
878: 2. **`<acceptance_criteria>`** — Verifiable conditions that prove the task was done correctly. Rules:
879:    - Every criterion must be checkable with grep, file read, test command, or CLI output
880:    - NEVER use subjective language ("looks correct", "properly configured", "consistent with")
881:    - ALWAYS include exact strings, patterns, values, or command outputs that must be present
882:    - Examples:
883:      - Code: `auth.py contains def verify_token(` / `test_auth.py exits 0`
884:      - Config: `.env.example contains DATABASE_URL=` / `Dockerfile contains HEALTHCHECK`
885:      - Docs: `README.md contains '## Installation'` / `API.md lists all endpoints`
886:      - Infra: `deploy.yml has rollback step` / `docker-compose.yml has healthcheck for db`
887: 
888: 3. **`<action>`** — Must include CONCRETE values, not references. Rules:
889:    - NEVER say "align X with Y", "match X to Y", "update to be consistent" without specifying the exact target state
890:    - ALWAYS include the actual values: config keys, function signatures, SQL statements, class names, import paths, env vars, etc.
891:    - If CONTEXT.md has a comparison table or expected values, copy them into the action verbatim
892:    - The executor should be able to complete the task from the action text alone, without needing to read CONTEXT.md or reference files (read_first is for verification, not discovery)
893: 
894: **Why this matters:** Executor agents work from the plan text. Vague instructions like "update the config to match production" produce shallow one-line changes. Concrete instructions like "add DATABASE_URL=postgresql://... , set POOL_SIZE=20, add REDIS_URL=redis://..." produce complete work. The cost of verbose plans is far less than the cost of re-doing shallow execution.
895: </deep_work_rules>
896: 
897: <quality_gate>
898: - [ ] PLAN.md files created in phase directory
899: - [ ] Each plan has valid frontmatter
900: - [ ] Tasks are specific and actionable
901: - [ ] Every task has `<read_first>` with at least the file being modified
902: - [ ] Every task has `<acceptance_criteria>` with grep-verifiable conditions
903: - [ ] Every `<action>` contains concrete values (no "align X with Y" without specifying what)
904: - [ ] Dependencies correctly identified
905: - [ ] Waves assigned for parallel execution
906: - [ ] must_haves derived from phase goal
907: </quality_gate>
908: ```
909: 
910: **If `CHUNKED_MODE` is `false` (default):** Spawn the planner as a single long-lived Agent:
911: 
912: ```text
913: Agent(
914:   prompt=filled_prompt,
915:   subagent_type="gsd-planner",
916:   model="{planner_model}",
917:   description="Plan Phase {phase}"
918: )
919: ```
920: 
921: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
922: 
923: **If `CHUNKED_MODE` is `true`:** Skip the Agent() call above — proceed to step 8.5 instead.
924: 
925: ## 8.5. Chunked Planning Mode
926: 
927: **Skip if `CHUNKED_MODE` is `false`.**
928: 
929: Chunked mode splits the single long-lived planner Agent run into a short outline Agent run followed by
930: N short per-plan Agent runs. Each run is bounded to ~3–5 min; each plan is committed individually
931: for crash resilience. If any run hangs and the terminal is force-killed, rerunning
932: `/gsd-plan-phase {N} --chunked` resumes from the last successfully committed plan.
933: 
934: **Intended for new or in-progress chunked runs.** To recover plans already written by a prior
935: *non-chunked* run, use step 6's "Add more plans" or proceed directly to `/gsd-execute-phase`
936: — don't start a fresh chunked run over existing non-chunked plans.
937: 
938: ### 8.5.1 Outline Phase (outline-only mode, ~2 min)
939: 
940: **Resume detection:** If `${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md` already exists **and
941: is valid** (contains the `## OUTLINE COMPLETE` marker), skip this sub-step — the outline
942: already exists from a previous run. Proceed directly to 8.5.2.
943: 
944: ```bash
945: OUTLINE_FILE="${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md"
946: if [[ -f "$OUTLINE_FILE" ]] && grep -q "^## OUTLINE COMPLETE" "$OUTLINE_FILE"; then
947:   # reuse existing outline — skip to 8.5.2
948: fi
949: ```
950: 
951: Display:
952: ```text
953: ◆ Chunked mode: spawning outline planner...
954: ```
955: 
956: Spawn the planner in **outline-only** mode — it must write only the outline manifest, not any
957: PLAN.md files:
958: 
959: ```javascript
960: Agent(
961:   prompt="{same planning_context as step 8, plus:}
962: 
963:   **Chunked mode: outline-only.**
964:   Do NOT write any PLAN.md files in this Task.
965:   Write only: {PHASE_DIR}/{PADDED_PHASE}-PLAN-OUTLINE.md
966: 
967:   The outline must be a markdown table with columns:
968:   Plan ID | Objective | Wave | Depends On | Requirements
969: 
970:   Return: ## OUTLINE COMPLETE with plan count.",
971:   subagent_type="gsd-planner",
972:   model="{planner_model}",
973:   description="Outline Phase {phase} (chunked)"
974: )
975: ```
976: 
977: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
978: 
979: Handle return:
980: - **`## OUTLINE COMPLETE`:** Read `PLAN-OUTLINE.md`, extract plan list. Continue to 8.5.2.
981: - **Any other return or empty:** Display error. Offer: 1) Retry outline, 2) Stop.
982: 
983: ### 8.5.2 Per-Plan Tasks (single-plan mode, ~3-5 min each)
984: 
985: For each plan entry extracted from `PLAN-OUTLINE.md`:
986: 
987: 1. **Resume check:** If `${PHASE_DIR}/{plan_id}-PLAN.md` already exists on disk **and has
988:    valid YAML frontmatter** (opening `---` delimiter present), skip this plan (do not
989:    overwrite completed work — resume safety).
990: 
991:    ```bash
992:    PLAN_FILE="${PHASE_DIR}/${plan_id}-PLAN.md"
993:    if [[ -f "$PLAN_FILE" ]] && head -1 "$PLAN_FILE" | grep -q '^---'; then
994:      continue  # plan already written, skip
995:    fi
996:    ```
997: 
998: 2. Display:
999:    ```text
1000:    ◆ Chunked mode: planning {plan_id} ({k}/{N})...
1001:    ```
1002: 
1003: 3. Spawn the planner in **single-plan** mode — it must write exactly one PLAN.md file:
1004:    ```javascript
1005:    Agent(
1006:      prompt="{same planning_context as step 8, plus:}
1007: 
1008:      **Chunked mode: single-plan.**
1009:      Write exactly ONE plan file: {PHASE_DIR}/{plan_id}-PLAN.md
1010:      Plan to write: {plan_id} — {objective}
1011:      Wave: {wave} | Depends on: {depends_on}
1012:      Phase requirement IDs to cover in this plan: {plan_requirements}
1013: 
1014:      Return: ## PLAN COMPLETE with the plan ID.",
1015:      subagent_type="gsd-planner",
1016:      model="{planner_model}",
1017:      description="Plan {plan_id} (chunked {k}/{N})"
1018:    )
1019:    ```
1020: 
1021:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1022: 
1023: 4. **Verify disk:** Check `${PHASE_DIR}/{plan_id}-PLAN.md` exists. If missing: offer 1) Retry, 2) Stop.
1024: 
1025: 5. **Commit per-plan:**
1026:    ```bash
1027:    gsd-sdk query commit "docs(${PADDED_PHASE}): plan ${plan_id} (chunked)" --files "${PHASE_DIR}/${plan_id}-PLAN.md"
1028:    ```
1029: 
1030: After all N plans are written and committed, treat this as `## PLANNING COMPLETE` and continue
1031: to step 9.
1032: 
1033: ## 9. Handle Planner Return
1034: 
1035: - **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false (from init): skip to step 13. Otherwise: step 10.
1036: - **`## PHASE SPLIT RECOMMENDED`:** The planner determined the phase exceeds the context budget for full-fidelity implementation of all source items. Handle in step 9b.
1037: - **`## ⚠ Source Audit: Unplanned Items Found`:** The planner's multi-source coverage audit found items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions that are not covered by any plan. Handle in step 9c.
1038: - **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
1039: - **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual
1040: - **Empty / truncated / no recognized marker:** → Filesystem fallback (step 9a).
1041: 
1042: ## 9a. Filesystem Fallback (Planner)
1043: 
1044: **Triggered when:** Agent() returns but the return contains no recognized marker (`## PLANNING COMPLETE`, `## PHASE SPLIT RECOMMENDED`, `## ⚠ Source Audit`, `## CHECKPOINT REACHED`, `## PLANNING INCONCLUSIVE`).
1045: 
1046: ```bash
1047: DISK_PLANS=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
1048: ```
1049: 
1050: **If `DISK_PLANS` > 0:** The planner wrote plans to disk but the Agent() return was empty or
1051: truncated (the Windows stdio hang pattern — the subagent finished but the return never
1052: arrived). Display:
1053: 
1054: ```text
1055: ◆ Planner wrote {DISK_PLANS} plan(s) to disk but did not emit a PLANNING COMPLETE marker.
1056:   This is a known Windows stdio hang pattern — work is likely recoverable.
1057: 
1058:   Plans found on disk:
1059:   {ls output of *-PLAN.md}
1060: ```
1061: 
1062: Offer 3 options:
1063: 1. **Accept plans** — treat as `## PLANNING COMPLETE` and continue through step 9 `## PLANNING COMPLETE` handling (so `--skip-verify` / `plan_checker_enabled=false` are honored — may skip to step 13 rather than step 10)
1064: 2. **Retry planner** — re-spawn the planner with the same prompt (return to step 8)
1065: 3. **Stop** — exit; user can re-run `/gsd-plan-phase {N}` to resume
1066: 
1067: **If `DISK_PLANS` is 0 and no marker:** The planner produced no output. Treat as
1068: `## PLANNING INCONCLUSIVE` and handle accordingly.
1069: 
1070: ## 9b. Handle Phase Split Recommendation
1071: 
1072: When the planner returns `## PHASE SPLIT RECOMMENDED`, it means the phase's source items exceed the context budget for full-fidelity implementation. The planner proposes groupings.
1073: 
1074: **Extract from planner return:**
1075: - Proposed sub-phases (e.g., "17a: processing core (D-01 to D-19)", "17b: billing + config UX (D-20 to D-27)")
1076: - Which source items (REQ-IDs, D-XX decisions, RESEARCH items) go in each sub-phase
1077: - Why the split is necessary (context cost estimate, file count)
1078: 
1079: **Present to user:**
1080: ```
1081: ## Phase {X} exceeds context budget for full-fidelity implementation
1082: 
1083: The planner found {N} source items that exceed the context budget when
1084: planned at full fidelity. Instead of reducing scope, we recommend splitting:
1085: 
1086: **Option 1: Split into sub-phases**
1087: - Phase {X}a: {name} — {items} ({N} source items, ~{P}% context)
1088: - Phase {X}b: {name} — {items} ({M} source items, ~{Q}% context)
1089: 
1090: **Option 2: Proceed anyway** (planner will attempt all, quality may degrade past 50% context)
1091: 
1092: **Option 3: Prioritize** — you choose which items to implement now,
1093: rest become a follow-up phase
1094: ```
1095: 
1096: Use question with these 3 options.
1097: 
1098: **If "Split":** Use `/gsd-phase --insert` to create the sub-phases, then replan each.
1099: **If "Proceed":** Return to planner with instruction to attempt all items at full fidelity, accepting more plans/tasks.
1100: **If "Prioritize":** Use question (multiSelect) to let user pick which items are "now" vs "later". Create CONTEXT.md for each sub-phase with the selected items.
1101: 
1102: ## 9c. Handle Source Audit Gaps
1103: 
1104: When the planner returns `## ⚠ Source Audit: Unplanned Items Found`, it means items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions have no corresponding plan.
1105: 
1106: **Extract from planner return:**
1107: - Each unplanned item with its source artifact and section
1108: - The planner's suggested options (A: add plan, B: split phase, C: defer with confirmation)
1109: 
1110: **Present each gap to user.** For each unplanned item:
1111: 
1112: ```
1113: ## ⚠ Unplanned: {item description}
1114: 
1115: Source: {RESEARCH.md / REQUIREMENTS.md / ROADMAP goal / CONTEXT.md}
1116: Details: {why the planner flagged this}
1117: 
1118: Options:
1119: 1. Add a plan to cover this item (recommended)

(Output capped at 50 KB. Showing lines 1-1119. Use offset=1120 to continue.)
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
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_nSLxSwEjjUZmdeTSuMns8914"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_sSGq0Df55guXFtUP89Ec0756"
}
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_00_JVrzFzpcwgELfHds5MJf9608"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Context
2: 
3: **Gathered:** 2026-05-12
4: **Status:** Ready for planning
5: 
6: <domain>
7: ## Phase Boundary
8: 
9: Remediate the CP-ST-01 Session Tracker Revamp implementation to address 20+ catalogued defects across the writer engine (capture logic, hierarchy classification, status tracking, error pruning, compaction capture) and the tool surface (insufficient query capabilities, lack of agent consumability). The phase applies evidence-documented fixes to the existing `src/features/session-tracker/` module and replaces the single `session-tracker` tool with a domain-focused toolset following CUSTOM-TOOLS-CRITERIA guidelines.
10: 
11: This phase fixes what was built in CP-ST-01 — it does NOT add new capabilities beyond the original spec boundary. The existing 163 tests are the regression baseline. All 14 review findings from CP-ST-01-REVIEW.md must be addressed.
12: 
13: </domain>
14: 
15: <decisions>
16: ## Implementation Decisions
17: 
18: ### Remediation Strategy: 3-Wave Structure
19: - **D-01: Wave 1 — Writer Engine Fixes.** Fix the capture pipeline before touching tools. Ordered by dependency: unblock the frozen serial queue (DEFECT-02), fix childCount corruption (DEFECT-01), then hierarchy classification (main vs child), then capture gaps (assistant output, compaction, child status updates), then error pruning. Each fix independently testable.
20: - **D-02: Wave 2 — Tool Redesign.** Replace the single `session-tracker` tool with a domain-focused toolset: `session-tracker` (export/list/search, extended), `session-hierarchy` (child/parent navigation, delegation chain query), `session-context` (cross-session synthesis, related session discovery). Each tool ≤200 LOC per Criterion 4 (Granularity). Each tool under `src/tools/hivemind/`.
21: - **D-03: Wave 3 — Integration + Verification.** Fork handling, parallel session edge cases, full regression test pass against all 163 existing tests, integration verification of the complete pipeline.
22: 
23: ### Task Granularity: Dependency-Ordered Micro-Tasks
24: - **D-04:** Each sub-plan decomposes into dependency-ordered micro-tasks (1-2 files per task, individually testable). Tasks follow the frozen dependency chain: unblock the pipeline first, then fix what flows through it. No task touches more than 2 files. Prevents regression cascade.
25: 
26: ### Child Session Hierarchy Model: Turn-Level Stems + Final Summary
27: - **D-05:** Child `.json` records capture per-turn stems: actor (subagent name + model), timestamp, tools (input paths, output paths/IDs, errors as type+path only). After all turns complete, the final assistant response is captured as a summary/report block. No `.md` files for child sessions — only `.json` under parent subdir.
28: - **D-06:** 3-level delegation hierarchy fully nested in `session-continuity.json`. Children of children recursively nest. Status updates propagate on lifecycle events (created → active → idle/completed/error).
29: - **D-07:** Child session lifecycle events route through a dedicated handler path in `event-capture.ts`. When `parentID !== null`, events update child `.json` records via `childWriter`, not the main session writer.
30: 
31: ### Tool Re-Architecture: Toolset by Domain per CUSTOM-TOOLS-CRITERIA
32: - **D-08:** Three focused tools replace the single action-dispatched `session-tracker`:
33:   - `session-tracker` (C2: Governance & State) — export-session, list-sessions, search-sessions, get-status, get-summary
34:   - `session-hierarchy` (C2: Governance & State) — get-children, get-parent-chain, get-delegation-depth
35:   - `session-context` (C3: Inspection & Research) — find-related-sessions, cross-reference, synthesize-context
36: - **D-09:** Each tool follows Criterion 4 (≤200 LOC, kebab-case, action+object naming) and Criterion 7 (minimal required fields, easy agent invocation). Tools use Zod schemas validated at boundary.
37: 
38: ### Compaction Capture: Summary Breaker Blocks
39: - **D-10:** When `session.compacted` event fires, write a compacted section to the main `.md` file containing: pre-compaction context summary, key decisions made, active TODOs/delegations pending, and the compact boundary marker (`## COMPACTED`). Serves as semantic checkpoint for agents resuming long sessions.
40: 
41: ### Error Pruning
42: - **D-11:** Errors captured as type + path only. No file content in error output. The `handleRead` heuristic (substring match on "error") is replaced with structured error detection via tool output metadata.
43: 
44: ### the agent's Discretion
45: - Exact internal module structure within `src/features/session-tracker/` for new handlers (child event routing, compaction capture) is up to the implementer following existing patterns.
46: - Exact field naming for new child session turn stems is up to the implementer following camelCase convention (REQ-ST-12).
47: - Tool response envelope format follows existing `src/shared/tool-response.ts` patterns.
48: 
49: </decisions>
50: 
51: <canonical_refs>
52: ## Canonical References
53: 
54: **Downstream agents MUST read these before planning or implementing.**
55: 
56: ### CP-ST-01 Phase Artifacts (original spec + review)
57: - `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked 13 requirements (REQ-ST-01 through REQ-ST-13). These remain the acceptance baseline.
58: - `.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md` — Original implementation decisions (D-01 through D-05). D-01 (deps injection), D-03 (atomic rename), and D-04 (append-per-event) remain valid. D-02 (single tool TODO) is superseded by D-08.
59: - `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md` — 14 findings (3 critical, 6 warning, 5 info). All MUST be addressed in this phase.
60: 
61: ### Phase 12 Evidence Baseline
62: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md` — SPEC vs Reality for all 13 REQs with severity scoring
63: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md` — 14 writer engine defects with file:line references
64: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md` — 6 tool surface deficiencies with design notes
65: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md` — Status of all 14 review findings
66: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/05-DISK-EVIDENCE-SAMPLES.md` — Sampled session evidence with timestamps and patterns
67: 
68: ### Architecture & Governance
69: - `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph
70: - `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, naming
71: - `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract
72: - `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10 design criteria for custom tools. C4 (Granularity) and C7 (Ergonomics) are binding for tool redesign decisions D-08/D-09.
73: 
74: ### Source Code
75: - `src/features/session-tracker/index.ts` — SessionTracker class (the main touch point)
76: - `src/features/session-tracker/capture/event-capture.ts` — Event routing (needs child session path)
77: - `src/features/session-tracker/capture/message-capture.ts` — Message capture (needs assistant output capture)
78: - `src/features/session-tracker/capture/tool-capture.ts` — Tool capture (DEFECT-01, DEFECT-03, DEFECT-04)
79: - `src/features/session-tracker/persistence/project-index-writer.ts` — Frozen serial queue (DEFECT-02)
80: - `src/tools/hivemind/session-tracker.ts` — Current tool (to be redesigned per D-08)
81: - `src/plugin.ts` — Hook wiring + tool registration
82: 
83: ### Audit Evidence
84: - `.hivemind/audit/flaw-register-2026-05-10.json` — 12 flaws (F1-F12) from the original event tracker
85: 
86: ### Disk Evidence (live data)
87: - `.hivemind/session-tracker/project-continuity.json` — 83 entries, all status=active, all childCount=0, frozen lastUpdated
88: - `.hivemind/session-tracker/` — 85 session subdirectories, child .json files with empty turns
89: 
90: </canonical_refs>
91: 
92: <code_context>
93: ## Existing Code Insights
94: 
95: ### Reusable Assets
96: - `src/features/session-tracker/persistence/atomic-write.ts` — `safeSessionPath()`, `atomicWriteJson()`, `atomicAppendMarkdown()`, `ensureDirectory()`. All existing write safety mechanisms remain valid.
97: - `src/features/session-tracker/persistence/session-writer.ts` — `SessionWriter` class. MD appending and frontmatter merging patterns stay; new compaction section method needed.
98: - `src/features/session-tracker/persistence/child-writer.ts` — `ChildWriter` class. Existing `createChildFile()`, `updateChildStatus()`, `appendChildTurn()` — already defined but never called after creation. Needs wiring into the event pipeline.
99: - `src/features/session-tracker/transform/agent-transform.ts` — `AgentTransform` class. Child `##USER` → `main_l0_agent` transform already works; needs wiring for child session message capture.
100: - `src/shared/tool-response.ts` — Standard `success()` / `error()` response wrapper for new tools.
101: 
102: ### Established Patterns
103: - **Deps injection:** All capture classes receive writers via constructor `({ client, sessionWriter, ... })`. New handlers follow same pattern.
104: - **Best-effort handlers:** All `handle*` methods wrapped in try/catch — never throw to OpenCode runtime.
105: - **Atomic write pattern (D-03):** Write to temp file → `fs.rename()` — all new writes use this.
106: - **Append-per-event (D-04):** Each hook event appends immediately — no batching.
107: - **CQRS boundaries:** Hooks observe, SessionTracker routes to persistence layer. No direct filesystem writes from hooks.
108: 
109: ### Integration Points
110: - `src/hooks/index.ts` — `createCoreHooks()` observer pipeline. Session tracker hooks already wired here.
111: - `src/plugin.ts` — Plugin composition root. Tool registration lives here. New tools added alongside existing `session-tracker` registration.
112: - `src/features/session-tracker/index.ts` — SessionTracker class. New handler methods (`handleChildSessionEvent`, `handleCompaction`) are added here, following existing pattern.
113: 
114: </code_context>
115: 
116: <specifics>
117: ## Specific Ideas
118: 
119: - **No new npm dependencies.** All fixes use existing stack: `gray-matter`, `yaml`, `zod`, `node:fs/promises`.
120: - **All 14 review findings addressed.** CR-01, CR-02, CR-03 (critical) fixed in Wave 1. WR-01 through WR-06 and IN-01 through IN-05 fixed progressively through Waves 1-3.
121: - **Regressions prevented.** Each micro-task verifies against `npx vitest run tests/features/session-tracker/` plus task-specific tests. No task merges without green.
122: - **Disk evidence is the truth.** When code says one thing and disk says another, disk wins. The `project-continuity.json` frozen state is canonical evidence of what's broken.
123: - **Fork handling (Wave 3).** When OpenCode forks create a new main session from a checkpoint message, the new session shares existing child delegation records. Fork detection via session metadata comparison; shared children are reference-copied, not duplicated.
124: - **Parallel sessions (Wave 3).** Concurrent main sessions with shared child sessions need write isolation. Child records under parent subdirs are naturally isolated; the project index serial queue must handle concurrent updates without freezing.
125: 
126: </specifics>
127: 
128: <deferred>
129: ## Deferred Ideas
130: 
131: - **Sidecar dashboard integration** — Q2, separate project. Session tracker produces files the sidecar CAN read but no sidecar-specific code belongs here.
132: - **Real-time SSE streaming** — Out of scope. Plugin receives events directly via hooks.
133: - **Graph-based delegation visualization** — Out of scope. Belongs to a future phase after the session tracker produces correct data.
134: - **Auto-pruning of old session data** — Future phase. Current scope is producing correct data, not managing retention.
135: - **Removal of legacy event-tracker source code** — Future phase. Safety net remains per REQ-ST-13.
136: 
137: </deferred>
138: 
139: ---
140: 
141: *Phase: 12-CP-ST-01-Remediation*
142: *Context gathered: 2026-05-12*

(End of file - total 142 lines)
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

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). This phase audits and corrects all .planning/ artifacts to reflect current project reality.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .planning/:** STATE.md has been rewritten to runway-focused structure (~216 lines). PROJECT.md, REQUIREMENTS.md, and ROADMAP.md have been reconciled against live evidence. Historical STATE.md content archived to `.planning/archive/state-history/`.  
**Key governance baseline files:**
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming + lineage contracts
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership
- `.planning/codebase/ARCHITECTURE.md` — CQRS, 9-surface authority
- `.planning/codebase/STRUCTURE.md` — File tree conventions

</system-reminder>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_eZbAWImD1fvnKJkvwaRb1738"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_CiX2Jl1YE4KYwKJxSKV70090"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_brP7vlR19Jp3QrCji6IR1701"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_OV2xm4IKwGBHOZqDjO9v7523"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/01-EVIDENCE-MATRIX.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_LjtggzJLZfJNrrwBM9mc6867"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_QUWPZUp91nJfExfNAkP87566"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_HVR537J6ichRKO2YK7SJ4752"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_HsEwUsYLTOee18jwgAdr7956"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_9Lt3LI8RSpWVtONCgMOm8559"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_ch1lnix1ZngQLxx0hevx6992"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_xidGaAD3sxZ4qjf0GUL72049"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/02-SOURCE-DEFECTS.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/02-SOURCE-DEFECTS.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Source Defects Catalog (Writer Engine)
2: 
3: **Date:** 2026-05-12
4: **Scope:** `src/features/session-tracker/` capture + persistence + transform layers
5: **Classification: Group A — Writer Engine Defects**
6: 
7: Each finding includes: file:line, mechanism, reproduction evidence, review finding cross-reference, and suggested fix direction.
8: 
9: ---
10: 
11: ## DEFECT-01: Project Index Update `childCount: undefined` Corrupts Entry
12: 
13: | Property | Value |
14: |----------|-------|
15: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:251-253` |
16: | **Mechanism** | `handleTask()` calls `this.projectIndexWriter.updateSession(input.sessionID, { childCount: undefined })` |
17: | **Chain** | `project-index-writer.ts:166-172` — `updateSession` spreads `...updates` over existing entry. JavaScript `{ childCount: undefined }` spread **overwrites** the key with `undefined` → field effectively deleted from JSON |
18: | **Evidence** | 13 sessions in `project-continuity.json` are missing the `childCount` field entirely (L1) |
19: | **Review ref** | WR-01 — confirmed unresolved |
20: | **Severity** | 🔴 CRITICAL |
21: 
22: **Fix direction:** Either omit `childCount` from the update call, or read current count and increment.
23: 
24: ---
25: 
26: ## DEFECT-02: Project Index `lastUpdated` Never Advances — Serial Queue Stuck
27: 
28: | Property | Value |
29: |----------|-------|
30: | **File:line** | `src/features/session-tracker/persistence/project-index-writer.ts:89-91` (writeQueue) |
31: | **Mechanism** | The `writeQueue` Promise chain serializes index writes. If one promise in the chain never resolves (unhandled rejection, infinite await), all subsequent writes are blocked. `project-continuity.json` shows `lastUpdated: "2026-05-11T17:04:29.708Z"` — 7+ hours stale as of May 12 00:04. |
32: | **Evidence** | `project-continuity.json` has 83 entries all added before 17:04 but no entries added since, despite ~57 more session directories created after 17:04 (L1) |
33: | **Review ref** | Not in review (systemic issue discovered during disk audit) |
34: | **Severity** | 🔴 CRITICAL |
35: 
36: **Fix direction:** Add timeout/failure recovery to the write queue. Log stuck queue state. Consider per-entry locking instead of global serial queue.
37: 
38: ---
39: 
40: ## DEFECT-03: Child Session Records Are Write-Once, Never Updated
41: 
42: | Property | Value |
43: |----------|-------|
44: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:236-240` |
45: | **Mechanism** | `handleTask()` calls `childWriter.createChildFile()` once at task spawn time. Never calls `childWriter.updateChildStatus()` or `childWriter.appendChildTurn()` afterward. Child session lifecycle events (created, idle, deleted) are routed to `event-capture.ts` which only handles main sessions (routes events to .md, not .json). |
46: | **Evidence** | All child .json files have `turns: []`, `status: "active"`, `mainAgent.model: "unknown"`, `created == updated` (L1) |
47: | **Review ref** | Not in review (systemic gap) |
48: | **Severity** | 🔴 CRITICAL |
49: 
50: **Fix direction:** Child session events need a separate handler path. When `event-capture` detects a child session (via `parentID !== null`), it should route to `childWriter.updateChildStatus()` and `childWriter.appendChildTurn()` instead of (or in addition to) the main session writer.
51: 
52: ---
53: 
54: ## DEFECT-04: `handleRead` Captures File Content via Heuristic Error Detection
55: 
56: | Property | Value |
57: |----------|-------|
58: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:176-187` |
59: | **Mechanism** | `outputStr` is checked for substrings `"error"` or `"not found"`. If found, the **entire output string** (which IS the file content) is written as the error parameter to `appendToolBlock`. Any file containing those words triggers full content capture. |
60: | **Evidence** | Code analysis (L4) — direct violation of REQ-ST-05 |

(Showing lines 1-60 of 227. Use offset=61 to continue.)
</content>
```


### Tool: task

**Input:**
```json
{
  "description": "Research Phase 12 CP-ST-01",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1e7db6f75ffeKAgQ0I0QkjDWr5"
}
```

**Output:** (pruned)
```
task_id: ses_1e7db6f75ffeKAgQ0I0QkjDWr5
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_wUCswd4yALKqsFCsF6RW7463"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Research
2: 
3: **Researched:** 2026-05-12
4: **Domain:** Session tracker writer engine + tool surface remediation (TypeScript, OpenCode SDK v2 hooks, CQRS persistence)
5: **Confidence:** HIGH
6: 
7: ## Summary
8: 
9: This phase fixes a comprehensively broken session tracker pipeline. Despite 163 passing unit tests, the writer engine has 14 confirmed source defects — the project index is frozen (7+ hours stale), child session records are write-once-never-updated, child lifecycle events are lost, read tool captures file content via heuristic error detection (violating REQ-ST-05), childCount corrupts project entries via `undefined` spread, a path traversal vulnerability exists in the recovery module, and legacy cleanup code exists but is never called. The tool surface has 6 deficiencies including a path traversal in `handleExportSession` and stale data from the frozen index. All 14 review findings from CP-ST-01-REVIEW.md remain unresolved (100%).
10: 
11: The remediation follows a 3-wave dependency-ordered strategy: (1) fix the frozen serial queue first (DEFECT-02, the block), then fix all downstream writer engine defects in dependency order, (2) replace the single `session-tracker` tool with 3 domain-focused tools per CUSTOM-TOOLS-CRITERIA, and (3) verify integration with fork handling, parallel sessions, and 163-test regression baseline.
12: 
13: **Primary recommendation:** Unblock the frozen serial queue FIRST (DEFECT-02) — all other fixes depend on the project index actually updating. Fix DEFECT-01 (childCount: undefined) immediately after. Then route child session lifecycle events through dedicated handler paths (DEFECT-03, DEFECT-08). Fix path traversal vulnerabilities (CR-01, CR-02) before any other tool work.
14: 
15: ## Architectural Responsibility Map
16: 
17: | Capability | Primary Tier | Secondary Tier | Rationale |
18: |------------|-------------|----------------|-----------|
19: | Session lifecycle event capture | API/Backend (`src/features/session-tracker/capture/event-capture.ts`) | — | Hooks observe, SessionTracker routes to persistence |
20: | User/assistant message capture | API/Backend (`src/features/session-tracker/capture/message-capture.ts`) | — | Chat.message hook → message-capture → session-writer |
21: | Tool execution capture | API/Backend (`src/features/session-tracker/capture/tool-capture.ts`) | — | tool.execute.after hook → tool-capture → writers |
22: | Child session lifecycle tracking | API/Backend (`src/features/session-tracker/capture/event-capture.ts`) | ChildWriter persistence | Child lifecycle events need dedicated routing |
23: | Project index management | Database/Storage (`project-index-writer.ts`) | — | Serial queue, JSON persistence |
24: | Session-local index management | Database/Storage (`session-index-writer.ts`) | — | Per-session JSON index |
25: | Tool query surface (export/list/search) | API/Backend (`src/tools/hivemind/`) | Shared tool-response envelope | CQRS write-side tools for agent consumption |
26: | Path safety / ID validation | API/Backend (`src/features/session-tracker/persistence/atomic-write.ts`) | Shared types | Centralized sanitization, used by all writers |
27: | Legacy cleanup | API/Backend (`src/features/session-tracker/index.ts`) | Plugin composition root | Cleanup must be wired to startup |
28: | Recovery from disk | API/Backend (`src/features/session-tracker/recovery/session-recovery.ts`) | SDK REST API | Rebuild context from persisted files |
29: 
30: <user_constraints>
31: ## User Constraints (from CONTEXT.md)
32: 
33: ### Locked Decisions
34: - **D-01: Wave 1 — Writer Engine Fixes.** Fix capture pipeline before touching tools. Ordered by dependency.
35: - **D-02: Wave 2 — Tool Redesign.** Replace single `session-tracker` with 3 tools: `session-tracker`, `session-hierarchy`, `session-context`. Each ≤200 LOC per Criterion 4.
36: - **D-03: Wave 3 — Integration + Verification.** Fork handling, parallel sessions, full regression.
37: - **D-04:** Each sub-plan decomposes into dependency-ordered micro-tasks (1-2 files per task). No task touches more than 2 files.
38: - **D-05:** Child `.json` records capture per-turn stems. Final summary after completion.
39: - **D-06:** 3-level delegation hierarchy fully nested. Status updates propagate on lifecycle events.
40: - **D-07:** Child session lifecycle events route through dedicated handler path in `event-capture.ts`.
41: - **D-08:** Three focused tools replace the single action-dispatched `session-tracker`.
42: - **D-09:** Each tool follows Criterion 4 (≤200 LOC, kebab-case, action+object naming) and Criterion 7 (minimal required fields).
43: - **D-10:** Compaction capture: write summary breaker blocks to main .md file on `session.compacted` event.
44: - **D-11:** Errors captured as type + path only. Replace heuristic substring match with structured error detection.
45: 
46: ### the agent's Discretion
47: - Exact internal module structure within `src/features/session-tracker/` for new handlers (child event routing, compaction capture) is up to the implementer following existing patterns.
48: - Exact field naming for new child session turn stems is up to the implementer following camelCase convention (REQ-ST-12).
49: - Tool response envelope format follows existing `src/shared/tool-response.ts` patterns.
50: 

(Showing lines 1-50 of 671. Use offset=51 to continue.)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_KW3hqs7PLIeZ3WyYfmk75188"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_sbdFQ0YEW5pqHaNgW1iY8361"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8831H8o4BoQc8Qr32RvP2603"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_18SbkrXXE3DENGsDGcXE1346"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_vJm4lsYuTUWFGCOfq5mS8360"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_SuctXIRmVaAuM62tbEY17295"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Plan Phase 12 CP-ST-01 Remediation",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1e7cf8b01ffewEF7vgrcyG5SoF"
}
```

**Output:** (pruned)
```
task_id: ses_1e7cf8b01ffewEF7vgrcyG5SoF
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_zcsZnjOFKE7pjZGnL9M53024"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-01-PLAN.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CP-ST-01-01-PLAN.md</path>
<type>file</type>
<content>
1: ---
2: phase: "12-cp-st-01-remediation"
3: plan: 1
4: type: execute
5: wave: 1
6: depends_on: []
7: files_modified:
8:   - src/features/session-tracker/capture/tool-capture.ts
9:   - src/features/session-tracker/capture/event-capture.ts
10:   - src/features/session-tracker/capture/message-capture.ts
11:   - src/features/session-tracker/persistence/project-index-writer.ts
12:   - src/features/session-tracker/persistence/session-index-writer.ts
13:   - src/features/session-tracker/persistence/session-writer.ts
14:   - src/features/session-tracker/persistence/child-writer.ts
15:   - src/features/session-tracker/index.ts
16:   - src/features/session-tracker/types.ts
17:   - src/features/session-tracker/transform/agent-transform.ts
18:   - src/features/session-tracker/recovery/session-recovery.ts
19:   - src/plugin.ts
20: autonomous: true
21: requirements:
22:   - REQ-ST-01
23:   - REQ-ST-02
24:   - REQ-ST-04
25:   - REQ-ST-05
26:   - REQ-ST-06
27:   - REQ-ST-07
28:   - REQ-ST-08
29:   - REQ-ST-09
30:   - REQ-ST-10
31:   - REQ-ST-11
32:   - REQ-ST-12
33:   - REQ-ST-13
34: 
35: must_haves:
36:   truths:
37:     - "Project index lastUpdated advances after each session creation (no 7+ hour freeze)"
38:     - "project-continuity.json entries have numeric childCount (not undefined/absent)"
39:     - "handleRead never captures file content — errors logged as 'File read failed' string only"
40:     - "Child sessions receive lifecycle status updates (active → idle/completed/error)"
41:     - "Child session turn stems are captured to .json under parent subdirectory"
42:     - "Session turn counters seed from existing .md on restart (no duplicate turn 1)"
43:     - "Session hierarchy is fully nested (children of children tracked)"
44:     - "Legacy event-tracker state files are cleaned up on plugin startup"
45:     - "toolSummary is populated in session-continuity.json"
46:   artifacts:
47:     - path: "src/features/session-tracker/capture/tool-capture.ts"
48:       provides: "Fixed tool capture: childCount numeric, handleRead safe, toolSummary wired"
49:       min_lines: 300
50:     - path: "src/features/session-tracker/capture/event-capture.ts"
51:       provides: "Child session event routing via dedicated handler"
52:       min_lines: 280
53:     - path: "src/features/session-tracker/persistence/project-index-writer.ts"
54:       provides: "Recoverable serial queue with stale detection"
55:       min_lines: 260
56:     - path: "src/features/session-tracker/persistence/session-index-writer.ts"
57:       provides: "Fixed turnCount (not conflated with child additions)"
58:       min_lines: 200
59:     - path: "src/features/session-tracker/persistence/session-writer.ts"
60:       provides: "Race-condition-free frontmatter updates, static imports"
61:       min_lines: 200
62:     - path: "src/features/session-tracker/types.ts"
63:       provides: "Loosened session ID validation, path-safe"
64:       contains: "includes('/')"
65:   key_links:
66:     - from: "src/features/session-tracker/capture/event-capture.ts"
67:       to: "src/features/session-tracker/persistence/child-writer.ts"
68:       via: "childWriter.updateChildStatus() / childWriter.appendChildTurn()"
69:       pattern: "childWriter\\.(updateChildStatus|appendChildTurn)"
70:     - from: "src/features/session-tracker/index.ts"
71:       to: "src/plugin.ts"
72:       via: "cleanup() called after initialize()"
73:       pattern: "sessionTracker\\.cleanup\\(\\)"
74:     - from: "src/features/session-tracker/capture/tool-capture.ts"
75:       to: "src/features/session-tracker/persistence/session-index-writer.ts"
76:       via: "updateToolSummary() call in each tool handler"
77:       pattern: "sessionIndexWriter\\.updateToolSummary"
78: ---
79: 
80: <objective>

(Showing lines 1-80 of 629. Use offset=81 to continue.)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_lMJcVptf0896E0l0h7UU1429"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
<type>file</type>
<content>
1120: 2. Split phase — move to a sub-phase with related items
1121: 3. Defer — add to backlog (developer confirms this is intentional)
1122: ```
1123: 
1124: Use question for each gap (or batch if multiple gaps).
1125: 
1126: **If "Add plan":** Return to planner (step 8) with instruction to add plans covering the missing items, preserving existing plans.
1127: **If "Split":** Use `/gsd-phase --insert` for overflow items, then replan.
1128: **If "Defer":** Record in CONTEXT.md `## Deferred Ideas` with developer's confirmation. Proceed to step 10.
1129: 
1130: ## 10. Spawn gsd-plan-checker Agent
1131: 
1132: Display banner:
1133: ```
1134: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1135:  GSD ► VERIFYING PLANS
1136: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1137: 
1138: ◆ Spawning plan checker...
1139: ```
1140: 
1141: Checker prompt:
1142: 
1143: ```markdown
1144: <verification_context>
1145: **Phase:** {phase_number}
1146: **Phase Goal:** {goal from ROADMAP}
1147: 
1148: <files_to_read>
1149: - {PHASE_DIR}/*-PLAN.md (Plans to verify)
1150: - {roadmap_path} (Roadmap)
1151: - {requirements_path} (Requirements)
1152: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
1153: - {research_path} (Technical Research — includes Validation Architecture)
1154: </files_to_read>
1155: 
1156: ${AGENT_SKILLS_CHECKER}
1157: 
1158: **Phase requirement IDs (MUST ALL be covered):** {phase_req_ids}
1159: 
1160: **Project instructions:** Read ./AGENTS.md if exists — verify plans honor project guidelines
1161: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — verify plans account for project skill rules
1162: </verification_context>
1163: 
1164: <expected_output>
1165: - ## VERIFICATION PASSED — all checks pass
1166: - ## ISSUES FOUND — structured issue list
1167: </expected_output>
1168: ```
1169: 
1170: ```
1171: Agent(
1172:   prompt=checker_prompt,
1173:   subagent_type="gsd-plan-checker",
1174:   model="{checker_model}",
1175:   description="Verify Phase {phase} plans"
1176: )
1177: ```
1178: 
1179: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1180: 
1181: ## 11. Handle Checker Return
1182: 
1183: - **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 13.
1184: - **`## ISSUES FOUND`:** Display issues, check iteration count, proceed to step 12.
1185: - **Empty / truncated / no recognized marker:** → Filesystem fallback (step 11a).
1186: 
1187: **Thinking partner for architectural tradeoffs (conditional):**
1188: If `features.thinking_partner` is enabled, scan the checker's issues for architectural tradeoff keywords
1189: ("architecture", "approach", "strategy", "pattern", "vs", "alternative"). If found:
1190: 
1191: ```
1192: The plan-checker flagged an architectural decision point:
1193: {issue description}
1194: 
1195: Brief analysis:
1196: - Option A: {approach_from_plan} — {pros/cons}
1197: - Option B: {alternative_approach} — {pros/cons}
1198: - Recommendation: {choice} aligned with {phase_goal}
1199: 
1200: Apply this to the revision? [Yes] / [No, I'll decide]
1201: ```
1202: 
1203: If yes: include the recommendation in the revision prompt. If no: proceed to revision loop as normal.
1204: If thinking_partner disabled: skip this block entirely.
1205: 
1206: ## 11a. Filesystem Fallback (Checker)
1207: 
1208: **Triggered when:** Checker Agent() returns but the return contains neither `## VERIFICATION PASSED` nor `## ISSUES FOUND`.
1209: 
1210: ```bash
1211: DISK_PLANS=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
1212: ```
1213: 
1214: **If `DISK_PLANS` > 0:** Plans exist on disk; the checker return was empty or truncated (the
1215: Windows stdio hang pattern — the subagent finished but the return never arrived). Display:
1216: 
1217: ```text
1218: ◆ Checker return was empty or truncated. {DISK_PLANS} plan(s) exist on disk.
1219:   This is a known Windows stdio hang pattern — checker may have completed without returning.
1220: ```
1221: 
1222: Offer 3 options:
1223: 1. **Accept verification** — treat as `## VERIFICATION PASSED` and continue to step 13
1224: 2. **Retry checker** — re-spawn the checker with the same prompt (return to step 10)
1225: 3. **Stop** — exit; user can re-run `/gsd-plan-phase {N}` to resume
1226: 
1227: **If `DISK_PLANS` is 0:** No plans on disk — something is seriously wrong. Display error and stop.
1228: 
1229: ## 12. Revision Loop (Max 3 Iterations)
1230: 
1231: Track `iteration_count` (starts at 1 after initial plan + check).
1232: Track `prev_issue_count` (initialized to `Infinity` before the loop begins).
1233: Track `stall_reentry_count` (starts at 0; incremented each time "Adjust approach" re-enters step 8).
1234: 
1235: **If iteration_count < 3:**
1236: 
1237: Parse issue count from checker return: count BLOCKER + WARNING entries in the YAML issues block (structured output from gsd-plan-checker). If the checker's return contains no YAML issues block (i.e., the plan was approved with no issues), treat `issue_count` as 0 and skip the stall check — the plan passed. Proceed to step 13.
1238: 
1239: Display: `Revision iteration {N}/3 -- {blocker_count} blockers, {warning_count} warnings`
1240: 
1241: **Stall detection:** If `issue_count >= prev_issue_count`:
1242:   Display: `Revision loop stalled — issue count not decreasing ({issue_count} issues remain after {N} iterations)`
1243: 
1244:   **If `stall_reentry_count < 2`:**
1245:     Ask user:
1246:       Question: "Issues remain after {N} revision attempts with no progress. Proceed with current output?"
1247:       Options: "Proceed anyway" | "Adjust approach"
1248:     If "Proceed anyway": accept current plans and continue to step 13.
1249:     If "Adjust approach": increment `stall_reentry_count`, open freeform discussion, then re-enter step 8 (full replanning). Note: re-entry resets `iteration_count` and `prev_issue_count` but `stall_reentry_count` persists across re-entries and is capped at 2.
1250: 
1251:   **If `stall_reentry_count >= 2`:**
1252:     Display: `Stall persists after 2 re-planning attempts. The following issues could not be resolved automatically:`
1253:     List the remaining issues from the checker.
1254:     Suggest: "Consider resolving these issues manually or running `/gsd-debug` to investigate root causes."
1255:     Options: "Proceed anyway" | "Abandon"
1256:     If "Proceed anyway": accept current plans and continue to step 13.
1257:     If "Abandon": stop workflow.
1258: 
1259: Set `prev_issue_count = issue_count`.
1260: 
1261: Revision prompt:
1262: 
1263: ```markdown
1264: <revision_context>
1265: **Phase:** {phase_number}
1266: **Mode:** revision
1267: 
1268: <files_to_read>
1269: - {PHASE_DIR}/*-PLAN.md (Existing plans)
1270: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
1271: </files_to_read>
1272: 
1273: ${AGENT_SKILLS_PLANNER}
1274: 
1275: **Checker issues:** {structured_issues_from_checker}
1276: </revision_context>
1277: 
1278: <instructions>
1279: Make targeted updates to address checker issues.
1280: Do NOT replan from scratch unless issues are fundamental.
1281: Return what changed.
1282: </instructions>
1283: ```
1284: 
1285: ```
1286: Agent(
1287:   prompt=revision_prompt,
1288:   subagent_type="gsd-planner",
1289:   model="{planner_model}",
1290:   description="Revise Phase {phase} plans"
1291: )
1292: ```
1293: 
1294: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1295: 
1296: After planner returns -> spawn checker again (step 10), increment iteration_count.
1297: 
1298: **If iteration_count >= 3:**
1299: 
1300: Display: `Max iterations reached. {N} issues remain:` + issue list
1301: 
1302: Offer: 1) Force proceed, 2) Provide guidance and retry, 3) Abandon
1303: 
1304: ## 12.5. Plan Bounce (Optional External Refinement)
1305: 
1306: **Skip if:** `--skip-bounce` flag, `--gaps` flag, or bounce is not activated.
1307: 
1308: **Activation:** Bounce runs when `--bounce` flag is present OR `workflow.plan_bounce` config is `true`. The `--skip-bounce` flag always wins (disables bounce even if config enables it). The `--gaps` flag also disables bounce (gap-closure mode should not modify plans externally).
1309: 
1310: **Prerequisites:** `workflow.plan_bounce_script` must be set to a valid script path. If bounce is activated but no script is configured, display warning and skip:
1311: ```
1312: ⚠ Plan bounce activated but no script configured.
1313: Set workflow.plan_bounce_script to the path of your refinement script.
1314: Skipping bounce step.
1315: ```
1316: 
1317: **Read pass count:**
1318: ```bash
1319: BOUNCE_PASSES=$(gsd-sdk query config-get workflow.plan_bounce_passes 2>/dev/null || echo "2")
1320: BOUNCE_SCRIPT=$(gsd-sdk query config-get workflow.plan_bounce_script 2>/dev/null | jq -r '.' 2>/dev/null || true)
1321: ```
1322: 
1323: Display banner:
1324: ```
1325: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1326:  GSD ► BOUNCING PLANS (External Refinement)
1327: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1328: 
1329: Script: ${BOUNCE_SCRIPT}
1330: Max passes: ${BOUNCE_PASSES}
1331: ```
1332: 
1333: **For each PLAN.md file in the phase directory:**
1334: 
1335: 1. **Backup:** Copy `*-PLAN.md` to `*-PLAN.pre-bounce.md`
1336: ```bash
1337: cp "${PLAN_FILE}" "${PLAN_FILE%.md}.pre-bounce.md"
1338: ```
1339: 
1340: 2. **Invoke bounce script:**
1341: ```bash
1342: "${BOUNCE_SCRIPT}" "${PLAN_FILE}" "${BOUNCE_PASSES}"
1343: ```
1344: 
1345: 3. **Validate bounced plan — YAML frontmatter integrity:**
1346: After the script returns, check that the bounced file still has valid YAML frontmatter (opening and closing `---` delimiters with parseable content between them). If the bounced plan breaks YAML frontmatter validation, restore the original from the pre-bounce.md backup and continue to the next plan:
1347: ```
1348: ⚠ Bounced plan ${PLAN_FILE} has broken YAML frontmatter — restoring original from pre-bounce backup.
1349: ```
1350: 
1351: 4. **Handle script failure:** If the bounce script exits non-zero, restore the original plan from the pre-bounce.md backup and continue to the next plan:
1352: ```
1353: ⚠ Bounce script failed for ${PLAN_FILE} (exit code ${EXIT_CODE}) — restoring original from pre-bounce backup.
1354: ```
1355: 
1356: **After all plans are bounced:**
1357: 
1358: 5. **Re-run plan checker on bounced plans:** Spawn gsd-plan-checker (same as step 10) on all modified plans. If a bounced plan fails the checker, restore original from its pre-bounce.md backup:
1359: ```
1360: ⚠ Bounced plan ${PLAN_FILE} failed checker validation — restoring original from pre-bounce backup.
1361: ```
1362: 
1363: 6. **Commit surviving bounced plans:** If at least one plan survived both the frontmatter validation and the checker re-run, commit the changes:
1364: ```bash
1365: gsd-sdk query commit "refactor(${padded_phase}): bounce plans through external refinement" --files "${PHASE_DIR}/*-PLAN.md"
1366: ```
1367: 
1368: Display summary:
1369: ```
1370: Plan bounce complete: {survived}/{total} plans refined
1371: ```
1372: 
1373: **Clean up:** Remove all `*-PLAN.pre-bounce.md` backup files after the bounce step completes (whether plans survived or were restored).
1374: 
1375: ## 13. Requirements Coverage Gate
1376: 
1377: After plans pass the checker (or checker is skipped), verify that all phase requirements are covered by at least one plan.
1378: 
1379: **Skip if:** `phase_req_ids` is null or TBD (no requirements mapped to this phase).
1380: 
1381: **Step 1: Extract requirement IDs claimed by plans**
1382: ```bash
1383: # Collect all requirement IDs from plan frontmatter
1384: PLAN_REQS=$(grep -h "requirements_addressed\|requirements:" ${PHASE_DIR}/*-PLAN.md 2>/dev/null | tr -d '[]' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sort -u)
1385: ```
1386: 
1387: **Step 2: Compare against phase requirements from ROADMAP**
1388: 
1389: For each REQ-ID in `phase_req_ids`:
1390: - If REQ-ID appears in `PLAN_REQS` → covered ✓
1391: - If REQ-ID does NOT appear in any plan → uncovered ✗
1392: 
1393: **Step 3: Check CONTEXT.md features against plan objectives**
1394: 
1395: Read CONTEXT.md `<decisions>` section. Extract feature/capability names. Check each against plan `<objective>` blocks. Features not mentioned in any plan objective → potentially dropped.
1396: 
1397: **Step 4: Report**
1398: 
1399: If all requirements covered and no dropped features:
1400: ```
1401: ✓ Requirements coverage: {N}/{N} REQ-IDs covered by plans
1402: ```
1403: → Proceed to step 14.
1404: 
1405: If gaps found:
1406: ```
1407: ## ⚠ Requirements Coverage Gap
1408: 
1409: {M} of {N} phase requirements are not assigned to any plan:
1410: 
1411: | REQ-ID | Description | Plans |
1412: |--------|-------------|-------|
1413: | {id} | {from REQUIREMENTS.md} | None |
1414: 
1415: {K} CONTEXT.md features not found in plan objectives:
1416: - {feature_name} — described in CONTEXT.md but no plan covers it
1417: 
1418: Options:
1419: 1. Re-plan to include missing requirements (recommended)
1420: 2. Move uncovered requirements to next phase
1421: 3. Proceed anyway — accept coverage gaps
1422: ```
1423: 
1424: If `TEXT_MODE` is true, present as a plain-text numbered list (options already shown in the block above). Otherwise use question to present the options.
1425: 
1426: ## 13a. Decision Coverage Gate
1427: 
1428: After the requirements coverage gate passes, verify that every trackable
1429: decision captured by discuss-phase in CONTEXT.md `<decisions>` is referenced
1430: by at least one plan. This is the **translation gate** from issue #2492 —
1431: its job is to refuse to mark a phase planned when a discuss-phase decision
1432: silently dropped on the way into the plans.
1433: 
1434: **Skip if** `workflow.context_coverage_gate` is explicitly set to `false`
1435: (absent key = enabled). Also skip if no CONTEXT.md exists for this phase
1436: (nothing to translate) or if its `<decisions>` block is empty.
1437: 
1438: ```bash
1439: GATE_CFG=$(gsd-sdk query config-get workflow.context_coverage_gate 2>/dev/null || echo "true")
1440: if [ "$GATE_CFG" != "false" ]; then
1441:   GATE_RESULT=$(gsd-sdk query check.decision-coverage-plan "${PHASE_DIR}" "${CONTEXT_PATH}")
1442:   # BLOCKING: refuse to mark phase planned when a trackable decision is uncovered.
1443:   # `passed: true` covers both real-pass and skipped cases (gate disabled / no CONTEXT.md /
1444:   # no trackable decisions). Verify-phase counterpart deliberately omits this exit-1 — that
1445:   # gate is non-blocking by design (review finding F15).
1446:   echo "$GATE_RESULT" | jq -e '.data.passed == true' >/dev/null || {
1447:     echo "$GATE_RESULT" | jq -r '.data.message'
1448:     exit 1
1449:   }
1450: fi
1451: ```
1452: 
1453: The handler returns JSON:
1454: ```json
1455: {
1456:   "passed": true,
1457:   "skipped": false,
1458:   "total":  2,
1459:   "covered": 2,
1460:   "uncovered": [ { "id": "D-01", "text": "...", "category": "..." } ],
1461:   "message": "..."
1462: }
1463: ```
1464: 
1465: **If `passed` is true (or `skipped` is true):** Display
1466: `✓ Decision coverage: {M}/{N} CONTEXT.md decisions covered by plans` (or
1467: `(skipped — gate disabled)` / `(skipped — no decisions)`) and proceed to
1468: step 13b.
1469: 
1470: **If `passed` is false:** Display the handler's `message` block. It already
1471: names each uncovered decision (`D-NN | category | text`) and tells the user
1472: what to do — cite the id in a relevant plan's `must_haves` / `truths`, or
1473: move the decision under `### the agent's Discretion` / tag it `[informational]`
1474: if it should not be tracked. Then offer:
1475: 
1476: ```text
1477: Options:
1478: 1. Re-plan to cover missing decisions (recommended)
1479: 2. Edit CONTEXT.md to mark dropped decisions as [informational] / Discretion
1480: 3. Proceed anyway — accept the coverage gap
1481: ```
1482: 
1483: If `TEXT_MODE` is true, present as a plain-text numbered list. Otherwise use
1484: question. Selecting "Proceed anyway" continues to step 13b but
1485: records the override in STATE.md so verify-phase can re-surface it.
1486: 
1487: **Why this gate blocks:** failing here is cheap. The plans are the contract
1488: between discuss-phase and execute-phase; if a decision isn't visible in any
1489: plan, no executor will implement it. Catching that now beats discovering it
1490: after thousands of dollars of execution.
1491: 
1492: ## 13b. Record Planning Completion in STATE.md
1493: 
1494: After plans pass all gates, record that planning is complete so STATE.md reflects the new phase status:
1495: 
1496: ```bash
1497: gsd-sdk query state.planned-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
1498: ```
1499: 
1500: This updates STATUS to "Ready to execute", sets the correct plan count, and timestamps Last Activity.
1501: 
1502: ## 13c. Annotate ROADMAP with Wave Dependencies and Cross-cutting Constraints
1503: 
1504: After plans are finalized, annotate the ROADMAP.md plan list for this phase with:
1505: - **Wave dependency notes** — a bold header before each wave group ("Wave 2 *(blocked on Wave 1 completion)*")
1506: - **Cross-cutting constraints** — a "Cross-cutting constraints:" subsection listing `must_haves.truths` entries that appear in 2 or more plans
1507: 
1508: This step is derived entirely from existing PLAN frontmatter — no extra LLM pass is required.
1509: 
1510: ```bash
1511: gsd-sdk query roadmap.annotate-dependencies "${PHASE_NUMBER}"
1512: ```
1513: 
1514: This operation is idempotent: if wave headers or cross-cutting constraints already exist in the ROADMAP phase section, the command returns without modifying the file. Skip this step if `plan_count` is 0.
1515: 
1516: ## 13d. Commit Plans if commit_docs is true
1517: 
1518: If `commit_docs` is true (from the init JSON parsed in step 1), commit the generated plan artifacts (including any ROADMAP.md annotations from step 13c):
1519: 
1520: ```bash
1521: gsd-sdk query commit "docs(${PADDED_PHASE}): create phase plan" --files "${PHASE_DIR}"/*-PLAN.md .planning/STATE.md .planning/ROADMAP.md
1522: ```
1523: 
1524: This commits all PLAN.md files for the phase plus the updated STATE.md and ROADMAP.md to version-control the planning artifacts. Skip this step if `commit_docs` is false.
1525: 
1526: ## 13e. Post-Planning Gap Analysis
1527: 
1528: After all plans are generated, committed, and the Requirements Coverage Gate (§13)
1529: has run, emit a single unified gap report covering both REQUIREMENTS.md and the
1530: CONTEXT.md `<decisions>` section. This is a **proactive, post-hoc report** — it
1531: does not block phase advancement and does not re-plan. It exists so that any
1532: requirement or decision that slipped through the per-plan checks is surfaced in
1533: one place before execution begins.
1534: 
1535: **Skip if:** `workflow.post_planning_gaps` is `false`. Default is `true`.
1536: 
1537: ```bash
1538: POST_PLANNING_GAPS=$(gsd-sdk query config-get workflow.post_planning_gaps --default true 2>/dev/null || echo true)
1539: if [ "$POST_PLANNING_GAPS" = "true" ]; then
1540:   node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" gap-analysis --phase-dir "${PHASE_DIR}"
1541: fi
1542: ```
1543: 
1544: (`gsd-tools.cjs gap-analysis` reads `.planning/REQUIREMENTS.md`, `${PHASE_DIR}/CONTEXT.md`,
1545: and `${PHASE_DIR}/*-PLAN.md`, then prints a markdown table with one row per
1546: REQ-ID and D-ID. Word-boundary matching prevents `REQ-1` from being mistaken for
1547: `REQ-10`.)
1548: 
1549: **Output format (deterministic; sorted REQUIREMENTS.md → CONTEXT.md, then natural
1550: sort within source):**
1551: 
1552: ```
1553: ## Post-Planning Gap Analysis
1554: 
1555: | Source | Item | Status |
1556: |--------|------|--------|
1557: | REQUIREMENTS.md | REQ-01 | ✓ Covered |
1558: | REQUIREMENTS.md | REQ-02 | ✗ Not covered |
1559: | CONTEXT.md | D-01 | ✓ Covered |
1560: | CONTEXT.md | D-02 | ✗ Not covered |
1561: 
1562: ⚠ N items not covered by any plan
1563: ```
1564: 
1565: **Skip-gracefully behavior:**
1566: - REQUIREMENTS.md missing → CONTEXT-only report.
1567: - CONTEXT.md missing → REQUIREMENTS-only report.
1568: - Both missing or `<decisions>` block missing → "No requirements or decisions to check" line, no error.
1569: 
1570: This step is non-blocking. If items are reported as not covered, the user may
1571: re-run `/gsd-plan-phase --gaps` to add plans, or proceed to execute-phase as-is.
1572: 
1573: ## 14. Present Final Status
1574: 
1575: Route to `<offer_next>` OR `auto_advance` depending on flags/config.
1576: 
1577: ## 15. Auto-Advance Check
1578: 
1579: Check for auto-advance trigger using values already loaded in step 1:
1580: 
1581: 1. Parse `--auto` and `--chain` flags from $ARGUMENTS
1582: 2. Use `auto_chain_active` and `auto_advance` from the INIT JSON parsed in step 1 — **do not issue additional `config-get` calls for these values** (they are already present in the init output). Issuing redundant `config-get` calls for values already in INIT can cause infinite read loops on some runtimes.
1583: 3. **Sync chain flag with intent** — if user invoked manually (no `--auto` and no `--chain`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference):
1584:    ```bash
1585:    if [[ ! "$ARGUMENTS" =~ --auto ]] && [[ ! "$ARGUMENTS" =~ --chain ]]; then
1586:      gsd-sdk query config-set workflow._auto_chain_active false || true
1587:    fi
1588:    ```
1589: 
1590: Set local variables from INIT (parsed once in step 1):
1591: - `AUTO_CHAIN` = `auto_chain_active` from INIT JSON (boolean, default false)
1592: - `AUTO_CFG` = `auto_advance` from INIT JSON (boolean, default false)
1593: 
1594: **If `--auto` or `--chain` flag present AND `AUTO_CHAIN` is not true:** Persist chain flag to config (handles direct invocation without prior discuss-phase):
1595: ```bash
1596: if ([[ "$ARGUMENTS" =~ --auto ]] || [[ "$ARGUMENTS" =~ --chain ]]) && [[ "$AUTO_CHAIN" != "true" ]]; then
1597:   gsd-sdk query config-set workflow._auto_chain_active true
1598: fi
1599: ```
1600: 
1601: **If `--auto` or `--chain` flag present OR `AUTO_CHAIN` is true OR `AUTO_CFG` is true:**
1602: 
1603: Display banner:
1604: ```
1605: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1606:  GSD ► AUTO-ADVANCING TO EXECUTE
1607: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1608: 
1609: Plans ready. Launching execute-phase...
1610: ```
1611: 
1612: Launch execute-phase using the Skill tool to avoid nested Task sessions (which cause runtime freezes due to deep agent nesting):
1613: ```
1614: Skill(skill="gsd-execute-phase", args="${PHASE} --auto --no-transition ${GSD_WS}")
1615: ```
1616: 
1617: The `--no-transition` flag tells execute-phase to return status after verification instead of chaining further. This keeps the auto-advance chain flat — each phase runs at the same nesting level rather than spawning deeper Task agents.
1618: 
1619: **Handle execute-phase return:**

(Showing lines 1120-1619 of 1719. Use offset=1620 to continue.)
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
```


### Tool: task

**Input:**
```json
{
  "description": "Verify Phase 12 plans",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1e7bddda3ffe7s0o4F5gT24YU2"
}
```

**Output:** (pruned)
```
task_id: ses_1e7bddda3ffe7s0o4F5gT24YU2
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_TooY69TVU3uUk0hvBmcK1749"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Investigate session tracker records",
  "subagent_type": "hm-l2-investigator",
  "task_id": "ses_1e7b63fd5ffeITUoweQVsr73Ew"
}
```

**Output:** (pruned)
```
task_id: ses_1e7b63fd5ffeITUoweQVsr73Ew
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_VsQqryNFreRDGaYpiXKQ3318"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_CZ07xrW9JHnTCYhUF1Ey4013"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_YiTtQ5TUi7tfybeiMX4H3108"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_YLeysBXg52siXeL6lwY98999"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_iXdlNgNzQg42mR5paeb52524"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_YXW60S91EPvcfVs09Ll08182"
}
```


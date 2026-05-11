---
sessionID: ses_1e9a1d794ffePl33pFTux271hR
created: 2026-05-11T09:28:50.052Z
updated: 2026-05-11T09:28:50.052Z
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
Phase number: 11 (optional — auto-detects next unplanned phase if omitted)

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
  "name": "gsd-plan-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-plan-phase
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yxAhXofNObjb0LxW9YPS9027"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_srMurPPW53sDr1JxX3fj1382"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_UQKC5H8FyJhmCyPBSjHy0503"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_z8eq20tlMAyQ7WtWMvnN8150"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4JGLgHPwpkeJ4LgHtCMe5127"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_DzzrjyNYSIYHBFtO6tTs4284"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
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
  "callID": "call_01_BjViU09Ibg4AgA3A0zQI7031"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_PBH9NOk6KZt4TRbvng7M1145"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_n8Fh2RxI6j7mnPbwiIg32943"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_MRPKALagsDwBzk2dH9Ao0124"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_jCg1uFiyiBVjFKyon4Rt5554"
}
```


## USER (turn 2)

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: 11 (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in 11:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config checks, and interaction patterns. Do not improvise from the summary.

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jaAwXvpx5jYQ3Se68gMy0661"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Extract implementation decisions that downstream agents need. Analyze the phase to identify gray areas, let the user choose what to discuss, then deep-dive each selected area until satisfied.
3: 
4: You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to capture decisions that will guide research and planning, not to figure out implementation yourself.
5: </purpose>
6: 
7: <required_reading>
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
10: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md
11: </required_reading>
12: 
13: <progressive_disclosure>
14: **Per-mode bodies, templates, and the advisor flow are lazy-loaded** to keep
15: this file under the 500-line workflow budget (#2551, mirrors #2361's agent
16: budget). Read only the files needed for the current invocation:
17: 
18: | When | Read |
19: |---|---|
20: | `--power` in $ARGUMENTS | `workflows/discuss-phase/modes/power.md` (then exit standard flow) |
21: | `--all` in $ARGUMENTS | `workflows/discuss-phase/modes/all.md` overlay |
22: | `--auto` in $ARGUMENTS | `workflows/discuss-phase/modes/auto.md` + `workflows/discuss-phase/modes/chain.md` (auto-advance) |
23: | `--chain` in $ARGUMENTS | `workflows/discuss-phase/modes/default.md` + `workflows/discuss-phase/modes/chain.md` |
24: | `--text` in $ARGUMENTS or `workflow.text_mode: true` | `workflows/discuss-phase/modes/text.md` overlay |
25: | `--batch` in $ARGUMENTS | `workflows/discuss-phase/modes/batch.md` overlay |
26: | `--analyze` in $ARGUMENTS | `workflows/discuss-phase/modes/analyze.md` overlay |
27: | ADVISOR_MODE = true (USER-PROFILE.md exists) | `workflows/discuss-phase/modes/advisor.md` |
28: | no flags above | `workflows/discuss-phase/modes/default.md` |
29: | in `write_context` step | `workflows/discuss-phase/templates/context.md` |
30: | in `git_commit` step | `workflows/discuss-phase/templates/discussion-log.md` |
31: | writing checkpoints | `workflows/discuss-phase/templates/checkpoint.json` |
32: 
33: Do not Read mode files unless the corresponding flag/condition is set.
34: </progressive_disclosure>
35: 
36: <downstream_awareness>
37: **CONTEXT.md feeds into:**
38: 
39: 1. **gsd-phase-researcher** — Reads CONTEXT.md to know WHAT to research
40: 2. **gsd-planner** — Reads CONTEXT.md to know WHAT decisions are locked
41: 
42: **Your job:** Capture decisions clearly enough that downstream agents can act on them without asking the user again.
43: **Not your job:** Figure out HOW to implement. That's what research and planning do with the decisions you capture.
44: </downstream_awareness>
45: 
46: <philosophy>
47: **User = founder/visionary. the agent = builder.**
48: 
49: The user knows: how they imagine it working, what it should look/feel like, what's essential vs nice-to-have, specific behaviors or references they have in mind.
50: 
51: The user doesn't know (and shouldn't be asked): codebase patterns (researcher reads the code), technical risks (researcher identifies these), implementation approach (planner figures this out), success metrics (inferred from the work).
52: 
53: Ask about vision and implementation choices. Capture decisions for downstream agents.
54: </philosophy>
55: 
56: <scope_guardrail>
57: **CRITICAL: No scope creep.** The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.
58: 
59: **Allowed (clarifying ambiguity):** "How should posts be displayed?" (layout), "What happens on empty state?" (within the feature), "Pull to refresh or manual?" (behavior choice).
60: 
61: **Not allowed (scope creep):** "Should we also add comments?" / "What about search/filtering?" / "Maybe include bookmarking?" — those are new capabilities and belong in their own phase.
62: 
63: **Heuristic:** Does this clarify how we implement what's already in the phase, or does it add a new capability that could be its own phase?
64: 
65: **When user suggests scope creep:**
66: ```
67: "[Feature X] would be a new capability — that's its own phase.
68: Want me to note it for the roadmap backlog?
69: 
70: For now, let's focus on [phase domain]."
71: ```
72: 
73: Capture the idea in a "Deferred Ideas" section. Don't lose it, don't act on it.
74: </scope_guardrail>
75: 
76: <gray_area_identification>
77: Gray areas are **implementation decisions the user cares about** — things that could go multiple ways and would change the result.
78: 
79: 1. Read the phase goal from ROADMAP.md
80: 2. Understand the domain — something users SEE / CALL / RUN / READ / something being ORGANIZED — and let that drive what kinds of decisions matter
81: 3. Generate phase-specific gray areas (not generic categories)
82: 
83: **Don't use generic category labels** (UI, UX, Behavior). Generate specific gray areas. Examples:
84: 
85: ```
86: Phase: "User authentication"     → Session handling, Error responses, Multi-device policy, Recovery flow
87: Phase: "Organize photo library"  → Grouping criteria, Duplicate handling, Naming convention, Folder structure
88: Phase: "CLI for database backups"→ Output format, Flag design, Progress reporting, Error recovery
89: Phase: "API documentation"       → Structure/navigation, Code examples depth, Versioning approach, Interactive elements
90: ```
91: 
92: **the agent handles these (don't ask):** technical implementation details, architecture patterns, performance optimization, scope (roadmap defines this).
93: </gray_area_identification>
94: 
95: <answer_validation>
96: **IMPORTANT: Answer validation** — After every question call, if the response is empty/whitespace-only:
97: 
98: - **"Other" with empty text** (the user wants to type freeform): output `"What would you like to discuss?"`, STOP generating, wait for the user's next message, then reflect it back and continue. Do NOT retry question or call any tools.
99: - **Any other empty response:** retry once with the same parameters; if still empty, present options as a plain-text numbered list. Never proceed with empty input.
100: 
101: **Text mode** (`--text` or `workflow.text_mode: true`): follow `workflows/discuss-phase/modes/text.md` — do not use question at all.
102: </answer_validation>
103: 
104: <process>
105: 
106: **Express path available:** If you already have a PRD or acceptance criteria document, use `/gsd-plan-phase {phase} --prd path/to/prd.md` to skip this discussion and go straight to planning.
107: 
108: <step name="initialize" priority="first">
109: Phase number from argument (required).
110: 
111: ```bash
112: INIT=$(gsd-sdk query init.phase-op "${PHASE}")
113: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
114: AGENT_SKILLS_ADVISOR=$(gsd-sdk query agent-skills gsd-advisor-researcher)
115: ```
116: 
117: Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`, `response_language`.
118: 
119: **If `response_language` is set:** All user-facing questions, prompts, and explanations in this workflow MUST be presented in `{response_language}`. Technical terms, code, file paths, and subagent prompts stay in English — only user-facing output is translated.
120: 
121: **If `phase_found` is false:**
122: ```
123: Phase [X] not found in roadmap.
124: Use /gsd-progress ${GSD_WS} to see available phases.
125: ```
126: Exit workflow.
127: 
128: **Mode dispatch — Read mode files lazily based on flags in $ARGUMENTS:**
129: 
130: ```bash
131: # Detect advisor mode (file-existence guard — no Read until needed)
132: if [ -f "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md" ]; then
133:   ADVISOR_MODE=true
134: else
135:   ADVISOR_MODE=false
136: fi
137: ```
138: 
139: - If `--power` in $ARGUMENTS: `Read(workflows/discuss-phase/modes/power.md)` and execute it end-to-end. Do NOT continue with the steps below.
140: - Otherwise, continue. Per-flag overlay reads happen at their relevant steps:
141:   - `--all` → Read `workflows/discuss-phase/modes/all.md` before `present_gray_areas`.
142:   - `--auto` → Read `workflows/discuss-phase/modes/auto.md` before `check_existing` (it overrides several steps).
143:   - `--chain` → Read `workflows/discuss-phase/modes/chain.md` before `auto_advance`.
144:   - `--text` (or `workflow.text_mode: true`) → Read `workflows/discuss-phase/modes/text.md` before any question call.
145:   - `--batch` → Read `workflows/discuss-phase/modes/batch.md` before `discuss_areas`.
146:   - `--analyze` → Read `workflows/discuss-phase/modes/analyze.md` before `discuss_areas`.
147:   - `ADVISOR_MODE = true` → Read `workflows/discuss-phase/modes/advisor.md` before `analyze_phase` (it changes the discussion flow and adds an `advisor_research` substep).
148:   - No flags → Read `workflows/discuss-phase/modes/default.md` before `discuss_areas`.
149: 
150: **If `phase_found` is true:** Continue to `check_blocking_antipatterns`.
151: </step>
152: 
153: <step name="check_blocking_antipatterns" priority="first">
154: **MANDATORY — Check for blocking anti-patterns before any other work.**
155: 
156: Look for a `.continue-here.md` in the current phase directory:
157: 
158: ```bash
159: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
160: ```
161: 
162: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
163: 
164: **If one or more `blocking` anti-patterns are found:** the agent must demonstrate understanding of each by answering all three questions for each one:
165: 1. **What is this anti-pattern?** — Describe it in your own words.
166: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
167: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step or enforcement mechanism that stops recurrence.
168: 
169: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
170: 
171: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_spec`.
172: </step>
173: 
174: <step name="check_spec">
175: Check if a SPEC.md (from `/gsd-spec-phase`) exists for this phase. SPEC.md locks requirements before implementation decisions.
176: 
177: ```bash
178: ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
179: ```
180: 
181: **If SPEC.md is found:**
182: 1. Read the SPEC.md file.
183: 2. Count requirements (numbered items in `## Requirements`).
184: 3. Display: `Found SPEC.md — {N} requirements locked. Focusing on implementation decisions.`
185: 4. Set `spec_loaded = true`.
186: 5. Store requirements, boundaries, and acceptance criteria as `<locked_requirements>` — these flow directly into CONTEXT.md without re-asking.
187: 
188: **If no SPEC.md is found:** Continue with `spec_loaded = false`.
189: 
190: **Note:** SPEC.md files named `AI-SPEC.md` (from `/gsd-ai-integration-phase`) are excluded — different purpose.
191: </step>
192: 
193: <step name="check_existing">
194: Check if CONTEXT.md already exists using `has_context` from init.
195: 
196: ```bash
197: ls ${phase_dir}/*-CONTEXT.md 2>/dev/null || true
198: ```
199: 
200: **If exists:**
201: 
202: **If `--auto`:** Auto-select "Update it" — load existing context and continue to `analyze_phase`. Log: `[auto] Context exists — updating with auto-selected decisions.`
203: 
204: **Otherwise:** question (header: "Context"; question: "Phase [X] already has context. What do you want to do?"; options: "Update it" / "View it" / "Skip"). Branch accordingly.
205: 
206: **If doesn't exist:**
207: 
208: Check for an interrupted discussion checkpoint:
209: ```bash
210: ls ${phase_dir}/*-DISCUSS-CHECKPOINT.json 2>/dev/null || true
211: ```
212: 
213: If a checkpoint file exists:
214: 
215: **If `--auto`:** Auto-select "Resume" — load checkpoint and continue from last completed area.
216: 
217: **Otherwise:** question (header: "Resume"; question: "Found interrupted discussion checkpoint ({N} areas completed out of {M}). Resume from where you left off?"; options: "Resume" / "Start fresh"). On "Resume", parse the checkpoint JSON, load `decisions` into the internal accumulator, set `areas_completed` to skip those areas, continue to `present_gray_areas` with only the remaining areas. On "Start fresh", delete the checkpoint and continue.
218: 
219: Check `has_plans` and `plan_count` from init. **If `has_plans` is true:**
220: 
221: **If `--auto`:** Auto-select "Continue and replan after". Log: `[auto] Plans exist — continuing with context capture, will replan after.`
222: 
223: **Otherwise:** question (header: "Plans exist"; question: "Phase [X] already has {plan_count} plan(s) created without user context. Your decisions here won't affect existing plans unless you replan."; options: "Continue and replan after" / "View existing plans" / "Cancel"). Branch accordingly.
224: 
225: **If `has_plans` is false:** Continue to `load_prior_context`.
226: </step>
227: 
228: <step name="load_prior_context">
229: Read project-level and prior phase context to avoid re-asking decided questions.
230: 
231: ```bash
232: cat .planning/PROJECT.md 2>/dev/null || true
233: cat .planning/REQUIREMENTS.md 2>/dev/null || true
234: cat .planning/STATE.md 2>/dev/null || true
235: ```
236: 
237: Read at most **3** prior CONTEXT.md files (most recent 3 phases before current). If `.planning/DECISIONS-INDEX.md` exists, read that instead — it is a bounded rolling summary that supersedes per-phase reads.
238: 
239: ```bash
240: (find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort -r
241: ```
242: 
243: For each CONTEXT.md read: extract `<decisions>` (locked preferences), `<specifics>` (particular references), and patterns (e.g., "user prefers minimal UI", "user rejected single-key shortcuts").
244: 
245: **Spike/sketch findings:** Check for project-local skills:
246: ```bash
247: SPIKE_FINDINGS=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
248: SKETCH_FINDINGS=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
249: RAW_SPIKES=$(ls .planning/spikes/MANIFEST.md 2>/dev/null)
250: RAW_SKETCHES=$(ls .planning/sketches/MANIFEST.md 2>/dev/null)
251: ```
252: 
253: If findings skills exist, read SKILL.md and reference files; extract validated patterns, landmines, constraints, design decisions. Add them to `<prior_decisions>`.
254: 
255: If raw spikes/sketches exist but no findings skill, note: `⚠ Unpackaged spikes/sketches detected — run /gsd-spike --wrap-up or /gsd-sketch --wrap-up to make findings available.`
256: 
257: Build internal `<prior_decisions>` with sections for Project-Level (from PROJECT.md / REQUIREMENTS.md), From Prior Phases (per-phase decisions), and From Spike/Sketch Findings (validated patterns, landmines, design decisions).
258: 
259: **Usage downstream:** `analyze_phase` skips already-decided gray areas; `present_gray_areas` annotates options ("You chose X in Phase 5"); `discuss_areas` pre-fills or flags conflicts.
260: 
261: **If no prior context exists:** Continue without — expected for early phases.
262: </step>
263: 
264: <step name="cross_reference_todos">
265: Check pending todos for matches with this phase's scope.
266: 
267: ```bash
268: TODO_MATCHES=$(gsd-sdk query todo.match-phase "${PHASE_NUMBER}")
269: ```
270: 
271: Parse JSON for: `todo_count`, `matches[]` (each with `file`, `title`, `area`, `score`, `reasons`).
272: 
273: **If `todo_count` is 0 or `matches` is empty:** Skip silently.
274: 
275: **If matches found:** Present each match (title, area, why it matched). question (multiSelect) asking which to fold. Folded → `<folded_todos>` for CONTEXT.md `<decisions>`. Reviewed but not folded → `<reviewed_todos>` for CONTEXT.md `<deferred>`.
276: 
277: **Auto mode (`--auto`):** Fold all todos with score >= 0.4 automatically. Log the selection.
278: </step>
279: 
280: <step name="scout_codebase">
281: Lightweight scan of existing code to inform gray area identification (~10% context).
282: 
283: Read `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md` — it contains the phase-type→map selection table, single-read rule, no-maps fallback, and `<codebase_context>` output schema. Then execute:
284: 1. `ls .planning/codebase/*.md` to find existing maps
285: 2. Select 2–3 maps via the reference's table; or grep fallback if none exist
286: 3. Build internal `<codebase_context>` per the reference's output schema
287: </step>
288: 
289: <step name="analyze_phase">
290: Analyze the phase to identify gray areas. Use both `prior_decisions` and `codebase_context` to ground the analysis.
291: 
292: 1. **Domain boundary** — What capability is this phase delivering? State it clearly.
293: 
294: 1b. **Initialize canonical refs accumulator** — Start building `<canonical_refs>` for CONTEXT.md. Sources:
295:    - **Now:** Copy `Canonical refs:` from ROADMAP.md for this phase. Expand each to a full relative path. Check REQUIREMENTS.md and PROJECT.md for specs/ADRs referenced.
296:    - **`scout_codebase`:** If existing code references docs (e.g., comments citing ADRs), add those.
297:    - **`discuss_areas`:** When the user says "read X", "check Y", or references any doc/spec/ADR — add it immediately. These are often the MOST important refs.
298: 
299:    This list is MANDATORY in CONTEXT.md. Every ref must have a full relative path. If no external docs exist, note that explicitly.
300: 
301: 2. **Check prior decisions** — Scan `<prior_decisions>` for already-decided gray areas; mark them pre-answered.
302: 
303: 2b. **SPEC.md awareness** — If `spec_loaded = true`: `<locked_requirements>` are pre-answered (Goal, Boundaries, Constraints, Acceptance Criteria). Do NOT generate gray areas about WHAT to build or WHY. Only generate gray areas about HOW to implement. When presenting, include: "Requirements are locked by SPEC.md — discussing implementation decisions only."
304: 
305: 3. **Gray areas** — For each relevant category, identify 1-2 specific ambiguities that would change implementation. Annotate with code context where relevant.
306: 
307: 4. **Skip assessment** — If no meaningful gray areas exist (pure infrastructure, clear-cut implementation, all already decided), the phase may not need discussion.
308: 
309: **Advisor mode hand-off:** If `ADVISOR_MODE` is true, follow `workflows/discuss-phase/modes/advisor.md` for the rest of analyze/discuss flow (it adds an `advisor_research` substep and replaces the standard `discuss_areas` with table-first selection). The detection block (USER-PROFILE.md existence + non-technical-owner signals + calibration tier resolution) lives in that file — read it once when ADVISOR_MODE is true and follow its rules.
310: </step>
311: 
312: <step name="present_gray_areas">
313: Present the domain boundary, prior decisions, and gray areas to the user.
314: 
315: ```
316: Phase [X]: [Name]
317: Domain: [What this phase delivers — from your analysis]
318: 
319: We'll clarify HOW to implement this. (New capabilities belong in other phases.)
320: 
321: [If prior decisions apply:]
322: **Carrying forward from earlier phases:**
323: - [Decision from Phase N that applies here]
324: ```
325: 
326: **If `--auto` or `--all`** (per `modes/auto.md` or `modes/all.md`): Auto-select ALL gray areas. Log: `[--auto/--all] Selected all gray areas: [list area names].` Skip the question below and continue directly to `discuss_areas` with all areas selected.
327: 
328: **Otherwise, use question (multiSelect: true):**
329: - header: "Discuss"
330: - question: "Which areas do you want to discuss for [phase name]?"
331: - options: 3-4 phase-specific gray areas, each with a concrete label (not generic), 1-2 questions in description, and code-context / prior-decision annotations:
332:   ```
333:   ☐ Layout style — Cards vs list vs timeline?
334:     (You already have a Card component with shadow/rounded variants. Reusing it keeps the app consistent.)
335: 
336:   ☐ Loading behavior — Infinite scroll or pagination?
337:     (You chose infinite scroll in Phase 4. useInfiniteQuery hook already set up.)
338:   ```
339: 
340: **Do NOT include a "skip" or "you decide" option.** User ran this command to discuss — give real choices.
341: 
342: Continue to `discuss_areas` with selected areas (or to `advisor_research` per `modes/advisor.md` if `ADVISOR_MODE` is true).
343: </step>
344: 
345: <step name="discuss_areas">
346: Discussion behavior is defined by the active mode file(s):
347: 
348: - **Advisor mode (ADVISOR_MODE = true):** follow `workflows/discuss-phase/modes/advisor.md` — research-backed comparison tables, table-first selection.
349: - **--auto:** follow `workflows/discuss-phase/modes/auto.md` — the agent picks recommended option for every question; no question. Single-pass cap enforced.
350: - **Default (no flags):** follow `workflows/discuss-phase/modes/default.md` — 4 single-question turns per area, then check whether to continue.
351: 
352: Overlays (combine with the active mode):
353: - `--text` → `workflows/discuss-phase/modes/text.md` (replace question with plain-text numbered lists)
354: - `--batch` → `workflows/discuss-phase/modes/batch.md` (group 2–5 questions per turn)
355: - `--analyze` → `workflows/discuss-phase/modes/analyze.md` (trade-off table before each question)
356: 
357: **Overlay stacking:** overlays combine and apply outer→inner in fixed order `--analyze` → `--batch` → `--text` (e.g., `--batch --analyze` = trade-off table per question group; add `--text` for plain-text rendering). Mode-specific precedence (e.g., `--auto --power`) is documented in each overlay file's "Combination rules" section.
358: 
359: All modes preserve the universal rules below.
360: 
361: **Universal rules (apply to every mode):**
362: 
363: - **Canonical ref accumulation** — when the user references a doc/spec/ADR during any answer, immediately Read it (or confirm it exists) and add it to the canonical refs accumulator with full relative path. Use what you learned to inform subsequent questions. These docs are often MORE important than ROADMAP.md refs because the user specifically wants downstream agents to follow them.
364: - **Scope creep** — if user mentions something outside the phase domain, capture as deferred idea and redirect.
365: - **Incremental checkpoint** — after each area completes, write `${phase_dir}/${padded_phase}-DISCUSS-CHECKPOINT.json`. Read `workflows/discuss-phase/templates/checkpoint.json` for the schema. The checkpoint is structured state, not the canonical CONTEXT.md (`write_context` produces the canonical output). On session resume, the parent's `check_existing` step detects the checkpoint and offers to resume.
366: - **Discussion log accumulation** — for each question asked, accumulate area name, options presented, user's selection, follow-up notes. Used by `git_commit` to write DISCUSSION-LOG.md.
367: </step>
368: 
369: <step name="write_context">
370: Create CONTEXT.md and DISCUSSION-LOG.md.
371: 
372: DISCUSSION-LOG.md is for human reference only (audits, retrospectives) and is NOT consumed by downstream agents (researcher, planner, executor).
373: 
374: **Find or create phase directory:**
375: 
376: Use values from init: `phase_dir`, `phase_slug`, `padded_phase`. If `phase_dir` is null:
377: ```bash
378: mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
379: ```
380: 
381: **File location:** `${phase_dir}/${padded_phase}-CONTEXT.md`
382: 
383: **Read the CONTEXT.md template now (lazy-loaded):**
384: ```
385: Read(workflows/discuss-phase/templates/context.md)
386: ```
387: 
388: The template documents variable substitutions and conditional sections. Substitute live values for `[X]`, `[Name]`, `[date]`, `${padded_phase}`, `{N}`. Include `<spec_lock>` only when `spec_loaded = true`. Include "Folded Todos" / "Reviewed Todos" subsections only when the `cross_reference_todos` step folded or reviewed todos.
389: 
390: **SPEC.md integration** — If `spec_loaded = true`:
391: - Add the `<spec_lock>` section immediately after `<domain>`.
392: - Add the SPEC.md file to `<canonical_refs>` with note "Locked requirements — MUST read before planning".
393: - Do NOT duplicate requirements text from SPEC.md into `<decisions>` — agents read SPEC.md directly.
394: - The `<decisions>` section contains only implementation decisions from this discussion.
395: 
396: Write the file.
397: </step>
398: 
399: <step name="confirm_creation">
400: Present summary and next steps:
401: 
402: ```
403: Created: .planning/phases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md
404: 
405: ## Decisions Captured
406: ### [Category]
407: - [Key decision]
408: 
409: [If deferred ideas exist:]
410: ## Noted for Later
411: - [Deferred idea] — future phase
412: 
413: ---
414: 
415: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
416: 
417: **Phase ${PHASE}: [Name]** — [Goal from ROADMAP.md]
418: 
419: `/clear` then:
420: 
421: `/gsd-plan-phase ${PHASE} ${GSD_WS}`
422: 
423: ---
424: 
425: **Also available:** `--chain` for auto plan+execute after; `/gsd-plan-phase ${PHASE} --skip-research ${GSD_WS}` to plan without research; `/gsd-ui-phase ${PHASE} ${GSD_WS}` for UI design contracts; review/edit CONTEXT.md before continuing.
426: ```
427: </step>
428: 
429: <step name="git_commit">
430: **Write DISCUSSION-LOG.md before committing.**
431: 
432: **File location:** `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md`
433: 
434: **Read the DISCUSSION-LOG.md template now (lazy-loaded):**
435: ```
436: Read(workflows/discuss-phase/templates/discussion-log.md)
437: ```
438: 
439: Substitute live values from the discussion log accumulator (area names, options presented, user selections, notes, deferred ideas, the agent's discretion items). Write the file.
440: 
441: **Clean up checkpoint file** — CONTEXT.md is now the canonical record:
442: ```bash
443: rm -f "${phase_dir}/${padded_phase}-DISCUSS-CHECKPOINT.json"
444: ```
445: 
446: Commit phase context and discussion log:
447: ```bash
448: gsd-sdk query commit "docs(${padded_phase}): capture phase context" --files "${phase_dir}/${padded_phase}-CONTEXT.md" "${phase_dir}/${padded_phase}-DISCUSSION-LOG.md"
449: ```
450: 
451: Confirm: "Committed: docs(${padded_phase}): capture phase context"
452: </step>
453: 
454: <step name="update_state">
455: Update STATE.md with session info:
456: 
457: ```bash
458: gsd-sdk query state.record-session \
459:   --stopped-at "Phase ${PHASE} context gathered" \
460:   --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
461: 
462: gsd-sdk query commit "docs(state): record phase ${PHASE} context session" --files .planning/STATE.md
463: ```
464: </step>
465: 
466: <step name="auto_advance">
467: Auto-advance behavior is defined in `workflows/discuss-phase/modes/chain.md`.
468: 
469: If `--auto`, `--chain`, or `workflow.auto_advance` is enabled, Read that file now and execute its `auto_advance` step (which handles flag-syncing, banner display, plan-phase Skill dispatch, and return-status branching).
470: 
471: Otherwise, route to `confirm_creation` (manual next steps).
472: </step>
473: 
474: </process>
475: 
476: <success_criteria>
477: - Phase validated against roadmap
478: - Prior context loaded (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
479: - Already-decided questions not re-asked (carried forward from prior phases)
480: - Codebase scouted for reusable assets, patterns, and integration points
481: - Gray areas identified with code and prior-decision annotations
482: - User selected which areas to discuss (or `--all`/`--auto` auto-selected)
483: - Each selected area explored under the active mode's rules until satisfied
484: - Scope creep redirected to deferred ideas
485: - CONTEXT.md captures actual decisions, not vague vision
486: - CONTEXT.md includes canonical_refs section with full file paths to every spec/ADR/doc downstream agents need (MANDATORY)
487: - CONTEXT.md includes code_context section with reusable assets and patterns
488: - Deferred ideas preserved for future phases
489: - STATE.md updated with session info
490: - User knows next steps
491: - Checkpoint file written after each area completes (incremental save)
492: - Interrupted sessions can be resumed from checkpoint
493: - Checkpoint file cleaned up after successful CONTEXT.md write
494: - `--chain` triggers interactive discuss followed by auto plan+execute (no auto-answering)
495: - `--chain` and `--auto` both persist chain flag and auto-advance to plan-phase
496: - Per-mode bodies, templates, and advisor flow are lazy-loaded — parent stays under the workflow size budget enforced by `tests/workflow-size-budget.test.cjs`
497: </success_criteria>

(End of file - total 497 lines)
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
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ycYUS9hcJMuPCmXAZVZx0326"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_NklmS2fKkRwoakodIf0J3056"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_gnTyvWSwMsmjTyAYACsM1776"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_4YHEZ5dk0hiyFH1CXoHg7776"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_EtxGIj8D2ZL1ZprqBXvC5296"
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

(Showing lines 1-60 of 95. Use offset=61 to continue.)
</content>
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_8dXzJ5kWX8z4RvshIGE60855"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_04_AWoIG7trMvUGIsSUCBYL1195"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/MCM-02-skill-migration/MCM-02-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/MCM-01-agent-migration/MCM-01-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md</path>
<type>file</type>
<content>
1: # Phase CP-ST-01: Session Tracker Revamp - Context
2: 
3: **Gathered:** 2026-05-11
4: **Status:** Ready for planning
5: 
6: <domain>
7: ## Phase Boundary
8: 
9: Replace the broken event tracker (`src/task-management/journal/event-tracker/`) with a clean session tracker module (`src/features/session-tracker/`) that captures hierarchical, searchable, agent-reconsumable session knowledge files under `.hivemind/session-tracker/`. The tracker uses OpenCode SDK hooks for real-time capture and REST API for disconnection recovery. It produces one subdir per main session containing a primary .md knowledge file, child .json delegation files, and dual continuity indices.
10: 
11: </domain>
12: 
13: <spec_lock>
14: ## Requirements (locked via SPEC.md)
15: 
16: **13 requirements are locked.** See `01-SPEC.md` for full requirements, boundaries, and acceptance criteria.
17: 
18: Downstream agents MUST read `01-SPEC.md` before planning or implementing. Requirements are not duplicated here.
19: 
20: **In scope (from SPEC.md):**
21: - New session tracker module under `src/features/session-tracker/` (owning typed module)
22: - Hook integration via existing `createCoreHooks()` observer pipeline
23: - File structure: `.hivemind/session-tracker/{main-session-id}/` with MD + JSON outputs
24: - Project-level index: `.hivemind/session-tracker/project-continuity.json` (cross-session connections)
25: - Session-local index: `.hivemind/session-tracker/{main-session-id}/session-continuity.json` (parent-child hierarchy within session)
26: - Recovery/reconsumption via OpenCode SDK REST API (`client.session.*`)
27: - Up to 3 levels of delegation depth, up to 6 concurrent sessions
28: - Conservative cleanup of contaminated `.hivemind/event-tracker/` state files
29: 
30: **Out of scope (from SPEC.md):**
31: - Sidecar dashboard integration (Q2, separate project)
32: - SSE-based real-time streaming (plugin receives events directly via hooks)
33: - Changes to delegation manager, concurrency queue, or completion detector
34: - Changes to `.opencode/` primitives
35: - Removal of old event-tracker module code (kept as safety net)
36: 
37: </spec_lock>
38: 
39: <decisions>
40: ## Implementation Decisions
41: 
42: ### Hook Wiring
43: - **D-01: Deps injection pattern.** SessionTracker receives callbacks via constructor. `createCoreHooks()` passes them as hook deps. `plugin.ts` adds one instantiation line. Matches existing DelegationManager wiring pattern. Avoids bloating plugin.ts (already 447 LOC).
44: 
45: ### Tool Surface
46: - **D-02: Single extensible session-tracker tool + TODO for expansion.** Start with one tool per CUSTOM-TOOLS-CRITERIA (C2: Governance & State). Designed for extensibility from day one. TODO recorded for future expansion into hierarchy context retrieval toolset connecting to doc-intelligence, agent classifications, and coordination realms.
47: 
48: ### Write Safety
49: - **D-03: Atomic rename + serialize queue.** All file writes use write-to-temp + `fs.rename()`. Index files use a promise-chain queue so only one write is in-flight at a time. No external dependencies. Crash-safe by design.
50: 
51: ### MD Update Pattern + Child Session Recognition
52: - **D-04: Append-per-event with task-tool as authoritative delegation signal.**
53:   - Each hook event (chat.message, tool.execute.after) appends to the main session .md immediately. Combined with D-03's atomic rename, each append is crash-safe.
54:   - The `task` tool output provides the child session ID directly — no separate parent-check needed. When `tool.execute.after` fires with `tool === "task"`, the output `task_id` IS the child session ID.
55:   - Root session recognition: `session.created` event + one `client.session.get()` call to check `parentID === null` → creates subdir.
56:   - No complex parent-resolution caches. Clean, direct logic.
57:   - Main session .md grows incrementally. No batching, no accumulation-then-write.
58: 
59: ### Recovery Trigger Timing
60: - **D-05: No separate recovery — hook flow IS recovery.**
61:   - On plugin load: read `project-continuity.json` to discover existing sessions and build session map. This is initialization, not recovery.
62:   - When a user resumes a main session, `chat.message` fires and the tracker appends to the existing .md. Normal hook flow handles it.
63:   - Child session disconnection: tracker marks child `.json` with `status: "error"` via `session.error` or `session.deleted` event. The parent's task loop handles re-dispatch.
64:   - No explicit recovery action needed — the hook pipeline naturally resumes.
65: 
66: ### Agent's Discretion
67: - Exact internal module structure within `src/features/session-tracker/` is up to the planner/researcher as long as it follows the SPEC.md placement guide (Section 9).
68: - Exact field naming for internal schemas (beyond what SPEC.md specifies) is up to the implementer following camelCase convention per REQ-ST-12.
69: - Error handling granularity for hook callbacks (log-and-continue vs structured error tracking) is up to the implementer.
70: 
71: </decisions>
72: 
73: <canonical_refs>
74: ## Canonical References
75: 
76: **Downstream agents MUST read these before planning or implementing.**
77: 
78: ### Specification
79: - `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked requirements (13 REQs), architecture, file formats, SDK API surface, acceptance matrix. MUST read before planning.
80: 
81: ### Architecture & Governance
82: - `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph. Hooks must NOT directly write to `.hivemind/` — route through typed owning module.
83: - `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract, L0-L3 hierarchy.
84: - `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 8 criteria for custom tool design (discoverability, determinism, composability, granularity, schema validation, non-conflict, ergonomics, purpose-driven design). Tool classification matrix.
85: 
86: ### Audit Evidence
87: - `.hivemind/audit/flaw-register-2026-05-10.json` — 12 flaws (F1-F12) with file:line evidence that the new module must resolve.
88: - `.hivemind/audit/state-persistence-audit-2026-05-10.md` — Source+state inventory of existing event tracker.
89: 
90: ### Reference Implementation
91: - `session-ses_1ed9.md` — 7321-line manual export showing exact capture format, field hierarchy, actor transforms, and pruning rules the user expects.
92: 
93: ### User Intent
94: - `.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md` — User's original specification (116 lines) with detailed capture rules.
95: 
96: ### SDK Reference
97: - `node_modules/@opencode-ai/plugin/dist/index.d.ts` — Installed SDK types. Hooks interface: `event`, `chat.message`, `tool.execute.after` all provide `sessionID` but NOT `parentID`. Must use `client.session.get()` for parent resolution.
98: 
99: ### Prior Phase Contexts (pattern reference)
100: - `.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-CONTEXT.md` — Prior CONTEXT.md for format/structure reference.
101: 
102: </canonical_refs>
103: 
104: <code_context>
105: ## Existing Code Insights
106: 
107: ### Reusable Assets
108: - `src/hooks/index.ts` — `createCoreHooks()` observer pipeline. Session tracker hooks attach here via deps injection (same pattern as DelegationManager).
109: - `src/shared/session-api.ts` — SDK wrapper functions. Session tracker reuses `client.session.get()`, `client.session.list()` for session metadata.
110: - `src/shared/tool-response.ts` — Standard response wrapper for tool results.
111: - `src/plugin.ts` lines 44, 110-113 — Current event-tracker wiring location. Session tracker replaces this with one instantiation line.
112: 
113: ### Established Patterns
114: - **Deps injection in hooks:** DelegationManager receives SDK client via constructor, hooks call its methods. Session tracker follows the same pattern.
115: - **Atomic file writes:** Existing harness modules use write-to-temp patterns. Session tracker formalizes this with `fs.rename()`.
116: - **Feature module structure:** `src/features/` modules own their persistence logic. No direct filesystem writes from hooks (REQ-ST-11).
117: 
118: ### Integration Points
119: - `src/hooks/index.ts` — Hook registration point. Session tracker's hooks attach via deps injection into `createCoreHooks()`.
120: - `src/plugin.ts` — Plugin composition root. One new line to instantiate SessionTracker and pass to hooks.
121: - `src/shared/types.ts` — Shared type definitions. New session tracker types may be added here.
122: - `.hivemind/session-tracker/` — New persistence root. Must NOT write to `.hivemind/event-tracker/` (legacy).
123: 
124: </code_context>
125: 
126: <specifics>
127: ## Specific Ideas
128: 
129: - User emphasized: "do not over engineer" — clean, direct logic. The task tool output IS the delegation signal. No complex parent-resolution caches needed.
130: - User specified: main session .md files use YAML frontmatter + Markdown content. Child sessions use JSON only. No XML/YAML for child files.
131: - User specified: "as long as the main session of this is on going the following captured parts appended and the updated time updated" — append-per-event, no batching.
132: - User specified: up to 6 concurrent sessions (parent + children). Must be write-isolated.
133: - User specified: capture rules are selective — skip thinking blocks, prune tool output to metadata only, transform `##USER` in child sessions to `main_l0_agent`.
134: - User specified: child session recognition is critical — when OpenCode's `task` tool creates a new session, it fires `session.created` as a separate session. The tracker must recognize it as a child (not a new root) and write to `.json` under the parent's subdir.
135: 
136: </specifics>
137: 
138: <deferred>
139: ## Deferred Ideas
140: 
141: - **Hierarchy context retrieval toolset** — Expansion of session-tracker tool into a family of tools connecting to doc-intelligence, agent classifications, and coordination realms. This is a TODO for a future phase. The current tool must be designed for extensibility.
142: - **Sidecar dashboard integration** (Q2) — Out of scope. The session tracker produces files that the sidecar CAN read, but no sidecar-specific code.
143: - **Real-time SSE streaming** — Out of scope. Plugin receives events directly via hooks, not via HTTP.
144: 
145: </deferred>
146: 
147: ---
148: 
149: *Phase: CP-ST-01-Session Tracker Revamp*
150: *Context gathered: 2026-05-11*

(End of file - total 150 lines)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Dj3ArrURb43eD6a0rKJA9235"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_xdUFoYou7z9E8DiW3wBg8283"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
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


### Tool: question

**Input:**
```json
{
  "callID": "call_00_DVsvYKFPI08VP7Zn3K0G9404"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Bj9qDDRi3wHvbLiR4phX8262"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Vimz4EnBhNPZsQb8A96e0565"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_6uuuzbrAnHQETwPrRiNO2713"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_dX5FJamnPYqbJu9j41vx8321"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Q91nNZJL0h0RALfZIEIt5594"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/checkpoint.json"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_BX4WuwwardtzLQ22Vrmg4275"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_SBy2VQ196Nn8cwuMnxbs0325"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_CGjmweUkJLvupJ27mu888115"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_HuNV8zV37WKihLOZn9IT6244"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_rADLMWUHvh25xQYLWgPY5282"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_jxM6ORBTg1KYX66GozLL9426"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_sNjqEpU4dukhJnLUsoht9431"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_FpYHz12sxd13MajdixGA0760"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_GQ8j7RRGX1Px7jfNbiuy1609"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_HDWaBQQ1FYPx7q95UCjC5442"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_5x1RVNnndbXmTLtPoteX8205"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_Ey2lnJzpEC4YzosVoIYL2098"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_Pr7EdInSGz2v3NAP4Zdm2276"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_GzZpBJjuUg9c7e5NRDLf7257"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_pmhgHzlfPG5NNvxJqIug6903"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_cuKM6RxIUDu0EkDhDg8j9147"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_V5am6W8lArbpCOm2cnFU2566"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_W34FXHSrOSv4JZxq87rU8641"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_FHHXPqoUYNyyep4c3iY46256"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_jHzgSHCSOfIKMQU3yAEY5457"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/discussion-log.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_UDCcHFaCmi7tZMghZ1FN8087"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_idfDk1mpJU5afBOKXM0g5372"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4xRPalwb1qNL69Ed3MkZ6915"
}
```


## USER (turn 3)

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
Phase number: 11 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_DlCMtaopOgNul4mZ1hu43008"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_JPm3UCKe4ID8JKPIk7Mc7569"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1IBXBrKIvdvbA1GO2CTW5340"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research Phase 11 governance reconciliation",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1e9800d25ffelHwiHHL46jVFJA"
}
```

**Output:** (pruned)
```
task_id: ses_1e9800d25ffelHwiHHL46jVFJA
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_AzEKHFopBbNwI3BbejBL3090"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_vEvbBrdS87i6mxHedmsz6124"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_X7Dan9BSBuGyLbv2KW0i7689"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_G9ynh8XPY3WYodlcnr420214"
}
```


---
sessionID: ses_1e9a1d794ffePl33pFTux271hR
created: 2026-05-11T10:56:53.754Z
updated: 2026-05-11T10:56:53.754Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

I was disconnected leading to downstream disconnection you can glob, list, grep quick search from these session-tracker to resume though I dont know which session ```.hivemind/session-tracker
.hivemind/session-tracker/ses_1e9a1d794ffePl33pFTux271hR
.hivemind/session-tracker/ses_1e9a1d794ffePl33pFTux271hR/ses_1e9a1d794ffePl33pFTux271hR.md
.hivemind/session-tracker/ses_1e9a1d794ffePl33pFTux271hR/ses_1e9800d25ffelHwiHHL46jVFJA.json
.hivemind/session-tracker/ses_1e9a1d794ffePl33pFTux271hR/session-continuity.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e9a6ecf5ffev5trgNwpy4CjOf.md
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e99ac4e3ffeSa0QV5dg96628Q.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e99b6d51ffePAxZJNXXFiOv24.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e99b195affetbGfs42YyehaEO.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e99bd468ffetJO2iV7K2XEqmc.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/ses_1e99c28bbffek55k6UCs0G7d4N.json
.hivemind/session-tracker/ses_1e9a6ecf5ffev5trgNwpy4CjOf/session-continuity.json
.hivemind/session-tracker/ses_1e9b9cb08ffeHdv8qgplK8c32n
.hivemind/session-tracker/ses_1e9b9cb08ffeHdv8qgplK8c32n/ses_1e9b9cb08ffeHdv8qgplK8c32n.md
.hivemind/session-tracker/ses_1e9ba1b66ffeScl7Vx3aZI0uIi
.hivemind/session-tracker/ses_1e9ba1b66ffeScl7Vx3aZI0uIi/ses_1e9ba1b66ffeScl7Vx3aZI0uIi.md
.hivemind/session-tracker/ses_1e9bc0b1dffeLIeMexVP8ocRAF
.hivemind/session-tracker/ses_1e9cb63e1ffeJrujKyck8il4jn
.hivemind/session-tracker/ses_1e96ce433ffer2T3aNcOKIEJxs
.hivemind/session-tracker/ses_1e96d391affeh3u28bax2rTY1M
.hivemind/session-tracker/ses_1e97a18f0ffe4tz4GJcaLAfmC3
.hivemind/session-tracker/ses_1e97f2b71ffekeC96spZzG8CJ3
.hivemind/session-tracker/ses_1e98d82dcffefzTttpLHcEMF5a
.hivemind/session-tracker/ses_1e99ac4e3ffeSa0QV5dg96628Q
.hivemind/session-tracker/ses_1e99b6d51ffePAxZJNXXFiOv24
.hivemind/session-tracker/ses_1e99b195affetbGfs42YyehaEO
.hivemind/session-tracker/ses_1e99bd468ffetJO2iV7K2XEqmc
.hivemind/session-tracker/ses_1e99c28bbffek55k6UCs0G7d4N
.hivemind/session-tracker/ses_1e970d701ffe8vLOukfuuK31xo
.hivemind/session-tracker/ses_1e974ef7effeAqNql6h7ZC8oQ0
.hivemind/session-tracker/ses_1e9800d25ffelHwiHHL46jVFJA
.hivemind/session-tracker/ses_1e96915e3ffeS2ppeUZyyHcogl
.hivemind/session-tracker/ses_1e97113d3ffeLo40kFMcG0T8ay
.hivemind/session-tracker/ses_1e9734971ffewoLT5pzVTcvXJk
.hivemind/session-tracker/ses_1ebc4ae10ffexMyoJGEqD9S3kW
.hivemind/session-tracker/ses_1ebc4ae10ffexMyoJGEqD9S3kW/ses_1ebc4ae10ffexMyoJGEqD9S3kW.md
.hivemind/session-tracker/ses_1ebc4ccf2ffeiMfXjMfXiO8mma
.hivemind/session-tracker/ses_1ebc4ccf2ffeiMfXjMfXiO8mma/ses_1ebc4ccf2ffeiMfXjMfXiO8mma.md
.hivemind/session-tracker/ses_1ebc5d7b3ffesswQph1WbYR866
.hivemind/session-tracker/ses_1ebc5d7b3ffesswQph1WbYR866/ses_1ebc5d7b3ffesswQph1WbYR866.md
.hivemind/session-tracker/ses_1ebc46e73ffek1nxhr2zx0QDHn
.hivemind/session-tracker/ses_1ebc46e73ffek1nxhr2zx0QDHn/ses_1ebc46e73ffek1nxhr2zx0QDHn.md
.hivemind/session-tracker/ses_1ebc494a4ffe28VByY8t3Bfa9o
.hivemind/session-tracker/ses_1ebc494a4ffe28VByY8t3Bfa9o/ses_1ebc494a4ffe28VByY8t3Bfa9o.md
.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD
.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/ses_1ebd373b1ffeDa7AJ7KJIPShVE.json
.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/ses_1ebe832c5ffeeYuFbS1kqleZnD.md
.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/ses_1ebe39941ffecHehSRcc13IqeD.json
.hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json
.hivemind/session-tracker/ses_1ebe39941ffecHehSRcc13IqeD
.hivemind/session-tracker/ses_1ebe39941ffecHehSRcc13IqeD/ses_1ebe28c52ffeIoXFCcAZnCj0IC.json
.hivemind/session-tracker/ses_1ebe39941ffecHehSRcc13IqeD/ses_1ebe39941ffecHehSRcc13IqeD.md
.hivemind/session-tracker/ses_1ebe39941ffecHehSRcc13IqeD/session-continuity.json
.hivemind/session-tracker/ses_1f09ebfa5ffe7eMXBiUh9oAhvF
.hivemind/session-tracker/ses_1f09ebfa5ffe7eMXBiUh9oAhvF/ses_1e97f2b71ffekeC96spZzG8CJ3.json
.hivemind/session-tracker/ses_1f09ebfa5ffe7eMXBiUh9oAhvF/ses_1f09ebfa5ffe7eMXBiUh9oAhvF.md
.hivemind/session-tracker/ses_1f09ebfa5ffe7eMXBiUh9oAhvF/session-continuity.json
.hivemind/session-tracker/project-continuity.json ```

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JzHdW6ydu1Rcdt3oe8fT8776"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_0PgpcnZVCIU5M8KSNUYb5328"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2nlgZmNtqZHqpNvyLV9o9476"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_W9q25RRg2x2DzT0XME3l5455"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_9vLYM3doCe3uyzkJi1634451"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fsP2ZJPvviip2RKdFNq34089"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Verify Phase 11 plans",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1e94e9af4ffeKaZSC34RC2RzZE"
}
```

**Output:** (pruned)
```
task_id: ses_1e94e9af4ffeKaZSC34RC2RzZE
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_oFiBbJGIoVn4PvYUMnwS6279"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-05-PLAN.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_c95bJDdr8ibEhIlC54DB7236"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_5oSTgOBYO5gDhLrqBfRb0266"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_1aUS2kFbUp6egM2gQxKp6575"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_juh7KdbRHL8SLfsB1A5r3282"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_sK8lcsB1O4H4hSubO6Rk2740"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_M4k3wdpYXjtc6MauNtTc4505"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zBXu1jAadGkysbECPtV78251"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Re-verify Phase 11 plans after fix",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1e9442519ffeu92Cq5yHlplIoO"
}
```

**Output:** (pruned)
```
task_id: ses_1e9442519ffeu92Cq5yHlplIoO
```


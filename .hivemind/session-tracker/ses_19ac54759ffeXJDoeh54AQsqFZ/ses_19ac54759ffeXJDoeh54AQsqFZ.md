---
sessionID: ses_19ac54759ffeXJDoeh54AQsqFZ
created: 2026-05-26T17:00:07.815Z
updated: 2026-05-26T17:05:14.930Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_19abc24acffejXpp8PXdH7TT8X
    childFile: ses_19abc24acffejXpp8PXdH7TT8X.json
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-05-26T17:00:07.718Z
---

## USER (turn 1)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
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
34: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
35: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
36: if [ -f "$GSD_TOOLS" ]; then
37:   GSD_SDK="node $GSD_TOOLS"
38: elif command -v gsd-sdk >/dev/null 2>&1; then
39:   GSD_SDK="gsd-sdk"
40: else
41:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
42:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
43:   exit 1
44: fi
45: INIT=$($GSD_SDK query init.plan-phase "$PHASE")
46: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
47: AGENT_SKILLS_RESEARCHER=$($GSD_SDK query agent-skills gsd-phase-researcher)
48: AGENT_SKILLS_PLANNER=$($GSD_SDK query agent-skills gsd-planner)
49: AGENT_SKILLS_CHECKER=$($GSD_SDK query agent-skills gsd-plan-checker)
50: CONTEXT_WINDOW=$($GSD_SDK query config-get context_window 2>/dev/null || echo "200000")
51: TDD_MODE=$($GSD_SDK query config-get workflow.tdd_mode 2>/dev/null || echo "false")
52: MVP_MODE_CFG=$($GSD_SDK query config-get workflow.mvp_mode 2>/dev/null || echo "false")
53: ```
54: 
55: When `TDD_MODE` is `true`, the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The planner's `<required_reading>` is extended to include `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` so gate enforcement rules are available during planning.
56: 
57: When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardless of recency (e.g., Phase 7 declaring `Depends on: Phase 2` always sees Phase 2's context). Bounded recency keeps the planner's context budget focused on recent work.
58: 
59: Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `phase_status` (#3569), `planning_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
60: 
61: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
62: 
63: **File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.
64: 
65: **If `planning_exists` is false:** Error — run `/gsd-new-project` first.
66: 
67: ## 1.5. Closed-Phase Gate (#3569)
68: 
69: The init JSON includes `phase_status` — one of `Pending | Planned | In Progress | Executed | Complete | Needs Review`. `Complete` means the phase has all summaries AND a `VERIFICATION.md` with `status: passed`. Replanning a closed phase silently rewrites plan docs that no longer match the shipped code, so the workflow must hard-stop here unless the operator explicitly overrides.
70: 
71: Parse `phase_status` from the init JSON, then:
72: 
73: ```bash
74: FORCE_REPLAN=false
75: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--force([[:space:]]|$) ]]; then
76:   FORCE_REPLAN=true
77: fi
78: 
79: if [ "${phase_status}" = "Complete" ]; then
80:   if [[ "$ARGUMENTS" =~ (^|[[:space:]])--reviews([[:space:]]|$) ]]; then
81:     # --reviews on a closed phase is never legitimate — concerns belong in a
82:     # new phase or issue against the closed phase's commits.
83:     cat <<EOF >&2
84: Phase ${phase_number} (${phase_name}) is already CLOSED (VERIFICATION status: passed).
85: /gsd-plan-phase --reviews cannot replan a closed phase. If the review surfaced
86: real concerns, open a follow-up phase or file an issue against the closed
87: phase's commits. There is no --force override for --reviews on a closed phase.
88: EOF
89:     exit 1
90:   fi
91:   if [ "$FORCE_REPLAN" != "true" ]; then
92:     cat <<EOF >&2
93: Phase ${phase_number} (${phase_name}) is already CLOSED (VERIFICATION status: passed).
94: Replanning a closed phase will overwrite plan docs that no longer match the
95: shipped code. If you intentionally want to replan over closed work, re-run
96: with: /gsd-plan-phase ${phase_number} --force
97: 
98: Otherwise, to view what shipped, see: ${verification_path}
99: EOF
100:     exit 1
101:   fi
102:   # FORCE_REPLAN=true: continue, but emit a banner so the operator sees the
103:   # decision in the transcript and in any committed plan docs.
104:   echo "WARNING: Replanning CLOSED phase ${phase_number} under --force. Verify the closeout was wrong before committing new plan docs." >&2
105: fi
106: ```
107: 
108: The gate fires only on `Complete`. `Executed` and `Needs Review` are not gated — those states mean planning was finished but verification did not pass, and replanning is a legitimate next step.
109: 
110: ## 2. Parse and Normalize Arguments
111: 
112: Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--ingest <path-or-glob>`, `--ingest-format <auto|nygard|madr|narrative>`, `--reviews`, `--text`, `--bounce`, `--skip-bounce`, `--chunked`, `--mvp`, `--force` (override closed-phase gate, see §1.5)).
113: 
114: **`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only — the planner spawn (step 8), plan-checker, verification, gaps, bounce, and post-planning-gaps blocks all skip on `RESEARCH_ONLY`. Use this for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `/gsd-research-phase` command.
115: 
116: In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:
117: 
118: - **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
119: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.
120: 
121: ```bash
122: RESEARCH_ONLY=false
123: VIEW_ONLY=false
124: if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
125:   RESEARCH_ONLY=true
126:   PHASE="${BASH_REMATCH[1]}"
127: fi
128: if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
129:   VIEW_ONLY=true
130: fi
131: ```
132: 
133: Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for Claude Code remote sessions (`/rc` mode) where TUI menus don't work through the the agent App.
134: 
135: **MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-implement the chain.
136: 
137: ```bash
138: MVP_FLAG_ARG=""
139: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
140: ```
141: 
142: Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation).
143: The verb returns `true|false`. Full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostics. The mode is **all-or-nothing per phase** (PRD decision Q1) — never selective per task.
144: 
145: **Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:
146: 
147: ```bash
148: WALKING_SKELETON=false
149: if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
150:   PRIOR_SUMMARIES=$($GSD_SDK query phases.list --pick summaries_total 2>/dev/null || echo "0")
151:   if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
152: fi
153: ```
154: 
155: When `WALKING_SKELETON=true`:
156: - Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md`.
157: - The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.
158: 
159: **Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are active on Phase 1 of a new project, the planner receives `WALKING_SKELETON=true` and PRD-derived context simultaneously — the PRD informs *what the skeleton should prove*. No precedence is needed; the two signals are orthogonal. See [`references/mvp-concepts.md`](../references/mvp-concepts.md) for the broader interaction map.
160: 
161: Extract express-path args from $ARGUMENTS: `PRD_FILE` (`--prd <filepath>`), `INGEST_PATH` (`--ingest <path-or-glob>`), and optional `INGEST_FORMAT` (`--ingest-format <auto|nygard|madr|narrative>`, default `auto`).
162: 
163: `--prd` and `--ingest` are mutually exclusive. If both are present, error and exit:
164: `Invalid arguments: cannot combine \`--prd\` with \`--ingest\`.`
165: 
166: **If no phase number:** Detect next unplanned phase from roadmap.
167: 
168: **If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `expected_phase_dir` from init (includes `project_code` prefix when set):
169: ```bash
170: mkdir -p "${expected_phase_dir}"
171: ```
172: 
173: Set `phase_dir="${expected_phase_dir}"` after creation.
174: 
175: **Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.
176: 
177: Set `CHUNKED_MODE` from flag or config:
178: ```bash
179: CHUNKED_CFG=$($GSD_SDK query config-get workflow.plan_chunked 2>/dev/null || echo "false")
180: CHUNKED_MODE=false
181: if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
182:   CHUNKED_MODE=true
183: fi
184: ```
185: 
186: ## 2.5. Validate `--reviews` Prerequisite
187: 
188: **Skip if:** No `--reviews` flag.
189: 
190: **If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.
191: 
192: **If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**
193: 
194: Error:
195: ```
196: No REVIEWS.md found for Phase {N}. Run reviews first:
197: 
198: /gsd-review --phase {N}
199: 
200: Then re-run /gsd-plan-phase {N} --reviews
201: ```
202: Exit workflow.
203: 
204: ## 3. Validate Phase
205: 
206: ```bash
207: PHASE_INFO=$($GSD_SDK query roadmap.get-phase "${PHASE}")
208: ```
209: 
210: **If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.
211: 
212: Now that `PHASE` is finalized, resolve MVP mode:
213: ```bash
214: MVP_MODE=$($GSD_SDK query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)
215: ```
216: 
217: ## 3.5. Handle PRD Express Path
218: 
219: **Skip if:** No `--prd` flag in arguments.
220: 
221: **If `--prd <filepath>` provided:**
222: 
223: 1. Read the PRD file:
224: ```bash
225: PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
226: if [ -z "$PRD_CONTENT" ]; then
227:   echo "Error: PRD file not found: $PRD_FILE"
228:   exit 1
229: fi
230: ```
231: 
232: 2. Display banner:
233: ```
234: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
235:  GSD ► PRD EXPRESS PATH
236: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
237: 
238: Using PRD: {PRD_FILE}
239: Generating CONTEXT.md from requirements...
240: ```
241: 
242: 3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
243:    - Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
244:    - Map each to a locked decision (everything in the PRD is treated as a locked decision)
245:    - Identify any areas the PRD doesn't cover and mark as "the agent's Discretion"
246:    - **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
247:    - Create CONTEXT.md in the phase directory
248: 
249: 4. Write CONTEXT.md:
250: ```markdown
251: # Phase [X]: [Name] - Context
252: 
253: **Gathered:** [date]
254: **Status:** Ready for planning
255: **Source:** PRD Express Path ({PRD_FILE})
256: 
257: <domain>
258: ## Phase Boundary
259: 
260: [Extracted from PRD — what this phase delivers]
261: 
262: </domain>
263: 
264: <decisions>
265: ## Implementation Decisions
266: 
267: {For each requirement/story/criterion in the PRD:}
268: ### [Category derived from content]
269: - [Requirement as locked decision]
270: 
271: ### the agent's Discretion
272: [Areas not covered by PRD — implementation details, technical choices]
273: 
274: </decisions>
275: 
276: <canonical_refs>
277: ## Canonical References
278: 
279: **Downstream agents MUST read these before planning or implementing.**
280: 
281: [MANDATORY. Extract from ROADMAP.md and any docs referenced in the PRD.
282: Use full relative paths. Group by topic area.]
283: 
284: ### [Topic area]
285: - `path/to/spec-or-adr.md` — [What it decides/defines]
286: 
287: [If no external specs: "No external specs — requirements fully captured in decisions above"]
288: 
289: </canonical_refs>
290: 
291: <specifics>
292: ## Specific Ideas
293: 
294: [Any specific references, examples, or concrete requirements from PRD]
295: 
296: </specifics>
297: 
298: <deferred>
299: ## Deferred Ideas
300: 
301: [Items in PRD explicitly marked as future/v2/out-of-scope]
302: [If none: "None — PRD covers phase scope"]
303: 
304: </deferred>
305: 
306: ---
307: 
308: *Phase: XX-name*
309: *Context gathered: [date] via PRD Express Path*
310: ```
311: 
312: 5. Commit:
313: ```bash
314: $GSD_SDK query commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
315: ```
316: 
317: 6. Set `context_content` to the generated CONTEXT.md content and continue to step 5 (Handle Research).
318: 
319: **Effect:** This completely bypasses step 4 (Load CONTEXT.md) since we just created it. The rest of the workflow (research, planning, verification) proceeds normally with the PRD-derived context.
320: 
321: ## 3.6. Handle ADR Ingest Express Path
322: 
323: **Skip if:** No `--ingest` flag in arguments.
324: 
325: **If `--ingest <path-or-glob>` provided:**
326: 
327: 1. Display banner: `GSD ► ADR Ingest Express Path` with `{INGEST_PATH}` and `{INGEST_FORMAT}`.
328: 2. Parse each resolved ADR through `get-shit-done/bin/lib/adr-parser.cjs` (`--input`, `--format`) and collect normalized records.
329: 3. Status gate: reject `superseded`/`rejected`/`deprecated`; warn on `proposed`; missing status defaults to `accepted`.
330: 4. Empty-decisions fallback: if all parsed ADRs have zero `decisions[]`, emit `ADR ingest produced no locked decisions; fall back to discuss-phase for this phase.` and exit with `/gsd-discuss-phase {N}` guidance.
331: 5. Generate CONTEXT.md using `<domain>`, `<decisions>`, `<canonical_refs>`, `<specifics>`, `<deferred>`, `<scope_fence>`, map `consequences_positive[]` to Success Criteria and `consequences_negative[]` to Risk Summary, and include `**Source:** ADR Ingest Express Path ({INGEST_PATH})`.
332: 6. Commit with `gsd-sdk query commit "docs(${padded_phase}): generate context from ADR ingest" --files "${phase_dir}/${padded_phase}-CONTEXT.md"` and set `context_content`; continue to step 5.
333: 
334: **Effect:** This bypasses step 4 (Load CONTEXT.md) since CONTEXT.md was synthesized from ADR input.
335: 
336: ## 4. Load CONTEXT.md
337: 
338: **Skip if:** PRD express path or ADR ingest express path was used (CONTEXT.md already created in step 3.5/3.6).
339: 
340: Check `context_path` from init JSON.
341: 
342: If `context_path` is not null, display: `Using phase context from: ${context_path}`
343: 
344: **If `context_path` is null (no CONTEXT.md exists):**
345: 
346: Read discuss mode for context gate label:
347: ```bash
348: DISCUSS_MODE=$($GSD_SDK query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
349: ```
350: 
351: If `TEXT_MODE` is true, present as a plain-text numbered list:
352: ```
353: No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included.
354: 
355: 1. Continue without context — Plan using research + requirements only
356: [If DISCUSS_MODE is "assumptions":]
357: 2. Gather context (assumptions mode) — Analyze codebase and surface assumptions before planning
358: [If DISCUSS_MODE is "discuss" or unset:]
359: 2. Run discuss-phase first — Capture design decisions before planning
360: 
361: Enter number:
362: ```
363: 
364: Otherwise use question:
365: - header: "No context"
366: - question: "No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
367: - options:
368:   - "Continue without context" — Plan using research + requirements only
369:   If `DISCUSS_MODE` is `"assumptions"`:
370:   - "Gather context (assumptions mode)" — Analyze codebase and surface assumptions before planning
371:   If `DISCUSS_MODE` is `"discuss"` (or unset):
372:   - "Run discuss-phase first" — Capture design decisions before planning
373: 
374: If "Continue without context": Proceed to step 5.
375: If "Run discuss-phase first":
376:   **IMPORTANT:** Do NOT invoke discuss-phase as a nested Skill/Task call — question
377:   does not work correctly in nested subcontexts (#1009). Instead, display the command
378:   and exit so the user runs it as a top-level command:
379:   ```
380:   Run this command first, then re-run /gsd-plan-phase {X} ${GSD_WS}:
381: 
382:   /gsd-discuss-phase {X} ${GSD_WS}
383:   ```
384:   **Exit the plan-phase workflow. Do not continue.**
385: 
386: ## 4.5. Check AI-SPEC
387: 
388: **Skip if:** `ai_integration_phase_enabled` from config is false, or `--skip-ai-spec` flag provided.
389: 
390: ```bash
391: AI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-AI-SPEC.md 2>/dev/null | head -1)
392: AI_PHASE_CFG=$($GSD_SDK query config-get workflow.ai_integration_phase 2>/dev/null || echo "true")
393: ```
394: 
395: **Skip if `AI_PHASE_CFG` is `false`.**
396: 
397: **If `AI_SPEC_FILE` is empty:** Check phase goal for AI keywords:
398: ```bash
399: echo "${phase_goal}" | grep -qi "agent\|llm\|rag\|chatbot\|embedding\|langchain\|llamaindex\|crewai\|langgraph\|openai\|anthropic\|vector\|eval\|ai system"
400: ```
401: 
402: **If AI keywords detected AND no AI-SPEC.md:**
403: ```
404: ◆ Note: This phase appears to involve AI system development.
405:   Consider running /gsd-ai-integration-phase {N} before planning to:
406:   - Select the right framework for your use case
407:   - Research its docs and best practices
408:   - Design an evaluation strategy
409: 
410:   Continue planning without AI-SPEC? (non-blocking — /gsd-ai-integration-phase can be run after)
411: ```
412: 
413: Use question with options:
414: - "Continue — plan without AI-SPEC"
415: - "Stop — I'll run /gsd-ai-integration-phase {N} first"
416: 
417: If "Stop": Exit with `/gsd-ai-integration-phase {N}` reminder.
418: If "Continue": Proceed. (Non-blocking — planner will note AI-SPEC is absent.)
419: 
420: **If `AI_SPEC_FILE` is non-empty:** Extract framework for planner context:
421: ```bash
422: FRAMEWORK_LINE=$(grep "Selected Framework:" "${AI_SPEC_FILE}" | head -1)
423: ```
424: Pass `ai_spec_path` and `framework_line` to planner in step 7 so it can reference the AI design contract.
425: 
426: ## 5. Handle Research
427: 
428: **Skip if:** `--gaps` flag or `--skip-research` flag or `--reviews` flag.
429: 
430: ### 5.0. Research-Only Modifiers (`--view`, `--research`, prompt)
431: 
432: **Skip if:** `RESEARCH_ONLY` is `false`.
433: 
434: Three branches in research-only mode (`--research-phase <N>`):
435: 
436: 1. **`--view`** (or user picks "View" in the prompt below): print `RESEARCH.md` to stdout, no spawn, exit. If `RESEARCH.md` is missing, error with: `--view requires an existing RESEARCH.md; drop --view to spawn the researcher.`
437: 2. **`--research`** (force-refresh): re-spawn researcher unconditionally — fall through to "Spawn gsd-phase-researcher" below.
438: 3. **Neither flag AND `has_research=true`:** emit `RESEARCH.md already exists for Phase ${PHASE}.` and prompt the user with three choices: `1. Update — re-spawn researcher and refresh RESEARCH.md`, `2. View — print existing RESEARCH.md and exit (no spawn)`, `3. Skip — exit without spawning or printing`. Map "Update" → fall through to spawn, "View" → set `VIEW_ONLY=true` and emit RESEARCH.md as in (1), "Skip" → exit cleanly. Mirrors the deleted `/gsd-research-phase` standalone's existing-artifact menu (#3042 parity).
439: 
440: ```bash
441: if [[ "$VIEW_ONLY" == "true" ]]; then
442:   [[ -f "$research_path" ]] || { echo "Error: --view requires an existing RESEARCH.md (Phase ${PHASE}). Drop --view to spawn the researcher."; exit 1; }
443:   cat "$research_path"; exit 0
444: fi
445: ```
446: 
447: ### 5.1. Standard Research Decision
448: 
449: **Skip if** `RESEARCH_ONLY=true` (the research-only mode in 5.0 already determined the path: spawn or exit). Without this guard, an LLM following the workflow could fall through into "use existing, skip to step 6" → planner spawn, violating the research-only contract. **CR #3045 finding: this gate makes the early-exit unreachable from any non-research-only branch.**
450: 
451: **If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.
452: 
453: **If RESEARCH.md missing OR `--research` flag:**
454: 
455: **If no explicit flag (`--research` or `--skip-research`) and not `--auto`:**
456: Ask the user whether to research, with a contextual recommendation based on the phase:
457: 
458: If `TEXT_MODE` is true, present as a plain-text numbered list:
459: ```
460: Research before planning Phase {X}: {phase_name}?
461: 
462: 1. Research first (Recommended) — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
463: 2. Skip research — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.
464: 
465: Enter number:
466: ```
467: 
468: Otherwise use question:
469: ```
470: question([
471:   {
472:     question: "Research before planning Phase {X}: {phase_name}?",
473:     header: "Research",
474:     multiSelect: false,
475:     options: [
476:       { label: "Research first (Recommended)", description: "Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes." },
477:       { label: "Skip research", description: "Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks." }
478:     ]
479:   }
480: ])
481: ```
482: 
483: If user selects "Skip research": skip to step 6.
484: 
485: **If `--auto` and `research_enabled` is false:** Skip research silently (preserves automated behavior).
486: 
487: Display banner:
488: ```
489: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
490:  GSD ► RESEARCHING PHASE {X}
491: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
492: 
493: ◆ Spawning researcher...
494: ```
495: 
496: ### Spawn gsd-phase-researcher
497: 
498: ```bash
499: PHASE_DESC=$($GSD_SDK query roadmap.get-phase "${PHASE}" --pick section)
500: ```
501: 
502: Research prompt:
503: 
504: ```markdown
505: <objective>
506: Research how to implement Phase {phase_number}: {phase_name}
507: Answer: "What do I need to know to PLAN this phase well?"
508: </objective>
509: 
510: <files_to_read>
511: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
512: - {requirements_path} (Project requirements)
513: - {state_path} (Project decisions and history)
514: </files_to_read>
515: 
516: ${AGENT_SKILLS_RESEARCHER}
517: 
518: <additional_context>
519: **Phase description:** {phase_description}
520: **Phase requirement IDs (MUST address):** {phase_req_ids}
521: 
522: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
523: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns
524: </additional_context>
525: 
526: <output>
527: Write to: {phase_dir}/{phase_num}-RESEARCH.md
528: </output>
529: ```
530: 
531: ```
532: Agent(
533:   prompt=research_prompt,
534:   subagent_type="gsd-phase-researcher",
535:   model="{researcher_model}",
536:   description="Research Phase {phase}"
537: )
538: ```
539: 
540: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
541: 
542: ### Handle Researcher Return
543: 
544: - **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 6
545: - **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort
546: 
547: ### Research-Only Early Exit (`--research-phase`)
548: 
549: **Skip if:** `RESEARCH_ONLY` is `false` (the default).
550: 
551: **If `RESEARCH_ONLY=true`:** the user invoked `/gsd-plan-phase --research-phase <N>` for research-only mode. Do **not** continue to Section 5.5+ (validation strategy, planner, plan-checker, verification, gaps, bounce, post-planning-gaps). Print the research-complete summary and exit cleanly:
552: 
553: ```text
554: ✓ Research-only mode complete (#3042)
555: 
556:   Phase:       ${PHASE}
557:   RESEARCH.md: ${research_path}
558: 
559: Re-run /gsd-plan-phase ${PHASE} to plan the phase using this research,
560: or /gsd-plan-phase ${PHASE} --research to refresh research and plan.
561: ```
562: 
563: This exits the workflow. The planner / plan-checker / verifier blocks below are skipped.
564: 
565: ## 5.5. Create Validation Strategy
566: 
567: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
568: 
569: If `research_enabled` is false and `nyquist_validation_enabled` is true: warn "Nyquist validation enabled but research disabled — VALIDATION.md cannot be created without RESEARCH.md. Plans will lack validation requirements (Dimension 8)." Continue to step 6.
570: 
571: **But Nyquist is not applicable for this run** when all of the following are true:
572: - `research_enabled` is false
573: - `has_research` is false
574: - no `--research` flag was provided
575: 
576: In that case: **skip validation-strategy creation entirely**. Do **not** expect `RESEARCH.md` or `VALIDATION.md` for this run, and continue to Step 6.
577: 
578: ```bash
579: grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null || true
580: ```
581: 
582: **If found:**
583: 1. Read template: `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
584: 2. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md` (use Write tool)
585: 3. Fill frontmatter: `{N}` → phase number, `{phase-slug}` → slug, `{date}` → current date
586: 4. Verify:
587: ```bash
588: test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
589: ```
590: 5. If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6
591: 6. If `commit_docs`: `commit "docs(phase-${PHASE}): add validation strategy"`
592: 
593: **If not found:** Warn and continue — plans may fail Dimension 8.
594: 
595: ## 5.55. Security Threat Model Gate
596: 
597: > Skip if `workflow.security_enforcement` is explicitly `false`. Absent = enabled.
598: 
599: ```bash
600: SECURITY_CFG=$($GSD_SDK query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
601: SECURITY_ASVS=$($GSD_SDK query config-get workflow.security_asvs_level --raw 2>/dev/null || echo "1")
602: SECURITY_BLOCK=$($GSD_SDK query config-get workflow.security_block_on --raw 2>/dev/null || echo "high")
603: ```
604: 
605: **If `SECURITY_CFG` is `false`:** Skip to step 5.6.
606: 
607: **If `SECURITY_CFG` is `true`:** Display banner:
608: 
609: ```
610: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
611:  GSD ► SECURITY THREAT MODEL REQUIRED (ASVS L{SECURITY_ASVS})
612: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
613: 
614: Each PLAN.md must include a <threat_model> block.
615: Block on: {SECURITY_BLOCK} severity threats.
616: Opt out: set security_enforcement: false in .planning/config.json
617: ```
618: 
619: Continue to step 5.6. Security config is passed to the planner in step 8.
620: 
621: ## 5.6. UI Design Contract Gate
622: 
623: > Skip if `workflow.ui_phase` is explicitly `false` AND `workflow.ui_safety_gate` is explicitly `false` in `.planning/config.json`. If keys are absent, treat as enabled.
624: 
625: ```bash
626: UI_PHASE_CFG=$($GSD_SDK query config-get workflow.ui_phase 2>/dev/null || echo "true")
627: UI_GATE_CFG=$($GSD_SDK query config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
628: ```
629: 
630: **If both are `false`:** Skip to step 6.
631: 
632: Check if phase has frontend indicators:
633: 
634: ```bash
635: PHASE_SECTION=$($GSD_SDK query roadmap.get-phase "${PHASE}" 2>/dev/null)
636: # Shell-free word-boundary gate (#3718): Node.js helper — no locale env-var dependency.
637: # Reads via stdin to avoid OS ARG_MAX limits on large phase text.
638: # Path anchored to repo root; falls back to CWD if git is unavailable
639: # Exit codes mirror grep: 0 = UI tokens found, 1 = not found.
640: GSD_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
641: printf '%s' "$PHASE_SECTION" | node "${GSD_REPO_ROOT}/bin/lib/ui-safety-gate.cjs" > /dev/null 2>&1
642: HAS_UI=$?
643: ```
644: 
645: **If `HAS_UI` is 0 (frontend indicators found):**
646: 
647: Check for existing UI-SPEC:
648: ```bash
649: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
650: ```
651: 
652: **If UI-SPEC.md found:** Set `UI_SPEC_PATH=$UI_SPEC_FILE`. Display: `Using UI design contract: ${UI_SPEC_PATH}`
653: 
654: **If UI-SPEC.md missing AND `--skip-ui` flag is present in $ARGUMENTS:** Skip silently to step 6.
655: 
656: **If UI-SPEC.md missing AND `UI_GATE_CFG` is `true`:**
657: 
658: Read ephemeral chain flag (same field as `check.auto-mode` → `auto_chain_active`):
659: ```bash
660: AUTO_CHAIN=$($GSD_SDK query check auto-mode --pick auto_chain_active 2>/dev/null || echo "false")
661: ```
662: 
663: **If `AUTO_CHAIN` is `true` (running inside a `--chain` or `--auto` pipeline):**
664: 
665: Auto-generate UI-SPEC without prompting:
666: ```
667: Skill(skill="gsd-ui-phase", args="${PHASE} --auto ${GSD_WS}")
668: ```
669: After `gsd-ui-phase` returns, re-read:
670: ```bash
671: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
672: UI_SPEC_PATH="${UI_SPEC_FILE}"
673: ```
674: Continue to step 6.
675: 
676: **If `AUTO_CHAIN` is `false` (manual invocation):**
677: 
678: Output this markdown directly (not as a code block):
679: 
680: ```
681: ## ⚠ UI-SPEC.md missing for Phase {N}
682: ▶ Recommended next step:
683: `/gsd-ui-phase {N} ${GSD_WS}` — generate UI design contract before planning
684: ───────────────────────────────────────────────
685: Also available:
686: - `/gsd-plan-phase {N} --skip-ui ${GSD_WS}` — plan without UI-SPEC (not recommended for frontend phases)
687: ```
688: 
689: **Exit the plan-phase workflow. Do not continue.**
690: 
691: **If `HAS_UI` is 1 (no frontend indicators):** Skip silently to step 5.7.
692: 
693: ## 5.7. Schema Push Detection Gate
694: 
695: > Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.
696: 
697: Check if any files in the phase scope match schema patterns:
698: 
699: ```bash
700: PHASE_SECTION=$($GSD_SDK query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
701: ```
702: 
703: Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:
704: 
705: | ORM | File Patterns |
706: |-----|--------------|
707: | Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
708: | Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
709: | Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
710: | Supabase | `supabase/migrations/*.sql` |
711: | TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |
712: 
713: Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.
714: 
715: **If schema-relevant files detected:**
716: 
717: Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.
718: 
719: Determine the push command for the detected ORM:
720: 
721: | ORM | Push Command | Non-TTY Workaround |
722: |-----|-------------|-------------------|
723: | Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
724: | Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
725: | Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
726: | Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
727: | TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |
728: 
729: Inject the following into the planner prompt (step 8) as an additional constraint:
730: 
731: ```markdown
732: <schema_push_requirement>
733: **[BLOCKING] Schema Push Required**
734: 
735: This phase modifies schema-relevant files ({detected_files}). The planner MUST include
736: a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
737: modifications are complete but BEFORE verification.
738: 
739: - ORM detected: {SCHEMA_ORM}
740: - Push command: {push_command}
741: - Non-TTY workaround: {env_hint}
742: - If push requires interactive prompts that cannot be suppressed, flag the task for
743:   manual intervention with `autonomous: false`
744: 
745: This task is mandatory — the phase CANNOT pass verification without it. Build and
746: type checks will pass without the push (types come from config, not the live database),
747: creating a false-positive verification state.
748: </schema_push_requirement>
749: ```
750: 
751: Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`
752: 
753: **If no schema-relevant files detected:** Skip silently to step 6.
754: 
755: ## 6. Check Existing Plans
756: 
757: ```bash
758: ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
759: ```
760: 
761: **If exists AND `--reviews` flag:** Skip prompt — go straight to replanning (the purpose of `--reviews` is to replan with review feedback).
762: 
763: **If exists AND no `--reviews` flag:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.
764: 
765: ## 7. Use Context Paths from INIT
766: 
767: Extract from INIT JSON:
768: 
769: ```bash
770: _gsd_field() { node -e "const o=JSON.parse(process.argv[1]); const v=o[process.argv[2]]; process.stdout.write(v==null?'':String(v))" "$1" "$2"; }
771: STATE_PATH=$(_gsd_field "$INIT" state_path)
772: ROADMAP_PATH=$(_gsd_field "$INIT" roadmap_path)
773: REQUIREMENTS_PATH=$(_gsd_field "$INIT" requirements_path)
774: RESEARCH_PATH=$(_gsd_field "$INIT" research_path)
775: VERIFICATION_PATH=$(_gsd_field "$INIT" verification_path)
776: UAT_PATH=$(_gsd_field "$INIT" uat_path)
777: CONTEXT_PATH=$(_gsd_field "$INIT" context_path)
778: REVIEWS_PATH=$(_gsd_field "$INIT" reviews_path)
779: PATTERNS_PATH=$(_gsd_field "$INIT" patterns_path)
780: 
781: # Detect spike/sketch findings skills (project-local)
782: SPIKE_FINDINGS_PATH=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
783: SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
784: ```
785: 
786: ## 7.5. Verify Nyquist Artifacts
787: 
788: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
789: 
790: Also skip if all of the following are true:
791: - `research_enabled` is false
792: - `has_research` is false
793: - no `--research` flag was provided
794: 
795: In that no-research path, Nyquist artifacts are **not required** for this run.
796: 
797: ```bash
798: VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
799: ```
800: 
801: If missing and Nyquist is still enabled/applicable — ask user:
802: 1. Re-run: `/gsd-plan-phase {PHASE} --research ${GSD_WS}`
803: 2. Disable Nyquist with the exact command:
804:    `gsd-sdk query config-set workflow.nyquist_validation false`
805: 3. Continue anyway (plans fail Dimension 8)
806: 
807: Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled) only if user selects 2 or 3.
808: 
809: ## 7.8. Spawn gsd-pattern-mapper Agent (Optional)
810: 
811: **Skip if** `workflow.pattern_mapper` is explicitly set to `false` in config.json (absent key = enabled). Also skip if no CONTEXT.md and no RESEARCH.md exist for this phase (nothing to extract file lists from).
812: 
813: Check config:
814: ```bash
815: PATTERN_MAPPER_CFG=$($GSD_SDK query config-get workflow.pattern_mapper 2>/dev/null || echo "true")
816: ```
817: 
818: **If `PATTERN_MAPPER_CFG` is `false`:** Skip to step 8.
819: 
820: **If PATTERNS.md already exists** (`PATTERNS_PATH` is non-empty from step 7): Skip to step 8 (use existing).
821: 
822: Display banner:
823: ```
824: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
825:  GSD ► PATTERN MAPPING PHASE {X}
826: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
827: 
828: ◆ Spawning pattern mapper...
829: ```
830: 
831: Pattern mapper prompt:
832: 
833: ```markdown
834: <pattern_mapping_context>
835: **Phase:** {phase_number} - {phase_name}
836: **Phase directory:** {phase_dir}
837: **Padded phase:** {padded_phase}
838: 
839: <files_to_read>
840: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
841: - {research_path} (Technical Research)
842: </files_to_read>
843: 
844: **Output file:** {phase_dir}/{padded_phase}-PATTERNS.md
845: 
846: Extract the list of files to be created/modified from CONTEXT.md and RESEARCH.md. For each file, classify by role and data flow, find the closest existing analog in the codebase, extract concrete code excerpts, and produce PATTERNS.md.
847: </pattern_mapping_context>
848: ```
849: 
850: Spawn with:
851: ```
852: Agent(
853:   prompt="{above}",
854:   subagent_type="gsd-pattern-mapper",
855:   model="{researcher_model}",
856: )
857: ```
858: 
859: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
860: 
861: **Handle return:**
862: - **`## PATTERN MAPPING COMPLETE`:** Update `PATTERNS_PATH` to the created file path, continue to step 8.
863: - **Any error or empty return:** Log warning, continue to step 8 without patterns (non-blocking).
864: 
865: After pattern mapper completes, update the path variable:
866: ```bash
867: PATTERNS_PATH="${PHASE_DIR}/${PADDED_PHASE}-PATTERNS.md"
868: ```
869: 
870: ## 8. Spawn gsd-planner Agent
871: 
872: Display banner:
873: ```
874: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
875:  GSD ► PLANNING PHASE {X}
876: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
877: 
878: ◆ Spawning planner...
879: ```
880: 
881: Planner prompt:
882: 
883: ```markdown
884: <planning_context>
885: **Phase:** {phase_number}
886: **Mode:** {standard | gap_closure | reviews}
887: 
888: <files_to_read>
889: - {state_path} (Project State)
890: - {roadmap_path} (Roadmap)
891: - {requirements_path} (Requirements)
892: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
893: - {research_path} (Technical Research)
894: - {PATTERNS_PATH} (Pattern Map — analog files and code excerpts, if exists)
895: - {verification_path} (Verification Gaps - if --gaps)
896: - {uat_path} (UAT Gaps - if --gaps)
897: - {reviews_path} (Cross-AI Review Feedback - if --reviews)
898: - {UI_SPEC_PATH} (UI Design Contract — visual/interaction specs, if exists)
899: - {SPIKE_FINDINGS_PATH} (Spike Findings — validated patterns, constraints, landmines from experiments, if exists)
900: - {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction, if exists)
901: ${CONTEXT_WINDOW >= 500000 ? `
902: **Cross-phase context (1M model enrichment):**
903: - CONTEXT.md files from the 3 most recent completed phases (locked decisions — maintain consistency)
904: - SUMMARY.md files from the 3 most recent completed phases (what was built — reuse patterns, avoid duplication)
905: - LEARNINGS.md files from the 3 most recent completed phases (structured decisions, patterns, lessons, surprises — skip silently if a phase has no LEARNINGS.md; prefix each block with \`[from Phase N LEARNINGS]\` for source attribution; if total size exceeds 15% of context budget, drop oldest first)
906: - CONTEXT.md, SUMMARY.md, and LEARNINGS.md from any phases listed in the current phase's "Depends on:" field in ROADMAP.md (regardless of recency — explicit dependencies always load, deduplicated against the 3 most recent)
907: - Skip all other prior phases to stay within context budget
908: ` : ''}
909: </files_to_read>
910: 
911: ${AGENT_SKILLS_PLANNER}
912: 
913: **Phase requirement IDs (every ID MUST appear in a plan's `requirements` field):** {phase_req_ids}
914: 
915: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
916: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
917: 
918: ${TDD_MODE === 'true' ? `
919: <tdd_mode_active>
920: **TDD Mode is ENABLED.** Apply TDD heuristics from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md to all eligible tasks:
921: - Business logic with defined I/O → type: tdd
922: - API endpoints with request/response contracts → type: tdd
923: - Data transformations, validation, algorithms → type: tdd
924: - UI, config, glue code, CRUD → standard plan (type: execute)
925: Each TDD plan gets one feature with RED/GREEN/REFACTOR gate sequence.
926: </tdd_mode_active>
927: ` : ''}
928: 
929: **MVP_MODE:** ${MVP_MODE} (when true, follow vertical-slice rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md`; when false, ignore MVP guidance entirely.)
930: **WALKING_SKELETON:** ${WALKING_SKELETON} (when true, the first deliverable must be a Walking Skeleton — produce SKELETON.md alongside PLAN.md.)
931: 
932: ${MVP_MODE === 'true' ? `
933: <mvp_mode_active>
934: **MVP Mode is ENABLED.** Follow vertical-slice planning rules from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md. Each plan must deliver a complete vertical slice — thin end-to-end functionality rather than horizontal layers.
935: </mvp_mode_active>
936: ` : ''}
937: </planning_context>
938: 
939: <downstream_consumer>
940: Output consumed by /gsd-execute-phase. Plans need:
941: - Frontmatter (wave, depends_on, files_modified, autonomous)
942: - Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY on every task)
943: - Verification criteria
944: - must_haves for goal-backward verification
945: </downstream_consumer>
946: 
947: <deep_work_rules>
948: ## Anti-Shallow Execution Rules (MANDATORY)
949: 
950: Every task MUST include these fields — they are NOT optional:
951: 
952: 1. **`<read_first>`** — Files the executor MUST read before touching anything. Always include:
953:    - The file being modified (so executor sees current state, not assumptions)
954:    - Any "source of truth" file referenced in CONTEXT.md (reference implementations, existing patterns, config files, schemas)
955:    - Any file whose patterns, signatures, types, or conventions must be replicated or respected
956: 
957: 2. **`<acceptance_criteria>`** — Verifiable conditions that prove the task was done correctly. Rules:
958:    - Every criterion must be checkable as a source assertion, behavior assertion, test command, or CLI output
959:    - NEVER use subjective language ("looks correct", "properly configured", "consistent with")
960:    - Include exact strings, patterns, values, command outputs, or observable behavior where that is the right proof
961:    - Examples:
962:      - Code: `auth.py contains def verify_token(` / `test_auth.py exits 0`
963:      - Behavior: `POST /api/auth/login returns 200 + httpOnly JWT cookie for valid credentials`
964:      - Config: `.env.example contains DATABASE_URL=` / `Dockerfile contains HEALTHCHECK`
965:      - Docs: `README.md contains '## Installation'` / `API.md lists all endpoints`
966:      - Infra: `deploy.yml has rollback step` / `docker-compose.yml has healthcheck for db`
967: 
968: 3. **`<action>`** — Must include CONCRETE values, not references. Rules:
969:    - NEVER say "align X with Y", "match X to Y", "update to be consistent" without specifying the exact target state
970:    - Include concrete identifiers and reference values: config keys, function signatures, SQL table names, class names, import paths, env vars, endpoint paths, etc.
971:    - If CONTEXT.md has a comparison table or expected values, copy only the target identifiers/values needed to remove ambiguity
972:    - Do not include full file contents, fenced code blocks, or complete implementations in `<action>`
973:    - The executor should understand the intended target state from `<action>` and use `<read_first>` files for current implementation details, patterns, and source-of-truth context
974: 
975: **Why this matters:** Executor agents work from the plan text. Vague instructions like "update the config to match production" produce shallow one-line changes. Concrete instructions like "add DATABASE_URL, set POOL_SIZE=20, add REDIS_URL, and read config/runtime.ts before editing" produce complete work without turning the planner into the executor.
976: </deep_work_rules>
977: 
978: <quality_gate>
979: - [ ] PLAN.md files created in phase directory
980: - [ ] Each plan has valid frontmatter
981: - [ ] Tasks are specific and actionable
982: - [ ] Every task has `<read_first>` with at least the file being modified
983: - [ ] Every task has `<acceptance_criteria>` with behavior, test-command, CLI, or source assertions
984: - [ ] Every `<action>` contains concrete identifiers without fenced code blocks or full implementations
985: - [ ] Dependencies correctly identified
986: - [ ] Waves assigned for parallel execution
987: - [ ] must_haves derived from phase goal
988: </quality_gate>
989: ```
990: 
991: **If `CHUNKED_MODE` is `false` (default):** Spawn the planner as a single long-lived Agent:
992: 
993: ```text
994: Agent(
995:   prompt=filled_prompt,
996:   subagent_type="gsd-planner",
997:   model="{planner_model}",
998:   description="Plan Phase {phase}"
999: )
1000: ```
1001: 
1002: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1003: 
1004: **If `CHUNKED_MODE` is `true`:** Skip the Agent() call above — proceed to step 8.5 instead.
1005: 
1006: ## 8.5. Chunked Planning Mode
1007: 
1008: **Skip if `CHUNKED_MODE` is `false`.**
1009: 
1010: Chunked mode splits the single long-lived planner Agent run into a short outline Agent run followed by
1011: N short per-plan Agent runs. Each run is bounded to ~3–5 min; each plan is committed individually
1012: for crash resilience. If any run hangs and the terminal is force-killed, rerunning
1013: `/gsd-plan-phase {N} --chunked` resumes from the last successfully committed plan.
1014: 
1015: **Intended for new or in-progress chunked runs.** To recover plans already written by a prior
1016: *non-chunked* run, use step 6's "Add more plans" or proceed directly to `/gsd-execute-phase`
1017: — don't start a fresh chunked run over existing non-chunked plans.
1018: 
1019: ### 8.5.1 Outline Phase (outline-only mode, ~2 min)
1020: 
1021: **Resume detection:** If `${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md` already exists **and
1022: is valid** (contains the `## OUTLINE COMPLETE` marker), skip this sub-step — the outline
1023: already exists from a previous run. Proceed directly to 8.5.2.
1024: 
1025: ```bash
1026: OUTLINE_FILE="${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md"
1027: if [[ -f "$OUTLINE_FILE" ]] && grep -q "^## OUTLINE COMPLETE" "$OUTLINE_FILE"; then
1028:   # reuse existing outline — skip to 8.5.2
1029: fi
1030: ```
1031: 
1032: Display:
1033: ```text
1034: ◆ Chunked mode: spawning outline planner...
1035: ```
1036: 
1037: Spawn the planner in **outline-only** mode — it must write only the outline manifest, not any
1038: PLAN.md files:
1039: 
1040: ```javascript
1041: Agent(
1042:   prompt="{same planning_context as step 8, plus:}
1043: 
1044:   **Chunked mode: outline-only.**
1045:   Do NOT write any PLAN.md files in this Task.
1046:   Write only: {PHASE_DIR}/{PADDED_PHASE}-PLAN-OUTLINE.md
1047: 
1048:   The outline must be a markdown table with columns:
1049:   Plan ID | Objective | Wave | Depends On | Requirements
1050: 
1051:   Return: ## OUTLINE COMPLETE with plan count.",
1052:   subagent_type="gsd-planner",
1053:   model="{planner_model}",
1054:   description="Outline Phase {phase} (chunked)"
1055: )
1056: ```
1057: 
1058: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1059: 
1060: Handle return:
1061: - **`## OUTLINE COMPLETE`:** Read `PLAN-OUTLINE.md`, extract plan list. Continue to 8.5.2.
1062: - **Any other return or empty:** Display error. Offer: 1) Retry outline, 2) Stop.
1063: 
1064: ### 8.5.2 Per-Plan Tasks (single-plan mode, ~3-5 min each)
1065: 
1066: For each plan entry extracted from `PLAN-OUTLINE.md`:
1067: 
1068: 1. **Resume check:** If `${PHASE_DIR}/{plan_id}-PLAN.md` already exists on disk **and has
1069:    valid YAML frontmatter** (opening `---` delimiter present), skip this plan (do not
1070:    overwrite completed work — resume safety).
1071: 
1072:    ```bash
1073:    PLAN_FILE="${PHASE_DIR}/${plan_id}-PLAN.md"
1074:    if [[ -f "$PLAN_FILE" ]] && head -1 "$PLAN_FILE" | grep -q '^---'; then
1075:      continue  # plan already written, skip
1076:    fi
1077:    ```
1078: 
1079: 2. Display:
1080:    ```text
1081:    ◆ Chunked mode: planning {plan_id} ({k}/{N})...
1082:    ```
1083: 
1084: 3. Spawn the planner in **single-plan** mode — it must write exactly one PLAN.md file:
1085:    ```javascript
1086:    Agent(
1087:      prompt="{same planning_context as step 8, plus:}
1088: 
1089:      **Chunked mode: single-plan.**
1090:      Write exactly ONE plan file: {PHASE_DIR}/{plan_id}-PLAN.md
1091:      Plan to write: {plan_id} — {objective}
1092:      Wave: {wave} | Depends on: {depends_on}
1093:      Phase requirement IDs to cover in this plan: {plan_requirements}
1094: 
1095:      Return: ## PLAN COMPLETE with the plan ID.",
1096:      subagent_type="gsd-planner",
1097:      model="{planner_model}",
1098:      description="Plan {plan_id} (chunked {k}/{N})"
1099:    )
1100:    ```
1101: 

(Output capped at 50 KB. Showing lines 1-1101. Use offset=1102 to continue.)
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

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
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

## USER (turn 2)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 3)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 4)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 5)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 6)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 7)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 8)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted research-phase command (#3042).

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
Phase number: 24.3.2 /Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md  (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest <path-or-glob>` — Use one or more ADR files instead of discuss-phase. Parses locked decisions + scope fences into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--ingest-format <auto|nygard|madr|narrative>` — Optional ADR parser format override (`auto` default).
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-PATTERNS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-RESEARCH.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md"
}
`    
### Tool: task

**Input:**
```json
{
  "description": "Plan phase 24.3.2 execution",
  "subagent_type": "gsd-planner",
  "task_id": "ses_19abc24acffejXpp8PXdH7TT8X"
}
```

**Output:** (pruned)
```
task_id: ses_19abc24acffejXpp8PXdH7TT8X
```


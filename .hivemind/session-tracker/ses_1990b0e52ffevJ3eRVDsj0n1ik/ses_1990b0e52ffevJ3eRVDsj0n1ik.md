---
sessionID: ses_1990b0e52ffevJ3eRVDsj0n1ik
created: 2026-05-27T01:03:09.255Z
updated: 2026-05-27T01:03:09.350Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_19902aa5cffePYwdbSkfd4lOF9
    childFile: ses_19902aa5cffePYwdbSkfd4lOF9.json
  - sessionID: ses_198ff4087ffeMrc2pE4hbikBnT
    childFile: ses_198ff4087ffeMrc2pE4hbikBnT.json
  - sessionID: ses_198fb67e5ffexJDS7l7JqNF9bz
    childFile: ses_198fb67e5ffexJDS7l7JqNF9bz.json
  - sessionID: ses_198f75e76ffeHJo4z7iIMMLxcA
    childFile: ses_198f75e76ffeHJo4z7iIMMLxcA.json
  - sessionID: ses_198f56c5effeDpPbdJ6Q0G11PV
    childFile: ses_198f56c5effeDpPbdJ6Q0G11PV.json
  - sessionID: ses_198f382e0ffe7rsrQrb1VletQ4
    childFile: ses_198f382e0ffe7rsrQrb1VletQ4.json
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-05-27T01:03:09.229Z
lastMessage: "Tools: bash"
---

## USER (turn 1)

**source:** real-human

continue on 24.3.3 route verify plan from gsd first use both command and agent then excute - 3 sequential steps

### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_5c00c89aaeb74276bd003dbc"
}
```


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
  "name": "session-foundation"
}
```

**Output:** (pruned)
```
# Skill: session-foundation
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_1c602b9cf6be49448d4dbb0b"
}
```


### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_c072dc49e7864668b16d0952"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_7837292bedc840f8ac232197"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_552a78569a0a4b33883a7aba"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-02-PLAN.md"
}
```


## ASSISTANT (turn 1)

Tìm thấy Phase 24.3.3. Bây giờ tôi sẽ đọc các tài liệu chính của phase này:

## USER (turn 2)

**source:** real-human

continue

## ASSISTANT (turn 2)

Tìm thấy Phase 24.3.3. Bây giờ tôi sẽ đọc các tài liệu chính của phase này:

## ASSISTANT (turn 3)

Tìm thấy Phase 24.3.3. Bây giờ tôi sẽ đọc các tài liệu chính của phase này:

## USER (turn 3)

**source:** real-human

continue

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_5bab00b0a4664afd8e364839"
}
```


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
Phase number: 24.3.3 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_0a9955c7c2c2495eb05d13f9"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_14f9234e30304eadb136efd3"
}
```


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
Phase number: 24.3.3 (optional — auto-detects next unplanned phase if omitted)

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

## USER (turn 6)

**source:** real-human

@gsd-plan-checker 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-plan-checker

## USER (turn 7)

**source:** real-human

then fix with @gsd-planner only when everything passed @.opencode/command/gsd-execute-phase.md with @gsd-executor 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-planner
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md</path>
<type>file</type>
<content>
1: ---
2: description: Execute all plans in a phase with wave-based parallelization
3: argument-hint: "<phase-number> [--wave N] [--gaps-only] [--interactive] [--tdd]"
4: requires: [phase, verify-work]
5: tools:
6:   read: true
7:   write: true
8:   edit: true
9:   glob: true
10:   grep: true
11:   bash: true
12:   agent: true
13:   todowrite: true
14:   question: true
15: ---
16: <objective>
17: Execute all plans in a phase using wave-based parallel execution.
18: 
19: Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.
20: 
21: Optional wave filter:
22: - `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
23: - phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes
24: 
25: Flag handling rule:
26: - The optional flags documented below are available behaviors, not implied active behaviors
27: - A flag is active only when its literal token appears in `$ARGUMENTS`
28: - If a documented flag is absent from `$ARGUMENTS`, treat it as inactive
29: 
30: Context budget: ~15% orchestrator, 100% fresh per subagent.
31: </objective>
32: 
33: <execution_context>
34: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
35: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
36: </execution_context>
37: 
38: <runtime_note>
39: **Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
40: </runtime_note>
41: 
42: <context>
43: Phase: $ARGUMENTS
44: 
45: **Available optional flags (documentation only — not automatically active):**
46: - `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
47: - `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
48: - `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.
49: 
50: **Active flags must be derived from `$ARGUMENTS`:**
51: - `--wave N` is active only if the literal `--wave` token is present in `$ARGUMENTS`
52: - `--gaps-only` is active only if the literal `--gaps-only` token is present in `$ARGUMENTS`
53: - `--interactive` is active only if the literal `--interactive` token is present in `$ARGUMENTS`
54: - If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
55: - Do not infer that a flag is active just because it is documented in this prompt
56: 
57: Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
58: </context>
59: 
60: <process>
61: Execute end-to-end.
62: Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
63: </process>

(End of file - total 63 lines)
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
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-executor

### Tool: task

**Input:**
```json
{
  "description": "Verify Phase 24.3.3 plan",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_19902aa5cffePYwdbSkfd4lOF9"
}
```

**Output:** (pruned)
```
task_id: ses_19902aa5cffePYwdbSkfd4lOF9
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_21205845d8794007855499e6"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Resume plan checker",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_19902aa5cffePYwdbSkfd4lOF9"
}
```

**Output:** (pruned)
```
task_id: ses_19902aa5cffePYwdbSkfd4lOF9
```


### Tool: question

**Input:**
```json
{
  "callID": "call_da245d5cf26040dba18fce9b"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Fix Phase 24.3.3 plan",
  "subagent_type": "gsd-planner",
  "task_id": "ses_198ff4087ffeMrc2pE4hbikBnT"
}
```

**Output:** (pruned)
```
task_id: ses_198ff4087ffeMrc2pE4hbikBnT
```


## ASSISTANT (turn 6)

Tôi hiểu. Nhưng verification báo **FAIL** với 3 blockers. Tôi cần FIX plan trước với gsd-planner, CHỈ KHI PASS MỚI THỰC THI.

Hãy fix plan với gsd-planner:

## USER (turn 8)

**source:** real-human

"lastMessage": "## VERDICT: NEEDS-REVISION\n\n## Summary\nPhase 24.3.3-02-PLAN.md fails verification due to critical scope reduction violations against locked decisions in CONTEXT.md, plus missing VALIDATION.md gate requirement and incomplete task completeness in nyquist validation checks.\n\n## Issues Found\n\n### BLOCKER: Scope Reduction on Semantic Agent Selection (D-26 violation)\n- **Plan:** 24.3.3-02-PLAN.md, Task 1\n- **Decision:** CONTEXT.md §25-35 states \"Pure keyword + similarity matching (NO LLM fallback)\" with \"Extract entities from user input\" and \"If no matches → ask user to specify exact name\"\n- **Plan Action:** Task 1 implements \"If no matches → return default agent from registry\" instead of asking user\n- **Violation:** Planner reduced user decision from interactive user prompt to automatic fallback\n\n### BLOCKER: Scope Reduction on Two-Stage Routing (D-42 violation)\n- **Plan:** 24.3.3-02-PLAN.md, Context section\n- **Decision:** CONTEXT.md §42-48 states \"Sequential execution (STRICT): Stage 1 (command resolution) → Stage 2 (agent selection)\" with \"If command fail → ask user and STOP (no Stage 2)\"\n- **Plan Action:** Plan lists shell/workflow integration (deferred ideas from CONTEXT.md §153-165) but doesn't properly implement two-stage routing in resolve-command.ts\n- **Violation:** Planner confused deferred ideas with current phase scope\n\n### BLOCKER: Missing VALIDATION.md Gate\n- **File:** .planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-VALIDATION.md\n- **Requirement:** RESEARCH.md §403 confirms \"workflow.nyquist_validation: absent → treat as enabled\" requiring VALIDATION.md existence as gate\n- **Status:** File does not exist in phase directory\n- **Impact:** Phase cannot execute without automated verification contracts\n\n### WARNING: Task 5 Missing Key Links Planning\n- **Plan:** 24.3.3-02-PLAN.md, Task 5 (Update index.ts)\n- **Issue:** Task updates barrel exports but must_haves.key_links doesn't connect semantic-agent-selector.ts to dispatch-command.ts\n- **Missing:** Key link specifying how selectAgent() integrates with dispatchCommand()\n\n### WARNING: Task 2 Missing Performance Metrics in Done\n- **Plan:** 24.3.3-02-PLAN.md, Task 2\n- **Issue:** Done section says \"TTK < 50ms for cached lookups\" but doesn't specify how to measure or verify this numerically\n- **Impact:** Acceptance criteria vague on performance verification\n\n### WARNING: Incomplete must_haves.key_links Coverage\n- **Plan:** 24.3.3-02-PLAN.md\n- **Issue:** only 2 key_links defined but 5 artifacts created\n- **Missing:** Key links for workflow-parser → execute-slash-command.ts, resolve-command → dispatch-command\n\n### WARNING: Shell Command Security Scope Confusion\n- **Plan:** 24.3.3-02-PLAN.md, Task 3\n- **Issue:** CONTEXT.md §153-165 lists shell command integration as \"Deferred Ideas\" for P24.3.3.2, but Task 3 implements it in Wave 2\n- **Impact:** Potential scope creep if user expects Phase 24.3.3.1 to remain foundational only\n\n## Recommendations\n\n1. **CRITICAL:** Remove shell command implementation from Task 3 or create separate phase P24.3.3.3. Shell integration is explicitly deferred in CONTEXT.md §153-165.\n\n2. **CRITICAL:** Fix Task 1 to implement \"ask user to specify exact name\" behavior as per CONTEXT.md §28-32, not automatic fallback to default agent.\n\n3. **CRITICAL:** Create 24.3.3-VALIDATION.md file before execution. RESEARCH.md §403 requires this gate.\n\n4. **HIGH:** Add missing key_links to must_haves section connecting workflow-parser to execute-slash-command.ts and resolve-command to dispatch-command.\n\n5. **MEDIUM:** Add numeric performance verification in Task 2 done section (e.g., \"console.log cache stats showing <50ms hit rate\").\n\n6. **MEDIUM:** Clarify whether semantic agent selection in Task 1 is Wave 1 or Wave 2 work (currently listed in Wave 2 but uses \"selectAgent\" which CONTEXT.md §28 says should extend resolveCommand()).\n\n## Confidence Level\n92%\n\nThe scope reduction violations are clear blockers. The VALIDATION.md missing file is a hard gate failure. Confidence reduced slightly due to ambiguity on whether semantic agent selection belongs in Wave 1 or Wave 2 per CONTEXT.md decisions." 

## USER (turn 10)

**source:** real-human

"lastMessage": "## VERDICT: NEEDS-REVISION\n\n## Summary\nPhase 24.3.3-02-PLAN.md fails verification due to critical scope reduction violations against locked decisions in CONTEXT.md, plus missing VALIDATION.md gate requirement and incomplete task completeness in nyquist validation checks.\n\n## Issues Found\n\n### BLOCKER: Scope Reduction on Semantic Agent Selection (D-26 violation)\n- **Plan:** 24.3.3-02-PLAN.md, Task 1\n- **Decision:** CONTEXT.md §25-35 states \"Pure keyword + similarity matching (NO LLM fallback)\" with \"Extract entities from user input\" and \"If no matches → ask user to specify exact name\"\n- **Plan Action:** Task 1 implements \"If no matches → return default agent from registry\" instead of asking user\n- **Violation:** Planner reduced user decision from interactive user prompt to automatic fallback\n\n### BLOCKER: Scope Reduction on Two-Stage Routing (D-42 violation)\n- **Plan:** 24.3.3-02-PLAN.md, Context section\n- **Decision:** CONTEXT.md §42-48 states \"Sequential execution (STRICT): Stage 1 (command resolution) → Stage 2 (agent selection)\" with \"If command fail → ask user and STOP (no Stage 2)\"\n- **Plan Action:** Plan lists shell/workflow integration (deferred ideas from CONTEXT.md §153-165) but doesn't properly implement two-stage routing in resolve-command.ts\n- **Violation:** Planner confused deferred ideas with current phase scope\n\n### BLOCKER: Missing VALIDATION.md Gate\n- **File:** .planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-VALIDATION.md\n- **Requirement:** RESEARCH.md §403 confirms \"workflow.nyquist_validation: absent → treat as enabled\" requiring VALIDATION.md existence as gate\n- **Status:** File does not exist in phase directory\n- **Impact:** Phase cannot execute without automated verification contracts\n\n### WARNING: Task 5 Missing Key Links Planning\n- **Plan:** 24.3.3-02-PLAN.md, Task 5 (Update index.ts)\n- **Issue:** Task updates barrel exports but must_haves.key_links doesn't connect semantic-agent-selector.ts to dispatch-command.ts\n- **Missing:** Key link specifying how selectAgent() integrates with dispatchCommand()\n\n### WARNING: Task 2 Missing Performance Metrics in Done\n- **Plan:** 24.3.3-02-PLAN.md, Task 2\n- **Issue:** Done section says \"TTK < 50ms for cached lookups\" but doesn't specify how to measure or verify this numerically\n- **Impact:** Acceptance criteria vague on performance verification\n\n### WARNING: Incomplete must_haves.key_links Coverage\n- **Plan:** 24.3.3-02-PLAN.md\n- **Issue:** only 2 key_links defined but 5 artifacts created\n- **Missing:** Key links for workflow-parser → execute-slash-command.ts, resolve-command → dispatch-command\n\n### WARNING: Shell Command Security Scope Confusion\n- **Plan:** 24.3.3-02-PLAN.md, Task 3\n- **Issue:** CONTEXT.md §153-165 lists shell command integration as \"Deferred Ideas\" for P24.3.3.2, but Task 3 implements it in Wave 2\n- **Impact:** Potential scope creep if user expects Phase 24.3.3.1 to remain foundational only\n\n## Recommendations\n\n1. **CRITICAL:** Remove shell command implementation from Task 3 or create separate phase P24.3.3.3. Shell integration is explicitly deferred in CONTEXT.md §153-165.\n\n2. **CRITICAL:** Fix Task 1 to implement \"ask user to specify exact name\" behavior as per CONTEXT.md §28-32, not automatic fallback to default agent.\n\n3. **CRITICAL:** Create 24.3.3-VALIDATION.md file before execution. RESEARCH.md §403 requires this gate.\n\n4. **HIGH:** Add missing key_links to must_haves section connecting workflow-parser to execute-slash-command.ts and resolve-command to dispatch-command.\n\n5. **MEDIUM:** Add numeric performance verification in Task 2 done section (e.g., \"console.log cache stats showing <50ms hit rate\").\n\n6. **MEDIUM:** Clarify whether semantic agent selection in Task 1 is Wave 1 or Wave 2 work (currently listed in Wave 2 but uses \"selectAgent\" which CONTEXT.md §28 says should extend resolveCommand()).\n\n## Confidence Level\n92%\n\nThe scope reduction violations are clear blockers. The VALIDATION.md missing file is a hard gate failure. Confidence reduced slightly due to ambiguity on whether semantic agent selection belongs in Wave 1 or Wave 2 per CONTEXT.md decisions." >>>>>> pass these down exactly 

### Tool: question

**Input:**
```json
{
  "callID": "call_30f8a8e35a434dd8bb9c2b21"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Fix Phase 24.3.3 plan all issues",
  "subagent_type": "gsd-planner",
  "task_id": "ses_198fb67e5ffexJDS7l7JqNF9bz"
}
```

**Output:** (pruned)
```
task_id: ses_198fb67e5ffexJDS7l7JqNF9bz
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_2eeb3fda6664467b8d6661e5"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_6cdbb2954d174ce08bcd8402"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Re-verify Phase 24.3.3 plan",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_198f75e76ffeHJo4z7iIMMLxcA"
}
```

**Output:** (pruned)
```
task_id: ses_198f75e76ffeHJo4z7iIMMLxcA
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_2e71f61cd40c47d397eccc5b"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/24.3.3-namespace-routing-advanced-features/24.3.3-02-PLAN.md"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Final verify Phase 24.3.3 plan",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_198f56c5effeDpPbdJ6Q0G11PV"
}
```

**Output:** (pruned)
```
task_id: ses_198f56c5effeDpPbdJ6Q0G11PV
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_57a4b95d3e9048ecbf817ee9"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Get final verification result",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_198f382e0ffe7rsrQrb1VletQ4"
}
```

**Output:** (pruned)
```
task_id: ses_198f382e0ffe7rsrQrb1VletQ4
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_0702a8d23654464991e6bfdf"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_285fd676b78449cab6c7f050"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_f9baf11bcf9f4551b6cc9b3b"
}
```


## ASSISTANT (turn 11)

Tools: bash

## USER (turn 11)

**source:** real-human

route gsd execute for this phase and delegate sub task to the gsd executor agent

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_9baef8ba9bf1490a9c62310a"
}
```


## USER (turn 12)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `24.3.3`
- If a documented flag is absent from `24.3.3`, treat it as inactive

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
Phase: 24.3.3

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `24.3.3`:**
- `--wave N` is active only if the literal `--wave` token is present in `24.3.3`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `24.3.3`
- `--interactive` is active only if the literal `--interactive` token is present in `24.3.3`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md</path>
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
69: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
70: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
71: if [ -f "$GSD_TOOLS" ]; then
72:   GSD_SDK="node $GSD_TOOLS"
73: elif command -v gsd-sdk >/dev/null 2>&1; then
74:   GSD_SDK="gsd-sdk"
75: else
76:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
77:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
78:   exit 1
79: fi
80: INIT=$($GSD_SDK query init.execute-phase "${PHASE_ARG}")
81: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
82: AGENT_SKILLS=$($GSD_SDK query agent-skills gsd-executor)
83: ```
84: 
85: Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
86: 
87: **Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls — do NOT pass `model="inherit"` to Agent. Omitting the `model=` parameter causes Claude Code to inherit the current orchestrator model automatically. Only set `model=` when `executor_model` is an explicit model name (e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-7"`).
88: 
89: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
90: 
91: Read runtime/worktree config and fail closed before any executor dispatch:
92: 
93: ```bash
94: RUNTIME=$($GSD_SDK query config-get runtime --default claude 2>/dev/null || echo "claude")
95: USE_WORKTREES=$($GSD_SDK query config-get workflow.use_worktrees 2>/dev/null || echo "true")
96: EXECUTOR_STALL_INTERVAL_MINUTES=$($GSD_SDK query config-get executor.stall_detect_interval_minutes 2>/dev/null || echo "5")
97: EXECUTOR_STALL_THRESHOLD_MINUTES=$($GSD_SDK query config-get executor.stall_threshold_minutes 2>/dev/null || echo "10")
98: 
99: if [ "$RUNTIME" = "codex" ] && [ "$USE_WORKTREES" != "false" ]; then
100:   echo "FATAL: Codex execute-phase worktree isolation is unsupported. Set workflow.use_worktrees=false or use a runtime with Agent isolation=\"worktree\" support." >&2
101:   exit 1
102: fi
103: # Sweep orphaned locked worktrees from prior crashed sessions before spawning executors (#3707).
104: [ "$USE_WORKTREES" != "false" ] && $GSD_SDK query worktree.reap-orphans 2>/dev/null || true
105: ```
106: Codex maps subagents to `spawn_agent`, which has no direct Codex mapping for Claude Code's `isolation="worktree"` parameter. Failing closed prevents main-checkout edits while the workflow believes agents are isolated.
107: 
108: If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every plan in a submodule project even when the plan was nowhere near a submodule. Compute submodule paths once and intersect them per-plan with the plan's declared `files_modified` frontmatter.
109: 
110: ```bash
111: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
112: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
113: if [ -f .gitmodules ]; then
114:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
115: else
116:   SUBMODULE_PATHS=""
117: fi
118: ```
119: 
120: `SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different files — only plans whose paths intersect a submodule must drop worktree isolation; plans nowhere near a submodule keep parallel isolation.
121: 
122: When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are project-disabled.
123: 
124: Read context window size for adaptive prompt enrichment:
125: 
126: ```bash
127: CONTEXT_WINDOW=$($GSD_SDK query config-get context_window 2>/dev/null || echo "200000")
128: ```
129: 
130: When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
131: - Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
132: - Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
133: - This enables cross-phase awareness and history-aware verification
134: 
135: When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
136: - Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
137: - Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
138: - Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
139: - This reduces executor static overhead by ~40% while preserving behavioral correctness
140: 
141: **If `phase_found` is false:** Error — phase directory not found.
142: **If `plan_count` is 0:** Error — no plans found in phase.
143: **If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.
144: 
145: When `parallelization` is false, plans within a wave execute sequentially.
146: 
147: **Runtime detection for Copilot:**
148: Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
149: or absence of the `Agent()` subagent API. If running under Copilot, force sequential inline
150: execution regardless of the `parallelization` setting — Copilot's subagent completion
151: signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
152: internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
153: inline path for each plan.
154: 
155: **REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference). You MUST execute this bash block before any config reads:
156: ```bash
157: # REQUIRED: prevents stale auto-chain from previous --auto runs
158: if [[ ! "$ARGUMENTS" =~ --auto ]]; then
159:   $GSD_SDK query config-set workflow._auto_chain_active false || true
160: fi
161: ```
162: 
163: Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
164: ```bash
165: MVP_FLAG_ARG=""
166: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
167: MVP_MODE=$($GSD_SDK query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
168: TDD_MODE=$($GSD_SDK query config-get workflow.tdd_mode 2>/dev/null || echo "false")
169: ```
170: 
171: <step name="safe_resume_gate">
172: Before trusting `STATE.md` or dispatching any executor, derive `CURRENT_PLAN_ID`
173: from the active incomplete plan in `INIT`, then search recent history:
174: ```bash
175: CURRENT_PLAN_ID="{phase_number}-{plan_padded}"
176: SUMMARY_PATH="{phase_dir}/{plan_padded}-SUMMARY.md"
177: PLAN_COMMITS=$(git log --oneline --grep="${CURRENT_PLAN_ID}" -30)
178: ```
179: If production commits exist and `SUMMARY.md is missing`, stop before spawning a
180: new executor; continuing risks duplicate work and stale `STATE.md`/ROADMAP progress.
181: Offer these recovery options:
182: - `close out manually` — inspect commits, write SUMMARY.md, then update STATE/ROADMAP.
183: - `re-execute from scratch` — revert or supersede partial commits before dispatch.
184: - `mark-and-skip` — record the anomaly and move on only with explicit confirmation.
185: </step>
186: 
187: **MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
188: ```bash
189: if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
190:   IS_BEHAVIOR_ADDING=$($GSD_SDK query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)
191:   if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
192:     RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
193:     if [ -z "$RED_COMMIT" ]; then
194:       $GSD_SDK query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true
195:       echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
196:       exit 1
197:     fi
198:   fi
199: fi
200: ```
201: Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. See `execute-mvp-tdd.md` for the halt report format.
202: </step>
203: 
204: <step name="check_blocking_antipatterns" priority="first">
205: **MANDATORY — Check for blocking anti-patterns before any other work.**
206: 
207: Look for a `.continue-here.md` in the current phase directory:
208: 
209: ```bash
210: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
211: ```
212: 
213: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
214: 
215: **If one or more `blocking` anti-patterns are found:**
216: 
217: This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:
218: 
219: 1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
220: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
221: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.
222: 
223: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
224: 
225: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
226: </step>
227: 
228: <step name="check_interactive_mode">
229: **Parse `--interactive` flag from $ARGUMENTS.**
230: 
231: **If `--interactive` flag present:** Switch to interactive execution mode.
232: 
233: Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
234: checkpoints between tasks. The user can review, modify, or redirect work at any point.
235: 
236: **Interactive execution flow:**
237: 
238: 1. Load plan inventory as normal (discover_and_group_plans)
239: 2. For each plan (sequentially, ignoring wave grouping):
240: 
241:    a. **Present the plan to the user:**
242:       ```
243:       ## Plan {plan_id}: {plan_name}
244: 
245:       Objective: {from plan file}
246:       Tasks: {task_count}
247: 
248:       Options:
249:       - Execute (proceed with all tasks)
250:       - Review first (show task breakdown before starting)
251:       - Skip (move to next plan)
252:       - Stop (end execution, save progress)
253:       ```
254: 
255:    b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.
256: 
257:    c. **If "Execute":** Read and follow `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md` **inline**
258:       (do NOT spawn a subagent). Execute tasks one at a time.
259: 
260:    d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
261:       their feedback before continuing. Otherwise proceed to next task.
262: 
263:    e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.
264: 
265: 3. After all plans: proceed to verification (same as normal mode).
266: 
267: **Benefits of interactive mode:**
268: - No subagent overhead — dramatically lower token usage
269: - User catches mistakes early — saves costly verification cycles
270: - Maintains GSD's planning/tracking structure
271: - Best for: small phases, bug fixes, verification gaps, learning GSD
272: 
273: **Skip to handle_branching step** (interactive plans execute inline after grouping).
274: </step>
275: 
276: <step name="handle_branching">
277: Check `branching_strategy` from init:
278: 
279: **"none":** Skip, continue on current branch.
280: 
281: **"phase" or "milestone":** Use pre-computed `branch_name` from init.
282: 
283: Fork the new phase branch off `origin/HEAD` (the project's default branch), not the current HEAD — otherwise consecutive phases compound and stay unpushed (#2916). If `$BRANCH_NAME` already exists locally, reuse it as-is.
284: 
285: ```bash
286: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
287: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
288: 
289: if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
290:   git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to existing branch '$BRANCH_NAME'." >&2; exit 1; }
291: else
292:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then  # #2916
293:     git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" \
294:       || { echo "ERROR: fetch origin/$DEFAULT_BRANCH failed and no local copy exists. Refusing to create '$BRANCH_NAME' off current HEAD (#2916)." >&2; exit 1; }
295:     echo "WARNING: fetch origin/$DEFAULT_BRANCH failed; using local copy as base." >&2
296:   fi
297:   if [ -n "$(git status --porcelain)" ]; then
298:     echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
299:   else
300:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
301:   fi
302:   # Pinned base + fail-fast: on success HEAD is exactly at origin/$DEFAULT_BRANCH,
303:   # so a post-creation merge-base or "ahead-of" guard would be unreachable. The
304:   # explicit base argument here is the single source of correctness for #2916.
305:   git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" \
306:     || { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
307: fi
308: ```
309: 
310: All subsequent commits go to this branch. User handles merging.
311: </step>
312: 
313: <step name="validate_phase">
314: From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.
315: 
316: Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
317: 
318: **Update STATE.md for phase start:**
319: ```bash
320: $GSD_SDK query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
321: ```
322: This updates Status, Last Activity, Current focus, Current Position, and plan counts in STATE.md so frontmatter and body text reflect the active phase immediately.
323: </step>
324: 
325: <step name="discover_and_group_plans">
326: Load plan inventory with wave grouping in one call:
327: 
328: ```bash
329: PLAN_INDEX=$($GSD_SDK query phase-plan-index "${PHASE_NUMBER}")
330: ```
331: 
332: Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.
333: 
334: **Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If `WAVE_FILTER` is set: also skip plans whose `wave` does not equal `WAVE_FILTER`.
335: 
336: **Wave safety check:** If `WAVE_FILTER` is set and there are still incomplete plans in any lower wave that match the current execution mode, STOP and tell the user to finish earlier waves first. Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete.
337: 
338: If all filtered: "No matching incomplete plans" → exit.
339: 
340: Report:
341: ```
342: ## Execution Plan
343: 
344: **Phase {X}: {Name}** — {total_plans} matching plans across {wave_count} wave(s)
345: 
346: {If WAVE_FILTER is set: `Wave filter active: executing only Wave {WAVE_FILTER}`.}
347: 
348: | Wave | Plans | What it builds |
349: |------|-------|----------------|
350: | 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
351: | 2 | 01-03 | ... |
352: ```
353: </step>
354: 
355: <step name="cross_ai_delegation">
356: **Optional step 2.5 — Delegate plans to an external AI runtime.**
357: 
358: This step runs after plan discovery and before normal wave execution. It identifies plans
359: that should be delegated to an external AI command and executes them via stdin-based prompt
360: delivery. Plans handled here are removed from the execute_waves plan list so the normal
361: executor skips them.
362: 
363: **Activation logic:**
364: 
365: 1. If `CROSS_AI_DISABLED` is true (`--no-cross-ai` flag): skip this step entirely.
366: 2. If `CROSS_AI_FORCE` is true (`--cross-ai` flag): mark ALL incomplete plans for cross-AI execution.
367: 3. Otherwise: check each plan's frontmatter for `cross_ai: true` AND verify config
368:    `workflow.cross_ai_execution` is `true`. Plans matching both conditions are marked for cross-AI.
369: 
370: ```bash
371: CROSS_AI_ENABLED=$($GSD_SDK query config-get workflow.cross_ai_execution 2>/dev/null || echo "false")
372: CROSS_AI_CMD=$($GSD_SDK query config-get workflow.cross_ai_command 2>/dev/null || echo "")
373: CROSS_AI_TIMEOUT=$($GSD_SDK query config-get workflow.cross_ai_timeout 2>/dev/null || echo "300")
374: ```
375: 
376: **If no plans are marked for cross-AI:** Skip to execute_waves.
377: 
378: **If plans are marked but `cross_ai_command` is empty:** Error — tell user to set
379: `workflow.cross_ai_command` via `gsd-sdk query config-set workflow.cross_ai_command "<command>"`.
380: 
381: **For each cross-AI plan (sequentially):**
382: 
383: 1. **Construct the task prompt** from the plan file:
384:    - Extract `<objective>` and `<tasks>` sections from the PLAN.md
385:    - Append PROJECT.md context (project name, description, tech stack)
386:    - Format as a self-contained execution prompt
387: 
388: 2. **Check for dirty working tree before execution:**
389:    ```bash
390:    if ! git diff --quiet HEAD 2>/dev/null; then
391:      echo "WARNING: dirty working tree detected — the external AI command may produce uncommitted changes that conflict with existing modifications"
392:    fi
393:    ```
394: 
395: 3. **Run the external command** from the project root, writing the prompt to stdin.
396:    Never shell-interpolate the prompt — always pipe via stdin to prevent injection:
397:    ```bash
398:    echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
399:    EXIT_CODE=$?
400:    ```
401: 
402: 4. **Evaluate the result:**
403: 
404:    **Success (exit 0 + valid summary):**
405:    - Read `$CANDIDATE_SUMMARY` and validate it contains meaningful content
406:      (not empty, has at least a heading and description — a valid SUMMARY.md structure)
407:    - Write it as the plan's SUMMARY.md file
408:    - Update STATE.md plan status to complete
409:    - Update ROADMAP.md progress
410:    - Mark plan as handled — skip it in execute_waves
411: 
412:    **Failure (non-zero exit or invalid summary):**
413:    - Display the error output and exit code
414:    - Warn: "The external command may have left uncommitted changes or partial edits
415:      in the working tree. Review `git status` and `git diff` before proceeding."
416:    - Offer three choices:
417:      - **retry** — run the same plan through cross-AI again
418:      - **skip** — fall back to normal executor for this plan (re-add to execute_waves list)
419:      - **abort** — stop execution entirely, preserve state for resume
420: 
421: 5. **After all cross-AI plans processed:** Remove successfully handled plans from the
422:    incomplete plan list so execute_waves skips them. Any skipped-to-fallback plans remain
423:    in the list for normal executor processing.
424: </step>
425: 
426: <step name="execute_waves">
427: Execute each selected wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.
428: 
429: **Stream-idle-timeout prevention — checkpoint heartbeats (#2410):**
430: 
431: Multi-plan phases can accumulate enough subagent context that the the agent API
432: SSE layer terminates with `Stream idle timeout - partial response received`
433: between a large tool_result and the next assistant turn (seen on Claude Code
434: + Opus 4.7 at ~200K+ cache_read). To keep the stream warm, emit short
435: assistant-text heartbeats — **no tool call, just a literal line** — at every
436: wave and plan boundary. Each heartbeat MUST start with `[checkpoint]` so
437: tooling and `/gsd-manager`'s background-completion handler can grep partial
438: transcripts. `{P}/{Q}` is the phase-wide completed/total plans counter and
439: increases monotonically across waves. `{status}` is `complete` (success),
440: `failed` (executor error), or `checkpoint` (human-gate returned).
441: 
442: ```
443: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
444: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
445: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} {status} ({P}/{Q} plans done)
446: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
447: ```
448: 
449: **For each wave:**
450: 
451: 1. **Intra-wave files_modified overlap check (BEFORE spawning):**
452: 
453:    Before spawning any agents for this wave, inspect the `files_modified` list of all plans
454:    in the wave. Check every pair of plans in the wave — if any two plans share even one file
455:    in their `files_modified` lists, those plans have an implicit dependency and MUST NOT run
456:    in parallel.
457: 
458:    **Detection algorithm (pseudocode):**
459:    ```
460:    seen_files = {}
461:    overlapping_plans = []
462:    for each plan in wave_plans:
463:      for each file in plan.files_modified:
464:        if file in seen_files:
465:          overlapping_plans.add(plan, seen_files[file])  # both plans overlap on this file
466:        else:
467:          seen_files[file] = plan
468:    ```
469: 
470:    **If overlap is detected:**
471:    - Warn the user:
472:      ```
473:      ⚠ Intra-wave files_modified overlap detected in Wave {N}:
474:        Plan {A} and Plan {B} both modify {file}
475:        Running these plans sequentially to avoid parallel worktree conflicts.
476:      ```
477:    - Override `PARALLELIZATION` to `false` for this wave only — run all plans in the wave
478:      sequentially regardless of the global parallelization setting.
479:    - This is a safety net for plans that were incorrectly assigned to the same wave.
480:      The planner should have caught this; flag it as a planning defect so the user can
481:      replan the phase if desired.
482: 
483:    **If no overlap:** proceed normally (parallel if `PARALLELIZATION=true`).
484: 
485: 2. **Describe what's being built (BEFORE spawning):**
486: 
487:    **First, emit the wave-start checkpoint heartbeat as a literal assistant-text
488:    line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
489:    is required before any further reasoning or spawning:**
490: 
491:    ```
492:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
493:    ```
494: 
495:    Then read each plan's `<objective>`. Extract what's being built and why.
496: 
497:    ```
498:    ---
499:    ## Wave {N}
500: 
501:    **{Plan ID}: {Plan Name}**
502:    {2-3 sentences: what this builds, technical approach, why it matters}
503: 
504:    Spawning {count} agent(s)...
505:    ---
506:    ```
507: 
508:    - Bad: "Executing terrain generation plan"
509:    - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."
510: 
511: 2.5. **Per-plan worktree decision (run for each plan in this wave BEFORE its dispatch):**
512: 
513:    Read and execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. It extracts `PLAN_FILES` from the plan's JSON, intersects against `SUBMODULE_PATHS` (with normalization, bidirectional matching, and glob-prefix handling), and sets `USE_WORKTREES_FOR_PLAN` to `false` when the plan touches a submodule path. Append `plan_id` to a `WAVE_WORKTREE_PLANS` accumulator when `USE_WORKTREES_FOR_PLAN != false`.
514: 
515:    The dispatch branches in step 3 below MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.
516: 
517: 3. **Spawn executor agents:**
518: 
519:    **Emit a plan-start heartbeat (literal line, no tool call) immediately before
520:    each `Agent()` dispatch (#2410):**
521: 
522:    `[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)`
523: 
524:    Pass paths only — executors read files themselves with their fresh context window.
525:    For 200k models, this keeps orchestrator context lean (~10-15%).
526:    For 1M+ models (Opus 4.6, Sonnet 4.6), richer context can be passed directly.
527: 
528:    **Worktree mode** (`USE_WORKTREES_FOR_PLAN` is not `false` — evaluated per-plan in step 2.5):
529: 
530:    Before spawning, capture the current HEAD:
531:    ```bash
532:    EXPECTED_BASE=$(git rev-parse HEAD)
533:    DISPATCH_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
534:    EXPECTED_BRANCH=$(git rev-parse --abbrev-ref HEAD)
535:    if [ "${USE_WORKTREES_FOR_PLAN:-true}" != "false" ] && [ -z "${WAVE_WORKTREE_MANIFEST:-}" ]; then
536:      WAVE_WORKTREE_MANIFEST=$(mktemp "${TMPDIR:-/tmp}/gsd-worktree-wave-XXXXXX.json")
537:      printf '{"worktrees":[]}\n' > "$WAVE_WORKTREE_MANIFEST"
538:      export WAVE_WORKTREE_MANIFEST
539:    fi
540:    ```
541: 
542:    **Sequential dispatch for parallel execution (waves with 2+ agents):**
543:    Dispatch each `Agent()` call **one at a time with `run_in_background: true`**. Do NOT
544:    send all Agent calls in a single message: simultaneous `git worktree add` calls race
545:    on `.git/config.lock`. Agents still run in parallel once their worktrees are created.
546: 
547:    ```text
548:    # CORRECT: one Agent() per message with run_in_background: true
549:    # WRONG: multiple Agent() calls in one message -> .git/config.lock contention
550:    ```
551: 
552:    ```text
553:    Agent(
554:      subagent_type="gsd-executor",
555:      description="Execute plan {plan_number} of phase {phase_number}",
556:      # Only include model= when executor_model is an explicit model name.
557:      # When executor_model is "inherit", omit this parameter entirely so
558:      # Claude Code inherits the orchestrator model automatically.
559:      model="{executor_model}",  # omit this line when executor_model == "inherit"
560:      isolation="worktree",
561:      prompt="
562:        <objective>
563:        Execute plan {plan_number} of phase {phase_number}-{phase_name}.
564:        Commit each task atomically. Create SUMMARY.md.
565:        Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes after all worktree agents in the wave complete.
566:        </objective>
567: 
568:        <worktree_branch_check>
569:        FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
570:        spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
571:        namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
572:        or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
573:        that destroys concurrent commits in multi-active scenarios (#2924). Only after
574:        Step 1 passes is `git reset --hard` safe (#2015 — affects all platforms).
575:        ```bash
576:        HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
577:        ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
578:        if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
579:          echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
580:          exit 1
581:        fi
582:        if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
583:          echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
584:          exit 1
585:        fi
586:        ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
587:        if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
588:          git reset --hard {EXPECTED_BASE}
589:          [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
590:        fi
591:        ```
592:        Per-commit HEAD/cwd-drift/path-guard: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md` (in <execution_context>).
593:        </worktree_branch_check>
594: 
595:        <parallel_execution>
596:        You are running as a PARALLEL executor agent in a git worktree. Worktree path safety (cwd-drift, absolute-path guards) is in `worktree-path-safety.md` (loaded below).
597:        Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify`
598:        unless the orchestrator surfaces `workflow.worktree_skip_hooks=true` in this
599:        prompt; silent bypass violates project AGENTS.md guidance (#2924).
600: 
601:        IMPORTANT: Do NOT modify STATE.md or ROADMAP.md. execute-plan.md
602:        auto-detects worktree mode (`.git` is a file, not a directory) and skips
603:        shared file updates automatically. The orchestrator updates them centrally
604:        after merge.
605: 
606:        REQUIRED: SUMMARY.md MUST be committed before you return. In worktree mode the
607:        git_commit_metadata step in execute-plan.md commits SUMMARY.md and REQUIREMENTS.md
608:        only (STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer
609:        this commit — the orchestrator force-removes the worktree after you return, and
610:        any uncommitted SUMMARY.md will be permanently lost (#2070).
611:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
612:        </parallel_execution>
613: 
614:        <execution_context>
615:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
616:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
617:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
618:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
619:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
620:        ${CONTEXT_WINDOW < 200000 ? '' : '@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md'}
621:        </execution_context>
622: 
623:        <files_to_read>
624:        Read these files at execution start using the Read tool:
625:        - {phase_dir}/{plan_file} (Plan)
626:        - .planning/PROJECT.md (Project context — core value, requirements, evolution rules)
627:        - .planning/STATE.md (State)
628:        - .planning/config.json (Config, if exists)
629:        ${CONTEXT_WINDOW >= 500000 ? `
630:        - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
631:        - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
632:        - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
633:        ` : ''}
634:        - ./AGENTS.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
635:        - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
636:        </files_to_read>
637: 
638:        ${AGENT_SKILLS}
639: 
640:        <mcp_tools>
641:        If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch, context7,
642:        or other MCP servers), prefer those tools over Grep/Glob for code navigation when available.
643:        MCP tools often save significant tokens by providing structured code indexes.
644:        Check tool availability first — if MCP tools are not accessible, fall back to Grep/Glob.
645:        </mcp_tools>
646: 
647:        <success_criteria>
648:        - [ ] All tasks executed
649:        - [ ] Each task committed individually
650:        - [ ] SUMMARY.md created in plan directory
651:        - [ ] No modifications to shared orchestrator artifacts (the orchestrator handles all post-wave shared-file writes)
652:        </success_criteria>
653:      "
654:    )
655:    ```
656: 
657:    Immediately after each worktree `Agent()` spawn returns metadata, atomically append `{agent_id, worktree_path, branch, expected_base}` to `WAVE_WORKTREE_MANIFEST`. If any field is missing, stop and ask for recovery instead of scanning all agent worktrees.
658: 
659:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
660: 
661:    **Sequential mode** (`USE_WORKTREES_FOR_PLAN` is `false` — either project-level `USE_WORKTREES=false`, or per-plan submodule intersection forced it false in step 2.5):
662: 
663:    Omit `isolation="worktree"` from the Agent call. Replace the `<parallel_execution>` block with:
664: 
665:    ```
666:        <sequential_execution>
667:        You are running as a SEQUENTIAL executor agent on the main working tree.
668:        Use normal git commits (with hooks). Do NOT use --no-verify.
669:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
670:        </sequential_execution>
671:    ```
672: 
673:    The sequential mode Agent prompt uses the same structure as worktree mode but with these differences in success_criteria — since there is only one agent writing at a time, there are no shared-file conflicts:
674: 
675:    ```
676:        <success_criteria>
677:        - [ ] All tasks executed
678:        - [ ] Each task committed individually
679:        - [ ] SUMMARY.md created in plan directory
680:        - [ ] STATE.md updated with position and decisions
681:        - [ ] ROADMAP.md updated with plan progress (via `roadmap update-plan-progress`)
682:        </success_criteria>
683:    ```
684: 
685:    When worktrees are disabled for a plan (per-plan or project-level), that plan's executor runs on the main working tree. If **any** plan in the current wave dropped to sequential mode, execute the affected plan(s) **one at a time** to avoid concurrent writes to the main working tree — plans in the same wave that retained worktree isolation can still run in parallel alongside the sequential ones, but two non-worktree plans in the same wave must serialize. When the project-level `USE_WORKTREES=false`, all plans in the wave serialize regardless of the `PARALLELIZATION` setting.
686: 
687: 4. **Wait for all agents in wave to complete.**
688: 
689:    **Plan-complete heartbeat (#2410):** as each executor returns (or is verified
690:    via spot-check below), emit one line — `complete` advances `{P}`, `failed`
691:    and `checkpoint` do not but still warm the stream:
692: 
693:    ```
694:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
695:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
696:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
697:    ```
698: 
699:    **Completion signal fallback (Copilot and runtimes where Agent() may not return):**
700: 
701:    If a spawned agent does not return a completion signal but appears to have finished
702:    its work, do NOT block indefinitely. Instead, verify completion via spot-checks:
703: 
704:    ```bash
705:    # For each plan in this wave, check if the executor finished:
706:    SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
707:    COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
708:    COMMITS_SINCE_DISPATCH=$(git log "${EXPECTED_BRANCH}" --since="${DISPATCH_TS}" --oneline | head -1)
709:    ```
710: 
711:    **If SUMMARY.md exists AND commits are found:** The agent completed successfully —
712:    treat as done and proceed to step 5. Log: `"✓ {Plan ID} completed (verified via spot-check — completion signal not received)"`
713: 
714:    **If SUMMARY.md does NOT exist after a reasonable wait:** The agent may still be
715:    running or may have failed silently. Check `git log --oneline -5` for recent
716:    activity. If commits are still appearing, wait longer. If no activity, report
717:    the plan as failed and route to the failure handler in step 6.
718: 
719:    **Configurable stall surveillance (#3212):** Every `${EXECUTOR_STALL_INTERVAL_MINUTES}`
720:    minutes while waiting, inspect `git log "${EXPECTED_BRANCH}" --since="${DISPATCH_TS}"`
721:    for activity. If no completion signal, no SUMMARY.md, and no expected-branch
722:    commits appear for `${EXECUTOR_STALL_THRESHOLD_MINUTES}` minutes, pause and
723:    ask for one recovery path: `continue waiting`, `kill and retry`, or
724:    `kill and switch to inline execution`.
725: 
726:    **This fallback applies automatically to all runtimes.** Claude Code's Agent() normally
727:    returns synchronously, but the fallback ensures resilience if it doesn't.
728: 
729: 5. **Post-wave hook validation (parallel mode only):** Hooks run on every executor commit by default (#2924); this post-wave run only fires when `workflow.worktree_skip_hooks=true` opted out of per-commit hooks:
730:    ```bash
731:    SKIP_HOOKS=$($GSD_SDK query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
732:    if [ "$SKIP_HOOKS" = "true" ]; then
733:      # Stash uncommitted changes under a named ref so we always pop (bare `git stash` strands them on hook/script failure). #3542: `refs/stash` is shared across worktrees, so this helper runs ONLY in the orchestrator's main checkout after all wave worktrees have been merged + removed; executors are forbidden from running any `git stash` subcommand (see `<destructive_git_prohibition>` in `agents/gsd-executor.md`).
734:      STASHED=false
735:      if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
736:      git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review before continuing"
737:      [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop gsd-post-wave-hook stash — recover manually")
738:    fi
739:    ```
740:    If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"
741: 
742: 5.5. **Worktree cleanup (when `isolation="worktree"` was used):**
743: 
744:    **Standard wave contract:** Each wave's worktrees merge to main via the templated path below before the next wave's worktrees fork. The cleanup loop runs once per wave at the end of the wave lifecycle. Worktrees created in wave N must be fully removed before wave N+1 forks new ones.
745: 
746:    **Cross-wave dependency deviation (supported execution mode):** When the orchestrator legitimately deviates from the standard wave model — for example, a phase with cross-wave plan dependencies that requires custom inter-worktree base-update merges (e.g., `merge: bring 09-01 + 09-02 into 09-03 base`) — the cleanup loop below is NOT automatically re-entered for those custom merges. The deviation path produces correct final history but bypasses this loop, leaving `worktree-agent-*` directories in place. Use the **cleanup-tail snippet** below to remove any residual worktrees after such a deviation.
747: 
748:    When executor agents ran in worktree isolation, their commits land on temporary branches in separate working trees. After the wave completes, merge these changes back and clean up:
749: 
750:    **Manifest source of truth (#3384):** Cleanup consumes the `WAVE_WORKTREE_MANIFEST` created and populated during executor dispatch in step 3. Do not recreate or truncate it here.
751: 
752:    Prefer the bounded helper, which validates branch identity, expected base, deletion
753:    diffs, merge result, and worktree removal before deleting the temporary branch.
754:    If the helper reports a blocked cleanup, resolve the reported manifest entry and
755:    rerun the same command. Do not fall back to broad worktree discovery.
756: 
757:    ```bash
758:    [ -n "${WAVE_WORKTREE_MANIFEST:-}" ] && [ -f "$WAVE_WORKTREE_MANIFEST" ] || {
759:      echo "BLOCKED: missing WAVE_WORKTREE_MANIFEST; refusing broad worktree cleanup (#3384)." >&2
760:      exit 1
761:    }
762: 
763:    # Guard: pin cleanup back to the primary worktree and fail on branch drift (#3174).
764:    PRIMARY_WT=$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')
765:    if [ -z "$PRIMARY_WT" ]; then
766:      echo "FATAL: could not resolve primary worktree before cleanup" >&2
767:      exit 1
768:    fi
769:    if [ -n "$PRIMARY_WT" ] && [ "$(pwd -P 2>/dev/null)" != "$(cd "$PRIMARY_WT" 2>/dev/null && pwd -P)" ]; then echo "⚠ Orchestrator CWD drifted to $(pwd) — pinning to $PRIMARY_WT before worktree cleanup (#3174)"; cd "$PRIMARY_WT" || { echo "FATAL: cannot cd to primary worktree $PRIMARY_WT" >&2; exit 1; }; fi
770:    ORCH_BRANCH=$(git rev-parse --abbrev-ref HEAD)
771:    [ -z "${EXPECTED_BRANCH:-}" ] || [ "$ORCH_BRANCH" = "$EXPECTED_BRANCH" ] || { echo "FATAL: orchestrator on '$ORCH_BRANCH' but expected '$EXPECTED_BRANCH' before worktree cleanup — refusing to merge (#3174-class drift)" >&2; exit 1; }
772: 
773:    # Fail closed: SDK refusal (safety guard #3174/#3384) must surface — do not swallow exit 1.
774:    $GSD_SDK query worktree.cleanup-wave --manifest "$WAVE_WORKTREE_MANIFEST" || exit 1
775:    ```
776: 
777:    **Cleanup-tail snippet (use after any wave whose merges did not flow through the templated path above):**
778: 
779:    If the orchestrator deviated from the standard wave merge path (e.g., custom inter-worktree base-update merges with `merge: bring …` style messages), run this snippet after the custom merges are complete. It reads only `WAVE_WORKTREE_MANIFEST`; do not discover unrelated `worktree-agent-*` worktrees.
780: 
781:    ```bash
782:    # Cleanup-tail: pin orchestrator CWD to primary worktree before cleanup-tail (#3174).
783:    PRIMARY_WT=$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')
784:    if [ -n "$PRIMARY_WT" ] && [ "$(pwd -P 2>/dev/null)" != "$(cd "$PRIMARY_WT" 2>/dev/null && pwd -P)" ]; then echo "⚠ Orchestrator CWD drifted to $(pwd) — pinning to $PRIMARY_WT before cleanup-tail (#3174)"; cd "$PRIMARY_WT" || { echo "FATAL: cannot cd to primary worktree $PRIMARY_WT" >&2; exit 1; }; fi
785:    # Cleanup-tail: remove residual agent worktrees after a cross-wave-dependency deviation.
786:    # Uses only the current wave manifest to avoid touching unrelated active agents (#3384).
787:    WT_PATHS_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-worktree-paths-XXXXXX")
788:    node -e 'const fs=require("fs");const p=process.env.WAVE_WORKTREE_MANIFEST;try{if(!p)throw new Error("WAVE_WORKTREE_MANIFEST is unset");if(!fs.existsSync(p))throw new Error("manifest does not exist");const s=fs.readFileSync(p,"utf8");if(!s.trim())throw new Error("manifest is empty");const j=JSON.parse(s);for(const w of j.worktrees||[])if(w.worktree_path)console.log(w.worktree_path)}catch(e){console.error(`ERROR: cannot read worktree manifest ${p||"(unset)"}: ${e.message}`);process.exit(1)}' > "$WT_PATHS_FILE" || { echo "BLOCKED: cannot read WAVE_WORKTREE_MANIFEST; refusing cleanup (#3384)." >&2; exit 1; }
789:    while IFS= read -r WT; do
790:      [ -z "$WT" ] && continue
791:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
792:      [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
793:      echo "Cleaning up residual worktree: $WT (branch: $WT_BRANCH)"
794:      git worktree unlock "$WT" 2>/dev/null || true
795:      if ! git worktree remove "$WT" --force; then
796:        WT_NAME=$(basename "$WT")
797:        if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
798:          echo "⚠ Worktree $WT is locked — unlock failed; manual cleanup required:"
799:          echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
800:        else
801:          echo "⚠ Residual worktree at $WT — remove failed; manual cleanup required"
802:        fi
803:      else
804:        git branch -D "$WT_BRANCH" 2>/dev/null || true
805:      fi
806:    done < "$WT_PATHS_FILE"
807:    git worktree prune
808:    ```
809: 
810:    **When to skip step 5.5:**
811: 
812:    **If no plan in this wave used worktree isolation** (project-level `USE_WORKTREES=false` OR every plan in the wave had `USE_WORKTREES_FOR_PLAN=false` — i.e. `WAVE_WORKTREE_PLANS` from step 2.5 is empty): all agents ran on the main working tree — skip this step entirely.
813: 
814:    **If the orchestrator merged via custom messages (cross-wave-dependency deviation):** the templated cleanup loop above was not triggered for those merges. Run the cleanup-tail snippet above instead. After the snippet completes, proceed to step 5.6.
815: 
816:    **If at least one plan used worktrees but others did not:** still run this cleanup — it iterates over actual `git worktree list` output and only merges back the worktrees that were created, leaving sequential plans' commits on the main tree untouched.
817: 
818:    **If no worktrees found at runtime:** Skip silently — agents may have been spawned without worktree isolation, or the orchestrator already cleaned them up.
819: 
820: 5.6. **Post-merge build & test gate:**
821: 
822:    After merging all worktrees in a wave (parallel mode), or after the last plan completes
823:    (serial mode), run a build and then the project's test suite to catch cross-plan
824:    integration issues that individual worktree self-checks cannot detect (e.g., conflicting
825:    type definitions, removed exports, import changes, link errors).
826: 
827:    This addresses the Generator self-evaluation blind spot identified in Anthropic's
828:    harness engineering research: agents reliably report Self-Check: PASSED even when
829:    merging their work creates failures.
830: 
831:    Read and execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`.
832: 
833: 5.7. **Post-wave shared artifact update (when at least one plan used worktrees, skip if tests failed):**
834: 
835:    When **any** executor agent in this wave ran with `isolation="worktree"`, that agent skipped STATE.md and ROADMAP.md updates to avoid last-merge-wins overwrites. The orchestrator is the single writer for these files. After worktrees are merged back, update shared artifacts once for every completed plan in the wave (worktree-mode plans **and** sequential plans that ran on the main tree but deferred to the orchestrator for tracking writes).
836: 
837:    **Only update tracking when tests passed (TEST_EXIT=0).**
838:    If tests failed or timed out, skip the tracking update — plans should
839:    not be marked as complete when integration tests are failing or inconclusive.
840: 
841:    ```bash
842:    # Guard: only update tracking if post-merge tests passed
843:    # Timeout (124) is treated as inconclusive — do NOT mark plans complete
844:    if [ "${TEST_EXIT}" -eq 0 ]; then
845:      # Update ROADMAP plan progress for each completed plan in this wave
846:      for plan_id in {completed_plan_ids}; do
847:        $GSD_SDK query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
848:      done
849: 
850:      # Only commit tracking files if they actually changed
851:      if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
852:        $GSD_SDK query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
853:      fi
854:    elif [ "${TEST_EXIT}" -eq 124 ]; then
855:      echo "⚠ Skipping tracking update — test suite timed out. Plans remain in-progress. Run tests manually to confirm."
856:    else
857:      echo "⚠ Skipping tracking update — post-merge tests failed (exit ${TEST_EXIT}). Plans remain in-progress until tests pass."
858:    fi
859:    ```
860: 
861:    Where `WAVE_PLAN_IDS` is the space-separated list of plan IDs that completed in this wave.
862: 
863:    **If no plan in this wave used worktrees** (project-level `USE_WORKTREES=false` OR `WAVE_WORKTREE_PLANS` is empty): sequential agents already updated STATE.md and ROADMAP.md themselves — skip this step.
864: 
865: 5.8. **Handle test gate failures (when `WAVE_FAILURE_COUNT > 0`):**
866: 
867:    ```
868:    ## ⚠ Post-Merge Test Failure (cumulative failures: ${WAVE_FAILURE_COUNT})
869: 
870:    Wave {N} worktrees merged successfully, but {M} tests fail after merge.
871:    This typically indicates conflicting changes across parallel plans
872:    (e.g., type definitions, shared imports, API contracts).
873: 
874:    Failed tests:
875:    {first 10 lines of failure output}
876: 
877:    Options:
878:    1. Fix now (recommended) — resolve conflicts before next wave
879:    2. Continue — failures may compound in subsequent waves
880:    ```
881: 

(Output capped at 50 KB. Showing lines 1-881. Use offset=882 to continue.)
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

## ASSISTANT (turn 12)

Tools: bash

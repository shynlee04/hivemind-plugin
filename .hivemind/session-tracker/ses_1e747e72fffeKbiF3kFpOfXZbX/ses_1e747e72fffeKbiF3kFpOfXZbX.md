---
sessionID: ses_1e747e72fffeKbiF3kFpOfXZbX
created: 2026-05-11T20:29:05.283Z
updated: 2026-05-11T20:29:05.283Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

execute-command [command=/gsd-spec-phase, arguments=BOOT-09, mode=dispatch]
{"success":false,"error":"Failed to construct 'Request': Invalid URL \"/agent\""}
Thinking: The /gsd-spec-phase command doesn't exist as a registered command. Let me try execute-command with no agent specified to list available agents, as the tool description suggests.
# execute-command [mode=dispatch, command=/help]
{"success":false,"error":"Failed to construct 'Request': Invalid URL \"/agent\""}
Thinking: The execute-command tool is not connecting properly - it's trying to construct a URL with /agent which suggests it needs an agent parameter. But when I try to use it without an agent, it fails. This tool might require a specific runtime environment.
Let me try it differently - with an explicit agent, or fire-and-forget mode.
# execute-command [command=/gsd-spec-phase, arguments=BOOT-09, mode=fire-and-forget]
{"success":false,"error":"Failed to construct 'Request': Invalid URL \"/agent\""} so please route GSD route with GSD agents redirect to this phase with artifacts output at the correct paths - I said phase with MVP for the 4  but they must be handled with all the dynamic downstream consumer not the context junc injection to inject anywhere it would - it is conditional and routed toward the 2 linages, l0, l1, l2 l3 , skills system, commands, workflows both building and buit etc it is complex not the inline generation of text I will not conclude and answer anything here up front without you routing properly usng GSD routers

### Tool: task

**Input:**
```json
{
  "description": "Research config consumers across lineages",
  "subagent_type": "hm-l2-investigator",
  "task_id": "ses_1e744d69effe3Hy18Sm8igpdiu"
}
```

**Output:** (pruned)
```
task_id: ses_1e744d69effe3Hy18Sm8igpdiu
```


### Tool: task

**Input:**
```json
{
  "description": "Map skills/commands config consumption",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1e744c518ffew7OR1yGN170dkl"
}
```

**Output:** (pruned)
```
task_id: ses_1e744c518ffew7OR1yGN170dkl
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
Phase number:  (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in :
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

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_vkD9I9EqNIxpq7anWfBN8219"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_MpxdILrnp4ulxy9aXsh53730"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_EhdojgOcIkejF5EbpnA39488"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_cSKAfkOLhUJ38JuWKndS0502"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_qjb1nz8IVCOLnGrgd4D00142"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_aX8YuwuXjEUZ22SbglQE2946"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/PROJECT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_4xFDFdEloR3vlLcgFCry5582"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_9VKZPBDihr900FtcKc8y9363"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-08-agent-skill-integration/BOOT-08-CONTEXT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/scout-codebase.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Y5fgxGdI1ABMF57EeHbw0736"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_XZ77ntdS0BuaWy1qXdUj8571"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_tkMs5kzPT6vSXJVcxRHv8600"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_F0tdEwKZxXm4XkCutB2Q5146"
}
```


## USER (turn 3)

all

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_mFyhauiGtGUbfU4BlUpy7448"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_eMVrRS7VYmbr41rUuVN96315"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_03mMRi840NShzXZuYi5s1617"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Map config field decision trees",
  "subagent_type": "gsd-domain-researcher",
  "task_id": "ses_1e73aad65ffeImqDZtDoU2h0V1"
}
```

**Output:** (pruned)
```
task_id: ses_1e73aad65ffeImqDZtDoU2h0V1
```


### Tool: task

**Input:**
```json
{
  "description": "Research downstream chains per value",
  "subagent_type": "hm-l2-researcher",
  "task_id": "ses_1e73a9690ffeVxc4L6HmyS87Ua"
}
```

**Output:** (pruned)
```
task_id: ses_1e73a9690ffeVxc4L6HmyS87Ua
```


## USER (turn 4)

<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
</runtime_note>

<context>
Phase number: <too complex for your model - not intelligence enough - scope down only language handle conversation -> l0 agents - injection to message transformation (research api, sdk, and plugin api of open code for correct interface delegation do not do up front I am very brief here) hook, injection with logics to appear as system instruction governance before user prompt to only main session (do not inject child session although the field appear to be user but child session is not the human user but from delegate task tool)  both thinking block, response of the front agent must be in the langue - for doc - enforcing dot md to of path indicated path relative to .hivemind/planning  (the path is adjustable and configed freely with json schema ) and take multiple project-based list of path - including subdirs recursively )to be enforced with the languge 0 the langue enforcement overwrite the langue user is writting if I am writing in en but config as conversation vi then you must response in vi for example the (required)

**Flags:**
- `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)

Context files are resolved in-workflow using `init phase-op`.
</context>

<process>
Execute end-to-end.

**MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
</process>

<success_criteria>
- Codebase scouted for current state before questioning begins
- All 4 ambiguity dimensions scored after each interview round
- Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
- SPEC.md committed atomically
- User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
</success_criteria>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity scoring.
3: Produces a SPEC.md with falsifiable requirements that discuss-phase treats as locked decisions.
4: 
5: This workflow handles "what" and "why" — discuss-phase handles "how".
6: </purpose>
7: 
8: <ambiguity_model>
9: Score each dimension 0.0 (completely unclear) to 1.0 (crystal clear):
10: 
11: | Dimension         | Weight | Minimum | What it measures                                  |
12: |-------------------|--------|---------|---------------------------------------------------|
13: | Goal Clarity      | 35%    | 0.75    | Is the outcome specific and measurable?           |
14: | Boundary Clarity  | 25%    | 0.70    | What's in scope vs out of scope?                  |
15: | Constraint Clarity| 20%    | 0.65    | Performance, compatibility, data requirements?    |
16: | Acceptance Criteria| 20%   | 0.70    | How do we know it's done?                         |
17: 
18: **Ambiguity score** = 1.0 − (0.35×goal + 0.25×boundary + 0.20×constraint + 0.20×acceptance)
19: 
20: **Gate:** ambiguity ≤ 0.20 AND all dimensions ≥ their minimums → ready to write SPEC.md.
21: 
22: A score of 0.20 means 80% weighted clarity — enough precision that the planner won't silently make wrong assumptions.
23: </ambiguity_model>
24: 
25: <interview_perspectives>
26: Rotate through these perspectives — each naturally surfaces different blindspots:
27: 
28: **Researcher (rounds 1–2):** Ground the discussion in current reality.
29: - "What exists in the codebase today related to this phase?"
30: - "What's the delta between today and the target state?"
31: - "What triggers this work — what's broken or missing?"
32: 
33: **Simplifier (round 2):** Surface minimum viable scope.
34: - "What's the simplest version that solves the core problem?"
35: - "If you had to cut 50%, what's the irreducible core?"
36: - "What would make this phase a success even without the nice-to-haves?"
37: 
38: **Boundary Keeper (round 3):** Lock the perimeter.
39: - "What explicitly will NOT be done in this phase?"
40: - "What adjacent problems is it tempting to solve but shouldn't?"
41: - "What does 'done' look like — what's the final deliverable?"
42: 
43: **Failure Analyst (round 4):** Find the edge cases that invalidate requirements.
44: - "What's the worst thing that could go wrong if we get the requirements wrong?"
45: - "What does a broken version of this look like?"
46: - "What would cause a verifier to reject the output?"
47: 
48: **Seed Closer (rounds 5–6):** Lock remaining undecided territory.
49: - "We have [dimension] at [score] — what would make it completely clear?"
50: - "The remaining ambiguity is in [area] — can we make a decision now?"
51: - "Is there anything you'd regret not specifying before planning starts?"
52: </interview_perspectives>
53: 
54: <process>
55: 
56: ## Step 1: Initialize
57: 
58: ```bash
59: INIT=$(node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
60: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
61: ```
62: 
63: Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `state_path`, `requirements_path`, `roadmap_path`, `planning_path`, `response_language`, `commit_docs`.
64: 
65: **If `response_language` is set:** All user-facing text in this workflow MUST be in `{response_language}`. Technical terms, code, and file paths stay in English.
66: 
67: **If `phase_found` is false:**
68: ```
69: Phase [X] not found in roadmap.
70: Use /gsd-progress to see available phases.
71: ```
72: Exit.
73: 
74: **Check for existing SPEC.md:**
75: ```bash
76: ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
77: ```
78: 
79: If SPEC.md already exists:
80: 
81: **If `--auto`:** Auto-select "Update it". Log: `[auto] SPEC.md exists — updating.`
82: 
83: **Otherwise:** Use question:
84: - header: "Spec"
85: - question: "Phase [X] already has a SPEC.md. What do you want to do?"
86: - options:
87:   - "Update it" — Revise and re-score
88:   - "View it" — Show current spec
89:   - "Skip" — Exit (use existing spec as-is)
90: 
91: If "View": Display SPEC.md, then offer Update/Skip.
92: If "Skip": Exit with message: "Existing SPEC.md unchanged. Run /gsd-discuss-phase [X] to continue."
93: If "Update": Load existing SPEC.md, continue to Step 3.
94: 
95: ## Step 2: Scout Codebase
96: 
97: **Read these files before any questions:**
98: - `{requirements_path}` — Project requirements
99: - `{state_path}` — Decisions already made, current phase, blockers
100: - ROADMAP.md phase entry — Phase description, goals, canonical refs
101: 
102: **Grep the codebase** for code/files relevant to this phase goal. Look for:
103: - Existing implementations of similar functionality
104: - Integration points where new code will connect
105: - Test coverage gaps relevant to the phase
106: - Prior phase artifacts (SUMMARY.md, VERIFICATION.md) that inform current state
107: 
108: **Synthesize current state** — the grounded baseline for the interview:
109: - What exists today related to this phase
110: - The gap between current state and the phase goal
111: - The primary deliverable: what file/behavior/capability does NOT exist yet?
112: 
113: Confirm your current state synthesis internally. Do not present it to the user yet — you'll use it to ask precise, grounded questions.
114: 
115: ## Step 3: First Ambiguity Assessment
116: 
117: Before questioning begins, score the phase's current ambiguity based only on what ROADMAP.md and REQUIREMENTS.md say:
118: 
119: ```
120: Goal Clarity:       [score 0.0–1.0]
121: Boundary Clarity:   [score 0.0–1.0]
122: Constraint Clarity: [score 0.0–1.0]
123: Acceptance Criteria:[score 0.0–1.0]
124: 
125: Ambiguity: [score] ([calculate])
126: ```
127: 
128: **If `--auto` and initial ambiguity already ≤ 0.20 with all minimums met:** Skip interview — derive SPEC.md directly from roadmap + requirements. Log: `[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.` Jump to Step 6.
129: 
130: **Otherwise:** Continue to Step 4.
131: 
132: ## Step 4: Socratic Interview Loop
133: 
134: **Max 6 rounds.** Each round: 2–3 questions max. End round after user responds.
135: 
136: **Round selection by perspective:**
137: - Round 1: Researcher
138: - Round 2: Researcher + Simplifier
139: - Round 3: Boundary Keeper
140: - Round 4: Failure Analyst
141: - Rounds 5–6: Seed Closer (focus on lowest-scoring dimensions)
142: 
143: **After each round:**
144: 1. Update all 4 dimension scores from the user's answers
145: 2. Calculate new ambiguity score
146: 3. Display the updated scoring:
147: 
148: ```
149: After round [N]:
150:   Goal Clarity:       [score] (min 0.75) [✓ or ↑ needed]
151:   Boundary Clarity:   [score] (min 0.70) [✓ or ↑ needed]
152:   Constraint Clarity: [score] (min 0.65) [✓ or ↑ needed]
153:   Acceptance Criteria:[score] (min 0.70) [✓ or ↑ needed]
154:   Ambiguity: [score] (gate: ≤ 0.20)
155: ```
156: 
157: **Gate check after each round:**
158: 
159: If gate passes (ambiguity ≤ 0.20 AND all minimums met):
160: 
161: **If `--auto`:** Jump to Step 6.
162: 
163: **Otherwise:** question:
164: - header: "Spec Gate Passed"
165: - question: "Ambiguity is [score] — requirements are clear enough to write SPEC.md. Proceed?"
166: - options:
167:   - "Yes — write SPEC.md" → Jump to Step 6
168:   - "One more round" → Continue interview
169:   - "Done talking — write it" → Jump to Step 6
170: 
171: **If max rounds reached (6) and gate not passed:**
172: 
173: **If `--auto`:** Write SPEC.md anyway — flag unresolved dimensions. Log: `[auto] Max rounds reached. Writing SPEC.md with [N] dimensions below minimum. Planner will need to treat these as assumptions.`
174: 
175: **Otherwise:** question:
176: - header: "Max Rounds"
177: - question: "After 6 rounds, ambiguity is [score]. [List dimensions still below minimum.] What would you like to do?"
178: - options:
179:   - "Write SPEC.md anyway — flag gaps" → Write SPEC.md, mark unresolved dimensions in Ambiguity Report
180:   - "Keep talking" → Continue (no round limit from here)
181:   - "Abandon" → Exit without writing
182: 
183: **If `--auto` mode throughout:** Replace all question calls above with the agent's recommended choice. Log decisions inline. Apply the same logic as `--auto` in discuss-phase.
184: 
185: **Text mode (`workflow.text_mode: true` or `--text` flag):** Use plain-text numbered lists instead of question TUI menus.
186: 
187: ## Step 5: (covered inline — ambiguity scoring is per-round)
188: 
189: ## Step 6: Generate SPEC.md
190: 
191: Use the SPEC.md template from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md.
192: 
193: **Requirements for every requirement entry:**
194: - One specific, testable statement
195: - Current state (what exists now)
196: - Target state (what it should become)
197: - Acceptance criterion (how to verify it was met)
198: 
199: **Vague requirements are rejected:**
200: - ✗ "The system should be fast"
201: - ✗ "Improve user experience"
202: - ✓ "API endpoint responds in < 200ms at p95 under 100 concurrent requests"
203: - ✓ "CLI command exits with code 1 and prints to stderr on invalid input"
204: 
205: **Count requirements.** The display in discuss-phase reads: "Found SPEC.md — {N} requirements locked."
206: 
207: **Boundaries must be explicit lists:**
208: - "In scope" — what this phase produces
209: - "Out of scope" — what it explicitly does NOT do (with brief reasoning)
210: 
211: **Acceptance criteria must be pass/fail checkboxes** — no "should feel good" or "looks reasonable."
212: 
213: **If any dimensions are below minimum**, mark them in the Ambiguity Report with: `⚠ Below minimum — planner must treat as assumption`.
214: 
215: Write to: `{phase_dir}/{padded_phase}-SPEC.md`
216: 
217: ## Step 7: Commit
218: 
219: ```bash
220: git add "${phase_dir}/${padded_phase}-SPEC.md"
221: git commit -m "spec(phase-${phase_number}): add SPEC.md for ${phase_name} — ${requirement_count} requirements (#2213)"
222: ```
223: 
224: If `commit_docs` is false: Skip commit. Note that SPEC.md was written but not committed.
225: 
226: ## Step 8: Wrap Up
227: 
228: Display:
229: 
230: ```
231: SPEC.md written — {N} requirements locked.
232: 
233:   Phase {X}: {name}
234:   Ambiguity: {final_score} (gate: ≤ 0.20)
235: 
236: Next: /gsd-discuss-phase {X}
237:   discuss-phase will detect SPEC.md and focus on implementation decisions only.
238: ```
239: 
240: </process>
241: 
242: <critical_rules>
243: - Every requirement MUST have current state, target state, and acceptance criterion
244: - Boundaries section is MANDATORY — cannot be empty
245: - "In scope" and "Out of scope" must be explicit lists, not narrative prose
246: - Acceptance criteria must be pass/fail — no subjective criteria
247: - SPEC.md is NEVER written if the user selects "Abandon"
248: - Do NOT ask about HOW to implement — that is discuss-phase territory
249: - Scout the codebase BEFORE the first question — grounded questions only
250: - Max 2–3 questions per round — do not frontload all questions at once
251: </critical_rules>
252: 
253: <success_criteria>
254: - Codebase scouted and current state understood before questioning
255: - All 4 dimensions scored after every round
256: - Gate passed OR user explicitly chose to write despite gaps
257: - SPEC.md contains only falsifiable requirements
258: - Boundaries are explicit (in scope / out of scope with reasoning)
259: - Acceptance criteria are pass/fail checkboxes
260: - SPEC.md committed atomically (when commit_docs is true)
261: - User directed to /gsd-discuss-phase as next step
262: </success_criteria>

(End of file - total 262 lines)
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

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md</path>
<type>file</type>
<content>
1: # Phase Spec Template
2: 
3: Template for `.planning/phases/XX-name/{phase_num}-SPEC.md` — locks requirements before discuss-phase.
4: 
5: **Purpose:** Capture WHAT a phase delivers and WHY, with enough precision that requirements are falsifiable. discuss-phase reads this file and focuses on HOW to implement (skipping "what/why" questions already answered here).
6: 
7: **Key principle:** Every requirement must be falsifiable — you can write a test or check that proves it was met or not. Vague requirements like "improve performance" are not allowed.
8: 
9: **Downstream consumers:**
10: - `discuss-phase` — reads SPEC.md at startup; treats Requirements, Boundaries, and Acceptance Criteria as locked; skips "what/why" questions
11: - `gsd-planner` — reads locked requirements to constrain plan scope
12: - `gsd-verifier` — uses acceptance criteria as explicit pass/fail checks
13: 
14: ---
15: 
16: ## File Template
17: 
18: ```markdown
19: # Phase [X]: [Name] — Specification
20: 
21: **Created:** [date]
22: **Ambiguity score:** [score] (gate: ≤ 0.20)
23: **Requirements:** [N] locked
24: 
25: ## Goal
26: 
27: [One precise sentence — specific and measurable. NOT "improve X" — instead "X changes from A to B".]
28: 
29: ## Background
30: 
31: [Current state from codebase — what exists today, what's broken or missing, what triggers this work. Grounded in code reality, not abstract description.]
32: 
33: ## Requirements
34: 
35: 1. **[Short label]**: [Specific, testable statement.]
36:    - Current: [what exists or does NOT exist today]
37:    - Target: [what it should become after this phase]
38:    - Acceptance: [concrete pass/fail check — how a verifier confirms this was met]
39: 
40: 2. **[Short label]**: [Specific, testable statement.]
41:    - Current: [what exists or does NOT exist today]
42:    - Target: [what it should become after this phase]
43:    - Acceptance: [concrete pass/fail check]
44: 
45: [Continue for all requirements. Each must have Current/Target/Acceptance.]
46: 
47: ## Boundaries
48: 
49: **In scope:**
50: - [Explicit list of what this phase produces]
51: - [Each item is a concrete deliverable or behavior]
52: 
53: **Out of scope:**
54: - [Explicit list of what this phase does NOT do] — [brief reason why it's excluded]
55: - [Adjacent problems excluded from this phase] — [brief reason]
56: 
57: ## Constraints
58: 
59: [Performance, compatibility, data volume, dependency, or platform constraints.
60: If none: "No additional constraints beyond standard project conventions."]
61: 
62: ## Acceptance Criteria
63: 
64: - [ ] [Pass/fail criterion — unambiguous, verifiable]
65: - [ ] [Pass/fail criterion]
66: - [ ] [Pass/fail criterion]
67: 
68: [Every acceptance criterion must be a checkbox that resolves to PASS or FAIL.
69: No "should feel good", "looks reasonable", or "generally works" — those are not checkboxes.]
70: 
71: ## Ambiguity Report
72: 
73: | Dimension          | Score | Min  | Status | Notes                              |
74: |--------------------|-------|------|--------|------------------------------------|
75: | Goal Clarity       |       | 0.75 |        |                                    |
76: | Boundary Clarity   |       | 0.70 |        |                                    |
77: | Constraint Clarity |       | 0.65 |        |                                    |
78: | Acceptance Criteria|       | 0.70 |        |                                    |
79: | **Ambiguity**      |       | ≤0.20|        |                                    |
80: 
81: Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)
82: 
83: ## Interview Log
84: 
85: [Key decisions made during the Socratic interview. Format: round → question → answer → decision locked.]
86: 
87: | Round | Perspective    | Question summary         | Decision locked                    |
88: |-------|----------------|-------------------------|------------------------------------|
89: | 1     | Researcher     | [what was asked]        | [what was decided]                 |
90: | 2     | Simplifier     | [what was asked]        | [what was decided]                 |
91: | 3     | Boundary Keeper| [what was asked]        | [what was decided]                 |
92: 
93: [If --auto mode: note "auto-selected" decisions with the reasoning the agent used.]
94: 
95: ---
96: 
97: *Phase: [XX-name]*
98: *Spec created: [date]*
99: *Next step: /gsd-discuss-phase [X] — implementation decisions (how to build what's specified above)*
100: ```
101: 
102: <good_examples>
103: 
104: **Example 1: Feature addition (Post Feed)**
105: 
106: ```markdown
107: # Phase 3: Post Feed — Specification
108: 
109: **Created:** 2025-01-20
110: **Ambiguity score:** 0.12
111: **Requirements:** 4 locked
112: 
113: ## Goal
114: 
115: Users can scroll through posts from accounts they follow, with new posts available after pull-to-refresh.
116: 
117: ## Background
118: 
119: The database has a `posts` table and `follows` table. No feed query or feed UI exists today. The home screen shows a placeholder "Your feed will appear here." This phase builds the feed query, API endpoint, and the feed list component.
120: 
121: ## Requirements
122: 
123: 1. **Feed query**: Returns posts from followed accounts ordered by creation time, descending.
124:    - Current: No feed query exists — `posts` table is queried directly only from profile pages
125:    - Target: `GET /api/feed` returns paginated posts from followed accounts, newest first, max 20 per page
126:    - Acceptance: Query returns correct posts for a user who follows 3 accounts with known post counts; cursor-based pagination advances correctly
127: 
128: 2. **Feed display**: Posts display in a scrollable card list.
129:    - Current: Home screen shows static placeholder text
130:    - Target: Home screen renders feed cards with author, timestamp, post content, and reaction count
131:    - Acceptance: Feed renders without error for 0 posts (empty state shown), 1 post, and 20+ posts
132: 
133: 3. **Pull-to-refresh**: User can refresh the feed manually.
134:    - Current: No refresh mechanism exists
135:    - Target: Pull-down gesture triggers refetch; new posts appear at top of list
136:    - Acceptance: After a new post is created in test, pull-to-refresh shows the new post without full app restart
137: 
138: 4. **New posts indicator**: When new posts arrive, a banner appears instead of auto-scrolling.
139:    - Current: No such mechanism
140:    - Target: "3 new posts" banner appears when refetch returns posts newer than the oldest visible post; tapping banner scrolls to top and shows new posts
141:    - Acceptance: Banner appears for ≥1 new post, does not appear when no new posts, tap navigates to top
142: 
143: ## Boundaries
144: 
145: **In scope:**
146: - Feed query (backend) — posts from followed accounts, paginated
147: - Feed list UI (frontend) — post cards with author, timestamp, content, reaction counts
148: - Pull-to-refresh gesture
149: - New posts indicator banner
150: - Empty state when user follows no one or no posts exist
151: 
152: **Out of scope:**
153: - Creating posts — that is Phase 4
154: - Reacting to posts — that is Phase 5
155: - Following/unfollowing accounts — that is Phase 2 (already done)
156: - Push notifications for new posts — separate backlog item
157: 
158: ## Constraints
159: 
160: - Feed query must use cursor-based pagination (not offset) — the database has 500K+ posts and offset pagination is unacceptably slow beyond page 3
161: - The feed card component must reuse the existing `<AvatarImage>` component from Phase 2
162: 
163: ## Acceptance Criteria
164: 
165: - [ ] `GET /api/feed` returns posts only from followed accounts (not all posts)
166: - [ ] `GET /api/feed` supports `cursor` parameter for pagination
167: - [ ] Feed renders correctly at 0, 1, and 20+ posts
168: - [ ] Pull-to-refresh triggers refetch
169: - [ ] New posts indicator appears when posts newer than current view exist
170: - [ ] Empty state renders when user follows no one
171: 
172: ## Ambiguity Report
173: 
174: | Dimension          | Score | Min  | Status | Notes                            |
175: |--------------------|-------|------|--------|----------------------------------|
176: | Goal Clarity       | 0.92  | 0.75 | ✓      |                                  |
177: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list       |
178: | Constraint Clarity | 0.80  | 0.65 | ✓      | Cursor pagination required       |
179: | Acceptance Criteria| 0.85  | 0.70 | ✓      | 6 pass/fail criteria             |
180: | **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                  |
181: 
182: ## Interview Log
183: 
184: | Round | Perspective     | Question summary              | Decision locked                         |
185: |-------|-----------------|------------------------------|-----------------------------------------|
186: | 1     | Researcher      | What exists in posts today?  | posts + follows tables exist, no feed  |
187: | 2     | Simplifier      | Minimum viable feed?         | Cards + pull-refresh, no auto-scroll   |
188: | 3     | Boundary Keeper | What's NOT this phase?       | Creating posts, reactions out of scope |
189: | 3     | Boundary Keeper | What does done look like?    | Scrollable feed with 4 card fields     |
190: 
191: ---
192: 
193: *Phase: 03-post-feed*
194: *Spec created: 2025-01-20*
195: *Next step: /gsd-discuss-phase 3 — implementation decisions (card layout, loading skeleton, etc.)*
196: ```
197: 
198: **Example 2: CLI tool (Database backup)**
199: 
200: ```markdown
201: # Phase 2: Backup Command — Specification
202: 
203: **Created:** 2025-01-20
204: **Ambiguity score:** 0.15
205: **Requirements:** 3 locked
206: 
207: ## Goal
208: 
209: A `gsd backup` CLI command creates a reproducible database snapshot that can be restored by `gsd restore` (a separate phase).
210: 
211: ## Background
212: 
213: No backup tooling exists. The project uses PostgreSQL. Developers currently use `pg_dump` manually — there is no standardized process, no output naming convention, and no CI integration. Three incidents in the last quarter involved restoring from wrong or corrupt dumps.
214: 
215: ## Requirements
216: 
217: 1. **Backup creation**: CLI command executes a full database backup.
218:    - Current: No `backup` subcommand exists in the CLI
219:    - Target: `gsd backup` connects to the database (via `DATABASE_URL` env or `--db` flag), runs pg_dump, writes output to `./backups/YYYY-MM-DD_HH-MM-SS.dump`
220:    - Acceptance: Running `gsd backup` on a test database creates a `.dump` file; running `pg_restore` on that file recreates the database without error
221: 
222: 2. **Network retry**: Transient network failures are retried automatically.
223:    - Current: pg_dump fails immediately on network error
224:    - Target: Backup retries up to 3 times with 5-second delay; 4th failure exits with code 1 and a message to stderr
225:    - Acceptance: Simulating 2 sequential network failures causes 2 retries then success; simulating 4 failures causes exit code 1 and stderr message
226: 
227: 3. **Partial cleanup**: Failed backups do not leave corrupt files.
228:    - Current: Manual pg_dump leaves partial files on failure
229:    - Target: If backup fails after starting, the partial `.dump` file is deleted before exit
230:    - Acceptance: After a simulated failure mid-dump, no `.dump` file exists in `./backups/`
231: 
232: ## Boundaries
233: 
234: **In scope:**
235: - `gsd backup` subcommand (full dump only)
236: - Output to `./backups/` directory (created if missing)
237: - Network retry (3 attempts)
238: - Partial file cleanup on failure
239: 
240: **Out of scope:**
241: - `gsd restore` — that is Phase 3
242: - Incremental backups — separate backlog item (full dump only for now)
243: - S3 or remote storage — separate backlog item
244: - Encryption — separate backlog item
245: - Scheduled/cron backups — separate backlog item
246: 
247: ## Constraints
248: 
249: - Must use `pg_dump` (not a custom query) — ensures compatibility with standard `pg_restore`
250: - `--no-retry` flag must be available for CI use (fail fast, no retries)
251: 
252: ## Acceptance Criteria
253: 
254: - [ ] `gsd backup` creates a `.dump` file in `./backups/YYYY-MM-DD_HH-MM-SS.dump` format
255: - [ ] `gsd backup` uses `DATABASE_URL` env var or `--db` flag for connection
256: - [ ] 3 retries on network failure, then exit code 1 with stderr message
257: - [ ] `--no-retry` flag skips retries and fails immediately on first error
258: - [ ] No partial `.dump` file left after a failed backup
259: 
260: ## Ambiguity Report
261: 
262: | Dimension          | Score | Min  | Status | Notes                          |
263: |--------------------|-------|------|--------|--------------------------------|
264: | Goal Clarity       | 0.90  | 0.75 | ✓      |                                |
265: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list     |
266: | Constraint Clarity | 0.75  | 0.65 | ✓      | pg_dump required               |
267: | Acceptance Criteria| 0.80  | 0.70 | ✓      | 5 pass/fail criteria           |
268: | **Ambiguity**      | 0.15  | ≤0.20| ✓      |                                |
269: 
270: ## Interview Log
271: 
272: | Round | Perspective     | Question summary              | Decision locked                         |
273: |-------|-----------------|------------------------------|-----------------------------------------|
274: | 1     | Researcher      | What backup tooling exists?  | None — pg_dump manual only             |
275: | 2     | Simplifier      | Minimum viable backup?       | Full dump only, local only             |
276: | 3     | Boundary Keeper | What's NOT this phase?       | Restore, S3, encryption excluded       |
277: | 4     | Failure Analyst | What goes wrong on failure?  | Partial files, CI fail-fast needed     |
278: 
279: ---
280: 
281: *Phase: 02-backup-command*
282: *Spec created: 2025-01-20*
283: *Next step: /gsd-discuss-phase 2 — implementation decisions (progress reporting, flag design, etc.)*
284: ```
285: 
286: </good_examples>
287: 
288: <guidelines>
289: **Every requirement needs all three fields:**
290: - Current: grounds the requirement in reality — what exists today?
291: - Target: the concrete change — not "improve X" but "X becomes Y"
292: - Acceptance: the falsifiable check — how does a verifier confirm this?
293: 
294: **Ambiguity Report must reflect the actual interview.** If a dimension is below minimum, mark it ⚠ — the planner knows to treat it as an assumption rather than a locked requirement.
295: 
296: **Interview Log is evidence of rigor.** Don't skip it. It shows that requirements came from discovery, not assumption.
297: 
298: **Boundaries protect the phase from scope creep.** The out-of-scope list with reasoning is as important as the in-scope list. Future phases that touch adjacent areas can point to this SPEC.md to understand what was intentionally excluded.
299: 
300: **SPEC.md is a one-way door for requirements.** discuss-phase will treat these as locked. If requirements change after SPEC.md is written, the user should update SPEC.md first, then re-run discuss-phase.
301: 
302: **SPEC.md does NOT replace CONTEXT.md.** They serve different purposes:
303: - SPEC.md: what the phase delivers (requirements, boundaries, acceptance criteria)
304: - CONTEXT.md: how the phase will be implemented (decisions, patterns, tradeoffs)
305: 
306: discuss-phase generates CONTEXT.md after reading SPEC.md.
307: </guidelines>

(End of file - total 307 lines)
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

</system-reminder>

### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-opencode-platform-reference"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-opencode-platform-reference
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-research-chain
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_O5cjcpFOS6eErOcAvwq67221"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/STACKS-REFERENCES.md"
}
```


### Tool: deepwiki_read_wiki_structure

**Input:**
```json
{
  "callID": "call_01_qVjZbI0xKPzR1dMX113i9062"
}
```


### Tool: context7_resolve-library-id

**Input:**
```json
{
  "callID": "call_00_I7GgoErqjGfbe2c5VBgX3573"
}
```


### Tool: context7_query-docs

**Input:**
```json
{
  "callID": "call_00_ngkNLz6AFRViBF6TyCoK9493"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_01_jSS9XAlhfjzNABBZjXxE1127"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_sEHagUheJ8Jp0qfvbusA0974"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_oDF6GqSg0U5BiIDX4pvS1759"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ha1Uz4DywUj4CFa4jMYG6211"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_L0BddRqXzzXTPs8V9lZS7740"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_nBzSEgpNgvD2DZ6V3tPD0132"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_gO5nTHINRchkdP9eas4C4947"
}
```


## USER (turn 5)

Route to the appropriate codebase-intelligence skill based on the user's intent.
`gsd-scan` and `gsd-intel` were folded into `gsd-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | gsd-map-codebase |
| Quick lightweight codebase scan | gsd-map-codebase --fast |
| Query mapped intelligence files | gsd-map-codebase --query |
| Generate a knowledge graph | gsd-graphify |
| Update project documentation | gsd-docs-update |
| Extract learnings from a completed phase | gsd-extract-learnings |

Invoke the matched skill directly using the Skill tool.

<do something with these 2 /Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/CONTEXT-2026-05-12.md, the next thing is to runing /gsd-discuss-phase execute-command tool to run it>

### Tool: execute-command

**Input:**
```json
{
  "callID": "call_00_YFlsov3MQ5VRAnXDxeCw8269"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Run discuss-phase for BOOT-09",
  "subagent_type": "hm-l1-coordinator",
  "task_id": "ses_1e72bf127ffetZXWIvLvJh6cMn"
}
```

**Output:** (pruned)
```
task_id: ses_1e72bf127ffetZXWIvLvJh6cMn
```


## USER (turn 6)

ARE THEY STILL FUCKING VALID WHY ARE THEY THERE WHERE YOU HAVE UNDERSTANDWRONGLY 

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_K8eCvDLYia5txrVbrnPD0822"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_HFHCkQK0adoPKMkPfJgU3591"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/AI-SPEC.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7TruyRO8FhVhOaIkprbW8333"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_D54Yyg8YmTUYJhjqcCB00821"
}
```


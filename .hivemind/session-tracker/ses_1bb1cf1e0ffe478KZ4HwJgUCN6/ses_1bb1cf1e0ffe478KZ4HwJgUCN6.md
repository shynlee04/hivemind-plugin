---
sessionID: ses_1bb1cf1e0ffe478KZ4HwJgUCN6
created: 2026-05-20T10:16:31.693Z
updated: 2026-05-20T10:16:31.693Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: idle
---

## USER (turn 1)

**source:** real-human

<objective>
Guide the user through MVP-mode planning for a phase. The command:

1. Prompts for an "As a / I want to / So that" user story (three structured questions)
2. Runs SPIDR splitting check — if the story is too large, walks through Spike/Paths/Interfaces/Data/Rules and offers to split into multiple phases
3. Writes `**Mode:** mvp` and the reformatted `**Goal:**` to the phase's ROADMAP.md section
4. Delegates to `/gsd plan-phase <N>` which auto-detects MVP mode via the roadmap field

Phase 1 of the vertical-mvp-slice PRD shipped the planner-side machinery; this command is the user entry point for it.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. Equivalent API.
</runtime_note>

<context>
Phase number: <context   Vì cơ cấu là /Users/apple/hivemind-plugin-private/.github/workflows/sync-oss.yml cho phép repo này https://github.com/shynlee04/hivemind-plugin/tree/oss-dev/src được đồng bộ hoá một phần các directories, subdirs và files phụ thuộc repo này - nhưng tình hình là có một số lỗi sau đây mà tôi muốn khắc phục cho cả logics sync lẫn làm cho tươm tất, hệ thống và tinh gọn lại ở repo private chính này để khi đưa logics workflow sync vào các cấu trúc và files được phép đồng bộ lên là phiên bản community public dev channel cho dự án này:

Vì thế tôi muốn thực hiện một số cấu trúc lại của dự án này bắt đầu từ việc quản lý các governance plane từ lúc user set up cho tới việc quản lý các assets ship cùng với nó như agents, skills, commands (hiện nó chưa được bố trí hợp lý lắm cũng như chưa đồng bộ hoá và khá bừa bộn và còn ở dạng file dot md và conflicts khá nhiều về philosophies của Hivemind và Opencode và cách quản lý các assets này sau khi install -  hiện nó đang ở các thư mục phụ trong đây và tôi thấy nó thật sự không đúng và chưa thật sự work  integrated  với nhau /Users/apple/hivemind-plugin-private/.hivefiver-meta-builder) ; các chức năng hiện có cũng chưa thật sự ăn nhập với nhau hãy tham khảo các nguồn và audit toàn diện để dọn dẹp cấu trúc lại trước khi ship MVP và thực hiện lại sync vào community repo ( repo này không bao gồm các documents và planning và các thư mục và files rác phải hoàn toàn sạch và đúng tiêu chuẩn)

Dưới đây là các nguồn nghiên cứu tham khảo ```**IMPORTANT HEAD-UP!**: 

- For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
- And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
- other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
    1. Context-managements categories:
        1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
    2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
        1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
        2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
    3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md` ```> (required — integer or decimal like `2.1`)

The phase must already exist in ROADMAP.md (created via `/gsd new-project`, `/gsd add-phase`, or `/gsd insert-phase`). This command does not create new phases — it converts an existing phase to MVP mode.
</context>

<process>
Execute the mvp-phase workflow from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md end-to-end.
Preserve all gates: phase existence, status guard (refuse in_progress/completed), user-story format validation, SPIDR splitting check, ROADMAP write confirmation, plan-phase delegation.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/mvp-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Guide the user through MVP-mode planning for a phase. Prompts for an "As a / I want to / So that" user story, runs SPIDR splitting check on the story, writes the result to ROADMAP.md, and delegates to `/gsd plan-phase` (which auto-detects MVP via the roadmap mode field shipped in PRD Phase 1).
3: </purpose>
4: 
5: <required_reading>
6: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md
7: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md
9: </required_reading>
10: 
11: <runtime_note>
12: **Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
13: 
14: **TEXT_MODE fallback:** Set TEXT_MODE=true if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is true. When TEXT_MODE is active, replace every question call with a plain-text numbered list and ask the user to type their choice number.
15: </runtime_note>
16: 
17: <process>
18: 
19: ## 1. Parse and validate phase argument
20: 
21: Extract the phase number from `$ARGUMENTS` (integer or decimal like `2.1`). Optional flag: `--force` (allow operating on `in_progress` / `completed` phases).
22: 
23: If no argument:
24: ```
25: ERROR: Phase number required
26: Usage: /gsd mvp-phase <phase-number>
27: Example: /gsd mvp-phase 1
28: Example: /gsd mvp-phase 2.1
29: ```
30: Exit.
31: 
32: Normalize per `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/phase-argument-parsing.md` (zero-pad integer phases to two digits).
33: 
34: ## 2. Validate phase exists and check status
35: 
36: ```bash
37: PHASE_INFO=$(gsd-sdk query roadmap.get-phase "${PHASE}")
38: PHASE_FOUND=$(echo "$PHASE_INFO" | jq -r '.found')
39: PHASE_NAME=$(echo "$PHASE_INFO" | jq -r '.phase_name')
40: PHASE_GOAL=$(echo "$PHASE_INFO" | jq -r '.goal')
41: PHASE_MODE=$(echo "$PHASE_INFO" | jq -r '.mode // ""')
42: PHASE_COMPLETE=$(echo "$PHASE_INFO" | jq -r '.roadmap_complete // false')
43: 
44: ANALYZE=$(gsd-sdk query roadmap.analyze)
45: if [[ "$ANALYZE" == @file:* ]]; then ANALYZE=$(cat "${ANALYZE#@file:}"); fi
46: DISK_STATUS=$(echo "$ANALYZE" | jq -r --arg p "$PHASE" '.phases[] | select((.phase_number|tostring)==$p) | .disk_status' | head -1)
47: if [[ "$DISK_STATUS" == "complete" || "$PHASE_COMPLETE" == "true" ]]; then
48:   STATUS="completed"
49: elif [[ "$DISK_STATUS" == "planned" || "$DISK_STATUS" == "partial" ]]; then
50:   STATUS="in_progress"
51: else
52:   STATUS="not_started"
53: fi
54: ```
55: 
56: If `PHASE_FOUND` is `false`: error and exit. Suggest `/gsd add-phase` or `/gsd insert-phase` to create the phase first.
57: 
58: **Status guard.** If the phase is `in_progress` (has plans but not complete) or `completed`, refuse unless `--force` is in `$ARGUMENTS`:
59: 
60: ```text
61: ERROR: Phase ${PHASE} is currently ${STATUS}.
62: Converting an active or completed phase to MVP mode mid-flight will
63: invalidate any existing plans and summaries.
64: 
65: To proceed anyway: /gsd mvp-phase ${PHASE} --force
66: ```
67: 
68: **Already-MVP guard.** If `PHASE_MODE` is already `mvp`, surface this and ask whether to re-prompt the user story or abort:
69: 
70: > "Phase ${PHASE} is already in MVP mode with goal: «${PHASE_GOAL}». Re-run user-story prompts and SPIDR check?"
71: 
72: Use `question` with options [Re-prompt / Abort]. On Abort, exit cleanly. On Re-prompt, proceed.
73: 
74: ## 3. User story prompts
75: 
76: Run three sequential `question` calls. Each is free-text. After all three, assemble into the canonical sentence per `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md`:
77: 
78: **Prompt 1 — As a:**
79: > "As a [user role]?"
80: > (Examples: "new user", "admin", "signed-in customer", "API consumer")
81: 
82: **Prompt 2 — I want to:**
83: > "I want to [capability]?"
84: > (Examples: "register and log in", "upload a CSV", "see my dashboard")
85: 
86: **Prompt 3 — So that:**
87: > "So that [outcome]?"
88: > (Examples: "I can access my account", "I can bulk-import contacts", "I can see at a glance what needs attention")
89: 
90: Assemble:
91: 
92: ```
93: USER_STORY="As a ${ROLE}, I want to ${CAPABILITY}, so that ${OUTCOME}."
94: ```
95: 
96: If any of the three answers is empty or whitespace-only, error and re-prompt that single field. Do NOT proceed with a partial story.
97: 
98: **Validate via the centralized User Story validator.** The verb owns the canonical regex `/^As a .+, I want to .+, so that .+\.$/` and surfaces per-error guidance:
99: 
100: ```bash
101: USER_STORY_RESULT=$(gsd-sdk query user-story.validate --story "$USER_STORY")
102: if [ "$(echo "$USER_STORY_RESULT" | jq -r '.valid')" != "true" ]; then
103:   echo "$USER_STORY_RESULT" | jq -r '.errors[]' >&2
104:   # Re-prompt the offending field(s) per surfaced errors, then re-run validation.
105:   # Do not abort the workflow on first invalid draft.
106:   RE_PROMPT_USER_STORY=true
107: fi
108: ```
109: 
110: This guarantees the goal stored in ROADMAP.md will satisfy the same guard the verifier applies later.
111: If `RE_PROMPT_USER_STORY=true`, re-run only the offending prompt field(s), rebuild `USER_STORY`, and validate again before continuing.
112: 
113: ## 4. SPIDR splitting check
114: 
115: Run the SPIDR rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md`. Briefly:
116: 
117: **Trigger evaluation.** Check the assembled `USER_STORY` against the four size signals from the reference (compound capabilities, multi-actor, length > 120 chars, vague capability). If none fire, **skip SPIDR** entirely — go to step 5.
118: 
119: **If SPIDR triggers.**
120: 
121: a) Restate the story to the user:
122: 
123: > "Your story: «${USER_STORY}»
124: >
125: > This story has [signal description, e.g., 'two compound capabilities joined by and']. Splitting it into multiple phases will produce a cleaner Walking Skeleton and reduce the risk of mid-phase scope creep.
126: >
127: > Want to walk through SPIDR splitting?"
128: 
129: Use `question` with options [Yes, walk through SPIDR / No, proceed with the story as-is].
130: 
131: If "No": skip SPIDR, go to step 5.
132: 
133: If "Yes": continue to (b).
134: 
135: b) Ask which SPIDR axis fits best:
136: 
137: > "Which axis best fits how to split this story?"
138: 
139: Use `question` with the five options from `spidr-splitting.md` (Spike / Paths / Interfaces / Data / Rules). Each option includes its targeted question as the description so the user can pick by understanding what each axis means.
140: 
141: c) Walk through the chosen axis with **one** targeted question (not all five). For example, if the user picked "Paths":
142: 
143: > "Does this feature have a happy path and one or more error/edge paths?"
144: 
145: Free-text response. Workflow parses to identify the split.
146: 
147: d) Produce a split proposal. Example:
148: 
149: > "Proposed split (Paths axis):
150: > - **Phase ${PHASE} (this one):** Happy path — ${HAPPY_STORY}
151: > - **Phase ${PHASE+1} (new):** Edge case — ${EDGE_STORY}
152: >
153: > Accept this split?"
154: 
155: Use `question` [Accept / Modify / Reject].
156: 
157: - **Accept**: `USER_STORY` becomes the first split's story (`${HAPPY_STORY}` in the example). Surface the remaining splits as a list of `/gsd add-phase` invocations the user can run after this command completes — do NOT auto-create the new phases (preserve user control over numbering).
158: - **Modify**: re-prompt the splits one more time, then accept or reject.
159: - **Reject**: revert `USER_STORY` to the original, proceed without splitting.
160: 
161: ## 5. Update ROADMAP.md
162: 
163: Read `ROADMAP.md`. Find the section for `Phase ${PHASE}`. Apply two edits:
164: 
165: **Edit 1 — Update Goal line.**
166: 
167: Find: `**Goal:** ${OLD_GOAL_TEXT}`
168: Replace with: `**Goal:** ${USER_STORY}`
169: 
170: **Edit 2 — Insert Mode line.**
171: 
172: If `**Mode:**` already exists in the section (replacing or re-running), update it to `**Mode:** mvp`.
173: If `**Mode:**` does not exist, insert `**Mode:** mvp` on the line immediately after `**Goal:**`.
174: 
175: Show the user a unified diff (lines being changed) and ask:
176: 
177: > "Apply these changes to ROADMAP.md?"
178: 
179: Use `question` [Apply / Cancel]. On Cancel, exit without writing.
180: 
181: On Apply, write the updated `ROADMAP.md` atomically (read-edit-write).
182: 
183: ## 6. Verify the write
184: 
185: ```bash
186: NEW_MODE=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick mode)
187: NEW_GOAL=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick goal)
188: ```
189: 
190: Assert:
191: - `NEW_MODE` equals `mvp`
192: - `NEW_GOAL` equals the assembled user story
193: 
194: If either assertion fails, surface the discrepancy to the user and exit. Do not proceed to plan-phase delegation with a half-applied write.
195: 
196: ## 7. Delegate to /gsd plan-phase
197: 
198: Invoke `/gsd plan-phase ${PHASE}` (no flags). Phase 1's MVP_MODE resolution chain (CLI flag → roadmap mode → config → false) will detect the new `**Mode:** mvp` line and run plan-phase in vertical-slice mode automatically.
199: 
200: The Walking Skeleton gate (also from Phase 1) will fire automatically if `${PHASE} == "01"` and there are zero prior phase summaries.
201: 
202: ## 8. Surface deferred phase splits (if any)
203: 
204: If SPIDR produced a split in step 4, append a final user-facing message:
205: 
206: > "**SPIDR split deferred phases.**
207: >
208: > Your original story was split. The first slice is now planned via plan-phase.
209: > To create the remaining slice(s) as new phases, run:
210: >
211: > - `/gsd add-phase` — for the next slice: «${SPLIT_2_STORY}»
212: > - `/gsd add-phase` — for the next slice: «${SPLIT_3_STORY}»
213: >
214: > Each will be added to the end of the current milestone. You can then run
215: > `/gsd mvp-phase <new-phase-number>` on each to plan them as MVP slices."
216: 
217: ## 9. Exit
218: 
219: Workflow ends. The phase is now in MVP mode with a planned PLAN.md, optionally with deferred follow-up phases surfaced for the user.
220: 
221: </process>

(End of file - total 221 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/spidr-splitting.md</path>
<type>file</type>
<content>
1: # SPIDR Story Splitting Rules
2: 
3: > Used by `mvp-phase` workflow when the user-supplied story is too large for a single phase. Per PRD decision Q3, SPIDR runs as a **full interactive flow** — not a lightweight check.
4: 
5: ## When SPIDR triggers
6: 
7: Trigger SPIDR splitting if **any** of these size signals fire on the user story:
8: 
9: 1. **Compound capabilities.** The story names two or more independent user actions joined by "and" (e.g., "register **and** log in **and** reset their password"). Each "and" is a candidate split point.
10: 2. **Multi-actor.** The story names more than one `[user role]` (e.g., "As a user or admin..."). Each role is a candidate split.
11: 3. **Length.** The assembled story exceeds ~120 chars on a single line.
12: 4. **Vague capability.** The capability is a noun phrase, not a verb-noun pair (e.g., "I want to use the dashboard" — needs to specify *which interaction* with the dashboard).
13: 
14: If none of these fire, skip SPIDR entirely and proceed to ROADMAP write.
15: 
16: ## The five SPIDR axes
17: 
18: For each axis, ask one targeted question. The user picks the axis that best fits their story; only one axis is applied per split.
19: 
20: ### Spike
21: 
22: > "Is there an unknown that needs research before this can be implemented? If so, the spike is its own phase."
23: 
24: If yes: split out a research phase (no acceptance criteria except "we know enough to plan the rest"). The remaining story becomes a follow-up phase.
25: 
26: ### Paths
27: 
28: > "Does this feature have a happy path and one or more error/edge paths?"
29: 
30: If yes: split happy path into the first phase, edge paths into follow-ups. Order: happy path first (it proves the slice works), then progressively edge cases.
31: 
32: ### Interfaces
33: 
34: > "Does this feature need to work on more than one interface (web, mobile, API, CLI)?"
35: 
36: If yes: split by interface. Web first if user-facing; API first if integration-driven; mobile last unless it's the primary platform.
37: 
38: ### Data
39: 
40: > "Does this feature touch multiple data scopes (one user vs. many, single team vs. multi-tenant, small CSV vs. large dataset)?"
41: 
42: If yes: split by scope. Smallest scope first (one user, single team, small data), then expand.
43: 
44: ### Rules
45: 
46: > "Does this feature have multiple business rules that could be added incrementally (basic validation first, then complex policy)?"
47: 
48: If yes: split by rule complexity. Minimum viable rules first; complex policy in follow-ups.
49: 
50: ## Workflow
51: 
52: When SPIDR triggers, the workflow:
53: 
54: 1. Restates the user-supplied story.
55: 2. Asks "Which SPIDR axis fits best?" with the five options above.
56: 3. Walks through the chosen axis interactively (one focused question), produces a split proposal: "Phase N (this one): X. Phase N+1: Y. Phase N+2: Z."
57: 4. Confirms the split with the user.
58: 5. On accept: writes the FIRST phase's story to the current ROADMAP entry; defers creating new phases for the splits to a follow-up step (the workflow surfaces a list of `/gsd add-phase` invocations the user can run after `mvp-phase` completes — but does not run them automatically, to preserve user control over phase numbering).
59: 6. On reject: proceeds with the original story unchanged.
60: 
61: ## Anti-patterns to reject
62: 
63: - **Splitting by technical layer.** "Phase 1: schema. Phase 2: API. Phase 3: UI." That's horizontal planning. Reject.
64: - **Pre-splitting before the user even sees the original.** Always show the user-supplied story first; only offer split if it triggers a size signal.
65: - **Splitting more than one axis at once.** SPIDR is one axis per split. If a story needs splitting on two axes (e.g., paths AND data), do paths first, then re-evaluate the resulting smaller stories.
66: 
67: ## Reference
68: 
69: See [Mike Cohn — Five Simple But Powerful Ways to Split User Stories](https://www.mountaingoatsoftware.com/blog/five-simple-but-powerful-ways-to-split-user-stories).

(End of file - total 69 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/user-story-template.md</path>
<type>file</type>
<content>
1: # User Story Template (MVP Mode)
2: 
3: > Used by `mvp-phase` workflow and `gsd-planner` agent when `MVP_MODE=true`. Defines the canonical "As a / I want to / So that" format and the rules for converting it into the `**Goal:**` line in ROADMAP.md.
4: 
5: ## Canonical format
6: 
7: ```
8: As a [user role], I want to [capability], so that [outcome].
9: ```
10: 
11: Three required components:
12: 
13: | Slot | Question | Examples |
14: |---|---|---|
15: | `[user role]` | Who is the actor? | "new user", "admin", "signed-in customer", "API consumer" |
16: | `[capability]` | What can they do? | "register and log in", "upload a CSV", "see my dashboard" |
17: | `[outcome]` | Why does it matter? | "I can access my account", "I can bulk-import contacts", "I can see at a glance what needs attention" |
18: 
19: All three must be present. Refuse to assemble a partial story.
20: 
21: ## How it lands in ROADMAP.md
22: 
23: The full user story replaces the existing `**Goal:**` line in the phase section:
24: 
25: **Before:**
26: ```
27: ### Phase 1: User Auth MVP
28: **Goal:** Users can register and log in
29: ```
30: 
31: **After:**
32: ```
33: ### Phase 1: User Auth MVP
34: **Goal:** As a new user, I want to register and log in, so that I can access my dashboard.
35: **Mode:** mvp
36: ```
37: 
38: Two structural rules:
39: 1. The `**Goal:**` line stays on a single line (no line breaks inside the story). If the story is longer than ~120 chars, it should be split into multiple phases via SPIDR (see `spidr-splitting.md`).
40: 2. The `**Mode:** mvp` line is added immediately below `**Goal:**`. If `**Mode:**` already exists, it is replaced (not duplicated).
41: 
42: ## How it lands in PLAN.md
43: 
44: The `gsd-planner` agent (with MVP_MODE=true) emits the user story as the first content under the phase header in `PLAN.md`:
45: 
46: ```markdown
47: ## Phase Goal
48: 
49: **As a** new user, **I want to** register and log in, **so that** I can access my dashboard.
50: 
51: ## Acceptance Criteria
52: - [ ] ...
53: 
54: ## MVP Slice Tasks
55: ...
56: ```
57: 
58: Note the bold-keyword formatting (`**As a**`, `**I want to**`, `**so that**`) is for the PLAN.md emit only. The ROADMAP.md `**Goal:**` line uses prose form (the keywords are not bolded inside the goal line, since the goal is itself a single bolded label).

(End of file - total 58 lines)
</content>

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


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_00_lSVvEr7nwwH7cKxzpb523547"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_HdUqx8BMNCufuojrVBmU6660"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Investigate sync workflow mechanics",
  "subagent_type": "general",
  "task_id": "ses_1bb1c339fffeNoUb9ZlQkYV43Q"
}
```

**Output:** (pruned)
```
task_id: ses_1bb1c339fffeNoUb9ZlQkYV43Q
```


### Tool: task

**Input:**
```json
{
  "description": "Investigate meta-builder structure",
  "subagent_type": "general",
  "task_id": "ses_1bb1c2656ffegCFJcD7dl2eVQv"
}
```

**Output:** (pruned)
```
task_id: ses_1bb1c2656ffegCFJcD7dl2eVQv
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_gwTY0Y0zMQLYzcHEAk4y1732"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Audit root debris and governance",
  "subagent_type": "general",
  "task_id": "ses_1bb1a2c58ffe374YdDcRvjJAlW"
}
```

**Output:** (pruned)
```
task_id: ses_1bb1a2c58ffe374YdDcRvjJAlW
```


### Tool: task

**Input:**
```json
{
  "description": "Check community repo details",
  "subagent_type": "general",
  "task_id": "ses_1bb1a217fffezjlVbqs3W44iOT"
}
```

**Output:** (pruned)
```
task_id: ses_1bb1a217fffezjlVbqs3W44iOT
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_nC1Xs83D9RKnX7VGVLsd6516"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_17z25Lp8UZYo8BvTRsnY3127"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_6QtqV9nyv7vsHH9umKHT1689"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_POWqEl5joCgSQFNatm1Z1577"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 1 root debris cleanup",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1bb14bc33ffegNzLeFoto0EjHl"
}
```

**Output:** (pruned)
```
task_id: ses_1bb14bc33ffegNzLeFoto0EjHl
```


## USER (turn 2)

**source:** real-human

ngừng đi plan và khai thác từng cụm gsd add phase trước

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_Ow62MuNgNMMCQb5RSk4j6291"
}
```


## USER (turn 3)

**source:** real-human

<objective>
Add a new integer phase to the end of the current milestone in the roadmap.

Routes to the add-phase workflow which handles:
- Phase number calculation (next sequential integer)
- Directory creation with slug generation
- Roadmap structure updates
- STATE.md roadmap evolution tracking
</objective>

<execution_context>
@~/.Codex/get-shit-done/workflows/add-phase.md
</execution_context>

<context>
Arguments: Phase 1: Root debris & broken symlinks cleanup (phase description)

Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls.
</context>

<process>
**Follow the add-phase workflow** from `@~/.Codex/get-shit-done/workflows/add-phase.md`.

The workflow handles all logic including:
1. Argument parsing and validation
2. Roadmap existence checking
3. Current milestone identification
4. Next phase number calculation (ignoring decimals)
5. Slug generation from description
6. Phase directory creation
7. Roadmap entry insertion
8. STATE.md updates
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/.Codex/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/.Codex/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `$gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `$gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: $gsd-add-phase <description>
22: Example: $gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run $gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `$gsd-plan-phase {N}`
91: 
92: ---
93: 
94: **Also available:**
95: - `$gsd-add-phase <description>` — add another phase
96: - Review roadmap
97: 
98: ---
99: ```
100: </step>
101: 
102: </process>
103: 
104: <success_criteria>
105: - [ ] `gsd-sdk query phase.add` executed successfully
106: - [ ] Phase directory created
107: - [ ] Roadmap updated with new phase entry
108: - [ ] STATE.md updated with roadmap evolution note
109: - [ ] User informed of next steps
110: </success_criteria>

(End of file - total 110 lines)
</content>

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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_VKJXF3gA7VKLOFPGc4i07141"
}
```


## USER (turn 4)

**source:** real-human

<objective>
Add a new integer phase to the end of the current milestone in the roadmap.

Routes to the add-phase workflow which handles:
- Phase number calculation (next sequential integer)
- Directory creation with slug generation
- Roadmap structure updates
- STATE.md roadmap evolution tracking
</objective>

<execution_context>
@~/.Codex/get-shit-done/workflows/add-phase.md
</execution_context>

<context>
Arguments: Root debris, broken symlinks, duplicate commands cleanup (phase description)

Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls.
</context>

<process>
**Follow the add-phase workflow** from `@~/.Codex/get-shit-done/workflows/add-phase.md`.

The workflow handles all logic including:
1. Argument parsing and validation
2. Roadmap existence checking
3. Current milestone identification
4. Next phase number calculation (ignoring decimals)
5. Slug generation from description
6. Phase directory creation
7. Roadmap entry insertion
8. STATE.md updates
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/.Codex/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/.Codex/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `$gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `$gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: $gsd-add-phase <description>
22: Example: $gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run $gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `$gsd-plan-phase {N}`
91: 
92: ---
93: 
94: **Also available:**
95: - `$gsd-add-phase <description>` — add another phase
96: - Review roadmap
97: 
98: ---
99: ```
100: </step>
101: 
102: </process>
103: 
104: <success_criteria>
105: - [ ] `gsd-sdk query phase.add` executed successfully
106: - [ ] Phase directory created
107: - [ ] Roadmap updated with new phase entry
108: - [ ] STATE.md updated with roadmap evolution note
109: - [ ] User informed of next steps
110: </success_criteria>

(End of file - total 110 lines)
</content>

## USER (turn 5)

**source:** real-human

assumption có đúng hay không

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zZzRe3cH3MJcqZGQDUwj0403"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_H4YSwC2jVP0znc1Bg3kx0841"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yq9SVuhatK1gmsMYil9x5423"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_xHGcgwomqBKMjegRJMqQ6026"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_y88sYm817XK5Q2L7pjOX6361"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_mJwCawuOHMKnsThfZ4Jj0192"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_3mKE5gPgXmCeKiRqVwb07428"
}
```


### Tool: hivemind-command-engine

**Input:**
```json
{
  "callID": "call_00_a56o04Lp1HNf8M9HFyXt2217"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_hQ0Btu6rT7STlbm8Nd8n2718"
}
```


## USER (turn 6)

**source:** real-human

<objective>
Manage phases in ROADMAP.md with a single consolidated command.

Mode routing:
- **default** (no flag): Add a new integer phase to the end of the current milestone → add-phase workflow
- **--insert**: Insert urgent work as a decimal phase (e.g., 72.1) between existing phases → insert-phase workflow
- **--remove**: Remove a future phase and renumber subsequent phases → remove-phase workflow
- **--edit**: Edit any field of an existing phase in place → edit-phase workflow
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Add new integer phase at end of milestone | add-phase |
| --insert | Insert decimal phase (e.g., 72.1) after specified phase | insert-phase |
| --remove | Remove future phase, renumber subsequent | remove-phase |
| --edit | Edit fields of existing phase in place | edit-phase |

</routing>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
</execution_context>

<context>
Arguments: add "Root debris, broken symlinks, duplicate commands cleanup"

Parse the first token of add "Root debris, broken symlinks, duplicate commands cleanup":
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of add "Root debris, broken symlinks, duplicate commands cleanup" (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from add "Root debris, broken symlinks, duplicate commands cleanup".
2. Load and execute the appropriate workflow end-to-end based on the routing table above.
3. Preserve all validation gates from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `/gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `/gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: /gsd-add-phase <description>
22: Example: /gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run /gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `/clear` then:
91: 
92: `/gsd-plan-phase {N}`
93: 
94: ---
95: 
96: **Also available:**
97: - `/gsd-add-phase <description>` — add another phase
98: - Review roadmap
99: 
100: ---
101: ```
102: </step>
103: 
104: </process>
105: 
106: <success_criteria>
107: - [ ] `gsd-sdk query phase.add` executed successfully
108: - [ ] Phase directory created
109: - [ ] Roadmap updated with new phase entry
110: - [ ] STATE.md updated with roadmap evolution note
111: - [ ] User informed of next steps
112: </success_criteria>

(End of file - total 112 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: integer phase number to insert after
14: - Remaining arguments: phase description
15: 
16: Example: `/gsd-insert-phase 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: /gsd-insert-phase <after> <description>
25: Example: /gsd-insert-phase 72 Fix critical auth bug
26: ```
27: 
28: Exit.
29: 
30: Validate first argument is an integer.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${after_phase}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: ```
45: Exit.
46: </step>
47: 
48: <step name="insert_phase">
49: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
50: 
51: ```bash
52: RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
53: ```
54: 
55: The CLI handles:
56: - Verifying target phase exists in ROADMAP.md
57: - Calculating next decimal phase number (checking existing decimals on disk)
58: - Generating slug from description
59: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
60: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
61: 
62: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
63: </step>
64: 
65: <step name="update_project_state">
66: Update STATE.md to reflect the inserted phase via SDK handlers (never raw
67: `Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
68: blocks direct STATE.md writes):
69: 
70: 1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
71:    `{decimal_phase}`:
72: 
73:    ```bash
74:    gsd-sdk query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd-plan-phase {decimal_phase}"}'
75:    ```
76: 
77:    (Adjust field names to whatever pointers STATE.md exposes — the handler
78:    reports which fields it matched.)
79: 
80: 2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
81:    `### Roadmap Evolution` subsection under `## Accumulated Context` if missing
82:    and dedupes identical entries:
83: 
84:    ```bash
85:    gsd-sdk query state.add-roadmap-evolution \
86:      --phase {decimal_phase} \
87:      --action inserted \
88:      --after {after_phase} \
89:      --note "{description}" \
90:      --urgent
91:    ```
92: 
93:    Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
94:    (or `{ added: false, reason: "duplicate", entry: ... }` on replay).
95: </step>
96: 
97: <step name="completion">
98: Present completion summary:
99: 
100: ```
101: Phase {decimal_phase} inserted after Phase {after_phase}:
102: - Description: {description}
103: - Directory: .planning/phases/{decimal-phase}-{slug}/
104: - Status: Not planned yet
105: - Marker: (INSERTED) - indicates urgent work
106: 
107: Roadmap updated: .planning/ROADMAP.md
108: Project state updated: .planning/STATE.md
109: 
110: ---
111: 
112: ## Next Up
113: 
114: **Phase {decimal_phase}: {description}** -- urgent insertion
115: 
116: `/clear` then:
117: 
118: `/gsd-plan-phase {decimal_phase}`
119: 
120: ---
121: 
122: **Also available:**
123: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
124: - Review roadmap
125: 
126: ---
127: ```
128: </step>
129: 
130: </process>
131: 
132: <anti_patterns>
133: 
134: - Don't use this for planned work at end of milestone (use /gsd-add-phase)
135: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
136: - Don't renumber existing phases
137: - Don't modify the target phase content
138: - Don't create plans yet (that's /gsd-plan-phase)
139: - Don't commit changes (user decides when to commit)
140: </anti_patterns>
141: 
142: <success_criteria>
143: Phase insertion is complete when:
144: 
145: - [ ] `gsd-sdk query phase.insert` executed successfully
146: - [ ] Phase directory created
147: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
148: - [ ] `gsd-sdk query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
149: - [ ] `gsd-sdk query state.patch` returned matched next-phase pointer field(s)
150: - [ ] User informed of next steps and dependency implications
151: </success_criteria>

(End of file - total 151 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Remove an unstarted future phase from the project roadmap, delete its directory, renumber all subsequent phases to maintain a clean linear sequence, and commit the change. The git commit serves as the historical record of removal.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - Argument is the phase number to remove (integer or decimal)
14: - Example: `/gsd-remove-phase 17` → phase = 17
15: - Example: `/gsd-remove-phase 16.1` → phase = 16.1
16: 
17: If no argument provided:
18: 
19: ```
20: ERROR: Phase number required
21: Usage: /gsd-remove-phase <phase-number>
22: Example: /gsd-remove-phase 17
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "${target}")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.
37: 
38: Also read STATE.md and ROADMAP.md content for parsing current position.
39: </step>
40: 
41: <step name="validate_future_phase">
42: Verify the phase is a future phase (not started):
43: 
44: 1. Compare target phase to current phase from STATE.md
45: 2. Target must be > current phase number
46: 
47: If target <= current phase:
48: 
49: ```
50: ERROR: Cannot remove Phase {target}
51: 
52: Only future phases can be removed:
53: - Current phase: {current}
54: - Phase {target} is current or completed
55: 
56: To abandon current work, use /gsd-pause-work instead.
57: ```
58: 
59: Exit.
60: </step>
61: 
62: <step name="confirm_removal">
63: Present removal summary and confirm:
64: 
65: ```
66: Removing Phase {target}: {Name}
67: 
68: This will:
69: - Delete: .planning/phases/{target}-{slug}/
70: - Renumber all subsequent phases
71: - Update: ROADMAP.md, STATE.md
72: 
73: Proceed? (y/n)
74: ```
75: 
76: Wait for confirmation.
77: </step>
78: 
79: <step name="execute_removal">
80: **Delegate the entire removal operation to `gsd-sdk query phase.remove`:**
81: 
82: ```bash
83: RESULT=$(gsd-sdk query phase.remove "${target}")
84: ```
85: 
86: If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:
87: 
88: ```bash
89: RESULT=$(gsd-sdk query phase.remove "${target}" --force)
90: ```
91: 
92: The CLI handles:
93: - Deleting the phase directory
94: - Renumbering all subsequent directories (in reverse order to avoid conflicts)
95: - Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
96: - Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
97: - Updating STATE.md (decrementing phase count)
98: 
99: Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
100: </step>
101: 
102: <step name="commit">
103: Stage and commit the removal:
104: 
105: ```bash
106: gsd-sdk query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
107: ```
108: 
109: The commit message preserves the historical record of what was removed.
110: </step>
111: 
112: <step name="completion">
113: Present completion summary:
114: 
115: ```
116: Phase {target} ({original-name}) removed.
117: 
118: Changes:
119: - Deleted: .planning/phases/{target}-{slug}/
120: - Renumbered: {N} directories and {M} files
121: - Updated: ROADMAP.md, STATE.md
122: - Committed: chore: remove phase {target} ({original-name})
123: 
124: ---
125: 
126: ## What's Next
127: 
128: Would you like to:
129: - `/gsd-progress` — see updated roadmap status
130: - Continue with current phase
131: - Review roadmap
132: 
133: ---
134: ```
135: </step>
136: 
137: </process>
138: 
139: <anti_patterns>
140: 
141: - Don't remove completed phases (have SUMMARY.md files) without --force
142: - Don't remove current or past phases
143: - Don't manually renumber — use `gsd-sdk query phase.remove` which handles all renumbering
144: - Don't add "removed phase" notes to STATE.md — git commit is the record
145: - Don't modify completed phase directories
146: </anti_patterns>
147: 
148: <success_criteria>
149: Phase removal is complete when:
150: 
151: - [ ] Target phase validated as future/unstarted
152: - [ ] `gsd-sdk query phase.remove` executed successfully
153: - [ ] Changes committed with descriptive message
154: - [ ] User informed of changes
155: </success_criteria>

(End of file - total 155 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Edit any field of an existing phase in ROADMAP.md in place. The phase number and position are always preserved. Guarded against in-progress and completed phases unless --force is passed. Validates depends_on references before writing. Shows a diff and requests confirmation before writing.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: phase number to edit (integer or decimal)
14: - Optional flag: --force (allow editing in_progress/completed phases)
15: 
16: Examples:
17:   `/gsd-edit-phase 5`       → phase = 5, force = false
18:   `/gsd-edit-phase 5 --force` → phase = 5, force = true
19:   `/gsd-edit-phase 12.1`    → phase = 12.1, force = false
20: 
21: If no argument provided:
22: 
23: ```
24: ERROR: Phase number required
25: Usage: /gsd-edit-phase <phase-number> [--force]
26: Example: /gsd-edit-phase 5
27: Example: /gsd-edit-phase 5 --force
28: ```
29: 
30: Exit.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${target}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: Run /gsd-new-project to initialize.
45: ```
46: Exit.
47: </step>
48: 
49: <step name="load_phase">
50: Read the current phase section from ROADMAP.md:
51: 
52: ```bash
53: PHASE_DATA=$(gsd-sdk query roadmap get-phase "${target}")
54: ```
55: 
56: Parse the JSON result. If `found` is false:
57: 
58: ```
59: ERROR: Phase {target} not found in ROADMAP.md
60: 
61: Available phases can be seen with /gsd-progress.
62: ```
63: 
64: Exit.
65: 
66: Extract from the result:
67: - `phase_name` — the phase title
68: - `goal` — the phase goal/description
69: - `success_criteria` — array of criteria
70: - `section` — full raw section text (preserves depends_on, requirements, plans, etc.)
71: 
72: Also parse the full section text to extract additional fields not in the SDK result:
73: - `depends_on` — from `**Depends on:** ...` or `**Depends on**: ...` line
74: - `requirements` — from `**Requirements:** ...` block if present
75: </step>
76: 
77: <step name="check_phase_status">
78: Determine the phase status from disk. Compare against STATE.md current phase:
79: 
80: ```bash
81: ANALYZE=$(gsd-sdk query roadmap analyze)
82: ```
83: 
84: Find the phase entry in the `phases` array. Extract `disk_status`.
85: 
86: Map disk_status to a user-friendly status:
87: - `complete` → status = `completed`
88: - `planned` or `partial` → status = `in_progress`
89: - `empty`, `no_directory`, `discussed`, `researched` → status = `future`
90: 
91: If status is `in_progress` or `completed` AND `--force` was NOT passed:
92: 
93: ```
94: ERROR: Cannot edit Phase {target} — status is {status}
95: 
96: Editing an in-progress or completed phase may invalidate executed plans.
97: 
98: To edit anyway, run:
99:   /gsd-edit-phase {target} --force
100: ```
101: 
102: Exit.
103: 
104: If `--force` was passed and status is `in_progress` or `completed`, continue with a warning printed to the user:
105: 
106: ```
107: WARNING: Editing Phase {target} which is {status}. Proceeding due to --force.
108: ```
109: </step>
110: 
111: <step name="present_current_values">
112: Display the current phase fields clearly:
113: 
114: ```
115: Current values for Phase {target}: {phase_name}
116: 
117: Title:            {phase_name}
118: Goal:             {goal}
119: Depends on:       {depends_on or "(none)"}
120: Requirements:     {requirements or "(none)"}
121: Success Criteria:
122:   1. {criterion_1}
123:   2. {criterion_2}
124:   ...
125: ```
126: 
127: Then ask the user what they want to change:
128: 
129: ```
130: What would you like to do?
131: 
132:   [1] Edit specific fields (title, goal, depends_on, requirements, success_criteria)
133:   [2] Regenerate all fields from a clarified intent
134:   [3] Cancel
135: 
136: Enter choice (1, 2, or 3):
137: ```
138: 
139: Wait for user input.
140: </step>
141: 
142: <step name="collect_edits">
143: 
144: **If user chose [3] Cancel:** Exit cleanly.
145: 
146: **If user chose [1] Edit specific fields:**
147: 
148: Ask which fields to edit. For each field the user wants to change, prompt for the new value. Only fields the user explicitly answers become updates; empty answers preserve the existing value.
149: 
150: ```
151: Which fields do you want to update? (comma-separated or "all")
152: Options: title, goal, depends_on, requirements, success_criteria
153: ```
154: 
155: For each selected field, ask:
156: 
157: ```
158: New value for {field} [current: {current_value}]:
159: ```
160: 
161: Build an `updates` map of {field → new_value} for non-empty answers.
162: 
163: **If user chose [2] Regenerate all from clarified intent:**
164: 
165: Ask the user:
166: 
167: ```
168: Describe the revised intent for Phase {target} (replace the current description):
169: ```
170: 
171: Wait for user input. Use the clarified intent to rewrite all fields:
172: - Generate a clear, concise `title` from the intent
173: - Write a complete `goal` statement
174: - Produce updated `requirements` if the original had them
175: - Generate `success_criteria` (3-5 measurable criteria)
176: - Preserve `depends_on` unless the user explicitly mentioned changing it
177: </step>
178: 
179: <step name="validate_depends_on">
180: If `depends_on` is being updated (or preserved as non-empty), validate that every referenced phase number exists in ROADMAP.md:
181: 
182: ```bash
183: ALL_PHASES=$(gsd-sdk query roadmap analyze)
184: ```
185: 
186: Parse the `phases` array to get all valid phase numbers.
187: 
188: For each phase number referenced in `depends_on`:
189: - Normalize it (strip whitespace, "Phase" prefix if present)
190: - Check it is in the valid phase numbers set
191: - It must not reference itself (phase {target})
192: 
193: If any reference is invalid:
194: 
195: ```
196: ERROR: depends_on references invalid phase(s): {bad_refs}
197: 
198: Valid phase numbers: {valid_list}
199: 
200: Fix the depends_on field and try again.
201: ```
202: 
203: Exit (do not write).
204: </step>
205: 
206: <step name="show_diff_and_confirm">
207: Build the updated phase section by applying the changes to the original `section` text:
208: 
209: - For `title`: replace the heading text after `Phase {N}:`
210: - For `goal`: replace the `**Goal:**` line value
211: - For `depends_on`: replace or add the `**Depends on:**` line
212: - For `requirements`: replace or add the requirements block
213: - For `success_criteria`: replace the numbered list under `**Success Criteria**:`
214: - For full regeneration: rebuild the entire section from the new field values
215: 
216: Show a unified-style diff of old vs. new:
217: 
218: ```
219: Proposed changes to Phase {target}:
220: 
221: --- current
222: +++ updated
223: @@ ...
224: - **Goal:** {old_goal}
225: + **Goal:** {new_goal}
226: ...
227: 
228: Apply these changes? (y/n):
229: ```
230: 
231: Wait for confirmation. If the user says `n`, exit without writing.
232: </step>
233: 
234: <step name="write_updated_phase">
235: Write the updated phase back in place in ROADMAP.md.
236: 
237: Read the full ROADMAP.md content, locate the phase section by its header (`## Phase {N}:` or `### Phase {N}:`), and replace exactly the old section text with the new section text. All content before and after the section (including other phases, milestone headers, and the summary checklist) must be left unchanged.
238: 
239: After writing ROADMAP.md, update STATE.md Roadmap Evolution:
240: 
241: ```bash
242: gsd-sdk query state.add-roadmap-evolution \
243:   --phase {target} \
244:   --action edited \
245:   --note "edited fields: {changed_field_list}"
246: ```
247: </step>
248: 
249: <step name="completion">
250: Present completion summary:
251: 
252: ```
253: Phase {target} updated in ROADMAP.md.
254: 
255: Fields changed: {changed_field_list}
256: 
257: ---
258: 
259: ## What's Next
260: 
261: - `/gsd-progress` — view updated roadmap
262: - `/gsd-plan-phase {target}` — re-plan this phase (if needed)
263: - `/gsd-discuss-phase {target}` — discuss implementation approach
264: 
265: ---
266: ```
267: </step>
268: 
269: </process>
270: 
271: <anti_patterns>
272: - Don't renumber the phase — number and position must be preserved exactly
273: - Don't modify other phases when editing one
274: - Don't skip depends_on validation (invalid references block writes)
275: - Don't write without showing a diff and getting confirmation
276: - Don't edit in_progress/completed phases without --force
277: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
278: - Don't modify the phase directory structure — only ROADMAP.md changes
279: - Don't commit the change — that's the user's decision
280: </anti_patterns>
281: 
282: <success_criteria>
283: Edit-phase is complete when:
284: 
285: - [ ] Phase {target} found and loaded from ROADMAP.md
286: - [ ] Status check performed; in_progress/completed blocked without --force
287: - [ ] Current values presented to user
288: - [ ] User chose edit mode (specific fields or full regeneration)
289: - [ ] depends_on references validated; invalid references blocked
290: - [ ] Diff shown and confirmed by user
291: - [ ] Updated phase written back in place; number, position, and status preserved
292: - [ ] STATE.md Roadmap Evolution updated
293: - [ ] User informed of next steps
294: </success_criteria>

(End of file - total 294 lines)
</content>

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_wKioA3zzfCzvrEF8eoWw7702"
}
```


## USER (turn 7)

**source:** real-human

hãy khai thác context của tôi xem assumption của bạn đúng chưa

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7Sh2PduakU1rOz7XfDfw2576"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_00_8YBaHybtrLP4SrB1YTi50675"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_XjOrOf2766RLJmYFgRvg6013"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_U4N1slk8yBXwz2xug7xl5969"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_XbMl20yrIk12U6eonCxw5391"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_c443OwN6hKv3VFobFZfV9373"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_i7Pcgnbnmxe9Zc68KRv82361"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_NxqHhbIA2CyxO7K3p2zS8911"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_F601qsER1plThchKSGFl9003"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_rF7whuCvEzTC0RPJrYiG9285"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_nLdBCIXIsOTBBMzZUTIu8905"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_uhATNc7QUWKsZaNb49PW1226"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JaiUdtQ8meVn0nqsZfjc2128"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_mosdQttqvusNf0RjLlU60498"
}
```


## USER (turn 8)

**source:** real-human

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
Phase number: 17 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_KY6lGSUNe4GrsSHCGMYt3215"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_M0RkWI0FEuKDB267J7gk9221"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_4l8MJiUseOwHOHeszP2N0852"
}
```


## USER (turn 9)

**source:** real-human

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
Phase number: 17 (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in 17:
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
  "callID": "call_00_5f85KF87eRb9agWGM3hP7056"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/default.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_4GM5yPLiTPXpaEqiYx9F7293"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_VN1joypKIly4UNuVo3fz9185"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_AET2HI7w4NI0I9vxnZNb5595"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_GYLxK75iTv1gn7L7IRtI1455"
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


### Tool: question

**Input:**
```json
{
  "callID": "call_00_05BgJlQSSMa59oCuei063638"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_hFypjxhd6b3EeL7FATgC2840"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_gZ15NN96V2QYHFjW24Td7283"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_BI3jQooB6w3k1sYgrwOL5649"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_BQ7iJmi3i8lUM2YEBN0m5321"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_A5cXPHmVM0w6kRtkYmBa3020"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_AzaDql5RTubFT5dlhv0d1986"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_myG4NG6FXH3epjgktZKB9340"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_TeiQXzwPs1S6ytzdpq9i1618"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_O8U28D162kZ5tcyL2e0I7509"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1xmRQC6mskLkhyr4b2xv0613"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_mAGwItUNchSRucHeK87C2876"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_nNCu6lbXnH8PymTpgyAk3257"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_lysOL257CdtAX0F5nvxn9131"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1lA8D1gsjIruneZKks7U7117"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LPH3yElVajbY9UHRK4Ba9015"
}
```


## USER (turn 10)

**source:** real-human

hãy route research phase cho phase 17 cho gsd- agents để research trước khi plan

### Tool: task

**Input:**
```json
{
  "description": "Research Phase 17 src/ audit",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1bb00bddaffe0IcXyAY1ZloSxG"
}
```

**Output:** (pruned)
```
task_id: ses_1bb00bddaffe0IcXyAY1ZloSxG
```


## USER (turn 11)

**source:** real-human

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
Phase number: 17 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LfFmtCnkaP13bBAarxLP4680"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_qAEtCP5pbqXdVBEbTofi3242"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Plan Phase 17 src/ audit",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1baf92c58ffegEoNBsdPuT53iW"
}
```

**Output:** (pruned)
```
task_id: ses_1baf92c58ffegEoNBsdPuT53iW
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Hmh47JcSyFO8NrWeight9794"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Verify Phase 17 plans",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1baf58452ffemwN9IGhhq6vYjd"
}
```

**Output:** (pruned)
```
task_id: ses_1baf58452ffemwN9IGhhq6vYjd
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_OMXQYKUYDSGgJzo4Pfko5847"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-RESEARCH.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_WYpTyLyvBwaD9jimuyGf7153"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_hlUg9owsmYr9HDQKIRD24614"
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
- A flag is active only when its literal token appears in `17`
- If a documented flag is absent from `17`, treat it as inactive

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
Phase: 17

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `17`:**
- `--wave N` is active only if the literal `--wave` token is present in `17`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `17`
- `--interactive` is active only if the literal `--interactive` token is present in `17`
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
  "callID": "call_00_vypoQumFA4cOFUWQVrCH5011"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-01-PLAN.md"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 17-01 audit",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1baebf1faffeYC7ZlPkPHFzdbW"
}
```

**Output:** (pruned)
```
task_id: ses_1baebf1faffeYC7ZlPkPHFzdbW
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 17-02 audit",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1bae65f1dffe7AiLIgtS1j5q6O"
}
```

**Output:** (pruned)
```
task_id: ses_1bae65f1dffe7AiLIgtS1j5q6O
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 17-03 audit",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1bae1c34fffeW9RRptGfEaJ4eS"
}
```

**Output:** (pruned)
```
task_id: ses_1bae1c34fffeW9RRptGfEaJ4eS
```


### Tool: task

**Input:**
```json
{
  "description": "Execute Plan 17-04 audit",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1badcc161ffeLblOLqSPHVBeWK"
}
```

**Output:** (pruned)
```
task_id: ses_1badcc161ffeLblOLqSPHVBeWK
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_QTeVZfthuGK6Es9w1ER28513"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_dZ5Yc1m0GiDh6bUipr8V2755"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LuSEm5TQKnyspANnTyqm3857"
}
```


## USER (turn 13)

**source:** real-human

hãy chạy gatekeeping cho các planning và implementing vừa rồi qua gsd commands và agents /Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-VALIDATION.md 

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_WqlVhrkm2NR35d4OLmKj8758"
}
```


## USER (turn 14)

**source:** real-human

<objective>
Review source files changed during a phase for bugs, security vulnerabilities, and code quality problems.

Spawns the gsd-code-reviewer agent to analyze code at the specified depth level. Produces REVIEW.md artifact in the phase directory with severity-classified findings.

Arguments:
- Phase number (required) — which phase's changes to review (e.g., "2" or "02")
- `--depth=quick|standard|deep` (optional) — review depth level, overrides workflow.code_review_depth config
  - quick: Pattern-matching only (~2 min)
  - standard: Per-file analysis with language-specific checks (~5-15 min, default)
  - deep: Cross-file analysis including import graphs and call chains (~15-30 min)
- `--files file1,file2,...` (optional) — explicit comma-separated file list, skips SUMMARY/git scoping (highest precedence for scoping)
- `--fix` (optional) — after review completes (or if REVIEW.md already exists), auto-apply fixes found. Spawns gsd-code-fixer agent. Accepts sub-flags:
  - `--all` — include Info findings in fix scope (default: Critical + Warning only)
  - `--auto` — enable fix + re-review iteration loop, capped at 3 iterations

Output: {padded_phase}-REVIEW.md in phase directory + inline summary of findings
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
</execution_context>

<context>
Phase: 17 (first positional argument is phase number)

Optional flags parsed from 17:
- `--depth=VALUE` — Depth override (quick|standard|deep). If provided, overrides workflow.code_review_depth config.
- `--files=file1,file2,...` — Explicit file list override. Has highest precedence for file scoping per D-08. When provided, workflow skips SUMMARY.md extraction and git diff fallback entirely.

Context files (AGENTS.md, SUMMARY.md, phase state) are resolved inside the workflow via `gsd-sdk query init.phase-op` and delegated to agent via `<files_to_read>` blocks.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute end-to-end.

The workflow (not this command) enforces these gates:
- Phase validation (before config gate)
- Config gate check (workflow.code_review)
- File scoping (--files override > SUMMARY.md > git diff fallback)
- Empty scope check (skip if no files)
- Agent spawning (gsd-code-reviewer)
- Result presentation (inline summary + next steps)
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md</path>
<type>file</type>
<content>
1: <purpose>
2: Review source files changed during a phase for bugs, security issues, and code quality problems. Computes file scope (--files override > SUMMARY.md > git diff fallback), checks config gate, spawns gsd-code-reviewer agent, commits REVIEW.md, and presents results to user.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <available_agent_types>
10: - gsd-code-reviewer: Reviews source files for bugs and quality issues
11: </available_agent_types>
12: 
13: <process>
14: 
15: <step name="initialize">
16: Parse arguments and load project state:
17: 
18: ```bash
19: PHASE_ARG="${1}"
20: INIT=$(gsd-sdk query init.phase-op "${PHASE_ARG}")
21: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
22: ```
23: 
24: Parse from init JSON: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `commit_docs`.
25: 
26: **Input sanitization (defense-in-depth):**
27: ```bash
28: # Validate PADDED_PHASE contains only digits and optional dot (e.g., "02", "03.1")
29: if ! [[ "$PADDED_PHASE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
30:   echo "Error: Invalid phase number format: '${PADDED_PHASE}'. Expected digits (e.g., 02, 03.1)."
31:   # Exit workflow
32: fi
33: ```
34: 
35: **Phase validation (before config gate):**
36: If `phase_found` is false, report error and exit:
37: ```
38: Error: Phase ${PHASE_ARG} not found. Run /gsd-progress to see available phases.
39: ```
40: 
41: This runs BEFORE config gate check so user errors are surfaced immediately regardless of config state.
42: 
43: Parse optional flags from $ARGUMENTS:
44: 
45: **--depth flag:**
46: ```bash
47: DEPTH_OVERRIDE=""
48: for arg in "$@"; do
49:   if [[ "$arg" == --depth=* ]]; then
50:     DEPTH_OVERRIDE="${arg#--depth=}"
51:   fi
52: done
53: ```
54: 
55: **--files flag:**
56: ```bash
57: FILES_OVERRIDE=""
58: for arg in "$@"; do
59:   if [[ "$arg" == --files=* ]]; then
60:     FILES_OVERRIDE="${arg#--files=}"
61:   fi
62: done
63: ```
64: 
65: If FILES_OVERRIDE is set, split by comma into array:
66: ```bash
67: if [ -n "$FILES_OVERRIDE" ]; then
68:   IFS=',' read -ra FILES_ARRAY <<< "$FILES_OVERRIDE"
69: fi
70: ```
71: </step>
72: 
73: <step name="check_config_gate">
74: Check if code review is enabled via config:
75: 
76: ```bash
77: CODE_REVIEW_ENABLED=$(gsd-sdk query config-get workflow.code_review 2>/dev/null || echo "true")
78: ```
79: 
80: If CODE_REVIEW_ENABLED is "false":
81: ```
82: Code review skipped (workflow.code_review=false in config)
83: ```
84: Exit workflow.
85: 
86: Default is true — only skip on explicit false. This check runs AFTER phase validation so invalid phase errors are shown first.
87: </step>
88: 
89: <step name="resolve_depth">
90: Determine review depth with priority order:
91: 
92: 1. DEPTH_OVERRIDE from --depth flag (highest priority)
93: 2. Config value: `gsd-sdk query config-get workflow.code_review_depth 2>/dev/null`
94: 3. Default: "standard"
95: 
96: ```bash
97: if [ -n "$DEPTH_OVERRIDE" ]; then
98:   REVIEW_DEPTH="$DEPTH_OVERRIDE"
99: else
100:   CONFIG_DEPTH=$(gsd-sdk query config-get workflow.code_review_depth 2>/dev/null || echo "")
101:   REVIEW_DEPTH="${CONFIG_DEPTH:-standard}"
102: fi
103: ```
104: 
105: **Validate depth value:**
106: ```bash
107: case "$REVIEW_DEPTH" in
108:   quick|standard|deep)
109:     # Valid
110:     ;;
111:   *)
112:     echo "Warning: Invalid depth '${REVIEW_DEPTH}'. Valid values: quick, standard, deep. Using 'standard'."
113:     REVIEW_DEPTH="standard"
114:     ;;
115: esac
116: ```
117: </step>
118: 
119: <step name="compute_file_scope">
120: Three-tier scoping with explicit precedence:
121: 
122: **Tier 1 — --files override (highest precedence per D-08):**
123: 
124: If FILES_OVERRIDE is set (from --files flag):
125: ```bash
126: if [ -n "$FILES_OVERRIDE" ]; then
127:   REVIEW_FILES=()
128:   REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
129:   
130:   for file_path in "${FILES_ARRAY[@]}"; do
131:     # Security: validate path is within repository (prevent path traversal)
132:     ABS_PATH=$(realpath -m "${file_path}" 2>/dev/null || echo "${file_path}")
133:     if [[ "$ABS_PATH" != "$REPO_ROOT"* ]]; then
134:       echo "Error: File path outside repository, skipping: ${file_path}"
135:       continue
136:     fi
137:     
138:     # Validate path exists (relative to repo root)
139:     if [ -f "${REPO_ROOT}/${file_path}" ] || [ -f "${file_path}" ]; then
140:       REVIEW_FILES+=("$file_path")
141:     else
142:       echo "Warning: File not found, skipping: ${file_path}"
143:     fi
144:   done
145:   
146:   echo "File scope: ${#REVIEW_FILES[@]} files from --files override"
147: fi
148: ```
149: 
150: Skip SUMMARY/git scoping entirely when --files is provided.
151: 
152: **Tier 2 — SUMMARY.md extraction (primary per D-01):**
153: 
154: If --files NOT provided:
155: ```bash
156: if [ -z "$FILES_OVERRIDE" ]; then
157:   SUMMARIES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
158:   REVIEW_FILES=()
159:   
160:   if [ -n "$SUMMARIES" ]; then
161:     for summary in $SUMMARIES; do
162:       # Extract key_files.created and key_files.modified using node for reliable YAML parsing
163:       # This avoids fragile awk parsing that breaks on indentation differences
164:       EXTRACTED=$(node -e "
165:         const fs = require('fs');
166:         const content = fs.readFileSync('$summary', 'utf-8');
167:         const match = content.match(/^---\n([\s\S]*?)\n---/);
168:         if (!match) { process.exit(0); }
169:         const yaml = match[1];
170:         const files = [];
171:         let inSection = null;
172:         for (const line of yaml.split('\n')) {
173:           if (/^\s+created:/.test(line)) { inSection = 'created'; continue; }
174:           if (/^\s+modified:/.test(line)) { inSection = 'modified'; continue; }
175:           if (/^\s*[\w-]+:/.test(line) && !/^\s*-/.test(line)) { inSection = null; continue; }
176:           if (inSection && /^\s+-\s+(.+)/.test(line)) {
177:             let raw = line.match(/^\s+-\s+(.+)/)[1].trim();
178:             raw = raw.replace(/^['"]|['"]$/g, '');
179:             raw = raw.replace(/\s+\([^)]*\)\s*$/, '');
180:             raw = raw.split(/\s+—\s/)[0].trim();
181:             if (/\//.test(raw) && /\.[A-Za-z0-9]+$/.test(raw)) {
182:               files.push(raw);
183:             }
184:           }
185:         }
186:         if (files.length) console.log(files.join('\n'));
187:       " 2>/dev/null)
188:       
189:       # Add extracted files to REVIEW_FILES array
190:       if [ -n "$EXTRACTED" ]; then
191:         while IFS= read -r file; do
192:           if [ -n "$file" ]; then
193:             REVIEW_FILES+=("$file")
194:           fi
195:         done <<< "$EXTRACTED"
196:       fi
197:     done
198:     
199:     if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
200:       echo "Warning: SUMMARY artifacts found but contained no file paths. Falling back to git diff."
201:     fi
202:   fi
203: fi
204: ```
205: 
206: **Tier 3 — Git diff fallback (per D-02):**
207: 
208: If no SUMMARY.md files found OR no files extracted from them:
209: ```bash
210: if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
211:   # Compute diff base from phase commits — fail closed if no reliable base found
212:   PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)
213:   
214:   if [ -n "$PHASE_COMMITS" ]; then
215:     DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^
216:     
217:     # Verify the parent commit exists (first commit in repo has no parent)
218:     if ! git rev-parse "${DIFF_BASE}" >/dev/null 2>&1; then
219:       DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)
220:     fi
221:     
222:     # Run git diff with specific exclusions (per D-03)
223:     DIFF_FILES=$(git diff --name-only "${DIFF_BASE}..HEAD" -- . \
224:       ':!.planning/' ':!ROADMAP.md' ':!STATE.md' \
225:       ':!*-SUMMARY.md' ':!*-VERIFICATION.md' ':!*-PLAN.md' \
226:       ':!package-lock.json' ':!yarn.lock' ':!Gemfile.lock' ':!poetry.lock' 2>/dev/null)
227:     
228:     while IFS= read -r file; do
229:       [ -n "$file" ] && REVIEW_FILES+=("$file")
230:     done <<< "$DIFF_FILES"
231:     
232:     echo "File scope: ${#REVIEW_FILES[@]} files from git diff (base: ${DIFF_BASE})"
233:   else
234:     # Fail closed — no reliable diff base found. Do not use arbitrary HEAD~N.
235:     echo "Warning: No phase commits found for '${PADDED_PHASE}'. Cannot determine reliable diff scope."
236:     echo "Use --files flag to specify files explicitly: /gsd-code-review ${PHASE_ARG} --files=file1,file2,..."
237:   fi
238: fi
239: ```
240: 
241: **Post-processing (all tiers):**
242: 
243: 1. **Apply exclusions (per D-03):** Remove paths matching planning artifacts
244: ```bash
245: FILTERED_FILES=()
246: for file in "${REVIEW_FILES[@]}"; do
247:   # Skip planning directory and specific artifacts
248:   if [[ "$file" == .planning/* ]] || \
249:      [[ "$file" == ROADMAP.md ]] || \
250:      [[ "$file" == STATE.md ]] || \
251:      [[ "$file" == *-SUMMARY.md ]] || \
252:      [[ "$file" == *-VERIFICATION.md ]] || \
253:      [[ "$file" == *-PLAN.md ]]; then
254:     continue
255:   fi
256:   FILTERED_FILES+=("$file")
257: done
258: REVIEW_FILES=("${FILTERED_FILES[@]}")
259: ```
260: 
261: 2. **Filter deleted files:** Remove paths that don't exist on disk
262: ```bash
263: EXISTING_FILES=()
264: DELETED_COUNT=0
265: for file in "${REVIEW_FILES[@]}"; do
266:   if [ -f "$file" ]; then
267:     EXISTING_FILES+=("$file")
268:   else
269:     DELETED_COUNT=$((DELETED_COUNT + 1))
270:   fi
271: done
272: REVIEW_FILES=("${EXISTING_FILES[@]}")
273: 
274: if [ $DELETED_COUNT -gt 0 ]; then
275:   echo "Filtered $DELETED_COUNT deleted files from review scope"
276: fi
277: ```
278: 
279: 3. **Deduplicate:** Remove duplicate paths (portable — bash 3.2+ compatible, handles spaces in paths)
280: ```bash
281: DEDUPED=()
282: while IFS= read -r line; do
283:   [ -n "$line" ] && DEDUPED+=("$line")
284: done < <(printf '%s\n' "${REVIEW_FILES[@]}" | sort -u)
285: REVIEW_FILES=("${DEDUPED[@]}")
286: ```
287: 
288: 4. **Sort:** Alphabetical sort for reproducible agent input (already sorted by sort -u above)
289: 
290: **Log final scope and warn if large:**
291: ```bash
292: if [ -n "$FILES_OVERRIDE" ]; then
293:   TIER="--files override"
294: elif [ -n "$SUMMARIES" ] && [ ${#REVIEW_FILES[@]} -gt 0 ]; then
295:   TIER="SUMMARY.md"
296: else
297:   TIER="git diff"
298: fi
299: echo "File scope: ${#REVIEW_FILES[@]} files from ${TIER}"
300: 
301: # Warn if file count is very large — may exceed agent context or produce superficial review
302: if [ ${#REVIEW_FILES[@]} -gt 50 ]; then
303:   echo "Warning: ${#REVIEW_FILES[@]} files is a large review scope."
304:   echo "Consider using --files to narrow scope, or --depth=quick for a faster pass."
305:   if [ "$REVIEW_DEPTH" = "deep" ]; then
306:     echo "Switching from deep to standard depth for large file count."
307:     REVIEW_DEPTH="standard"
308:   fi
309: fi
310: ```
311: </step>
312: 
313: <step name="check_empty_scope">
314: If REVIEW_FILES is empty:
315: ```
316: No source files changed in phase ${PHASE_ARG}. Skipping review.
317: ```
318: Exit workflow. Do NOT spawn agent or create REVIEW.md.
319: </step>
320: 
321: <step name="spawn_reviewer">
322: Compute the review output path:
323: ```bash
324: REVIEW_PATH="${PHASE_DIR}/${PADDED_PHASE}-REVIEW.md"
325: ```
326: 
327: Compute DIFF_BASE for agent context (in case agent needs it):
328: ```bash
329: PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)
330: if [ -n "$PHASE_COMMITS" ]; then
331:   DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^
332: else
333:   DIFF_BASE=""
334: fi
335: ```
336: 
337: Build files_to_read block for agent:
338: ```bash
339: FILES_TO_READ=""
340: for file in "${REVIEW_FILES[@]}"; do
341:   FILES_TO_READ+="- ${file}\n"
342: done
343: ```
344: 
345: Build config block for agent:
346: ```bash
347: CONFIG_FILES=""
348: for file in "${REVIEW_FILES[@]}"; do
349:   CONFIG_FILES+="  - ${file}\n"
350: done
351: ```
352: 
353: Spawn the gsd-code-reviewer agent:
354: 
355: ```
356: Agent(subagent_type="gsd-code-reviewer", prompt="
357: <files_to_read>
358: ${FILES_TO_READ}
359: </files_to_read>
360: 
361: <config>
362: depth: ${REVIEW_DEPTH}
363: phase_dir: ${PHASE_DIR}
364: review_path: ${REVIEW_PATH}
365: ${DIFF_BASE:+diff_base: ${DIFF_BASE}}
366: files:
367: ${CONFIG_FILES}
368: </config>
369: 
370: Review the listed source files at ${REVIEW_DEPTH} depth. Write findings to ${REVIEW_PATH}.
371: Do NOT commit the output — the orchestrator handles that.
372: ")
373: ```
374: 
375: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
376: 
377: **Agent failure handling:**
378: 
379: If the Agent() call fails (agent error, timeout, or exception):
380: ```
381: Error: Code review agent failed: ${error_message}
382: 
383: No REVIEW.md created. You can retry with /gsd-code-review ${PHASE_ARG} or check agent logs.
384: ```
385: 
386: Do NOT proceed to commit_review step. Do NOT create a partial or empty REVIEW.md. Exit workflow.
387: </step>
388: 
389: <step name="commit_review">
390: After agent completes successfully, verify REVIEW.md was created and has valid structure:
391: 
392: ```bash
393: if [ -f "${REVIEW_PATH}" ]; then
394:   # Validate REVIEW.md has valid YAML frontmatter with status field
395:   HAS_STATUS=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
396:     const fs = require('fs');
397:     const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
398:     const match = content.match(/^---\n([\s\S]*?)\n---/);
399:     if (match && /status:/.test(match[1])) { console.log('valid'); } else { console.log('invalid'); }
400:   " 2>/dev/null)
401:   
402:   if [ "$HAS_STATUS" = "valid" ]; then
403:     echo "REVIEW.md created at ${REVIEW_PATH}"
404:     
405:     if [ "$COMMIT_DOCS" = "true" ]; then
406:       gsd-sdk query commit \
407:         "docs(${PADDED_PHASE}): add code review report" \
408:         --files "${REVIEW_PATH}"
409:     fi
410:   else
411:     echo "Warning: REVIEW.md exists but has invalid or missing frontmatter (no status field)."
412:     echo "Agent may have produced malformed output. Not committing. Review manually: ${REVIEW_PATH}"
413:   fi
414: else
415:   echo "Warning: Agent completed but REVIEW.md not found at ${REVIEW_PATH}. This may indicate an agent issue."
416:   echo "No REVIEW.md to commit. Please retry with /gsd-code-review ${PHASE_ARG}"
417: fi
418: ```
419: </step>
420: 
421: <step name="present_results">
422: Read the REVIEW.md YAML frontmatter to extract finding counts.
423: 
424: Extract frontmatter between `---` delimiters first to avoid matching values in the review body:
425: 
426: ```bash
427: # Extract only the YAML frontmatter block (between first two --- lines)
428: FRONTMATTER=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
429:   const fs = require('fs');
430:   const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
431:   const match = content.match(/^---\n([\s\S]*?)\n---/);
432:   if (match) process.stdout.write(match[1]);
433: " 2>/dev/null)
434: 
435: # Parse fields from frontmatter only (not full file)
436: STATUS=$(echo "$FRONTMATTER" | grep "^status:" | cut -d: -f2 | xargs)
437: FILES_REVIEWED=$(echo "$FRONTMATTER" | grep "^files_reviewed:" | cut -d: -f2 | xargs)
438: CRITICAL=$(echo "$FRONTMATTER" | grep -E "^[[:space:]]*(critical|blocker):" | head -1 | cut -d: -f2 | xargs)
439: WARNING=$(echo "$FRONTMATTER" | grep "warning:" | head -1 | cut -d: -f2 | xargs)
440: INFO=$(echo "$FRONTMATTER" | grep "info:" | head -1 | cut -d: -f2 | xargs)
441: TOTAL=$(echo "$FRONTMATTER" | grep "total:" | head -1 | cut -d: -f2 | xargs)
442: ```
443: 
444: Display inline summary to user:
445: 
446: ```
447: ═══════════════════════════════════════════════════════════════
448: 
449:   Code Review Complete: Phase ${PHASE_NUMBER} (${PHASE_NAME})
450: 
451: ───────────────────────────────────────────────────────────────
452: 
453:   Depth:           ${REVIEW_DEPTH}
454:   Files Reviewed:  ${FILES_REVIEWED}
455:   
456:   Findings:
457:     Critical:  ${CRITICAL}
458:     Warning:   ${WARNING}
459:     Info:      ${INFO}
460:     ──────────
461:     Total:     ${TOTAL}
462: 
463: ───────────────────────────────────────────────────────────────
464: ```
465: 
466: If status is "clean":
467: ```
468: ✓ No issues found. All ${FILES_REVIEWED} files pass review at ${REVIEW_DEPTH} depth.
469: 
470: Full report: ${REVIEW_PATH}
471: ```
472: 
473: If total findings > 0:
474: ```
475: ⚠ Issues found. Review the report for details.
476: 
477: Full report: ${REVIEW_PATH}
478: 
479: Next steps:
480:   /gsd-code-review ${PHASE_NUMBER} --fix  — Auto-fix issues
481:   cat ${REVIEW_PATH}                     — View full report
482: ```
483: 
484: If critical > 0 or warning > 0, list top 3 issues inline:
485: ```bash
486: echo "Top issues:"
487: grep -A 3 "^### CR-\|^### BL-\|^### WR-" "${REVIEW_PATH}" | head -n 12
488: ```
489: 
490: **Note on tests:** Automated tests for this command and workflow are planned for Phase 4 (Pipeline Integration & Testing, requirement INFR-03). Phase 2 focuses on correct implementation; Phase 4 adds regression coverage across platforms.
491: 
492: ═══════════════════════════════════════════════════════════════
493: </step>
494: 
495: </process>
496: 
497: <platform_notes>
498: **Windows:** This workflow uses bash features (arrays, process substitution). On Windows, it requires
499: Git Bash or WSL. Native PowerShell is not supported. The CI matrix (Ubuntu/macOS/Windows)
500: runs under Git Bash on Windows runners, which provides bash compatibility.
501: 
502: **macOS:** macOS ships with bash 3.2 (GPL licensing). This workflow does NOT use `mapfile` (bash 4+
503: only) — all array construction uses portable `while IFS= read -r` loops compatible with bash 3.2.
504: The `--files` path validation uses `realpath -m` which requires GNU coreutils (install via
505: `brew install coreutils`). Without coreutils, the path guard falls back to fail-closed behavior
506: (rejects paths it cannot verify), so security is maintained but valid relative paths may be rejected.
507: If `--files` validation fails unexpectedly on macOS, install coreutils or use absolute paths.
508: </platform_notes>
509: 
510: <success_criteria>
511: - [ ] Phase validated before config gate check
512: - [ ] Config gate checked (workflow.code_review)
513: - [ ] Depth resolved with validation (quick|standard|deep)
514: - [ ] File scope computed with 3 tiers: --files > SUMMARY.md > git diff
515: - [ ] Malformed/missing SUMMARY.md handled gracefully with fallback
516: - [ ] Deleted files filtered from scope
517: - [ ] Files deduplicated and sorted
518: - [ ] Empty scope results in skip (no agent spawn)
519: - [ ] Agent spawned with explicit file list, depth, review_path, diff_base
520: - [ ] Agent failure handled without partial commits
521: - [ ] REVIEW.md committed if created
522: - [ ] Results presented inline with next step suggestion
523: </success_criteria>

(End of file - total 523 lines)
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

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_r5ZzUjW4FHG1UZRIli1Z3470"
}
```


## USER (turn 15)

**source:** real-human

<objective>
Audit Nyquist validation coverage for a completed phase. Three states:
- (A) VALIDATION.md exists — audit and fill gaps
- (B) No VALIDATION.md, SUMMARY.md exists — reconstruct from artifacts
- (C) Phase not executed — exit with guidance

Output: updated VALIDATION.md + generated test files.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md
</execution_context>

<context>
Phase: 17 — optional, defaults to last completed phase.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/validate-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Audit Nyquist validation gaps for a completed phase. Generate missing tests. Update VALIDATION.md.
3: </purpose>
4: 
5: <required_reading>
6: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
7: </required_reading>
8: 
9: <available_agent_types>
10: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
11: - gsd-nyquist-auditor — Validates verification coverage
12: </available_agent_types>
13: 
14: <process>
15: 
16: ## 0. Initialize
17: 
18: ```bash
19: INIT=$(gsd-sdk query init.phase-op "${PHASE_ARG}")
20: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
21: AGENT_SKILLS_AUDITOR=$(gsd-sdk query agent-skills gsd-nyquist-auditor)
22: ```
23: 
24: Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`.
25: 
26: ```bash
27: AUDITOR_MODEL=$(gsd-sdk query resolve-model gsd-nyquist-auditor --raw)
28: NYQUIST_CFG=$(gsd-sdk query config-get workflow.nyquist_validation --raw)
29: ```
30: 
31: If `NYQUIST_CFG` is `false`: exit with "Nyquist validation is disabled. Enable via /gsd-settings."
32: 
33: Display banner: `GSD > VALIDATE PHASE {N}: {name}`
34: 
35: ## 1. Detect Input State
36: 
37: ```bash
38: VALIDATION_FILE=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
39: SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
40: ```
41: 
42: - **State A** (`VALIDATION_FILE` non-empty): Audit existing
43: - **State B** (`VALIDATION_FILE` empty, `SUMMARY_FILES` non-empty): Reconstruct from artifacts
44: - **State C** (`SUMMARY_FILES` empty): Exit — "Phase {N} not executed. Run /gsd-execute-phase {N} ${GSD_WS} first."
45: 
46: ## 2. Discovery
47: 
48: ### 2a. Read Phase Artifacts
49: 
50: Read all PLAN and SUMMARY files. Extract: task lists, requirement IDs, key-files changed, verify blocks.
51: 
52: ### 2b. Build Requirement-to-Task Map
53: 
54: Per task: `{ task_id, plan_id, wave, requirement_ids, has_automated_command }`
55: 
56: ### 2c. Detect Test Infrastructure
57: 
58: State A: Parse from existing VALIDATION.md Test Infrastructure table.
59: State B: Filesystem scan:
60: 
61: ```bash
62: find . -name "pytest.ini" -o -name "jest.config.*" -o -name "vitest.config.*" -o -name "pyproject.toml" 2>/dev/null | head -10
63: find . \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" \) -not -path "*/node_modules/*" 2>/dev/null | head -40
64: ```
65: 
66: ### 2d. Cross-Reference
67: 
68: Match each requirement to existing tests by filename, imports, test descriptions. Record: requirement → test_file → status.
69: 
70: ## 3. Gap Analysis
71: 
72: Classify each requirement:
73: 
74: | Status | Criteria |
75: |--------|----------|
76: | COVERED | Test exists, targets behavior, runs green |
77: | PARTIAL | Test exists, failing or incomplete |
78: | MISSING | No test found |
79: 
80: Build: `{ task_id, requirement, gap_type, suggested_test_path, suggested_command }`
81: 
82: No gaps → skip to Step 6, set `nyquist_compliant: true`.
83: 
84: ## 4. Present Gap Plan
85: 
86: 
87: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
88: Call question with gap table and options:
89: 1. "Fix all gaps" → Step 5
90: 2. "Skip — mark manual-only" → add to Manual-Only, Step 6
91: 3. "Cancel" → exit
92: 
93: ## 5. Spawn gsd-nyquist-auditor
94: 
95: ```
96: Agent(
97:   prompt="Read /Users/apple/hivemind-plugin-private/.opencode/agents/gsd-nyquist-auditor.md for instructions.\n\n" +
98:     "<files_to_read>{PLAN, SUMMARY, impl files, VALIDATION.md}</files_to_read>" +
99:     "<gaps>{gap list}</gaps>" +
100:     "<test_infrastructure>{framework, config, commands}</test_infrastructure>" +
101:     "<constraints>Never modify impl files. Max 3 debug iterations. Escalate impl bugs.</constraints>" +
102:     "${AGENT_SKILLS_AUDITOR}",
103:   subagent_type="gsd-nyquist-auditor",
104:   model="{AUDITOR_MODEL}",
105:   description="Fill validation gaps for Phase {N}"
106: )
107: ```
108: 
109: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
110: 
111: Handle return:
112: - `## GAPS FILLED` → record tests + map updates, Step 6
113: - `## PARTIAL` → record resolved, move escalated to manual-only, Step 6
114: - `## ESCALATE` → move all to manual-only, Step 6
115: 
116: ## 6. Generate/Update VALIDATION.md
117: 
118: **State B (create):**
119: 1. Read template from `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
120: 2. Fill: frontmatter, Test Infrastructure, Per-Task Map, Manual-Only, Sign-Off
121: 3. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md`
122: 
123: **State A (update):**
124: 1. Update Per-Task Map statuses, add escalated to Manual-Only, update frontmatter
125: 2. Append audit trail:
126: 
127: ```markdown
128: ## Validation Audit {date}
129: | Metric | Count |
130: |--------|-------|
131: | Gaps found | {N} |
132: | Resolved | {M} |
133: | Escalated | {K} |
134: ```
135: 
136: ## 7. Commit
137: 
138: ```bash
139: git add {test_files}
140: git commit -m "test(phase-${PHASE}): add Nyquist validation tests"
141: 
142: gsd-sdk query commit "docs(phase-${PHASE}): add/update validation strategy"
143: ```
144: 
145: ## 8. Results + Routing
146: 
147: **Compliant:**
148: ```
149: GSD > PHASE {N} IS NYQUIST-COMPLIANT
150: All requirements have automated verification.
151: ▶ Next: /gsd-audit-milestone ${GSD_WS}
152: ```
153: 
154: **Partial:**
155: ```
156: GSD > PHASE {N} VALIDATED (PARTIAL)
157: {M} automated, {K} manual-only.
158: ▶ Retry: /gsd-validate-phase {N} ${GSD_WS}
159: ```
160: 
161: Display `/clear` reminder.
162: 
163: </process>
164: 
165: <success_criteria>
166: - [ ] Nyquist config checked (exit if disabled)
167: - [ ] Input state detected (A/B/C)
168: - [ ] State C exits cleanly
169: - [ ] PLAN/SUMMARY files read, requirement map built
170: - [ ] Test infrastructure detected
171: - [ ] Gaps classified (COVERED/PARTIAL/MISSING)
172: - [ ] User gate with gap table
173: - [ ] Auditor spawned with complete context
174: - [ ] All three return formats handled
175: - [ ] VALIDATION.md created or updated
176: - [ ] Test files committed separately
177: - [ ] Results with routing presented
178: </success_criteria>

(End of file - total 178 lines)
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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_odDmsySOdYO6hqU4t9ZA5832"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_GuZauNLTU227ngD9IFDl8506"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-VALIDATION.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_Kmy1DN5XhGC1qkIBgehF7954"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_9KZJvkJBWRNax4SwqiYO4645"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_GPLjgqC3wUkk0I5YJ9jd0172"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_G1v3kKM1BNNLRLkycwDi1705"
}
```


## USER (turn 16)

**source:** real-human

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
Phase number: 18 (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
```

If `--assumptions` is in 18:
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
  "callID": "call_00_HsQkNtiKeu3296Kbizsu2191"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_as4E5IlW3AVBbaUSQW4F0810"
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
  "callID": "call_00_lgWJNM4aipOtHexdBgYy5083"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8vf8xK72TSxXc28o79uL5302"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_V6d7oDETVls82nzanLbi4583"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/universal-anti-patterns.md"
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
  "callID": "call_00_FsX9aGjcegGCk2waRrSt9718"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_WoJGxVZQTgFBbQHWCydX1470"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_n53RHhJDlL0F1yj69Stb2349"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_UozDeMwZcNB83bHPbJHg5654"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_9zLrv4qj5aAzRCF2Llpr2838"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_qWEDDRup2jmvkbmQEZlx8333"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/STACK.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/ARCHITECTURE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/CONVENTIONS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/modes/advisor.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_VmLsLsQ02vpaKCALPqrw9900"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/USER-PROFILE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_emp5TCwsUtNVh815azey4157"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_JcIzg2T7I1GqUsp7y8FV9534"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research: boundary sync + manifest",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b997c7daffefk2l6wNym8YjXk"
}
```

**Output:** (pruned)
```
task_id: ses_1b997c7daffefk2l6wNym8YjXk
```


### Tool: task

**Input:**
```json
{
  "description": "Research: noise/stub cleanup",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b997ce65ffeoeSDe37HBMSva2"
}
```

**Output:** (pruned)
```
task_id: ses_1b997ce65ffeoeSDe37HBMSva2
```


### Tool: task

**Input:**
```json
{
  "description": "Research: context rot handling",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b997d567ffeqTU30AJIENCfEb"
}
```

**Output:** (pruned)
```
task_id: ses_1b997d567ffeqTU30AJIENCfEb
```


### Tool: task

**Input:**
```json
{
  "description": "Research: dead code deletion",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b997dbddffexvx0f39NCNLCNw"
}
```

**Output:** (pruned)
```
task_id: ses_1b997dbddffexvx0f39NCNLCNw
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_DV3PcLL0Bg6bCBLA5QE58795"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_1AJamLXR8cHsHJYsEHrQ7597"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/discuss-phase/templates/context.md"
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
  "callID": "call_00_npZiudpzRMoccRDHGKem1210"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_zI5cUo7nKerwLjAhLsu88215"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2P9tJociL386ZbuRDFVc7627"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_UhsY1Nriu07osXi55OhH9331"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_F9gtnXxkst7L5GTRyaVF4665"
}
```


## USER (turn 17)

**source:** real-human

vì phase này khá liên quan tới phase 17 nên hãy dùng cách context này để delegate gsd research trước rồi tôi sẽ route plan phase sau ```/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-VALIDATION.md
/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest
/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-DISCUSSION-LOG.md ```

### Tool: task

**Input:**
```json
{
  "description": "Phase 18 research delegation",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b99173b6ffe5EH9nD0JKf1UwG"
}
```

**Output:** (pruned)
```
task_id: ses_1b99173b6ffe5EH9nD0JKf1UwG
```


## USER (turn 18)

**source:** real-human

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
Phase number: 18  (optional — auto-detects next unplanned phase if omitted)

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
  "callID": "call_00_xWwqeSHgWbKiQlwXH9SE4210"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_gYLJt2dtN1ErhtNxfRoY9597"
}
```


## USER (turn 19)

**source:** real-human

confirm recovery xoá luôn bổ sung vô context trước khi planning, rôi sau đó route /gsd-plan-phase 18

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-CONTEXT.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_HdVjm5qokG35hRaQBkTa1307"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_RL95veeXYiGW2vddbyd95440"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_xLminbzMi4m6H5EdS9Oj3770"
}
```


## USER (turn 20)

**source:** real-human

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
Phase number: 18 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yVX82LNqTZwJoTrSiHAc7950"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_CwQ8qzItYEwYae40SJ947011"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_P1XfEIg0M6MVo8WHy60m1550"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_mBk5TsPgX48xWNGxcTFV6354"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_nPiQ0Egr1VZQJRwpyVfj0941"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_2SWKH0rxT1yrhKWaipQx5558"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_YUHEnKWuqSnISt7tXnlH8264"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_6eWtjV4C3Y9rv743aAvi4414"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_DGJIkCSxZRyeqsZ5HFHk3839"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 18 pattern mapping",
  "subagent_type": "gsd-pattern-mapper",
  "task_id": "ses_1b988a24cffe7QuhojjK3VOY3W"
}
```

**Output:** (pruned)
```
task_id: ses_1b988a24cffe7QuhojjK3VOY3W
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_sZiDa6fKBRlbUF5qyxVA4919"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_BXzu7ep6JSpZ6PfJPuxz6088"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_hNf8pXkvpV974qNwev5u7605"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Plan Phase 18",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1b986bc24ffenp6omiUSfP3w8T"
}
```

**Output:** (pruned)
```
task_id: ses_1b986bc24ffenp6omiUSfP3w8T
```


### Tool: task

**Input:**
```json
{
  "description": "Verify Phase 18 plans",
  "subagent_type": "gsd-plan-checker",
  "task_id": "ses_1b9839f80ffeOxcw9Slb4Qp42c"
}
```

**Output:** (pruned)
```
task_id: ses_1b9839f80ffeOxcw9Slb4Qp42c
```


## USER (turn 21)

**source:** real-human

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
Phase number: 18 (optional — auto-detects next unplanned phase if omitted)

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

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fzirf7T6lW2Y7V27xrsi5667"
}
```


### Tool: question

**Input:**
```json
{
  "callID": "call_00_AIjYvrQeOWnjmatfzX6b9696"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ecuZE1tks8Q0QuaY9WYE9389"
}
```


## USER (turn 22)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `18`
- If a documented flag is absent from `18`, treat it as inactive

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
Phase: 18

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `18`:**
- `--wave N` is active only if the literal `--wave` token is present in `18`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `18`
- `--interactive` is active only if the literal `--interactive` token is present in `18`
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

## COMPACTED (2026-05-20T17:47:09.589Z)

**raw_event:**

```json
{
  "id": "evt_e467f9f84001BR6z7GOiIDoPJJ",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1bb1cf1e0ffe478KZ4HwJgUCN6"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_K71oBBEM3mbm36KEjpEn8454"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_rzwyPuGByqBY7gUTFjJM3492"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_Uxl2ELBb8nxAKM3fRyEk6266"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_i5DR0fdz60Kzb3m44oMa7937"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-02-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-03-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-04-PLAN.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_04_KBFzecyPX3zoOkFN0uYt8688"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_05_j7f2qLFZXOiH1GMR2A7n1665"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7LB3l5a3ICy3bOr30Rlk9740"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_V3YQgdfkU3yOvEfm8maV3218"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 18-01 dead code deletion",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b97f5945ffe0XwctcwnSkmJ94"
}
```

**Output:** (pruned)
```
task_id: ses_1b97f5945ffe0XwctcwnSkmJ94
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 18-02 storeCache TDD extraction",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b979b01fffeiYiYtJrSc76yWC"
}
```

**Output:** (pruned)
```
task_id: ses_1b979b01fffeiYiYtJrSc76yWC
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 18-03 barrel narrowing",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b973bf50ffem77tHPh8x63f4t"
}
```

**Output:** (pruned)
```
task_id: ses_1b973bf50ffem77tHPh8x63f4t
```


### Tool: task

**Input:**
```json
{
  "description": "Execute plan 18-04 manifest sync",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b9712e07ffeCS6lD5wPWGdsKJ"
}
```

**Output:** (pruned)
```
task_id: ses_1b9712e07ffeCS6lD5wPWGdsKJ
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_if4Cvy5Zy8sruJTYW1lx6506"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_M763f9gDcGnbT84hilr43099"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_NJAVsG0seIqV9AgOPB630018"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_zZk3tnbm5Tfryo7h7uc59850"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ObjQ2d84qVcgv2CVgmSb9853"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_oUr9o9JZLNKGeJ4GQp4B8137"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_NhU8dLkaF7HIt3AWMeyp8242"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_VFaZ3fltqhk3XOw0aoLa3834"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_xcX11NhtciuyhKTdyqvq1547"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jrfURJWXX2pZmFMsfw8j7308"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_CbNiI1hfzkQue1F6SR1s8934"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JzPhTVs6ETlUOUVkhoKU7139"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_ic9urhozrDMJAzzZadib7131"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zbQrDOLcPljEuFY1aOLr3423"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JkiTz3rMJvuhNG8N7EHN8754"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_qT8wWnRb5t52HUOYIDDb2896"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_mFc9w6gzoU2XNjBdbklk1325"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Np9oGXhPVnNNTh5FEkvh2075"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_OirhSw3yYcSXXzURGi1g7429"
}
```


## USER (turn 23)

**source:** real-human

route gsd gatekeeping và gsd agents để check xem các thay đổi vừa rồi có ảnh hưởng gì và mang tới kết quả có gây ảnh hưởng gì tới integration của toàn project hay không cho cả phase 17 và 18

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Ny9GNRkQin4Dap4yA9fh9560"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-gate-orchestrator"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-gate-orchestrator
```


### Tool: skill

**Input:**
```json
{
  "name": "gate-l3-lifecycle-integration"
}
```

**Output:** (pruned)
```
# Skill: gate-l3-lifecycle-integration
```


### Tool: skill

**Input:**
```json
{
  "name": "gate-l3-evidence-truth"
}
```

**Output:** (pruned)
```
# Skill: gate-l3-evidence-truth
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_oqASXGUQnVkia3JessGU6550"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Goal-backward verification Phase 18",
  "subagent_type": "gsd-verifier",
  "task_id": "ses_1b969a878ffeQDb1sBMgoZVLTA"
}
```

**Output:** (pruned)
```
task_id: ses_1b969a878ffeQDb1sBMgoZVLTA
```


### Tool: task

**Input:**
```json
{
  "description": "Cross-phase integration check Phase 17+18",
  "subagent_type": "gsd-integration-checker",
  "task_id": "ses_1b969b445ffepx1n1yHAIN0roa"
}
```

**Output:** (pruned)
```
task_id: ses_1b969b445ffepx1n1yHAIN0roa
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_PB8zLKKtRWaIANwYAGPW0056"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Code review Phase 18 changed source files",
  "subagent_type": "gsd-code-reviewer",
  "task_id": "ses_1b963e13fffeL2UVJG816xxg3I"
}
```

**Output:** (pruned)
```
task_id: ses_1b963e13fffeL2UVJG816xxg3I
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_WYlrPJD45nflBn48GmjS6216"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_a1o7eKzAV8ySPBPCAPPo4121"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_l0SNmhdIjo1njTgFPmej8173"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ET_UBAn7CxFenQkddTDwanV2916"
}
```


## USER (turn 24)

**source:** real-human

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

<## Chèn thêm vài gsd phases trước phase 19 và 20 do các lý do sau

- Các phần hard implementations trong src cần phải được đi qua từng phần để tái cấu trúc lại từ refactor - migrate - consolidate hoặc thậm chí là bỏ đi và revamp lại do đòi hỏi của tính nhất quán trong PHILOSOPHY của Hivemind /Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md
- Bạn có thể hiểu thêm qua [CONCERN.md](http://CONCERN.md) và các cấu trúc được phân tích trước đó trong .planning/codebase → vì thế chúng ta cần một bước đi theo trình tự “hard” trước và “soft” sau (soft tức các primitives có thể điều chỉnh cho phù hợp với hard sau) và đi theo một cách trình tự có thể kiểm soát được
- Có thể bắt đầu bằng những thứ khắc phục được trước mà không destructive hay liên quan tới logics và ecosystem liên đới quá nhiều được nhắc đến trong [CONCERN.md](http://CONCERN.md) - đi theo cơ sở audit trước → truth verification và integration và quyết định giải quyết
- Sau khi các phần khắc phục không destructive đó đã được giải quyết xong chúng ta sẽ đi giải quyết qua từng cụm theo lifecycles - actors và consumers - phân vùng features theo cớ chế hoạt động của harness và bắt đầu từ đầu nguồn của user journey → phần này rất phức tạp vì nó chồng chéo và có nhiều sự hiểu lầm từ ban đầu giữa 2 linages, khai thắc user intents và context chưa tốt (my intents) và còn bỏ lửng cũng như logics conflicts rất cao do lúc trước tôi để tự động hoá rất nhiều (bạn có thể xem thêm trong .planning/archive và .planning/phases, đồng thời phân tích life cycles, actors, mechanism harness features và stacks   qua implementation trong src/** so với `dist` thì sẽ thấy mớ hỗn mang này) vì thế ở giai đoạn này nó sẽ phải đi theo dạng systematic approach - theo nodes và hierarchy cũng có thể là có traversal quay ngược lại điều chỉnh vì tính liên đới của chức năng, tools, hooks, engines, schema, và giữa internal và external interfaces và implementation khá hỗn loạn nên các phases theo sau này sẽ liên kết dependent với nhau rất chặt chẽ và tích cực không những khai thác intents và context mà còn phải xác minh với specs, patterns, và research  cũng như synthesis từ các nguồn mà tôi đem ra ở đây /Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md và bám sát chặt chẽ vào package.json (cho việc thêm, bớt, update etc)
- Nhân tiện đây tôi cũng cần bạn update lại stack cho package.json để đảm bảo nó là mới nhất và up-to-date >

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_FdBouguEGuiNX4dWmeNj4921"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_05_irRjKFJD1ZBZyRtMIyMu0216"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/ARCHITECTURE.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_V4YCKNqLYeT9oFT6Sdx26957"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_4l2n0z1fcwdPHpWEYOvP5697"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_NC97jpiepUNaPfqLnQle0626"
}
```


## USER (turn 25)

**source:** real-human

phân tích sâu toàn bộ những files, modules chứa trong src chưa đủ vì interfaces qua tools tôi thấy rất nhiều trong đó có nhiều thứ vô lý chưa kể injection modules, life cyclles của người dùng đọc lại yêu cầu ## Chèn thêm vài gsd phases trước phase 19 và 20 do các lý do sau

- Các phần hard implementations trong src cần phải được đi qua từng phần để tái cấu trúc lại từ refactor - migrate - consolidate hoặc thậm chí là bỏ đi và revamp lại do đòi hỏi của tính nhất quán trong PHILOSOPHY của Hivemind /Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md
- Bạn có thể hiểu thêm qua [CONCERN.md](http://CONCERN.md) và các cấu trúc được phân tích trước đó trong .planning/codebase → vì thế chúng ta cần một bước đi theo trình tự “hard” trước và “soft” sau (soft tức các primitives có thể điều chỉnh cho phù hợp với hard sau) và đi theo một cách trình tự có thể kiểm soát được
- Có thể bắt đầu bằng những thứ khắc phục được trước mà không destructive hay liên quan tới logics và ecosystem liên đới quá nhiều được nhắc đến trong [CONCERN.md](http://CONCERN.md) - đi theo cơ sở audit trước → truth verification và integration và quyết định giải quyết
- Sau khi các phần khắc phục không destructive đó đã được giải quyết xong chúng ta sẽ đi giải quyết qua từng cụm theo lifecycles - actors và consumers - phân vùng features theo cớ chế hoạt động của harness và bắt đầu từ đầu nguồn của user journey → phần này rất phức tạp vì nó chồng chéo và có nhiều sự hiểu lầm từ ban đầu giữa 2 linages, khai thắc user intents và context chưa tốt (my intents) và còn bỏ lửng cũng như logics conflicts rất cao do lúc trước tôi để tự động hoá rất nhiều (bạn có thể xem thêm trong .planning/archive và .planning/phases, đồng thời phân tích life cycles, actors, mechanism harness features và stacks   qua implementation trong src/** so với `dist` thì sẽ thấy mớ hỗn mang này) vì thế ở giai đoạn này nó sẽ phải đi theo dạng systematic approach - theo nodes và hierarchy cũng có thể là có traversal quay ngược lại điều chỉnh vì tính liên đới của chức năng, tools, hooks, engines, schema, và giữa internal và external interfaces và implementation khá hỗn loạn nên các phases theo sau này sẽ liên kết dependent với nhau rất chặt chẽ và tích cực không những khai thác intents và context mà còn phải xác minh với specs, patterns, và research  cũng như synthesis từ các nguồn mà tôi đem ra ở đây /Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md và bám sát chặt chẽ vào package.json (cho việc thêm, bớt, update etc)
- Nhân tiện đây tôi cũng cần bạn update lại stack cho package.json để đảm bảo nó là mới nhất và up-to-date 

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_2HNVN16rRDPcwNS0ugAc6007"
}
```


## USER (turn 26)

**source:** real-human

@gsd-domain-researcher @gsd-phase-researcher 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-domain-researcher
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-phase-researcher

### Tool: task

**Input:**
```json
{
  "description": "Deep-analyze src/ tool/hook/plugin patterns",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b9519650ffe8fKd9k472GxCVV"
}
```

**Output:** (pruned)
```
task_id: ses_1b9519650ffe8fKd9k472GxCVV
```


## USER (turn 27)

**source:** real-human

thực hiện lại 2 task bị fail delegation phía dưới

## USER (turn 28)

**source:** real-human

@gsd-nyquist-auditor kiếm các gsd agents liên quan tới audit, review synthesis etc
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-nyquist-auditor

### Tool: task

**Input:**
```json
{
  "description": "Research OpenCode SDK/Plugin API",
  "subagent_type": "gsd-ai-researcher",
  "task_id": "ses_1b951a9e0ffeZu8wN7Ivgvpvs7"
}
```

**Output:** (pruned)
```
task_id: ses_1b951a9e0ffeZu8wN7Ivgvpvs7
```


## USER (turn 29)

**source:** real-human

nếu cần thực hiện thêm gì hãy deep investigate và research sau đó delegate cho synthesis và advisor agents

## USER (turn 30)

**source:** real-human

nghêm cấm các hành động tự đưa ra quyết định hay đề xuất trực tiếp không qua specialist - you are orchestrator 

### Tool: task

**Input:**
```json
{
  "description": "Analyze .planning/archive patterns history",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b94ced67ffeVBiWo7HTULIKaX"
}
```

**Output:** (pruned)
```
task_id: ses_1b94ced67ffeVBiWo7HTULIKaX
```


### Tool: task

**Input:**
```json
{
  "description": "Research package.json deps latest versions",
  "subagent_type": "general",
  "task_id": "ses_1b94cf786ffeb8L9myaz3Y5Zls"
}
```

**Output:** (pruned)
```
task_id: ses_1b94cf786ffeb8L9myaz3Y5Zls
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_xwNUpfYlyZNg9uwrreAX4669"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_y3mKaMN49mNxu2mlAW2W4723"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_DXhBo7252zCtpL5BgVTT1450"
}
```


## USER (turn 31)

**source:** real-human

@gsd-research-synthesizer 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-research-synthesizer

## USER (turn 32)

**source:** real-human

và @gsd-advisor-researcher 
 Use the above message and context to generate a prompt and call the task tool with subagent: gsd-advisor-researcher

### Tool: task

**Input:**
```json
{
  "description": "Synthesize all research findings comprehensive",
  "subagent_type": "gsd-domain-researcher",
  "task_id": "ses_1b94a85cbffeih5ur54EBxIJ75"
}
```

**Output:** (pruned)
```
task_id: ses_1b94a85cbffeih5ur54EBxIJ75
```


### Tool: task

**Input:**
```json
{
  "description": "Research OpenCode SDK v2 vs v1 API diff",
  "subagent_type": "gsd-domain-researcher",
  "task_id": "ses_1b94a7a90ffebnt5fAS86QgEsT"
}
```

**Output:** (pruned)
```
task_id: ses_1b94a7a90ffebnt5fAS86QgEsT
```


## USER (turn 33)

**source:** real-human

đúng agents please

## USER (turn 34)

**source:** real-human

có một mục là side-car sẽ cần dùng tới json render mục đó vân chưa phảt triên

### Tool: task

**Input:**
```json
{
  "description": "Analyze gray-area decisions for restructuring",
  "subagent_type": "gsd-advisor-researcher",
  "task_id": "ses_1b949390effew4QpCnS7k3DA7k"
}
```

**Output:** (pruned)
```
task_id: ses_1b949390effew4QpCnS7k3DA7k
```


### Tool: task

**Input:**
```json
{
  "description": "Synthesize all research into comprehensive report",
  "subagent_type": "gsd-research-synthesizer",
  "task_id": "ses_1b949569affekzY9Jfi4WDEcOG"
}
```

**Output:** (pruned)
```
task_id: ses_1b949569affekzY9Jfi4WDEcOG
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Kb4jscNBQiTgq4RC4yn64076"
}
```


## USER (turn 35)

**source:** real-human

thiếu rồi có tới 4 artifacts lận tìm và đọc rồi tổng kết lại

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_VWO3gW8pvw2TlZeDUpZ10951"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_VdrvHCDFrLmDFBDTH1jC5914"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_GWmqcV4WFJV7kooQtsAV3391"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_UUtiJkJNIdTLdiC1P67x5004"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_CyE0TMEaItO25XEN8HHf9728"
}
```


## USER (turn 36)

**source:** real-human

hãy add gsd phases và đưa các nội dung này vào và để xử lý từng phần lần lượt theo yêu cầu này ```## Chèn thêm vài gsd phases trước phase 19 và 20 do các lý do sau

- Các phần hard implementations trong src cần phải được đi qua từng phần để tái cấu trúc lại từ refactor - migrate - consolidate hoặc thậm chí là bỏ đi và revamp lại do đòi hỏi của tính nhất quán trong PHILOSOPHY của Hivemind /Users/apple/hivemind-plugin-private/docs/philosophy/HIVEMIND-PHILOSOPHY.md
- Bạn có thể hiểu thêm qua [CONCERN.md](http://CONCERN.md) và các cấu trúc được phân tích trước đó trong .planning/codebase → vì thế chúng ta cần một bước đi theo trình tự “hard” trước và “soft” sau (soft tức các primitives có thể điều chỉnh cho phù hợp với hard sau) và đi theo một cách trình tự có thể kiểm soát được
- Có thể bắt đầu bằng những thứ khắc phục được trước mà không destructive hay liên quan tới logics và ecosystem liên đới quá nhiều được nhắc đến trong [CONCERN.md](http://CONCERN.md) - đi theo cơ sở audit trước → truth verification và integration và quyết định giải quyết
- Sau khi các phần khắc phục không destructive đó đã được giải quyết xong chúng ta sẽ đi giải quyết qua từng cụm theo lifecycles - actors và consumers - phân vùng features theo cớ chế hoạt động của harness và bắt đầu từ đầu nguồn của user journey → phần này rất phức tạp vì nó chồng chéo và có nhiều sự hiểu lầm từ ban đầu giữa 2 linages, khai thắc user intents và context chưa tốt (my intents) và còn bỏ lửng cũng như logics conflicts rất cao do lúc trước tôi để tự động hoá rất nhiều (bạn có thể xem thêm trong .planning/archive và .planning/phases, đồng thời phân tích life cycles, actors, mechanism harness features và stacks   qua implementation trong src/** so với `dist` thì sẽ thấy mớ hỗn mang này) vì thế ở giai đoạn này nó sẽ phải đi theo dạng systematic approach - theo nodes và hierarchy cũng có thể là có traversal quay ngược lại điều chỉnh vì tính liên đới của chức năng, tools, hooks, engines, schema, và giữa internal và external interfaces và implementation khá hỗn loạn nên các phases theo sau này sẽ liên kết dependent với nhau rất chặt chẽ và tích cực không những khai thác intents và context mà còn phải xác minh với specs, patterns, và research  cũng như synthesis từ các nguồn mà tôi đem ra ở đây /Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md và bám sát chặt chẽ vào package.json (cho việc thêm, bớt, update etc)
- Nhân tiện đây tôi cũng cần bạn update lại stack cho package.json để đảm bảo nó là mới nhất và up-to-date ```

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-phase
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_00_yoOaLxXvRmKQm9qPR5wv0047"
}
```


## USER (turn 37)

**source:** real-human

<objective>
Manage phases in ROADMAP.md with a single consolidated command.

Mode routing:
- **default** (no flag): Add a new integer phase to the end of the current milestone → add-phase workflow
- **--insert**: Insert urgent work as a decimal phase (e.g., 72.1) between existing phases → insert-phase workflow
- **--remove**: Remove a future phase and renumber subsequent phases → remove-phase workflow
- **--edit**: Edit any field of an existing phase in place → edit-phase workflow
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Add new integer phase at end of milestone | add-phase |
| --insert | Insert decimal phase (e.g., 72.1) after specified phase | insert-phase |
| --remove | Remove future phase, renumber subsequent | remove-phase |
| --edit | Edit fields of existing phase in place | edit-phase |

</routing>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
</execution_context>

<context>
Arguments: --insert 18 Hard Restructuring 19-01: Non-Destructive Cleanup — dead schema, stale dist, extra hooks

Parse the first token of --insert 18 Hard Restructuring 19-01: Non-Destructive Cleanup — dead schema, stale dist, extra hooks:
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of --insert 18 Hard Restructuring 19-01: Non-Destructive Cleanup — dead schema, stale dist, extra hooks (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from --insert 18 Hard Restructuring 19-01: Non-Destructive Cleanup — dead schema, stale dist, extra hooks.
2. Load and execute the appropriate workflow end-to-end based on the routing table above.
3. Preserve all validation gates from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `/gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `/gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: /gsd-add-phase <description>
22: Example: /gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run /gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `/clear` then:
91: 
92: `/gsd-plan-phase {N}`
93: 
94: ---
95: 
96: **Also available:**
97: - `/gsd-add-phase <description>` — add another phase
98: - Review roadmap
99: 
100: ---
101: ```
102: </step>
103: 
104: </process>
105: 
106: <success_criteria>
107: - [ ] `gsd-sdk query phase.add` executed successfully
108: - [ ] Phase directory created
109: - [ ] Roadmap updated with new phase entry
110: - [ ] STATE.md updated with roadmap evolution note
111: - [ ] User informed of next steps
112: </success_criteria>

(End of file - total 112 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: integer phase number to insert after
14: - Remaining arguments: phase description
15: 
16: Example: `/gsd-insert-phase 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: /gsd-insert-phase <after> <description>
25: Example: /gsd-insert-phase 72 Fix critical auth bug
26: ```
27: 
28: Exit.
29: 
30: Validate first argument is an integer.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${after_phase}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: ```
45: Exit.
46: </step>
47: 
48: <step name="insert_phase">
49: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
50: 
51: ```bash
52: RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
53: ```
54: 
55: The CLI handles:
56: - Verifying target phase exists in ROADMAP.md
57: - Calculating next decimal phase number (checking existing decimals on disk)
58: - Generating slug from description
59: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
60: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
61: 
62: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
63: </step>
64: 
65: <step name="update_project_state">
66: Update STATE.md to reflect the inserted phase via SDK handlers (never raw
67: `Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
68: blocks direct STATE.md writes):
69: 
70: 1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
71:    `{decimal_phase}`:
72: 
73:    ```bash
74:    gsd-sdk query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd-plan-phase {decimal_phase}"}'
75:    ```
76: 
77:    (Adjust field names to whatever pointers STATE.md exposes — the handler
78:    reports which fields it matched.)
79: 
80: 2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
81:    `### Roadmap Evolution` subsection under `## Accumulated Context` if missing
82:    and dedupes identical entries:
83: 
84:    ```bash
85:    gsd-sdk query state.add-roadmap-evolution \
86:      --phase {decimal_phase} \
87:      --action inserted \
88:      --after {after_phase} \
89:      --note "{description}" \
90:      --urgent
91:    ```
92: 
93:    Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
94:    (or `{ added: false, reason: "duplicate", entry: ... }` on replay).
95: </step>
96: 
97: <step name="completion">
98: Present completion summary:
99: 
100: ```
101: Phase {decimal_phase} inserted after Phase {after_phase}:
102: - Description: {description}
103: - Directory: .planning/phases/{decimal-phase}-{slug}/
104: - Status: Not planned yet
105: - Marker: (INSERTED) - indicates urgent work
106: 
107: Roadmap updated: .planning/ROADMAP.md
108: Project state updated: .planning/STATE.md
109: 
110: ---
111: 
112: ## Next Up
113: 
114: **Phase {decimal_phase}: {description}** -- urgent insertion
115: 
116: `/clear` then:
117: 
118: `/gsd-plan-phase {decimal_phase}`
119: 
120: ---
121: 
122: **Also available:**
123: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
124: - Review roadmap
125: 
126: ---
127: ```
128: </step>
129: 
130: </process>
131: 
132: <anti_patterns>
133: 
134: - Don't use this for planned work at end of milestone (use /gsd-add-phase)
135: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
136: - Don't renumber existing phases
137: - Don't modify the target phase content
138: - Don't create plans yet (that's /gsd-plan-phase)
139: - Don't commit changes (user decides when to commit)
140: </anti_patterns>
141: 
142: <success_criteria>
143: Phase insertion is complete when:
144: 
145: - [ ] `gsd-sdk query phase.insert` executed successfully
146: - [ ] Phase directory created
147: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
148: - [ ] `gsd-sdk query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
149: - [ ] `gsd-sdk query state.patch` returned matched next-phase pointer field(s)
150: - [ ] User informed of next steps and dependency implications
151: </success_criteria>

(End of file - total 151 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Remove an unstarted future phase from the project roadmap, delete its directory, renumber all subsequent phases to maintain a clean linear sequence, and commit the change. The git commit serves as the historical record of removal.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - Argument is the phase number to remove (integer or decimal)
14: - Example: `/gsd-remove-phase 17` → phase = 17
15: - Example: `/gsd-remove-phase 16.1` → phase = 16.1
16: 
17: If no argument provided:
18: 
19: ```
20: ERROR: Phase number required
21: Usage: /gsd-remove-phase <phase-number>
22: Example: /gsd-remove-phase 17
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "${target}")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.
37: 
38: Also read STATE.md and ROADMAP.md content for parsing current position.
39: </step>
40: 
41: <step name="validate_future_phase">
42: Verify the phase is a future phase (not started):
43: 
44: 1. Compare target phase to current phase from STATE.md
45: 2. Target must be > current phase number
46: 
47: If target <= current phase:
48: 
49: ```
50: ERROR: Cannot remove Phase {target}
51: 
52: Only future phases can be removed:
53: - Current phase: {current}
54: - Phase {target} is current or completed
55: 
56: To abandon current work, use /gsd-pause-work instead.
57: ```
58: 
59: Exit.
60: </step>
61: 
62: <step name="confirm_removal">
63: Present removal summary and confirm:
64: 
65: ```
66: Removing Phase {target}: {Name}
67: 
68: This will:
69: - Delete: .planning/phases/{target}-{slug}/
70: - Renumber all subsequent phases
71: - Update: ROADMAP.md, STATE.md
72: 
73: Proceed? (y/n)
74: ```
75: 
76: Wait for confirmation.
77: </step>
78: 
79: <step name="execute_removal">
80: **Delegate the entire removal operation to `gsd-sdk query phase.remove`:**
81: 
82: ```bash
83: RESULT=$(gsd-sdk query phase.remove "${target}")
84: ```
85: 
86: If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:
87: 
88: ```bash
89: RESULT=$(gsd-sdk query phase.remove "${target}" --force)
90: ```
91: 
92: The CLI handles:
93: - Deleting the phase directory
94: - Renumbering all subsequent directories (in reverse order to avoid conflicts)
95: - Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
96: - Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
97: - Updating STATE.md (decrementing phase count)
98: 
99: Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
100: </step>
101: 
102: <step name="commit">
103: Stage and commit the removal:
104: 
105: ```bash
106: gsd-sdk query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
107: ```
108: 
109: The commit message preserves the historical record of what was removed.
110: </step>
111: 
112: <step name="completion">
113: Present completion summary:
114: 
115: ```
116: Phase {target} ({original-name}) removed.
117: 
118: Changes:
119: - Deleted: .planning/phases/{target}-{slug}/
120: - Renumbered: {N} directories and {M} files
121: - Updated: ROADMAP.md, STATE.md
122: - Committed: chore: remove phase {target} ({original-name})
123: 
124: ---
125: 
126: ## What's Next
127: 
128: Would you like to:
129: - `/gsd-progress` — see updated roadmap status
130: - Continue with current phase
131: - Review roadmap
132: 
133: ---
134: ```
135: </step>
136: 
137: </process>
138: 
139: <anti_patterns>
140: 
141: - Don't remove completed phases (have SUMMARY.md files) without --force
142: - Don't remove current or past phases
143: - Don't manually renumber — use `gsd-sdk query phase.remove` which handles all renumbering
144: - Don't add "removed phase" notes to STATE.md — git commit is the record
145: - Don't modify completed phase directories
146: </anti_patterns>
147: 
148: <success_criteria>
149: Phase removal is complete when:
150: 
151: - [ ] Target phase validated as future/unstarted
152: - [ ] `gsd-sdk query phase.remove` executed successfully
153: - [ ] Changes committed with descriptive message
154: - [ ] User informed of changes
155: </success_criteria>

(End of file - total 155 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Edit any field of an existing phase in ROADMAP.md in place. The phase number and position are always preserved. Guarded against in-progress and completed phases unless --force is passed. Validates depends_on references before writing. Shows a diff and requests confirmation before writing.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: phase number to edit (integer or decimal)
14: - Optional flag: --force (allow editing in_progress/completed phases)
15: 
16: Examples:
17:   `/gsd-edit-phase 5`       → phase = 5, force = false
18:   `/gsd-edit-phase 5 --force` → phase = 5, force = true
19:   `/gsd-edit-phase 12.1`    → phase = 12.1, force = false
20: 
21: If no argument provided:
22: 
23: ```
24: ERROR: Phase number required
25: Usage: /gsd-edit-phase <phase-number> [--force]
26: Example: /gsd-edit-phase 5
27: Example: /gsd-edit-phase 5 --force
28: ```
29: 
30: Exit.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${target}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: Run /gsd-new-project to initialize.
45: ```
46: Exit.
47: </step>
48: 
49: <step name="load_phase">
50: Read the current phase section from ROADMAP.md:
51: 
52: ```bash
53: PHASE_DATA=$(gsd-sdk query roadmap get-phase "${target}")
54: ```
55: 
56: Parse the JSON result. If `found` is false:
57: 
58: ```
59: ERROR: Phase {target} not found in ROADMAP.md
60: 
61: Available phases can be seen with /gsd-progress.
62: ```
63: 
64: Exit.
65: 
66: Extract from the result:
67: - `phase_name` — the phase title
68: - `goal` — the phase goal/description
69: - `success_criteria` — array of criteria
70: - `section` — full raw section text (preserves depends_on, requirements, plans, etc.)
71: 
72: Also parse the full section text to extract additional fields not in the SDK result:
73: - `depends_on` — from `**Depends on:** ...` or `**Depends on**: ...` line
74: - `requirements` — from `**Requirements:** ...` block if present
75: </step>
76: 
77: <step name="check_phase_status">
78: Determine the phase status from disk. Compare against STATE.md current phase:
79: 
80: ```bash
81: ANALYZE=$(gsd-sdk query roadmap analyze)
82: ```
83: 
84: Find the phase entry in the `phases` array. Extract `disk_status`.
85: 
86: Map disk_status to a user-friendly status:
87: - `complete` → status = `completed`
88: - `planned` or `partial` → status = `in_progress`
89: - `empty`, `no_directory`, `discussed`, `researched` → status = `future`
90: 
91: If status is `in_progress` or `completed` AND `--force` was NOT passed:
92: 
93: ```
94: ERROR: Cannot edit Phase {target} — status is {status}
95: 
96: Editing an in-progress or completed phase may invalidate executed plans.
97: 
98: To edit anyway, run:
99:   /gsd-edit-phase {target} --force
100: ```
101: 
102: Exit.
103: 
104: If `--force` was passed and status is `in_progress` or `completed`, continue with a warning printed to the user:
105: 
106: ```
107: WARNING: Editing Phase {target} which is {status}. Proceeding due to --force.
108: ```
109: </step>
110: 
111: <step name="present_current_values">
112: Display the current phase fields clearly:
113: 
114: ```
115: Current values for Phase {target}: {phase_name}
116: 
117: Title:            {phase_name}
118: Goal:             {goal}
119: Depends on:       {depends_on or "(none)"}
120: Requirements:     {requirements or "(none)"}
121: Success Criteria:
122:   1. {criterion_1}
123:   2. {criterion_2}
124:   ...
125: ```
126: 
127: Then ask the user what they want to change:
128: 
129: ```
130: What would you like to do?
131: 
132:   [1] Edit specific fields (title, goal, depends_on, requirements, success_criteria)
133:   [2] Regenerate all fields from a clarified intent
134:   [3] Cancel
135: 
136: Enter choice (1, 2, or 3):
137: ```
138: 
139: Wait for user input.
140: </step>
141: 
142: <step name="collect_edits">
143: 
144: **If user chose [3] Cancel:** Exit cleanly.
145: 
146: **If user chose [1] Edit specific fields:**
147: 
148: Ask which fields to edit. For each field the user wants to change, prompt for the new value. Only fields the user explicitly answers become updates; empty answers preserve the existing value.
149: 
150: ```
151: Which fields do you want to update? (comma-separated or "all")
152: Options: title, goal, depends_on, requirements, success_criteria
153: ```
154: 
155: For each selected field, ask:
156: 
157: ```
158: New value for {field} [current: {current_value}]:
159: ```
160: 
161: Build an `updates` map of {field → new_value} for non-empty answers.
162: 
163: **If user chose [2] Regenerate all from clarified intent:**
164: 
165: Ask the user:
166: 
167: ```
168: Describe the revised intent for Phase {target} (replace the current description):
169: ```
170: 
171: Wait for user input. Use the clarified intent to rewrite all fields:
172: - Generate a clear, concise `title` from the intent
173: - Write a complete `goal` statement
174: - Produce updated `requirements` if the original had them
175: - Generate `success_criteria` (3-5 measurable criteria)
176: - Preserve `depends_on` unless the user explicitly mentioned changing it
177: </step>
178: 
179: <step name="validate_depends_on">
180: If `depends_on` is being updated (or preserved as non-empty), validate that every referenced phase number exists in ROADMAP.md:
181: 
182: ```bash
183: ALL_PHASES=$(gsd-sdk query roadmap analyze)
184: ```
185: 
186: Parse the `phases` array to get all valid phase numbers.
187: 
188: For each phase number referenced in `depends_on`:
189: - Normalize it (strip whitespace, "Phase" prefix if present)
190: - Check it is in the valid phase numbers set
191: - It must not reference itself (phase {target})
192: 
193: If any reference is invalid:
194: 
195: ```
196: ERROR: depends_on references invalid phase(s): {bad_refs}
197: 
198: Valid phase numbers: {valid_list}
199: 
200: Fix the depends_on field and try again.
201: ```
202: 
203: Exit (do not write).
204: </step>
205: 
206: <step name="show_diff_and_confirm">
207: Build the updated phase section by applying the changes to the original `section` text:
208: 
209: - For `title`: replace the heading text after `Phase {N}:`
210: - For `goal`: replace the `**Goal:**` line value
211: - For `depends_on`: replace or add the `**Depends on:**` line
212: - For `requirements`: replace or add the requirements block
213: - For `success_criteria`: replace the numbered list under `**Success Criteria**:`
214: - For full regeneration: rebuild the entire section from the new field values
215: 
216: Show a unified-style diff of old vs. new:
217: 
218: ```
219: Proposed changes to Phase {target}:
220: 
221: --- current
222: +++ updated
223: @@ ...
224: - **Goal:** {old_goal}
225: + **Goal:** {new_goal}
226: ...
227: 
228: Apply these changes? (y/n):
229: ```
230: 
231: Wait for confirmation. If the user says `n`, exit without writing.
232: </step>
233: 
234: <step name="write_updated_phase">
235: Write the updated phase back in place in ROADMAP.md.
236: 
237: Read the full ROADMAP.md content, locate the phase section by its header (`## Phase {N}:` or `### Phase {N}:`), and replace exactly the old section text with the new section text. All content before and after the section (including other phases, milestone headers, and the summary checklist) must be left unchanged.
238: 
239: After writing ROADMAP.md, update STATE.md Roadmap Evolution:
240: 
241: ```bash
242: gsd-sdk query state.add-roadmap-evolution \
243:   --phase {target} \
244:   --action edited \
245:   --note "edited fields: {changed_field_list}"
246: ```
247: </step>
248: 
249: <step name="completion">
250: Present completion summary:
251: 
252: ```
253: Phase {target} updated in ROADMAP.md.
254: 
255: Fields changed: {changed_field_list}
256: 
257: ---
258: 
259: ## What's Next
260: 
261: - `/gsd-progress` — view updated roadmap
262: - `/gsd-plan-phase {target}` — re-plan this phase (if needed)
263: - `/gsd-discuss-phase {target}` — discuss implementation approach
264: 
265: ---
266: ```
267: </step>
268: 
269: </process>
270: 
271: <anti_patterns>
272: - Don't renumber the phase — number and position must be preserved exactly
273: - Don't modify other phases when editing one
274: - Don't skip depends_on validation (invalid references block writes)
275: - Don't write without showing a diff and getting confirmation
276: - Don't edit in_progress/completed phases without --force
277: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
278: - Don't modify the phase directory structure — only ROADMAP.md changes
279: - Don't commit the change — that's the user's decision
280: </anti_patterns>
281: 
282: <success_criteria>
283: Edit-phase is complete when:
284: 
285: - [ ] Phase {target} found and loaded from ROADMAP.md
286: - [ ] Status check performed; in_progress/completed blocked without --force
287: - [ ] Current values presented to user
288: - [ ] User chose edit mode (specific fields or full regeneration)
289: - [ ] depends_on references validated; invalid references blocked
290: - [ ] Diff shown and confirmed by user
291: - [ ] Updated phase written back in place; number, position, and status preserved
292: - [ ] STATE.md Roadmap Evolution updated
293: - [ ] User informed of next steps
294: </success_criteria>

(End of file - total 294 lines)
</content>

### Tool: edit

**Input:**
```json
{
  "callID": "call_00_7UM9XkeVUtzg8SG7DPc34666"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8z13WzqYmXzUx6cXZzSs7478"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fUtNIpOlOCq6pVZd8ee57191"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eZMWURVozdb4UN4B3I7X5900"
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
  "callID": "call_00_y2pFFYPd3rENO8fp21el2318"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_f5ocbcQR0bpmGNPc0nqE7094"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_RJEPDoCDvh8WaKwJyrph0867"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_3NVYHZKgWa3tgveY8Xz79122"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_rIRRqJCGLygbh3O0MMfw4675"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_JAKb8hlIKOvlBGcrdFiB9638"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_2rPwm0Fc79bALxEgnCPU3862"
}
```


## USER (turn 38)

**source:** real-human

tôi chưa thấy phase nào giải quyết cái CLI rồi user config và các features rất nền tảng nhưng vẫn còn rất lỗi và thiếu hụt như routing , và qua bộ khng tools surfaces và schema thì có rất nhiều features gắn với nó đang được thiết kế rất bậy bạ và mỗi mục đều phải là một phase refactor và revamp toàn diện tôi đang track theo bảng này ```| Tool | Purpose | Key Actions |
|------|---------|------------|
| `session-tracker` | Query session state | list-sessions, filter-sessions, search-sessions, get-status, export-session, get-summary |
| `session-hierarchy` | Explore delegation structure | get-children, get-manifest, get-parent-chain, get-delegation-depth |
| `session-context` | Cross-session aggregation | aggregate({groupBy}), find-related, cross-reference, synthesize-context |
| `hivemind-session-view` | Unified cross-root view | get({sessionId}) |
| `delegation-status` | Poll delegation state | status, list |
| `delegate-task` | Create child session via SDK | dispatch (WaiterModel) |
| `hivemind-trajectory` | Query execution trajectory | inspect, traverse, attach, checkpoint, event, close |
| `hivemind-pressure` | Query runtime pressure | classify, detect, inspect-tool-catalog, attach-event |
| `hivemind-doc` | Read-only document intelligence | skim, skim-directory, read, chunk, search |
| `prompt-skim` | Fast prompt scan | word/lines/tokens count, URL extraction, path verify, complexity score |
| `prompt-analyze` | Deep prompt analysis | contradiction detection, vagueness, missing scope, clarity signals |
| `hivemind-sdk-supervisor` | Inspect SDK client health | health, heartbeat, diagnostics, readiness |
| `hivemind-command-engine` | Command discovery and routing | discover, analyze-contract, render-context, transform-messages, route-preview, list-commands |
| `hivemind-agent-work-create` | Create agent work contract | Contract with task boundary, surfaces, dependencies, evidence requirements |
| `hivemind-agent-work-export` | Export agent work contract | Export as JSON or Markdown |
| `configure-primitive` | Configure OpenCode primitives | compile, decompile, read, list, inspect for agents/commands/skills |
| `validate-restart` | Validate restart safety | Check discoverability, circular deps, missing refs, permission breaks |
| `bootstrap-init` | Initialize harness bootstrap | Create .hivemind surfaces and install primitive symlinks |
| `bootstrap-recover` | Recover bootstrap failures | Repair missing or broken symlinks | ``` đào sâu mở tất cả các folders và sub folders under src scan kỹ each and every file apple@MacBook-Pro-cua-Apple src % tree
.
├── AGENTS.md
├── cli
│   ├── commands
│   │   ├── doctor.ts
│   │   ├── help.ts
│   │   ├── init.ts
│   │   ├── recover.ts
│   │   └── version.ts
│   ├── discovery.ts
│   ├── index.ts
│   ├── renderer.ts
│   └── router.ts
├── config
│   ├── AGENTS.md
│   ├── compiler.ts
│   ├── subscriber.ts
│   └── workflow
│       ├── AGENTS.md
│       ├── index.ts
│       ├── workflow-guards.ts
│       ├── workflow-persistence.ts
│       ├── workflow-state.ts
│       └── workflow-types.ts
├── coordination
│   ├── AGENTS.md
│   ├── command-delegation
│   │   ├── AGENTS.md
│   │   └── handler.ts
│   ├── completion
│   │   ├── AGENTS.md
│   │   ├── detector.ts
│   │   └── notification-handler.ts
│   ├── concurrency
│   │   ├── AGENTS.md
│   │   └── queue.ts
│   ├── delegation
│   │   ├── agent-resolver.ts
│   │   ├── AGENTS.md
│   │   ├── completion-detector.ts
│   │   ├── coordinator.ts
│   │   ├── dispatcher.ts
│   │   ├── escalation-timer.ts
│   │   ├── lifecycle.ts
│   │   ├── manager-runtime.ts
│   │   ├── manager.ts
│   │   ├── monitor.ts
│   │   ├── notification-formatter.ts
│   │   ├── notification-router.ts
│   │   ├── resume-resolver.ts
│   │   ├── retry-handler.ts
│   │   ├── sdk-child-session-starter.ts
│   │   ├── slot-manager.ts
│   │   ├── state-machine.ts
│   │   ├── survival-kit.ts
│   │   └── types.ts
│   ├── sdk-delegation
│   │   ├── AGENTS.md
│   │   └── handler.ts
│   └── spawner
│       ├── agent-primitive-policy.ts
│       ├── AGENTS.md
│       ├── auto-loop.ts
│       ├── concurrency-key.ts
│       ├── parent-directory.ts
│       ├── ralph-loop.ts
│       ├── session-creator.ts
│       ├── spawn-request-builder.ts
│       ├── spawner
│       └── spawner-types.ts
├── features
│   ├── agent-work-contracts
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── operations.ts
│   │   ├── store.ts
│   │   └── types.ts
│   ├── AGENTS.md
│   ├── auto-loop
│   │   ├── index.ts
│   │   └── types.ts
│   ├── background-command
│   │   ├── AGENTS.md
│   │   └── pty
│   │       ├── bun-pty.d.ts
│   │       ├── pty-buffer.ts
│   │       ├── pty-manager.ts
│   │       ├── pty-runtime.ts
│   │       └── pty-types.ts
│   ├── bootstrap
│   │   ├── AGENTS.md
│   │   ├── control-plane
│   │   │   ├── gate-decision.ts
│   │   │   ├── gatekeeper.ts
│   │   │   └── index.ts
│   │   ├── cross-primitive-validator.ts
│   │   ├── framework-detector.ts
│   │   ├── primitive-loader.ts
│   │   ├── primitive-registry.ts
│   │   ├── primitive-scanners.ts
│   │   ├── runtime-validator.ts
│   │   └── structure.ts
│   ├── doc-intelligence
│   │   ├── AGENTS.md
│   │   ├── chunker.ts
│   │   ├── index.ts
│   │   ├── parser.ts
│   │   ├── router.ts
│   │   └── types.ts
│   ├── prompt-packet
│   │   ├── AGENTS.md
│   │   ├── compaction-preservation.ts
│   │   ├── delegation-packet.ts
│   │   ├── index.ts
│   │   └── kernel-packet.ts
│   ├── ralph-loop
│   │   ├── index.ts
│   │   └── types.ts
│   ├── runtime-pressure
│   │   ├── AGENTS.md
│   │   ├── authority-matrix.ts
│   │   ├── control-plane.ts
│   │   ├── index.ts
│   │   ├── model.ts
│   │   └── types.ts
│   ├── sdk-supervisor
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── types.ts
│   └── session-tracker
│       ├── AGENTS.md
│       ├── bootstrap.ts
│       ├── capture
│       │   ├── event-capture.ts
│       │   ├── message-capture.ts
│       │   └── tool-capture.ts
│       ├── child-recorder.ts
│       ├── classification.ts
│       ├── hooks
│       │   └── session-classification-hook.ts
│       ├── index.ts
│       ├── initialization.ts
│       ├── orphan-cleanup.ts
│       ├── persistence
│       │   ├── atomic-write.ts
│       │   ├── child-writer.ts
│       │   ├── hierarchy-index.ts
│       │   ├── hierarchy-manifest.ts
│       │   ├── orphan-quarantine.ts
│       │   ├── pending-dispatch-registry.ts
│       │   ├── project-index-writer.ts
│       │   ├── retry-queue.ts
│       │   ├── session-index-writer.ts
│       │   └── session-writer.ts
│       ├── project-continuity.ts
│       ├── recovery
│       │   └── session-recovery.ts
│       ├── session-router.ts
│       ├── tool-delegation.ts
│       ├── transform
│       │   ├── agent-transform.ts
│       │   └── schema-normalizer.ts
│       └── types.ts
├── harness
├── hooks
│   ├── AGENTS.md
│   ├── composition
│   │   ├── AGENTS.md
│   │   └── cqrs-boundary.ts
│   ├── guards
│   │   ├── AGENTS.md
│   │   ├── governance-block.ts
│   │   └── tool-guard-hooks.ts
│   ├── lifecycle
│   │   ├── AGENTS.md
│   │   ├── core-hooks.ts
│   │   └── session-hooks.ts
│   ├── observers
│   │   ├── AGENTS.md
│   │   ├── delegation-consumer.ts
│   │   ├── event-observers.ts
│   │   ├── session-entry-consumer.ts
│   │   ├── session-main-consumer.ts
│   │   └── session-tracker-consumer.ts
│   ├── transforms
│   │   ├── AGENTS.md
│   │   ├── chat-message-capture.ts
│   │   ├── tool-after-composer.ts
│   │   ├── tool-after-workflow.ts
│   │   └── tool-before-guard.ts
│   └── types.ts
├── index.ts
├── kernel
├── plugin.ts
├── routing
│   ├── AGENTS.md
│   ├── behavioral-profile
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── profiles.ts
│   │   ├── resolve-behavioral-profile.ts
│   │   └── types.ts
│   ├── command-engine
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── types.ts
│   └── session-entry
│       ├── AGENTS.md
│       ├── index.ts
│       ├── intake-gate.ts
│       ├── language-resolution.ts
│       ├── profile-resolver.ts
│       └── purpose-classifier.ts
├── schema-kernel
│   ├── agent-frontmatter.schema.ts
│   ├── agent-work-contract.schema.ts
│   ├── AGENTS.md
│   ├── bootstrap.schema.ts
│   ├── command-engine.schema.ts
│   ├── command-frontmatter.schema.ts
│   ├── config-precedence.schema.ts
│   ├── doc-intelligence.schema.ts
│   ├── generate-config-json-schema.ts
│   ├── hivemind-configs.schema.ts
│   ├── index.ts
│   ├── mcp-server.schema.ts
│   ├── permission.schema.ts
│   ├── prompt-enhance.schema.ts
│   ├── runtime-pressure.schema.ts
│   ├── sdk-supervisor.schema.ts
│   ├── session-tracker.schema.ts
│   ├── session-view.schema.ts
│   ├── skill-metadata.schema.ts
│   ├── tool-definition.schema.ts
│   └── trajectory.schema.ts
├── shared
│   ├── AGENTS.md
│   ├── app-api.ts
│   ├── helpers.ts
│   ├── plugin-tool-output-summary.ts
│   ├── runtime-policy.ts
│   ├── runtime.ts
│   ├── security
│   │   ├── path-scope.ts
│   │   └── redaction.ts
│   ├── session-api.ts
│   ├── state.ts
│   ├── task-status.ts
│   ├── tool-helpers.ts
│   ├── tool-response.ts
│   ├── types.ts
│   └── workspace-runtime-policy.ts
├── sidecar
│   └── readonly-state.ts
├── task-management
│   ├── AGENTS.md
│   ├── continuity
│   │   ├── AGENTS.md
│   │   ├── delegation-persistence.ts
│   │   ├── index.ts
│   │   └── store-cache.ts
│   ├── journal
│   │   ├── AGENTS.md
│   │   ├── execution-lineage.ts
│   │   ├── index.ts
│   │   ├── query.ts
│   │   └── replay.ts
│   ├── lifecycle
│   │   ├── AGENTS.md
│   │   └── index.ts
│   └── trajectory
│       ├── AGENTS.md
│       ├── index.ts
│       ├── ledger.ts
│       ├── store-operations.ts
│       └── types.ts
└── tools
    ├── AGENTS.md
    ├── config
    │   ├── AGENTS.md
    │   ├── bootstrap-init.ts
    │   ├── bootstrap-recover.ts
    │   ├── configure-primitive-paths.ts
    │   ├── configure-primitive.ts
    │   └── validate-restart.ts
    ├── delegation
    │   ├── AGENTS.md
    │   ├── delegate-task.ts
    │   ├── delegation-status.ts
    │   └── types.ts
    ├── hivemind
    │   ├── AGENTS.md
    │   ├── hivemind-agent-work.ts
    │   ├── hivemind-command-engine.ts
    │   ├── hivemind-doc.ts
    │   ├── hivemind-pressure.ts
    │   ├── hivemind-sdk-supervisor.ts
    │   ├── hivemind-session-view.ts
    │   ├── hivemind-trajectory.ts
    │   ├── run-background-command.ts
    │   ├── session-context.ts
    │   ├── session-hierarchy.ts
    │   └── session-tracker.ts
    ├── prompt
    │   ├── AGENTS.md
    │   ├── prompt-analyze
    │   │   ├── index.ts
    │   │   ├── tools.ts
    │   │   └── types.ts
    │   └── prompt-skim
    │       ├── index.ts
    │       ├── tools.ts
    │       └── types.ts
    └── session
        ├── AGENTS.md
        ├── execute-slash-command.ts
        ├── session-journal-export.ts
        └── session-patch
            ├── index.ts
            ├── tools.ts
            └── types.ts

61 directories, 260 files
apple@MacBook-Pro-cua-Apple src %  có thể delegate song song bao nhiêu luồng cũng được nhưng tôi muốn một quy trình phân tích toàn bộ không sơ sài 

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_VZlGovBw0KpXKxueB3Ep6136"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: routing CLI config",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c5fa7ffeWbmcwPhANxPxR3"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c5fa7ffeWbmcwPhANxPxR3
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: all 22 tools under src/tools",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c726bffeSSU1Zy23loFJY8"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c726bffeSSU1Zy23loFJY8
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: coordination + hooks",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c2ff8ffevnNYO6YrKzos8H"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c2ff8ffevnNYO6YrKzos8H
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: features + session-tracker",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c45fbffeg6XHLXDLIm0NJl"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c45fbffeg6XHLXDLIm0NJl
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: plugin shared sidecar",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c051dffexb8uwDPCkqQ5x3"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c051dffexb8uwDPCkqQ5x3
```


### Tool: task

**Input:**
```json
{
  "description": "Deep analysis: schema-kernel + task-management",
  "subagent_type": "gsd-codebase-mapper",
  "task_id": "ses_1b93c1c18ffe97xQEjOsErQEle"
}
```

**Output:** (pruned)
```
task_id: ses_1b93c1c18ffe97xQEjOsErQEle
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_xlaKwkHkPPFIglRi1eMm3154"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Synthesize 6 deep analyses into restructuring map",
  "subagent_type": "gsd-research-synthesizer",
  "task_id": "ses_1b9383e78ffeQyHJSEr7k47gYo"
}
```

**Output:** (pruned)
```
task_id: ses_1b9383e78ffeQyHJSEr7k47gYo
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_p6a729cjplLe4K67fJVl0590"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1cs8cPiQOaTXSTinVG945742"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_NEhaK2STJj08xGhbE8io8341"
}
```


## USER (turn 39)

**source:** real-human

rồi giờ hãy thiết lập lại phases dựa trên đó 

### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_00_09ZaHZLxcKkq5DrNGnyy0131"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/research/hard-restructuring-map-full-2026-05-21.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_AqdF8KvmBYetzSJKwasu3240"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_LVeWQc3sPSTtV23z5W6O8774"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_roCaeKaQE3fgFGpUzmNZ4553"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_mt9gVJBGm0C6HxXHWmC98056"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Oqd2JPk3Xk3CHMOjCYN18830"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Vs6119Z9Q1st7TBLRpTW7519"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_43iX0kqLJCTV51PG0RLo6049"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_sZtADCUYI87xCnzscYQ28884"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_5YbFn4jDZFxwa3uYSVrH2788"
}
```


## USER (turn 40)

**source:** real-human

bắt đầu với non-destructive 

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_wKPHKcPiO2S1srWHzqUO6329"
}
```


## USER (turn 41)

**source:** real-human

research chưa có mà đi viết plan check lại plan so với research

## USER (turn 42)

**source:** real-human

plan sequential sau research reject plan viết lại

### Tool: task

**Input:**
```json
{
  "description": "Phase 19 discuss - non-destructive remediation",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1b9324c82ffepxUjhB8x7UIpnK"
}
```

**Output:** (pruned)
```
task_id: ses_1b9324c82ffepxUjhB8x7UIpnK
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 19 plan creation",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1b932408bffe1OSBK9Q2Ad70vy"
}
```

**Output:** (pruned)
```
task_id: ses_1b932408bffe1OSBK9Q2Ad70vy
```


## USER (turn 44)

**source:** real-human

plan sequential sau research reject plan viết lạirevert plan deletion  chỉ cần delegate stack lên session cũ để agent tự điều chỉ theo context mới

### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eL5RuV0YKtGjFQnRWnvI0107"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 19 plan - incorporating research findings",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1b9324c82ffepxUjhB8x7UIpnK"
}
```

**Output:** (pruned)
```
task_id: ses_1b9324c82ffepxUjhB8x7UIpnK
```


## USER (turn 45)

**source:** real-human

tổng kết các schema permissions, deletion và removal đó nó là gì tuy nó dead nhưng có thể đó nằm trong một intents của tôi mà bạn xoá đi không suy nghĩ về ecosystem, context và feature của nó, đáng ra nó phải được ghi nhận gaps và debts khi xoá vì dead code nó không hoạt động nhưng không phải là đơn thuần nằm ngoài intents build mvp của tôi

## USER (turn 46)

**source:** real-human

hãy tìm hiểu truy vết về quá khứ các tài liệu implementation của nó và ghi nhận lại gaps và debts cho tôi

## USER (turn 47)

**source:** real-human

phân loại theo requirements và project concepts và visions

## USER (turn 48)

**source:** real-human

từ đó đưa ra đâu là removal và deletion đúng và đâu là gaps và debts cần phải xây dựng lại để ecosystem của features hoạt động đúng

## USER (turn 49)

**source:** real-human

có rất nhiều removal bên trên dính tới đó là features tôi mong muốn nhưng nó không được wire hoặc wire không đúng cách

## USER (turn 50)

**source:** real-human

tổng kết các schema permissions, deletion và removal đó nó là gì tuy nó dead nhưng có thể đó nằm trong một intents của tôi mà bạn xoá đi không suy nghĩ về ecosystem, context và feature của nó, đáng ra nó phải được ghi nhận gaps và debts khi xoá vì dead code nó không hoạt động nhưng không phải là đơn thuần nằm ngoài intents build mvp của tôi hãy tìm hiểu truy vết về quá khứ các tài liệu implementation của nó và ghi nhận lại gaps và debts cho tôi. có rất nhiều removal bên trên dính tới đó là features tôi mong muốn nhưng nó không được wire hoặc wire không đúng cáchphân loại theo requirements và project concepts và visionstừ đó đưa ra đâu là removal và deletion đúng và đâu là gaps và debts cần phải xây dựng lại để ecosystem của features hoạt động đúng

### Tool: task

**Input:**
```json
{
  "description": "Phase 19-01: Schema barrel cleanup",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b9324c82ffepxUjhB8x7UIpnK"
}
```

**Output:** (pruned)
```
task_id: ses_1b9324c82ffepxUjhB8x7UIpnK
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 19-02: Dead module deletions",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b9324c82ffepxUjhB8x7UIpnK"
}
```

**Output:** (pruned)
```
task_id: ses_1b9324c82ffepxUjhB8x7UIpnK
```


### Tool: task

**Input:**
```json
{
  "description": "Phase 19-03: Inlines + hook cleanup",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1b9324c82ffepxUjhB8x7UIpnK"
}
```

**Output:** (pruned)
```
task_id: ses_1b9324c82ffepxUjhB8x7UIpnK
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_3v2uztNQ0fhMG5PTLPZ84680"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Trace historical intent of all Phase 19 deletion items",
  "subagent_type": "gsd-domain-researcher",
  "task_id": "ses_1b91ba548ffeDnOHp9ah1flldt"
}
```

**Output:** (pruned)
```
task_id: ses_1b91ba548ffeDnOHp9ah1flldt
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_aTwZTQeaxWgezCaJqBO55568"
}
```


## USER (turn 51)

**source:** real-human

hãy thực hiện các gate keeping gsd đầy đủ từ code review, cho tới verification và integration của phase 19 vừa rồi tự route gsd và sử dụng gsd agents đồng thời khắc phục triệt để các lỗi phát sinh trải dài từ phase 17, 18 và 19 luôn

### Tool: skill

**Input:**
```json
{
  "name": "gsd-code-review"
}
```

**Output:** (pruned)
```
# Skill: gsd-code-review
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-validate-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-validate-phase
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-secure-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-secure-phase
```


### Tool: skill

**Input:**
```json
{
  "name": "verify-before-complete"
}
```

**Output:** (pruned)
```
# Skill: verify-before-complete
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_snoUCyZntLY0o6qE1hRAIjOh"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_TzKFMyQKeQPIjGZtNF2wB11J"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_sxLxZpQBIMuEDotq8fdxwWG1"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_HifSQO83Y1zFcmv9xUeCRKTG"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_F79wRfjHrijq2EzuUph8KCIp"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/18-root-cleanup-sync-boundary-sync-manifest/18-GATEKEEPING-REPORT.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_TR3wznuqs3aWB5RiLFwUTb8J"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_usM7CE9lDz6g1hooRacOukAA"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_MRuaQvo6E982iKCat2RpIRg4"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_iLmLrs1vKaJdwB9BagzNZjZe"
}
```


### Tool: task

**Input:**
```json
{
  "description": "GSD integration verify 17-19",
  "subagent_type": "gsd-integration-checker",
  "task_id": "ses_1b9142d7affe9aWlhvtW3cvzk3"
}
```

**Output:** (pruned)
```
task_id: ses_1b9142d7affe9aWlhvtW3cvzk3
```


### Tool: task

**Input:**
```json
{
  "description": "GSD review Phase 19",
  "subagent_type": "gsd-code-reviewer",
  "task_id": "ses_1b9142dc4ffefFHev1j7y4V7Jk"
}
```

**Output:** (pruned)
```
task_id: ses_1b9142dc4ffefFHev1j7y4V7Jk
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_NpPIBwysfXbrAzOOy139gxUA"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/spawner/concurrency-key.test.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/agent-frontmatter.schema.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/STRUCTURE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/CONCERNS.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_aqhuM6DoEw1SVD1eM6J2nXrb"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_ZXH1cLyMRbk2r19HsKb7Xwo8"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_eOSVmkraK2sEAralqYHE79E7"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_LCowdAjNAxMUlGiX7S2zukwA"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_ZPBwq0gr0jfYqO85pl9iU4LH"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_cz1VkxRp1AqquKKrHgAedCGP"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/STRUCTURE.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_5pdsZ1ZzuKDkoiFH5yTx6VDw"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/transforms/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/bootstrap/AGENTS.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_BTF8i7JqlOmezaN7GAao2bBH"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_cLGlsCMN5SIl6PBkwo3Dv7wW"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_Ow8BvBlL1f2dmpRd913niWaD"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_zEzwZFH0deXiNA0odxsyugSc"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_IjMg3N1YvGc2N57uzvvHFzkC"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_i9ZfbHxtkDX4mQgB8jwngroA"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_2B68iKmfBrC9uWJ9f9MEYkPY"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_kMdaoAqk8wv1UvKy3P5NXlOK"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_O7NeZkOujKek5qrs3MCqeWqX"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_lleNyWw2hpMjQKIAA4ZD7JmZ"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/continuity.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/delegation-persistence.test.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_JFv85RpkPzaBmaJvwnVCqNFw"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/continuity.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/continuity/store-cache.ts"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_RmnS4vLOyHpcAGheUgiJGga3"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_uMlk8lO0SSELVQTXSjttCIAI"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_4OjMe4JD1QKbpQvm59MV7jUo"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_xIbZuJXU5namfcIHwV0olFJs"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_8GfJSiwDEgCo0nukKVau9S70"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_YpVJOlfSoXYSvffyC05itmoO"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Final GSD review 19",
  "subagent_type": "gsd-code-reviewer",
  "task_id": "ses_1b90978a3ffeL0CQ237aUWVYgr"
}
```

**Output:** (pruned)
```
task_id: ses_1b90978a3ffeL0CQ237aUWVYgr
```


### Tool: task

**Input:**
```json
{
  "description": "Final GSD verification 19",
  "subagent_type": "gsd-verifier",
  "task_id": "ses_1b90978c4ffefLmLOVHQHqdcwB"
}
```

**Output:** (pruned)
```
task_id: ses_1b90978c4ffefLmLOVHQHqdcwB
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/STRUCTURE.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_iGgsNxrNnPejrUq8eiF34rQM"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ke2GLYPtnvkJ8kEhiyJEpGuM"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_zMj8grhSz14WTxJSWnC9IJuZ"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_pIvtiOoz0yg8tXKMUgrfSofh"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_5eiTp0ENViayIDFRxK3fXy0x"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_NyoXq88RC7QenILol4DUOr2G"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_Epyzc6v1PhIsW8yg5LdVpZy9"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Confirm final GSD pass",
  "subagent_type": "gsd-verifier",
  "task_id": "ses_1b902b053ffeMCzAvDEJWgt1bl"
}
```

**Output:** (pruned)
```
task_id: ses_1b902b053ffeMCzAvDEJWgt1bl
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_ss0MTlAIBbYinXvLhGykNCie"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_g4vYEcOdieoUKwuTfZ7tvegL"
}
```


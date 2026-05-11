---
sessionID: ses_1e9b9cb08ffeHdv8qgplK8c32n
created: 2026-05-11T09:02:40.385Z
updated: 2026-05-11T09:02:40.385Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hm-l2-scout. Your task: Investigate governance artifact staleness across the project.

CONTEXT:
- The forensic report at `.planning/forensics/report-20260511-154500.md` found that STATE.md, ROADMAP.md, PROJECT.md, REQUIREMENTS.md are all stale
- CP-ST-01 (session tracker revamp) is not reflected in any governance artifacts
- 7 codebase docs were deleted from `.planning/codebase/`
- The project has migrated from the archived `opencode-ai/opencode` to `anomalyco/opencode` for SDK/plugin

YOUR TASK (read-only investigation):
1. Read the full `.planning/ROADMAP.md` (all 361+ lines) and identify:
   - Where CP-ST-01 should appear but doesn't
   - Any stale checkboxes or status markers
   - Any references to old/deleted phases or workstreams
2. Read `.planning/PROJECT.md` (full) and `.planning/REQUIREMENTS.md` (full) and check:
   - SDK version claims vs actual (should be `@opencode-ai/sdk ^1.14.44`, `@opencode-ai/plugin ^1.14.44`)
   - Test count claims vs likely reality
   - Any stale claims about codebase structure
3. Check `.planning/codebase/` directory — verify which docs exist and which were deleted
4. Check for any sessions or state files in `.hivemind/` that reference old architecture
5. Read AGENTS.md at project root and check if its counts/claims (agents, skills, phases) match reality
6. Check `.hivemind/state/session-continuity.json` and `.hivemind/state/delegations.json` for staleness

RETURN a structured summary:
- List of specific stale claims in each governance file (file:line format where possible)
- What's missing (CP-ST-01, stack migration, etc.)
- What's deleted (codebase docs)
- What counts/numbers are wrong
- Priority ranking of what needs updating first
- Overall governance health score (1-10)

DO NOT modify any files. This is read-only investigation.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-detective"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-detective
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-synthesis"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-synthesis
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_b6GyS1wfqBKRDDlctl2C9271"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_AZPWQWHwksFA8ERBdu254232"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase"
}
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
3:     "id": "995565bd-dba6-48da-8be3-9439d45cd99a",
4:     "parentSessionId": "ses_concurrent",
5:     "childSessionId": "fake-ses-1",
6:     "agent": "builder",
7:     "status": "error",
8:     "createdAt": 1778489176039,
9:     "safetyCeilingMs": 1800000,
10:     "lastMessageCount": 0,
11:     "stablePollCount": 0,
12:     "lastMessageCountChangeAt": 1778489176039,
13:     "nestingDepth": 1,
14:     "executionMode": "sdk",
15:     "workingDirectory": "/Users/apple/hivemind-plugin-private",
16:     "queueKey": "agent:builder",
17:     "surface": "agent-delegation",
18:     "recoveryGuarantee": "resumable",
19:     "explicitCancellation": false,
20:     "completedAt": 1778489176040,
21:     "error": "Failed to send prompt to child session",
22:     "gracePeriodExpiresAt": 1778489776040
23:   },
24:   {
25:     "id": "e31d3e1e-1a60-4ce1-9439-0cb34f2a7b4f",
26:     "parentSessionId": "ses_concurrent",
27:     "childSessionId": "fake-ses-2",
28:     "agent": "researcher",
29:     "status": "error",
30:     "createdAt": 1778489176041,
31:     "safetyCeilingMs": 1800000,
32:     "lastMessageCount": 0,
33:     "stablePollCount": 0,
34:     "lastMessageCountChangeAt": 1778489176041,
35:     "nestingDepth": 1,
36:     "executionMode": "sdk",
37:     "workingDirectory": "/Users/apple/hivemind-plugin-private",
38:     "queueKey": "agent:researcher",
39:     "surface": "agent-delegation",
40:     "recoveryGuarantee": "resumable",
41:     "explicitCancellation": false,
42:     "completedAt": 1778489176041,
43:     "error": "Failed to send prompt to child session",
44:     "gracePeriodExpiresAt": 1778489776042
45:   }
46: ]

(End of file - total 46 lines)
</content>
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


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
9: 
10: - WHEN REQUEST IS CONFUSING AND LARGE -> never try to audit everything at once master planning - loop on phases with traversal and progressive batch of research - investigate - planning - implementing - verification then moving to the next batch -> reapt the integrated cycles with regression validation and integration loops of gatekeeping - never try to handle everything at once
11: 
12: - DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION. DO NOT USE ANY CUSTOM TOOLS YET. DO NOT USE INTERACTIVE BASH OR PTY COMMANDS!
13: 
14: - Handoff and artifacts between sessions, from research, audit, planning, review, verification, must all commit, written-to-local-disk and referenced as master jump links
15: 
16: - all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`
17: 
18: - any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 
19: 
20: - all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS
21: 
22: - design patterns and must be obeyed strictly according to the architecture of the project.
23: 
24: - atomic git commit for context preservation.
25: 
26: - context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed
27: 
28: - AGENTS.md must be routinely updated - after each cycle, each batch of implementation.
29: 
30: - AGENTS.md are nested under dirs and subdirs, beware when maintaining them.
31: 
32: - files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 
33: 
34: - folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 
35: 
36: - code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.
37: 
38: - The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces
39: 
40: - The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks
41: 
42: - The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks
43: 
44: - When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.
45: 
46: <!-- NOTE: explore agent is MISSING from the filesystem -->
47: 
48: - For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.
49: 
50: - The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 
51: 
52: - **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important
53: 
54: 
55: - - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
56: 
57: 
58: ## SKILLS TO WORKFLOW ROUTER
59: **Important guidelines**
60: 
61: - To load best set of skills agents must know if you are front-facing or being delegated as subagents; knowing your hierarchy of tasks (looking at the meta data marked as `#USER` to confirm it is from the human user, meaning you are front-facing agent, otherwise subagents) 
62: 
63: - consider loading new skill(s) (not always but once **intents** of human users and/or **workflows**, **tasks** shifted this order is a **must**)
64: 
65: - **subagents** (know your agent **domain** by looking at description; analyze **task** to fetch `specilist` skills) fetch skills belong  `how-to-implement` and/or `specialist` classifications.
66: 
67: - **orchestrator/coordinator agents** : loading `how-to-delegate`, `how-to-process/loop/iterative`, `guardrails, gatekeeping, context,`  skills classifications. For complex tasks this group may need to load `outer-cycle-how-to-implement` skills  
68: 
69: - **respecting framework `oneness`** : it is if you are using `gsd` skill sets - pick them first - then pick another only when `gsd` skill sets lack the `domain-specific` or `task-specialist` that you find the superior ones. 
70: 
71: ### **going from greater cycles to the inner cycles** for skills to coordinate and orchestrate
72: 
73: - **brainstorming, user-intent discussion** always make sure to understand, think twice load set helping to get clear user-intent through QA and discussion to prevent regressions or conflicts
74: 
75: - **research, investigate, synthesis** do not skip research load `hm-deep-research` - `hm-detectice` (if need to learn about the sector of codebase) and
76: 
77: - **write new code:** load `clean-code` skill
78: 
79: - **debugging:** load `gsd` debug skills and `systematic-debug` skill
80: 
81: - **planning and implementing** must load set of spec-driven and authentic tdd skills
82: 
83: - **iterative loop** coordinating skills and gatekeeping at correct set loop til completione
84: 
85: - **quality gatekeeping** must go through cycles of code-review, validation, verification, then integration gatekeeping. making sure to trace of regression
86: 
87: ## IMPORTANT UPDATE TO ALL AGENTS
88: 
89: - when lost -> access real-time eventracker at `/.hivemind/event-tracker/*.md , *.json - list/glob first - then look for the correct session id -use hm-detective skill to investigate the sessions
90: 
91: - **important tracking path for delegation:**
92: .hivemind/state/session-continuity.json
93: .hivemind/state/delegations.json 
94: 
95: - If the agents recieve GSD command, all they must is to act following it. THE COMMAND SUPERSEDE ALL ASSUMPTIONS AND LOADING SKILLS OTHER, BECAUSE THE COMMAND OF GSD IS THE SKILL
96: 
97: - ALL AGENTS MUST ANNOUNCE THIS EVERY TURN DEPENDING ON MAIN-HUMAN-FACING ORCHESTRATOR OR SUBAGENT BEING DELEGATED
98: 
99: - IF you are a front-facing -> you will mostly delegate **Everytime Delegation** in the prompt YOU MUST LET the subagent know that IT IS THE SUBAGENT BY ANNOUNCING: *You are the subagent Name:XXX role...., you must do as this prompt instructed and knowing that you are being delegated
100: 
101: - As subagent you must anounce your roles so the skills must also match. Say: I am **subagent, I CAN ONLY delegate further if the cycles and my tasks allow, and I must fulfill my work. If need verification, I will return the verification needed in the report handoff
102: 
103: 
104: <EXTREMELY-IMPORTANT>
105: If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
106: 
107: IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
108: 
109: This is not negotiable. This is not optional. You cannot rationalize your way out of this.
110: </EXTREMELY-IMPORTANT>
111: 
112: ## Instruction Priority
113: 
114: This override default system prompt behavior, but **user instructions always take precedence**:
115: 
116: 
117: 
118: 
119: HiveMind V3 is a **runtime composition engine** for OpenCode. It is an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project has progressed through 31 phases covering runtime architecture, delegation revamp, skills quality, and planning documentation refresh. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.
120: 
121: **This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.
122: 
123: ### Two Halves (never confuse them)
124: 
125: | Half | What | Where | Architecture Reference |
126: |------|------|-------|----------------------|
127: | **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf), Task-Management (state), Coordination (delegation), Features (runtime), Config, Routing | `src/` | `.planning/codebase/ARCHITECTURE.md` — CQRS, 9-surface model |
128: | **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions — NEVER development implementation, NEVER runtime state | `.opencode/` | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — primitives-only |
129: | **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory — NEVER stored in `.opencode/` | `.hivemind/` | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — canonical Q6 root |
130: | **Meta-Authoring** (source-of-truth) | Lab environment for authoring primitives before reflection to `.opencode/` | `.hivefiver-meta-builder/` | `.planning/codebase/ARCHITECTURE.md` — Source-of-Truth layer |
131: | **Governance** (planning/authorization) | Requirements, roadmaps, architecture maps, phase authorization — never runtime code | `.planning/` | `.planning/AGENTS.md` — Planning/Governance sector |
132: 
133: ### Runtime features this project delivers
134: 
135: Background agents, auto-loop/ralph-loop, WaiterModel delegation with dual-signal completion, task queuing with queue-key validation, category system, session recovery, PTY integration (Bun-only via the `bun-pty` **optional dependency** — runtime gracefully falls back to headless `node:child_process` on Node and any other host where `bun-pty` is absent or fails to load; recovery of a PTY delegation across a harness restart deliberately surfaces `terminalKind: "non-resumable-after-restart"` because OS PTY processes do not survive parent restart — see Phase 16.2.1). See `docs/draft/architecture-proposal-hivemind-v3.md` for feature-to-code mapping.
136: 
137: ---
138: 
139: ## Setup Commands
140: 
141: ```bash
142: npm install                    # Install dependencies
143: npm run build                  # Clean + compile TypeScript to dist/
144: npm run typecheck              # Type-check without emitting
145: npm run test                   # Run all tests (vitest)
146: npm run test:watch             # Watch mode
147: npm run test:coverage          # Coverage report (src/**/*.ts)
148: ```
149: 
150: - Requires Node.js >= 20.0.0
151: - Peer dependency: `@opencode-ai/plugin` >= 1.1.0
152: - No environment variables required for build/test
153: - Runtime state overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`
154: 
155: ---
156: 
157: ## Project Structure
158: 
159: ```
160: src/
161: ├── plugin.ts                  # Composition root
162: ├── index.ts                   # Public API re-exports
163: ├── shared/                    # Leaf utilities, types, SDK wrappers, runtime policy, security
164: ├── task-management/           # Continuity, journal, event tracker, recovery, trajectory, lifecycle
165: ├── coordination/              # Delegation, completion, concurrency, SDK/command delegation, spawner
166: ├── features/                  # Standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, work contracts
167: ├── config/                    # Config subscriber/compiler/workflow
168: ├── routing/                   # Session entry, behavioral profile, command engine
169: ├── hooks/                     # Lifecycle, guards, observers, transforms, composition
170: ├── tools/                     # Delegation, session, config, hivemind, prompt tool entrypoints
171: └── schema-kernel/             # Zod schemas and generated config schema support
172: 
173: tests/lib/                     # Legacy test grouping for moved runtime modules
174: tests/tools/                   # Tool-focused unit tests
175: .opencode/                 # Soft meta-concepts (skills, agents, commands) — NO state storage
176: .hivemind/               # Internal deep module state (journals, lineage, runtime state) — canonical per Q6
177: ```
178: 
179: ### Dependency rules (non-negotiable)
180: 
181: - `src/shared/types.ts` is leaf-like shared contract authority; avoid adding deep runtime imports without a source-backed decision
182: - `src/shared/helpers.ts`, `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` — leaf or near-leaf
183: - `src/task-management/lifecycle/index.ts` is the lifecycle manager surface
184: - No circular dependencies
185: - Max module size: 500 LOC
186: - `src/task-management/continuity/delegation-persistence.ts` — delegation record I/O
187: 
188: ### Where to find things
189: 
190: | Task | File |
191: |------|------|
192: | Change session persistence format | `src/task-management/continuity/index.ts` |
193: | Add a lifecycle phase | `src/shared/types.ts` + `src/task-management/lifecycle/index.ts` |
194: | Change SDK call patterns | `src/shared/session-api.ts` |
195: | Change concurrency model | `src/coordination/concurrency/queue.ts` |
196: | Change delegation behavior | `src/coordination/delegation/manager.ts` — DelegationManager class (WaiterModel dispatch, dual-signal completion) |
197: | Change delegate-task tool | `src/tools/delegation/delegate-task.ts` — dispatch tool wrapper |
198: | Check delegation status | `src/tools/delegation/delegation-status.ts` — status polling tool |
199: | Change completion detection | `src/coordination/completion/detector.ts` |
200: | Change task status transitions | `src/shared/task-status.ts` |
201: | Change agent config (temperature, tools) | `src/plugin.ts` — `AGENT_DEFAULTS`, `AGENT_TOOLS` |
202: | Change circuit breaker / tool budget | `src/plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |
203: | Persist delegation records | `src/task-management/continuity/delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()` |
204: | Change tool response envelope | `src/shared/tool-response.ts` — standard response wrapper |
205: | Change prompt-enhance schemas | `src/schema-kernel/prompt-enhance.schema.ts` — Zod schemas for skim/analyze/patch |
206: 
207: ---
208: 
209: ## Testing Instructions
210: 
211: - Run all tests: `npm test`
212: - Run single test file: `npx vitest run tests/lib/helpers.test.ts`
213: - Run tests matching pattern: `npx vitest run -t "<test name>"`
214: - Watch mode: `npm run test:watch`
215: - Coverage: `npm run test:coverage` — covers `src/**/*.ts`, excludes `src/index.ts`
216: - Test files live in `tests/lib/` and `tests/tools/` — mirror `src/` modules and `src/tools/`
217: - Tests use vitest globals (no imports needed for `describe`, `it`, `expect`)
218: - **Type-check before committing:** `npm run typecheck`
219: 
220: ---
221: 
222: ## Code Style
223: 
224: - TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
225: - ES2022 target, NodeNext module resolution
226: - `verbatimModuleSyntax: true` — use `import type` for type-only imports
227: - Deep-clone-on-read in continuity store
228: - `[Harness]` prefix on all thrown errors
229: - Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`)
230: - No `any` types on new code
231: - Max module size: 500 LOC
232: 
233: ---
234: 
235: ## Build and Deployment
236: 
237: - Build: `npm run build` — compiles `src/` → `dist/` with declarations + source maps
238: - Package entrypoints:
239:   - `opencode-harness` → `./dist/index.js`
240:   - `opencode-harness/plugin` → `./dist/plugin.js`
241: - Prepack runs build automatically: `npm pack` / `npm publish`
242: - Runtime state path: `.hivemind/state/` (canonical per Q6; legacy `.opencode/state/opencode-harness/` supported via compatibility bridge during migration)
243: 
244: ---
245: 
246: ## OpenCode Integration
247: 
248: - Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
249: - Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
250: - 89 agents in `.opencode/agents/`: 33 GSD specialist agents (internal project build tools — NOT shipped) + 45 hm-* agents (harness module specialists + core/internal agents: analyst, architect, assessor, auditor, brainstormer, build, conductor, connector, context-mapper, context-purifier, coordinator, critic, curator, debugger, ecologist, executor, finisher, general, guardian, integrator, intent-loop, investigator, mentor, meta-synthesis, operator, optimizer, orchestrator, persistor, phase-guardian, planner, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, reviewer, risk-assessor, router, scout, spec-verifier, strategist, synthesizer, technician, test-router, validator, writer) + 11 hf-* agents (hf-prompter, hf-l2-agent-builder, hf-l2-command-builder, hf-l0-hm-l0-orchestrator, hf-l2-skill-builder, hf-l2-tool-builder, hf-l2-meta-builder + 4 additional). Note: explore agent is MISSING from the filesystem.
251: - 59 skills in `.opencode/skills/`: 35 hm-* (product dev: brainstorm, requirements-analysis, feature-ecosystem, product-validation, coordinating-loop, user-intent-interactive-loop, cross-cutting-change, spec-driven-authoring, test-driven-execution, debug, refactor, deep-research, detective, synthesis, research-chain, completion-looping, phase-loop, phase-execution, planning-persistence, subagent-delegation-patterns, production-readiness, roadmap-maintainability, tech-context-compliance, tech-stack-ingest, omo-reference, opencode-platform-reference, opencode-non-interactive-shell, opencode-project-audit, gate-orchestrator, lineage-router, brainstorm, skill-router, hivemind-engine-contracts, hivemind-state-reference, integration-contracts) + 13 hf-* (meta-builder: agent-composition, agents-and-subagents-dev, agents-md-sync, command-dev, command-parser, context-absorb, custom-tools-dev, delegation-gates, meta-builder, skill-synthesis, use-authoring-skills) + 3 gate-* (internal quality gate triad: evidence-truth, lifecycle-integration, spec-compliance — THIS PROJECT ONLY, not shipped) + 6 stack-* (reference: bun-pty, json-render, nextjs, opencode, vitest, zod) + 1 unprefixed (opencode-config-workflow) + 1 disabled (`donotusethis-hm-planning-with-files`). Note: `hm-planning-with-files` is disabled (directory renamed to `donotusethis-hm-planning-with-files`).
252: - Note: 65 gsd-* skills and 33 gsd-* agents exist in `.opencode/` as developer tooling (GSD framework used to build this project). They are NOT shipped primitives. Any synthesis from gsd-* must be transformed to hm-*/hf-* conventions.
253: - 18 commands in `.opencode/commands/`: 7 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork) + 7 extended (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) + 1 sync (sync-agents-md) + 3 test (test-echo, test-list, test-status)
254: 
255: ### `.opencode/` = Soft Meta-Concepts ONLY — NEVER Development Assets
256: 
257: `.opencode/` is **ONLY** for OpenCode configurable primitives (agents, commands, skills, rules, permissions) that compose runtime behavior from outside the npm package. **No internal runtime state** is stored here. **No development implementation** lives here. **No build artifacts** belong here.
258: 
259: This is a critical distinction:
260: - **`.opencode/` IS:** Agent definitions, skill packages, command files, permission rules, plugin loader wrappers → these CONFIGURE runtime behavior
261: - **`.opencode/` IS NOT:** Source code, compiled output, business logic, state persistence, development tools, npm package assets → these belong in `src/`, `dist/`, or `.hivemind/`
262: 
263: All Hivemind deep module state (journals, lineage, runtime state, graph/vector memory) writes to `.hivemind/` at project root per Q6. This prevents corruption by other plugins or user dependencies.
264: 
265: ### Canonical Skill Location
266: 
267: `.opencode/skills/` is the **ONLY** canonical location for project skills. All skill authoring happens in `.hivefiver-meta-builder/skills-lab/` and is reflected in `.opencode/skills/` via directory-level symlink.
268: 
269: IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are **third-party sync artifacts**, not project deliverables. They are gitignored and must never be committed. `.claude/skills/` does not exist in this repository.
270: 
271: ---
272: 
273: ## Architecture Foundation (Authoritative Docs)
274: 
275: ### Must-Have References (current as of 2026-05-10)
276: 
277: | Document | Purpose | Authority |
278: |----------|---------|-----------|
279: | `.planning/codebase/ARCHITECTURE.md` | CQRS model, 9-surface authority, component graph, dependency rules | Source-backed architecture map |
280: | `.planning/codebase/STRUCTURE.md` | File tree, placement conventions, naming, folder registration | Source-backed structure map |
281: | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` | Surface ownership model, Phase 0 mutation gates, target source planes | Governance baseline |
282: | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | Naming contract, lineage contract (hm/hf/gate/stack/gsd), L0-L3 hierarchy | Governance baseline |
283: | `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md` | Target sector AGENTS.md shape, deferred implementation | Target architecture |
284: | `.planning/research/omo-adaptation-architecture-2026-05-07.md` | OMO adapt/reject table, Hivemind surface preservation rules | Research foundation |
285: | `.hivemind/planning/agents-system-overhaul-2026-05-10/` | Agent/skill/command overhaul: 15 REQs, 12 phases, shipped count = 49 | Overhaul planning |
286: 
287: ---
288: 
289: ## Locked Validation Decisions (Q1-Q6)
290: 
291: Six architectural decisions locked 2026-04-25 as the foundation for Phases 27-30 and all future work. Source: `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`
292: 
293: | Decision | Description |
294: |----------|-------------|
295: | **Q1** | Hybrid + Spec-Driven Automated Runtime Detection — deep codemap, file watcher, MCP tools, dependency graph; Layer 2 taxonomy |
296: | **Q2** | Artifact-Focused Sidecar — Next.js 15 + `@json-render/react`, reads `.hivemind/` and `.planning/`, READ-ONLY for canonical state |
297: | **Q3** | Session Journal as Complement + Time-Machine — append-only event timeline, independent of continuity.ts |
298: | **Q4** | MVP = 5 of 8 memory categories; Post-MVP = 3 with explicit gates |
299: | **Q5** | Full RICH gate required — 0 of 25 skills pass today is honest status; no threshold lowering |
300: | **Q6** | `.hivemind/` is internal state root; `.opencode/` is ONLY for OpenCode primitives — one-way migration |
301: 
302: ---
303: 
304: ## Architecture Rules (from architecture-proposal-hivemind-v3.md)
305: 
306: ### Script rule
307: A script should **REPORT FACTS** and **LEAVE JUDGMENT TO THE AGENT**. Pure helpers only (exit 0, no governance). No hardcoded paths, no state mutation outside CQRS tools.
308: 
309: ### Anti-patterns to avoid
310: - Static `.md` files acting as agent definitions (they are templates/references only)
311: - Bash scripts outside `bin/` CLI substrate
312: - Governance scripts that block progression (facts only)
313: - Feature bloat: keep modules under 500 LOC, total codebase target ~4,000-5,000 LOC
314: - Skill proliferation: target ~20 SKILL.md files, not hundreds
315: 
316: ### Target architecture (from proposal)
317: 5 tools (~500 LOC total), hooks (~800 LOC), lifecycle (~400 LOC), delegation (~400 LOC), continuity (~400 LOC), CLI substrate (~500 LOC), control-plane (~400 LOC), shared (~800 LOC).
318: 
319: ---
320: 
321: ## Git Commit Discipline
322: 
323: - Commit message format: `phase: what changed — why it matters`
324: - Commit after each meaningful change (subagent returns, phase completes, gate passes)
325: - Never accumulate changes across multiple phases without committing
326: - Agents may only manage commits for their own work — they do not constrain or override commits from other development activity
327: 
328: ---
329: 
330: ## Terminology
331: 
332: | Use | Not |
333: |-----|-----|
334: | Harness | Framework, system |
335: | Agent (specialist: researcher/builder/critic) | Claude, AI, model |
336: | Skill | Prompt, instruction |
337: | Runtime composition | Static definition |
338: | Delegation packet | Task assignment |
339: 
340: <!-- GSD:profile-start -->
341: ## Developer Profile
342: 
343: > Generated by GSD from session_analysis. Run `/gsd-profile-user --refresh` to update.
344: 
345: | Dimension | Rating | Confidence |
346: |-----------|--------|------------|
347: | Communication | mixed | LOW |
348: | Decisions | fast-intuitive | LOW |
349: | Explanations | concise | LOW |
350: | Debugging | fix-first | UNSCORED |
351: | UX Philosophy | backend-focused | LOW |
352: | Vendor Choices | pragmatic-fast | UNSCORED |
353: | Frustrations | scope-creep | UNSCORED |
354: | Learning | self-directed | LOW |
355: 
356: **Directives:**
357: - **Communication:** Adapt communication style to context — accept terse directives for execution, provide structured responses when the developer establishes context. When uncertain, match the developer's current message length and formality.
358: - **Decisions:** Present recommendations directly and proceed quickly when accepted — this developer makes execution decisions fast. If a decision has significant architectural impact, briefly note the stakes before proceeding but do not over-deliberate.
359: - **Explanations:** Provide brief explanations of approach alongside code. Focus on architectural decisions and their impact. Skip conceptual background unless the developer explicitly asks. When in doubt, ask if more detail is needed.
360: - **Debugging:** No strong preference detected. Ask the developer when this dimension is relevant.
361: - **UX Philosophy:** Focus on backend architecture, code quality, and system design. No UI/UX polish needed for current work. If the project shifts to frontend, ask the developer about their UX preferences.
362: - **Vendor Choices:** No strong preference detected. Ask the developer when this dimension is relevant.
363: - **Frustrations:** Stay within stated scope and deliver honest assessments. Do not overstate capabilities or add unrequested features. When presenting work, be factual about what was delivered versus what was promised.
364: - **Learning:** Provide code and architectural details for independent assessment. Ask targeted questions rather than offering walkthroughs. When the developer explores a new domain, offer concise references and let them direct the learning pace.
365: <!-- GSD:profile-end -->
366: 
367: <!-- Last synced: 2026-05-05 — HER-0 ecosystem audit verification: skill/agent counts synced to reality (59 active skills, 89 agents, 35 hm-* skills) -->

(End of file - total 367 lines)
</content>
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
  "callID": "call_02_NTdHzRxgb5ZwpTufpHCb4421"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_qRUM0GzxhaMUA5Ez8wNy3968"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning"
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
  "callID": "call_04_l1yjvwzuOvlWs4pAqePR8723"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_t72XxJwOFHZeXMJcw5a31498"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_e35eCW7cPqnxgkh8AHaI4955"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_sGCitWamBQ4NxHZ3XrdL1678"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_KLrEtVu4PyM4WhnvoMhY0445"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_4Jo4aWqD0kV9lInHRx9Y3478"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_EVQw9c0k6SFwfqdfmohA4802"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_0qWkND9Ajo2jrfOMfQcE1666"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_WcA2HiZxmpUyxlyscMW26250"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_pu40VSWd7c2KHNraissc3235"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_VwfDXQ8NgjuMt0hCliqS1135"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_EWjK1LJDV621MnILIUEv6187"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_vKGnqzMxvLhzF3qJLYrj8796"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ebmnj4Zv5OaObqiyU5Aw7057"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_4WHuLHV2LAWNcgOT3M6h3266"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_HlqfDv3Z0WdhbvrSV2e69741"
}
```


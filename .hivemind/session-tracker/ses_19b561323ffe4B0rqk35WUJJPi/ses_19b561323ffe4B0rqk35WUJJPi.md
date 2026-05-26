---
sessionID: ses_19b561323ffe4B0rqk35WUJJPi
created: 2026-05-26T14:21:58.399Z
updated: 2026-05-26T14:21:58.490Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_19b54dac1ffecJRGpRskXRGGTM
    childFile: ses_19b54dac1ffecJRGpRskXRGGTM.json
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-05-26T14:21:58.364Z
lastMessage: "Tools: edit"
---

## USER (turn 1)

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

<yêu cầu: tìm các phase liên quan đến nó trước đây xem đã làm gì với nó rồi cũng như các gsd phases đã lên STATE và ROADMAP để chèn hoặc modify đúng state để không bị conflict dependencies - cũng như xem công việc hoàn thành của nhóm phases 24.x
### Miêu tả:
đây là một cluster tools và feature liên quan đến định hình routing của hm-orchestrator và các agent có quyền sử dụng để điều phối và điều chỉnh “slash commands” được lưu sẵn trong project hoặc global của OpenCode để làm các việc sau đây (lưu ý function này sẽ load các slash commands của users có tại .opencode/command(s) - nó lấy cả số ít và số nhiều - có định dạng dot md và cả json - các lưu ý advanced là sau này nó sẽ liên kết chặt chẽ vào các cluster liên quan đến delegation, coordination, routing, user intent và task managements và được config trực tiếp tại config.json trong configuration và governance plane)
1. append một slash command dựa vào context của workflows sau khi user prompting tại OpenCode runtime (chú ý là ở bất cứ prompting nào và được deterministically use bởi agent khi nó thấy cần thiết phải dùng qua natural language của user mà không phải nhất thiết user phải yêu cầu nó dùng execute-slash-command) - các kiến thức liên quan https://opencode.ai/docs/commands/ ; https://opencode.ai/docs/agents/ ; https://opencode.ai/docs/tui#commands ;https://opencode.ai/docs/tui#bash-commands; https://opencode.ai/docs/config ; https://opencode.ai/docs/sdk/ ; https://opencode.ai/docs/server/ ; https://opencode.ai/docs/plugins/ 
    1. → một slash command khi append có thể bao gồm yếu tố $ARGUMENTS và propositional để điều phối command theo các bước
    2. → slash command có thể kết hợp với shell! bash command nhưng đừng lẫn lộn 2 nhóm này 
    3. → để parse các file kèm với slash command (để kết hợp với references, templates, hay workflows thì việc nhắc tới  các file đó sẽ được viết ở command này  đây là một ví dụ /Users/apple/hivemind-plugin-private/.opencode/commands/gsd-plan-phase.md >

## USER (turn 2)

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

<yêu cầu: tìm các phase liên quan đến nó trước đây xem đã làm gì với nó rồi cũng như các gsd phases đã lên STATE và ROADMAP để chèn hoặc modify đúng state để không bị conflict dependencies - cũng như xem công việc hoàn thành của nhóm phases 24.x
### Miêu tả:
đây là một cluster tools và feature liên quan đến định hình routing của hm-orchestrator và các agent có quyền sử dụng để điều phối và điều chỉnh “slash commands” được lưu sẵn trong project hoặc global của OpenCode để làm các việc sau đây (lưu ý function này sẽ load các slash commands của users có tại .opencode/command(s) - nó lấy cả số ít và số nhiều - có định dạng dot md và cả json - các lưu ý advanced là sau này nó sẽ liên kết chặt chẽ vào các cluster liên quan đến delegation, coordination, routing, user intent và task managements và được config trực tiếp tại config.json trong configuration và governance plane)
1. append một slash command dựa vào context của workflows sau khi user prompting tại OpenCode runtime (chú ý là ở bất cứ prompting nào và được deterministically use bởi agent khi nó thấy cần thiết phải dùng qua natural language của user mà không phải nhất thiết user phải yêu cầu nó dùng execute-slash-command) - các kiến thức liên quan https://opencode.ai/docs/commands/ ; https://opencode.ai/docs/agents/ ; https://opencode.ai/docs/tui#commands ;https://opencode.ai/docs/tui#bash-commands; https://opencode.ai/docs/config ; https://opencode.ai/docs/sdk/ ; https://opencode.ai/docs/server/ ; https://opencode.ai/docs/plugins/ 
    1. → một slash command khi append có thể bao gồm yếu tố $ARGUMENTS và propositional để điều phối command theo các bước
    2. → slash command có thể kết hợp với shell! bash command nhưng đừng lẫn lộn 2 nhóm này 
    3. → để parse các file kèm với slash command (để kết hợp với references, templates, hay workflows thì việc nhắc tới  các file đó sẽ được viết ở command này  đây là một ví dụ /Users/apple/hivemind-plugin-private/.opencode/commands/gsd-plan-phase.md >

### Tool: task

**Input:**
```json
{
  "description": "Phân tích state hiện tại của phases 24.x",
  "subagent_type": "hm-l2-auditor",
  "task_id": "ses_19b54dac1ffecJRGpRskXRGGTM"
}
```

**Output:** (pruned)
```
task_id: ses_19b54dac1ffecJRGpRskXRGGTM
```


### Tool: task

**Input:**
```json
{
  "description": "Tìm phase liên quan đến routing và command execution",
  "subagent_type": "gsd-roadmapper",
  "task_id": "ses_19b54daeaffeB4ATvpBIzsBHC8"
}
```

**Output:** (pruned)
```
task_id: ses_19b54daeaffeB4ATvpBIzsBHC8
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
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase/ARCHITECTURE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_21bf98e286524ca2ac3a5390"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_dea79f94346249c5816d5f4c"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_a822bfd420fc4969a41f7b4f"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_8d852a0a9174494a90b68492"
}
```


## ASSISTANT (turn 1)

Tôi sẽ đọc thêm các tài liệu quan trọng để hiểu context:

## USER (turn 3)

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
Arguments: thêm phases cho đúng

Parse the first token of thêm phases cho đúng:
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of thêm phases cho đúng (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from thêm phases cho đúng.
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
32: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
33: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
34: if [ -f "$GSD_TOOLS" ]; then
35:   GSD_SDK="node $GSD_TOOLS"
36: elif command -v gsd-sdk >/dev/null 2>&1; then
37:   GSD_SDK="gsd-sdk"
38: else
39:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
40:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
41:   exit 1
42: fi
43: INIT=$($GSD_SDK query init.phase-op "0")
44: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
45: ```
46: 
47: Check `roadmap_exists` from init JSON. If false:
48: ```
49: ERROR: No roadmap found (.planning/ROADMAP.md)
50: Run /gsd-new-project to initialize.
51: ```
52: Exit.
53: </step>
54: 
55: <step name="add_phase">
56: **Delegate the phase addition to `gsd-sdk query phase.add`:**
57: 
58: ```bash
59: RESULT=$($GSD_SDK query phase.add "${description}")
60: ```
61: 
62: The CLI handles:
63: - Finding the highest existing integer phase number
64: - Calculating next phase number (max + 1)
65: - Generating slug from description
66: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
67: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
68: 
69: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
70: </step>
71: 
72: <step name="update_project_state">
73: Update STATE.md to reflect the new phase:
74: 
75: 1. Read `.planning/STATE.md`
76: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
77:    ```
78:    - Phase {N} added: {description}
79:    ```
80: 
81: If "Roadmap Evolution" section doesn't exist, create it.
82: </step>
83: 
84: <step name="completion">
85: Present completion summary:
86: 
87: ```
88: Phase {N} added to current milestone:
89: - Description: {description}
90: - Directory: .planning/phases/{phase-num}-{slug}/
91: - Status: Not planned yet
92: 
93: Roadmap updated: .planning/ROADMAP.md
94: 
95: ---
96: 
97: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
98: 
99: **Phase {N}: {description}**
100: 
101: `/clear` then:
102: 
103: `/gsd-plan-phase {N}`
104: 
105: ---
106: 
107: **Also available:**
108: - `/gsd-add-phase <description>` — add another phase
109: - Review roadmap
110: 
111: ---
112: ```
113: </step>
114: 
115: </process>
116: 
117: <success_criteria>
118: - [ ] `gsd-sdk query phase.add` executed successfully
119: - [ ] Phase directory created
120: - [ ] Roadmap updated with new phase entry
121: - [ ] STATE.md updated with roadmap evolution note
122: - [ ] User informed of next steps
123: </success_criteria>

(End of file - total 123 lines)
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
16: Example: `/gsd-phase --insert 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: /gsd-phase --insert <after> <description>
25: Example: /gsd-phase --insert 72 Fix critical auth bug
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
37: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
38: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
39: if [ -f "$GSD_TOOLS" ]; then
40:   GSD_SDK="node $GSD_TOOLS"
41: elif command -v gsd-sdk >/dev/null 2>&1; then
42:   GSD_SDK="gsd-sdk"
43: else
44:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
45:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
46:   exit 1
47: fi
48: INIT=$($GSD_SDK query init.phase-op "${after_phase}")
49: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
50: ```
51: 
52: Check `roadmap_exists` from init JSON. If false:
53: ```
54: ERROR: No roadmap found (.planning/ROADMAP.md)
55: ```
56: Exit.
57: </step>
58: 
59: <step name="insert_phase">
60: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
61: 
62: ```bash
63: RESULT=$($GSD_SDK query phase.insert "${after_phase}" "${description}")
64: ```
65: 
66: The CLI handles:
67: - Verifying target phase exists in ROADMAP.md
68: - Calculating next decimal phase number (checking existing decimals on disk)
69: - Generating slug from description
70: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
71: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
72: 
73: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
74: </step>
75: 
76: <step name="update_project_state">
77: Update STATE.md to reflect the inserted phase via SDK handlers (never raw
78: `Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
79: blocks direct STATE.md writes):
80: 
81: 1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
82:    `{decimal_phase}`:
83: 
84:    ```bash
85:    $GSD_SDK query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd-plan-phase {decimal_phase}"}'
86:    ```
87: 
88:    (Adjust field names to whatever pointers STATE.md exposes — the handler
89:    reports which fields it matched.)
90: 
91: 2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
92:    `### Roadmap Evolution` subsection under `## Accumulated Context` if missing
93:    and dedupes identical entries:
94: 
95:    ```bash
96:    $GSD_SDK query state.add-roadmap-evolution \
97:      --phase {decimal_phase} \
98:      --action inserted \
99:      --after {after_phase} \
100:      --note "{description}" \
101:      --urgent
102:    ```
103: 
104:    Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
105:    (or `{ added: false, reason: "duplicate", entry: ... }` on replay).
106: </step>
107: 
108: <step name="completion">
109: Present completion summary:
110: 
111: ```
112: Phase {decimal_phase} inserted after Phase {after_phase}:
113: - Description: {description}
114: - Directory: .planning/phases/{decimal-phase}-{slug}/
115: - Status: Not planned yet
116: - Marker: (INSERTED) - indicates urgent work
117: 
118: Roadmap updated: .planning/ROADMAP.md
119: Project state updated: .planning/STATE.md
120: 
121: ---
122: 
123: ## Next Up
124: 
125: **Phase {decimal_phase}: {description}** -- urgent insertion
126: 
127: `/clear` then:
128: 
129: `/gsd-plan-phase {decimal_phase}`
130: 
131: ---
132: 
133: **Also available:**
134: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
135: - Review roadmap
136: 
137: ---
138: ```
139: </step>
140: 
141: </process>
142: 
143: <anti_patterns>
144: 
145: - Don't use this for planned work at end of milestone (use /gsd-add-phase)
146: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
147: - Don't renumber existing phases
148: - Don't modify the target phase content
149: - Don't create plans yet (that's /gsd-plan-phase)
150: - Don't commit changes (user decides when to commit)
151: </anti_patterns>
152: 
153: <success_criteria>
154: Phase insertion is complete when:
155: 
156: - [ ] `gsd-sdk query phase.insert` executed successfully
157: - [ ] Phase directory created
158: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
159: - [ ] `gsd-sdk query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
160: - [ ] `gsd-sdk query state.patch` returned matched next-phase pointer field(s)
161: - [ ] User informed of next steps and dependency implications
162: </success_criteria>

(End of file - total 162 lines)
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
32: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
33: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
34: if [ -f "$GSD_TOOLS" ]; then
35:   GSD_SDK="node $GSD_TOOLS"
36: elif command -v gsd-sdk >/dev/null 2>&1; then
37:   GSD_SDK="gsd-sdk"
38: else
39:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
40:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
41:   exit 1
42: fi
43: INIT=$($GSD_SDK query init.phase-op "${target}")
44: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
45: ```
46: 
47: Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.
48: 
49: Also read STATE.md and ROADMAP.md content for parsing current position.
50: </step>
51: 
52: <step name="validate_future_phase">
53: Verify the phase is a future phase (not started):
54: 
55: 1. Compare target phase to current phase from STATE.md
56: 2. Target must be > current phase number
57: 
58: If target <= current phase:
59: 
60: ```
61: ERROR: Cannot remove Phase {target}
62: 
63: Only future phases can be removed:
64: - Current phase: {current}
65: - Phase {target} is current or completed
66: 
67: To abandon current work, use /gsd-pause-work instead.
68: ```
69: 
70: Exit.
71: </step>
72: 
73: <step name="confirm_removal">
74: Present removal summary and confirm:
75: 
76: ```
77: Removing Phase {target}: {Name}
78: 
79: This will:
80: - Delete: .planning/phases/{target}-{slug}/
81: - Renumber all subsequent phases
82: - Update: ROADMAP.md, STATE.md
83: 
84: Proceed? (y/n)
85: ```
86: 
87: Wait for confirmation.
88: </step>
89: 
90: <step name="execute_removal">
91: **Delegate the entire removal operation to `gsd-sdk query phase.remove`:**
92: 
93: ```bash
94: RESULT=$($GSD_SDK query phase.remove "${target}")
95: ```
96: 
97: If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:
98: 
99: ```bash
100: RESULT=$($GSD_SDK query phase.remove "${target}" --force)
101: ```
102: 
103: The CLI handles:
104: - Deleting the phase directory
105: - Renumbering all subsequent directories (in reverse order to avoid conflicts)
106: - Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
107: - Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
108: - Updating STATE.md (decrementing phase count)
109: 
110: Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
111: </step>
112: 
113: <step name="commit">
114: Stage and commit the removal:
115: 
116: ```bash
117: $GSD_SDK query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
118: ```
119: 
120: The commit message preserves the historical record of what was removed.
121: </step>
122: 
123: <step name="completion">
124: Present completion summary:
125: 
126: ```
127: Phase {target} ({original-name}) removed.
128: 
129: Changes:
130: - Deleted: .planning/phases/{target}-{slug}/
131: - Renumbered: {N} directories and {M} files
132: - Updated: ROADMAP.md, STATE.md
133: - Committed: chore: remove phase {target} ({original-name})
134: 
135: ---
136: 
137: ## What's Next
138: 
139: Would you like to:
140: - `/gsd-progress` — see updated roadmap status
141: - Continue with current phase
142: - Review roadmap
143: 
144: ---
145: ```
146: </step>
147: 
148: </process>
149: 
150: <anti_patterns>
151: 
152: - Don't remove completed phases (have SUMMARY.md files) without --force
153: - Don't remove current or past phases
154: - Don't manually renumber — use `gsd-sdk query phase.remove` which handles all renumbering
155: - Don't add "removed phase" notes to STATE.md — git commit is the record
156: - Don't modify completed phase directories
157: </anti_patterns>
158: 
159: <success_criteria>
160: Phase removal is complete when:
161: 
162: - [ ] Target phase validated as future/unstarted
163: - [ ] `gsd-sdk query phase.remove` executed successfully
164: - [ ] Changes committed with descriptive message
165: - [ ] User informed of changes
166: </success_criteria>

(End of file - total 166 lines)
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
37: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
38: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
39: if [ -f "$GSD_TOOLS" ]; then
40:   GSD_SDK="node $GSD_TOOLS"
41: elif command -v gsd-sdk >/dev/null 2>&1; then
42:   GSD_SDK="gsd-sdk"
43: else
44:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
45:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
46:   exit 1
47: fi
48: INIT=$($GSD_SDK query init.phase-op "${target}")
49: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
50: ```
51: 
52: Check `roadmap_exists` from init JSON. If false:
53: ```
54: ERROR: No roadmap found (.planning/ROADMAP.md)
55: Run /gsd-new-project to initialize.
56: ```
57: Exit.
58: </step>
59: 
60: <step name="load_phase">
61: Read the current phase section from ROADMAP.md:
62: 
63: ```bash
64: PHASE_DATA=$($GSD_SDK query roadmap get-phase "${target}")
65: ```
66: 
67: Parse the JSON result. If `found` is false:
68: 
69: ```
70: ERROR: Phase {target} not found in ROADMAP.md
71: 
72: Available phases can be seen with /gsd-progress.
73: ```
74: 
75: Exit.
76: 
77: Extract from the result:
78: - `phase_name` — the phase title
79: - `goal` — the phase goal/description
80: - `success_criteria` — array of criteria
81: - `section` — full raw section text (preserves depends_on, requirements, plans, etc.)
82: 
83: Also parse the full section text to extract additional fields not in the SDK result:
84: - `depends_on` — from `**Depends on:** ...` or `**Depends on**: ...` line
85: - `requirements` — from `**Requirements:** ...` block if present
86: </step>
87: 
88: <step name="check_phase_status">
89: Determine the phase status from disk. Compare against STATE.md current phase:
90: 
91: ```bash
92: ANALYZE=$($GSD_SDK query roadmap analyze)
93: ```
94: 
95: Find the phase entry in the `phases` array. Extract `disk_status`.
96: 
97: Map disk_status to a user-friendly status:
98: - `complete` → status = `completed`
99: - `planned` or `partial` → status = `in_progress`
100: - `empty`, `no_directory`, `discussed`, `researched` → status = `future`
101: 
102: If status is `in_progress` or `completed` AND `--force` was NOT passed:
103: 
104: ```
105: ERROR: Cannot edit Phase {target} — status is {status}
106: 
107: Editing an in-progress or completed phase may invalidate executed plans.
108: 
109: To edit anyway, run:
110:   /gsd-edit-phase {target} --force
111: ```
112: 
113: Exit.
114: 
115: If `--force` was passed and status is `in_progress` or `completed`, continue with a warning printed to the user:
116: 
117: ```
118: WARNING: Editing Phase {target} which is {status}. Proceeding due to --force.
119: ```
120: </step>
121: 
122: <step name="present_current_values">
123: Display the current phase fields clearly:
124: 
125: ```
126: Current values for Phase {target}: {phase_name}
127: 
128: Title:            {phase_name}
129: Goal:             {goal}
130: Depends on:       {depends_on or "(none)"}
131: Requirements:     {requirements or "(none)"}
132: Success Criteria:
133:   1. {criterion_1}
134:   2. {criterion_2}
135:   ...
136: ```
137: 
138: Then ask the user what they want to change:
139: 
140: ```
141: What would you like to do?
142: 
143:   [1] Edit specific fields (title, goal, depends_on, requirements, success_criteria)
144:   [2] Regenerate all fields from a clarified intent
145:   [3] Cancel
146: 
147: Enter choice (1, 2, or 3):
148: ```
149: 
150: Wait for user input.
151: </step>
152: 
153: <step name="collect_edits">
154: 
155: **If user chose [3] Cancel:** Exit cleanly.
156: 
157: **If user chose [1] Edit specific fields:**
158: 
159: Ask which fields to edit. For each field the user wants to change, prompt for the new value. Only fields the user explicitly answers become updates; empty answers preserve the existing value.
160: 
161: ```
162: Which fields do you want to update? (comma-separated or "all")
163: Options: title, goal, depends_on, requirements, success_criteria
164: ```
165: 
166: For each selected field, ask:
167: 
168: ```
169: New value for {field} [current: {current_value}]:
170: ```
171: 
172: Build an `updates` map of {field → new_value} for non-empty answers.
173: 
174: **If user chose [2] Regenerate all from clarified intent:**
175: 
176: Ask the user:
177: 
178: ```
179: Describe the revised intent for Phase {target} (replace the current description):
180: ```
181: 
182: Wait for user input. Use the clarified intent to rewrite all fields:
183: - Generate a clear, concise `title` from the intent
184: - Write a complete `goal` statement
185: - Produce updated `requirements` if the original had them
186: - Generate `success_criteria` (3-5 measurable criteria)
187: - Preserve `depends_on` unless the user explicitly mentioned changing it
188: </step>
189: 
190: <step name="validate_depends_on">
191: If `depends_on` is being updated (or preserved as non-empty), validate that every referenced phase number exists in ROADMAP.md:
192: 
193: ```bash
194: ALL_PHASES=$($GSD_SDK query roadmap analyze)
195: ```
196: 
197: Parse the `phases` array to get all valid phase numbers.
198: 
199: For each phase number referenced in `depends_on`:
200: - Normalize it (strip whitespace, "Phase" prefix if present)
201: - Check it is in the valid phase numbers set
202: - It must not reference itself (phase {target})
203: 
204: If any reference is invalid:
205: 
206: ```
207: ERROR: depends_on references invalid phase(s): {bad_refs}
208: 
209: Valid phase numbers: {valid_list}
210: 
211: Fix the depends_on field and try again.
212: ```
213: 
214: Exit (do not write).
215: </step>
216: 
217: <step name="show_diff_and_confirm">
218: Build the updated phase section by applying the changes to the original `section` text:
219: 
220: - For `title`: replace the heading text after `Phase {N}:`
221: - For `goal`: replace the `**Goal:**` line value
222: - For `depends_on`: replace or add the `**Depends on:**` line
223: - For `requirements`: replace or add the requirements block
224: - For `success_criteria`: replace the numbered list under `**Success Criteria**:`
225: - For full regeneration: rebuild the entire section from the new field values
226: 
227: Show a unified-style diff of old vs. new:
228: 
229: ```
230: Proposed changes to Phase {target}:
231: 
232: --- current
233: +++ updated
234: @@ ...
235: - **Goal:** {old_goal}
236: + **Goal:** {new_goal}
237: ...
238: 
239: Apply these changes? (y/n):
240: ```
241: 
242: Wait for confirmation. If the user says `n`, exit without writing.
243: </step>
244: 
245: <step name="write_updated_phase">
246: Write the updated phase back in place in ROADMAP.md.
247: 
248: Read the full ROADMAP.md content, locate the phase section by its header (`## Phase {N}:` or `### Phase {N}:`), and replace exactly the old section text with the new section text. All content before and after the section (including other phases, milestone headers, and the summary checklist) must be left unchanged.
249: 
250: After writing ROADMAP.md, update STATE.md Roadmap Evolution:
251: 
252: ```bash
253: $GSD_SDK query state.add-roadmap-evolution \
254:   --phase {target} \
255:   --action edited \
256:   --note "edited fields: {changed_field_list}"
257: ```
258: </step>
259: 
260: <step name="completion">
261: Present completion summary:
262: 
263: ```
264: Phase {target} updated in ROADMAP.md.
265: 
266: Fields changed: {changed_field_list}
267: 
268: ---
269: 
270: ## What's Next
271: 
272: - `/gsd-progress` — view updated roadmap
273: - `/gsd-plan-phase {target}` — re-plan this phase (if needed)
274: - `/gsd-discuss-phase {target}` — discuss implementation approach
275: 
276: ---
277: ```
278: </step>
279: 
280: </process>
281: 
282: <anti_patterns>
283: - Don't renumber the phase — number and position must be preserved exactly
284: - Don't modify other phases when editing one
285: - Don't skip depends_on validation (invalid references block writes)
286: - Don't write without showing a diff and getting confirmation
287: - Don't edit in_progress/completed phases without --force
288: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
289: - Don't modify the phase directory structure — only ROADMAP.md changes
290: - Don't commit the change — that's the user's decision
291: </anti_patterns>
292: 
293: <success_criteria>
294: Edit-phase is complete when:
295: 
296: - [ ] Phase {target} found and loaded from ROADMAP.md
297: - [ ] Status check performed; in_progress/completed blocked without --force
298: - [ ] Current values presented to user
299: - [ ] User chose edit mode (specific fields or full regeneration)
300: - [ ] depends_on references validated; invalid references blocked
301: - [ ] Diff shown and confirmed by user
302: - [ ] Updated phase written back in place; number, position, and status preserved
303: - [ ] STATE.md Roadmap Evolution updated
304: - [ ] User informed of next steps
305: </success_criteria>

(End of file - total 305 lines)
</content>

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_dfc6b59a13124eb8afa23f6e"
}
```


## USER (turn 4)

**source:** real-human

/insert-phase 24.3 Execute-Slash-Command Core Revamp

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
  "callID": "call_095b5d3462fb4a0aa36af411"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_ac63f23f9a874378b4a6e45f"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_d8a6d97d0156441395020d10"
}
```


## ASSISTANT (turn 2)

Tools: edit

## USER (turn 5)

**source:** real-human

<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action.

Three modes:
- **default**: Show progress report + intelligently route to the next action (execute or plan). Provides situational awareness before continuing work.
- **--next**: Automatically advance to the next logical step without manual route selection. Reads STATE.md, ROADMAP.md, and phase directories. Supports `--force` to bypass safety gates.
- **--do "task description"**: Analyze freeform natural language and dispatch to the most appropriate GSD command. Never does the work itself — matches intent, confirms, hands off.
- **--forensic**: Append a 6-check integrity audit after the standard progress report.
</objective>

<flags>
- **--next**: Detect current project state and automatically invoke the next logical GSD workflow step. Scans all prior phases for incomplete work before routing. `--next --force` bypasses safety gates.
- **--do "..."**: Smart dispatcher — match freeform intent to the best GSD command using routing rules, confirm the match, then hand off.
- **--forensic**: Run 6-check integrity audit after the standard progress report.
- **(no flag)**: Standard progress check + intelligent routing (Routes A through F).
</flags>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<process>
Parse the first token of :
- If it is `--next`: strip the flag, execute the next workflow (passing remaining args e.g. --force).
- If it is `--do`: strip the flag, pass remainder as freeform intent to the do workflow.
- Otherwise: execute the progress workflow end-to-end (pass --forensic through if present).

Preserve all routing logic from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/progress.md</path>
<type>file</type>
<content>
1: <purpose>
2: Check project progress, summarize recent work and what's ahead, then intelligently route to the next action — either executing an existing plan or creating the next one. Provides situational awareness before continuing work.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="init_context">
12: **Load progress context (paths only):**
13: 
14: ```bash
15: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
16: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
17: if [ -f "$GSD_TOOLS" ]; then
18:   GSD_SDK="node $GSD_TOOLS"
19: elif command -v gsd-sdk >/dev/null 2>&1; then
20:   GSD_SDK="gsd-sdk"
21: else
22:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
23:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
24:   exit 1
25: fi
26: INIT=$($GSD_SDK query init.progress)
27: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
28: ```
29: 
30: Extract from init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`.
31: 
32: ```bash
33: DISCUSS_MODE=$($GSD_SDK query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
34: ```
35: 
36: If `project_exists` is false (no `.planning/` directory):
37: 
38: ```
39: No planning structure found.
40: 
41: Run /gsd-new-project to start a new project.
42: ```
43: 
44: Exit.
45: 
46: If missing STATE.md: suggest `/gsd-new-project`.
47: 
48: **If ROADMAP.md missing but PROJECT.md exists:**
49: 
50: This means a milestone was completed and archived. Go to **Route F** (between milestones).
51: 
52: If missing both ROADMAP.md and PROJECT.md: suggest `/gsd-new-project`.
53: </step>
54: 
55: <step name="load">
56: **Use structured extraction from `gsd-sdk query` (or legacy gsd-tools.cjs):**
57: 
58: Instead of reading full files, use targeted tools to get only the data needed for the report:
59: - `ROADMAP=$(gsd-sdk query roadmap.analyze)`
60: - `STATE=$(gsd-sdk query state-snapshot)`
61: 
62: This minimizes orchestrator context usage.
63: </step>
64: 
65: <step name="analyze_roadmap">
66: **Get comprehensive roadmap analysis (replaces manual parsing):**
67: 
68: ```bash
69: ROADMAP=$($GSD_SDK query roadmap.analyze)
70: ```
71: 
72: This returns structured JSON with:
73: - All phases with disk status (complete/partial/planned/empty/no_directory)
74: - Goal and dependencies per phase
75: - Plan and summary counts per phase
76: - Aggregated stats: total plans, summaries, progress percent
77: - Current and next phase identification
78: 
79: Use this instead of manually reading/parsing ROADMAP.md.
80: </step>
81: 
82: <step name="recent">
83: **Gather recent work context:**
84: 
85: - Find the 2-3 most recent SUMMARY.md files
86: - Use `summary-extract` for efficient parsing:
87:   ```bash
88:   $GSD_SDK query summary-extract <path> --fields one_liner
89:   ```
90: - This shows "what we've been working on"
91:   </step>
92: 
93: <step name="position">
94: **Parse current position from init context and roadmap analysis:**
95: 
96: - Use `current_phase` and `next_phase` from `$ROADMAP`
97: - Note `paused_at` if work was paused (from `$STATE`)
98: - Count pending todos: use `init todos` or `list-todos`
99: - Check for active debug sessions: `(ls .planning/debug/*.md 2>/dev/null || true) | grep -v resolved | wc -l`
100:   </step>
101: 
102: <step name="report">
103: > ⚠️ Context authority: PROJECT.md, STATE.md, and ROADMAP.md are the authoritative sources
104: > for project name, milestone, current phase, and next-step routing. AGENTS.md ## Project
105: > blocks are a secondary config aid that may be significantly stale — do NOT use the
106: > AGENTS.md project description as a source for any progress report field.
107: 
108: **Generate progress bar from `gsd-sdk query progress` / `progress.json`, then present rich status report:**
109: 
110: ```bash
111: # Get formatted progress bar
112: PROGRESS_BAR=$($GSD_SDK query progress.bar --raw)
113: ```
114: 
115: Present:
116: 
117: ```
118: # [Project Name]
119: 
120: **Progress:** {PROGRESS_BAR}
121: **Profile:** [quality/balanced/budget/inherit]
122: **Discuss mode:** {DISCUSS_MODE}
123: 
124: ## Recent Work
125: - [Phase X, Plan Y]: [what was accomplished - 1 line from summary-extract]
126: - [Phase X, Plan Z]: [what was accomplished - 1 line from summary-extract]
127: 
128: ## Current Position
129: Phase [N] of [total]: [phase-name]
130: Plan [M] of [phase-total]: [status]
131: CONTEXT: [✓ if has_context | - if not]
132: 
133: ## Key Decisions Made
134: - [extract from $STATE.decisions[]]
135: - [e.g. jq -r '.decisions[].decision' from state-snapshot]
136: 
137: ## Blockers/Concerns
138: - [extract from $STATE.blockers[]]
139: - [e.g. jq -r '.blockers[].text' from state-snapshot]
140: 
141: ## Pending Todos
142: - [count] pending — /gsd-capture --list to review
143: 
144: ## Active Debug Sessions
145: - [count] active — /gsd-debug to continue
146: (Only show this section if count > 0)
147: 
148: ## What's Next
149: [Next phase/plan objective from roadmap analyze]
150: ```
151: 
152: </step>
153: 
154: <step name="mvp_display">
155: **MVP-mode display (when phase has `**Mode:** mvp` in ROADMAP.md).**
156: 
157: Resolve `MVP_MODE` per phase via the centralized resolver. progress has no `--mvp` CLI flag (mode is inherited from the planned phase), so we omit `--cli-flag`:
158: 
159: ```bash
160: MVP_MODE=$($GSD_SDK query phase.mvp-mode "${PHASE_NUMBER}" --pick active)
161: ```
162: 
163: When `MVP_MODE=true`, the per-phase progress block adds a **user-flow status** sub-block sourced from the phase's PLAN.md task names. Each task whose name reads like a user-visible capability (e.g., "Register flow", "Login flow", "Password reset") is rendered as a status line:
164: 
165: ```
166: Phase 1 — User Auth MVP
167:   ✅ Walking Skeleton complete           ← from SKELETON.md existence
168:   ✅ Register flow working               ← from PLAN.md task with summary
169:   ✅ Login flow working                  ← from PLAN.md task with summary
170:   🔄 Password reset (in progress)        ← from PLAN.md task without summary
171:   ⬜ Email verification                  ← from PLAN.md task not yet started
172: ```
173: 
174: **User-flow filter:** Tasks whose names are technical-sounding ("Wire DB schema", "Create migration", "Bump deps") are NOT rendered as user-flow status lines. Heuristic: a task name is user-flow-shaped if it ends in "flow", "page", "screen", or starts with a verb the user would recognize ("Register", "Login", "Upload", "View"). Tasks that fail the heuristic still count toward the standard task progress total but don't appear in the user-flow sub-block.
175: 
176: When `MVP_MODE=false` (mode is null, absent, or the phase has no `**Mode:**` line), fall back to the standard display path — no behavioral change.
177: </step>
178: 
179: <step name="route">
180: **Determine next action based on verified counts.**
181: 
182: **Step 1: Count plans, summaries, and issues in current phase**
183: 
184: List files in the current phase directory:
185: 
186: ```bash
187: (ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null || true) | wc -l
188: (ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null || true) | wc -l
189: (ls -1 .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true) | wc -l
190: ```
191: 
192: State: "This phase has {X} plans, {Y} summaries."
193: 
194: **Step 1.5: Check for unaddressed UAT gaps**
195: 
196: Check for UAT.md files with status "diagnosed" (has gaps needing fixes).
197: 
198: ```bash
199: # Check for diagnosed UAT with gaps or partial (incomplete) testing
200: grep -l "status: diagnosed\|status: partial" .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true
201: ```
202: 
203: Track:
204: - `uat_with_gaps`: UAT.md files with status "diagnosed" (gaps need fixing)
205: - `uat_partial`: UAT.md files with status "partial" (incomplete testing)
206: 
207: **Step 1.6: Cross-phase health check**
208: 
209: Scan ALL phases in the current milestone for outstanding verification debt using the CLI (which respects milestone boundaries via `getMilestonePhaseFilter`):
210: 
211: ```bash
212: DEBT=$($GSD_SDK query audit-uat --raw 2>/dev/null)
213: ```
214: 
215: Parse JSON for `summary.total_items` and `summary.total_files`.
216: 
217: Track: `outstanding_debt` — `summary.total_items` from the audit.
218: 
219: **If outstanding_debt > 0:** Add a warning section to the progress report output (in the `report` step), placed between "## What's Next" and the route suggestion:
220: 
221: ```markdown
222: ## Verification Debt ({N} files across prior phases)
223: 
224: | Phase | File | Issue |
225: |-------|------|-------|
226: | {phase} | {filename} | {pending_count} pending, {skipped_count} skipped, {blocked_count} blocked |
227: | {phase} | {filename} | human_needed — {count} items |
228: 
229: Review: `/gsd-audit-uat ${GSD_WS}` — full cross-phase audit
230: Resume testing: `/gsd-verify-work {phase} ${GSD_WS}` — retest specific phase
231: ```
232: 
233: This is a WARNING, not a blocker — routing proceeds normally. The debt is visible so the user can make an informed choice.
234: 
235: **Step 2: Route based on counts**
236: 
237: | Condition | Meaning | Action |
238: |-----------|---------|--------|
239: | uat_partial > 0 | UAT testing incomplete | Go to **Route E.2** |
240: | uat_with_gaps > 0 | UAT gaps need fix plans | Go to **Route E** |
241: | summaries < plans | Unexecuted plans exist | Go to **Route A** |
242: | summaries = plans AND plans > 0 | Phase complete | Go to Step 3 |
243: | plans = 0 | Phase not yet planned | Go to **Route B** |
244: 
245: ---
246: 
247: **Route A: Unexecuted plan exists**
248: 
249: Find the first PLAN.md without matching SUMMARY.md.
250: Read its `<objective>` section.
251: 
252: ```
253: ---
254: 
255: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
256: 
257: **{phase}-{plan}: [Plan Name]** — [objective summary from PLAN.md]
258: 
259: `/clear` then:
260: 
261: `/gsd-execute-phase {phase} ${GSD_WS}`
262: 
263: ---
264: ```
265: 
266: ---
267: 
268: **Route B: Phase needs planning**
269: 
270: Check if `{phase_num}-CONTEXT.md` exists in phase directory.
271: 
272: Check if current phase has UI indicators:
273: 
274: ```bash
275: PHASE_SECTION=$($GSD_SDK query roadmap.get-phase "${CURRENT_PHASE}" 2>/dev/null)
276: PHASE_HAS_UI=$(echo "$PHASE_SECTION" | grep -qi "UI hint.*yes" && echo "true" || echo "false")
277: ```
278: 
279: **If CONTEXT.md exists:**
280: 
281: ```
282: ---
283: 
284: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
285: 
286: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
287: <sub>✓ Context gathered, ready to plan</sub>
288: 
289: `/clear` then:
290: 
291: `/gsd-plan-phase {phase-number} ${GSD_WS}`
292: 
293: ---
294: ```
295: 
296: **If CONTEXT.md does NOT exist AND phase has UI (`PHASE_HAS_UI` is `true`):**
297: 
298: ```
299: ---
300: 
301: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
302: 
303: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
304: 
305: `/clear` then:
306: 
307: `/gsd-discuss-phase {phase}` — gather context and clarify approach
308: 
309: ---
310: 
311: **Also available:**
312: - `/gsd-ui-phase {phase}` — generate UI design contract (recommended for frontend phases)
313: - `/gsd-plan-phase {phase}` — skip discussion, plan directly
314: - `/gsd-discuss-phase {phase}` — include assumptions check before planning
315: 
316: ---
317: ```
318: 
319: **If CONTEXT.md does NOT exist AND phase has no UI:**
320: 
321: ```
322: ---
323: 
324: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
325: 
326: **Phase {N}: {Name}** — {Goal from ROADMAP.md}
327: 
328: `/clear` then:
329: 
330: `/gsd-discuss-phase {phase} ${GSD_WS}` — gather context and clarify approach
331: 
332: ---
333: 
334: **Also available:**
335: - `/gsd-plan-phase {phase} ${GSD_WS}` — skip discussion, plan directly
336: - `/gsd-discuss-phase {phase} ${GSD_WS}` — include assumptions check before planning
337: 
338: ---
339: ```
340: 
341: ---
342: 
343: **Route E: UAT gaps need fix plans**
344: 
345: UAT.md exists with gaps (diagnosed issues). User needs to plan fixes.
346: 
347: ```
348: ---
349: 
350: ## ⚠ UAT Gaps Found
351: 
352: **{phase_num}-UAT.md** has {N} gaps requiring fixes.
353: 
354: `/clear` then:
355: 
356: `/gsd-plan-phase {phase} --gaps ${GSD_WS}`
357: 
358: ---
359: 
360: **Also available:**
361: - `/gsd-execute-phase {phase} ${GSD_WS}` — execute phase plans
362: - `/gsd-verify-work {phase} ${GSD_WS}` — run more UAT testing
363: 
364: ---
365: ```
366: 
367: ---
368: 
369: **Route E.2: UAT testing incomplete (partial)**
370: 
371: UAT.md exists with `status: partial` — testing session ended before all items resolved.
372: 
373: ```
374: ---
375: 
376: ## Incomplete UAT Testing
377: 
378: **{phase_num}-UAT.md** has {N} unresolved tests (pending, blocked, or skipped).
379: 
380: `/clear` then:
381: 
382: `/gsd-verify-work {phase} ${GSD_WS}` — resume testing from where you left off
383: 
384: ---
385: 
386: **Also available:**
387: - `/gsd-audit-uat ${GSD_WS}` — full cross-phase UAT audit
388: - `/gsd-execute-phase {phase} ${GSD_WS}` — execute phase plans
389: 
390: ---
391: ```
392: 
393: ---
394: 
395: **Step 3: Check milestone status (only when phase complete)**
396: 
397: Read ROADMAP.md and identify:
398: 1. Current phase number
399: 2. All phase numbers in the current milestone section
400: 
401: Count total phases and identify the highest phase number.
402: 
403: State: "Current phase is {X}. Milestone has {N} phases (highest: {Y})."
404: 
405: **Route based on milestone status:**
406: 
407: | Condition | Meaning | Action |
408: |-----------|---------|--------|
409: | current phase < highest phase | More phases remain | Go to **Route C** |
410: | current phase = highest phase | Milestone complete | Go to **Route D** |
411: 
412: ---
413: 
414: **Route C: Phase complete, more phases remain**
415: 
416: Read ROADMAP.md to get the next phase's name and goal.
417: 
418: Check if next phase has UI indicators:
419: 
420: ```bash
421: NEXT_PHASE_SECTION=$($GSD_SDK query roadmap.get-phase "$((Z+1))" 2>/dev/null)
422: NEXT_HAS_UI=$(echo "$NEXT_PHASE_SECTION" | grep -qi "UI hint.*yes" && echo "true" || echo "false")
423: ```
424: 
425: **If next phase has UI (`NEXT_HAS_UI` is `true`):**
426: 
427: ```
428: ---
429: 
430: ## ✓ Phase {Z} Complete
431: 
432: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
433: 
434: **Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}
435: 
436: `/clear` then:
437: 
438: `/gsd-discuss-phase {Z+1}` — gather context and clarify approach
439: 
440: ---
441: 
442: **Also available:**
443: - `/gsd-ui-phase {Z+1}` — generate UI design contract (recommended for frontend phases)
444: - `/gsd-plan-phase {Z+1}` — skip discussion, plan directly
445: - `/gsd-verify-work {Z}` — user acceptance test before continuing
446: 
447: ---
448: ```
449: 
450: **If next phase has no UI:**
451: 
452: ```
453: ---
454: 
455: ## ✓ Phase {Z} Complete
456: 
457: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
458: 
459: **Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}
460: 
461: `/clear` then:
462: 
463: `/gsd-discuss-phase {Z+1} ${GSD_WS}` — gather context and clarify approach
464: 
465: ---
466: 
467: **Also available:**
468: - `/gsd-plan-phase {Z+1} ${GSD_WS}` — skip discussion, plan directly
469: - `/gsd-verify-work {Z} ${GSD_WS}` — user acceptance test before continuing
470: 
471: ---
472: ```
473: 
474: ---
475: 
476: **Route D: Milestone complete**
477: 
478: ```
479: ---
480: 
481: ## 🎉 Milestone Complete
482: 
483: All {N} phases finished!
484: 
485: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
486: 
487: **Complete Milestone** — archive and prepare for next
488: 
489: `/clear` then:
490: 
491: `/gsd-complete-milestone ${GSD_WS}`
492: 
493: ---
494: 
495: **Also available:**
496: - `/gsd-verify-work ${GSD_WS}` — user acceptance test before completing milestone
497: 
498: ---
499: ```
500: 
501: ---
502: 
503: **Route F: Between milestones (ROADMAP.md missing, PROJECT.md exists)**
504: 
505: A milestone was completed and archived. Ready to start the next milestone cycle.
506: 
507: Read MILESTONES.md to find the last completed milestone version.
508: 
509: ```
510: ---
511: 
512: ## ✓ Milestone v{X.Y} Complete
513: 
514: Ready to plan the next milestone.
515: 
516: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
517: 
518: **Start Next Milestone** — questioning → research → requirements → roadmap
519: 
520: `/clear` then:
521: 
522: `/gsd-new-milestone ${GSD_WS}`
523: 
524: ---
525: ```
526: 
527: </step>
528: 
529: <step name="edge_cases">
530: **Handle edge cases:**
531: 
532: - Phase complete but next phase not planned → offer `/gsd-plan-phase [next] ${GSD_WS}`
533: - All work complete → offer milestone completion
534: - Blockers present → highlight before offering to continue
535: - Handoff file exists → mention it, offer `/gsd-resume-work ${GSD_WS}`
536: </step>
537: 
538: <step name="forensic_audit">
539: **Forensic Integrity Audit** — only runs when `--forensic` is present in ARGUMENTS.
540: 
541: If `--forensic` is NOT present in ARGUMENTS: skip this step entirely. Default progress behavior (standard report + routing) is unchanged.
542: 
543: If `--forensic` IS present: after the standard report and routing suggestion have been displayed, append the following audit section.
544: 
545: ---
546: 
547: ## Forensic Integrity Audit
548: 
549: Running 6 deep checks against project state...
550: 
551: Run each check in order. For each check, emit ✓ (pass) or ⚠ (warning) with concrete evidence when a problem is found.
552: 
553: **Check 1 — STATE vs artifact consistency**
554: 
555: Read STATE.md `status` / `stopped_at` fields (from the STATE snapshot already loaded). Compare against the artifact count from the roadmap analysis. If STATE.md claims the current phase is pending/mid-flight but the artifact count shows it as complete (all PLAN.md files have matching SUMMARY.md files), flag inconsistency. Emit:
556: - ✓ `STATE.md consistent with artifact count` — if both agree
557: - ⚠ `STATE.md claims [status] but artifact count shows phase complete` — with the specific values
558: 
559: **Check 2 — Orphaned handoff files**
560: 
561: Check for existence of:
562: ```bash
563: ls .planning/HANDOFF.json .planning/phases/*/.continue-here.md .planning/phases/*/*HANDOFF*.md 2>/dev/null || true
564: ```
565: Also check `.planning/continue-here.md`.
566: 
567: Emit:
568: - ✓ `No orphaned handoff files` — if none found
569: - ⚠ `Orphaned handoff files found` — list each file path, add: `→ Work was paused mid-flight. Read the handoff before continuing.`
570: 
571: **Check 3 — Deferred scope drift**
572: 
573: Search phase artifacts (CONTEXT.md, DISCUSSION-LOG.md, BUG-BRIEF.md, VERIFICATION.md, SUMMARY.md, HANDOFF.md files under `.planning/phases/`) for patterns:
574: ```bash
575: grep -rl "defer to Phase\|future phase\|out of scope Phase\|deferred to Phase" .planning/phases/ 2>/dev/null || true
576: ```
577: 
578: For each match, extract the referenced phase number. Cross-reference against ROADMAP.md phase list. If the referenced phase number is NOT in ROADMAP.md, flag as deferred scope not captured.
579: 
580: Emit:
581: - ✓ `All deferred scope captured in ROADMAP` — if no mismatches
582: - ⚠ `Deferred scope references phase(s) not in ROADMAP` — list: file, reference text, missing phase number
583: 
584: **Check 4 — Memory-flagged pending work**
585: 
586: Check if `.planning/MEMORY.md` or `.planning/memory/` exists:
587: ```bash
588: ls .planning/MEMORY.md .planning/memory/*.md 2>/dev/null || true
589: ```
590: 
591: If found, grep for entries containing: `pending`, `status`, `deferred`, `not yet run`, `backfill`, `blocking`.
592: 
593: Emit:
594: - ✓ `No memory entries flagging pending work` — if none found or no MEMORY.md
595: - ⚠ `Memory entries flag pending/deferred work` — list the matching lines (max 5, truncated at 80 chars)
596: 
597: **Check 5 — Blocking operational todos**
598: 
599: Check for pending todos:
600: ```bash
601: ls .planning/todos/pending/*.md 2>/dev/null || true
602: ```
603: 
604: For files found, scan for keywords indicating operational blockers: `script`, `credential`, `API key`, `manual`, `verification`, `setup`, `configure`, `run `.
605: 
606: Emit:
607: - ✓ `No blocking operational todos` — if no pending todos or none match operational keywords
608: - ⚠ `Blocking operational todos found` — list the file names and matching keywords (max 5)
609: 
610: **Check 6 — Uncommitted code**
611: 
612: ```bash
613: git status --porcelain 2>/dev/null | grep -v "^??" | grep -v "^.planning\/" | grep -v "^\.\." | head -10
614: ```
615: 
616: If output is non-empty (modified/staged files outside `.planning/`), flag as uncommitted code.
617: 
618: Emit:
619: - ✓ `Working tree clean` — if no modified files outside `.planning/`
620: - ⚠ `Uncommitted changes in source files` — list up to 10 file paths
621: 
622: ---
623: 
624: After all 6 checks, display the verdict:
625: 
626: **If all 6 checks passed:**
627: ```
628: ### Verdict: CLEAN
629: 
630: The standard progress report is trustworthy — proceed with the routing suggestion above.
631: ```
632: 
633: **If 1 or more checks failed:**
634: ```
635: ### Verdict: N INTEGRITY ISSUE(S) FOUND
636: 
637: The standard progress report may not reflect true project state.
638: Review the flagged items above before acting on the routing suggestion.
639: ```
640: 
641: Then for each failed check, add a concrete next action:
642: - Check 2 (orphaned handoff): `Read the handoff file(s) and resume from where work was paused: /gsd-resume-work ${GSD_WS}`
643: - Check 3 (deferred scope): `Add the missing phases to ROADMAP.md or update the deferred references`
644: - Check 4 (memory pending): `Review the flagged memory entries and resolve or clear them`
645: - Check 5 (blocking todos): `Complete the operational steps in .planning/todos/pending/ before continuing`
646: - Check 6 (uncommitted code): `Commit or stash the uncommitted changes before advancing`
647: - Check 1 (STATE inconsistency): `Run /gsd-verify-work ${PHASE} ${GSD_WS} to reconcile state`
648: </step>
649: 
650: </process>
651: 
652: <success_criteria>
653: 
654: - [ ] Rich context provided (recent work, decisions, issues)
655: - [ ] Current position clear with visual progress
656: - [ ] What's next clearly explained
657: - [ ] Smart routing: /gsd-execute-phase if plans exist, /gsd-plan-phase if not
658: - [ ] User confirms before any action
659: - [ ] Seamless handoff to appropriate gsd command
660:       </success_criteria>

(End of file - total 660 lines)
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
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/next.md</path>
<type>file</type>
<content>
1: <purpose>
2: Detect current project state and automatically advance to the next logical GSD workflow step.
3: Reads project state to determine: discuss → plan → execute → verify → complete progression.
4: </purpose>
5: 
6: <required_reading>
7: Read all files referenced by the invoking prompt's execution_context before starting.
8: </required_reading>
9: 
10: <process>
11: 
12: <step name="detect_state">
13: Read project state to determine current position:
14: 
15: ```bash
16: # Get state snapshot
17: # SDK resolution: prefer local gsd-tools.cjs, fall back to global gsd-sdk (#3668)
18: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
19: if [ -f "$GSD_TOOLS" ]; then
20:   GSD_SDK="node $GSD_TOOLS"
21: elif command -v gsd-sdk >/dev/null 2>&1; then
22:   GSD_SDK="gsd-sdk"
23: else
24:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
25:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
26:   exit 1
27: fi
28: $GSD_SDK query state.json 2>/dev/null || echo "{}"
29: ```
30: 
31: Also read:
32: - `.planning/STATE.md` — current phase, progress, plan counts
33: - `.planning/ROADMAP.md` — milestone structure and phase list
34: 
35: Extract:
36: - `current_phase` — which phase is active
37: - `plan_of` / `plans_total` — plan execution progress
38: - `progress` — overall percentage
39: - `status` — active, paused, etc.
40: 
41: If no `.planning/` directory exists:
42: ```
43: No GSD project detected. Run `/gsd-new-project` to get started.
44: ```
45: Exit.
46: </step>
47: 
48: <step name="safety_gates">
49: Run hard-stop checks before routing. Exit on first hit unless `--force` was passed.
50: 
51: If `--force` flag was passed, skip all gates and the consecutive guard.
52: Print a one-line warning: `⚠ --force: skipping safety gates`
53: Then proceed directly to `determine_next_action`.
54: 
55: **Gate 1: Unresolved checkpoint**
56: Check if `.planning/.continue-here.md` exists:
57: ```bash
58: [ -f .planning/.continue-here.md ]
59: ```
60: If found:
61: ```
62: ⛔ Hard stop: Unresolved checkpoint
63: 
64: `.planning/.continue-here.md` exists — a previous session left
65: unfinished work that needs manual review before advancing.
66: 
67: Read the file, resolve the issue, then delete it to continue.
68: Use `--force` to bypass this check.
69: ```
70: Exit (do not route).
71: 
72: **Gate 2: Error state**
73: Check if STATE.md contains `status: error` or `status: failed`:
74: If found:
75: ```
76: ⛔ Hard stop: Project in error state
77: 
78: STATE.md shows status: {status}. Resolve the error before advancing.
79: Run `/gsd-health` to diagnose, or manually fix STATE.md.
80: Use `--force` to bypass this check.
81: ```
82: Exit.
83: 
84: **Gate 3: Unchecked verification**
85: Check if the current phase has a VERIFICATION.md with any `FAIL` items that don't have overrides:
86: If found:
87: ```
88: ⛔ Hard stop: Unchecked verification failures
89: 
90: VERIFICATION.md for phase {N} has {count} unresolved FAIL items.
91: Address the failures or add overrides before advancing to the next phase.
92: Use `--force` to bypass this check.
93: ```
94: Exit.
95: 
96: **Prior-phase completeness scan:**
97: After passing all three hard-stop gates, scan all phases that precede the current phase in ROADMAP.md order for incomplete work. For each prior phase number `N`, use `gsd-sdk query find-phase <N>` JSON (plans, summaries, incomplete_plans, etc.) to inspect that phase.
98: 
99: Detect three categories of incomplete work:
100: 1. **Plans without summaries** — a PLAN.md exists in a prior phase directory but no matching SUMMARY.md exists (execution started but not completed).
101: 2. **Verification failures not overridden** — a prior phase has a VERIFICATION.md with `FAIL` items that have no override annotation.
102: 3. **CONTEXT.md without plans** — a prior phase directory has a CONTEXT.md but no PLAN.md files (discussion happened, planning never ran).
103: 
104: If no incomplete prior work is found, continue to `determine_next_action` silently with no interruption.
105: 
106: If incomplete prior work is found, show a structured completeness report:
107: ```
108: ⚠ Prior phase has incomplete work
109: 
110: Phase {N} — "{name}" has unresolved items:
111:   • Plan {N}-{M} ({slug}): executed but no SUMMARY.md
112:   [... additional items ...]
113: 
114: Advancing before resolving these may cause:
115:   • Verification gaps — future phase verification won't have visibility into what prior phases shipped
116:   • Context loss — plans that ran without summaries leave no record for future agents
117: 
118: Options:
119:   [C] Continue and defer these items to backlog
120:   [S] Stop and resolve manually (recommended)
121:   [F] Force advance without recording deferral
122: 
123: Choice [S]:
124: ```
125: 
126: **If the user chooses "Stop" (S or Enter/default):** Exit without routing.
127: 
128: **If the user chooses "Continue and defer" (C):**
129: 1. For each incomplete item, create a backlog entry in `ROADMAP.md` under `## Backlog` using the existing `999.x` numbering scheme:
130: ```markdown
131: ### Phase 999.{N}: Follow-up — Phase {src} incomplete plans (BACKLOG)
132: 
133: **Goal:** Resolve plans that ran without producing summaries during Phase {src} execution
134: **Source phase:** {src}
135: **Deferred at:** {date} during /gsd-progress --next advancement to Phase {dest}
136: **Plans:**
137: - [ ] {N}-{M}: {slug} (ran, no SUMMARY.md)
138: ```
139: 2. Commit the deferral record:
140: ```bash
141: $GSD_SDK query commit "docs: defer incomplete Phase {src} items to backlog"
142: ```
143: 3. Continue routing to `determine_next_action` immediately — no second prompt.
144: 
145: **If the user chooses "Force" (F):** Continue to `determine_next_action` without recording deferral.
146: </step>
147: 
148: <step name="spike_sketch_notice">
149: Check for pending spike/sketch work and surface a notice (does not change routing):
150: 
151: ```bash
152: # Check for pending spikes (verdict: PENDING in any README)
153: PENDING_SPIKES=$(grep -rl 'verdict: PENDING' .planning/spikes/*/README.md 2>/dev/null | wc -l | tr -d ' ')
154: 
155: # Check for pending sketches (winner: null in any README)
156: PENDING_SKETCHES=$(grep -rl 'winner: null' .planning/sketches/*/README.md 2>/dev/null | wc -l | tr -d ' ')
157: ```
158: 
159: If either count is > 0, display before routing:
160: ```
161: ⚠ Pending exploratory work:
162:   {PENDING_SPIKES} spike(s) with unresolved verdicts in .planning/spikes/
163:   {PENDING_SKETCHES} sketch(es) without a winning variant in .planning/sketches/
164: 
165:   Resume with `/gsd-spike` or `/gsd-sketch`, or continue with phase work below.
166: ```
167: 
168: Only show lines for non-zero counts. If both are 0, skip this notice entirely.
169: </step>
170: 
171: <step name="determine_next_action">
172: Apply routing rules based on state:
173: 
174: **Route 1: No phases exist yet → discuss**
175: If ROADMAP has phases but no phase directories exist on disk:
176: → Next action: `/gsd-discuss-phase <first-phase>`
177: 
178: **Route 2: Phase exists but has no CONTEXT.md or RESEARCH.md → discuss**
179: If the current phase directory exists but has neither CONTEXT.md nor RESEARCH.md:
180: → Next action: `/gsd-discuss-phase <current-phase>`
181: 
182: **Route 3: Phase has context but no plans → plan**
183: If the current phase has CONTEXT.md (or RESEARCH.md) but no PLAN.md files:
184: → Next action: `/gsd-plan-phase <current-phase>`
185: 
186: **Route 4: Phase has plans but incomplete summaries → execute**
187: If plans exist but not all have matching summaries:
188: → Next action: `/gsd-execute-phase <current-phase>`
189: 
190: **Route 5: All plans have summaries → verify and complete**
191: If all plans in the current phase have summaries:
192: → Next action: `/gsd-verify-work`
193: 
194: **Route 6: Phase complete, next phase exists → advance**
195: If the current phase is complete and the next phase exists in ROADMAP:
196: → Next action: `/gsd-discuss-phase <next-phase>`
197: 
198: **Route 7: All phases complete → complete milestone**
199: If all phases are complete:
200: → Next action: `/gsd-complete-milestone`
201: 
202: **Route 8: Paused → resume**
203: If STATE.md shows paused_at:
204: → Next action: `/gsd-resume-work`
205: </step>
206: 
207: <step name="show_and_execute">
208: Display the determination:
209: 
210: ```
211: ## GSD Next
212: 
213: **Current:** Phase [N] — [name] | [progress]%
214: **Status:** [status description]
215: 
216: ▶ **Next step:** `/gsd-[command] [args]`
217:   [One-line explanation of why this is the next step]
218: ```
219: 
220: Then immediately invoke the determined command via skill.
221: Do not ask for confirmation — the whole point of `/gsd-progress --next` is zero-friction advancement.
222: 
223: **If `--auto` was passed:** after the determined command completes, automatically re-invoke `/gsd-progress --next --auto` to continue chaining to the next step. Repeat until one of:
224: - A milestone completes (`/gsd-complete-milestone` is reached)
225: - A blocking decision is required (safety gate triggers, prior-phase completeness prompt, user input needed)
226: - An error or paused state is detected
227: 
228: When stopping due to a blocker, display:
229: ```
230: ⛔ Auto-chain stopped: [reason — e.g. safety gate, blocking decision required]
231: 
232: Resume with: `/gsd-progress --next --auto` once resolved.
233: ```
234: </step>
235: 
236: </process>
237: 
238: <success_criteria>
239: - [ ] Project state correctly detected
240: - [ ] Next action correctly determined from routing rules
241: - [ ] Command invoked immediately without user confirmation
242: - [ ] Clear status shown before invoking
243: </success_criteria>

(End of file - total 243 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/do.md</path>
<type>file</type>
<content>
1: <purpose>
2: Analyze freeform text from the user and route to the most appropriate GSD command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="validate">
12: **Check for input.**
13: 
14: 
15: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
16: If `$ARGUMENTS` is empty, ask via question:
17: 
18: ```
19: What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSD command.
20: ```
21: 
22: Wait for response before continuing.
23: </step>
24: 
25: <step name="check_project">
26: **Check if project exists.**
27: 
28: ```bash
29: # SDK resolution: prefer local node shim, fall back to global gsd-sdk (#3668)
30: _GSD_SHIM_NAME="gsd-tools.cjs"
31: GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/${_GSD_SHIM_NAME}"
32: if [ -f "$GSD_TOOLS" ]; then
33:   GSD_SDK="node $GSD_TOOLS"
34: elif command -v gsd-sdk >/dev/null 2>&1; then
35:   GSD_SDK="gsd-sdk"
36: else
37:   echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
38:   echo "Run: npx get-shit-done-cc@latest --claude --local" >&2
39:   exit 1
40: fi
41: INIT=$($GSD_SDK query state.load 2>/dev/null)
42: ```
43: 
44: Track whether `.planning/` exists — some routes require it, others don't.
45: </step>
46: 
47: <step name="route">
48: **Match intent to command.**
49: 
50: Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:
51: 
52: | If the text describes... | Route to | Why |
53: |--------------------------|----------|-----|
54: | Starting a new project, "set up", "initialize" | `/gsd-new-project` | Needs full project initialization |
55: | Mapping or analyzing an existing codebase | `/gsd-map-codebase` | Codebase discovery |
56: | A bug, error, crash, failure, or something broken | `/gsd-debug` | Needs systematic investigation |
57: | Spiking, "test if", "will this work", "experiment", "prove this out", validate feasibility | `/gsd-spike` | Throwaway experiment to validate feasibility |
58: | Sketching, "mockup", "what would this look like", "prototype the UI", "design this", explore visual direction | `/gsd-sketch` | Throwaway HTML mockups to explore design |
59: | Wrapping up spikes, "package the spikes", "consolidate spike findings" | `/gsd-spike --wrap-up` | Package spike findings into reusable skill |
60: | Wrapping up sketches, "package the designs", "consolidate sketch findings" | `/gsd-sketch --wrap-up` | Package sketch findings into reusable skill |
61: | Exploring, researching, comparing, or "how does X work" | `/gsd-explore` | Socratic ideation and idea routing |
62: | Discussing vision, "how should X look", brainstorming | `/gsd-discuss-phase` | Needs context gathering |
63: | A complex task: refactoring, migration, multi-file architecture, system redesign | `/gsd-phase` | Needs a full phase with plan/build cycle |
64: | Planning a specific phase or "plan phase N" | `/gsd-plan-phase` | Direct planning request |
65: | Executing a phase or "build phase N", "run phase N" | `/gsd-execute-phase` | Direct execution request |
66: | Running all remaining phases automatically | `/gsd-autonomous` | Full autonomous execution |
67: | A review or quality concern about existing work | `/gsd-verify-work` | Needs verification |
68: | Checking progress, status, "where am I" | `/gsd-progress` | Status check |
69: | Resuming work, "pick up where I left off" | `/gsd-resume-work` | Session restoration |
70: | A note, idea, or "remember to..." | `/gsd-capture` | Capture for later |
71: | Adding tests, "write tests", "test coverage" | `/gsd-add-tests` | Test generation |
72: | Completing a milestone, shipping, releasing | `/gsd-complete-milestone` | Milestone lifecycle |
73: | A specific, actionable, small task (add feature, fix typo, update config) | `/gsd-quick` | Self-contained, single executor |
74: 
75: **Requires `.planning/` directory:** All routes except `/gsd-new-project`, `/gsd-map-codebase`, `/gsd-spike`, `/gsd-sketch`, and `/gsd-help`. If the project doesn't exist and the route requires it, suggest `/gsd-new-project` first.
76: 
77: **Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via question with the top 2-3 options. For example:
78: 
79: ```
80: "Refactor the authentication system" could be:
81: 1. /gsd-phase — Full planning cycle (recommended for multi-file refactors)
82: 2. /gsd-quick — Quick execution (if scope is small and clear)
83: 
84: Which approach fits better?
85: ```
86: </step>
87: 
88: <step name="display">
89: **Show the routing decision.**
90: 
91: ```
92: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
93:  GSD ► ROUTING
94: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
95: 
96: **Input:** {first 80 chars of $ARGUMENTS}
97: **Routing to:** {chosen command}
98: **Reason:** {one-line explanation}
99: ```
100: </step>
101: 
102: <step name="dispatch">
103: **Invoke the chosen command.**
104: 
105: Run the selected `/gsd-*` command, passing `$ARGUMENTS` as args.
106: 
107: If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via question.
108: 
109: After invoking the command, stop. The dispatched command handles everything from here.
110: </step>
111: 
112: </process>
113: 
114: <success_criteria>
115: - [ ] Input validated (not empty)
116: - [ ] Intent matched to exactly one GSD command
117: - [ ] Ambiguity resolved via user question (if needed)
118: - [ ] Project existence checked for routes that require it
119: - [ ] Routing decision displayed before dispatch
120: - [ ] Command invoked with appropriate arguments
121: - [ ] No work done directly — dispatcher only
122: </success_criteria>

(End of file - total 122 lines)
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

## ASSISTANT (turn 3)

Tools: edit

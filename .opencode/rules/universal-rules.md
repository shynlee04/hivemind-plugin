
## Project Overview

## THE ABSOLUTE ORDER - AFTER EACH AND EVERY FRONT-FACING USER'S PROMPTING (NO MATTER WHAT) FRONT-FACING AGENT NEVER DO SPECIALISTS' WORK

- THESE ARE THE FRONT-FACING LIST OF NOT ALLOW TO DO TASK: Do not audit, do not review, do not judge, do not advice, do not make any assumptions, do not plan, do not implement, do not create, do not modify, do not correct, do not debug, do not research -> SPEACLIST Delegation do them

- THESE ARE THE FRONT-FACING LIST OF ALLOWED TO DO TASK: Delegate, Coordinate, Route, Validate, Check

- The delegate-task tool is on mantainance; use task tool instead for delegation. Ignore this if the human user explicitly ask for delegate-task as for testing UAT purposes

## NOTICE BOARD

- For UAT and live-test purposes always prioritize THE USER's prompting hence any constitutions below this can be ignore if contracdicted to the USER's prompting/requests; especially when the user states things like "for testing only", "for uat only" etc

- When execute-slash-command append the slash command directly to the foreground without the parameter of `@agent` the agents are instructed and resolved and if needed will be used through task tool for sequential actions following.

- DO NOT ROUTE any hm-* or hf-* commands, workflows nor agents - they are the subjects of developments - **ROUTE everything to gsd-* from commands, agents to workflows** , they are the toolings used for development of this harness project 

- delegation to agents attention: do not use generic agents - use gsd-* agents only

- Atomic commits are mandatory. You must follow the atomic commit rule: **One logical change = One commit**. Do not bundle multiple unrelated changes into a single commit. If a change is large, break it down into smaller, atomic commits with meaningful messages. Every commit must pass validation (typecheck, tests, gatekeeping) and be atomic, preventing any partial build or test failure states. Commit even the documents changes

## NON-NEGOTIABLE RULES

- PRACTICE EXTREMELY STRICT TEST-DRIVEN DEVELOPMENTS, SPEC-DRIVEN, REQRUIREMENTS AND SPEC COMPLIANCES GATE KEEPING WITH STRICT INTEGRATION LOOPS AND VALIDATION. **NO EXCEPTION** 

- WHEN REQUEST IS CONFUSING AND LARGE -> never try to audit everything at once master planning - loop on phases with traversal and progressive batch of research - investigate - planning - implementing - verification then moving to the next batch -> reapt the integrated cycles with regression validation and integration loops of gatekeeping - never try to handle everything at once

- DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION. DO NOT USE ANY CUSTOM TOOLS YET. DO NOT USE INTERACTIVE BASH OR PTY COMMANDS!

- Handoff and artifacts between sessions, from research, audit, planning, review, verification, must all commit, written-to-local-disk and referenced as master jump links

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


## SKILLS TO WORKFLOW ROUTER
**Important guidelines**

- To load best set of skills agents must know if you are front-facing or being delegated as subagents; knowing your hierarchy of tasks (looking at the meta data marked as `#USER` to confirm it is from the human user, meaning you are front-facing agent, otherwise subagents) 

- consider loading new skill(s) (not always but once **intents** of human users and/or **workflows**, **tasks** shifted this order is a **must**)

- **subagents** (know your agent **domain** by looking at description; analyze **task** to fetch `specilist` skills) fetch skills belong  `how-to-implement` and/or `specialist` classifications.

- **orchestrator/coordinator agents** : loading `how-to-delegate`, `how-to-process/loop/iterative`, `guardrails, gatekeeping, context,`  skills classifications. For complex tasks this group may need to load `outer-cycle-how-to-implement` skills  

- **respecting framework `oneness`** : it is if you are using `gsd` skill sets - pick them first - then pick another only when `gsd` skill sets lack the `domain-specific` or `task-specialist` that you find the superior ones. 

### **going from greater cycles to the inner cycles** for skills to coordinate and orchestrate

- **brainstorming, user-intent discussion** always make sure to understand, think twice load set helping to get clear user-intent through QA and discussion to prevent regressions or conflicts

- **research, investigate, synthesis** do not skip research load `hm-deep-research` - `hm-detectice` (if need to learn about the sector of codebase) and

- **write new code:** load `clean-code` skill

- **debugging:** load `gsd` debug skills and `systematic-debug` skill

- **planning and implementing** must load set of spec-driven and authentic tdd skills

- **iterative loop** coordinating skills and gatekeeping at correct set loop til completione

- **quality gatekeeping** must go through cycles of code-review, validation, verification, then integration gatekeeping. making sure to trace of regression

## IMPORTANT UPDATE TO ALL AGENTS

- when lost -> access real-time eventracker at `/.hivemind/session-tracker/*` - list/glob first - then look for the correct session id -use hm-detective skill to investigate the sessions

- **important tracking path for delegation:**
.hivemind/state/session-continuity.json
.hivemind/state/delegations.json 

- If the agents recieve GSD command, all they must is to act following it. THE COMMAND SUPERSEDE ALL ASSUMPTIONS AND LOADING SKILLS OTHER, BECAUSE THE COMMAND OF GSD IS THE SKILL

- ALL AGENTS MUST ANNOUNCE THIS EVERY TURN DEPENDING ON MAIN-HUMAN-FACING ORCHESTRATOR OR SUBAGENT BEING DELEGATED

- IF you are a front-facing -> you will mostly delegate **Everytime Delegation** in the prompt YOU MUST LET the subagent know that IT IS THE SUBAGENT BY ANNOUNCING: *You are the subagent Name:XXX role...., you must do as this prompt instructed and knowing that you are being delegated

- As subagent you must anounce your roles so the skills must also match. Say: I am **subagent, I CAN ONLY delegate further if the cycles and my tasks allow, and I must fulfill my work. If need verification, I will return the verification needed in the report handoff


<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## SPECIFIC SYSTEM LINEAGE, ROUTING, AND GOVERNANCE RULES

### 1. Framework Lineages & Layer Classifications
* **Lineage Boundaries**:
  * **hm-* lineage (Harness Modules)**: The core subject of development. Controls the composition engine runtime (plugin, tools, hooks, task-management, coordination, config, routing). Only loads `hm-*` skills, `gate-*` quality triad skills, and `stack-*` reference skills. Never loads `hf-*` or `gsd-*` skills.
  * **hf-* lineage (Harness Builder/Authoring)**: Meta-concept authoring tools (agent definitions, skills, commands, rules, permissions). Can modify primitives under `.opencode/` when authorized.
  * **gsd-* lineage (Get-Shit-Done developer tooling)**: Shipped-with development utilities used to build the harness project itself. 
* **Layer Hierarchy (L0 -> L3)**:
  * **L0 Orchestrators** (e.g. `hm-l0-orchestrator`, `hf-l0-orchestrator`):
    * *Role*: Front-facing user interaction, intent classification, landscape mapping, path routing, and quality gate enforcement.
    * *Temperature Discipline*: Hard-constrained to **0.2–0.3** for routing stability.
    * *Code Modification Authority*: ZERO write authority in `src/`, `tests/`, or `.opencode/`.
  * **L1 Coordinators** (e.g. `hm-coordinator`/`hm-l1-coordinator`, `hf-l1-coordinator`):
    * *Role*: Wave-based planning and coordination. Decomposes tasks into wave groups (Research, Planning, Execution, Quality, etc.), tracks sub-delegations, and enforces wave dependencies.
    * *Temperature Discipline*: Hard-constrained to **0.3–0.4** to allow structured decomposition flexibility.
  * **L2/L3 Specialists & Primitives** (e.g. `hm-planner`, `hm-executor`, `hm-verifier`, `hf-l2-*` builders, `gate-l3-*` gates, `stack-l3-*` references):
    * *Role*: Context-informed task execution. Directly reads codebase files, writes artifacts to `.hivemind/planning/`, runs test/build commands, and evaluates quality gates.
    * *Temperature Discipline*: Hard-constrained to **0.0–0.1** to ensure deterministic code modification and verification.

### 2. Framework Oneness Constraints
* **Definitions**:
  * **gsd-session**: A session started by a `gsd-*` command (located under `.opencode/commands/gsd-*` or `.opencode/command/gsd-*`).
  * **harness-session**: A session started by an `hm-*` or `hf-*` command.
* **Oneness Enforcement**:
  * If a session is classified as a **gsd-session**, the orchestrator, coordinator, and all spawned subagents MUST strictly use `gsd-*` commands, workflows, and agents. Mixing `gsd` tooling with `hm-*` execution modules (e.g. calling `hm-planner` from a `gsd-session`) is strictly forbidden.
  * If a session is classified as a **harness-session**, the orchestrator/coordinator and subagents MUST use `hm-*`/`hf-*` commands, workflows, and agents.
  * Lineage-crossing transitions are allowed only when explicitly bridged by a designated sync command (e.g. `sync-assets.js` or `sync-agents-md.md`).

### 3. The Three-Path Routing Engine
The L0 agent classifies user intent and routes it through one of three specific execution paths:
* **Fast-Path (Direct L0 -> L2/L3)**:
  * *Entry Criteria*: (1) A discrete, single-specialist task. (2) Known command routing. (3) Recovery or simple status check lookup. (4) Direct user request for a specific specialist.
  * *Targets*: Mapped directly to L2/L3 specialists (e.g. `hm-l2-researcher`, `hm-l2-scout`, `hm-l3-detective`).
* **Coordinated-Path (L0 -> L1 -> L2/L3)**:
  * *Entry Criteria*: (1) Multi-specialist task (2+ agents). (2) Sequential task waves with output-input dependencies. (3) Unknown scope requiring planning. (4) Remediation loops after gate failures.
  * *Targets*: Mapped to `hm-l1-coordinator` or `hf-l1-coordinator` initialized with specific wave types.
* **Cross-Lineage Path (hm-* -> hf-*)**:
  * *Entry Criteria*: (1) Request for meta-concept creation/editing (agents, commands, skills, rules, permissions).
  * *Handoff Protocol*: L0 announces the transition, stops execution in `hm-*`, and dispatches the task to `hf-l0-orchestrator` passing structured handoff context (user intent, identified metadata, prior investigation results).

### 4. Session Continuity: Stacking vs. Resuming
* **Discovery Step**: Before any new delegation, L0/L1 agents must call `delegation-status({ action: "find-stackable" })` or query `.hivemind/state/delegations.json` and `.hivemind/state/session-continuity.json` to find related sessions.
* **Resuming Protocol (Incomplete/Aborted Sessions)**:
  * If an interrupted, aborted, or failed session exists for the same agent/task, the agent MUST resume it.
  * *Syntax*: Pass the exact `task_id` using the native `task` tool: `task({ subagent_type: "agent-name", task_id: "<aborted-session-id>", prompt: "Continue" })`.
  * *Constraint*: DO NOT repeat the prompt context; context is automatically recovered by the harness from the session journal.
* **Stacking Protocol (Completed Sessions/Adding Work)**:
  * If a session is completed but the task requires additional child work or retries, the agent MUST stack the new delegation on top of it.
  * *Syntax*: 
    * `task` tool: Set `task_id` to the existing parent session ID.
    * `delegate-task` tool: Pass `stackOnSessionId: "<session-id>"` or `context: '{"parentSessionId": "<session-id>"}'`.
    * `execute-slash-command`: Pass `stackOnSessionId: "<session-id>"`.
* **Dual-Signal Completion**:
  * Completion status (`completed` in `STATE.md`) requires agreement from two distinct actors:
    1. **Doer Specialist** (e.g. `hm-executor` or `gsd-executor`) claims "done".
    2. **Verifier Specialist** (e.g. `hm-verifier` or `gsd-verifier`) runs automated validations and inspects filesystem evidence.
  * Both must return a `PASS` verdict. A checklist return without verifiable disk-written artifacts triggers an automatic `FAIL`.

### 5. Tool Governance & Execution Prohibitions
* **L0 Zero-Write Authority**:
  * L0 orchestrators are strategists, not executors. They have ZERO codebase write permissions.
  * L0 agents are strictly forbidden from calling `write_to_file`, `replace_file_content`, `multi_replace_file_content`, or running file-modifying shell commands on `src/` or `tests/`.
  * L0 write authority is restricted to `.hivemind/planning/**` (for creating `landscape.md` and related session tracking logs).
  * Harness hook guards automatically block unauthorized codebase writes by throwing `[Harness]` errors at the pre-tool-use lifecycle phase.
* **Allowed Paths per Layer**:
  * **L0**: Read: `.planning/`, `.hivemind/`, `.opencode/`. Write: `.hivemind/planning/`.
  * **L1**: Read: `.planning/`, `.hivemind/`, `.opencode/`. Write: `.hivemind/planning/`.
  * **L2/L3**: Read: All project paths. Write: `src/`, `tests/`, `.hivemind/planning/`, `.opencode/` (builders only).

### 6. Workflow Step Chaining & Granularity
Workflows must execute as a deterministic sequence of granular phases to prevent context loss. A standard workflow (e.g., phase discussion) chains through the following steps:
1. **check_blocking_antipatterns**: Inspects `.continue-here.md` in the active phase directory. If a blocking anti-pattern exists, halts execution until 3-point remediation answers are documented.
2. **check_spec**: Inspects and reads `*-SPEC.md` to lock functional requirements.
3. **check_existing**: Checks for existing `*-CONTEXT.md` or `*-DISCUSS-CHECKPOINT.json` to resume interrupted discussion.
4. **scout_codebase**: Reads codebase maps (e.g., `src/` hierarchy) based on the active phase type.
5. **present_gray_areas**: Generates and presents highly specific implementation options (reusing existing components, loading behavior, etc.) to the user.
6. **discuss_areas**: Loop through chosen areas, writing incremental checkpoints to disk after each step is completed.
7. **write_context**: Generates the final, canonical `*-CONTEXT.md` (for downstream agent consumption) and `*-DISCUSSION-LOG.md` (for auditing).
8. **git_commit**: Deletes the checkpoint and commits files with the message pattern `docs(phase): capture phase context`.
9. **update_state**: Records the session status in `.planning/STATE.md` and commits the changes.
10. **auto_advance**: If `--auto` or `--chain` flags are present, forwards state directly to the planning phase.

### 7. Command-to-Workflow Dispatch Matrix
OpenCode commands must map to specific wave types managed by the coordinator lineage:
* **`/plan`**: Multi-round planning workflow (Research -> Design -> Verification). Routes to `hm-coordinator` (planning wave).
* **`/start-work`**: Starts implementation waves from the current `STATE.md` offset. Routes to `hm-coordinator` (execution wave).
* **`/ultrawork`**: Triggers full end-to-end lifecycle waves (Plan -> Build -> Test -> Verify). Routes to `hm-coordinator` (full lifecycle wave).
* **`/deep-init`**: Bootstraps the project context and requirements. Routes to `hm-coordinator` (init wave).
* **`/harness-doctor`**: Health diagnostics and setup repairs. Routes to `hm-coordinator` (audit wave).
* **`/harness-audit`**: Automated phase and primitive checks. Routes to `hm-coordinator` (audit wave).
* **`/deep-research-synthesis-repomix`**: Codebase research and repomix package scanning. Routes to `hm-coordinator` (research wave).

### 8. Turn Anchor Points & Intent Preservation
* **Intent Anchoring**:
  * The L0 orchestrator must audit the user's turn-by-turn intent. If the user places an anchor point (e.g., "generate the plan and stop", "only run tests"), the orchestrator must enforce this boundary. It must write the required plan/research artifact and exit immediately. It must NOT auto-advance to downstream execution.
* **Directory Structure Enforcement**:
  * Every created file/document must reside in a registered subdirectory matching `.planning/codebase/STRUCTURE.md`. All newly created folders must contain a `.gitkeep` file to be registered in git.

## Instruction Priority

This override default system prompt behavior, but **user instructions always take precedence**:

# Git Commit Governance

## Rules

- Commit message format: `phase: what changed — why it matters`
- Commit after each meaningful change (subagent returns, phase completes, gate passes)
- Never accumulate changes across multiple phases without committing
- If it's not in git, it doesn't exist

## Agent Commit Boundaries

Agents may only manage commits for their **own work**. They do NOT:
- Constrain or override commits from other development activity
- Block commits initiated by the user or other agents outside their scope
- Reorder or amend commits they did not create

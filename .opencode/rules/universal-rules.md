
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

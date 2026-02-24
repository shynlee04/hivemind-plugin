# GSD Structure → top with BMAD for improvement

### OpenCode Git Repo https://github.com/anomalyco/opencode

to lessen the confusions when having to both acts as a framework and wrapping others with intricate path finding, document formats and packages updates etc → I decide to invent us own an amplified spec-driven framework → the framework is inspired, enhanced, modified, combined by the `GSD` and `BMAD` → Please use repomix mcp to download these as full pack for investigating + ingesting + selectively synthesize (without having to every time access them online) - **I PROHIBIT EXACT COPY/PLAGIARIZE THESE WORKS - I NEED YOU TO SERIOUSLY MAKE THE KNOWLEDGE INGESTED AND SYNTHESIZED TO FIT OUR PHILOSOPHY**

1. GSD: https://github.com/gsd-build/get-shit-done/
2. BMAD - DOWNLOAD ALL THESE MODULES
    1. BMad Method (BMM)	Core framework with 34+ workflows - https://github.com/bmad-code-org/BMAD-METHOD
    2. BMad Builder (BMB)	Create custom BMad agents and workflows (to build custom agents, workflows, commands etc) - https://github.com/bmad-code-org/bmad-builder
    3. Game Dev Studio (BMGD)	Game development workflows (Unity, Unreal, Godot) (POST MVP) - https://github.com/bmad-code-org/bmad-module-game-dev-studio
    4. Creative Intelligence Suite (CIS)	Innovation, brainstorming, design thinking (SOME Brainstorming, and Problem solving modules can be very helpful) - https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite

# .HIVEMIND FRAMEWORK → is expected to better than the 2 original by the following

while inherit the beauty of both `spec-driven` + `test-drive` + `agile&sprint development` and the robust `guardrails`, `research`, `granular and systematic workflows  -`  the “.Hivemind” being powered by its own `automation of hooks and scripts` ; `context engines` ; `robust of tools, libraries, and other concepts` - to facilitate the philosophies of developments that master 

- “hierarchical relationships” → non-gaps, safe, higher-rate of success by making connections cross-domains, creating contextually relevant and valid on-demand context → making commands and agents more intelligent and less hallucination
- “relevant, on-demand, up-to-date, integrally coherent and purified context” - make possible by context-first-engines (a complex of tools, libraries, hooks, concepts of skills, scripts, and commands) → development process is more granularly controlled + showing connections and relationships, classifications and schema → gaps and drifts are more easily controlled
- “auto governance of iterative smart loops of absolutes - making both horizontal and vertical, multi-perspective validation, gatekeeping  until requirements, acceptance criteria, success-metrics; functional and nonfunctional requirements; edge cases; user-journeys etc are harnessed and make sure to fully-scopes while setting constraints on realistic real-life set up of stacks and infrastrucstrure.

### Must-have hooks and automation of sticky-system-instruction +  appended-context-hierarchy-and-tasks-mapping for every last `assistant's last message` + `prompt-transformation` for: main session starter; user’s in-session continual prompting - Specifically (a turn = after a chain of agentic executions and the agent outputs the last message) - use deepwiki mcp to ask questions related to [`https://github.com/anomalyco/opencode`](https://github.com/anomalyco/opencode) and its SDK

1. **Sticky-system-instruction**: this must exist persistently, at entry, in between, every time the prompt is sent to LLM provider → make this as a set of non-negotiable constitutions (every project, beyond AGENTS.md, what essentially must execute and prepared at every turns for these essential:
    1. Check list of “Must-have” entities → if either of these missing → chains of commands, skills, hooks, workflows and tasks must be initiated to sequentially fulfilled before anything else can start - the exception is for `hivefiver's modules creator`
        1. `.hivemind` folder and its sub-folders, json manifestation; configurations, and profile must be set → run hivemind-init command + hivemind-profile + hivemind-settings
        2. if brownfield → `.hivemind/codewiki` must spawn with sub folders and comprehensive deep-dive scanned of the up-to-date codebase + filewatching enabled using `code-intel` module
        3. either brown-field, or greenfield these set of SOT for the project master set of planning documents and artifacts must exist before anything else →  this suits under `.hivemind/planning/`
            1. The main ones
            
            ```markdown
            project + prd with comprehensive requirements + architecture and adr  with data model, contract, schema, data flow and pipelines, boundaries, states and persistence etc  (depends on language, project, framework of developments and complexity of the project these are part of the architecture and adr)+  tech-specification  + design and structure + pitfalls vs patterns and anti-patterns of stacks (SDK and research with all valid cross-dependencies research and stacks’ synthesis to totally cover all requirements, acceptance criteria of functional and non-functional, addressing all edge cases; harnessing with non-shallow users’ journeys) + ux-specification (optional) + roadmap + milestones + phases and context + planned structure
            ```
            
            1. The research as sub-folders → organized and stack-based tech research
            2. repomix xml download of used SDK, Stacks from Github’s repo → support for offline research and validation
        4. .hivemind and its content - must be enabled with `atomic git commits`   - design different `atomic git commits` for different types also (about 5-6 of them, documents; artifacts, workflows, planning stage, implementations; context etc) - all i, ii and iii sections and whichever belong to SOT must also be → ID + Strict NAMING CONVENTION Without date and time stamps (because these are iteratively updated and DO NOT consist versions)
    2. When all a’s items are checked → the system-instruction-prompt “remind” agent as LLM the following:
        1. Context-first + governance of tasks → from users’ prompt + improve and transform to match with historical context → extract tasks → classify + allocate tasks (since tasks are managed and, schematic and set with controlled ID) → if they are classified to belong to the `project` then
            1. allocate the tasks and sub-tasks list + the matched planning artifacts (can be either or both milestone-plan or sequential phase-plannings) → spawn the TODO task list
            2. gather context + purified + validate for context integrity 
        2. Knowing the agent’s roles (By forcing it ingest its profile) - Select sets   of SKILLS + planning out commands, scripts, tools and workflows 
        3. Framing the outlines of tasks + how-to + breakdown for granular control + set-up in-between investigation and research (if needed) + implementation (if any) + validation/gate-keeping tasks (and TDD if needed) - set matched requirements, acceptance criteria, success metric, scopes vs out-scopes → comprehensively and expert-oriented rationale + confirmation in forms of expert recommendations to users for the first turn last’s message output → never execute on first turn
        4. reminding of the front-facing agent (the `hiveminder` of its duties and roles of mainly delegation - not execution)
    3. that are for starting of the main sessions → for the following turns - more of the roles, workflows, context integrity, governance; tasks controlled; updating SOT plannings etc
2. With the similar approach → the `last assistant's message` output is when the `hiveminder` complete its chains of actions → apart from its original output, there should be and appended section for mapping the relational tasks and planning, files registry, related artifacts, anchors of events, wrapping of so-far progress, indicate the next sensible follow-up
3. Similarly next to the  `last assistant's message` output is the user’s next prompting → as LLM tends to execute-oriented; there should be a hook to transform the user’s prompting to coherently connect to hierarchy + relational context + governance reminders —>> so that the flow of integrity + self-governance is guaranteed

### Aside from the above improvements the following are also what worth noticing

### Agents

- you can make a couple more of agents (it is prohibited to set model-specific; be very skeptical when setting permissions and the configurations of the yaml header, and there are few notices/short-comings that I point out below which you should consider when designing `agents` - If new agents (currently we have `hiveminder-the front-facing, strategist and tactist, coordinator, governance, monitor, the main agent to start almost every sessions of workflows`   ;  `hivefiver-the .Hivemind framework meta builder; specialist in builder tailored modules of SKILLS, Commands, Workflows; Agents per users' requrest through guiding mode - also context doctor and validator of the framework`  ; the rest all need improvements + refactored to match the design framework `code-review (may change and improve this into gate-keeper because it does more than just code-review`)   ; `build` → should be changed into `hivemaker` (improve this make its roles broader, more like the versatile `executor`  ; `scanner` → make this into `hivexplorer` (also broaden its roles and domains to various scanning, investigating tasks; expanded to various researching doamains) ; `debug` → make this into `hivehealer` (to patches, debug, address gaps, fixes, refactor, improve etc) ; and there still has not agent for pure planning let’s create one called `hiveplanner`- also making use the innate agents of OpenCode  https://opencode.ai/docs/agents/  (and they are `build`, `plan`, `explore`, `general` → since these are the innate, they tend to be called up when the custom-agents are not sufficiently designed for the tasks. Read the documents very carefully + load the SKILL for OpenCode agent-architecture; configuration; and primitives - These are also few of my reminders:
    - These package is at the root → sync with asset sync → there are either `project` or `global` selection when users running init → either way please append these as markdown files into the .opencode/agents (
        - Global: **`~/.config/opencode/agents/`**
        - Per-project: **`.opencode/agents/`**

```markdown
/Users/apple/hivemind-plugin/agents
/Users/apple/hivemind-plugin/agents/build.md
/Users/apple/hivemind-plugin/agents/code-review.md
/Users/apple/hivemind-plugin/agents/debug.md
/Users/apple/hivemind-plugin/agents/explore.md
/Users/apple/hivemind-plugin/agents/hivefiver.md
/Users/apple/hivemind-plugin/agents/hiveminder.md
/Users/apple/hivemind-plugin/agents/scanner.md
/Users/apple/hivemind-plugin/package.json
```

- Please be fully-aware that the agent-specific-profile will prioritize the `frontmatter` yaml header of the markdown file when for the agent’s profile initiation - also mean:
    - Make the configuration on this `frontmatter` yaml as robust and granularly controlled as possible - making use of the following settings and configurations for chaining the flows:
        - `mode` → primary = front-facing, can delegate tasks; cannot be delegated  by any other agents ; all (the most selected mode) = can be front-facing, can delegate and be delegated ; subagent = can only be delegated — — — “hidden”: true can also be set to “hide” the agent → so that it can only be delegated by other agents
        - `tools` (look at sections of `innate tools`, `mcp tools`, `agent skills`, `custom tools` - to trace which tools available) - can be granularly, specifically controlled with naming specific tools; https://opencode.ai/docs/agents/#tools ; glob patterns, and wildcard of `*` can also be used - (make skills, custom tools and commands enforcing on frontmatter yaml
        - `tasks` - this https://opencode.ai/docs/agents/#task-permissions - is used to control delegations’ permissions
        - `permissions` - very conservative on extreme cautious when setting anything with `deny` permissions → instead, set `allow` permissions of granularity, specific  - `ask` permissions are rarely used due to its disruptive behaviors to automation
        - `prompts` or `workflows` or `references` or `templates` can be paired in configuration or the agent in frontmatter yaml → to make the chainning and automations more robust
    
    ## Commands → paired with scripts, tools, custom-tools, agents-specific - for capabilities , granular control+ automation , paired with workflows, references, parsed content, prompts + and can definitely amplified with SKILLS
    
    → amplified with specialized in-depth Agents’ Skills (can use find-skill, skill-creator, writting-skill, and use `hivefiver` to improve + refactor + add more for this sector)
    
    → https://opencode.ai/docs/commands/ (consume this as a whole line by line - this is very important) → when setting a command → this can either be automatically initiated with “hooks” and “scripts” and can also “manually initiated” by users by using `/` → for better managements - set them in groups - and since there are various combinations of other concepts, and a `command` is often a `starting entry` - spend your reasoning power into this section as for now they are poorly made and make no integration at all
    
    ```markdown
    /Users/apple/hivemind-plugin/commands
    /Users/apple/hivemind-plugin/commands/hivefiver-architect.md
    /Users/apple/hivemind-plugin/commands/hivefiver-audit.md
    /Users/apple/hivemind-plugin/commands/hivefiver-build.md
    /Users/apple/hivemind-plugin/commands/hivefiver-deploy.md
    /Users/apple/hivemind-plugin/commands/hivefiver-doctor.md
    /Users/apple/hivemind-plugin/commands/hivefiver-gsd-bridge.md
    /Users/apple/hivemind-plugin/commands/hivefiver-init.md
    /Users/apple/hivemind-plugin/commands/hivefiver-intake.md
    /Users/apple/hivemind-plugin/commands/hivefiver-ralph-bridge.md
    /Users/apple/hivemind-plugin/commands/hivefiver-research.md
    /Users/apple/hivemind-plugin/commands/hivefiver-skillforge.md
    /Users/apple/hivemind-plugin/commands/hivefiver-spec.md
    /Users/apple/hivemind-plugin/commands/hivefiver-specforge.md
    /Users/apple/hivemind-plugin/commands/hivefiver-start.md
    /Users/apple/hivemind-plugin/commands/hivefiver-tutor.md
    /Users/apple/hivemind-plugin/commands/hivefiver-validate.md
    /Users/apple/hivemind-plugin/commands/hivefiver-workflow.md
    /Users/apple/hivemind-plugin/commands/hivefiver.md
    /Users/apple/hivemind-plugin/commands/hivemind-clarify.md
    /Users/apple/hivemind-plugin/commands/hivemind-compact.md
    /Users/apple/hivemind-plugin/commands/hivemind-context.md
    /Users/apple/hivemind-plugin/commands/hivemind-dashboard.md
    /Users/apple/hivemind-plugin/commands/hivemind-debug-trigger.md
    /Users/apple/hivemind-plugin/commands/hivemind-debug-verify.md
    /Users/apple/hivemind-plugin/commands/hivemind-delegate.md
    /Users/apple/hivemind-plugin/commands/hivemind-lint.md
    /Users/apple/hivemind-plugin/commands/hivemind-pre-stop.md
    /Users/apple/hivemind-plugin/commands/hivemind-scan.md
    /Users/apple/hivemind-plugin/commands/hivemind-status.md
    /Users/apple/hivemind-plugin/commands/hiveminder-orchestrate.md
    
    ```
    
    - There can be
        - commands/settings/ → including commands like `hm-profile` , `hm-configs`, `hm-reset`
        - commands/code-intel/ → `hm-code-mapping` ; `hm-code-wiki`; etc
        - commands/context/ →
        - and so many more (about 10 groups or so - with each group contains 4-5 commands)
    
    ### Because the commands must be refactored and improved with workflows + references + templates + prompts + scripts → so have a look and plan + propose for these making perfect chaining and aiding commands and other concepts
    
    ```markdown
    /Users/apple/hivemind-plugin/workflows
    /Users/apple/hivemind-plugin/workflows/hivefiver-enterprise-architect.yaml
    /Users/apple/hivemind-plugin/workflows/hivefiver-enterprise.yaml
    /Users/apple/hivemind-plugin/workflows/hivefiver-floppy-engineer.yaml
    /Users/apple/hivemind-plugin/workflows/hivefiver-mcp-fallback.yaml
    /Users/apple/hivemind-plugin/workflows/hivefiver-vibecoder.yaml
    /Users/apple/hivemind-plugin/workflows/hivemind-brownfield-bootstrap.yaml
    /Users/apple/hivemind-plugin/workflows/sequential-delegation-workflow.yaml
    /Users/apple/hivemind-plugin/templates/opencode-profiles.md
    /Users/apple/hivemind-plugin/templates/opencode-config-template.json
    /Users/apple/hivemind-plugin/templates/hivemind-brownfield-session.md
    /Users/apple/hivemind-plugin/templates
    /Users/apple/hivemind-plugin/scripts
    /Users/apple/hivemind-plugin/scripts/check-sdk-boundary.sh
    /Users/apple/hivemind-plugin/scripts/guard-public-branch.sh
    /Users/apple/hivemind-plugin/references
    /Users/apple/hivemind-plugin/references/domain-boundaries.md
    /Users/apple/hivemind-plugin/references/hivemind-brownfield-checklist.md
    /Users/apple/hivemind-plugin/prompts
    ```
    

# The 4 entities/regions of focus

### Commands → the most important entities because when initiating these (by users) , including `$Arguments` + `scripts` + `references`/ `workflows` /  `templates` + `tools (bin script to parse STATE)`   + initiate by an `agent` of domain-specific

- With the starting point as a command → GSD chain a combo of the above mentioned to use as guided and contextual prompts and workflows for chains of domain-specific agentic executions
- list of commands : https://github.com/gsd-build/get-shit-done/tree/main/commands/gsd
- These commands belong to different hierarchy / domains / stages and purposes of each
- if classified of the same stages or phases → these often integrate and serve 5 main orientations (I call orientations because at different phase each, following the purpose and nature of the phase, will be called differently)
    1. discussion - this can be brainstorming, questions, discovery - this is when AI agent support to  
1. Commands + scripts with $Arguments  +

# **Workflow Diagrams**

## **Full Project Lifecycle - Greenfield**

```markdown
  ┌──────────────────────────────────────────────────┐
  │                   NEW PROJECT                    │
  │  /gsd:new-project                                │
  │  Questions -> Research -> Requirements -> Roadmap│
  └─────────────────────────┬────────────────────────┘
                            │
             ┌──────────────▼─────────────┐
             │      FOR EACH PHASE:       │
             │                            │
             │  ┌────────────────────┐    │
             │  │ /gsd:discuss-phase │    │  <- Lock in preferences
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:plan-phase    │    │  <- Research + Plan + Verify
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:execute-phase │    │  <- Parallel execution
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:verify-work   │    │  <- Manual UAT
             │  └──────────┬─────────┘    │
             │             │              │
             │     Next Phase?────────────┘
             │             │ No
             └─────────────┼──────────────┘
                            │
            ┌───────────────▼──────────────┐
            │  /gsd:audit-milestone        │
            │  /gsd:complete-milestone     │
            └───────────────┬──────────────┘
                            │
                   Another milestone?
                       │          │
                      Yes         No -> Done!
                       │
               ┌───────▼──────────────┐
               │  /gsd:new-milestone  │
               └──────────────────────┘
```

## Compositions of a phase (take example of greenfield → level-4 complexity project) → full-scale phase with validation and research → you can expect these compositions

- research BMAD for more definition of 4-level of complexity https://github.com/bmad-code-org/BMAD-METHOD/blob/d43663e3af76ff4a0b635b938195446fb3ab8663/src/bmm/workflows/2-plan-workflows/create-prd/data/domain-complexity.csv#L4 ;  https://github.com/bmad-code-org/BMAD-METHOD/blob/d43663e3af76ff4a0b635b938195446fb3ab8663/src/bmm/workflows/3-solutioning/create-architecture/data/domain-complexity.csv#L4

```markdown
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE EXECUTION                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WAVE 1 (parallel)          WAVE 2 (parallel)          WAVE 3       │
│  ┌─────────┐ ┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────┐ │
│  │ Plan 01 │ │ Plan 02 │ →  │ Plan 03 │ │ Plan 04 │ →  │ Plan 05 │ │
│  │         │ │         │    │         │ │         │    │         │ │
│  │ User    │ │ Product │    │ Orders  │ │ Cart    │    │ Checkout│ │
│  │ Model   │ │ Model   │    │ API     │ │ API     │    │ UI      │ │
│  └─────────┘ └─────────┘    └─────────┘ └─────────┘    └─────────┘ │
│       │           │              ↑           ↑              ↑       │
│       └───────────┴──────────────┴───────────┘              │       │
│              Dependencies: Plan 03 needs Plan 01            │       │
│                          Plan 04 needs Plan 02              │       │
│                          Plan 05 needs Plans 03 + 04        │       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 1. Greenfield → running command `hm-new-project`

after running new-project → the framework must be able

---

## TO BE CONTINUE…
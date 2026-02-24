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

## From Project → Phase → Phase Discussions → Research (if needed)→ Synthesis  → Context gathering + phase-planning → → Plan Validation + TDD → Phase Execution with atomic phase-plans (following the graph) + Validation + Integration  gatekeeping, making sure test incrementally passed → Strict review to detect gaps/drifts → gaps Planning → Repeat iterative loops → Update/Audit milestone

The above is a very brief and abstract flow of how this should be executed as a frameworks - obviously there must a comprehensive sets of `concepts` (agents, commands, scripts, references, workflows, tools, libs, automation, guardrails, robust hierarchy and relationships) please learn from the two frameworks

```markdown
### OpenCode Git Repo https://github.com/anomalyco/opencode

to lessen the confusions when having to both acts as a framework and wrapping others with intricate path finding, document formats and packages updates etc → I decide to invent us own an amplified spec-driven framework → the framework is inspired, enhanced, modified, combined by the `GSD` and `BMAD` → Please use repomix mcp to download these as full pack for investigating + ingesting + selectively synthesize (without having to every time access them online) - **I PROHIBIT EXACT COPY/PLAGIARIZE THESE WORKS - I NEED YOU TO SERIOUSLY MAKE THE KNOWLEDGE INGESTED AND SYNTHESIZED TO FIT OUR PHILOSOPHY**

1. GSD: https://github.com/gsd-build/get-shit-done/
2. BMAD - DOWNLOAD ALL THESE MODULES
    1. BMad Method (BMM)	Core framework with 34+ workflows - https://github.com/bmad-code-org/BMAD-METHOD
    2. BMad Builder (BMB)	Create custom BMad agents and workflows (to build custom agents, workflows, commands etc) - https://github.com/bmad-code-org/bmad-builder
    3. Game Dev Studio (BMGD)	Game development workflows (Unity, Unreal, Godot) (POST MVP) - https://github.com/bmad-code-org/bmad-module-game-dev-studio
    4. Creative Intelligence Suite (CIS)	Innovation, brainstorming, design thinking (SOME Brainstorming, and Problem solving modules can be very helpful) - https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite
```

# So I wonder if the framework should be built up-front before the rest of the other things like schema can match up better?

## 

---

## § HiveMind 4-Layer Architecture

**Status:** SPEC COMPLETE

> Inspired by GSD command orchestration and BMAD boundary discipline, adapted to HiveMind's context-first hierarchy and iterative governance loops.

HiveMind is a hybrid execution system with four interacting layers. Each layer has a strict contract so context can move upward while control and governance can move downward without ambiguity.

```text
                 USER / COMMAND ENTRY
                         |
                         v
   +------------------------------------------------------------+
   | Layer 1: Plugin Hooks (reactive runtime)                  |
   | - session lifecycle, transforms, governance, tool-gate    |
   +-----------------------+------------------------------------+
                           | function calls + in-process events
                           v
   +------------------------------------------------------------+
   | Layer 2: Custom Tools (LLM-callable mutation surface)      |
   | - hivemind_* tools with zod input/output contracts         |
   +-----------------------+------------------------------------+
                           | ctx.client SDK bridge
                           v
   +------------------------------------------------------------+
   | Layer 3: SDK Client (inside plugin via ctx.client)         |
   | - session.create/prompt/find/tui/event.subscribe           |
   +-----------------------+------------------------------------+
                           | SSE + client API
                           v
   +------------------------------------------------------------+
   | Layer 4: Sidecar TUI (OpenTUI dashboard; planned)          |
   | - observability, warnings, timeline, intervention controls |
   +------------------------------------------------------------+
```

### Layer responsibility contract

| Layer | Primary ownership | Allowed mutation | Input contract | Output contract |
|---|---|---|---|---|
| 1. Hooks | Runtime interception, context assembly, governance enforcement | Ephemeral request/response context only | Turn events, tool calls, messages | Transformed prompt, blocked/allowed decisions, telemetry |
| 2. Tools | Durable state transitions in `.hivemind/` and graph stores | Persistent state mutations (write path) | Zod-validated args + resolved context | Structured mutation result + audit metadata |
| 3. SDK | Cross-session automation and runtime capabilities | Session/control actions via API | Plugin context (`ctx`) + auth runtime | Session/task operations, search results, UI signals |
| 4. Sidecar TUI | Operator visibility and intervention UX | UI-local state + user-triggered actions | SSE stream + governance telemetry | Human feedback, triage actions, diagnostics |

### Inter-layer data flow (contract-first)

| Flow | Trigger | Transport | Producer | Consumer | Failure posture |
|---|---|---|---|---|---|
| Hook -> Tool | LLM calls a `hivemind_*` tool | in-process function call | Hook/tool-gate | Tool runtime | Fail-closed for hard governance gates |
| Tool -> Hook | Tool response returns | structured payload | Tool runtime | response hooks | Fail-open with warning if metadata is partial |
| Hook -> SDK | Automation required (session spawn/search/toast) | `ctx.client.*` call | Hook modules | SDK client | Retry once, then soft-gate warning |
| SDK -> Sidecar | Telemetry/warnings/status push | SSE/event bus | SDK/event stream | OpenTUI sidecar | Buffer + replay from last checkpoint |
| Sidecar -> Tool | Human-approved action from dashboard | command/tool invocation | Sidecar action router | Tool runtime | Require human-gate token before mutation |

### Ownership boundaries

- Hooks own *decision timing* (when/if an action may happen).
- Tools own *state mutation correctness* (what changes and how recorded).
- SDK owns *capability expansion* (session/control/search/notify).
- TUI owns *human observability and intervention* (never hidden mutation).

### Integration contract for K1+

- Layer 1 + Layer 2 are mandatory for K1 delivery.
- Layer 3 is mandatory for auto-new-session and silent governance prompts.
- Layer 4 can ship incrementally, but must consume the same event schema as Layer 1/3.

---

<!-- K1-CRITICAL -->
## § Hook Classification & Ordering

**Status:** SPEC COMPLETE

> Inspired by BMAD execution guardrails and GSD quality checkpoints, adapted to HiveMind's read-first hooks and write-only tool boundary.

This section defines a canonical hook taxonomy for 17 hook types, execution order, mutability limits, and K1 wiring for prompt transforms.

### Canonical hook taxonomy (17 types)

| Hook ID | Hook type (canonical) | Category | May block | Mutation scope |
|---|---|---|---|---|
| H01 | `session.init` | Context Injection | No | runtime-only |
| H02 | `session.resume` | Context Injection | No | runtime-only |
| H03 | `session.compaction.pre` | Governance Enforcement | Yes | runtime-only |
| H04 | `session.compaction.post` | Event Monitoring | No | runtime-only |
| H05 | `experimental.chat.system.transform` | Message Transformation | Yes | transformed system prompt |
| H06 | `experimental.chat.messages.transform` | Message Transformation | Yes | transformed message list |
| H07 | `chat.preflight` | Governance Enforcement | Yes | runtime-only |
| H08 | `tool.call.pre` | Tool Interception | Yes | runtime-only |
| H09 | `tool.call.post` | Event Monitoring | No | runtime-only |
| H10 | `tool.call.error` | Event Monitoring | No | runtime-only |
| H11 | `command.pre` | Governance Enforcement | Yes | runtime-only |
| H12 | `command.post` | Event Monitoring | No | runtime-only |
| H13 | `agent.delegate.pre` | Governance Enforcement | Yes | runtime-only |
| H14 | `agent.delegate.post` | Event Monitoring | No | runtime-only |
| H15 | `event.stream.receive` | Event Monitoring | No | runtime-only |
| H16 | `governance.audit.tick` | Governance Enforcement | Soft only | runtime-only |
| H17 | `shutdown.flush` | Event Monitoring | No | runtime-only |

### Mapping to existing HiveMind hook files

| Existing file | Primary category | Canonical hooks owned |
|---|---|---|
| `src/hooks/session-lifecycle.ts` | Context Injection | H01, H02, H03, H04 |
| `src/hooks/messages-transform.ts` | Message Transformation | H05, H06 |
| `src/hooks/soft-governance.ts` | Governance Enforcement | H07, H16 |
| `src/hooks/compaction.ts` | Governance Enforcement / Monitoring | H03, H04 |
| `src/hooks/event-handler.ts` | Event Monitoring | H09, H10, H12, H14, H15, H17 |
| `src/hooks/tool-gate.ts` | Tool Interception | H08 |
| `src/hooks/sdk-context.ts` | Context Injection | H01, H02 support wiring |
| `src/hooks/swarm-executor.ts` | Governance + Delegation | H13, H14 |

### Execution order (single turn)

```text
Turn Start
  -> H01/H02 session context load
  -> H05 system transform (constitution + hierarchy digest)
  -> H06 messages transform (user message + task mapping rewrite)
  -> H07 chat preflight governance decision
  -> If allowed: LLM/tool planning
  -> H08 tool pre-call gate (for each tool)
  -> Tool executes (write path)
  -> H09/H10 post/error events
  -> H16 governance tick + drift warning
Turn End
```

### Blocking policy

| Stage | Block class | Typical reason | Required output |
|---|---|---|---|
| H05/H06 | Hard block | Transform contract invalid, missing required governance envelope | Structured error + remediation hint |
| H07 | Hard or soft block | Missing mandatory entities, drift too high, chain broken | Gate decision object + next steps |
| H08 | Hard block | Tool forbidden in current role/scope | Gate denial + allowed alternatives |
| H16 | Soft block only | Context decay, stale anchors, warning thresholds crossed | Toast/warning + recommended command |

### Ownership and mutability rules

| Hook category | Can write `.hivemind` state | Can call SDK | Can rewrite prompts/messages | Must remain deterministic |
|---|---|---|---|---|
| Context Injection | No | Yes | No | Yes |
| Governance Enforcement | No | Yes | No | Yes |
| Message Transformation | No | No (except read-only context fetch) | Yes | Yes (pure transform) |
| Event Monitoring | No | Yes | No | Yes |
| Tool Interception | No | No | No | Yes |

Hooks are read-first and deterministic. Any durable mutation must occur in a tool call.

### K1 wiring for transform hooks

<!-- K1-CRITICAL -->
`experimental.chat.system.transform` (H05) MUST:

1. Inject constitutional digest from the compiler/packer output.
2. Append active hierarchy cursor (`trajectory`, `tactic`, `action`) and gate mode.
3. Include required checklist summary (missing/passing entities only; concise).
4. Fail closed if constitutional payload is malformed.

`experimental.chat.messages.transform` (H06) MUST:

1. Preserve original user message verbatim in payload metadata.
2. Add a transformed envelope that maps prompt -> inferred task linkage -> governance reminders.
3. Append only relevant context slices (recency + hierarchy relevance), not full history.
4. Fail open with warning when enrichment data is unavailable, but never drop user message.

### Two-transform contract (no duplication)

| Concern | Owned by H05 (system) | Owned by H06 (messages) |
|---|---|---|
| Constitutional rules | Yes | No |
| Role/profile governance | Yes | No |
| User prompt normalization | No | Yes |
| Task extraction hints | No | Yes |
| Cross-turn context digest | Yes (headers) | Yes (selected slices) |
| Entity checklist verdict | Yes (summary) | Yes (per-turn reminders) |

### K1 acceptance checks for hook wiring

- Transform order is deterministic: H05 always before H06.
- H05 and H06 execute on every main-session turn.
- H05/H06 do not write persistent state.
- Tool gate (H08) sees transformed governance metadata before tool execution.
- Drift/warning telemetry from H16 reaches toast pipeline.

---

## § Custom Tool Architecture

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by BMAD tri-modal validation and GSD tool discipline, adapted to HiveMind CQRS where tools mutate and hooks contextualize.

### Naming and identity

- Canonical pattern: `hivemind_{group}_{action}`.
- Compatibility aliases allowed during migration (example: `hivemind_session` routes to `hivemind_session_update` family internally).
- Group names remain stable: `session`, `cognitive`, `memory`, `hierarchy`, `delegation`, `inspector`.

### Required schema contract

Every tool must provide:

1. Zod input schema (strict object; no unknown keys unless explicit pass-through).
2. Zod output schema (status, message, evidence metadata).
3. Action enum where applicable to avoid free-form command drift.
4. FK/ID validation for hierarchy/session scoped operations.

### Tool context flow

```text
Hook preflight context
  -> tool schema validate
  -> tool action execute (write path)
  -> structured result (state delta + evidence)
  -> hook post-validate + telemetry
```

### Tool group catalog

| Group | Primary tools | Mutation responsibility |
|---|---|---|
| Session | `declare_intent`, `map_context`, `compact_session` | Session lifecycle and hierarchy cursor updates |
| Cognitive | `scan_hierarchy`, `save_anchor`, `think_back` | Anchor/cognitive graph adjustments and retrieval state |
| Memory | `save_mem`, `recall_mems` | Durable memory writes/queries with shelf constraints |
| Hierarchy | `prune`, `migrate`, `status` | Tree structure maintenance |
| Delegation | `export_cycle` | Subagent result archival and lineage linking |
| Inspector | `check_drift`, `self_rate` | Governance diagnostics and self-state signals |

### CQRS contract

- Hooks: read-only contextual projection and gatekeeping.
- Tools: write-path commands with explicit state transitions.
- Query-style tools may exist, but return immutable views and never mutate graph/session files.

### K1 guardrail note

Even in outline phase, K1 requires that new governance tools follow full Zod contracts before merge.

---

## § SDK-Powered Governance Capabilities

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by GSD orchestration APIs and BMAD workflow manifests, adapted to HiveMind's in-plugin SDK control plane.

`ctx.client` provides an internal control surface that hooks can use without exposing direct mutation logic to prompts.

### Capability map

| Capability | API surface | Primary use in governance |
|---|---|---|
| Session bootstrap | `session.create(...)` | Auto-new-session when stale/threshold conditions trigger |
| Silent prompt injection | `session.prompt({ noReply: true })` | Inject governance/context packets without user-facing noise |
| UX signaling | `tui.showToast(...)` | Warn on drift, gate failures, missing prerequisites |
| Real-time watch | `event.subscribe(...)` | Track tool and lifecycle events for dashboards and alerts |
| Code discovery | `find.text`, `find.files` | On-demand evidence scan before planning or enforcement |

### Decision matrix: SDK vs Hook vs Tool

| Need | Use Hook | Use Tool | Use SDK |
|---|---|---|---|
| Rewrite prompt context | Yes | No | No |
| Persist hierarchy/memory state | No | Yes | Optional wrapper only |
| Spawn or route session programmatically | No | Optional (trigger) | Yes |
| Notify user/operator in UI | Optional trigger | No | Yes (`tui`) |
| Real-time telemetry stream | Optional handler | No | Yes (`event.subscribe`) |

### K1-aligned scenarios

- Auto-new-session (Knot 2 precursor): evaluate stale conditions in hook, create session via SDK, write official state via tool.
- Governance nudge: hook emits soft-gate warning, SDK toast informs user, no mutation occurs.
- Evidence scan: hook requests `find.*` via SDK for quick context validation before hard gate decision.

### Constraint

SDK calls may orchestrate behavior, but persistent data authority remains in tool layer.

---

<!-- K1-CRITICAL -->
## § Constitutional Governance Contract

**Status:** SPEC COMPLETE

> Inspired by BMAD success/failure gate discipline and GSD checkpoint rigor, adapted to HiveMind constitutional schemas and hierarchy-linked enforcement.

This contract defines how constitutional schemas become runtime governance behavior on every turn.

### K1 constitutional artifacts

| Artifact | Role | Produced by | Consumed by |
|---|---|---|---|
| `GovernanceInstruction` | Canonical rule payload for turn execution | Compiler from schema + state | H05 system transform |
| `ConstitutionalRule` | Atomic policy units with severity and scope | Schema set in `src/schemas/` | Compiler + gate engine |
| `EntityChecklist` | Mandatory entity verification per context mode | Checklist evaluator | H05/H07/H16 and tool-gate metadata |

### Governance injection pipeline

```text
Constitutional Schemas
   -> Instruction Compiler
      -> Cognitive Packer (digest + relevance filter)
         -> H05 system transform inject
            -> LLM turn execution
               -> H07/H08 gate evaluation
                  -> H16 warning/audit telemetry
```

### Pipeline stage contracts

| Stage | Input | Output | Must fail when |
|---|---|---|---|
| Schema load | Versioned governance schema files | Parsed schema objects | Schema parse error or missing required rule set |
| Compiler | Schema objects + runtime state | `GovernanceInstruction` bundle | Rule dependency graph invalid |
| Packer | Instruction bundle + relevance context | Compact digest payload | Digest exceeds hard size budget and cannot prune safely |
| H05 inject | Digest payload | System instruction block | Block malformed or missing checklist summary |
| Gate engine | Turn intent + checklist + severity map | auto/soft/hard/human gate decision | Decision cannot be computed deterministically |

### Entity checklist enforcement flow

<!-- K1-CRITICAL -->
1. Determine operating mode (`plan_driven`, `quick_fix`, `exploration`).
2. Resolve required entities for mode and scope (session, hierarchy, planning SOT, optional code-intel).
3. Evaluate each entity as `present`, `stale`, `missing`, or `inconsistent`.
4. Map failed entities to gate level:
   - `auto-gate`: self-healable via safe tool action.
   - `soft-gate`: warn and continue with constrained execution.
   - `hard-gate`: block mutation/tool path until fixed.
   - `human-gate`: require explicit user confirmation for risky/destructive path.
5. Emit checklist verdict into H05 summary and H07/H08 gate metadata.
6. Record evidence event for audit trail and sidecar telemetry.

### Gate types adapted for HiveMind

| Gate type | Trigger pattern | Enforcement owner | User visibility | Typical outcome |
|---|---|---|---|---|
| Auto-gate | Missing derivable metadata or stale cache that can be rebuilt safely | Hook + safe tool chain | Optional toast | Auto-remediate then continue |
| Soft-gate | Drift/context concerns without immediate safety risk | Hook governance layer | Toast + recommendation | Continue with warning |
| Hard-gate | Contract violation, missing critical entities, forbidden tool scope | Hook/tool-gate | Explicit block response | Stop execution until repaired |
| Human-gate | High-risk operation (destructive/security/billing boundary) | Hook + user confirmation step | Explicit prompt required | Wait for user approval token |

### Success metrics (K1)

✅ Every main turn includes constitutional digest via H05.
✅ Checklist verdict is computed and visible in governance metadata.
✅ Gate decision is deterministic for the same inputs.
✅ Hard-gate violations block tool mutation path.
✅ Soft-gate warnings reach user surface (toast/message).
✅ Governance evidence events are emitted for audit replay.

### Failure modes (K1)

❌ System transform executes without constitutional payload.
❌ Messages transform injects context not linked to active hierarchy.
❌ Gate severity mapping is ambiguous (same issue resolves to different gate types).
❌ Hook performs persistent mutation directly (CQRS breach).
❌ Checklist reports pass when required entities are missing.
❌ Hard-gate condition emits warning only and allows mutation.

### Constitutional invariants

- Determinism over creativity in governance path.
- Relevance-first context packing over maximal context dumping.
- Human override only for explicit high-risk gates.
- Full auditability of every allow/block decision.

---

## § Command-Hook-Skill Chaining

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by GSD command-to-workflow delegation, adapted to HiveMind where commands are entry points, hooks are guardrails, and skills are domain intelligence modules.

### Command taxonomy (proposed)

| Group | Purpose | Example command family |
|---|---|---|
| `session/` | Session start/update/close flows | `hivemind-session-*` |
| `planning/` | Spec, roadmap, phase planning pipelines | `hivefiver-spec-*` |
| `code-intel/` | Scan/map/watch/reindex knowledge paths | `hivemind-code-*` |
| `governance/` | Gates, audits, drift, constitution diagnostics | `hivemind-govern-*` |
| `delegation/` | Subagent dispatch/export and cycle management | `hivemind-delegate-*` |
| `settings/` | Profiles, configs, environment and safety controls | `hivemind-config-*` |

### Chaining contract

```text
Command trigger
  -> resolve skill set (domain knowledge injection)
  -> run hook preflight (governance/context checks)
  -> execute tool or workflow action
  -> run hook post-validate
  -> export cycle + emit telemetry
```

### Skill consumption model

- Commands decide which domain pack/skills are required.
- Hooks enforce that mandatory governance skills are present before risky operations.
- Skills provide policy and procedural context but do not mutate durable state.

### Lifecycle chaining (target behavior)

1. Command is invoked by user or automation.
2. Relevant skills load and inject bounded expertise.
3. Hook layer validates context integrity and entity checklist.
4. Tool executes mutation/query within CQRS boundaries.
5. Hook layer validates outcomes and emits warnings/blocks.
6. Results are exported with lineage for replay and review.

### K1 note

For K1, only the governance-critical command paths need strict chaining; full command group normalization is deferred to Knots 2-5.

---

## Next: Framework Expansion Roadmap

**Knot 2 - Session Automation and Triggering**
- Define auto-new-session trigger matrix (time, drift, task closure, risk boundary).
- Specify SDK + tool handshake for safe session spawning and ownership transfer.

**Knot 3 - Command System Refactor**
- Normalize command groups and argument schemas.
- Introduce command manifest with dependency declarations and gate metadata.

**Knot 4 - Skill and Domain Pack Runtime**
- Formalize skill loading policy, compatibility checks, and cache lifecycle.
- Define domain-pack router contracts across dev and non-dev workflows.

**Knot 5 - Sidecar OpenTUI Control Plane**
- Define telemetry schema and SSE channel contracts.
- Specify intervention controls (pause, retry, force human-gate, export trace).

**Cross-knot hardening items**
- Add conformance checklist for hook determinism and CQRS purity.
- Add migration guide from legacy aliases to canonical `hivemind_{group}_{action}` naming.
- Add evidence model for audits, replay, and release gate sign-off.

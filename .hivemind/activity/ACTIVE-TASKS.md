# Protocols:

1. Untrusted documents - even what is in [AGENTS.md](http://AGENTS.md) - check for the sack of the project’s health and real-life implementation and uses of it
2. the scopes of the project has not been really decided - OVERVIEW.md
3. You are the orchestrator - you are blind you can think within this session chat workflow → the rest you must coordinate and orchestrate other agents -WHY? - Because this session is intensive and long-haul with token-consumption-demanding → so keeping this session fresh to clearly see turn and intents’ layer shift, seeing from high-level of what has happened and parse the collected of output investigation (must delegate the agents to output the research, investigation and evidences to disk for later turns retrieval and re-consumption) 
    1. there are tools as agent-work-contract, trajectory, or something related to tasks management - I am not sure if they are working but these be the “managing layer” so the orchestrator can read form high-level seeing across sessions, quick write and update the flows of orchestration and the downstream sub-agents also what artifacts documents, handoff and so on, they are the utilities factor for your purposes - also record and manage main and sub-sessions, and help the todo tasks survive through compacts etc - in-short the utilities to aid the long-haul, across session vs. integrity of the project

## Briefing about the project at [OVERVIEW.md](http://OVERVIEW.md)

<aside>
💡

## EXTREMELY IMPORTANT! UNDERSTAND THESE CONDITIONS - These are facts of how this project works

- A harness system running on OpenCode → so users install this through npm and npx → built into the dist folder at root (from this the engine works and tools, SDK engines and other npm libraries run, the programatic engines of auto write, parse start working and distribute assets, json, md files, logs in to .hivemind/*.*/*.*/ ~*.json, *.md, *.xml, *.yaml -
- AND because you are also functioning on this same OpenCode environment → to really check and see how “something” works, the pipeline, flow, consumers and what code files work or not you must reinstall and run new clean build and ask me for restart afterward the next run will see impact
- And since you are working under .worktree → I don’t know if `npm link` is needed?
</aside>

## The following are what I think as “good practices” - but not sure you must delegate your expert team to verify with fact from research deep synthesis with the true uses and intents of use vs. the tradeoff for the architecture, extensions, reusability, bloats, code smell,  design patterns and refactor - etc

### Definition of run-time:

Since following the granularity, hierarchy and relationships vs. domain-specific harness games. to control what read, what to follow, controlling the agents’ deterministic decisions to use which tools under what situations as workflows and user’s intents and the integrity of the project under the scopes of context-engineering  for long-horizon, long-haul and across-sessions run - you follow the scopes to assess if these are the true run-time events that the above factors can be manipulated:

- When users create a new session (THESE ARE FACTS !  **IMPORTANT** THE FOLLOWING 3 ARE WHAT USERS CAN DO WITH THERE OPENCODE CLIENT →
    - resume from it
    - fork from a message → a new forked session ledger
    - redo and undo turns in a session
- And since turn takes anew API sent to llm after the next message sent by users → these are when the variables that either benefit or harm the harness for these facts:
    - many turns last → the profile body of agents will get pruned and not in the priority of the llms decision of “next actions”
    - but if the runtime is loaded with what I mentioned below {  `commands, prompts (as workflows) , rules, permissions (to manipulate the what tools, what skills, what commands are allowed to use or assign to which agent and subagents), agents vs subagents, skills` } >>>>> these can refresh the instruction for what agents should behave next
    - and there are 2 types of sessions which is main-facing users and the ones are delegated as subagents run for isolation of context
- The above can be all intercepted with “soft” techniques - if more granular controls are needed (like files changed, tools execution, message in sessions events, permissions and lsp events etc) and to apply “extra features” to the runtime → the next levels are custom tools and plugins - so these are also my rationales and arguments for what the system should be refactored toward
    
    <aside>
    💡
    
    #### PLUGINS vs.  CUSTOM TOOLS - and the stacking of OpenCode Innate Concepts factor upon these knowledge
    
    1. The events https://opencode.ai/docs/plugins/#events that plugins can subscribe - then add functions and features through internal hooks and installed https://opencode.ai/docs/plugins/#from-npm  libraries ; and since https://opencode.ai/docs/plugins/#create-a-plugin and custom tools can add with plugins https://opencode.ai/docs/plugins/#dependencies  
    2. Custom tools: since https://opencode.ai/docs/custom-tools/#multiple-tools-per-file - we can split tools by register which tools for what kind of agents, or which workflows, or which classifications based on the intents and the purposes as users prompting and creating new sessions  and these following features of a tool we can also consider to stack more wisely 
        1. https://opencode.ai/docs/custom-tools/#context - tools can Tools receive context about the current session
        2. https://opencode.ai/docs/custom-tools/#arguments - You can also import [Zod](https://zod.dev/) directly and return a plain object: You can use **`tool.schema`**, which is just [Zod](https://zod.dev/), to define argument types.
        3. tools that can also be written in other languages https://opencode.ai/docs/custom-tools/#write-a-tool-in-python 
        
    3. From what I have collected from OpenCODE the soft concepts as commands, prompts (as workflows) , rules, permissions (to manipulate the what tools, what skills, what commands are allowed to use or assign to which agent and subagents), agents vs subagents, skills are can all modify by users and manually added as anew by them (by either modifying the opencode.json, setting.json, or simply the dedicated folders containing .md files and frontmatter yaml config  under .opencode/ for project-only-config or ~./.config/opencode/*.json or that of folders dot md → and among these the “skills” are the most flexible → the concepts work for other platforms too and since they are portable they play as “Tier 3” for the reason. And from the above knowledge, I don’t think it is wise to mix these “fragile” commands, prompts (as workflows) , rules, permissions, agents vs subagents  into our harness governance unless we can hard-wire the default into 
    </aside>
    

### RUN-TIME and interception:

- as prompt, commands, skills, injection (simply the hooks to events → message append before) and since we can stack these and custom tools and plugins

<aside>
💡

### KNOWLEDGE THAT I HAVE COLLECTED - THE XML Files ARE THE WHOLE GIT REPO DOWNLOAD :

#### OPENCODE:

```markdown
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-agents.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-built-in-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-commands.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-configs.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-custom-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-plugins.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-rules.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-sdk.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-server.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-skills.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.xml
```

### JSON-Render

this is what I use as for the GUI interactive internal client-vs server using SDK and API of OpencodenCode for the 2 purposes 

/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml

- so that the “Module builder Agent - Hivefiver” can visually interact and display “artifact” to aid users configuration for the build of concepts run-time concepts injections - of both Hivemind custom features (stacking custom tools and plugins as features ) OpenCode’s innate meta concepts (skills, commands, built-in tools, config  of permissions, creation of new agents → to visualize this when user or run slash command /hm-skill-config  , /hm-skill-build -or  prompt “the Hivefiver agent” I want to build skill - the intent hook will triger the command agent run and load what skills available and dis play the GUI and base on what we have defined as which runtimes to inject what skill to which agents or to which workflows (as we have config the conditional functions for this granular control)
- And also the local client  local host display with ReAct

#### The other repos to learn from some “features” as background sub-sessions agents, timing sessions, runtime build programatic and deterministic functions to trigger a workflow , context prune,  or the way they structure and organize, hooks, features, plugins, tools

/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml

</aside>

# ALL in ALL my rationales are

1. There are not many “features” that require me to use SDK yet → so take this into arguments between modules and interfaces 
2. CRUD operations are mostly to internal .hivemind and the json and md, xml, yaml  but I categorize them into the 3 groups and reflect these with 4 of our philosophies - hierarchy, relationships, context-integrity-governance, granularity control, and agents’ intelligence (and consider this with if CQRS needed in which cases or totally not needed; and at certain feature the field schema either need to get validated if OpenCode configs settings of concepts needed (these are when OpenCode API interfaces need to match)  or when internal used schema fields are used  as consistency for parsing purposes and hierarchy and relationship set up needed like the trajectory; else those like session-used for management of a flow like agent-work contract, tasks-persistent is more like the session-only ones  and are updated deterministically by agents):
    1. The deterministic of agents decide to use a custom tools → I don’t think this has any high frequency and much simultaneous of write, read nor update - because the agents flows and even if users run parallel instances they write and update on different files
    2. the auto appended, parse based, write as appended as example below → so these are the write and  parse  and auto append  ( and obviously you can track them in code as the `journal` or `track` `tracker` or `event` or `session` related I could not remember → to see example delegate investigation to ses_2bcc (the purposes of such - and later I will modify the parse and write engines to select more refine metadata and parse concise context to facilitate the time-machine purposes across sessions)
        
        ```markdown
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2bca.json
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2bca.md
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2bcb.json
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2bcb.md
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2be2.json
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2be2.md
        /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions/journey-events/ses_2be3.json
        journey-events/ses_2c56.md
        ```
        
    3. and the hybrid of the two
3. And for organization purposes I make the whole project into
    1. Tools as agents’ deterministic uses
    2. features can be group further into:
        1. self-sustain on and of features
        2. features that need subscription with hooks  and our custom functions then can be further:
            1. types of hooks base on run-time
            2. we can manage more plugins handlers for better grouping and structure for the purposes
    3. and the advanced ones with need a grouping that require external libraries
    4. the last one is the most advanced that require both c and external interaction with SDK of OpenCode ; or further down the road the project can add in with custom-made MCP server tools → These can be leave aside for less concerns

→ As the grand purpose of the  before grouping and npm install packages → I can ship the product as modular as plugin-based 

<aside>
💡

# HEAD UP

## Notice! As An Orchestrator - You Delegate, You do not investigate (`hivexplorer` does ), do not read, you are blind, you do not consult me (`architect` consult me) , you must never plan (`hiveplanner` does), `hivemaker` code and implement etc you must never research yourself You must delegate

- Plan your orchestration, maintain tasks → they are cycles loops within
- when delegate → you do not show how-to-implement to the specialist agents YOU MUST instruct how-to-process ; the metric, handle the handoff make sure they are matched and factual
- you do not execute the verification nor gatekeeping you → you delegate specialist by passing the handoff to `hiveq` ; to `code-skeptic`
- you must understand this as hierarchy and granular extensive traversal route and reroute → It is very dumb and shallow if you have not understand the full scopes - be extremely iterative and skeptic
- you must know the cap of 1 context window of the agent you delegate - if the tasks are large they could not all fit a single delegation and the results returned are trash
</aside>

```markdown
**The HIVEMIND FRAMEWORK**
- Absolute Granularity refers to components that operate at a single hierarchical level without sublevels, and which are linked in a chain where each unit has identical preceding and following units. Every variant and edge case of these units has been evaluated. The system is safeguarded by precise static metrics at both extreme ends. These units are atomic and, when CRUD operations are performed on the base reference @OVERVIEW.md, they produce minimal regression.
- Using @.planning/PROJECT.md and @OVERVIEW.md as sources, identify traversal, rerouting, branching, and pivot strategies. Ensure “hiveminder” can adapt with safe fallback, a time‑machine memory context, and the ability to revert atomic actions. Avoid the following anti‑patterns:
    1. **No outline, framing, or skeleton** – the agent must begin with a high‑level structure, otherwise it fails.
    2. **Assuming low‑level tasks or showing how‑to implementation** – the agent must capture user intent, delegate to “hivexplorer” for context matching and transformation, validate the intent, then break the work into granular tasks.
- The concept of  **Absolute** 2-end-extreme-success-metrics: of such to **Gate-Keeping** the Absolute Granularity’s success and passed, these metrics must feature the following:
    - **Programmatic, end‑to‑end testability**: The metrics must be implementable via automated tests that validate system behavior in real‑world scenarios, from start to finish, ensuring a clean commit at every stage.
    - **Valid, scale‑based quantitative metrics**: Metrics must be expressed as numerical values with clear scoring guidelines; they cannot be simple state flags.
    - **Scope‑aware adjustment**: Metrics should adapt to in‑scope and out‑of‑scope requirements without allowing feature creep.
    - **Role‑focused responsibility assessment**: Clearly define concerns, responsibilities, and actors; set boundaries while still validating edge cases, risks, and the minimal viable product. Deferred decisions should be recorded as future items, ensuring a deterministic yet non‑mechanical testing approach.
    - **Integration‑centric incremental assessment**: Use integration and incremental tests to pinpoint precisely where failures occur, enabling minimal effort remediation.
    - **Anti‑pattern awareness**: Recognize the anti‑pattern where baseline unit tests pass but unrelated functionality fails, and ensure metrics guard against such false positives.
- Clarify the distinctions between ecosystem, hierarchy, and cross‑domain relationships and establish a clear mindset for each. Then design a step‑by‑step workflow for node resolution before moving on. Expand coverage to encompass the full horizontal breadth at the smallest granularity, and ensure that tasks are not performed out of order, as that can lead to confusion.
- The system must distinguish between tasks that directly contribute to a project’s deliverables and those that serve purely as exploratory research or learning. Not every file or folder within an organization’s repository is an asset ready for technology synthesis; many are simply reference material for users. For instance, a `.hivemind/*.*/*.*` directory structure should be categorized by topic and domain, not treated as a pending asset.
- When research is conducted to identify patterns and API interfaces across repositories A, B, and C for the purpose of creating new feature‑class implementations, this is a distinct phase: research synthesis that feeds into technical knowledge synthesis. The system should recognize this workflow and handle it accordingly.
- the concept of **Absolute Entries**, defined as the true runtime starter of an entity at its finest granularity. When a user initiates a session with a prompt, the system must evaluate a set of variables that qualify the entry as absolute:
    - Is the prompt clear, ambiguous, or absurd?
    - Does it include attached documents?
    - Does it fail to identify work/task orientation and classification?
    - Is it linked to its parental hierarchy?
    - Does it have a concrete plan or is it entirely open‑ended?
    - Are any associated documents stored on hard disk?
    - Are the documents and artifacts trustworthy?
    - Other relevant variables that impact assessment.
```

[Architecture Inventory Hivemind](https://www.notion.so/Architecture-Inventory-Hivemind-334926f31a4d80fc82dedb8becd17b27?pvs=21)
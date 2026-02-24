# refactor for .hivemind ver.2.9

# Goals

there are 2 big goals that need achieving which you must thoroughly refactor, improve, categorize with robust : use Deepwiki MCP to ask related questions for OpenCode Git Repo https://github.com/anomalyco/opencode 

- The refactor of schema vs. tools, hooks, libs, scripts ; refine its responsibilities, data-flow and lifecycle, automation and self-governance, setting up new tools, libraries and features of the `code-intel` to serve in this ecosystem; define the correct relationship + hierarchy and the static context  → Making the-hivemind-own-spec-driven framework (instead of detecting `GSD`, `BMAD`, `Spec-kit` to wrap and control them → now detect and convert to our own framework to better utilize the rest of the concepts of `agents`, `commands`, `workflows`, `references`, `templates`, `skills`, `hooks` and `scripts` and chain a better state managements - these areas need to improve and refactor:
    - control tasks hierarchy with ID , sub-tasks, and relational meta-data → schema link to the framework’ SOT plannings’ documents and artifacts → the tasks are nodes-control because they are across sessions; they are broken-down to delegation up-to 3-level of agents and tasks; they are classified and if belong to the project they must be classified into → (discovery, discussion, planning, investigation, research, planning, concept, brainstorming, implementation, refactor, debug, testing, experimenting, pivoting, gate-keeping, house-keeping, gaps, roadmap, milestones, architecture, dependencies, stacks, context etc, can make these as tags) → as they are schematic and types strong so make sure the following entities can be made relevant, parsed, matched, coherently with this
        - improve tasks → with orchestrating iterative loops of tools for delegations and validation with requirements
    - Trajectory = auto exports (with values as `tools`, `tasks` and`sub-tasks` , anchoring of turns, intentions, pivots - matching rational meta-data → a more schematic approach with concise, hierarchical (control all delegations of up to 3rd level) and relational context with date and time stamps of meta-data(connects, links, show relevancy) and condense valuable session-export (utilize tools, libs, hooks - for auto export of all main and sub’s assistant’s last message, step-actions executions, evidences of what tools uses, yield what results , forming what sequential actions etc)→ supporting fast traverse, retraceable, matching sessions and other entities; context inspecting etc
    - refactor `brain` vs `states` as the below and the `/Users/apple/hivemind-plugin/docs/planning-draft/forming-the-own-framework.md` approaches
    - `planning` is now suited to a more rigid, hierarchical, project-oriented, with various stages, phases, sequential phase-planning etc → by `/Users/apple/hivemind-plugin/docs/planning-draft/forming-the-own-framework.md` has explained
    - configs + profile commands refactored as said in `/Users/apple/hivemind-plugin/docs/planning-draft/forming-the-own-framework.md` → these are included and send-along prompt context and stay persistent
    - and many more but please help by having these approach with roadmap and clear phase-planning
- **AS IMPORTANT AS THE ABOVE** → THE DEVELOPMENT OF OPENTUI Controlling and dashboard → for MVP these are made as side-loaded TUI - UI → these must be comprehensive, well-thought-out, well-made as it will become the essential dashboard + viewport + configuration panels + interactions and interactive artifacts/reports/planning ; showing diagram, mapping, pipelines, life cycles, executions and monitor all the on-going and happening activities of the framework

# Pitfalls , misconceptions - correct-understanding of the project:

1. this is a complete build-kit + spec-driven framework  packed as a OpenCode plugin with libraries, custom tools, scripts , meta-builder, and a full-fletch enhanced spec-driven, tdd framework → that user through the installation from this `npx hivemind-context-governance@latest init` (this is the `master` branch - which is a public one and behind the `dev-v3` branch) + and working along-side with it is this https://www.npmjs.com/package/hivemind-context-governance - so through selection of sequential CLI-steps - the following are setup, appended as for users (using with OpenCode, with their project-of-choice; utilizing this Package for all the features, capabilities, dev-framework, context-governance etc that this offers) :
    1. sync assets → synchronize all the root folders of `commands` ; `skills` ; `agents` ; `templates` ; `references` ; `workflows` ; `prompts`  → to either project .opencode/* or global one or both
    2. to update with any new `lib`, `tools`, `hooks`, `script`, `schema ,`  `configuration` - anything that impacts, relates to `.hivemind/*.*/*`  and its sub, child etc → is what built and manifested at `dist` → hence the it needs to reset, rm cache and node_modules + rebuild → to update with the newest
        
        ```markdown
        dist
        dist/cli
        dist/dashboard
        dist/hooks
        dist/lib
        dist/schemas
        dist/tools
        dist/utils
        dist/cli.d.ts
        dist/cli.d.ts.map
        dist/cli.js
        dist/cli.js.map
        dist/index.d.ts
        dist/index.d.ts.map
        dist/index.js
        dist/index.js.map
        
        ```
        
        And since this project happens to use this same thing to test and build on it, and since it is running on the old version and with redundant of sessions-related mixed of context → causing misunderstanding and confusions 
        

# Non-negotiable must set up, rules, agreements:

for the following elements/factors - since I do not know what to call them; neither these are in anyway at the accurate order nor classification nor hierarchy (that’s why to make this list comprehensive, you should first learn the project and the framework → so that you can 1st systematically group, order, map relationship, put into hierarchy, set domains and fill the gaps between them (so that we we gradually and granularly cover one domain with 100% coverage before moving to the next neighbor →  following the philosophy of complexity layering - finding the entry and define the absolutes with research-backed evidence (addressing one node both horizontally and vertically without any gaps, conflicts, nor drift, nor overlapping) → solving one complete smallest knot before spreading to its neighbors:

## A. Our framework’s entities & concepts’ terminologies:

### 1A. Libraries (`src/lib/`): The Subconscious Engine (RAM/CPU)

- **What they are:** Pure, deterministic TypeScript business logic. *LLMs do not know these exist.*
- **Purpose:** State manipulation, graph traversal, time-to-stale calculations, file I/O, and string compression.
- **Rule:** A library function must *never* return natural language meant for an LLM to read like a chat. It returns strict JSON, Booleans, or highly structured ASTs/XML.

**AUDIT TASKS’ Attentions: → the above definition may get out-dated and does not clearly define /lib/ → perhaps, I think this should be further categorized and structured due to the new introduction of `code-intel` - CAUTION! - AS I HAVE SKIMMED THROUGH THIS JUNCTION IS ALSO HALF-BAKED AND NOT COMPLETED AS WHAT SHOWN IN CODE**

- The list of documents related to this sector:

```markdown
/Users/apple/hivemind-plugin/docs/plans/2026-02-19-code-intelligence-engine-architecture.md
/Users/apple/hivemind-plugin/docs/plans/2026-02-20-code-intelligence-engine-execution-plan.md
/Users/apple/hivemind-plugin/docs/plans/2026-02-20-hivefiver-architect-floppy-blueprint.md
/Users/apple/hivemind-plugin/docs/plans/2026-02-20-hivefiver-autonomy-systemization-roadmap.md
/Users/apple/hivemind-plugin/docs/plans/2026-02-19-entity-relationship-remediation.md
```

- The structure + all files belong to this → suggestion to SEQUENTIALLY deep scan (actively use `explore` and `scanner` agents, do delegate various conditionally routed scanning and searching with off-set read, grep, list, regex, glob etc + online research and mcp research if needed - do not worry about token spending, as long as what synthesized as report/audit after these scan = absolute SOT, valid, precisely accurate and address 100% the pains)

```markdown
src/lib
src/lib/code-intel
src/lib/code-intel/binary-detector.ts
src/lib/code-intel/file-scanner.ts
src/lib/code-intel/gitignore-filter.ts
src/lib/code-intel/index.ts
src/lib/code-intel/secret-detector.ts
src/lib/code-intel/signature-extractor.ts
src/lib/code-intel/token-counter.ts
src/lib/code-intel/tree-sitter-loader.ts
src/lib/anchors.ts
src/lib/auto-commit.ts
src/lib/auto-context.ts
src/lib/brownfield-scan.ts
src/lib/budget.ts
src/lib/chain-analysis.ts
src/lib/cognitive-packer.ts
src/lib/commit-advisor.ts
src/lib/compaction-engine.ts
src/lib/complexity.ts
src/lib/detection.ts
src/lib/event-bus.ts
src/lib/file-lock.ts
src/lib/framework-context.ts
src/lib/gatekeeper.ts
src/lib/governance-instruction.ts
src/lib/graph-io.ts
src/lib/graph-migrate.ts
src/lib/hierarchy-tree.ts
src/lib/hivefiver-integration.ts
src/lib/index.ts
src/lib/inspect-engine.ts
src/lib/logging.ts
src/lib/long-session.ts
src/lib/manifest.ts
src/lib/mems.ts
src/lib/migrate.ts
src/lib/onboarding.ts
src/lib/orphan-quarantine.ts
src/lib/paths.ts
src/lib/persistence.ts
src/lib/planning-fs.ts
src/lib/project-scan.ts
src/lib/session_coherence.ts
src/lib/session-boundary.ts
src/lib/session-engine.ts
src/lib/session-export.ts
src/lib/session-governance.ts
src/lib/session-split.ts
src/lib/session-swarm.ts
src/lib/staleness.ts
src/lib/state-mutation-queue.ts
src/lib/toast-throttle.ts
src/lib/tool-activation.ts
src/lib/tool-response.ts
src/lib/watcher.ts
```

### 1B. - `Schema` - this is hard to define but seems like the bridging entities to `hooks` and `tools` with `lib`

Please read the below about `sessions` of 3-level vs. `tasks and sub-tasks` vs.

- THIS SECTOR AS AN ENTITY IS THE SOT AND ESSENTIALLY NEEDS CONSTRUCTING AND REFACTORING INTO OUR FRAMEWORK `different kinds of plans` vs. `spec-driven SOT projects' documents and artifacts` (these are `project` + `prd with comprehensive requirements` + `architecture` and `adr`  with `data model`, `contract, schema, data flow and pipelines, boundaries, states and persistence etc`  (depends on language, project, framework of developments and complexity of the project these are part of the architecture and adr)+  `tech-specification`  + `design and structure` + `pitfalls vs patterns and anti-patterns of stacks` (SDK and research with all valid cross-dependencies research and stacks’ synthesis to totally cover all requirements, acceptance criteria of functional and non-functional, addressing all edge cases; harnessing with non-shallow users’ journeys) + `ux-specification` (if needed) → going through multiple rounds and cycles of `gatekeeping` as `validation` + `integration` + cross-architecture and cross-dependencies tech and product analysis research + granularly and through different perspectives to not only help and direct users toward valid developments (to always knowing the complexity layering achievable MVP as foundation before making any thing complex - to ensure the complete successful build) + help and ask clarify questions with expert-mode enabled (having the research context backed) → to ultimately gather enough information + knowledge for the above

---

once you can understand the whole framework deeply and more comprehensively then this sector of schema definitely needs refactoring and improvements

```markdown
/Users/apple/hivemind-plugin/src/schemas
/Users/apple/hivemind-plugin/src/schemas/brain-state.ts
/Users/apple/hivemind-plugin/src/schemas/config.ts
/Users/apple/hivemind-plugin/src/schemas/events.ts
/Users/apple/hivemind-plugin/src/schemas/graph-nodes.ts
/Users/apple/hivemind-plugin/src/schemas/graph-state.ts
/Users/apple/hivemind-plugin/src/schemas/hierarchy.ts
/Users/apple/hivemind-plugin/src/schemas/index.ts
/Users/apple/hivemind-plugin/src/schemas/manifest.ts
```

### 1C. `src/tools`  - the below is how these were defined; however I feel there are much more to `tools`   than just `dumb routing layers`

- old definition

```markdown
### 2. Tools (`src/tools/`): The Conscious Limbs (The LLM API)

- **What they are:** Dumb routing layers. They are just Zod schemas exposed to the LLM.
- **Purpose:** To give the LLM a highly constrained, predictable way to trigger Library functions (e.g., `save_mem`, `mark_task_complete`).
- **Rule:** Tools contain **zero complex business logic**. A Tool parses the LLM's JSON arguments, passes them to a Library function, and returns a brief success/fail string. **If a Tool is longer than 150 lines, it is architecturally flawed (yet it is kind of  flexible and the way how you define a tool is not equal to a file - because in OpenCode A file can nest multiple tools - a**lso we can stack ARGUMENT and other scripts and languages - so the constraints above scan literately lifted depending on how you engineer this section with lib a
    - Knowledge for custom tools:  @/Users/apple/hivemind-plugin/docs/research/custom-tools-opencode.md (read the part about nested tools, tools to manipulate context; and the mindset to combine tools ; related parts of
    - learn the other parts from the docs/research (like innate tools, commands, plugins and the SDK)
```

- CURRENT TOOLS’ FILES:

```markdown
src/tools
src/tools/hivemind-anchor.ts
src/tools/hivemind-cycle.ts
src/tools/hivemind-hierarchy.ts
src/tools/hivemind-inspect.ts
src/tools/hivemind-memory.ts
src/tools/hivemind-session.ts
src/tools/index.ts
```

- THE NEW REALIZATIONS AS FOR NEW GROUPS OF TOOLS - AND WHY THESE ARE NEEDED - judging by these variables (of what can happen during a session between the users vs agents) + new expansions of features growing needs for tools that are more utilities-oriented, role-and-domain-specific tools or specialized tools + how tools can be combined together and stacked with scripts - of various languages - and uses of the OpenCode SDK >> These are what I feel lack
1. context purification + validation + doctor → a set of tools that are specifically utilize `schema` , `meta-data, fast-tracking, traverse and cross domains reading, validating, extract, compare and contrast, parse with status, checking date and time stale etc (of the .hivemind's folders and files)` ; a set of tools that’s ready to help with various `templates` of `scanner` and `explore` squad of either parallel or sequential `scanning tasks` → a super-set that `hivefiver` agent can use to not only as the above requested; but it can give a superior speed and efficiency every time (as starting a new session or resuming from a session), by users simply say `continue where you left of` ; with these tools; the agent in charge can initiate and get back the whole load of contextual and valid hierarchy of tasks, plans, and context to resume without a hassle.
2. the in-session tools + lib for task-type-specific-session-related-memory (as it is widely known that the user’s intentions - especially the sloppy ones - often jump from on-going tasks to request somethings out-of-scopes → that’s when agents need to set cue-memory or set-aside the tasks in one particular in-session-memory to  when the the disruptive-short-tasks are resolved, it can resume to the main.
    
    Other task-type-specific (by agents’ roles and workflows) can also be utilized are the following:
    
    - in-session-debug-memory: to records attempts, trials, tracking, scratchpad, log etc → debug more systematically
    - in-session-research / in-session-investigation: more often than not research (of stacks, tech-context, requirements, patterns etc)  and codebase investigations (Scan, of search, grep, off-set reading, glob, regex, etc) are often not mere singular delegations but often the results of batches of sequential and parallel delegation of swarms of agents and tasks → if the exports and context can be schematically regulated with meta data and parsed across hierarchy, turns → forming in-session knowledge and context → the later retrieval of these can be more sufficient and token-saving (not having to delegate for the-same research of stacks or static slices of codebase domains’ investigation)
    - smarter and more accurate planning → validating → implementation  by fast-retrieval of previous waves’ implementation context + devs’ notes → retrospectives; pitfalls, patterns, and anti-patterns  are prepared → integration as incremental gatekeeping also makes the development more robust.
    
3. With the development of `code-intel` (make use and utilize the library for code-level reading and writing tools. those that are akin to https://github.com/yamadashy/repomix ) + `LSP server is enabled` in OpenCOde (https://opencode.ai/docs/lsp/) + our schematic approach + hierarchy, cross-domains relationship with metadata, date and time validation etc → the following sets of tools can be think of (Tobe honest these are one of the most game-changing developments if made possible, I have very limited knowledge and ideas toward these as concepts:
    1. Schema + hierarchical and relational of metadata awareness + innate search and patch edit tools + OpenCode LSP server on + repomix and AST knowledge, symbol knowledge + search and replace + scripts + some techniques for fast extracting, chunking, hierarchy-hoping, relational data query → can give  birth to these sets of tools (can you please help list more of them and insightfully research and validated each)
        1. handling output/or editing sections of lengthy documents and artifacts (more than 1000 lines) with precision, chunks for multiple hierarchy of sections of search and replace edit/patch. Or when out-putting lengthy xml, dot dm, yaml, documents and artifacts → frame and skeleton of meta-data, hierarchy of headings and sections are outlined while smaller manageable contents are iterated and append into sectiosn with incremental validation for improvements of coherent
        2. the same mindset and much improve when combine with others mentioned in `a` - give possibilities for:
            1. more accurate and multiple sections of files/codes reading
            2. on-demand whole-code-file consumption without missing any parts but still economically consume tokens by prioritize reading the frame/hierarchy and delve-in only sections of concerns
            3. sharding and file categorizing, re-structure of the codetree, managing exports and imports - always having these at check (with the support of `atomic git commit` and `filewatcher` (as for `code-intel` development - there will be a need for filewatching lib, but I heard that OpenCode SDK has this innate, please research and have this validated)
            4. pulling multiple-related-code-files of the same concerns - when reading, searching, or making batch editing as systematic development/debug
            5. more accurate code file editing and writing if the above are integrated accurately and tools are made superior compared to the innate)
            6. establishing JSDOC and comments of code files to gain a totality knowledge of the codebase, stack-knowledge-base with the very comprehensive structured of code files an system of within and across JsDoc and comments that coherently and cohesively flow. 
    
    ---
    
    ### 2. Hooks -( `src/hooks/`): The Autonomic Nervous System - although still keeping the old definition, lacking of classification and lacking of comprehensive concepts/entities mapping → making this section also a major pain point to address
    
    the main causes for the current chaos and misconceptions root from
    
    ```markdown
    /Users/apple/hivemind-plugin/src/hooks
    /Users/apple/hivemind-plugin/src/hooks/session_coherence
    /Users/apple/hivemind-plugin/src/hooks/session_coherence/index.ts
    /Users/apple/hivemind-plugin/src/hooks/session_coherence/main_session_start.ts
    /Users/apple/hivemind-plugin/src/hooks/session_coherence/types.ts
    /Users/apple/hivemind-plugin/src/hooks/compaction.ts
    /Users/apple/hivemind-plugin/src/hooks/event-handler.ts
    /Users/apple/hivemind-plugin/src/hooks/index.ts
    /Users/apple/hivemind-plugin/src/hooks/messages-transform.ts
    /Users/apple/hivemind-plugin/src/hooks/sdk-context.ts
    /Users/apple/hivemind-plugin/src/hooks/session-lifecycle-helpers.ts
    /Users/apple/hivemind-plugin/src/hooks/session-lifecycle.ts
    /Users/apple/hivemind-plugin/src/hooks/soft-governance.ts
    /Users/apple/hivemind-plugin/src/hooks/swarm-executor.ts
    /Users/apple/hivemind-plugin/src/hooks/tool-gate.ts
    ```
    
    - **COMMANDS Section** - `/Users/apple/hivemind-plugin/commands`
    
    ```markdown
    > tree
    .
    ├── hivefiver-architect.md
    ├── hivefiver-audit.md
    ├── hivefiver-build.md
    ├── hivefiver-deploy.md
    ├── hivefiver-doctor.md
    ├── hivefiver-gsd-bridge.md
    ├── hivefiver-init.md
    ├── hivefiver-intake.md
    ├── hivefiver-ralph-bridge.md
    ├── hivefiver-research.md
    ├── hivefiver-skillforge.md
    ├── hivefiver-spec.md
    ├── hivefiver-specforge.md
    ├── hivefiver-start.md
    ├── hivefiver-tutor.md
    ├── hivefiver-validate.md
    ├── hivefiver-workflow.md
    ├── hivefiver.md
    ├── hivemind-clarify.md
    ├── hivemind-compact.md
    ├── hivemind-context.md
    ├── hivemind-dashboard.md
    ├── hivemind-debug-trigger.md
    ├── hivemind-debug-verify.md
    ├── hivemind-delegate.md
    ├── hivemind-lint.md
    ├── hivemind-pre-stop.md
    ├── hivemind-scan.md
    ├── hivemind-status.md
    └── hiveminder-orchestrate.md
    
    1 directory, 30 files
     ~/hivemind-plugin/commands  dev-v3 >3 *12 !2  
    
    ```
    
    - **SKILLS** Section - `/Users/apple/hivemind-plugin/skills`

```markdown
tree
.
├── context-first-gatekeeping
│   └── SKILL.md
├── context-integrity
│   └── SKILL.md
├── debug-orchestration
│   └── SKILL.md
├── delegation-intelligence
│   └── SKILL.md
├── evidence-discipline
│   └── SKILL.md
├── hivefiver-bilingual-tutor
│   ├── references
│   │   └── terminology-en-vi.md
│   ├── scripts
│   │   └── select-language.sh
│   ├── SKILL.md
│   └── templates
│       └── bilingual-output.md
├── hivefiver-domain-pack-router
│   ├── references
│   │   └── domain-pack-matrix.md
│   ├── SKILL.md
│   └── templates
│       └── domain-pack-output.md
├── hivefiver-gsd-compat
│   ├── references
│   │   └── gsd-lifecycle-map.md
│   ├── scripts
│   │   └── generate-map-template.sh
│   ├── SKILL.md
│   └── templates
│       └── gsd-bridge-output.md
├── hivefiver-mcp-research-loop
│   ├── references
│   │   └── provider-matrix.md
│   ├── scripts
│   │   ├── check-mcp-readiness.mjs
│   │   └── score-confidence.sh
│   ├── SKILL.md
│   └── templates
│       └── evidence-table.md
├── hivefiver-persona-routing
│   ├── references
│   │   └── persona-matrix.md
│   ├── scripts
│   │   └── score-persona.sh
│   ├── SKILL.md
│   └── templates
│       └── intake-questionnaire.md
├── hivefiver-ralph-tasking
│   ├── references
│   │   └── prd-json-rules.md
│   ├── scripts
│   │   ├── todo-to-prd-json.mjs
│   │   └── validate-prd-json.mjs
│   ├── SKILL.md
│   └── templates
│       └── prd-json-flat.md
├── hivefiver-skill-auditor
│   ├── references
│   │   ├── audit-checklist.md
│   │   └── skill-source-links.md
│   ├── scripts
│   │   └── audit-skill-coverage.sh
│   ├── SKILL.md
│   └── templates
│       └── skill-audit-report.md
├── hivefiver-spec-distillation
│   ├── references
│   │   └── ambiguity-taxonomy.md
│   ├── scripts
│   │   └── extract-requirements.sh
│   ├── SKILL.md
│   └── templates
│       └── spec-candidate.md
├── hivemind-architect-strategist
│   └── SKILL.md
├── hivemind-governance
│   └── SKILL.md
├── parallel-debugging-hivemind
│   └── SKILL.md
├── sequential-orchestration
│   └── SKILL.md
├── session-lifecycle
│   └── SKILL.md
└── systematic-debugging-hivemind
    └── SKILL.md

43 directories, 45 files
```

- **WORKFLOWS - REFERENCES - TEMPLATES - PROMPTS  (this section is the worst - Use Repomix MCP to download both GSD and BMAD frameworks to learn how they structure and build these into a system and ecosystem of intricate combinations of use-cases, handling and supporting the other concepts by giving standards, instructions, guidelines, specific by-step cases etc** https://github.com/gsd-build/get-shit-done  **;** https://github.com/bmad-code-org/BMAD-METHOD

```markdown
/Users/apple/hivemind-plugin/prompts
/Users/apple/hivemind-plugin/references
/Users/apple/hivemind-plugin/prompts/hivemind-brownfield-remediation.md
/Users/apple/hivemind-plugin/references/domain-boundaries.md
/Users/apple/hivemind-plugin/references/hivemind-brownfield-checklist.md
/Users/apple/hivemind-plugin/workflows
/Users/apple/hivemind-plugin/workflows/hivefiver-enterprise-architect.yaml
/Users/apple/hivemind-plugin/workflows/hivefiver-enterprise.yaml
/Users/apple/hivemind-plugin/workflows/hivefiver-floppy-engineer.yaml
/Users/apple/hivemind-plugin/workflows/hivefiver-mcp-fallback.yaml
/Users/apple/hivemind-plugin/workflows/hivefiver-vibecoder.yaml
/Users/apple/hivemind-plugin/workflows/hivemind-brownfield-bootstrap.yaml
/Users/apple/hivemind-plugin/workflows/sequential-delegation-workflow.yaml
/Users/apple/hivemind-plugin/templates
/Users/apple/hivemind-plugin/templates/hivemind-brownfield-session.md
/Users/apple/hivemind-plugin/templates/opencode-config-template.json
/Users/apple/hivemind-plugin/templates/opencode-profiles.md
```

## Hooks need more improvements + classifications → to prevent overlapping ; crash; conflict and must work with the rest of the other concepts

these hooks can gradually and incrementally refactored but these following should be prioritized (and do together-with because they define schema, is pretty much frequent, relational, and can improve context integrity much significantly) - the most straight-forward and direct research is to ask (in-depth and specifically) questions to Deepwiki MCP with this Git Repo https://github.com/anomalyco/opencode about the SDK, plugins etc.

### Auto New Session - since we are refactoring to task-based with structure and hierarchy of planning’s documents and artifacts as SOT with many other changes , the `code-intel` and the pivoting to have our own “framework” → if possible when matching set of tasks (and subtasks) + its controlled planning → auto creation of session per `phase-planning` with `trajectory` , and in-session hierarchy of tasks, delegations, flow of context - can be more easily managed, parsed and grouped, remarking with meta-data and markup contents

When executing auto-new session →it is more like `compact`   + hierarchy mapping and context + Auto session naming , tags, creation of relational + hierarchy → the process should be smooth and unnoticeable by users and maintaining the workflow and continuity of the context though the following defensive mechanisms should be enabled:

- Do not start `auto-new-session` when context is reach 80% - because it may conflict with the innate `auto compact`
- Do not execute it when there are still child de delegation tasks
- context-integrity and validation of the whole session, its related entities, file changes (code files, documents, and artifacts) → should all be packed and validated → export a comprehensive, valuable schematic session-based context - that support the context integrity and smart-context approach

### Improvement of innate `compact` - instead of replacing the whole → append with more `context-doctor` and `navigation`, `mapping`, `files and artifacts changes`, `file structure updates`, `turn-anchoring` as “add-in” appended content below the innate context →

- Reduce the auto-compact threshold to 85% of the context - following the above mechanisms as defend
- `auto-compact` can only make 3 per session → at any cost, the 4th will be the `auto-new-session` regardlessly to prevent context loss

### The others which have already mentioned in `/Users/apple/hivemind-plugin/docs/planning-draft` - I will input the section down here

```markdown
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
```

## TOBE CONTINUED
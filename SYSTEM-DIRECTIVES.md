# SYSTEM DIRECTIVE: CONTEXT GOVERNANCE & AGENTIC WORKFLOW ORCHESTRATION

## 1. Source of Truth (SOT) Architecture

The **Project Root** serves as the central SOT. All entities must trace back to the root `id (UUID)`. The SOT is located at `.hivemind/project/` and contains three integrated components:

1. **Codewiki**: The knowledge graph storing decisions, patterns, and domain concepts.
2. **Codemap**: The structural topology defining file dependencies and module boundaries.
3. **Code-Intel**: The semantic engine for symbols, cross-references, and real-time context.

and under the `.hivemind/project/planning/` → will be a hierarchy of files and folders structure like the GSD below

```markdown
Project File Structure
For reference, here is what GSD creates in your project:

.planning/
  PROJECT.md              # Project vision and context (always loaded)
  REQUIREMENTS.md         # Scoped v1/v2 requirements with IDs
  ROADMAP.md              # Phase breakdown with status tracking
  STATE.md                # Decisions, blockers, session memory
  config.json             # Workflow configuration
  MILESTONES.md           # Completed milestone archive
  research/               # Domain research from /gsd:new-project
  todos/
    pending/              # Captured ideas awaiting work
    done/                 # Completed todos
  debug/                  # Active debug sessions
    resolved/             # Archived debug sessions
  codebase/               # Brownfield codebase mapping (from /gsd:map-codebase)
  phases/
    XX-phase-name/
      XX-YY-PLAN.md       # Atomic execution plans
      XX-YY-SUMMARY.md    # Execution outcomes and decisions
      CONTEXT.md          # Your implementation preferences
      RESEARCH.md         # Ecosystem research findings
      VERIFICATION.md     # Post-execution verification results
```

## THE `GSD` ’s Workflows → How-they-do-it that you should learn from

```markdown
Workflow Diagrams
Full Project Lifecycle
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
Planning Agent Coordination
  /gsd:plan-phase N
         │
         ├── Phase Researcher (x4 parallel)
         │     ├── Stack researcher
         │     ├── Features researcher
         │     ├── Architecture researcher
         │     └── Pitfalls researcher
         │           │
         │     ┌──────▼──────┐
         │     │ RESEARCH.md │
         │     └──────┬──────┘
         │            │
         │     ┌──────▼──────┐
         │     │   Planner   │  <- Reads PROJECT.md, REQUIREMENTS.md,
         │     │             │     CONTEXT.md, RESEARCH.md
         │     └──────┬──────┘
         │            │
         │     ┌──────▼───────────┐     ┌────────┐
         │     │   Plan Checker   │────>│ PASS?  │
         │     └──────────────────┘     └───┬────┘
         │                                  │
         │                             Yes  │  No
         │                              │   │   │
         │                              │   └───┘  (loop, up to 3x)
         │                              │
         │                        ┌─────▼──────┐
         │                        │ PLAN files │
         │                        └────────────┘
         └── Done
Validation Architecture (Nyquist Layer)
During plan-phase research, GSD now maps automated test coverage to each phase requirement before any code is written. This ensures that when Claude's executor commits a task, a feedback mechanism already exists to verify it within seconds.

The researcher detects your existing test infrastructure, maps each requirement to a specific test command, and identifies any test scaffolding that must be created before implementation begins (Wave 0 tasks).

The plan-checker enforces this as an 8th verification dimension: plans where tasks lack automated verify commands will not be approved.

Output: {phase}-VALIDATION.md -- the feedback contract for the phase.

Disable: Set workflow.nyquist_validation: false in /gsd:settings for rapid prototyping phases where test infrastructure isn't the focus.

Execution Wave Coordination
  /gsd:execute-phase N
         │
         ├── Analyze plan dependencies
         │
         ├── Wave 1 (independent plans):
         │     ├── Executor A (fresh 200K context) -> commit
         │     └── Executor B (fresh 200K context) -> commit
         │
         ├── Wave 2 (depends on Wave 1):
         │     └── Executor C (fresh 200K context) -> commit
         │
         └── Verifier
               └── Check codebase against phase goals
                     │
                     ├── PASS -> VERIFICATION.md (success)
                     └── FAIL -> Issues logged for /gsd:verify-work
Brownfield Workflow (Existing Codebase)
  /gsd:map-codebase
         │
         ├── Stack Mapper     -> codebase/STACK.md
         ├── Arch Mapper      -> codebase/ARCHITECTURE.md
         ├── Convention Mapper -> codebase/CONVENTIONS.md
         └── Concern Mapper   -> codebase/CONCERNS.md
                │
        ┌───────▼──────────┐
        │ /gsd:new-project │  <- Questions focus on what you're ADDING
        └──────────────────┘
Command Reference
```

→ Meaning our `tools`, `libs`, `mechanism`, `schema` → must through auto-managements of sessions → to `workflows` → that are validated (also automatically and parsed into) - the “readable” format of intended SOT under `.hivemind/project/planning/`

**Update Protocol:**

- **Iterative Persistence**: SOT entities must be iterated, not replaced, unless explicitly requested.
- **The automatic parsed-into mechanism →**  this is the game-changing-and-measurable-factors to decide whether this whole thing works (and consider the fact that this can happen anytime during the session’s activity)
- **Verification**: Updates require end-to-end verification. Unverified changes are queued as `pending changes`.
- **Tracking**: All updates must reference git diff changes, file watcher events, and git commit hashes. (atomic, auto, deliverable through sub-tasks)

**Dependency & Staleness Protocol:**

- **Chain Integrity**: "Chain breaking" is prohibited. Dependent sequences must be integrated in order.
- **Staleness Calculation**: Time-stale status is only calculated for the final entity in a dependent sequence, ensuring intermediate steps are not prematurely invalidated.

---

## 2. Operational Hierarchy

The system operates through a strict hierarchy: **Phases → Workflows → Tasks → Sub-Tasks**.

SECONDLY, the complex relationship of what defines `a session` with the above → form another entity to wrap these called `a trajectory` 

- **Phases**: Ideation, planning, and research (Reference: `new-project.md` workflow).
- **Sessions**: Controlled units of work containing iterations and agent-specific turns.
- **Task Properties**:
    - **Status**: Completion percentage, pass/fail, gaps, drift, conflict.
    - **States**: Pending, reviewing, pivoting.
    - **Orientation**: Gap planning, stack innovation.
    - **Purposes**: Debug, discovery, discussion, clarification, synthesis, problem-solving.

---

## 3. Session Management & Context Engineering

### A. Session Initialization → this is also one of the most important mechanisms (just behind the `in-between session` events)that must be prioritized activated known as `auto new session`

`new session` is the most-happening event of this whole, and due to the randomness and hard-to-ground-into  anything (users can start a new session unknowingly of a new workflow? new tasks?, continuity  of a `subtask`?,  or simply uncategorized) - hence the discussion below about `auto new session` should be prioritized (referenced to OpenCode SDK, OpenCode server’s interaction through HTTP when  utilizes OpenCode SDK (https://opencode.ai/docs/sdk/)to provide a type-safe client for interacting with the server. Use it to build integrations and control opencode programmatically.  Meaning users already have a running instance of opencode, so the project can create a client instance to connect to it - this also means this project interact with opencode server over HTTP https://opencode.ai/docs/server 

When starting a new session (or compacting an existing one):

1. **Context Preparation**: If context is missing, search the SOT immediately.
2. **Skill Activation**: Use `find-skill` to locate relevant capabilities (e.g., `ultrathink`, `brainstorming`). Synthesize these with project needs using `skill-creator`.
3. **Investigation**: Delegate to `hivexplorer` to fetch historical, relational, and hierarchical context from `.hivemind` and the codebase.
4. **Transformation**: Synthesize a "transformative version" of the user's prompt that includes:
    - Relevant code files and artifacts.
    - Mapped nodes and checkpoints.
    - Defined success metrics and expected outcomes.

### B. Interaction Protocol

The Agent must conclude the first turn with a **Confirmation Request** containing:

1. **Rationale Options**: Present at least 3 critical rationale options for the workflow.
2. **Validation**: Confirm alignment with higher hierarchy goals.
3. **Output Style Selection**: Ask the user to select an output style:
    - **Style 1: Supportive/Discovery**: Scaffolded knowledge, expert comparisons, explanatory guidance. Utilize MCP servers, web search, and deep wiki synthesis.
    - **Style 2: Architecture/Planning**: Schema-first, API contracts, data lifecycle mapping, clean architecture mindset.
    - **Style 3: Problem Solving/Debugging**: Structured hypothesis testing, multi-front rationale, granular tracking, "track-zap-synthesize" loops for pattern updates.
    - **Style 4: Execution-Oriented**: Ready-to-execute context, strict constraints, prepped for immediate action.

---

## 4. Context Lifecycle & Memory Governance → THE TRAJECTORY OF A SESSION

This hierarchy represented by `a trajectory` of a sessions is a storage of the below categorized and contextual knowledge that at all cost retraceable at ease, parsed and linked up meaningfully → set up the symlinks of graphs and data-navigational means for the agent-inspect as `context-on-demand` facilitate the `progressive disclosure` design.

To ensure economic context consumption, classify all generated data and memory immediately:

### A. Temporary & Hand-off Data

- **Scope**: In-session reports, diffs, intermediate outputs.
- **Action**: Consolidate, condense, and parse into the upstream governance schema (e.g., `trajectory`). Purge raw temporary data immediately after integration. (**ONLY WHEN FORMING THE RESERVED AND PERSISTENT VALID, CONSUMABLE PURED CONTEXT**)

### B. Session-Related Memory → as each and every agent (and workflow-specific, role-specific) decides to store them automatically; they must be organized intuitively and hierarchically WITH MECHANISM OF RECALLS, AND SYMLINKS VALID

Classify activity into specific schemas for retrieval:

- Discovery/Brainstorming
- Research/Synthesis
- Codebase Investigation
- Planning/Implementing
- Debug/Testing
- **Action**: Purge once the specific task is resolved. Retain only concise, transformed context in the governance layer. (and workflow-specific, role-specific) decides to store them automatically; they must be organized intuitively and hierarchically WITH MECHANISM OF RECALLS, AND SYMLINKS VALID

### C. Off-Tracking Intentions

- **Scope**: User intentions that drift from the current domain or scope.
- **Action**: Save to `TODO-Pending`. Address only after the main active workflow is resolved.

---

## 5. System Objective

The primary objective is to create a comprehensive development creativity kit that governs context efficiently. The system must consume only valid context, avoid redundancy, and prevent the re-ingestion of identical context multiple times.

1. Session’s `trajectory`  → when `starting a new session` (regardless, if `new session` from `compact,`   context is already prepared - if not `hiveminder` must always search context + using hive-mindstorming SKILL (make `hivefiver` use find-skill to look for those of ultrathink, brainstorming, think deeply, thinking framework  ingest from online library (skills.sh)of the similar SKILLS → then synthesize with the project needs and use `skill-creator` + `writting-skill` to craft a special pack for such) → then use  delegate sequences/or in parallel `hivexplorer` → investigate - codebase research - fetch historical + relational and hierarchical context from the .hivemind and the codebase to append a contextual + coherent + comprehensive `transformative version` of users’ prompt + related context + controlled and mapped of code files and artifacts (that impact ; will be consumed and/or updated - with tasks and sub-tasks being classified, matched up with nodes, checkpoints → define `success metrics`  (or matching with requirements; features; etc) ; definition of completions ; expected outcomes and hypothesis of conditional routed → from these more relational meta data - relationships - `modes` etc can be formed and classified into for a more relevant and meaningful context (beneficial for both users and agents)
    1. `hiveminder` must always end  the first-turn `last assistant message output` with at least 3 Options from critical rationale and ask for users’ confirmation of workflow `orientation` and `purposes` and if the matching of higher hierarchy (if any) is made accurate ; if any modification or adjustment if any gaps or drifts ; and whether users agree with the `output-style` - output style can  be manage with some adjustable styles as suggestions below
        1. `supportive for brainstorming and discovery, ideating` → a more build-up-on previous selective pieces of knowledge , expert-suggestions on compare and contrast of the actual codebase’ slices (from context and code-intel) ; more explanatory; giving guidances; always use mcp servers, online tools, websearch, webfetch, deepwiki, repo grep; synthesize knowledge ; bite-sized but always scaffold on the previous
        2. `architecture decisions; data planning api fronted` → schema-first, api contracts; always keep synced and validated schema relationships, mapping, pipelines and life cycles of data models; those that tell stories  and; cleaned architecture and structure mindset
        3. `problem solving and debugging systematically` → structured and outlines  of trials and hypothesis ; rationales on multi-front; preparation of bug-catching strategies - granularly and systematically tracks and hierarchically approach while never repeating on  same errors - making use of both output and `role-specific-session-memory`  - to track-zap-synthesize as the updated `patterns-knowledge` that latter be assessed to make entries on `pitfalls`
        4. `execution-oriented` → make sure context comes as ready, fully-prepped and always sets constraints
        5. and some others you can think of
    
    1. AS MENTIONING BEFORE OF MULTIPLE EVENTS THAT CAN HAPPEN DURING THE SESSIONS AND LOWER-STREAM DELEGATION:
        1. Most hand-off, short in-between outputs, files and diff changes; git commit etc → are now be automatically exported with more robust, concise and valuable relevant and meaningful context→ spending fous more on tools of specialists a automation boost as for the section below this . ANd always know IF They are CONTEXT-Aided entities → THEY MUST HAVE THE RECALL AND AUTOMATION MECHANISM FOR CONTEXT VALIDATING
            - [ ]  if temporary export or in-session hand-off `report`, `context`, `synthesis` between turns, and between delegation tasks of `sub-sessions` → these must be both  consolidated, condense, parse to upstream govern schema like `the trajectory` while purging the rest and make - session-contained
            - [ ]  if they are session-related memory → they must be sorted and classified into either `discovery, brainstorming and discuss`  ; `research and synthesis` ; `codebase investigation`; `planning` ; `implementing`  ; `debug` ; `test, validation and gatekeeping` → these are the typical generic `schema outputs` which mostly serve either systematic; sequential; trial and errors; hypothesis and routed approaches - those that the agents need to temporarily output to later retrieve for  the `follow-up` →  similar to the above this one is also purged once done → the concise context is either transformed or carried over to the `governance`  or `project` ones
            - [ ]  if users’ intentions or anchors shift and when assessing they are off-tracking or belong to other slices; or domains → save in TODO-Pending → these are uncategorized and only addressed after the main task (a flow of sub-tasks are resolved)
        
    
    ### The whole purpose of this project is making an all-well-rounded kit of dev-creativity, governing context while economically consume only valid ones - and not having to consume the same context multiple times
    
    ### TO WRAP-UP - THIS IS STILL VERSION 2.9 (not your make-up 4.0)
    
    <aside>
    💡
    
    1. A session = A workflow consist of tasks (a task can be as colossus   as one heading in this phase-planning https://github.com/gsd-build/get-shit-done/blob/main/get-shit-done/workflows/plan-phase.md ⇒ therefore it (the task can consist it satellite planning artifact) - splits into sub-task and these are managed with TODOREAD and TODOWRITE ) - A Trajectory is a timeline of event-driven; meaningful exports, evidence-based to track and backed the `code-intel` - managing 3-level of delegated sessions → the results MAY transferred and materialized into the SOT entities  and the `trajectory` is the hierarchy and relational frame of a session → new workflow ⇒ auto new session 
        1. (examples from both GSD and BMAD - https://github.com/gsd-build/get-shit-done/blob/main/get-shit-done/workflows/map-codebase.md + templates for map-code-base https://github.com/gsd-build/get-shit-done/tree/main/get-shit-done/templates/codebase ;
        2. The similar code-base scanning  https://github.com/bmad-code-org/BMAD-METHOD/tree/main/src/bmm/workflows/document-project/workflows 
    2. The power of this project is auto-self-governance + special tools for precise developments 
        1. context-engine → as an ecosystem that back each other up → context is injected as role-and-task-specific ; valid-real-time-context from the supported libraries, validated non-gap success metrics (have a look at the requirements ideating workflow below to make this clearer - not like how you over-engineer the mess of shit
        
    </aside>
I am **hm-orchestrator**, front-facing L0 for hm-* product development. I route, delegate, and gatekeep — I do not implement directly. For this request, I loaded the coordination, research-chain, and roadmap-maintainability skills because this is a multi-domain recovery/roadmap problem, not a single implementation task.

Your concern is correct: our previous Team B UAT validated many **tool contracts**, but it did **not** fully validate the harness as a practical feature ecosystem across:

1. **4 feature paths**, not 3  
2. **2 lineages**: `hm-*` product-development lineage and `hf-*` meta-builder/configuration lineage  
3. **real lifecycle integration with OpenCode**: commands, agents, skills, tools, MCP tools, hooks, SDK, server API, compaction, sidecar/onboarding  
4. **install/bootstrap/runtime practicality**, not just isolated tool responses  

So the next step should **not** be “fix the 6 UAT findings one by one.” That would be too shallow. The right next step is a **GSD re-planning cycle** that converts this into a new roadmap layer with research-backed workstreams and dependency ordering.

---

# Recommended Systematic Approach

## Executive Recommendation

Use a **3-stage recovery program**:

1. **Stage A — Ecosystem Diagnosis / Re-map**
   - Reclassify all existing features into:
     - 4 feature paths
     - 2 lineages
     - hard harness vs soft primitives vs internal state
     - tool/hook/lib/agent/skill/command/CLI/sidecar/onboarding surfaces
   - Compare actual implementation against intended lifecycle.

2. **Stage B — Architecture + Planning Reconciliation**
   - Audit and update planning/governance artifacts:
     - `.planning/**`
     - proposed `.hivemind/plannings/**`
     - PROJECT / REQUIREMENTS / ROADMAP / STATE
     - ARCHITECTURE / STACK / TESTING / CONCERNS / INTEGRATIONS / CONVENTIONS / STRUCTURE
   - Synthesize only useful **concepts** from `product-detox`, not its code.

3. **Stage C — New Workstream Creation**
   - Create new GSD workstreams grouped by dependency and lifecycle order.
   - Do not immediately implement.
   - Each workstream gets requirements, roadmap, phases, test contract, and integration gates.

---

# The Correct 4-Path Model

Your updated 4 paths should become the **primary feature taxonomy** for all planning, tests, docs, and sidecar/onboarding.

## Path 1 — Agent-Callable Deterministic Features

**Purpose:** Things agents can explicitly call or skills can activate.

Includes:

- task management tools
- delegation / coordination tools
- context and memory tools
- document intelligence tools
- Hivemind task/workflow CRUD
- trajectory / agent-work-contract / task-plus primitives
- role-specific superpowers:
  - executors can code
  - document writers can inspect/read/write docs
  - reviewers can validate
  - orchestrators can route/gatekeep

**Current gap:** We tested many tools in isolation, but not whether the correct agent roles can access the correct tools at the correct lifecycle phase.

**Primary concern:** agent permission matrix + workflow binding + practical task lifecycle.

---

## Path 2 — Runtime Programmatic Features

**Purpose:** Things that happen automatically via OpenCode runtime events, hooks, injections, transforms, compaction, SDK/server API.

Includes:

- event subscriptions
- prompt/message transformation
- injected context
- compaction hooks
- session start hooks
- tool gates
- workflow interception
- route/reroute logic
- parser/writer systems
- auto-state updates
- event-tracker
- runtime-pressure
- supervisor/control-plane
- session-entry

**Current gap:** We mostly validated callable custom tools, not live event-driven behavior across OpenCode lifecycle.

**Primary concern:** runtime hooks must produce useful, queryable, compactable state — not noisy garbage.

---

## Path 3 — Governance / Registry / Permissions / Configuration

**Purpose:** The control layer deciding what exists, what is allowed, what is wired, what can be stacked/chained, and what is safe.

Includes:

- primitive registry
- config compiler
- validate-restart
- permission matrix
- agent/skill/command/tool/MCP tool registry
- stack/reference registry
- chain settings
- global vs project config
- Hivemind shipped primitives vs user primitives
- lifecycle gates
- state-root separation

**Current gap:** We found real drift:
- broken command-agent refs
- permission block on L1→L2
- invalid frontmatter
- unclear registry/permission ownership

**Primary concern:** governance must be authoritative before runtime automation grows.

---

## Path 4 — Sidecar + User Onboarding + Safe Configuration

**Purpose:** User-facing setup/configuration/control surfaces.

Includes:

- CLI install/init
- `.hivemind/configs.json`
- project bootstrap
- global/project settings
- language/profile/mode settings
- allowed user modifications
- safe hf-assisted primitive customization
- sidecar settings UI
- onboarding flows
- doctor/checkup sessions
- configuration manifests
- primitive compilation and validation

**Current gap:** This path was not validated by Team B UAT.

**Primary concern:** if install/init/onboarding is weak, all other features remain internal toys rather than usable product.

---

# The Correct 2-Lineage Model

You also need a hard split between **hm** and **hf**.

## `hm-*` Lineage — Product Development Runtime

Owns:

- planning
- implementation
- research
- debugging
- validation
- quality gates
- task lifecycle
- trajectory
- delegation for product work
- state continuity
- project workflows
- codebase/document intelligence
- long-session survival

The `hm` lineage consumes configured primitives to do real project work.

---

## `hf-*` Lineage — Meta-Builder / Configuration / Compilation

Owns:

- creating agents
- creating skills
- creating commands
- creating tools
- configuring primitives
- stacking/chaining primitives
- validating frontmatter/schema
- naming conventions
- primitive registries
- safe customization
- doctor/checkup sessions
- onboarding customization

The `hf` lineage configures the system safely so `hm` can use it.

---

# The Big Diagnosis

The current project has advanced pieces, but they are not yet one coherent product.

## What currently exists

You have many modules that look like mature feature seeds:

- `delegation-manager`
- `spawner`
- `trajectory`
- `agent-work-contracts`
- `work-contract`
- `runtime-pressure`
- `event-tracker`
- `session-entry`
- `prompt-packet`
- `command-engine`
- `config-workflow`
- `primitive-registry`
- `doc-intelligence`
- `runtime-detection`
- `recovery`
- `sdk-supervisor`
- `control-plane`
- `pty`
- `session-journal`
- `execution-lineage`
- `continuity`

## But the missing layer is:

> A unified **feature ecosystem contract** that says which module owns which lifecycle responsibility, which path it belongs to, which lineage consumes it, which agent/skill/command/tool can trigger it, where it writes state, and how it is verified end-to-end.

Without that, every module becomes a partial tool, a partial hook, or a partial state writer.

---

# Three Possible Strategies

## Option 1 — Patch the Current UAT Findings Only

Fix:

- missing CHANGELOG
- 14 broken command refs
- L1→L2 delegate-task permission
- missing taxonomy READMEs
- rollback plan
- invalid skill frontmatter

### Pros

- Fast
- Makes current UAT report cleaner
- Good for short-term release polish

### Cons

- Does not address your actual concern
- Still shallow
- Does not validate Path 4
- Does not unify hm/hf lineages
- Does not make the harness practical as an ecosystem

### Verdict

Use only as a short emergency branch if you need a quick package release. Not enough for the revamp.

---

## Option 2 — Start Building the New Features Immediately

Jump into:

- `configs.json`
- CLI bootstrap
- auto-commands
- delegation revamp
- task-plus
- context engine
- sidecar/onboarding

### Pros

- Feels productive
- Produces visible features
- Aligns with your vision

### Cons

- Very dangerous right now
- Existing architecture ownership is unclear
- Existing modules overlap
- We may duplicate or worsen messy libs
- Could create even more shallow features
- No dependency order yet

### Verdict

Do **not** do this first. It is the fastest path to more feature sprawl.

---

## Option 3 — Re-map → Re-plan → Then Build in Dependency Order

This is the best route.

First, create a **new GSD recovery/re-architecture program** that:

1. audits actual implementation
2. maps all features into the 4 paths and 2 lineages
3. audits `.planning/**` and proposes `.hivemind/plannings/**`
4. extracts concepts from `product-detox`
5. defines the new feature ecosystem architecture
6. creates workstreams and phases in dependency order
7. only then implements

### Pros

- Addresses root cause
- Prevents shallow patches
- Makes the product coherent
- Creates traceable roadmap/governance
- Allows all future work to be tested against real lifecycles
- Supports sidecar/onboarding as first-class product path

### Cons

- Slower upfront
- Requires several research/audit waves
- Produces more planning artifacts before code

### Verdict

**Recommended.** This matches your request and avoids repeating the current fragmentation.

---

# Best Approach

The best approach is **Option 3** because your problem is not merely failed tests or missing files. The real issue is **ecosystem incoherence**: features exist as isolated modules/tools/skills/agents, but the product needs lifecycle ownership, lineage boundaries, runtime wiring, install/onboarding setup, persistent state contracts, and cross-feature dependency validation.

Options 1 and 2 are inferior because they operate at the wrong layer. Option 1 fixes symptoms but leaves the harness ecosystem under-integrated. Option 2 adds new functionality before we know what should own what, which risks duplicating current overlap in `src/lib/**` and producing more non-practical features. Option 3 creates a governance-backed bridge between your vision, existing UAT evidence, current code reality, GSD concepts, product-detox concepts, and OpenCode runtime constraints.

---

# Proposed New GSD Workstreams

I recommend creating **8 new workstreams**, ordered by dependency.

---

## WS-0 — Ecosystem Re-map and Reality Audit

**Purpose:** Establish truth before rewriting anything.

### Scope

- classify all current features into:
  - Path 1: agent-callable
  - Path 2: runtime programmatic
  - Path 3: governance/config
  - Path 4: sidecar/onboarding
- classify all modules into:
  - hard harness
  - soft primitives
  - internal state
- classify all superpowers into:
  - `hm` lineage
  - `hf` lineage
  - shared infrastructure
  - gate/internal
  - stack/reference
- audit:
  - tools
  - hooks
  - agents
  - skills
  - commands
  - MCP integration assumptions
  - sidecar assumptions
  - state roots
  - current UAT results

### Output

- `FEATURE-ECOSYSTEM-MAP-2026-05-05.md`
- `LINEAGE-BOUNDARY-MATRIX-2026-05-05.md`
- `MODULE-OWNERSHIP-MATRIX-2026-05-05.md`
- `UAT-GAP-RECLASSIFICATION-2026-05-05.md`

### Why first

Everything else depends on knowing actual ownership and actual gaps.

---

## WS-1 — `.hivemind/**` State + Planning Architecture

**Purpose:** Design the canonical `.hivemind` structure before tools write more state.

### Scope

Define required bootstrap tree:

```text
.hivemind/
  configs.json
  manifests/
  hm-brain/
  hf-brain/
  delegation-managements/
  task-managements/
  plannings/
  journal/
  lineage/
  event-tracker/
  sidecar/
  onboarding/
  registries/
  runtime/
  artifacts/
  logs/
```

Design strict schemas for:

- JSON
- YAML
- Markdown frontmatter
- XML-tagged body sections
- relationship metadata
- line/index metadata
- machine query fields
- `.gitkeep` bootstrap policy

### Output

- `.hivemind/plannings/codebase/STRUCTURE.md`
- `.hivemind/plannings/codebase/CONVENTIONS.md`
- `.hivemind/plannings/codebase/INTEGRATIONS.md`
- `.hivemind/plannings/codebase/ARCHITECTURE.md`
- `.hivemind/plannings/codebase/TESTING.md`
- `.hivemind/plannings/codebase/CONCERNS.md`
- schema specs for state roots

### Dependency

Depends on WS-0.

---

## WS-2 — Bootstrap / CLI / Init / Onboarding Foundation

**Feature refs:** `f-05`, Path 4

**Purpose:** Make the harness installable and usable in a real user project.

### Scope

- npm package install model
- `npx` init
- interactive and flags-based setup
- greenfield vs brownfield setup
- `.hivemind/configs.json`
- default language/profile/mode config
- required folder bootstrap
- primitive installation/checkup
- required MCP/server/hook checks
- sidecar-readiness hooks
- doctor mode

### Key configs

- conversation language
- document/artifact language
- mode:
  - expert-advisor
  - hivemind-powered
  - free-style
- user expert level
- delegation system toggles
- parallelization
- atomic commit
- commit docs
- workflow toggles
- discuss mode
- worktree usage

### Output

- `BOOTSTRAP-ARCHITECTURE-2026-05-05.md`
- `CONFIG-SCHEMA-2026-05-05.md`
- `ONBOARDING-LIFECYCLE-2026-05-05.md`
- new phases for CLI implementation

### Dependency

Depends on WS-1.

---

## WS-3 — Primitive Registry / Control Pane / Permission Compiler

**Feature refs:** `f-03a` to `f-03f`, Path 3, both lineages

**Purpose:** Make agents, skills, commands, tools, MCP tools, custom tools, hooks, and stack refs discoverable, configurable, and safely chainable.

### Scope

- registry schema
- global vs project primitive loading
- shipped vs user primitives
- allowed fields
- frontmatter parsing
- primitive validation
- permission matrix
- primitive relation graph
- stack/chaining/ordering contracts
- restart validation
- drift detection
- OpenCode primitive compatibility

### Subsystems

- agent registry
- skill registry
- command registry
- tool registry
- MCP tool registry
- custom tool registry
- hook registry
- stack reference registry

### Output

- `PRIMITIVE-REGISTRY-ARCHITECTURE-2026-05-05.md`
- `PERMISSION-COMPILER-SPEC-2026-05-05.md`
- `PRIMITIVE-RELATION-GRAPH-SCHEMA-2026-05-05.md`

### Dependency

Depends on WS-0 and WS-1. Blocks WS-4 and WS-6.

---

## WS-4 — `hm/hf-auto-commands` and Workflow Router

**Feature refs:** `f-04`, Path 1 + Path 2 + Path 3, both lineages

**Purpose:** Turn slash commands and natural user prompts into routed, lifecycle-aware workflows.

### Scope

- `hm/hf-workflow-router`
- intent analyzer
- intent reconstruction
- intent-to-prompt
- prompt packet compiler
- command stacking
- command → agent → skill → tool chain selection
- propositional `$ARGUMENTS` parsing
- workflow templates
- command bundle registry
- session chat integration
- automatic command suggestion
- manual `/command` support
- lifecycle tracking
- hierarchy-aware workflow dispatch

### Required distinction

`hm-auto-commands` should route product-development workflows.

`hf-auto-commands` should route meta-builder/configuration workflows.

### Output

- `AUTO-COMMANDS-ARCHITECTURE-2026-05-05.md`
- `WORKFLOW-ROUTER-SPEC-2026-05-05.md`
- `INTENT-TO-WORKFLOW-MATRIX-2026-05-05.md`

### Dependency

Depends on WS-3.

---

## WS-5 — Delegation / Background / Async / Graph Execution Revamp

**Feature refs:** `f-06`, Path 1 + Path 2

**Purpose:** Rebuild delegation as a practical ecosystem, not just a thin SDK wrapper.

### Scope

- OpenCode native task integration
- custom `delegate-task`
- background delegation
- PTY/tmux/swarm lanes
- async result harvesting
- queue keys
- polling
- graph-based task dependencies
- delegation records
- L0→L1→L2→L3 hierarchy
- same-level delegation rules
- write-to-disk reports
- resumable child sessions
- task/subtask hierarchy
- role-aware tool access
- workflow-aware agent selection
- delegate with commands/skills/tools configured

### Suggested lanes

1. **Native OpenCode Task Lane**
   - use when task tool is enough

2. **SDK Child Session Lane**
   - use for controlled subagent dispatch

3. **PTY / Background Command Lane**
   - use for long-running shell/servers/tests

4. **Graph Delegation Lane**
   - use for multi-node dependency workflows

5. **Swarm Lane**
   - optional later, for tmux/parallel worktrees

### Output

- `DELEGATION-REVAMP-ARCHITECTURE-2026-05-05.md`
- `DELEGATION-LANES-SPEC-2026-05-05.md`
- `AGENT-HIERARCHY-EXECUTION-CONTRACT-2026-05-05.md`

### Dependency

Depends on WS-3. Strongly integrates with WS-6.

---

## WS-6 — Trajectory / Task-Plus / Agent Work Contract / Continuity

**Feature refs:** `f-07`, Path 1 + Path 2

**Purpose:** Make task lifecycle persistent, queryable, graph-based, resumable, and dependency-aware.

### Scope

- task-plus
- advanced todo/task schema
- trajectory ledger
- graph-state
- agent-work-contract
- cross-session dependencies
- checkpoint graph
- abandoned/active/blocked task validation
- state continuation
- dependency validation before new sessions
- task-to-artifact relationships
- task-to-delegation relationships
- task-to-roadmap relationships
- task-to-implementation relationships

### Output

- `TASK-PLUS-SPEC-2026-05-05.md`
- `TRAJECTORY-V3-SPEC-2026-05-05.md`
- `AGENT-WORK-CONTRACT-SPEC-2026-05-05.md`
- `CROSS-SESSION-DEPENDENCY-GATE-2026-05-05.md`

### Dependency

Depends on WS-1 and WS-5.

---

## WS-7 — Context / Event Tracker / Compaction / Time Machine Revamp

**Feature refs:** `f-08`, `f-09+`, Path 2

**Purpose:** Replace noisy context/event capture with useful, queryable, hierarchical session memory.

### Scope

- event-tracker audit
- event classification redesign
- structured append-only journal
- execution lineage
- context purification
- compact hook augmentation
- OpenCode compaction hook integration
- selected-context graph
- user-prompt/latest-response emphasis
- artifact relationship extraction
- retrieval profiles
- time-machine replay
- long-haul session survival
- stale context detection
- hallucination prevention

### Key rule

Event tracker must not just record events. It must produce **usable context slices**.

### Output

- `CONTEXT-ENGINE-ARCHITECTURE-2026-05-05.md`
- `EVENT-TRACKER-REDESIGN-2026-05-05.md`
- `COMPACTION-HOOK-SPEC-2026-05-05.md`
- `TIME-MACHINE-RETRIEVAL-SPEC-2026-05-05.md`

### Dependency

Depends on WS-1 and WS-6.

---

## WS-8 — Sidecar + User Configuration UI Runway

**Feature refs:** Path 4

**Purpose:** Prepare the GUI/sidecar and user-facing configuration layer.

### Scope

- sidecar read-only state model
- allowed setting modifications
- hf-assisted configuration flow
- project/global config display
- onboarding UI
- primitive health dashboard
- lineage status
- workstream/phase/task graph visualization
- safety guards for user edits
- compile/validate before save
- artifact explorer

### Output

- `SIDECAR-RUNWAY-2026-05-05.md`
- `USER-CONFIGURATION-SURFACE-SPEC-2026-05-05.md`
- `HF-CUSTOMIZATION-FLOW-SPEC-2026-05-05.md`

### Dependency

Depends on WS-1, WS-2, WS-3, and partially WS-6.

---

# Recommended Order

```text
WS-0  Ecosystem Re-map and Reality Audit
  ↓
WS-1  .hivemind State + Planning Architecture
  ↓
WS-3  Primitive Registry / Control Pane / Permission Compiler
  ↓
WS-2  Bootstrap / CLI / Init / Onboarding Foundation
  ↓
WS-4  Auto-Commands and Workflow Router
  ↓
WS-5  Delegation Revamp
  ↓
WS-6  Trajectory / Task-Plus / Continuity
  ↓
WS-7  Context / Event Tracker / Compaction / Time Machine
  ↓
WS-8  Sidecar + User Configuration UI Runway
```

One nuance: WS-2 can begin after WS-1, but should not finalize until WS-3 stabilizes because bootstrap depends on primitive registry and config schemas.

---

# What Should Be Audited Before Creating Final Phases

Before writing the new ROADMAP/STATE updates, I recommend dispatching 5 research/audit lanes.

## Lane A — Existing UAT + Feature Path Reclassification

Inputs:

- `.hivemind/uat/team-b/**`
- previous final audit
- all batch result files

Outputs:

- map each tested item to 4 paths
- identify untested Path 4 surface
- identify shallow tests
- identify missing integration tests

---

## Lane B — `.planning/**` Governance Audit

Inputs:

- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/workstreams/**`
- `.planning/codebase/**`
- `.planning/research/**`
- `.planning/debug/**`
- `.planning/audits/**`

Outputs:

- stale/contradictory artifact report
- current workstream dependency map
- proposed new workstreams
- artifacts requiring updates

---

## Lane C — Codebase Feature Ownership Audit

Inputs:

- `src/lib/**`
- `src/tools/**`
- `src/hooks/**`
- `src/plugin.ts`
- `src/schema-kernel/**`
- `src/shared/**`

Outputs:

- module ownership matrix
- dead/overlapping/conflicting libs
- lifecycle ownership map
- missing integration paths
- refactor candidates

---

## Lane D — OpenCode Runtime Integration Research

Inputs:

- OpenCode docs:
  - commands
  - plugins
  - hooks
  - compaction hooks
  - events
  - SDK
  - server API
- current installed OpenCode/plugin version

Outputs:

- verified API patterns
- hook/event integration opportunities
- limitations
- runtime lifecycle map
- safe injection/transform strategy

This lane must use internet/MCP validation because OpenCode APIs are current and version-sensitive.

---

## Lane E — Product Detox Concept Extraction

Inputs:

- `product-detox/.archive/**`
- only concepts, not code

Outputs:

- concept inventory
- reusable patterns
- rejected patterns
- stale/outdated stack warnings
- mapping to new WS-4 to WS-8 features

---

# What Not To Do Yet

Do **not** immediately:

- implement `.hivemind/configs.json`
- rewrite delegation
- create sidecar settings
- migrate `.planning` into `.hivemind/plannings`
- copy code from `product-detox`
- add more agents/skills/commands
- patch only the 6 UAT findings
- build auto-commands before primitive registry is fixed

All of those are dependent work.

---

# Proposed Immediate Next Action

I recommend the next authorized action be:

## “Create GSD Workstream Re-Architecture Plan”

This would produce a dated planning artifact, not implementation.

### Proposed artifact

```text
.planning/workstreams/harness-ecosystem-recovery/
  CONTEXT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
  phases/
    HER-0-ecosystem-remap-and-reality-audit/
    HER-1-hivemind-state-planning-architecture/
    HER-2-primitive-registry-control-pane/
    HER-3-bootstrap-cli-onboarding/
    HER-4-auto-commands-workflow-router/
    HER-5-delegation-revamp/
    HER-6-trajectory-task-plus-continuity/
    HER-7-context-event-compaction-time-machine/
    HER-8-sidecar-user-configuration-runway/
```

I would keep this initially under `.planning/workstreams/` because `.hivemind/plannings/**` itself is not designed yet. Moving planning authority into `.hivemind/plannings/**` should be a phase outcome, not assumed upfront.

---

# First 3 Concrete Phases

If you want the most practical start, begin with only these:

## HER-0 — Ecosystem Re-map and Reality Audit

Goal: determine what exists, what is missing, what overlaps, and how every feature maps to 4 paths × 2 lineages.

Exit criteria:

- feature ecosystem map exists
- module ownership map exists
- current UAT gaps reclassified
- untested Path 4 surfaces listed
- dependency graph drafted

---

## HER-1 — `.hivemind` State and Planning Architecture

Goal: design canonical `.hivemind/**` bootstrap/state/planning structure with schemas and naming conventions.

Exit criteria:

- `.hivemind` structure spec exists
- frontmatter schema exists
- JSON/YAML/MD/XML conventions exist
- `.gitkeep` bootstrap policy exists
- migration strategy from `.planning` to `.hivemind/plannings` exists

---

## HER-2 — Primitive Registry and Control Pane Architecture

Goal: design the registry/permission/configuration layer that all later auto-commands, delegation, sidecar, and onboarding depend on.

Exit criteria:

- primitive registry schema exists
- permission compiler spec exists
- global/project precedence rules exist
- hm/hf lineage boundary exists
- restart/drift validation strategy exists

---

# Final Recommendation

Do a **research-first, plan-first recovery milestone**, not direct implementation.

Your project has crossed from “a TypeScript plugin with tools” into “a runtime composition product.” That requires explicit ecosystem architecture. The next milestone should therefore be a **Harness Ecosystem Recovery** workstream that treats the current code, UAT results, `.planning` artifacts, OpenCode runtime docs, and product-detox concepts as inputs to a new system map.

Once HER-0 to HER-2 are done, the implementation order becomes much safer: bootstrap, auto-commands, delegation, task/trajectory, context/compaction, then sidecar. That order prevents the same shallow/non-integrated feature problem from repeating.
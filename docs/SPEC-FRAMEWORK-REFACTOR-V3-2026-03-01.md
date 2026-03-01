# SPEC: HiveMind Framework V3 Refactor

> **Document ID:** SPEC-FW-V3-2026-03-01  
> **Author:** hivefiver (meta-builder)  
> **Status:** DRAFT — Awaiting User Approval  
> **Branch:** `refactor/framework-v3`  
> **Worktree:** `/Users/apple/hivemind-refactor-v3`  
> **Scope:** `.opencode/**`, `.hivemind/**`, `docs/**` (framework only — NO `src/` changes)

---

## Executive Summary

This specification defines a 6-phase refactoring of the HiveMind framework layer to address:

1. **Broken delegation chains** — Current architecture supports only 2-level delegation; need 3-level
2. **Mechanical validation** — Replace blind linting with spec-driven, TDD, journey-based quality gates
3. **Context starvation** — Agents lose context mid-session; need deterministic feed/pull/fetch mechanisms
4. **TODO workflow fragility** — Need stateful, bidirectional, graph-synced TODO engine (up to 40 items)
5. **SOT artifact drift** — Documents are disconnected; need chained, triggered, searchable artifact management
6. **Missing tooling** — Need GSD-inspired CLI utilities and OpenCode SDK session manipulation
7. **Output chain gaps** — hiveminder workflow must chain: export → context purification → schematic output → SOT sync

### Research Foundation

This spec is grounded in three research reports (conducted 2026-03-01):

| Report | Source | Key Patterns Adopted |
|--------|--------|---------------------|
| GSD Framework Analysis | `gsd-build/get-shit-done` | Three-tier commands, wave execution, goal-backward verification, atomic git commits |
| OpenCode SDK Capabilities | `opencode.ai/docs/sdk/` + `/docs/server/` | Session creation, `noReply` injection, prompt hooks, structured output, parent-child sessions |
| Agent Topology Audit | Internal `.opencode/agents/` | 8 agents, 33 commands, 15 workflows, 28 skills — Level 3 gap confirmed |

---

## Phase Architecture

```
Phase 1: Foundation (Delegation + Agent Profiles)
    │
Phase 2: Tooling Engine (hivemind-tools.cjs + CLI)
    │
Phase 3: TODO Workflow Engine (Custom OpenCode Tool)
    │
Phase 4: Session Manipulation Layer (SDK Integration)
    │
Phase 5: Quality Gate Revolution (Spec-driven, TDD)
    │
Phase 6: SOT Artifact Chain + Output Pipeline
```

**Dependency Rule:** Each phase's exit gate MUST pass before the next phase starts.

---

## Phase 1: Delegation Foundation + Agent Profile Engine

### Objective
Restructure agent delegation topology from 2-level to 3-level, with programmatic agent profile generation.

### 1.1 Three-Level Delegation Model

```
Level 1: User → hiveminder (orchestrator)
    │
Level 2: hiveminder → {hivefiver, hiveplanner*, hivemaker*, hivehealer*}
    │                    (* = upgraded from terminal to delegating)
    │
Level 3: Level-2 agents → subagents
    ├── hivemaker → {hivexplorer, hiverd, hiveq}   (investigate, research, validate)
    ├── hiveplanner → {hivexplorer, hiverd}          (investigate, research)
    ├── hivehealer → {hivexplorer, hiveq}            (investigate, validate)
    └── hivefiver → {hivexplorer, hiveplanner, hiverd} (existing — unchanged)
```

### 1.2 Agent Profile Changes

| Agent | Current Mode | New Mode | Delegation Change |
|-------|-------------|----------|-------------------|
| hiveminder | primary | primary | No change (delegates to all) |
| hivefiver | all | all | No change (delegates to 3) |
| **hiveplanner** | all | all | **NEW**: Can delegate to hivexplorer, hiverd |
| **hivemaker** | all | all | **NEW**: Can delegate to hivexplorer, hiverd, hiveq |
| **hivehealer** | all | all | **NEW**: Can delegate to hivexplorer, hiveq |
| hivexplorer | subagent | subagent | Terminal (no change) |
| hiveq | all → subagent | subagent | Terminal (no change) |
| hiverd | all → subagent | subagent | Terminal (no change) |

### 1.3 Agent Profile Generator

**CLI Component** (`hivemind-tools.cjs agent scaffold`):
```bash
# Generate agent profile from template
node hivemind-tools.cjs agent scaffold \
  --name "hivereporter" \
  --mode "subagent" \
  --role "Report generation" \
  --delegates-to "none" \
  --delegated-by "hiveminder,hivemaker" \
  --scope-in ".opencode/reports/**" \
  --scope-out "src/**"
```

**Plugin Component** (runtime profile loading):
```typescript
// .opencode/plugins/agent-profile-loader.ts
// On session start: reads agent registry, validates frontmatter,
// resolves delegation permissions, injects into session context
```

### 1.4 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 1.1 | Updated agent profiles (8 files) | `.opencode/agents/*.md` + `agents/*.md` |
| 1.2 | Agent scaffold CLI command | `.opencode/bin/hivemind-tools.cjs` |
| 1.3 | Agent profile loader plugin | `.opencode/plugins/agent-profile-loader.ts` |
| 1.4 | Delegation topology diagram | `docs/diagrams/delegation-topology-v3.md` |
| 1.5 | Agent registry schema (Zod) | `src/schemas/agent-registry.ts` (exception: schema only) |

### 1.5 Exit Gate

- [ ] All 8 agent profiles validate against schema
- [ ] `hivemind-tools.cjs agent scaffold` generates valid profile
- [ ] 3-level delegation paths verified (test: hiveminder → hivemaker → hivexplorer)
- [ ] Root ↔ .opencode parity: 0 divergences
- [ ] `npm test` passes (no regressions)

---

## Phase 2: Tooling Engine — `hivemind-tools.cjs`

### Objective
Build a GSD-inspired CLI utility that replaces scattered scripts with a unified, deterministic tooling engine.

### 2.1 Architecture (Adapted from GSD)

```
hivemind-tools.cjs
├── Atomic Commands
│   ├── state load|json|update|get|patch
│   ├── agent scaffold|validate|list|diff
│   ├── session info|export|list
│   ├── hierarchy read|write|navigate
│   ├── artifact register|validate|chain
│   └── commit <message> [--scope <agent>]
│
├── Compound Commands (workflow init)
│   ├── init planning <trajectory>
│   ├── init execution <tactic>
│   ├── init investigation <query>
│   ├── init audit <scope>
│   └── init delegation <target> <packet>
│
├── Validation Suite
│   ├── verify agent-contracts
│   ├── verify delegation-chains
│   ├── verify parity
│   ├── verify sot-integrity
│   └── verify todo-sync
│
├── SOT Operations
│   ├── sot register <artifact-path>
│   ├── sot chain <from> <to>
│   ├── sot trigger <event>
│   ├── sot index [--rebuild]
│   └── sot search <query>
│
└── Frontmatter CRUD
    ├── frontmatter get <file> [--field k]
    ├── frontmatter set <file> --field k --value v
    ├── frontmatter validate <file> --schema <type>
    └── frontmatter merge <file> --data '{json}'
```

### 2.2 Key Differences from GSD's gsd-tools.cjs

| Aspect | GSD | HiveMind Adaptation |
|--------|-----|---------------------|
| State format | Markdown frontmatter | JSON (`.hivemind/state/`) + Markdown SOT |
| Phase model | Sequential phases | Relational hierarchy (trajectory → tactic → action) |
| Commit strategy | Per-plan prefix | Per-agent scope prefix |
| Init pattern | Workflow-specific | Domain-specific (planning, execution, investigation) |
| Verification | Plan-structure check | Cross-domain contract verification |

### 2.3 Non-Overlapping Script Consolidation

Scripts to consolidate into hivemind-tools.cjs:

| Current Script | Current Location | New Command |
|----------------|-----------------|-------------|
| route-stage.sh | hivefiver-mode/scripts/ | `hivemind-tools.cjs route` |
| quality-check.sh | hivefiver-coordination/scripts/ | `hivemind-tools.cjs verify quality` |
| state-update.sh | hivefiver-coordination/scripts/ | `hivemind-tools.cjs state update` |
| hivefiver-tools.sh | hivefiver-coordination/scripts/ | Merged into main CLI |
| validate-delegation.sh | hivefiver-coordination/scripts/ | `hivemind-tools.cjs verify delegation` |
| pipeline-orchestrator.sh | hivefiver-coordination/scripts/ | `hivemind-tools.cjs pipeline advance` |
| gate-check.sh | hivefiver-coordination/scripts/ | `hivemind-tools.cjs verify gate` |
| classify-intent.sh | hivefiver-mode/scripts/ | `hivemind-tools.cjs intent classify` |

**Note:** Existing bash scripts remain as fallbacks during migration. CLI wraps them initially, then replaces with native Node.js implementations.

### 2.4 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 2.1 | hivemind-tools.cjs CLI | `.opencode/bin/hivemind-tools.cjs` |
| 2.2 | State operations module | `.opencode/bin/lib/state-ops.cjs` |
| 2.3 | Agent operations module | `.opencode/bin/lib/agent-ops.cjs` |
| 2.4 | SOT operations module | `.opencode/bin/lib/sot-ops.cjs` |
| 2.5 | Frontmatter CRUD module | `.opencode/bin/lib/frontmatter.cjs` |
| 2.6 | Validation suite module | `.opencode/bin/lib/verify.cjs` |

### 2.5 Exit Gate

- [ ] `node hivemind-tools.cjs help` shows all commands
- [ ] `node hivemind-tools.cjs state json` parses STATE.md correctly
- [ ] `node hivemind-tools.cjs verify agent-contracts` catches 3+ real issues
- [ ] `node hivemind-tools.cjs verify parity` matches existing parity-check.sh output
- [ ] No functional regression in existing bash scripts

---

## Phase 3: TODO Workflow Engine

### Objective
Build a stateful, bidirectional TODO management system as a custom OpenCode tool that syncs with the graph state.

### 3.1 Architecture

```
hivemind-todo (Custom OpenCode Tool)
├── Core Operations
│   ├── todo.load(direction: "up" | "down" | "both", depth: number)
│   ├── todo.add(task, parent?, dependencies?, priority)
│   ├── todo.update(id, status, evidence?)
│   ├── todo.expand(id, subtasks[])  // Expand to detail (up to 40 items)
│   ├── todo.collapse(id)             // Collapse subtasks
│   └── todo.sync()                   // Sync with graph state
│
├── Routing Integration
│   ├── todo.route(id) → agent + command  // Which agent handles this?
│   ├── todo.sequence() → ordered list    // What order to execute?
│   └── todo.checkpoint(id, gate)         // Insert quality gate
│
├── Graph State Sync
│   ├── Maps TODO items ↔ hierarchy nodes (trajectory → tactic → action)
│   ├── Auto-creates Action nodes for new TODO items
│   ├── Updates Action status when TODO completed
│   └── Detects drift between TODO and hierarchy
│
├── Session Auto-Export
│   ├── On session compact: export TODO state
│   ├── On session end: merge TODO into hierarchy
│   └── On session start: restore TODO from hierarchy
│
└── Output Transformation
    ├── Last message → hierarchy extract
    ├── TODO state → anchored checkpoint
    └── Session summary → SOT artifact update
```

### 3.2 Tool Schema (Zod)

```typescript
const TodoItemSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  parent_id: z.string().uuid().optional(),
  dependencies: z.array(z.string().uuid()),
  assigned_agent: z.string().optional(),
  assigned_command: z.string().optional(),
  hierarchy_node_id: z.string().uuid().optional(),  // Link to graph
  evidence: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  subtask_count: z.number().default(0),
  depth: z.number().default(0),  // Nesting level
})

const TodoStateSchema = z.object({
  session_id: z.string().uuid(),
  items: z.array(TodoItemSchema).max(40),
  root_trajectory_id: z.string().uuid(),
  last_synced_at: z.string().datetime(),
  drift_score: z.number().min(0).max(100),
})
```

### 3.3 User Prompt Transformation Pipeline

```
User Input (raw prompt)
    │
    ▼
┌─────────────────────────────────┐
│  1. Parse intent from raw text  │
│     - Extract action verbs      │
│     - Identify targets          │
│     - Detect contradictions     │
│     - Resolve overlapping asks  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  2. Connect to active session   │
│     - Match against TODO items  │
│     - Identify active tactic    │
│     - Check for context drift   │
│     - Flag if off-trajectory    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. Filter & improve            │
│     - Remove confusing elements │
│     - Resolve conflicts         │
│     - Add missing context refs  │
│     - Structure as action items │
└────────────┬────────────────────┘
             │
             ▼
   Transformed Prompt
   (clean, contextual, actionable)
```

**Implementation:** `experimental.chat.messages.transform` hook + custom prompt sanitizer.

### 3.4 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 3.1 | hivemind-todo.ts tool | `src/tools/hivemind-todo.ts` |
| 3.2 | TodoStateSchema | `src/schemas/todo.ts` |
| 3.3 | Prompt transformation plugin | `.opencode/plugins/prompt-transformer.ts` |
| 3.4 | Graph-TODO sync engine | `src/lib/todo-graph-sync.ts` |
| 3.5 | Session auto-export hook | `src/hooks/todo-session-sync.ts` |

### 3.5 Exit Gate

- [ ] `hivemind_todo load --direction both` returns structured TODO
- [ ] Adding TODO item creates corresponding hierarchy Action node
- [ ] Completing TODO item updates hierarchy status
- [ ] TODO survives session compaction (state persisted)
- [ ] Prompt transformer removes contradictions from test input
- [ ] Max 40 items enforced (error on overflow)

---

## Phase 4: Session Manipulation Layer

### Objective
Leverage OpenCode SDK for programmatic session control, enabling HiveMind to create, inject, monitor, and export sessions.

### 4.1 Capability Matrix (from SDK Research)

| Capability | SDK Support | Implementation |
|------------|------------|----------------|
| Session creation with metadata | Title + parentID | JSON-in-title for tags |
| Silent context injection | `noReply: true` | Direct use |
| Prompt interception | `chat.messages.transform` | Plugin hook |
| Tool denial/redirection | `tool.execute.before` | Plugin hook |
| Sub-session hierarchy | `parentID` + `children()` | Direct use |
| Structured output | `format: json_schema` | Direct use |
| Health monitoring | SSE event aggregation | Custom aggregator |
| TODO manipulation | `todowrite` tool | Custom tool wrapping |

### 4.2 Session Factory

```typescript
// .opencode/plugins/session-factory.ts
interface HiveMindSession {
  // Creation
  create(opts: {
    title: string;
    trajectory_id: string;
    agent: string;
    tags: string[];
    parent_session_id?: string;
    permissions: PermissionRuleset;
  }): Promise<Session>;

  // Context injection
  inject(session_id: string, context: string): Promise<void>;  // noReply

  // Structured prompt
  prompt(session_id: string, message: string, format?: JsonSchema): Promise<any>;

  // Monitor
  subscribe(session_id: string, events: EventType[]): AsyncIterable<Event>;

  // Export
  export(session_id: string, format: "json" | "markdown" | "hierarchy"): Promise<string>;

  // Lifecycle
  compact(session_id: string, summary: string): Promise<void>;
  abort(session_id: string): Promise<void>;
}
```

### 4.3 Event Intervention Points

```
Session Lifecycle
    │
    ├── session.created → Register in .hivemind/sessions/registry.json
    │                      Inject declare_intent context
    │
    ├── chat.message → Transform prompt (sanitize, connect context)
    │                   Update TODO based on intent
    │
    ├── tool.execute.before → Enforce sector boundaries
    │                          Validate CQRS contracts
    │                          Block out-of-scope edits
    │
    ├── tool.execute.after → Auto-commit if task completed
    │                         Update hierarchy Action status
    │                         Trigger SOT artifact sync
    │
    ├── session.compacting → Inject HiveMind state into compaction
    │                         Export TODO state
    │                         Preserve trajectory context
    │
    ├── todo.updated → Sync with graph hierarchy
    │                   Update routing table
    │                   Check for HARD STOP
    │
    └── session.idle/error → Log to .hivemind/sessions/
                              Trigger error recovery if applicable
```

### 4.4 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 4.1 | Session factory plugin | `.opencode/plugins/session-factory.ts` |
| 4.2 | Context injection hook | `.opencode/plugins/context-injector.ts` |
| 4.3 | Tool governance hook | `.opencode/plugins/tool-governance.ts` |
| 4.4 | Session registry schema | `src/schemas/session-registry.ts` |
| 4.5 | Compaction enhancer hook | `.opencode/plugins/compaction-enhancer.ts` |

### 4.5 Exit Gate

- [ ] `session.create()` with tags encoded in title works
- [ ] `noReply: true` injection adds context without response
- [ ] `chat.messages.transform` hook modifies prompts
- [ ] `tool.execute.before` hook blocks out-of-scope edits
- [ ] Session hierarchy (parent → child) traversable via SDK
- [ ] Structured output with JSON schema returns valid data

---

## Phase 5: Quality Gate Revolution

### Objective
Replace mechanical linting with multi-dimensional quality gates that cover spec-driven, TDD, journey-based, and edge-case validation.

### 5.1 Quality Dimensions (Beyond Linting)

| Dimension | Current State | Target State |
|-----------|--------------|--------------|
| **Syntax** | Markdown lint, frontmatter check | Zod schema validation per asset type |
| **Contracts** | Basic field presence | Full contract graph verification |
| **Behavior** | None | Scenario testing (journey-based) |
| **Integration** | None | Cross-domain chain verification |
| **Regression** | `npm test` | Incremental regression per asset change |
| **Specification** | None | Acceptance criteria auto-derived from spec |
| **Edge Cases** | None | Boundary condition testing per asset |

### 5.2 Verification Pipeline (GSD-Inspired)

```
Asset Change
    │
    ▼
┌──────────────────────────────┐
│ Gate 1: Schema Validation    │  ← Zod schema per asset type
│   - Frontmatter complete?    │
│   - Fields match schema?     │
│   - Cross-references valid?  │
└──────────┬───────────────────┘
           │ PASS
           ▼
┌──────────────────────────────┐
│ Gate 2: Contract Integrity   │  ← Goal-backward verification
│   - must_haves satisfied?    │
│   - Delegation chains valid? │
│   - Parity maintained?       │
└──────────┬───────────────────┘
           │ PASS
           ▼
┌──────────────────────────────┐
│ Gate 3: Journey Validation   │  ← E2E scenario testing
│   - User intent → outcome    │
│   - Agent routing correct?   │
│   - Checkpoint types right?  │
└──────────┬───────────────────┘
           │ PASS
           ▼
┌──────────────────────────────┐
│ Gate 4: Regression Check     │  ← Incremental regression
│   - Existing tests pass?     │
│   - No broken cross-refs?    │
│   - Blast radius acceptable? │
└──────────┬───────────────────┘
           │ PASS
           ▼
        APPROVED
```

### 5.3 Must-Haves System (Adapted from GSD)

Every plan/spec must include:

```yaml
must_haves:
  truths:
    - "All 8 agent profiles validate against AgentSchema"
    - "hivemaker can delegate to hivexplorer (verified via test)"
  artifacts:
    - path: ".opencode/agents/hivemaker.md"
      provides: "Level 3 delegation capability"
      contains: "hivexplorer: allow"
  key_links:
    - from: "hivemaker.md"
      to: "hivexplorer.md"
      via: "task delegation"
```

### 5.4 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 5.1 | Zod schemas for all asset types | `src/schemas/assets/` |
| 5.2 | Goal-backward verifier | `.opencode/bin/lib/goal-backward.cjs` |
| 5.3 | Journey test framework | `.opencode/bin/lib/journey-test.cjs` |
| 5.4 | Regression detector | `.opencode/bin/lib/regression.cjs` |
| 5.5 | Updated quality-check.sh (or replacement) | `.opencode/bin/hivemind-tools.cjs verify` |

### 5.5 Exit Gate

- [ ] `verify agent-contracts` uses Zod, not regex
- [ ] `verify delegation-chains` traces 3-level paths
- [ ] `verify journey "user says build me an agent"` returns routing trace
- [ ] `verify regression` detects breaking cross-reference
- [ ] All existing verification tests still pass

---

## Phase 6: SOT Artifact Chain + Output Pipeline

### Objective
Create a chained, triggered, searchable artifact management system with end-to-end output pipeline.

### 6.1 SOT Artifact Registry

```
.hivemind/sot/
├── registry.json        # Master index of all SOT artifacts
├── chains.json          # Dependency chains between artifacts
├── triggers.json        # Event → artifact update triggers
└── index/
    ├── by-domain.json   # Artifacts grouped by domain
    ├── by-agent.json    # Artifacts grouped by owner agent
    └── by-freshness.json # Artifacts ordered by last update
```

### 6.2 Artifact Chain Model

```
docs/OPENCODE-ARCHITECTURE-NARRATIVE.md
    │
    ├── chains to → docs/OPENCODE-CONCEPTS-ADVANCED.md
    │                   │
    │                   └── chains to → docs/OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md
    │
    ├── chains to → docs/OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md
    │
    └── chains to → docs/OPENCODE-PRIMARY-COORDINATOR-AGENT.md

Trigger: When ARCHITECTURE-NARRATIVE changes → all downstream artifacts get "stale" flag
```

### 6.3 Document Searchability Engine

Transform long documents into searchable, indexed consumables:

```bash
# Index a document
node hivemind-tools.cjs sot index docs/OPENCODE-ARCHITECTURE-NARRATIVE.md

# Search across all SOT docs
node hivemind-tools.cjs sot search "delegation patterns"

# Get document hierarchy (sections, headings, cross-refs)
node hivemind-tools.cjs sot hierarchy docs/OPENCODE-ARCHITECTURE-NARRATIVE.md
```

### 6.4 End-to-End Output Pipeline

```
hiveminder workflow completion
    │
    ▼
┌─────────────────────────────┐
│ 1. Export session context    │  ← export_cycle tool
│    - Messages, decisions     │
│    - TODO final state        │
│    - Files changed           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. Context purification     │  ← Filter noise, contradictions
│    - Remove mechanical logs  │
│    - Extract key decisions   │
│    - Deduplicate findings    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. Schematic output         │  ← Structured export
│    - JSON schema format      │
│    - Hierarchy-mapped        │
│    - Cross-referenced        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. SOT sync                 │  ← Update all affected SOTs
│    - Trigger chains          │
│    - Mark stale artifacts    │
│    - Update registry         │
│    - Rebuild search index    │
└─────────────────────────────┘
```

### 6.5 Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 6.1 | SOT registry schema | `src/schemas/sot-registry.ts` |
| 6.2 | SOT chain engine | `.opencode/bin/lib/sot-chain.cjs` |
| 6.3 | SOT search/index engine | `.opencode/bin/lib/sot-search.cjs` |
| 6.4 | Output pipeline engine | `.opencode/bin/lib/output-pipeline.cjs` |
| 6.5 | Context purification module | `.opencode/bin/lib/context-purifier.cjs` |
| 6.6 | SOT trigger hook | `.opencode/plugins/sot-trigger.ts` |

### 6.6 Exit Gate

- [ ] `sot register` adds document to registry
- [ ] `sot chain` creates dependency link
- [ ] `sot trigger` on doc change marks downstream as stale
- [ ] `sot search "delegation"` returns ranked results across all docs
- [ ] End-to-end pipeline: session export → purification → schematic → SOT update works

---

## Cross-Cutting Concerns

### Atomic Git Commits (GSD Pattern Adopted)

| Event | Commit? | Format |
|-------|---------|--------|
| Agent profile updated | YES | `feat(agents): update hivemaker with Level 3 delegation` |
| Tool created | YES | `feat(tools): add hivemind-todo stateful workflow tool` |
| CLI command added | YES | `feat(cli): add sot search command to hivemind-tools` |
| Plugin hook added | YES | `feat(plugins): add prompt-transformer hook` |
| Phase gate passed | YES | `docs(phase-N): exit gate evidence for Phase N` |
| WIP checkpoint | NO | Checkpoint only (no commit) |

### Context Engineering Standards

1. **Path passing, not content embedding** — All commands pass `@.hivemind/state/brain.json` not file content
2. **Fresh context per subagent** — Level 3 delegates get clean 200K token budgets
3. **Progressive disclosure** — L0→L3 skill loading, never dump everything
4. **Context budget awareness** — Target 50% usage at phase completion

### Checkpoint Taxonomy (Adopted from GSD)

| Type | Frequency | Purpose |
|------|-----------|---------|
| `human-verify` | 90% | User confirms automated work |
| `decision` | 9% | User makes implementation choice |
| `human-action` | 1% | Unavoidable manual step |

---

## Execution Plan

### Phase Sequencing

| Phase | Estimated Sessions | Depends On | Parallel With |
|-------|-------------------|------------|---------------|
| Phase 1 | 2-3 sessions | None | — |
| Phase 2 | 3-4 sessions | Phase 1 | — |
| Phase 3 | 2-3 sessions | Phase 2 | — |
| Phase 4 | 3-4 sessions | Phase 2 | Phase 3 (partial) |
| Phase 5 | 2-3 sessions | Phase 2, 3 | Phase 4 (partial) |
| Phase 6 | 3-4 sessions | Phase 3, 4, 5 | — |

**Total Estimated:** 15-21 sessions across 6 phases

### Per-Session Protocol

1. Start in worktree: `/Users/apple/hivemind-refactor-v3`
2. Load skills: `hivefiver-mode` + `hivefiver-coordination`
3. Read STATE.md for current position
4. Execute phase tasks with evidence collection
5. Atomic git commit per completed deliverable
6. Update STATE.md with progress
7. Exit gate verification before claiming phase complete

### Risk Registry

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Phase 3 TODO tool touches `src/tools/` | High | Medium | Isolate schema changes, maintain test coverage |
| Plugin hooks don't fire for subagents | Confirmed (Bug #5894) | High | Use permission-based enforcement for child sessions |
| SOT index grows too large | Medium | Low | Lazy indexing, bounded search depth |
| Context budget overrun in multi-phase sessions | High | High | Self-delegate with checkpoints per phase |
| GSD patterns don't translate to HiveMind's relational model | Medium | Medium | Adapt patterns, don't copy; validate with prototype |

---

## Appendix A: Research Report Summaries

### A.1 GSD Framework — Key Patterns to Adopt

1. **Three-tier delegation**: Command → Workflow → Agent (thin orchestrator stays at 10-15% context)
2. **Wave-based parallel execution**: Pre-computed `wave` field for deterministic parallelization
3. **Goal-backward verification**: `must_haves` with truths, artifacts, key_links
4. **Atomic git commits per task**: Bisectable history, failure recovery
5. **Context path passing**: `@.planning/CONTEXT.md` instead of embedding content
6. **Rich CLI tooling**: `gsd-tools.cjs` with 50+ atomic + compound commands
7. **Three-checkpoint taxonomy**: human-verify (90%), decision (9%), human-action (1%)

### A.2 OpenCode SDK — Capability Summary

| Feature | Status | API |
|---------|--------|-----|
| Session creation | ✅ | `POST /session` with `title`, `parentID` |
| Silent injection | ✅ | `noReply: true` in message body |
| Prompt transform | ✅ | `experimental.chat.messages.transform` hook |
| Tool governance | ✅ | `tool.execute.before` / `tool.execute.after` |
| Structured output | ✅ | `format: { type: "json_schema" }` |
| Session hierarchy | ✅ | `parentID` + `session.children()` |
| Health monitoring | 🟡 | SSE events (no dedicated metrics API) |
| Session export | 🟡 | `session.messages()` + manual transform |
| Custom tags | ❌ | JSON-in-title workaround |

### A.3 Agent Topology — Current Gaps

1. **Level 3 delegation**: NOT supported (6 of 8 agents are terminal)
2. **Missing commands**: hivemaker, hivexplorer, hivehealer lack direct commands
3. **Utility commands**: Many lack workflow linkage
4. **Skill coverage**: 28 skills total, all have consumers

---

## Approval Checkpoint

> **DECISION REQUIRED:** This spec requires user approval before any Phase execution begins.
>
> **Options:**
> 1. **Approve as-is** — Begin Phase 1 execution in worktree
> 2. **Approve with modifications** — Specify changes, then begin
> 3. **Reject and re-scope** — Narrow scope, re-prioritize phases
> 4. **Split into smaller specs** — Create separate specs per phase
>
> **Recommended:** Option 1 or 2 — the spec is comprehensive but phases are independent enough to adjust mid-flight.

---

*Spec authored by hivefiver on 2026-03-01*
*Research: hiverd (GSD analysis, OpenCode SDK)*
*Investigation: hivexplorer (agent topology audit)*
*Confidence: HIGH — grounded in MCP-verified research*

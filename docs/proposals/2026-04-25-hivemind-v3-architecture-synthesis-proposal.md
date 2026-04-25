<!-- generated-by: gsd-doc-writer -->

# Hivemind V3 — Architecture Synthesis Proposal

**Date**: 2026-04-25
**Status**: PROPOSAL — Awaiting review before any updates to core documents
**Synthesizer**: gsd-doc-writer subagent
**Evidence Sources**: 11 research artifacts + live codebase analysis + AGENTS.md

---

## 1. Executive Summary

### What Changed

This proposal synthesizes findings from five parallel investigation tracks (architecture mapping, structure analysis, memory architecture from product-detox, skills inventory, OMO deep research, and GSD architecture research) against seven user-raised concerns about Hivemind V3's architectural direction.

**Key finding:** Hivemind's harness-experiment worktree (~10,152 LOC in `src/`) has evolved significantly beyond the original April 4 architecture proposal (`docs/draft/architecture-proposal-hivemind-v3.md`). The original proposal assumed a strict CQRS separation (tools write, hooks read), a binary soft/hard harness split, and flat runtime assumptions. Phase 16.4's architecture baseline has formally marked these assumptions as **stale** or **rejected**.

### Why It Matters

The seven concerns collectively identified that the original proposal's mental model was insufficient for:
- A harness that must serve collaborative agent-human workflows (not just autonomous execution)
- Memory architecture spanning sessions with hierarchical, categorized, queryable persistence
- A GUI/sidecar that provides safe read-model projections for users who need guidance
- A skills ecosystem covering multiple project types, languages, frameworks, and use cases

### What This Means

This proposal replaces the original architecture proposal's assumptions with evidence-backed architectural stances. It does NOT prescribe implementation — it provides the philosophical foundation and validated constraints for subsequent planning phases.

---

## 2. Concern Validation Matrix

### CONCERN 1 (CQRS): Strict CQRS is Overkill for Local Single-User Context

**Evidence Found:**
- Phase 16.4 Decision Register: REG-01 formally marked global "tools write, hooks read" CQRS as **stale** (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §2)
- REG-02: "Hooks cannot mutate outputs" formally **rejected** — bounded hook mutation allowed
- Current codebase has 9 distinct mutation surfaces already operating without strict CQRS (Source: `ARCHITECTURE.md`, lines 17-19; `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §3)

**Verdict: ✅ VALIDATED** — The user's concern was correct. Strict global CQRS was over-engineered for a local, single-user harness.

**Resolved Stance:** Replace global CQRS with the **case-by-case mutation authority matrix** (9 surfaces), where every mutation surface declares its owner, persistence target, idempotency rule, and recovery behavior. This is the Phase 16.4 locked decision (D-06 through D-10).

---

### CONCERN 2 (Mutation Constraints): Global Mutation Rules Are Too Rigid

**Evidence Found:**
- Phase 16.4 established a 9-surface mutation authority matrix (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §3):
  - Tool surface → validate, call library, write state, return result
  - `tool.execute.before` → validate/block/mutate tool args
  - `tool.execute.after` → append metadata/projections
  - `messages.transform` → transform/hydrate messages
  - Event hook → observe + bounded idempotent side effects
  - Library persistence → own canonical JSON writes
  - SDK wrapper → create/query through typed wrappers
  - Fact-reporting script → read-only checks
  - Sidecar/read model → read/query/render/request only
- `tool.execute.after` already mutates tool output by injecting `_harness` metadata (Source: `ARCHITECTURE.md`, line 185-186)

**Verdict: ✅ VALIDATED** — The user's concern was correct. Per-feature mutation authority replaces global constraints.

**Resolved Stance:** Mutation authority is per-surface, not global. Each surface's mutation contract is documented in the Phase 16.4 architecture baseline. New surfaces must declare the same four properties (owner, target, idempotency, recovery).

---

### CONCERN 3 (Soft vs Hard Harness): The Distinction Was Misleading

**Evidence Found:**
- Phase 16.4 explicitly locked the correct definitions (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §5):
  - **Hard Harness** = npm package source (`src/`): plugin assembly, hooks, tools, lib, shared, schema-kernel
  - **Soft Meta-Concepts** = user-configurable (`.opencode/`): skills, agents, commands, rules, permissions
  - **Hiveminder** = built-in meta-concept/runtime-integration module (code-first, schema-defined, SDK-backed)
  - **Hivefiver** = end-user meta-builder module for OpenCode primitives
  - **Neither Hiveminder nor Hivefiver is a "soft harness"**
  - `.md` files are transition-stage artifacts toward runtime-integrated code
- Original proposal's "Half 1/Half 2" framing reinforced the misleading binary (Source: `architecture-proposal-hivemind-v3.md`, §0)
- Product-detox memory architecture shows `.md` files serve as drafting/transition artifacts, not runtime abstractions (Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §2.5, §4)

**Verdict: ✅ VALIDATED** — The user's concern was correct. The soft/hard binary obscured the real distinction.

**Resolved Stance:** The correct mental model is a **four-quadrant matrix**:

| Quadrant | What | Runtime Role |
|----------|------|--------------|
| Hard Harness (`src/`) | npm package code | Plugin lifecycle, delegation, concurrency, persistence |
| Soft Meta-Concepts (`.opencode/`) | User-configurable skills/agents/commands | Agent behavior definitions, project-specific workflows |
| Hiveminder (built-in meta) | Code-first, schema-defined, SDK-backed | Runtime integration of meta-concepts into OpenCode |
| Hivefiver (end-user meta-builder) | Meta-builder for OpenCode primitives | Enables users to author/audit/evaluate meta-concepts |

---

### CONCERN 4 (Runtime Classification): Shallow Runtime Assumptions

**Evidence Found:**
- Phase 16.4 defined 5 runtime classes with full actor/consumer/task/workflow matrix (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §4):

| Runtime Class | Triggering Surface | Actor | Consumer |
|---------------|-------------------|-------|----------|
| Session initiation | User starts/resumes | Human + coordinator | Coordinator, hooks, sidecar |
| Mid-flow intervention | User changes intent | Human/coordinator | Coordinator + active subagents |
| Post-completion | Delegation terminal state | Manager/handler/hook | Human, coordinator, future journal |
| Delegated subtask | delegate-task dispatches | Front-facing agent; child agent | Parent coordinator + status tools |
| Background command | run-background-command | Agent/tool caller | Coordinator/status tool |

- GSD research identified that runtime classification must handle actors, consumers, sessions, workflows, task types, and project types (Source: `PITFALLS.md`, Phase-Specific Warnings)
- OMO research confirmed the need for classification: IntentGate routes based on specialist/category/simple (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §3)

**Verdict: ✅ VALIDATED — PARTIALLY RESOLVED** — 5 runtime classes exist but lack sub-classification for project types, languages, and frameworks.

**Resolved Stance:** The Phase 16.4 runtime classification is the foundation. It needs extension with:
- **Project type dimension**: monorepo, single-package, library, CLI, web app, API service
- **Task type dimension**: research, planning, implementation, review, verification, deployment
- **Language/framework dimension**: auto-detected from `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.
- ⚠️ **NEEDS VALIDATION**: The exact dimension taxonomy requires user confirmation before locking.

---

### CONCERN 5 (Component Complexity): Shallow Understanding of Harness Components

**Evidence Found:**
- Complete component map exists in architecture analysis (Source: `ARCHITECTURE.md`, full document; `STRUCTURE.md`, full document)
- `src/` contains 10,152 LOC across 8 functional layers with clear dependency rules
- Max module: `delegation-manager.ts` at 510 LOC (just over 500 LOC limit)
- Schema-kernel provides Zod schemas for 8 meta-concept types (Source: `STRUCTURE.md`, §schema-kernel)
- Configuration pipeline handles compile/decompile/read/list/inspect/resume for OpenCode primitives (Source: `ARCHITECTURE.md`, §Configuration Pipeline Layer)
- Cross-cutting concerns: logging (warnings array), validation (multi-layer Zod), authentication (delegated to OpenCode host), concurrency (keyed semaphore), persistence (3 JSON files)

**Verdict: ⚠️ PARTIALLY VALIDATED** — Component understanding is now deep, but lifecycle understanding for cross-session complex tasks remains shallow.

**Resolved Stance:** The component architecture is well-understood and documented. The remaining gap is:
1. **Cross-session lifecycle**: How a complex task spanning multiple sessions with layered intents, artifacts, memory, and state flows through the system. Session journal + execution lineage bridge (selected as first-big-win in Phase 16.4, D-21/D-22) will address this.
2. **Adaptive approach**: Complex tasks need adaptive strategies (not just fixed workflows). The `hm-phase-loop` and `hm-completion-looping` skills provide the soft-meta foundation, but hard harness support for adaptive task routing is needed.
3. ⚠️ **NEEDS VALIDATION**: The relationship between the session journal bridge and the existing `continuity.ts` persistence needs deeper design before implementation.

---

### CONCERN 6 (Collaborative Agent-Human Workflows): Agents Must Adapt and Lead Users

**Evidence Found:**
- Current delegation model is fire-and-forget (WaiterModel returns delegationId immediately). No back-channel for agent-to-user guidance during execution (Source: `ARCHITECTURE.md`, §Delegation Dispatch)
- Product-detox memory architecture shows a rich collaborative model that was over-engineered (AWC with 30 files for one concept, Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §4) but the underlying need is real
- GSD's thin orchestrator pattern provides the right abstraction: orchestrator loads context, dispatches, collects results, updates state (Source: `ARCHITECTURE.md` research, Pattern 1)
- OMO's verification loop (diagnostics on subagent output, corrective iteration via task_id reuse) provides the adaptive feedback pattern (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §3, Verification Loop)
- No vector/graph memory implementation exists in either harness-experiment or product-detox (Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §8)

**Verdict: ⚠️ PARTIALLY RESOLVED** — Model defined (Phase 16.4 D-21/D-22), implementation deferred.

**Resolved Stance:** Collaborative workflows require three hard-harness capabilities that don't yet exist:

1. **Hot task tracking**: Real-time visibility into delegation progress (currently only `delegation-status` polling). Need event-driven notifications, not polling.
2. **Hierarchical agent awareness**: Agents must know their position in the delegation tree (parent/grandparent/root). Currently `state.ts` tracks `sessionToRoot` but doesn't expose hierarchy to agents.
3. **On-disk memory categorization**: 8 categories defined (Phase 16.4) but no implementation. Vector/graph memory classified as future/optional. ⚠️ **NEEDS VALIDATION**: The 8-category taxonomy needs user confirmation before implementation begins.

The soft-meta layer (`hm-coordinating-loop`, `hm-user-intent-interactive-loop`, `hm-completion-looping`) provides the behavioral patterns. The hard harness must expose the runtime primitives these skills need.

---

### CONCERN 7 (User-Centric GUI/Sidecar): Users Need Guidance and Interactive Interfaces

**Evidence Found:**
- Product-detox sidecar (Next.js 15, React 19, `@json-render/react`) was built but has three critical issues (Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §5):
  - F-01 (DISASTROUS): Dashboard spec never written to disk
  - F-02 (CRITICAL): All interactive UI non-functional (`actions:{}` empty)
  - F-03 (CRITICAL): Untyped props throughout
- Phase 16.4 locked the sidecar boundary: "Sidecar may read/query/render/request, never write canonical state" (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §2, requirement 13)
- Sidecar implementation entirely deferred (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §8, gap 8)
- OMO's tmux integration provides a lighter-weight monitoring alternative (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §2, Tmux Integration)

**Verdict: ⚠️ PARTIALLY RESOLVED** — Boundaries defined, implementation deferred. User's concern about guidance remains unaddressed.

**Resolved Stance:** The GUI/sidecar architecture follows these principles:

1. **Read-only projections**: Sidecar reads harness state files, renders them. Never writes canonical state.
2. **SSE event stream**: Real-time updates via Server-Sent Events (proven pattern from product-detox).
3. **JSON-render spec**: Dashboard UI defined as JSON spec, rendered by `@json-render/react` (proven pattern, needs the spec-actually-written-to-disk fix).
4. **Guidance layer**: This is a soft-meta concern, not hard-harness. Skills like `hm-user-intent-interactive-loop` provide guidance behavior. The sidecar displays guidance from skill output, not from hard harness logic.
5. ⚠️ **NEEDS VALIDATION**: Whether tmux-based monitoring (OMO pattern) or browser-based sidecar (product-detox pattern) is the right MVP target needs user decision.

---

## 3. Architecture Philosophy

### Hivemind's Pillars (Synthesized from Codebase + OMO + GSD Findings)

**Pillar 1: Runtime Composition, Not Static Definition**
- Hivemind wires tools + hooks into OpenCode at runtime. Zero business logic in the plugin layer.
- Evidence: `plugin.ts` (~125 LOC) is pure composition (Source: `STRUCTURE.md`, §src/)
- OMO confirms: 5-step initialization pipeline (loadConfig → createManagers → createTools → createHooks → createPluginInterface) (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §1)

**Pillar 2: Thin Orchestrator, Fat Delegation**
- Orchestrators load context, dispatch to specialists, collect results, persist state. They never implement business logic.
- Evidence: GSD's orchestrators are 100-400 line `.md` files (Source: `ARCHITECTURE.md` research, Pattern 1)
- Counter-pattern: Product-detox's `BackgroundManager` at ~22k chars in a single file (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §8, Anti-Pattern 1)

**Pillar 3: Fresh Context Per Agent**
- Every delegated agent gets an isolated context window. Orchestrators pass file paths, not content.
- Evidence: GSD's core innovation (Source: `ARCHITECTURE.md` research, Pattern 2)
- Hivemind's WaiterModel enforces this: dispatch returns immediately, child session gets fresh context (Source: `ARCHITECTURE.md`, §Delegation Dispatch)

**Pillar 4: Dual-Layer State**
- Durable JSON files for crash recovery + in-memory Maps for real-time operations.
- Evidence: `continuity.ts` (410 LOC) + `state.ts` (251 LOC) (Source: `ARCHITECTURE.md`, §State Management)
- GSD uses files only; Hivemind's dual-layer is an improvement for real-time tool operations.

**Pillar 5: Mutation Authority, Not Global CQRS**
- Every surface that mutates state declares its authority explicitly. No global write/read split.
- Evidence: Phase 16.4's 9-surface mutation authority matrix (Source: `HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md`, §3)

**Pillar 6: Script Rule — Report Facts, Leave Judgment to the Agent**
- Scripts are pure helpers (exit 0, no governance). All judgment lives in skills and tools.
- Evidence: Product-detox's 22 governance scripts caused context poisoning (Source: `architecture-proposal-hivemind-v3.md`, §2.2)

**Pillar 7: Safety Ceiling, Not Deadline**
- Delegations run until dual-signal completion confirms done. `safetyCeilingMs` is a max runtime abort, not a target.
- Evidence: `completion-detector.ts` + `sdk-delegation.ts` stability polling (Source: `ARCHITECTURE.md`, §Completion Detection)

---

## 4. Runtime Taxonomy

### Actor Classification

| Actor | Description | Triggers | Can Delegate | Has Context |
|-------|-------------|----------|-------------|-------------|
| Human User | Initiates sessions, provides intent | CLI invocation | No | Full session |
| Coordinator Agent | Front-facing orchestrator | User intent | Yes (via delegate-task) | Full session |
| Specialist Agent | Domain-specific executor | Delegation dispatch | No (leaf executor) | Fresh isolated |
| Background Process | Headless command runner | run-background-command | No | PTY/headless |
| Sidecar | Read-only UI projection | User opens browser | No | Read-only |

### Session Classification

| Session Type | Lifespan | State Persistence | Recovery |
|-------------|----------|-------------------|----------|
| Root Session | User-controlled | Full continuity record | Resume from continuity |
| Delegated Session | Until task completion | Delegation record + continuity snapshot | Recover via `recoverPending()` |
| Background Command | Until process exit | Output + exit code | No recovery (idempotent re-run) |

### Task Type Classification

| Task Type | Typical Agent | Context Need | Duration |
|-----------|--------------|-------------|----------|
| Research | gsd-researcher, hm-deep-research | High (multi-source) | Long (minutes) |
| Planning | gsd-planner, hm-planning-with-files | Medium (project context) | Medium |
| Implementation | gsd-executor, hm-test-driven-execution | High (file-focused) | Long |
| Review | gsd-code-reviewer, gsd-verifier | Medium (diff-focused) | Medium |
| Configuration | configure-primitive | Low (schema-driven) | Short |
| Verification | validate-restart | Low (scan-focused) | Short |

### Project Type Detection (⚠️ NEEDS VALIDATION)

| Project Type | Detection Signal | Harness Behavior Change |
|-------------|-----------------|----------------------|
| Monorepo | `pnpm-workspace.yaml`, lerna.json, turborepo config | Per-package scoping, workspace-aware commands |
| Single Package | `package.json` at root only | Standard delegation |
| Library | `package.json` with `main`/`exports`, no `scripts.start` | Test-focused verification |
| CLI Tool | `package.json` with `bin` field | CLI testing patterns |
| Web App | `next.config.*`, `vite.config.*` | Dev server integration |
| API Service | Express/Fastify/Hono patterns | API testing + endpoint verification |

---

## 5. Component Architecture

### How Tools, Plugins, Hooks, Engines, and Libraries Relate

```
┌─────────────────────────────────────────────────────────────┐
│  OpenCode Host Runtime                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Plugin Layer (plugin.ts — composition root)          │    │
│  │  Instantiates: Managers, Hook Factories, Tool Reg.   │    │
│  └────────┬──────────┬──────────┬──────────┬───────────┘    │
│           │          │          │          │                  │
│  ┌────────▼──┐ ┌────▼─────┐ ┌─▼────────┐ │                 │
│  │  TOOLS    │ │  HOOKS   │ │ SCHEMAS  │ │                 │
│  │ (write    │ │ (react   │ │ (validate)│ │                 │
│  │  surface) │ │  surface)│ │          │ │                 │
│  │           │ │          │ │          │ │                 │
│  │ delegate  │ │ event    │ │ agent    │ │                 │
│  │ status    │ │ session  │ │ command  │ │                 │
│  │ bg-cmd    │ │ tool-    │ │ skill    │ │                 │
│  │ config    │ │  guard   │ │ perm     │ │                 │
│  │ validate  │ │ messages │ │ mcp      │ │                 │
│  │ skim      │ │ compact  │ │ prompt   │ │                 │
│  │ analyze   │ │          │ │ tool-def │ │                 │
│  │ patch     │ │          │ │          │ │                 │
│  └─────┬─────┘ └────┬─────┘ └──────────┘ │                 │
│        │            │                      │                 │
│  ┌─────▼────────────▼──────────────────────▼───────────┐    │
│  │  MANAGER LAYER (business logic)                       │    │
│  │                                                       │    │
│  │  DelegationManager → CompletionDetector → Concurrency │    │
│  │  LifecycleManager   TaskStateManager     RuntimePolicy│    │
│  │  SessionAPI         ContinuityStore      Helpers      │    │
│  │                                                       │    │
│  │  ConfigPipeline: Compiler → Loader → Validator        │    │
│  │  Spawner: SessionCreator → DirectoryResolver          │    │
│  │  PTY: PtyManager → Buffer                             │    │
│  └───────────────────────────┬───────────────────────────┘    │
│                              │                                │
│  ┌───────────────────────────▼───────────────────────────┐    │
│  │  SHARED LAYER (leaf — no dependencies)                 │    │
│  │  tool-response.ts  tool-helpers.ts                     │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  STATE LAYER (persistence)                            │    │
│  │  session-continuity.json  delegations.json             │    │
│  │  workflows.json           in-memory Maps               │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules (Locked from AGENTS.md + Phase 16.4)

| Module | Depends On | Max LOC | Current |
|--------|-----------|---------|---------|
| `types.ts` | Nothing (leaf) | 500 | 491 |
| `helpers.ts` | `types.ts` | 300 | 257 |
| `concurrency.ts` | `types.ts` | 350 | 304 |
| `completion-detector.ts` | `types.ts` | 200 | ~150 |
| `continuity.ts` | `types.ts`, `helpers.ts` | 450 | 410 |
| `delegation-manager.ts` | Most modules | 500 | 510 ⚠️ |
| `lifecycle-manager.ts` | DelegationManager | 200 | 152 |
| `plugin.ts` | All factories | 200 | ~125 |
| `config-compiler.ts` | `types.ts`, schemas | 400 | 379 |

---

## 6. Memory Architecture

### On-Disk Memory Taxonomy (8 Categories from Phase 16.4)

| Category | Purpose | Format | Location | Status |
|----------|---------|--------|----------|--------|
| **Configuration** | Runtime attachment, lifecycle state | JSON | `.opencode/state/opencode-harness/` | Active |
| **Session State** | Per-session stats, budgets, metadata | JSON (continuity) | `session-continuity.json` | Active |
| **Delegation Records** | Dispatch/recovery/completion tracking | JSON | `delegations.json` | Active |
| **Workflow State** | Config workflow turn tracking | JSON | `workflows.json` | Active |
| **Activity/Artifacts** | Workflow execution outputs | JSON + MD | `.planning/` (GSD) | Active |
| **Session Journal** ⚠️ | Per-session event timeline | JSON | NOT YET IMPLEMENTED | First-big-win (D-21) |
| **Trajectory Ledger** ⚠️ | Cross-session trajectory tracking | JSON | NOT YET IMPLEMENTED | Deferred |
| **Task Graph** ⚠️ | Task dependency relationships | Graph JSON | NOT YET IMPLEMENTED | Future |

### Vector/Graph Memory

**Status:** Classified as future/optional. No implementation in either worktree.

**Evidence:**
- `graph/tasks.json` in product-detox is always empty (`{version: "1.0.0", tasks: []}`) (Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §8)
- No `vectorStore`, `embedding`, `similarity`, or `memory.search` patterns in `src/` (Source: `MEMORY-ARCHITECTURE-V2.9.5.md`, §8)
- Requires schemas, privacy, rebuild, and authority gates before implementation

**Recommendation:** Defer vector/graph memory to post-MVP. The session journal bridge provides immediate value without the complexity of vector search.

### Memory Hierarchy Design

```
Level 0: In-Memory Maps (state.ts)
  ↓ hydrated on startup, mutated by tools
Level 1: Durable JSON (continuity.ts)
  ↓ atomic writes, deep-clone-on-read
Level 2: Session Journal (future — first-big-win)
  ↓ append-only event timeline per session
Level 3: Activity Artifacts (.planning/)
  ↓ GSD-managed workflow outputs
Level 4: Trajectory/Graph (future)
  ↓ cross-session relationships
```

---

## 7. Collaborative Workflow Design

### Agent-Human Interaction Patterns

**Pattern A: Intent Clarification Loop** (Soft-meta)
- Skill: `hm-user-intent-interactive-loop`
- Flow: User states intent → Agent probes for clarity → User confirms → Agent dispatches
- Hard harness support needed: None (skill-driven)

**Pattern B: Delegation with Verification Loop** (Hard + Soft)
- Flow: Coordinator dispatches → Specialist executes → Completion detected → Result verified → If fail, corrective iteration via same delegation ID
- Hard harness support: WaiterModel dispatch + dual-signal completion + delegation-status polling
- Soft-meta support: `hm-completion-looping` (guardrail against premature completion claims)
- OMO reference: Verification loop with task_id reuse (Source: `OMO-ARCHITECTURE-DEEP-DIVE.md`, §3)

**Pattern C: Adaptive Escalation** (Soft-meta)
- Flow: Agent encounters blocker → Attempts resolution within bounds → If stuck, escalates to user with evidence
- Hard harness support needed: None (skill-driven)
- Soft-meta support: `hm-coordinating-loop` (handoff protocols)

**Pattern D: Background Progress Awareness** (Hard + Soft)
- Flow: Coordinator dispatches background task → Continues working → Periodically checks status → Notifies user of completion
- Hard harness support needed: Event-driven notifications (currently only polling via `delegation-status`)
- Soft-meta support: None currently

### Task Management Tools Needed

| Tool | Purpose | Status |
|------|---------|--------|
| `delegate-task` | Dispatch work to specialist | ✅ Implemented |
| `delegation-status` | Poll delegation state | ✅ Implemented |
| `run-background-command` | Execute PTY/headless commands | ✅ Implemented |
| `configure-primitive` | Manage OpenCode meta-concepts | ✅ Implemented |
| `validate-restart` | Post-restart validation | ✅ Implemented |
| Session journal tool ⚠️ | Record session events | NOT YET — first-big-win |
| Task graph tool ⚠️ | Manage task dependencies | NOT YET — future |
| Notification tool ⚠️ | Push completion alerts | NOT YET — deferred (D-23) |

---

## 8. GUI/Sidecar Architecture

### Principles (Locked from Phase 16.4)

1. **Read-only projections**: Sidecar reads state files, renders UI. Never writes canonical state.
2. **Event-driven updates**: SSE for real-time, polling fallback for non-SSE environments.
3. **JSON-render spec**: Dashboard UI defined as JSON, rendered dynamically.
4. **Separation of concerns**: Hard harness provides data, sidecar provides presentation.

### Architecture Options

**Option A: Browser-based Sidecar** (Product-detox pattern)
- Next.js 15 + React 19 + `@json-render/react`
- Pro: Rich UI, familiar stack, 36 shadcn components
- Con: F-01/F-02/F-03 critical bugs show implementation fragility, requires running a separate server

**Option B: Tmux-based Monitoring** (OMO pattern)
- Tmux panes for agent monitoring
- Pro: No browser dependency, fits terminal workflow
- Con: Limited interactivity, no GUI guidance for non-technical users

**Option C: Hybrid — Tmux MVP + Browser Post-MVP**
- MVP: Tmux for developer monitoring
- Post-MVP: Browser sidecar for user guidance

⚠️ **NEEDS VALIDATION**: User must decide which option to pursue. Recommendation: Option C (hybrid).

### Sidecar Data Sources

| Tab | Data Source | Read Path |
|-----|-----------|-----------|
| Dashboard | `workflows.json` + `session-continuity.json` | Direct file read |
| Sessions | OpenCode SDK session listing | SDK wrapper |
| Delegations | `delegations.json` | Direct file read |
| Events | SSE stream from OpenCode events | Event hook → SSE bridge |
| Configuration | `.opencode/` primitives | `primitive-loader.ts` |

---

## 9. Skills Ecosystem Assessment

### Current State Summary

| Metric | Value |
|--------|-------|
| Total hm-* skills | 25 |
| EXEMPLAR (production-ready) | 0 |
| SUBSTANTIVE (good body depth) | 11 |
| THIN (shallow but functional) | 12 |
| HOLLOW (needs rewrite) | 2 |
| Skills with eval JSON | 7 of 25 |
| Skills with scripts | 14 of 25 |
| Skills with references | 18 of 25 |
| Skills passing RICH gate | 0 (all BLOCKED or PARTIAL) |

### Skills Ready for MVP (SUBSTANTIVE tier, can ship without RICH)

These skills have sufficient body depth and integration wiring for initial use:

| Skill | Role | Why MVP-Ready |
|-------|------|---------------|
| `hm-meta-builder` | Meta-concept routing | Strong references (12), scripts, clear workflow |
| `hm-opencode-platform-reference` | Platform docs | Read-only reference, 8+ reference files |
| `hm-opencode-project-inspection` | Project state audit | Has scripts, defined scope |
| `hm-omo-reference` | OMO architecture | Read-only reference |
| `hm-spec-driven-authoring` | Spec→requirements | Rewritten v1.2.0, RICH partial |
| `hm-test-driven-execution` | TDD workflow | Rewritten v1.2.0, RICH partial |
| `hm-subagent-delegation-patterns` | Delegation patterns | Has refs, evals, scripts |

### Skills Needing Work for MVP

| Skill | Gap | Effort |
|-------|-----|--------|
| `hm-coordinating-loop` | Needs RICH third-party crawl | Medium |
| `hm-user-intent-interactive-loop` | Needs RICH crawl | Medium |
| `hm-completion-looping` | Body depth modest | Medium |
| `hm-deep-research` | Lacks eval/script packages | High |
| `hm-detective` | Lacks eval/script packages | High |
| `hm-phase-loop` | Needs evals and deeper resources | Medium |
| `hm-debug` | Needs deeper third-party evidence | Medium |
| `hm-refactor` | Has evals+refs, needs deeper evidence | Low |
| `hm-planning-with-files` | HOLLOW in current context | Medium |

### Skills Needing Complete Rewrite (HOLLOW)

| Skill | Why | Recommendation |
|-------|-----|---------------|
| `hm-agents-md-sync` | No refs, no evals, weak evidence | Full rewrite with references to drift detection patterns |
| `hm-command-parser` | No evals, audit gaps | Full rewrite with test-driven approach |

### Missing Meta Concepts for the Mesh of Matrix

**Missing Skills (not yet created):**

| Proposed Skill | Purpose | Priority |
|---------------|---------|----------|
| `hm-project-type-detector` | Auto-detect project type (monorepo, library, etc.) | P1 |
| `hm-framework-adapter` | Adapt behavior for co-existing frameworks (GSD, BMAD, Speckit) | P2 |
| `hm-session-journal` | Record and query session events for cross-session continuity | P0 (first-big-win) |
| `hm-collaborative-workflow` | Guide agent-human interaction patterns | P1 |
| `hm-memory-categorizer` | Classify and route memory to correct persistence category | P2 |

**Missing Agent Capabilities:**

| Need | Current State | Gap |
|------|--------------|-----|
| Project-type-aware routing | No detection | Need auto-classification |
| Framework-coexistence handling | `framework-detector.ts` exists | Need integration with agent routing |
| Cross-session recovery | `continuity.ts` + `recoverPending()` | Need session journal bridge |
| Adaptive task routing | Fixed agent routing | Need category-based routing |

**Missing Custom Tools:**

| Tool | Purpose | Status |
|------|---------|--------|
| Session journal recorder | Write session events to journal | NOT YET |
| Task graph manager | CRUD operations on task dependency graph | NOT YET |
| Memory category router | Route data to correct persistence category | NOT YET |
| Notification bridge | SSE bridge for sidecar events | NOT YET |

**Missing Hard Harness Components:**

| Component | Purpose | Status |
|-----------|---------|--------|
| Session journal module | Append-only event timeline | NOT YET (first-big-win) |
| Execution lineage bridge | Link sessions across context resets | NOT YET (first-big-win) |
| `.hivemind/` state root | Preferred canonical state location | NOT YET (migration needed) |
| Sidecar SSE bridge | Real-time event streaming | NOT YET (deferred) |

---

## 10. Migration Strategy

### From v2.9.4-detox Concepts to harness-experiment

**Locked approach** (Phase 16.4): Concept migration only — no code copying.

| Concept | Source (product-detox) | Target (harness-experiment) | Status |
|---------|----------------------|---------------------------|--------|
| Session journal | `.hivemind/sessions/journey-events/` | New `src/lib/session-journal.ts` | Selected first-big-win (D-21) |
| Execution lineage | `.hivemind/state/trajectory-ledger.json` | New lineage bridge in continuity | Selected first-big-win (D-22) |
| Agent-work-contract | `.hivemind/agent-work-contract/` (30 files) | Concept extraction → 3-5 files max | Requires future gate |
| Event tracker | `src/features/event-tracker/` | Concept extraction only | Deferred |
| Runtime entry | `src/features/runtime-entry/` (20 files) | Concept extraction → 5 files max | Deferred |
| `.hivemind/` state root | Full directory structure | Migration with taxonomy bridge | Needs bridge design |
| Side-car app | `apps/side-car/` (Next.js) | Concept extraction only | Requires approval gate |

### Migration Gates (from 16.4-MIGRATION-CONTROL-PLANE.md)

Every concept must pass through these gates before migration:

1. **Evidence gate**: Is there live code that uses this concept?
2. **Conflict gate**: Does it conflict with existing harness-experiment architecture?
3. **Simplification gate**: Can the concept be expressed in fewer files/LOC?
4. **Boundary gate**: Does it respect the mutation authority matrix?
5. **Test gate**: Can it be tested with runtime-truthful tests?

---

## 11. Lessons from OMO

### Adopt Directly

| Pattern | Why | Evidence |
|---------|-----|----------|
| 5-step plugin initialization pipeline | Clean composition root pattern | `src/index.ts` (OMO) mirrors Hivemind's `plugin.ts` |
| Circuit breaker with signature-based deduplication | Prevents infinite loops with stable signatures | `circuit-breaker.ts` (OMO) — sort keys for stable signatures, min threshold 5 |
| FIFO ConcurrencyManager with settled flag | Prevents double-resolve race conditions on cancel | `concurrency.ts` (OMO) — `settled: boolean` pattern |
| Two-phase spawn (reserve/commit) | Pre-check depth+budget, reserve slot, commit after spawn | `BackgroundManager` (OMO) — rollback on failure |
| Compaction context injection | Preserve agent config + todo state across compaction | `compactionContextInjector` (OMO) |
| Delegation prompt contract (6 sections) | Makes expectations explicit and verifiable | TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT |

### Adapt (Not Copy)

| Pattern | Why Adapt | How |
|---------|----------|-----|
| BackgroundManager monolith (~22k chars) | Hivemind enforces 500 LOC max | Modularize into TaskRegistry, TaskPoller, TaskNotifier, CircuitBreaker, TaskQueue |
| Ralph loop state machine | Hivemind needs per-task (not global) auto-loop | State persisted via `continuity.ts`, integrated with WaiterModel |
| 52-hook system | Hivemind needs ~10 hooks for MVP | Start with: writeGuard, bashGuard, contextInjector, compactionPreserver, completionDetector, loopDetector, modelFallback, skillLoader, notificationHandler, taskCompletionChecker |
| Skill loader with MCP embedding | Complex lifecycle, needs spike first | 4-scope priority is adoptable; MCP spin-up/cleanup needs research |

### Avoid

| Pattern | Why | What Instead |
|---------|-----|-------------|
| Single-file BackgroundManager | Violates 500 LOC rule | Modular architecture |
| File-based state in `.sisyphus/` | Hivemind uses `continuity.ts` JSON store | Keep dual-layer state |
| Bun-specific APIs | Hivemind targets Node.js >= 20 | Standard Node.js APIs |
| Hard-coded agent names | Hivemind uses config-driven definitions | Agent registry with YAML frontmatter |
| Task() blocking assumption | Hivemind uses WaiterModel async | Dual-signal completion detection |

---

## 12. Lessons from GSD

### Adopt Directly

| Pattern | Why | Evidence |
|---------|-----|----------|
| Thin orchestrator pattern | Prevents context rot at orchestration layer | Workflow files are 100-400 lines, never implement business logic |
| Fresh context per agent | Core pattern for quality preservation | Every spawned agent gets clean 200K+ window |
| Deterministic CLI layer for mechanical ops | Prevents AI-hallucinated state mutations | Hivemind's tools serve this role |
| File-based artifact chain | State flows through ordered file chain | PROJECT.md → REQUIREMENTS.md → ROADMAP.md → plans → summaries |
| Revision loop with escalation (max 3) | Quality gates without infinite blocking | Plan checker → revision → re-check → escalate at max |

### Adapt

| Pattern | Why Adapt | How |
|---------|----------|-----|
| Wave-based parallel execution | Hivemind has different concurrency model | Use `concurrency.ts` keyed semaphore with priority lanes instead of GSD's wave grouping |
| Plan verification (9 dimensions) | Over-engineered for a harness | Simplify to 3-4 dimensions: scope, dependency, risk |
| File-based state only | Hivemind needs in-memory for real-time | Keep dual-layer: durable JSON + in-memory Maps |
| Static `.md` workflows | Hivemind's workflows are TypeScript | Runtime composition via `plugin.ts` |

### What Hivemind Must Differ On

| GSD Assumption | Why It Doesn't Fit | Hivemind's Approach |
|----------------|--------------------|--------------------|
| Task() blocks | WaiterModel is fundamentally async | Dual-signal completion detection |
| All state in Markdown files | Real-time tool operations need in-memory | Dual-layer: JSON + Maps |
| Workflows are static `.md` files | Plugin-based runtime composition | TypeScript modules in `src/` |
| 14 runtime targets | OpenCode-only is correct scope | No transformation engine |
| No concurrency control | Parallel delegation requires resource management | Keyed semaphore with FIFO queue |
| No lifecycle state machine | Sessions need lifecycle tracking | `lifecycle-manager.ts` with phases |

---

## 13. Proposed REQUIREMENTS.md Updates

### Additions Needed

1. **REQ-SESSION-JOURNAL-01**: Session journal module — append-only event timeline per session, stored in `.opencode/state/opencode-harness/journal/`, queryable by session ID and event type. (First-big-win, Phase 16.4 D-21)

2. **REQ-LINEAGE-BRIDGE-01**: Execution lineage bridge — link sessions across context resets, store parent-child relationships in continuity, expose hierarchy query API. (First-big-win, Phase 16.4 D-22)

3. **REQ-MUTATION-AUTHORITY-01**: Every new mutation surface must declare owner, persistence target, idempotency rule, and recovery behavior. (Phase 16.4 locked)

4. **REQ-SCRIPT-RULE-01**: All scripts in skill packs must be pure helpers — report facts, exit 0, no governance logic, no hardcoded paths, no state mutation. (From audit, locked)

5. **REQ-SIDECAR-BOUNDARY-01**: Sidecar may read/query/render/request, never write canonical state. (Phase 16.4 locked)

### Modifications Needed

1. **CQRS references**: Replace all "tools write, hooks read" language with mutation authority matrix references.
2. **Phase 11 references**: Mark as stale per REG-04. Phase 16.4 baseline is the authority.
3. **Product-detox migration**: Replace "port" with "concept extraction through migration gates."

---

## 14. Proposed PROJECT.md Updates

### "What This Is" Update

Current text references Phase 15 as the latest. Should be updated to reflect Phase 16.4 architecture baseline completion and the current synthesis state.

### "Context" Update

Should add:
- Phase 16.4 architecture baseline locked 14 requirements and 12 decisions
- First-big-win selected: session journal + execution lineage bridge
- Seven user concerns validated, 5 fully resolved, 2 partially resolved
- Skills ecosystem: 25 hm-* skills, 0 at RICH PASS, 7 MVP-ready

### "Key Decisions" Update

Should add:
- D-21/D-22: Session journal + lineage bridge selected as first-big-win
- D-23: Delegation manifest/notification mediation paused
- REG-01 through REG-12: 12 verdicts on inherited claims

---

## 15. Implementation Priority Matrix

### Phase Priority Order

| Priority | Phase | Dependencies | Risk | LOC Estimate |
|----------|-------|-------------|------|-------------|
| P0 | Session journal + lineage bridge | None (first-big-win) | Low | ~300 |
| P0 | Mutation authority matrix formalization | None (documentation) | Low | 0 (doc only) |
| P1 | Sidecar SSE bridge | Session journal | Medium | ~200 |
| P1 | Skills RICH completion (Phase 27-30 resume) | Third-party crawl sources | Medium | 0 (soft-meta) |
| P1 | `.hivemind/` state root migration | Session journal, taxonomy bridge | High | ~400 |
| P2 | Hollow skill rewrites | None | Low | 0 (soft-meta) |
| P2 | Project type detector | None | Medium | ~150 |
| P2 | Task graph module | Session journal | High | ~300 |
| P2 | Vector/graph memory | All above | Very High | ~800 |

### Dependency Graph

```
Session Journal ─────────────────┐
   │                              │
   ├──→ Lineage Bridge            │
   │         │                    │
   │         ├──→ .hivemind/ migration
   │         │
   │         └──→ Task Graph
   │
   ├──→ Sidecar SSE Bridge
   │
   └──→ Notification Tool (D-23)

Mutation Authority Docs ──→ (independent, do anytime)

Skills RICH ──→ (independent of hard harness)

Hollow Rewrites ──→ (independent of hard harness)

Project Type Detector ──→ Framework Adapter
```

### Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Session journal design conflicts with continuity | High | Medium | Design journal as complement, not replacement |
| `.hivemind/` migration breaks existing state | High | Medium | Bridge pattern: write to both during transition |
| RICH gate remains blocked (no third-party sources) | Medium | High | Lower RICH bar for MVP, require D1-D8 only |
| Sidecar re-implements product-detox bugs | Medium | Medium | Enforce read-only boundary at tool level |
| Vector/graph memory scope creep | High | High | Explicitly defer to post-MVP |
| `delegation-manager.ts` exceeds 500 LOC further | Low | Medium | Split after session journal design locks |

---

## Evidence Citation Index

| Citation | Source File | Confidence |
|----------|-----------|------------|
| Architecture analysis | `.planning/codebase/ARCHITECTURE.md` | HIGH (live codebase analysis) |
| Structure analysis | `.planning/codebase/STRUCTURE.md` | HIGH (live codebase analysis) |
| Memory architecture v2.9.5 | `.planning/codebase/MEMORY-ARCHITECTURE-V2.9.5.md` | HIGH (product-detox source analysis) |
| Skills + architecture report | `.planning/codebase/HM-SKILLS-AND-ARCHITECTURE-REPORT-2026-04-25.md` | HIGH (Phase 16.4 + skills audit) |
| OMO deep dive | `.planning/research/OMO-ARCHITECTURE-DEEP-DIVE.md` | HIGH (source code + DeepWiki) |
| OMO summary | `.planning/research/SUMMARY.md` | HIGH |
| GSD features | `.planning/research/FEATURES.md` | HIGH (DeepWiki + repomix) |
| GSD architecture | `.planning/research/ARCHITECTURE.md` | HIGH (DeepWiki + repomix) |
| GSD pitfalls | `.planning/research/PITFALLS.md` | HIGH |
| GSD stack | `.planning/research/STACK.md` | HIGH |
| Original proposal | `docs/draft/architecture-proposal-hivemind-v3.md` | HISTORICAL (superseded by 16.4) |
| Project state | `.planning/PROJECT.md` | HIGH (current) |
| Requirements | `.planning/REQUIREMENTS.md` | HIGH (current) |
| Project rules | `AGENTS.md` | HIGH (current) |

---

## ⚠️ Items Needing Validation

The following items require user confirmation before they can be locked as architectural decisions:

1. **Runtime taxonomy dimensions** — Project type, task type, and language/framework sub-classifications
2. **Sidecar approach** — Browser-based (Option A), tmux-based (Option B), or hybrid (Option C)
3. **Session journal ↔ continuity relationship** — Complement or eventual replacement
4. **8-category memory taxonomy** — User confirmation of the categories defined in Phase 16.4
5. **RICH gate MVP threshold** — Ship with D1-D8 only, or block until RICH evidence exists
6. **`.hivemind/` state root timing** — When to begin migration from `.opencode/state/opencode-harness/`

---

*This is a PROPOSAL document. No changes to source code, REQUIREMENTS.md, or PROJECT.md should be made based on this document alone. All changes require user review and explicit approval.*

*Synthesis completed: 2026-04-25*

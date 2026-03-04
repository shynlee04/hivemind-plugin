
Here is the adapted meta-framework document, re-mapped to your HiveMind Context Governance framework's actual architecture, terminology, and design patterns:

---

# The HiveMind Context Governance: Advanced Architecture & Stacking Patterns

This is a deep-systems synthesis of HiveMind's governance primitives stacked on top of OpenCode's runtime. The entire governance layer is assembled through the `HiveMindPlugin` factory, `.hivemind/` state directory, skills, commands, and hooks — no OpenCode source modification required.

---

## I. The Foundational Schematic: Understanding the Dual-Directory Stack

HiveMind operates as a **plugin layer** on top of OpenCode's runtime. Know what you're stacking:

> **OpenCode layer** (`.opencode/` — config, agents, skills, commands, tools, plugins) **→ HiveMind layer** (`.hivemind/` — brain state, hierarchy tree, mems, anchors, sessions, config)

The `.opencode/` directory holds OpenCode primitives; the `.hivemind/` directory holds governance state. HiveMind's `init` command bridges both by registering itself in `.opencode/opencode.json` and syncing packaged assets (skills, commands, agents) into `.opencode/`. [0-cite-0](#0-cite-0) 

The `.hivemind/` directory structure is the governance state mount point: [0-cite-1](#0-cite-1) 

```
.hivemind/
├── config.json          # HiveMindConfig (governance_mode, language, automation_level)
├── state/
│   ├── brain.json       # BrainState (session, metrics, hierarchy, detection)
│   ├── hierarchy.json   # HierarchyTree (navigable decision tree)
│   ├── anchors.json     # Immutable key-value facts
│   └── tasks.json       # TaskManifest (todo.updated events)
├── memory/
│   └── mems.json        # Mems Brain (shelf-organized cross-session memories)
├── sessions/
│   ├── manifest.json    # Session registry
│   ├── active/          # Current per-session files
│   └── archive/         # Completed sessions + exports
└── logs/
    └── HiveMind.log     # Runtime logs
```

The architecture boundary is strict: `src/lib/` never imports `@opencode-ai/plugin`. Only `src/hooks/` and `src/tools/` touch the SDK. This keeps the core logic platform-portable. [0-cite-2](#0-cite-2) 

---

## II. The Hierarchy Graph: Trajectory → Tactic → Action

### 2.1 The 3-Level Hierarchy as Workflow Graph

HiveMind tracks work in a **navigable tree** with three levels, persisted as `hierarchy.json`: [0-cite-3](#0-cite-3) 

```
Trajectory (Level 1) — "Build authentication system"
  └─ Tactic (Level 2) — "Implement JWT validation"
       └─ Action (Level 3) — "Write middleware tests"
```

Each node has a `HierarchyNode` with `id`, `level`, `content`, `status`, `created`, `stamp`, and `children`. The `cursor` field tracks the agent's current focus. This is the **navigable decision tree** — not just a flat string, but a full tree with CRUD operations (`createNode`, `addChild`, `setRoot`, `moveCursor`, `markComplete`, `migrateNode`). [0-cite-4](#0-cite-4) 

### 2.2 Timestamp Stamps for Cross-Session Traceability

Node IDs use a `{level_prefix}_{MiMiHrHrDDMMYYYY}` format (e.g. `t_301411022026` = trajectory created at 14:30 on Feb 11, 2026). This makes nodes **grep-traceable** across sessions and archives. [0-cite-5](#0-cite-5) 

### 2.3 Brain State as Persistent Session Machine

The `BrainState` schema (persisted to `brain.json`) tracks session metadata, metrics, hierarchy projection, detection counters, governance counters, cycle log, and framework selection. The `StateManager` uses atomic write patterns (temp file → rename) with file locking to prevent corruption. [0-cite-6](#0-cite-6) [0-cite-7](#0-cite-7) 

---

## III. The Governance Backbone: Declare → Map → Work → Compact

### 3.1 The Canonical Workflow

Every HiveMind session follows one deterministic backbone:

```
declare_intent → map_context → [work] → compact_session
```

This is enforced through the 6 hooks + 6 canonical tools architecture. The hooks **inject governance context** every turn; the tools **mutate governance state**.

### 3.2 The HIVE-MASTER Governance Instruction

On every LLM turn, a `HIVE_MASTER_GOVERNANCE_INSTRUCTION` is **prepended** to the system prompt via `experimental.chat.system.transform`. It defines 9 strict governance rules (role discipline, context-first protocol, trust code not docs, delegation explicitness, independent validation, incremental gatekeeping, evidence before claim, user confirmation required, stop conditions). This instruction uses a deduplication marker to prevent accumulation across compactions. [0-cite-8](#0-cite-8) 

### 3.3 Governance Modes as Enforcement Tiers

| Mode | Session Start | Write Protection | Drift Warnings |
|---|---|---|---|
| `strict` | `LOCKED` | Must `declare_intent` first | Strong escalation |
| `assisted` | `OPEN` | Warnings on blind writes | Balanced guidance |
| `permissive` | `OPEN` | Silent tracking only | Minimal |

The `automation_level` field (`manual`, `guided`, `assisted`, `full`, `coach`) further modulates how aggressively governance signals are surfaced. `coach` mode forces `strict` governance and skeptical output. [0-cite-9](#0-cite-9) 

---

## IV. The 6 Hooks: The Governance Nervous System

### 4.1 Hook Firing Order Per Turn

```mermaid
flowchart LR
  A["Turn starts"] --> B["experimental.chat.system.transform\n(Session Lifecycle Hook)"]
  B --> C["experimental.chat.messages.transform\n(Messages Transform Hook)"]
  C --> D["Agent decides tool call"]
  D --> E["tool.execute.before\n(Tool Gate Hook)"]
  E --> F["Tool executes"]
  F --> G["tool.execute.after\n(Soft Governance Hook)"]
  G --> H["Turn ends"]
``` [0-cite-10](#0-cite-10) 

### 4.2 Session Lifecycle Hook (`experimental.chat.system.transform`)

Fires **every LLM turn**. Responsibilities:
- Injects `HIVE_MASTER_GOVERNANCE_INSTRUCTION` (prepend, deduplicated)
- Compiles governance signals (drift, warnings, framework conflicts, onboarding)
- Injects bootstrap context for first 2 turns
- Budget-capped at 2500 chars (4500 during bootstrap)
- Assembles `<hivemind>` XML block from prioritized sections

The `assembleSections()` function drops lowest-priority sections when budget is exceeded. [0-cite-11](#0-cite-11) [0-cite-12](#0-cite-12) 

### 4.3 Messages Transform Hook (`experimental.chat.messages.transform`)

Fires **before every LLM response**. Responsibilities:
- **First turn**: Injects session coherence context (last session archive, transformed prompt) via `prependSyntheticPart` — exclusive, no stacking with other injections
- **Every turn after first**: Injects cognitive state XML (`packCognitiveState`), anchor context (`[SYSTEM ANCHOR]`), auto-realignment reminders, and pre-stop checklist
- Uses **PREPEND** for anchor context (synthetic part, doesn't mutate user text) and **APPEND** for checklist
- Captures last 6 messages for cross-session continuity (`recent_messages` in brain state) [0-cite-13](#0-cite-13) 

### 4.4 Tool Gate Hook (`tool.execute.before`)

The advisory governance gate. **Cannot block** (HC1 compliance) — only warns. Responsibilities:
- Exempts read-only + governance tools from checks
- Framework conflict detection (`both` mode → `.planning/` and `.spec-kit/` coexist)
- Session LOCKED enforcement (advisory only in strict/assisted)
- Drift score projection and warning
- Complexity nudge (once per session)
- Uses CQRS pattern: queues state mutations, never saves directly [0-cite-14](#0-cite-14) 

### 4.5 Soft Governance Hook (`tool.execute.after`)

The **counter/detection engine**. Fires after every tool call. Does NOT transform prompts — stores signals for the session lifecycle hook to compile on the next turn.
- Increments turn count, tracks tool health
- Classifies tools into `read | write | query | governance` categories
- Tracks consecutive failures, section repetition, stuck keywords
- FileGuard: write-without-read counting
- Governance violation tracking (write in LOCKED state)
- Chain break detection, long session detection
- Auto-commit execution (when enabled)
- Session split evaluation
- Cycle intelligence: auto-captures `task` tool returns [0-cite-15](#0-cite-15) 

### 4.6 Compaction Hook (`experimental.session.compacting`)

Preserves governance state across LLM compaction boundaries. Injects into `output.context`:
- `HIVE_MASTER_GOVERNANCE_INSTRUCTION` (deduplicated)
- Purification report (if `next_compaction_report` exists in brain state)
- Session info, hierarchy tree (ASCII, capped at 20 lines), cursor ancestry
- Anchors, active tasks, metrics, Mems Brain summary
- Budget-capped at 12,000 chars [0-cite-16](#0-cite-16) 

### 4.7 Event Handler (`event`)

Subscribes to OpenCode Bus events:
- `session.created` — log
- `session.idle` — increment `user_turn_count`, staleness check, drift counter
- `session.compacted` — register compaction governance signal
- `file.edited` — track
- `session.diff` — track
- `todo.updated` — full task normalization with auto-realignment detection, queued to task manifest [0-cite-17](#0-cite-17) 

---

## V. The 6 Canonical Tools (HC5): Governance Mutation Interface

### 5.1 Tool Architecture

| Tool | Actions | Purpose |
|---|---|---|
| `hivemind_session` | start, update, close, status, resume | Session lifecycle management |
| `hivemind_inspect` | scan, deep, drift | Hierarchy inspection, drift check |
| `hivemind_memory` | save, recall, list | Mems Brain operations |
| `hivemind_anchor` | save, list, get | Immutable fact persistence |
| `hivemind_hierarchy` | prune, migrate, status | Tree management |
| `hivemind_cycle` | export, list, prune | Subagent result capture | [0-cite-18](#0-cite-18) [0-cite-19](#0-cite-19) 

### 5.2 Legacy Tool Names → Canonical Mapping

The legacy individual tools (`declare_intent`, `map_context`, `compact_session`, `scan_hierarchy`, `think_back`, `save_mem`, `recall_mems`, `save_anchor`, `hierarchy_manage`, `export_cycle`) are subsumed into the 6 canonical tools' action subcommands. [0-cite-20](#0-cite-20) 

### 5.3 Subagent Cycle Intelligence

When the `task` tool fires, the soft governance hook auto-captures its output into `cycle_log` in brain state. If the task output contains failure signals, `pending_failure_ack` is set — the agent must call `export_cycle` or `map_context(blocked)` to acknowledge. [0-cite-21](#0-cite-21) 

---

## VI. The Detection Engine: Signal Compilation & Escalation

### 6.1 Tool Classification

Every tool call is classified into `read | write | query | governance` categories via regex patterns. Unknown tools fall back to heuristics (name contains "read" → read, "write" → write, default → query). [0-cite-22](#0-cite-22) 

### 6.2 Signal Compilation

`compileSignals()` takes turn count, detection state, and optional tree metadata, and produces prioritized `DetectionSignal[]`. Up to 10 signal types are checked:

| Signal | Trigger | Suggestion |
|---|---|---|
| `turn_count` | N turns without checkpoint | `map_context` |
| `consecutive_failures` | 3+ tool failures | `think_back` |
| `section_repetition` | 4+ similar section updates | `think_back` |
| `read_write_imbalance` | 8+ reads, 0 writes | `map_context` |
| `keyword_flags` | Stuck/confused keywords detected | `think_back` |
| `tool_hierarchy_mismatch` | Writes without action declared | `map_context` |
| `completed_pileup` | 5+ completed branches | `hivemind-scan` |
| `timestamp_gap` | 2hr+ gap since last node | `scan_hierarchy` |
| `missing_tree` | No `hierarchy.json` | `hivemind-scan` |
| `session_file_long` | 50+ lines | `compact_session` |

Signals are sorted by severity and capped at 3. [0-cite-23](#0-cite-23) 

### 6.3 Escalation Tiers

`compileEscalatedSignals()` wraps base signals with escalation data: tier (`INFO → WARN → CRITICAL → DEGRADED`), evidence strings, and counter-arguments against common agent excuses. [0-cite-24](#0-cite-24) [0-cite-25](#0-cite-25) 

### 6.4 Governance Counters & IGNORED Tier

`GovernanceCounters` track 5 signal types: `out_of_order`, `drift`, `compaction`, `evidence_pressure`, `ignored`. When unacknowledged cycles exceed 10 and governance mode is non-permissive, the `IGNORED` tier activates with confrontational corrective messaging. [0-cite-26](#0-cite-26) 

---

## VII. Context Engineering: The Anti-Rot Stack

### 7.1 Compaction Hook: SOT Injection

The `createCompactionHook` reads current brain state, hierarchy tree, anchors, tasks, and mems, then injects a structured `=== HiveMind Context (post-compaction) ===` block. If `brain.next_compaction_report` exists (set by `compact_session` tool), it's injected as a **purification report** that comes first. [0-cite-27](#0-cite-27) 

### 7.2 Mems Brain: Cross-Session Persistent Memory

The `MemsState` stores memories organized by shelves: `decisions`, `patterns`, `errors`, `solutions`, `context`. Each `Mem` has `id`, `shelf`, `content`, `tags`, `session_id`, `created_at`. Mems survive compaction and session boundaries — they are the **long-term intelligence accumulator**. [0-cite-28](#0-cite-28) [0-cite-29](#0-cite-29) 

Search supports session-scoped filtering, proximity tags, time-bounded queries, and pagination. [0-cite-30](#0-cite-30) 

### 7.3 Anchors: Immutable Facts

Anchors are key-value facts that **survive everything** — compaction, session boundaries, chaos. They are injected as `<immutable-anchors>` XML blocks into context and override conflicting chat history. [0-cite-31](#0-cite-31) [0-cite-32](#0-cite-32) 

### 7.4 Cognitive Packer: Compressed State Injection

The `packCognitiveState()` function (from `src/lib/cognitive-packer.ts`) produces a compact XML representation of current governance state, injected via `messages-transform` as a synthetic prepend part every turn. [0-cite-33](#0-cite-33) 

### 7.5 Session Coherence: First-Turn Context Bridge

On the **first turn** of each session, `loadLastSessionContext()` reads from the archive and `buildTransformedPrompt()` creates a context bridge that includes last session summary, mems, anchors, and todos. This ensures the new session starts with institutional knowledge embedded. [0-cite-34](#0-cite-34) 

### 7.6 Pre-Stop Conditional Checklist

Before the agent stops, a `<system-reminder>` checklist is appended to the last user message. Items include:
- Missing action-level focus
- No `map_context` calls yet
- Pending file commits
- Pending failure acknowledgment
- Pending tasks
- Session boundary reached
- Session not persisted [0-cite-35](#0-cite-35) [0-cite-36](#0-cite-36) 

---

## VIII. The Staleness & Drift Engine

### 8.1 Timestamp Gap Detection

The hierarchy tree engine computes gaps between nodes — sibling gaps and parent-child gaps. Gaps are classified: `healthy` (<30min), `warm` (<2hr), `stale` (>2hr). `detectGaps()` returns gaps sorted by severity. [0-cite-37](#0-cite-37) 

### 8.2 Drift Score

`calculateDriftScore()` (in `brain-state.ts`) computes a 0-100 score based on turn count since last context update. Higher turns without `map_context` = lower score. When drift_score drops below 30 with 10+ user turns, drift warnings activate. [0-cite-38](#0-cite-38) 

### 8.3 Tree Pruning (Janitor)

`pruneCompleted()` replaces fully-completed branches with summaries, freeing hierarchy budget. A "completed pileup" signal fires when 5+ completed branches exist. [0-cite-39](#0-cite-39) 

---

## IX. Skills: Behavioral Governance, Prune-Protected

### 9.1 Shipped Skills

| Skill | Purpose |
|---|---|
| `hivemind-governance` | Bootstrap gate — loaded every turn, activates discipline |
| `session-lifecycle` | Teaches `declare → update → archive` workflow |
| `evidence-discipline` | Proves claims with output before concluding |
| `context-integrity` | Detects drift, repairs state, survives compaction |
| `delegation-intelligence` | Subagent patterns, parallel dispatch, `export_cycle` |

Skills are synced into `.opencode/skills/` during `init` and are **protected from OpenCode's context pruning** (`PRUNE_PROTECTED_TOOLS = ["skill"]`). This makes them the ideal vessel for governance expertise that must survive the entire session lifetime. [0-cite-40](#0-cite-40) 

### 9.2 Extended Skill Library

Beyond the 5 core governance skills, HiveMind ships domain-specific skills:

| Skill | Purpose |
|---|---|
| `hivemind-architect-strategist` | Architectural decision patterns |
| `parallel-debugging-hivemind` | Parallel debug swarm orchestration |
| `systematic-debugging-hivemind` | Systematic evidence-based debugging |
| `sequential-orchestration` | Sequential task chain patterns |
| `context-first-gatekeeping` | Pre-action context verification |
| `debug-orchestration` | Debug workflow coordination |
| `hivefiver-*` | HiveFiver ecosystem skills (tutor, research, persona routing, etc.) | [0-cite-40](#0-cite-40) 

---

## X. Commands: Deterministic Workflow Templates

### 10.1 Core Governance Commands

| Command | Purpose |
|---|---|
| `/hivemind-scan` | Brownfield reconnaissance: analyze → recommend → orchestrate |
| `/hivemind-status` | Full governance status display |
| `/hivemind-compact` | Guided session archival with pre-compact checklist | [0-cite-41](#0-cite-41) 

### 10.2 Extended Command Library

HiveMind ships 20 commands covering governance, debugging, delegation, and HiveFiver workflows:

| Command | Purpose |
|---|---|
| `/hivemind-clarify` | Ambiguity resolution |
| `/hivemind-context` | Context inspection |
| `/hivemind-delegate` | Delegation orchestration |
| `/hivemind-debug-trigger` / `/hivemind-debug-verify` | Debug workflows |
| `/hivemind-lint` | Governance lint check |
| `/hivemind-pre-stop` | Pre-stop validation gate |
| `/hiveminder-orchestrate` | Full orchestration workflow |
| `/hivefiver-*` | HiveFiver ecosystem commands (intake, research, start, tutor, doctor, etc.) | [0-cite-42](#0-cite-42) 

### 10.3 Custom Agents

HiveMind ships agent definitions synced into `.opencode/agents/`:

| Agent | Purpose |
|---|---|
| `build` | Default implementation agent (extended with governance) |
| `explore` | Read-only codebase reconnaissance |
| `scanner` | Deep codebase scanning |
| `debug` | Systematic debugging |
| `code-review` | Code review workflows |
| `hiveminder` | Governance-aware orchestrator |
| `hivemind-brownfield-orchestrator` | Brownfield project analysis |
| `hivefiver` | HiveFiver persona-routed agent | [0-cite-43](#0-cite-43) 

---

## XI. The CQRS State Mutation Pattern

### 11.1 Why CQRS

Hooks are **read-only** from OpenCode's perspective — they cannot safely save state mid-hook without risking race conditions. HiveMind uses a Command-Query-Responsibility-Segregation pattern:

- **Hooks** queue mutations via `queueStateMutation()` with `{ type, payload, source }`
- **Tool boundaries** apply pending mutations via `applyPendingStateMutations()`
- **State manager** uses file locking + atomic write (temp → backup → rename) [0-cite-44](#0-cite-44) [0-cite-45](#0-cite-45) 

### 11.2 `withState` for Atomic Read-Modify-Write

The `StateManager.withState()` method holds the file lock for the entire read-modify-write cycle, preventing concurrent mutation corruption: [0-cite-46](#0-cite-46) 

---

## XII. The Complete HiveMind Architecture Blueprint

```mermaid
graph TD
  subgraph "State Layer (.hivemind/)"
    BRAIN["brain.json\n(BrainState machine)"]
    TREE["hierarchy.json\n(HierarchyTree)"]
    MEMS["mems.json\n(Mems Brain)"]
    ANCHORS["anchors.json\n(Immutable Anchors)"]
    CFG["config.json\n(GovernanceConfig)"]
    SESSIONS["sessions/\n(archive + manifest)"]
  end

  subgraph "Hook Layer (6 hooks)"
    SL["Session Lifecycle\n(system.transform)"]
    MT["Messages Transform\n(messages.transform)"]
    TG["Tool Gate\n(tool.execute.before)"]
    SG["Soft Governance\n(tool.execute.after)"]
    CH["Compaction\n(session.compacting)"]
    EV["Event Handler\n(event)"]
  end

  subgraph "Tool Layer (6 canonical)"
    HS["hivemind_session\n(start/update/close)"]
    HI["hivemind_inspect\n(scan/deep/drift)"]
    HM["hivemind_memory\n(save/recall/list)"]
    HA["hivemind_anchor\n(save/list/get)"]
    HH["hivemind_hierarchy\n(prune/migrate)"]
    HC["hivemind_cycle\n(export/list/prune)"]
  end

  subgraph "Detection Engine (src/lib/)"
    DE["detection.ts\n(signals + escalation)"]
    HT["hierarchy-tree.ts\n(gaps + staleness)"]
    CP["cognitive-packer.ts\n(XML compression)"]
    GI["governance-instruction.ts\n(HIVE-MASTER)"]
  end

  subgraph "OpenCode Assets (.opencode/)"
    SK["Skills (18)\n(governance + domain)"]
    CMD["Commands (20)\n(slash workflows)"]
    AGT["Agents (8)\n(role definitions)"]
    WF["Workflows (6)\n(YAML orchestration)"]
  end

  SL -->|"reads"| BRAIN
  SL -->|"reads"| TREE
  SL -->|"injects"| GI
  MT -->|"reads"| BRAIN
  MT -->|"reads"| ANCHORS
  MT -->|"injects"| CP
  TG -->|"reads"| BRAIN
  SG -->|"writes"| BRAIN
  SG -->|"reads"| DE
  CH -->|"reads"| BRAIN
  CH -->|"reads"| TREE
  CH -->|"reads"| ANCHORS
  CH -->|"reads"| MEMS
  EV -->|"writes"| BRAIN

  HS -->|"mutates"| BRAIN
  HS -->|"mutates"| TREE
  HS -->|"mutates"| SESSIONS
  HI -->|"reads"| TREE
  HI -->|"reads"| HT
  HM -->|"mutates"| MEMS
  HA -->|"mutates"| ANCHORS
  HH -->|"mutates"| TREE
  HC -->|"mutates"| BRAIN
  HC -->|"mutates"| MEMS
```

### The Canonical Workflow: Declare → Explore → Map → Implement → Compact

1. **User intent** → agent calls `hivemind_session({ action: "start" })` (or legacy `declare_intent`)
2. **Brownfield scan** → `/hivemind-scan` dispat



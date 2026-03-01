# HiveFiver V2 Meta-Module — Structural Synthesis

> **Date**: 2026-03-01
> **Status**: ACTIVE — Phase 5 Runtime Enforcement synthesized
> **SOT Type**: Iterative diagnostic — modify in place, do not recreate
> **Parent Plan**: `docs/plans/hivefiver-v2-phase-plan-2026-03-01.md`

---

## Table of Contents

| Section | Anchor | Classification |
|---------|--------|----------------|
| Intent Verification | [§1](#1-intent-verification) | gate-0 |
| Planning Artifact Structure | [§2](#2-planning-artifact-structure) | architecture |
| SOT Diagnostic System | [§3](#3-sot-diagnostic-system) | architecture |
| Agent Team Design | [§4](#4-agent-team-design) | architecture |
| Compound vs Atomic Delegation | [§5](#5-compound-vs-atomic-delegation-model) | orchestration |
| Entry Point & Routing | [§6](#6-entry-point--routing-design) | orchestration |
| OpenCode Doc Structure Patterns | [§7](#7-opencode-doc-structure-patterns-learned) | knowledge |
| Execution Batch Skeleton | [§8](#8-execution-batch-skeleton) | planning |
| Grey Areas | [§9](#9-grey-areas--questions) | gate-0 |
| Runtime Enforcement Architecture | [§10](#10-runtime-enforcement-architecture) | enforcement |

---

## 1. Intent Verification

<!-- CLASSIFICATION: gate-0, intent-verification, drift-detection -->
<!-- SYNTHESIS-TAGS: user-intent, batch-cycle, context-framing -->

### What User Wants (Parsed)

| # | User Statement | Interpreted Intent |
|---|----------------|--------------------|
| 1 | "from here Goal... full of shit but I am too lazy to iterate" | Follow existing plan's leads as execution cycles. Don't rewrite the plan. |
| 2 | "Batch handling with iterations cycling these - These are not separate entities" | All knowledge pieces (OpenCode docs, GSD patterns, meta-builder module) are ONE interconnected context, not sequential tasks. |
| 3 | "Knowledge of opencode concepts - learn how these content make the long document easily consume and retrace" | Study the 7 OpenCode knowledge docs for their STRUCTURAL PATTERNS, not just content. Apply those patterns to HiveFiver artifacts. |
| 4 | "THE GSD's Workflows → How-they-do-it" | Learn GSD's planning artifact structure (`phases/`, `research/`, `todos/`, etc.) and adapt for meta-module context. |
| 5 | ".hivemind → hive-modules" | Create `.hivemind/hive-modules/hivefiver-v2/` as the planning artifact home for this meta-module. |
| 6 | "a folder called synthesis inside of are the 4 SOT diagnostic" | 4 diagnostic files: research, synthesis, mapping, matrix — iteratively modified, not recreated. |
| 7 | "Entry point only 1" | Single natural-language entry point via agent profile + optional command detection. |
| 8 | "Routing mechanism will always work from the SOT from the parent down" | Top-down routing: if user presents atomic plan → check compound parent exists first. |
| 9 | "first create your agents team" | Agent team creation is STEP ONE before any framework asset building. |
| 10 | "Gatekeeping and incremental check points" | Compound cycles (front delegation) vs Atomic cycles (2nd delegation) — two tiers of delegation. |

### Drift Check

- **Prior session** worked on Phase 0 foundation (dirs + orchestrator skill + governance-rules ref).
- **This session** user is elevating scope: establishing the meta-module planning infrastructure + agent team BEFORE continuing Phase 0 file creation.
- **Drift signal**: The plan says Phase 0 creates `.opencode/` assets. But user wants `.hivemind/hive-modules/` infrastructure + agent team FIRST. This is a **pre-Phase-0 step** that was missing from the plan.

### Verified Intent

> User wants a **meta-module planning infrastructure** under `.hivemind/hive-modules/hivefiver-v2/` that:
> 1. Uses patterns learned from OpenCode knowledge docs (rich YAML frontmatter, tables, section-level tags, progressive disclosure)
> 2. Adapts GSD's planning artifact structure (PROJECT/REQUIREMENTS/STATE/phases/research) for meta-module context
> 3. Has 4 SOT diagnostic files (research, synthesis, mapping, matrix) that are iteratively modified
> 4. Has the agent team designed and created FIRST (OpenCode `mode`, `hidden`, `permission` config)
> 5. Has compound (front) and atomic (2nd) delegation model documented
> 6. Uses single entry point with parent-down SOT routing

---

## 2. Planning Artifact Structure

<!-- CLASSIFICATION: architecture, planning-infrastructure, directory-design -->
<!-- SYNTHESIS-TAGS: gsd-adaptation, meta-module-structure, artifact-persistence -->

### GSD `.planning/` → HiveFiver `.hivemind/hive-modules/hivefiver-v2/` Mapping

| GSD Planning | HiveFiver Adaptation | Purpose |
|-------------|---------------------|---------|
| `PROJECT.md` | `CONTEXT.md` | Module vision, scope, persona, detected stack |
| `REQUIREMENTS.md` | `REQUIREMENTS.md` | Scoped requirements with IDs, acceptance criteria |
| `ROADMAP.md` | (exists in parent plan) | Phase breakdown — kept in `docs/plans/` since it's the SOTO |
| `STATE.md` | `STATE.md` | Cross-session state, decisions, blockers, health scores |
| `config.json` | (not needed — OpenCode config handles this) | — |
| `MILESTONES.md` | `MILESTONES.md` | Completed milestone archive |
| `research/` | `synthesis/RESEARCH.md` | Domain research — but as iterative SOT file, not folder of files |
| `todos/pending/` | (handled by OpenCode TODO tool) | — |
| `todos/done/` | (handled by OpenCode TODO tool) | — |
| `debug/` | (not needed for meta-builder) | — |
| `codebase/` | (existing `.hivemind/project/planning/codebase/`) | Brownfield mapping lives in project-level, not module-level |
| `phases/XX-name/` | `phases/NN-phase-name/` | Per-phase atomic planning |
| `phases/XX-YY-PLAN.md` | `phases/NN-name/PLAN.md` | Execution plan |
| `phases/XX-YY-SUMMARY.md` | `phases/NN-name/SUMMARY.md` | Outcomes and decisions |
| `phases/CONTEXT.md` | `phases/NN-name/CONTEXT.md` | Implementation preferences |
| `phases/RESEARCH.md` | `phases/NN-name/RESEARCH.md` | Phase-specific research |
| `phases/VERIFICATION.md` | `phases/NN-name/VALIDATION.md` | Verification results |
| (none) | `synthesis/` (4 SOT files) | **NEW** — iterative diagnostics |
| (none) | `agents/TEAM.md` | **NEW** — agent topology design |
| (none) | `iterations/` | **NEW** — compound cycle records |

### Proposed Directory Structure

```
.hivemind/hive-modules/hivefiver-v2/
├── CONTEXT.md                         # Module context: scope, persona, constraints
├── REQUIREMENTS.md                    # Requirements with IDs + acceptance criteria
├── STATE.md                           # Cross-session state (survives compaction)
├── MILESTONES.md                      # Completed phase archive
├── SYNTHESIS.md                       # ← THIS FILE (meta-synthesis, design decisions)
│
├── synthesis/                         # 4 SOT diagnostic files (iteratively modified)
│   ├── RESEARCH.md                   # Domain research findings + evidence chains
│   ├── MAPPING.md                    # Asset → requirement → pain point → UC mappings
│   └── MATRIX.md                     # Decision matrix + coverage + gap analysis
│
├── phases/                            # Per-phase atomic planning
│   ├── 00-foundation/
│   │   ├── PLAN.md                   # What to do + entry/exit gates
│   │   ├── VALIDATION.md            # Checkpoint evidence
│   │   └── SUMMARY.md               # Completion record
│   ├── 01-chain-build/
│   │   ├── PLAN.md
│   │   ├── RESEARCH.md              # Phase-specific research (if needed)
│   │   ├── VALIDATION.md
│   │   └── SUMMARY.md
│   ├── 02-command-layer/
│   ├── 03-cleanup/
│   ├── 04-remaining-workflows/
│   └── 05-integration-validation/
│
├── agents/                            # Agent team design artifacts
│   └── TEAM.md                       # Topology, permissions, delegation rules
│
└── iterations/                        # Compound cycle records
    └── YYYY-MM-DD-cycle-N.md         # Per-session iteration log
```

### Why This Structure

1. **Top-level files** (`CONTEXT`, `REQUIREMENTS`, `STATE`, `MILESTONES`) mirror GSD's proven per-project governance.
2. **`synthesis/`** contains the 4 SOT diagnostic files that are iteratively modified — NOT recreated each session. This is the #1 anti-rot mechanism.
3. **`phases/`** follow GSD's `XX-name/PLAN+SUMMARY+VALIDATION` pattern per phase.
4. **`agents/TEAM.md`** is new — documents the agent team topology in one place for cross-session reference.
5. **`iterations/`** logs compound cycle records so session boundaries don't lose context.
6. **`SYNTHESIS.md`** (this file) IS the module-level synthesis SOT — replaces what was `OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md` in the OpenCode doc corpus pattern.

---

## 3. SOT Diagnostic System

<!-- CLASSIFICATION: architecture, sot-diagnostics, iterative-state -->
<!-- SYNTHESIS-TAGS: research, synthesis, mapping, matrix, anti-rot -->

### The 4 SOT Files

These are **Source of Truth** diagnostic files. They are NEVER recreated from scratch — only iteratively updated. Each has a `Last Updated` timestamp and a `Change Log` section.

| File | Purpose | Update Trigger | Anti-Pattern |
|------|---------|---------------|-------------|
| `synthesis/RESEARCH.md` | Accumulated domain research findings with evidence chains. External tool outputs, MCP results, doc analysis. | After any investigation/research delegation cycle | Creating new research files instead of appending to this one |
| `synthesis/MAPPING.md` | Traceability: Asset → Requirement → Pain Point → Use Case. Also: broken reference maps, dependency graphs. | After any asset creation/modification/deletion | Mapping in ephemeral context instead of persisting here |
| `synthesis/MATRIX.md` | Decision matrix (options evaluated with criteria scores), coverage matrix (what's done, what's missing), gap analysis (identified gaps with priority). | After any decision point or milestone completion | Making decisions without recording rationale here |

### File Naming Convention

All files in `.hivemind/hive-modules/` follow these rules:

| Rule | Pattern | Example |
|------|---------|---------|
| Top-level SOT files | `UPPERCASE.md` | `STATE.md`, `REQUIREMENTS.md` |
| Directory names | `lowercase-kebab` | `synthesis/`, `phases/`, `iterations/` |
| Phase directories | `NN-kebab-name/` | `00-foundation/`, `01-chain-build/` |
| Phase files | `UPPERCASE.md` | `PLAN.md`, `VALIDATION.md`, `SUMMARY.md` |
| Iteration records | `YYYY-MM-DD-cycle-N.md` | `2026-03-01-cycle-1.md` |
| Date-stamped artifacts | `name-YYYY-MM-DD.md` | (only for versioned snapshots, not SOT files) |

### Iterative Modification Protocol

When updating any SOT file:

1. Update `Last Updated` timestamp at top
2. Append to the relevant section — DO NOT overwrite previous entries
3. If a previous entry is superseded, mark it `~~strikethrough~~` with a `[SUPERSEDED by §X]` tag
4. Add entry to `## Change Log` at bottom of file
5. Never delete content — strike through and annotate

---

## 4. Agent Team Design

<!-- CLASSIFICATION: architecture, agent-team, opencode-compliance -->
<!-- SYNTHESIS-TAGS: agent-mode, delegation-topology, permission-rules -->

### Source of Truth: OpenCode Agent Architecture

From `https://opencode.ai/docs/agents/` (fetched this session) and `docs/OPENCODE-META-BUILDER-MODULE.md`:

| Mechanism | Behavior | Impact on HiveFiver |
|-----------|----------|-------------------|
| `mode: "primary"` | User-switchable via Tab. Cannot be a delegation target. | hivefiver should NOT be primary — it's `all` (can be both) |
| `mode: "subagent"` | Only invocable via Task tool or @mention. Cannot be default. | All downstream agents (hivexplorer, hiveplanner, etc.) |
| `mode: "all"` | Can serve as both primary and subagent. Default for user-defined. | hivefiver uses this — user can switch to it OR delegate to it |
| `hidden: true` | Hidden from @autocomplete. Still invocable by Task tool. | Internal agents that shouldn't clutter user UI |
| `task_id` resumption | Pass prior `task_id` to continue same child session. | Cross-session research continuity for hiverd/hivexplorer |
| todowrite/todoread denied in subagents | Orchestrator owns the TODO list exclusively. | Only hivefiver manages TODOs |
| `task: "deny"` in child sessions by default | Prevents recursive delegation unless explicitly allowed. | Subagents can't spawn sub-subagents unless their ruleset contains `task` rule |
| Permission last-match-wins | Put `"*": "deny"` first, then specific allows. | Deny-by-default for all agents |
| Agent description drives Task tool listing | Description must say WHAT + WHEN to use. | Each agent's description is critical for LLM routing |

### Current Agent Team (8 agents)

| Agent | Lines | Mode | Description Focus | Issues |
|-------|-------|------|-------------------|--------|
| hivefiver | 361 | all | Meta-builder for Sector-2 assets | **Bloated** — 361L agent body loads once at init, permanent context cost. Target: ≤150L |
| hiveminder | 704 | (unset = all) | Supreme orchestrator + strategic architect | **Most bloated** — may conflict with hivefiver scope |
| hivemaker | 633 | (unset = all) | Execution specialist | Bloated — 633L |
| hiverd | 558 | (unset = all) | Research specialist | Bloated — 558L |
| hivexplorer | 293 | (unset = all) | Investigation specialist | Reasonable size |
| hiveplanner | 273 | (unset = all) | Planning specialist | Reasonable size |
| hivehealer | 284 | (unset = all) | Remediation/debugging specialist | Reasonable size |
| hiveq | 269 | (unset = all) | Quality/verification specialist | Reasonable size |

### Issues Identified

1. **No `mode:` set on 7/8 agents** — defaults to `all`, meaning every agent appears as both primary AND subagent. This violates anti-pattern 4 (subagents as primaries).
2. **No `hidden:` set on any agent** — all 8 agents clutter the @mention autocomplete.
3. **Massive body sizes** — hiveminder (704L), hivemaker (633L), hiverd (558L), hivefiver (361L) are all permanently loaded when active.
4. **hiveminder vs hivefiver scope overlap** — hiveminder is "supreme orchestrator" but hivefiver is "meta-builder." Who orchestrates what?

### Proposed Agent Team (HiveFiver-Scoped)

For the HiveFiver meta-module, the agent team should be:

| Agent | Mode | Hidden | Steps | Role in HiveFiver | Delegation Source |
|-------|------|--------|-------|--------------------|-------------------|
| **hivefiver** | `all` | `false` | — | Primary orchestrator. Owns TODOs. Drives compound cycles. | User (direct) or hiveminder (delegation) |
| **hivexplorer** | `subagent` | `true` | 25 | Investigation. Scans `.opencode/`, detects drift, finds patterns. | hivefiver only |
| **hiveplanner** | `subagent` | `true` | 30 | Planning. Designs phase plans, dependency graphs, wave ordering. | hivefiver only |
| **hiverd** | `subagent` | `true` | 25 | Research. MCP-backed evidence gathering, external skill discovery, doc analysis. | hivefiver only |
| **hivehealer** | `subagent` | `true` | 20 | Remediation. Diagnoses + fixes framework issues found by audit/doctor. | hivefiver only |
| **hiveq** | `subagent` | `true` | 15 | Quality gate. Runs validation checks, produces pass/fail evidence. | hivefiver only |

**Not in scope for HiveFiver team:**
- `hiveminder` — project-level orchestrator, NOT meta-module scoped
- `hivemaker` — execution specialist for Sector-1 code, NOT framework assets

### Permission Design (Deny-by-Default)

```yaml
# hivefiver — orchestrator permissions
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  question: allow
  skill: allow
  todoread: allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  task:
    "*": deny
    hivexplorer: allow
    hiveplanner: allow
    hiverd: allow
    hivehealer: allow
    hiveq: allow
  edit:
    ".opencode/**": allow
    ".hivemind/hive-modules/**": allow
    "agents/**": allow
    "commands/**": allow
    "skills/**": allow
    "workflows/**": allow
  write:
    ".opencode/**": allow
    ".hivemind/hive-modules/**": allow
    "agents/**": allow
    "commands/**": allow
    "skills/**": allow
    "workflows/**": allow
  bash:
    "git diff*": allow
    "git status*": allow
    "git log*": allow
    "grep *": allow
    "wc *": allow
    "ls *": allow
```

```yaml
# hivexplorer (subagent) — read-only investigation
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  webfetch: allow
  websearch: allow
  bash:
    "git diff*": allow
    "git log*": allow
    "grep *": allow
    "wc *": allow
    "ls *": allow
```

```yaml
# hiverd (subagent) — research with web access
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  webfetch: allow
  websearch: allow
  write:
    ".hivemind/hive-modules/**": allow
  bash:
    "grep *": allow
    "wc *": allow
```

```yaml
# hiveplanner (subagent) — planning with write to planning dir
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  write:
    ".hivemind/hive-modules/**": allow
  bash:
    "grep *": allow
    "wc *": allow
```

```yaml
# hiveq (subagent) — verification
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  bash:
    "git diff*": allow
    "grep *": allow
    "wc *": allow
    "diff *": allow
```

### Agent Description Requirements (Critical for LLM Routing)

Each agent's `description:` field drives the Task tool's dynamic listing. Descriptions must follow the pattern: **WHEN to use, not WHAT it does.**

| Agent | Current Description | Proposed Description |
|-------|--------------------|--------------------|
| hivefiver | "OpenCode meta-builder for Sector-2 assets..." | "Use for creating, auditing, or fixing framework assets (.opencode/). Orchestrates agent teams for meta-building: investigation → research → plan → execute → validate." |
| hivexplorer | "Investigation specialist..." | "Use when you need to scan framework assets, detect drift, find broken references, or gather evidence from the codebase. Read-only reconnaissance." |
| hiveplanner | "Planning specialist..." | "Use when you need phase plans, dependency graphs, wave ordering, or task decomposition for framework changes. Reads context, writes plans to .hivemind/." |
| hiverd | "Research specialist..." | "Use when you need external evidence: MCP-backed research, skill discovery, doc analysis, technology evaluation. Writes research to .hivemind/." |
| hivehealer | "Remediation specialist..." | "Use when audit findings need fixing: broken references, contract violations, parity drift, missing fields. Applies scoped fixes with evidence." |
| hiveq | "Quality and verification specialist..." | "Use when you need pass/fail evidence: contract validation, chain walks, parity checks, regression detection. Returns structured verdicts." |

---

## 5. Compound vs Atomic Delegation Model

<!-- CLASSIFICATION: orchestration, delegation-model, cycle-architecture -->
<!-- SYNTHESIS-TAGS: compound-cycle, atomic-cycle, front-delegation, second-delegation -->

### Two-Tier Delegation Architecture

```
┌─ COMPOUND CYCLE (Front Delegation — hivefiver orchestrates) ──────────┐
│                                                                        │
│  hivefiver (orchestrator, owns TODOs)                                  │
│  │                                                                     │
│  ├─ 1. GATE 0: Verify intent, check STATE.md, check TODO              │
│  │                                                                     │
│  ├─ 2. INVESTIGATE (delegate → hivexplorer)                            │
│  │   └─ Returns: findings, broken refs, drift signals                  │
│  │   └─ Persist to: synthesis/RESEARCH.md (append)                     │
│  │                                                                     │
│  ├─ 3. RESEARCH (delegate → hiverd, if external evidence needed)       │
│  │   └─ Returns: evidence table, confidence scores, sources            │
│  │   └─ Persist to: synthesis/RESEARCH.md (append)                     │
│  │                                                                     │
│  ├─ 4. SYNTHESIZE (hivefiver processes investigation + research)       │
│  │   └─ Update: synthesis/MAPPING.md, synthesis/MATRIX.md              │
│  │                                                                     │
│  ├─ 5. PLAN (delegate → hiveplanner, if complex)                       │
│  │   └─ Returns: phase plan, dependency graph, wave order              │
│  │   └─ Persist to: phases/NN-name/PLAN.md                            │
│  │                                                                     │
│  ├─ 6. EXECUTE (inner atomic cycles — see below)                       │
│  │                                                                     │
│  ├─ 7. VALIDATE (delegate → hiveq)                                    │
│  │   └─ Returns: pass/fail per gate                                    │
│  │   └─ Persist to: phases/NN-name/VALIDATION.md                      │
│  │                                                                     │
│  └─ 8. PERSIST + HARD STOP                                            │
│      └─ Update: STATE.md, MILESTONES.md, this SYNTHESIS.md            │
│      └─ Record: iterations/YYYY-MM-DD-cycle-N.md                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─ ATOMIC CYCLE (2nd Delegation — within EXECUTE step) ─────────────────┐
│                                                                        │
│  For each file to create/modify/delete:                                │
│                                                                        │
│  1. WRITE: Create/modify the file                                      │
│     └─ hivefiver does this directly (framework assets)                 │
│     └─ OR delegates to hivehealer (remediation fixes)                  │
│                                                                        │
│  2. VALIDATE: Check contract compliance                                │
│     └─ Inline check (frontmatter parses, required fields present)      │
│     └─ OR delegate to hiveq (complex validation)                       │
│                                                                        │
│  3. EVIDENCE: Record what was done                                     │
│     └─ TODO update (mark item completed, add next)                     │
│     └─ Append to phase VALIDATION.md                                   │
│                                                                        │
│  4. PARITY: If .opencode/ file → copy to root mirror                   │
│     └─ Verify diff returns zero                                        │
│                                                                        │
│  Loop until all files in wave complete.                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Delegation Decision Tree

```
hivefiver receives task
    │
    ├─ Is this investigation/scanning? ──→ delegate hivexplorer
    │
    ├─ Is this external research? ──→ delegate hiverd
    │   (MCP tools, web search, doc analysis)
    │
    ├─ Is this planning/sequencing? ──→ delegate hiveplanner
    │   (phases, dependencies, wave ordering)
    │
    ├─ Is this fix/remediation? ──→ delegate hivehealer
    │   (broken refs, contract violations)
    │
    ├─ Is this validation/verification? ──→ delegate hiveq
    │   (pass/fail, contract checks, chain walks)
    │
    ├─ Is this framework asset creation? ──→ hivefiver does directly
    │   (commands, workflows, templates, skills)
    │
    └─ Unknown? ──→ GATE 0 — clarify intent before proceeding
```

### Parallelism Rules

Parallel dispatch (multiple `task` tool calls in single message) is allowed ONLY when:

1. **Zero file overlap** — agents write to different directories
2. **Zero ordering dependency** — neither depends on the other's output
3. **Zero shared mutable state** — no common SOT file being modified
4. **Failure isolation** — one agent's failure doesn't break the other's output

Examples:
- ✅ Parallel: hivexplorer scanning commands + hiverd researching OpenCode patterns (different concerns, different outputs)
- ✅ Parallel: Creating 3 delegation templates (different files, no dependency)
- ❌ Sequential: hivexplorer scan THEN hiveplanner plan (planner needs scan results)
- ❌ Sequential: Write workflow THEN update MAPPING.md (mapping depends on written file)

---

## 6. Entry Point & Routing Design

<!-- CLASSIFICATION: orchestration, entry-point, routing -->
<!-- SYNTHESIS-TAGS: single-entry, parent-down, sot-routing -->

### Single Entry Point

The user or another agent invokes HiveFiver through ONE of these paths:

| Entry Path | Detection | Route To |
|-----------|-----------|----------|
| `/hivefiver <action>` | Command invocation — parse `$1` as action | Action routing table |
| `/hivefiver` (no args) | No action — start interactive | Gate 0 → intent clarification |
| `@hivefiver <natural language>` | @mention — agent profile matches | Agent profile → skill → detect action from NL |
| Delegation from hiveminder | Task tool with `subagent_type: hivefiver` | Prompt analysis → detect action |

### Parent-Down SOT Routing

When user presents a task:

```
1. Check: Does .hivemind/hive-modules/hivefiver-v2/STATE.md exist?
   ├─ No → Start fresh: run /hivefiver start
   └─ Yes → Read STATE.md for current position

2. Check: Does a compound-level plan exist for current phase?
   ├─ No → Run compound cycle from step 1 (GATE 0)
   └─ Yes → Check phase PLAN.md for next unfinished step

3. Check: Does user input match an atomic-level task?
   ├─ Yes BUT no compound parent → BLOCK. Create compound first.
   └─ Yes AND compound exists → Execute atomic cycle

4. Check: Does user input match a different phase?
   └─ Validate current phase exit gate first → then route to new phase
```

### Action Routing Table (Root Router)

| Action | Maps To | Compound Cycle Step |
|--------|---------|---------------------|
| `start` | `/hivefiver-start` | Full compound cycle |
| `intake` | `/hivefiver-intake` | Full compound cycle |
| `spec` | `/hivefiver-spec` | Full compound cycle |
| `architect` | `/hivefiver-architect` | Full compound cycle |
| `build` | `/hivefiver-build` | Full compound cycle |
| `audit` | `/hivefiver-audit` | Full compound cycle |
| `doctor` | `/hivefiver-doctor` | Full compound cycle |
| `status` | Read STATE.md + TODO | Informational (no cycle) |
| `resume` | Read STATE.md → pick up where left off | Resume compound cycle |
| (unknown) | Gate 0 → surface unrecognized action, suggest closest match | Block + clarify |

---

## 7. OpenCode Doc Structure Patterns (Learned)

<!-- CLASSIFICATION: knowledge, doc-patterns, progressive-disclosure -->
<!-- SYNTHESIS-TAGS: yaml-frontmatter, section-tags, tables, citation-system -->

### Patterns to Apply to HiveFiver Artifacts

From analysis of 7 OpenCode knowledge docs (8,753 lines total):

| Pattern | What It Does | Apply To |
|---------|-------------|----------|
| **Rich YAML frontmatter** | Machine-readable metadata: description, classification, fast_track, related_docs | All SOT files in synthesis/ |
| **Table-format TOC** | Section + Anchor + Classification tag | All files > 100 lines |
| **HTML comment triplets** | `<!-- CLASSIFICATION: ... -->` before each `##` section | All workflow files + synthesis files |
| **Tables as primary density** | Avoid long prose — every concept gets a table | All artifacts |
| **`source:LINE-LINE` citations** | Evidence chains to source code | Research and validation files |
| **Hub-and-Spoke awareness** | Declare document role: Hub (foundational) / Spoke (specialized) / Meta (navigation) | Module-level docs |
| **Progressive disclosure levels** | L0 (name only) → L1 (summary) → L2 (full) → L3 (references) with token cost estimates | Skill and reference design |
| **Change Log section** | At bottom of each SOT file — dated, structured | All iteratively-modified files |
| **Gap Analysis table** | `Gap | Impact | Effort | Priority | Action` | MATRIX.md |
| **Unicode coverage indicators** | `██████████` for complete, `░░░░░░░░░░` for empty | MAPPING.md coverage matrix |

### Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Alternative |
|-------------|---------|-------------|
| Long narrative prose blocks | Hard to scan, update, reference | Tables + short prose headers |
| Recreating files each session | Loses accumulated knowledge | Iterative modification with Change Log |
| Ephemeral explore results | Knowledge evaporates | Persist ALL research to synthesis/ files |
| Flat file dumps | No navigation aids | TOC + section tags + frontmatter |
| Date-stamped duplicate files | SOT confusion — which is current? | Single SOT file + Change Log |

---

## 8. Execution Batch Skeleton

<!-- CLASSIFICATION: planning, execution-skeleton, batch-design -->
<!-- SYNTHESIS-TAGS: cycle-ordering, dependency-chain, batch-handling -->

### Pre-Phase-0: Planning Infrastructure (THIS SESSION)

This is the batch the user wants executed NOW — before continuing Phase 0:

| Step | Action | Creates/Modifies | Validates |
|------|--------|-----------------|-----------|
| P0.A | Create `.hivemind/hive-modules/hivefiver-v2/` directory structure | 10 directories + this SYNTHESIS.md | Directories exist |
| P0.B | Create `CONTEXT.md` — module vision, scope, constraints | 1 file (~60L) | Contains scope, persona, constraints from prior sessions |
| P0.C | Create `REQUIREMENTS.md` — pulled from parent plan §II | 1 file (~120L) | All 7 UCs + acceptance criteria + metrics |
| P0.D | Create `STATE.md` — current position snapshot | 1 file (~50L) | Contains Phase 0 partial status, blockers, decisions |
| P0.E | Create `synthesis/RESEARCH.md` — accumulated research | 1 file (~150L) | Merged from prior session research outputs |
| P0.F | Create `synthesis/MAPPING.md` — traceability matrix | 1 file (~100L) | Asset → UC → Pain Point mappings from parent plan |
| P0.G | Create `synthesis/MATRIX.md` — decision + coverage matrix | 1 file (~80L) | Phase completion status + gap analysis |
| P0.H | Create `agents/TEAM.md` — agent team design | 1 file (~150L) | Agent topology, permissions, descriptions per §4 |
| P0.I | Create `phases/00-foundation/PLAN.md` | 1 file (~80L) | Extracted from parent plan Phase 0 + remaining steps |

### Batch Dependency Graph

```
P0.A (dirs) ─────────────┐
                          ├──→ P0.B, P0.C, P0.D (can be parallel)
                          ├──→ P0.E, P0.F, P0.G (can be parallel, after B)
                          ├──→ P0.H (can be parallel with E/F/G)
                          └──→ P0.I (depends on F for traceability)
```

### After Pre-Phase-0: Resume Phase 0 Foundation

Continue the parent plan's Phase 0 steps:

| Step | Status | Action |
|------|--------|--------|
| 0.1 | ✅ Done | Workflow directory created |
| 0.2 | ✅ Done | Template directory created |
| 0.3 | ✅ Done | Orchestrator skill directory created |
| 0.4a | ✅ Done | SKILL.md written (39L) |
| 0.4b | ✅ Done | governance-rules.md written (75L) |
| 0.4c | ❌ Pending | `asset-contracts.md` — contract schemas for agent/command/workflow/skill |
| 0.4d | ❌ Pending | `persona-matrix.md` — merge from hivefiver-persona-routing/SKILL.md (176L) |
| 0.5 | ❌ Pending | `opencode-patterns.md` — verified patterns from SDK analysis |

### After Phase 0: Agent Team Hardening

**Before Phase 1**, update agent profiles:

| Step | Action | Modifies |
|------|--------|---------|
| A.1 | Set `mode: subagent` + `hidden: true` on hivexplorer, hiveplanner, hiverd, hivehealer, hiveq | 5 agent .md files |
| A.2 | Update descriptions to "WHEN to use" format | 6 agent descriptions |
| A.3 | Add deny-by-default permission blocks | 6 agent permission sections |
| A.4 | Root parity sync for all modified agents | Root mirrors |

Then continue Phase 1 → 2 → 3 → 4 → 5 per parent plan.

---

## 9. Grey Areas / Questions

<!-- CLASSIFICATION: gate-0, grey-areas, user-clarification -->

| # | Grey Area | Options | Impact |
|---|----------|---------|--------|
| 1 | **hiveminder vs hivefiver scope**: hiveminder (704L) is "supreme orchestrator" — does HiveFiver operate UNDER hiveminder or independently? | A) HiveFiver is standalone (user invokes directly) B) HiveFiver is a module that hiveminder delegates to | Affects delegation topology and agent team boundaries |
| 2 | **Agent profile rewrites NOW or Phase 3?**: The plan says Phase 3 does cleanup + agent simplification. But user says "first create your agents team." Should we harden agents NOW? | A) Harden NOW (Pre-Phase-0.H + agent team step) B) Defer to Phase 3 per original plan | A = safer routing early, B = less rework if plan changes |
| 3 | **`.hivemind/hive-modules/` as the pattern for ALL meta-modules?**: Is this structure intended only for HiveFiver, or is it the template for any future meta-module (e.g., a "code-quality" meta-module)? | A) HiveFiver-specific B) General pattern for all hive-modules | Affects naming, abstraction level of templates |
| 4 | **Existing YAML workflows**: 5 YAML workflows exist (`hivefiver-enterprise.yaml`, `hivefiver-vibecoder.yaml`, etc.). The plan calls for new markdown workflows. What happens to the YAML ones? | A) Keep YAML alongside new MD B) Replace YAML with MD (Phase 3) C) They serve different purposes | Affects Phase 3 cleanup scope |
| 5 | **Parent plan (`docs/plans/`) vs module SOT (`.hivemind/hive-modules/`)**: Where does the SOTO live? The parent plan is 783L in `docs/plans/`. The new module SOT is in `.hivemind/hive-modules/hivefiver-v2/`. | A) Parent plan is frozen archive, module SOT is living B) Both are living, parent for roadmap, module for operations C) Migrate parent plan content into module SOT | Affects where to update status |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-03-01 | Initial creation — structural synthesis from Gate 0 analysis | hivefiver |
| 2026-03-01 | §10 added — Runtime Enforcement Architecture from Phase 5 forensic audit | hivefiver |

---

## 10. Runtime Enforcement Architecture

<!-- CLASSIFICATION: enforcement, runtime-gate, mandatory-lifecycle -->
<!-- SYNTHESIS-TAGS: forensic-audit, enforcement-bypass, runtime-gate, tool-chain-registry -->

### Problem Statement

Forensic audit of session `ses_356f` (10,668 lines) proved:
- **14 enforcement scripts existed** but **12 were NEVER executed**
- **Skills loaded TWICE** (session start only) — no mid-session verification
- **Zero quality gates ran** — all mentions were in documentation text, not tool calls
- **Zero HiveMind governance tools** (`declare_intent`, `map_context`) were actually invoked
- The agent wrote specifications about enforcement while demonstrating zero enforcement

### Root Cause

Enforcement was **optional**. The scripts existed in `<enforcement>` blocks and SKILL.md instructions, but:
1. Nothing prevented an agent from ignoring them
2. No lifecycle hook forced their execution
3. No evidence requirement backed completion claims
4. The agent had full capability to do ad-hoc work without touching any script

### Solution: runtime-gate.sh (453L Unified Enforcer)

**Design principle**: Make enforcement **mandatory at the lifecycle level**, not optional at the instruction level.

| Action | When | What It Does |
|--------|------|-------------|
| `pre-turn` | Before any work | Checks state, inventory, quality baseline, skill requirements |
| `post-turn` | After work, before claiming done | Runs quality check, pipeline status, state checkpoint |
| `checkpoint` | Mid-work (after 2-3 modifications) | Quality snapshot + state checkpoint |
| `export` | Before closing pipeline or handoff | Creates handoff artifact with quality/pipeline/inventory snapshots |
| `chain-check` | When verifying script registration | Validates a script exists in the tool-chain registry |
| `journey` | At session start | Maps intent → required tool execution order |
| `toolmap` | On demand | Dumps full 14-script tool-chain registry as JSON |

### Enforcement Injection Points

| Layer | Injection | Files Modified |
|-------|-----------|---------------|
| Commands (`<enforcement>`) | `runtime-gate.sh pre-turn` auto-executes on command invocation | All 10 hivefiver commands |
| Commands (`<process>`) | `runtime-gate.sh post-turn` runs at end of stage work | 8 stage commands |
| Commands (`<process>`) | `runtime-gate.sh export` runs for pipeline-closing stages | hivefiver-build.md |
| Skills | MANDATORY enforcement protocol documented | hivefiver-coordination/SKILL.md, hivefiver-mode/SKILL.md |

### Tool-Chain Registry

runtime-gate.sh maintains a registry of all 14 scripts with:
- **hierarchy**: position in the enforcement chain (ROOT_ENFORCER, state_management, gate_enforcement, etc.)
- **triggers**: when the script should fire (every_turn_start, before_stage_entry, etc.)
- **upstream/downstream**: dependency chain between scripts
- **mandatory**: whether the script MUST fire in every lifecycle

### Anti-Bypass Mechanisms

1. **`<enforcement>` auto-execution**: Commands with `!`bash ...`` run scripts BEFORE the LLM processes the prompt
2. **Evidence requirement**: "Any completion claim without runtime-gate evidence is automatically invalid" (in SKILL.md)
3. **G-06 violation**: Skipping runtime-gate is classified as a blocked anti-pattern (missing exit criteria)
4. **Export artifacts**: Machine-readable JSON proof at `.hivemind/hive-modules/hivefiver-v2/handoffs/export-*.json`

### Key Insight

> The problem was never that enforcement scripts didn't exist. The problem was that they were advisory — the agent could choose to ignore them. runtime-gate.sh doesn't add new checks — it makes existing checks **mandatory** by embedding them in every command's auto-execution chain.

### Remaining Gap

The fundamental limitation is that `<enforcement>` blocks only run when commands are invoked via `/hivefiver <action>`. If an agent works ad-hoc without invoking commands, enforcement is still bypassed. The mitigation is:
1. Agent profile `<startup_health>` runs runtime-gate on session start
2. SKILL.md instructions mandate runtime-gate at every turn
3. But these remain instruction-level enforcement, not lifecycle-level

Full lifecycle enforcement would require OpenCode platform-level hooks (pre-tool-execution, post-tool-execution) which are outside HiveFiver's scope.

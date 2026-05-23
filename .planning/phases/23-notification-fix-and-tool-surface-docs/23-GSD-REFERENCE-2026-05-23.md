# GSD Framework Reference — Academic Research Synthesis

**Date:** 2026-05-23
**Source:** github.com/gsd-build/get-shit-done (docs/)
**Scope:** 113 docs files, 425K tokens
**Method:** Multi-dimension deep research via `hm-l2-researcher`
**Purpose:** Learn from GSD to upgrade Hivemind while preserving its unique automation, delegation logics, and tools

---

## 1. GSD Architecture Overview

GSD (Get Shit Done) is an OpenCode-native productivity framework built entirely from **soft meta-concepts**: agents, commands, skills, workflows. No custom tools, no plugin — everything runs through OpenCode's native Task/SubAgent dispatch and file-based state in `.planning/`.

### Core Principles
| Principle | Description |
|-----------|-------------|
| **File-based state** | All state in `.planning/` — human-readable Markdown + JSON. No database, no server |
| **Two-stage routing** | 6 namespace meta-skills sit above 67 concrete commands. Eager listing sees 6 entries (~120 tokens) instead of 67 (~2,150 tokens) |
| **Wave execution** | Plans grouped by dependency → parallel within waves → sequential across waves |
| **Adaptive context** | Subagent prompt richness dynamically adjusts to available context window (200K vs 500K+) |
| **Golden test parity** | SDK + CLI run identical tests to verify behavior match |

### Agent Hierarchy (Flat)
33 shipped agents, **flat categorization** (no L0/L1/L2):
- Researchers (4), Analyzers (2), Synthesizers (1), Planners (2)
- Executors (1), Checkers (3), Verifiers (1), Auditors (3)
- Mappers (1), Debuggers (1), Doc Writers (2), Profilers (1)

### Command Structure
67 commands, 88 workflow files. Commands are `.md` files with YAML frontmatter + prompt body. Two-stage hierarchy: namespace router (6) → concrete command (67).

### State Management
STATE.md with YAML frontmatter:
```
gsd_state_version, milestone, milestone_name, status,
active_phase, next_action, next_phases,
progress: {total_phases, completed_phases, percent}
```

---

## 2. GSD vs Hivemind Comparison

### 2.1 Command System

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Count** | 67 shipped commands | 19 commands |
| **Structure** | Flat `.md` files | `.opencode/commands/` with YAML frontmatter |
| **Routing** | Two-stage: namespace router → concrete | Single-stage flat listing |
| **Workflow files** | 88 thin orchestrator files | None — logic in commands |
| **Platform adapters** | Claude Code, Gemini, Codex (3 variants) | OpenCode only |

**Learn:** Two-stage namespace routing reduces listing cost. 6 routers × 120 tokens vs 67 flat commands × 2,150 tokens.

**Preserve:** `execute-slash-command` with `subtask:true/false` + `agent` override is more flexible. `hivemind-command-engine` with `discover`/`analyze_contract` is richer read-side.

### 2.2 Agent Architecture

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Count** | 33 agents | 89 agents (33 gsd + 45 hm-* + 11 hf-*) |
| **Hierarchy** | Flat | L0 → L1 → L2 → L3 |
| **Dispatch** | Synchronous Task() calls | WaiterModel: task + delegate-task |
| **Model resolution** | Runtime (`resolve-model <agent>`) | Baked in frontmatter |
| **Context enrichment** | Adaptive (200K vs 500K+) | Static per agent |

**Learn:** Runtime model resolution from a catalog. Adaptive context enrichment based on available window.

**Preserve:** L0-L2 hierarchy is strictly superior. WaiterModel with dual-signal. Evidence contracts (L1-L5 evidence hierarchy). Session stacking via `parentSessionId`.

### 2.3 Skill System

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Count** | 86 skills | 59 skills |
| **Discovery** | Formal `discovery-contract.md` | Informal — skill tool listing |
| **Taxonomy** | 10-cluster | Prefix-based (hm-*/hf-*/gate-*/stack-*) |
| **Surface control** | Profile-based staging (minimal/standard/full) | Binary installed/not installed |
| **Install** | Workspace symlinks | `.opencode/skills/` symlinks |

**Learn:** Formal skill discovery contract. Cluster taxonomy for grouping. Profile-based surface budgeting.

**Preserve:** IRON CLAW consumption governance (5-step validation). `hm-l3-tech-stack-ingest` with version-matched caching.

### 2.4 Workflow Pipeline

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Pipeline** | discuss → plan → execute → verify → ship | Ad-hoc |
| **Discuss** | Two modes (interview + assumptions) | hm-l2-brainstorm, hm-l2-user-intent-interactive-loop |
| **Research gate** | Blocks planning on unresolved questions | Missing |
| **Plan-check** | 8 verification dimensions, max 3 iterations | hm-l2-phase-execution |
| **Execute** | Wave-based parallel, fresh context per agent | hm-l2-phase-execution (wave-based) |
| **Verify** | Conversational UAT + auto-diagnosis | hm-l2-gate-orchestrator (triad) |

**Learn:** Research gate (block on unresolved questions). Package Legitimacy Gate (supply-chain security). Post-execute codebase drift gate.

**Preserve:** completion-looping with re-looping. L1-L5 evidence hierarchy. spec-driven + tdd-driven tight loop. Gate triad (lifecycle → spec → evidence).

### 2.5 State Management

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Storage** | STATE.md (file-based) | `.hivemind/state/` (JSON files) |
| **Phase tracking** | active_phase, next_action, next_phases | Session-tree with continuity |
| **Concurrent writes** | STATE.md.lock (O_EXCL) | Single-writer pattern |
| **Query** | `gsd-sdk query state.*` | session-tracker with 6 actions |
| **Lineage** | Reconstructed from artifacts | trajectory ledger |

**Learn:** Phase-lifecycle frontmatter fields. STATE.md.lock with O_EXCL + jitter. Progress dimensions (phase vs plan).

**Preserve:** session-tracker with rich queries (search, filter, export, hierarchy). hivemind-session-view with enriched nested tree. trajectory ledger.

### 2.6 Delegation

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Model** | Synchronous Task() | WaiterModel (async + dual-signal) |
| **Monitoring** | None — wait and collect | delegation-status with polling |
| **Journal** | None — reconstructed | delegations.json + trajectory |
| **Stacking** | Not supported | parentSessionId / task_id stacking |
| **Parallel** | Wave-based (planner decides) | Wave-based + checkpoint |

**Learn:** Wave-based parallelization algorithm. Adaptive context enrichment for subagents.

**Preserve:** WaiterModel with dual-signal. delegation journal + trajectory ledger. session-stacking. delegation-status polling.

### 2.7 Quality Gates

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Gate model** | 8-dim plan-check + verifier | Triad: lifecycle → spec → evidence |
| **Evidence** | Binary PASS/FAIL | L1-L5 hierarchy |
| **Test audit** | Disabled tests, circular patterns, assertion strength | Missing |
| **Supply chain** | Package Legitimacy Gate | Missing |
| **Drift detection** | Codebase structural drift gate | Missing |

**Learn:** Test quality audit (assertion strength, disabled tests, circular patterns). Package Legitimacy Gate (supply-chain security). Codebase drift gate (structural change detection).

**Preserve:** L1-L5 evidence hierarchy. Quality gate triad. 9-surface mutation authority. Mock-only detection.

### 2.8 Phase Management

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **Numbering** | Decimal (e.g., 4.5) | Integer only |
| **Milestones** | `/gsd-new-milestone`, MILESTONES.md | None |
| **Artifacts** | Standardized: CONTEXT.md, RESEARCH.md, PLAN.md, etc. | Ad-hoc |
| **Granularity** | fine/standard/coarse | Hardcoded |
| **Autonomous** | `/gsd-autonomous` — per-phase loop | hm-l2-phase-loop |

**Learn:** Decimal phase insertion for urgent work. Milestone management with archive. Standardized phase artifact structure. Granularity setting.

**Preserve:** phase-loop with entry/exit gates + checkpoint gates. completion-looping against premature completion.

### 2.9 SDK Integration

| Aspect | GSD | Hivemind |
|--------|-----|----------|
| **SDK** | `@gsd-build/sdk` — typed query registry | Plugin-based (`@opencode-ai/plugin`) |
| **CLI** | `gsd-sdk query` — structured JSON + error codes | `hivemind-sdk-supervisor` (health only) |
| **Tests** | Golden tests — same tests for CLI + SDK | None for SDK wrappers |
| **Observability** | `onDispatchEvent` per call | Basic diagnostics |

**Learn:** Query handler registry. Golden test parity (identical tests for old + new surfaces). Structured dispatch observability. Error classification (GSDError with ErrorClassification enum). Phased migration (CJS → SDK via Shared Module architecture).

**Preserve:** Plugin-based composition (tool + hook duality). SDK supervisor with health/heartbeat/diagnostics/readiness. Layered leaf architecture (shared/ types).

---

## 3. Actionable Recommendations for Hivemind

### HIGH Impact
1. **Two-stage namespace routing for commands** — Reduce eager listing cost. 6 namespace routers vs 19 flat commands
2. **Research gate for phase planning** — Block planning if RESEARCH.md has unresolved questions. Adopt into phase-execution
3. **Test quality audit** — Add assertion strength analysis, circular test detection, disabled-test audit to critic/evidence-truth
4. **Package Legitimacy Gate** — Supply-chain security for hallucinated dependencies. Critical for code-gen agents

### MEDIUM Impact
5. **Phase-lifecycle state fields** — `active_phase`, `next_action`, `next_phases` in session state
6. **Standardized phase artifact structure** — Formal file paths for all phase artifacts
7. **Codebase drift detection** — Structural change detection vs last_mapped_commit
8. **Decimal phase insertion** — Urgent mid-milestone work

### LOW Impact
9. **Milestone management with archive** — Commands + MILESTONES.md
10. **Adaptive context enrichment** — Dynamic prompt richness per available window
11. **Skill discovery contract** — Formalized in `.opencode/skills/DISCOVERY.md`
12. **Golden test parity** — CLI + SDK tests

---

## 4. Things Hivemind Must NEVER Surrender

| Capability | Why Unique |
|------------|-----------|
| WaiterModel with dual-signal | Async dispatch + completion monitoring. GSD only has synchronous Task() |
| L1-L5 evidence hierarchy | Precision quality measurement. GSD only has binary PASS/FAIL |
| Quality gate triad | Layered validation. GSD has no equivalent structure |
| 9-surface mutation authority | Lifecycle integration model. GSD doesn't distinguish surfaces |
| session-stacking via parentSessionId | Attach new work to ANY session. GSD can't |
| trajectory ledger | Execution lineage. GSD reconstructs from artifacts |
| L0-L1-L2-L3 hierarchy | Structured delegation. GSD flat model can't scale to Hivemind complexity |
| IRON CLAW consumption governance | 5-step validation chain. GSD loads flat files |
| Plugin-based composition | tool + hook duality. GSD lives outside plugin system |
| execute-slash-command subtask/agent overrides | Flexible dispatch modes. GSD has flat Task() only |

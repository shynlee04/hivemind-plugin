---
status: draft
type: skeleton
version: 2
created: 2026-05-06
source_documents:
  - .hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md
  - .planning/SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md
  - .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
supersedes: SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md
compression_tier: 3
sources_ingested: 3
conflicts_resolved: 4
confidence: MEDIUM
evidence_preserved: true
---

# Skeleton v2: Integrated Systematic Approach

> **Compression Tier:** 3 (Validated Report) | **Sources:** 3 | **Conflicts Resolved:** 4
> **Confidence:** MEDIUM | **Evidence Preserved:** file:line references retained throughout

## Table of Contents

1. [Executive Framing](#1-executive-framing)
2. [The 4 Feature Paths](#2-the-4-feature-paths)
3. [The 2 Lineages](#3-the-2-lineages)
4. [Feature Gap Inventory](#4-feature-gap-inventory)
5. [Feature Reference Map (f-03 → f-09+)](#5-feature-reference-map-f-03--f-09)
6. [Workstream Dependency Order](#6-workstream-dependency-order)
7. [HER Phase Cross-References](#7-her-phase-cross-references)
8. [Governance Document Map](#8-governance-document-map)
9. [Config Schema Skeleton](#9-config-schema-skeleton)
10. [Bootstrap Tree (.hivemind/ Structure)](#10-bootstrap-tree-hivemind-structure)
11. [Online References](#11-online-references)
12. [On-Disk Artifact Reference Table](#12-on-disk-artifact-reference-table)
13. [Conflict Resolution Log](#13-conflict-resolution-log)

---

## 1. Executive Framing

### 1.1 The Core Problem

The Hivemind harness has crossed from "a TypeScript plugin with tools" into "a runtime composition product." Current modules exist as isolated features but lack a unified **feature ecosystem contract** defining:

- Which module owns which lifecycle responsibility
- Which path each feature belongs to
- Which lineage consumes it
- Which agent/skill/command/tool can trigger it
- Where it writes state
- How it is verified end-to-end

### 1.2 Three-Stage Recovery Strategy

| Stage | Name | Purpose | Status |
|-------|------|---------|--------|
| A | Ecosystem Diagnosis / Re-map | Classify all features into 4 paths × 2 lineages | ✅ Complete (HER-0) |
| B | Architecture + Planning Reconciliation | Audit/update governance artifacts | ✅ Complete (HER-1, HER-2) |
| C | New Workstream Creation | Create GSD workstreams in dependency order | ⏳ In progress (HER-3 blocked, HER-4/5 ready) |

### 1.3 Recommended Approach (Option 3)

**Re-map → Re-plan → Then Build in dependency order.** This avoids:
- Option 1 (patch-only): Fixes symptoms, leaves ecosystem under-integrated
- Option 2 (build immediately): Risks duplicating overlap and producing more non-practical features

### 1.4 Project Philosophy

The harness delivers four value propositions:

1. **Collaborative, bite-size expert guidance** — helps users build complex projects with cross-stack, cross-architecture complexity
2. **Agent-centric with robust task management** — smart-auto-governance, adaptive workflows, persistent classified graph context
3. **No-hassle setup** — smart routers, expert agents, pitfall prevention, context rot/hallucination prevention
4. **Extreme case readiness** — handles shifting intents, feature-creep users, intricate prompts gracefully

> **Important:** GSD commands/agents/skills are development tools used to BUILD this project — they are NOT shipped features. All synthesis from GSD/OMO must be transformed to hm-*/hf-* conventions before shipping.

---

## 2. The 4 Feature Paths

### 2.1 Path 1 — Agent-Callable Deterministic Features

**Purpose:** Features that agents can explicitly call or skills can activate.

| Sub-Group | Description | Feature Refs |
|-----------|-------------|--------------|
| Task Management | CRUD operations on tasks, todos, trajectory nodes | f-07, f-08 |
| Delegation / Coordination | Multi-agent dispatch, L0→L3 hierarchy, async/graph delegation | f-06 |
| Context & Memory | Retrieval profiles, time-machine, graph-state | f-08 |
| Hivemind Task/Workflow CRUD | Role-specific operations based on agent role | f-04 |
| Role-Specific Superpowers | Executors code; writers read/write docs; reviewers validate; orchestrators route | f-03a |

**Current Gap:** Tools tested in isolation but not whether correct agent roles access correct tools at correct lifecycle phase.

**Primary Concern:** Agent permission matrix + workflow binding + practical task lifecycle.

**Lineage Ownership:** Primarily `hm-*` (consumes configured primitives for project work). `hf-*` configures the permission/tool matrix.

---

### 2.2 Path 2 — Runtime Programmatic Features

**Purpose:** Features that happen automatically via OpenCode runtime events, hooks, injections, transforms, compaction.

| Sub-Group | Description | Feature Refs |
|-----------|-------------|--------------|
| Event Subscriptions | session.created, tool.use, message hooks | f-09+ |
| Prompt/Message Transformation | Intent analysis, prompt packet compilation, context injection | f-04 |
| Compaction Hooks | Structured append-only context survival across compacts | f-09+ |
| Auto-State Updates | Event-tracker writes, runtime-pressure scoring | f-08 |
| Parser/Writer Systems | YAML frontmatter parsing, XML-tagged body sections, schema validation | f-03x |
| Route/Reroute Logic | Intent classification → workflow router → agent/skill/command chain | f-04 |
| Session Entry/Intake | Language resolution, profile resolution, purpose classification | Path 2 |
| SDK/Server Injections | Granular primitive control via OpenCode SDK + server API | f-09+ |

**Current Gap:** Mostly validated callable custom tools, not live event-driven behavior across OpenCode lifecycle.

**Primary Concern:** Runtime hooks must produce useful, queryable, compactable state — not noisy garbage.

**Lineage Ownership:** Primarily `hm-*` (runtime automation). `hf-*` configures hook subscriptions and injection policies.

---

### 2.3 Path 3 — Governance / Registry / Permissions / Configuration

**Purpose:** The control layer deciding what exists, what is allowed, what is wired, and what is safe.

| Sub-Group | Description | Feature Refs |
|-----------|-------------|--------------|
| Primitive Registry | Discover/register agents, skills, commands, tools, MCP tools, custom tools, hooks, stack refs | f-03a–f-03f |
| Permission Compiler | Per-agent tool access, per-depth permissions, lineage rules | f-03a–f-03f |
| Config Compiler | Global vs project precedence, validate-restart, drift detection | f-05 |
| Stack/Chain Settings | Primitive stacking, chaining, ordering with predefined conditions | f-03x |
| Lifecycle Gates | Quality triad (lifecycle → spec → evidence), state-root separation | Internal |
| Control Pane | The glue/handler/router/assembler connecting configs to runtime | f-04 |

**Current Gap:** Real drift found — broken command-agent refs, permission blocks on L1→L2, invalid frontmatter, unclear registry ownership.

**Primary Concern:** Governance must be authoritative before runtime automation grows.

**Lineage Ownership:** `hf-*` primarily owns configuration/compilation. `hm-*` consumes governance for workflow validation. `gate-*` is internal (not shipped).

---

### 2.4 Path 4 — Sidecar + User Onboarding + Safe Configuration

**Purpose:** User-facing setup, configuration, control surfaces.

| Sub-Group | Description | Feature Refs |
|-----------|-------------|--------------|
| CLI Install / Init | `npx` init, interactive + flags-based setup, greenfield vs brownfield | f-05 |
| configs.json | Core runtime values loaded at every front-facing session | f-05 |
| Project Bootstrap | Required folder/file scaffolding, primitive installation/checkup | f-05 |
| Onboarding Flows | Language/profile/mode setup, MCP server verification, doctor mode | f-05 |
| Sidecar Settings UI | Read-only state model, allowed user modifications, primitive health dashboard | f-05, f-09+ |
| hf-Assisted Customization | Safe primitive creation/modification via hf-meta-builder lineage | hf-* |

**Current Gap:** Not validated by Team B UAT. Install/init/onboarding must be strong or all features remain internal toys.

**Primary Concern:** If install/init/onboarding is weak, all other features remain unusable as a product.

**Lineage Ownership:** `hf-*` owns onboarding/customization flows. `hm-*` benefits from configured setup.

---

## 3. The 2 Lineages

### 3.1 `hm-*` — Product Development Runtime

**Role:** Consumes configured primitives to do real project work.

| Domain | Examples |
|--------|----------|
| Planning | hm-l2-planner, hm-l2-phase-guardian |
| Implementation | hm-l2-build, hm-l2-executor |
| Research | hm-l2-researcher, hm-l3-deep-research, hm-l3-detective |
| Debugging | hm-l2-debug |
| Validation | hm-l2-spec-verifier, hm-l2-test-router |
| Quality Gates | gate-l3-evidence-truth, gate-l3-spec-compliance, gate-l3-lifecycle-integration |
| Task Lifecycle | trajectory, task-plus, agent-work-contract |
| Delegation | delegate-task, delegation-status (for product work) |
| State Continuity | continuity.ts, session-journal |
| Orchestration | hm-l0-orchestrator, hm-l1-coordinator, hm-l2-conductor |
| Context/Intelligence | hm-l3-synthesis, doc-intelligence, codebase intelligence |

**Key Distinction:** `hm-*` agents are specialists that USE configured tools/skills/commands to accomplish project tasks. They do not configure the system.

---

### 3.2 `hf-*` — Meta-Builder / Configuration / Compilation

**Role:** Configures the system safely so `hm-*` can use it.

| Domain | Examples |
|--------|----------|
| Creating Agents | hf-l2-agent-builder |
| Creating Skills | hf-l2-skill-builder |
| Creating Commands | hf-l2-command-builder |
| Creating Tools | hf-l2-tool-builder |
| Configuring Primitives | hf-l2-meta-builder |
| Validating Frontmatter/Schema | config-compiler, validate-restart |
| Naming Conventions | naming-syndicate |
| Primitive Registries | primitive-loader, primitive-registry |
| Safe Customization | doctor/checkup sessions, onboarding flows |
| Orchestration | hf-l0-hm-l0-orchestrator (bridges hf ↔ hm) |

**Key Distinction:** `hf-*` agents configure the system through step-by-step conversation with the user. They compile, validate, and wire primitives. They do not execute project tasks.

---

### 3.3 Lineage Boundary Rules

| Rule | Description |
|------|-------------|
| hm never configures | `hm-*` agents consume, never create/modify primitive configurations |
| hf never implements | `hf-*` agents configure, never write project code |
| Shared infrastructure | Some modules (continuity, state) serve both lineages |
| gate-* is internal | Quality gate skills are THIS PROJECT's internal tools, not shipped |
| stack-* is reference | Stack reference skills provide API docs, not runtime behavior |
| GSD is dev-only | gsd-* agents/skills/commands are development tools, never shipped |

---

## 4. Feature Gap Inventory

### 4.1 Gap Classification Schema

Each gap is classified as:

```
GAP-{id}: {title}
  Path(s): [P1|P2|P3|P4]
  Lineage(s): [hm|hf|both]
  State: [not-started | partial | conflicting | dead-code]
  Dependencies: [what must be built first]
  HER Phase: [related phase, if any]
  Feature Ref: [f-03 through f-09+]
```

---

### 4.2 Bootstrap & Installation Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-01 | No CLI install/init flow | P4 | hf | not-started | WS-1 state architecture | HER-4 (TBD) | f-05 |
| GAP-02 | No configs.json schema or bootstrapping | P3, P4 | hf | not-started | WS-1, GAP-01 | HER-4 (TBD) | f-05 |
| GAP-03 | No interactive/flags-based setup (greenfield vs brownfield) | P4 | hf | not-started | GAP-01, GAP-02 | HER-4 (TBD) | f-05 |
| GAP-04 | No onboarding primitive verification (MCP servers, hooks, injections) | P4 | hf | not-started | GAP-01, GAP-03 | HER-4 (TBD) | f-05 |
| GAP-05 | No doctor mode / checkup session system | P4 | hf | partial (hf-brain stubs exist) | GAP-01 | HER-4 (TBD) | f-05 |

---

### 4.3 Primitive Registry & Control Pane Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-06 | No unified primitive registry (agents/skills/commands/tools/MCP/hooks) | P3 | hf | partial (primitive-registry.ts, primitive-loader.ts exist but incomplete) | WS-0 (COMPLETE) | HER-2 (COMPLETE) | f-03a–f-03f |
| GAP-07 | No permission compiler (per-agent tool access, per-depth rules) | P3 | hf | not-started | GAP-06 | — | f-03a–f-03f |
| GAP-08 | No global vs project config precedence rules | P3 | hf | not-started | GAP-06, GAP-02 | — | f-03x |
| GAP-09 | No stack/chain/ordering contracts for primitives | P3 | hf | not-started | GAP-06 | — | f-03x |
| GAP-10 | validate-restart exists but drift detection is incomplete | P3 | hf | partial | GAP-06 | HER-1 (COMPLETE) | f-03x |

---

### 4.4 Agent/Skill System Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-11 | Agent registry/routing toward commands and workflows not built | P1, P3 | both | not-started | GAP-06, GAP-16 | — | f-03a |
| GAP-12 | Agent hierarchy (L0→L1→L2→L3) coordination loops incomplete | P1 | hm | partial | GAP-18, GAP-16 | — | f-03a |
| GAP-13 | Skills not integrated to ecosystem or runtime-code | P1, P3 | both | partial (skills exist but not wired) | GAP-06, GAP-11 | — | f-03b |
| GAP-14 | Permissions granularity per agent is underdeveloped | P3 | hf | partial | GAP-07, GAP-11 | — | f-03a |
| GAP-15 | hm/hf lineage boundary not distinctly set up in agent configs | P3 | both | partial | GAP-06, GAP-07 | — | f-03a |

---

### 4.5 Command & Workflow Router Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-16 | No hm/hf-workflow-router (intent → command → agent → skill → tool chain) | P1, P2, P3 | both | not-started | GAP-06, GAP-07 | — | f-04 |
| GAP-17 | No hm/hf-intent-analyzer (classification, reconstruction, intent-to-prompt) | P1, P2 | both | partial (prompt-skim, prompt-analyze exist) | GAP-16 | — | f-04 |
| GAP-18 | No auto-commands system (slash commands + natural prompts → routed workflows) | P1, P3 | both | not-started | GAP-16, GAP-06 | — | f-04 |
| GAP-19 | No command bundle registry or $ARGUMENTS parsing for workflow templates | P1, P3 | both | not-started | GAP-16 | — | f-04 |

---

### 4.6 Delegation System Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-20 | Custom delegation far inferior to OpenCode innate task tool | P1, P2 | hm | partial (delegation-manager.ts exists) | GAP-06, GAP-12 | — | f-06 |
| GAP-21 | No background/async delegation lanes | P1, P2 | hm | not-started | GAP-20 | — | f-06 |
| GAP-22 | No graph-based delegation with checkpoints | P1, P2 | hm | not-started | GAP-20, GAP-27 | — | f-06 |
| GAP-23 | No PTY/tmux/swarm lanes for parallel worktree execution | P1, P2 | hm | partial (pty/ module exists) | GAP-20 | — | f-06 |
| GAP-24 | Delegation records lack write-to-disk output, no session resumption | P1, P2 | hm | partial | GAP-20 | — | f-06 |
| GAP-25 | Cannot delegate with commands/skills/tools configured per task | P1, P2 | hm | not-started | GAP-20, GAP-18 | — | f-06 |

---

### 4.7 Task/Trajectory/Continuity Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-26 | Trajectory not context-aware or integrated with delegation/workflows | P1, P2 | hm | partial (trajectory/ module exists) | GAP-20, GAP-16 | — | f-07 |
| GAP-27 | No task-plus advanced todo/task schema | P1 | hm | not-started | GAP-26 | — | f-07 |
| GAP-28 | No cross-session dependency validation gate | P1, P2 | hm | not-started | GAP-26, GAP-24 | — | f-07 |
| GAP-29 | Agent-work-contract not wired to delegation or workflow router | P1, P2 | hm | partial (agent-work-contracts/ module exists) | GAP-26, GAP-20 | — | f-07 |
| GAP-30 | No checkpoint graph or abandoned/active/blocked task validation | P1, P2 | hm | not-started | GAP-27, GAP-28 | — | f-07 |

---

### 4.8 Context/Event-Tracker/Compaction Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-31 | Event-tracker output is noisy, not queryable, not useful for retrieval | P2 | hm | partial (event-tracker/ exists but output quality is poor) | WS-1 (state architecture) | HER-3 (blocked) | f-08 |
| GAP-32 | No structured append-only journal for execution lineage | P2 | hm | partial (session-journal.ts exists) | GAP-31 | HER-3 (blocked) | f-08 |
| GAP-33 | No context purification / time-machine replay | P2 | hm | not-started | GAP-31, GAP-32 | HER-3 (blocked) | f-08 |
| GAP-34 | No compaction hook augmentation for structured context survival | P2 | hm | partial (prompt-packet/compaction-preservation.ts wired in HER-2) | GAP-31 | HER-3 (blocked) | f-09+ |
| GAP-35 | No long-haul session survival strategy | P2 | hm | not-started | GAP-33, GAP-34 | — | f-09+ |
| GAP-36 | No hallucination/stale context detection | P2 | hm | not-started | GAP-31 | — | f-09+ |

---

### 4.9 Sidecar & UI Gaps

| ID | Gap | Path | Lineage | State | Deps | HER | Ref |
|----|-----|------|---------|-------|------|-----|-----|
| GAP-37 | No sidecar read-only state model | P4 | hf | not-started | WS-1, GAP-06 | — | f-09+ |
| GAP-38 | No hf-assisted configuration flow for user-facing customization | P4 | hf | not-started | GAP-06, GAP-02 | — | f-09+ |
| GAP-39 | No primitive health dashboard or lineage status visualization | P4 | hf | not-started | GAP-06, GAP-37 | — | f-09+ |

---

## 5. Feature Reference Map (f-03 → f-09+)

### 5.1 Feature Reference Table

| Ref | Feature | Path(s) | Lineage(s) | Status | Key Gaps |
|-----|---------|---------|------------|--------|----------|
| f-03a | Agents — registry, hierarchy, permissions, L0-L3 coordination | P1, P3 | hm, hf | partial | GAP-11, GAP-12, GAP-14, GAP-15 |
| f-03b | Skills — integration, wiring, specialist enrichment | P1, P3 | hm, hf | partial | GAP-13 |
| f-03c | Tools — OpenCode innate tools, stacking, chaining | P3 | both | partial | GAP-06, GAP-09 |
| f-03d | MCP Tools — installed server/tool integration | P3 | hf | not-started | GAP-06, GAP-08 |
| f-03e | Custom Tools — harness + user project tools under `.opencode/tools/` | P3 | hf | partial | GAP-06, GAP-09 |
| f-03f | Hooks — event subscriptions, injections, transforms | P2, P3 | hm, hf | partial | GAP-31, GAP-34 |
| f-04 | Auto-Commands & Workflow Router — intent → command → agent → skill → tool | P1, P2, P3 | both | not-started | GAP-16, GAP-17, GAP-18, GAP-19 |
| f-05 | CLI Install, configs.json, Onboarding | P3, P4 | hf | not-started | GAP-01, GAP-02, GAP-03, GAP-04, GAP-05 |
| f-06 | Delegation Revamp — background, async, graph-based, multi-lane | P1, P2 | hm | partial | GAP-20, GAP-21, GAP-22, GAP-23, GAP-24, GAP-25 |
| f-07 | Trajectory, Task-Plus, Agent-Work-Contract | P1, P2 | hm | partial | GAP-26, GAP-27, GAP-28, GAP-29, GAP-30 |
| f-08 | Context Engine, Event-Tracker Redesign, Compaction | P2 | hm | partial | GAP-31, GAP-32, GAP-33 |
| f-09+ | Long-Haul Sessions, SDK Injections, Specialist Tools | P2, P4 | hm, hf | not-started | GAP-34, GAP-35, GAP-36, GAP-37, GAP-38, GAP-39 |

### 5.2 Custom Tools Criteria Reference

> **See:** `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` for the criteria governing which features become custom tools vs hooks vs libs.

---

## 6. Workstream Dependency Order

### 6.1 Proposed Workstream Graph (from Reference Skeleton)

```text
WS-0  Ecosystem Re-map and Reality Audit              ✅ COMPLETE (HER-0)
  │
  ├── WS-1  .hivemind State + Planning Architecture    ✅ COMPLETE (HER-1 + HER-2)
  │     │
  │     ├── WS-3  Primitive Registry / Control Pane    ⏳ READY (needs new HER phase)
  │     │     │
  │     │     ├── WS-4  Auto-Commands & Workflow Router ⏳ BLOCKED on WS-3
  │     │     │
  │     │     ├── WS-5  Delegation Revamp               ⏳ BLOCKED on WS-3
  │     │     │     │
  │     │     │     └── WS-6  Trajectory / Task-Plus    ⏳ BLOCKED on WS-5
  │     │     │           │
  │     │     │           └── WS-7  Context / Compaction ⏳ BLOCKED on WS-6
  │     │     │
  │     │     └── WS-8  Sidecar + User Config UI        ⏳ BLOCKED on WS-3
  │     │
  │     └── WS-2  Bootstrap / CLI / Init / Onboarding   ⏳ READY (needs new HER phase)
```

### 6.2 Recommended Execution Order

| Priority | Workstream | Depends On | Unblocks | HER Mapping |
|----------|-----------|------------|----------|-------------|
| 1 | WS-0 (COMPLETE) | — | Everything | HER-0 ✅ |
| 2 | WS-1 (COMPLETE) | WS-0 | WS-2, WS-3 | HER-1 ✅, HER-2 ✅ |
| 3 | WS-3 Primitive Registry | WS-0, WS-1 | WS-4, WS-5, WS-8 | New HER phase needed |
| 4 | WS-2 Bootstrap/CLI | WS-1 (start), WS-3 (finalize) | WS-8 | New HER phase needed |
| 5 | WS-4 Auto-Commands | WS-3 | End-user workflows | New HER phase needed |
| 6 | WS-5 Delegation Revamp | WS-3 | WS-6 | New HER phase needed |
| 7 | WS-6 Trajectory/Task-Plus | WS-1, WS-5 | WS-7 | New HER phase needed |
| 8 | WS-7 Context/Compaction | WS-1, WS-6 | Long-haul survival | HER-3 (blocked) |
| 9 | WS-8 Sidecar/UI | WS-1, WS-2, WS-3 | User-facing product | New HER phase needed |

### 6.3 Parallelization Opportunities

- WS-2 and WS-3 can run in parallel after WS-1 (WS-2 starts, WS-3 starts, WS-2 finalizes after WS-3 stabilizes)
- WS-4, WS-5 can run in parallel after WS-3 completes
- WS-8 can start partial work after WS-1 + WS-2

---

## 7. HER Phase Cross-References

### 7.1 Current HER State

| Phase | Goal | Status | Depends On |
|-------|------|--------|------------|
| HER-0 | Ecosystem Re-map & Reality Audit | ✅ COMPLETE | — |
| HER-1 | Documentation & Configuration Recovery | ✅ COMPLETE | HER-0 |
| HER-2 | Dead Code Cleanup | ✅ COMPLETE | HER-1 |
| HER-3 | Context & Compaction | 🔴 BLOCKED | HER-2 (prompt-packet wiring) |
| HER-4 | SDK Integration Depth | 🟢 READY | HER-1 |
| HER-5 | Agent Rationalization | 🟢 READY | HER-1 |

### 7.2 Gap-to-HER Mapping (Proposed New Phases)

The following gaps require new HER phases beyond the current ROADMAP.md:

| Proposed Phase | Covers Gaps | Depends On | Maps to WS |
|---------------|-------------|------------|------------|
| HER-6 (TBD) | GAP-06, GAP-07, GAP-08, GAP-09, GAP-10 | HER-2 | WS-3 |
| HER-7 (TBD) | GAP-01, GAP-02, GAP-03, GAP-04, GAP-05 | HER-2, HER-6 (partial) | WS-2 |
| HER-8 (TBD) | GAP-16, GAP-17, GAP-18, GAP-19 | HER-6 | WS-4 |
| HER-9 (TBD) | GAP-20, GAP-21, GAP-22, GAP-23, GAP-24, GAP-25 | HER-6 | WS-5 |
| HER-10 (TBD) | GAP-26, GAP-27, GAP-28, GAP-29, GAP-30 | HER-9 | WS-6 |
| HER-11 (TBD) | GAP-31, GAP-32, GAP-33, GAP-34, GAP-35, GAP-36 | HER-10 | WS-7 |
| HER-12 (TBD) | GAP-37, GAP-38, GAP-39 | HER-6, HER-7 | WS-8 |

### 7.3 HER-3 Unblock Path

HER-3 (Context & Compaction) is currently blocked. The unblock path requires:
1. prompt-packet wiring (DONE in HER-2)
2. Event-tracker output quality improvement (GAP-31)
3. State architecture finalization (WS-1 patterns applied to context)

---

## 8. Governance Document Map

### 8.1 Documents Requiring Creation

| Document | Purpose | Path(s) | When | Lineage |
|----------|---------|---------|------|---------|
| FEATURE-ECOSYSTEM-MAP | Unified map of all features × paths × lineages | `.planning/research/` | WS-0 (DONE) | hm |
| LINEAGE-BOUNDARY-MATRIX | hm/hf/gate/stack boundary definitions | `.planning/research/` | WS-0 (DONE) | hm |
| MODULE-OWNERSHIP-MATRIX | src/lib/ modules → lifecycle responsibilities | `.planning/research/` | WS-0 (DONE) | hm |
| BOOTSTRAP-ARCHITECTURE | CLI install/init/onboarding architecture | `.planning/workstreams/` | WS-2 | hf |
| CONFIG-SCHEMA | configs.json schema specification | `.planning/workstreams/` | WS-2 | hf |
| ONBOARDING-LIFECYCLE | User onboarding flow specification | `.planning/workstreams/` | WS-2 | hf |
| PRIMITIVE-REGISTRY-ARCHITECTURE | Registry schema and loading rules | `.planning/workstreams/` | WS-3 | hf |
| PERMISSION-COMPILER-SPEC | Per-agent tool access specification | `.planning/workstreams/` | WS-3 | hf |
| AUTO-COMMANDS-ARCHITECTURE | Intent → workflow routing specification | `.planning/workstreams/` | WS-4 | both |
| WORKFLOW-ROUTER-SPEC | Command bundle registry and routing | `.planning/workstreams/` | WS-4 | both |
| DELEGATION-REVAMP-ARCHITECTURE | Multi-lane delegation specification | `.planning/workstreams/` | WS-5 | hm |
| TASK-PLUS-SPEC | Advanced todo/task schema | `.planning/workstreams/` | WS-6 | hm |
| TRAJECTORY-V3-SPEC | Trajectory ledger redesign | `.planning/workstreams/` | WS-6 | hm |
| CONTEXT-ENGINE-ARCHITECTURE | Event-tracker redesign + compaction | `.planning/workstreams/` | WS-7 | hm |
| SIDECAR-RUNWAY | Sidecar read-only state model | `.planning/workstreams/` | WS-8 | hf |

### 8.2 Documents Requiring Update

| Document | What Needs Update | When |
|----------|------------------|------|
| `.planning/PROJECT.md` | Sync with new workstream structure | After WS-3 |
| `.planning/STATE.md` | Current project state | After each HER phase |
| `.planning/ROADMAP.md` | New phases and workstreams | After WS-3 |
| `.planning/codebase/ARCHITECTURE.md` | Module ownership updates | After WS-0 (DONE) |
| `.planning/codebase/STACK.md` | New dependencies | As needed |
| `.planning/codebase/TESTING.md` | Integration test contracts | After WS-3 |
| `.planning/codebase/CONCERNS.md` | New architectural concerns | As discovered |
| `.planning/codebase/INTEGRATIONS.md` | OpenCode runtime integration map | After WS-4/WS-5 |
| `.planning/codebase/CONVENTIONS.md` | Naming conventions, frontmatter schema | After WS-1 |
| `.planning/codebase/STRUCTURE.md` | Directory structure updates | After WS-2 |
| `AGENTS.md` | Agent/skill counts, rules | After HER-1 (DONE) |

### 8.3 `.hivemind/plannings/` Structure (Future)

> **Note:** Migration from `.planning/` to `.hivemind/plannings/` is a WS-1 outcome, not assumed upfront.

Proposed structure (learning from GSD `.planning/` patterns):

```text
.hivemind/plannings/
  PROJECT.md
  STATE.md
  ROADMAP.md
  REQUIREMENTS.md
  MILESTONES.md
  codebase/
    ARCHITECTURE.md
    CONCERNS.md
    CONVENTIONS.md
    INTEGRATIONS.md
    STACK.md
    STRUCTURE.md
    TESTING.md
  research/
    FEATURES.md
    STACK.md
    PITFALLS.md
    PATTERNS.md
    {stack-name}-synthesis.md
  workstreams/
    {workstream-name}/
      CONTEXT.md
      REQUIREMENTS.md
      ROADMAP.md
      STATE.md
      phases/
        {phase-id}-{description}/
          {phase-id}-PLAN.md
          {phase-id}-RESEARCH.md
          {phase-id}-SUMMARY.md
  audits/
  checkpoints/
  debug/
  decisions/
  reports/
  todos/
    pending/
    completed/
```

---

## 9. Config Schema Skeleton

### 9.1 `.hivemind/configs.json` — Core Runtime Configuration

> **Note:** This is a SKELETON. Values shown are defaults. Full schema spec is a WS-2 deliverable.

```jsonc
{
  // ═══ Language ═══
  "conversation_language": "en",
  // Options: "vi" | "en" | "zh" | "fr" | "ja" | "ko" | "de" | "es" | "th" | "id"
  // Full names: Vietnamese, English, Chinese, French, Japanese, Korean,
  //            German, Spanish, Thai, Indonesian

  "documents_and_artifacts_language": "en",
  // Same options as above. Controls artifact/governance document output language.

  // ═══ Mode ═══
  "mode": "expert-advisor",
  // "expert-advisor" (default):
  //   Agent-led with TDD, spec-driven, research-first, systematic planning,
  //   atomic executions, context governance, guardrails, dependency validation.
  //   Always gives best-practice guidance, asks user confirmation before execution.
  //
  // "hivemind-powered":
  //   Stricter, more granular guardrails, hierarchical tracking, cross-context
  //   persistence, auto-routing with thorough explanations and rationales.
  //
  // "free-style":
  //   Follows child control-pane settings. Features/guardrails only available
  //   if child control-panes are active or explicitly requested by user.

  // ═══ User Expertise ═══
  "user_expert_level": "intermediate-high-level",
  // "clumsy-vibecoder" | "beginner-friendly" | "intermediate-high-level" |
  // "architecture-driven" | "absolute-expert"
  // Impacts front-facing agent output style, tech jargon level, elaboration depth.

  // ═══ Delegation ═══
  "delegation_systems": {
    "native_task": true,
    // Always available — OpenCode innate task tool
    "delegate_task": true,
    // Custom delegation via harness (f-06)
    "background_delegation": false
    // Background/async delegation (f-06 advanced)
  },

  // ═══ Execution ═══
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,

  // ═══ Workflows ═══
  "workflow": {
    "research": true,
    "cross_session_tasks_dependencies_validation": false,
    // Validate cross-session abandoned/active/ongoing tasks for safe progression

    "trajectory_control": false,
    // Require front-facing agent to set up trajectory on new session (f-07)

    "advanced_continuity_validation": false,
    // Require advanced continuity check for cross-session delegation resumption

    "task_plus_enabled": false,
    // Advanced task management integrating with planning, delegation, persistence (f-08)

    "plan_check": true,
    "verifier": true,
    "ui_phase": false,
    "ui_safety_gate": false,
    "ai_integration_phase": false,
    "research_before_questions": true,

    "discuss_mode": "sufficient-phase-discussion",
    // "sufficient-phase-discussion":
    //   Surface grey areas with ≥2 questions per area using question tool.
    //   Runs after hm-detective + tech-research + phase-assumption workflow.
    //
    // "intensive-phase-discussion":
    //   Same as above with deep-research evidence, iterative conservative QA.
    //
    // "skip-phase-discussion":
    //   Skip entirely.

    "use_worktrees": false
  }
}
```

### 9.2 Config Loading Rules

- Loaded at every front-facing session start
- Reloaded after each user prompt (only main session, counting n-following-user-prompt)
- Configurable via `hf-workflows` and `hf-commands`
- Automatically routed with `hf-workflow-router` (f-04)

---

## 10. Bootstrap Tree (.hivemind/ Structure)

### 10.1 Proposed Directory Structure

```text
.hivemind/
├── configs.json                          # Core runtime configuration (§9)
├── manifests/                            # System manifests
│   └── .gitkeep
├── hm-brain/                             # hm-* lineage runtime state
│   ├── graph-state.json                  # Task/dependency graph state
│   ├── STATE.md                          # Current hm lineage state
│   ├── advanced-task.json                # Task-plus persistence (f-07)
│   ├── trajectory-ledger.json            # Trajectory nodes/checkpoints (f-07)
│   └── .gitkeep
├── hf-brain/                             # hf-* lineage configuration state
│   ├── health.json                       # System health status
│   ├── hm-primitives-manifest.json       # Installed hm-* primitives inventory
│   ├── hf-primitives-manifest.json       # Installed hf-* primitives inventory
│   ├── check-up-trackings.json           # Doctor/checkup session records
│   ├── doctor-session-records.md         # Doctor mode history
│   ├── customization-session-records.md  # User customization history
│   └── .gitkeep
├── delegation-managements/               # Delegation state (f-06)
│   ├── {session-id}/                     # Per-session delegation records
│   │   ├── delegation-record.json        # Session/sub-session IDs, types, status
│   │   ├── execution-log.json            # Actions, results, metadata
│   │   └── report.md                     # Write-to-disk delegation output
│   └── .gitkeep
├── task-managements/                     # Cross-session task state (f-07, f-08)
│   ├── tasks.json                        # Active/completed/blocked task registry
│   ├── continuity.json                   # Cross-session context persistence
│   ├── dependencies.json                 # Task dependency graph
│   └── .gitkeep
├── plannings/                            # Governance artifacts (§8.3)
│   ├── PROJECT.md
│   ├── STATE.md
│   ├── ROADMAP.md
│   ├── REQUIREMENTS.md
│   ├── MILESTONES.md
│   ├── codebase/
│   │   ├── ARCHITECTURE.md
│   │   ├── CONCERNS.md
│   │   ├── CONVENTIONS.md
│   │   ├── INTEGRATIONS.md
│   │   ├── STACK.md
│   │   ├── STRUCTURE.md
│   │   └── TESTING.md
│   ├── research/
│   ├── workstreams/
│   ├── audits/
│   ├── checkpoints/
│   ├── debug/
│   ├── decisions/
│   ├── reports/
│   ├── todos/
│   │   ├── pending/
│   │   └── completed/
│   └── .gitkeep
├── journal/                              # Session journal (append-only)
│   └── .gitkeep
├── lineage/                              # Execution lineage records
│   └── .gitkeep
├── event-tracker/                        # Event tracking output (f-08)
│   ├── {session-id}.json
│   ├── {session-id}.md
│   └── .gitkeep
├── sidecar/                              # Sidecar state (f-09+, WS-8)
│   └── .gitkeep
├── onboarding/                           # Onboarding session records (f-05)
│   └── .gitkeep
├── registries/                           # Primitive registries (f-03x, WS-3)
│   ├── agents.json
│   ├── skills.json
│   ├── commands.json
│   ├── tools.json
│   ├── mcp-tools.json
│   ├── custom-tools.json
│   ├── hooks.json
│   └── .gitkeep
├── runtime/                              # Runtime state
│   └── .gitkeep
├── artifacts/                            # Generated artifacts
│   └── .gitkeep
└── logs/                                 # System logs
    └── .gitkeep
```

### 10.2 File Format Conventions

| Format | Use Case | Requirements |
|--------|----------|-------------|
| `.json` | Machine-queryable state, configs, registries | Strict schema validation |
| `.md` | Human-readable documents, reports, governance | YAML frontmatter + XML-tagged body sections |
| `.yaml` | Primitive definitions, workflow templates | Schema validation |
| `.gitkeep` | Directory registration | Empty files, ensures git tracking |

### 10.3 Frontmatter Schema Requirements

All `.md` files under `.hivemind/` must include:

```yaml
---
id: unique-identifier
type: {document-type}
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: {draft|active|complete|deprecated}
lineage: {hm|hf|shared|internal}
path: {P1|P2|P3|P4|multiple}
dependencies: [list-of-ids]
related: [list-of-ids]
---
```

Body must support:
- TOC (table of contents)
- Jump links (`#section-anchor`)
- XML tags for machine-readable sections
- Metadata grep/query fields
- Heading-based intra-doc and cross-doc navigation

---

## 11. Online References

### 11.1 OpenCode Platform Documentation

| Resource | URL | Relevance |
|----------|-----|-----------|
| Commands | https://opencode.ai/docs/commands/ | f-04 auto-commands, slash command architecture |
| Plugins/Hooks | https://opencode.ai/docs/plugins/#events | f-03f hooks, event subscriptions |
| Compaction Hooks | https://opencode.ai/docs/plugins/#compaction-hooks | f-09+ context survival |
| SDK | https://opencode.ai/docs/sdk/ | f-09+ SDK injections, primitive control |
| Server API | https://opencode.ai/docs/server/ | f-09+ server integration |

### 11.2 OpenCode Ecosystem Projects

| Project | URL | Relevance |
|---------|-----|-----------|
| opencode-pty | https://github.com/shekohex/opencode-pty | Background tasks, non-interactive commands, multi-session (f-06 lanes) |
| background-agents | https://github.com/kdcokenny/opencode-background-agents | Background agent patterns for delegation (f-06) |
| awesome-opencode | https://github.com/awesome-opencode/awesome-opencode | Curated ecosystem — patterns, plugins, tools synthesis |
| opencode-dynamic-context-pruning | https://github.com/Opencode-DCP/opencode-dynamic-context-pruning | Context management patterns (f-08) |

### 11.3 Framework References

| Framework | URL | Relevance |
|-----------|-----|-----------|
| GSD (Get Shit Done) | https://github.com/gsd-build/get-shit-done/tree/main/docs | Planning structure, workflow patterns, phase management |
| OMO (Oh-My-OpenAgent) | https://github.com/code-yeongyu/oh-my-openagent | Plugin system design, hook patterns, session continuity |

> **Warning:** All synthesis from GSD/OMO must be transformed to hm-*/hf-* conventions. Do NOT copy GSD naming, prefixes, or patterns directly.

### 11.4 Local Reference Files

| File | Path | Relevance |
|------|------|-----------|
| OpenCode Ecosystem Directories | `.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md` | Local copy of awesome-opencode |
| Custom Tools Criteria | `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` | Criteria for custom tool classification |

---

## 12. On-Disk Artifact Reference Table

### 12.1 Source Documents (This Skeleton's Inputs)

| Artifact | Path | Lines | Status |
|----------|------|-------|--------|
| Poor Prompt (source) | `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` | 842 | Consumed |
| Reference Skeleton (v1) | `.planning/SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md` | 985 | Superseded by this v2 |
| HER ROADMAP | `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` | 150 | Current |

### 12.2 HER-0 Ecosystem Map (Evidence Base)

| Artifact | Path |
|----------|------|
| Ecosystem Map (SOT) | `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md` |
| Phase Summary | `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md` |
| Reconciliation Matrix | `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md` |

### 12.3 UAT Evidence (Team B)

| Artifact | Path |
|----------|------|
| UAT Master Plan | `.hivemind/uat/team-b/UAT-MASTER-PLAN-2026-05-05.md` |
| Batch Results (1-11) | `.hivemind/uat/team-b/results/team-b-batch-{1-11}-*.md` |
| Critical Blockers | `.hivemind/uat/team-b/results/team-b-critical-*.md` |

### 12.4 Governance Documents

| Artifact | Path |
|----------|------|
| Project AGENTS.md | `AGENTS.md` (project root) |
| Planning PROJECT.md | `.planning/PROJECT.md` |
| Planning STATE.md | `.planning/STATE.md` |
| Planning ROADMAP.md | `.planning/ROADMAP.md` |
| Codebase Architecture | `.planning/codebase/ARCHITECTURE.md` |

### 12.5 Legacy Concept Archive (Concepts Only — NOT Code)

| Artifact | Path |
|----------|------|
| Product Detox Archive | `product-detox/.archive/legacy-src-*/` |
| Legacy hooks/ | `product-detox/.archive/legacy-src-*/hooks/` |
| Legacy lib/ | `product-detox/.archive/legacy-src-*/lib/` |
| Legacy schemas/ | `product-detox/.archive/legacy-src-*/schemas/` |
| Legacy tools/ | `product-detox/.archive/legacy-src-*/tools/` |

---

## 13. Conflict Resolution Log

### 13.1 Conflicts Resolved During Synthesis

| # | Conflict | Source A | Source B | Resolution |
|---|----------|----------|----------|------------|
| 1 | Workstream numbering mismatch | Poor prompt uses f-04 for auto-commands, f-05 for CLI | Reference skeleton uses WS-2 for CLI, WS-4 for auto-commands | Adopted WS numbering from reference skeleton as canonical. Feature refs (f-*) preserved as cross-references. |
| 2 | HER phase scope ambiguity | Poor prompt suggests immediate implementation of f-05 through f-09 | Reference skeleton recommends research-first approach | Adopted Option 3 (re-map → re-plan → build) as authoritative strategy. All new features deferred behind WS-3. |
| 3 | Path classification inconsistency | Poor prompt mixes governance (P3) with onboarding (P4) in same section | Reference skeleton cleanly separates P3 and P4 | Adopted clean 4-path separation from reference skeleton. Configs.json spans P3+P4. |
| 4 | Lineage ownership confusion | Poor prompt sometimes assigns hf ownership to runtime features | Reference skeleton assigns hm to runtime consumption, hf to configuration | Adopted strict lineage boundary: hf configures, hm consumes. Both lineages benefit from shared infrastructure. |

### 13.2 Deliberate Omissions

| Omitted | Reason |
|---------|--------|
| Product-detox file listings (lines 654-822 of poor prompt) | Inlined directory trees from legacy archive — preserved only concept reference in §12.5 |
| Worktree-specific paths (harness-experiment) | These are build-environment paths, not project structure. Referenced only in UAT evidence paths. |
| GSD agent/skill/command listings | GSD primitives are development tools, not shipped features. Excluded from gap inventory. |
| Detailed implementation specs for each gap | This is a skeleton. Implementation specs are WS deliverables. |
| `.hivefiver-meta-builder/` paths | Internal build environment, not part of shipped product structure. |

### 13.3 Concerns About Accuracy

| Concern | Risk Level | Mitigation |
|---------|------------|------------|
| GAP state classifications may be outdated (some modules may have been wired since HER-2) | MEDIUM | Cross-reference with HER-2 completion artifacts before creating new phases |
| Feature refs (f-03 through f-09) may have hidden sub-dependencies | LOW | Each WS deliverable must include its own dependency audit |
| configs.json schema is speculative (not yet implemented) | HIGH | Must be validated against actual OpenCode SDK capabilities before WS-2 starts |
| Bootstrap tree structure may need adjustment based on actual runtime requirements | MEDIUM | WS-1 architecture phase should validate and refine |

---

## Document Metadata

| Field | Value |
|-------|-------|
| **File** | `.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md` |
| **Compression Tier** | 3 (Validated Report) |
| **Sources Ingested** | 3 |
| **Conflicts Resolved** | 4 |
| **Confidence** | MEDIUM |
| **Total Gaps Classified** | 39 |
| **Feature Refs Mapped** | f-03a through f-09+ |
| **HER Phases Cross-Referenced** | HER-0 through HER-5 + 7 proposed |
| **Workstreams Framed** | WS-0 through WS-8 |
| **Governance Documents Mapped** | 15 created + 11 updated |
| **Online References** | 9 URLs |
| **Next Action** | Create HER-6 (Primitive Registry / Control Pane) or HER-4 (SDK Integration Depth) based on user priority |

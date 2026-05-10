# Gap Matrix: Hivemind Harness Feature Analysis

**Date:** 2026-05-05  
**Sources:**
- `IMPLEMENTATION-INVENTORY-2026-05-05.md` — full `src/` inventory (175 files, 23,360 LOC)
- `legacy-concept-catalog-2026-05-05.md` — 84 legacy concepts, 16 unique missing patterns
- `gsd-framework-reconnaissance.md` — GSD framework patterns analysis

---

## Summary

| Metric | Count |
|--------|-------|
| Total features analyzed | 20 |
| Fully implemented | 4 |
| Partially implemented | 14 |
| Not implemented | 1 |
| Dead code / unwired | 1 |

### By Path

| Path | FULL | PARTIAL | NONE | DEAD |
|------|------|---------|------|------|
| Path 1: Agent-Callable Tools & Skills | 2 | 4 | 1 | 0 |
| Path 2: Runtime Programmatic | 3 | 6 | 0 | 0 |
| Path 3: Governance, Permissions, Registry | 0 | 4 | 0 | 0 |
| Path 4: Side-Car & Onboarding | 0 | 2 | 1 | 1 |

### By Lineage

| Lineage | FULL | PARTIAL | NONE | DEAD |
|---------|------|---------|------|------|
| hm-* (product dev) | 4 | 14 | 1 | 1 |
| hf-* (meta-builder) | 4 | 14 | 1 | 1 |

> **Note:** Lineage counts are identical because the harness provides shared infrastructure consumed by both lineages. Differences are noted in per-feature gap descriptions.

---

## Matrix

| Feature | Path | Lineage | Current State | Gap Description | Priority | Source Evidence |
|---------|------|---------|---------------|-----------------|----------|-----------------|
| **F-03a** Agents registry & routing | 1 | hm+hf | PARTIAL | `primitive-loader.ts` (334 LOC), `primitive-scanners.ts` (182 LOC), `primitive-registry.ts` (291 LOC) implement scanning and registry. 90 agent files in `.opencode/agents/`. **Missing:** No runtime agent metadata resolution (capabilities, constraints, tool permissions per agent). No dynamic skill→agent routing engine in `src/` (exists only as `.opencode/skills/hm-l2-skill-router` and `hf-l2-skill-router` — soft skills, not hard code). No agent health tracking or capability negotiation. | HIGH | Inventory: `src/lib/primitive-loader.ts`, `src/lib/primitive-scanners.ts`, `src/lib/primitive-registry.ts`; 90 agent files in `.opencode/agents/` |
| **F-03b** Skills registry | 1 | hm+hf | PARTIAL | 58 skill directories in `.opencode/skills/`. `primitive-scanners.ts:scanSkillFile()` parses SKILL.md frontmatter. **Missing:** No L0-L3 progressive disclosure engine (legacy Z9 pattern). No trigger matching at runtime (skills declare triggers but no code evaluates them). No skill status tracking (active/experimental/deprecated). No skill dependency resolution. Legacy `schemas/skill-registry.ts` had SkillBundle enum and SkillMetadata — not ported. | MED | Inventory: `src/lib/primitive-scanners.ts`; Legacy: Z9 Skill Registry Schema |
| **F-03c** Tools wiring | 1 | hm+hf | FULL | All 5 core tools exist and are registered in `plugin.ts`: `delegate-task.ts` (75 LOC), `delegation-status.ts` (135 LOC), `prompt-skim/tools.ts` (107 LOC), `prompt-analyze/tools.ts` (169 LOC), `session-patch/tools.ts` (136 LOC). Plus 11 additional hivemind-* tools. All 23 tool files confirmed registered. | — | Inventory: `src/tools/` section (23 files, all IMPLEMENTED) |
| **F-03d** MCP server integration | 1 | hm+hf | NONE | No MCP-specific discovery, configuration, or registration code exists in `src/`. `configure-primitive.ts` handles primitive compilation but has no MCP tool type. No MCP client/server abstraction. The MCP tools visible in AGENTS.md (gitmcp_*, deepwiki_*, context7_*) are external providers, not harness-managed. | LOW | Inventory: No MCP-related files in `src/` |
| **F-03e** Custom tools compilation | 1 | hm+hf | PARTIAL | `config-compiler.ts` (410 LOC) has `compileAgent`, `compileCommand`, `compileSkill`, `decompileAgent`, `decompileCommand`. `configure-primitive.ts` (490 LOC) handles full compile/decompile/validate workflow. **Missing:** No `compileTool` function (tools are hardcoded in `plugin.ts`, not user-definable). No plugin SDK surface for user-defined tools with Zod schemas (legacy `hf-l2-custom-tools-dev` skill describes the pattern but no runtime support). | MED | Inventory: `src/lib/config-compiler.ts`, `src/tools/configure-primitive.ts` |
| **F-03f** Background PTY sessions | 1 | hm+hf | FULL | `pty/` subdirectory has 5 files (PtyManager, pty-types, pty-buffer, pty-runtime, bun-pty.d.ts). `run-background-command.ts` tool (221 LOC) registered in plugin.ts. Bun-pty integration with graceful fallback (`pty-runtime.ts:21`). PTY session spawn/read/list/kill all implemented and wired. | — | Inventory: `src/lib/pty/` (5 files), `src/tools/run-background-command.ts` |
| **F-04a** hm-auto-commands | 2 | hm | PARTIAL | `command-engine/` (2 files, 354 LOC) has `discoverCommandBundles`, `renderCommandContext`, `previewRoute`. 30 hm-* skills in `.opencode/skills/`. 7 core + 3 test commands in `.opencode/commands/`. **Missing:** No auto-routing of hm-* skill intents to commands. No intent→domain→skill→agent pipeline in `src/` (hm-l2-lineage-router is a skill, not runtime code). Command discovery works for commands but not for skill-to-command bridging. | MED | Inventory: `src/lib/command-engine/`; `.opencode/commands/` (18 files) |
| **F-04b** hf-auto-commands | 2 | hf | PARTIAL | Same infrastructure as F-04a. 11 hf-* skills, 7 extended commands. **Missing:** Same gap — no hf-specific auto-routing. hf-l2-skill-router is a skill document, not runtime code. | MED | Inventory: `src/lib/command-engine/`; `.opencode/commands/` (18 files) |
| **F-04c** Workflow router | 2 | hm+hf | PARTIAL | `session-entry/intake-gate.ts` (148 LOC) has `resolveIntake` and `PURPOSE_TO_ROUTING_TARGET` — **but NOT wired to plugin.ts** (dead code). `command-engine/` routes commands only. **Missing:** No unified intent→domain→skill→agent routing in runtime. Legacy had session-intent-classifier (S4) with 6 categories — partially exists in session-entry/purpose-classifier.ts but unwired. The routing pipeline needs: intent classification → domain resolution → skill bundle selection → agent dispatch. | HIGH | Inventory: `src/lib/session-entry/` (5 files, ALL UNUSED); Legacy: S4 Session Intent Classifier |
| **F-05** CLI installation + configs.json + onboarding | 2 | hm+hf | PARTIAL | `src/cli/` has 5 files. `config-workflow/` has 5 files (355 LOC) implementing turn-based workflow with persistence. `runtime-policy.ts` (267 LOC) handles config loading. **Missing:** No `configs.json` compilation pipeline. No onboarding flow (welcome wizard, initial config generation, first-run detection). No CLI installation script or user-facing setup command. Legacy had Framework Context (P6) with framework detection and selection menu — not ported. | MED | Inventory: `src/cli/`, `src/lib/config-workflow/`, `src/lib/runtime-policy.ts` |
| **F-06** Custom delegation revamp | 2 | hm+hf | PARTIAL | Core delegation infrastructure is mature: `delegation-manager.ts` (468 LOC), `delegation-state-machine.ts` (426 LOC), `sdk-delegation.ts` (281 LOC), `command-delegation.ts` (418 LOC), `delegation-persistence.ts` (189 LOC). Strategy pattern with SDK/Command handlers. **Missing:** Trajectory integration with delegation (trajectory module exists but not connected to delegation dispatch). No delegation packet compilation from agent-work-contracts. No delegation recovery with checkpoint/repair (recovery-engine.ts is a dead facade). The "revamp" requires connecting: trajectory ledger → agent work contracts → delegation manager. | HIGH | Inventory: `src/lib/delegation-*.ts` (4 files), `src/lib/trajectory/` (4 files), `src/lib/agent-work-contracts/` (4 files), `src/lib/recovery-engine.ts` (DEAD) |
| **F-07a** Trajectory ledger | 2 | hm+hf | FULL | `trajectory/` subdirectory has 4 files (types.ts 128 LOC, ledger.ts 93 LOC, store-operations.ts 190 LOC, index.ts). `hivemind-trajectory.ts` tool (112 LOC) registered in plugin.ts. `createTrajectoryCheckpoint`, `attachTrajectoryEvidence`, `inspectTrajectoryLedger` all implemented and wired. | — | Inventory: `src/lib/trajectory/`, `src/tools/hivemind-trajectory.ts` |
| **F-07b** Task-plus system | 2 | hm+hf | FULL | `agent-work-contracts/` has 4 files (types.ts 89 LOC, store.ts 146 LOC, operations.ts 162 LOC, index.ts). `hivemind-agent-work.ts` tool (152 LOC) registered. `createAgentWorkContract`, `exportAgentWorkContract` implemented with pressure-aware creation. | — | Inventory: `src/lib/agent-work-contracts/`, `src/tools/hivemind-agent-work.ts` |
| **F-07c** Agent work contracts | 2 | hm+hf | FULL | Subsumed by F-07b. `agent-work-contracts/operations.ts` handles structured delegation packet creation and export. Pressure score, allowed surfaces, verification commands all part of the contract type. | — | Inventory: `src/lib/agent-work-contracts/types.ts` (AgentWorkContract type) |
| **F-08a** Context/event-tracker overhaul | 3 | hm+hf | PARTIAL | `event-tracker/` has 11 files (all IMPLEMENTED and wired). `hivemind-doc` tool for doc intelligence. `hivemind-pressure` tool for runtime pressure. `runtime-pressure/` subdirectory (5 files, 625 LOC) with authority matrix. **Missing:** No cognitive packer (legacy C1 — compile all state into XML for system injection). No injection orchestrator (legacy C3 — budget-aware channel-based injection with ledger). No staleness detection (legacy C5). No budget manager (legacy C4). The event-tracker captures events but does not compile them into context for session injection. | HIGH | Inventory: `src/lib/event-tracker/` (11 files), `src/lib/runtime-pressure/` (5 files); Legacy: C1, C3, C4, C5 |
| **F-08b** Permission model | 3 | hm+hf | PARTIAL | `runtime-pressure/authority-matrix.ts` (252 LOC) has `TOOL_AUTHORITY_MATRIX` and `resolveToolAuthority`. `category-gates.ts` (59 LOC) has gate decisions. `runtime-pressure/control-plane.ts` (161 LOC) has pressure-aware control plane. **Missing:** No full allow/ask/ask per tool per agent depth. No tool tier classification (universal/workflow/deterministic — legacy H3). No role-based tool access enforcement at runtime. The authority matrix exists but is not connected to agent dispatch permission checks. Legacy tool-gate hook had tier classification + role-based enforcement — not ported. | HIGH | Inventory: `src/lib/runtime-pressure/authority-matrix.ts`, `src/lib/category-gates.ts`; Legacy: H3 Tool Gate Hook |
| **F-08c** Tool capability matrix | 3 | hm+hf | PARTIAL | `hm-l3-tool-capability-matrix` exists as a SKILL document (documentation only, not runtime code). `authority-matrix.ts` has partial runtime implementation. `agent-primitive-policy.ts` (51 LOC) enriches agents with primitive permissions. **Missing:** No compiled tool capability registry at runtime. No lineage-specific permission rules (hm STRICT, hf FLEXIBLE mentioned in AGENTS.md but not coded). No per-depth permission profiles. No tool exposure audit capability. | MED | Inventory: `src/lib/runtime-pressure/authority-matrix.ts`, `src/lib/spawner/agent-primitive-policy.ts`; Skill: `.opencode/skills/hm-l3-tool-capability-matrix/` |
| **F-08d** Quality gate triad | 3 | hm+hf | PARTIAL | `control-plane/gatekeeper.ts` (212 LOC) has `BLOCKING_GATES` and `NON_BLOCKING_GATES` with `createGatekeeper`. Three gate skills exist: `gate-l3-evidence-truth`, `gate-l3-lifecycle-integration`, `gate-l3-spec-compliance`. `hm-l2-gate-orchestrator` skill coordinates the triad. **Missing:** No runtime G0-G5 gate system (legacy T14 hiveops-gate). No gate evidence storage and retrieval at runtime. No gate failure remediation routing. The gate skills are documentation/workflow — not executable runtime gates with evidence collection. The control-plane/gatekeeper handles delegation gates but not quality gates. | MED | Inventory: `src/lib/control-plane/gatekeeper.ts`; Skills: `gate-l3-*`, `hm-l2-gate-orchestrator`; Legacy: T14 hiveops-gate |
| **F-09a** Long-haul compaction survival | 4 | hf | DEAD | `prompt-packet/compaction-preservation.ts` (108 LOC) exists but is UNUSED — only imported by the also-unused `work-contract/compaction-packet.ts`. `prompt-packet/kernel-packet.ts` (149 LOC) and `delegation-packet.ts` (73 LOC) are also dead. **Missing:** No custom summarizer hooked into OpenCode's compaction cycle. No context preservation across compaction events. No critical state marker injection into compacted context. All 4 prompt-packet files need wiring to runtime. | HIGH | Inventory: `src/lib/prompt-packet/` (4 files, ALL UNUSED) |
| **F-09b** SDK hooks/events | 4 | hf | PARTIAL | 8 hook files in `src/hooks/`: `create-session-hooks.ts` (285 LOC), `create-tool-guard-hooks.ts` (156 LOC), `create-core-hooks.ts` (106 LOC), `tool-after-composer.ts` (71 LOC), `messages-transform.ts` (58 LOC), `plugin-event-observers.ts` (49 LOC), `hook-cqrs-boundary.ts` (36 LOC). PreToolUse and PostToolUse patterns exist in tool-guard hooks. Session lifecycle events handled in session hooks. **Missing:** No CQRS state mutation queue (legacy P2 — hooks queue mutations, tools flush). No soft governance counter engine (legacy H2 — 15+ governance metrics). No compaction hook (legacy H4). No config hot-reload per hook invocation (replaced by runtime-policy.ts but different pattern). No session coherence validation (legacy H8). | MED | Inventory: `src/hooks/` (8 files); Legacy: H2, H4, H8, H11, H12 |
| **F-09c** Specialist tools for dashboard | 4 | hf | PARTIAL | `hivemind-doc.ts` (45 LOC) — read-only doc intelligence queries. `hivemind-sdk-supervisor.ts` (53 LOC) — health check and diagnostics. `session-journal-export.ts` (117 LOC) — journal export. `validate-restart.ts` (116 LOC) — primitive discovery validation. `hivemind-command-engine.ts` (58 LOC) — command bundle discovery. **Missing:** No dedicated side-car dashboard tool suite. No real-time state query for `.hivemind/` contents. No trajectory visualization queries. No delegation lineage visualization. The existing tools provide raw data but no dashboard-specific aggregation. Per Q2, the side-car is READ-ONLY for canonical state — tools exist but are not organized for dashboard consumption. | LOW | Inventory: `src/tools/hivemind-doc.ts`, `src/tools/hivemind-sdk-supervisor.ts`, `src/tools/session-journal-export.ts` |
| **F-09d** Configuration compilation | 4 | hf | PARTIAL | `config-compiler.ts` (410 LOC) has compile/decompile for agents, commands, skills. `config-workflow/` (5 files) has turn-based compile workflow with persistence. `runtime-policy.ts` (267 LOC) loads runtime policy from `.planning/config.json`. **Missing:** No `configs.json` → runtime policy → agent setup pipeline. No batch configuration compilation (all primitives at once). No configuration conflict detection across primitives. No workspace-level config inheritance. GSD's `config.json` pattern (model_profile, branching_strategy, workflow flags) is richer than current `runtime-policy.ts`. | MED | Inventory: `src/lib/config-compiler.ts`, `src/lib/config-workflow/`, `src/lib/runtime-policy.ts`; GSD: `.planning/config.json` schema |

---

## Unwired Subsystems Detail

The implementation inventory identifies **7 unwired subsystems** (2,596 LOC, ~14.5% of `src/lib/`). Each represents implemented code with zero runtime consumers:

### 1. Prompt Packet (330 LOC) — **CRITICAL for F-09a**
- `prompt-packet/kernel-packet.ts` (149 LOC) — Builds kernel-level prompt packets
- `prompt-packet/delegation-packet.ts` (73 LOC) — Builds delegation prompt packets
- `prompt-packet/compaction-preservation.ts` (108 LOC) — Preserves critical state during compaction
- **Gap:** Only `compaction-preservation.ts` is imported (by the also-dead `work-contract/`). Zero plugin.ts or tool consumers.
- **Impact:** F-09a (long-haul compaction survival) is completely blocked. Context is lost on compaction events.

### 2. Session Entry (644 LOC) — **CRITICAL for F-04c**
- `session-entry/purpose-classifier.ts` (195 LOC) — Classifies session purpose (6 categories)
- `session-entry/language-resolution.ts` (153 LOC) — Detects language
- `session-entry/profile-resolver.ts` (148 LOC) — Resolves session profile
- `session-entry/intake-gate.ts` (148 LOC) — Routes based on purpose (`PURPOSE_TO_ROUTING_TARGET`)
- **Gap:** Entire intake pipeline is dead. Not wired to plugin.ts or any tool.
- **Impact:** F-04c (workflow router) has no runtime intent classification. Agents receive no automatic routing.

### 3. Supervisor (287 LOC) — **Needed for F-09c**
- `supervisor/health.ts` (125 LOC) — Health status and diagnostics
- `supervisor/command-bundle.ts` — Command bundle sorting and routing
- `supervisor/context-renderer.ts` (62 LOC) — Supervisor context rendering
- `supervisor/messages-transform.ts` (83 LOC) — Message transformation for supervisor mode
- **Gap:** Not wired to plugin.ts or any tool.
- **Impact:** F-09c (specialist dashboard tools) has no health aggregation or context rendering capability.

### 4. Runtime Detection (497 LOC partial) — **Needed for F-08a**
- `runtime-detection/codemap.ts` (109 LOC) — Codebase mapping
- `runtime-detection/codescan.ts` (176 LOC) — Codebase scanning
- `runtime-detection/file-watcher.ts` (122 LOC) — Package.json watching
- `runtime-detection/stack-synthesizer.ts` (90 LOC) — Tech stack synthesis (USED by framework-detector)
- **Gap:** Only stack-synthesizer is used. Codemap, codescan, and file-watcher are dead.
- **Impact:** F-08a context compilation lacks automated codebase intelligence gathering.

### 5. Work Contract (singular, 613 LOC) — **Superseded**
- `work-contract/agent-work-contract.ts` (182 LOC) — Replaced by `agent-work-contracts/`
- `work-contract/intent-classifier.ts` (120 LOC) — Chain-based intent classification
- `work-contract/chain-executor.ts` (208 LOC) — Chain execution context
- `work-contract/compaction-packet.ts` (81 LOC) — Contract to compaction conversion
- **Gap:** Entire directory has NO external consumers. Superseded by `agent-work-contracts/` (plural).
- **Impact:** Dead weight. Should be removed or merged patterns into active module.

### 6. Auto-Loop / Ralph-Loop (328 LOC) — **Needed for F-06**
- `auto-loop.ts` (146 LOC) — `runAutoLoop` pure function, zero consumers
- `ralph-loop.ts` (182 LOC) — `runRalphLoop` pure function, zero consumers
- **Gap:** Both loop primitives are fully implemented with zero runtime consumers.
- **Impact:** F-06 (delegation revamp) has no autonomous loop capability despite implemented code.

### 7. Recovery Engine (72 LOC facade) — **Needed for F-06**
- `recovery-engine.ts` (72 LOC) — Facade bundling all 4 recovery operations
- `recovery/` subdirectory (4 files, 734 LOC) — Full recovery subsystem (assess-state, repair-state, create-checkpoint, failure-classes)
- **Gap:** Recovery subdirectory modules are implemented and used by the facade. But the facade itself is imported by nobody. The recovery subsystem is the deepest dead chain.
- **Impact:** F-06 delegation recovery cannot use the implemented checkpoint/repair pipeline.

---

## Legacy Concept Mapping

Of the 16 unique legacy patterns identified as missing from the current harness, this matrix maps each to the feature gaps they would fill:

| Legacy Pattern | Gap Addressed | Feature(s) | Re-implementation Priority |
|---------------|---------------|------------|---------------------------|
| **CQRS State Mutation Queue** (P2) | Hook write-safety mechanism | F-09b | HIGH — hooks need write queue for governance |
| **Cognitive Packer** (C1) | State→context compilation | F-08a | HIGH — context awareness requires state compilation |
| **Injection Orchestrator** (C3) | Budget-aware context injection | F-08a | HIGH — without this, injection is ad-hoc |
| **Tool Tier Classification** (H3) | Tool governance foundation | F-08b | HIGH — role-based tool access blocks governance |
| **Session Intent Classifier** (S4) | Session purpose routing | F-04c | HIGH — unwired session-entry/ already has this |
| **Budget Manager** (C4) | Context window budgeting | F-08a | MED — needed for injection orchestrator |
| **Staleness Detection** (C5) | Memory/knowledge relevance | F-08a | MED — long session state management |
| **Q.U.A.N.T. Clarity Scoring** (P4) | Spec quality validation | F-08d | MED — useful for quality gates |
| **Format Weaver Interface** (D1-D5) | Multi-format doc operations | F-08a | MED — extend existing hivemind-doc |
| **FK Validation** (G1) | Graph node integrity | F-08d | MED — needed if knowledge graph added |
| **Agent Declaration Protocol** (T12) | Self-awareness at turn start | F-03a | MED — agent metadata enrichment |
| **Brain State Field Lifecycle** (Z1) | Smart state serialization | F-09a | MED — runtime/persistent field separation |
| **Progressive Disclosure** (Z9) | Skill loading depth control | F-03b | LOW — L0-L3 skill loading |
| **Orphan Quarantine** (G6) | Graph node recovery | F-08d | LOW — needed only with graph layer |
| **SOT Artifact Registry** (T15) | Tagged artifact tracking | F-08d | LOW — knowledge management |
| **Chain Break Detection** (P10) | Hierarchy integrity | F-08d | LOW — governance pattern |

---

## GSD Pattern Adoption Opportunities

The GSD framework provides battle-tested patterns that directly address identified gaps:

### 1. State Machine Discipline → F-06 (Delegation Revamp)

**GSD Pattern:** `STATE.md` as single source of truth with atomic read-modify-write. Status progression: `Ready to Plan → Planning → Ready to Execute → In Progress → Phase Complete`.

**Adoption for Harness:** Connect trajectory ledger → delegation state machine → agent work contracts. The delegation state machine (426 LOC) already has transitions but lacks trajectory-aware progression. Wire `delegation-state-machine.ts` to query `trajectory/` before allowing transitions.

**Evidence:** GSD §2.3 (State Progression Engine), §7.2 (State Consistency Guarantees)

### 2. Gate Taxonomy → F-08d (Quality Gate Triad)

**GSD Pattern:** Pre-flight → Revision (max 3 loops) → Escalation → Abort. Each gate type has defined behavior and recovery path.

**Adoption for Harness:** Extend `control-plane/gatekeeper.ts` (212 LOC) with GSD gate types. Add revision loops (max 3) for quality gates. Add escalation gate that pauses for human decision. Current gatekeeper only handles delegation gates, not quality gates.

**Evidence:** GSD §4.1 (Gate Taxonomy), §4.2 (Gate Application in Workflows)

### 3. Wave-Based Parallel Execution → F-04a/F-04b (Auto-Commands)

**GSD Pattern:** Plans grouped into waves. Waves execute sequentially; plans within a wave execute in parallel. Intra-wave file overlap detection forces sequential execution when needed.

**Adoption for Harness:** Apply to hm-* and hf-* skill routing. Group skills into waves based on domain dependencies. Execute independent skill→agent routing in parallel within a wave. The `command-engine/` already has command discovery but not wave-based execution.

**Evidence:** GSD §5.2 (Wave-Based Parallel Execution), §5.3 (Worktree Isolation)

### 4. Completion Markers → F-03a (Agents Registry)

**GSD Pattern:** Each agent declares a completion marker (e.g., `## PLANNING COMPLETE`). Orchestrator watches for markers to determine agent completion.

**Adoption for Harness:** Add completion marker support to `completion-detector.ts` (157 LOC). Current implementation uses message counting and status polling. Adding marker detection would enable GSD-style agent handoffs. The `delegation-state-machine.ts` already tracks status but doesn't parse completion markers.

**Evidence:** GSD §6.1 (Completion Markers), §6.2 (Handoff Contracts)

### 5. File-Based Locking → F-08b (Permission Model)

**GSD Pattern:** Atomic lock file creation with `wx` flag, 10-second timeout, stale lock detection (>30s → force cleanup). Prevents concurrent state corruption.

**Adoption for Harness:** Apply to permission resolution. When multiple agents request the same tool simultaneously, use file-based locking to serialize permission checks. Current `concurrency.ts` (310 LOC) uses a keyed semaphore but doesn't have stale lock detection.

**Evidence:** GSD §2.4 (Concurrency Safety)

### 6. Context Budget Management → F-09a (Compaction Survival)

**GSD Pattern:** Path-only passing to subagents. Context window adaptation for different model sizes. STATE.md under 100 lines. Reap stale temp files older than 5 minutes.

**Adoption for Harness:** Wire `prompt-packet/` (330 LOC dead code) to implement compaction survival. Add budget-aware injection using GSD's path-only principle. The dead `compaction-preservation.ts` (108 LOC) already has the pattern — it just needs plugin.ts registration.

**Evidence:** GSD §7.3 (Context Budget Management)

---

## Priority Ranking

### Top 5 Highest-Priority Gaps

| Rank | Feature | Why Critical | Blocking Dependencies |
|------|---------|-------------|----------------------|
| 1 | **F-09a** Long-haul compaction survival | 330 LOC of dead code ready to wire. Without this, all sessions lose context on compaction. The most leverage-per-effort gap. | Blocks reliable long-running sessions |
| 2 | **F-04c** Workflow router (session-entry wiring) | 644 LOC of dead code. Intake gate + purpose classifier + profile resolver are fully implemented but unwired. Wiring session-entry to plugin.ts would enable intent→domain routing. | Blocks intelligent agent dispatch |
| 3 | **F-06** Custom delegation revamp | Core delegation is mature (1,764 LOC) but trajectory, recovery, and work contracts are disconnected. Connecting them completes the delegation pipeline. | Blocks structured multi-session delegation |
| 4 | **F-08b** Permission model | Authority matrix exists (252 LOC) but is not connected to agent dispatch. Without runtime permission enforcement, any agent can use any tool. | Blocks production safety |
| 5 | **F-08a** Context/event-tracker overhaul | Event tracker captures events (11 files) but cannot compile them into context. Missing cognitive packer (legacy C1) and injection orchestrator (legacy C3) make the tracker write-only. | Blocks context-aware behavior |

### Unclassifiable Features

| Feature | Issue |
|---------|-------|
| None | All 20 features were classifiable against the implementation inventory. The 3 source documents provided sufficient evidence for every feature. |

---

## Appendix: Feature × Lineage Detail

### hm-* (Product Development Lineage) — 30 skills

The hm-* lineage is the PRIMARY consumer of the harness. Product development workflows (research, planning, implementation, quality, debug) depend on:
- **F-03a:** Agent discovery for 30 hm-* specialist agents (researcher, planner, executor, verifier, etc.)
- **F-04a:** Auto-routing of hm-* skills (brainstorm → requirements → spec → implement → test)
- **F-06:** Structured delegation packets for multi-session research/implementation cycles
- **F-08b:** STRICT permission model — hm-* agents have constrained tool access

### hf-* (Meta-Builder Lineage) — 11 skills

The hf-* lineage builds OpenCode meta-concepts (agents, skills, commands, tools). It depends on:
- **F-03a:** Agent discovery for 6+ hf-* agents (coordinator, agent-builder, skill-builder, etc.)
- **F-04b:** Auto-routing of hf-* skills (create → audit → stack → configure)
- **F-03e:** Custom tools compilation — hf-* creates tools that other agents use
- **F-08b:** FLEXIBLE permission model — hf-* agents need broader tool access for creation

### Shared Infrastructure

Both lineages consume the same harness runtime. No features are lineage-specific in implementation — only in permission profiles and routing rules. The 14 PARTIAL features need the same code for both lineages, with configuration-driven differences.

---

*Gap matrix synthesis: 2026-05-05*

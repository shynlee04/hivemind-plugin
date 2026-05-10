# Delivery Wave Plan: Hivemind Harness

**Date:** 2026-05-05
**Sources:**
- `GAP-MATRIX-2026-05-05.md` — gap analysis (4 FULL, 14 PARTIAL, 1 NONE, 1 DEAD)
- `FEATURE-DEPENDENCY-GRAPH-2026-05-05.md` — dependency DAG (35 edges, 0 cycles, VALID)
- `legacy-concept-catalog-2026-05-05.md` — legacy concepts (16 unique missing patterns)
- `gsd-framework-reconnaissance.md` — GSD framework patterns
- `team-b-batch-11-final-audit-2026-05-05.md` — UAT findings (6 production gaps, 5 workstreams proposed)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total features | 22 |
| Dependency edges | 35 |
| Waves | 6 |
| Workstreams | 5 |
| Dead code to wire | ~2,108 LOC |
| New code to build | ~2,400 LOC |
| Existing code to extend | ~1,500 LOC |
| **Total estimated LOC impact** | **~6,000** (2,108 wired + 2,400 new + 1,500 extended) |
| Highest-impact feature | F-09b SDK hooks (impact score: 15) |
| Wave 1 immediate ROI | 4 features, ~1,100 LOC wiring, unblocks 16 downstream features |

**Strategy:** Risk-first + dependency-first hybrid. Dead code wiring (F-09a, F-04c) elevated to early waves for maximum leverage-per-effort. Foundation features (F-03a, F-03b, F-09b) form Wave 1 base. Governance (Path 3) deferred to Wave 5 as purely consumptive.

---

## Wave Plan

### Wave 1: Foundation + Dead Code Wiring [Risk-First]

**Rationale:** Four features with zero or minimal build dependencies that unblock 16 downstream features. Three are highest-impact (scores 14-15). One (F-09a) is dead code with 330 LOC ready to wire — the highest leverage-per-effort gap in the entire matrix. Together, these establish the event-driven base layer (hooks), the primitive discovery layer (skills, config compilation), and context survival (compaction).

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-09b SDK hooks/events | 15 | PARTIAL (8 hook files, 800 LOC wired; missing CQRS queue, compaction hook, session coherence) | ~350 new (CQRS mutation queue, compaction hook, coherence validation) | All 8 hooks registered in plugin.ts. Missing: P2 CQRS queue, H4 compaction trigger, H8 session coherence |
| F-03b Skills registry | 15 | PARTIAL (scanSkillFile works; no progressive disclosure, trigger matching, status tracking) | ~200 new (L0-L3 disclosure engine, trigger evaluator, status field) + ~50 wire | primitive-scanners.ts parses frontmatter. Missing: Z9 progressive disclosure, runtime trigger matching |
| F-09d Configuration compilation | 14 | PARTIAL (compileAgent/Command/Skill work; no batch compile, conflict detection, workspace inheritance) | ~150 new (batch compile, conflict detection) + ~50 wire | config-compiler.ts (410 LOC) + configure-primitive.ts (490 LOC) exist. Missing: compileTool, batch mode |
| F-09a Compaction survival | 1 (leaf) | DEAD (330 LOC prompt-packet/ entirely unused) | ~330 wire (register in plugin.ts, hook into compaction cycle) + ~100 glue | All 4 prompt-packet files exist with zero consumers. Wire kernel-packet + delegation-packet + compaction-preservation to runtime |

**Wave 1 total:** ~1,430 LOC (330 wired + 700 new + 400 extended)
**Unblocks:** F-03a, F-06, F-08a, F-09c, F-03e, F-05, plus all transitive dependents = 16 features

---

### Wave 2: Core Engine

**Rationale:** Two features that form the operational core. F-03a (agents registry) is the central routing hub with impact score 13. F-06 (delegation revamp) is the work dispatch engine with impact score 12. Both depend only on Wave 1 features and are prerequisites for all tools, commands, and data layer features.

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-03a Agents registry & routing | 13 | PARTIAL (primitive-loader 334 LOC, registry 291 LOC, scanners 182 LOC exist; missing agent metadata resolution, health tracking, capability negotiation) | ~250 new (agent metadata resolution, health tracking, completion marker support) + ~100 wire | Loader + registry + scanners fully implemented. Missing: runtime metadata, T12 agent declaration, GSD completion markers |
| F-06 Custom delegation revamp | 12 | PARTIAL (delegation-manager 468 LOC, state-machine 426 LOC, SDK/command delegation ~700 LOC exist; trajectory and recovery disconnected) | ~328 wire (auto-loop.ts, ralph-loop.ts) + ~806 wire (recovery-engine facade + recovery/ subsystem) + ~200 glue (trajectory→delegation, work-contract→delegation) | Core delegation mature (1,764 LOC). Dead code: auto-loop (146 LOC), ralph-loop (182 LOC), recovery-engine facade (72 LOC) + recovery/ (734 LOC). Wire trajectory ledger to delegation state machine |

**Wave 2 total:** ~1,886 LOC (1,366 wired + 250 new + 270 extended)
**Unblocks:** F-03c, F-03f, F-03d, F-08b, F-08c, F-09c, F-07a, F-07b, F-09a (data flow), F-04a, F-04b

---

### Wave 3: Tools & Commands

**Rationale:** Six features that complete the agent-callable surface. All depend on Wave 2 (agents + delegation). F-03c (tools wiring) is already FULL but has downstream dependents. F-04c (workflow router) has 644 LOC of dead session-entry code ready to wire. F-03e, F-04a, F-04b extend compilation and routing.

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-03c Tools wiring | 6 | FULL (17 tools registered in plugin.ts) | ~0 (extend with tool metadata registry for F-08b/F-08c consumption) | All 17 tools registered with Zod schemas. Needed: centralized tool metadata map for permission enforcement |
| F-03f Background PTY | 1 | FULL (5 PTY files, run-background-command 221 LOC, bun-pty graceful fallback) | ~50 new (graceful degradation improvements, session recovery for PTY) | Fully implemented. UAT gap: human sessionId rejection (intentional per F-9) |
| F-04c Workflow router | 1 | PARTIAL (command-engine 199 LOC works; session-entry/ 644 LOC DEAD, unwired) | ~644 wire (intake-gate, purpose-classifier, profile-resolver, language-resolution) + ~150 glue | command-engine routes commands. session-entry/ (5 files, all UNUSED) provides intent→domain→skill→agent pipeline. Wire to plugin.ts lifecycle |
| F-03e Custom tools compilation | 2 | PARTIAL (configure-primitive 490 LOC, config-compiler 410 LOC; no compileTool) | ~200 new (compileTool function, Zod schema validation for user tools) | Compilation for agents/commands/skills works. Missing: tool compilation for user-defined tools |
| F-04a hm-auto-commands | 2 | PARTIAL (command-engine exists, 30 hm-* skills; no auto-routing) | ~150 new (hm-specific intent→skill→agent routing, lineage-router integration) | Command discovery works. Missing: hm-* skill intent→command bridging |
| F-04b hf-auto-commands | 2 | PARTIAL (same infra as F-04a, 11 hf-* skills; no auto-routing) | ~100 new (hf-specific routing) | Same gap as F-04a for hf-* lineage |

**Wave 3 total:** ~1,294 LOC (644 wired + 500 new + 150 extended)
**Unblocks:** F-03d, F-08b, F-08c, F-09c, F-05

---

### Wave 4: Data & Integration

**Rationale:** Five features that connect subsystems. F-07a/F-07b/F-07c (trajectory, tasks, work contracts) form the data backbone for structured delegation. F-08a (event tracker overhaul) adds the missing cognitive packer and injection orchestrator. F-05 (CLI + configs) completes the user-facing setup flow.

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-07a Trajectory ledger | 3 | FULL (trajectory/ 4 files ~414 LOC, hivemind-trajectory tool 112 LOC) | ~0 (extend to connect with F-06 delegation state machine) | Fully implemented and wired. Connect trajectory checkpoints to delegation recovery |
| F-07b Task-plus system | 2 | FULL (task-status.ts, delegation-state-machine.ts 426 LOC) | ~0 (extend status transitions for F-06 integration) | Fully implemented. Wire task status transitions to delegation events |
| F-07c Agent work contracts | 2 | FULL (agent-work-contracts/ 4 files ~400 LOC, tool 152 LOC) | ~50 new (delegation packet compilation from contracts, trajectory evidence export) | Fully implemented. Missing: packet compilation bridge to F-06 delegation dispatch |
| F-08a Context/event-tracker overhaul | 2 | PARTIAL (event-tracker/ 11 files, runtime-pressure/ 5 files; no cognitive packer C1, injection orchestrator C3, budget manager C4, staleness C5) | ~700 new (cognitive packer, injection orchestrator, budget manager, staleness detection) | Event tracker captures events (1,938 LOC). Missing: state→context compilation (C1), budget-aware injection (C3), context budgeting (C4), relevance scoring (C5) |
| F-05 CLI installation + configs | 1 | PARTIAL (config-workflow/ 5 files 355 LOC, runtime-policy.ts 267 LOC; no CLI binary, no configs.json pipeline, no onboarding) | ~300 new (CLI binary, configs.json compilation, first-run detection) + ~100 wire | Configuration workflow exists. Missing: CLI installation script, configs.json→runtime policy pipeline, onboarding wizard |

**Wave 4 total:** ~1,150 LOC (0 wired + 1,050 new + 100 extended)
**Unblocks:** F-08d (via F-07a, F-07c), F-09a (data flow from F-08a)

---

### Wave 5: Governance

**Rationale:** Path 3 is purely consumptive — it reads metadata and data from lower layers but produces no data that other features consume. F-08b (permissions) must come before F-08c (tool matrix) and F-08d (quality gates). F-08d depends on F-07a, F-07c, F-08b, F-08c — all satisfied by Waves 2-4.

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-08b Permission model | 2 | PARTIAL (authority-matrix.ts 252 LOC, category-gates.ts 59 LOC; no full allow/ask/ask per tool per agent depth, no tool tier classification H3, no role-based enforcement) | ~250 new (tool tier classification H3, per-depth permission profiles, role-based enforcement engine) + ~100 wire | Authority matrix exists but not connected to agent dispatch. Missing: agent role field in primitives (schema change), centralized tool metadata, lineage-specific rules (hm STRICT, hf FLEXIBLE) |
| F-08c Tool capability matrix | 2 | PARTIAL (hm-l3-tool-capability-matrix as SKILL doc only, authority-matrix.ts partial runtime; no compiled registry, no lineage-specific rules, no per-depth profiles) | ~200 new (compiled capability registry, lineage rule engine, per-depth profiles) | Authority-matrix provides base. Missing: compiled registry with all 23+ tools documented, lineage rules coded |
| F-08d Quality gate triad | 1 | PARTIAL (gatekeeper.ts 212 LOC, 3 gate skills in .opencode/skills/; no runtime G0-G5 system, no evidence storage, no remediation routing) | ~350 new (G0-G5 gate definitions per GSD §4.1, evidence storage, revision loop engine, remediation routing) | Gatekeeper handles delegation gates. Missing: quality gate runtime with evidence collection, revision loops (max 3), escalation gates |

**Wave 5 total:** ~900 LOC (0 wired + 800 new + 100 extended)
**Unblocks:** No further features (terminal governance layer)

---

### Wave 6: Polish & Future-Proofing

**Rationale:** Two features with minimal impact on the core system. F-03d (MCP) has zero implementation and zero consumers — future-facing per Q1. F-09c (dashboard tools) enhances the side-car but doesn't block any other feature.

| Feature | Impact | Current State | LOC to Wire/Build | Dependencies Satisfied |
|---------|--------|---------------|-------------------|----------------------|
| F-03d MCP server integration | 1 | NONE (no MCP-specific code in src/) | ~500 new (MCP server discovery, tool registration in plugin.ts, config schema) | No implementation exists. Requires: MCP tool type in configure-primitive, MCP client/server abstraction |
| F-09c Specialist tools for dashboard | 1 | PARTIAL (hivemind-doc 45 LOC, sdk-supervisor 53 LOC, session-journal-export 117 LOC, command-engine 58 LOC exist; no dedicated dashboard tool suite, no real-time state queries) | ~200 new (dashboard aggregation queries, trajectory visualization, delegation lineage) + supervisor/ 287 LOC wire | Raw data tools exist (hivemind-doc, sdk-supervisor). Missing: dashboard-specific aggregation, real-time .hivemind/ state queries. Wire supervisor/ (287 LOC dead) |

**Wave 6 total:** ~987 LOC (287 wired + 700 new + 0 extended)
**Unblocks:** None (terminal features)

---

## Workstream Proposals

### Workstream A: Foundation Wiring

- **Waves:** 1-2
- **Features:** F-09a, F-06, F-04c (session-entry wiring)
- **LOC estimate:** ~2,594 (1,108 wired dead code + 200 glue + 1,286 new/extended)
- **Dependencies:** None (foundation) — Wave 1 features have zero build deps
- **UAT gaps addressed:** G-3 (L1→L2 delegation chain), G-5 (rollback plan via recovery engine)
- **Phase breakdown:**
  - Phase A.1: Wire prompt-packet/ to plugin.ts — compaction survival (330 LOC wired)
  - Phase A.2: Wire session-entry/ to plugin.ts — workflow router (644 LOC wired)
  - Phase A.3: Wire auto-loop + ralph-loop to delegation-manager (328 LOC wired)
  - Phase A.4: Wire recovery-engine facade + recovery/ to delegation-manager (806 LOC wired)
  - Phase A.5: Connect trajectory ledger → delegation state machine → agent work contracts (200 LOC glue)
  - Phase A.6: Integration test — full delegation lifecycle with recovery
- **Verification criteria:**
  - `npm run build` passes with all dead code now wired
  - Compaction survival preserves critical state across context window compaction
  - Session-entry intake gate routes 6 purpose categories correctly
  - Delegation recovery restores state from checkpoint after interruption
  - Auto-loop/ralph-loop execute autonomously via delegation-manager

---

### Workstream B: Registry & Routing

- **Waves:** 1-3
- **Features:** F-03a, F-03b, F-03c, F-03e
- **LOC estimate:** ~1,100 (450 new + 150 wire + 500 extended)
- **Dependencies:** Wave 1 foundation (F-09b, F-09d)
- **UAT gaps addressed:** G-2 (command-agent references via agent metadata), G-6 (skill frontmatter via registry)
- **Phase breakdown:**
  - Phase B.1: Extend skills registry with progressive disclosure engine (~200 LOC)
  - Phase B.2: Add agent metadata resolution to primitive-loader (~150 LOC)
  - Phase B.3: Add completion marker support to completion-detector (~100 LOC)
  - Phase B.4: Add compileTool to config-compiler (~200 LOC)
  - Phase B.5: Create centralized tool metadata map for permission consumption (~100 LOC)
  - Phase B.6: Integration test — agent discovery → skill loading → tool resolution
- **Verification criteria:**
  - Agent metadata (capabilities, constraints, tool permissions) resolved at load time
  - Skills loaded with L0-L3 progressive disclosure based on session depth
  - Tool compilation produces valid Zod-validated runtime format
  - All 97 agents discoverable with correct metadata
  - All 51 skills parseable with trigger matching

---

### Workstream C: Runtime Lifecycle

- **Waves:** 1-3
- **Features:** F-09b, F-09d, F-03f, F-04a, F-04b
- **LOC estimate:** ~1,515 (550 new + 100 wire + 865 extended)
- **Dependencies:** Wave 1 (F-03b) and Wave 2 (F-03a)
- **UAT gaps addressed:** G-4 (taxonomy READMEs via lifecycle hooks)
- **Phase breakdown:**
  - Phase C.1: Add CQRS state mutation queue to hooks (~150 LOC)
  - Phase C.2: Add compaction hook (H4) that triggers preservation (~100 LOC)
  - Phase C.3: Add session coherence validation hook (~100 LOC)
  - Phase C.4: Extend config-compiler with batch compilation and conflict detection (~150 LOC)
  - Phase C.5: Add hm-* lineage auto-routing to command-engine (~150 LOC)
  - Phase C.6: Add hf-* lineage auto-routing to command-engine (~100 LOC)
  - Phase C.7: PTY graceful degradation improvements (~50 LOC)
  - Phase C.8: Integration test — hook lifecycle → event emission → delegation completion
- **Verification criteria:**
  - Hooks queue mutations via CQRS, tools flush on demand
  - Compaction hook fires before context window overflow, preserving critical state
  - Batch config compilation processes all primitives in one pass
  - hm-* and hf-* commands auto-route to correct specialist agents
  - PTY fallback works on Node.js (non-Bun) without bun-pty

---

### Workstream D: Governance & Permissions

- **Waves:** 4-5
- **Features:** F-08a, F-08b, F-08c, F-08d, F-07a, F-07b, F-07c
- **LOC estimate:** ~1,800 (1,050 new + 150 wire + 600 extended)
- **Dependencies:** Waves 2-3 (F-03a, F-03c, F-06, F-07a, F-07c)
- **UAT gaps addressed:** G-3 (permissions enforcement), F-1 (L1→L2 delegation permissions)
- **Phase breakdown:**
  - Phase D.1: Build cognitive packer (C1) for event tracker (~300 LOC)
  - Phase D.2: Build injection orchestrator (C3) with budget manager (C4) (~400 LOC)
  - Phase D.3: Add tool tier classification (H3) to authority-matrix (~150 LOC)
  - Phase D.4: Add role-based permission enforcement to agent dispatch (~100 LOC)
  - Phase D.5: Build compiled tool capability registry (~200 LOC)
  - Phase D.6: Build quality gate runtime (G0-G5) with evidence storage (~350 LOC)
  - Phase D.7: Add revision loop engine (max 3) and escalation gates (~100 LOC)
  - Phase D.8: Integration test — governance pipeline (permissions → gates → evidence)
- **Verification criteria:**
  - Cognitive packer compiles session state into injectable context
  - Tool access enforced per agent role and depth level
  - hm-* agents have STRICT tool access, hf-* agents have FLEXIBLE access
  - Quality gates store evidence, support revision loops, and escalate to human
  - Permission denial produces actionable error messages

---

### Workstream E: Side-Car & Compilation

- **Waves:** 4-6
- **Features:** F-09c, F-05, F-03d
- **LOC estimate:** ~1,487 (287 wired + 1,000 new + 200 extended)
- **Dependencies:** Waves 2-3 (F-03c, F-03e, F-09d)
- **UAT gaps addressed:** G-1 (CHANGELOG via CLI), G-4 (taxonomy READMEs via dashboard)
- **Phase breakdown:**
  - Phase E.1: Wire supervisor/ to hivemind-sdk-supervisor (287 LOC wired)
  - Phase E.2: Add dashboard aggregation queries (~200 LOC)
  - Phase E.3: Build CLI binary with configs.json compilation (~300 LOC)
  - Phase E.4: Add first-run detection and onboarding wizard (~200 LOC)
  - Phase E.5: Build MCP server discovery and tool registration (~500 LOC)
  - Phase E.6: Integration test — CLI → config compilation → agent setup
- **Verification criteria:**
  - Dashboard tools provide aggregated state queries for .hivemind/ contents
  - CLI installs harness, compiles configs, validates setup
  - First-run wizard guides new users through initial configuration
  - MCP servers discoverable and tools callable (when implemented)

---

## Parallelizable Groups

### Wave 1 — Full Parallelization

All 4 Wave 1 features have zero mutual dependencies and can be built simultaneously:

```
F-09b (hooks)  ||  F-03b (skills)  ||  F-09d (config)  ||  F-09a (compaction)
```

Each can be assigned to an independent workstream without file overlap.

### Wave 2 — Two-Way Parallel

```
F-03a (agents)  ||  F-06 (delegation)
```

Both depend only on Wave 1. No file overlap (F-03a touches primitive-loader/registry/scanners, F-06 touches delegation-manager/state-machine/spawner).

### Wave 3 — Six-Way Parallel (with file overlap check)

```
F-03c (tools)  ||  F-03f (PTY)  ||  F-04c (workflow)  ||  F-03e (custom tools)  ||  F-04a (hm-cmds)  ||  F-04b (hf-cmds)
```

**File overlap risk:** F-03c and F-03e both touch plugin.ts tool registration. Force sequential: F-03c first (already FULL, just needs metadata extension), then F-03e.

```
Parallel Group A: F-03f, F-04c, F-04a, F-04b  (no shared files)
Sequential after A: F-03c (plugin.ts tool map)
Sequential after F-03c: F-03e (plugin.ts tool compilation)
```

### Wave 4 — Staggered Parallel

```
Phase 1 (parallel):  F-07a  ||  F-07b  ||  F-08a  ||  F-05
Phase 2 (after F-07a + F-07b):  F-07c
```

F-07c depends on F-07a and F-07b completing first.

### Wave 5 — Sequential Pipeline

```
F-08b → F-08c → F-08d
```

Strict sequential: F-08b provides role data for F-08c, which provides matrix data for F-08d.

### Wave 6 — Full Parallelization

```
F-03d (MCP)  ||  F-09c (dashboard)
```

No shared files, no mutual dependencies.

---

## Risk Assessment

### Risk 1: Dead Code Wiring Surfaces Hidden Dependencies

| Attribute | Detail |
|-----------|--------|
| **Severity:** HIGH | Affects 2,108 LOC of dead code across 7 subsystems |
| **Probability:** Medium | Code was written for a different architecture version; type drift likely |
| **Impact:** Wave 1-2 delays cascade to all downstream waves |
| **Evidence:** session-entry/ (644 LOC) references types that may not exist in current src/lib/types.ts |
| **Mitigation:** Run `npm run typecheck` after each dead subsystem wiring. Wire one subsystem at a time with green tests between each. Maintain a rollback commit per subsystem. |

### Risk 2: F-06 Delegation Revamp Touches Critical Path

| Attribute | Detail |
|-----------|--------|
| **Severity:** HIGH | 5+ features depend on F-06; 1,764 LOC of existing delegation code |
| **Probability:** Medium | Core delegation is mature but trajectory/recovery connections are untested |
| **Impact:** Breaking delegation breaks tool dispatch, PTY sessions, and all downstream |
| **Evidence:** F-03c→F-06 (risk=1), F-03f→F-06 (risk=1), F-09b→F-06 (risk=1) are critical path edges |
| **Mitigation:** Wire recovery and auto-loop as OPTIONAL additions, not modifications to existing delegation flow. Add feature flags for new delegation paths. Comprehensive integration tests before connecting trajectory to state machine. |

### Risk 3: F-04c Session-Entry Wiring Has Type Drift

| Attribute | Detail |
|-----------|--------|
| **Severity:** MEDIUM | 644 LOC of dead code with 5 files, never compiled against current types |
| **Probability:** High | Code references types and imports from a different architecture era |
| **Impact:** Workflow router delayed, intelligent agent dispatch blocked |
| **Evidence:** session-entry/purpose-classifier.ts references 6 intent categories; current types may not have SessionPurpose enum |
| **Mitigation:** Compile session-entry/ in isolation first. Create adapter layer between session-entry types and current types. Budget 2x time estimate for type reconciliation. |

### Risk 4: F-08b Permissions Require Schema Changes

| Attribute | Detail |
|-----------|--------|
| **Severity:** MEDIUM | Agent primitive types need role field; tool metadata registry needs to exist |
| **Probability:** Low-Medium | Schema changes are well-understood but touch primitive-loader |
| **Impact:** Permission enforcement delayed if schema migration is complex |
| **Evidence:** "No role field exists in agent primitive types" (dependency graph missing interface analysis) |
| **Mitigation:** Add role/type fields to agent primitive types in Wave 2 (alongside F-03a extension), not Wave 5. Schema changes propagate before they're needed. |

### Risk 5: F-03d MCP Has Zero Implementation — Scope Creep

| Attribute | Detail |
|-----------|--------|
| **Severity:** LOW | Feature has zero consumers and zero implementation |
| **Probability:** Low | Deferred to Wave 6 (last wave) |
| **Impact:** MCP integration expands scope if prioritized too early |
| **Evidence:** "F-03d has no implementation and no consumers" (dependency graph finding) |
| **Mitigation:** Keep MCP in Wave 6. Do NOT pull forward. Build only when MCP demand materializes from real users. Consider deferring to post-v3.0 release. |

---

## UAT Gap Closure Mapping

| UAT Gap | Wave | Workstream | Feature | Resolution |
|---------|------|-----------|---------|------------|
| **G-1:** No CHANGELOG.md | Wave 4 | WS-E (CLI) | F-05 | CLI installation includes CHANGELOG generation from git history as part of release readiness |
| **G-2:** 14 commands reference non-existent agents | Wave 2 | WS-B (Registry) | F-03a | Agent metadata resolution validates agent names at load time; command frontmatter repair via configure-primitive |
| **G-3:** L1→L2 delegation chain blocked | Wave 2+5 | WS-A (Wiring) + WS-D (Governance) | F-06, F-08b | Add `delegate-task` to hm-l1-coordinator tool permissions (permission model F-08b); wire delegation chain through recovery engine (F-06) |
| **G-4:** Missing .hivemind/journal/README.md and .hivemind/lineage/README.md | Wave 1 | WS-C (Lifecycle) | F-09b | Session lifecycle hooks create taxonomy READMEs on first .hivemind/ initialization |
| **G-5:** No rollback plan | Wave 2 | WS-A (Wiring) | F-06 | Recovery engine (806 LOC dead code) provides structured rollback; document npm package rollback procedure |
| **G-6:** Invalid skill frontmatter (hm-l2-planning-persistence) | Wave 1 | WS-B (Registry) | F-03b | Skills registry validates frontmatter on load; invalid skills flagged and auto-repaired or quarantined |

### Immediate Priorities (Wave 1 Gap Closure)

Three UAT gaps can be resolved in Wave 1:
1. **G-4** (taxonomy READMEs) — session hooks create them on init
2. **G-6** (skill frontmatter) — registry validates on load
3. **G-5** (rollback plan) — recovery engine wiring provides the mechanism

Three UAT gaps require Wave 2+:
4. **G-2** (command-agent refs) — needs agent metadata resolution
5. **G-3** (delegation chain) — needs permission model + delegation wiring
6. **G-1** (CHANGELOG) — needs CLI tooling

---

## Legacy Pattern Adoption

### HIGH Priority (Wave 1-2)

| Legacy Pattern | Wave | Workstream | Feature | Est. LOC |
|---------------|------|-----------|---------|----------|
| **CQRS State Mutation Queue** (P2) | Wave 1 | WS-C | F-09b | ~150 |
| **Cognitive Packer** (C1) | Wave 1 | WS-A | F-09a | ~300 |
| **Session Intent Classifier** (S4) | Wave 1 | WS-A | F-04c | ~644 wire |
| **Tool Tier Classification** (H3) | Wave 5 | WS-D | F-08b | ~150 |
| **Injection Orchestrator** (C3) | Wave 4 | WS-D | F-08a | ~300 |

### MEDIUM Priority (Wave 3-4)

| Legacy Pattern | Wave | Workstream | Feature | Est. LOC |
|---------------|------|-----------|---------|----------|
| **Budget Manager** (C4) | Wave 4 | WS-D | F-08a | ~100 |
| **Staleness Detection** (C5) | Wave 4 | WS-D | F-08a | ~80 |
| **Agent Declaration Protocol** (T12) | Wave 2 | WS-B | F-03a | ~100 |
| **Brain State Field Lifecycle** (Z1) | Wave 1 | WS-A | F-09a | ~50 |
| **Format Weaver Interface** (D1-D5) | Wave 4 | WS-E | F-09c | ~200 |
| **Q.U.A.N.T. Clarity Scoring** (P4) | Wave 5 | WS-D | F-08d | ~150 |
| **FK Validation** (G1) | Wave 5 | WS-D | F-08d | ~80 |

### LOW Priority (Wave 5-6)

| Legacy Pattern | Wave | Workstream | Feature | Est. LOC |
|---------------|------|-----------|---------|----------|
| **Progressive Disclosure** (Z9) | Wave 1 | WS-B | F-03b | ~100 |
| **Orphan Quarantine** (G6) | Wave 5 | WS-D | F-08d | ~60 |
| **SOT Artifact Registry** (T15) | Wave 5 | WS-D | F-08d | ~120 |
| **Chain Break Detection** (P10) | Wave 5 | WS-D | F-08d | ~80 |

---

## GSD Pattern Integration

Six battle-tested GSD patterns to adopt for the harness delivery:

| GSD Pattern | Harness Application | Wave | Workstream | Est. LOC |
|-------------|-------------------|------|-----------|----------|
| **State Machine Discipline** (§2.3) | Connect trajectory ledger → delegation state machine → agent work contracts. Use atomic read-modify-write for delegation transitions. | Wave 2 | WS-A | ~200 glue |
| **Gate Taxonomy** (§4.1) | Extend gatekeeper.ts with Pre-flight → Revision (max 3) → Escalation → Abort gate types for quality gates. | Wave 5 | WS-D | ~200 |
| **Wave-Based Parallel Execution** (§5.2) | Apply to F-04a/F-04b skill routing. Group skills into waves by domain dependencies. Intra-wave file overlap detection. | Wave 3 | WS-C | ~150 |
| **Completion Markers** (§6.1) | Add marker detection to completion-detector.ts. Enable GSD-style `## PLANNING COMPLETE` handoffs between agents. | Wave 2 | WS-B | ~100 |
| **File-Based Locking** (§2.4) | Add stale lock detection to concurrency.ts. 30s threshold → force cleanup. Prevents concurrent state corruption. | Wave 5 | WS-D | ~50 |
| **Context Budget Management** (§7.3) | Wire prompt-packet/ for budget-aware injection. Path-only passing to subagents. STATE.md under 100 lines principle. | Wave 1 | WS-A | ~100 |

### GSD `.planning/` Structure for Hivemind

Adopt GSD's `.planning/` structure for harness development work:

```
.planning/
├── PROJECT.md          # Harness core value proposition
├── REQUIREMENTS.md     # Feature requirements with traceability
├── ROADMAP.md          # Phase breakdown (maps to delivery waves)
├── STATE.md            # Current position (which wave, which plan)
├── config.json         # Model profile, branching, workflow flags
├── research/           # This directory (analysis artifacts)
│   ├── GAP-MATRIX-2026-05-05.md
│   ├── FEATURE-DEPENDENCY-GRAPH-2026-05-05.md
│   ├── DELIVERY-WAVE-PLAN-2026-05-05.md  ← this file
│   └── legacy-concept-catalog-2026-05-05.md
└── phases/             # Per-wave execution plans and summaries
    ├── wave-1-foundation/
    ├── wave-2-core-engine/
    ├── wave-3-tools-commands/
    ├── wave-4-data-integration/
    ├── wave-5-governance/
    └── wave-6-polish/
```

---

## Feature Coverage Audit

| Feature | Wave | Workstream | State | LOC Impact |
|---------|------|-----------|-------|------------|
| F-03a Agents registry | 2 | B | PARTIAL→FULL | +350 |
| F-03b Skills registry | 1 | B | PARTIAL→FULL | +250 |
| F-03c Tools wiring | 3 | B | FULL (extend) | +50 |
| F-03d MCP integration | 6 | E | NONE→PARTIAL | +500 |
| F-03e Custom tools compilation | 3 | B | PARTIAL→FULL | +200 |
| F-03f Background PTY | 3 | C | FULL (extend) | +50 |
| F-04a hm-auto-commands | 3 | C | PARTIAL→FULL | +150 |
| F-04b hf-auto-commands | 3 | C | PARTIAL→FULL | +100 |
| F-04c Workflow router | 3 | A | PARTIAL→FULL | +794 (644 wire + 150 glue) |
| F-05 CLI + configs | 4 | E | PARTIAL→FULL | +400 |
| F-06 Delegation revamp | 2 | A | PARTIAL→FULL | +1,334 (1,108 wire + 226 glue) |
| F-07a Trajectory ledger | 4 | D | FULL (extend) | +0 |
| F-07b Task-plus system | 4 | D | FULL (extend) | +0 |
| F-07c Agent work contracts | 4 | D | FULL (extend) | +50 |
| F-08a Event tracker overhaul | 4 | D | PARTIAL→FULL | +700 |
| F-08b Permission model | 5 | D | PARTIAL→FULL | +350 |
| F-08c Tool capability matrix | 5 | D | PARTIAL→FULL | +200 |
| F-08d Quality gate triad | 5 | D | PARTIAL→FULL | +350 |
| F-09a Compaction survival | 1 | A | DEAD→FULL | +430 (330 wire + 100 glue) |
| F-09b SDK hooks/events | 1 | C | PARTIAL→FULL | +350 |
| F-09c Dashboard tools | 6 | E | PARTIAL→FULL | +487 (287 wire + 200 new) |
| F-09d Configuration compilation | 1 | C | PARTIAL→FULL | +200 |

**Total: 22/22 features covered** ✓
**Waves with FULL completion target:** Waves 1-5 (20 features reach FULL)
**Wave 6 partial:** F-03d may remain PARTIAL if MCP demand doesn't materialize

---

*Delivery Wave Plan generated 2026-05-05 by gsd-roadmapper subagent. Sources: 5 analysis artifacts synthesized, 22 features mapped across 6 waves, 5 workstreams defined, 6 UAT gaps traced to resolution.*

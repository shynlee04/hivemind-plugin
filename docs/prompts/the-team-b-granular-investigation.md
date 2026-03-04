
---
# PHASE-1 INFECTION GRAPH: HiveOps-GX-HiveFiver Relationships

## A) INFECTION_GRAPH

### Verified Context Injectors

```
.opencode/plugins/hiveops-governance/index.ts
├── .opencode/plugins/hiveops-governance/hooks/context-injection.ts (injects governance context every LLM turn)
│   ├── .hivemind/state/todo.json (reads active TODO)
│   ├── .hivemind/state/runtime-profile.json (reads agent profile)
│   ├── .hivemind/state/hierarchy.json (reads trajectory tree)
│   ├── .hivemind/state/context-recovery.json (reads recovery context)
│   └── .hivemind/state/health-metrics.json (reads health scores)
│
├── .opencode/plugins/hiveops-governance/hooks/delegation.ts (enforces delegation + scope)
│   ├── .opencode/plugins/hiveops-governance/utils.ts (script runner + topology check)
│   │   └── .opencode/skills/gx-context-engine/scripts/gx-enforce.sh (runs check-delegation, check-path)
│   └── .opencode/skills/gx-context-engine/scripts/gx-trace-check.sh (runs traceability check)
│
├── .opencode/plugins/hiveops-governance/hooks/events.ts (fires on session/TODO/file events)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh (session.created → builds profile)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-first-turn-refresh.sh (session.created → validates state)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh (session.completed → purifies)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-sot-register.sh (session.completed → indexes)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-todo-sync.sh (todo.updated → syncs hierarchy)
│   └── .opencode/skills/gx-context-engine/scripts/gx-schema-sync.sh (file.edited on .hivemind/state/*.json)
│
├── .opencode/plugins/hiveops-governance/hooks/compaction.ts (fires on compaction)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh (purifies before compact)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-schema-sync.sh (validates all state files)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-semantic-validate.sh (chain integrity check)
│   └── .opencode/skills/gx-context-engine/scripts/gx-context-retrieve.sh (synthesizes recovery)
│
└── .opencode/plugins/hiveops-governance/types.ts (defines DELEGATION_TOPOLOGY + SCOPE_BOUNDARIES)
```

### GX-Context-Engine Scripts (Invoker → Invoked)

```
.opencode/skills/gx-context-engine/SKILL.md (orchestrates script chains)
│
├── Chain 1: Session Entry
│   └── .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh (builds runtime-profile.json)
│
├── Chain 2: Mid-Session (every 10 tool calls via plugin)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-health-compute.sh (runs 12 signal scripts)
│   │   └── .opencode/skills/gx-context-engine/scripts/signals/gx-signal-*.sh (12 individual signals)
│   ├── .opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh (drift + depth check)
│   └── .opencode/skills/gx-context-engine/scripts/gx-auto-purge.sh (dirty score evaluation)
│
├── Chain 3: TODO Mutation
│   └── .opencode/skills/gx-context-engine/scripts/gx-todo-sync.sh (syncs TODO ↔ hierarchy)
│
├── Chain 5: Export Pipeline
│   ├── .opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh (purifies context)
│   └── .opencode/skills/gx-context-engine/scripts/gx-sot-register.sh (indexes artifacts)
│
├── Chain 6: Auto-Purge
│   ├── .opencode/skills/gx-context-engine/scripts/gx-auto-purge.sh snapshot (creates backup)
│   └── .opencode/skills/gx-context-engine/scripts/gx-context-retrieve.sh (synthesizes recovery)
│
└── Agent-Invoked Scripts (NOT auto-wired)
    ├── .opencode/skills/gx-context-engine/scripts/gx-decision-log.sh (logs decisions)
    ├── .opencode/skills/gx-context-engine/scripts/gx-workflow-state.sh (workflow transitions)
    ├── .opencode/skills/gx-context-engine/scripts/gx-scope-resolve.sh (scope checking)
    └── .opencode/skills/gx-context-engine/scripts/gx-swarm-launch.sh (parallel agent spawn)
```

### Downstream Hivefiver Impact Paths

```
.opencode/agents/hivefiver.md (agent definition with read:deny, glob:deny, grep:deny)
├── .opencode/skills/hivefiver-prime/SKILL.md (MANDATORY first-load)
│   ├── references/denoised-entry-pack-2026-03-03.md (bounded entry skills)
│   ├── references/session-hierarchy-protocol.md (main/sub detection)
│   └── references/context-engineering-guardrails.md (L0-L3 loading)
│
├── .opencode/skills/hivefiver-mode/SKILL.md (stage routing)
│   ├── scripts/route-stage.sh (determines current stage)
│   ├── scripts/classify-intent.sh (classifies user intent)
│   └── scripts/guided-discovery.sh (interactive onboarding)
│
├── .opencode/skills/hivefiver-context-enforcer/SKILL.md (remediation playbooks)
│   └── INJECTED BY: .opencode/plugins/hiveops-governance/hooks/context-injection.ts
│       (lines 294-330: hivefiver blindness enforcement block)
│
├── .opencode/skills/hivefiver-coordination/SKILL.md (quality gates)
│   ├── scripts/gate-check.sh (entry gate verification)
│   ├── scripts/runtime-gate.sh (pre-turn/post-turn enforcement)
│   ├── scripts/state-update.sh (STATE.md mutations)
│   ├── scripts/pipeline-orchestrator.sh (pipeline sequencing)
│   ├── scripts/hivefiver-must-pack.sh (unified obligations)
│   ├── scripts/quality-check.sh (stage quality verification)
│   └── scripts/schema-guard.sh (frontmatter validation)
│
└── Hivefiver Commands (trigger scripts via !`bash` enforcement blocks)
    ├── .opencode/commands/hivefiver-start.md
    │   ├── scripts/gate-check.sh (via enforcement block)
    │   ├── scripts/state-update.sh (via enforcement block)
    │   ├── scripts/classify-intent.sh (via enforcement block)
    │   ├── scripts/runtime-gate.sh (via enforcement block)
    │   └── scripts/hivefiver-must-pack.sh (via enforcement block)
    │
    ├── .opencode/commands/hivefiver-doctor.md
    │   ├── scripts/gate-check.sh (via enforcement block)
    │   ├── scripts/pipeline-orchestrator.sh (via enforcement block)
    │   ├── scripts/journey-intake-qa.sh (via enforcement block)
    │   ├── scripts/runtime-gate.sh (via enforcement block)
    │   └── scripts/schema-guard.sh (inline in process)
    │
    └── .opencode/commands/gx-steer.md
        └── .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh (via enforcement block)
        └── .opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh (via enforcement block)
```

### Potential False-Directive Emitters

```
.opencode/skills/hivemind-governance/SKILL.md (bootstrap checkpoint)
├── NOT wired via plugin hooks — relies on agent's manual skill loading
├── Contains overlapping rules with gx-context-engine
└── References bin/hivemind-tools.cjs (not in .opencode/ scope)

.opencode/skills/context-integrity/SKILL.md (drift detection)
├── References scan_hierarchy, map_context, think_back (custom tools)
├── Mentions "hooks do this for you" but no deterministic wiring verified
└── Overlaps with gx-health-compute.sh signals

.opencode/agents/hivefiver.md (agent body text)
├── Lines 470-543: gx_governance section documents enforcement
├── Agent body is decorative (OpenCode ignores non-frontmatter YAML)
├── Actual enforcement via .opencode/plugins/hiveops-governance/types.ts
└── Potential drift between documentation and runtime reality
```

---

## B) EVIDENCE_TABLE

| path | why_in_graph | verification_basis |
|------|--------------|-------------------|
| `.opencode/plugins/hiveops-governance/index.ts` | Plugin entry point, registers all hooks | Hook registration in file lines 76-118 |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Injects governance context every LLM turn | Called by index.ts line 114, SDK signature at line 11 |
| `.opencode/plugins/hiveops-governance/hooks/delegation.ts` | Enforces delegation topology + scope | Called by index.ts line 85-86, script invocations at lines 60-77, 121-125 |
| `.opencode/plugins/hiveops-governance/hooks/events.ts` | Wires session/TODO/file events to scripts | Called by index.ts line 100-101, switch/case at lines 28-107 |
| `.opencode/plugins/hiveops-governance/hooks/compaction.ts` | Wires compaction recovery scripts | Called by index.ts line 107-109, script calls at lines 40-49 |
| `.opencode/plugins/hiveops-governance/utils.ts` | runGxScript() calls gx scripts | Script runner at lines 170-202, SCRIPTS_DIR at line 147 |
| `.opencode/plugins/hiveops-governance/types.ts` | DELEGATION_TOPOLOGY + SCOPE_BOUNDARIES definitions | Constants at lines 62-166, used by utils.ts validateDelegation() |
| `.opencode/skills/gx-context-engine/scripts/gx-enforce.sh` | Enforcement engine for path/delegation checks | Called by delegation.ts lines 60-77, 121-125, 135-145 |
| `.opencode/skills/gx-context-engine/scripts/gx-health-compute.sh` | Runs 12 signal scripts for health scoring | Called by delegation.ts line 199, signal loop at lines 255-295 |
| `.opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh` | Builds runtime-profile.json on session start | Called by events.ts line 50, profile building at lines 196-220 |
| `.opencode/skills/gx-context-engine/scripts/gx-todo-sync.sh` | Syncs TODO state with hierarchy | Called by events.ts line 87 |
| `.opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh` | Purifies context on session end/compact | Called by events.ts line 66, compaction.ts line 40 |
| `.opencode/skills/gx-context-engine/scripts/gx-context-retrieve.sh` | Synthesizes recovery context | Called by compaction.ts line 49 |
| `.opencode/agents/hivefiver.md` | Agent definition with blindness permissions | Frontmatter permission block lines 6-72, scope lines 77-89 |
| `.opencode/skills/hivefiver-prime/SKILL.md` | Mandatory first-load for hivefiver | Load order statement at line 13, entry map at lines 86-112 |
| `.opencode/skills/hivefiver-mode/SKILL.md` | Stage routing for hivefiver | Stage mapping at lines 39-47, script invocation at lines 16-18 |
| `.opencode/skills/hivefiver-context-enforcer/SKILL.md` | Remediation playbooks | Note at lines 6-7: "Always-on enforcement lives in plugin hooks" |
| `.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh` | Pre-turn/post-turn enforcement | Referenced in hivefiver-start.md lines 22, 94 and hivefiver-doctor.md lines 25, 99 |
| `.opencode/commands/hivefiver-start.md` | Command with script enforcement blocks | Enforcement block lines 9-27 with !`bash` invocations |
| `.opencode/commands/gx-steer.md` | GX-Pack entry point command | Enforcement block lines 9-17 with script invocations |
| `.opencode/workflows/gx-recover-loop.yaml` | Recovery workflow definition | Steps at lines 19-87 reference gx scripts |
| `.hivemind/state/runtime-profile.json` | Profile consumed by context-injection | Read by context-injection.ts line 185 |
| `.hivemind/state/health-metrics.json` | Health scores injected every turn | Read by context-injection.ts lines 159-167, 189-212 |
| `.hivemind/state/enforcement.json` | Enforcement state persisted | Written by utils.ts saveEnforcementState() line 93-98 |

---

## C) GAPS_AND_UNCERTAINTIES

1. **No workflows in `.opencode/workflows/` are deterministically invoked by plugin hooks**
   - Workflows exist (e.g., `gx-recover-loop.yaml`) but no TypeScript hook references them
   - Commands reference workflows by name in `<process>` sections but no wiring verified

2. **`gx-swarm-launch.sh` is listed as "stub" in index.ts comments but file exists**
   - No invocation path found in hooks or commands
   - Unclear if implemented or truly stub

3. **`gx-semantic-validate.sh` marked as "stub until R4" in compaction.ts**
   - Called at compaction.ts line 46 but implementation unclear

4. **`gx-sot-register.sh` marked as "stub" in index.ts comments**
   - Called by events.ts line 69 but may be incomplete

5. **Signal scripts in `signals/` directory not individually verified**
   - `gx-health-compute.sh` loops through them, but individual script content not validated
   - 12 scripts expected, 12 found — names match weights in gx-health-compute.sh

6. **`hivemind-governance` skill claims "Loaded every turn via system prompt injection"**
   - No plugin hook explicitly loads this skill
   - Unclear mechanism — possibly agent frontmatter `skill:` directive (not verified)

7. **Custom tools referenced in skills but not verified**
   - `scan_hierarchy`, `map_context`, `think_back`, `recall_mems` referenced in `context-integrity/SKILL.md`
   - These may be MCP tools or CLI commands — not traced in plugin wiring

8. **`bin/hivemind-tools.cjs` referenced in skills but outside `.opencode/` scope**
   - Called in hivemind-governance/SKILL.md but not investigated per constraints
---


---

# PHASE 2 ARCHITECTURE SKELETON MAP

**Investigation Date**: 2026-03-03  
**Scope**: `.opencode/**` and `.hivemind/**` only (read-only)  
**Confidence**: HIGH (direct file evidence)

---

## A) SKELETON_MATRIX

```
Agent Profiles
├── .opencode/agents/hivefiver.md
│   ├── (loads) → .opencode/skills/hivefiver-prime/SKILL.md
│   ├── (loads) → .opencode/skills/hivefiver-mode/SKILL.md
│   ├── (invokes) → .opencode/commands/hivefiver*.md [10 commands]
│   ├── (delegates to) → hivexplorer, hiveplanner, hiverd, hivehealer, hiveq
│   └── (enforced by) → .opencode/plugins/hiveops-governance/hooks/context-injection.ts
│
├── .opencode/agents/hiveminder.md
│   ├── (loads) → .opencode/skills/hivemind-governance/SKILL.md
│   ├── (loads) → .opencode/skills/session-lifecycle/SKILL.md
│   ├── (loads) → .opencode/skills/delegation-intelligence/SKILL.md
│   ├── (loads) → .opencode/skills/evidence-discipline/SKILL.md
│   ├── (invokes) → .opencode/commands/hivemind-*.md [12 commands]
│   ├── (delegates to) → all 7 hive agents
│   └── (enforced by) → .opencode/plugins/hiveops-governance/hooks/delegation.ts
│
├── .opencode/agents/hiveq.md
│   ├── (loads) → .opencode/skills/gate-enforcement/SKILL.md
│   ├── (invokes) → .opencode/commands/hiveq-*.md [6 commands]
│   └── (reads state from) → .hivemind/state/gates.json
│
├── .opencode/agents/hitea.md
│   ├── (loads) → .opencode/skills/hitea-*.md [4 testing skills]
│   └── (invokes) → .opencode/commands/hitea*.md [4 commands]
│
└── .opencode/agents/hiveplanner.md, hivehealer.md, hivemaker.md, hivexplorer.md, hiverd.md
    └── (each maps to specific command sets + skills)

Commands (42 total)
├── .opencode/commands/hivefiver.md
│   ├── (maps_to) → .opencode/workflows/hivefiver-*.yaml [8 workflows]
│   ├── (invokes) → scripts/route-stage.sh, classify-intent.sh, guided-discovery.sh
│   └── (writes state to) → .hivemind/hive-modules/hivefiver-v2/STATE.md
│
├── .opencode/commands/hivefiver-start.md
│   ├── (enforces) → scripts/gate-check.sh, runtime-gate.sh pre-turn
│   └── (writes state to) → STATE.md via scripts/state-update.sh
│
├── .opencode/commands/hivefiver-build.md
│   ├── (loads) → .opencode/skills/hivefiver-coordination/SKILL.md
│   └── (enforces) → scripts/quality-check.sh build
│
├── .opencode/commands/gx-*.md [4 commands]
│   ├── (maps_to) → .opencode/workflows/gx-*.yaml [3 workflows]
│   └── (invokes) → gx-context-engine/scripts/*.sh
│
├── .opencode/commands/hivemind-*.md [12 commands]
│   └── (maps_to) → .opencode/workflows/*.yaml [feature-sprint, bug-remediation, etc.]
│
└── .opencode/commands/hiveq-*.md, hitea*.md, hiverd-*.md
    └── (each maps to corresponding workflow + skill bundles)

Workflows (33 total)
├── .opencode/workflows/hivefiver-vibecoder.yaml
│   ├── (loads) → skill_bundles: [meta-builder-governance, hivefiver-persona-routing]
│   ├── (invokes) → hivefiver, hivefiver-intake, hivefiver-specforge, hivefiver-research
│   └── (guards) → context_first, evidence_gate, mcp_readiness, graph_connected, export_cycle
│
├── .opencode/workflows/hivefiver-enterprise-architect.yaml
│   ├── (loads) → skill_bundles: [hivefiver-spec-distillation, research-methodology]
│   └── (different lane with different strictness)
│
├── .opencode/workflows/gx-session-handoff.yaml
│   ├── (invokes) → gx-handoff-purify.sh, gx-sot-register.sh
│   └── (writes state to) → .hivemind/handoffs/handoff-*.json
│
├── .opencode/workflows/gx-recover-loop.yaml
│   └── (invokes) → gx-auto-purge.sh, gx-context-retrieve.sh
│
├── .opencode/workflows/verification-gate.yaml
│   └── (invokes) → gate-enforcement skill
│
└── .opencode/workflows/hivefiver/*.md [9 stage-specific md workflows]
    └── (each maps to stage command + helper skill)

Skills (49 total)
├── .opencode/skills/hivefiver-prime/SKILL.md
│   └── (entry skill for hivefiver — loads first)
│
├── .opencode/skills/hivefiver-mode/SKILL.md
│   ├── (loads) → .opencode/skills/hivefiver-coordination/SKILL.md
│   ├── (invokes) → scripts/route-stage.sh, scripts/classify-intent.sh
│   └── (reads state from) → .hivemind/state/hierarchy.json, STATE.md
│
├── .opencode/skills/hivefiver-coordination/SKILL.md
│   ├── (invokes) → scripts/runtime-gate.sh, scripts/quality-check.sh
│   ├── (invokes) → scripts/gate-check.sh, scripts/state-update.sh
│   └── (writes state to) → .hivemind/hive-modules/hivefiver-v2/handoffs/
│
├── .opencode/skills/gx-context-engine/SKILL.md
│   ├── (invokes) → scripts/gx-entry-guard.sh
│   ├── (invokes) → scripts/gx-mid-guard.sh
│   ├── (invokes) → scripts/gx-handoff-purify.sh
│   ├── (invokes) → scripts/gx-health-compute.sh
│   ├── (invokes) → scripts/gx-auto-purge.sh
│   ├── (invokes) → scripts/gx-schema-sync.sh
│   ├── (invokes) → scripts/gx-todo-sync.sh
│   ├── (invokes) → scripts/gx-enforce.sh
│   ├── (invokes) → scripts/gx-trace-check.sh
│   ├── (invokes) → scripts/gx-context-retrieve.sh
│   ├── (invokes) → scripts/gx-sot-register.sh
│   ├── (invokes) → scripts/gx-decision-log.sh
│   ├── (invokes) → scripts/gx-workflow-state.sh
│   ├── (invokes) → scripts/gx-scope-resolve.sh
│   ├── (invokes) → scripts/gx-semantic-validate.sh
│   ├── (invokes) → scripts/gx-swarm-launch.sh
│   ├── (invokes) → scripts/gx-first-turn-refresh.sh
│   └── (writes state to) → .hivemind/state/runtime-profile.json
│
├── .opencode/skills/hivemind-governance/SKILL.md
│   ├── (loads conditionally) → session-lifecycle
│   ├── (loads conditionally) → delegation-intelligence
│   ├── (loads conditionally) → evidence-discipline
│   └── (loads conditionally) → context-integrity
│
├── .opencode/skills/gate-enforcement/SKILL.md
│   └── (defines gate pass/fail logic for npm test, tsc, guard:public)
│
└── .opencode/skills/hitea-*.md, context-*, delegation-*, evidence-* [remaining 39 skills]
    └── (domain-specific helpers loaded on demand)

Scripts (Deterministic Enforcement Points)
├── .opencode/skills/gx-context-engine/scripts/
│   ├── gx-entry-guard.sh (enforces) → session start validation
│   ├── gx-first-turn-refresh.sh (enforces) → stale state refresh
│   ├── gx-mid-guard.sh (enforces) → every 10 tool calls health check
│   ├── gx-health-compute.sh (enforces) → 12 signal computation
│   ├── gx-enforce.sh (enforces) → delegation + scope boundary checks
│   ├── gx-trace-check.sh (enforces) → hierarchy linkage verification
│   ├── gx-todo-sync.sh (enforces) → TODO graph sync
│   ├── gx-schema-sync.sh (enforces) → state file schema validation
│   ├── gx-handoff-purify.sh (enforces) → context purification on compact
│   ├── gx-context-retrieve.sh (enforces) → post-compact recovery
│   ├── gx-auto-purge.sh (enforces) → dirty score > 90 auto-purge
│   ├── gx-sot-register.sh (enforces) → SOT artifact registration
│   ├── gx-decision-log.sh (enforces) → decision persistence
│   ├── gx-workflow-state.sh (enforces) → workflow stage transitions
│   ├── gx-scope-resolve.sh (enforces) → scope boundary resolution
│   ├── gx-semantic-validate.sh (enforces) → chain intent validation
│   └── gx-swarm-launch.sh (enforces) → parallel agent spawning
│
├── .opencode/skills/hivefiver-mode/scripts/
│   ├── route-stage.sh (reads) → .hivemind/state/hierarchy.json
│   ├── classify-intent.sh (produces) → intent classification JSON
│   └── guided-discovery.sh (produces) → user profile JSON
│
└── .opencode/skills/hivefiver-coordination/scripts/
    ├── runtime-gate.sh (enforces) → pre-turn, checkpoint, post-turn gates
    ├── quality-check.sh (enforces) → stage-specific quality validation
    ├── gate-check.sh (enforces) → entry criteria validation
    ├── state-update.sh (writes) → STATE.md mutations
    ├── pipeline-orchestrator.sh (reads) → pipeline sequence
    ├── hivefiver-must-pack.sh (produces) → unified obligations payload
    ├── session-continue.sh (produces) → auto-continue command
    └── validate-*.sh, verify-*.sh, schema-guard.sh, research-guard.sh

Plugin Hooks (Runtime Enforcement Layer)
├── .opencode/plugins/hiveops-governance/index.ts
│   ├── (wires) → tool.execute.before → delegation.ts
│   ├── (wires) → tool.execute.after → delegation.ts
│   ├── (wires) → event → events.ts
│   ├── (wires) → experimental.session.compacting → compaction.ts
│   └── (wires) → experimental.chat.messages.transform → context-injection.ts
│
├── .opencode/plugins/hiveops-governance/hooks/delegation.ts
│   ├── (invokes) → gx-enforce.sh check-delegation
│   ├── (invokes) → gx-trace-check.sh check-delegation
│   ├── (invokes) → gx-enforce.sh check-path
│   ├── (invokes) → gx-enforce.sh record-violation
│   ├── (invokes) → gx-health-compute.sh (every 10 calls)
│   ├── (invokes) → gx-mid-guard.sh (every 10 calls)
│   └── (invokes) → gx-auto-purge.sh check (every 10 calls)
│
├── .opencode/plugins/hiveops-governance/hooks/context-injection.ts
│   ├── (reads state from) → .hivemind/state/todo.json
│   ├── (reads state from) → .hivemind/state/runtime-profile.json
│   ├── (reads state from) → .hivemind/state/hierarchy.json
│   ├── (reads state from) → .hivemind/state/context-recovery.json
│   ├── (reads state from) → .hivemind/state/health-metrics.json
│   └── (injects) → governance context into every LLM turn
│
├── .opencode/plugins/hiveops-governance/hooks/events.ts
│   ├── (on session.created) → gx-entry-guard.sh
│   ├── (on session.started) → gx-first-turn-refresh.sh
│   ├── (on session.completed) → gx-handoff-purify.sh
│   ├── (on todo.updated) → gx-todo-sync.sh
│   └── (on file.edited) → gx-schema-sync.sh validate
│
└── .opencode/plugins/hiveops-governance/hooks/compaction.ts
    ├── (invokes) → gx-handoff-purify.sh
    ├── (invokes) → gx-schema-sync.sh check-all
    ├── (invokes) → gx-semantic-validate.sh
    └── (invokes) → gx-context-retrieve.sh
```

---

## B) L0_L3_PROGRESSIVE_DISCLOSURE_PATHS

### L0 — Entry-Only Paths (~100 tokens)
```
.opencode/skills/hivefiver-prime/SKILL.md
.opencode/skills/hivefiver-mode/SKILL.md
.opencode/skills/hivemind-governance/SKILL.md
.opencode/skills/gx-context-engine/SKILL.md
.opencode/skills/gate-enforcement/SKILL.md
.opencode/skills/context-integrity/SKILL.md
.opencode/skills/delegation-intelligence/SKILL.md
.opencode/skills/evidence-discipline/SKILL.md
.opencode/skills/session-lifecycle/SKILL.md
.opencode/skills/debug-orchestration/SKILL.md
.opencode/skills/creative-ideating-room/SKILL.md
```

### L1 — Runtime Control Paths (~500-2K tokens)
```
.opencode/agents/hivefiver.md
.opencode/agents/hiveminder.md
.opencode/commands/hivefiver.md
.opencode/commands/hivefiver-start.md
.opencode/commands/gx-steer.md
.opencode/skills/hivefiver-coordination/SKILL.md
.opencode/skills/hivefiver-orchestrator/SKILL.md
.opencode/plugins/hiveops-governance/index.ts
```

### L2 — Stage/Helper Specialization Paths (~1K-5K tokens)
```
.opencode/skills/hivefiver-persona-routing/SKILL.md
.opencode/skills/hivefiver-spec-distillation/SKILL.md
.opencode/skills/hivefiver-guided-discovery/SKILL.md
.opencode/skills/hivefiver-skill-auditor/SKILL.md
.opencode/skills/hivemind-framework-auditor/SKILL.md
.opencode/skills/hiveplanner-orchestration/SKILL.md
.opencode/skills/meta-builder-governance/SKILL.md
.opencode/workflows/hivefiver-vibecoder.yaml
.opencode/workflows/hivefiver-enterprise-architect.yaml
.opencode/skills/hivefiver-mode/scripts/route-stage.sh
.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh
```

### L3 — Audit/Doctor Deep Paths (~5K-15K tokens)
```
.opencode/skills/gx-context-engine/scripts/gx-health-compute.sh
.opencode/skills/gx-context-engine/scripts/gx-enforce.sh
.opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh
.opencode/skills/gx-context-engine/scripts/gx-auto-purge.sh
.opencode/skills/gx-context-engine/scripts/gx-semantic-validate.sh
.opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh
.opencode/plugins/hiveops-governance/hooks/delegation.ts
.opencode/plugins/hiveops-governance/hooks/context-injection.ts
.opencode/plugins/hiveops-governance/hooks/compaction.ts
.hivemind/state/health-metrics.json
.hivemind/state/hierarchy.json
.hivemind/hive-modules/hivefiver-v2/STATE.md
```

---

## C) ENTRY_VARIANT_ROUTING

### Variant 1: New Session
```
Hook: .opencode/plugins/hiveops-governance/hooks/events.ts
  └─ (triggers on session.created)
      → .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh
          (builds runtime-profile.json)
      → .opencode/skills/gx-context-engine/scripts/gx-first-turn-refresh.sh
          (refreshes stale state)

Agent Entry: .opencode/agents/hivefiver.md
  └─ (loads first) → .opencode/skills/hivefiver-prime/SKILL.md
      └─ (loads second) → .opencode/skills/hivefiver-mode/SKILL.md
          └─ (invokes) → scripts/route-stage.sh
              └─ (reads) → .hivemind/state/hierarchy.json
              └─ (reads) → .hivemind/hive-modules/hivefiver-v2/STATE.md

classify-intent enters at: .opencode/skills/hivefiver-mode/scripts/classify-intent.sh
  └─ (produces JSON with intent, confidence, next_command)

route-stage enters at: .opencode/skills/hivefiver-mode/scripts/route-stage.sh
  └─ (produces JSON with stage, command, workflow, refs)
```

### Variant 2: Post-Compaction Recovery
```
Hook: .opencode/plugins/hiveops-governance/hooks/compaction.ts
  └─ (triggers on experimental.session.compacting)
      → .opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh
          (purifies context for handoff)
      → .opencode/skills/gx-context-engine/scripts/gx-schema-sync.sh check-all
          (validates all state schemas)
      → .opencode/skills/gx-context-engine/scripts/gx-context-retrieve.sh
          (builds context-recovery.json)

Context Injection: .opencode/plugins/hiveops-governance/hooks/context-injection.ts
  └─ (reads) → .hivemind/state/context-recovery.json
      └─ (injects) → trajectory_summary, active_todos, key_decisions, recommended_next

Agent Entry: .opencode/agents/hivefiver.md
  └─ (detects recovery) → hivefiver-prime SKILL.md §2 (Compact Continuity Protocol)
      └─ (reads) → last message from prior context
      └─ (resumes from) → "next action" directive or declares gap
```

### Variant 3: Delegated Sub-Session
```
Hook: .opencode/plugins/hiveops-governance/hooks/delegation.ts
  └─ (triggers on tool.execute.before for Task tool)
      → .opencode/skills/gx-context-engine/scripts/gx-enforce.sh check-delegation
          (validates delegation topology)
      → .opencode/skills/gx-context-engine/scripts/gx-trace-check.sh check-delegation
          (verifies hierarchy linkage)
      └─ (records) → DelegationChainEntry in enforcement state

Agent Entry: .opencode/agents/hivefiver.md (sub-session mode)
  └─ (behavior) → Execute delegation packet deterministically
  └─ (NO user confirmation) → Parent dispatch serves as authorization gate
  └─ (return) → Structured evidence schema only

classify-intent enters at: delegation packet (pre-classified by parent)
  └─ (skips classification) → Direct to task execution
```

---

## D) CONFLICT_SURFACES

| Path | Reason |
|------|--------|
| `.opencode/skills/hivefiver-prime/SKILL.md` ↔ `.opencode/skills/hivemind-governance/SKILL.md` | Both claim "load first" — different agents but shared global top-level entry pack |
| `.opencode/commands/hivefiver.md` ↔ `.opencode/commands/hivefiver-start.md` | Root router vs specific stage — `start` action resolves via keyword match |
| `.opencode/skills/gx-context-engine/scripts/gx-health-compute.sh` ↔ `.hivemind/state/health-metrics.json` | Script writes, plugin reads — race condition risk without atomicity |
| `.opencode/skills/hivefiver-mode/scripts/route-stage.sh` ↔ `.hivemind/state/hierarchy.json` | Script reads hierarchy for stage detection — concurrent hierarchy mutations cause stale reads |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` ↔ `.hivemind/state/*.json` (5 files) | Reads 5 state files every turn — any stale file injects poisoned context |
| `.opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh` ↔ `.opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh` | Both fire mid-session — potential duplicate enforcement overhead |
| `.opencode/agents/hivefiver.md` (blindness) ↔ `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` (blindness enforcement) | Agent profile declares read:deny, but plugin enforces blindness reminder injection — double enforcement |
| `.opencode/workflows/hivefiver-vibecoder.yaml` ↔ `.opencode/workflows/hivefiver-enterprise-architect.yaml` | Same stage sequence but different skill_bundles — persona routing collision if both match |
| `.hivemind/hive-modules/hivefiver-v2/STATE.md` ↔ `.hivemind/state/hierarchy.json` | STATE.md tracks pipeline, hierarchy.json tracks trajectory → tactic → action — dual source of truth risk |
| `.opencode/skills/context-integrity/SKILL.md` ↔ `.opencode/skills/context-quality-escalation/SKILL.md` | Both handle context degradation — escalation deprecated (merged into integrity) but file still exists |

---

## E) MINIMUM_GOLDEN_PATH

**Shortest verified path for clean hivefiver turn (entry → gated completion):**

```
User invokes: /hivefiver start "build me a skill"

1. .opencode/plugins/hiveops-governance/hooks/events.ts
   (enforces) → gx-entry-guard.sh [builds runtime-profile.json]
   (enforces) → gx-first-turn-refresh.sh [refreshes stale state]

2. .opencode/agents/hivefiver.md
   (loads) → .opencode/skills/hivefiver-prime/SKILL.md
   (loads) → .opencode/skills/hivefiver-mode/SKILL.md

3. .opencode/commands/hivefiver-start.md
   (enforces) → gate-check.sh start [G0 entry criteria]
   (invokes) → classify-intent.sh [→ intent: build_new, confidence: high]
   (invokes) → guided-discovery.sh [→ user profile]
   (enforces) → runtime-gate.sh pre-turn [MANDATORY]

4. .opencode/skills/hivefiver-mode/SKILL.md
   (reads state from) → .hivemind/state/hierarchy.json
   (reads state from) → .hivemind/hive-modules/hivefiver-v2/STATE.md
   (determines) → stage: start, next_command: /hivefiver discovery

5. .opencode/skills/hivefiver-coordination/SKILL.md
   (enforces) → G0: scope valid, context present
   (verifies) → target contract identified

6. .opencode/commands/hivefiver-start.md
   (writes state to) → STATE.md via state-update.sh set-active, set-stage, set-target
   (enforces) → runtime-gate.sh post-turn [MANDATORY]
   (produces) → output_contract with classified_intent, pipeline_sequence, next_command

7. .opencode/plugins/hiveops-governance/hooks/context-injection.ts
   (injects) → Updated TODO, hierarchy cursor, health signals into next LLM turn

8. Gate 0 CLOSES: Output includes must_pack + runtime_gate_post_turn evidence
   Handoff emitted: next_command=/hivefiver discovery
```

**Relation tags on golden path:**
```
events.ts (enforces) → gx-entry-guard.sh
hivefiver.md (loads) → hivefiver-prime/SKILL.md
hivefiver-prime (loads) → hivefiver-mode/SKILL.md
hivefiver-start.md (enforces) → gate-check.sh
hivefiver-start.md (invokes) → classify-intent.sh
hivefiver-mode (reads state from) → hierarchy.json
hivefiver-mode (reads state from) → STATE.md
hivefiver-coordination (enforces) → G0 entry criteria
hivefiver-start.md (writes state to) → STATE.md
hivefiver-start.md (enforces) → runtime-gate.sh post-turn
context-injection.ts (reads state from) → todo.json
context-injection.ts (injects) → governance context
```

---

I’m ready for Phase 3 (node-by-node synthesis).  
Recommended first node: hivefiver-prime (best leverage, lowest blast radius).  
If you prefer, I can start instead at hooks/context-injection.ts (higher risk, bigger immediate impact).
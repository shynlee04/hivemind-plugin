# SPEC: GX-Pack — Context Engineering Module

> **Date:** 2026-03-02
> **Owner:** hivefiver → hiveminder (on module graduation)
> **Module:** gx-pack (Governed eXecution Pack)
> **Location:** `.hivemind/hive-modules/gx-pack/`
> **Scope:** `.opencode/**`, `.hivemind/**`, `docs/**` — NEVER `src/`, NEVER `tests/`
> **Parent:** hivefiver-v2 (inherits enforcement architecture)
> **Decision:** D37 — GX-Pack selected over GSD mirror and incremental patch

---

## Objective

Build a deterministic, stateful context engineering engine that:

1. **Steers the refactoring** of HiveMind plugin internals (schemas, graph engines, lib/) through agent delegation — without touching `src/` directly
2. **Proves delegation at runtime** with auditable trails, profile-bound capability enforcement, and depth-limited agent hierarchies
3. **Ensures context continuity** across sessions through programmatic prompt injection, TODO-graph sync, and SOT-first export pipelines
4. **Replaces mechanical validation** with semantic chain validation that checks intent alignment, not just file existence

---

## Audit Findings

### Reusable Assets (KEEP + EXTEND)

| Asset | Covers | Extension Needed |
|-------|--------|-----------------|
| Plugin `hiveops-governance/` | R1 delegation, R3 compaction, R5 scope | Add `messages.transform` hook, runtime profile enforcement |
| Tool `hiveops_todo.ts` | R2 TODO state machine | 40-subtask cap, HARD STOP enforcement, hierarchy bidirectional sync |
| Tool `hiveops_gate.ts` | R4 quality gates G0-G4 | Semantic validation integration, cross-domain criteria |
| Tool `hiveops_sot.ts` | R7 SOT artifacts | Automatic chaining on output, JSONL export |
| Tool `hiveops_export.ts` | R6 session handoff | Purification step, schema validation, SOT auto-registration |
| 16 hivefiver scripts | Pipeline orchestration | Pattern reuse for gx-* scripts |
| runtime-gate.sh | Unified lifecycle enforcer | Pattern template for gx-entry-guard.sh |

### Critical Gaps (BUILD)

| # | Gap | Domain | Priority |
|---|-----|--------|----------|
| G1 | No `messages.transform` hook — cannot inject context programmatically | R3 | 🔴 P0 |
| G2 | No runtime profile auto-construction | R1 | 🔴 P0 |
| G3 | No semantic validation (command→workflow→skill intent) | R4 | 🟡 P1 |
| G4 | No context purification pipeline | R6 | 🟡 P1 |
| G5 | No TODO-graph bidirectional sync | R2 | 🟡 P1 |
| G6 | No delegation audit trail | R5 | 🟢 P2 |
| G7 | No JSONL searchable export pipeline | R7/R8 | 🟢 P2 |

### Conflicts (RESOLVE)

| # | Conflict | Resolution |
|---|----------|------------|
| C1 | hivemaker `edit: "*": allow` violates L3 restriction | Change to explicit path allowlist |
| C2 | Pipeline state says "discovery" but all stages complete | Reset pipeline for new gx-pack module |
| C3 | 34 commands, many untethered from workflows | Audit; wire or deprecate non-chained commands |

---

## Asset Topology

### Module State

```
.hivemind/hive-modules/gx-pack/
├── STATE.md               # Machine-parseable pipeline state
├── TRAJECTORY.md           # Phase definitions, milestones, gates
└── synthesis/
    └── CONTEXT-ENGINE-PATTERNS.md
```

### Skill: gx-context-engine

```
.opencode/skills/gx-context-engine/
├── SKILL.md               # "Use when steering refactoring, enforcing delegation, or managing context continuity"
├── scripts/
│   ├── gx-entry-guard.sh   # Session entry: profile build, policy hash, state lock
│   ├── gx-mid-guard.sh     # Mid-session: drift scan, depth guard, TODO check
│   ├── gx-todo-sync.sh     # TODO mutation: graph sync, 40-cap, HARD STOP
│   ├── gx-semantic-validate.sh  # Stage close: intent alignment, chain validation
│   ├── gx-handoff-purify.sh     # Pre-export: noise strip, decision extract
│   └── gx-sot-register.sh      # Final: index, JSONL export, registry update
└── references/
    ├── context-engineering-spec.md    # Engine operational manual
    ├── delegation-hierarchy.md        # L2/L3/Monitor boundaries
    ├── schema-graph-registry.md       # Schema management protocol
    └── semantic-validation-rules.md   # Per-asset-type semantic criteria
```

### Commands (4 — focused, chained)

```
.opencode/commands/
├── gx-steer.md      # Router: classify intent → route to workflow
├── gx-recover.md    # Recovery: diagnose → fix → verify
├── gx-validate.md   # Semantic validation on demand
└── gx-profile.md    # Runtime profile inspect/rebuild
```

### Workflows (3 — wired to commands)

```
.opencode/workflows/
├── gx-recover-loop.yaml       # scan → diagnose → fix → verify → export
├── gx-semantic-pipeline.yaml  # load → check → report → remediate
└── gx-session-handoff.yaml    # export → purify → schema → SOT register
```

### Plugin Enhancement

```
.opencode/plugin/hiveops-governance/hooks/
└── context-injection.ts   # NEW: messages.transform hook
```

### Tool Enhancements

```
.opencode/tool/
├── hiveops_todo.ts   # EXTEND: 40-subtask cap, HARD STOP, hierarchy sync
├── hiveops_export.ts # EXTEND: purification step, SOT auto-registration
└── hiveops_sot.ts    # EXTEND: JSONL export, automatic chaining
```

---

## Command → Workflow → Skill → Reference Chain

```
/gx-steer "recover the schema engine"
    │
    ├── !`gx-entry-guard.sh .`              ← Layer 1: pre-prompt enforcement
    │   └── builds runtime-profile.json
    │   └── verifies policy hash
    │   └── locks state
    │
    ├── classify-intent.sh → "fix_broken"   ← Intent classification (reused from hivefiver)
    │
    ├── load skill: gx-context-engine
    │   └── references/context-engineering-spec.md
    │   └── references/delegation-hierarchy.md
    │
    ├── route to workflow: gx-recover-loop.yaml
    │   ├── Step 1: Scan — hivexplorer investigates .opencode + .hivemind
    │   ├── Step 2: Diagnose — gx-semantic-validate.sh checks chain integrity
    │   ├── Step 3: Fix — hivemaker (L3) receives scoped delegation packet
    │   │   └── profile_id attached, depth=1, scope=.opencode/** only
    │   ├── Step 4: Verify — hiveq (Monitor) runs gate check
    │   │   └── TDD compliance, edge cases, regression check
    │   └── Step 5: Export — gx-handoff-purify.sh → gx-sot-register.sh
    │
    └── !`gx-semantic-validate.sh .`        ← Layer 5: post-prompt enforcement
```

---

## Mechanism: Runtime Profile Auto-Construction

### Algorithm

```
INPUT:  user_prompt, hierarchy_node, policy_version, session_context
OUTPUT: .hivemind/state/runtime-profile.json

Step 1: CLASSIFY INTENT
  └── classify-intent.sh (existing, proven)
  └── → intent_type: build_new | fix_broken | audit_health | extend | improve

Step 2: RESOLVE ROLE ENVELOPE
  └── intent → { primary (L2), secondary (L3), monitor } mapping
  └── build_new  → { hiveminder, hivemaker, hiveq }
  └── fix_broken → { hiveminder, hivehealer, hiveq }
  └── audit_health → { hiveq, hivexplorer, hiveminder }

Step 3: COMPUTE CAPABILITIES
  └── Read DELEGATION_TOPOLOGY[primary] from plugin types.ts
  └── Filter: tools, paths, depth_limit, delegate_to[]

Step 4: BUILD PROFILE ID
  └── hash = sha256(intent + scope + policy_version)[:12]
  └── → "gx-profile-<hash>"

Step 5: PERSIST + ATTACH
  └── Write runtime-profile.json
  └── Plugin hook reads profile on every tool.execute.before
  └── Validates capability match; blocks unauthorized operations
```

### Profile Schema

```json
{
  "id": "gx-profile-a1b2c3d4e5f6",
  "created": "<timestamp>",
  "ttl": 3600000,
  "intent": "fix_broken",
  "policy_version": "gx-pack-v1",
  "role_envelope": {
    "primary": { "agent": "hiveminder", "level": 2 },
    "secondary": { "agent": "hivehealer", "level": 3 },
    "monitor": { "agent": "hiveq", "level": 3 }
  },
  "capabilities": {
    "tools": ["read", "glob", "grep", "task", "skill", "hiveops_todo", "hiveops_gate"],
    "paths": [".opencode/**", ".hivemind/**", "docs/**"],
    "depth_limit": 3,
    "delegate_to": ["hivehealer", "hivexplorer", "hiveq"]
  },
  "constraints": [
    "L3 agents cannot execute critical-path edits",
    "Monitor must verify before stage promotion",
    "All delegation packets must include profile_id"
  ]
}
```

---

## Mechanism: Context Engineering Engine

### messages.transform Hook (P0 — Most Critical)

```typescript
// .opencode/plugin/hiveops-governance/hooks/context-injection.ts
// This is the ONLY programmatic way to inject governance context into every LLM turn

"experimental.chat.messages.transform": async (messages) => {
  const enforcement = loadEnforcementState(worktree)
  const todoState = loadTodoState(worktree)
  const profile = loadRuntimeProfile(worktree)
  const hierarchy = loadHierarchy(worktree)

  const contextBlock = [
    "## 🔒 GX-Pack Governance Context (Auto-Injected)",
    `Agent: ${enforcement?.agent} | Profile: ${profile?.id}`,
    `Turn: ${enforcement?.turnCount} | Drift: ${computeDrift(enforcement)}%`,
    `Depth: ${enforcement?.delegationChain.length}/${profile?.capabilities.depth_limit}`,
    "",
    "### Active TODO",
    formatActiveTodo(todoState),
    "",
    "### Hierarchy Cursor",
    formatHierarchyCursor(hierarchy),
    "",
    "### Constraints",
    ...(profile?.constraints || []).map(c => `- ${c}`),
    "",
    "### Scope Violations",
    enforcement?.scopeViolations.length > 0
      ? `⚠️ ${enforcement.scopeViolations.length} violations recorded`
      : "✅ Clean",
  ].join("\n")

  return [{ role: "system", content: contextBlock }, ...messages]
}
```

### TODO-Graph Bidirectional Sync

```
hierarchy.json change → gx-todo-sync.sh
  └── new action node → create TODO item with hierarchy_node_id
  └── action status change → update TODO status
  └── action deleted → cancel TODO item

todo.json change → gx-todo-sync.sh
  └── TODO completed → mark hierarchy action "complete"
  └── TODO blocked → flag hierarchy action "blocked"
  └── triggers upstream status recompute
```

### Purification Pipeline

```
Session Content → gx-handoff-purify.sh
  └── Step 1: Strip noise (tool call metadata, system messages, repetitive context)
  └── Step 2: Extract decisions (pattern: "decided to...", "chose...", "rejected...")
  └── Step 3: Extract evidence (pattern: "$ command", test outputs, diff blocks)
  └── Step 4: Extract actions (pattern: "next:", "TODO:", "remaining:")
  └── Step 5: Validate against handoff schema
  └── Step 6: Output purified handoff JSON + markdown

  → gx-sot-register.sh
    └── Register handoff in SOT index
    └── Append to .hivemind/exports/<date>-handoff.jsonl
    └── Update tag index for grep/glob retrieval
```

---

## Delegation Hierarchy

### Level Structure

```
USER (L0)
  └── hiveminder (L1/L2 — Orchestrator + Strategic Architect)
       ├── Owns: TODO graph, hierarchy, context, delegation routing
       ├── Can delegate to: ALL L3 agents
       ├── NEVER touches: src/ directly
       │
       ├── hivemaker (L3 — Execution Specialist, RESTRICTED)
       │   ├── Can: investigate, review, research within scope
       │   ├── Cannot: autonomous critical-path execution without approval
       │   ├── Must: receive delegation packet with profile_id
       │   └── Must: return structured evidence bundle
       │
       ├── hivehealer (L3 — Recovery Specialist)
       │   ├── Can: diagnose and fix broken chains
       │   └── Cannot: delegate further
       │
       └── hiveq (L3 — Monitor Gatekeeper)
           ├── Validates: TDD compliance, spec coverage, edge cases
           ├── Has: VETO power on stage promotion
           └── NEVER: modifies code — verification only
```

### Proof Mechanism

Every delegation produces an audit trail entry:

```jsonl
{"ts":1709337601,"from":"hiveminder","to":"hivemaker","depth":1,"profile":"gx-profile-a1b2c3d4","status":"approved","objective":"Investigate schema inconsistencies"}
{"ts":1709337700,"from":"hivemaker","to":"src/lib/graph-io.ts","depth":1,"profile":"gx-profile-a1b2c3d4","status":"BLOCKED","reason":"L3 cannot edit critical-path files"}
```

---

## Enforcement Chain (7 Layers, Non-Overlapping)

| Layer | Mechanism | Trigger | Scope |
|-------|-----------|---------|-------|
| 0 | Plugin: `tool.execute.before` | Every tool call | Path + delegation validation |
| 1 | Command: `!`gx-entry-guard.sh`` | Session start | Profile build, policy hash, state lock |
| 2 | Plugin: `messages.transform` | Every LLM turn | Context injection (governance, TODO, hierarchy) |
| 3 | Plugin: `event` (every 3 tools) | Mid-session | Drift scan, depth guard, mid-guard check |
| 4 | Plugin: `tool.execute.after` (on hiveops_todo) | TODO mutation | Graph sync, 40-cap, HARD STOP enforcement |
| 5 | Workflow: exit gate | Stage close | Semantic chain validation |
| 6 | Export: pipeline | Session end | Purify → schema validate → SOT register |

---

## Three-Phase Rollout

### Phase 1 — Skeleton + Policy Lock

| # | Deliverable | Type | Exit Criterion |
|---|-------------|------|----------------|
| 1.1 | Module state files (STATE.md, TRAJECTORY.md) | State | Machine-parseable, linked to this spec |
| 1.2 | gx-context-engine skill (SKILL.md + scripts stubs + references) | Skill | SKILL.md has trigger text, scripts are executable shells |
| 1.3 | 4 commands (gx-steer, gx-recover, gx-validate, gx-profile) | Commands | All have `<enforcement>` blocks with `!`cmd`` injection |
| 1.4 | 3 workflows (recover-loop, semantic-pipeline, session-handoff) | Workflows | Entry/exit criteria, numbered steps, offer_next |
| 1.5 | context-injection.ts hook in plugin | Plugin | messages.transform injects governance context |
| 1.6 | gx-entry-guard.sh runtime profile builder | Script | Produces identical profile for identical inputs |
| 1.7 | hiveops_todo enhancement (40-cap, HARD STOP) | Tool | Rejects >40 subtasks, enforces last-item HARD STOP |

**Phase 1 Gate:** `gx-entry-guard.sh` deterministic + `messages.transform` injects context + plugin compiles.

### Phase 2 — Continuity + Semantic Validator

| # | Deliverable | Type | Exit Criterion |
|---|-------------|------|----------------|
| 2.1 | gx-todo-sync.sh (bidirectional hierarchy ↔ TODO) | Script | Hierarchy change → TODO updated; TODO complete → hierarchy marked |
| 2.2 | gx-mid-guard.sh (drift + depth enforcement) | Script | Warns at drift >40%, blocks at depth exceeded |
| 2.3 | gx-semantic-validate.sh (intent chain validation) | Script | Catches command→workflow→skill mismatches |
| 2.4 | gx-handoff-purify.sh (export purification) | Script | Strips noise, extracts decisions, validates schema |
| 2.5 | hivemaker L3 restriction (edit scope tightening) | Agent | `edit: "*": deny`, `src/**: allow`, `tests/**: allow` only |
| 2.6 | hiveq monitor enhancement (TDD/spec/edge checking) | Agent | Can verify coverage, has VETO power |

**Phase 2 Gate:** 5-session replay with zero orphan tasks, zero schema violations, zero semantic mismatches.

### Phase 3 — SOT Hardening + Operator UX

| # | Deliverable | Type | Exit Criterion |
|---|-------------|------|----------------|
| 3.1 | gx-sot-register.sh (automatic SOT registration) | Script | Every export auto-registers in SOT index |
| 3.2 | hiveops_sot JSONL export + automatic chaining | Tool | `.hivemind/exports/` populated with grep-friendly JSONL |
| 3.3 | hiveops_export purification + SOT auto-registration | Tool | Handoff includes purified content + SOT link |
| 3.4 | Delegation audit trail (JSONL) | Plugin | `.hivemind/state/delegation-audit.jsonl` tracks all delegations |
| 3.5 | Full traceability proof | E2E | output → handoff → TODO → hierarchy → SOT traceable |

**Phase 3 Gate:** End-to-end traceability audit passes. Any decision traceable from output to SOT artifact.

---

## Validation Gates

| Gate | Name | Criteria |
|------|------|----------|
| G0 | Scope Integrity | No edits outside `.opencode/**`, `.hivemind/**`, `docs/**` |
| G1 | Spec Integrity | Acceptance criteria declared per deliverable |
| G2 | Orchestration Integrity | Dependencies explicit, depth constraints enforced |
| G3 | Evidence Integrity | Script outputs and schema validations attached |
| G4 | Export Integrity | Handoff and SOT artifacts linked and searchable |

---

## ADDENDUM: Autonomous Context Hygiene & Schematic Environment

> Added 2026-03-02 — addresses auto-purge, schematic sync, git-register, and swarm launch concerns.
> SDK verification source: DeepWiki anomalyco/opencode (verified 2026-03-02)

### SDK Capabilities (Verified via MCP Research)

| Capability | SDK Mechanism | Plugin Access |
|------------|---------------|---------------|
| **Spawn sub-sessions** | `client.session.create({ parentID, title, permission })` | ❌ Not on `client` directly — use `$` (Bun shell) to call `opencode run --agent <agent> "prompt"` |
| **Fork sessions** | `opencode run --fork --session <id>` | ✅ Via `$` shell API |
| **Transform messages** | `experimental.chat.messages.transform` | ✅ Mutate `output.messages` in-place |
| **React to events** | `event` hook — 20+ event types | ✅ `session.compacted`, `session.idle`, `todo.updated`, `file.edited`, etc. |
| **Inject compaction context** | `experimental.session.compacting` | ✅ Push to `output.context[]` array |
| **Execute CLI commands** | `$` (Bun shell API) | ✅ `await $\`opencode run --agent hivexplorer "retrieve context"\`.quiet()` |

### Mechanism 1: Auto-Purge on Dirty Context

**Trigger:** The plugin detects context degradation at runtime via `tool.execute.after` (every 10 tool calls) and `event` hook.

**Detection Criteria (Dirty Context):**

```
DIRTY if ANY of:
  ├── drift_score < 40       (from enforcement.json)
  ├── turnCount > 30         (context window pressure)
  ├── scopeViolations > 3    (repeated boundary attempts)
  ├── delegationChain > 3    (depth exceeded)
  └── todo.blocked > 5       (stuck state)
```

**Auto-Purge Algorithm:**

```
Step 1: DETECT — plugin hook computes dirty_score every 10 tool calls
  └── dirty_score = weighted(drift, turns, violations, depth, blocked)
  └── threshold: dirty_score > 70 → WARNING, > 90 → AUTO-PURGE

Step 2: SNAPSHOT — before purging, capture schematic state
  └── Write .hivemind/state/pre-purge-snapshot.json
  └── Contains: enforcement.json + todo.json + hierarchy cursor + active decisions
  └── Register in SOT index (hiveops_sot auto-register)

Step 3: SPAWN RETRIEVAL AGENT — via $ shell API
  └── await $`opencode run --agent hivexplorer --title "gx-context-retrieval-${timestamp}" "${retrieval_prompt}"`.quiet()
  └── retrieval_prompt includes:
      ├── "Read .hivemind/state/pre-purge-snapshot.json"
      ├── "Read .hivemind/state/hierarchy.json — locate deepest active node"
      ├── "Read .hivemind/state/todo.json — list pending/blocked items"
      ├── "Recall relevant memories via recall_mems"
      ├── "Write synthesis to .hivemind/state/context-recovery.json"
      └── "Return: { trajectory_summary, active_todos, key_decisions, recommended_next }"

Step 4: INJECT RECOVERED CONTEXT — via messages.transform
  └── On next turn, messages.transform reads context-recovery.json
  └── Prepends structured recovery block to messages array
  └── Agent resumes with clean, verified context

Step 5: ARCHIVE — move dirty session artifacts to .hivemind/archive/
  └── .hivemind/archive/<date>-session-<id>/
  └── Contains: pre-purge-snapshot, enforcement log, delegation audit
```

**Plugin Implementation:**

```typescript
// In hooks/delegation.ts — buildToolExecuteAfterHook enhancement
export function buildToolExecuteAfterHook(state: { current: EnforcementState; save: (s: any) => void; worktree: string; $: BunShell }) {
  return async (input: any, output: any) => {
    // Every 10 tool calls, check context health
    if (state.current.turnCount % 10 === 0) {
      const dirtyScore = computeDirtyScore(state.current)

      if (dirtyScore > 90) {
        // AUTO-PURGE: snapshot → spawn retrieval → archive
        const snapshot = captureSchematicSnapshot(state.worktree, state.current)
        writeSnapshot(state.worktree, snapshot)

        // Spawn retrieval agent (non-blocking)
        const prompt = buildRetrievalPrompt(snapshot)
        state.$`opencode run --agent hivexplorer --title "gx-context-retrieval" "${prompt}"`.quiet()

        // Mark state as "recovering"
        state.current.recovering = true
      } else if (dirtyScore > 70) {
        // WARNING: inject reminder into next messages.transform
        state.current.contextWarning = `Context degraded (score: ${dirtyScore}). Consider compacting or spawning retrieval agent.`
      }

      state.save(state.current)
    }
  }
}
```

### Mechanism 2: Schematic Environment

The **schematic environment** is the `.hivemind/state/` directory — a structured, machine-readable state layer that agents read from and write to. It is the single source of truth for runtime state.

**Schematic Files:**

```
.hivemind/state/
├── brain.json                  # Session state (drift, turns, mode)
├── hierarchy.json              # Trajectory → Tactic → Action tree
├── todo.json                   # Graph-linked TODO items (hiveops_todo)
├── gates.json                  # Quality gate records (hiveops_gate)
├── enforcement.json            # Delegation chain, scope violations
├── runtime-profile.json        # Auto-constructed agent profile (NEW)
├── sot-index.json              # SOT artifact registry (hiveops_sot)
├── context-recovery.json       # Recovery context from retrieval agent (NEW)
├── pre-purge-snapshot.json     # Snapshot before auto-purge (NEW)
├── schema-registry.json        # Schema version registry (NEW)
└── swarm-manifest.json         # Active swarm agent manifest (NEW)
```

**Read/Write Protocol:**

```
WRITE (any agent):
  1. Agent calls hiveops_todo/gate/sot/export tool
  2. Tool writes to .hivemind/state/<file>.json
  3. Plugin event hook (file.edited) detects change
  4. gx-todo-sync.sh runs bidirectional sync
  5. Schema version incremented in schema-registry.json

READ (any agent):
  1. messages.transform injects current schematic state summary
  2. Agent sees: active TODO, hierarchy cursor, profile constraints
  3. Agent's decisions are bounded by schematic state
  4. No hallucination possible — state is deterministic
```

### Mechanism 3: Schema Sync with Git Register

When schematic files change, the plugin:
1. Detects the change via `file.edited` event
2. Validates the new state against the schema registry
3. Stages the change for git tracking
4. Records the version in `schema-registry.json`

**Schema Registry:**

```json
{
  "version": 42,
  "lastSync": 1709337600000,
  "files": {
    "todo.json": { "hash": "abc123", "version": 42, "lastModified": 1709337600000 },
    "hierarchy.json": { "hash": "def456", "version": 41, "lastModified": 1709337500000 },
    "gates.json": { "hash": "ghi789", "version": 40, "lastModified": 1709337400000 }
  },
  "pendingSync": [],
  "conflicts": []
}
```

**Git Sync Script (gx-schema-sync.sh):**

```bash
#!/usr/bin/env bash
# Runs on file.edited event for .hivemind/state/*.json files
# 1. Validate schema (jq . file.json > /dev/null)
# 2. Compute hash (sha256sum)
# 3. Compare with schema-registry.json
# 4. If changed: update registry, stage for git
# 5. If conflict: write to conflicts[] and block

set -euo pipefail
WORKDIR="${1:-.}"
CHANGED_FILE="${2:-}"
REGISTRY="$WORKDIR/.hivemind/state/schema-registry.json"

# Validate JSON
if ! jq . "$CHANGED_FILE" > /dev/null 2>&1; then
  echo '{"status":"invalid","file":"'"$CHANGED_FILE"'","reason":"malformed JSON"}'
  exit 1
fi

# Compute hash and update registry
NEW_HASH=$(sha256sum "$CHANGED_FILE" | cut -d' ' -f1)
# ... update registry, increment version, stage for git
```

**Plugin Integration:**

```typescript
// In hooks/events.ts — buildEventHook enhancement
case "file.edited": {
  const filePath = event.properties?.path || ""
  if (filePath.startsWith(".hivemind/state/") && filePath.endsWith(".json")) {
    // Schema file changed — trigger sync
    await $`bash .opencode/skills/gx-context-engine/scripts/gx-schema-sync.sh ${worktree} ${filePath}`.quiet()
  }
  break
}
```

### Mechanism 4: Agent Swarm Launch from Schematic

When a complex operation requires multiple parallel agents (e.g., "refactor all schema validators in lib/"), the system:

1. Reads the schematic state (hierarchy, TODO graph, runtime profile)
2. Computes which agents to spawn based on task dependencies
3. Builds delegation packets for each agent
4. Spawns agents in parallel via `$` shell API
5. Writes swarm manifest to `.hivemind/state/swarm-manifest.json`
6. Monitors via `session.idle` events for completion

**Swarm Launch Algorithm:**

```
INPUT: task_graph (from TODO with dependencies), runtime_profile
OUTPUT: swarm-manifest.json + spawned agent sessions

Step 1: PARTITION — split task graph into independent clusters
  └── Tasks with zero dependency overlap → can run parallel
  └── Tasks with shared files → must run sequential
  └── Use gx-todo-sync.sh deps analysis

Step 2: VALIDATE — check parallel dispatch rules
  ├── Zero file overlap between clusters? ✅
  ├── Zero ordering dependency? ✅
  ├── Zero shared mutable state? ✅
  └── Failure isolation explicit? ✅
  └── If ANY fails → sequential execution

Step 3: BUILD PACKETS — per-agent delegation packets
  └── Each packet includes:
      ├── profile_id (from runtime-profile.json)
      ├── in_scope_paths (non-overlapping per agent)
      ├── objective (from TODO item content)
      ├── constraints (from runtime profile)
      └── return_schema (mandatory)

Step 4: SPAWN — via $ shell API
  └── for each cluster:
      await $`opencode run --agent ${agent} --title "gx-swarm-${cluster_id}" "${packet_prompt}"`.quiet()
  └── Non-blocking: all spawn in parallel

Step 5: MANIFEST — write swarm state
  └── .hivemind/state/swarm-manifest.json:
      {
        "swarm_id": "swarm-<hash>",
        "spawned": 1709337600000,
        "agents": [
          { "id": "ses_abc", "agent": "hivexplorer", "cluster": 1, "status": "running", "objective": "..." },
          { "id": "ses_def", "agent": "hivemaker", "cluster": 2, "status": "running", "objective": "..." }
        ],
        "profile_id": "gx-profile-a1b2c3d4",
        "total_tasks": 8,
        "parallel_clusters": 3
      }

Step 6: MONITOR — via event hook
  └── On session.idle event:
      ├── Match session ID to swarm manifest
      ├── Mark agent as "completed" or "failed"
      ├── When all agents complete → trigger export pipeline
      └── If any failed → spawn recovery agent or block
```

**Swarm Launch Script (gx-swarm-launch.sh):**

```bash
#!/usr/bin/env bash
# Reads TODO graph, partitions tasks, spawns parallel agents
# Input: workdir, intent
# Output: swarm-manifest.json

set -euo pipefail
WORKDIR="${1:-.}"
TODO_FILE="$WORKDIR/.hivemind/state/todo.json"
MANIFEST="$WORKDIR/.hivemind/state/swarm-manifest.json"
PROFILE="$WORKDIR/.hivemind/state/runtime-profile.json"

# Read pending tasks with no unmet dependencies
READY_TASKS=$(jq '[.items[] | select(.status == "pending" and (.depends_on | length == 0))]' "$TODO_FILE")
TASK_COUNT=$(echo "$READY_TASKS" | jq length)

if [ "$TASK_COUNT" -eq 0 ]; then
  echo '{"status":"no_ready_tasks","manifest":null}'
  exit 0
fi

# Partition into independent clusters (check file overlap)
# ... cluster computation logic ...

# Spawn agents per cluster
SWARM_ID="swarm-$(date +%s | sha256sum | head -c 12)"
AGENTS="[]"

for i in $(seq 0 $((TASK_COUNT - 1))); do
  TASK=$(echo "$READY_TASKS" | jq ".[$i]")
  OBJECTIVE=$(echo "$TASK" | jq -r '.content')
  AGENT_TYPE=$(echo "$PROFILE" | jq -r '.role_envelope.secondary.agent // "hivexplorer"')

  # Spawn via opencode CLI
  SESSION_TITLE="gx-swarm-${SWARM_ID}-task-${i}"
  opencode run --agent "$AGENT_TYPE" --title "$SESSION_TITLE" \
    "Execute this task within GX-Pack governance. Objective: $OBJECTIVE. Return structured evidence." &

  AGENTS=$(echo "$AGENTS" | jq ". + [{\"cluster\": $i, \"agent\": \"$AGENT_TYPE\", \"objective\": \"$OBJECTIVE\", \"status\": \"running\"}]")
done

# Write manifest
jq -n --argjson agents "$AGENTS" --arg swarm_id "$SWARM_ID" \
  '{swarm_id: $swarm_id, spawned: now, agents: $agents, total_tasks: ($agents | length)}' > "$MANIFEST"

echo "{\"status\":\"launched\",\"swarm_id\":\"$SWARM_ID\",\"agents_spawned\":$TASK_COUNT}"
```

### Mechanism 5: Export → Archive → Retrieve Cycle

When a session completes or compacts, the plugin automatically:

```
Session Complete/Compact
    │
    ├── 1. EXPORT — hiveops_export.handoff()
    │   └── Creates .hivemind/handoffs/handoff-<id>.json + .md
    │
    ├── 2. PURIFY — gx-handoff-purify.sh
    │   └── Strips noise, extracts decisions, validates schema
    │
    ├── 3. ARCHIVE — move to .hivemind/archive/<date>/
    │   └── enforcement.json, delegation-audit.jsonl, pre-purge snapshots
    │
    ├── 4. REGISTER SOT — gx-sot-register.sh
    │   └── Append to .hivemind/exports/<date>-handoff.jsonl
    │   └── Update sot-index.json
    │
    └── 5. SPAWN RETRIEVAL (if next session expected)
        └── await $`opencode run --agent hivexplorer --title "gx-retrieval" "${prompt}"`
        └── Retrieval agent reads:
            ├── Latest handoff artifact
            ├── TODO graph state
            ├── Hierarchy cursor position
            ├── Recalled memories (recall_mems)
            └── Schema registry version
        └── Writes: .hivemind/state/context-recovery.json
        └── Next session's messages.transform picks this up automatically
```

**Plugin Implementation (compaction hook enhancement):**

```typescript
// In hooks/compaction.ts — enhanced for auto-archive + retrieval spawn
export function buildCompactionHook(state: { current: EnforcementState; worktree: string; $: BunShell }) {
  return async (input: any, output: any) => {
    // 1. Inject governance context (existing behavior)
    const summary = formatEnforcementSummary(state.current)
    if (output.context && Array.isArray(output.context)) {
      output.context.push(summary)
    }

    // 2. Archive current enforcement state
    const archiveDir = join(state.worktree, ".hivemind/archive", new Date().toISOString().slice(0, 10))
    mkdirSync(archiveDir, { recursive: true })
    writeFileSync(
      join(archiveDir, `enforcement-${Date.now()}.json`),
      JSON.stringify(state.current, null, 2)
    )

    // 3. Run export pipeline
    await state.$`bash .opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh ${state.worktree}`.quiet()
    await state.$`bash .opencode/skills/gx-context-engine/scripts/gx-sot-register.sh ${state.worktree}`.quiet()

    // 4. Spawn retrieval agent for next session
    const retrievalPrompt = buildRetrievalPrompt(state.worktree, state.current)
    state.$`opencode run --agent hivexplorer --title "gx-context-retrieval-${Date.now()}" "${retrievalPrompt}"`.quiet()
  }
}
```

### Updated Asset Topology (with new scripts)

```
.opencode/skills/gx-context-engine/scripts/
├── gx-entry-guard.sh           # Session entry: profile build, policy hash, state lock
├── gx-mid-guard.sh             # Mid-session: drift scan, depth guard, dirty score
├── gx-todo-sync.sh             # TODO mutation: graph sync, 40-cap, HARD STOP
├── gx-semantic-validate.sh     # Stage close: intent alignment, chain validation
├── gx-handoff-purify.sh        # Pre-export: noise strip, decision extract
├── gx-sot-register.sh          # Final: index, JSONL export, registry update
├── gx-schema-sync.sh           # Git-register: schema validation, version increment    ← NEW
├── gx-swarm-launch.sh          # Swarm: partition tasks, spawn parallel agents          ← NEW
├── gx-auto-purge.sh            # Auto-purge: dirty detect, snapshot, spawn retrieval    ← NEW
└── gx-context-retrieve.sh      # Retrieval: read archives, synthesize recovery context  ← NEW
```

### Updated Phase Allocation

| Script | Phase | Rationale |
|--------|-------|-----------|
| gx-auto-purge.sh | Phase 1 | Foundation — context hygiene is P0 |
| gx-schema-sync.sh | Phase 2 | Requires TODO sync infrastructure |
| gx-swarm-launch.sh | Phase 3 | Requires full pipeline + audit trail |
| gx-context-retrieve.sh | Phase 1 | Paired with auto-purge |

---

## SOT References

| Document | Purpose |
|----------|---------|
| This spec | GX-Pack module specification (SOT) |
| `docs/plans/hivemind-recovery-pack-options-2026-03-02.md` | Options matrix and expert choice rationale |
| `docs/OPENCODE-ARCHITECTURE-NARRATIVE.md` | Unified architecture narrative |
| `docs/OPENCODE-CONCEPTS-ADVANCED.md` | Foundation concepts and agent taxonomy |
| `docs/OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md` | Delegation patterns SOT |
| `docs/opencode-full-sdk-mechanism.md` | SDK internal mechanisms |
| `docs/OPENCODE-KNOWLEDGE-MASTER-INDEX.md` | Knowledge base navigation hub |
| `docs/OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md` | Synthesis map |
| `docs/OPENCODE-META-BUILDER-MODULE.md` | Meta-builder module spec |
| `docs/OPENCODE-PRIMARY-COORDINATOR-AGENT.md` | Coordinator agent patterns |
| `.hivemind/hive-modules/hivefiver-v2/STATE.md` | Parent module state |

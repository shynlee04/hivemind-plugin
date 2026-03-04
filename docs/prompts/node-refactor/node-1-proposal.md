---

# 🏗️ NODE 1 REFACTORING BLUEPRINT
## The Injection Layer — Decoupling, Concurrency & Relational Staleness

**Version**: 1.0-DRAFT  
**Date**: 2026-03-03  
**Author**: hivefiver (synthesized from Team A + Team B + Human Architect)  
**Status**: AWAITING APPROVAL — No file writes until approved

---

## EXECUTIVE SUMMARY

Three surgical fixes to the auto-injection layer, ordered by blast radius (smallest first):

| Fix | Target | Risk | Blast Radius |
|-----|--------|------|-------------|
| **Fix 1: Dual-Injection Decoupling** | `context-injection.ts` + `session-lifecycle.ts` + `messages-transform.ts` | 🟡 Medium | 3 files, no schema change |
| **Fix 2: Relational Staleness** | `gx-signal-hierarchy-freshness.sh` | 🟢 Low | 1 script, no upstream deps |
| **Fix 3: Session-Scoped State** | `paths.ts` + all hook consumers | 🔴 High | 10+ files, schema migration |

Execution order: **Fix 2 → Fix 1 → Fix 3** (increasing blast radius)

---

## FIX 1: DUAL-INJECTION DECOUPLING

### The Problem (Verified)

Two independent injection systems fire on **every LLM turn**, unaware of each other:

| System | File | Channel | Agent-Aware? | Session-Scoped? |
|--------|------|---------|-------------|-----------------|
| **System 1** (Meta/Plugin) | `context-injection.ts` | `output.messages[]` (prepend msg) | PARTIAL (hivefiver block) | NO |
| **System 2a** (Product/Engine) | `session-lifecycle.ts` | `output.system[]` (system prompt) | NO | PARTIAL (sessionID gate) |
| **System 2b** (Product/Engine) | `messages-transform.ts` | `output.messages[].parts[]` (synthetic parts) | NO | PARTIAL (Set gate) |

Both read `hierarchy.json`. Both inject hierarchy data. Different formats. **The LLM sees contradictory hierarchy views.**

### The Decoupling Strategy: Agent-Domain Routing

**Principle**: System 1 owns `hivefiver` sessions. System 2 owns all other agent sessions. Neither fires for the other's domain.

#### 1A. Modify `context-injection.ts` — Add Agent Guard

**Current code** (line 179-181):
```typescript
return async (input: any, output: any) => {
  if (!output.messages || !Array.isArray(output.messages)) return
  // PROCEEDS UNCONDITIONALLY
```

**Proposed code**:
```typescript
return async (input: any, output: any) => {
  if (!output.messages || !Array.isArray(output.messages)) return
  
  // DECOUPLING GUARD: System 1 (GX-Pack) ONLY fires for meta-builder agents
  const META_BUILDER_AGENTS = ["hivefiver"] as const
  const currentAgent = state.current.agent
  if (!META_BUILDER_AGENTS.includes(currentAgent as any)) {
    return // MUTED — System 2 (product engine) owns this session
  }
  
  // ... existing injection logic continues for hivefiver only
```

**Rationale**: `context-injection.ts` was built for `hivefiver`'s blindness enforcement and GX-Pack governance. It should NOT inject its governance context into `hivemaker`, `hivehealer`, or `hiveminder` sessions — those are governed by System 2.

#### 1B. Modify `session-lifecycle.ts` — Add Inverse Agent Guard

**Current code** (line 80-88):
```typescript
return async (input: { sessionID?: string; model?: unknown }, output: { system: string[] }): Promise<void> => {
  try {
    const checklist = await injectGovernanceInstruction(output, effectiveDir, input.sessionID || "unknown")
    if (!input.sessionID) {
      appendChecklistFailureReminder(output, checklist)
      return
    }
```

**Proposed code**:
```typescript
return async (input: { sessionID?: string; model?: unknown }, output: { system: string[] }): Promise<void> => {
  try {
    // DECOUPLING GUARD: System 2 (product engine) MUTES for meta-builder agents
    // Meta-builder agents are governed by System 1 (GX-Pack plugin)
    const META_BUILDER_AGENTS = ["hivefiver"]
    const agentName = resolveCurrentAgent(input) // NEW: resolve from session context
    if (META_BUILDER_AGENTS.includes(agentName)) {
      return // MUTED — System 1 (GX-Pack) owns this session
    }
    
    const checklist = await injectGovernanceInstruction(output, effectiveDir, input.sessionID || "unknown")
```

**Challenge**: `session-lifecycle.ts` currently receives `input: { sessionID?, model? }` — it does NOT receive the agent name. We need to resolve this.

**Resolution Options**:

| Option | Mechanism | Complexity |
|--------|-----------|-----------|
| **A (Recommended)** | Read agent from `brain.json` → `state.session.agent` | Low — file already read downstream |
| **B** | Pass agent via SDK hook input enhancement | Medium — requires SDK change |
| **C** | Read from OpenCode session API | High — new dependency |

**Recommended: Option A** — Load `brain.json` early in the hook to resolve the current agent:
```typescript
// NEW: resolve agent from brain state (already loaded downstream)
function resolveCurrentAgent(input: { sessionID?: string }, directory: string): string {
  try {
    const brainPath = join(directory, ".hivemind", "state", "brain.json")
    if (!existsSync(brainPath)) return "unknown"
    const brain = JSON.parse(readFileSync(brainPath, "utf-8"))
    return brain.session?.agent || "unknown"
  } catch {
    return "unknown"
  }
}
```

#### 1C. Modify `messages-transform.ts` — Same Pattern

**Current code** (line 321-324):
```typescript
const config = await loadConfig(directory)
if (config.governance_mode === "permissive") return
```

**Proposed addition** (after line 324):
```typescript
const config = await loadConfig(directory)
if (config.governance_mode === "permissive") return

// DECOUPLING GUARD: System 2 mutes for meta-builder agents
const brainState = await stateManager.load()
const currentAgent = brainState?.session?.agent || "unknown"
const META_BUILDER_AGENTS = ["hivefiver"]
if (META_BUILDER_AGENTS.includes(currentAgent)) {
  return // MUTED — System 1 (GX-Pack) governs meta-builder sessions
}
```

#### 1D. Resolve Conflict Surface #7: Double Blindness Enforcement

**Finding** (Team B): hivefiver's agent frontmatter declares `read:deny, glob:deny` AND `context-injection.ts:294-330` injects blindness enforcement text every turn.

**Decision**: Keep the plugin injection (it escalates severity based on turn count). Remove redundant text from agent frontmatter body — let the deterministic plugin be the single source.

#### 1E. Resolve Conflict Surface #9: Dual SOT (STATE.md vs hierarchy.json)

**Finding** (Team B): `STATE.md` tracks pipeline progress. `hierarchy.json` tracks trajectory tree. Both claim to be "the current state."

**Decision**: 
- `hierarchy.json` is the **runtime SOT** (read by hooks, drives cursor)
- `STATE.md` is the **human-readable log** (never read by hooks, never drives decisions)
- Add a header to `STATE.md`: `<!-- AUDIT LOG ONLY — Runtime SOT is hierarchy.json -->`

---

## FIX 2: RELATIONAL STALENESS (Kill Wall-Clock)

### The Problem (Verified)

`gx-signal-hierarchy-freshness.sh` lines 89-97:
```bash
age_minutes=$((age_seconds / 60))
score=$((100 - (age_minutes * decay_rate)))
```

With default `decay_rate=10`, the score hits **ZERO after 10 minutes**. A coffee break = "CRITICAL DRIFT."

### The Fix: Sequential/Topological Freshness

**Replace time-based decay with three relational signals:**

```bash
#!/usr/bin/env bash
# gx-signal-hierarchy-freshness.sh (REFACTORED)
# Staleness = relational drift, NOT wall-clock age

set -euo pipefail

WORKTREE="${1:-.}"
HIERARCHY_FILE="$WORKTREE/.hivemind/state/hierarchy.json"
BRAIN_FILE="$WORKTREE/.hivemind/state/brain.json"

score=100  # Start fresh, deduct for drift signals

# ─── SIGNAL 1: Git Drift (0-40 points) ───
# Has the codebase changed since the hierarchy was last updated?
# If code changed but hierarchy didn't update → stale
hierarchy_mtime=$(stat -f %m "$HIERARCHY_FILE" 2>/dev/null || echo 0)
git_last_commit=$(git -C "$WORKTREE" log -1 --format=%ct 2>/dev/null || echo 0)

if [ "$git_last_commit" -gt "$hierarchy_mtime" ]; then
  # Code changed after hierarchy last updated
  changed_files=$(git -C "$WORKTREE" diff --name-only --diff-filter=ACMR \
    --since="@$hierarchy_mtime" HEAD 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$changed_files" -gt 20 ]; then
    score=$((score - 40))  # Major drift
  elif [ "$changed_files" -gt 5 ]; then
    score=$((score - 20))  # Moderate drift  
  elif [ "$changed_files" -gt 0 ]; then
    score=$((score - 10))  # Minor drift
  fi
  # else: no changes since hierarchy update → no drift → no deduction
fi

# ─── SIGNAL 2: Row-Chain Continuity (0-35 points) ───
# Are there uncompleted tactic/action nodes that lost their parent?
orphan_count=$(jq -r '
  [.. | objects | select(.level != null and .status == "active") |
   select(.children == null or (.children | length) == 0)]
  | length
' "$HIERARCHY_FILE" 2>/dev/null || echo 0)

incomplete_chains=$(jq -r '
  [.. | objects | select(.level == "action" and .status == "pending") |
   select(.content == null or .content == "")]
  | length
' "$HIERARCHY_FILE" 2>/dev/null || echo 0)

if [ "$orphan_count" -gt 3 ] || [ "$incomplete_chains" -gt 5 ]; then
  score=$((score - 35))
elif [ "$orphan_count" -gt 0 ] || [ "$incomplete_chains" -gt 0 ]; then
  score=$((score - 15))
fi

# ─── SIGNAL 3: Session Continuity (0-25 points) ───
# Does the current session match the hierarchy's active trajectory?
session_id=$(jq -r '.session.id // empty' "$BRAIN_FILE" 2>/dev/null || echo "")
hierarchy_cursor=$(jq -r '.cursor // empty' "$HIERARCHY_FILE" 2>/dev/null || echo "")

if [ -z "$session_id" ] || [ -z "$hierarchy_cursor" ]; then
  score=$((score - 25))  # No active session or no cursor → disconnected
fi

# ─── CLAMP & OUTPUT ───
if [ "$score" -lt 0 ]; then score=0; fi
if [ "$score" -gt 100 ]; then score=100; fi

echo "$score"
```

**Key change**: A developer sleeping for 8 hours scores **100** if no code changed and the hierarchy is internally consistent. A developer making 30 code commits while the hierarchy hasn't updated scores **25** even if it was updated 2 minutes ago.

---

## FIX 3: SESSION-SCOPED STATE (Multi-Concurrency)

### The Problem (Verified)

`paths.ts` defines **ALL** state paths as project-global:
```
.hivemind/state/brain.json      ← ONE global file
.hivemind/state/hierarchy.json  ← ONE global file
.hivemind/state/todo.json       ← ONE global file
```

Two concurrent sessions read/write the same files → cross-contamination.

### The Architecture: Layered State Isolation

**Principle**: Split state into **Project-Level** (shared, rare writes) and **Session-Level** (isolated, frequent writes).

```
.hivemind/
├── config.json                          # Project-level (shared, stable)
├── state/
│   ├── hierarchy.json                   # Project-level SOT (the tree itself)
│   └── sot-index.json                   # Project-level artifact registry
│
├── sessions/
│   ├── manifest.json                    # Session registry
│   ├── active/
│   │   ├── session-<id-1>/              # Session A's isolated state
│   │   │   ├── brain.json               # Session-scoped runtime state
│   │   │   ├── todo.json                # Session-scoped TODOs
│   │   │   ├── health-metrics.json      # Session-scoped health
│   │   │   ├── runtime-profile.json     # Session-scoped profile
│   │   │   ├── enforcement.json         # Session-scoped enforcement
│   │   │   ├── context-recovery.json    # Session-scoped recovery
│   │   │   └── cursor.json              # Session's pointer into hierarchy.json
│   │   │
│   │   └── session-<id-2>/              # Session B's isolated state
│   │       ├── brain.json
│   │       ├── todo.json
│   │       └── ...
│   │
│   └── archive/                         # Completed sessions
```

### The Cursor Pattern

Instead of each session mutating the global `hierarchy.json` cursor, each session gets a **cursor.json** that points into the shared hierarchy:

```json
// sessions/active/session-abc123/cursor.json
{
  "session_id": "abc123",
  "agent": "hivefiver",
  "trajectory_id": "t_301411022026",
  "focused_node_id": "a_140511022026",
  "focused_level": "action",
  "created_at": "2026-03-03T10:00:00Z",
  "last_advanced_at": "2026-03-03T10:45:00Z"
}
```

The global `hierarchy.json` retains the tree structure and node statuses. But **which node a session is focused on** is session-local.

### Migration Path in `paths.ts`

```typescript
// NEW: Session-scoped path resolution
export function getSessionPaths(
  projectRoot: string,
  sessionId: string
): SessionScopedPaths {
  const base = getHivemindPaths(projectRoot)
  const sessionDir = join(base.activeDir, `session-${sessionId}`)
  
  return {
    // Session-isolated (hot state)
    brain: join(sessionDir, "brain.json"),
    todo: join(sessionDir, "todo.json"),
    healthMetrics: join(sessionDir, "health-metrics.json"),
    runtimeProfile: join(sessionDir, "runtime-profile.json"),
    enforcement: join(sessionDir, "enforcement.json"),
    contextRecovery: join(sessionDir, "context-recovery.json"),
    cursor: join(sessionDir, "cursor.json"),
    
    // Project-global (shared, stable)
    hierarchy: base.hierarchy,     // shared tree
    config: base.config,           // shared config
    sotIndex: base.sotIndex,       // shared artifact registry
  }
}
```

### Hook Consumer Changes

Every hook that reads state files must be updated to resolve session-scoped paths:

| Hook | Currently Reads | Should Read |
|------|----------------|-------------|
| `context-injection.ts` | `state/todo.json` | `sessions/active/<id>/todo.json` |
| `context-injection.ts` | `state/health-metrics.json` | `sessions/active/<id>/health-metrics.json` |
| `context-injection.ts` | `state/runtime-profile.json` | `sessions/active/<id>/runtime-profile.json` |
| `session-lifecycle.ts` | `state/brain.json` | `sessions/active/<id>/brain.json` |
| `messages-transform.ts` | `state/brain.json` | `sessions/active/<id>/brain.json` |
| `gx-entry-guard.sh` | `state/enforcement.json` | `sessions/active/<id>/enforcement.json` |
| `gx-health-compute.sh` | `state/health-metrics.json` | `sessions/active/<id>/health-metrics.json` |

**The `sessionId` is available** in most hooks via `input.sessionID` (verified in `session-lifecycle.ts`). For bash scripts, it can be passed as an argument.

### Migration Strategy (Non-Breaking)

```
Phase A: Add getSessionPaths() to paths.ts (additive, no breakage)
Phase B: Create session directories on session.created event (additive)  
Phase C: Copy global state → session state on first use (backward compat)
Phase D: Switch hooks to prefer session-scoped paths with global fallback
Phase E: Deprecate global state/*.json writes (only session-scoped writes)
Phase F: Remove global fallback (breaking, major version)
```

**We stop at Phase D for now** — this gives us concurrency isolation with backward compatibility.

---

## EXECUTION SEQUENCING

```
┌─────────────────────────────────────────────────────────┐
│ NODE 1: INJECTION LAYER REFACTORING                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Fix 2 (Relational Staleness)     ← LOWEST RISK │
│  ├── Modify: gx-signal-hierarchy-freshness.sh            │
│  ├── Test: Run signal script, verify scoring             │
│  └── Gate: health-metrics.json shows relational scores   │
│          ↓                                               │
│  Step 2: Fix 1 (Dual-Injection Decoupling) ← MEDIUM     │
│  ├── Modify: context-injection.ts (add agent guard)      │
│  ├── Modify: session-lifecycle.ts (add inverse guard)    │
│  ├── Modify: messages-transform.ts (add inverse guard)   │
│  ├── Test: Start hivefiver session → verify ONLY Sys1    │
│  ├── Test: Start hivemaker session → verify ONLY Sys2    │
│  └── Gate: No double-injection in any agent session      │
│          ↓                                               │
│  Step 3: Fix 3A-D (Session-Scoped State)  ← HIGHEST     │
│  ├── Modify: paths.ts (add getSessionPaths)              │
│  ├── Modify: events.ts (create session dir on start)     │
│  ├── Modify: all hooks (session-scoped reads)            │
│  ├── Modify: all gx scripts (accept session_id arg)     │
│  ├── Test: Two concurrent sessions → no cross-write     │
│  └── Gate: State isolation verified                      │
│          ↓                                               │
│  ⚠️ PLATFORM RESTART REQUIRED after each Step            │
│  (hooks are loaded at session init, changes need reload)  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## RISK MATRIX

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Agent guard reads stale `brain.json` agent field | Medium | Session runs with wrong injection system | Fallback: if agent unresolvable, fire BOTH (current behavior) |
| Session directory not created before hooks fire | Low | FileNotFound errors | Create dir synchronously in `session.created` event, before any hook |
| Backward compat break for scripts expecting global paths | Medium | Scripts fail silently | Phase D: session-scoped with global fallback |
| `hierarchy.json` concurrent writes during tree mutation | Low (current behavior) | Already exists — cursor pattern reduces frequency | Cursor pattern reduces shared writes to tree-structure-only |

---

## WHAT THIS BLUEPRINT DOES NOT COVER (Future Nodes)

| Deferred Item | Why Deferred | Future Node |
|---------------|-------------|-------------|
| Fixing hivefiver-prime SKILL.md content | Content changes AFTER injection layer is stable | Node 2 |
| Resolving 10 conflict surfaces from Team B | Infrastructure must be clean first | Node 2-3 |
| Skills refactoring (find-skill, skill-creator audit) | Depends on clean injection context | Node 3 |
| Command/Workflow restructuring | Depends on working skills | Node 4 |
| Stub script completion (gx-semantic-validate, gx-swarm-launch) | Not urgent — stubs don't inject | Node 5 |

---

**⏹️ HARD STOP — Awaiting your approval of this Node 1 Blueprint.**

Specifically, I need your decision on:

---


**THE QUESTIONS - The AI agent asked questions of these to following-up.**


1. Blueprint approval : asking about overall 3-fix structure (staleness - decoupling - concurrency) and the execution order - That is fix 2 -> fix 2 -> fix 3

2. Agent Resolution Method for fix 1 (decoupling), which agent resolution method should we use in session-lifecycle.ts
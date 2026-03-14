# GX-Pack Remediation — Certified Requirements Registry

> **Date**: 2026-03-02
> **Status**: CERTIFIED — All 19 requirements approved by user via structured Q&A
> **Supersedes**: All prior Phase 1 assumptions
> **Gate**: No implementation proceeds unless traceable to a requirement here

---

## Requirement Index

| ID | Domain | Requirement | Complexity |
|----|--------|-------------|------------|
| CR-01 | Enforcement | Hard Block on off-plan actions | 4/4 |
| CR-02 | Traceability | Every task traced to hierarchy node | 4/4 |
| CR-03 | Staleness | Level-aware relational staleness model | 4/4 |
| CR-04 | Evidence | Command output proof (timestamped, reproducible) | 3/4 |
| CR-05 | Cascade | Full mutual update propagation (all connected nodes) | 4/4 |
| CR-06 | Schema | Strict typed + versioned (Zod-like, additive-only evolution) | 4/4 |
| CR-07 | Compaction | Hard block + auto-recover (BLOCK → retrieve → synthesize → inject → unblock) | 4/4 |
| CR-08 | Scope | Dynamic per-task scope (tied to hierarchy node, narrows with depth) | 4/4 |
| CR-09 | Decisions | Structured decision log (append-only JSONL, supersession tracking) | 3/4 |
| CR-10 | Validation | 4 sequential layers (structural → semantic → domain → cross-domain) | 4/4 |
| CR-11 | Stubs | Flag as CHAIN_DEGRADED in monitoring (not silent) | 2/4 |
| CR-12 | Workflow | File-persisted state (`.hivemind/state/wf-{id}.json`) | 3/4 |
| CR-13 | Metrics | Multi-signal health vector (12 signals, 0-100 each, temporal analysis) | 4/4 |
| CR-14 | Staleness Threshold | L2: every turn. L3: per sub-task completion or every 3 tool calls | 4/4 |
| CR-15 | Build Delivery | One-at-a-time gated (complete fully → gate → user approval → next) | 3/4 |
| CR-16 | Gate Role | Evidence + user approval (present command output → user approves/rejects) | 3/4 |
| CR-17 | Cross-Session | Mandatory first-turn refresh (read ALL state files, BLOCK if stale/missing) | 3/4 |
| CR-18 | Task Types | Type-differentiated staleness (investigation=loose, implementation=strict, audit=read-only) | 3/4 |
| CR-19 | Relational Model | Staleness = f(agent_level × task_type × hierarchy_connection × cross_session) | 4/4 |

---

## Detailed Specifications

### CR-01: Hard Block Enforcement

**When:** Agent performs an action not connected to current plan node.
**What happens:**
1. System detects off-plan action (tool call path doesn't match hierarchy node scope)
2. Action is BLOCKED — not warned, not logged, BLOCKED
3. Agent receives: `BLOCKED: Action not connected to plan node {node_id}. Current scope: {paths}. Attempted: {path}. Override requires explicit user approval.`
4. No override without user typing explicit approval

**Connects to:** CR-02 (traceability), CR-08 (dynamic scope), CR-03 (staleness)

---

### CR-02: Every Task Traced

**What:** Each TODO item and each delegation packet MUST link to a hierarchy.json node.
**Rules:**
- `hiveops_todo add` MUST include `hierarchy_node` parameter OR inherit from current active node
- Delegation packets MUST include `hierarchy_node_id` field
- Tool calls within a task inherit the task's node connection
- Orphan tasks (no hierarchy link) are flagged immediately

**Connects to:** CR-01 (enforcement uses this link), CR-05 (cascade updates this link)

---

### CR-03: Level-Aware Relational Staleness

**Model:**
```
staleness = f(
  agent_level,          // L2 orchestrator vs L3 executor
  task_type,            // investigation | implementation | audit
  hierarchy_connection, // timestamp of last hierarchy update for this node
  cross_session         // is this a new session or continuation?
)
```

**Rules:**
- L2 orchestrators: checked EVERY turn (user prompt = turn boundary)
- L3 executors: checked when they complete a sub-task OR every 3 tool calls
- Stale = "my hierarchy node's parent has changed since I last read it" OR "my task's plan connection is broken"
- Cross-session: first turn ALWAYS forces full refresh (CR-17)

**Connects to:** CR-14 (thresholds), CR-17 (cross-session), CR-18 (task types), CR-19 (relational model)

---

### CR-04: Command Output Proof

**What counts as evidence:**
- Actual terminal output from running a validation script/command
- Must be paste-able, reproducible, timestamped
- No self-attestation ("it works" is NOT evidence)

**What does NOT count:**
- Agent saying "I verified this"
- TypeScript compilation alone (necessary but not sufficient)
- Screenshots or descriptions

**Connects to:** CR-15 (gated delivery), CR-16 (user approval)

---

### CR-05: Full Mutual Update Cascade

**When:** Any hierarchy node is updated.
**Cascade:** Update propagates to ALL connected nodes bidirectionally:
- Parent nodes: refreshed
- Child nodes: refreshed
- Sibling nodes that share dependencies: refreshed

**Mechanism:** After any hierarchy.json mutation:
1. Identify changed node
2. Walk UP to root, marking ancestors as "refreshed at {timestamp}"
3. Walk DOWN to all children, marking as "refreshed at {timestamp}"
4. Find siblings with shared `depends_on` edges, mark refreshed
5. Persist all changes atomically

**Connects to:** CR-03 (staleness detection uses freshness timestamps from cascade)

---

### CR-06: Strict Typed + Versioned Schemas

**Rules:**
- Every `.hivemind/state/*.json` file MUST match a declared schema
- Unknown fields: REJECTED (not silently ignored)
- Version evolution: additive-only changes allowed. Breaking changes require migration script.
- Schema registry: tracks version per file, validates on every write

**Schemas needed:**
- `runtime-profile.schema.json` — discriminated by `intent` field
- `todo.schema.json` — discriminated by `status` field
- `health-metrics.schema.json` — 12-signal vector
- `workflow-state.schema.json` — per-workflow runtime state
- `decisions.schema.json` — decision log entries
- `enforcement.schema.json` — enforcement state
- `gate-record.schema.json` — discriminated by `status` (passed/failed)

**Connects to:** CR-10 (validation layer 1 = structural = schema match)

---

### CR-07: Hard Block + Auto-Recover Post-Compaction

**Flow:**
```
Compaction event fires
  → BLOCK all agent actions (messages.transform injects STOP instruction)
  → Auto-launch retrieval sub-agent(s):
      Agent A: read hierarchy.json → find active node
      Agent B: read todo.json → list current tasks
      Agent C: read decisions.jsonl → find latest decisions + supersession chain
      Agent D: read wf-{id}.json → find workflow position
  → Synthesize into context-recovery.json (rich, not shallow)
  → Inject rich context via messages.transform
  → UNBLOCK agent actions
```

**Agent CANNOT skip this.** The messages.transform hook enforces the block.

**Connects to:** CR-09 (decisions recovered), CR-12 (workflow state recovered)

---

### CR-08: Dynamic Per-Task Scope

**Rules:**
- Each agent's scope is tied to its CURRENT TASK's hierarchy node
- Hierarchy node defines: allowed paths, allowed tools, allowed delegations
- Scope NARROWS as delegation depth increases:
  - L2 gets node's full scope
  - L3 gets node's scope MINUS orchestration tools
- Any tool call outside scope: BLOCKED (CR-01)

**Connects to:** CR-01 (enforcement), CR-02 (task→node link defines scope)

---

### CR-09: Structured Decision Log

**Format:** Append-only JSONL at `.hivemind/state/decisions.jsonl`

**Entry schema:**
```json
{
  "id": "dec/gx-pack/schema-ids/001",
  "timestamp": 1709337600,
  "content": "Use content-derived slugs instead of SHA256 hashes for all IDs",
  "rationale": "Opaque hashes are not consumable by agents or humans",
  "supersedes": null,
  "superseded_by": null,
  "hierarchy_node": "action/fix-schemas",
  "agent": "hivefiver",
  "session_id": "ses_abc123"
}
```

**Supersession:** When decision B overrides decision A:
- B.supersedes = A.id
- A.superseded_by = B.id (retroactive update)

**Connects to:** CR-07 (recovered post-compaction), CR-05 (cascade updates decision freshness)

---

### CR-10: 4 Sequential Validation Layers

**Layer 1 — Structural:** Does the asset match its declared JSON schema? (CR-06)
**Layer 2 — Semantic:** Does the asset's intent align with its hierarchy node? (CR-02)
**Layer 3 — Domain:** Is the asset logically consistent within its domain? (e.g., workflow steps reference existing scripts)
**Layer 4 — Cross-Domain:** Do assets compose correctly? (e.g., command→workflow→skill chain resolves)

**Rules:**
- Each layer is a separate script
- Layers run sequentially: L1 must pass before L2 runs
- ALL layers must pass for the asset to be considered valid
- Output: command output proof (CR-04)

**Connects to:** CR-04 (evidence standard), CR-06 (structural = schema match)

---

### CR-11: Stub Flagging

**Rules:**
- Stubs are marked in SKILL.md chain definitions with `[CHAIN_DEGRADED]`
- Monitoring reports chain health: `operational: 3, degraded: 5` (not `healthy`)
- `gx-mid-guard.sh` includes chain integrity in health output
- No stub chain reports as "healthy" or "passing"

**Connects to:** CR-13 (metrics include chain integrity signal)

---

### CR-12: File-Persisted Workflow State

**File:** `.hivemind/state/wf-{workflow-id}.json`

**Schema:**
```json
{
  "workflow_id": "gx-recover-loop",
  "current_step": 2,
  "total_steps": 5,
  "iteration_count": 1,
  "max_iterations": 3,
  "started_at": 1709337600,
  "last_step_completed_at": 1709337700,
  "step_outputs": {
    "1_scan": {"findings": 3},
    "2_diagnose": {"severity": "critical"}
  },
  "transition_log": [
    {"from": "1_scan", "to": "2_diagnose", "at": 1709337650}
  ],
  "is_blocked": false
}
```

**Rules:**
- Written after EACH step completion
- Read on session resume to restore position
- Survives compaction (CR-07 recovery reads this)

**Connects to:** CR-07 (recovered post-compaction), CR-10 (validated by structural layer)

---

### CR-13: Multi-Signal Health Vector

**12 signals, each scored 0-100:**

| Signal | Source | Score Logic |
|--------|--------|-------------|
| S1: Plan adherence | hierarchy.json vs tool call paths | % of tool calls matching node scope |
| S2: Hierarchy freshness | hierarchy.json last modified timestamp | 100 = updated this turn, decays per turn |
| S3: Decision velocity | decisions.jsonl entries / turnCount | Normalized ratio |
| S4: TODO progression | completion rate over last N turns | Moving average of completions/turn |
| S5: Context saturation | messages count or estimated tokens | % of context budget used |
| S6: HARD STOP compliance | TODO list inspection | 100 if respected, 0 if violated |
| S7: Delegation efficiency | sub-task completions / delegations | Ratio of useful vs trivial delegations |
| S8: Scope boundary proximity | near-miss scope violations | Distance from boundary |
| S9: Domain continuity | tool call domain vs declared intent | % alignment |
| S10: Evidence quality | completed tasks with evidence / total completions | % with proof |
| S11: Turn count normalized | turnCount / expected session length | Position in session lifecycle |
| S12: Chain integrity | operational chains / total chains | % functional |

**Temporal analysis:** Each signal has velocity (is it getting worse?) and recovery rate (is it improving?).

**Composite:** `health = weighted_sum(signals)` with configurable weights.

**Persisted to:** `.hivemind/state/health-metrics.json`

**Connects to:** CR-03 (staleness uses S2), CR-01 (enforcement uses S1), CR-11 (S12 = chain integrity)

---

### CR-14 through CR-19: See CR-03, CR-17, CR-18

These requirements are sub-specifications of the relational staleness model (CR-03). They define:
- **CR-14:** L2 = every turn, L3 = per sub-task or 3 tool calls
- **CR-15:** One-at-a-time gated delivery
- **CR-16:** Evidence + user approval gate model
- **CR-17:** Mandatory first-turn refresh (BLOCK if stale)
- **CR-18:** investigation=loose, implementation=strict, audit=read-only
- **CR-19:** staleness = f(agent_level × task_type × hierarchy_connection × cross_session)

---

## Remediation Phase Map

| Phase | Gaps Fixed | Root Cause | CRs Addressed | Depends On |
|-------|-----------|-----------|----------------|------------|
| **R1: Fix Measurement** | G3, G6 | Mechanical over Semantic | CR-13, CR-03, CR-14, CR-19, CR-11 | None |
| **R2: Fix State Persistence** | G2, G7 | Static over Stateful | CR-07, CR-09, CR-12, CR-17 | R1 |
| **R3: Fix Schemas** | G1, G5 | Hash over Human | CR-06, CR-01, CR-02, CR-08 | R2 |
| **R4: Add Validation** | G4 | Mechanical over Semantic | CR-10, CR-04 | R1+R3 |
| **R5: Complete Stubs** | G8 | Static over Stateful | CR-11 (flag degraded) | R1+R2+R3 |
| **R6: Edge Cases** | Edge matrix | All | CR-04 (pre-flight guards) | R4 |

---

## Approval Protocol

For each phase:
1. I present: user stories with acceptance criteria
2. You approve: plan is correct, stories are complete
3. I build: one story at a time, tool-architect-loop pattern
4. I present: command output evidence for each story
5. You approve: evidence meets CR-04 standard
6. Phase gate: all stories pass → move to next phase

**No building without your plan approval.**
**No gate passage without your evidence approval.**

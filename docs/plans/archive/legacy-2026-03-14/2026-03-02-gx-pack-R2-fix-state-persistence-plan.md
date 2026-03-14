# R2: Fix State Persistence — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace static/hardcoded state handling with real file-persisted state that survives compaction, enables cross-session continuity, and provides rich context recovery. Fix the 4 critical state persistence gaps (CR-07, CR-09, CR-12, CR-17).

**Architecture:** Append-only decision log (JSONL), per-workflow state files (JSON), enhanced compaction hook (BLOCK→retrieve→synthesize→inject→unblock), and first-turn refresh guard. All state files live in `.hivemind/state/` and are consumed by `context-injection.ts` and `gx-context-retrieve.sh`.

**Tech Stack:** Bash (state scripts), jq (JSON processing), TypeScript (plugin hook enhancements)

**Requirement Traceability:**
- CR-07: Hard block + auto-recover post-compaction
- CR-09: Structured decision log (append-only JSONL with supersession)
- CR-12: File-persisted workflow state
- CR-17: Mandatory first-turn refresh

**Depends On:** R1 (Fix Measurement) — COMPLETE ✅

---

## Task R2-01: Decision Log Schema + Script

**CRs:** CR-09

**Files:**
- Create: `.opencode/skills/gx-context-engine/references/decision-log-schema.md`
- Create: `.opencode/skills/gx-context-engine/scripts/gx-decision-log.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-01-decision-log.sh`

**Step 1: Write the schema reference**

Create `references/decision-log-schema.md` documenting the JSONL format:

```json
{
  "id": "dec/{module}/{topic}/{seq}",
  "timestamp": 1709337600,
  "content": "Use content-derived slugs instead of SHA256 hashes",
  "rationale": "Opaque hashes are not consumable by agents or humans",
  "supersedes": null,
  "superseded_by": null,
  "hierarchy_node": "action/fix-schemas",
  "agent": "hivefiver",
  "session_id": "ses_abc123"
}
```

Rules:
- File: `.hivemind/state/decisions.jsonl` (append-only, one JSON object per line)
- IDs: `dec/{module}/{topic}/{seq}` — human-readable, content-derived
- Supersession: When B overrides A → B.supersedes = A.id, retroactive A.superseded_by = B.id
- Query: Latest N, by module, by hierarchy_node, active-only (not superseded)

**Step 2: Write the decision log script**

Create `scripts/gx-decision-log.sh` with these operations:

```bash
#!/usr/bin/env bash
# gx-decision-log.sh — Append-only decision log with supersession tracking
# USAGE:
#   gx-decision-log.sh . append '{"content":"...","rationale":"...","module":"gx-pack","topic":"schema-ids","hierarchy_node":"...","agent":"hivefiver"}'
#   gx-decision-log.sh . query --last 5
#   gx-decision-log.sh . query --module gx-pack
#   gx-decision-log.sh . query --node action/fix-schemas
#   gx-decision-log.sh . query --active  (exclude superseded)
#   gx-decision-log.sh . supersede <old_id> <new_id>
#   gx-decision-log.sh . count
```

Operations:
1. `append` — Validates input JSON (must have content, rationale, module, topic), generates sequential ID, appends to JSONL
2. `query` — Reads JSONL, filters by criteria, returns JSON array
3. `supersede` — Sets B.supersedes = A.id, retroactively updates A line with superseded_by = B.id
4. `count` — Returns total decisions and active (non-superseded) count

**Step 3: Write TDD test suite**

Create `tests/test-r2-01-decision-log.sh`:
1. Schema validation: append requires content + rationale + module + topic
2. Append: creates JSONL file, one line per decision
3. ID generation: `dec/{module}/{topic}/{seq}` format
4. Timestamp: auto-generated Unix epoch
5. Query --last N: returns most recent N decisions
6. Query --module: filters by module field
7. Query --active: excludes decisions with superseded_by set
8. Supersede: sets both forward and backward links
9. Count: returns total and active counts
10. Empty file: graceful handling (returns 0/empty)
11. Concurrent appends: file doesn't corrupt (flock/lockfile)
12. Invalid JSON input: rejected with error message

**Acceptance Criteria:**
- [ ] Schema reference doc exists with all fields documented
- [ ] Script handles append, query (4 modes), supersede, count
- [ ] JSONL format: one valid JSON object per line
- [ ] IDs are human-readable `dec/{module}/{topic}/{seq}`
- [ ] Supersession: bidirectional link (B.supersedes, A.superseded_by)
- [ ] Pre-flight jq check
- [ ] All 12 test assertions GREEN

---

## Task R2-02: Workflow State Persistence Script

**CRs:** CR-12

**Files:**
- Create: `.opencode/skills/gx-context-engine/references/workflow-state-schema.md`
- Create: `.opencode/skills/gx-context-engine/scripts/gx-workflow-state.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-02-workflow-state.sh`

**Step 1: Write the schema reference**

Create `references/workflow-state-schema.md` documenting the workflow state file:

```json
{
  "workflow_id": "gx-recover-loop",
  "current_step": 2,
  "total_steps": 5,
  "step_name": "2_diagnose",
  "iteration_count": 1,
  "max_iterations": 3,
  "started_at": 1709337600,
  "last_step_completed_at": 1709337700,
  "step_outputs": {
    "1_scan": {"findings": 3, "completed_at": 1709337650}
  },
  "transition_log": [
    {"from": "1_scan", "to": "2_diagnose", "at": 1709337650, "reason": "scan complete"}
  ],
  "is_blocked": false,
  "blocked_reason": null
}
```

File location: `.hivemind/state/wf-{workflow-id}.json`
Written after EACH step completion. Read on session resume.

**Step 2: Write the workflow state script**

Create `scripts/gx-workflow-state.sh` with these operations:

```bash
#!/usr/bin/env bash
# gx-workflow-state.sh — File-persisted workflow state
# USAGE:
#   gx-workflow-state.sh . init <workflow_id> <total_steps> <max_iterations>
#   gx-workflow-state.sh . advance <workflow_id> <step_name> [step_output_json]
#   gx-workflow-state.sh . read <workflow_id>
#   gx-workflow-state.sh . block <workflow_id> <reason>
#   gx-workflow-state.sh . unblock <workflow_id>
#   gx-workflow-state.sh . list
#   gx-workflow-state.sh . cleanup <workflow_id>
```

Operations:
1. `init` — Creates `wf-{id}.json` with step 0, started_at timestamp
2. `advance` — Increments step, records step output, adds transition log entry, writes atomically
3. `read` — Returns current state JSON (or `{"error":"not_found"}`)
4. `block` — Sets is_blocked=true with reason
5. `unblock` — Sets is_blocked=false
6. `list` — Lists all active workflow state files
7. `cleanup` — Archives completed workflow state to `.hivemind/archive/`

**Step 3: Write TDD test suite**

Create `tests/test-r2-02-workflow-state.sh`:
1. Init: creates wf-{id}.json with correct structure
2. Init: validates total_steps is positive integer
3. Advance: increments current_step correctly
4. Advance: records step output in step_outputs map
5. Advance: adds transition_log entry with timestamp
6. Advance: rejects if workflow is blocked
7. Advance: rejects if current_step >= total_steps (already complete)
8. Read: returns full state JSON
9. Read: returns error for non-existent workflow
10. Block/Unblock: sets is_blocked correctly
11. List: returns all active workflow files
12. Cleanup: moves file to archive directory
13. Iteration tracking: increments iteration_count when wrapping (step 5→step 1)
14. Atomic write: temp file + mv pattern

**Acceptance Criteria:**
- [ ] Schema reference doc exists
- [ ] State file persists at `.hivemind/state/wf-{id}.json`
- [ ] Written after EACH step (atomic write via tmp+mv)
- [ ] Read on resume returns exact workflow position
- [ ] Block/unblock prevents advance while blocked
- [ ] Transition log captures from/to/timestamp/reason
- [ ] Pre-flight jq check
- [ ] All 14 test assertions GREEN

---

## Task R2-03: Context Retrieve Enhancement

**CRs:** CR-07 (retrieval agent), CR-09 (recover decisions), CR-12 (recover workflow state)

**Files:**
- Modify: `.opencode/skills/gx-context-engine/scripts/gx-context-retrieve.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-03-context-retrieve.sh`

**Step 1: Enhance gx-context-retrieve.sh**

Current gaps to fix:
1. `key_decisions` is hardcoded to `[]` — must read from `decisions.jsonl`
2. Only recovers 10 TODOs — should recover all active + recently completed
3. No workflow state recovery — must read `wf-*.json` files
4. No health metrics recovery — should include last composite score

New logic:
```
1. Read hierarchy.json → find active node + breadcrumb path
2. Read todo.json → all active + last 5 completed items
3. Read decisions.jsonl → last 10 active (non-superseded) decisions
4. Read wf-*.json → all active workflow positions
5. Read health-metrics.json → last composite score + degraded signals
6. Read runtime-profile.json → current intent + profile ID
7. Synthesize into context-recovery.json
```

**Step 2: Write TDD test suite**

Create `tests/test-r2-03-context-retrieve.sh`:
1. Decisions recovered: creates decisions.jsonl with 3 entries, runs retrieve, output has key_decisions with 3 items
2. Decisions filtered: superseded decisions excluded from recovery
3. Workflow recovered: creates wf-test.json, runs retrieve, output has workflow_positions
4. Health recovered: creates health-metrics.json, runs retrieve, output has health_summary
5. Empty state: all files missing → graceful defaults (no crash)
6. Partial state: some files present, others missing → recovers available + notes missing
7. TODO recovery: more than 10 active → all recovered (not truncated to 10)
8. Output file: context-recovery.json written to correct path
9. Output schema: all required fields present (trajectory_summary, active_todos, key_decisions, workflow_positions, health_summary, recommended_next, recovered_at)

**Acceptance Criteria:**
- [ ] Reads decisions.jsonl (not hardcoded `[]`)
- [ ] Reads wf-*.json workflow states
- [ ] Reads health-metrics.json composite
- [ ] Recovers all active TODOs (not limited to 10)
- [ ] Filters superseded decisions
- [ ] Handles missing files gracefully
- [ ] Output schema includes new fields: workflow_positions, health_summary
- [ ] All 9 test assertions GREEN

---

## Task R2-04: Handoff Purify Implementation

**CRs:** CR-07 (synthesis step), CR-09 (decision extraction)

**Files:**
- Modify: `.opencode/skills/gx-context-engine/scripts/gx-handoff-purify.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-04-handoff-purify.sh`

**Step 1: Implement gx-handoff-purify.sh**

Replace the stub with full implementation. This script prepares a clean handoff payload from session state:

```
Input: .hivemind/state/ directory (all state files)
Output: .hivemind/handoffs/handoff-{timestamp}.json + .hivemind/handoffs/handoff-{timestamp}.md

Steps:
1. Read all state files (health, todo, decisions, workflow, hierarchy, profile)
2. Extract decisions: filter to active (non-superseded), last 10
3. Extract evidence: scan todo completed items for evidence fields
4. Extract pending actions: in_progress + pending TODOs
5. Extract workflow positions: current step for each active workflow
6. Build handoff JSON:
   {
     "handoff_id": "ho-{timestamp}",
     "created_at": timestamp,
     "session_summary": {
       "intent": "from profile",
       "health_at_exit": composite score,
       "turns_completed": turnCount,
       "trajectory_position": "from hierarchy"
     },
     "decisions_made": [...active decisions],
     "evidence_collected": [...evidence from todos],
     "pending_actions": [...in_progress + pending],
     "workflow_positions": [...active workflows],
     "recommended_next": "highest priority pending action",
     "warnings": [...any degraded signals or blocked workflows]
   }
7. Generate markdown summary from JSON
8. Write both files atomically
```

**Step 2: Write TDD test suite**

Create `tests/test-r2-04-handoff-purify.sh`:
1. Output files: JSON + MD created in .hivemind/handoffs/
2. Handoff ID: format `ho-{timestamp}`
3. Decisions: active decisions included, superseded excluded
4. Evidence: completed todo items with evidence field extracted
5. Pending: in_progress + pending items listed
6. Workflow positions: active workflows included with step info
7. Health at exit: composite score from health-metrics.json
8. Empty state: graceful output (empty arrays, default values)
9. Markdown: readable summary generated from JSON
10. Atomic write: temp file + mv pattern
11. Directory creation: creates .hivemind/handoffs/ if missing

**Acceptance Criteria:**
- [ ] Stub replaced with full implementation
- [ ] Outputs both JSON and markdown handoff files
- [ ] Decisions filtered (active only, last 10)
- [ ] Evidence extracted from completed TODO items
- [ ] Workflow positions included
- [ ] Health score at exit included
- [ ] Graceful on empty state
- [ ] All 11 test assertions GREEN

---

## Task R2-05: First-Turn Refresh Guard

**CRs:** CR-17

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/gx-first-turn-refresh.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-05-first-turn-refresh.sh`

**Step 1: Write the first-turn refresh script**

This script runs on the first turn of every session. It reads ALL state files and reports staleness:

```bash
#!/usr/bin/env bash
# gx-first-turn-refresh.sh — Mandatory first-turn state refresh (CR-17)
# USAGE: gx-first-turn-refresh.sh <workdir>
# OUTPUT: JSON { "status": "fresh|stale|missing", "files_read": N, "stale_files": [...], "missing_files": [...], "block": true|false }

# Required state files:
STATE_FILES=(
  "hierarchy.json"
  "runtime-profile.json"
  "health-metrics.json"
  "todo.json"
  "decisions.jsonl"
  "enforcement.json"
)

# For each file:
#   - Exists? → check mtime staleness (>24h = stale)
#   - Missing? → record as missing
#   - Read? → validate JSON structure
#
# Decision: BLOCK if any CRITICAL file is missing or stale
# CRITICAL files: hierarchy.json, runtime-profile.json
# OPTIONAL files: todo.json, decisions.jsonl, enforcement.json (warn but don't block)
```

**Step 2: Write TDD test suite**

Create `tests/test-r2-05-first-turn-refresh.sh`:
1. All files present + fresh: status=fresh, block=false
2. Critical file missing (hierarchy.json): status=missing, block=true
3. Critical file missing (runtime-profile.json): status=missing, block=true
4. Optional file missing (todo.json): status=missing, block=false (warning only)
5. Critical file stale (>24h old): status=stale, block=true
6. Optional file stale: status=stale, block=false (warning only)
7. Invalid JSON in state file: reported as corrupt, block=true for critical
8. files_read count: correctly counts accessible files
9. stale_files list: accurately lists stale filenames
10. missing_files list: accurately lists missing filenames
11. All files missing (fresh project): status=missing, block=true, but message includes "run gx-entry-guard.sh first"
12. JSONL file (decisions.jsonl): validated as valid JSONL (not JSON)

**Acceptance Criteria:**
- [ ] Reads all 6 required state files
- [ ] Differentiates CRITICAL vs OPTIONAL files
- [ ] BLOCK=true if critical files missing/stale
- [ ] Reports stale file names + ages
- [ ] Reports missing file names
- [ ] Validates JSON structure (not just existence)
- [ ] JSONL validation for decisions.jsonl
- [ ] Pre-flight jq check
- [ ] All 12 test assertions GREEN

---

## Task R2-06: Compaction Hook Enhancement

**CRs:** CR-07

**Files:**
- Modify: `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- Modify: `.opencode/plugins/hiveops-governance/types.ts` (add CompactionRecovery type)
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-06-compaction-hook.sh`

**Step 1: Add CompactionRecovery type**

Add to `types.ts`:
```typescript
/** Context recovery state for post-compaction injection */
export interface CompactionRecovery {
  trajectory_summary: string
  active_todos: string[]
  key_decisions: string[]
  workflow_positions: { workflow_id: string; current_step: number; step_name: string }[]
  health_summary: { score: number; status: string; degraded_signals: string[] }
  recommended_next: string
  recovered_at: number
}
```

**Step 2: Enhance compaction.ts**

Replace the simple context push with the CR-07 flow:

```
BLOCK → retrieve → synthesize → inject → unblock

1. BLOCK: Set enforcement state to "compacting" (prevents agent actions)
2. RETRIEVE: Run gx-context-retrieve.sh to build context-recovery.json
3. SYNTHESIZE: Read context-recovery.json into CompactionRecovery struct
4. INJECT: Push rich recovery context into output.context (not just rules, but actual state)
5. UNBLOCK: Clear compacting flag
```

Key enhancement: the existing hook only injects rules ("DO NOT edit files outside scope"). The enhanced version injects ACTUAL STATE: current decisions, workflow positions, TODO items, hierarchy cursor, health score. This is the difference between "survive compaction with amnesia" and "survive compaction with full memory."

**Step 3: TypeScript verification**

```bash
npx tsc --noEmit .opencode/plugins/hiveops-governance/hooks/compaction.ts
# Expected: Exit 0
```

**Step 4: Write TDD test suite**

Create `tests/test-r2-06-compaction-hook.sh`:
1. TypeScript compiles clean (exit 0)
2. Context-recovery.json read correctly when present
3. Recovery context includes trajectory summary
4. Recovery context includes active decisions
5. Recovery context includes workflow positions
6. Recovery context includes health score
7. Missing context-recovery.json: falls back to basic rules (no crash)
8. Corrupt context-recovery.json: falls back gracefully
9. Output format: recovery appended to output.context array

**Acceptance Criteria:**
- [ ] BLOCK→retrieve→synthesize→inject→unblock flow implemented
- [ ] Rich recovery context injected (decisions, workflows, health, TODOs)
- [ ] Falls back to basic rules if recovery file missing/corrupt
- [ ] TypeScript compiles clean
- [ ] All 9 test assertions GREEN

---

## Task R2-07: TODO-Graph Sync Script

**CRs:** CR-09 (decisions link to hierarchy), CR-12 (workflow links to TODO)

**Files:**
- Modify: `.opencode/skills/gx-context-engine/scripts/gx-todo-sync.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-07-todo-sync.sh`

**Step 1: Implement gx-todo-sync.sh**

Replace the stub with bidirectional sync between TODO items and hierarchy nodes:

```
Operations:
  sync  — Read hierarchy.json + todo.json, cross-reference, report gaps
  link  — Link a TODO item to a hierarchy node
  check — Verify all active TODOs have hierarchy links (CR-02 readiness)

Logic:
1. Read hierarchy.json: walk tree, collect all action-level nodes
2. Read todo.json: collect all active items
3. For each active TODO:
   - Has hierarchy_node? → verify node exists in hierarchy
   - No hierarchy_node? → report as orphan
4. For each active action node in hierarchy:
   - Has matching TODO? → check status alignment
   - No matching TODO? → report as untracked
5. Output sync report:
   {
     "linked": N,
     "orphan_todos": [...],
     "untracked_nodes": [...],
     "status_mismatches": [...],
     "sync_health": "healthy|degraded|broken"
   }
```

**Step 2: Write TDD test suite**

Create `tests/test-r2-07-todo-sync.sh`:
1. Sync: linked count matches cross-referenced items
2. Orphan detection: TODO without hierarchy_node flagged
3. Untracked detection: hierarchy action node without TODO flagged
4. Status mismatch: hierarchy node "complete" but TODO "pending" flagged
5. Healthy: all linked, no orphans → sync_health=healthy
6. Degraded: orphans exist → sync_health=degraded
7. Empty state: no hierarchy or no TODO → graceful defaults
8. Link operation: sets hierarchy_node on TODO item
9. Check operation: returns true/false for all-linked
10. Large tree: handles 20+ hierarchy nodes without timeout

**Acceptance Criteria:**
- [ ] Stub replaced with full sync implementation
- [ ] Bidirectional: hierarchy→TODO and TODO→hierarchy
- [ ] Orphan TODOs detected
- [ ] Untracked hierarchy nodes detected
- [ ] Status mismatches detected
- [ ] sync_health reflects actual sync state
- [ ] All 10 test assertions GREEN

---

## Task R2-08: Integration Verification

**CRs:** CR-04 (evidence), CR-16 (user approval)

**Files:**
- Create: `.opencode/skills/gx-context-engine/tests/test-r2-integration.sh`

**End-to-end scenarios:**

**Scenario A: Decision lifecycle**
1. Append decision via gx-decision-log.sh
2. Verify decisions.jsonl has 1 line
3. Append second decision that supersedes first
4. Verify supersession links (forward + backward)
5. Run gx-context-retrieve.sh
6. Verify context-recovery.json includes active decision (not superseded one)

**Scenario B: Workflow state lifecycle**
1. Init workflow via gx-workflow-state.sh
2. Advance 2 steps with outputs
3. Verify wf-test.json has current_step=2, transition_log has 2 entries
4. Run gx-context-retrieve.sh
5. Verify context-recovery.json includes workflow position at step 2

**Scenario C: First-turn refresh**
1. Create all state files (some fresh, some stale, some missing)
2. Run gx-first-turn-refresh.sh
3. Verify correct stale/missing detection
4. Verify BLOCK for critical missing files

**Scenario D: Handoff purify**
1. Populate decisions, TODO, workflow state, health metrics
2. Run gx-handoff-purify.sh
3. Verify handoff JSON has all sections populated
4. Verify handoff MD is readable

**Scenario E: Compaction recovery**
1. Verify compaction.ts compiles clean
2. Verify context-injection.ts still compiles clean (R1 regression)

**Acceptance Criteria (Phase Gate):**
- [ ] Scenario A: Decision lifecycle end-to-end GREEN
- [ ] Scenario B: Workflow state lifecycle end-to-end GREEN
- [ ] Scenario C: First-turn refresh detection GREEN
- [ ] Scenario D: Handoff purify end-to-end GREEN
- [ ] Scenario E: TypeScript compilation GREEN (both files)
- [ ] All R1 tests still GREEN (no regression): 144/144
- [ ] Command output evidence presented to user
- [ ] User explicitly approves R2 gate

---

## Summary: R2 Story Count

| Story | Title | Depends On | Test Count |
|-------|-------|------------|------------|
| R2-01 | Decision log schema + script | — | 12 |
| R2-02 | Workflow state persistence | — | 14 |
| R2-03 | Context retrieve enhancement | R2-01, R2-02 | 9 |
| R2-04 | Handoff purify implementation | R2-01, R2-02 | 11 |
| R2-05 | First-turn refresh guard | — | 12 |
| R2-06 | Compaction hook enhancement | R2-03 | 9 |
| R2-07 | TODO-graph sync | — | 10 |
| R2-08 | Integration verification | R2-01 through R2-07 | 5 scenarios |

**Estimated total test assertions:** ~82 (R2 only) + 144 (R1 regression) = ~226

**Execution order (by dependency):**
1. R2-01 + R2-02 + R2-05 + R2-07 (parallel — no file overlap)
2. R2-03 (depends on R2-01, R2-02)
3. R2-04 (depends on R2-01, R2-02)
4. R2-06 (depends on R2-03)
5. R2-08 (depends on all)

---

## Execution Protocol

For each task:
1. **TDD**: Write test → run (must FAIL = RED) → implement → run (must PASS = GREEN)
2. **L1 Gate**: Run test suite, paste output as evidence
3. **L2 Gate**: Dispatch reviewer sub-agent (hiveq)
4. **L3 Gate**: Thorough code review (code-review-excellence)
5. **If REQUEST_CHANGES**: Fix → re-verify → re-review
6. **After task GREEN + APPROVED**: Move to next task
7. **After all tasks**: R2-08 integration verification → user gate approval

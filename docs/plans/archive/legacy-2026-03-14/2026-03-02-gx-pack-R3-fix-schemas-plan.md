# R3: Fix Schemas — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hash-based identification and static scope with strict typed schemas, hard block enforcement, task traceability, and dynamic per-task scope resolution. Fix gaps G1 (Hash over Human) and G5 (Static Scope).

**Architecture:** Schema registry with version tracking validates all `.hivemind/state/*.json` writes. Enforcement engine blocks off-plan actions at runtime. Traceability checker ensures every TODO links to a hierarchy node. Scope resolver computes allowed paths/tools per hierarchy depth.

**Tech Stack:** Bash (all scripts), jq (JSON processing)

**Requirement Traceability:**
- CR-06: Strict Typed + Versioned Schemas (schema registry)
- CR-01: Hard Block Enforcement (off-plan action blocking)
- CR-02: Every Task Traced (hierarchy node linking)
- CR-08: Dynamic Per-Task Scope (depth-narrowing scope resolution)

**Depends On:** R1 (Fix Measurement) ✅, R2 (Fix State Persistence) ✅

---

## Task R3-01: Schema Registry + Validation Script

**CRs:** CR-06

**Files:**
- Replace: `.opencode/skills/gx-context-engine/scripts/gx-schema-sync.sh` (currently STUB)
- Create: `.opencode/skills/gx-context-engine/references/schema-registry-spec.md`
- Create: `.opencode/skills/gx-context-engine/tests/test-r3-01-schema-registry.sh`

**Step 1: Write the schema registry reference**

Create `references/schema-registry-spec.md` documenting:

Schema definitions for all `.hivemind/state/*.json` files:

| File | Schema ID | Required Fields | Discriminator |
|------|-----------|----------------|---------------|
| `runtime-profile.json` | `gx-runtime-profile-v1` | id, created, intent, policy_version, role_envelope, capabilities, constraints | `intent` field |
| `todo.json` | `gx-todo-v1` | version, items, lastSync | `items[].status` |
| `health-metrics.json` | `gx-health-metrics-v1` | $schema, version, signals (12), composite, thresholds, history | Already defined in R1 |
| `hierarchy.json` | `gx-hierarchy-v1` | version, root, cursor | `root.type` |
| `enforcement.json` | `gx-enforcement-v1` | version, mode, active_node, scope, violations, last_check | `mode` field |
| `decisions.jsonl` | `gx-decision-entry-v1` | id, timestamp, content, rationale, hierarchy_node, agent | Per-line validation |
| `wf-{id}.json` | `gx-workflow-state-v1` | workflow_id, current_step, total_steps, is_blocked | Already defined in R2 |

Schema registry format at `.hivemind/state/schema-registry.json`:
```json
{
  "$schema": "gx-schema-registry-v1",
  "version": 1,
  "files": {
    "runtime-profile.json": {
      "schema_id": "gx-runtime-profile-v1",
      "schema_version": 1,
      "file_version": 1,
      "last_validated": 1709337600,
      "status": "valid"
    }
  },
  "validation_log": []
}
```

**Step 2: Replace gx-schema-sync.sh stub with full implementation**

```bash
#!/usr/bin/env bash
# gx-schema-sync.sh — Schema validation + registry management
# USAGE:
#   gx-schema-sync.sh <workdir> validate <file>     — Validate a state file against its schema
#   gx-schema-sync.sh <workdir> register             — Initialize/update schema registry
#   gx-schema-sync.sh <workdir> check-all             — Validate ALL state files
#   gx-schema-sync.sh <workdir> status                — Report registry health
```

Operations:
1. `validate <file>` — Identify schema by filename, validate required fields, reject unknown fields, return `{valid: bool, errors: [], schema_id: string}`
2. `register` — Scan `.hivemind/state/`, create/update `schema-registry.json`, record file versions
3. `check-all` — Validate every state file, return aggregate result
4. `status` — Return registry stats: total files, valid count, invalid count, unregistered count

Schema validation rules per CR-06:
- Required fields MUST exist (structural check)
- Unknown top-level fields REJECTED (strict mode)
- Type checking: strings are strings, numbers are numbers, arrays are arrays
- Version field must be present and numeric
- Additive-only evolution: new fields OK, removing fields = ERROR

**Step 3: Write TDD test suite**

Create `tests/test-r3-01-schema-registry.sh`:
1. Validate: runtime-profile.json passes with valid content
2. Validate: rejects file with missing required field (id)
3. Validate: rejects file with unknown top-level field
4. Validate: health-metrics.json passes (R1 schema)
5. Validate: todo.json passes with valid items array
6. Validate: hierarchy.json passes with root + version + cursor
7. Validate: workflow state (wf-*.json) passes
8. Validate: decisions.jsonl validates each line independently
9. Validate: rejects non-JSON file
10. Validate: rejects empty file
11. Register: creates schema-registry.json with correct structure
12. Register: records all found state files
13. Register: increments version on re-register
14. Check-all: returns aggregate valid/invalid counts
15. Status: reports total, valid, invalid, unregistered
16. Unknown file: reports as unregistered (not crash)
17. Version field: must be numeric, reject string version
18. Pre-flight: jq availability check

**Acceptance Criteria:**
- [ ] Stub replaced with full schema validation
- [ ] Schema definitions for 7 state file types
- [ ] Unknown fields rejected (CR-06: strict mode)
- [ ] Required fields enforced per schema
- [ ] Schema registry tracks version per file
- [ ] Additive-only evolution (new fields OK, removals blocked)
- [ ] Pre-flight jq check
- [ ] All 18 test assertions GREEN

---

## Task R3-02: Enforcement Engine

**CRs:** CR-01, CR-08 (scope part)

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/gx-enforce.sh`
- Create: `.opencode/skills/gx-context-engine/references/enforcement-spec.md`
- Create: `.opencode/skills/gx-context-engine/tests/test-r3-02-enforcement.sh`

**Step 1: Write the enforcement reference**

Create `references/enforcement-spec.md` documenting:

Enforcement state file at `.hivemind/state/enforcement.json`:
```json
{
  "$schema": "gx-enforcement-v1",
  "version": 1,
  "mode": "active",
  "active_node": "action/fix-schemas",
  "scope": {
    "allowed_paths": [".opencode/**", ".hivemind/**", "docs/**"],
    "allowed_tools": ["read", "glob", "grep", "write", "edit", "bash"],
    "allowed_delegations": ["hivemaker", "hiveq", "hivexplorer"]
  },
  "violations": [],
  "last_check": 1709337600,
  "block_active": false,
  "block_reason": null
}
```

Enforcement modes:
- `active` — Full enforcement, blocks off-plan actions
- `passive` — Logs violations but doesn't block (for audit)
- `disabled` — No enforcement (emergency override)

**Step 2: Write gx-enforce.sh**

```bash
#!/usr/bin/env bash
# gx-enforce.sh — Hard block enforcement engine (CR-01)
# USAGE:
#   gx-enforce.sh <workdir> init <node_id>                — Initialize enforcement for a hierarchy node
#   gx-enforce.sh <workdir> check-path <path>             — Check if path is within current scope
#   gx-enforce.sh <workdir> check-tool <tool_name>        — Check if tool is allowed
#   gx-enforce.sh <workdir> check-delegation <agent>      — Check if delegation target is allowed
#   gx-enforce.sh <workdir> record-violation <type> <detail>  — Record a scope violation
#   gx-enforce.sh <workdir> status                        — Return current enforcement state
#   gx-enforce.sh <workdir> set-mode <mode>               — Set enforcement mode (active/passive/disabled)
#   gx-enforce.sh <workdir> set-node <node_id>            — Update active hierarchy node + scope
```

Operations:
1. `init` — Create enforcement.json, resolve scope from hierarchy node (reads hierarchy.json)
2. `check-path` — Match path against allowed_paths globs. Return `{allowed: bool, reason: string}`. If `mode=active` and not allowed → BLOCKED message
3. `check-tool` — Match tool name against allowed_tools list. Same return schema.
4. `check-delegation` — Match agent name against allowed_delegations. Same return schema.
5. `record-violation` — Append to violations array with timestamp + type + detail
6. `status` — Return full enforcement state + violation count
7. `set-mode` — Change enforcement mode (requires explicit user approval for active→disabled)
8. `set-node` — Update active_node, recalculate scope from hierarchy

Scope resolution (CR-08 connection):
- Read hierarchy.json, find the node by ID
- Extract node's `scope` or `paths` property
- Default scope if node has no scope: `[".opencode/**", ".hivemind/**", "docs/**"]`
- L3 executors: subtract orchestration tools (`task`, `hiveops_export`)

**Step 3: Write TDD test suite**

Create `tests/test-r3-02-enforcement.sh`:
1. Init: creates enforcement.json with correct structure
2. Init: reads hierarchy.json to resolve scope for node
3. Init: uses default scope if hierarchy node has no scope field
4. Check-path: allowed path returns `{allowed: true}`
5. Check-path: blocked path returns `{allowed: false, reason: "..."}` with BLOCKED message
6. Check-path: `.opencode/**` matches `.opencode/skills/something.md`
7. Check-path: `src/**` blocked by default scope
8. Check-tool: allowed tool returns `{allowed: true}`
9. Check-tool: blocked tool returns `{allowed: false}`
10. Check-delegation: allowed agent returns `{allowed: true}`
11. Check-delegation: blocked agent returns `{allowed: false}`
12. Record-violation: appends to violations array with timestamp
13. Record-violation: violation includes type + detail + timestamp
14. Status: returns full state including violation count
15. Set-mode: changes mode correctly (active/passive/disabled)
16. Set-mode: passive mode logs but doesn't block (check-path returns `{allowed: true, warning: "..."}`)
17. Set-node: updates active_node + recalculates scope
18. Missing hierarchy.json: init uses default scope, not crash
19. Corrupt enforcement.json: init recreates from scratch
20. Pre-flight: jq availability check

**Acceptance Criteria:**
- [ ] Enforcement state persisted at `.hivemind/state/enforcement.json`
- [ ] Off-plan paths BLOCKED (not warned) in active mode
- [ ] Off-plan tools BLOCKED in active mode
- [ ] Off-plan delegations BLOCKED in active mode
- [ ] Violations recorded with timestamp + type + detail
- [ ] Passive mode: log only, no blocking
- [ ] Scope resolved from hierarchy node
- [ ] Default scope fallback if node has no scope
- [ ] Pre-flight jq check
- [ ] All 20 test assertions GREEN

---

## Task R3-03: Traceability Checker

**CRs:** CR-02

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/gx-trace-check.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r3-03-traceability.sh`

**Step 1: Write gx-trace-check.sh**

```bash
#!/usr/bin/env bash
# gx-trace-check.sh — Task traceability verification (CR-02)
# USAGE:
#   gx-trace-check.sh <workdir> check-todos         — Check all active TODOs for hierarchy links
#   gx-trace-check.sh <workdir> check-item <id>     — Check a specific TODO item
#   gx-trace-check.sh <workdir> find-orphans         — List all TODOs without hierarchy links
#   gx-trace-check.sh <workdir> report               — Full traceability report
```

Operations:
1. `check-todos` — Read todo.json, verify each active item has `hierarchy_node` field. Return `{total: N, traced: N, orphans: N, orphan_ids: [...]}`
2. `check-item` — Check single TODO item for hierarchy link, verify the linked node exists in hierarchy.json
3. `find-orphans` — List all TODO items missing `hierarchy_node` field
4. `report` — Full traceability report:
   ```json
   {
     "traced_items": N,
     "orphan_items": N,
     "orphan_ids": ["..."],
     "broken_links": N,
     "broken_link_details": [{"todo_id": "...", "hierarchy_node": "...", "reason": "node_not_found"}],
     "traceability_score": 0-100,
     "status": "compliant|degraded|non_compliant"
   }
   ```
   - `compliant`: All active items traced + all links valid
   - `degraded`: Some orphans or broken links (<30% violations)
   - `non_compliant`: >30% violations

Cross-reference logic:
- Read todo.json → extract active items (in_progress + pending)
- For each item: check `hierarchy_node` field exists and is non-empty
- If hierarchy_node present: verify it exists in hierarchy.json node tree
- If hierarchy_node missing: flag as orphan
- If hierarchy_node present but node not found: flag as broken link

**Step 2: Write TDD test suite**

Create `tests/test-r3-03-traceability.sh`:
1. Check-todos: all traced → `{orphans: 0}`
2. Check-todos: some without hierarchy_node → `{orphans: N}`
3. Check-item: traced item → `{traced: true}`
4. Check-item: orphan item → `{traced: false, reason: "missing_hierarchy_node"}`
5. Check-item: broken link (node not in hierarchy) → `{traced: false, reason: "node_not_found"}`
6. Find-orphans: returns correct orphan IDs
7. Find-orphans: empty when all traced
8. Report: compliant status when all traced
9. Report: degraded status with <30% orphans
10. Report: non_compliant with >30% orphans
11. Report: traceability_score = traced/(traced+orphans+broken) * 100
12. Report: broken_link_details includes todo_id + node + reason
13. Empty todo.json: graceful `{total: 0, traced: 0}` (not crash)
14. Missing hierarchy.json: all items with hierarchy_node → broken links
15. Missing todo.json: graceful `{total: 0}` (not crash)
16. Completed items: not checked (only active items matter)
17. Pre-flight: jq availability check

**Acceptance Criteria:**
- [ ] Reads todo.json + hierarchy.json for cross-reference
- [ ] Detects orphan TODOs (no hierarchy_node)
- [ ] Detects broken links (hierarchy_node → missing node)
- [ ] Traceability score computed correctly
- [ ] Compliant/degraded/non_compliant status thresholds
- [ ] Only checks active items (not completed/cancelled)
- [ ] Graceful on missing state files
- [ ] Pre-flight jq check
- [ ] All 17 test assertions GREEN

---

## Task R3-04: Dynamic Scope Resolver

**CRs:** CR-08

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/gx-scope-resolve.sh`
- Create: `.opencode/skills/gx-context-engine/tests/test-r3-04-scope-resolve.sh`

**Step 1: Write gx-scope-resolve.sh**

```bash
#!/usr/bin/env bash
# gx-scope-resolve.sh — Dynamic scope resolution tied to hierarchy depth (CR-08)
# USAGE:
#   gx-scope-resolve.sh <workdir> resolve <node_id> [agent_level]  — Resolve scope for a node
#   gx-scope-resolve.sh <workdir> check <node_id> <path> [level]   — Check if path in scope
#   gx-scope-resolve.sh <workdir> depth <node_id>                   — Get hierarchy depth of node
```

Operations:
1. `resolve <node_id> [agent_level]` — Walk hierarchy.json to find node, compute scope:
   ```json
   {
     "node_id": "action/fix-schemas",
     "depth": 3,
     "agent_level": 2,
     "allowed_paths": [".opencode/**", ".hivemind/**", "docs/**"],
     "allowed_tools": ["read", "glob", "grep", "write", "edit", "bash", "task"],
     "excluded_tools": [],
     "scope_source": "node|parent|default"
   }
   ```

2. `check <node_id> <path> [level]` — Resolve scope, check if path matches. Return `{in_scope: bool, matched_pattern: string}`

3. `depth <node_id>` — Return hierarchy depth of the node (root=0, trajectory=1, tactic=2, action=3)

Scope narrowing rules (CR-08):
- Depth 0-1 (trajectory): Full default scope
- Depth 2 (tactic): Same as default but with node-specific path restrictions if declared
- Depth 3 (action): Node-specific paths only, no orchestration tools for L3
- L2 agents get full scope for their depth
- L3 agents get scope MINUS orchestration tools (`task`, `hiveops_export`, `hiveops_gate`)

Scope inheritance:
- If node declares `scope.paths`, use those
- If node has no scope, inherit from parent
- If no ancestor has scope, use default: `[".opencode/**", ".hivemind/**", "docs/**"]`

**Step 2: Write TDD test suite**

Create `tests/test-r3-04-scope-resolve.sh`:
1. Resolve: root node → full default scope
2. Resolve: action node → restricted scope if node declares paths
3. Resolve: node without scope → inherits parent scope
4. Resolve: L2 agent → includes orchestration tools
5. Resolve: L3 agent → excludes orchestration tools (task, hiveops_export, hiveops_gate)
6. Resolve: scope_source = "node" when node declares scope
7. Resolve: scope_source = "parent" when inherited
8. Resolve: scope_source = "default" when no ancestor has scope
9. Check: path in scope → `{in_scope: true}`
10. Check: path out of scope → `{in_scope: false}`
11. Check: glob matching works (`.opencode/skills/foo.md` matches `.opencode/**`)
12. Depth: root = 0
13. Depth: trajectory = 1
14. Depth: tactic = 2
15. Depth: action = 3
16. Missing hierarchy.json → default scope returned
17. Node not found → error with message
18. Pre-flight: jq availability check

**Acceptance Criteria:**
- [ ] Scope resolved from hierarchy node + agent level
- [ ] Depth-based narrowing (deeper = more restricted)
- [ ] L3 agents lose orchestration tools
- [ ] Scope inheritance from parent if node has no scope
- [ ] Default fallback scope
- [ ] Glob pattern matching for path checks
- [ ] Pre-flight jq check
- [ ] All 18 test assertions GREEN

---

## Task R3-05: Integration Verification

**CRs:** CR-04 (evidence), CR-16 (user approval)

**Files:**
- Create: `.opencode/skills/gx-context-engine/tests/test-r3-integration.sh`

**End-to-end scenarios:**

**Scenario A: Schema validation lifecycle**
1. Create a valid runtime-profile.json
2. Run `gx-schema-sync.sh validate runtime-profile.json` → valid
3. Add unknown field to runtime-profile.json
4. Run validate again → invalid (unknown field rejected)
5. Run `gx-schema-sync.sh register` → registry created
6. Run `gx-schema-sync.sh status` → 1 valid file

**Scenario B: Enforcement + scope lifecycle**
1. Create hierarchy.json with an action node that has scope
2. Run `gx-enforce.sh init action/test-node`
3. Run `gx-enforce.sh check-path .opencode/skills/test.md` → allowed
4. Run `gx-enforce.sh check-path src/main.ts` → BLOCKED
5. Run `gx-enforce.sh status` → block_active=false, mode=active

**Scenario C: Traceability + enforcement integration**
1. Create todo.json with 3 items (2 traced, 1 orphan)
2. Create hierarchy.json with matching nodes
3. Run `gx-trace-check.sh report` → degraded, 1 orphan
4. Run `gx-enforce.sh init` with active node
5. Run `gx-scope-resolve.sh resolve` for the node → returns scope

**Scenario D: Scope narrowing**
1. Create hierarchy with depth-3 action node
2. Resolve scope for L2 → includes `task` tool
3. Resolve scope for L3 → excludes `task` tool
4. Run enforce check-tool `task` with L2 → allowed
5. Run enforce check-tool `task` with L3 → blocked

**Scenario E: Full regression**
1. Run all R1 tests (144/144)
2. Run all R2 tests (249/249)
3. TypeScript compilation check (if any TS files changed)

**Acceptance Criteria (Phase Gate):**
- [ ] Scenario A: Schema validation lifecycle GREEN
- [ ] Scenario B: Enforcement lifecycle GREEN
- [ ] Scenario C: Traceability + enforcement GREEN
- [ ] Scenario D: Scope narrowing GREEN
- [ ] Scenario E: R1+R2 regression GREEN (393/393)
- [ ] Command output evidence presented to user
- [ ] User explicitly approves R3 gate

---

## Summary: R3 Story Count

| Story | Title | Depends On | Test Count |
|-------|-------|------------|------------|
| R3-01 | Schema registry + validation | — | 18 |
| R3-02 | Enforcement engine | — | 20 |
| R3-03 | Traceability checker | — | 17 |
| R3-04 | Dynamic scope resolver | — | 18 |
| R3-05 | Integration verification | R3-01 through R3-04 | 5 scenarios |

**Estimated total test assertions:** ~73 (R3 only) + 393 (R1+R2 regression) = ~466

**Execution order (by dependency):**
1. R3-01 + R3-02 + R3-03 + R3-04 (parallel — no file overlap, except hierarchy.json reads which are read-only)
2. R3-05 (depends on all)

---

## Execution Protocol

For each task:
1. **TDD**: Write test → run (must FAIL = RED) → implement → run (must PASS = GREEN)
2. **L1 Gate**: Run test suite, paste output as evidence
3. **L2 Gate**: Dispatch reviewer sub-agent (hiveq)
4. **L3 Gate**: Thorough code review (code-review-excellence)
5. **If REQUEST_CHANGES**: Fix → re-verify → re-review
6. **After task GREEN + APPROVED**: Move to next task
7. **After all tasks**: R3-05 integration verification → user gate approval

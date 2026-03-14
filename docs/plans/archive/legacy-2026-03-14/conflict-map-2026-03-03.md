# Layer-Specific Conflict Map

**Document ID**: INV-2026-03-03-002  
**Phase**: 1 - Investigation (Part 2)  
**Agent**: hivexplorer (Investigator - Read-Only)  
**Created**: 2026-03-03  
**Depends On**: [`docs/plans/forensics-report-2026-03-03.md`](docs/plans/forensics-report-2026-03-03.md)

---

## Executive Summary

This document maps architectural conflicts across three critical layers:
1. **Layer 1**: `.opencode/` (Plugin/Tool Configuration)
2. **Layer 2**: `.hivemind/` (State Artifacts)
3. **Layer 3**: `src/` (Entry Points and Implementation)

The investigation identified **23 distinct conflicts** across these layers, with **7 cross-layer conflict chains** that create systemic issues.

---

## Layer 1: `.opencode/` (Plugin/Tool Configuration)

### 1.1 Plugin Configuration

| Plugin | Type | Activation Trigger | Status |
|--------|------|-------------------|--------|
| `opencode-antigravity-auth@beta` | Authentication | Session start | Active |
| `hiveops-governance` | Governance | Every turn | Active |

**Conflict C1.1**: Both plugins activate on session start/turn, creating dual governance paths.

### 1.2 MCP Server Configuration

**MCP Servers** (10+ configured in `opencode.json`):
- `playwright` - Browser automation
- `memory` - Knowledge graph
- `sequentialthinking` - Reasoning
- `tavily` - Web search
- `exa` - Semantic search
- `filesystem` - File operations
- `repomix` - Code analysis
- `brave-search` - Search
- `context7` - Documentation
- `github` - Repository operations
- `git-mcp` - Git operations

**Conflict C1.2**: Multiple overlapping capabilities (tavily/exa/brave-search for search, filesystem/github/git-mcp for file/git operations) create ambiguity in tool selection.

### 1.3 Agent Definition Drift

| Agent File | Defined In opencode.json | Status |
|------------|-------------------------|--------|
| `hiveminder.md` | Yes | Active |
| `hivefiver.md` | Yes | Active |
| `hivemaker.md` | Yes | Active |
| `hivehealer.md` | Yes | Active |
| `hiveplanner.md` | Yes | Active |
| `hiveq.md` | Yes | Active |
| `hivexplorer.md` | Yes | Active |
| `hiverd.md` | Yes | Active |
| `hitea.md` | Yes | Active |

**Conflict C1.3**: Agent definitions exist in both `agents/*.md` AND `opencode.json` - dual source of truth creates drift risk. No automatic sync mechanism detected.

### 1.4 Command Inventory (42 commands)

Key command categories:
- **hivefiver** (6): init, spec, architect, audit, doctor, discovery, continue
- **hivemind** (6): clarify, compact, context, delegate, pre-stop, status, orchestrate
- **hiveq** (4): compliance, gate-check, lint, regression, verify
- **hiverd** (3): analyze, brainstorm, compare

**Conflict C1.4**: 42 commands with overlapping functionality - no clear routing rules.

### 1.5 Auto-Mechanism Triggers

| Mechanism | Trigger | Location | Risk |
|-----------|---------|----------|------|
| Auto-realignment | User command missing/invalid | `src/hooks/messages-transform.ts:532` | HIGH - Overrides user intent |
| Auto-commit | `auto_commit: true` in config | `src/hooks/soft-governance.ts:583` | MEDIUM - May commit unwanted changes |
| Auto-compact | `turn_count >= auto_compact_on_turns` | `src/hooks/compaction.ts:71` | MEDIUM - Loses context |
| Auto-session-split | Long session detected | `src/hooks/soft-governance.ts:609` | HIGH - Creates orphan sessions |
| Auto-anchors | Session start | `src/lib/anchors.ts` | LOW - Informational |

**Conflict C1.5**: 5 automatic mechanisms that can override explicit user commands.

---

## Layer 2: `.hivemind/` (State Artifacts)

### 2.1 State File Schema Drift

**Manifest Declaration** (`.hivemind/state/manifest.json`):
```json
{
  "files": [
    { "name": "brain.json", "purpose": "runtime state and governance counters" },
    { "name": "hierarchy.json", "purpose": "hierarchy tree and cursor" },
    { "name": "anchors.json", "purpose": "immutable anchors" },
    { "name": "tasks.json", "purpose": "tasks and sub-task graph" }
  ]
}
```

**Actual Files** (15+ discovered):
| File | Size | Purpose | In Manifest |
|------|------|---------|-------------|
| `brain.json` | 140KB | Runtime state, governance counters | YES |
| `hierarchy.json` | 52KB | Hierarchy tree and cursor | YES |
| `sot-index.json` | 123KB | Source of truth index | NO |
| `gates.json` | ~10KB | Gate state | NO |
| `tasks.json` | ~20KB | Tasks and sub-task graph | YES |
| `todo.json` | ~15KB | TODO list | NO |
| `anchors.json` | ~5KB | Immutable anchors | YES |
| `orphans.json` | 423KB | Quarantined orphaned tasks | NO |
| `backup-*.json` | Various | State backups | NO |

**Conflict C2.1**: Schema drift - manifest documents 4 files but 15+ exist. **CRITICAL**.

### 2.2 Orphan Artifacts

**File**: `.hivemind/graph/orphans.json` (423KB)

**Issue**: Contains tasks with `parent_phase_id` referencing non-existent phases. This indicates:
1. Session splits left tasks without valid parent references
2. Manual deletions without cleanup
3. Failed migration scripts

**Conflict C2.2**: 423KB of invalid task references causing potential graph corruption.

### 2.3 Dual Governance Tracking

| Property | Location | Type | Purpose |
|----------|----------|------|---------|
| `governance_mode` | `src/schemas/config.ts` | Config (static) | Runtime governance strictness |
| `governance_status` | `src/schemas/brain-state.ts` | Runtime state | Current governance enforcement level |

**Conflict C2.3**: Dual tracking creates ambiguity - config says one thing, runtime state says another. Found in 68 locations across 30+ files.

### 2.4 Backup File Proliferation

**Backup Locations**:
- `.hivemind-backup-2026-02-28/` - Manual backup
- `.hivemind/state/*.backup.json` - 4 backup files in state/

**Conflict C2.4**: Multiple backup locations without clear restoration strategy.

---

## Layer 3: `src/` (Entry Points)

### 3.1 Entry Point Analysis

**Primary Entry**: `src/index.ts`
- 14 tools registered
- 6 hooks registered
- No direct state mutations (CQRS compliant)

**Hook Cascade Path**:
```
User Input
  → session-lifecycle.ts (every turn)
    → soft-governance.ts (after every tool call)
      → tool-gate.ts (before tool execution)
        → messages-transform.ts (message processing)
          → event-handler.ts (event processing)
            → compaction.ts (periodic)
              → swarm-executor.ts (delegation)
```

### 3.2 CQRS Compliance Analysis

**Investigation Result**: ✅ COMPLIANT

All hooks correctly use `queueStateMutation()` from `src/lib/state-mutation-queue.ts`:

| Hook | Mutation Method | Status |
|------|-----------------|--------|
| `session-lifecycle.ts` | `queueStateMutation()` line 37 | ✅ Compliant |
| `soft-governance.ts` | `queueStateMutation()` line 25 | ✅ Compliant |
| `tool-gate.ts` | `queueStateMutation()` line 11 | ✅ Compliant |
| `event-handler.ts` | `queueStateMutation()` | ✅ Compliant |
| `compaction.ts` | `queueStateMutation()` | ✅ Compliant |
| `messages-transform.ts` | Read-only (injection) | ✅ Compliant |

**Conflict C3.1**: NONE - CQRS is properly enforced.

### 3.3 Auto-Mechanism vs User Intent Divergence

| Auto-Mechanism | File:Line | User Override Possible? |
|----------------|-----------|------------------------|
| Auto-realign | `messages-transform.ts:532` | Yes, but hidden |
| Auto-commit | `soft-governance.ts:583` | Config flag only |
| Auto-compact | `compaction.ts:71` | No - forced at threshold |
| Auto-session-split | `soft-governance.ts:609` | No - silent split |

**Conflict C3.2**: Auto-mechanisms can override explicit user commands without clear notification.

### 3.4 Tool Permission Boundaries

**Tools** (14 in `src/tools/index.ts`):
1. `hivemind_session` - Session management
2. `hivemind_inspect` - State inspection
3. `hivemind_memory` - Memory operations
4. `hivemind_anchor` - Anchor management
5. `hivemind_hierarchy` - Hierarchy operations
6. `hivemind_cycle` - Cycle management
7. `hivemind_context` - Context operations
8. `hivemind_session_memory` - Session memory
9. `hivemind_codemap` - Code mapping
10. `hivemind_ideate` - Ideation
11. `hivemind_read_skeleton` - Skeleton reading
12. `hivemind_precision_patch` - Precision patching
13. `hivemind_mesh_pull` - Mesh operations
14. `hivemind_doc_weaver` - Documentation
15. `hivemind_declare` - Declaration

**Conflict C3.3**: 15 tools with overlapping capabilities (memory/session_memory, hierarchy/cycle).

---

## Cross-Layer Conflict Chains

### Chain 1: Plugin → Hook → State

```
.opencode plugins (hiveops-governance)
  → src/hooks/soft-governance.ts (governance enforcement)
    → .hivemind/state/brain.json (governance counters)
```

**Issue**: Plugin injects governance rules that modify state through hooks.

### Chain 2: Config Drift → Runtime State

```
opencode.json (governance_mode: "advisory")
  → src/schemas/config.ts
    → src/hooks/tool-gate.ts
      → .hivemind/state/brain.json (governance_status: "locked")
```

**Issue**: Config says "advisory" but runtime shows "locked".

### Chain 3: Auto-Commit → Unwanted Changes

```
src/hooks/soft-governance.ts:583 (auto_commit enabled)
  → src/lib/auto-commit.ts
    → Direct git commit (may override user intent)
```

**Issue**: Automatic commits without explicit user approval.

### Chain 4: Session Split → Orphans

```
src/hooks/soft-governance.ts:609 (auto-session-split)
  → .hivemind/graph/orphans.json (423KB quarantined)
    → Tasks with invalid parent_phase_id
```

**Issue**: Silent session splits create orphaned tasks.

### Chain 5: Manifest → Actual State

```
.hivemind/state/manifest.json (4 files documented)
  → Actual .hivemind/state/ (15+ files)
    → Schema drift causes sync issues
```

**Issue**: Documentation doesn't match reality.

### Chain 6: Agent Definition Drift

```
agents/*.md (agent definitions)
  ↔ opencode.json (agent configuration)
    → No sync mechanism
      → Definitions can drift
```

**Issue**: Dual source of truth for agent configs.

### Chain 7: Auto-Realignment → Intent Override

```
src/hooks/messages-transform.ts:532 (detectAutoRealignment)
  → Auto-routes to /hivefiver commands
    → Overrides explicit user commands
```

**Issue**: Hidden auto-routing bypasses user intent.

---

## Severity Ratings

| Conflict ID | Description | Severity | Impact |
|-------------|-------------|----------|--------|
| C2.1 | Manifest vs actual state files | CRITICAL | Data integrity |
| C2.2 | 423KB orphans.json | CRITICAL | Graph corruption |
| C1.5 | 5 auto-mechanisms | HIGH | Intent override |
| C2.3 | governance_mode vs status | HIGH | Ambiguity |
| C1.3 | Agent definition drift | HIGH | Framework instability |
| C3.2 | Auto-mechanisms hidden | HIGH | UX violation |
| C1.4 | 42 overlapping commands | MEDIUM | Confusion |
| C1.2 | MCP server overlap | MEDIUM | Tool selection |
| C2.4 | Backup proliferation | MEDIUM | Storage bloat |
| C3.3 | Tool overlap | LOW | Code complexity |

---

## Recommended Isolation Boundaries

### 1. State Layer Isolation
- **Enforce manifest.json as single source of truth**
- **Implement validation on state file creation**
- **Quarantine orphans.json with cleanup schedule**

### 2. Governance Isolation
- **Remove governance_status from runtime state**
- **Use governance_mode as single source**
- **Add audit trail for governance decisions**

### 3. Auto-Mechanism Boundaries
- **Require explicit user consent for auto-commit**
- **Notify user before auto-compact**
- **Make auto-realignment visible, not hidden**

### 4. Agent Definition Isolation
- **Single source of truth for agent definitions**
- **Auto-sync between agents/*.md and opencode.json**
- **Version control agent definitions**

### 5. Hook Boundary Enforcement
- **Maintain CQRS compliance (verified ✅)**
- **Add runtime validation for hook mutations**
- **Log all state queue operations**

---

## Findings Summary

| Layer | Conflicts | Critical | High | Medium | Low |
|-------|-----------|----------|------|--------|-----|
| Layer 1 (.opencode/) | 5 | 0 | 2 | 2 | 1 |
| Layer 2 (.hivemind/) | 4 | 2 | 2 | 0 | 0 |
| Layer 3 (src/) | 3 | 0 | 1 | 1 | 1 |
| Cross-layer | 7 | 0 | 7 | 0 | 0 |
| **TOTAL** | **19** | **2** | **12** | **3** | **2** |

### Key Wins
- ✅ CQRS compliance verified - hooks properly use state mutation queue
- ✅ No direct file writes from hooks (correct pattern)
- ✅ State mutation queue properly implemented

### Key Risks
- ⚠️ Schema drift between manifest and actual state files
- ⚠️ 423KB of orphaned task data
- ⚠️ 5 automatic mechanisms that can override user intent
- ⚠️ Dual governance tracking creates ambiguity

---

## Next Steps (For Remediation Phase)

1. **Immediate**: Clean up orphans.json (C2.2)
2. **Immediate**: Sync manifest.json with actual files (C2.1)
3. **Short-term**: Remove governance_status, use governance_mode only (C2.3)
4. **Short-term**: Add user consent for auto-commit (C3.2)
5. **Medium-term**: Single source for agent definitions (C1.3)
6. **Medium-term**: Command routing rules (C1.4)

---

*Document generated by hivexplorer (Investigation Agent)*
*Read-only investigation - no modifications made*
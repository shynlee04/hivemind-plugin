# Session Inspection Export

- ses_id: `ses_2df298f9cffesvxL7xCDWHonpw`
- prepared_at: `2026-03-24T17:18:03.761Z`

## Assistant Output

Now I have enough evidence. Let me compile the complete audit report:

---

## Codebase Investigation Report

**Scope:** `src/core/` and `src/shared/` directories  
**Question:** Full module audit - live vs deprecated, dead code imports, session kernel, event bus, logging, god modules  
**Investigation Date:** 2026-03-25  
**Git Commit:** Investigated at current worktree state

---

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | `core/session/` **REMOVED** | N/A | N/A | Directory does not exist at `src/core/session/` |
| 2 | `shared/event-bus.ts` **REMOVED** | N/A | N/A | File does not exist at `src/shared/event-bus.ts` |
| 3 | Zero imports from `core/session/` | N/A | N/A | `rg "from ['\"].*core/session"` returned no matches |
| 4 | Zero imports from `shared/event-bus` | N/A | N/A | `rg "from ['\"].*event-bus"` returned no matches |
| 5 | All "session" imports are legitimate | Multiple | Various | Imports from `features/session-entry/` - different module |
| 6 | Logging **CORRECTLY** augments `client.app.log()` | `src/shared/logging.ts` | 24 | `await client.app.log({ body: { service: 'hivemind', level, message: formatMessage(level, msg) } })` |
| 7 | `soft-governance.ts` **CORRECTLY** uses `client.tui.showToast()` | `src/hooks/soft-governance.ts` | 41 | `await client.tui.showToast({ body: { message, variant: variant ?? 'info' } })` |

---

### 1. Core Modules Status

| Module | Status | Files | Evidence |
|--------|--------|-------|----------|
| `trajectory/` | ✅ ACTIVE | 9 files | `src/core/trajectory/` exists with `index.ts`, `trajectory-types.ts`, `trajectory-store.ts`, `trajectory-assessment.ts`, `trajectory-store.ledger.ts`, `trajectory-store.operations.ts`, `trajectory-store.types.ts`, `AGENTS.md` |
| `workflow-management/` | ✅ ACTIVE | 6 files | `src/core/workflow-management/` exists with `index.ts`, `workflow-types.ts`, `workflow-router.ts`, `workflow-authority.ts`, `task-lifecycle.ts`, `continuity.ts` |
| `hierarchy/` | ❌ **STALE DOCS** | 0 files | Listed in `src/core/AGENTS.md:12` as Active but **directory does not exist** |
| `planning/` | ❌ **STALE DOCS** | 0 files | Listed in `src/core/AGENTS.md:12` as Active but **directory does not exist** |
| `state/` | ❌ **STALE DOCS** | 0 files | Listed in `src/core/AGENTS.md:12` as Active but **directory does not exist** |

**Critical Gap:** `src/core/AGENTS.md` references `hierarchy/`, `planning/`, `state/` as Active but these directories **do not exist**. The document is stale.

---

### 2. Shared Modules Status

| Module | Status | Lines | Evidence |
|--------|--------|-------|----------|
| `paths.ts` | ✅ ACTIVE | 89 | `src/shared/paths.ts` |
| `tool-response.ts` | ✅ ACTIVE | 25 | `src/shared/tool-response.ts` |
| `logging.ts` | ✅ ACTIVE | 56 | `src/shared/logging.ts` - correctly augments `client.app.log()` |
| `runtime-attachment.ts` | ✅ ACTIVE | 6 | `src/shared/runtime-attachment.ts` |
| `entry-kernel-state.ts` | ✅ ACTIVE | 199 | `src/shared/entry-kernel-state.ts` |
| `opencode-knowledge.ts` | ✅ ACTIVE | 138 | `src/shared/opencode-knowledge.ts` |
| `opencode-agent-registry.ts` | ✅ ACTIVE | 146 | `src/shared/opencode-agent-registry.ts` |
| `opencode-skill-registry.ts` | ✅ ACTIVE | 136 | `src/shared/opencode-skill-registry.ts` |
| `lifecycle-spine.ts` | ✅ ACTIVE | 68 | `src/shared/lifecycle-spine.ts` |
| `pressure-contract.ts` | ✅ ACTIVE | 287 | `src/shared/pressure-contract.ts` - properly decomposed via intersection types |
| `bootstrap-profile.ts` | ✅ ACTIVE | 53 | `src/shared/bootstrap-profile.ts` |
| `tool-helpers.ts` | ✅ ACTIVE | 39 | `src/shared/tool-helpers.ts` |
| `intake-record.ts` | ✅ ACTIVE | ~multiple | `intake-record*.ts` series - factory, types, validation, serialization |
| `errors.ts` | ✅ ACTIVE | 162 | `src/shared/errors.ts` - clean 5-class hierarchy |
| `keyword-matcher.ts` | ✅ ACTIVE | 60 | `src/shared/keyword-matcher.ts` |
| `evidence-lane.ts` | ✅ ACTIVE | 77 | `src/shared/evidence-lane.ts` |
| `contracts/` | ✅ ACTIVE | Subdirectory | `runtime-status.ts` (282 lines), `runtime-events.ts` (10 lines), `index.ts` |

**No deprecated modules in `shared/` detected.**

---

### 3. Imports from Removed/Dead Code

| Pattern Searched | Results | Conclusion |
|-----------------|---------|------------|
| `from ['\"].*core/session` | **0 matches** | ✅ No imports from removed `core/session/` |
| `from ['\"].*event-bus` | **0 matches** | ✅ No imports from removed `shared/event-bus.ts` |
| `from ['\"].*session` (general) | 31 matches | All from `features/session-entry/` - legitimate different module |

**Verification Command:**
```bash
rg "from ['\"].*core/session" --include="*.ts" src/  # 0 matches
rg "from ['\"].*event-bus" --include="*.ts" src/      # 0 matches
```

---

### 4. Session Kernel Status

| Claim | Evidence | Status |
|-------|----------|--------|
| `core/session/` removed | `ls src/core/session/` returned "Directory not found" | ✅ **CONFIRMED REMOVED** |
| `core/session/kernel.ts` dead code | Not found anywhere | ✅ **CONFIRMED REMOVED** |
| Session lifecycle now in `hooks/start-work/` | `src/hooks/start-work/start-work-router.ts` exists | ✅ **CORRECT** |

**AGENTS.md Note:** `src/core/AGENTS.md:17-18` explicitly documents: "`core/session/` was **removed** in L1 cutover (2026-03-15). Session lifecycle is owned by `hooks/start-work/`."

---

### 5. Event Bus Status

| Claim | Evidence | Status |
|-------|----------|--------|
| `shared/event-bus.ts` removed | `ls src/shared/event-bus.ts` returned "File not found" | ✅ **CONFIRMED REMOVED** |
| Only consumer was `core/session/kernel.ts` | Both removed together | ✅ **CORRECT** |
| Replacement: `event` hook + `client.tui.publish()` | `src/plugin/opencode-plugin.ts` uses `event` hook | ✅ **CORRECT PATTERN** |

---

### 6. Logging Implementation

**File:** `src/shared/logging.ts`

| Requirement | Implementation | Line |
|-------------|----------------|------|
| Augment `client.app.log()` | ✅ Yes | 24 |
| Fallback to console | ✅ Yes | 37, 43, 48, 53 |
| Uses `withClient` pattern | ✅ Yes | 23 |
| SDK logging is best-effort | ✅ Yes (async, silent fallback) | 22 |

**Code Evidence:**
```typescript
// Line 22-32
async function sendToSdkLog(level: LogLevel, msg: string): Promise<void> {
  await withClient(async (client) => {
    await client.app.log({
      body: {
        service: 'hivemind',
        level,
        message: formatMessage(level, msg),
      },
    })
  })
}
```

**Also verified:** `src/hooks/soft-governance.ts` (line 41) correctly uses `client.tui.showToast()` with cooldown tracking - this was fixed per Known Debt section.

---

### 7. God Modules / Monoliths Analysis

| File | Lines | Assessment | Notes |
|------|-------|------------|-------|
| `task-lifecycle.ts` | 353 | ✅ Acceptable | Largest file - well-structured with clear function separation, interfaces under 10 fields |
| `pressure-contract.ts` | 287 | ✅ Acceptable | Properly decomposed via intersection types per CONCERNSV1.md audit |
| `runtime-status.ts` | 282 | ✅ Acceptable | Schema definitions + helper functions, well-organized |
| `entry-kernel-state.ts` | 199 | ✅ Acceptable | Clear single responsibility - entry kernel state management |
| `errors.ts` | 162 | ✅ Acceptable | Clean 5-class hierarchy with Result type |
| `trajectory-store.operations.ts` | 231 | ✅ Acceptable | High-level trajectory operations, well-documented |
| `trajectory-types.ts` | 155 | ⚠️ Note | AGENTS.md warns `TrajectoryRecord` has 20+ fields - see below |
| `workflow-authority.ts` | 209 | ✅ Acceptable | Inspection + bootstrap + repair patterns |

**Potential Concern:**
- `src/core/trajectory/AGENTS.md:26` notes: "`TrajectoryRecord` has 20+ fields. Most are optional arrays (delegationIds, graphNodeBindings, rerouteNotes, branchNotes) that are rarely populated. Consider splitting into core record + optional extensions."
- However, the `pressure-contract.ts` was already decomposed per the Known Debt section - same pattern could apply here.

**No God Components detected** - all files are under 400 lines and properly modularized.

---

### 8. Directory Structure Discrepancies

| Document | Claims | Reality | Severity |
|----------|--------|---------|----------|
| `src/core/AGENTS.md:12` | `hierarchy/`, `planning/`, `state/` are Active | These directories **DO NOT EXIST** | HIGH - Stale documentation |
| `src/shared/AGENTS.md` | (file should exist per pattern) | **File does not exist** | MEDIUM - Missing governance doc |

---

### Summary

| Category | Status |
|----------|--------|
| Dead code imports | ✅ **CLEAN** - Zero imports from removed modules |
| Session kernel | ✅ **REMOVED** - `core/session/` does not exist |
| Event bus | ✅ **REMOVED** - `shared/event-bus.ts` does not exist |
| Logging augmentation | ✅ **CORRECT** - `client.app.log()` properly used |
| God modules | ✅ **NONE** - All files under 400 lines, well-structured |
| Stale documentation | ⚠️ **`src/core/AGENTS.md`** lists non-existent modules as Active |

---

### Required Actions

1. **Update `src/core/AGENTS.md`** - Remove `hierarchy/`, `planning/`, `state/` from the Active modules table as these directories do not exist
2. **Create `src/shared/AGENTS.md`** - The shared directory lacks a governance document per the sector charter pattern
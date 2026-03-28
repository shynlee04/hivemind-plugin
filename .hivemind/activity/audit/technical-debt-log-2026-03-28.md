# Technical Debt & Issues Log

**Generated:** 2026-03-28  
**Audit Scope:** HiveMind Plugin - Architectural Audit  
**Worktree:** `product-detox`

---

## CRITICAL Issues (Priority 1)

### Issue #1: Agent Work Contract Directory is EMPTY

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-001` |
| **Severity** | 🔴 CRITICAL |
| **Category** | Silent Failure / Data Loss |
| **Location** | `.hivemind/agent-work-contract/` |
| **First Detected** | 2026-03-28 |
| **Status** | Open |

**Description:**
The `agent-work-contract/` directory exists but contains ZERO files. Source code at `src/features/agent-work-contract/engine/contract-store.base.ts:84` explicitly constructs paths to this directory:

```typescript
this.contractDirectory = join(baseDirectory, '.hivemind', CONTRACT_DIR)
```

Tests at `create-contract-tool.test.ts` expect files to be created at:
```typescript
patterns: ['.hivemind/agent-work-contract/contract-create-123.json']
```

**Impact:**
- Workflow contracts may be created in-memory but never persisted
- Agent-work-contract feature may be non-functional
- Any tooling depending on persisted contracts will fail

**Root Cause Hypothesis:**
1. Contract persistence is failing silently (try/catch swallowing errors)
2. Directory creation is failing
3. Contracts are stored in-memory only
4. Files created but subsequently deleted/cleaned

**Recommended Investigation:**
```typescript
// Add logging to contract-store.ts persist() method
// Verify directory exists before write
// Check if errors are being swallowed
```

**Fix Verification:**
```bash
# After fix, create a contract and verify file exists:
ls -la .hivemind/agent-work-contract/
# Should contain *.json files, not empty
```

---

### Issue #2: Orphaned Session Files at Project Root

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-002` |
| **Severity** | 🟡 MEDIUM |
| **Category** | Artifact Pollution |
| **Location** | Project root: `/Users/apple/hivemind-plugin/.worktrees/product-detox/` |
| **First Detected** | 2026-03-28 |
| **Status** | Open |

**Description:**
29 orphaned files exist at project root that are not created by current code:

**Files to Remove:**
```
ses_2026-03-25T204658_implementation_unknown.json
ses_2026-03-25T204718_implementation_unknown.json
ses_2026-03-25T204740_implementation_unknown.json
ses_2026-03-25T204824_implementation_unknown.json
ses_2026-03-25T204836_implementation_unknown.json
ses_2026-03-25T204901_implementation_unknown.json
ses_2026-03-25T204919_implementation_unknown.json
ses_2026-03-25T204930_implementation_unknown.json
ses_2026-03-25T204938_implementation_unknown.json
ses_2026-03-25T204948_implementation_unknown.json
ses_2026-03-25T204958_implementation_unknown.json
ses_2026-03-25T205009_implementation_unknown.json
ses_2026-03-25T205026_implementation_unknown.json
ses_2026-03-25T205047_implementation_unknown.json
ses_2026-03-25T205055_implementation_unknown.json
ses_2026-03-25T205117_implementation_unknown.json
ses_2026-03-25T205135_implementation_unknown.json
ses_2026-03-25T205242_implementation_unknown.json
ses_2026-03-25T205256_implementation_unknown.json
ses_2026-03-25T205309_implementation_unknown.json
ses_2026-03-25T205324_implementation_unknown.json
ses_2026-03-25T205344_implementation_unknown.json
ses_2026-03-25T205356_implementation_unknown.json
ses_2026-03-25T205420_implementation_unknown.json
ses_2026-03-25T205432_implementation_unknown.json
ses_2026-03-25T205518_implementation_unknown.json
session-ses_2dad.md
session-ses_2e0b.md
session-ses_2e54.md
```

**Root Cause:**
Pre-refactor code created files at project root (missing `.hivemind/sessions/` prefix). Current code correctly writes to `.hivemind/sessions/`.

**Fix:**
```bash
cd /Users/apple/hivemind-plugin/.worktrees/product-detox
rm ses_2026-03-25T*.json session-ses_*.md
```

---

## MEDIUM Issues (Priority 2)

### Issue #3: getSessionPath Naming Collision

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-003` |
| **Severity** | 🟡 MEDIUM |
| **Category** | Maintenance Risk |
| **Location** | `src/shared/paths.ts:27` AND `src/features/event-tracker/consolidated-writer.ts:220` |
| **First Detected** | 2026-03-28 |
| **Status** | Open |

**Description:**
Two functions with identical name `getSessionPath` exist in different files with DIFFERENT return types:

| Location | Return Type | Actual Path |
|----------|-------------|-------------|
| `src/shared/paths.ts:27` | Directory | `/path/.hivemind/sessions/{id}` |
| `src/features/event-tracker/consolidated-writer.ts:220` | File | `/path/.hivemind/sessions/{id}.json` |

**Risk:**
If code imports the wrong function, subtle bugs could occur. This is a maintenance hazard.

**Recommended Fix:**
Rename the functions to be more explicit:
- `getSessionPath()` in `paths.ts` → `getSessionDirPath()`
- `getSessionPath()` in `consolidated-writer.ts` → `getSessionFilePath()`

**Files to Update After Rename:**
```bash
grep -r "getSessionPath" src/ --include="*.ts"
```

---

### Issue #4: error-log Directory Pollution

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-004` |
| **Severity** | 🟡 MEDIUM |
| **Category** | Resource Pollution |
| **Location** | `.hivemind/error-log/` |
| **First Detected** | 2026-03-28 |
| **Status** | Open |

**Description:**
The `error-log/` directory contains 2,543 files totaling 175MB. This is:
- ~175 bytes per file average
- Accumulated since project start
- No detected cleanup mechanism

**Source:**
`src/sdk-supervisor/diagnostic-log.ts` (marked as deprecated in comments but still active)

**Recommended Actions:**

**Option A - Add Retention Policy:**
```typescript
// In diagnostic-log.ts, add:
const MAX_AGE_DAYS = 30
const cleanupOldLogs = async () => {
  const cutoff = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
  // Delete files older than cutoff
}
```

**Option B - Disable Deprecated Writer:**
If `diagnostic-log.ts` is truly deprecated and no longer needed:
1. Remove `writeDiagnosticLog()` calls from hooks
2. Delete the file

**Option C - Investigate if this is Expected:**
If per-turn diagnostic capture is intentional and valuable, document retention policy.

---

## LOW Priority Issues (Priority 3)

### Issue #5: v2/v3 Mixed Session Storage

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-005` |
| **Severity** | ℹ️ INFO |
| **Category** | Migration Incomplete |
| **Location** | `.hivemind/sessions/` |
| **First Detected** | 2026-03-28 |
| **Status** | Monitor Only |

**Description:**
- 1,403 flat JSON files (v2 format)
- 103 directory structures (v3 format)

**Assessment:**
This appears to be an incomplete migration from flat JSON to directory-based storage. Both formats coexist. This is likely intentional during a transition period.

**Action:**
Monitor - no immediate action unless issues arise.

---

### Issue #6: internal/ Missing Barrel Export

| Field | Value |
|-------|-------|
| **Issue ID** | `DEBT-006` |
| **Severity** | ℹ️ INFO |
| **Category** | Code Organization |
| **Location** | `src/internal/` |
| **First Detected** | 2026-03-28 |
| **Status** | Intentional |

**Description:**
`src/internal/` lacks an `index.ts` barrel file while most other directories have them.

**Assessment:**
This is likely intentional - `internal/` is meant to be isolated and not imported from outside. No action needed.

---

## Resolved Issues

*(None at time of audit)*

---

## Audit Trail

| Date | Auditor | Findings |
|------|---------|----------|
| 2026-03-28 | Hiveminder + Subagents | Initial audit - 6 issues identified |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Orchestrator | Hiveminder | 2026-03-28 | ✅ |
| Architecture Review | Pending | — | — |
| Dev Lead | Pending | — | — |
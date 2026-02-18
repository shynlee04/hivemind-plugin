---
name: "hivemind-pre-stop"
description: "MANDATORY: Run before stopping work. Validates context integrity, exports intelligence, and prevents data loss. Use this command EVERY time before ending a session."
---

# HiveMind Pre-Stop Gate

**⛔ CRITICAL: This command MUST be run before stopping work.**

Validates all work is properly tracked, exported, and committed.

## Phase 1: Context Validation (MANDATORY)

### 1.1 Check Trajectory Completion
```typescript
scan_hierarchy({ include_drift: true })
```
**Verify:**
- [ ] Current trajectory has been completed OR properly documented
- [ ] No pending actions left unresolved
- [ ] Drift score is acceptable (< 80/100)

### 1.2 Validate Chain Integrity
```bash
node bin/hivemind-tools.cjs validate chain
```
**Verify:**
- [ ] No chain breaks detected
- [ ] Hierarchy is consistent
- [ ] All timestamps align

### 1.3 Check Pending Failures
```typescript
// Check brain.json for pending_failure_ack
// Look for: pending_failure_ack: true
```
**Action Required:**
- If `pending_failure_ack: true` → Acknowledge and document failures BEFORE stopping
- Use: `export_cycle({ outcome: "failure", findings: "..." })`

## Phase 2: Intelligence Export (MANDATORY)

### 2.1 Export Cycle Results
```typescript
export_cycle({
  outcome: "success" | "partial" | "failure",
  findings: "What was accomplished and learned (3-5 sentences)"
})
```
**Required Information:**
- Files modified (with specific paths)
- Decisions made (with rationale)
- Issues encountered (and resolutions)
- What's next (if applicable)

### 2.2 Save Critical Memories
```typescript
// For each important decision or pattern learned:
save_mem({
  shelf: "decisions",
  content: "Specific decision with context and rationale",
  tags: "relevant,tags"
})
```

**Must Save:**
- [ ] Architecture decisions
- [ ] Error patterns discovered
- [ ] Solutions found
- [ ] Project conventions learned

### 2.3 Update Anchors (if needed)
```typescript
// If new constraints discovered:
save_anchor({
  key: "constraint-name",
  value: "Specific constraint value"
})
```

## Phase 3: Verification (MANDATORY)

### 3.1 Type Check
```bash
npx tsc --noEmit
```
**Result:** Must pass (0 errors)

### 3.2 Test Verification
```bash
npm test
```
**Result:** Must pass (or document why not)

### 3.3 Lint Check (if configured)
```bash
npm run lint 2>/dev/null || echo "No lint script configured"
```

### 3.4 Git Status Check
```bash
git status --short
git diff --stat
```
**Verify:**
- [ ] All intended changes are staged
- [ ] No unexpected files modified
- [ ] Changes are committed or documented

## Phase 4: Session Compact (REQUIRED)

```typescript
compact_session({
  summary: "Brief summary of session work (1-2 sentences)"
})
```

## Pre-Stop Checklist Summary

**Before you stop, confirm:**

| Check | Status | Tool/Command |
|-------|--------|--------------|
| Trajectory complete | ☐ | scan_hierarchy |
| No chain breaks | ☐ | validate chain |
| Failures acknowledged | ☐ | brain.json check |
| export_cycle called | ☐ | export_cycle tool |
| Memories saved | ☐ | save_mem |
| Type check passed | ☐ | npx tsc --noEmit |
| Tests passed | ☐ | npm test |
| Git committed | ☐ | git status |
| Session compacted | ☐ | compact_session |

## Failure Protocol

**If ANY check fails:**

1. **Document the failure:**
   ```typescript
   save_mem({
     shelf: "errors",
     content: "Pre-stop check failed: [specific check]. Reason: [why]. Resolution: [how]",
     tags: "pre-stop,failure,[check-name]"
   })
   ```

2. **Fix if possible:** Address the issue immediately

3. **If cannot fix:**
   - Document in export_cycle findings
   - Save anchor with blocker status
   - Escalate to user

## Auto-Enforcement

**This command auto-parses and enforces:**

1. **Mandatory execution** - Must run before session ends
2. **Sequential validation** - Each phase blocks next
3. **Evidence collection** - All results captured in .hivemind/
4. **Failure escalation** - Unacknowledged failures trigger warnings

## Integration with Other Commands

**Run this command BEFORE:**
- `hivemind-compact` (final archival)
- `hivemind-dashboard` (status viewing)
- Session switch or termination

**Run this command AFTER:**
- Any significant work completion
- Task delegation completion
- Code changes

## Command Usage

```bash
# Auto-parse and enforce pre-stop protocol
/hivemind-pre-stop

# Manual invocation with specific focus
/hivemind-pre-stop --focus="trajectory-completion"
```

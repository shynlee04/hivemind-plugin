---
name: "hivemind-debug-verify"
description: "Verify that a debug fix is complete and no regressions exist. Run this AFTER applying a fix to confirm resolution."
---

# HiveMind Debug Verify Command

This command is the **verification actuator** for debugging. It runs verification checks and returns deterministic JSON.

## Input Schema

```json
{
  "sessionId": "string (optional)",
  "fix_summary": "string (what was fixed)",
  "verification_level": "standard|thorough"
}
```

## Execution Steps

### Step 1: Run Verification Suite

```bash
# Always run these regardless of verification_level
npm test
npx tsc --noEmit
```

### Step 2: Check for Regressions

```bash
# If verification_level === "thorough", also run:
npm run guard:public
```

### Step 3: Inspect State

```typescript
hivemind_inspect({ action: "scan" })
```

### Step 4: Return Response

## Output Contract

**Success:**
```json
{
  "status": "success",
  "verification_passed": true,
  "tests": { "passed": number, "failed": number, "total": number },
  "type_check": "passed|failed",
  "regressions": [],
  "session_status": "healthy|degraded",
  "drift_score": number
}
```

**Failed:**
```json
{
  "status": "error",
  "verification_passed": false,
  "tests": { "passed": number, "failed": number },
  "type_check": "passed|failed",
  "regressions": [
    { "type": "test|type|runtime", "message": "string", "file": "string" }
  ],
  "recommendation": "string"
}
```

## Examples

### Example 1: Standard Verification

```json
{
  "fix_summary": "Fixed null reference in session manager",
  "verification_level": "standard"
}
```

### Example 2: Thorough Verification

```json
{
  "fix_summary": "Fixed null reference in session manager",
  "verification_level": "thorough"
}
```

## Verification Levels

| Level | Tests | Type Check | Guard | Drift Check |
|-------|-------|------------|-------|-------------|
| standard | ✅ | ✅ | ❌ | ✅ |
| thorough | ✅ | ✅ | ✅ | ✅ |

## Constraints

1. **This command does NOT apply fixes** - Only verifies
2. **Tests must pass** - If tests fail, verification fails
3. **Type check must pass** - If tsc fails, verification fails
4. **Must return deterministic JSON** - No conversational text

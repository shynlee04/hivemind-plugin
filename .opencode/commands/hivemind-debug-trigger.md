---
name: "hivemind-debug-trigger"
description: "Trigger a debug orchestration session. Use this when LSP errors, test failures, or runtime errors occur. This command creates a debug session and queues investigation."
---

# HiveMind Debug Trigger Command

This command is the **actuator** that initiates debug orchestration. It does NOT think - it only creates the session and returns deterministic JSON.

## Input Schema

```json
{
  "source": "lsp|test|runtime|manual",
  "errors": [{ "message": "string", "file": "string", "line": number, "severity": "error|warning|hint" }],
  "context": "string (optional)",
  "sessionId": "string (optional, uses current if not provided)"
}
```

## Execution Steps

### Step 1: Validate Input

Return error if:
- `source` is missing or invalid
- `errors` array is empty

### Step 2: Create Debug Session

```typescript
hivemind_session({
  action: "start",
  mode: "quick_fix",
  focus: `Debug ${source} error: ${errors.length} issues`
})
```

### Step 3: Preserve Context

```typescript
hivemind_anchor({
  action: "save",
  key: `debug_${source}_${timestamp}`,
  value: JSON.stringify({ errors, context })
})
```

### Step 4: Return Deterministic Response

```json
{
  "status": "success",
  "message": "Debug session created",
  "debug_session_id": "uuid",
  "errors_count": 3,
  "next_action": "investigate",
  "recommended_strategy": "systematic-debugging-hivemind"
}
```

## Output Contract

**Success:**
```json
{
  "status": "success",
  "debug_session_id": "uuid",
  "errors_count": number,
  "severity_breakdown": { "error": number, "warning": number, "hint": number },
  "next_action": "investigate|ignore|dismiss",
  "recommended_strategy": "systematic-debugging-hivemind|parallel-debugging-hivemind|extended-investigation",
  "session_focus": "Debug [source] error: [count] issues"
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "INVALID_INPUT|MISSING_SOURCE|INTERNAL_ERROR"
}
```

## Examples

### Example 1: LSP Error Trigger

```json
{
  "source": "lsp",
  "errors": [
    { "message": "Cannot find name 'SomeType'", "file": "src/lib/utils.ts", "line": 42, "severity": "error" }
  ]
}
```

### Example 2: Test Failure Trigger

```json
{
  "source": "test",
  "errors": [
    { "message": "Expected 2, got 1", "file": "tests/auth.test.ts", "line": 15, "severity": "error" }
  ],
  "context": "Test: should authenticate user correctly"
}
```

### Example 3: Runtime Error Trigger

```json
{
  "source": "runtime",
  "errors": [
    { "message": "TypeError: Cannot read property 'x' of undefined", "file": "src/index.ts", "line": 10, "severity": "error" }
  ],
  "context": "User clicked login button"
}
```

## Decision Logic

| Condition | Recommended Strategy |
|-----------|---------------------|
| 1 error, obvious cause | systematic-debugging-hivemind |
| Multiple errors, unknown cause | parallel-debugging-hivemind |
| Non-reproducible | extended-investigation |
| Too many errors (>10) | batch + prioritize |

## Constraints

1. **This command does NOT investigate** - It only sets up the session
2. **Must follow up with skill injection** - After this, inject appropriate debugging skill
3. **Session must be closed** - Call `hivemind_cycle({ action: "export" })` when done

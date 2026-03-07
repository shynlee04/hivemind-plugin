---
description: "Validate and standardize sub-agent delegation. Use before dispatching tasks to ensure proper context packets."
agent: hiveminder
---

# HiveMind Delegation Validator

**Enforces delegation quality standards BEFORE dispatching sub-agents.**

## Pre-Delegation Checklist

### 1. Context Investigation (MANDATORY)

**Before delegating, YOU must:**

```typescript
// A. Scan current state
scan_hierarchy({ action: "status" })

// B. Check for similar past work
recall_mems({ query: "[task topic]" })

// C. Identify affected files
glob({ pattern: "**/*[topic]*" })
```

**Evidence Required:**
- [ ] Current trajectory/tactic/action documented
- [ ] Relevant memories reviewed
- [ ] Files to modify identified

### 2. Task Specification Template

**Your Task() call MUST include:**

```typescript
Task({
  description: "Brief, specific description",
  subagent_type: "hivemaker" | "hivexplorer" | "hivehealer",
  prompt: `
    ## Task: [Specific Goal]
    
    ### Context (from investigation)
    - Files to read: [absolute paths]
    - Current trajectory: [from scan_hierarchy]
    - Related memories: [from recall_mems]
    
    ### Specific Requirements
    1. [Exact change needed]
    2. [Specific file and line]
    3. [Expected outcome]
    
    ### Verification
    Run these BEFORE claiming complete:
    - npx tsc --noEmit
    - npm test [specific test]
    - git diff --name-only
    
    ### Return Format
    Report:
    - Outcome: success/partial/failure
    - Files modified: [list with line numbers]
    - Changes: [specific description]
    - Verification: [test results]
    
    ### Post-Completion (MANDATORY)
    After work is done, call:
    export_cycle({
      outcome: "success|partial|failure",
      findings: "What was done and learned"
    })
  `
})
```

### 3. Delegation Depth Check

**Warning: You are at delegation depth [N]**

| Depth | Status | Risk |
|-------|--------|------|
| 0 (You) | ✅ Safe | Main session |
| 1 | ✅ Safe | Direct sub-agent |
| 2 | ⚠️ Caution | Nested agent |
| 3+ | 🔴 Danger | Context thinning |

**At depth 2+:**
- Simplify tasks significantly
- Avoid further nesting
- Consider escalating to human

### 4. Parallel vs Sequential Decision

```typescript
// Check dependencies
const tasks = [
  { name: "A", files: ["src/a.ts"] },
  { name: "B", files: ["src/b.ts"], dependsOn: ["A"] }
];

// If no shared files AND no dependencies:
// → Launch in PARALLEL (single message, multiple Task calls)

// If shared files OR dependencies:
// → Launch SEQUENTIALLY (wait for each to complete)
```

## Post-Delegation Requirements

### After Task Returns (MANDATORY)

```typescript
// 1. Parse result for failure signals
const failureKeywords = ["error", "failed", "couldn't", "unable", "blocked", "partially", "skipped"];

// 2. Export cycle intelligence
export_cycle({
  outcome: detectedFailure ? "failure" : "success",
  findings: "Specific findings from agent work"
});

// 3. Verify independently
// - Run npx tsc --noEmit
// - Run npm test
// - Check git diff
```

## Delegation Quality Standards

**Follow these patterns for reliable delegation:**

### 1. Precise Task Descriptions

```typescript
// USE THIS PATTERN (GOOD)
Task({
  description: "Fix JWT validation in middleware.ts:45",
  prompt: `In src/auth/middleware.ts line 45, JWT validation throws on expired tokens. 
  Fix to call refreshToken() first.`
})

// NOT THIS - too vague
prompt: "Fix the auth system"
```

### 2. Verification After Completion

```typescript
// USE THIS PATTERN (GOOD)
// Agent says "done" → run verification → then accept
Task({...})
// After agent returns:
run npx tsc --noEmit
run npm test
git diff --name-only

// NOT THIS - accept without verification
Task({...}) // Agent says "done" → accept
```

### 3. Always Export Intelligence

```typescript
// USE THIS PATTERN (GOOD)
Task({...}) // Return received
export_cycle({ outcome: "success", findings: "What was done" })

// NOT THIS - lose intelligence
Task({...}) // Return accepted, move on without export
```

### 4. Shallow Delegation Depth

```typescript
// USE THIS PATTERN (GOOD) - Depth 1-2 max
You → Task(A)
You → Task(B) [parallel]

// NOT THIS - context thinning at depth 3+
You → Task(A) → Task(B) → Task(C)
```

## Command Usage

```bash
# Validate delegation plan
/hivemind-delegate

# Check current depth
/hivemind-delegate --depth

# Validate specific task
/hivemind-delegate --task="Fix auth middleware"
```

## Auto-Enforcement

**This command auto-parses and:**

1. **Validates context exists** - Checks scan_hierarchy ran
2. **Checks task specificity** - Ensures file paths provided
3. **Warns on depth** - Alerts at depth 2+
4. **Enforces export_cycle** - Won't complete without it

## Skill Loading

```typescript
skill({ name: "delegation-intelligence" })
skill({ name: "task-coordination-strategies" })
```

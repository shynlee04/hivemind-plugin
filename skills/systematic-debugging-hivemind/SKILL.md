# Skill: systematic-debugging-hivemind

## Overview

This skill provides the **systematic debugging methodology** specifically adapted for the HiveMind v3.0 Relational Cognitive Engine. It instructs agents on HOW to debug using HiveMind-specific commands and hooks.

## Core Principle

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

This skill DOES NOT execute code. It instructs the Agent on WHICH Commands to use and in WHAT sequence.

## When to Use

Activate this skill when:
- Test failures occur (`npm test` fails)
- LSP diagnostics publish errors
- Runtime errors in production
- Unexpected behavior in hooks or commands

## The Debugging Phases

### Phase 1: Evidence Gathering (Command: read, glob, grep)

**Step 1.1: Capture the Failure Signal**
```typescript
// Use hivemind_session to establish debug context
hivemind_session({
  action: "start",
  mode: "quick_fix",
  focus: "Debug [specific error]"
})
```

**Step 1.2: Read the Error Output**
- For test failures: Run `npm test` and capture full output
- For LSP errors: Read the diagnostic file
- For runtime errors: Capture stack trace

**Step 1.3: Identify the Scope**
```typescript
// Determine affected files via grep
grep({ include: "*.ts", pattern: "<error_keyword>" })
```

### Phase 2: Root Cause Investigation (Command: scan_hierarchy, recall_mems)

**Step 2.1: Check for Known Solutions**
```typescript
// Recall from memory
hivemind_memory({
  action: "recall",
  query: "[error pattern]",
  shelf: "solutions"
})

// Check anchors
hivemind_anchor({ action: "list" })
```

**Step 2.2: Analyze Context Drift**
```typescript
// Check if debugging is compromised by stale context
hivemind_inspect({ action: "drift" })
```

**Step 2.3: Trace the Data Flow**
- Identify where the bad value originates
- Trace up the call stack to find source
- Use `grep` to find all references

### Phase 3: Hypothesis Formation (Agent Reasoning)

**Step 3.1: State the Hypothesis**
```
"I believe [X] is the root cause because [Y evidence]"
```

**Step 3.2: Isolate the Problem**
- Create minimal reproduction
- Test in isolation

### Phase 4: Verification & Fix (Command: write, bash)

**Step 4.1: Create Failing Test First**
```bash
npm test -- --grep "<test_name>"
```

**Step 4.2: Apply Minimal Fix**
- ONE change at a time
- No "while I'm here" improvements

**Step 4.3: Verify**
```bash
npm test
npx tsc --noEmit
```

**Step 4.4: Save to Memory**
```typescript
hivemind_memory({
  action: "save",
  shelf: "solutions",
  content: "Root cause: [X], Fix: [Y]",
  tags: "debug,bugfix,[category]"
})
```

## HiveMind-Specific Debugging Patterns

### Pattern 1: Hook Debugging

When debugging hooks (`src/hooks/*.ts`):

1. **Check Hook Registration**
```typescript
// Read the hook index
read({ filePath: "src/hooks/index.ts" })
```

2. **Verify Event Binding**
```typescript
// Look for the hook registration pattern
grep({ include: "*.ts", pattern: "experimental\\..*\\.transform" })
```

3. **Test with Minimal Input**
```bash
# Trigger the hook manually
node bin/hivemind-tools.cjs session trace <timestamp>
```

### Pattern 2: Command Debugging

When debugging commands (`bin/hivemind-tools.cjs`):

1. **Verify Command Exists**
```bash
ls bin/
```

2. **Check Command Implementation**
```typescript
read({ filePath: "src/lib/[command].ts" })
```

3. **Test Command in Isolation**
```bash
node bin/hivemind-tools.cjs [command] --help
```

### Pattern 3: Session/State Debugging

When debugging state management:

1. **Inspect Current State**
```typescript
hivemind_inspect({ action: "scan" })
```

2. **Check Hierarchy Integrity**
```typescript
scan_hierarchy({ action: "status" })
```

3. **Review Recent Memory**
```typescript
hivemind_memory({ action: "recall", limit: 10 })
```

### Pattern 4: Test Suite Debugging

When debugging test failures:

1. **Run Single Test**
```bash
npm test -- --grep "<test_name>"
```

2. **Run in Watch Mode**
```bash
npm test -- --watch
```

3. **Check Test File Structure**
```typescript
glob({ pattern: "tests/**/*.test.ts" })
```

## Pre-Flight Checklist (BEFORE Output)

- [ ] Did I call `hivemind_session({ action: "start" })` first?
- [ ] Did I gather evidence before proposing fixes?
- [ ] Did I check memory for known solutions?
- [ ] Did I verify the hypothesis with minimal test?
- [ ] Did I save the solution to memory?

## Red Flags - STOP

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I think X is probably the cause"

**ALL of these mean: STOP. Return to Phase 1.**

## Related Skills

- `parallel-debugging-hivemind`: For concurrent hypothesis testing
- `debug-orchestration`: For orchestrating multiple debug agents
- `hivemind-governance`: For maintaining context during long debug sessions
- `evidence-discipline`: For verification requirements

## File References

- **Hook patterns**: `src/hooks/*.ts`
- **Command patterns**: `bin/hivemind-tools.cjs`, `src/lib/*.ts`
- **State patterns**: `.hivemind/state/`, `graph/*.json`
- **Test patterns**: `tests/**/*.test.ts`

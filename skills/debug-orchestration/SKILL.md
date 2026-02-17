# Skill: debug-orchestration

## Overview

This skill provides the **high-level orchestration framework** for debugging in HiveMind v3.0. It coordinates systematic debugging, parallel debugging, and event-driven LSP hooks into a unified workflow.

## Core Principle

```
DEBUGGING IS AN ORCHESTRATION, NOT A SEQUENCE
```

This skill instructs the Agent on HOW to orchestrate the entire debugging lifecycle using commands, skills, and agents.

## When to Use

Activate this skill when:
- Setting up automated debug responses to LSP/test events
- Orchestrating complex multi-phase debug sessions
- Managing debug workflows that span multiple sessions
- Building debug automation pipelines

## The Orchestration Framework

### Layer 1: Event Detection (The Strike)

**Trigger Sources:**
- LSP diagnostics (`lsp.diagnostics.publish`)
- Test failures (`npm test` fails)
- Runtime errors (caught by hooks)
- Manual invocation (`/debug` command)

**Step 1.1: Capture the Event**
```typescript
// Event hook triggers
"event": async (event) => {
  if (event.type === "lsp.diagnostics.publish") {
    // Extract diagnostic info
    const { file, errors } = event.data
    // Queue for investigation
  }
}
```

**Step 1.2: Classify the Event**
```typescript
const eventClassification = {
  severity: "error|warning|hint",
  category: "syntax|type|runtime|test",
  source: "lsp|test|manual",
  actionable: true | false
}
```

### Layer 2: Context Preservation (The Anchor)

**Step 2.1: Snapshot Current State**
```typescript
// Before debugging, preserve context
hivemind_session({
  action: "start",
  mode: "quick_fix",
  focus: "Debug: [event_summary]"
})

// Save current state
hivemind_anchor({
  action: "save",
  key: "pre_debug_state",
  value: JSON.stringify(stateSnapshot)
})
```

**Step 2.2: Establish Debug Boundary**
```typescript
// Mark where debugging starts
hivemind_memory({
  action: "save",
  shelf: "debug_sessions",
  content: `Debug session started: ${timestamp}`,
  tags: "debug,started"
})
```

### Layer 3: Strategy Selection

**Decision Tree:**

```
Is the issue reproducible?
├── YES → Is the root cause obvious?
│   ├── YES → Use systematic-debugging-hivemind
│   └── NO → Use parallel-debugging-hivemind
└── NO → Use systematic-debugging-hivemind + extended evidence gathering
```

**Step 3.1: Select Strategy**
```typescript
const strategy = selectDebugStrategy({
  reproducible: boolean,
  obvious: boolean,
  complexity: "low|medium|high",
  timeConstraint: "urgent|normal|exploratory"
})
```

### Layer 4: Execution

**Step 4.1: Inject Skills**
```typescript
// Based on strategy, inject appropriate skills
const skillsToInject = [
  "systematic-debugging-hivemind",  // Always
  // Plus based on strategy:
  "parallel-debugging-hivemind",     // If parallel selected
  "evidence-discipline"               // If verification critical
]
```

**Step 4.2: Execute Debug Loop**
```typescript
while (!resolved && attempts < maxAttempts) {
  // Gather evidence
  // Form hypothesis
  // Test hypothesis
  // Verify fix
  
  // If stuck:
  // Call hivemind_inspect({ action: "drift" })
  // If drift < 40: compact_session and continue
}
```

### Layer 5: Resolution

**Step 5.1: Verify Complete**
```typescript
// Run verification suite
await bash({ command: "npm test && npx tsc --noEmit" })

// Check no regressions
```

**Step 5.2: Document Solution**
```typescript
hivemind_memory({
  action: "save",
  shelf: "solutions",
  content: `
Root Cause: [X]
Symptoms: [Y]
Fix Applied: [Z]
Verification: [W]
  `,
  tags: "debug,resolved,[category]"
})
```

**Step 5.3: Cleanup**
```typescript
// Remove debug anchors
hivemind_anchor({ action: "delete", key: "pre_debug_state" })

// Export cycle
hivemind_cycle({ action: "export" })
```

## Event-Driven Debug Automation

### LSP Diagnostics Hook

```typescript
// In src/hooks/event-handler.ts
export const LSPDiagnosticsHook = {
  "event": async ({ event, client }) => {
    if (event.type !== "lsp.diagnostics.publish") return
    
    const diagnostics = event.data.diagnostics
    const errors = diagnostics.filter(d => d.severity === 1)
    
    if (errors.length > 0) {
      // Trigger debug orchestration
      await triggerDebugOrchestration({
        source: "lsp",
        errors,
        file: event.data.uri
      })
    }
  }
}
```

### Test Failure Hook

```typescript
// In src/hooks/event-handler.ts
export const TestFailureHook = {
  "event": async ({ event }) => {
    if (event.type !== "test.failed") return
    
    // Capture test output
    const testOutput = event.data.output
    
    // Trigger debug orchestration
    await triggerDebugOrchestration({
      source: "test",
      errors: parseTestFailures(testOutput),
      testFile: event.data.file
    })
  }
}
```

### Manual Debug Command

```typescript
// In commands/debug.ts
export const debugCommand = {
  name: "debug",
  description: "Trigger debug orchestration for a specific issue",
  
  async execute(args) {
    return triggerDebugOrchestration({
      source: "manual",
      issue: args.issue,
      context: args.context
    })
  }
}
```

## Debug Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     EVENT DETECTED                           │
│  (LSP error / Test failure / Manual trigger)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT PRESERVATION                        │
│  - Snapshot state via hivemind_anchor                       │
│  - Start debug session via hivemind_session                  │
│  - Create debug boundary in memory                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  STRATEGY SELECTION                          │
│  - Reproducible? Obvious?                                   │
│  - Select: systematic / parallel / extended                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXECUTION                               │
│  - Inject skills                                            │
│  - Debug loop: gather → hypothesize → test → verify         │
│  - Check drift, compact if needed                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESOLUTION                               │
│  - Verify fix                                               │
│  - Document solution                                        │
│  - Cleanup anchors                                          │
│  - Export cycle                                             │
└─────────────────────────────────────────────────────────────┘
```

## Pre-Flight Checklist (BEFORE Output)

- [ ] Did I establish debug session with hivemind_session?
- [ ] Did I preserve pre-debug state?
- [ ] Did I select appropriate strategy?
- [ ] Did I inject required skills?
- [ ] Did I execute verification before claiming success?
- [ ] Did I save solution to memory?
- [ ] Did I cleanup anchors?
- [ ] Did I call export_cycle?

## Constraints

1. **Never skip evidence gathering** - Always gather before fixing
2. **Never assume** - Verify each hypothesis
3. **Never ignore drift** - Check context integrity regularly
4. **Always document** - Save solutions to memory
5. **Always cleanup** - Remove debug artifacts

## Related Skills

- `systematic-debugging-hivemind`: Single-hypothesis debugging
- `parallel-debugging-hivemind`: Multi-hypothesis debugging
- `hivemind-governance`: Session and context management
- `evidence-discipline`: Verification requirements

## File References

- **Event hooks**: `src/hooks/event-handler.ts`
- **Swarm orchestration**: `src/lib/session-swarm.ts`
- **Debug commands**: `commands/debug.ts`
- **State management**: `src/lib/persistence.ts`

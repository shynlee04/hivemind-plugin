# OpenCode Debug Ecosystem - Comprehensive Implementation Guide

> **Status**: ACTIVE | **Version**: 1.0 | **Date**: 2026-02-17
> **Philosophy**: Trinity Architecture (Commands ↔ Skills ↔ Agents)
> **Tolerance**: ZERO for shallow thinking, overlapping responsibilities, context amnesia

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Trinity Architecture](#the-trinity-architecture)
3. [Skill Components](#skill-components)
4. [Command Components](#command-components)
5. [Agent Components](#agent-components)
6. [Event-Driven Automation](#event-driven-automation)
7. [LSP Hook Integration](#lsp-hook-integration)
8. [Usage Patterns](#usage-patterns)
9. [Anti-Patterns](#anti-patterns)
10. [Checklists](#checklists)
11. [File Reference](#file-reference)

---

## Executive Summary

This document defines the complete debugging ecosystem for HiveMind v3.0. It implements:

- **3 Skills**: systematic-debugging-hivemind, parallel-debugging-hivemind, debug-orchestration
- **2 Commands**: hivemind-debug-trigger, hivemind-debug-verify
- **1 Agent**: debug (orchestrator)
- **Event Hooks**: LSP diagnostics, test failures, runtime errors

The ecosystem follows strict Trinity Architecture: **Commands** (actuators) do NOT think, **Skills** (methodologies) do NOT execute, **Agents** (orchestrators) delegate to both.

---

## The Trinity Architecture

### Conceptual Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT (The "Who")                       │
│   Orchestrates, maintains state, delegates to commands          │
│   MUST NOT: Execute low-level bash/write directly               │
│   MUST: Use hivemind_session, hivemind_memory, commands        │
└────────────────────────────┬────────────────────────────────────┘
                             │ delegates to
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SKILL (The "How")                          │
│   Injects methodology, workflows, checklists                   │
│   MUST NOT: Run code, call commands                            │
│   MUST: Instruct agent on sequence of commands to use           │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMMAND (The "What")                        │
│   Atomic, stateless, deterministic execution                   │
│   MUST: Return JSON { status, message, data }                  │
│   MUST NOT: Cognitive thinking, unstructured output            │
└─────────────────────────────────────────────────────────────────┘
```

### HC5 Compliance

All Commands MUST return deterministic JSON:

```typescript
// ✅ VALID
{ "status": "success", "message": "...", "entity_id": "uuid", "data": {} }

// ❌ INVALID
"Error: Something went wrong. Please try again." // Raw string
{ "error": "Failed" } // Missing required fields
```

---

## Skill Components

### 1. systematic-debugging-hivemind

**Purpose**: Single-hypothesis debugging methodology

**Location**: `skills/systematic-debugging-hivemind/SKILL.md`

**When to Load**:
- Single error with clear symptoms
- Root cause seems obvious
- Time-constrained debugging

**Workflow**:
```
Phase 1: Evidence Gathering
  → Use read, glob, grep commands
  → Capture error output
  
Phase 2: Root Cause Investigation  
  → Use scan_hierarchy, recall_mems
  → Check memory for known solutions
  → Trace data flow
  
Phase 3: Hypothesis Formation
  → State hypothesis clearly
  → "I believe X is cause because Y"
  
Phase 4: Verification & Fix
  → Create failing test first
  → Apply ONE minimal fix
  → Verify with npm test + tsc
  → Save solution to memory
```

**Key Constraints**:
- NO fixes without root cause investigation first
- ONE change at a time
- MUST verify before claiming success

### 2. parallel-debugging-hivemind

**Purpose**: Multi-hypothesis concurrent testing

**Location**: `skills/parallel-debugging-hivemind/SKILL.md`

**When to Load**:
- Multiple plausible root causes
- Single-threaded too slow
- Non-deterministic/timing bugs

**Workflow**:
```
Phase 1: Enumerate Hypotheses
  → List 2-5 possible causes
  → Rank by likelihood
  
Phase 2: Prepare Swarm Agents
  → Each agent tests ONE hypothesis
  → Clear success/failure criteria
  
Phase 3: Execute Parallel Testing
  → Spawn headless researchers
  → Monitor via hivemind_inspect
  → Collect via hivemind_cycle
  
Phase 4: Synthesize Results
  → Analyze all findings
  → Determine confirmed hypothesis
  → Implement fix
```

**Key Constraints**:
- MAX 5 parallel agents
- Each must report via export_cycle
- If none confirmed after 3 cycles → STOP

### 3. debug-orchestration

**Purpose**: High-level workflow coordination

**Location**: `skills/debug-orchestration/SKILL.md`

**When to Load**:
- Event-driven debugging automation
- Complex multi-phase sessions
- Building debug pipelines

**Workflow**:
```
Layer 1: Event Detection
  → LSP diagnostics / test failures / runtime errors
  → Classify severity and category
  
Layer 2: Context Preservation  
  → Snapshot state via hivemind_anchor
  → Start debug session
  
Layer 3: Strategy Selection
  → Reproducible? Obvious? → Select systematic/parallel/extended
  
Layer 4: Execution
  → Inject appropriate skills
  → Debug loop with drift checking
  
Layer 5: Resolution
  → Verify complete
  → Document solution
  → Cleanup anchors
```

---

## Command Components

### 1. hivemind-debug-trigger

**Purpose**: Create debug session from error/event

**Location**: `.kilocode/commands/hivemind-debug-trigger.md`

**Input**:
```json
{
  "source": "lsp|test|runtime|manual",
  "errors": [{ "message": "", "file": "", "line": 0, "severity": "error" }],
  "context": "optional string"
}
```

**Output** (Deterministic JSON):
```json
{
  "status": "success",
  "debug_session_id": "uuid",
  "errors_count": 3,
  "severity_breakdown": { "error": 2, "warning": 1, "hint": 0 },
  "next_action": "investigate",
  "recommended_strategy": "systematic-debugging-hivemind"
}
```

**Does NOT**: Investigate, analyze, fix

### 2. hivemind-debug-verify

**Purpose**: Verify fix is complete

**Location**: `.kilocode/commands/hivemind-debug-verify.md`

**Input**:
```json
{
  "fix_summary": "what was fixed",
  "verification_level": "standard|thorough"
}
```

**Output** (Deterministic JSON):
```json
{
  "status": "success",
  "verification_passed": true,
  "tests": { "passed": 34, "failed": 0, "total": 34 },
  "type_check": "passed",
  "regressions": [],
  "session_status": "healthy"
}
```

**Does NOT**: Apply fixes, investigate

---

## Agent Components

### debug Agent

**Purpose**: Orchestrate debugging workflow

**Location**: `.kilocode/agents/debug.md`

**Core Directives**:
1. Never fix without root cause
2. Orchestrate, don't monologue
3. Preserve context (anchors, memory)
4. Verify everything
5. Document solutions

**Mandatory First Steps**:
```typescript
// 1. Create session
hivemind_session({ action: "start", mode: "quick_fix", focus: "Debug X" })

// 2. Preserve state
hivemind_anchor({ action: "save", key: `debug_pre_${timestamp}`, value: ... })

// 3. Check memory
hivemind_memory({ action: "recall", query: "[error pattern]" })
```

**Strategy Selection**:

| Condition | Strategy |
|-----------|----------|
| Single error, obvious | systematic-debugging-hivemind |
| Multiple causes | parallel-debugging-hivemind |
| Event-triggered | debug-orchestration |

---

## Event-Driven Automation

### LSP Diagnostics Hook

```typescript
// In src/hooks/event-handler.ts
"event": async ({ event }) => {
  if (event.type !== "lsp.diagnostics.publish") return
  
  const errors = event.data.diagnostics.filter(d => d.severity === 1)
  
  if (errors.length > 0) {
    // Trigger via command
    await executeCommand("hivemind-debug-trigger", {
      source: "lsp",
      errors: errors.map(e => ({
        message: e.message,
        file: e.uri,
        line: e.range.start.line,
        severity: "error"
      }))
    })
  }
}
```

### Test Failure Hook

```typescript
"event": async ({ event }) => {
  if (event.type !== "test.failed") return
  
  await executeCommand("hivemind-debug-trigger", {
    source: "test",
    errors: parseTestFailures(event.data.output),
    context: event.data.testName
  })
}
```

---

## Usage Patterns

### Pattern 1: Manual Debug Invocation

```typescript
// User notices an issue
// Trigger debug session
await executeCommand("hivemind-debug-trigger", {
  source: "manual",
  errors: [{ message: "Issue description", severity: "error" }]
})

// Agent loads systematic-debugging-hivemind
// Investigates
// Verifies

// Agent verifies
await executeCommand("hivemind-debug-verify", {
  fix_summary: "Fixed X",
  verification_level: "standard"
})
```

### Pattern 2: Event-Triggered Debug

```
LSP error detected
  ↓
Event hook fires
  ↓
hivemind-debug-trigger executes
  ↓
Debug session created
  ↓
debug agent loaded with debug-orchestration
  ↓
Investigation + Fix + Verification
  ↓
Memory saved, anchors cleaned
```

### Pattern 3: Parallel Investigation

```
Multiple hypotheses identified
  ↓
Load parallel-debugging-hivemind skill
  ↓
Spawn 3 swarm agents (one per hypothesis)
  ↓
Each tests in parallel
  ↓
Results collected via hivemind_cycle
  ↓
Winner synthesized
  ↓
Fix applied + verified
```

---

## Anti-Patterns

### ❌ The "Blind Cowboy" Write

```typescript
// BAD: Agent writes code without investigation
write({ filePath: "src/utils.ts", content: "..." })
```

**Correction**: Always investigate first with read/grep/glob

### ❌ The "God Tool"

```typescript
// BAD: Single function that reads, parses, writes, commits
function fixAllTheThings() {
  const content = readFile(...)
  const fixed = parseAndFix(content)
  writeFile(...)
  gitCommit(...)
}
```

**Correction**: Break into read → analyze → write → commit Commands, orchestrated by Agent

### ❌ State Hijacking

```typescript
// BAD: Writing directly to brain.json
fs.writeFileSync(".hivemind/state/brain.json", JSON.stringify(newState))
```

**Correction**: Use createStateManager() or graph-io.ts functions

### ❌ Subagent Ghosting

```typescript
// BAD: Ignoring subagent failure
const result = await subagent.run(...)
// No check, no export_cycle
```

**Correction**: MUST call hivemind_cycle({ action: "export" }) after every subagent

### ❌ Context Pollution

```typescript
// BAD: Dumping 10k lines of logs into prompt
system: "Here is the error: " + massiveLogOutput
```

**Correction**: Use Command to filter/summarize, or delegate to headless Swarm

---

## Checklists

### Pre-Debug Session Start

- [ ] Call hivemind_session({ action: "start" })
- [ ] Preserve pre-debug state via hivemind_anchor
- [ ] Check memory for known solutions
- [ ] Define clear success criteria

### During Investigation

- [ ] Gather evidence BEFORE proposing fixes
- [ ] One hypothesis at a time (systematic) OR parallel agents (parallel)
- [ ] Check drift score regularly
- [ ] Update session context if drift >= 40

### Post-Fix Verification

- [ ] Run npm test → must pass
- [ ] Run npx tsc --noEmit → must pass
- [ ] Check for regressions
- [ ] Verify no guard violations (if thorough)

### Session Closure

- [ ] Save solution to memory via hivemind_memory
- [ ] Cleanup debug anchors
- [ ] Call hivemind_cycle({ action: "export" })

---

## File Reference

### Skills (Methodologies)

| File | Purpose |
|------|---------|
| `skills/systematic-debugging-hivemind/SKILL.md` | Single-hypothesis methodology |
| `skills/parallel-debugging-hivemind/SKILL.md` | Multi-hypothesis methodology |
| `skills/debug-orchestration/SKILL.md` | High-level orchestration |

### Commands (Actuators)

| File | Purpose |
|------|---------|
| `.kilocode/commands/hivemind-debug-trigger.md` | Create debug session |
| `.kilocode/commands/hivemind-debug-verify.md` | Verify fix completeness |

### Agents (Orchestrators)

| File | Purpose |
|------|---------|
| `.kilocode/agents/debug.md` | Debug workflow orchestrator |

### Integration Points

| File | Purpose |
|------|---------|
| `src/hooks/event-handler.ts` | Event hook registration |
| `src/lib/session-swarm.ts` | Headless researcher spawning |
| `src/lib/persistence.ts` | State management |

---

## The Meta-Directive Compliance

This ecosystem adheres to:

1. **Trinity Architecture**: Clear separation of Commands ↔ Skills ↔ Agents
2. **HC5 Compliance**: All commands return deterministic JSON
3. **Read-Before-Write**: Investigation always precedes fixes
4. **State Safety**: File locking for concurrent access
5. **Traceability**: session_id passed through graph nodes
6. **Cross-Compatible**: Uses LSP events, not language-specific ASTs
7. **No Shallow Thinking**: Mandatory checklists enforce rigor

---

## Quick Start

### For Users

1. **When error occurs**: Type `/debug` or wait for automatic trigger
2. **Debug agent activates**: Loads appropriate skill
3. **Investigation runs**: Follows systematic or parallel workflow
4. **Fix applied**: Verified via command
5. **Solution saved**: To memory for future reference

### For Developers

1. **Create new skill** → Follow `skills/*/SKILL.md` pattern
2. **Create new command** → Follow `.kilocode/commands/*.md` pattern
3. **Create new agent** → Follow `.kilocode/agents/*.md` pattern
4. **Integrate event** → Add to `src/hooks/event-handler.ts`

---

**END OF DEBUG ECOSYSTEM GUIDE**

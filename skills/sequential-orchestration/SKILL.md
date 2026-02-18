---
name: "sequential-orchestration"
description: "Safer delegation with sequential task execution, result awaiting, retuning, and boundary enforcement. Ensures unbroken hierarchy chains before any action. Context-first, never act without verified planning."
license: MIT
compatibility: opencode
triggers:
  - "Before delegating tasks to subagents"
  - "When planning multi-step implementation"
  - "After receiving task requirements"
  - "When deciding parallel vs sequential execution"
version: "1.0.0"
metadata:
  audience: orchestrators
  workflow: delegation,coordination
  priority: critical
---

# Sequential Orchestration Skill

## Core Philosophy

**SEQUENTIAL IS SAFER.** Always prefer sequential over parallel unless:
1. Tasks have ZERO file/state overlap
2. Tasks have ZERO dependency on each other's output
3. Failure of one task does not affect others

## The Absolute Gatekeeping Factor

Before ANY action, these conditions MUST be verified:

### 1. Parent Hierarchy Exists (UNBROKEN LINK)
```typescript
// NEVER act without checking hierarchy
const hierarchy = scan_hierarchy({ action: "status" })
if (!hierarchy.trajectory) {
  // STOP - Must declare_intent first
  throw new Error("NO ACTION WITHOUT TRAJECTORY")
}
```

### 2. Context Is Pure
```typescript
// NEVER trust memory after compaction
const drift = think_back({ mode: "check" })
if (drift.score < 40) {
  // STOP - Context corrupted, must reload
  throw new Error("CONTEXT IMPURE - RELOAD REQUIRED")
}
```

### 3. Planning Is Retrieved
```typescript
// NEVER act without verified planning
const plan = recall_mems({ query: "plan" })
if (!plan || plan.length === 0) {
  // STOP - No planning found
  throw new Error("NO ACT WITHOUT SUCCESS RETRIEVAL OF PLANNING")
}
```

## Sequential Delegation Protocol

### Step 1: Pre-Delegation Gate
```
┌─────────────────────────────────────────┐
│  GATE CHECK BEFORE ANY DELEGATION        │
├─────────────────────────────────────────┤
│  [ ] Trajectory exists?                  │
│  [ ] Current tactic defined?             │
│  [ ] Parent node is not stale (>2hr)?    │
│  [ ] No pending failures in brain?       │
│  [ ] Anchors loaded for constraints?     │
└─────────────────────────────────────────┘
```

If ANY check fails → STOP, fix before proceeding.

### Step 2: Delegate with Explicit Return Format
```typescript
// SEQUENTIAL: Await result, retune based on outcome
const result = await task({
  description: "Clear task description",
  prompt: `
    ## Task: [Specific task]
    
    ## Domain: [Which domain - Backend/Frontend/Shared]
    
    ## Boundaries:
    - DO NOT touch: [files/modules outside domain]
    - MUST verify: [quality gates before return]
    
    ## Return Format:
    {
      "outcome": "success" | "partial" | "failure",
      "files_changed": [...],
      "findings": "...",
      "next_recommended": "..." | null
    }
  `,
  subagent_type: "build" // or appropriate agent
})

// AWAIT the result, do not fire-and-forget
```

### Step 3: Result Processing & Retuning
```typescript
// PROCESS result before continuing
if (result.outcome === "success") {
  // Capture intelligence
  export_cycle({
    outcome: "success",
    findings: result.findings
  })
  
  // Update hierarchy
  map_context({ level: "action", content: result.findings })
  
  // PROCEED to next task
} else if (result.outcome === "partial") {
  // RETUNE: Adjust plan based on partial success
  save_mem({
    shelf: "partial_progress",
    content: result.findings,
    tags: "needs-followup"
  })
  
  // REROUTE: Decide next action
  if (result.next_recommended) {
    // Follow agent recommendation
  } else {
    // Ask user for guidance
  }
} else if (result.outcome === "failure") {
  // STOP: Do not continue
  // SAVE state for recovery
  save_anchor({
    key: `failure_${Date.now()}`,
    value: JSON.stringify(result)
  })
  
  // ESCALATE to user
  throw new Error(`DELEGATION FAILED: ${result.findings}`)
}
```

### Step 4: Boundary Enforcement
```typescript
// BEFORE each delegation, verify domain boundaries
const DOMAIN_BOUNDARIES = {
  backend: {
    allowed: ["src/lib/", "src/tools/", "src/schemas/", "src/hooks/"],
    forbidden: ["dashboard/", "views/", "components/"]
  },
  frontend: {
    allowed: ["src/dashboard/", "src/views/", "src/components/"],
    forbidden: ["src/lib/", "src/tools/", "src/schemas/"]
  },
  shared: {
    allowed: ["src/types/", "src/utils/", "tests/"],
    forbidden: []
  }
}

function checkBoundary(file: string, domain: string): boolean {
  const boundary = DOMAIN_BOUNDARIES[domain]
  const isAllowed = boundary.allowed.some(p => file.startsWith(p))
  const isForbidden = boundary.forbidden.some(p => file.startsWith(p))
  return isAllowed && !isForbidden
}
```

## The Unbroken Link Principle

A hierarchy chain is UNBROKEN when:
1. Trajectory → Tactic → Action all exist
2. Each child has a valid parent reference
3. Timestamps show reasonable progression (< 2hr gaps)
4. Cursor position matches actual work focus

```typescript
// CHECK unbroken link before action
function isChainUnbroken(): boolean {
  const ancestors = getAncestors(cursor)
  const expected = ['trajectory', 'tactic', 'action']
  
  // All three levels must be present
  if (ancestors.length < 3) return false
  
  // Each level must have valid content
  return ancestors.every(node => node.content && node.content.length > 0)
}

// IF chain broken → STOP, use map_context to repair
if (!isChainUnbroken()) {
  console.error("CHAIN BROKEN - Cannot proceed")
  // Use think_back to recover context
  // Use map_context to re-establish chain
}
```

## Hierarchical Actions Protocol

### Level 1: Trajectory (Strategic Goal)
- Set via `declare_intent({ mode, focus })`
- Must exist before ANY tactical work
- Survives compaction (stored in hierarchy.json)

### Level 2: Tactic (Implementation Strategy)
- Set via `map_context({ level: "tactic", content })`
- Must have parent trajectory
- Groups related actions

### Level 3: Action (Specific Task)
- Set via `map_context({ level: "action", content })`
- Must have parent tactic
- Represents atomic work unit

## Context-First Protocol

**NEVER ACT WITHOUT:**

1. **Context Loaded:**
```typescript
scan_hierarchy({ action: "status" })
recall_mems({ query: "relevant context" })
```

2. **Constraints Known:**
```typescript
list_anchors() // Get immutable constraints
```

3. **Plan Verified:**
```typescript
// The plan must be retrieved from memory or anchors
// NOT assumed from "I think I remember..."
const plan = recall_mems({ query: "plan trajectory" })
```

4. **Chain Validated:**
```typescript
const breaks = detectChainBreaks()
if (breaks.length > 0) {
  // STOP - Chain is broken
}
```

## Red Flags - STOP Immediately

| Condition | Action |
|-----------|--------|
| No trajectory | `declare_intent` first |
| Chain broken | `map_context` to repair |
| Drift > 60 | `think_back` to recover |
| No plan in memory | Create plan before acting |
| Domain boundary violation | Reroute to correct domain |
| Pending failure unacknowledged | Acknowledge and resolve |

## Quick Reference Commands

```typescript
// Gate check
scan_hierarchy({ action: "status" })

// Context recovery
think_back({ mode: "full" })

// Chain repair
map_context({ level: "tactic", content: "..." })

// Boundary check
grep({ pattern: file, include: allowedPatterns })

// Result capture
export_cycle({ outcome, findings })
```

## Related Skills

- **delegation-intelligence**: Decision patterns for parallel vs sequential
- **evidence-discipline**: Verification requirements for claims
- **context-integrity**: Context recovery and chain repair
- **session-lifecycle**: Session state management

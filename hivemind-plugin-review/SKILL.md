---
name: hivemind-plugin-review
description: Use when reviewing, auditing, or analyzing the hivemind-plugin codebase for context governance patterns, tool-hook integration, edge cases, and stress testing
---

# hivemind-plugin Codebase Review

## Overview

This skill provides a comprehensive framework for reviewing the hivemind-plugin codebase - an OpenCode plugin for AI session context governance (v2.6.0). The plugin implements sophisticated governance patterns with tools, hooks, and state management.

## Project Architecture

### Directory Structure

```
src/
├── cli.ts, index.ts      # Entry points
├── cli/                  # CLI commands
│   ├── init.ts
│   └── interactive-init.ts
├── lib/                  # Core utilities (23 files)
│   ├── persistence.ts    # BrainState, Hierarchy management
│   ├── hierarchy-tree.ts # Decision tree structure
│   ├── mems.ts           # Memory shelf system
│   ├── toast-throttle.ts # Rate limiting
│   └── [18 more]
├── hooks/                # Lifecycle hooks (6 files)
│   ├── tool-gate.ts      # Tool execution gating
│   ├── session-lifecycle.ts
│   ├── compaction.ts     # Session compaction
│   ├── soft-governance.ts
│   └── event-handler.ts
├── tools/                # Governance tools (14+ tools)
│   ├── declare-intent.ts
│   ├── map-context.ts
│   ├── compact-session.ts
│   └── [11 more]
├── schemas/              # TypeScript schemas
└── types/                # Type definitions
```

### Key Concepts

1. **Governance Modes**: `strict` | `assisted` | `permissive`
2. **Tools**: Idempotent commands for session management
3. **Hooks**: Interception points for tool execution, events
4. **BrainState**: Machine state in `.hivemind/brain.json`
5. **Hierarchy**: Decision tree in `.hivemind/hierarchy.json`

## Review Framework

### Phase 1: Architecture Analysis

**Checkpoints:**
- [ ] Tool-Hook integration: How do tools register with hooks?
- [ ] State persistence: Are there race conditions in read/write?
- [ ] Error propagation: How do errors cascade through hooks?
- [ ] Idempotency: Can tools be safely called multiple times?

**Key Files to Analyze:**
- `src/hooks/index.ts` - Hook registration
- `src/tools/index.ts` - Tool exports
- `src/lib/persistence.ts` - State management

### Phase 2: Integration Analysis

**Cross-Cutting Concerns:**

| Area | Files to Check | What to Verify |
|------|----------------|----------------|
| Tool Lifecycle | `tool-gate.ts`, individual tools | Gate logic before/after execution |
| Session Flow | `session-lifecycle.ts`, `compaction.ts` | State transitions |
| Memory | `mems.ts`, `save-mem.ts`, `recall_mems.ts` | Shelf consistency |
| Hierarchy | `hierarchy-tree.ts`, `scan-hierarchy.ts` | Tree integrity |

**Integration Patterns:**

```typescript
// Tool-Hook Flow
1. User calls tool (e.g., declare_intent)
2. tool-gate.ts intercepts (pre-execution)
3. Tool executes, modifies BrainState
4. Hooks may react (post-execution)
5. State persisted to brain.json

// Edge Cases to Detect:
// - What if brain.json is corrupted?
// - What if two tools execute concurrently?
// - What if hook throws mid-pipeline?
```

### Phase 3: Edge Case Detection

**Critical Edge Cases:**

1. **Concurrent Tool Execution**
   - Two `declare_intent` calls simultaneously
   - State file locking behavior
   - Race conditions in persistence

2. **Corrupted State Files**
   - Invalid JSON in brain.json
   - Missing required fields
   - Schema version mismatches

3. **Hook Failure Scenarios**
   - Tool gate throws - is tool blocked?
   - Multiple hooks fail - which takes precedence?
   - Async hook timeout handling

4. **Governance Mode Transitions**
   - strict → assisted: What breaks?
   - assisted → permissive: What becomes allowed?
   - Mode stored where? Runtime override?

5. **Long Session Accumulation**
   - When does hierarchy grow unbounded?
   - Compaction triggers - are they correct?
   - Memory shelf overflow

### Phase 4: Stress Testing Patterns

**Scenarios to Simulate:**

| Scenario | Setup | Expected Behavior |
|----------|-------|------------------|
| Rapid tool calls | 10 declare_intent in 1s | Should queue/Throttle |
| Corrupted brain.json | Manual corruption | Graceful recovery |
| Missing .hivemind/ | Delete directory | Auto-initialize? |
| Hook recursion | Tool triggers hook triggers tool | Infinite loop prevention |
| Large hierarchy | 1000+ nodes | Performance degradation? |

### Phase 5: Security Review

**Checkpoints:**
- [ ] Path traversal in `.hivemind/` operations
- [ ] Input sanitization in tool parameters
- [ ] File permission on state files
- [ ] Secrets in logs?

## Common Issues in This Codebase

Based on the architecture, likely issue areas:

1. **Duplicate Logic**: Check `src/lib/` for similar patterns:
   - Path normalization (paths.ts vs persistence.ts)
   - JSON parsing (multiple files?)
   - Error formatting

2. **Hook Order**: In `tool-gate.ts`, verify:
   - Pre-execution hooks run before tool
   - Post-execution hooks run after tool
   - Error hooks run on failure

3. **State Consistency**:
   - BrainState + Hierarchy sync
   - Session files + brain.json sync

4. **Tool Idempotency**:
   - `declare_intent` called twice - same result?
   - `map_context` updates vs appends

## Review Output Template

```markdown
## Code Review: hivemind-plugin

### Architecture Score: X/10
### Integration Score: X/10  
### Edge Case Coverage: X/10
### Stress Test Readiness: X/10

### Critical Issues
1. [Issue Title]
   - Location: file:line
   - Severity: Critical/High/Medium
   - Description: ...
   - Recommendation: ...

### Medium Issues
...

### Recommendations Summary
...
```

## References

- **Governance Modes**: Defined in schemas/config.ts
- **Tool Schema**: Each tool exports `createXTool(dir)` factory
- **Hook Interface**: See hooks/index.ts for hook types
- **State Schema**: See schemas/brain-state.ts

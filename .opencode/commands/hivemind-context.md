---
name: "hivemind-context"
description: "Enforce context-before-actions discipline. Validates investigation completed before any file modifications. Use at start of work and before writes."
---

# HiveMind Context-First Enforcer

**⛔ CRITICAL: Investigation MUST precede action.**

## Context-First Protocol

### Phase 1: Investigation (MANDATORY)

**Before ANY write/edit operations:**

```typescript
// 1. Brownfield scan
scan_hierarchy({ action: "analyze" })

// 2. Check for stale context
// Look for:
// - "timestamp_gap" signals
// - "framework_conflict" warnings
// - "poisoned_context" flags

// 3. Recall relevant memories
recall_mems({ query: "[what you're about to work on]" })

// 4. Load relevant anchors
save_anchor({ mode: "list" })
```

### Phase 2: Codebase Exploration (MANDATORY)

**Find all relevant files:**

```typescript
// A. File discovery
glob({ pattern: "**/*[keyword]*.{ts,js,md}" })

// B. Content search
grep({ pattern: "[function|class|pattern name]" })

// C. Deep read (for complex tasks)
Task({
  subagent_type: "scanner",
  description: "Deep investigation of [area]",
  prompt: "Read and analyze all files related to [topic]. Report patterns, relationships, and potential impact areas."
})
```

### Phase 3: Understanding (MANDATORY)

**Before modifying:**

```typescript
// Read specific files with context
read({ filePath: "/absolute/path/to/file.ts" })
read({ filePath: "/absolute/path/to/related.ts" })

// Check patterns in similar files
grep({ pattern: "similar pattern", include: "*.ts" })
```

## Context Violation Detection

**Auto-detected violations:**

| Violation | Detection | Consequence |
|-----------|-----------|-------------|
| Write without read | `write_without_read_count` | Warning + required justification |
| Edit without context | No prior reads in session | Block + require investigation |
| Skip brownfield scan | No scan_hierarchy call | Warning + auto-trigger scan |
| Ignore memories | `recall_mems` not called | Suggest memory check |

## Evidence Requirements

**Before claiming "context acquired":**

```markdown
## Context Evidence

### Investigation Performed
- [ ] scan_hierarchy({ action: "analyze" }) - Result: [summary]
- [ ] recall_mems({ query: "..." }) - Found: [count] relevant
- [ ] Files discovered: [list]
- [ ] Key files read: [list]

### Patterns Identified
- Pattern 1: [description]
- Pattern 2: [description]

### Impact Analysis
- Files affected: [list]
- Dependencies: [list]
- Risks: [list]
```

## Brownfield Protocol

**For existing projects (ALWAYS):**

```typescript
// 1. Run brownfield scan
scan_hierarchy({ action: "analyze", json: true })

// 2. Check recommendations
scan_hierarchy({ action: "recommend" })

// 3. Establish baseline
scan_hierarchy({ action: "orchestrate", json: true })

// 4. Set intent
declare_intent({ mode: "plan_driven", focus: "[specific work]" })
map_context({ level: "tactic", content: "[specific approach]" })
```

## Context-Before-Actions Checklist

**Tick before each write/edit:**

- [ ] Relevant files read
- [ ] Patterns understood
- [ ] Edge cases identified
- [ ] Similar implementations found
- [ ] Impact assessed
- [ ] Brownfield scan completed (if applicable)

## Command Usage

```bash
# Validate context acquired
/hivemind-context

# Force brownfield protocol
/hivemind-context --brownfield

# Check context violations
/hivemind-context --violations

# Before specific write
/hivemind-context --before-write="src/file.ts"
```

## Integration with Session Lifecycle

**This command integrates with:**

1. **session-lifecycle.ts** - Tracks reads vs writes
2. **soft-governance.ts** - Detects violations
3. **tool-gate.ts** - Blocks writes without context

**Auto-triggers:**
- On first write attempt → Check context exists
- After 10 turns without scan → Warn about drift
- When drift > 70 → Require scan_hierarchy

## Enforcement Levels

| Level | Trigger | Action |
|-------|---------|--------|
| Advisory | First violation | Warning in prompt |
| Warning | 2+ violations | Required justification |
| Blocked | 3+ violations | Cannot write without scan |

## Skill Loading

```typescript
skill({ name: "context-integrity" })
skill({ name: "evidence-discipline" })
```

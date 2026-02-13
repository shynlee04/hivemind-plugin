# Plan: Google Jules Review of hivemind-plugin

**Date:** 2026-02-13
**Executor:** Google Jules (Gemini 2.5 Pro)
**Target:** hivemind-plugin codebase review

---

## Objective

Conduct a comprehensive review of the hivemind-plugin codebase focusing on:
1. Architecture integrity
2. Tool-hook integration patterns
3. Edge cases and stress test scenarios
4. Use case validation
5. Real-world survival capability

---

## Phase 1: Discovery & Context Gathering

### 1.1 Load Required Context

Before reviewing, Jules MUST load:
- [ ] `hivemind-plugin-review/SKILL.md` - Review framework
- [ ] `AGENTS.md` - Build/test commands and conventions
- [ ] `src/schemas/brain-state.ts` - State schema
- [ ] `src/schemas/config.ts` - Governance config
- [ ] `src/hooks/index.ts` - Hook interface definitions
- [ ] `src/tools/index.ts` - Tool exports

### 1.2 Understand Core Concepts

| Concept | Source | What to Learn |
|---------|--------|---------------|
| Governance Modes | `schemas/config.ts` | strict/assisted/permissive semantics |
| Tool Lifecycle | `hooks/tool-gate.ts` | Pre/post execution flow |
| State Structure | `lib/persistence.ts` | brain.json, hierarchy.json |
| Memory System | `lib/mems.ts`, `tools/save-mem.ts` | Shelf system |
| Hierarchy Tree | `lib/hierarchy-tree.ts` | Decision tree structure |

---

## Phase 2: Architecture Analysis

### 2.1 Map the Tool-Hook Pipeline

**Examine in order:**
1. `src/hooks/tool-gate.ts` - Gate registration and execution
2. `src/hooks/index.ts` - Hook types and registration
3. `src/tools/declare-intent.ts` - Example tool implementation
4. `src/index.ts` - Plugin initialization

**Questions to Answer:**
- [ ] How do tools register with hooks?
- [ ] What's the execution order (pre → tool → post)?
- [ ] What happens if a pre-hook throws?
- [ ] Can hooks modify tool input/output?

### 2.2 Analyze State Management

**Files to analyze:**
- `src/lib/persistence.ts` - Read/write operations
- `src/lib/anchors.ts` - Anchor persistence
- `src/schemas/brain-state.ts` - State schema

**Questions:**
- [ ] Is there file locking for concurrent access?
- [ ] What happens if brain.json is corrupted?
- [ ] How is schema migration handled?
- [ ] Are there race conditions in read-modify-write?

### 2.3 Review Each Hook

| Hook | File | Purpose | Review Focus |
|------|------|---------|--------------|
| tool-gate | `tool-gate.ts` | Pre/post execution | Gate logic correctness |
| session-lifecycle | `session-lifecycle.ts` | Session events | State transitions |
| compaction | `compaction.ts` | Session cleanup | What gets compacted? |
| soft-governance | `soft-governance.ts` | Guidance | How is guidance triggered? |
| event-handler | `event-handler.ts` | Event processing | Event flow |

---

## Phase 3: Integration Analysis

### 3.1 Cross-Cutting Concerns

**Trace each major flow:**

```
User Input → Tool → Tool-Gate (pre) → Execution → Persistence → Tool-Gate (post) → Response
```

**For each tool, trace:**
1. What hooks intercept it?
2. What state does it modify?
3. What side effects occur?
4. Is it idempotent?

### 3.2 Tool Inventory

| Tool | File | State Changes | Hooks |
|------|------|---------------|-------|
| declare_intent | `tools/declare-intent.ts` | brain.json, hierarchy | ? |
| map_context | `tools/map-context.ts` | hierarchy.json | ? |
| compact_session | `tools/compact-session.ts` | session files | ? |
| save_mem | `tools/save-mem.ts` | mems brain | ? |
| recall_mems | `tools/recall-mems.ts` | read only | ? |
| check_drift | `tools/check-drift.ts` | read only | ? |
| self_rate | `tools/self-rate.ts` | brain.json | ? |

### 3.3 Dependency Analysis

**Check for:**
- Circular dependencies between lib modules
- Duplicate functionality in lib/
- Inconsistent error handling patterns
- Missing error boundaries

---

## Phase 4: Edge Case Detection

### 4.1 Critical Edge Cases to Investigate

| Scenario | How to Test | Where to Look |
|----------|-------------|---------------|
| Concurrent tool calls | Simulate 2 tools running | `persistence.ts` locking |
| Corrupted brain.json | Corrupt file manually | `persistence.ts` validation |
| Missing .hivemind/ | Delete directory | `persistence.ts` initialization |
| Hook recursion | Tool triggers hook triggers tool | `tool-gate.ts` recursion guard |
| Large hierarchy | Add 1000+ nodes | `hierarchy-tree.ts` performance |
| Invalid governance mode | Set invalid mode | `schemas/config.ts` validation |

### 4.2 Failure Mode Analysis

**For each component, answer:**
- What happens on failure?
- Is there error recovery?
- Are errors logged appropriately?
- Do errors propagate correctly?

### 4.3 Stress Scenarios

```bash
# Test 1: Rapid tool calls
for i in {1..10}; do
  echo '{"name":"declare_intent","parameters":{"mode":"plan_driven","focus":"test"}}' | tool-execution
done

# Test 2: Concurrent writes
tool-a &
tool-b &
wait

# Test 3: Long session
for i in {1..100}; do
  map_context --content "iteration $i"
done
```

---

## Phase 5: Use Case Validation

### 5.1 Core Use Cases to Verify

| Use Case | Workflow | What Could Go Wrong |
|----------|----------|---------------------|
| New developer starts | init → declare_intent → map_context | Init fails? |
| Session continuation | recall_mems → declare_intent | Mems not found? |
| Drift detection | check_drift mid-work | False positives? |
| Session end | compact_session | Data loss? |
| Hierarchy navigation | scan_hierarchy → think_back | Tree corrupted? |

### 5.2 Real-World Scenario Tests

**Scenario A: Overnight Session**
- User works for 8 hours with multiple context switches
- Check: Does hierarchy grow unbounded?
- Check: Is drift detection accurate?

**Scenario B: Multi-Tool Concurrency**
- User runs 3 tools in parallel
- Check: State corruption?
- Check: Inconsistent results?

**Scenario C: Recovery from Crash**
- Simulate crash mid-operation
- Check: Is state recoverable?
- Check: Are partial operations handled?

---

## Phase 6: Findings Compilation

### 6.1 Output Format

```markdown
## Review Report: hivemind-plugin

### Executive Summary
[1-2 paragraphs on overall health]

### Architecture Score: X/10
- Tool-Hook Integration: X/10
- State Management: X/10
- Error Handling: X/10
- Security: X/10

### Critical Issues (Must Fix)
1. **Issue Title**
   - Location: src/path/file.ts:line
   - Severity: CRITICAL
   - Description: [What the issue is]
   - Impact: [What happens if not fixed]
   - Recommendation: [How to fix]

### High Issues (Should Fix)
...

### Medium Issues (Nice to Fix)
...

### Edge Cases Found
| Scenario | Status | Notes |
|----------|--------|-------|
| Concurrent access | PASS/FAIL | ... |
| State corruption | PASS/FAIL | ... |
| Hook failure | PASS/FAIL | ... |

### Use Case Validation
| Use Case | Result | Issues |
|----------|--------|--------|
| New developer flow | PASS/FAIL | ... |
| Session continuation | PASS/FAIL | ... |

### Recommendations
1. [Priority action]
2. [Priority action]
...

### Code Quality Metrics
- Files reviewed: X
- Lines of code: X
- Test coverage: X%
- TypeScript strict: Yes/No
```

---

## Execution Commands

### Setup Jules Context

```bash
# Clone repo (if not already)
git clone https://github.com/user/hivemind-plugin.git
cd hivemind-plugin

# Install dependencies
npm install

# Build
npm run build

# Verify tests pass
npm test
```

### Run Review Tasks

```bash
# Task 1: Architecture analysis
jules analyze src/hooks/ src/tools/ src/lib/persistence.ts

# Task 2: Find edge cases
# (Manual code review of specific files)

# Task 3: Test idempotency
# (Run tools twice, compare results)

# Task 4: Generate report
jules create-pr --title "Review: hivemind-plugin $(date +%Y-%m-%d)" --body "$(cat review-report.md)"
```

---

## Deliverables

1. **Review Report** - Markdown file with all findings
2. **Issue List** - Prioritized list of issues found
3. **Recommendations** - Actionable fixes for each issue
4. **Test Scenarios** - Edge case tests to add to test suite

---

## Success Criteria

| Criteria | Target |
|----------|--------|
| Files reviewed | All 40+ source files |
| Edge cases identified | ≥10 scenarios |
| Critical issues | 0 |
| High issues | ≤3 |
| Use cases validated | All 5 core use cases |

---

*Plan Version: 1.0*
*Created: 2026-02-13*

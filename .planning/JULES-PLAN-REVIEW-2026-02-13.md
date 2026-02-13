# Plan Review: Google Jules on hivemind-plugin

**Date:** 2026-02-13
**Target:** Google Jules AI Agent
**Codebase:** hivemind-plugin (v2.6.0)
**Review Type:** Feasibility, Risk, and Strategy Analysis

---

## Executive Summary

This document provides a strategic review of deploying Google Jules as an AI coding assistant for the hivemind-plugin codebase. Jules, powered by Gemini 2.5 Pro, is an asynchronous coding agent with CLI tools, API access, and proactive task capabilities.

**Key Finding:** Jules is **well-suited** for this codebase with caveats. The plugin architecture requires careful prompt engineering to handle the sophisticated governance patterns.

---

## 1. Jules Capability Assessment

### 1.1 What Jules Brings

| Capability | Relevance to hivemind-plugin | Notes |
|------------|------------------------------|-------|
| **Gemini 2.5 Pro** | High | Strong reasoning for governance logic |
| **Asynchronous Execution** | Medium | Useful for batch refactoring |
| **GitHub Integration** | High | Direct PR workflow |
| **CLI Tools (Jules Tools)** | High | Terminal-based workflow |
| **API Access** | Low | Not needed for this codebase |
| **Proactive Suggestions** | Medium | May suggest improvements |
| **Multimodal** | Low | Code-only project |

### 1.2 Jules Limitations for This Codebase

1. **Async Model Mismatch**: The plugin relies on synchronous hook chains - Jules' async nature may cause confusion in prompts
2. **Tool Definition**: Jules expects clear tool definitions - the OpenCode tool schema is custom
3. **State Management**: Jules reads files but doesn't understand the BrainState semantics without explicit context

---

## 2. Codebase-Specific Considerations

### 2.1 Architecture Complexity

The hivemind-plugin has **high architectural complexity**:

```
src/
├── hooks/           # 6 files - critical interception logic
├── tools/           # 14 tools - governance commands  
├── lib/             # 23 utilities - state, memory, hierarchy
└── schemas/         # Type definitions
```

**Risk Level:** Medium-High

Jules must understand:
- Tool-hook pipeline (`tool-gate.ts` → tool execution → post hooks)
- State persistence semantics (`brain.json`, `hierarchy.json`)
- Governance mode implications (`strict` | `assisted` | `permissive`)
- Idempotency requirements for tools

### 2.2 Critical Files That Require Jules Attention

| Priority | File | Why It Matters |
|----------|------|---------------|
| Critical | `src/hooks/tool-gate.ts` | Gate logic affects all tools |
| Critical | `src/lib/persistence.ts` | State integrity |
| High | `src/hooks/session-lifecycle.ts` | Session management |
| High | `src/tools/declare-intent.ts` | Core governance tool |
| High | `src/lib/hierarchy-tree.ts` | Decision tree integrity |
| Medium | `src/hooks/compaction.ts` | Long-session handling |
| Medium | `src/lib/toast-throttle.ts` | Rate limiting |

### 2.3 Edge Cases Jules Must Handle

1. **Concurrent Tool Execution**
   - Two `declare_intent` calls racing for brain.json
   - Must understand the persistence locking behavior

2. **Corrupted State**
   - What happens if brain.json is invalid JSON?
   - Schema version mismatches

3. **Hook Failure Cascade**
   - Tool gate throws mid-execution
   - Multiple hooks fail - error propagation

4. **Long-Running Sessions**
   - Hierarchy unbounded growth
   - Compaction triggers correctly?

---

## 3. Integration Strategy

### 3.1 Recommended Approach

**Phase 1: Context Injection**
```
Provide Jules with:
1. This SKILL.md (hivemind-plugin-review)
2. Architecture overview
3. Governance mode documentation
4. Sample brain.json structure
```

**Phase 2: Task Classification**

| Task Type | Jules Fit | Prompt Complexity |
|-----------|-----------|-------------------|
| Bug fixes | High | Low |
| Feature additions | High | Medium |
| Refactoring tools | Medium | High |
| Hook logic changes | Medium | High |
| Schema changes | High | Medium |

**Phase 3: Workflow**

```bash
# Recommended Jules workflow
1. jules analyze  # Understand codebase structure
2. jules plan     # Propose changes with PR
3. jules execute  # Implement in branch
4. Human review   # Verify governance logic
5. jules test     # Run existing tests
```

### 3.2 Prompt Engineering Guidelines

**DO:**
- Explicitly mention governance modes when discussing hooks
- Provide schema examples for state files
- Specify idempotency requirements
- Request PR for any hook modification

**DON'T:**
- Let Jules modify tool-gate.ts without human review
- Allow Jules to change persistence logic unsupervised
- Trust Jules to understand "drift detection" semantics without context

---

## 4. Risk Analysis

### 4.1 High-Risk Areas

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Jules misunderstands hook order | Medium | Critical | Explicit hook flowchart in prompt |
| State corruption from concurrent access | Low | Critical | Disable parallel tool execution |
| Jules bypasses governance checks | Medium | High | Require PR for hook changes |
| Idempotency violations | Medium | High | Test each tool twice |

### 4.2 Medium-Risk Areas

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Schema drift (brain.json) | Low | Medium | Version check in persistence |
| Memory shelf overflow | Low | Medium | Add shelf size limits |
| Hierarchy performance degradation | Medium | Low | Profile after large changes |

---

## 5. Testing Requirements

### 5.1 Jules-Generated Code Must Pass

```bash
npm run typecheck    # TypeScript validation
npm test            # Integration tests
npm run lint:boundary  # SDK boundary check
```

### 5.2 Additional Checks for Jules

- [ ] Tool idempotency test (call tool twice, same result)
- [ ] Hook failure test (simulate hook error)
- [ ] State corruption recovery test
- [ ] Concurrent access test (if implementing parallel features)

---

## 6. Recommendations

### 6.1 Immediate Actions

1. **Create Jules Context Package**
   ```
   Include:
   - hivemind-plugin-review skill (created)
   - Sample brain.json, hierarchy.json
   - Hook execution flowchart
   - Governance mode table
   ```

2. **Establish Jules Guardrails**
   - All hook changes require human review
   - Persistence changes require PR
   - Governance mode changes require explicit approval

3. **Test Jules on Low-Risk Tasks First**
   - Documentation improvements
   - Test additions
   - Simple bug fixes

### 6.2 Jules Configuration

```yaml
# Suggested Jules config for this project
model: gemini-2.5-pro
auto_approve: false  # Required for hook changes
test_mode: true      # Run tests before PR
context_files:
  - .planning/SKILL.md
  - src/schemas/*.ts
```

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First PR quality | >80% approval | Code review feedback |
| Hook logic errors | 0 | Security review |
| State corruption incidents | 0 | Manual verification |
| Time to comfortable workflow | 2 weeks | Jules interaction logs |

---

## 8. Conclusion

Google Jules is **recommended** for this codebase with proper context injection and guardrails. The plugin architecture is sophisticated but manageable with clear prompt engineering.

**Key Success Factors:**
1. Provide comprehensive context (this review + skill)
2. Require human review for critical paths
3. Start with low-risk tasks
4. Establish clear Jules boundaries

---

## Appendix: Jules Quick Reference

### Key Commands
```bash
jules analyze      # Analyze codebase
jules plan         # Create implementation plan
jules execute      # Run planned changes
jules review       # Self-review changes
jules test         # Run test suite
```

### Context Files for Jules
- `hivemind-plugin-review/SKILL.md` - Review framework
- `src/schemas/brain-state.ts` - State schema
- `src/schemas/config.ts` - Config schema
- `AGENTS.md` - Build/test commands

---

*Document Version: 1.0*
*Reviewer: OpenCode Agent*
*Next Review: After first Jules deployment*

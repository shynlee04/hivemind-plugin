# Failing Scenario: Git Commit Memory Loss

**Date:** 2026-03-20
**Skill:** git-atomic-memory
**Severity:** HIGH
**Status:** RED - Failing Test

---

## Scenario Description

Agent completes work, makes atomic commits, then context compaction occurs.

### Input Conditions

1. Agent has completed implementation work
2. Agent has made several atomic commits with conventional messages
3. Context compaction is triggered (e.g., `/clear` command or session limit)
4. Agent resumes work in new context

### Expected Behavior (WITH Skill)

Agent should be able to:

1. **Retrieve Commit Context**: Query git history and understand decisions made
2. **Link Sessions**: Connect commits to originating session context and intent
3. **Resume Coherently**: Continue from coherent state after context loss
4. **Trace Decisions**: Follow commit → session → intent chain

### Actual Behavior (WITHOUT Skill)

- Commits exist but intent is lost
- No semantic link between commits and session
- Cannot reconstruct "why" decisions were made
- Repeats same investigation after context loss
- No ability to retrieve knowledge from commits
- Each `git log` shows hashes but semantic meaning is opaque

---

## Evidence of Failure

### Test Case 1: Intent Retrieval Failure

```bash
# Agent makes commits:
git commit -m "feat(auth): implement JWT authentication"
git commit -m "test(auth): add integration tests"
git commit -m "fix(auth): handle token expiration"

# Context compaction occurs (e.g., /clear)

# Agent asks:
"What were we doing?"
# Should know: "Implementing JWT authentication with tests and expiration handling"
# Actually: No recollection, starts fresh investigation
```

### Test Case 2: Session Link Failure

```bash
# Session ses_123 made commits abc123, abc124, abc125# Context compaction# Agent in new session ses_456 tries to understand previous work

# Should be able to:
# 1. Query: Which session made commit abc123?
# 2. Load: What was the trajectory of ses_123?
# 3. Resume: Continue from ses_123's last state

# Actually: No session-to-commit mapping exists
# No ability to retrieve session context from commit
```

### Test Case 3: Decision Chain Failure

```bash
# Previous session decided:
# - Use JWT over session cookies (rationale: stateless, scalable)
# - Skip refresh tokens (rationale: MVP scope)
# - Use RS256 algorithm (rationale: asymmetric, secure)

# New session cannot access these decisions
# Re-evaluates same choices
# May make contradictory decisions
```

### Test Case 4: Knowledge Hierarchy Failure

```bash
# Without git-atomic-memory, knowledge hierarchy is flat:
Level 0: Commit hash exists
Level 1: What changed (diff) - ACCESSIBLE
Level 2: Why it changed (decision) - LOST
Level 3: Pattern learned (semantic) - LOST

# No way to traverse hierarchy levels
# No semantic network formation
```

---

## Root Cause Analysis

### Missing Capabilities

1. **Git Command → Knowledge Mapping**: No mapping between git commands and knowledge retrieval purposes
2. **Semantic Network Formation**: No rules for forming commit → decision → pattern networks
3. **Knowledge Hierarchy Levels**: No leveled knowledge structure (factual → contextual → semantic)
4. **Memory Anchor Encoding**: No schema for encoding session context into commits
5. **Session-to-Commit Linking**: No bidirectional mapping between sessions and commits

### Why Existing Skills Don't Help

| Existing Skill | Gap |
|----------------|-----|
| `git-advanced-workflows` | Focuses on git operations (rebase, bisect), not memory/semantic extraction |
| `conventional-commit` | Focuses on message format, not intent encoding or session linking |
| `git-commit` | Focuses on commit generation, not knowledge retrieval |

---

## Success Criteria

The skill passes when:

1. **Intent Retrieval**: `git log --oneline -5` returns commits with retrievable intent
2. **Session Linking**: Commits can be linked to originating session context
3. **Resume Capability**: After `/clear`, agent can reconstruct previous work context
4. **Decision Chain**: Decision rationale is preserved across sessions
5. **Knowledge Hierarchy**: All 4 levels are accessible (Factual → Contextual → Semantic → Pattern)

---

## TestCommands

```bash
# Test 1: Intent retrieval
git-atomic-memory retrieve --last5
# Expected: Returns semantic anchors with intent

# Test 2: Session linking
git-atomic-memory session --commit abc123
# Expected: Returns session_id and context

# Test 3: Decision chain
git-atomic-memory decisions --session ses_123
# Expected: Returns decision chain with rationale

# Test 4: Knowledge hierarchy
git-atomic-memory hierarchy --level 2
# Expected: Returns decision context level
```

---

## Related Scenarios

- **Scenario 2**: Delegation Recognition Failure (delegation-handoff skill)
- **Scenario 3**: Session Memory Resume (session-memory-resume skill)
- **Scenario 4**: Quality Improvement Loop (quality-improvement-loop skill)

---

## References

- Plan Document: `/Users/apple/hivemind-plugin/docs/plans/git-memory-delegation-skills-plan-2026-03-20.md`
- Related Skills: `git-advanced-workflows`, `conventional-commit`, `git-commit`
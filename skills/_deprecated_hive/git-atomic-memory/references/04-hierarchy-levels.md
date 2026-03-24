# Knowledge Hierarchy Levels

**Purpose:** Layered knowledge structure for semantic memory retrieval.

---

## Overview

Knowledge hierarchy organizes commit knowledge into 4 levels, each with specific retrieval commands and use cases. Higher levels aggregate and derive patterns from lower levels.

## Hierarchy Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Level 4: Network-Wide (Semantic)│
│ - Cross-project patterns│
│ - Domain knowledge│
│ - Reusable solutions│
│ Retrieval: Semantic search across all commits│
├─────────────────────────────────────────────────────────────────┤
│ Level 3: Project-Wide (Long-term)│
│ - Architectural decisions│
│ - Anti-patterns learned│
│ - Success patterns│
│ Retrieval: git log --all --grep="decision:"│
├─────────────────────────────────────────────────────────────────┤
│ Level 2: Cross-Session (Medium-term)│
│ - Recent patterns│
│ - Decision chains│
│ - Problem-solving history│
│ Retrieval: git log --since="1 week ago"│
├─────────────────────────────────────────────────────────────────┤
│ Level 1: Session-Local (Short-term)│
│ - Current work context│
│ - Active decisions│
│ - Working hypothesis│
│ Retrieval: git log --oneline -5│
└─────────────────────────────────────────────────────────────────┘
```

## Level 1: Session-Local (Short-term)

### Knowledge Types

- Current work context
- Active decisions
- Working hypothesis
- Recent commits

### Retrieval Commands

```bash
# Last 5 commits
git log --oneline -5

# Current session commits
git log --all --grep="Session: ses_current"

# Recent changes
git diff HEAD~3..HEAD
```

### Use Cases

1. **Resume Current Work**
   ```bash
   # What was I doing?
   git log --oneline -5
   # Output: Recent decisions
   ```

2. **Quick Context Check**
   ```bash
   # What changed recently?
   git diff HEAD~1
   ```

3. **Active Decision Reference**
   ```bash
   # What decision did I just make?
   git log -1 --format="%b" | grep "^Decision:"
   ```

### Knowledge Format

```yaml
level: 1
knowledge_type: session_local
session_id: ses_123
commits:
  - hash: abc125
    summary: "fix(auth): handle token expiration"
    phase: test
  - hash: abc124
    summary: "test(auth): add integration tests"
    phase: test
  - hash: abc123
    summary: "feat(auth): implement JWT"
    phase: implement

active_decisions:
  - "Use JWT over session cookies"
  - "Skip refresh tokens for MVP"

working_hypothesis: "JWT auth flow is working, testing expiration"
```

## Level 2: Cross-Session (Medium-term)

### Knowledge Types

- Recent patterns
- Decision chains
- Problem-solving history
- Weekly work context

### Retrieval Commands

```bash
# Last week of commits
git log --since="1 week ago"

# Recent decisions
git log --since="1 week ago" --grep="decision:"

# Recent evolution
git log --since="1 week ago" --oneline --graph
```

### Use Cases

1. **Weekly Review**
   ```bash
   # What did I accomplish this week?
   git log --since="1 week ago" --oneline
   ```

2. **Pattern Discovery**
   ```bash
   # What patterns emerged?
   git log --since="1 week ago" --grep="pattern:"
   ```

3. **Decision Chain Trace**
   ```bash
   # How did decisions evolve?
   git log --since="1 week ago" --grep="Decision:" --format="%h %s%n%b"
   ```

### Knowledge Format

```yaml
level: 2
knowledge_type: cross_session
period: "1 week"
sessions:
  - ses_123: "Auth implementation"
  - ses_124: "Testing auth"
  - ses_125: "Bug fixing"

decision_chains:
  - chain: ["Use JWT", "Skip refresh", "Add rate limiting"]
    sessions: [ses_123, ses_124, ses_125]

patterns:
  - pattern: "Test after implement"
    frequency: 3
    confidence: 0.85
```

## Level 3: Project-Wide (Long-term)

### Knowledge Types

- Architectural decisions
- Anti-patterns learned
- Success patterns
- Project history

### Retrieval Commands

```bash
# All decisions
git log --all --grep="decision:"

# Project history
git log --all --oneline --graph

# Specific feature history
git log --all --oneline -- "src/auth/*"
```

### Use Cases

1. **Architectural Understanding**
   ```bash
   # Why is the architecture this way?
   git log --all --grep="decision:" -- "src/arch/"
   ```

2. **Anti-Pattern Avoidance**
   ```bash
   # What anti-patterns were identified?
   git log --all --grep="anti-pattern:"
   ```

3. **Success Pattern Replication**
   ```bash
   # What worked well?
   git log --all --grep="success:"
   ```

### Knowledge Format

```yaml
level: 3
knowledge_type: project_wide
project: "hivemind-plugin"
architectural_decisions:
  - decision: "Use plugin architecture"
    rationale: "Modular, extensible"
    commit: abc100  - decision: "TypeScript for type safety"
    rationale: "Better IDE support, fewer bugs"
    commit: abc101

anti_patterns:
  - pattern: "Avoid monolithic core"
    learned_from: ses_050commit: abc050  - pattern: "Don't skip tests"
    learned_from: ses_060
    commit: abc060

success_patterns:
  - pattern: "Plugin-first design"
    frequency: 10
    confidence: 0.95
```

## Level 4: Network-Wide (Semantic)

### Knowledge Types

- Cross-project patterns
- Domain knowledge
- Reusable solutions
- Meta-patterns

### Retrieval Commands

```bash
# Semantic search (requires knowledge base)
# This is aspirational - requires semantic search infrastructure

# Pattern search across projects
git log --all --grep="pattern:"

# Decision patterns
git log --all --grep="decision-pattern:"
```

### Use Cases

1. **Cross-Project Learning**
   - Find similar patterns across projects
   - Apply learned solutions from other contexts

2. **Domain Knowledge Extraction**
   - Extract domain-specific patterns
   - Build reusable knowledge

3. **Meta-Pattern Discovery**
   - Identify patterns of patterns
   - Build higher-level abstractions

### Knowledge Format

```yaml
level: 4
knowledge_type: network_wide
domain: "agent-frameworks"
cross_project_patterns:
  - pattern: "Plugin architecture"
    projects: ["hivemind", "opencode", "claude-code"]
    confidence: 0.92
  
  - pattern: "Skill-based routing"
    projects: ["hivemind", "cursor"]
    confidence: 0.88

domain_knowledge:
  - domain: "context-management"
    patterns: ["session-state", "trajectory-tracking"]
    confidence: 0.90

meta_patterns:
  - pattern: "P1-P2-P3 pattern system"
    abstraction_level: "framework"
    confidence: 0.95
```

## Hierarchy Traversal

### Bottom-Up (Context → Pattern)

```python
def traverse_up(knowledge, commit_hash):
    # Level 1: Get commit
    commit = get_commit(commit_hash)
    session = get_session(commit.session_id)
    
    # Level 2: Get session decisions
    decisions = session.decisions
    
    # Level 3: Get project patterns
    patterns = get_project_patterns()
    
    # Level 4: Get network knowledge
    network = get_network_knowledge()
    
    return {
        "commit": commit,
        "session": session,
        "decisions": decisions,
        "patterns": patterns,
        "network": network
    }
```

### Top-Down (Pattern → Context)

```python
def traverse_down(pattern_id):
    # Level 4: Get network pattern
    pattern = get_network_pattern(pattern_id)
    
    # Level 3: Get project instances
    instances = get_project_instances(pattern)
    
    # Level 2: Get session occurrences
    sessions = get_sessions_with_pattern(pattern)
    
    # Level 1: Get commits
    commits = get_commits_with_pattern(pattern)
    
    return {
        "pattern": pattern,
        "instances": instances,
        "sessions": sessions,
        "commits": commits
    }
```

## Level Selection Guide

| Use Case | Level | Command |
|----------|-------|---------|
| Resume current work | 1 | `git log --oneline -5` |
| Weekly review | 2 | `git log --since="1 week ago"` |
| Understand architecture | 3 | `git log --all --grep="decision:"` |
| Cross-project learning | 4 | Semantic search |
| Debug recent issue | 1 | `git log --oneline -10` |
| Pattern discovery | 2-3 | `git log --grep="pattern:"` |
| Decision rationale | 3 | `git log --all --grep="rationale:"` |

## Knowledge Transfer Between Levels

### Aggregation

```python
def aggregate_up(knowledge, from_level, to_level):
    """Aggregate knowledge from lower to higher level."""
    if to_level < from_level:
        raise ValueError("Can only aggregate to higher levels")
    
    result = {}
    
    if to_level >= 2:
        # Aggregate session decisions
        result["decisions"] = aggregate_decisions(knowledge)
    
    if to_level >= 3:
        # Aggregate project patterns
        result["patterns"] = extract_patterns(result["decisions"])
    
    if to_level >= 4:
        # Aggregate network knowledge
        result["network"] = extract_meta_patterns(result["patterns"])
    
    return result
```

### Drill-Down

```python
def drill_down(knowledge, from_level, to_level):
    """Drill down from higher to lower level."""
    if to_level > from_level:
        raise ValueError("Can only drill down to lower levels")
    
    result = {}
    
    if to_level <= 3:
        # Get project context
        result["project"] = get_project_context(knowledge)
    
    if to_level <= 2:
        # Get session context
        result["session"] = get_session_context(result["project"])
    
    if to_level <= 1:
        # Get commit details
        result["commit"] = get_commit_details(result["session"])
    
    return result
```

## Hierarchy Storage

### Level-Based File Structure

```
.hivemind/knowledge/
├── level1/
│   ├── sessions/
│   │   └── ses_123/
│   │       └── commits.json
├── level2/
│   ├── weekly/
│   │   └── 2026-03-W3.json
│   └── patterns/
│       └── recent.json
├── level3/
│   ├── project/
│   │   └── architecture.json
│   └── decisions/
│       └── all.json
└── level4/
    ├── network/
    │   └── cross-project.json
    └── domain/
        └── agent-frameworks.json
```

### Query by Level

```python
def get_knowledge(level, query):
    """Get knowledge at specific level."""
    base_path = f".hivemind/knowledge/level{level}"
    
    if level == 1:
        return query_session_knowledge(base_path, query)
    elif level == 2:
        return query_cross_session_knowledge(base_path, query)
    elif level == 3:
        return query_project_knowledge(base_path, query)
    elif level == 4:
        return query_network_knowledge(base_path, query)
    else:
        raise ValueError(f"Invalid level: {level}")
```

## Reference Implementation

See `scripts/knowledge-hierarchy.py` for full implementation.
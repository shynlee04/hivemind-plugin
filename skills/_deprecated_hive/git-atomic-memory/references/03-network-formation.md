# Semantic Network Formation

**Purpose:** Rules and algorithms for forming semantic memory networks from git commits.

---

## Overview

Semantic network formation transforms linear commit history into a connected knowledge graph. Nodes are commits, sessions, and patterns. Edges represent semantic relationships.

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK STRUCTURE│
├─────────────────────────────────────────────────────────────────┤
││   NODE TYPES (Entities)│
│   ├── Commit Node: abc123│
│   ├── Session Node: ses_123│
│   ├── Decision Node: dec_001│
│   └── Pattern Node: pat_auth_jwt│
││   EDGE TYPES (Relationships)│
│   ├── commits_in_session: Commit → Session│
│   ├── decision_from: Decision → Commit│
│   ├── pattern_matches: Pattern → Commit[]
│   └── follows: Commit → Commit (temporal)
```

## Node Formation

### Commit Nodes

```yaml
node_type: commit
node_id: abc123def456
attributes:
  hash: abc123def456
  message: "feat(auth): implement JWT authentication"
  author: "developer"
  timestamp: 2026-03-20T10:30:00Z
  session_id: ses_123
  
  intent:
    summary: "Implement JWT authentication"
    decision: "Use JWT over session cookies"
    rationale: "Stateless, scalable, mobile-friendly"
    
  semantics:
    patterns: ["auth-pattern", "jwt-pattern"]
    confidence: 0.95
```

### Session Nodes

```yaml
node_type: session
node_id: ses_123
attributes:
  session_id: ses_123
  created_at: 2026-03-20T10:00:00Z
  trajectory: "implement > test > verify"
  phase: test
  
  commits:
    - abc123  # feat(auth): implement JWT
    - abc124  # test(auth): add tests
    - abc125  # fix(auth): handle expiration
    
  decisions:
    - decision: "Use JWT"
      commit: abc123
      rationale: "Stateless, scalable"
```

### Decision Nodes

```yaml
node_type: decision
node_id: dec_001
attributes:
  decision: "Use JWT over session cookies"
  commit: abc123
  session: ses_123  rationale: "Stateless, scalable, mobile-friendly"
  alternatives:
    - session cookies
    - OAuth-only
  
  confidence: 0.95
```

### Pattern Nodes

```yaml
node_type: pattern
node_id: pat_auth_jwt
attributes:
  pattern: "auth-pattern"
  description: "Authentication pattern with JWT"
  matched_commits:
    - abc123
    - abc124
    - abc125
  
  confidence: 0.85
  discovered_at: 2026-03-20T11:00:00Z
```

## Edge Formation

### Temporal Edges

```yaml
# Commit sequence
edge_type: follows
from: abc123
to: abc124
weight: 1.0  # Direct sequence

# Session sequence
edge_type: precedes
from: ses_001
to: ses_002
weight: 0.8  # Related work
```

### Semantic Edges

```yaml
# Decision edge
edge_type: decision_from
from: dec_001
to: abc123
weight: 1.0  # Certain relationship

# Pattern edge
edge_type: pattern_matches
from: pat_auth_jwt
to: [abc123, abc124, abc125]
weight: 0.85  # Confidence score
```

### Cross-Session Edges

```yaml
# Handoff edge
edge_type: handoff_to
from: ses_parent
to: ses_child
attributes:
  delegation_type: investigate
  inherited_context: ["decision_1", "decision_2"]  scope: "Investigate auth flow"
```

## Network Formation Algorithm

### Phase 1: Commit Processing

```python
def process_commit(commit):
    # Extract intent from commit
    intent = extract_intent(commit.message)
    
    # Create commit node
    node = CommitNode(
        id=commit.hash,
        intent=intent,
        session=extract_session(commit)
    )
    
    # Link to session
    link_to_session(node)
    
    # Extract patterns
    patterns = extract_patterns(commit)
    for pattern in patterns:
        link_to_pattern(node, pattern)
    
    return node
```

### Phase 2: Session Processing

```python
def process_session(session):
    # Create session node
    node = SessionNode(
        id=session.id,
        trajectory=session.trajectory,
        decisions=[]
    )
    
    # Process commits in session
    for commit in session.commits:
        commit_node = process_commit(commit)
        node.add_commit(commit_node)
    
    # Extract decision chain
    node.decisions = extract_decisions(node.commits)
    
    return node
```

### Phase 3: Pattern Extraction

```python
def extract_patterns(commits):
    patterns = []
    
    # Identify recurring themes
    themes = identify_themes(commits)
    
    for theme in themes:
        # Calculate confidence
        confidence = len(theme.commits) / len(commits)
        
        # Create pattern node
        pattern = PatternNode(
            id=f"pat_{theme.name}",
            pattern=theme.name,
            matched_commits=theme.commits,
            confidence=confidence
        )
        patterns.append(pattern)
    
    return patterns
```

### Phase 4: Network Assembly

```python
def assemble_network(sessions, commits, patterns):
    network = SemanticNetwork()
    
    # Add nodes
    for session in sessions:
        network.add_node(session)
    for commit in commits:
        network.add_node(commit)
    for pattern in patterns:
        network.add_node(pattern)
    
    # Add edges
    for commit in commits:
        # Temporal edge
        if commit.parent:
            network.add_edge(commit, commit.parent, "follows")
        
        # Session edge
        network.add_edge(commit, commit.session, "commits_in_session")
        
        # Pattern edges
        for pattern in commit.patterns:
            network.add_edge(pattern, commit, "pattern_matches")
    
    return network
```

## Query Patterns

### Find Related Decisions

```python
def find_related_decisions(network, commit):
    # Get session
    session = network.get_connected(commit, "commits_in_session")
    
    # Get decisions from session
    decisions = session.decisions
    
    # Get related commits from decisions
    related = []
    for decision in decisions:
        related.extend(network.get_connected(decision, "pattern_matches"))
    
    return related
```

### Find Pattern Matches

```python
def find_pattern_matches(network, pattern_id):
    pattern = network.get_node(pattern_id)
    
    # Get all matching commits
    matches = network.get_connected(pattern, "pattern_matches")
    
    return matches
```

### Traverse Decision Chain

```python
def traverse_decision_chain(network, session_id):
    session = network.get_node(session_id)
    
    chain = []
    current = session
    
    while current:
        # Get decisions in session
        decisions = current.decisions
        chain.extend(decisions)
        
        # Follow temporal edge
        current = network.get_connected(current, "precedes")
    
    return chain
```

## Network Storage

### In-Memory Representation

```python
class SemanticNetwork:
    def __init__(self):
        self.nodes = {}  # id -> Node
        self.edges = {}  # (from, to) -> Edge
    
    def add_node(self, node):
        self.nodes[node.id] = node
    
    def add_edge(self, from_id, to_id, edge_type, weight=1.0):
        key = (from_id.id, to_id.id)
        self.edges[key] = Edge(from_id, to_id, edge_type, weight)
    
    def get_connected(self, node, edge_type):
        return [
            self.nodes[to_id]
            for (from_id, to_id), edge in self.edges.items()
            if from_id == node.id and edge.type == edge_type
        ]
```

### File-Based Storage

```yaml
# .hivemind/network/sessions.yaml
sessions:
  - id: ses_123
    commits: [abc123, abc124, abc125]
    decisions: [dec_001, dec_002]

# .hivemind/network/decisions.yaml
decisions:
  - id: dec_001
    decision: "Use JWT"
    commit: abc123
    session: ses_123

# .hivemind/network/patterns.yaml
patterns:
  - id: pat_auth_jwt
    pattern: "auth-pattern"
    commits: [abc123, abc124, abc125]
    confidence: 0.85
```

### Git-Based Storage

```bash
# Store network in git notes
git notes add -m "network:
  patterns: [auth-pattern]
  confidence: 0.85" abc123

# Query network from notes
git notes show abc123 | grep "^network:"
```

## Network Maintenance

### Incremental Updates

```python
def update_network(network, new_commit):
    # Process new commit
    commit_node = process_commit(new_commit)
    
    # Add to network
    network.add_node(commit_node)
    
    # Link to session
    session = network.get_node(commit_node.session)
    session.add_commit(commit_node)
    
    # Update patterns
    patterns = extract_patterns([commit_node])
    for pattern in patterns:
        if network.has_node(pattern.id):
            existing = network.get_node(pattern.id)
            existing.update_confidence()
        else:
            network.add_node(pattern)
```

### Cleanup

```python
def cleanup_network(network, threshold=0.5):
    # Remove low-confidence patterns
    to_remove = [
        node for node in network.nodes.values()
        if node.type == "pattern" and node.confidence < threshold
    ]
    
    for node in to_remove:
        network.remove_node(node.id)
    
    return len(to_remove)
```

## Network Metrics

### Connectivity

```python
def network_connectivity(network):
    # Calculate average connections per node
    total_edges = len(network.edges)
    total_nodes = len(network.nodes)
    
    return total_edges / total_nodes if total_nodes > 0 else 0
```

### Confidence Distribution

```python
def confidence_distribution(network):
    # Get all confidence scores
    scores = [
        node.confidence for node in network.nodes.values()
        if hasattr(node, 'confidence')
    ]
    
    return {
        "mean": mean(scores),
        "median": median(scores),
        "std": stdev(scores)
    }
```

### Pattern Coverage

```python
def pattern_coverage(network):
    # How many commits have patterns
    commits_with_patterns = 0
    total_commits = 0
    
    for node in network.nodes.values():
        if node.type == "commit":
            total_commits += 1
            if node.patterns:
                commits_with_patterns += 1
    
    return commits_with_patterns / total_commits if total_commits > 0 else 0
```

## Reference Implementation

See `scripts/network-builder.py` for full implementation.
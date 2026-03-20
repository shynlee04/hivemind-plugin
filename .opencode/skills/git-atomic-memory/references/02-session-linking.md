# Session-to-Commit Linking

**Purpose:** Bidirectional mapping between git commits and HiveMind sessions.

---

## Overview

Session linking creates a bidirectional relationship between commits and sessions, enabling:
- Forward lookup: Session → Commits
- Backward lookup: Commit → Session
- Context restoration after compaction
- Decision chain traversal

## Linking Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIDIRECTIONAL LINKING│
├─────────────────────────────────────────────────────────────────┤
│││   FORWARD: SESSION → COMMITS│    ││   ├── Query: Which commits belong to ses_123?      │    │
│   │   ├── Method: git log --grep="ses_123"│    │
│   │   └── Output: [abc123, abc124, abc125]│    │
││   BACKWARD: COMMIT → SESSION│    │
│   │   ├── Query: Which session created commit abc123?    │    │
│   │   ├── Method: git notes show abc123│    │
│   │   └── Output: ses_123│    │
││   LINK STORAGE:│
│   │   ├── Git trailers (commit metadata)│
│   │   ├── Git notes (extended context)│
│   │   └── HiveMind state (semantic network)│
└─────────────────────────────────────────────────────────────────┘
```

## Forward Linking: Session → Commits

### Method 1: Git Grep

```bash
# Find all commits from a session
git log --all --oneline --grep="Session: ses_123"

# Output:
# abc125 fix(auth): handle token expiration
# abc124 test(auth): add integration tests
# abc123 feat(auth): implement JWT authentication
```

### Method 2: Git Notes Search

```bash
# Search notes for session
git log --all --notes --show-notes --grep="ses_123"

# Output includes note content with session_id
```

### Method 3: HiveMind State

```bash
# Read from session state file
cat .hivemind/states/ses_123/commits.json

# Output:
{
  "session_id": "ses_123",
  "commits": ["abc123", "abc124", "abc125"],
  "trajectory": "implement > test > verify"
}
```

## Backward Linking: Commit → Session

### Method 1: Commit Body Parse

```bash
# Extract session from commit body
git log -1 --format="%b" abc123 | grep "^Session:" | cut -d':' -f2-

# Output: ses_123
```

### Method 2: Git Trailer

```bash
# Extract session from trailer
git log -1 --format="%(trailers:key=Session,valueonly)" abc123

# Output: ses_123
```

### Method 3: Git Notes

```bash
# Extract session from note
git notes show abc123 | grep "^session:" | cut -d':' -f2-

# Output: ses_123
```

## Linking Workflow

### Creating Links

```bash
# During commit
git commit -m "feat(auth): implement JWT authentication" \
  --trailer "Session=ses_123"

# After commit
git notes add -m "session: ses_123
trajectory: implement > test > verify" abc123

# Update session state
echo '["abc123"]' > .hivemind/states/ses_123/commits.json
```

### Maintaining Links

```bash
# Update session state after new commit
jq '.commits += ["abc124"]' .hivemind/states/ses_123/commits.json > tmp.json
mv tmp.json .hivemind/states/ses_123/commits.json

# Add note to new commit
git notes add -m "session: ses_123" abc124
```

## Cross-Session Linking

### Parent-Child Sessions

```yaml
# .hivemind/states/ses_child/handoff.json
{
  "parent_session": "ses_parent",
  "child_session": "ses_child",
  "delegation_type": "investigate",
  "inherited_commits": ["abc100", "abc101"],
  "scope": "Investigate auth flow"
}
```

### Link Traversal

```bash
# Get parent session from child
cat .hivemind/states/ses_child/handoff.json | jq -r '.parent_session'

# Get inherited commits
cat .hivemind/states/ses_child/handoff.json | jq -r '.inherited_commits[]'

# Traverse decision chain
# ses_child → ses_parent → commits_abc100/abc101
```

## Session State Schema

### Complete Session File

```yaml
# .hivemind/states/ses_123/session.json
session_id: ses_123
created_at: 2026-03-20T10:30:00Z
trajectory: implement > test > verify
current_phase: test

commits:
  - hash: abc123
    summary: feat(auth): implement JWT
    phase: implement
  - hash: abc124
    summary: test(auth): add tests
    phase: test

decisions:
  - id: dec_001
    commit: abc123
    decision: Use JWT over session cookies
    rationale: Stateless, scalable, mobile-friendly
    alternatives:
      - session cookies (stateful)
      - OAuth-only (complex)

network:
  parent_session: null
  child_sessions: [ses_child_456]
  related_commits: [abc100, abc110]
```

## Retrieval Patterns

### Find All Commits for Session

```bash
# Method 1: Git log
git log --all --oneline --grep="Session: ses_123"

# Method 2: Session state
jq -r '.commits[].hash' .hivemind/states/ses_123/session.json

# Method 3: Git notes
git log --all --notes --show-notes --grep="ses_123"
```

### Find Session for Commit

```bash
# Method 1: Git trailer
git log -1 --format="%(trailers:key=Session,valueonly)" abc123

# Method 2: Git note
git notes show abc123 | grep "^session:" | cut -d':' -f2-

# Method 3: State file search
grep -r "abc123" .hivemind/states/*/commits.json
```

### Find Decision Chain

```bash
# Get session
SESSION=$(git log -1 --format="%(trailers:key=Session,valueonly)" abc123)

# Get all commits
COMMITS=$(git log --all --oneline --grep="Session: $SESSION" | cut -d' ' -f1)

# Extract decisions
for C in $COMMITS; do
  git log -1 --format="%b" $C | grep "^Decision:"
done
```

## Edge Cases

### Orphan Commits

Commits without session links:

```bash
# Find orphan commits (last 10 commits without session)
for C in $(git log --oneline -10 | cut -d' ' -f1); do
  SESSION=$(git log -1 --format="%(trailers:key=Session,valueonly)" $C)
  if [ -z "$SESSION" ]; then
    echo "Orphan: $C"
fifi
done
```

### Multiple Sessions

Commit spans multiple sessions:

```bash
# Add multiple sessions
git commit -m "feat(auth): implement" \
  --trailer "Session=ses_001,ses_002"

# Parse multiple sessions
git log -1 --format="%(trailers:key=Session,valueonly)" abc123 | tr ',' '\n'
```

### Session Renaming

When session ID changes:

```bash
# Update all commits with old session
for C in $(git log --all --grep="Session: ses_old" | cut -d' ' -f1); do
  git notes add -f -m "session: ses_new" $C
done

# Update state files
mv .hivemind/states/ses_old .hivemind/states/ses_new
```

## Performance Considerations

### Indexing for Speed

```bash
# Create session index
git log --all --format="%H %(trailers:key=Session,valueonly)" > .git/session-index

# Query index
grep "ses_123" .git/session-index
```

### Caching

```bash
# Cache session → commits mapping
cat > .hivemind/cache/session-commits.json << EOF
{
  "ses_123": ["abc123", "abc124", "abc125"],
  "ses_456": ["def456", "def457"]
}
EOF

# Fast lookup
jq -r '.["ses_123"][]' .hivemind/cache/session-commits.json
```

---

## Reference Implementation

```bash
#!/bin/bash
# session-link.sh

# Link commit to session
link_commit() {
  local COMMIT=$1
  local SESSION=$2
  
  # Add trailer
  git commit --amend --trailer "Session=$SESSION"
  
  # Add note
  git notes add -m "session: $SESSION" $COMMIT
  
  # Update session state
  local STATE_FILE=".hivemind/states/$SESSION/commits.json"
  if [ -f "$STATE_FILE" ]; then
    jq ". += [\"$COMMIT\"]" "$STATE_FILE" > tmp.json
    mv tmp.json "$STATE_FILE"
  fi}
# Get session from commit
get_session() {
  local COMMIT=$1
  git log -1 --format="%(trailers:key=Session,valueonly)" $COMMIT
}

# Get commits from session
get_commits() {
  local SESSION=$1
  git log --all --oneline --grep="Session: $SESSION" | cut -d' ' -f1
}
```
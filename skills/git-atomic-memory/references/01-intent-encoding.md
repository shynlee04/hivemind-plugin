# Intent Encoding Methods

**Purpose:** Detailed techniques for encoding semantic intent into git commits.

---

## Overview

Intent encoding transforms opaque commit hashes into semantic memory anchors. This reference provides implementation details for each encoding method.

## Method 1: Commit Body Embedding

### Structure

```
<type>(<scope>): <subject>

[blank line]
[body]

[blank line]
Intent: <semantic intent summary>
Decision: <key decision>
Rationale: <why this decision>
Alternatives: <comma-separated alternatives>
Session: <session_id>
Trajectory: <workflow phase>
```

### Example

```bash
git commit -m "feat(auth): implement JWT authentication

Add JWT-based authentication system with RS256 signing.

Intent: Enable stateless authentication for mobile clients
Decision: Use JWT over session cookies
Rationale: Stateless, scalable, mobile-friendly
Alternatives: session cookies (stateful), OAuth-only (complex)
Session: ses_202603201030
Trajectory: implement > test > verify"
```

### Parsing

```bash
# Extract intent from commit
git log -1 --format="%b" | grep "^Intent:" | cut -d':' -f2-

# Extract decision
git log -1 --format="%b" | grep "^Decision:" | cut -d':' -f2-

# Extract session
git log -1 --format="%b" | grep "^Session:" | cut -d':' -f2-
```

### Advantages

- Human-readable in `git log`
- No additional tooling required
- Works with all git viewing tools

### Disadvantages

- Commits can become verbose
- Not machine-friendly for complex queries

---

## Method 2: Git Trailers

### Structure

```bash
git commit -m "<message>" \
  --trailer "Intent=<summary>" \
  --trailer "Decision=<key decision>" \
  --trailer "Rationale=<why>" \
  --trailer "Session=<session_id>"
```

### Example

```bash
git commit -m "feat(auth): implement JWT authentication" \
  --trailer "Intent=Enable stateless auth" \
  --trailer "Decision=Use JWT" \
  --trailer "Rationale=Stateless, scalable" \
  --trailer "Session=ses_202603201030"
```

### Parsing

```bash
# Extract trailers
git log -1 --format="%(trailers)" HEAD

# Parse specific trailer
git log -1 --format="%(trailers:key=Session,valueonly)" HEAD
# Output: ses_202603201030

# Get all intent-related trailers
git log -1 --format="%(trailers:key=Intent,valueonly) %(trailers:key=Decision,valueonly)"
```

### Advantages

- Machine-parseable
- Git-native interpretation
- Works with `git interpret-trailers`

### Disadvantages

- Not visible in default `git log`
- Requires trailer-aware tooling

---

## Method 3: Git Notes

### Structure

```bash
# Add note to commit
git notes add -m "<key>: <value>
<key>: <value>
..." <commit>
```

### Example

```bash
# Add extended context
git notes add -m "session: ses_202603201030
trajectory: implement > test > verify
decision: Use JWT over session cookies
rationale: Stateless, scalable, mobile-friendly
alternatives: session cookies, OAuth-only
phase: implementation" abc123

# View notes
git notes show abc123
```

### Retrieval

```bash
# List all notes
git notes list

# Show note for commit
git notes show abc123

# Search notes
git log --all --notes --show-notes --grep="ses_202603201030"
```

### Advantages

- Full context storage
- Doesn'tModify commit message
- Can store large structured data

### Disadvantages

- Not transferred by default on push/pull
- Requires explicit `--notes` flags

---

## Method 4: HiveMind State Linking

### Structure

```bash
# Create session state file
cat > .hivemind/states/ses_202603201030/commits.json << EOF
{
  "session_id": "ses_202603201030",
  "commits": ["abc123", "abc124", "abc125"],
  "trajectory": "implement > test > verify",
  "decisions": [
    {
      "commit": "abc123",
      "decision": "Use JWT over session cookies",
      "rationale": "Stateless, scalable, mobile-friendly",
      "alternatives": ["session cookies", "OAuth-only"]
    }
  ]
}
EOF

# Link to commit via note
git notes add -m "session_state: .hivemind/states/ses_202603201030" abc123
```

### Retrieval

```bash
# Get session from commit
SESSION_PATH=$(git notes show abc123 | grep session_state | cut -d':' -f2- | tr -d ' ')
cat "$SESSION_PATH/commits.json"
```

### Advantages

- Full semantic network
- Cross-session linking
- Pattern extraction

### Disadvantages

- Requires HiveMind infrastructure
- External to git repository

---

## Encoding Selection Guide

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| Body Embedding | Human review | Visible, no tooling | Verbose |
| Trailers | Machine-parseable | Git-native | Hidden by default |
| Notes | Extended context | Full context | Not pushed by default |
| State Linking | Semantic networks | Full network | Requires infrastructure |

**Recommendation: Combine Methods**

1. Use **Trailers** for machine-readable metadata (Intent, Decision, Session)
2. Use **Body** for human-readable summary
3. Use **Notes** for extended context
4. Use **State Linking** for semantic networks

---

## Implementation Examples

### Automated Encoding Script

```bash
#!/bin/bash
# commit-with-intent.sh

SESSION_ID=$1
INTENT=$2
DECISION=$3
MESSAGE=$4

git commit -m "$MESSAGE
Intent: $INTENT
Decision: $DECISION
Session: $SESSION_ID"
```

### Retrieval Script

```bash
#!/bin/bash
# get-commit-context.sh

COMMIT=$1

# Get all intent metadata
INTENT=$(git log -1 --format="%b" $COMMIT | grep "^Intent:" | cut -d':' -f2-)
DECISION=$(git log -1 --format="%b" $COMMIT | grep "^Decision:" | cut -d':' -f2-)
SESSION=$(git log -1 --format="%b" $COMMIT | grep "^Session:" | cut -d':' -f2-)

echo "Commit: $COMMIT"
echo "Intent: $INTENT"
echo "Decision: $DECISION"
echo "Session: $SESSION"
```

---

## Edge Cases

### Missing Intent

If no intent is encoded, fall back to commit message parsing:

```bash
# Extract intent from conventional commit type/scope
TYPE=$(git log -1 --format="%s" $COMMIT | cut -d'(' -f1 | cut -d':' -f1)
SCOPE=$(git log -1 --format="%s" $COMMIT | cut -d'(' -f2 | cut -d')' -f1)

# Infer intent from type
case $TYPE in
  feat) INTENT="Add $SCOPE feature" ;;
  fix)  INTENT="Fix $SCOPE bug" ;;
  *)    INTENT="$TYPE $SCOPE" ;;
esac
```

### Multiple Sessions

If commit spans multiple sessions:

```bash
git commit -m "feat(auth): implement auth" \
  --trailer "Session=ses_001,ses_002"
```

### Intent Updates

To update intent without changing commit:

```bash
git notes add -f -m "intent: Updated intent
decision: Revised decision" $COMMIT
```

---

## Reference Implementation

See `scripts/commit-encoder.sh` for full implementation.
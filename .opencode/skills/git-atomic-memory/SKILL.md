---
name: git-atomic-memory
description: >
  Use when encoding commit intent as semantic memory, retrieving past decisions from git history,
  resuming work after context loss, or building knowledge networks from commit chains.
  
  PRIMARY USERS:
  • hiveminder (orchestrator): Links delegation handoffs to commit anchors
  • hivemaker (executor): Resumes work from previous sessions via commit context
  • hiveq (verifier): Traces decision history to validate implementation
  • hiverd (researcher): Investigates code history for intent and rationale
  • hivefiver (setup): Restores session context from git memory anchors
  
  SESSION CONTEXT:
  • Main session: Encode intent during commits, build knowledge network
  • Sub-session: Retrieve parent decisions via commit links, resume from anchors
  • Resumed session: Restore trajectory from semantic memory
  
  Triggers: "what did we decide", "why was this changed", "resume from commits",
  "commit intent", "decision history", "git memory", "session to commit link",
  "link commit to session", "retrieve decision context"
version: "1.0.0"
framework: hivemind
pack: git-memory
entry-level: L2
pattern: P2
stacking: 0
owner: hivemind-skill-writer
status: active
depends_on:
  - context-intelligence-entry
enables:
  - session-memory-resume
complementary:
  - git-advanced-workflows
  - conventional-commit
---

# Git Atomic Memory

Encode git commits as semantic memory anchors enabling session continuity and knowledge retrieval after context loss.

## Purpose

P2 domain-specific skill for transforming git commits from opaque hashes into semantic memory anchors. Provides the knowledge layer that `git-advanced-workflows` (operations) and `conventional-commit` (formatting) do not address.

**Skill Positioning:**
```
context-intelligence-entry (P1) ─┬─→ git-atomic-memory (P2) ──→ session-memory-resume (P2)
                                 │          │
                                 │          ├─→ git-advanced-workflows (operations)
                                 │          └─→ conventional-commit (formatting)
                                 │
                                 └─→ delegation-handoff (P1)
```

**Knowledge Flow:**
```
Main Session:makes commit → encode intent → create anchor → link to session
     ↓
Sub-session: inherits anchor → retrieve decision → continue work
     ↓
Resumed session: load anchors → restore trajectory → resume
```

## When to Activate

### Primary Triggers (by Agent Role)

**FOR hiveminder (Orchestrator):**
- "Link handoff to commit" / "anchor delegation to commit"
- "What decisions did we make" during orchestration
- "Trace decision chain" for trajectory planning

**FOR hivemaker (Executor):**
- "Resume from last session" / "continue where we left off"
- "What was the intent of commit X"
- "Understand this code's history" before modification

**FOR hiveq (Verifier):**
- "Trace decision history" / "validate against original intent"
- "What was decided" for acceptance criteria
- "Find root cause" via commit attribution

**FOR hiverd (Researcher):**
- "Investigate why this was changed"
- "Find the decision context" for this code
- "Trace evolution" of this feature

**FOR hivefiver (Setup/Maintenance):**
- "Restore session context" / "reload from commits"
- "Build knowledge network" for documentation
- "Initialize session memory" from git history

**FOR general (Executor):**
- "What did we work on last time"
- "Why does this code exist"
- "Continue implementation"

### Session Type Triggers

| Session Type | Triggers | Primary Use |
|--------------|----------|------------|
| **NEW** | "start new work" | Encode intent on first commit |
| **RESUMED** | "resume", "continue" | Retrieve anchors, restore trajectory |
| **DELEGATED** | "inherited from", "parent session" | Link to parent decisions via commits |
| **DEGRADED** | "context lost", "compaction occurred" | Recover from semantic anchors |
| **SUB** | "sub-session", "task delegation" | Retrieve parent commit context |

### Conflict Detection

**DO NOT activate for:**
- `git rebase`, `git bisect`, `git cherry-pick` → use `git-advanced-workflows`
- "write commit message" → use `conventional-commit`
- Simple `git status` query without semantic analysis

## Granularity Control (Reference Loading)

**Decision Tree — Which Reference to Load:**

```
START: What is your goal?

├── ENCODE INTENT (making a commit)
│   └── Load: references/01-intent-encoding.md
│       └── Methods: Commit body, trailers, notes
│
├── LINK SESSION TO COMMITS
│   └── Load: references/02-session-linking.md
│       └── Bidirectional mapping, persistence
│
├── BUILD KNOWLEDGE NETWORK
│   └── Load: references/03-network-formation.md
│       └── Node creation, edge formation, traversal
│
├── RETRIEVE KNOWLEDGE (understanding past)
│   ├── Need decision context?
│   │   └── Load: references/02-session-linking.md
│   │       └── Find session from commit, commit from session
│   │
│   ├── Need evolution history?
│   │   └── Load: references/04-hierarchy-levels.md
│   │       └── Level 1: Facts, Level 2: Decisions
│   │
│   └── Need semantic patterns?
│       └── Load: references/03-network-formation.md
│           └── Pattern extraction, network traversal
│
└── RESTORE SESSION (after context loss)
    └── Load: references/02-session-linking.md + 04-hierarchy-levels.md
        └── Resume point determination
```

### Reference Summary Table

| Reference | Purpose | Load When |
|-----------|---------|-----------|
| `01-intent-encoding.md` | How to encode intent | Making commits, need to capture decision |
| `02-session-linking.md` | Session↔Commit mapping | Resuming, need to trace decisions |
| `03-network-formation.md` | Knowledge graph construction | Building networks, extracting patterns |
| `04-hierarchy-levels.md` | Knowledge hierarchy traversal | Retrieving specific knowledge levels |

## NO-LOAD Rules

**DO NOT activate when:**
- Context depth exceeds 70% — knowledge operations will exhaust context
- Simple `git log` query without semantic analysis needed
- Another git-atomic-memory instance is already running
- Stack budget exhausted (3 skills already loaded)

**FAIL signals — stop immediately when:**
- No `.git` directory exists
- No commits in repository
- Session state is "degraded" → defer to context-intelligence-entry first
- Trust score < 0.6 → knowledge may be unreliable

## Skill Chaining

### Dependency Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL DEPENDENCY CHAIN                       │
├─────────────────────────────────────────────────────────────────┤
│
│   BEFORE git-atomic-memory loads:                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. context-intelligence-entry (P1)                    │   │
│   │    → Validates session state                            │   │
│   │    → Checks rot level                                   │   │
│   │    → Sets action gates                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│   git-atomic-memory (P2) ──────────────────────────────────┐   │
│   → Encodes commit intent                                    │   │
│   → Links sessions to commits                                 │   │
│   → Forms knowledge networks                                  │   │
│                           │                                   │   │
│                           ▼                                   │   │
│   ENABLES:                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ session-memory-resume (P2)                               │   │
│   │    → Depends on git-atomic-memory anchors                │   │
│   │    → Uses session linking for resume                     │   │
│   │    → Restores trajectory from commit network              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   COMPLEMENTS:                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ • git-advanced-workflows: Operations layer (rebase, etc)│   │
│   │ • conventional-commit: Formatting layer (messages)        │   │
│   │ • delegation-handoff: Uses anchors for handoff           │   │
│   └─────────────────────────────────────────────────────────┘   │
│
└─────────────────────────────────────────────────────────────────┘
```

### Cross-Skill Trigger Mapping

| Trigger Type | Skill | Reference |
|--------------|-------|-----------|
| "resume session" | git-atomic-memory + session-memory-resume | 02, 04 |
| "trace decision" | git-atomic-memory + delegation-handoff | 02, 03 |
| "context lost" | context-intelligence-entry + git-atomic-memory | 02 |
| "link handoff" | delegation-handoff + git-atomic-memory | 02 |

## Sub-Session vs Main-Session Behavior

### Main Session (Orchestrator/Primary)

**Responsibilities:**
- Encode intent on commits
- Create semantic anchors
- Build knowledge networks
- Link delegations to commits

**Entry Actions:**
1. Check session state via context-intelligence-entry
2. If NEW: Prepare intent encoding for first commit
3. If RESUMED: Retrieve existing anchors
4. Build knowledge network from commits

### Sub-Session (Delegated Task)

**Responsibilities:**
- Retrieve parent session decisions via commit links
- Resume from parent's semantic anchors
- Report findings linked to commit context

**Entry Actions:**
1. Detect delegation via delegation-handoff
2. Retrieve parent_session_id
3. Query git for parent's commit anchors
4. Build sub-session knowledge from parent's network

```
Main Session                          Sub-Session
┌─────────────────┐                  ┌─────────────────┐
│ Makes commit    │                  │ Receives task   │
│ abc123         │                  │                 │
│ Intent: auth   │                  │                 │
│ Session: ses_A │ ──delegation──→ │ Links to abc123 │
└─────────────────┘                  │ Retrieves intent │
                                   │ auth            │
                                   └─────────────────┘
```

## Semantic Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE NETWORK                            │
├─────────────────────────────────────────────────────────────────┤
│
│   NODE TYPES:                                                    │
│   ┌─────────────┐  Commit anchor (immutable)                    │
│   │   abc123    │  Session anchor (mutable)                     │
│   └──────┬──────┘  Decision node (immutable)                     │
│          │        Pattern node (derived)                         │
│          │                                                        │
│   EDGE TYPES:                                                    │
│   ─────────────                                                  │
│   commit→commit  : Evolution chain                              │
│   commit→session : Link to session context                       │
│   session→decision: Session made decision                        │
│   decision→pattern: Decisions form patterns                      │
│                                                                 │
│   TRAVERSAL:                                                     │
│   commit ──→ session ──→ decision ──→ pattern                  │
│     │                                            ▲               │
│     └────────────────────────────────────────────┘                │
│              (Pattern influences future commits)                  │
│
└─────────────────────────────────────────────────────────────────┘
```

## Git Command → Knowledge Retrieval Matrix

| Git Command | Knowledge Type | Retrieval Purpose | Network Link |
|-------------|---------------|------------------|-------------|
| `git log --oneline -5` | Recent Intent | Last 5 decisions | Short-term anchor |
| `git log --grep="intent:"` | Filtered Intent | Decisions by keyword | Semantic search |
| `git show --stat HEAD~1` | Change Context | What changed + why | Change association |
| `git blame -L 10,20 file` | Code Ownership | Who + when + why | Attribution network |
| `git diff HEAD~3..HEAD` | Evolution Path | How code evolved | Temporal chain |
| `git reflog` | Recovery Points | All HEAD movements | Recovery anchors |
| `git log --all --graph` | Branch Topology | Merge history | Network topology |
| `git cherry -v main` | Unmerged Work | Pending contributions | Work queue |
| `git stash list` | Interrupted Work | Suspended contexts | Interruption markers |

## Knowledge Delta Check

**KEEP (Expert Knowledge):**
- Git command → knowledge type mapping
- Semantic network formation rules
- Knowledge hierarchy levels
- Memory anchor encoding schema
- Session-to-commit linking methods
- Intent encoding techniques
- Sub-session retrieval patterns

**DELETE (Redundant):**
- What is a git commit
- How to write commit messages (use `conventional-commit`)
- Git operations (use `git-advanced-workflows`)

**MINIMIZE (Activation):**
- Brief reminder: "Use git for knowledge retrieval"

## References

| Reference | Granularity Trigger |
|-----------|-------------------|
| `references/01-intent-encoding.md` | Making commits, need to capture decision |
| `references/02-session-linking.md` | Resuming, tracing decisions, sub-session retrieval |
| `references/03-network-formation.md` | Building networks, extracting patterns |
| `references/04-hierarchy-levels.md` | Retrieving specific knowledge levels |

## Related Skills

| Skill | Relationship | When to Chain |
|-------|-------------|---------------|
| `context-intelligence-entry` | **DEPENDS_ON** (P1) | Must load first for session validation |
| `session-memory-resume` | **ENABLES** (P2) | Uses anchors from this skill |
| `delegation-handoff` | **COMPLEMENTS** (P1) | Uses anchors for handoff context |
| `git-advanced-workflows` | **COMPLEMENTS** | Operations layer (rebase, bisect) |
| `conventional-commit` | **COMPLEMENTS** | Formatting layer (messages) |

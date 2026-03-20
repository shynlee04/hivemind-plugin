# Git Memory & Delegation Skills Enhancement Plan

**Date:** 2026-03-20
**Status:** Planning
**Lineage:** hiveminder(hivefiver) > skill-writer
**Framework:** HiveMind Context Governance

---

## Executive Summary

This plan addresses critical failures in HiveMind's delegation and memory infrastructure by creating/refactoring skills for:
1. **Git Atomic Commit Memory** - Semantic memory anchors for session continuity
2. **Delegation Handoff Contract** - Fix sub-session recognition failure
3. **Session Memory Resume** - Enable `session_id` retrieval across contexts
4. **Quality Improvement Loop** - Enable iterative learning vs degradation

---

## Phase 1: Domain Knowledge Absorption

### External Skills Analyzed

| Skill | Source | Domain Knowledge Absorbed | Conflict Risk |
|-------|--------|---------------------------|---------------|
| `git-advanced-workflows` | Vercel | Interactive rebase, cherry-pick, bisect, worktrees, reflog | Low - complementary |
| `conventional-commit` | Vercel | Commit message structure, XML workflow | Low - complementary |
| `git-commit` | Global | Commit generation patterns | Medium - overlap with conventional-commit |
| `atomic-commits` | nullswan | Atomic commit patterns | Medium - terminology |
| `memory-reflect` | BasicMachines | Memory reflection patterns | Low - complementary |
| `agent-memory-system` | AdaptationIO | Agent memory architecture | Medium - session_id handling |
| `delegation-core` | Athola | Delegation patterns | High - terminology conflict |
| `delegating-work` | OldWinter | Work delegation | High - terminology conflict |

### Conflict Analysis

**Terminology Conflicts Identified:**

1. **"Delegation"** - Multiple skills use this term differently:
   - `delegation-core`: Core delegation mechanisms
   - `delegating-work`: Work delegation patterns
   - HiveMind's `hivemind-delegate`: Command projection
   - HiveMind's `delegation-intelligence`: Skill for context inheritance
   
   **Resolution:** Use "Handoff" for framework-native delegation, "Delegate" for OpenCode Task tool delegation

2. **"Session"** - Multiple interpretations:
   - OpenCode `session_id`: Runtime session identifier
   - HiveMind session: Context lineage tracking
   - Memory skills:Conversation memory
   
   **Resolution:** Use "SessionLineage" for HiveMind concept, "opencode_session_id" for OpenCode identifier

3. **"Memory"** - Overloaded term:
   - `memory-reflect`: Reflection patterns
   - `agent-memory-system`: Persistent memory storage
   - Git memory: Commit history as semantic anchor
   
   **Resolution:** Use "GitMemoryAnchor" for commit-based memory, "SemanticMemory" for knowledge storage

---

## Phase 2: RED Phase - Failing Scenarios

### Scenario 1: Git Commit Memory Loss (git-atomic-memory)

```markdown
## Failing Scenario: Git Commit Memory Loss

### Input
Agent completes work, makes atomic commits, then context compaction occurs.

### Expected Behavior
Agent should be able to:
1. Retrieve commit history and understand decisions made
2. Link commits to session context and intent
3. Resume from coherent state after `/clear`

### Without Skill
- Commits exist but intent is lost
- No semantic link between commits and session
- Cannot reconstruct "why" decisions were made
- Repeats same investigation after context loss

### Evidence
- Session shows commits but agent asks same questions
- No ability to trace commit → session → intent chain
- Context compaction = complete memory loss

### Severity: HIGH
- Blocked workflows
- Repeated work
- Quality degradation
```

### Scenario 2: Delegation Recognition Failure (delegation-handoff)

```markdown
## Failing Scenario: Delegation Recognition Failure

### Input
Main session delegates task to subagent via Task tool.

### Expected Behavior
Subagent should:
1. Know it is a sub-session from delegation
2. Inherit scope constraints from parent
3. Report results to parent with proper contract
4. Understand its authority boundaries

### Without Skill
- Subagent doesn't know it's delegated
- No scope inheritance
- No proper result handoff
- Parent intent lost after first output
- Creates new sessions instead of resuming

### Evidence
- Subagent acts like primary session
- No delegation scope awareness
- No parent_result reference
- Free-form output without contract

### Severity: CRITICAL
- Delegation doesn't work
- No session continuation
- Quality degrades exponentially
```

### Scenario 3: Session Memory Resume (session-memory-resume)

```markdown
## Failing Scenario: Session Memory Resume

### Input
Agent needs to resume work from previous session or after `/clear`.

### Expected Behavior
Agent should:
1. Use `session_id` to retrieve past session state
2. Load semantic memory from previous session
3. Resume with full context awareness

### Without Skill
- Cannot retrieve past sessions
- No `session_id` utilization
- Every `/clear` = complete restart
- No cross-session memory persistence

### Evidence
- `hivemind_runtime_status` shows session_id but not used
- No retrieval mechanism
- Repeated work across sessions

### Severity: HIGH
- Context loss critical
- No session continuity
- Work not preserved
```

### Scenario 4: Quality Improvement Loop (quality-improvement-loop)

```markdown
## Failing Scenario: Quality Improvement Loop

### Input
Agent makes mistakes, gets feedback, should improve.

### Expected Behavior
Agent should:
1. Capture mistakes as semantic memory
2. Extract patterns from failures
3. Apply learned patterns to future work
4. Show measurable improvement over sessions

### Without Skill
- Same mistakes repeated
- No pattern extraction
- No improvement tracking
- Quality degrades instead of improves

### Evidence
- Repeated same error types
- No pattern learning state
- No confidence scoring
- No iterative refinement

### Severity: MEDIUM
- Quality stagnation
- No compound learning
- Manual rework required
```

---

## Phase 3: Skill Design Requirements

### Skill 1: git-atomic-memory

**Pattern:** P2 (Domain-specific)

**Failing Test:**
```bash
# Without skill
git log --oneline -5
# Output: Shows commits but intent unknown
# Agent asks: "What were we doing?"

# With skill
git-atomic-memory retrieve --session-id ses_123
# Output: [Semantic anchors with intent]
# Agent knows: "Last session implemented auth flow"
```

---

#### Git Command → Knowledge Retrieval Matrix

**Core Principle:** Each git command has a specific knowledge extraction purpose. Use the right command for the right retrieval context.

```markdown
## Git Command Knowledge Matrix

| Git Command | Knowledge Type | Retrieval Purpose | Memory Network |
|-------------|---------------|-------------------|----------------|
| `git log --oneline -5` | Recent Intent | Last 5 decisions | Short-term anchor |
| `git log --grep="intent:"` | Filtered Intent | Decisions by keyword | Semantic search |
| `git show --stat HEAD~1` | Change Context | What changed + why | Change association |
| `git blame -L 10,20 file` | Code Ownership | Who + when + why | Attribution network |
| `git diff HEAD~3..HEAD` | Evolution Path | How code evolved | Temporal chain |
| `git reflog` | Recovery Points | All HEAD movements | Recovery anchors |
| `git log --all --graph` | Branch Topology | Merge history | Network topology |
| `git cherry -v main` | Unmerged Work | Pending contributions | Work queue |
| `git stash list` | Interrupted Work | Suspended contexts | Interruption markers |
| `git bisect log` | Bug Origin | First bad commit | Defect origin |
```

---

#### Semantic Network Formation

**Network Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANTIC MEMORY NETWORK│
├─────────────────────────────────────────────────────────────────┤
│
│   COMMIT ANCHORS (Nodes)│
│   ┌─────────┐┌─────────┐  ┌─────────┐│
│   │ Commit A │───│ Commit B │───│ Commit C ││
│   └────┬────┘  └────┬────┘  └────┬────┘ │
│        │            │            ││
│        ▼            ▼            ▼│
│   ┌─────────────────────────────────────┐│
│   │    SESSION CONTEXT (Edges)│
│   │  - intent: "auth flow implementation"    │
│   │  - session_id: ses_123│
│   │  - trajectory: "implement > test > verify"   │
│   │  - decisions: ["use JWT", "skip refresh"]│
│   └─────────────────────────────────────┘│
│
│   KNOWLEDGE HIERARCHY│
│   ┌─────────────────────────────────────┐│
│   │ Level 3: Semantic Patterns│
│   │   - "When X, then Y" rules│
│   │   - Anti-patterns detected│
│   │   - Success patterns│
│   ├─────────────────────────────────────┤│
│   │ Level 2: Decision Context│
│   │   - Why decisions made│
│   │   - Alternatives considered│
│   │   - Trade-offs accepted│
│   ├─────────────────────────────────────┤│
│   │ Level 1: Factual History│
│   │   - What changed│
│   │   - When changed│
│   │   - Who changed│
│   └─────────────────────────────────────┘│
│
└─────────────────────────────────────────────────────────────────┘
```

---

#### Workflow-Specific Retrieval Patterns

**1. Planning Phase → Retrieve Decision Context**

```bash
# When starting new work, retrieve recent decisions
git log --oneline --grep="decision:" -10

# Extract decision nodes for semantic network
# Output: "Decision: Use JWT for auth (commit abc123)"
# Network: auth → JWT → session_abc123
```

**2. Debugging Phase → Retrieve Bug Origin**

```bash
# When debugging, find defect origin
git bisect startHEAD v1.0.0
git bisect run ./test-failing.sh
# Found: abc123 is first bad commit

# Extract defect pattern for learning
# Network: defect_X → commit_abc123 → session_def123
```

**3. Refactoring Phase → Retrieve Evolution Context**

```bash
# When refactoring, understand evolution
git log --all --graph --oneline -- src/

# Extract evolution chain
# Network: feature_A → refactor_B → optimization_C
```

**4. Delegation Phase → Retrieve Context for Handoff**

```bash
# Before delegating, capture current state
git log --oneline -5 > .hivemind/handoff/commits.md
git diff --stat HEAD > .hivemind/handoff/changes.md

# Create handoff anchor
# Network: handoff_123 → commits → session_abc
```

---

#### Knowledge Hierarchy Across Sessions

**Level 1: Session-Local (Short-term)**
- Current work context
- Active decisions
- Working hypothesis
- **Retrieval:** `git log --oneline -5`

**Level 2: Cross-Session (Medium-term)**
- Recent patterns
- Decision chains
- Problem-solving history
- **Retrieval:** `git log --since="1 week ago"`

**Level 3: Project-Wide (Long-term)**
- Architectural decisions
- Anti-patterns learned
- Success patterns
- **Retrieval:** `git log --all --grep="decision:"`

**Level 4: Network-Wide (Semantic)**
- Cross-project patterns
- Domain knowledge
- Reusable solutions
- **Retrieval:** Semantic search across all commits

---

#### Memory Anchor Encoding Schema

```yaml
# Commit Anchor Schema
commit_anchor:
  hash: abc123def456
  session_id: ses_123
  timestamp: 2026-03-20T10:30:00Z
  
  intent:
    summary: "Implement JWT authentication"
    decision: "Use JWT over session cookies"
    rationale: "Stateless, scalable, mobile-friendly"
    alternatives: ["session cookies", "OAuth-only"]
    
  context:
    trajectory: "implement > test > verify"
    phase: "implementation"
    workflow: "feature-development"
    
  network:
    parent: abc122  # Previous commit in chain
    related: [abc100, abc110]  # Related decisions
    depends_on: []  # Dependencies
    blocks: [abc124]  # What this enables
    
  semantic:
    patterns: ["auth-pattern", "jwt-pattern"]
    anti_patterns: []
    confidence: 0.95
```

---

**Must Have:**
- [ ] Encode commit intent as semantic memory
- [ ] Link commits to session context
- [ ] Enable `session_id` retrieval
- [ ] Provide resume anchor
- [ ] **NEW:** Git command → knowledge type mapping
- [ ] **NEW:** Semantic network formation rules
- [ ] **NEW:** Knowledge hierarchy levels
- [ ] **NEW:** Memory anchor encoding schema

**Must NOT Have:**
- [ ] Duplicate `conventional-commit` functionality
- [ ] Generic git workflow (already in git-advanced-workflows)
- [ ] File-level operations (use existing tools)

**Knowledge Delta:**
| Content | Type | Action |
|---------|------|--------|
| Git command → knowledge mapping | Expert | KEEP |
| Semantic network formation | Expert | KEEP |
| Knowledge hierarchy levels | Expert | KEEP |
| Memory anchor schema | Expert | KEEP |
| How to encode intent in commit metadata | Expert | KEEP |
| Git hooks for memory capture | Expert | KEEP |
| Session-to-commit linking | Expert | KEEP |
| What is git commit | Redundant | DELETE |
| How to write good commit messages | Activation | Keep minimal |

**Stack Budget:** stacking: 0
**Entry Level:** L2 (after git-commit loaded)

---

### Skill 2: delegation-handoff

**Pattern:** P1 (Entry routing)

**Failing Test:**
```bash
# Without skill
# Subagent output: General response without knowing delegation status

# With skill
# Subagent outputs:
# SCOPE DECLARATION:
# - Task: [specific task from delegation]
# - Parent: [parent_session_id]
# - Constraints: [bounds]
# - Success: [criteria]
```

---

#### Delegation Context → Knowledge Inheritance Matrix

**Core Principle:** Delegation transfers knowledge context, not just task assignment.Each delegation type inherits specific knowledge layers.

```markdown
## Delegation Knowledge Inheritance

| Delegation Type | Inherits | Excludes | Network Link |
|----------------|----------|----------|--------------|
| **Investigate** | Context, question | Implementation decisions | parent → investigate_node |
| **Implement** | Design, constraints | Investigation findings | parent → implement_node |
| **Verify** | Acceptance criteria | How it was built | parent → verify_node |
| **Research** | Question, domain | Implementation details | parent → research_node |
| **Plan** | Goals, constraints | Execution details | parent → plan_node |
```

---

#### Handoff Packet Schema

```yaml
# Handoff Packet Schema
handoff_packet:
  version: "1.0"
  created_at: 2026-03-20T10:30:00Z
  
  # Identity
  parent_session_id: ses_parent_123
  child_session_id: ses_child_456
  delegation_type: investigate | implement | verify | research | plan
  
  # Context Inheritance
  inherited_context:
    - parent_trajectory: "implement > test > verify"
    - parent_decisions: ["use JWT", "skip refresh tokens"]
    - parent_constraints: ["mobile-first", "stateless"]
    
  # Scope Boundaries
  scope:
    in_scope:
      - "Investigate authentication flow"
      - "Identify security vulnerabilities"
    out_of_scope:
      - "Implement fixes"
      - "Modify production code"
      
  # Knowledge Network Links
  network:
    parent_anchor: commit_abc123
    related_sessions: [ses_001, ses_002]
    knowledge_hierarchy: 2  # Level 2: Decision Context
    
  # Result Contract
  result_contract:
    format: "structured_report"
    required_fields:
      - "findings"
      - "recommendations"
      - "confidence_score"
    return_to: ses_parent_123
```

---

#### Sub-Session Detection Protocol

**Entry Point Detection:**

```markdown
## Sub-Session Detection Checklist

When entering a session, check for handoff indicators:

1. **Environment Variables:**
   - `PARENT_SESSION_ID` set? → Inherited session
   - `DELEGATION_TYPE` set? → Scoped delegation
   - `HANDOFF_PACKET_PATH` set? → Full handoff

2. **File Indicators:**
   - `.hivemind/handoff/incoming/*.yaml` exists? → Active handoff
   - `.hivemind/sessions/parent_*.json` exists? → Child session

3. **Context Indicators:**
   - Task description starts with "Investigate" / "Implement" / etc?
   - Scope boundaries mentioned?
   - Return format specified?

4. **Network Indicators:**
   - Parent anchor exists in commits?
   - Related sessions in knowledge network?
```

---

#### Delegation Knowledge Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELEGATION KNOWLEDGE NETWORK│
├─────────────────────────────────────────────────────────────────┤
│
│   LEVEL 3: Strategic Intent│
│   - Why delegate?│
│   - What outcome expected?│
│   - How results integrate?│
│
│   LEVEL 2: Tactical Context│
│   ├── Parent Session│
│   │   ├── Trajectory state│
│   │   ├── Decisions made│
│   │   └── Constraints active│
│   ││
│   ├── Child Session│
│   │   ├── Scope received│
│   │   ├── Task assigned│
│   │   └── Success criteria│
│   │
│   LEVEL 1: Operational Data│
│   ├── Files to investigate│
│   ├── Code to implement│
│   └── Tests to verify│
│
└─────────────────────────────────────────────────────────────────┘
```

---

**Must Have:**
- [ ] Detect `subagent_type` from Task tool invocation
- [ ] Read handoff packet from context
- [ ] Declare scope immediately upon entry
- [ ] Set up result contract for parent return
- [ ] **NEW:** Knowledge inheritance by delegation type
- [ ] **NEW:** Handoff packet schema
- [ ] **NEW:** Sub-session detection protocol
- [ ] **NEW:** Delegation knowledge hierarchy

**Must NOT Have:**
- [ ] Duplicate `delegation-scope.md` reference content
- [ ] Generic delegation patterns (already exist)
- [ ] OpenCode Task tool replacement

**Knowledge Delta:**
| Content | Type | Action |
|---------|------|--------|
| Delegation type → knowledge mapping | Expert | KEEP |
| Handoff packet schema | Expert | KEEP |
| Sub-session detection protocol | Expert | KEEP |
| Delegation knowledge hierarchy | Expert | KEEP |
| How to parse HandoffSkill packet | Expert | KEEP |
| How to detect subagent status | Expert | KEEP |
| Result contract structure | Expert | KEEP |
| What is delegation | Redundant | DELETE |
| Generic scope rules | Covered by reference | Link only |

**Stack Budget:** stacking: 0 (P1 router)
**Entry Level:** L1

---

### Skill 3: session-memory-resume

**Pattern:** P2 (Domain-specific)

**Failing Test:**
```bash
# Without skill
/session_resume ses_123
# Output: "No session found" or generic response

# With skill
/session_resume ses_123
# Output:
# SESSION RESUMED: ses_123
# Last state: [trajectory, tasks completed]
# Semantic anchors loaded: [count]
# Context restored: [summary]
```

---

#### Session State → Knowledge Retrieval Matrix

**Core Principle:** Session resume retrieves knowledge from storage, not from compaction recovery. Each session state file maps to specific knowledge types.

```markdown
## Session State Knowledge Types

| State File | Knowledge Type | Retrieval Purpose | Network Link |
|------------|----------------|-------------------|---------------|
| `session.json` | Session Context | Trajectory, decisions, state | session_node |
| `trajectory.json` | Work Path | Current work, next steps | trajectory_chain |
| `decisions.json` | Decision Log | Choices made, rationale | decision_network |
| `anchors.json` | Semantic Anchors | Commit links, memory refs | anchor_nodes |
| `handoff.json` | Delegation State | Parent/child relationships | delegation_graph |
```

---

#### Session Resume Protocol

**Resume Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION RESUME FLOW│
├─────────────────────────────────────────────────────────────────┤
│
│   PHASE 1: Discovery│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Read session_id from arg or environment│   │
│   │ 2. Locate session files in .hivemind/states/│  │
│   │ 3. Validate session integrity│   │
│   └─────────────────────────────────────────────────────────┘   │
│
│   PHASE 2: Knowledge Loading│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Load session.json → Session context│   │
│   │ 2. Load trajectory.json → Work path│   │
│   │ 3. Load decisions.json → Decision network│   │
│   │ 4. Load anchors.json → Semantic memory│   │
│   └─────────────────────────────────────────────────────────┘   │
│
│   PHASE 3: Network Reconstruction│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Build knowledge graph from anchors│   │
│   │ 2. Link commits to decisions│   │
│   │ 3. Restore hierarchy levels│   │
│   │ 4. Validate network integrity│   │
│   └─────────────────────────────────────────────────────────┘   │
│
│   PHASE 4: Context Injection│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Inject session context into agent│   │
│   │ 2. Set current trajectory position│   │
│   │ 3. Restore decision chain│   │
│   │ 4. Activate semantic memories│   │
│   └─────────────────────────────────────────────────────────┘   │
│
│   OUTPUT: Resume Point Report│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - Session ID: ses_123│   │
│   │ - Trajectory: implement > test > verify│   │
│   │ - Current Phase: test│   │
│   │ - Decisions Loaded: 5│   │
│   │ - Semantic Anchors: 12│   │
│   │ - Network Links: 23│   │
│   │ - Resume Point: "Start testing auth flow"│   │
│   └─────────────────────────────────────────────────────────┘   │
│
└─────────────────────────────────────────────────────────────────┘
```

---

#### Knowledge Network Across Sessions

**Network Topology:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-SESSION KNOWLEDGE NETWORK│
├─────────────────────────────────────────────────────────────────┤
│
│   SESSION CHAIN (Temporal)│
│   ┌─────────┐  ┌─────────┐  ┌─────────┐│
│   │ ses_001 │──│ ses_002 │──│ ses_003 ││
│   │ (plan)│  │(implement)│  │ (verify)││
│   └────┬────┘  └────┬────┘  └────┬────┘ │
│        │            │            ││
│        │KNOWLEDGE   │KNOWLEDGE   │ KNOWLEDGE │
│        │TRANSFER│   │TRANSFER    │TRANSFER   │
│        ▼            ▼            ▼│
│   ┌─────────────────────────────────────┐│
│   │    SEMANTIC MEMORY (Persistent)│
│   ├── Commit Anchors│
│   │   ├── abc123: "JWT decision"│
│   │   ├── abc124: "Test coverage"│
│   │   └── abc125: "Security review"│
│   ├── Decision Nodes│
│   │   ├── "Use JWT over cookies"│
│   │   ├── "Skip refresh tokens"│
│   │   └── "Add rate limiting"│
│   ├── Pattern Nodes│
│   │   ├── "Auth pattern: stateless"│
│   │   └── "Test pattern: integration first"│
│   └─────────────────────────────────────┘│
│
└─────────────────────────────────────────────────────────────────┘
```

---

#### Resume Point Determination

**Algorithm:**

```python
def determine_resume_point(session):
    # 1. Check last activity
    last_activity = session.get_last_activity()
    
    # 2. Check trajectory position
    trajectory = session.get_trajectory()
    current_phase = trajectory.get_current_phase()
    
    # 3. Check pending tasks
    pending = session.get_pending_tasks()
    
    # 4. Check decision state
    decisions = session.get_uncommitted_decisions()
    
    # 5. Determine resume point
    if decisions:
        return f"Commit decision: {decisions[0]}"
    elif pending:
        return f"Continue: {pending[0]}"
    else:
        return f"Next phase: {trajectory.get_next_phase()}"
```

---

**Must Have:**
- [ ] Read session state from `.hivemind/states/`
- [ ] Load semantic anchors from session
- [ ] Restore trajectory context
- [ ] Provide resume point
- [ ] **NEW:** Session state →knowledge type mapping
- [ ] **NEW:** 4-phase resume protocol
- [ ] **NEW:** Cross-session network topology
- [ ] **NEW:** Resume point determination algorithm

**Must NOT Have:**
- [ ] Duplicate `context-intelligence-entry` functionality
- [ ] Generic context management
- [ ] Trajectory building (already exists)

**Knowledge Delta:**
| Content | Type | Action |
|---------|------|--------|
| Session state → knowledge mapping | Expert | KEEP |
| Resume protocol phases | Expert | KEEP |
| Cross-session network topology | Expert | KEEP |
| Resume point algorithm | Expert | KEEP |
| Session state file structure | Expert | KEEP |
| Semantic anchor format | Expert | KEEP |
| Resume protocol | Expert | KEEP |
| What is context | Redundant | DELETE |
| Session basics | Covered by context-intelligence | Link only |

**Stack Budget:** stacking: 0
**Entry Level:** L2 (after context-intelligence-entry)

---

### Skill 4: quality-improvement-loop

**Pattern:** P2 (Domain-specific)

**Failing Test:**
```bash
# Without skill
# Session 1: Makes error X
# Session 2: Makes error X again (no memory)

# With skill
# Session 1: Makes error X → Captured as pattern
# Session 2: Checks patterns → Avoids error X
# Output: "Pattern X detected, applying learned fix"
```

---

#### Pattern Extraction → Knowledge Network Matrix

**Core Principle:** Failures become patterns, patterns become knowledge, knowledge becomes prevention. Each pattern type maps to specific learning actions.

```markdown
## Pattern Type → Learning Action

| Pattern Type | Extraction | Storage | Retrieval | Prevention |
|--------------|------------|---------|-----------|------------|
| **Error Pattern** | Failure log | `.hivemind/patterns/errors/` | Confidence >0.8| Pre-check |
| **Anti-Pattern** | Code review | `.hivemind/patterns/anti/` | Confidence >0.7| Warning |
| **Success Pattern** | Completion | `.hivemind/patterns/success/` | Confidence >0.9| Suggestion |
| **Decision Pattern** | Choice log | `.hivemind/patterns/decisions/` | Confidence >0.6| Context |
```

---

#### Learning Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY IMPROVEMENT LOOP│
├─────────────────────────────────────────────────────────────────┤
│
│   PHASE 1: CAPTURE│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - Hook: on_task_failure│   │
│   │ - Hook: on_code_review_rejection│   │
│   │ - Hook: on_test_failure│   │
│   │ - Extract: Error type, context, cause│   │
│   └─────────────────────────────────────────────────────────┘   │
││
│   PHASE 2: EXTRACT                                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - Parse error into pattern components│   │
│   │ - Identify: Error signature│   │
│   │ - Context: Where it occurred│   │
│   │ - Cause: Why it occurred│   │
│   │ - Fix: How it was resolved│   │
│   └─────────────────────────────────────────────────────────┘   │
││
│   PHASE 3: STORE                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - Location: `.hivemind/patterns/{type}/`│   │
│   │ - Format: YAML with confidence score│   │
│   │ - Index: Add to pattern network│   │
│   │ - Link: Connect to related patterns│   │
│   └─────────────────────────────────────────────────────────┘   │
││
│   PHASE 4: APPLY                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - On new task: Query pattern network│   │
│   │ - Match: Similarity search│   │
│   │ - Filter: Confidence > threshold│   │
│   │ - Act: Pre-check or warning or suggestions│   │
│   └─────────────────────────────────────────────────────────┘   │
│
│   IMPROVEMENT METRICS:│
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ - Pattern Hit Rate: How often patterns match│   │
│   │ - Prevention Rate: How often patterns prevent errors│   │
│   │ - Learning Velocity: Patterns captured per session│   │
│   │ - Confidence Trend: Average confidence over time│   │
│   └─────────────────────────────────────────────────────────┘   │
│
└─────────────────────────────────────────────────────────────────┘
```

---

#### Pattern Network Formation

**Network Structure:**

```yaml
# Pattern Node Schema
pattern_node:
  id: pat_abc123
  type: error | anti | success | decision
  confidence: 0.85
  
  # Extraction
  extracted_from:
    - session: ses_001
      commit: abc123
      timestamp: 2026-03-20T10:30:00Z
  
  # Pattern Signature
  signature:
    error_type: "TypeMismatchError"
    context: "function argument validation"
    cause: "missing type guard"
    
  # Resolution
  resolution:
    fix: "Add type guard before function call"
    prevention: "Check types at function boundary"
    
  # Network Links
  network:
    related_patterns: [pat_abc100, pat_abc110]
    super_pattern: pat_root_type_errors
    sub_patterns: [pat_abc124]
    
  # Confidence Scoring
  scoring:
    initial: 0.7
    hits: 5# Times pattern matched
    misses: 1# Times pattern missed
    current: 0.85  # (hits / (hits + misses)) * initial + ...
```

---

#### Confidence Scoring Algorithm

```python
def calculate_confidence(pattern):
    """
    Confidence = (Base *Experience * Relevance) walls
    
    Where:
    - Base: Initial confidence from extraction quality
    - Experience: Hit/(Hit+Miss) ratio
    - Relevance: How recent the pattern is
    """
    base = pattern.initial_confidence
    hits = pattern.hit_count
    misses = pattern.miss_count
    
    # Experience factor
    if hits + misses > 0:
        experience = hits / (hits + misses)
    else:
        experience = 0.5
    
    # Relevance factor (decay over time)
    age_days = (now - pattern.last_updated).days
    relevance = math.exp(-age_days / 30)  # 30-day half-life
    
    # Final confidence
    confidence = base * experience * relevance
    
    return min(confidence, 1.0)
```

---

#### Pattern Application Triggers

**When to Apply Patterns:**

```markdown
## Pattern Application Triggers

| Trigger | Pattern Types | Action |
|---------|---------------|--------|
| **Before Implementation** | Success patterns | Suggest approaches |
| **During Implementation** | Error patterns | Pre-check for known errors |
| **Before Commit** | Anti-patterns | Warning for anti-patterns |
| **During Review** | Decision patterns | Context for decisions |
| **After Failure** | Error patterns | Learning cycle |

## Application Flow

1. **Query Pattern Network**
   - Search: signature similarity
   - Filter: confidence > threshold
   - Rank: by relevance and confidence

2. **Format Output**
   - Warning: "Pattern X detected (confidence: 0.85)"
   - Suggestion: "Consider Y based on pattern Z"
   - Pre-check: "Checking for pattern X..."

3. **Update Pattern**
   - On match: Increment hit count
   - On miss: Increment miss count
   - On resolution: Add resolution to pattern
```

---

**Must Have:**
- [ ] Capture failure patterns
- [ ] Extract semantic patterns
- [ ] Store with confidence scores
- [ ] Apply patterns when confidence > 0.8
- [ ] **NEW:** Pattern type → learning action mapping
- [ ] **NEW:** 4-phase learning loop
- [ ] **NEW:** Pattern network formation
- [ ] **NEW:** Confidence scoring algorithm
- [ ] **NEW:** Pattern application triggers

**Must NOT Have:**
- [ ] Duplicate `self-improving-agent` functionality
- [ ] Generic error handling
- [ ] Learning theory content

**Knowledge Delta:**
| Content | Type | Action |
|---------|------|--------|
| Pattern type → learning action | Expert | KEEP |
| Learning loop phases | Expert | KEEP |
| Pattern network schema | Expert | KEEP |
| Confidence scoring algorithm | Expert | KEEP |
| Pattern application triggers | Expert | KEEP |
| Pattern extraction from failures | Expert | KEEP |
| Confidence scoring | Expert | KEEP |
| Hook integration for capture | Expert | KEEP |
| What is improvement | Redundant | DELETE |
| Self-improvement theory | Covered by self-improving-agent | Link only |

**Stack Budget:** stacking: 0
**Entry Level:** L2

---

## Phase 4: Conflict Prevention Matrix

### Skill Overlap Analysis

| New Skill | Overlaps With | Overlap Type | Resolution |
|-----------|--------------|--------------|-------------|
| git-atomic-memory | git-commit | Border | Different focus (memory vs message) |
| git-atomic-memory | conventional-commit | Border | Different focus (intent vs format) |
| git-atomic-memory | git-advanced-workflows | No overlap | Different domain |
| delegation-handoff | delegation-skill (if exists) | Exact | Consolidate or differentiate |
| delegation-handoff | delegation-scope.md | Complementary | Reference, not duplicate |
| session-memory-resume | context-intelligence-entry | Border | Different pattern levels |
| quality-improvement-loop | self-improving-agent | Extends | Parent/child relationship |

### Terminology Resolution

| Term | Usage | Scope |
|------|-------|-------|
| **Handoff** | Delegation contract between sessions | HiveMind-specific |
| **Delegate** | OpenCode Task tool invocation | Framework-agnostic |
| **SessionLineage** | HiveMind session context | HiveMind-specific |
| **opencode_session_id** | OpenCode session identifier | Frameowork-agnostic |
| **GitMemoryAnchor** | Commit-based semantic memory | HiveMind-specific |
| **SemanticMemory** | Knowledge storage | Framework-agnostic |

---

## Phase 5: Implementation Sequence

### Batch 1: git-atomic-memory (Foundation)

**TDD Cycle:**
1. **RED:** Document failing scenario (Scenario 1)
2. **GREEN:** Write minimal skill to pass
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/git-atomic-memory/SKILL.md`
- `.opencode/skills/git-atomic-memory/references/01-intent-encoding.md`
- `.opencode/skills/git-atomic-memory/references/02-session-linking.md`
- `.opencode/skills/git-atomic-memory/scripts/commit-encoder.sh` (optional)

**Dependencies:** git-commit skill (global)

### Batch 2: delegation-handoff (Critical)

**TDD Cycle:**
1. **RED:** Document failing scenario (Scenario 2)
2. **GREEN:** Write minimal skill to pass
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/delegation-handoff/SKILL.md`
- `.opencode/skills/delegation-handoff/references/handoff-packet-schema.md`

**Dependencies:** context-intelligence-entry (P1)

### Batch 3: session-memory-resume

**TDD Cycle:**
1. **RED:** Document failing scenario (Scenario 3)
2. **GREEN:** Write minimal skill to pass
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/session-memory-resume/SKILL.md`
- `.opencode/skills/session-memory-resume/references/session-state-schema.md`

**Dependencies:** context-intelligence-entry (P1)

### Batch 4: quality-improvement-loop

**TDD Cycle:**
1. **RED:** Document failing scenario (Scenario 4)
2. **GREEN:** Write minimal skill to pass
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/quality-improvement-loop/SKILL.md`
- `.opencode/skills/quality-improvement-loop/references/pattern-extraction.md`

**Dependencies:** self-improving-agent (P2)

---

## Phase 6: Verification Criteria

### Skill-Judge Thresholds (All Must Pass)

| Skill | Trigger ≥3.0 | Action ≥4.0 | Ref ≥3.0 | Non-Red ≥3.0 | Edge ≥3.0 | Overall ≥3.5 |
|-------|-------------|-------------|---------|--------------|-----------|---------------|
| git-atomic-memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| delegation-handoff | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| session-memory-resume | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| quality-improvement-loop | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Non-Breaking Tests

- [ ] GSD workflows unaffected
- [ ] Noadded ceremony
- [ ] Stack budget ≤3
- [ ] All existing skills still work

---

## Risk Assessment

### High Risk
- Terminology confusion between HiveMind and global skills
- Stack overflow if all skills load simultaneously
- Session state file schema changes

### Mitigation
- Explicit terminology resolution in each skill
- Stack budget enforcement in SKILL.md frontmatter
- Schema versioning in session state

---

## Delegation Instructions

When delegating to `general` agent for implementation:

1. **Include this plan document** as the authoritative specification
2. **Specify batch number** to work on (start with Batch 1)
3. **Require TDD cycle** - RED first, then GREEN, then REFACTOR
4. **Enforce Skill-Judge validation** before claiming completion
5. **Run verification commands**:
   ```bash
   npx skill-review <skill-name>
   npx skill-judge <skill-name>
   ```

6. **Report format required:**
   - RED phase: Failing scenario documented
   - GREEN phase: Skill created, test passes
   - REFACTOR phase: Skill-Judge score ≥3.5

---

## References

- `hivemind-skill-writer/references/01-skill-anatomy.md`
- `hivemind-skill-writer/references/04-tdd-workflow.md`
- `hivemind-skill-writer/references/05-skill-quality-matrix.md`
- `hivemind-skill-writer/references/08-conflict-detection.md`
- `context-intelligence-entry/references/delegation-scope.md`
- External: `git-advanced-workflows/SKILL.md`
- External: `conventional-commit/SKILL.md`

---

## Status: Batch 1 Corrections Applied

### Critical Fix Applied (2026-03-20)

**Issue Identified:** YAML frontmatter in hivemind-skill-writer references containedFORBIDDEN fields thatbreak cross-platform compatibility.

**Root Cause:** The `02-frontmatter-standard.md` reference file documented a complete schema with `version`, `framework`, `pack`, `entry-level`, `pattern`, `stacking`, `owner`, `status`, `tags`, `depends-on` - all of which are **FORBIDDEN** in YAML frontmatter.

**Correct Standard:** YAMLfrontmatter mustONLY contain:
- `name` (required)
- `description` (required)

All other fields belong in the SKILL.md body, NOT in frontmatter.

**Files Fixed:**
1. `.opencode/skills/hivemind-skill-writer/references/02-frontmatter-standard.md` - Completely rewritten with correct schema
2. `.opencode/skills/hivemind-skill-writer/references/01-skill-anatomy.md` - Updated minimum frontmatter example
3. `knowledge-of-skill-for-HIVEMIND-meta-builder.md` - Added CRITICAL frontmatter rule section

**Verification:**
- skill-judge evaluation shows git-atomic-memory frontmatter is correct (only name + description)
- hivemind-skill-writer references now teach correct frontmatter standards

---

### Batch1 Status: Corrections Complete, Ready for Testing

The git-atomic-memory skill has correct frontmatter. The plan is ready for incremental batch execution with the corrected skill-writer references.

**Next Steps:**
1. User manually places corrected skill in `.opencode/`
2. User restarts session with handoff knowledge
3. Launch `general` agent with test case for Batch 1
4. Verify skill passes Skill-Judge ≥3.5
5. Update plan document with Batch 1 results
6. Proceed to Batch 2 (delegation-handoff)

---

This plan is ready for incremental batch execution. Each batch should be completed and audited before proceeding to the next.
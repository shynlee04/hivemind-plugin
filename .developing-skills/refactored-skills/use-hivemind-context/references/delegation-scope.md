# Delegation Scope Rules

## Scope Inheritance Matrix

| Element | Inherit? | Rationale |
|---------|----------|-----------|
| Task description | YES | Core mandate - what to do |
| Constraints | YES | Operating bounds - limits |
| Success criteria | YES | Target definition - when done |
| Parent session state | NO | Privacy, isolation |
| Unrelated context | NO | Scope containment |
| Authority to delegate further | NO | Chain of command |
| Parent's internal doubts | NO | Noise reduction |
| Parent's failures | NO | Fresh start |
| Parent's tool preferences | OPTIONAL | May override |

---

## Scope Declaration Protocol

### Receiving Delegation

When receiving delegated scope, immediately declare:

```
SCOPE DECLARATION:
- Task: [specific task from delegation]
- Constraints: [bounds from delegation]
- Success: [measurable outcome from delegation]
- Duration: [expected scope lifetime]
- Boundaries: [what is NOT in scope]
- Inherited: [what is inherited from parent]
- Own: [what this agent owns]
```

### Granting Delegation

When delegating to subagent, provide:

```
SCOPE GRANT:
- Agent: [subagent identifier]
- Task: [specific task to perform]
- Constraints: [bounds + authority level]
- Success: [measurable outcome expected]
- Reporting: [how and when to report back]
- Resources: [what can be accessed]
- Duration: [how long this delegation is valid]
```

---

## Chain of Command

### Authority Levels

| Level | Role | Can Delegate | Scope |
|-------|------|--------------|-------|
| 0 | User | All authority | Project-level |
| 1 | Orchestrator | Within bounds | Workflow-level |
| 2 | Planner | Planning subtasks | Phase-level |
| 3 | Executor | None (leaf) | Task-level |
| 4 | Verifier | None (leaf) | Verification-level |

### Delegation Chain Rules

1. **Authority can only delegate what it received**
   - Cannot grant broader scope than owns
   - Cannot delegate authority not granted

2. **Each level adds specificity, not breadth**
   - Parent: "Implement authentication"
   - Child: "Implement JWT validation for API endpoints"
   - NOT: "Implement payment system also"

3. **Chain must be traceable**
   - Every delegation has parent reference
   - Can walk back to original authority
   - No orphan delegations

4. **No upward delegation**
   - Cannot delegate back to parent
   - Cannot escalate scope without parent action

---

## Scope Anti-Patterns

### Scope Bleed

**Definition:** Parent context leaking into subagent scope.

**Symptoms:**
- Subagent acting on parent's unrelated tasks
- Using parent's preferences not in scope
- Referencing parent's context not delegated

**Prevention:**
- Explicit boundary declaration
- Scope audit at delegation start
- Clear "NOT in scope" list

**Example:**
```
DELEGATED: Implement user authentication
BLEED: Parent was also working on payment system
PROBLEM: Subagent references payment tables
```

### Scope Creep

**Definition:** Subagent taking initiative beyond granted scope.

**Symptoms:**
- Adding tasks not in original delegation
- Extending duration without permission
- Reporting outcomes outside scope

**Prevention:**
- Explicit scope boundaries
- Regular scope check
- Default to "ask" when uncertain

**Example:**
```
DELEGATED: Add email field to user table
CREEP: Also added phone field because "it made sense"
PROBLEM: Wasn't asked, wasn't reported
```

### Scope Abandonment

**Definition:** Subagent ignoring constraints or leaving scope incomplete.

**Symptoms:**
- Not completing all delegated tasks
- Acting outside boundaries
- Failing to report back

**Prevention:**
- Completion criteria in delegation
- Reporting requirements
- Timeout mechanism

**Example:**
```
DELEGATED: Create 5 test cases for login
ABANDONMENT: Created 2, ignored rest
PROBLEM: Incomplete handoff
```

### Scope Conflict

**Definition:** Multiple delegations with overlapping or contradictory scopes.

**Symptoms:**
- Two subagents working on same thing
- Contradictory requirements
- Resource contention

**Prevention:**
- Central scope registry
- Conflict detection before delegation
- Priority escalation path

**Example:**
```
DELEGATION 1: Refactor user service for performance
DELEGATION 2: Add new features to user service
PROBLEM: Simultaneous conflicting changes
```

---

## Scope Verification Checklist

Before working on delegated task:

- [ ] Task definition is clear
- [ ] Constraints are explicit
- [ ] Success criteria are measurable
- [ ] Duration/timeline is defined
- [ ] Boundaries (NOT in scope) are listed
- [ ] Reporting requirements are known
- [ ] Resources needed are accessible
- [ ] Authority level is understood

---

## Scope Boundary Declaration Template

```
## Scope: [Task Name]

### In Scope
- [Explicit in-scope item 1]
- [Explicit in-scope item 2]
- [Explicit in-scope item 3]

### Out of Scope
- [Explicit out-of-scope item 1]
- [Explicit out-of-scope item 2]

### Constraints
- [Constraint 1: time/budget/tech]
- [Constraint 2: compatibility/standards]

### Success Criteria
- [Measurable criterion 1]
- [Measurable criterion 2]

### Authority Level
- Can: [what this scope allows]
- Cannot: [what requires escalation]

### Reporting
- Update: [frequency]
- Format: [expected format]
- To: [who receives reports]
```
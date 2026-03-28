# Acceptance Criteria Patterns — Given/When/Then

Structured acceptance criteria using Given/When/Then (GWT) format. Every functional requirement must have at least one GWT criterion.

## Golden Rules

1. **One assertion per GWT.** Multiple assertions mean multiple criteria. Split them.
2. **No implementation details.** The criterion describes behavior, not code. "Then the file downloads" not "Then fetch() is called with URL /api/export."
3. **Testable independently.** Each GWT must be runnable in isolation. If it depends on another criterion's execution order, add an explicit sequencing precondition.

---

## Functional GWT

Given [precondition], When [action], Then [expected result]

For features where a user or system performs an action and a specific outcome occurs.

### Template

```markdown
**Given** [the system is in state X]
**When** [user/system performs action Y]
**Then** [observable outcome Z occurs]
```

### Examples

**Example 1 — CSV Export**
```markdown
Given the user has a dataset with 10,000 rows
When the user clicks "Export as CSV"
Then a CSV file downloads within 2 seconds containing all 10,000 rows
```

**Example 2 — Form Validation**
```markdown
Given the registration form is displayed
When the user submits with an empty email field
Then the email field shows the error "Email is required" and the form is not submitted
```

**Example 3 — Permission Gate**
```markdown
Given the user has "viewer" role
When the user clicks "Delete Project"
Then the delete action is blocked and the message "Insufficient permissions" is displayed
```

### Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| "Then the system works correctly" | Not observable or measurable | Specify the exact state change |
| "Then the API is called" | Implementation detail, not behavior | Describe the outcome the API achieves |
| "Given the app is running" | Trivial precondition | Use the meaningful precondition (user state, data state) |

---

## Non-Functional GWT

Given [system state], When [load/stress condition], Then [performance threshold]

For constraints on how the system performs under specific conditions.

### Template

```markdown
**Given** [the system has data/state X]
**When** [load/stress condition Y is applied]
**Then** [performance metric meets threshold Z]
```

### Examples

**Example 1 — Response Time**
```markdown
Given 1,000 users are concurrently active
When any user requests the dashboard
Then the response returns within 200ms at p95 latency
```

**Example 2 — Throughput**
```markdown
Given the export queue has 50 pending jobs
When the export worker processes the queue
Then all 50 jobs complete within 5 minutes (sustained 10 jobs/min throughput)
```

**Example 3 — Resource Limit**
```markdown
Given the service is running with 512MB memory allocation
When a single export processes 100k rows
Then memory usage stays below 480MB and no OOM error occurs
```

### Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| "Then it's fast" | Undefined threshold | Specify p95 latency or max duration |
| "Given zero load" | Unrealistic baseline | Use a realistic concurrent load number |
| No resource context | Missing system constraints | Include memory/CPU/instance count |

---

## Integration GWT

Given [system A state], When [API call / event from A], Then [system B state changes]

For cross-system interactions where an action in one system triggers a verified change in another.

### Template

```markdown
**Given** [system A is in state X]
**When** [trigger event Y occurs in system A]
**Then** [system B reflects state Z]
```

### Examples

**Example 1 — Webhook Delivery**
```markdown
Given the analytics service has registered a webhook for "export_complete"
When a user completes a CSV export
Then the analytics service receives a POST to /webhook/export with the export metadata within 5 seconds
```

**Example 2 — Data Sync**
```markdown
Given the CRM has a contact record for user@example.com
When the user updates their email in the app to new@example.com
Then the CRM contact record reflects the new email within 30 seconds
```

**Example 3 — Auth Flow**
```markdown
Given the user has a valid OAuth token from Provider X
When the user accesses the app's protected endpoint
Then the app validates the token against Provider X's introspection endpoint and grants access
```

### Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| "Then system B is updated" | Which field? What value? | Specify the exact state change observable in system B |
| Missing timeout expectation | Integration failures can hang forever | Add a "within N seconds" clause |
| No error path | What happens when system B is down? | Add a failure GWT for the same integration |

---

## Pattern Selection Guide

| Requirement Type | GWT Pattern | Key Difference |
|-----------------|-------------|----------------|
| User-facing feature | Functional | Action → observable UI/data outcome |
| Performance constraint | Non-functional | Load condition → measured threshold |
| API/webhook/sync | Integration | System A event → System B verified state |
| Error handling | Functional (error variant) | Trigger → error message/rollback |
| Security | Functional + Non-functional | Access control + response time under auth load |

---

## Quality Checklist

Before accepting a GWT criterion, verify:

| Check | Pass Condition |
|-------|---------------|
| Single assertion | One "Then" clause describes exactly one outcome |
| No implementation | No references to function names, API paths, or code artifacts |
| Independent test | Criterion can be tested in isolation without sequencing dependency |
| Specific values | Thresholds use concrete numbers, not "fast" or "reasonable" |
| Observable outcome | The "Then" can be verified by a test, not inferred from behavior |

# EARS Syntax Guide

EARS (Easy Approach to Requirements Syntax) provides structured templates for writing clear, testable, and unambiguous requirements. This reference covers syntax rules, keyword semantics, pattern selection, translation procedures, and anti-patterns.

## Core Principle

Every requirement must answer:
1. **WHAT triggers it** (event, state, condition, or none)
2. **WHICH part of the system** responds
3. **WHAT outcome** the system produces
4. **WITH WHAT constraints** (time, accuracy, scope)

If any of these four elements is missing, the requirement is underspecified.

## EARS Patterns

### 1. Ubiquitous (Unconditional)

Always-true requirements with no trigger condition.

**Template:** `The <system> SHALL <response>.`

```
The authentication system SHALL encrypt all user passwords at rest using bcrypt.
The API SHALL return JSON with Content-Type: application/json for all 200 responses.
The logging service SHALL include correlation-id in every log entry.
```

**When to use:** Infrastructure requirements, data integrity rules, always-on behaviors.

**Diagnostic signal:** An unconditional requirement that fails to specify what "all" means or what "every" covers has a gap.

### 2. Event-Driven

Triggered by an external event or user action.

**Template:** `WHEN <trigger>, the <system> SHALL <response>.`

```
WHEN a user submits the registration form, the system SHALL validate all required fields.
WHEN an order payment is confirmed, the system SHALL emit an OrderPaid event to the message queue.
WHEN the API receives a request without an auth header, the system SHALL return 401 Unauthorized.
```

**When to use:** User interactions, API calls, external system events.

**Diagnostic signal:** An event-driven requirement without specified error paths (what if the event payload is invalid?) has a hidden constraint gap.

### 3. State-Driven

Active while a condition persists.

**Template:** `WHILE <state>, the <system> SHALL <response>.`

```
WHILE a file upload is in progress, the system SHALL display a progress indicator showing percentage complete.
WHILE a user session is active, the system SHALL refresh the session token every 15 minutes.
WHILE the database connection pool is below 5 idle connections, the system SHALL not accept new transaction requests.
```

**When to use:** Session states, modes, in-progress operations, maintenance windows.

**Diagnostic signal:** A state-driven requirement without state exit conditions (when does the state end?) has a missing scope gap.

### 4. Unwanted Behavior (Conditional)

Triggered by an error, failure, or boundary condition.

**Template:** `IF <condition>, THEN the <system> SHALL <response>.`

```
IF a login attempt fails 3 times within 5 minutes, THEN the system SHALL lock the account for 30 minutes.
IF the payment gateway returns a timeout after 10 seconds, THEN the system SHALL mark the order as "payment pending" and retry up to 3 times.
IF a user attempts to access a resource without required permissions, THEN the system SHALL return 403 Forbidden.
```

**When to use:** Error handling, rate limiting, edge cases, security violations.

**Diagnostic signal:** A requirement with no unwanted behavior counterpart is incomplete — every positive requirement needs its negative pair.

### 5. Optional Feature (Conditional-Enabled)

Active only when a feature flag or configuration is enabled.

**Template:** `WHERE <feature> is enabled, the <system> SHALL <response>.`

```
WHERE dark mode is enabled, the system SHALL render all pages using the dark theme color palette.
WHERE two-factor authentication is configured, the system SHALL require a TOTP code after password verification.
WHERE audit logging is active, the system SHALL record every data mutation with user ID and timestamp.
```

**When to use:** Feature flags, configurable behaviors, tiered capabilities.

**Diagnostic signal:** An optional requirement without the default behavior (what happens when disabled?) has a missing scope gap.

### 6. Complex (Multipart)

Combining multiple conditions.

**Template:** `WHILE <state>, WHEN <trigger>, the <system> SHALL <response>.`

```
WHILE in checkout flow, WHEN the user navigates back to the cart, the system SHALL preserve all entered checkout data.
WHILE maintenance mode is active, WHEN an admin accesses the dashboard, the system SHALL display the current maintenance status and allow force-exit.
WHILE the batch job is running, IF memory usage exceeds 80%, THEN the system SHALL throttle new task ingestion by 50%.
```

**When to use:** Complex workflows, multi-condition behaviors, nested states.

**Clause ordering rule:** WHERE → WHILE → WHEN → IF → THE system → SHALL → response.

## SHALL / SHOULD / MAY Semantics

| Keyword | Meaning | When to Use | Diagnostic Signal |
|---|---|---|---|
| **SHALL** | Binding requirement. Must be implemented and verified. | All production requirements except truly optional features. | If you can't say SHALL, the requirement isn't firm enough. |
| **SHOULD** | Recommended but not mandatory. Must have explicit justification for not implementing. | Best practices, accessibility guidelines, UX conventions. | If SHOULD appears without "unless <justification>", it's a vague escape hatch. |
| **MAY** | Optional capability. No obligation to implement. | Nice-to-haves, future enhancements, experimental features. | If MAY appears on a security, data-integrity, or core-functionality requirement, it's a gap. |

**Rule of thumb:** Default to SHALL. Use SHOULD/MAY only when you have explicit stakeholder agreement that non-implementation is acceptable.

## Translation Procedure

When diagnosing a requirement, translate it to EARS to expose gaps:

### Step 1: Extract the Core Statement

> "The dashboard should show real-time metrics."

Core: Dashboard shows metrics in real time.

### Step 2: Identify the Trigger

What causes the dashboard to show metrics? When a page loads? When metrics update? When a user refreshes?

> `WHEN the dashboard page loads` — found trigger.

### Step 3: Identify Missing Elements

- **Which metrics?** — Gap: Missing Scope
- **What does "real-time" mean?** — Gap: Vague (need latency SLO)
- **What if metrics source is down?** — Gap: Hidden Constraint (error handling)

### Step 4: Attempt Full EARS Translation

```
WHEN the dashboard page loads, the system SHALL display [which metrics?]
with data no older than [N seconds], 
refreshing at [N second] intervals,
and IF the metrics source is unavailable, THEN display "Metrics temporarily unavailable" with the last-known value timestamp.
```

Bracketed items are the detected gaps.

### Step 5: Record Gaps

Each bracketed item becomes a gap finding in the diagnostic table.

## Given/When/Then Scenario Format

Every EARS requirement should be accompanied by at least one scenario:

```gherkin
Scenario: Successful login with valid credentials
GIVEN a registered user with email "user@example.com" and password "correct-horse-battery-staple"
AND the account is not locked
WHEN the user submits the login form with correct credentials
THEN the system SHALL return a valid session token
AND the system SHALL redirect to the dashboard

Scenario: Failed login with wrong password
GIVEN a registered user with email "user@example.com"
WHEN the user submits the login form with incorrect password
THEN the system SHALL increment the failed login counter
AND IF the counter reaches 3 within 5 minutes, THEN lock the account
```

**Rule:** Every requirement needs at least one positive scenario and at least one error scenario. If you cannot write the error scenario, the requirement has a hidden constraint gap.

## EARS Completeness Checklist

For each requirement, verify:

- [ ] Trigger clause present (WHEN / WHILE / IF / WHERE) or justified as Ubiquitous
- [ ] Subject identified (which system or component)
- [ ] SHALL used (not SHOULD or MAY unless justified)
- [ ] Response is specific and measurable (not "handle", "process", "manage")
- [ ] At least one positive scenario exists
- [ ] At least one error/edge scenario exists
- [ ] No unbounded adjectives ("fast", "secure", "scalable", "robust", "intuitive")
- [ ] No implementation details ("use React component", "call PostgreSQL function")
- [ ] No compound requirements (split AND/OR into separate statements)

## Anti-Patterns

| Anti-Pattern | Example | Fix |
|---|---|---|
| **Missing trigger** | "The system SHALL validate input." | Add WHEN: "WHEN form is submitted, the system SHALL validate all required fields." |
| **Implementation in requirements** | "WHEN user clicks Submit, the system SHALL call the validateEmail() function from utils.js." | Remove implementation: "...SHALL validate the email format per RFC 5322." |
| **Vague response** | "WHEN error occurs, the system SHALL handle it." | Specify: "...SHALL return error code ERR-001 with message 'Payment gateway timeout' and log the gateway response body." |
| **Compound requirements** | "WHEN order is placed, the system SHALL validate stock AND charge payment AND send confirmation." | Split into three separate EARS statements. |
| **Undefined actors** | "WHEN submitted, the system SHALL process." | Who submits? What is submitted? "WHEN a customer submits the checkout form..." |
| **Missing negative case** | Only happy-path EARS statements. | For every positive EARS, write the unwanted behavior counterpart. |
| **SHOULD on critical path** | "The system SHOULD encrypt passwords." | Change to SHALL. Security, data integrity, and core functionality must use SHALL. |

# Gap Detection Patterns

Every requirement defect falls into one of four gap types. This reference provides detection heuristics, diagnostic templates, and resolution patterns for each.

## The Four Gap Types

```
                    Is the requirement present?
                          /              \
                        YES                 NO
                        /                    \
            Is it self-consistent?        Missing Scope
              /            \
            YES              NO
            /                  \
     Is it precise?      Contradictory
       /        \
     YES         NO
      /            \
  Is it validated?   Vague
   /        \
 YES         NO
   \          /
    \        /
   No gap   Unvalidated Assumption
```

## Gap Type 1: Missing Scope

**Definition:** A requirement describes behavior but omits a critical dimension: actors, inputs, outputs, boundaries, preconditions, postconditions, or error paths.

### Detection Heuristics

Apply these questions to each requirement:

| Dimension | Detection Question | Signal |
|---|---|---|
| **Actor** | Who initiates this? Who receives the result? | No user role, system, or persona specified |
| **Input** | What data enters? From where? In what format? | "users can upload" — what types? size limits? |
| **Output** | What is produced? To where? In what format? | "system generates a report" — what format? where? |
| **Boundary** | What is NOT in scope? What stops here? | No "out of scope" statement for broad requirements |
| **Precondition** | What must be true before this executes? | No prerequisite state described |
| **Postcondition** | What must be true after this executes? | No side-effect or state change documented |
| **Error Path** | What happens when it fails? | Only happy path described |
| **Lifecycle** | Create, read, update, delete — are all covered? | "add a user" but no mention of "remove a user" |

### Diagnostic Template

```
Requirement: [verbatim text]
─────────────────────────────────
ACTOR:      [found / MISSING → specify: ___]
INPUT:      [found / MISSING → specify: ___]
OUTPUT:     [found / MISSING → specify: ___]
BOUNDARY:   [found / MISSING → specify: ___]
PRECONDITION: [found / MISSING → specify: ___]
POSTCONDITION: [found / MISSING → specify: ___]
ERROR PATH: [found / MISSING → specify: ___]
LIFECYCLE:  [found / MISSING → specify: ___]
─────────────────────────────────
SEVERITY:   [BLOCKER / HIGH / MEDIUM]
REMEDIATION: [concrete action]
```

### Examples

**Input:**
> "The system shall support file upload."

**Diagnostic:**
```
ACTOR:      MISSING → Which user role uploads files?
INPUT:      MISSING → What file types? Max size? Chunked upload?
OUTPUT:     MISSING → What does the system return? Upload ID? URL?
BOUNDARY:   MISSING → Virus scanning? Content validation?
ERROR PATH: MISSING → What if upload exceeds limit? Network failure?
PRECONDITION: MISSING → Must user be authenticated?
LIFECYCLE:  MISSING → Can files be deleted? Replaced? Versioned?
─────────────────────────────────
SEVERITY:   BLOCKER
REMEDIATION: Specify: file types (MIME whitelist), max size (100MB), 
authentication requirement, upload endpoint response, error handling 
for size/network/format violations, and CRUD lifecycle.
```

## Gap Type 2: Hidden Constraints

**Definition:** A requirement is stated clearly but cannot be implemented without discovering constraints that are never mentioned.

### Detection Heuristics

| Constraint Dimension | Detection Question | Signal |
|---|---|---|
| **Platform** | What does this run on? | No OS, browser, device, cloud provider specified |
| **Dependencies** | What external services does this call? | No API, library, SDK, or service dependency named |
| **Data Model** | What entities and relationships exist? | No schema, data types, or cardinality described |
| **Concurrency** | What happens when this runs simultaneously? | No locking, transaction, or race-condition handling |
| **Latency** | What time budget exists? | "real-time", "fast", "immediate" without ms threshold |
| **Throughput** | How many per second/minute/hour? | No request volume, concurrency, or peak load specified |
| **Auth Model** | Who is allowed to do this? | No roles, permissions, or auth method described |
| **Observability** | How do we know it's working? | No logging, metrics, alerting, or health check |
| **Compliance** | What regulations apply? | No GDPR, HIPAA, SOC2, or data-residency requirements |
| **Failure Mode** | What happens when dependencies fail? | No timeout, retry, circuit-breaker, or fallback |
| **Scale** | What are the upper bounds? | No max users, data volume, throughput ceiling |
| **Cost** | What budget constrains decisions? | No cloud spend, license, or vendor constraints |

### Diagnostic Template

```
Requirement: [verbatim text]
─────────────────────────────────
This requirement implicitly depends on:

[ ] Platform:       [known / UNKNOWN → ___]
[ ] Dependencies:   [known / UNKNOWN → ___]
[ ] Data Model:     [known / UNKNOWN → ___]
[ ] Concurrency:    [known / UNKNOWN → ___]
[ ] Latency:        [known / UNKNOWN → ___]
[ ] Throughput:     [known / UNKNOWN → ___]
[ ] Auth:           [known / UNKNOWN → ___]
[ ] Observability:  [known / UNKNOWN → ___]
[ ] Compliance:     [known / UNKNOWN → ___]
[ ] Failure Mode:   [known / UNKNOWN → ___]
[ ] Scale:          [known / UNKNOWN → ___]
[ ] Cost:           [known / UNKNOWN → ___]
─────────────────────────────────
CONSTRAINT COUNT: [N] unknown of [12]
SEVERITY: [BLOCKER if >6 unknown / HIGH if >3 / MEDIUM otherwise]
REMEDIATION: [list each unknown with a concrete discovery action]
```

### Examples

**Input:**
> "The system shall send email notifications to users."

**Diagnostic:**
```
[ ] Platform:       UNKNOWN → Which email provider? SMTP, SendGrid, SES?
[ ] Dependencies:   UNKNOWN → Email template engine? Queue system?
[ ] Throughput:     UNKNOWN → How many emails per minute?
[ ] Failure Mode:   UNKNOWN → What if provider is down? Retry? Queue?
[ ] Compliance:     UNKNOWN → GDPR? Unsubscribe? CAN-SPAM?
[ ] Auth:           UNKNOWN → Who triggers the email? Admin only? System?
─────────────────────────────────
CONSTRAINT COUNT: 6 unknown of 12
SEVERITY: BLOCKER
REMEDIATION: Specify email provider and fallback, throughput SLO 
(1000/min minimum), retry strategy (3 retries over 5 min), 
compliance requirements (unsubscribe link, data retention), 
and trigger authorization model.
```

## Gap Type 3: Contradictory Requirements

**Definition:** Two or more requirements describe states, behaviors, or constraints that cannot simultaneously be true.

### Detection Patterns

| Pattern | Description | Example |
|---|---|---|
| **Direct contradiction** | Two requirements assert opposite behaviors | REQ-1: "Data is immutable" vs REQ-2: "Users can edit their data" |
| **Temporal contradiction** | One requirement describes state A, another describes non-A for same time window | REQ-3: "Login locks after 3 failures" vs REQ-4: "Users can always attempt login" |
| **Implied contradiction** | Two requirements don't directly conflict but have incompatible consequences | REQ-5: "Deploy to all regions" vs REQ-6: "Zero cross-region data transfer" |
| **Constraint violation** | A requirement violates a stated constraint | REQ-7: "Sub-second response time" vs Constraint: "Data must be fetched from cold storage" |
| **Stakeholder conflict** | Two stakeholders require incompatible outcomes | Marketing: "Collect all user behavior" vs Legal: "Minimal data collection" |

### Detection Algorithm

```
For each pair of requirements (A, B):
  1. If A asserts X and B asserts NOT X → Direct contradiction
  2. If A describes state lasting duration D, and B describes a state 
     that cannot coexist during D → Temporal contradiction
  3. If satisfying A makes satisfying B impossible → Implied contradiction
  4. If A violates a global constraint C → Constraint violation
  5. If A and B have different stated owners with conflicting goals → Stakeholder conflict
```

### Diagnostic Template

```
CONTRADICTION FOUND
─────────────────────────────────
REQUIREMENT A: [ID + verbatim text]
REQUIREMENT B: [ID + verbatim text]
CONFLICT TYPE: [Direct / Temporal / Implied / Constraint / Stakeholder]
─────────────────────────────────
WHY THEY CONFLICT: [1-2 sentence explanation]
─────────────────────────────────
RESOLUTION OPTIONS:
  1. Prefer A, adjust B: [how]
  2. Prefer B, adjust A: [how]
  3. Add a conditional: [when A, when B]
  4. Defer one: [which, why]
RECOMMENDATION: [option + rationale]
SEVERITY: BLOCKER
```

### Examples

**Input:**
> REQ-1: "The file delete operation is permanent and irreversible."
> REQ-2: "Users must be able to recover accidentally deleted files within 30 days."

**Diagnostic:**
```
CONTRADICTION FOUND
─────────────────────────────────
REQUIREMENT A: REQ-1 — "Delete is permanent and irreversible"
REQUIREMENT B: REQ-2 — "Users can recover deleted files within 30 days"
CONFLICT TYPE: Direct contradiction
─────────────────────────────────
WHY THEY CONFLICT: "Permanent and irreversible" means no recovery. 
"Recover within 30 days" means not permanent.
─────────────────────────────────
RESOLUTION OPTIONS:
  1. Prefer A: Add a secondary confirmation step and "soft delete" only 
     for admin operations — users cannot recover.
  2. Prefer B: Implement soft-delete (mark as deleted, purge after 30 
     days) — users can recover within window.
  3. Add conditional: Soft-delete for file owner (recoverable 30 days), 
     hard-delete for admin-triggered compliance deletes (permanent).
RECOMMENDATION: Option 3 — satisfies both use cases with clear boundaries.
SEVERITY: BLOCKER
```

## Gap Type 4: Unvalidated Assumptions

**Definition:** A requirement states something as fact without evidence, measurement, or stakeholder confirmation.

### Detection Signals

| Signal | Detection Pattern | Example |
|---|---|---|
| **Absolute language** | "always", "never", "obviously", "clearly", "every", "no one" | "Users never need to export more than 100 rows" |
| **Capacity claims** | Numeric bounds without source | "The system must handle 1M concurrent users" |
| **Behavior claims** | User behavior stated as fact | "Users will always have stable internet" |
| **Technical certainty** | Tech choice stated as requirement | "We must use MongoDB" (when PostgreSQL would also work) |
| **Market claims** | "Users want X" without evidence | "Our users demand a dark mode" |
| **Timeline certitude** | "This will take 2 weeks" | No task breakdown, no dependency analysis |
| **Implicit trust** | "External service X is reliable" | No SLA reference, no failure handling |

### Validation Procedure

For each unvalidated assumption found:

1. **Identify the claim:** Extract the exact statement.
2. **Classify the claim type:** Capacity / Behavior / Technical / Market / Timeline / Trust.
3. **Determine evidence required:** What would prove or disprove this?
4. **Propose validation method:** How do we test it?
5. **Assign severity:** BLOCKER if the assumption failing would cause system failure. HIGH if it would cause significant rework. MEDIUM if it adjusts scope.

### Diagnostic Template

```
ASSUMPTION DETECTED
─────────────────────────────────
REQUIREMENT: [ID + verbatim text]
CLAIM: [exact quoted text]
CLAIM TYPE: [Capacity / Behavior / Technical / Market / Timeline / Trust]
─────────────────────────────────
EVIDENCE PROVIDED: [None / URL / Report / Stakeholder interview — date]
EVIDENCE NEEDED: [what would validate this?]
VALIDATION METHOD: [how to test]
FALLBACK IF WRONG: [what changes if assumption fails?]
─────────────────────────────────
SEVERITY: [BLOCKER / HIGH / MEDIUM]
REMEDIATION: [concrete validation action]
```

### Examples

**Input:**
> "The database will support 10M records without performance degradation."

**Diagnostic:**
```
ASSUMPTION DETECTED
─────────────────────────────────
REQUIREMENT: REQ-14 — "Support 10M records without degradation"
CLAIM: "without performance degradation"
CLAIM TYPE: Capacity
─────────────────────────────────
EVIDENCE PROVIDED: None
EVIDENCE NEEDED: Load test at 10M rows with target query patterns. 
Performance baseline at 1K, 100K, 1M, 5M, 10M rows. 
Degraded = >p95 latency exceeds 200ms for primary queries.
VALIDATION METHOD: Synthetic load test with production-schema-equivalent 
dataset, run key queries at each scale tier.
FALLBACK IF WRONG: Add read replicas, implement sharding, change query 
patterns, or accept higher latency with documented SLO.
─────────────────────────────────
SEVERITY: HIGH
REMEDIATION: Schedule load test before architecture lock-in. 
Do not commit to 10M support without test results.
```

## Cross-Type Relationships

A single requirement often exhibits multiple gap types simultaneously. Flag all that apply:

```
REQUIREMENT: "The system should be fast and secure."
  → VAGUE: "fast" and "secure" are unbounded
  → HIDDEN CONSTRAINT: What constitutes "secure"? Which threat model?
  → MISSING SCOPE: Which operations need to be fast? All? Specific ones?
```

## Resolution Priority

When multiple gaps exist, resolve in this order:
1. **BLOCKER Contradictions** — cannot implement until resolved
2. **BLOCKER Missing Scope** — cannot implement without knowing what to build
3. **HIGH Hidden Constraints** — implementing without these risks rework
4. **HIGH Unvalidated Assumptions** — failing assumption may invalidate the architecture
5. **MEDIUM Vague Requirements** — can proceed with clarification notes
6. **LOW — Cosmetic issues** — defer to spec-locking phase

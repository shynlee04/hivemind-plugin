# Acceptance Criteria Patterns

How to derive acceptance tests from EARS requirements. The matrix is the
output of Gate 4 in the spec-lock workflow.

## BDD Framing

For each REQ, write at least one acceptance test in Given-When-Then form:

```
Given <precondition(s)>
  And <additional preconditions>
When <trigger>
  And <additional actions>
Then <observable outcome>
  And <additional assertions>
```

## Derivation Rules

### From Ubiquitous REQ → Property Test

`The system shall hash all stored passwords with bcrypt.`

```
Given any user record in the database
When the auth service reads the password field
Then the value matches /^\$2[aby]\$\d{2}\$/
  And the cost factor is ≥10
```

### From Event-Driven REQ → Integration Test

`When a user submits the login form, the auth service shall validate credentials within 200ms.`

```
Given a registered user with email "alice@example.com" and password "secret"
When the user submits the login form
Then the response is HTTP 200 with a valid session cookie
  And the response arrives within 200ms
```

### From State-Driven REQ → State Test

`While the user is unauthenticated, the API shall return 401 for all protected routes.`

```
Given a clean session (no auth cookie)
When the user GETs /api/protected/resource
Then the response is HTTP 401
  And the body contains {"error": "unauthenticated"}
```

### From Unwanted Behavior REQ → Negative Test

`If the JWT is expired, the system shall return 401 and clear the session cookie.`

```
Given a session with an expired JWT
When the user GETs /api/protected/resource
Then the response is HTTP 401
  And the Set-Cookie header includes session=; Max-Age=0
```

### From Optional REQ → Parameterized Test

`Where 2FA is enabled, the system shall require a TOTP token in addition to the password.`

```
Given 2FA is enabled for the user
  And the user has a valid TOTP secret
When the user submits the login form without a TOTP token
Then the response is HTTP 401
  And the body contains {"error": "2fa_required"}

Given 2FA is enabled for the user
  And the user has a valid TOTP secret
When the user submits the login form with a valid TOTP token
Then the response is HTTP 200

Given 2FA is disabled for the user
When the user submits the login form without a TOTP token
Then the response is HTTP 200
```

## Test Type Selection

| Test scenario | Type |
|---|---|
| Pure logic (e.g., EARS validation, hash check) | unit |
| Component interaction (e.g., auth service + DB) | integration |
| Full flow (e.g., user login + cookie + redirect) | e2e |
| Performance (e.g., "within 200ms") | integration with timing |
| Security (e.g., "JWT expired") | integration + security scenario |

## Coverage Matrix

| REQ | Test | Type | Preconditions | Steps | Expected outcome |
|---|---|---|---|---|---|
| REQ-001 | test_hash_format | unit | any user record | read password field | matches bcrypt regex, cost ≥10 |
| REQ-002 | test_login_timing | integration | registered user, valid creds | submit form | HTTP 200 in <200ms |
| REQ-003 | test_unauth_401 | integration | clean session | GET /api/protected | HTTP 401 |
| REQ-004 | test_jwt_expired | integration | expired JWT | GET /api/protected | HTTP 401 + cookie cleared |
| REQ-005 | test_2fa_required | e2e | 2FA enabled, no TOTP | submit form | HTTP 401 + 2fa_required |
| REQ-005b | test_2fa_accepted | e2e | 2FA enabled, valid TOTP | submit form | HTTP 200 |
| REQ-005c | test_2fa_disabled | e2e | 2FA disabled | submit form | HTTP 200 |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Test checks the wrong field | Match test assertions to REQ's measurable outcome |
| Test passes when the system is broken | REQ is unfalsifiable — go back to Gate 2 |
| Test depends on real time | Use frozen clocks or relative timing |
| Test doesn't clean up | Add teardown; use ephemeral fixtures |
| Test is flaky | Determinism over speed; mark expected flakiness if unavoidable |

# EARS Notation (Easy Approach to Requirements Syntax)

The 5 EARS patterns for writing falsifiable requirements. Use the right pattern
for the right situation. Mismatched patterns = unfalsifiable requirements.

## The 5 Patterns

### 1. Ubiquitous

**Form:** `The <system> shall <action>`

**Use when:** The requirement is true at all times, regardless of state or
trigger.

**Example:** `The auth service shall hash all stored passwords with bcrypt.`

**Test derivation:** This is a property test — assert the property holds
for all inputs.

### 2. Event-Driven

**Form:** `When <trigger>, the <system> shall <action>`

**Use when:** The requirement fires on a specific event (user action,
incoming message, scheduled time, etc.).

**Example:** `When a user submits the login form, the auth service shall
validate credentials within 200ms.`

**Test derivation:** Integration test — simulate the trigger, assert the
action + timing.

### 3. State-Driven

**Form:** `While <state>, the <system> shall <action>`

**Use when:** The requirement is true for as long as the system is in a
given state.

**Example:** `While the user is unauthenticated, the API shall return 401
for all protected routes.`

**Test derivation:** Set up the state, exercise the system, assert behavior.

### 4. Unwanted Behavior

**Form:** `If <condition>, the <system> shall <action>`

**Use when:** The requirement handles an error or edge case (anti-condition).

**Example:** `If the JWT is expired, the system shall return 401 and
clear the session cookie.`

**Test derivation:** Negative test — trigger the condition, assert the
recovery action.

### 5. Optional

**Form:** `Where <feature>, the <system> shall <action>`

**Use when:** The requirement is conditional on a feature being enabled.

**Example:** `Where 2FA is enabled, the system shall require a TOTP token
in addition to the password.`

**Test derivation:** Parameterized test — feature on + feature off.

## Pattern Selection Decision Tree

```
Is the requirement always true (no trigger, no state)?
  ├─ Yes → Ubiquitous (1)
  └─ No  →
        Does it fire on a specific event?
          ├─ Yes → Event-Driven (2)
          └─ No  →
                Is it true while in a specific state?
                  ├─ Yes → State-Driven (3)
                  └─ No  →
                        Is it a response to an error/edge?
                          ├─ Yes → Unwanted Behavior (4)
                          └─ No  → Optional (5) — if feature-gated
                                  → REJECT (no pattern fits)
```

## Anti-Patterns in EARS

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| `<system> shall be fast` | "Fast" is unfalsifiable | Replace with "<system> shall respond within 200ms p99" |
| `<system> shall handle errors gracefully` | "Graceful" is subjective | List the specific error + the specific action |
| `<system> shall be user-friendly` | "User-friendly" needs measurement | Replace with "<system> shall complete the flow in ≤3 clicks" |
| `<system> shall support X` without saying HOW | Spec is a wish | Add the trigger + outcome: "When user requests X, <system> shall Y" |
| Mixing multiple patterns in one REQ | Can't derive one test | Split into separate REQs |

## Example: Converting Prose to EARS

**Source prose:**
> "Users should be able to log in quickly, and we want to support password
> reset via email."

**Bad EARS (mixed, unfalsifiable):**
- `The system shall support quick login and email password reset.`

**Good EARS (split, falsifiable):**
- `REQ-001 (Ubiquitous): The auth service shall respond to login attempts within 200ms p99.`
- `REQ-002 (Event-Driven): When a user submits the password-reset form, the auth service shall send a reset email within 60 seconds.`
- `REQ-003 (Unwanted Behavior): If the reset email fails to send, the auth service shall retry up to 3 times with exponential backoff.`
- `REQ-004 (State-Driven): While a reset token is valid (24h), the auth service shall accept the token to set a new password.`

Each is independently testable. Each has a measurable outcome.

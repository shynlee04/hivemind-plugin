# Acceptance Criteria Reference

## Given/When/Then Format

Acceptance criteria use the Gherkin syntax to describe behavior in a testable, unambiguous format.

### Structure

```
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
And [additional outcome, if needed]
```

### Rules

1. **One scenario per criterion** — Don't combine multiple behaviors
2. **Specific, not vague** — "user sees error" → "user sees 'Email is required' error below the email field"
3. **Testable** — Every criterion must have a clear pass/fail
4. **No implementation details** — Describe what, not how
5. **Independent** — Each criterion should work in isolation

---

## Examples

### Example 1: User Login

**User Story:** As a user, I want to log in so that I can access my dashboard.

**Acceptance Criteria:**

```
AC-1: Valid credentials
  Given a registered user with email "alice@example.com" and password "Secret123"
  When the user submits the login form with those credentials
  Then the user is redirected to the dashboard
  And a session token is stored in the browser

AC-2: Invalid password
  Given a registered user with email "alice@example.com"
  When the user submits the login form with password "WrongPass"
  Then the login form displays "Invalid email or password"
  And the user remains on the login page
  And no session token is created

AC-3: Empty email
  Given the login form is displayed
  When the user submits the form with an empty email field
  Then the email field shows "Email is required"
  And the password field is not cleared
  And no API request is made

AC-4: Rate limiting
  Given a user has failed login 5 times in 10 minutes
  When the user attempts to log in again
  Then the login form displays "Too many attempts. Try again in X minutes"
  And the submit button is disabled
```

### Example 2: Shopping Cart

**User Story:** As a shopper, I want to add items to my cart so that I can purchase them together.

**Acceptance Criteria:**

```
AC-1: Add item to empty cart
  Given the cart is empty
  When the user clicks "Add to Cart" on a product with quantity 1
  Then the cart icon shows "1"
  And the cart drawer shows the product with quantity 1
  And the subtotal equals the product price

AC-2: Add same item again
  Given the cart contains "Widget" with quantity 1
  When the user clicks "Add to Cart" on "Widget"
  Then the cart icon shows "2"
  And the "Widget" quantity is updated to 2
  And the subtotal equals 2x the product price

AC-3: Add item exceeding stock
  Given "Widget" has 5 units in stock
  And the cart contains "Widget" with quantity 5
  When the user clicks "Add to Cart" on "Widget"
  Then the system shows "Maximum stock reached"
  And the cart quantity remains 5
```

### Example 3: API Endpoint

**User Story:** As an API consumer, I want to fetch paginated user lists.

**Acceptance Criteria:**

```
AC-1: Default pagination
  Given there are 150 users in the database
  When the client GETs /api/users
  Then the response status is 200
  And the response body contains 20 users
  And the response includes pagination metadata:
    | field    | value |
    | page     | 1     |
    | perPage  | 20    |
    | total    | 150   |
    | pages    | 8     |

AC-2: Custom page size
  Given there are 150 users in the database
  When the client GETs /api/users?perPage=50
  Then the response status is 200
  And the response body contains 50 users
  And pagination metadata shows perPage=50

AC-3: Page beyond range
  Given there are 150 users in the database
  When the client GETs /api/users?page=100
  Then the response status is 200
  And the response body contains an empty array
```

---

## Anti-Patterns (What NOT to Write)

### Vague Criteria

```
BAD:  "The system should handle errors gracefully"
GOOD: "When the API returns 500, the UI shows 'Something went wrong. Please try again.' and logs the error with correlation ID"

BAD:  "The page should load fast"
GOOD: "The page completes initial render within 2 seconds on 3G connection"

BAD:  "Data should be validated"
GOOD: "When email format is invalid, the field shows 'Enter a valid email address' and the submit button is disabled"
```

### Implementation-Laden Criteria

```
BAD:  "When the user submits, Redux dispatches LOGIN_SUCCESS and the saga calls the API"
GOOD: "When the user submits valid credentials, the user is redirected to the dashboard"
```

### Combined Criteria

```
BAD:  "User can log in and see dashboard and manage settings"
GOOD: Split into 3 separate criteria — one for login, one for dashboard view, one for settings access
```

---

## Traceability

Every acceptance criterion should trace to:
- **Source:** Which user story or requirement
- **Test:** Which test file covers it
- **Implementation:** Which module handles the behavior

See `references/traceability-matrix.md` for the full chain.

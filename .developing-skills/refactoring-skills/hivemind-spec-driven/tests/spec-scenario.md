# Spec Scenario: User Story Distillation

## Scenario

A stakeholder provides a vague feature request. Your job is to distill it into a proper user story with testable acceptance criteria.

## Input (Vague Request)

> "We need a way for users to search for products. It should be fast and easy to use. Maybe show results as they type. Also need filters."

## Distillation Process

### Step 1: Identify the User

- **Who:** Registered and anonymous users browsing the product catalog
- **Role:** Shopper / Buyer

### Step 2: Extract Core Intent

- **What:** Search products by keyword
- **Why:** Find specific products without browsing entire catalog

### Step 3: Identify Constraints

- Fast = response time < 300ms
- Easy = single input field, clear results
- As they type = real-time search with debounce
- Filters = category, price range, availability

### Step 4: Write User Stories

---

## Output (Distilled Spec)

### US-SEARCH-001: Basic Product Search

**As a** shopper
**I want to** search for products by keyword
**So that** I can find specific items without browsing the entire catalog

#### Acceptance Criteria

```
AC-001: Search by product name
  Given the user is on the products page
  When the user types "laptop" in the search field
  Then the results update to show products containing "laptop" in the name
  And the update completes within 300ms

AC-002: No results
  Given the user is on the products page
  When the user types "xyznonexistent" in the search field
  Then the results area shows "No products found for 'xyznonexistent'"
  And a "Browse all products" link is displayed

AC-003: Empty search
  Given the user has typed "laptop" in the search field
  When the user clears the search field
  Then the results reset to show all products
  And no search request is made

AC-004: Minimum characters
  Given the user is on the products page
  When the user types "a" (single character)
  Then no search request is made
  And a hint displays "Type at least 2 characters to search"
```

### US-SEARCH-002: Search with Filters

**As a** shopper
**I want to** filter search results by category and price
**So that** I can narrow down to relevant products

#### Acceptance Criteria

```
AC-005: Filter by category
  Given search results for "laptop" are displayed
  When the user selects the "Electronics" category filter
  Then the results update to show only Electronics products matching "laptop"
  And the filter chip "Electronics" is displayed

AC-006: Filter by price range
  Given search results for "laptop" are displayed
  When the user sets the price range to $500-$1000
  Then the results show only products within that price range
  And the price filter is highlighted

AC-007: Clear filters
  Given search results are filtered by category "Electronics"
  When the user clicks "Clear all filters"
  Then all filters are removed
  And the results show all products matching "laptop"

AC-008: Multiple filters
  Given search results for "laptop" are displayed
  When the user selects category "Electronics" AND price range $500-$1000
  Then only products matching ALL filters are shown
  And both filter chips are displayed
```

### US-SEARCH-003: Real-time Search (Debounced)

**As a** shopper
**I want to** see results update as I type
**So that** I don't need to press Enter or click a search button

#### Acceptance Criteria

```
AC-009: Debounced search
  Given the user is on the products page
  When the user types "lap" quickly (within 300ms)
  Then only ONE search request is made after the user pauses
  And the loading indicator appears during the request

AC-010: Cancel previous search
  Given a search for "lap" is in progress
  When the user types "laptop" (continues typing)
  Then the previous search for "lap" is cancelled
  And a new search for "laptop" is initiated
  And only the "laptop" results are displayed

AC-011: Loading state
  Given the user triggers a search
  When the search request is in flight
  Then a loading indicator is shown
  And previous results remain visible (not cleared until new results arrive)
```

---

## Verification

| AC | Test File | Test Name | Status |
|----|-----------|-----------|--------|
| AC-001 | `tests/search/basic.test.ts` | `searches by product name` | — |
| AC-002 | `tests/search/basic.test.ts` | `shows no results message` | — |
| AC-003 | `tests/search/basic.test.ts` | `resets on empty input` | — |
| AC-004 | `tests/search/basic.test.ts` | `validates minimum characters` | — |
| AC-005 | `tests/search/filters.test.ts` | `filters by category` | — |
| AC-006 | `tests/search/filters.test.ts` | `filters by price range` | — |
| AC-007 | `tests/search/filters.test.ts` | `clears all filters` | — |
| AC-008 | `tests/search/filters.test.ts` | `combines multiple filters` | — |
| AC-009 | `tests/search/realtime.test.ts` | `debounces search input` | — |
| AC-010 | `tests/search/realtime.test.ts` | `cancels previous search` | — |
| AC-011 | `tests/search/realtime.test.ts` | `shows loading state` | — |

## Evaluation Criteria

The distillation is successful when:
- [ ] Each user story has the "As a / I want to / So that" format
- [ ] Each acceptance criterion uses Given/When/Then
- [ ] All criteria are specific and testable (no "fast", "easy", "good")
- [ ] Edge cases are identified (empty input, no results, invalid state)
- [ ] Non-functional requirements are explicit (response time, accessibility)
- [ ] Each AC traces to exactly one test case
- [ ] Scope boundaries are explicit (what's in, what's out)

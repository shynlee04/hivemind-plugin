# Spec Candidate Template

## Metadata

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-XXX |
| **Created** | YYYY-MM-DD |
| **Author** | [agent/user] |
| **Status** | Draft / Review / Approved / Implemented |
| **Priority** | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |

---

## Title
[Concise, action-oriented title: "User can filter products by category"]

## Problem Statement
[What problem exists? Who is affected? What is the impact?]

> Example: "Users cannot find products by category. They must scroll through the entire catalog, leading to 40% higher bounce rates on the products page."

## Desired Outcome
[What does success look like? Measurable if possible.]

> Example: "Users can filter products by category with <200ms response time, reducing bounce rate by 15%."

---

## User Stories

### US-XXX-001: [Role] [Action] [Benefit]

**As a** [type of user]
**I want to** [action]
**So that** [benefit]

#### Acceptance Criteria

```
AC-001: [Criterion name]
  Given [precondition]
  When [action]
  Then [expected outcome]

AC-002: [Criterion name]
  Given [precondition]
  When [action]
  Then [expected outcome]
```

#### Edge Cases
- [What happens when input is empty?]
- [What happens when input is invalid?]
- [What happens at boundaries?]

---

### US-XXX-002: [Next story]

[Same structure]

---

## Non-Functional Requirements

| Requirement | Target | How to Verify |
|-------------|--------|---------------|
| Response time | <200ms | Load test |
| Availability | 99.9% | Monitoring |
| Accessibility | WCAG 2.1 AA | axe audit |
| Browser support | Chrome, Firefox, Safari, Edge | Cross-browser test |

---

## Scope Boundaries

### In Scope
- [Feature A]
- [Feature B]

### Out of Scope (Explicitly)
- [Feature C] — deferred to SPEC-XXX
- [Feature D] — not needed for MVP

---

## Technical Constraints
- [Must use existing API]
- [Must be backward compatible]
- [Must not introduce new dependencies]

## Dependencies
- [SPEC-XXX: prerequisite feature]
- [API endpoint X must be available]

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | HIGH | [How to mitigate] |
| [Risk 2] | MEDIUM | [How to mitigate] |

---

## Traceability

| Story | AC IDs | Tests | Implementation |
|-------|--------|-------|----------------|
| US-XXX-001 | AC-001, AC-002 | `tests/...` | `src/...` |

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |

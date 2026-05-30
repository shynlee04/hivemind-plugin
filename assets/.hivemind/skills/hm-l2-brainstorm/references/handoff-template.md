# Requirements Brief Template

The requirements brief is the handoff artifact from `hm-brainstorm` to `hm-spec-driven-authoring`. It captures everything surfaced during brainstorming in a structured format ready for spec-locking.

## File Location

```
.planning/requirements/YYYY-MM-DD-<topic-slug>-brief.md
```

**Example:** `.planning/requirements/2026-04-28-user-onboarding-brief.md`

If `.planning/requirements/` does not exist, create it. If the project uses a different planning directory (e.g., `docs/`, `specs/`), adapt the path accordingly.

## Template

Copy this template. Fill every section. Do not skip sections — if no content exists for a section, write "None identified" and explain why.

```markdown
---
date: YYYY-MM-DD
topic: <topic-slug>
status: draft | confirmed | in-research
transition_to: hm-spec-driven-authoring | hm-deep-research | hm-detective
---

# Requirements Brief: <Title>

## 1. Intent Summary

**Problem:** [1-2 sentences describing the problem this addresses]

**Target Users:** [who will use this]

**Success Looks Like:** [measurable outcome — how the user will know it's working]

**In Scope:**
- [scope item 1]
- [scope item 2]

**Out of Scope:**
- [explicitly excluded item 1]
- [explicitly excluded item 2]

## 2. Functional Requirements

Requirements are prioritized: P0 (must have), P1 (should have), P2 (nice to have).

| ID | Priority | Requirement | Rationale | Verification Idea |
|----|----------|------------|-----------|-------------------|
| FR-01 | P0 | [what the system must do] | [why this matters] | [how to verify] |
| FR-02 | P0 | [what the system must do] | [why this matters] | [how to verify] |
| FR-03 | P1 | [what the system should do] | [why this matters] | [how to verify] |
| FR-04 | P2 | [what would be nice] | [why deferrable] | [how to verify] |

## 3. Non-Functional Requirements

| ID | Category | Requirement | Measurement |
|----|----------|------------|-------------|
| NFR-01 | Performance | [e.g., page load < 2s] | [how measured] |
| NFR-02 | Security | [e.g., all inputs sanitized] | [how verified] |
| NFR-03 | Accessibility | [e.g., WCAG 2.1 AA] | [how verified] |
| NFR-04 | Reliability | [e.g., 99.9% uptime] | [how measured] |

## 4. Constraints

**Technical:**
- [constraint: language, framework, platform, infrastructure]

**Timeline:**
- [constraint: deadline, milestone, dependency on other work]

**Compliance:**
- [constraint: regulatory, security standard, organizational policy]

**Dependencies:**
- [constraint: depends on X being complete, Y being available]

## 5. Assumptions

| ID | Assumption | Category | Status | Validation |
|----|-----------|----------|--------|------------|
| A1 | [assumption] | [User/Environment/Data/Behavior/Constraint/Dependency/Priority] | Confirmed / Assumed / Rejected | [how validated or why assumed] |
| A2 | [assumption] | [category] | [status] | [validation] |

## 6. Approach Direction

**Chosen Direction:** [name of chosen direction from Phase 2.1]

**Alternatives Considered:**
- Direction B: [name] — [why not chosen]
- Direction C: [name] — [why not chosen]

**Key Trade-offs:**
- [trade-off accepted]: [rationale]
- [trade-off avoided]: [rationale]

## 7. Open Questions

Questions not resolved during brainstorming. The spec-driven-authoring phase may need to address these.

| ID | Question | Impact if Unresolved | Suggested Resolution |
|----|----------|---------------------|---------------------|
| Q1 | [unresolved question] | [what's blocked] | [how to resolve] |

## 8. Research Notes

Topics flagged for investigation. These should be resolved before spec-locking.

| Topic | Why Needed | Route To | Status |
|-------|-----------|----------|--------|
| [research topic] | [what decision depends on this] | hm-deep-research / hm-detective | pending / in-progress / done |

## 9. Handoff

**Next Skill:** `hm-spec-driven-authoring`

**Ready For Handoff:** yes | no — [reason if no]

**Prerequisites for Spec Phase:**
- [ ] All P0 requirements have verification ideas
- [ ] High-impact assumptions are validated
- [ ] Research topics are resolved or flagged as blocking
- [ ] User has confirmed this brief

**Notes for spec-driven-authoring:**
- [anything the spec author should know about ambiguous requirements, edge cases, or deferred decisions]
```

## Filling Guidelines

### Intent Summary (Section 1)
- **Problem:** Focus on the gap, not the solution. "Users can't reset their password without contacting support" — not "We need a password reset page."
- **Success:** Make it measurable. "80% of password resets complete in under 2 minutes" — not "Users can reset passwords."
- **Out of Scope:** Be specific. "Social login (Google/GitHub)" — not "Advanced auth features."

### Functional Requirements (Section 2)
- **P0 (Must have):** The system is incomplete without these. Typically 2-5 items.
- **P1 (Should have):** Important but the system functions without them. Typically 2-5 items.
- **P2 (Nice to have):** Deferrable. Typically 0-3 items.
- **Verification Idea:** Not a full test case. A one-line concept. "Log in with valid credentials → see dashboard."

### Non-Functional Requirements (Section 3)
If the user didn't specify any, propose reasonable defaults:
- **Performance:** "Page load < 3s on 3G" (web), "Response < 200ms p95" (API)
- **Security:** "OWASP Top 10 covered", "Inputs sanitized"
- **Accessibility:** "Keyboard navigable", "Screen reader compatible" (if UI)
- **Reliability:** "Graceful error handling", "No silent failures"

Mark defaults clearly: "(proposed — please confirm)"

### Assumptions (Section 5)
Every assumption from `references/assumption-detection.md` must appear here. Group by category. Mark status:
- **Confirmed:** User explicitly validated
- **Assumed:** Reasonable but not validated — flag for spec phase
- **Rejected:** User said no — document the correction

### Approach Direction (Section 6)
From Phase 2.1. Keep it brief — this is context for the spec author, not a design document.

### Open Questions (Section 7)
If none, write "All questions resolved during brainstorming." If there are unresolved questions, each must have a suggested resolution path.

### Research Notes (Section 8)
If `hm-deep-research` or `hm-detective` was invoked during brainstorming, record findings here. If research is still pending, mark status as "pending" and note what's blocked.

## Anti-Patterns in Brief Writing

| Anti-Pattern | Example | Fix |
|-------------|---------|-----|
| **Empty sections** | "## 5. Assumptions — None" | Write "None identified — this is a well-scoped request with minimal hidden assumptions." Explain why. |
| **Vague requirements** | "FR-01: Make it fast" | "FR-01: Page load completes in under 2 seconds (p95)" |
| **Missing priorities** | All requirements are P0 | Run YAGNI filter. Defer at least 1 item to P1 or P2. |
| **Solution in requirements** | "FR-01: Use React hooks for state management" | "FR-01: UI state persists across navigation without page reload" — describe WHAT not HOW. |
| **Untracked assumptions** | Requirements list doesn't mention assumptions section | Run `references/assumption-detection.md` protocol before finalizing. |

## Validation Checklist

Before handing off the requirements brief:

- [ ] All 9 sections are filled (no empty sections without explanation)
- [ ] Every P0 requirement has a verification idea
- [ ] Assumptions table includes at least 3 entries from different categories
- [ ] Out-of-scope items are concrete (not "things we're not doing")
- [ ] Open questions have suggested resolution paths
- [ ] Research notes are linked to specific requirements they unblock
- [ ] Approach direction includes at least one alternative that was considered and rejected
- [ ] The brief can be read and understood by someone who wasn't in the brainstorming session

## Example

See below for a minimal but complete example:

```markdown
---
date: 2026-04-28
topic: password-reset-flow
status: confirmed
transition_to: hm-spec-driven-authoring
---

# Requirements Brief: Password Reset Self-Service

## 1. Intent Summary

**Problem:** Users who forget their password must email support to request a reset. Support handles ~50 requests/week, each taking 15 minutes.

**Target Users:** All registered users (currently ~5,000), primarily non-technical end-users.

**Success Looks Like:** 90%+ of password resets complete without human support intervention. Support tickets for password resets drop below 5/week.

**In Scope:**
- Self-service password reset via email link
- Rate limiting to prevent abuse
- Audit log of reset events

**Out of Scope:**
- Multi-factor authentication recovery (separate project)
- Social login (Google/GitHub) integration
- Account lockout after failed attempts (existing system handles this)

## 2. Functional Requirements

| ID | Priority | Requirement | Rationale | Verification Idea |
|----|----------|------------|-----------|-------------------|
| FR-01 | P0 | User submits email → receives reset link within 60 seconds | Core flow — without this, the feature doesn't exist | Submit email, check inbox within 60s |
| FR-02 | P0 | Reset link is single-use, expires after 30 minutes | Security requirement — prevents link reuse | Use link, try again → rejected |
| FR-03 | P0 | User creates new password meeting complexity rules | Must maintain password policy consistency | Submit weak password → rejected with guidance |
| FR-04 | P1 | Rate limit: max 3 reset emails per email per hour | Prevent abuse without blocking legitimate users | Send 4 requests in 1 hour → 4th rejected |
| FR-05 | P1 | Audit log records: email, timestamp, IP, success/failure | Compliance requirement for security audits | Check audit table after reset |

## 3. Non-Functional Requirements

| ID | Category | Requirement | Measurement |
|----|----------|------------|-------------|
| NFR-01 | Performance | Reset email delivered within 60 seconds (p95) | Monitor email send latency |
| NFR-02 | Security | Reset tokens are cryptographically random (256-bit) | Code review of token generation |
| NFR-03 | Reliability | Reset flow works during peak load (100 concurrent) | Load test at 100 concurrent requests |

## 4. Constraints

**Technical:** Must integrate with existing email service (SendGrid). Must use existing user database (PostgreSQL, users table).
**Timeline:** Target: before next quarterly release (June 2026).
**Compliance:** Must log all reset events for SOC 2 compliance.
**Dependencies:** SendGrid API key must be provisioned. No other blocking dependencies.

## 5. Assumptions

| ID | Assumption | Category | Status | Validation |
|----|-----------|----------|--------|------------|
| A1 | All users have valid email addresses on file | Data | Confirmed | User confirmed all registered users have emails |
| A2 | SendGrid is the email provider | Environment | Confirmed | User confirmed SendGrid is already integrated |
| A3 | Password complexity rules won't change for this feature | Constraint | Assumed | Reasonable — existing rules used system-wide |
| A4 | Users have access to their email during reset | User | Assumed | Reasonable — this is how email reset works |

## 6. Approach Direction

**Chosen Direction:** Email-link flow (standard pattern)

**Alternatives Considered:**
- Direction B: SMS-based reset — rejected due to cost, international phone number complexity
- Direction C: Security questions — rejected due to lower security, worse UX

**Key Trade-offs:**
- Email-only vs. email+SMS: Chose email-only for simplicity; SMS can be added later

## 7. Open Questions

| ID | Question | Impact if Unresolved | Suggested Resolution |
|----|----------|---------------------|---------------------|
| Q1 | Should the email include the user's name? | Privacy consideration | Check with security team |

## 8. Research Notes

None — all decisions use existing infrastructure.

## 9. Handoff

**Next Skill:** `hm-spec-driven-authoring`

**Ready For Handoff:** yes

**Prerequisites for Spec Phase:**
- [x] All P0 requirements have verification ideas
- [x] High-impact assumptions are validated
- [x] Research topics are resolved or flagged as blocking
- [x] User has confirmed this brief

**Notes for spec-driven-authoring:**
- Password complexity rules are defined in existing `/auth/password-policy.ts` — reference that file
- Rate limiting may interact with existing login rate limiter — check for conflicts
```

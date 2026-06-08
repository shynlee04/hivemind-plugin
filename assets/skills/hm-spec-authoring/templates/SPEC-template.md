# SPEC Template

The 8-section structure for every SPEC.md produced by this skill. Copy and
fill all 8 sections.

---

# SPEC: <Feature Name>

**Phase:** `<NN-name>`
**Date:** `<YYYY-MM-DD>`
**Status:** `DRAFT | LOCKED | SHIPPED`
**Owner:** `<agent or user who wrote the spec>`

## 1. Source Provenance

| Source | Path | Date | Author |
|---|---|---|---|
| PRD | `<path or "user prompt verbatim">` | `<date>` | `<user/agent>` |
| Prior ADR | `<path>` | `<date>` | `<agent>` |
| Research | `<path>` | `<date>` | `<agent>` |
| User story | `<path or pasted text>` | `<date>` | `<user>` |

**Stakeholders/Actors named in the source:**
- `<actor 1>: <role>`
- `<actor 2>: <role>`

**Explicit MUST/SHOULD/MAY statements:**
- `<MUST statement 1>`
- `<SHOULD statement 2>`

**Implicit requirements (security, data integrity, accessibility, ops):**
- `<implicit req 1>`
- `<implicit req 2>`

## 2. Out-of-Scope Statement

The following are explicitly NOT in scope for this SPEC:

- `<out-of-scope 1>`
- `<out-of-scope 2>`
- `<out-of-scope 3>`

If a reviewer believes an out-of-scope item should be in scope, file a
follow-up SPEC.

## 3. Requirement Table (EARS)

| REQ | Pattern | Statement | Source-ref | Realm | Verification-method |
|---|---|---|---|---|---|
| REQ-001 | Ubiquitous | `<statement>` | `<source>` | spec | `<method>` |
| REQ-002 | Event-Driven | `<statement>` | `<source>` | spec | `<method>` |
| REQ-003 | State-Driven | `<statement>` | `<source>` | spec | `<method>` |
| REQ-004 | Unwanted Behavior | `<statement>` | `<source>` | spec | `<method>` |
| REQ-005 | Optional | `<statement>` | `<source>` | spec | `<method>` |

(See `references/ears-notation.md` for pattern definitions.)

## 4. Acceptance Test Matrix

| REQ | Test name | Type | Preconditions | Steps | Expected outcome |
|---|---|---|---|---|---|
| REQ-001 | `<name>` | unit | `<pre>` | `<steps>` | `<outcome>` |
| REQ-002 | `<name>` | integration | `<pre>` | `<steps>` | `<outcome>` |
| REQ-003 | `<name>` | integration | `<pre>` | `<steps>` | `<outcome>` |
| REQ-004 | `<name>` | integration | `<pre>` | `<steps>` | `<outcome>` |
| REQ-005 | `<name>` | e2e | `<pre>` | `<steps>` | `<outcome>` |

(See `references/acceptance-criteria-patterns.md` for BDD derivation.)

## 5. Acceptance Criteria by Realm

| Realm | Criterion | Evidence required |
|---|---|---|
| **Spec-driven** | All 5 EARS patterns used correctly | REQ table review |
| **Test-driven** | ≥1 test per REQ, all in test suite | `npm test` exit 0 |
| **Documentation-driven** | SPEC.md is machine-readable, this template | grep for REQ-NNN |
| **Architecture-driven** | Fits in the system's 9-surface authority | ADR + reviewer |
| **Clean-code-driven** | No EARS anti-patterns, no unfalsifiable outcomes | reviewer + `validate-spec-falsifiability.sh` |

## 6. Verification Methods (per REQ)

For each REQ, the verification method:

| REQ | Verification command | Expected result |
|---|---|---|
| REQ-001 | `<command>` | `<expected>` |
| REQ-002 | `<command>` | `<expected>` |
| REQ-003 | `<command>` | `<expected>` |
| REQ-004 | `<command>` | `<expected>` |
| REQ-005 | `<command>` | `<expected>` |

## 7. Open Questions / Risks

| # | Question / risk | Owner | Resolution path |
|---|---|---|---|
| 1 | `<question>` | `<owner>` | `<ADR, ask user, research>` |
| 2 | `<question>` | `<owner>` | `<...>` |

## 8. Handoff Summary (1 page)

**For the implementer (TDD executor):**
- Start with: REQ-001 (lowest REQ number is usually the foundation)
- Test order: unit → integration → e2e
- Atomic commit per REQ

**For the planner:**
- Tasks: derive 1 task per REQ
- Dependencies: REQ-N depends on REQ-M if M produces data N consumes

**For the ADR author (if applicable):**
- Design choices to lock: `<list from REQs that imply a choice>`

**Risks for the next phase:**
- `<risk 1>`
- `<risk 2>`

---

**This SPEC is LOCKED when:**
- All 5 gates (Source Audit, Ambiguity, REQ table, Acceptance matrix, Handoff) PASS
- 5-realm coverage is complete
- All REQs are falsifiable (run `scripts/validate-spec-falsifiability.sh`)
- Open questions are filed (not blocking, but acknowledged)

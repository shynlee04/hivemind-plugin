---
name: hm-spec-authoring
description: >
  Transform vague requirements into a falsifiable spec. Use when the user wants to:
  lock a feature, write EARS-style requirements, derive acceptance criteria,
  validate spec compliance, or produce a SPEC.md handoff for downstream TDD.
  Triggers on verbs like "spec", "specify", "lock", "define requirements", "EARS",
  "acceptance criteria", "traceability". Output: SPEC.md with falsifiable
  requirements, acceptance matrix, verification methods, and a Handoff Packet for
  the next phase. Pattern 3 Process — multi-step workflow with explicit gates.
  Tech-agnostic + stack-agnostic. NOT for exploratory coding (refuse without a
  stable source), NOT for RED/GREEN/REFACTOR execution (load `hm-test-driven-execution`
  after spec is locked), NOT for orchestrating which spec to write (load
  `hm-coord-router`).
metadata:
  consumed-by:
    - "hm-specifier"
    - "hm-planner"
    - "hm-architect"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P3-Process"
  realm: "spec,test,doc,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - hivemind-doc
  - hivemind-agent-work
---

# Spec Authoring

Turn written intent into a falsifiable implementation contract. This skill owns
spec intake, ambiguity rejection, requirement extraction, acceptance-test
derivation, and handoff evidence. It does **not** execute TDD cycles; once
requirements and acceptance tests are locked, hand off to
`hm-test-driven-execution` (or whatever TDD skill is in the loaded bundle).

## When This Skill Loads — Do This First

1. **Verify a source artifact exists.** PRD, SPEC, ADR, user story, API
   contract, acceptance brief, or explicit user request. If no source
   truth, refuse: "I cannot spec without a source. Provide a PRD, ADR,
   user story, or acceptance brief."
2. **Identify the intended reader.** Who consumes the spec? Implementer?
   Reviewer? Test runner? The audience determines the level of detail.
3. **Run ambiguity checks.** Use the 5-check rubric in `references/spec-vs-design-distinction.md`.
4. **If exploratory only**, return BLOCKED with the request: "Need a stable
   requirement source before I can derive REQ-* items."

## Entry Gate

Proceed only when at least one source artifact exists. Before authoring:

1. Identify the source artifact and intended reader.
2. Run `prompt-skim` (if available) to detect length, URLs, missing files,
   and candidate scope.
3. Run `prompt-analyze` (if available) to detect contradiction, vagueness,
   missing actors, missing success criteria, hidden scope.
4. If tools unavailable, perform same checks manually and state that the
   tool was unavailable.

## Spec-Lock Workflow (5 gates, do not skip)

```text
Source Audit → Ambiguity Gate → Requirement Table → Acceptance Test Matrix → Handoff Packet
```

### Gate 1: Source Audit

Create an audit note with:
- Source path or pasted source title
- Date/time of review
- Stakeholders or actors named by the source
- Explicit MUST/SHOULD/MAY statements
- Implicit requirements inferred from security, data integrity,
  accessibility, or operational correctness
- Out-of-scope statements

Record provenance in the format from
`templates/requirement-traceability-matrix.md`. Every REQ row must point back
to a source quote, source section, or blocked missing source.

### Gate 2: Ambiguity Gate

Run the 5 ambiguity checks. If ANY fails, refuse the spec and return
BLOCKED with the specific failures:

1. **Actors named?** If the source has no actor (user, system, admin), the
   requirement is incomplete. Reject.
2. **Trigger event named?** Every REQ must have a trigger ("when X happens,
   Y does Z"). If no trigger, reject.
3. **Observable outcome specified?** Each REQ must end with a falsifiable
   outcome. If outcome is "should work well" or "should be fast", reject
   as unfalsifiable.
4. **Scope bounded?** If the source does not state what's out of scope, ask.
5. **Success criteria named?** If "done" is not defined, reject.

### Gate 3: Requirement Table

Use EARS (Easy Approach to Requirements Syntax) — 5 patterns:

| Pattern | Form | Example |
|---|---|---|
| **Ubiquitous** | The `<system>` shall `<action>` | The auth service shall hash passwords with bcrypt. |
| **Event-driven** | When `<trigger>`, the `<system>` shall `<action>` | When a user submits the login form, the auth service shall validate credentials within 200ms. |
| **State-driven** | While `<state>`, the `<system>` shall `<action>` | While the user is unauthenticated, the API shall return 401 for protected routes. |
| **Unwanted behavior** | If `<condition>`, the `<system>` shall `<action>` | If the JWT is expired, the system shall return 401 and clear the session cookie. |
| **Optional** | Where `<feature>`, the `<system>` shall `<action>` | Where 2FA is enabled, the system shall require a TOTP token in addition to the password. |

Each REQ row in the table: `REQ-NNN | pattern | statement | source-ref | realm | verification-method`.

### Gate 4: Acceptance Test Matrix

For each REQ, derive at least one acceptance test. Use BDD framing:
`Given <precondition>, When <trigger>, Then <observable outcome>`.

The matrix row: `REQ-NNN | acceptance-test-name | preconditions | steps | expected outcome | type (unit|integration|e2e)`.

### Gate 5: Handoff Packet

The Handoff Packet is the deliverable. It includes:
- The SPEC.md (with all 4 prior gates)
- The Requirement Traceability Matrix
- The Acceptance Test Matrix
- A 1-page "What changes for the implementer" summary
- A list of risks/open questions for the next phase

## Boundary Rules

| Nearby workflow | Boundary |
|---|---|
| `hm-test-driven-execution` | Consumes locked requirements and executes RED/GREEN/REFACTOR. This skill DERIVES the requirements; it does not execute. |
| `hm-coord-router` | Decides WHICH spec to write (intent classification). This skill DOES the spec authoring. |
| `hm-arch-decision` (when created) | ADR for high-level design choices. This skill locks the WHAT and HOW-TO-VERIFY. |
| Generic planning | Plans sequence work. This skill locks what must be true. |
| Exploratory coding | Not enough source truth. Return BLOCKED. |

## Output Format (SPEC.md template)

Use `templates/SPEC-template.md`. The SPEC.md has 8 sections:

1. Source provenance (paths, dates, actors)
2. Out-of-scope statement
3. Requirement table (EARS rows)
4. Acceptance test matrix
5. Acceptance criteria by realm (spec/test/doc/arch/clean-code)
6. Verification methods (per REQ)
7. Open questions / risks
8. Handoff summary (1 page)

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Spec without a source | Inventing requirements = guessing | Refuse without PRD/ADR/user story |
| EARS pattern mismatch | Wrong pattern → wrong test derivability | Use the right one of 5 (see Gate 3 table) |
| "Should be fast" / "should work well" | Unfalsifiable | Replace with measurable: "<200ms p99" |
| Skipping the ambiguity gate | Hidden contradictions surface in TDD cycle | Always run all 5 checks |
| Spec without traceability | Can't defend decisions in review | Every REQ cites source |
| Spec without acceptance test | No way to verify "done" | Derive ≥1 test per REQ |
| Mixing WHAT and HOW | Spec drifts into design | WHAT = REQ; HOW = design doc |
| Output without handoff packet | Next agent re-discovers context | Always include the 1-page summary |

## Additional Resources

### Reference Files (load on demand)
- **`references/ears-notation.md`** — full EARS specification with 5 patterns + examples
- **`references/acceptance-criteria-patterns.md`** — BDD, Given-When-Then, test derivation
- **`references/spec-vs-design-distinction.md`** — what belongs in spec vs design vs plan
- **`references/source-synthesis.md`** — when source has multiple contradictory statements
- **`references/spec-to-req-mapping.md`** — how to go from prose to EARS rows
- **`references/acceptance-test-patterns.md`** — common test patterns per realm

### Templates (fillable)
- **`templates/SPEC-template.md`** — the 8-section SPEC.md template
- **`templates/requirement-traceability-matrix.md`** — REQ-to-source traceability grid

### Workflows
- **`workflows/spec-lock-workflow.md`** — 5-gate sequence with checklist

### Scripts (executable)
- **`scripts/validate-spec-falsifiability.sh`** — checks all REQs end with measurable outcomes
- **`scripts/validate-rich-package.sh`** — full bundle validation (SKILL.md + references + templates + scripts)
- **`scripts/validate-skill.sh`** — SKILL.md schema + frontmatter validation

### Evaluation
- **`evals/evals.json`** — 5 spec-authoring test cases (PRD → expected REQs)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-coord-router` | Routes here when intent class is `spec` |
| `hm-test-driven-execution` | Consumes the Handoff Packet and runs RED-GREEN-REFACTOR |
| `hm-arch-decision` | For high-impact design choices, this skill locks the REQ; `hm-arch-decision` writes the ADR |
| `hm-product-validation` | When the spec is for a new feature, validate with RICE first |
| `hm-intent-brainstorm` | When the source is too vague, brainstorm before authoring |

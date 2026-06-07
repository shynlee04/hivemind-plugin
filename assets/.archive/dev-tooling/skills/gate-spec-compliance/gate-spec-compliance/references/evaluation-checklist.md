# Evaluation Checklist

Per-dimension audit criteria for spec compliance evaluation. Use alongside `perspective-rubrics.md` for contextual weighting.

## Dimension 1: Spec-to-Code Traceability

### Forward Trace (Requirement → Implementation)

- [ ] Every REQ-ID in SPEC.md has a corresponding code artifact
- [ ] Each requirement's implementation is discoverable via grep for REQ-ID in code comments or mapping table
- [ ] Implementation artifacts are in the locations specified by PLAN.md
- [ ] No requirement maps to a deleted or moved file without an updated mapping

### Backward Trace (Implementation → Requirement)

- [ ] Every code file in scope has a traceable requirement origin
- [ ] No code artifact exists without a SPEC.md, PLAN.md, or ADR reference
- [ ] Utility/helper code without direct SPEC mapping is documented as cross-cutting infrastructure
- [ ] Dead code (no caller, no test, no SPEC reference) is flagged for removal

### Traceability Matrix Integrity

- [ ] Matrix covers 100% of locked requirements
- [ ] Matrix was updated after last code change
- [ ] Matrix timestamps are within current sprint/phase
- [ ] No matrix cell contains "TBD" or "TODO" for locked requirements

## Dimension 2: Interface Contract Verification

### Signature Matching

- [ ] Every public function/class method signature matches SPEC documentation
- [ ] Parameter types match documented types (TypeScript type compatibility)
- [ ] Return types match documented return types
- [ ] Error types match documented error taxonomy
- [ ] Optional vs required parameters match SPEC specification

### API Surface

- [ ] Exported API surface matches SPEC API section exactly
- [ ] No undocumented exports exist on public surfaces
- [ ] Configuration interfaces match documented configuration schema
- [ ] Event names and payloads match documented event contracts

### Type System Compliance

- [ ] Zod schemas match SPEC data models (where applicable)
- [ ] TypeScript interfaces match SPEC type definitions
- [ ] Enum values match SPEC enumerated types
- [ ] No `any` types on interface boundaries (project style rule)

## Dimension 3: Behavioral Compliance

### Runtime Behavior vs Spec Success Criteria

- [ ] For each SPEC success criterion, a test demonstrates the expected behavior
- [ ] Tests exercise the actual code path (not mocks that bypass implementation)
- [ ] Edge cases from SPEC are covered (empty input, max values, error states)
- [ ] Observable outputs (logs, events, state changes) match SPEC descriptions

### State Transitions

- [ ] State machine transitions match SPEC state diagram (if applicable)
- [ ] Invalid state transitions are rejected as SPEC requires
- [ ] State persistence behavior matches SPEC durability requirements
- [ ] Concurrent state access behavior matches SPEC concurrency model

### Error Handling

- [ ] Error conditions from SPEC trigger documented error responses
- [ ] Error messages contain information specified by SPEC
- [ ] Recovery behavior matches SPEC recovery procedures
- [ ] No swallowed errors that SPEC requires to be surfaced

## Dimension 4: Acceptance Criteria Validation

### EARS Compliance

- [ ] Each AC follows an EARS template (ubiquitous, state-driven, event-driven, unwanted, optional, complex)
- [ ] GIVEN precondition is observable and testable
- [ ] WHEN trigger is specific and repeatable
- [ ] THEN outcome is measurable with defined metric
- [ ] MEASURE method exists and is executable
- [ ] PASS criteria have specific thresholds (not "works correctly")
- [ ] FAIL criteria have specific conditions (not "doesn't work")

### AC Coverage

- [ ] Every locked requirement has at least one AC
- [ ] Positive path AC exists for every requirement
- [ ] Negative path AC exists for error-handling requirements
- [ ] Boundary AC exists for requirements with numeric/range constraints
- [ ] Integration AC exists for cross-component requirements

### AC Verifiability

- [ ] Each AC has a runnable verification command or manual test procedure
- [ ] Verification commands reference existing test files (not aspirational)
- [ ] Verification output produces clear pass/fail signal
- [ ] No AC relies solely on human judgment without measurable criteria

## Dimension 5: Gap Detection

### Gap Classification

- [ ] SPEC-WITHOUT-CODE gaps identified (HIGH severity)
- [ ] CODE-WITHOUT-SPEC gaps identified (MEDIUM severity)
- [ ] SPEC-WITHOUT-TEST gaps identified (HIGH severity)
- [ ] TEST-WITHOUT-SPEC gaps identified (LOW severity)

### Gap Resolution Status

- [ ] Each HIGH severity gap has a resolution plan or blocking reason
- [ ] Each MEDIUM severity gap is documented for architectural review
- [ ] No HIGH severity gap is marked "accepted" without explicit user approval
- [ ] Gap count trend is decreasing (not increasing) over successive evaluations

### Orphan Detection

- [ ] No orphan SPEC requirements (no code, no test, no plan task)
- [ ] No orphan code files (no SPEC, no plan task, no test)
- [ ] No orphan tests (no SPEC requirement linkage)
- [ ] No orphan plan tasks (no SPEC requirement, no code artifact)

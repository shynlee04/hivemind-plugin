# Adopted Patterns

Synthesized compliance patterns from DO-178C traceability standards, EARS requirement templates, and Trail of Bits spec-to-code-compliance methodology. Adapted for Hivemind GSD pipeline artifacts.

## Pattern 1: Bidirectional Traceability (DO-178C)

**Source:** DO-178C (Software Considerations in Airborne Systems), Section 6.3
**Adopt decision:** Adopt bidirectional sweep discipline; adapt away from aerospace-specific artifact names.
**Local transformation:** Map DO-178C artifacts to GSD pipeline artifacts.

| DO-178C Artifact | GSD Pipeline Equivalent |
|------------------|------------------------|
| Software Requirements Data | SPEC.md |
| Design Description | PLAN.md + architecture docs |
| Source Code | Implementation files in code root |
| Test Cases | Test files in test root |
| Test Results | Test runner output |
| Traceability Data | RTM in planning directory or compliance report |

> **Project-to-Project Adaptation (RICH-6):** The "GSD Pipeline Equivalent" column uses generic artifact names (SPEC.md, PLAN.md, code root, test root). These are NOT hardcoded paths — they are logical artifact roles. The gate auto-detects code and test roots from the calling workflow's provided paths. Adapt the mapping table to your project's artifact structure: if your code lives in `src/`, `lib/`, `app/`, or a monorepo package, supply that path as the `CODE_ROOT` argument. If your tests live in `tests/`, `spec/`, `__tests__/`, or co-located `*.test.ts` files, supply that as the `TEST_ROOT`. The skill does not assume `src/` or `tests/` — the calling workflow or user provides those paths.

### Traceability Rules

1. **Forward trace (req → impl):** Every requirement in SPEC.md traces forward through PLAN.md task to implementation code artifact to test case.
2. **Backward trace (impl → req):** Every code artifact traces backward through PLAN.md task to SPEC.md requirement.
3. **Completeness rule:** Both directions must cover 100% of locked requirements. Orphan artifacts in either direction require documentation.

### V-Model Mapping for GSD Pipeline

```text
PROJECT.md (vision)
    │
    ▼
ROADMAP.md (phases, milestones)
    │
    ▼
SPEC.md (requirements per phase)
    │
    ▼
PLAN.md (tasks per phase)
    │         ╲
    ▼           ▼
Implementation ← → Tests
    │           ╱
    ▼         ╱
UAT / Verification
    │
    ▼
Compliance Report
```

The V-Model maps verification activities to their corresponding specification level. Unit tests verify implementation-level requirements. Integration tests verify component interface requirements. UAT verifies stakeholder-facing acceptance criteria.

## Pattern 2: EARS Templates (Easy Approach to Requirements Syntax)

**Source:** Alistair Mavin et al., "Easy Approach to Requirements Syntax"
**Adopt decision:** Adopt EARS templates for acceptance criteria validation; adapt to check existing ACs rather than author new ones.
**Local transformation:** Use EARS patterns as a validation checklist for acceptance criteria.

### Template Catalog

| EARS Type | Template | Use When |
|-----------|----------|----------|
| Ubiquitous | "The system shall `<response>`" | Requirement always applies |
| State-driven | "While `<precondition>`, the system shall `<response>`" | Requirement applies in specific state |
| Event-driven | "When `<trigger>`, the system shall `<response>`" | Requirement triggered by event |
| Unwanted | "If `<trigger>`, then the system shall `<response>`" | Requirement handles failure/error |
| Optional | "Where `<feature>`, the system shall `<response>`" | Requirement is feature-gated |
| Complex | "While `<precondition>`, when `<trigger>`, the system shall `<response>`" | Combined conditions |

### Validation Rules

1. Each acceptance criterion must match at least one EARS template.
2. Extract `<response>`, `<precondition>`, `<trigger>`, and `<feature>` placeholders.
3. Each placeholder must contain specific, measurable content — not vague terms.
4. The response must be observable: state change, event emission, output, or error.

## Pattern 3: Falsifiable Acceptance Criteria

**Source:** Synthesized from Gherkin BDD patterns, EARS, and Trail of Bits spec-to-code methodology.
**Adopt decision:** Adopt GIVEN/WHEN/THEN structure with MEASURE/PASS/FAIL extensions.
**Local transformation:** Hivemind-specific acceptance criteria format.

### AC Template

```markdown
AC-[REQ-ID]-[nn]: [EARS-formatted requirement]
  GIVEN: [precondition state — must be observable]
  WHEN: [trigger/action — must be repeatable]
  THEN: [expected observable outcome — must be measurable]
  MEASURE: [how to verify — command, test, or inspection method]
  PASS: [specific pass criteria — numeric threshold or exact match]
  FAIL: [specific fail criteria — what constitutes failure]
```

### Validation Checklist

- [ ] GIVEN describes a machine-verifiable state
- [ ] WHEN describes a repeatable action
- [ ] THEN describes an observable outcome
- [ ] MEASURE references an existing tool, command, or procedure
- [ ] PASS has a specific threshold (not "works correctly")
- [ ] FAIL has a specific condition (not "doesn't work")
- [ ] No placeholders remain (TBD, TODO, FIXME)

## Pattern 4: Gap Detection Algorithm

**Source:** Adapted from Trail of Bits `spec-to-code-compliance` skill and ISO 26262 gap analysis.
**Adopt decision:** Adopt four-gap-type taxonomy; adapt detection to GSD artifact chain.
**Local transformation:** Use SPEC.md → PLAN.md → code → test chain as detection path.

### Algorithm Steps

```text
1. Parse SPEC.md → extract REQ-ID list with descriptions
2. Parse PLAN.md → extract task list with requirement references
3. Scan code directory → extract code artifact list
4. Scan test directory → extract test case list with requirement references
5. Forward sweep (SPEC → PLAN → CODE → TEST):
   For each REQ-ID:
     - Find PLAN task referencing this REQ-ID → missing = SPEC-WITHOUT-PLAN
     - Find code file referenced by PLAN task → missing = SPEC-WITHOUT-CODE
     - Find test file referencing this REQ-ID → missing = SPEC-WITHOUT-TEST
6. Backward sweep (CODE → SPEC):
   For each code file in scope:
     - Find REQ-ID origin in SPEC → missing = CODE-WITHOUT-SPEC
7. Backward sweep (TEST → SPEC):
   For each test file:
     - Find REQ-ID reference → missing = TEST-WITHOUT-SPEC
8. Produce gap matrix with severity classification
```

### Severity Classification

| Gap Type | Severity | Blocking |
|----------|----------|----------|
| SPEC-WITHOUT-CODE | HIGH | Yes — blocks PASS |
| CODE-WITHOUT-SPEC | MEDIUM | No — document and review |
| SPEC-WITHOUT-TEST | HIGH | Yes — blocks PASS |
| TEST-WITHOUT-SPEC | LOW | No — document only |

## Pattern 5: Compliance Report Evidence Hierarchy

**Source:** Adapted from IEC 62304 evidence requirements and Trail of Bits audit methodology.
**Adopt decision:** Adopt evidence hierarchy for compliance report entries.
**Local transformation:** Map to available Hivemind verification methods.

### Evidence Strength (strongest to weakest)

| Strength | Evidence Type | Example |
|----------|-------------|---------|
| Strongest | Automated test pass | `npm test` output showing green |
| Strong | Command output | `npm run typecheck` exit code 0 |
| Moderate | Code review approval | Approved PR from independent reviewer |
| Weak | Static analysis | Lint pass, coverage report |
| Weakest | Manual inspection | Developer reads code and confirms |
| Unacceptable | Verbal assertion | "I checked it" without evidence |

Compliance reports must include at least Strong evidence for HIGH severity requirements. Moderate or weaker evidence is acceptable only for LOW severity requirements.
